# 专题学习"幻影科目/题目"修复 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 专题学习科目列表唯一真源改为 `major_subject` 字典（经 tree 接口），删掉 topic-study 的 mock 题池兜底与扫题池兜底，消除"幻影科目/题目"；科目题数由后端 tree 带回。

**Architecture:** 后端 tree 接口的 `SubjectNode` 加 `questionCount`（`DictionaryServiceImpl` 按 校+研究科+专业+科目 查 scope count 填入，复用 `QuestionMapper.scopedCodes`）→ 前端 dict 类型透传 questionCount → topic-study 删 poolQuery/pool/扫题池，科目纯从 `dictSubjects` 取、count 用 questionCount、头部总数=科目 count 之和。

**Tech Stack:** 后端 Spring Boot 4 + MyBatis；前端 Expo/RN + TypeScript + TanStack Query + Zustand。

## Global Constraints

- 后端 `org.example.kairos` 分模块；MyBatis Java mapper↔XML 同步。
- **无 test runner、无 MySQL、无模拟器。** 门禁：后端 `cd Kairos-kakomon-server && ./mvnw compile`；前端 `cd Kairos-kakomon && npm run type-check` + `npm run lint`（0 error；既有 warning 是基线）。tree count 运行期正确性 + UI DEFERRED 联调。
- 科目列表真源 = `major_subject`（scope⊆字典不变式）；topic-study 不再用 `KAKOMON_QUESTIONS` 做题池（该 mock 数组仍被其他 11 个文件用，**不删**）。
- 后端 count 复用现有 `QuestionMapper.xml` 的 `scopedCodes` 片段（UNION 散题 question_scope + 挂卷题 exam_paper_scope，四元过滤、year 传 null，UNION 去重）。
- 动工前 checklist 追加 `Kairos-kakomon/TASKS.md`。

**契约冻结**（前后端对齐）：
- `GET /api/dict/universities/tree` 的 `SubjectNode` 新增 `questionCount: number`（该 校+研究科+专业+科目 下题数，散题+挂卷去重）。前端 `subjectsByKey` 值 `{ code, nameJp, questionCount? }`。

---

## Task 1: 后端 — SubjectNode 加 questionCount + countByScope4 + tree 填充

**Files:**
- Modify: `Kairos-kakomon-server/src/main/java/org/example/kairos/model/response/dict/UniversityTreeResponse.java`
- Modify: `Kairos-kakomon-server/src/main/java/org/example/kairos/mapper/question/QuestionMapper.java`
- Modify: `Kairos-kakomon-server/src/main/resources/mapper/question/QuestionMapper.xml`
- Modify: `Kairos-kakomon-server/src/main/java/org/example/kairos/service/dict/impl/DictionaryServiceImpl.java`

**Interfaces:**
- Produces:
  - `UniversityTreeResponse.SubjectNode.questionCount: Integer`
  - `QuestionMapper.countByScope4(universityCode, gradSchoolCode, majorCode, subjectCode): long`
  - tree 接口每个 SubjectNode 带真实 count

- [ ] **Step 1: SubjectNode 加字段**

`UniversityTreeResponse.java` 的 `SubjectNode`（现有 code/nameJp）。当前：

```java
    public static class SubjectNode {
        private String code;
        private String nameJp;
        public String getCode() { return code; }
        public void setCode(String code) { this.code = code; }
        public String getNameJp() { return nameJp; }
        public void setNameJp(String nameJp) { this.nameJp = nameJp; }
    }
```

改为：

```java
    public static class SubjectNode {
        private String code;
        private String nameJp;
        private Integer questionCount;
        public String getCode() { return code; }
        public void setCode(String code) { this.code = code; }
        public String getNameJp() { return nameJp; }
        public void setNameJp(String nameJp) { this.nameJp = nameJp; }
        public Integer getQuestionCount() { return questionCount; }
        public void setQuestionCount(Integer questionCount) { this.questionCount = questionCount; }
    }
```

- [ ] **Step 2: QuestionMapper 加 countByScope4**

`mapper/question/QuestionMapper.java`，在 `countByFilter` 后加：

```java
    /** 某 (校+研究科+专业+科目) 下的题数(散题+挂卷题, 去重) */
    long countByScope4(@Param("universityCode") String universityCode,
                       @Param("gradSchoolCode") String gradSchoolCode,
                       @Param("majorCode") String majorCode,
                       @Param("subjectCode") String subjectCode);
```

- [ ] **Step 3: QuestionMapper.xml 加 countByScope4（复用 scopedCodes）**

`resources/mapper/question/QuestionMapper.xml`，在 `countByFilter` 之后加：

```xml
    <select id="countByScope4" resultType="long">
        SELECT COUNT(*) FROM ( <include refid="scopedCodes"/> ) sc
    </select>
```

> `scopedCodes` 的 `<if>` 对 universityCode/gradSchoolCode/majorCode/subjectCode 都设、`year` 为 null（不加 year 过滤）时，正好统计该四元全部题；UNION 去重（一题多归属只计一次）。四个参数名与 `scopedCodes` 内 `#{...}` 一致。

