package org.example.kairos.entity;

import java.time.LocalDateTime;

/** 专业-科目关联实体，对应 major_subject 表。 */
public class MajorSubjectEntity {
    private Long id;
    private String universityCode;
    private String gradSchoolCode;
    private String majorCode;
    private String subjectCode;
    private Integer sortOrder;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getUniversityCode() { return universityCode; }
    public void setUniversityCode(String universityCode) { this.universityCode = universityCode; }
    public String getGradSchoolCode() { return gradSchoolCode; }
    public void setGradSchoolCode(String gradSchoolCode) { this.gradSchoolCode = gradSchoolCode; }
    public String getMajorCode() { return majorCode; }
    public void setMajorCode(String majorCode) { this.majorCode = majorCode; }
    public String getSubjectCode() { return subjectCode; }
    public void setSubjectCode(String subjectCode) { this.subjectCode = subjectCode; }
    public Integer getSortOrder() { return sortOrder; }
    public void setSortOrder(Integer sortOrder) { this.sortOrder = sortOrder; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
