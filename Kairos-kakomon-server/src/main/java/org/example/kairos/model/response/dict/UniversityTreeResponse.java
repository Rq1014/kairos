package org.example.kairos.model.response.dict;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.List;

/**
 * 大学/研究科/专业完整三级树响应体。
 * <p>
 * 一次请求拿到全量字典,前端可在内存中过滤搜索,避免频繁请求。
 * 数据量较大,建议配合 version 字段做客户端缓存。
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class UniversityTreeResponse {
    /** 字典版本号 */
    private int version;
    /** 大学节点列表 */
    private List<UniversityNode> universities;

    public int getVersion() { return version; }
    public void setVersion(int version) { this.version = version; }
    public List<UniversityNode> getUniversities() { return universities; }
    public void setUniversities(List<UniversityNode> universities) { this.universities = universities; }

    /** 大学树节点(含下属研究科) */
    public static class UniversityNode {
        /** 大学 code */
        private String id;
        /** 中文名 */
        private String nameCn;
        /** 日文名 */
        private String nameJp;
        /** 简称 */
        private String shortName;
        /** 区域分组 */
        private String regionGroup;
        /** 类型 */
        private String type;
        /** 下属研究科节点 */
        private List<GradSchoolNode> gradSchools;

        public String getId() { return id; }
        public void setId(String id) { this.id = id; }
        public String getNameCn() { return nameCn; }
        public void setNameCn(String nameCn) { this.nameCn = nameCn; }
        public String getNameJp() { return nameJp; }
        public void setNameJp(String nameJp) { this.nameJp = nameJp; }
        public String getShort() { return shortName; }
        public void setShort(String shortName) { this.shortName = shortName; }
        public String getRegionGroup() { return regionGroup; }
        public void setRegionGroup(String regionGroup) { this.regionGroup = regionGroup; }
        public String getType() { return type; }
        public void setType(String type) { this.type = type; }
        public List<GradSchoolNode> getGradSchools() { return gradSchools; }
        public void setGradSchools(List<GradSchoolNode> gradSchools) { this.gradSchools = gradSchools; }
    }

    /** 研究科树节点(含下属专业) */
    public static class GradSchoolNode {
        /** 研究科 code */
        private String id;
        /** 日文名 */
        private String nameJp;
        /** 学科分类 */
        private String category;
        /** 下属专业节点 */
        private List<MajorNode> majors;

        public String getId() { return id; }
        public void setId(String id) { this.id = id; }
        public String getNameJp() { return nameJp; }
        public void setNameJp(String nameJp) { this.nameJp = nameJp; }
        public String getCategory() { return category; }
        public void setCategory(String category) { this.category = category; }
        public List<MajorNode> getMajors() { return majors; }
        public void setMajors(List<MajorNode> majors) { this.majors = majors; }
    }

    /** 专业树节点(叶子) */
    public static class MajorNode {
        /** 专业 code */
        private String id;
        /** 完整名称 */
        private String label;
        /** 简称 */
        private String shortName;
        /** 描述 */
        private String desc;
        /** 考试科目 */
        private List<String> subjects;

        public String getId() { return id; }
        public void setId(String id) { this.id = id; }
        public String getLabel() { return label; }
        public void setLabel(String label) { this.label = label; }
        public String getShort() { return shortName; }
        public void setShort(String shortName) { this.shortName = shortName; }
        public String getDesc() { return desc; }
        public void setDesc(String desc) { this.desc = desc; }
        public List<String> getSubjects() { return subjects; }
        public void setSubjects(List<String> subjects) { this.subjects = subjects; }
    }
}
