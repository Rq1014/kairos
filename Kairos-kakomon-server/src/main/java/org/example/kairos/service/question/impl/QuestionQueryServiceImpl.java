package org.example.kairos.service.question.impl;

import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;
import org.example.kairos.common.ResultCode;
import org.example.kairos.common.exception.BizException;
import org.example.kairos.entity.QuestionEntity;
import org.example.kairos.entity.QuestionRelationEntity;
import org.example.kairos.mapper.question.QuestionMapper;
import org.example.kairos.mapper.question.QuestionRelationMapper;
import org.example.kairos.model.response.question.ContentBlockDto;
import org.example.kairos.model.response.question.QuestionListItemResponse;
import org.example.kairos.model.response.question.QuestionListResponse;
import org.example.kairos.model.response.question.QuestionResponse;
import org.example.kairos.model.response.question.RelatedQuestionResponse;
import org.example.kairos.service.question.QuestionQueryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * 大问查询实现。JSON 列(content_blocks)通过 ObjectMapper 反序列化,失败降级为空列表。
 */
@Service
public class QuestionQueryServiceImpl implements QuestionQueryService {

    @Autowired private QuestionMapper questionMapper;
    @Autowired private QuestionRelationMapper relationMapper;
    @Autowired private ObjectMapper objectMapper;

    @Override
    public QuestionListResponse list(String universityId, String graduateSchool, Integer year,
                                     String subject, String knowledgePoint, String keyword,
                                     int page, int pageSize) {
        int p = Math.max(1, page);
        int ps = pageSize <= 0 ? 20 : Math.min(pageSize, 100);
        int offset = (p - 1) * ps;
        long total = questionMapper.countByFilter(universityId, graduateSchool, year, subject, knowledgePoint, keyword);
        List<QuestionEntity> rows = questionMapper.findByFilter(universityId, graduateSchool, year, subject, knowledgePoint, keyword, offset, ps);
        List<QuestionListItemResponse> items = new ArrayList<>();
        for (QuestionEntity q : rows) items.add(toListItem(q));
        QuestionListResponse resp = new QuestionListResponse();
        resp.setItems(items);
        resp.setTotal(total);
        resp.setPage(p);
        resp.setPageSize(ps);
        resp.setHasMore((long) offset + items.size() < total);
        return resp;
    }

    @Override
    public QuestionResponse getByCode(String code) {
        QuestionEntity q = questionMapper.findByCode(code);
        if (q == null) throw new BizException(ResultCode.QUESTION_NOT_FOUND);
        QuestionResponse r = new QuestionResponse();
        r.setId(q.getCode());
        r.setPaperId(q.getPaperCode());
        r.setUniversityId(q.getUniversityCode());
        r.setGraduateSchool(q.getGradSchoolCode());
        r.setYear(q.getYear());
        r.setSubject(q.getSubject());
        r.setQuestionNo(q.getQuestionNo());
        r.setTitle(q.getTitle());
        r.setOrderIndex(q.getOrderIndex());
        r.setContentBlocks(parseBlocks(q.getContentBlocks()));
        r.setBodyText(q.getBodyText());
        r.setDifficultyLabel(q.getDifficultyLabel());
        r.setDifficultyLevel(q.getDifficultyLevel());
        r.setKnowledgePoints(questionMapper.findKnowledgePoints(code));
        return r;
    }

    @Override
    public List<RelatedQuestionResponse> getRelated(String code) {
        // 源题不存在也直接返回空列表(前端容错),不抛异常
        List<QuestionRelationEntity> edges = relationMapper.findFrom(code);
        List<RelatedQuestionResponse> out = new ArrayList<>();
        for (QuestionRelationEntity e : edges) {
            QuestionEntity target = questionMapper.findByCode(e.getToQuestionCode());
            if (target == null) continue;
            RelatedQuestionResponse r = new RelatedQuestionResponse();
            r.setId(target.getCode());
            r.setTitle(target.getTitle());
            r.setLevel(e.getLevel());
            r.setMatchType(e.getMatchType());
            r.setReason(e.getReason());
            out.add(r);
        }
        return out;
    }

    private QuestionListItemResponse toListItem(QuestionEntity q) {
        QuestionListItemResponse r = new QuestionListItemResponse();
        r.setId(q.getCode());
        r.setPaperId(q.getPaperCode());
        r.setUniversityId(q.getUniversityCode());
        r.setGraduateSchool(q.getGradSchoolCode());
        r.setYear(q.getYear());
        r.setSubject(q.getSubject());
        r.setQuestionNo(q.getQuestionNo());
        r.setTitle(q.getTitle());
        r.setOrderIndex(q.getOrderIndex());
        r.setDifficultyLabel(q.getDifficultyLabel());
        r.setDifficultyLevel(q.getDifficultyLevel());
        r.setKnowledgePoints(questionMapper.findKnowledgePoints(q.getCode()));
        return r;
    }

    private List<ContentBlockDto> parseBlocks(String json) {
        if (json == null || json.isBlank()) return Collections.emptyList();
        try {
            return objectMapper.readValue(json, new TypeReference<List<ContentBlockDto>>() {});
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }
}
