package org.example.kairos.web.question;

import org.example.kairos.common.Result;
import org.example.kairos.gateway.annotation.PublicApi;
import org.example.kairos.model.response.question.QuestionListResponse;
import org.example.kairos.model.response.question.QuestionResponse;
import org.example.kairos.model.response.question.RelatedQuestionResponse;
import org.example.kairos.service.question.QuestionQueryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** 题目查询接口,全部公开只读。付费门禁由前端 accessPolicy 判定。 */
@RestController
@RequestMapping("/api")
@PublicApi
public class QuestionController {

    @Autowired private QuestionQueryService questionQueryService;

    /** 多条件分页筛选大问(列表不含 content_blocks)。 */
    @GetMapping("/questions")
    public Result<QuestionListResponse> list(
            @RequestParam(required = false) String universityId,
            @RequestParam(required = false) String graduateSchool,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) String subject,
            @RequestParam(required = false) String knowledgePoint,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int pageSize) {
        return Result.ok(questionQueryService.list(universityId, graduateSchool, year, subject,
                knowledgePoint, keyword, page, pageSize));
    }

    /** 单个大问详情(含 content_blocks)。 */
    @GetMapping("/questions/{code}")
    public Result<QuestionResponse> detail(@PathVariable String code) {
        return Result.ok(questionQueryService.getByCode(code));
    }

    /** 举一反三。 */
    @GetMapping("/questions/{code}/related")
    public Result<List<RelatedQuestionResponse>> related(@PathVariable String code) {
        return Result.ok(questionQueryService.getRelated(code));
    }
}
