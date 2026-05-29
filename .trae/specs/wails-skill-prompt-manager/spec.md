# Skill & Prompt 管理工具 (PSM) 规格说明

## Why

目前缺乏一个统一的桌面工具来管理 AI 开发中的 Skill（技能包）和 Prompt（提示词）。Skill 通常包含压缩包、脚本、文档等文件，需要文件系统级别的存储管理；Prompt 则是纯文本内容，适合数据库存储。本工具使用 Wails (Go + Web) 构建跨平台桌面应用，提供统一的管理界面。

## 技术栈

| 层级 | 技术选型 | 说明 |
|------|----------|------|
| 框架 | Wails v2 | Go + Web 前端桌面应用框架 |
| 后端 | Go 1.21+ | 业务逻辑、文件操作、数据库管理 |
| 前端 | HTML + CSS + JavaScript | 原生 Web 三件套，无框架依赖 |
| 数据库 | SQLite (modernc.org/sqlite) | 纯 Go 实现，无需 CGO |
| 压缩 | archive/zip (标准库) | Skill 包的导入导出 |

## What Changes

- 创建全新的 Wails 项目结构 (`psm`)
- 后端：Go 服务层提供 CRUD、导入导出、文件系统操作
- 前端：Web 三件套构建管理界面（侧边栏导航 + 内容区）
- 数据库：SQLite 存储系统设置、Prompt 内容、Skill 元数据
- 文件系统：Skill 文件存储在用户指定的目录中

## 项目结构

```
psm/
├── main.go                    # Wails 入口
├── app.go                     # App 主结构体与生命周期
├── go.mod
├── go.sum
├── wails.json                 # Wails 配置
├── internal/
│   ├── db/
│   │   ├── sqlite.go          # 数据库初始化与迁移
│   │   └── models.go          # 数据模型定义
│   ├── service/
│   │   ├── settings.go        # 系统设置服务
│   │   ├── prompt.go          # Prompt CRUD 服务
│   │   └── skill.go           # Skill 元数据与文件系统服务
│   └── utils/
│       ├── archive.go         # 压缩/解压工具
│       └── export.go          # 导入导出格式处理
├── frontend/
│   ├── index.html             # 主页面
│   ├── css/
│   │   └── style.css          # 全局样式
│   ├── js/
│   │   ├── app.js             # 应用入口与路由
│   │   ├── api.js             # Wails 绑定调用封装
│   │   ├── views/
│   │   │   ├── dashboard.js   # 仪表盘视图
│   │   │   ├── prompts.js     # Prompt 管理视图
│   │   │   ├── skills.js      # Skill 管理视图
│   │   │   └── settings.js    # 设置视图
│   │   └── components/
│   │       ├── modal.js       # 模态框组件
│   │       ├── toast.js       # 消息提示组件
│   │       └── confirm.js     # 确认对话框组件
│   └── wailsjs/               # Wails 自动生成的绑定
└── build/                     # 构建产物目录
```

## 数据库设计

### settings 表 — 系统设置

```sql
CREATE TABLE IF NOT EXISTS settings (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
);
```

预置键值：

| key | 默认值 | 说明 |
|-----|--------|------|
| `skill_storage_path` | `~/.psm/skills` | Skill 文件存储根目录 |
| `app_theme` | `light` | 界面主题 (light/dark) |

### prompts 表 — Prompt 管理

