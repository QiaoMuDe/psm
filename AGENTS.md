# PSM (Skill & Prompt Manager) 项目分析报告

> 版本: 2.11.0 | 更新日期: 2026-06-01 | 分析人: AI 架构师

---

## 一、项目概述

**项目名称**: PSM — Skill & Prompt Manager
**核心定位**: 基于 Wails v2 的跨平台桌面应用，用于统一管理 AI 开发中的 Skill（技能包）和 Prompt（提示词）
**核心业务场景**:
- Prompt 的增删改查、分类筛选、搜索（含标签匹配+高亮）、JSON 选择性导入导出、置顶、模板变量（`{{变量名}}` / `{{变量名|默认值}}` 占位符）
- Skill 的元数据管理 + 文件系统存储（ZIP 批量导入导出、SKILL.md frontmatter 解析与同步、标签系统）
- AI 功能（设置页配置 API 地址/Key/模型、一键生成提示词、优化提示词/名称/描述、模型列表获取、连接测试、AI 翻译）
- AI 翻译模块（独立侧边栏导航、左右分栏布局、流式翻译、语言交换、分栏动画）
- 数据管理（完整备份恢复、一键备份还原、数据统计、孤立数据清理、数据重置、数据目录快捷打开）
- 系统设置（程序家目录配置、6 种主题切换、侧边栏收起持久化、全局字体大小控制、全局字体族设置、AI 配置）
- 仪表盘数据概览（统计卡片可点击跳转、置顶内容模块、全局搜索框、最常用提示词）
- 全局拖拽导入（支持拖入 ZIP 文件直接导入技能）
- 快捷键系统（全局快捷键 + 模块快捷键 + 悬停复制）
- 批量操作增强（批量修改分类/添加移除标签/置顶取消置顶，下拉菜单交互）
- 关于弹窗（版本号、项目地址、快捷键帮助）
- 后端日志系统（fastlog 封装、全模块日志覆盖、设置页分段滑块动态切换日志级别）

---

## 二、目录结构梳理

