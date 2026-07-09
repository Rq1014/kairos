# 题目详情页改造 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 详情页删掉论坛与举一反三入口；「同专题联系」改为后端真数据（严格同 学校+研究科+专业+科目、知识点重合优先）；难度投票与掌握情况改为后端持久化（每用户每题一条）。

**Architecture:** 后端在既有 `question` 模块新增 2 张用户维度表（`question_difficulty_vote`、`question_user_mastery`）与一个写服务 `QuestionMutationService`；复用 `GET /questions/{code}/related` 端点改查同专题；详情端点补众包/掌握字段并改强制登录。前端 `app/questions/[id].tsx` 删两块、接三个已存在的 API 函数、掌握情况对后端与本地 attemptStore 双写。

**Tech Stack:** 后端 Spring Boot 4 + MyBatis（Java mapper + XML 同步）+ MySQL 8；前端 Expo/RN + TypeScript + TanStack Query v5 + Zustand。

## Global Constraints

- 后端包根 `org.example.kairos`，按 feature 模块切分：`web/` `service/`(+`impl/`) `mapper/` `model/request|response` `entity/`(扁平) `common/`。MyBatis Java mapper 与 `resources/mapper/<module>/*.xml` 必须同步。
- 响应统一 `Result<T>`（`code 0` 成功）；业务错误用 `ResultCode`（题目段 `10600~10699`，已用 10601/10602）。异常抛 `BizException(ResultCode)`，由 `GlobalExceptionHandler` 映射。
- 登录态：类/方法加 `@PublicApi` 表示放行；否则 `LoginRequiredInterceptor` 强制登录。控制器取当前用户用 `@CurrentUser UserSession s`（`s.getUserId()` 为 `Long`）。
- 用户表 PK `BIGINT UNSIGNED`；新表 `user_id BIGINT UNSIGNED`；`question_code VARCHAR(80)`。DATETIME 用 `DATETIME(3)`。charset `utf8mb4`。
- JSON 序列化用 `tools.jackson.databind.ObjectMapper`（注意：本项目用的是 `tools.jackson` 而非 `com.fasterxml.jackson`）。
- 后端门禁：`cd Kairos-kakomon-server && ./mvnw compile`。前端门禁：`cd Kairos-kakomon && npm run type-check` 与 `npm run lint`。
- 无 test runner；后端仅 `contextLoads`。本计划用「编译通过 + 手动契约核对」替代单元测试步骤（见各任务验证）。
- 迁移脚本用下一个版本号 `V1_9`，放 `docs/05-database/sql/`。
- 前端字段命名 camelCase，与后端响应对齐（后端响应字段本就按前端 `KakomonQuestion` 命名）。
- 动工前把本计划 checklist 追加到 `Kairos-kakomon/TASKS.md`，逐步打勾并追 `✅ 完成于 2026-07-09`（不改写既有行）。

**契约冻结**（前端 API 函数已存在，后端必须对齐；改任一端都要同步）：
- `PUT /api/questions/{code}/mastery` 请求体 `{ "masteryStatus": "mastered|unclear|wrong" }`；响应 `data = { questionId, masteryStatus, weakPointsUpdated }`。
- `POST /api/questions/{code}/difficulty-vote` 请求体 `{ "vote": "easy|medium|hard" }`；响应 `data = { questionId, vote, crowdVotes: {easy,medium,hard}, crowdDifficultyRate }`。
- `GET /api/questions/{code}` 响应 `data` 在现有字段上新增 `crowdDifficultyRate:number`、`crowdVotes:{easy,medium,hard}`、`myVote:"easy|medium|hard"|null`、`masteryStatus:"mastered|unclear|wrong"|null`。
- `GET /api/questions/{code}/related` 响应 `data` 为数组，每项 `{ id, title, universityId, universityName, year, subject, subjectCode, questionNo, knowledgePoints }`。

---

## Task 1: V1_9 迁移 — 两张用户维度表

**Files:**
- Create: `docs/05-database/sql/V1_9__question_user_dimension.sql`

**Interfaces:**
- Produces: 表 `question_difficulty_vote(user_id, question_code, vote, uk_user_question)`、`question_user_mastery(user_id, question_code, mastery, uk_user_question)`。供 Task 3/5/7 的 mapper 使用。

- [ ] **Step 1: 写迁移脚本**

Create `docs/05-database/sql/V1_9__question_user_dimension.sql`:

```sql
-- =============================================================
-- Kairos-kakomon 迁移脚本 V1.9 — 题目用户维度(难度投票 + 掌握自评)
-- 对应设计: docs/superpowers/specs/2026-07-09-question-detail-crowd-mastery-design.md
-- 执行环境: MySQL 8.x, utf8mb4 / utf8mb4_0900_ai_ci
-- =============================================================

USE `kakomon`;
SET NAMES utf8mb4;

DROP TABLE IF EXISTS `question_difficulty_vote`;
DROP TABLE IF EXISTS `question_user_mastery`;

-- 难度投票: 每用户每题一票, 可改投(upsert)
CREATE TABLE `question_difficulty_vote` (
    `id`            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
    `user_id`       BIGINT UNSIGNED NOT NULL                COMMENT '用户 id',
    `question_code` VARCHAR(80)     NOT NULL                COMMENT '题目 code',
    `vote`          VARCHAR(8)      NOT NULL                COMMENT 'easy/medium/hard',
    `created_at`    DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at`    DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_user_question` (`user_id`, `question_code`),
    KEY `idx_question` (`question_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='题目难度投票(每用户每题一票,可改投)';

