# Tasks

- [x] Task 1: 数据库迁移 — 添加索引和 is_pinned 字段
  - [x] SubTask 1.1: 在 `internal/db/sqlite.go` 的建表语句中添加索引创建
  - [x] SubTask 1.2: 为 `prompts` 和 `skills` 表添加 `is_pinned` 字段（DEFAULT 0）

- [x] Task 2: 后端 Service 层支持置顶
  - [x] SubTask 2.1: 修改 `internal/service/prompt.go` 的 `GetPrompts` 方法，排序改为 `is_pinned DESC, updated_at DESC`
  - [x] SubTask 2.2: 在 `PromptService` 中新增 `TogglePinPrompt(id int64) error` 方法
  - [x] SubTask 2.3: 修改 `internal/service/skill.go` 的 `GetSkills` 方法，排序改为 `is_pinned DESC, updated_at DESC`
  - [x] SubTask 2.4: 在 `SkillService` 中新增 `TogglePinSkill(id int64) error` 方法

- [x] Task 3: App 层暴露置顶 API
  - [x] SubTask 3.1: 在 `app.go` 中新增 `TogglePinPrompt(id int64) error` 方法
  - [x] SubTask 3.2: 在 `app.go` 中新增 `TogglePinSkill(id int64) error` 方法

- [x] Task 4: 前端 API 层
  - [x] SubTask 4.1: 在 `frontend/js/api.js` 中新增 `togglePinPrompt` 和 `togglePinSkill` 方法

- [x] Task 5: 前端 Prompt 置顶交互
  - [x] SubTask 5.1: 在 `frontend/js/views/prompts.js` 的卡片和表格视图中添加置顶按钮
  - [x] SubTask 5.2: 绑定置顶按钮点击事件，调用 API 并刷新列表

- [x] Task 6: 前端 Skill 置顶交互
  - [x] SubTask 6.1: 在 `frontend/js/views/skills.js` 的卡片和表格视图中添加置顶按钮
  - [x] SubTask 6.2: 绑定置顶按钮点击事件，调用 API 并刷新列表

- [x] Task 7: app.go 重构为 Handler 嵌入模式
  - [x] SubTask 7.1: 创建 `internal/handler/settings.go`，定义 SettingsHandler 结构体并移动设置相关方法
  - [x] SubTask 7.2: 创建 `internal/handler/prompt.go`，定义 PromptHandler 结构体并移动 Prompt 相关方法
  - [x] SubTask 7.3: 创建 `internal/handler/skill.go`，定义 SkillHandler 结构体并移动 Skill 相关方法
  - [x] SubTask 7.4: 创建 `internal/handler/backup.go`，定义 BackupHandler 结构体并移动备份恢复和数据统计方法
  - [x] SubTask 7.5: 修改 `app.go`，嵌入所有 Handler 结构体，清理原方法

- [x] Task 8: 验证
  - [x] SubTask 8.1: 运行 `go vet ./...` 确保代码正确
  - [x] SubTask 8.2: 验证所有功能正常工作

# Task Dependencies

- Task 2 依赖 Task 1（数据库需要先有 is_pinned 字段）
- Task 3 依赖 Task 2（App 层调用 Service 层）
- Task 4 依赖 Task 3（前端调用 App 层）
- Task 5 依赖 Task 4（前端使用 API）
- Task 6 依赖 Task 4（前端使用 API）
- Task 7 可与 Task 1-6 并行（独立重构）
