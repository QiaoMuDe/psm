// Package utils 提供路径处理、压缩解压、导入导出等通用工具函数
package utils

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"

	"psm/internal/db"
)

// ExportPromptsToJSON 将提示词列表导出为 JSON 文件
// prompts 为要导出的提示词切片，filePath 为目标 JSON 文件路径
func ExportPromptsToJSON(prompts []db.Prompt, filePath string) error {
	data, err := json.MarshalIndent(prompts, "", "  ")
	if err != nil {
		return fmt.Errorf("序列化提示词数据失败: %w", err)
	}

	if err := EnsureDir(filepath.Dir(filePath)); err != nil {
		return fmt.Errorf("创建导出目录失败: %w", err)
	}

	if err := os.WriteFile(filePath, data, 0644); err != nil {
		return fmt.Errorf("写入 JSON 文件失败: %w", err)
	}

	return nil
}

// ImportPromptsFromJSON 从 JSON 文件导入提示词列表
// filePath 为 JSON 文件路径，返回解析后的提示词切片
func ImportPromptsFromJSON(filePath string) ([]db.Prompt, error) {
	data, err := os.ReadFile(filePath)
	if err != nil {
		return nil, fmt.Errorf("读取 JSON 文件失败: %w", err)
	}

	var prompts []db.Prompt
	if err := json.Unmarshal(data, &prompts); err != nil {
		return nil, fmt.Errorf("解析 JSON 数据失败: %w", err)
	}

	return prompts, nil
}

// MustMarshalJSON 将值序列化为 JSON 字符串，失败时返回 "[]"
func MustMarshalJSON(v interface{}) string {
	data, err := json.Marshal(v)
	if err != nil {
		return "[]"
	}
	return string(data)
}

// ExportSkillMetadata 将技能元数据导出为 JSON 文件
// skill 为要导出的技能信息，filePath 为目标 JSON 文件路径
func ExportSkillMetadata(skill db.Skill, filePath string) error {
	data, err := json.MarshalIndent(skill, "", "  ")
	if err != nil {
		return fmt.Errorf("序列化技能元数据失败: %w", err)
	}

	if err := EnsureDir(filepath.Dir(filePath)); err != nil {
		return fmt.Errorf("创建导出目录失败: %w", err)
	}

	if err := os.WriteFile(filePath, data, 0644); err != nil {
		return fmt.Errorf("写入 JSON 文件失败: %w", err)
	}

	return nil
}

// ImportSkillMetadata 从 JSON 文件导入技能元数据
// filePath 为 JSON 文件路径，返回解析后的技能信息指针
func ImportSkillMetadata(filePath string) (*db.Skill, error) {
	data, err := os.ReadFile(filePath)
	if err != nil {
		return nil, fmt.Errorf("读取 JSON 文件失败: %w", err)
	}

	var skill db.Skill
	if err := json.Unmarshal(data, &skill); err != nil {
		return nil, fmt.Errorf("解析 JSON 数据失败: %w", err)
	}

	return &skill, nil
}
