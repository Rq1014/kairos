# 专题学习 & 模拟考试 — Phase 1（前端 mock）Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让专题学习与模拟考试两个屏幕用结构化 `content_blocks` 渲染真实数学/图形题干，并让模考读取真正的 `ExamPaper`（含时长/选做规则/倒计时），全部跑在 mock 数据上。

**Architecture:** 三层数据形态 `ExamPaper → KakomonQuestion(大问) → ContentBlock[]` 全部落在前端 mock（`src/mocks/data.ts`）。新增 `react-native-webview` + 内联 KaTeX 的渲染组件 `QuestionBlocks` 渲染 `math` 块，`text/image/table` 用原生视图。数据层 `questions.ts` 保持签名不变，新增 `papers.ts`；本期不接后端。

**Tech Stack:** Expo ~54 / React Native 0.81.5 / TypeScript strict / expo-router v6 / Zustand / `react-native-webview`（新增）/ KaTeX（内联 HTML 资源，非 npm 包）。

## Global Constraints

- Expo 固定 `~54.0.0`、React Native `0.81.5`（Expo Go 兼容），新增依赖必须兼容该 SDK：`react-native-webview` 用 `13.15.0`。
- `tsconfig.json` `strict: true`；路径别名 `@/*` → `./src/*`。
- 正确性门禁：`npm run type-check`（主门禁），其次 `npm run lint`。仓库无 test runner。
- 组件必须主题感知：颜色一律 `useColors()` 取，禁止导入静态色板。
- 主题色 token 只用已存在的：`textPrimary/textSecondary/textMuted/background/surface/surfaceAlt/border/teal500/teal600/indigo500/indigo600/blue500/blue600/green500/green600/amber500/rose500/rose600`。
- 每个 Task 结束跑一次 `npm run type-check`，通过后 commit。
- 向后兼容：旧字段 `bodyText`/`formulaPreview`/`standardExplanation` 保留不删；`contentBlocks` 缺省时渲染回退到 `bodyText`。
- 动工前在 `Kairos-kakomon/TASKS.md` 追加本期 checklist，逐步 `[x]`，`✅ 完成于 2026-07-02` 追加注释，不改写既有行。

---

## File Structure

- `src/types/question.ts` — 修改：新增 `ContentBlock`、`ExamPaper`，扩展 `KakomonQuestion`（`contentBlocks?`/`paperId?`/`orderIndex?`）。
- `src/mocks/data.ts` — 修改：给东大样例题填 `contentBlocks`；新增 `KAKOMON_PAPERS: ExamPaper[]`。
- `src/components/study/QuestionBlocks.tsx` — 新建：`content_blocks` → WebView(KaTeX)/原生视图 渲染器。
- `src/components/study/questionBlocksHtml.ts` — 新建：把 `ContentBlock[]` + 主题色拼成内联 KaTeX HTML 的纯函数（可独立测试）。
- `src/api/papers.ts` — 新建：`getPapers()` / `getPaper(id)`，读 `KAKOMON_PAPERS`。
- `app/questions/[id].tsx` — 修改：题干区改用 `<QuestionBlocks>`（回退 `bodyText`）。
- `app/exam-session.tsx` — 修改：答题区用 `<QuestionBlocks>`；加倒计时 + 选做规则提示。
- `app/mock-exam.tsx` — 修改：年份卡数据源改读 `ExamPaper`，展示时长/选做规则/大问数。
- `package.json` — 修改：新增 `react-native-webview` 依赖。

> **注意 `SchoolRail` 抽取**：spec §5.4 提到顺手抽 `SchoolRail.tsx`。该重构与本期"真题渲染 + 模考试卷化"无直接依赖，且改动面大（两屏侧栏 + 菜单 + 添加流程共 ~300 行）。**移出本计划**，留作独立重构计划，避免 Phase 1 范围膨胀（YAGNI）。

---

### Task 1: 类型层 — ContentBlock / ExamPaper / KakomonQuestion 扩展

**Files:**
- Modify: `src/types/question.ts`（在文件末尾新增类型；扩展 `KakomonQuestion` interface）

