# Typora-Like Markdown Editor

## What This Is

这是一个面向 Windows 的本地 Markdown 桌面编辑器，目标是在公司环境中替代 Typora，保留接近 Typora 的单栏、所见即所得、流畅书写体验。它围绕用户手动指定的单个根目录工作，负责文档编辑、基础文件管理、全文搜索、图片粘贴落盘，以及少量高质量内置主题。

产品定位不是“功能很多的知识库”或“通用代码编辑器”，而是一个本地优先、顺手、稳定、视觉体验不错的 Markdown 写作工具。架构上要求开源、模块化、可扩展，但 v1 优先把核心写作体验和本地文件流转做好。

## Core Value

用户可以在 Windows 上用一个本地、顺手、稳定的 Markdown 编辑器，获得接近 Typora 的流畅写作体验，而不依赖商业授权、云服务或复杂外部系统。

## Requirements

### Validated

- ✓ 应用可以作为 Windows 本地桌面程序启动并渲染 React 界面 — existing scaffold in `src/main.tsx`, `src/App.tsx`, `src-tauri/src/main.rs`, `src-tauri/src/lib.rs`
- ✓ 前端已经可以通过 Tauri IPC 调用 Rust 原生命令 — existing scaffold in `src/App.tsx` and `src-tauri/src/lib.rs`
- ✓ 本地开发、前端构建、桌面打包链路已经接通 — existing scaffold in `package.json`, `vite.config.ts`, `src-tauri/Cargo.toml`, `src-tauri/tauri.conf.json`

### Active

- [ ] 提供单栏、所见即所得的 Markdown 编辑体验，避免明显的编辑/预览分栏切换
- [ ] 在较大文档下仍保持流畅，避免明显卡顿、输入延迟和视图抖动
- [ ] 让标题、列表、引用、表格、代码块、快捷键和复制粘贴行为尽量接近 Typora 的书写手感
- [ ] 允许用户手动设置一个工作根目录，所有文档操作均限定在该目录下
- [ ] 提供根目录下 Markdown 文件和文件夹的浏览、创建、重命名、删除、移动能力
- [ ] 提供根目录范围内的全文搜索能力，帮助快速定位文件和内容
- [ ] 支持图片粘贴后自动保存到当前文档相邻的 `assets/` 相对目录，并插入正确的 Markdown 引用
- [ ] 提供至少 `GitHub`、`Vue`、`One Dark` 三个内置主题，以及常用代码块语法高亮
- [ ] 保持项目开源、模块化、可扩展，避免把编辑器、文件系统、主题和状态逻辑堆在单一实现里

### Out of Scope

- 云同步与在线账号体系 — 明确不需要，本项目是本地优先工具
- 多窗口 — v1 不做，避免把注意力从单窗口写作体验上分散开
- 插件市场 — 明确不做，扩展性先通过模块化架构和主题文件组织来预留
- 协作编辑 — 明确不做，本项目不是在线协同产品
- PDF / Word / 其他导出能力 — 明确不做，v1 聚焦本地编辑与文件管理
- 非 Windows 平台首发支持 — 当前只面向 Windows，先把单平台体验打磨好
- 云端笔记库、标签数据库、知识图谱类能力 — 当前产品边界是本地文件夹里的 Markdown 文档

## Context

当前仓库已经是一个 React + TypeScript + Tauri 2 的桌面应用骨架，说明项目不是从零开始，而是在现有桌面壳和构建链路上演进。代码地图已生成于 `.planning/codebase/`，其中确认了前端、原生层、IPC 边界和打包配置都已存在，但应用功能层仍然基本是模板状态。

用户的动机很明确：因为商业授权和公司使用限制，无法直接使用 Typora；同时现有开源替代品在书写体验、顺手程度或整体完成度上不能满足日常使用。这个产品首先服务用户自己在公司环境中的高频 Markdown 写作需求，而不是先追求“大而全”的功能集合。

已有的产品方向草案记录在 `docs/typora-like-editor-plan.md`，其中已经提出使用 Tauri + React + TypeScript 构建本地桌面编辑器、围绕工作目录组织文件，以及把主题与编辑器能力解耦。当前初始化阶段需要把那份草案和本轮对话中确认的真实优先级统一到一个正式项目上下文里。

主题方向上，用户希望后续能够继续新增主题，但前期要尽量简单，因此主题系统初步按文件组织：基础样式与主题样式分离，主题文件集中放在 `styles/themes/` 下，通过 CSS 文件扩展，而不是一开始就实现复杂的主题引擎。

图片处理策略以性能和本地可维护性优先，默认推荐把图片存到当前文档相邻的 `assets/` 目录，而不是全局图库。这种方式有利于文档迁移、目录级管理和后续模块扩展，也能减少路径解析和资源归档上的额外复杂度。

## Constraints

- **Platform**: Windows only for v1 — 先把单平台桌面体验打磨到可长期日用，再考虑跨平台
- **Architecture**: Keep existing React + TypeScript + Tauri foundation unless proven insufficient — 当前代码骨架和桌面打包链路已存在，优先在现有基础上演进
- **Performance**: Editing feel must stay smooth for large documents — 用户把流畅写作体验放在第一优先级，不能为了堆功能牺牲输入手感
- **Workspace Model**: One user-selected root directory is the only content scope — 文件管理、搜索、图片和状态都要围绕单根目录设计
- **Product Scope**: Local-only Markdown workflow — 不引入云同步、协作、插件市场、导出等非核心能力
- **UX**: Single-pane near-WYSIWYG writing experience — 不采用明显的双栏编辑/预览切换作为核心交互模型
- **Maintainability**: Modular and open-source friendly implementation — 编辑器、文件系统、主题、搜索、状态和设置要保持边界清晰

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| v1 only targets Windows desktop | 先在单平台把体验做扎实，避免跨平台差异拖慢核心写作能力 | — Pending |
| Product scope stays local-first and single-user | 用户真实痛点是公司环境里的本地替代方案，不需要在线能力 | — Pending |
| Workspace model uses one user-selected root directory | 更符合用户当前使用方式，也能显著收敛文件管理和搜索复杂度 | — Pending |
| Theme system starts with CSS files organized by theme | 先保证实现简单和易扩展，后续新增主题时成本更低 | — Pending |
| Default pasted-image strategy uses document-adjacent `assets/` folders | 本地迁移、目录管理和相对路径引用都更直接 | — Pending |
| The editor should prefer Typora-like single-pane WYSIWYG interaction over split preview | 这是产品差异和用户满意度的核心来源 | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `$gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `$gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-16 after initialization*
