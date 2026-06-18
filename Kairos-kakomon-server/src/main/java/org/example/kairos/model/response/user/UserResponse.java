package org.example.kairos.model.response.user;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.Collections;
import java.util.List;

/**
 * 用户聚合响应体,/me 接口及登录响应使用。
 * <p>
 * 聚合了用户基础信息、profile 信息、绑定身份、目标学校等,
 * 一次返回前端所需全部数据,避免前端多次拉取。
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class UserResponse {
    /** 用户对外编号(userNo) */
    private String id;
    /** 昵称 */
    private String nickname;
    /** 邮箱(主邮箱身份的 value),无则为空字符串 */
    private String email;
    /** 手机号(主手机号身份的 value) */
    private String phone;
    /** 自由文本专业 */
    private String major;
    /** 字典选择的专业 code */
    private String selectedMajorCode;
    /** 个人简介 */
    private String bio;
    /** 头像背景色 */
    private String avatarColor;
    /** 头像 URL */
    private String avatarUrl;
    /** 目标学校列表 */
    private List<TargetSchoolResponse> targetSchools = Collections.emptyList();
    /** 是否 Pro 会员 */
    private boolean isPro;
    /** 免费 AI 提问剩余次数 */
    private int freeAiRemaining;
    /** Token 余额 */
    private int tokenBalance;
    /** 已解决的题目数 */
    private int solvedCount;
    /** 标记为不清楚的题目数 */
    private int unclearCount;
    /** 错题数 */
    private int wrongCount;
    /** 收藏题目数 */
    private int favoriteCount;
    /** 累计 AI 提问次数 */
    private int aiAskCount;
    /** 贡献者积分 */
    private int contributorPoints;
    /** 弱项分析(暂未实现,占位为空数组) */
    private List<Object> weakPoints = Collections.emptyList();
    /** 下一场考试 */
    private NextExamDto nextExam;
    /** 注册时间(ISO-8601 字符串) */
    private String createdAt;
    /** 是否完成新手引导 */
    private boolean onboardingCompleted;
    /** 已绑定的全部身份 */
    private List<IdentityResponse> identities = Collections.emptyList();
    /** 是否已设置密码,前端可据此显示"修改密码"或"设置密码" */
    private boolean hasPassword;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getNickname() { return nickname; }
    public void setNickname(String nickname) { this.nickname = nickname; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getMajor() { return major; }
    public void setMajor(String major) { this.major = major; }
    public String getSelectedMajorCode() { return selectedMajorCode; }
    public void setSelectedMajorCode(String selectedMajorCode) { this.selectedMajorCode = selectedMajorCode; }
    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }
    public String getAvatarColor() { return avatarColor; }
    public void setAvatarColor(String avatarColor) { this.avatarColor = avatarColor; }
    public String getAvatarUrl() { return avatarUrl; }
    public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }
    public List<TargetSchoolResponse> getTargetSchools() { return targetSchools; }
    public void setTargetSchools(List<TargetSchoolResponse> targetSchools) { this.targetSchools = targetSchools; }
    public boolean getIsPro() { return isPro; }
    public void setIsPro(boolean pro) { isPro = pro; }
    public int getFreeAiRemaining() { return freeAiRemaining; }
    public void setFreeAiRemaining(int freeAiRemaining) { this.freeAiRemaining = freeAiRemaining; }
    public int getTokenBalance() { return tokenBalance; }
    public void setTokenBalance(int tokenBalance) { this.tokenBalance = tokenBalance; }
    public int getSolvedCount() { return solvedCount; }
    public void setSolvedCount(int solvedCount) { this.solvedCount = solvedCount; }
    public int getUnclearCount() { return unclearCount; }
    public void setUnclearCount(int unclearCount) { this.unclearCount = unclearCount; }
    public int getWrongCount() { return wrongCount; }
    public void setWrongCount(int wrongCount) { this.wrongCount = wrongCount; }
    public int getFavoriteCount() { return favoriteCount; }
    public void setFavoriteCount(int favoriteCount) { this.favoriteCount = favoriteCount; }
    public int getAiAskCount() { return aiAskCount; }
    public void setAiAskCount(int aiAskCount) { this.aiAskCount = aiAskCount; }
    public int getContributorPoints() { return contributorPoints; }
    public void setContributorPoints(int contributorPoints) { this.contributorPoints = contributorPoints; }
    public List<Object> getWeakPoints() { return weakPoints; }
    public void setWeakPoints(List<Object> weakPoints) { this.weakPoints = weakPoints; }
    public NextExamDto getNextExam() { return nextExam; }
    public void setNextExam(NextExamDto nextExam) { this.nextExam = nextExam; }
    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
    public boolean isOnboardingCompleted() { return onboardingCompleted; }
    public void setOnboardingCompleted(boolean onboardingCompleted) { this.onboardingCompleted = onboardingCompleted; }
    public List<IdentityResponse> getIdentities() { return identities; }
    public void setIdentities(List<IdentityResponse> identities) { this.identities = identities; }
    public boolean isHasPassword() { return hasPassword; }
    public void setHasPassword(boolean hasPassword) { this.hasPassword = hasPassword; }
}
