# Tasks

- [x] Task 1: 引入 fastlog 依赖并创建 `internal/log` 包
  - [x] SubTask 1.1: 在 `go.mod` 中添加 `gitee.com/MM-Q/fastlog` 依赖（执行 `go get`）
  - [x] SubTask 1.2: 创建 `internal/log/log.go`，实现 `Init(path)` / `Get()` / `Close()` 三个函数，内部使用 `fastlog.New(fastlog.Dev(path))` 创建 Logger

- [x] Task 2: 修改 `app.go` 集成 Logger 生命周期
  - [x] SubTask 2.1: 在 `App` 结构体中新增 `logger *fastlog.Logger` 字段
  - [x] SubTask 2.2: 在 `startup()` 中调用 `log.Init(logPath)` 创建 Logger，传递给各 Handler 的 `Init()` 方法
  - [x] SubTask 2.3: 在 `shutdown()` 中调用 `log.Close()` 关闭 Logger

- [x] Task 3: 修改 `db.InitDB` 签名并替换日志
  - [x] SubTask 3.1: `InitDB` 新增 `logger *fastlog.Logger` 参数
  - [x] SubTask 3.2: 将 `log.Println("数据库初始化完成")` 替换为 `logger.Info("数据库初始化完成")`
  - [x] SubTask 3.3: 在各错误返回处添加 `logger.Errorw` 日志

- [x] Task 4: 修改 5 个 Handler 的结构体和 Init 方法
  - [x] SubTask 4.1: `AIHandler` 新增 `logger` 字段，`Init()` 新增参数
  - [x] SubTask 4.2: `BackupHandler` 新增 `logger` 字段，`Init()` 新增参数
  - [x] SubTask 4.3: `SettingsHandler` 新增 `logger` 字段，`Init()` 新增参数
  - [x] SubTask 4.4: `PromptHandler` 新增 `logger` 字段，`Init()` 新增参数
  - [x] SubTask 4.5: `SkillHandler` 新增 `logger` 字段，`Init()` 新增参数

- [x] Task 5: 修改 3 个 Service 的结构体和构造函数
  - [x] SubTask 5.1: `SettingsService` 新增 `logger` 字段，构造函数新增参数
  - [x] SubTask 5.2: `PromptService` 新增 `logger` 字段，构造函数新增参数
  - [x] SubTask 5.3: `SkillService` 新增 `logger` 字段，构造函数新增参数
  - [x] SubTask 5.4: 更新 `app.go` 中所有 Service 构造函数调用

- [x] Task 6: 添加 AI 操作日志（handler/ai.go）
  - [x] SubTask 6.1: 在 `GeneratePrompt` / `OptimizePrompt` / `OptimizeName` / `OptimizeDescription` 入口记录 INFO 日志
  - [x] SubTask 6.2: 在 `streamChat` 中 HTTP 非 200 时记录 ERROR 日志
  - [x] SubTask 6.3: 在 `TestAIConnection` / `GetAIModels` 中记录 INFO/ERROR 日志
  - [x] SubTask 6.4: 在配置缺失时记录 WARN 日志

- [x] Task 7: 添加备份恢复日志（handler/backup.go）
  - [x] SubTask 7.1: 在 `BackupData` 成功时记录 INFO 日志（包含保存路径）
  - [x] SubTask 7.2: 在 `RestoreData` 成功时记录 INFO 日志（包含恢复数量）
  - [x] SubTask 7.3: 在 `ResetAllData` 时记录 WARN 日志
  - [x] SubTask 7.4: 在 `QuickBackup` / `QuickRestore` 中记录 INFO 日志

- [x] Task 8: 添加 Skill 导入导出日志（service/skill.go）
  - [x] SubTask 8.1: 在 `ImportSkill` / `ImportSkillFromExportZip` 关键步骤记录 INFO 日志
  - [x] SubTask 8.2: 在导入跳过/失败时记录 INFO/ERROR 日志
  - [x] SubTask 8.3: 在 `ExportSkill` / `ExportSkillsToZip` 成功时记录 INFO 日志

- [x] Task 9: 添加 Prompt 导入导出日志（service/prompt.go）
  - [x] SubTask 9.1: 在 `ImportPromptsFromJSON` / `ExportPromptsToJSON` 中记录 INFO 日志

- [x] Task 10: 添加设置变更日志（handler/settings.go）
  - [x] SubTask 10.1: 在 `SetAppHome` 中记录家目录迁移的 INFO 日志（旧路径→新路径）
  - [x] SubTask 10.2: 在 `SetAppHome` 失败时记录 ERROR 日志

- [x] Task 11: 验证构建和运行
  - [x] SubTask 11.1: 执行 `go build ./...` 确认编译通过
  - [ ] SubTask 11.2: 执行 `wails dev` 确认应用正常启动，检查 `~/.psm/logs/` 目录下生成日志文件
  - [ ] SubTask 11.3: 检查日志文件内容格式正确，包含各模块的日志输出

# Task Dependencies

- Task 1 无依赖（最先执行）
- Task 2 依赖 Task 1
- Task 3 依赖 Task 1
- Task 4 依赖 Task 1
- Task 5 依赖 Task 1
- Task 2 依赖 Task 4 和 Task 5（startup 中需要调用 Handler.Init 和 Service 构造函数）
- Task 6 依赖 Task 4 和 Task 5（需要 Handler 和 Service 已有 logger 字段）
- Task 7 依赖 Task 4 和 Task 5
- Task 8 依赖 Task 4 和 Task 5
- Task 9 依赖 Task 4 和 Task 5
- Task 10 依赖 Task 4 和 Task 5
- Task 11 依赖 Task 2-10 全部完成

# 可并行执行

- Task 3、Task 4、Task 5 可并行（均依赖 Task 1，互不依赖）
- Task 6、Task 7、Task 8、Task 9、Task 10 可并行（均依赖 Task 4 和 Task 5，互不依赖）
