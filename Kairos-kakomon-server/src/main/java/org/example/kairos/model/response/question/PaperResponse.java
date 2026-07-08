package org.example.kairos.model.response.question;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.List;

/** 试卷详情(含大问列表)。 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class PaperResponse {
    private String id;
    private String universityId;
    private String graduateSchool;
    private String majorId;
    private Integer year;
    private String subject;
    private String subjectCode;
    private String title;
    private Integer durationMinutes;
    private Integer totalScore;
    private SelectRule selectRule;
    private List<String> instructions;
    private List<QuestionListItemResponse> questions;

    /** 选做规则,如 3 题选 2。 */
    public static class SelectRule {
        private int total;
        private int choose;
        public int getTotal() { return total; }
        public void setTotal(int total) { this.total = total; }
        public int getChoose() { return choose; }
        public void setChoose(int choose) { this.choose = choose; }
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getUniversityId() { return universityId; }
    public void setUniversityId(String universityId) { this.universityId = universityId; }
    public String getGraduateSchool() { return graduateSchool; }
    public void setGraduateSchool(String graduateSchool) { this.graduateSchool = graduateSchool; }
    public String getMajorId() { return majorId; }
    public void setMajorId(String majorId) { this.majorId = majorId; }
    public Integer getYear() { return year; }
    public void setYear(Integer year) { this.year = year; }
    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }
    public String getSubjectCode() { return subjectCode; }
    public void setSubjectCode(String subjectCode) { this.subjectCode = subjectCode; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public Integer getDurationMinutes() { return durationMinutes; }
    public void setDurationMinutes(Integer durationMinutes) { this.durationMinutes = durationMinutes; }
    public Integer getTotalScore() { return totalScore; }
    public void setTotalScore(Integer totalScore) { this.totalScore = totalScore; }
    public SelectRule getSelectRule() { return selectRule; }
    public void setSelectRule(SelectRule selectRule) { this.selectRule = selectRule; }
    public List<String> getInstructions() { return instructions; }
    public void setInstructions(List<String> instructions) { this.instructions = instructions; }
    public List<QuestionListItemResponse> getQuestions() { return questions; }
    public void setQuestions(List<QuestionListItemResponse> questions) { this.questions = questions; }
}
