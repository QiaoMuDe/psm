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
