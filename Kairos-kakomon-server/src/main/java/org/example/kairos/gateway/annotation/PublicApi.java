package org.example.kairos.gateway.annotation;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * 公开接口标注。
 * <p>
 * 系统默认所有 /api/** 接口都需要登录,使用 {@code @PublicApi}
 * 标注的方法或类可被未登录用户访问(典型如登录、注册、字典查询)。
 * 由 {@link org.example.kairos.gateway.interceptor.LoginRequiredInterceptor} 识别。
 */
@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
public @interface PublicApi {
}
