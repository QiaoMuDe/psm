# 重构 BatchMixin 提取重复方法 + withAIStream 单例防护

## 修改范围

涉及 3 个文件：
- `frontend/js/app.js` — 新增 `BatchMixin` 对象 + `withAIStream` 单例防护
- `frontend/js/views/prompts.js` — 引入 BatchMixin，删除重复方法
- `frontend/js/views/skills.js` — 引入 BatchMixin，删除重复方法

---

## 重构 1：提取 BatchMixin

### 设计思路

在 `app.js` 中新增 `BatchMixin` 对象，包含 12 个共享方法。每个视图通过 `_batchConfig` 配置对象注入差异化的 ID 和回调，然后用 `Object.assign` 混入自身。

### BatchMixin 结构

```js
const BatchMixin = {
    // ===== 无差异，直接复用（4 个）=====
    bindViewScroll(container) { ... },        // 代码完全一致
    toggleBatchMode() { ... },                // 代码完全一致
    exitBatchMode() { ... },                  // 代码完全一致
    highlightItem(id) { ... },                // 代码完全一致

    // ===== 仅 ID 不同，通过 this._batchConfig 读取（5 个）=====
    syncBatchMode() { ... },                  // 5 处 ID 差异
    updateBatchBar() { ... },                 // 2 处 ID 差异
    syncSelectionUI() { ... },                // 2 处选择器差异
    toggleSelectAll(checked) { ... },         // 2 处 ID 差异
    bindCheckboxEvents(container) { ... },    // 1 处 ID 差异

    // ===== 有业务差异，通过 _batchConfig 回调/API 差异化（3 个）=====
    handleBatchAddTags() { ... },
    handleBatchRemoveTags() { ... },
    handleBatchSetPin(pinned) { ... },
};
```

### _batchConfig 配置结构

每个视图在初始化时设置：

**PromptsView:**
```js
this._batchConfig = {
    listId: 'prompt-list',
    batchBarId: 'prompt-batch-bar',
    selectedCountId: 'prompt-selected-count',
    selectAllId: 'prompt-select-all',
    batchManageBtnId: 'batch-manage-prompt-btn',
    entityLabel: '提示词',
    pluralLabel: '条提示词',
    batchAddTagsApi: API.batchAddPromptTags,
    batchRemoveTagsApi: API.batchRemovePromptTags,
    batchSetPinApi: API.batchSetPinPrompt,
    loadAll: () => this.loadPrompts(),
    getAllItems: () => this.allPrompts,
    tagInputId: 'batch-tags-input',
    tagCancelId: 'batch-tags-cancel-btn',
    tagConfirmId: 'batch-tags-confirm-btn',
    removeTagCbClass: 'batch-remove-tag-cb',
    removeTagSelectAllId: 'batch-remove-tags-select-all',
    removeTagDeselectAllId: 'batch-remove-tags-deselect-all',
    removeTagCancelId: 'batch-remove-tags-cancel-btn',
    removeTagConfirmId: 'batch-remove-tags-confirm-btn',
};
```

**SkillsView:**
```js
this._batchConfig = {
    listId: 'skill-list',
    batchBarId: 'skill-batch-bar',
    selectedCountId: 'skill-selected-count',
    selectAllId: 'skill-select-all',
    batchManageBtnId: 'batch-manage-skill-btn',
    entityLabel: '技能',
    pluralLabel: '个技能',
    batchAddTagsApi: API.batchAddSkillTags,
    batchRemoveTagsApi: API.batchRemoveSkillTags,
    batchSetPinApi: API.batchSetPinSkill,
    loadAll: () => this.loadSkills(),
    getAllItems: () => this.allSkills,
    tagInputId: 'skill-batch-tags-input',
    tagCancelId: 'skill-batch-tags-cancel-btn',
    tagConfirmId: 'skill-batch-tags-confirm-btn',
    removeTagCbClass: 'skill-batch-remove-tag-cb',
    removeTagSelectAllId: 'skill-batch-remove-tags-select-all',
    removeTagDeselectAllId: 'skill-batch-remove-tags-deselect-all',
    removeTagCancelId: 'skill-batch-remove-tags-cancel-btn',
    removeTagConfirmId: 'skill-batch-remove-tags-confirm-btn',
};
```

