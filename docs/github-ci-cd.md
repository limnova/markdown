# GitHub CI / CD

这套配置面向当前仓库的 Windows-only Tauri 应用，拆成两条 GitHub Actions 工作流：

1. `CI`：对每个 PR / 分支推送执行基础校验。
2. `Release`：当推送 `v*.*.*` tag 时，自动构建 Windows 安装包，并在权限允许时创建 GitHub draft release。

## 工作流说明

### CI

文件：[`.github/workflows/ci.yml`](../.github/workflows/ci.yml)

执行内容：

- 安装 `pnpm 10.33.0`
- 使用 Node.js 22
- 安装 Rust stable
- 将 `CARGO_TARGET_DIR` 临时指向 GitHub runner 的临时目录，避免使用本机固定路径
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
- 将 `CARGO_TARGET_DIR` 临时指向 GitHub runner 的临时目录，避免受本机 `.cargo/config.toml` 固定路径影响
- 调用官方 `tauri-apps/tauri-action`
- 构建 Windows 安装产物
- 始终上传一个名为 `windows-installers-<tag>` 的 workflow artifact
- 先尝试用 `GITHUB_TOKEN` 创建 GitHub draft release 并上传 `.msi` / `*-setup.exe` 资产
- 如果仓库配置了 `RELEASE_TOKEN` secret，则优先使用它来创建 release
- 如果 release 创建权限不足，工作流不会因为 `Resource not accessible by integration` 失败，安装包仍保留在 workflow artifact 中
- 在 job summary 明确列出 draft release 地址或跳过原因，以及生成的安装程序文件名

这样做的原因是：某些仓库或组织的 Actions integration 对 GitHub Releases API 没有写权限，会出现 `Resource not accessible by integration`。现在即使 release 创建权限缺失，tag 构建也会成功，安装包仍可从 Actions artifact 下载。

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

当前仓库当前配置为：

- `productName`: `Markdown`
- `identifier`: `com.markdown.app`

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

4. 等待 `Release` 工作流完成构建
5. 如果 GitHub draft release 已创建，到 Release 页面检查产物和说明
6. 如果 job summary 提示 release 因权限被跳过，则从 Actions run 的 `windows-installers-<tag>` artifact 下载安装包

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

当前工作流构建本身不强制要求自定义 secrets。默认会先尝试使用 `GITHUB_TOKEN` 创建 draft release；如果当前仓库策略不允许，就会跳过 release 创建但保留构建产物。

默认使用：

- `GITHUB_TOKEN`

这是 GitHub Actions 自动提供的 token。当前 workflow 会先用它尝试创建 release；如果仓库/组织策略限制了 GitHub Releases API 写权限，就会出现权限失败并自动回退到仅保留 workflow artifact。

推荐额外配置：

- `RELEASE_TOKEN`

建议使用一个具备当前仓库 `Contents: write` 权限的 fine-grained PAT，或者具备等效权限的 classic PAT。配置后，`Release` 工作流会优先使用它创建 draft release 并上传安装包资产，用来绕过受限的默认 integration 权限。

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
