package org.example.kairos.service.question.impl;

import org.example.kairos.common.ResultCode;
import org.example.kairos.common.exception.BizException;
import org.example.kairos.entity.QuestionEntity;
import org.example.kairos.mapper.question.QuestionDifficultyVoteMapper;
import org.example.kairos.mapper.question.QuestionMapper;
import org.example.kairos.mapper.question.QuestionUserMasteryMapper;
import org.example.kairos.model.response.question.DifficultyVoteResult;
import org.example.kairos.model.response.question.MasteryResult;
import org.example.kairos.service.question.QuestionMutationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.ObjectMapper;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/** 投票走 upsert 后重算 crowd 缓存; 掌握走 upsert。 */
@Service
public class QuestionMutationServiceImpl implements QuestionMutationService {

    private static final Set<String> VALID_VOTES = Set.of("easy", "medium", "hard");
    private static final Set<String> VALID_MASTERY = Set.of("mastered", "unclear", "wrong");

    @Autowired private QuestionMapper questionMapper;
    @Autowired private QuestionDifficultyVoteMapper voteMapper;
    @Autowired private QuestionUserMasteryMapper masteryMapper;
    @Autowired private ObjectMapper objectMapper;

    @Override
    @Transactional
    public DifficultyVoteResult vote(Long userId, String code, String vote) {
        if (vote == null || !VALID_VOTES.contains(vote)) {
            throw new BizException(ResultCode.INVALID_DIFFICULTY_VOTE);
        }
        QuestionEntity q = questionMapper.findByCode(code);
        if (q == null) throw new BizException(ResultCode.QUESTION_NOT_FOUND);

        voteMapper.upsert(userId, code, vote);

        // 重新聚合三桶
        Map<String, Integer> counts = new LinkedHashMap<>();
        counts.put("easy", 0);
        counts.put("medium", 0);
        counts.put("hard", 0);
        List<Map<String, Object>> rows = voteMapper.countGroupByVote(code);
        for (Map<String, Object> row : rows) {
            String v = (String) row.get("vote");
            Number cnt = (Number) row.get("cnt");
            if (counts.containsKey(v)) counts.put(v, cnt.intValue());
        }
        int total = counts.get("easy") + counts.get("medium") + counts.get("hard");
        BigDecimal rate = total == 0 ? null
                : BigDecimal.valueOf(counts.get("hard")).divide(BigDecimal.valueOf(total), 3, RoundingMode.HALF_UP);

        String votesJson = objectMapper.writeValueAsString(counts);
        questionMapper.updateCrowd(code, rate, votesJson);

        DifficultyVoteResult res = new DifficultyVoteResult();
        res.setQuestionId(code);
        res.setVote(vote);
        res.setCrowdVotes(counts);
        res.setCrowdDifficultyRate(rate);
        return res;
    }

    @Override
    @Transactional
    public MasteryResult setMastery(Long userId, String code, String masteryStatus) {
        if (masteryStatus == null || !VALID_MASTERY.contains(masteryStatus)) {
            throw new BizException(ResultCode.INVALID_MASTERY_STATUS);
        }
        QuestionEntity q = questionMapper.findByCode(code);
        if (q == null) throw new BizException(ResultCode.QUESTION_NOT_FOUND);

        masteryMapper.upsert(userId, code, masteryStatus);

        MasteryResult res = new MasteryResult();
        res.setQuestionId(code);
        res.setMasteryStatus(masteryStatus);
        res.setWeakPointsUpdated(false); // 弱点地图迁后端不在本次范围
        return res;
    }
}
