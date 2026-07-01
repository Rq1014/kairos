package org.example.kairos.service.billing.impl;

import tools.jackson.databind.ObjectMapper;
import org.example.kairos.common.ResultCode;
import org.example.kairos.common.enums.OrderStatus;
import org.example.kairos.common.enums.PayChannel;
import org.example.kairos.common.enums.PlanType;
import org.example.kairos.common.enums.SubscriptionStatus;
import org.example.kairos.common.exception.BizException;
import org.example.kairos.entity.PaymentOrderEntity;
import org.example.kairos.entity.SubscriptionEntity;
import org.example.kairos.entity.UserProfileEntity;
import org.example.kairos.mapper.billing.PaymentOrderMapper;
import org.example.kairos.mapper.billing.SubscriptionMapper;
import org.example.kairos.mapper.user.UserProfileMapper;
import org.example.kairos.model.response.billing.OrderResponse;
import org.example.kairos.model.response.billing.PlanResponse;
import org.example.kairos.model.response.billing.SubscriptionStatusResponse;
import org.example.kairos.service.billing.BillingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ThreadLocalRandom;

/**
 * 会员/支付服务实现。
 * <p>关键流程:
 * <ul>
 *   <li>{@link #createOrder} 校验套餐/渠道 -> 写 PENDING 订单 + 伪支付参数</li>
 *   <li>{@link #confirmOrder} 单事务: 订单置 PAID + 开通/续费订阅, 重复确认幂等</li>
 *   <li>{@link #isProActive} 读取时按 expires_at>now 判断, 过期懒降级</li>
 * </ul>
 */
@Service
public class BillingServiceImpl implements BillingService {

    @Autowired private PaymentOrderMapper paymentOrderMapper;
    @Autowired private SubscriptionMapper subscriptionMapper;
    @Autowired private UserProfileMapper userProfileMapper;
    @Autowired private ObjectMapper objectMapper;

    @Override
    public List<PlanResponse> listPlans() {
        List<PlanResponse> list = new ArrayList<>();
        list.add(new PlanResponse(PlanType.ANNUAL.name(),
                PlanType.ANNUAL.getPriceFen(), PlanType.ANNUAL.getDurationDays(), "最划算"));
        list.add(new PlanResponse(PlanType.MONTHLY.name(),
                PlanType.MONTHLY.getPriceFen(), PlanType.MONTHLY.getDurationDays(), null));
        return list;
    }

    @Override
    public SubscriptionStatusResponse getStatus(Long userId) {
        SubscriptionEntity sub = subscriptionMapper.findByUserId(userId);
        return toStatus(sub);
    }

    @Override
    @Transactional
    public OrderResponse createOrder(Long userId, String plan, String channel) {
        PlanType planType = PlanType.fromName(plan);     // 非法 -> PLAN_INVALID
        PayChannel payChannel = PayChannel.fromName(channel); // 非法 -> CHANNEL_INVALID

        String orderNo = genOrderNo();
        Map<String, Object> payParams = buildMockPayParams(payChannel, orderNo);

        PaymentOrderEntity order = new PaymentOrderEntity();
        order.setOrderNo(orderNo);
        order.setUserId(userId);
        order.setPlan(planType.name());
        order.setChannel(payChannel.name());
        order.setAmountFen(planType.getPriceFen());
        order.setStatus(OrderStatus.PENDING.name());
        order.setMockPayParams(writeJson(payParams));
        paymentOrderMapper.insert(order);

        OrderResponse resp = new OrderResponse();
        resp.setOrderNo(orderNo);
        resp.setStatus(OrderStatus.PENDING.name());
        resp.setPlan(planType.name());
        resp.setChannel(payChannel.name());
        resp.setAmountFen(planType.getPriceFen());
        resp.setPayParams(payParams);
        return resp;
    }

