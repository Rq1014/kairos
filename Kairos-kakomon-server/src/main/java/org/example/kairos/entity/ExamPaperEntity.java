package org.example.kairos.entity;

import java.time.LocalDateTime;

/** 试卷实体,对应 exam_paper 表。JSON 列(selectRule/instructions)以字符串承载,VO 层反序列化。 */
public class ExamPaperEntity {
    private Long id;
    private String code;
    private String title;
    private Integer durationMinutes;
    private Integer totalScore;
    /** JSON 字符串, 如 {"total":3,"choose":2} */
    private String selectRule;
    /** JSON 字符串数组, 注意事项 */
    private String instructions;
    private String sourcePdfKey;
    private Integer status;
    private Integer sortOrder;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public Integer getDurationMinutes() { return durationMinutes; }
    public void setDurationMinutes(Integer durationMinutes) { this.durationMinutes = durationMinutes; }
    public Integer getTotalScore() { return totalScore; }
    public void setTotalScore(Integer totalScore) { this.totalScore = totalScore; }
    public String getSelectRule() { return selectRule; }
    public void setSelectRule(String selectRule) { this.selectRule = selectRule; }
    public String getInstructions() { return instructions; }
    public void setInstructions(String instructions) { this.instructions = instructions; }
    public String getSourcePdfKey() { return sourcePdfKey; }
    public void setSourcePdfKey(String sourcePdfKey) { this.sourcePdfKey = sourcePdfKey; }
    public Integer getStatus() { return status; }
    public void setStatus(Integer status) { this.status = status; }
    public Integer getSortOrder() { return sortOrder; }
    public void setSortOrder(Integer sortOrder) { this.sortOrder = sortOrder; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
