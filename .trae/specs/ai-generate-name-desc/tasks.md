# Tasks

- [x] Task 1: 后端新增 AI 方法
  - [x] SubTask 1.1: 在 `internal/handler/ai.go` 新增 `GenerateNameFromContent(content string) error`，使用 `ai_generate_name_prompt` 系统提示词调用 streamChat
  - [x] SubTask 1.2: 在 `internal/handler/ai.go` 新增 `GenerateDescriptionFromContent(content string) error`，使用 `ai_generate_desc_prompt` 系统提示词调用 streamChat

- [x] Task 2: 默认设置 + 设置页
  - [x] SubTask 2.1: 在 `internal/db/models.go` DefaultSettings 中新增 `ai_generate_name_prompt` 和 `ai_generate_desc_prompt` 两个默认系统提示词
  - [x] SubTask 2.2: 在 `frontend/html/settings.html` 折叠面板内新增 2 个 textarea 配置项（生成名称/生成描述系统提示）
  - [x] SubTask 2.3: 在 `frontend/js/views/settings.js` 加载/保存逻辑中新增 2 个字段的读写

- [x] Task 3: 前端 API + 交互
  - [x] SubTask 3.1: 在 `frontend/js/api.js` 新增 `generateNameFromContent` 和 `generateDescriptionFromContent` API 方法
  - [x] SubTask 3.2: 在 `frontend/js/views/prompts.js` 新建/编辑/AI生成模态框名称行新增"生成"按钮 + 绑定事件
  - [x] SubTask 3.3: 在 `frontend/js/views/skills.js` 编辑模态框名称和描述行各新增"生成"按钮 + 绑定事件

# Task Dependencies
- Task 3 depends on Task 1（前端调用后端新增 API）
- Task 3 依赖 Task 2（设置页配置项是后端读取的前提）
