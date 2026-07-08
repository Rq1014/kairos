# 模拟考试三级下钻重构 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 模考改为试卷列表驱动的三级下钻（年度 → 科目 → 多份卷 → 开考），放开唯一键允许一(专业+年度+科目)多卷，本屏去 mock（papers 与 universities 均无 mock 兜底）。

**Architecture:** ① DB：`uk_paper_scope` 从 UNIQUE 降为普通索引，允许多卷。② 后端：`/api/papers` 加可选 `majorId` 过滤 + 稳定排序；DTO 不变。③ 前端：`mock-exam.tsx` 从「扫 KAKOMON_QUESTIONS 题池」改为「`getPapers(校+研究科+专业)` 内存分组」，左栏走 `getUniversities()`；新建 `exam-papers.tsx` 列同(专业+年度+科目)多卷（复用同一 react-query 缓存）+ 门禁下沉；点卷跳 exam-session（带 paperCode + duration/select 参数）。

**Tech Stack:** MySQL 8、Spring Boot 4 + MyBatis、Expo Router v6 + React Native + TypeScript、TanStack Query v5、Zustand。

## Global Constraints

- **无物理外键**；greenfield 无回填，V1_4 直接改建表语句。
- **后端 gate**：`cd Kairos-kakomon-server && ./mvnw -q compile` 必须通过（题库域无单测）。
- **前端 gate**：`cd Kairos-kakomon && npm run type-check` 必须通过（无测试运行器）；`npm run lint` 不新增 error。
- **MyBatis 铁律**：Java mapper 接口与 XML 同步；resultMap 列↔property 一一对应。
- **每屏必须在 `app/_layout.tsx` 注册 `Stack.Screen`**（项目路由约定）。
- **主题**：组件通过 `useColors()` 读色，禁止 import 静态调色板。
- **去 mock 边界**：本屏移除 `KAKOMON_QUESTIONS`/`KAKOMON_UNIVERSITIES` 的直接 import；`data.ts` 常量因~10 屏共用而**保留**，不物理删除。`DEMO_USER` 保留（auth 兜底）。
- **去 mock 到底（决策 D/F，有意分歧）**：本屏对 papers 与 universities **都不做 mock 兜底**——失败/空显示空/错误态。这比 university/study 两姐妹屏（`?? KAKOMON_UNIVERSITIES`）更严格，是刻意选择，审查勿当不一致 bug。左栏拿不到元数据时保持 `renderRailItem` 的 `!u → null`（**整栏空**，含用户目标校），不做降级渲染。注意 `getUniversities` 内部 `mergeWithMock` 仍用 mock 补 accent 等装饰字段（后端无该列），属 API 层既有行为、非本屏兜底。
- **exam-session 只读 URL 参数**取时长/选做规则（`durationMinutes`/`selectTotal`/`selectChoose`），不从 paper detail 取——故跳转必须带这些参数。

---

## Task 1: V1_4 放开 `uk_paper_scope` 唯一约束

**Files:**
- Modify: `docs/05-database/sql/V1_4__questions_schema.sql`

**Interfaces:**
- Produces: `exam_paper` 允许同 `(university_code, grad_school_code, major_code, year, subject_code)` 多行；唯一性仅剩 `uk_paper_code`。后端 Task 2 的多卷查询、前端多卷列表依赖此放开。

- [ ] **Step 1: 将唯一键降为普通索引**

在 `exam_paper` 建表语句中，把
```sql
    UNIQUE KEY `uk_paper_scope` (`university_code`, `grad_school_code`, `major_code`, `year`, `subject_code`),
```
改为
```sql
    KEY `idx_paper_scope` (`university_code`, `grad_school_code`, `major_code`, `year`, `subject_code`),
```
（去掉 `UNIQUE`，键名 `uk_` → `idx_` 以示语义；列不变。`uk_paper_code` 保持不动。）

- [ ] **Step 2: 语法自检**

