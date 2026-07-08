# 科目字典化 + 卷/题专业·科目维度 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让一份试卷、一道大问都精确归属唯一的 (学校+研究科+专业+科目)，`major_code`/`subject_code` 标量冗余存；科目升级为全局字典 + `major_subject` 关联表，专题学习/模考的科目下拉从后端 tree 读而非扫题目 DISTINCT。

**Architecture:** 三段式。① DB：V1_4 就地改结构（两表加/改列、改唯一键与索引）+ V1_5 改 seed + 新增 V1_8（subject 字典 + major_subject 种子）。② 后端：表存 `subject_code`、`question` 补 `major_code`；题/卷响应走**双字段**——同时回 `subjectCode`（机器键）与 `subject`（服务层 join 字典解析出的日文展示名）；题目筛选加 `majorCode`+`subjectCode` 入参；`DictionaryServiceImpl.getTree` 改由 `major_subject JOIN subject` 填 `MajorNode.subjects`（结构变 `{code,nameJp}[]`），不新增端点。③ 前端：类型 `majorIds[]`→`majorId`、`KakomonQuestion`/`ExamPaper` **保留 `subject` 展示名 + 新增 `subjectCode`**（约 8 个展示屏零改动）；过滤/下拉用 `subjectCode` 且下拉从 dictStore 读；mock 兜底双字段对齐。

**Tech Stack:** MySQL 8 (utf8mb4)、Spring Boot 4 + MyBatis（Java mapper + XML 同步）、Expo + React Native + TypeScript（TanStack Query、Zustand dictStore）。

## Global Constraints

- **无物理外键**：本项目所有跨表关联靠应用层保证，迁移脚本不写 FK 约束。
- **Greenfield 无回填**：无线上业务数据，V1_4 直接改建表语句，不写 ALTER 回填脚本。
- **迁移脚本编号顺序**：V1_4（改结构）→ V1_5（改 seed）→ V1_8（新字典+种子）。seed 里用到的每个 `subject_code` 必须在 V1_8 的 subject 字典中存在（人工校验 code 对齐）。
- **后端关联一律用可读 code**（`subject_code`/`major_code`/`university_code`/`grad_school_code`），不引入 id 关联，与 V1_4 题库域一致。
- **后端 gate**：`cd Kairos-kakomon-server && ./mvnw compile` 必须通过（项目无题库单测，编译 + 手工 SQL 校验为准）。
- **前端 gate**：`cd Kairos-kakomon && npm run type-check` 必须通过（项目无测试运行器）。
- **MyBatis 铁律**：Java mapper 接口与 XML 必须同步改，`resultMap` 列名/property 与 entity 字段一一对应。
- **字典字段命名**：日文名列 `name_jp`、code 列 `code`，对齐现有 `university`/`grad_school`/`major` 表。
- **主键/时间列模板**：`id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT`、`created_at`/`updated_at DATETIME(3) ... CURRENT_TIMESTAMP(3)`，对齐现有表。

---

## Phase 1 — 数据层（DB 迁移脚本）

> 本阶段产物是可在 MySQL 8 空库按序执行成功的 SQL。验证方式：本地 `kakomon` 库依次 source V1_0→V1_5→V1_8，无报错、结构与种子符合预期。无 JUnit 覆盖，故用 SQL 断言查询做验收。

### Task 1: V1_4 — `exam_paper` / `question` 结构改造

**Files:**
- Modify: `docs/05-database/sql/V1_4__questions_schema.sql`

**Interfaces:**
- Produces: 表 `exam_paper`（`major_code` NOT NULL、`subject_code` 替代 `subject`、唯一键 `uk_paper_scope (university_code, grad_school_code, major_code, year, subject_code)`）、表 `question`（新增 `major_code` NOT NULL、`subject_code` 替代 `subject`、`idx_q_filter` 含 major_code+subject_code）。后续 Task 2 seed、Phase 2 entity 依赖这些列名。

- [ ] **Step 1: 改 `exam_paper` 的 major_code / subject 列**

在 `exam_paper` 建表语句中，把
```sql
    `major_code`        VARCHAR(80)     NULL                    COMMENT '专业 code, 可空',
```
改为
```sql
    `major_code`        VARCHAR(80)     NOT NULL                COMMENT '专业 code, 关联 major.code',
```
并把
```sql
    `subject`           VARCHAR(60)     NOT NULL                COMMENT '科目, 如 数学',
```
改为
```sql
    `subject_code`      VARCHAR(40)     NOT NULL                COMMENT '科目 code, 关联 subject.code',
```

- [ ] **Step 2: 改 `exam_paper` 的唯一键与筛选索引**

把
```sql
    UNIQUE KEY `uk_paper_scope` (`university_code`, `grad_school_code`, `year`, `subject`),
```
改为
```sql
    UNIQUE KEY `uk_paper_scope` (`university_code`, `grad_school_code`, `major_code`, `year`, `subject_code`),
```
（`idx_paper_filter (university_code, grad_school_code, status)` 不含 subject，保持不动。）

- [ ] **Step 3: 改 `question` 的 major_code / subject 列**

在 `question` 建表语句里，`grad_school_code` 行之后、`year` 行之前**新增**一行：
```sql
    `major_code`             VARCHAR(80)     NOT NULL                COMMENT '冗余: 专业 code',
```
并把
```sql
    `subject`                VARCHAR(60)     NOT NULL                COMMENT '冗余: 科目',
```
改为
```sql
    `subject_code`           VARCHAR(40)     NOT NULL                COMMENT '冗余: 科目 code',
```

- [ ] **Step 4: 改 `question` 的筛选索引**

把
```sql
    KEY `idx_q_filter` (`university_code`, `grad_school_code`, `year`, `subject`, `status`),
```
改为
```sql
    KEY `idx_q_filter` (`university_code`, `grad_school_code`, `major_code`, `year`, `subject_code`, `status`),
```

- [ ] **Step 5: 语法自检**

Run: `cd /Users/renquan.11/karios && grep -nE "subject\b|subject_code|major_code|uk_paper_scope|idx_q_filter" docs/05-database/sql/V1_4__questions_schema.sql`
Expected: 无裸 `subject`（仅 `subject_code`）；`exam_paper.major_code`/`question.major_code` 均 NOT NULL；唯一键与索引已含 major_code+subject_code。

- [ ] **Step 6: Commit**

```bash
cd /Users/renquan.11/karios
git add docs/05-database/sql/V1_4__questions_schema.sql
git commit -m "feat(db): V1_4 卷/题改用 subject_code + major_code NOT NULL，扩唯一键含 major"
```

---

### Task 2: V1_5 — 种子数据对齐新列

**Files:**
- Modify: `docs/05-database/sql/V1_5__seed_questions.sql`

**Interfaces:**
- Consumes: Task 1 的 `exam_paper`/`question` 新列名。
- Produces: 种子 INSERT 的列清单用 `subject_code` + `major_code`，值用科目 code（`math`）+ 专业 code（`cs`）。Phase 3 mock 数据、Task 3 的 major_subject 种子需与此处 (major_code, subject_code) 对齐。

- [ ] **Step 1: 改 `exam_paper` INSERT 的列名与值**

把
```sql
INSERT INTO `exam_paper`
  (`code`, `university_code`, `grad_school_code`, `major_code`, `year`, `subject`, `title`,
   `duration_minutes`, `total_score`, `select_rule`, `instructions`, `status`, `sort_order`)
VALUES
  ('p-todai-2024-math', 'todai', 'info-sci', NULL, 2024, '数学',
   '2024年度 大学院入学試験問題 数学', 150, NULL,
```
改为
```sql
INSERT INTO `exam_paper`
  (`code`, `university_code`, `grad_school_code`, `major_code`, `year`, `subject_code`, `title`,
   `duration_minutes`, `total_score`, `select_rule`, `instructions`, `status`, `sort_order`)
VALUES
  ('p-todai-2024-math', 'todai', 'info-sci', 'cs', 2024, 'math',
   '2024年度 大学院入学試験問題 数学', 150, NULL,
```

- [ ] **Step 2: 改 `question` INSERT 的列名**

