package org.example.kairos.model.bo;

/**
 * 用户会话 BO,从 JWT Token 解析得出的关键信息。
 * 由 {@link org.example.kairos.gateway.interceptor.AuthInterceptor} 写入 ThreadLocal,
 * 供业务层通过 {@link org.example.kairos.gateway.context.UserContextHolder} 读取。
 */
public class UserSession {
    /** 用户主键 ID */
    private Long userId;
    /** 用户对外编号(如 u17xxxxx),用于日志展示和无需暴露内部 ID 的场景 */
    private String userNo;
    /** JWT Token ID,用于黑名单判定/单点登出/refresh token 关联 */
    private String jti;

    public UserSession() {}

    public UserSession(Long userId, String userNo, String jti) {
        this.userId = userId;
        this.userNo = userNo;
        this.jti = jti;
    }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public String getUserNo() { return userNo; }
    public void setUserNo(String userNo) { this.userNo = userNo; }
    public String getJti() { return jti; }
    public void setJti(String jti) { this.jti = jti; }
}
