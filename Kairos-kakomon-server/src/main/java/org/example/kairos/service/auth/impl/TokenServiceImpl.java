package org.example.kairos.service.auth.impl;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jws;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.http.HttpServletResponse;
import org.example.kairos.common.constant.CacheKeys;
import org.example.kairos.config.JwtProperties;
import org.example.kairos.model.bo.UserSession;
import org.example.kairos.service.auth.TokenService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Date;
import java.util.Set;
import java.util.UUID;

/**
 * Token 服务实现。
 * <p>
 * 设计要点:
 * <ul>
 *   <li>access token 使用 HS256 JWT,默认 7 天,无状态</li>
 *   <li>access token 吊销通过 Redis 黑名单(jti 为 key,TTL 为 token 剩余有效期)</li>
 *   <li>refresh token 使用"userId:jti"格式存入 Redis 白名单,默认 30 天,使用即旋转</li>
 *   <li>密钥不足 32 字节时填充至 32 字节,避免 HS256 校验失败</li>
 * </ul>
 */
@Service
public class TokenServiceImpl implements TokenService {

    private static final Logger log = LoggerFactory.getLogger(TokenServiceImpl.class);

    private final JwtProperties jwtProps;
    private final StringRedisTemplate redis;
    private final SecretKey signingKey;

    @Autowired
    public TokenServiceImpl(JwtProperties jwtProps, StringRedisTemplate redis) {
        this.jwtProps = jwtProps;
        this.redis = redis;
        byte[] keyBytes = jwtProps.getSecret().getBytes(StandardCharsets.UTF_8);
        if (keyBytes.length < 32) {
            byte[] padded = new byte[32];
            System.arraycopy(keyBytes, 0, padded, 0, keyBytes.length);
            for (int i = keyBytes.length; i < 32; i++) padded[i] = (byte) 'k';
            keyBytes = padded;
        }
        this.signingKey = Keys.hmacShaKeyFor(keyBytes);
    }

    @Override
    public String issueAccessToken(Long userId, String userNo, String jti) {
        long now = System.currentTimeMillis();
        long expMillis = now + jwtProps.getAccessTtlSeconds() * 1000L;
        return Jwts.builder()
                .id(jti)
                .issuer(jwtProps.getIssuer())
                .subject(String.valueOf(userId))
                .claim("uno", userNo)
                .issuedAt(new Date(now))
                .expiration(new Date(expMillis))
                .signWith(signingKey, Jwts.SIG.HS256)
                .compact();
    }

    @Override
    public UserSession parseAccessToken(String token) {
        try {
            Jws<Claims> jws = Jwts.parser()
                    .verifyWith(signingKey)
                    .build()
                    .parseSignedClaims(token);
            Claims claims = jws.getPayload();
            String jti = claims.getId();
            if (jti != null) {
                Boolean revoked = redis.hasKey(CacheKeys.tokenRevoked(jti));
                if (Boolean.TRUE.equals(revoked)) {
                    return null;
                }
            }
            return new UserSession(
                    Long.valueOf(claims.getSubject()),
                    claims.get("uno", String.class),
                    jti
            );
        } catch (Exception e) {
            log.debug("invalid token: {}", e.getMessage());
            return null;
        }
    }

    @Override
    public String issueRefreshToken(Long userId) {
        String jti = UUID.randomUUID().toString().replace("-", "");
        String value = userId + ":" + jti;
        redis.opsForValue().set(
                CacheKeys.refreshToken(userId, jti),
                value,
                Duration.ofSeconds(jwtProps.getRefreshTtlSeconds())
        );
        return value;
    }

    @Override
    public Long validateAndConsumeRefreshToken(String refreshToken) {
        if (refreshToken == null || !refreshToken.contains(":")) return null;
        String[] parts = refreshToken.split(":", 2);
        Long userId;
        try {
            userId = Long.valueOf(parts[0]);
        } catch (NumberFormatException e) {
            return null;
        }
        String key = CacheKeys.refreshToken(userId, parts[1]);
        String stored = redis.opsForValue().get(key);
        if (stored == null) return null;
        redis.delete(key);
        return userId;
    }

    @Override
    public void revokeAccessToken(String jti, long remainingTtlSeconds) {
        if (jti == null || remainingTtlSeconds <= 0) return;
        redis.opsForValue().set(CacheKeys.tokenRevoked(jti), "1", Duration.ofSeconds(remainingTtlSeconds));
    }

    @Override
    public void revokeAllRefreshTokens(Long userId) {
        Set<String> keys = redis.keys(CacheKeys.refreshTokenAll(userId));
        if (keys != null && !keys.isEmpty()) {
            redis.delete(keys);
        }
    }

    @Override
    public void revokeRefreshToken(Long userId, String jti) {
        redis.delete(CacheKeys.refreshToken(userId, jti));
    }

    @Override
    public long getAccessTtlSeconds() {
        return jwtProps.getAccessTtlSeconds();
    }

    @Override
    public void slideSession(UserSession session, HttpServletResponse response) {
        if (session == null || response == null) return;
        try {
            String newJti = UUID.randomUUID().toString().replace("-", "");
            String newAccess = issueAccessToken(session.getUserId(), session.getUserNo(), newJti);
            String newRefresh = issueRefreshToken(session.getUserId());
            response.setHeader("X-New-Access-Token", newAccess);
            response.setHeader("X-New-Refresh-Token", newRefresh);
        } catch (Exception e) {
            log.warn("slideSession failed for userId={}: {}", session.getUserId(), e.getMessage());
        }
    }
}
