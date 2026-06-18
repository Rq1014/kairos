package org.example.kairos.gateway.context;

import org.example.kairos.gateway.annotation.CurrentUser;
import org.example.kairos.model.bo.UserSession;
import org.springframework.core.MethodParameter;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

/**
 * @CurrentUser 参数解析器。
 * <p>
 * 将 Controller 方法上声明为 {@code @CurrentUser UserSession} 的参数
 * 自动替换为 {@link UserContextHolder#get()} 的值。
 * 在 {@link org.example.kairos.config.WebMvcConfig} 中注册。
 */
@Component
public class UserSessionResolver implements HandlerMethodArgumentResolver {

    /** 仅当参数同时具备 @CurrentUser 注解且类型为 UserSession 时才解析 */
    @Override
    public boolean supportsParameter(MethodParameter parameter) {
        return parameter.hasParameterAnnotation(CurrentUser.class)
                && parameter.getParameterType().equals(UserSession.class);
    }

    /** 直接从 ThreadLocal 中取出当前用户上下文返回 */
    @Override
    public Object resolveArgument(MethodParameter parameter,
                                  ModelAndViewContainer mavContainer,
                                  NativeWebRequest webRequest,
                                  WebDataBinderFactory binderFactory) {
        return UserContextHolder.get();
    }
}
