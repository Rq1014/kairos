package org.example.kairos.mapper.question;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.example.kairos.entity.QuestionScopeEntity;

import java.util.List;

/** 散题归属 Mapper(只读)。 */
@Mapper
public interface QuestionScopeMapper {
    /** 查某散题的所有归属, 按 sort_order 升序 */
    List<QuestionScopeEntity> findByQuestionCode(@Param("questionCode") String questionCode);
}
