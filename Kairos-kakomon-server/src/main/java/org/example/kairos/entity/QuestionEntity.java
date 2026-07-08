package org.example.kairos.entity;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/** 大问(第N问)实体,对应 question 表。contentBlocks/crowdVotes 为 JSON 字符串。 */
public class QuestionEntity {
    private Long id;
    private String code;
    private String paperCode;
    private String universityCode;
    private String gradSchoolCode;
    private String majorCode;
    private Integer year;
    private String subjectCode;
    private String questionNo;
    private String title;
    private Integer orderIndex;
    /** JSON 字符串数组, 结构化题干块 */
    private String contentBlocks;
    private String bodyText;
    private String difficultyLabel;
    private String difficultyLevel;
    private BigDecimal crowdDifficultyRate;
    /** JSON 字符串, {easy,medium,hard} */
    private String crowdVotes;
    private Integer status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public String getPaperCode() { return paperCode; }
    public void setPaperCode(String paperCode) { this.paperCode = paperCode; }
    public String getUniversityCode() { return universityCode; }
    public void setUniversityCode(String universityCode) { this.universityCode = universityCode; }
    public String getGradSchoolCode() { return gradSchoolCode; }
    public void setGradSchoolCode(String gradSchoolCode) { this.gradSchoolCode = gradSchoolCode; }
    public String getMajorCode() { return majorCode; }
    public void setMajorCode(String majorCode) { this.majorCode = majorCode; }
    public Integer getYear() { return year; }
    public void setYear(Integer year) { this.year = year; }
    public String getSubjectCode() { return subjectCode; }
    public void setSubjectCode(String subjectCode) { this.subjectCode = subjectCode; }
    public String getQuestionNo() { return questionNo; }
    public void setQuestionNo(String questionNo) { this.questionNo = questionNo; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public Integer getOrderIndex() { return orderIndex; }
    public void setOrderIndex(Integer orderIndex) { this.orderIndex = orderIndex; }
    public String getContentBlocks() { return contentBlocks; }
    public void setContentBlocks(String contentBlocks) { this.contentBlocks = contentBlocks; }
    public String getBodyText() { return bodyText; }
    public void setBodyText(String bodyText) { this.bodyText = bodyText; }
    public String getDifficultyLabel() { return difficultyLabel; }
    public void setDifficultyLabel(String difficultyLabel) { this.difficultyLabel = difficultyLabel; }
    public String getDifficultyLevel() { return difficultyLevel; }
    public void setDifficultyLevel(String difficultyLevel) { this.difficultyLevel = difficultyLevel; }
    public BigDecimal getCrowdDifficultyRate() { return crowdDifficultyRate; }
    public void setCrowdDifficultyRate(BigDecimal crowdDifficultyRate) { this.crowdDifficultyRate = crowdDifficultyRate; }
    public String getCrowdVotes() { return crowdVotes; }
    public void setCrowdVotes(String crowdVotes) { this.crowdVotes = crowdVotes; }
    public Integer getStatus() { return status; }
    public void setStatus(Integer status) { this.status = status; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
