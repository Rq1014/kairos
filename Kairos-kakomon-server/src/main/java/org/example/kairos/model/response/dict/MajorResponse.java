package org.example.kairos.model.response.dict;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.List;

/**
 * 专业响应体。
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class MajorResponse {
    /** 专业 code */
    private String id;
    /** 完整名称 */
    private String label;
    /** 简称 */
    private String shortName;
    /** 描述 */
    private String desc;
    /** 考试科目列表 */
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
