# 搜索高亮 Spec

## Why

搜索结果中无法直观看到关键词匹配位置，高亮显示可以帮助用户快速定位相关内容。

## What Changes

- 新增 `highlightText` 工具函数，将文本中的关键词用 `<mark>` 标签包裹
- Prompt 和 Skill 模块的列表/卡片视图中，搜索结果高亮显示关键词

## Impact

- Affected code:
  - `frontend/js/app.js` — 新增 `highlightText` 工具函数
  - `frontend/js/views/prompts.js` — 渲染时调用高亮函数
  - `frontend/js/views/skills.js` — 渲染时调用高亮函数
  - `frontend/css/components.css` — `<mark>` 标签样式

## ADDED Requirements

### Requirement: 搜索高亮

系统 SHALL 在搜索结果中高亮显示匹配的关键词。

#### Scenario: Prompt 搜索高亮

- **WHEN** 用户输入搜索关键词
- **THEN** Prompt 名称和内容中的匹配文本用高亮样式显示

#### Scenario: Skill 搜索高亮

- **WHEN** 用户输入搜索关键词
- **THEN** Skill 名称和描述中的匹配文本用高亮样式显示

#### Scenario: 无搜索时

- **WHEN** 搜索框为空
- **THEN** 不显示高亮样式

## REMOVED Requirements

无
