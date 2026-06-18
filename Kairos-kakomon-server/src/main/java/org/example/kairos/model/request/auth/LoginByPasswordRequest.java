package org.example.kairos.model.request.auth;

import jakarta.validation.constraints.NotBlank;

/**
 * 密码登录请求体。
 * 连续失败 5 次后账号锁定 10 分钟(配置见 {@link org.example.kairos.config.PasswordProperties})。
 */
public class LoginByPasswordRequest {
    /** 身份类型: PHONE 或 EMAIL */
    @NotBlank
    private String identityType;
    /** 身份值: 手机号或邮箱 */
    @NotBlank
    private String identityValue;
    /** 明文密码,经 BCrypt 校验后丢弃 */
    @NotBlank
    private String password;
    /** 设备 ID */
    private String deviceId;

    public String getIdentityType() { return identityType; }
    public void setIdentityType(String identityType) { this.identityType = identityType; }
    public String getIdentityValue() { return identityValue; }
    public void setIdentityValue(String identityValue) { this.identityValue = identityValue; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    public String getDeviceId() { return deviceId; }
    public void setDeviceId(String deviceId) { this.deviceId = deviceId; }
}
