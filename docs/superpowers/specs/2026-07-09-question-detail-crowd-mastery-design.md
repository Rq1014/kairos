# 题目详情页改造：删入口 + 同专题真数据 + 难度投票/掌握上后端 — 设计

- **日期**：2026-07-09
- **相关**：`docs/superpowers/specs/2026-07-02-topic-study-and-mock-exam-design.md`（题目/试卷存储原始设计）、`docs/superpowers/specs/2026-07-08-subject-major-dimension-design.md`（专业·科目维度化）
- **主战场**：`Kairos-kakomon/app/questions/[id].tsx`（题目详情页，868 行）+ 后端 `question` 模块 + `V1_9` 迁移

## 1. 背景与问题

从专题学习点进一道题（`app/(tabs)/study → topic-study → topic-questions → questions/[id]`）后，详情页当前有 5 处相关行为，均存在问题：

1. **论坛讨论**：两处入口（内联卡片 section ⑪ 760–773；底部 sticky bar 800–826），跳硬编码 `/forum/t1`，论坛整体是 mock。产品决定移除。
2. **举一反三**：section ⑧⑨⑩（693–758），3 级关联（同题/相似考点/跨校相似），数据来自 mock 的 `question.relatedQuestions`。产品决定移除。
3. **同专题练习**：section ③.5（491–536），数据来自 `src/utils/recommend.ts` 的 `recommendRelated()`——**纯客户端 tag-match，扫全部 mock 题，会跨校跨专业**。需改为后端真数据且限定范围。
4. **crowd_difficulty_rate / crowd_votes**：`question` 表的两个众包难度聚合列（rate=DECIMAL 0~1，votes=JSON `{easy,medium,hard}`）。当前 **seed 写死**（rate 硬编码、votes 仅一道 mock 题有），后端 `getByCode` 根本不返回它们，详情页投票按钮只改本地 React state 后丢弃。**无每用户投票表、无投票端点。**
5. **掌握情况**：section ③（431–489），我会/模糊/不会。当前只写本地 `attemptStore`（AsyncStorage），**无后端表、无端点**。前端 `updateQuestionMastery`/`voteQuestionDifficulty` API 函数已存在但零调用点。

### 当前后端实况（已核实）

- `question` 模块只读：`GET /questions`（列表）、`GET /questions/{code}`（详情）、`GET /questions/{code}/related`（读 `question_relation` 预计算边）。三者均为**类级 `@PublicApi`**（游客可访问）。
- `RelatedQuestionResponse` 只 set 了 `id/title/level/matchType/reason`，**未 set** `universityName/year/subject/questionNo/confidence` → 真数据渲染出来大学/年份/匹配度是空 —— 既有 bug。
- `QuestionMapper.xml` 的 `listCols` 已含 `crowd_difficulty_rate, crowd_votes`（查得出，只是没映射进响应 DTO）。
- 用户 id 类型 `Long`；用户表 PK `BIGINT UNSIGNED`。最新迁移 `V1_8`，本次用 `V1_9`。ResultCode 题目段 `10600~10699`（已用 10601/10602，下一个空号 10603）。

## 2. 已定决策（brainstorm 2026-07-09，用户逐条确认）

1. **同专题联系范围** = 严格同「学校 + 研究科(学院) + 专业 + 科目」，展示口径 = **同科目 + 知识点重合优先**（按共享知识点数降序，再按年份降序）。
2. **难度投票 + 掌握情况全部上后端**（新建用户维度表 + 登录态接口）。
3. **新建掌握表，本地 `attemptStore` 不动**（错题本/弱点地图/连续做题仍靠 attemptStore；掌握情况额外双写后端，两条线并存，本次不合并）。
4. **难度投票可改投**（一人一题一行，upsert）。
5. **`crowd_difficulty_rate` 口径** = `hard 票数 / 总票数`（纯 hard 占比，对应 UI「X% 用户认为偏难」）。
6. **同专题复用现有 `/related` 端点**（不新建 `/same-topic`）——举一反三删除后该端点空出，前端 `getRelatedQuestions` 已接线，改动最小；语义从「相似题」改为「同专题」，更新 API-contract 注释。
7. **详情页 `GET /questions/{code}` 改为强制登录**（把类级 `@PublicApi` 下沉到方法级，只留在 `list`/`related`）。

## 3. 分块设计

### Block 1 — 删除论坛与举一反三入口（纯前端）

文件：`app/questions/[id].tsx`

