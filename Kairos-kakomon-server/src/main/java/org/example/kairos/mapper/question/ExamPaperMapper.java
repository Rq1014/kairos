package org.example.kairos.mapper.question;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.example.kairos.entity.ExamPaperEntity;
import org.example.kairos.model.bo.PaperScopeRow;

import java.util.List;

/** 试卷 Mapper。 */
@Mapper
public interface ExamPaperMapper {
    /** 通过对外 code 查单份试卷 */
    ExamPaperEntity findByCode(@Param("code") String code);

    /**
     * 按大学+研究科(+专业)查试卷列表。多归属试卷按"每条匹配 scope 一行"返回,
     * 各行带该 scope 的 year/subject/major,使前端按 (year, subject) 抽屉过滤时卷落到正确抽屉。
     */
    List<PaperScopeRow> findScopeRowsByScope(@Param("universityCode") String universityCode,
                                             @Param("gradSchoolCode") String gradSchoolCode,
                                             @Param("majorCode") String majorCode);
}
