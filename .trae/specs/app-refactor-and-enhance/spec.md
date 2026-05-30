# app.go 拆分 + 数据库索引 + 置顶功能 Spec

## Why

1. `app.go` 当前有 40+ 个方法，职责混杂，维护困难
2. 数据库缺少索引，随着数据量增长查询性能会下降
3. 用户希望常用 Prompt/Skill 能置顶显示，便于快速访问

## What Changes

- **app.go 重构**：创建 `internal/handler/` 子包，将方法按领域拆分为 `SettingsHandler`、`PromptHandler`、`SkillHandler`、`BackupHandler`，通过结构体嵌入到 App
- **数据库索引**：为 `prompts` 和 `skills` 表的常用查询字段添加索引
- **置顶功能**：`prompts` 和 `skills` 表新增 `is_pinned` 字段，置顶项优先排列

## 项目结构变化

```
psm/
├── main.go              # Wails 入口（不变）
├── app.go               # App 结构体 + 嵌入 Handler（精简）
├── internal/
│   ├── handler/         # 新增 Handler 子包
│   │   ├── settings.go  # SettingsHandler
│   │   ├── prompt.go    # PromptHandler
│   │   ├── skill.go     # SkillHandler
│   │   └── backup.go    # BackupHandler
│   ├── db/
│   ├── service/
│   └── utils/
```

## Impact

- Affected code:
  - `app.go` — 精简为结构体定义 + 嵌入 Handler
  - `internal/handler/` — 新增，包含 4 个 Handler 文件
  - `internal/db/sqlite.go` — 添加索引和新字段
  - `internal/service/prompt.go` — 支持置顶排序
  - `internal/service/skill.go` — 支持置顶排序
  - `frontend/js/views/prompts.js` — 添加置顶按钮
  - `frontend/js/views/skills.js` — 添加置顶按钮
  - `frontend/js/api.js` — 新增置顶 API

## ADDED Requirements

### Requirement: app.go 重构为 Handler 嵌入模式

系统 SHALL 创建 `internal/handler/` 子包，将 App 的方法按领域拆分为 Handler，通过结构体嵌入到 App。

#### Scenario: Handler 拆分

- **WHEN** 重构完成
- **THEN** `app.go` 仅保留 App 结构体定义、startup/shutdown 生命周期方法、以及嵌入的 Handler
- **AND** `internal/handler/settings.go` 定义 `SettingsHandler` 结构体，包含所有设置相关方法
- **AND** `internal/handler/prompt.go` 定义 `PromptHandler` 结构体，包含所有 Prompt 相关方法
- **AND** `internal/handler/skill.go` 定义 `SkillHandler` 结构体，包含所有 Skill 相关方法
- **AND** `internal/handler/backup.go` 定义 `BackupHandler` 结构体，包含备份恢复和数据统计方法

#### Scenario: App 嵌入 Handler

- **WHEN** App 结构体初始化时
- **THEN** App 嵌入所有 Handler 结构体
- **AND** Wails 能正确扫描并绑定所有嵌入的方法

### Requirement: 数据库索引

系统 SHALL 为常用查询字段添加索引。

#### Scenario: 添加索引

- **WHEN** 应用启动时
- **THEN** 为 `prompts` 表添加索引：`category`、`updated_at`
- **AND** 为 `skills` 表添加索引：`updated_at`

### Requirement: 置顶功能

系统 SHALL 支持 Prompt 和 Skill 的置顶功能。

#### Scenario: 置顶 Prompt

- **WHEN** 用户点击 Prompt 的置顶按钮
- **THEN** 该 Prompt 的 `is_pinned` 字段设为 1
- **AND** 列表重新排序，置顶项显示在最前面

#### Scenario: 取消置顶

- **WHEN** 用户再次点击已置顶 Prompt 的置顶按钮
- **THEN** 该 Prompt 的 `is_pinned` 字段设为 0
- **AND** 列表重新排序

#### Scenario: 置顶排序

- **WHEN** 加载 Prompt/Skill 列表
- **THEN** 结果按 `is_pinned DESC, updated_at DESC` 排序
- **AND** 置顶项始终显示在非置顶项之前

## MODIFIED Requirements

### Requirement: Prompt 列表排序

Prompt 列表 SHALL 从当前的 `updated_at DESC` 改为 `is_pinned DESC, updated_at DESC`。

### Requirement: Skill 列表排序

Skill 列表 SHALL 从当前的 `updated_at DESC` 改为 `is_pinned DESC, updated_at DESC`。

## REMOVED Requirements

无