**Interfaces:**
- Consumes: 无（纯类型定义，本任务起点）
- Produces:
  - `type ContentBlock =
      | { type: 'text'; content: string }
      | { type: 'math'; latex: string }
      | { type: 'image'; url: string; caption?: string }
      | { type: 'table'; rows: string[][]; caption?: string }`
  - `interface ExamPaper { id: string; universityId: string; graduateSchool: string; majorId?: string | null; year: number; subject: string; title: string; durationMinutes?: number; totalScore?: number | null; selectRule?: { total: number; choose: number }; instructions?: string[]; questionIds: string[] }`
  - `KakomonQuestion` 新增可选字段：`contentBlocks?: ContentBlock[]`、`paperId?: string`、`orderIndex?: number`

- [ ] **Step 1: 扩展 KakomonQuestion 并新增两个类型**

在 `src/types/question.ts` 的 `KakomonQuestion` interface 内，`hasOriginalImage?: boolean;` 行之后新增三个可选字段：

```ts
  hasOriginalImage?: boolean;
  /** 结构化题干内容块（优先渲染；缺省时回退 bodyText）。 */
  contentBlocks?: ContentBlock[];
  /** 所属试卷 id（模考按试卷组织）。 */
  paperId?: string;
  /** 大问在试卷内的顺序。 */
  orderIndex?: number;
}
```

在文件**末尾**（`ReferenceChapter` interface 之后）追加：

```ts
export type ContentBlock =
  | { type: 'text'; content: string }
  | { type: 'math'; latex: string }
  | { type: 'image'; url: string; caption?: string }
  | { type: 'table'; rows: string[][]; caption?: string };

/** 一份完整试卷（大学×研究科×年份×科目），下辖多个大问。 */
export interface ExamPaper {
  id: string;
  universityId: string;
  graduateSchool: string;
  majorId?: string | null;
  year: number;
  subject: string;
  /** 展示标题，如「平成29年度 大学院入学試験問題 数学」。 */
  title: string;
  /** 考试时长（分钟），用于模考倒计时。 */
  durationMinutes?: number;
  totalScore?: number | null;
  /** 选做规则，如 6 問中 3 問選択 → { total: 6, choose: 3 }。 */
  selectRule?: { total: number; choose: number };
  /** 注意事项文本数组。 */
  instructions?: string[];
  /** 大问 id 顺序。 */
  questionIds: string[];
}
```

- [ ] **Step 2: 运行 type-check 验证类型无误**

Run: `npm run type-check`
Expected: PASS（新增可选字段不破坏既有引用）

- [ ] **Step 3: Commit**

```bash
git add src/types/question.ts
git commit -m "feat(types): add ContentBlock, ExamPaper, extend KakomonQuestion"
```

---

### Task 2: KaTeX HTML 拼装纯函数

**Files:**
- Create: `src/components/study/questionBlocksHtml.ts`

**Interfaces:**
- Consumes: `ContentBlock`（Task 1）
- Produces:
  - `function buildBlocksHtml(blocks: ContentBlock[], theme: { fg: string; bg: string; muted: string }): string` — 返回完整 HTML 文档字符串，内联 KaTeX CSS + 渲染逻辑，末尾用 `ResizeObserver` + `window.ReactNativeWebView.postMessage` 回传内容高度。
  - `function escapeHtml(s: string): string`

- [ ] **Step 1: 写纯函数**

创建 `src/components/study/questionBlocksHtml.ts`：

```ts
import type { ContentBlock } from '@/types/question';

/** 转义用户/题目文本，避免注入到 HTML。 */
export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** 转义要放进 JS 字符串字面量的 LaTeX（KaTeX 在浏览器端 render）。 */
function toJsString(s: string): string {
  return JSON.stringify(s);
}

function renderBlock(block: ContentBlock): string {
  switch (block.type) {
    case 'text':
      return `<p class="blk-text">${escapeHtml(block.content).replace(/\n/g, '<br/>')}</p>`;
    case 'math':
      // 占位 span，页面加载后由 KaTeX 渲染 data-latex
      return `<div class="blk-math" data-latex=${toJsString(block.latex)}></div>`;
    case 'image': {
      const cap = block.caption ? `<figcaption>${escapeHtml(block.caption)}</figcaption>` : '';
      return `<figure class="blk-image"><img src="${encodeURI(block.url)}" />${cap}</figure>`;
    }
    case 'table': {
      const body = block.rows
        .map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`)
        .join('');
      const cap = block.caption ? `<caption>${escapeHtml(block.caption)}</caption>` : '';
      return `<table class="blk-table">${cap}${body}</table>`;
    }
    default:
      return '';
  }
}

