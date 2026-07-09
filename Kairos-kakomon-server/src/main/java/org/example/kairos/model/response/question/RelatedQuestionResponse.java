package org.example.kairos.model.response.question;

import java.util.List;

/** 同专题关系项（严格同 学校+研究科+专业+科目）。字段对齐前端 RelatedQuestion。 */
public class RelatedQuestionResponse {
    private String id;
    private String title;
    private String universityId;
    private String universityName;
    private Integer year;
    private String subject;
    private String subjectCode;
    private String questionNo;
    private List<String> knowledgePoints;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getUniversityId() { return universityId; }
    public void setUniversityId(String universityId) { this.universityId = universityId; }
    public String getUniversityName() { return universityName; }
    public void setUniversityName(String universityName) { this.universityName = universityName; }
    public Integer getYear() { return year; }
    public void setYear(Integer year) { this.year = year; }
    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }
    public String getSubjectCode() { return subjectCode; }
    public void setSubjectCode(String subjectCode) { this.subjectCode = subjectCode; }
    public String getQuestionNo() { return questionNo; }
    public void setQuestionNo(String questionNo) { this.questionNo = questionNo; }
    public List<String> getKnowledgePoints() { return knowledgePoints; }
    public void setKnowledgePoints(List<String> knowledgePoints) { this.knowledgePoints = knowledgePoints; }
}
