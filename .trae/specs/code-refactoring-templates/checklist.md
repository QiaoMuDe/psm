# 验证清单

## PART A：静态模板抽取

- [x] **Task 1**: settings.js - 265 行静态模板已抽取到 `html/settings.html`，渲染结果一致
- [x] **Task 2**: data.js - 114 行静态模板已抽取到 `html/data.html`，渲染结果一致
- [x] **Task 3**: dashboard.js - 63 行静态模板已抽取到 `html/dashboard.html`，视图切换事件绑定保持正常
- [x] **Task 4**: prompts.js - 91 行模板已抽取，三元条件已转为 JS 设置 class，渲染结果一致
- [x] **Task 5**: skills.js - 86 行模板已抽取，三元条件已转为 JS 设置 class，syncViewToggle() 已删除，渲染结果一致

## PART B：重复代码抽象

- [x] **Task 6**: `copyToClipboard()` 已新增，prompts.js 中 8 处后备复制调用已替换，复制功能正常
- [x] **Task 7**: `withAIStream()` 已新增，translate.js/prompts.js/skills.js 流式事件已迁移，AI 功能正常
- [x] **Task 8**: `positionPopup()` 已新增，context-menu.js 和 dropdown-menu.js 定位逻辑已替换，菜单位置正常
- [x] **Task 9**: DashboardView.highlightText 已删除，改用全局版本，搜索高亮正常

## 全局验证

- [x] **Task 10**: `go build ./...` 编译通过，JS 诊断无错误
- [x] 所有视图页面的渲染、交互、功能与原实现完全一致
