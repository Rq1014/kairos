package org.example.kairos.common.enums;

/** 订阅状态。ACTIVE/EXPIRED 仅作冗余标记,真相以 expires_at 实时比较为准。 */
public enum SubscriptionStatus {
    ACTIVE,
    EXPIRED
}
