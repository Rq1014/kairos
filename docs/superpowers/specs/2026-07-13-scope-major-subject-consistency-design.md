# 归属 ⊆ 科目字典一致性（scope ↔ major_subject）— 设计

- **日期**：2026-07-13
- **相关**：`docs/superpowers/specs/2026-07-09-question-multi-attribution-design.md`（M:N 多归属，本 spec 为其补一致性约束）、`docs/superpowers/specs/2026-07-08-subject-major-dimension-design.md`（major_subject 字典）
- **主战场**：DB（新迁移 `V2_2` + 修种子 V1_8/V2_1 + 修 V2_0 一处 bug）+ 后端写入校验组件

## 1. 背景与问题

M:N 多归属落地后（`question_scope`/`exam_paper_scope`，每行 校+研究科+专业+科目+year），种子里出现了**孤儿归属**：

- `major_subject`（V1_8 字典，定义"某校+研究科+专业 开哪些科目"）种子只有两行：`todai/info-sci/cs/math`、`todai/info-sci/cs/algorithm`。
- 但 `V2_1` 种子给 `q-shared-eigen-1` 加了 `question_scope` 行 `kyodai/informatics/ii/math`（跨校样例）——该 (校+研究科+专业+科目) 在 `major_subject` **不存在**。

即：题的归属指向了一个字典说"不存在"的专业-科目组合。这是数据不一致。

### 表职责（用户明确）

- **`major_subject`** = 合法对应字典：某校+学院(研究科)+专业 开哪些科目（唯一键 `uk_major_subject(university_code,grad_school_code,major_code,subject_code)`，主键 `id`）。
- **`question_scope`/`exam_paper_scope`** = 题/卷归属。
- **不变式**：scope 里每条 (校+研究科+专业+科目) 必须先在 `major_subject` 存在，题/卷才允许归属并展示。即 `scope 四元 ⊆ major_subject`。

## 2. 已定决策（brainstorm 2026-07-13，用户逐条确认）

1. **不变式**：`scope 四元 ⊆ major_subject`（归属必须是字典子集）。
2. **执行层次**：defense-in-depth，实际落地 = schema 外键 + 修种子 + 写入校验组件；**查询层不加 join**（见决策 5）。
3. **外键形式**：scope 表加 `major_subject_id BIGINT UNSIGNED` 外键列 → `major_subject.id`。
4. **存储**：**保留** scope 现有四列 `university_code/grad_school_code/major_code/subject_code`（查询免一跳），**并**加 `major_subject_id`；写入时由 `major_subject_id` **反查填四列**，保证四列恒等于字典行、不自相矛盾。scope 五元实际 = major_subject_id(承载四元) + year。
5. **查询层不加 join**：四列冗余 + FK + 写入反查已保证 scope 四列恒合法，且 `major_subject` **无 status 列**（下线一说无处依附），查询 join 是空保险 → 不做。`findByFilter`/`findSameTopic`/`findByScope` 仍读 scope 四列，**不改**。
6. **迁移**：**新开 `V2_2`**（V2_0 保守不动，虽未执行）。但 V2_0 一处会导致迁移失败的 bug 顺带修（见 §3.4）。

## 3. 设计

### 3.1 V2_2 迁移 — scope 加 major_subject_id + FK

新建 `docs/05-database/sql/V2_2__scope_major_subject_fk.sql`：

```sql
USE `kakomon`;
SET NAMES utf8mb4;

-- 1) 加列(先可空, 便于回填)
ALTER TABLE `question_scope`   ADD COLUMN `major_subject_id` BIGINT UNSIGNED NULL COMMENT '归属四元, 关联 major_subject.id' AFTER `question_code`;
ALTER TABLE `exam_paper_scope` ADD COLUMN `major_subject_id` BIGINT UNSIGNED NULL COMMENT '归属四元, 关联 major_subject.id' AFTER `paper_code`;

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
--    (回填后若仍有 NULL, 说明存在孤儿归属 — 加 NOT NULL 会失败, 暴露脏数据, 符合预期)
ALTER TABLE `question_scope`
  MODIFY COLUMN `major_subject_id` BIGINT UNSIGNED NOT NULL,
  ADD CONSTRAINT `fk_qs_ms` FOREIGN KEY (`major_subject_id`) REFERENCES `major_subject`(`id`);

ALTER TABLE `exam_paper_scope`
  MODIFY COLUMN `major_subject_id` BIGINT UNSIGNED NOT NULL,
  ADD CONSTRAINT `fk_ps_ms` FOREIGN KEY (`major_subject_id`) REFERENCES `major_subject`(`id`);
```

- 四列与唯一键（`uk_q_scope`/`uk_p_scope`）保留不变。`major_subject_id` 是新增强一致锚点。
- 依赖 `major_subject.id` 为主键（V1_8:42，是）。
- **执行顺序**：V2_2 须在 V1_8（major_subject 建表+种子）、V2_0（scope 建表）、V2_1（scope 种子）**之后**——因为回填要读 scope 数据和字典。README 顺序追加 V2_2 为最后一步。

### 3.2 修种子（V1_8 补字典行）

