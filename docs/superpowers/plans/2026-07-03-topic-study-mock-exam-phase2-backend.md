# 专题学习 & 模拟考试 — Phase 2（后端落库 MySQL + MyBatis）Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 MySQL 建立三层题目/试卷存储（exam_paper → question → content_blocks JSON）+ 知识点/关系表，并用 Spring Boot + MyBatis 暴露只读查询端点，与 Phase 1 前端 mock 的数据形状一一对应。

**Architecture:** 新增 `question` 特性模块（`org.example.kairos.question` 下按 web/service/mapper/entity/model 切分，遵循 `docs/04-backend/backend-conventions.md`）。5 张表：`exam_paper`、`question`、`question_content_block`（或 question.content_blocks JSON 列——本计划用 JSON 列，见 Task 1）、`question_knowledge_point`、`question_relation`。JSON 列（content_blocks / select_rule / instructions）以 String 存 entity，VO 层用 `ObjectMapper` 反序列化，完全复刻 dict 模块 `major.subjects` 的既有做法。端点全部 `@PublicApi` 只读，返回 `Result<T>` 信封。

**Tech Stack:** Spring Boot 4 + MyBatis（Java mapper 接口 + resources/mapper/*.xml lockstep）+ MySQL 8（utf8mb4）+ Redis（已有，本期不新增用途）+ Jackson `ObjectMapper`（JSON 列解析）。构建/验证用 `./mvnw compile`。

## Global Constraints

- 包根 `org.example.kairos`；新模块目录切分严格按 `docs/04-backend/backend-conventions.md`：web / service(+impl) / mapper(+XML) / model(request,response,bo) / entity / common。
- MyBatis：每个 Java mapper 接口必须有同名 `src/main/resources/mapper/<module>/<Name>.xml`，方法名与 `<select|insert|update>` id 一一对应（lockstep）。
- 响应一律 `Result<T>`（`{code,message,data,traceId}`），`code 0` 成功；业务错误抛 `BizException(ResultCode.X)`，由 `GlobalExceptionHandler` 映射 HTTP。
- **错误码范围：题目/试卷域用 `106xx`**（spec §4.2 原写 104xx，但 104xx 已被三方登录、105xx 已被 billing 占用——本计划改用 106xx，见 Task 2）。
- 题目/试卷读接口 `@PublicApi`（无需登录）；付费门禁本期**不进后端**，服务端返回全部元数据，锁由前端 `accessPolicy.ts` 判定（spec §4.2）。
- JSON 列（content_blocks / select_rule / instructions）：entity 用 `String` 字段承载，service/VO 层用注入的 `ObjectMapper` 反序列化，复刻 `DictionaryServiceImpl.parseSubjects` 既有写法。
- 列表接口 VO **不含 content_blocks**（详情接口才返回），首屏瘦身（spec §4.2）。
- SQL 迁移文件放 `docs/05-database/sql/`，命名续接 `V1_4__questions_schema.sql`、`V1_5__seed_questions.sql`；文件头注释风格复刻 `V1_3__billing.sql`；MySQL 8 / utf8mb4 / utf8mb4_0900_ai_ci；`ENGINE=InnoDB`。
- 数据库标识符暴露给前端用 **code / 业务 id 字符串**（如 `p-todai-2024-math`、`q-todai-2024-math-3`），不暴露自增主键——复刻 dict 用 code 的做法。
- 正确性门禁：`./mvnw compile`（主门禁）。无单元测试框架惯例（现有 test 仅 `contextLoads`）——本计划**不引入 TDD 单测**，改用「compile 通过 + 起服务 curl 冒烟」验证。
- 每个 Task 结束跑 `./mvnw compile` 通过后 commit。动工前在 `Kairos-kakomon/TASKS.md` 追加本期 checklist。

---

## File Structure

**SQL（`docs/05-database/sql/`）**
- Create `V1_4__questions_schema.sql` — 5 张表 DDL。
- Create `V1_5__seed_questions.sql` — 东大 2024 数学整卷样例（对应 Phase 1 mock：paper `p-todai-2024-math` + 3 道大问 + 知识点 + 一条 relation）。

**Entity（`entity/`，与既有 entity 平级）**
- Create `ExamPaperEntity.java` / `QuestionEntity.java` / `QuestionKnowledgePointEntity.java` / `QuestionRelationEntity.java`。

**Common enums / codes**
- Modify `common/ResultCode.java` — 新增 106xx 题目域错误码。

**Mapper（`mapper/question/` + `resources/mapper/question/`）**
- Create `ExamPaperMapper.java` + `ExamPaperMapper.xml`
- Create `QuestionMapper.java` + `QuestionMapper.xml`
- Create `QuestionRelationMapper.java` + `QuestionRelationMapper.xml`

**Model（`model/request/question/`、`model/response/question/`）**
- Create `PaperResponse.java`（试卷 + 大问列表）、`PaperListItemResponse.java`、`QuestionResponse.java`（含 contentBlocks）、`QuestionListItemResponse.java`（不含 contentBlocks）、`ContentBlockDto.java`、`RelatedQuestionResponse.java`、`PaperListResponse.java`（分页壳，复刻 `UniversityListResponse`）。

**Service（`service/question/` + `impl/`）**
- Create `QuestionQueryService.java` + `impl/QuestionQueryServiceImpl.java`
- Create `PaperQueryService.java` + `impl/PaperQueryServiceImpl.java`

**Web（`web/question/`）**
- Create `QuestionController.java`、`PaperController.java`

**契约文档**
- Modify `docs/02-architecture/API-contract.md` — 补 `/questions`、`/questions/{id}`、`/questions/{id}/related`、`/papers`、`/papers/{id}` 契约。

> **相似题 relation**：本期只做**读**（`/questions/{id}/related` 查 question_relation join）。边的**写入/离线计算**不在本计划（spec §10 范围外，属未来 pipeline）。seed 里手工插一条 relation 供接口验证。

> **mastery / difficulty-vote 写接口**：Phase 1 前端这些是 mock 且不依赖后端；spec §4.1 列了它们但标注付费/写入本期从简。**移出本计划**（需登录态 + 用户维度表，独立小计划更合适），只做**只读查询**闭环，保证本计划自成可测。

---

### Task 1: 建表 SQL — V1_4__questions_schema.sql

**Files:**
- Create: `docs/05-database/sql/V1_4__questions_schema.sql`

**Interfaces:**
- Consumes: `V1_0__init_schema.sql`（数据库 `kakomon` 已存在）
- Produces: 表 `exam_paper` / `question` / `question_knowledge_point` / `question_relation`（列名见下，供后续 entity/XML 对齐）

- [ ] **Step 1: 写迁移脚本**

创建 `docs/05-database/sql/V1_4__questions_schema.sql`：

```sql
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
```

- [ ] **Step 2: 校验 SQL 语法（不改库，仅解析）**

Run: `cd Kairos-kakomon-server && python3 -c "print('sql present')" && wc -l ../docs/05-database/sql/V1_4__questions_schema.sql`
Expected: 文件行数 > 80。若本机有 MySQL，可选执行 `mysql kakomon < ../docs/05-database/sql/V1_4__questions_schema.sql` 验证；无 MySQL 则跳过（DDL 会在 Phase 2 联调环境执行）。

> **注意**：`WITH PARSER ngram` 需 MySQL 8 内置 ngram 插件（默认可用）。若目标实例禁用，退化为去掉 `FULLTEXT ... WITH PARSER ngram` 一行——关键词检索则回退 LIKE（本期查询默认用 LIKE，见 Task 6，FULLTEXT 为预留）。

- [ ] **Step 3: Commit**

```bash
git add docs/05-database/sql/V1_4__questions_schema.sql
git commit -m "feat(db): add V1_4 questions/paper schema (exam_paper, question, kp, relation)"
```

---

### Task 2: ResultCode 新增题目域错误码（106xx）

**Files:**
- Modify: `Kairos-kakomon-server/src/main/java/org/example/kairos/common/ResultCode.java`

**Interfaces:**
- Consumes: 既有 `ResultCode` 枚举
- Produces: `ResultCode.PAPER_NOT_FOUND`（10601）、`ResultCode.QUESTION_NOT_FOUND`（10602）

- [ ] **Step 1: 新增枚举项**

在 `ResultCode.java` 中 `CHANNEL_INVALID(10504, "支付渠道不支持");` 这一行——把它末尾的 `;` 改为 `,`，然后在其后追加两项并以 `;` 结尾：

```java
    CHANNEL_INVALID(10504, "支付渠道不支持"),

    /** 试卷不存在或已下线 */
    PAPER_NOT_FOUND(10601, "试卷不存在"),
    /** 题目不存在或已下线 */
    QUESTION_NOT_FOUND(10602, "题目不存在");
