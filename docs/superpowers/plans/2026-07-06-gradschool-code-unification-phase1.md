# 研究科标识统一 第一期（全链路 code 化）Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把研究科(gradSchool)标识从日文名统一成英文 code——前端 mock、题库/试卷 seed、用户存量数据全部改用 code——修好个人资料页目标校查不到的 bug 并让前后端数据一致。

**Architecture:** 前端 `mocks/data.ts` 把 `UNI_GRADS` 值、`UNI_MAJORS` 复合键、`KAKOMON_QUESTIONS`/`KAKOMON_PAPERS`/`DEMO_USER` 的 gradSchool 全换 code,并新增 `GRAD_SCHOOL_NAMES`(复合键 `大学::code → 日文名`)。`gradShort` 改签名 `(universityId, code)` 靠 type-check 强制扫全调用点。后端撤掉一个兼容 shim。`V1_5` seed 改 code,新增 `V1_6` 迁移把存量日文名→code。字典仍前端硬编码(数据源化是第二期,不在本计划)。

**Tech Stack:** Expo ~54 / RN 0.81.5 / TS strict(前端);Spring Boot 4 + MyBatis(后端);MySQL 8。前端门禁 `npm run type-check` + `npm run lint`,后端 `./mvnw compile`。

## Global Constraints

- **权威对照表**:所有 code↔日文名映射以 `docs/05-database/sql/V1_1__seed_dictionary.sql` 的 `grad_school` seed 为准(见下方「翻译表」)。不得自造 code。
- **同一 code 跨校日文名不同**(如 `engineering`=东大工学系研究科/京大工学研究科/东工大工学院/九大工学府)→ 显示映射 `GRAD_SCHOOL_NAMES` **必须用复合键 `大学::code`**,严禁扁平 `code→名`。
- `UNI_GRADS` code 数组顺序 = 现有日文名数组顺序(一一对应,不重排)。
- `UNI_MAJORS` 复合键从 `大学::日文名` 改为 `大学::code`,内部 major 列表(id/label/short/desc)**不动**。
- `gradShort` 签名统一改为 `(universityId: string, code: string)`;所有调用点补 universityId 实参。
- 匹配逻辑(`q.graduateSchool === activeEntry.gradSchool`、`accessPolicy.targetKey`、`browseSchoolsStore` 复合键)**不改**——两边都变 code 后自然相等。
- 迁移 SQL 用 `JOIN grad_school ON name_jp = 旧值` 关联(天然幂等,只匹配日文名行,已是 code 的行不动)。
- 付费门禁仍前端判定,不动 `accessPolicy` 逻辑。
- 每个 Task 结束跑对应门禁(前端 type-check / 后端 compile)通过后 commit。
- 无实时后端/DB:功能验证以 type-check 抓调用点 + 静态走查为主;真机连后端 + V1_6 执行标为待联调,不假称已连真。
- 动工前在 `Kairos-kakomon/TASKS.md` 追加本期 checklist。

---

## 翻译表（uni::code → 日文名，权威,来自 V1_1 seed）

```
todai::info-sci=情报理工学系研究科  todai::engineering=工学系研究科  todai::science=理学系研究科
todai::economics=经济学研究科  todai::new-domain=新领域创成科学研究科  todai::integrated-culture=综合文化研究科
titech::info-sci=情报理工学院  titech::engineering=工学院  titech::science=理学院  titech::materials=物质理工学院  titech::env-social=环境社会理工学院
kyodai::engineering=工学研究科  kyodai::science=理学研究科  kyodai::informatics=情报学研究科  kyodai::economics=经济学研究科  kyodai::agriculture=农学研究科
waseda::core-sci=基干理工学研究科  waseda::creative-sci=创造理工学研究科  waseda::advanced-sci=先进理工学研究科  waseda::economics=经济学研究科  waseda::commerce=商学研究科
keio::science-engineering=理工学研究科  keio::economics=经济学研究科  keio::commerce=商学研究科  keio::law=法学研究科  keio::media=媒体研究科
osakau::engineering=工学研究科  osakau::basic-engineering=基础工学研究科  osakau::science=理学研究科  osakau::info-science=情报科学研究科
hitotsubashi::economics=经济学研究科  hitotsubashi::commerce=商学研究科  hitotsubashi::law=法学研究科  hitotsubashi::sociology=社会学研究科
kobe::engineering=工学研究科  kobe::economics=经济学研究科  kobe::maritime=海事科学研究科  kobe::intl-culture=国际文化学研究科
nagoya::engineering=工学研究科  nagoya::informatics=情报学研究科  nagoya::science=理学研究科  nagoya::economics=经济学研究科
kyushu::engineering=工学府  kyushu::info-science=情报科学府  kyushu::science=理学府  kyushu::economics=经济学府
hokudai::engineering=工学院  hokudai::science=理学院  hokudai::agriculture=农学院  hokudai::info-science=情报科学院
tohoku::engineering=工学研究科  tohoku::science=理学研究科  tohoku::info-science=情报科学研究科  tohoku::economics=经济学研究科
sophia::science-engineering=理工学研究科  sophia::economics=经济学研究科  sophia::foreign-languages=外国语学研究科  sophia::global-studies=全球研究研究科
doshisha::science-engineering=理工学研究科  doshisha::economics=经济学研究科  doshisha::commerce=商学研究科  doshisha::law=法学研究科
```

