package org.example.kairos.mapper.dict;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.example.kairos.entity.MajorEntity;

import java.util.List;

/**
 * 专业字典 Mapper,提供专业查询能力。
 */
@Mapper
public interface MajorMapper {
    /** 按所属研究科 ID 查询所有专业 */
    List<MajorEntity> findByGradSchoolId(@Param("gradSchoolId") Long gradSchoolId);

    /** 全表扫描,用于构建大学/研究科/专业树形数据 */
    List<MajorEntity> findAll();

    /** 通过(研究科 ID, 专业 code)精确定位单条记录 */
    MajorEntity findByGradSchoolIdAndCode(@Param("gradSchoolId") Long gradSchoolId,
                                          @Param("code") String code);
}
