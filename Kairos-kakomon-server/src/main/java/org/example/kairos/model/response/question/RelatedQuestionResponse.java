package org.example.kairos.model.response.question;

/** 举一反三关系项。 */
public class RelatedQuestionResponse {
    private String id;
    private String title;
    private Integer level;
    private String matchType;
    private String reason;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public Integer getLevel() { return level; }
    public void setLevel(Integer level) { this.level = level; }
    public String getMatchType() { return matchType; }
    public void setMatchType(String matchType) { this.matchType = matchType; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
}
