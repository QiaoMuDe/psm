# PSM (Skill & Prompt Manager) 项目分析报告

> 版本: 2.7.0 | 更新日期: 2026-05-31 | 分析人: AI 架构师

---

## 一、项目概述

**项目名称**: PSM — Skill & Prompt Manager
**核心定位**: 基于 Wails v2 的跨平台桌面应用，用于统一管理 AI 开发中的 Skill（技能包）和 Prompt（提示词）
**核心业务场景**:
- Prompt 的增删改查、分类筛选、搜索（含标签匹配+高亮）、JSON 选择性导入导出、置顶、模板变量（`{{变量名}}`占位符）
- Skill 的元数据管理 + 文件系统存储（ZIP 批量导入导出、SKILL.md frontmatter 解析与同步）
- 数据管理（完整备份恢复、数据统计、孤立数据清理、数据重置、数据目录快捷打开）
- 系统设置（存储路径配置、6 种主题切换、侧边栏收起持久化、全局字体大小控制、全局字体族设置）
- 仪表盘数据概览（统计卡片可点击跳转、置顶内容模块、全局搜索框）
- 全局拖拽导入（支持拖入 ZIP 文件直接导入技能）
- 快捷键系统（全局快捷键 + 模块快捷键 + 悬停复制）
- 关于弹窗（版本号、项目地址、快捷键帮助）

---

## 二、目录结构梳理

