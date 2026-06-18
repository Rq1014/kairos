package org.example.kairos.entity;

import java.time.LocalDateTime;

/**
 * 用户主表实体,对应 user 表。
 * <p>
 * 用户主表只存放与登录身份解耦的核心字段,
 * 个人资料(昵称、头像等)在 {@link UserProfileEntity},
 * 登录身份(手机号、邮箱、三方)在 {@link UserIdentityEntity},
 * 登录密码在 {@link UserCredentialEntity}。
 */
public class UserEntity {
    /** 主键 ID */
    private Long id;
    /** 用户对外编号(如 u17xxxxx),用于对外展示和接口返回,避免暴露自增 ID */
    private String userNo;
    /** 用户状态,见 {@link org.example.kairos.common.enums.UserStatus},1=ACTIVE 2=FROZEN 3=DELETED */
    private Integer status;
    /** 注册来源(phone/email/wechat/apple/line),便于做渠道分析 */
    private String registerFrom;
    /** 创建时间 */
    private LocalDateTime createdAt;
    /** 最近更新时间 */
    private LocalDateTime updatedAt;
    /** 软删除时间,非空表示已注销 */
    private LocalDateTime deletedAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getUserNo() { return userNo; }
    public void setUserNo(String userNo) { this.userNo = userNo; }
    public Integer getStatus() { return status; }
    public void setStatus(Integer status) { this.status = status; }
    public String getRegisterFrom() { return registerFrom; }
    public void setRegisterFrom(String registerFrom) { this.registerFrom = registerFrom; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    public LocalDateTime getDeletedAt() { return deletedAt; }
    public void setDeletedAt(LocalDateTime deletedAt) { this.deletedAt = deletedAt; }
}