把
```sql
INSERT INTO `question`
  (`code`, `paper_code`, `university_code`, `grad_school_code`, `year`, `subject`,
   `question_no`, `title`, `order_index`, `content_blocks`, `body_text`,
   `difficulty_label`, `difficulty_level`, `crowd_difficulty_rate`, `status`)
```
改为
```sql
INSERT INTO `question`
  (`code`, `paper_code`, `university_code`, `grad_school_code`, `major_code`, `year`, `subject_code`,
   `question_no`, `title`, `order_index`, `content_blocks`, `body_text`,
   `difficulty_label`, `difficulty_level`, `crowd_difficulty_rate`, `status`)
```

- [ ] **Step 3: 改三条 `question` VALUES 行——插入 major_code 值 + subject 值改 code**

三条记录当前形如 `'todai', 'info-sci', 2024, '数学',`。在 `'info-sci'` 与年份之间插入 `'cs'`，并把 `'数学'` 改为 `'math'`。改后分别为：
```sql
  ('q-todai-2024-math-1', 'p-todai-2024-math', 'todai', 'info-sci', 'cs', 2024, 'math',
```
```sql
  ('q-todai-2024-math-2', 'p-todai-2024-math', 'todai', 'info-sci', 'cs', 2024, 'math',
```
```sql
  ('q-todai-2024-math-3', 'p-todai-2024-math', 'todai', 'info-sci', 'cs', 2024, 'math',
```
（其余列——question_no/title/order_index/content_blocks/… 不变。）

- [ ] **Step 4: 语法自检**

Run: `cd /Users/renquan.11/karios && grep -nE "subject_code|'math'|'cs'|major_code" docs/05-database/sql/V1_5__seed_questions.sql`
Expected: INSERT 列清单含 `subject_code`+`major_code`；每条卷/题的值含 `'cs'` 与 `'math'`，无裸 `'数学'` 作为 subject 值。

- [ ] **Step 5: Commit**

```bash
cd /Users/renquan.11/karios
git add docs/05-database/sql/V1_5__seed_questions.sql
git commit -m "feat(db): V1_5 种子改用 subject_code=math + major_code=cs"
```

---

### Task 3: V1_8 — subject 字典 + major_subject 种子（新建）

**Files:**
- Create: `docs/05-database/sql/V1_8__subject_dict.sql`
- Modify: `docs/05-database/sql/README.md`

**Interfaces:**
- Consumes: V1_1 已 seed 的 `university`/`grad_school`/`major`（`todai` / `info-sci` / `cs` 等 code）。
- Produces: 表 `subject`（`code` 全站唯一）、表 `major_subject`（四码唯一）+ 种子；其中至少含 `subject.code='math'`（供 V1_5 seed 对齐）与 `major_subject('todai','info-sci','cs','math')`。

- [ ] **Step 1: 写建表 + 种子脚本**

新建 `docs/05-database/sql/V1_8__subject_dict.sql`，内容：
```sql
-- =============================================================
--  Kairos-kakomon 迁移脚本 V1.8 — 科目字典 + 专业-科目关联
--  对应设计文档：docs/superpowers/specs/2026-07-08-subject-major-dimension-design.md
--  执行环境：MySQL 8.x，utf8mb4 / utf8mb4_0900_ai_ci
--  前置：V1_0（university/grad_school/major）、V1_1（字典种子）
-- =============================================================

USE `kakomon`;
SET NAMES utf8mb4;

DROP TABLE IF EXISTS `major_subject`;
DROP TABLE IF EXISTS `subject`;

-- -------------------------------------------------------------
--  科目字典（全局，一个概念全站共用）
-- -------------------------------------------------------------
CREATE TABLE `subject` (
    `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
    `code`       VARCHAR(40)     NOT NULL                COMMENT '全站唯一科目 code, 如 math',
    `name_cn`    VARCHAR(60)     NULL                    COMMENT '中文名, 如 数学',
    `name_jp`    VARCHAR(60)     NOT NULL                COMMENT '日文名, 如 数学',
    `sort_order` INT             NOT NULL DEFAULT 0      COMMENT '全局默认排序权重',
    `status`     TINYINT         NOT NULL DEFAULT 1      COMMENT '1=上线 0=下线',
    `created_at` DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_subject_code` (`code`)
) ENGINE = InnoDB COMMENT = '科目字典(全局)';

-- -------------------------------------------------------------
--  专业 ↔ 科目关联（绑三码, 因 major.code 仅研究科内唯一）
-- -------------------------------------------------------------
CREATE TABLE `major_subject` (
    `id`               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
    `university_code`  VARCHAR(40)     NOT NULL                COMMENT '大学 code',
    `grad_school_code` VARCHAR(80)     NOT NULL                COMMENT '研究科 code',
    `major_code`       VARCHAR(80)     NOT NULL                COMMENT '专业 code',
    `subject_code`     VARCHAR(40)     NOT NULL                COMMENT '科目 code, 关联 subject.code',
    `sort_order`       INT             NOT NULL DEFAULT 0      COMMENT '该专业内科目展示顺序',
    `created_at`       DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at`       DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_major_subject` (`university_code`, `grad_school_code`, `major_code`, `subject_code`),
    KEY `idx_ms_subject` (`subject_code`)
) ENGINE = InnoDB COMMENT = '专业-科目关联';

-- -------------------------------------------------------------
--  种子：科目字典
-- -------------------------------------------------------------
INSERT INTO `subject` (`code`, `name_cn`, `name_jp`, `sort_order`) VALUES
  ('math',      '数学',       '数学',           100),
  ('algorithm', '算法',       'アルゴリズム',     90),
  ('info',      '情报',       '情報',           80),
  ('english',   '英语',       '英語',           70);

-- -------------------------------------------------------------
--  种子：专业-科目关联（东大 info-sci / cs → 数学）
-- -------------------------------------------------------------
INSERT INTO `major_subject` (`university_code`, `grad_school_code`, `major_code`, `subject_code`, `sort_order`) VALUES
  ('todai', 'info-sci', 'cs', 'math',      100),
  ('todai', 'info-sci', 'cs', 'algorithm',  90);
```

> 说明：种子科目/关联可按后续真实数据扩充；本脚本至少保证 V1_5 用到的 `math` + `('todai','info-sci','cs','math')` 存在，使联调链路可跑通。

- [ ] **Step 2: 在 README 补脚本说明**

Read `docs/05-database/sql/README.md`，在其脚本列表（V1_7 之后）追加一行说明 V1_8 的用途（科目字典 + 专业-科目关联），与既有条目同样式。

- [ ] **Step 3: 空库按序执行验证**

Run（本地 MySQL，库名 kakomon）:
```bash
cd /Users/renquan.11/karios/docs/05-database/sql
for f in V1_0__init_schema.sql V1_1__seed_dictionary.sql V1_2__seed_demo_user.sql V1_3__billing.sql V1_4__questions_schema.sql V1_5__seed_questions.sql V1_8__subject_dict.sql; do echo "== $f =="; mysql kakomon < "$f" || break; done
```
Expected: 全部无报错。若本地无 MySQL，跳过本步，改由联调环境执行；在此记录“待联调验证”。

- [ ] **Step 4: 断言查询——链路 code 对齐**

Run:
```bash
mysql kakomon -e "SELECT p.code, p.major_code, p.subject_code, s.name_jp FROM exam_paper p JOIN subject s ON s.code=p.subject_code WHERE p.code='p-todai-2024-math'; SELECT ms.* FROM major_subject ms WHERE ms.university_code='todai' AND ms.major_code='cs';"
```
Expected: 试卷 join 到 subject 得 `数学`；major_subject 至少 2 行（math/algorithm）。

- [ ] **Step 5: Commit**

```bash
cd /Users/renquan.11/karios
git add docs/05-database/sql/V1_8__subject_dict.sql docs/05-database/sql/README.md
git commit -m "feat(db): 新增 V1_8 科目字典 subject + 专业-科目关联 major_subject"
```

---

## Phase 2 — 后端读路径

> 本阶段每个 Task 以 `./mvnw compile` 为门。项目题库域无 JUnit，故“测试”= 编译通过 + 关键改动的 grep 自检；最后一个 Task 做一次运行期冒烟（tree/questions 接口）。

### Task 4: entity + resultMap — subject→subjectCode，question 补 majorCode

**Files:**
- Modify: `Kairos-kakomon-server/src/main/java/org/example/kairos/entity/QuestionEntity.java`
- Modify: `Kairos-kakomon-server/src/main/java/org/example/kairos/entity/ExamPaperEntity.java`
- Modify: `Kairos-kakomon-server/src/main/resources/mapper/question/QuestionMapper.xml`
- Modify: `Kairos-kakomon-server/src/main/resources/mapper/question/ExamPaperMapper.xml`

