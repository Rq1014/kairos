package org.example.kairos.model.response.dict;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * 大学列表项响应体(列表页用,不含下属研究科)。
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class UniversityResponse {
    /** 大学 code */
    private String id;
    /** 中文名 */
    private String nameCn;
    /** 日文名(主要展示名) */
    private String nameJp;
    /** 英文名 */
    private String nameEn;
    /** 简称 */
    private String shortName;
    /** 类型: kokuritsu/koritsu/shiritsu */
    private String type;
    /** 所在地区 */
    private String region;
    /** 区域分组 */
    private String regionGroup;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getNameCn() { return nameCn; }
    public void setNameCn(String nameCn) { this.nameCn = nameCn; }
    public String getNameJp() { return nameJp; }
    public void setNameJp(String nameJp) { this.nameJp = nameJp; }
    public String getNameEn() { return nameEn; }
    public void setNameEn(String nameEn) { this.nameEn = nameEn; }
    /** 序列化为 JSON 时键名为 "short" */
    public String getShort() { return shortName; }
    public void setShort(String shortName) { this.shortName = shortName; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getRegion() { return region; }
    public void setRegion(String region) { this.region = region; }
    public String getRegionGroup() { return regionGroup; }
    public void setRegionGroup(String regionGroup) { this.regionGroup = regionGroup; }
}
