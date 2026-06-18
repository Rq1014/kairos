package org.example.kairos.entity;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 用户资料实体,对应 user_profile 表。
 * <p>
 * 存放与登录鉴权解耦的"软数据": 昵称、简介、头像、统计指标、配置项等。
 * 一个用户对应一条 profile 记录,以 userId 为主键。
 */
public class UserProfileEntity {
    /** 用户 ID,主键,关联 {@link UserEntity#getId()} */
    private Long userId;
    /** 昵称,默认 "小k",最大 30 字符 */
    private String nickname;
    /** 个人简介 */
    private String bio;
    /** 头像 URL,云存储地址 */
    private String avatarUrl;
    /** 头像背景色,在没有 avatarUrl 时用于显示首字母头像 */
    private String avatarColor;
    /** 用户填写的专业文本(自由文本) */
    private String major;
    /** 用户从字典中选择的专业 code,用于精确匹配 */
    private String selectedMajorCode;
    /** 下一场考试名称(如 "東京大学 工学系研究科") */
    private String nextExamName;
    /** 下一场考试日期 */
    private LocalDate nextExamDate;
    /** 距下一场考试的备考天数 */
    private Integer nextExamDuration;
    /** 是否 Pro 会员,1=是 0=否 */
    private Integer isPro;
    /** 免费 AI 提问剩余次数 */
    private Integer freeAiRemaining;
    /** Token 余额,用于付费 AI 提问 */
    private Integer tokenBalance;
    /** 已解决的题目数 */
    private Integer solvedCount;
    /** 标记为不清楚的题目数 */
    private Integer unclearCount;
    /** 错题数 */
    private Integer wrongCount;
    /** 收藏题目数 */
    private Integer favoriteCount;
    /** 累计 AI 提问次数 */
    private Integer aiAskCount;
    /** 贡献者积分(贡献新题/答案获得) */
    private Integer contributorPoints;
    /** 是否完成新手引导,1=已完成 0=未完成 */
    private Integer onboardingCompleted;
    /** 创建时间 */
    private LocalDateTime createdAt;
    /** 更新时间 */
    private LocalDateTime updatedAt;

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public String getNickname() { return nickname; }
    public void setNickname(String nickname) { this.nickname = nickname; }
    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }
    public String getAvatarUrl() { return avatarUrl; }
    public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }
    public String getAvatarColor() { return avatarColor; }
    public void setAvatarColor(String avatarColor) { this.avatarColor = avatarColor; }
    public String getMajor() { return major; }
    public void setMajor(String major) { this.major = major; }
    public String getSelectedMajorCode() { return selectedMajorCode; }
    public void setSelectedMajorCode(String selectedMajorCode) { this.selectedMajorCode = selectedMajorCode; }
    public String getNextExamName() { return nextExamName; }
    public void setNextExamName(String nextExamName) { this.nextExamName = nextExamName; }
    public LocalDate getNextExamDate() { return nextExamDate; }
    public void setNextExamDate(LocalDate nextExamDate) { this.nextExamDate = nextExamDate; }
    public Integer getNextExamDuration() { return nextExamDuration; }
    public void setNextExamDuration(Integer nextExamDuration) { this.nextExamDuration = nextExamDuration; }
    public Integer getIsPro() { return isPro; }
    public void setIsPro(Integer isPro) { this.isPro = isPro; }
    public Integer getFreeAiRemaining() { return freeAiRemaining; }
    public void setFreeAiRemaining(Integer freeAiRemaining) { this.freeAiRemaining = freeAiRemaining; }
    public Integer getTokenBalance() { return tokenBalance; }
    public void setTokenBalance(Integer tokenBalance) { this.tokenBalance = tokenBalance; }
    public Integer getSolvedCount() { return solvedCount; }
    public void setSolvedCount(Integer solvedCount) { this.solvedCount = solvedCount; }
    public Integer getUnclearCount() { return unclearCount; }
    public void setUnclearCount(Integer unclearCount) { this.unclearCount = unclearCount; }
    public Integer getWrongCount() { return wrongCount; }
    public void setWrongCount(Integer wrongCount) { this.wrongCount = wrongCount; }
    public Integer getFavoriteCount() { return favoriteCount; }
    public void setFavoriteCount(Integer favoriteCount) { this.favoriteCount = favoriteCount; }
    public Integer getAiAskCount() { return aiAskCount; }
    public void setAiAskCount(Integer aiAskCount) { this.aiAskCount = aiAskCount; }
    public Integer getContributorPoints() { return contributorPoints; }
    public void setContributorPoints(Integer contributorPoints) { this.contributorPoints = contributorPoints; }
    public Integer getOnboardingCompleted() { return onboardingCompleted; }
    public void setOnboardingCompleted(Integer onboardingCompleted) { this.onboardingCompleted = onboardingCompleted; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
