# Tasks

## 后端：依赖与数据库

- [ ] Task 1: 新增 fastlog 日志库依赖
  - [ ] SubTask 1.1: `go get gitee.com/MM-Q/fastlog` 添加依赖
  - [ ] SubTask 1.2: 确认 `go.mod` 和 `go.sum` 更新正确

- [ ] Task 2: settings 表新增默认设置项 `internal/db/sqlite.go`
  - [ ] SubTask 2.1: 在 `insertDefaultSettings` 中新增 `api_enabled` = `false`
  - [ ] SubTask 2.2: 新增 `api_port` = `9800`
  - [ ] SubTask 2.3: 新增 `api_key` = `""`（空字符串，首次启用时自动生成）
  - [ ] SubTask 2.4: 新增 `api_bind_localhost` = `true`

## 后端：MCP 核心协议层

- [ ] Task 3: 创建 MCP 核心包 `internal/mcp/`
  - [ ] SubTask 3.1: 创建 `internal/mcp/server.go` — MCP Server 结构体、生命周期管理（Start/Stop）、Logger 实例
  - [ ] SubTask 3.2: 创建 `internal/mcp/handler.go` — JSON-RPC 2.0 消息解析、路由分发、能力协商（initialize）
  - [ ] SubTask 3.3: 创建 `internal/mcp/auth.go` — API Key 认证中间件
  - [ ] SubTask 3.4: 创建 `internal/mcp/errors.go` — MCP 标准错误码定义

## 后端：MCP 日志

- [ ] Task 4: 实现 MCP 日志记录 `internal/mcp/logger.go`
  - [ ] SubTask 4.1: 创建 `internal/mcp/logger.go` — 基于 fastlog 初始化 Logger（`~/.psm/logs/mcp.log`）
  - [ ] SubTask 4.2: 实现 `LogToolCall` — 记录工具调用（tool name, params, elapsed）
  - [ ] SubTask 4.3: 实现 `LogError` — 记录错误（tool name, error, context）
  - [ ] SubTask 4.4: 实现 `LogServerEvent` — 记录服务事件（start, stop, port, status）

## 后端：MCP Tools

- [ ] Task 5: 实现 MCP Tools `internal/mcp/tools.go`
  - [ ] SubTask 5.1: 实现 `tools/list` — 返回 8 个工具的定义（name, description, inputSchema）
  - [ ] SubTask 5.2: 实现 `tools/call` 路由 — 根据工具名分发到对应处理函数 + 日志记录
  - [ ] SubTask 5.3: 实现 `search_skills` — 调用 SkillService，关键词匹配 name + description
  - [ ] SubTask 5.4: 实现 `get_skill` — 获取 SKILL.md 内容 + 文件列表概要
  - [ ] SubTask 5.5: 实现 `list_skill_files` — 调用 SkillService.ListSkillFiles
  - [ ] SubTask 5.6: 实现 `read_skill_file` — 读取文件文本内容 + 路径安全校验
  - [ ] SubTask 5.7: 实现 `download_skill` — ZIP 打包 + base64 编码返回
  - [ ] SubTask 5.8: 实现 `search_prompts` — 调用 PromptService，关键词匹配
  - [ ] SubTask 5.9: 实现 `get_prompt` — 调用 PromptService.GetPrompt
  - [ ] SubTask 5.10: 实现 `import_skill` — 调用 SkillHandler.ImportSkillAuto

## 后端：MCP Resources

- [ ] Task 6: 实现 MCP Resources `internal/mcp/resources.go`
  - [ ] SubTask 6.1: 实现 `resources/list` — 返回 6 个 URI 模板
  - [ ] SubTask 6.2: 实现 `resources/read` — 根据 URI 路由到对应内容读取
  - [ ] SubTask 6.3: 实现 `psm://skills` 资源 — 返回技能列表 JSON
  - [ ] SubTask 6.4: 实现 `psm://skills/{name}` 资源 — 返回技能元数据 JSON
  - [ ] SubTask 6.5: 实现 `psm://skills/{name}/SKILL.md` 资源 — 返回文本内容
  - [ ] SubTask 6.6: 实现 `psm://skills/{name}/{path}` 资源 — 返回文件内容 + 路径安全校验
  - [ ] SubTask 6.7: 实现 `psm://prompts` 资源 — 返回提示词列表 JSON
  - [ ] SubTask 6.8: 实现 `psm://prompts/{id}` 资源 — 返回提示词内容

## 后端：MCP Prompts

- [ ] Task 7: 实现 MCP Prompts `internal/mcp/prompts.go`
  - [ ] SubTask 7.1: 实现 `prompts/list` — 从数据库读取所有提示词，转换为 MCP Prompt 格式
  - [ ] SubTask 7.2: 实现 `prompts/get` — 根据 ID 获取提示词内容，支持模板变量替换

## 后端：传输层

