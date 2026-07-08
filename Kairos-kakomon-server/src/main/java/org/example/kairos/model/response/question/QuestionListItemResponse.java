package org.example.kairos.model.response.question;

import java.util.List;

/** 大问列表项(不含 content_blocks,首屏瘦身)。 */
public class QuestionListItemResponse {
    private String id;
    private String paperId;
    private String universityId;
    private String graduateSchool;
    private String majorId;
    private Integer year;
    private String subject;
    private String subjectCode;
    private String questionNo;
    private String title;
    private Integer orderIndex;
    private String difficultyLabel;
    private String difficultyLevel;
    private List<String> knowledgePoints;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getPaperId() { return paperId; }
    public void setPaperId(String paperId) { this.paperId = paperId; }
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
    public String getQuestionNo() { return questionNo; }
    public void setQuestionNo(String questionNo) { this.questionNo = questionNo; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public Integer getOrderIndex() { return orderIndex; }
    public void setOrderIndex(Integer orderIndex) { this.orderIndex = orderIndex; }
    public String getDifficultyLabel() { return difficultyLabel; }
    public void setDifficultyLabel(String difficultyLabel) { this.difficultyLabel = difficultyLabel; }
    public String getDifficultyLevel() { return difficultyLevel; }
    public void setDifficultyLevel(String difficultyLevel) { this.difficultyLevel = difficultyLevel; }
    public List<String> getKnowledgePoints() { return knowledgePoints; }
    public void setKnowledgePoints(List<String> knowledgePoints) { this.knowledgePoints = knowledgePoints; }
}