- [ ] **Step 4: DictionaryServiceImpl 填 count**

`service/dict/impl/DictionaryServiceImpl.java`：注入 QuestionMapper（顶部加 `import org.example.kairos.mapper.question.QuestionMapper;`，类字段加 `@Autowired private QuestionMapper questionMapper;`）。建 SubjectNode 处（现循环 `majorSubjectMapper.findAll()`）：

当前：

```java
            UniversityTreeResponse.SubjectNode sn = new UniversityTreeResponse.SubjectNode();
            sn.setCode(msub.getSubjectCode());
            sn.setNameJp(subjectNameByCode.getOrDefault(msub.getSubjectCode(), msub.getSubjectCode()));
            subjectsByMajorKey.computeIfAbsent(key, k -> new ArrayList<>()).add(sn);
```

改为（加 setQuestionCount）：

```java
            UniversityTreeResponse.SubjectNode sn = new UniversityTreeResponse.SubjectNode();
            sn.setCode(msub.getSubjectCode());
            sn.setNameJp(subjectNameByCode.getOrDefault(msub.getSubjectCode(), msub.getSubjectCode()));
            sn.setQuestionCount((int) questionMapper.countByScope4(
                    msub.getUniversityCode(), msub.getGradSchoolCode(), msub.getMajorCode(), msub.getSubjectCode()));
            subjectsByMajorKey.computeIfAbsent(key, k -> new ArrayList<>()).add(sn);
```

- [ ] **Step 5: 编译**

Run: `cd Kairos-kakomon-server && ./mvnw compile 2>&1 | tail -3`
Expected: BUILD SUCCESS。

- [ ] **Step 6: 契约自检**

Run: `grep -nE "questionCount|countByScope4" Kairos-kakomon-server/src/main/java/org/example/kairos/model/response/dict/UniversityTreeResponse.java Kairos-kakomon-server/src/main/java/org/example/kairos/mapper/question/QuestionMapper.java Kairos-kakomon-server/src/main/java/org/example/kairos/service/dict/impl/DictionaryServiceImpl.java`
Expected: SubjectNode 有 questionCount、mapper 有 countByScope4、service setQuestionCount 调用。

- [ ] **Step 7: Commit**

```bash
git add Kairos-kakomon-server/src/main/java/org/example/kairos/model/response/dict/UniversityTreeResponse.java \
        Kairos-kakomon-server/src/main/java/org/example/kairos/mapper/question/QuestionMapper.java \
        Kairos-kakomon-server/src/main/resources/mapper/question/QuestionMapper.xml \
        Kairos-kakomon-server/src/main/java/org/example/kairos/service/dict/impl/DictionaryServiceImpl.java
git commit -m "feat(be): tree SubjectNode 带 questionCount(按 scope 四元 count)"
```

---

## Task 2: 前端 dict 层 — 透传 questionCount

**Files:**
- Modify: `Kairos-kakomon/src/api/dict.ts`
- Modify: `Kairos-kakomon/src/store/dictStore.ts`

**Interfaces:**
- Consumes: tree 契约（Task 1）。
- Produces: `subjectsByKey` 值类型含 `questionCount?: number`；`dictSubjects` 返回含 `questionCount`。

- [ ] **Step 1: dict.ts 三处 subject 形状加 questionCount**

`src/api/dict.ts`：
- `RawMajorNode.subjects`（第 10 行）：`subjects?: { code: string; nameJp: string }[];` → `subjects?: { code: string; nameJp: string; questionCount?: number }[];`
- `NormalizedDict.subjectsByKey`（第 32 行）：`Record<string, { code: string; nameJp: string }[]>` → `Record<string, { code: string; nameJp: string; questionCount?: number }[]>`
- `normalizeTree` 内 `subjectsByKey` 局部声明（第 41 行）：同上加 `questionCount?: number`。
- `subjectsByKey[subjKey] = m.subjects;`（第 57 行）是整体透传——`m.subjects` 已含 questionCount，无需改赋值逻辑。

- [ ] **Step 2: dictStore.ts subject 类型加 questionCount**

`src/store/dictStore.ts`：
- store state `subjectsByKey` 的类型声明（若显式声明了值形状）加 `questionCount?: number`（与 `NormalizedDict.subjectsByKey` 对齐）。
- `dictSubjects` 返回类型（第 116 行）：`{ code: string; nameJp: string }[]` → `{ code: string; nameJp: string; questionCount?: number }[]`。

> 若 dictStore 的 `subjectsByKey` 类型是从 `NormalizedDict` 派生/引用的，则只改 `dictSubjects` 签名即可；以 type-check 通过为准。

- [ ] **Step 3: 类型门禁（此时 topic-study 未改，应仍通过——本任务不破坏现有用法）**

Run: `cd Kairos-kakomon && npx tsc --noEmit 2>&1 | tail -5`
Expected: 0 error（加可选字段不破坏现有 `{code,nameJp}` 读取）。