-- 掌握自评: 每用户每题一条最新状态
CREATE TABLE `question_user_mastery` (
    `id`            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
    `user_id`       BIGINT UNSIGNED NOT NULL                COMMENT '用户 id',
    `question_code` VARCHAR(80)     NOT NULL                COMMENT '题目 code',
    `mastery`       VARCHAR(16)     NOT NULL                COMMENT 'mastered/unclear/wrong',
    `created_at`    DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at`    DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_user_question` (`user_id`, `question_code`),
    KEY `idx_question` (`question_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户对题目的掌握自评(每用户每题一条最新)';
```

- [ ] **Step 2: 语法自检**

Run: `grep -c "CREATE TABLE" docs/05-database/sql/V1_9__question_user_dimension.sql`
Expected: `2`

- [ ] **Step 3: Commit**

```bash
git add docs/05-database/sql/V1_9__question_user_dimension.sql
git commit -m "feat(db): V1_9 新增难度投票/掌握自评表"
```

---

## Task 2: ResultCode 新增两个题目段错误码

**Files:**
- Modify: `Kairos-kakomon-server/src/main/java/org/example/kairos/common/ResultCode.java:93`

**Interfaces:**
- Produces: `ResultCode.INVALID_DIFFICULTY_VOTE`(10603)、`ResultCode.INVALID_MASTERY_STATUS`(10604)。供 Task 4/6 校验非法枚举值时抛出。

- [ ] **Step 1: 改枚举末项分隔符并追加两码**

在 `ResultCode.java` 中，把 `QUESTION_NOT_FOUND` 那行末尾的 `;` 改成 `,` 并追加两行。当前（第 92-93 行）：

```java
    /** 题目不存在或已下线 */
    QUESTION_NOT_FOUND(10602, "题目不存在");
```

改为：

```java
    /** 题目不存在或已下线 */
    QUESTION_NOT_FOUND(10602, "题目不存在"),
    /** 难度投票值非法(仅 easy/medium/hard) */
    INVALID_DIFFICULTY_VOTE(10603, "难度投票值不合法"),
    /** 掌握状态值非法(仅 mastered/unclear/wrong) */
    INVALID_MASTERY_STATUS(10604, "掌握状态值不合法");
```

- [ ] **Step 2: 编译**

Run: `cd Kairos-kakomon-server && ./mvnw -q compile`
Expected: BUILD SUCCESS

- [ ] **Step 3: Commit**

```bash
git add Kairos-kakomon-server/src/main/java/org/example/kairos/common/ResultCode.java
git commit -m "feat(be): ResultCode 新增难度投票/掌握非法值错误码"
```

---

## Task 3: 难度投票 Entity + Mapper（含 upsert / 聚合 / crowd 回写）

**Files:**
- Create: `Kairos-kakomon-server/src/main/java/org/example/kairos/entity/QuestionDifficultyVoteEntity.java`
- Create: `Kairos-kakomon-server/src/main/java/org/example/kairos/mapper/question/QuestionDifficultyVoteMapper.java`
- Create: `Kairos-kakomon-server/src/main/resources/mapper/question/QuestionDifficultyVoteMapper.xml`
- Modify: `Kairos-kakomon-server/src/main/java/org/example/kairos/mapper/question/QuestionMapper.java`
- Modify: `Kairos-kakomon-server/src/main/resources/mapper/question/QuestionMapper.xml`

**Interfaces:**
- Consumes: 表 from Task 1。
- Produces:
  - `QuestionDifficultyVoteMapper.upsert(userId:Long, questionCode:String, vote:String)`
  - `QuestionDifficultyVoteMapper.countGroupByVote(questionCode:String) : List<Map<String,Object>>`（每行 `{vote, cnt}`）
  - `QuestionDifficultyVoteMapper.findUserVote(userId:Long, questionCode:String) : String`（无则 null）
  - `QuestionMapper.updateCrowd(code:String, rate:BigDecimal, votesJson:String)`
  - `QuestionMapper.findCrowdVotes(code:String) : String`（读回 crowd_votes JSON；供详情映射用）

- [ ] **Step 1: 写 Entity**

Create `entity/QuestionDifficultyVoteEntity.java`:

```java
package org.example.kairos.entity;

import java.time.LocalDateTime;

/** 题目难度投票实体, 对应 question_difficulty_vote 表。 */
public class QuestionDifficultyVoteEntity {
    private Long id;
    private Long userId;
    private String questionCode;
    private String vote;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public String getQuestionCode() { return questionCode; }
    public void setQuestionCode(String questionCode) { this.questionCode = questionCode; }
    public String getVote() { return vote; }
    public void setVote(String vote) { this.vote = vote; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
```

- [ ] **Step 2: 写 Mapper 接口**

Create `mapper/question/QuestionDifficultyVoteMapper.java`:

```java
package org.example.kairos.mapper.question;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

/** 题目难度投票 Mapper。 */
@Mapper
public interface QuestionDifficultyVoteMapper {
    /** upsert: 同 (user_id, question_code) 已存在则改投 */
    int upsert(@Param("userId") Long userId,
               @Param("questionCode") String questionCode,
               @Param("vote") String vote);

    /** 按 vote 分桶计数, 每行 {vote, cnt} */
    List<Map<String, Object>> countGroupByVote(@Param("questionCode") String questionCode);

    /** 查某用户对某题的当前票, 无则 null */
    String findUserVote(@Param("userId") Long userId,
                        @Param("questionCode") String questionCode);
}
```

- [ ] **Step 3: 写 Mapper XML**

Create `resources/mapper/question/QuestionDifficultyVoteMapper.xml`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
        "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="org.example.kairos.mapper.question.QuestionDifficultyVoteMapper">

    <insert id="upsert">
        INSERT INTO question_difficulty_vote (user_id, question_code, vote)
        VALUES (#{userId}, #{questionCode}, #{vote})
        ON DUPLICATE KEY UPDATE vote = VALUES(vote)
    </insert>

    <select id="countGroupByVote" resultType="map">
        SELECT vote, COUNT(*) AS cnt
        FROM question_difficulty_vote
        WHERE question_code = #{questionCode}
        GROUP BY vote
    </select>

    <select id="findUserVote" resultType="string">
        SELECT vote FROM question_difficulty_vote
        WHERE user_id = #{userId} AND question_code = #{questionCode}
    </select>
</mapper>
```

- [ ] **Step 4: 给 QuestionMapper 加 updateCrowd / findCrowdVotes**

In `mapper/question/QuestionMapper.java`, 在 `findKnowledgePoints` 方法后（第 39 行 `}` 之前）追加：

```java
    /** 回写众包难度缓存列 */
    int updateCrowd(@Param("code") String code,
                    @Param("rate") java.math.BigDecimal rate,
                    @Param("votesJson") String votesJson);

    /** 读回众包投票 JSON 字符串(可能为 null) */
    String findCrowdVotes(@Param("code") String code);
```

- [ ] **Step 5: 给 QuestionMapper.xml 加对应 SQL**

In `resources/mapper/question/QuestionMapper.xml`, 在 `</mapper>` 前追加：

```xml
    <update id="updateCrowd">
        UPDATE question
        SET crowd_difficulty_rate = #{rate}, crowd_votes = #{votesJson}
        WHERE code = #{code}
    </update>

    <select id="findCrowdVotes" resultType="string">
        SELECT crowd_votes FROM question WHERE code = #{code}
    </select>
```

- [ ] **Step 6: 编译**

Run: `cd Kairos-kakomon-server && ./mvnw -q compile`
Expected: BUILD SUCCESS

- [ ] **Step 7: Commit**

```bash
git add Kairos-kakomon-server/src/main/java/org/example/kairos/entity/QuestionDifficultyVoteEntity.java \
        Kairos-kakomon-server/src/main/java/org/example/kairos/mapper/question/QuestionDifficultyVoteMapper.java \
        Kairos-kakomon-server/src/main/resources/mapper/question/QuestionDifficultyVoteMapper.xml \
        Kairos-kakomon-server/src/main/java/org/example/kairos/mapper/question/QuestionMapper.java \
        Kairos-kakomon-server/src/main/resources/mapper/question/QuestionMapper.xml
git commit -m "feat(be): 难度投票 entity/mapper + question crowd 回写"
```

---

## Task 4: 掌握自评 Entity + Mapper

**Files:**
- Create: `Kairos-kakomon-server/src/main/java/org/example/kairos/entity/QuestionUserMasteryEntity.java`
- Create: `Kairos-kakomon-server/src/main/java/org/example/kairos/mapper/question/QuestionUserMasteryMapper.java`
- Create: `Kairos-kakomon-server/src/main/resources/mapper/question/QuestionUserMasteryMapper.xml`

**Interfaces:**
- Consumes: 表 from Task 1。
- Produces:
  - `QuestionUserMasteryMapper.upsert(userId:Long, questionCode:String, mastery:String)`
  - `QuestionUserMasteryMapper.findUserMastery(userId:Long, questionCode:String) : String`（无则 null）

- [ ] **Step 1: 写 Entity**

Create `entity/QuestionUserMasteryEntity.java`:

```java
package org.example.kairos.entity;

import java.time.LocalDateTime;

/** 用户题目掌握自评实体, 对应 question_user_mastery 表。 */
public class QuestionUserMasteryEntity {
    private Long id;
    private Long userId;
    private String questionCode;
    private String mastery;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public String getQuestionCode() { return questionCode; }
    public void setQuestionCode(String questionCode) { this.questionCode = questionCode; }
    public String getMastery() { return mastery; }
    public void setMastery(String mastery) { this.mastery = mastery; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
```

- [ ] **Step 2: 写 Mapper 接口**

Create `mapper/question/QuestionUserMasteryMapper.java`:

```java
package org.example.kairos.mapper.question;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

/** 用户题目掌握自评 Mapper。 */
@Mapper
public interface QuestionUserMasteryMapper {
    /** upsert: 同 (user_id, question_code) 已存在则更新 mastery */
    int upsert(@Param("userId") Long userId,
               @Param("questionCode") String questionCode,
               @Param("mastery") String mastery);

    /** 查某用户对某题的当前掌握, 无则 null */
    String findUserMastery(@Param("userId") Long userId,
                           @Param("questionCode") String questionCode);
}
```

- [ ] **Step 3: 写 Mapper XML**

Create `resources/mapper/question/QuestionUserMasteryMapper.xml`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
        "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="org.example.kairos.mapper.question.QuestionUserMasteryMapper">

    <insert id="upsert">
        INSERT INTO question_user_mastery (user_id, question_code, mastery)
        VALUES (#{userId}, #{questionCode}, #{mastery})
        ON DUPLICATE KEY UPDATE mastery = VALUES(mastery)
    </insert>

    <select id="findUserMastery" resultType="string">
        SELECT mastery FROM question_user_mastery
        WHERE user_id = #{userId} AND question_code = #{questionCode}
    </select>
</mapper>
```

- [ ] **Step 4: 编译**

Run: `cd Kairos-kakomon-server && ./mvnw -q compile`
Expected: BUILD SUCCESS

- [ ] **Step 5: Commit**

```bash
git add Kairos-kakomon-server/src/main/java/org/example/kairos/entity/QuestionUserMasteryEntity.java \
        Kairos-kakomon-server/src/main/java/org/example/kairos/mapper/question/QuestionUserMasteryMapper.java \
        Kairos-kakomon-server/src/main/resources/mapper/question/QuestionUserMasteryMapper.xml
git commit -m "feat(be): 掌握自评 entity/mapper"
```

---

## Task 5: 同专题查询 SQL（findSameTopic）

**Files:**
- Modify: `Kairos-kakomon-server/src/main/java/org/example/kairos/mapper/question/QuestionMapper.java`
- Modify: `Kairos-kakomon-server/src/main/resources/mapper/question/QuestionMapper.xml`

**Interfaces:**
- Produces: `QuestionMapper.findSameTopic(code, universityCode, gradSchoolCode, majorCode, subjectCode, limit) : List<QuestionEntity>`（严格同 4 维、排除自身、按共享知识点数降序再年份降序）。供 Task 8 的 `getRelated` 用。

- [ ] **Step 1: 加 mapper 方法**

In `mapper/question/QuestionMapper.java`, 在 Task 3 追加的方法之后再加：

```java
    /** 同专题(严格同 学校+研究科+专业+科目, 排除自身), 按共享知识点数降序、年份降序 */
    List<QuestionEntity> findSameTopic(@Param("code") String code,
                                       @Param("universityCode") String universityCode,
                                       @Param("gradSchoolCode") String gradSchoolCode,
                                       @Param("majorCode") String majorCode,
                                       @Param("subjectCode") String subjectCode,
                                       @Param("limit") int limit);
```

- [ ] **Step 2: 加 XML**

In `resources/mapper/question/QuestionMapper.xml`, 在 `</mapper>` 前追加（复用已有 `listCols` sql 片段）：

```xml
    <select id="findSameTopic" resultMap="QMap">
        SELECT <include refid="listCols"/>,
               COUNT(kp.knowledge_point) AS overlap
        FROM question q
        LEFT JOIN question_knowledge_point kp
               ON kp.question_code = q.code
              AND kp.knowledge_point IN (
                  SELECT knowledge_point FROM question_knowledge_point WHERE question_code = #{code})
        WHERE q.status = 1
          AND q.code != #{code}
          AND q.university_code = #{universityCode}
          AND q.grad_school_code = #{gradSchoolCode}
          AND q.major_code = #{majorCode}
          AND q.subject_code = #{subjectCode}
        GROUP BY q.id
        ORDER BY overlap DESC, q.year DESC, q.order_index ASC
        LIMIT #{limit}
    </select>
```

注：`listCols` 已含 `crowd_difficulty_rate, crowd_votes`；`overlap` 仅用于 ORDER BY，`QMap` 无该列不影响映射。`GROUP BY q.id` 在 MySQL8 默认 `ONLY_FULL_GROUP_BY` 下合法（`q.id` 是主键，函数依赖其余 `q.*` 列）。

- [ ] **Step 3: 编译**

Run: `cd Kairos-kakomon-server && ./mvnw -q compile`
Expected: BUILD SUCCESS

- [ ] **Step 4: Commit**

```bash
git add Kairos-kakomon-server/src/main/java/org/example/kairos/mapper/question/QuestionMapper.java \
        Kairos-kakomon-server/src/main/resources/mapper/question/QuestionMapper.xml
git commit -m "feat(be): QuestionMapper 新增 findSameTopic(同专题查询)"
```

---

## Task 6: 请求 DTO + 响应 DTO 调整

**Files:**
- Create: `Kairos-kakomon-server/src/main/java/org/example/kairos/model/request/question/DifficultyVoteRequest.java`
- Create: `Kairos-kakomon-server/src/main/java/org/example/kairos/model/request/question/MasteryRequest.java`
- Create: `Kairos-kakomon-server/src/main/java/org/example/kairos/model/response/question/DifficultyVoteResult.java`
- Create: `Kairos-kakomon-server/src/main/java/org/example/kairos/model/response/question/MasteryResult.java`
- Modify: `Kairos-kakomon-server/src/main/java/org/example/kairos/model/response/question/QuestionResponse.java`
- Modify: `Kairos-kakomon-server/src/main/java/org/example/kairos/model/response/question/RelatedQuestionResponse.java`

**Interfaces:**
- Produces:
  - `DifficultyVoteRequest { String vote }`、`MasteryRequest { String masteryStatus }`
  - `DifficultyVoteResult { questionId, vote, Map<String,Integer> crowdVotes, BigDecimal crowdDifficultyRate }`
  - `MasteryResult { questionId, masteryStatus, boolean weakPointsUpdated }`
  - `QuestionResponse` 新增 `crowdDifficultyRate:BigDecimal`、`crowdVotes:Map<String,Integer>`、`myVote:String`、`masteryStatus:String`
  - `RelatedQuestionResponse` 字段改为 `{ id, title, universityId, universityName, year, subject, subjectCode, questionNo, knowledgePoints }`
- 供 Task 7（service）、Task 8（controller/service）使用。

- [ ] **Step 1: DifficultyVoteRequest**

Create `model/request/question/DifficultyVoteRequest.java`:

```java
package org.example.kairos.model.request.question;

import jakarta.validation.constraints.NotBlank;

/** 难度投票请求。vote ∈ easy/medium/hard(在 service 层校验)。 */
public class DifficultyVoteRequest {
    @NotBlank
    private String vote;

    public String getVote() { return vote; }
    public void setVote(String vote) { this.vote = vote; }
}
```

- [ ] **Step 2: MasteryRequest**

Create `model/request/question/MasteryRequest.java`（字段名 `masteryStatus` 对齐前端请求体）：

```java
package org.example.kairos.model.request.question;

import jakarta.validation.constraints.NotBlank;

/** 掌握自评请求。masteryStatus ∈ mastered/unclear/wrong(在 service 层校验)。 */
public class MasteryRequest {
    @NotBlank
    private String masteryStatus;

    public String getMasteryStatus() { return masteryStatus; }
    public void setMasteryStatus(String masteryStatus) { this.masteryStatus = masteryStatus; }
}
```

- [ ] **Step 3: DifficultyVoteResult**

Create `model/response/question/DifficultyVoteResult.java`:

```java
package org.example.kairos.model.response.question;

import java.math.BigDecimal;
import java.util.Map;

/** 难度投票结果(含最新聚合)。字段对齐前端 voteQuestionDifficulty 返回。 */
public class DifficultyVoteResult {
    private String questionId;
    private String vote;
    private Map<String, Integer> crowdVotes;
    private BigDecimal crowdDifficultyRate;

    public String getQuestionId() { return questionId; }
    public void setQuestionId(String questionId) { this.questionId = questionId; }
    public String getVote() { return vote; }
    public void setVote(String vote) { this.vote = vote; }
    public Map<String, Integer> getCrowdVotes() { return crowdVotes; }
    public void setCrowdVotes(Map<String, Integer> crowdVotes) { this.crowdVotes = crowdVotes; }
    public BigDecimal getCrowdDifficultyRate() { return crowdDifficultyRate; }
    public void setCrowdDifficultyRate(BigDecimal crowdDifficultyRate) { this.crowdDifficultyRate = crowdDifficultyRate; }
}
```

- [ ] **Step 4: MasteryResult**

Create `model/response/question/MasteryResult.java`:

```java
package org.example.kairos.model.response.question;

/** 掌握自评结果。字段对齐前端 updateQuestionMastery 返回。 */
public class MasteryResult {
    private String questionId;
    private String masteryStatus;
    private boolean weakPointsUpdated;

    public String getQuestionId() { return questionId; }
    public void setQuestionId(String questionId) { this.questionId = questionId; }
    public String getMasteryStatus() { return masteryStatus; }
    public void setMasteryStatus(String masteryStatus) { this.masteryStatus = masteryStatus; }
    public boolean isWeakPointsUpdated() { return weakPointsUpdated; }
    public void setWeakPointsUpdated(boolean weakPointsUpdated) { this.weakPointsUpdated = weakPointsUpdated; }
}
```

- [ ] **Step 5: QuestionResponse 新增 4 字段**

In `model/response/question/QuestionResponse.java`：顶部 import 加 `import java.math.BigDecimal;` 和 `import java.util.Map;`（`java.util.List` 已有）。在 `private List<String> knowledgePoints;`（第 22 行）后加字段：

```java
    private BigDecimal crowdDifficultyRate;
    private Map<String, Integer> crowdVotes;
    private String myVote;
    private String masteryStatus;
```

在 `setKnowledgePoints` 之后（第 55 行 `}` 之前）加 getter/setter：

```java
    public BigDecimal getCrowdDifficultyRate() { return crowdDifficultyRate; }
    public void setCrowdDifficultyRate(BigDecimal crowdDifficultyRate) { this.crowdDifficultyRate = crowdDifficultyRate; }
    public Map<String, Integer> getCrowdVotes() { return crowdVotes; }
    public void setCrowdVotes(Map<String, Integer> crowdVotes) { this.crowdVotes = crowdVotes; }
    public String getMyVote() { return myVote; }
    public void setMyVote(String myVote) { this.myVote = myVote; }
    public String getMasteryStatus() { return masteryStatus; }
    public void setMasteryStatus(String masteryStatus) { this.masteryStatus = masteryStatus; }
```

- [ ] **Step 6: 重写 RelatedQuestionResponse**

Overwrite `model/response/question/RelatedQuestionResponse.java`（去掉 level/matchType/reason，改为同专题字段）：

```java
package org.example.kairos.model.response.question;

import java.util.List;

/** 同专题关系项(严格同 学校+研究科+专业+科目)。字段对齐前端 RelatedQuestion。 */
public class RelatedQuestionResponse {
    private String id;
    private String title;
    private String universityId;
    private String universityName;
    private Integer year;
    private String subject;
    private String subjectCode;
    private String questionNo;
    private List<String> knowledgePoints;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getUniversityId() { return universityId; }
    public void setUniversityId(String universityId) { this.universityId = universityId; }
    public String getUniversityName() { return universityName; }
    public void setUniversityName(String universityName) { this.universityName = universityName; }
    public Integer getYear() { return year; }
    public void setYear(Integer year) { this.year = year; }
    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }
    public String getSubjectCode() { return subjectCode; }
    public void setSubjectCode(String subjectCode) { this.subjectCode = subjectCode; }
    public String getQuestionNo() { return questionNo; }
    public void setQuestionNo(String questionNo) { this.questionNo = questionNo; }
    public List<String> getKnowledgePoints() { return knowledgePoints; }
    public void setKnowledgePoints(List<String> knowledgePoints) { this.knowledgePoints = knowledgePoints; }
}
```

- [ ] **Step 7: 编译（预期失败：QuestionQueryServiceImpl.getRelated 还在 set 旧字段）**

Run: `cd Kairos-kakomon-server && ./mvnw -q compile`
Expected: FAIL — `QuestionQueryServiceImpl.java:102` 附近 `setLevel/setMatchType/setReason` 找不到方法。这是预期的，Task 8 修复。

> 说明：本任务与 Task 8 是同一编译单元的两半；DTO 先改会短暂破坏 `getRelated`。若用 subagent 逐任务门禁，请将 Task 6 与 Task 8 合并为一次提交/一次门禁。执行者可在此不提交，直接进入 Task 8 后统一编译+提交。

- [ ] **Step 8: 提交 DTO（与 Task 8 一起过门禁，见下）**

暂不单独提交；进入 Task 8。

---

## Task 7: QuestionMutationService（投票 upsert+重算、掌握 upsert）

**Files:**
- Create: `Kairos-kakomon-server/src/main/java/org/example/kairos/service/question/QuestionMutationService.java`
- Create: `Kairos-kakomon-server/src/main/java/org/example/kairos/service/question/impl/QuestionMutationServiceImpl.java`

**Interfaces:**
- Consumes: mappers from Task 3/4；`ResultCode` from Task 2；DTO from Task 6；`QuestionMapper.findByCode/updateCrowd`。
- Produces:
  - `QuestionMutationService.vote(userId:Long, code:String, vote:String) : DifficultyVoteResult`
  - `QuestionMutationService.setMastery(userId:Long, code:String, masteryStatus:String) : MasteryResult`
- 供 Task 8 controller 用。

- [ ] **Step 1: 写接口**

Create `service/question/QuestionMutationService.java`:

```java
package org.example.kairos.service.question;

import org.example.kairos.model.response.question.DifficultyVoteResult;
import org.example.kairos.model.response.question.MasteryResult;

/** 题目用户维度写服务(投票 / 掌握)。 */
public interface QuestionMutationService {
    DifficultyVoteResult vote(Long userId, String code, String vote);

    MasteryResult setMastery(Long userId, String code, String masteryStatus);
}
```

- [ ] **Step 2: 写实现**

Create `service/question/impl/QuestionMutationServiceImpl.java`:

```java
package org.example.kairos.service.question.impl;

import org.example.kairos.common.ResultCode;
import org.example.kairos.common.exception.BizException;
import org.example.kairos.entity.QuestionEntity;
import org.example.kairos.mapper.question.QuestionDifficultyVoteMapper;
import org.example.kairos.mapper.question.QuestionMapper;
import org.example.kairos.mapper.question.QuestionUserMasteryMapper;
import org.example.kairos.model.response.question.DifficultyVoteResult;
import org.example.kairos.model.response.question.MasteryResult;
import org.example.kairos.service.question.QuestionMutationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.ObjectMapper;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/** 投票走 upsert 后重算 crowd 缓存; 掌握走 upsert。 */
@Service
public class QuestionMutationServiceImpl implements QuestionMutationService {

    private static final Set<String> VALID_VOTES = Set.of("easy", "medium", "hard");
    private static final Set<String> VALID_MASTERY = Set.of("mastered", "unclear", "wrong");

    @Autowired private QuestionMapper questionMapper;
    @Autowired private QuestionDifficultyVoteMapper voteMapper;
    @Autowired private QuestionUserMasteryMapper masteryMapper;
    @Autowired private ObjectMapper objectMapper;

    @Override
    @Transactional
    public DifficultyVoteResult vote(Long userId, String code, String vote) {
        if (vote == null || !VALID_VOTES.contains(vote)) {
            throw new BizException(ResultCode.INVALID_DIFFICULTY_VOTE);
        }
        QuestionEntity q = questionMapper.findByCode(code);
        if (q == null) throw new BizException(ResultCode.QUESTION_NOT_FOUND);

        voteMapper.upsert(userId, code, vote);

        // 重新聚合三桶
        Map<String, Integer> counts = new LinkedHashMap<>();
        counts.put("easy", 0);
        counts.put("medium", 0);
        counts.put("hard", 0);
        List<Map<String, Object>> rows = voteMapper.countGroupByVote(code);
        for (Map<String, Object> row : rows) {
            String v = (String) row.get("vote");
            Number cnt = (Number) row.get("cnt");
            if (counts.containsKey(v)) counts.put(v, cnt.intValue());
        }
        int total = counts.get("easy") + counts.get("medium") + counts.get("hard");
        BigDecimal rate = total == 0 ? null
                : BigDecimal.valueOf(counts.get("hard")).divide(BigDecimal.valueOf(total), 3, RoundingMode.HALF_UP);

        String votesJson = objectMapper.writeValueAsString(counts);
        questionMapper.updateCrowd(code, rate, votesJson);

        DifficultyVoteResult res = new DifficultyVoteResult();
        res.setQuestionId(code);
        res.setVote(vote);
        res.setCrowdVotes(counts);
        res.setCrowdDifficultyRate(rate);
        return res;
    }

    @Override
    @Transactional
    public MasteryResult setMastery(Long userId, String code, String masteryStatus) {
        if (masteryStatus == null || !VALID_MASTERY.contains(masteryStatus)) {
            throw new BizException(ResultCode.INVALID_MASTERY_STATUS);
        }
        QuestionEntity q = questionMapper.findByCode(code);
        if (q == null) throw new BizException(ResultCode.QUESTION_NOT_FOUND);

        masteryMapper.upsert(userId, code, masteryStatus);

        MasteryResult res = new MasteryResult();
        res.setQuestionId(code);
        res.setMasteryStatus(masteryStatus);
        res.setWeakPointsUpdated(false); // 弱点地图迁后端不在本次范围
        return res;
    }
}
```

> 注：`objectMapper.writeValueAsString` 在 `tools.jackson`（Jackson 3）下不抛受检异常，无需 try/catch。若编译报未处理异常，用 try/catch 包裹并降级为 `"{}"`。

- [ ] **Step 3: 提交点（与 Task 6、Task 8 合并门禁）**

进入 Task 8，一起编译提交。

---

## Task 8: 改 QuestionQueryServiceImpl.getRelated + detail 补字段 + Controller 端点与登录态

**Files:**
- Modify: `Kairos-kakomon-server/src/main/java/org/example/kairos/service/question/QuestionQueryService.java`
- Modify: `Kairos-kakomon-server/src/main/java/org/example/kairos/service/question/impl/QuestionQueryServiceImpl.java`
- Modify: `Kairos-kakomon-server/src/main/java/org/example/kairos/web/question/QuestionController.java`

**Interfaces:**
- Consumes: `findSameTopic`(Task 5)、`UniversityMapper.findByCode`、`QuestionMapper.findCrowdVotes`(Task 3)、`QuestionDifficultyVoteMapper.findUserVote`(Task 3)、`QuestionUserMasteryMapper.findUserMastery`(Task 4)、`QuestionMutationService`(Task 7)、DTO(Task 6)。
- Produces: 最终 4 个 HTTP 端点（见契约冻结）。

- [ ] **Step 1: getByCode 增加 userId 参数（接口）**

In `service/question/QuestionQueryService.java`，把 `getByCode(String code)` 改签名为：

```java
    QuestionResponse getByCode(String code, Long userId);
```

（`getRelated(String code)` 签名不变。）

- [ ] **Step 2: 改 QuestionQueryServiceImpl**

编辑 `service/question/impl/QuestionQueryServiceImpl.java`：

(a) 顶部注入新依赖，在 `@Autowired private ObjectMapper objectMapper;`（第 37 行）后加：

```java
    @Autowired private org.example.kairos.mapper.dict.UniversityMapper universityMapper;
    @Autowired private org.example.kairos.mapper.question.QuestionDifficultyVoteMapper voteMapper;
    @Autowired private org.example.kairos.mapper.question.QuestionUserMasteryMapper masteryMapper;
```

顶部 import 区加：

```java
import org.example.kairos.entity.UniversityEntity;
import tools.jackson.core.type.TypeReference;   // 已有则不重复
import java.util.LinkedHashMap;
```

（`TypeReference`、`java.util.Map`、`java.util.List` 已 import；`LinkedHashMap` 需新增。）

(b) 替换 `getByCode`（第 66-89 行）为带 userId + 众包/掌握字段的版本：

```java
    @Override
    public QuestionResponse getByCode(String code, Long userId) {
        QuestionEntity q = questionMapper.findByCode(code);
        if (q == null) throw new BizException(ResultCode.QUESTION_NOT_FOUND);
        var names = subjectNameMap();
        QuestionResponse r = new QuestionResponse();
        r.setId(q.getCode());
        r.setPaperId(q.getPaperCode());
        r.setUniversityId(q.getUniversityCode());
        r.setGraduateSchool(q.getGradSchoolCode());
        r.setMajorId(q.getMajorCode());
        r.setYear(q.getYear());
        r.setSubjectCode(q.getSubjectCode());
        r.setSubject(names.getOrDefault(q.getSubjectCode(), q.getSubjectCode()));
        r.setQuestionNo(q.getQuestionNo());
        r.setTitle(q.getTitle());
        r.setOrderIndex(q.getOrderIndex());
        r.setContentBlocks(parseBlocks(q.getContentBlocks()));
        r.setBodyText(q.getBodyText());
        r.setDifficultyLabel(q.getDifficultyLabel());
        r.setDifficultyLevel(q.getDifficultyLevel());
        r.setKnowledgePoints(questionMapper.findKnowledgePoints(code));
        r.setCrowdDifficultyRate(q.getCrowdDifficultyRate());
        r.setCrowdVotes(parseCrowdVotes(q.getCrowdVotes()));
        r.setMyVote(voteMapper.findUserVote(userId, code));
        r.setMasteryStatus(masteryMapper.findUserMastery(userId, code));
        return r;
    }

    private Map<String, Integer> parseCrowdVotes(String json) {
        Map<String, Integer> base = new LinkedHashMap<>();
        base.put("easy", 0);
        base.put("medium", 0);
        base.put("hard", 0);
        if (json == null || json.isBlank()) return base;
        try {
            Map<String, Integer> parsed = objectMapper.readValue(json, new TypeReference<Map<String, Integer>>() {});
            for (String k : base.keySet()) if (parsed.get(k) != null) base.put(k, parsed.get(k));
        } catch (Exception ignore) { /* 降级为全 0 */ }
        return base;
    }
```

(c) 替换 `getRelated`（第 91-108 行）为 findSameTopic 版本：

```java
    @Override
    public List<RelatedQuestionResponse> getRelated(String code) {
        QuestionEntity src = questionMapper.findByCode(code);
        if (src == null) return new ArrayList<>();
        var names = subjectNameMap();
        List<QuestionEntity> rows = questionMapper.findSameTopic(
                code, src.getUniversityCode(), src.getGradSchoolCode(),
                src.getMajorCode(), src.getSubjectCode(), 6);
        List<RelatedQuestionResponse> out = new ArrayList<>();
        for (QuestionEntity q : rows) {
            RelatedQuestionResponse r = new RelatedQuestionResponse();
            r.setId(q.getCode());
            r.setTitle(q.getTitle());
            r.setUniversityId(q.getUniversityCode());
            UniversityEntity u = universityMapper.findByCode(q.getUniversityCode());
            r.setUniversityName(u != null ? u.getNameCn() : q.getUniversityCode());
            r.setYear(q.getYear());
            r.setSubjectCode(q.getSubjectCode());
            r.setSubject(names.getOrDefault(q.getSubjectCode(), q.getSubjectCode()));
            r.setQuestionNo(q.getQuestionNo());
            r.setKnowledgePoints(questionMapper.findKnowledgePoints(q.getCode()));
            out.add(r);
        }
        return out;
    }
```

(d) 删掉不再使用的 `QuestionRelationMapper relationMapper` 注入（第 35 行）与其 import（第 8、12 行 `QuestionRelationEntity`、`QuestionRelationMapper`）。`QuestionRelationMapper`/XML 文件本身保留（休眠）。

- [ ] **Step 3: 改 QuestionController（端点 + 登录态下沉）**

Overwrite `web/question/QuestionController.java`:

```java
package org.example.kairos.web.question;

import jakarta.validation.Valid;
import org.example.kairos.common.Result;
import org.example.kairos.gateway.annotation.CurrentUser;
import org.example.kairos.gateway.annotation.PublicApi;
import org.example.kairos.model.bo.UserSession;
import org.example.kairos.model.request.question.DifficultyVoteRequest;
import org.example.kairos.model.request.question.MasteryRequest;
import org.example.kairos.model.response.question.DifficultyVoteResult;
import org.example.kairos.model.response.question.MasteryResult;
import org.example.kairos.model.response.question.QuestionListResponse;
import org.example.kairos.model.response.question.QuestionResponse;
import org.example.kairos.model.response.question.RelatedQuestionResponse;
import org.example.kairos.service.question.QuestionMutationService;
import org.example.kairos.service.question.QuestionQueryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 题目接口。列表/同专题公开只读; 详情与写操作(投票/掌握)强制登录。
 */
@RestController
@RequestMapping("/api")
public class QuestionController {

    @Autowired private QuestionQueryService questionQueryService;
    @Autowired private QuestionMutationService questionMutationService;

    /** 多条件分页筛选大问(列表不含 content_blocks)。公开。 */
    @PublicApi
    @GetMapping("/questions")
    public Result<QuestionListResponse> list(
            @RequestParam(required = false) String universityId,
            @RequestParam(required = false) String graduateSchool,
            @RequestParam(required = false) String majorId,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) String subjectCode,
            @RequestParam(required = false) String knowledgePoint,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int pageSize) {
        return Result.ok(questionQueryService.list(universityId, graduateSchool, majorId, year, subjectCode,
                knowledgePoint, keyword, page, pageSize));
    }

    /** 单个大问详情(含 content_blocks + 当前用户 myVote/masteryStatus)。强制登录。 */
    @GetMapping("/questions/{code}")
    public Result<QuestionResponse> detail(@CurrentUser UserSession s, @PathVariable String code) {
        return Result.ok(questionQueryService.getByCode(code, s.getUserId()));
    }

    /** 同专题(严格同 学校+研究科+专业+科目)。公开。 */
    @PublicApi
    @GetMapping("/questions/{code}/related")
    public Result<List<RelatedQuestionResponse>> related(@PathVariable String code) {
        return Result.ok(questionQueryService.getRelated(code));
    }

    /** 难度投票(可改投)。强制登录。 */
    @PostMapping("/questions/{code}/difficulty-vote")
    public Result<DifficultyVoteResult> vote(@CurrentUser UserSession s, @PathVariable String code,
                                             @RequestBody @Valid DifficultyVoteRequest req) {
        return Result.ok(questionMutationService.vote(s.getUserId(), code, req.getVote()));
    }

    /** 掌握自评。强制登录。 */
    @PutMapping("/questions/{code}/mastery")
    public Result<MasteryResult> mastery(@CurrentUser UserSession s, @PathVariable String code,
                                         @RequestBody @Valid MasteryRequest req) {
        return Result.ok(questionMutationService.setMastery(s.getUserId(), code, req.getMasteryStatus()));
    }
}
```

- [ ] **Step 4: 编译（Task 6+7+8 一起过）**

Run: `cd Kairos-kakomon-server && ./mvnw -q compile`
Expected: BUILD SUCCESS

若报 `getByCode` 旧调用点（如 recommendations/其它 service）编译错，grep 修正：
Run: `grep -rn "getByCode(" Kairos-kakomon-server/src/main/java | grep -v QuestionQueryService`
预期：只有 `QuestionMapper.findByCode` 之类，无对 `QuestionQueryService.getByCode` 的旧单参调用。若有，补 `, userId`。

- [ ] **Step 5: 契约自检**

Run: `grep -nE "masteryStatus|difficulty-vote|/related|myVote|crowdVotes" Kairos-kakomon-server/src/main/java/org/example/kairos/web/question/QuestionController.java Kairos-kakomon-server/src/main/java/org/example/kairos/model/response/question/QuestionResponse.java`
Expected: 端点路径与字段名与「契约冻结」一致。

- [ ] **Step 6: Commit（Task 6+7+8）**

```bash
git add Kairos-kakomon-server/src/main/java/org/example/kairos/model/request/question/ \
        Kairos-kakomon-server/src/main/java/org/example/kairos/model/response/question/DifficultyVoteResult.java \
        Kairos-kakomon-server/src/main/java/org/example/kairos/model/response/question/MasteryResult.java \
        Kairos-kakomon-server/src/main/java/org/example/kairos/model/response/question/QuestionResponse.java \
        Kairos-kakomon-server/src/main/java/org/example/kairos/model/response/question/RelatedQuestionResponse.java \
        Kairos-kakomon-server/src/main/java/org/example/kairos/service/question/ \
        Kairos-kakomon-server/src/main/java/org/example/kairos/web/question/QuestionController.java
git commit -m "feat(be): 题目详情补众包/掌握字段, 同专题查询, 投票/掌握写端点(强制登录)"
```

---

## Task 9: 前端 API 层对齐后端契约

**Files:**
- Modify: `Kairos-kakomon/src/types/question.ts`
- Modify: `Kairos-kakomon/src/api/questions.ts`

**Interfaces:**
- Consumes: 后端契约（Task 8）。
- Produces:
  - `RelatedQuestion` 类型改为 `{ id, title, universityId, universityName, year, subject, subjectCode, questionNo, knowledgePoints }`
  - `getRelatedQuestions(id) : Promise<RelatedQuestion[]>`（返回类型从 `RelatedQuestionsResponse` 简化为数组）
  - `voteQuestionDifficulty(id, vote:CrowdVoteValue) : Promise<{questionId, vote, crowdVotes, crowdDifficultyRate}>`
  - `updateQuestionMastery` 返回不变
  - `detailToQuestion` 映射新增 `crowdVotes/masteryStatus/myVote`；`listItemToQuestion` 的 `crowdDifficultyRate` 读真值

- [ ] **Step 1: 改 RelatedQuestion 类型**

In `src/types/question.ts`，替换 `RelatedQuestion` 接口（第 55-66 行）为：

```typescript
export interface RelatedQuestion {
  id: string;
  title: string;
  universityId: string;
  universityName: string;
  year: number;
  subject: string;
  subjectCode: string;
  questionNo: string;
  knowledgePoints: string[];
}
```

同文件在 `KakomonQuestion` 里新增可选字段 `myVote`（详情返回当前用户票）。在第 27 行 `masteryStatus?: MasteryStatus | null;` 后加：

```typescript
  myVote?: 'easy' | 'medium' | 'hard' | null;
```

- [ ] **Step 2: 改 questions.ts 的 raw 类型与映射**

In `src/api/questions.ts`：

(a) 替换 `RelatedRaw`（第 36-42 行）为：

```typescript
interface RelatedRaw {
  id: string;
  title: string;
  universityId: string;
  universityName: string;
  year: number;
  subject: string;
  subjectCode: string;
  questionNo: string;
  knowledgePoints?: string[];
}
```

(b) `QuestionDetailRaw`（第 31-34 行）扩展众包/掌握字段。替换为：

```typescript
interface QuestionDetailRaw extends QuestionListItemRaw {
  contentBlocks?: KakomonQuestion['contentBlocks'];
  bodyText?: string;
  crowdDifficultyRate?: number;
  crowdVotes?: { easy: number; medium: number; hard: number };
  myVote?: 'easy' | 'medium' | 'hard' | null;
  masteryStatus?: MasteryStatus | null;
}
```

并在 `QuestionListItemRaw`（第 13-30 行内）新增 `crowdDifficultyRate?: number`（后端**列表** DTO `QuestionListItemResponse` 目前不含该列，故列表场景恒为 `undefined`→`?? 0`；**详情** DTO 才返回真值。加此可选字段是为让 `listItemToQuestion` 能安全读取）。在 `difficultyLabel?: string;` 附近加：

```typescript
  crowdDifficultyRate?: number;
```

(c) `listItemToQuestion`（第 45-63 行）把 `crowdDifficultyRate: 0` 改为读真值：

```typescript
    crowdDifficultyRate: raw.crowdDifficultyRate ?? 0,
```

(d) 替换 `detailToQuestion`（第 65-71 行）为：

```typescript
function detailToQuestion(raw: QuestionDetailRaw): KakomonQuestion {
  return {
    ...listItemToQuestion(raw),
    contentBlocks: raw.contentBlocks,
    bodyText: raw.bodyText,
    crowdDifficultyRate: raw.crowdDifficultyRate ?? 0,
    crowdVotes: raw.crowdVotes,
    myVote: raw.myVote ?? null,
    masteryStatus: raw.masteryStatus ?? null,
  };
}
```

(e) 替换 `relatedToFront`（第 73-88 行）为直通映射：

```typescript
function relatedToFront(raw: RelatedRaw): RelatedQuestion {
  return {
    id: raw.id,
    title: raw.title,
    universityId: raw.universityId,
    universityName: raw.universityName,
    year: raw.year,
    subject: raw.subject,
    subjectCode: raw.subjectCode,
    questionNo: raw.questionNo,
    knowledgePoints: raw.knowledgePoints ?? [],
  };
}
```

(f) 删除 `RelatedQuestionsResponse` 接口（第 108-112 行）。替换 `getRelatedQuestions`（第 152-156 行）为返回数组：

```typescript
export async function getRelatedQuestions(id: string): Promise<RelatedQuestion[]> {
  const raw = await apiRequest<RelatedRaw[]>(`/api/questions/${encodeURIComponent(id)}/related`);
  return (raw ?? []).map(relatedToFront);
}
```

(g) 收紧投票值类型。文件顶部 import 区下方加：

```typescript
export type CrowdVoteValue = 'easy' | 'medium' | 'hard';
```

替换 `voteQuestionDifficulty`（第 168-176 行）为：

```typescript
export async function voteQuestionDifficulty(
  id: string,
  vote: CrowdVoteValue,
): Promise<{ questionId: string; vote: CrowdVoteValue; crowdVotes: { easy: number; medium: number; hard: number }; crowdDifficultyRate: number | null }> {
  return apiRequest(`/api/questions/${encodeURIComponent(id)}/difficulty-vote`, {
    method: 'POST',
    body: { vote },
  });
}
```

若 `RelatedLevel`/`DifficultyLevel` 因移除而变成未用 import，删掉未用符号。具体：`src/api/questions.ts` 第 7 行的 `RelatedLevel` import 在新的 `relatedToFront`（不再有 `level` 映射）下已无用，删除该 import 行；`DifficultyLevel` 仍被 `QuestionListItemRaw.difficultyLevel` 使用，保留。`getRelatedQuestions` 的旧 `level3Total/isPro` 无任何消费方（已确认仅此文件定义），随 `RelatedQuestionsResponse` 删除即可。

- [ ] **Step 3: 门禁（此时详情页仍引用旧结构，type-check 预期报错，Task 10 修）**

Run: `cd Kairos-kakomon && npx tsc --noEmit 2>&1 | head -20`
Expected: 仅 `app/questions/[id].tsx` 相关报错（`relatedQuestions`、`getRelatedQuestions().items`、`level` 等）；`src/api/questions.ts` 与 `src/types/question.ts` 自身无错。

- [ ] **Step 4: 与 Task 10 合并提交**

进入 Task 10。

---

## Task 10: 详情页 — 删两块 + 同专题接后端 + 掌握/投票双写

**Files:**
- Modify: `Kairos-kakomon/app/questions/[id].tsx`

**Interfaces:**
- Consumes: `getRelatedQuestions`(数组)、`voteQuestionDifficulty`、`updateQuestionMastery`、`CrowdVoteValue`（Task 9）；`useQueryClient`（TanStack）。

- [ ] **Step 1: 引入依赖 + 去除 recommend/forum/related 相关 import**

In `app/questions/[id].tsx`:
- 第 14 行 import 改为含 `useQueryClient`：`import { useQuery, useQueryClient } from '@tanstack/react-query';`
- 第 15 行 import 扩展：`import { getQuestion, getRelatedQuestions, voteQuestionDifficulty, updateQuestionMastery } from '@/api/questions';`
- 删第 28 行 `import { recommendRelated } from '@/utils/recommend';`（保留 `recommend.ts` 文件；wrong-book 仍用）。
- 第 30 行类型 import 去掉 `RelatedQuestion`（改用 `getRelatedQuestions` 的返回类型）与不再需要的符号。改为：`import type { KakomonQuestion, MasteryStatus } from '@/types/question';`
- 第 32 行 `type CrowdVote = 'easy' | 'medium' | 'hard' | null;` 保留（本地高亮用）。

- [ ] **Step 2: 数据层——同专题走 react-query，删 recommend/related 派生**

替换第 307-327 行区块（`recommended` useMemo + crowdVotes 派生 + relatedQuestions 拆分）为：

```typescript
  const queryClient = useQueryClient();

  // 同专题练习：后端严格同 学校+研究科+专业+科目, 知识点重合优先
  const relatedQuery = useQuery({
    queryKey: ['question-related', question.id],
    queryFn: () => getRelatedQuestions(question.id),
    enabled: !!question.id,
    initialData: [],
  });
  const recommended = relatedQuery.data ?? [];

  const crowdVotes = question.crowdVotes ?? { easy: 0, medium: 0, hard: 0 };
  const totalVotes = crowdVotes.easy + crowdVotes.medium + crowdVotes.hard;
  const hardPct = totalVotes ? Math.round((crowdVotes.hard / totalVotes) * 100) : 0;
  const easyPct = totalVotes ? Math.round((crowdVotes.easy / totalVotes) * 100) : 0;
  const mediumPct = totalVotes ? Math.round((crowdVotes.medium / totalVotes) * 100) : 0;
```

（删掉 `lvl1/lvl2/lvl3` 与旧 `recommendRelated` 调用。）

- [ ] **Step 3: crowdVote 初值取 myVote；掌握初值已用 masteryStatus**

第 238 行 `const [crowdVote, setCrowdVote] = useState<CrowdVote>(null);` 改为：

```typescript
  const [crowdVote, setCrowdVote] = useState<CrowdVote>(question.myVote ?? null);
```

在第 255-265 行的 `useEffect([question.id])` 里，`setMastery(...)` 之后加一行同步票：

```typescript
    setCrowdVote(question.myVote ?? null);
```

- [ ] **Step 4: handleSetMastery 双写后端**

替换第 302-305 行 `handleSetMastery`：

```typescript
  async function handleSetMastery(result: MasteryStatus) {
    setMastery(result);
    if (attemptIdRef.current) setAttemptResult(attemptIdRef.current, result); // 本地: 错题本/弱点地图
    try {
      await updateQuestionMastery(question.id, result); // 后端持久化
      queryClient.setQueryData(['question', question.id], (old: KakomonQuestion | undefined) =>
        old ? { ...old, masteryStatus: result } : old);
    } catch { /* 网络失败不打断本地交互 */ }
  }
```

- [ ] **Step 5: 投票调后端**

替换 crowd 投票按钮的 `onPress`（第 559 行 `onPress={() => setCrowdVote(v.k)}`）为：

```typescript
                    onPress={async () => {
                      if (!v.k) return;
                      setCrowdVote(v.k); // 乐观高亮
                      try {
                        const res = await voteQuestionDifficulty(question.id, v.k);
                        queryClient.setQueryData(['question', question.id], (old: KakomonQuestion | undefined) =>
                          old ? { ...old, crowdVotes: res.crowdVotes, myVote: res.vote } : old);
                      } catch { /* 失败保留乐观值, 下次进入以后端为准 */ }
                    }}
```

- [ ] **Step 6: 删「举一反三」整块 + relatedGate 相关**

- 删第 693-758 行 section ⑧⑨⑩（举一反三）整块。
- 删第 200-204 行 `RELATED_LEVEL_COLORS`。
- 删第 240 行 `const [relatedGate, setRelatedGate] = useState<RelatedQuestion | null>(null);`。
- 删第 230-231 行 `graduateSchoolFor`（仅举一反三用）。
- 删 `relatedGate` 对应的 `AdGateModal`（约第 829-841 行，`visible={!!relatedGate}` 那个）。
- 删失效样式 `relatedGroup/relatedHeader/relatedCard/relatedCardTop/relatedCardMeta/relatedUni/relatedQno/relatedConf/relatedTitle/relatedReason/relatedLockBadge/relatedLockText/levelBadge/levelBadgeText/levelLabel/levelDesc`（在 makeStyles 内，grep 确认无其它引用后删）。

> 注：`同专题练习`（③.5）的卡片用 `recCard/recTop/recUni/recTitle/recTags/recTag/recTagText` 样式与 `relatedLockBadge/relatedLockText`。**`relatedLockBadge/relatedLockText` 被 ③.5 复用**（第 517-520 行），删样式前 grep：`grep -n "relatedLockBadge\|relatedLockText" app/questions/[id].tsx`，若 ③.5 仍用则保留这两个。

- [ ] **Step 7: 删两处论坛入口**

- 删第 760-773 行 section ⑪（论坛内联卡片）。
- 删第 800-826 行整个 sticky bar（`SHOW_AI=false` 分支即「去论坛讨论」按钮），连同其外层 `<View style={styles.stickyBar}>`。
- 删第 775 行 `<View style={{ height: 100 }} />`（为 sticky bar 预留的底部占位）。
- 删失效样式 `stickyBar/forumCard/forumText/forumTitle/forumExcerpt/forumBtn/forumBtnText/askAiBtn/askAiBtnText/quotaBadge/quotaBadgeText`（grep 确认 SHOW_AI 分支也不再需要——因 SHOW_AI 恒 false，`askAiBtn` 等仅出现在已删的 sticky bar 内）。

- [ ] **Step 8: 更新 ③.5 卡片数据源字段**

③.5「同专题练习」卡片（第 502-533 行）此前遍历 `recommended`（`KakomonQuestion[]`），现 `recommended` 为 `RelatedQuestion[]`。核对字段：
- `rq.universityId`、`rq.year`、`rq.title`、`rq.knowledgePoints` 均在新 `RelatedQuestion` 上 → 无需改。
- `KAKOMON_UNIVERSITIES.find(u => u.id === rq.universityId)` 找不到时用 `rq.universityName` 兜底：把第 503 行

```typescript
                const ru = KAKOMON_UNIVERSITIES.find((u) => u.id === rq.universityId)!;
```

改为：

```typescript
                const ru = KAKOMON_UNIVERSITIES.find((u) => u.id === rq.universityId);
                const ruShort = ru?.short ?? rq.universityName;
```

并把卡片内 `{ru?.short}`（第 515 行）改为 `{ruShort}`。`canAccessQuestion` 调用的 `gradSchool` 参数：③.5 用 `rq.graduateSchool`——新类型无此字段，改传 `undefined`（同专题必同校同研究科，门禁按 university+year 判定即可）。把第 504 行 `gradSchool: rq.graduateSchool` 改为 `gradSchool: question.graduateSchool`（同专题与源题同研究科）。

- [ ] **Step 9: 前端门禁**

Run: `cd Kairos-kakomon && npm run type-check`
Expected: 0 error（若报未用变量/import，删除之）。

Run: `cd Kairos-kakomon && npm run lint`
Expected: 0 error（warning 不阻断，但新引入的应清理）。

- [ ] **Step 10: Commit（Task 9 + 10）**

```bash
git add Kairos-kakomon/src/types/question.ts Kairos-kakomon/src/api/questions.ts Kairos-kakomon/app/questions/[id].tsx
git commit -m "feat(fe): 详情页删论坛/举一反三, 同专题接后端, 投票/掌握上后端双写"
```

---

## Task 11: 更新 API-contract 文档

**Files:**
- Modify: `docs/02-architecture/API-contract.md`

**Interfaces:**
- Consumes: 最终 4 端点契约。

- [ ] **Step 1: 找到题目端点段落**

Run: `grep -n "questions" docs/02-architecture/API-contract.md`
Expected: 定位现有 `/api/questions*` 描述位置。

- [ ] **Step 2: 更新四个端点描述**

在题目端点段落，按「契约冻结」更新/新增：
- `GET /api/questions/{code}`：标注**需登录**；响应新增 `crowdDifficultyRate`、`crowdVotes{easy,medium,hard}`、`myVote`、`masteryStatus`。
- `GET /api/questions/{code}/related`：语义改为「同专题（同 学校+研究科+专业+科目，知识点重合优先）」；响应项字段 `{id,title,universityId,universityName,year,subject,subjectCode,questionNo,knowledgePoints}`。
- 新增 `POST /api/questions/{code}/difficulty-vote`（需登录）：body `{vote}`，resp `{questionId,vote,crowdVotes,crowdDifficultyRate}`；错误码 `10603`。
- 新增 `PUT /api/questions/{code}/mastery`（需登录）：body `{masteryStatus}`，resp `{questionId,masteryStatus,weakPointsUpdated}`；错误码 `10604`。

（按该文件现有格式书写；此处不强制具体排版。）

- [ ] **Step 3: Commit**

```bash
git add docs/02-architecture/API-contract.md
git commit -m "docs(api): 更新题目详情/同专题/投票/掌握端点契约"
```

---

## Task 12: 联调验证清单（追加到 TASKS.md，标注待人工）

**Files:**
- Modify: `Kairos-kakomon/TASKS.md`

- [ ] **Step 1: 追加验证清单**

在 `Kairos-kakomon/TASKS.md` 末尾追加（不改写既有行）一段 checklist，列出：
- [ ] 后端 `./mvnw compile` 通过
- [ ] 前端 `npm run type-check` / `npm run lint` 通过
- [ ] 待联调：初始化 DB 到 V1_9；`GET /questions/{code}` 未登录返回 401、登录后带 myVote/masteryStatus
- [ ] 待联调：投票落库、改投时旧桶-1/新桶+1、`crowd_difficulty_rate = hard/total`
- [ ] 待联调：掌握 upsert，换设备/清 AsyncStorage 后仍读回
- [ ] 待联调：同专题只返回同 4 维其它题、知识点重合排序、卡片大学/年份/科目非空
- 每条完成后追 `✅ 完成于 2026-07-09`。

- [ ] **Step 2: Commit**

```bash
git add Kairos-kakomon/TASKS.md
git commit -m "docs(tasks): 题目详情改造联调验证清单"
```

---

## 依赖顺序

```
Task 1 (DB) ─┬─> Task 3 (投票 mapper) ─┐
             └─> Task 4 (掌握 mapper) ─┤
Task 2 (ResultCode) ──────────────────┤
Task 5 (findSameTopic) ───────────────┼─> Task 7 (mutation service) ─┐
Task 6 (DTO) ─────────────────────────┴──────────────────────────────┼─> Task 8 (service+controller)
                                                                       │        │
                                        Task 9 (前端 API) <────契约────┘        │
                                                    └─> Task 10 (详情页) <──────┘
                                                                Task 11 (文档) / Task 12 (TASKS)
```

Task 6+7+8 共享一次编译门禁（DTO 改动会短暂破坏 getRelated，Task 8 修复后统一编译）。Task 9+10 共享一次前端门禁（API 改动会短暂破坏详情页，Task 10 修复后统一 type-check）。
