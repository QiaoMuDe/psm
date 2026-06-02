# 仪表盘改造为搜索首页

## 目标

将仪表盘从"统计卡片 + 搜索框 + 常用提示词"三段式布局，改为类似百度的极简搜索首页：全屏居中一个大搜索框，干净留白。

## 设计方向

* **风格**: 极简主义（minimalism）+ 功能优先

* **布局**: 垂直居中 flex，搜索框占据视觉焦点

* **品牌**: 搜索框上方显示应用名 "PSM" + 副标题

* **交互**: 保留现有搜索防抖 + 键盘导航 + 下拉结果，不改任何后端 API

## 修改文件清单

### 1. `frontend/html/dashboard.html` — 完全重写

* 删除：统计卡片 `.stats-grid` 整个区域

* 删除：最常用提示词 `.card.popular-section` 整个区域

* 删除：页面头部 `.page-header`

* 新结构：

```html
<div class="dashboard-home">
    <div class="dashboard-home-content">
        <h1 class="dashboard-logo">PSM</h1>
        <p class="dashboard-subtitle">Prompt & Skill Manager</p>
        <div class="global-search-wrapper dashboard-search">
            <div class="global-search-box dashboard-search-box">
                <div class="global-search-icon">🔍 SVG</div>
                <input type="text" class="global-search-input" id="global-search" 
                       placeholder="搜索提示词或技能..." autocomplete="off" />
                <button class="dashboard-search-btn" id="dashboard-search-btn">
                    搜索
                </button>
                <div class="search-dropdown" id="search-dropdown" style="display: none;"></div>
            </div>
        </div>
        <div class="dashboard-shortcuts">
            <span class="dashboard-shortcut-tag" data-view="prompts">Prompts</span>
            <span class="dashboard-shortcut-tag" data-view="skills">Skills</span>
        </div>
    </div>
</div>
```

### 2. `frontend/js/views/dashboard.js` — 精简逻辑

* 删除 `renderPopularList()` 方法

* 精简 `render()` 方法：移除 `API.countPrompts()`、`API.countSkills()`、`API.getTopUsedPrompts()` 调用

* 移除 `.stat-card[data-view]` 点击绑定

* 新增：搜索按钮点击事件（`#dashboard-search-btn`）

* 新增：快捷标签点击跳转（`.dashboard-shortcut-tag[data-view]`）

* `bindSearchEvents()` 和 `performSearch()` 完全保留，只更新选择器 `.global-search-wrapper` → `.dashboard-search`

### 3. `frontend/css/components.css` — 新增/调整样式

* **保留**：现有 `.global-search-*` 系列样式（搜索框基础样式）

* **保留**：现有 `.search-dropdown`、`.search-result-item` 等搜索结果样式

* **保留**：现有 `.popular-*` 系列样式（注释掉或保留供未来用）

* **保留**：现有 `.stats-grid`、`.stat-card` 系列样式（注释掉或保留供未来用）

* **新增**：`.dashboard-home` — 全屏垂直居中 flex 容器

* **新增**：`.dashboard-home-content` — 内容区域，居中布局

* **新增**：`.dashboard-logo` — 应用名大标题（font-size: 48px, font-weight: 700, color: var(--accent)）

* **新增**：`.dashboard-subtitle` — 副标题（font-size: 16px, color: var(--text-muted), margin-top: -8px）

* **新增**：`.dashboard-search-box` — 加宽搜索框（max-width: 600px, 更大 padding, border-radius: 24px）

* **新增**：`.dashboard-search-btn` — 搜索按钮（与搜索框右侧融合，accent 背景色，border-radius 右侧圆角）

* **新增**：`.dashboard-shortcuts` — 快捷标签行（flex, gap: 12px, margin-top: 16px）

* **新增**：`.dashboard-shortcut-tag` — 快捷标签（pill 样式，hover 变色）

* **新增**：`.dashboard-search` — 搜索框区域（宽度 100%, max-width: 600px）

## 关键设计细节

### 搜索框设计

* `max-width: 600px`，宽度 100%

* `border-radius: 24px`（圆角胶囊形状）

* 内部 padding 增大（`16px 16px 16px 48px`）

* 搜索按钮与输入框融合为一个整体

* 聚焦时外发光（保留现有 `box-shadow` 效果）

### 页面布局

* `.dashboard-home` 使用 `display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100%`

* 内容区域水平居中，垂直居中（或偏上 40% 位置）

* 大量留白，干净简洁

### 快捷标签

* 搜索框下方显示 "Prompts" 和 "Skills" 两个快捷入口

* pill 样式（`border-radius: 16px`, `padding: 4px 16px`）

* 点击跳转到对应模块

### 搜索按钮

* 放在搜索框内部右侧

* 背景色 `var(--accent)`，文字白色

* 右侧圆角与搜索框一致

* 点击触发搜索

## 不改动的部分

* 后端 API（零改动）

* 搜索逻辑（`performSearch`、`bindSearchEvents`）

* 键盘导航（`KeyboardNav.bind`）

* 搜索下拉结果样式

* 全局快捷键 `Ctrl/Cmd+F`

## 验证方式

* 页面加载无错误

* 搜索框居中显示，宽度合理

* 输入内容后下拉搜索结果正常显示

* 点击搜索按钮触发搜索

* 快捷标签点击跳转正确

* 键盘上下键导航正常

* Esc 关闭下拉菜单

* `Ctrl/Cmd+F` 聚焦搜索框

* 亮色/暗色主题下样式正常