```

同时在类顶部 Javadoc 的错误码规则列表里,`<li>10500~10599 ...</li>` 之后加一行：

```java
 *   <li>10600~10699 - 题目/试卷相关</li>
```

- [ ] **Step 2: compile**

Run: `cd Kairos-kakomon-server && ./mvnw -q compile`
Expected: BUILD SUCCESS（无输出即成功）

- [ ] **Step 3: Commit**

```bash
git add Kairos-kakomon-server/src/main/java/org/example/kairos/common/ResultCode.java
git commit -m "feat(question): add 106xx result codes (paper/question not found)"
```

---

### Task 3: Entity 类（4 个）

**Files:**
- Create: `Kairos-kakomon-server/src/main/java/org/example/kairos/entity/ExamPaperEntity.java`
- Create: `.../entity/QuestionEntity.java`
- Create: `.../entity/QuestionKnowledgePointEntity.java`
- Create: `.../entity/QuestionRelationEntity.java`

**Interfaces:**
- Consumes: V1_4 表结构（Task 1）
- Produces: 4 个实体类，字段名 camelCase 对应表列（JSON 列用 `String` 承载）。供 mapper resultMap（Task 4/XML）与 service（Task 5/6）使用。字段清单：
  - `ExamPaperEntity`: `Long id; String code; String universityCode; String gradSchoolCode; String majorCode; Integer year; String subject; String title; Integer durationMinutes; Integer totalScore; String selectRule; String instructions; String sourcePdfKey; Integer status; Integer sortOrder; LocalDateTime createdAt; LocalDateTime updatedAt;`
  - `QuestionEntity`: `Long id; String code; String paperCode; String universityCode; String gradSchoolCode; Integer year; String subject; String questionNo; String title; Integer orderIndex; String contentBlocks; String bodyText; String difficultyLabel; String difficultyLevel; java.math.BigDecimal crowdDifficultyRate; String crowdVotes; Integer status; LocalDateTime createdAt; LocalDateTime updatedAt;`
  - `QuestionKnowledgePointEntity`: `Long id; String questionCode; String knowledgePoint;`
  - `QuestionRelationEntity`: `Long id; String fromQuestionCode; String toQuestionCode; Integer level; String matchType; String reason; java.math.BigDecimal confidence; LocalDateTime createdAt;`

- [ ] **Step 1: 写 ExamPaperEntity**

创建 `entity/ExamPaperEntity.java`（复刻 `MajorEntity` 风格：`package org.example.kairos.entity;`，private 字段 + get/set，JSON 列注释说明为 JSON 字符串）：

```java
package org.example.kairos.entity;

import java.time.LocalDateTime;

