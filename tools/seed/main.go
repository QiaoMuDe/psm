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
	Name     string
	Content  string
	Category string
	Tags     string
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
		Name:     "多语言翻译",
		Content:  "请将以下内容翻译成{目标语言}，保持专业术语的准确性，同时确保译文自然流畅：\n\n",
		Category: "通用",
		Tags:     `["翻译","多语言","通用"]`,
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
	stmt, err := db.Prepare("INSERT INTO prompts (name, content, category, tags) VALUES (?, ?, ?, ?)")
	if err != nil {
		fmt.Printf("失败: %v\n", err)
		os.Exit(1)
	}
	defer func() { _ = stmt.Close() }()

	for _, p := range testPrompts {
		if _, err := stmt.Exec(p.Name, p.Content, p.Category, p.Tags); err != nil {
			fmt.Printf("失败: %v\n", err)
			os.Exit(1)
		}
	}
	fmt.Printf("完成 (共 %d 条)\n", len(testPrompts))

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
	fmt.Printf("Prompt: %d 条\n", len(testPrompts))
	fmt.Printf("Skill:  %d 个\n", len(testSkills))
	fmt.Println("\n提示: 请重启 PSM 应用或刷新页面查看测试数据")
}
