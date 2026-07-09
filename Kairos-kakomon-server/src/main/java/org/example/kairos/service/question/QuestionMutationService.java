package org.example.kairos.service.question;

import org.example.kairos.model.response.question.DifficultyVoteResult;
import org.example.kairos.model.response.question.MasteryResult;

/** 题目用户维度写服务（投票 / 掌握）。 */
public interface QuestionMutationService {
    DifficultyVoteResult vote(Long userId, String code, String vote);

    MasteryResult setMastery(Long userId, String code, String masteryStatus);
}
