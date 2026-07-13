# 归属 ⊆ 科目字典一致性（scope ↔ major_subject）Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 保证 `question_scope`/`exam_paper_scope` 的每条 (校+研究科+专业+科目) 都是 `major_subject` 字典子集——加外键列 + 修种子 + 写入校验组件，消除孤儿归属。

**Architecture:** scope 表加 `major_subject_id` 外键列（新迁移 V2_2，四列冗余保留、写入由 id 反查填）→ 补 major_subject 字典行使跨校样例合法 → V2_2 从四列 join 字典回填 major_subject_id 并收紧 NOT NULL+FK → 新增可复用 `MajorSubjectGuard` 写入校验组件备未来录题 API。查询层不动。

**Tech Stack:** MySQL 8（DDL/DML 迁移脚本）+ Spring Boot 4 + MyBatis（校验组件）。

## Global Constraints

- 迁移脚本放 `docs/05-database/sql/`，手动按 README 顺序执行（无 Flyway/Liquibase）。本次新脚本 `V2_2`，执行顺序在 V1_8/V2_0/V2_1 **之后**（回填要读 scope 数据 + 字典）。
- 不变式：`scope 四元 (university_code, grad_school_code, major_code, subject_code) ⊆ major_subject`。
- scope 保留四列 + 加 `major_subject_id BIGINT UNSIGNED`；四列由 id 反查填（未来写路径），恒等于字典行。
- 后端 `org.example.kairos` 分模块；MyBatis Java mapper↔XML 同步；业务错误抛 `BizException(ResultCode)`。
- FK 目标 `major_subject.id`（BIGINT UNSIGNED 主键，V1_8:34/42，已核实）。
- **无 test runner、无 MySQL、无模拟器。** 门禁：后端 `cd Kairos-kakomon-server && ./mvnw compile`。SQL/迁移执行 + FK 生效 + 回填 DEFERRED 联调。
- 动工前 checklist 追加 `Kairos-kakomon/TASKS.md`。

---

## Task 1: 修 V2_0 的 DROP KEY bug（uk_paper_scope → idx_paper_scope）

**Files:**
- Modify: `docs/05-database/sql/V2_0__question_multi_attribution.sql`

**Interfaces:** 无（纯 DDL 修正）。

- [ ] **Step 1: 改索引名**

`V2_0__question_multi_attribution.sql` 的 `ALTER TABLE exam_paper` 块，把 `DROP KEY uk_paper_scope` 改为 `DROP KEY idx_paper_scope`。当前（约 65-72 行）：

```sql
ALTER TABLE `exam_paper`
    DROP KEY `uk_paper_scope`,
    DROP KEY `idx_paper_filter`,
```

改为：

```sql
ALTER TABLE `exam_paper`
    DROP KEY `idx_paper_scope`,
    DROP KEY `idx_paper_filter`,
```

> `exam_paper` 上真实索引名是 `idx_paper_scope`（V1_4:39）；`uk_paper_scope` 不存在，原样执行会报 `ERROR 1091`。`uk_paper_code`（code 唯一）保留不动。

- [ ] **Step 2: 自检**

Run: `grep -nE "DROP KEY" docs/05-database/sql/V2_0__question_multi_attribution.sql`
Expected: 只出现 `idx_q_filter`、`idx_paper_scope`、`idx_paper_filter`；无 `uk_paper_scope`。

- [ ] **Step 3: Commit**

```bash
git add docs/05-database/sql/V2_0__question_multi_attribution.sql
git commit -m "fix(db): V2_0 exam_paper DROP KEY idx_paper_scope(原 uk_paper_scope 不存在会报 1091)"
```

---

## Task 2: V1_8 补 major_subject 字典行（支撑跨校样例合法）

**Files:**
- Modify: `docs/05-database/sql/V1_8__subject_dict.sql`

**Interfaces:**
- Produces: `major_subject` 种子含 `kyodai/informatics/ii/math` 行，使 `q-shared-eigen-1` 的跨校 scope 在 V2_2 回填时能匹配到字典 id。

- [ ] **Step 1: 加字典行**

`V1_8__subject_dict.sql` 的 `major_subject` INSERT（约 61-63 行）。当前：

```sql
INSERT INTO `major_subject` (`university_code`, `grad_school_code`, `major_code`, `subject_code`, `sort_order`) VALUES
  ('todai', 'info-sci', 'cs', 'math',      100),
  ('todai', 'info-sci', 'cs', 'algorithm',  90);
```

改为（把第二行末尾 `;` 改成 `,`，追加一行）：

```sql
INSERT INTO `major_subject` (`university_code`, `grad_school_code`, `major_code`, `subject_code`, `sort_order`) VALUES
  ('todai', 'info-sci', 'cs', 'math',      100),
  ('todai', 'info-sci', 'cs', 'algorithm',  90),
  ('kyodai', 'informatics', 'ii', 'math',   80);
```

> `kyodai`(大学)、`informatics`(研究科)、`ii`=知能情报学(专业)、`math`(科目) 均在 V1_1/V1_8 字典存在（已核实）。

