# Kakomon · Claude / Codex 开发分工指导书

**版本：** v1.0  
**日期：** 2026-05-14  
**用途：** 明确 Claude 与 Codex 的开发分工、交付顺序、接口边界和验收规则，确保前端、后端与系统架构可以真实协作完成。

---

## 一、总原则

Kakomon 的开发分工采用：

| 角色 | 主职责 | 不主导 |
|------|--------|--------|
| Claude | 前端体验、页面实现、视觉交互、组件细节 | 后端架构、数据库、计费安全、AI 扣费 |
| Codex | 系统架构、后端、数据库、API 契约、CI、集成验证 | 视觉风格主导、复杂页面审美决策 |

一句话原则：

> Claude 负责让产品“好用、好看、交互完整”；Codex 负责让系统“能跑、可测、安全、可维护”。

---

## 二、文档优先级

开发过程中如文档发生冲突，按以下顺序判断：

1. `docs/MVP_SCOPE.md`：决定 V1 做不做。
2. `docs/API_CONTRACT.md`：决定前后端接口字段和错误规则。
3. `docs/DATA_MODEL.md`：决定数据库表和持久化结构。
4. `docs/ARCHITECTURE.md`：决定服务边界、权限、计费、AI、安全。
5. `docs/TSD.md`：决定技术栈、目录结构、类型、状态管理。
6. `docs/PSD.md`：决定产品体验、页面内容、用户流程。
7. `docs/DEV_PLAN.md`：决定排期和任务顺序。
8. `TASKS.md`：记录当前执行状态。

Claude 和 Codex 都不得绕过 `API_CONTRACT.md` 自行发明接口字段。  
如果 Claude 发现前端需要新字段，先提出变更；由 Codex 判断是否进入 API 和 DB。

---

## 三、Claude 分工

Claude 主要负责前端和产品体验。

### 3.1 Claude 输入文档

Claude 开发前必须读取：

- `docs/PSD.md`
- `docs/MVP_SCOPE.md`
- `docs/TSD.md` 中的前端目录、类型、状态管理章节
- `docs/API_CONTRACT.md` 中相关接口响应示例
- `uploads/KAKOMON_CLAUDE_DESIGN_PROMPT_2026-05-05.md`
- `prototype/` 中已有原型文件

### 3.2 Claude 负责的代码区域

Claude 优先负责：

```text
app/
src/components/
src/constants/
src/api/client.ts     # axios 实例、基础拦截器、前端请求基础设施
src/hooks/            # 只写调用已定义 API 的 hooks
src/mocks/
src/store/            # 仅前端 UI 状态和轻量本地状态
src/types/ui.ts       # UI-only 类型，如导航参数、本地筛选器状态
assets/
```

Claude 不应主动修改：

```text
backend/
server/
database/
migrations/
scripts/import_*.*
docs/DATA_MODEL.md
docs/API_CONTRACT.md
docs/ARCHITECTURE.md
src/api/*.ts          # 具体 endpoint 封装由 Codex 定义契约后实现，client.ts 除外
src/types/domain.ts   # API/domain 类型变更需由 Codex 校验
```

如确实需要修改，应先提交变更建议，由 Codex 执行。

`src/api/` 和 `src/types/` 的细分规则：

| 文件范围 | 主责 | 说明 |
|----------|------|------|
| `src/api/client.ts` | Claude | axios 基础配置、baseURL、通用 interceptor，可由 Codex review |
| `src/api/auth.ts` / `questions.ts` / `forum.ts` 等 endpoint 文件 | Codex | 必须严格跟 `API_CONTRACT.md` 对齐 |
| `src/types/user.ts` / `question.ts` / `api.ts` 等 API/domain 类型 | Codex 校验，Claude 可消费 | 字段以 API 契约和数据模型为准 |
| UI-only 类型，如本地筛选器、导航参数、组件 props | Claude | 不进入 API/DB，可放在局部文件或 `src/types/ui.ts` |

### 3.3 Claude 前端任务

Claude 按以下顺序实现前端：

