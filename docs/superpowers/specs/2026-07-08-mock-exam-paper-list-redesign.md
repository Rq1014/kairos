# 模拟考试三级下钻重构（试卷列表驱动 + 去 mock）— 设计

- **日期**：2026-07-08
- **状态**：已定稿（用户逐点确认）
- **范围**：全链路 —— DB（V1_4 放开唯一键）+ 后端（getPapers 按 major 过滤）+ 前端（mock-exam 重构 + 新 exam-papers 页 + 去 mock）
- **前置**：`docs/superpowers/specs/2026-07-08-subject-major-dimension-design.md`（subject/major 维度化，已实现）；本 spec 是其 §5 标注的「一个专业+科目多份卷 UI」后续迭代。
- **相关**：`docs/superpowers/specs/2026-07-02-topic-study-and-mock-exam-design.md`

## 1. 背景与目标

当前 `app/mock-exam.tsx` 从 mock 题池 `KAKOMON_QUESTIONS` 聚合「年度 → 科目」，并在年份卡内直接 `startExam` 开考——隐含「一(专业+年度+科目)=一份卷」。产品实际需要：同一 (专业+年度+科目) 下可有**多份试卷**（第1回/第2回、専門Ⅰ/Ⅱ 等），且要求模考数据**全部从后端读、去除 mock 兜底**。

**目标流程（三级下钻）**：
```
左栏选 校+研究科+专业（东大·情报理工·CS）
  └─ 主页面：按年度分组卡片（2026 / 2025 …）
       └─ 每张年度卡一个科目下拉（只列该年有卷的科目，展示日文名）
            └─ 点科目 → 跳新页 exam-papers
                 └─ 列出该 (专业+年度+科目) 下多份试卷（按 sort_order）
                      └─ 点某份卷 → exam-session 开考
```

## 2. 核心决策（用户逐点确认）

| # | 点 | 决策 |
|---|----|------|
| A | 多卷模型 | **放开 `uk_paper_scope` 唯一约束**，允许同 (校+研究科+专业+年度+科目) 多份卷；唯一性仅剩 `uk_paper_code`（paper.code 全站唯一），多卷靠 code + sort_order 区分 |
| B | 聚合数据源 | **试卷列表驱动一切** —— `getPapers` 返回该专业全部卷，前端内存做年度/科目/卷三级分组，不再扫题池 |
| C | 拉取粒度 | **一次拉「校+研究科+专业」全部卷**（带 majorId）；exam-papers 页复用同一 react-query 缓存筛 year+subject，**不再单独请求** |
| D | 学校元数据 | **A 方案**：本屏改走 `getUniversities()`（后端基础字段 + mergeWithMock 兜底 accent 等装饰字段），不再直接 `import KAKOMON_UNIVERSITIES`。**去 mock 到底**：本屏对 universities 亦**不做 mock 兜底**（区别于 university/study 两姐妹屏的 `?? KAKOMON_UNIVERSITIES`）——getUniversities 失败/空则左栏与加校搜索显示空/错误态。此处刻意比姐妹屏更严，贴合「全部从后端读」；实现与审查须知这是**有意分歧**，非不一致 bug。注意 `getUniversities` 内部 `mergeWithMock` 仍会用 mock 补 accent 等装饰字段（后端无 accent 列），这是 API 层既有行为、非本屏兜底。 |
| E | 付费门禁 | **下沉到 exam-papers 卷卡**（点卷判 school×year，未解锁看广告）；主页面科目下拉纯导航、不判权限 |
| F | offline 兜底 | **模考不做 mock 兜底**；getPapers 失败/空显示空态。理由：模考开考本就依赖后端整卷 getPaper，离线无意义，且贴合「全部从后端读」 |

## 3. 后端改动

### 3.1 放开唯一键（V1_4 就地改）
`exam_paper` 的
```sql
UNIQUE KEY `uk_paper_scope` (`university_code`, `grad_school_code`, `major_code`, `year`, `subject_code`),
```
→ 降级为普通索引（去 UNIQUE，列不变，改名以示语义）：
```sql
KEY `idx_paper_scope` (`university_code`, `grad_school_code`, `major_code`, `year`, `subject_code`),
```
Greenfield 无线上数据，V1_4 直接改建表语句，无 ALTER。

