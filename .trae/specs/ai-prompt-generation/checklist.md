# Checklist

## 后端
- [x] `internal/handler/ai.go` 文件存在，定义了 `AIHandler` 结构体和 `Init`、`GeneratePrompt`、`CancelAIGeneration` 方法
- [x] `GeneratePrompt` 方法正确读取 settings 中的 `ai_api_url`、`ai_api_key`、`ai_model`
- [x] `GeneratePrompt` 方法构建了符合 OpenAI chat completions 格式的请求体（含 system prompt 和 stream: true）
- [x] 流式响应逐行解析 SSE 格式（`data: ` 前缀），正确提取 `choices[0].delta.content`
- [x] 每个 token 通过 `runtime.EventsEmit(ctx, "ai:token", token)` 推送到前端
- [x] 流结束时推送 `runtime.EventsEmit(ctx, "ai:done", "")`
- [x] 错误时推送 `runtime.EventsEmit(ctx, "ai:error", errorMsg)`
- [x] `CancelAIGeneration` 方法能有效终止正在进行的 HTTP 请求（通过 context.WithCancel）
- [x] `app.go` 的 `App` 结构体已嵌入 `handler.AIHandler`
- [x] `app.go` 的 `startup` 方法已调用 `a.AIHandler.Init(ctx, settingsSvc)`

## 数据库默认设置
- [x] `internal/db/gorm.go` 的 `initDefaultSettings` 包含 `ai_api_url`、`ai_api_key`、`ai_model` 三个默认设置
- [x] `internal/service/settings.go` 的 `ResetSettings` 包含同样的 3 个 AI 默认设置

## 前端 API
- [x] `api.js` 包含 `API.generatePrompt(description)` 方法
- [x] `api.js` 包含 `API.cancelAIGeneration()` 方法

## 设置页 UI
- [x] 设置页在"存储"分组之后显示"AI"分组
- [x] AI 分组包含 API 地址输入框，默认值为 `https://api.openai.com/v1/chat/completions`
- [x] AI 分组包含 API Key 密码输入框，带显示/隐藏切换按钮
- [x] AI 分组包含模型名称输入框，默认值为 `gpt-4o-mini`
- [x] 保存设置时 AI 配置正确持久化到数据库
- [x] API Key 显示/隐藏切换按钮功能正常

## AI 生成功能
- [x] Prompt 管理页工具栏显示"AI 生成"按钮
- [x] 点击"AI 生成"按钮打开生成模态框
- [x] 未配置 API Key 时点击生成按钮显示提示（要求先去设置页配置）
- [x] 输入描述并点击生成后，后端正确发起流式请求
- [x] 流式 token 实时显示在模态框的输出区域
- [x] 生成过程中按钮显示"生成中..."且禁用，停止按钮显示
- [x] "停止生成"按钮能有效终止流式输出
- [x] 生成完成后自动解析 JSON 响应（name + content）
- [x] 生成完成后关闭生成模态框，打开新建 Prompt 模态框
- [x] AI 生成的名称和内容正确填充到新建 Prompt 表单
- [x] 生成失败时在模态框显示错误信息，按钮恢复可用

## 样式
- [x] AI 生成模态框的流式输出区域使用等宽字体、有滚动容器
- [x] API Key 输入框的眼睛图标样式正确
- [x] 设置页 AI 分组紫色图标样式正确

## 构建验证
- [x] `go build ./...` 编译成功
- [x] `golangci-lint run ./...` 通过（0 issues）