**UNI_GRADS 每校 code 顺序(与现有日文名数组一一对应):**
```
todai: info-sci, engineering, science, economics, new-domain, integrated-culture
titech: info-sci, engineering, science, materials, env-social
kyodai: engineering, science, informatics, economics, agriculture
waseda: core-sci, creative-sci, advanced-sci, economics, commerce
keio: science-engineering, economics, commerce, law, media
osakau: engineering, basic-engineering, science, info-science
hitotsubashi: economics, commerce, law, sociology
kobe: engineering, economics, maritime, intl-culture
nagoya: engineering, informatics, science, economics
kyushu: engineering, info-science, science, economics
hokudai: engineering, science, agriculture, info-science
tohoku: engineering, science, info-science, economics
sophia: science-engineering, economics, foreign-languages, global-studies
doshisha: science-engineering, economics, commerce, law
```

---

## File Structure

- `Kairos-kakomon/src/mocks/data.ts` — 改:`UNI_GRADS` 值→code、`UNI_MAJORS` 键→code、`KAKOMON_QUESTIONS`/`KAKOMON_PAPERS`/`DEMO_USER` gradSchool→code;新增 `GRAD_SCHOOL_NAMES`。
- `Kairos-kakomon/app/topic-study.tsx` — 改:`gradShort` 签名 + 3 处调用 + `normGrad` 复核。
- `Kairos-kakomon/app/mock-exam.tsx` — 改:`gradShort` 签名 + 3 处调用 + `normGrad` 复核。
- `Kairos-kakomon-server/.../service/dict/impl/DictionaryServiceImpl.java` — 改:撤 `getMajors` 的 name_jp fallback shim。
- `Kairos-kakomon/src/api/universities.ts` — 改:`getUniversityMajors` 去掉 nameJp hack 注释(传 code)。
- `docs/05-database/sql/V1_5__seed_questions.sql` — 改:`grad_school_code` 日文名→code。
- `docs/05-database/sql/V1_6__gradschool_code_migration.sql` — 新增:存量数据迁移。

> **范围外(第二期)**:前端字典改从后端拉;`universities.ts` 的 `getUniversity`/`getUniversityGradSchools` 返回 nameJp 的桥接。

---

### Task 1: mocks/data.ts — 全部 gradSchool 换 code + 新增 GRAD_SCHOOL_NAMES

**Files:**
- Modify: `Kairos-kakomon/src/mocks/data.ts`

**Interfaces:**
- Consumes: 翻译表(本计划顶部)
- Produces:
  - `UNI_GRADS`(值为 code 数组)、`UNI_MAJORS`(键 `大学::code`)
  - `export const GRAD_SCHOOL_NAMES: Record<string, string>`(键 `大学::code`,值日文名)
  - `KAKOMON_QUESTIONS[].graduateSchool` / `KAKOMON_PAPERS[].graduateSchool` / `DEMO_USER.targetSchools[].gradSchool` 全为 code

- [ ] **Step 1: UNI_GRADS 值改 code**

把 `UNI_GRADS` 每校的日文名数组替换为对应 code 数组(顺序不变,用顶部「UNI_GRADS 每校 code 顺序」表)。结果:

