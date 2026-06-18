package org.example.kairos.service.dict.impl;

import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;
import org.example.kairos.common.ResultCode;
import org.example.kairos.common.constant.CacheKeys;
import org.example.kairos.common.exception.BizException;
import org.example.kairos.entity.GradSchoolEntity;
import org.example.kairos.entity.MajorEntity;
import org.example.kairos.entity.UniversityEntity;
import org.example.kairos.mapper.dict.GradSchoolMapper;
import org.example.kairos.mapper.dict.MajorMapper;
import org.example.kairos.mapper.dict.UniversityMapper;
import org.example.kairos.model.response.dict.GradSchoolResponse;
import org.example.kairos.model.response.dict.MajorResponse;
import org.example.kairos.model.response.dict.UniversityDetailResponse;
import org.example.kairos.model.response.dict.UniversityListResponse;
import org.example.kairos.model.response.dict.UniversityResponse;
import org.example.kairos.model.response.dict.UniversityTreeResponse;
import org.example.kairos.service.dict.DictionaryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * 字典服务实现。
 * <p>
 * 数据组织:
 * <ul>
 *   <li>大学/研究科/专业三级结构,通过 universityId/gradSchoolId 关联</li>
 *   <li>对外暴露 code(而非自增 ID),便于版本演进</li>
 *   <li>major.subjects 字段为 JSON 数组字符串,通过 ObjectMapper 序列化</li>
 *   <li>版本号通过 Redis 单独存储,字典数据更新时递增,客户端据此重拉</li>
 * </ul>
 */
@Service
public class DictionaryServiceImpl implements DictionaryService {

    @Autowired private UniversityMapper universityMapper;
    @Autowired private GradSchoolMapper gradSchoolMapper;
    @Autowired private MajorMapper majorMapper;
    @Autowired private StringRedisTemplate redis;
    @Autowired private ObjectMapper objectMapper;

    @Override
    public int getVersion() {
        String v = redis.opsForValue().get(CacheKeys.DICT_VERSION);
        if (v == null) {
            redis.opsForValue().setIfAbsent(CacheKeys.DICT_VERSION, "1");
            return 1;
        }
        try { return Integer.parseInt(v); } catch (NumberFormatException e) { return 1; }
    }

    @Override
    public UniversityListResponse listUniversities(String regionGroup, String type, String keyword,
                                                   int page, int pageSize) {
        int p = Math.max(1, page);
        int ps = pageSize <= 0 ? 20 : Math.min(pageSize, 100);
        int offset = (p - 1) * ps;
        long total = universityMapper.countByFilter(regionGroup, type, keyword);
        List<UniversityEntity> list = universityMapper.findByFilter(regionGroup, type, keyword, offset, ps);
        UniversityListResponse resp = new UniversityListResponse();
        List<UniversityResponse> items = new ArrayList<>();
        for (UniversityEntity u : list) items.add(toResp(u));
        resp.setItems(items);
        resp.setTotal(total);
        resp.setPage(p);
        resp.setPageSize(ps);
        resp.setHasMore((long) offset + items.size() < total);
        resp.setVersion(getVersion());
        return resp;
    }

    @Override
    public UniversityDetailResponse getUniversity(String code) {
        UniversityEntity u = universityMapper.findByCode(code);
        if (u == null) throw new BizException(ResultCode.DICT_NOT_FOUND);
        UniversityDetailResponse d = new UniversityDetailResponse();
        d.setId(u.getCode());
        d.setNameCn(u.getNameCn());
        d.setNameJp(u.getNameJp());
        d.setNameEn(u.getNameEn());
        d.setShort(u.getShortName());
        d.setType(u.getType());
        d.setRegion(u.getRegion());
        d.setRegionGroup(u.getRegionGroup());

        List<GradSchoolEntity> gs = gradSchoolMapper.findByUniversityId(u.getId());
        List<GradSchoolResponse> grads = new ArrayList<>();
        for (GradSchoolEntity g : gs) grads.add(toGradResp(g));
        d.setGradSchools(grads);
        return d;
    }

    @Override
    public List<GradSchoolResponse> getGradSchools(String universityCode) {
        UniversityEntity u = universityMapper.findByCode(universityCode);
        if (u == null) throw new BizException(ResultCode.DICT_NOT_FOUND);
        List<GradSchoolEntity> gs = gradSchoolMapper.findByUniversityId(u.getId());
        List<GradSchoolResponse> grads = new ArrayList<>();
        for (GradSchoolEntity g : gs) grads.add(toGradResp(g));
        return grads;
    }

