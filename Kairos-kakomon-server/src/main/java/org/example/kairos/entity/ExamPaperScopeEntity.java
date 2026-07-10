package org.example.kairos.entity;

import java.time.LocalDateTime;

/** 试卷归属(exam_paper_scope 表), 一卷可多行。 */
public class ExamPaperScopeEntity {
    private Long id;
    private String paperCode;
    private String universityCode;
    private String gradSchoolCode;
    private String majorCode;
    private String subjectCode;
    private Integer year;
    private Integer sortOrder;
    private LocalDateTime createdAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getPaperCode() { return paperCode; }
    public void setPaperCode(String paperCode) { this.paperCode = paperCode; }
    public String getUniversityCode() { return universityCode; }
    public void setUniversityCode(String universityCode) { this.universityCode = universityCode; }
    public String getGradSchoolCode() { return gradSchoolCode; }
    public void setGradSchoolCode(String gradSchoolCode) { this.gradSchoolCode = gradSchoolCode; }
    public String getMajorCode() { return majorCode; }
    public void setMajorCode(String majorCode) { this.majorCode = majorCode; }
    public String getSubjectCode() { return subjectCode; }
    public void setSubjectCode(String subjectCode) { this.subjectCode = subjectCode; }
    public Integer getYear() { return year; }
    public void setYear(Integer year) { this.year = year; }
    public Integer getSortOrder() { return sortOrder; }
    public void setSortOrder(Integer sortOrder) { this.sortOrder = sortOrder; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
