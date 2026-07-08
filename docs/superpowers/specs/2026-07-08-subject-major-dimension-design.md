# 科目字典化 + 卷/题的专业·科目维度确定 — 设计

- **日期**：2026-07-08
- **状态**：已定稿（用户逐点确认）
- **范围**：全链路一份 —— DB（V1_4 就地改 + 新增 V1_8）+ 后端读路径 + 前端下拉/过滤切换
- **前置**：本 spec 取代 2026-07-08 早期 brainstorm 记录里的 M:N 方案（见文末「取代的旧决策」）
- **相关**：`docs/superpowers/specs/2026-07-02-topic-study-and-mock-exam-design.md`、研究科 code 统一（`2026-07-06` / `2026-07-07`）

## 1. 背景与问题

专题学习（topic-study）与模拟考试（mock-exam）两个板块，都要按「学校 → 研究科 → 专业 → 科目」下钻到题目/试卷。当前实现有两处硬伤：

1. **科目是裸字符串**。`exam_paper.subject` / `question.subject` 存 `VARCHAR "数学"`，没有字典。科目下拉靠前端扫题目 `DISTINCT`（`mock-exam.tsx:241`、`topic-study.tsx:206`），没题就没科目，且无法自定义顺序/显示名。这正在重蹈研究科「名字即键」的坑。
2. **专业维度未坐实**。`exam_paper.major_code` / `question.major_code` 两列已存在但可空（`NULL`），前端题目侧用 `majorIds: string[]` 数组 + `includes` 过滤（`topic-study.tsx:200`），语义与后端不一致。

## 2. 核心模型决策

**一份试卷、一道大问，都精确归属于唯一的 (学校 + 研究科 + 专业 + 科目)。** `major_code` 与 `subject_code` 均为**标量列冗余存**，不做多对多。一个「专业+科目」下可以有很多试卷（第1回/第2回…）和很多题目。

- **不建** `question_major` / `exam_paper_major` 关系表 —— 放弃 M:N。
- **散题**的唯一判据是 `question.paper_code IS NULL`（题不挂卷），散题**照样**有专业+科目。**没有散卷**。
- `subject` 升级为全局字典，`major_subject` 关联表承载「某专业挑哪些科目 + 各自顺序」。科目概念全站共享。
- 关联一律用**可读 code**（`subject_code` / `major_code`），与 V1_4 题库域现有 `university_code / grad_school_code` 风格一致，不引入 id 关联。

### 关键取舍（用户确认）

| # | 点 | 决策 | 理由 |
|---|----|------|------|
| A | `uk_paper_scope` 唯一键 | **保留**，扩为 `(uni, grad, major, year, subject_code)` | 同研究科不同专攻的「2024 数学」是不同卷，需 major 才不撞键；major NOT NULL 后全参与唯一判定 |
| B | major M:N 打标 | **不做**（无 `question_major`/`exam_paper_major`） | 用户模型为单专业归属，标量列足够 |
| C | subject 关联方式 | **用 code**（`subject_code`） | 与题库域 `*_code` 一致 |
| D | `major_code` 可空性 | **NOT NULL**（卷和题都是） | 卷/题必属于一个专业；散题由 `paper_code` 判定，与 major 无关 |
| E | 前端 `majorIds: string[]` | **降为单值 `majorId: string`** | 后端标量返回单专业，前端「读到什么是什么」，`includes`→`===` |

## 3. 数据层设计

### 3.1 新建：`subject`（全局科目字典）

```sql
CREATE TABLE `subject` (
  `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  `code`       VARCHAR(40)  NOT NULL                COMMENT '全站唯一科目 code, 如 math',
  `name_cn`    VARCHAR(60)  NULL                    COMMENT '中文名, 如 数学',
  `name_jp`    VARCHAR(60)  NOT NULL                COMMENT '日文名, 如 数学',
  `sort_order` INT          NOT NULL DEFAULT 0      COMMENT '全局默认排序权重',
  `status`     TINYINT      NOT NULL DEFAULT 1      COMMENT '1=上线 0=下线',
  `created_at` DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_subject_code` (`code`)
) ENGINE = InnoDB COMMENT = '科目字典(全局)';
```

### 3.2 新建：`major_subject`（专业 ↔ 科目关联）

