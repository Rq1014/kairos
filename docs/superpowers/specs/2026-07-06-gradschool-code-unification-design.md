# 研究科标识统一（第一期:全链路 code 化）设计

**日期：** 2026-07-06
**状态：** 已定稿,待实现
**背景 bug:** 个人资料页目标校研究科信息显示不全

---

## 1. 背景与根因

`user_target_school.grad_school_code` 存的是研究科**日文名**(如 `情报理工学系研究科`),但字典表 `grad_school` 用**英文短码**当 `code`(如 `info-sci`),日文名在 `name_jp` 列。后端 `UserServiceImpl:223` 用日文名去按 `code` 查字典 → `Total: 0` → 目标校研究科信息显示不全。

不一致现状(audit 摸清):
- **前端全用日文名**:`UNI_GRADS` 值、`UNI_MAJORS` 复合键(`todai::情报理工学系研究科`)、`KAKOMON_QUESTIONS`/`KAKOMON_PAPERS`/`DEMO_USER` 的 gradSchool。
- **后端混用**:`V1_2`(demo 用户目标校)用 code;`V1_5`(题库/试卷 seed)用日文名;`DictionaryServiceImpl.getMajors` 有「先 code 后 name_jp」兼容 shim。

## 2. 决策:统一到英文 code,分两期

- **第一期(本 spec):数据一致** —— 全链路 nameJp→code。
- **第二期(以后单独 brainstorm):数据源** —— 前端字典改从后端 dict API 拉取,`UNI_GRADS`/`UNI_MAJORS` 降为离线兜底,治本"字典前后端重复存"的维护痛点。

分两期理由:一次全做(数据源 + 标识)回归面过大(15+ 前端文件 + `UNI_MAJORS` 复合键 + `gradShort` 重写 + 数据迁移)。分两期每期自成可测可交付。

## 3. 关键事实（audit 结论）

- 后端字典 `grad_school` 有 62 行,与前端 `UNI_GRADS` 的 62 个研究科**完全对齐**,故第二期可行(前端切后端不丢数据)。
- **同一 code 跨校对应不同日文名**(已核实冲突):`engineering` → 东大「工学系研究科」/京大「工学研究科」/东工大「工学院」/九大「工学府」;`science`/`info-sci`/`info-science`/`economics`/`agriculture` 同样冲突。→ 显示映射**必须用复合键 `大学::code`**,不能扁平。
- 现有 `universities.ts` 已有 dict-API 桥接,但**故意返回 nameJp**(代码注释承认此 hack)——第二期改。

## 4. 第一期改动

### 4.1 前端数据（`src/mocks/data.ts`）
- `UNI_GRADS`:值从日文名数组 → **code 数组**(如 `todai: ['info-sci','engineering','science','economics','new-domain','integrated-culture']`)。
- `UNI_MAJORS`:复合键 `'todai::情报理工学系研究科'` → **`'todai::info-sci'`**。
- `KAKOMON_QUESTIONS`(26 题)/`KAKOMON_PAPERS`/`DEMO_USER.targetSchools` 的 `graduateSchool`/`gradSchool` → **code**。
- 新增 `export const GRAD_SCHOOL_NAMES: Record<string, string>` —— **复合键 `大学::code → 日文名`**(62 行,来自 V1_1 字典对照表)。

### 4.2 显示 helper（`gradShort`,`topic-study.tsx` + `mock-exam.tsx` 各一份）
签名从 `(code)` 改为 `(universityId, code)`:
```ts
function gradShort(universityId: string, code: string): string {
  if (!code) return '—';
  const name = GRAD_SCHOOL_NAMES[`${universityId}::${code}`] ?? code;
  const core = name.replace(/(研究科|学府|学院|研究院)$/u, '');
  return core.length > 5 ? core.slice(0, 5) : core || name;
}
```
所有调用处补 universityId 参数(`gradShort(e.universityId, e.gradSchool)` 等)。调用点本就持有 universityId,改动小。`normGrad` 默认值改为 `UNI_GRADS[universityId]?.[0]`(现在已是 code,逻辑不变)。

### 4.3 匹配逻辑（无需改）
`q.graduateSchool === activeEntry.gradSchool`、`accessPolicy.targetKey`、`browseSchoolsStore` 复合键——都是值对值比较,两边都变 code 后自然相等,逻辑不动。

