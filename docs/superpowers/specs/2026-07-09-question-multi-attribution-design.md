# 题目/试卷多归属（M:N）模型改造 — 设计

- **日期**：2026-07-09
- **相关**：`docs/superpowers/specs/2026-07-08-subject-major-dimension-design.md`（本 spec **推翻**其单归属标量结论）、`docs/superpowers/specs/2026-07-02-topic-study-and-mock-exam-design.md`、`docs/superpowers/specs/2026-07-09-question-detail-crowd-mastery-design.md`（本 spec 会撤掉其 `findSameTopic` 标量实现）
- **主战场**：DB schema（`V2_0` 破坏性迁移）+ 后端 `question`/`exam_paper` 模块查询 + 付费门禁 + 前端多屏

## 1. 背景与问题

当前 `question` 与 `exam_paper` 主表用五个 NOT NULL 标量列确定归属：`university_code + grad_school_code + major_code + subject_code + year`。这是 2026-07-08 定的「一题/一卷精确属于唯一 (校+研究科+专业+科目)」标量模型。

**该前提在实际业务中不再成立**（用户确认，2026-07-09）：
1. **跨校真题复用**：同一道题在多所学校的历年真题里都考过，且**年份可不同**（东大 2023 真题 == 京大 2021 真题）。归属是「客观出处」，多个。
2. **跨专业练习展示**：一道题按知识点适用于多个专业，希望在多个专业的专题练习列表里都出现。

标量模型装不下多归属。**「每列存多值」是错的**——四/五个属性是成组绑定的元组，拆成各列多值会产生笛卡尔积幻影（`[东大,京大]×[情报理工,情报学]` 会虚构出「东大+情报学」这种不存在的组合）。正解是**关系表**：一行 = 一个完整元组（原子单位）。

### 当前实况（已核实）

- `question`（V1_4:46）与 `exam_paper`（V1_4:19）均含五个标量列 + 索引 `idx_q_filter`（university,grad,major,year,subject,status）、`idx_paper_scope`、`idx_paper_filter`。
- 后端读这五列的地方：`QuestionMapper.xml`（`listCols`/`listColsQ`、`findByFilter` 的 `<if>` 过滤、`findSameTopic` 的等值过滤）、`ExamPaperMapper.xml`（`findByScope`）。`user`/`dict` 模块的同名列属其它表（`user_target_school`/`major_subject`），无关。
- 前端读题的单归属字段做**展示或过滤**：`search.tsx`（卡片 `{q.year}·{q.subject}`、门禁 `q.universityId/q.year`、本地 filter）、`topic-study.tsx:197-198`（`q.universityId===... && q.graduateSchool===...` 本地过滤）、`questions/[id].tsx:186`（门禁取 university）。
- 付费门禁 `accessPolicy.canAccessQuestion(user, {universityId, gradSchool, year, questionId})`：按 `targetKey(universityId,gradSchool)` 命中免费研究科 + `year>=freeYearFloor` 判定。**纯前端**。
- `KakomonQuestion` 类型含 `universityId/graduateSchool/majorId?/year/subject/subjectCode`。

## 2. 已定决策（brainstorm 2026-07-09，用户逐条确认）

1. **试卷和题都多归属**（`exam_paper` 与 `question` 都要 M:N）。
2. **归属粒度 = 五元组 (校+研究科+专业+科目+year)**。year 随归属走（跨校复用年份可不同）。
3. **主表完全归一化**：`question`/`exam_paper` **删掉** `university_code/grad_school_code/major_code/subject_code/year` 五列，归属只存关系表。
4. **两张独立 scope 表**（`question_scope`、`exam_paper_scope`），不用多态单表。
5. **挂卷题继承卷 scope**：`paper_code` 非空的大问不单独存 scope，其归属查所属卷的 `exam_paper_scope`；只有**散题**（`paper_code IS NULL`）用 `question_scope`。
6. **详情页不展示归属**；**搜索/列表卡片不显学校/年份**（只显 科目+题号+标题）。
7. **门禁 `locked` 布尔由后端算**（任一 scope 命中免费范围即免费），accessPolicy 判定部分下沉后端；前端不再自己拼多 scope 判定。
8. **前端 `KakomonQuestion` 移除** `universityId/graduateSchool/majorId/year`（展示层不再需要）；保留 `subject/subjectCode/questionNo/title/knowledgePoints/难度/crowd/掌握` 等题目自身属性。
9. **迁移 `V2_0`**（破坏性大版本）：建 scope 表 → 回填 → DROP 主表五列+旧索引；种子同步改。

