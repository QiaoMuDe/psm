# 视图布局重新设计 Spec

## Why

提示词和技能模块的列表视图当前采用 `position: sticky` 方案实现顶部冻结，但在实际运行中未能达到预期效果——整个页面（包括页面标题和工具栏）随列表一起滚动。需要从根本上重新设计主内容区的布局方案，采用 CSS Flex 布局实现真正的「顶部冻结 + 列表独立滚动」，同时优化冻结区域与滚动区域之间的视觉分隔和整体 UI 设计。

## What Changes

* 将 `.main-content` 改为 `display: flex; flex-direction: column; overflow: hidden`，移除自身的滚动能力

* 将 `#view-container` 同样设为 flex column 容器，作为视图内容的布局骨架

* `.page-header` 和 `.view-toolbar` 设为 `flex-shrink: 0`，确保不被压缩

* `.view-content` 设为 `flex: 1; overflow-y: auto; min-height: 0`，成为唯一的滚动容器

* 移除 `position: sticky` 相关样式

* 在冻结区域底部添加视觉分隔线，明确区分固定区域与滚动区域

* 优化 `.page-header` 和 `.view-toolbar` 的间距与排版

* 确保仪表盘、设置、数据管理等非列表视图在新布局下正常显示

## Impact

* Affected specs: `fix-list-scroll`（本 Spec 取代其布局方案）

* Affected code:

  * `frontend/css/style.css` — 主要修改文件，重新设计主内容区布局

  * `frontend/index.html` — 无需修改（`.main-content > #view-container` 结构不变）

  * `frontend/js/views/prompts.js` — 无需修改（`.page-header` / `.view-toolbar` / `.view-content` 结构不变）

  * `frontend/js/views/skills.js` — 同上

  * `frontend/js/views/dashboard.js` — 无需修改（`.page-header` + `.view-content` 结构兼容）

  * `frontend/js/views/settings.js` — 无需修改

  * `frontend/js/views/data.js` — 无需修改

## MODIFIED Requirements

### Requirement: 主内容区布局架构

#### Scenario: 提示词/技能模块列表独立滚动

* **WHEN** 用户在提示词或技能模块中浏览列表数据（表格视图或卡片视图）

* **THEN** 页面标题（`.page-header`）和工具栏（`.view-toolbar`）固定在顶部不动

* **AND** 仅列表区域（`.view-content`）独立滚动

* **AND** 滚动条出现在列表区域的右侧

#### Scenario: 仪表盘/设置/数据管理视图正常显示

* **WHEN** 用户浏览仪表盘、设置、数据管理等视图

* **THEN** 页面布局与功能不受布局变更影响

* **AND** 内容正常展示，无错位或溢出

### Requirement: 冻结区域与滚动区域的视觉分隔

#### Scenario: 用户查看列表视图

* **WHEN** 页面同时显示冻结区域和滚动区域

* **THEN** 冻结区域底部有一条细线（border-bottom）作为视觉分隔

* **AND** 冻结区域背景色与页面背景色一致，确保视觉连贯

## 技术方案

### 布局层级

```
.app-container          → display: flex; height: 100vh
  .sidebar             → 固定宽度
  .main-content        → flex: 1; display: flex; flex-direction: column; overflow: hidden
    #view-container    → flex: 1; display: flex; flex-direction: column; overflow: hidden; padding: 24px
      .page-header     → flex-shrink: 0（冻结）
      .view-toolbar    → flex-shrink: 0（冻结，仅 prompts/skills 有）
      .view-content    → flex: 1; overflow-y: auto; min-height: 0（滚动）
```

### 关键 CSS 规则

1. `.main-content`：移除 `overflow-y: auto`，改为 `display: flex; flex-direction: column; overflow: hidden`
2. `#view-container`：新增 `display: flex; flex-direction: column; flex: 1; overflow: hidden; padding: var(--spacing-4)`
3. `.main-content` 移除 `padding`（移至 `#view-container`）
4. `.page-header`：移除 `position: sticky`，改为 `flex-shrink: 0`
5. `.view-toolbar`（`.main-content > .card.view-toolbar`）：移除 `position: sticky`，改为 `flex-shrink: 0`
6. `.view-content`：新增 `flex: 1; overflow-y: auto; min-height: 0`

