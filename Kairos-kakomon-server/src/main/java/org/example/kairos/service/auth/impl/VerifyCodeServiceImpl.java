package org.example.kairos.service.auth.impl;

import org.example.kairos.common.ResultCode;
import org.example.kairos.common.constant.CacheKeys;
import org.example.kairos.common.enums.IdentityType;
import org.example.kairos.common.enums.VerifyCodeScene;
import org.example.kairos.common.exception.BizException;
import org.example.kairos.config.VerifyCodeProperties;
import org.example.kairos.service.auth.VerifyCodeService;
import org.example.kairos.service.auth.VerifyCodeService.SendResult;
import org.example.kairos.service.notify.MailSender;
import org.example.kairos.service.notify.SmsSender;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.concurrent.ThreadLocalRandom;

/**
 * 验证码服务实现。
 * <p>
 * 流程:
 * <ol>
 *   <li>校验身份类型和场景的合法性</li>
 *   <li>校验手机号/邮箱格式</li>
 *   <li>检查重发冷却(60s)</li>
 *   <li>累加并校验同一身份当日上限</li>
 *   <li>累加并校验同一 IP 当日上限</li>
 *   <li>生成 6 位随机数字验证码,Redis 5 分钟 TTL</li>
 *   <li>异步通过 SmsSender / MailSender 发送</li>
 * </ol>
 * 校验时通过 verifyAndConsume 一次校验一次消费,防止重放。
 */
@Service
public class VerifyCodeServiceImpl implements VerifyCodeService {

    @Autowired private StringRedisTemplate redis;
    @Autowired private VerifyCodeProperties props;
    @Autowired private SmsSender smsSender;
    @Autowired private MailSender mailSender;

    @Override
    public SendResult sendCode(String identityType, String identityValue, String scene, String clientIp) {
        IdentityType type = IdentityType.fromString(identityType);
        VerifyCodeScene s = VerifyCodeScene.fromString(scene);
        if (type == null || s == null) {
            throw new BizException(ResultCode.IDENTITY_TYPE_INVALID);
        }
        validateValueFormat(type, identityValue);

        String typeStr = type.name();
        String value = identityValue;

        String cdKey = CacheKeys.verifyCodeCd(typeStr, value);
        if (Boolean.TRUE.equals(redis.hasKey(cdKey))) {
            throw new BizException(ResultCode.CODE_COOLDOWN);
        }

        String dailyKey = CacheKeys.verifyCodeDaily(typeStr, value);
        Long cnt = redis.opsForValue().increment(dailyKey);
        if (cnt != null && cnt == 1) {
            redis.expire(dailyKey, secondsUntilEndOfDay(), java.util.concurrent.TimeUnit.SECONDS);
        }
        if (cnt != null && cnt > props.getDailyLimitPerIdentity()) {
            throw new BizException(ResultCode.CODE_DAILY_LIMIT);
        }

        if (clientIp != null) {
            String ipKey = CacheKeys.verifyCodeIp(clientIp);
            Long ipCnt = redis.opsForValue().increment(ipKey);
            if (ipCnt != null && ipCnt == 1) {
                redis.expire(ipKey, secondsUntilEndOfDay(), java.util.concurrent.TimeUnit.SECONDS);
            }
            if (ipCnt != null && ipCnt > props.getDailyLimitPerIp()) {
                throw new BizException(ResultCode.RATE_LIMITED);
            }
        }

        String code = randomCode(props.getLength());
        String codeKey = CacheKeys.verifyCode(s.name(), typeStr, value);
        redis.opsForValue().set(codeKey, code, Duration.ofSeconds(props.getTtlSeconds()));
        redis.opsForValue().set(cdKey, "1", Duration.ofSeconds(props.getCooldownSeconds()));

        if (type == IdentityType.PHONE) {
            smsSender.send(value, code);
        } else if (type == IdentityType.EMAIL) {
            mailSender.send(value, code);
        }

        return new SendResult(true, props.getCooldownSeconds(), code);
    }

    @Override
    public boolean verifyAndConsume(String identityType, String identityValue, String scene, String code) {
        IdentityType type = IdentityType.fromString(identityType);
        VerifyCodeScene s = VerifyCodeScene.fromString(scene);
        if (type == null || s == null || code == null) return false;
        String key = CacheKeys.verifyCode(s.name(), type.name(), identityValue);
        String stored = redis.opsForValue().get(key);
        if (stored == null) return false;
        if (!stored.equals(code.trim())) return false;
        redis.delete(key);
        return true;
    }

    private void validateValueFormat(IdentityType type, String value) {
        if (value == null || value.isBlank()) {
            throw new BizException(ResultCode.IDENTITY_FORMAT_INVALID);
        }
        if (type == IdentityType.PHONE) {
            if (!value.matches("^1[3-9]\\d{9}$")) {
                throw new BizException(ResultCode.IDENTITY_FORMAT_INVALID);
            }
        } else if (type == IdentityType.EMAIL) {
            if (!value.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")) {
                throw new BizException(ResultCode.IDENTITY_FORMAT_INVALID);
            }
        }
    }

    /** 生成指定长度的纯数字验证码 */
    private String randomCode(int len) {
        StringBuilder sb = new StringBuilder(len);
        for (int i = 0; i < len; i++) sb.append(ThreadLocalRandom.current().nextInt(10));
        return sb.toString();
    }

    /** 计算到当日 24:00 还剩多少秒,用于"日上限"计数器的 TTL */
    private long secondsUntilEndOfDay() {
        LocalDateTime now = LocalDateTime.now(ZoneId.systemDefault());
        LocalDateTime tomorrow = now.toLocalDate().plusDays(1).atStartOfDay();
        return ChronoUnit.SECONDS.between(now, tomorrow);
    }
}
