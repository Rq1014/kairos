# 研究科字典数据源化（第二期）Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让前端研究科/专业字典以后端 `/api/dict/universities/tree` 为数据源，静态字典降为离线 seed 兜底，新增学校以后只改后端一处。

**Architecture:** 新建 `src/api/dict.ts`（拉 tree/version + 拍平为规范化字典）与 `src/store/dictStore.ts`（zustand 单例，初始态即 seed，hydrate 做 cache→network 渐进覆盖，对外暴露与静态字典同签名的**同步** selector）。8 个消费点把 `UNI_GRADS`/`UNI_MAJORS`/`gradName` 的读取换成 `dictGrads`/`dictMajors`/`dictGradName`，选择器列表文件加 `version` 订阅触发刷新。

**Tech Stack:** Expo/React Native + TypeScript（strict）、zustand、AsyncStorage、既有 `apiRequest`（`src/api/client.ts`）。

**Spec:** `docs/superpowers/specs/2026-07-07-gradschool-dict-datasource-design.md`

## Global Constraints

- **无测试运行器**：本项目没有 jest/vitest（见 `CLAUDE.md`）。每个任务的验证门禁 = `npm run type-check`（EXIT 0）+ 必要处 `grep` 静态走查；功能正确性靠最后的人工真机验证。所有命令在 `Kairos-kakomon/` 目录下运行。
- **TypeScript strict**：`tsconfig.json` `strict: true`，路径别名 `@/* → ./src/*`。
- **selector 是普通函数，非 hook**：`dictGradName` / `dictGrads` / `dictMajors` 内部 `useDictStore.getState()` 读快照，永远同步返回；空值内建兜底（`dictGrads`→`[]`，`dictMajors`→`[]`）。
- **seed 兜底双保险**：selector 命中 store 为空时回退静态常量（`UNI_GRADS`/`UNI_MAJORS`/`GRAD_SCHOOL_NAMES`），防止后端缺条目导致显示消失。
- **静态字典保留**：`src/mocks/data.ts` 的 `UNI_GRADS`/`UNI_MAJORS`/`GRAD_SCHOOL_NAMES`/`gradName()` **不删**，作为 dictStore 的 seed 源。
- **user 数据结构不变**：`user.targetSchools` 仍存 `universityId + gradSchool(code)`。
- **import 编辑要外科手术式**：多数消费文件同时从 `@/mocks/data` import 了 `KAKOMON_UNIVERSITIES`/`KAKOMON_QUESTIONS`/`DEMO_USER`/`KAKOMON_SEARCH_*`，这些**保留**，只移除 dict 符号（`UNI_GRADS`/`UNI_MAJORS`/`GRAD_SCHOOL_NAMES`/`gradName`）。
- **不碰 StyleSheet**：`topic-study.tsx` / `mock-exam.tsx` 里有样式键 `gradName: {...}` 和 `styles.gradName`，与字典函数无关，**不得改动**。

---

## 后端返回结构（tree，来自 `UniversityTreeResponse.java`，Jackson 序列化后）

```jsonc
{
  "version": 3,
  "universities": [
    {
      "id": "todai", "nameCn": "...", "nameJp": "...", "short": "...",
      "regionGroup": "...", "type": "national",
      "gradSchools": [
        {
          "id": "info-sci", "nameJp": "情報理工学系研究科", "category": "理工",
          "majors": [
            { "id": "cs", "label": "コンピュータ科学", "short": "CS", "desc": "...", "subjects": ["..."] }
          ]
        }
      ]
    }
  ]
}
```

> 注意：Java `getShort()` → JSON 键是 `short`（不是 `shortName`）。`/api/dict/version` 返回 `{ "version": 3 }`。

---

## File Structure

- **Create** `src/api/dict.ts` — tree/version 拉取 + `normalizeTree()` 拍平（纯函数）。
- **Create** `src/store/dictStore.ts` — 规范化字典 store + hydrate + 3 selector。
- **Modify** `app/_layout.tsx` — 顶层加一行 `useDictStore.getState().hydrate()`。
- **Modify** 8 消费点：`src/components/study/EditTargetSheet.tsx`、`app/topic-study.tsx`、`app/mock-exam.tsx`、`app/edit-profile.tsx`、`app/(auth)/onboard-profile.tsx`、`app/search.tsx`、`app/questions/[id].tsx`、`app/(tabs)/study/index.tsx`。
- **Modify** `src/api/universities.ts` — 死代码桥接的 code 保真（cosmetic，无消费方）。
- **Modify** `src/mocks/data.ts` — 给三个字典常量加 seed 来源注释。

---

## Task 1: API 层 `src/api/dict.ts`

**Files:**
- Create: `src/api/dict.ts`

