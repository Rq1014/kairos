package org.example.kairos.entity;

import java.time.LocalDateTime;

/**
 * 登录审计实体,对应 login_audit 表。
 * <p>
 * 每次登录尝试(无论成功失败)都写入一条记录,
 * 用于安全审计、异常登录告警、合规要求等场景。
 */
public class LoginAuditEntity {
    /** 主键 ID */
    private Long id;
    /** 登录用户 ID,失败时(账号不存在)可为空 */
    private Long userId;
    /** 身份类型(PHONE/EMAIL/...) */
    private String identityType;
    /** 身份值(对敏感字段建议脱敏存储) */
    private String identityValue;
    /** 登录方式: password / code / wechat / apple / line */
    private String loginMethod;
    /** 是否成功,1=成功 0=失败 */
    private Integer success;
    /** 失败原因(success=0 时填写) */
    private String failReason;
    /** 客户端 IP */
    private String clientIp;
    /** User-Agent */
    private String userAgent;
    /** 设备 ID(从 X-Device-Id 头获取) */
    private String deviceId;
    /** 链路追踪 ID,可关联 ELK 日志 */
    private String traceId;
    /** 登录时间 */
    private LocalDateTime createdAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public String getIdentityType() { return identityType; }
    public void setIdentityType(String identityType) { this.identityType = identityType; }
    public String getIdentityValue() { return identityValue; }
    public void setIdentityValue(String identityValue) { this.identityValue = identityValue; }
    public String getLoginMethod() { return loginMethod; }
    public void setLoginMethod(String loginMethod) { this.loginMethod = loginMethod; }
    public Integer getSuccess() { return success; }
    public void setSuccess(Integer success) { this.success = success; }
    public String getFailReason() { return failReason; }
    public void setFailReason(String failReason) { this.failReason = failReason; }
    public String getClientIp() { return clientIp; }
    public void setClientIp(String clientIp) { this.clientIp = clientIp; }
    public String getUserAgent() { return userAgent; }
    public void setUserAgent(String userAgent) { this.userAgent = userAgent; }
    public String getDeviceId() { return deviceId; }
    public void setDeviceId(String deviceId) { this.deviceId = deviceId; }
    public String getTraceId() { return traceId; }
    public void setTraceId(String traceId) { this.traceId = traceId; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
