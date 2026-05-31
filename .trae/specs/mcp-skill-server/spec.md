# MCP 技能中心 Spec

## Why

PSM 已经是一个成熟的 Skill 和 Prompt 管理工具，但目前只能通过桌面 GUI 使用。AI Agent 工具（Claude Code、Cursor、Cline、Windsurf 等）无法直接访问 PSM 中的技能和提示词资源。需要将 PSM 作为 MCP（Model Context Protocol）服务器运行，让 AI Agent 可以通过标准 MCP 协议发现、检索、获取技能和提示词，实现"技能中心"的能力。

## What Changes

### 后端新增

- **MCP Server 核心**：在 `internal/mcp/` 下新增 MCP 协议层，实现 JSON-RPC 2.0 消息处理、能力协商、工具/资源/提示词暴露
- **传输层**：支持 Streamable HTTP（远程连接）和 stdio（本地子进程）两种传输方式
- **MCP Tools**：8 个工具函数，覆盖技能和提示词的搜索、获取、读取、下载、导入
- **MCP Resources**：URI 模板化资源，暴露技能文件和提示词内容
- **MCP Prompts**：将 PSM 中存储的提示词暴露为 MCP 提示词
- **HTTP Server 生命周期**：在 Wails `OnStartup`/`OnShutdown` 中管理 HTTP Server
- **安全层**：API Key 认证 + 路径穿越防护 + localhost 绑定
- **日志系统**：基于 `gitee.com/MM-Q/fastlog` 日志库，记录 MCP Server 的启动/请求/错误日志

### 前端修改

- **设置页新增"API 服务"分组卡片**：管理 MCP Server 的开关、端口、API Key（在现有设置页底部新增，不新增侧边栏模块）

### 数据库修改

- **settings 表新增**：`api_enabled`、`api_port`、`api_key`、`api_bind_localhost` 四个设置项

### 新增依赖

- `gitee.com/MM-Q/fastlog` — 日志库，用于 MCP Server 的结构化日志记录

## Impact

- Affected specs: 无
- Affected code: app.go、internal/service/（复用，不修改）、internal/db/sqlite.go（新增默认设置）、frontend/js/views/settings.js、frontend/css/components.css
- New code: internal/mcp/（全部新增）
- New dependency: gitee.com/MM-Q/fastlog

## 术语说明

| 术语 | 说明 |
|------|------|
| MCP | Model Context Protocol，Anthropic 定义的 AI 工具集成协议 |
| MCP Server | 暴露工具/资源/提示词的服务端，即 PSM 提供的能力 |
| MCP Client | 连接 MCP Server 的 AI 应用（如 Claude Code、Cursor） |
| Tool | MCP 工具，AI 可主动调用的函数 |
| Resource | MCP 资源，AI 可按 URI 读取的数据 |
| Prompt | MCP 提示词，预定义的提示词模板 |
| Transport | MCP 传输层，支持 HTTP 和 stdio 两种方式 |

---

## MCP 能力总览

### 传输方式

| 方式 | 协议 | 场景 | 默认端口/参数 |
|------|------|------|--------------|
| Streamable HTTP | HTTP + SSE | 远程/本机 Agent 通过网络连接 | `127.0.0.1:9800` |
| stdio | stdin/stdout | 本地 Agent 作为子进程启动 PSM | `psm.exe --mcp` |

### MCP Tools（AI 主动调用的函数）

| 工具名 | 说明 | 输入 | 输出 |
|--------|------|------|------|
| `search_skills` | 搜索技能列表 | query: string, limit?: int | 技能列表（name, description） |
| `get_skill` | 获取技能详情（SKILL.md 内容） | name: string | name, description, content |
| `list_skill_files` | 列出技能文件 | name: string | 文件列表（name, is_dir, size） |
| `read_skill_file` | 读取技能文件内容 | name: string, path: string | 文件文本内容 |
| `download_skill` | 下载技能 ZIP 包 | name: string | ZIP 文件（二进制） |
| `search_prompts` | 搜索提示词列表 | query: string, category?: string, limit?: int | 提示词列表（id, name, category） |
| `get_prompt` | 获取提示词内容 | id: int | name, content, category, tags |
| `import_skill` | 导入技能（从本地 ZIP 路径） | zip_path: string | 导入结果 |

