package org.example.kairos.service.user.impl;

import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;
import org.example.kairos.common.ResultCode;
import org.example.kairos.common.enums.IdentityType;
import org.example.kairos.common.enums.UserStatus;
import org.example.kairos.common.exception.BizException;
import org.example.kairos.entity.GradSchoolEntity;
import org.example.kairos.entity.LoginAuditEntity;
import org.example.kairos.entity.MajorEntity;
import org.example.kairos.entity.UniversityEntity;
import org.example.kairos.entity.UserCredentialEntity;
import org.example.kairos.entity.UserEntity;
import org.example.kairos.entity.UserIdentityEntity;
import org.example.kairos.entity.UserProfileEntity;
import org.example.kairos.entity.UserTargetSchoolEntity;
import org.example.kairos.mapper.auth.LoginAuditMapper;
import org.example.kairos.mapper.auth.UserCredentialMapper;
import org.example.kairos.mapper.dict.GradSchoolMapper;
import org.example.kairos.mapper.dict.MajorMapper;
import org.example.kairos.mapper.dict.UniversityMapper;
import org.example.kairos.mapper.user.UserIdentityMapper;
import org.example.kairos.mapper.user.UserMapper;
import org.example.kairos.mapper.user.UserProfileMapper;
import org.example.kairos.mapper.user.UserTargetSchoolMapper;
import org.example.kairos.model.request.user.PatchProfileRequest;
import org.example.kairos.model.request.user.UpdateTargetSchoolsRequest;
import org.example.kairos.model.response.user.DeactivateResponse;
import org.example.kairos.model.response.user.IdentityResponse;
import org.example.kairos.model.response.user.NextExamDto;
import org.example.kairos.model.response.user.TargetSchoolResponse;
import org.example.kairos.model.response.user.UserResponse;
import org.example.kairos.service.auth.TokenService;
import org.example.kairos.service.user.UserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;

/**
 * 用户领域服务实现。
 * <p>
 * 关键流程:
 * <ul>
 *   <li>{@link #createUser} 同事务创建 user 与 user_profile 两条记录</li>
 *   <li>{@link #buildUserResponse} 聚合主表 + profile + identities + targetSchools + 凭证标记</li>
 *   <li>{@link #patchProfile} 增量更新非空字段,昵称做长度校验</li>
 *   <li>{@link #replaceTargetSchools} 全量替换语义,先删后插</li>
 * </ul>
 * userNo 由 "u" + 时间戳 + 随机数生成,长度上限 20 字符。
 */
@Service
public class UserServiceImpl implements UserService {

    private static final Logger log = LoggerFactory.getLogger(UserServiceImpl.class);
    private static final DateTimeFormatter ISO_DATE_TIME = DateTimeFormatter.ISO_OFFSET_DATE_TIME;

    @Autowired private UserMapper userMapper;
    @Autowired private UserIdentityMapper userIdentityMapper;
    @Autowired private UserProfileMapper userProfileMapper;
    @Autowired private UserTargetSchoolMapper userTargetSchoolMapper;
    @Autowired private UserCredentialMapper userCredentialMapper;
    @Autowired private UniversityMapper universityMapper;
    @Autowired private GradSchoolMapper gradSchoolMapper;
    @Autowired private MajorMapper majorMapper;
    @Autowired private LoginAuditMapper loginAuditMapper;
    @Autowired private TokenService tokenService;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private org.example.kairos.service.billing.BillingService billingService;

    @Override
    @Transactional
    public Long createUser(String registerFrom) {
        UserEntity user = new UserEntity();
        user.setUserNo(genUserNo());
        user.setStatus(1);
        user.setRegisterFrom(registerFrom);
        userMapper.insert(user);

        UserProfileEntity profile = new UserProfileEntity();
        profile.setUserId(user.getId());
        profile.setNickname("小k");
        profile.setIsPro(0);
        profile.setFreeAiRemaining(1);
        profile.setTokenBalance(0);
        profile.setSolvedCount(0);
        profile.setUnclearCount(0);
        profile.setWrongCount(0);
        profile.setFavoriteCount(0);
        profile.setAiAskCount(0);
        profile.setContributorPoints(0);
        profile.setOnboardingCompleted(0);
        userProfileMapper.insert(profile);
        return user.getId();
    }

