# Tasks

- [x] Task 1: 后端 Service 层 — 新增批量更新方法
  - [x] SubTask 1.1: 在 `internal/service/prompt.go` 中新增 `BatchUpdateCategory(ids []int64, category string) error` 方法，使用 GORM `Where("id IN ?", ids).Update("category", category)` 实现
  - [x] SubTask 1.2: 在 `internal/service/prompt.go` 中新增 `BatchAddTags(ids []int64, tags []string) error` 方法，逐条读取 → JSON 解析 → 合并去重 → 写回
  - [x] SubTask 1.3: 在 `internal/service/prompt.go` 中新增 `BatchRemoveTags(ids []int64, tags []string) error` 方法，逐条读取 → JSON 解析 → 过滤移除 → 写回
  - [x] SubTask 1.4: 在 `internal/service/prompt.go` 中新增 `BatchSetPin(ids []int64, pinned bool) error` 方法，使用 GORM `Where("id IN ?", ids).Update("is_pinned", pinned)` 实现
  - [x] SubTask 1.5: 在 `internal/service/skill.go` 中新增 `BatchAddTags(ids []int64, tags []string) error` 方法（与 Prompt 版本逻辑一致）
  - [x] SubTask 1.6: 在 `internal/service/skill.go` 中新增 `BatchRemoveTags(ids []int64, tags []string) error` 方法
  - [x] SubTask 1.7: 在 `internal/service/skill.go` 中新增 `BatchSetPin(ids []int64, pinned bool) error` 方法

- [x] Task 2: 后端 Handler 层 — 新增批量更新 Handler 方法
  - [x] SubTask 2.1: 在 `internal/handler/prompt.go` 中新增 4 个 Handler 方法（BatchUpdateCategory、BatchAddTags、BatchRemoveTags、BatchSetPin），透传到 Service 层
  - [x] SubTask 2.2: 在 `internal/handler/skill.go` 中新增 3 个 Handler 方法（BatchAddSkillTags、BatchRemoveSkillTags、BatchSetPinSkill），透传到 Service 层

- [x] Task 3: 前端 API 层 — 新增批量操作 API 方法
  - [x] SubTask 3.1: 在 `frontend/js/api.js` 中新增 7 个 API 方法：batchUpdateCategory、batchAddPromptTags、batchRemovePromptTags、batchSetPinPrompt、batchAddSkillTags、batchRemoveSkillTags、batchSetPinSkill

- [x] Task 4: 前端通用组件 — 实现"更多操作"下拉菜单组件
  - [x] SubTask 4.1: 在 `frontend/js/components/` 下新建 `dropdown-menu.js` 组件，实现下拉菜单的显示/隐藏/定位/点击外部关闭功能（参考现有 ContextMenu 组件模式）
  - [x] SubTask 4.2: 在 `frontend/index.html` 中引入 `dropdown-menu.js` 脚本

- [x] Task 5: 前端提示词模块 — batch-bar 新增"更多操作"下拉菜单
  - [x] SubTask 5.1: 修改 `frontend/js/views/prompts.js` 的 batch-bar HTML，新增"更多操作"下拉按钮（现有按钮不变）
  - [x] SubTask 5.2: 实现 `handleBatchUpdateCategory()` 方法 — 弹出 Modal 显示分类输入框（支持从已有分类列表选择或新建），确认后调用 API
  - [x] SubTask 5.3: 实现 `handleBatchAddTags()` 方法 — 弹出 Modal 显示标签输入框（逗号分隔），确认后调用 API
  - [x] SubTask 5.4: 实现 `handleBatchRemoveTags()` 方法 — 弹出 Modal 显示当前选中项的已有标签列表（复选框），确认后调用 API
  - [x] SubTask 5.5: 实现 `handleBatchSetPin(pinned)` 方法 — 直接调用 API（无需弹窗），刷新列表
  - [x] SubTask 5.6: 绑定下拉菜单项的点击事件，退出批量管理时关闭下拉菜单

- [x] Task 6: 前端技能模块 — batch-bar 新增"更多操作"下拉菜单
  - [x] SubTask 6.1: 修改 `frontend/js/views/skills.js` 的 batch-bar HTML，新增"更多操作"下拉按钮（现有按钮不变）
  - [x] SubTask 6.2: 实现 `handleBatchAddTags()` 方法 — 弹出 Modal 显示标签输入框，确认后调用 API
  - [x] SubTask 6.3: 实现 `handleBatchRemoveTags()` 方法 — 弹出 Modal 显示已有标签列表（复选框），确认后调用 API
  - [x] SubTask 6.4: 实现 `handleBatchSetPin(pinned)` 方法 — 直接调用 API，刷新列表
  - [x] SubTask 6.5: 绑定下拉菜单项的点击事件，退出批量管理时关闭下拉菜单

- [x] Task 7: 编译验证与 golangci-lint 检查
  - [x] SubTask 7.1: 运行 `go build ./...` 确认编译通过
  - [x] SubTask 7.2: 运行 `golangci-lint run ./...` 确认无告警

# Task Dependencies
- Task 2 depends on Task 1 (Handler 依赖 Service)
- Task 3 depends on Task 2 (API 依赖 Handler)
- Task 4 is independent (可与 Task 1-3 并行)
- Task 5 depends on Task 3, Task 4 (前端依赖 API + 下拉菜单组件)
- Task 6 depends on Task 3, Task 4 (前端依赖 API + 下拉菜单组件)
- Task 7 depends on Task 1, Task 2 (编译验证)
