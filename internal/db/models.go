// Package db 定义数据库模型及数据结构
package db

import (
	"time"

	"gorm.io/gorm"
)

// Settings 表示系统设置项的键值对结构体
type Settings struct {
	Key   string `json:"key" gorm:"primaryKey"`
	Value string `json:"value" gorm:"type:text;not null"`
}

// Prompt 表示提示词数据模型，包含内容、分类和标签等信息
type Prompt struct {
	ID         int64          `json:"id" gorm:"primaryKey;autoIncrement"`
	Name       string         `json:"name" gorm:"not null;default:''"`
	Content    string         `json:"content" gorm:"type:text;not null;default:''"`
	Category   string         `json:"category" gorm:"not null;default:''"`
	Tags       string         `json:"tags" gorm:"type:text;not null;default:'[]'"`
	IsPinned   bool           `json:"is_pinned" gorm:"not null;default:false"`
	IsTemplate bool           `json:"is_template" gorm:"not null;default:false"`
	UsageCount int            `json:"usage_count" gorm:"not null;default:0"`
	CreatedAt  time.Time      `json:"created_at"`
	UpdatedAt  time.Time      `json:"updated_at"`
	DeletedAt  gorm.DeletedAt `json:"-" gorm:"index"`
}

// Skill 表示技能数据模型，包含描述和路径信息
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

// SkillFile 表示技能目录中的文件或子目录信息
type SkillFile struct {
	Name     string `json:"name"`      // 文件或目录名称
	IsDir    bool   `json:"is_dir"`    // 是否为目录
	Size     int64  `json:"size"`      // 文件大小（字节）
	ModTime  string `json:"mod_time"`  // 最后修改时间
	FullPath string `json:"full_path"` // 完整文件路径
}

// ImportResult 表示导入操作的结果汇总
type ImportResult struct {
	Success int      `json:"success"` // 成功导入的数量
	Skipped int      `json:"skipped"` // 跳过的数量
	Failed  int      `json:"failed"`  // 失败的数量
	Errors  []string `json:"errors"`  // 错误信息列表
}

// DashboardStats 表示仪表盘的统计数据，包含总数和最近的记录
type DashboardStats struct {
	TotalPrompts  int      `json:"total_prompts"`  // 提示词总数
	TotalSkills   int      `json:"total_skills"`   // 技能总数
	RecentPrompts []Prompt `json:"recent_prompts"` // 最近的提示词列表
	RecentSkills  []Skill  `json:"recent_skills"`  // 最近的技能列表
}

// DefaultSettings 返回系统的默认设置列表，appHome 需由调用方传入
func DefaultSettings(appHome string) []Settings {
	return []Settings{
		{Key: "app_home", Value: appHome},
		{Key: "app_theme", Value: "light"},
		{Key: "prompt_view_mode", Value: "card"},
		{Key: "skill_view_mode", Value: "card"},
		{Key: "sidebar_collapsed", Value: "false"},
		{Key: "font_size_offset", Value: "0px"},
		{Key: "font_family", Value: ""},
		{Key: "ai_api_url", Value: "https://api.openai.com/v1"},
		{Key: "ai_api_key", Value: ""},
		{Key: "ai_model", Value: "gpt-4o-mini"},
		{Key: "ai_generate_prompt", Value: "你是一个提示词生成器。根据用户的一句话描述，生成一个可直接使用的高质量提示词。\n\n生成要求：\n- 提示词应清晰、具体、可执行，避免模糊笼统的描述\n- 包含明确的角色设定和任务目标\n- 如适用，补充必要的约束条件、输入输出格式或示例\n- 内容应为中文\n\n返回格式（严格 JSON，不要包含其他内容）：\n{\"name\": \"简短概括性名称\", \"content\": \"完整提示词内容\"}"},
		{Key: "ai_optimize_prompt", Value: "你是一个提示词优化专家。用户会给你一个已有的提示词，请你在保留原始意图的基础上，对其进行优化。\n\n优化方向：\n- 使表述更清晰、更具体、更易执行\n- 补充缺失的约束条件或上下文\n- 改善结构和逻辑，使其更专业\n- 不要改变原始的核心意图\n- 内容应为中文\n\n直接返回优化后的完整提示词内容，不要包含解释、前缀或 JSON 格式。"},
		{Key: "ai_optimize_name", Value: "你是一个命名优化专家。用户会给你一个名称（用于标识一段提示词或技能），请你在保留原始含义的基础上，优化这个名称。\n\n优化方向：\n- 使名称更简洁、更具概括性\n- 保留原始的核心语义\n- 长度控制在 20 字以内\n- 内容应为中文\n\n直接返回优化后的名称，不要包含解释、引号或其他格式。"},
		{Key: "ai_optimize_description", Value: "你是一个描述优化专家。用户会给你一段描述文本，请你在保留原始含义的基础上，对其进行优化。\n\n优化方向：\n- 使表述更清晰、更简洁\n- 突出核心功能和用途\n- 长度控制在 50 字以内\n- 内容应为中文\n\n直接返回优化后的描述，不要包含解释、引号或其他格式。"},
		{Key: "log_level", Value: "WARN"},
		{Key: "ai_translate_prompt", Value: `你是一个专业翻译。将用户提供的内容翻译成指定语言。

要求：
1. 保持原文的结构和格式（Markdown、代码块、列表等原样保留）
2. 专业术语准确，语义完整
3. 翻译自然流畅，不要机翻感
4. 只返回翻译结果，不要加解释说明或前缀`},
	}
}
