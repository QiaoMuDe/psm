# 提示词字符数显示 + 数据管理增强 + 搜索防抖

## Why

1. AI 提示词有 token 长度限制，用户需要快速了解内容字符数以评估是否超出限制
2. 数据管理页面功能单一（仅导入导出），缺少数据统计和孤立数据清理能力
3. 搜索输入框每次按键立即触发查询/过滤，快速输入时产生不必要的中间渲染

## What Changes

- 提示词的新建/编辑/查看弹窗中显示内容字符数
- 数据管理页面新增数据统计卡片（提示词数、技能数、数据库大小）
- 数据管理页面新增孤立数据清理功能（检测并删除文件已不存在的 Skill 数据库记录）
- 提示词和技能模块的搜索输入添加 100ms 防抖

## Impact

- Affected specs: 无现有 spec 受影响
- Affected code:
  - `frontend/js/views/prompts.js` — 编辑/查看弹窗 HTML + 字符数监听 + 搜索防抖
  - `frontend/js/views/skills.js` — 搜索防抖
  - `frontend/js/views/data.js` — 新增统计卡片和清理卡片
  - `frontend/js/api.js` — 新增 `getDataStats()`、`cleanupOrphanSkills()` API 绑定
  - `app.go` — 新增 `GetDataStats()`、`CleanupOrphanSkills()` 方法
  - `internal/service/skill.go` — 新增 `CleanupOrphanSkills()` 方法
  - `internal/service/prompt.go` — 新增 `CountPrompts()` 已存在，可能新增 `GetDBSize()` 工具

## ADDED Requirements

### Requirement: 提示词字符数显示

系统 SHALL 在提示词的新建、编辑、查看弹窗中显示内容的字符数。

#### Scenario: 新建/编辑弹窗显示实时字符数

- **WHEN** 用户打开新建或编辑提示词弹窗
- **THEN** 内容文本框下方显示当前字符数（如"128 字符"）
- **AND** 用户输入/删除内容时字符数实时更新

#### Scenario: 查看弹窗显示字符数

- **WHEN** 用户打开查看提示词弹窗
- **THEN** 内容区域标题旁显示字符数（如"内容（128 字符）"）

### Requirement: 数据统计

系统 SHALL 在数据管理页面展示当前数据的统计概览。

#### Scenario: 展示数据统计

- **WHEN** 用户进入数据管理页面
- **THEN** 页面顶部显示统计信息，包含：
  - 提示词总数
  - 技能总数
  - 数据库文件大小
- **AND** 统计数据从后端实时获取

### Requirement: 孤立数据清理

系统 SHALL 检测并允许用户清理数据库中文件已不存在的 Skill 记录。

#### Scenario: 检测孤立数据

- **WHEN** 用户进入数据管理页面
- **THEN** 系统自动检测数据库中哪些 Skill 的文件目录在磁盘上已不存在
- **AND** 页面显示孤立 Skill 的数量

#### Scenario: 清理孤立数据

- **WHEN** 用户点击"清理"按钮
- **THEN** 弹出确认对话框，显示将要清理的 Skill 数量
- **AND** 用户确认后，从数据库中删除这些孤立记录
- **AND** 清理完成后 Toast 提示清理结果

#### Scenario: 无孤立数据

- **WHEN** 没有孤立数据
- **THEN** 清理区域显示"数据完整，无需清理"

### Requirement: 搜索防抖

系统 SHALL 对提示词和技能模块的搜索输入添加防抖处理。

#### Scenario: 快速输入搜索

- **WHEN** 用户在搜索框中快速连续输入字符
- **THEN** 系统在用户停止输入 100ms 后才执行搜索
- **AND** 不会在每次按键时立即触发搜索

## MODIFIED Requirements

### Requirement: 数据管理页面布局

数据管理页面 SHALL 从当前的两列卡片布局调整为：统计区域（顶部）+ 功能卡片（导出/导入/清理）。

## REMOVED Requirements

无
