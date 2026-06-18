package org.example.kairos.service.dict;

import org.example.kairos.model.response.dict.GradSchoolResponse;
import org.example.kairos.model.response.dict.MajorResponse;
import org.example.kairos.model.response.dict.UniversityDetailResponse;
import org.example.kairos.model.response.dict.UniversityListResponse;
import org.example.kairos.model.response.dict.UniversityTreeResponse;

import java.util.List;

/**
 * 字典服务,提供大学/研究科/专业的查询能力。
 * <p>
 * 字典数据通过 Redis 缓存,版本号机制配合 client 端缓存使用。
 */
public interface DictionaryService {
    /** 获取当前字典版本号,客户端用于判断本地缓存是否过期 */
    int getVersion();

    /**
     * 多条件分页查询大学列表。
     *
     * @param regionGroup 区域分组(可选)
     * @param type        类型(可选)
     * @param keyword     关键字(模糊匹配,可选)
     * @param page        页码,从 1 开始
     * @param pageSize    每页大小,1~100
     */
    UniversityListResponse listUniversities(String regionGroup, String type, String keyword,
                                            int page, int pageSize);

    /** 通过 code 查询大学详情(含下属研究科) */
    UniversityDetailResponse getUniversity(String code);

    /** 查询某大学下的全部研究科 */
    List<GradSchoolResponse> getGradSchools(String universityCode);

    /**
     * 查询某研究科下的全部专业。
     *
     * @param gradCode 研究科 code,兼容传入 nameJp
     */
    List<MajorResponse> getMajors(String universityCode, String gradCode);

    /** 获取大学/研究科/专业完整三级树形数据 */
    UniversityTreeResponse getTree();
}
