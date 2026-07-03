# 专题学习 & 模拟考试 — Phase 3（前端切流：mock → 真实后端）Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把专题学习 / 模拟考试相关屏幕从「直接同步读 `KAKOMON_QUESTIONS`/`KAKOMON_PAPERS` mock 数组」改为「经 `api/questions.ts` + `api/papers.ts` 用 TanStack `useQuery` 调 Phase 2 的真实后端」，后端无数据时回退 mock，保证 UI 不破。

**Architecture:** 三步：(1) `api/papers.ts`/`questions.ts` 内部从读 mock 换成 `apiRequest`，并把后端响应形状映射成前端类型（`code→id`、`questions→questionIds`、补齐字段缺口）；(2) 屏幕改用 `useQuery({queryKey, queryFn})`，沿用本项目既有的「API 空则回退 mock」惯用法（见 `app/(tabs)/study/index.tsx`）；(3) 保留同步 mock 作为 fallback，直到后端数据铺满。offline-first（`_layout.tsx` 已配 `networkMode:'offlineFirst'`、不自动 refetch）。

**Tech Stack:** Expo ~54 / React Native 0.81.5 / TypeScript strict / expo-router v6 / TanStack Query v5 / `apiRequest`（`src/api/client.ts`，解 `{code,message,data}` 信封）。

## Global Constraints

- 后端契约（Phase 2 已上线，见 `docs/02-architecture/API-contract.md` §2.11–2.15）：
  - `GET /api/papers?universityId=&graduateSchool=` → `PaperListItemResponse[]`（`{id,year,subject,title,durationMinutes,selectRule,questionCount}`）
  - `GET /api/papers/{code}` → `PaperResponse`（`{id,universityId,graduateSchool,majorId,year,subject,title,durationMinutes,totalScore,selectRule,instructions,questions:QuestionListItem[]}`）
  - `GET /api/questions?universityId=&graduateSchool=&year=&subject=&knowledgePoint=&keyword=&page=&pageSize=` → `{items,total,page,pageSize,hasMore}`（items 无 `contentBlocks`）
  - `GET /api/questions/{code}` → `QuestionResponse`（含 `contentBlocks`、`knowledgePoints`）
  - `GET /api/questions/{code}/related` → `RelatedQuestionResponse[]`（`{id,title,level,matchType,reason}`）
- 后端对外标识是 `code` 字符串（如 `q-todai-2024-math-3`），映射到前端类型的 `id` 字段。
- 后端 `PaperResponse` 有 `questions`（对象数组），前端 `ExamPaper` 要的是 `questionIds: string[]` → 映射时 `questions.map(q => q.id)`；同时把 question 明细并入结果供 exam-session 直接用（见 Task 3）。
- 后端 `RelatedQuestionResponse` 只有 `{id,title,level,matchType,reason}`，缺前端 `RelatedQuestion` 的 `universityId/universityName/year/subject/questionNo/confidence` → 映射时缺省填空串/`0`，不崩（Phase 2 终审 finding 1）。
- 后端 `QuestionListItemResponse` 无 `crowdDifficultyRate`（前端 `KakomonQuestion` 非可选）→ 映射时补 `0`（Phase 2 终审 finding 3）。
- **回退策略（本项目既有惯用法，见 study tab）**：`useQuery` 的 `queryFn` 调真接口；渲染时 `query.data?.length ? query.data : MOCK_FALLBACK`。后端报错/空 → 用 mock，UI 不破。保留 `KAKOMON_QUESTIONS`/`KAKOMON_PAPERS` 不删。
- 不改 TanStack 全局配置（`_layout.tsx` 已 offline-first）。查询 key 命名沿用 `['papers', scope...]` / `['questions', ...]` 风格。
- 付费门禁仍前端 `accessPolicy.ts` 判定，不依赖后端（spec §4.2）。
- 正确性门禁：`npm run type-check`（主门禁）+ `npm run lint`。每个 Task 结束跑 type-check 通过后 commit。
- 因后端可能无数据/不可达：功能验证以「type-check 通过 + 回退路径静态走查」为主；真机端到端（连 Phase 2 后端）需在有后端环境时人工验证，不得假称已连真。
- 动工前在 `Kairos-kakomon/TASKS.md` 追加本期 checklist。

---

## File Structure

