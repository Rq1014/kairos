package org.example.kairos.entity;

/** 大问-知识点关联,对应 question_knowledge_point 表。 */
public class QuestionKnowledgePointEntity {
    private Long id;
    private String questionCode;
    private String knowledgePoint;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getQuestionCode() { return questionCode; }
    public void setQuestionCode(String questionCode) { this.questionCode = questionCode; }
    public String getKnowledgePoint() { return knowledgePoint; }
    public void setKnowledgePoint(String knowledgePoint) { this.knowledgePoint = knowledgePoint; }
}
