# Kairos-kakomon · 架构与代码优化建议

> 版本：v1.0  
> 日期：2026-06-18  
> 范围：移动端（Kairos-kakomon）+ 后端（Kairos-kakomon-server）的架构盘点 + 冗余清理 + 优化路线  
> 性质：建议清单（不含实施）。每条都标注了**风险等级**、**收益**、**位置**，按优先级排序，便于按需取用。

---

## 一、总体结论

| 维度 | 现状 | 评价 |
| --- | --- | --- |
| 前端形态 | Expo SDK 54 + expo-router 6 + TanStack Query 5 + Zustand 5 | 主流栈，无替换必要 |
| 后端形态 | Spring Boot 3 + MyBatis + MySQL 8 + Redis | 主流栈，无替换必要 |
| 数据契约 | `docs/02-architecture/API-contract.md` + `data-model.md` 已存在但 Postgres → MySQL 切换未完全反映 | **需对齐** |
| 文档分散 | 原本散落在 4 处 (`/`, `Kairos-kakomon/`, `Kairos-kakomon/docs/`, `Kairos-kakomon-server/`) | 已整理至 `docs/01~07` |
| 主要技术债 | 前端 mock/store 重复、prototype 未隔离；后端 Bean / mapper / 配置死代码、明文密钥 | **可清理** |

**指导原则**：本次优化以「**边际收益最大、改动风险最小**」为标准，不做大刀阔斧重构。

---

## 二、前端优化建议（Kairos-kakomon）

### P0 — 立刻可做（零风险）

| # | 问题 | 位置 | 建议 |
| --- | --- | --- | --- |
| F1 | `studyStore.ts` 全文件无任何 import 引用 | `src/store/studyStore.ts` | 直接删除 |
| F2 | `demoAuth.ts` 内的 `DEMO_ACCESS_TOKEN/REFRESH_TOKEN` 无引用 | `src/constants/demoAuth.ts` | 直接删除 |
| F3 | `package.json` 声明但全项目零引用：`zod`、`react-hook-form`、`react-dom`、`@gorhom/bottom-sheet` | `package.json` | `npm uninstall` 这 4 个包 |
| F4 | `metro.config.js` 未排除 `prototype/`，可能被 metro 解析 | `metro.config.js` | 加 `config.resolver.blockList = [/prototype\/.*/]` |

> 收益：减少包体、安装时间、首次构建时间，无功能影响。

### P1 — 中风险，建议本迭代内完成

| # | 问题 | 位置 | 建议 |
| --- | --- | --- | --- |
| F5 | `topic-study.tsx`(563 行) 与 `mock-exam.tsx`(655 行) 重复定义 `RailEntry` / `railKey` / `normGrad` 与“侧边轨道（rail）”渲染管理逻辑 | `app/topic-study.tsx`, `app/mock-exam.tsx` | 抽出 `src/components/study/SchoolRail.tsx` 或自定义 hook `useSchoolRail()`，两屏复用 |
| F6 | 5 个 store（`browseSchoolsStore`、`favoritesStore`、`onboardingStore`、`themeStore`、`attemptStore`）各自手写 AsyncStorage 持久化 | `src/store/*` | 用 zustand 官方 `persist` 中间件，或抽统一的 `createPersistedStore()` helper，预计减少 ~50 行样板 |
| F7 | `src/mocks/data.ts`（783 行 barrel 文件）被 30+ 屏幕直接 import，metro 无法 tree-shake | `src/mocks/data.ts` | 拆分为 `mocks/universities.ts`/`mocks/questions.ts`/`mocks/forum.ts`/`mocks/attempts.ts`；长期目标是只在 api 层 fallback 路径里用 |
| F8 | 9 个 store 中 `onboardingStore`/`themeStore`/`uiStore`/`adStore` 仅放 1–2 个字段 | `src/store/*` | 合并为单个 `appStore` 或 `useAppPrefs()`，减少 hook 注册数 |

### P2 — 改造性较大，按需

| # | 问题 | 位置 | 建议 |
| --- | --- | --- | --- |
| F9 | `app/` 下 26 个屏幕扁平化挂在根目录，未按业务分组 | `app/*.tsx` | 推进 expo-router 的 `(group)` 写法（如 `app/(study)/topic-study.tsx`），仅做目录调整，不破坏路由 URL |
| F10 | UI 字符串中文/日文/英文混用，无 i18n 框架 | 全屏幕 | 引入 `i18n-js` 或 `react-i18next`，从最常见的 5 个屏幕开始迁移 |
| F11 | `prototype/` 下 10 个 jsx 已是历史 v0 原型，逻辑早已转 RN | `prototype/` | 将整个目录搬到 `docs/03-frontend/v0-prototype/` 归档；同时保留 README 说明用途 |

---

## 三、后端优化建议（Kairos-kakomon-server）

### P0 — 安全 / 死代码（必须处理）