Run: `cd /Users/renquan.11/karios && grep -nE "uk_paper_scope|idx_paper_scope|uk_paper_code" docs/05-database/sql/V1_4__questions_schema.sql`
Expected: 无 `uk_paper_scope`；出现 `idx_paper_scope`（普通 KEY）；`uk_paper_code` 仍在。

- [ ] **Step 3: Commit**

```bash
cd /Users/renquan.11/karios
git add docs/05-database/sql/V1_4__questions_schema.sql
git commit -m "feat(db): V1_4 放开 exam_paper 唯一键，允许一(专业+年度+科目)多卷"
```

---

## Task 2: `/api/papers` 支持 majorId 过滤 + 稳定排序

**Files:**
- Modify: `Kairos-kakomon-server/src/main/java/org/example/kairos/web/question/PaperController.java`
- Modify: `Kairos-kakomon-server/src/main/java/org/example/kairos/service/question/PaperQueryService.java`
- Modify: `Kairos-kakomon-server/src/main/java/org/example/kairos/service/question/impl/PaperQueryServiceImpl.java`
- Modify: `Kairos-kakomon-server/src/main/java/org/example/kairos/mapper/question/ExamPaperMapper.java`
- Modify: `Kairos-kakomon-server/src/main/resources/mapper/question/ExamPaperMapper.xml`

**Interfaces:**
- Consumes: Task 1 放开后的 `exam_paper`。
- Produces: `GET /api/papers?universityId=&graduateSchool=&majorId=`（majorId 可选）返回该范围全部卷，按 `year DESC, subject_code ASC, sort_order DESC, id ASC` 排。前端 Task 4 依赖 majorId 过滤 + 排序。

- [ ] **Step 1: `ExamPaperMapper.java` — findByScope 加 majorCode 参数**

把
```java
    List<ExamPaperEntity> findByScope(@Param("universityCode") String universityCode,
                                      @Param("gradSchoolCode") String gradSchoolCode);
```
改为
```java
    List<ExamPaperEntity> findByScope(@Param("universityCode") String universityCode,
                                      @Param("gradSchoolCode") String gradSchoolCode,
                                      @Param("majorCode") String majorCode);
```

- [ ] **Step 2: `ExamPaperMapper.xml` — findByScope 加动态条件 + 排序**

把
```xml
    <select id="findByScope" resultMap="PaperMap">
        SELECT * FROM exam_paper
        WHERE status = 1
          AND university_code = #{universityCode}
          AND grad_school_code = #{gradSchoolCode}
        ORDER BY year DESC, sort_order DESC, id ASC
    </select>
```
改为
```xml
    <select id="findByScope" resultMap="PaperMap">
        SELECT * FROM exam_paper
        WHERE status = 1
          AND university_code = #{universityCode}
          AND grad_school_code = #{gradSchoolCode}
        <if test="majorCode != null and majorCode != ''">
          AND major_code = #{majorCode}
        </if>
        ORDER BY year DESC, subject_code ASC, sort_order DESC, id ASC
    </select>
```

- [ ] **Step 3: `PaperQueryService.java` — listByScope 加 majorId**

把
```java
    List<PaperListItemResponse> listByScope(String universityId, String graduateSchool);
```
改为
```java
    List<PaperListItemResponse> listByScope(String universityId, String graduateSchool, String majorId);
```

- [ ] **Step 4: `PaperQueryServiceImpl.java` — 透传 majorId**

把 `listByScope` 签名与 mapper 调用改为：
```java
    @Override
    public List<PaperListItemResponse> listByScope(String universityId, String graduateSchool, String majorId) {
        List<ExamPaperEntity> papers = paperMapper.findByScope(universityId, graduateSchool, majorId);
```
（方法体其余不变。）

- [ ] **Step 5: `PaperController.java` — list 加可选 majorId 入参**

