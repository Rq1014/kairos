package org.example.kairos.model.request.auth;

import jakarta.validation.constraints.NotBlank;

/**
 * 解绑身份请求体。
 * 业务规则: 解绑后用户必须保留至少一种登录方式,否则拒绝。
 */
public class UnbindIdentityRequest {
    /** 要解绑的身份类型 */
    @NotBlank
    private String identityType;
    /** 验证码,通过对原绑定身份发送验证码确认操作 */
    @NotBlank
    private String code;

    public String getIdentityType() { return identityType; }
    public void setIdentityType(String identityType) { this.identityType = identityType; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
}
