package org.example.kairos.service.auth.impl;

import org.example.kairos.common.ResultCode;
import org.example.kairos.common.constant.CacheKeys;
import org.example.kairos.common.enums.IdentityType;
import org.example.kairos.common.enums.VerifyCodeScene;
import org.example.kairos.common.exception.BizException;
import org.example.kairos.config.PasswordProperties;
import org.example.kairos.entity.LoginAuditEntity;
import org.example.kairos.entity.UserCredentialEntity;
import org.example.kairos.entity.UserEntity;
import org.example.kairos.entity.UserIdentityEntity;
import org.example.kairos.mapper.auth.LoginAuditMapper;
import org.example.kairos.mapper.auth.UserCredentialMapper;
import org.example.kairos.mapper.user.UserIdentityMapper;
import org.example.kairos.mapper.user.UserMapper;
import org.example.kairos.model.response.auth.LoginResponse;
import org.example.kairos.service.auth.LoginService;
import org.example.kairos.service.auth.TokenService;
import org.example.kairos.service.auth.VerifyCodeService;
import org.example.kairos.service.user.UserService;
import org.slf4j.MDC;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * 登录服务实现。
 * <p>
 * 关键流程:
 * <ul>
 *   <li>验证码登录: 校验码 → 找/建用户身份 → 签发 token → 写审计</li>
 *   <li>密码登录: 校验失败计数 → 校验密码 → 失败累加锁定/成功清零 → 签发 token</li>
 *   <li>刷新: 校验消费 refresh token → 重签新 access+refresh(滚动)</li>
 *   <li>登出: access token 进黑名单 + 删除 refresh token(单端或全端)</li>
 * </ul>
 * 所有登录尝试(成功/失败)都会写入 login_audit 表,用于安全审计。
 */
@Service
public class LoginServiceImpl implements LoginService {

    @Autowired private VerifyCodeService verifyCodeService;
    @Autowired private TokenService tokenService;
    @Autowired private UserMapper userMapper;
    @Autowired private UserIdentityMapper userIdentityMapper;
    @Autowired private UserCredentialMapper userCredentialMapper;
    @Autowired private LoginAuditMapper loginAuditMapper;
    @Autowired private UserService userService;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private PasswordProperties pwdProps;
    @Autowired private StringRedisTemplate redis;

    @Override
    @Transactional
    public LoginResponse loginByCode(String identityType, String identityValue, String code,
                                     String deviceId, String clientIp, String userAgent) {
        IdentityType type = IdentityType.fromString(identityType);
        if (type == null) throw new BizException(ResultCode.IDENTITY_TYPE_INVALID);

        boolean ok = verifyCodeService.verifyAndConsume(type.name(), identityValue, VerifyCodeScene.LOGIN.name(), code);
        if (!ok) {
            audit(null, type.name(), identityValue, "CODE", 0, "INVALID_CODE", clientIp, userAgent, deviceId);
            throw new BizException(ResultCode.INVALID_CODE);
        }

        UserIdentityEntity identity = userIdentityMapper.findByTypeAndValue(type.name(), identityValue);
        boolean isNew = identity == null;
        Long userId;
        if (isNew) {
            userId = userService.createUser(type.name());
            UserIdentityEntity newIdentity = new UserIdentityEntity();
            newIdentity.setUserId(userId);
            newIdentity.setIdentityType(type.name());
            newIdentity.setIdentityValue(identityValue);
            newIdentity.setVerified(1);
            newIdentity.setIsPrimary(1);
            userIdentityMapper.insert(newIdentity);
        } else {
            userId = identity.getUserId();
            userIdentityMapper.updateLastLoginAt(identity.getId());
        }

        UserEntity user = userMapper.findById(userId);
        return issueTokens(user, isNew, type.name(), identityValue, "CODE", clientIp, userAgent, deviceId);
    }

