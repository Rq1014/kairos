package org.example.kairos.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * 验证码策略配置,绑定 application.yml 的 auth.verify-code.* 节点。
 * <p>
 * 该配置控制验证码的长度、有效期、冷却时间及防刷上限,
 * 用于平衡用户体验与安全性。
 */
@Component
@ConfigurationProperties(prefix = "auth.verify-code")
public class VerifyCodeProperties {
    /** 验证码长度,默认 6 位数字 */
    private int length = 6;
    /** 验证码 Redis 缓存有效期(秒),默认 5 分钟 */
    private long ttlSeconds = 300;
    /** 同一身份重发冷却时间(秒),默认 60 秒 */
    private long cooldownSeconds = 60;
    /** 同一手机号/邮箱当日发送次数上限,默认 10 次 */
    private int dailyLimitPerIdentity = 10;
    /** 同一 IP 当日发送次数上限,防止批量注册攻击,默认 100 次 */
    private int dailyLimitPerIp = 100;

    public int getLength() { return length; }
    public void setLength(int length) { this.length = length; }
    public long getTtlSeconds() { return ttlSeconds; }
    public void setTtlSeconds(long ttlSeconds) { this.ttlSeconds = ttlSeconds; }
    public long getCooldownSeconds() { return cooldownSeconds; }
    public void setCooldownSeconds(long cooldownSeconds) { this.cooldownSeconds = cooldownSeconds; }
    public int getDailyLimitPerIdentity() { return dailyLimitPerIdentity; }
    public void setDailyLimitPerIdentity(int dailyLimitPerIdentity) { this.dailyLimitPerIdentity = dailyLimitPerIdentity; }
    public int getDailyLimitPerIp() { return dailyLimitPerIp; }
    public void setDailyLimitPerIp(int dailyLimitPerIp) { this.dailyLimitPerIp = dailyLimitPerIp; }
}