### 4.4 后端
- `DictionaryServiceImpl.getMajors`:撤掉「先 `findByUniversityIdAndCode` 后 `findByUniversityIdAndNameJp`」的兼容 fallback,只按 code 查。（**唯一的后端代码改动**）
- `UserServiceImpl:223`（`findByUniversityIdAndCode(uni.getId(), e.getGradSchoolCode())`）:**不改代码** —— 迁移后 `grad_school_code` 已是 code,此处自然查得到。列在此处仅作「迁移后需验证它能查到」的检查点,不是改动项。

### 4.5 前端 API（`universities.ts`）
- `getUniversityMajors`:去掉「直接传 nameJp」的 hack 注释,`params.gradSchool` 现在是 code,直接传即可。
- **范围外(第二期)**:`getUniversity`/`getUniversityGradSchools` 仍返回 `nameJp` 作为 gradSchools 列表值——不影响目标校匹配,第二期字典源化时一起改。

### 4.6 数据迁移（`docs/05-database/sql/V1_6__gradschool_code_migration.sql`,新增）
用 JOIN `name_jp` 关联字典迁移(天然幂等,只匹配日文名行,已是 code 的行不动):
```sql
UPDATE user_target_school t
JOIN university u  ON u.code = t.university_code
JOIN grad_school g ON g.university_id = u.id AND g.name_jp = t.grad_school_code
SET t.grad_school_code = g.code;

UPDATE question q
JOIN university u  ON u.code = q.university_code
JOIN grad_school g ON g.university_id = u.id AND g.name_jp = q.grad_school_code
SET q.grad_school_code = g.code;

UPDATE exam_paper p
JOIN university u  ON u.code = p.university_code
JOIN grad_school g ON g.university_id = u.id AND g.name_jp = p.grad_school_code
SET p.grad_school_code = g.code;
```

### 4.7 SQL seed（`V1_5__seed_questions.sql`）
题库/试卷 seed 的 `grad_school_code` 从日文名(`情报理工学系研究科`)改成 code(`info-sci`),使全新环境执行 V1_0–V1_5 即正确;V1_6 只处理已存在的旧库。

## 5. 分阶段实现

1. **数据层**:`mocks/data.ts` —— UNI_GRADS 值 + UNI_MAJORS 键 + 题库/paper/demo gradSchool 全换 code + 新增 GRAD_SCHOOL_NAMES。
2. **显示 helper**:两处 `gradShort` 改签名 + 查复合键表;所有调用处补 universityId;`normGrad` 复核。
3. **后端**:撤 `DictionaryServiceImpl` shim。
4. **前端 API**:`universities.ts` `getUniversityMajors` 传 code。
5. **SQL**:`V1_5` seed 改 code;新增 `V1_6` 迁移。
6. **收尾**:type-check + lint + `./mvnw compile` + TASKS.md。

## 6. 验证

- **前端门禁**:`npm run type-check`(主)+ `npm run lint`。`gradShort` 改签名后,漏传 universityId 的调用点被 type-check 抓出——安全网。
- **后端门禁**:`./mvnw compile`。
- **功能验证**:无实时后端/DB 环境,以「type-check 抓全调用点 + 静态走查匹配逻辑(两边都 code → 相等成立)」为主;真机连后端跑通个人资料目标校显示、专题/模考按研究科筛选,标为待联调验证,不假称已连真。
- **V1_6 迁移**:SQL 写好但本环境无 DB 凭据,不执行,标为待联调环境执行。

## 7. 风险与对策

| 风险 | 对策 |
|---|---|
| 漏改某处仍用日文名 → 匹配失败 | `gradShort` 改签名强制 type-check 扫全调用点;audit 已列全触点 |
| `UNI_MAJORS` 复合键改了但某处仍拼日文名 key | 全局搜 `::` 拼接处逐一核对(audit 列了 8 处读取点) |
| 迁移 SQL 误伤已是 code 的行 | JOIN `name_jp` 天然幂等,只匹配日文名行 |
| 同 code 跨校日文名冲突导致显示错 | 显示映射用复合键 `大学::code`,不用扁平 |

## 8. 范围外（第二期及以后）

- 前端字典改从后端 dict API 拉取(第二期,单独 brainstorm)。
- `universities.ts` 的 `getUniversity`/`getUniversityGradSchools` 返回 nameJp 的桥接(第二期)。
- 任何 UI 布局/视觉改动。
