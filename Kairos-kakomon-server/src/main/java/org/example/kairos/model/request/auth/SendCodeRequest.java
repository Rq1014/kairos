package org.example.kairos.model.request.auth;

import jakarta.validation.constraints.NotBlank;

/**
 * 发送验证码请求体。
 * 业务规则: 同一身份 60 秒内只能重发一次,当日上限 10 次。
 */
public class SendCodeRequest {
    /** 身份类型: PHONE 或 EMAIL */
    @NotBlank(message = "identityType不能为空")
    private String identityType;
    /** 身份值: 手机号或邮箱 */
    @NotBlank(message = "identityValue不能为空")
    private String identityValue;
    /** 业务场景: LOGIN / BIND / UNBIND / RESET_PASSWORD */
    @NotBlank(message = "scene不能为空")
    private String scene;

    public String getIdentityType() { return identityType; }
    public void setIdentityType(String identityType) { this.identityType = identityType; }
    public String getIdentityValue() { return identityValue; }
    public void setIdentityValue(String identityValue) { this.identityValue = identityValue; }
    public String getScene() { return scene; }
    public void setScene(String scene) { this.scene = scene; }
}
