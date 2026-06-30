package org.example.kairos.common.enums;

import org.example.kairos.common.ResultCode;
import org.example.kairos.common.exception.BizException;

/** 支付渠道。本期均为后端模拟,不接真实 SDK。 */
public enum PayChannel {
    WECHAT, ALIPAY, APPLE;

    /** 解析渠道名,非法值抛 CHANNEL_INVALID。 */
    public static PayChannel fromName(String name) {
        if (name != null) {
            for (PayChannel c : values()) {
                if (c.name().equalsIgnoreCase(name.trim())) return c;
            }
        }
        throw new BizException(ResultCode.CHANNEL_INVALID);
    }
}
