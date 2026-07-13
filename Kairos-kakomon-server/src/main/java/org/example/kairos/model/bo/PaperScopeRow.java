package org.example.kairos.model.bo;

/**
 * 试卷 × 匹配 scope 的投影行(findByScope 用)。
 * 一张多归属试卷在结果里按"每条匹配 scope 一行"返回,各自带该 scope 的 year/subject/major,
 * 使前端按 (year, subjectCode) 抽屉过滤时卷落到它真正归属的每个抽屉。
 */
public class PaperScopeRow {
    private String code;
    private String title;
    private Integer durationMinutes;
    private String selectRule;
    private Integer scopeYear;
    private String scopeSubjectCode;
    private String scopeMajorCode;

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public Integer getDurationMinutes() { return durationMinutes; }
    public void setDurationMinutes(Integer durationMinutes) { this.durationMinutes = durationMinutes; }
    public String getSelectRule() { return selectRule; }
    public void setSelectRule(String selectRule) { this.selectRule = selectRule; }
    public Integer getScopeYear() { return scopeYear; }
    public void setScopeYear(Integer scopeYear) { this.scopeYear = scopeYear; }
    public String getScopeSubjectCode() { return scopeSubjectCode; }
    public void setScopeSubjectCode(String scopeSubjectCode) { this.scopeSubjectCode = scopeSubjectCode; }
    public String getScopeMajorCode() { return scopeMajorCode; }
    public void setScopeMajorCode(String scopeMajorCode) { this.scopeMajorCode = scopeMajorCode; }
}
