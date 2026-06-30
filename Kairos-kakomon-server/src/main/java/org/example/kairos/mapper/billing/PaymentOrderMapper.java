package org.example.kairos.mapper.billing;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.example.kairos.entity.PaymentOrderEntity;

import java.time.LocalDateTime;

/** 支付订单 Mapper。 */
@Mapper
public interface PaymentOrderMapper {

    /** 插入新订单(回填自增 id)。 */
    int insert(PaymentOrderEntity e);

    /** 按订单号查询,不存在返回 null。 */
    PaymentOrderEntity findByOrderNo(@Param("orderNo") String orderNo);

    /** 将订单标记为已支付并写 paid_at,返回受影响行数。 */
    int markPaid(@Param("orderNo") String orderNo, @Param("paidAt") LocalDateTime paidAt);

    /** 将订单标记为已取消,返回受影响行数。 */
    int markCancelled(@Param("orderNo") String orderNo);
}
