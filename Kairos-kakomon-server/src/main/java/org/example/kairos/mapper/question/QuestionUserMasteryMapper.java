package org.example.kairos.mapper.question;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

/** 用户题目掌握自评 Mapper。 */
@Mapper
public interface QuestionUserMasteryMapper {
    /** upsert: 同 (user_id, question_code) 已存在则更新 mastery */
    int upsert(@Param("userId") Long userId,
               @Param("questionCode") String questionCode,
               @Param("mastery") String mastery);

    /** 查某用户对某题的当前掌握, 无则 null */
    String findUserMastery(@Param("userId") Long userId,
                           @Param("questionCode") String questionCode);
}
