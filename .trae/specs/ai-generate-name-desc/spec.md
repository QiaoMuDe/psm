# AI 根据内容生成名称/描述 Spec

## Why
导入的技能 SKILL.md 可能缺少 name 或 description frontmatter，编辑时需要手动填写。新增 AI 生成功能，根据已有内容自动填充名称和描述。提示词模块也缺少根据内容生成名称的功能。

## What Changes
- 新增 2 个后端 AI Handler 方法：`GenerateNameFromContent`、`GenerateDescriptionFromContent`
- 新增 2 个系统提示词设置项：`ai_generate_name_prompt`、`ai_generate_desc_prompt`
- 设置页折叠面板内新增 2 个 textarea 配置项
- `models.go` DefaultSettings 新增 2 个默认系统提示词
- 提示词模块新建/编辑模态框名称输入旁新增"生成"按钮
- 技能模块编辑模态框名称和描述输入旁各新增"生成"按钮
- `api.js` 新增 2 个 API 方法

## Impact
- Affected code: `internal/handler/ai.go`、`internal/db/models.go`、`frontend/html/settings.html`、`frontend/js/api.js`、`frontend/js/views/prompts.js`、`frontend/js/views/skills.js`

## ADDED Requirements

### Requirement: GenerateNameFromContent Handler
系统 SHALL 提供 `GenerateNameFromContent(content string) error` 方法，接收提示词内容，通过 `ai_generate_name_prompt` 系统提示词流式生成名称。

#### Scenario: 成功生成
- **WHEN** 前端传入提示词内容
- **THEN** 读取 `ai_generate_name_prompt` 系统提示词，streamChat 流式推送名称到前端

### Requirement: GenerateDescriptionFromContent Handler
系统 SHALL 提供 `GenerateDescriptionFromContent(content string) error` 方法，接收技能 SKILL.md 正文内容，通过 `ai_generate_desc_prompt` 系统提示词流式生成描述。

#### Scenario: 成功生成
- **WHEN** 前端传入 SKILL.md 正文内容
- **THEN** 读取 `ai_generate_desc_prompt` 系统提示词，streamChat 流式推送描述到前端

### Requirement: 提示词模块"生成名称"按钮
提示词新建/编辑模态框的名称输入行 SHALL 在"优化"按钮旁新增"生成"按钮，点击后读取当前内容区域的文本，调用 `GenerateNameFromContent` 流式生成名称到名称输入框。

#### Scenario: 内容为空时点击
- **WHEN** 内容区域为空时点击"生成"
- **THEN** Toast.warning 提示"请先输入提示词内容"

#### Scenario: 有内容时点击
- **WHEN** 内容区域有文本时点击"生成"
- **THEN** 按钮变为 spinner + "生成中..."，名称输入框 readOnly，流式接收 AI 生成的名称，完成后恢复

### Requirement: 技能模块"生成名称/描述"按钮
技能编辑模态框的名称和描述输入行 SHALL 在现有"优化"按钮旁各新增一个"生成"按钮。点击"生成名称"读取 SKILL.md 正文内容生成名称；点击"生成描述"读取正文内容生成描述。

#### Scenario: 使用 SKILL.md 内容
- **WHEN** 用户在编辑技能时点击"生成"
- **THEN** 后端读取 SKILL.md 文件内容（frontmatter 后的正文），传入对应 AI 方法流式生成

## MODIFIED Requirements
- 无（新增功能，不修改现有行为）

## REMoved Requirements
- 无
