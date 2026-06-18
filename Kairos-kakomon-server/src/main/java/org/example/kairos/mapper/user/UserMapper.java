package org.example.kairos.mapper.user;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.example.kairos.entity.UserEntity;

/**
 * 用户主表 Mapper。
 */
@Mapper
public interface UserMapper {
    /** 新增用户,返回自增主键 ID 通过 useGeneratedKeys 写回到 entity */
    int insert(UserEntity user);

    /** 通过自增 ID 查询用户 */
    UserEntity findById(@Param("id") Long id);

    /** 通过对外 userNo 查询用户 */
    UserEntity findByUserNo(@Param("userNo") String userNo);

    /**
     * 修改用户状态(冻结/恢复/注销)。
     *
     * @param status 状态码,见 {@link org.example.kairos.common.enums.UserStatus}
     */
    int updateStatus(@Param("id") Long id, @Param("status") int status);

    /**
     * 软删除用户:置 status=DELETED 并写 deleted_at=NOW()。
     * 仅当 deleted_at IS NULL 时生效,用于注销接口幂等。
     *
     * @return 受影响行数,0 表示用户不存在或已注销
     */
    int softDelete(@Param("id") Long id);
}