- [ ] **Step 2: 自检**

Run: `grep -nE "kyodai.*informatics.*ii.*math" docs/05-database/sql/V1_8__subject_dict.sql`
Expected: 命中新行。
Run: `grep -cE "INSERT INTO .major_subject" docs/05-database/sql/V1_8__subject_dict.sql`
Expected: `1`（仍是一条 INSERT、三行 VALUES）。

- [ ] **Step 3: Commit**

```bash
git add docs/05-database/sql/V1_8__subject_dict.sql
git commit -m "fix(db): V1_8 补 major_subject 行 kyodai/informatics/ii/math(支撑跨校归属样例)"
```

---

## Task 3: V2_2 迁移 — scope 加 major_subject_id + 回填 + FK

**Files:**
- Create: `docs/05-database/sql/V2_2__scope_major_subject_fk.sql`
- Modify: `docs/05-database/sql/README.md`

**Interfaces:**
- Consumes: V1_8 字典（含 Task 2 新行）、V2_0 scope 表、V2_1 scope 种子。
- Produces: `question_scope`/`exam_paper_scope` 各含 `major_subject_id NOT NULL` + FK 到 `major_subject.id`。

- [ ] **Step 1: 写迁移脚本**

Create `docs/05-database/sql/V2_2__scope_major_subject_fk.sql`:

```sql
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
```

> 四列与唯一键 `uk_q_scope`/`uk_p_scope` 保留不变。V2_1 scope 种子**不改**——major_subject_id 全靠本脚本第 2 步回填。

- [ ] **Step 2: 结构自检**

Run: `grep -cE "ADD COLUMN .major_subject_id|FOREIGN KEY|MODIFY COLUMN .major_subject_id" docs/05-database/sql/V2_2__scope_major_subject_fk.sql`
Expected: `6`（各 2 处加列/改列/外键）。

- [ ] **Step 3: 更新 README 顺序**

`docs/05-database/sql/README.md` 的执行顺序表 + 命令块末尾追加 `V2_2`（V2_1 之后）。表格加一行：

```
| 12 | [`V2_2__scope_major_subject_fk.sql`](./V2_2__scope_major_subject_fk.sql) | scope 归属加 major_subject_id 外键 + 回填(须在 V2_1 之后)|
```

命令块末尾追加：

```bash
mysql -uroot -p kakomon < V2_2__scope_major_subject_fk.sql
```

> 若 README 当前最后一行是 `V2_1__seed_questions.sql`，在其后加 V2_2；序号顺延。

- [ ] **Step 4: Commit**

```bash
git add docs/05-database/sql/V2_2__scope_major_subject_fk.sql docs/05-database/sql/README.md
git commit -m "feat(db): V2_2 scope 加 major_subject_id 外键 + 回填(归属⊆字典约束)"
```

---

## Task 4: MajorSubjectGuard 写入校验组件 + ResultCode + mapper

**Files:**
- Modify: `Kairos-kakomon-server/src/main/java/org/example/kairos/common/ResultCode.java`
- Modify: `Kairos-kakomon-server/src/main/java/org/example/kairos/mapper/dict/MajorSubjectMapper.java`
- Modify: `Kairos-kakomon-server/src/main/resources/mapper/dict/MajorSubjectMapper.xml`
- Create: `Kairos-kakomon-server/src/main/java/org/example/kairos/service/question/MajorSubjectGuard.java`

**Interfaces:**
- Produces:
  - `ResultCode.MAJOR_SUBJECT_NOT_FOUND(10605, "专业-科目组合不存在")`
  - `MajorSubjectMapper.findId(university, grad, major, subject): Long`（无则 null）
  - `MajorSubjectGuard.resolveId(university, grad, major, subject): Long`（命中返回 id，未命中抛 BizException(10605)）

- [ ] **Step 1: ResultCode 加 10605**

`ResultCode.java`，把 `INVALID_MASTERY_STATUS` 那行末尾 `;` 改 `,` 并追加。当前（约 96-97 行）：

```java
    /** 掌握状态值非法(仅 mastered/unclear/wrong) */
    INVALID_MASTERY_STATUS(10604, "掌握状态值不合法");
```

改为：

```java
    /** 掌握状态值非法(仅 mastered/unclear/wrong) */
    INVALID_MASTERY_STATUS(10604, "掌握状态值不合法"),
    /** 专业-科目组合在 major_subject 字典中不存在 */
    MAJOR_SUBJECT_NOT_FOUND(10605, "专业-科目组合不存在");
```

- [ ] **Step 2: MajorSubjectMapper 加 findId**

`mapper/dict/MajorSubjectMapper.java`，在 `findAll` 后加：

```java
    /** 按四元查 major_subject id, 无则 null */
    Long findId(@Param("universityCode") String universityCode,
                @Param("gradSchoolCode") String gradSchoolCode,
                @Param("majorCode") String majorCode,
                @Param("subjectCode") String subjectCode);
```

