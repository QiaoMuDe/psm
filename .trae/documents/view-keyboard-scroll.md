# 卡片/列表视图键盘滚动 + Skill 列表描述兜底

## 目标

1. 为 Prompts 和 Skills 模块的卡片/列表视图添加 Ctrl+Home、Ctrl+End、PgUp、PgDn 快捷键
2. Skills 列表模式下无描述时显示"暂无描述"（与卡片模式保持一致）

## 分析

### 滚动容器

两个模块的滚动容器结构一致：

```
div.card.view-toolbar → div.view-content（flex:1, overflow-y: auto）
```

滚动目标：`.view-content`

### 现有快捷键系统

* `ShortcutManager`：全局 + 模块级快捷键管理

* `KeyboardNav`：仅处理下拉列表导航，不涉及卡片/列表视图

* **当前无任何 Ctrl+Home/End/PgUp/PgDn 处理**

## 修改文件清单

### 1. `frontend/js/views/prompts.js` — 新增键盘滚动

* **位置**：`render()` 方法末尾，或 `bindSearchEvents()` 附近

* **实现**：在 `.view-content` 上绑定 `keydown` 事件

* **快捷键**：

  * `Ctrl+Home` → `container.scrollTop = 0`（滚动到顶部）

  * `Ctrl+End` → `container.scrollTop = container.scrollHeight`（滚动到底部）

  * `PgUp` → `container.scrollTop -= container.clientHeight`（向上翻页）

  * `PgDn` → `container.scrollTop += container.clientHeight`（向下翻页）

* **方式**：在 `render()` 方法中，获取 `.view-content` 元素并绑定 `keydown` 事件监听

### 2. `frontend/js/views/skills.js` — 新增键盘滚动 + 描述兜底

* **键盘滚动**：与 prompts.js 相同的实现

* **列表描述兜底**：修改 `renderTable()` 中描述字段的处理

  * 旧：`const desc = s.description ? (s.description.length > 50 ? s.description.substring(0, 50) + '...' : s.description) : '-';`

  * 新：`const desc = s.description ? (s.description.length > 50 ? s.description.substring(0, 50) + '...' : s.description) : '暂无描述';`

  * 同时调整显示样式：无描述时使用 `text-muted` 样式（`var(--text-muted)` 颜色）

## 实现细节

### 键盘滚动绑定方式

```js
bindViewScroll(container) {
    const viewContent = container.querySelector('.view-content');
    if (!viewContent) return;
    viewContent.setAttribute('tabindex', '-1');
    viewContent.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'Home') {
            e.preventDefault();
            viewContent.scrollTop = 0;
        } else if (e.ctrlKey && e.key === 'End') {
            e.preventDefault();
            viewContent.scrollTop = viewContent.scrollHeight;
        } else if (e.key === 'PageUp') {
            e.preventDefault();
            viewContent.scrollTop -= viewContent.clientHeight;
        } else if (e.key === 'PageDown') {
            e.preventDefault();
            viewContent.scrollTop += viewContent.clientHeight;
        }
    });
}
```

### Skills 列表描述兜底

```js
// 旧
const desc = s.description ? (s.description.length > 50 ? s.description.substring(0, 50) + '...' : s.description) : '-';
// 新
const hasDesc = !!s.description;
const desc = hasDesc ? (s.description.length > 50 ? s.description.substring(0, 50) + '...' : s.description) : '暂无描述';
// 渲染时
<td class="${hasDesc ? 'text-secondary' : 'text-muted'}">${highlightText(desc, SkillsView.currentKeyword)}</td>
```

## 不改动的部分

* 后端 API（零改动）

* ShortcutManager 全局快捷键（不冲突）

* KeyboardNav 工具函数（保持不变）

* 卡片视图 HTML 结构（不变）

* Prompts 模块（content 是必填项，无需描述兜底）

## 验证方式

* Ctrl+Home 跳转到顶部

* Ctrl+End 跳转到底部

* PgUp 向上翻一页

* PgDn 向下翻一页

* 卡片模式和列表模式下均正常

* Skills 列表模式无描述时显示"暂无描述"（灰色文字）

* 不影响搜索框、模态框内的键盘事件

