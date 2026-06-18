# v0.11 Expo 启动白屏修复手册

本文记录 v0.11 版本中 Expo Go 启动白屏、资源缺失、SDK 55 依赖不匹配，以及启动阶段被旧登录态阻塞的问题原因、修复内容和 Mac 端更新步骤。

## 适用范围

适用于看到以下日志的本地环境：

```text
Error: ENOENT: no such file or directory, scandir '.../assets/images'
Unable to resolve asset "./assets/images/icon.png" from "icon" in your app.json or app.config.js
The following packages should be updated for best compatibility with the installed expo version
```

也适用于运行：

```bash
npx expo start
```

或误输入为 `nxp expo` 后重新改为 `npx expo`，但 Expo Go 仍然显示白屏的情况。

## 错误码总览

| 错误码 | 现象 / 日志 | 判断 | 处理 |
|--------|-------------|------|------|
| `ERR-001` | `ENOENT ... assets/images` | 缺少 `assets/images` 目录或图片 | 拉取 `v0.11.0+`，确认 `icon.png` / `splash-icon.png` 存在 |
| `ERR-002` | `Unable to resolve asset "./assets/images/icon.png"` | `app.json` 引用的 icon 文件不存在 | 同 `ERR-001` |
| `ERR-003` | Expo 提示多个包 `expected version` 不一致 | Expo SDK 55 依赖未对齐 | 拉取最新 `main` 后执行 `npm ci` |
| `ERR-004` | `TypeScript: The tsconfig.json#include property has been updated` | Expo Router 自动更新类型 include，通常不是致命错误 | 确认 `tsconfig.json` 未被本地改乱；必要时 `git restore tsconfig.json` 后重新拉取 |
| `ERR-005` | `package-lock.json` / `tsconfig.json` 本地修改导致 `git pull` 失败 | 本地自动生成改动挡住 fast-forward | 若不需要保留，执行 `git restore package-lock.json tsconfig.json` |
| `ERR-006` | 白底 + 中间黑色圆角图标 / 方块，没有 Metro error | Splash / Expo Go loading 层没退出 | 拉取 `v0.11.3+`，清 Expo Go 缓存，重新 `npx expo start --clear` |
| `ERR-007` | Expo Go 只显示白屏，但终端显示 bundle 成功 | 首屏前 hydration 可能被旧 token / 后端请求阻塞 | `v0.11.3+` 已移除首屏前后端校验；仍复现时清 Expo Go 项目缓存 |
| `ERR-008` | 登录失败，提示后端未启动或账号密码错误 | 真登录需要后端 API；Expo Go 手机访问 `localhost` 不是 Mac | 使用 `跳过 / Demo 体验`，或把 API base URL 改成 Mac 局域网 IP |
| `ERR-009` | `expo-notifications functionality is not fully supported in Expo Go` | Expo Go 对推送通知支持有限 | 非启动阻塞，可忽略；完整推送测试要 development build |
| `ERR-010` | `Android Push notifications ... removed from Expo Go with SDK 53` | Android Expo Go 不支持远程推送 | 非启动阻塞，可忽略 |
| `ERR-011` | `npm warn deprecated ...` | 间接依赖废弃警告 | 非启动阻塞；不要直接 `npm audit fix --force` |
| `ERR-012` | `npm audit` 报 moderate vulnerabilities | 依赖树安全提示，可能来自开发工具链 | 先记录，不直接强制升级；强制修复可能破坏 Expo 版本矩阵 |
| `ERR-013` | 误输入 `nxp expo` | 命令拼写错误 | 使用 `npx expo start --clear` |
| `ERR-014` | QR 码打开浏览器或无法连接 | 手机和 Mac 网络 / Expo Go 打开方式问题 | 确认同一 Wi-Fi，用 Expo Go 扫码；必要时切换 LAN / Tunnel |
| `ERR-015` | `npx expo install --check` 网络 / 权限失败 | 本地网络、代理或权限限制 | 换网络后重试；以 `package-lock.json` + `npm ci` 为准 |
| `ERR-016` | iOS bundle 成功但 Expo Go 仍旧画面 | Expo Go 设备侧缓存旧 bundle / SecureStore | 关闭项目、清 Expo Go 缓存，必要时卸载重装 Expo Go |

优先级判断：

1. 先看 Metro 有没有红色 error；有 error 先按对应错误码处理。
2. 如果没有 error，只有白底中间图标，优先看 `ERR-006` / `ERR-007` / `ERR-016`。
3. `expo-notifications`、`npm deprecated`、`npm audit` 暂时不是白屏主因。

## 根因一：缺失 app icon / splash 资源

白屏的直接阻塞原因是 Expo 配置引用了不存在的资源文件。

`app.json` 中有如下配置：

```json
{
  "expo": {
    "icon": "./assets/images/icon.png",
    "splash": {
      "image": "./assets/images/splash-icon.png"
    }
  }
}
```

旧版本仓库中 `assets/images/` 目录缺少：

```text
assets/images/icon.png
assets/images/splash-icon.png
```

Metro 在解析 app icon / splash image 时找不到文件，所以 Expo Go 无法正常完成启动。日志里的 `expo-notifications` 是 Expo Go 限制警告，不是这次白屏的主因。

同时，部分依赖版本没有对齐 Expo SDK 55，导致 Expo CLI 给出兼容性警告。虽然这些警告不一定直接造成白屏，但会增加运行时不稳定性。