    @Override
    public List<MajorResponse> getMajors(String universityCode, String gradCode) {
        UniversityEntity u = universityMapper.findByCode(universityCode);
        if (u == null) throw new BizException(ResultCode.DICT_NOT_FOUND);
        GradSchoolEntity g = gradSchoolMapper.findByUniversityIdAndCode(u.getId(), gradCode);
        if (g == null) {
            // 兼容前端使用 nameJp 作为 key
            g = gradSchoolMapper.findByUniversityIdAndNameJp(u.getId(), gradCode);
        }
        if (g == null) throw new BizException(ResultCode.DICT_NOT_FOUND);
        List<MajorEntity> ms = majorMapper.findByGradSchoolId(g.getId());
        List<MajorResponse> result = new ArrayList<>();
        for (MajorEntity m : ms) result.add(toMajorResp(m));
        return result;
    }

    @Override
    public UniversityTreeResponse getTree() {
        UniversityTreeResponse tree = new UniversityTreeResponse();
        tree.setVersion(getVersion());

        List<UniversityEntity> us = universityMapper.findAll();
        List<GradSchoolEntity> gs = gradSchoolMapper.findAll();
        List<MajorEntity> ms = majorMapper.findAll();

        java.util.Map<Long, List<GradSchoolEntity>> gradByUni = new java.util.HashMap<>();
        for (GradSchoolEntity g : gs) {
            gradByUni.computeIfAbsent(g.getUniversityId(), k -> new ArrayList<>()).add(g);
        }
        java.util.Map<Long, List<MajorEntity>> majorByGrad = new java.util.HashMap<>();
        for (MajorEntity m : ms) {
            majorByGrad.computeIfAbsent(m.getGradSchoolId(), k -> new ArrayList<>()).add(m);
        }

        List<UniversityTreeResponse.UniversityNode> uniNodes = new ArrayList<>();
        for (UniversityEntity u : us) {
            UniversityTreeResponse.UniversityNode un = new UniversityTreeResponse.UniversityNode();
            un.setId(u.getCode());
            un.setNameCn(u.getNameCn());
            un.setNameJp(u.getNameJp());
            un.setShort(u.getShortName());
            un.setRegionGroup(u.getRegionGroup());
            un.setType(u.getType());

            List<UniversityTreeResponse.GradSchoolNode> gradNodes = new ArrayList<>();
            for (GradSchoolEntity g : gradByUni.getOrDefault(u.getId(), Collections.emptyList())) {
                UniversityTreeResponse.GradSchoolNode gn = new UniversityTreeResponse.GradSchoolNode();
                gn.setId(g.getCode());
                gn.setNameJp(g.getNameJp());
                gn.setCategory(g.getCategory());

                List<UniversityTreeResponse.MajorNode> majorNodes = new ArrayList<>();
                for (MajorEntity m : majorByGrad.getOrDefault(g.getId(), Collections.emptyList())) {
                    UniversityTreeResponse.MajorNode mn = new UniversityTreeResponse.MajorNode();
                    mn.setId(m.getCode());
                    mn.setLabel(m.getLabel());
                    mn.setShort(m.getShortName());
                    mn.setDesc(m.getDescription());
                    mn.setSubjects(parseSubjects(m.getSubjects()));
                    majorNodes.add(mn);
                }
                gn.setMajors(majorNodes);
                gradNodes.add(gn);
            }
            un.setGradSchools(gradNodes);
            uniNodes.add(un);
        }
        tree.setUniversities(uniNodes);
        return tree;
    }

    private UniversityResponse toResp(UniversityEntity u) {
        UniversityResponse r = new UniversityResponse();
        r.setId(u.getCode());
        r.setNameCn(u.getNameCn());
        r.setNameJp(u.getNameJp());
        r.setNameEn(u.getNameEn());
        r.setShort(u.getShortName());
        r.setType(u.getType());
        r.setRegion(u.getRegion());
        r.setRegionGroup(u.getRegionGroup());
        return r;
    }

    private GradSchoolResponse toGradResp(GradSchoolEntity g) {
        GradSchoolResponse r = new GradSchoolResponse();
        r.setId(g.getCode());
        r.setNameJp(g.getNameJp());
        r.setNameCn(g.getNameCn());
        r.setNameEn(g.getNameEn());
        r.setCategory(g.getCategory());
        return r;
    }

    private MajorResponse toMajorResp(MajorEntity m) {
        MajorResponse r = new MajorResponse();
        r.setId(m.getCode());
        r.setLabel(m.getLabel());
        r.setShort(m.getShortName());
        r.setDesc(m.getDescription());
        r.setSubjects(parseSubjects(m.getSubjects()));
        return r;
    }

    private List<String> parseSubjects(String json) {
        if (json == null || json.isBlank()) return Collections.emptyList();
        try {
            return objectMapper.readValue(json, new TypeReference<List<String>>() {});
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }
}
