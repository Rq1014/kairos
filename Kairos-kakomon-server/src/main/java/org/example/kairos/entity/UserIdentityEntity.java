package org.example.kairos.entity;

import java.time.LocalDateTime;

/**
 * 用户身份实体,对应 user_identity 表。
 * <p>
 * 一个用户(user)可绑定多种身份,实现"手机号+邮箱+多个三方"统一登录。
 * 表上存在唯一约束 uk_type_value(identity_type, identity_value),
 * 即同一手机号或邮箱不能被多个 user 同时绑定。
 */
public class UserIdentityEntity {
    /** 主键 ID */
    private Long id;
    /** 关联的用户 ID,对应 {@link UserEntity#getId()} */
    private Long userId;
    /** 身份类型,见 {@link org.example.kairos.common.enums.IdentityType} */
    private String identityType;
    /** 身份值: 手机号/邮箱/三方 openid 等 */
    private String identityValue;
    /** 是否已验证,1=已验证(已通过验证码) 0=未验证 */
    private Integer verified;
    /** 是否主身份,1=是 0=否,主身份在用户资料展示时优先 */
    private Integer isPrimary;
    /** 身份绑定时间 */
    private LocalDateTime boundAt;
    /** 该身份最近一次成功登录时间 */
    private LocalDateTime lastLoginAt;
    /** 创建时间 */
    private LocalDateTime createdAt;
    /** 更新时间 */
    private LocalDateTime updatedAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public String getIdentityType() { return identityType; }
    public void setIdentityType(String identityType) { this.identityType = identityType; }
    public String getIdentityValue() { return identityValue; }
    public void setIdentityValue(String identityValue) { this.identityValue = identityValue; }
    public Integer getVerified() { return verified; }
    public void setVerified(Integer verified) { this.verified = verified; }
    public Integer getIsPrimary() { return isPrimary; }
    public void setIsPrimary(Integer isPrimary) { this.isPrimary = isPrimary; }
    public LocalDateTime getBoundAt() { return boundAt; }
    public void setBoundAt(LocalDateTime boundAt) { this.boundAt = boundAt; }
    public LocalDateTime getLastLoginAt() { return lastLoginAt; }
    public void setLastLoginAt(LocalDateTime lastLoginAt) { this.lastLoginAt = lastLoginAt; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
