# 代码重构与模板抽取 Spec

## Why

前端 JS 文件中存在两类问题：一是大量 HTML 模板内联在 JS 的模板字面量中（`container.innerHTML = \`...\``），导致 JS 文件臃肿且 VS Code TS 语言服务误报；二是多处重复的代码模式（AI 流式事件、Clipboard 复制、菜单定位逻辑、highlightText）散落在不同文件中，增加维护成本。

## What Changes

### PART A：静态模板抽取

将纯静态 HTML 骨架模板从 `render()` 方法中抽取到独立 `.html` 文件，**仅限不含动态 JS 逻辑（循环/条件/函数调用）的模板部分**。参考 translate.js 的 `fetch + _template` 缓存模式。

| 文件 | render() 模板大小 | 目标文件 |
|------|------------------|---------|
| settings.js | 265 行 | html/settings.html |
| data.js | 114 行 | html/data.html |
| dashboard.js | 63 行 | html/dashboard.html |
| prompts.js | 91 行（含 1 处三元） | html/prompts.html |
| skills.js | 86 行（含 2 处三元） | html/skills.html |

对于含少量三元的模板，将三元条件改为 JS 渲染后再设置 class。

**不抽取的模板**（含复杂动态逻辑）：
- `renderTable()` / `renderCards()` — 含 `forEach`、`map`、条件嵌套
- `openEditModal()` / `openCreateModal()` — 含数据注入
- `viewPrompt()` / `viewSkill()` — 含 IIFE 和动态拼接

### PART B：重复代码抽象

| # | 重复模式 | 涉及文件 | 方案 | 预估减少 |
|---|---------|---------|------|---------|
| 1 | AI 流式事件注册 | prompts.js, skills.js, translate.js | 新增全局 `withAIStream()` 工具函数 | ~120 行 |
| 2 | Clipboard 后备复制 | prompts.js（4 处） | 新增全局 `copyToClipboard()` 工具函数 | ~30 行 |
| 3 | ContextMenu ↔ DropdownMenu 定位逻辑 | context-menu.js, dropdown-menu.js | 将边界检测逻辑抽取为共享函数 | ~30 行 |
| 4 | DashboardView.highlightText 重复 | dashboard.js, app.js | 删除 dashboard.js 版本，改用全局 `highlightText` | ~7 行 |

**不做的高风险重构：**
- PromptsView ↔ SkillsView 批量操作合并（~500 行，风险高，保持现状）
- ContextMenu ↔ DropdownMenu 完整继承体系（风险中，暂只抽定位函数）

## Impact

- 新增 5 个 `.html` 模板文件，位置在 `frontend/html/`
- 修改 5 个 `.js` 视图文件（settings/data/dashboard/prompts/skills）
- 新增 2~3 个全局工具函数（位置在 `frontend/js/app.js` 或新建 `frontend/js/utils.js`）
- 修改 2 个组件文件（context-menu.js, dropdown-menu.js）
- **不破坏任何现有功能** — 模板抽取后渲染结果完全一致，工具函数为纯新增调用点迁移

## ADDED Requirements

### Requirement: 静态模板抽取

The system SHALL extract pure HTML skeleton templates from JS render() methods to standalone .html files.

#### Scenario: settings.js render 模板抽取
- **GIVEN** settings.js 的 render() 包含 265 行纯静态 HTML
- **WHEN** 创建 html/settings.html 并引入 fetch + _template 缓存
- **THEN** 渲染结果与原来完全一致，无功能变化

#### Scenario: 含三元的模板处理
- **GIVEN** prompts.js render() 有 1 处 `${this.currentView === 'list' ? ' active' : ''}`
- **WHEN** 模板抽取到独立文件
- **THEN** 三元逻辑改为 render() 中通过 `document.getElementById().classList.add()` 处理

### Requirement: 全局 AI 流式工具函数

The system SHALL provide a unified `withAIStream()` utility for AI streaming event handling.

#### Scenario: 流式事件注册与清理
- **WHEN** 调用 `withAIStream(apiMethod, { onToken, onDone, onError })`
- **THEN** 自动注册 `ai:token` / `ai:done` / `ai:error` 事件，自动清理监听器

### Requirement: 全局 Clipboard 工具函数

The system SHALL provide a unified `copyToClipboard(text)` utility with navigator.clipboard fallback.

#### Scenario: 复制到剪贴板
- **WHEN** 调用 `copyToClipboard('some text')`
- **THEN** 优先使用 `navigator.clipboard.writeText`，失败时回退到 `document.createElement('textarea') + execCommand('copy')`

## MODIFIED Requirements

### Requirement: ContextMenu.show() 定位逻辑

**修改前**：边界检测代码内联在 context-menu.js 和 dropdown-menu.js 中
**修改后**：抽取为共享函数 `positionMenu(el, x, y)`，两处调用

### Requirement: DashboardView.highlightText

**修改前**：dashboard.js 中有独立 highlightText 实现
**修改后**：删除该方法，所有调用点改用全局 `highlightText()`

## REMOVED Requirements

（无）