- **论坛讨论**：删内联卡片 section ⑪（760–773）；删底部整个 sticky bar 容器（800–826）；删 ScrollView 底部为 sticky bar 预留的 `height:100` 占位（775）。
- **举一反三**：删 section ⑧⑨⑩（693–758）整块。
- **连带清理**（删到无引用为止，避免留死代码/无用样式/无用 import）：
  - 举一反三相关：`question.relatedQuestions` 读取、`lvl1/lvl2/lvl3` 拆分（325–327）、`RELATED_LEVEL_COLORS`（200–204）、`relatedGate` 状态及其 `AdGateModal`（829–841）、`graduateSchoolFor`、`related*` 系列样式。
  - 论坛相关：`/forum/t1` 跳转、`forumCard/forumTitle/forumExcerpt/forumBtn/askAiBtn/quotaBadge` 等失效样式；`Share`、AI sticky 分支若仅此处使用一并清理。
- **验收**：`type-check` + `lint` 0 error；详情页不再出现「论坛」「举一反三」；页面底部无空白占位。

### Block 2 — 同专题联系走后端 + 限定 4 维范围

**后端**

- `QuestionMapper` 新增只读方法 `findSameTopic`，XML 单条 SQL（严格同 4 维，共享知识点数降序）：
  ```sql
  SELECT <listCols>, COUNT(kp.knowledge_point) AS overlap
  FROM question q
  LEFT JOIN question_knowledge_point kp
    ON kp.question_code = q.code
   AND kp.knowledge_point IN (
       SELECT knowledge_point FROM question_knowledge_point WHERE question_code = #{code})
  WHERE q.status = 1 AND q.code != #{code}
    AND q.university_code = #{universityCode}
    AND q.grad_school_code = #{gradSchoolCode}
    AND q.major_code = #{majorCode}
    AND q.subject_code = #{subjectCode}
  GROUP BY q.id
  ORDER BY overlap DESC, q.year DESC, q.order_index ASC
  LIMIT #{limit}
  ```
  注：`overlap` 仅用于排序，`listCols` 已含难度/crowd 列。`major_code` 为 NOT NULL（见 subject-major 维度化 spec），4 维全参与过滤。
- 复用端点 `GET /questions/{code}/related`：`getRelated` 实现从「读 `question_relation` 边」改为「先按 `code` 查源题拿到 4 维 → 调 `findSameTopic(code, 4维, limit=6)`」。
- **`RelatedQuestionResponse` 字段重定义**（同专题语义）：保留/新增 `id、title、universityId、universityName、year、subject、subjectCode、questionNo、knowledgePoints`；**移除** `level、matchType、reason、confidence`（相似题语义专用，同专题无意义）。
  - `universityName` 走现有大学名映射；`subject` 走 subject 字典名映射（与 `toListItem` 一致）；`knowledgePoints` 每行调 `findKnowledgePoints(code)`（喂给前端标签展示，正是排序依据的知识点）。
- `question_relation` 表 / `QuestionRelationMapper` / `QuestionRelationEntity` **保留但转休眠**（未来相似度 pipeline 预留基建，删除属破坏性且违背既有设计，不删）。`getRelated` 不再引用它。

**前端** `app/questions/[id].tsx`

- section ③.5「同专题练习」改用 react-query 调 `getRelatedQuestions(id)`（已存在 API 函数），替掉 `recommendRelated()` 的 `useMemo`。
- 删 `src/utils/recommend.ts`（唯一消费者移除）。
- 卡片渲染沿用现有样式（大学·年份 + 标题 + 知识点标签），数据换后端返回的 `RelatedQuestion[]`；知识点标签读新字段 `knowledgePoints`。空列表不渲染该块。ad-gate 判定沿用 `canAccessQuestion`（同专题题可能超出免费范围）。
- `src/api/questions.ts`：`relatedToFront` 修正——不再硬编码空串/0，改为读后端真字段（含 `knowledgePoints`）；移除 `level/matchType/reason/confidence` 相关映射；`RelatedQuestionsResponse` 里 `level===3`/`level3Total`/`isPro` 等相似题专用逻辑删除。
- `src/types/question.ts`：`RelatedQuestion` 类型改为 `{ id, title, universityId, universityName, year, subject, subjectCode, questionNo, knowledgePoints }`（去掉 `level/reason/confidence`）。

**验收**：同专题只出现同校+同研究科+同专业+同科目的其它题，按知识点重合排序；卡片大学/年份/科目/题号非空。

### Block 3 — 难度投票上后端（每用户每题一票，可改投）

**DB**（新增 `docs/05-database/sql/V1_9__question_user_dimension.sql`，含本 Block 与 Block 4 两张表）