```
psm/
├── main.go                          # Wails 应用入口，配置窗口/生命周期/前端资源嵌入/文件拖拽
├── app.go                           # App 主结构体，嵌入 Handler，仅保留结构体定义+生命周期
├── go.mod / go.sum                  # Go 模块定义与依赖锁定
├── wails.json                       # Wails 框架配置（应用名、版本、构建选项）
├── .gitignore                       # Git 忽略规则（exe/vendor/db/IDE/OS 等）
├── AGENTS.md                        # 本分析报告
│
├── internal/                        # 后端核心业务代码（Go 标准 internal 包结构）
│   ├── handler/                     # Handler 子包（按领域拆分，嵌入到 App）
│   │   ├── settings.go              # SettingsHandler：设置/版本/文件对话框/文件操作（17 方法）
│   │   ├── prompt.go                # PromptHandler：Prompt CRUD/导入导出/置顶（13 方法）
│   │   ├── skill.go                 # SkillHandler：Skill CRUD/ZIP 导入导出/置顶（15 方法）
│   │   └── backup.go                # BackupHandler：备份恢复/数据统计/孤立清理（5 方法）
│   ├── db/
│   │   ├── models.go                # 数据模型：Settings/Prompt/Skill/SkillFile(含full_path)/ImportResult/DashboardStats
│   │   └── sqlite.go                # SQLite 初始化：WAL 模式、建表迁移、默认设置插入、索引创建
│   ├── service/
│   │   ├── settings.go              # 设置服务：Get/Update/BatchUpdate/GetSkillStoragePath
│   │   ├── prompt.go                # Prompt 服务：CRUD + 搜索筛选(含tags) + 分类查询 + 选择性 JSON 导入导出 + 置顶
│   │   └── skill.go                 # Skill 服务：CRUD + 批量删除 + 双格式 ZIP 导入导出 + 文件列表 + 置顶
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
│   │   └── components.css           # 组件样式：卡片/按钮/表单/表格/标签/模态框/Toast/批量栏/右键菜单/模板变量/关于弹窗/设置分组/仪表盘搜索/置顶内容/跳转闪烁/动画效果/点击动画/Skill详情弹窗
│   └── js/
│       ├── api.js                   # Wails 绑定封装层：统一错误处理 + Number(id) 类型转换 + 获取置顶内容 + 文件操作
│       ├── app.js                   # SPA 路由 + 脚本懒加载 + 主题初始化 + ContextMenu 初始化 + highlightText 工具函数 + 全局字体偏移 + 关于弹窗 + 模板变量函数 + 跳转高亮
│       ├── components/
│       │   ├── toast.js             # Toast 消息组件（success/error/warning/info + SVG 图标）
│       │   ├── modal.js             # 模态框组件（打开/关闭/内容填充）
│       │   ├── confirm.js           # 确认对话框组件（Promise-based）
│       │   └── context-menu.js      # 右键菜单组件（动态菜单项/自动定位/点击外部关闭/支持弹窗环境）
│       └── views/
│           ├── dashboard.js         # 仪表盘：可点击统计卡片 + 置顶内容模块 + 全局搜索框（300ms 防抖 + 键盘导航）
│           ├── prompts.js           # Prompt 管理：卡片/列表视图/搜索/标签筛选/CRUD/批量管理/右键菜单/选择性导入导出/置顶/搜索高亮/悬停复制/模板变量格式说明
│           ├── skills.js            # Skill 管理：卡片/列表视图/搜索/批量管理/右键菜单(查看/编辑/导出/删除)/ZIP 导入导出/文件浏览/置顶/搜索高亮/Skill 详情弹窗/文件右键菜单
│           ├── settings.js          # 设置页：存储路径配置 + 6 种主题切换 + 全局字体大小控制 + 全局字体族设置 + 分组卡片布局
│           └── data.js              # 数据管理：完整备份恢复 + 数据重置
│
├── tools/
│   └── seed/
│       └── main.go                  # 测试数据注入脚本（16 条 Prompt + 7 个 Skill，含 SKILL.md）
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
| 数据库层 | SQLite 初始化、WAL 模式、建表迁移、默认设置 | `internal/db/sqlite.go` | modernc.org/sqlite |
| 数据模型 | 6 个结构体定义（Prompt/Skill 含 is_pinned 字段） | `internal/db/models.go` | 无 |
| 路径工具 | ~ 展开、目录创建、路径拼接 | `internal/utils/path.go` | os/path/filepath |
| 压缩工具 | ZIP 压缩/解压、SKILL.md 读写、frontmatter 解析、导出格式处理、目录扁平化 | `internal/utils/archive.go` | archive/zip |
| 导入导出 | JSON 格式的 Prompt 元数据读写 | `internal/utils/export.go` | encoding/json |
| 备份恢复 | 完整备份（data.json + Skill 文件）、恢复（跳过同名） | `internal/utils/backup.go` | archive/zip, encoding/json |
| 字体工具 | 系统字体族列表获取（Windows API EnumFontFamiliesW） | `internal/utils/font.go` | syscall (Windows GDI) |

### 业务核心模块

| 模块 | 核心功能 | 文件 | 核心输入/输出 |
|------|----------|------|---------------|
| 设置服务 | 系统参数 CRUD、Skill 存储路径管理、重置默认设置 | `internal/service/settings.go` | 输入: key/value → 输出: map/string |
| Prompt 服务 | CRUD + 搜索筛选 + 分类查询 + 批量删除 + 选择性 JSON 导入导出 + 模板变量 | `internal/service/prompt.go` | 输入: name/content/keyword → 输出: Prompt[] |
| Skill 服务 | CRUD + 批量删除 + 单/双格式 ZIP 导入导出 + 编辑同步 SKILL.md + 文件列表 | `internal/service/skill.go` | 输入: ZIP/元数据 → 输出: Skill[]/SkillFile[] |
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
│  BackupHandler                                            │
└────┬─────────────┬──────────────┬─────────────────────────┘
     │             │              │
┌────▼────┐ ┌─────▼─────┐ ┌─────▼─────┐
│ Settings │ │  Prompt   │ │   Skill   │
│ Handler  │ │  Handler  │ │  Handler  │
└────┬─────┘ └─────┬─────┘ └─────┬─────┘
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
│     SQLite (WAL) + models.go + 索引      │
└──────────────────┬──────────────────────┘
                   │
          ~/.psm/data.db
          ~/.psm/skills/
```

### 依赖关系明细