把
```java
    @GetMapping("/papers")
    public Result<List<PaperListItemResponse>> list(
            @RequestParam String universityId,
            @RequestParam String graduateSchool) {
        return Result.ok(paperQueryService.listByScope(universityId, graduateSchool));
    }
```
改为
```java
    @GetMapping("/papers")
    public Result<List<PaperListItemResponse>> list(
            @RequestParam String universityId,
            @RequestParam String graduateSchool,
            @RequestParam(required = false) String majorId) {
        return Result.ok(paperQueryService.listByScope(universityId, graduateSchool, majorId));
    }
```

- [ ] **Step 6: 编译**

Run: `cd /Users/renquan.11/karios/Kairos-kakomon-server && ./mvnw -q compile`
Expected: BUILD SUCCESS。

- [ ] **Step 7: Commit**

```bash
cd /Users/renquan.11/karios
git add Kairos-kakomon-server/src/main/java/org/example/kairos/web/question/PaperController.java \
        Kairos-kakomon-server/src/main/java/org/example/kairos/service/question/PaperQueryService.java \
        Kairos-kakomon-server/src/main/java/org/example/kairos/service/question/impl/PaperQueryServiceImpl.java \
        Kairos-kakomon-server/src/main/java/org/example/kairos/mapper/question/ExamPaperMapper.java \
        Kairos-kakomon-server/src/main/resources/mapper/question/ExamPaperMapper.xml
git commit -m "feat(backend): /api/papers 支持 majorId 过滤 + 多卷稳定排序"
```

---

## Task 3: `papers.ts` — getPapers 传 majorId

**Files:**
- Modify: `Kairos-kakomon/src/api/papers.ts`

**Interfaces:**
- Consumes: Task 2 的 `/api/papers?majorId=`。
- Produces: `getPapers({universityId, graduateSchool, majorId})` 把 majorId 带入 query。Task 4/5 依赖。

- [ ] **Step 1: getPapers 带 majorId query**

`getPapers` 现在的 query 只有 uni+grad。把
```ts
  const raw = await apiRequest<PaperListItemRaw[]>('/api/papers', {
    query: { universityId: params.universityId, graduateSchool: params.graduateSchool },
  });
```
改为
```ts
  const raw = await apiRequest<PaperListItemRaw[]>('/api/papers', {
    query: { universityId: params.universityId, graduateSchool: params.graduateSchool, majorId: params.majorId ?? undefined },
  });
```
（`PaperQueryParams` 已含 `majorId?: string | null`，无需改类型。`listItemToExamPaper` 已映射 majorId from scope，不变。）

- [ ] **Step 2: type-check**

Run: `cd /Users/renquan.11/karios/Kairos-kakomon && npm run type-check`
Expected: PASS。

- [ ] **Step 3: Commit**

```bash
cd /Users/renquan.11/karios
git add Kairos-kakomon/src/api/papers.ts
git commit -m "feat(fe): getPapers 传 majorId query"
```

---

## Task 4: `mock-exam.tsx` 重构 — getPapers 驱动 + 左栏走 getUniversities + 去 mock

> 本 Task 是重构核心。改动大，分步做，末尾统一 type-check。**注意**：不要在本 Task 内实现 exam-papers 页（Task 5），本 Task 只把「点科目」改成 `router.push('/exam-papers?...')`。

**Files:**
- Modify: `Kairos-kakomon/app/mock-exam.tsx`

**Interfaces:**
- Consumes: Task 3 的 `getPapers`；`getUniversities` from `@/api/universities`；`ExamPaper` type（含 year/subjectCode/subject/title/durationMinutes/selectRule）。
- Produces: 主页面按 papersQuery 分组年度→科目下拉；点科目导航到 `/exam-papers?universityId=&graduateSchool=&majorId=&year=&subjectCode=&subjectName=`。exam-papers（Task 5）依赖这些参数名 + 同一 react-query key `['papers', uni, grad, majorId]`。

