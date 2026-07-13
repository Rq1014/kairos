# 专题学习"幻影科目/题目"修复 — 设计

- **日期**：2026-07-13
- **相关**：`docs/superpowers/specs/2026-07-13-scope-major-subject-consistency-design.md`（scope⊆字典不变式）、`docs/superpowers/specs/2026-07-09-question-multi-attribution-design.md`（M:N 归属）、`docs/superpowers/specs/2026-07-08-subject-major-dimension-design.md`（tree/字典）
- **主战场**：`Kairos-kakomon/app/topic-study.tsx`（去 mock 兜底）+ 后端 tree 接口（科目带题数）

## 1. 背景与问题（systematic-debugging 已定根因）

**症状**：目标院校 京都大学-工学研究科-电气工学（`kyodai/engineering/ee`）在 `major_subject` 无科目、也无题，专题学习却显示"数学"科目 + 一道题；点进详情又空。

**根因（`app/topic-study.tsx`，三处叠加）**：
1. **:195 mock 题池兜底**：`const source = poolQuery.data?.items?.length ? poolQuery.data.items : KAKOMON_QUESTIONS;` —— 后端对该组合返回空时，回退到整个 `KAKOMON_QUESTIONS` mock（含 21 道 `math` 题）。
2. **:187 题池查询只按 university**：`getQuestions({ universityIds: [...], pageSize: 200 })` 不传 gradSchool/majorId → 是"整校题"，跨专业串味（Bug B）。
3. **:200-218 科目列表**：`dictSubjects(kyodai, engineering, ee)` 因字典无该组合返回 `[]` → 走 :214-217 **兜底扫题池** → 扫出被 mock 污染的"数学 (N题)"。

详情页 `topic-questions.tsx:67` 查的是干净真后端（按 subjectCode+majorId 过滤 scope）→ 该组合无题 → 空。**列表用污染 mock 池、详情用真后端 → "列表有、详情无"**。

## 2. 已定决策（2026-07-13 确认）

1. **科目列表唯一真源 = `major_subject` 字典**（经 `/api/dict/universities/tree` 的 `subjectsByKey`）。字典没有该 (校+研究科+专业) 的科目 → 不显示。与 scope⊆字典不变式一致。
2. **删 topic-study 两处兜底**：mock 题池兜底（:195）、扫题池兜底（:214-217）。topic-study 不再用 `KAKOMON_QUESTIONS` 做题池。
3. **科目显真实题数（count）**，由**后端 tree 接口带回**（SubjectNode 加 `questionCount`），前端不自己算、不碰题池。
4. **顺带修 Bug B**：不再按 university 聚合题池（题池查询整个移除）。

## 3. 设计

### 3.1 后端 — SubjectNode 加 questionCount

`model/response/dict/UniversityTreeResponse.java` 的 `SubjectNode`（现有 `code`/`nameJp`）加：

```java
private Integer questionCount;
public Integer getQuestionCount() { return questionCount; }
public void setQuestionCount(Integer questionCount) { this.questionCount = questionCount; }
```

### 3.2 后端 — QuestionMapper 加按四元 count

`QuestionMapper.java` 加：

```java
/** 某 (校+研究科+专业+科目) 下的题数(散题+挂卷题, 去重) */
long countByScope4(@Param("universityCode") String universityCode,
                   @Param("gradSchoolCode") String gradSchoolCode,
                   @Param("majorCode") String majorCode,
                   @Param("subjectCode") String subjectCode);
```

`QuestionMapper.xml` 复用现有 `scopedCodes` 片段（它已 UNION 散题 question_scope + 挂卷题 exam_paper_scope，按传入四元过滤、year 传 null）：

```xml
<select id="countByScope4" resultType="long">
    SELECT COUNT(*) FROM ( <include refid="scopedCodes"/> ) sc
</select>
```

> `scopedCodes` 的 `<if>` 对四元都设、`year` 为 null（不加 year 过滤）时，正好统计该四元的全部题；UNION 天然去重（一题多归属只计一次）。

### 3.3 后端 — DictionaryServiceImpl 填 count

`service/dict/impl/DictionaryServiceImpl.java` 建 subject 节点处（现 :139-145 循环 `majorSubjectMapper.findAll()`）：每建一个 `SubjectNode`，调 `questionMapper.countByScope4(university, grad, major, subject)` 填 `questionCount`。注入 `QuestionMapper`。

