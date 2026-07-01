package org.example.kairos.model.response.billing;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.Map;

/** 下单结果。payParams 为按渠道伪造的支付参数。 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class OrderResponse {
    /** 订单号 */
    private String orderNo;
    /** 订单状态: PENDING / PAID / CANCELLED */
    private String status;
    /** 套餐 */
    private String plan;
    /** 支付渠道 */
    private String channel;
    /** 金额(分) */
    private int amountFen;
    /** 伪支付参数, 形如 {type, mockQr} 或 {type, mockTransactionId} */
    private Map<String, Object> payParams;

    public String getOrderNo() { return orderNo; }
    public void setOrderNo(String orderNo) { this.orderNo = orderNo; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getPlan() { return plan; }
    public void setPlan(String plan) { this.plan = plan; }
    public String getChannel() { return channel; }
    public void setChannel(String channel) { this.channel = channel; }
    public int getAmountFen() { return amountFen; }
    public void setAmountFen(int amountFen) { this.amountFen = amountFen; }
    public Map<String, Object> getPayParams() { return payParams; }
    public void setPayParams(Map<String, Object> payParams) { this.payParams = payParams; }
}
