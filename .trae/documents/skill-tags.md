# Skill 标签功能实现计划

## 一、目标

给 Skill 模块添加标签功能，交互逻辑与 Prompt 模块**完全一致**：
- 创建/编辑 Skill 时可以添加标签（逗号分隔）
- 搜索栏下方显示当前所有 Skill 使用的标签，点击标签自动填充搜索框
- 搜索结果中标签关键词高亮显示
- 卡片/列表视图渲染标签

## 二、统一搜索逻辑（对齐 Prompt）

### 现状对比

| | Prompt | Skill（当前） |
|---|---|---|
| 搜索方式 | 后端 GORM `WHERE LIKE` | 前端 JS `filter()` |
| 标签搜索 | 后端 `tags LIKE ?` | 无 |
| API 参数 | `getPrompts(keyword, category)` | `getSkills()` 无参数 |

### 统一方案

将 Skill 搜索**从前端过滤改为后端过滤**，与 Prompt 完全对齐：

```
改前: API.getSkills() → 返回全部 → 前端 JS filter
改后: API.getSkills(keyword) → 后端 GORM WHERE LIKE → 返回过滤结果
```

统一后两个模块的搜索逻辑完全一致，维护成本降低。

## 三、修改文件清单

| 文件 | 改动 | 说明 |
|------|------|------|
| `internal/db/models.go` | Skill 结构体加 `Tags string` | `gorm:"type:text;not null;default:'[]'"` |
| `internal/service/skill.go` | GetSkills 加 keyword 参数 + tags LIKE；CreateSkill/UpdateSkill 加 tags 参数 | 对齐 Prompt 的搜索模式 |
| `internal/handler/skill.go` | GetSkills 透传 keyword；CreateSkill/UpdateSkill 透传 tags | 参数对齐 |
| `frontend/js/api.js` | `getSkills(keyword)` 加参数；`createSkill`/`updateSkill` 加 tags | API 签名对齐 |
| `frontend/js/views/skills.js` | 搜索/渲染/标签点击/弹窗（详见下方） | 核心前端逻辑 |
| `frontend/css/components.css` | 无需新增 | 全部复用 Prompt 的标签样式 |

## 四、详细实施步骤

### 阶段 1：后端改造

#### 1.1 models.go — Skill 加 Tags 字段

```go
type Skill struct {
    ID           int64          `json:"id" gorm:"primaryKey;autoIncrement"`
    Name         string         `json:"name" gorm:"not null;default:''"`
    Description  string         `json:"description" gorm:"type:text;not null;default:''"`
    RelativePath string         `json:"relative_path" gorm:"not null;default:''"`
    Tags         string         `json:"tags" gorm:"type:text;not null;default:'[]'"`
    IsPinned     bool           `json:"is_pinned" gorm:"not null;default:false"`
    CreatedAt    time.Time      `json:"created_at"`
    UpdatedAt    time.Time      `json:"updated_at"`
    DeletedAt    gorm.DeletedAt `json:"-" gorm:"index"`
}
```

#### 1.2 service/skill.go — 三处改动

**改动 A：GetSkills 加 keyword 参数（对齐 Prompt 的 GetPrompts）**

```go
func (s *SkillService) GetSkills(keyword string) ([]db.Skill, error) {
    var skills []db.Skill
    query := db.DB.Model(&db.Skill{})

    if keyword != "" {
        like := "%" + keyword + "%"
        query = query.Where("name LIKE ? OR description LIKE ? OR tags LIKE ?", like, like, like)
    }

    if err := query.Order("is_pinned DESC, updated_at DESC").Find(&skills).Error; err != nil {
        return nil, fmt.Errorf("查询 Skill 列表失败: %w", err)
    }
    return skills, nil
}
```

**改动 B：CreateSkill 加 tags 参数**

```go
func (s *SkillService) CreateSkill(name, description string, tags []string) (*db.Skill, error) {
    // ...现有逻辑...
    skill := &db.Skill{
        Name:         name,
        Description:  description,
        RelativePath: name,
        Tags:         utils.MustMarshalJSON(tags),
    }
    // ...
}
```

**改动 C：UpdateSkill 加 tags 参数**

```go
func (s *SkillService) UpdateSkill(id int64, name, description string, tags []string) error {
    // ...
    result := db.DB.Model(&db.Skill{}).Where("id = ?", id).Updates(map[string]interface{}{
        "name":        name,
        "description": description,
        "tags":        utils.MustMarshalJSON(tags),
    })
    // ...
}
```

#### 1.3 handler/skill.go — 透传参数

```go
func (h *SkillHandler) GetSkills(keyword string) ([]db.Skill, error) {
    return h.skillSvc.GetSkills(keyword)
}

func (h *SkillHandler) CreateSkill(name, description string, tags []string) (*db.Skill, error) {
    return h.skillSvc.CreateSkill(name, description, tags)
}

func (h *SkillHandler) UpdateSkill(id int64, name, description string, tags []string) error {
    return h.skillSvc.UpdateSkill(id, name, description, tags)
}
```

