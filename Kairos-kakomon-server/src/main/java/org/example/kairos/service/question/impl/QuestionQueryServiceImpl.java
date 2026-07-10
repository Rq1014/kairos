package org.example.kairos.service.question.impl;

import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;
import org.example.kairos.common.ResultCode;
import org.example.kairos.common.exception.BizException;
import org.example.kairos.entity.QuestionEntity;
import org.example.kairos.entity.QuestionScopeEntity;
import org.example.kairos.entity.UniversityEntity;
import org.example.kairos.entity.SubjectEntity;
import org.example.kairos.gateway.context.UserContextHolder;
import org.example.kairos.mapper.dict.SubjectMapper;
import org.example.kairos.mapper.dict.UniversityMapper;
import org.example.kairos.mapper.question.ExamPaperScopeMapper;
import org.example.kairos.mapper.question.QuestionDifficultyVoteMapper;
import org.example.kairos.mapper.question.QuestionMapper;
import org.example.kairos.mapper.question.QuestionScopeMapper;
import org.example.kairos.mapper.question.QuestionUserMasteryMapper;
import org.example.kairos.model.bo.UserSession;
import org.example.kairos.model.response.question.ContentBlockDto;
import org.example.kairos.model.response.question.QuestionListItemResponse;
import org.example.kairos.model.response.question.QuestionListResponse;
import org.example.kairos.model.response.question.QuestionResponse;
import org.example.kairos.model.response.question.RelatedQuestionResponse;
import org.example.kairos.service.question.AccessGate;
import org.example.kairos.service.question.QuestionQueryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * 大问查询实现。JSON 列(content_blocks)通过 ObjectMapper 反序列化,失败降级为空列表。
 */
@Service
public class QuestionQueryServiceImpl implements QuestionQueryService {

    @Autowired private QuestionMapper questionMapper;
    @Autowired private SubjectMapper subjectMapper;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private UniversityMapper universityMapper;
    @Autowired private QuestionDifficultyVoteMapper voteMapper;
    @Autowired private QuestionUserMasteryMapper masteryMapper;
    @Autowired private QuestionScopeMapper questionScopeMapper;
    @Autowired private ExamPaperScopeMapper examPaperScopeMapper;
    @Autowired private AccessGate accessGate;

    private Map<String, String> subjectNameMap() {
        Map<String, String> m = new HashMap<>();
        for (SubjectEntity s : subjectMapper.findAll()) m.put(s.getCode(), s.getNameJp());
        return m;
    }

    @Override
    public QuestionListResponse list(String universityId, String graduateSchool, String majorId, Integer year,
                                     String subjectCode, String knowledgePoint, String keyword,
                                     int page, int pageSize) {
        int p = Math.max(1, page);
        int ps = pageSize <= 0 ? 20 : Math.min(pageSize, 100);
        int offset = (p - 1) * ps;
        long total = questionMapper.countByFilter(universityId, graduateSchool, majorId, year, subjectCode, knowledgePoint, keyword);
        List<QuestionEntity> rows = questionMapper.findByFilter(universityId, graduateSchool, majorId, year, subjectCode, knowledgePoint, keyword, offset, ps);
        var names = subjectNameMap();
        UserSession session = UserContextHolder.get();
        Long currentUserId = session != null ? session.getUserId() : null;
        List<QuestionListItemResponse> items = new ArrayList<>();
        for (QuestionEntity q : rows) items.add(toListItem(q, names, currentUserId));
        QuestionListResponse resp = new QuestionListResponse();
        resp.setItems(items);
        resp.setTotal(total);
        resp.setPage(p);
        resp.setPageSize(ps);
        resp.setHasMore((long) offset + items.size() < total);
        return resp;
    }

    @Override
    public QuestionResponse getByCode(String code, Long userId) {
        QuestionEntity q = questionMapper.findByCode(code);
        if (q == null) throw new BizException(ResultCode.QUESTION_NOT_FOUND);
        var names = subjectNameMap();
        String sc = primarySubjectCode(q);
        QuestionResponse r = new QuestionResponse();
        r.setId(q.getCode());
        r.setPaperId(q.getPaperCode());
        r.setSubjectCode(sc);
        r.setSubject(sc != null ? names.getOrDefault(sc, sc) : null);
        r.setQuestionNo(q.getQuestionNo());
        r.setTitle(q.getTitle());
        r.setOrderIndex(q.getOrderIndex());
        r.setContentBlocks(parseBlocks(q.getContentBlocks()));
        r.setBodyText(q.getBodyText());
        r.setDifficultyLabel(q.getDifficultyLabel());
        r.setDifficultyLevel(q.getDifficultyLevel());
        r.setKnowledgePoints(questionMapper.findKnowledgePoints(code));
        r.setCrowdDifficultyRate(q.getCrowdDifficultyRate());
        r.setCrowdVotes(parseCrowdVotes(q.getCrowdVotes()));
        r.setMyVote(userId != null ? voteMapper.findUserVote(userId, code) : null);
        r.setMasteryStatus(userId != null ? masteryMapper.findUserMastery(userId, code) : null);
        r.setLocked(accessGate.isLocked(userId, scopeKeysOf(q)));
        return r;
    }

