package org.example.kairos.web.question;

import jakarta.validation.Valid;
import org.example.kairos.common.Result;
import org.example.kairos.gateway.annotation.CurrentUser;
import org.example.kairos.gateway.annotation.PublicApi;
import org.example.kairos.model.bo.UserSession;
import org.example.kairos.model.request.question.DifficultyVoteRequest;
import org.example.kairos.model.request.question.MasteryRequest;
import org.example.kairos.model.response.question.DifficultyVoteResult;
import org.example.kairos.model.response.question.MasteryResult;
import org.example.kairos.model.response.question.QuestionListResponse;
import org.example.kairos.model.response.question.QuestionResponse;
import org.example.kairos.model.response.question.RelatedQuestionResponse;
import org.example.kairos.service.question.QuestionMutationService;
import org.example.kairos.service.question.QuestionQueryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 题目接口。列表/同专题公开只读; 详情与写操作（投票/掌握）强制登录。
 */
@RestController
@RequestMapping("/api")
public class QuestionController {

    @Autowired private QuestionQueryService questionQueryService;
    @Autowired private QuestionMutationService questionMutationService;

    /** 多条件分页筛选大问（列表不含 content_blocks）。公开。 */
    @PublicApi
    @GetMapping("/questions")
    public Result<QuestionListResponse> list(
            @RequestParam(required = false) String universityId,
            @RequestParam(required = false) String graduateSchool,
            @RequestParam(required = false) String majorId,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) String subjectCode,
            @RequestParam(required = false) String knowledgePoint,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int pageSize) {
        return Result.ok(questionQueryService.list(universityId, graduateSchool, majorId, year, subjectCode,
                knowledgePoint, keyword, page, pageSize));
    }

    /** 单个大问详情（含 content_blocks + 当前用户 myVote/masteryStatus）。强制登录。 */
    @GetMapping("/questions/{code}")
    public Result<QuestionResponse> detail(@CurrentUser UserSession s, @PathVariable String code) {
        return Result.ok(questionQueryService.getByCode(code, s.getUserId()));
    }

    /** 同专题（严格同 学校+研究科+专业+科目）。公开。 */
    @PublicApi
    @GetMapping("/questions/{code}/related")
    public Result<List<RelatedQuestionResponse>> related(@PathVariable String code) {
        return Result.ok(questionQueryService.getRelated(code));
    }

    /** 难度投票（可改投）。强制登录。 */
    @PostMapping("/questions/{code}/difficulty-vote")
    public Result<DifficultyVoteResult> vote(@CurrentUser UserSession s, @PathVariable String code,
                                             @RequestBody @Valid DifficultyVoteRequest req) {
        return Result.ok(questionMutationService.vote(s.getUserId(), code, req.getVote()));
    }

    /** 掌握自评。强制登录。 */
    @PutMapping("/questions/{code}/mastery")
    public Result<MasteryResult> mastery(@CurrentUser UserSession s, @PathVariable String code,
                                         @RequestBody @Valid MasteryRequest req) {
        return Result.ok(questionMutationService.setMastery(s.getUserId(), code, req.getMasteryStatus()));
    }
}
