# 题目/试卷多归属（M:N）模型 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 `question`/`exam_paper` 的归属从主表五列标量改为 M:N 关系表（`question_scope`/`exam_paper_scope`，每行五元组 校+研究科+专业+科目+year），支持一题/一卷属于多组；门禁 `locked` 下沉后端；前端不再展示/依赖单一归属。

**Architecture:** 主表删五列 → 建两张 scope 表并回填 → 所有筛选查询改 join scope（散题查 `question_scope`，挂卷题继承卷的 `exam_paper_scope`，UNION+DISTINCT）→ 后端按用户目标校+VIP 计算每题 `locked` → 前端类型瘦身、去本地过滤与归属展示、门禁改读 `locked`。

**Tech Stack:** 后端 Spring Boot 4 + MyBatis + MySQL 8；前端 Expo/RN + TypeScript + TanStack Query v5 + Zustand。

## Global Constraints

- 后端包根 `org.example.kairos`，按 feature 模块切分；MyBatis Java mapper 与 `resources/mapper/<module>/*.xml` 必须同步。
- 响应统一 `Result<T>`（code 0 成功）；业务错误抛 `BizException(ResultCode)`。
- 登录态：`@PublicApi` 放行否则强制登录；`@CurrentUser UserSession s`（`s.getUserId():Long`）；可选读当前用户用 `UserContextHolder.get()`（返回 null 表示未登录）。
- JSON 用 `tools.jackson.databind.ObjectMapper`（Jackson 3，不抛受检异常）。
- 归属五元组：`university_code VARCHAR(40)`、`grad_school_code VARCHAR(80)`、`major_code VARCHAR(80)`、`subject_code VARCHAR(40)`、`year SMALLINT`，全 NOT NULL。`question_scope` 关联 `question.code`（仅 `paper_code IS NULL` 的散题），`exam_paper_scope` 关联 `exam_paper.code`。
- 免费范围口径（与前端 accessPolicy 一致）：非 VIP 取 priority 前 `3` 个目标研究科 × 最近 `3` 年（`当前年-2 ~ 当前年`）；VIP 全解锁。`locked` 计算只算 VIP+免费范围两维，广告解锁仍由前端叠加。判定口径「任一 scope 命中即免费」。
- 当前年在后端用 `java.time.Year.now().getValue()`（app 代码可用，非 workflow 脚本）。
- 迁移脚本版本 `V2_0`（破坏性大版本），放 `docs/05-database/sql/`。
- 门禁：`cd Kairos-kakomon-server && ./mvnw compile`（后端）；`cd Kairos-kakomon && npm run type-check` + `npm run lint`（前端）。无 test runner、无 MySQL、无模拟器 → 用「编译/类型门禁 + 静态契约核对」替代运行期测试；SQL 执行/迁移/门禁 locked 运行期验证 DEFERRED 联调。
- 动工前把 checklist 追加到 `Kairos-kakomon/TASKS.md`。

**契约冻结**（前后端对齐）：
- `GET /api/questions`（列表，公开）：每 item 移除 `universityId/graduateSchool/majorId/year`；新增 `locked: boolean`。入参不变（`universityId/graduateSchool/majorId/subjectCode/...`）。
- `GET /api/questions/{code}`（详情，需登录）：移除 `universityId/graduateSchool/majorId/year`；保留 `subject/subjectCode/questionNo/title/contentBlocks/bodyText/knowledgePoints/crowd*/myVote/masteryStatus`；新增 `locked: boolean`。
- `GET /api/questions/{code}/related`：不变（`{id,title,universityId,universityName,year,subject,subjectCode,questionNo,knowledgePoints}`）——保留 universityName/year 作展示（同专题卡片需要），数据来自 scope 主条。
- `GET /api/papers`（列表）、`GET /api/papers/{code}`（详情）：paper 侧移除单一归属，改由 scope 驱动筛选；paper 列表/详情响应字段调整见 Task 9。

---

## Task 1: V2_0 迁移 — 建 scope 表 + 回填 + 删主表五列

**Files:**
- Create: `docs/05-database/sql/V2_0__question_multi_attribution.sql`

**Interfaces:**
- Produces: 表 `question_scope`、`exam_paper_scope`（五元组 + sort_order，`uk`/`idx` 见下）；`question`/`exam_paper` 主表移除五列与旧索引。

- [ ] **Step 1: 写迁移脚本**

Create `docs/05-database/sql/V2_0__question_multi_attribution.sql`:

