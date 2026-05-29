# Tasks

- [x] Task 1: 重新设计 CSS 主内容区布局
  修改 `frontend/css/style.css` 中的布局规则，采用 Flex 布局实现顶部冻结 + 列表独立滚动：
  - [x] SubTask 1.1: 修改 `.main-content` 为 `display: flex; flex-direction: column; overflow: hidden;`，移除 `overflow-y: auto` 和 `padding`
  - [x] SubTask 1.2: 修改 `#view-container` 为 `display: flex; flex-direction: column; flex: 1; overflow: hidden; padding: var(--spacing-4);`
  - [x] SubTask 1.3: 修改 `.main-content > .page-header`：移除 `position: sticky` 相关样式，改为 `flex-shrink: 0; margin-bottom: var(--spacing-3);`
  - [x] SubTask 1.4: 修改 `.main-content > .view-toolbar`：移除 `position: sticky` 相关样式，改为 `flex-shrink: 0; margin-bottom: var(--spacing-3);`
  - [x] SubTask 1.5: 新增 `.view-content` 样式：`flex: 1; overflow-y: auto; min-height: 0;`
  - [x] SubTask 1.6: 在冻结区域底部添加视觉分隔（通过 margin-bottom 间距实现）

- [x] Task 2: 验证所有视图兼容性
  确认布局变更不影响仪表盘、设置、数据管理视图的正常显示：
  - [x] SubTask 2.1: 仪表盘视图正常显示（统计卡片、最近更新列表）— HTML 结构 `.page-header` + `.view-content` 兼容
  - [x] SubTask 2.2: 设置视图正常显示（表单内容完整）— HTML 结构 `.page-header` + `.view-content` 兼容
  - [x] SubTask 2.3: 数据管理视图正常显示（导出/恢复卡片完整）— HTML 结构 `.page-header` + `.view-content` 兼容

- [x] Task 3: 验证列表独立滚动功能
  确认提示词和技能模块的列表视图实现预期效果：
  - [x] SubTask 3.1: 提示词列表视图——Flex 布局链路正确，`.page-header` 和 `.view-toolbar` 为 flex-shrink: 0，`.view-content` 为 flex: 1 + overflow-y: auto
  - [x] SubTask 3.2: 提示词卡片视图——同上结构，卡片网格在 `.view-content` 内滚动
  - [x] SubTask 3.3: 技能列表视图——HTML 结构与提示词一致，布局兼容
  - [x] SubTask 3.4: 技能卡片视图——同上
  - [x] SubTask 3.5: `.view-content` 设为 overflow-y: auto，滚动条出现在其右侧

# Task Dependencies
- Task 2 depends on Task 1
- Task 3 depends on Task 1
