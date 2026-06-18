# TRD · 账号注销（设置 → 账号安全 → 注销账号）

| 项目 | 内容 |
| --- | --- |
| 版本 | v0.1 / 2026-06-18 |
| 范围 | 我的页 → 设置 → 账号安全 新增「注销账号」入口；点击 → 二次确认弹框 → 真正注销 → 返回登录页 |
| 端 | 前端 RN（Kairos-kakomon）+ 后端 Spring Boot（Kairos-kakomon-server） |
| 关联模块 | `app/account-security.tsx` / `app/account-security/deactivate.tsx`（新）/ `UserController` / `UserService` / `LoginService` |

---

## 1. 需求摘要

1. 在「我的 → 设置 → 账号安全」列表底部新增一行 **注销账号**（红色文案）。
2. 点击后弹出系统级 Alert：「注销账号则删除账号所有数据，是否继续注销」，按钮：**继续注销 / 取消**。
3. 用户点 **继续注销** 后：
   - 调用后端注销接口；
   - 后端把当前用户置为 `DELETED` 软删除态，作废所有 token；
   - 前端清除本地登录态，跳回登录页，并 toast 提示「账号已注销」。
4. 体验目标：注销后**同一邮箱/手机号**重新走验证码登录会被识别为新账号（旧账号身份释放）。

> 不在本期范围：人脸/二次密码确认、注销冷静期、客服撤销注销、导出数据。

---

## 2. 信息架构与交互

### 2.1 入口位置

`app/account-security.tsx` 现有 4 行：邮箱 / 手机号 / 第三方账号 / 登录密码。

新增第 5 行（独立分组放底部，视觉与「退出登录」类似的破坏性操作风格）：

```
分组「账号操作」
└─ 注销账号                        > （红字、无 value）
分组下提示文案：
注销账号会清空所有学习数据，且无法恢复。
```

理由：放在原 4 行的同一卡片内会与「绑定信息」混淆；单独成组+破坏性红色，视觉上和 settings 页的「退出登录」按钮等价。

### 2.2 交互流程

```
[账号安全] → 点击「注销账号」
    ↓
[Alert 弹框]
   标题   注销账号
   正文   注销账号则删除账号所有数据，是否继续注销
   按钮   [取消]   [继续注销]（destructive 红色）
    ↓ 点继续注销
[Loading 全屏遮罩]（防重入；HTTP 请求过程禁止再次点击）
    ↓ 成功
清空 SecureStore + authStore → router.replace('/(auth)/login') → toast「账号已注销」
    ↓ 失败
错误码 1xxxx：留在当前页 + Alert 显示后端 message
   网络异常：留在当前页 + Alert「网络异常，请稍后重试」
```

### 2.3 文案规范

| 元素 | 文案 |
| --- | --- |
| 列表行标题 | 注销账号 |
| 列表行下灰字 | 注销账号会清空所有学习数据，且无法恢复。 |
| Alert 标题 | 注销账号 |
| Alert 正文 | 注销账号则删除账号所有数据，是否继续注销 |
| Alert 主按钮 | 继续注销 |
| Alert 次按钮 | 取消 |
| 成功 toast | 账号已注销 |
| 失败 Alert（默认） | 网络异常，请稍后重试 |

---

## 3. 前端实现要点

### 3.1 新增/修改文件

- `app/account-security.tsx`：在底部新增「账号操作」分组，第一行「注销账号」，红色，点击弹 Alert（用 `Alert.alert` 即可，无需新页面）。
- `src/api/auth.ts`：新增 `deactivateAccount()` API 封装。
- `src/store/authStore.ts`：复用 `clearAuth`，无新增 state。
- 不新增独立路由；如后续要支持「最终账号注销条款页」，再新建 `app/account-security/deactivate.tsx`，本期不做。

### 3.2 Alert 实现伪码

