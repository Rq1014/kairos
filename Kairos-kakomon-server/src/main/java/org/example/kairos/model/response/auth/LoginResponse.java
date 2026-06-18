package org.example.kairos.model.response.auth;

import org.example.kairos.model.response.user.UserResponse;

/**
 * 登录/刷新 Token 响应体。
 */
public class LoginResponse {
    /** access token,日常请求使用,默认有效期 7 天 */
    private String accessToken;
    /** refresh token,用于刷新 access token,默认有效期 30 天 */
    private String refreshToken;
    /** access token 过期时长(秒),便于客户端计算过期时间 */
    private long expiresIn;
    /** 是否新注册用户,前端可据此引导新人首次设置 */
    private boolean isNew;
    /** 完整的用户信息,登录后无需再次拉取 */
    private UserResponse user;

    public String getAccessToken() { return accessToken; }
    public void setAccessToken(String accessToken) { this.accessToken = accessToken; }
    public String getRefreshToken() { return refreshToken; }
    public void setRefreshToken(String refreshToken) { this.refreshToken = refreshToken; }
    public long getExpiresIn() { return expiresIn; }
    public void setExpiresIn(long expiresIn) { this.expiresIn = expiresIn; }
    public boolean getIsNew() { return isNew; }
    public void setIsNew(boolean aNew) { isNew = aNew; }
    public UserResponse getUser() { return user; }
    public void setUser(UserResponse user) { this.user = user; }
}
