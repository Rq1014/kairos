package org.example.kairos.service.auth;

import jakarta.servlet.http.HttpServletResponse;
import org.example.kairos.model.bo.UserSession;

/**
 * Token 服务: 负责 access token / refresh token 的签发、解析与吊销。
 * <p>
 * 实现:
 * <ul>
 *   <li>access token: HS256 JWT,默认 30 天,无状态;吊销通过 Redis 黑名单</li>
 *   <li>refresh token: HS256 JWT,默认 30 天,Redis 白名单(校验后即旋转替换)</li>
 *   <li>用户登出会同时使 access token 进黑名单 + 删除 refresh token 白名单</li>
 *   <li>滑动续签: 任一已认证请求都会调用 {@link #slideSession} 重签 access+refresh
 *       并通过响应头返还,保证 30 天有效期从最后一次活跃开始计算</li>
 * </ul>
 */
public interface TokenService {
    /** 签发 access token,返回 token 字符串 */
    String issueAccessToken(Long userId, String userNo, String jti);

    /** 解析 access token,无效或在黑名单内返回 null */
    UserSession parseAccessToken(String token);

    /** 签发 refresh token,同时写入 Redis 白名单 */
    String issueRefreshToken(Long userId);

    /** 校验 refresh token 是否在白名单内,有效则消费(单次使用),返回 user_id;无效返回 null */
    Long validateAndConsumeRefreshToken(String refreshToken);

    /** 撤销 access token: 将 jti 加入黑名单,TTL 为 access token 剩余有效期 */
    void revokeAccessToken(String jti, long remainingTtlSeconds);

    /** 删除指定用户的全部 refresh token(用于"全端登出") */
    void revokeAllRefreshTokens(Long userId);

    /** 删除指定 refresh token(用于"仅当前端登出") */
    void revokeRefreshToken(Long userId, String jti);

    /** 获取 access token 配置的有效期(秒) */
    long getAccessTtlSeconds();

    /**
     * 滑动续签:基于已解析的 session 重签新的 access+refresh,通过响应头
     * {@code X-New-Access-Token} / {@code X-New-Refresh-Token} 返还前端。
     * <p>
     * 旧 access token 不进黑名单(避免请求乱序导致旧 token 立刻失效,JWT 自然过期);
     * 旧 refresh 也不主动撤销(让其自然过期或下次客户端真的用旧 refresh 时一次性消费)。
     */
    void slideSession(UserSession session, HttpServletResponse response);
}