### 3.2 getPapers 按 major 过滤
- `PaperController.list`（`/api/papers`）新增可选 `@RequestParam(required=false) String majorId`。
- `PaperQueryService.listByScope` 签名加 `String majorId`；`ExamPaperMapper.findByScope` 加 `@Param("majorCode")` + 动态条件 `<if test="majorCode != null and majorCode != ''">AND major_code = #{majorCode}</if>`。因 XML 需动态 SQL，`findByScope` 的 `<select>` 用 `<where>` 或保留 status/uni/grad 恒定条件 + 可选 major。
- 排序改为 `ORDER BY year DESC, subject_code ASC, sort_order DESC, id ASC`（同年同科目多卷按 sort_order 稳定排）。

### 3.3 DTO 无需改
`PaperListItemResponse` 现已含 `id / year / subject / subjectCode / title / durationMinutes / selectRule / questionCount`——前端三级分组所需字段齐全。`subject`（日文展示名）已由 subject 维度化 spec 的 service 字典解析回传。**不新增字段**。

> 注：`listByScope` 已有的 per-paper `questionMapper.findByPaperCode().size()` N+1 属既有实现，本次不优化（非回归）。

## 4. 前端改动

### 4.1 `mock-exam.tsx`（改造）
- **数据源**：`papersQuery = useQuery(['papers', uni, grad, majorId], () => getPapers({universityId, graduateSchool, majorId}))`。删除对 `KAKOMON_QUESTIONS` 的 import 与题池 `pool`/`yearGroups` 基于题池的逻辑。
- **左栏**：改用 `getUniversities()` 结果（或既有 universities 数据路径）取 short/nameCn/accent，不再 `import { KAKOMON_UNIVERSITIES }`。左栏结构（目标校/浏览校、增删排序、研究科/专业选择）保留。
- **年度分组**：`useMemo` 对 `papersQuery.data` 按 `year` 分组降序；每组内按 `subjectCode` 去重得科目下拉项（`{code, name=subject}`），只列该年**有卷**的科目。
- **科目下拉**：选中某科目后，点击 → `router.push('/exam-papers?universityId=&graduateSchool=&majorId=&year=&subjectCode=&subjectName=')`。**移除**卡内 `startExam`、`canAccessQuestion`、`AdGateModal`、`gate` 等内联开考/门禁逻辑（下沉到 exam-papers）。
- 空态：`papersQuery` 成功但无卷 → "该范围暂无试卷"；`isLoading` → loading；`isError` → 错误态（不 fallback mock）。

### 4.2 `exam-papers.tsx`（新建）
- 参数：`universityId / graduateSchool / majorId / year / subjectCode / subjectName`（`useLocalSearchParams`）。
- **复用缓存**：同 `useQuery(['papers', uni, grad, majorId], ...)`——react-query 命中 mock-exam 已拉的缓存，内存 `filter(p => p.year === Number(year) && p.subjectCode === subjectCode)` 得多份卷，按 `sort_order`（即列表已排序）展示。
- **卷卡**：标题 `title`、时长 `durationMinutes`、选做规则 `selectRule.total/choose`、题数 `questionCount`。
- **门禁**（决策 E）：卷卡上 `canAccessQuestion(user, {universityId, gradSchool, year})` 判定；未解锁显示"看广告解锁（24h）"→ `AdGateModal`（逻辑从 mock-exam 搬来，school×year 粒度，`unlockSchoolYear`）。
- 点已解锁的卷 → `router.push('/exam-session?paperCode=<p.id>&mode=mock&title=...&durationMinutes=<p.durationMinutes>&selectTotal=<p.selectRule.total>&selectChoose=<p.selectRule.choose>')`。**注意**：exam-session 的时长倒计时与"N 题选 M"提示只读 URL 参数（`exam-session.tsx:122-124`、`212`），**不**从 `paperQuery.data` 取，故必须像旧 mock-exam 那样把 durationMinutes/selectTotal/selectChoose 作为参数传入（exam-papers 内存已有该 paper，直接拼即可）。title 建议 `校 年 科目`。
- 空态：该 (year+subject) 无卷（正常不会，导航来的必有）→ 提示 + 返回。

