package org.example.kairos.model.response.billing;

import com.fasterxml.jackson.annotation.JsonInclude;

/** 当前订阅状态。无有效订阅时 isPro=false, plan="free", 时间字段为 null。 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class SubscriptionStatusResponse {
    /** 当前是否为 Pro 会员(expires_at>now) */
    private boolean isPro;
    /** 当前套餐: MONTHLY / ANNUAL / free */
    private String plan;
    /** 会员开始时间(ISO 字符串), 免费时为 null */
    private String startsAt;
    /** 会员到期时间(ISO 字符串), 免费时为 null */
    private String expiresAt;
    /** 是否自动续费, 本期固定 false */
    private boolean autoRenew;

    public boolean getIsPro() { return isPro; }
    public void setIsPro(boolean pro) { isPro = pro; }
    public String getPlan() { return plan; }
    public void setPlan(String plan) { this.plan = plan; }
    public String getStartsAt() { return startsAt; }
    public void setStartsAt(String startsAt) { this.startsAt = startsAt; }
    public String getExpiresAt() { return expiresAt; }
    public void setExpiresAt(String expiresAt) { this.expiresAt = expiresAt; }
    public boolean getAutoRenew() { return autoRenew; }
    public void setAutoRenew(boolean autoRenew) { this.autoRenew = autoRenew; }
}
