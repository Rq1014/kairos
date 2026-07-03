package org.example.kairos.web.question;

import org.example.kairos.common.Result;
import org.example.kairos.gateway.annotation.PublicApi;
import org.example.kairos.model.response.question.PaperListItemResponse;
import org.example.kairos.model.response.question.PaperResponse;
import org.example.kairos.service.question.PaperQueryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** 试卷查询接口,全部公开只读(模考首页/整卷)。 */
@RestController
@RequestMapping("/api")
@PublicApi
public class PaperController {

    @Autowired private PaperQueryService paperQueryService;

    /** 按大学+研究科查试卷列表(模考年份卡)。 */
    @GetMapping("/papers")
    public Result<List<PaperListItemResponse>> list(
            @RequestParam String universityId,
            @RequestParam String graduateSchool) {
        return Result.ok(paperQueryService.listByScope(universityId, graduateSchool));
    }

    /** 单份试卷(含大问列表 + 选做规则 + 时长)。 */
    @GetMapping("/papers/{code}")
    public Result<PaperResponse> detail(@PathVariable String code) {
        return Result.ok(paperQueryService.getByCode(code));
    }
}
