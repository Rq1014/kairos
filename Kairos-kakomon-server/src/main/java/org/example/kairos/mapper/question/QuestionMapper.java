package org.example.kairos.mapper.question;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.example.kairos.entity.QuestionEntity;

import java.math.BigDecimal;
import java.util.List;

/** 大问 Mapper。 */
@Mapper
public interface QuestionMapper {
    /** 通过对外 code 查单题(含大字段) */
    QuestionEntity findByCode(@Param("code") String code);

    /** 按试卷 code 查属题列表(排序) */
    List<QuestionEntity> findByPaperCode(@Param("paperCode") String paperCode);

    /** 多条件分页筛选(join scope) */
    List<QuestionEntity> findByFilter(@Param("universityCode") String universityCode,
                                      @Param("gradSchoolCode") String gradSchoolCode,
                                      @Param("majorCode") String majorCode,
                                      @Param("year") Integer year,
                                      @Param("subjectCode") String subjectCode,
                                      @Param("knowledgePoint") String knowledgePoint,
                                      @Param("keyword") String keyword,
                                      @Param("offset") int offset,
                                      @Param("limit") int limit);

    /** 多条件计数 */
    long countByFilter(@Param("universityCode") String universityCode,
                       @Param("gradSchoolCode") String gradSchoolCode,
                       @Param("majorCode") String majorCode,
                       @Param("year") Integer year,
                       @Param("subjectCode") String subjectCode,
                       @Param("knowledgePoint") String knowledgePoint,
                       @Param("keyword") String keyword);

    /** 查某题的知识点列表 */
    List<String> findKnowledgePoints(@Param("questionCode") String questionCode);

    /** 更新众评 */
    void updateCrowd(@Param("code") String code, @Param("rate") BigDecimal rate, @Param("votesJson") String votesJson);

    /** 同专题(与源题任一 scope 的 校+研究科+专业+科目 相同, year 不限, 排除自身), 知识点重合降序 */
    List<QuestionEntity> findSameTopic(@Param("code") String code, @Param("limit") int limit);
}