- [ ] **Step 1: 替换 import — 去 KAKOMON_QUESTIONS/KAKOMON_UNIVERSITIES，加 getUniversities**

- 删除 `import { KAKOMON_QUESTIONS, KAKOMON_UNIVERSITIES, DEMO_USER } from '@/mocks/data';` 中的前两个，保留 `DEMO_USER`：`import { DEMO_USER } from '@/mocks/data';`
- 加 `import { getUniversities } from '@/api/universities';`
- 删除 `import type { KakomonQuestion, ExamPaper } from '@/types/question';` 中的 `KakomonQuestion`（本屏不再用题池）：改为 `import type { ExamPaper } from '@/types/question';`

- [ ] **Step 2: 左栏 universities 改用 useQuery(getUniversities) — 无 mock 兜底**

在组件内（靠近其他 useQuery）新增：
```ts
  const universitiesQuery = useQuery({
    queryKey: ['universities', 'all'],
    queryFn: () => getUniversities({ page: 1, pageSize: 100 }),
  });
  const universities = universitiesQuery.data?.items ?? [];
```
把组件内所有 `KAKOMON_UNIVERSITIES` 引用改为 `universities`：
- `activeUni = universities.find((u) => u.id === activeEntry.universityId)`
- `renderRailItem` 内 `universities.find(...)`
- `deleteEntry` 内 `universities.find(...)`
- 菜单里 `universities.find(...)`
- 加校候选 `addCandidates = universities.filter(...)`
- `pendingUniObj = pendingUni ? universities.find(...) : null`

> 决策 D/F：**不加 `?? KAKOMON_UNIVERSITIES` 兜底**（与 university/study 姐妹屏不同，有意为之）。空数据时左栏与加校搜索为空，属预期。

- [ ] **Step 3: 删除题池 pool + 基于题池的 yearGroups，改为 papersQuery 分组**

- 删除 `pool` useMemo（基于 KAKOMON_QUESTIONS）。
- `papersQuery` 已存在（`['papers', uni, grad]`）——把 key 与调用改为带 majorId：
```ts
  const papersQuery = useQuery({
    queryKey: ['papers', activeEntry?.universityId ?? '', activeEntry?.gradSchool ?? '', activeEntry?.majorId ?? ''],
    queryFn: () => getPapers({ universityId: activeEntry!.universityId, graduateSchool: activeEntry!.gradSchool, majorId: activeEntry!.majorId ?? undefined }),
    enabled: !!activeEntry,
  });
  const papersForEntry: ExamPaper[] = papersQuery.data ?? [];
```
- `yearGroups` 改为基于 `papersForEntry`（按 year 分组，组内按 subjectCode 去重得科目下拉项）：
```ts
  interface YearGroup { year: number; subjects: { code: string; name: string }[]; }
  const yearGroups: YearGroup[] = useMemo(() => {
    const byYear = new Map<number, Map<string, string>>();
    papersForEntry.forEach((p) => {
      if (!byYear.has(p.year)) byYear.set(p.year, new Map());
      const sm = byYear.get(p.year)!;
      if (!sm.has(p.subjectCode)) sm.set(p.subjectCode, p.subject);
    });
    return [...byYear.entries()]
      .sort(([a], [b]) => b - a)
      .map(([year, sm]) => ({ year, subjects: [...sm.entries()].map(([code, name]) => ({ code, name })) }));
  }, [papersForEntry]);
```

- [ ] **Step 4: 删除内联开考 + 门禁逻辑（下沉到 exam-papers）**

删除以下（它们随「一科一卷 + 内联开考」模型作废，门禁移到 Task 5 的 exam-papers）：
- `findPaper`、`startExam` 函数
- `getSelectedSubject`、`selectYearSubject`、`yearSubjectMap`、`setYearSubjectMap` 相关 state 与函数（改由下拉直接导航，不再在本页记选中卷）
- `gate` state、`handleExamPress`、页面底部的 `<AdGateModal>`（连同 `canAccessQuestion`、`useAdStore` 的 `unlockSchoolYear` import 若本页不再用则删）
- import 里 `canAccessQuestion`（若仅此处用）、`AdGateModal`（若仅此处用）——**实现期确认**这些是否在本页其他地方仍用，仅删无引用者。