1. Phase 0 前端骨架
   - Expo Router 路由壳。
   - Bottom Tabs：学习 / 大学 / 论坛 / 我的。
   - 根 layout、Auth layout、空页面。
   - 基础 UI 组件：Button、Card、Chip、Badge、Icon、ProgressBar、Segmented、BottomSheet。

2. K1 账户与个人中心
   - 登录页、注册页。
   - ProfileHome。
   - Settings。
   - AI quota / Pro / Token 展示一致。
   - 目标校编辑入口调用 `PUT /users/me/target-schools`。

3. K3 过去问核心
   - StudyDashboard。
   - QuestionList。
   - SearchScreen。
   - QuestionDetail，必须包含 PSD 规定的 11 个段落。
   - AiContextSheet。
   - AiChat。
   - WrongBook。
   - ReferenceIndex。

4. K2 大学模块
   - UniversityList。
   - UniversityDetail。
   - Overview / Past Exams / Ratings / Professors / Forum tabs。
   - 教授详情只做基础信息和 `aiSummary: null` 的锁定占位。
   - 大学对比 V1 不实现真实功能。

5. K4 论坛模块
   - ForumHome。
   - ThreadDetail。
   - ComposeThread。
   - MaterialRequest 静态状态机。
   - GroupList 和 GroupDetail 静态展示，不做实时群聊。

6. 支付与通知前端
   - Paywall UI。
   - Billing status 展示。
   - Notifications 列表与已读操作。
   - 真实 IAP 只接入 Codex 提供的接口和库封装。

### 3.4 Claude 输出要求

每次 Claude 交付前端功能，必须给出：

- 修改文件列表。
- 对应任务 ID，例如 `F1-20`。
- 使用了哪些 API。
- 是否使用 mock。
- 已验证的屏幕尺寸，至少包含 `390x844`。
- 是否存在后端阻塞项。

### 3.5 Claude 验收标准

Claude 的前端交付必须满足：

- 页面不出现明显文字溢出。
- Bottom Nav 不遮挡底部 CTA。
- Free / Token / Pro 状态跨页面一致。
- Loading / Empty / Error 状态齐全。
- 所有按钮有明确交互反馈。
- 组件不直接调用 axios，只通过 `src/hooks` 或 `src/api`。
- 不出现未在 `API_CONTRACT.md` 定义的字段。

---

## 四、Codex 分工

Codex 主要负责系统架构、后端、数据模型、接口契约和集成验证。

### 4.1 Codex 输入文档

Codex 开发前必须读取：

- `docs/MVP_SCOPE.md`
- `docs/TSD.md`
- `docs/API_CONTRACT.md`
- `docs/DATA_MODEL.md`
- `docs/ARCHITECTURE.md`
- `docs/DEV_PLAN.md`
- `TASKS.md`

### 4.2 Codex 负责的代码区域

Codex 优先负责：

```text
backend/
server/
database/
migrations/
seeds/
scripts/
src/api/auth.ts
src/api/questions.ts
src/api/forum.ts
src/api/universities.ts
src/api/ai.ts
src/api/user.ts
src/hooks/            # 与 API 契约绑定的 hooks 可由 Codex 校准
src/types/            # API/domain 类型由 Codex 校验；UI-only 类型除外
.github/
package.json          # 后端/CI/依赖校准；Phase 0 前端初始化可由 Claude 主导
tsconfig.json         # 后端/CI/路径校准；Phase 0 前端初始化可由 Claude 主导
eas.json              # 发布配置由 Codex review；基础文件可由 Claude 创建
```

如果前端组件需要调整，Codex 可以做最小必要改动，但不主导视觉设计。

### 4.3 Codex 后端任务

Codex 按以下顺序实现后端：

1. Phase 0 工程基础
   - 确认后端运行时：Node.js 22 或 Python 3.12。
   - 建立项目骨架。
   - `/health` 接口。
   - 环境变量。
   - lint / type-check / test。
   - CI。

2. 数据库与 migration
   - 按 `DATA_MODEL.md` 建立 PostgreSQL schema。
   - 创建 `users`、`user_profiles`、`user_target_schools`。
   - 创建 questions / universities / forum / billing / AI 相关表。
   - 建立索引。
   - 准备 seed 数据。

