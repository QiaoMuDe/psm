# Prompt 模板变量 Spec

## Why

Prompt 经常需要动态内容（如项目名、语言、风格），当前复制功能只支持直接复制原文，无法自动替换占位符。启用模板后，复制时弹窗填写变量并自动替换。

## What Changes

- 数据库 `prompts` 表新增 `is_template` 字段（INTEGER DEFAULT 0）
- 新增模板变量填写弹窗组件
- 复制按钮逻辑：普通 Prompt 直接复制，模板 Prompt 弹窗填写后复制

## 用户流程

```
1. 编辑 Prompt → 启用"模板"开关
2. 在内容中写入 {{变量名}} 占位符
   例如: "你是一个 {{language}} 专家，请用 {{language}} 编写 {{feature}}"
3. 保存

4. 点击复制按钮
5. 系统解析内容中的 {{xxx}} 占位符
6. 弹出填写弹窗:
   ┌─────────────────────────────┐
   │ 填写模板变量                 │
   │                             │
   │ language                    │
   │ [Go          ]              │
   │                             │
   │ feature                     │
   │ [用户登录    ]              │
   │                             │
   │  [取消]  [复制到剪贴板]      │
   └─────────────────────────────┘
7. 填写或留空（留空则移除占位符文本）
8. 点击"复制到剪贴板"
9. 替换后的内容复制到剪贴板
```

## Impact

- Affected code:
  - `internal/db/sqlite.go` — 新增 `is_template` 字段
  - `internal/db/models.go` — Prompt 结构体新增 `IsTemplate` 字段
  - `internal/service/prompt.go` — SQL 查询和插入增加 `is_template` 字段
  - `frontend/js/views/prompts.js` — 编辑弹窗添加模板开关、复制逻辑改造
  - `frontend/js/components/modal.js` — 新增模板变量填写弹窗
  - `frontend/css/components.css` — 模板开关和弹窗样式

## ADDED Requirements

### Requirement: 模板开关

编辑 Prompt 时 SHALL 显示"模板"开关，持久化到数据库。

#### Scenario: 启用模板

- **WHEN** 用户在编辑弹窗中打开"模板"开关并保存
- **THEN** 该 Prompt 的 `is_template` 字段设为 1

#### Scenario: 模板标记

- **WHEN** Prompt 的 `is_template` 字段为 1
- **THEN** 该 Prompt 被视为模板

### Requirement: 模板变量解析

系统 SHALL 解析 Prompt 内容中的 `{{变量名}}` 占位符。

#### Scenario: 解析变量

- **WHEN** 点击模板 Prompt 的复制按钮
- **THEN** 系统解析内容中的 `{{xxx}}` 占位符
- **AND** 提取所有不重复的变量名
- **AND** 弹出填写弹窗

### Requirement: 模板变量填写弹窗

系统 SHALL 弹出填写弹窗供用户输入变量值。

#### Scenario: 填写弹窗

- **WHEN** 弹窗显示时
- **THEN** 为每个变量显示变量名标签和输入框
- **AND** 输入框默认为空
- **AND** 提供"复制到剪贴板"和"取消"按钮

#### Scenario: 复制替换后内容

- **WHEN** 用户点击"复制到剪贴板"
- **THEN** 用填写的值替换占位符
- **AND** 空值则移除占位符文本
- **AND** 替换后的内容复制到剪贴板
- **AND** 弹窗关闭，Toast 提示"已复制"

#### Scenario: 取消

- **WHEN** 用户点击"取消"
- **THEN** 弹窗关闭，不复制

## REMOVED Requirements

无