/**
 * 把内容块拼成一段完整 HTML 文档。KaTeX 资源占位为 __KATEX_CSS__ / __KATEX_JS__，
 * 由 QuestionBlocks 组件在运行时替换为内联资源字符串（见 Task 3）。
 */
export function buildBlocksHtml(
  blocks: ContentBlock[],
  theme: { fg: string; bg: string; muted: string },
): string {
  const body = blocks.map(renderBlock).join('\n');
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"/>
<style>__KATEX_CSS__</style>
<style>
  * { -webkit-tap-highlight-color: transparent; }
  html,body { margin:0; padding:0; background:${theme.bg}; color:${theme.fg};
    font-size:15px; line-height:1.7; font-family:-apple-system,'Helvetica Neue',sans-serif; }
  #root { padding:12px; }
  .blk-text { margin:0 0 10px; white-space:normal; }
  .blk-math { margin:8px 0; overflow-x:auto; }
  .blk-image { margin:10px 0; text-align:center; }
  .blk-image img { max-width:100%; height:auto; border-radius:6px; }
  figcaption { font-size:12px; color:${theme.muted}; margin-top:4px; }
  .blk-table { border-collapse:collapse; margin:10px 0; width:100%; }
  .blk-table td { border:1px solid ${theme.muted}; padding:4px 8px; font-size:14px; }
  caption { font-size:12px; color:${theme.muted}; margin-bottom:4px; }
</style>
</head><body><div id="root">${body}</div>
<script>__KATEX_JS__</script>
<script>
  (function () {
    function renderMath() {
      var nodes = document.querySelectorAll('.blk-math');
      for (var i = 0; i < nodes.length; i++) {
        try {
          window.katex.render(nodes[i].getAttribute('data-latex'), nodes[i],
            { displayMode: true, throwOnError: false });
        } catch (e) { nodes[i].textContent = nodes[i].getAttribute('data-latex'); }
      }
    }
    function postHeight() {
      var h = document.getElementById('root').scrollHeight;
      if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(String(h));
    }
    renderMath();
    postHeight();
    if (window.ResizeObserver) new ResizeObserver(postHeight).observe(document.getElementById('root'));
    window.addEventListener('load', postHeight);
  })();
</script>
</body></html>`;
}
```

- [ ] **Step 2: 运行 type-check**

Run: `npm run type-check`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/components/study/questionBlocksHtml.ts
git commit -m "feat(study): add KaTeX HTML builder for content blocks"
```

---

### Task 3: 安装 react-native-webview

**Files:**
- Modify: `package.json`（依赖），`package-lock.json`

**Interfaces:**
- Consumes: 无
- Produces: `react-native-webview` 可 import（`import { WebView } from 'react-native-webview'`）

- [ ] **Step 1: 安装指定版本**

Run: `npx expo install react-native-webview@13.15.0`
Expected: `package.json` dependencies 出现 `"react-native-webview": "13.15.0"`（Expo 会校正为 SDK 54 兼容版本，如提示不同版本以 expo install 结果为准）。

- [ ] **Step 2: 验证可解析**

Run: `node -e "require.resolve('react-native-webview')" && echo OK`
Expected: `OK`

- [ ] **Step 3: type-check**

Run: `npm run type-check`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore(deps): add react-native-webview for math rendering"
```

---

### Task 4: QuestionBlocks 渲染组件

**Files:**
- Create: `src/components/study/QuestionBlocks.tsx`
- Modify: `src/components/study/` 无 barrel（现状按文件直接 import），保持直接路径 import。

**Interfaces:**
- Consumes: `ContentBlock`（Task 1）、`buildBlocksHtml`（Task 2）、`react-native-webview`（Task 3）、`useColors`
- Produces:
  - `function QuestionBlocks(props: { blocks?: ContentBlock[]; fallbackText?: string }): JSX.Element | null` — 默认导出。有 `blocks` 用 WebView 渲染；否则渲染 `fallbackText` 纯文本；两者皆空返回 `null`。

- [ ] **Step 1: 写组件**

创建 `src/components/study/QuestionBlocks.tsx`：

```tsx
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { useColors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import type { ContentBlock } from '@/types/question';
import { buildBlocksHtml } from './questionBlocksHtml';

// KaTeX 内联资源：MVP 阶段用最小 CSS + CDN 兜底。
// 完整离线内联在 Phase 1 收尾时替换为打包进 assets 的字符串（见计划末尾「后续」）。
const KATEX_CSS = '';
const KATEX_JS =
  'document.write(\'<script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"><\\/script>\');' +
  'document.write(\'<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css"/>\');';

interface Props {
  blocks?: ContentBlock[];
  fallbackText?: string;
}

export default function QuestionBlocks({ blocks, fallbackText }: Props) {
  const Colors = useColors();
  const [height, setHeight] = useState(80);

  const html = useMemo(() => {
    if (!blocks || blocks.length === 0) return null;
    return buildBlocksHtml(blocks, {
      fg: Colors.textSecondary,
      bg: Colors.surface,
      muted: Colors.textMuted,
    })
      .replace('__KATEX_CSS__', KATEX_CSS)
      .replace('__KATEX_JS__', KATEX_JS);
  }, [blocks, Colors]);

  if (!html) {
    if (!fallbackText) return null;
    return <Text style={[styles.fallback, { color: Colors.textSecondary }]}>{fallbackText}</Text>;
  }

  return (
    <View style={[styles.webWrap, { height }]}>
      <WebView
        originWhitelist={['*']}
        source={{ html }}
        scrollEnabled={false}
        showsVerticalScrollIndicator={false}
        style={{ backgroundColor: 'transparent' }}
        onMessage={(e) => {
          const h = Number(e.nativeEvent.data);
          if (!Number.isNaN(h) && h > 0) setHeight(Math.ceil(h));
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  webWrap: { width: '100%', overflow: 'hidden' },
  fallback: { fontSize: Typography.sm, lineHeight: Typography.sm * 1.7 },
});
```

- [ ] **Step 2: type-check**

Run: `npm run type-check`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/components/study/QuestionBlocks.tsx
git commit -m "feat(study): add QuestionBlocks renderer (WebView + KaTeX, text fallback)"
```

---

### Task 5: mock 数据 — 样例 contentBlocks + KAKOMON_PAPERS

**Files:**
- Modify: `src/mocks/data.ts`（给 `q-todai-2024-math-3` 加 `contentBlocks`/`paperId`/`orderIndex`；文件末尾新增 `KAKOMON_PAPERS`）

**Interfaces:**
- Consumes: `ExamPaper`、`ContentBlock`（Task 1）
- Produces: `export const KAKOMON_PAPERS: ExamPaper[]`（至少含 1 份东大 2024 数学试卷，`questionIds` 指向现有题 id）

- [ ] **Step 1: 给样例题加结构化内容**

在 `src/mocks/data.ts` 中找到 `id: 'q-todai-2024-math-3'` 的对象，在其 `formulaPreview: [...]` 之后插入（LaTeX 用双反斜杠转义）：

```ts
    paperId: 'p-todai-2024-math',
    orderIndex: 3,
    contentBlocks: [
      { type: 'text', content: '設 3×3 実対称行列 A について、以下の問いに答えよ。' },
      { type: 'math', latex: 'A v_1 = 2 v_1,\\quad A v_2 = -v_2,\\quad A v_3 = 5 v_3' },
      { type: 'text', content: 'ここで v₁, v₂, v₃ は互いに直交する単位ベクトルである。' },
      { type: 'text', content: '(1) A が対角化可能であることを示せ。' },
      { type: 'text', content: '(2) 自然数 n に対し Aⁿ の一般式を求めよ。' },
      { type: 'math', latex: 'B = A^2 - 6A + 5I' },
      { type: 'text', content: '(3) B が可逆かどうか判定し、その固有値を求めよ。' },
    ] as const,
```

> 确保引用的 `import` 里包含新类型（`data.ts` 顶部已 `import type { KakomonQuestion } ...`，把 `ExamPaper` 一并加入该 import；若无则新增 `import type { ExamPaper } from '@/types/question';`）。

- [ ] **Step 2: 文件末尾新增 KAKOMON_PAPERS**

在 `src/mocks/data.ts` 末尾追加：

```ts
// ─── 试卷（模考按试卷组织）────────────────────────────────────
export const KAKOMON_PAPERS: ExamPaper[] = [
  {
    id: 'p-todai-2024-math',
    universityId: 'todai',
    graduateSchool: '情报理工学系研究科',
    majorId: null,
    year: 2024,
    subject: '数学',
    title: '2024年度 大学院入学試験問題 数学',
    durationMinutes: 150,
    totalScore: null,
    selectRule: { total: 3, choose: 3 },
    instructions: [
      '試験開始の合図があるまで問題冊子を開かないこと。',
      '解答は日本語または英語で記述すること。',
    ],
    questionIds: ['q-todai-2024-math-3', 'q-todai-2023-math-1'],
  },
];
```

- [ ] **Step 3: type-check**

Run: `npm run type-check`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/mocks/data.ts
git commit -m "feat(mocks): add sample contentBlocks and KAKOMON_PAPERS"
```

---

### Task 6: papers 数据层 API

**Files:**
- Create: `src/api/papers.ts`

**Interfaces:**
- Consumes: `ExamPaper`（Task 1）、`KAKOMON_PAPERS`（Task 5）
- Produces:
  - `async function getPapers(params?: { universityId?: string; graduateSchool?: string; majorId?: string | null }): Promise<ExamPaper[]>`
  - `async function getPaper(id: string): Promise<ExamPaper>`（未命中 throw `Error("Paper not found: "+id)`）

- [ ] **Step 1: 写 API（mock 实现，签名与真后端对齐）**

创建 `src/api/papers.ts`：

```ts
import type { ExamPaper } from '@/types/question';
import { KAKOMON_PAPERS } from '@/mocks/data';

export interface PaperQueryParams {
  universityId?: string;
  graduateSchool?: string;
  majorId?: string | null;
}

export async function getPapers(params: PaperQueryParams = {}): Promise<ExamPaper[]> {
  return KAKOMON_PAPERS.filter((p) => {
    if (params.universityId && p.universityId !== params.universityId) return false;
    if (params.graduateSchool && p.graduateSchool !== params.graduateSchool) return false;
    if (params.majorId && p.majorId && p.majorId !== params.majorId) return false;
    return true;
  }).sort((a, b) => b.year - a.year);
}

export async function getPaper(id: string): Promise<ExamPaper> {
  const hit = KAKOMON_PAPERS.find((p) => p.id === id);
  if (!hit) throw new Error(`Paper not found: ${id}`);
  return hit;
}
```

- [ ] **Step 2: type-check**

Run: `npm run type-check`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/api/papers.ts
git commit -m "feat(api): add papers mock data layer (getPapers/getPaper)"
```

---

### Task 7: 题目详情页接入 QuestionBlocks

**Files:**
- Modify: `app/questions/[id].tsx`（②「题目」区块，约 391-418 行）

**Interfaces:**
- Consumes: `QuestionBlocks`（Task 4）
- Produces: 无（屏幕改动）

- [ ] **Step 1: import 组件**

在 `app/questions/[id].tsx` 顶部 import 区（`import { recommendRelated } ...` 之后）加：

```tsx
import QuestionBlocks from '@/components/study/QuestionBlocks';
```

- [ ] **Step 2: 用 QuestionBlocks 替换纯文本题干**

将 ②「Question body」区块（`{question.bodyText && ( ... )}` 整段）替换为——改为只要有 `contentBlocks` 或 `bodyText` 任一即渲染：

```tsx
        {/* ② Question body */}
        {(question.contentBlocks?.length || question.bodyText) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>题目</Text>
            <Card style={styles.sectionCard}>
              <QuestionBlocks blocks={question.contentBlocks} fallbackText={question.bodyText} />
              <View style={styles.bodyActions}>
                <Pressable style={styles.ghostBtn} onPress={() => setImageModalVisible(true)}>
                  <Icon name="eye" size={12} color={Colors.textMuted} />
                  <Text style={styles.ghostBtnText}>查看原版</Text>
                </Pressable>
                <Pressable
                  style={styles.ghostBtn}
                  onPress={() => Share.share({ message: question.bodyText ?? question.title })}
                >
                  <Icon name="copy" size={12} color={Colors.textMuted} />
                  <Text style={styles.ghostBtnText}>复制</Text>
                </Pressable>
              </View>
            </Card>
          </View>
        )}