```tsx
import { Alert } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { deactivateAccount } from '@/api/auth';
import { TOKEN_KEY, REFRESH_TOKEN_KEY } from '@/api/client';

const handleDeactivate = () => {
  Alert.alert(
    '注销账号',
    '注销账号则删除账号所有数据，是否继续注销',
    [
      { text: '取消', style: 'cancel' },
      {
        text: '继续注销',
        style: 'destructive',
        onPress: async () => {
          if (busy) return;
          setBusy(true);
          try {
            await deactivateAccount();
            await Promise.all([
              SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => {}),
              SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY).catch(() => {}),
            ]);
            clearAuth();
            router.replace('/(auth)/login' as any);
            // toast：账号已注销（统一 toast 工具或 Alert 兜底）
          } catch (e: any) {
            Alert.alert('注销失败', e?.message ?? '请稍后重试');
          } finally {
            setBusy(false);
          }
        },
      },
    ],
  );
};
```

### 3.3 防误点

- 按钮为系统级 destructive 样式，自带二次确认语义。
- 若后续要再加一道「输入「注销」二字」复核，可单独建 `app/account-security/deactivate.tsx`，本期不做。
- 注销 RPC 期间禁用按钮（`busy` state），避免重复请求。

### 3.4 与滑动续签 / 多端登录的关系

- 注销请求成功后，后端会作废 access/refresh，所以**别的端**当前持有的 token 会在下次请求 401。前端不主动通知其他端。
- 滑动续签拦截器对 `/api/users/me` 这类 GET 仍会触发；注销接口本身放进 **不参与滑动** 的白名单避免噪音（见 §5.4）。

---

## 4. API 契约

### 4.1 端点

```
DELETE /api/users/me        // 真正落库的注销
Headers: Authorization: Bearer <access>
Body: {}（无）
```

> 选 `DELETE /api/users/me` 而非 `POST /api/users/me/deactivate`：
> - 语义最贴近「删除当前用户」；
> - 避免再开一条 path，统一在 UserController 维护；
> - 与现有 `GET /api/users/me`、`PATCH /api/users/me` 风格一致。

### 4.2 成功响应

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "userNo": "u17xxxxx9999",
    "deletedAt": "2026-06-18T10:31:22+09:00"
  }
}
```

### 4.3 错误码

| HTTP | code | 说明 |
| --- | --- | --- |
| 401 | 10001 | UNAUTHORIZED：未登录或 token 无效 |
| 403 | 10003 | FORBIDDEN：账号状态非 ACTIVE/FROZEN，禁止重复注销 |
| 500 | 90000 | 内部错误：事务失败，前端兜底「网络异常」 |

`10003` 在 ResultCode 中如不存在则补；同样作为 `USER_ALREADY_DELETED`。

### 4.4 幂等

- 同一用户重复调用：第二次起 `findById` 返回 null（mapper 自带 `deleted_at IS NULL`），AuthInterceptor 的 token 解析仍能拿到 userId，但 Service 层判 `status==DELETED` → 直接返回 403；客户端应在收到 401/403 后强制清本地状态进登录页，与正常成功路径无差别。

---

## 5. 后端实现

### 5.1 服务层契约新增

`UserService` 增加：

```java
/**
 * 注销当前用户（软删除）。
 *  - 设置 user.status = DELETED(3)，写 deleted_at = NOW()
 *  - 释放 user_identity（手机号/邮箱）→ 同手机号/邮箱可重新注册新用户
 *  - 删除 user_target_schools（按现有 deleteByUserId）
 *  - 清空 user_credential（密码哈希）
 *  - 作废所有 access/refresh token（接入 LoginService）
 *  - 记录 audit log（reason=USER_DEACTIVATE）
 */
DeactivateResult deactivate(Long userId, String currentJti, long accessRemainingSeconds);
```

`UserController` 新增：

```java
@DeleteMapping("/me")
public Result<DeactivateResponse> deactivate(@CurrentUser UserSession s,
                                             HttpServletRequest req) {
  long remaining = TokenAttrs.remaining(req);  // 由拦截器写到 attribute
  String jti = s.getJti();
  return Result.ok(userService.deactivate(s.getUserId(), jti, remaining));
}
```

### 5.2 落库步骤（单事务）

按依赖顺序，全部在 `@Transactional`：

1. **状态检查**：`userMapper.findById(userId)`；若 `null` 或 `status==DELETED` → throw `USER_ALREADY_DELETED`。
2. **释放身份**：`userIdentityMapper.deleteAllByUserId(userId)`。
   - 物理删除而非置位，因为业务要求「同邮箱/手机号能重新注册新账号」；旧 identity 行留着会让唯一索引冲突。
   - 需要新增 mapper 方法 `deleteAllByUserId(userId)`（对应 `DELETE FROM user_identity WHERE user_id = #{userId}`）。
