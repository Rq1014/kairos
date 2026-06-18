package org.example.kairos.common.constant;

/**
 * Redis 缓存 Key 集中管理类。
 * <p>
 * 命名约定:
 * <ul>
 *   <li>{@code auth:*} - 认证/登录相关</li>
 *   <li>{@code dict:*} - 字典数据相关</li>
 *   <li>{@code ratelimit:*} - 限流相关</li>
 * </ul>
 * 所有 Redis Key 必须通过本类生成,避免散落在业务代码中导致 key 冲突或难以维护。
 */
public final class CacheKeys {
    private CacheKeys() {}

    /**
     * 验证码 Key,默认 TTL 5 分钟。
     *
     * @param scene 场景 {@link org.example.kairos.common.enums.VerifyCodeScene}
     * @param type  身份类型 {@link org.example.kairos.common.enums.IdentityType}
     * @param value 手机号或邮箱
     */
    public static String verifyCode(String scene, String type, String value) {
        return String.format("auth:code:%s:%s:%s", scene, type, value);
    }

    /** 验证码冷却 Key,默认 TTL 60 秒,用于限制重发频率 */
    public static String verifyCodeCd(String type, String value) {
        return String.format("auth:code:cd:%s:%s", type, value);
    }

    /** 同一身份当日发送计数 Key,TTL 至当日 24:00,用于校验日上限 */
    public static String verifyCodeDaily(String type, String value) {
        return String.format("auth:code:daily:%s:%s", type, value);
    }

    /** 同一 IP 当日发送计数 Key,TTL 至当日 24:00,用于防刷 */
    public static String verifyCodeIp(String ip) {
        return String.format("auth:code:ip:%s", ip);
    }

    /** 密码登录连续失败计数 Key,达到阈值后账号短期锁定 */
    public static String loginFail(String type, String value) {
        return String.format("auth:login:fail:%s:%s", type, value);
    }

    /** Token 黑名单 Key,登出后将 jti 加入黑名单直到 token 自然过期 */
    public static String tokenRevoked(String jti) {
        return String.format("auth:token:revoked:%s", jti);
    }

    /** Refresh Token 白名单 Key,记录用户当前有效的 refresh token,默认 TTL 30 天 */
    public static String refreshToken(long userId, String jti) {
        return String.format("auth:refresh:%d:%s", userId, jti);
    }

    /** 用户所有 refresh token 通配,用于强制下线时批量清理 */
    public static String refreshTokenAll(long userId) {
        return String.format("auth:refresh:%d:*", userId);
    }

    /** 接口限流 Key,基于 IP + URI */
    public static String rateLimit(String ip, String uri) {
        return String.format("ratelimit:%s:%s", ip, uri);
    }

    /** 字典版本号 Key,字典数据更新时该值递增,客户端据此判断是否需要重新拉取 */
    public static final String DICT_VERSION = "dict:meta:version";
    /** 大学列表缓存,带版本号实现版本切换时自然失效 */
    public static String dictUniList(int ver) { return "dict:uni:list:v" + ver; }
    /** 单个大学详情缓存 */
    public static String dictUniDetail(String code, int ver) { return "dict:uni:detail:" + code + ":v" + ver; }
    /** 大学下属研究科列表缓存 */
    public static String dictUniGrads(String code, int ver) { return "dict:uni:" + code + ":grads:v" + ver; }
    /** 大学下属专业列表缓存 */
    public static String dictUniMajors(String code, int ver) { return "dict:uni:" + code + ":majors:v" + ver; }
    /** 大学/研究科/专业完整树形结构缓存 */
    public static String dictUniTree(int ver) { return "dict:uni:tree:v" + ver; }
}
