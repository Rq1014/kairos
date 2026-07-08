package org.example.kairos.mapper.question;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.example.kairos.entity.QuestionEntity;

import java.util.List;

/** 大问 Mapper。 */
@Mapper
public interface QuestionMapper {
    /** 通过对外 code 查单个大问(含 content_blocks) */
    QuestionEntity findByCode(@Param("code") String code);

    /** 按试卷 code 查该卷全部大问,按 order_index 升序 */
    List<QuestionEntity> findByPaperCode(@Param("paperCode") String paperCode);

    /** 多条件分页筛选(列表,不取 content_blocks) */
    List<QuestionEntity> findByFilter(@Param("universityCode") String universityCode,
                                      @Param("gradSchoolCode") String gradSchoolCode,
                                      @Param("majorCode") String majorCode,
                                      @Param("year") Integer year,
                                      @Param("subjectCode") String subjectCode,
                                      @Param("knowledgePoint") String knowledgePoint,
                                      @Param("keyword") String keyword,
                                      @Param("offset") int offset,
                                      @Param("limit") int limit);

    /** 与 findByFilter 配套计数 */
    long countByFilter(@Param("universityCode") String universityCode,
                       @Param("gradSchoolCode") String gradSchoolCode,
                       @Param("majorCode") String majorCode,
                       @Param("year") Integer year,
                       @Param("subjectCode") String subjectCode,
                       @Param("knowledgePoint") String knowledgePoint,
                       @Param("keyword") String keyword);

    /** 查某大问的知识点标签列表 */
    List<String> findKnowledgePoints(@Param("questionCode") String questionCode);
}