```

> 说明：删除了旧的 `formulaPreview` monospace 盒子（其内容已由 `contentBlocks` 的 `math` 块承载）；`formulaPreview` 字段本身保留在类型里不动。

- [ ] **Step 3: type-check**

Run: `npm run type-check`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add app/questions/[id].tsx
git commit -m "feat(questions): render question body via QuestionBlocks"
```

---

### Task 8: 模考答题区接入 QuestionBlocks

**Files:**
- Modify: `app/exam-session.tsx`（answer phase 题干区，约 169-172 行）

**Interfaces:**
- Consumes: `QuestionBlocks`（Task 4）
- Produces: 无

- [ ] **Step 1: import**

在 `app/exam-session.tsx` 顶部 import 区加：

```tsx
import QuestionBlocks from '@/components/study/QuestionBlocks';
```

- [ ] **Step 2: 替换题干渲染**

将 answer phase 中的题干卡：

```tsx
          <View style={styles.qBodyCard}>
            <Text style={styles.qBody}>{current.bodyText ?? '（本题暂无题干文本，请参考原题图片作答。考试模式下不显示解析。）'}</Text>
          </View>
```

替换为：

```tsx
          <View style={styles.qBodyCard}>
            <QuestionBlocks
              blocks={current.contentBlocks}
              fallbackText={current.bodyText ?? '（本题暂无题干文本，请参考原题图片作答。考试模式下不显示解析。）'}
            />
          </View>
```