    @Override
    public List<RelatedQuestionResponse> getRelated(String code) {
        QuestionEntity src = questionMapper.findByCode(code);
        if (src == null) return new ArrayList<>();
        var names = subjectNameMap();
        List<QuestionEntity> rows = questionMapper.findSameTopic(code, 6);
        List<RelatedQuestionResponse> out = new ArrayList<>();
        for (QuestionEntity q : rows) {
            QuestionScopeEntity ps = primaryScopeEntity(q);
            RelatedQuestionResponse r = new RelatedQuestionResponse();
            r.setId(q.getCode());
            r.setTitle(q.getTitle());
            r.setUniversityId(ps != null ? ps.getUniversityCode() : null);
            if (ps != null) {
                UniversityEntity u = universityMapper.findByCode(ps.getUniversityCode());
                r.setUniversityName(u != null ? u.getNameCn() : ps.getUniversityCode());
                r.setYear(ps.getYear());
                r.setSubjectCode(ps.getSubjectCode());
                r.setSubject(names.getOrDefault(ps.getSubjectCode(), ps.getSubjectCode()));
            }
            r.setQuestionNo(q.getQuestionNo());
            r.setKnowledgePoints(questionMapper.findKnowledgePoints(q.getCode()));
            out.add(r);
        }
        return out;
    }

    // ---- private helpers ----

    private List<AccessGate.ScopeKey> scopeKeysOf(QuestionEntity q) {
        List<AccessGate.ScopeKey> keys = new ArrayList<>();
        if (q.getPaperCode() == null) {
            for (var s : questionScopeMapper.findByQuestionCode(q.getCode()))
                keys.add(new AccessGate.ScopeKey(s.getUniversityCode(), s.getGradSchoolCode(), s.getYear()));
        } else {
            for (var ps : examPaperScopeMapper.findByPaperCode(q.getPaperCode()))
                keys.add(new AccessGate.ScopeKey(ps.getUniversityCode(), ps.getGradSchoolCode(), ps.getYear()));
        }
        return keys;
    }

    private String primarySubjectCode(QuestionEntity q) {
        if (q.getPaperCode() == null) {
            var list = questionScopeMapper.findByQuestionCode(q.getCode());
            return list.isEmpty() ? null : list.get(0).getSubjectCode();
        }
        var list = examPaperScopeMapper.findByPaperCode(q.getPaperCode());
        return list.isEmpty() ? null : list.get(0).getSubjectCode();
    }

    private QuestionScopeEntity primaryScopeEntity(QuestionEntity q) {
        if (q.getPaperCode() == null) {
            var l = questionScopeMapper.findByQuestionCode(q.getCode());
            return l.isEmpty() ? null : l.get(0);
        }
        // 挂卷题: 用 exam_paper_scope 主条构造一个等价 QuestionScopeEntity(仅取值)
        var l = examPaperScopeMapper.findByPaperCode(q.getPaperCode());
        if (l.isEmpty()) return null;
        var ps = l.get(0);
        QuestionScopeEntity s = new QuestionScopeEntity();
        s.setUniversityCode(ps.getUniversityCode());
        s.setGradSchoolCode(ps.getGradSchoolCode());
        s.setMajorCode(ps.getMajorCode());
        s.setSubjectCode(ps.getSubjectCode());
        s.setYear(ps.getYear());
        return s;
    }

    private QuestionListItemResponse toListItem(QuestionEntity q, Map<String, String> names, Long currentUserId) {
        String sc = primarySubjectCode(q);
        QuestionListItemResponse r = new QuestionListItemResponse();
        r.setId(q.getCode());
        r.setPaperId(q.getPaperCode());
        r.setSubjectCode(sc);
        r.setSubject(sc != null ? names.getOrDefault(sc, sc) : null);
        r.setQuestionNo(q.getQuestionNo());
        r.setTitle(q.getTitle());
        r.setOrderIndex(q.getOrderIndex());
        r.setDifficultyLabel(q.getDifficultyLabel());
        r.setDifficultyLevel(q.getDifficultyLevel());
        r.setKnowledgePoints(questionMapper.findKnowledgePoints(q.getCode()));
        r.setLocked(accessGate.isLocked(currentUserId, scopeKeysOf(q)));
        return r;
    }

    private Map<String, Integer> parseCrowdVotes(String json) {
        Map<String, Integer> base = new LinkedHashMap<>();
        base.put("easy", 0);
        base.put("medium", 0);
        base.put("hard", 0);
        if (json == null || json.isBlank()) return base;
        try {
            Map<String, Integer> parsed = objectMapper.readValue(json, new TypeReference<Map<String, Integer>>() {});
            for (String k : base.keySet()) if (parsed.get(k) != null) base.put(k, parsed.get(k));
        } catch (Exception ignore) { /* 降级为全 0 */ }
        return base;
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