**门禁细节待定**：跨校题「免费范围」精确口径（默认建议：任一 scope 命中即免费）在实现阶段最终确认。本 spec 采用「任一命中即免费」为默认。

## 3. 数据模型（DB · `V2_0`）

### 3.1 新建 `question_scope`（仅散题）

```sql
CREATE TABLE `question_scope` (
  `id`               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  `question_code`    VARCHAR(80)  NOT NULL COMMENT '散题 code, 关联 question.code (paper_code IS NULL 的题)',
  `university_code`  VARCHAR(40)  NOT NULL,
  `grad_school_code` VARCHAR(80)  NOT NULL,
  `major_code`       VARCHAR(80)  NOT NULL,
  `subject_code`     VARCHAR(40)  NOT NULL,
  `year`             SMALLINT     NOT NULL,
  `sort_order`       INT          NOT NULL DEFAULT 0 COMMENT '主归属排序(小在前)',
  `created_at`       DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_q_scope` (`question_code`,`university_code`,`grad_school_code`,`major_code`,`subject_code`,`year`),
  KEY `idx_scope_filter` (`university_code`,`grad_school_code`,`major_code`,`subject_code`,`year`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='散题归属(M:N, 五元组)';
```

### 3.2 新建 `exam_paper_scope`（试卷）

结构同 3.1，把 `question_code` 换成 `paper_code`（关联 `exam_paper.code`），唯一键 `uk_p_scope`、索引 `idx_pscope_filter` 同形。

### 3.3 主表瘦身

- `question`：DROP COLUMN `university_code, grad_school_code, major_code, subject_code, year`；DROP KEY `idx_q_filter`。**保留** `paper_code`（挂卷关系）、`code`、`question_no`、`title`、`order_index`、`content_blocks`、`body_text`、`difficulty_*`、`crowd_*`、`status`、`ft_q_body`（title+body_text 全文索引不涉及删的列）、`idx_q_paper`。
- `exam_paper`：DROP COLUMN 同五列；DROP KEY `idx_paper_scope`、`idx_paper_filter`。保留 `code/title/duration_minutes/total_score/select_rule/instructions/source_pdf_key/status/sort_order`。

### 3.4 迁移顺序（可重放）

`V2_0__question_multi_attribution.sql`：
1. `CREATE TABLE question_scope`、`exam_paper_scope`。
2. **回填**：`INSERT INTO question_scope(question_code, university_code, grad_school_code, major_code, subject_code, year, sort_order) SELECT code, university_code, grad_school_code, major_code, subject_code, year, 0 FROM question WHERE paper_code IS NULL;`（现有每散题正好一行）。挂卷题不回填（继承卷）。`INSERT INTO exam_paper_scope(paper_code, university_code, grad_school_code, major_code, subject_code, year, sort_order) SELECT code, university_code, grad_school_code, major_code, subject_code, year, 0 FROM exam_paper;`
3. `ALTER TABLE question DROP COLUMN ...×5, DROP KEY idx_q_filter;` `ALTER TABLE exam_paper DROP COLUMN ...×5, DROP KEY idx_paper_scope, DROP KEY idx_paper_filter;`

> greenfield 无线上数据，但脚本按「回填后删列」写以保证可重放 & 文档一致。

### 3.5 种子

- `V1_5`（题种子）改：`INSERT INTO question`（不含五列）+ 对每散题 `INSERT INTO question_scope` 一行（承接原五列值）。为演示多归属，给至少一道散题**加第二条 scope**（跨校/跨专业各一例）。
- `exam_paper` 种子（在 V1_5 或相应脚本）：同理插主表（无五列）+ `exam_paper_scope` 行。
- `V1_5` 头部注释更新，说明与 `question_scope`/`exam_paper_scope` 的关系。

## 4. 后端查询改造

### 4.1 列集合调整

`QuestionMapper.xml` 的 `listCols`/`listColsQ`、`QMap` resultMap、`QuestionEntity`、`QuestionResponse`/`QuestionListItemResponse`：**移除** `university_code/grad_school_code/major_code/subject_code/year` 字段。`ExamPaper` 侧同理。

### 4.2 列表筛选 `findByFilter`（topic-questions 列表）

入参不变（校/研究科/专业/科目）。SQL 改为 **UNION 两分支 + DISTINCT**：

```sql
-- 散题分支
SELECT <qCols> FROM question q
JOIN question_scope s ON s.question_code = q.code
WHERE q.status=1 AND q.paper_code IS NULL
  AND s.university_code=#{u} AND s.grad_school_code=#{g}
  AND s.major_code=#{m} AND s.subject_code=#{sub}
  <if year> AND s.year=#{year} </if>
UNION
-- 挂卷题分支(继承卷 scope)
SELECT <qCols> FROM question q
JOIN exam_paper p ON q.paper_code = p.code
JOIN exam_paper_scope ps ON ps.paper_code = p.code
WHERE q.status=1
  AND ps.university_code=#{u} AND ps.grad_school_code=#{g}
  AND ps.major_code=#{m} AND ps.subject_code=#{sub}
  <if year> AND ps.year=#{year} </if>
```

外层按 `code` DISTINCT（一题多 scope 命中会重复）、排序、分页。`<qCols>` = 主表保留列（无五列）。

> `keyword` 检索分支保持对 `q.title/q.body_text` 的 `LIKE`/FULLTEXT，与 scope 过滤 AND 组合。

### 4.3 同专题 `findSameTopic`（撤掉标量实现，改 join scope）

**撤销** 2026-07-09「详情页改造」里刚做的标量四维等值实现。新逻辑：
1. 查当前题的所有 scope（散题查 `question_scope`；挂卷题查其卷的 `exam_paper_scope`）。
2. 对每个 scope 的 (校+研究科+专业+科目)（**year 不限**，跨年才是"同专题历年"），找命中该四维的其它题（同样 UNION 散题/挂卷两路）。
3. UNION 全部候选 + 排除自身 + DISTINCT by code + 按知识点重合数（保留原 overlap 排序思路）降序、再年份降序，LIMIT 6。

因源题多归属，同专题结果集会更丰富（多个 scope 各自的同专题并集）。

### 4.4 详情响应

题详情**不再返回** university/grad/major/subject/year（决策 6：详情不展示归属）。`QuestionResponse` 移除这些字段。`crowdDifficultyRate/crowdVotes/myVote/masteryStatus`（上一个 spec 加的）保留。挂卷题详情如需卷信息，仍可经 `paper_code` 单独取。

### 4.5 `exam_paper` 列表/详情

`ExamPaperMapper.findByScope` 改为 join `exam_paper_scope`（同 4.2 的单分支模式），DISTINCT by paper code。exam-papers/mock-exam 列表按 scope 过滤。

### 4.6 门禁 `locked`（后端算）

- 列表/详情返回每题（或每卷）一个 `locked: boolean`。
- 后端取当前用户（`@CurrentUser`）的目标校集合 + 该题所有 scope，判定：**任一 scope 满足 (校+研究科命中免费目标 且 year>=freeYearFloor) 或 VIP 或 已广告解锁 → `locked=false`**，否则 `true`。
- 免费范围规则（前 3 目标研究科 × 最近 3 年）与 accessPolicy 现有口径一致，逻辑在后端复刻一份（或抽公共常量）。广告解锁状态仍是客户端态，故后端 `locked` 只算 VIP+免费范围两维，**广告解锁由前端在 `locked=true` 时再叠加放行**（保留现有 adStore 逻辑）。
- 未登录：详情端点已强制登录（上一个 spec）；列表公开，未登录按非 VIP + 无目标校算。

> **门禁细节待实现阶段确认**：默认「任一 scope 命中即免费」。若改为「按入口 scope 判」，需列表接口带入口维度参数——本 spec 不采用。

## 5. 前端改造

### 5.1 类型 `KakomonQuestion`

移除 `universityId/graduateSchool/majorId/year`。保留 `id/subject/subjectCode/questionNo/title/knowledgePoints/difficulty*/crowd*/masteryStatus/myVote/contentBlocks/bodyText/paperId` 等。新增 `locked?: boolean`（后端返回）。

### 5.2 各屏

- **topic-questions**：查询入参不变；删除任何前端 `q.universityId===` 本地过滤（后端已 scope 过滤）。卡片不显学校/年份。ad-gate 改用后端 `locked`（`locked` 为真时走 adStore 判断是否已解锁）。
- **topic-study.tsx:197-198**：删除 `q.universityId/q.graduateSchool` 本地过滤（该屏 subject 聚合改由后端列表结果驱动，或按 subjectCode 聚合）。
- **search.tsx**：卡片行 `{q.year}·{q.subject}` 改为只显 `{q.subject} {q.questionNo}`；删本地 `q.universityId/q.year` 过滤（改后端）；门禁 `gate` 相关改用后端 `locked` + adStore（学校/年份文案因无单一归属需调整为通用文案或按当前搜索上下文）。
- **questions/[id].tsx**：去掉 `question.universityId` 取大学的逻辑（详情不展示归属）；门禁用后端 `locked`。
- `recommend.ts`（wrong-book 用）：它按 `knowledgePoints/subject` 推荐，不依赖 university/year，基本不受影响；若引用了删除字段则相应调整。

### 5.3 accessPolicy

`canAccessQuestion` 的「校+年」判定主体下沉后端（`locked`）。前端保留 adStore 广告解锁的叠加判断（`isQuestionUnlocked`/`isSchoolYearUnlocked`）。`accessPolicy` 可简化为「后端 locked && 无广告解锁 → 锁」。**具体保留/删除的函数在实现阶段按调用点定**。

## 6. 影响与撤销

- **撤销 `findSameTopic` 标量实现**（2026-07-09 详情页改造 commit `85ffbc6`/`096257b` 内），改 join scope。
- **推翻 2026-07-08 单归属标量结论**（`major_code/subject_code` 直查主表 → 改查 scope 表）。`major_subject` 字典表（V1_8）不受影响（它是"某专业开哪些科目"的字典，与题归属无关，保留）。
- `question_relation` 表（休眠中）不受影响。

## 7. 验证

- 后端：`cd Kairos-kakomon-server && ./mvnw compile`。SQL/MyBatis 绑定 + 迁移执行 + 门禁 locked 正确性 **DEFERRED 联调**（本环境无 MySQL）。
- 前端：`cd Kairos-kakomon && npm run type-check` + `npm run lint`。
- 待联调人工验证：多归属题在多个专业列表出现、跨校跨年 scope 查询正确、DISTINCT 无重复、同专题并集、门禁 locked（免费/VIP/广告解锁三态）、迁移可重放（建表→回填→删列）。
- 动工前 checklist 追加 `Kairos-kakomon/TASKS.md`。

## 8. 范围外（本次不做）

- `question_relation` 相似度 pipeline / 向量检索。
- 门禁「按入口 scope 判」的精确变体（默认用「任一命中」）。
- 后台录题/归属编辑 UI（scope 目前靠种子/脚本写入）。
- 错题本/弱点地图迁后端。
