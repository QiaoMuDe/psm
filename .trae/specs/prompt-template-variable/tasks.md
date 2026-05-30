# Tasks

- [x] Task 1: 数据库迁移 — 添加 is_template 字段
  - [x] SubTask 1.1: 在 `internal/db/sqlite.go` 的建表语句中添加 `is_template INTEGER NOT NULL DEFAULT 0`
  - [x] SubTask 1.2: 在 `internal/db/models.go` 的 Prompt 结构体中添加 `IsTemplate bool` 字段
  - [x] SubTask 1.3: 在 `internal/service/prompt.go` 的所有 SQL 查询中添加 `is_template` 字段

- [x] Task 2: 后端 API 支持模板标记
  - [x] SubTask 2.1: 修改 `CreatePrompt` 和 `UpdatePrompt` 方法，接收 `isTemplate` 参数
  - [x] SubTask 2.2: 修改 `app.go` 的 `CreatePrompt` 和 `UpdatePrompt` 方法签名
  - [x] SubTask 2.3: 修改前端 `api.js` 的 `createPrompt` 和 `updatePrompt` 方法

- [x] Task 3: 编辑弹窗添加模板开关
  - [x] SubTask 3.1: 在 `frontend/js/views/prompts.js` 的编辑弹窗表单中添加"模板"开关
  - [x] SubTask 3.2: 保存/编辑时将 `isTemplate` 值传递给 API
  - [x] SubTask 3.3: 加载 Prompt 时同步模板开关状态

- [x] Task 4: 模板变量解析函数
  - [x] SubTask 4.1: 在 `frontend/js/app.js` 中添加 `parseTemplateVars(content)` 函数
  - [x] SubTask 4.2: 添加 `replaceTemplateVars(content, vars)` 函数

- [x] Task 5: 模板变量填写弹窗
  - [x] SubTask 5.1: 新增 `showTemplateVarsModal(vars, callback)` 弹窗函数
  - [x] SubTask 5.2: 添加弹窗 CSS 样式

- [x] Task 6: 复制逻辑改造
  - [x] SubTask 6.1: 修改卡片/表格视图的复制按钮，检测 `is_template`
  - [x] SubTask 6.2: 模板 Prompt 触发弹窗填写流程，普通 Prompt 保持原有逻辑

- [x] Task 7: 验证
  - [x] SubTask 7.1: 运行 `go vet ./...` 确保代码正确
  - [x] SubTask 7.2: 测试普通 Prompt 复制功能正常
  - [x] SubTask 7.3: 测试模板 Prompt 复制弹窗填写替换功能正常

# Task Dependencies

- Task 2 依赖 Task 1（数据库需要先有 is_template 字段）
- Task 3 依赖 Task 2（前端调用 API）
- Task 4 和 Task 5 可并行
- Task 6 依赖 Task 3、Task 4、Task 5
- Task 7 依赖 Task 6
