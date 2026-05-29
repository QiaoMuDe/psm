# CSS 文件拆分 Spec

## Why

`style.css` 单文件已达 1330 行、29 个注释分区，涵盖设计变量、布局结构、UI 组件、工具类、响应式等所有样式。随着功能迭代，单文件维护成本越来越高，需要按职责拆分为 2-3 个文件以提升可维护性。

## What Changes

* 将 `frontend/css/style.css`（1330 行）拆分为 3 个独立文件：

  * `variables.css`（\~100 行）— 设计令牌 + 重置 + 基础排版

  * `layout.css`（\~400 行）— 应用骨架布局 + 响应式

  * `components.css`（\~830 行）— 所有 UI 组件 + 工具类

* 修改 `frontend/index.html` 的 `<link>` 标签，按顺序引用 3 个文件

* 删除原始 `style.css`

## Impact

* Affected code:

  * `frontend/index.html` — 修改 CSS 引用（1 个 `<link>` → 3 个 `<link>`）

  * `frontend/css/style.css` — 删除（内容拆分到 3 个新文件）

  * `frontend/css/variables.css` — 新建

  * `frontend/css/layout.css` — 新建

  * `frontend/css/components.css` — 新建

## 拆分方案

### 文件 1: `variables.css`（\~100 行）

职责：设计系统基础，所有其他文件的依赖

| 内容                                 | 原始行范围 |
| ---------------------------------- | ----- |
| `@import` 字体                       | 1     |
| `:root` 亮色主题变量                     | 3-33  |
| `[data-theme="dark"]` 暗色主题变量       | 35-51 |
| Reset（box-sizing, margin, padding） | 53-59 |
| html / body 基础排版                   | 61-76 |
| `::selection`                      | 78-81 |
| `.app-container`                   | 83-87 |

### 文件 2: `layout.css`（\~400 行）

职责：应用外壳结构（侧边栏 + 主内容区）+ 滚动条 + 响应式

| 内容                                                                 | 原始行范围     |
| ------------------------------------------------------------------ | --------- |
| 侧边栏（主体 + 底部 + 收起状态）                                                | 89-303    |
| 主内容区（.main-content, #view-container, .view-toolbar, .view-content） | 304-361   |
| 滚动条美化                                                              | 1228-1246 |
| 响应式媒体查询（768px + 1200px）                                            | 1248-1330 |

### 文件 3: `components.css`（\~830 行）

职责：所有可复用 UI 组件 + 工具类

| 内容                                                      | 原始行范围     |
| ------------------------------------------------------- | --------- |
| 卡片（.card, .card-header, .card-title, .card-body）        | 363-395   |
| 统计卡片（.stats-grid, .stat-card, .stat-value, .stat-label） | 402-440   |
| 按钮（.btn 全系列）                                            | 441-513   |
| 表单（input/select/textarea/form-group/form-row）           | 514-574   |
| 表格（.table, .table-container）                            | 575-612   |
| 工具栏 + 搜索框                                               | 613-673   |
| 空状态 + 加载状态                                              | 674-727   |
| 模态框 + 确认对话框 + Toast                                     | 728-897   |
| 标签 + 分隔线                                                | 898-937   |
| 工具类（文本/间距/Flex）                                         | 939-1016  |
| 工具栏组件（分隔符/视图切换/操作按钮组/批量栏/复选框）                           | 1017-1144 |
| 卡片网格 + item-card                                        | 1145-1227 |

### index.html 加载顺序

```html
<link rel="stylesheet" href="css/variables.css">
<link rel="stylesheet" href="css/layout.css">
<link rel="stylesheet" href="css/components.css">
```

## MODIFIED Requirements

### Requirement: CSS 文件组织

#### Scenario: 开发者维护样式

* **WHEN** 开发者需要修改设计令牌（颜色、间距等）

* **THEN** 仅需编辑 `variables.css`

#### Scenario: 开发者调整布局

* **WHEN** 开发者需要修改侧边栏或主内容区布局

* **THEN** 仅需编辑 `layout.css`

#### Scenario: 开发者修改组件样式

* **WHEN** 开发者需要修改按钮、卡片、模态框等组件

* **THEN** 仅需编辑 `components.css`