```ts
export const UNI_GRADS: UniGrads = {
  todai:        ['info-sci', 'engineering', 'science', 'economics', 'new-domain', 'integrated-culture'],
  titech:       ['info-sci', 'engineering', 'science', 'materials', 'env-social'],
  kyodai:       ['engineering', 'science', 'informatics', 'economics', 'agriculture'],
  waseda:       ['core-sci', 'creative-sci', 'advanced-sci', 'economics', 'commerce'],
  keio:         ['science-engineering', 'economics', 'commerce', 'law', 'media'],
  osakau:       ['engineering', 'basic-engineering', 'science', 'info-science'],
  hitotsubashi: ['economics', 'commerce', 'law', 'sociology'],
  kobe:         ['engineering', 'economics', 'maritime', 'intl-culture'],
  nagoya:       ['engineering', 'informatics', 'science', 'economics'],
  kyushu:       ['engineering', 'info-science', 'science', 'economics'],
  hokudai:      ['engineering', 'science', 'agriculture', 'info-science'],
  tohoku:       ['engineering', 'science', 'info-science', 'economics'],
  sophia:       ['science-engineering', 'economics', 'foreign-languages', 'global-studies'],
  doshisha:     ['science-engineering', 'economics', 'commerce', 'law'],
};
```

- [ ] **Step 2: UNI_MAJORS 键改 code**

把 `UNI_MAJORS` 的每个复合键 `'大学::日文名'` 改成 `'大学::code'`(用翻译表反查)。**只改键,不动键内的 major 数组**。现有 10 个键的映射:

```
'todai::情报理工学系研究科'  → 'todai::info-sci'
'todai::工学系研究科'        → 'todai::engineering'
'todai::理学系研究科'        → 'todai::science'
'todai::经济学研究科'        → 'todai::economics'
'titech::情报理工学院'       → 'titech::info-sci'
'titech::工学院'             → 'titech::engineering'
'kyodai::情报学研究科'       → 'kyodai::informatics'
'kyodai::工学研究科'         → 'kyodai::engineering'
'waseda::基干理工学研究科'   → 'waseda::core-sci'
'keio::理工学研究科'         → 'keio::science-engineering'
```

- [ ] **Step 3: 新增 GRAD_SCHOOL_NAMES**

在 `UNI_GRADS` 定义之后新增(用翻译表全部 62 项,复合键 `大学::code` → 日文名):

```ts
/** 研究科 code → 日文显示名。复合键 `大学::code`(同 code 跨校日文名不同)。 */
export const GRAD_SCHOOL_NAMES: Record<string, string> = {
  'todai::info-sci': '情报理工学系研究科', 'todai::engineering': '工学系研究科', 'todai::science': '理学系研究科',
  'todai::economics': '经济学研究科', 'todai::new-domain': '新领域创成科学研究科', 'todai::integrated-culture': '综合文化研究科',
  'titech::info-sci': '情报理工学院', 'titech::engineering': '工学院', 'titech::science': '理学院', 'titech::materials': '物质理工学院', 'titech::env-social': '环境社会理工学院',
  'kyodai::engineering': '工学研究科', 'kyodai::science': '理学研究科', 'kyodai::informatics': '情报学研究科', 'kyodai::economics': '经济学研究科', 'kyodai::agriculture': '农学研究科',
  'waseda::core-sci': '基干理工学研究科', 'waseda::creative-sci': '创造理工学研究科', 'waseda::advanced-sci': '先进理工学研究科', 'waseda::economics': '经济学研究科', 'waseda::commerce': '商学研究科',
  'keio::science-engineering': '理工学研究科', 'keio::economics': '经济学研究科', 'keio::commerce': '商学研究科', 'keio::law': '法学研究科', 'keio::media': '媒体研究科',
  'osakau::engineering': '工学研究科', 'osakau::basic-engineering': '基础工学研究科', 'osakau::science': '理学研究科', 'osakau::info-science': '情报科学研究科',
  'hitotsubashi::economics': '经济学研究科', 'hitotsubashi::commerce': '商学研究科', 'hitotsubashi::law': '法学研究科', 'hitotsubashi::sociology': '社会学研究科',
  'kobe::engineering': '工学研究科', 'kobe::economics': '经济学研究科', 'kobe::maritime': '海事科学研究科', 'kobe::intl-culture': '国际文化学研究科',
  'nagoya::engineering': '工学研究科', 'nagoya::informatics': '情报学研究科', 'nagoya::science': '理学研究科', 'nagoya::economics': '经济学研究科',
  'kyushu::engineering': '工学府', 'kyushu::info-science': '情报科学府', 'kyushu::science': '理学府', 'kyushu::economics': '经济学府',
  'hokudai::engineering': '工学院', 'hokudai::science': '理学院', 'hokudai::agriculture': '农学院', 'hokudai::info-science': '情报科学院',
  'tohoku::engineering': '工学研究科', 'tohoku::science': '理学研究科', 'tohoku::info-science': '情报科学研究科', 'tohoku::economics': '经济学研究科',
  'sophia::science-engineering': '理工学研究科', 'sophia::economics': '经济学研究科', 'sophia::foreign-languages': '外国语学研究科', 'sophia::global-studies': '全球研究研究科',
  'doshisha::science-engineering': '理工学研究科', 'doshisha::economics': '经济学研究科', 'doshisha::commerce': '商学研究科', 'doshisha::law': '法学研究科',
};
```

