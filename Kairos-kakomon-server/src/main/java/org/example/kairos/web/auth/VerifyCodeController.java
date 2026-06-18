package org.example.kairos.web.auth;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.example.kairos.common.Result;
import org.example.kairos.gateway.annotation.PublicApi;
import org.example.kairos.model.request.auth.SendCodeRequest;
import org.example.kairos.model.response.auth.SendCodeResponse;
import org.example.kairos.service.auth.VerifyCodeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 验证码发送接口。
 * 公开接口,但服务端有冷却(60s)、日上限(身份/IP 维度)等限流策略。
 */
@RestController
@RequestMapping("/api/auth")
@PublicApi
public class VerifyCodeController {

    @Autowired private VerifyCodeService verifyCodeService;

    /**
     * 发送验证码。
     * 响应中的 debugCode 字段仅本地/测试环境返回明文,便于排查;生产环境为 null。
     */
    @PostMapping("/verify-code")
    public Result<SendCodeResponse> sendCode(@RequestBody @Valid SendCodeRequest req,
                                             HttpServletRequest http) {
        String ip = clientIp(http);
        VerifyCodeService.SendResult r = verifyCodeService.sendCode(
                req.getIdentityType(), req.getIdentityValue(), req.getScene(), ip);
        SendCodeResponse resp = new SendCodeResponse();
        resp.setSent(r.sent);
        resp.setCooldownSeconds(r.cooldownSeconds);
        resp.setDebugCode(r.debugCode);
        return Result.ok(resp);
    }

    private String clientIp(HttpServletRequest req) {
        String xff = req.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) return xff.split(",")[0].trim();
        return req.getRemoteAddr();
    }
}
