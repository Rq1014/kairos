package org.example.kairos.service.auth;

import org.example.kairos.model.response.auth.LoginResponse;

/**
 * 登录服务,提供验证码登录、密码登录、Token 刷新、登出能力。
 * <p>
 * 业务规则:
 * <ul>
 *   <li>验证码登录: 身份不存在时自动注册</li>
 *   <li>密码登录: 身份必须已存在,且必须已设置密码</li>
 *   <li>登录成功统一签发 access token + refresh token,并写入登录审计</li>
 * </ul>
 */
public interface LoginService {
    /**
     * 验证码登录(若身份不存在则自动注册新用户)。
     *
     * @param identityType  身份类型
     * @param identityValue 身份值
     * @param code          验证码
     * @param deviceId      设备 ID,可空
     * @param clientIp      客户端 IP
     * @param userAgent     User-Agent
     */
    LoginResponse loginByCode(String identityType, String identityValue, String code,
                              String deviceId, String clientIp, String userAgent);

    /**
     * 密码登录。
     *
     * @param password 明文密码,服务端用 BCrypt 校验
     */
    LoginResponse loginByPassword(String identityType, String identityValue, String password,
                                  String deviceId, String clientIp, String userAgent);

    /**
     * 通过 refresh token 刷新 access token,同时签发新的 refresh token(滚动刷新)。
     *
     * @return 新的 LoginResponse(accessToken/refreshToken/user 信息)
     */
    LoginResponse refresh(String refreshToken);

    /**
     * 登出。
     *
     * @param userId           用户 ID
     * @param jti              当前 access token 的 jti(将加入黑名单)
     * @param refreshTokenJti  当前 refresh token 的 jti
     * @param all              true=全端登出,false=仅当前端
     * @param remainingSeconds access token 剩余有效期(用于 Redis 黑名单 TTL)
     */
    void logout(Long userId, String jti, String refreshTokenJti, boolean all, long remainingSeconds);

    /** 检查身份是否已注册,前端用于"密码登录"按钮的可点状态 */
    boolean isRegistered(String identityType, String identityValue);
}
