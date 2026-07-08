package org.example.kairos.mapper.dict;

import org.apache.ibatis.annotations.Mapper;
import org.example.kairos.entity.SubjectEntity;

import java.util.List;

/** 科目字典 Mapper。 */
@Mapper
public interface SubjectMapper {
    /** 全表扫描（status=1），供 tree 构建与校验 */
    List<SubjectEntity> findAll();
}
