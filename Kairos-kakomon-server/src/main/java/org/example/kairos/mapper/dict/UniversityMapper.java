package org.example.kairos.mapper.dict;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.example.kairos.entity.UniversityEntity;

import java.util.List;

/**
 * 大学字典 Mapper,提供大学列表与详情的查询能力。
 */
@Mapper
public interface UniversityMapper {
    /** 通过 code 查询单个大学 */
    UniversityEntity findByCode(@Param("code") String code);

    /** 全表扫描,用于构建树形数据 */
    List<UniversityEntity> findAll();

    /**
     * 多条件分页查询大学列表。
     *
     * @param regionGroup 区域分组(可选)
     * @param type        大学类型(可选)
     * @param keyword     关键字(模糊匹配中/日/英文名,可选)
     * @param offset      分页偏移量
     * @param limit       分页大小
     */
    List<UniversityEntity> findByFilter(@Param("regionGroup") String regionGroup,
                                        @Param("type") String type,
                                        @Param("keyword") String keyword,
                                        @Param("offset") int offset,
                                        @Param("limit") int limit);

    /** 多条件计数,与 {@link #findByFilter} 配合实现分页 */
    long countByFilter(@Param("regionGroup") String regionGroup,
                       @Param("type") String type,
                       @Param("keyword") String keyword);

    /** 判断 code 是否存在,用于目标学校校验,避免完整查表的开销 */
    boolean existsByCode(@Param("code") String code);
}