- [ ] **Step 3: type-check**

Run: `npm run type-check`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add app/exam-session.tsx
git commit -m "feat(exam): render exam question body via QuestionBlocks"
```

---

### Task 9: 模考倒计时 + 选做规则提示

**Files:**
- Modify: `app/exam-session.tsx`（新增 `durationMinutes`/`selectRule` 入参、倒计时状态、header 展示）

**Interfaces:**
- Consumes: `ExamPaper` 字段（通过路由参数传入 `durationMinutes`、`selectTotal`、`selectChoose`）
- Produces: 无

- [ ] **Step 1: 读取新路由参数**

在 `app/exam-session.tsx` 的 `useLocalSearchParams` 泛型里补充参数：

```tsx
  const params = useLocalSearchParams<{ title?: string; ids?: string; universityId?: string; mode?: string; durationMinutes?: string; selectTotal?: string; selectChoose?: string }>();
```

在 `mode` 定义之后新增：

```tsx
  const durationMinutes = params.durationMinutes ? Number(params.durationMinutes) : null;
  const selectTotal = params.selectTotal ? Number(params.selectTotal) : null;
  const selectChoose = params.selectChoose ? Number(params.selectChoose) : null;
```

- [ ] **Step 2: 加倒计时状态**

在 `const [savedId, setSavedId] = useState<string | null>(null);` 之后新增（用 `useEffect` + `useRef` 计时，答题阶段才走）：

```tsx
  const [remainingSec, setRemainingSec] = useState<number | null>(
    durationMinutes ? durationMinutes * 60 : null,
  );
  useEffect(() => {
    if (phase !== 'answer' || remainingSec === null) return;
    if (remainingSec <= 0) return;
    const t = setInterval(() => setRemainingSec((s) => (s === null ? s : Math.max(0, s - 1))), 1000);
    return () => clearInterval(t);
  }, [phase, remainingSec]);

  const clock = remainingSec === null
    ? null
    : `${String(Math.floor(remainingSec / 60)).padStart(2, '0')}:${String(remainingSec % 60).padStart(2, '0')}`;
