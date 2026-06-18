package org.example.kairos.model.request.auth;

import jakarta.validation.constraints.NotBlank;

/**
 * 绑定身份请求体(给当前用户新增手机号/邮箱/三方绑定)。
 * 业务规则: 该手机号/邮箱不能已被其他账号占用。
 */
public class BindIdentityRequest {
    /** 身份类型: PHONE / EMAIL / WECHAT / APPLE / LINE */
    @NotBlank
    private String identityType;
    /** 身份值: 手机号 / 邮箱 / 三方 openid */
    @NotBlank
    private String identityValue;
    /** 验证码,绑定 PHONE/EMAIL 时必填,绑定三方时通常为三方授权码 */
    @NotBlank
    private String code;

    public String getIdentityType() { return identityType; }
    public void setIdentityType(String identityType) { this.identityType = identityType; }
    public String getIdentityValue() { return identityValue; }
    public void setIdentityValue(String identityValue) { this.identityValue = identityValue; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
}
