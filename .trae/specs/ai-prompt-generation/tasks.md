# Tasks

- [x] Task 1: 后端 AI 流式调用 Handler
  新建 `internal/handler/ai.go`，实现 AI 流式调用核心逻辑。
  - [x] SubTask 1.1: 定义 `AIHandler` 结构体，包含 `ctx context.Context` 和 `settingsSvc *service.SettingsService`，实现 `Init` 方法
  - [x] SubTask 1.2: 实现 `GeneratePrompt(description string)` 方法：读取 settings 获取 `ai_api_url`/`ai_api_key`/`ai_model`，构建 OpenAI 兼容的 chat completions 请求（system prompt + user message），设置 `stream: true`
  - [x] SubTask 1.3: 使用 `net/http` 发起流式请求，逐行读取 SSE 响应，解析 `data: {...}` 行提取 `choices[0].delta.content`，通过 `runtime.EventsEmit(ctx, "ai:token", token)` 推送 token
  - [x] SubTask 1.4: 处理 `data: [DONE]` 结束标记，推送 `runtime.EventsEmit(ctx, "ai:done", "")` 通知前端
  - [x] SubTask 1.5: 实现 `CancelAIGeneration()` 方法，使用 `context.WithCancel` 取消请求
  - [x] SubTask 1.6: 错误处理：网络错误、API Key 无效、响应状态码非 200 时，推送 `runtime.EventsEmit(ctx, "ai:error", errorMsg)` 到前端

- [x] Task 2: 后端集成到 App 结构体
  将 AIHandler 嵌入 App 并在 startup 中初始化。
  - [x] SubTask 2.1: 在 `app.go` 的 `App` 结构体中嵌入 `handler.AIHandler`
  - [x] SubTask 2.2: 在 `startup` 方法中调用 `a.AIHandler.Init(ctx, settingsSvc)` 初始化

- [x] Task 3: 数据库默认设置
  新增 AI 相关的默认设置项。
  - [x] SubTask 3.1: 在 `internal/db/gorm.go` 的 `initDefaultSettings` 中新增 `ai_api_url`（默认 `https://api.openai.com/v1/chat/completions`）、`ai_api_key`（默认空）、`ai_model`（默认 `gpt-4o-mini`）
  - [x] SubTask 3.2: 在 `internal/service/settings.go` 的 `ResetSettings` 方法的 defaults 列表中新增同样的 3 个 AI 设置项

- [x] Task 4: 前端 API 层
  在 `api.js` 中新增 AI 相关方法。
  - [x] SubTask 4.1: 新增 `API.generatePrompt(description)` 调用 `window.go.main.App.GeneratePrompt`
  - [x] SubTask 4.2: 新增 `API.cancelAIGeneration()` 调用 `window.go.main.App.CancelAIGeneration`

- [x] Task 5: 设置页 AI 配置 UI
  在设置页新增 AI 模型配置分组。
  - [x] SubTask 5.1: 在 `settings.js` 的 `render` 方法中，在"存储"分组之后新增"AI"分组 HTML，包含 API 地址输入框、API Key 密码输入框（带显示/隐藏切换按钮）、模型名称输入框
  - [x] SubTask 5.2: 在 `loadSettings` 方法中加载 `ai_api_url`、`ai_api_key`、`ai_model` 到表单
  - [x] SubTask 5.3: 在保存设置事件中将 AI 配置一并保存（`ai_api_url`、`ai_api_key`、`ai_model`）
  - [x] SubTask 5.4: 实现 API Key 显示/隐藏切换按钮的交互逻辑

- [x] Task 6: Prompt 管理页 AI 生成按钮和流程
  在 Prompt 管理页集成 AI 生成功能。
  - [x] SubTask 6.1: 在 `prompts.js` 的工具栏中，在"新建"按钮左侧新增"AI 生成"按钮（带星星图标）
  - [x] SubTask 6.2: 实现 `openAIGenerateModal()` 方法：打开模态框，包含一句话输入框、"生成"按钮、流式输出展示区域
  - [x] SubTask 6.3: 实现生成流程：点击"生成" → 调用 `API.generatePrompt(description)` → 注册 `runtime.EventsOn("ai:token", ...)` 和 `runtime.EventsOn("ai:done", ...)` 监听 → 实时追加 token 到展示区域
  - [x] SubTask 6.4: 实现"停止生成"按钮：点击后调用 `API.cancelAIGeneration()`，移除事件监听，按钮恢复
  - [x] SubTask 6.5: 实现生成完成处理：解析 AI 返回的 JSON（`{name, content}`），关闭生成模态框，打开新建 Prompt 模态框并填充名称和内容字段
  - [x] SubTask 6.6: 实现错误处理：API 未配置时提示用户去设置页；生成失败时在模态框显示错误信息

- [x] Task 7: CSS 样式
  为 AI 生成相关 UI 添加样式。
  - [x] SubTask 7.1: 在 `components.css` 中添加 AI 生成模态框相关样式：流式输出区域（等宽字体、滚动容器）、API Key 输入框的眼睛图标样式、设置页紫色图标