- [ ] **Step 4: KAKOMON_QUESTIONS 的 graduateSchool 改 code**

逐题把 `graduateSchool: '日文名'` 改成对应 code——**必须按该题自己的 `universityId` 用翻译表反查**(同一日文名跨校 code 可能不同)。映射规则:
- `情报理工学系研究科`(todai)→ `info-sci`
- `情报理工学院`(titech)→ `info-sci`
- `工学研究科`(kyodai/nagoya/kobe/tohoku 等)→ `engineering`(按该题 universityId)
- `基础工学研究科`(osakau)→ `basic-engineering`
- `情报学研究科`(kyodai/nagoya)→ `informatics`
- `理学院`(titech/hokudai)→ `science`
- `理工学研究科`(keio/sophia/doshisha)→ `science-engineering`
- `经济学研究科`(多校)→ `economics`

逐题核对 `universityId` 决定 code。改完全局搜确认 `KAKOMON_QUESTIONS` 里已无中文研究科名残留。

- [ ] **Step 5: KAKOMON_PAPERS + DEMO_USER 改 code**

- `KAKOMON_PAPERS`:`graduateSchool: '情报理工学系研究科'`(todai)→ `graduateSchool: 'info-sci'`。
- `DEMO_USER.targetSchools`:`gradSchool: '情报理工学系研究科'`(todai)→ `'info-sci'`;`gradSchool: '情报理工学院'`(titech)→ `'info-sci'`。

- [ ] **Step 6: type-check**

Run: `cd Kairos-kakomon && npm run type-check`
Expected: PASS(纯数据值改动,类型不变)

- [ ] **Step 7: Commit**

```bash
git add Kairos-kakomon/src/mocks/data.ts
git commit -m "refactor(mocks): switch gradSchool identifiers to codes + add GRAD_SCHOOL_NAMES"
```

---

### Task 2: gradShort 改签名 + 全部调用点补 universityId

**Files:**
- Modify: `Kairos-kakomon/app/topic-study.tsx`(gradShort 定义 line 41-45 + 3 处调用:254、318、408)
- Modify: `Kairos-kakomon/app/mock-exam.tsx`(gradShort 定义 line 49-53 + 3 处调用:322、382、535)

**Interfaces:**
- Consumes: `GRAD_SCHOOL_NAMES`(Task 1)
- Produces: `gradShort(universityId: string, code: string): string`(两文件各一份,签名一致)

- [ ] **Step 1: import GRAD_SCHOOL_NAMES(两文件)**

`topic-study.tsx` 和 `mock-exam.tsx` 里,从 `@/mocks/data` 的现有 import 追加 `GRAD_SCHOOL_NAMES`(它们已 import KAKOMON_QUESTIONS 等,加到同一行)。

- [ ] **Step 2: 改 gradShort 定义(两文件相同)**

把两文件的 `gradShort` 函数(现为 `(g: string)`)替换为:

```ts
function gradShort(universityId: string, code: string): string {
  if (!code) return '—';
  const name = GRAD_SCHOOL_NAMES[`${universityId}::${code}`] ?? code;
  const core = name.replace(/(研究科|学府|学院|研究院)$/u, '');
  return core.length > 5 ? core.slice(0, 5) : core || name;
}
```

- [ ] **Step 3: 补 3 处调用的 universityId 实参(topic-study.tsx)**

- line 254(Alert 文案):`gradShort(entry.gradSchool)` → `gradShort(entry.universityId, entry.gradSchool)`
- line 318(railSub):`gradShort(e.gradSchool)` → `gradShort(e.universityId, e.gradSchool)`
- line 408(menu 标题):`gradShort(menuFor.gradSchool)` → `gradShort(menuFor.universityId, menuFor.gradSchool)`