```sql
CREATE TABLE `major_subject` (
  `id`               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  `university_code`  VARCHAR(40)  NOT NULL COMMENT '大学 code',
  `grad_school_code` VARCHAR(80)  NOT NULL COMMENT '研究科 code',
  `major_code`       VARCHAR(80)  NOT NULL COMMENT '专业 code(研究科内唯一, 非全站唯一, 故需三码一起绑)',
  `subject_code`     VARCHAR(40)  NOT NULL COMMENT '科目 code, 关联 subject.code',
  `sort_order`       INT          NOT NULL DEFAULT 0 COMMENT '该专业内科目展示顺序',
  `created_at`       DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`       DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_major_subject` (`university_code`, `grad_school_code`, `major_code`, `subject_code`),
  KEY `idx_ms_subject` (`subject_code`)
) ENGINE = InnoDB COMMENT = '专业-科目关联';
```

> 绑三码（uni+grad+major）而非仅 `major_code`：因为 `major.code`（如 `cs`）只在研究科内唯一（`major` 表 `uk_grad_code (grad_school_id, code)`），非全站唯一。

### 3.3 改动：`exam_paper`

- `major_code` `NULL` → **`NOT NULL`**
- `subject` `VARCHAR(60)`（裸串）→ 改列名 **`subject_code` `VARCHAR(40) NOT NULL`**（关联 `subject.code`）
- `uk_paper_scope`：`(university_code, grad_school_code, year, subject)` → **`(university_code, grad_school_code, major_code, year, subject_code)`**

### 3.4 改动：`question`

- `major_code`：**当前 `question` 表无此列**（仅 `exam_paper` 有）。需**新增** `major_code VARCHAR(80) NOT NULL COMMENT '冗余: 专业 code'`。同步补 `QuestionEntity.majorCode` 字段 + getter/setter、`QuestionMapper.xml` resultMap 的 `<result column="major_code" property="majorCode"/>`、`listCols` 加 `major_code`。
- `subject` → **`subject_code` `VARCHAR(40) NOT NULL`**
- `paper_code` 保持 `NULL`（散题唯一判据，不动）
- `idx_q_filter`：`(university_code, grad_school_code, year, subject, status)` → **`(university_code, grad_school_code, major_code, year, subject_code, status)`**

### 3.5 废弃

- `major.subjects`（JSON 数组）——被 `major_subject` 取代。保留列但停止使用，或在 V1_8 注释标注废弃（不 DROP，避免影响 dict 其他读取）。**实现期确认**是否有代码仍读它。

### 3.6 迁移策略

Greenfield，无线上业务数据，**不做回填**：
- **V1_4 就地改**：`exam_paper` / `question` 的建表语句直接改成目标结构（列名、NOT NULL、唯一键、索引）。
- **新增 V1_8**：`subject` + `major_subject` 建表 + 种子数据（科目字典 + 各专业的科目关联）。
- **V1_5 seed（`V1_5__seed_questions.sql`）**：`subject` 裸串值改写为 `subject_code`，并为每条卷/题填 `major_code`（NOT NULL 要求）。
- 执行顺序按文件号：V1_4（改结构）→ V1_5（改 seed，填 subject_code + major_code）→ V1_8（建 subject/major_subject + 种子）。**本项目不用物理外键**，故 V1_5 先于 V1_8 执行不会报错；唯一要求是 seed 作者保证 V1_5 里用到的每个 `subject_code` 都在 V1_8 的 subject 字典里存在（seed 校验人工确认 code 对齐，无回填脚本）。

## 4. 后端读路径

### 4.1 科目下拉数据源（改造 tree，不新增端点）

不再由前端扫题目 `DISTINCT`，也**不**新增 `/dict/subjects` 端点。复用现有 `GET /api/dict/universities/tree`：`UniversityTreeResponse.MajorNode` 已有 `subjects` 槽位（当前由废弃的 `major.subjects` JSON 填充），改为由 `major_subject JOIN subject` 填充，与 offline-first 的 dictStore 机制（2026-07-07 datasource 化）保持一套。

