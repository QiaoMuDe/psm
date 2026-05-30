# 仪表盘全局搜索功能实现计划

## 目标

在仪表盘添加全局搜索框，支持搜索提示词和技能，输入时实时展示候选结果，点击可跳转到对应模块并闪烁提醒。

## 功能设计

### UI 布局

```
┌─────────────────────────────────────────────────────────────┐
│  🔍 搜索提示词或技能...                                      │
├─────────────────────────────────────────────────────────────┤
│  📝 Prompt: xxx提示词                    [Prompt]           │
│  🔧 Skill: xxx技能                       [Skill]            │
│  📝 Prompt: yyy提示词                    [Prompt]           │
└─────────────────────────────────────────────────────────────┘
```

### 交互逻辑

1. 用户输入搜索关键词（防抖 300ms）
2. 实时搜索提示词和技能（合并结果，按更新时间排序）
3. 展示候选结果下拉菜单（最多显示 8 条）
4. 点击候选结果跳转到对应模块并闪烁
5. 点击其他区域或按 ESC 关闭下拉菜单

## 实现步骤

### 1. 修改 dashboard.js

* 移除"最近更新"卡片区域

* 在统计卡片下方新增搜索框卡片

* 实现搜索逻辑（调用现有 API.getPrompts 和 API.getSkills）

* 实现候选结果下拉菜单渲染

* 实现点击跳转和闪烁功能

### 2. 修改 CSS 样式

* 新增搜索框样式（.global-search-box）

* 新增候选下拉菜单样式（.search-dropdown）

* 新增候选结果项样式（.search-result-item）

* 新增高亮匹配文字样式（.search-highlight）

### 3. 后端 API（无需修改）

* 使用现有的 `API.getPrompts(keyword)` 搜索提示词

* 使用现有的 `API.getSkills()` 搜索技能（前端过滤）

## 修改文件清单

1. `frontend/js/views/dashboard.js` - 主要逻辑
2. `frontend/css/components.css` - 样式

## 技术要点

### 搜索防抖

```javascript
let searchTimer = null;
searchInput.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => performSearch(keyword), 300);
});
```

### 结果合并

```javascript
const [prompts, skills] = await Promise.all([
    API.getPrompts(keyword),
    API.getSkills()
]);
const filteredSkills = skills.filter(s => 
    s.name.toLowerCase().includes(keyword) ||
    (s.description && s.description.toLowerCase().includes(keyword))
);
```

### 点击跳转

```javascript
resultItem.addEventListener('click', () => {
    App.navigate(type + 's', id);
});
```

## 优点

1. **提升效率**：一键搜索所有内容，无需切换模块
2. **交互友好**：实时反馈，类似百度搜索体验
3. **实现简单**：复用现有 API，无需后端修改
4. **视觉清晰**：搜索框位置醒目，操作路径短

