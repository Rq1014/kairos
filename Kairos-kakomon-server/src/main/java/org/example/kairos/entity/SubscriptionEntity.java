package org.example.kairos.entity;

import java.time.LocalDateTime;

/** 订阅实体,对应 subscription 表。会员权益真相,一个用户维护一行当前订阅。 */
public class SubscriptionEntity {
    /** 主键 */
    private Long id;
    /** 所属用户 ID */
    private Long userId;
    /** 最近一次开通/续费的套餐: MONTHLY / ANNUAL */
    private String plan;
    /** 会员开始时间 */
    private LocalDateTime startsAt;
    /** 会员到期时间(真相字段) */
    private LocalDateTime expiresAt;
    /** 冗余状态: ACTIVE / EXPIRED */
    private String status;
    /** 最近一次写入该订阅的订单号 */
    private String sourceOrderNo;
    /** 创建时间 */
    private LocalDateTime createdAt;
    /** 更新时间 */
    private LocalDateTime updatedAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public String getPlan() { return plan; }
    public void setPlan(String plan) { this.plan = plan; }
    public LocalDateTime getStartsAt() { return startsAt; }
    public void setStartsAt(LocalDateTime startsAt) { this.startsAt = startsAt; }
    public LocalDateTime getExpiresAt() { return expiresAt; }
    public void setExpiresAt(LocalDateTime expiresAt) { this.expiresAt = expiresAt; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getSourceOrderNo() { return sourceOrderNo; }
    public void setSourceOrderNo(String sourceOrderNo) { this.sourceOrderNo = sourceOrderNo; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