> 保留 `yearDropdownOpen` state（下拉展开仍需要）。

- [ ] **Step 5: 年度卡渲染改为「科目下拉 → 点科目导航到 exam-papers」**

年度卡 JSX 改为：每个 `yg` 展示年度标题 + 科目下拉；下拉每项 `onPress` 直接导航（不再选中/开考）：
```tsx
{yearGroups.map((yg) => {
  const isOpen = yearDropdownOpen === yg.year;
  return (
    <View key={yg.year} style={styles.paperCard}>
      <View style={styles.paperTop}>
        <Text style={styles.paperYear}>{yg.year} 年度</Text>
        <Text style={styles.paperMeta}>{yg.subjects.length} 个科目</Text>
      </View>
      <Pressable style={styles.subjectDropdown} onPress={() => setYearDropdownOpen(isOpen ? null : yg.year)}>
        <Text style={styles.subjectDropdownText}>选择科目</Text>
        <Icon name={isOpen ? 'chevronUp' : 'chevronDown'} size={13} color={Colors.textPrimary} />
      </Pressable>
      {isOpen && (
        <View style={styles.subjectMenu}>
          {yg.subjects.map((subj, i) => (
            <Pressable
              key={subj.code}
              style={[styles.subjectMenuItem, i === yg.subjects.length - 1 && styles.subjectMenuItemLast]}
              onPress={() => {
                if (!activeEntry) return;
                router.push(`/exam-papers?universityId=${activeEntry.universityId}&graduateSchool=${encodeURIComponent(activeEntry.gradSchool)}&majorId=${activeEntry.majorId ?? ''}&year=${yg.year}&subjectCode=${encodeURIComponent(subj.code)}&subjectName=${encodeURIComponent(subj.name)}` as any);
              }}
            >
              <Text style={styles.subjectMenuItemText}>{subj.name}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
})}
```
删除年度卡里原来的 `subjectQs`、`unlocked`、`startBtn`/`lockBtn`/`unlockedBadge`、`findPaper` 展示块。相关 styles 可留（无害）或删（实现期定，倾向留以缩小 diff）。

- [ ] **Step 6: 空/加载/错误态（无 mock 兜底）**

右侧内容区在 `activeEntry` 存在时按 papersQuery 状态：
- `papersQuery.isLoading` → loading 提示（可复用现有 empty 容器 + "加载中…"）
- `papersQuery.isError` → 错误态 "试卷加载失败，请重试"
- 成功且 `yearGroups.length === 0` → 现有 "该范围暂无真题" 改为 "该范围暂无试卷"
- 头部统计 `{yearGroups.length} 个年度` 保留；删除依赖 `pool.length` 的 "N 道题"（题数改由 exam-papers 卷卡显示）。

- [ ] **Step 7: type-check**

Run: `cd /Users/renquan.11/karios/Kairos-kakomon && npm run type-check`
Expected: 可能报 `/exam-papers` 路由未注册的类型错（Task 6 注册后消解）——若 `router.push(... as any)` 已 `as any`，则不应报路由类型错。其余应 PASS。若报未用变量（删逻辑后残留 import/state），一并清理。

> 若 type-check 因 exam-papers 未建而报错，属预期，Task 5/6 完成后全绿。本 Task 与 Task 5/6 是一个前端单元，末尾（Task 6）统一要求全绿。用 subagent 时把 Task 4/5/6 交给同一 subagent。

- [ ] **Step 8: Commit**