| # | 问题 | 位置 | 建议 |
| --- | --- | --- | --- |
| B1 | `application.yml` 明文 MySQL 密码、明文 JWT secret 进入仓库 | `application.yml:15`, `:67` | 改为 `${DB_PASSWORD}` / `${JWT_SECRET}` 占位，加 `.env` / Vault；同时 git 历史里旧版本应轮换 |
| B2 | `application.yml:5-11` 排除了 Mongo/ES 自动配置，但 `pom.xml` 根本没引这些依赖 | `application.yml` | 删除无效 exclude 行 |
| B3 | `RedisConfig.java:53-66` 的 `RedisTemplate<String, Object>` Bean 全项目无注入点（仅用 `StringRedisTemplate`） | `config/RedisConfig.java` | 删除该 Bean |
| B4 | Mapper 死代码：`UserCredentialMapper.updatePassword`（实际走 `insert` ON DUPLICATE）、`updateFailedCount`（走 Redis）、`UserMapper.updateStatus`（注销走 `softDelete`） | `mapper/auth/*.java` + `resources/mapper/auth/*.xml` | 删除接口方法 + xml 块 |
| B5 | `CacheKeys.rateLimit()` + `application.yml:81-83` 的 `auth.rate-limit.*` 配置无任何实现/调用方 | `common/constant/CacheKeys.java`, `application.yml` | 要么真做（Redis 滑动窗口 + interceptor），要么先删除空壳避免误导 |
| B6 | `pom.xml:64` `commons-lang3` 全项目零引用 | `pom.xml` | 删除该依赖 |

### P1 — 可合并 / 可下沉

| # | 问题 | 位置 | 建议 |
| --- | --- | --- | --- |
| B7 | `IdentityType.fromString()` + null 判断 + throw 在 `LoginServiceImpl`/`BindingServiceImpl`/`VerifyCodeServiceImpl` 共重复 7 次 | `service/auth/impl/*` | 在 `IdentityType` 上加 `static IdentityType requireValid(String)` 统一抛 `BizException` |
| B8 | `BindingServiceImpl.setPassword()` 行 101-108 手写密码强度 if/throw | `service/auth/impl/BindingServiceImpl.java` | 把 `@Pattern`/`@Size` 注解放到 `SetPasswordRequest`，由 `@Valid` 触发校验 |
| B9 | `UniversityResponse` 与 `UniversityDetailResponse` 8 个字段完全重复，仅后者多 `gradSchools` | `model/response/dict/*.java` | `UniversityDetailResponse extends UniversityResponse` 或抽 `BaseUniversityResponse`，减约 40 行样板 |
| B10 | `sms.provider` / `mail.from` YAML 配置无 `@ConfigurationProperties` 类绑定 | `application.yml:86-90` | 添加 `SmsProperties` / `MailProperties`（与现有 `JwtProperties`/`PasswordProperties` 一致风格） |
| B11 | `UserService.findByUserNo()` 暴露但无 controller 调用 | `service/user/UserService.java`、`UserServiceImpl.java:112` | 标记 package-private 或加注释说明仅内部使用 |

### P2 — 可选

| # | 问题 | 位置 | 建议 |
| --- | --- | --- | --- |
| B12 | `notify` 模块只接了 `LogMailSender` / `LogSmsSender`（仅日志输出，无真实通道） | `service/notify/impl/*` | 上线前接入真实 SMTP / 短信网关，并在 `application.yml` 用 spring profile 切换 |
| B13 | controller 层手动 `@Valid` 与 `if + throw BizException` 并存 | `web/auth/*` | 统一改 `@Valid` + 全局异常映射；保留极少数业务校验仍可在 service |

---

## 四、跨端 / 协作类建议

### 数据契约一致性（重要）

- 前端 `docs/02-architecture/data-model.md` 写的是 **PostgreSQL 16**，后端 `docs/05-database/sql/V1_0__init_schema.sql` 实际是 **MySQL 8**，需选定一份并同步另一份。  
  建议：以后端 SQL 为准，将 `data-model.md` 标注为 v2.0 版本并同步表结构。

- `docs/02-architecture/API-contract.md` 与后端 `web/auth`、`web/user`、`web/dict` controller 实际签名是否对齐，建议引入 OpenAPI（springdoc-openapi-ui）自动生成 swagger 文档，避免文档漂移。

### Mock 与真实 API 的切换

- 前端目前直接 import `src/mocks/data.ts`，没有「mock 模式开关」。  
  建议在 `src/api/client.ts` 增加 `USE_MOCK = process.env.EXPO_PUBLIC_USE_MOCK === 'true'`，让屏幕代码不感知 mock，统一在 api 层 fallback。这条已和 F7 联动。

### 文档与协作

- `Kairos-kakomon/CLAUDE.md`、`Kairos-kakomon/TASKS.md`、`Kairos-kakomon-server/HELP.md` 是各自项目根的运行时/约定文件，**保留原位**；归档版已 cp 至 `docs/07-collaboration/` 与 `docs/04-backend/`。
- 旧 `Kairos-kakomon/docs/` 目录已清空并删除，所有内容入 `docs/`。

---

## 五、实施建议路线

把上述 P0/P1 拆成 3 个小 PR：

**PR-1（前端清理）** — F1+F2+F3+F4：删未引用文件、卸 4 个未使用依赖、metro blockList。预计 < 30 行变更，无回归风险。

**PR-2（后端清理）** — B1+B2+B3+B4+B5+B6：密码外部化、删死 Bean / mapper / 依赖、决定 rate-limit 是删是做。预计 < 80 行变更（不含 .env 文件）。

**PR-3（小型重构）** — F5（抽 SchoolRail）+ B7（IdentityType.requireValid）+ B9（响应类继承）。每个独立可回滚。

P2 可放到下一个里程碑。

---

## 六、参考

- 本报告依据 2026-06-18 的代码状态生成。各条目都用 `grep -r` / 文件读取做了证据校验。
- 详细审计原文请见同级或上下游开发者的本地协作记录；本文是对其的去重整理与排序版本。
