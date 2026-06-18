package org.example.kairos.web.auth;

import jakarta.validation.Valid;
import org.example.kairos.common.Result;
import org.example.kairos.gateway.annotation.CurrentUser;
import org.example.kairos.model.bo.UserSession;
import org.example.kairos.model.request.auth.BindIdentityRequest;
import org.example.kairos.model.request.auth.SetPasswordRequest;
import org.example.kairos.model.request.auth.UnbindIdentityRequest;
import org.example.kairos.model.response.user.UserResponse;
import org.example.kairos.service.auth.BindingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 身份绑定相关接口: 绑定/解绑/设置密码。
 * 全部接口需登录,操作均通过验证码二次确认。
 */
@RestController
@RequestMapping("/api/auth")
public class BindingController {

    @Autowired private BindingService bindingService;

    /** 给当前账号绑定新身份(手机号/邮箱/三方),返回更新后的完整用户信息 */
    @PostMapping("/bindings")
    public Result<UserResponse> bind(@RequestBody @Valid BindIdentityRequest req,
                                     @CurrentUser UserSession s) {
        return Result.ok(bindingService.bind(s.getUserId(),
                req.getIdentityType(), req.getIdentityValue(), req.getCode()));
    }

    /** 解绑身份;需保证用户至少还会留有一种登录方式 */
    @DeleteMapping("/bindings")
    public Result<UserResponse> unbind(@RequestBody @Valid UnbindIdentityRequest req,
                                       @CurrentUser UserSession s) {
        return Result.ok(bindingService.unbind(s.getUserId(),
                req.getIdentityType(), req.getCode()));
    }

    /** 设置或修改密码;改密成功后会撤销该用户全部 refresh token */
    @PostMapping("/password")
    public Result<UserResponse> setPassword(@RequestBody @Valid SetPasswordRequest req,
                                            @CurrentUser UserSession s) {
        return Result.ok(bindingService.setPassword(s.getUserId(),
                req.getOldPassword(), req.getNewPassword(), req.getCode()));
    }
}
