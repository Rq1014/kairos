package org.example.kairos.entity;

import java.time.LocalDateTime;

/** 支付订单流水实体,对应 payment_order 表。每次购买尝试一行。 */
public class PaymentOrderEntity {
    /** 主键 */
    private Long id;
    /** 对外订单号, 形如 po_<时间戳><随机> */
    private String orderNo;
    /** 下单用户 ID */
    private Long userId;
    /** 套餐: MONTHLY / ANNUAL */
    private String plan;
    /** 支付渠道: WECHAT / ALIPAY / APPLE */
    private String channel;
    /** 金额(分) */
    private Integer amountFen;
    /** 订单状态: PENDING / PAID / CANCELLED */
    private String status;
    /** 伪支付参数(JSON 字符串) */
    private String mockPayParams;
    /** 确认支付时间 */
    private LocalDateTime paidAt;
    /** 创建时间 */
    private LocalDateTime createdAt;
    /** 更新时间 */
    private LocalDateTime updatedAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getOrderNo() { return orderNo; }
    public void setOrderNo(String orderNo) { this.orderNo = orderNo; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public String getPlan() { return plan; }
    public void setPlan(String plan) { this.plan = plan; }
    public String getChannel() { return channel; }
    public void setChannel(String channel) { this.channel = channel; }
    public Integer getAmountFen() { return amountFen; }
    public void setAmountFen(Integer amountFen) { this.amountFen = amountFen; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getMockPayParams() { return mockPayParams; }
    public void setMockPayParams(String mockPayParams) { this.mockPayParams = mockPayParams; }
    public LocalDateTime getPaidAt() { return paidAt; }
    public void setPaidAt(LocalDateTime paidAt) { this.paidAt = paidAt; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