    @Override
    public UserEntity findByUserNo(String userNo) {
        return userMapper.findByUserNo(userNo);
    }

    @Override
    public UserEntity findById(Long userId) {
        return userMapper.findById(userId);
    }

    @Override
    public UserProfileEntity findProfile(Long userId) {
        return userProfileMapper.findByUserId(userId);
    }

    @Override
    public UserResponse buildUserResponse(Long userId) {
        UserEntity user = userMapper.findById(userId);
        if (user == null) throw new BizException(ResultCode.USER_NOT_FOUND);
        UserProfileEntity profile = userProfileMapper.findByUserId(userId);
        List<UserIdentityEntity> identities = userIdentityMapper.findByUserId(userId);
        UserCredentialEntity cred = userCredentialMapper.findByUserId(userId);

        UserResponse resp = new UserResponse();
        resp.setId(user.getUserNo());
        resp.setCreatedAt(user.getCreatedAt() != null
                ? user.getCreatedAt().atZone(java.time.ZoneId.systemDefault()).toInstant().toString()
                : null);
        resp.setHasPassword(cred != null);

        if (profile != null) {
            resp.setNickname(profile.getNickname());
            resp.setBio(profile.getBio());
            resp.setAvatarColor(profile.getAvatarColor());
            resp.setAvatarUrl(profile.getAvatarUrl());
            resp.setMajor(profile.getMajor() == null ? "" : profile.getMajor());
            resp.setSelectedMajorCode(profile.getSelectedMajorCode());
            resp.setIsPro(billingService.isProActive(userId));
            resp.setFreeAiRemaining(nz(profile.getFreeAiRemaining(), 1));
            resp.setTokenBalance(nz(profile.getTokenBalance(), 0));
            resp.setSolvedCount(nz(profile.getSolvedCount(), 0));
            resp.setUnclearCount(nz(profile.getUnclearCount(), 0));
            resp.setWrongCount(nz(profile.getWrongCount(), 0));
            resp.setFavoriteCount(nz(profile.getFavoriteCount(), 0));
            resp.setAiAskCount(nz(profile.getAiAskCount(), 0));
            resp.setContributorPoints(nz(profile.getContributorPoints(), 0));
            resp.setOnboardingCompleted(profile.getOnboardingCompleted() != null && profile.getOnboardingCompleted() == 1);
            if (profile.getNextExamName() != null && profile.getNextExamDate() != null) {
                resp.setNextExam(new NextExamDto(
                        profile.getNextExamName(),
                        profile.getNextExamDate().format(DateTimeFormatter.ISO_LOCAL_DATE),
                        profile.getNextExamDuration()
                ));
            }
        } else {
            resp.setNickname("小k");
            resp.setMajor("");
        }

        if (identities != null) {
            List<IdentityResponse> identityList = new ArrayList<>();
            for (UserIdentityEntity i : identities) {
                IdentityResponse ir = new IdentityResponse();
                ir.setType(i.getIdentityType());
                ir.setValue(i.getIdentityValue());
                ir.setVerified(i.getVerified() != null && i.getVerified() == 1);
                ir.setIsPrimary(i.getIsPrimary() != null && i.getIsPrimary() == 1);
                if (i.getBoundAt() != null) {
                    ir.setBoundAt(i.getBoundAt().atZone(java.time.ZoneId.systemDefault()).toInstant().toString());
                }
                identityList.add(ir);
                if (IdentityType.PHONE.name().equals(i.getIdentityType())) {
                    resp.setPhone(i.getIdentityValue());
                } else if (IdentityType.EMAIL.name().equals(i.getIdentityType())) {
                    resp.setEmail(i.getIdentityValue());
                }
            }
            resp.setIdentities(identityList);
        }
        if (resp.getEmail() == null) resp.setEmail("");

        resp.setTargetSchools(buildTargetSchools(userId));
        resp.setWeakPoints(Collections.emptyList());
        return resp;
    }

