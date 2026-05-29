# PSM (Skill & Prompt Manager) 项目分析报告

> 版本: 1.0.0 | 分析日期: 2026-05-30 | 分析人: AI 架构师

---

## 一、项目概述

**项目名称**: PSM — Skill & Prompt Manager
**核心定位**: 基于 Wails v2 的跨平台桌面应用，用于统一管理 AI 开发中的 Skill（技能包）和 Prompt（提示词）
**核心业务场景**:
- Prompt 的增删改查、分类筛选、搜索、JSON 导入导出
- Skill 的元数据管理 + 文件系统存储（ZIP 包导入导出、SKILL.md frontmatter 解析）
- 系统设置（存储路径、主题切换）
- 仪表盘数据概览

---

## 二、目录结构梳理

```
psm/
├── main.go                          # Wails 应用入口，配置窗口/生命周期/前端资源嵌入
├── app.go                           # App 主结构体，持有 db+service，暴露 30+ 个前端 API 方法
├── go.mod / go.sum                  # Go 模块定义与依赖锁定
├── wails.json                       # Wails 框架配置（应用名、版本、构建选项）
├── .gitignore                       # Git 忽略规则（exe/vendor/db/IDE/OS 等）
├── AGENTS.md                        # 本分析报告
│
├── internal/                        # 后端核心业务代码（Go 标准 internal 包结构）
│   ├── db/
│   │   ├── models.go                # 数据模型：Settings/Prompt/Skill/SkillFile/ImportResult/DashboardStats
│   │   └── sqlite.go                # SQLite 初始化：WAL 模式、建表迁移、默认设置插入
│   ├── service/
│   │   ├── settings.go              # 设置服务：Get/Update/BatchUpdate/GetSkillStoragePath
│   │   ├── prompt.go                # Prompt 服务：CRUD + 搜索筛选 + 分类查询 + 导入导出
│   │   └── skill.go                 # Skill 服务：CRUD + ZIP 导入（SKILL.md 校验）+ 文件列表
│   └── utils/
│       ├── archive.go               # ZIP 压缩/解压 + SKILL.md 解析 + frontmatter 提取
│       ├── export.go                # JSON 导入导出格式处理
│       └── path.go                  # 路径工具：ExpandHome/EnsureDir/JoinPath
│
├── frontend/                        # 前端资源（纯 HTML + CSS + JS，无框架依赖）
│   ├── index.html                   # 主页面：侧边栏导航 + 内容区 + Toast/Modal/Confirm 容器
│   ├── css/
│   │   └── style.css                # 全局样式：Flat Design + CSS 变量主题系统（亮/暗）
│   └── js/
│       ├── api.js                   # Wails 绑定封装层：统一错误处理 + Number(id) 类型转换
│       ├── app.js                   # SPA 路由 + 脚本懒加载 + 主题初始化
│       ├── components/
│       │   ├── toast.js             # Toast 消息组件（success/error/warning/info + SVG 图标）
│       │   ├── modal.js             # 模态框组件（打开/关闭/内容填充）
│       │   └── confirm.js           # 确认对话框组件（Promise-based）
│       └── views/
│           ├── dashboard.js         # 仪表盘：统计卡片 + 最近更新列表
│           ├── prompts.js           # Prompt 管理：列表/搜索/分类筛选/CRUD/导入导出
│           ├── skills.js            # Skill 管理：列表/搜索/CRUD/ZIP 导入导出/文件浏览
│           └── settings.js          # 设置页：存储路径配置 + 主题切换
│
├── tools/
│   └── seed/
│       └── main.go                  # 测试数据注入脚本（8 条 Prompt + 3 个 Skill）
│
├── build/                           # Wails 构建产物
│   ├── appicon.png
│   ├── bin/psm.exe                  # 生产构建可执行文件
│   └── windows/                     # Windows 平台资源（图标、manifest、info）
│
└── .trae/                           # AI 辅助开发配置
    ├── rules/
    │   └── git-commit-message.md    # Git 提交规范（Conventional Commits）
    └── specs/
        └── wails-skill-prompt-manager/  # 项目规格说明（spec/tasks/checklist）
```

### 规范性评估

| 维度 | 评价 |
|------|------|
| Go 项目结构 | ✅ 遵循标准 `internal/` 隔离规范，service 层清晰分离 |
| 前端结构 | ✅ 按 views/components 分目录，职责清晰 |
| 配置管理 | ✅ wails.json + SQLite settings 表，双层配置 |
| 工具脚本 | ✅ `tools/seed/` 独立目录，不混入业务代码 |
| 冗余文件 | ⚠️ 根目录存在 `psm.exe` 和 `seed.exe` 编译产物（应 gitignore） |

