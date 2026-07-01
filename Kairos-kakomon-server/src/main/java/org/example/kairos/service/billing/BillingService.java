package org.example.kairos.service.billing;

import org.example.kairos.model.response.billing.OrderResponse;
import org.example.kairos.model.response.billing.PlanResponse;
import org.example.kairos.model.response.billing.SubscriptionStatusResponse;

import java.util.List;

/** 会员/支付领域服务。 */
public interface BillingService {

    /** 返回所有可售套餐。 */
    List<PlanResponse> listPlans();

    /** 查询用户当前订阅状态(含懒降级)。 */
    SubscriptionStatusResponse getStatus(Long userId);

    /** 下单(第一步):创建 PENDING 订单并生成伪支付参数。 */
    OrderResponse createOrder(Long userId, String plan, String channel);

    /** 确认支付(第二步):订单置 PAID + 开通/续费订阅,幂等。返回最新订阅状态。 */
    SubscriptionStatusResponse confirmOrder(Long userId, String orderNo);

    /** 取消未支付订单(PENDING -> CANCELLED)。 */
    void cancelOrder(Long userId, String orderNo);

    /** 用户当前是否 Pro 会员(expires_at>now),读取时懒降级。供用户聚合接口复用。 */
    boolean isProActive(Long userId);
}
