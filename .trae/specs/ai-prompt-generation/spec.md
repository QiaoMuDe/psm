# AI 一句话生成提示词 Spec

## Why
用户需要手动编写 Prompt，效率较低。通过集成 AI 能力，用户只需输入一句话描述需求，AI 自动生成高质量的提示词（含名称和内容），提升 Prompt 创建效率。

## What Changes
- 新增 AI 模型配置（API 地址、API Key、模型名称）存储到数据库 settings 表
- 设置页新增"AI"配置分组，包含三个输入字段
- Prompt 管理页新增"AI 生成"按钮，触发一句话输入流程
- 后端新增 AI 流式调用 Handler，通过 Wails Events 将 token 逐个推送到前端
- 前端接收流式 token，实时显示在生成结果区域
- 生成完成后，将结果填充到新建 Prompt 模态框的名称和内容字段

## Impact
- Affected specs: 无现有 spec 受影响
- Affected code:
  - `internal/handler/settings.go` — 新增 AI Handler 方法
  - `internal/handler/ai.go` — 新建，AI 流式调用逻辑
  - `internal/db/gorm.go` — 新增 AI 默认设置
  - `internal/service/settings.go` — ResetSettings 新增 AI 默认值
  - `frontend/js/views/settings.js` — 新增 AI 配置 UI
  - `frontend/js/views/prompts.js` — 新增 AI 生成按钮和流程
  - `frontend/js/api.js` — 新增 AI 相关 API 方法
  - `frontend/css/components.css` — AI 生成相关样式

## ADDED Requirements

### Requirement: AI 模型配置
系统 SHALL 在设置页提供 AI 模型配置区域，允许用户配置 API 地址、API Key 和模型名称。

#### Scenario: 首次配置
- **WHEN** 用户进入设置页
- **THEN** 显示"AI"分组，包含 API 地址（默认 `https://api.openai.com/v1/chat/completions`）、API Key（密码输入框，带显示/隐藏切换）、模型名称（默认 `gpt-4o-mini`）三个字段

#### Scenario: 保存配置
- **WHEN** 用户修改 AI 配置并点击"保存设置"
- **THEN** 配置保存到 settings 表（key: `ai_api_url`、`ai_api_key`、`ai_model`），API Key 明文存储在本地 SQLite 数据库

#### Scenario: API Key 安全显示
- **WHEN** 设置页加载时
- **THEN** API Key 字段以密码遮罩形式显示，用户可点击眼睛图标切换明文/密文

### Requirement: AI 一句话生成 Prompt
系统 SHALL 在 Prompt 管理页提供 AI 生成功能，用户输入一句话描述后，AI 实时流式生成提示词内容。

#### Scenario: 触发 AI 生成
- **WHEN** 用户点击 Prompt 管理页工具栏的"AI 生成"按钮
- **THEN** 打开一个模态框，包含一句话输入框、生成按钮和流式输出展示区域

#### Scenario: 未配置 AI 时点击生成
- **WHEN** 用户点击"AI 生成"但未配置 API Key
- **THEN** 提示用户先去设置页配置 AI 模型信息，模态框不打开

#### Scenario: 流式生成过程
- **WHEN** 用户输入描述并点击"生成"
- **THEN** 后端向 AI API 发起流式请求，逐 token 通过 Wails Events 推送到前端，前端实时显示生成内容
- **AND** 生成过程中"生成"按钮变为"生成中..."且禁用，显示加载动画
- **AND** 提供"停止生成"按钮，允许用户中途取消

#### Scenario: 生成完成
- **WHEN** AI 流式输出结束
- **THEN** 自动关闭生成模态框，打开"新建 Prompt"模态框
- **AND** AI 生成的名称填充到"名称"字段，生成的内容填充到"内容"字段
- **AND** 用户可修改后直接保存

#### Scenario: 生成失败
- **WHEN** AI API 调用失败（网络错误、API Key 无效、模型不可用等）
- **THEN** 在生成模态框中显示错误信息，生成按钮恢复可点击状态

### Requirement: AI 流式响应后端
系统 SHALL 提供 OpenAI 兼容的流式 API 调用能力，通过 SSE (Server-Sent Events) 格式解析响应。

#### Scenario: 正常流式响应
- **WHEN** 后端发起流式 API 请求
- **THEN** 逐行解析 SSE 数据（`data: {...}` 格式），提取 `choices[0].delta.content`
- **AND** 每收到一个 token，通过 `runtime.EventsEmit(ctx, "ai:token", token)` 推送到前端
- **AND** 流结束后通过 `runtime.EventsEmit(ctx, "ai:done", "")` 通知前端

#### Scenario: 请求取消
- **WHEN** 用户在前端点击"停止生成"
- **THEN** 前端通过取消 API 调用（调用后端 `CancelAIGeneration` 方法）终止 HTTP 请求
- **AND** 后端关闭 HTTP response body，停止 token 推送

#### Scenario: API 响应格式解析
- **WHEN** 收到 AI API 响应
- **THEN** 解析 OpenAI 标准 SSE 格式：每行以 `data: ` 前缀，内容为 JSON `{"choices":[{"delta":{"content":"token"}}]}`
- **AND** 遇到 `data: [DONE]` 时标记流结束
- **AND** 非 `data:` 开头的行忽略（如 `event:`、空行等）

## MODIFIED Requirements

### Requirement: 默认设置初始化
- **原有**: `initDefaultSettings()` 包含 7 个默认设置
- **修改后**: 新增 `ai_api_url`（默认 `https://api.openai.com/v1/chat/completions`）、`ai_api_key`（默认空）、`ai_model`（默认 `gpt-4o-mini`）

### Requirement: 数据重置
- **原有**: `ResetSettings` 重置 7 个设置项
- **修改后**: 重置列表新增 3 个 AI 设置项

## AI 生成 System Prompt 设计

系统提示词要求 AI 返回 JSON 格式，包含 `name` 和 `content` 两个字段。

**设计原则**：系统提示词本身要精炼但有引导力——不需要长篇大论，但要明确告诉 AI 什么是一个好提示词，以及输出格式要求。

```
你是一个提示词生成器。根据用户的一句话描述，生成一个可直接使用的高质量提示词。

生成要求：
- 提示词应清晰、具体、可执行，避免模糊笼统的描述
- 包含明确的角色设定和任务目标
- 如适用，补充必要的约束条件、输入输出格式或示例
- 内容应为中文

返回格式（严格 JSON，不要包含其他内容）：
{"name": "简短概括性名称", "content": "完整提示词内容"}
```