**Interfaces:**
- Consumes: `apiRequest` from `./client`；`UniGrads`/`UniMajors`/`MajorOption` from `@/types/university`。
- Produces:
  - `interface NormalizedDict { gradsByUni: Record<string,string[]>; majorsByKey: Record<string,MajorOption[]>; gradNameMap: Record<string,string>; version: number }`
  - `async function fetchDictVersion(): Promise<number>`
  - `async function fetchDictTree(): Promise<NormalizedDict | null>`
  - `function normalizeTree(raw: RawTree): NormalizedDict`

- [ ] **Step 1: 写文件**

创建 `src/api/dict.ts`：

```ts
import type { MajorOption } from '@/types/university';
import { apiRequest } from './client';

// —— 后端 tree 原始形状（对应 UniversityTreeResponse.java，Jackson 序列化后）——
interface RawMajorNode {
  id: string;
  label: string;
  short?: string;
  desc?: string;
  subjects?: string[];
}
interface RawGradNode {
  id: string;
  nameJp?: string;
  category?: string;
  majors?: RawMajorNode[];
}
interface RawUniNode {
  id: string;
  gradSchools?: RawGradNode[];
}
export interface RawTree {
  version?: number;
  universities?: RawUniNode[];
}

/** 规范化字典：形状与静态字典逐一对应，供 dictStore 直接采纳。 */
export interface NormalizedDict {
  gradsByUni: Record<string, string[]>;      // ≙ UNI_GRADS
  majorsByKey: Record<string, MajorOption[]>; // ≙ UNI_MAJORS，键 `uni::gradCode`
  gradNameMap: Record<string, string>;        // ≙ GRAD_SCHOOL_NAMES，键 `uni::gradCode`
  version: number;
}

/** 把后端 tree 拍平成规范化字典；坏节点跳过，不整体丢弃。 */
export function normalizeTree(raw: RawTree): NormalizedDict {
  const gradsByUni: Record<string, string[]> = {};
  const majorsByKey: Record<string, MajorOption[]> = {};
  const gradNameMap: Record<string, string> = {};

  for (const uni of raw.universities ?? []) {
    if (!uni || !uni.id) continue;
    const grads: string[] = [];
    for (const g of uni.gradSchools ?? []) {
      if (!g || !g.id) continue;
      grads.push(g.id);
      const key = `${uni.id}::${g.id}`;
      if (g.nameJp) gradNameMap[key] = g.nameJp;
      majorsByKey[key] = (g.majors ?? [])
        .filter((m) => m && m.id)
        .map((m) => ({
          id: m.id,
          label: m.label ?? m.id,
          short: m.short ?? '',
          desc: m.desc ?? '',
        }));
    }
    gradsByUni[uni.id] = grads;
  }

  return { gradsByUni, majorsByKey, gradNameMap, version: raw.version ?? 0 };
}

/** 拉取字典版本号；失败抛 ApiError（调用方 catch 后静默降级）。 */
export async function fetchDictVersion(): Promise<number> {
  const data = await apiRequest<{ version: number }>('/api/dict/version', {
    method: 'GET',
    skipAuth: true,
  });
  return data?.version ?? 0;
}

/**
 * 拉取完整 tree 并规范化。
 * 返回 null 表示后端空树（items 为空）——调用方据此跳过覆盖，保护已有 seed/cache。
 */
export async function fetchDictTree(): Promise<NormalizedDict | null> {
  const raw = await apiRequest<RawTree>('/api/dict/universities/tree', {
    method: 'GET',
    skipAuth: true,
  });
  if (!raw || !Array.isArray(raw.universities) || raw.universities.length === 0) {
    return null;
  }
  return normalizeTree(raw);
}
```

- [ ] **Step 2: 门禁 type-check**

Run: `npm run type-check`
Expected: EXIT 0（`dict.ts` 类型与 `MajorOption` 对齐，无错误）。

- [ ] **Step 3: Commit**

```bash
git add src/api/dict.ts
git commit -m "feat(dict): add dict API layer (tree/version fetch + normalizeTree)"
```

---

## Task 2: Store 层 `src/store/dictStore.ts`

**Files:**
- Create: `src/store/dictStore.ts`

**Interfaces:**
- Consumes: `NormalizedDict`/`fetchDictVersion`/`fetchDictTree` from `@/api/dict`；`UNI_GRADS`/`UNI_MAJORS`/`GRAD_SCHOOL_NAMES` from `@/mocks/data`；`MajorOption` from `@/types/university`。
- Produces:
  - `useDictStore`（zustand，含 `version`/`isHydrated`/`source`/`hydrate()`）
  - `function dictGradName(uni: string, code: string): string`
  - `function dictGrads(uni: string): string[]`
  - `function dictMajors(uni: string, gradCode: string): MajorOption[]`

- [ ] **Step 1: 写文件**

创建 `src/store/dictStore.ts`：