**Interfaces:**
- Consumes: Phase 1 的列名（`subject_code`、`question.major_code`）。
- Produces: `QuestionEntity.getSubjectCode()/setSubjectCode(String)`、`QuestionEntity.getMajorCode()/setMajorCode(String)`、`ExamPaperEntity.getSubjectCode()/setSubjectCode(String)`（`ExamPaperEntity.getMajorCode` 已存在）。Task 5/6 的 service 依赖这些 getter。

- [ ] **Step 1: `ExamPaperEntity` 字段改名**

`ExamPaperEntity.java`：把字段 `private String subject;` 改为 `private String subjectCode;`，并把 `getSubject()/setSubject(String subject)` 改名为 `getSubjectCode()/setSubjectCode(String subjectCode)`（方法体内 `this.subject`→`this.subjectCode`）。`majorCode` 字段与其 getter/setter 已存在，不动。

- [ ] **Step 2: `QuestionEntity` 字段改名 + 新增 majorCode**

`QuestionEntity.java`：
1. `private String subject;` → `private String subjectCode;`；`getSubject()/setSubject` → `getSubjectCode()/setSubjectCode`。
2. 在 `gradSchoolCode` 字段之后新增 `private String majorCode;`，并补：
```java
    public String getMajorCode() { return majorCode; }
    public void setMajorCode(String majorCode) { this.majorCode = majorCode; }
```

- [ ] **Step 3: `QuestionMapper.xml` resultMap + listCols**

- resultMap `QMap`：把 `<result column="subject" property="subject"/>` 改为 `<result column="subject_code" property="subjectCode"/>`；在 `grad_school_code` 行后新增 `<result column="major_code" property="majorCode"/>`。
- `<sql id="listCols">`：列清单里 `subject` → `subject_code`，并加入 `major_code`。改后：
```xml
    <sql id="listCols">
        id, code, paper_code, university_code, grad_school_code, major_code, year, subject_code,
        question_no, title, order_index, difficulty_label, difficulty_level,
        crowd_difficulty_rate, crowd_votes, status, created_at, updated_at
    </sql>
```

- [ ] **Step 4: `ExamPaperMapper.xml` resultMap**

`PaperMap`：把 `<result column="subject" property="subject"/>` 改为 `<result column="subject_code" property="subjectCode"/>`（`major_code`→`majorCode` 映射已存在）。

- [ ] **Step 5: 编译（预期失败，跨 Task 依赖）**

Run: `cd /Users/renquan.11/karios/Kairos-kakomon-server && ./mvnw -q compile`
Expected: 此时 service 层仍调用旧 `getSubject()`，故本步**预期编译失败**（`getSubject()` 未定义）——正是 Task 5 要修的点。

> 注：Task 4/5/6/7 是一个可编译单元，中途不单独提交。实现顺序：**Task 4（entity/xml）→ Task 7 Step 1-4（建 SubjectEntity/SubjectMapper+XML）→ Task 5（service/DTO，注入 SubjectMapper）→ Task 6（filter 入参）→ Task 7 余下（tree 改造）**，在 Task 5 Step 5 首次要求编译通过并统一提交。用 subagent 时把这几个 Task 交给同一 subagent 连续执行。

- [ ] **Step 6:（不在此提交）**

见 Task 5 Step 5 统一提交。

---

### Task 5: service 层 — subjectCode + 解析展示名 subject + question majorId 透传

> **双字段策略**：表存 `subject_code`；DTO **同时**回 `subjectCode`（机器键）+ `subject`（日文展示名）。展示名由 service 用 subject 字典（`SubjectMapper.findAll()` 建的 `code→nameJp` map）解析。前端展示屏读 `subject` 零改动，过滤读 `subjectCode`。
>
> **依赖顺序**：本 Task 用到 `SubjectMapper`，它在 Task 7 Step 1-4 创建。实现顺序：先做 Task 7 Step 1-4（建 SubjectEntity/SubjectMapper+XML），再做本 Task。用 subagent 时把 Task 4+7+5+6 交给同一 subagent，顺序：Task4 → Task7(Step1-4) → Task5 → Task6 → Task7(余下 tree)。

**Files:**
- Modify: `Kairos-kakomon-server/src/main/java/org/example/kairos/service/question/impl/QuestionQueryServiceImpl.java`
- Modify: `Kairos-kakomon-server/src/main/java/org/example/kairos/service/question/impl/PaperQueryServiceImpl.java`
- Modify: `Kairos-kakomon-server/src/main/java/org/example/kairos/model/response/question/QuestionResponse.java`
- Modify: `Kairos-kakomon-server/src/main/java/org/example/kairos/model/response/question/QuestionListItemResponse.java`
- Modify: `Kairos-kakomon-server/src/main/java/org/example/kairos/model/response/question/PaperResponse.java`
- Modify: `Kairos-kakomon-server/src/main/java/org/example/kairos/model/response/question/PaperListItemResponse.java`

**Interfaces:**
- Consumes: Task 4 的 `getSubjectCode()`/`getMajorCode()`；Task 7 的 `SubjectMapper.findAll()` → `List<SubjectEntity>`（`getCode()`/`getNameJp()`）。
- Produces: 4 个 DTO **同时**有 `subject`（展示名，保留）+ `subjectCode`（新增）；`QuestionResponse`/`QuestionListItemResponse` 另新增 `majorId`。Task 6 controller、Phase 3 前端依赖这些字段名。

- [ ] **Step 1: 4 个 DTO 新增 subjectCode（保留 subject）**

对 `QuestionResponse`、`QuestionListItemResponse`、`PaperResponse`、`PaperListItemResponse` 各自：**保留** `private String subject;` 及其 getter/setter（前端展示屏靠它），在其后**新增**：
```java
    private String subjectCode;
    ...
    public String getSubjectCode() { return subjectCode; }
    public void setSubjectCode(String subjectCode) { this.subjectCode = subjectCode; }
```

- [ ] **Step 2: `QuestionResponse` / `QuestionListItemResponse` 新增 majorId**

两个 DTO 各在 `graduateSchool` 字段后新增 `private String majorId;` + getter/setter：
```java
    public String getMajorId() { return majorId; }
    public void setMajorId(String majorId) { this.majorId = majorId; }
```

- [ ] **Step 3: `QuestionQueryServiceImpl` — 注入 SubjectMapper + 建 code→nameJp map**

1. 注入：`@Autowired private org.example.kairos.mapper.dict.SubjectMapper subjectMapper;`
2. 新增私有 helper（每请求查一次字典，量小可接受）：
```java
    private java.util.Map<String, String> subjectNameMap() {
        java.util.Map<String, String> m = new java.util.HashMap<>();
        for (org.example.kairos.entity.SubjectEntity s : subjectMapper.findAll()) m.put(s.getCode(), s.getNameJp());
        return m;
    }
```
3. `getByCode`：取 `var names = subjectNameMap();`，把 `r.setSubject(q.getSubject());` 改为
```java
        r.setSubjectCode(q.getSubjectCode());
        r.setSubject(names.getOrDefault(q.getSubjectCode(), q.getSubjectCode()));
        r.setMajorId(q.getMajorCode());
```
4. `list`：循环外取一次 `var names = subjectNameMap();`，`toListItem(q)` 改为 `toListItem(q, names)`。`toListItem` 签名加 `java.util.Map<String,String> names` 参数，内部把 `r.setSubject(q.getSubject());` 替换为：
```java
        r.setSubjectCode(q.getSubjectCode());
        r.setSubject(names.getOrDefault(q.getSubjectCode(), q.getSubjectCode()));
        r.setMajorId(q.getMajorCode());
```

- [ ] **Step 4: `PaperQueryServiceImpl` — 同样解析展示名**