3. Auth Service
   - 注册、登录、刷新、登出。
   - JWT Access / Refresh。
   - Refresh Token hash 存储。
   - 401 自动刷新兼容前端 interceptor。

4. Billing & Entitlement stub
   - `GET /billing/status`。
   - Pro 状态读取。
   - Token 余额读取。
   - 后台脚本手动设置 Pro / Token，用于前端测试。
   - 真实 IAP 延后到 Phase 3。

5. K1/K3 MVP API
   - `/users/me`
   - `/users/me/target-schools`
   - `/users/me/stats`
   - `/users/me/weak-points`
   - `/users/me/ai-quota`
   - `/questions`
   - `/questions/:id`
   - `/questions/:id/mastery`
   - `/questions/:id/related`
   - `/questions/wrong-book`
   - `/questions/knowledge-matrix`
   - `/ai/ask`
   - `/ai/chat/:sessionId`

6. K2/K4 API
   - `/universities`
   - `/universities/:id`
   - `/universities/grads/:id`
   - `/universities/majors`
   - `/universities/:id/reviews`
   - `/universities/:id/professors`
   - `/forum/threads`
   - `/forum/threads/:id`
   - `/forum/threads/:id/replies`
   - `/forum/groups`
   - `/forum/groups/:id/join`

7. AI Service
   - AI prompt 构造。
   - 免费额度检查。
   - Token 扣费。
   - Pro 绕过扣费。
   - SSE 流式输出。
   - 失败回滚。
   - ai_sessions / ai_messages 写入。

8. Phase 3 真实 IAP 与推送
   - 选择 `expo-iap` 或 RevenueCat。
   - Apple App Store Server API v2。
   - Server Notifications V2。
   - receipt 幂等验证。
   - Expo Push token 注册。
   - notifications 表与推送任务。

### 4.4 Codex 输出要求

每次 Codex 交付后端功能，必须给出：

- 修改文件列表。
- migration 文件名。
- 新增或变更的 API。
- 示例 request / response。
- 测试命令与结果。
- 是否影响 Claude 前端字段。
- 是否需要更新 `API_CONTRACT.md` 或 `DATA_MODEL.md`。

### 4.5 Codex 验收标准

Codex 的后端交付必须满足：

- 接口字段与 `API_CONTRACT.md` 一致。
- 数据表与 `DATA_MODEL.md` 一致。
- 权限和 Pro 判断只在后端完成。
- AI 扣费必须原子。
- 重复 IAP receipt 返回 200，不重复记账。
- 重复难度投票返回 409。
- 401 / 402 / 403 / 409 / 429 错误码符合契约。
- 有基础测试覆盖核心业务分支。

---

## 五、共同协作流程

### 5.1 每个功能的标准流程

每个功能按以下流程推进：

```text
1. 产品确认
   ↓
2. Codex 确认 API / DB / 权限边界
   ↓
3. Claude 根据契约实现前端页面和状态
   ↓
4. Codex 实现真实后端接口
   ↓
5. 前端从 mock 切换到真实 API
   ↓
6. 联调
   ↓
7. 验收
```

### 5.2 API 变更流程

任何 API 字段变更必须按顺序进行：

1. Claude 或 Codex 提出变更原因。
2. Codex 判断是否需要 DB 变更。
3. 更新 `API_CONTRACT.md`。
4. 如需持久化，更新 `DATA_MODEL.md`。
5. Codex 修改后端和类型。
6. Claude 修改前端消费逻辑。
7. 双方联调。

禁止直接在前端临时写新字段并等待后端“补上”。

### 5.3 Mock 使用规则

| 阶段 | Mock 规则 |
|------|----------|
| Phase 0 | Claude 可以使用 `src/mocks/data.ts` 完成页面 |
| Phase 1 初期 | 前端可继续 mock，但字段必须来自 API 契约 |
| Phase 1 中后期 | K1/K3 核心改接真实 API |
| Phase 2 后 | 新模块允许先 mock，验收前必须接真实 API |

