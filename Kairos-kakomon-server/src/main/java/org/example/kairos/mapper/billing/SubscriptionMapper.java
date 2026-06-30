package org.example.kairos.mapper.billing;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.example.kairos.entity.SubscriptionEntity;

/** 订阅 Mapper。 */
@Mapper
public interface SubscriptionMapper {

    /** 查用户当前订阅(最新一行),无则返回 null。 */
    SubscriptionEntity findByUserId(@Param("userId") Long userId);

    /** 新建订阅(回填自增 id)。 */
    int insert(SubscriptionEntity e);

    /** 按 id 更新订阅的 plan/starts_at/expires_at/status/source_order_no。 */
    int update(SubscriptionEntity e);

    /** 将订阅标记为 EXPIRED。 */
    int markExpired(@Param("id") Long id);
}
