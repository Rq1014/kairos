package org.example.kairos.model.response.question;

/** 掌握自评结果。字段对齐前端 updateQuestionMastery 返回。 */
public class MasteryResult {
    private String questionId;
    private String masteryStatus;
    private boolean weakPointsUpdated;

    public String getQuestionId() { return questionId; }
    public void setQuestionId(String questionId) { this.questionId = questionId; }
    public String getMasteryStatus() { return masteryStatus; }
    public void setMasteryStatus(String masteryStatus) { this.masteryStatus = masteryStatus; }
    public boolean isWeakPointsUpdated() { return weakPointsUpdated; }
    public void setWeakPointsUpdated(boolean weakPointsUpdated) { this.weakPointsUpdated = weakPointsUpdated; }
}