```
psm/
├── main.go                          # Wails 应用入口，配置窗口/生命周期/前端资源嵌入/文件拖拽/日志初始化
├── app.go                           # App 主结构体，嵌入 Handler，仅保留结构体定义+生命周期
├── go.mod / go.sum                  # Go 模块定义与依赖锁定
├── wails.json                       # Wails 框架配置（应用名、版本、构建选项）
├── .gitignore                       # Git 忽略规则（exe/vendor/db/IDE/OS 等）
├── AGENTS.md                        # 本分析报告
│
├── internal/                        # 后端核心业务代码（Go 标准 internal 包结构）
│   ├── log/
│   │   └── log.go                   # 日志封装：fastlog 全局 Logger + Init/Get/Close/SetLevel/GetLevel
│   ├── handler/                     # Handler 子包（按领域拆分，嵌入到 App）
│   │   ├── settings.go              # SettingsHandler：设置/版本/文件对话框/文件操作/程序家目录管理/日志级别获取设置（19 方法）
│   │   ├── prompt.go                # PromptHandler：Prompt CRUD/导入导出/置顶（13 方法）
│   │   ├── skill.go                 # SkillHandler：Skill CRUD/ZIP 导入导出/置顶（15 方法）
│   │   ├── backup.go                # BackupHandler：备份恢复/一键备份还原/数据统计/孤立清理（8 方法）
│   │   └── ai.go                    # AIHandler：AI 流式生成/优化/翻译/模型列表/连接测试（11 方法）
│   ├── db/
│   │   ├── models.go                # GORM 数据模型：Settings/Prompt(含usage_count)/Skill/SkillFile(含full_path)/ImportResult/DashboardStats
│   │   └── gorm.go                  # GORM 初始化：数据库连接、AutoMigrate、默认设置插入、日志注入
│   ├── service/
│   │   ├── settings.go              # 设置服务：CRUD + 批量更新 + 程序家目录管理 + 重置默认设置（GORM API）
│   │   ├── prompt.go                # Prompt 服务：CRUD + 搜索筛选(含tags) + 分类查询 + 批量删除 + 选择性 JSON 导入导出 + 置顶 + 使用统计（GORM API）
│   │   └── skill.go                 # Skill 服务：CRUD + 批量删除 + 单/双格式 ZIP 导入导出 + 编辑同步 SKILL.md + 文件列表 + 置顶（GORM API）
│   └── utils/
│       ├── archive.go               # ZIP 压缩/解压 + SKILL.md 解析/frontmatter 读写 + 导出格式处理
│       ├── backup.go                # 完整备份恢复：ZIP 打包 data.json + Skill 文件目录
│       ├── font.go                  # 字体工具：系统字体族列表获取（Windows API）
│       ├── export.go                # Prompt JSON 导入导出格式处理
│       └── path.go                  # 路径工具：ExpandHome/EnsureDir/JoinPath
│
├── frontend/                        # 前端资源（纯 HTML + CSS + JS，无框架依赖）
│   ├── index.html                   # 主页面：侧边栏导航 + 内容区 + Toast/Modal/Confirm/ContextMenu 容器
│   ├── css/
│   │   ├── variables.css            # CSS 变量定义：6 种主题颜色/间距/字体/阴影/圆角/全局字体偏移
│   │   ├── layout.css               # 布局样式：应用容器/侧边栏/主内容区/响应式/视图内容滚动
│   │   └── components.css           # 组件样式：卡片/按钮/表单/表格/标签/模态框/Toast/批量栏/右键菜单/模板变量/关于弹窗/设置分组/仪表盘搜索/置顶内容/跳转闪烁/动画效果/点击动画/Skill详情弹窗/日志级别分段滑块
│   └── js/
│       ├── api.js                   # Wails 绑定封装层：统一错误处理 + Number(id) 类型转换 + 获取置顶内容 + 文件操作
│       ├── app.js                   # SPA 路由 + 脚本懒加载 + 主题初始化 + ContextMenu 初始化 + highlightText 工具函数 + 全局字体偏移 + 关于弹窗 + 模板变量函数 + 跳转高亮
│       ├── components/
│       │   ├── toast.js             # Toast 消息组件（success/error/warning/info + SVG 图标）
│       │   ├── modal.js             # 模态框组件（打开/关闭/内容填充）
│       │   ├── confirm.js           # 确认对话框组件（Promise-based）
│       │   ├── context-menu.js      # 右键菜单组件（动态菜单项/自动定位/点击外部关闭/支持弹窗环境）
│       │   └── dropdown-menu.js     # 下拉菜单组件（批量操作"更多操作"菜单，自动边界定位/点击外部关闭）
│       └── views/
│           ├── dashboard.js         # 仪表盘：可点击统计卡片 + 置顶内容模块 + 全局搜索框（300ms 防抖 + 键盘导航）
│           ├── prompts.js           # Prompt 管理：卡片/列表视图/搜索/标签筛选/CRUD/批量管理/右键菜单/选择性导入导出/置顶/搜索高亮/悬停复制/模板变量格式说明
│           ├── skills.js            # Skill 管理：卡片/列表视图/搜索/标签筛选/批量管理(修改分类/添加移除标签/置顶)/右键菜单(查看/编辑/导出/删除)/ZIP 导入导出/文件浏览/置顶/搜索高亮/Skill 详情弹窗/文件右键菜单
│           ├── settings.js          # 设置页：程序家目录配置 + 6 种主题切换 + 全局字体大小控制 + 全局字体族设置 + 分组卡片布局 + 日志级别分段滑块
│           ├── data.js              # 数据管理：一键备份还原 + 完整备份恢复 + 数据重置
│           └── translate.js         # AI 翻译：左右分栏布局/语言选择/流式翻译/语言交换/复制清除/动画效果
│
├── tools/
│   └── seed/
│       └── main.go                  # 测试数据注入脚本（21 条 Prompt 含 6 条模板 + 13 个 Skill，含 SKILL.md）
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
| CSS 组织 | ✅ 三文件拆分：variables（变量/主题）、layout（布局）、components（组件） |
| 配置管理 | ✅ wails.json + SQLite settings 表，双层配置 |
| 工具脚本 | ✅ `tools/seed/` 独立目录，不混入业务代码 |
| 代码质量 | ✅ golangci-lint 零告警（errcheck + staticcheck 全部通过） |

---

## 三、核心功能模块识别

### 基础支撑模块

| 模块 | 核心功能 | 文件 | 核心依赖 |
|------|----------|------|----------|
| 数据库层 | GORM 初始化、AutoMigrate、WAL 模式、默认设置 | `internal/db/gorm.go` | glebarez/sqlite (纯 Go) |
| 数据模型 | GORM 标签定义（Prompt/Skill 含 is_pinned/usage_count/DeletedAt） | `internal/db/models.go` | gorm.io/gorm |
| 路径工具 | ~ 展开、目录创建、路径拼接 | `internal/utils/path.go` | os/path/filepath |
| 压缩工具 | ZIP 压缩/解压、SKILL.md 读写、frontmatter 解析、导出格式处理、目录扁平化 | `internal/utils/archive.go` | archive/zip |
| 导入导出 | JSON 格式的 Prompt 元数据读写 | `internal/utils/export.go` | encoding/json |
| 备份恢复 | 完整备份（data.json + Skill 文件）、恢复（跳过同名） | `internal/utils/backup.go` | archive/zip, encoding/json |
| 字体工具 | 系统字体族列表获取（Windows API EnumFontFamiliesW） | `internal/utils/font.go` | syscall (Windows GDI) |
| 日志封装 | fastlog 全局 Logger、Init/Get/Close/SetLevel/GetLevel | `internal/log/log.go` | gitee.com/MM-Q/fastlog |

### 业务核心模块

| 模块 | 核心功能 | 文件 | 核心输入/输出 |
|------|----------|------|---------------|
| 设置服务 | 系统参数 CRUD、程序家目录管理（读取/迁移）、重置默认设置、日志级别获取设置 | `internal/service/settings.go` | 输入: key/value → 输出: map/string（GORM 全局实例） |
| Prompt 服务 | CRUD + 搜索筛选 + 分类查询 + 批量删除 + 选择性 JSON 导入导出 + 模板变量 + 使用统计 + 置顶 + 标签管理 + 批量操作(修改分类/添加移除标签/置顶) | `internal/service/prompt.go` | 输入: name/content/keyword → 输出: Prompt[]（GORM 全局实例） |
| Skill 服务 | CRUD + 批量删除 + 单/双格式 ZIP 导入导出 + 编辑同步 SKILL.md + 文件列表 + 置顶 + 标签管理 + 批量操作(添加移除标签/置顶) | `internal/service/skill.go` | 输入: ZIP/元数据 → 输出: Skill[]/SkillFile[]（GORM 全局实例） |
| AI 服务 | 流式生成提示词（含重新生成）、流式优化提示词、流式翻译、获取模型列表（含键盘导航）、测试连接 | `internal/handler/ai.go` | 输入: 描述/内容/目标语言 → 输出: Events 流式推送 |
| Wails 绑定层 | App 结构体，40+ 个前端 API 方法 + 8 个文件对话框 | `app.go` | 前端 ↔ Go 桥接 |
| 版本信息 | 构建时版本注入（verman 库），前端展示 | `app.go` GetVersion | 输入: 无 → 输出: version map |
| 前端 SPA | 路由管理、视图切换、组件系统（含右键菜单） | `frontend/js/app.js` + views/ | 用户交互 → API 调用 |

### 前端组件模块

| 组件 | 核心功能 | 文件 |
|------|----------|------|
| Toast | 消息提示（success/error/warning/info） | `frontend/js/components/toast.js` |
| Modal | 模态框（打开/关闭/内容填充） | `frontend/js/components/modal.js` |
| Confirm | 确认对话框（Promise-based，danger/info） | `frontend/js/components/confirm.js` |
| ContextMenu | 右键菜单（动态菜单项/自动边界定位/点击外部关闭） | `frontend/js/components/context-menu.js` |
| DropdownMenu | 下拉菜单（批量操作"更多操作"菜单，自动边界定位/点击外部关闭） | `frontend/js/components/dropdown-menu.js` |

---

## 四、模块间依赖关系

### 调用链路

```
┌──────────────────────────────────────────────────────────┐
│                       Frontend                            │
│  index.html → app.js → api.js → views/*.js                │
│  components/{toast,modal,confirm,context-menu}.js          │
└──────────────────┬───────────────────────────────────────┘
                   │ Wails Bind (JSON-RPC)
┌──────────────────▼───────────────────────────────────────┐
│              app.go (App + 嵌入 Handler)                   │
│  SettingsHandler / PromptHandler / SkillHandler /          │
│  BackupHandler / AIHandler                                │
└────┬─────────────┬──────────────┬──────────────┬─────────┘
     │             │              │              │
┌────▼────┐ ┌─────▼─────┐ ┌─────▼─────┐ ┌─────▼─────┐
│ Settings │ │  Prompt   │ │   Skill   │ │    AI     │
│ Handler  │ │  Handler  │ │  Handler  │ │  Handler  │
└────┬─────┘ └─────┬─────┘ └─────┬─────┘ └─────┬─────┘
     │             │              │              │
┌────▼────┐ ┌─────▼─────┐ ┌─────▼─────┐    外部 API
│ Settings │ │  Prompt   │ │   Skill   │    (OpenAI)
│ Service  │ │  Service  │ │  Service  │
└────┬─────┘ └─────┬─────┘ └─────┬─────┘
     │             │              │
     │        ┌────▼────┐   ┌────▼────┐
     │        │ export  │   │ archive │
     │        │ .go     │   │ .go     │
     │        └────┬────┘   └────┬────┘
     │             │              │
┌────▼─────────────▼──────────────▼───────┐
│        internal/db/gorm.go (GORM)       │
│     DB 全局实例 + AutoMigrate + 模型定义  │
└──────────────────┬──────────────────────┘
                   │
          ~/.psm/data.db
          ~/.psm/skills/
```

### 依赖关系明细

| 模块 A | 依赖模块 B | 依赖类型 |
|--------|-----------|----------|
| app.go | Handler (SettingsHandler/PromptHandler/SkillHandler/BackupHandler/AIHandler) | 结构体嵌入 |
| Handler | SettingsService / PromptService / SkillService | 组合（构造函数注入） |
| app.go | verman | 构建时版本注入（`-ldflags -X`） |
| AIHandler | SettingsService | 方法调用（获取 API 配置） |
| SkillService | SettingsService | 方法调用（获取存储路径） |
| SkillService | archive.go | 工具调用（ZIP 压缩/解压/SKILL.md 读写/导出格式） |
| PromptService | export.go | 工具调用（JSON 导入导出） |
| app.go | backup.go | 工具调用（完整备份恢复） |
| 所有 Service | db/gorm.go | GORM 全局实例（DB *gorm.DB） |
| 所有 Handler | internal/log | psmlog.Get() 获取全局 Logger |
| main.go | internal/log | psmlog.Init(path) 初始化日志 |
| 前端 api.js | app.go (Wails Bind) | JSON-RPC 通信 |
| 前端视图 | ContextMenu | 右键菜单调用（cards/rows 右键事件） |
| 前端视图 | Toast/Modal/Confirm | 消息提示/模态框/确认对话框 |

### 潜在问题

- ✅ **无循环依赖**：`internal/` 包之间依赖方向单一（handler → service → db, handler → utils）
- ✅ 依赖深度合理，最多 4 层（前端 → app → handler → service → utils/db）
- ⚠️ ~~`app.go` 作为"上帝对象"持有所有服务实例，方法数量较多（40+），后续可考虑按领域拆分~~ ✅ 已重构为 Handler 嵌入模式

---

## 五、设计模式与实现逻辑

### 架构模式

| 模式 | 应用位置 | 说明 |
|------|----------|------|
| **分层架构** | 整体 | 前端视图 → Wails 绑定层 → Handler → Service → DB/Utils |
| **Handler 嵌入模式** | `internal/handler/` + `app.go` | 按领域拆分 Handler，嵌入到 App 结构体 |
| **服务层模式** | `internal/service/` | SettingsService/PromptService/SkillService 封装业务逻辑 |
| **仓库模式（简化）** | Service 层直接操作 DB | 未单独抽 Repository 层，Service 通过 GORM 全局实例操作数据库 |
| **SPA 路由** | `frontend/js/app.js` | 前端单页应用，hash-free 路由切换 |
| **组件化** | `frontend/js/components/` | Toast/Modal/Confirm/ContextMenu 可复用组件 |
| **批量管理模式** | views/*.js | 按钮触发进入批量模式 → 复选框显示 → 操作栏底部固定 → 退出恢复默认 |
| **构建时注入** | app.go + verman | 通过 `-ldflags -X` 在构建时注入版本元数据 |
| **日志封装** | `internal/log/log.go` | fastlog 全局 Logger，Handler/Service 通过 psmlog.Get() 获取，设置页动态调整级别 |

### 核心业务流程

**Prompt 创建流程**:
```
用户点击"新建" → 弹出模态框 → 填写表单 → 提交
→ API.createPrompt(name, content, category, tags)
→ PromptHandler.CreatePrompt(name, content, category, tags)
→ PromptService.CreatePrompt(name, content, category, tags)
→ utils.MustMarshalJSON(tags) 序列化标签 → GORM Create(&Prompt{})
→ 返回 Prompt 对象
→ 前端刷新列表
```

**Skill 导入流程（双格式自动识别）**:
```
用户选择 ZIP 文件 → API.importSkillAuto(zipPath)
→ app.go 检测格式:
  ├─ 有标识文件 (.psm-skill-export) → ImportSkillFromExportZip
  │   → 扫描 ZIP 根目录下所有子目录
  │   → 逐个检查同名 Skill 是否存在（跳过已存在）
  │   → 读取 SKILL.md frontmatter 提取元数据
  │   → UnzipPrefixToDir 解压到存储目录（带前缀剥离）
  │   → GORM Create(&Skill{}) 创建数据库记录
  │   → 返回 ImportResult（成功/跳过/失败统计）
  │
  └─ 无标识文件 → ImportSkill（公共格式）
      → HasSkillMD 检查根目录 SKILL.md
      → GetSkillMetadataFromZip 解析 frontmatter
      → 检查同名 Skill 是否已存在
      → UnzipToDir 解压 + FlattenIfNested 修复嵌套
      → GORM Create(&Skill{}) 创建数据库记录
      → 返回 Skill 对象
```

**Skill 导出流程（双格式区分）**:
```
单个 Skill 导出（标准格式）:
→ ExportSkill(id, savePath)
→ ZipDir(skillDir, savePath) → 直接打包技能目录
→ ZIP 结构:
  skill-name/
    ├── SKILL.md
    └── ...

多个 Skill 导出（PSM 格式）:
→ ExportSkillsToZip(ids, savePath)
→ utils.CreateSkillExportZip:
  → 创建 ZIP 根目录标识文件 .psm-skill-export（空文件）
  → 逐个技能: addDirToZipWithPrefix 将本地目录打包到 ZIP 根目录下
→ ZIP 结构:
  .psm-skill-export          (空标识文件)
  skill-name-1/              (技能目录，直接在根目录)
    ├── SKILL.md
    └── ...
  skill-name-2/
    └── ...
```

**Skill 编辑同步 SKILL.md**:
```
用户编辑 Skill 名称/描述 → API.updateSkill(id, name, description)
→ SkillService.UpdateSkill:
  → GORM Updates(map) 更新数据库记录
  → utils.UpdateSkillFrontmatter(skillMDPath, name, description):
    ├─ 文件存在 → 定位 frontmatter 区域（--- ... ---）→ 替换其中 name/description
    ├─ 文件不存在 → 创建文件并写入 frontmatter
    └─ 无 frontmatter → 在文件头部插入 frontmatter
  → 仅修改 frontmatter 部分，保留正文内容不被覆盖
```

**卡片视图右键菜单流程**:
```
用户右键点击卡片/表格行 → contextmenu 事件
→ showPromptContextMenu(e, id) / showSkillContextMenu(e, id)
→ 从 allPrompts / allSkills 查找数据
→ ContextMenu.show(x, y, items) 渲染菜单
→ 用户点击菜单项 → 执行对应 action（查看/复制/编辑/导出/删除）
→ ContextMenu.hide() 关闭菜单
→ 点击页面其他位置/滚动 → 自动关闭菜单
```

**批量管理模式流程**:
```
默认状态（无复选框）→ 点击"批量管理"按钮
→ toggleBatchMode() → batchMode=true
→ syncBatchMode() → 添加 .batch-mode 类到 wrapper
→ .batch-mode 下 .th-checkbox/.td-checkbox/.card-checkbox-wrap 显示
→ batch-bar 在底部显示（order:1 flex 布局）
→ 用户选择项目 → selectedIds Set 更新 → 计数更新
→ 点击"退出管理" → toggleBatchMode() → 清空选中 → 恢复默认
```

**仪表盘统计卡片跳转**:
```
用户点击 Prompt/Skill 统计卡片
→ stat-card[data-view] 点击事件
→ App.navigate(card.dataset.view)
→ 跳转到对应模块视图
```

**完整备份恢复流程**:
```
备份: API.backupData(savePath)
→ 收集所有 settings + prompts + skills 元数据
→ 创建 ZIP: psm-backup/data.json + psm-backup/skills/ 目录
→ 自动过滤 skill_storage_path 避免路径硬编码

恢复: API.restoreData(zipPath)
→ 解析 psm-backup/data.json
→ 恢复设置（过滤 skill_storage_path）
→ 逐个恢复 Prompt/Skill（同名跳过）
→ 解压 Skill 文件到存储目录
→ 返回恢复统计
```

**一键备份还原流程**:
```
一键备份: API.quickBackup()
→ 固定路径 ~/.psm/backup/psm-backup.zip
→ 复用 BackupData 逻辑，直接覆盖上次备份
→ 无文件对话框

一键还原: API.quickRestore()
→ 固定读取 ~/.psm/backup/psm-backup.zip
→ 复用 RestoreData 逻辑
→ 无文件对话框

备份状态: API.quickBackupInfo()
→ 检查备份文件是否存在
→ 返回 exists/backup_time/file_size
```

**程序家目录切换流程**:
```
用户在设置页点击"更改" → 选择新目录
→ API.setAppHome(newPath)
→ SettingsHandler.SetAppHome:
  → 获取旧 app_home 路径
  → 遍历 skills/ 和 backup/ 目录
  → gofs.MoveEx(src, dst, true) 移动到新位置（跨文件系统支持）
  → 更新 settings 表 app_home 值
→ 前端刷新显示
```

**AI 一键生成提示词流程**:
```
用户点击工具栏"AI 生成"按钮
→ 弹出 AI 生成模态框，输入一句话描述
→ 点击"生成"按钮 → API.generatePrompt(description)
→ AIHandler.GeneratePrompt:
  → 从 settings 读取 ai_generate_prompt（系统提示词）
  → streamChat(systemMsg, userMsg):
    → 从 settings 读取 ai_api_url / ai_api_key / ai_model
    → buildChatURL(apiURL) 拼接 /chat/completions
    → POST 请求（SSE 流式响应）
    → bufio.Scanner 逐行读取 data: 前缀
    → 解析 choices[0].delta.content
    → runtime.EventsEmit("ai:token", content) 推送到前端
    → 结束时 Emit("ai:done")
→ 前端监听 ai:token 事件，累加显示在 textarea 中
→ 完成后解析 JSON，展示可编辑的名称+内容（淡入动画）
→ 按钮文本变为"重新生成"，用户可点击回到输入区并自动触发新一轮生成
→ 用户确认后打开新建表单，预填充 AI 生成结果
```

**AI 优化提示词流程**:
```
用户点击 Prompt 内容旁的"优化"按钮
→ API.optimizePrompt(content) → AIHandler.OptimizePrompt
→ 从 settings 读取 ai_optimize_prompt（系统提示词）
→ streamChat(systemMsg, content) 流式请求
→ 前端监听 ai:token 事件，实时覆盖 textarea 内容
→ textarea 上方显示半透明遮罩（.ai-optimize-loading）
→ 按钮文字从"优化"变为"还原"
→ 用户点击"还原"→ 恢复 originalContent 闭包中的原始内容
```

**AI 获取模型列表流程**:
```
用户点击设置页模型名称旁的"获取模型"按钮
→ 按钮变为旋转动画 + "获取中..."
→ API.getAIModels() → AIHandler.GetAIModels:
  → 从 settings 读取 ai_api_url / ai_api_key
  → buildModelsURL(apiURL) 拼接 /models
  → GET 请求（Authorization: Bearer apiKey）
  → 解析响应 data[].id 列表
→ 弹出下拉列表（.model-dropdown），顶部搜索框可过滤
→ 当前选中模型高亮显示 ✓
→ 支持键盘导航: ↑↓移动高亮 / Enter选择 / Esc关闭
→ 点击模型项或 Enter → 自动填充到输入框
```

**AI 测试连接流程**:
```
用户点击设置页 API 地址旁的"测试连接"按钮
→ 按钮变为旋转动画 + "测试中..."
→ API.testAIConnection(apiURL, apiKey) → AIHandler.TestAIConnection
  → buildModelsURL(apiURL) 拼接 /models
  → GET 请求
  → HTTP 200 → 返回"连接成功"
  → 非 200 → 返回错误（HTTP 状态码）
→ 成功: Toast.success("连接成功")
→ 失败: Toast.error 错误信息
```

**AI 翻译流程**:
```
用户点击侧边栏"翻译"导航项 → 进入翻译模块
→ 渲染左右分栏布局（原文面板 + 分隔线 + 译文面板）
→ 选择源语言/目标语言 → 输入原文 → 点击"翻译"
→ API.translateContent(content, targetLang)
→ AIHandler.TranslateContent:
  → 从 settings 读取 ai_translate_prompt（翻译系统提示词）
  → streamChat(systemMsg, userMsg) 流式请求
  → 分隔线箭头 accent 色脉冲动画
  → 原文框 readOnly 禁止编辑
  → 按钮变为 spinner + "翻译中..." 并禁用
→ 前端监听 ai:token 事件，逐 token 追加到译文 textarea
→ 完成后 Emit("ai:done") → 恢复原文编辑 + 按钮恢复
→ 语言交换按钮：点击旋转 180° 交换源/目标语言
→ 复制/清除按钮：各自操作对应输入框（btn-ghost 样式）
→ 页面入场动画：translateFadeIn（淡入 + 上移）
```

**版本信息注入流程**:
```
构建时: wails build -ldflags "-X gitee.com/MM-Q/verman/gitver.AppName=psm ..."
→ verman 库在构建时注入 Git 版本、提交哈希、构建时间等元数据
→ 运行时: API.getVersion() → app.go GetVersion()
→ 返回 verman.V 的各字段（git_version, git_commit, build_time 等）
→ 前端 app.js showAboutDialog() → 关于弹窗显示版本信息
```

**全局字体大小控制流程**:
```
用户在设置页选择字体大小档位或自定义输入
→ settings.js applyFontSize(offset) → 实时预览
→ 设置保存到数据库 font_size_offset 字段
→ app.js loadSettings() → 应用 CSS 变量 --font-size-offset
→ components.css 所有 font-size 使用 calc(XXpx + var(--font-size-offset))
→ 全局字体大小实时生效
```

**仪表盘全局搜索流程**:
```
用户在仪表盘搜索框输入关键词
→ 300ms 防抖 → 调用 API.searchPrompts 和 API.searchSkills
→ 合并结果 → 生成候选下拉菜单（最多 8 条）
→ 高亮匹配关键词
→ 用户点击候选项 → App.navigate(viewName, highlightId)
→ 跳转到对应模块并闪烁显示
```

**仪表盘置顶内容跳转流程**:
```
仪表盘加载时获取置顶内容
→ API.getPinnedPrompts(3) + API.getPinnedSkills(3)
→ 显示置顶的 Prompt 和 Skill（各最多 3 个）
→ 用户点击某项 → App.navigate(viewName, highlightId)
→ 跳转到对应模块并闪烁显示
```

**跳转闪烁效果流程**:
```
App.navigate(viewName, highlightId) 传递高亮 ID
→ 目标模块 render(container, highlightId) 接收参数
→ highlightItem(highlightId) 查找对应元素
→ 添加 highlight-flash 类 → CSS 动画：红色边框+背景闪烁 3 秒
→ 动画结束后移除类
```

**悬停复制流程**:
```
用户鼠标悬停在 Prompt 卡片/行上
→ mouseenter 事件 → hoveredPromptId = prompt.id
→ 用户按 Ctrl+C → ShortcutManager 捕获
→ copyPromptById(hoveredPromptId) → 复制内容到剪贴板
→ Toast.success("已复制到剪贴板")
→ mouseleave 事件 → hoveredPromptId = null
```

**关于弹窗流程**:
```
用户点击侧边栏 LOGO
→ app.js showAboutDialog() → 弹出关于弹窗
→ 显示版本号、项目简介、项目地址链接
→ 显示快捷键帮助（全局/模块快捷键）
→ 项目地址点击 → window.runtime.BrowserOpenURL 打开系统浏览器
```

**SKILL.md Frontmatter 解析**:
```markdown
---
name: go-kit-core
description: go-kit 项目综合技能...
---

ParseSkillFrontmatter() 提取 → name="go-kit-core", description="go-kit 项目综合技能..."
```

**全局拖拽导入流程**:
```
用户拖入文件到窗口任意位置
→ Wails OnFileDrop 回调触发（useDropTarget=false）
→ 前端过滤出 .zip 文件
→ 单个文件: API.importSkillAuto(path) → ImportSkillAuto
→ 多个文件: API.batchImportSkills(paths) → BatchImportSkills
→ 自动识别格式（PSM 导出格式 / 公共格式）
→ 已存在的技能计入 Skipped 而非 Failed
→ 显示导入结果（成功/已存在数量）
→ 如果不在技能页面则自动跳转，否则刷新列表
```

**日志级别动态设置流程**:
```
应用启动（main.go）:
→ psmlog.Init(logPath) 初始化 fastlog（生产模式，文件输出）
→ SettingsHandler.Init(ctx, settingsSvc) 启动
→ 从 settings 表读取 log_level 配置
→ psmlog.SetLevel(logLevel) 应用日志级别
→ psmlog.Get() 获取全局 Logger 注入到各 Handler/Service

设置页切换日志级别:
→ 渲染分段滑块（.log-level-segments），4 个矩形块：DEBUG/INFO/WARN/ERROR
→ 加载当前级别 API.getLogLevel() → 设置滑块高亮位置
→ 用户点击/拖动分段块 → updateHighlight 移动高亮背景
→ 用户点击"保存设置" → API.setLogLevel(level)
→ SettingsHandler.SetLogLevel:
  → psmlog.SetLevel(level) 动态调整运行时日志级别
  → settingsSvc.UpdateSetting("log_level", level) 持久化到数据库
→ 下次启动时自动恢复上次设置的级别
```

---

## 六、技术栈评估

### 核心技术栈

| 层级 | 技术 | 版本 | 评价 |
|------|------|------|------|
| 桌面框架 | Wails | v2.11.0 | ✅ 适合轻量级 Go+Web 桌面应用，社区活跃 |
| 后端语言 | Go | 1.25.0 | ✅ 最新稳定版，性能优秀 |
| 前端 | HTML + CSS + JS | 原生 | ✅ 零依赖，加载快，适合小型工具 |
| 数据库 | SQLite (glebarez/sqlite + GORM) | v1.11.0 + v1.31.1 | ✅ 纯 Go 实现（modernc.org/sqlite 底层），无需 CGO，GORM AutoMigrate 自动建表 |
| 压缩 | archive/zip | 标准库 | ✅ 原生支持，无额外依赖 |
| WebView | go-webview2 | v1.0.22 | ✅ Windows 下使用 Edge WebView2 |
| 版本管理 | verman | v0.0.19 | ✅ 构建时版本注入，轻量简洁 |

### 技术栈适配性分析

| 维度 | 评价 |
|------|------|
| 项目规模匹配 | ✅ 小型工具项目，技术栈简洁无过度设计 |
| 部署便捷性 | ✅ 单个 exe 文件，无外部依赖 |
| 跨平台支持 | ✅ Wails 支持 Windows/macOS/Linux |
| 前端选型 | ✅ 原生三件套适合此规模，避免了 React/Vue 的构建复杂度 |
| 数据库选型 | ✅ modernc.org/sqlite 纯 Go 无需 CGO，避免了交叉编译问题 |
| 版本管理 | ✅ verman 通过 ldflags 注入，不增加运行时开销 |

### 依赖数量

- 直接依赖: 7 个（wails/v2, glebarez/sqlite, gorm.io/gorm, modernc.org/sqlite, verman, golang.org/x/text, gitee.com/MM-Q/go-kit）
- 间接依赖: ~30 个（均为 Wails 框架传递依赖）
- 总体评价: ✅ 依赖精简，攻击面小，零 CGO 依赖

---

## 七、补充分析

### 代码规范

| 维度 | 状态 | 说明 |
|------|------|------|
| 命名规范 | ✅ | Go: 驼峰命名；JS: camelCase；SQL: snake_case |
| 注释规范 | ✅ | 所有导出函数有中文注释，遵循 godoc 格式 |
| 代码风格 | ✅ | Go: gofmt 格式化；CSS: CSS 变量系统 |
| CSS 组织 | ✅ | 三文件拆分：variables / layout / components |
| 提交规范 | ✅ | Conventional Commits（.trae/rules/ 已配置） |
| 代码质量 | ✅ | golangci-lint 零告警（errcheck + staticcheck 全部通过） |

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
| 新增前端组件 | ⭐⭐⭐⭐⭐ | 在 components/ 加 JS 文件，index.html 引入，模式统一 |
| 新增设置项 | ⭐⭐⭐⭐⭐ | settings 表 INSERT OR IGNORE，前端表单加字段 |
| 新增主题 | ⭐⭐⭐⭐⭐ | variables.css 加 `[data-theme="xxx"]` 选择器，settings.js 加下拉选项 |
| 数据库迁移 | ⭐⭐⭐⭐ | GORM AutoMigrate 自动建表/加列，开发阶段删库重建即可 |
| 插件系统 | ⭐⭐ | 无插件架构，扩展需修改核心代码 |

### 性能关键点

| 关注点 | 状态 | 说明 |
|--------|------|------|
| SQLite 查询 | ✅ | 已启用 WAL 模式，支持并发读 |
| 列表查询 | ✅ | 按需 LIMIT，无全表扫描风险 |
| ZIP 操作 | ⚠️ | 大文件解压可能阻塞，当前为同步操作 |
| 前端渲染 | ✅ | 列表数据量小，无虚拟滚动需求 |
| 脚本加载 | ✅ | 已实现 loadedScripts 去重，避免重复加载 |
| 版本信息 | ✅ | 构建时注入，零运行时开销 |

---

## 八、数据库设计

### ER 关系

```
settings (KV 存储)
├── app_home: ~/.psm                      (程序家目录，skills/backup 跟随此路径)
├── app_theme: light/dark/midnight/ocean/forest/sunset/auto  (默认 light)
├── prompt_view_mode: card/list      (默认 card)
├── skill_view_mode: card/list       (默认 card)
├── sidebar_collapsed: true/false
├── font_size_offset: 0px            (全局字体大小偏移)
├── font_family: Space Grotesk       (全局字体族)
├── ai_api_url: https://api.openai.com/v1  (AI API 基础路径)
├── ai_api_key:                     (AI API 密钥)
├── ai_model: gpt-4o-mini           (AI 模型标识)
├── ai_generate_prompt: ...         (AI 生成系统提示词)
├── ai_optimize_prompt: ...         (AI 优化提示词系统提示词)
├── ai_optimize_name: ...           (AI 优化名称系统提示词)
└── ai_optimize_description: ...    (AI 优化描述系统提示词)

prompts (独立表)
├── id (PK, AUTO_INCREMENT)
├── name, content, category
├── tags (JSON 数组字符串)
├── is_pinned (DEFAULT 0)
├── is_template (DEFAULT 0)
├── usage_count (DEFAULT 0，GORM gorm:"default:0")
├── created_at, updated_at (time.Time)
├── deleted_at (软删除索引)
└── 索引: category, updated_at

skills (独立表 + 文件系统)
├── id (PK, AUTO_INCREMENT)
├── name, description, tags (JSON 数组字符串)
├── relative_path → 拼接 app_home/skills 得到绝对路径
├── is_pinned (DEFAULT 0)
├── created_at, updated_at (time.Time)
├── deleted_at (软删除索引)
└── 索引: updated_at
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

1. **程序家目录可配置**: 新增 `app_home` 设置项（默认 `~/.psm/`），Skill 和备份跟随此目录，切换时自动迁移
2. **存储分离设计**: 数据库永远固定在 `~/.psm/data.db`，Skill 和备份跟随 `app_home`
3. **一键备份还原**: 固定路径 `app_home/backup/psm-backup.zip`，点击即备份/还原，无需选择文件
4. **SKILL.md 规范**: 导入时校验 SKILL.md 存在性，解析 YAML frontmatter 自动填充元数据；编辑时同步更新 frontmatter（仅修改头部区域，保留正文）
5. **Skill 导出双格式**: 单个 Skill 导出标准格式（SKILL.md 在 ZIP 根目录）；多个 Skill 导出 PSM 格式（`.psm-skill-export` 标识文件 + 技能目录）
6. **双格式自动导入**: 自动识别导出格式（标识文件）和公共格式（SKILL.md），统一入口 `importSkillAuto`
7. **零前端框架**: 原生 HTML/CSS/JS，Flat Design 设计系统，Space Grotesk 字体
8. **CSS 三文件拆分**: variables.css（变量/6 种主题/全局字体偏移）、layout.css（布局）、components.css（组件），职责清晰
9. **纯 Go SQLite + GORM**: glebarez/sqlite（底层 modernc.org/sqlite）+ GORM ORM，无需 CGO，单 exe 部署，AutoMigrate 自动建表
10. **6 种主题系统**: CSS 变量驱动（light/dark/midnight/ocean/rose/lavender），支持跟随系统，设置持久化到数据库
11. **卡片视图右键菜单**: 卡片/表格行右键弹出操作菜单（查看/编辑/导出/删除），替代固定按钮，界面更简洁
12. **批量管理模式**: 工具栏"批量管理"按钮触发，底部操作栏 + 全选 + 退出管理，非批量时界面无复选框干扰
13. **默认卡片视图**: Prompt 和 Skill 模块默认使用卡片视图（可通过设置切换）
14. **仪表盘交互**: 统计卡片可点击跳转到对应模块，置顶内容模块（Prompt/Skill 各最多 3 个），全局搜索框（300ms 防抖，候选下拉菜单）
15. **导出后清空选中**: 两个模块导出完成后自动清空 selectedIds 和复选框 UI
16. **构建时版本注入**: 通过 verman 库 + `-ldflags -X` 在构建时注入版本元数据，关于弹窗展示版本号
17. **全局拖拽导入**: 基于 Wails `OnFileDrop` API，支持拖入 ZIP 文件直接导入技能，已存在的技能自动跳过并提示
18. **快捷键系统**: ShortcutManager 管理全局快捷键（Ctrl+N/F/S/Esc/1-5/?）和模块快捷键（Delete/Ctrl+A/D）
19. **Prompt 字符计数**: 新建/编辑 Prompt 时实时显示字符数，查看详情时显示总字符数
20. **数据统计与清理**: 数据管理页显示 Prompt/Skill 数量和数据库大小，支持检测并清理孤立 Skill 数据
21. **搜索防抖**: 搜索输入框 100ms 防抖，减少不必要的 API 调用
22. **标签搜索与筛选**: 搜索时匹配标签字段，点击标签自动填入搜索框筛选
23. **Handler 嵌入模式**: app.go 按领域拆分为 SettingsHandler/PromptHandler/SkillHandler/BackupHandler，通过结构体嵌入到 App
24. **数据库索引**: 为 prompts(category, updated_at) 和 skills(updated_at) 添加索引
25. **置顶功能**: Prompt 和 Skill 支持置顶，置顶项优先排列
26. **搜索高亮**: 搜索结果中关键词以红色加粗显示
27. **模板变量系统**: Prompt 支持 `{{变量名}}` / `{{变量名|默认值}}` 占位符，启用模板后复制时弹窗填写变量，支持中文变量名，默认值留空时自动填充
28. **全局字体大小控制**: 设置页字体大小选择器（5 个预设档位 + 自定义输入），CSS 变量 `--font-size-offset` 控制全局
29. **设置页分组卡片布局**: 外观/存储分组卡片，现代化视觉效果
30. **关于弹窗**: 侧边栏 LOGO 点击触发，显示版本号、项目地址、快捷键帮助
31. **仪表盘置顶内容模块**: 显示置顶的 Prompt 和 Skill（各最多 3 个），点击跳转并闪烁
32. **仪表盘全局搜索框**: 替代最近更新，300ms 防抖，候选下拉菜单（最多 8 条）
33. **跳转闪烁效果**: 从仪表盘跳转后目标项红色边框+背景闪烁 3 秒
34. **UI 阴影系统**: 5 级阴影（sm/md/lg/xl/2xl），卡片悬停效果
35. **动画效果系统**: 3 级过渡（fast/normal/slow），模态框滑入动画，列表项入场动画
36. **悬停复制**: 鼠标悬停在 Prompt 上时按 Ctrl+C 可复制内容
37. **全局字体族设置**: 设置页字体族选择器（系统字体列表 + 搜索过滤 + 键盘导航），CSS 变量 `--font-family` 控制全局，自动滚动到选中项
38. **搜索框键盘导航**: 仪表盘搜索框支持上下键移动高亮、回车选择、Esc 关闭
39. **数据重置功能**: 数据管理页"重置所有数据"按钮，二次确认后清空所有提示词、技能（含文件）、恢复默认设置
40. **工具栏布局优化**: 工具栏按钮保持一行显示，不因导航栏展开而换行
41. **点击动画反馈**: 卡片/行/统计卡片/置顶内容/搜索候选项使用 CSS `:active` 伪类实现按下瞬间缩放反馈
42. **Skill 详情弹窗**: 简洁信息流布局，无卡片边框，分隔线区分区块，双击文件可在文件管理器打开
43. **文件列表右键菜单**: 文件：打开文件/打开所在目录/复制路径；目录：打开目录/复制路径
44. **后端文件操作**: `RevealInExplorer`（打开文件管理器）+ `OpenFile`（用系统默认程序打开文件）
45. **Skill 标签系统**: Skill 模型新增 tags 字段（JSON 数组），支持标签筛选、搜索匹配、ZIP 导入导出保留标签（通过 .psm-skill-export 标识文件存储）
46. **批量操作增强**: 批量管理模式下"更多操作"下拉菜单，支持 Prompt 批量修改分类/添加移除标签/置顶取消置顶，Skill 批量添加移除标签/置顶取消置顶
47. **DropdownMenu 组件**: 新增下拉菜单组件，跟随 ContextMenu 模式，自动边界检测，点击外部/滚动关闭
48. **parseTags 工具函数**: app.js 新增统一标签解析函数，处理 null/"null"/"[]"/数组等所有情况，避免前端崩溃
49. **AI 翻译模块**: 独立侧边栏导航（快捷键 4），左右分栏布局（原文/译文面板），流式翻译接收，6 种常用语言选择，语言交换按钮旋转动画
50. **翻译模块动画**: translateFadeIn 页面入场（淡入+上移）、语言交换弹性旋转（cubic-bezier(0.34,1.56,0.64,1)）、分隔线箭头脉冲动画、翻译按钮按压缩放反馈
51. **btn-ghost 样式**: 透明背景 + `var(--border)` 边框 + `var(--text-secondary)` 文字色，hover 时 accent 色边框+背景，用于翻译模块复制/清除按钮
52. **翻译模块字体**: textarea 使用 `calc(14px + var(--font-size-offset))` + `font-family: inherit`，panel-label 使用 `calc(12px + var(--font-size-offset))`，完全跟随全局字体设置
53. **翻译输入框背景**: textarea 使用 `var(--bg-page)` 背景色与面板 `var(--bg-surface)` 区分，聚焦时左侧 3px accent 色边框指示
54. **程序家目录迁移**: 使用 `gofs.MoveEx(src, dst, true)` 替代自定义 copyDir，支持跨文件系统移动，附操作日志记录
55. **孤立技能检测增强**: 检查目录不存在 OR 目录存在但缺少 SKILL.md 文件，均视为孤立数据
56. **孤立技能清理增强**: 删除数据库记录时同时清理磁盘残留目录（`os.RemoveAll`），失败仅 warn 不阻塞
57. **分类组合框**: Prompt 新建/编辑/AI生成模态框的分类输入改为 input + 下拉选择组合框（`.category-combo`），支持输入新分类或选择已有分类
58. **分类下拉键盘导航**: 分类下拉列表支持 ↑↓ 移动高亮 / Enter 选择 / Esc 关闭，复用 `.model-dropdown-item.highlight` 样式
59. **分类列表实时刷新**: 新建/编辑/AI生成提示词成功后自动调用 `loadCategories()` 刷新搜索栏分类下拉

---

## 十、待优化点

| 优先级 | 问题 | 建议 | 状态 |
|--------|------|------|------|
| P1 | app.go 方法过多（40+） | 按领域拆分为 Handler | ✅ 已完成 |
| P2 | 无数据库版本化迁移 | ~~引入 goose 或自实现版本号 + ALTER TABLE~~ 已引入 GORM AutoMigrate | ✅ 已完成 |
| P2 | 无单元测试 | 为 service 层和 utils 层补充测试 | 待定 |
| P2 | Skill 导入为同步操作 | 大 ZIP 文件可考虑异步 | 暂缓（收益低） |
| P3 | 前端无骨架屏 | 加载时显示 loading 动画，提升体验 | 待定 |
| P3 | 无国际化支持 | 当前仅中文硬编码 | 待定 |

---

## 十一、关键记忆点

1. **数据库路径**: `~/.psm/data.db`（SQLite，WAL 模式），永远固定不迁移，GORM AutoMigrate 自动建表
2. **GORM 全局实例**: `db.DB` 全局变量，Service 层空结构体通过 `db.DB` 直接操作数据库，构造函数无需 `*sql.DB` 参数
3. **GORM 驱动**: `github.com/glebarez/sqlite`（纯 Go，无 CGO），底层基于 `modernc.org/sqlite`，seed 脚本直接使用 `modernc.org/sqlite`
4. **GORM 模型标签**: `gorm:"primaryKey;autoIncrement"`、`gorm:"not null;default:xxx"`、`gorm:"type:text"`、`gorm:"index"`（软删除）
5. **GORM 软删除**: 模型含 `DeletedAt gorm.DeletedAt`，硬删除用 `db.DB.Unscoped().Delete()`
6. **程序家目录**: `app_home` 设置项（默认 `~/.psm/`），Skill（`app_home/skills/`）和备份（`app_home/backup/`）跟随此路径
7. **一键备份**: 固定路径 `app_home/backup/psm-backup.zip`，每次覆盖，无文件对话框
8. **SKILL.md 规范**: YAML frontmatter 格式，`---\nname: xxx\ndescription: xxx\n---`
9. **Skill 导出双格式**: 单个 Skill → 标准格式（`ZipDir`）；多个 Skill → PSM 格式（`.psm-skill-export` + 技能目录）
10. **Skill 导入双格式**: 有标识文件 → 批量导入（`ImportSkillFromExportZip`）；无标识文件 → 单个导入（`ImportSkill`），均通过 `ImportSkillAuto` 统一入口
11. **SKILL.md 编辑同步**: `UpdateSkillFrontmatter` 仅替换 frontmatter 区域，不覆盖正文；文件不存在时自动创建
12. **前端 ID 处理**: HTML data-id 是字符串，api.js 中所有 id 参数用 `Number()` 转换
13. **Go 空切片**: 所有返回前端的切片必须初始化为 `[]Type{}`，否则 JSON 输出 `null`
14. **构建命令**: `wails dev`（开发）/ `wails build`（生产）/ `go run tools/seed/main.go`（测试数据）
15. **设计系统**: Flat Design，5 级阴影系统，3 级动画效果，Space Grotesk 字体，SVG 图标
16. **CSS 三文件**: `variables.css`（变量/主题定义）、`layout.css`（布局）、`components.css`（组件样式）
17. **前端路由**: app.js loadScript 去重机制，防止 const 重复声明
18. **批量管理模式**: `batchMode` 状态 + `.batch-mode` CSS 类切换，checkbox 默认隐藏，批量操作栏 `order:1` 固定底部，含"更多操作"下拉菜单（修改分类/添加移除标签/置顶取消置顶）
19. **右键菜单**: `ContextMenu` 组件，`show(x, y, items)` API，自动边界检测，点击外部/滚动自动关闭
20. **仪表盘导航**: 统计卡片通过 `data-view` 属性 + `App.navigate()` 实现点击跳转
21. **版本信息**: verman 库构建时注入，前端 `loadVersion()` 展示，未注入时显示 "dev"
22. **6 种主题**: light/dark/midnight/ocean/rose/lavender + auto（跟随系统），均在 variables.css 定义
23. **golangci-lint**: errcheck + staticcheck 全部通过
24. **全局拖拽导入**: Wails `EnableFileDrop: true` + `OnFileDrop(callback, false)`
25. **快捷键管理**: `ShortcutManager` 对象，`registerView(name, shortcuts)` 注册模块快捷键
26. **数据统计 API**: `GetDataStats` 返回 `{prompt_count, skill_count, db_size}`
27. **Handler 嵌入模式**: app.go 4 个 Handler 文件通过结构体嵌入提供方法
28. **置顶功能**: `is_pinned` 字段，排序 `is_pinned DESC, updated_at DESC`，TogglePin 用 GORM Updates 切换
29. **搜索高亮**: `highlightText(text, keyword)` 函数，`<mark>` 标签红色加粗显示
30. **全局字体偏移**: CSS 变量 `--font-size-offset`，所有 `font-size` 使用 `calc(XXpx + var(--font-size-offset))`
31. **关于弹窗**: `app.js showAboutDialog()` 显示版本号、项目地址、快捷键帮助
32. **仪表盘全局搜索**: 300ms 防抖，候选下拉菜单最多 8 条
33. **跳转闪烁**: `App.navigate(viewName, highlightId)` 传递 ID，3 秒动画
34. **悬停复制**: `hoveredPromptId` 追踪悬停 ID，Ctrl+C 快捷键复制内容到剪贴板
35. **模板变量格式**: `{{变量名}}` / `{{变量名|默认值}}`，支持中文变量名
36. **数据重置 API**: `ResetAllData` 方法，清空 prompts + skills 文件 + skills 表 + 重置 settings
37. **二次确认保护**: 数据重置操作需要两次确认，防止误操作
38. **点击动画**: CSS `:active` 伪类实现按下瞬间缩放（`transform: scale(0.98)`）
39. **Skill 详情弹窗**: 简洁信息流布局，分隔线区分区块
40. **后端文件操作**: `RevealInExplorer(path)` + `OpenFile(path)`
41. **Prompt 使用统计**: `usage_count` 字段，复制/查看详情时调用 `IncrementPromptUsage`，仪表盘显示常用提示词
42. **GORM 错误处理**: `gorm.ErrRecordNotFound` 替代 `sql.ErrNoRows`，`fmt.Errorf` 包装上下文
43. **GORM 空结构体模式**: Service 层用空结构体 + 方法接收者，通过 `db.DB` 全局实例操作数据库
44. **GORM 事务**: `db.DB.Transaction(func(tx *gorm.DB) error { ... })` 用于批量操作（如重置设置）
45. **GORM 链式查询**: `db.DB.Where().Order().Limit().Find()` 链式调用替代原生 SQL 拼接
46. **GORM 原子更新**: `db.DB.Model().Update("field", value)` 或 `Updates(map[string]interface{}{})` 替代 CASE WHEN SQL
47. **GORM 批量删除**: `db.DB.Unscoped().Delete(&Type{}, ids)` 硬删除指定 ID 列表
48. **GORM 空切片**: `Count()` 返回 `int64`，Handler 层相应调整返回类型为 `(int64, error)`
49. **Skill 标签存储**: Skill.tags 字段为 JSON 数组字符串，ZIP 导入导出通过 `.psm-skill-export` 标识文件保留标签
50. **批量操作后端**: PromptHandler/BatchUpdateCategory/BatchAddTags/BatchRemoveTags/BatchSetPin，SkillHandler/BatchAddSkillTags/BatchRemoveSkillTags/BatchSetPinSkill（避免 Wails 绑定同名冲突）
51. **DropdownMenu 组件**: `DropdownMenu.show(x, y, items)` API，items 支持 `{label, action, separator}` 格式
52. **parseTags 函数**: `parseTags(tagsValue)` 统一处理 null/"null"/"[]"/数组，返回安全数组
53. **批量操作下拉菜单**: "更多操作"按钮位于批量操作栏右侧，点击弹出 DropdownMenu，包含修改分类/添加标签/移除标签/置顶/取消置顶
54. **AI Handler**: `internal/handler/ai.go`，AIHandler 结构体嵌入 App，通过 `Init(ctx, settingsSvc)` 初始化
55. **AI 流式通信**: Go 端 `runtime.EventsEmit("ai:token", content)` → JS 端 `window.runtime.EventsOn("ai:token", callback)`
56. **AI URL 拼接**: API 地址只需配置基础路径（如 `/v1`），后端 `buildChatURL` 拼接 `/chat/completions`，`buildModelsURL` 拼接 `/models`
57. **AI 取消机制**: `context.WithCancel` + `h.cancelFunc` 引用，`CancelAIGeneration()` 调用 cancel 终止 HTTP 请求
58. **AI 模型列表**: `GetAIModels()` 请求 `/v1/models` 端点，返回 `[]string` 模型 ID 列表
59. **AI 测试连接**: `TestAIConnection(apiURL, apiKey)` 接收前端输入的值（非从库读取），请求 `/v1/models` 验证
60. **默认设置函数**: `db.DefaultSettings(appHome string) []Settings` 在 models.go 中定义，gorm 初始化和 settings 重置都引用
61. **备份结构体字段**: `BackupPrompt` 含 Name/Content/Category/Tags/IsPinned/IsTemplate/UsageCount；`BackupSkill` 含 Name/Description/RelativePath/Tags/IsPinned
62. **备份恢复精确去重**: 使用 `db.DB.Where("name = ?", name).Count()` 精确匹配，不再用 `GetPrompts` 的 LIKE 查询
63. **Skill PSM 导出格式**: `.psm-skill-export` 标识文件 JSON 包含 `skills`（map[name][]tags）和 `pinned`（[]name）
64. **Prompt JSON 导入**: Tags 直接使用 `p.Tags`（已是 JSON 字符串），不再 `MustMarshalJSON`；保留 UsageCount/CreatedAt/UpdatedAt
65. **仪表盘隐藏滚动条**: `#view-container > .view-content` 子元素选择器精确匹配，不影响其他视图
66. **AI 三种优化 API**: `OptimizePrompt`（内容）、`OptimizeName`（名称）、`OptimizeDescription`（描述），各自独立系统提示词
67. **AI 系统提示词配置项**: `ai_generate_prompt`（生成）、`ai_optimize_prompt`（优化内容）、`ai_optimize_name`（优化名称）、`ai_optimize_description`（优化描述），共 4 个
68. **bindOptimizeButton 参数化**: `(btnId, fieldId, apiMethod)` 第三个参数可选，默认 `API.optimizePrompt`
69. **全局输入框背景色**: `.form-input/.form-select/.form-textarea` 统一 `var(--bg-page)`，与 `var(--bg-surface)` 白色背景区分
70. **优化按钮位置**: `:has(.form-input)` 区分 input（垂直居中）和 textarea（右下角），`.btn-ai-optimize` 默认右下角
71. **api.js updateSkill**: 必须传 4 个参数 `(id, name, description, tags)`，Wails 严格校验参数数量
72. **备份恢复全面审查**: 5 个 BUG（Tags 双重编码/UsageCount 丢失/时间戳丢失/LIKE 模糊去重/Skill IsPinned 丢失）+ 1 个设计缺陷已修复
66. **AI 一键生成提示词**: 设置页配置 API 地址/Key/模型，Prompt 管理页工具栏"AI 生成"按钮，输入一句话描述→流式生成→审查名称+内容→确认使用
67. **AI 优化提示词**: Prompt 新建/编辑模态框内容标签旁"优化"按钮，流式覆盖 textarea，支持还原，textarea 遮罩动画
68. **AI 系统提示词可配置**: 设置页 AI 分组中配置生成/优化系统提示词，存入数据库 settings 表
69. **AI 模型列表获取**: 设置页模型名称旁"获取模型"按钮，调用 `/v1/models` 端点，弹出下拉列表+搜索过滤
70. **AI 测试连接**: 设置页 API 地址旁"测试连接"按钮，请求 `/v1/models` 验证连通性
71. **AI 流式架构**: Go→JS 通过 Wails Events（`ai:token`/`ai:done`/`ai:error`）推送，context.WithCancel 实现请求取消
72. **默认设置统一管理**: `db.DefaultSettings(appHome)` 函数统一定义默认设置，gorm 初始化和 settings 重置都引用此函数
73. **备份恢复字段完整**: BackupPrompt 含 IsPinned/IsTemplate/UsageCount，BackupSkill 含 IsPinned，恢复时完整还原
74. **Prompt JSON 导入修复**: Tags 不再双重编码，UsageCount/CreatedAt/UpdatedAt 完整保留
75. **备份恢复精确去重**: Prompt 恢复时使用 `WHERE name = ?` 精确匹配，不再使用 LIKE 模糊匹配
76. **Skill PSM 格式保留置顶**: `.psm-skill-export` 标识文件新增 `pinned` 字段，导入时恢复 IsPinned 状态
77. **仪表盘滚动条隐藏**: `#view-container > .view-content` 子元素选择器精确匹配仪表盘滚动容器
78. **AI 名称优化**: `OptimizeName` 方法 + `ai_optimize_name` 系统提示词，20 字以内中文命名
79. **AI 描述优化**: `OptimizeDescription` 方法 + `ai_optimize_description` 系统提示词，50 字以内中文描述
80. **优化按钮覆盖所有模态框**: Prompt 三个模态框名字 + Skill 编辑模态框名字和描述，均带 AI 优化按钮
81. **bindOptimizeButton 参数化**: 第三个参数 `apiMethod` 区分不同优化 API（optimizeName/optimizeDescription/optimizePrompt）
82. **全局输入框背景色**: `.form-input/.form-select/.form-textarea` 统一使用 `var(--bg-page)` 背景色
83. **优化按钮位置区分**: `:has(.form-input)` 选择器让 input 按钮垂直居中，textarea 按钮右下角
84. **api.js updateSkill 修复**: 补充缺失的 `tags` 参数，修复 Skill 保存时参数数量不匹配错误
85. **AI 生成重新生成功能**: AI 生成提示词模态框生成完成后，"生成"按钮文本变为"重新生成"，点击后恢复输入区并自动触发新一轮生成（无需手动再点），按钮文本恢复为"生成"
86. **模型下拉键盘导航**: 设置页"获取模型"下拉列表支持 ArrowUp/ArrowDown/Enter/Escape 键盘操作，`modelIndex` 追踪高亮索引，`.highlight` CSS 类标记当前项，搜索过滤和打开下拉时自动重置索引
87. **优化按钮空值提示修复**: `bindOptimizeButton` 空值提示从"请先输入提示词内容"改为"请先输入内容"，适配名称/内容/描述等多种优化场景
88. **后端日志系统**: `internal/log/log.go` 封装 fastlog，提供 `Init/Get/Close/SetLevel/GetLevel`，Handler/Service 通过 `psmlog.Get()` 获取全局 Logger
89. **日志级别动态设置**: `fastlog.SetLevel()` 支持运行时调整，settings 表 `log_level` 持久化配置，启动时从数据库加载恢复
90. **日志级别分段滑块**: 设置页日志级别使用分段滑块（`.log-level-segments`），4 个矩形块（DEBUG/INFO/WARN/ERROR），支持点击和拖动切换，`segments-highlight` 滑动背景动画
91. **日志级别持久化**: `log_level` 存储在 settings 表（KV 模式），默认值 `WARN`，`db.DefaultSettings()` 统一管理
92. **日志级别保存时机**: 选择分段滑块不立即保存，仅更新 UI；点击"保存设置"按钮时统一调用 `API.setLogLevel()` 保存
93. **全模块日志覆盖**: Handler 层（settings/prompt/skill/backup/ai）、Service 层（settings/prompt/skill）、DB 初始化（gorm.go）均有 INFO/WARN/ERROR 级别日志
94. **Skill 导入 ZIP 格式校验**: `HasSkillMD` 和 `GetSkillMetadataFromZip` 校验 SKILL.md 必须在 ZIP 根目录（`filepath.Dir(file.Name) == "."`），防止嵌套目录误匹配
95. **前端双重 toast 修复**: API.call 已 Toast.error，app.js drop handler catch 中重复 Toast.error 改为 console.error，避免重复提示
96. **AI 翻译 Handler**: `TranslateContent(content, targetLang string) error`，复用 `streamChat` 流式架构，`currentAction = "translate"` 标识当前操作
97. **AI 翻译前端 API**: `API.translateContent(text, lang)` 封装 `window.go.main.App.TranslateContent`
98. **AI 翻译提示词配置**: `ai_translate_prompt` 设置项，设置页 AI 分组 textarea 配置，`db.DefaultSettings()` 统一管理
99. **翻译模块路由**: app.js `navMap` 新增 `'4': 'translate'`，switch case `'translate'` 加载 translate.js
100. **翻译模块侧边栏**: index.html 新增翻译导航项（SVG 翻译图标），快捷键 `4` 跳转
101. **翻译语言列表**: 简体中文/English/日本語/한국어/Deutsch/Français，select 下拉选择
102. **翻译模块 CSS 动画**: `translateFadeIn`（页面入场）、`translateArrowPulse`（分隔线脉冲）、`#translate-swap-btn` 弹性旋转、`#translate-btn:active` scale(0.97)
103. **btn-ghost 样式定义**: `background: transparent; color: var(--text-secondary); border: 1px solid var(--border);`，hover 时 `border-color: var(--accent); color: var(--accent); background: var(--accent-light);`
104. **翻译 textarea 聚焦**: 左侧 3px transparent→accent 边框过渡，不使用背景色变化
105. **翻译 textarea 背景**: `var(--bg-page)` 与面板 `var(--bg-surface)` 区分层次
106. **go-kit/fs 依赖**: `gitee.com/MM-Q/go-kit/fs` 包，提供 `MoveEx` 跨文件系统移动、`Exists` 路径存在检查
107. **SetAppHome 迁移方式**: `gofs.MoveEx(src, dst, true)` 第三个参数 true 表示覆盖目标已存在文件，替代自定义 copyDir
108. **孤立技能 SKILL.md 校验**: `GetOrphanSkills` 先检查目录是否存在，再检查 SKILL.md 是否存在，任一缺失即为孤立
109. **孤立技能清理磁盘**: `CleanupOrphanSkills` 删除 DB 记录后遍历删除残留目录，`os.RemoveAll` 失败仅 warn 日志不阻塞
110. **前端双重 toast 修复**: API.call 已 Toast.error，app.js drop handler catch 中重复 Toast.error 改为 console.error
111. **翻译按钮 spinner**: 使用 `.btn-spinner` CSS 类（14px 白色边框旋转圆圈），`animation: spin 0.6s linear infinite`
112. **翻译模块 readonly 样式**: textarea readonly 时背景保持 `var(--bg-page)`，无透明度变化
113. **版本号重复 v 修复**: app.js `showAboutDialog` 中 `v${escapeHtml(version)}` 改为 `${escapeHtml(version)}`，因为 verman 的 `git_version` 已自带 v 前缀
114. **分类组合框结构**: `.category-combo`（position:relative）包裹 `#prompt-category-input` + `#category-dropdown`（`.model-dropdown`），三个模态框（新建/AI生成/编辑）均使用
115. **分类组合框逻辑**: `bindCategoryCombo()` 方法，focus 时显示全部分类，input 时实时过滤，mousedown 选择，keydown 键盘导航（ArrowUp/Down/Enter/Escape），document mousedown 关闭
116. **分类刷新时机**: 新建/编辑/AI生成成功后先 `loadCategories()` 再 `loadPrompts()`，确保搜索栏分类下拉即时更新