```bash
cd /Users/renquan.11/karios
git add Kairos-kakomon/app/mock-exam.tsx
git commit -m "refactor(fe): mock-exam 改试卷列表驱动，左栏走 getUniversities，去 mock，点科目跳 exam-papers"
```

---

## Task 5: 新建 `exam-papers.tsx` — 多卷列表 + 门禁 + 跳 exam-session

**Files:**
- Create: `Kairos-kakomon/app/exam-papers.tsx`

**Interfaces:**
- Consumes: Task 4 传的 query 参数（universityId/graduateSchool/majorId/year/subjectCode/subjectName）；同一 react-query key `['papers', uni, grad, majorId]`（命中 mock-exam 已拉缓存）；`getPapers`、`canAccessQuestion`、`AdGateModal`、`useAdStore.unlockSchoolYear`、`getUniversities`（取校名/short 展示，可选）。
- Produces: 该 (year+subjectCode) 的多卷卡列表；点已解锁卷 → `router.push('/exam-session?paperCode=&mode=mock&title=&durationMinutes=&selectTotal=&selectChoose=')`。

- [ ] **Step 1: 骨架 + 参数 + 复用 papers 缓存筛卷**

新建 `app/exam-papers.tsx`：
```tsx
import { useMemo, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { getPapers } from '@/api/papers';
import { useColors } from '@/constants/colors';
import type { ThemeColors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';
import { AdGateModal, Icon } from '@/components/ui';
import { DEMO_USER } from '@/mocks/data';
import { useAuthStore } from '@/store/authStore';
import { useAdStore } from '@/store/adStore';
import { canAccessQuestion } from '@/utils/accessPolicy';
import type { ExamPaper } from '@/types/question';

export default function ExamPapersScreen() {
  const Colors = useColors();
  const styles = useMemo(() => makeStyles(Colors), [Colors]);
  const router = useRouter();
  const params = useLocalSearchParams<{ universityId: string; graduateSchool: string; majorId?: string; year: string; subjectCode: string; subjectName?: string }>();
  const { universityId, graduateSchool, subjectCode } = params;
  const majorId = params.majorId || null;
  const year = Number(params.year);
  const subjectName = params.subjectName ?? subjectCode;

  const user = useAuthStore((s) => s.user) ?? DEMO_USER;
  const unlockSchoolYear = useAdStore((s) => s.unlockSchoolYear);
  useAdStore((s) => s.unlockedSchoolYears);

  const papersQuery = useQuery({
    queryKey: ['papers', universityId ?? '', graduateSchool ?? '', majorId ?? ''],
    queryFn: () => getPapers({ universityId, graduateSchool, majorId: majorId ?? undefined }),
    enabled: !!universityId && !!graduateSchool,
  });
  const papers: ExamPaper[] = useMemo(
    () => (papersQuery.data ?? []).filter((p) => p.year === year && p.subjectCode === subjectCode),
    [papersQuery.data, year, subjectCode],
  );

  const access = canAccessQuestion(user, { universityId, gradSchool: graduateSchool, year });
  const [gateOpen, setGateOpen] = useState(false);

  function openPaper(p: ExamPaper) {
    if (!access.allowed) { setGateOpen(true); return; }
    startPaper(p);
  }
  function startPaper(p: ExamPaper) {
    const dur = p.durationMinutes ? `&durationMinutes=${p.durationMinutes}` : '';
    const sel = p.selectRule ? `&selectTotal=${p.selectRule.total}&selectChoose=${p.selectRule.choose}` : '';
    const title = encodeURIComponent(`${year} ${subjectName}`);
    router.push(`/exam-session?paperCode=${encodeURIComponent(p.id)}&mode=mock&title=${title}${dur}${sel}` as any);
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Icon name="chevronLeft" size={22} color={Colors.textPrimary} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{year} 年度 · {subjectName}</Text>
          <Text style={styles.headerSub}>共 {papers.length} 份试卷</Text>
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Step 2 填充列表/状态 */}
      </ScrollView>
      {gateOpen && (
        <AdGateModal
          open={gateOpen}
          onClose={() => setGateOpen(false)}
          title={`解锁 ${year} 年 ${subjectName}`}
          desc={`看广告解锁 ${year} 年题目 · 24 小时内有效`}
          onUnlock={() => { unlockSchoolYear(universityId, year); setGateOpen(false); }}
          onUpgrade={() => router.push('/paywall' as any)}
        />
      )}
    </SafeAreaView>
  );
}
```

