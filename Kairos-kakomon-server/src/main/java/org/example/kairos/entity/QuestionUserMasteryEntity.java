package org.example.kairos.entity;

import java.time.LocalDateTime;

/** 用户题目掌握自评实体, 对应 question_user_mastery 表。 */
public class QuestionUserMasteryEntity {
    private Long id;
    private Long userId;
    private String questionCode;
    private String mastery;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public String getQuestionCode() { return questionCode; }
    public void setQuestionCode(String questionCode) { this.questionCode = questionCode; }
    public String getMastery() { return mastery; }
    public void setMastery(String mastery) { this.mastery = mastery; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
