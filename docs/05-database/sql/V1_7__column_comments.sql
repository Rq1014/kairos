-- =============================================================
--  Kairos-kakomon 迁移脚本 V1.7 — 补齐/校正列注释（不改结构）
--  对应：V1_0__init_schema.sql 已就地更新注释；本脚本供「已初始化、
--        无法重跑 DROP+CREATE」的线上库同步同样的 COMMENT。
--  执行环境：MySQL 8.x
--  前置：V1_0（用户域 + 字典域全部表）
--  幂等：全部为 ALTER TABLE ... MODIFY COLUMN，仅覆盖 COMMENT，
--        列类型 / NULL / DEFAULT / ON UPDATE 与 V1_0 逐字一致，可安全重复执行。
--  注意：MODIFY COLUMN 必须完整重述列定义，缺失的属性会被重置，
--        故此处所有属性均与 V1_0 对齐；改注释文案时两个文件需同步。
-- =============================================================

USE `kakomon`;
SET NAMES utf8mb4;

-- -------------------------------------------------------------
--  1. 字典域
-- -------------------------------------------------------------

ALTER TABLE `university`
    MODIFY `id`           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '自增主键, 内部使用',
    MODIFY `code`         VARCHAR(40)     NOT NULL                COMMENT '业务码, 前端 universityId, e.g. todai',
    MODIFY `name_cn`      VARCHAR(80)     NULL                    COMMENT '中文名, e.g. 东京大学',
    MODIFY `name_jp`      VARCHAR(80)     NOT NULL                COMMENT '日文名(官方名), e.g. 東京大学',
    MODIFY `name_en`      VARCHAR(120)    NULL                    COMMENT '英文名, e.g. The University of Tokyo',
    MODIFY `short_name`   VARCHAR(20)     NOT NULL                COMMENT '简称, 前端列表/标签展示用, e.g. 东大',
    MODIFY `type`         VARCHAR(16)     NOT NULL                COMMENT '办学性质: national=国立 / public=公立 / private=私立',
    MODIFY `region`       VARCHAR(40)     NULL                    COMMENT '所在行政区/都道府县, e.g. 东京都',
    MODIFY `region_group` VARCHAR(20)     NULL                    COMMENT '前端筛选用大区分组, e.g. 首都圏 / 关西',
    MODIFY `status`       TINYINT         NOT NULL DEFAULT 1      COMMENT '上架状态: 1=ONLINE(展示) / 2=OFFLINE(隐藏)',
    MODIFY `sort_order`   INT             NOT NULL DEFAULT 0      COMMENT '排序权重, 值越大越靠前(desc)',
    MODIFY `created_at`   DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3)                              COMMENT '创建时间',
    MODIFY `updated_at`   DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3) COMMENT '更新时间, 行变更自动刷新';

ALTER TABLE `grad_school`
    MODIFY `id`            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '自增主键, 内部使用',
    MODIFY `university_id` BIGINT UNSIGNED NOT NULL                COMMENT '所属大学, ref university.id',
    MODIFY `code`          VARCHAR(80)     NOT NULL                COMMENT '业务码, 校内唯一短码, e.g. info-rikō',
    MODIFY `name_cn`       VARCHAR(120)    NULL                    COMMENT '中文名, e.g. 情报理工学系研究科',
    MODIFY `name_jp`       VARCHAR(120)    NOT NULL                COMMENT '日文名(官方名), e.g. 情報理工学系研究科',
    MODIFY `name_en`       VARCHAR(255)    NULL                    COMMENT '英文名',
    MODIFY `category`      VARCHAR(20)     NOT NULL DEFAULT 'daigakuin' COMMENT '层级: daigakuin=大学院(研究科) / gakubu=学部(学院)',
    MODIFY `sort_order`    INT             NOT NULL DEFAULT 0      COMMENT '校内排序权重, 值越大越靠前(desc)',
    MODIFY `status`        TINYINT         NOT NULL DEFAULT 1      COMMENT '上架状态: 1=ONLINE(展示) / 2=OFFLINE(隐藏)',
    MODIFY `created_at`    DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3)                              COMMENT '创建时间',
    MODIFY `updated_at`    DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3) COMMENT '更新时间, 行变更自动刷新';