```

> 在文件顶部 `import { useMemo, useState } from 'react';` 改为 `import { useEffect, useMemo, useState } from 'react';`。

- [ ] **Step 3: header 展示倒计时 + 选做规则**

将 header 的 `headerSub` 那段改为在答题阶段显示时钟；并在 progress dots 下方（`<View style={styles.progressRow}>...</View>` 之后）加一行选做规则提示：

```tsx
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{title}</Text>
          <Text style={styles.headerSub}>
            {phase === 'answer'
              ? `答题中 · ${idx + 1}/${questions.length}${clock ? ` · ⏱ ${clock}` : ''}`
              : phase === 'grade' ? '自评批改' : '成绩'}
          </Text>
        </View>
```

在 `progressRow` 之后：

```tsx
      {phase === 'answer' && selectTotal && selectChoose && (
        <Text style={styles.selectRuleHint}>本卷 {selectTotal} 题中任选 {selectChoose} 题作答</Text>
      )}
```

在 `makeStyles` 里新增样式（`examHint` 附近）：

```tsx
  selectRuleHint: { fontSize: Typography.xs, color: c.amber500, textAlign: 'center', paddingHorizontal: Spacing.screenPadding, marginBottom: 4 },
```

- [ ] **Step 4: type-check**

Run: `npm run type-check`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add app/exam-session.tsx
git commit -m "feat(exam): add countdown timer and select-rule hint"
```