Mock 数据不得出现 API 契约中不存在的字段。

### 5.4 Git 与任务记录规则

每个多步骤任务开始前：

1. 读取 `TASKS.md`。
2. 新增任务段。
3. 写入子任务。

每完成一个子任务：

1. 不修改原任务行。
2. 在该行下追加完成记录。
3. 写明时间和备注。

每次提交建议格式：

```text
feat(study): add question detail screen
feat(api): implement question detail endpoint
fix(auth): refresh token on 401
docs(contract): update target schools payload
```

---

## 六、Phase 0–4 执行分工

### Phase 0：工程脚手架 + 设计系统

| 任务 | Claude | Codex | 验收 |
|------|--------|-------|------|
| Expo 项目初始化 | 主导 package / tsconfig / babel / app.json / eas.json 的前端工程初始化 | 做 type-check / build 配置 review | `npm run type-check` 通过 |
| 路由壳 | 主导 app/ 路由与 tabs | 检查目录符合 TSD | 4 个 Tab 可切换 |
| UI 组件库 | 主导 | 只做类型/可复用性 review | Story 或测试页面可展示 |
| API client | 主导 `src/api/client.ts`（axios / baseURL / 通用 interceptor） | 校验错误码和 token 刷新规则 | 401 / 402 处理正确 |
| mock 数据 | 主导迁移原型数据 | 校验字段契约 | mock 与类型一致 |
| CI | 不主导 | 主导 | lint / type-check / test 可跑 |

### Phase 1：K1 + K3 MVP

| 模块 | Claude | Codex | 验收 |
|------|--------|-------|------|
| Auth | 登录/注册 UI | auth API / JWT / refresh | 可注册登录退出 |
| Profile | 个人页与设置页 | user API / stats / weak-points | 数据真实返回 |
| Target Schools | 两步选校 UI | `user_target_schools` + PUT API | 研究科/专攻可保存 |
| Question List | 列表/筛选 UI | `/questions` 分页筛选 | 年份/科目/学校筛选可用 |
| Question Detail | 11 段核心页面 | `/questions/:id` 完整数据 | 页面信息完整 |
| Mastery | 三态控件 | user_mastery / wrong_book 更新 | 弱点地图联动 |
| AI Ask | AI Sheet / Chat UI | quota / token / session / Claude API | Free/Token/Pro 正确扣费 |
| Billing stub | Paywall 展示 | `/billing/status` | 可手动切换 Pro 测试 |

### Phase 2：K2 + K4

| 模块 | Claude | Codex | 验收 |
|------|--------|-------|------|
| University List | 列表、搜索、筛选 UI | `/universities` | 14 所大学可查 |
| University Detail | 详情 Tabs | university detail API | 概览/过去问/评分/教授可读 |
| Professor Basic | 基础详情页 | professor API，aiSummary null | AI 摘要锁定占位 |
| Forum Home | 帖子列表和 tabs | `/forum/threads` | 类型筛选可用 |
| Thread Detail | 回复和采纳 UI | replies / accept / upvote API | 回复、点赞、采纳可用 |
| Compose | 发帖 UI | POST thread | 发帖后列表更新 |
| Study Groups | 静态展示 | groups list / join | 不做实时群聊 |

### Phase 3：AI 增强 + IAP + 推送

| 模块 | Claude | Codex | 验收 |
|------|--------|-------|------|
| SSE AI | 流式消息 UI | SSE endpoint | 断线/超时可处理 |
| IAP UI | Paywall 真实购买入口 | expo-iap 或 RevenueCat + receipt 验证 | 沙箱购买可更新 Pro |
| Subscription Sync | 展示到期/状态 | Apple Notifications V2 | 续订/取消/退款同步 |
| Notifications | 通知列表和跳转 | push token / scheduled jobs | 站内通知和推送可触发 |
| Reference Index | 书目和章节 UI | reference APIs | 章节可跳关联题 |

### Phase 4：性能 + 上架