```sql
CREATE TABLE `question_difficulty_vote` (
  `id`            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  `user_id`       BIGINT UNSIGNED NOT NULL COMMENT '用户 id',
  `question_code` VARCHAR(80)     NOT NULL COMMENT '题目 code',
  `vote`          VARCHAR(8)      NOT NULL COMMENT 'easy/medium/hard',
  `created_at`    DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`    DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_question` (`user_id`, `question_code`),
  KEY `idx_question` (`question_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='题目难度投票(每用户每题一票,可改投)';
```

- `question.crowd_votes`（JSON `{easy,medium,hard}`）与 `crowd_difficulty_rate`（DECIMAL(4,3)）保留为**汇总缓存**，改由投票实时重算，不再是种子假数。
- **汇总口径**：`crowd_votes` = 三桶各票数；`crowd_difficulty_rate = hard / total`；`total = 0` 时 rate 置 NULL（前端显示「暂无评价」）。

**后端**（`question` 模块首个写接口）

- 新增 `model/request/question/DifficultyVoteRequest`：`{ @NotBlank vote }`，校验 vote ∈ {easy,medium,hard}（非法值走 `ResultCode` 新码 `10603 INVALID_DIFFICULTY_VOTE`）。
- `POST /api/questions/{code}/difficulty-vote`，`@CurrentUser UserSession s`，方法**不加** `@PublicApi`（强制登录）。
- 写逻辑放 `QuestionMutationService`（新接口 + impl，与只读 `QuestionQueryService` 分离），`@Transactional`：
  1. 校验题存在（否则 `QUESTION_NOT_FOUND`）。
  2. upsert 投票（`INSERT ... ON DUPLICATE KEY UPDATE vote = VALUES(vote)`）。
  3. `SELECT vote, COUNT(*) FROM question_difficulty_vote WHERE question_code=? GROUP BY vote` 重新聚合。
  4. 写回 `question.crowd_votes`（序列化 JSON）+ `crowd_difficulty_rate`。
  5. 返回最新聚合 `{crowdDifficultyRate, crowdVotes, myVote}`。
- 新 mapper `QuestionDifficultyVoteMapper` + XML：`upsert`、`countGroupByVote`、`findUserVote(userId, code)`。
- `QuestionMapper` 加 `updateCrowd(code, rate, votesJson)`（回写缓存列）。

**前端** `app/questions/[id].tsx`

- 众包难度校准（538–568）+ ① metadata（394–404）：`crowdVote` 初值取 `question.myVote`；点桶调 `voteQuestionDifficulty(id, vote)`（已存在 API 函数），成功后用返回聚合刷新 react-query（`setQueryData(['question', id], ...)`）。
- 可改投：高亮当前票，再点其它桶即改（后端 upsert）。
- 未登录不可能到达详情（Block 4 决策：详情强制登录），故 `myVote` 恒有登录态。

**验收**：投票落库；改投时 crowd_votes 旧桶 -1 新桶 +1、rate 重算；多用户投票汇总正确。

### Block 4 — 掌握情况上后端（每用户每题一条最新）

**DB**（并入 `V1_9`）

```sql
CREATE TABLE `question_user_mastery` (
  `id`            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  `user_id`       BIGINT UNSIGNED NOT NULL COMMENT '用户 id',
  `question_code` VARCHAR(80)     NOT NULL COMMENT '题目 code',
  `mastery`       VARCHAR(16)     NOT NULL COMMENT 'mastered/unclear/wrong',
  `created_at`    DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`    DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_question` (`user_id`, `question_code`),
  KEY `idx_question` (`question_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户对题目的掌握自评(每用户每题一条最新)';
```

无聚合缓存（掌握是私有数据，不众包）。

**后端**

- 新增 `model/request/question/MasteryRequest`：`{ @NotBlank mastery }`，校验 ∈ {mastered,unclear,wrong}（非法走新码 `10604 INVALID_MASTERY_STATUS`）。
- `PUT /api/questions/{code}/mastery`，`@CurrentUser`，强制登录。
- `QuestionMutationService` 加 `upsertMastery`：校验题存在 → upsert → 返回最新 mastery。
- 新 mapper `QuestionUserMasteryMapper` + XML：`upsert`、`findUserMastery(userId, code)`。

**前端** `app/questions/[id].tsx`

- 掌握情况块（431–489）：`mastery` 初值取 `question.masteryStatus`；点 我会/模糊/不会 调 `updateQuestionMastery(id, status)`（已存在 API 函数），成功后刷新缓存。
- **`attemptStore` 双写保留**：`handleSetMastery`（302–305）现有 `setAttemptResult(...)` 本地记录不动（错题本/弱点地图/下一题仍靠它），**额外**加后端调用。两条线并存。
- 「下一题/选题」交互（466–487）不动。

**验收**：掌握落库；重进详情（换设备/清 AsyncStorage）仍能读回后端掌握值。

### Block 5 — 详情端点补字段 + 强制登录

- `GET /api/questions/{code}` 响应 DTO `QuestionResponse` **补** `crowdDifficultyRate`、`crowdVotes`（`{easy,medium,hard}`）、`myVote`（当前用户的票，`easy|medium|hard|null`）、`masteryStatus`（当前用户掌握，`mastered|unclear|wrong|null`）。
- `QuestionController`：类级 `@PublicApi` **下沉到方法级**——`list`、`related` 保留 `@PublicApi`（不依赖用户，游客可访问）；`detail` 去掉 → `LoginRequiredInterceptor` 强制登录，方法签名加 `@CurrentUser UserSession s`，service 用 `s.getUserId()` 查该用户的 `myVote`/`masteryStatus`。
- `POST difficulty-vote`、`PUT mastery` 天然强制登录（不加 `@PublicApi`）。
- 前端 `src/api/questions.ts`：`listItemToQuestion` 的 `crowdDifficultyRate` 默认值改为读后端真值；`detailToQuestion` 映射新增 `crowdVotes/myVote/masteryStatus`。

## 4. 端点汇总

| 端点 | 方法 | 登录 | 变更 |
|---|---|---|---|
| `/api/questions/{code}` | GET | ✅ 强制 | 补 `crowdDifficultyRate`/`crowdVotes`/`myVote`/`masteryStatus`；由公开改强制登录 |
| `/api/questions/{code}/related` | GET | 公开 | 语义「相似题」→「同专题」，改查 `findSameTopic`，填全字段，移除 level/matchType/confidence |
| `/api/questions/{code}/difficulty-vote` | POST | ✅ | 新增：upsert 投票 + 重算 crowd 缓存 |
| `/api/questions/{code}/mastery` | PUT | ✅ | 新增：upsert 掌握 |

## 5. 文件清单

**后端新增**：`V1_9__question_user_dimension.sql`（2 表）；`entity/QuestionDifficultyVoteEntity`、`entity/QuestionUserMasteryEntity`；`model/request/question/DifficultyVoteRequest`、`MasteryRequest`；`mapper/question/QuestionDifficultyVoteMapper`(+XML)、`QuestionUserMasteryMapper`(+XML)；`service/question/QuestionMutationService`(+impl)。

**后端改动**：`QuestionController`（`@PublicApi` 下沉、加 2 写方法、detail 加 `@CurrentUser`）；`QuestionMapper`(+XML)（`findSameTopic`、`updateCrowd`）；`QuestionQueryServiceImpl`（`getRelated` 改 `findSameTopic`、detail 补用户维度字段）；`model/response/question/QuestionResponse`、`RelatedQuestionResponse`（字段增删）；`ResultCode`（+`10603`、`10604`）。

**前端改动**：`app/questions/[id].tsx`（删 2 块 + 接 3 真接口 + 双写掌握）；删 `src/utils/recommend.ts`；`src/api/questions.ts`（`relatedToFront` 修 bug、`detailToQuestion` 补字段、`listItemToQuestion` crowd 默认值）；`src/types/question.ts`（`RelatedQuestion` 精简、`QuestionResponse` 侧字段确认）。

**文档**：`docs/02-architecture/API-contract.md` 更新上述 4 端点。

## 6. 验证

- 后端：`cd Kairos-kakomon-server && ./mvnw compile`（TASKS.md 约定的后端门禁）。
- 前端：`cd Kairos-kakomon && npm run type-check`（主门禁）+ `npm run lint`。
- 本环境无 DB/后端/模拟器，端到端（投票落库→重算、掌握跨设备读回、同专题 4 维查询、详情强制登录 401）标注**待联调环境人工验证**，与既有 TASKS.md 惯例一致。
- 按 CLAUDE.md 约定，动工前把 checklist 追加到 `Kairos-kakomon/TASKS.md`，逐步打勾并追 `✅ 完成于 2026-07-09`。

## 7. 范围外（本次不做）

- 错题本 / 弱点地图 / 做题记录迁后端（`attemptStore` 维持本地）。
- `question_relation` 相似度 pipeline / 向量检索（表保留休眠）。
- AI 扩展讲解、参考书对应章节（`SHOW_AI`/`SHOW_REFERENCE` 仍关闭）。
- 论坛真实化。
