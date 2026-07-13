package org.example.kairos.common;

/**
 * 业务响应码枚举。
 * <p>
 * 错误码规则:
 * <ul>
 *   <li>0           - 成功</li>
 *   <li>10000~10099 - 通用错误(参数、权限、限流等)</li>
 *   <li>10100~10199 - 账号/认证相关</li>
 *   <li>10200~10299 - 身份绑定相关</li>
 *   <li>10300~10399 - 用户资料/字典相关</li>
 *   <li>10400~10499 - 三方登录相关</li>
 *   <li>10500~10599 - 订单/支付相关</li>
 *   <li>10600~10699 - 题目/试卷相关</li>
 * </ul>
 * 业务码与 HTTP 状态码解耦, HTTP 状态码由 {@code GlobalExceptionHandler} 统一映射。
 */
public enum ResultCode {
    /** 成功 */
    OK(0, "ok"),
    /** 服务端未捕获的异常,通常对应 HTTP 500 */
    INTERNAL_ERROR(10000, "服务内部错误"),
    /** 请求参数校验失败,对应 HTTP 400 */
    INVALID_PARAM(10001, "参数校验失败"),
    /** 触发限流策略,对应 HTTP 429 */
    RATE_LIMITED(10002, "请求过于频繁"),
    /** 未登录或 Token 失效,对应 HTTP 401 */
    UNAUTHORIZED(10003, "未登录或登录已过期"),
    /** 已登录但无权限,对应 HTTP 403 */
    FORBIDDEN(10004, "无权访问"),
    /** 资源不存在,对应 HTTP 404 */
    NOT_FOUND(10005, "资源不存在"),

    /** 通过手机号/邮箱查询不到用户 */
    USER_NOT_FOUND(10101, "账号不存在"),
    /** 用户存在但未设置密码,提示走验证码登录 */
    PASSWORD_NOT_SET(10102, "该账号未设置密码"),
    /** 密码错误 */
    INVALID_CREDENTIALS(10103, "密码错误"),
    /** 多次密码错误后,账号短期锁定 */
    ACCOUNT_LOCKED(10104, "账号锁定"),
    /** 账号被管理员冻结 */
    ACCOUNT_FROZEN(10105, "账号被冻结"),
    /** 账号已注销,无法再调用任何业务接口 */
    USER_ALREADY_DELETED(10106, "账号已注销"),
    /** 验证码错误或在 Redis 中已过期(默认 5 分钟) */
    INVALID_CODE(10110, "验证码错误或已过期"),
    /** 60 秒内重复发送验证码 */
    CODE_COOLDOWN(10111, "验证码发送过于频繁"),
    /** 当日同一手机号/邮箱发送次数超过上限 */
    CODE_DAILY_LIMIT(10112, "验证码当日次数超限"),
    /** identityType 不在枚举内(PHONE/EMAIL/WECHAT/APPLE/LINE) */
    IDENTITY_TYPE_INVALID(10113, "身份类型不支持"),
    /** 手机号或邮箱格式不正确 */
    IDENTITY_FORMAT_INVALID(10114, "身份格式不正确"),

    /** 该手机号/邮箱已被其他账号占用,无法绑定 */
    IDENTITY_OCCUPIED(10201, "该手机号/邮箱已被其他账号绑定"),
    /** 解绑会导致用户没有任何登录方式,操作被拒绝 */
    LAST_IDENTITY_FORBIDDEN(10202, "必须保留至少一种登录方式"),
    /** 解绑时,该身份未挂在当前用户名下 */
    IDENTITY_NOT_BOUND(10203, "当前用户未绑定该身份"),

    /** 昵称为空或超过 30 字符 */
    NICKNAME_INVALID(10301, "昵称为空或超长"),
    /** 目标学校数量超过 20 所 */
    TARGET_SCHOOL_LIMIT(10302, "目标学校超限"),
    /** 目标学校/研究科/专业 ID 在字典中不存在 */
    TARGET_SCHOOL_INVALID(10303, "目标学校 / 研究科 / 专业不存在或已下线"),
    /** 字典 code 不存在 */
    DICT_NOT_FOUND(10310, "字典数据不存在"),
    /** 客户端字典版本与服务端不一致,需要客户端重新全量拉取 */
    DICT_VERSION_MISMATCH(10311, "字典版本号已升级，请重新拉取"),

    /** 微信/Apple/Line 登录授权失败 */
    THIRD_PARTY_AUTH_FAIL(10401, "三方授权失败"),
    /** 三方登录后,业务要求必须先绑定手机号才能继续使用 */
    REQUIRE_BIND_PHONE(10402, "需先绑定手机号"),

    /** 订单不存在或不属于当前用户 */
    ORDER_NOT_FOUND(10501, "订单不存在"),
    /** 订单状态非法,无法执行该操作(如对非 PENDING 订单确认/取消) */
    ORDER_STATUS_INVALID(10502, "订单状态异常"),
    /** 套餐类型不合法 */
    PLAN_INVALID(10503, "套餐不存在"),
    /** 支付渠道不合法 */
    CHANNEL_INVALID(10504, "支付渠道不支持"),

    /** 试卷不存在或已下线 */
    PAPER_NOT_FOUND(10601, "试卷不存在"),
    /** 题目不存在或已下线 */
    QUESTION_NOT_FOUND(10602, "题目不存在"),
    /** 难度投票值非法(仅 easy/medium/hard) */
    INVALID_DIFFICULTY_VOTE(10603, "难度投票值不合法"),
    /** 掌握状态值非法(仅 mastered/unclear/wrong) */
    INVALID_MASTERY_STATUS(10604, "掌握状态值不合法"),
    /** 专业-科目组合在 major_subject 字典中不存在 */
    MAJOR_SUBJECT_NOT_FOUND(10605, "专业-科目组合不存在");

    private final int code;
    private final String message;

    ResultCode(int code, String message) {
        this.code = code;
        this.message = message;
    }

    public int getCode() { return code; }
    public String getMessage() { return message; }
}
