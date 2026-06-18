package org.example.kairos.common;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * 统一响应结果封装类。
 * <p>
 * 所有 API 接口的响应都应使用此类作为返回类型,以保证响应格式的一致性。
 * 响应结构示例:
 * <pre>
 * {
 *   "code": 0,
 *   "message": "success",
 *   "data": { ... },
 *   "traceId": "xxx-xxx-xxx"
 * }
 * </pre>
 *
 * @param <T> 响应数据的泛型类型
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class Result<T> {
    /** 业务响应码,0 表示成功,其他值表示业务错误,详见 {@link ResultCode} */
    private int code;
    /** 响应消息,用于描述业务结果,可直接展示给用户 */
    private String message;
    /** 响应数据,具体类型由泛型 T 决定,失败时通常为 null */
    private T data;
    /** 链路追踪 ID,用于排查日志,可选字段 */
    private String traceId;

    public Result() {}

    public Result(int code, String message, T data) {
        this.code = code;
        this.message = message;
        this.data = data;
    }

    /** 构造一个无数据的成功响应 */
    public static <T> Result<T> ok() {
        return new Result<>(ResultCode.OK.getCode(), ResultCode.OK.getMessage(), null);
    }

    /** 构造一个携带数据的成功响应 */
    public static <T> Result<T> ok(T data) {
        return new Result<>(ResultCode.OK.getCode(), ResultCode.OK.getMessage(), data);
    }

    /** 根据 {@link ResultCode} 构造失败响应 */
    public static <T> Result<T> fail(ResultCode rc) {
        return new Result<>(rc.getCode(), rc.getMessage(), null);
    }

    /** 根据 {@link ResultCode} 构造失败响应,并自定义提示信息 */
    public static <T> Result<T> fail(ResultCode rc, String message) {
        return new Result<>(rc.getCode(), message, null);
    }

    /** 使用自定义业务码构造失败响应 */
    public static <T> Result<T> fail(int code, String message) {
        return new Result<>(code, message, null);
    }

    public int getCode() { return code; }
    public void setCode(int code) { this.code = code; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public T getData() { return data; }
    public void setData(T data) { this.data = data; }
    public String getTraceId() { return traceId; }
    public void setTraceId(String traceId) { this.traceId = traceId; }
}
