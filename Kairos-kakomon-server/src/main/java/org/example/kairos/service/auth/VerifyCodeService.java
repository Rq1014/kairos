package org.example.kairos.service.auth;

/**
 * 验证码服务: 发送 + 校验消费。
 * <p>
 * Redis Key 设计见 {@link org.example.kairos.common.constant.CacheKeys},
 * 配置见 {@link org.example.kairos.config.VerifyCodeProperties}。
 */
public interface VerifyCodeService {
    /**
     * 发送验证码。
     * <p>
     * 限流策略:
     * <ul>
     *   <li>同一身份 60 秒内只能重发一次</li>
     *   <li>同一身份当日累计上限(默认 10 次)</li>
     *   <li>同一 IP 当日累计上限(默认 100 次)</li>
     * </ul>
     *
     * @param identityType  PHONE / EMAIL
     * @param identityValue 手机号或邮箱
     * @param scene         业务场景 LOGIN / BIND / UNBIND / RESET_PASSWORD
     * @param clientIp      客户端 IP,空时跳过 IP 限流
     */
    SendResult sendCode(String identityType, String identityValue, String scene, String clientIp);

    /**
     * 校验验证码并消费(校验通过后立即从 Redis 删除,防止复用)。
     *
     * @return 校验通过返回 true
     */
    boolean verifyAndConsume(String identityType, String identityValue, String scene, String code);

    /** 发送结果封装 */
    class SendResult {
        /** 是否发送成功 */
        public final boolean sent;
        /** 重发冷却时间(秒) */
        public final long cooldownSeconds;
        /** 调试用验证码,本地/测试环境返回明文,便于排查 */
        public final String debugCode;
        public SendResult(boolean sent, long cooldownSeconds, String debugCode) {
            this.sent = sent;
            this.cooldownSeconds = cooldownSeconds;
            this.debugCode = debugCode;
        }
    }
}
