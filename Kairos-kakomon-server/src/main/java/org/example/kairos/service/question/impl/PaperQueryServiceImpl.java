package org.example.kairos.service.question.impl;

import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;
import org.example.kairos.common.ResultCode;
import org.example.kairos.common.exception.BizException;
import org.example.kairos.entity.ExamPaperEntity;
import org.example.kairos.entity.QuestionEntity;
import org.example.kairos.entity.SubjectEntity;
import org.example.kairos.mapper.dict.SubjectMapper;
import org.example.kairos.mapper.question.ExamPaperMapper;
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

    private Map<String, String> subjectNameMap() {
        Map<String, String> m = new HashMap<>();
        for (SubjectEntity s : subjectMapper.findAll()) m.put(s.getCode(), s.getNameJp());
        return m;
    }

    @Override
    public List<PaperListItemResponse> listByScope(String universityId, String graduateSchool) {
        List<ExamPaperEntity> papers = paperMapper.findByScope(universityId, graduateSchool);
        var names = subjectNameMap();
        List<PaperListItemResponse> out = new ArrayList<>();
        for (ExamPaperEntity p : papers) {
            PaperListItemResponse r = new PaperListItemResponse();
            r.setId(p.getCode());
            r.setYear(p.getYear());
            r.setSubjectCode(p.getSubjectCode());
            r.setSubject(names.getOrDefault(p.getSubjectCode(), p.getSubjectCode()));
            r.setTitle(p.getTitle());
            r.setDurationMinutes(p.getDurationMinutes());
            r.setSelectRule(parseSelectRule(p.getSelectRule()));
            r.setQuestionCount(questionMapper.findByPaperCode(p.getCode()).size());
            out.add(r);
        }
        return out;
    }

    @Override
    public PaperResponse getByCode(String code) {
        ExamPaperEntity p = paperMapper.findByCode(code);
        if (p == null) throw new BizException(ResultCode.PAPER_NOT_FOUND);
        var names = subjectNameMap();
        PaperResponse r = new PaperResponse();
        r.setId(p.getCode());
        r.setUniversityId(p.getUniversityCode());
        r.setGraduateSchool(p.getGradSchoolCode());
        r.setMajorId(p.getMajorCode());
        r.setYear(p.getYear());
        r.setSubjectCode(p.getSubjectCode());
        r.setSubject(names.getOrDefault(p.getSubjectCode(), p.getSubjectCode()));
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
            qi.setUniversityId(q.getUniversityCode());
            qi.setGraduateSchool(q.getGradSchoolCode());
            qi.setMajorId(q.getMajorCode());
            qi.setYear(q.getYear());
            qi.setSubjectCode(q.getSubjectCode());
            qi.setSubject(names.getOrDefault(q.getSubjectCode(), q.getSubjectCode()));
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
