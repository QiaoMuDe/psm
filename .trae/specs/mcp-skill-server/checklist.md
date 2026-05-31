# 验证清单

## 数据库与设置

- [ ] settings 表新增 `api_enabled`、`api_port`、`api_key`、`api_bind_localhost` 默认值
- [ ] 应用启动时自动插入默认设置（已存在则跳过）

## MCP 协议核心

- [ ] `initialize` 握手返回正确的 serverInfo 和 capabilities
- [ ] JSON-RPC 2.0 消息解析正确（id、method、params、result、error）
- [ ] 未知方法返回 MethodNotFound 错误
- [ ] API Key 认证：无 Key 返回 401，Key 错误返回 401，Key 正确放行
- [ ] stdio 模式：消息通过 stdin 输入、stdout 输出，换行符分隔

## MCP Tools

- [ ] `tools/list` 返回 8 个工具定义，每个包含 name、description、inputSchema
- [ ] `search_skills(query="go-kit")` 返回匹配的技能列表
- [ ] `search_skills(query="不存在的")` 返回空列表
- [ ] `get_skill(name="go-kit-core")` 返回 SKILL.md 内容
- [ ] `get_skill(name="不存在")` 返回错误
- [ ] `list_skill_files(name="go-kit-core")` 返回文件列表
- [ ] `read_skill_file(name="go-kit-core", path="SKILL.md")` 返回文件内容
- [ ] `read_skill_file(name="go-kit-core", path="../../etc/passwd")` 被路径穿越防护拒绝
- [ ] `download_skill(name="go-kit-core")` 返回有效 base64 编码的 ZIP
- [ ] `download_skill` 返回的 ZIP 解压后包含 SKILL.md 和其他文件
- [ ] `search_prompts(query="代码审查")` 返回匹配的提示词列表
- [ ] `get_prompt(id=1)` 返回提示词完整内容（name、content、category、tags）
- [ ] `import_skill(zip_path="...")` 从本地路径导入技能成功

## MCP Resources

- [ ] `resources/list` 返回 6 个 URI 模板
- [ ] `resources/read(psm://skills)` 返回技能列表 JSON
- [ ] `resources/read(psm://skills/go-kit-core)` 返回技能元数据
- [ ] `resources/read(psm://skills/go-kit-core/SKILL.md)` 返回文本内容
- [ ] `resources/read(psm://skills/go-kit-core/../../etc/passwd)` 被路径穿越防护拒绝
- [ ] `resources/read(psm://prompts)` 返回提示词列表 JSON
- [ ] `resources/read(psm://prompts/1)` 返回提示词内容

## MCP Prompts

- [ ] `prompts/list` 返回 PSM 中所有提示词，格式符合 MCP 规范
- [ ] `prompts/get(name="prompt-1")` 返回提示词文本内容

## 传输层

- [ ] HTTP 模式：`POST /mcp` 正常处理 JSON-RPC 消息
- [ ] HTTP 模式：`GET /api/health` 返回 200
- [ ] HTTP 模式：端口占用时自动 +1 重试
- [ ] HTTP 模式：CORS 头正确设置
- [ ] stdio 模式：`psm.exe --mcp` 不启动 GUI，仅处理 stdio 消息

## 生命周期

- [ ] GUI 模式：api_enabled=false 时不启动 HTTP Server
- [ ] GUI 模式：api_enabled=true 时启动 HTTP Server
- [ ] GUI 关闭时 HTTP Server 正常停止
- [ ] 设置页开关可动态启停 HTTP Server

## 设置页

- [ ] "API 服务"分组卡片在设置页底部正确显示（位于存储设置之后）
- [ ] 启用开关切换正常
- [ ] 端口输入框可编辑
- [ ] API Key 显示、复制、刷新功能正常
- [ ] 服务状态实时显示（运行中/已停止 + 地址）
- [ ] MCP 配置示例 JSON 正确显示（含 stdio 和 HTTP 两种配置）
- [ ] 刷新 API Key 后旧 Key 立即失效

## 安全

- [ ] 路径穿越 `../../` 被拒绝
- [ ] 路径穿越 `..\\` 被拒绝（Windows）
- [ ] API Key 认证对所有 /mcp 端点生效
- [ ] 默认仅绑定 127.0.0.1

## 日志

- [ ] fastlog 依赖添加成功，`go.mod` 包含 `gitee.com/MM-Q/fastlog`
- [ ] MCP Server 启动时记录 INFO 日志（端口、绑定地址）
- [ ] MCP Server 停止时记录 INFO 日志
- [ ] 每次工具调用记录 INFO 日志（tool name, params, elapsed）
- [ ] 错误情况记录 ERROR 日志（tool name, error, context）
- [ ] 端口占用自动重试记录 WARN 日志
- [ ] 路径穿越攻击尝试记录 ERROR 日志
- [ ] 日志文件生成在 `~/.psm/logs/mcp.log`
- [ ] 启用 LevelRouter 后生成 `INFO.log`、`ERROR.log` 分级文件

## 构建验证

- [ ] `wails build` 构建成功，无报错
- [ ] golangci-lint 通过，无新增告警
