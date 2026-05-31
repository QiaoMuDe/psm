// Package main 测试数据注入脚本
// 用法: go run tools/seed/main.go
// 功能: 向 ~/.psm/data.db 注入测试 Prompt 和 Skill 数据
package main

import (
	"database/sql"
	"fmt"
	"os"
	"path/filepath"

	_ "modernc.org/sqlite"
)

// testPrompt 测试用 Prompt 数据
type testPrompt struct {
	Name       string
	Content    string
	Category   string
	Tags       string
	IsTemplate bool
}

// testSkill 测试用 Skill 数据
type testSkill struct {
	Name        string
	Description string
	SKILLMD     string
}

var testPrompts = []testPrompt{
	{
		Name:     "代码审查助手",
		Content:  "请帮我审查以下代码，关注性能、安全性和可读性方面的问题，并给出改进建议：\n\n",
		Category: "开发",
		Tags:     `["代码审查","开发","质量"]`,
	},
	{
		Name:     "SQL 查询优化",
		Content:  "请分析以下 SQL 查询的执行计划，并给出优化建议：\n\nSELECT * FROM users WHERE status = 'active';\n\n关注点：索引使用、JOIN 优化、子查询改写。",
		Category: "数据库",
		Tags:     `["SQL","优化","数据库"]`,
	},
	{
		Name:     "API 文档生成",
		Content:  "根据以下代码自动生成 RESTful API 文档，包括：\n1. 接口路径和方法\n2. 请求参数说明\n3. 返回值结构\n4. 错误码说明\n\n代码：\n",
		Category: "开发",
		Tags:     `["API","文档","REST"]`,
	},
	{
		Name:     "单元测试生成",
		Content:  "请为以下函数编写单元测试，覆盖正常路径、边界条件和异常情况：\n\n",
		Category: "开发",
		Tags:     `["测试","Go","单元测试"]`,
	},
	{
		Name:     "Git 提交信息",
		Content:  "请根据以下代码变更生成符合 Conventional Commits 规范的 Git 提交信息：\n\n变更内容：\n",
		Category: "工具",
		Tags:     `["Git","提交","规范"]`,
	},
	{
		Name:     "需求分析助手",
		Content:  "请帮我分析以下需求文档，提取：\n1. 核心功能点\n2. 技术难点\n3. 可能的风险点\n4. 建议的技术方案\n\n需求文档：\n",
		Category: "产品",
		Tags:     `["需求","分析","产品"]`,
	},
	{
		Name:     "性能瓶颈分析",
		Content:  "请分析以下系统的性能瓶颈，并给出优化方案：\n\n系统描述：\n当前 QPS：\n响应时间：\n\n请从以下几个维度分析：\n- 数据库查询\n- 缓存策略\n- 并发处理\n- 网络 IO",
		Category: "运维",
		Tags:     `["性能","优化","运维"]`,
	},
	{
		Name:     "正则表达式生成",
		Content:  "请根据以下需求生成对应的正则表达式，并解释每个部分的含义：\n\n匹配需求：\n\n同时提供几个测试用例验证正则的正确性。",
		Category: "开发",
		Tags:     `["正则","开发","文本处理"]`,
	},
	{
		Name:     "技术方案评审",
		Content:  "请对以下技术方案进行评审，从可行性、扩展性、安全性三个角度给出意见：\n\n方案描述：\n",
		Category: "产品",
		Tags:     `["技术方案","评审","架构"]`,
	},
	{
		Name:     "Dockerfile 生成",
		Content:  "请根据以下项目信息生成 optimized 的 Dockerfile：\n\n项目语言：\n项目框架：\n依赖文件：\n\n要求使用多阶段构建，最终镜像尽可能小。",
		Category: "运维",
		Tags:     `["Docker","容器化","部署"]`,
	},
	{
		Name:     "错误日志分析",
		Content:  "请分析以下错误日志，定位问题原因并给出修复建议：\n\n错误日志：\n\n请给出：\n1. 错误根因\n2. 影响范围\n3. 修复方案\n4. 预防措施",
		Category: "运维",
		Tags:     `["日志","调试","排障"]`,
	},
	{
		Name:     "数据库表设计",
		Content:  "请根据以下业务需求设计数据库表结构，要求符合第三范式：\n\n业务需求：\n\n请输出：\n1. ER 关系图描述\n2. 建表 SQL\n3. 索引建议",
		Category: "数据库",
		Tags:     `["数据库","表设计","SQL"]`,
	},
	{
		Name:     "代码重构建议",
		Content:  "请分析以下代码，识别 code smell 并给出重构建议：\n\n```go\n// 待重构代码\n```\n\n请给出重构后的代码和变更说明。",
		Category: "开发",
		Tags:     `["重构","代码质量","最佳实践"]`,
	},
	{
		Name:     "周报生成器",
		Content:  "请根据以下工作记录生成一份结构化的周报：\n\n本周完成：\n进行中：\n下周计划：\n遇到的问题：\n\n格式要求：简洁、有数据支撑、突出成果。",
		Category: "通用",
		Tags:     `["周报","汇报","通用"]`,
	},
	{
		Name:     "接口联调文档",
		Content:  "请根据以下接口定义生成前后端联调文档：\n\n接口路径：\n请求方法：\n请求参数：\n返回结构：\n\n要求包含：请求示例、响应示例、错误码说明。",
		Category: "开发",
		Tags:     `["接口","联调","前后端"]`,
	},
	{
		Name:       "多语言翻译",
		Content:    "请将以下内容翻译成{{目标语言}}，保持专业术语的准确性，同时确保译文自然流畅：\n\n",
		Category:   "通用",
		Tags:       `["翻译","多语言","通用"]`,
		IsTemplate: true,
	},
	{
		Name:       "代码助手",
		Content:    "你是一个{{语言|Go}}专家，请用{{风格|简洁专业}}的风格回答以下问题：\n\n",
		Category:   "通用",
		Tags:       `["通用","AI","角色扮演"]`,
		IsTemplate: true,
	},
	{
		Name:       "Prompt 优化器",
		Content:    "请帮我优化以下 Prompt，使其更加{{目标|清晰有效}}：\n\n原始 Prompt：\n\n优化要求：\n- 保持{{语言|中文}}表达\n- 增加{{方面|结构化}}\n- 控制在 {{字数|500}} 字以内\n\n输出优化后的 Prompt 并说明改进点。",
		Category:   "产品",
		Tags:       `["Prompt","优化","AI"]`,
		IsTemplate: true,
	},
	{
		Name:       "API 接口设计",
		Content:    "请为以下业务场景设计 RESTful API 接口：\n\n业务场景：{{场景}}\n\n要求：\n- 使用 {{风格|RESTful}} 风格\n- 返回格式统一为 JSON\n- 包含 {{版本|v1}} 版本号\n- 考虑分页（每页 {{页大小|20}} 条）\n\n请输出：接口路径、请求方法、参数说明、返回结构。",
		Category:   "开发",
		Tags:       `["API","设计","接口"]`,
		IsTemplate: true,
	},
	{
		Name:       "技术文档撰写",
		Content:    "请根据以下信息撰写一份技术文档：\n\n主题：{{主题}}\n目标读者：{{读者|开发者}}\n文档深度：{{深度|中等}}\n\n要求：\n- 使用 {{格式|Markdown}} 格式\n- 包含概述、架构、使用指南、常见问题\n- 语言{{语言|中文}}",
		Category:   "开发",
		Tags:       `["文档","技术","写作"]`,
		IsTemplate: true,
	},
	{
		Name:       "Bug 分析报告",
		Content:    "请分析以下 Bug 并生成结构化报告：\n\nBug 描述：{{描述}}\n复现步骤：{{步骤}}\n期望行为：{{期望}}\n实际行为：{{实际}}\n\n请从以下维度分析：\n1. 根因分析（{{分析深度|初步分析}}）\n2. 影响范围（{{影响|单个功能}}）\n3. 修复方案\n4. 预防措施",
		Category:   "开发",
		Tags:       `["Bug","调试","分析"]`,
		IsTemplate: true,
	},
}

