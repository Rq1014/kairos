package org.example.kairos.web.dict;

import org.example.kairos.common.Result;
import org.example.kairos.gateway.annotation.PublicApi;
import org.example.kairos.model.response.dict.GradSchoolResponse;
import org.example.kairos.model.response.dict.MajorResponse;
import org.example.kairos.model.response.dict.UniversityDetailResponse;
import org.example.kairos.model.response.dict.UniversityListResponse;
import org.example.kairos.model.response.dict.UniversityTreeResponse;
import org.example.kairos.service.dict.DictionaryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/**
 * 大学/研究科/专业字典查询接口,全部公开。
 * <p>
 * 路径分布:
 * <ul>
 *   <li>列表: GET /universities,支持分页与多条件过滤</li>
 *   <li>树形: GET /universities/tree,一次拉取完整三级数据</li>
 *   <li>单个: GET /universities/{code}</li>
 *   <li>研究科: GET /universities/{code}/grad-schools</li>
 *   <li>专业:  GET /grad-schools/{gradCode}/majors?universityCode=xxx</li>
 * </ul>
 */
@RestController
@RequestMapping("/api/dict")
@PublicApi
public class UniversityDictController {

    @Autowired private DictionaryService dictionaryService;

    /** 大学列表分页查询,支持区域分组/类型/关键字三种过滤条件组合 */
    @GetMapping("/universities")
    public Result<UniversityListResponse> list(
            @RequestParam(required = false) String regionGroup,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int pageSize) {
        return Result.ok(dictionaryService.listUniversities(regionGroup, type, keyword, page, pageSize));
    }

    /** 一次拉取完整大学/研究科/专业三级树,适合移动端启动后填充选择器 */
    @GetMapping("/universities/tree")
    public Result<UniversityTreeResponse> tree() {
        return Result.ok(dictionaryService.getTree());
    }

    /** 单个大学详情,含下属研究科 */
    @GetMapping("/universities/{code}")
    public Result<UniversityDetailResponse> detail(@PathVariable String code) {
        return Result.ok(dictionaryService.getUniversity(code));
    }

    /** 某大学下的全部研究科列表 */
    @GetMapping("/universities/{code}/grad-schools")
    public Result<Map<String, Object>> gradSchools(@PathVariable String code) {
        List<GradSchoolResponse> items = dictionaryService.getGradSchools(code);
        return Result.ok(Map.of("universityId", code, "items", items));
    }

    /** 某研究科下的全部专业列表;gradCode 兼容传入研究科 nameJp */
    @GetMapping("/grad-schools/{gradCode}/majors")
    public Result<Map<String, Object>> majors(@PathVariable String gradCode,
                                              @RequestParam("universityCode") String universityCode) {
        List<MajorResponse> items = dictionaryService.getMajors(universityCode, gradCode);
        return Result.ok(Map.of(
                "universityId", universityCode,
                "gradSchoolId", gradCode,
                "items", items
        ));
    }
}