---

## 三、核心功能模块识别

### 基础支撑模块

| 模块 | 核心功能 | 文件 | 核心依赖 |
|------|----------|------|----------|
| 数据库层 | SQLite 初始化、WAL 模式、建表迁移、默认设置 | `internal/db/sqlite.go` | modernc.org/sqlite |
| 数据模型 | 6 个结构体定义 | `internal/db/models.go` | 无 |
| 路径工具 | ~ 展开、目录创建、路径拼接 | `internal/utils/path.go` | os/path/filepath |
| 压缩工具 | ZIP 压缩/解压、SKILL.md 读取、frontmatter 解析 | `internal/utils/archive.go` | archive/zip |
| 导入导出 | JSON 格式的 Prompt/Skill 元数据读写 | `internal/utils/export.go` | encoding/json |

### 业务核心模块

| 模块 | 核心功能 | 文件 | 核心输入/输出 |
|------|----------|------|---------------|
| 设置服务 | 系统参数 CRUD、Skill 存储路径管理 | `internal/service/settings.go` | 输入: key/value → 输出: map/string |
| Prompt 服务 | CRUD + 搜索筛选 + 分类查询 + JSON 导入导出 | `internal/service/prompt.go` | 输入: name/content/keyword → 输出: Prompt[] |
| Skill 服务 | CRUD + ZIP 导入（含 SKILL.md 校验）+ 文件列表 + ZIP 导出 | `internal/service/skill.go` | 输入: ZIP/元数据 → 输出: Skill[]/SkillFile[] |
| Wails 绑定层 | App 结构体，30+ 个前端 API 方法 + 7 个文件对话框 | `app.go` | 前端 ↔ Go 桥接 |
| 前端 SPA | 路由管理、视图切换、组件系统 | `frontend/js/app.js` + views/ | 用户交互 → API 调用 |

---

## 四、模块间依赖关系

### 调用链路

```
┌─────────────────────────────────────────────────┐
│                   Frontend                       │
│  index.html → app.js → api.js → views/*.js       │
│  components/{toast,modal,confirm}.js             │
└──────────────────┬──────────────────────────────┘
                   │ Wails Bind (JSON-RPC)
┌──────────────────▼──────────────────────────────┐
│                 app.go (App)                     │
│  GetSettings / CreatePrompt / ImportSkill / ...  │
│  OpenFileDialog / SaveFileDialog / ...           │
└────┬─────────────┬──────────────┬───────────────┘
     │             │              │
┌────▼────┐ ┌─────▼─────┐ ┌─────▼─────┐
│ Settings │ │  Prompt   │ │   Skill   │
│ Service  │ │  Service  │ │  Service  │
└────┬─────┘ └─────┬─────┘ └─────┬─────┘
     │             │              │
     │        ┌────▼────┐   ┌────▼────┐
     │        │ export  │   │ archive │
     │        │ .go     │   │ .go     │
     │        └────┬────┘   └────┬────┘
     │             │              │
┌────▼─────────────▼──────────────▼───────┐
│            internal/db/sqlite.go         │
│     SQLite (WAL) + models.go            │
└──────────────────┬──────────────────────┘
                   │
          ~/.psm/data.db
          ~/.psm/skills/
```

### 依赖关系明细

| 模块 A | 依赖模块 B | 依赖类型 |
|--------|-----------|----------|
| app.go | SettingsService | 组合（startup 初始化） |
| app.go | PromptService | 组合 |
| app.go | SkillService | 组合（注入 SettingsService） |
| SkillService | SettingsService | 方法调用（获取存储路径） |
| SkillService | archive.go | 工具调用（ZIP 压缩/解压/SKILL.md 解析） |
| PromptService | export.go | 工具调用（JSON 导入导出） |
| 所有 Service | db/sqlite.go | 数据库连接 |
| 前端 api.js | app.go (Wails Bind) | JSON-RPC 通信 |

### 潜在问题

- ✅ **无循环依赖**：`internal/` 包之间依赖方向单一（service → db, service → utils）
- ✅ 依赖深度合理，最多 3 层（前端 → app → service → utils/db）
- ⚠️ `app.go` 作为"上帝对象"持有所有服务实例，方法数量较多（30+），后续可考虑按领域拆分

---

## 五、设计模式与实现逻辑

### 架构模式

