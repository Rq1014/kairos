package org.example.kairos.model.request.question;

import jakarta.validation.constraints.NotBlank;

/** 掌握自评请求。masteryStatus ∈ mastered/unclear/wrong（在 service 层校验）。 */
public class MasteryRequest {
    @NotBlank
    private String masteryStatus;

    public String getMasteryStatus() { return masteryStatus; }
    public void setMasteryStatus(String masteryStatus) { this.masteryStatus = masteryStatus; }
}