### 混入方式

在两个视图的 render() 中，`this.bindEvents()` 之前：

```js
Object.assign(this, BatchMixin);
this._batchConfig = { ... };  // 视图特有配置
```

### PromptsView 中需删除的方法（12 个）

从 PromptsView 对象字面量中移除以下方法的定义（它们将由 BatchMixin 提供）：
- `bindViewScroll` (L577-599)
- `toggleBatchMode` (L373-381)
- `exitBatchMode` (L386-392)
- `syncBatchMode` (L397-417)
- `updateBatchBar` (L345-354)
- `syncSelectionUI` (L359-368)
- `toggleSelectAll` (L423-439)
- `bindCheckboxEvents` (L307-340)
- `highlightItem` (L292-301)
- `handleBatchAddTags` (L1324-1349)
- `handleBatchRemoveTags` (L1351-1397)
- `handleBatchSetPin` (L1399-1406)

### SkillsView 中需删除的方法（12 个）

- `bindViewScroll` (L364-386)
- `toggleBatchMode` (L339-347)
- `exitBatchMode` (L352-358)
- `syncBatchMode` (L391-411)
- `updateBatchBar` (L311-320)
- `syncSelectionUI` (L325-334)
- `toggleSelectAll` (L417-433)
- `bindCheckboxEvents` (L273-306)
- `highlightItem` (L45-54)
- `handleBatchAddTags` (L455-480)
- `handleBatchRemoveTags` (L482-528)
- `handleBatchSetPin` (L530-537)

---

## 重构 2：withAIStream 单例防护

**文件**: `app.js` 第 890-928 行

**问题**: 所有 AI 操作共用 `ai:token`/`ai:done`/`ai:error` 三个全局事件名。并发时第二个操作的 `cleanup()` 会移除第一个操作的监听器。

**修复方案**: 在 `withAIStream` 中维护一个全局 `_activeStream` 引用。新操作开始前自动清理上一个操作。

```js
let _activeStream = null;

function withAIStream(apiMethod, callbacks) {
    const { onToken, onDone, onError } = callbacks;

    const cleanup = () => {
        if (window.runtime && window.runtime.EventsOff) {
            window.runtime.EventsOff('ai:token', 'ai:done', 'ai:error');
        }
        if (_activeStream && _activeStream.cleanup === cleanup) {
            _activeStream = null;
        }
    };

    // 清理上一个活跃的流式操作
    if (_activeStream) {
        _activeStream.cleanup();
        _activeStream = null;
    }

    if (window.runtime && window.runtime.EventsOn) {
        window.runtime.EventsOn('ai:token', (token) => {
            if (onToken) onToken(token);
        });

        window.runtime.EventsOn('ai:done', () => {
            cleanup();
            if (onDone) onDone();
        });

        window.runtime.EventsOn('ai:error', (errMsg) => {
            cleanup();
            if (onError) onError(errMsg);
        });
    }

    _activeStream = { cleanup };

    return {
        cleanup,
        call: async (...args) => {
            try {
                await apiMethod(...args);
            } catch (err) {
                cleanup();
                if (onError) onError(err.message || '操作失败');
            }
        }
    };
}
```

---

## 实施顺序

1. 在 `app.js` 中新增 `BatchMixin` 对象（放在 `AIActionButton` 之后、`withAIStream` 之前）
2. 修改 `withAIStream` 增加单例防护
3. 修改 `prompts.js`：render() 中混入 BatchMixin + 设置 _batchConfig，删除 12 个重复方法
4. 修改 `skills.js`：同上
5. 语法检查

## 验证方式

1. 语法检查：`node -c frontend/js/app.js && node -c frontend/js/views/prompts.js && node -c frontend/js/views/skills.js`
2. 功能验证：
   - 批量选择/全选/取消全选正常
   - 批量删除/添加标签/移除标签/置顶正常
   - 视图切换（卡片↔列表）正常
   - 键盘滚动快捷键正常
   - 高亮闪烁正常
   - AI 操作正常（不会因并发导致事件丢失）
