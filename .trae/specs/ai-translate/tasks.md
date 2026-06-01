# Tasks

- [x] Task 1: 后端 — 新增翻译 API 方法
  - [x] SubTask 1.1: 在 `internal/db/models.go` 的 `DefaultSettings` 中添加 `ai_translate_prompt` 默认系统提示词
  - [x] SubTask 1.2: 在 `internal/handler/ai.go` 中新增 `TranslateContent(content, targetLang string) error` 方法，复用 `streamChat`
  - [x] SubTask 1.3: 在 `frontend/js/api.js` 中添加 `translateContent: (text, lang) => API.call(window.go.main.App.TranslateContent, text, lang)` 封装

- [x] Task 2: 前端 — 侧边栏导航项 + 路由注册
  - [x] SubTask 2.1: 在 `frontend/index.html` 的 `sidebar-nav` 中 skills 和 data 之间插入翻译导航项（含 SVG 图标）
  - [x] SubTask 2.2: 在 `frontend/js/app.js` 的 `navigate` switch 中添加 `case 'translate'` 分支
  - [x] SubTask 2.3: 更新 `frontend/js/app.js` 的 `navMap` 快捷键映射：`{ '1': 'dashboard', '2': 'prompts', '3': 'skills', '4': 'translate', '5': 'data', '6': 'settings' }`

- [x] Task 3: 前端 — 翻译模块视图（translate.js）
  - [x] SubTask 3.1: 创建 `frontend/js/views/translate.js`，定义 `TranslateView` 对象，包含 `render(container)` 方法
  - [x] SubTask 3.2: 实现页面布局 HTML：顶部语言选择栏（左下拉框 + 交换按钮 + 右下拉框 + 翻译按钮）、左右分栏 textarea、底部清空/复制/字数统计
  - [x] SubTask 3.3: 实现 `translate()` 方法：校验输入 → 监听 ai:token/done/error 事件 → 流式追加译文 → 按钮状态管理
  - [x] SubTask 3.4: 实现辅助方法：`clearSource()`、`clearTarget()`、`copySource()`、`copyTarget()`、`swapLanguages()`、`updateCharCount()`
  - [x] SubTask 3.5: 绑定事件：翻译按钮、清空按钮（左/右）、复制按钮（左/右）、交换按钮、Ctrl+Enter 快捷键、Ctrl+L 快捷键

- [x] Task 4: 前端 — 翻译模块 CSS 样式
  - [x] SubTask 4.1: 在 `frontend/css/components.css` 中添加翻译模块样式：`.translate-toolbar`、`.translate-content`、`.translate-box`、`.translate-textarea`、`.char-count`

- [x] Task 5: 前端 — 设置页翻译系统提示词
  - [x] SubTask 5.1: 在 `frontend/js/views/settings.js` 的 AI 分组中添加翻译系统提示词 textarea（id: `setting-ai-translate-prompt`）
  - [x] SubTask 5.2: 在 `loadSettings` 中加载 `ai_translate_prompt` 填充到 textarea
  - [x] SubTask 5.3: 在保存按钮事件中收集 `ai_translate_prompt` 的值传入 `updateSettings`

- [x] Task 6: 构建验证
  - [x] SubTask 6.1: 运行 `go build ./...` 确认后端编译通过
  - [x] SubTask 6.2: 运行 `golangci-lint run` 确认无 lint 告警

# Task Dependencies
- Task 1（后端 API）无依赖，可独立完成
- Task 2（导航项 + 路由）无依赖，可独立完成
- Task 3（translate.js）依赖 Task 1（API 封装）和 Task 2（路由注册）
- Task 4（CSS）无依赖，可独立完成
- Task 5（设置页）依赖 Task 1（后端配置项）
- Task 6（验证）依赖所有前置任务完成
