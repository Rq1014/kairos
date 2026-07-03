package org.example.kairos.mapper.question;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.example.kairos.entity.QuestionRelationEntity;

import java.util.List;

/** 相似题关系 Mapper(只读)。 */
@Mapper
public interface QuestionRelationMapper {
    /** 查某大问的出边(举一反三),按 level 升序 */
    List<QuestionRelationEntity> findFrom(@Param("fromQuestionCode") String fromQuestionCode);
}
