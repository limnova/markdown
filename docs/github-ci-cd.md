# GitHub CI / CD

这套配置面向当前仓库的 Windows-only Tauri 应用，拆成两条 GitHub Actions 工作流：

1. `CI`：对每个 PR / 分支推送执行基础校验。
2. `Release`：当推送 `v*.*.*` tag 时，自动构建 Windows 安装包并创建 GitHub draft release。

## 工作流说明

### CI

文件：[`.github/workflows/ci.yml`](../.github/workflows/ci.yml)

执行内容：

- 安装 `pnpm 10.33.0`
- 使用 Node.js 22
- 安装 Rust stable
- 执行 `pnpm install --frozen-lockfile`
- 执行 `pnpm build`
- 执行 `pnpm check:rust`

其中：

- `pnpm build` 会执行 TypeScript 无输出类型检查和 Vite 前端构建。
- `pnpm check:rust` 会执行 `cargo check --manifest-path src-tauri/Cargo.toml --locked`。

### Release

文件：[`.github/workflows/release.yml`](../.github/workflows/release.yml)

触发条件：

- 推送 tag，格式匹配 `v*.*.*`

执行内容：

- 安装前端和 Rust 构建环境
- 调用官方 `tauri-apps/tauri-action`
- 构建 Windows 安装产物
- 创建 GitHub draft release
- 将安装包同时上传到 release assets 和 workflow artifacts

当前默认是 `draft release`，这样第一次接入时更安全；确认流程稳定后，可以把 `releaseDraft: true` 改成 `false`，让 tag 推送后直接公开发布。

## 你需要准备的信息

### 1. 仓库和分支约定

- 你的 GitHub 仓库已经启用 Actions
- 你希望作为主干的默认分支名称，例如 `main`
- 你准备采用的发版 tag 规则，例如 `v0.1.0`

### 2. 应用发布元信息

发布前建议先确认这些字段已经是正式值：

- [`package.json`](../package.json) 里的 `version`
- [`src-tauri/tauri.conf.json`](../src-tauri/tauri.conf.json) 里的 `version`
- [`src-tauri/tauri.conf.json`](../src-tauri/tauri.conf.json) 里的 `productName`
- [`src-tauri/tauri.conf.json`](../src-tauri/tauri.conf.json) 里的 `identifier`

当前仓库还是模板值：

- `productName`: `react-tauri-app`
- `identifier`: `com.tauri-app.react-tauri-app`

如果你准备正式对外分发，建议先改成真实应用名和稳定包标识。

### 3. 发版操作约定

当前流程默认的发版动作是：

1. 更新版本号
2. 提交代码
3. 打 tag，例如：

```bash
git tag v0.1.0
git push origin v0.1.0
```

4. 等待 `Release` 工作流创建 draft release
5. 在 GitHub Release 页面检查产物和说明，再手动发布

### 4. 可选但强烈建议准备的内容

#### Windows 代码签名

当前这套流程可以构建可安装包，但默认是**未签名**的 Windows 包。

如果你希望减少 SmartScreen 警告，需要额外准备：

- 一个可用的 Windows 代码签名证书
- 对应的私钥/证书导出格式
- 证书密码
- 你准备用哪种签名方案：本地 PFX、Azure Key Vault、Azure Code Signing 或供应商自定义方案

Tauri 官方说明指出，Windows 代码签名有助于避免浏览器下载后的 SmartScreen 不受信告警，但不是运行应用的硬性前提。

#### 自动更新

如果后续要做 Tauri updater，还需要准备：

- updater 私钥
- 私钥密码
- release 分发地址策略

当前仓库还没有启用 updater，所以这部分没有接入到 workflow。

## 建议的仓库 Secrets

当前工作流直接可用，不强制要求自定义 secrets。

默认使用：

- `GITHUB_TOKEN`

这是 GitHub Actions 自动提供的 token，用来创建 release 和上传资产。

如果后续启用签名或 updater，通常会继续新增 secrets，例如：

- `WINDOWS_CERTIFICATE`
- `WINDOWS_CERTIFICATE_PASSWORD`
- `TAURI_SIGNING_PRIVATE_KEY`
- `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`

这些名字只是建议命名，具体取决于你最终采用的签名实现。

## 本地自检命令

在推送前，你可以先在本地执行：

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm check:rust
```

## 后续建议

如果你准备把这套流程用于真实对外发版，下一步最值得补的是：

1. 把 `productName` / `identifier` 从模板值改成正式值
2. 接入 Windows 代码签名
3. 为 release 增加人工审批环境或改成正式自动发布策略
