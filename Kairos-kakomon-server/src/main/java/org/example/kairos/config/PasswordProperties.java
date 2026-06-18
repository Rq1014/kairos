package org.example.kairos.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * 密码策略配置,绑定 application.yml 的 auth.password.* 节点。
 */
@Component
@ConfigurationProperties(prefix = "auth.password")
public class PasswordProperties {
    /** BCrypt 加密强度(cost),范围 4~31,数值越大越安全但越耗 CPU,默认 10 */
    private int bcryptStrength = 10;
    /** 连续密码错误最大次数,达到后触发账号锁定 */
    private int maxFailedCount = 5;
    /** 触发锁定后的冷静期(分钟),期间禁止登录 */
    private int lockMinutes = 10;

    public int getBcryptStrength() { return bcryptStrength; }
    public void setBcryptStrength(int bcryptStrength) { this.bcryptStrength = bcryptStrength; }
    public int getMaxFailedCount() { return maxFailedCount; }
    public void setMaxFailedCount(int maxFailedCount) { this.maxFailedCount = maxFailedCount; }
    public int getLockMinutes() { return lockMinutes; }
    public void setLockMinutes(int lockMinutes) { this.lockMinutes = lockMinutes; }
}