- `src/api/papers.ts` — 改：`getPapers`/`getPaper` 内部换 `apiRequest`；新增 backend→`ExamPaper` 映射；导出一个「详情含大问明细」的类型。保留 `PaperQueryParams`。
- `src/api/questions.ts` — 改：`getQuestions`/`getQuestion`/`getRelatedQuestions` 换 `apiRequest` + 映射；`getQuestionRecommendations`/`getWrongBook`/`getKnowledgeMatrix`/`updateQuestionMastery`/`voteQuestionDifficulty`/`setQuestionFavorite` **保持 mock**（Phase 2 无对应端点，spec 范围外）。
- `app/mock-exam.tsx` — 改：年份卡数据源从 `KAKOMON_PAPERS` 同步过滤，换成 `useQuery(getPapers)` + mock 回退。
- `app/exam-session.tsx` — 改：整卷题目从按 `ids` 查 `KAKOMON_QUESTIONS`，改为可接受 paper 详情传入的大问明细（保持 ids 兜底）。
- `app/topic-questions.tsx` — 改：题目列表 `useMemo(KAKOMON_QUESTIONS.filter)` 换成 `useQuery(getQuestions)` + mock 回退。
- `app/questions/[id].tsx` — 改：详情 `KAKOMON_QUESTIONS.find` 换成 `useQuery(getQuestion)` + mock 回退；举一反三 `useQuery(getRelatedQuestions)`。
- `app/topic-study.tsx` — 改：科目聚合的题池从 `KAKOMON_QUESTIONS` 换成 `useQuery(getQuestions)`（大范围拉该研究科题目）+ mock 回退。

> **保持 mock 的函数**（无后端端点，本期不动）：`getQuestionRecommendations`、`getWrongBook`、`getKnowledgeMatrix`、`updateQuestionMastery`、`voteQuestionDifficulty`、`setQuestionFavorite`。它们的 mastery/vote 写接口属 Phase 2 显式移出项，UI 仍走 mock（乐观更新），不在本计划。

> **收藏/推荐/错题本等其他直接读 `KAKOMON_QUESTIONS` 的屏幕**（`search.tsx`、`favorites.tsx`、`ai-chat.tsx`、`forum/*`、`university/[id]`、`reference-index`、`(tabs)/study`、`recommend.ts`）**不在本计划**——它们不属专题学习/模考核心链路，且多依赖无后端的能力（搜索/推荐/论坛）。保持直接读 mock。本计划只切「专题学习 + 模拟考试」这条链路的 5 个屏幕。

---

### Task 1: papers.ts 切真接口 + 映射

**Files:**
- Modify: `Kairos-kakomon/src/api/papers.ts`

**Interfaces:**
- Consumes: `apiRequest`（`@/api/client`）、`ExamPaper`（`@/types/question`）、`KAKOMON_PAPERS`（回退）
- Produces:
  - `export interface PaperQuestionRaw { id: string; questionNo: string; title: string; orderIndex: number; universityId: string; graduateSchool: string; year: number; subject: string; difficultyLabel?: string; difficultyLevel?: string; knowledgePoints?: string[] }`
  - `export type PaperDetail = ExamPaper & { questionDetails: PaperQuestionRaw[] }`
  - `getPapers(params?: PaperQueryParams): Promise<ExamPaper[]>`（签名不变）
  - `getPaper(id: string): Promise<PaperDetail>`

- [ ] **Step 1: 重写 papers.ts**

把 `Kairos-kakomon/src/api/papers.ts` 整体替换为：

```ts
import type { ExamPaper } from '@/types/question';
import { apiRequest } from './client';
import { KAKOMON_PAPERS } from '@/mocks/data';

export interface PaperQueryParams {
  universityId?: string;
  graduateSchool?: string;
  majorId?: string | null;
}

// —— 后端响应形状（对应 API-contract §2.11 / §2.12）——
interface PaperListItemRaw {
  id: string;
  year: number;
  subject: string;
  title: string;
  durationMinutes?: number;
  selectRule?: { total: number; choose: number };
  questionCount: number;
}

export interface PaperQuestionRaw {
  id: string;
  questionNo: string;
  title: string;
  orderIndex: number;
  universityId: string;
  graduateSchool: string;
  year: number;
  subject: string;
  difficultyLabel?: string;
  difficultyLevel?: string;
  knowledgePoints?: string[];
}

interface PaperDetailRaw {
  id: string;
  universityId: string;
  graduateSchool: string;
  majorId?: string | null;
  year: number;
  subject: string;
  title: string;
  durationMinutes?: number;
  totalScore?: number | null;
  selectRule?: { total: number; choose: number };
  instructions?: string[];
  questions: PaperQuestionRaw[];
}

/** 详情：ExamPaper + 大问明细(供 exam-session 直接渲染,免二次请求)。 */
export type PaperDetail = ExamPaper & { questionDetails: PaperQuestionRaw[] };

function listItemToExamPaper(raw: PaperListItemRaw, scope: PaperQueryParams): ExamPaper {
  return {
    id: raw.id,
    universityId: scope.universityId ?? '',
    graduateSchool: scope.graduateSchool ?? '',
    majorId: scope.majorId ?? null,
    year: raw.year,
    subject: raw.subject,
    title: raw.title,
    durationMinutes: raw.durationMinutes,
    totalScore: null,
    selectRule: raw.selectRule,
    instructions: undefined,
    questionIds: Array.from({ length: raw.questionCount }, (_, i) => `${raw.id}#${i}`),
  };
}