(`entry`/`e`/`menuFor` 均为 RailEntry,含 `universityId` 字段。)

- [ ] **Step 4: 补 3 处调用的 universityId 实参(mock-exam.tsx)**

- line 322(Alert 文案):`gradShort(entry.gradSchool)` → `gradShort(entry.universityId, entry.gradSchool)`
- line 382(railSub):`gradShort(e.gradSchool)` → `gradShort(e.universityId, e.gradSchool)`
- line 535(menu 标题):`gradShort(menuFor.gradSchool)` → `gradShort(menuFor.universityId, menuFor.gradSchool)`

- [ ] **Step 5: normGrad 复核(两文件)**

两文件的 `normGrad = (universityId, gradSchool?) => gradSchool ?? (UNI_GRADS[universityId]?.[0] ?? '')` **无需改**——`UNI_GRADS[universityId]?.[0]` 现在返回 code(Task 1 已改),逻辑自然正确。确认即可。

- [ ] **Step 6: type-check(安全网)**

Run: `cd Kairos-kakomon && npm run type-check`
Expected: PASS。**若报 `gradShort` 参数数量错误,说明还有漏改的调用点** —— 全局搜 `gradShort(` 补齐,直到 PASS。

- [ ] **Step 7: Commit**

```bash
git add Kairos-kakomon/app/topic-study.tsx Kairos-kakomon/app/mock-exam.tsx
git commit -m "refactor(study): gradShort takes (universityId, code), looks up display name"
```

---

### Task 3: 后端撤掉 DictionaryServiceImpl 的 name_jp fallback shim

**Files:**
- Modify: `Kairos-kakomon-server/src/main/java/org/example/kairos/service/dict/impl/DictionaryServiceImpl.java`(getMajors,约 line 114-120)

**Interfaces:**
- Consumes: 无
- Produces: `getMajors` 只按 code 查研究科

- [ ] **Step 1: 读现状**

Read `DictionaryServiceImpl.java` 的 `getMajors` 方法。当前逻辑:先 `gradSchoolMapper.findByUniversityIdAndCode(u.getId(), gradCode)`,若为 null 再 `findByUniversityIdAndNameJp(...)` 兜底。

- [ ] **Step 2: 撤掉 name_jp fallback**

把 `getMajors` 里「先 code 查,null 再 name_jp 查」的两段,改为只按 code 查一次:

```java
GradSchoolEntity g = gradSchoolMapper.findByUniversityIdAndCode(u.getId(), gradCode);
if (g == null) {
    throw new BizException(ResultCode.DICT_NOT_FOUND);
}
```

删除对 `findByUniversityIdAndNameJp` 的调用。`findByUniversityIdAndNameJp` 这个 mapper 方法本身**保留**(第二期可能还用,且删它要连带删 XML,超出本任务范围)。

- [ ] **Step 3: compile**

Run: `cd Kairos-kakomon-server && ./mvnw -q compile`
Expected: BUILD SUCCESS

- [ ] **Step 4: Commit**

```bash
git add Kairos-kakomon-server/src/main/java/org/example/kairos/service/dict/impl/DictionaryServiceImpl.java
git commit -m "refactor(dict): getMajors queries grad school by code only (drop name_jp shim)"
```

---

### Task 4: universities.ts 去掉 getUniversityMajors 的 nameJp hack

**Files:**
- Modify: `Kairos-kakomon/src/api/universities.ts`(getUniversityMajors,约 line 245-260)

**Interfaces:**
- Consumes: 无
- Produces: `getUniversityMajors` 传 code 给后端(注释更新)

- [ ] **Step 1: 更新注释 + 变量名**

`getUniversityMajors` 里现有:
```ts
      // 后端用 gradCode 查询，前端原 mock 用 nameJp。
      // 简化：直接传 nameJp，后端在 grad_school.code 等于 nameJp 的项目中匹配（需要 seed 时保持一致）。
      const gradCode = params.gradSchool;
```
`params.gradSchool` 现在已是 code(Task 1 起前端全传 code),把注释改为准确描述,保留 `gradCode` 变量:
```ts
      // params.gradSchool 现为研究科 code（Phase 1 已统一），直接作为 gradCode 传后端。
      const gradCode = params.gradSchool;
```
其余逻辑不动(mock fallback 分支的 `UNI_MAJORS[key]` 键 `${universityId}::${gradSchool}` 现在也是 code,自然对上 Task 1 改后的 UNI_MAJORS 键)。