ALTER TABLE `major`
    MODIFY `id`             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '自增主键, 内部使用',
    MODIFY `university_id`  BIGINT UNSIGNED NOT NULL                COMMENT '所属大学, ref university.id(冗余, 便于直查)',
    MODIFY `grad_school_id` BIGINT UNSIGNED NOT NULL                COMMENT '所属研究科, ref grad_school.id',
    MODIFY `code`           VARCHAR(80)     NOT NULL                COMMENT '业务码, 前端 majorId, 同一研究科内唯一, e.g. cs',
    MODIFY `label`          VARCHAR(120)    NOT NULL                COMMENT '前端展示名 label, e.g. コンピュータ科学',
    MODIFY `short`          VARCHAR(40)     NULL                    COMMENT '前端简称 short, e.g. CS',
    MODIFY `description`    VARCHAR(255)    NULL                    COMMENT '前端描述 desc, 专业简介',
    MODIFY `subjects`       JSON            NULL                    COMMENT '考试科目示例(字符串数组), e.g. ["数学","アルゴリズム"]',
    MODIFY `sort_order`     INT             NOT NULL DEFAULT 0      COMMENT '研究科内排序权重, 值越大越靠前(desc)',
    MODIFY `status`         TINYINT         NOT NULL DEFAULT 1      COMMENT '上架状态: 1=ONLINE(展示) / 2=OFFLINE(隐藏)',
    MODIFY `created_at`     DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3)                              COMMENT '创建时间',
    MODIFY `updated_at`     DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3) COMMENT '更新时间, 行变更自动刷新';

-- -------------------------------------------------------------
--  2. 用户域
-- -------------------------------------------------------------

ALTER TABLE `user`
    MODIFY `id`            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '自增主键, 内部使用, 不对外暴露',
    MODIFY `user_no`       CHAR(20)        NOT NULL                COMMENT '业务主键, 雪花/ULID, 暴露给前端',
    MODIFY `status`        TINYINT         NOT NULL DEFAULT 1      COMMENT '账号状态: 1=ACTIVE / 2=FROZEN(冻结) / 3=DELETED(注销)',
    MODIFY `register_from` VARCHAR(20)     NOT NULL                COMMENT '注册来源渠道: PHONE/EMAIL/WECHAT/APPLE/LINE',
    MODIFY `created_at`    DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3)                              COMMENT '注册时间',
    MODIFY `updated_at`    DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3) COMMENT '更新时间, 行变更自动刷新',
    MODIFY `deleted_at`    DATETIME(3)     NULL                    COMMENT '注销时间, 软删除标记, NULL=未注销';

ALTER TABLE `user_identity`
    MODIFY `id`             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '自增主键, 内部使用',
    MODIFY `user_id`        BIGINT UNSIGNED NOT NULL                COMMENT '所属用户, ref user.id',
    MODIFY `identity_type`  VARCHAR(20)     NOT NULL                COMMENT '身份类型: PHONE/EMAIL/WECHAT/APPLE/LINE',
    MODIFY `identity_value` VARCHAR(255)    NOT NULL                COMMENT '身份标识值: 手机号 / 邮箱(小写) / 第三方 openId',
    MODIFY `verified`       TINYINT         NOT NULL DEFAULT 1      COMMENT '是否已验证: 1=已验证 / 0=未验证',
    MODIFY `is_primary`     TINYINT         NOT NULL DEFAULT 0      COMMENT '该 type 内是否为主身份: 1=主 / 0=次',
    MODIFY `bound_at`       DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3)                              COMMENT '绑定时间',
    MODIFY `last_login_at`  DATETIME(3)     NULL                    COMMENT '该身份最近一次登录时间, NULL=从未用它登录',
    MODIFY `created_at`     DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3)                              COMMENT '创建时间',
    MODIFY `updated_at`     DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3) COMMENT '更新时间, 行变更自动刷新';

