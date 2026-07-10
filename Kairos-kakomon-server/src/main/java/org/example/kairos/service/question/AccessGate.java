package org.example.kairos.service.question;

import org.example.kairos.entity.UserProfileEntity;
import org.example.kairos.entity.UserTargetSchoolEntity;
import org.example.kairos.mapper.user.UserProfileMapper;
import org.example.kairos.mapper.user.UserTargetSchoolMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.time.Year;
import java.util.Comparator;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/** 付费门禁: 按用户目标校+VIP 判定题目是否锁定。广告解锁由前端叠加。 */
@Component
public class AccessGate {
    private static final int FREE_TARGET_LIMIT = 3;
    private static final int FREE_YEAR_SPAN = 3;

    @Autowired private UserTargetSchoolMapper targetSchoolMapper;
    @Autowired private UserProfileMapper userProfileMapper;

    /** 一个归属维度(校+研究科+年) */
    public record ScopeKey(String universityCode, String gradSchoolCode, int year) {}

    /**
     * 任一 scope 命中免费范围 -> false(不锁)。userId 为 null(未登录) -> 按非 VIP 无目标校算。
     */
    public boolean isLocked(Long userId, List<ScopeKey> scopes) {
        if (scopes == null || scopes.isEmpty()) return true;
        if (userId == null) return true; // 未登录: 无免费目标, 一律锁(广告/登录后再放行)
        UserProfileEntity profile = userProfileMapper.findByUserId(userId);
        boolean isPro = profile != null && profile.getIsPro() != null && profile.getIsPro() == 1;
        if (isPro) return false;
        int floor = Year.now().getValue() - (FREE_YEAR_SPAN - 1);
        Set<String> freeKeys = targetSchoolMapper.findByUserId(userId).stream()
                .sorted(Comparator.comparing(t -> t.getPriority() == null ? Integer.MAX_VALUE : t.getPriority()))
                .limit(FREE_TARGET_LIMIT)
                .map(t -> t.getUniversityCode() + "::" + t.getGradSchoolCode())
                .collect(Collectors.toSet());
        for (ScopeKey s : scopes) {
            boolean inFreeTarget = freeKeys.contains(s.universityCode() + "::" + s.gradSchoolCode());
            boolean inFreeYear = s.year() >= floor;
            if (inFreeTarget && inFreeYear) return false;
        }
        return true;
    }
}