### 4.3 `exam-session.tsx`（基本不动）
- 已由 `getPaper(paperCode)` 驱动整卷。从 exam-papers 传 `paperCode` 单卷即可。**确认**不再依赖旧的 `ids=` 拼接路径（旧 mock-exam 传的 `ids` + `paperCode`；新流程只传 `paperCode`，exam-session 的 `questionDetails` 分支已优先用 paper detail）。mock-exam 是全项目**唯一**用 `ids=` 调 exam-session 的入口（已 grep 确认），移除后 `ids=` 分支只剩 KAKOMON_QUESTIONS 兜底、无活跃调用者——**本 spec 不清理该分支**（避免扩面），留作后续。
- 时长/选做参数：exam-session 只从 URL 参数读（见 §4.2），故 exam-papers 跳转时必须带 durationMinutes/selectTotal/selectChoose——**exam-session 本身不改**。

### 4.4 `app/_layout.tsx`
- 注册 `<Stack.Screen name="exam-papers" options={{ animation: 'slide_from_right' }} />`（紧邻 exam-session）。

## 5. 去 mock 的边界

| Mock 常量 | 本屏处理 | data.ts 是否删 |
|-----------|---------|----------------|
| `KAKOMON_QUESTIONS` | 本屏移除 import；聚合改 getPapers | **保留**（topic-study/search/questions/exam-session 等~8 屏兜底） |
| `KAKOMON_UNIVERSITIES` | 本屏改走 getUniversities()（无 mock 兜底，见决策 D），移除直接 import | **保留**（~10 屏共用 + mergeWithMock 装饰字段来源） |
| `DEMO_USER` | 保留（未登录 auth 兜底，与考试无关） | 保留 |

"删除模考相关所有 mock" 落到本屏 = **移除三个 import、改走后端**；data.ts 常量因跨屏共用保留。物理删除 KAKOMON_QUESTIONS/PAPERS 属所有消费屏切后端后的独立收尾，不在本次。

## 6. 影响文件清单

**DB**：`V1_4__questions_schema.sql`（唯一键降普通索引）。

**后端**：
- `web/question/PaperController.java`（list 加 majorId 入参）
- `service/question/PaperQueryService.java` + `impl/PaperQueryServiceImpl.java`（listByScope 加 majorId）
- `mapper/question/ExamPaperMapper.java` + `resources/mapper/question/ExamPaperMapper.xml`（findByScope 加 majorCode 条件 + 排序）

**前端**：
- `app/mock-exam.tsx`（重构：getPapers 驱动、左栏走 getUniversities、删内联开考/门禁、删 mock import）
- `app/exam-papers.tsx`（新建：多卷列表 + 门禁 + 跳 exam-session）
- `app/_layout.tsx`（注册 exam-papers）
- `src/api/papers.ts`（getPapers 传 majorId query）
- `app/exam-session.tsx`（确认 paperCode 驱动，多半不改）

## 7. 验收

- **后端**：`./mvnw compile` 通过；`/api/papers?universityId=todai&graduateSchool=info-sci&majorId=cs` 返回该专业全部卷；同 (year+subjectCode) 多卷可共存（唯一键放开后插入不报错）。
- **前端**：`npm run type-check` 通过；模考主页无 mock import；年度→科目→exam-papers→exam-session 三级下钻通；门禁在卷卡层生效；getPapers 空/失败显示空态而非 mock。
- **联调**（需后端 + MySQL/Redis）：种一组同 (专业+年度+科目) 多卷（如 `p-xxx-2024-math-1/-2`）验证 exam-papers 列多卷；点卷进 exam-session 正常做题。

## 8. 已知实现期决策点

1. **左栏 universities 数据获取方式**：`getUniversities()` 返回分页列表；本屏左栏按 targetSchools/browseSchools 的 universityId 取单校元数据。实现期确认用 `getUniversities()` 全量拉一次内存查，还是复用大学 Tab 已有的数据路径/store，避免重复请求。倾向：一次 `getUniversities()` 拿列表，内存 `find(id)`；accent 等经 mergeWithMock 已兜底。
2. **多卷 seed（联调用）**：现有 V1_5 只有单卷 `p-todai-2024-math`。联调验证多卷需另加同 (todai+info-sci+cs+2024+math) 的第二份卷 seed（如 `p-todai-2024-math-2`, sort_order 不同）。是否纳入本次 V1_5 或单独 seed 脚本，实现期定。
3. **exam-session 旧 `ids=` 路径**：确认移除 mock-exam 后是否还有其他入口依赖 `ids=` 拼接开考；若无，exam-session 可只认 paperCode（本 spec 不强制清理旧参数分支，避免扩面）。
