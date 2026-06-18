package org.example.kairos.web.auth;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.example.kairos.common.Result;
import org.example.kairos.gateway.annotation.CurrentUser;
import org.example.kairos.gateway.annotation.PublicApi;
import org.example.kairos.model.bo.UserSession;
import org.example.kairos.model.request.auth.LoginByCodeRequest;
import org.example.kairos.model.request.auth.LoginByPasswordRequest;
import org.example.kairos.model.request.auth.LogoutRequest;
import org.example.kairos.model.request.auth.RefreshTokenRequest;
import org.example.kairos.model.response.auth.LoginResponse;
import org.example.kairos.service.auth.LoginService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * 登录相关接口: 验证码登录、密码登录、Token 刷新、登出、身份是否注册检查。
 */
@RestController
@RequestMapping("/api/auth")
public class LoginController {

    @Autowired private LoginService loginService;

    /** 验证码登录(身份不存在时自动注册新用户) */
    @PostMapping("/login/code")
    @PublicApi
    public Result<LoginResponse> loginByCode(@RequestBody @Valid LoginByCodeRequest req, HttpServletRequest http) {
        return Result.ok(loginService.loginByCode(
                req.getIdentityType(), req.getIdentityValue(), req.getCode(),
                req.getDeviceId(), clientIp(http), http.getHeader("User-Agent")));
    }

    /** 密码登录(身份必须已存在并已设置密码) */
    @PostMapping("/login/password")
    @PublicApi
    public Result<LoginResponse> loginByPassword(@RequestBody @Valid LoginByPasswordRequest req, HttpServletRequest http) {
        return Result.ok(loginService.loginByPassword(
                req.getIdentityType(), req.getIdentityValue(), req.getPassword(),
                req.getDeviceId(), clientIp(http), http.getHeader("User-Agent")));
    }

    /** 通过 refresh token 刷新 access token,采用滚动刷新策略 */
    @PostMapping("/refresh")
    @PublicApi
    public Result<LoginResponse> refresh(@RequestBody @Valid RefreshTokenRequest req) {
        return Result.ok(loginService.refresh(req.getRefreshToken()));
    }

    /** 登出,可指定是否全端登出(req.all=true 撤销所有 refresh token) */
    @PostMapping("/logout")
    public Result<Map<String, Object>> logout(@RequestBody(required = false) LogoutRequest req,
                                              @CurrentUser UserSession session) {
        boolean all = req != null && req.isAll();
        loginService.logout(session.getUserId(), session.getJti(), null, all,
                3600);
        return Result.ok(Map.of("loggedOut", true));
    }

    /** 检查身份是否已注册,前端用于"密码登录"按钮的可点状态 */
    @GetMapping("/identity/check")
    @PublicApi
    public Result<Map<String, Object>> checkIdentity(@RequestParam("type") String type,
                                                     @RequestParam("value") String value) {
        boolean registered = loginService.isRegistered(type, value);
        return Result.ok(Map.of("registered", registered));
    }

    /** 获取真实客户端 IP,优先从 X-Forwarded-For 取首个 IP */
    private String clientIp(HttpServletRequest req) {
        String xff = req.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) return xff.split(",")[0].trim();
        return req.getRemoteAddr();
    }
}