| 模式 | 应用位置 | 说明 |
|------|----------|------|
| **分层架构** | 整体 | 前端视图 → Wails 绑定层 → Service 层 → DB/Utils 层 |
| **服务层模式** | `internal/service/` | SettingsService/PromptService/SkillService 封装业务逻辑 |
| **仓库模式（简化）** | Service 层直接操作 DB | 未单独抽 Repository 层，Service 直接执行 SQL |
| **SPA 路由** | `frontend/js/app.js` | 前端单页应用，hash-free 路由切换 |
| **组件化** | `frontend/js/components/` | Toast/Modal/Confirm 可复用组件 |
| **观察者模式** | 前端事件绑定 | input/change 事件驱动视图更新 |

### 核心业务流程

**Prompt 创建流程**:
```
用户点击"新建" → 弹出模态框 → 填写表单 → 提交
→ API.createPrompt(name, content, category, tags)
→ app.go: tags []string → json.Marshal → tagsJSON string
→ PromptService.CreatePrompt(name, content, category, tagsSQL)
→ SQL INSERT → 返回 Prompt 对象
→ 前端刷新列表
```

**Skill 导入流程**:
```
用户选择 ZIP 文件 → API.openZIPFileDialog() → 获取路径
→ API.importSkill(zipPath) → app.go → SkillService.ImportSkill(zipPath)
→ 1. HasSkillMD(zipPath): 检查 ZIP 根目录是否有 SKILL.md
   → 无则拒绝导入，返回错误
→ 2. GetSkillMetadataFromZip(zipPath): 读取 SKILL.md
   → 解析 YAML frontmatter 提取 name/description
→ 3. 检查同名 Skill 是否已存在
→ 4. UnzipToDir(zipPath, skillDir): 解压到存储目录
→ 5. SQL INSERT 创建数据库记录
→ 返回 Skill 对象
```

**SKILL.md Frontmatter 解析**:
```markdown
---
name: go-kit-core
description: go-kit 项目综合技能...
---

ParseSkillFrontmatter() 提取 → name="go-kit-core", description="go-kit 项目综合技能..."
```

---

## 六、技术栈评估

### 核心技术栈

| 层级 | 技术 | 版本 | 评价 |
|------|------|------|------|
| 桌面框架 | Wails | v2.11.0 | ✅ 适合轻量级 Go+Web 桌面应用，社区活跃 |
| 后端语言 | Go | 1.25.0 | ✅ 最新稳定版，性能优秀 |
| 前端 | HTML + CSS + JS | 原生 | ✅ 零依赖，加载快，适合小型工具 |
| 数据库 | SQLite (modernc.org) | v1.51.0 | ✅ 纯 Go 实现，无需 CGO，部署简单 |
| 压缩 | archive/zip | 标准库 | ✅ 原生支持，无额外依赖 |
| WebView | go-webview2 | v1.0.22 | ✅ Windows 下使用 Edge WebView2 |

### 技术栈适配性分析

| 维度 | 评价 |
|------|------|
| 项目规模匹配 | ✅ 小型工具项目，技术栈简洁无过度设计 |
| 部署便捷性 | ✅ 单个 exe 文件，无外部依赖 |
| 跨平台支持 | ✅ Wails 支持 Windows/macOS/Linux |
| 前端选型 | ✅ 原生三件套适合此规模，避免了 React/Vue 的构建复杂度 |
| 数据库选型 | ✅ modernc.org/sqlite 纯 Go 无需 CGO，避免了交叉编译问题 |

### 依赖数量

- 直接依赖: 2 个（wails/v2, modernc.org/sqlite）
- 间接依赖: ~30 个（均为 Wails 框架传递依赖）
- 总体评价: ✅ 依赖精简，攻击面小

---

## 七、补充分析

### 代码规范

| 维度 | 状态 | 说明 |
|------|------|------|
| 命名规范 | ✅ | Go: 驼峰命名；JS: camelCase；SQL: snake_case |
| 注释规范 | ✅ | 所有导出函数有中文注释，遵循 godoc 格式 |
| 代码风格 | ✅ | Go: gofmt 格式化；CSS: CSS 变量系统 |
| 提交规范 | ✅ | Conventional Commits（.trae/rules/ 已配置） |

### 异常处理

| 层级 | 状态 | 说明 |
|------|------|------|
| Go Service | ✅ | 所有方法返回 error，使用 fmt.Errorf 包装上下文 |
| Go App 层 | ✅ | 方法直接透传 service error |
| 前端 API 层 | ✅ | api.js 统一 catch + Toast.error 提示 |
| 前端视图层 | ⚠️ | 部分 try-catch 为空（依赖 api.js 处理），建议补充日志 |

### 扩展性评估

