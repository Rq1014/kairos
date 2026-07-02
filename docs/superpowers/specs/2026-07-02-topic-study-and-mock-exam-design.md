# 专题学习 & 模拟考试 — 题目/试卷存储与渲染设计

**日期：** 2026-07-02
**状态：** 已定稿，待实现
**参考真题：** `docs/title-example/`（东京大学 大学院入学試験問題样例）

---

## 1. 背景与目标

`专题学习`（topic-study）与 `模拟考试`（mock-exam）两个屏幕已有 UI 骨架，但题目/试卷数据仍是扁平的纯文本 mock。本设计确定：

1. 真题内容如何存储（后端 + 数据库）
2. App 端如何渲染数学/图形密集的手写体扫描件真题
3. 两个屏幕如何向真实过去问对齐
4. 是否需要引入新的组件 / 中间件

参考真题的特征（决定了以下所有设计）：
- 层级：`第N問` → `I / II / III` → `(1)(2)(3)`
- 数学密集：定积分、矩阵、常微分方程、拉普拉斯变换、复变函数
- 图形密集：电路图、曲线图、时序图、状态转移图
- **自由作答 / 证明题**（"求めよ / 示せ / 図示せよ"），非选择题
- 试卷级规则：如"6問中3問を選択"、限时 13:00–15:30

## 2. 关键决策（均经确认）

| # | 决策 | 选择 | 理由 |
|---|---|---|---|
| A | 内容存储形态 | **结构化 content_blocks**（text / math-LaTeX / image / table） | 可检索、可复制、体验最好；优于整页扫描图或纯文本 |
| B | 存储分层 | **三层**：`exam_paper → question(大问) → content_blocks(JSON)` | 忠实还原试卷级规则（选题/时长）；小问用 text 块表达，不建第四层 |
| C | 数据库 | **MySQL 8 单库** | 与现有 V1_0–V1_3 用户/计费库、MyBatis 后端一致；不分裂数据库 |
| D | 相似题/举一反三 | **预计算 `question_relation` 关系表** | 本期不上向量；边由离线 pipeline 写入，查询零向量运算 |
| E | 数学渲染 | **react-native-webview + KaTeX**（方案 A1） | 一个成熟依赖即可设备端渲染 LaTeX；避免建服务端公式转图流水线 |

### 2.1 为什么不用 PostgreSQL/pgvector、MongoDB、ES（本期）

- **PostgreSQL + pgvector**：`docs/02-architecture/question-similarity-pipeline.md` 假设此栈，但那只针对"向量"层，不应决定主库选型。已上线栈是 MySQL，双库运维是净负担。
- **MongoDB**：文档型的收益（灵活 schema）已被 MySQL 8 原生 JSON 列覆盖；我们不在 blocks 内部查询，只按规范化列筛选。为一个 JSON 字段引入整个文档库不划算。
- **ES / OpenSearch / 向量库**：留作**未来卫星索引**——当"搜索/语义相关性"成为核心卖点时再上，只读、由 pipeline 单向喂数据，绝不做主库。本期关键词检索用 MySQL `FULLTEXT ... WITH PARSER ngram`（CJK 分词）即够。

## 3. 数据模型（MySQL 8）

```
exam_paper (试卷)
  id, university_code, grad_school_code, major_code(nullable),
  year, subject,
  title,                       -- "平成29年度 大学院入学試験問題 数学"
  duration_minutes,            -- 150
  total_score(nullable),
  select_rule JSON,            -- {"total":6,"choose":3}
  instructions JSON,           -- 注意事项文本数组
  source_pdf_key(nullable), status, sort_order, created_at, updated_at
  UNIQUE(university_code, grad_school_code, year, subject)

question (大问 = 第N问)
  id, paper_id FK,
  university_code, grad_school_code, year, subject,   -- 冗余列，跨试卷筛选直查不 join
  question_no,                 -- "第1問"
  title,
  order_index,                 -- 卷内顺序
  content_blocks JSON,         -- 题干结构化内容（见 3.1）
  body_text TEXT,              -- blocks 里 text 拼接，供 FULLTEXT / AI
  difficulty_label, difficulty_level,
  crowd_difficulty_rate, crowd_votes JSON,
  status, created_at, updated_at
  FULLTEXT(title, body_text) WITH PARSER ngram

question_knowledge_point (大问 ↔ 知识点，多对多)
  question_id FK, knowledge_point          -- 建索引支撑标签过滤

question_relation (相似题/举一反三，预计算有向边)
  from_question_id FK, to_question_id FK,
  level TINYINT,               -- 1 同题 / 2 相似考点 / 3 跨校相似
  match_type,                  -- exact_question / same_point / similar_method
  reason, confidence,
  UNIQUE(from_question_id, to_question_id)
```

设计要点：
- **冗余列放在 `question`**（university_code/grad_school_code/year/subject/difficulty_level），使"按科目/年份/难度跨试卷筛选"无需 join `exam_paper`，并建 B-tree 索引。
- **小问 `(1)(2)(3)` 用 content_blocks 内的 text 块表达**，不建第四层表（契合三层决策）。