export async function getPapers(params: PaperQueryParams = {}): Promise<ExamPaper[]> {
  if (!params.universityId || !params.graduateSchool) return [];
  try {
    const raw = await apiRequest<PaperListItemRaw[]>('/api/papers', {
      query: { universityId: params.universityId, graduateSchool: params.graduateSchool },
    });
    if (Array.isArray(raw) && raw.length > 0) {
      return raw.map((r) => listItemToExamPaper(r, params)).sort((a, b) => b.year - a.year);
    }
  } catch {
    // 落回 mock
  }
  return KAKOMON_PAPERS.filter((p) => {
    if (params.universityId && p.universityId !== params.universityId) return false;
    if (params.graduateSchool && p.graduateSchool !== params.graduateSchool) return false;
    if (params.majorId && p.majorId && p.majorId !== params.majorId) return false;
    return true;
  }).sort((a, b) => b.year - a.year);
}

export async function getPaper(id: string): Promise<PaperDetail> {
  try {
    const raw = await apiRequest<PaperDetailRaw>(`/api/papers/${encodeURIComponent(id)}`);
    if (raw && raw.id) {
      return {
        id: raw.id,
        universityId: raw.universityId,
        graduateSchool: raw.graduateSchool,
        majorId: raw.majorId ?? null,
        year: raw.year,
        subject: raw.subject,
        title: raw.title,
        durationMinutes: raw.durationMinutes,
        totalScore: raw.totalScore ?? null,
        selectRule: raw.selectRule,
        instructions: raw.instructions ?? [],
        questionIds: (raw.questions ?? []).map((q) => q.id),
        questionDetails: raw.questions ?? [],
      };
    }
  } catch {
    // 落回 mock
  }
  const hit = KAKOMON_PAPERS.find((p) => p.id === id);
  if (!hit) throw new Error(`Paper not found: ${id}`);
  return { ...hit, questionDetails: [] };
}
```

> 说明：列表接口后端不回 university/grad（scope 已知），映射时用入参回填；`questionIds` 用占位（列表卡只需数量）。详情接口回真实 `questions`，映射出 `questionIds` + `questionDetails`（exam-session 用后者免二次请求）。任一步异常/空 → 回退 `KAKOMON_PAPERS`。

- [ ] **Step 2: type-check**

Run: `cd Kairos-kakomon && npm run type-check`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add Kairos-kakomon/src/api/papers.ts
git commit -m "feat(api): wire papers.ts to real backend with mock fallback"
```

---

### Task 2: questions.ts 切真接口 + 映射（含 3 个字段缺口补齐）

**Files:**
- Modify: `Kairos-kakomon/src/api/questions.ts`

**Interfaces:**
- Consumes: `apiRequest`、`KakomonQuestion`/`RelatedQuestion`/`RelatedLevel`（`@/types/question`）、`PaginatedResponse`（`@/types/api`）、mock 常量（回退）
- Produces（签名全部不变）：`getQuestions(params?)`、`getQuestion(id)`、`getRelatedQuestions(id)` 切真接口 + 映射；其余函数保持 mock。

- [ ] **Step 1: 在 questions.ts 顶部加 import 与映射辅助**

在 `Kairos-kakomon/src/api/questions.ts` 现有 import 之后（`import { KAKOMON_KNOWLEDGE_MATRIX, ... }` 那组之后）追加：

