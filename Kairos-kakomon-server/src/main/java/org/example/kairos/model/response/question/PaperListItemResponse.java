package org.example.kairos.model.response.question;

import com.fasterxml.jackson.annotation.JsonInclude;

/** 试卷列表项(模考首页年份卡)。 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class PaperListItemResponse {
    private String id;
    private Integer year;
    private String subject;
    private String title;
    private Integer durationMinutes;
    private PaperResponse.SelectRule selectRule;
    private int questionCount;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public Integer getYear() { return year; }
    public void setYear(Integer year) { this.year = year; }
    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public Integer getDurationMinutes() { return durationMinutes; }
    public void setDurationMinutes(Integer durationMinutes) { this.durationMinutes = durationMinutes; }
    public PaperResponse.SelectRule getSelectRule() { return selectRule; }
    public void setSelectRule(PaperResponse.SelectRule selectRule) { this.selectRule = selectRule; }
    public int getQuestionCount() { return questionCount; }
    public void setQuestionCount(int questionCount) { this.questionCount = questionCount; }
}
