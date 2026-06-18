package org.example.kairos.model.response.auth;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * 发送验证码响应体。
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class SendCodeResponse {
    /** 是否发送成功 */
    private boolean sent;
    /** 重发冷却时间(秒),前端用于按钮倒计时 */
    private long cooldownSeconds;
    /** 调试用验证码,仅本地/测试环境返回,生产环境为 null */
    private String debugCode;

    public boolean isSent() { return sent; }
    public void setSent(boolean sent) { this.sent = sent; }
    public long getCooldownSeconds() { return cooldownSeconds; }
    public void setCooldownSeconds(long cooldownSeconds) { this.cooldownSeconds = cooldownSeconds; }
    public String getDebugCode() { return debugCode; }
    public void setDebugCode(String debugCode) { this.debugCode = debugCode; }
}
