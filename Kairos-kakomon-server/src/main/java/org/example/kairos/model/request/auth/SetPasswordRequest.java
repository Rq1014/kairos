package org.example.kairos.model.request.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * 设置/修改密码请求体。
 * <ul>
 *   <li>已有密码场景: 必须传 oldPassword 校验</li>
 *   <li>无密码场景(首次设置): oldPassword 留空</li>
 *   <li>忘记密码重置: 通过 code 字段传验证码,跳过 oldPassword 校验</li>
 * </ul>
 */
public class SetPasswordRequest {
    /** 旧密码,有密码场景必填 */
    private String oldPassword;
    /** 新密码,8~64 位 */
    @NotBlank
    @Size(min = 8, max = 64, message = "密码长度需 8-64 位")
    private String newPassword;
    /** 重置密码场景下用于身份验证的验证码 */
    private String code;

    public String getOldPassword() { return oldPassword; }
    public void setOldPassword(String oldPassword) { this.oldPassword = oldPassword; }
    public String getNewPassword() { return newPassword; }
    public void setNewPassword(String newPassword) { this.newPassword = newPassword; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
}
