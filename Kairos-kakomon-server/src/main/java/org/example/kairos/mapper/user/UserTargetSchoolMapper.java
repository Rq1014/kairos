package org.example.kairos.mapper.user;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.example.kairos.entity.UserTargetSchoolEntity;

import java.util.List;

/**
 * 用户目标学校 Mapper。
 * <p>
 * 业务采用"全量替换"策略: 更新时先 deleteByUserId 再 batchInsert,
 * 因此不需要 update / delete 单条接口。
 */
@Mapper
public interface UserTargetSchoolMapper {
    /** 单条插入,目前未在业务中使用,留作扩展 */
    int insert(UserTargetSchoolEntity entity);

    /** 批量插入,减少与 DB 的交互次数 */
    int batchInsert(@Param("list") List<UserTargetSchoolEntity> list);

    /** 查询用户的所有目标学校,按 priority 升序 */
    List<UserTargetSchoolEntity> findByUserId(@Param("userId") Long userId);

    /** 删除用户的全部目标学校(配合全量替换策略) */
    int deleteByUserId(@Param("userId") Long userId);
}