`V1_8__subject_dict.sql` 的 `major_subject` INSERT（约 61 行）补一行，使跨校样例合法：

```sql
INSERT INTO `major_subject` (`university_code`, `grad_school_code`, `major_code`, `subject_code`, `sort_order`) VALUES
  ('todai', 'info-sci', 'cs', 'math',      100),
  ('todai', 'info-sci', 'cs', 'algorithm',  90),
  ('kyodai', 'informatics', 'ii', 'math',   80);   -- 新增: 支撑 q-shared-eigen-1 跨校归属
```

> 依赖 `kyodai/informatics/ii` 三码在 V1_1 字典存在（已核实：kyodai 大学、informatics 研究科、ii 专业均在）；`math` 科目在 subject 字典存在（V1_8）。

### 3.3 修种子（V2_1 scope 行补 major_subject_id）

V2_1 的 `question_scope`/`exam_paper_scope` INSERT 目前不含 `major_subject_id`。因 V2_2 会回填，**两种处理**（择一，spec 采用 A）：
- **A（推荐，最省事）**：V2_1 种子 INSERT **不写** `major_subject_id`（保持现状，列此时可空或尚未加），由随后执行的 V2_2 统一回填。前提：执行顺序 V2_1 → V2_2。**这是本 spec 采用的方案**——V2_1 不改，仅靠 V2_2 回填。
- B（备选）：V2_1 直接写死 `major_subject_id` 子查询。放弃——种子写子查询脆弱，且与 V2_2 回填重复。

> 结论：**V2_1 种子文件不改**；`major_subject_id` 全靠 V2_2 回填。§3.2 的 V1_8 补行是让 V2_2 回填时该跨校 scope 能匹配到字典 id（否则回填后为 NULL → V2_2 第 3 步 NOT NULL 失败，正好暴露孤儿）。

### 3.4 顺带修 V2_0 bug（DROP KEY 名错）

`V2_0__question_multi_attribution.sql` 现有 `ALTER TABLE exam_paper DROP KEY uk_paper_scope`——`exam_paper` 上真实索引名是 `idx_paper_scope`（V1_4:39），`uk_paper_scope` 不存在，运行期报 `ERROR 1091: Can't DROP 'uk_paper_scope'`。改为 `DROP KEY idx_paper_scope`。（V2_0 未在任何环境执行，改文件安全。）

### 3.5 写入校验组件 MajorSubjectGuard（备未来录题 API）

当前 scope 只由种子/迁移写入，无运行期写 API。但按 defense-in-depth，建一个可复用组件，未来任何写 scope 的路径必须经它：

- 新建 `service/question/MajorSubjectGuard.java`（`@Component`）：
  ```java
  Long resolveId(String universityCode, String gradSchoolCode, String majorCode, String subjectCode)
  ```
  查 `major_subject`（新 mapper 方法 `findId(四元)`），命中返回 `id`；未命中抛 `BizException(ResultCode.MAJOR_SUBJECT_NOT_FOUND)`。
- 约定：未来写 scope 时，调用方只传四元 + year，Guard 反查 id，并**由 id 回填四列**（四列不由调用方自填），保证一致。
- `ResultCode` 加 `MAJOR_SUBJECT_NOT_FOUND(10605, "专业-科目组合不存在")`（题目段下一空号）。
- `MajorSubjectMapper` 加 `findId(university,grad,major,subject):Long`（+XML）。
- 现无调用点：组件 + mapper 方法建好即可，不强行造 API。编译通过为验收。

## 4. 影响与不做

- **查询层零改动**（决策 5）：`findByFilter`/`findSameTopic`/`findByScope`/`scopeKeysOf`/`primarySubjectCode` 等仍读 scope 四列，行为不变。
- **前端零改动**：归属对前端已不可见（M:N spec 已去展示），本次纯后端/DB 一致性。
- **不做**：查询 join major_subject（空保险）；录题 API（无需求）；给 major_subject 加 status（无下线需求）。

## 5. 验证

- 后端：`cd Kairos-kakomon-server && ./mvnw compile`（MajorSubjectGuard + mapper + ResultCode 编译）。
- SQL/迁移执行 + FK 生效 + 回填正确 + 孤儿暴露（V2_2 第 3 步 NOT NULL 失败即证明有孤儿）**DEFERRED 联调**（本环境无 MySQL）。
- 迁移顺序核对：V1_8（含新字典行）→ … → V2_0（修 bug 后）→ V2_1 → **V2_2**。README 更新。
- 动工前 checklist 追加 `Kairos-kakomon/TASKS.md`。

## 6. 验收清单（联调）

- [ ] V1_8 含 `kyodai/informatics/ii/math` 行
- [ ] V2_2 回填后 question_scope/exam_paper_scope 无 major_subject_id NULL（否则暴露孤儿，需先补字典）
- [ ] FK `fk_qs_ms`/`fk_ps_ms` 生效：插入引用不存在 major_subject 的 scope 被拒
- [ ] `q-shared-eigen-1` 的 kyodai scope 回填出正确 major_subject_id
- [ ] V2_0 迁移不再因 `uk_paper_scope` 报 1091
- [ ] MajorSubjectGuard.resolveId 命中返回 id、未命中抛 10605
