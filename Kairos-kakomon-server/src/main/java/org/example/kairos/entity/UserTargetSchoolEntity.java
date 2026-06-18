package org.example.kairos.entity;

import java.time.LocalDateTime;

/**
 * 用户目标学校实体,对应 user_target_school 表。
 * <p>
 * 用户可以同时设置多所目标学校(最多 20 所),
 * 用于个性化推荐过去问、学习计划生成等业务。
 */
public class UserTargetSchoolEntity {
    /** 主键 ID */
    private Long id;
    /** 用户 ID,关联 {@link UserEntity#getId()} */
    private Long userId;
    /** 大学 code,关联 {@link UniversityEntity#getCode()} */
    private String universityCode;
    /** 学校类型: daigakuin(大学院) / daigaku(大学) */
    private String schoolType;
    /** 研究科 code,可空(只设置到大学层级时为空) */
    private String gradSchoolCode;
    /** 专业 code,可空 */
    private String majorCode;
    /** 选考科目列表(JSON 数组字符串),如 ["数学","英语","专业课"] */
    private String subjects;
    /** 优先级,数值越小越优先,1 表示最优先 */
    private Integer priority;
    /** 创建时间 */
    private LocalDateTime createdAt;
    /** 更新时间 */
    private LocalDateTime updatedAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public String getUniversityCode() { return universityCode; }
    public void setUniversityCode(String universityCode) { this.universityCode = universityCode; }
    public String getSchoolType() { return schoolType; }
    public void setSchoolType(String schoolType) { this.schoolType = schoolType; }
    public String getGradSchoolCode() { return gradSchoolCode; }
    public void setGradSchoolCode(String gradSchoolCode) { this.gradSchoolCode = gradSchoolCode; }
    public String getMajorCode() { return majorCode; }
    public void setMajorCode(String majorCode) { this.majorCode = majorCode; }
    public String getSubjects() { return subjects; }
    public void setSubjects(String subjects) { this.subjects = subjects; }
    public Integer getPriority() { return priority; }
    public void setPriority(Integer priority) { this.priority = priority; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
