# Skill 详情弹窗重新设计方案

> 版本: 1.0.0 | 日期: 2026-05-31 | 状态: 待确认

***

## 一、当前问题分析

从截图来看，当前布局存在以下问题：

1. **描述和时间信息混在一起**：技能名称、描述、创建时间、更新时间全部堆在 header 区域，层次不清晰
2. **文件列表和关闭按钮之间的分隔线位置不好**：`detail-actions` 的分隔线让关闭按钮显得突兀
3. **表格内容拥挤**：文件列表表格的列间距不够，视觉上挤在一起
4. **缺少交互反馈**：双击文件/目录没有响应

***

## 二、新设计方案

### 布局结构

```
┌─────────────────────────────────────────────────────┐
│  Skill 详情                                    [×]  │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │  📦 gin-web                                  │   │
│  │  Gin Web 框架开发技能。包含路由定义、...      │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ┌──────────────┐  ┌──────────────┐                 │
│  │ 🕐 创建时间   │  │ ✏️ 更新时间   │                 │
│  │ 2026/5/31    │  │ 2026/5/31    │                 │
│  └──────────────┘  └──────────────┘                 │
│                                                     │
│  ─────────────────────────────────────────────────  │
│                                                     │
│  📁 文件列表                              1 项       │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │  📄 SKILL.md    文件    390 B    03:11:23    │   │
│  │  📁 scripts     目录    -        03:11:23    │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
├─────────────────────────────────────────────────────┤
│                                    [关闭]            │
└─────────────────────────────────────────────────────┘
```

### 设计要点

1. **技能信息卡片化**：名称和描述放在一个带背景色的卡片中，与时间信息分离
2. **时间信息独立显示**：创建时间和更新时间放在两个并排的小卡片中
3. **文件列表优化**：

   * 移除"类型"列（用图标区分即可）

   * 增大列间距

   * 双击文件/目录打开文件管理器
4. **关闭按钮独立**：移除分隔线，关闭按钮右对齐

***

## 三、修改文件清单

| 文件                             | 修改内容                           |
| ------------------------------ | ------------------------------ |
| `frontend/js/views/skills.js`  | 重构 viewSkill 方法的 HTML 结构       |
| `frontend/css/components.css`  | 新增技能详情弹窗样式                     |
| `internal/handler/settings.go` | 新增 `RevealInExplorer(path)` 方法 |
| `frontend/js/api.js`           | 新增 `revealInExplorer` API      |

***

## 四、详细实现步骤

### 步骤 1：后端 - 打开文件管理器

**文件**: `internal/handler/settings.go`

```go
// RevealInExplorer 在文件管理器中打开指定路径
func (h *SettingsHandler) RevealInExplorer(path string) error {
    cmd := exec.Command("explorer", path)
    return cmd.Start()
}
```

**文件**: `frontend/js/api.js`

```javascript
revealInExplorer: (path) => API.call(window.go.main.App.RevealInExplorer, path),
```

***

### 步骤 2：重构 viewSkill HTML 结构

**文件**: `frontend/js/views/skills.js`

新的 HTML 结构：

```javascript
const content = `
    <div class="skill-detail">
        <div class="skill-detail-info">
            <div class="skill-detail-name">${escapeHtml(skill.name)}</div>
            ${skill.description ? `<div class="skill-detail-desc">${escapeHtml(skill.description)}</div>` : ''}
        </div>
        
        <div class="skill-detail-meta-grid">
            <div class="skill-detail-meta-card">
                <div class="skill-detail-meta-label">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                    </svg>
                    创建时间
                </div>
                <div class="skill-detail-meta-value">${createdTime}</div>
            </div>
            <div class="skill-detail-meta-card">
                <div class="skill-detail-meta-label">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                    </svg>
                    更新时间
                </div>
                <div class="skill-detail-meta-value">${updatedTime}</div>
            </div>
        </div>
        
        <div class="skill-detail-divider"></div>
        
        <div class="skill-detail-files">
            <div class="skill-detail-files-header">
                <div class="skill-detail-files-title">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                    </svg>
                    文件列表
                </div>
                <span class="skill-detail-files-count">${files.length} 项</span>
            </div>
            ${files.length > 0 ? `
            <div class="skill-detail-files-list">
                ${files.map(f => `
                    <div class="skill-detail-file-item" data-path="${escapeHtml(f.full_path || '')}" data-is-dir="${f.is_dir}">
                        <span class="skill-detail-file-icon">${f.is_dir ? folderIcon : fileIcon}</span>
                        <span class="skill-detail-file-name">${escapeHtml(f.name)}</span>
                        <span class="skill-detail-file-size">${f.is_dir ? '-' : (f.size > 1024 ? (f.size / 1024).toFixed(1) + ' KB' : f.size + ' B')}</span>
                        <span class="skill-detail-file-time">${f.mod_time}</span>
                    </div>
                `).join('')}
            </div>
            ` : `
            <div class="skill-detail-files-empty">该技能暂无文件</div>
            `}
        </div>
        
        <div class="skill-detail-actions">
            <button class="btn btn-default" onclick="Modal.close()">关闭</button>
        </div>
    </div>