- [ ] **Step 2: type-check**

Run: `cd Kairos-kakomon && npm run type-check`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add Kairos-kakomon/src/api/universities.ts
git commit -m "refactor(api): getUniversityMajors passes grad school code (drop nameJp hack)"
```

---

### Task 5: V1_5 seed 的 grad_school_code 改 code

**Files:**
- Modify: `docs/05-database/sql/V1_5__seed_questions.sql`(4 处:line 19 paper + line 30/34/38 questions)

**Interfaces:**
- Consumes: 无
- Produces: V1_5 seed 用 code(`info-sci`),使全新环境 V1_0–V1_5 执行即正确

- [ ] **Step 1: 替换 4 处 grad_school_code 值**

V1_5 里全部 4 行都是 `todai` + `'情报理工学系研究科'`,统一改成 `'info-sci'`:
- line 19(exam_paper `p-todai-2024-math`):`'todai', '情报理工学系研究科'` → `'todai', 'info-sci'`
- line 30(`q-todai-2024-math-1`):同上
- line 34(`q-todai-2024-math-2`):同上
- line 38(`q-todai-2024-math-3`):同上

用 replace_all 把 V1_5 里的 `'情报理工学系研究科'` 全替换为 `'info-sci'`(该文件里这个字符串只出现在 grad_school_code 位置,replace_all 安全;替换后全局搜确认无残留)。

- [ ] **Step 2: 校验文件**

Run: `cd /Users/renquan.11/karios && grep -c "情报理工学系研究科" docs/05-database/sql/V1_5__seed_questions.sql`
Expected: `0`(已无日文名残留)

- [ ] **Step 3: Commit**

```bash
git add docs/05-database/sql/V1_5__seed_questions.sql
git commit -m "refactor(db): V1_5 seed uses grad school code (info-sci) not Japanese name"
```

---

### Task 6: 新增 V1_6 存量数据迁移 SQL

**Files:**
- Create: `docs/05-database/sql/V1_6__gradschool_code_migration.sql`

**Interfaces:**
- Consumes: V1_0（grad_school/university 表）、既有存量数据
- Produces: 迁移脚本(本环境不执行,待联调环境执行)

- [ ] **Step 1: 写迁移脚本**

创建 `docs/05-database/sql/V1_6__gradschool_code_migration.sql`:

```sql
-- =============================================================
--  Kairos-kakomon 迁移脚本 V1.6 — 研究科标识 日文名 → code
--  对应设计文档：docs/superpowers/specs/2026-07-06-gradschool-code-unification-design.md
--  执行环境：MySQL 8.x
--  前置：V1_0（university/grad_school 字典）、V1_1（字典 seed）
--  幂等：JOIN grad_school ON name_jp = 旧值,只匹配"当前是日文名"的行;
--        已是 code 的行 join 不上、不动。可安全重复执行。
-- =============================================================

USE `kakomon`;
SET NAMES utf8mb4;

-- 用户目标校
UPDATE `user_target_school` t
JOIN `university`  u ON u.code = t.university_code
JOIN `grad_school` g ON g.university_id = u.id AND g.name_jp = t.grad_school_code
SET t.grad_school_code = g.code;

-- 大问(题库)
UPDATE `question` q
JOIN `university`  u ON u.code = q.university_code
JOIN `grad_school` g ON g.university_id = u.id AND g.name_jp = q.grad_school_code
SET q.grad_school_code = g.code;