```ts
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { MajorOption } from '@/types/university';
import {
  NormalizedDict,
  fetchDictVersion,
  fetchDictTree,
} from '@/api/dict';
import { UNI_GRADS, UNI_MAJORS, GRAD_SCHOOL_NAMES } from '@/mocks/data';

const STORAGE_KEY = 'kakomon_dict_v1';

interface DictState extends NormalizedDict {
  isHydrated: boolean;
  source: 'seed' | 'cache' | 'network';
  hydrate: () => Promise<void>;
}

/** 用静态字典构造初始 seed，使 store 从创建那刻起就非空（selector 永远同步有值）。 */
function buildSeed(): NormalizedDict {
  return {
    gradsByUni: { ...UNI_GRADS },
    majorsByKey: { ...UNI_MAJORS },
    gradNameMap: { ...GRAD_SCHOOL_NAMES },
    version: 0,
  };
}

function persist(dict: NormalizedDict) {
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(dict)).catch(() => {});
}

/** 校验缓存形状，防止旧 schema 缓存污染。 */
function isValidCache(v: unknown): v is NormalizedDict {
  if (!v || typeof v !== 'object') return false;
  const d = v as Record<string, unknown>;
  return (
    typeof d.version === 'number' &&
    typeof d.gradsByUni === 'object' &&
    typeof d.majorsByKey === 'object' &&
    typeof d.gradNameMap === 'object'
  );
}

export const useDictStore = create<DictState>((set, get) => ({
  ...buildSeed(),
  isHydrated: false,
  source: 'seed',

  hydrate: async () => {
    // 1) 读缓存（上次后端数据），命中即覆盖 seed
    try {
      const rawCache = await AsyncStorage.getItem(STORAGE_KEY);
      if (rawCache) {
        const parsed = JSON.parse(rawCache);
        if (isValidCache(parsed)) {
          set({
            gradsByUni: parsed.gradsByUni,
            majorsByKey: parsed.majorsByKey,
            gradNameMap: parsed.gradNameMap,
            version: parsed.version,
            source: 'cache',
          });
        }
      }
    } catch {
      // 缓存读失败 → 保持 seed
    }
    set({ isHydrated: true });

    // 2) fire-and-forget 版本检查 + 按需拉 tree
    try {
      const remoteVersion = await fetchDictVersion();
      if (remoteVersion > get().version) {
        const fresh = await fetchDictTree();
        if (fresh) {
          set({
            gradsByUni: fresh.gradsByUni,
            majorsByKey: fresh.majorsByKey,
            gradNameMap: fresh.gradNameMap,
            version: fresh.version,
            source: 'network',
          });
          persist(fresh);
        }
      }
    } catch {
      // 版本/tree 请求失败 → 静默降级，保持 cache/seed
    }
  },
}));

// —— 对外同步 selector（普通函数，非 hook；命中 store 空时回退静态 seed）——

/** 研究科 code → 日文显示名（替代 mocks 的 gradName）。 */
export function dictGradName(uni: string, code: string): string {
  const key = `${uni}::${code}`;
  return get().gradNameMap[key] ?? GRAD_SCHOOL_NAMES[key] ?? code;
}

/** 某大学的研究科 code 列表（替代 UNI_GRADS[uni] ?? []）。 */
export function dictGrads(uni: string): string[] {
  return get().gradsByUni[uni] ?? UNI_GRADS[uni] ?? [];
}

/** 某大学某研究科下的专业列表（替代 UNI_MAJORS[`uni::grad`] ?? []）。 */
export function dictMajors(uni: string, gradCode: string): MajorOption[] {
  const key = `${uni}::${gradCode}`;
  return get().majorsByKey[key] ?? UNI_MAJORS[key] ?? [];
}

function get() {
  return useDictStore.getState();
}
```

> 说明：`get()` 提在文件底部（函数声明有 hoisting，selector 内可先用后定义）。selector 每次读 `getState()` 最新快照，network 覆盖后立即反映。

- [ ] **Step 2: 门禁 type-check**

Run: `npm run type-check`
Expected: EXIT 0。

- [ ] **Step 3: Commit**

```bash
git add src/store/dictStore.ts
git commit -m "feat(dict): add dictStore (seed init + hydrate + sync selectors)"
```

---

## Task 3: 启动接线 `app/_layout.tsx`

**Files:**
- Modify: `app/_layout.tsx`（import 区 + 顶层 hydrate 调用区，约 18–21 行附近）

**Interfaces:**
- Consumes: `useDictStore` from `@/store/dictStore`。
- Produces: 无（副作用接线）。

- [ ] **Step 1: 加 import**

在 `app/_layout.tsx` 现有 store import 群里加一行（紧邻 `useBrowseSchoolsStore` 的 import）：

```ts
import { useDictStore } from '@/store/dictStore';
```

- [ ] **Step 2: 加顶层 hydrate 调用**

找到现有这段（约 18–21 行）：

```ts
useThemeStore.getState().hydrate();
useAttemptStore.getState().hydrate();
useFavoritesStore.getState().hydrate();
useBrowseSchoolsStore.getState().hydrate();
```

