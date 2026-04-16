# Requirements: Typora-Like Markdown Editor

**Defined:** 2026-04-16
**Core Value:** 用户可以在 Windows 上用一个本地、顺手、稳定的 Markdown 编辑器，获得接近 Typora 的流畅写作体验，而不依赖商业授权、云服务或复杂外部系统。

## v1 Requirements

### Workspace

- [ ] **WORK-01**: 用户可以选择一个本地文件夹作为当前工作根目录
- [ ] **WORK-02**: 应用只展示并操作当前工作根目录及其子目录中的内容
- [ ] **WORK-03**: 用户重新打开应用后可以恢复上一次使用的工作根目录

### File Management

- [ ] **FILE-01**: 用户可以在侧边栏浏览当前工作根目录下的文件夹树和 Markdown 文件
- [ ] **FILE-02**: 用户可以在当前工作根目录内新建 Markdown 文件
- [ ] **FILE-03**: 用户可以在当前工作根目录内新建文件夹
- [ ] **FILE-04**: 用户可以在当前工作根目录内重命名 Markdown 文件或文件夹
- [ ] **FILE-05**: 用户可以在当前工作根目录内移动 Markdown 文件或文件夹
- [ ] **FILE-06**: 用户可以删除 Markdown 文件或文件夹，并在执行前看到明确确认

### Editing

- [ ] **EDIT-01**: 用户打开 Markdown 文件后可以在单栏编辑区中直接进行所见即所得写作，而不是在分栏预览中工作
- [ ] **EDIT-02**: 用户输入标题、粗体、斜体、引用、无序列表、有序列表和任务列表时，会在当前编辑流中看到接近最终排版的效果
- [ ] **EDIT-03**: 用户可以编辑表格、行内代码和 fenced code block，并在文档中看到正确的结构和显示效果
- [ ] **EDIT-04**: 用户可以使用接近 Typora 习惯的基础快捷键完成保存、撤销、重做和查找
- [ ] **EDIT-05**: 用户可以通过 `Ctrl+S` 明确保存当前文档到本地文件
- [ ] **EDIT-06**: 用户在文档有未保存修改时，可以看到明确的脏状态提示，并在关闭、切换或删除相关文件前得到保护

### Images

- [ ] **IMAG-01**: 用户将图片从剪贴板粘贴到文档时，应用会自动把图片保存到当前文档相邻的 `assets/` 目录
- [ ] **IMAG-02**: 图片粘贴完成后，文档中会自动插入指向该图片的相对 Markdown 引用
- [ ] **IMAG-03**: 用户移动或重命名由应用管理图片资源的 Markdown 文档时，应用不会悄悄把图片引用留在错误状态

### Search

- [ ] **SEAR-01**: 用户可以在当前工作根目录范围内搜索 Markdown 文件名
- [ ] **SEAR-02**: 用户可以在当前工作根目录范围内搜索 Markdown 文件内容
- [ ] **SEAR-03**: 用户从搜索结果打开文档时，可以直接定位到匹配文件并开始编辑

### Themes

- [ ] **THEM-01**: 用户可以在 `GitHub`、`Vue`、`One Dark` 三个内置主题之间切换
- [ ] **THEM-02**: 主题切换会同时作用于正文排版、侧边栏和代码块高亮显示
- [ ] **THEM-03**: 用户重启应用后仍会保留上次选择的主题

### Performance & Reliability

- [ ] **PERF-01**: 用户在真实日常文档和较大 Markdown 文档中输入时，不会感受到明显的键入卡顿或视图抖动
- [ ] **PERF-02**: 用户保存文档后，不会因为编辑器序列化或文件写入过程而造成 Markdown 内容损坏
- [ ] **PERF-03**: 用户的文件操作、搜索和图片保存都不能越过当前工作根目录边界

## v1.x Requirements

### Workflow Convenience

- **FLOW-01**: 用户可以快速打开最近使用过的工作目录
- **FLOW-02**: 用户可以恢复上次打开的文档和侧边栏展开状态
- **FLOW-03**: 用户可以在应用内看到更明确的保存状态、索引状态和错误恢复提示

### Theming

- **THEX-01**: 用户可以通过放入额外 CSS 文件的方式增加自定义主题
- **THEX-02**: 用户可以为浅色模式和深色模式分别指定主题

### Editing Polish

- **EDPX-01**: 用户可以获得更完整的 Typora 风格快捷输入与智能格式化行为
- **EDPX-02**: 用户可以获得更细致的表格编辑体验与块级交互细节

## Out of Scope

| Feature | Reason |
|---------|--------|
| 云同步 | 明确不做，本项目是本地优先工具 |
| 登录/账号体系 | 本地单用户场景不需要 |
| 多窗口 | 会分散对单窗口写作体验的打磨 |
| 插件市场 | 当前只要求架构可扩展，不要求开放市场 |
| 协作编辑 | 与本项目的单机替代 Typora 目标不一致 |
| PDF / Word 导出 | 会扩张实现范围，但不影响核心写作价值验证 |
| macOS / Linux 首发支持 | 当前只面向 Windows |
| 标签、知识图谱、数据库式笔记能力 | 产品边界是本地文件夹下的 Markdown 编辑器 |
| 云端搜索或远程索引 | 超出单根目录本地工具范围 |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| WORK-01 | TBD | Pending |
| WORK-02 | TBD | Pending |
| WORK-03 | TBD | Pending |
| FILE-01 | TBD | Pending |
| FILE-02 | TBD | Pending |
| FILE-03 | TBD | Pending |
| FILE-04 | TBD | Pending |
| FILE-05 | TBD | Pending |
| FILE-06 | TBD | Pending |
| EDIT-01 | TBD | Pending |
| EDIT-02 | TBD | Pending |
| EDIT-03 | TBD | Pending |
| EDIT-04 | TBD | Pending |
| EDIT-05 | TBD | Pending |
| EDIT-06 | TBD | Pending |
| IMAG-01 | TBD | Pending |
| IMAG-02 | TBD | Pending |
| IMAG-03 | TBD | Pending |
| SEAR-01 | TBD | Pending |
| SEAR-02 | TBD | Pending |
| SEAR-03 | TBD | Pending |
| THEM-01 | TBD | Pending |
| THEM-02 | TBD | Pending |
| THEM-03 | TBD | Pending |
| PERF-01 | TBD | Pending |
| PERF-02 | TBD | Pending |
| PERF-03 | TBD | Pending |

**Coverage:**
- v1 requirements: 27 total
- Mapped to phases: 0
- Unmapped: 27 ⚠️

---
*Requirements defined: 2026-04-16*
*Last updated: 2026-04-16 after initial definition*
