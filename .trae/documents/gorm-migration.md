# GORM 引入重构计划（更新版）

## 一、目标

引入 GORM 库替代原生 SQL，实现：
1. **自动迁移**：改结构体标签即可同步数据库
2. **简化 CRUD**：减少重复的 SQL 代码
3. **类型安全**：编译时检查，减少运行时错误
4. **长期维护**：降低后续数据库变更的维护成本

## 二、当前进度

### ✅ 已完成

| 文件 | 状态 | 说明 |
|------|------|------|
| `go.mod` | ✅ | 已添加 `gorm.io/gorm` + `gorm.io/driver/sqlite` 依赖 |
| `internal/db/models.go` | ✅ | 已重写，添加 GORM 标签，`CreatedAt`/`UpdatedAt` 改为 `time.Time` |
| `internal/db/gorm.go` | ✅ | 已创建，GORM 初始化 + 自动迁移 + 默认设置 |
| `internal/db/sqlite.go` | ✅ | 已删除（功能合并到 gorm.go） |
| `internal/service/settings.go` | ✅ | 已重写，空结构体 + `db.DB` 全局实例 |
| `internal/service/prompt.go` | ✅ | 已重写，空结构体 + `db.DB` 全局实例 |

### ⏳ 待完成

| 文件 | 问题 | 优先级 |
|------|------|--------|
| `internal/service/skill.go` | 仍使用 `*sql.DB` 原生 SQL | P0 |
| `app.go` | 仍使用 `*sql.DB`，旧 Service 构造函数 | P0 |
| `internal/handler/settings.go` | `Init()` 方法需改为构造函数 | P0 |
| `internal/handler/prompt.go` | `Init()` 方法需改为构造函数 | P0 |
| `internal/handler/skill.go` | `Init()` 方法需改为构造函数 | P0 |
| `internal/handler/backup.go` | `Init()` 方法需改为构造函数 + time.Time 类型修复 | P0 |
| `internal/utils/export.go` | 缺少 `MustMarshalJSON` 函数 | P0 |
| `internal/service/prompt.go` | 缺少 `DeleteAllPrompts` 方法 | P0 |
| `internal/handler/prompt.go` | `ImportPrompts` 返回类型不匹配 | P0 |
| `go.mod` | `modernc.org/sqlite` 应移除 | P1 |

## 三、详细实施步骤

### 阶段 1：修复已重写文件中的编译错误

#### 1.1 添加 `utils.MustMarshalJSON` 函数

**文件**: `internal/utils/export.go`

```go
// MustMarshalJSON 将值序列化为 JSON 字符串，失败时返回 "[]"
func MustMarshalJSON(v interface{}) string {
    data, err := json.Marshal(v)
    if err != nil {
        return "[]"
    }
    return string(data)
}
```

#### 1.2 为 PromptService 添加 `DeleteAllPrompts` 方法

**文件**: `internal/service/prompt.go`

```go
// DeleteAllPrompts 删除所有 Prompt 记录，返回删除数量
func (s *PromptService) DeleteAllPrompts() (int64, error) {
    result := db.DB.Unscoped().Delete(&db.Prompt{})
    if result.Error != nil {
        return 0, fmt.Errorf("删除所有 Prompt 失败: %w", result.Error)
    }
    return result.RowsAffected, nil
}
```

#### 1.3 修复 PromptHandler.ImportPrompts 返回类型

**文件**: `internal/handler/prompt.go`

当前问题：`ImportPrompts` 返回 `*db.ImportResult`，但 `PromptService.ImportPrompts` 返回 `(int, error)`。

修改 Handler 方法：
```go
func (h *PromptHandler) ImportPrompts(filePath string) (*db.ImportResult, error) {
    count, err := h.promptSvc.ImportPrompts(filePath)
    if err != nil {
        return nil, err
    }
    return &db.ImportResult{Success: count}, nil
}
```

### 阶段 2：重写 skill.go 使用 GORM API

**文件**: `internal/service/skill.go`

核心变更：
- 移除 `*sql.DB` 字段，改为空结构体
- 构造函数 `NewSkillService()` 不再需要参数
- 所有 `s.db.QueryRow()` / `s.db.Query()` / `s.db.Exec()` 替换为 GORM API
- 保留 `settingsSvc` 依赖（用于文件路径操作）
- 保留所有文件系统和 ZIP 工具调用不变

#### 方法映射表

| 原方法 | GORM 实现 |
|--------|-----------|
| `s.db.Exec("INSERT INTO skills ...")` | `db.DB.Create(&skill)` |
| `s.db.QueryRow("SELECT ... FROM skills WHERE id = ?").Scan(...)` | `db.DB.First(&skill, id)` |
| `s.db.Query("SELECT ... FROM skills ORDER BY ...")` + rows.Scan | `db.DB.Order("...").Find(&skills)` |
| `s.db.Exec("UPDATE skills SET ...")` | `db.DB.Model(&skill).Updates(...)` |
| `s.db.Exec("DELETE FROM skills WHERE id = ?")` | `db.DB.Delete(&skill{}, id)` |
| `s.db.QueryRow("SELECT EXISTS(...)").Scan(&exists)` | `db.DB.Where("name = ?", name).First(&skill).Error == nil` |
| `s.db.Exec("DELETE FROM skills")` | `db.DB.Unscoped().Delete(&db.Skill{})` |

#### 注意事项