- [ ] **Step 4: Commit**

```bash
git add Kairos-kakomon/src/api/dict.ts Kairos-kakomon/src/store/dictStore.ts
git commit -m "feat(fe): dict 层透传科目 questionCount"
```

---

## Task 3: 前端 topic-study — 删 mock 兜底，科目纯走字典

**Files:**
- Modify: `Kairos-kakomon/app/topic-study.tsx`

**Interfaces:**
- Consumes: `dictSubjects`（含 questionCount，Task 2）。

- [ ] **Step 1: 删 poolQuery + pool**

删除 `poolQuery`（第 184-191 行 `const poolQuery = useQuery({...})`）与 `pool` useMemo（第 193-197 行 `const pool = useMemo(...)`）整块。

- [ ] **Step 2: subjects useMemo 改纯字典**

当前 `subjects` useMemo（第 200-218 行）替换为：

```typescript
  const subjects = useMemo(() => {
    if (!activeEntry) return [];
    // Reference dictVersion so the memo recomputes when dict hydrates from network
    void dictVersion;
    return dictSubjects(activeEntry.universityId, activeEntry.gradSchool, activeEntry.majorId ?? '')
      .map((s) => ({ code: s.code, name: s.nameJp, count: s.questionCount ?? 0 }));
  }, [activeEntry, dictVersion]);
```

（删掉原来的 countByCode/nameByCode 扫题池 + :211-217 的 dictList/兜底分支。）

- [ ] **Step 3: 头部总题数改为科目 count 之和**

在 `subjects` useMemo 之后加：

```typescript
  const totalCount = useMemo(() => subjects.reduce((n, s) => n + s.count, 0), [subjects]);
```

把第 384 行 `{pool.length} 道题 · {subjects.length} 门专业课` 改为 `{totalCount} 道题 · {subjects.length} 门专业课`。

- [ ] **Step 4: 移除失效 import**

- 第 14 行 `import { useQuery } from '@tanstack/react-query';` —— 删（唯一用处是 poolQuery）。
- 第 15 行 `import { getQuestions } from '@/api/questions';` —— 删（唯一用处是 poolQuery）。
- 第 21 行 `import { KAKOMON_QUESTIONS, KAKOMON_UNIVERSITIES, DEMO_USER } from '@/mocks/data';` —— 去掉 `KAKOMON_QUESTIONS`（唯一用处是 :195 兜底），保留 `KAKOMON_UNIVERSITIES, DEMO_USER`（仍有 8 处引用）。改为：`import { KAKOMON_UNIVERSITIES, DEMO_USER } from '@/mocks/data';`

- [ ] **Step 5: 前端门禁**

Run: `cd Kairos-kakomon && npm run type-check`
Expected: 0 error。
Run: `cd Kairos-kakomon && npm run lint`
Expected: 0 error（新引入未用符号清理；既有 warning 基线不变）。

- [ ] **Step 6: 自检删净**

Run: `grep -nE "poolQuery|const pool\b|pool\.length|KAKOMON_QUESTIONS|getQuestions|useQuery" Kairos-kakomon/app/topic-study.tsx`
Expected: 无输出（全部移除）。

- [ ] **Step 7: Commit**

```bash
git add Kairos-kakomon/app/topic-study.tsx
git commit -m "fix(fe): topic-study 科目只走字典, 删 mock 题池兜底与扫池(消幻影科目)"
```

---

## Task 4: TASKS.md 联调验证清单

**Files:**
- Modify: `Kairos-kakomon/TASKS.md`

- [ ] **Step 1: 追加清单**

`Kairos-kakomon/TASKS.md` 末尾追加（不改写既有行）：已完成项打 `[x]` + `✅ 完成于 2026-07-13`，联调待验证：
- kyodai/engineering/ee（字典无科目）专题学习科目列表为空 —— 无幻影"数学"
- todai/info-sci/cs 显示 math/algorithm + 真实 count（math=1、algorithm 视种子）
- 有题科目点进详情有题，count 与详情条数一致
- 断网/冷启（dict 未 hydrate）科目列表不崩（空或 seed）
- tree 接口每 SubjectNode 带 questionCount

- [ ] **Step 2: Commit**

```bash
git add Kairos-kakomon/TASKS.md
git commit -m "docs(tasks): 专题学习幻影科目修复联调清单"
```

---

## 依赖顺序

```
Task 1 (后端 tree 带 count) ── 独立, ./mvnw compile 门禁
Task 2 (前端 dict 透传) ──── 依赖 Task 1 契约, 但加可选字段不破坏现有 → 可独立 type-check
Task 3 (topic-study 去兜底) ─ 依赖 Task 2(dictSubjects 带 questionCount)
Task 4 (TASKS) ───────────── 收尾
```

Task 1 后端独立编译。Task 2→3 前端顺序：Task 2 加可选字段（不破坏），Task 3 消费它并删兜底。各任务独立 commit + 门禁。
