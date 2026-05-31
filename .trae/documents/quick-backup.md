# 一键备份还原功能

## 需求概述

在数据管理模块新增一键备份/还原功能，备份文件固定存储在 `~/.psm/backup/psm-backup.zip`，每次覆盖上次备份，无需弹出文件对话框。

## 功能设计

### 备份文件路径
- 固定路径：`~/.psm/backup/psm-backup.zip`
- 每次备份直接覆盖，只保留最新一份

### UI 设计
在现有"导出数据"和"导入数据"卡片前面，新增一个"快速备份"卡片：
- 有备份时：显示备份时间、文件大小，"一键备份"和"一键还原"按钮均可用
- 无备份时：红色文字提示"暂无本地备份"，"一键还原"按钮禁用

### 后端方法

#### 1. `QuickBackupInfo` — 获取备份状态信息
- 返回 `{exists: bool, backup_time: string, file_size: int64}`
- 检查 `~/.psm/backup/psm-backup.zip` 是否存在
- 存在时读取文件修改时间作为备份时间，读取文件大小
- 不存在时返回 `exists: false`

#### 2. `QuickBackup` — 一键备份
- 复用现有 `BackupData` 方法的数据收集逻辑
- 固定保存路径为 `~/.psm/backup/psm-backup.zip`
- 直接覆盖，不弹对话框

#### 3. `QuickRestore` — 一键还原
- 调用现有 `RestoreData` 方法
- 固定读取 `~/.psm/backup/psm-backup.zip`
- 不弹对话框

---

## 修改文件清单

### Step 1: 后端 — `internal/handler/backup.go`

新增 3 个方法：

```go
// QuickBackupInfo 一键备份状态信息
func (h *BackupHandler) QuickBackupInfo() (map[string]interface{}, error)

// QuickBackup 一键备份到固定路径
func (h *BackupHandler) QuickBackup() error

// QuickRestore 从固定路径一键还原
func (h *BackupHandler) QuickRestore() (*utils.BackupRestoreResult, error)
```

内部逻辑：
- `getBackupPath()` 辅助函数，返回 `~/.psm/backup/psm-backup.zip`
- `QuickBackupInfo`: 检查文件存在性，读取修改时间和大小
- `QuickBackup`: 调用现有 `BackupData(savePath)` 的数据收集逻辑，固定 savePath
- `QuickRestore`: 调用现有 `RestoreData(zipPath)`，固定 zipPath

### Step 2: 前端 API — `frontend/js/api.js`

新增 3 个 API 封装：

```js
quickBackupInfo: () => API.call(window.go.main.App.QuickBackupInfo),
quickBackup: () => API.call(window.go.main.App.QuickBackup),
quickRestore: () => API.call(window.go.main.App.QuickRestore),
```

### Step 3: 前端视图 — `frontend/js/views/data.js`

#### 3a. 修改 `render` 方法

在现有 3 个卡片前面，新增一个"快速备份"卡片：

```html
<div class="card" style="border: 1px solid var(--primary);">
    <div class="card-header">
        <h3 class="card-title">⚡ 快速备份</h3>
    </div>
    <div class="card-body">
        <div id="quick-backup-status" class="quick-backup-status">检测中...</div>
        <div class="quick-backup-actions">
            <button class="btn btn-primary" id="quick-backup-btn">一键备份</button>
            <button class="btn btn-default" id="quick-restore-btn" disabled>一键还原</button>
        </div>
    </div>
</div>
```

#### 3b. 新增 `loadBackupStatus` 方法

调用 `API.quickBackupInfo()`，根据结果更新：
- 状态文字（有/无备份 + 时间 + 大小）
- 还原按钮禁用/启用

#### 3c. 修改 `bindEvents`

绑定新按钮的点击事件：
- 一键备份：调用 `API.quickBackup()` → 提示成功 → 刷新状态
- 一键还原：二次确认 → 调用 `API.quickRestore()` → 提示结果 → 刷新统计

---

## 向后兼容

- 现有的"导出数据"和"导入数据"功能保持不变
- 一键备份是新增功能，不影响已有流程

## 验证要点

1. 无备份时状态显示"暂无本地备份"红色文字，还原按钮禁用
2. 点击一键备份后，状态更新为显示备份时间和文件大小
3. 再次点击一键备份，覆盖上次备份，时间更新
4. 点击一键还原，二次确认后恢复数据
5. `~/.psm/backup/` 目录自动创建
