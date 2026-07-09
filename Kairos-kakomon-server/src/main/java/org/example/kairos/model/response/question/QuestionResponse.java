package org.example.kairos.model.response.question;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

/** 大问详情(含结构化题干)。字段名对齐前端 KakomonQuestion。 */
public class QuestionResponse {
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
    private List<ContentBlockDto> contentBlocks;
    private String bodyText;
    private String difficultyLabel;
    private String difficultyLevel;
    private List<String> knowledgePoints;
    private BigDecimal crowdDifficultyRate;
    private Map<String, Integer> crowdVotes;
    private String myVote;
    private String masteryStatus;

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
    public List<ContentBlockDto> getContentBlocks() { return contentBlocks; }
    public void setContentBlocks(List<ContentBlockDto> contentBlocks) { this.contentBlocks = contentBlocks; }
    public String getBodyText() { return bodyText; }
    public void setBodyText(String bodyText) { this.bodyText = bodyText; }
    public String getDifficultyLabel() { return difficultyLabel; }
    public void setDifficultyLabel(String difficultyLabel) { this.difficultyLabel = difficultyLabel; }
    public String getDifficultyLevel() { return difficultyLevel; }
    public void setDifficultyLevel(String difficultyLevel) { this.difficultyLevel = difficultyLevel; }
    public List<String> getKnowledgePoints() { return knowledgePoints; }
    public void setKnowledgePoints(List<String> knowledgePoints) { this.knowledgePoints = knowledgePoints; }
    public BigDecimal getCrowdDifficultyRate() { return crowdDifficultyRate; }
    public void setCrowdDifficultyRate(BigDecimal crowdDifficultyRate) { this.crowdDifficultyRate = crowdDifficultyRate; }
    public Map<String, Integer> getCrowdVotes() { return crowdVotes; }
    public void setCrowdVotes(Map<String, Integer> crowdVotes) { this.crowdVotes = crowdVotes; }
    public String getMyVote() { return myVote; }
    public void setMyVote(String myVote) { this.myVote = myVote; }
    public String getMasteryStatus() { return masteryStatus; }
    public void setMasteryStatus(String masteryStatus) { this.masteryStatus = masteryStatus; }
}