    private List<TargetSchoolResponse> buildTargetSchools(Long userId) {
        List<UserTargetSchoolEntity> list = userTargetSchoolMapper.findByUserId(userId);
        if (list == null || list.isEmpty()) return Collections.emptyList();
        List<TargetSchoolResponse> result = new ArrayList<>();
        for (UserTargetSchoolEntity e : list) {
            TargetSchoolResponse r = new TargetSchoolResponse();
            r.setUniversityId(e.getUniversityCode());
            r.setType(e.getSchoolType());
            r.setGradSchool(e.getGradSchoolCode());
            r.setMajorId(e.getMajorCode());
            r.setPriority(e.getPriority());
            try {
                if (e.getSubjects() != null && !e.getSubjects().isBlank()) {
                    r.setSubjects(objectMapper.readValue(e.getSubjects(), new TypeReference<>() {}));
                } else {
                    r.setSubjects(Collections.emptyList());
                }
            } catch (Exception ex) {
                r.setSubjects(Collections.emptyList());
            }

            UniversityEntity uni = universityMapper.findByCode(e.getUniversityCode());
            if (uni != null) {
                r.setUniversityName(uni.getNameCn() != null ? uni.getNameCn() : uni.getNameJp());
                if (e.getGradSchoolCode() != null) {
                    GradSchoolEntity gs = gradSchoolMapper.findByUniversityIdAndCode(uni.getId(), e.getGradSchoolCode());
                    if (gs != null) {
                        r.setGradSchoolName(gs.getNameJp());
                        if (e.getMajorCode() != null) {
                            MajorEntity m = majorMapper.findByGradSchoolIdAndCode(gs.getId(), e.getMajorCode());
                            if (m != null) {
                                r.setMajorLabel(m.getLabel());
                            }
                        }
                    }
                }
            }
            result.add(r);
        }
        return result;
    }

    @Override
    @Transactional
    public UserResponse patchProfile(Long userId, PatchProfileRequest req) {
        UserProfileEntity update = new UserProfileEntity();
        update.setUserId(userId);
        if (req.getNickname() != null) {
            String nn = req.getNickname().trim();
            if (nn.isEmpty() || nn.length() > 30) {
                throw new BizException(ResultCode.NICKNAME_INVALID);
            }
            update.setNickname(nn);
        }
        if (req.getBio() != null) update.setBio(req.getBio());
        if (req.getAvatarColor() != null) update.setAvatarColor(req.getAvatarColor());
        if (req.getAvatarUrl() != null) update.setAvatarUrl(req.getAvatarUrl());
        if (req.getMajor() != null) update.setMajor(req.getMajor());
        if (req.getSelectedMajorCode() != null) update.setSelectedMajorCode(req.getSelectedMajorCode());
        if (req.getNextExam() != null) {
            update.setNextExamName(req.getNextExam().getName());
            if (req.getNextExam().getDate() != null && !req.getNextExam().getDate().isBlank()) {
                update.setNextExamDate(LocalDate.parse(req.getNextExam().getDate()));
            }
            update.setNextExamDuration(req.getNextExam().getDurationDays());
        }
        if (req.getOnboardingCompleted() != null) {
            update.setOnboardingCompleted(req.getOnboardingCompleted() ? 1 : 0);
        }
        userProfileMapper.update(update);
        return buildUserResponse(userId);
    }