顶部 import 加 `import org.apache.ibatis.annotations.Param;`。

- [ ] **Step 3: MajorSubjectMapper.xml 加 findId**

`resources/mapper/dict/MajorSubjectMapper.xml`，在 `</mapper>` 前加：

```xml
    <select id="findId" resultType="java.lang.Long">
        SELECT id FROM major_subject
        WHERE university_code = #{universityCode}
          AND grad_school_code = #{gradSchoolCode}
          AND major_code = #{majorCode}
          AND subject_code = #{subjectCode}
        LIMIT 1
    </select>
```

- [ ] **Step 4: 写 MajorSubjectGuard**

Create `service/question/MajorSubjectGuard.java`:

```java
package org.example.kairos.service.question;

import org.example.kairos.common.ResultCode;
import org.example.kairos.common.exception.BizException;
import org.example.kairos.mapper.dict.MajorSubjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

/**
 * 写 scope 归属前的一致性守卫: 校验 (校+研究科+专业+科目) 在 major_subject 字典存在,
 * 返回其 id。未来任何写 question_scope/exam_paper_scope 的路径都应先经此解析 id,
 * 并由 id 反查填四列, 保证 scope 四元 ⊆ major_subject。
 */
@Component
public class MajorSubjectGuard {

    @Autowired private MajorSubjectMapper majorSubjectMapper;

    /** 命中返回 major_subject.id; 未命中抛 MAJOR_SUBJECT_NOT_FOUND。 */
    public Long resolveId(String universityCode, String gradSchoolCode, String majorCode, String subjectCode) {
        Long id = majorSubjectMapper.findId(universityCode, gradSchoolCode, majorCode, subjectCode);
        if (id == null) throw new BizException(ResultCode.MAJOR_SUBJECT_NOT_FOUND);
        return id;
    }
}
```

> 现无写 scope 的 API，组件先建好备用；`@Component` 保证 Spring 能注入。

- [ ] **Step 5: 编译**

Run: `cd Kairos-kakomon-server && ./mvnw compile 2>&1 | tail -3`
Expected: BUILD SUCCESS。

- [ ] **Step 6: 契约自检**

Run: `grep -nE "MAJOR_SUBJECT_NOT_FOUND|findId|resolveId" Kairos-kakomon-server/src/main/java/org/example/kairos/common/ResultCode.java Kairos-kakomon-server/src/main/java/org/example/kairos/mapper/dict/MajorSubjectMapper.java Kairos-kakomon-server/src/main/java/org/example/kairos/service/question/MajorSubjectGuard.java`
Expected: 三处符号齐全。

- [ ] **Step 7: Commit**

```bash
git add Kairos-kakomon-server/src/main/java/org/example/kairos/common/ResultCode.java \
        Kairos-kakomon-server/src/main/java/org/example/kairos/mapper/dict/MajorSubjectMapper.java \
        Kairos-kakomon-server/src/main/resources/mapper/dict/MajorSubjectMapper.xml \
        Kairos-kakomon-server/src/main/java/org/example/kairos/service/question/MajorSubjectGuard.java
git commit -m "feat(be): MajorSubjectGuard 写入校验组件 + findId mapper + ResultCode 10605"
```

---

## Task 5: TASKS.md 联调验证清单

**Files:**
- Modify: `Kairos-kakomon/TASKS.md`

- [ ] **Step 1: 追加清单**

`Kairos-kakomon/TASKS.md` 末尾追加（不改写既有行）：本 plan 已完成项打 `[x]` + `✅ 完成于 2026-07-13`，联调待验证项：
- 迁移顺序 V1_8(含新字典行) → V2_0(修 bug 后) → V2_1 → V2_2
- V2_2 回填后 scope 无 major_subject_id NULL（有 NULL = 孤儿，须先补字典）
- FK fk_qs_ms/fk_ps_ms 生效：插引用不存在 major_subject 的 scope 被拒
- q-shared-eigen-1 的 kyodai scope 回填出正确 id
- V2_0 不再因 uk_paper_scope 报 1091
- MajorSubjectGuard.resolveId 命中返 id / 未命中抛 10605

- [ ] **Step 2: Commit**

```bash
git add Kairos-kakomon/TASKS.md
git commit -m "docs(tasks): scope↔major_subject 一致性联调验证清单"
```

---

## 依赖顺序

```
Task 1 (修 V2_0 bug) ─┐  独立
Task 2 (V1_8 补字典行) ┤  独立(但 V2_2 回填依赖它)
Task 3 (V2_2 迁移) ────┤  依赖 Task 2(回填要匹配字典行)
Task 4 (Guard 组件) ───┤  独立(纯后端, 唯一 ./mvnw compile 门禁)
Task 5 (TASKS) ────────┘  收尾
```

Task 1/2/3/5 是 DB/文档，各自 SQL 结构自检 + commit。Task 4 是唯一需 `./mvnw compile` 的后端任务。无跨任务编译耦合，可顺序执行。