/** 试卷实体,对应 exam_paper 表。JSON 列(selectRule/instructions)以字符串承载,VO 层反序列化。 */
public class ExamPaperEntity {
    private Long id;
    private String code;
    private String universityCode;
    private String gradSchoolCode;
    private String majorCode;
    private Integer year;
    private String subject;
    private String title;
    private Integer durationMinutes;
    private Integer totalScore;
    /** JSON 字符串, 如 {"total":3,"choose":2} */
    private String selectRule;
    /** JSON 字符串数组, 注意事项 */
    private String instructions;
    private String sourcePdfKey;
    private Integer status;
    private Integer sortOrder;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public String getUniversityCode() { return universityCode; }
    public void setUniversityCode(String universityCode) { this.universityCode = universityCode; }
    public String getGradSchoolCode() { return gradSchoolCode; }
    public void setGradSchoolCode(String gradSchoolCode) { this.gradSchoolCode = gradSchoolCode; }
    public String getMajorCode() { return majorCode; }
    public void setMajorCode(String majorCode) { this.majorCode = majorCode; }
    public Integer getYear() { return year; }
    public void setYear(Integer year) { this.year = year; }
    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public Integer getDurationMinutes() { return durationMinutes; }
    public void setDurationMinutes(Integer durationMinutes) { this.durationMinutes = durationMinutes; }
    public Integer getTotalScore() { return totalScore; }
    public void setTotalScore(Integer totalScore) { this.totalScore = totalScore; }
    public String getSelectRule() { return selectRule; }
    public void setSelectRule(String selectRule) { this.selectRule = selectRule; }
    public String getInstructions() { return instructions; }
    public void setInstructions(String instructions) { this.instructions = instructions; }
    public String getSourcePdfKey() { return sourcePdfKey; }
    public void setSourcePdfKey(String sourcePdfKey) { this.sourcePdfKey = sourcePdfKey; }
    public Integer getStatus() { return status; }
    public void setStatus(Integer status) { this.status = status; }
    public Integer getSortOrder() { return sortOrder; }
    public void setSortOrder(Integer sortOrder) { this.sortOrder = sortOrder; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
```

- [ ] **Step 2: 写 QuestionEntity**

创建 `entity/QuestionEntity.java`：

```java
package org.example.kairos.entity;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/** 大问(第N问)实体,对应 question 表。contentBlocks/crowdVotes 为 JSON 字符串。 */
public class QuestionEntity {
    private Long id;
    private String code;
    private String paperCode;
    private String universityCode;
    private String gradSchoolCode;
    private Integer year;
    private String subject;
    private String questionNo;
    private String title;
    private Integer orderIndex;
    /** JSON 字符串数组, 结构化题干块 */
    private String contentBlocks;
    private String bodyText;
    private String difficultyLabel;
    private String difficultyLevel;
    private BigDecimal crowdDifficultyRate;
    /** JSON 字符串, {easy,medium,hard} */
    private String crowdVotes;
    private Integer status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public String getPaperCode() { return paperCode; }
    public void setPaperCode(String paperCode) { this.paperCode = paperCode; }
    public String getUniversityCode() { return universityCode; }
    public void setUniversityCode(String universityCode) { this.universityCode = universityCode; }
    public String getGradSchoolCode() { return gradSchoolCode; }
    public void setGradSchoolCode(String gradSchoolCode) { this.gradSchoolCode = gradSchoolCode; }
    public Integer getYear() { return year; }
    public void setYear(Integer year) { this.year = year; }
    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }
    public String getQuestionNo() { return questionNo; }
    public void setQuestionNo(String questionNo) { this.questionNo = questionNo; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public Integer getOrderIndex() { return orderIndex; }
    public void setOrderIndex(Integer orderIndex) { this.orderIndex = orderIndex; }
    public String getContentBlocks() { return contentBlocks; }
    public void setContentBlocks(String contentBlocks) { this.contentBlocks = contentBlocks; }
    public String getBodyText() { return bodyText; }
    public void setBodyText(String bodyText) { this.bodyText = bodyText; }
    public String getDifficultyLabel() { return difficultyLabel; }
    public void setDifficultyLabel(String difficultyLabel) { this.difficultyLabel = difficultyLabel; }
    public String getDifficultyLevel() { return difficultyLevel; }
    public void setDifficultyLevel(String difficultyLevel) { this.difficultyLevel = difficultyLevel; }
    public BigDecimal getCrowdDifficultyRate() { return crowdDifficultyRate; }
    public void setCrowdDifficultyRate(BigDecimal crowdDifficultyRate) { this.crowdDifficultyRate = crowdDifficultyRate; }
    public String getCrowdVotes() { return crowdVotes; }
    public void setCrowdVotes(String crowdVotes) { this.crowdVotes = crowdVotes; }
    public Integer getStatus() { return status; }
    public void setStatus(Integer status) { this.status = status; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
```

- [ ] **Step 3: 写 QuestionKnowledgePointEntity 与 QuestionRelationEntity**

创建 `entity/QuestionKnowledgePointEntity.java`：

```java
package org.example.kairos.entity;

/** 大问-知识点关联,对应 question_knowledge_point 表。 */
public class QuestionKnowledgePointEntity {
    private Long id;
    private String questionCode;
    private String knowledgePoint;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getQuestionCode() { return questionCode; }
    public void setQuestionCode(String questionCode) { this.questionCode = questionCode; }
    public String getKnowledgePoint() { return knowledgePoint; }
    public void setKnowledgePoint(String knowledgePoint) { this.knowledgePoint = knowledgePoint; }
}
```

创建 `entity/QuestionRelationEntity.java`：

```java
package org.example.kairos.entity;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/** 相似题关系(有向边),对应 question_relation 表。 */
public class QuestionRelationEntity {
    private Long id;
    private String fromQuestionCode;
    private String toQuestionCode;
    private Integer level;
    private String matchType;
    private String reason;
    private BigDecimal confidence;
    private LocalDateTime createdAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getFromQuestionCode() { return fromQuestionCode; }
    public void setFromQuestionCode(String fromQuestionCode) { this.fromQuestionCode = fromQuestionCode; }
    public String getToQuestionCode() { return toQuestionCode; }
    public void setToQuestionCode(String toQuestionCode) { this.toQuestionCode = toQuestionCode; }
    public Integer getLevel() { return level; }
    public void setLevel(Integer level) { this.level = level; }
    public String getMatchType() { return matchType; }
    public void setMatchType(String matchType) { this.matchType = matchType; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
    public BigDecimal getConfidence() { return confidence; }
    public void setConfidence(BigDecimal confidence) { this.confidence = confidence; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
```

- [ ] **Step 4: compile**

Run: `cd Kairos-kakomon-server && ./mvnw -q compile`
Expected: BUILD SUCCESS

- [ ] **Step 5: Commit**

```bash
git add Kairos-kakomon-server/src/main/java/org/example/kairos/entity/ExamPaperEntity.java Kairos-kakomon-server/src/main/java/org/example/kairos/entity/QuestionEntity.java Kairos-kakomon-server/src/main/java/org/example/kairos/entity/QuestionKnowledgePointEntity.java Kairos-kakomon-server/src/main/java/org/example/kairos/entity/QuestionRelationEntity.java
git commit -m "feat(question): add exam_paper/question/kp/relation entities"
```

---

### Task 4: Mapper 接口 + XML（ExamPaper / Question / QuestionRelation）

**Files:**
- Create: `.../mapper/question/ExamPaperMapper.java` + `src/main/resources/mapper/question/ExamPaperMapper.xml`
- Create: `.../mapper/question/QuestionMapper.java` + `.../resources/mapper/question/QuestionMapper.xml`
- Create: `.../mapper/question/QuestionRelationMapper.java` + `.../resources/mapper/question/QuestionRelationMapper.xml`

**Interfaces:**
- Consumes: 4 个 entity（Task 3）、V1_4 表（Task 1）
- Produces（供 service Task 5/6 调用）：
  - `ExamPaperMapper`: `ExamPaperEntity findByCode(String code)`; `List<ExamPaperEntity> findByScope(String universityCode, String gradSchoolCode)`
  - `QuestionMapper`: `QuestionEntity findByCode(String code)`; `List<QuestionEntity> findByPaperCode(String paperCode)`; `List<QuestionEntity> findByFilter(String universityCode, String gradSchoolCode, Integer year, String subject, String knowledgePoint, String keyword, int offset, int limit)`; `long countByFilter(String universityCode, String gradSchoolCode, Integer year, String subject, String knowledgePoint, String keyword)`; `List<String> findKnowledgePoints(String questionCode)`
  - `QuestionRelationMapper`: `List<QuestionRelationEntity> findFrom(String fromQuestionCode)`

- [ ] **Step 1: 写 ExamPaperMapper 接口**

创建 `mapper/question/ExamPaperMapper.java`：

```java
package org.example.kairos.mapper.question;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.example.kairos.entity.ExamPaperEntity;

import java.util.List;

/** 试卷 Mapper。 */
@Mapper
public interface ExamPaperMapper {
    /** 通过对外 code 查单份试卷 */
    ExamPaperEntity findByCode(@Param("code") String code);

    /** 按大学+研究科查试卷列表(模考首页用) */
    List<ExamPaperEntity> findByScope(@Param("universityCode") String universityCode,
                                      @Param("gradSchoolCode") String gradSchoolCode);
}
```

- [ ] **Step 2: 写 QuestionMapper 接口**

创建 `mapper/question/QuestionMapper.java`：

```java
package org.example.kairos.mapper.question;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.example.kairos.entity.QuestionEntity;

import java.util.List;

/** 大问 Mapper。 */
@Mapper
public interface QuestionMapper {
    /** 通过对外 code 查单个大问(含 content_blocks) */
    QuestionEntity findByCode(@Param("code") String code);

    /** 按试卷 code 查该卷全部大问,按 order_index 升序 */
    List<QuestionEntity> findByPaperCode(@Param("paperCode") String paperCode);

    /** 多条件分页筛选(列表,不取 content_blocks) */
    List<QuestionEntity> findByFilter(@Param("universityCode") String universityCode,
                                      @Param("gradSchoolCode") String gradSchoolCode,
                                      @Param("year") Integer year,
                                      @Param("subject") String subject,
                                      @Param("knowledgePoint") String knowledgePoint,
                                      @Param("keyword") String keyword,
                                      @Param("offset") int offset,
                                      @Param("limit") int limit);

    /** 与 findByFilter 配套计数 */
    long countByFilter(@Param("universityCode") String universityCode,
                       @Param("gradSchoolCode") String gradSchoolCode,
                       @Param("year") Integer year,
                       @Param("subject") String subject,
                       @Param("knowledgePoint") String knowledgePoint,
                       @Param("keyword") String keyword);

    /** 查某大问的知识点标签列表 */
    List<String> findKnowledgePoints(@Param("questionCode") String questionCode);
}
```

- [ ] **Step 3: 写 QuestionRelationMapper 接口**

创建 `mapper/question/QuestionRelationMapper.java`：

```java
package org.example.kairos.mapper.question;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.example.kairos.entity.QuestionRelationEntity;

import java.util.List;

/** 相似题关系 Mapper(只读)。 */
@Mapper
public interface QuestionRelationMapper {
    /** 查某大问的出边(举一反三),按 level 升序 */
    List<QuestionRelationEntity> findFrom(@Param("fromQuestionCode") String fromQuestionCode);
}
```

- [ ] **Step 4: 写 ExamPaperMapper.xml**

创建 `src/main/resources/mapper/question/ExamPaperMapper.xml`（resultMap 列→属性映射复刻 dict 风格；JSON 列 select_rule/instructions 直接按字符串取出）：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
        "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="org.example.kairos.mapper.question.ExamPaperMapper">

    <resultMap id="PaperMap" type="org.example.kairos.entity.ExamPaperEntity">
        <id column="id" property="id"/>
        <result column="code" property="code"/>
        <result column="university_code" property="universityCode"/>
        <result column="grad_school_code" property="gradSchoolCode"/>
        <result column="major_code" property="majorCode"/>
        <result column="year" property="year"/>
        <result column="subject" property="subject"/>
        <result column="title" property="title"/>
        <result column="duration_minutes" property="durationMinutes"/>
        <result column="total_score" property="totalScore"/>
        <result column="select_rule" property="selectRule"/>
        <result column="instructions" property="instructions"/>
        <result column="source_pdf_key" property="sourcePdfKey"/>
        <result column="status" property="status"/>
        <result column="sort_order" property="sortOrder"/>
        <result column="created_at" property="createdAt"/>
        <result column="updated_at" property="updatedAt"/>
    </resultMap>

    <select id="findByCode" resultMap="PaperMap">
        SELECT * FROM exam_paper WHERE code = #{code} AND status = 1
    </select>

    <select id="findByScope" resultMap="PaperMap">
        SELECT * FROM exam_paper
        WHERE status = 1
          AND university_code = #{universityCode}
          AND grad_school_code = #{gradSchoolCode}
        ORDER BY year DESC, sort_order DESC, id ASC
    </select>
</mapper>
```

- [ ] **Step 5: 写 QuestionMapper.xml**

创建 `src/main/resources/mapper/question/QuestionMapper.xml`。注意：`findByFilter` 的 SELECT **不含 content_blocks 列**（列表瘦身），`findByCode`/`findByPaperCode` 含全列。keyword 用 LIKE（FULLTEXT 预留）：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
        "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="org.example.kairos.mapper.question.QuestionMapper">

    <resultMap id="QMap" type="org.example.kairos.entity.QuestionEntity">
        <id column="id" property="id"/>
        <result column="code" property="code"/>
        <result column="paper_code" property="paperCode"/>
        <result column="university_code" property="universityCode"/>
        <result column="grad_school_code" property="gradSchoolCode"/>
        <result column="year" property="year"/>
        <result column="subject" property="subject"/>
        <result column="question_no" property="questionNo"/>
        <result column="title" property="title"/>
        <result column="order_index" property="orderIndex"/>
        <result column="content_blocks" property="contentBlocks"/>
        <result column="body_text" property="bodyText"/>
        <result column="difficulty_label" property="difficultyLabel"/>
        <result column="difficulty_level" property="difficultyLevel"/>
        <result column="crowd_difficulty_rate" property="crowdDifficultyRate"/>
        <result column="crowd_votes" property="crowdVotes"/>
        <result column="status" property="status"/>
        <result column="created_at" property="createdAt"/>
        <result column="updated_at" property="updatedAt"/>
    </resultMap>

    <!-- 列表列集合: 不含 content_blocks / body_text 大字段 -->
    <sql id="listCols">
        id, code, paper_code, university_code, grad_school_code, year, subject,
        question_no, title, order_index, difficulty_label, difficulty_level,
        crowd_difficulty_rate, crowd_votes, status, created_at, updated_at
    </sql>

    <select id="findByCode" resultMap="QMap">
        SELECT * FROM question WHERE code = #{code} AND status = 1
    </select>

    <select id="findByPaperCode" resultMap="QMap">
        SELECT * FROM question
        WHERE paper_code = #{paperCode} AND status = 1
        ORDER BY order_index ASC, id ASC
    </select>

    <sql id="filter">
        <where>
            q.status = 1
            <if test="universityCode != null and universityCode != ''">AND q.university_code = #{universityCode}</if>
            <if test="gradSchoolCode != null and gradSchoolCode != ''">AND q.grad_school_code = #{gradSchoolCode}</if>
            <if test="year != null">AND q.year = #{year}</if>
            <if test="subject != null and subject != ''">AND q.subject = #{subject}</if>
            <if test="keyword != null and keyword != ''">
                AND (q.title LIKE CONCAT('%', #{keyword}, '%') OR q.body_text LIKE CONCAT('%', #{keyword}, '%'))
            </if>
            <if test="knowledgePoint != null and knowledgePoint != ''">
                AND EXISTS (SELECT 1 FROM question_knowledge_point kp
                            WHERE kp.question_code = q.code AND kp.knowledge_point = #{knowledgePoint})
            </if>
        </where>
    </sql>

    <select id="findByFilter" resultMap="QMap">
        SELECT <include refid="listCols"/>
        FROM question q
        <include refid="filter"/>
        ORDER BY q.year DESC, q.order_index ASC, q.id ASC
        LIMIT #{offset}, #{limit}
    </select>

    <select id="countByFilter" resultType="long">
        SELECT COUNT(*) FROM question q
        <include refid="filter"/>
    </select>

    <select id="findKnowledgePoints" resultType="string">
        SELECT knowledge_point FROM question_knowledge_point
        WHERE question_code = #{questionCode} ORDER BY id ASC
    </select>
</mapper>
```

> `listCols` 用了裸列名而 `filter` 用 `q.` 前缀:`findByFilter` 的 FROM 别名为 `q`,但 SELECT 的 listCols 无别名——MySQL 单表无歧义可用。若严格起见可给 listCols 每列加 `q.` 前缀;本计划保持裸列名（单表查询合法）。

- [ ] **Step 6: 写 QuestionRelationMapper.xml**

创建 `src/main/resources/mapper/question/QuestionRelationMapper.xml`：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
        "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="org.example.kairos.mapper.question.QuestionRelationMapper">

    <resultMap id="RelMap" type="org.example.kairos.entity.QuestionRelationEntity">
        <id column="id" property="id"/>
        <result column="from_question_code" property="fromQuestionCode"/>
        <result column="to_question_code" property="toQuestionCode"/>
        <result column="level" property="level"/>
        <result column="match_type" property="matchType"/>
        <result column="reason" property="reason"/>
        <result column="confidence" property="confidence"/>
        <result column="created_at" property="createdAt"/>
    </resultMap>

    <select id="findFrom" resultMap="RelMap">
        SELECT * FROM question_relation
        WHERE from_question_code = #{fromQuestionCode}
        ORDER BY level ASC, confidence DESC, id ASC
    </select>
</mapper>
```

- [ ] **Step 7: compile**

Run: `cd Kairos-kakomon-server && ./mvnw -q compile`
Expected: BUILD SUCCESS（MyBatis 绑定错误在启动时才暴露，compile 只验证 Java；XML 语法错误可选用启动冒烟在 Task 8 兜底）

- [ ] **Step 8: Commit**

```bash
git add Kairos-kakomon-server/src/main/java/org/example/kairos/mapper/question/ Kairos-kakomon-server/src/main/resources/mapper/question/
git commit -m "feat(question): add exam_paper/question/relation mappers + XML"
```

---

### Task 5: Response DTO（对齐前端 Phase 1 类型）

**Files:**
- Create: `.../model/response/question/ContentBlockDto.java`
- Create: `.../model/response/question/QuestionResponse.java`
- Create: `.../model/response/question/QuestionListItemResponse.java`
- Create: `.../model/response/question/RelatedQuestionResponse.java`
- Create: `.../model/response/question/PaperResponse.java`
- Create: `.../model/response/question/PaperListItemResponse.java`
- Create: `.../model/response/question/QuestionListResponse.java`（分页壳）

**Interfaces:**
- Consumes: 无（纯 DTO）
- Produces（供 service Task 6 组装、controller Task 7 返回）：
  - `ContentBlockDto`: `String type; String content; String latex; String url; String caption; List<List<String>> rows;`（宽松承载 4 种块，多余字段序列化时 `@JsonInclude(NON_NULL)` 省略）
  - `QuestionResponse`: `String id; String paperId; String universityId; String graduateSchool; Integer year; String subject; String questionNo; String title; Integer orderIndex; List<ContentBlockDto> contentBlocks; String bodyText; String difficultyLabel; String difficultyLevel; List<String> knowledgePoints;`
  - `QuestionListItemResponse`: 同上去掉 `contentBlocks`、`bodyText`
  - `RelatedQuestionResponse`: `String id; String title; Integer level; String matchType; String reason;`
  - `PaperResponse`: `String id; String universityId; String graduateSchool; String majorId; Integer year; String subject; String title; Integer durationMinutes; Integer totalScore; SelectRule selectRule; List<String> instructions; List<QuestionListItemResponse> questions;`（内部静态类 `SelectRule { int total; int choose; }`）
  - `PaperListItemResponse`: `String id; Integer year; String subject; String title; Integer durationMinutes; SelectRule selectRule; int questionCount;`（复用 `PaperResponse.SelectRule`）
  - `QuestionListResponse`: `List<QuestionListItemResponse> items; long total; int page; int pageSize; boolean hasMore;`（复刻 `UniversityListResponse` 分页壳）

- [ ] **Step 1: 写 ContentBlockDto**

创建 `model/response/question/ContentBlockDto.java`（用 Jackson `@JsonInclude(NON_NULL)`，与 `Result` 同款注解，null 字段不序列化）：

```java
package org.example.kairos.model.response.question;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.List;

/** 结构化题干块,宽松承载 text/math/image/table 四种类型。 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ContentBlockDto {
    private String type;
    private String content;
    private String latex;
    private String url;
    private String caption;
    private List<List<String>> rows;

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public String getLatex() { return latex; }
    public void setLatex(String latex) { this.latex = latex; }
    public String getUrl() { return url; }
    public void setUrl(String url) { this.url = url; }
    public String getCaption() { return caption; }
    public void setCaption(String caption) { this.caption = caption; }
    public List<List<String>> getRows() { return rows; }
    public void setRows(List<List<String>> rows) { this.rows = rows; }
}
```

- [ ] **Step 2: 写 QuestionResponse 与 QuestionListItemResponse**

创建 `model/response/question/QuestionResponse.java`：

```java
package org.example.kairos.model.response.question;

import java.util.List;

/** 大问详情(含结构化题干)。字段名对齐前端 KakomonQuestion。 */
public class QuestionResponse {
    private String id;
    private String paperId;
    private String universityId;
    private String graduateSchool;
    private Integer year;
    private String subject;
    private String questionNo;
    private String title;
    private Integer orderIndex;
    private List<ContentBlockDto> contentBlocks;
    private String bodyText;
    private String difficultyLabel;
    private String difficultyLevel;
    private List<String> knowledgePoints;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getPaperId() { return paperId; }
    public void setPaperId(String paperId) { this.paperId = paperId; }
    public String getUniversityId() { return universityId; }
    public void setUniversityId(String universityId) { this.universityId = universityId; }
    public String getGraduateSchool() { return graduateSchool; }
    public void setGraduateSchool(String graduateSchool) { this.graduateSchool = graduateSchool; }
    public Integer getYear() { return year; }
    public void setYear(Integer year) { this.year = year; }
    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }
    public String getQuestionNo() { return questionNo; }
    public void setQuestionNo(String questionNo) { this.questionNo = questionNo; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public Integer getOrderIndex() { return orderIndex; }
    public void setOrderIndex(Integer orderIndex) { this.orderIndex = orderIndex; }
    public List<ContentBlockDto> getContentBlocks() { return contentBlocks; }
    public void setContentBlocks(List<ContentBlockDto> contentBlocks) { this.contentBlocks = contentBlocks; }
    public String getBodyText() { return bodyText; }
    public void setBodyText(String bodyText) { this.bodyText = bodyText; }
    public String getDifficultyLabel() { return difficultyLabel; }
    public void setDifficultyLabel(String difficultyLabel) { this.difficultyLabel = difficultyLabel; }
    public String getDifficultyLevel() { return difficultyLevel; }
    public void setDifficultyLevel(String difficultyLevel) { this.difficultyLevel = difficultyLevel; }
    public List<String> getKnowledgePoints() { return knowledgePoints; }
    public void setKnowledgePoints(List<String> knowledgePoints) { this.knowledgePoints = knowledgePoints; }
}
```

创建 `model/response/question/QuestionListItemResponse.java`：

```java
package org.example.kairos.model.response.question;

import java.util.List;

/** 大问列表项(不含 content_blocks,首屏瘦身)。 */
public class QuestionListItemResponse {
    private String id;
    private String paperId;
    private String universityId;
    private String graduateSchool;
    private Integer year;
    private String subject;
    private String questionNo;
    private String title;
    private Integer orderIndex;
    private String difficultyLabel;
    private String difficultyLevel;
    private List<String> knowledgePoints;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getPaperId() { return paperId; }
    public void setPaperId(String paperId) { this.paperId = paperId; }
    public String getUniversityId() { return universityId; }
    public void setUniversityId(String universityId) { this.universityId = universityId; }
    public String getGraduateSchool() { return graduateSchool; }
    public void setGraduateSchool(String graduateSchool) { this.graduateSchool = graduateSchool; }
    public Integer getYear() { return year; }
    public void setYear(Integer year) { this.year = year; }
    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }
    public String getQuestionNo() { return questionNo; }
    public void setQuestionNo(String questionNo) { this.questionNo = questionNo; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public Integer getOrderIndex() { return orderIndex; }
    public void setOrderIndex(Integer orderIndex) { this.orderIndex = orderIndex; }
    public String getDifficultyLabel() { return difficultyLabel; }
    public void setDifficultyLabel(String difficultyLabel) { this.difficultyLabel = difficultyLabel; }
    public String getDifficultyLevel() { return difficultyLevel; }
    public void setDifficultyLevel(String difficultyLevel) { this.difficultyLevel = difficultyLevel; }
    public List<String> getKnowledgePoints() { return knowledgePoints; }
    public void setKnowledgePoints(List<String> knowledgePoints) { this.knowledgePoints = knowledgePoints; }
}
```

- [ ] **Step 3: 写 RelatedQuestionResponse、PaperResponse、PaperListItemResponse、QuestionListResponse**

创建 `model/response/question/RelatedQuestionResponse.java`：

```java
package org.example.kairos.model.response.question;

/** 举一反三关系项。 */
public class RelatedQuestionResponse {
    private String id;
    private String title;
    private Integer level;
    private String matchType;
    private String reason;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public Integer getLevel() { return level; }
    public void setLevel(Integer level) { this.level = level; }
    public String getMatchType() { return matchType; }
    public void setMatchType(String matchType) { this.matchType = matchType; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
}
```

创建 `model/response/question/PaperResponse.java`（含内部静态类 `SelectRule`）：

```java
package org.example.kairos.model.response.question;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.List;

/** 试卷详情(含大问列表)。 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class PaperResponse {
    private String id;
    private String universityId;
    private String graduateSchool;
    private String majorId;
    private Integer year;
    private String subject;
    private String title;
    private Integer durationMinutes;
    private Integer totalScore;
    private SelectRule selectRule;
    private List<String> instructions;
    private List<QuestionListItemResponse> questions;

    /** 选做规则,如 3 题选 2。 */
    public static class SelectRule {
        private int total;
        private int choose;
        public int getTotal() { return total; }
        public void setTotal(int total) { this.total = total; }
        public int getChoose() { return choose; }
        public void setChoose(int choose) { this.choose = choose; }
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getUniversityId() { return universityId; }
    public void setUniversityId(String universityId) { this.universityId = universityId; }
    public String getGraduateSchool() { return graduateSchool; }
    public void setGraduateSchool(String graduateSchool) { this.graduateSchool = graduateSchool; }
    public String getMajorId() { return majorId; }
    public void setMajorId(String majorId) { this.majorId = majorId; }
    public Integer getYear() { return year; }
    public void setYear(Integer year) { this.year = year; }
    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public Integer getDurationMinutes() { return durationMinutes; }
    public void setDurationMinutes(Integer durationMinutes) { this.durationMinutes = durationMinutes; }
    public Integer getTotalScore() { return totalScore; }
    public void setTotalScore(Integer totalScore) { this.totalScore = totalScore; }
    public SelectRule getSelectRule() { return selectRule; }
    public void setSelectRule(SelectRule selectRule) { this.selectRule = selectRule; }
    public List<String> getInstructions() { return instructions; }
    public void setInstructions(List<String> instructions) { this.instructions = instructions; }
    public List<QuestionListItemResponse> getQuestions() { return questions; }
    public void setQuestions(List<QuestionListItemResponse> questions) { this.questions = questions; }
}
```

创建 `model/response/question/PaperListItemResponse.java`：

```java
package org.example.kairos.model.response.question;

import com.fasterxml.jackson.annotation.JsonInclude;

/** 试卷列表项(模考首页年份卡)。 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class PaperListItemResponse {
    private String id;
    private Integer year;
    private String subject;
    private String title;
    private Integer durationMinutes;
    private PaperResponse.SelectRule selectRule;
    private int questionCount;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public Integer getYear() { return year; }
    public void setYear(Integer year) { this.year = year; }
    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public Integer getDurationMinutes() { return durationMinutes; }
    public void setDurationMinutes(Integer durationMinutes) { this.durationMinutes = durationMinutes; }
    public PaperResponse.SelectRule getSelectRule() { return selectRule; }
    public void setSelectRule(PaperResponse.SelectRule selectRule) { this.selectRule = selectRule; }
    public int getQuestionCount() { return questionCount; }
    public void setQuestionCount(int questionCount) { this.questionCount = questionCount; }
}
```

创建 `model/response/question/QuestionListResponse.java`：

```java
package org.example.kairos.model.response.question;

import java.util.List;

/** 大问分页列表壳(复刻 UniversityListResponse)。 */
public class QuestionListResponse {
    private List<QuestionListItemResponse> items;
    private long total;
    private int page;
    private int pageSize;
    private boolean hasMore;

    public List<QuestionListItemResponse> getItems() { return items; }
    public void setItems(List<QuestionListItemResponse> items) { this.items = items; }
    public long getTotal() { return total; }
    public void setTotal(long total) { this.total = total; }
    public int getPage() { return page; }
    public void setPage(int page) { this.page = page; }
    public int getPageSize() { return pageSize; }
    public void setPageSize(int pageSize) { this.pageSize = pageSize; }
    public boolean isHasMore() { return hasMore; }
    public void setHasMore(boolean hasMore) { this.hasMore = hasMore; }
}
```

- [ ] **Step 4: compile**

Run: `cd Kairos-kakomon-server && ./mvnw -q compile`
Expected: BUILD SUCCESS

- [ ] **Step 5: Commit**

```bash
git add Kairos-kakomon-server/src/main/java/org/example/kairos/model/response/question/
git commit -m "feat(question): add response DTOs aligned with frontend types"
```

---

### Task 6: Service（QuestionQueryService + PaperQueryService）

**Files:**
- Create: `.../service/question/QuestionQueryService.java` + `impl/QuestionQueryServiceImpl.java`
- Create: `.../service/question/PaperQueryService.java` + `impl/PaperQueryServiceImpl.java`

**Interfaces:**
- Consumes: mappers（Task 4）、entities（Task 3）、DTOs（Task 5）、`ObjectMapper`（注入，解析 JSON 列）、`BizException` + `ResultCode`（Task 2）
- Produces（供 controller Task 7 调用）：
  - `QuestionQueryService`: `QuestionListResponse list(String universityId, String graduateSchool, Integer year, String subject, String knowledgePoint, String keyword, int page, int pageSize)`; `QuestionResponse getByCode(String code)`; `List<RelatedQuestionResponse> getRelated(String code)`
  - `PaperQueryService`: `List<PaperListItemResponse> listByScope(String universityId, String graduateSchool)`; `PaperResponse getByCode(String code)`

- [ ] **Step 1: 写 QuestionQueryService 接口**

创建 `service/question/QuestionQueryService.java`：

```java
package org.example.kairos.service.question;

import org.example.kairos.model.response.question.QuestionListResponse;
import org.example.kairos.model.response.question.QuestionResponse;
import org.example.kairos.model.response.question.RelatedQuestionResponse;

import java.util.List;

/** 大问查询服务(只读)。 */
public interface QuestionQueryService {
    QuestionListResponse list(String universityId, String graduateSchool, Integer year,
                              String subject, String knowledgePoint, String keyword,
                              int page, int pageSize);

    QuestionResponse getByCode(String code);

    List<RelatedQuestionResponse> getRelated(String code);
}
```

- [ ] **Step 2: 写 QuestionQueryServiceImpl**

创建 `service/question/impl/QuestionQueryServiceImpl.java`（JSON 解析复刻 `DictionaryServiceImpl.parseSubjects`；分页夹取复刻 `listUniversities`）：

```java
package org.example.kairos.service.question.impl;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.example.kairos.common.ResultCode;
import org.example.kairos.common.exception.BizException;
import org.example.kairos.entity.QuestionEntity;
import org.example.kairos.entity.QuestionRelationEntity;
import org.example.kairos.mapper.question.QuestionMapper;
import org.example.kairos.mapper.question.QuestionRelationMapper;
import org.example.kairos.model.response.question.ContentBlockDto;
import org.example.kairos.model.response.question.QuestionListItemResponse;
import org.example.kairos.model.response.question.QuestionListResponse;
import org.example.kairos.model.response.question.QuestionResponse;
import org.example.kairos.model.response.question.RelatedQuestionResponse;
import org.example.kairos.service.question.QuestionQueryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * 大问查询实现。JSON 列(content_blocks)通过 ObjectMapper 反序列化,失败降级为空列表。
 */
@Service
public class QuestionQueryServiceImpl implements QuestionQueryService {

    @Autowired private QuestionMapper questionMapper;
    @Autowired private QuestionRelationMapper relationMapper;
    @Autowired private ObjectMapper objectMapper;

    @Override
    public QuestionListResponse list(String universityId, String graduateSchool, Integer year,
                                     String subject, String knowledgePoint, String keyword,
                                     int page, int pageSize) {
        int p = Math.max(1, page);
        int ps = pageSize <= 0 ? 20 : Math.min(pageSize, 100);
        int offset = (p - 1) * ps;
        long total = questionMapper.countByFilter(universityId, graduateSchool, year, subject, knowledgePoint, keyword);
        List<QuestionEntity> rows = questionMapper.findByFilter(universityId, graduateSchool, year, subject, knowledgePoint, keyword, offset, ps);
        List<QuestionListItemResponse> items = new ArrayList<>();
        for (QuestionEntity q : rows) items.add(toListItem(q));
        QuestionListResponse resp = new QuestionListResponse();
        resp.setItems(items);
        resp.setTotal(total);
        resp.setPage(p);
        resp.setPageSize(ps);
        resp.setHasMore((long) offset + items.size() < total);
        return resp;
    }

    @Override
    public QuestionResponse getByCode(String code) {
        QuestionEntity q = questionMapper.findByCode(code);
        if (q == null) throw new BizException(ResultCode.QUESTION_NOT_FOUND);
        QuestionResponse r = new QuestionResponse();
        r.setId(q.getCode());
        r.setPaperId(q.getPaperCode());
        r.setUniversityId(q.getUniversityCode());
        r.setGraduateSchool(q.getGradSchoolCode());
        r.setYear(q.getYear());
        r.setSubject(q.getSubject());
        r.setQuestionNo(q.getQuestionNo());
        r.setTitle(q.getTitle());
        r.setOrderIndex(q.getOrderIndex());
        r.setContentBlocks(parseBlocks(q.getContentBlocks()));
        r.setBodyText(q.getBodyText());
        r.setDifficultyLabel(q.getDifficultyLabel());
        r.setDifficultyLevel(q.getDifficultyLevel());
        r.setKnowledgePoints(questionMapper.findKnowledgePoints(code));
        return r;
    }

    @Override
    public List<RelatedQuestionResponse> getRelated(String code) {
        // 源题不存在也直接返回空列表(前端容错),不抛异常
        List<QuestionRelationEntity> edges = relationMapper.findFrom(code);
        List<RelatedQuestionResponse> out = new ArrayList<>();
        for (QuestionRelationEntity e : edges) {
            QuestionEntity target = questionMapper.findByCode(e.getToQuestionCode());
            if (target == null) continue;
            RelatedQuestionResponse r = new RelatedQuestionResponse();
            r.setId(target.getCode());
            r.setTitle(target.getTitle());
            r.setLevel(e.getLevel());
            r.setMatchType(e.getMatchType());
            r.setReason(e.getReason());
            out.add(r);
        }
        return out;
    }

    private QuestionListItemResponse toListItem(QuestionEntity q) {
        QuestionListItemResponse r = new QuestionListItemResponse();
        r.setId(q.getCode());
        r.setPaperId(q.getPaperCode());
        r.setUniversityId(q.getUniversityCode());
        r.setGraduateSchool(q.getGradSchoolCode());
        r.setYear(q.getYear());
        r.setSubject(q.getSubject());
        r.setQuestionNo(q.getQuestionNo());
        r.setTitle(q.getTitle());
        r.setOrderIndex(q.getOrderIndex());
        r.setDifficultyLabel(q.getDifficultyLabel());
        r.setDifficultyLevel(q.getDifficultyLevel());
        r.setKnowledgePoints(questionMapper.findKnowledgePoints(q.getCode()));
        return r;
    }

    private List<ContentBlockDto> parseBlocks(String json) {
        if (json == null || json.isBlank()) return Collections.emptyList();
        try {
            return objectMapper.readValue(json, new TypeReference<List<ContentBlockDto>>() {});
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }
}
```

- [ ] **Step 3: 写 PaperQueryService 接口**

创建 `service/question/PaperQueryService.java`：

```java
package org.example.kairos.service.question;

import org.example.kairos.model.response.question.PaperListItemResponse;
import org.example.kairos.model.response.question.PaperResponse;

import java.util.List;

/** 试卷查询服务(只读)。 */
public interface PaperQueryService {
    List<PaperListItemResponse> listByScope(String universityId, String graduateSchool);

    PaperResponse getByCode(String code);
}
```

- [ ] **Step 4: 写 PaperQueryServiceImpl**

创建 `service/question/impl/PaperQueryServiceImpl.java`（selectRule / instructions JSON 解析同款；试卷详情内嵌大问列表项，questionCount 取该卷大问数）：

```java
package org.example.kairos.service.question.impl;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.example.kairos.common.ResultCode;
import org.example.kairos.common.exception.BizException;
import org.example.kairos.entity.ExamPaperEntity;
import org.example.kairos.entity.QuestionEntity;
import org.example.kairos.mapper.question.ExamPaperMapper;
import org.example.kairos.mapper.question.QuestionMapper;
import org.example.kairos.model.response.question.PaperListItemResponse;
import org.example.kairos.model.response.question.PaperResponse;
import org.example.kairos.model.response.question.QuestionListItemResponse;
import org.example.kairos.service.question.PaperQueryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/** 试卷查询实现。 */
@Service
public class PaperQueryServiceImpl implements PaperQueryService {

    @Autowired private ExamPaperMapper paperMapper;
    @Autowired private QuestionMapper questionMapper;
    @Autowired private ObjectMapper objectMapper;

    @Override
    public List<PaperListItemResponse> listByScope(String universityId, String graduateSchool) {
        List<ExamPaperEntity> papers = paperMapper.findByScope(universityId, graduateSchool);
        List<PaperListItemResponse> out = new ArrayList<>();
        for (ExamPaperEntity p : papers) {
            PaperListItemResponse r = new PaperListItemResponse();
            r.setId(p.getCode());
            r.setYear(p.getYear());
            r.setSubject(p.getSubject());
            r.setTitle(p.getTitle());
            r.setDurationMinutes(p.getDurationMinutes());
            r.setSelectRule(parseSelectRule(p.getSelectRule()));
            r.setQuestionCount(questionMapper.findByPaperCode(p.getCode()).size());
            out.add(r);
        }
        return out;
    }

    @Override
    public PaperResponse getByCode(String code) {
        ExamPaperEntity p = paperMapper.findByCode(code);
        if (p == null) throw new BizException(ResultCode.PAPER_NOT_FOUND);
        PaperResponse r = new PaperResponse();
        r.setId(p.getCode());
        r.setUniversityId(p.getUniversityCode());
        r.setGraduateSchool(p.getGradSchoolCode());
        r.setMajorId(p.getMajorCode());
        r.setYear(p.getYear());
        r.setSubject(p.getSubject());
        r.setTitle(p.getTitle());
        r.setDurationMinutes(p.getDurationMinutes());
        r.setTotalScore(p.getTotalScore());
        r.setSelectRule(parseSelectRule(p.getSelectRule()));
        r.setInstructions(parseInstructions(p.getInstructions()));
        List<QuestionListItemResponse> qs = new ArrayList<>();
        for (QuestionEntity q : questionMapper.findByPaperCode(code)) {
            QuestionListItemResponse qi = new QuestionListItemResponse();
            qi.setId(q.getCode());
            qi.setPaperId(q.getPaperCode());
            qi.setUniversityId(q.getUniversityCode());
            qi.setGraduateSchool(q.getGradSchoolCode());
            qi.setYear(q.getYear());
            qi.setSubject(q.getSubject());
            qi.setQuestionNo(q.getQuestionNo());
            qi.setTitle(q.getTitle());
            qi.setOrderIndex(q.getOrderIndex());
            qi.setDifficultyLabel(q.getDifficultyLabel());
            qi.setDifficultyLevel(q.getDifficultyLevel());
            qi.setKnowledgePoints(questionMapper.findKnowledgePoints(q.getCode()));
            qs.add(qi);
        }
        r.setQuestions(qs);
        return r;
    }

    private PaperResponse.SelectRule parseSelectRule(String json) {
        if (json == null || json.isBlank()) return null;
        try {
            return objectMapper.readValue(json, PaperResponse.SelectRule.class);
        } catch (Exception e) {
            return null;
        }
    }

    private List<String> parseInstructions(String json) {
        if (json == null || json.isBlank()) return Collections.emptyList();
        try {
            return objectMapper.readValue(json, new TypeReference<List<String>>() {});
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }
}
```

- [ ] **Step 5: compile**

Run: `cd Kairos-kakomon-server && ./mvnw -q compile`
Expected: BUILD SUCCESS

- [ ] **Step 6: Commit**

```bash
git add Kairos-kakomon-server/src/main/java/org/example/kairos/service/question/
git commit -m "feat(question): add QuestionQueryService and PaperQueryService"
```

---

### Task 7: Controller（QuestionController + PaperController）

**Files:**
- Create: `.../web/question/QuestionController.java`
- Create: `.../web/question/PaperController.java`

**Interfaces:**
- Consumes: services（Task 6）、`Result`、`@PublicApi`
- Produces: HTTP 端点（全部 `@PublicApi` 只读）：
  - `GET /api/questions`（query: universityId, graduateSchool, year, subject, knowledgePoint, keyword, page, pageSize）→ `Result<QuestionListResponse>`
  - `GET /api/questions/{code}` → `Result<QuestionResponse>`
  - `GET /api/questions/{code}/related` → `Result<List<RelatedQuestionResponse>>`
  - `GET /api/papers`（query: universityId, graduateSchool）→ `Result<List<PaperListItemResponse>>`
  - `GET /api/papers/{code}` → `Result<PaperResponse>`

- [ ] **Step 1: 写 QuestionController**

创建 `web/question/QuestionController.java`（复刻 `UniversityDictController` 的 `@RestController`+`@RequestMapping`+`@PublicApi`+`@RequestParam` 写法）：

```java
package org.example.kairos.web.question;

import org.example.kairos.common.Result;
import org.example.kairos.gateway.annotation.PublicApi;
import org.example.kairos.model.response.question.QuestionListResponse;
import org.example.kairos.model.response.question.QuestionResponse;
import org.example.kairos.model.response.question.RelatedQuestionResponse;
import org.example.kairos.service.question.QuestionQueryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** 题目查询接口,全部公开只读。付费门禁由前端 accessPolicy 判定。 */
@RestController
@RequestMapping("/api")
@PublicApi
public class QuestionController {

    @Autowired private QuestionQueryService questionQueryService;

    /** 多条件分页筛选大问(列表不含 content_blocks)。 */
    @GetMapping("/questions")
    public Result<QuestionListResponse> list(
            @RequestParam(required = false) String universityId,
            @RequestParam(required = false) String graduateSchool,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) String subject,
            @RequestParam(required = false) String knowledgePoint,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int pageSize) {
        return Result.ok(questionQueryService.list(universityId, graduateSchool, year, subject,
                knowledgePoint, keyword, page, pageSize));
    }

    /** 单个大问详情(含 content_blocks)。 */
    @GetMapping("/questions/{code}")
    public Result<QuestionResponse> detail(@PathVariable String code) {
        return Result.ok(questionQueryService.getByCode(code));
    }

    /** 举一反三。 */
    @GetMapping("/questions/{code}/related")
    public Result<List<RelatedQuestionResponse>> related(@PathVariable String code) {
        return Result.ok(questionQueryService.getRelated(code));
    }
}
```

- [ ] **Step 2: 写 PaperController**

创建 `web/question/PaperController.java`：

```java
package org.example.kairos.web.question;

import org.example.kairos.common.Result;
import org.example.kairos.gateway.annotation.PublicApi;
import org.example.kairos.model.response.question.PaperListItemResponse;
import org.example.kairos.model.response.question.PaperResponse;
import org.example.kairos.service.question.PaperQueryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** 试卷查询接口,全部公开只读(模考首页/整卷)。 */
@RestController
@RequestMapping("/api")
@PublicApi
public class PaperController {

    @Autowired private PaperQueryService paperQueryService;

    /** 按大学+研究科查试卷列表(模考年份卡)。 */
    @GetMapping("/papers")
    public Result<List<PaperListItemResponse>> list(
            @RequestParam String universityId,
            @RequestParam String graduateSchool) {
        return Result.ok(paperQueryService.listByScope(universityId, graduateSchool));
    }

    /** 单份试卷(含大问列表 + 选做规则 + 时长)。 */
    @GetMapping("/papers/{code}")
    public Result<PaperResponse> detail(@PathVariable String code) {
        return Result.ok(paperQueryService.getByCode(code));
    }
}
```

- [ ] **Step 3: compile**

Run: `cd Kairos-kakomon-server && ./mvnw -q compile`
Expected: BUILD SUCCESS

- [ ] **Step 4: Commit**

```bash
git add Kairos-kakomon-server/src/main/java/org/example/kairos/web/question/
git commit -m "feat(question): add QuestionController and PaperController (read-only, public)"
```

---

### Task 8: Seed SQL + 起服务冒烟验证

**Files:**
- Create: `docs/05-database/sql/V1_5__seed_questions.sql`

**Interfaces:**
- Consumes: V1_4 表（Task 1）、全部 Java（Task 2-7）
- Produces: 可查询的样例数据（paper `p-todai-2024-math` + 3 大问 + 知识点 + 1 relation）

- [ ] **Step 1: 写 seed 脚本**

创建 `docs/05-database/sql/V1_5__seed_questions.sql`（对应 Phase 1 `KAKOMON_PAPERS` 与 3 道 todai 2024 数学题；JSON 用合法字面量）：

```sql
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
  (`code`, `university_code`, `grad_school_code`, `major_code`, `year`, `subject`, `title`,
   `duration_minutes`, `total_score`, `select_rule`, `instructions`, `status`, `sort_order`)
VALUES
  ('p-todai-2024-math', 'todai', '情报理工学系研究科', NULL, 2024, '数学',
   '2024年度 大学院入学試験問題 数学', 150, NULL,
   '{"total":3,"choose":2}',
   '["試験開始の合図があるまで問題冊子を開かないこと。","解答は日本語または英語で記述すること。"]',
   1, 100);

INSERT INTO `question`
  (`code`, `paper_code`, `university_code`, `grad_school_code`, `year`, `subject`,
   `question_no`, `title`, `order_index`, `content_blocks`, `body_text`,
   `difficulty_label`, `difficulty_level`, `crowd_difficulty_rate`, `status`)
VALUES
  ('q-todai-2024-math-1', 'p-todai-2024-math', 'todai', '情报理工学系研究科', 2024, '数学',
   '第1问', '定积分与常微分方程', 1, NULL,
   '（1）以下の定積分を求めよ。（2）微分方程式の一般解と特異解を求めよ。',
   '中等', 'medium', 0.500, 1),
  ('q-todai-2024-math-2', 'p-todai-2024-math', 'todai', '情报理工学系研究科', 2024, '数学',
   '第2问', '3 次正方行列的固有值与幂', 2, NULL,
   '3 次正方行列 A について、固有値をすべて求め、Aⁿ を求めよ。',
   '中等偏难', 'hard', 0.600, 1),
  ('q-todai-2024-math-3', 'p-todai-2024-math', 'todai', '情报理工学系研究科', 2024, '数学',
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
```

> **JSON 转义提醒**：`content_blocks` 里 LaTeX 的反斜杠——在 SQL 单引号字符串中，`\\\\` 写入库里是 `\\`（两字符），MySQL JSON 读出给 Java、Jackson 反序列化后 `latex` 字段得到 `\`（单反斜杠），正好是 KaTeX 需要的。执行后用 Step 3 的 curl 校验实际渲染值。

- [ ] **Step 2: 起服务（需要本地 MySQL + Redis + 已执行 V1_0~V1_5）**

前置：本地 MySQL 已建 `kakomon` 库并依次执行 `V1_0`→`V1_5`；Redis 运行中；`application-local.yml` 配好。
Run（后台起服务）：`cd Kairos-kakomon-server && ./mvnw -q spring-boot:run -Dspring-boot.run.profiles=local`
Expected: 日志出现 `Started KairosKakomonServerApplication`。

> 若本机无 MySQL/Redis，无法起服务：**明确记录“未联调验证”**，跳到 Step 4 只做 compile 门禁，把 curl 冒烟留到联调环境。不得假称通过。

- [ ] **Step 3: curl 冒烟（服务起来后）**

分别验证 5 个端点：

```bash
BASE=http://127.0.0.1:8080/api
curl -s "$BASE/papers?universityId=todai&graduateSchool=情报理工学系研究科" | head -c 400; echo
curl -s "$BASE/papers/p-todai-2024-math" | head -c 600; echo
curl -s "$BASE/questions?universityId=todai&subject=数学&year=2024" | head -c 400; echo
curl -s "$BASE/questions/q-todai-2024-math-3" | head -c 800; echo
curl -s "$BASE/questions/q-todai-2024-math-3/related" | head -c 400; echo
```

Expected（逐条）：
- `/papers` → `code:0`，data 数组含 `p-todai-2024-math`，`questionCount:3`，`selectRule:{total:3,choose:2}`。
- `/papers/{code}` → `code:0`，`durationMinutes:150`，`instructions` 2 条，`questions` 3 项且不含 contentBlocks。
- `/questions?...` → `code:0`，`items` 含 3 题，无 `contentBlocks` 字段，`total:3`。
- `/questions/{code}` → `code:0`，`contentBlocks` 数组 3 块，`math` 块 `latex` 为**单反斜杠** `A v_1 = 2 v_1,\quad ...`（不是 `\\quad`），`knowledgePoints:["线性代数","固有值"]`。
- `/related` → `code:0`，data 含 `q-todai-2024-math-2`，`level:2`，`matchType:"same_point"`。

停服务：`Ctrl-C`（或 `pkill -f spring-boot:run`）。

- [ ] **Step 4: compile 门禁 + Commit**

Run: `cd Kairos-kakomon-server && ./mvnw -q compile`
Expected: BUILD SUCCESS

```bash
git add docs/05-database/sql/V1_5__seed_questions.sql
git commit -m "feat(db): add V1_5 seed data (todai 2024 math paper + questions)"
```

---

### Task 9: 补齐 API 契约 + TASKS.md 收尾

**Files:**
- Modify: `docs/02-architecture/API-contract.md`（在 `2.9 GET /questions/recommendations` 章节附近追加新端点契约）
- Modify: `Kairos-kakomon/TASKS.md`

**Interfaces:**
- Consumes: Task 7 端点定义
- Produces: 无（文档）

- [ ] **Step 1: 追加 5 个端点的契约**

在 `docs/02-architecture/API-contract.md` 的 `### 2.9 GET /questions/recommendations（推荐题目）` 小节**之后**追加：

````markdown
### 2.10 GET /papers（试卷列表 · 模考首页）

Query: `universityId`（必填）, `graduateSchool`（必填）

```json
{
  "code": 0, "message": "ok",
  "data": [
    { "id": "p-todai-2024-math", "year": 2024, "subject": "数学",
      "title": "2024年度 大学院入学試験問題 数学",
      "durationMinutes": 150, "selectRule": { "total": 3, "choose": 2 },
      "questionCount": 3 }
  ]
}
```

### 2.11 GET /papers/{code}（单份试卷）

```json
{
  "code": 0, "message": "ok",
  "data": {
    "id": "p-todai-2024-math", "universityId": "todai",
    "graduateSchool": "情报理工学系研究科", "year": 2024, "subject": "数学",
    "durationMinutes": 150, "selectRule": { "total": 3, "choose": 2 },
    "instructions": ["…"],
    "questions": [ { "id": "q-todai-2024-math-1", "questionNo": "第1问", "title": "…", "orderIndex": 1 } ]
  }
}
```

### 2.12 GET /questions（大问筛选 · 分页）

Query: `universityId?`, `graduateSchool?`, `year?`, `subject?`, `knowledgePoint?`, `keyword?`, `page=1`, `pageSize=20`。列表项**不含** `contentBlocks`。

```json
{
  "code": 0, "message": "ok",
  "data": { "items": [ { "id": "q-todai-2024-math-3", "title": "…", "questionNo": "第3问",
                         "knowledgePoints": ["线性代数","固有值"] } ],
            "total": 3, "page": 1, "pageSize": 20, "hasMore": false }
}
```

### 2.13 GET /questions/{code}（大问详情 · 含 contentBlocks）

```json
{
  "code": 0, "message": "ok",
  "data": {
    "id": "q-todai-2024-math-3", "paperId": "p-todai-2024-math",
    "universityId": "todai", "graduateSchool": "情报理工学系研究科",
    "year": 2024, "subject": "数学", "questionNo": "第3问", "title": "…",
    "contentBlocks": [ { "type": "text", "content": "…" },
                       { "type": "math", "latex": "A v_1 = 2 v_1" } ],
    "knowledgePoints": ["线性代数","固有值"]
  }
}
```

### 2.14 GET /questions/{code}/related（举一反三）

```json
{
  "code": 0, "message": "ok",
  "data": [ { "id": "q-todai-2024-math-2", "title": "…", "level": 2,
              "matchType": "same_point", "reason": "同为固有值考点" } ]
}
```

> 错误码：试卷/题目不存在 → `10601` / `10602`。以上读接口均公开（`@PublicApi`），付费门禁由前端判定。
````

- [ ] **Step 2: TASKS.md 追加完成记录**

在 `Kairos-kakomon/TASKS.md` 末尾追加（不改写既有行）：

```markdown
### 2026-07-03 任务：专题学习/模考 Phase 2（后端落库 MySQL + MyBatis）
- [x] V1_4 建表(exam_paper/question/kp/relation) + V1_5 东大2024数学样例
  ✅ 完成于 2026-07-03
- [x] question 模块 entity/mapper(XML lockstep)/service/controller,5 个只读端点
  ✅ 完成于 2026-07-03
- [x] 补齐 API-contract.md /papers /questions 契约;ResultCode 106xx
  ✅ 完成于 2026-07-03
- [x] 门禁 ./mvnw compile 通过
  ✅ 完成于 2026-07-03,curl 冒烟需在有 MySQL+Redis 的联调环境执行
- [ ] Phase 3：前端 questions.ts/papers.ts 由 mock 切 apiRequest(另立计划)
```

- [ ] **Step 3: Commit**

```bash
git add docs/02-architecture/API-contract.md Kairos-kakomon/TASKS.md
git commit -m "docs(api): add papers/questions contract; mark Phase 2 backend done"
```

---

## Self-Review

**Spec coverage（对照 spec §3 数据模型 / §4 后端 / §7 Phase 2）：**
- §3 五表模型(exam_paper/question/kp/relation + content_blocks JSON 列) → Task 1 ✅（content_blocks 用 JSON 列而非独立表，符合“三层”决策）
- §3.1 content_blocks 结构 / §3.2 检索(结构化列索引 + LIKE，FULLTEXT 预留) → Task 1 索引 + Task 4 XML ✅
- §4 question 模块目录切分 → Task 3-7 ✅
- §4.1 端点 /questions /questions/{id} /related /papers /papers/{id} → Task 7 ✅（mastery/vote 写接口显式移出，见 File Structure 注释）
- §4.2 Result 信封 / 106xx 错误码 / @PublicApi / 列表不含 content_blocks / JSON 列 String+ObjectMapper → Task 2/4/5/6/7 ✅
- §4 契约对齐 → Task 9 ✅
- §7 Phase 2 SQL 迁移 + 模块 + 端点 + compile 门禁 → 全覆盖 ✅
- 相似题写入/向量 → 明确范围外（spec §10）；只读 relation 已覆盖 ✅

**Placeholder scan:** 无 TBD/TODO；每个 Java/SQL/XML 步骤均给完整代码 + 确切路径。未联调场景（无 MySQL）给了明确的“记录未验证、不假称通过”指令，非占位。

**Type consistency:** entity 字段（Task 3）↔ XML resultMap 列（Task 4）↔ mapper 方法签名（Task 4 接口）↔ service 调用（Task 6）↔ DTO（Task 5）↔ controller（Task 7）逐一对齐。关键：mapper 方法名 `findByCode/findByScope/findByPaperCode/findByFilter/countByFilter/findKnowledgePoints/findFrom` 在接口(Task4)与 XML(Task4) 与 service(Task6) 三处一致；DTO `PaperResponse.SelectRule` 被 `PaperListItemResponse`(Task5) 与两个 service(Task6) 共用；对外 id 一律用 entity 的 `code` 字段填充 DTO 的 `id`（Task 6 各 `setId(x.getCode())`）。前端契约字段名(id/paperId/universityId/graduateSchool/contentBlocks/selectRule/questionCount)对齐 Phase 1 类型。
