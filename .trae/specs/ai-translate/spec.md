# AI 翻译模块 Spec

## Why
PSM 当前的 AI 功能覆盖了提示词生成、优化、名称/描述优化，但缺少翻译能力。用户在管理多语言提示词和技能时，需要在外部工具中翻译后再手动导入。新增独立翻译模块，让用户在应用内直接完成翻译，保持原有格式不变。

## What Changes
- 侧边栏新增"翻译"导航项（位于 Skill 管理和数据管理之间）
- 新增独立翻译页面：左侧输入原文、右侧流式显示译文
- 语言选择下拉框（6 种常用语言）+ 交换按钮
- 翻译按钮（复用现有 AI 流式架构，支持"翻译中..."状态 + 重新翻译）
- 两个输入框角落有清空和复制功能 + 字数统计
- 设置页 AI 分组新增翻译系统提示词 textarea
- 快捷键：Ctrl+Enter 翻译、Ctrl+L 清空

## Impact
- Affected specs: backend-logging（日志覆盖新增方法）
- Affected code: ai.go（新方法）、index.html（导航项）、app.js（路由）、api.js（API 封装）、settings.js（提示词配置）、components.css（样式）、新建 translate.js

## ADDED Requirements

### Requirement: 翻译导航项
系统 SHALL 在侧边栏 Skill 管理和数据管理之间提供"翻译"导航项。

#### Scenario: 点击导航项
- **WHEN** 用户点击侧边栏"翻译"导航项
- **THEN** 主内容区加载翻译模块视图，导航项高亮

#### Scenario: 快捷键导航
- **WHEN** 用户按数字键 4
- **THEN** 跳转到翻译模块

### Requirement: 翻译页面布局
系统 SHALL 提供左右分栏布局的翻译页面。

#### Scenario: 页面结构
- **WHEN** 翻译页面加载完成
- **THEN** 页面包含：顶部语言选择栏（左下拉框 + 交换按钮 + 右下拉框 + 翻译按钮）、左侧原文输入区（textarea + 清空/复制按钮 + 字数统计）、右侧译文输出区（textarea + 清空/复制按钮 + 字数统计）

### Requirement: 语言选择
系统 SHALL 支持 6 种常用语言的选择。

#### Scenario: 语言列表
- **WHEN** 用户点击语言下拉框
- **THEN** 显示选项：简体中文、English、日本語、한국어、Français、Deutsch

#### Scenario: 交换语言
- **WHEN** 用户点击交换按钮（←→）
- **THEN** 左右语言选择互换，同时左右文本内容互换

### Requirement: 翻译执行
系统 SHALL 支持流式翻译，译文逐 token 显示。

#### Scenario: 翻译流程
- **WHEN** 用户输入原文、选择目标语言、点击"翻译"按钮
- **THEN** 按钮变为"翻译中..."（loading 状态 + 禁用），后端调用 streamChat 流式返回，译文 textarea 逐字追加显示

#### Scenario: 翻译完成
- **WHEN** 流式翻译结束（收到 ai:done 事件）
- **THEN** 按钮恢复为"翻译"，译文可复制

#### Scenario: 翻译失败
- **WHEN** 翻译过程中发生错误
- **THEN** 按钮恢复，Toast.error 显示错误信息，译文区保留已翻译内容

#### Scenario: 重新翻译
- **WHEN** 译文区已有内容，用户修改原文后再次点击"翻译"
- **THEN** 清空旧译文，重新开始流式翻译

#### Scenario: 空输入校验
- **WHEN** 用户点击"翻译"但原文为空
- **THEN** Toast.warning 提示"请输入要翻译的内容"

### Requirement: 清空和复制
系统 SHALL 在两个输入框下方提供清空和复制功能。

#### Scenario: 原文区清空
- **WHEN** 用户点击原文区"清空"按钮
- **THEN** 原文和译文同时清空

#### Scenario: 译文区清空
- **WHEN** 用户点击译文区"清空"按钮
- **THEN** 只清空译文

#### Scenario: 复制到剪贴板
- **WHEN** 用户点击"复制"按钮
- **THEN** 对应区域内容复制到剪贴板，Toast.success 提示"已复制到剪贴板"

### Requirement: 字数统计
系统 SHALL 在两个输入框下方显示字符数。

#### Scenario: 实时统计
- **WHEN** 原文或译文内容变化
- **THEN** 对应区域下方显示"N 字"统计

### Requirement: 翻译系统提示词
系统 SHALL 在设置页提供翻译系统提示词的配置。

#### Scenario: 设置页显示
- **WHEN** 用户打开设置页 AI 分组
- **THEN** 显示翻译系统提示词 textarea，默认值为专业翻译指令

#### Scenario: 系统提示词保存
- **WHEN** 用户修改翻译系统提示词并点击"保存设置"
- **THEN** 提示词保存到数据库 settings 表 `ai_translate_prompt` 键

### Requirement: 快捷键
系统 SHALL 在翻译模块提供快捷键支持。

#### Scenario: Ctrl+Enter 翻译
- **WHEN** 用户在翻译页面按 Ctrl+Enter
- **THEN** 触发翻译操作（等同于点击"翻译"按钮）

#### Scenario: Ctrl+L 清空
- **WHEN** 用户在翻译页面按 Ctrl+L
- **THEN** 清空原文和译文

## MODIFIED Requirements

### Requirement: 侧边栏导航
侧边栏导航项从 5 个增加到 6 个，快捷键映射调整。

- 仪表盘 → 1，Prompt 管理 → 2，Skill 管理 → 3，翻译 → 4，数据管理 → 5，设置 → 6

## REMOVED Requirements
无
