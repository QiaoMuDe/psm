# 仪表盘置顶内容模块实现计划

## 目标
在仪表盘新增置顶内容模块，显示置顶的 Prompt 和 Skill（各最多 3 个），点击可跳转到对应模块。

## 实现步骤

### 1. 后端：新增置顶查询方法
- `internal/service/prompt.go`：新增 `GetPinnedPrompts(limit int)` 方法
- `internal/service/skill.go`：新增 `GetPinnedSkills(limit int)` 方法
- SQL：`SELECT * FROM prompts/skills WHERE is_pinned = 1 ORDER BY updated_at DESC LIMIT ?`

### 2. Handler 层：暴露新接口
- `internal/handler/prompt.go`：新增 `GetPinnedPrompts(limit int)` 方法
- `internal/handler/skill.go`：新增 `GetPinnedSkills(limit int)` 方法

### 3. 前端 API 层
- `frontend/js/api.js`：新增 `getPinnedPrompts(limit)` 和 `getPinnedSkills(limit)` 方法

### 4. 仪表盘 UI
- `frontend/js/views/dashboard.js`：新增置顶内容卡片区域

### 5. CSS 样式
- `frontend/css/components.css`：新增置顶列表样式

## 修改文件清单
1. `internal/service/prompt.go`
2. `internal/service/skill.go`
3. `internal/handler/prompt.go`
4. `internal/handler/skill.go`
5. `frontend/js/api.js`
6. `frontend/js/views/dashboard.js`
7. `frontend/css/components.css`
