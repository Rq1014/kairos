package org.example.kairos.model.response.user;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * 用户身份响应体(用于"我的"页展示绑定情况)。
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class IdentityResponse {
    /** 身份类型 */
    private String type;
    /** 身份值(敏感字段建议在前端做脱敏展示) */
    private String value;
    /** 是否已验证 */
    private boolean verified;
    /** 是否主身份 */
    private boolean isPrimary;
    /** 绑定时间(ISO-8601 字符串) */
    private String boundAt;

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getValue() { return value; }
    public void setValue(String value) { this.value = value; }
    public boolean isVerified() { return verified; }
    public void setVerified(boolean verified) { this.verified = verified; }
    public boolean getIsPrimary() { return isPrimary; }
    public void setIsPrimary(boolean primary) { isPrimary = primary; }
    public String getBoundAt() { return boundAt; }
    public void setBoundAt(String boundAt) { this.boundAt = boundAt; }
}