    @Override
    @Transactional
    public UserResponse replaceTargetSchools(Long userId, UpdateTargetSchoolsRequest req) {
        userTargetSchoolMapper.deleteByUserId(userId);
        List<UpdateTargetSchoolsRequest.TargetSchoolItem> schools = req.getSchools();
        if (schools == null || schools.isEmpty()) {
            return buildUserResponse(userId);
        }
        if (schools.size() > 20) {
            throw new BizException(ResultCode.TARGET_SCHOOL_LIMIT);
        }
        List<UserTargetSchoolEntity> entities = new ArrayList<>();
        for (UpdateTargetSchoolsRequest.TargetSchoolItem s : schools) {
            if (s.getUniversityId() == null || s.getUniversityId().isBlank()) {
                throw new BizException(ResultCode.TARGET_SCHOOL_INVALID);
            }
            if (!universityMapper.existsByCode(s.getUniversityId())) {
                throw new BizException(ResultCode.TARGET_SCHOOL_INVALID,
                        "学校不存在: " + s.getUniversityId());
            }
            UserTargetSchoolEntity e = new UserTargetSchoolEntity();
            e.setUserId(userId);
            e.setUniversityCode(s.getUniversityId());
            e.setSchoolType(s.getType() == null ? "daigakuin" : s.getType());
            e.setGradSchoolCode(s.getGradSchool());
            e.setMajorCode(s.getMajorId());
            e.setPriority(s.getPriority() == null ? 1 : s.getPriority());
            try {
                e.setSubjects(objectMapper.writeValueAsString(
                        s.getSubjects() == null ? Collections.emptyList() : s.getSubjects()));
            } catch (Exception ex) {
                e.setSubjects("[]");
            }
            entities.add(e);
        }
        userTargetSchoolMapper.batchInsert(entities);
        return buildUserResponse(userId);
    }

    private static int nz(Integer v, int def) { return v == null ? def : v; }

    @Override
    @Transactional
    public DeactivateResponse deactivate(Long userId,
                                         String accessJti,
                                         long accessRemainingSeconds,
                                         String clientIp,
                                         String userAgent,
                                         String deviceId) {
        UserEntity user = userMapper.findById(userId);
        if (user == null || user.getStatus() != null
                && user.getStatus() == UserStatus.DELETED.getCode()) {
            throw new BizException(ResultCode.USER_ALREADY_DELETED);
        }

        // 1. 物理删除可重新注册的身份及凭证、敏感资料
        userIdentityMapper.deleteAllByUserId(userId);
        userCredentialMapper.deleteByUserId(userId);
        userTargetSchoolMapper.deleteByUserId(userId);
        userProfileMapper.deleteByUserId(userId);

        // 2. 主表软删,使用 deleted_at IS NULL 保证幂等
        int affected = userMapper.softDelete(userId);
        if (affected == 0) {
            // 极小概率并发场景:另一个事务已注销
            throw new BizException(ResultCode.USER_ALREADY_DELETED);
        }

        // 3. 审计:写一条 success=1 的注销记录
        auditDeactivate(userId, clientIp, userAgent, deviceId);

        // 4. 事务提交后再清 token,避免 DB 回滚但 Redis 已清的不一致
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                try {
                    if (accessJti != null && accessRemainingSeconds > 0) {
                        tokenService.revokeAccessToken(accessJti, accessRemainingSeconds);
                    }
                    tokenService.revokeAllRefreshTokens(userId);
                } catch (Exception e) {
                    log.warn("revoke tokens failed after deactivate userId={}: {}", userId, e.getMessage());
                }
            }
        });

        String deletedAt = LocalDateTime.now()
                .atZone(ZoneId.systemDefault())
                .toOffsetDateTime()
                .format(ISO_DATE_TIME);
        return new DeactivateResponse(user.getUserNo(), deletedAt);
    }

    private void auditDeactivate(Long userId, String clientIp, String userAgent, String deviceId) {
        try {
            LoginAuditEntity a = new LoginAuditEntity();
            a.setUserId(userId);
            a.setIdentityType(null);
            a.setIdentityValue(null);
            a.setLoginMethod("DEACTIVATE");
            a.setSuccess(1);
            a.setFailReason("USER_DEACTIVATE");
            a.setClientIp(clientIp);
            a.setUserAgent(userAgent);
            a.setDeviceId(deviceId);
            a.setTraceId(MDC.get("traceId"));
            loginAuditMapper.insert(a);
        } catch (Exception ignore) {
            // 审计失败不阻塞主流程
        }
    }

    /** 生成对外用户编号: "u" + 13 位时间戳 + 4 位随机数,截断到 20 字符内 */
    private static String genUserNo() {
        String prefix = "u";
        String time = String.valueOf(System.currentTimeMillis());
        int rnd = ThreadLocalRandom.current().nextInt(1000, 9999);
        String s = prefix + time + rnd;
        if (s.length() > 20) return s.substring(0, 20);
        return s;
    }
}
