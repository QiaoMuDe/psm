# Prompt 使用统计功能实施计划

## 一、功能概述

记录每个 Prompt 被复制/使用的次数，在仪表盘展示"最常用提示词"列表，帮助用户发现和快速访问高频使用的 Prompt。

## 二、修改文件列表

### 后端文件
1. `internal/db/models.go` - 新增 UsageCount 字段
2. `internal/db/sqlite.go` - 数据库迁移，新增字段
3. `internal/service/prompt.go` - 新增统计方法
4. `app.go` - 新增 Handler 绑定

### 前端文件
1. `frontend/js/api.js` - 新增 API 方法
2. `frontend/js/views/prompts.js` - 复制时递增计数
3. `frontend/js/views/dashboard.js` - 展示最常用 Prompt
4. `frontend/css/components.css` - 新增样式

## 三、详细实施步骤

### 步骤 1：修改数据模型

**文件**：`internal/db/models.go`

在 Prompt 结构体中新增 UsageCount 字段：

```go
type Prompt struct {
    ID          int       `json:"id"`
    Name        string    `json:"name"`
    Content     string    `json:"content"`
    Category    string    `json:"category"`
    Tags        string    `json:"tags"`
    IsPinned    bool      `json:"is_pinned"`
    IsTemplate  bool      `json:"is_template"`
    UsageCount  int       `json:"usage_count"`  // 新增
    CreatedAt   time.Time `json:"created_at"`
    UpdatedAt   time.Time `json:"updated_at"`
}
```

### 步骤 2：数据库迁移

**文件**：`internal/db/sqlite.go`

在初始化函数中添加迁移逻辑：

```go
// 检查并添加 usage_count 字段
var columnExists int
db.QueryRow(`SELECT COUNT(*) FROM pragma_table_info('prompts') WHERE name='usage_count'`).Scan(&columnExists)
if columnExists == 0 {
    db.Exec(`ALTER TABLE prompts ADD COLUMN usage_count INTEGER DEFAULT 0`)
}
```

同时需要修改所有查询 prompts 的 SQL 语句，确保包含 usage_count 字段。

### 步骤 3：修改 Service 层

**文件**：`internal/service/prompt.go`

#### 3.1 修改 GetPrompt 方法
确保查询包含 usage_count 字段。

#### 3.2 修改 ListPrompts 方法
确保查询包含 usage_count 字段。

#### 3.3 修改 SearchPrompts 方法
确保查询包含 usage_count 字段。

#### 3.4 新增 IncrementUsage 方法

```go
// IncrementUsage 增加 Prompt 使用次数
func (s *PromptService) IncrementUsage(id int) error {
    _, err := db.Exec(`
        UPDATE prompts SET usage_count = usage_count + 1, updated_at = datetime('now') WHERE id = ?
    `, id)
    return err
}
```

#### 3.5 新增 GetTopUsedPrompts 方法

```go
// GetTopUsedPrompts 获取最常用的 Prompt
func (s *PromptService) GetTopUsedPrompts(limit int) ([]Prompt, error) {
    rows, err := db.Query(`
        SELECT id, name, content, category, tags, is_pinned, is_template, usage_count, created_at, updated_at
        FROM prompts
        WHERE usage_count > 0
        ORDER BY usage_count DESC
        LIMIT ?
    `, limit)
    if err != nil {
        return nil, err
    }
    defer rows.Close()

    var prompts []Prompt
    for rows.Next() {
        var p Prompt
        err := rows.Scan(&p.ID, &p.Name, &p.Content, &p.Category, &p.Tags,
                         &p.IsPinned, &p.IsTemplate, &p.UsageCount, &p.CreatedAt, &p.UpdatedAt)
        if err != nil {
            return nil, err
        }
        prompts = append(prompts, p)
    }

    if prompts == nil {
        prompts = []Prompt{}
    }

    return prompts, nil
}
```

### 步骤 4：修改 Handler 层

**文件**：`app.go`

新增两个绑定方法：

```go
// IncrementPromptUsage 增加 Prompt 使用次数
func (a *App) IncrementPromptUsage(id int) error {
    return a.promptService.IncrementUsage(id)
}

// GetTopUsedPrompts 获取最常用的 Prompt
func (a *App) GetTopUsedPrompts(limit int) ([]db.Prompt, error) {
    return a.promptService.GetTopUsedPrompts(limit)
}
```

### 步骤 5：修改前端 API 层

**文件**：`frontend/js/api.js`

新增两个 API 方法：

```javascript
incrementPromptUsage: (id) => 
    window.go.main.App.IncrementPromptUsage(id),

getTopUsedPrompts: (limit) => 
    window.go.main.App.GetTopUsedPrompts(limit),
```

### 步骤 6：修改 Prompt 复制功能

**文件**：`frontend/js/views/prompts.js`

#### 6.1 修改 copyContent 方法
在复制成功后调用 incrementPromptUsage：

