package org.example.kairos.service.user;

import org.example.kairos.entity.UserEntity;
import org.example.kairos.entity.UserProfileEntity;
import org.example.kairos.model.request.user.PatchProfileRequest;
import org.example.kairos.model.request.user.UpdateTargetSchoolsRequest;
import org.example.kairos.model.response.user.DeactivateResponse;
import org.example.kairos.model.response.user.UserResponse;

/**
 * 用户领域服务,提供用户创建、查询、资料更新、目标学校管理等能力。
 */
public interface UserService {
    /**
     * 创建新用户(同事务初始化 user 与 user_profile)。
     *
     * @param registerFrom 注册来源(phone/email/wechat/...)
     * @return 新用户 ID
     */
    Long createUser(String registerFrom);

    /** 通过对外 userNo 查询用户 */
    UserEntity findByUserNo(String userNo);

    /** 通过自增 ID 查询用户 */
    UserEntity findById(Long userId);

    /** 查询用户 profile,可能为 null */
    UserProfileEntity findProfile(Long userId);

    /**
     * 组装完整的 {@link UserResponse}: 主表 + profile + identities + targetSchools + 凭证标记。
     */
    UserResponse buildUserResponse(Long userId);

    /** 增量更新 profile,返回更新后的完整用户聚合 */
    UserResponse patchProfile(Long userId, PatchProfileRequest req);

    /** 全量替换目标学校列表,返回更新后的完整用户聚合 */
    UserResponse replaceTargetSchools(Long userId, UpdateTargetSchoolsRequest req);

    /**
     * 注销当前用户(软删除)。
     * <p>
     * 流程:
     * <ol>
     *   <li>校验账号当前状态:不存在/已注销则抛 {@code USER_ALREADY_DELETED}</li>
     *   <li>物理删除登录身份(user_identity)、密码凭证(user_credential)、个人资料(user_profile)、目标学校(user_target_school)</li>
     *   <li>主表 user 软删:status=DELETED + deleted_at=NOW()</li>
     *   <li>事务外作废 access(jti 黑名单) + 全清 refresh 白名单</li>
     *   <li>写一条 login_audit 记录(method=DEACTIVATE, success=1)</li>
     * </ol>
     *
     * @param userId                  当前用户 ID
     * @param accessJti               当前请求 access token 的 jti(用于进黑名单)
     * @param accessRemainingSeconds  access token 剩余有效期(用于黑名单 TTL)
     * @param clientIp                客户端 IP(审计字段,可空)
     * @param userAgent               UA(审计字段,可空)
     * @param deviceId                设备 ID(审计字段,可空)
     */
    DeactivateResponse deactivate(Long userId,
                                  String accessJti,
                                  long accessRemainingSeconds,
                                  String clientIp,
                                  String userAgent,
                                  String deviceId);
}