    @Override
    @Transactional
    public LoginResponse loginByPassword(String identityType, String identityValue, String password,
                                         String deviceId, String clientIp, String userAgent) {
        IdentityType type = IdentityType.fromString(identityType);
        if (type == null) throw new BizException(ResultCode.IDENTITY_TYPE_INVALID);

        UserIdentityEntity identity = userIdentityMapper.findByTypeAndValue(type.name(), identityValue);
        if (identity == null) {
            audit(null, type.name(), identityValue, "PASSWORD", 0, "USER_NOT_FOUND", clientIp, userAgent, deviceId);
            throw new BizException(ResultCode.USER_NOT_FOUND);
        }
        Long userId = identity.getUserId();

        String failKey = CacheKeys.loginFail(type.name(), identityValue);
        String failStr = redis.opsForValue().get(failKey);
        int failCount = failStr == null ? 0 : Integer.parseInt(failStr);
        if (failCount >= pwdProps.getMaxFailedCount()) {
            throw new BizException(ResultCode.ACCOUNT_LOCKED);
        }

        UserCredentialEntity cred = userCredentialMapper.findByUserId(userId);
        if (cred == null || cred.getPasswordHash() == null) {
            audit(userId, type.name(), identityValue, "PASSWORD", 0, "PASSWORD_NOT_SET", clientIp, userAgent, deviceId);
            throw new BizException(ResultCode.PASSWORD_NOT_SET);
        }

        if (!passwordEncoder.matches(password, cred.getPasswordHash())) {
            int next = failCount + 1;
            redis.opsForValue().set(failKey, String.valueOf(next), Duration.ofMinutes(pwdProps.getLockMinutes()));
            audit(userId, type.name(), identityValue, "PASSWORD", 0, "INVALID_CREDENTIALS", clientIp, userAgent, deviceId);
            throw new BizException(ResultCode.INVALID_CREDENTIALS,
                    String.format("密码错误，剩余 %d 次", Math.max(0, pwdProps.getMaxFailedCount() - next)));
        }

        redis.delete(failKey);
        userCredentialMapper.resetFailedCount(userId);
        userIdentityMapper.updateLastLoginAt(identity.getId());
        UserEntity user = userMapper.findById(userId);
        return issueTokens(user, false, type.name(), identityValue, "PASSWORD", clientIp, userAgent, deviceId);
    }

    @Override
    public LoginResponse refresh(String refreshToken) {
        Long userId = tokenService.validateAndConsumeRefreshToken(refreshToken);
        if (userId == null) throw new BizException(ResultCode.UNAUTHORIZED, "refresh token 无效");
        UserEntity user = userMapper.findById(userId);
        if (user == null) throw new BizException(ResultCode.USER_NOT_FOUND);
        return issueTokens(user, false, null, null, "REFRESH", null, null, null);
    }

    @Override
    public void logout(Long userId, String jti, String refreshTokenJti, boolean all, long remainingSeconds) {
        if (jti != null) {
            tokenService.revokeAccessToken(jti, remainingSeconds);
        }
        if (all) {
            tokenService.revokeAllRefreshTokens(userId);
        } else if (refreshTokenJti != null) {
            tokenService.revokeRefreshToken(userId, refreshTokenJti);
        }
    }

    @Override
    public boolean isRegistered(String identityType, String identityValue) {
        IdentityType type = IdentityType.fromString(identityType);
        if (type == null) return false;
        return userIdentityMapper.findByTypeAndValue(type.name(), identityValue) != null;
    }

    private LoginResponse issueTokens(UserEntity user, boolean isNew,
                                      String identityType, String identityValue,
                                      String loginMethod, String clientIp, String userAgent, String deviceId) {
        String jti = UUID.randomUUID().toString().replace("-", "");
        String accessToken = tokenService.issueAccessToken(user.getId(), user.getUserNo(), jti);
        String refreshToken = tokenService.issueRefreshToken(user.getId());
        if (identityType != null) {
            audit(user.getId(), identityType, identityValue, loginMethod, 1, null, clientIp, userAgent, deviceId);
        }
        LoginResponse resp = new LoginResponse();
        resp.setAccessToken(accessToken);
        resp.setRefreshToken(refreshToken);
        resp.setExpiresIn(tokenService.getAccessTtlSeconds());
        resp.setIsNew(isNew);
        resp.setUser(userService.buildUserResponse(user.getId()));
        return resp;
    }

    /** 记录登录审计;失败时静默忽略,避免影响登录主流程 */
    private void audit(Long userId, String type, String value, String method, int success,
                       String failReason, String clientIp, String userAgent, String deviceId) {
        try {
            LoginAuditEntity a = new LoginAuditEntity();
            a.setUserId(userId);
            a.setIdentityType(type);
            a.setIdentityValue(value);
            a.setLoginMethod(method);
            a.setSuccess(success);
            a.setFailReason(failReason);
            a.setClientIp(clientIp);
            a.setUserAgent(userAgent);
            a.setDeviceId(deviceId);
            a.setTraceId(MDC.get("traceId"));
            loginAuditMapper.insert(a);
        } catch (Exception ignore) { }
    }
}
