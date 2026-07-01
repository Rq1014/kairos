package org.example.kairos.web.billing;

import jakarta.validation.Valid;
import org.example.kairos.common.Result;
import org.example.kairos.gateway.annotation.CurrentUser;
import org.example.kairos.gateway.annotation.PublicApi;
import org.example.kairos.model.bo.UserSession;
import org.example.kairos.model.request.billing.CreateOrderRequest;
import org.example.kairos.model.response.billing.OrderResponse;
import org.example.kairos.model.response.billing.PlanResponse;
import org.example.kairos.model.response.billing.SubscriptionStatusResponse;
import org.example.kairos.service.billing.BillingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 会员/支付接口(模拟支付)。
 * 下单 -> 确认支付两步; plans 公开, 其余需登录。
 */
@RestController
@RequestMapping("/api/billing")
public class BillingController {

    @Autowired private BillingService billingService;

    /** 套餐列表(公开)。 */
    @GetMapping("/plans")
    @PublicApi
    public Result<List<PlanResponse>> plans() {
        return Result.ok(billingService.listPlans());
    }

    /** 当前用户订阅状态。 */
    @GetMapping("/status")
    public Result<SubscriptionStatusResponse> status(@CurrentUser UserSession s) {
        return Result.ok(billingService.getStatus(s.getUserId()));
    }

    /** 下单(第一步)。 */
    @PostMapping("/orders")
    public Result<OrderResponse> createOrder(@CurrentUser UserSession s,
                                             @RequestBody @Valid CreateOrderRequest req) {
        return Result.ok(billingService.createOrder(s.getUserId(), req.getPlan(), req.getChannel()));
    }

    /** 确认支付(第二步)。 */
    @PostMapping("/orders/{orderNo}/confirm")
    public Result<SubscriptionStatusResponse> confirm(@CurrentUser UserSession s,
                                                      @PathVariable("orderNo") String orderNo) {
        return Result.ok(billingService.confirmOrder(s.getUserId(), orderNo));
    }

    /** 取消未支付订单。 */
    @PostMapping("/orders/{orderNo}/cancel")
    public Result<Void> cancel(@CurrentUser UserSession s,
                               @PathVariable("orderNo") String orderNo) {
        billingService.cancelOrder(s.getUserId(), orderNo);
        return Result.ok();
    }
}
