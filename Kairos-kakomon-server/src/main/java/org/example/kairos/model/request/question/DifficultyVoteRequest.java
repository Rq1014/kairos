package org.example.kairos.model.request.question;

import jakarta.validation.constraints.NotBlank;

/** 难度投票请求。vote ∈ easy/medium/hard（在 service 层校验）。 */
public class DifficultyVoteRequest {
    @NotBlank
    private String vote;

    public String getVote() { return vote; }
    public void setVote(String vote) { this.vote = vote; }
}
