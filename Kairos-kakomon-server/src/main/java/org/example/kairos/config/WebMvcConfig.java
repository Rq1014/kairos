package org.example.kairos.config;

import org.example.kairos.gateway.context.UserSessionResolver;
import org.example.kairos.gateway.interceptor.AuthInterceptor;
import org.example.kairos.gateway.interceptor.LoginRequiredInterceptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.List;

/**
 * Web MVC 配置类,负责注册:
 * <ol>
 *   <li>认证拦截器: {@link AuthInterceptor} 解析 Token,挂载用户上下文(可选)</li>
 *   <li>登录校验拦截器: {@link LoginRequiredInterceptor} 强制校验需登录的接口</li>
 *   <li>参数解析器: {@link UserSessionResolver} 将当前用户注入 Controller 方法参数</li>
 *   <li>跨域(CORS)策略: 允许前端跨域访问</li>
 * </ol>
 */
@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Autowired private AuthInterceptor authInterceptor;
    @Autowired private LoginRequiredInterceptor loginRequiredInterceptor;
    @Autowired private UserSessionResolver userSessionResolver;

    /**
     * 注册拦截器,均仅作用于 /api/** 下的接口。
     * AuthInterceptor 先执行,负责解析 Token;LoginRequiredInterceptor 后执行,
     * 根据方法上的 @LoginRequired 注解决定是否拦截。
     */
    @Override
    public void addInterceptors(InterceptorRegistry r) {
        r.addInterceptor(authInterceptor)
                .addPathPatterns("/api/**");
        r.addInterceptor(loginRequiredInterceptor)
                .addPathPatterns("/api/**");
    }

    /**
     * 注册参数解析器,使 Controller 方法可以直接声明 UserSession 参数,
     * 避免在每个方法里手动从 ThreadLocal 读取。
     */
    @Override
    public void addArgumentResolvers(List<HandlerMethodArgumentResolver> resolvers) {
        resolvers.add(userSessionResolver);
    }

    /**
     * CORS 配置:
     * - 允许任意 Origin(开发期友好,生产应收紧)
     * - 暴露 X-Trace-Id 让前端可以读到链路 ID
     * - 暴露 X-New-Access-Token / X-New-Refresh-Token 用于 30 天滑动续签
     * - 允许携带 Cookie/Authorization 凭证
     */
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOriginPatterns("*")
                .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .exposedHeaders("X-Trace-Id", "X-New-Access-Token", "X-New-Refresh-Token")
                .allowCredentials(true)
                .maxAge(3600);
    }
}