`;

Modal.open('Skill 详情', content, { width: '600px' });

// 绑定双击事件
container.querySelectorAll('.skill-detail-file-item').forEach(item => {
    item.addEventListener('dblclick', async () => {
        const path = item.dataset.path;
        if (path) {
            await API.revealInExplorer(path);
        }
    });
});
```

***

### 步骤 3：新增 CSS 样式

**文件**: `frontend/css/components.css`

```css
/* ==================== Skill 详情弹窗 ==================== */

.skill-detail {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-4);
}

.skill-detail-info {
    background: var(--bg-page);
    border-radius: var(--radius);
    padding: var(--spacing-4);
    border: 1px solid var(--border);
}

.skill-detail-name {
    font-size: calc(20px + var(--font-size-offset));
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: var(--spacing-2);
}

.skill-detail-desc {
    font-size: calc(14px + var(--font-size-offset));
    color: var(--text-secondary);
    line-height: 1.6;
}

.skill-detail-meta-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--spacing-3);
}

.skill-detail-meta-card {
    background: var(--bg-surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: var(--spacing-3);
}

.skill-detail-meta-label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: calc(12px + var(--font-size-offset));
    color: var(--text-secondary);
    margin-bottom: 4px;
}

.skill-detail-meta-value {
    font-size: calc(14px + var(--font-size-offset));
    color: var(--text-primary);
    font-weight: 500;
}

.skill-detail-divider {
    height: 1px;
    background: var(--border);
}

.skill-detail-files-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--spacing-3);
}

.skill-detail-files-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: calc(15px + var(--font-size-offset));
    font-weight: 600;
    color: var(--text-primary);
}

.skill-detail-files-count {
    font-size: calc(13px + var(--font-size-offset));
    color: var(--text-secondary);
    background: var(--bg-page);
    padding: 4px 10px;
    border-radius: var(--radius);
}

.skill-detail-files-list {
    display: flex;
    flex-direction: column;
    gap: 2px;
    background: var(--bg-page);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    overflow: hidden;
}

.skill-detail-file-item {
    display: grid;
    grid-template-columns: auto 1fr auto auto;
    gap: var(--spacing-3);
    align-items: center;
    padding: var(--spacing-3) var(--spacing-4);
    cursor: pointer;
    transition: background var(--transition-fast);
}

.skill-detail-file-item:hover {
    background: var(--bg-surface);
}

.skill-detail-file-item:active {
    transform: scale(0.99);
}

.skill-detail-file-item:not(:last-child) {
    border-bottom: 1px solid var(--border);
}

.skill-detail-file-icon {
    color: var(--text-secondary);
}

.skill-detail-file-name {
    font-size: calc(14px + var(--font-size-offset));
    color: var(--text-primary);
    font-weight: 500;
}

.skill-detail-file-size {
    font-size: calc(13px + var(--font-size-offset));
    color: var(--text-secondary);
    min-width: 60px;
    text-align: right;
}

.skill-detail-file-time {
    font-size: calc(13px + var(--font-size-offset));
    color: var(--text-secondary);
    min-width: 140px;
    text-align: right;
}

.skill-detail-files-empty {
    text-align: center;
    padding: var(--spacing-4);
    color: var(--text-secondary);
    font-size: calc(14px + var(--font-size-offset));
}

.skill-detail-actions {
    display: flex;
    justify-content: flex-end;
    padding-top: var(--spacing-2);
}
```

***

## 五、双击打开文件管理器

### 实现逻辑

1. 双击文件项 → 调用 `API.revealInExplorer(filePath)`
2. 双击目录项 → 调用 `API.revealInExplorer(dirPath)`
3. 后端执行 `explorer.exe <path>` 打开文件管理器

### 注意事项

* 需要传递完整的文件路径（`full_path`）

* 文件列表数据中需要包含 `full_path` 字段

* 后端 `listSkillFiles` 方法需要返回完整路径

***

## 六、测试用例

1. 打开 Skill 详情弹窗，检查布局是否清晰
2. 检查描述和时间信息是否分离
3. 双击文件，验证文件管理器打开
4. 双击目录，验证文件管理器打开
5. 检查关闭按钮位置是否合理

