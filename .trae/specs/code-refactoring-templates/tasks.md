# Tasks

## Task 1: 抽取 settings.js 静态模板
- [x] 创建 `frontend/html/settings.html`，内容为 settings.js render() 中 265 行纯静态 HTML
- [x] 修改 settings.js render()，引入 fetch + _template 缓存模式
- [x] 验证渲染结果一致

## Task 2: 抽取 data.js 静态模板
- [x] 创建 `frontend/html/data.html`，内容为 data.js render() 中 114 行纯静态 HTML
- [x] 修改 data.js render()，引入 fetch + _template 缓存模式
- [x] 验证渲染结果一致

## Task 3: 抽取 dashboard.js 静态模板
- [x] 创建 `frontend/html/dashboard.html`，内容为 dashboard.js render() 中 63 行纯静态 HTML
- [x] 修改 dashboard.js render()，引入 fetch + _template 缓存模式
- [x] 注意 dashboard.js 的 render 中额外有数据加载和事件绑定逻辑，已保持
- [x] 验证渲染结果一致

## Task 4: 抽取 prompts.js 静态模板
- [x] 创建 `frontend/html/prompts.html`，内容为 prompts.js render() 中 91 行 HTML
- [x] 将 `${this.currentView === 'list' ? ' active' : ''}` 三元条件改为 JS 渲染后设置 class
- [x] 修改 prompts.js render()，引入 fetch + _template 缓存模式
- [x] 验证渲染结果一致

## Task 5: 抽取 skills.js 静态模板
- [x] 创建 `frontend/html/skills.html`，内容为 skills.js render() 中 86 行 HTML
- [x] 将两处 `${this.currentView === 'list' ? ' active' : ''}` 和 `card` 三元改为 JS 渲染后设置 class，删除 syncViewToggle()
- [x] 修改 skills.js render()，引入 fetch + _template 缓存模式
- [x] 验证渲染结果一致

## Task 6: 新增全局 `copyToClipboard()` 工具函数
- [x] 在 app.js 中新增 `copyToClipboard(text)` 函数（navigator.clipboard + textarea 后备）
- [x] 将 prompts.js 中 8 处后备复制调用点替换为 `copyToClipboard()`
- [x] 验证复制功能正常

## Task 7: 新增全局 `withAIStream()` 工具函数
- [x] 在 app.js 中新增 `withAIStream(apiMethod, callbacks)` 函数，封装 ai:token/ai:done/ai:error 注册与清理
- [x] 迁移 translate.js 中的流式事件注册，移除 cleanupListeners()
- [x] 迁移 prompts.js 中 `bindOptimizeButton` 和 `openAIGenerateModal` 的流式事件注册
- [x] 迁移 skills.js 中 `bindOptimizeButton` 的流式事件注册
- [x] 验证所有 AI 流式功能正常

## Task 8: 抽取菜单定位逻辑
- [x] 在 app.js 中新增 `positionPopup(el, x, y)` 函数（边界检测逻辑）
- [x] 替换 context-menu.js show() 中的内联定位逻辑
- [x] 替换 dropdown-menu.js show() 中的内联定位逻辑
- [x] 验证菜单弹出位置正常

## Task 9: 删除 DashboardView.highlightText
- [x] 删除 dashboard.js 中的 `highlightText()` 方法
- [x] 将所有调用点 `DashboardView.highlightText()` 改为全局 `highlightText()`
- [x] CSS 兼容：全局版本使用 `<mark>`，components.css 中已有 mark 样式兼容
- [x] 验证搜索高亮功能正常

## Task 10: 验证构建
- [x] 运行 `go build ./...`，编译通过
- [x] 检查所有 JS 文件诊断无错误

# Task Dependencies
- Task 1~5 之间无依赖，可并行执行
- Task 6、7、8、9 之间无依赖，可并行执行
- Task 1~5 与 Task 6~9 无依赖关系，可并行执行
- Task 10 依赖所有前序任务完成