1. 注入 `SubjectMapper subjectMapper;` + 同款 `subjectNameMap()` helper。两 service 各需一份 code→nameJp map；实现者可各自建一份小 helper，或抽一个共享 `@Component`（如 `SubjectNameResolver`）供两者注入——取更简洁者，勿为此过度设计。
2. `listByScope`：循环外 `var names = subjectNameMap();`，把 `r.setSubject(p.getSubject());` 改为
```java
        r.setSubjectCode(p.getSubjectCode());
        r.setSubject(names.getOrDefault(p.getSubjectCode(), p.getSubjectCode()));
```
3. `getByCode`：`var names = subjectNameMap();`，paper 的 `r.setSubject(p.getSubject());` 改为
```java
        r.setSubjectCode(p.getSubjectCode());
        r.setSubject(names.getOrDefault(p.getSubjectCode(), p.getSubjectCode()));
```
（`r.setMajorId(p.getMajorCode())` 已存在。）大问循环里 `qi.setSubject(q.getSubject());` 改为
```java
        qi.setSubjectCode(q.getSubjectCode());
        qi.setSubject(names.getOrDefault(q.getSubjectCode(), q.getSubjectCode()));
        qi.setMajorId(q.getMajorCode());
```

- [ ] **Step 5: 编译 + 提交（含 Task 4 + Task 7 的 SubjectMapper）**

Run: `cd /Users/renquan.11/karios/Kairos-kakomon-server && ./mvnw -q compile`
Expected: BUILD SUCCESS（前提：Task 7 Step 1-4 的 SubjectEntity/SubjectMapper 已就位）。
```bash
cd /Users/renquan.11/karios
git add Kairos-kakomon-server/src/main/java/org/example/kairos/entity/QuestionEntity.java \
        Kairos-kakomon-server/src/main/java/org/example/kairos/entity/ExamPaperEntity.java \
        Kairos-kakomon-server/src/main/resources/mapper/question/QuestionMapper.xml \
        Kairos-kakomon-server/src/main/resources/mapper/question/ExamPaperMapper.xml \
        Kairos-kakomon-server/src/main/java/org/example/kairos/entity/SubjectEntity.java \
        Kairos-kakomon-server/src/main/java/org/example/kairos/mapper/dict/SubjectMapper.java \
        Kairos-kakomon-server/src/main/resources/mapper/dict/SubjectMapper.xml \
        Kairos-kakomon-server/src/main/java/org/example/kairos/service/question/impl/QuestionQueryServiceImpl.java \
        Kairos-kakomon-server/src/main/java/org/example/kairos/service/question/impl/PaperQueryServiceImpl.java \
        Kairos-kakomon-server/src/main/java/org/example/kairos/model/response/question/QuestionResponse.java \
        Kairos-kakomon-server/src/main/java/org/example/kairos/model/response/question/QuestionListItemResponse.java \
        Kairos-kakomon-server/src/main/java/org/example/kairos/model/response/question/PaperResponse.java \
        Kairos-kakomon-server/src/main/java/org/example/kairos/model/response/question/PaperListItemResponse.java
git commit -m "feat(backend): 卷/题 DTO 双字段 subject(展示名)+subjectCode，question 透传 majorId"
```

---

### Task 6: 题目筛选加 majorCode 入参（mapper → service → controller）

**Files:**
- Modify: `Kairos-kakomon-server/src/main/resources/mapper/question/QuestionMapper.xml`
- Modify: `Kairos-kakomon-server/src/main/java/org/example/kairos/mapper/question/QuestionMapper.java`
- Modify: `Kairos-kakomon-server/src/main/java/org/example/kairos/service/question/QuestionQueryService.java`
- Modify: `Kairos-kakomon-server/src/main/java/org/example/kairos/service/question/impl/QuestionQueryServiceImpl.java`
- Modify: `Kairos-kakomon-server/src/main/java/org/example/kairos/web/question/QuestionController.java`

**Interfaces:**
- Consumes: Task 4/5 的列名与 DTO。
- Produces: `/api/questions` 支持 `majorId` 与 `subjectCode` 两个 query 参数（`subject` 参数改名为 `subjectCode`）。Phase 3 的 `questions.ts` 依赖这两个参数名。

- [ ] **Step 1: `QuestionMapper.xml` 的 `<sql id="filter">` 改 subject + 加 major**

把
```xml
            <if test="subject != null and subject != ''">AND q.subject = #{subject}</if>
```
改为
```xml
            <if test="majorCode != null and majorCode != ''">AND q.major_code = #{majorCode}</if>
            <if test="subjectCode != null and subjectCode != ''">AND q.subject_code = #{subjectCode}</if>
```

- [ ] **Step 2: `QuestionMapper.java` 接口签名**

`findByFilter` 与 `countByFilter` 两处：把 `@Param("subject") String subject` 改为 `@Param("subjectCode") String subjectCode`，并新增 `@Param("majorCode") String majorCode`（放在 gradSchoolCode 之后、year 之前，顺序不影响 MyBatis 具名参数，但保持可读）。改后 `findByFilter`：
```java
    List<QuestionEntity> findByFilter(@Param("universityCode") String universityCode,
                                      @Param("gradSchoolCode") String gradSchoolCode,
                                      @Param("majorCode") String majorCode,
                                      @Param("year") Integer year,
                                      @Param("subjectCode") String subjectCode,
                                      @Param("knowledgePoint") String knowledgePoint,
                                      @Param("keyword") String keyword,
                                      @Param("offset") int offset,
                                      @Param("limit") int limit);
```
`countByFilter` 同理（去掉 offset/limit）。

- [ ] **Step 3: `QuestionQueryService` 接口 + Impl 签名**

接口 `list(...)`：把 `String subject` 改为 `String subjectCode`，在 `graduateSchool` 后新增 `String majorId`。改后：
```java
    QuestionListResponse list(String universityId, String graduateSchool, String majorId, Integer year,
                              String subjectCode, String knowledgePoint, String keyword,
                              int page, int pageSize);
```
`QuestionQueryServiceImpl.list` 同步改签名，并把对 mapper 的两处调用改为传 `majorId`（作为 majorCode 实参）与 `subjectCode`：
```java
        long total = questionMapper.countByFilter(universityId, graduateSchool, majorId, year, subjectCode, knowledgePoint, keyword);
        List<QuestionEntity> rows = questionMapper.findByFilter(universityId, graduateSchool, majorId, year, subjectCode, knowledgePoint, keyword, offset, ps);
```

- [ ] **Step 4: `QuestionController` query 参数**

`list(...)`：把 `@RequestParam(required = false) String subject` 改为 `@RequestParam(required = false) String subjectCode`，新增 `@RequestParam(required = false) String majorId`；透传：
```java
        return Result.ok(questionQueryService.list(universityId, graduateSchool, majorId, year, subjectCode,
                knowledgePoint, keyword, page, pageSize));
```

- [ ] **Step 5: 编译**

Run: `cd /Users/renquan.11/karios/Kairos-kakomon-server && ./mvnw -q compile`
Expected: BUILD SUCCESS。

- [ ] **Step 6: Commit**

```bash
cd /Users/renquan.11/karios
git add Kairos-kakomon-server/src/main/resources/mapper/question/QuestionMapper.xml \
        Kairos-kakomon-server/src/main/java/org/example/kairos/mapper/question/QuestionMapper.java \
        Kairos-kakomon-server/src/main/java/org/example/kairos/service/question/QuestionQueryService.java \
        Kairos-kakomon-server/src/main/java/org/example/kairos/service/question/impl/QuestionQueryServiceImpl.java \
        Kairos-kakomon-server/src/main/java/org/example/kairos/web/question/QuestionController.java
git commit -m "feat(backend): /api/questions 支持 majorId + subjectCode 过滤"
```

---

### Task 7: tree 的 MajorNode.subjects 改由 major_subject 填充

> **拆分说明**：本 Task 的 Step 1-4（建 SubjectEntity/MajorSubjectEntity/两 Mapper+XML）需在 Task 5 之前完成（Task 5 注入 SubjectMapper）。Step 5-10（tree 改造）在 Task 6 之后做。文件提交：SubjectEntity/SubjectMapper(+XML) 随 Task 5 Step 5 提交；MajorSubjectEntity/MajorSubjectMapper(+XML)/UniversityTreeResponse/DictionaryServiceImpl 随本 Task Step 10 提交。

**Files:**
- Create: `Kairos-kakomon-server/src/main/java/org/example/kairos/entity/SubjectEntity.java`（随 Task 5 提交）
- Create: `Kairos-kakomon-server/src/main/java/org/example/kairos/entity/MajorSubjectEntity.java`
- Create: `Kairos-kakomon-server/src/main/java/org/example/kairos/mapper/dict/SubjectMapper.java`（随 Task 5 提交）
- Create: `Kairos-kakomon-server/src/main/java/org/example/kairos/mapper/dict/MajorSubjectMapper.java`
- Create: `Kairos-kakomon-server/src/main/resources/mapper/dict/SubjectMapper.xml`（随 Task 5 提交）
- Create: `Kairos-kakomon-server/src/main/resources/mapper/dict/MajorSubjectMapper.xml`
- Modify: `Kairos-kakomon-server/src/main/java/org/example/kairos/model/response/dict/UniversityTreeResponse.java`
- Modify: `Kairos-kakomon-server/src/main/java/org/example/kairos/service/dict/impl/DictionaryServiceImpl.java`

