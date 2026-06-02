# Tasks

- [x] Task 1: 删除技能工具栏多余分隔符
  - [x] SubTask 1.1: 删除 `frontend/html/skills.html` 中 `action-buttons` div 之后的第二个 `<div class="toolbar-separator"></div>`

- [x] Task 2: 技能导入名字特殊字符清理
  - [x] SubTask 2.1: 在 `internal/utils/archive.go` 中新增 `SanitizeFileName(name string) string` 函数，将 `\ / : * ? " < > |` 替换为 `_`
  - [x] SubTask 2.2: 在 `internal/service/skill.go` 的 `ImportSkill` 方法中，获取 name 后调用 `SanitizeFileName` 清理
  - [x] SubTask 2.3: 在 `internal/service/skill.go` 的 `ImportSkillFromExportZip` 方法中，对从 frontmatter 提取的 name 同样调用 `SanitizeFileName`

- [x] Task 3: 搜索状态页面切换重置
  - [x] SubTask 3.1: 在 `frontend/js/views/prompts.js` 的 `render` 方法开头，重置 `this.currentKeyword = ''` 和 `this.currentCategory = 'all'` 和 `this.currentTag = ''`
  - [x] SubTask 3.2: 在 `frontend/js/views/skills.js` 的 `render` 方法开头，重置 `this.currentKeyword = ''` 和 `this.currentTag = ''`

# Task Dependencies
- 无依赖关系，三个 Task 可并行执行