## 根因二：旧 token 导致首屏前等待后端超时

如果更新资源后，Expo Go 仍停在白底 + 中间黑色圆角图标，说明它已经不再是资源缺失问题，而是启动页没有被隐藏。

Expo 官方文档说明：SDK 52 起，Expo Go 会在 splash 可见时显示 app icon，而不是完整复现 standalone app 的 splash screen。因此“白底中间一个 app icon / 圆角方块”可以被当作启动层仍未退出的信号。参考：<https://docs.expo.dev/versions/v55.0.0/sdk/splash-screen/>

旧版 `app/_layout.tsx` 在首屏渲染前执行：

```text
SecureStore 读取本地 token
  -> 如果存在 token，调用 GET /users/me
  -> 如果失败，再调用 /auth/refresh
  -> 等这些请求完成后才设置 isHydrated
  -> isHydrated 之前根组件返回 null
```

开发环境的默认 API 地址是：

```text
http://localhost:3000/api/v1
```

在手机上运行 Expo Go 时，`localhost` 指的是手机自己，不是 Mac。因此只要设备里残留了旧 token，启动阶段就会等手机本地的 `localhost:3000` 网络超时和重试。等待期间页面不会渲染，Expo Go 会继续显示 app icon / splash，看起来就是白屏中间一个黑色圆角方块。

修复方式：

- 启动 hydration 不再请求后端校验 token。
- 旧的非 demo token 会被清理，不阻塞首屏。
- demo token 会直接恢复 `DEMO_USER`。
- `SplashScreen.hideAsync()` 改为在 auth/onboarding hydration 完成后调用。
- 登录页新增 `跳过 / Demo 体验`，无后端时也能进入 App。

## 已修复内容

修复提交：

```text
e417533 fix: add missing asset images + upgrade packages to SDK 55 targets
```

版本 tag：

```text
v0.11.0
```

`v0.11.0` 提交完成了：

- 新增 `assets/images/icon.png`
- 新增 `assets/images/splash-icon.png`
- 更新 `package.json`
- 更新 `package-lock.json`
- 对齐 Expo SDK 55 期望依赖版本

第二层启动阻塞修复提交：

```text
v0.11.3
```

该提交完成了：

- 移除首屏前的 `getMe()` / `refreshAuth()` 后端阻塞
- 只在 hydration 完成后隐藏 Splash
- 增加 demo token 常量
- 登录页增加 `跳过 / Demo 体验`

当前关键依赖版本：

```text
@react-native-async-storage/async-storage 2.2.0
react-native-gesture-handler 2.30.1
react-native-reanimated 4.2.1
react-native-safe-area-context 5.6.2
react-native-screens 4.23.0
eslint-config-expo 55.0.1
react 19.2.0
react-dom 19.2.0
@types/react 19.2.14
```

## Mac 端更新步骤

在 Mac 上进入项目根目录：

```bash
cd /Users/zhongyuanmen/Desktop/kairos5.19/Kairos-kakomon/Kairos-kakomon
```

确认当前分支为 `main` 并拉取最新代码：

```bash
git fetch origin --tags
git switch main
git pull --ff-only origin main
```

确认已经包含修复提交：

```bash
git log --oneline -5
```

应该能看到类似：

```text
01e9335 docs: add GIT_WORKFLOW.md
e417533 fix: add missing asset images + upgrade packages to SDK 55 targets
```

确认资源文件存在：

```bash
ls -la assets/images
```

应该能看到：

```text
icon.png
splash-icon.png
```

重新安装依赖并清理 Expo 缓存：

```bash
rm -rf node_modules .expo
npm ci
npx expo start --clear
```

如果之前用的是 `npm install`，建议这次改用 `npm ci`，确保安装结果严格匹配 `package-lock.json`。

## 本地验证命令

在项目根目录运行：

```bash
npx expo install --check
npm run type-check
npm run lint
npx expo export --platform ios --output-dir dist-check
rm -rf dist-check
```

预期结果：

- `npx expo install --check` 显示依赖已是最新/匹配状态。
- `npm run type-check` 通过。
- `npm run lint` 不应有 error。当前允许已有 warning。
- `npx expo export --platform ios` 能成功 bundle。

## Expo Go 通知警告说明

以下警告可以暂时忽略：

```text
expo-notifications functionality is not fully supported in Expo Go
Android Push notifications functionality provided by expo-notifications was removed from Expo Go with the release of SDK 53
```

含义是 Expo Go 不完整支持远程推送能力。它不会阻止普通页面渲染。后续如果要完整测试推送通知，需要使用 development build。

## 如果更新后仍然白屏

先确认是否仍然是旧代码：

```bash
git status --short --branch
git log --oneline -5
ls -la assets/images
npx expo install --check
```

然后清缓存重启：

```bash
rm -rf .expo
npx expo start --clear
```

如果 Expo Go 仍显示白屏，请先清掉 Expo Go 中这个项目的缓存，或卸载重装 Expo Go 后再扫 QR。然后保留以下信息再排查：

- 终端中 Metro 的完整错误日志
- Expo Go 设备平台和版本
- iOS / Android 系统版本
- `git log --oneline -5` 输出
- `npx expo install --check` 输出
- 白屏是否仍有中间 app icon / 方块

如果没有新的 Metro error，只是页面为空，下一步应继续检查 `app/_layout.tsx` 的启动 hydrate 流程，以及 Expo Go 设备侧是否仍保留旧 bundle / SecureStore 数据。
