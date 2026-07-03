package org.example.kairos.entity;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/** 相似题关系(有向边),对应 question_relation 表。 */
public class QuestionRelationEntity {
    private Long id;
    private String fromQuestionCode;
    private String toQuestionCode;
    private Integer level;
    private String matchType;
    private String reason;
    private BigDecimal confidence;
    private LocalDateTime createdAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getFromQuestionCode() { return fromQuestionCode; }
    public void setFromQuestionCode(String fromQuestionCode) { this.fromQuestionCode = fromQuestionCode; }
    public String getToQuestionCode() { return toQuestionCode; }
    public void setToQuestionCode(String toQuestionCode) { this.toQuestionCode = toQuestionCode; }
    public Integer getLevel() { return level; }
    public void setLevel(Integer level) { this.level = level; }
    public String getMatchType() { return matchType; }
    public void setMatchType(String matchType) { this.matchType = matchType; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
    public BigDecimal getConfidence() { return confidence; }
    public void setConfidence(BigDecimal confidence) { this.confidence = confidence; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
