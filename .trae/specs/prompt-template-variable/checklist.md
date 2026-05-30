# Checklist

- [x] prompts 表有 `is_template` 字段（DEFAULT 0）
- [x] Prompt 结构体有 `IsTemplate` 字段
- [x] SQL 查询和插入包含 `is_template` 字段
- [x] CreatePrompt 和 UpdatePrompt API 接收 `isTemplate` 参数
- [x] 编辑弹窗有"模板"开关
- [x] 启用模板后保存，`is_template` 字段为 1
- [x] 编辑模板 Prompt 时开关正确显示
- [x] `parseTemplateVars` 能正确提取 `{{xxx}}` 占位符
- [x] `replaceTemplateVars` 能正确替换占位符
- [x] 模板 Prompt 复制时弹出填写弹窗
- [x] 弹窗中每个变量显示变量名和输入框
- [x] 点击"复制到剪贴板"后替换内容并复制
- [x] 空值占位符被移除而非保留空白
- [x] 普通 Prompt 复制功能不受影响
- [x] 点击"取消"关闭弹窗不复制
- [x] go vet 检查通过
