# 程序家目录可配置化

## 需求概述

新增 `app_home` 配置项，控制程序核心目录位置。数据库、备份、日志跟随 `app_home`。技能目录默认跟随 `app_home`，也可独立配置。

## 鸡生蛋问题

数据库存储设置，但数据库路径本身需要由 `app_home` 决定。解决方案：使用一个极小的 JSON 配置文件 `~/.psm/config.json` 存储 `app_home` 路径，仅此一项。

## 目录结构设计

```
~/.psm/config.json          ← 引导配置（仅 app_home，固定位置）
~/.psm/                     ← 默认 app_home（用户未自定义时）
├── data.db                 ← 数据库
├── backup/
│   └── psm-backup.zip      ← 一键备份
├── logs/                   ← 日志
└── skills/                 ← 技能目录（默认值）
```

用户自定义 app_home 后：
```
~/my-data/                  ← 自定义 app_home
├── data.db
├── backup/
├── logs/
└── skills/                 ← 技能目录默认跟随
```

## 硬编码路径扫描

| 文件 | 行 | 当前路径 | 改为 |
|------|-----|----------|------|
| `app.go` | L36-37 | `~/.psm/data.db` | 从 config.json 读取 app_home → 拼接 data.db |
| `internal/db/sqlite.go` | L129 | `~/.psm/skills` | 从 app_home 拼接 |
| `internal/service/settings.go` | L118 | `~/.psm/skills` | 从 app_home 拼接 |
| `internal/handler/backup.go` | L159 | `~/.psm/data.db` | 从 app_home 拼接 |
| `internal/handler/backup.go` | L224 | `~/.psm/backup/...` | 从 app_home 拼接 |
| `tools/seed/main.go` | L571 | `~/.psm/data.db` | 保持不变（种子脚本独立） |
| `tools/seed/main.go` | L621 | `~/.psm/skills` | 保持不变 |

## 修改计划

### Step 1: 新增引导配置读取 — `internal/utils/config.go`（新文件）

提供读写 `~/.psm/config.json` 的能力：

```go
// AppConfig 引导配置
type AppConfig struct {
    AppHome string `json:"app_home"`
}

// DefaultAppHome 默认程序家目录
func DefaultAppHome() string

// GetConfigPath 获取配置文件路径 (~/.psm/config.json)
func GetConfigPath() string

// LoadAppConfig 加载引导配置，不存在则返回默认值
func LoadAppConfig() (*AppConfig, error)

// SaveAppConfig 保存引导配置
func SaveAppConfig(cfg *AppConfig) error

// ResolveAppHome 解析 app_home 路径（有自定义用自定义，否则默认）
func ResolveAppHome() (string, error)
```

### Step 2: 修改启动流程 — `app.go`

启动时先读取 `config.json` 获取 `app_home`，再用 `app_home` 拼接 `data.db` 路径：

```go
func (a *App) startup(ctx context.Context) {
    a.ctx = ctx

    appHome, _ := utils.ResolveAppHome()
    dbPath := filepath.Join(appHome, "data.db")

    database, err := db.InitDB(dbPath)
    // ...
}
```

### Step 3: 修改默认设置 — `internal/db/sqlite.go`

`insertDefaultSettings` 中 `skill_storage_path` 默认值改为从 `app_home` 拼接：

```go
func insertDefaultSettings(db *sql.DB) error {
    appHome, _ := utils.ResolveAppHome()
    skillPath := filepath.Join(appHome, "skills")
    // INSERT OR IGNORE ...
}
```

### Step 4: 修改设置重置 — `internal/service/settings.go`

`ResetSettings` 中默认值从 `app_home` 拼接：

```go
func (s *SettingsService) ResetSettings() error {
    appHome, _ := utils.ResolveAppHome()
    skillPath := filepath.Join(appHome, "skills")
    defaults := map[string]string{
        "skill_storage_path": skillPath,
        // ...
    }
}
```

### Step 5: 修改数据统计 — `internal/handler/backup.go`

`GetDataStats` 中数据库路径从 `app_home` 拼接，`getBackupPath` 同理：

```go
func (h *BackupHandler) GetDataStats() (*DataStats, error) {
    appHome, _ := utils.ResolveAppHome()
    dbPath := filepath.Join(appHome, "data.db")
    // ...
}

func getBackupPath() (string, error) {
    appHome, _ := utils.ResolveAppHome()
    return filepath.Join(appHome, "backup", "psm-backup.zip"), nil
}
```

### Step 6: 新增 API — `internal/handler/settings.go`

新增方法供前端获取/修改 `app_home`：

```go
// GetAppHome 获取程序家目录路径
func (h *SettingsHandler) GetAppHome() (string, error)

// SetAppHome 设置程序家目录路径（保存到 config.json）
func (h *SettingsHandler) SetAppHome(path string) error

// ResetAppHome 重置为默认家目录
func (h *SettingsHandler) ResetAppHome() error
```

### Step 7: 前端 API — `frontend/js/api.js`

```js
getAppHome: () => API.call(window.go.main.App.GetAppHome),
setAppHome: (path) => API.call(window.go.main.App.SetAppHome, path),
resetAppHome: () => API.call(window.go.main.App.ResetAppHome),
```

### Step 8: 设置页 UI — `frontend/js/views/settings.js`

在"存储"分组中新增"程序家目录"行：

```
程序家目录
├── 路径输入框（只读）+ 打开按钮 + 更改按钮 + 重置默认按钮
├── 提示文字：数据库、备份、日志将存储在此目录下
└── 保存时调用 API.setAppHome(path)
```

将"Skill 存储路径"保持在其下方，逻辑不变。

## 向后兼容

- 首次安装：`config.json` 不存在 → 使用默认 `~/.psm/`
- 已有用户：`config.json` 不存在 → 行为与当前完全一致
- 修改 app_home 后：需要重启应用使数据库路径生效
- 种子脚本 `tools/seed/main.go` 保持硬编码不变（独立工具）

## 验证要点

1. 首次启动无 config.json → 使用默认 `~/.psm/`，一切正常
2. 设置页修改 app_home → 保存到 config.json → 重启后生效
3. 重置为默认 → config.json 中 app_home 被清除
4. 数据库、备份、日志跟随 app_home
5. 技能目录默认跟随 app_home，可独立覆盖
6. 已有用户的 skill_storage_path 设置不被覆盖
