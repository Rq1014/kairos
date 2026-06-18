package org.example.kairos.common.enums;

/**
 * 验证码业务场景枚举。
 * <p>
 * 不同场景使用独立的 Redis key(见 {@link org.example.kairos.common.constant.CacheKeys#verifyCode}),
 * 防止同一手机号在登录场景拿到的验证码被用于绑定/解绑等其他场景。
 */
public enum VerifyCodeScene {
    /** 验证码登录或注册场景 */
    LOGIN,
    /** 绑定新手机号/邮箱场景 */
    BIND,
    /** 解绑现有手机号/邮箱场景 */
    UNBIND,
    /** 重置密码场景(忘记密码后通过验证码重置) */
    RESET_PASSWORD;

    /**
     * 字符串转枚举,大小写不敏感。
     *
     * @param s 场景字符串
     * @return 匹配的枚举,匹配不到返回 null
     */
    public static VerifyCodeScene fromString(String s) {
        if (s == null) return null;
        for (VerifyCodeScene t : values()) {
            if (t.name().equalsIgnoreCase(s)) return t;
        }
        return null;
    }
}
