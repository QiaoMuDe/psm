<div align="center">

# ⚡ PSM — Skill & Prompt Manager

**一款现代化的 AI Skill 与 Prompt 统一管理桌面应用**

[![Go](https://img.shields.io/badge/Go-1.25-00ADD8?style=flat-square&logo=go&logoColor=white)](https://go.dev/) [![Wails](https://img.shields.io/badge/Wails-v2.11-FF5E5B?style=flat-square&logo=wails&logoColor=white)](https://wails.io/) [![SQLite](https://img.shields.io/badge/SQLite-WAL-003B57?style=flat-square&logo=sqlite&logoColor=white)](https://www.sqlite.org/) [![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE) [![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20macOS%20%7C%20Linux-blueviolet?style=flat-square)](https://wails.io/) [![Release](https://img.shields.io/badge/Release-v1.0.0-orange?style=flat-square)](https://gitee.com/MM-Q/psm/releases)

[🚀 快速开始](#-快速开始) · [ 下载](https://gitee.com/MM-Q/psm/releases) · [💬 反馈](https://gitee.com/MM-Q/psm/issues)

---

*统一管理你的 AI 开发资源 —— 让 Prompt 和 Skill 触手可及*

</div>

---

## 📋 目录

- [✨ 核心特性](#-核心特性)
- [🚀 快速开始](#-快速开始)
- [💡 使用示例](#-使用示例)
- [ 许可证与贡献](#-许可证与贡献)
- [🔗 联系方式与相关链接](#-联系方式与相关链接)

---

## ✨ 核心特性

| 特性 | 说明 |
|:-----|:-----|
| 📝 **Prompt 管理** | 增删改查、分类筛选、关键词搜索、JSON 选择性导入导出、字符计数 |
| 🧩 **Skill 管理** | 元数据管理 + 文件系统存储，ZIP 批量导入导出，SKILL.md frontmatter 自动解析与同步 |
| 📊 **仪表盘** | 统计卡片一键跳转，最近更新混合列表，数据一目了然 |
| 💾 **完整备份恢复** | ZIP 格式全量备份（元数据 + 文件），一键恢复，同名自动跳过 |
| 📈 **数据统计** | 显示 Prompt/Skill 数量、数据库大小，支持检测并清理孤立 Skill 数据 |
| 🎨 **主题系统** | CSS 变量驱动的 7 种主题（light/dark/midnight/ocean/forest/sunset/auto），支持跟随系统 |
| 🃏 **卡片视图** | 默认卡片布局 + 右键操作菜单，界面简洁高效 |
| ☑️ **批量管理** | 工具栏一键进入批量模式，支持全选、批量删除 |
| 📂 **双格式导入** | 自动识别 PSM 导出格式和标准 SKILL.md 格式，无需手动选择 |
| 🎯 **全局拖拽导入** | 拖入 ZIP 文件直接导入技能，已存在的自动跳过并提示 |
| ⌨️ **快捷键系统** | 全局快捷键（Ctrl+N/F/S/Esc/1-5）+ 模块快捷键（Delete/Ctrl+A/D） |
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
| 📋 **复制内容** | 列表模式点击「复制」按钮，卡片模式右键菜单选择「复制」 |
| 🎯 **拖拽导入** | 拖入 ZIP 文件直接导入技能，支持单个或多个文件 |

### 快捷键

| 快捷键 | 说明 |
|:-------|:-----|
| `Ctrl+N` | 新建 Prompt |
| `Ctrl+F` | 聚焦搜索框 |
| `Ctrl+S` | 保存（在模态框中） |
| `Esc` | 关闭模态框/退出批量模式 |
| `1-5` | 切换到对应模块（仪表盘/提示词/技能/数据/设置） |
| `Ctrl+?` | 打开快捷键说明 |
| `Delete` | 批量模式下删除选中项 |
| `Ctrl+A` | 批量模式下全选 |
| `Ctrl+D` | 批量模式下取消全选 |

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