```ts
import { apiRequest } from './client';
import type { RelatedLevel } from '@/types/question';

// —— 后端响应形状（API-contract §2.13 / §2.14 / §2.15）——
interface QuestionListItemRaw {
  id: string;
  paperId?: string;
  universityId: string;
  graduateSchool: string;
  year: number;
  subject: string;
  questionNo: string;
  title: string;
  orderIndex?: number;
  difficultyLabel?: string;
  difficultyLevel?: DifficultyLevel;
  knowledgePoints?: string[];
}

interface QuestionDetailRaw extends QuestionListItemRaw {
  contentBlocks?: KakomonQuestion['contentBlocks'];
  bodyText?: string;
}

interface RelatedRaw {
  id: string;
  title: string;
  level: number;
  matchType?: string;
  reason?: string;
}

/** 后端 list-item → KakomonQuestion。后端无 crowdDifficultyRate,补 0（Phase 2 终审 finding 3）。 */
function listItemToQuestion(raw: QuestionListItemRaw): KakomonQuestion {
  return {
    id: raw.id,
    universityId: raw.universityId,
    graduateSchool: raw.graduateSchool,
    year: raw.year,
    subject: raw.subject,
    questionNo: raw.questionNo,
    title: raw.title,
    orderIndex: raw.orderIndex,
    paperId: raw.paperId,
    knowledgePoints: raw.knowledgePoints ?? [],
    difficultyLabel: raw.difficultyLabel ?? '',
    difficultyLevel: raw.difficultyLevel,
    crowdDifficultyRate: 0,
  };
}

function detailToQuestion(raw: QuestionDetailRaw): KakomonQuestion {
  return {
    ...listItemToQuestion(raw),
    contentBlocks: raw.contentBlocks,
    bodyText: raw.bodyText,
  };
}

/** 后端 related → RelatedQuestion。后端缺 university/year/subject/questionNo/confidence,填空/0（Phase 2 终审 finding 1）。 */
function relatedToFront(raw: RelatedRaw): RelatedQuestion {
  const lvl = (raw.level === 1 || raw.level === 2 || raw.level === 3 ? raw.level : 2) as RelatedLevel;
  return {
    id: raw.id,
    title: raw.title,
    level: lvl,
    universityId: '',
    universityName: '',
    year: 0,
    subject: '',
    questionNo: '',
    reason: raw.reason ?? '',
    confidence: 0,
  };
}
```

- [ ] **Step 2: 替换 getQuestions / getQuestion / getRelatedQuestions 三个函数体**

把这三个函数（当前读 mock 的实现）分别替换为下面「先真接口、异常/空回退 mock」的版本，其余函数不动：

```ts
export async function getQuestions(
  params?: QuestionListParams,
): Promise<PaginatedResponse<KakomonQuestion>> {
  const uni = params?.universityIds?.[0];
  const subject = params?.subjects?.[0];
  const kp = params?.knowledgePoints?.[0];
  const year = params?.years?.[0];
  try {
    const raw = await apiRequest<{
      items: QuestionListItemRaw[]; total: number; page: number; pageSize: number; hasMore: boolean;
    }>('/api/questions', {
      query: {
        universityId: uni, subject, knowledgePoint: kp, year,
        keyword: params?.keyword,
        page: params?.page ?? 1, pageSize: params?.pageSize ?? 20,
      },
    });
    if (raw && Array.isArray(raw.items) && raw.items.length > 0) {
      return {
        items: raw.items.map(listItemToQuestion),
        total: raw.total, page: raw.page, pageSize: raw.pageSize, hasMore: raw.hasMore,
      };
    }
  } catch {
    // 落回 mock
  }
  const filtered = sortQuestions(applyFilters(KAKOMON_QUESTIONS, params), params?.sort);
  return paginate(filtered, params?.page ?? 1, params?.pageSize ?? 20);
}

export async function getQuestion(id: string): Promise<KakomonQuestion> {
  try {
    const raw = await apiRequest<QuestionDetailRaw>(`/api/questions/${encodeURIComponent(id)}`);
    if (raw && raw.id) return detailToQuestion(raw);
  } catch {
    // 落回 mock
  }
  const hit = KAKOMON_QUESTIONS.find((q) => q.id === id);
  if (!hit) throw new Error(`Question not found: ${id}`);
  return hit;
}

export async function getRelatedQuestions(id: string): Promise<RelatedQuestionsResponse> {
  try {
    const raw = await apiRequest<RelatedRaw[]>(`/api/questions/${encodeURIComponent(id)}/related`);
    if (Array.isArray(raw) && raw.length > 0) {
      const items = raw.map(relatedToFront);
      return { items, level3Total: items.filter((r) => r.level === 3).length, isPro: false };
    }
  } catch {
    // 落回 mock
  }
  const hit = KAKOMON_QUESTIONS.find((q) => q.id === id);
  const items = hit?.relatedQuestions ?? [];
  return { items, level3Total: items.filter((r) => r.level === 3).length, isPro: false };
}
```

> 需要 `RelatedQuestion` 类型在文件里可见——它已随现有 `import type { ..., RelatedQuestion } from '@/types/question'` 引入（确认 import 行含 `RelatedQuestion`；若无则补）。`getQuestions` 只把 `universityIds[0]/subjects[0]/...` 传后端单值（后端按单值筛）；多选保留给 mock 回退分支处理。

- [ ] **Step 3: type-check**

