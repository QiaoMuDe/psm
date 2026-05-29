# Tasks

## 后端：Skill 统一导出

- [x] Task 1: 修改 Skill 导出逻辑 `internal/service/skill.go`
  - [x] SubTask 1.1: 实现 `ExportSkillsToZip(skillIds []int64, savePath string)` — 将选中的 Skill 打包为一个 ZIP（metadata.json + skills 目录）
  - [x] SubTask 1.2: 修改 `ExportSkill` 为调用 `ExportSkillsToZip`（单个 Skill 传 [id]）

- [x] Task 2: 在 app.go 添加批量导出绑定方法
  - [x] SubTask 2.1: 添加 `ExportSkills(skillIds []int64, savePath string)` 方法

## 后端：Prompt 选择性导出

- [x] Task 3: 修改 Prompt 导出逻辑 `internal/service/prompt.go`
  - [x] SubTask 3.1: 实现 `ExportPromptsToJson(promptIds []int64, savePath string)` — 将选中的 Prompt 导出为 JSON
  - [x] SubTask 3.2: 修改 `ExportPromptsToJson` 支持传入空 ID 列表时导出全部

- [x] Task 4: 在 app.go 添加选择性导出绑定方法
  - [x] SubTask 4.1: 添加 `ExportSelectedPrompts(promptIds []int64, savePath string)` 方法

## 后端：Skill 双格式导入

- [x] Task 5: 修改 Skill 导入逻辑 `internal/service/skill.go`
  - [x] SubTask 5.1: 实现 `ImportSkillFromExportZip(zipPath string)` — 从导出格式 ZIP 导入（metadata.json + skills 目录）
  - [x] SubTask 5.2: 修改 `ImportSkill` 自动识别格式：优先检查 metadata.json（新格式），其次检查 SKILL.md（公共格式）

## 前端：Skill 导出改造

- [x] Task 6: 修改 skills.js 导出逻辑
  - [x] SubTask 6.1: 导出按钮点击时获取选中的 Skill IDs
  - [x] SubTask 6.2: 无选中时传空数组（导出全部），有选中时传选中的 IDs
  - [x] SubTask 6.3: 调用新的 `API.exportSkills(ids, savePath)` 方法

## 前端：Prompt 导出改造

- [x] Task 7: 修改 prompts.js 导出逻辑
  - [x] SubTask 7.1: 导出按钮点击时获取选中的 Prompt IDs
  - [x] SubTask 7.2: 无选中时传空数组（导出全部），有选中时传选中的 IDs
  - [x] SubTask 7.3: 调用新的 `API.exportSelectedPrompts(ids, savePath)` 方法

## 验证

- [x] Task 8: 构建验证
  - [x] SubTask 8.1: `wails build` 构建成功
  - [ ] SubTask 8.2: 测试 Skill 导出（全部/选中/单个）
  - [ ] SubTask 8.3: 测试 Skill 导入（公共格式 ZIP + 导出格式 ZIP）
  - [ ] SubTask 8.4: 测试 Prompt 导出（全部/选中）
  - [ ] SubTask 8.5: 测试 Prompt 导入（从 JSON 导入）

# Task Dependencies

- [Task 1] 无依赖
- [Task 2] 依赖 [Task 1]
- [Task 3] 无依赖
- [Task 4] 依赖 [Task 3]
- [Task 5] 无依赖
- [Task 6] 依赖 [Task 2]
- [Task 7] 依赖 [Task 4]
- [Task 8] 依赖 [Task 6] 和 [Task 7]
