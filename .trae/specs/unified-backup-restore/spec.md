# 统一数据备份与恢复 Spec

## Why

当前 Prompt 和 Skill 各自的导入导出功能比较繁琐，无法一次性迁移所有数据。用户需要在设置页面提供统一的备份和恢复功能，将数据库设置、所有 Prompt 和所有 Skill（含文件）打包到一个压缩包中，方便迁移到其他电脑直接使用。

## What Changes

- 新增统一备份功能：将 settings 表、prompts 表、skills 表数据 + Skill 文件系统打包为一个 ZIP 备份包
- 新增统一恢复功能：从 ZIP 备份包解压并恢复所有数据
- 在设置页面新增「数据备份」和「数据恢复」两个操作区域
- 备份包格式：ZIP，内部结构为 `psm-backup/data.json` + `psm-backup/skills/` 目录

## Impact

- Affected specs: 设置视图（settings.js）
- Affected code: app.go、service 层、utils 层、前端设置页面

## ADDED Requirements

### Requirement: 统一数据备份

系统 SHALL 提供一键备份功能，将所有应用数据打包为 ZIP 文件。

#### Scenario: 备份成功

- **WHEN** 用户在设置页面点击「备份数据」按钮
- **THEN** 系统弹出文件保存对话框，用户选择保存位置后，生成包含以下内容的 ZIP 文件：
  - `data.json`：包含 settings、prompts、skills 三张表的所有数据
  - `skills/` 目录：包含所有 Skill 的实际文件（按 relative_path 组织）

#### Scenario: 备份数据为空

- **WHEN** 用户点击「备份数据」但数据库中无任何 Prompt 和 Skill
- **THEN** 系统仍生成备份包（仅包含 settings 和空的 skills 目录）

### Requirement: 统一数据恢复

系统 SHALL 提供从备份包恢复数据的功能。

#### Scenario: 恢复成功

- **WHEN** 用户在设置页面点击「恢复数据」按钮并选择有效的 PSM 备份 ZIP 文件
- **THEN** 系统执行以下操作：
  1. 解压 ZIP 到临时目录
  2. 解析 `data.json` 获取 settings、prompts、skills 数据
  3. 将 Skill 文件复制到当前 skill_storage_path 目录
  4. 插入/更新 settings 表数据
  5. 插入 prompts 和 skills 表数据（同名跳过，避免重复）
  6. 返回恢复结果统计（恢复了多少条 Prompt、多少个 Skill）

#### Scenario: 恢复失败 - 无效文件

- **WHEN** 用户选择的 ZIP 文件不包含 `data.json`
- **THEN** 系统显示错误提示「备份文件格式无效」

#### Scenario: 恢复失败 - 文件损坏

- **WHEN** ZIP 文件损坏或 data.json 解析失败
- **THEN** 系统显示错误提示「备份文件损坏，无法恢复」

### Requirement: 备份包格式

备份包 SHALL 使用标准 ZIP 格式，内部结构如下：

```
psm-backup/
├── data.json          # 所有数据库数据
└── skills/            # Skill 文件目录
    ├── skill-name-1/
    │   ├── SKILL.md
    │   └── ...
    └── skill-name-2/
        └── ...
```

`data.json` 格式：
```json
{
  "version": "1.0",
  "created_at": "2026-05-30T10:00:00Z",
  "settings": { "key": "value", ... },
  "prompts": [ { "name": "...", "content": "...", ... } ],
  "skills": [ { "name": "...", "description": "...", "relative_path": "...", ... } ]
}
```

## MODIFIED Requirements

### Requirement: 设置页面

设置页面 SHALL 在现有配置项下方新增「数据管理」区域，包含备份和恢复两个操作。

## REMOVED Requirements

无
