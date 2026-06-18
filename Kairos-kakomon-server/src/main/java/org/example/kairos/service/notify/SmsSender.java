package org.example.kairos.service.notify;

/**
 * 短信发送抽象。
 * <p>
 * 当前实现为 {@link org.example.kairos.service.notify.impl.LogSmsSender},
 * 仅打印日志(本地/测试环境)。生产环境应替换为阿里云短信、腾讯云短信等具体实现。
 */
public interface SmsSender {
    /**
     * 发送验证码短信。
     *
     * @param phone 收件手机号
     * @param code  验证码
     */
    void send(String phone, String code);
}
