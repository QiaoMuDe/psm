# Tasks

- [x] Task 1: 创建 `variables.css`
  从 `style.css` 中提取设计令牌和基础样式到新文件 `frontend/css/variables.css`：
  - [x] SubTask 1.1: 提取 `@import` 字体声明（第 1 行）
  - [x] SubTask 1.2: 提取 `:root` 亮色主题变量（第 3-33 行）
  - [x] SubTask 1.3: 提取 `[data-theme="dark"]` 暗色主题变量（第 35-51 行）
  - [x] SubTask 1.4: 提取 Reset 样式（第 53-59 行）
  - [x] SubTask 1.5: 提取 html / body / ::selection 基础排版（第 61-81 行）
  - [x] SubTask 1.6: 提取 `.app-container`（第 83-87 行）

- [x] Task 2: 创建 `layout.css`
  从 `style.css` 中提取布局结构和响应式样式到新文件 `frontend/css/layout.css`：
  - [x] SubTask 2.1: 提取侧边栏全部样式（第 89-303 行：主体 + 底部 + 收起状态）
  - [x] SubTask 2.2: 提取主内容区样式（第 304-361 行：.main-content, #view-container, .view-toolbar, .view-content）
  - [x] SubTask 2.3: 提取滚动条美化样式（第 1228-1246 行）
  - [x] SubTask 2.4: 提取响应式媒体查询（第 1248-1330 行：768px + 1200px 断点）

- [x] Task 3: 创建 `components.css`
  从 `style.css` 中提取所有 UI 组件和工具类到新文件 `frontend/css/components.css`：
  - [x] SubTask 3.1: 提取卡片样式（第 363-395 行 + 第 402-440 行）
  - [x] SubTask 3.2: 提取按钮样式（第 441-513 行）
  - [x] SubTask 3.3: 提取表单样式（第 514-574 行）
  - [x] SubTask 3.4: 提取表格样式（第 575-612 行）
  - [x] SubTask 3.5: 提取工具栏 + 搜索框（第 613-673 行）
  - [x] SubTask 3.6: 提取空状态 + 加载状态（第 674-727 行）
  - [x] SubTask 3.7: 提取模态框 + 确认对话框 + Toast（第 728-897 行）
  - [x] SubTask 3.8: 提取标签 + 分隔线（第 898-937 行）
  - [x] SubTask 3.9: 提取工具类（第 939-1016 行）
  - [x] SubTask 3.10: 提取工具栏组件（第 1017-1144 行）
  - [x] SubTask 3.11: 提取卡片网格 + item-card（第 1145-1227 行）

- [x] Task 4: 修改 `index.html` 引用
  - [x] SubTask 4.1: 将 `<link rel="stylesheet" href="css/style.css">` 替换为 3 个 `<link>` 标签，按 variables → layout → components 顺序引用

- [x] Task 5: 删除原始 `style.css`
  - [x] SubTask 5.1: 确认 3 个新文件内容完整后，删除 `frontend/css/style.css`

- [x] Task 6: 验证
  - [x] SubTask 6.1: 确认 `variables.css` 行数约 100 行，包含所有 CSS 变量和 Reset
  - [x] SubTask 6.2: 确认 `layout.css` 行数约 400 行，包含侧边栏 + 主内容区 + 响应式
  - [x] SubTask 6.3: 确认 `components.css` 行数约 830 行，包含所有组件和工具类
  - [x] SubTask 6.4: 确认 `index.html` 正确引用 3 个文件
  - [x] SubTask 6.5: 确认原始 `style.css` 已删除
  - [x] SubTask 6.6: 确认 3 个文件行数之和 = 原始文件行数（1328 vs 1330，差异为末尾空行）

# Task Dependencies
- Task 4 depends on Task 1, Task 2, Task 3
- Task 5 depends on Task 4
- Task 6 depends on Task 5
