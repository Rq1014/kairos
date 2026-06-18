package org.example.kairos.mapper.user;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.example.kairos.entity.UserProfileEntity;

/**
 * 用户资料 Mapper,管理 user_profile 表(昵称、头像、统计指标等)。
 */
@Mapper
public interface UserProfileMapper {
    /** 新建资料记录,通常与用户注册同事务执行 */
    int insert(UserProfileEntity profile);

    /** 按用户 ID 查询资料,返回 null 表示资料尚未初始化 */
    UserProfileEntity findByUserId(@Param("userId") Long userId);

    /** 增量更新,使用动态 SQL,只更新非空字段 */
    int update(UserProfileEntity profile);

    /** 删除用户资料(用于账号注销,清除昵称/头像/统计指标等敏感数据) */
    int deleteByUserId(@Param("userId") Long userId);
}
