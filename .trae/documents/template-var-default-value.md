# 模板变量默认值功能升级

## 需求概述

将模板变量从简单的 `{{变量名}}` 格式升级为支持默认值的 `{{变量名|默认值}}` 格式。填写变量时留空则使用默认值，而非移除占位符。

## 当前实现分析

### 现有格式
```
请用 {{语言}} 编写一个 {{功能}} 程序
```

### 升级后格式
```
请用 {{语言|Go}} 编写一个 {{功能|示例程序}} 程序
```

- 简单变量 `{{变量名}}` 仍然兼容（无默认值）
- 带默认值 `{{变量名|默认值}}` 用户留空时使用 `默认值`
- 多个 `|` 只取第一个作为分隔符，其余属于默认值内容

### 当前代码调用链路

复制 Prompt 有 4 个入口，最终都调用 `showTemplateVarsModal`：

1. **查看弹窗复制按钮** → [prompts.js L819-L863](file:///d:/峡谷/Dev/本地项目/psm/frontend/js/views/prompts.js#L819-L863) → `parseTemplateVars` → `showTemplateVarsModal` → `replaceTemplateVars`
2. **卡片/行复制按钮** → [prompts.js L918-L961](file:///d:/峡谷/Dev/本地项目/psm/frontend/js/views/prompts.js#L918-L961) → 同上
3. **悬停 Ctrl+C 快捷键** → [prompts.js L870-L912](file:///d:/峡谷/Dev/本地项目/psm/frontend/js/views/prompts.js#L870-L912) → 同上
4. **右键菜单复制** → [prompts.js L982-L1004](file:///d:/峡谷/Dev/本地项目/psm/frontend/js/views/prompts.js#L982-L1004) → 同上

### 当前核心函数（均在 app.js）

1. **`parseTemplateVars(content)`** [app.js L442-L453](file:///d:/峡谷/Dev/本地项目/psm/frontend/js/app.js#L442-L453)
   - 正则 `/\{\{(.+?)\}\}/g` 匹配所有 `{{...}}`
   - 返回 `string[]`（变量名数组）

2. **`showTemplateVarsModal(vars, callback)`** [app.js L464-L494](file:///d:/峡谷/Dev/本地项目/psm/frontend/js/app.js#L464-L494)
   - 接收 `string[]`，为每个变量生成一个 input
   - input placeholder 为 "留空则移除"
   - 点击"复制到剪贴板"时收集所有 input 值，调用 callback

3. **`replaceTemplateVars(content, vars)`** [app.js L455-L462](file:///d:/峡谷/Dev/本地项目/psm/frontend/js/app.js#L455-L462)
   - 遍历 vars 对象，用正则替换 `{{key}}` 为 value
   - `result.replace(re, value || '')` — 留空时替换为空字符串

### UI 提示文本位置

- 新建 Prompt 模态框: [prompts.js L644](file:///d:/峡谷/Dev/本地项目/psm/frontend/js/views/prompts.js#L644)
- 编辑 Prompt 模态框: [prompts.js L716](file:///d:/峡谷/Dev/本地项目/psm/frontend/js/views/prompts.js#L716)

---

## 修改计划

### Step 1: 修改 `parseTemplateVars` — 解析变量名和默认值

**文件**: `frontend/js/app.js` [L442-L453](file:///d:/峡谷/Dev/本地项目/psm/frontend/js/app.js#L442-L453)

**变更**:
- 返回类型从 `string[]` 改为 `Array<{name: string, defaultValue: string}>`
- 对每个匹配项，按第一个 `|` 分割：前面是变量名，后面是默认值
- 无 `|` 时 `defaultValue` 为空字符串

```js
function parseTemplateVars(content) {
    if (!content) return [];
    const matches = content.match(/\{\{(.+?)\}\}/g);
    if (!matches) return [];
    const seen = new Set();
    return matches.map(m => {
        const inner = m.slice(2, -2).trim();
        const pipeIndex = inner.indexOf('|');
        let name, defaultValue;
        if (pipeIndex === -1) {
            name = inner;
            defaultValue = '';
        } else {
            name = inner.substring(0, pipeIndex).trim();
            defaultValue = inner.substring(pipeIndex + 1).trim();
        }
        if (seen.has(name)) return null;
        seen.add(name);
        return { name, defaultValue };
    }).filter(Boolean);
}
```

### Step 2: 修改 `showTemplateVarsModal` — 支持默认值

**文件**: `frontend/js/app.js` [L464-L494](file:///d:/峡谷/Dev/本地项目/psm/frontend/js/app.js#L464-L494)

**变更**:
- 接收 `Array<{name, defaultValue}>`（替代 `string[]`）
- input placeholder 改为显示默认值（如有）：`留空则使用 "Go"` 或 `留空则移除`
- 输入框可选填默认值提示文字
- 提示文字更新为新的格式说明

```js
function showTemplateVarsModal(vars, callback) {
    let fieldsHtml = vars.map(v => {
        const hasDefault = v.defaultValue !== '';
        const placeholder = hasDefault ? `留空则使用 "${escapeHtml(v.defaultValue)}"` : '留空则移除';
        const defaultHint = hasDefault ? ` <span class="template-var-default-hint">默认: ${escapeHtml(v.defaultValue)}</span>` : '';
        return `
            <div class="template-var-row">
                <label class="var-label">{{${escapeHtml(v.name)}}}${defaultHint}</label>
                <input type="text" class="form-input template-var-input" data-var="${escapeHtml(v.name)}" data-default="${escapeHtml(v.defaultValue)}" placeholder="${placeholder}" />
            </div>
        `;
    }).join('');

    const content = `
        <div class="template-vars-form">
            <div class="template-vars-list">
                ${fieldsHtml}
            </div>
            <div class="form-actions">
                <button type="button" class="btn btn-default" onclick="Modal.close()">取消</button>
                <button type="button" class="btn btn-primary" id="template-copy-btn">复制到剪贴板</button>
            </div>
        </div>
    `;

    Modal.open('填写模板变量', content);

    document.getElementById('template-copy-btn').addEventListener('click', () => {
        const values = {};
        document.querySelectorAll('.template-var-input').forEach(input => {
            values[input.dataset.var] = input.value.trim();
        });
        Modal.close();
        callback(values);
    });
}
```

### Step 3: 修改 `replaceTemplateVars` — 空值时使用默认值

**文件**: `frontend/js/app.js` [L455-L462](file:///d:/峡谷/Dev/本地项目/psm/frontend/js/app.js#L455-L462)

**变更**:
- 逻辑不变，因为 callback 中收集的 values 已经包含了用户的输入
- 真正的默认值填充在 Step 2 的 callback 中完成（输入框的 `data-default` 属性）
- 但 `replaceTemplateVars` 本身不需要改动，它只是做字符串替换

**无需修改此函数**。默认值的逻辑在 Step 2 的 callback 中处理：

```js
// 在 showTemplateVarsModal 的 callback 中：
const values = {};
document.querySelectorAll('.template-var-input').forEach(input => {
    const val = input.value.trim();
    values[input.dataset.var] = val || input.dataset.default;  // 关键：留空时使用默认值
});
```

### Step 4: 更新 UI 提示文本

**文件**: `frontend/js/views/prompts.js`

**变更两处**:
1. [L644](file:///d:/峡谷/Dev/本地项目/psm/frontend/js/views/prompts.js#L644) — 新建模态框的模板说明
2. [L716](file:///d:/峡谷/Dev/本地项目/psm/frontend/js/views/prompts.js#L716) — 编辑模态框的模板说明

将:
```
占位符格式: <code>{{变量名}}</code>
```
改为:
```
占位符格式: <code>{{变量名}}</code> 或 <code>{{变量名|默认值}}</code>
```

### Step 5: 添加 CSS 样式（可选）

**文件**: `frontend/css/components.css`

在 `.template-var-row` 相关样式附近添加默认值提示文字的样式：

```css
.template-var-default-hint {
    font-size: calc(11px + var(--font-size-offset));
    color: var(--text-secondary);
    font-weight: 400;
    font-style: italic;
}
```

---

## 向后兼容性

- `{{变量名}}` 格式完全兼容，无 `|` 时 `defaultValue` 为空，行为与当前一致（留空则移除）
- 已有的 Prompt 模板内容无需任何修改即可正常使用
- 新旧格式可以在同一个 Prompt 中混合使用

## 验证要点

1. 简单变量 `{{name}}` — 留空时移除（兼容旧行为）
2. 带默认值 `{{lang|Go}}` — 留空时使用 "Go"
3. 多竖杠 `{{desc|Hello|World}}` — 默认值为 "Hello|World"（只取第一个 `|`）
4. 空默认值 `{{name|}}` — 默认值为空字符串，行为同简单变量
5. 同名变量去重 — 两个 `{{name|A}}` 和 `{{name|B}}` 只出现一次
6. 输入框 placeholder 正确显示默认值提示
7. 复制结果中默认值被正确替换

## 影响范围

| 文件 | 修改内容 |
|------|----------|
| `frontend/js/app.js` | `parseTemplateVars` 返回结构改为 `{name, defaultValue}`；`showTemplateVarsModal` 支持默认值显示和填充；callback 中留空使用默认值 |
| `frontend/js/views/prompts.js` | 新建/编辑模态框的模板格式说明文本 |
| `frontend/css/components.css` | 默认值提示文字样式（可选） |

**后端无需修改** — 模板变量完全是前端逻辑，后端仅存储原始 Prompt 内容。
