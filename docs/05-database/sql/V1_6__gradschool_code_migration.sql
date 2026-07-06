-- =============================================================
--  Kairos-kakomon 迁移脚本 V1.6 — 研究科标识 日文名 → code
--  对应设计文档：docs/superpowers/specs/2026-07-06-gradschool-code-unification-design.md
--  执行环境：MySQL 8.x
--  前置：V1_0（university/grad_school 字典）、V1_1（字典 seed）
--  幂等：JOIN grad_school ON name_jp = 旧值,只匹配"当前是日文名"的行;
--        已是 code 的行 join 不上、不动。可安全重复执行。
-- =============================================================

USE `kakomon`;
SET NAMES utf8mb4;

-- 用户目标校
UPDATE `user_target_school` t
JOIN `university`  u ON u.code = t.university_code
JOIN `grad_school` g ON g.university_id = u.id AND g.name_jp = t.grad_school_code
SET t.grad_school_code = g.code;

-- 大问(题库)
UPDATE `question` q
JOIN `university`  u ON u.code = q.university_code
JOIN `grad_school` g ON g.university_id = u.id AND g.name_jp = q.grad_school_code
SET q.grad_school_code = g.code;

-- 试卷
UPDATE `exam_paper` p
JOIN `university`  u ON u.code = p.university_code
JOIN `grad_school` g ON g.university_id = u.id AND g.name_jp = p.grad_school_code
SET p.grad_school_code = g.code;
