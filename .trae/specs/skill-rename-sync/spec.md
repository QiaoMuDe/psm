# Skill 重命名同步 Spec

## Why
编辑技能名字后，仅 DB 和 SKILL.md 更新了，磁盘目录名仍为旧名字，导致三处名称不一致。导出 ZIP 也会使用旧目录名。

## What Changes
- 后端 UpdateSkill 在名字变更时检查目标目录是否已存在，已存在则返回特定错误
- 后端 UpdateSkill 在名字无冲突时执行目录重命名 + 更新 RelativePath
- 前端编辑模态框保存时捕获目录冲突错误，名称输入框红色闪烁 + 浮动提示，不关闭模态框

## Impact
- Affected specs: Skill CRUD、导入导出
- Affected code: `internal/service/skill.go`、`internal/handler/skill.go`、`frontend/js/views/skills.js`、`frontend/css/components.css`

## ADDED Requirements

### Requirement: Skill 重命名时检查目录冲突
系统 SHALL 在 UpdateSkill 检测到名字变更时，验证目标目录（SanitizeFileName(name)）是否已存在且不是当前技能目录。

#### Scenario: 目标目录已存在
- **WHEN** 用户编辑技能名称，新名称对应的目录已存在（且不属于当前技能）
- **THEN** 后端返回错误 `"技能目录名称已存在: {name}"`，不修改任何内容

#### Scenario: 名称未变更
- **WHEN** 用户保存时名称与原名称相同
- **THEN** 跳过目录冲突检测和重命名，仅更新 description/tags/SKILL.md

### Requirement: Skill 重命名时同步目录
系统 SHALL 在名字无冲突时执行目录重命名，并更新 DB 中的 relative_path。

#### Scenario: 成功重命名
- **WHEN** 新名称无冲突
- **THEN** os.Rename(oldDir, newDir) 重命名目录，更新 DB relative_path 为新名称

#### Scenario: 目录重命名失败
- **WHEN** os.Rename 返回错误
- **THEN** 回滚 DB name 和 SKILL.md frontmatter 为旧值，返回错误

### Requirement: 前端名称冲突视觉反馈
前端 SHALL 在保存返回目录冲突错误时，对名称输入框进行红色边框闪烁动画，并在输入框下方浮动显示错误提示文字，模态框保持打开。

#### Scenario: 名称冲突反馈
- **WHEN** 保存 API 返回包含"已存在"的错误
- **THEN** 名称输入框添加 `.input-error-flash` 类（红色边框闪烁 2 次，约 1.2 秒），输入框下方显示红色提示文字，用户可继续编辑

## MODIFIED Requirements

### Requirement: UpdateSkill 方法
UpdateSkill 现在 SHALL:
1. 如果 name 变更: SanitizeFileName → 检测目录冲突 → os.Rename → 更新 RelativePath
2. 始终: 更新 DB（name/description/tags）+ 更新 SKILL.md frontmatter

## REMoved Requirements
- 无
