package org.example.kairos.model.request.user;

import org.example.kairos.model.response.user.NextExamDto;

/**
 * 用户资料增量更新请求体。
 * 字段为 null 表示该字段不更新,非 null 表示用新值替换。
 */
public class PatchProfileRequest {
    /** 昵称,1~30 字符 */
    private String nickname;
    /** 个人简介 */
    private String bio;
    /** 头像背景色 */
    private String avatarColor;
    /** 头像 URL */
    private String avatarUrl;
    /** 自由文本专业 */
    private String major;
    /** 字典选择的专业 code */
    private String selectedMajorCode;
    /** 下一场考试信息 */
    private NextExamDto nextExam;
    /** 是否完成新手引导 */
    private Boolean onboardingCompleted;

    public String getNickname() { return nickname; }
    public void setNickname(String nickname) { this.nickname = nickname; }
    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }
    public String getAvatarColor() { return avatarColor; }
    public void setAvatarColor(String avatarColor) { this.avatarColor = avatarColor; }
    public String getAvatarUrl() { return avatarUrl; }
    public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }
    public String getMajor() { return major; }
    public void setMajor(String major) { this.major = major; }
    public String getSelectedMajorCode() { return selectedMajorCode; }
    public void setSelectedMajorCode(String selectedMajorCode) { this.selectedMajorCode = selectedMajorCode; }
    public NextExamDto getNextExam() { return nextExam; }
    public void setNextExam(NextExamDto nextExam) { this.nextExam = nextExam; }
    public Boolean getOnboardingCompleted() { return onboardingCompleted; }
    public void setOnboardingCompleted(Boolean onboardingCompleted) { this.onboardingCompleted = onboardingCompleted; }
}