- [ ] Task 8: 实现 HTTP 传输 `internal/mcp/transport.go`
  - [ ] SubTask 8.1: 实现 Streamable HTTP 传输 — POST/GET/DELETE `/mcp` 端点
  - [ ] SubTask 8.2: 实现 CORS 头处理
  - [ ] SubTask 8.3: 实现端口占用检测 + 自动重试（最多 10 次）
  - [ ] SubTask 8.4: 实现健康检查端点 `GET /api/health`

- [ ] Task 9: 实现 stdio 传输 `internal/mcp/stdio.go`
  - [ ] SubTask 9.1: 实现 stdin 读取 + stdout 写入的 JSON-RPC 消息处理
  - [ ] SubTask 9.2: 实现消息分帧（换行符分隔）

## 后端：集成到 App

- [ ] Task 10: 集成 MCP Server 到应用生命周期 `app.go`
  - [ ] SubTask 10.1: 修改 `startup()` — 检查 api_enabled，启用时启动 HTTP MCP Server + 日志记录
  - [ ] SubTask 10.2: 修改 `shutdown()` — 停止 HTTP MCP Server + 关闭 Logger
  - [ ] SubTask 10.3: 在 SettingsHandler 添加 MCP Server 控制方法（Start/Stop/GetStatus）
  - [ ] SubTask 10.4: 在 SettingsHandler 添加 `RegenerateAPIKey` 方法
  - [ ] SubTask 10.5: 在 main.go 添加 `--mcp` 命令行参数处理（headless stdio 模式）

## 前端：设置页

- [ ] Task 11: 设置页新增 API 服务分组卡片 `frontend/js/views/settings.js`
  - [ ] SubTask 11.1: 在设置页底部新增"API 服务"分组卡片 HTML（位于存储设置之后）
  - [ ] SubTask 11.2: 实现启用开关 — 切换时调用后端 Start/Stop
  - [ ] SubTask 11.3: 实现端口输入框
  - [ ] SubTask 11.4: 实现"仅本机访问"开关
  - [ ] SubTask 11.5: 实现 API Key 显示 + 复制 + 刷新按钮
  - [ ] SubTask 11.6: 实现服务状态显示（运行中/已停止 + 地址）
  - [ ] SubTask 11.7: 实现 MCP 配置示例代码块（JSON 格式，含 stdio 和 HTTP 两种配置）

- [ ] Task 12: 设置页样式 `frontend/css/components.css`
  - [ ] SubTask 12.1: API 服务分组卡片样式（复用现有 `.settings-group` 模式）
  - [ ] SubTask 12.2: API Key 输入框 + 按钮行样式
  - [ ] SubTask 12.3: 服务状态指示器样式（绿点运行中/红点已停止）
  - [ ] SubTask 12.4: 配置示例代码块样式

## 验证

- [ ] Task 13: 构建与功能验证
  - [ ] SubTask 13.1: `wails build` 构建成功
  - [ ] SubTask 13.2: 测试 stdio 模式 — `echo '{"jsonrpc":"2.0","id":1,"method":"initialize",...}' | psm.exe --mcp`
  - [ ] SubTask 13.3: 测试 HTTP 模式 — 启用 API 服务后，curl 测试 tools/list
  - [ ] SubTask 13.4: 测试 API Key 认证 — 无 Key 返回 401，有 Key 正常
  - [ ] SubTask 13.5: 测试 search_skills / get_skill / read_skill_file 工具
  - [ ] SubTask 13.6: 测试 download_skill — 返回有效 ZIP
  - [ ] SubTask 13.7: 测试 search_prompts / get_prompt 工具
  - [ ] SubTask 13.8: 测试路径穿越防护 — `read_skill_file(path="../../etc/passwd")` 被拒绝
  - [ ] SubTask 13.9: 测试 MCP Resources URI 读取
  - [ ] SubTask 13.10: 测试 MCP Prompts 列表和获取
  - [ ] SubTask 13.11: 测试设置页 API 服务开关、端口、Key 刷新
  - [ ] SubTask 13.12: 测试日志文件生成（`~/.psm/logs/mcp.log`、`INFO.log`、`ERROR.log`）
  - [ ] SubTask 13.13: golangci-lint 通过，无新增告警

# Task Dependencies

- [Task 1] 无依赖
- [Task 2] 无依赖
- [Task 3] 依赖 [Task 1]
- [Task 4] 依赖 [Task 1]
- [Task 5] 依赖 [Task 3]、[Task 4]
- [Task 6] 依赖 [Task 3]
- [Task 7] 依赖 [Task 3]
- [Task 8] 依赖 [Task 3]
- [Task 9] 依赖 [Task 3]
- [Task 10] 依赖 [Task 2]、[Task 8]、[Task 4]
- [Task 11] 依赖 [Task 10]
- [Task 12] 无依赖（可与 Task 11 并行）
- [Task 13] 依赖 [Task 11]、[Task 12]
