package org.example.kairos.service.question;

import org.example.kairos.common.ResultCode;
import org.example.kairos.common.exception.BizException;
import org.example.kairos.mapper.dict.MajorSubjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

/**
 * 写 scope 归属前的一致性守卫: 校验 (校+研究科+专业+科目) 在 major_subject 字典存在,
 * 返回其 id。未来任何写 question_scope/exam_paper_scope 的路径都应先经此解析 id,
 * 并由 id 反查填四列, 保证 scope 四元 ⊆ major_subject。
 */
@Component
public class MajorSubjectGuard {

    @Autowired private MajorSubjectMapper majorSubjectMapper;

    /** 命中返回 major_subject.id; 未命中抛 MAJOR_SUBJECT_NOT_FOUND。 */
    public Long resolveId(String universityCode, String gradSchoolCode, String majorCode, String subjectCode) {
        Long id = majorSubjectMapper.findId(universityCode, gradSchoolCode, majorCode, subjectCode);
        if (id == null) throw new BizException(ResultCode.MAJOR_SUBJECT_NOT_FOUND);
        return id;
    }
}