### MCP Resources（AI 按 URI 读取的数据）

| URI 模式 | 说明 | MIME 类型 |
|----------|------|-----------|
| `psm://skills` | 技能列表 | application/json |
| `psm://skills/{name}` | 技能元数据 | application/json |
| `psm://skills/{name}/SKILL.md` | 技能说明文档 | text/markdown |
| `psm://skills/{name}/{path}` | 技能目录中的文件 | text/plain 或 application/octet-stream |
| `psm://prompts` | 提示词列表 | application/json |
| `psm://prompts/{id}` | 提示词内容 | text/plain |

### MCP Prompts（预定义提示词模板）

将 PSM 中存储的提示词暴露为 MCP 提示词，AI 工具可通过 `prompts/list` 发现并使用。

---

## 详细设计

### 1. MCP Server 核心架构

```
┌──────────────────────────────────────────────────────┐
│                    PSM 应用进程                        │
│                                                       │
│  ┌────────────────┐     ┌──────────────────────────┐ │
│  │  Wails GUI     │     │  MCP Server              │ │
│  │  (WebView2)    │     │                          │ │
│  │                │     │  ┌────────────────────┐  │ │
│  │                │     │  │  Transport Layer    │  │ │
│  │                │     │  │  HTTP / stdio       │  │ │
│  │                │     │  └─────────┬──────────┘  │ │
│  │                │     │            │              │ │
│  │                │     │  ┌─────────▼──────────┐  │ │
│  │                │     │  │  JSON-RPC Handler   │  │ │
│  │                │     │  │  (协议解析/路由)     │  │ │
│  │                │     │  └─────────┬──────────┘  │ │
│  │                │     │            │              │ │
│  │                │     │  ┌─────────▼──────────┐  │ │
│  │                │     │  │  Capability Layer   │  │ │
│  │                │     │  │  Tools/Resources/   │  │ │
│  │                │     │  │  Prompts            │  │ │
│  │                │     │  └─────────┬──────────┘  │ │
│  └────────────────┘     └────────────┼──────────────┘ │
│                                       │                │
│  ┌────────────────────────────────────▼──────────────┐ │
│  │              Service Layer（复用，不修改）          │ │
│  │  SkillService / PromptService / SettingsService    │ │
│  └──────────────────────┬────────────────────────────┘ │
│                          │                              │
│  ┌──────────────────────▼────────────────────────────┐ │
│  │              SQLite (WAL 模式，共享)               │ │
│  └───────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────┘
```

### 2. MCP Tools 详细设计

#### 2.1 search_skills

搜索 PSM 中的技能，支持关键词匹配 name 和 description。

```
工具名: search_skills
描述: 搜索 PSM 技能中心中的技能，根据关键词匹配技能名称和描述
输入:
  - query (string, 必需): 搜索关键词
  - limit (integer, 可选, 默认 20): 返回数量上限
输出:
  - skills: 技能列表，每项包含 name 和 description
```

#### 2.2 get_skill

获取指定技能的完整信息，核心返回 SKILL.md 的文本内容。这是 AI 了解技能用途和使用方法的主要入口。

```
工具名: get_skill
描述: 获取指定技能的详细信息和 SKILL.md 说明文档内容
输入:
  - name (string, 必需): 技能名称
输出:
  - name: 技能名称
  - description: 技能描述
  - content: SKILL.md 的完整文本内容
  - files: 文件列表概要（name, is_dir, size）
```

#### 2.3 list_skill_files

列出技能目录中的所有文件和子目录，用于 AI 决定是否需要进一步读取某个文件。

```
工具名: list_skill_files
描述: 列出技能目录中的所有文件和子目录
输入:
  - name (string, 必需): 技能名称
输出:
  - files: 文件列表，每项包含 name, is_dir, size, mod_time
```

#### 2.4 read_skill_file