-- 试卷
UPDATE `exam_paper` p
JOIN `university`  u ON u.code = p.university_code
JOIN `grad_school` g ON g.university_id = u.id AND g.name_jp = p.grad_school_code
SET p.grad_school_code = g.code;
```

- [ ] **Step 2: 校验 SQL 存在 + 语法目视**

Run: `cd /Users/renquan.11/karios && wc -l docs/05-database/sql/V1_6__gradschool_code_migration.sql`
Expected: 文件存在,行数 > 20。**本环境无 DB 凭据,不执行**;标注待联调环境执行。

- [ ] **Step 3: Commit**

```bash
git add docs/05-database/sql/V1_6__gradschool_code_migration.sql
git commit -m "feat(db): add V1_6 migration for grad_school_code Japanese-name to code"
```

---

### Task 7: 验证 + TASKS.md 收尾

**Files:**
- Modify: `Kairos-kakomon/TASKS.md`

**Interfaces:**
- Consumes: 全部前序 Task
- Produces: 无

- [ ] **Step 1: 全量前端门禁**

Run: `cd Kairos-kakomon && npm run type-check && npm run lint`
Expected: type-check PASS;lint 0 error(既有 warning 属基线)。若本期文件有新 error/warning 修掉。

- [ ] **Step 2: 后端门禁**

Run: `cd Kairos-kakomon-server && ./mvnw -q compile`
Expected: BUILD SUCCESS

- [ ] **Step 3: 静态走查(无实时后端/DB)**

逐条在代码里核对并写进报告:
- 全局搜前端 `src/`+`app/` 里研究科中文名残留(除 `GRAD_SCHOOL_NAMES` 值和 `mocks/data.ts` 注释外):`grep -rn "研究科\|学府\|学院" Kairos-kakomon/src Kairos-kakomon/app | grep -v GRAD_SCHOOL_NAMES` —— 确认 `UNI_GRADS`/`UNI_MAJORS` 键/题库/paper/demo 已无中文研究科名当值/键。
- `gradShort` 全部调用点已补 universityId(type-check 已保证)。
- 匹配逻辑未改(`q.graduateSchool === activeEntry.gradSchool` 等)——两边现在都是 code。
- V1_6 迁移用 JOIN name_jp,幂等。
- 真机连后端 + 执行 V1_6 的端到端(个人资料目标校研究科显示、专题/模考按研究科筛选)标为**待联调环境验证,本环境未连真**。

- [ ] **Step 4: TASKS.md 追加**

在 `Kairos-kakomon/TASKS.md` 末尾追加(不改写既有行):

```markdown
### 2026-07-06 任务：研究科标识统一 第一期（全链路 code 化）
- [x] 前端 mock 全链路 gradSchool 换 code（UNI_GRADS/UNI_MAJORS 键/题库/paper/demo）+ 新增 GRAD_SCHOOL_NAMES
  ✅ 完成于 2026-07-06
- [x] gradShort 改签名 (universityId, code) 查复合键显示名；后端撤 name_jp shim；universities.ts 传 code
  ✅ 完成于 2026-07-06
- [x] V1_5 seed 改 code；新增 V1_6 存量迁移（JOIN name_jp，幂等）
  ✅ 完成于 2026-07-06
- [x] 门禁 type-check + lint + mvnw compile 通过；静态走查无中文研究科名残留
  ✅ 完成于 2026-07-06，真机连后端 + V1_6 执行待联调环境验证
- [ ] 第二期：前端字典改从后端拉（单独 brainstorm）
```

- [ ] **Step 5: Commit**

```bash
git add Kairos-kakomon/TASKS.md
git commit -m "docs(tasks): mark gradSchool code-unification phase 1 done"
```

---

## Self-Review

**Spec coverage(对照 spec §4/§5):**
- §4.1 UNI_GRADS/UNI_MAJORS/题库/paper/demo 换 code + GRAD_SCHOOL_NAMES → Task 1 ✅
- §4.2 gradShort 改签名 + 调用点 + normGrad → Task 2 ✅
- §4.3 匹配逻辑不改 → 无 Task(约束,Task 2/7 复核)✅
- §4.4 撤 DictionaryServiceImpl shim → Task 3 ✅;UserServiceImpl:223 不改(迁移修复)→ 无 Task,Task 7 走查 ✅
- §4.5 universities.ts getUniversityMajors 传 code → Task 4 ✅
- §4.6 V1_6 迁移 → Task 6 ✅
- §4.7 V1_5 seed 改 code → Task 5 ✅
- §6 验证 → Task 7 ✅
- §8 范围外(第二期)→ 计划多处注明,无 Task ✅

**Placeholder scan:** 无 TBD/TODO;每步给完整代码/命令/映射。无 DB 场景明确「不执行、待联调、不假称」。

**Type consistency:** `gradShort(universityId, code)`(Task 2)签名统一两文件;`GRAD_SCHOOL_NAMES` 复合键 `大学::code`(Task 1)与 gradShort 查法(Task 2)、UNI_MAJORS 键(Task 1)一致;UNI_GRADS code 值(Task 1)被 normGrad(Task 2)、universities.ts mock fallback 键(Task 4)消费一致;V1_5 seed code(Task 5)与 V1_6 迁移目标(Task 6)、翻译表一致。
