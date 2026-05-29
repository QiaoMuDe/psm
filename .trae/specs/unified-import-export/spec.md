# 统一导入导出格式 Spec

## Why

当前 Skill 导出时为每个 Skill 生成独立 ZIP 文件，文件数量多、管理不便。提示词导出为单个 JSON 文件，不支持选择性导出。需要统一导出格式，支持选择性导出（单个/多个/全部），并保持导入流程兼容。

## What Changes

- **Skill 导出**：改为统一 ZIP 格式，内含 `metadata.json` + 所有 Skill 目录
- **Skill 导入**：保持现有流程，支持从 ZIP 中识别并导入单个或多个 Skill
- **Prompt 导出**：保持 JSON 格式，支持选择性导出（单个/多个/全部）
- **Prompt 导入**：保持现有流程，支持从 JSON 中导入
- **批量导出**：未选择时导出全部，选择多个时导出选中的

## Impact

- Affected code: app.go、service/skill.go、service/prompt.go、utils/archive.go、前端 skills.js/prompts.js

## 导出格式定义

### Skill 导出格式

ZIP 文件内部结构：

```
skill-export/
├── metadata.json       # 所有导出 Skill 的元数据
└── skills/
    ├── skill-name-1/
    │   ├── SKILL.md
    │   └── ...
    └── skill-name-2/
        └── ...
```

`metadata.json` 格式：
```json
{
  "version": "1.0",
  "type": "skills",
  "skills": [
    {
      "name": "skill-name",
      "description": "技能描述",
      "version": "1.0.0",
      "relative_path": "skill-name"
    }
  ]
}
```

### Prompt 导出格式

JSON 文件格式（与现有兼容）：
```json
[
  {
    "name": "prompt-name",
    "content": "提示词内容",
    "category": "分类",
    "tags": ["tag1", "tag2"]
  }
]
```

## ADDED Requirements

### Requirement: Skill 统一导出

系统 SHALL 将选中的 Skill（或全部）打包为一个 ZIP 文件，包含 `metadata.json` 和所有 Skill 文件目录。

#### Scenario: 导出全部 Skill

- **WHEN** 用户在 Skill 页面点击导出按钮（未选择任何 Skill）
- **THEN** 系统将所有 Skill 打包为一个 ZIP 文件

#### Scenario: 导出选中的 Skill

- **WHEN** 用户选择一个或多个 Skill 后点击导出按钮
- **THEN** 系统仅将选中的 Skill 打包为一个 ZIP 文件

#### Scenario: 导出单个 Skill

- **WHEN** 用户在 Skill 列表中点击某个 Skill 的导出按钮
- **THEN** 系统将该 Skill 打包为一个 ZIP 文件

### Requirement: Skill 统一导入

系统 SHALL 支持从两种格式的 ZIP 文件导入 Skill。

#### Scenario: 导入公共格式 ZIP（含 SKILL.md）

- **WHEN** 用户选择的 ZIP 文件根目录包含 SKILL.md
- **THEN** 系统按现有流程导入单个 Skill

#### Scenario: 导入导出格式 ZIP（含 skills 目录 + metadata.json）

- **WHEN** 用户选择的 ZIP 文件包含 `metadata.json` 和 `skills/` 目录
- **THEN** 系统解析 metadata.json 获取元数据，逐个导入 skills 目录下的所有 Skill，同名跳过

#### Scenario: 自动识别格式

- **WHEN** 用户选择 ZIP 文件
- **THEN** 系统自动检测格式：优先检查是否有 `metadata.json`（新格式），其次检查是否有 `SKILL.md`（公共格式）

### Requirement: Prompt 选择性导出

系统 SHALL 支持选择性导出 Prompt，未选择时导出全部。

#### Scenario: 导出全部 Prompt

- **WHEN** 用户在 Prompt 页面点击导出按钮（未选择任何 Prompt）
- **THEN** 系统将所有 Prompt 导出为 JSON 文件

#### Scenario: 导出选中的 Prompt

- **WHEN** 用户选择一个或多个 Prompt 后点击导出按钮
- **THEN** 系统仅将选中的 Prompt 导出为 JSON 文件

## MODIFIED Requirements

### Requirement: Skill 导出按钮行为

导出按钮点击时，根据当前选中状态决定导出范围：
- 无选中 → 导出全部
- 有选中 → 仅导出选中的

### Requirement: Prompt 导出按钮行为

导出按钮点击时，根据当前选中状态决定导出范围：
- 无选中 → 导出全部
- 有选中 → 仅导出选中的

## REMOVED Requirements

### Requirement: Skill 逐个导出

**Reason**: 改为统一 ZIP 格式，不再为每个 Skill 生成独立文件
**Migration**: 现有单个 ZIP 导入功能保持兼容