3. **清密码**：`userCredentialMapper.deleteByUserId(userId)`（如不存在，新增 mapper）。
4. **目标校**：`userTargetSchoolMapper.deleteByUserId(userId)`（已存在）。
5. **profile 清敏感字段**：将 `nickname`、`bio`、`avatar_url`、`avatar_color`、`major`、`selected_major_code`、`next_exam_*` 清空；但保留 `solved_count` 等统计字段以备审计；或全表 `deleteByUserId`（推荐，简单）。
   - 与产品的「删除账号所有数据」一致，建议直接 `deleteByUserId`，一行不留。
6. **主表软删**：`UPDATE user SET status=3, deleted_at=NOW(), updated_at=NOW() WHERE id=#{id} AND deleted_at IS NULL`（新 mapper 方法 `softDelete(id)`，UPDATE 受影响行数 0 时抛 `USER_ALREADY_DELETED`）。
7. **作废 token**：`tokenService.revokeAccessToken(jti, remainingSeconds)` + `tokenService.revokeAllRefreshTokens(userId)`。
8. **审计**：写一条 `login_audit` 记录（`success=1, fail_reason=USER_DEACTIVATE`），便于对账。

事务边界：1–6 在 DB 事务中；7（Redis）放在事务外，DB 提交成功后再做（DB 失败时不应作废 token；Redis 失败时退化为 token 自然过期，影响可接受）。

### 5.3 留 / 删字段总览

| 表 | 处理 | 理由 |
| --- | --- | --- |
| `user` | 软删（`status=3, deleted_at=NOW()`） | 保留 userNo 与历史外键完整性；后续 `findById` 因 `deleted_at IS NULL` 已自动过滤。 |
| `user_identity` | 物理删除 | 释放手机号/邮箱，让用户可重新注册。 |
| `user_credential` | 物理删除 | 同步清密码哈希，避免日后碰撞。 |
| `user_profile` | 物理删除 | 个人资料属敏感数据，且重新注册会重新初始化。 |
| `user_target_schools` | 物理删除 | 学习偏好属敏感数据，已有 deleteByUserId。 |
| `login_audit` | 保留 | 风控审计需要，加注销记录一条。 |
| 业务侧（错题、收藏、上传、论坛帖子等） | **本期不动** | 当前后端尚未落库；前端 mock 的错题/收藏存 AsyncStorage（`attemptStore`、`favoritesStore`），登录页跳转前会随 `clearAuth` 不再被这个 user 读到。一旦上线真实表，需在本服务中追加各业务表的 deleteByUserId（见 §8 后续清单）。 |

### 5.4 拦截器/路由白名单

- `AuthInterceptor.shouldSlide` 增加：`uri.startsWith("/api/users/me") && method==DELETE` 不参与滑动续签，否则会出现「注销成功但响应头又下发新 token」的尴尬。或简单点，注销接口在 controller 里手动设 `request.setAttribute("skipSlide", true)`，拦截器读取后跳过。
- `LoginRequiredInterceptor` 默认要求登录，符合预期。
- 错误处理：在 `GlobalExceptionHandler` 中保证 `USER_ALREADY_DELETED` → 403 + 业务码 10003，不要落到 500。

### 5.5 与滑动续签的并发

- 滑动续签会重签 access+refresh 写入响应头；但客户端在拿到注销成功响应后，会立即清空本地 token，新写入的 token 没人用，等同自然过期，无安全问题。

---

## 6. 数据模型变更

| 变更 | 内容 |
| --- | --- |
| 新增 mapper 方法 | `UserMapper.softDelete(Long id)`、`UserIdentityMapper.deleteAllByUserId(Long userId)`、`UserCredentialMapper.deleteByUserId(Long userId)`、`UserProfileMapper.deleteByUserId(Long userId)` |
| 新增 DTO | `DeactivateResponse { String userNo; String deletedAt; }` |
| 新增枚举值 | `ResultCode.USER_ALREADY_DELETED(10003, "账号已注销")`（如已存在则复用） |
| 索引 | 当前 `user_identity` 应该已有 `(identity_type, identity_value)` 唯一索引，物理删除即可让重新注册通过；若是「软删 + 唯一索引」，则需把唯一索引改为 partial `WHERE deleted_at IS NULL` 才能让旧值释放 — 当前代码看是物理删除，无需改索引。 |

