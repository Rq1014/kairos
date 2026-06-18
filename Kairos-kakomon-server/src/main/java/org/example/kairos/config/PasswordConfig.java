package org.example.kairos.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * 密码编码器配置。
 * <p>
 * 全局注入 BCrypt 实现,用于:
 * <ul>
 *   <li>注册/修改密码时对明文密码进行哈希</li>
 *   <li>登录时校验明文密码与数据库哈希</li>
 * </ul>
 * BCrypt 强度通过 {@link PasswordProperties#getBcryptStrength()} 配置,默认 10。
 */
@Configuration
public class PasswordConfig {

    /**
     * 创建 BCrypt 密码编码器 Bean。
     *
     * @param props 密码相关配置
     * @return 全局共用的 PasswordEncoder
     */
    @Bean
    public PasswordEncoder passwordEncoder(PasswordProperties props) {
        return new BCryptPasswordEncoder(props.getBcryptStrength());
    }
}