Run: `cd Kairos-kakomon && npm run type-check`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add Kairos-kakomon/src/api/questions.ts
git commit -m "feat(api): wire questions.ts to real backend with mock fallback + field mapping"
```

---

### Task 3: mock-exam.tsx 年份卡改用 useQuery(getPapers)

**Files:**
- Modify: `Kairos-kakomon/app/mock-exam.tsx`

**Interfaces:**
- Consumes: `getPapers`（Task 1）、`useQuery`
- Produces: `papersForEntry` 来源改为后端（空则回退 mock），`findPaper` 签名不变（`(year, subject) => ExamPaper | null`），供既有年份卡渲染 + `startExam` 使用。

- [ ] **Step 1: import useQuery 与 getPapers**

在 `app/mock-exam.tsx` 顶部 import 区加：

```tsx
import { useQuery } from '@tanstack/react-query';
import { getPapers } from '@/api/papers';
```

- [ ] **Step 2: 用 useQuery 替换 papersForEntry 的同步 useMemo**

把现有：

```tsx
  const papersForEntry = useMemo(() => {
    if (!activeEntry) return [] as ExamPaper[];
    return KAKOMON_PAPERS.filter(
      (p) => p.universityId === activeEntry.universityId && p.graduateSchool === activeEntry.gradSchool,
    );
  }, [activeEntry]);
```

替换为（真接口，`getPapers` 内部已带 mock 回退，故这里直接用其结果；`enabled` 仅在选中条目时查询）：

```tsx
  const papersQuery = useQuery({
    queryKey: ['papers', activeEntry?.universityId ?? '', activeEntry?.gradSchool ?? ''],
    queryFn: () => getPapers({ universityId: activeEntry!.universityId, graduateSchool: activeEntry!.gradSchool }),
    enabled: !!activeEntry,
  });
  const papersForEntry: ExamPaper[] = papersQuery.data ?? [];
```

> `getPapers` 已在 Task 1 内部处理「真接口失败/空 → 回退 KAKOMON_PAPERS」，所以屏幕层不必再写回退分支。`KAKOMON_PAPERS` import 可保留（其他地方或未来用）；若 lint 报未使用再删。

- [ ] **Step 3: type-check**

Run: `cd Kairos-kakomon && npm run type-check`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add Kairos-kakomon/app/mock-exam.tsx
git commit -m "feat(mock-exam): load papers via useQuery(getPapers) with fallback"
```

---

### Task 4: exam-session.tsx 接受 paper 详情的大问明细（保留 ids 兜底）

**Files:**
- Modify: `Kairos-kakomon/app/mock-exam.tsx`（startExam 传 paperCode）
- Modify: `Kairos-kakomon/app/exam-session.tsx`（用 getPaper 详情取题，回退 ids→KAKOMON_QUESTIONS）

**Interfaces:**
- Consumes: `getPaper`（Task 1，返回 `PaperDetail` 含 `questionDetails`）、`useQuery`
- Produces: exam-session 的题目列表优先来自 `getPaper(paperCode).questionDetails`，无 paperCode 时回退现有 `ids` 查 mock。

- [ ] **Step 1: mock-exam startExam 传 paperCode**

在 `app/mock-exam.tsx` 的 `startExam` 里，找到拼 URL 的 `extra` 之后，把 paper 的 id 也带上（若有 paper）。将 `router.push(...)` 那行的 query 追加 `paperCode`：

```tsx
    const paper = findPaper(year, subject);
    const paperParam = paper ? `&paperCode=${encodeURIComponent(paper.id)}` : '';
    const extra = paper
      ? `${paper.durationMinutes ? `&durationMinutes=${paper.durationMinutes}` : ''}${paper.selectRule ? `&selectTotal=${paper.selectRule.total}&selectChoose=${paper.selectRule.choose}` : ''}`
      : '';
    router.push(`/exam-session?title=${encodeURIComponent(`${activeUni?.short ?? ''} ${year} ${subject}`)}&universityId=${activeEntry.universityId}&mode=mock&ids=${ids}${extra}${paperParam}` as any);
```

- [ ] **Step 2: exam-session 读 paperCode 并用 getPaper 详情取题**

在 `app/exam-session.tsx` 顶部 import 加：

```tsx
import { useQuery } from '@tanstack/react-query';
import { getPaper } from '@/api/papers';
```

在 `useLocalSearchParams` 泛型追加 `paperCode?: string`。然后把现有从 `params.ids` 组装 `questions` 的 `useMemo` 改为：先按 paperCode 查详情，详情有大问明细就用它映射成最小可渲染题对象；否则回退到 ids→KAKOMON_QUESTIONS：

