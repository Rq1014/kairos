package org.example.kairos.service.auth;

import org.example.kairos.model.response.user.UserResponse;

/**
 * 身份绑定服务,提供绑定/解绑/设置密码能力。
 * <p>
 * 共用约束:
 * <ul>
 *   <li>需登录态调用</li>
 *   <li>关键操作均通过验证码二次确认</li>
 *   <li>解绑后必须保留至少一种登录方式</li>
 * </ul>
 */
public interface BindingService {
    /**
     * 绑定新身份(手机号/邮箱/三方)。
     *
     * @param userId        当前用户 ID
     * @param identityType  身份类型
     * @param identityValue 身份值
     * @param code          验证码(BIND 场景)
     * @return 更新后的用户聚合信息
     */
    UserResponse bind(Long userId, String identityType, String identityValue, String code);

    /**
     * 解绑身份;需保证用户至少还会留有一种登录方式。
     *
     * @param userId       当前用户 ID
     * @param identityType 要解绑的身份类型
     * @param code         验证码(UNBIND 场景)
     */
    UserResponse unbind(Long userId, String identityType, String code);

    /**
     * 设置或修改密码。
     *
     * @param userId      当前用户 ID
     * @param oldPassword 旧密码;首次设置时为空
     * @param newPassword 新密码,8~64 位
     * @param code        验证码(忘记密码重置时使用,跳过 oldPassword 校验)
     */
    UserResponse setPassword(Long userId, String oldPassword, String newPassword, String code);
}
