# 修复 SettingsView 监听器泄漏 + loadSkills 导入逻辑去重

## 修改范围

仅涉及 1 个文件：
- `frontend/js/views/settings.js` — document 级 click 监听器清理
- `frontend/js/views/skills.js` — 导入逻辑提取为共享方法

---

## 修复 1：SettingsView document 级监听器泄漏

**文件**: `settings.js` 第 218-223 行

**问题**: `bindEvents()` 每次调用都在 `document` 上注册新的 click 监听器，无清理。与已修复的 DashboardView 同一问题。

**修复方案**: 与 DashboardView 相同——注册前先移除旧的。

**具体改动**:

将第 218-223 行：

```js
document.addEventListener('click', (e) => {
    if (!e.target.closest('.font-family-selector')) {
        dropdown.classList.remove('active');
        fontNav.reset();
    }
});
```

改为：

```js
if (this._docClickHandler) {
    document.removeEventListener('click', this._docClickHandler);
}
this._docClickHandler = (e) => {
    if (!e.target.closest('.font-family-selector')) {
        dropdown.classList.remove('active');
        fontNav.reset();
    }
};
document.addEventListener('click', this._docClickHandler);
```

用 `this._docClickHandler` 而非 `SettingsView._docClickHandler`，因为是在 `bindEvents()` 方法内（`this` 指向 SettingsView）。

---

## 修复 2：loadSkills 导入逻辑去重

**文件**: `skills.js` 第 573-598 行 和 第 637-662 行

**问题**: `import-skill-btn` 和 `add-skill-btn` 的 click handler 逻辑几乎完全相同（约 25 行 × 2），仅按钮文案不同（"导入完成" vs "批量导入完成"）。

**修复方案**: 提取为 `SkillsView._handleSkillImport()` 私有方法，两个按钮共用。

**具体改动**:

1. 在 SkillsView 对象中新增方法（放在 `bindEvents` 之前或之后均可）：

```js
async _handleSkillImport() {
    try {
        const filePaths = await API.openMultiZIPFileDialog();
        if (!filePaths || filePaths.length === 0) return;
        let result;
        if (filePaths.length === 1) {
            result = await API.importSkillAuto(filePaths[0]);
        } else {
            result = await API.batchImportSkills(filePaths);
        }
        let msg = `导入完成：成功 ${result.success}，跳过 ${result.skipped}，失败 ${result.failed}`;
        if (result.failed > 0 && result.errors && result.errors.length > 0) {
            msg += '\n' + result.errors.slice(0, 3).join('\n');
            if (result.errors.length > 3) msg += `\n...等 ${result.errors.length} 个错误`;
        }
        Toast[result.failed > 0 ? 'warning' : 'success'](msg);
        await this.loadSkills();
    } catch (err) {
        // 错误已由 API.call 处理
    }
},
```

2. 将 `import-skill-btn` 和 `add-skill-btn` 的 handler 简化为：

```js
document.getElementById('import-skill-btn').addEventListener('click', () => this._handleSkillImport());
document.getElementById('add-skill-btn').addEventListener('click', () => this._handleSkillImport());
```

---

## 验证方式

1. 语法检查：`node -c frontend/js/views/settings.js && node -c frontend/js/views/skills.js`
2. 功能验证：
   - 多次导航到设置页，确认字体下拉框关闭功能正常且无重复触发
   - 确认导入技能按钮（import-skill-btn）和新建技能按钮（add-skill-btn）功能正常
