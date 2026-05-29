# 列表视图独立滚动修复 Spec

## Why
提示词和技能模块的列表视图中，上下拖动时整个页面（包括页面标题和工具栏）一起滚动，而不是仅列表区域滚动。

## What Changes
- 修改 `.main-content` 布局为 flex column 容器，移除自身 `overflow-y: auto`
- 卡片（`.card`）在主内容区中自动填充剩余高度
- 列表容器（`#prompt-list`、`#skill-list`）独立滚动

## Impact
- Affected code: `frontend/css/style.css`
- 不影响仪表盘、设置、数据管理等视图的显示

## MODIFIED Requirements

### Requirement: 列表视图独立滚动
#### Scenario: 提示词/技能列表过长
- **WHEN** 用户在提示词或技能模块的列表视图中浏览大量数据
- **THEN** 仅列表区域上下滚动，页面标题和工具栏保持固定不动

#### Scenario: 仪表盘等其他视图不受影响
- **WHEN** 用户浏览仪表盘、设置、数据管理等视图
- **THEN** 页面行为与修复前完全一致
