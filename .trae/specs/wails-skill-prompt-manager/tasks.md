# Tasks

## 阶段一：项目初始化与基础设施

- [ ] Task 1: 初始化 Wails 项目骨架
  - [ ] SubTask 1.1: 使用 `wails init` 创建项目，选择 vanilla 模板
  - [ ] SubTask 1.2: 配置 `wails.json`（应用名称、窗口尺寸、构建选项）
  - [ ] SubTask 1.3: 创建 `internal/` 目录结构（db、service、utils）
  - [ ] SubTask 1.4: 引入依赖 `modernc.org/sqlite`

- [ ] Task 2: 实现数据库层
  - [ ] SubTask 2.1: 创建 `internal/db/sqlite.go`，实现数据库初始化与 WAL 模式
  - [ ] SubTask 2.2: 创建 `internal/db/models.go`，定义 Settings、Prompt、Skill 数据结构
  - [ ] SubTask 2.3: 实现建表迁移（settings、prompts、skills 三张表）
  - [ ] SubTask 2.4: 插入默认设置（skill_storage_path、app_theme）

## 阶段二：后端服务层

- [ ] Task 3: 实现设置服务 (`internal/service/settings.go`)
  - [ ] SubTask 3.1: GetSettings — 读取所有设置
  - [ ] SubTask 3.2: UpdateSetting — 更新单个设置项
  - [ ] SubTask 3.3: UpdateSettings — 批量更新设置（保存时调用）
  - [ ] SubTask 3.4: GetSkillStoragePath — 获取 Skill 存储绝对路径

- [ ] Task 4: 实现 Prompt 服务 (`internal/service/prompt.go`)
  - [ ] SubTask 4.1: CreatePrompt — 创建 Prompt
  - [ ] SubTask 4.2: GetPrompt / GetPrompts — 查询单个/列表（支持搜索和分类筛选）
  - [ ] SubTask 4.3: UpdatePrompt — 更新 Prompt
  - [ ] SubTask 4.4: DeletePrompt — 删除 Prompt
  - [ ] SubTask 4.5: ExportPrompts — 导出为 JSON
  - [ ] SubTask 4.6: ImportPrompts — 从 JSON 导入（去重处理）

- [ ] Task 5: 实现 Skill 服务 (`internal/service/skill.go`)
  - [ ] SubTask 5.1: CreateSkill — 创建空 Skill（创建目录 + 写入数据库）
  - [ ] SubTask 5.2: GetSkill / GetSkills — 查询单个/列表
  - [ ] SubTask 5.3: UpdateSkill — 更新元数据
  - [ ] SubTask 5.4: DeleteSkill — 删除（可选删除文件）
  - [ ] SubTask 5.5: ImportSkill — 从 ZIP 导入 Skill 包（解压 + 写入数据库）
  - [ ] SubTask 5.6: ExportSkill — 导出为 ZIP（打包文件 + skill.json 元数据）
  - [ ] SubTask 5.7: ListSkillFiles — 列出 Skill 目录下的文件

- [ ] Task 6: 实现工具函数 (`internal/utils/`)
  - [ ] SubTask 6.1: `archive.go` — 压缩/解压 ZIP 工具函数
  - [ ] SubTask 6.2: `export.go` — JSON 导入导出格式处理
  - [ ] SubTask 6.3: `path.go` — 路径拼接与验证工具

## 阶段三：Wails 绑定与入口

- [ ] Task 7: 实现 App 主结构 (`app.go`)
  - [ ] SubTask 7.1: 定义 App 结构体，持有 db 和 service 实例
  - [ ] SubTask 7.2: 实现 startup 生命周期（初始化数据库、创建目录）
  - [ ] SubTask 7.3: 实现 shutdown 生命周期（关闭数据库）
  - [ ] SubTask 7.4: 将 service 方法绑定到 App（作为公开方法供前端调用）

- [ ] Task 8: 配置 Wails 构建 (`main.go` + `wails.json`)
  - [ ] SubTask 8.1: 配置窗口标题、尺寸、背景色
  - [ ] SubTask 8.2: 配置 assets 嵌入（frontend 目录）
  - [ ] SubTask 8.3: 验证 `wails dev` 能正常启动