### 3.1 content_blocks 结构（存 `question.content_blocks` JSON 列）

```json
[
  { "type": "text",  "content": "以下の定積分を求めよ。" },
  { "type": "math",  "latex": "I=\\int_2^4 \\frac{dx}{\\sqrt{(x-2)(4-x)}}" },
  { "type": "text",  "content": "(1) 上式を計算せよ。" },
  { "type": "image", "url": "https://cdn/.../fig1.png", "caption": "図1" }
]
```

- 块类型枚举：`text` / `math`(LaTeX) / `image` / `table`
- `image` 块 = 手写扫描图 / 电路图 / 曲线图，存 S3，App 用 `expo-image` 显示原图

### 3.2 检索落地

| 检索类型 | 实现 |
|---|---|
| 结构化筛选（主路径） | `question` 冗余列 B-tree 索引 |
| 知识点标签过滤 | join `question_knowledge_point` |
| 关键词 / 题干检索 | `FULLTEXT(title, body_text) WITH PARSER ngram` |
| 相似题 / 举一反三 | 查 `question_relation` 一次 join，零向量运算 |
| 语义向量检索（未来） | 解耦卫星索引（OpenSearch kNN / Milvus / 只读 pgvector 副本），pipeline 单向喂数据 |

## 4. 后端 API 层

新增 `question` 特性模块（`org.example.kairos.question`），严格按 `docs/04-backend/backend-conventions.md` 目录切分，MyBatis Java mapper + XML lockstep。

```
question/
  web/         QuestionController, PaperController
  service/     QuestionService, PaperService (+ impl/)
  mapper/      QuestionMapper, PaperMapper, QuestionRelationMapper
               resources/mapper/*.xml
  model/
    request/   PaperQueryRequest, QuestionQueryRequest
    response/  PaperVO, QuestionVO, QuestionListItemVO, RelatedQuestionVO
    bo/
  entity/      ExamPaper, Question, QuestionKnowledgePoint, QuestionRelation
```

### 4.1 端点（均返回 `Result<T>` 信封，`code 0` 成功）

| Method | Path | 用途 | 前端 mock 函数 |
|---|---|---|---|
| GET | `/api/questions` | 结构化筛选+分页 | `getQuestions()` |
| GET | `/api/questions/{id}` | 单题详情（含 content_blocks） | `getQuestion()` |
| GET | `/api/questions/{id}/related` | 举一反三（查 question_relation） | `getRelatedQuestions()` |
| GET | `/api/questions/recommendations` | 基于弱点推荐 | `getQuestionRecommendations()` |
| GET | `/api/papers` | 试卷列表（模考用） | *(新增)* |
| GET | `/api/papers/{id}` | 单份试卷（选题规则/时长 + 大问列表） | *(新增)* |
| PATCH | `/api/questions/{id}/mastery` | 标记掌握状态 | `updateQuestionMastery()` |
| POST | `/api/questions/{id}/difficulty-vote` | 众包难度投票 | `voteQuestionDifficulty()` |

### 4.2 约定

- **付费门禁本期不进后端**：服务端返回全部元数据（含 papers/questions 列表与详情），锁/解锁仍由前端 `src/utils/accessPolicy.ts` 判定（与现状 mock 行为一致，本期不动计费）。这意味着 `content_blocks` 详情**不做服务端付费拦截**——前端负责在锁定态不展示、走广告闸/升级。写接口（mastery/vote）走登录态 `@CurrentUser`。
- **列表 VO 瘦身**：`/api/questions` 列表项**不返回** `content_blocks`（只回 title/no/知识点/难度等），详情页才拉 blocks，首屏更快。
- **错误码**：新增题目域 `ResultCode` 区段（104xx），`GlobalExceptionHandler` 映射，前端 `client.ts` 镜像。
- **JSON 列**（select_rule / instructions / content_blocks）：entity 用 String 存，VO 层反序列化成结构化对象回前端。
- **契约对齐**：补齐 `API-contract.md` 中 `/questions`、`/questions/{id}`、`/papers`、`/papers/{id}` 的请求/响应示例。

## 5. 前端

### 5.1 类型升级（`src/types/question.ts`，向后兼容）

旧字段（`bodyText`/`formulaPreview`）保留（deprecated 不删），增量新增：

```ts
export type ContentBlock =
  | { type: 'text';  content: string }
  | { type: 'math';  latex: string }
  | { type: 'image'; url: string; caption?: string }
  | { type: 'table'; rows: string[][]; caption?: string };

export interface KakomonQuestion {
  // …现有字段保留…
  contentBlocks?: ContentBlock[];   // 结构化题干（优先渲染）
  paperId?: string;
  orderIndex?: number;
}

export interface ExamPaper {
  id: string;
  universityId: string; graduateSchool: string; majorId?: string | null;
  year: number; subject: string;
  title: string;
  durationMinutes?: number;
  totalScore?: number | null;
  selectRule?: { total: number; choose: number };
  instructions?: string[];
  questionIds: string[];
}
```

渲染回退：有 `contentBlocks` 就用块渲染，否则退回旧 `bodyText` 纯文本。

### 5.2 数学渲染器（新组件 · 方案 A1）