**Interfaces:**
- Consumes: Phase 1 的 `subject` / `major_subject` 表。
- Produces: `MajorNode.subjects` 的元素类型由 `String` → `UniversityTreeResponse.SubjectNode`（`{code, nameJp}`）。Phase 3 的 `dict.ts` `RawMajorNode.subjects` 依赖此形状。

- [ ] **Step 1: `SubjectEntity`**

```java
package org.example.kairos.entity;

import java.time.LocalDateTime;

/** 科目字典实体，对应 subject 表。 */
public class SubjectEntity {
    private Long id;
    private String code;
    private String nameCn;
    private String nameJp;
    private Integer sortOrder;
    private Integer status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public String getNameCn() { return nameCn; }
    public void setNameCn(String nameCn) { this.nameCn = nameCn; }
    public String getNameJp() { return nameJp; }
    public void setNameJp(String nameJp) { this.nameJp = nameJp; }
    public Integer getSortOrder() { return sortOrder; }
    public void setSortOrder(Integer sortOrder) { this.sortOrder = sortOrder; }
    public Integer getStatus() { return status; }
    public void setStatus(Integer status) { this.status = status; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
```

- [ ] **Step 2: `MajorSubjectEntity`**

```java
package org.example.kairos.entity;

import java.time.LocalDateTime;

/** 专业-科目关联实体，对应 major_subject 表。 */
public class MajorSubjectEntity {
    private Long id;
    private String universityCode;
    private String gradSchoolCode;
    private String majorCode;
    private String subjectCode;
    private Integer sortOrder;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getUniversityCode() { return universityCode; }
    public void setUniversityCode(String universityCode) { this.universityCode = universityCode; }
    public String getGradSchoolCode() { return gradSchoolCode; }
    public void setGradSchoolCode(String gradSchoolCode) { this.gradSchoolCode = gradSchoolCode; }
    public String getMajorCode() { return majorCode; }
    public void setMajorCode(String majorCode) { this.majorCode = majorCode; }
    public String getSubjectCode() { return subjectCode; }
    public void setSubjectCode(String subjectCode) { this.subjectCode = subjectCode; }
    public Integer getSortOrder() { return sortOrder; }
    public void setSortOrder(Integer sortOrder) { this.sortOrder = sortOrder; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
```

- [ ] **Step 3: 两个 Mapper 接口**

`SubjectMapper.java`:
```java
package org.example.kairos.mapper.dict;

import org.apache.ibatis.annotations.Mapper;
import org.example.kairos.entity.SubjectEntity;

import java.util.List;

/** 科目字典 Mapper。 */
@Mapper
public interface SubjectMapper {
    /** 全表扫描（status=1），供 tree 构建与校验 */
    List<SubjectEntity> findAll();
}
```
`MajorSubjectMapper.java`:
```java
package org.example.kairos.mapper.dict;

import org.apache.ibatis.annotations.Mapper;
import org.example.kairos.entity.MajorSubjectEntity;

import java.util.List;

/** 专业-科目关联 Mapper。 */
@Mapper
public interface MajorSubjectMapper {
    /** 全表扫描，供 tree 一次性构建 (uni,grad,major)->subjects 映射 */
    List<MajorSubjectEntity> findAll();
}
```

- [ ] **Step 4: 两个 Mapper XML**

`resources/mapper/dict/SubjectMapper.xml`:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
        "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="org.example.kairos.mapper.dict.SubjectMapper">
    <resultMap id="SubjectMap" type="org.example.kairos.entity.SubjectEntity">
        <id column="id" property="id"/>
        <result column="code" property="code"/>
        <result column="name_cn" property="nameCn"/>
        <result column="name_jp" property="nameJp"/>
        <result column="sort_order" property="sortOrder"/>
        <result column="status" property="status"/>
        <result column="created_at" property="createdAt"/>
        <result column="updated_at" property="updatedAt"/>
    </resultMap>

    <select id="findAll" resultMap="SubjectMap">
        SELECT * FROM subject WHERE status = 1 ORDER BY sort_order DESC, id ASC
    </select>
</mapper>
```
`resources/mapper/dict/MajorSubjectMapper.xml`:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
        "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="org.example.kairos.mapper.dict.MajorSubjectMapper">
    <resultMap id="MajorSubjectMap" type="org.example.kairos.entity.MajorSubjectEntity">
        <id column="id" property="id"/>
        <result column="university_code" property="universityCode"/>
        <result column="grad_school_code" property="gradSchoolCode"/>
        <result column="major_code" property="majorCode"/>
        <result column="subject_code" property="subjectCode"/>
        <result column="sort_order" property="sortOrder"/>
        <result column="created_at" property="createdAt"/>
        <result column="updated_at" property="updatedAt"/>
    </resultMap>

    <select id="findAll" resultMap="MajorSubjectMap">
        SELECT * FROM major_subject ORDER BY sort_order DESC, id ASC
    </select>
</mapper>
```

- [ ] **Step 5: `UniversityTreeResponse` 加 SubjectNode，改 MajorNode.subjects 类型**

在 `UniversityTreeResponse` 里新增静态内部类（与 `MajorNode` 同级）：
```java
    /** 科目树节点 */
    public static class SubjectNode {
        private String code;
        private String nameJp;
        public String getCode() { return code; }
        public void setCode(String code) { this.code = code; }
        public String getNameJp() { return nameJp; }
        public void setNameJp(String nameJp) { this.nameJp = nameJp; }
    }
```
把 `MajorNode` 里的
```java
        private List<String> subjects;
        ...
        public List<String> getSubjects() { return subjects; }
        public void setSubjects(List<String> subjects) { this.subjects = subjects; }
```
改为
```java
        private List<SubjectNode> subjects;
        ...
        public List<SubjectNode> getSubjects() { return subjects; }
        public void setSubjects(List<SubjectNode> subjects) { this.subjects = subjects; }
```

- [ ] **Step 6: `DictionaryServiceImpl.getTree` 改填 subjects，移除 parseSubjects**

1. 注入两个新 mapper：
```java
    @Autowired private SubjectMapper subjectMapper;
    @Autowired private MajorSubjectMapper majorSubjectMapper;
```
2. 在 `getTree()` 顶部（加载 us/gs/ms 之后）构建 code→nameJp 与 (uni,grad,major)→subjects 映射：
```java
        java.util.Map<String, String> subjectNameByCode = new java.util.HashMap<>();
        for (SubjectEntity s : subjectMapper.findAll()) subjectNameByCode.put(s.getCode(), s.getNameJp());

        java.util.Map<String, List<UniversityTreeResponse.SubjectNode>> subjectsByMajorKey = new java.util.HashMap<>();
        for (MajorSubjectEntity msub : majorSubjectMapper.findAll()) {
            String key = msub.getUniversityCode() + "::" + msub.getGradSchoolCode() + "::" + msub.getMajorCode();
            UniversityTreeResponse.SubjectNode sn = new UniversityTreeResponse.SubjectNode();
            sn.setCode(msub.getSubjectCode());
            sn.setNameJp(subjectNameByCode.getOrDefault(msub.getSubjectCode(), msub.getSubjectCode()));
            subjectsByMajorKey.computeIfAbsent(key, k -> new ArrayList<>()).add(sn);
        }
```
3. 在填充 `MajorNode` 的循环里，把 `mn.setSubjects(parseSubjects(m.getSubjects()));` 改为：
```java
                    String mkey = u.getCode() + "::" + g.getCode() + "::" + m.getCode();
                    mn.setSubjects(subjectsByMajorKey.getOrDefault(mkey, Collections.emptyList()));
```
4. 删除私有方法 `parseSubjects`（若 `toMajorResp` 仍调用它——见 Step 7）。

- [ ] **Step 7: 处理 `getMajors` 路径的 `MajorResponse.subjects`**

