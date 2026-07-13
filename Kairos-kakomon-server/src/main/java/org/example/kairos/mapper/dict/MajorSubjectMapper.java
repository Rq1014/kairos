package org.example.kairos.mapper.dict;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.example.kairos.entity.MajorSubjectEntity;

import java.util.List;

/** 专业-科目关联 Mapper。 */
@Mapper
public interface MajorSubjectMapper {
    /** 全表扫描，供 tree 一次性构建 (uni,grad,major)->subjects 映射 */
    List<MajorSubjectEntity> findAll();

    /** 按四元查 major_subject id, 无则 null */
    Long findId(@Param("universityCode") String universityCode,
                @Param("gradSchoolCode") String gradSchoolCode,
                @Param("majorCode") String majorCode,
                @Param("subjectCode") String subjectCode);
}
