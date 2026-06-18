package org.example.kairos.entity;

import java.time.LocalDateTime;

/**
 * 专业字典实体,对应 major 表。
 * <p>
 * 隶属于某个研究科,字典三级结构的最末级。
 */
public class MajorEntity {
    /** 主键 ID */
    private Long id;
    /** 冗余的大学 ID,加速跨表查询 */
    private Long universityId;
    /** 所属研究科 ID,关联 {@link GradSchoolEntity#getId()} */
    private Long gradSchoolId;
    /** 专业编码,在所属研究科内唯一 */
    private String code;
    /** 专业完整名称(展示用) */
    private String label;
    /** 简称 */
    private String shortName;
    /** 专业描述 */
    private String description;
    /** 该专业的考试科目列表(JSON 数组字符串),如 ["数学","物理","专业课"] */
    private String subjects;
    /** 排序权重 */
    private Integer sortOrder;
    /** 状态,1=上线 0=下线 */
    private Integer status;
    /** 创建时间 */
    private LocalDateTime createdAt;
    /** 更新时间 */
    private LocalDateTime updatedAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getUniversityId() { return universityId; }
    public void setUniversityId(Long universityId) { this.universityId = universityId; }
    public Long getGradSchoolId() { return gradSchoolId; }
    public void setGradSchoolId(Long gradSchoolId) { this.gradSchoolId = gradSchoolId; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }
    public String getShortName() { return shortName; }
    public void setShortName(String shortName) { this.shortName = shortName; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getSubjects() { return subjects; }
    public void setSubjects(String subjects) { this.subjects = subjects; }
    public Integer getSortOrder() { return sortOrder; }
    public void setSortOrder(Integer sortOrder) { this.sortOrder = sortOrder; }
    public Integer getStatus() { return status; }
    public void setStatus(Integer status) { this.status = status; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
