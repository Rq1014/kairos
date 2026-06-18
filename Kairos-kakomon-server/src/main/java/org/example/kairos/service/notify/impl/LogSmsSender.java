package org.example.kairos.service.notify.impl;

import org.example.kairos.service.notify.SmsSender;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

/**
 * 日志型短信发送实现,仅在控制台打印验证码,用于本地/测试环境。
 * 生产环境应替换为真正的短信服务商接入。
 */
@Service
public class LogSmsSender implements SmsSender {
    private static final Logger log = LoggerFactory.getLogger(LogSmsSender.class);

    @Override
    public void send(String phone, String code) {
        log.info("[SMS] to={}, code={}", phone, code);
    }
}