```java
sn.setCode(msub.getSubjectCode());
sn.setNameJp(subjectNameByCode.getOrDefault(msub.getSubjectCode(), msub.getSubjectCode()));
sn.setQuestionCount((int) questionMapper.countByScope4(
        msub.getUniversityCode(), msub.getGradSchoolCode(), msub.getMajorCode(), msub.getSubjectCode()));
```

> **性能**：tree 是全量字典构建（`findAll`），科目数量级不大（种子仅 3 行，真实数据每校每专业数科目）。每科目一次 count 查询可接受；tree 接口本就低频（前端按 dictVersion 缓存）。若未来字典膨胀，可改批量聚合——本次不做（YAGNI）。

### 3.4 前端 — dict 类型 + api 映射加 questionCount

- `src/api/dict.ts`：`subjectsByKey` 值类型 `{ code: string; nameJp: string }[]` → 加 `questionCount?: number`；`SubjectRaw`（tree 原始形状）同步；`normalizeTree` 透传 `questionCount`。
- `src/store/dictStore.ts`：`dictSubjects` 返回类型加 `questionCount`；`subjectsByKey` 缓存形状同步（persist 的旧缓存无此字段 → `questionCount` 为 undefined，前端按 `?? 0` 兜底，dictVersion 刷新后补上）。

### 3.5 前端 — topic-study.tsx 去兜底

- **删 `poolQuery`**（:184-191）与 `pool` useMemo（:193-197）——不再需要题池。
- `subjects` useMemo（:200-218）改为**纯字典**：
  ```js
  const subjects = useMemo(() => {
    if (!activeEntry) return [];
    void dictVersion;
    return dictSubjects(activeEntry.universityId, activeEntry.gradSchool, activeEntry.majorId ?? '')
      .map((s) => ({ code: s.code, name: s.nameJp, count: s.questionCount ?? 0 }));
  }, [activeEntry, dictVersion]);
  ```
  删掉扫题池的 countByCode/nameByCode 与 :214-217 兜底分支。
- 移除 `KAKOMON_QUESTIONS` import（若 topic-study 无其他引用；`KAKOMON_UNIVERSITIES`/`DEMO_USER` 视情况保留）。
- `getQuestions` import 若因删 poolQuery 变未用则移除。
- **头部总题数**（:384 `{pool.length} 道题 · {subjects.length} 门专业课`）：`pool` 删除后，总题数改为**科目 count 之和** —— 新增 `const totalCount = subjects.reduce((n, s) => n + s.count, 0);`，:384 改为 `{totalCount} 道题 · {subjects.length} 门专业课`。

## 4. 影响

- **修复症状**：字典无 kyodai/engineering/ee 科目 → 科目列表空 → 无幻影"数学"；有科目则显真实 count；列表与详情同源（都走 scope 真后端）。
- **Bug B 一并修**：科目列表不再按 university 聚合串味。
- **detail 页 `topic-questions.tsx` 不改**（本就走真后端，正确）。
- **风险**：科目列表现在**完全依赖 tree 接口 / dict 缓存**。dict 未 hydrate（首次冷启 + 断网）时 `dictSubjects` 返回 seed 或空 → 科目列表可能短暂空。这是可接受的（seed-first 已尽量兜底；断网无数据合理）。

## 5. 验证

- 后端：`cd Kairos-kakomon-server && ./mvnw compile`。tree 接口 count 正确性 DEFERRED 联调（无 MySQL）。
- 前端：`cd Kairos-kakomon && npm run type-check` + `npm run lint`。
- 待联调：kyodai/engineering/ee 科目列表为空（无幻影数学）；todai/info-sci/cs 显示 math/algorithm + 真实 count；有题科目点进详情有题、count 与详情条数一致；断网/冷启科目列表不崩。
- 动工前 checklist 追加 `Kairos-kakomon/TASKS.md`。

## 6. 不做

- 后端 count 批量聚合优化（当前逐科目 count，字典量小可接受）。
- topic-questions 详情页改动（已正确）。
- mock 数据删除（`KAKOMON_QUESTIONS` 仍被 wrong-book/recommend 等用；仅 topic-study 停用其做题池）。