> 门禁粒度 school×year（与旧 mock-exam 一致）。广告解锁后关闭弹窗；用户再点卷即已解锁直接开考（`access` 下次渲染会更新，因订阅了 `unlockedSchoolYears`）。

- [ ] **Step 2: 卷卡列表 + 加载/空/错误态**

把 `{/* Step 2 填充列表/状态 */}` 替换为：
```tsx
{papersQuery.isLoading ? (
  <View style={styles.empty}><Text style={styles.emptyText}>加载中…</Text></View>
) : papersQuery.isError ? (
  <View style={styles.empty}><Icon name="clock" size={28} color={Colors.textMuted} /><Text style={styles.emptyText}>试卷加载失败，请重试</Text></View>
) : papers.length === 0 ? (
  <View style={styles.empty}><Icon name="clock" size={28} color={Colors.textMuted} /><Text style={styles.emptyText}>暂无试卷</Text></View>
) : (
  papers.map((p) => (
    <Pressable key={p.id} style={styles.paperCard} onPress={() => openPaper(p)}>
      <View style={styles.paperTop}>
        <Text style={styles.paperTitle} numberOfLines={2}>{p.title}</Text>
        {!access.allowed && <Icon name="eye" size={16} color={Colors.amber500} />}
      </View>
      <Text style={styles.paperMeta}>
        {p.durationMinutes ? `⏱ ${p.durationMinutes} 分` : ''}
        {p.selectRule ? `　·　${p.selectRule.total} 题选 ${p.selectRule.choose}` : ''}
        {`　·　${p.questionIds?.length ?? 0} 题`}
      </Text>
      <View style={styles.startRow}>
        <Text style={[styles.startText, { color: access.allowed ? Colors.indigo600 : Colors.amber600 }]}>
          {access.allowed ? '开始做题 →' : '看广告解锁（24h）'}
        </Text>
      </View>
    </Pressable>
  ))
)}
```

> `p.questionIds.length` 来自 `listItemToExamPaper` 的 `Array.from({length: questionCount})`——即后端 `questionCount`。

- [ ] **Step 3: makeStyles（主题化）**

在文件底部加 `makeStyles`，全部颜色走 `c: ThemeColors` 参数（禁止静态色）：
```tsx
const makeStyles = (c: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: c.border },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: Typography.base, fontWeight: Typography.weightSemibold, color: c.textPrimary },
  headerSub: { fontSize: Typography.xs, color: c.textMuted, marginTop: 1 },
  scroll: { padding: Spacing.cardPadding, gap: 10 },
  paperCard: { backgroundColor: c.surface, borderRadius: Spacing.cardRadius, borderWidth: 1, borderColor: c.border, padding: Spacing.cardPadding, gap: 8 },
  paperTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 },
  paperTitle: { flex: 1, fontSize: Typography.base, fontWeight: Typography.weightBold, color: c.textPrimary },
  paperMeta: { fontSize: Typography.xs, color: c.textMuted },
  startRow: { marginTop: 2 },
  startText: { fontSize: Typography.sm, fontWeight: Typography.weightBold },
  empty: { alignItems: 'center', paddingVertical: 50, gap: 8 },
  emptyText: { fontSize: Typography.sm, color: c.textMuted, textAlign: 'center' },
});
```

- [ ] **Step 4: type-check（联合 Task 6）**

