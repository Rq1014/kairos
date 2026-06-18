package org.example.kairos.mapper.auth;

import org.apache.ibatis.annotations.Mapper;
import org.example.kairos.entity.LoginAuditEntity;

/**
 * 登录审计 Mapper。
 * <p>
 * 仅用于追加日志,不提供查询接口(查询通过 BI 直查表完成)。
 */
@Mapper
public interface LoginAuditMapper {
    /** 写入一条登录审计记录 */
    int insert(LoginAuditEntity entity);
}