1. `CreateSkill` 和 `ImportSkill` 中的时间字段不再需要手动 `time.Now().Format()`，GORM 自动管理
2. `TogglePinSkill` 使用 GORM 的 `Updates` 方法替代 `CASE WHEN` SQL
3. `BatchDeleteSkills` 使用 `db.DB.Delete(&db.Skill{}, ids)` 批量删除
4. `GetOrphanSkills` 和 `DeleteAllSkills` 保留文件系统操作，仅数据库部分使用 GORM
5. `ImportSkillFromExportZip` 中的循环查询改为 GORM 链式调用

### 阶段 3：修改 app.go

**文件**: `app.go`

核心变更：
- 移除 `database *sql.DB` 字段
- `startup()` 中调用 `db.InitDB(dbPath)` 不再返回 `*sql.DB`
- Service 构造函数不再需要 `*sql.DB` 参数
- `shutdown()` 中通过 `db.DB.DB()` 获取底层连接关闭

```go
type App struct {
    ctx context.Context

    handler.SettingsHandler
    handler.PromptHandler
    handler.SkillHandler
    handler.BackupHandler
}

func (a *App) startup(ctx context.Context) {
    a.ctx = ctx

    homeDir, _ := os.UserHomeDir()
    dbPath := filepath.Join(homeDir, ".psm", "data.db")

    if err := db.InitDB(dbPath); err != nil {
        panic(fmt.Sprintf("初始化数据库失败: %v", err))
    }

    settingsSvc := service.NewSettingsService()
    promptSvc := service.NewPromptService()
    skillSvc := service.NewSkillService(settingsSvc)

    storagePath, err := settingsSvc.GetSkillStoragePath()
    if err == nil {
        _ = os.MkdirAll(storagePath, 0755)
    }

    a.SettingsHandler.Init(ctx, settingsSvc)
    a.PromptHandler.Init(promptSvc)
    a.SkillHandler.Init(skillSvc)
    a.BackupHandler.Init(settingsSvc, promptSvc, skillSvc)
}

func (a *App) shutdown(ctx context.Context) {
    if db.DB != nil {
        sqlDB, _ := db.DB.DB()
        if sqlDB != nil {
            _ = sqlDB.Close()
        }
    }
}
```

### 阶段 4：修改 Handler 层

#### 4.1 handler/settings.go

保持现有 `Init()` 模式不变（因为需要 `context.Context`），仅确保构造函数正确。

#### 4.2 handler/prompt.go

保持现有 `Init()` 模式不变，修复 `ImportPrompts` 返回类型。

#### 4.3 handler/skill.go

保持现有 `Init()` 模式不变。

#### 4.4 handler/backup.go

**核心变更**：`BackupPrompt` 和 `BackupSkill` 的 `CreatedAt`/`UpdatedAt` 字段类型需从 `string` 改为 `time.Time`（或使用 `Format()` 转换）。

**方案 A**（推荐）：在 backup.go 中转换格式
```go
backupPrompts = append(backupPrompts, utils.BackupPrompt{
    Name:      p.Name,
    Content:   p.Content,
    Category:  p.Category,
    Tags:      p.Tags,
    CreatedAt: p.CreatedAt.Format(time.RFC3339),
    UpdatedAt: p.UpdatedAt.Format(time.RFC3339),
})
```

**方案 B**：修改 `utils.BackupPrompt` 和 `utils.BackupSkill` 的字段类型为 `time.Time`

推荐方案 A，因为备份 JSON 文件需要人类可读的时间字符串格式。

### 阶段 5：清理依赖

```bash
go mod tidy
```

移除不再需要的 `modernc.org/sqlite` 依赖（GORM 使用 `mattn/go-sqlite3`）。

### 阶段 6：编译验证

```bash
wails dev
```

启动开发服务器，验证：
1. 数据库自动迁移成功
2. 现有数据保留
3. 所有 CRUD 操作正常
4. 前端无报错

## 四、文件修改清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `internal/utils/export.go` | 编辑 | 添加 `MustMarshalJSON` 函数 |
| `internal/service/prompt.go` | 编辑 | 添加 `DeleteAllPrompts` 方法 |
| `internal/handler/prompt.go` | 编辑 | 修复 `ImportPrompts` 返回类型 |
| `internal/service/skill.go` | 重写 | 全面使用 GORM API |
| `app.go` | 编辑 | 移除 `*sql.DB`，更新构造函数 |
| `internal/handler/backup.go` | 编辑 | 修复 time.Time 类型转换 |
| `go.mod` | 编辑 | 移除 `modernc.org/sqlite` |

## 五、风险点

1. **`gorm.io/driver/sqlite` 依赖 `mattn/go-sqlite3`（CGO）**：当前 `go get` 已成功，但需确认 Wails 构建环境支持 CGO
2. **现有数据库兼容性**：GORM AutoMigrate 会保留现有数据，但会新增 `deleted_at` 列
3. **`time.Time` vs `string`**：备份恢复中时间格式需保持一致（使用 RFC3339）
4. **软删除**：`gorm.DeletedAt` 会影响所有查询（自动过滤已删除记录），需确认现有逻辑不受影响

## 六、验证清单

- [ ] `go build ./...` 编译通过
- [ ] `wails dev` 启动成功
- [ ] 现有 Prompt/Skill 数据正常显示
- [ ] 新建/编辑/删除 Prompt 正常
- [ ] 新建/编辑/删除 Skill 正常
- [ ] 搜索/筛选功能正常
- [ ] 导入/导出功能正常
- [ ] 备份恢复功能正常
- [ ] 仪表盘统计正常
- [ ] 设置页功能正常
- [ ] 主题切换正常
