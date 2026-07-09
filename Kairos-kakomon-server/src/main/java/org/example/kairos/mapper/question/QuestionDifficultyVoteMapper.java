package org.example.kairos.mapper.question;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

/** 题目难度投票 Mapper。 */
@Mapper
public interface QuestionDifficultyVoteMapper {
    /** upsert: 同 (user_id, question_code) 已存在则改投 */
    int upsert(@Param("userId") Long userId,
               @Param("questionCode") String questionCode,
               @Param("vote") String vote);

    /** 按 vote 分桶计数, 每行 {vote, cnt} */
    List<Map<String, Object>> countGroupByVote(@Param("questionCode") String questionCode);

    /** 查某用户对某题的当前票, 无则 null */
    String findUserVote(@Param("userId") Long userId,
                        @Param("questionCode") String questionCode);
}
