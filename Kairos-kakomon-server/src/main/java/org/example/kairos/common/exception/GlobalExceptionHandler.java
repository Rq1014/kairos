package org.example.kairos.common.exception;

import jakarta.validation.ConstraintViolationException;
import org.example.kairos.common.Result;
import org.example.kairos.common.ResultCode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.resource.NoResourceFoundException;

/**
 * 全局异常处理器。
 * <p>
 * HTTP 状态码映射策略:
 * <ul>
 *   <li>{@link ResultCode#UNAUTHORIZED} → HTTP 401,客户端可据此跳转登录页</li>
 *   <li>{@link ResultCode#FORBIDDEN}    → HTTP 403,客户端展示无权限提示</li>
 *   <li>其他业务异常 → HTTP 200,通过响应体的 code 字段传递业务错误,简化前端处理</li>
 * </ul>
 * 这种"业务错误用 200,鉴权错误用 4xx"的设计兼顾了前端处理便利性和 RESTful 语义。
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    /**
     * 处理业务异常 {@link BizException}。
     * 将 BizException 的 code 与 message 转为标准 {@link Result} 响应。
     */
    @ExceptionHandler(BizException.class)
    public ResponseEntity<Result<Object>> handleBiz(BizException e) {
        Result<Object> r = Result.fail(e.getCode(), e.getMessage());
        r.setTraceId(MDC.get("traceId"));
        if (e.getCode() == ResultCode.UNAUTHORIZED.getCode()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(r);
        }
        if (e.getCode() == ResultCode.FORBIDDEN.getCode()
                || e.getCode() == ResultCode.USER_ALREADY_DELETED.getCode()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(r);
        }
        return ResponseEntity.ok(r);
    }

    /**
     * 处理 @Valid / @Validated 校验失败,提取首个字段错误返回。
     */
    @ExceptionHandler({MethodArgumentNotValidException.class, BindException.class})
    public ResponseEntity<Result<Object>> handleValidation(Exception e) {
        String msg = e instanceof MethodArgumentNotValidException ex
                ? ex.getBindingResult().getFieldErrors().stream()
                .map(f -> f.getField() + ": " + f.getDefaultMessage())
                .findFirst().orElse(ResultCode.INVALID_PARAM.getMessage())
                : ResultCode.INVALID_PARAM.getMessage();
        Result<Object> r = Result.fail(ResultCode.INVALID_PARAM, msg);
        r.setTraceId(MDC.get("traceId"));
        return ResponseEntity.ok(r);
    }

    /**
     * 处理 @PathVariable / @RequestParam 上的约束校验失败。
     */
    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<Result<Object>> handleConstraint(ConstraintViolationException e) {
        Result<Object> r = Result.fail(ResultCode.INVALID_PARAM, e.getMessage());
        r.setTraceId(MDC.get("traceId"));
        return ResponseEntity.ok(r);
    }

    /**
     * 处理找不到资源/路由的请求,返回标准 404 而非 500,避免脏堆栈刷日志。
     */
    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<Result<Object>> handleNoResource(NoResourceFoundException e) {
        Result<Object> r = Result.fail(ResultCode.NOT_FOUND, "路径不存在: " + e.getResourcePath());
        r.setTraceId(MDC.get("traceId"));
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(r);
    }

    /**
     * 兜底异常处理,记录详细日志,对外仅暴露通用错误避免泄露内部细节。
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Result<Object>> handleAll(Exception e) {
        log.error("unhandled exception", e);
        Result<Object> r = Result.fail(ResultCode.INTERNAL_ERROR);
        r.setTraceId(MDC.get("traceId"));
        return ResponseEntity.ok(r);
    }
}
