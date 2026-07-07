# 研究科标识统一 · 第二期（前端字典数据源化）设计

- **日期**: 2026-07-07
- **承接**: [第一期设计](2026-07-06-gradschool-code-unification-design.md) §8 范围外
- **状态**: 设计已定稿，待用户复核 → writing-plans

## 1. 背景

第一期已把全链路 `gradSchool` 从日文名统一为英文 code，前端用静态字典
（`UNI_GRADS` / `UNI_MAJORS` / `GRAD_SCHOOL_NAMES` + `gradName()`）做 code→显示名
和选择器数据源。但字典仍是**前端硬编码**：新增一所学校/研究科要同时改后端
（`grad_school` 表 + seed）**和**前端 `mocks/data.ts` 两处，易漂移。

后端 dict API 第一期已完全就绪：

- `GET /api/dict/universities/tree` — 一次返回完整大学→研究科→专业三级树，
  每个节点带 `id`(=code) + `nameJp` / `label` / `short` 等字段。原始注释即写明
  「适合移动端启动后填充选择器」。
- `GET /api/dict/version` — 轻量版本号，客户端可缓存，版本变更时主动重拉。

第二期的目标就是让前端字典**以后端为唯一数据源**，静态字典降为离线 seed 兜底。

## 2. 目标与范围

**目标**：前端研究科/专业列表、研究科显示名改从后端 tree 拉取 + 缓存；
静态字典仅作首次冷启动/无网络的 seed 兜底。治本「新增学校改两处」的痛点
——以后只改后端一处，老用户下次联网自动刷新。

**范围内**：

1. 新建 `src/api/dict.ts`：封装 `/universities/tree`、`/version`，把 tree 拍平为规范化字典。
2. 新建 `src/store/dictStore.ts`（zustand + AsyncStorage）：启动 hydrate、三段式渐进
   （seed → cache → network）、version 失效检查；对外暴露与静态字典同签名的同步 selector。
3. 8 个消费点改为从 dictStore 读：
   `EditTargetSheet`、`app/topic-study`、`app/mock-exam`、`app/edit-profile`、
   `app/(auth)/onboard-profile`、`app/search`、`app/questions/[id]`、`app/(tabs)/study/index`。
4. `universities.ts` 详情页桥接顺带修正第一期 `.map(g => g.nameJp)` 的 code 丢失 hack。
5. 静态字典保留为 seed，加注释标注来源与「勿手动同步后端」。

**范围外**：

- 后端任何改动（dict API 已就绪）。
- `user.targetSchools` 数据结构（**不变**，仍存 `universityId + gradSchool(code)`；
  dictStore 只负责 code→显示名 与 选择器列表）。
- UI 布局 / 视觉改动。
- KAKOMON_UNIVERSITIES（大学列表本身）改数据源——本期只做研究科/专业字典。

## 3. 架构

### 3.1 dictStore 数据结构

内存里维护一份「规范化字典」，形状与现有静态字典**逐一对应**，让消费点改动最小：

```ts
// src/store/dictStore.ts
interface DictState {
  gradsByUni: Record<string, string[]>;              // ≙ UNI_GRADS
  majorsByKey: Record<string, MajorOption[]>;         // ≙ UNI_MAJORS，键 `uni::gradCode`
  gradNameMap: Record<string, string>;                // ≙ GRAD_SCHOOL_NAMES，键 `uni::gradCode`
  version: number;                                    // 已加载数据的版本号
  isHydrated: boolean;                                // 首段 seed 填充完成标志
  source: 'seed' | 'cache' | 'network';              // 当前数据来源（调试用）
  hydrate: () => Promise<void>;
}
```

### 3.2 对外 selector（普通函数，非 hook，同步返回）

```ts
export function dictGradName(uni: string, code: string): string;       // 替代 gradName()
export function dictGrads(uni: string): string[];                      // 替代 UNI_GRADS[uni] ?? []
export function dictMajors(uni: string, gradCode: string): MajorOption[]; // 替代 UNI_MAJORS[key] ?? []
```

- 内部 `useDictStore.getState()` 读当前快照；快照缺该键时回退静态 seed。
- 因 seed 在 hydrate 第一步已同步填入 store，**调用方永远拿到同步值**，
  无需把散落 JSX 里的 `gradName()` 调用改成 async/hook。
- 空值兜底内建（`dictGrads` 缺失返回 `[]`，`dictMajors` 同理），消费点不再写 `?? []`。

### 3.3 列表重渲订阅

selector 是纯函数不订阅 store。含**选择器列表**的文件
（EditTargetSheet / topic-study / mock-exam / edit-profile / onboard-profile）
在组件顶部加一行 `const dictVersion = useDictStore(s => s.version);`
——network 段刷新 version 时触发这些列表重渲。仅显示单个研究科名的 chip/副标题
（questions/[id]、study/index）不需要订阅，值到位即可。

## 4. 数据流与 hydration 生命周期

`_layout.tsx` 顶层与现有 `useBrowseSchoolsStore.getState().hydrate()` 并列加一行
`useDictStore.getState().hydrate()`。**不** gate UI 渲染（不加进 `isHydrated` 渲染门）。

