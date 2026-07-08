package org.example.kairos.mapper.dict;

import org.apache.ibatis.annotations.Mapper;
import org.example.kairos.entity.MajorSubjectEntity;

import java.util.List;

/** 专业-科目关联 Mapper。 */
@Mapper
public interface MajorSubjectMapper {
    /** 全表扫描，供 tree 一次性构建 (uni,grad,major)->subjects 映射 */
    List<MajorSubjectEntity> findAll();
}