    @Override
    @Transactional
    public SubscriptionStatusResponse confirmOrder(Long userId, String orderNo) {
        PaymentOrderEntity order = paymentOrderMapper.findByOrderNo(orderNo);
        if (order == null || !order.getUserId().equals(userId)) {
            throw new BizException(ResultCode.ORDER_NOT_FOUND);
        }
        // 幂等: 已支付直接返回当前订阅, 不重复延期。
        if (OrderStatus.PAID.name().equals(order.getStatus())) {
            return toStatus(subscriptionMapper.findByUserId(userId));
        }
        if (!OrderStatus.PENDING.name().equals(order.getStatus())) {
            throw new BizException(ResultCode.ORDER_STATUS_INVALID);
        }

        LocalDateTime now = LocalDateTime.now();
        paymentOrderMapper.markPaid(orderNo, now);

        PlanType planType = PlanType.fromName(order.getPlan());
        SubscriptionEntity sub = subscriptionMapper.findByUserId(userId);
        if (sub == null) {
            // 首次开通
            sub = new SubscriptionEntity();
            sub.setUserId(userId);
            sub.setPlan(planType.name());
            sub.setStartsAt(now);
            sub.setExpiresAt(now.plusDays(planType.getDurationDays()));
            sub.setStatus(SubscriptionStatus.ACTIVE.name());
            sub.setSourceOrderNo(orderNo);
            subscriptionMapper.insert(sub);
        } else {
            // 续费: 仍有效从旧到期日叠加, 已过期从 now 起算
            LocalDateTime base = sub.getExpiresAt() != null && sub.getExpiresAt().isAfter(now)
                    ? sub.getExpiresAt() : now;
            if (sub.getStartsAt() == null || sub.getExpiresAt() == null || !sub.getExpiresAt().isAfter(now)) {
                sub.setStartsAt(now);
            }
            sub.setExpiresAt(base.plusDays(planType.getDurationDays()));
            sub.setPlan(planType.name());
            sub.setStatus(SubscriptionStatus.ACTIVE.name());
            sub.setSourceOrderNo(orderNo);
            subscriptionMapper.update(sub);
        }

        // 冗余同步 user_profile.is_pro = 1
        writeIsPro(userId, 1);
        return toStatus(sub);
    }

    @Override
    @Transactional
    public void cancelOrder(Long userId, String orderNo) {
        PaymentOrderEntity order = paymentOrderMapper.findByOrderNo(orderNo);
        if (order == null || !order.getUserId().equals(userId)) {
            throw new BizException(ResultCode.ORDER_NOT_FOUND);
        }
        if (!OrderStatus.PENDING.name().equals(order.getStatus())) {
            throw new BizException(ResultCode.ORDER_STATUS_INVALID);
        }
        paymentOrderMapper.markCancelled(orderNo);
    }

    @Override
    public boolean isProActive(Long userId) {
        SubscriptionEntity sub = subscriptionMapper.findByUserId(userId);
        if (sub == null || sub.getExpiresAt() == null) return false;
        boolean active = sub.getExpiresAt().isAfter(LocalDateTime.now());
        if (!active && SubscriptionStatus.ACTIVE.name().equals(sub.getStatus())) {
            // 懒降级: 过期但状态仍 ACTIVE -> 标 EXPIRED + is_pro=0(best-effort)
            try {
                subscriptionMapper.markExpired(sub.getId());
                writeIsPro(userId, 0);
            } catch (Exception ignore) {
                // 降级失败不影响读取结果
            }
        }
        return active;
    }

    /** 订阅实体 -> 状态响应; null/过期返回 free。 */
    private SubscriptionStatusResponse toStatus(SubscriptionEntity sub) {
        SubscriptionStatusResponse r = new SubscriptionStatusResponse();
        r.setAutoRenew(false);
        boolean active = sub != null && sub.getExpiresAt() != null
                && sub.getExpiresAt().isAfter(LocalDateTime.now());
        if (active) {
            r.setIsPro(true);
            r.setPlan(sub.getPlan());
            r.setStartsAt(toIso(sub.getStartsAt()));
            r.setExpiresAt(toIso(sub.getExpiresAt()));
        } else {
            r.setIsPro(false);
            r.setPlan("free");
            r.setStartsAt(null);
            r.setExpiresAt(null);
        }
        return r;
    }

    /** 按渠道生成伪支付参数。 */
    private Map<String, Object> buildMockPayParams(PayChannel channel, String orderNo) {
        Map<String, Object> m = new LinkedHashMap<>();
        switch (channel) {
            case WECHAT -> { m.put("type", "wechat_qr"); m.put("mockQr", "weixin://mock/" + orderNo); }
            case ALIPAY -> { m.put("type", "alipay_qr"); m.put("mockQr", "alipay://mock/" + orderNo); }
            case APPLE  -> { m.put("type", "apple_iap"); m.put("mockTransactionId", "mock_txn_" + orderNo); }
        }
        return m;
    }

    private void writeIsPro(Long userId, int isPro) {
        UserProfileEntity p = new UserProfileEntity();
        p.setUserId(userId);
        p.setIsPro(isPro);
        userProfileMapper.update(p);
    }

    private String writeJson(Map<String, Object> m) {
        try {
            return objectMapper.writeValueAsString(m);
        } catch (Exception e) {
            return "{}";
        }
    }

    private String toIso(LocalDateTime dt) {
        return dt == null ? null
                : dt.atZone(ZoneId.systemDefault()).toInstant().toString();
    }

    /** 生成订单号: "po_" + 13 位时间戳 + 4 位随机, 控制在 40 字符内。 */
    private static String genOrderNo() {
        String s = "po_" + System.currentTimeMillis()
                + ThreadLocalRandom.current().nextInt(1000, 9999);
        return s.length() > 40 ? s.substring(0, 40) : s;
    }
}
