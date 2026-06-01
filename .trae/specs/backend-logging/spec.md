# 后端日志系统 Spec

## Why

当前后端几乎没有任何日志记录——全项目仅 1 条 `log.Println("数据库初始化完成")`，而 Handler/Service 层共有 123 处 error 返回全部静默透传。备份恢复、数据重置、AI API 调用、Skill 导入导出等关键操作无任何日志，出问题时无法排查。需要引入结构化日志库，将日志写入 `~/.psm/logs/` 目录。

## What Changes

* 引入 `gitee.com/MM-Q/fastlog` 日志库作为唯一新增直接依赖

* 新建 `internal/log` 包，封装全局 Logger 初始化逻辑，提供 `Get()` 方法获取 Logger 实例

* 修改 `App` 结构体，在 startup 中创建 Logger，shutdown 中关闭 Logger

* 修改 5 个 Handler 的 `Init()` 方法，新增 `*fastlog.Logger` 参数

* 修改 3 个 Service 的构造函数/结构体，新增 `*fastlog.Logger` 字段

* 修改 `db.InitDB()` 签名，新增 `*fastlog.Logger` 参数，替换 `log.Println`

* 在关键操作路径添加结构化日志（\~50 条），覆盖启动/关闭、AI 请求、备份恢复、数据重置、Skill 导入导出、家目录迁移

* 日志文件路径固定为 `~/.psm/logs/psm.log`，启用级别路由自动按级别分文件

## Impact

* Affected specs: 无现有 spec 受影响

* Affected code:

  * `go.mod` — 新增 fastlog 依赖

  * `internal/log/` — 新建包

  * `app.go` — App 结构体 + startup/shutdown

  * `internal/db/gorm.go` — InitDB 签名 + 替换 log.Println

  * `internal/handler/ai.go` — Init 签名 + AI 请求日志

  * `internal/handler/backup.go` — Init 签名 + 备份恢复日志

  * `internal/handler/settings.go` — Init 签名 + 家目录迁移日志

  * `internal/handler/prompt.go` — Init 签名 + 导入导出日志

  * `internal/handler/skill.go` — Init 签名 + 导入导出日志

  * `internal/service/skill.go` — 结构体 + 导入过程日志

  * `internal/service/prompt.go` — 结构体 + 导入导出日志

  * `internal/service/settings.go` — 结构体

## ADDED Requirements

### Requirement: Logger 全局实例管理

系统 SHALL 提供 `internal/log` 包，封装 fastlog Logger 的创建和获取。

#### Scenario: Logger 初始化

* **WHEN** 应用启动时调用 `log.Init(logPath)`

* **THEN** 创建 fastlog Logger 实例，写入指定路径，日志级别为 DEBUG，启用缓冲和级别路由

#### Scenario: 获取 Logger

* **WHEN** 任意包调用 `log.Get()`

* **THEN** 返回全局 Logger 实例

#### Scenario: 关闭 Logger

* **WHEN** 应用关闭时调用 `log.Close()`

* **THEN** 刷新缓冲区并关闭文件句柄

### Requirement: 应用生命周期日志

系统 SHALL 在应用启动和关闭时记录日志。

#### Scenario: 应用启动

* **WHEN** `app.startup()` 执行

* **THEN** 记录 INFO 级别日志 "应用启动成功"，包含数据库路径

#### Scenario: 应用关闭

* **WHEN** `app.shutdown()` 执行

* **THEN** 记录 INFO 级别日志 "应用关闭"，然后关闭 Logger

### Requirement: 数据库初始化日志

系统 SHALL 在数据库初始化过程中记录日志。

#### Scenario: 数据库初始化成功

* **WHEN** `db.InitDB()` 成功完成

* **THEN** 记录 INFO 级别日志 "数据库初始化完成"，替换原有的 `log.Println`

#### Scenario: 数据库初始化失败

* **WHEN** `db.InitDB()` 返回错误

* **THEN** 记录 ERROR 级别日志，包含具体错误信息

### Requirement: AI 操作日志

系统 SHALL 在 AI API 调用的关键步骤记录日志。

#### Scenario: AI 生成请求

* **WHEN** 用户触发 AI 生成提示词

* **THEN** 记录 INFO 级别日志 "AI 生成请求开始"，包含模型名称

#### Scenario: AI 生成完成

* **WHEN** AI 生成成功完成

* **THEN** 记录 INFO 级别日志 "AI 生成完成"

#### Scenario: AI API 请求失败

* **WHEN** AI API 返回非 200 状态码或网络错误

* **THEN** 记录 ERROR 级别日志，包含错误详情

#### Scenario: AI 配置缺失

* **WHEN** AI API Key/URL/模型未配置

* **THEN** 记录 WARN 级别日志

### Requirement: 备份恢复日志

系统 SHALL 在备份和恢复操作的关键步骤记录日志。

#### Scenario: 备份完成

* **WHEN** 备份操作成功

* **THEN** 记录 INFO 级别日志 "备份完成"，包含保存路径

#### Scenario: 恢复完成

* **WHEN** 恢复操作成功

* **THEN** 记录 INFO 级别日志 "恢复完成"，包含恢复的 Prompt/Skill 数量

#### Scenario: 数据重置

* **WHEN** 用户执行数据重置

* **THEN** 记录 WARN 级别日志 "用户执行数据重置"

### Requirement: Skill 导入导出日志

系统 SHALL 在 Skill 导入导出操作中记录日志。

#### Scenario: Skill 导入成功

* **WHEN** 单个 Skill 导入成功

* **THEN** 记录 INFO 级别日志，包含 Skill 名称

#### Scenario: Skill 导入跳过

* **WHEN** Skill 因同名已存在被跳过

* **THEN** 记录 INFO 级别日志 "Skill 已存在，跳过"，包含名称

#### Scenario: Skill 导入失败

* **WHEN** Skill 导入过程中发生错误

* **THEN** 记录 ERROR 级别日志，包含错误详情

#### Scenario: 批量导入完成

* **WHEN** 批量导入操作完成

* **THEN** 记录 INFO 级别日志 "批量导入完成"，包含成功/跳过/失败数量

### Requirement: 家目录迁移日志

系统 SHALL 在程序家目录迁移操作中记录日志。

#### Scenario: 家目录迁移开始

* **WHEN** 用户切换程序家目录

* **THEN** 记录 INFO 级别日志 "程序家目录迁移"，包含旧路径和新路径

#### Scenario: 家目录迁移失败

* **WHEN** 目录复制过程中发生错误

* **THEN** 记录 ERROR 级别日志，包含错误详情

## MODIFIED Requirements

### Requirement: 数据库初始化

* **原**: `db.InitDB(dbPath string) error`，内部使用 `log.Println`

* **改**: `db.InitDB(dbPath string, logger *fastlog.Logger) error`，使用 fastlog 记录日志

### Requirement: Handler 初始化

* **原**: 各 Handler 的 `Init()` 方法不接受 Logger 参数

* **改**: 各 Handler 的 `Init()` 方法新增 `*fastlog.Logger` 参数，存入 Handler 结构体

### Requirement: Service 构造

* **原**: Service 结构体无 Logger 字段

* **改**: Service 结构体新增 `logger *fastlog.Logger` 字段，通过构造函数注入

## REMoved Requirements

### Requirement: 标准 log 包使用

* **Reason**: 统一使用 fastlog，移除对标准 `log` 包的依赖

* **Migration**: `db/gorm.go` 中的 `log.Println` 替换为 `logger.Info`

