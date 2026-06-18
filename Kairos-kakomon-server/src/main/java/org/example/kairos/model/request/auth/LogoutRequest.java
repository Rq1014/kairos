package org.example.kairos.model.request.auth;

/**
 * 退出登录请求体。
 */
public class LogoutRequest {
    /** 是否登出全部端,true=同步使所有 refresh token 失效,false=仅当前端 */
    private boolean all = false;

    public boolean isAll() { return all; }
    public void setAll(boolean all) { this.all = all; }
}