在其后追加一行：

```ts
useDictStore.getState().hydrate();
```

> 注意：**不要**把 `dictStore.isHydrated` 加进 `_layout` 的 `isHydrated` 渲染门（第 100/139 行那套）。字典 seed 即刻可用，network 后台刷新无感——加进渲染门会白白阻塞首屏。

- [ ] **Step 3: 门禁 type-check**

Run: `npm run type-check`
Expected: EXIT 0。

- [ ] **Step 4: Commit**

```bash
git add app/_layout.tsx
git commit -m "feat(dict): hydrate dictStore at app startup"
```

---

## Task 4: 消费点批次 A（选择器密集 3 文件）

**Files:**
- Modify: `src/components/study/EditTargetSheet.tsx`
- Modify: `app/topic-study.tsx`
- Modify: `app/mock-exam.tsx`

**Interfaces:**
- Consumes: `dictGradName`/`dictGrads`/`dictMajors` + `useDictStore` from `@/store/dictStore`。
- Produces: 无。

### 4.1 EditTargetSheet.tsx

- [ ] **Step 1: 改 import**

第 15 行：

```ts
// before
import { KAKOMON_UNIVERSITIES, UNI_GRADS, UNI_MAJORS, gradName } from '@/mocks/data';
// after
import { KAKOMON_UNIVERSITIES } from '@/mocks/data';
import { dictGradName, dictGrads, dictMajors, useDictStore } from '@/store/dictStore';
```

- [ ] **Step 2: 组件顶部加 version 订阅**

在组件函数体开头（其它 hook 附近）加：

```ts
const dictVersion = useDictStore((s) => s.version);
```

> `dictVersion` 仅用于触发重渲，可加 `// eslint-disable-next-line @typescript-eslint/no-unused-vars` 若 lint 报未使用；或在下方 `useMemo` 依赖数组里带上它（见 Step 3）。

- [ ] **Step 3: 替换字典读取**

逐处替换（行号以当前文件为准，按符号定位）：

| 位置 | before | after |
|---|---|---|
| L285 | `UNI_MAJORS[`${e.universityId}::${e.gradSchool}`]?.find(...)` | `dictMajors(e.universityId, e.gradSchool).find(...)` |
| L286 | `gradName(e.universityId, e.gradSchool)` | `dictGradName(e.universityId, e.gradSchool)` |
| L386 | `(UNI_GRADS[pickedUniId] ?? [])` | `dictGrads(pickedUniId)` |
| L390 | `(UNI_MAJORS[`${pickedUniId}::${pickedGrad}`] ?? [])` | `dictMajors(pickedUniId, pickedGrad)` |
| L433 | `gradName(pickedUniId!, pickedGrad)` | `dictGradName(pickedUniId!, pickedGrad)` |
| L465 | `UNI_GRADS[u.id] ?? []` | `dictGrads(u.id)` |
| L505 | `UNI_MAJORS[`${pickedUniId}::${grad}`] ?? []` | `dictMajors(pickedUniId, grad)` |
| L514 | `gradName(pickedUniId!, grad)` | `dictGradName(pickedUniId!, grad)` |

> L386/L390 若在 `useMemo` 内，把 `dictVersion` 加进依赖数组（`[pickedUniId, dictVersion]` / `[pickedUniId, pickedGrad, dictVersion]`），消化 Step 2 的变量并让 network 刷新后重算。

### 4.2 topic-study.tsx

- [ ] **Step 4: 改 import**

第 21 行：

```ts
// before
import { KAKOMON_QUESTIONS, KAKOMON_UNIVERSITIES, UNI_GRADS, UNI_MAJORS, DEMO_USER, GRAD_SCHOOL_NAMES, gradName } from '@/mocks/data';
// after
import { KAKOMON_QUESTIONS, KAKOMON_UNIVERSITIES, DEMO_USER } from '@/mocks/data';
import { dictGradName, dictGrads, dictMajors, useDictStore } from '@/store/dictStore';
```

- [ ] **Step 5: 重写私有 gradShort（L41–44）**

```ts
// before
function gradShort(universityId: string, code: string): string {
  const name = GRAD_SCHOOL_NAMES[`${universityId}::${code}`] ?? code;
  // ...截断逻辑保持不变...
}
// after
function gradShort(universityId: string, code: string): string {
  const name = dictGradName(universityId, code);
  // ...截断逻辑保持不变...
}
```

> 只改取名那一行，函数的截断逻辑原样保留。

- [ ] **Step 6: 替换字典读取 + 加订阅**

组件顶部加 `const dictVersion = useDictStore((s) => s.version);`（并入相关 `useMemo` 依赖）。逐处替换：

