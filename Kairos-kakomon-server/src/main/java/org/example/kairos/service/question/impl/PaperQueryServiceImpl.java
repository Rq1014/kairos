package org.example.kairos.service.question.impl;

import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;
import org.example.kairos.common.ResultCode;
import org.example.kairos.common.exception.BizException;
import org.example.kairos.entity.ExamPaperEntity;
import org.example.kairos.entity.ExamPaperScopeEntity;
import org.example.kairos.model.bo.PaperScopeRow;
import org.example.kairos.entity.QuestionEntity;
import org.example.kairos.entity.SubjectEntity;
import org.example.kairos.mapper.dict.SubjectMapper;
import org.example.kairos.mapper.question.ExamPaperMapper;
import org.example.kairos.mapper.question.ExamPaperScopeMapper;
import org.example.kairos.mapper.question.QuestionMapper;
import org.example.kairos.model.response.question.PaperListItemResponse;
import org.example.kairos.model.response.question.PaperResponse;
import org.example.kairos.model.response.question.QuestionListItemResponse;
import org.example.kairos.service.question.PaperQueryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/** 试卷查询实现。 */
@Service
public class PaperQueryServiceImpl implements PaperQueryService {

    @Autowired private ExamPaperMapper paperMapper;
    @Autowired private QuestionMapper questionMapper;
    @Autowired private SubjectMapper subjectMapper;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private ExamPaperScopeMapper examPaperScopeMapper;

    private Map<String, String> subjectNameMap() {
        Map<String, String> m = new HashMap<>();
        for (SubjectEntity s : subjectMapper.findAll()) m.put(s.getCode(), s.getNameJp());
        return m;
    }

    @Override
    public List<PaperListItemResponse> listByScope(String universityId, String graduateSchool, String majorId) {
        List<PaperScopeRow> rows = paperMapper.findScopeRowsByScope(universityId, graduateSchool, majorId);
        var names = subjectNameMap();
        List<PaperListItemResponse> out = new ArrayList<>();
        for (PaperScopeRow row : rows) {
            PaperListItemResponse r = new PaperListItemResponse();
            r.setId(row.getCode());
            // 用"匹配到的那条 scope"的年份/科目, 而非任意主 scope —— 多归属试卷落到它归属的每个抽屉
            r.setYear(row.getScopeYear());
            r.setSubjectCode(row.getScopeSubjectCode());
            r.setSubject(names.getOrDefault(row.getScopeSubjectCode(), row.getScopeSubjectCode()));
            r.setTitle(row.getTitle());
            r.setDurationMinutes(row.getDurationMinutes());
            r.setSelectRule(parseSelectRule(row.getSelectRule()));
            r.setQuestionCount(questionMapper.findByPaperCode(row.getCode()).size());
            out.add(r);
        }
        return out;
    }

    @Override
    public PaperResponse getByCode(String code) {
        ExamPaperEntity p = paperMapper.findByCode(code);
        if (p == null) throw new BizException(ResultCode.PAPER_NOT_FOUND);
        var names = subjectNameMap();
        ExamPaperScopeEntity primary = primaryScope(p.getCode());
        PaperResponse r = new PaperResponse();
        r.setId(p.getCode());
        r.setUniversityId(primary != null ? primary.getUniversityCode() : null);
        r.setGraduateSchool(primary != null ? primary.getGradSchoolCode() : null);
        r.setMajorId(primary != null ? primary.getMajorCode() : null);
        r.setYear(primary != null ? primary.getYear() : null);
        r.setSubjectCode(primary != null ? primary.getSubjectCode() : null);
        r.setSubject(primary != null ? names.getOrDefault(primary.getSubjectCode(), primary.getSubjectCode()) : null);
        r.setTitle(p.getTitle());
        r.setDurationMinutes(p.getDurationMinutes());
        r.setTotalScore(p.getTotalScore());
        r.setSelectRule(parseSelectRule(p.getSelectRule()));
        r.setInstructions(parseInstructions(p.getInstructions()));
        List<QuestionListItemResponse> qs = new ArrayList<>();
        for (QuestionEntity q : questionMapper.findByPaperCode(code)) {
            QuestionListItemResponse qi = new QuestionListItemResponse();
            qi.setId(q.getCode());
            qi.setPaperId(q.getPaperCode());
            // question 内嵌项的 subject 从卷的主 scope 取
            qi.setSubjectCode(primary != null ? primary.getSubjectCode() : null);
            qi.setSubject(primary != null ? names.getOrDefault(primary.getSubjectCode(), primary.getSubjectCode()) : null);
            qi.setQuestionNo(q.getQuestionNo());
            qi.setTitle(q.getTitle());
            qi.setOrderIndex(q.getOrderIndex());
            qi.setDifficultyLabel(q.getDifficultyLabel());
            qi.setDifficultyLevel(q.getDifficultyLevel());
            qi.setKnowledgePoints(questionMapper.findKnowledgePoints(q.getCode()));
            qs.add(qi);
        }
        r.setQuestions(qs);
        return r;
    }

    /** 取试卷的主 scope(sort_order 最小的第一条) */
    private ExamPaperScopeEntity primaryScope(String paperCode) {
        List<ExamPaperScopeEntity> list = examPaperScopeMapper.findByPaperCode(paperCode);
        return list.isEmpty() ? null : list.get(0);
    }

    private PaperResponse.SelectRule parseSelectRule(String json) {
        if (json == null || json.isBlank()) return null;
        try {
            return objectMapper.readValue(json, PaperResponse.SelectRule.class);
        } catch (Exception e) {
            return null;
        }
    }

    private List<String> parseInstructions(String json) {
        if (json == null || json.isBlank()) return Collections.emptyList();
        try {
            return objectMapper.readValue(json, new TypeReference<List<String>>() {});
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }
}