`toMajorResp` 也调用了 `parseSubjects(m.getSubjects())` 填 `MajorResponse.subjects`。为不牵连 `MajorResponse` 形状（本 spec 不改它），保留 `MajorResponse.subjects` 为 `List<String>`，但数据来源已废弃——把 `toMajorResp` 里该行改为 `r.setSubjects(Collections.emptyList());` 并保留 `parseSubjects` 删除。若 `MajorResponse` 及其消费者已无人读 subjects（Phase 3 前端改为从 tree 读），此处返回空列表可接受。**实现期确认** `getMajors` 的前端消费者不依赖 subjects。

> 若确认无消费者，直接让 `toMajorResp` 不再 setSubjects（保留字段但恒空）。不要为此改 `MajorResponse` 类，避免扩大改动面。

- [ ] **Step 8: 编译**

Run: `cd /Users/renquan.11/karios/Kairos-kakomon-server && ./mvnw -q compile`
Expected: BUILD SUCCESS。

- [ ] **Step 9: 运行期冒烟（tree + questions）**

启动后端（需 MySQL+Redis，且已 source 到 V1_8）：
```bash
cd /Users/renquan.11/karios/Kairos-kakomon-server && ./mvnw spring-boot:run -Dspring-boot.run.profiles=local
```
另起终端：
```bash
curl -s 'http://127.0.0.1:8080/api/dict/universities/tree' | grep -o '"subjects":\[[^]]*\]' | head
curl -s 'http://127.0.0.1:8080/api/questions?universityId=todai&majorId=cs&subjectCode=math'
```
Expected: tree 中 major 节点的 `subjects` 为 `[{"code":"math","nameJp":"数学"},...]`；questions 返回 `p-todai-2024-math` 的 3 道题。若本地无 MySQL/Redis，记录“待联调验证”。

- [ ] **Step 10: Commit（仅本 Task Step 5-10 的文件；Subject* 已随 Task 5 提交）**

```bash
cd /Users/renquan.11/karios
git add Kairos-kakomon-server/src/main/java/org/example/kairos/entity/MajorSubjectEntity.java \
        Kairos-kakomon-server/src/main/java/org/example/kairos/mapper/dict/MajorSubjectMapper.java \
        Kairos-kakomon-server/src/main/resources/mapper/dict/MajorSubjectMapper.xml \
        Kairos-kakomon-server/src/main/java/org/example/kairos/model/response/dict/UniversityTreeResponse.java \
        Kairos-kakomon-server/src/main/java/org/example/kairos/service/dict/impl/DictionaryServiceImpl.java
git commit -m "feat(backend): tree 的 major.subjects 改由 major_subject+subject 填充"
```

---

## Phase 3 — 前端

> 本阶段每个 Task 以 `cd Kairos-kakomon && npm run type-check` 为门（项目无测试运行器）。最后做一次功能自述（能否在真机/模拟器跑通需联调环境，记录之）。

### Task 8: 类型与 dict 规范化 — majorId 单值、subjectCode、subjectsByKey

**Files:**
- Modify: `Kairos-kakomon/src/types/question.ts`
- Modify: `Kairos-kakomon/src/api/dict.ts`
- Modify: `Kairos-kakomon/src/store/dictStore.ts`

**Interfaces:**
- Consumes: Task 7 的 tree `subjects: {code,nameJp}[]`。
- Produces: `KakomonQuestion.majorId?: string`（替代 `majorIds`）、`KakomonQuestion.subjectCode: string`（**新增，保留 `subject` 展示名**）；`ExamPaper.subjectCode`（**新增，保留 `subject`**）；`NormalizedDict.subjectsByKey: Record<string, {code:string; nameJp:string}[]>`（键 `uni::grad::major`）；dictStore selector `dictSubjects(uni, grad, major) => {code,nameJp}[]`。Task 9/10 依赖这些。

- [ ] **Step 1: `question.ts` — KakomonQuestion（保留 subject，加 subjectCode，majorIds→majorId）**

把
```ts
  /** 该题归属的专业 id 列表（来自 UNI_MAJORS）。一题可属于多个专业（共享题），缺省视为该研究科全专业通用。 */
  majorIds?: string[];
  year: number;
  subject: string;
```
改为
```ts
  /** 该题归属的专业 id（单值）。后端标量 major_code。 */
  majorId?: string;
  year: number;
  /** 科目展示名（日文，如 数学）。后端 join 字典解析后回传，展示屏直接用。 */
  subject: string;
  /** 科目 code（后端 subject_code），用于过滤/查询。 */
  subjectCode: string;
```

- [ ] **Step 2: `question.ts` — ExamPaper（保留 subject，加 subjectCode）**

`ExamPaper` 里 `subject: string;` **保留**，在其后新增 `subjectCode: string;`（`majorId?: string | null;` 已是单值，保留）。

> 双字段策略：`subject` 是展示名、`subjectCode` 是机器键。约 8 个只读 `q.subject` 的展示屏（search / exam-session / ai-chat / study 首页 / university 详情 / questions 详情 / history 等）因此**零改动**。只有过滤/查询/下拉逻辑改用 `subjectCode`（Task 10）。`WrongQuestion`/`KnowledgeMatrixGroup`/`RelatedQuestion` 的 `subject` 语义本就是展示名、来自别的接口，**不改**。

- [ ] **Step 3: `dict.ts` — RawMajorNode.subjects 变结构 + NormalizedDict.subjectsByKey**

- `RawMajorNode`：把 `subjects?: string[];` 改为 `subjects?: { code: string; nameJp?: string }[];`
- `NormalizedDict`：新增字段
```ts
  subjectsByKey: Record<string, { code: string; nameJp: string }[]>; // 键 `uni::gradCode::majorCode`
```
- `normalizeTree`：在遍历 major 时填充 `subjectsByKey`。在 `majorsByKey[key] = (g.majors ?? [])...` 之后、`gradsByUni[uni.id] = grads;` 之前，加入：
```ts
      for (const m of g.majors ?? []) {
        if (!m || !m.id) continue;
        const mkey = `${uni.id}::${g.id}::${m.id}`;
        subjectsByKey[mkey] = (m.subjects ?? [])
          .filter((s) => s && s.code)
          .map((s) => ({ code: s.code, nameJp: s.nameJp ?? s.code }));
      }
```
并在函数顶部声明 `const subjectsByKey: Record<string, { code: string; nameJp: string }[]> = {};`，在 `return` 里加入 `subjectsByKey`。

- [ ] **Step 4: `dictStore.ts` — 存 subjectsByKey + dictSubjects selector**

`src/store/dictStore.ts` 用**自由函数 selector + `get()` + 静态 seed 兜底**风格（见 `dictMajors`：`get().majorsByKey[key] ?? UNI_MAJORS[key] ?? []`）。仿此但**注意**：科目**没有**对应的静态 seed 常量（`majorsByKey` 有 `UNI_MAJORS`，科目无），故兜底只到 `[]`，不要去找/引入 `SUBJECTS` 之类常量。
- store state：`DictState` 增加 `subjectsByKey: Record<string, { code: string; nameJp: string }[]>`；初始值 `{}`（`majorsByKey` 初始为 `{ ...UNI_MAJORS }`，科目处直接 `{}`）。
- hydrate 的两处（cache 采纳 `parsed.*` 与 network 采纳 `fresh.*`，对齐现有 `majorsByKey:` 行）各加 `subjectsByKey: parsed.subjectsByKey ?? {}` / `subjectsByKey: fresh.subjectsByKey`。
- cache 校验（`typeof d.majorsByKey === 'object'` 一带）可不为 subjectsByKey 增设强校验，缺省 `?? {}` 即可。
- 导出 selector：
```ts
export function dictSubjects(universityId: string, gradCode: string, majorId: string): { code: string; nameJp: string }[] {
  const key = `${universityId}::${gradCode}::${majorId}`;
  return useDictStore.getState().subjectsByKey[key] ?? [];
}
```

- [ ] **Step 5: type-check**

Run: `cd /Users/renquan.11/karios/Kairos-kakomon && npm run type-check`
Expected: 会在**消费点**报错——`majorIds` 已删（`topic-study.tsx`/`mock-exam.tsx`/`topic-questions.tsx`/`mocks/data.ts` 仍用它），且新增的必填 `subjectCode` 在构造 `KakomonQuestion`/`ExamPaper` 处缺字段（`exam-session.tsx` 构造对象、`questions.ts`/`papers.ts` 映射、`mocks/data.ts`）。这些是 Task 9/10/11 的目标。本 Task 只保证 `types/question.ts`、`dict.ts`、`dictStore.ts` 三文件自身无类型错误。

