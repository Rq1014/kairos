package org.example.kairos.common.enums;

/**
 * 用户身份类型枚举,对应 user_identity.identity_type 字段。
 * <p>
 * 设计说明:
 * <ul>
 *   <li>一个用户(user)可拥有多个身份(user_identity),实现多端登录统一</li>
 *   <li>(identity_type, identity_value) 组合在表上唯一,即同一手机号或邮箱不能被多个用户绑定</li>
 *   <li>三方登录身份(WECHAT/APPLE/LINE)的 value 为各平台的 openid/sub</li>
 * </ul>
 */
public enum IdentityType {
    /** 手机号身份,value 为 11 位中国手机号 */
    PHONE,
    /** 邮箱身份,value 为标准邮箱地址 */
    EMAIL,
    /** 微信身份,value 为微信 openid */
    WECHAT,
    /** Apple 身份,value 为 Sign in with Apple 的 sub */
    APPLE,
    /** Line 身份,value 为 Line 的用户 ID */
    LINE;

    /**
     * 字符串转枚举,大小写不敏感。
     *
     * @param s 字符串值,如 "phone"、"PHONE"
     * @return 匹配的枚举,匹配不到返回 null
     */
    public static IdentityType fromString(String s) {
        if (s == null) return null;
        for (IdentityType t : values()) {
            if (t.name().equalsIgnoreCase(s)) return t;
        }
        return null;
    }
}
