# Checklist

- [x] 编辑技能名称改名后，磁盘目录名同步更新
- [x] 编辑技能名称改名后，SKILL.md frontmatter name 同步更新
- [x] 编辑技能名称改名后，DB relative_path 同步更新
- [x] 编辑技能名称未变时，仅更新 description/tags，不触发目录操作
- [x] 新名称对应的目录已存在（其他技能）时，后端返回错误，不修改任何内容
- [x] 新名称经 SanitizeFileName 清理后才做目录检测
- [x] 目录重命名失败时，DB name 和 SKILL.md frontmatter 回滚为旧值
- [x] 前端保存遇到"已存在"错误时，名称输入框红色边框闪烁
- [x] 前端保存遇到"已存在"错误时，输入框下方显示红色提示文字
- [x] 前端保存遇到"已存在"错误时，模态框不关闭，用户可继续编辑
- [x] Go 编译通过（go build ./...）