| 位置 | before | after |
|---|---|---|
| L39 | `(UNI_GRADS[universityId]?.[0] ?? '')` | `(dictGrads(universityId)[0] ?? '')` |
| L140 | `UNI_MAJORS[`${s.universityId}::${grad}`] ?? []` | `dictMajors(s.universityId, grad)` |
| L152 | `(UNI_GRADS[e.universityId]?.[0] ?? '')` | `(dictGrads(e.universityId)[0] ?? '')` |
| L306 | `(UNI_GRADS[pendingUni] ?? [])` | `dictGrads(pendingUni)` |
| L371 | `gradName(activeEntry.universityId, activeEntry.gradSchool)` | `dictGradName(activeEntry.universityId, activeEntry.gradSchool)` |

> **不要动** L112 `gradName: {...}`（样式键）、L480 `styles.gradName`、L319/L409 的 `gradShort(...)`（已在 Step 5 内部改好）。

### 4.3 mock-exam.tsx

- [ ] **Step 7: 改 import**

第 21 行（与 topic-study 同款）：

```ts
// before
import { KAKOMON_QUESTIONS, KAKOMON_UNIVERSITIES, UNI_GRADS, UNI_MAJORS, DEMO_USER, GRAD_SCHOOL_NAMES, gradName } from '@/mocks/data';
// after
import { KAKOMON_QUESTIONS, KAKOMON_UNIVERSITIES, DEMO_USER } from '@/mocks/data';
import { dictGradName, dictGrads, dictMajors, useDictStore } from '@/store/dictStore';
```

- [ ] **Step 8: 重写私有 gradShort（L49–52）**

同 4.2 Step 5：把 `GRAD_SCHOOL_NAMES[`${universityId}::${code}`] ?? code` 换成 `dictGradName(universityId, code)`，截断逻辑不变。

- [ ] **Step 9: 替换字典读取 + 加订阅**

组件顶部加 `const dictVersion = useDictStore((s) => s.version);`（并入相关 `useMemo` 依赖）。逐处替换：

| 位置 | before | after |
|---|---|---|
| L47 | `(UNI_GRADS[universityId]?.[0] ?? '')` | `(dictGrads(universityId)[0] ?? '')` |
| L168 | `UNI_MAJORS[`${s.universityId}::${grad}`] ?? []` | `dictMajors(s.universityId, grad)` |
| L180 | `(UNI_GRADS[e.universityId]?.[0] ?? '')` | `(dictGrads(e.universityId)[0] ?? '')` |
| L370 | `(UNI_GRADS[pendingUni] ?? [])` | `dictGrads(pendingUni)` |
| L433 | `gradName(activeEntry.universityId, activeEntry.gradSchool)` | `dictGradName(activeEntry.universityId, activeEntry.gradSchool)` |

> **不要动** L137 `gradName: {...}`、L607 `styles.gradName`、L323/L536 的 `gradShort(...)`。

- [ ] **Step 10: 门禁 type-check + 静态走查**

Run: `npm run type-check`
Expected: EXIT 0。

Run: `grep -nE "UNI_GRADS|UNI_MAJORS|GRAD_SCHOOL_NAMES|[^t.]gradName\(" src/components/study/EditTargetSheet.tsx app/topic-study.tsx app/mock-exam.tsx`
Expected: 无输出（`styles.gradName` 因前缀 `.` 被 `[^t.]` 排除；`dictGradName` 因前缀 `t` 被排除）。

- [ ] **Step 11: Commit**

```bash
git add src/components/study/EditTargetSheet.tsx app/topic-study.tsx app/mock-exam.tsx
git commit -m "refactor(dict): batch A consumers read from dictStore"
```

---

## Task 5: 消费点批次 B（edit-profile / onboard-profile）

**Files:**
- Modify: `app/edit-profile.tsx`
- Modify: `app/(auth)/onboard-profile.tsx`

**Interfaces:**
- Consumes: `dictGradName`/`dictGrads`/`dictMajors` + `useDictStore` from `@/store/dictStore`。

### 5.1 edit-profile.tsx

- [ ] **Step 1: 改 import**

第 23 行：

```ts
// before
import { KAKOMON_UNIVERSITIES, DEMO_USER, UNI_GRADS, UNI_MAJORS, gradName } from '@/mocks/data';
// after
import { KAKOMON_UNIVERSITIES, DEMO_USER } from '@/mocks/data';
import { dictGradName, dictGrads, dictMajors, useDictStore } from '@/store/dictStore';
```

- [ ] **Step 2: 替换字典读取 + 加订阅**

组件顶部加 `const dictVersion = useDictStore((s) => s.version);`（并入相关 `useMemo` 依赖）。逐处替换：

