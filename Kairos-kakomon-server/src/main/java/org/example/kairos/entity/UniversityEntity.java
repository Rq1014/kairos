package org.example.kairos.entity;

import java.time.LocalDateTime;

/**
 * 大学字典实体,对应 university 表。
 * <p>
 * 字典三级结构: 大学 → 研究科({@link GradSchoolEntity}) → 专业({@link MajorEntity})。
 */
public class UniversityEntity {
    /** 主键 ID */
    private Long id;
    /** 大学唯一编码,业务侧使用此 code 引用,而非自增 ID */
    private String code;
    /** 中文名(如 "东京大学") */
    private String nameCn;
    /** 日文名(如 "東京大学") */
    private String nameJp;
    /** 英文名(如 "The University of Tokyo") */
    private String nameEn;
    /** 简称(如 "東大") */
    private String shortName;
    /** 类型: 国立(kokuritsu) / 公立(koritsu) / 私立(shiritsu) */
    private String type;
    /** 所在地区(都道府县级,如 "東京都") */
    private String region;
    /** 区域分组(如 "関東" / "関西"),用于前端筛选 */
    private String regionGroup;
    /** 状态,1=上线 0=下线 */
    private Integer status;
    /** 排序权重,数字越小越靠前 */
    private Integer sortOrder;
    /** 创建时间 */
    private LocalDateTime createdAt;
    /** 更新时间 */
    private LocalDateTime updatedAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public String getNameCn() { return nameCn; }
    public void setNameCn(String nameCn) { this.nameCn = nameCn; }
    public String getNameJp() { return nameJp; }
    public void setNameJp(String nameJp) { this.nameJp = nameJp; }
    public String getNameEn() { return nameEn; }
    public void setNameEn(String nameEn) { this.nameEn = nameEn; }
    public String getShortName() { return shortName; }
    public void setShortName(String shortName) { this.shortName = shortName; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getRegion() { return region; }
    public void setRegion(String region) { this.region = region; }
    public String getRegionGroup() { return regionGroup; }
    public void setRegionGroup(String regionGroup) { this.regionGroup = regionGroup; }
    public Integer getStatus() { return status; }
    public void setStatus(Integer status) { this.status = status; }
    public Integer getSortOrder() { return sortOrder; }
    public void setSortOrder(Integer sortOrder) { this.sortOrder = sortOrder; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
