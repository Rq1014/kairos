package org.example.kairos.model.request.auth;

import jakarta.validation.constraints.NotBlank;

/**
 * 刷新 Token 请求体。
 * 客户端在 access token 临近过期时调用,拿新的 access token 与 refresh token。
 */
public class RefreshTokenRequest {
    /** refresh token,从登录响应中获取 */
    @NotBlank
    private String refreshToken;

    public String getRefreshToken() { return refreshToken; }
    public void setRefreshToken(String refreshToken) { this.refreshToken = refreshToken; }
}
