package org.example.kairos.mapper.user;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.example.kairos.entity.UserIdentityEntity;

import java.util.List;

/**
 * 用户身份 Mapper,管理用户与各类登录身份(手机/邮箱/三方)的绑定关系。
 */
@Mapper
public interface UserIdentityMapper {
    /** 新增身份绑定;若 (identity_type, identity_value) 已存在会因唯一索引失败 */
    int insert(UserIdentityEntity entity);

    /**
     * 通过身份类型和值反查所属用户(登录核心查询)。
     *
     * @return 不存在返回 null
     */
    UserIdentityEntity findByTypeAndValue(@Param("identityType") String identityType,
                                          @Param("identityValue") String identityValue);

    /** 查询某用户的全部身份(用于"我的"页展示绑定情况) */
    List<UserIdentityEntity> findByUserId(@Param("userId") Long userId);

    /** 查询某用户某类型的身份(同类型在用户内通常唯一) */
    UserIdentityEntity findByUserIdAndType(@Param("userId") Long userId,
                                           @Param("identityType") String identityType);

    /** 解绑身份;调用前需保证用户至少还会留有一种登录方式 */
    int deleteByUserIdAndType(@Param("userId") Long userId,
                              @Param("identityType") String identityType);

    /** 删除用户的全部身份(用于注销账号,释放手机号/邮箱供重新注册) */
    int deleteAllByUserId(@Param("userId") Long userId);

    /** 更新该身份的最近登录时间 */
    int updateLastLoginAt(@Param("id") Long id);

    /** 统计用户已绑定的身份数,用于解绑前的"至少保留一种"校验 */
    int countByUserId(@Param("userId") Long userId);
}
