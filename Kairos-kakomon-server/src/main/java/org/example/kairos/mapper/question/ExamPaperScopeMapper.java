package org.example.kairos.mapper.question;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.example.kairos.entity.ExamPaperScopeEntity;

import java.util.List;

/** 试卷归属 Mapper(只读)。 */
@Mapper
public interface ExamPaperScopeMapper {
    /** 查某试卷的所有归属, 按 sort_order 升序 */
    List<ExamPaperScopeEntity> findByPaperCode(@Param("paperCode") String paperCode);
}