Run: `cd /Users/renquan.11/karios/Kairos-kakomon && npm run type-check`
Expected: 若 exam-papers 未注册路由，`router.push('/exam-session'...)` 与从 mock-exam 跳 `/exam-papers` 用了 `as any` 则不报路由类型错。其余 PASS。Task 6 注册后完整验证。

- [ ] **Step 5: Commit**

```bash
cd /Users/renquan.11/karios
git add Kairos-kakomon/app/exam-papers.tsx
git commit -m "feat(fe): 新增 exam-papers 多卷列表页(门禁下沉 + 跳 exam-session)"
```

---

## Task 6: 注册路由 + 前端单元全量验证

**Files:**
- Modify: `Kairos-kakomon/app/_layout.tsx`

**Interfaces:**
- Consumes: Task 5 的 `exam-papers` 屏。
- Produces: 路由注册，三级下钻可导航。

- [ ] **Step 1: 注册 exam-papers Stack.Screen**

在 `app/_layout.tsx` 的 `exam-session` 那行之后加：
```tsx
        <Stack.Screen name="exam-papers"         options={{ animation: 'slide_from_right' }} />
```

- [ ] **Step 2: 全量 type-check**

Run: `cd /Users/renquan.11/karios/Kairos-kakomon && npm run type-check`
Expected: PASS，0 error。

- [ ] **Step 3: lint**

Run: `cd /Users/renquan.11/karios/Kairos-kakomon && npm run lint`
Expected: 不新增 error（既有 warning 不阻断）。特别检查 mock-exam 删逻辑后无残留未用 import/变量。

- [ ] **Step 4: Commit**

```bash
cd /Users/renquan.11/karios
git add Kairos-kakomon/app/_layout.tsx
git commit -m "feat(fe): 注册 exam-papers 路由"
```

---

## 收尾验收

- [ ] **后端**：`./mvnw compile` 通过；`/api/papers?universityId=todai&graduateSchool=info-sci&majorId=cs` 返回该专业卷；唯一键放开后同 (year+subjectCode) 多卷可插入。
- [ ] **前端**：`npm run type-check` 0 error；`npm run lint` 无新增 error；mock-exam 无 `KAKOMON_QUESTIONS`/`KAKOMON_UNIVERSITIES` import。
- [ ] **流程**：左栏选专业 → 年度卡 → 科目下拉 → exam-papers 列多卷 → 点卷 exam-session 开考（计时/选做提示正常，说明参数已传）。
- [ ] **去 mock 严格性**：断网时 papers 与左栏均显示空/错误态（不 fallback mock）——与决策 D/F 一致。
- [ ] **联调**（需后端 + MySQL/Redis）：种一组同 (todai+info-sci+cs+2024+math) 多卷（`p-todai-2024-math-1/-2`，不同 sort_order）验证 exam-papers 列多卷、排序正确。

## 已知实现期决策点

1. **Task 4 Step 4 删逻辑范围**：删 `startExam`/`gate`/`AdGateModal` 时确认 `canAccessQuestion`、`useAdStore`、`AdGateModal` 的 import 是否本页他处仍用；仅删无引用者，避免误删或留死 import（type-check/lint 会点名）。
2. **Task 4 左栏空态（决策：整体空态，不降级）**：`getUniversities` 无 mock 兜底后，若后端未就绪，`renderRailItem` 现有的 `if (!u) return null` 会让整栏为空（含用户已添加的目标校）——**这是有意选择**，与 papers 的无兜底一致。**不要**为拿不到元数据的行做降级渲染（首字母/默认色）；保持 `!u → null`。实现期可在左栏区域加一句空态提示（如 universitiesQuery.isError/空 时显示「学校信息加载失败」），但不伪造行。审查勿把空栏当 bug。
3. **多卷 seed（联调）**：V1_5 仅单卷。联调验证多卷需加第二份卷 seed；是否纳入本次或单独脚本，实现期定（不阻断代码合入）。
