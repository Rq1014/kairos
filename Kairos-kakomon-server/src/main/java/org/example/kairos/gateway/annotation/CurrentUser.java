package org.example.kairos.gateway.annotation;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * 当前登录用户参数注入注解。
 * <p>
 * 使用方式:
 * <pre>
 * &#64;GetMapping("/me")
 * public Result&lt;UserResponse&gt; me(&#64;CurrentUser UserSession session) {
 *     ...
 * }
 * </pre>
 * 由 {@link org.example.kairos.gateway.context.UserSessionResolver} 负责解析,
 * 自动从 ThreadLocal 中读取并注入。
 */
@Target(ElementType.PARAMETER)
@Retention(RetentionPolicy.RUNTIME)
public @interface CurrentUser {
}
