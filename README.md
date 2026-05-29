<div align="center">

# ⚡ PSM — Skill & Prompt Manager

**一款现代化的 AI Skill 与 Prompt 统一管理桌面应用**

[![Go](https://img.shields.io/badge/Go-1.25-00ADD8?style=flat-square&logo=go&logoColor=white)](https://go.dev/) [![Wails](https://img.shields.io/badge/Wails-v2.11-FF5E5B?style=flat-square&logo=wails&logoColor=white)](https://wails.io/) [![SQLite](https://img.shields.io/badge/SQLite-WAL-003B57?style=flat-square&logo=sqlite&logoColor=white)](https://www.sqlite.org/) [![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE) [![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20macOS%20%7C%20Linux-blueviolet?style=flat-square)](https://wails.io/) [![Release](https://img.shields.io/badge/Release-v1.0.0-orange?style=flat-square)](https://gitee.com/MM-Q/psm/releases)

[🚀 快速开始](#-快速开始) · [📖 文档](#-api-文档概述) · [📥 下载](https://gitee.com/MM-Q/psm/releases) · [💬 反馈](https://gitee.com/MM-Q/psm/issues)

---

*统一管理你的 AI 开发资源 —— 让 Prompt 和 Skill 触手可及*

</div>

---

## 📋 目录

- [✨ 核心特性](#-核心特性)
- [🚀 快速开始](#-快速开始)
- [💡 使用示例](#-使用示例)
- [📖 API 文档概述](#-api-文档概述)
- [📁 支持的功能与格式](#-支持的功能与格式)
- [⚙️ 配置选项](#️-配置选项)
- [🏗️ 项目结构](#️-项目结构)
- [🧪 测试说明](#-测试说明)
- [📋 许可证与贡献](#-许可证与贡献)
- [🔗 联系方式与相关链接](#-联系方式与相关链接)

---

## ✨ 核心特性

| 特性 | 说明 |
|:-----|:-----|
| 📝 **Prompt 管理** | 增删改查、分类筛选、关键词搜索、JSON 选择性导入导出 |
| 🧩 **Skill 管理** | 元数据管理 + 文件系统存储，ZIP 批量导入导出，SKILL.md frontmatter 自动解析与同步 |
| 📊 **仪表盘** | 统计卡片一键跳转，最近更新混合列表，数据一目了然 |
| 💾 **完整备份恢复** | ZIP 格式全量备份（元数据 + 文件），一键恢复，同名自动跳过 |
| 🎨 **主题系统** | CSS 变量驱动的亮色/暗色主题，一键切换 |
| 🃏 **卡片视图** | 默认卡片布局 + 右键操作菜单，界面简洁高效 |
| ☑️ **批量管理** | 工具栏一键进入批量模式，支持全选、批量删除 |
| 📂 **双格式导入** | 自动识别 PSM 导出格式和标准 SKILL.md 格式，无需手动选择 |
| 🔒 **纯本地存储** | SQLite + 文件系统，所有数据存储在 `~/.psm/`，隐私安全 |
| 🖥️ **跨平台** | 基于 Wails v2，支持 Windows、macOS、Linux |
| 📦 **单文件部署** | 编译为单个可执行文件，零外部依赖，开箱即用 |

---

## 🚀 快速开始

### 📥 下载安装

从 [Gitee Releases](https://gitee.com/MM-Q/psm/releases) 下载对应平台的可执行文件，直接运行即可。

### 🔧 从源码构建

**前置要求**

| 依赖 | 版本 | 说明 |
|:-----|:-----|:-----|
| [Go](https://go.dev/dl/) | ≥ 1.25 | 后端语言 |
| [Wails CLI](https://wails.io/docs/gettingstarted/installation) | v2 | 桌面框架 CLI |
| [Node.js](https://nodejs.org/) | ≥ 18 | 前端构建（可选，本项目无 npm 依赖） |

**克隆并构建**

```bash
# 克隆仓库
git clone https://gitee.com/MM-Q/psm.git
cd psm

# 开发模式（热重载）
wails dev

# 生产构建
wails build
```

构建完成后，可执行文件位于 `build/bin/psm.exe`（Windows）。

**注入测试数据（可选）**

```bash
# 先启动一次应用完成数据库初始化，然后执行：
go run tools/seed/main.go
```

将注入 16 条示例 Prompt 和 7 个示例 Skill。

---

## 💡 使用示例

### 基础操作

| 操作 | 说明 |
|:-----|:-----|
| ➕ **新建 Prompt** | 点击「新建」→ 填写名称、内容、分类、标签 → 保存 |
| 🔍 **搜索过滤** | 在搜索框输入关键词，或通过分类下拉筛选 |
| 👁️ **查看内容** | 列表模式点击「查看」按钮，卡片模式右键菜单选择「查看」 |
| 📋 **复制内容** | 列表模式点击「复制」按钮，卡片模式右键菜单选择「复制内容」 |

### Skill 管理

```
导入 Skill（支持两种格式）：
┌─────────────────────────────────────────────┐
│  PSM 导出格式（自动识别）                    │
│  ├── .psm-skill-export     ← 标识文件       │
│  ├── skill-name-1/                          │
│  │   ├── SKILL.md                           │
│  │   └── ...                                │
│  └── skill-name-2/                          │
│      └── ...                                │
├─────────────────────────────────────────────┤
│  标准格式（公共兼容）                        │
│  ├── SKILL.md               ← 根目录文件     │
│  └── ...                                    │
└─────────────────────────────────────────────┘
```

### 导出格式

| 场景 | 导出格式 | ZIP 结构 |
|:-----|:---------|:---------|
| 单个 Skill | 标准格式 | `skill-name/SKILL.md + ...` |
| 多个 Skill | PSM 格式 | `.psm-skill-export` + 各技能目录 |

---

## 📖 API 文档概述

PSM 通过 [Wails](https://wails.io/) 框架将 Go 方法绑定为前端 JavaScript API，前端通过 `window.go.main.App.*` 调用。

### Settings API

| 方法 | 参数 | 返回值 | 说明 |
|:-----|:-----|:-------|:-----|
| `GetSettings()` | — | `map[string]string` | 获取所有系统设置 |
| `UpdateSetting(key, value)` | key: string, value: string | — | 更新单个设置 |
| `BatchUpdateSettings(settings)` | settings: map | — | 批量更新设置 |

### Prompt API

| 方法 | 参数 | 返回值 | 说明 |
|:-----|:-----|:-------|:-----|
| `CreatePrompt(name, content, category, tags)` | 4 个 string | `Prompt` | 创建 Prompt |
| `GetPrompt(id)` | id: int64 | `Prompt` | 获取单个 Prompt |
| `GetPrompts(keyword, category)` | keyword: string, category: string | `[]Prompt` | 列表查询（支持搜索+分类筛选） |
| `UpdatePrompt(id, ...)` | id + 4 个 string | — | 更新 Prompt |
| `DeletePrompt(id)` | id: int64 | — | 删除 Prompt |
| `BatchDeletePrompts(ids)` | ids: []int64 | int64 | 批量删除 |
| `ExportPrompts(ids, filePath)` | ids: []int64, filePath: string | — | JSON 导出（ids 为空导出全部） |
| `ImportPrompts(filePath)` | filePath: string | `ImportResult` | JSON 导入 |

### Skill API

| 方法 | 参数 | 返回值 | 说明 |
|:-----|:-----|:-------|:-----|
| `CreateSkill(name, description)` | 2 个 string | `Skill` | 创建 Skill |
| `GetSkill(id)` | id: int64 | `Skill` | 获取单个 Skill |
| `GetSkills(keyword)` | keyword: string | `[]Skill` | 列表查询 |
| `UpdateSkill(id, name, description)` | id: int64 + 2 个 string | — | 更新（同步 SKILL.md） |
| `DeleteSkill(id, deleteFiles)` | id: int64, deleteFiles: bool | — | 删除 |
| `ImportSkillAuto(zipPath)` | zipPath: string | `Skill` / `ImportResult` | 自动识别格式导入 |
| `ExportSkill(id, zipPath)` | id: int64, zipPath: string | — | 单个导出（标准格式） |
| `ExportSkills(ids, zipPath)` | ids: []int64, zipPath: string | — | 批量导出（PSM 格式） |

### 数据管理 API

| 方法 | 参数 | 返回值 | 说明 |
|:-----|:-----|:-------|:-----|
| `BackupData(savePath)` | savePath: string | — | 完整备份（ZIP） |
| `RestoreData(zipPath)` | zipPath: string | `RestoreResult` | 完整恢复 |
| `OpenDataDirectory()` | — | — | 打开数据目录 |

### Dashboard API

| 方法 | 参数 | 返回值 | 说明 |
|:-----|:-----|:-------|:-----|
| `GetDashboardStats()` | — | `DashboardStats` | 获取统计数据 |
| `GetRecentUpdates()` | — | `[]map` | 获取最近更新列表 |

---

## 📁 支持的功能与格式

### Prompt 支持

| 功能 | 格式 | 说明 |
|:-----|:-----|:-----|
| 导出 | JSON | 选择性导出（按 ID）或全量导出 |
| 导入 | JSON | 自动跳过同名 Prompt |
| 分类 | 自定义字符串 | 自由分类，支持下拉筛选 |
| 标签 | JSON 数组 | 多标签支持，最多显示 4 个 |

### Skill 支持

| 功能 | 格式 | 说明 |
|:-----|:-----|:-----|
| 导出（单个） | ZIP 标准格式 | `skill-name/SKILL.md + ...` |
| 导出（多个） | ZIP PSM 格式 | `.psm-skill-export` 标识文件 |
| 导入 | ZIP（自动识别） | 支持 PSM 格式和标准 SKILL.md 格式 |
| 元数据同步 | YAML Frontmatter | 编辑时自动同步 SKILL.md |

### 备份恢复

| 功能 | 格式 | 说明 |
|:-----|:-----|:-----|
| 备份 | ZIP | `psm-backup/data.json` + `psm-backup/skills/` |
| 恢复 | ZIP | 同名自动跳过，保留现有数据 |

---

## ⚙️ 配置选项

### 系统设置（持久化到数据库）

| 设置项 | 默认值 | 说明 |
|:-------|:-------|:-----|
| `skill_storage_path` | `~/.psm/skills` | Skill 文件存储目录 |
| `app_theme` | `light` | 主题模式：`light` / `dark` |
| `prompt_view_mode` | `card` | Prompt 视图：`card` / `list` |
| `skill_view_mode` | `card` | Skill 视图：`card` / `list` |
| `sidebar_collapsed` | `false` | 侧边栏是否收起 |

### 应用配置（wails.json）

```json
{
  "info": {
    "productName": "Skill & Prompt Manager",
    "productVersion": "1.0.0",
    "companyName": "psm",
    "copyright": "2026 psm"
  }
}
```

### 数据存储位置

```
~/.psm/
├── data.db          # SQLite 数据库（WAL 模式）
└── skills/          # Skill 文件目录（可在设置中修改）
    ├── skill-name-1/
    │   ├── SKILL.md
    │   └── ...
    └── skill-name-2/
        └── ...
```

---

## 🏗️ 项目结构

```
psm/
├── main.go                     # Wails 应用入口
├── app.go                      # App 主结构体，40+ 个前端 API 方法
├── wails.json                  # Wails 框架配置
│
├── internal/                   # 后端核心业务
│   ├── db/
│   │   ├── models.go           # 数据模型定义
│   │   └── sqlite.go           # SQLite 初始化与迁移
│   ├── service/
│   │   ├── settings.go         # 设置服务
│   │   ├── prompt.go           # Prompt 服务
│   │   └── skill.go            # Skill 服务
│   └── utils/
│       ├── archive.go          # ZIP 压缩/解压 + SKILL.md 解析
│       ├── backup.go           # 完整备份恢复
│       ├── export.go           # Prompt JSON 导入导出
│       └── path.go             # 路径工具函数
│
├── frontend/                   # 前端资源（原生 HTML/CSS/JS）
│   ├── index.html              # 主页面
│   ├── css/
│   │   ├── variables.css       # CSS 变量（颜色/间距/字体）
│   │   ├── layout.css          # 布局样式
│   │   └── components.css      # 组件样式
│   └── js/
│       ├── api.js              # Wails 绑定封装
│       ├── app.js              # SPA 路由 + 主题初始化
│       ├── components/         # 可复用组件
│       │   ├── toast.js        # 消息提示
│       │   ├── modal.js        # 模态框
│       │   ├── confirm.js      # 确认对话框
│       │   └── context-menu.js # 右键菜单
│       └── views/              # 视图模块
│           ├── dashboard.js    # 仪表盘
│           ├── prompts.js      # Prompt 管理
│           ├── skills.js       # Skill 管理
│           ├── settings.js     # 系统设置
│           └── data.js         # 数据管理
│
├── tools/
│   └── seed/
│       └── main.go             # 测试数据注入脚本
│
└── build/                      # 构建配置
    ├── appicon.png
    └── windows/
```

### 技术栈

| 层级 | 技术 | 说明 |
|:-----|:-----|:-----|
| 桌面框架 | [Wails v2.11](https://wails.io/) | Go + Web 桌面应用 |
| 后端语言 | [Go 1.25](https://go.dev/) | 高性能后端 |
| 前端 | HTML + CSS + JS | 零框架依赖，Flat Design |
| 数据库 | [SQLite](https://www.sqlite.org/) (modernc.org) | 纯 Go 实现，无需 CGO |
| 字体 | [Space Grotesk](https://fonts.google.com/specimen/Space+Grotesk) | 现代几何字体 |

---

## 🧪 测试说明

### 注入测试数据

```bash
# 确保已运行过一次应用（初始化数据库）
go run tools/seed/main.go
```

将注入：
- 📝 16 条示例 Prompt（覆盖开发、数据库、运维、产品等分类）
- 🧩 7 个示例 Skill（go-kit-core、wails-desktop、docker-deploy 等）

### 运行 Lint 检查

```bash
# 格式化代码
golangci-lint fmt ./...

# 静态分析
golangci-lint run ./...
```

### 构建验证

```bash
# 开发模式
wails dev

# 生产构建
wails build

# 清理构建缓存
wails clean
```

---

## 📋 许可证与贡献

### 许可证

本项目基于 [MIT License](LICENSE) 开源。

### 贡献指南

欢迎提交 Issue 和 Pull Request！

1. 🍴 Fork 本仓库
2. 🔀 创建特性分支：`git checkout -b feature/amazing-feature`
3. 💾 提交更改：`git commit -m 'feat: add amazing feature'`
4. 📤 推送分支：`git push origin feature/amazing-feature`
5. 📬 提交 Pull Request

> 请遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范编写提交信息。

---

## 🔗 联系方式与相关链接

| 资源 | 链接 |
|:-----|:-----|
| 📦 **仓库地址** | [https://gitee.com/MM-Q/psm](https://gitee.com/MM-Q/psm) |
| 📥 **下载发布** | [https://gitee.com/MM-Q/psm/releases](https://gitee.com/MM-Q/psm/releases) |
| 🐛 **问题反馈** | [https://gitee.com/MM-Q/psm/issues](https://gitee.com/MM-Q/psm/issues) |
| 🏠 **Wails 官网** | [https://wails.io/](https://wails.io/) |
| 📖 **Wails 文档** | [https://wails.io/docs](https://wails.io/docs) |

---

<div align="center">

**如果这个项目对你有帮助，请点个 ⭐ Star 支持一下！**

Made with ❤️ by [MM-Q](https://gitee.com/MM-Q)

</div>