---

## 7. 安全 & 风控

1. **再认证**：本期采用「Alert 二次确认」即可，不要求重输密码。后续若产品需要，可按 §3.3 追加输入「注销」二字或验证码。
2. **批量风控**：服务层日志要打 `userId/userNo/clientIp/userAgent`，方便观察是否有脚本批量注销。
3. **同手机号重注册**：物理删 identity 后，新注册会创建全新 userId；旧 user 的统计/审计仍按旧 userId 留存。
4. **法务**：UI 文案与隐私政策中「账号注销与数据删除」章节保持一致；如政策要求保留 N 天才物理删 identity，可改为「先标记 deletedAt，N 天后定时任务物理清理」（需要新增 partial index + cron job，非本期范围）。
5. **审计可追溯**：`login_audit` 写入 `success=1, fail_reason='USER_DEACTIVATE', login_method='DEACTIVATE'`。

---

## 8. 兼容与后续

| 项 | 状态 |
| --- | --- |
| 现有 token 30 天滑动续签 | 注销时 access 进黑名单 + refresh 全清，不影响现有逻辑。 |
| 第三方登录（微信/Apple/LINE） | 当前 `account-security/third-party.tsx` 仅占位，注销时无三方解绑动作；上线三方时需在 §5.2 步骤 2 之后追加「调用三方解绑或仅本地解除关联」。 |
| 业务表（错题/收藏/上传/论坛帖） | 当前后端无对应表；上线时需补：`UserDataPurger.deleteAllByUserId` 串联各业务 mapper。 |
| 数据出口/导出 | 不在本期。 |
| 客服侧撤销注销 | 不在本期；DELETED 不可逆。 |

---

## 9. 验收清单

前端：

- [ ] 设置 → 账号安全 底部出现红色「注销账号」行，下方有提示文案。
- [ ] 点击弹出 Alert，文案与 §2.3 完全一致。
- [ ] 点「取消」无任何状态变化。
- [ ] 点「继续注销」期间，按钮不可重复点击。
- [ ] 注销成功 → 跳回登录页 → 本地 SecureStore 与 zustand 都被清。
- [ ] 注销期间断网 → Alert「网络异常，请稍后重试」，停留在账号安全页。

后端：

- [ ] `DELETE /api/users/me`：未登录 401；已注销账号再调返回 403/10003；正常返回 200 + userNo + deletedAt。
- [ ] DB 校验：`user.status=3`、`user.deleted_at IS NOT NULL`；`user_identity / user_credential / user_profile / user_target_schools` 行已被物理删除；`login_audit` 增加一条 `USER_DEACTIVATE`。
- [ ] Redis 校验：旧 access jti 进黑名单（TTL 与 access 剩余时长一致），refresh 白名单 Key 全部消失。
- [ ] 同手机号重新走验证码登录 → 创建新 userId，互不影响。
- [ ] 拦截器白名单：注销响应头不携带 `X-New-Access-Token`/`X-New-Refresh-Token`。

---

## 10. 任务拆分（开发顺序）

1. **后端先行**
   - DTO + ResultCode 补充
   - UserService.deactivate 实现 + 单测（mock token + 各 mapper）
   - UserController DELETE /me 路由 + 拦截器白名单
   - 集成测试：login → deactivate → 旧 token 401 → 同手机号重新登录得到新 userId

2. **前端**
   - `src/api/auth.ts` 增 `deactivateAccount`
   - `app/account-security.tsx` 加「账号操作」分组 + Alert + 调 API + 清本地 + 跳登录
   - 视觉走查：浅色/深色主题红色对比度

3. **联调**
   - 真机走 §9 全部用例
   - 观察滑动续签响应头是否被屏蔽
   - 观察 `login_audit` 记录

4. **上线**
   - 隐私政策同步「注销即删除」条款（产品/法务跟进）
   - 灰度开关可选：暂用 `app.json` 中的 `extra.feature.deactivate=true` 控制是否展示入口（如需灰度）

---

> 文档完成后即可分配给后端 / 前端按 §10 顺序执行。任何字段改动同步更新 `docs/DATA_MODEL.md` 与 `docs/API_CONTRACT.md`。