```sql
CREATE TABLE IF NOT EXISTS prompts (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,
    content     TEXT NOT NULL DEFAULT '',
    category    TEXT NOT NULL DEFAULT 'uncategorized',
    tags        TEXT NOT NULL DEFAULT '[]',
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### skills 表 — Skill 元数据

```sql
CREATE TABLE IF NOT EXISTS skills (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    name          TEXT NOT NULL,
    description   TEXT NOT NULL DEFAULT '',
    relative_path TEXT NOT NULL,
    version       TEXT NOT NULL DEFAULT '1.0.0',
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

> **注意**：`relative_path` 是相对于 `skill_storage_path` 的相对路径，绝对路径通过 `skill_storage_path + relative_path` 拼接获取。

## ADDED Requirements

### Requirement: 系统设置管理

系统 SHALL 提供设置页面，允许用户配置 Skill 存储路径等系统参数。

#### Scenario: 修改 Skill 存储路径
- **WHEN** 用户在设置页面修改 Skill 存储路径并保存
- **THEN** 系统更新数据库中的 `skill_storage_path` 设置值
- **AND** 如果新路径不存在则自动创建
- **AND** 显示保存成功提示

#### Scenario: 查看当前设置
- **WHEN** 用户打开设置页面
- **THEN** 系统从数据库读取所有设置并填充到表单中

### Requirement: Prompt 管理

系统 SHALL 提供 Prompt 的完整 CRUD 操作界面。

#### Scenario: 创建 Prompt
- **WHEN** 用户点击新建按钮，填写名称、内容、分类、标签并提交
- **THEN** 系统在数据库中创建新的 Prompt 记录
- **AND** 返回创建后的完整 Prompt 对象
- **AND** 列表页自动刷新显示新条目

#### Scenario: 编辑 Prompt
- **WHEN** 用户选择一个 Prompt 并修改其名称、内容、分类或标签
- **THEN** 系统更新数据库中的对应记录
- **AND** 自动更新 `updated_at` 时间戳

#### Scenario: 删除 Prompt
- **WHEN** 用户确认删除一个 Prompt
- **THEN** 系统从数据库中移除该记录
- **AND** 列表页自动刷新

#### Scenario: 搜索/筛选 Prompt
- **WHEN** 用户在搜索框输入关键词或选择分类筛选
- **THEN** 系统返回匹配的 Prompt 列表
- **AND** 支持按名称和内容模糊搜索

### Requirement: Skill 管理

系统 SHALL 提供 Skill 元数据的 CRUD 操作，并将实际文件存储在文件系统中。

#### Scenario: 导入 Skill 包
- **WHEN** 用户选择一个 ZIP 压缩包导入
- **THEN** 系统将压缩包解压到 `skill_storage_path` 下的子目录（以 Skill 名称命名）
- **AND** 在数据库中创建元数据记录（名称、描述、相对路径、版本）
- **AND** 如果 Skill 已存在（同名），提示用户确认是否覆盖

#### Scenario: 创建空 Skill
- **WHEN** 用户手动创建一个 Skill 元数据（填写名称、描述、版本）
- **THEN** 系统在 `skill_storage_path` 下创建对应子目录
- **AND** 在数据库中创建元数据记录

#### Scenario: 编辑 Skill 元数据
- **WHEN** 用户修改 Skill 的名称、描述或版本
- **THEN** 系统更新数据库中的对应记录
- **AND** 自动更新 `updated_at` 时间戳

#### Scenario: 删除 Skill
- **WHEN** 用户确认删除一个 Skill
- **THEN** 系统提示用户选择是否同时删除文件系统中的文件
- **AND** 根据用户选择删除或保留文件
- **AND** 从数据库中移除元数据记录

#### Scenario: 浏览 Skill 文件
- **WHEN** 用户查看一个 Skill 的详情
- **THEN** 系统列出该 Skill 目录下的所有文件和子目录
- **AND** 显示文件大小、修改时间等信息

#### Scenario: 导出 Skill 包
- **WHEN** 用户选择导出一个 Skill
- **THEN** 系统将该 Skill 目录下的所有文件打包为 ZIP
- **AND** 在 ZIP 中包含 `skill.json` 元数据文件（名称、描述、版本）
- **AND** 弹出保存对话框让用户选择保存位置

### Requirement: 批量导入导出

系统 SHALL 支持 Prompt 和 Skill 的批量导入导出。

#### Scenario: 导出 Prompt 为 JSON
- **WHEN** 用户选择导出所有或部分 Prompt
- **THEN** 系统生成包含 Prompt 数据的 JSON 文件
- **AND** 弹出保存对话框

#### Scenario: 从 JSON 导入 Prompt
- **WHEN** 用户选择一个 JSON 文件导入
- **THEN** 系统解析文件并批量创建 Prompt 记录
- **AND** 跳过同名 Prompt 并报告导入结果（成功数、跳过数、失败数）

#### Scenario: 导出所有 Skill
- **WHEN** 用户选择批量导出所有 Skill
- **THEN** 系统将所有 Skill 打包为一个 ZIP 文件
- **AND** 每个 Skill 作为 ZIP 中的一个子目录

#### Scenario: 批量导入 Skill
- **WHEN** 用户选择一个包含多个 Skill 的 ZIP 文件导入
- **THEN** 系统识别并解压每个 Skill 子目录
- **AND** 批量创建数据库记录
- **AND** 报告导入结果

### Requirement: 仪表盘概览

系统 SHALL 提供仪表盘页面展示统计数据。

#### Scenario: 查看概览
- **WHEN** 用户打开应用或导航到仪表盘
- **THEN** 显示 Prompt 总数、Skill 总数
- **AND** 显示最近添加/修改的 Prompt 和 Skill 列表

## MODIFIED Requirements

无（全新项目）

## REMOVED Requirements

无

## UI 设计要点

- **侧边栏导航**：左侧固定导航栏，包含仪表盘、Prompt、Skill、设置四个入口
- **内容区**：右侧主内容区域，根据导航切换视图
- **响应式布局**：支持窗口缩放，内容区自适应
- **深色/浅色主题**：通过设置切换，使用 CSS 变量实现
- **操作反馈**：所有操作通过 Toast 消息提示结果
- **确认对话框**：删除等危险操作前弹出确认框
- **模态框编辑**：新建/编辑使用模态框，避免页面跳转

## 影响范围

- **新增代码**：整个项目为全新创建
- **依赖项**：
  - `github.com/wailsapp/wails/v2` — Wails 框架
  - `modernc.org/sqlite` — 纯 Go SQLite 驱动
- **平台支持**：Windows（主要目标）、macOS、Linux