> 与 Phase 2 同理：Task 8–11 是一个类型贯通单元，逐 Task 提交但只在 Task 11 末尾要求 type-check 全绿。若用 subagent，请把 Task 8–11 交给同一 subagent 连续执行。
>
> **注意** `subjectCode` 设为**必填**会让所有构造点都必须补齐——这是有意的编译期防护，确保不漏改。若某构造点确实拿不到 code（理论上不应发生），宁可显式补空串并留 TODO，也不要把字段改成可选而放过遗漏。

- [ ] **Step 6: Commit**

```bash
cd /Users/renquan.11/karios
git add Kairos-kakomon/src/types/question.ts Kairos-kakomon/src/api/dict.ts Kairos-kakomon/src/store/dictStore.ts
git commit -m "feat(fe): KakomonQuestion.majorId 单值 + subjectCode，dictStore 暴露 dictSubjects"
```

---

### Task 9: API 层 — questions.ts / papers.ts 对齐 subjectCode + majorId

**Files:**
- Modify: `Kairos-kakomon/src/api/questions.ts`
- Modify: `Kairos-kakomon/src/api/papers.ts`

**Interfaces:**
- Consumes: Task 8 的类型、Task 5/6 的后端 DTO 字段（`subjectCode`、`majorId`）与 query 参数。
- Produces: `getQuestions` 支持 `majorId`；raw→front 映射用 `subjectCode`/`majorId`。Task 10 屏幕依赖。

- [ ] **Step 1: `questions.ts` — raw 形状 + 映射（保留 subject，加 subjectCode+majorId）**

- `QuestionListItemRaw`：**保留** `subject: string;`，新增 `subjectCode: string;` 与 `majorId?: string;`。
- `listItemToQuestion`：**保留** `subject: raw.subject,`，新增 `subjectCode: raw.subjectCode,` 与 `majorId: raw.majorId,`。
- `relatedToFront` 里的 `subject: ''` 属于 `RelatedQuestion`（未改），保持不动。

- [ ] **Step 2: `questions.ts` — QuestionListParams + getQuestions query**

- `QuestionListParams`：新增 `majorId?: string;`（`subjects?: string[]` 保留，语义为“科目 code 数组”）。
- `getQuestions`：`const subject = params?.subjects?.[0];` → `const subjectCode = params?.subjects?.[0];`；query 里 `subject,` → `subjectCode,` 并新增 `majorId: params?.majorId,`：
```ts
    query: {
      universityId: uni, majorId: params?.majorId, subjectCode, knowledgePoint: kp, year,
      keyword: params?.keyword,
      page: params?.page ?? 1, pageSize: params?.pageSize ?? 20,
    },
```

- [ ] **Step 3: `papers.ts` — raw 形状 + 映射（保留 subject，加 subjectCode）**

- `PaperListItemRaw`、`PaperQuestionRaw`、`PaperDetailRaw` 三处：**保留** `subject: string;`，各新增 `subjectCode: string;`。
- `listItemToExamPaper`：**保留** `subject: raw.subject,`，新增 `subjectCode: raw.subjectCode,`。
- `getPaper` 返回对象：**保留** `subject: raw.subject,`，新增 `subjectCode: raw.subjectCode,`。
- `PaperDetail = ExamPaper & { questionDetails: PaperQuestionRaw[] }`：`PaperQuestionRaw` 现含 `subject`+`subjectCode`，消费方 `exam-session.tsx` 构造 `KakomonQuestion` 时需补 `subjectCode: d.subjectCode`（Task 10 处理）。

- [ ] **Step 4: type-check（局部）**

Run: `cd /Users/renquan.11/karios/Kairos-kakomon && npm run type-check`
Expected: 仅剩 `topic-study.tsx`/`mock-exam.tsx`/`topic-questions.tsx`/`exam-session.tsx`/`mocks/data.ts` 的报错（Task 10/11 处理）。

- [ ] **Step 5: Commit**

```bash
cd /Users/renquan.11/karios
git add Kairos-kakomon/src/api/questions.ts Kairos-kakomon/src/api/papers.ts
git commit -m "feat(fe): questions/papers API 对齐 subjectCode + majorId"
```

---

### Task 10: 屏幕 — topic-study / mock-exam / topic-questions 过滤与下拉切换 + exam-session 补字段

**Files:**
- Modify: `Kairos-kakomon/app/topic-study.tsx`
- Modify: `Kairos-kakomon/app/mock-exam.tsx`
- Modify: `Kairos-kakomon/app/topic-questions.tsx`
- Modify: `Kairos-kakomon/app/exam-session.tsx`

**Interfaces:**
- Consumes: Task 8 的 `dictSubjects` selector、`KakomonQuestion.majorId/subject/subjectCode`；Task 9 的 API。
- Produces: 两屏科目下拉来自 dictStore；过滤用 `majorId === activeEntry.majorId` 与 `subjectCode`；展示仍用 `subject`（日文名）。

- [ ] **Step 1: `topic-study.tsx` — pool 过滤改单值**

把
```ts
      if (activeEntry.majorId) {
        if (q.majorIds && q.majorIds.length > 0 && !q.majorIds.includes(activeEntry.majorId)) return false;
      }
```
改为
```ts
      if (activeEntry.majorId) {
        if (q.majorId && q.majorId !== activeEntry.majorId) return false;
      }
```

- [ ] **Step 2: `topic-study.tsx` — subjects 改从 dictStore 读**

当前 `subjects` useMemo 扫 pool 的 `q.subject` 去重。改为从 dictStore 读该 (uni, grad, major) 的科目，并用题池统计 count（无题则 count=0，仍展示）；字典空时回退扫题池，**用保留的 `q.subject` 作展示名**：
```ts
  const subjects = useMemo(() => {
    if (!activeEntry) return [];
    const dictList = dictSubjects(activeEntry.universityId, activeEntry.gradSchool, activeEntry.majorId ?? '');
    const countByCode = new Map<string, number>();
    const nameByCode = new Map<string, string>();
    pool.forEach((q) => {
      countByCode.set(q.subjectCode, (countByCode.get(q.subjectCode) ?? 0) + 1);
      if (!nameByCode.has(q.subjectCode)) nameByCode.set(q.subjectCode, q.subject);
    });
    if (dictList.length > 0) {
      return dictList.map((s) => ({ code: s.code, name: s.nameJp, count: countByCode.get(s.code) ?? 0 }));
    }
    // 兜底：字典无数据时回退扫题池，展示名用题目自带的 subject（日文名）
    return [...countByCode.entries()]
      .map(([code, count]) => ({ code, name: nameByCode.get(code) ?? code, count }))
      .sort((a, b) => b.count - a.count);
  }, [activeEntry, pool]);
```
并 `import { dictSubjects } from '@/store/dictStore';`（与该文件既有 dictStore 导入合并）。同时把渲染该列表处的 `item.subject` 用法改为 `item.code`/`item.name`（**实现期**按该屏 JSX 实际字段名调整；渲染 key 用 `code`，展示文案用 `name`，计数用 `count`）。

- [ ] **Step 3: `topic-study.tsx` — onSubjectPress 传 code**

`onSubjectPress` 签名与跳转参数改为传 subject code（后端过滤用 code）：
```ts
  function onSubjectPress(subjectCode: string) {
    if (!activeEntry) return;
    router.push(
      `/topic-questions?universityId=${activeEntry.universityId}&gradSchool=${encodeURIComponent(activeEntry.gradSchool)}&majorId=${activeEntry.majorId ?? ''}&subjectCode=${encodeURIComponent(subjectCode)}` as any,
    );
  }
```
调用点传 `item.code`。

- [ ] **Step 4: `mock-exam.tsx` — pool 过滤改单值**

同 Step 1 的替换（`mock-exam.tsx` 内 `pool` useMemo 里的 `q.majorIds...includes` → `q.majorId !== activeEntry.majorId`）。

- [ ] **Step 5: `mock-exam.tsx` — yearGroups.subjects 与 findPaper/startExam 用 code**

