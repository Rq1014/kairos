package org.example.kairos.web.user;

import jakarta.validation.Valid;
import org.example.kairos.common.Result;
import org.example.kairos.gateway.annotation.CurrentUser;
import org.example.kairos.model.bo.UserSession;
import org.example.kairos.model.request.user.UpdateTargetSchoolsRequest;
import org.example.kairos.model.response.user.UserResponse;
import org.example.kairos.service.user.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 当前用户的目标学校管理接口。
 * 全量替换语义,上限 20 所。
 */
@RestController
@RequestMapping("/api/users/me")
public class TargetSchoolController {

    @Autowired private UserService userService;

    /**
     * 全量替换当前用户的目标学校列表;返回更新后的完整用户信息。
     */
    @PutMapping("/target-schools")
    public Result<UserResponse> replace(@CurrentUser UserSession s,
                                        @RequestBody @Valid UpdateTargetSchoolsRequest req) {
        return Result.ok(userService.replaceTargetSchools(s.getUserId(), req));
    }
}
