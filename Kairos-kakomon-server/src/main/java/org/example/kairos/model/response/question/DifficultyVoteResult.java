package org.example.kairos.model.response.question;

import java.math.BigDecimal;
import java.util.Map;

/** 难度投票结果（含最新聚合）。字段对齐前端 voteQuestionDifficulty 返回。 */
public class DifficultyVoteResult {
    private String questionId;
    private String vote;
    private Map<String, Integer> crowdVotes;
    private BigDecimal crowdDifficultyRate;

    public String getQuestionId() { return questionId; }
    public void setQuestionId(String questionId) { this.questionId = questionId; }
    public String getVote() { return vote; }
    public void setVote(String vote) { this.vote = vote; }
    public Map<String, Integer> getCrowdVotes() { return crowdVotes; }
    public void setCrowdVotes(Map<String, Integer> crowdVotes) { this.crowdVotes = crowdVotes; }
    public BigDecimal getCrowdDifficultyRate() { return crowdDifficultyRate; }
    public void setCrowdDifficultyRate(BigDecimal crowdDifficultyRate) { this.crowdDifficultyRate = crowdDifficultyRate; }
}
