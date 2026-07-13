-- =============================================================
-- Kairos-kakomon 迁移脚本 V2.2 — scope 归属 ⊆ major_subject 一致性
-- 对应设计: docs/superpowers/specs/2026-07-13-scope-major-subject-consistency-design.md
-- 前置: V1_8(major_subject 字典) + V2_0(scope 表) + V2_1(scope 种子) 已执行
-- 作用: scope 加 major_subject_id 外键, 由四列回填, 收紧 NOT NULL+FK
-- =============================================================
USE `kakomon`;
SET NAMES utf8mb4;

-- 1) 加列(先可空, 便于回填)
ALTER TABLE `question_scope`
  ADD COLUMN `major_subject_id` BIGINT UNSIGNED NULL COMMENT '归属四元, 关联 major_subject.id' AFTER `question_code`;
ALTER TABLE `exam_paper_scope`
  ADD COLUMN `major_subject_id` BIGINT UNSIGNED NULL COMMENT '归属四元, 关联 major_subject.id' AFTER `paper_code`;

-- 2) 回填: 由 scope 四列 join major_subject 求 id
UPDATE `question_scope` s
  JOIN `major_subject` ms
    ON ms.university_code = s.university_code AND ms.grad_school_code = s.grad_school_code
   AND ms.major_code = s.major_code AND ms.subject_code = s.subject_code
  SET s.major_subject_id = ms.id;

UPDATE `exam_paper_scope` s
  JOIN `major_subject` ms
    ON ms.university_code = s.university_code AND ms.grad_school_code = s.grad_school_code
   AND ms.major_code = s.major_code AND ms.subject_code = s.subject_code
  SET s.major_subject_id = ms.id;

-- 3) 收紧为 NOT NULL + 加外键
--    回填后若仍有 NULL, 说明存在孤儿归属(scope 四元不在 major_subject),
--    此处 NOT NULL 会失败, 正好暴露脏数据 — 须先补 major_subject 对应行再重跑。
ALTER TABLE `question_scope`
  MODIFY COLUMN `major_subject_id` BIGINT UNSIGNED NOT NULL,
  ADD CONSTRAINT `fk_qs_ms` FOREIGN KEY (`major_subject_id`) REFERENCES `major_subject`(`id`);

ALTER TABLE `exam_paper_scope`
  MODIFY COLUMN `major_subject_id` BIGINT UNSIGNED NOT NULL,
  ADD CONSTRAINT `fk_ps_ms` FOREIGN KEY (`major_subject_id`) REFERENCES `major_subject`(`id`);
