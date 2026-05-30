# 标签搜索与点击筛选 Spec

## Why

当前提示词模块的标签功能仅用于展示，无法通过搜索匹配标签内容，也无法点击标签进行快速筛选。用户在管理大量带标签的提示词时，需要更高效的标签检索和筛选能力。

## What Changes

- 搜索功能扩展：搜索关键词同时匹配 name、content 和 tags 字段
- 标签点击筛选：点击卡片/表格中的标签，自动按该标签筛选提示词列表
- 标签筛选状态显示：显示当前筛选的标签，支持清除筛选

## Impact

- Affected specs: 无现有 spec 受影响
- Affected code:
  - `internal/service/prompt.go` — 修改 GetPrompts 方法，搜索条件增加 tags 字段匹配
  - `frontend/js/views/prompts.js` — 标签元素添加点击事件，增加标签筛选状态管理
  - `frontend/css/components.css` — 标签可点击样式、筛选状态样式

## ADDED Requirements

### Requirement: 标签搜索

系统 SHALL 在搜索时同时匹配提示词的名称、内容和标签字段。

#### Scenario: 搜索匹配标签

- **WHEN** 用户在搜索框输入关键词
- **THEN** 系统返回名称、内容或标签中包含该关键词的所有提示词
- **AND** 标签匹配使用 LIKE 模糊匹配（如搜索 "ai" 可匹配标签 "AI工具"）

#### Scenario: 搜索与分类筛选组合

- **WHEN** 用户同时使用搜索框和分类筛选
- **THEN** 系统返回同时满足搜索条件和分类条件的提示词

### Requirement: 标签点击筛选

系统 SHALL 支持点击标签自动筛选提示词列表。

#### Scenario: 点击卡片标签

- **WHEN** 用户点击卡片视图中某个提示词的标签
- **THEN** 系统自动按该标签筛选，仅显示包含该标签的提示词
- **AND** 搜索框清空，分类筛选恢复为"所有分类"
- **AND** 工具栏下方显示标签筛选状态（如 "标签: ai" + 清除按钮）

#### Scenario: 点击表格标签

- **WHEN** 用户点击表格视图中某行的标签
- **THEN** 行为与卡片视图一致，自动按该标签筛选

#### Scenario: 清除标签筛选

- **WHEN** 用户点击筛选状态栏的"清除"按钮
- **THEN** 系统清除标签筛选，恢复显示所有提示词

#### Scenario: 搜索时清除标签筛选

- **WHEN** 用户在有标签筛选状态下输入搜索关键词
- **THEN** 系统自动清除标签筛选，改为按搜索关键词筛选

### Requirement: 标签可点击样式

系统 SHALL 为可点击的标签提供视觉反馈。

#### Scenario: 标签悬停效果

- **WHEN** 用户将鼠标悬停在可点击的标签上
- **THEN** 标签显示悬停效果（如背景色变化、cursor: pointer）

## MODIFIED Requirements

### Requirement: 搜索功能

搜索功能 SHALL 从当前的 name + content 扩展为 name + content + tags 三字段匹配。

## REMOVED Requirements

无
