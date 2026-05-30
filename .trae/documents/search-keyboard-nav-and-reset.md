# 搜索框键盘导航 + 数据重置功能实现方案

> 版本: 1.0.0 | 日期: 2026-05-31 | 状态: 待确认

***

## 一、功能概述

### 功能 1：仪表盘搜索框键盘导航

* 上下键在候选选项中移动高亮

* 回车键选择当前高亮的选项

* Esc 键关闭下拉框

### 功能 2：数据管理模块新增重置功能

* 清空数据库中的所有提示词和技能

* 删除文件系统中的技能文件

* 将数据库设置恢复到初始状态

***

## 二、修改文件清单

### 功能 1：搜索框键盘导航

| 文件                               | 修改内容     |
| -------------------------------- | -------- |
| `frontend/js/views/dashboard.js` | 添加键盘导航逻辑 |

### 功能 2：数据重置功能

| 文件                             | 修改内容                                      |
| ------------------------------ | ----------------------------------------- |
| `internal/handler/backup.go`   | 新增 `ResetAllData()` 方法                    |
| `internal/service/settings.go` | 新增 `ResetSettings()` 方法                   |
| `internal/service/prompt.go`   | 新增 `DeleteAllPrompts()` 方法                |
| `internal/service/skill.go`    | 新增 `DeleteAllSkills(deleteFiles bool)` 方法 |
| `frontend/js/api.js`           | 新增 `resetAllData` API                     |
| `frontend/js/views/data.js`    | 新增重置功能 UI 和事件                             |

***

## 三、详细实现步骤

### 步骤 1：仪表盘搜索框键盘导航

**文件**: `frontend/js/views/dashboard.js`

#### 1.1 新增状态变量

```javascript
// 在 DashboardView 对象中新增
_searchIndex: -1,
```

#### 1.2 修改 bindSearchEvents 方法

在现有的 keydown 事件处理中添加上下键和回车键支持：

```javascript
searchInput.addEventListener('keydown', (e) => {
    const items = dropdown.querySelectorAll('.search-result-item');
    
    if (e.key === 'ArrowDown') {
        e.preventDefault();
        this._searchIndex = Math.min(this._searchIndex + 1, items.length - 1);
        this.updateSearchHighlight(items);
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        this._searchIndex = Math.max(this._searchIndex - 1, -1);
        this.updateSearchHighlight(items);
    } else if (e.key === 'Enter') {
        e.preventDefault();
        if (this._searchIndex >= 0 && items[this._searchIndex]) {
            items[this._searchIndex].click();
        }
    } else if (e.key === 'Escape') {
        dropdown.style.display = 'none';
        searchInput.blur();
        this._searchIndex = -1;
    }
});
```

#### 1.3 新增 updateSearchHighlight 方法

```javascript
updateSearchHighlight(items) {
    items.forEach((item, index) => {
        if (index === this._searchIndex) {
            item.classList.add('search-result-active');
            item.scrollIntoView({ block: 'nearest' });
        } else {
            item.classList.remove('search-result-active');
        }
    });
},
```

#### 1.4 在 performSearch 方法中重置索引

```javascript
async performSearch(keyword, dropdown) {
    this._searchIndex = -1;
    // ... 现有代码
}
```

#### 1.5 新增 CSS 样式

在 `components.css` 中添加：

```css
.search-result-active {
    background: var(--accent-light);
}
```

***

### 步骤 2：数据重置后端 API

#### 2.1 新增 Prompt 服务方法

**文件**: `internal/service/prompt.go`

```go
// DeleteAllPrompts 删除所有 Prompt 记录，返回删除数量
func (s *PromptService) DeleteAllPrompts() (int64, error) {
    result, err := s.db.Exec("DELETE FROM prompts")
    if err != nil {
        return 0, fmt.Errorf("删除所有 Prompt 失败: %w", err)
    }
    affected, err := result.RowsAffected()
    if err != nil {
        return 0, fmt.Errorf("获取删除数量失败: %w", err)
    }
    return affected, nil
}
```

#### 2.2 新增 Skill 服务方法

**文件**: `internal/service/skill.go`

```go
// DeleteAllSkills 删除所有 Skill 记录和文件，deleteFiles 为 true 时同时删除文件系统中的文件
func (s *SkillService) DeleteAllSkills(deleteFiles bool) (int64, error) {
    if deleteFiles {
        storagePath, err := s.settingsSvc.GetSkillStoragePath()
        if err == nil {
            skills, _ := s.GetSkills()
            for _, sk := range skills {
                fullPath := filepath.Join(storagePath, sk.RelativePath)
                _ = os.RemoveAll(fullPath)
            }
        }
    }
    
    result, err := s.db.Exec("DELETE FROM skills")
    if err != nil {
        return 0, fmt.Errorf("删除所有 Skill 失败: %w", err)
    }
    affected, err := result.RowsAffected()
    if err != nil {
        return 0, fmt.Errorf("获取删除数量失败: %w", err)
    }
    return affected, nil
}
```

#### 2.3 新增设置重置方法

**文件**: `internal/service/settings.go`

