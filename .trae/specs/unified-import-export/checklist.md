# 验证清单

## Skill 导出

- [x] 导出全部 Skill 时生成单个 ZIP，包含 metadata.json 和 skills 目录
- [x] 导出选中的 Skill 时仅包含选中的 Skill
- [x] 导出单个 Skill 时生成单个 ZIP，结构正确
- [x] metadata.json 包含所有导出 Skill 的元数据（name、description、version、relative_path）
- [x] skills 目录包含所有 Skill 的实际文件

## Skill 导入

- [x] 从公共格式 ZIP（含 SKILL.md）导入时正常工作
- [x] 从导出格式 ZIP（含 metadata.json + skills 目录）导入时正确识别并逐个导入
- [x] 导入多个 Skill 时同名跳过
- [x] 自动识别 ZIP 格式（优先新格式，其次公共格式）

## Prompt 导出

- [x] 导出全部 Prompt 时生成包含所有 Prompt 的 JSON 文件
- [x] 导出选中的 Prompt 时仅包含选中的 Prompt
- [x] JSON 格式与现有格式兼容

## Prompt 导入

- [x] 从 JSON 文件导入 Prompt 正常工作

## 构建验证

- [x] `wails build` 构建成功，无报错