```tsx
  const paperQuery = useQuery({
    queryKey: ['paper', params.paperCode ?? ''],
    queryFn: () => getPaper(params.paperCode!),
    enabled: !!params.paperCode,
  });

  const questions: KakomonQuestion[] = useMemo(() => {
    const detail = paperQuery.data;
    if (detail && detail.questionDetails.length > 0) {
      return detail.questionDetails.map((q) => ({
        id: q.id,
        universityId: q.universityId,
        graduateSchool: q.graduateSchool,
        year: q.year,
        subject: q.subject,
        questionNo: q.questionNo,
        title: q.title,
        orderIndex: q.orderIndex,
        knowledgePoints: q.knowledgePoints ?? [],
        difficultyLabel: q.difficultyLabel ?? '',
        difficultyLevel: q.difficultyLevel as KakomonQuestion['difficultyLevel'],
        crowdDifficultyRate: 0,
      }));
    }
    const ids = (params.ids ?? '').split(',').filter(Boolean);
    return ids
      .map((id) => KAKOMON_QUESTIONS.find((q) => q.id === id))
      .filter((q): q is KakomonQuestion => !!q);
  }, [paperQuery.data, params.ids]);
```

> 注意：paper 详情的列表项**不含 contentBlocks**（后端列表瘦身），故 exam-session 里题干仍走 `QuestionBlocks` 的 `fallbackText`（bodyText 也没有时显示占位）。这是可接受的——模考答题主要看题号/标题作答；详情级 contentBlocks 在专题学习详情页（Task 6）拉取。若要模考也显示公式，属未来增强，不在本计划。

- [ ] **Step 3: type-check**

Run: `cd Kairos-kakomon && npm run type-check`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add Kairos-kakomon/app/mock-exam.tsx Kairos-kakomon/app/exam-session.tsx
git commit -m "feat(exam): drive exam questions from getPaper detail, ids fallback"
```

---

### Task 5: topic-questions.tsx 列表改用 useQuery(getQuestions)

**Files:**
- Modify: `Kairos-kakomon/app/topic-questions.tsx`

**Interfaces:**
- Consumes: `getQuestions`（Task 2）、`useQuery`
- Produces: `questions: KakomonQuestion[]`（同名，供既有 FlatList 渲染），来源后端 + mock 回退。

- [ ] **Step 1: import**

在 `app/topic-questions.tsx` 顶部 import 区加：

```tsx
import { useQuery } from '@tanstack/react-query';
import { getQuestions } from '@/api/questions';
```

- [ ] **Step 2: 用 useQuery 替换同步 useMemo 过滤**

把现有：

```tsx
  const questions = useMemo(() => {
    return KAKOMON_QUESTIONS.filter((q) => {
      if (q.universityId !== universityId) return false;
      if (gradSchool && q.graduateSchool !== gradSchool) return false;
      if (majorId && q.majorIds && q.majorIds.length > 0 && !q.majorIds.includes(majorId)) return false;
      if (q.subject !== subject) return false;
      return true;
    }).sort((a, b) => b.year - a.year);
  }, [universityId, gradSchool, majorId, subject]);
```

替换为：

```tsx
  const questionsQuery = useQuery({
    queryKey: ['questions', universityId, gradSchool, subject],
    queryFn: () => getQuestions({
      universityIds: universityId ? [universityId] : undefined,
      subjects: subject ? [subject] : undefined,
      pageSize: 100,
    }),
    enabled: !!universityId && !!subject,
  });

  // getQuestions 内部已带 mock 回退;这里再按 majorId 本地细筛 + 排序,兼容后端未按专业过滤。
  const questions = useMemo(() => {
    const items = questionsQuery.data?.items ?? [];
    return items
      .filter((q) => (gradSchool ? q.graduateSchool === gradSchool : true))
      .filter((q) => (majorId && q.majorIds && q.majorIds.length > 0 ? q.majorIds.includes(majorId) : true))
      .filter((q) => q.subject === subject)
      .sort((a, b) => b.year - a.year);
  }, [questionsQuery.data, gradSchool, majorId, subject]);
```

> 后端 `/api/questions` 按 university+subject 单值筛；research-school / major 的细筛在客户端补（列表项含 graduateSchool；majorIds 后端列表项没有，故 `majorId` 过滤对后端数据实际不生效——可接受，后端已按 university+subject 收敛，majorId 主要用于 mock 回退数据的细分）。

- [ ] **Step 3: type-check**

Run: `cd Kairos-kakomon && npm run type-check`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add Kairos-kakomon/app/topic-questions.tsx
git commit -m "feat(topic-questions): load list via useQuery(getQuestions) with fallback"
```

---

### Task 6: questions/[id].tsx 详情 + 举一反三改用 useQuery

**Files:**
- Modify: `Kairos-kakomon/app/questions/[id].tsx`

**Interfaces:**
- Consumes: `getQuestion`、`getRelatedQuestions`（Task 2）、`useQuery`
- Produces: `question` 来源后端（含 contentBlocks）+ mock 回退；举一反三从后端拉取时替换 `recommendRelated` 的输入。

- [ ] **Step 1: import**

在 `app/questions/[id].tsx` 顶部 import 区加：

