package org.example.kairos.model.response.user;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * 账号注销接口响应。
 * <p>
 * 返回对外用户编号与软删时间,方便客户端在确认页/审计日志展示。
 * 不再返回任何 profile / identity / token 字段:这些都已在服务端清理。
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class DeactivateResponse {
    /** 被注销账号的对外 userNo(如 u17xxxxx),便于客服侧追溯 */
    private String userNo;
    /** 软删时间(ISO-8601 字符串),由服务端落库后回写 */
    private String deletedAt;

    public DeactivateResponse() {}

    public DeactivateResponse(String userNo, String deletedAt) {
        this.userNo = userNo;
        this.deletedAt = deletedAt;
    }

    public String getUserNo() { return userNo; }
    public void setUserNo(String userNo) { this.userNo = userNo; }
    public String getDeletedAt() { return deletedAt; }
    public void setDeletedAt(String deletedAt) { this.deletedAt = deletedAt; }
}
