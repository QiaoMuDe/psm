# Tasks

- [x] Task 1: 搜索防抖 — 在 prompts.js 和 skills.js 中为搜索输入添加 100ms 防抖
  - [x] SubTask 1.1: 在 prompts.js 的 `#prompt-search` input 事件中用 `setTimeout/clearTimeout` 实现 100ms 防抖
  - [x] SubTask 1.2: 在 skills.js 的 `#skill-search` input 事件中用 `setTimeout/clearTimeout` 实现 100ms 防抖

- [x] Task 2: 提示词字符数显示 — 在新建/编辑/查看弹窗中添加内容字符数
  - [x] SubTask 2.1: 在 `openCreateModal()` 的 textarea 下方添加字符数显示元素，绑定 input 事件实时更新
  - [x] SubTask 2.2: 在 `openEditModal()` 的 textarea 下方添加字符数显示元素，绑定 input 事件实时更新
  - [x] SubTask 2.3: 在 `viewPrompt()` 的内容区域标题旁显示字符数
  - [x] SubTask 2.4: 在 components.css 中添加 `.char-count` 和 `.char-count-inline` 样式

- [x] Task 3: 后端数据统计 API — 新增 GetDataStats 方法
  - [x] SubTask 3.1: 在 app.go 中新增 `GetDataStats()` 方法，返回提示词总数、技能总数、数据库文件大小
  - [x] SubTask 3.2: 在 frontend/js/api.js 中添加 `getDataStats` 绑定

- [x] Task 4: 后端孤立数据清理 API — 新增 CleanupOrphanSkills 方法
  - [x] SubTask 4.1: 在 internal/service/skill.go 中新增 `GetOrphanSkills()` 方法，检测文件目录不存在的 Skill 记录
  - [x] SubTask 4.2: 在 internal/service/skill.go 中新增 `DeleteSkills(ids []int64)` 方法，批量删除指定 ID 的 Skill
  - [x] SubTask 4.3: 在 app.go 中新增 `GetOrphanSkills()` 和 `CleanupOrphanSkills()` 方法
  - [x] SubTask 4.4: 在 frontend/js/api.js 中添加 `getOrphanSkills` 和 `cleanupOrphanSkills` 绑定

- [x] Task 5: 数据管理页面增强 — 添加统计卡片和清理卡片
  - [x] SubTask 5.1: 修改 data.js 的 `render()` 方法，在顶部添加数据统计区域（提示词数、技能数、数据库大小）
  - [x] SubTask 5.2: 在 data.js 中添加 `loadStats()` 方法调用 `API.getDataStats()`
  - [x] SubTask 5.3: 添加孤立数据清理卡片，页面加载时自动检测孤立 Skill 数量
  - [x] SubTask 5.4: 实现清理按钮的点击事件（确认对话框 → 调用清理 API → 刷新统计）

# Task Dependencies

- Task 2 无依赖，可与 Task 1 并行
- Task 3 无依赖，可与 Task 1、2 并行
- Task 4 无依赖，可与 Task 1、2、3 并行
- Task 5 依赖 Task 3 和 Task 4（需要后端 API 就绪）