- **形状变更**：`MajorNode.subjects` 由 `List<String>`（仅日文名）→ **`List<SubjectNode>`**，`SubjectNode = { code, nameJp }`（新增静态内部类，与 `GradSchoolNode` 同款）。按 `major_subject.sort_order` 排序。
- **getTree 实现**：仿照现有 `gradByUni` / `majorByGrad` 一次性加载模式——`majorSubjectMapper.findAll()` + `subjectMapper.findAll()` 各查一次，在内存 build 出 `(uni_code, grad_code, major_code) → List<SubjectNode>` 映射，填入每个 `MajorNode`。不做 N+1 逐 major 查询。
- **新增 mapper**：`SubjectMapper`（`findAll`）+ `MajorSubjectMapper`（`findAll`），落 `mapper/dict/` + XML，遵循 `docs/04-backend/backend-conventions.md`。`DictionaryServiceImpl.parseSubjects` + `major.subjects` 读取移除。

### 4.2 题目/试卷过滤

- `QuestionMapper.xml:51` `AND q.subject = #{subject}` → `AND q.subject_code = #{subjectCode}`；筛选入参新增 `majorCode`（`AND q.major_code = #{majorCode}`）。
- `QuestionQueryService` / `QuestionController` / `PaperQueryService` 相应把 `subject` 参数改为 `subjectCode`，新增 `majorCode`。
- entity（`QuestionEntity` / `ExamPaperEntity`）：`subject` 字段 → `subjectCode`；`ExamPaperEntity.majorCode` 已存在，`QuestionEntity` **需新增** `majorCode`（见 §3.4）。
- response DTO（`QuestionResponse` / `QuestionListItemResponse` / `PaperResponse` / `PaperListItemResponse`）：**同时保留 `subject`（展示名）+ 新增 `subjectCode`**。service 层用 subject 字典把 `subject_code` 解析成 `subject`（日文名）——注入 `SubjectMapper`，一次 `findAll()` 建 `code→nameJp` 内存 map（题库域已在 Task 7 引入该 mapper），映射每条时 `r.setSubjectCode(e.getSubjectCode()); r.setSubject(nameByCode.get(e.getSubjectCode()))`。`QuestionResponse`/`QuestionListItemResponse` 另新增 `majorId`（承载 question.major_code）。
- 展示名：response **同时**回 `subjectCode`（机器键）+ `subject`（日文名，服务层 join subject 字典解析）。前端展示屏读 `subject` 零改动，过滤读 `subjectCode`。

## 5. 前端读路径

**双字段策略（用户定案）**：后端表存 `subject_code`，但 question/paper **响应 DTO 同时回 `subjectCode`（机器键）与 `subject`（日文展示名，服务层 join subject 字典解析）**。前端 `KakomonQuestion`/`ExamPaper` **保留 `subject`（展示名）+ 新增 `subjectCode`（过滤键）**。这样约 8 个仅展示 `{q.subject}` 的屏（search / exam-session / ai-chat / study 首页 / university 详情 / questions 详情 等）**零改动**，无展示回归。

- **类型**：`src/types/question.ts` `KakomonQuestion.majorIds?: string[]` → `majorId?: string`；`KakomonQuestion` 与 `ExamPaper` **保留 `subject: string`（展示名）并新增 `subjectCode: string`**。
- **过滤**：`topic-study.tsx:200` / `mock-exam.tsx:224` `q.majorIds...includes(activeEntry.majorId)` → `q.majorId === activeEntry.majorId`。科目过滤/查询用 `subjectCode`；展示仍用 `subject`。
- **科目下拉**：`topic-study.tsx:206` 与 `mock-exam.tsx:241` 的 `Array.from(new Set(qs.map(q => q.subject)))` → 改从 dictStore 读该 (uni, grad, major) 的科目列表（tree 已带 `subjects: {code,nameJp}[]`）。下拉项展示 `nameJp`、过滤/跳转用 `code`。
- **dict.ts / dictStore**：`RawMajorNode.subjects` 由 `string[]` → `{code,nameJp}[]`；`normalizeTree` 产出 `subjectsByKey: Record<'uni::grad::major', {code,nameJp}[]>`；dictStore 加 `dictSubjects(uni,grad,major)` selector（无静态 seed 兜底，空回退 `[]`）。
- **mock 兜底**：`src/mocks/data.ts` 的 `majorIds: [...]` → `majorId`（挑主专业）；每条**同时**给 `subject: '数学'`（展示名，保留）+ `subjectCode: 'math'`（新增）。mock 是冷启动/断网兜底，非主数据源。
- **topic-questions.tsx**：`majorId` 过滤 `includes` → `===`；`subject` 查询参数改用 `subjectCode`（该屏也读 `q.majorIds`，一并改单值）；标题展示仍可用 `subject`。
- **模考导航**：`mock-exam.tsx` 现「年份卡内科目下拉一对一定位单卷」结构，随「一个专业+科目多份卷」模型需复核（第1回/第2回多卷展示）。**实现期评估**是否本 spec 内做——本 spec 下限是：下拉数据源切到字典 + 过滤参数带 major/subjectCode，UI 多卷列举可作为紧随其后的前端任务。