ALTER TABLE `user_credential`
    MODIFY `user_id`       BIGINT UNSIGNED NOT NULL                COMMENT '所属用户, ref user.id, 同时为主键(一对一)',
    MODIFY `password_hash` VARCHAR(100)    NOT NULL                COMMENT '密码哈希, BCrypt 60 字符',
    MODIFY `password_salt` VARCHAR(64)     NOT NULL                COMMENT '密码盐值',
    MODIFY `failed_count`  INT             NOT NULL DEFAULT 0      COMMENT '连续登录失败次数, 成功后清零',
    MODIFY `locked_until`  DATETIME(3)     NULL                    COMMENT '锁定截止时间, NULL=未锁定; 超过阈值失败后置位',
    MODIFY `updated_at`    DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3) COMMENT '更新时间, 行变更自动刷新';

ALTER TABLE `user_profile`
    MODIFY `user_id`              BIGINT UNSIGNED NOT NULL            COMMENT '所属用户, ref user.id, 同时为主键(一对一)',
    MODIFY `nickname`             VARCHAR(30)     NOT NULL DEFAULT '小k'  COMMENT '昵称, 默认「小k」',
    MODIFY `bio`                  VARCHAR(120)    NULL                COMMENT '个人简介',
    MODIFY `avatar_url`           VARCHAR(512)    NULL                COMMENT '自定义头像 URL, NULL=用预设色',
    MODIFY `avatar_color`         VARCHAR(20)     NULL                COMMENT '前端预设头像色 token, e.g. indigo',
    MODIFY `major`                VARCHAR(120)    NULL                COMMENT '前端 selectedMajor.label 整串(冗余展示用)',
    MODIFY `selected_major_code`  VARCHAR(255)    NULL                COMMENT '当前选中的专业复合码, 形如 todai::info-rikō::cs',
    MODIFY `next_exam_name`       VARCHAR(60)     NULL                COMMENT '下次考试名称, 首页倒计时展示',
    MODIFY `next_exam_date`       DATE            NULL                COMMENT '下次考试日期',
    MODIFY `next_exam_duration`   SMALLINT        NULL                COMMENT '距考试倒计时天数(前端 durationDays), 冗余缓存',
    MODIFY `is_pro`               TINYINT         NOT NULL DEFAULT 0  COMMENT '是否 Pro 会员: 1=是 / 0=否',
    MODIFY `free_ai_remaining`    INT             NOT NULL DEFAULT 1  COMMENT '剩余免费 AI 提问次数',
    MODIFY `token_balance`        INT             NOT NULL DEFAULT 0  COMMENT '代币余额(付费/激励货币)',
    MODIFY `solved_count`         INT             NOT NULL DEFAULT 0  COMMENT '累计已解答题数',
    MODIFY `unclear_count`        INT             NOT NULL DEFAULT 0  COMMENT '累计标记「未搞懂」题数',
    MODIFY `wrong_count`          INT             NOT NULL DEFAULT 0  COMMENT '累计错题数',
    MODIFY `favorite_count`       INT             NOT NULL DEFAULT 0  COMMENT '累计收藏题数',
    MODIFY `ai_ask_count`         INT             NOT NULL DEFAULT 0  COMMENT '累计 AI 提问次数',
    MODIFY `contributor_points`   INT             NOT NULL DEFAULT 0  COMMENT '贡献者积分(论坛/纠错等激励)',
    MODIFY `onboarding_completed` TINYINT         NOT NULL DEFAULT 0  COMMENT '是否完成首次登录后的资料完善引导: 1=是 / 0=否',
    MODIFY `created_at`           DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3)                              COMMENT '创建时间',
    MODIFY `updated_at`           DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3) COMMENT '更新时间, 行变更自动刷新';