| 位置 | before | after |
|---|---|---|
| L215 | `(UNI_GRADS[pickedUniId] ?? [])` | `dictGrads(pickedUniId)` |
| L219 | `(UNI_MAJORS[`${pickedUniId}::${pickedGrad}`] ?? [])` | `dictMajors(pickedUniId, pickedGrad)` |
| L563 | `UNI_MAJORS[`${ts.universityId}::${ts.gradSchool}`]?.find(...)` | `dictMajors(ts.universityId, ts.gradSchool ?? '').find(...)` |
| L565 | `gradName(ts.universityId, ts.gradSchool ?? '')` | `dictGradName(ts.universityId, ts.gradSchool ?? '')` |
| L672 | `gradName(pickedUniId!, pickedGrad)` | `dictGradName(pickedUniId!, pickedGrad)` |
| L682 | `UNI_GRADS[u.id] ?? []` | `dictGrads(u.id)` |
| L709 | `UNI_MAJORS[`${pickedUniId}::${grad}`] ?? []` | `dictMajors(pickedUniId, grad)` |
| L721 | `gradName(pickedUniId!, grad)` | `dictGradName(pickedUniId!, grad)` |

### 5.2 onboard-profile.tsx

- [ ] **Step 3: 改 import**

第 22 行：

```ts
// before
import { KAKOMON_UNIVERSITIES, UNI_GRADS, UNI_MAJORS, gradName } from '@/mocks/data';
// after
import { KAKOMON_UNIVERSITIES } from '@/mocks/data';
import { dictGradName, dictGrads, dictMajors, useDictStore } from '@/store/dictStore';
```

- [ ] **Step 4: 替换字典读取 + 加订阅**

组件顶部加 `const dictVersion = useDictStore((s) => s.version);`（并入相关 `useMemo` 依赖）。逐处替换：

| 位置 | before | after |
|---|---|---|
| L253 | `(UNI_GRADS[pickedUniId] ?? [])` | `dictGrads(pickedUniId)` |
| L257 | `(UNI_MAJORS[`${pickedUniId}::${pickedGrad}`] ?? [])` | `dictMajors(pickedUniId, pickedGrad)` |
| L663 | `gradName(pickedUniId!, pickedGrad)` | `dictGradName(pickedUniId!, pickedGrad)` |
| L673 | `UNI_GRADS[u.id] ?? []` | `dictGrads(u.id)` |
| L700 | `UNI_MAJORS[`${pickedUniId}::${grad}`] ?? []` | `dictMajors(pickedUniId, grad)` |
| L712 | `gradName(pickedUniId!, grad)` | `dictGradName(pickedUniId!, grad)` |
| L741 | `gradName(pickedUniId!, pickedGrad!)` | `dictGradName(pickedUniId!, pickedGrad!)` |

- [ ] **Step 5: 门禁 type-check + 静态走查**

Run: `npm run type-check`
Expected: EXIT 0。

Run: `grep -nE "UNI_GRADS|UNI_MAJORS|GRAD_SCHOOL_NAMES|[^t.]gradName\(" app/edit-profile.tsx "app/(auth)/onboard-profile.tsx"`
Expected: 无输出。

- [ ] **Step 6: Commit**

```bash
git add app/edit-profile.tsx "app/(auth)/onboard-profile.tsx"
git commit -m "refactor(dict): batch B consumers (edit/onboard profile) read from dictStore"
```

---

## Task 6: 消费点批次 C（search / questions / study 首页）

**Files:**
- Modify: `app/search.tsx`
- Modify: `app/questions/[id].tsx`
- Modify: `app/(tabs)/study/index.tsx`

**Interfaces:**
- Consumes: `dictGradName`/`dictGrads`/`dictMajors` + `useDictStore` from `@/store/dictStore`。

### 6.1 search.tsx

- [ ] **Step 1: 改 import**

第 18 行（保留 `KAKOMON_QUESTIONS`/`KAKOMON_UNIVERSITIES`/`KAKOMON_SEARCH_RECENT`/`KAKOMON_SEARCH_HOT`/`DEMO_USER`）：

```ts
// before
import { KAKOMON_QUESTIONS, KAKOMON_UNIVERSITIES, UNI_GRADS, KAKOMON_SEARCH_RECENT, KAKOMON_SEARCH_HOT, DEMO_USER, gradName } from '@/mocks/data';
// after
import { KAKOMON_QUESTIONS, KAKOMON_UNIVERSITIES, KAKOMON_SEARCH_RECENT, KAKOMON_SEARCH_HOT, DEMO_USER } from '@/mocks/data';
import { dictGradName, dictGrads, useDictStore } from '@/store/dictStore';
```

- [ ] **Step 2: 替换字典读取 + 加订阅**

组件顶部加 `const dictVersion = useDictStore((s) => s.version);`（并入相关 `useMemo` 依赖）。替换：

| 位置 | before | after |
|---|---|---|
| L69 | `UNI_GRADS[universityId] ?? []` | `dictGrads(universityId)` |
| L97 | `gradName(universityId, grad)` | `dictGradName(universityId, grad)` |
| L112 (`gradName(universityId, g.name)`) | `gradName(universityId, g.name)` | `dictGradName(universityId, g.name)` |