读取技能目录中指定文件的文本内容。AI 可根据 SKILL.md 中的引用，按需读取具体文件。

```
工具名: read_skill_file
描述: 读取技能目录中指定文件的文本内容
输入:
  - name (string, 必需): 技能名称
  - path (string, 必需): 文件相对路径（如 "utils/time.go"）
输出:
  - path: 文件路径
  - content: 文件文本内容
  - size: 文件大小
安全:
  - MUST 验证 path 在技能目录内，防止路径穿越
  - 二进制文件返回错误提示，不返回内容
```

#### 2.5 download_skill

将指定技能打包为 ZIP 文件返回。AI Agent 可将 ZIP 下载到本地解压后使用。

```
工具名: download_skill
描述: 将技能打包为 ZIP 文件下载，解压后可本地使用
输入:
  - name (string, 必需): 技能名称
输出:
  - name: 技能名称
  - zip_data: ZIP 文件（base64 编码）
  - size: 文件大小
```

#### 2.6 search_prompts

搜索 PSM 中的提示词。

```
工具名: search_prompts
描述: 搜索 PSM 中的提示词，支持关键词和分类筛选
输入:
  - query (string, 必需): 搜索关键词
  - category (string, 可选): 分类筛选
  - limit (integer, 可选, 默认 20): 返回数量上限
输出:
  - prompts: 提示词列表，每项包含 id, name, category
```

#### 2.7 get_prompt

获取指定提示词的完整内容，AI 可直接将文本作为对话上下文使用。

```
工具名: get_prompt
描述: 获取指定提示词的完整内容，可直接作为对话上下文使用
输入:
  - id (integer, 必需): 提示词 ID
输出:
  - id: 提示词 ID
  - name: 提示词名称
  - content: 提示词完整文本内容
  - category: 分类
  - tags: 标签列表
```

#### 2.8 import_skill

从本地 ZIP 文件路径导入技能到 PSM。AI Agent 可将收集到的技能包导入到 PSM 统一管理。

```
工具名: import_skill
描述: 从本地 ZIP 文件导入技能到 PSM 技能中心
输入:
  - zip_path (string, 必需): ZIP 文件的本地路径
输出:
  - success: 是否成功
  - name: 导入的技能名称
  - message: 结果描述
```

### 3. MCP Resources 详细设计

#### 3.1 资源 URI 模板

| URI | 说明 | 动态 |
|-----|------|------|
| `psm://skills` | 所有技能列表 | 否 |
| `psm://skills/{name}` | 单个技能元数据 | 是 |
| `psm://skills/{name}/SKILL.md` | 技能说明文档 | 是 |
| `psm://skills/{name}/{path}` | 技能目录中的任意文件 | 是 |
| `psm://prompts` | 所有提示词列表 | 否 |
| `psm://prompts/{id}` | 单个提示词内容 | 是 |

#### 3.2 资源读取行为

- `psm://skills` → 返回 JSON 数组，包含所有技能的 name、description、updated_at
- `psm://skills/{name}` → 返回单个技能的完整元数据
- `psm://skills/{name}/SKILL.md` → 返回 SKILL.md 的文本内容（text/markdown）
- `psm://skills/{name}/{path}` → 返回指定文件的文本内容（需路径安全校验）
- `psm://prompts` → 返回 JSON 数组，包含所有提示词的 id、name、category
- `psm://prompts/{id}` → 返回提示词的完整内容（text/plain）

### 4. MCP Prompts 设计

PSM 中存储的每条提示词暴露为一个 MCP Prompt：

```
Prompt 列表: prompts/list
├── id: prompt-{id}
├── name: 提示词名称
├── description: "PSM 技能中心提供的提示词: {name}"
└── arguments:
    - name: "variables"
      description: "模板变量 JSON（如果提示词包含 {{变量名}} 占位符）"
      required: false
```

当 AI 调用 `prompts/get` 时，返回提示词的完整文本内容。如果提示词包含模板变量，可根据 arguments 参数进行替换。

### 5. 安全设计

#### 5.1 API Key 认证

