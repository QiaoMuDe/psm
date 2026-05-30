# Checklist

- [x] prompts 表有 updated_at 和 category 索引
- [x] skills 表有 updated_at 索引
- [x] prompts 和 skills 表有 is_pinned 字段（DEFAULT 0）
- [x] Prompt 列表按 is_pinned DESC, updated_at DESC 排序
- [x] Skill 列表按 is_pinned DESC, updated_at DESC 排序
- [x] TogglePinPrompt API 正常工作
- [x] TogglePinSkill API 正常工作
- [x] Prompt 卡片/表格视图有置顶按钮
- [x] Skill 卡片/表格视图有置顶按钮
- [x] 点击置顶按钮后列表正确刷新，置顶项在最前
- [x] internal/handler/ 子包已创建
- [x] SettingsHandler 结构体在 internal/handler/settings.go 中定义
- [x] PromptHandler 结构体在 internal/handler/prompt.go 中定义
- [x] SkillHandler 结构体在 internal/handler/skill.go 中定义
- [x] BackupHandler 结构体在 internal/handler/backup.go 中定义
- [x] app.go 嵌入所有 Handler 结构体
- [x] app.go 仅保留结构体定义和生命周期方法
- [x] go vet 检查通过
