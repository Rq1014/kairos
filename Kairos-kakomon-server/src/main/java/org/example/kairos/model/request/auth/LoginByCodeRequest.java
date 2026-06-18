package org.example.kairos.model.request.auth;

import jakarta.validation.constraints.NotBlank;

/**
 * 验证码登录请求体。
 * 若身份不存在则自动注册新用户。
 */
public class LoginByCodeRequest {
    /** 身份类型: PHONE 或 EMAIL */
    @NotBlank
    private String identityType;
    /** 身份值: 手机号或邮箱 */
    @NotBlank
    private String identityValue;
    /** 6 位数字验证码 */
    @NotBlank
    private String code;
    /** 设备 ID,用于风控与多端登录管理 */
    private String deviceId;
    /** 客户端版本号,用于灰度与最低版本兼容 */
    private String clientVersion;

    public String getIdentityType() { return identityType; }
    public void setIdentityType(String identityType) { this.identityType = identityType; }
    public String getIdentityValue() { return identityValue; }
    public void setIdentityValue(String identityValue) { this.identityValue = identityValue; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public String getDeviceId() { return deviceId; }
    public void setDeviceId(String deviceId) { this.deviceId = deviceId; }
    public String getClientVersion() { return clientVersion; }
    public void setClientVersion(String clientVersion) { this.clientVersion = clientVersion; }
}
