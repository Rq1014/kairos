package org.example.kairos.model.response.billing;

import com.fasterxml.jackson.annotation.JsonInclude;

/** 商品(套餐)展示信息。价格/时长由后端权威下发。 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class PlanResponse {
    /** 套餐标识: MONTHLY / ANNUAL */
    private String plan;
    /** 价格(分) */
    private int priceFen;
    /** 时长(天) */
    private int durationDays;
    /** 角标文案, 可空 */
    private String badge;

    public PlanResponse() {}

    public PlanResponse(String plan, int priceFen, int durationDays, String badge) {
        this.plan = plan;
        this.priceFen = priceFen;
        this.durationDays = durationDays;
        this.badge = badge;
    }

    public String getPlan() { return plan; }
    public void setPlan(String plan) { this.plan = plan; }
    public int getPriceFen() { return priceFen; }
    public void setPriceFen(int priceFen) { this.priceFen = priceFen; }
    public int getDurationDays() { return durationDays; }
    public void setDurationDays(int durationDays) { this.durationDays = durationDays; }
    public String getBadge() { return badge; }
    public void setBadge(String badge) { this.badge = badge; }
}