```sql
-- =============================================================
-- Kairos-kakomon 迁移脚本 V2.0 — 题目/试卷多归属(M:N)
-- 对应设计: docs/superpowers/specs/2026-07-09-question-multi-attribution-design.md
-- 破坏性: question/exam_paper 删 5 列, 归属迁入 scope 表
-- 执行环境: MySQL 8.x, utf8mb4
-- =============================================================
USE `kakomon`;
SET NAMES utf8mb4;

DROP TABLE IF EXISTS `question_scope`;
DROP TABLE IF EXISTS `exam_paper_scope`;

-- 散题归属(仅 paper_code IS NULL 的题)
CREATE TABLE `question_scope` (
    `id`               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
    `question_code`    VARCHAR(80)  NOT NULL COMMENT '散题 code, 关联 question.code',
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

-- 试卷归属
CREATE TABLE `exam_paper_scope` (
    `id`               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
    `paper_code`       VARCHAR(80)  NOT NULL COMMENT '试卷 code, 关联 exam_paper.code',
    `university_code`  VARCHAR(40)  NOT NULL,
    `grad_school_code` VARCHAR(80)  NOT NULL,
    `major_code`       VARCHAR(80)  NOT NULL,
    `subject_code`     VARCHAR(40)  NOT NULL,
    `year`             SMALLINT     NOT NULL,
    `sort_order`       INT          NOT NULL DEFAULT 0,
    `created_at`       DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_p_scope` (`paper_code`,`university_code`,`grad_school_code`,`major_code`,`subject_code`,`year`),
    KEY `idx_pscope_filter` (`university_code`,`grad_school_code`,`major_code`,`subject_code`,`year`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='试卷归属(M:N, 五元组)';

-- 回填: 现有每散题/每卷正好一条归属
INSERT INTO `question_scope`
  (`question_code`,`university_code`,`grad_school_code`,`major_code`,`subject_code`,`year`,`sort_order`)
SELECT `code`,`university_code`,`grad_school_code`,`major_code`,`subject_code`,`year`,0
FROM `question` WHERE `paper_code` IS NULL;

INSERT INTO `exam_paper_scope`
  (`paper_code`,`university_code`,`grad_school_code`,`major_code`,`subject_code`,`year`,`sort_order`)
SELECT `code`,`university_code`,`grad_school_code`,`major_code`,`subject_code`,`year`,0
FROM `exam_paper`;

-- 删主表五列 + 旧索引
ALTER TABLE `question`
    DROP KEY `idx_q_filter`,
    DROP COLUMN `university_code`,
    DROP COLUMN `grad_school_code`,
    DROP COLUMN `major_code`,
    DROP COLUMN `year`,
    DROP COLUMN `subject_code`;

ALTER TABLE `exam_paper`
    DROP KEY `idx_paper_scope`,
    DROP KEY `idx_paper_filter`,
    DROP COLUMN `university_code`,
    DROP COLUMN `grad_school_code`,
    DROP COLUMN `major_code`,
    DROP COLUMN `year`,
    DROP COLUMN `subject_code`;
```

- [ ] **Step 2: 结构自检**

Run: `grep -c "CREATE TABLE" docs/05-database/sql/V2_0__question_multi_attribution.sql`
Expected: `2`
Run: `grep -cE "DROP COLUMN" docs/05-database/sql/V2_0__question_multi_attribution.sql`
Expected: `10`

- [ ] **Step 3: Commit**

```bash
git add docs/05-database/sql/V2_0__question_multi_attribution.sql
git commit -m "feat(db): V2_0 题目/试卷多归属 scope 表 + 回填 + 删主表五列"
```

---

## Task 2: 种子改造 — 主表去五列 + 写 scope 行（含多归属样例）

**Files:**
- Modify: `docs/05-database/sql/V1_5__seed_questions.sql`

**Interfaces:**
- Consumes: Task 1 的 scope 表。
- Produces: 可重放种子：`question`/`exam_paper` 插入不含五列；`question_scope`/`exam_paper_scope` 各插归属行；至少一散题带 2 条 scope（跨校 + 跨专业各一例）。

- [ ] **Step 1: 读现状**

Run: `cat docs/05-database/sql/V1_5__seed_questions.sql`
确认现有 INSERT 的列清单与 3 道 `q-todai-2024-math-*` + 1 张 `p-todai-2024-math`。

- [ ] **Step 2: 改 exam_paper 插入去五列**

把 `INSERT INTO exam_paper (...)` 的列清单移除 `university_code, grad_school_code, major_code, year, subject_code`，VALUES 同步删对应值；紧随其后加：

```sql
INSERT INTO `exam_paper_scope` (`paper_code`,`university_code`,`grad_school_code`,`major_code`,`subject_code`,`year`,`sort_order`) VALUES
  ('p-todai-2024-math','todai','info-sci','cs','math',2024,0);
```

- [ ] **Step 3: 改 question 插入去五列 + 写 scope（含多归属样例）**

把 `INSERT INTO question (...)` 列清单移除五列（保留 `code,paper_code,question_no,title,order_index,content_blocks,body_text,difficulty_label,difficulty_level,crowd_difficulty_rate,status`），VALUES 同步删值。这三道题 `paper_code` 现为 `'p-todai-2024-math'`（挂卷题）——**挂卷题继承卷 scope，不写 question_scope**。

为演示散题多归属，**新增一道散题**（`paper_code=NULL`）+ 2 条 scope：

```sql
-- 演示散题(不挂卷)多归属: 同题既属东大 info-sci/cs/math/2024, 又属京大 informatics/kyoto-cs/math/2022
INSERT INTO `question`
  (`code`,`paper_code`,`question_no`,`title`,`order_index`,`content_blocks`,`body_text`,
   `difficulty_label`,`difficulty_level`,`crowd_difficulty_rate`,`status`)
VALUES
  ('q-shared-eigen-1', NULL, '第1问', '固有值分解(跨校共享样例)', 1, NULL,
   '実対称行列 A の固有値をすべて求め、対角化せよ。', '中等', 'medium', 0.500, 1);

INSERT INTO `question_knowledge_point` (`question_code`,`knowledge_point`) VALUES
  ('q-shared-eigen-1','线性代数'), ('q-shared-eigen-1','固有值');

INSERT INTO `question_scope`
  (`question_code`,`university_code`,`grad_school_code`,`major_code`,`subject_code`,`year`,`sort_order`) VALUES
  ('q-shared-eigen-1','todai','info-sci','cs','math',2024,0),
  ('q-shared-eigen-1','kyodai','informatics','kyoto-cs','math',2022,1);
```

> 若 `kyodai`/`informatics`/`kyoto-cs` 在字典种子(V1_1)中不存在，则用一个 V1_1 里已存在的 (university,grad,major) 组合替代——先 `grep -nE "kyodai|informatics|kyoto" docs/05-database/sql/V1_1__seed_dictionary.sql`，无则改用第二个存在的组合（保证跨校/跨专业语义即可）。同理确认 `todai/info-sci/cs` 存在。

- [ ] **Step 4: 清理块的 DELETE 补充**

在脚本顶部已有的 `DELETE FROM question WHERE code LIKE 'q-todai-2024-math-%'` 附近，补 `DELETE FROM question WHERE code = 'q-shared-eigen-1';` 与 `DELETE FROM question_scope WHERE question_code = 'q-shared-eigen-1';` 及 `DELETE FROM exam_paper_scope WHERE paper_code LIKE 'p-todai-2024-math%';`（保证可重放）。

- [ ] **Step 5: 结构自检**

Run: `grep -cE "INSERT INTO .question_scope|INSERT INTO .exam_paper_scope" docs/05-database/sql/V1_5__seed_questions.sql`
Expected: `>= 2`
Run: `grep -nE "university_code|grad_school_code|major_code|\byear\b|subject_code" docs/05-database/sql/V1_5__seed_questions.sql | grep -iE "INSERT INTO .question\b|INSERT INTO .exam_paper\b" || echo "主表 INSERT 已无五列"`

- [ ] **Step 6: Commit**

```bash
git add docs/05-database/sql/V1_5__seed_questions.sql
git commit -m "feat(db): V1_5 种子改多归属(主表去五列+写 scope, 加跨校散题样例)"
```

---

## Task 3: 后端 entity/DTO/resultMap 去五列 + 列集调整

**Files:**
- Modify: `Kairos-kakomon-server/src/main/java/org/example/kairos/entity/QuestionEntity.java`
- Modify: `Kairos-kakomon-server/src/main/java/org/example/kairos/entity/ExamPaperEntity.java`
- Modify: `Kairos-kakomon-server/src/main/resources/mapper/question/QuestionMapper.xml`
- Modify: `Kairos-kakomon-server/src/main/resources/mapper/question/ExamPaperMapper.xml`
- Create: `Kairos-kakomon-server/src/main/java/org/example/kairos/entity/QuestionScopeEntity.java`
- Create: `Kairos-kakomon-server/src/main/java/org/example/kairos/entity/ExamPaperScopeEntity.java`

**Interfaces:**
- Produces: `QuestionEntity`/`ExamPaperEntity` 去掉 `universityCode/gradSchoolCode/majorCode/year/subjectCode` 字段与 getter/setter；两 scope entity；resultMap/listCols 去五列。这是本任务与 Task 4/5 的同一编译单元的第一半——**编译在 Task 5 末尾统一过**。

- [ ] **Step 1: QuestionEntity 去五列**

删 `QuestionEntity.java` 中 `universityCode/gradSchoolCode/majorCode/year/subjectCode` 五个字段及其 getter/setter。保留其余（`id/code/paperCode/questionNo/title/orderIndex/contentBlocks/bodyText/difficulty*/crowd*/status/createdAt/updatedAt`）。

- [ ] **Step 2: ExamPaperEntity 去五列**

删 `ExamPaperEntity.java` 中同五个字段及 getter/setter。保留 `id/code/title/durationMinutes/totalScore/selectRule/instructions/sourcePdfKey/status/sortOrder/createdAt/updatedAt`。

- [ ] **Step 3: 新建 QuestionScopeEntity**

Create `entity/QuestionScopeEntity.java`:

```java
package org.example.kairos.entity;

import java.time.LocalDateTime;

/** 散题归属, 对应 question_scope 表(五元组)。 */
public class QuestionScopeEntity {
    private Long id;
    private String questionCode;
    private String universityCode;
    private String gradSchoolCode;
    private String majorCode;
    private String subjectCode;
    private Integer year;
    private Integer sortOrder;
    private LocalDateTime createdAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getQuestionCode() { return questionCode; }
    public void setQuestionCode(String questionCode) { this.questionCode = questionCode; }
    public String getUniversityCode() { return universityCode; }
    public void setUniversityCode(String universityCode) { this.universityCode = universityCode; }
    public String getGradSchoolCode() { return gradSchoolCode; }
    public void setGradSchoolCode(String gradSchoolCode) { this.gradSchoolCode = gradSchoolCode; }
    public String getMajorCode() { return majorCode; }
    public void setMajorCode(String majorCode) { this.majorCode = majorCode; }
    public String getSubjectCode() { return subjectCode; }
    public void setSubjectCode(String subjectCode) { this.subjectCode = subjectCode; }
    public Integer getYear() { return year; }
    public void setYear(Integer year) { this.year = year; }
    public Integer getSortOrder() { return sortOrder; }
    public void setSortOrder(Integer sortOrder) { this.sortOrder = sortOrder; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
```

- [ ] **Step 4: 新建 ExamPaperScopeEntity**

同 Step 3，类名 `ExamPaperScopeEntity`，字段 `questionCode` 换成 `paperCode`（getter/setter 同步）。

- [ ] **Step 5: QuestionMapper.xml 去五列**

- `QMap` resultMap 删 `university_code/grad_school_code/major_code/year/subject_code` 五个 `<result>`。
- `listCols` 改为：`id, code, paper_code, question_no, title, order_index, difficulty_label, difficulty_level, crowd_difficulty_rate, crowd_votes, status, created_at, updated_at`
- `listColsQ` 改为同上但每列带 `q.` 前缀。
- `findByFilter`/`countByFilter`/`filter`/`findSameTopic` 这几个查询本任务先不动（Task 5 重写），但因 `filter` 片段引用了 `q.university_code` 等已删列，**Task 5 会整体替换**，故本任务结束时后端尚不能编译/启动——**在 Task 5 末尾统一编译**。

- [ ] **Step 6: ExamPaperMapper.xml 去五列（resultMap）**

`PaperMap` resultMap 删五个 `<result>`。`findByScope` 查询 Task 5 重写。

- [ ] **Step 7: 进入 Task 4（不单独编译）**

---

## Task 4: scope mapper（question_scope / exam_paper_scope）

**Files:**
- Create: `Kairos-kakomon-server/src/main/java/org/example/kairos/mapper/question/QuestionScopeMapper.java`
- Create: `Kairos-kakomon-server/src/main/resources/mapper/question/QuestionScopeMapper.xml`
- Create: `Kairos-kakomon-server/src/main/java/org/example/kairos/mapper/question/ExamPaperScopeMapper.java`
- Create: `Kairos-kakomon-server/src/main/resources/mapper/question/ExamPaperScopeMapper.xml`

**Interfaces:**
- Produces:
  - `QuestionScopeMapper.findByQuestionCode(code):List<QuestionScopeEntity>`（散题的所有 scope，按 sort_order）
  - `ExamPaperScopeMapper.findByPaperCode(code):List<ExamPaperScopeEntity>`
- 供 Task 5（列表/同专题/门禁）与 Task 6（locked）使用。

- [ ] **Step 1: QuestionScopeMapper 接口**

Create `mapper/question/QuestionScopeMapper.java`:

```java
package org.example.kairos.mapper.question;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.example.kairos.entity.QuestionScopeEntity;

import java.util.List;

/** 散题归属 Mapper(只读)。 */
@Mapper
public interface QuestionScopeMapper {
    /** 查某散题的所有归属, 按 sort_order 升序 */
    List<QuestionScopeEntity> findByQuestionCode(@Param("questionCode") String questionCode);
}
```

- [ ] **Step 2: QuestionScopeMapper.xml**

Create `resources/mapper/question/QuestionScopeMapper.xml`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
        "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="org.example.kairos.mapper.question.QuestionScopeMapper">
    <resultMap id="QSMap" type="org.example.kairos.entity.QuestionScopeEntity">
        <id column="id" property="id"/>
        <result column="question_code" property="questionCode"/>
        <result column="university_code" property="universityCode"/>
        <result column="grad_school_code" property="gradSchoolCode"/>
        <result column="major_code" property="majorCode"/>
        <result column="subject_code" property="subjectCode"/>
        <result column="year" property="year"/>
        <result column="sort_order" property="sortOrder"/>
        <result column="created_at" property="createdAt"/>
    </resultMap>

    <select id="findByQuestionCode" resultMap="QSMap">
        SELECT * FROM question_scope WHERE question_code = #{questionCode}
        ORDER BY sort_order ASC, id ASC
    </select>
</mapper>
```

- [ ] **Step 3: ExamPaperScopeMapper 接口 + XML**

同 Step 1-2，类名 `ExamPaperScopeMapper`、方法 `findByPaperCode(@Param("paperCode") String)`，XML resultMap `PSMap`（`paper_code` 属性 `paperCode`），`SELECT * FROM exam_paper_scope WHERE paper_code = #{paperCode} ORDER BY sort_order ASC, id ASC`。

- [ ] **Step 4: 进入 Task 5（不单独编译）**

---

## Task 5: 重写筛选查询（findByFilter/countByFilter/findSameTopic + exam_paper findByScope）走 join scope

**Files:**
- Modify: `Kairos-kakomon-server/src/main/resources/mapper/question/QuestionMapper.xml`
- Modify: `Kairos-kakomon-server/src/main/java/org/example/kairos/mapper/question/QuestionMapper.java`
- Modify: `Kairos-kakomon-server/src/main/resources/mapper/question/ExamPaperMapper.xml`

**Interfaces:**
- Consumes: scope 表（Task 1）、listColsQ（Task 3）。
- Produces:
  - `findByFilter`/`countByFilter`：UNION 散题(question_scope) + 挂卷题(exam_paper_scope)，DISTINCT by code。
  - `findSameTopic(code, limit)`：签名简化为只收 `code`+`limit`（内部按源题所有 scope 的四维 join）。
  - `ExamPaperMapper.findByScope`：join exam_paper_scope。

- [ ] **Step 1: 重写 QuestionMapper.xml 的 filter/findByFilter/countByFilter**

替换 `filter`（53-69）、`findByFilter`（71-77）、`countByFilter`（79-82）为按 scope 的 UNION 子查询。用一个 `scopeFilter` 片段封装五维 `<if>`，两分支各 join 一次：

```xml
    <!-- 命中给定维度的 question code 集合(散题查 question_scope, 挂卷题查所属卷 exam_paper_scope) -->
    <sql id="scopedCodes">
        SELECT q.code AS code
        FROM question q
        JOIN question_scope s ON s.question_code = q.code
        WHERE q.status = 1 AND q.paper_code IS NULL
          <if test="universityCode != null and universityCode != ''">AND s.university_code = #{universityCode}</if>
          <if test="gradSchoolCode != null and gradSchoolCode != ''">AND s.grad_school_code = #{gradSchoolCode}</if>
          <if test="majorCode != null and majorCode != ''">AND s.major_code = #{majorCode}</if>
          <if test="subjectCode != null and subjectCode != ''">AND s.subject_code = #{subjectCode}</if>
          <if test="year != null">AND s.year = #{year}</if>
        UNION
        SELECT q.code AS code
        FROM question q
        JOIN exam_paper p ON q.paper_code = p.code
        JOIN exam_paper_scope ps ON ps.paper_code = p.code
        WHERE q.status = 1
          <if test="universityCode != null and universityCode != ''">AND ps.university_code = #{universityCode}</if>
          <if test="gradSchoolCode != null and gradSchoolCode != ''">AND ps.grad_school_code = #{gradSchoolCode}</if>
          <if test="majorCode != null and majorCode != ''">AND ps.major_code = #{majorCode}</if>
          <if test="subjectCode != null and subjectCode != ''">AND ps.subject_code = #{subjectCode}</if>
          <if test="year != null">AND ps.year = #{year}</if>
    </sql>

    <!-- 附加过滤(keyword / knowledgePoint), 作用在最终 question 行上 -->
    <sql id="postFilter">
        <if test="keyword != null and keyword != ''">
            AND (q.title LIKE CONCAT('%', #{keyword}, '%') OR q.body_text LIKE CONCAT('%', #{keyword}, '%'))
        </if>
        <if test="knowledgePoint != null and knowledgePoint != ''">
            AND EXISTS (SELECT 1 FROM question_knowledge_point kp
                        WHERE kp.question_code = q.code AND kp.knowledge_point = #{knowledgePoint})
        </if>
    </sql>

    <select id="findByFilter" resultMap="QMap">
        SELECT <include refid="listColsQ"/>
        FROM question q
        JOIN ( <include refid="scopedCodes"/> ) sc ON sc.code = q.code
        WHERE 1=1
        <include refid="postFilter"/>
        ORDER BY q.order_index ASC, q.id ASC
        LIMIT #{offset}, #{limit}
    </select>

    <select id="countByFilter" resultType="long">
        SELECT COUNT(*)
        FROM question q
        JOIN ( <include refid="scopedCodes"/> ) sc ON sc.code = q.code
        WHERE 1=1
        <include refid="postFilter"/>
    </select>
```

> `scopedCodes` 内部 UNION 天然去重（两分支间及分支内），join 回 `question q` 后每 code 一行。`listColsQ` 已无五列。排序去掉 `q.year`（列已删），改按 `order_index, id`。

- [ ] **Step 2: 重写 findSameTopic（改按源题 scope 的四维）**

`QuestionMapper.java` 把 `findSameTopic` 签名改为：

```java
    /** 同专题(与源题任一 scope 的 校+研究科+专业+科目 相同, year 不限, 排除自身), 知识点重合降序 */
    List<QuestionEntity> findSameTopic(@Param("code") String code, @Param("limit") int limit);
```

`QuestionMapper.xml` 替换 `findSameTopic`（95-112）：

```xml
    <!-- 源题的所有 (校,研究科,专业,科目) 维度: 散题取 question_scope, 挂卷题取所属卷 scope -->
    <sql id="srcScopeKeys">
        SELECT s.university_code AS u, s.grad_school_code AS g, s.major_code AS m, s.subject_code AS sub
        FROM question_scope s WHERE s.question_code = #{code}
        UNION
        SELECT ps.university_code, ps.grad_school_code, ps.major_code, ps.subject_code
        FROM question q JOIN exam_paper_scope ps ON ps.paper_code = q.paper_code
        WHERE q.code = #{code}
    </sql>

    <select id="findSameTopic" resultMap="QMap">
        SELECT <include refid="listColsQ"/>, COUNT(kp.knowledge_point) AS overlap
        FROM question q
        JOIN (
            -- 命中源题任一维度的候选 code(散题分支)
            SELECT DISTINCT s.question_code AS code
            FROM question_scope s
            JOIN ( <include refid="srcScopeKeys"/> ) k
              ON k.u = s.university_code AND k.g = s.grad_school_code
             AND k.m = s.major_code AND k.sub = s.subject_code
            UNION
            -- 挂卷题分支
            SELECT DISTINCT q2.code
            FROM question q2
            JOIN exam_paper_scope ps ON ps.paper_code = q2.paper_code
            JOIN ( <include refid="srcScopeKeys"/> ) k2
              ON k2.u = ps.university_code AND k2.g = ps.grad_school_code
             AND k2.m = ps.major_code AND k2.sub = ps.subject_code
        ) cand ON cand.code = q.code
        LEFT JOIN question_knowledge_point kp
               ON kp.question_code = q.code
              AND kp.knowledge_point IN (
                  SELECT knowledge_point FROM question_knowledge_point WHERE question_code = #{code})
        WHERE q.status = 1 AND q.code != #{code}
        GROUP BY q.id
        ORDER BY overlap DESC, q.order_index ASC
        LIMIT #{limit}
    </select>
```

> `srcScopeKeys` 引用两次（MyBatis `<include>` 可重复展开，`#{code}` 参数一致）。排序去掉 `q.year`。

- [ ] **Step 3: 重写 ExamPaperMapper.xml findByScope（join exam_paper_scope）**

替换 `findByScope`（30-39）：

```xml
    <select id="findByScope" resultMap="PaperMap">
        SELECT p.* FROM exam_paper p
        JOIN exam_paper_scope ps ON ps.paper_code = p.code
        WHERE p.status = 1
          AND ps.university_code = #{universityCode}
          AND ps.grad_school_code = #{gradSchoolCode}
          <if test="majorCode != null and majorCode != ''">AND ps.major_code = #{majorCode}</if>
        GROUP BY p.id
        ORDER BY ps.year DESC, ps.subject_code ASC, p.sort_order DESC, p.id ASC
    </select>
```

> `GROUP BY p.id` 去重（一卷多 scope）。`p.*` 现无五列。排序用 `ps.year/ps.subject_code`（scope 列）。

- [ ] **Step 4: 编译（Task 3+4+5 统一门禁）**

Run: `cd Kairos-kakomon-server && ./mvnw compile 2>&1 | tail -5`
Expected: BUILD SUCCESS。若报 `QuestionQueryServiceImpl`/`PaperQueryServiceImpl` 引用已删 entity getter（`getUniversityCode` 等）——那是 Task 6 要改的 service，**本任务预期它们仍报错**；故 Task 5 与 Task 6 合并为一个编译单元：**不在此单独判 SUCCESS，直接进 Task 6，在 Task 6 末尾统一编译**。

- [ ] **Step 5: 进入 Task 6**

---

## Task 6: service 层改造（list/detail/getRelated 去五列 + locked 计算）+ Controller

**Files:**
- Modify: `Kairos-kakomon-server/src/main/java/org/example/kairos/service/question/impl/QuestionQueryServiceImpl.java`
- Modify: `Kairos-kakomon-server/src/main/java/org/example/kairos/service/question/QuestionQueryService.java`
- Modify: `Kairos-kakomon-server/src/main/java/org/example/kairos/service/question/impl/PaperQueryServiceImpl.java`
- Modify: `Kairos-kakomon-server/src/main/java/org/example/kairos/model/response/question/QuestionListItemResponse.java`
- Modify: `Kairos-kakomon-server/src/main/java/org/example/kairos/model/response/question/QuestionResponse.java`
- Modify: paper 响应 DTO（`PaperListItemResponse`/`PaperResponse` + 其内嵌 question item）
- Create: `Kairos-kakomon-server/src/main/java/org/example/kairos/service/question/AccessGate.java`（locked 计算，组件）

**Interfaces:**
- Consumes: `QuestionScopeMapper`/`ExamPaperScopeMapper`（Task 4）、`UserTargetSchoolMapper.findByUserId`、`UserProfileMapper.findByUserId`、`UserContextHolder`。
- Produces: 列表/详情响应去五列 + 带 `locked`；`findSameTopic` 新签名调用；`AccessGate.isLocked(userId, scopes)`。

- [ ] **Step 1: DTO 去五列 + 加 locked**

- `QuestionListItemResponse.java`：删 `universityId/graduateSchool/majorId/year` 字段与 getter/setter（**保留 `subject/subjectCode`**——列表卡片仍显示科目）；加 `private Boolean locked;` + getter/setter。
- `QuestionResponse.java`：删 `universityId/graduateSchool/majorId/year` 字段与 getter/setter（保留 `subject/subjectCode`）；加 `private Boolean locked;` + getter/setter。
- paper DTO（先 `grep -rn "class PaperListItemResponse\|class PaperResponse" src/main/java`）：其内嵌的 question item 与 paper 本身若含 `universityId/year` 等，按需保留（paper 详情仍需展示年份/科目——从 scope 主条取，见 Step 4）。**paper 侧最小改动**：只保证编译通过 + 用 scope 主条填年份/科目。

- [ ] **Step 2: 新建 AccessGate 组件（locked 计算）**

Create `service/question/AccessGate.java`:

```java
package org.example.kairos.service.question;

import org.example.kairos.entity.UserProfileEntity;
import org.example.kairos.entity.UserTargetSchoolEntity;
import org.example.kairos.mapper.user.UserProfileMapper;
import org.example.kairos.mapper.user.UserTargetSchoolMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.time.Year;
import java.util.Comparator;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/** 付费门禁: 按用户目标校+VIP 判定题目是否锁定。广告解锁由前端叠加。 */
@Component
public class AccessGate {
    private static final int FREE_TARGET_LIMIT = 3;
    private static final int FREE_YEAR_SPAN = 3;

    @Autowired private UserTargetSchoolMapper targetSchoolMapper;
    @Autowired private UserProfileMapper userProfileMapper;

    /** 一个归属维度(校+研究科+年) */
    public record ScopeKey(String universityCode, String gradSchoolCode, int year) {}

    /**
     * 任一 scope 命中免费范围 → false(不锁)。userId 为 null(未登录) → 按非 VIP 无目标校算。
     */
    public boolean isLocked(Long userId, List<ScopeKey> scopes) {
        if (scopes == null || scopes.isEmpty()) return true;
        if (userId == null) return true; // 未登录: 无免费目标, 一律锁(广告/登录后再放行)
        UserProfileEntity profile = userProfileMapper.findByUserId(userId);
        boolean isPro = profile != null && profile.getIsPro() != null && profile.getIsPro() == 1;
        if (isPro) return false;
        int floor = Year.now().getValue() - (FREE_YEAR_SPAN - 1);
        Set<String> freeKeys = targetSchoolMapper.findByUserId(userId).stream()
                .sorted(Comparator.comparing(t -> t.getPriority() == null ? Integer.MAX_VALUE : t.getPriority()))
                .limit(FREE_TARGET_LIMIT)
                .map(t -> t.getUniversityCode() + "::" + t.getGradSchoolCode())
                .collect(Collectors.toSet());
        for (ScopeKey s : scopes) {
            boolean inFreeTarget = freeKeys.contains(s.universityCode() + "::" + s.gradSchoolCode());
            boolean inFreeYear = s.year() >= floor;
            if (inFreeTarget && inFreeYear) return false;
        }
        return true;
    }
}
```

> `UserTargetSchoolEntity` 有 `getUniversityCode/getGradSchoolCode/getPriority`（已核实）。免费键 `校::研究科` 与前端 `targetKey` 口径一致。

- [ ] **Step 3: 改 QuestionQueryServiceImpl**

(a) 注入 `QuestionScopeMapper questionScopeMapper`、`ExamPaperScopeMapper examPaperScopeMapper`、`AccessGate accessGate`。删 `UniversityMapper`/`SubjectMapper` 若同专题仍需则保留（getRelated 用 university/subject 名）——保留。

(b) 新增私有方法：取一题的所有 `AccessGate.ScopeKey`（散题查 question_scope；挂卷题查 exam_paper_scope）：

```java
    private List<AccessGate.ScopeKey> scopeKeysOf(QuestionEntity q) {
        List<AccessGate.ScopeKey> keys = new ArrayList<>();
        if (q.getPaperCode() == null) {
            for (var s : questionScopeMapper.findByQuestionCode(q.getCode()))
                keys.add(new AccessGate.ScopeKey(s.getUniversityCode(), s.getGradSchoolCode(), s.getYear()));
        } else {
            for (var ps : examPaperScopeMapper.findByPaperCode(q.getPaperCode()))
                keys.add(new AccessGate.ScopeKey(ps.getUniversityCode(), ps.getGradSchoolCode(), ps.getYear()));
        }
        return keys;
    }
```

(c) `toListItem`：删所有 `r.setUniversityId/setGraduateSchool/setMajorId/setYear`（getter 已不存在）。保留 `setSubject/setSubjectCode`——但 `subjectCode` 现在不在 QuestionEntity 上了（Task 3 删了）！**改为从 scope 主条取**：列表项的 subject 展示用「该题主 scope 的 subject_code」。为避免 N 次查询，`list()` 里对每题调 `scopeKeysOf`+主 subject 需要 subject_code——故 `scopeKeysOf` 不够（它只带 校/研/年）。**决策**：列表项 subject 也从 scope 主条取，新增私有方法返回主 scope 的 subjectCode：

```java
    private String primarySubjectCode(QuestionEntity q) {
        if (q.getPaperCode() == null) {
            var list = questionScopeMapper.findByQuestionCode(q.getCode());
            return list.isEmpty() ? null : list.get(0).getSubjectCode();
        }
        var list = examPaperScopeMapper.findByPaperCode(q.getPaperCode());
        return list.isEmpty() ? null : list.get(0).getSubjectCode();
    }
```

`toListItem` 用 `primarySubjectCode(q)` 填 `subjectCode` + 名字映射填 `subject`；并 `r.setLocked(accessGate.isLocked(currentUserId, scopeKeysOf(q)))`。`list()` 需拿 currentUserId：`UserContextHolder.get()` 取（列表公开，未登录为 null）。

(d) `getByCode`：删 `setUniversityId/setGraduateSchool/setMajorId/setYear`；`subjectCode/subject` 从 `primarySubjectCode` 取；加 `r.setLocked(accessGate.isLocked(userId, scopeKeysOf(q)))`。

(e) `getRelated`：`findSameTopic(code, 6)` 新签名（删四维参数）。返回项的 `universityId/universityName/year/subject/subjectCode` 从**该候选题的主 scope**取（不再从 entity 五列）：对每个候选 `q`，取 `primaryScope(q)`（返回主 scope 的完整五元组），填 universityName（`universityMapper.findByCode`）、year、subject。新增：

```java
    private QuestionScopeEntity primaryScopeEntity(QuestionEntity q) {
        if (q.getPaperCode() == null) {
            var l = questionScopeMapper.findByQuestionCode(q.getCode());
            return l.isEmpty() ? null : l.get(0);
        }
        // 挂卷题: 用 exam_paper_scope 主条构造一个等价 QuestionScopeEntity(仅取值)
        var l = examPaperScopeMapper.findByPaperCode(q.getPaperCode());
        if (l.isEmpty()) return null;
        var ps = l.get(0);
        QuestionScopeEntity s = new QuestionScopeEntity();
        s.setUniversityCode(ps.getUniversityCode()); s.setGradSchoolCode(ps.getGradSchoolCode());
        s.setMajorCode(ps.getMajorCode()); s.setSubjectCode(ps.getSubjectCode()); s.setYear(ps.getYear());
        return s;
    }
```

getRelated 用它填 related 项的 universityId/year/subjectCode（无则给空/0，沿用现有兜底）。

- [ ] **Step 4: 改 PaperQueryServiceImpl（去五列 + scope 主条填展示字段）**

`PaperQueryServiceImpl` 里所有 `p.getUniversityCode()/getYear()/getSubjectCode()` 等（entity 已删）改为从 `examPaperScopeMapper.findByPaperCode(p.getCode())` 主条取。注入 `ExamPaperScopeMapper`。内嵌 question item 的 `setUniversityId/setYear/setSubject` 同理从 scope 取或删除（若 paper 详情前端不再需要，删；保留最小以免前端 papers.ts 崩——见 Task 8 决定）。**目标**：编译通过 + paper 列表/详情按 scope 正确展示年份/科目。

- [ ] **Step 5: QuestionQueryService 接口**

`getRelated` 签名不变（对外）；`findSameTopic` 是 mapper 层签名变更，service 接口无 `findSameTopic`。确认接口无需改（`list/getByCode/getRelated` 签名不变）。

- [ ] **Step 6: Controller locked 依赖**

`GET /questions` 列表是 `@PublicApi`——`list()` 内用 `UserContextHolder.get()` 取可选用户算 locked。确认 `QuestionController.list` 无需加 `@CurrentUser`（保持公开）。detail 已强制登录，`getByCode(code, s.getUserId())` 传真实 userId。

- [ ] **Step 7: 编译（Task 3+4+5+6 统一门禁）**

Run: `cd Kairos-kakomon-server && ./mvnw compile 2>&1 | tail -8`
Expected: BUILD SUCCESS。逐一消除「找不到 getUniversityCode/setYear」等错误（都应改成 scope 取值或删除）。

- [ ] **Step 8: 契约自检**

Run: `grep -nE "setLocked|primarySubjectCode|scopeKeysOf" src/main/java/org/example/kairos/service/question/impl/QuestionQueryServiceImpl.java`
确认 list 与 detail 都 setLocked；列表/详情 DTO 无 universityId/year。

- [ ] **Step 9: Commit（Task 3-6）**

```bash
git add Kairos-kakomon-server/src/main/java/org/example/kairos/entity/ \
        Kairos-kakomon-server/src/main/java/org/example/kairos/mapper/question/ \
        Kairos-kakomon-server/src/main/resources/mapper/question/ \
        Kairos-kakomon-server/src/main/java/org/example/kairos/model/response/question/ \
        Kairos-kakomon-server/src/main/java/org/example/kairos/service/question/
git commit -m "feat(be): 题目/试卷多归属 — 主表去五列, scope mapper, 查询 join scope, locked 后端算"
```

---

## Task 7: 前端 API 层 + 类型对齐（去单归属字段 + locked）

**Files:**
- Modify: `Kairos-kakomon/src/types/question.ts`
- Modify: `Kairos-kakomon/src/api/questions.ts`
- Modify: `Kairos-kakomon/src/api/papers.ts`

**Interfaces:**
- Consumes: 后端契约（Task 6）。
- Produces: `KakomonQuestion` 去 `universityId/graduateSchool/majorId/year`、加 `locked?:boolean`；`getQuestions`/`getQuestion` 映射同步；papers 侧对齐。

- [ ] **Step 1: KakomonQuestion 去字段 + 加 locked**

`src/types/question.ts` 的 `KakomonQuestion`（7-38）：删 `universityId`、`graduateSchool`、`majorId?`、`year` 四个字段（**保留 `subject`、`subjectCode`、`questionNo`、`title` 等**）。加 `locked?: boolean;`。

> `RelatedQuestion` 类型不变（同专题卡片仍显 universityName/year，来自后端 scope 主条）。

- [ ] **Step 2: questions.ts 映射同步**

`QuestionListItemRaw`（13-30）删 `universityId/graduateSchool/year/majorId`（保留 `subject/subjectCode`）；加 `locked?: boolean`。`QuestionDetailRaw` 继承同步。`listItemToQuestion`（45-63）删对应 `universityId/graduateSchool/majorId/year` 赋值；加 `locked: raw.locked ?? false`。`detailToQuestion` 同步加 `locked`。

- [ ] **Step 3: papers.ts 对齐**

`src/api/papers.ts`：`PaperListItemRaw`/`PaperDetailRaw`/`PaperQuestionRaw` 里若后端已不返 `universityId/year`（Task 6 paper 侧决定），删对应字段；若后端仍从 scope 主条返年份/科目，保留。**以 Task 6 实际返回为准**——实现时先看后端 paper DTO，再对齐。`exam-session`/`ExamResult` 依赖的 `universityId`（`app/exam-session.tsx:172` 传 `universityIds`）：paper 详情仍需返回一个代表性 universityId（主 scope），故 paper 详情**保留** universityId/year（来自主 scope）。

- [ ] **Step 4: 类型门禁（此时屏幕仍引用删除字段，预期报错，Task 8 修）**

Run: `cd Kairos-kakomon && npx tsc --noEmit 2>&1 | head -25`
Expected: 仅 `app/*.tsx`（search/topic-study/questions/[id]）报「`universityId`/`year` 不存在于 KakomonQuestion」；`src/api/*`、`src/types/*` 自身无错。

- [ ] **Step 5: 进入 Task 8（不单独提交）**

---

## Task 8: 前端屏幕改造（去本地过滤 + 去归属展示 + 门禁读 locked）

**Files:**
- Modify: `Kairos-kakomon/app/topic-questions.tsx`
- Modify: `Kairos-kakomon/app/topic-study.tsx`
- Modify: `Kairos-kakomon/app/search.tsx`
- Modify: `Kairos-kakomon/app/questions/[id].tsx`

**Interfaces:**
- Consumes: `KakomonQuestion.locked`（Task 7）。

- [ ] **Step 1: topic-questions.tsx**

删任何 `q.universityId === ...` 本地过滤（后端已 scope 过滤）。题卡 ad-gate 判定：把原来基于 `canAccessQuestion(...q.universityId/year...)` 改为 `q.locked`（`locked` 为 true 且未广告解锁则显示遮罩/走 AdGateModal）。ad-gate 弹窗文案里的 `year`/校名若无来源，改为通用文案（如「该题超出免费范围」）。

- [ ] **Step 2: topic-study.tsx**

删 187-198 附近的 `q.universityId===activeEntry.universityId && q.graduateSchool===activeEntry.gradSchool` 本地过滤。该屏「按 subject 聚合出科目列表」原本靠遍历题的 `q.subjectCode/q.subject`——现在题仍有 `subjectCode/subject`（保留字段），聚合逻辑不变；只是不再按 university 本地过滤（查询已按校/研究科传参，后端 scope 过滤）。

- [ ] **Step 3: search.tsx**

- 结果卡片行 `{q.year} · {q.subject} {q.questionNo}`（134、248）→ 改为 `{q.subject} {q.questionNo}`（去 year）。
- 删本地 `q.universityId===`/`q.year` 过滤（70、81、320、335、438-439 附近）。搜索改为调后端 `getQuestions`（keyword 入参）而非本地扫 `KAKOMON_QUESTIONS`——**若 search 当前是纯 mock 本地搜索**，最小改动：保留其现有 mock 行为但去掉对已删字段的引用（year/universityId），门禁用 `q.locked`。gate 弹窗文案改通用。
- `setGate({...universityId, year...})`：改为不依赖题的 universityId/year——gate 只需 `questionId` + `q.locked`；文案用通用「超出免费范围，看广告解锁」。

> search.tsx 改动较多且它是 mock 搜索——**以「消除对已删字段的引用 + 门禁改 locked」为目标**，不重构其搜索数据源。

- [ ] **Step 4: questions/[id].tsx**

- 删 `question.universityId` 取大学的逻辑（186、189-190）——详情不展示归属。
- 详情页 ad-gate（若有基于 university/year 的）改用 `question.locked`。
- 「下一题」等如依赖 `list` 参数不受影响。

- [ ] **Step 5: 前端门禁**

Run: `cd Kairos-kakomon && npm run type-check`
Expected: 0 error。
Run: `cd Kairos-kakomon && npm run lint`
Expected: 0 error（新引入未用符号清理；15 条既有 warning 基线）。

- [ ] **Step 6: 自检**

Run: `grep -rnE "\.universityId|\.graduateSchool|\bq\.year\b|question\.year" Kairos-kakomon/app/topic-questions.tsx Kairos-kakomon/app/questions/\[id\].tsx | grep -vE "params|universityIds|scope"`
Expected: 无残留对题对象已删字段的引用（paper/exam-session 的 universityId 属 paper 详情，另计）。

- [ ] **Step 7: Commit（Task 7+8）**

```bash
git add Kairos-kakomon/src/types/question.ts Kairos-kakomon/src/api/questions.ts Kairos-kakomon/src/api/papers.ts \
        Kairos-kakomon/app/topic-questions.tsx Kairos-kakomon/app/topic-study.tsx Kairos-kakomon/app/search.tsx Kairos-kakomon/app/questions/\[id\].tsx
git commit -m "feat(fe): 题目多归属 — 类型去单归属字段, 去本地过滤/归属展示, 门禁读后端 locked"
```

---

## Task 9: mock 数据 + accessPolicy 收尾 + 文档 + TASKS

**Files:**
- Modify: `Kairos-kakomon/src/mocks/data.ts`
- Modify: `Kairos-kakomon/src/utils/accessPolicy.ts`（按调用点收敛）
- Modify: `docs/02-architecture/API-contract.md`
- Modify: `Kairos-kakomon/TASKS.md`

- [ ] **Step 1: mock data 对齐类型**

`KAKOMON_QUESTIONS` 里每题的 `universityId/graduateSchool/year`（已从类型删除）会导致 type-check 报「对象字面量多余属性」或被引用处报错。**决策**：mock 题对象删这些字段（保留 `subject/subjectCode/questionNo/title/knowledgePoints/难度/crowd/masteryStatus`），加 `locked: false`（mock 默认可访问）。`recommendRelated`（wrong-book 用）若按 subject/knowledgePoints 工作则不受影响；若引用了 `q.universityId`/`q.year` 则相应清理。

Run 先探: `grep -nE "universityId|graduateSchool|\byear\b" Kairos-kakomon/src/mocks/data.ts | head`

- [ ] **Step 2: accessPolicy 收敛**

`canAccessQuestion` 现按题 `universityId/gradSchool/year` 判——这些字段已从题类型删除，门禁下沉后端 `locked`。按调用点处理：
- 若所有题目门禁调用点已改读 `q.locked`（Task 8），则 `canAccessQuestion` 的题目分支可能无调用者 → 删除或保留给「已知单一 scope 的场景」。
- **保守做法**：保留 `accessPolicy` 中不依赖被删字段的导出（`freeYearFloor`、ad 解锁判断），删除或改造 `canAccessQuestion` 中读 `q.universityId/q.year` 的部分。以 `grep -rn "canAccessQuestion\|isQuestionAccessible" Kairos-kakomon/app Kairos-kakomon/src` 的实际调用点为准，逐一改为 `locked` 或保留。
- 目标：type-check 0 error，无死引用。

Run: `grep -rn "canAccessQuestion\|isQuestionAccessible\|accessPolicy" Kairos-kakomon/app Kairos-kakomon/src | grep -v "accessPolicy.ts"`

- [ ] **Step 3: type-check + lint 复核**

Run: `cd Kairos-kakomon && npm run type-check && npm run lint 2>&1 | tail -3`
Expected: type-check 0 error；lint 0 error。

- [ ] **Step 4: API-contract 更新**

`docs/02-architecture/API-contract.md`：§2.13（列表）item 去 `universityId/graduateSchool/majorId/year`、加 `locked`；§2.14（详情）同步 + 说明归属不再返回、加 `locked`；§2.15（同专题）不变；paper 端点（§2.x）说明归属改由 scope 驱动。§1.7 权限截断补充「locked 由后端按 scope+目标校计算」。

- [ ] **Step 5: TASKS.md 追加**

在 `Kairos-kakomon/TASKS.md` 末尾追加本 plan 的 checklist（已完成项打 `[x]` + `✅ 完成于 2026-07-09`），并列联调待验证项：
- 迁移 V2_0 可重放（建表→回填→删列）
- 多归属散题在多专业列表出现、DISTINCT 无重复
- 同专题跨源题多 scope 并集正确
- locked 三态（免费/VIP/未登录）+ 前端广告解锁叠加
- paper 列表/详情按 scope 过滤、exam-session universityId 来自主 scope

- [ ] **Step 6: Commit**

```bash
git add Kairos-kakomon/src/mocks/data.ts Kairos-kakomon/src/utils/accessPolicy.ts docs/02-architecture/API-contract.md Kairos-kakomon/TASKS.md
git commit -m "chore: 多归属收尾 — mock/accessPolicy 对齐, API-contract 与 TASKS 更新"
```

---

## 依赖顺序与编译单元

```
Task 1 (V2_0 迁移) ──┐
Task 2 (种子)        ─┤ 独立, 各自提交
Task 3 (entity/DTO/resultMap 去五列) ─┐
Task 4 (scope mapper)                ─┼─ 同一后端编译单元
Task 5 (查询 join scope)             ─┤   (Task 3-6 一次 ./mvnw compile)
Task 6 (service locked + Controller) ─┘
Task 7 (前端 API/类型) ─┐
Task 8 (前端屏幕)       ─┼─ 同一前端 type-check 单元 (Task 7+8)
Task 9 (mock/accessPolicy/文档/TASKS) ── 收尾, 最终 type-check+lint
```

后端 Task 3-6 因删 entity 字段会连锁破坏 service，必须一次改完再编译（Task 6 Step 7 是唯一后端门禁点）。前端 Task 7 删类型字段会破坏屏幕，Task 8 修复后统一 type-check；Task 9 收尾 mock/accessPolicy 后最终门禁。