| 模块 | Claude | Codex | 验收 |
|------|--------|-------|------|
| 移动端适配 | 修 UI 溢出和遮挡 | 辅助检查 | 390x844 / 大屏通过 |
| 列表性能 | 替换大列表组件 | API 分页优化 | 长列表不卡顿 |
| Bundle 优化 | 移除无用前端资源 | 分析 bundle | JS gzip 达标 |
| App Store 准备 | 截图页面/文案配合 | EAS submit / config | TestFlight 可安装 |
| 全链路测试 | 走用户流程 | 写测试和修 bug | K1–K4 + AI + IAP 通过 |

---

## 七、交接模板

### 7.1 Claude 交给 Codex

```markdown
## 前端交接

功能：
涉及页面：
使用 API：
当前 mock 字段：
需要后端补齐：
阻塞点：
截图/验证尺寸：
```

### 7.2 Codex 交给 Claude

```markdown
## 后端交接

功能：
接口：
Request：
Response：
错误码：
权限规则：
测试数据：
前端接入注意：
```

---

## 八、最终集成验收清单

上线前必须完成：

- [ ] `TASKS.md` 无当前功能未完成子任务。
- [ ] K1 登录、注册、刷新、退出可用。
- [ ] 目标校、研究科、专攻可保存并恢复。
- [ ] K3 题目详情 11 段完整。
- [ ] 标记掌握状态后错题本和弱点地图更新。
- [ ] Free / Token / Pro 权限一致。
- [ ] AI 免费次数和 Token 扣费正确。
- [ ] L3 关联题 Free 截断、Pro 全量。
- [ ] 论坛发帖、回复、点赞、采纳可用。
- [ ] 通知列表和已读可用。
- [ ] IAP 沙箱购买可更新 Pro。
- [ ] 390x844 无明显文字溢出。
- [ ] API 错误码与 `API_CONTRACT.md` 一致。
- [ ] 数据库 migration 可从空库完整执行。
- [ ] CI 通过。

---

## 九、推荐执行口径

实际开发时建议这样安排：

1. **Codex 先行 1–2 天**：建 API contract stub、DB schema、auth/billing stub。
2. **Claude 并行做前端壳和核心页面**：先用 mock，但字段必须对齐契约。
3. **Phase 1 中段开始联调**：K1/K3 核心尽早从 mock 切真实 API。
4. **所有 Pro / Token / AI 功能由 Codex 定义后端规则**：Claude 只展示结果和状态。
5. **每个 Phase 结束必须做一次文档回写**：实际实现与文档不一致时，以代码和验收为准更新文档。

### 单人 / 单 Agent 开发口径

如果开发者在同一个 session 中用 Claude 做前端、再用 Codex 做后端，或者暂时只使用一个 Agent，不需要机械等待“Codex 先行 1–2 天”。推荐顺序改为：

1. 先用最小 API stub 固定字段：可以由 Claude 临时创建 mock/stub，但字段必须来自 `API_CONTRACT.md`。
2. 先跑通 Expo shell、UI 组件和核心页面，保证页面结构可见。
3. Codex 接手时优先把 stub 替换为真实 API、DB migration 和测试。
4. 每替换一个真实接口，就立即让前端从 mock 切到 API 并做一次联调。
5. 等 K1/K3 核心接口稳定后，再删除或降级相关 mock，避免 mock 长期成为事实标准。

单人场景的判断规则：

| 场景 | 允许做法 | 必须补做 |
|------|----------|----------|
| 前端需要字段但后端未实现 | 先在 mock 中使用契约字段 | 后续由 Codex 落 API/DB 或明确移除 |
| Claude 临时创建 `src/api/client.ts` | 允许 | Codex review interceptor、错误码和 token 规则 |
| Claude 临时创建 API endpoint 文件 | 仅限 stub | Codex 接管并对齐 `API_CONTRACT.md` |
| UI-only 类型需要新增 | Claude 可直接新增 | 不得污染 API/domain 类型 |

最终职责边界：

> Claude 是前端产品实现者；Codex 是系统架构和后端实现者；`API_CONTRACT.md` 是两者之间的合同。