```
dictStore.hydrate():
  1. 立即用静态 seed 填充 store（source='seed', isHydrated=true）→ 选择器即刻可用，永不空屏
  2. 读 AsyncStorage 缓存：命中则覆盖 store（source='cache'）
  3. fire-and-forget 拉 /api/dict/version：
       version > 本地 → 拉 /universities/tree → 规范化 → 覆盖 store + 写缓存
                        （source='network'，version 变更触发列表订阅重渲）
       version == 本地 → 不动
       任一步失败 → 保持 cache/seed，静默降级，不弹错
```

三段式渐进：seed（同步，永不空）→ cache（上次后端数据）→ network（最新），
每段都是完整可用字典，后到覆盖先到。

### 4.1 tree → 规范化映射（`src/api/dict.ts`）

```
tree.universities[]                       →（遍历）
  ├─ .gradSchools[].id (code)             → gradsByUni[uniCode].push(code)
  ├─ .gradSchools[].nameJp                → gradNameMap[`${uni}::${code}`] = nameJp
  └─ .gradSchools[].majors[]              → majorsByKey[`${uni}::${code}`] =
                                              [{ id, label, short, desc }...]
```

tree 节点字段已齐全（`id`/`nameJp`/`majors[].label`/`.short`/`.desc`），直接拍平。

## 5. 消费点改造模式（统一）

```diff
- import { gradName, UNI_GRADS, UNI_MAJORS } from '@/mocks/data';
+ import { dictGradName, dictGrads, dictMajors } from '@/store/dictStore';
```

| 旧 | 新 |
|---|---|
| `gradName(uid, code)` | `dictGradName(uid, code)` |
| `UNI_GRADS[uid] ?? []` | `dictGrads(uid)` |
| `UNI_MAJORS[\`${uid}::${grad}\`] ?? []` | `dictMajors(uid, grad)` |

- `mock-exam` / `topic-study` 内私有 `gradShort()` 改为调 `dictGradName` 再截断。
- 5 个含选择器列表的文件加 `useDictStore(s => s.version)` 订阅。
- `universities.ts` 第 ~205 行 `.map(g => g.nameJp)` 改为保留 code，
  显示名走 `dictGradName`，消除第一期遗留注释。

## 6. 错误处理

- version / tree 请求失败 → 静默降级到 cache/seed，fire-and-forget catch，不打扰用户。
- tree 结构异常（缺字段）→ 规范化时跳过坏节点，不整体丢弃。
- AsyncStorage 读/写失败 → catch 吞掉，退回 seed。
- 后端返回空 tree → 不覆盖已有 seed/cache（保护性判断：items 为空则跳过）。

## 7. 分阶段实现

1. **API 层**：`src/api/dict.ts` — `fetchDictVersion()` / `fetchDictTree()` + `normalizeTree()`。
2. **Store 层**：`src/store/dictStore.ts` — state + hydrate 三段式 + 3 个 selector。
3. **接线**：`_layout.tsx` 加 `dictStore.hydrate()`。
4. **消费点**：8 文件按 §5 模式替换（先选择器密集 3 文件，再其余 5 文件）。
5. **收尾**：`universities.ts` code 保真；`mocks/data.ts` 加 seed 注释；type-check + lint + 静态走查 + TASKS.md。

## 8. 验证（无测试运行器，门禁靠以下）

1. `npm run type-check` EXIT=0（selector 签名与 MajorOption 类型对齐，漏改被抓）。
2. `npm run lint` 0 error。
3. 静态走查：grep 确认 8 文件无残留从 `@/mocks/data` 的字典 import；
   `dictGrads`/`dictMajors`/`dictGradName` 覆盖全部旧调用点。
4. 真机/模拟器人工验证（**待联调环境**，本环境无后端凭据 + 无模拟器）：
   - 选校流程（EditTargetSheet 研究科/专业下拉）从后端 tree 出数据；
   - 专题学习 / 模考左栏研究科显示名正确；
   - 题目详情 chip 显示名正确；
   - 断网启动仍能用 seed 出选择器；
   - 后端新增一所研究科后，重启 App 联网能拉到（version 递增验证）。

## 9. 风险与对策

| 风险 | 对策 |
|---|---|
| selector 改同步函数后某处期望响应式更新却没订阅 → 列表不刷新 | 5 个列表文件显式 `useDictStore(s => s.version)` 订阅；chip 类无需 |
| seed 与后端 code 不一致（第一期后又改过后端）→ 显示回退 code | seed 只兜首次冷启动；联网后 network 段覆盖为准；接受首帧短暂用 seed |
| tree 数据量大 → 启动拉取慢 | version 门控，仅版本变化才拉；不 gate UI，后台刷新无感 |
| AsyncStorage 缓存与新版本 schema 不兼容 | 缓存带 version 字段，version 不匹配即丢弃重拉 |
| 后端 tree 某研究科无 majors → 专业层空 | `dictMajors` 返回 `[]`，消费点已有空态处理（第一期沿用） |

## 10. 范围外（以后）

- KAKOMON_UNIVERSITIES 大学列表数据源化。
- dict 增量更新 / 局部刷新（当前全量覆盖已足够）。
- 后台管理端维护字典的 UI。