var testSkills = []testSkill{
	{
		Name:        "go-kit-core",
		Description: "go-kit 项目综合技能。当用户需要使用 go-kit 工具库中的 id（ID生成）、str（字符串处理）、utils（通用工具）子包时触发。",
		SKILLMD: `---
name: go-kit-core
description: go-kit 项目综合技能。当用户需要使用 go-kit 工具库中的 id（ID生成）、str（字符串处理）、utils（通用工具）子包时触发。
---

# go-kit-core

## 概述

这是一个综合性的 go-kit 工具库技能，包含以下模块：

## id 模块

ID 生成工具，支持雪花算法、UUID 等。

## str 模块

字符串处理工具，包含加密、编码、格式化等功能。

## utils 模块

通用工具集，包含时间处理、文件操作、HTTP 客户端等。
`,
	},
	{
		Name:        "wails-desktop",
		Description: "Wails v2 桌面应用开发技能。包含项目初始化、前后端通信、数据库集成、构建打包等完整开发指南。",
		SKILLMD: `---
name: wails-desktop
description: Wails v2 桌面应用开发技能。包含项目初始化、前后端通信、数据库集成、构建打包等完整开发指南。
---

# wails-desktop

## 概述

Wails v2 桌面应用开发框架的使用指南。

## 项目结构

- main.go: 应用入口
- app.go: 主应用结构体
- frontend/: 前端资源

## 前后端通信

使用 Wails Bind 机制实现 Go 方法暴露给前端 JS 调用。

## 数据库集成

推荐使用 modernc.org/sqlite（纯 Go 实现，无需 CGO）。
`,
	},
	{
		Name:        "docker-deploy",
		Description: "Docker 容器化部署技能。涵盖 Dockerfile 编写、docker-compose 编排、多阶段构建、镜像优化等最佳实践。",
		SKILLMD: `---
name: docker-deploy
description: Docker 容器化部署技能。涵盖 Dockerfile 编写、docker-compose 编排、多阶段构建、镜像优化等最佳实践。
---

# docker-deploy

## Dockerfile 最佳实践

### 多阶段构建

使用多阶段构建减小镜像体积。

### 层缓存优化

合理安排指令顺序，利用 Docker 层缓存。

## docker-compose

服务编排、网络配置、数据卷管理。
`,
	},
	{
		Name:        "gin-web",
		Description: "Gin Web 框架开发技能。包含路由定义、中间件、参数绑定、数据库操作、JWT 认证等 Web 开发指南。",
		SKILLMD: `---
name: gin-web
description: Gin Web 框架开发技能。包含路由定义、中间件、参数绑定、数据库操作、JWT 认证等 Web 开发指南。
---

# gin-web

## 路由定义

使用 gin.RouterGroup 进行路由分组管理。

## 中间件

自定义中间件实现日志、认证、CORS 等功能。

## 参数绑定

使用 Binding tag 实现请求参数自动验证。
`,
	},
	{
		Name:        "k8s-ops",
		Description: "Kubernetes 运维技能。涵盖 Pod 管理、Deployment 配置、Service 暴露、ConfigMap/Secret 管理等集群运维操作。",
		SKILLMD: `---
name: k8s-ops
description: Kubernetes 运维技能。涵盖 Pod 管理、Deployment 配置、Service 暴露、ConfigMap/Secret 管理等集群运维操作。
---

# k8s-ops

## Pod 管理

kubectl 常用命令、Pod 调试、日志查看。

## Deployment

滚动更新、回滚、扩缩容策略配置。

## Service

ClusterIP、NodePort、LoadBalancer 三种暴露方式。
`,
	},
	{
		Name:        "react-antd",
		Description: "React + Ant Design 前端开发技能。包含组件开发、状态管理、路由配置、表单处理、表格渲染等企业级中后台开发实践。",
		SKILLMD: `---
name: react-antd
description: React + Ant Design 前端开发技能。包含组件开发、状态管理、路由配置、表单处理、表格渲染等企业级中后台开发实践。
---

# react-antd

## 组件开发

函数式组件 + Hooks 开发模式。

## 状态管理

Zustand / Redux Toolkit 状态管理方案。

## 表单处理

Form.Item + Form.useForm 表单联动与验证。

## 表格

ProTable 复杂表格封装与数据处理。
`,
	},
	{
		Name:        "redis-cache",
		Description: "Redis 缓存设计技能。涵盖缓存策略（旁路/穿透/雪崩）、分布式锁、排行榜、消息队列等 Redis 高级应用模式。",
		SKILLMD: `---
name: redis-cache
description: Redis 缓存设计技能。涵盖缓存策略（旁路/穿透/雪崩）、分布式锁、排行榜、消息队列等 Redis 高级应用模式。
---

# redis-cache

## 缓存策略

- 旁路缓存：先查缓存，miss 后查 DB 并回填
- 缓存穿透：布隆过滤器 / 空值缓存
- 缓存雪崩：随机过期时间 + 预热

## 分布式锁

SETNX + 过期时间实现，Redlock 算法。

## 排行榜

ZSET 实现实时排行榜，ZADD / ZRANGE / ZREVRANGE。
`,
	},
	{
		Name:        "golang-concurrency",
		Description: "Go 并发编程技能。包含 goroutine 调度、channel 模式、sync 包使用、errgroup 并发控制、并发安全数据结构等。",
		SKILLMD: `---
name: golang-concurrency
description: Go 并发编程技能。包含 goroutine 调度、channel 模式、sync 包使用、errgroup 并发控制、并发安全数据结构等。
---

# golang-concurrency

## Channel 模式

fan-in、fan-out、pipeline、worker pool 等常用模式。

## errgroup

golang.org/x/sync/errgroup 实现并发任务与错误收集。

## sync 包

Mutex、RWMutex、WaitGroup、Once、Map 的使用场景。

## 并发安全

atomic 操作、无锁数据结构、context 取消传播。
`,
	},
	{
		Name:        "vue3-ts",
		Description: "Vue 3 + TypeScript 前端开发技能。包含 Composition API、Pinia 状态管理、Vue Router、组件库集成等现代 Vue 开发实践。",
		SKILLMD: `---
name: vue3-ts
description: Vue 3 + TypeScript 前端开发技能。包含 Composition API、Pinia 状态管理、Vue Router、组件库集成等现代 Vue 开发实践。
---

# vue3-ts

## Composition API

ref、reactive、computed、watch 的使用模式。

## Pinia 状态管理

Store 定义、Getters、Actions、模块化。

## Vue Router

路由守卫、动态路由、嵌套路由。

## TypeScript 集成

Props 类型定义、Emits 类型、Provide/Inject 类型。
`,
	},
	{
		Name:        "grpc-go",
		Description: "gRPC Go 开发技能。包含 Protobuf 定义、服务端/客户端实现、拦截器、流式传输、负载均衡等 gRPC 全栈开发指南。",
		SKILLMD: `---
name: grpc-go
description: gRPC Go 开发技能。包含 Protobuf 定义、服务端/客户端实现、拦截器、流式传输、负载均衡等 gRPC 全栈开发指南。
---

# grpc-go

## Protobuf 定义

.proto 文件编写、消息类型、服务定义。

## 服务端实现

gRPC Server 启动、服务注册、优雅关闭。

## 拦截器

Unary/Stream 拦截器实现日志、认证、限流。

## 流式传输

Server Streaming、Client Streaming、Bidirectional Streaming。
`,
	},
	{
		Name:        "pytest-best",
		Description: "Python pytest 测试技能。包含 fixture、参数化、mock、插件使用、测试覆盖率分析等 Python 测试最佳实践。",
		SKILLMD: `---
name: pytest-best
description: Python pytest 测试技能。包含 fixture、参数化、mock、插件使用、测试覆盖率分析等 Python 测试最佳实践。
---

# pytest-best

## Fixture

setup/teardown、作用域、依赖注入。

## 参数化测试

@pytest.mark.parametrize 多组数据驱动测试。

## Mock

unittest.mock / pytest-mock 模拟外部依赖。

## 覆盖率

pytest-cov 生成覆盖率报告，配置排除规则。
`,
	},
	{
		Name:        "terraform-aws",
		Description: "Terraform AWS 基础设施即代码技能。包含 Provider 配置、资源定义、模块化、状态管理、CI/CD 集成等云基础设施管理指南。",
		SKILLMD: `---
name: terraform-aws
description: Terraform AWS 基础设施即代码技能。包含 Provider 配置、资源定义、模块化、状态管理、CI/CD 集成等云基础设施管理指南。
---

# terraform-aws

## Provider 配置

AWS Provider 版本锁定、认证配置、区域设置。

## 资源管理

EC2、RDS、S3、VPC 等核心资源定义。

## 模块化

可复用模块设计、输入输出变量、模块版本管理。

## 状态管理

远程状态存储、状态锁、导入已有资源。
`,
	},
	{
		Name:        "tailwind-css",
		Description: "Tailwind CSS 原子化样式技能。包含配置优化、响应式设计、暗色模式、自定义主题、组件封装等实用优先 CSS 开发指南。",
		SKILLMD: `---
name: tailwind-css
description: Tailwind CSS 原子化样式技能。包含配置优化、响应式设计、暗色模式、自定义主题、组件封装等实用优先 CSS 开发指南。
---

# tailwind-css

## 配置优化

tailwind.config.js 自定义主题、插件、内容扫描路径。

## 响应式设计

sm/md/lg/xl 断点使用、移动端优先策略。

## 暗色模式

dark: 变体、class/媒体查询切换策略。

## 组件封装

@apply 指令、组件提取模式、CVA 变体管理。
`,
	},
	{
		Name:        "github-actions",
		Description: "GitHub Actions CI/CD 技能。包含工作流编写、矩阵构建、缓存策略、Secrets 管理、自定义 Action 开发等自动化流水线指南。",
		SKILLMD: `---
name: github-actions
description: GitHub Actions CI/CD 技能。包含工作流编写、矩阵构建、缓存策略、Secrets 管理、自定义 Action 开发等自动化流水线指南。
---

# github-actions

## 工作流编写

YAML 语法、触发器、Jobs、Steps。

## 矩阵构建

多平台/多版本并行测试策略。

## 缓存

actions/cache 加速依赖安装、构建缓存。

## 自定义 Action

JavaScript/Composite/Docker Action 开发与发布。
`,
	},
	{
		Name:        "flutter-mobile",
		Description: "Flutter 移动端开发技能。包含 Widget 体系、状态管理、路由导航、原生集成、性能优化等跨平台移动应用开发指南。",
		SKILLMD: `---
name: flutter-mobile
description: Flutter 移动端开发技能。包含 Widget 体系、状态管理、路由导航、原生集成、性能优化等跨平台移动应用开发指南。
---

# flutter-mobile

## Widget 体系

StatelessWidget / StatefulWidget、BuildContext。

## 状态管理

Provider / Riverpod / BLoC 模式选择。

## 路由导航

Navigator 2.0、命名路由、路由守卫。

## 性能优化

const 构造函数、RepaintBoundary、DevTools 分析。
`,
	},
}