> 注意 search.tsx L112 附近有 `styles.gradName`（样式键），**不要动**；只改 `gradName(...)` 函数调用。

### 6.2 questions/[id].tsx

- [ ] **Step 3: 改 import**

第 21 行：

```ts
// before
import { KAKOMON_QUESTIONS, KAKOMON_UNIVERSITIES, DEMO_USER, gradName } from '@/mocks/data';
// after
import { KAKOMON_QUESTIONS, KAKOMON_UNIVERSITIES, DEMO_USER } from '@/mocks/data';
import { dictGradName } from '@/store/dictStore';
```

- [ ] **Step 4: 替换字典读取**

L381：

```tsx
// before
<Chip color="slate" size="sm">{gradName(question.universityId, question.graduateSchool)}</Chip>
// after
<Chip color="slate" size="sm">{dictGradName(question.universityId, question.graduateSchool)}</Chip>
```

> 单个 chip 显示名，值到位即可，**无需** version 订阅。

### 6.3 (tabs)/study/index.tsx

- [ ] **Step 5: 改 import**

第 25–31 行 import 块（含 `KAKOMON_QUESTIONS`/`KAKOMON_UNIVERSITIES`/`DEMO_USER` 保留）：

```ts
// before
import {
  KAKOMON_QUESTIONS,
  KAKOMON_UNIVERSITIES,
  UNI_MAJORS,
  DEMO_USER,
  gradName,
} from '@/mocks/data';
// after
import {
  KAKOMON_QUESTIONS,
  KAKOMON_UNIVERSITIES,
  DEMO_USER,
} from '@/mocks/data';
import { dictGradName, dictMajors, useDictStore } from '@/store/dictStore';
```

- [ ] **Step 6: 替换字典读取 + 加订阅**

组件顶部加 `const dictVersion = useDictStore((s) => s.version);`（并入相关 `useMemo` 依赖）。替换：

| 位置 | before | after |
|---|---|---|
| L234 | `(UNI_MAJORS[`${first.universityId}::${grad}`]?.find(...) ?? null)` | `(dictMajors(first.universityId, grad).find(...)?.label ?? null)` |
| L236 | `gradName(first.universityId, grad)` | `dictGradName(first.universityId, grad)` |

> L234 原式末尾是 `?.label ?? null`；替换后保持 `.find((m) => m.id === first.majorId)?.label ?? null` 结构。

- [ ] **Step 7: 门禁 type-check + 静态走查**

Run: `npm run type-check`
Expected: EXIT 0。

Run: `grep -nE "UNI_GRADS|UNI_MAJORS|GRAD_SCHOOL_NAMES|[^t.]gradName\(" app/search.tsx "app/questions/[id].tsx" "app/(tabs)/study/index.tsx"`
Expected: 无输出。

- [ ] **Step 8: Commit**

```bash
git add app/search.tsx "app/questions/[id].tsx" "app/(tabs)/study/index.tsx"
git commit -m "refactor(dict): batch C consumers (search/question/study) read from dictStore"
```

---

## Task 7: 收尾（universities.ts code 保真 + seed 注释 + 全量门禁 + TASKS.md）

**Files:**
- Modify: `src/api/universities.ts`
- Modify: `src/mocks/data.ts`
- Modify: `TASKS.md`

**Interfaces:**
- Consumes: `dictGradName` from `@/store/dictStore`（仅 universities.ts 用到，可选）。

- [ ] **Step 1: universities.ts code 保真（cosmetic，无消费方）**

> 背景：`getUniversity`/`getUniversityGradSchools` 返回的 `gradSchools: string[]` 字段目前**全项目无人消费**（已 grep 确认）。API 路径 `.map(g => g.nameJp)` 返回日文名、mock 兜底返回 code，两路不一致但因无消费方无运行时影响。本步只做一致性对齐，消除第一期遗留。

第 205 行与 232 行，把 `.map((g) => g.nameJp)` 改为返回 code（与 mock 兜底一致）：

```ts
// universities.ts L205 (getUniversity)
// before
const gradNames = (data.gradSchools ?? []).map((g) => g.nameJp);
// after
const gradCodes = (data.gradSchools ?? []).map((g) => g.id);
```
并把 L208 的 `gradNames.length ? gradNames : (UNI_GRADS[id] ?? [])` 改为 `gradCodes.length ? gradCodes : (UNI_GRADS[id] ?? [])`。

```ts
// universities.ts L232 (getUniversityGradSchools)
// before
return { universityId: id, items: (data.items ?? []).map((g) => g.nameJp) };
// after
return { universityId: id, items: (data.items ?? []).map((g) => g.id) };
```

> `RawGradSchool`（L68 附近）已声明 `id: string`，直接用 `g.id` 即可，无需补字段。

- [ ] **Step 2: mocks/data.ts 加 seed 注释**