### 阶段 2：前端 API 适配

#### 2.1 api.js

```js
getSkills: (keyword) => API.call(window.go.main.App.GetSkills, keyword || ''),
createSkill: (name, description, tags) => API.call(window.go.main.App.CreateSkill, name, description, tags),
updateSkill: (id, name, description, tags) => API.call(window.go.main.App.UpdateSkill, Number(id), name, description, tags),
```

### 阶段 3：前端视图改造（skills.js）

#### 3.1 loadSkills() — 改为后端搜索

```js
async loadSkills() {
    // ...现有重置逻辑...
    try {
        let skills = await API.getSkills(SkillsView.currentKeyword);
        this.allSkills = skills;
        // 移除原来的前端 filter 逻辑，后端已过滤
        // ...
    }
}
```

#### 3.2 搜索栏下方显示标签列表

在搜索框和列表之间插入标签筛选栏：

```js
// loadSkills 成功后，渲染标签栏
const tagsBarHtml = this.renderTagsBar(skills);
// 插入到 skill-list 之前
```

`renderTagsBar()` 从 `allSkills` 收集所有去重标签，渲染为可点击的 `<span class="tag tag-sm tag-clickable">`。

**注意**：标签栏显示的是**全部** Skill 的标签（不受搜索过滤），用于发现和导航。需要单独获取全量数据或从 allSkills 取。

#### 3.3 标签点击事件委托

```js
document.getElementById('skill-list').addEventListener('click', (e) => {
    const tagEl = e.target.closest('.tag-clickable');
    if (!tagEl) return;
    e.stopPropagation();
    const tag = tagEl.dataset.tag;
    if (tag) {
        SkillsView.currentKeyword = tag;
        document.getElementById('skill-search').value = tag;
        this.loadSkills();
    }
});
```

#### 3.4 卡片/列表视图渲染标签

**卡片视图**（限制 4 个标签）：
```js
let tags = [];
try { tags = typeof s.tags === 'string' ? JSON.parse(s.tags || '[]') : (s.tags || []); } catch(e) {}
const tagsHtml = tags.slice(0, 4).map(t => 
    `<span class="tag tag-sm tag-primary tag-clickable" data-tag="${escapeHtml(t)}">${highlightText(t, SkillsView.currentKeyword)}</span>`
).join('');
```

**列表视图**（显示全部标签）：
```js
const tagsHtml = tags.map(t => 
    `<span class="tag tag-sm tag-primary tag-clickable" data-tag="${escapeHtml(t)}">${highlightText(t, SkillsView.currentKeyword)}</span>`
).join('');
```

#### 3.5 新建/编辑弹窗加标签输入

新建弹窗表单：
```html
<label class="form-label">标签（逗号分隔）</label>
<input type="text" class="form-input" id="skill-tags" placeholder="tag1, tag2, tag3" />
```

新建提交：
```js
const tagsStr = document.getElementById('skill-tags').value.trim();
const tags = tagsStr ? tagsStr.split(',').map(t => t.trim()) : [];
await API.createSkill(name, description, tags);
```

编辑回显：
```js
const tags = typeof skill.tags === 'string' ? JSON.parse(skill.tags || '[]') : (skill.tags || []);
// 填入 input value
```

#### 3.6 查看详情弹窗显示标签

在 Skill 详情弹窗中显示标签（不带 tag-clickable，因为是模态框）。

### 阶段 4：数据库迁移

GORM AutoMigrate 自动为 skills 表添加 `tags` 列，默认值 `'[]'`，不影响现有数据。

## 五、交互流程

```
用户点击标签
→ tag-clickable 的 data-tag 被读取
→ currentKeyword = tag
→ 搜索框 UI 同步填入标签文本
→ loadSkills() → API.getSkills("tag")
→ 后端: WHERE name LIKE '%tag%' OR description LIKE '%tag%' OR tags LIKE '%tag%'
→ 返回过滤后的 Skill 列表
→ 卡片/列表中标签文本高亮（<mark>标签）
```

## 六、验证清单

- [ ] 新建 Skill 时可以填写标签
- [ ] 编辑 Skill 时可以修改标签
- [ ] 卡片视图显示标签（最多 4 个）
- [ ] 列表视图显示标签（全部）
- [ ] 搜索栏下方显示所有去重标签（不受搜索过滤影响）
- [ ] 点击标签自动填充搜索框并调用后端过滤
- [ ] 搜索结果中标签关键词高亮
- [ ] Skill 详情弹窗显示标签
- [ ] 搜索逻辑与 Prompt 模块完全一致（后端 GORM WHERE LIKE）
- [ ] GORM AutoMigrate 自动加列，不影响现有数据
