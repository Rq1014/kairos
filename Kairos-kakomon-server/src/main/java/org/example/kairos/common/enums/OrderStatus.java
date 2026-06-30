package org.example.kairos.common.enums;

/** 支付订单状态。 */
public enum OrderStatus {
    /** 待支付(已下单未确认) */
    PENDING,
    /** 已支付 */
    PAID,
    /** 已取消(用户放弃支付) */
    CANCELLED
}
