package org.example.kairos.common.exception;

import org.example.kairos.common.ResultCode;

/**
 * 业务异常类。
 * <p>
 * 由业务层主动抛出,由 {@link GlobalExceptionHandler} 统一捕获并转换为标准 {@link org.example.kairos.common.Result}。
 * 用法示例:
 * <pre>
 * if (user == null) {
 *     throw new BizException(ResultCode.USER_NOT_FOUND);
 * }
 * if (!universityMapper.existsByCode(code)) {
 *     throw new BizException(ResultCode.TARGET_SCHOOL_INVALID, "学校不存在: " + code);
 * }
 * </pre>
 */
public class BizException extends RuntimeException {
    /** 业务响应码,与 {@link ResultCode#getCode()} 对应 */
    private final int code;
    /** 异常消息,会回写到响应的 message 字段并展示给用户 */
    private final String message;

    /** 使用 {@link ResultCode} 默认 message 抛出业务异常 */
    public BizException(ResultCode rc) {
        super(rc.getMessage());
        this.code = rc.getCode();
        this.message = rc.getMessage();
    }

    /** 使用 {@link ResultCode} 但自定义 message 抛出业务异常,适合需要携带动态信息的场景 */
    public BizException(ResultCode rc, String message) {
        super(message);
        this.code = rc.getCode();
        this.message = message;
    }

    /** 使用裸的 code/message 抛出业务异常,一般不建议使用,推荐先在 {@link ResultCode} 中定义枚举 */
    public BizException(int code, String message) {
        super(message);
        this.code = code;
        this.message = message;
    }

    public int getCode() { return code; }
    @Override public String getMessage() { return message; }
}