```tsx
import { useQuery } from '@tanstack/react-query';
import { getQuestion } from '@/api/questions';
```

- [ ] **Step 2: 详情改 useQuery（保留 mock 作为 initialData 回退）**

找到现有：

```tsx
  const question = KAKOMON_QUESTIONS.find((q) => q.id === id) ?? KAKOMON_QUESTIONS[0];
```

替换为（先拿 mock 做 initialData 保证首屏不空，再后台取真详情覆盖；真详情失败时 getQuestion 内部已回退 mock）：

```tsx
  const mockQuestion = KAKOMON_QUESTIONS.find((q) => q.id === id) ?? KAKOMON_QUESTIONS[0];
  const questionQuery = useQuery({
    queryKey: ['question', id],
    queryFn: () => getQuestion(id!),
    enabled: !!id,
    initialData: mockQuestion,
  });
  const question = questionQuery.data ?? mockQuestion;
```

> `id` 来自 `useLocalSearchParams`。`initialData: mockQuestion` 让首屏立即有内容（含 mock 的 contentBlocks/解析），真接口回来后用后端详情（含真 contentBlocks）覆盖。`university`、`mastery` 等下游派生逻辑不变（它们读 `question.*`）。

- [ ] **Step 3: type-check**

Run: `cd Kairos-kakomon && npm run type-check`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add Kairos-kakomon/app/questions/[id].tsx
git commit -m "feat(questions): load detail via useQuery(getQuestion), mock initialData"
```

---

### Task 7: topic-study.tsx 题池改用 useQuery(getQuestions)

**Files:**
- Modify: `Kairos-kakomon/app/topic-study.tsx`

**Interfaces:**
- Consumes: `getQuestions`（Task 2）、`useQuery`
- Produces: 科目聚合用的题池来源后端 + mock 回退；`subjects` 聚合逻辑不变。

- [ ] **Step 1: import**

在 `app/topic-study.tsx` 顶部 import 区加：

```tsx
import { useQuery } from '@tanstack/react-query';
import { getQuestions } from '@/api/questions';
```

- [ ] **Step 2: 用 useQuery 结果替换 pool 的 KAKOMON_QUESTIONS 过滤**

找到 `pool` 的 `useMemo`（`return KAKOMON_QUESTIONS.filter(...)` 那段），在其上方加一个按当前研究科拉题的 query，并把 pool 的数据源从 `KAKOMON_QUESTIONS` 换成 query 结果（无数据回退 mock）：

```tsx
  const poolQuery = useQuery({
    queryKey: ['questions', 'pool', activeEntry?.universityId ?? '', activeEntry?.gradSchool ?? ''],
    queryFn: () => getQuestions({
      universityIds: activeEntry ? [activeEntry.universityId] : undefined,
      pageSize: 200,
    }),
    enabled: !!activeEntry,
  });

  const pool = useMemo(() => {
    if (!activeEntry) return [];
    const source = poolQuery.data?.items?.length ? poolQuery.data.items : KAKOMON_QUESTIONS;
    return source.filter((q) => {
      if (q.universityId !== activeEntry.universityId) return false;
      if (q.graduateSchool !== activeEntry.gradSchool) return false;
      if (activeEntry.majorId) {
        if (q.majorIds && q.majorIds.length > 0 && !q.majorIds.includes(activeEntry.majorId)) return false;
      }
      return true;
    });
  }, [activeEntry, poolQuery.data]);
