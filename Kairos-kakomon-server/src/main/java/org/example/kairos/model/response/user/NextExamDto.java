package org.example.kairos.model.response.user;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * 下一场考试 DTO,既用作请求中的子结构,也用作响应中的子字段。
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class NextExamDto {
    /** 考试名称(如 "東京大学 工学系研究科") */
    private String name;
    /** 考试日期(ISO-8601: yyyy-MM-dd) */
    private String date;
    /** 距离考试的备考天数 */
    private Integer durationDays;

    public NextExamDto() {}
    public NextExamDto(String name, String date, Integer durationDays) {
        this.name = name;
        this.date = date;
        this.durationDays = durationDays;
    }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }
    public Integer getDurationDays() { return durationDays; }
    public void setDurationDays(Integer durationDays) { this.durationDays = durationDays; }
}