- `yearGroups.subjects`：当前 `Array.from(new Set(qs.map((q) => q.subject)))` 聚合“该年有哪些科目”。改为按 `subjectCode` 去重、但保留展示名——用 `{code, name}` 对象：
```ts
      const seen = new Map<string, string>();
      qs.forEach((q) => { if (!seen.has(q.subjectCode)) seen.set(q.subjectCode, q.subject); });
      // subjects: [{ code, name }]
```
渲染下拉项用 `name`（日文名，来自 `q.subject`），选中值/比较用 `code`。**实现期**按该屏 `subjects` 的既有形状（`string[]`）调整为 `{code,name}[]` 并改所有引用点（`getSelectedSubject`/`selectYearSubject`/`yearSubjectMap` 的键改用 `code`）。
- `findPaper(year, subjectCode)`：比较 `p.subject === subject` → `p.subjectCode === subjectCode`（形参改名）。
- `startExam`：`pool.filter((q) => q.year === year && q.subject === subject)` → `q.subjectCode === subjectCode`；跳转 title 展示的科目名**直接用保留的 `q.subject`**（从该科目首题取，或从 `seen.get(code)` 取），无需查 dict。
- `handleExamPress`/`gate` 里的 `subject` 若用于展示（line 630 `${gate.year} 年 ${gate.subject}`），把 `gate` 存的值改为展示名 `subject`（日文名），比较/定位用 `subjectCode`——即 `gate` 同时带 `{ year, subjectCode, subjectName }`，或展示处用 `seen.get(gate.subjectCode)`。**实现期**取最小改动。

- [ ] **Step 6: `topic-questions.tsx` — 查询用 subjectCode，展示保留 subject**

该屏当前（已确认行号）：`useLocalSearchParams<{...; majorId: string; subject: string }>()`（line 63）、解构（line 68）、`queryKey`/`getQuestions({ subjects: subject ? [subject] : undefined })`（line 72-75）、`enabled: !!universityId && !!subject`（line 78）、`.filter((q) => q.subject === subject)`（line 87）、标题 `{subject}`（line 140）。因 Task 10 Step 3 的跳转已改传 `subjectCode` 参数（见下），改法：
1. 泛型与解构：把参数 `subject: string` 改为 `subjectCode: string`（line 63/68）。`majorId` 已在参数里。
2. queryKey/`subjects`/`enabled`：用 `subjectCode`（line 72/75/78），即 `subjects: subjectCode ? [subjectCode] : undefined`。
3. 过滤（line 87-89）：`q.subject === subject` → `q.subjectCode === subjectCode`；该屏若还按 majorId 过滤且用 `q.majorIds.includes`，改 `q.majorId === majorId`。
4. 标题展示 line 140：改为从查询结果首题取展示名 `questionsQuery.data?.items?.[0]?.subject ?? subjectCode`（保留日文名展示，回退 code）。

- [ ] **Step 7: `exam-session.tsx` — 构造 KakomonQuestion 补 subjectCode**

`exam-session.tsx` 从 `paperQuery.data.questionDetails` map 构造 `KakomonQuestion[]`（含 `subject: d.subject`）。因 `subjectCode` 为必填，在该对象里 `subject: d.subject,` 之后新增 `subjectCode: d.subjectCode,`。若还有第二处从别的源构造 `KakomonQuestion`（如兜底），同样补 `subjectCode`（type-check 会点名所有缺失处）。`majorId` 若构造对象未包含且类型可选，无需补。

- [ ] **Step 8: type-check**

Run: `cd /Users/renquan.11/karios/Kairos-kakomon && npm run type-check`
Expected: 仅剩 `mocks/data.ts` 的报错（Task 11 处理）。

- [ ] **Step 9: Commit**

```bash
cd /Users/renquan.11/karios
git add Kairos-kakomon/app/topic-study.tsx Kairos-kakomon/app/mock-exam.tsx Kairos-kakomon/app/topic-questions.tsx Kairos-kakomon/app/exam-session.tsx
git commit -m "feat(fe): 专题/模考科目下拉改读 dictStore，过滤用 majorId+subjectCode，展示保留 subject"
```

---

### Task 11: mock 兜底数据对齐 + 全量 type-check

**Files:**
- Modify: `Kairos-kakomon/src/mocks/data.ts`

**Interfaces:**
- Consumes: Task 8 的类型。
- Produces: `KAKOMON_QUESTIONS` / `KAKOMON_PAPERS` 每条用 `majorId`（单值）+ **保留 `subject`（展示名）并新增 `subjectCode`**，作为断网/冷启动兜底。

- [ ] **Step 1: 定位 mock 里的 subject / majorIds**

Run: `cd /Users/renquan.11/karios/Kairos-kakomon && grep -nE "majorIds|subject:" src/mocks/data.ts`
Expected: 列出所有 `majorIds: [...]` 与 `subject: '...'` 出现处。

- [ ] **Step 2: 批量改 `majorIds: [...]` → `majorId: '...'`**

对每条 question mock：`majorIds: ['cs','mi','si']` → `majorId: 'cs'`（取数组首个作为主专业；若原为空数组或缺省，则设为该条所属研究科的主专业 code，**实现期**按数据语义挑选，缺省可省略该字段）。

- [ ] **Step 3: 每条 question/paper mock 在 `subject` 后新增 `subjectCode`（保留 subject）**

**保留** `subject: '数学'`（展示名，前端展示屏与兜底下拉都读它），在其后**新增** `subjectCode: 'math'`。按 V1_8 subject 字典 code 对照：`数学→math`、`情报→info`、`算法/アルゴリズム→algorithm`、`英语→english`。出现字典未覆盖的科目名时，回到 **Task 3 补 V1_8 subject 种子** 再用新 code。paper mock 同理（`subject` 保留 + 加 `subjectCode`）。

- [ ] **Step 4: 全量 type-check（Phase 3 总门）**

Run: `cd /Users/renquan.11/karios/Kairos-kakomon && npm run type-check`
Expected: PASS，无错误。

- [ ] **Step 5: lint（次要门）**

Run: `cd /Users/renquan.11/karios/Kairos-kakomon && npm run lint`
Expected: 无新增错误（既有告警不阻断）。

- [ ] **Step 6: Commit**

```bash
cd /Users/renquan.11/karios
git add Kairos-kakomon/src/mocks/data.ts
git commit -m "feat(fe): mock 兜底数据对齐 majorId 单值 + subjectCode"
```

---

## 收尾验收（全链路）

- [ ] **DB**：空库按 V1_0→V1_5→V1_8 顺序执行无报错；`exam_paper`/`question` 每条种子的 `major_code`+`subject_code` 均 NOT NULL 且 `subject_code` 存在于 `subject` 表。
- [ ] **后端**：`./mvnw compile` 通过；`/api/dict/universities/tree` 的 major 节点 `subjects` 返回 `{code,nameJp}[]`；`/api/questions?universityId=todai&majorId=cs&subjectCode=math` 命中 3 题。
- [ ] **前端**：`npm run type-check` 通过；专题学习进入 (学校+研究科+专业) 后科目卡来自字典；模考按 专业+年度+科目 定位试卷；约 8 个展示屏（search/exam-session/ai-chat/study 首页/university 详情/questions 详情/history 等）科目名仍正常显示日文名（双字段策略，未改动）。
- [ ] **联调**（需真机/模拟器 + 后端 + MySQL/Redis）：科目下拉在断网时回退题池展示名；在线时来自 tree dictStore。**记录**是否已人工验证或留待联调环境。
- [ ] 更新 `Kairos-kakomon/tasks.md`（前端）与项目 `TASKS.md`（若适用）的 checklist。

## 已知实现期决策点（须在对应 Task 内落地，不得留白）

1. **Task 7 Step 7**：`getMajors`/`MajorResponse.subjects` 的前端消费者是否存在——确认无则 `toMajorResp` 恒设空列表，不改 `MajorResponse` 类。
2. **Task 10 Step 5**：模考 `subjects`/`gate` 由 `string[]`/单串改为携带 `{code, name}` 的最小改法——展示名直接用题目保留的 `subject`（日文名），比较/定位用 `subjectCode`，无需查 dict。
3. **Task 11 Step 3**：mock 中出现 V1_8 未覆盖的科目名时，回到 Task 3 补 subject 种子后再改 mock，保证 code 对齐。
4. **模考“一个专业+科目多份卷”UI**：本计划的下限是下拉数据源切换 + 过滤参数带 major/subjectCode；若真实数据出现同 (专业,年度,科目) 多卷，年份卡的多卷列举为紧随其后的前端迭代，不在本计划强制范围（spec §5 已注明）。
