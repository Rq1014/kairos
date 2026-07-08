package org.example.kairos.mapper.question;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.example.kairos.entity.ExamPaperEntity;

import java.util.List;

/** 试卷 Mapper。 */
@Mapper
public interface ExamPaperMapper {
    /** 通过对外 code 查单份试卷 */
    ExamPaperEntity findByCode(@Param("code") String code);

    /** 按大学+研究科查试卷列表(模考首页用) */
    List<ExamPaperEntity> findByScope(@Param("universityCode") String universityCode,
                                      @Param("gradSchoolCode") String gradSchoolCode,
                                      @Param("majorCode") String majorCode);
}
