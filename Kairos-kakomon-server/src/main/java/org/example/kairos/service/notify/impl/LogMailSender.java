package org.example.kairos.service.notify.impl;

import org.example.kairos.service.notify.MailSender;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

/**
 * 日志型邮件发送实现,仅在控制台打印验证码,用于本地/测试环境。
 * 生产环境应替换为真正的 SMTP/邮件推送服务。
 */
@Service
public class LogMailSender implements MailSender {
    private static final Logger log = LoggerFactory.getLogger(LogMailSender.class);

    @Override
    public void send(String email, String code) {
        log.info("[Mail] to={}, code={}", email, code);
    }
}
