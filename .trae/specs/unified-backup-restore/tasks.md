# Tasks

## 后端：备份恢复服务

- [x] Task 1: 创建备份恢复工具函数 `internal/utils/backup.go`
  - [x] SubTask 1.1: 定义 BackupData 结构体（version、created_at、settings、prompts、skills）
  - [x] SubTask 1.2: 实现 `CreateBackupArchive` — 读取数据 + 打包 Skill 文件为 ZIP
  - [x] SubTask 1.3: 实现 `RestoreBackupArchive` — 解压 ZIP + 解析 data.json + 恢复数据

- [x] Task 2: 在 app.go 添加绑定方法
  - [x] SubTask 2.1: 添加 `BackupData(savePath string)` 方法
  - [x] SubTask 2.2: 添加 `RestoreData(zipPath string)` 方法

## 前端：设置页面集成

- [x] Task 3: 在 api.js 添加 API 封装
  - [x] SubTask 3.1: 添加 `backupData(savePath)` 方法
  - [x] SubTask 3.2: 添加 `restoreData(zipPath)` 方法

- [x] Task 4: 更新设置页面视图 `views/settings.js`
  - [x] SubTask 4.1: 在设置页面底部新增「数据管理」区域（备份按钮 + 恢复按钮）
  - [x] SubTask 4.2: 备份按钮点击 → 调用 SaveFileDialog → 调用 API.backupData
  - [x] SubTask 4.3: 恢复按钮点击 → 确认对话框 → OpenFileDialog → 调用 API.restoreData → 显示恢复结果

## 验证

- [x] Task 5: 构建验证
  - [x] SubTask 5.1: `wails build` 构建成功
  - [ ] SubTask 5.2: 测试备份功能（生成 ZIP 包，检查内容结构）
  - [ ] SubTask 5.3: 测试恢复功能（从备份包恢复，验证数据完整性）
  - [ ] SubTask 5.4: 测试恢复失败场景（无效文件、损坏文件）

# Task Dependencies

- [Task 1] 无依赖，可立即开始
- [Task 2] 依赖 [Task 1]
- [Task 3] 依赖 [Task 2]（需要知道绑定方法签名）
- [Task 4] 依赖 [Task 3]
- [Task 5] 依赖 [Task 4]