| 维度 | 评分 | 说明 |
|------|------|------|
| 新增数据类型 | ⭐⭐⭐⭐ | 在 db/models.go 加结构体，service/ 加服务，app.go 加绑定即可 |
| 新增前端视图 | ⭐⭐⭐⭐ | 在 views/ 加 JS 文件，app.js switch 加 case |
| 新增设置项 | ⭐⭐⭐⭐⭐ | settings 表 INSERT OR IGNORE，前端表单加字段 |
| 数据库迁移 | ⭐⭐⭐ | 当前无版本化迁移机制，需手动 ALTER TABLE |
| 插件系统 | ⭐⭐ | 无插件架构，扩展需修改核心代码 |

### 性能关键点

| 关注点 | 状态 | 说明 |
|--------|------|------|
| SQLite 查询 | ✅ | 已启用 WAL 模式，支持并发读 |
| 列表查询 | ✅ | 按需 LIMIT，无全表扫描风险 |
| ZIP 操作 | ⚠️ | 大文件解压可能阻塞，当前为同步操作 |
| 前端渲染 | ✅ | 列表数据量小，无虚拟滚动需求 |
| 脚本加载 | ✅ | 已实现 loadedScripts 去重，避免重复加载 |

---

## 八、数据库设计

### ER 关系

```
settings (KV 存储)
├── skill_storage_path: ~/.psm/skills
└── app_theme: light/dark

prompts (独立表)
├── id (PK, AUTO_INCREMENT)
├── name, content, category
├── tags (JSON 数组字符串)
└── created_at, updated_at

skills (独立表 + 文件系统)
├── id (PK, AUTO_INCREMENT)
├── name, description, version
├── relative_path → 拼接 skill_storage_path 得到绝对路径
└── created_at, updated_at
```

### 存储策略

| 数据类型 | 存储位置 | 理由 |
|----------|----------|------|
| Prompt 内容 | SQLite | 纯文本，适合数据库存储 |
| Skill 元数据 | SQLite | 轻量查询，避免扫描文件系统 |
| Skill 文件 | 文件系统 | 包含脚本/文档/工具等二进制文件，不适合入库 |
| 系统设置 | SQLite | KV 表，简单高效 |

---

## 九、项目核心特点

1. **存储分离设计**: Skill 元数据在数据库，实际文件在文件系统，通过 `relative_path` 关联
2. **SKILL.md 规范**: 导入时强制校验 SKILL.md 存在性，解析 YAML frontmatter 自动填充元数据
3. **零前端框架**: 原生 HTML/CSS/JS，Flat Design 设计系统，Space Grotesk 字体
4. **纯 Go SQLite**: modernc.org/sqlite 无需 CGO，单 exe 部署
5. **主题系统**: CSS 变量驱动的亮/暗主题，设置持久化到数据库

---

## 十、待优化点

| 优先级 | 问题 | 建议 |
|--------|------|------|
| P1 | 无数据库版本化迁移 | 引入 goose 或自实现版本号 + ALTER TABLE |
| P1 | app.go 方法过多（30+） | 按领域拆分为 SettingsHandler/PromptHandler/SkillHandler |
| P2 | 无单元测试 | 为 service 层和 utils 层补充测试 |
| P2 | Skill 导入为同步操作 | 大 ZIP 文件可能导致 UI 卡顿，可考虑异步 |
| P2 | 无批量操作 API | 批量删除、批量分类移动等 |
| P3 | 前端无骨架屏 | 加载时显示 loading 动画，提升体验 |
| P3 | 无国际化支持 | 当前仅中文硬编码 |
| P3 | 无快捷键支持 | Ctrl+N 新建、Ctrl+F 搜索等 |

---

## 十一、关键记忆点

1. **数据库路径**: `~/.psm/data.db`（SQLite，WAL 模式）
2. **Skill 存储**: `~/.psm/skills/`（默认，可在设置中修改）
3. **SKILL.md 规范**: YAML frontmatter 格式，`---\nname: xxx\ndescription: xxx\n---`
4. **前端 ID 处理**: HTML data-id 是字符串，api.js 中所有 id 参数用 `Number()` 转换
5. **Go 空切片**: 所有返回前端的切片必须初始化为 `[]Type{}`，否则 JSON 输出 `null`
6. **构建命令**: `wails dev`（开发）/ `wails build`（生产）/ `go run tools/seed/main.go`（测试数据）
7. **设计系统**: Flat Design，无阴影无渐变，Space Grotesk 字体，SVG 图标
8. **前端路由**: app.js loadScript 去重机制，防止 const 重复声明
