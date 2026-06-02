# 修复事件监听器泄漏 + 快捷键帮助补全

## 修改范围

仅涉及 2 个文件：

* `frontend/js/app.js` — AIActionButton 事件清理 + 快捷键帮助弹窗

* `frontend/js/views/dashboard.js` — document 级监听器清理

***

## 修复 1：AIActionButton 事件监听累积

**文件**: `app.js` 第 628-865 行 (`AIActionButton`)

**问题**: `init()` 每次调用都在 `targetField` 上添加 `blur` 监听器（第821行），在 `document` 上添加 `click` 监听器（第831行），但 `cleanup()` 只清理 stream 和 timer，不移除这些监听器。

**修复方案**:

1. 在 `init()` 中将 `blur` 和 `document click` 的 handler 提取为具名函数，存入 `_instances` Map
2. `cleanup()` 中调用 `removeEventListener` 移除这两个监听器

**具体改动**:

在 `init()` 的 `_instances.set(...)` 处（第835-840行），增加存储 blurHandler 和 docClickHandler：

```js
// 原代码
this._instances.set(wrapId, {
    cleanup: function() {
        if (state.streamInstance) state.streamInstance.cleanup();
        clearTimeout(state.safetyTimer);
    }
});

// 改为
this._instances.set(wrapId, {
    cleanup: function() { ... },
    blurHandler: blurHandler,
    docClickHandler: docClickHandler,
    targetField: targetField
});
```

对应地，将第821行和第831行的匿名 handler 改为先赋值给变量再 addEventListener。

在 `cleanup()` 方法（第847-853行）中增加 removeEventListener：

```js
cleanup(wrapId) {
    var instance = this._instances.get(wrapId);
    if (instance) {
        instance.cleanup();
        if (instance.blurHandler && instance.targetField) {
            instance.targetField.removeEventListener('blur', instance.blurHandler);
        }
        if (instance.docClickHandler) {
            document.removeEventListener('click', instance.docClickHandler);
        }
        this._instances.delete(wrapId);
    }
}
```

***

## 修复 2：DashboardView document 监听器累积

**文件**: `dashboard.js` 第 84-102 行 (`bindSearchEvents`)

**问题**: 每次 `render()` → `bindSearchEvents()` 都在 `document` 上注册新的 `click`（第84行）和 `keydown`（第96行）监听器，无清理。

**修复方案**:
在 `DashboardView` 对象上添加 `_docClickHandler` 和 `_docKeydownHandler` 两个属性，注册前先移除旧的。

**具体改动**:

在 `bindSearchEvents()` 第84行前添加清理：

```js
if (DashboardView._docClickHandler) {
    document.removeEventListener('click', DashboardView._docClickHandler);
}
DashboardView._docClickHandler = (e) => {
    if (!e.target.closest('.global-search-wrapper')) {
        dropdown.style.display = 'none';
    }
};
document.addEventListener('click', DashboardView._docClickHandler);
```

第96行同理：

```js
if (DashboardView._docKeydownHandler) {
    document.removeEventListener('keydown', DashboardView._docKeydownHandler);
}
DashboardView._docKeydownHandler = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'f' && App.currentView === 'dashboard') {
        e.preventDefault();
        searchInput.focus();
        searchInput.select();
    }
};
document.addEventListener('keydown', DashboardView._docKeydownHandler);
```

***

## 修复 3：快捷键帮助弹窗补充

**文件**: `app.js` 第 124-167 行 (`ShortcutManager.showHelp`)

**问题**: 帮助弹窗中缺少 `PgUp`/`PgDn`/`Ctrl+Home`/`Ctrl+End` 视图滚动快捷键。

**修复方案**: 在 `shortcutKeys` 数组末尾追加 2 条，或者新增一个 `viewScrollKeys` 分组。

追加到 `shortcutKeys` 更简洁：

```js
{ keys: 'PgUp / PgDn', desc: '向上/向下翻页（提示词/技能列表）' },
{ keys: 'Ctrl + Home / End', desc: '滚动到顶部/底部（提示词/技能列表）' },
```

***

## 验证方式

1. 语法检查：`node -c frontend/js/app.js && node -c frontend/js/views/dashboard.js`
2. 功能验证：

   * 多次打开/关闭 Prompt/Skill 编辑模态框，确认无控制台报错

   * 多次导航到仪表盘，确认搜索和 Ctrl+F 正常

   * 按 `Ctrl+?` 确认帮助弹窗显示新增的快捷键说明

