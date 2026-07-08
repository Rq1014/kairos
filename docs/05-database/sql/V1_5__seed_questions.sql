-- =============================================================
--  Kairos-kakomon 迁移脚本 V1.5 — 题目/试卷样例数据(东大 2024 数学整卷)
--  对应前端 src/mocks/data.ts 的 KAKOMON_PAPERS / q-todai-2024-math-*
--  仅用于本地 / 联调环境。前置：V1_4__questions_schema.sql
-- =============================================================

USE `kakomon`;
SET NAMES utf8mb4;

DELETE FROM `question_relation` WHERE from_question_code LIKE 'q-todai-2024-math-%';
DELETE FROM `question_knowledge_point` WHERE question_code LIKE 'q-todai-2024-math-%';
DELETE FROM `question` WHERE code LIKE 'q-todai-2024-math-%';
DELETE FROM `exam_paper` WHERE code = 'p-todai-2024-math';

INSERT INTO `exam_paper`
  (`code`, `university_code`, `grad_school_code`, `major_code`, `year`, `subject_code`, `title`,
   `duration_minutes`, `total_score`, `select_rule`, `instructions`, `status`, `sort_order`)
VALUES
  ('p-todai-2024-math', 'todai', 'info-sci', 'cs', 2024, 'math',
   '2024年度 大学院入学試験問題 数学', 150, NULL,
   '{"total":3,"choose":2}',
   '["試験開始の合図があるまで問題冊子を開かないこと。","解答は日本語または英語で記述すること。"]',
   1, 100);

INSERT INTO `question`
  (`code`, `paper_code`, `university_code`, `grad_school_code`, `major_code`, `year`, `subject_code`,
   `question_no`, `title`, `order_index`, `content_blocks`, `body_text`,
   `difficulty_label`, `difficulty_level`, `crowd_difficulty_rate`, `status`)
VALUES
  ('q-todai-2024-math-1', 'p-todai-2024-math', 'todai', 'info-sci', 'cs', 2024, 'math',
   '第1问', '定积分与常微分方程', 1, NULL,
   '（1）以下の定積分を求めよ。（2）微分方程式の一般解と特異解を求めよ。',
   '中等', 'medium', 0.500, 1),
  ('q-todai-2024-math-2', 'p-todai-2024-math', 'todai', 'info-sci', 'cs', 2024, 'math',
   '第2问', '3 次正方行列的固有值与幂', 2, NULL,
   '3 次正方行列 A について、固有値をすべて求め、Aⁿ を求めよ。',
   '中等偏难', 'hard', 0.600, 1),
  ('q-todai-2024-math-3', 'p-todai-2024-math', 'todai', 'info-sci', 'cs', 2024, 'math',
   '第3问', '固有值分解与矩阵函数', 3,
   '[{"type":"text","content":"設 3×3 実対称行列 A について、以下の問いに答えよ。"},{"type":"math","latex":"A v_1 = 2 v_1,\\\\quad A v_2 = -v_2,\\\\quad A v_3 = 5 v_3"},{"type":"text","content":"(1) A が対角化可能であることを示せ。"}]',
   '設 3×3 実対称行列 A について…(1)対角化可能を示せ (2)Aⁿ (3)B=A^2-6A+5I の固有値',
   '难', 'very_hard', 0.720, 1);

INSERT INTO `question_knowledge_point` (`question_code`, `knowledge_point`) VALUES
  ('q-todai-2024-math-1', '微积分'),
  ('q-todai-2024-math-1', '微分方程'),
  ('q-todai-2024-math-2', '线性代数'),
  ('q-todai-2024-math-2', '固有值'),
  ('q-todai-2024-math-3', '线性代数'),
  ('q-todai-2024-math-3', '固有值');

INSERT INTO `question_relation`
  (`from_question_code`, `to_question_code`, `level`, `match_type`, `reason`, `confidence`)
VALUES
  ('q-todai-2024-math-3', 'q-todai-2024-math-2', 2, 'same_point', '同为固有值考点', 0.800);
