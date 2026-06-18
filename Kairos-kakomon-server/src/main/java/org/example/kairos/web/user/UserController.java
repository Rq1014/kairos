package org.example.kairos.web.user;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.example.kairos.common.Result;
import org.example.kairos.gateway.annotation.CurrentUser;
import org.example.kairos.model.bo.UserSession;
import org.example.kairos.model.request.user.PatchProfileRequest;
import org.example.kairos.model.response.user.DeactivateResponse;
import org.example.kairos.model.response.user.UserResponse;
import org.example.kairos.service.auth.TokenService;
import org.example.kairos.service.user.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 当前用户信息接口。
 */
@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired private UserService userService;
    @Autowired private TokenService tokenService;

    /** 获取当前登录用户的完整聚合信息(含 profile/identities/targetSchools 等) */
    @GetMapping("/me")
    public Result<UserResponse> me(@CurrentUser UserSession s) {
        return Result.ok(userService.buildUserResponse(s.getUserId()));
    }

    /** 增量更新用户资料(只更新请求中非空的字段) */
    @PatchMapping("/me")
    public Result<UserResponse> patch(@CurrentUser UserSession s,
                                      @RequestBody @Valid PatchProfileRequest req) {
        return Result.ok(userService.patchProfile(s.getUserId(), req));
    }

    /**
     * 注销当前账号(软删除)。
     * <p>
     * {@link org.example.kairos.gateway.interceptor.AuthInterceptor} 已对
     * {@code DELETE /api/users/me} 跳过滑动续签,避免响应头返回新 token 造成
     * "刚注销又拿到新 token"的混乱。
     */
    @DeleteMapping("/me")
    public Result<DeactivateResponse> deactivate(@CurrentUser UserSession s, HttpServletRequest req) {
        // access TTL 取上界即可:即使略大于真实剩余,也只是黑名单多保留一会儿,无副作用
        long remaining = tokenService.getAccessTtlSeconds();
        return Result.ok(userService.deactivate(
                s.getUserId(),
                s.getJti(),
                remaining,
                clientIp(req),
                req.getHeader("User-Agent"),
                req.getHeader("X-Device-Id")));
    }

    /** 获取真实客户端 IP,优先从 X-Forwarded-For 取首个 IP */
    private String clientIp(HttpServletRequest req) {
        String xff = req.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) return xff.split(",")[0].trim();
        return req.getRemoteAddr();
    }
}
