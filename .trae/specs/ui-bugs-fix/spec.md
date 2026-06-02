# UI Bugs Fix Spec

## Why
提示词和技能模块存在三个 UI/UX 问题：工具栏多出无意义分隔符、技能导入名字含特殊字符导致路径异常、搜索状态在页面切换后丢失。

## What Changes
- 删除技能工具栏末尾多余的 `toolbar-separator`
- 技能导入时将名字中的文件系统非法字符替换为下划线
- 页面切换时重置搜索状态，搜索框和数据同步清空

## Impact
- Affected specs: 无前置依赖
- Affected code: `frontend/html/skills.html`、`internal/utils/archive.go`、`internal/service/skill.go`、`frontend/js/views/prompts.js`、`frontend/js/views/skills.js`

## MODIFIED Requirements

### Requirement: 技能工具栏分隔符
技能模块工具栏的按钮分组应与提示词模块保持一致，末尾不应有多余的分隔符。

#### Scenario: 技能工具栏渲染
- **WHEN** 用户进入技能模块
- **THEN** 工具栏只在视图切换和操作按钮之间显示一个分隔符，末尾无多余竖杠

### Requirement: 技能导入名字清理
导入技能包时，从 SKILL.md frontmatter 提取的名字中包含的文件系统非法字符（`\ / : * ? " < > |`）应自动替换为下划线，防止目录创建失败或路径混乱。

#### Scenario: 名字含冒号
- **WHEN** SKILL.md 中 name 字段为 `go-kit:core`
- **THEN** 导入后技能名字为 `go-kit_core`，目录名为 `go-kit_core`

#### Scenario: 名字含斜杠
- **WHEN** SKILL.md 中 name 字段为 `go-kit/core`
- **THEN** 导入后技能名字为 `go-kit_core`，目录名为 `go-kit_core`

#### Scenario: 名字无特殊字符
- **WHEN** SKILL.md 中 name 字段为 `go-kit-core`
- **THEN** 导入后技能名字和目录名保持 `go-kit-core` 不变

### Requirement: 搜索状态重置
切换页面后返回时，搜索框应清空，列表展示全部数据，搜索状态不跨页面保留。

#### Scenario: 提示词模块搜索后切换再返回
- **WHEN** 用户在提示词模块搜索 "test"，然后切换到技能模块再切回提示词模块
- **THEN** 搜索框为空，列表显示全部提示词

#### Scenario: 技能模块搜索后切换再返回
- **WHEN** 用户在技能模块搜索 "test"，然后切换到提示词模块再切回技能模块
- **THEN** 搜索框为空，列表显示全部技能