```javascript
async copyContent(id) {
    try {
        const prompt = this.allPrompts.find(p => p.id === id);
        if (!prompt) return;

        await navigator.clipboard.writeText(prompt.content);

        // 新增：增加使用次数
        await API.incrementPromptUsage(id);

        // 更新本地数据
        prompt.usage_count = (prompt.usage_count || 0) + 1;

        Toast.success('已复制到剪贴板');
    } catch (err) {
        Toast.error('复制失败');
    }
}
```

#### 6.2 修改悬停复制功能
在悬停复制时也递增计数。

#### 6.3 修改卡片/列表显示
在卡片和列表视图中显示使用次数（可选）。

### 步骤 7：修改仪表盘

**文件**：`frontend/js/views/dashboard.js`

#### 7.1 新增 renderPopularPrompts 方法

```javascript
async renderPopularPrompts() {
    try {
        const prompts = await API.getTopUsedPrompts(5);

        if (prompts.length === 0) {
            return `
                <div class="dashboard-section">
                    <h3 class="section-title">最常用提示词</h3>
                    <div class="empty-state-small">
                        <p>暂无使用记录</p>
                    </div>
                </div>
            `;
        }

        const items = prompts.map(p => `
            <div class="popular-item" data-id="${p.id}" data-view="prompts">
                <div class="popular-item-header">
                    <span class="popular-item-name">${escapeHtml(p.name)}</span>
                    <span class="popular-item-count">${p.usage_count} 次使用</span>
                </div>
                <div class="popular-item-preview">${escapeHtml(p.content.substring(0, 80))}${p.content.length > 80 ? '...' : ''}</div>
            </div>
        `).join('');

        return `
            <div class="dashboard-section">
                <h3 class="section-title">最常用提示词</h3>
                <div class="popular-list">
                    ${items}
                </div>
            </div>
        `;
    } catch (err) {
        return '';
    }
}
```

#### 7.2 修改 render 方法
在仪表盘布局中添加最常用提示词模块。

#### 7.3 添加点击跳转事件
点击 Prompt 项跳转到 Prompt 模块并高亮显示。

### 步骤 8：添加 CSS 样式

**文件**：`frontend/css/components.css`

```css
/* 最常用提示词列表 */
.popular-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.popular-item {
    padding: 14px 16px;
    background: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    cursor: pointer;
    transition: all var(--transition);
}

.popular-item:hover {
    border-color: var(--primary-color);
    box-shadow: var(--shadow-sm);
    transform: translateY(-1px);
}

.popular-item:active {
    transform: scale(0.99);
}

.popular-item-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 6px;
}

.popular-item-name {
    font-weight: 600;
    font-size: 14px;
    color: var(--text-primary);
}

.popular-item-count {
    font-size: 12px;
    color: var(--text-secondary);
    background: var(--bg-secondary);
    padding: 3px 8px;
    border-radius: 10px;
}

.popular-item-preview {
    font-size: 13px;
    color: var(--text-secondary);
    line-height: 1.5;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

/* 使用次数徽章（卡片视图可选） */
.usage-badge {
    font-size: 11px;
    color: var(--text-secondary);
    background: var(--bg-secondary);
    padding: 2px 6px;
    border-radius: 8px;
    margin-left: 8px;
}
```

## 四、数据库迁移策略

### 迁移逻辑
1. 检查 `usage_count` 字段是否存在
2. 如果不存在，执行 `ALTER TABLE prompts ADD COLUMN usage_count INTEGER DEFAULT 0`
3. 现有数据的 `usage_count` 默认为 0

### 向后兼容
- 新字段有默认值，不影响现有数据
- 所有查询语句需要更新，包含新字段

## 五、测试要点

1. **数据库迁移**：启动应用后检查字段是否正确添加
2. **复制计数**：复制 Prompt 后检查 usage_count 是否递增
3. **仪表盘展示**：检查最常用提示词列表是否正确显示
4. **点击跳转**：点击仪表盘中的 Prompt 是否正确跳转
5. **空状态**：没有使用记录时显示空状态提示
6. **数据一致性**：多次复制后计数是否准确

## 六、预估工作量

| 模块 | 代码量 | 说明 |
|------|--------|------|
| 后端 Models | 10 行 | 新增字段 |
| 后端 SQLite | 15 行 | 迁移逻辑 |
| 后端 Service | 60 行 | 2 个新方法 + 修改查询 |
| 后端 Handler | 15 行 | 2 个绑定方法 |
| 前端 API | 10 行 | 2 个方法 |
| 前端 prompts.js | 30 行 | 复制计数逻辑 |
| 前端 dashboard.js | 80 行 | 最常用模块 |
| 前端 CSS | 60 行 | 样式 |
| **总计** | **约 280 行** | |

## 七、注意事项

1. **SQL 查询更新**：所有查询 prompts 的地方都需要包含 usage_count 字段
2. **空切片处理**：GetTopUsedPrompts 返回空切片而非 null
3. **本地数据同步**：复制后更新 allPrompts 数组中的 usage_count
4. **防抖处理**：快速多次复制只计一次（可选，当前方案每次复制都计数）
5. **更新时间**：递增 usage_count 时同时更新 updated_at（可选）