---

### Task 10: 模考首页改读 ExamPaper

**Files:**
- Modify: `app/mock-exam.tsx`（年份卡数据源 + 展示 + 传参）

**Interfaces:**
- Consumes: `getPapers`（Task 6）或直接 `KAKOMON_PAPERS`；`ExamPaper`
- Produces: 无

- [ ] **Step 1: import 试卷数据**

在 `app/mock-exam.tsx` 顶部把 `KAKOMON_PAPERS` 加入 mock import：

```tsx
import { KAKOMON_QUESTIONS, KAKOMON_UNIVERSITIES, UNI_GRADS, UNI_MAJORS, DEMO_USER, KAKOMON_PAPERS } from '@/mocks/data';
```

并在类型 import 补 `ExamPaper`：

```tsx
import type { KakomonQuestion, ExamPaper } from '@/types/question';
```

- [ ] **Step 2: 用 paper 关联年份卡**

在 `yearGroups` useMemo 之后新增：按当前 `activeEntry` 找出匹配的试卷，key 用 `${year}::${subject}`：

```tsx
  const papersForEntry = useMemo(() => {
    if (!activeEntry) return [] as ExamPaper[];
    return KAKOMON_PAPERS.filter(
      (p) => p.universityId === activeEntry.universityId && p.graduateSchool === activeEntry.gradSchool,
    );
  }, [activeEntry]);

  const findPaper = (year: number, subject: string) =>
    papersForEntry.find((p) => p.year === year && p.subject === subject) ?? null;
```

- [ ] **Step 3: 卡片展示试卷信息 + 传参给 exam-session**

在 `startExam` 函数中，把找到的 paper 的时长/选做规则拼进跳转 URL：

```tsx
  function startExam(year: number, subject: string) {
    if (!activeEntry) return;
    const qs = pool.filter((q) => q.year === year && q.subject === subject);
    if (qs.length === 0) return;
    const ids = qs.map((q) => q.id).join(',');
    const paper = findPaper(year, subject);
    const extra = paper
      ? `${paper.durationMinutes ? `&durationMinutes=${paper.durationMinutes}` : ''}${paper.selectRule ? `&selectTotal=${paper.selectRule.total}&selectChoose=${paper.selectRule.choose}` : ''}`
      : '';
    router.push(`/exam-session?title=${encodeURIComponent(`${activeUni?.short ?? ''} ${year} ${subject}`)}&universityId=${activeEntry.universityId}&mode=mock&ids=${ids}${extra}` as any);
  }
```

在年份卡的 `<Text style={styles.questionCount}>` 之后，增加试卷元信息展示（有 paper 才显示）：

```tsx
                      {(() => {
                        const paper = findPaper(yg.year, selected);
                        if (!paper) return null;
                        return (
                          <Text style={styles.paperMeta}>
                            {paper.durationMinutes ? `⏱ ${paper.durationMinutes} 分` : ''}
                            {paper.selectRule ? `　·　${paper.selectRule.total} 题选 ${paper.selectRule.choose}` : ''}
                          </Text>
                        );
                      })()}
```

