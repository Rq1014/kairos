package org.example.kairos.mapper.auth;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.example.kairos.entity.UserCredentialEntity;

import java.time.LocalDateTime;

/**
 * 用户密码凭证 Mapper,管理用户密码哈希、登录失败计数、账号锁定。
 */
@Mapper
public interface UserCredentialMapper {
    /** 新增用户凭证记录,通常在注册或首次设置密码时调用 */
    int insert(UserCredentialEntity entity);

    /**
     * 查询用户凭证。
     *
     * @param userId 用户 ID
     * @return 凭证实体,不存在返回 null(表示该用户尚未设置密码)
     */
    UserCredentialEntity findByUserId(@Param("userId") Long userId);

    /**
     * 修改密码,同时刷新 updatedAt。
     *
     * @param userId       用户 ID
     * @param passwordHash BCrypt 哈希后的密码
     * @param passwordSalt 历史遗留盐字段,通常传空
     */
    int updatePassword(@Param("userId") Long userId,
                       @Param("passwordHash") String passwordHash,
                       @Param("passwordSalt") String passwordSalt);

    /**
     * 更新登录失败计数和锁定时间。
     *
     * @param userId      用户 ID
     * @param failedCount 累计失败次数
     * @param lockedUntil 锁定截止时间,null 表示未锁定
     */
    int updateFailedCount(@Param("userId") Long userId,
                          @Param("failedCount") int failedCount,
                          @Param("lockedUntil") LocalDateTime lockedUntil);

    /** 登录成功后清零失败计数,解除锁定 */
    int resetFailedCount(@Param("userId") Long userId);

    /** 删除用户密码凭证(用于账号注销,清除密码哈希) */
    int deleteByUserId(@Param("userId") Long userId);
}