在 `UNI_GRADS`（L7）、`GRAD_SCHOOL_NAMES`（L25）、`UNI_MAJORS`（L50）三个 export 上方各加一行注释：

```ts
// dictStore 的 seed 兜底源（首次冷启动/无网络用）。运行时以后端 /api/dict/tree 为准，勿手动追后端新增。
```

- [ ] **Step 3: 全量门禁**

Run: `npm run type-check`
Expected: EXIT 0。

Run: `npm run lint`
Expected: 0 error（既有 warning 可保留）。

Run: `grep -rnE "UNI_GRADS|UNI_MAJORS|GRAD_SCHOOL_NAMES|[^t.]gradName\(" app src --include="*.tsx" --include="*.ts" | grep -v "src/mocks/data.ts" | grep -v "src/store/dictStore.ts"`
Expected: 无输出（除 seed 源文件 `mocks/data.ts` 和 store 内部兜底 `dictStore.ts` 外，全项目不再直接读静态字典）。

- [ ] **Step 4: 更新 TASKS.md**

在 `### 2026-07-06 任务：研究科标识统一 第一期` 章节末尾那行 `- [ ] 第二期：前端字典改从后端拉（单独 brainstorm）` 下方追加完成记录（不改原行）：

```markdown
### 2026-07-07 任务：研究科标识统一 第二期（前端字典数据源化）
- [x] 新增 src/api/dict.ts（tree/version 拉取 + normalizeTree 拍平）
      ✅ 完成于 2026-07-07
- [x] 新增 src/store/dictStore.ts（seed 初始态 + 三段式 hydrate + dictGradName/dictGrads/dictMajors 同步 selector）
      ✅ 完成于 2026-07-07
- [x] _layout.tsx 启动 hydrate（不 gate 渲染）
      ✅ 完成于 2026-07-07
- [x] 8 消费点改从 dictStore 读（EditTargetSheet/topic-study/mock-exam/edit-profile/onboard-profile/search/questions/study）
      ✅ 完成于 2026-07-07
- [x] universities.ts code 保真 + mocks/data.ts seed 注释
      ✅ 完成于 2026-07-07
- [x] 门禁 type-check + lint 0 error + 静态走查无残留静态字典直读
      ✅ 完成于 2026-07-07，真机端到端（选校/专题/模考/详情显示名 + 断网 seed 兜底 + 后端新增研究科重启拉取）待联调环境人工验证
```

- [ ] **Step 5: Commit**

```bash
git add src/api/universities.ts src/mocks/data.ts TASKS.md
git commit -m "chore(dict): code-fidelity cleanup + seed comments + task log"
```

---

## 人工验证清单（联调环境，需真机/模拟器 + 后端）

> 本环境无后端凭据 + 无模拟器，以下必须在联调环境由人确认：

1. 选校流程（EditTargetSheet 研究科/专业下拉）数据来自后端 tree。
2. 专题学习 / 模考左栏研究科显示名正确（`dictGradName`）。
3. 题目详情 chip 研究科显示名正确。
4. 断网冷启动仍能出选择器（seed 兜底）。
5. 后端新增一所研究科 → version 递增 → 重启 App 联网能拉到新条目。
6. 已选目标校（存 code）在各页显示名不变，无回退成裸 code。

---

## Self-Review

**Spec coverage：**
- spec §2 范围内 1（`src/api/dict.ts`）→ Task 1 ✅
- 范围内 2（`dictStore` + hydrate + selector）→ Task 2 ✅
- 范围内 3（8 消费点）→ Task 4/5/6 ✅（EditTargetSheet/topic-study/mock-exam/edit-profile/onboard-profile/search/questions/study，共 8）
- 范围内 4（universities.ts code 保真）→ Task 7 Step 1 ✅（附无消费方说明）
- 范围内 5（seed 注释）→ Task 7 Step 2 ✅
- spec §4 hydration 三段式 + 不 gate 渲染 → Task 2 hydrate + Task 3 Step 2 注记 ✅
- spec §4.1 tree→规范化映射 → Task 1 `normalizeTree` ✅
- spec §6 错误处理（静默降级/坏节点跳过/空树保护/缓存 schema 校验）→ Task 1 `fetchDictTree` 空树 null + Task 2 `isValidCache`/catch ✅
- spec §8 验证（type-check/lint/静态走查/人工）→ 各 Task 门禁 + 人工清单 ✅

**Placeholder scan：** 无 TBD/TODO；每个改动步给了确切 before/after 代码或映射表。

**Type consistency：** `NormalizedDict` 字段（gradsByUni/majorsByKey/gradNameMap/version）在 Task 1 定义、Task 2 `extends` 复用；selector 名 `dictGradName`/`dictGrads`/`dictMajors` 在 Task 2 定义、Task 4/5/6 一致引用；`MajorOption`（id/label/short/desc）与 `src/types/university.ts` 一致。
