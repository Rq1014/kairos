package org.example.kairos.mapper.dict;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.example.kairos.entity.GradSchoolEntity;

import java.util.List;

/**
 * 研究科字典 Mapper,提供研究科查询能力。
 */
@Mapper
public interface GradSchoolMapper {
    /** 按所属大学 ID 查询所有研究科 */
    List<GradSchoolEntity> findByUniversityId(@Param("universityId") Long universityId);

    /** 全表扫描,用于构建大学/研究科/专业树形数据 */
    List<GradSchoolEntity> findAll();

    /** 通过(大学 ID, 研究科 code)精确定位单条记录 */
    GradSchoolEntity findByUniversityIdAndCode(@Param("universityId") Long universityId,
                                               @Param("code") String code);

    /**
     * 通过(大学 ID, 日文名)定位记录,
     * 用于兼容前端使用 nameJp 作为研究科 key 传入的场景。
     */
    GradSchoolEntity findByUniversityIdAndNameJp(@Param("universityId") Long universityId,
                                                 @Param("nameJp") String nameJp);
}
