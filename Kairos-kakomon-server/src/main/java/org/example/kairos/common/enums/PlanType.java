package org.example.kairos.common.enums;

import org.example.kairos.common.ResultCode;
import org.example.kairos.common.exception.BizException;

/** Pro 套餐类型。价格(分)与时长(天)由后端权威定义,前端不硬编码。 */
public enum PlanType {
    MONTHLY(2800, 30),
    ANNUAL(19800, 365);

    private final int priceFen;
    private final int durationDays;

    PlanType(int priceFen, int durationDays) {
        this.priceFen = priceFen;
        this.durationDays = durationDays;
    }

    public int getPriceFen() { return priceFen; }
    public int getDurationDays() { return durationDays; }

    /** 解析套餐名,非法值抛 PLAN_INVALID。 */
    public static PlanType fromName(String name) {
        if (name != null) {
            for (PlanType p : values()) {
                if (p.name().equalsIgnoreCase(name.trim())) return p;
            }
        }
        throw new BizException(ResultCode.PLAN_INVALID);
    }
}