- MCP Server 启动时检查设置中是否存在 `api_key`
- 不存在则自动生成 32 位随机密钥并保存到设置
- 每个 HTTP 请求必须在 Header 中携带 `Authorization: Bearer {api_key}`
- 未携带或密钥错误返回 401 Unauthorized
- stdio 模式跳过认证（本地子进程，天然安全）

#### 5.2 路径穿越防护

`read_skill_file` 和 Resource 文件读取 MUST 验证：

```
最终路径 = filepath.Join(skillDir, filepath.Clean(userInput))
必须满足: strings.HasPrefix(filepath.Clean(finalPath), filepath.Clean(skillDir) + separator)
```

#### 5.3 绑定地址

- 默认绑定 `127.0.0.1`（仅本机可访问）
- 可通过设置 `api_bind_localhost = false` 绑定 `0.0.0.0`（允许局域网访问）
- 启动时检测端口占用，被占用则端口 +1 重试（最多 10 次）

#### 5.4 二进制文件处理

- `read_skill_file` 对二进制文件（非 UTF-8 内容）返回错误提示，不返回内容
- `download_skill` 返回完整 ZIP（包含所有文件），由 Agent 侧决定如何处理

### 6. 日志设计

基于 `gitee.com/MM-Q/fastlog` 日志库实现 MCP Server 的结构化日志记录。

#### 6.1 日志配置

```go
// 日志文件路径: ~/.psm/logs/mcp.log
// 使用 Dev 配置（开发阶段），后续可切换为 Prod
cfg := fastlog.NewConfig(logPath)
cfg.Level = fastlog.INFO
cfg.Caller = true        // 输出调用者信息
cfg.LevelRouter = true   // 按级别分文件（INFO.log, ERROR.log 等）
logger := fastlog.New(cfg)
```

#### 6.2 日志级别与场景

| 级别 | 场景 | 示例 |
|------|------|------|
| `INFO` | 服务启动/停止、工具调用 | `MCP Server 启动`, `tools/call search_skills` |
| `WARN` | 非致命异常 | 端口占用自动重试、二进制文件读取拒绝 |
| `ERROR` | 操作失败 | 路径穿越攻击、文件读取失败、Service 层错误 |

#### 6.3 日志内容

每次 MCP 工具调用记录：

```go
logger.Infow("tools/call",
    fastlog.String("tool", "search_skills"),
    fastlog.String("params", `{"query":"go-kit"}`),
    fastlog.Duration("elapsed", time.Since(start)),
)
```

每次错误记录：

```go
logger.Errorw("工具调用失败",
    fastlog.String("tool", "read_skill_file"),
    fastlog.String("error", "路径穿越攻击"),
    fastlog.String("path", "../../etc/passwd"),
)
```

#### 6.4 日志文件管理

- 日志路径: `~/.psm/logs/mcp.log`
- 启用 `LevelRouter` 后自动生成: `INFO.log`、`WARN.log`、`ERROR.log`
- 使用 `Prod` 配置时启用缓冲写入，提升性能

### 7. 设置页设计

新增"API 服务"分组卡片：

```
┌─────────────────────────────────────────┐
│  API 服务                                │
│                                          │
│  启用 MCP 服务     [开关]                │
│                                          │
│  监听端口          [9800]                │
│                                          │
│  仅本机访问        [开关]  (默认开启)     │
│                                          │
│  API Key           [••••••••] [复制][刷新]│
│                                          │
│  服务状态: ● 运行中  127.0.0.1:9800      │
│                                          │
│  ── MCP 配置示例 ──                      │
│  Claude Desktop / Cursor 配置:           │
│  { "mcpServers": { "psm": {             │
│    "url": "http://127.0.0.1:9800/mcp"   │
│  }}}                                    │
└─────────────────────────────────────────┘
```

### 8. 传输层设计

#### 8.1 Streamable HTTP

- 路径: `/mcp`
- 方法: POST（客户端发送 JSON-RPC 消息）
- 响应: JSON 或 SSE 流
- Content-Type: `application/json`
- Accept: `application/json, text/event-stream`

