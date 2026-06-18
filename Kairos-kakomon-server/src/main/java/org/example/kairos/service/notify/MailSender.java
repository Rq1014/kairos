package org.example.kairos.service.notify;

/**
 * 邮件发送抽象。
 * <p>
 * 当前实现为 {@link org.example.kairos.service.notify.impl.LogMailSender},
 * 仅打印日志(本地/测试环境)。生产环境应替换为 SMTP / SES / 阿里云邮件推送等具体实现。
 */
public interface MailSender {
    /**
     * 发送验证码邮件。
     *
     * @param email 收件邮箱
     * @param code  验证码
     */
    void send(String email, String code);
}