- [ ] **Step 4: type-check**

Run: `npm run type-check`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add app/mock-exam.tsx
git commit -m "feat(mock-exam): drive year cards from ExamPaper (duration/select-rule)"
```

---

### Task 11: 真机/模拟器功能验证 + TASKS.md 收尾

**Files:**
- Modify: `Kairos-kakomon/TASKS.md`（追加本期 checklist 完成注释）

**Interfaces:**
- Consumes: 全部前序 Task
- Produces: 无

- [ ] **Step 1: 全量门禁**

Run: `npm run type-check && npm run lint`
Expected: 均 PASS

- [ ] **Step 2: 启动并在模拟器验证**

Run: `npm run ios`（或 `npm start` 用 Expo Go）
手动验证清单（golden path + 边缘）：
- 专题学习 → 东大情报理工 → 数学 → 打开 `q-todai-2024-math-3`：题干区**公式正确渲染**（积分/矩阵/分式），图片块显示占位或图。
- 打开一道**只有 bodyText、无 contentBlocks** 的旧题（如 `q-titech-2021-math-2`）：题干**回退为纯文本**，不报错、不空白。
- 模拟考试 → 东大情报理工 → 2024 数学卡：显示 **⏱ 150 分 · 3 题选 3**；开始模考后 header 出现**倒计时**并每秒递减，选做规则提示出现。
- 模考走完 作答 → 交卷 → 自评 → 成绩，成绩在「我的」曲线可见。

> 若 UI 无法在本环境启动，明确说明"未能实机验证"，不得假称通过。

- [ ] **Step 3: TASKS.md 追加完成记录**

在 `Kairos-kakomon/TASKS.md` 末尾追加（不改写既有行）：

```markdown
- [x] 专题学习/模考 Phase 1：结构化 content_blocks + WebView/KaTeX 渲染 + 模考试卷化（倒计时/选做规则）
  ✅ 完成于 2026-07-02，前端跑在 mock 数据；后端落库为 Phase 2
```

- [ ] **Step 4: Commit**

```bash
git add Kairos-kakomon/TASKS.md
git commit -m "docs(tasks): mark topic-study/mock-exam Phase 1 frontend done"
```

---

## 后续（Phase 1 收尾可选，非阻塞）

- **KaTeX 离线内联**：Task 4 目前用 CDN 兜底加载 KaTeX（首次需网络）。收尾时可把 `katex.min.css`/`katex.min.js` 作为字符串资源打包，替换 `KATEX_CSS`/`KATEX_JS` 常量，实现完全离线、无闪烁。
- **SchoolRail 抽取**：独立重构计划（见 File Structure 注释）。

## Self-Review

**Spec coverage（对照 spec §5/§6，Phase 1 范围）：**
- §5.1 类型升级 → Task 1 ✅
- §5.2 QuestionBlocks(WebView+KaTeX) → Task 2/3/4 ✅
- §5.3 mock 数据 + papers.ts → Task 5/6 ✅
- §5.4 SchoolRail → 显式移出本计划并说明理由 ✅（范围决策）
- §6.1 详情页接入 → Task 7 ✅
- §6.2 模考接入 + 倒计时 + 选做规则 → Task 8/9/10 ✅
- §8 验证（type-check/lint/模拟器） → Task 11 ✅
- Phase 2/3（后端/切流）→ 明确不在本计划（另立计划）✅

**Placeholder scan:** 无 TBD/TODO；每个改动步骤都给了完整代码块与确切路径/行号区间。CDN-KaTeX 是有意的 MVP 兜底并在「后续」标注升级路径，非占位。

**Type consistency:** `ContentBlock`/`ExamPaper`/`contentBlocks?/paperId?/orderIndex?`（Task 1）在 Task 2/4/5/6/7/8/10 一致引用；`buildBlocksHtml(blocks, {fg,bg,muted})` 签名（Task 2）与 Task 4 调用一致；`QuestionBlocks({blocks, fallbackText})`（Task 4）与 Task 7/8 用法一致；`getPapers/getPaper`（Task 6）签名与 Task 10 数据源一致。倒计时参数 `durationMinutes/selectTotal/selectChoose` 在 Task 9（读）与 Task 10（传）命名一致。
