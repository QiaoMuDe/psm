# Tasks

- [x] Task 1: 后端 UpdateSkill 重命名逻辑
  - [x] SubTask 1.1: 在 `internal/service/skill.go` 的 `UpdateSkill` 方法中，name 变更时调用 `SanitizeFileName(name)` 清理
  - [x] SubTask 1.2: 如果清理后的 name != 旧 RelativePath，检查 `filepath.Join(storagePath, sanitizedName)` 目录是否存在且不是当前目录，存在则返回 `fmt.Errorf("技能目录名称已存在: %s", name)` 错误
  - [x] SubTask 1.3: 目录无冲突时，`os.Rename(oldDir, newDir)` 重命名目录，失败则回滚 DB name 和 SKILL.md 为旧值
  - [x] SubTask 1.4: 重命名成功后，更新 DB `relative_path` 为 sanitizedName

- [x] Task 2: 前端编辑模态框冲突反馈
  - [x] SubTask 2.1: 在 `frontend/js/views/skills.js` 的 `openEditModal` 保存处理中，捕获 API 错误，如果错误信息包含"已存在"，对 `#skill-name` 输入框添加 `.input-error-flash` 类并插入/显示红色提示文字（不关闭模态框）
  - [x] SubTask 2.2: 在 `frontend/css/components.css` 中添加 `.input-error-flash` 动画：红色边框闪烁 2 次（`border-color: var(--danger)` ↔ `var(--border)`），动画结束后移除类；添加 `.input-error-msg` 提示文字样式

# Task Dependencies
- Task 2 depends on Task 1（前端需要后端返回特定错误信息）