新增依赖 `react-native-webview`。新建 `src/components/study/QuestionBlocks.tsx`：

- 输入 `blocks: ContentBlock[]`，拼成一段 HTML 用内嵌 KaTeX 渲染。
- `text` → 段落；`math` → KaTeX；`image` → 图；`table` → 表格。
- **KaTeX 资源本地内联**（不走 CDN，离线可用、无闪烁）。
- **WebView 自适应高度**（内部 postMessage 回传 scrollHeight），在 ScrollView 里如普通视图排版。
- **主题感知**：注入 `useColors()` 前景/背景色。
- 只在详情页 / exam-session 当前题渲染 WebView（每屏 1 个）；列表页用纯文本 title。

### 5.3 数据层

- 本阶段仍 mock：升级 `src/mocks/data.ts`，用 `docs/title-example` 东大真题填少量 `contentBlocks`，新增 `KAKOMON_PAPERS`（含 selectRule/duration/instructions）。
- 新增 `src/api/papers.ts`：`getPapers()` / `getPaper(id)`。
- 保持现有 mock 函数签名，切真后端时只把内部实现从"读 mocks"换成 `apiRequest`。

### 5.4 复用（顺手改善，限直接相关重复）

抽出 `src/components/study/SchoolRail.tsx`，消除 `topic-study.tsx` 与 `mock-exam.tsx` 重复的 `RailEntry`/`normGrad`/`gradShort`/左栏渲染（`optimization-recommendations.md` F5 已点名）。不做无关重构。

## 6. 屏幕改动

### 6.1 专题学习（`topic-study` → `topic-questions` → `questions/[id]`）
- 保持现有导航链路。
- 详情页题干区从"纯文本 + monospace 伪公式"换成 `<QuestionBlocks>` 渲染真实数学/图片；其余区块（掌握度、众包难度、举一反三、标准解析）不动。
- 列表页仍纯文本 title（不渲染 WebView）。

### 6.2 模拟考试（`mock-exam` → `exam-session`）
- `mock-exam.tsx`：年份卡数据源从"前端按 year 聚合"换成真正的 `ExamPaper`，展示**时长、选题规则（6問中3問選択）、大问数**。
- `exam-session.tsx`：
  - **倒计时**（依据 `durationMinutes`，可跳过、不强制交卷）。
  - **选做规则提示** + 答题卡标注已作答。
  - 答题区用 `<QuestionBlocks>` 渲染真实题干。
  - 保留三段式：作答 → 自评批改 → 成绩（自由作答/证明题无法自动判分，自评是正确设计）。
  - 成绩计入现有「我的」成绩曲线（`attemptStore` 不动）。

### 6.3 不做（守住范围）
- 不做自动判分；不动付费门禁 / 计费后端；不动论坛 / AI / 参考书（MVP 已隐藏）。

## 7. 分阶段落地

**Phase 1 — 前端形状先行（纯 mock）**
- 升级 types；加 `react-native-webview` + `QuestionBlocks.tsx`
- 升级 `src/mocks/data.ts`（东大样例 contentBlocks + `KAKOMON_PAPERS`）
- 抽 `SchoolRail.tsx`；改造详情页 / mock-exam / exam-session（倒计时 + 试卷信息）
- 门禁：`npm run type-check` + `npm run lint`

**Phase 2 — 后端落库（MySQL + MyBatis）**
- SQL 迁移 `V1_4__questions_schema.sql`（5 张表）+ `V1_5__seed_questions.sql`（东大样例）
- `question` 模块：entity/mapper(XML lockstep)/service/controller
- 端点 + 补齐 `API-contract.md`
- 门禁：`./mvnw compile`

**Phase 3 — 切流（mock → real）**
- `questions.ts` / `papers.ts` 内部实现换成 `apiRequest`，走 `{code,message,data}` 信封
- 门禁：`type-check` + 模拟器跑通专题→详情、模考→交卷→成绩

## 8. 验证

- **正确性门禁**：前端 `npm run type-check`（主门禁）+ `lint`；后端 `./mvnw compile`
- **功能验证**：模拟器实际跑——公式渲染（积分/矩阵/分式）、图片显示、模考倒计时与自评流程；golden path + 边缘（无 contentBlocks 的旧题退回纯文本）
- **task 日志**：动工前在 `Kairos-kakomon/TASKS.md` 追加 checklist，逐步 `[x]`

## 9. 风险与对策

| 风险 | 对策 |
|---|---|
| WebView 数学渲染在 Expo Go 的性能/闪烁 | KaTeX 本地内联、每屏仅 1 个 WebView、自适应高度；Phase 1 真机验证 |
| 真题转 content_blocks 的人工/OCR 成本 | 本期只做少量样例够验证；批量数字化是独立运营/pipeline 工作，不在本 spec |
| MySQL JSON 列检索局限 | 只按规范化列筛选，不查 JSON 内部；关键词走 FULLTEXT ngram |

## 10. 范围外（未来）

- 向量/语义相似题检索（卫星索引）
- 真题批量 OCR / 数字化 pipeline
- 付费门禁下沉后端
- 自动判分
