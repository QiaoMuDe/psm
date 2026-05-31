# 字体族键盘导航 + 双击动画实现方案

> 版本: 1.0.0 | 日期: 2026-05-31 | 状态: 待确认

***

## 一、功能概述

### 功能 1：字体族设置支持键盘导航

* 上下键在字体选项中移动高亮

* 回车键选择当前高亮的字体

* Esc 键关闭下拉框

### 功能 2：双击查看技能或提示词时增加动画

* 双击卡片或行时添加短暂的缩放/闪烁动画

* 提升交互反馈体验

***

## 二、修改文件清单

### 功能 1：字体族键盘导航

| 文件                              | 修改内容     |
| ------------------------------- | -------- |
| `frontend/js/views/settings.js` | 添加键盘导航逻辑 |

### 功能 2：双击动画

| 文件                             | 修改内容     |
| ------------------------------ | -------- |
| `frontend/js/views/prompts.js` | 添加双击动画效果 |
| `frontend/js/views/skills.js`  | 添加双击动画效果 |
| `frontend/css/components.css`  | 新增双击动画样式 |

***

## 三、详细实现步骤

### 步骤 1：字体族键盘导航

**文件**: `frontend/js/views/settings.js`

#### 1.1 新增状态变量

```javascript
_fontIndex: -1,
```

#### 1.2 修改 bindEvents 中的字体选择器事件

在现有的字体选择器事件处理中添加键盘导航：

```javascript
const searchInput = document.getElementById('setting-font-family-search');
const dropdown = document.getElementById('setting-font-family-dropdown');
const hiddenInput = document.getElementById('setting-font-family');

// 点击搜索框显示下拉
searchInput.addEventListener('focus', () => {
    dropdown.classList.add('active');
    const selected = dropdown.querySelector('.font-family-option.selected');
    if (selected) {
        this._fontIndex = Array.from(dropdown.querySelectorAll('.font-family-option')).indexOf(selected);
        selected.scrollIntoView({ block: 'nearest' });
    }
});

// 搜索过滤
searchInput.addEventListener('input', () => {
    const query = searchInput.value.toLowerCase();
    const options = dropdown.querySelectorAll('.font-family-option');
    let visibleIndex = -1;
    options.forEach(option => {
        const fontName = option.dataset.value || 'Space Grotesk';
        const isVisible = fontName.toLowerCase().includes(query);
        option.style.display = isVisible ? '' : 'none';
        if (isVisible) visibleIndex++;
    });
    this._fontIndex = -1;
    this.updateFontHighlight(dropdown);
});

// 键盘导航
searchInput.addEventListener('keydown', (e) => {
    const options = Array.from(dropdown.querySelectorAll('.font-family-option')).filter(opt => opt.style.display !== 'none');
    
    if (e.key === 'ArrowDown') {
        e.preventDefault();
        this._fontIndex = Math.min(this._fontIndex + 1, options.length - 1);
        this.updateFontHighlight(dropdown);
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        this._fontIndex = Math.max(this._fontIndex - 1, -1);
        this.updateFontHighlight(dropdown);
    } else if (e.key === 'Enter') {
        e.preventDefault();
        if (this._fontIndex >= 0 && options[this._fontIndex]) {
            options[this._fontIndex].click();
        }
    } else if (e.key === 'Escape') {
        dropdown.classList.remove('active');
        this._fontIndex = -1;
    }
});

// 选择字体
dropdown.addEventListener('click', (e) => {
    const option = e.target.closest('.font-family-option');
    if (!option) return;
    const value = option.dataset.value;
    hiddenInput.value = value;
    searchInput.value = value || '默认 (Space Grotesk)';
    dropdown.querySelectorAll('.font-family-option').forEach(opt => opt.classList.remove('selected'));
    option.classList.add('selected');
    this.applyFontFamily(value);
    dropdown.classList.remove('active');
    this._fontIndex = -1;
});

// 点击外部关闭下拉
document.addEventListener('click', (e) => {
    if (!e.target.closest('.font-family-selector')) {
        dropdown.classList.remove('active');
        this._fontIndex = -1;
    }
});
```

#### 1.3 新增 updateFontHighlight 方法

```javascript
updateFontHighlight(dropdown) {
    const options = Array.from(dropdown.querySelectorAll('.font-family-option')).filter(opt => opt.style.display !== 'none');
    options.forEach((option, index) => {
        if (index === this._fontIndex) {
            option.classList.add('font-family-active');
            option.scrollIntoView({ block: 'nearest' });
        } else {
            option.classList.remove('font-family-active');
        }
    });
},
```

