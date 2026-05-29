# 验证清单

## 项目初始化

- [x] Wails 项目骨架创建成功，`wails dev` 能正常启动
- [x] `internal/` 目录结构完整（db、service、utils）
- [x] `modernc.org/sqlite` 依赖引入成功，`go mod tidy` 无报错

## 数据库层

- [x] SQLite 数据库文件自动创建，WAL 模式已启用
- [x] settings、prompts、skills 三张表自动建表成功
- [x] 默认设置（skill_storage_path、app_theme）自动插入

## 设置服务

- [x] 能读取所有设置项
- [x] 能更新单个设置项
- [x] 能批量更新设置
- [x] 修改 skill_storage_path 时自动创建目录

## Prompt 服务

- [x] 创建 Prompt：名称、内容、分类、标签正确保存
- [x] 查询 Prompt：支持按名称/内容模糊搜索
- [x] 查询 Prompt：支持按分类筛选
- [x] 更新 Prompt：字段更新正确，updated_at 自动刷新
- [x] 删除 Prompt：记录正确移除
- [x] 导出 Prompt：生成有效 JSON 文件
- [x] 导入 Prompt：JSON 解析正确，同名跳过，返回导入统计

## Skill 服务

- [x] 创建空 Skill：目录创建成功，数据库记录正确
- [x] 导入 Skill 包：ZIP 解压到正确目录，数据库记录创建
- [x] 查询 Skill：列表和详情查询正确
- [x] 更新 Skill 元数据：字段更新正确
- [x] 删除 Skill：可选删除文件，数据库记录正确移除
- [x] 导出 Skill：ZIP 包含所有文件和 skill.json 元数据
- [x] 浏览 Skill 文件：正确列出目录内容

## 工具函数

- [x] ZIP 压缩/解压：标准 ZIP 格式兼容
- [x] JSON 导入导出：格式正确，可被外部工具解析
- [x] 路径拼接：相对路径 + 存储路径正确拼接

## Wails 绑定

- [x] App startup 生命周期：数据库初始化、目录创建
- [x] App shutdown 生命周期：数据库正常关闭
- [x] 所有 service 方法可通过前端 Wails 绑定调用

## 前端基础

- [x] 侧边栏导航：四个入口（仪表盘、Prompt、Skill、设置）可切换
- [x] 内容区：根据导航正确切换视图
- [x] API 封装层：Wails 调用统一处理，错误有 Toast 提示
- [x] 模态框组件：打开/关闭/内容填充正常
- [x] Toast 组件：成功/错误/警告消息正确显示
- [x] 确认对话框：确认/取消回调正常

## 仪表盘视图

- [x] 统计卡片正确显示 Prompt 和 Skill 总数
- [x] 最近添加/修改的列表正确展示

## Prompt 管理视图

- [x] 列表页正确展示所有 Prompt
- [x] 搜索框输入关键词实时过滤
- [x] 分类筛选下拉框正常工作
- [x] 新建 Prompt 模态框表单提交成功
- [x] 编辑 Prompt 模态框回填数据正确
- [x] 删除 Prompt 有确认提示
- [x] 批量导出生成 JSON 文件
- [x] 批量导入从 JSON 文件加载

## Skill 管理视图

- [x] 列表页正确展示所有 Skill
- [x] 新建 Skill 模态框表单提交成功
- [x] 编辑 Skill 元数据回填正确
- [x] 导入 Skill 包：文件选择 → 解压 → 记录创建
- [x] 导出 Skill 包：打包 → 保存对话框
- [x] Skill 详情页：文件列表正确展示
- [x] 删除 Skill：提示是否删除文件，操作正确

## 设置视图

- [x] Skill 存储路径设置正确回填
- [x] 修改路径后保存成功
- [x] 主题切换（浅色/深色）立即生效
- [x] 主题设置重启后保持

## 主题与 UI

- [x] 浅色主题样式正确
- [x] 深色主题样式正确
- [x] 主题切换通过 CSS 变量实现，无闪烁
- [x] 窗口缩放时布局自适应

## 构建验证

- [x] `wails build` 构建成功，无报错
- [x] 构建产物可正常运行
- [x] 所有 CRUD 操作端到端验证通过
- [x] 导入导出端到端验证通过
