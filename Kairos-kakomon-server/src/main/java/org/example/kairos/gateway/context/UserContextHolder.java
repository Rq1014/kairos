package org.example.kairos.gateway.context;

import org.example.kairos.common.ResultCode;
import org.example.kairos.common.exception.BizException;
import org.example.kairos.model.bo.UserSession;

/**
 * 用户上下文持有者(ThreadLocal 实现)。
 * <p>
 * AuthInterceptor 在请求入口将 {@link UserSession} 写入,
 * Controller / Service 在处理过程中可随时通过 {@link #get()} 或 {@link #require()} 读取,
 * 请求结束后必须 {@link #clear()} 防止线程复用导致的串号。
 */
public final class UserContextHolder {
    private static final ThreadLocal<UserSession> CTX = new ThreadLocal<>();

    private UserContextHolder() {}

    /** 写入当前请求的用户上下文 */
    public static void set(UserSession s) { CTX.set(s); }

    /** 读取当前请求的用户上下文,未登录返回 null */
    public static UserSession get() { return CTX.get(); }

    /**
     * 强制读取上下文,未登录直接抛 {@link BizException}({@link ResultCode#UNAUTHORIZED})。
     * 适合在确定接口需要登录的场景使用。
     */
    public static UserSession require() {
        UserSession s = CTX.get();
        if (s == null) throw new BizException(ResultCode.UNAUTHORIZED);
        return s;
    }

    /** 强制读取当前用户 ID,未登录抛异常 */
    public static long requireUserId() {
        return require().getUserId();
    }

    /** 清理 ThreadLocal,必须在请求结束时调用,否则会发生上下文串号 */
    public static void clear() { CTX.remove(); }
}
