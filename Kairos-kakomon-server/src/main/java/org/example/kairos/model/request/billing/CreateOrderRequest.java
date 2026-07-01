package org.example.kairos.model.request.billing;

import jakarta.validation.constraints.NotBlank;

/** 下单请求体。 */
public class CreateOrderRequest {
    /** 套餐: MONTHLY / ANNUAL */
    @NotBlank
    private String plan;
    /** 支付渠道: WECHAT / ALIPAY / APPLE */
    @NotBlank
    private String channel;

    public String getPlan() { return plan; }
    public void setPlan(String plan) { this.plan = plan; }
    public String getChannel() { return channel; }
    public void setChannel(String channel) { this.channel = channel; }
}
