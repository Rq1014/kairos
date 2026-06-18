package org.example.kairos.model.response.user;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.List;

/**
 * 用户目标学校响应体。
 * <p>
 * 包含用户保存的原始数据(各种 code)及联表得到的展示用名称。
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class TargetSchoolResponse {
    /** 大学 code */
    private String universityId;
    /** 类型: daigakuin/daigaku */
    private String type;
    /** 研究科 code */
    private String gradSchool;
    /** 专业 code */
    private String majorId;
    /** 选考科目 */
    private List<String> subjects;
    /** 优先级 */
    private Integer priority;
    /** 大学展示名称(从字典联表得到) */
    private String universityName;
    /** 研究科展示名称 */
    private String gradSchoolName;
    /** 专业展示名称 */
    private String majorLabel;

    public String getUniversityId() { return universityId; }
    public void setUniversityId(String universityId) { this.universityId = universityId; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getGradSchool() { return gradSchool; }
    public void setGradSchool(String gradSchool) { this.gradSchool = gradSchool; }
    public String getMajorId() { return majorId; }
    public void setMajorId(String majorId) { this.majorId = majorId; }
    public List<String> getSubjects() { return subjects; }
    public void setSubjects(List<String> subjects) { this.subjects = subjects; }
    public Integer getPriority() { return priority; }
    public void setPriority(Integer priority) { this.priority = priority; }
    public String getUniversityName() { return universityName; }
    public void setUniversityName(String universityName) { this.universityName = universityName; }
    public String getGradSchoolName() { return gradSchoolName; }
    public void setGradSchoolName(String gradSchoolName) { this.gradSchoolName = gradSchoolName; }
    public String getMajorLabel() { return majorLabel; }
    public void setMajorLabel(String majorLabel) { this.majorLabel = majorLabel; }
}
