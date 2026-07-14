package org.example.kairos.mapper.dict;

import org.apache.ibatis.annotations.Mapper;

/** 字典元信息 Mapper。 */
@Mapper
public interface DictMetaMapper {
    /**
     * 内容派生的字典版本指纹。tree 相关表任一发生 增/改/删 都会改变。
     * = (跨表 MAX(updated_at/created_at) 的 epoch 秒 - 2020-01-01 基线) + 各表 SUM(COUNT(*))。
     * 时间戳分量覆盖增/改(软删是 UPDATE 也覆盖), 行数分量覆盖硬删。基线保证落在 int 范围。
     */
    long computeDictVersion();
}
