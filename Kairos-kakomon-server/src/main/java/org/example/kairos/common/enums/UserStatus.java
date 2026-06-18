package org.example.kairos.common.enums;

/**
 * 用户状态枚举,对应 user.status 字段。
 * <p>
 * 状态流转:
 * <pre>
 * ACTIVE(正常) ──冻结──&gt; FROZEN(冻结) ──恢复──&gt; ACTIVE
 *      └──注销──&gt; DELETED(已注销,不可恢复)
 * </pre>
 * 注意:DELETED 状态用于软删除,数据仍保留在表中,登录及业务接口需拒绝服务。
 */
public enum UserStatus {
    /** 正常状态,允许登录及全部业务操作 */
    ACTIVE(1),
    /** 冻结状态,禁止登录,需联系客服解冻 */
    FROZEN(2),
    /** 已注销(软删除),不可恢复 */
    DELETED(3);

    private final int code;
    UserStatus(int code) { this.code = code; }
    public int getCode() { return code; }

    /**
     * 数据库 code 转枚举。
     *
     * @param code 数据库存储的状态码
     * @return 匹配的枚举,匹配不到返回 null
     */
    public static UserStatus of(int code) {
        for (UserStatus s : values()) {
            if (s.code == code) return s;
        }
        return null;
    }
}
