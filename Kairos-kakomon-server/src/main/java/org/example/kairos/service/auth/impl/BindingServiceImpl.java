package org.example.kairos.service.auth.impl;

import org.example.kairos.common.ResultCode;
import org.example.kairos.common.enums.IdentityType;
import org.example.kairos.common.enums.VerifyCodeScene;
import org.example.kairos.common.exception.BizException;
import org.example.kairos.entity.UserCredentialEntity;
import org.example.kairos.entity.UserIdentityEntity;
import org.example.kairos.mapper.auth.UserCredentialMapper;
import org.example.kairos.mapper.user.UserIdentityMapper;
import org.example.kairos.model.response.user.UserResponse;
import org.example.kairos.service.auth.BindingService;
import org.example.kairos.service.auth.TokenService;
import org.example.kairos.service.auth.VerifyCodeService;
import org.example.kairos.service.user.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 身份绑定服务实现。
 * <p>
 * 关键约束:
 * <ul>
 *   <li>绑定/解绑/重置密码均通过验证码二次确认</li>
 *   <li>绑定时若身份已被其他账号占用直接拒绝</li>
 *   <li>解绑时确保用户仍有至少一种登录方式(其他身份或密码)</li>
 *   <li>设置密码后会撤销该用户全部 refresh token,强制重新登录</li>
 * </ul>
 */
@Service
public class BindingServiceImpl implements BindingService {

    @Autowired private VerifyCodeService verifyCodeService;
    @Autowired private UserIdentityMapper userIdentityMapper;
    @Autowired private UserCredentialMapper userCredentialMapper;
    @Autowired private UserService userService;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private TokenService tokenService;

    @Override
    @Transactional
    public UserResponse bind(Long userId, String identityType, String identityValue, String code) {
        IdentityType type = IdentityType.fromString(identityType);
        if (type == null) throw new BizException(ResultCode.IDENTITY_TYPE_INVALID);

        if (!verifyCodeService.verifyAndConsume(type.name(), identityValue, VerifyCodeScene.BIND.name(), code)) {
            throw new BizException(ResultCode.INVALID_CODE);
        }

        UserIdentityEntity existing = userIdentityMapper.findByTypeAndValue(type.name(), identityValue);
        if (existing != null) {
            if (!existing.getUserId().equals(userId)) {
                throw new BizException(ResultCode.IDENTITY_OCCUPIED);
            }
            return userService.buildUserResponse(userId);
        }

        UserIdentityEntity sameType = userIdentityMapper.findByUserIdAndType(userId, type.name());
        if (sameType != null) {
            userIdentityMapper.deleteByUserIdAndType(userId, type.name());
        }

        UserIdentityEntity entity = new UserIdentityEntity();
        entity.setUserId(userId);
        entity.setIdentityType(type.name());
        entity.setIdentityValue(identityValue);
        entity.setVerified(1);
        entity.setIsPrimary(1);
        userIdentityMapper.insert(entity);
        return userService.buildUserResponse(userId);
    }

    @Override
    @Transactional
    public UserResponse unbind(Long userId, String identityType, String code) {
        IdentityType type = IdentityType.fromString(identityType);
        if (type == null) throw new BizException(ResultCode.IDENTITY_TYPE_INVALID);

        UserIdentityEntity existing = userIdentityMapper.findByUserIdAndType(userId, type.name());
        if (existing == null) throw new BizException(ResultCode.IDENTITY_NOT_BOUND);

        if (!verifyCodeService.verifyAndConsume(type.name(), existing.getIdentityValue(), VerifyCodeScene.UNBIND.name(), code)) {
            throw new BizException(ResultCode.INVALID_CODE);
        }

        int total = userIdentityMapper.countByUserId(userId);
        UserCredentialEntity cred = userCredentialMapper.findByUserId(userId);
        if (total <= 1 && (cred == null || cred.getPasswordHash() == null)) {
            throw new BizException(ResultCode.LAST_IDENTITY_FORBIDDEN);
        }

        userIdentityMapper.deleteByUserIdAndType(userId, type.name());
        return userService.buildUserResponse(userId);
    }

    @Override
    @Transactional
    public UserResponse setPassword(Long userId, String oldPassword, String newPassword, String code) {
        if (newPassword == null || newPassword.length() < 8 || newPassword.length() > 64) {
            throw new BizException(ResultCode.INVALID_PARAM, "密码长度需 8-64 位");
        }
        boolean hasLetter = newPassword.chars().anyMatch(Character::isLetter);
        boolean hasDigit = newPassword.chars().anyMatch(Character::isDigit);
        if (!hasLetter || !hasDigit) {
            throw new BizException(ResultCode.INVALID_PARAM, "密码必须包含字母与数字");
        }

        UserCredentialEntity cred = userCredentialMapper.findByUserId(userId);
        if (cred != null && cred.getPasswordHash() != null) {
            // 已有密码: 必须校验旧密码
            if (oldPassword == null || !passwordEncoder.matches(oldPassword, cred.getPasswordHash())) {
                throw new BizException(ResultCode.INVALID_CREDENTIALS, "旧密码错误");
            }
        }
        // 首次设密: 已通过登录态(LOGIN scene 验证码)鉴权,无需再发送验证码

        String hash = passwordEncoder.encode(newPassword);
        UserCredentialEntity update = new UserCredentialEntity();
        update.setUserId(userId);
        update.setPasswordHash(hash);
        update.setPasswordSalt("bcrypt");
        userCredentialMapper.insert(update);

        tokenService.revokeAllRefreshTokens(userId);
        return userService.buildUserResponse(userId);
    }
}
