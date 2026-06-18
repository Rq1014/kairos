package org.example.kairos.gateway.interceptor;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.example.kairos.common.ResultCode;
import org.example.kairos.common.exception.BizException;
import org.example.kairos.gateway.annotation.PublicApi;
import org.example.kairos.gateway.context.UserContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerInterceptor;

/**
 * 登录校验拦截器。
 * <p>
 * 默认所有 /api/** 接口都需要登录,通过 {@link PublicApi} 注解显式放行公开接口。
 * 配合 {@link AuthInterceptor} 使用:
 * <ol>
 *   <li>AuthInterceptor 解析 Token 并写入 ThreadLocal</li>
 *   <li>本拦截器检查 ThreadLocal 中是否存在用户上下文,无则抛 401</li>
 * </ol>
 */
@Component
public class LoginRequiredInterceptor implements HandlerInterceptor {

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        if (!(handler instanceof HandlerMethod hm)) return true;
        // 方法或类标注 @PublicApi 的接口,不强制登录
        if (hm.hasMethodAnnotation(PublicApi.class)
                || hm.getBeanType().isAnnotationPresent(PublicApi.class)) {
            return true;
        }
        if (UserContextHolder.get() == null) {
            throw new BizException(ResultCode.UNAUTHORIZED);
        }
        return true;
    }
}
