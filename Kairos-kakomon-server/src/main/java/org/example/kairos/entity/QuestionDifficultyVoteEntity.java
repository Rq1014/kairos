package org.example.kairos.entity;

import java.time.LocalDateTime;

/** 题目难度投票实体, 对应 question_difficulty_vote 表。 */
public class QuestionDifficultyVoteEntity {
    private Long id;
    private Long userId;
    private String questionCode;
    private String vote;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public String getQuestionCode() { return questionCode; }
    public void setQuestionCode(String questionCode) { this.questionCode = questionCode; }
    public String getVote() { return vote; }
    public void setVote(String vote) { this.vote = vote; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