ALTER TABLE `user_target_school`
    MODIFY `id`               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '自增主键, 内部使用',
    MODIFY `user_id`          BIGINT UNSIGNED NOT NULL              COMMENT '所属用户, ref user.id',
    MODIFY `university_code`  VARCHAR(40)     NOT NULL              COMMENT '目标大学, ref university.code',
    MODIFY `school_type`      VARCHAR(20)     NOT NULL DEFAULT 'daigakuin' COMMENT '层级: daigakuin=大学院 / gakubu=学部',
    MODIFY `grad_school_code` VARCHAR(80)     NULL                  COMMENT '目标研究科, ref grad_school.code, 学部志愿时可空',
    MODIFY `major_code`       VARCHAR(80)     NULL                  COMMENT '目标专业, ref major.code, 未细化到专攻时可空',
    MODIFY `subjects`         JSON            NULL                  COMMENT '关注科目数组, e.g. ["数学","英语"]',
    MODIFY `priority`         INT             NOT NULL DEFAULT 1    COMMENT '志愿优先级, 升序(1=第一志愿); 免费额度取 priority 前 3',
    MODIFY `created_at`       DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3)                              COMMENT '创建时间',
    MODIFY `updated_at`       DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3) COMMENT '更新时间, 行变更自动刷新';

-- -------------------------------------------------------------
--  3. 审计 / 风控
-- -------------------------------------------------------------

ALTER TABLE `login_audit`
    MODIFY `id`             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '自增主键',
    MODIFY `user_id`        BIGINT UNSIGNED NULL                    COMMENT '命中的用户 id, ref user.id; NULL=身份不存在的失败尝试',
    MODIFY `identity_type`  VARCHAR(20)     NOT NULL                COMMENT '尝试登录的身份类型: PHONE/EMAIL/WECHAT/APPLE/LINE',
    MODIFY `identity_value` VARCHAR(255)    NOT NULL                COMMENT '尝试登录的身份标识值',
    MODIFY `login_method`   VARCHAR(20)     NOT NULL                COMMENT '登录方式: CODE(验证码)/PASSWORD/REFRESH(续签)/THIRD_PARTY',
    MODIFY `success`        TINYINT         NOT NULL                COMMENT '是否成功: 1=成功 / 0=失败',
    MODIFY `fail_reason`    VARCHAR(64)     NULL                    COMMENT '失败原因, success=0 时填, e.g. WRONG_PASSWORD',
    MODIFY `client_ip`      VARCHAR(64)     NULL                    COMMENT '客户端 IP(兼容 IPv6)',
    MODIFY `user_agent`     VARCHAR(255)    NULL                    COMMENT '客户端 User-Agent',
    MODIFY `device_id`      VARCHAR(80)     NULL                    COMMENT '设备标识',
    MODIFY `trace_id`       CHAR(32)        NULL                    COMMENT '请求链路追踪 id, 关联 Result.traceId',
    MODIFY `created_at`     DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3)                              COMMENT '发生时间';

ALTER TABLE `verify_code_log`
    MODIFY `id`             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '自增主键',
    MODIFY `identity_type`  VARCHAR(20)     NOT NULL                COMMENT '接收方身份类型: PHONE/EMAIL',
    MODIFY `identity_value` VARCHAR(255)    NOT NULL                COMMENT '接收方身份标识值: 手机号 / 邮箱',
    MODIFY `scene`          VARCHAR(20)     NOT NULL                COMMENT '发送场景: LOGIN/BIND(绑定)/UNBIND(解绑)/RESET_PASSWORD(重置密码)',
    MODIFY `client_ip`      VARCHAR(64)     NULL                    COMMENT '请求方客户端 IP, 用于频控',
    MODIFY `created_at`     DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3)                              COMMENT '发送时间';