## 6. 影响文件清单（实现期核对）

**DB**：`V1_4__questions_schema.sql`（改）、`V1_5__seed_questions.sql`（改 seed）、`V1_8__subject_dict.sql`（新）。

**后端**：
- entity：`ExamPaperEntity`、`QuestionEntity`（subject→subjectCode）；新增 `SubjectEntity`、`MajorSubjectEntity`
- mapper：`QuestionMapper.java`+`.xml`、`ExamPaperMapper.xml`；新增 `SubjectMapper`/`MajorSubjectMapper`(+XML)（`mapper/dict/`）
- service：`QuestionQueryService(Impl)`（注入 `SubjectMapper` 解析 subject_code→nameJp）、`PaperQueryServiceImpl`（同）；`DictionaryServiceImpl.getTree` 改由 major_subject 填 `MajorNode.subjects`，移除 `parseSubjects`/`major.subjects` 读取
- web：`QuestionController`（subject→subjectCode + 新增 majorCode 入参）；**dict controller 不新增端点**
- response：`QuestionResponse`/`QuestionListItemResponse`/`PaperResponse`/`PaperListItemResponse`（**保留 `subject` 展示名 + 新增 `subjectCode`**；question 侧另加 `majorId`）；`UniversityTreeResponse.MajorNode.subjects` → `List<SubjectNode>`（新增内部类）

**前端**（双字段策略，展示屏零改动）：
- `src/types/question.ts`（majorIds→majorId；`KakomonQuestion`/`ExamPaper` 保留 `subject` + 新增 `subjectCode`）
- `app/topic-study.tsx`（过滤 `===` + 下拉改读 dictStore）、`app/mock-exam.tsx`（下拉改读 dictStore + 过滤用 subjectCode + 多卷复核）、`app/topic-questions.tsx`（majorId `===` + 查询用 subjectCode）
- `src/api/questions.ts`（raw 加 subjectCode+majorId，映射保留 subject）、`src/api/papers.ts`（同）、`src/api/dict.ts`（`RawMajorNode.subjects` 变结构 + `normalizeTree` 产出 subjectsByKey）、`src/store/dictStore.ts`（`dictSubjects` selector）
- `src/mocks/data.ts`（`majorIds`→`majorId`；每条同时给 `subject` 展示名 + `subjectCode`）
- **不改**：`search.tsx` / `exam-session.tsx`（构造 KakomonQuestion 时新增 `subjectCode: d.subjectCode`）/ `ai-chat.tsx` / `(tabs)/study/index.tsx` / `university/[id].tsx` / `questions/[id].tsx` 等展示屏——除 `exam-session.tsx` 需在构造对象时补 `subjectCode` 字段外，其余读 `q.subject` 处不动

## 7. 验收

- **后端**：`./mvnw compile` 通过；`/dict/universities/tree` 的每个 major 节点 `subjects` 返回 `{code,nameJp}[]`（含顺序）；题目/试卷按 `majorCode + subjectCode` 过滤命中。
- **前端**：`npm run type-check` 通过；专题学习按 (学校+研究科+专业) 进入后，科目卡片来自字典而非扫题；模考按专业+年度+科目定位试卷。
- **数据**：迁移脚本按序执行无报错；seed 的每条卷/题都有 NOT NULL 的 major_code + subject_code，且 subject_code 均存在于 subject 字典。

## 8. 取代的旧决策

2026-07-08 早期 brainstorm（仅存于记忆，spec 未落盘）曾定为 **M:N**：新增 `question_major` / `exam_paper_major` 关系表、`question` 不加 major 标量列、`exam_paper` 删 `major_code`、**删除** `uk_paper_scope`、前端 `majorIds` 保持数组。

**本 spec 全面取代**为**单专业标量模型**：`major_code` NOT NULL 标量列、无关系表、`uk_paper_scope` 保留并扩为含 major、前端降为单值 `majorId`。理由：用户实际业务中一份卷/一道题就是出给某一个专攻+科目，单专业归属更简单也更贴合，M:N 属过度设计。
