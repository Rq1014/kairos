package org.example.kairos.model.response.dict;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.List;

/**
 * 大学详情响应体(单个大学的信息 + 下属研究科列表)。
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class UniversityDetailResponse {
    /** 大学 code */
    private String id;
    /** 中文名 */
    private String nameCn;
    /** 日文名 */
    private String nameJp;
    /** 英文名 */
    private String nameEn;
    /** 简称 */
    private String shortName;
    /** 类型 */
    private String type;
    /** 地区 */
    private String region;
    /** 区域分组 */
    private String regionGroup;
    /** 下属研究科列表 */
    private List<GradSchoolResponse> gradSchools;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getNameCn() { return nameCn; }
    public void setNameCn(String nameCn) { this.nameCn = nameCn; }
    public String getNameJp() { return nameJp; }
    public void setNameJp(String nameJp) { this.nameJp = nameJp; }
    public String getNameEn() { return nameEn; }
    public void setNameEn(String nameEn) { this.nameEn = nameEn; }
    public String getShort() { return shortName; }
    public void setShort(String shortName) { this.shortName = shortName; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getRegion() { return region; }
    public void setRegion(String region) { this.region = region; }
    public String getRegionGroup() { return regionGroup; }
    public void setRegionGroup(String regionGroup) { this.regionGroup = regionGroup; }
    public List<GradSchoolResponse> getGradSchools() { return gradSchools; }
    public void setGradSchools(List<GradSchoolResponse> gradSchools) { this.gradSchools = gradSchools; }
}