## 阶段四：前端基础框架

- [ ] Task 9: 构建前端页面骨架
  - [ ] SubTask 9.1: 编写 `index.html`（侧边栏 + 内容区布局）
  - [ ] SubTask 9.2: 编写 `css/style.css`（CSS 变量、布局、组件样式）
  - [ ] SubTask 9.3: 实现 `js/app.js`（SPA 路由，侧边栏导航切换）
  - [ ] SubTask 9.4: 实现 `js/api.js`（封装 Wails 绑定调用，统一错误处理）

- [ ] Task 10: 实现通用组件
  - [ ] SubTask 10.1: `modal.js` — 模态框（打开/关闭/内容填充）
  - [ ] SubTask 10.2: `toast.js` — 消息提示（成功/错误/警告/信息）
  - [ ] SubTask 10.3: `confirm.js` — 确认对话框

## 阶段五：前端视图实现

- [ ] Task 11: 仪表盘视图 (`views/dashboard.js`)
  - [ ] SubTask 11.1: 统计卡片（Prompt 总数、Skill 总数）
  - [ ] SubTask 11.2: 最近添加/修改的 Prompt 列表
  - [ ] SubTask 11.3: 最近添加/修改的 Skill 列表

- [ ] Task 12: Prompt 管理视图 (`views/prompts.js`)
  - [ ] SubTask 12.1: Prompt 列表页（表格展示，支持搜索和分类筛选）
  - [ ] SubTask 12.2: 新建/编辑 Prompt 模态框（名称、内容、分类、标签）
  - [ ] SubTask 12.3: 删除确认与操作
  - [ ] SubTask 12.4: 批量导出按钮（导出为 JSON 文件）
  - [ ] SubTask 12.5: 批量导入按钮（从 JSON 文件导入）

- [ ] Task 13: Skill 管理视图 (`views/skills.js`)
  - [ ] SubTask 13.1: Skill 列表页（卡片/表格展示，显示名称、描述、版本、文件数）
  - [ ] SubTask 13.2: 新建 Skill 模态框（名称、描述、版本）
  - [ ] SubTask 13.3: 编辑 Skill 元数据
  - [ ] SubTask 13.4: 导入 Skill 包（选择 ZIP 文件）
  - [ ] SubTask 13.5: 导出 Skill 包（保存为 ZIP）
  - [ ] SubTask 13.6: Skill 详情页 — 文件列表浏览
  - [ ] SubTask 13.7: 删除 Skill（提示是否删除文件）

- [ ] Task 14: 设置视图 (`views/settings.js`)
  - [ ] SubTask 14.1: Skill 存储路径设置（文本输入 + 浏览按钮）
  - [ ] SubTask 14.2: 主题切换（浅色/深色）
  - [ ] SubTask 14.3: 保存设置并反馈

## 阶段六：主题与打磨

- [ ] Task 15: 深色/浅色主题实现
  - [ ] SubTask 15.1: 定义 CSS 变量（亮色主题 + 暗色主题）
  - [ ] SubTask 15.2: 通过 `data-theme` 属性切换主题
  - [ ] SubTask 15.3: 主题设置持久化到数据库

- [ ] Task 16: 构建与测试
  - [ ] SubTask 16.1: `wails build` 验证构建成功
  - [ ] SubTask 16.2: 测试所有 CRUD 操作
  - [ ] SubTask 16.3: 测试导入导出流程
  - [ ] SubTask 16.4: 测试 Skill 文件系统操作

# Task Dependencies

- [Task 2] depends on [Task 1]
- [Task 3, Task 4, Task 5] depend on [Task 2]
- [Task 6] can run in parallel with [Task 3, Task 4, Task 5]
- [Task 7] depends on [Task 3, Task 4, Task 5, Task 6]
- [Task 8] depends on [Task 7]
- [Task 9, Task 10] can run in parallel with [Task 7, Task 8]
- [Task 11, Task 12, Task 13, Task 14] depend on [Task 9, Task 10]
- [Task 15] depends on [Task 9]
- [Task 16] depends on [Task 11, Task 12, Task 13, Task 14, Task 15]
