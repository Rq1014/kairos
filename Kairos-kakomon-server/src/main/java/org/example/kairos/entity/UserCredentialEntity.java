package org.example.kairos.entity;

import java.time.LocalDateTime;

/**
 * 用户密码凭证实体,对应 user_credential 表。
 * <p>
 * 单独建表存放密码相关字段,避免主表混入安全敏感数据。
 * 通过验证码登录的用户可能没有该记录(passwordHash 为空时表示未设置密码)。
 */
public class UserCredentialEntity {
    /** 用户 ID,主键(每个用户只有一条凭证记录) */
    private Long userId;
    /** BCrypt 哈希后的密码,长度通常为 60 字符 */
    private String passwordHash;
    /** 历史遗留盐字段,BCrypt 已自带盐,该字段保留为后续扩展 */
    private String passwordSalt;
    /** 连续登录失败次数,超过阈值触发账号锁定 */
    private Integer failedCount;
    /** 锁定截止时间,该时间之后允许重新尝试登录 */
    private LocalDateTime lockedUntil;
    /** 最近更新时间 */
    private LocalDateTime updatedAt;

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }
    public String getPasswordSalt() { return passwordSalt; }
    public void setPasswordSalt(String passwordSalt) { this.passwordSalt = passwordSalt; }
    public Integer getFailedCount() { return failedCount; }
    public void setFailedCount(Integer failedCount) { this.failedCount = failedCount; }
    public LocalDateTime getLockedUntil() { return lockedUntil; }
    public void setLockedUntil(LocalDateTime lockedUntil) { this.lockedUntil = lockedUntil; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