```

> 这里显式写「有后端数据用后端、否则用 KAKOMON_QUESTIONS」的回退（topic-study 的 pool 过滤含 graduateSchool/majorId 细分，后端按 university 收敛后仍需本地过滤，故直接在 pool 里选源最清晰）。`subjects` 的下游 useMemo 读 `pool`，不用改。

- [ ] **Step 3: type-check + lint**

Run: `cd Kairos-kakomon && npm run type-check && npm run lint`
Expected: type-check PASS；lint 无新增 error（既有 warning 容许）

- [ ] **Step 4: Commit**

```bash
git add Kairos-kakomon/app/topic-study.tsx
git commit -m "feat(topic-study): source question pool via useQuery(getQuestions) with fallback"
```

---

### Task 8: 验证 + TASKS.md 收尾

**Files:**
- Modify: `Kairos-kakomon/TASKS.md`

**Interfaces:**
- Consumes: 全部前序 Task
- Produces: 无

- [ ] **Step 1: 全量门禁**

Run: `cd Kairos-kakomon && npm run type-check && npm run lint`
Expected: type-check PASS；lint 0 error（既有 warning 属基线，非本期新增）。若本期文件出现新 warning/error 需修掉。

- [ ] **Step 2: 回退路径静态走查（无后端也能验证）**

因本环境可能无 Phase 2 后端在跑，做以下静态确认（逐条在代码里核对，写进报告）：
- `papers.ts`/`questions.ts` 的每个切流函数：真接口在 `try` 内，`catch{}` 与「空结果」都落到 mock 分支 → 后端不可达时 UI 用 mock，不抛未捕获异常。
- `mock-exam` 的 `papersQuery.data ?? []`：query pending/error 时为 `[]`，年份卡走 `yearGroups`（仍来自 mock pool），不崩。
- `questions/[id]` 的 `initialData: mockQuestion`：首屏即有内容。
- `exam-session`：无 `paperCode`（或详情空）时回退 `ids→KAKOMON_QUESTIONS`。

- [ ] **Step 3: 真机端到端（有后端时执行,否则标注待验证）**

前置：Phase 2 后端在 `:8080` 跑、已执行 V1_0–V1_5、`EXPO_PUBLIC_API_BASE_URL` 指向它。
Run: `cd Kairos-kakomon && npm run ios`
手动核对：
- 模拟考试 → 东大情报理工：年份卡出现 2024 数学（来自后端 `/api/papers`），显示 ⏱150 分 · 3 题选 2。
- 开始模考 → 题目来自 `/api/papers/{code}` 详情（第1/2/3问）。
- 专题学习 → 东大情报理工 → 数学 → 列表来自 `/api/questions`；点开 `q-todai-2024-math-3` 详情 contentBlocks 公式渲染（来自 `/api/questions/{code}`）；举一反三来自 `/api/questions/{code}/related`。
- 断开后端 → 各屏回退 mock，不白屏、不崩。

> 若本环境无后端：**明确写「未连真验证，仅静态走查回退路径通过」**，不得假称已连真跑通。

- [ ] **Step 4: TASKS.md 追加完成记录**

在 `Kairos-kakomon/TASKS.md` 末尾追加（不改写既有行）：

```markdown
### 2026-07-03 任务：专题学习/模考 Phase 3（前端切流 mock→真实后端）
- [x] papers.ts / questions.ts 切 apiRequest 真接口 + 响应字段映射（code→id、questions→questionIds、补 crowdDifficultyRate/related 字段）+ mock 回退
  ✅ 完成于 2026-07-03
- [x] 5 屏改用 useQuery：mock-exam(papers)、exam-session(paper 详情取题)、topic-questions、questions/[id]、topic-study
  ✅ 完成于 2026-07-03
- [x] 门禁 type-check + lint 通过；回退路径静态走查通过
  ✅ 完成于 2026-07-03，真机连 Phase 2 后端端到端待联调环境验证
```

- [ ] **Step 5: Commit**

```bash
git add Kairos-kakomon/TASKS.md
git commit -m "docs(tasks): mark topic-study/mock-exam Phase 3 cutover done"
```

---

## Self-Review

**Spec coverage（对照 spec §5.3 数据层切流 / §7 Phase 3）：**
- §5.3 `questions.ts`/`papers.ts` 内部 mock→apiRequest → Task 1/2 ✅（且发现屏幕不经 api 层，故追加屏幕 rewire）
- §7 Phase 3「切流」→ Task 1-7 覆盖 5 屏 + 2 api ✅
- Phase 2 终审 3 个 finding（related 字段缺 / questions→questionIds / crowdDifficultyRate 缺）→ Task 1/2 映射显式补齐 ✅
- 无后端端点的函数（recommendation/wrongbook/matrix/mastery/vote/favorite）保持 mock → File Structure 注释 + Task 2 明确不动 ✅
- 付费门禁仍前端判定 → 不改 accessPolicy，Task 均未触碰 ✅
- offline-first 回退 → 每个切流函数 try/catch+空→mock；屏幕层沿用 study tab 惯用法 ✅

**Placeholder scan:** 无 TBD/TODO；每个改动步骤给完整代码 + 确切文件/锚点。无后端场景给了明确「静态走查 + 不得假称连真」指令，非占位。

**Type consistency:** `getPapers(): Promise<ExamPaper[]>` / `getPaper(): Promise<PaperDetail>`（Task1）在 Task3/4 消费一致；`PaperDetail.questionDetails: PaperQuestionRaw[]`（Task1）被 exam-session（Task4）map 成 `KakomonQuestion`；`getQuestions(): Promise<PaginatedResponse<KakomonQuestion>>`（Task2，签名不变）被 Task5/7 用 `.data?.items`；`getQuestion(): Promise<KakomonQuestion>`（Task2）被 Task6 `initialData: mockQuestion` 消费；`RelatedLevel` 映射夹取到 1|2|3（Task2）匹配 `RelatedQuestion.level` 类型。查询 key `['papers',...]`/`['questions',...]`/`['question',id]`/`['paper',code]` 无冲突。