端点:
- `POST /mcp` — 主端点，处理所有 JSON-RPC 消息
- `GET /mcp` — SSE 端点，用于服务器推送通知（可选）
- `DELETE /mcp` — 终止会话

#### 8.2 stdio 模式

- 启动参数: `psm.exe --mcp`
- 不启动 Wails GUI，仅运行 MCP Server
- 通过 stdin 接收 JSON-RPC 消息，通过 stdout 返回响应
- 每条消息以换行符分隔
- 适用于 Claude Desktop 等需要 stdio 传输的场景

### 9. 生命周期管理

#### 9.1 GUI 模式（默认）

```
Wails 启动
  → startup() 中初始化数据库
  → 检查 api_enabled 设置
  → 如果启用: 启动 HTTP Server（goroutine）
  → GUI 正常运行，HTTP Server 共享进程
  → 用户在设置页可动态开关服务
  → Wails 关闭时 shutdown() 中停止 HTTP Server
```

#### 9.2 Headless 模式（--mcp）

```
psm.exe --mcp 启动
  → 跳过 Wails GUI 初始化
  → 初始化数据库
  → 启动 MCP Server（stdio 传输）
  → 等待 stdin 消息，处理后输出到 stdout
  → 进程退出时关闭数据库
```

### 10. MCP 协议握手

客户端连接时，Server 返回能力声明：

```json
{
  "capabilities": {
    "tools": { "listChanged": true },
    "resources": { "subscribe": true, "listChanged": true },
    "prompts": { "listChanged": true }
  },
  "serverInfo": {
    "name": "psm",
    "version": "从 verman 获取"
  }
}
```

### 11. AI Agent 配置示例

#### Claude Desktop (claude_desktop_config.json)

```json
{
  "mcpServers": {
    "psm": {
      "url": "http://127.0.0.1:9800/mcp",
      "headers": {
        "Authorization": "Bearer your-api-key-here"
      }
    }
  }
}
```

#### Claude Desktop (stdio 模式)

```json
{
  "mcpServers": {
    "psm": {
      "command": "C:\\path\\to\\psm.exe",
      "args": ["--mcp"]
    }
  }
}
```

#### Cursor (.cursor/mcp.json)

```json
{
  "mcpServers": {
    "psm": {
      "url": "http://127.0.0.1:9800/mcp",
      "headers": {
        "Authorization": "Bearer your-api-key-here"
      }
    }
  }
}
```

---

## AI 使用技能的典型流程

### 流程 A：AI 查找并使用提示词

```
1. AI 调用 search_prompts(query="代码审查")
   → 返回 [{id: 5, name: "代码审查模板", category: "开发"}]

2. AI 调用 get_prompt(id=5)
   → 返回 content: "请从以下维度审查代码：1. 安全性 2. 性能..."

3. AI 将 content 作为系统提示词注入对话
   → 按照提示词指导执行代码审查
```

### 流程 B：AI 查找并在线阅读技能

```
1. AI 调用 search_skills(query="go-kit")
   → 返回 [{name: "go-kit-core", description: "go-kit 综合技能..."}]

2. AI 调用 get_skill(name="go-kit-core")
   → 返回 SKILL.md 完整内容
   → AI 阅读了解技能概要和使用方法

3. AI 调用 read_skill_file(name="go-kit-core", path="examples/circuit_breaker.go")
   → 返回具体示例代码
   → AI 参考代码生成实现
```

### 流程 C：AI 下载技能到本地使用

```
1. AI 搜索并评估技能（同流程 B 的步骤 1-2）

2. AI 调用 download_skill(name="docker-deploy")
   → 返回 ZIP 文件（base64 编码）

3. Agent 工具在本地解压 ZIP
   → 获得完整文件目录

4. AI 读取本地文件，使用脚本/配置/代码模板
```

### 流程 D：AI 导入新技能

```
1. 用户提供一个技能 ZIP 文件路径

2. AI 调用 import_skill(zip_path="/path/to/skill.zip")
   → 导入成功，返回技能名称
   → 后续可通过 search_skills 发现该技能
```
