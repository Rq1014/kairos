package org.example.kairos.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * JWT 配置属性,绑定 application.yml 的 auth.jwt.* 节点。
 * <p>
 * 业务规则:
 * <ul>
 *   <li>access token 有效期 30 天,日常请求使用;每次请求服务端会滑动续签</li>
 *   <li>refresh token 有效期 30 天,客户端冷启动 access 失效时兜底</li>
 *   <li>secret 至少 32 字节,生产环境务必通过环境变量覆盖</li>
 * </ul>
 */
@Component
@ConfigurationProperties(prefix = "auth.jwt")
public class JwtProperties {
    /** HS256 签名密钥,长度 ≥ 32 字节;默认值仅用于本地开发,生产必须替换 */
    private String secret = "kakomon-please-change-me-in-production-32bytes-min-length";
    /** access token 有效期(秒),默认 30 天 */
    private long accessTtlSeconds = 30L * 24 * 3600;
    /** refresh token 有效期(秒),默认 30 天 */
    private long refreshTtlSeconds = 30L * 24 * 3600;
    /** JWT 签发方,写入 iss claim,用于多服务共用 token 时区分来源 */
    private String issuer = "kakomon";

    public String getSecret() { return secret; }
    public void setSecret(String secret) { this.secret = secret; }
    public long getAccessTtlSeconds() { return accessTtlSeconds; }
    public void setAccessTtlSeconds(long accessTtlSeconds) { this.accessTtlSeconds = accessTtlSeconds; }
    public long getRefreshTtlSeconds() { return refreshTtlSeconds; }
    public void setRefreshTtlSeconds(long refreshTtlSeconds) { this.refreshTtlSeconds = refreshTtlSeconds; }
    public String getIssuer() { return issuer; }
    public void setIssuer(String issuer) { this.issuer = issuer; }
}