***

### 步骤 2：双击动画样式

**文件**: `frontend/css/components.css`

```css
/* ==================== 双击动画 ==================== */

.dblclick-animate {
    animation: dblclickPulse 0.3s ease-out;
}

@keyframes dblclickPulse {
    0% {
        transform: scale(1);
        box-shadow: 0 0 0 0 var(--accent);
    }
    50% {
        transform: scale(0.98);
        box-shadow: 0 0 0 4px var(--accent);
    }
    100% {
        transform: scale(1);
        box-shadow: 0 0 0 0 var(--accent);
    }
}

/* 字体选择器高亮样式 */
.font-family-active {
    background: var(--accent-light);
}
```

***

### 步骤 3：提示词模块双击动画

**文件**: `frontend/js/views/prompts.js`

#### 3.1 修改卡片双击事件

```javascript
card.addEventListener('dblclick', (e) => {
    if (e.target.closest('button') || e.target.closest('a') || e.target.type === 'checkbox') return;
    
    card.classList.add('dblclick-animate');
    card.addEventListener('animationend', () => {
        card.classList.remove('dblclick-animate');
    }, { once: true });
    
    const id = Number(card.dataset.id);
    const prompt = this.allPrompts.find(p => p.id === id);
    if (prompt) {
        this.showPrompt(prompt);
    }
});
```

#### 3.2 修改行双击事件

```javascript
row.addEventListener('dblclick', (e) => {
    if (e.target.closest('button') || e.target.closest('a') || e.target.type === 'checkbox') return;
    
    row.classList.add('dblclick-animate');
    row.addEventListener('animationend', () => {
        row.classList.remove('dblclick-animate');
    }, { once: true });
    
    const id = Number(row.dataset.id);
    const prompt = this.allPrompts.find(p => p.id === id);
    if (prompt) {
        this.showPrompt(prompt);
    }
});
```

***

### 步骤 4：技能模块双击动画

**文件**: `frontend/js/views/skills.js`

#### 4.1 修改卡片双击事件

```javascript
card.addEventListener('dblclick', (e) => {
    if (e.target.closest('button') || e.target.closest('a') || e.target.type === 'checkbox') return;
    
    card.classList.add('dblclick-animate');
    card.addEventListener('animationend', () => {
        card.classList.remove('dblclick-animate');
    }, { once: true });
    
    this.viewSkill(Number(card.dataset.id));
});
```

#### 4.2 修改行双击事件

```javascript
row.addEventListener('dblclick', (e) => {
    if (e.target.closest('button') || e.target.closest('a') || e.target.type === 'checkbox') return;
    
    row.classList.add('dblclick-animate');
    row.addEventListener('animationend', () => {
        row.classList.remove('dblclick-animate');
    }, { once: true });
    
    this.viewSkill(Number(row.dataset.id));
});
```

***

## 四、使用流程

### 字体族键盘导航

```
点击字体搜索框 → 显示下拉列表
  ↓
按 ↓ 键 → 高亮下一项
按 ↑ 键 → 高亮上一项
按 Enter → 选择当前高亮字体
按 Esc → 关闭下拉框
```

### 双击动画

```
用户双击卡片/行
  ↓
添加 dblclick-animate 类
  ↓
播放 0.3s 缩放+边框动画
  ↓
动画结束移除类
  ↓
弹出查看弹窗
```

***

## 五、注意事项

1. **键盘导航**：

   * 搜索过滤后重置索引

   * 只计算可见选项

   * 高亮项自动滚动到视图内

2. **双击动画**：

   * 使用 `animationend` 事件自动移除类

   * `{ once: true }` 确保只触发一次

   * 动画时间 0.3s，不影响操作流畅度

***

## 六、测试用例

### 字体族键盘导航

1. 在设置页点击字体搜索框
2. 按 ↓ 键，高亮移动到第一项
3. 继续按 ↓ 键，高亮移动到最后一项
4. 按 ↑ 键，高亮向上移动
5. 按 Enter，选择当前字体
6. 搜索过滤后，高亮索引重置

### 双击动画

1. 在提示词模块双击卡片，观察缩放+边框动画
2. 在提示词模块双击行，观察动画
3. 在技能模块双击卡片，观察动画
4. 在技能模块双击行，观察动画

