package org.example.kairos.entity;

import java.time.LocalDateTime;

/**
 * 研究科字典实体,对应 grad_school 表。
 * <p>
 * 隶属于某个大学,与 {@link UniversityEntity} 多对一关系。
 * 例如东京大学下有 "工学系研究科"、"情報理工学系研究科" 等多个研究科。
 */
public class GradSchoolEntity {
    /** 主键 ID */
    private Long id;
    /** 所属大学 ID,关联 {@link UniversityEntity#getId()} */
    private Long universityId;
    /** 研究科编码,在所属大学内唯一 */
    private String code;
    /** 中文名 */
    private String nameCn;
    /** 日文名(主要展示名) */
    private String nameJp;
    /** 英文名 */
    private String nameEn;
    /** 学科分类,如 "理工"、"文社"、"医学" */
    private String category;
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
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public String getNameCn() { return nameCn; }
    public void setNameCn(String nameCn) { this.nameCn = nameCn; }
    public String getNameJp() { return nameJp; }
    public void setNameJp(String nameJp) { this.nameJp = nameJp; }
    public String getNameEn() { return nameEn; }
    public void setNameEn(String nameEn) { this.nameEn = nameEn; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public Integer getSortOrder() { return sortOrder; }
    public void setSortOrder(Integer sortOrder) { this.sortOrder = sortOrder; }
    public Integer getStatus() { return status; }
    public void setStatus(Integer status) { this.status = status; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
