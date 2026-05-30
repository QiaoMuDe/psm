# Tasks

- [x] Task 1: 后端搜索支持标签字段
  - [x] SubTask 1.1: 修改 `internal/service/prompt.go` 的 `GetPrompts` 方法，搜索条件增加 `tags LIKE ?` 匹配
  - [x] SubTask 1.2: 验证搜索功能正常工作

- [x] Task 2: 前端标签点击筛选功能
  - [x] SubTask 2.1: 在 `frontend/js/views/prompts.js` 添加 `currentTag` 状态变量
  - [x] SubTask 2.2: 修改 `loadPrompts` 方法，支持标签筛选参数
  - [x] SubTask 2.3: 为卡片视图中的标签添加点击事件
  - [x] SubTask 2.4: 为表格视图中的标签添加点击事件
  - [x] SubTask 2.5: 添加标签筛选状态栏 UI（显示当前筛选标签 + 清除按钮）
  - [x] SubTask 2.6: 搜索时自动清除标签筛选

- [x] Task 3: 标签可点击样式
  - [x] SubTask 3.1: 在 `frontend/css/components.css` 添加标签可点击样式（cursor: pointer、悬停效果）
  - [x] SubTask 3.2: 添加标签筛选状态栏样式

# Task Dependencies

- Task 2 依赖 Task 1（后端需支持标签筛选）
- Task 3 可与 Task 2 并行
