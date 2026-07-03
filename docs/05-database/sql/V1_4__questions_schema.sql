-- =============================================================
--  Kairos-kakomon 迁移脚本 V1.4 — 题目 / 试卷（专题学习 + 模拟考试）
--  对应设计文档：docs/superpowers/specs/2026-07-02-topic-study-and-mock-exam-design.md
--  执行环境：MySQL 8.x，utf8mb4 / utf8mb4_0900_ai_ci
--  前置：V1_0__init_schema.sql
-- =============================================================

USE `kakomon`;
SET NAMES utf8mb4;

DROP TABLE IF EXISTS `question_relation`;
DROP TABLE IF EXISTS `question_knowledge_point`;
DROP TABLE IF EXISTS `question`;
DROP TABLE IF EXISTS `exam_paper`;

-- -------------------------------------------------------------
--  试卷：大学×研究科×年份×科目 唯一
-- -------------------------------------------------------------
CREATE TABLE `exam_paper` (
    `id`                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
    `code`              VARCHAR(80)     NOT NULL                COMMENT '对外业务 id, 如 p-todai-2024-math',
    `university_code`   VARCHAR(40)     NOT NULL                COMMENT '大学 code, 关联 university.code',
    `grad_school_code`  VARCHAR(80)     NOT NULL                COMMENT '研究科 code / nameJp',
    `major_code`        VARCHAR(80)     NULL                    COMMENT '专业 code, 可空',
    `year`              SMALLINT        NOT NULL                COMMENT '年度, 如 2024',
    `subject`           VARCHAR(60)     NOT NULL                COMMENT '科目, 如 数学',
    `title`             VARCHAR(200)    NOT NULL                COMMENT '展示标题',
    `duration_minutes`  SMALLINT        NULL                    COMMENT '考试时长(分钟), 供模考倒计时',
    `total_score`       INT             NULL                    COMMENT '总分, 可空',
    `select_rule`       JSON            NULL                    COMMENT '选做规则 JSON, 如 {"total":3,"choose":2}',
    `instructions`      JSON            NULL                    COMMENT '注意事项文本数组 JSON',
    `source_pdf_key`    VARCHAR(512)    NULL                    COMMENT '原始 PDF 的 S3 key, 可空',
    `status`            TINYINT         NOT NULL DEFAULT 1      COMMENT '1=上线 0=下线',
    `sort_order`        INT             NOT NULL DEFAULT 0      COMMENT '排序权重',
    `created_at`        DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at`        DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_paper_code` (`code`),
    UNIQUE KEY `uk_paper_scope` (`university_code`, `grad_school_code`, `year`, `subject`),
    KEY `idx_paper_filter` (`university_code`, `grad_school_code`, `status`)
) ENGINE = InnoDB COMMENT = '试卷';

-- -------------------------------------------------------------
--  大问(第N问)：冗余大学/科目等列以支撑跨试卷筛选直查不 join
-- -------------------------------------------------------------
CREATE TABLE `question` (
    `id`                     BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
    `code`                   VARCHAR(80)     NOT NULL                COMMENT '对外业务 id, 如 q-todai-2024-math-3',
    `paper_code`             VARCHAR(80)     NULL                    COMMENT '所属试卷 code, 可空(散题)',
    `university_code`        VARCHAR(40)     NOT NULL                COMMENT '冗余: 大学 code',
    `grad_school_code`       VARCHAR(80)     NOT NULL                COMMENT '冗余: 研究科 code',
    `year`                   SMALLINT        NOT NULL                COMMENT '冗余: 年度',
    `subject`                VARCHAR(60)     NOT NULL                COMMENT '冗余: 科目',
    `question_no`            VARCHAR(20)     NOT NULL                COMMENT '题号, 如 第3问',
    `title`                  VARCHAR(200)    NOT NULL                COMMENT '大问标题',
    `order_index`            INT             NOT NULL DEFAULT 0      COMMENT '卷内顺序',
    `content_blocks`         JSON            NULL                    COMMENT '结构化题干 JSON 数组(text/math/image/table)',
    `body_text`              TEXT            NULL                    COMMENT 'blocks 内 text 拼接, 供 FULLTEXT/AI',
    `difficulty_label`       VARCHAR(20)     NULL                    COMMENT '难度中文标签',
    `difficulty_level`       VARCHAR(16)     NULL                    COMMENT 'easy/medium/hard/very_hard',
    `crowd_difficulty_rate`  DECIMAL(4,3)    NULL                    COMMENT '众包难度 0~1',
    `crowd_votes`            JSON            NULL                    COMMENT '众包投票 JSON {easy,medium,hard}',
    `status`                 TINYINT         NOT NULL DEFAULT 1      COMMENT '1=上线 0=下线',
    `created_at`             DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at`             DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_question_code` (`code`),
    KEY `idx_q_filter` (`university_code`, `grad_school_code`, `year`, `subject`, `status`),
    KEY `idx_q_paper` (`paper_code`, `order_index`),
    FULLTEXT KEY `ft_q_body` (`title`, `body_text`) WITH PARSER ngram
) ENGINE = InnoDB COMMENT = '大问(第N问)';

-- -------------------------------------------------------------
--  大问 ↔ 知识点(多对多)
-- -------------------------------------------------------------
CREATE TABLE `question_knowledge_point` (
    `id`               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
    `question_code`    VARCHAR(80)     NOT NULL                COMMENT '大问 code',
    `knowledge_point`  VARCHAR(80)     NOT NULL                COMMENT '知识点名, 如 固有值',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_q_kp` (`question_code`, `knowledge_point`),
    KEY `idx_kp` (`knowledge_point`)
) ENGINE = InnoDB COMMENT = '大问-知识点';

-- -------------------------------------------------------------
--  相似题/举一反三(预计算有向边)
-- -------------------------------------------------------------
CREATE TABLE `question_relation` (
    `id`                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
    `from_question_code`  VARCHAR(80)     NOT NULL                COMMENT '源大问 code',
    `to_question_code`    VARCHAR(80)     NOT NULL                COMMENT '目标大问 code',
    `level`               TINYINT         NOT NULL                COMMENT '1同题 2相似考点 3跨校相似',
    `match_type`          VARCHAR(20)     NOT NULL                COMMENT 'exact_question/same_point/similar_method',
    `reason`              VARCHAR(255)    NULL                    COMMENT '关系说明',
    `confidence`          DECIMAL(4,3)    NULL                    COMMENT '置信度 0~1',
    `created_at`          DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_relation` (`from_question_code`, `to_question_code`),
    KEY `idx_from` (`from_question_code`, `level`)
) ENGINE = InnoDB COMMENT = '相似题关系';