```go
// ResetSettings 重置所有设置为默认值
func (s *SettingsService) ResetSettings() error {
    tx, err := s.db.Begin()
    if err != nil {
        return fmt.Errorf("开启事务失败: %w", err)
    }
    
    if _, err := tx.Exec("DELETE FROM settings"); err != nil {
        _ = tx.Rollback()
        return fmt.Errorf("清空设置失败: %w", err)
    }
    
    defaults := map[string]string{
        "skill_storage_path": "~/.psm/skills",
        "app_theme":          "light",
        "prompt_view_mode":   "card",
        "skill_view_mode":    "card",
        "sidebar_collapsed":  "false",
        "font_size_offset":   "0px",
        "font_family":        "",
    }
    
    stmt, err := tx.Prepare("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)")
    if err != nil {
        _ = tx.Rollback()
        return fmt.Errorf("预编译语句失败: %w", err)
    }
    defer func() { _ = stmt.Close() }()
    
    for key, value := range defaults {
        if _, err := stmt.Exec(key, value); err != nil {
            _ = tx.Rollback()
            return fmt.Errorf("插入默认设置 '%s' 失败: %w", key, err)
        }
    }
    
    if err := tx.Commit(); err != nil {
        return fmt.Errorf("提交事务失败: %w", err)
    }
    return nil
}
```

#### 2.4 新增 BackupHandler 方法

**文件**: `internal/handler/backup.go`

```go
// ResetAllData 重置所有数据：清空提示词、技能（含文件）、恢复默认设置
func (h *BackupHandler) ResetAllData() (map[string]int64, error) {
    promptCount, err := h.promptSvc.DeleteAllPrompts()
    if err != nil {
        return nil, fmt.Errorf("清空提示词失败: %w", err)
    }
    
    skillCount, err := h.skillSvc.DeleteAllSkills(true)
    if err != nil {
        return nil, fmt.Errorf("清空技能失败: %w", err)
    }
    
    if err := h.settingsSvc.ResetSettings(); err != nil {
        return nil, fmt.Errorf("重置设置失败: %w", err)
    }
    
    return map[string]int64{
        "prompts_deleted": promptCount,
        "skills_deleted":  skillCount,
    }, nil
}
```

***

### 步骤 3：前端 API 和 UI

#### 3.1 新增 API 方法

**文件**: `frontend/js/api.js`

```javascript
resetAllData: () => API.call(window.go.main.App.ResetAllData),
```

#### 3.2 新增重置功能 UI

**文件**: `frontend/js/views/data.js`

在 `render` 方法中的 `grid grid-3` 后面添加：

```html
<div class="card" style="margin-top: var(--spacing-4); border: 1px solid var(--danger);">
    <div class="card-header">
        <h3 class="card-title" style="color: var(--danger);">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            危险操作
        </h3>
    </div>
    <div class="card-body">
        <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: var(--spacing-3);">
            重置所有数据：清空全部提示词和技能（含文件），恢复默认设置。此操作不可撤销！
        </p>
        <button class="btn btn-danger" id="reset-all-btn">重置所有数据</button>
    </div>
</div>
```

在 `bindEvents` 方法中添加：

```javascript
container.querySelector('#reset-all-btn').addEventListener('click', async () => {
    const confirmed1 = await Confirm.show(
        '⚠️ 警告：此操作将清空所有提示词和技能数据，并删除技能文件！\n\n建议先导出备份。确定继续吗？',
        { confirmText: '继续重置', type: 'danger' }
    );
    if (!confirmed1) return;
    
    const confirmed2 = await Confirm.show(
        '最后确认：所有数据将被永久删除且无法恢复！\n\n输入"确定"继续...',
        { confirmText: '确定删除', type: 'danger' }
    );
    if (!confirmed2) return;
    
    try {
        const result = await API.resetAllData();
        Toast.success(`重置完成：已删除 ${result.prompts_deleted} 条提示词、${result.skills_deleted} 个技能`);
        this.loadStats();
        this.loadOrphanStatus(container);
    } catch (err) {
        // 错误已由 API.call 处理
    }
});
```

***

## 四、使用流程

### 搜索框键盘导航

```
用户输入关键词 → 300ms 防抖 → 显示候选列表
  ↓
按 ↓ 键 → 高亮下一项
按 ↑ 键 → 高亮上一项
按 Enter → 选择当前高亮项 → 跳转到对应模块
按 Esc → 关闭下拉框
```

### 数据重置

```
用户点击"重置所有数据"按钮
  ↓
第一次确认：警告提示
  ↓
第二次确认：最后确认
  ↓
执行重置：清空 prompts 表 → 删除 skills 文件 → 清空 skills 表 → 重置 settings 表
  ↓
显示结果：删除数量统计
```

***

## 五、注意事项

1. **搜索框导航**：

   * 上下键需要 `e.preventDefault()` 防止光标移动

   * 高亮项需要 `scrollIntoView` 确保可见

   * 搜索结果变化时重置索引

2. **数据重置**：

   * 二次确认防止误操作

   * 建议用户先导出备份

   * 删除技能文件时需要先获取存储路径

   * 设置重置后需要刷新页面才能完全生效

***

## 六、测试用例

### 搜索框导航

1. 在仪表盘搜索框输入关键词
2. 按 ↓ 键，高亮移动到第一项
3. 继续按 ↓ 键，高亮移动到最后一项
4. 按 ↑ 键，高亮向上移动
5. 按 Enter，跳转到对应模块
6. 重新搜索，高亮索引重置

### 数据重置

1. 点击"重置所有数据"按钮
2. 第一次确认对话框显示
3. 取消，不执行操作
4. 确认，显示第二次确认
5. 确认，执行重置
6. 统计数据更新为 0