func main() {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		fmt.Printf("获取用户主目录失败: %v\n", err)
		os.Exit(1)
	}

	dbPath := filepath.Join(homeDir, ".psm", "data.db")
	if _, err := os.Stat(dbPath); os.IsNotExist(err) {
		fmt.Printf("数据库文件不存在: %s\n", dbPath)
		fmt.Println("请先启动 PSM 应用初始化数据库")
		os.Exit(1)
	}

	db, err := sql.Open("sqlite", dbPath)
	if err != nil {
		fmt.Printf("打开数据库失败: %v\n", err)
		os.Exit(1)
	}
	defer func() { _ = db.Close() }()

	fmt.Println("=== PSM 测试数据注入脚本 ===")
	fmt.Printf("数据库: %s\n\n", dbPath)

	fmt.Print("[1/3] 清理旧测试数据... ")
	if _, err := db.Exec("DELETE FROM prompts"); err != nil {
		fmt.Printf("失败: %v\n", err)
		os.Exit(1)
	}
	if _, err := db.Exec("DELETE FROM skills"); err != nil {
		fmt.Printf("失败: %v\n", err)
		os.Exit(1)
	}
	fmt.Println("完成")

	fmt.Print("[2/3] 注入测试 Prompt... ")
	stmt, err := db.Prepare("INSERT INTO prompts (name, content, category, tags, is_template) VALUES (?, ?, ?, ?, ?)")
	if err != nil {
		fmt.Printf("失败: %v\n", err)
		os.Exit(1)
	}
	defer func() { _ = stmt.Close() }()

	for _, p := range testPrompts {
		isTemplate := 0
		if p.IsTemplate {
			isTemplate = 1
		}
		if _, err := stmt.Exec(p.Name, p.Content, p.Category, p.Tags, isTemplate); err != nil {
			fmt.Printf("失败: %v\n", err)
			os.Exit(1)
		}
	}
	fmt.Printf("完成 (共 %d 条，其中模板 %d 条)\n", len(testPrompts), countTemplates(testPrompts))

	fmt.Print("[3/3] 注入测试 Skill... ")

	storagePath := filepath.Join(homeDir, ".psm", "skills")
	_ = os.MkdirAll(storagePath, 0755)

	skillStmt, err := db.Prepare("INSERT INTO skills (name, description, relative_path) VALUES (?, ?, ?)")
	if err != nil {
		fmt.Printf("失败: %v\n", err)
		os.Exit(1)
	}
	defer func() { _ = skillStmt.Close() }()

	for _, s := range testSkills {
		skillDir := filepath.Join(storagePath, s.Name)
		_ = os.MkdirAll(skillDir, 0755)

		skillMDPath := filepath.Join(skillDir, "SKILL.md")
		if err := os.WriteFile(skillMDPath, []byte(s.SKILLMD), 0644); err != nil {
			fmt.Printf("写入 SKILL.md 失败: %v\n", err)
			os.Exit(1)
		}

		if _, err := skillStmt.Exec(s.Name, s.Description, s.Name); err != nil {
			fmt.Printf("失败: %v\n", err)
			os.Exit(1)
		}
	}
	fmt.Printf("完成 (共 %d 个)\n\n", len(testSkills))

	fmt.Println("=== 注入完成 ===")
	fmt.Printf("Prompt: %d 条 (普通 %d + 模板 %d)\n", len(testPrompts), len(testPrompts)-countTemplates(testPrompts), countTemplates(testPrompts))
	fmt.Printf("Skill:  %d 个\n", len(testSkills))
	fmt.Println("\n提示: 请重启 PSM 应用或刷新页面查看测试数据")
}

// countTemplates 统计模板 Prompt 的数量
func countTemplates(prompts []testPrompt) int {
	count := 0
	for _, p := range prompts {
		if p.IsTemplate {
			count++
		}
	}
	return count
}
