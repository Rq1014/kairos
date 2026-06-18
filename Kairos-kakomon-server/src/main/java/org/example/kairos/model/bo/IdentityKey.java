package org.example.kairos.model.bo;

/**
 * 身份键值对 BO,封装(身份类型, 身份值)的二元组。
 * 不可变对象,常用作 Map key 或方法间传参。
 */
public class IdentityKey {
    /** 身份类型,如 PHONE / EMAIL */
    private final String type;
    /** 身份值,如手机号或邮箱 */
    private final String value;

    public IdentityKey(String type, String value) {
        this.type = type;
        this.value = value;
    }

    public String getType() { return type; }
    public String getValue() { return value; }
}
