# ZIP 中文文件名编码修复 Spec

## Why
导入包含中文目录名的 ZIP 文件时，文件名变成乱码。根本原因是中文 Windows 工具（WinRAR、资源管理器等）创建 ZIP 时使用 GBK 编码但不设置 UTF-8 标志位，Go 的 `archive/zip` 按 CP437 解码导致乱码。

## What Changes
- 在 `internal/utils/archive.go` 新增 `FixFileName` 函数，检测并修复非 UTF-8 编码的 ZIP 条目文件名
- 修改 `UnzipToDir`、`UnzipPrefixToDir` 函数，在读取 `file.Name` 后统一经过编码修复
- 修改 `internal/service/skill.go` 中 `ImportSkillFromExportZip` 函数，对 `file.Name` 应用编码修复
- 利用已有的 `golang.org/x/text` 间接依赖（v0.22.0），引入 GB18030/CP437 编解码器

## Impact
- Affected specs: `unified-import-export`（技能导入功能）
- Affected code:
  - `internal/utils/archive.go` — 新增函数 + 修改 UnzipToDir、UnzipPrefixToDir
  - `internal/service/skill.go` — 修改 ImportSkillFromExportZip
  - `go.mod` — `golang.org/x/text` 从 indirect 提升为 direct

## ADDED Requirements

### Requirement: ZIP 文件名编码自动修复
系统 SHALL 在读取 ZIP 条目文件名时，自动检测非 UTF-8 编码并尝试修复为正确的中文文件名。

#### Scenario: GBK 编码文件名（UTF-8 标志未设置）
- **WHEN** 用户导入包含中文目录名的 ZIP 文件（GBK 编码，UTF-8 标志未设置）
- **THEN** 系统正确显示中文目录名，文件解压到正确的中文路径下

#### Scenario: UTF-8 编码文件名（正常情况）
- **WHEN** 用户导入 UTF-8 编码的 ZIP 文件
- **THEN** 系统行为与修复前完全一致，无任何影响

#### Scenario: 混合编码文件名
- **WHEN** ZIP 中部分文件名为 ASCII、部分为 GBK 编码
- **THEN** 系统对每个条目独立检测和修复，ASCII 文件名不受影响

#### Scenario: 无法识别的编码
- **WHEN** ZIP 文件名编码既不是 UTF-8 也不是 GBK/GB18030
- **THEN** 系统保持原始文件名不变，不产生额外错误

## MODIFIED Requirements
无

## REMOVED Requirements
无
