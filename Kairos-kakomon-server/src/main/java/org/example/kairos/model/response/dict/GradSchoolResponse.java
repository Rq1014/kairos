package org.example.kairos.model.response.dict;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * 研究科响应体。
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class GradSchoolResponse {
    /** 研究科 code */
    private String id;
    /** 中文名 */
    private String nameCn;
    /** 日文名(主要展示名) */
    private String nameJp;
    /** 英文名 */
    private String nameEn;
    /** 学科分类(理工/文社/医学等) */
    private String category;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getNameCn() { return nameCn; }
    public void setNameCn(String nameCn) { this.nameCn = nameCn; }
    public String getNameJp() { return nameJp; }
    public void setNameJp(String nameJp) { this.nameJp = nameJp; }
    public String getNameEn() { return nameEn; }
    public void setNameEn(String nameEn) { this.nameEn = nameEn; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
}
