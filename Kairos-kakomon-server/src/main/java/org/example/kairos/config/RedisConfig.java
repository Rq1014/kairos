package org.example.kairos.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.connection.RedisStandaloneConfiguration;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.serializer.StringRedisSerializer;

/**
 * Redis 连接与模板配置。
 * <p>
 * 显式声明 ConnectionFactory 是为了规避 Spring Boot 4 在某些场景下不会自动装配的问题。
 * 当前项目所有 Redis Key/Value 均使用 String 序列化,统一字符集避免乱码。
 */
@Configuration
public class RedisConfig {

    /** Redis 主机,从 application.yml 读取,默认本地 */
    @Value("${spring.data.redis.host:127.0.0.1}")
    private String host;

    /** Redis 端口,默认 6379 */
    @Value("${spring.data.redis.port:6379}")
    private int port;

    /** Redis 密码,默认空(本地无密码) */
    @Value("${spring.data.redis.password:}")
    private String password;

    /** Redis 数据库编号,默认 0 */
    @Value("${spring.data.redis.database:0}")
    private int database;

    /** 创建 Lettuce 连接工厂(线程安全、支持异步) */
    @Bean
    public RedisConnectionFactory redisConnectionFactory() {
        RedisStandaloneConfiguration cfg = new RedisStandaloneConfiguration(host, port);
        cfg.setDatabase(database);
        if (password != null && !password.isBlank()) {
            cfg.setPassword(password);
        }
        return new LettuceConnectionFactory(cfg);
    }

    /**
     * 通用 RedisTemplate,Key/Value 全部使用 String 序列化器,
     * 适合直接存取字符串或 JSON 字符串,避免 JDK 序列化导致的可读性问题。
     */
    @Bean
    public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory factory) {
        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(factory);

        StringRedisSerializer stringSerializer = new StringRedisSerializer();

        template.setKeySerializer(stringSerializer);
        template.setHashKeySerializer(stringSerializer);
        template.setValueSerializer(stringSerializer);
        template.setHashValueSerializer(stringSerializer);
        template.afterPropertiesSet();
        return template;
    }

    /**
     * 简化的 String-only 模板,业务侧最常使用,
     * 用于验证码、Token 黑白名单、计数器等纯字符串场景。
     */
    @Bean
    public StringRedisTemplate stringRedisTemplate(RedisConnectionFactory factory) {
        return new StringRedisTemplate(factory);
    }
}
