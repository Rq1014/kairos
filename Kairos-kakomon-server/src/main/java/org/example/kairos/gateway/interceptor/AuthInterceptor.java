package org.example.kairos.gateway.interceptor;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.example.kairos.common.constant.HeaderKeys;
import org.example.kairos.gateway.context.UserContextHolder;
import org.example.kairos.model.bo.UserSession;
import org.example.kairos.service.auth.TokenService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

/**
 * 认证拦截器。
 * <p>
 * 职责:解析请求中的 Token 并将用户上下文写入 ThreadLocal。
 * 注意:本拦截器本身不强制要求登录(那是 {@link LoginRequiredInterceptor} 的职责),
 * 仅做"如果有 Token 就解析"的工作,这样即使是公开接口也能拿到当前用户信息(若已登录)。
 * <p>
 * Token 兼容两种来源:
 * <ul>
 *   <li>{@code Authorization: Bearer xxx} 标准头</li>
 *   <li>{@code X-Auth-Token: xxx} 自定义头(给不便用 Authorization 的客户端使用)</li>
 * </ul>
 */
@Component
public class AuthInterceptor implements HandlerInterceptor {

    @Autowired
    private TokenService tokenService;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        String token = extractToken(request);
        if (token != null) {
            UserSession session = tokenService.parseAccessToken(token);
            if (session != null) {
                UserContextHolder.set(session);
                if (shouldSlide(request)) {
                    tokenService.slideSession(session, response);
                }
            }
        }
        return true;
    }

    /**
     * 是否需要在本次请求触发滑动续签:登录/登出/刷新/身份检查/发送验证码这些
     * 与「登录态本身」相关的接口不参与滑动,避免噪音(如登录响应里附带新 token,
     * 或登出后又下发新 token 让客户端误以为还在登录)。
     * <p>
     * 同样不参与滑动:
     * <ul>
     *   <li>{@code DELETE /api/users/me} 账号注销:刚清空 token 就发新 token 会让客户端误以为还在登录</li>
     * </ul>
     */
    private boolean shouldSlide(HttpServletRequest request) {
        String uri = request.getRequestURI();
        if (uri == null) return false;
        if ("DELETE".equalsIgnoreCase(request.getMethod()) && uri.equals("/api/users/me")) {
            return false;
        }
        return !(uri.startsWith("/api/auth/login")
                || uri.startsWith("/api/auth/refresh")
                || uri.startsWith("/api/auth/logout")
                || uri.startsWith("/api/auth/identity/check")
                || uri.startsWith("/api/auth/verify-code"));
    }

    /** 请求结束清理 ThreadLocal,防止线程池复用导致用户上下文串号 */
    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) {
        UserContextHolder.clear();
    }

    /** 从 Authorization / X-Auth-Token 头提取 token,空白返回 null */
    private String extractToken(HttpServletRequest request) {
        String auth = request.getHeader(HeaderKeys.AUTHORIZATION);
        if (auth != null && auth.startsWith(HeaderKeys.BEARER_PREFIX)) {
            return auth.substring(HeaderKeys.BEARER_PREFIX.length()).trim();
        }
        String x = request.getHeader(HeaderKeys.AUTH_TOKEN);
        if (x != null && !x.isBlank()) return x.trim();
        return null;
    }
}
