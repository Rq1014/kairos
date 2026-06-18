package org.example.kairos.common.constant;

/**
 * HTTP 请求/响应头常量集中管理。
 * <p>
 * 业务代码读写 Header 时应统一使用本类,避免拼写错误。
 */
public final class HeaderKeys {
    private HeaderKeys() {}

    /** 标准 Authorization 头,Bearer Token 通过此 Header 传递 */
    public static final String AUTHORIZATION = "Authorization";
    /** 自定义 Token Header,部分客户端不便使用 Authorization 时的备选方案 */
    public static final String AUTH_TOKEN = "X-Auth-Token";
    /** 链路追踪 ID,网关注入,贯穿整个请求链路,用于日志关联 */
    public static final String TRACE_ID = "X-Trace-Id";
    /** 设备唯一标识,用于设备维度的统计与风控 */
    public static final String DEVICE_ID = "X-Device-Id";
    /** 客户端版本号,用于灰度发布与最低版本兼容判断 */
    public static final String CLIENT_VERSION = "X-Client-Version";
    /** Bearer Token 前缀,Authorization 头格式: "Bearer <token>" */
    public static final String BEARER_PREFIX = "Bearer ";
}
