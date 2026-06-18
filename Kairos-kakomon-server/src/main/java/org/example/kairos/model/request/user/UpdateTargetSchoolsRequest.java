package org.example.kairos.model.request.user;

import jakarta.validation.constraints.NotNull;

import java.util.List;

/**
 * 更新目标学校列表请求体。
 * 全量替换语义: 服务端会先清空当前用户的所有目标学校,再插入请求中的列表。
 * 上限 20 所,超出报错 {@link org.example.kairos.common.ResultCode#TARGET_SCHOOL_LIMIT}。
 */
public class UpdateTargetSchoolsRequest {
    /** 目标学校列表,可以为空数组(表示清空) */
    @NotNull
    private List<TargetSchoolItem> schools;

    public List<TargetSchoolItem> getSchools() { return schools; }
    public void setSchools(List<TargetSchoolItem> schools) { this.schools = schools; }

    /** 单条目标学校配置 */
    public static class TargetSchoolItem {
        /** 大学 code,必填 */
        private String universityId;
        /** 类型: daigakuin(大学院,默认) / daigaku(大学) */
        private String type;
        /** 研究科 code,可空 */
        private String gradSchool;
        /** 专业 code,可空 */
        private String majorId;
        /** 选考科目列表 */
        private List<String> subjects;
        /** 优先级,默认 1 */
        private Integer priority;

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
    }
}