| 模块 A | 依赖模块 B | 依赖类型 |
|--------|-----------|----------|
| app.go | Handler (SettingsHandler/PromptHandler/SkillHandler/BackupHandler) | 结构体嵌入 |
| Handler | SettingsService / PromptService / SkillService | 组合（构造函数注入） |
| app.go | verman | 构建时版本注入（`-ldflags -X`） |
| SkillService | SettingsService | 方法调用（获取存储路径） |
| SkillService | archive.go | 工具调用（ZIP 压缩/解压/SKILL.md 读写/导出格式） |
| PromptService | export.go | 工具调用（JSON 导入导出） |
| app.go | backup.go | 工具调用（完整备份恢复） |
| 所有 Service | db/sqlite.go | 数据库连接 |
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
| **仓库模式（简化）** | Service 层直接操作 DB | 未单独抽 Repository 层，Service 直接执行 SQL |
| **SPA 路由** | `frontend/js/app.js` | 前端单页应用，hash-free 路由切换 |
| **组件化** | `frontend/js/components/` | Toast/Modal/Confirm/ContextMenu 可复用组件 |
| **批量管理模式** | views/*.js | 按钮触发进入批量模式 → 复选框显示 → 操作栏底部固定 → 退出恢复默认 |
| **构建时注入** | app.go + verman | 通过 `-ldflags -X` 在构建时注入版本元数据 |

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

**Skill 导入流程（双格式自动识别）**:
```
用户选择 ZIP 文件 → API.importSkillAuto(zipPath)
→ app.go 检测格式:
  ├─ 有标识文件 (.psm-skill-export) → ImportSkillFromExportZip
  │   → 扫描 ZIP 根目录下所有子目录
  │   → 逐个检查同名 Skill 是否存在（跳过已存在）
  │   → 读取 SKILL.md frontmatter 提取元数据
  │   → UnzipPrefixToDir 解压到存储目录（带前缀剥离）
  │   → SQL INSERT 创建数据库记录
  │   → 返回 ImportResult（成功/跳过/失败统计）
  │
  └─ 无标识文件 → ImportSkill（公共格式）
      → HasSkillMD 检查根目录 SKILL.md
      → GetSkillMetadataFromZip 解析 frontmatter
      → 检查同名 Skill 是否已存在
      → UnzipToDir 解压 + FlattenIfNested 修复嵌套
      → SQL INSERT 创建数据库记录
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
  → SQL UPDATE 更新数据库记录
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

- 直接依赖: 3 个（wails/v2, modernc.org/sqlite, verman）
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
| 版本信息 | ✅ | 构建时注入，零运行时开销 |

---

## 八、数据库设计

### ER 关系

```
settings (KV 存储)
├── skill_storage_path: ~/.psm/skills
├── app_theme: light/dark/midnight/ocean/forest/sunset/auto  (默认 light)
├── prompt_view_mode: card/list      (默认 card)
├── skill_view_mode: card/list       (默认 card)
├── sidebar_collapsed: true/false
├── font_size_offset: 0px            (全局字体大小偏移)
└── font_family: Space Grotesk       (全局字体族)

prompts (独立表)
├── id (PK, AUTO_INCREMENT)
├── name, content, category
├── tags (JSON 数组字符串)
├── is_pinned (DEFAULT 0)
├── created_at, updated_at
└── 索引: category, updated_at

skills (独立表 + 文件系统)
├── id (PK, AUTO_INCREMENT)
├── name, description
├── relative_path → 拼接 skill_storage_path 得到绝对路径
├── is_pinned (DEFAULT 0)
├── created_at, updated_at
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

1. **存储分离设计**: Skill 元数据在数据库，实际文件在文件系统，通过 `relative_path` 关联
2. **SKILL.md 规范**: 导入时校验 SKILL.md 存在性，解析 YAML frontmatter 自动填充元数据；编辑时同步更新 frontmatter（仅修改头部区域，保留正文）
3. **Skill 导出双格式**: 单个 Skill 导出标准格式（SKILL.md 在 ZIP 根目录）；多个 Skill 导出 PSM 格式（`.psm-skill-export` 标识文件 + 技能目录）
4. **双格式自动导入**: 自动识别导出格式（标识文件）和公共格式（SKILL.md），统一入口 `importSkillAuto`
5. **零前端框架**: 原生 HTML/CSS/JS，Flat Design 设计系统，Space Grotesk 字体
6. **CSS 三文件拆分**: variables.css（变量/6 种主题/全局字体偏移）、layout.css（布局）、components.css（组件），职责清晰
7. **纯 Go SQLite**: modernc.org/sqlite 无需 CGO，单 exe 部署
8. **6 种主题系统**: CSS 变量驱动（light/dark/midnight/ocean/rose/lavender），支持跟随系统，设置持久化到数据库
9. **卡片视图右键菜单**: 卡片/表格行右键弹出操作菜单（查看/编辑/导出/删除），替代固定按钮，界面更简洁
10. **批量管理模式**: 工具栏"批量管理"按钮触发，底部操作栏 + 全选 + 退出管理，非批量时界面无复选框干扰
11. **默认卡片视图**: Prompt 和 Skill 模块默认使用卡片视图（可通过设置切换）
12. **仪表盘交互**: 统计卡片可点击跳转到对应模块，置顶内容模块（Prompt/Skill 各最多 3 个），全局搜索框（300ms 防抖，候选下拉菜单）
13. **导出后清空选中**: 两个模块导出完成后自动清空 selectedIds 和复选框 UI
14. **完整备份恢复**: ZIP 格式备份（data.json + Skill 文件），恢复时自动跳过同名记录
15. **构建时版本注入**: 通过 verman 库 + `-ldflags -X` 在构建时注入版本元数据，关于弹窗展示版本号
16. **全局拖拽导入**: 基于 Wails `OnFileDrop` API，支持拖入 ZIP 文件直接导入技能，已存在的技能自动跳过并提示
17. **快捷键系统**: ShortcutManager 管理全局快捷键（Ctrl+N/F/S/Esc/1-5/?）和模块快捷键（Delete/Ctrl+A/D）
18. **Prompt 字符计数**: 新建/编辑 Prompt 时实时显示字符数，查看详情时显示总字符数
19. **数据统计与清理**: 数据管理页显示 Prompt/Skill 数量和数据库大小，支持检测并清理孤立 Skill 数据
20. **搜索防抖**: 搜索输入框 100ms 防抖，减少不必要的 API 调用
21. **标签搜索与筛选**: 搜索时匹配标签字段，点击标签自动填入搜索框筛选
22. **Handler 嵌入模式**: app.go 按领域拆分为 SettingsHandler/PromptHandler/SkillHandler/BackupHandler，通过结构体嵌入到 App
23. **数据库索引**: 为 prompts(category, updated_at) 和 skills(updated_at) 添加索引
24. **置顶功能**: Prompt 和 Skill 支持置顶，置顶项优先排列
25. **搜索高亮**: 搜索结果中关键词以红色加粗显示
26. **模板变量系统**: Prompt 支持 `{{变量名}}` 占位符，启用模板后复制时弹窗填写变量，支持中文变量名
27. **全局字体大小控制**: 设置页字体大小选择器（5 个预设档位 + 自定义输入），CSS 变量 `--font-size-offset` 控制全局
28. **设置页分组卡片布局**: 外观/存储分组卡片，现代化视觉效果
29. **关于弹窗**: 侧边栏 LOGO 点击触发，显示版本号、项目地址、快捷键帮助
30. **仪表盘置顶内容模块**: 显示置顶的 Prompt 和 Skill（各最多 3 个），点击跳转并闪烁
31. **仪表盘全局搜索框**: 替代最近更新，300ms 防抖，候选下拉菜单（最多 8 条）
32. **跳转闪烁效果**: 从仪表盘跳转后目标项红色边框+背景闪烁 3 秒
33. **UI 阴影系统**: 5 级阴影（sm/md/lg/xl/2xl），卡片悬停效果
34. **动画效果系统**: 3 级过渡（fast/normal/slow），模态框滑入动画，列表项入场动画
35. **悬停复制**: 鼠标悬停在 Prompt 上时按 Ctrl+C 可复制内容
36. **全局字体族设置**: 设置页字体族选择器（系统字体列表 + 搜索过滤 + 键盘导航），CSS 变量 `--font-family` 控制全局，自动滚动到选中项
37. **搜索框键盘导航**: 仪表盘搜索框支持上下键移动高亮、回车选择、Esc 关闭
38. **数据重置功能**: 数据管理页"重置所有数据"按钮，二次确认后清空所有提示词、技能（含文件）、恢复默认设置
39. **工具栏布局优化**: 工具栏按钮保持一行显示，不因导航栏展开而换行
40. **点击动画反馈**: 卡片/行/统计卡片/置顶内容/搜索候选项使用 CSS `:active` 伪类实现按下瞬间缩放反馈
41. **Skill 详情弹窗**: 简洁信息流布局，无卡片边框，分隔线区分区块，双击文件可在文件管理器打开
42. **文件列表右键菜单**: 文件：打开文件/打开所在目录/复制路径；目录：打开目录/复制路径
43. **后端文件操作**: `RevealInExplorer`（打开文件管理器）+ `OpenFile`（用系统默认程序打开文件）

---

## 十、待优化点

| 优先级 | 问题 | 建议 | 状态 |
|--------|------|------|------|
| P1 | app.go 方法过多（40+） | 按领域拆分为 Handler | ✅ 已完成 |
| P2 | 无数据库版本化迁移 | 引入 goose 或自实现版本号 + ALTER TABLE | 待定 |
| P2 | 无单元测试 | 为 service 层和 utils 层补充测试 | 待定 |
| P2 | Skill 导入为同步操作 | 大 ZIP 文件可考虑异步 | 暂缓（收益低） |
| P3 | 前端无骨架屏 | 加载时显示 loading 动画，提升体验 | 待定 |
| P3 | 无国际化支持 | 当前仅中文硬编码 | 待定 |

---

## 十一、关键记忆点

1. **数据库路径**: `~/.psm/data.db`（SQLite，WAL 模式）
2. **Skill 存储**: `~/.psm/skills/`（默认，可在设置中修改，设置页有"打开"按钮快捷访问）
3. **SKILL.md 规范**: YAML frontmatter 格式，`---\nname: xxx\ndescription: xxx\n---`
4. **Skill 导出双格式**: 单个 Skill → 标准格式（`ZipDir`）；多个 Skill → PSM 格式（`.psm-skill-export` + 技能目录）
5. **Skill 导入双格式**: 有标识文件 → 批量导入（`ImportSkillFromExportZip`）；无标识文件 → 单个导入（`ImportSkill`），均通过 `ImportSkillAuto` 统一入口
6. **SKILL.md 编辑同步**: `UpdateSkillFrontmatter` 仅替换 frontmatter 区域，不覆盖正文；文件不存在时自动创建
7. **Skill 模型无 version 字段**: 已从数据库模型、SQL 查询、前端表单中完全移除
8. **前端 ID 处理**: HTML data-id 是字符串，api.js 中所有 id 参数用 `Number()` 转换
9. **Go 空切片**: 所有返回前端的切片必须初始化为 `[]Type{}`，否则 JSON 输出 `null`
10. **构建命令**: `wails dev`（开发）/ `wails build`（生产）/ `go run tools/seed/main.go`（测试数据：16 条 Prompt + 7 个 Skill）
11. **设计系统**: Flat Design，5 级阴影系统，3 级动画效果，Space Grotesk 字体，SVG 图标
12. **CSS 三文件**: `variables.css`（159 行变量/主题定义）、`layout.css`（377 行布局）、`components.css`（1300+ 行组件样式）
13. **前端路由**: app.js loadScript 去重机制，防止 const 重复声明
14. **默认视图模式**: prompt_view_mode 和 skill_view_mode 默认值为 `card`（数据库 INSERT OR IGNORE，不覆盖已有设置）
15. **批量管理模式**: `batchMode` 状态 + `.batch-mode` CSS 类切换，checkbox 默认隐藏，批量操作栏 `order:1` 固定底部
16. **右键菜单**: `ContextMenu` 组件，`show(x, y, items)` API，自动边界检测，点击外部/滚动自动关闭
17. **仪表盘导航**: 统计卡片通过 `data-view` 属性 + `App.navigate()` 实现点击跳转
18. **ZIP 目录扁平化**: `FlattenIfNested` 修复 ZIP 解压后多余的目录层级嵌套问题
19. **Prompt 卡片数据**: `allPrompts` 数组缓存加载结果，右键菜单通过 ID 查找数据
20. **版本信息**: verman 库（`gitee.com/MM-Q/verman`）构建时注入，前端 `loadVersion()` 展示，未注入时显示 "dev"
21. **6 种主题**: light（默认）、dark、midnight（午夜蓝）、ocean（海洋蓝）、rose（玫瑰红）、lavender（薰衣草紫）+ auto（跟随系统），均在 variables.css 定义
22. **设置页保存按钮**: `.form-actions` 使用 `justify-content: flex-end` 右对齐
23. **golangci-lint**: errcheck（`defer xxx.Close()` → 闭包包装，非 defer → `_ =` 前缀）+ staticcheck（错误信息小写）
24. **全局拖拽导入**: Wails `EnableFileDrop: true` + `OnFileDrop(callback, false)` 关键：`useDropTarget` 必须为 `false`，否则回调不会触发
25. **拖拽导入已存在处理**: `ImportSkillAuto` 和 `BatchImportSkills` 中检查错误消息包含"已存在"则计入 `Skipped` 而非 `Failed`
26. **快捷键管理**: `ShortcutManager` 对象，`registerView(name, shortcuts)` 注册模块快捷键，Ctrl+A 使用 `e.preventDefault()` 阻止默认全选行为
27. **Prompt 字符计数**: `input` 事件监听 textarea，`.char-count` / `.char-count-inline` 显示字符数
28. **数据统计 API**: `GetDataStats` 返回 `{prompt_count, skill_count, db_size}`，`GetOrphanSkills` 检测孤立 Skill
29. **搜索防抖**: 100ms `setTimeout/clearTimeout` 模式，`_searchTimer` 属性存储定时器 ID
30. **Handler 嵌入模式**: app.go 仅 ~73 行，4 个 Handler 文件通过结构体嵌入提供方法，Wails 反射可扫描嵌入方法
31. **数据库索引**: `idx_prompts_category`、`idx_prompts_updated_at`、`idx_skills_updated_at`
32. **置顶功能**: `is_pinned` 字段（DEFAULT 0），排序 `is_pinned DESC, updated_at DESC`，TogglePin 方法用 CASE WHEN 切换
33. **搜索高亮**: `highlightText(text, keyword)` 函数，先转义 HTML 再正则替换，`<mark>` 标签红色加粗显示
34. **标签点击筛选**: 点击标签填入搜索框，复用现有搜索逻辑（tags LIKE 匹配），无需独立筛选状态
35. **全局字体偏移**: CSS 变量 `--font-size-offset: 0px`，所有 `font-size` 使用 `calc(XXpx + var(--font-size-offset))`
36. **数据库字体设置**: `font_size_offset` 设置项，存储用户选择的字体大小偏移值
37. **关于弹窗**: `app.js showAboutDialog()` 显示版本号、项目地址、快捷键帮助
38. **仪表盘全局搜索**: 300ms 防抖，调用 `API.searchPrompts` 和 `API.searchSkills`，候选下拉菜单最多 8 条
39. **仪表盘置顶内容**: `API.getPinnedPrompts(3)` + `API.getPinnedSkills(3)`，各最多 3 个
40. **跳转闪烁**: `App.navigate(viewName, highlightId)` 传递 ID，`highlightItem(highlightId)` 执行高亮，3 秒动画
41. **悬停复制**: `hoveredPromptId` 追踪悬停 ID，Ctrl+C 快捷键复制内容到剪贴板
42. **模板变量格式**: 新建/编辑弹窗中显示 "占位符格式: `{{变量名}}`"，支持中文变量名
43. **UI 阴影变量**: `--shadow-sm/md/lg/xl/2xl`，暗色主题阴影使用 `rgba(0,0,0,0.3)`
44. **动画过渡变量**: `--transition-fast: 150ms`、`--transition: 250ms`、`--transition-slow: 400ms`，Material Design 缓动曲线
45. **跳转闪烁动画**: `@keyframes highlight-flash`，红色边框+背景闪烁，3 秒后移除类
46. **全局字体族变量**: CSS 变量 `--font-family`，默认 `'Space Grotesk', -apple-system, ...`
47. **数据库字体族设置**: `font_family` 设置项，存储用户选择的字体族名称
48. **系统字体获取**: `internal/utils/font.go` 使用 Windows API `EnumFontFamiliesW` 获取系统字体列表
49. **字体下拉滚动**: 下拉框显示时 `scrollIntoView({ block: 'nearest' })` 自动滚动到选中项
50. **字体回退机制**: 如果用户选择的字体不存在，自动回退到默认字体
51. **搜索框键盘导航**: `_searchIndex` 状态 + `updateSearchHighlight` 方法，上下键移动高亮，回车选择
52. **数据重置 API**: `ResetAllData` 方法，清空 prompts 表 + 删除 skills 文件 + 清空 skills 表 + 重置 settings 表
53. **二次确认保护**: 数据重置操作需要两次确认，防止误操作
54. **工具栏不换行**: `.toolbar` 移除 `flex-wrap: wrap`，`.toolbar-right` 添加 `flex-wrap: nowrap`
55. **技能空状态提示**: 改为"点击'导入技能'添加第一条"，反映功能变更
56. **点击动画**: CSS `:active` 伪类实现按下瞬间缩放（`transform: scale(0.98)`），比 JS click 事件更可靠
57. **Skill 详情弹窗**: 简洁信息流布局，`skill-detail-compact` 类，分隔线区分区块，无创建/更新时间显示
58. **文件右键菜单**: `.skill-detail-file-item` 元素绑定 contextmenu 事件，ContextMenu 选择器需包含此类
59. **ContextMenu 选择器**: 全局 contextmenu 事件需允许 `.skill-detail-file-item`，否则菜单被立即隐藏
60. **后端文件操作**: `RevealInExplorer(path)` 用 explorer 打开目录，`OpenFile(path)` 用 cmd start 打开文件
61. **SkillFile FullPath**: 模型新增 `full_path` 字段，`ListSkillFiles` 返回完整路径供前端使用
