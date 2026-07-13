package org.example.kairos.service.question;

import org.example.kairos.entity.UserProfileEntity;
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

    /** 预解析的用户门禁上下文,可复用于多题判定(纯计算,无 DB 访问)。 */
    public record GateContext(boolean isPro, Set<String> freeKeys, int freeYearFloor) {}

    /**
     * 预解析用户门禁上下文(profile + 目标校),适合列表场景一次解析、逐题复用。
     * userId 为 null(未登录)时返回 "全锁" 上下文。
     */
    public GateContext resolveContext(Long userId) {
        if (userId == null) return new GateContext(false, Set.of(), Integer.MAX_VALUE);
        UserProfileEntity profile = userProfileMapper.findByUserId(userId);
        boolean isPro = profile != null && profile.getIsPro() != null && profile.getIsPro() == 1;
        if (isPro) return new GateContext(true, Set.of(), 0);
        int floor = Year.now().getValue() - (FREE_YEAR_SPAN - 1);
        Set<String> freeKeys = targetSchoolMapper.findByUserId(userId).stream()
                .sorted(Comparator.comparing(t -> t.getPriority() == null ? Integer.MAX_VALUE : t.getPriority()))
                .limit(FREE_TARGET_LIMIT)
                .map(t -> t.getUniversityCode() + "::" + t.getGradSchoolCode())
                .collect(Collectors.toSet());
        return new GateContext(false, freeKeys, floor);
    }

    /**
     * 纯计算判定: 给定预解析的上下文,判断 scopes 是否锁定。无 DB 访问。
     */
    public boolean isLocked(GateContext ctx, List<ScopeKey> scopes) {
        if (scopes == null || scopes.isEmpty()) return true;
        if (ctx.isPro()) return false;
        for (ScopeKey s : scopes) {
            boolean inFreeTarget = ctx.freeKeys().contains(s.universityCode() + "::" + s.gradSchoolCode());
            boolean inFreeYear = s.year() >= ctx.freeYearFloor();
            if (inFreeTarget && inFreeYear) return false;
        }
        return true;
    }

    /**
     * 任一 scope 命中免费范围 -> false(不锁)。userId 为 null(未登录) -> 按非 VIP 无目标校算。
     * 单题场景(如 getByCode)便捷入口,内部调用 resolveContext。
     */
    public boolean isLocked(Long userId, List<ScopeKey> scopes) {
        if (scopes == null || scopes.isEmpty()) return true;
        if (userId == null) return true;
        return isLocked(resolveContext(userId), scopes);
    }
}
