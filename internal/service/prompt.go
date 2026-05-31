package service

import (
	"encoding/json"
	"fmt"
	"psm/internal/db"
	"psm/internal/utils"

	"gorm.io/gorm"
)

// PromptService 提示词服务
type PromptService struct{}

// NewPromptService 创建提示词服务实例
func NewPromptService() *PromptService {
	return &PromptService{}
}

// CreatePrompt 创建新 Prompt，返回创建的 Prompt 对象
func (s *PromptService) CreatePrompt(name, content, category string, tags []string, isTemplate bool) (*db.Prompt, error) {
	prompt := db.Prompt{
		Name:       name,
		Content:    content,
		Category:   category,
		Tags:       utils.MustMarshalJSON(tags),
		IsTemplate: isTemplate,
	}

	if err := db.DB.Create(&prompt).Error; err != nil {
		return nil, fmt.Errorf("创建 Prompt 失败: %w", err)
	}
	return &prompt, nil
}

// GetPrompt 根据 ID 获取 Prompt
func (s *PromptService) GetPrompt(id int64) (*db.Prompt, error) {
	var prompt db.Prompt
	if err := db.DB.First(&prompt, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("prompt (ID=%d) 不存在", id)
		}
		return nil, fmt.Errorf("查询 Prompt 失败: %w", err)
	}
	return &prompt, nil
}

// GetPrompts 获取 Prompt 列表，支持关键词搜索和分类筛选
func (s *PromptService) GetPrompts(keyword, category string) ([]db.Prompt, error) {
	var prompts []db.Prompt
	query := db.DB.Model(&db.Prompt{})

	if keyword != "" {
		like := "%" + keyword + "%"
		query = query.Where("name LIKE ? OR content LIKE ? OR tags LIKE ?", like, like, like)
	}

	if category != "" && category != "all" {
		query = query.Where("category = ?", category)
	}

	if err := query.Order("is_pinned DESC, updated_at DESC").Find(&prompts).Error; err != nil {
		return nil, fmt.Errorf("查询 Prompt 列表失败: %w", err)
	}

	return prompts, nil
}

// UpdatePrompt 更新指定 Prompt 的所有字段
func (s *PromptService) UpdatePrompt(id int64, name, content, category string, tags []string, isTemplate bool) error {
	result := db.DB.Model(&db.Prompt{}).Where("id = ?", id).Updates(map[string]interface{}{
		"name":        name,
		"content":     content,
		"category":    category,
		"tags":        utils.MustMarshalJSON(tags),
		"is_template": isTemplate,
	})

	if result.Error != nil {
		return fmt.Errorf("更新 Prompt 失败: %w", result.Error)
	}
	if result.RowsAffected == 0 {
		return fmt.Errorf("prompt (ID=%d) 不存在", id)
	}
	return nil
}

// DeletePrompt 根据 ID 删除 Prompt
func (s *PromptService) DeletePrompt(id int64) error {
	result := db.DB.Delete(&db.Prompt{}, id)
	if result.Error != nil {
		return fmt.Errorf("删除 Prompt 失败: %w", result.Error)
	}
	if result.RowsAffected == 0 {
		return fmt.Errorf("prompt (ID=%d) 不存在", id)
	}
	return nil
}

// BatchDeletePrompts 批量删除 Prompt，返回删除数量
func (s *PromptService) BatchDeletePrompts(ids []int64) (int64, error) {
	if len(ids) == 0 {
		return 0, nil
	}
	result := db.DB.Unscoped().Delete(&db.Prompt{}, ids)
	if result.Error != nil {
		return 0, fmt.Errorf("批量删除 Prompt 失败: %w", result.Error)
	}
	return result.RowsAffected, nil
}

// GetCategories 获取所有分类列表
func (s *PromptService) GetCategories() ([]string, error) {
	var categories []string
	if err := db.DB.Model(&db.Prompt{}).Distinct().Pluck("category", &categories).Error; err != nil {
		return nil, fmt.Errorf("查询分类列表失败: %w", err)
	}
	return categories, nil
}

// ExportPrompts 导出 Prompt 为 JSON 文件，ids 为空时导出全部
func (s *PromptService) ExportPrompts(ids []int64, filePath string) error {
	var prompts []db.Prompt

	if len(ids) == 0 {
		if err := db.DB.Order("id").Find(&prompts).Error; err != nil {
			return fmt.Errorf("查询全部 Prompt 失败: %w", err)
		}
	} else {
		if err := db.DB.Where("id IN ?", ids).Find(&prompts).Error; err != nil {
			return fmt.Errorf("查询指定 Prompt 失败: %w", err)
		}
	}

	if err := utils.ExportPromptsToJSON(prompts, filePath); err != nil {
		return fmt.Errorf("导出 Prompt 到 JSON 失败: %w", err)
	}
	return nil
}

// ImportPrompts 从 JSON 文件导入 Prompt，返回成功导入的数量
func (s *PromptService) ImportPrompts(filePath string) (int, error) {
	importedPrompts, err := utils.ImportPromptsFromJSON(filePath)
	if err != nil {
		return 0, fmt.Errorf("从 JSON 导入 Prompt 失败: %w", err)
	}

	count := 0
	for _, p := range importedPrompts {
		newPrompt := db.Prompt{
			Name:       p.Name,
			Content:    p.Content,
			Category:   p.Category,
			Tags:       p.Tags,
			IsPinned:   p.IsPinned,
			IsTemplate: p.IsTemplate,
			UsageCount: p.UsageCount,
			CreatedAt:  p.CreatedAt,
			UpdatedAt:  p.UpdatedAt,
		}
		if err := db.DB.Create(&newPrompt).Error; err != nil {
			continue
		}
		count++
	}
	return count, nil
}

// GetRecentPrompts 获取最近修改的 Prompt 列表
func (s *PromptService) GetRecentPrompts(limit int) ([]db.Prompt, error) {
	if limit <= 0 {
		limit = 10
	}

	var prompts []db.Prompt
	if err := db.DB.Order("updated_at DESC").Limit(limit).Find(&prompts).Error; err != nil {
		return nil, fmt.Errorf("查询最近 Prompt 列表失败: %w", err)
	}
	return prompts, nil
}

// CountPrompts 统计 Prompt 总数
func (s *PromptService) CountPrompts() (int64, error) {
	var count int64
	if err := db.DB.Model(&db.Prompt{}).Count(&count).Error; err != nil {
		return 0, fmt.Errorf("统计 Prompt 总数失败: %w", err)
	}
	return count, nil
}

// TogglePinPrompt 切换 Prompt 置顶状态
func (s *PromptService) TogglePinPrompt(id int64) error {
	var prompt db.Prompt
	if err := db.DB.First(&prompt, id).Error; err != nil {
		return fmt.Errorf("prompt (ID=%d) 不存在", id)
	}

	newPinned := !prompt.IsPinned
	if err := db.DB.Model(&db.Prompt{}).Where("id = ?", id).Update("is_pinned", newPinned).Error; err != nil {
		return fmt.Errorf("切换置顶状态失败: %w", err)
	}
	return nil
}

// GetPinnedPrompts 获取置顶的 Prompt 列表
func (s *PromptService) GetPinnedPrompts(limit int) ([]db.Prompt, error) {
	if limit <= 0 {
		limit = 3
	}

	var prompts []db.Prompt
	if err := db.DB.Where("is_pinned = ?", true).Order("updated_at DESC").Limit(limit).Find(&prompts).Error; err != nil {
		return nil, fmt.Errorf("获取置顶 Prompt 列表失败: %w", err)
	}
	return prompts, nil
}

// IncrementUsage 增加 Prompt 使用次数
func (s *PromptService) IncrementUsage(id int64) error {
	return db.DB.Model(&db.Prompt{}).Where("id = ?", id).UpdateColumn("usage_count", gorm.Expr("usage_count + 1")).Error
}

// DeleteAllPrompts 删除所有 Prompt 记录（含软删除），返回删除数量
func (s *PromptService) DeleteAllPrompts() (int64, error) {
	result := db.DB.Unscoped().Where("1 = 1").Delete(&db.Prompt{})
	if result.Error != nil {
		return 0, fmt.Errorf("删除所有 Prompt 失败: %w", result.Error)
	}
	return result.RowsAffected, nil
}

// GetTopUsedPrompts 获取最常用的 Prompt 列表
func (s *PromptService) GetTopUsedPrompts(limit int) ([]db.Prompt, error) {
	if limit <= 0 {
		limit = 5
	}

	var prompts []db.Prompt
	if err := db.DB.Where("usage_count > 0").Order("usage_count DESC").Limit(limit).Find(&prompts).Error; err != nil {
		return nil, fmt.Errorf("查询最常用 Prompt 列表失败: %w", err)
	}
	return prompts, nil
}

// BatchUpdateCategory 批量更新指定 Prompt 的分类
func (s *PromptService) BatchUpdateCategory(ids []int64, category string) error {
	if len(ids) == 0 {
		return nil
	}
	result := db.DB.Model(&db.Prompt{}).Where("id IN ?", ids).Update("category", category)
	if result.Error != nil {
		return fmt.Errorf("批量更新分类失败: %w", result.Error)
	}
	if result.RowsAffected == 0 {
		return fmt.Errorf("未找到匹配的 Prompt 记录")
	}
	return nil
}

// BatchAddTags 批量为指定 Prompt 添加标签（自动去重）
func (s *PromptService) BatchAddTags(ids []int64, tags []string) error {
	if len(ids) == 0 {
		return nil
	}
	for _, id := range ids {
		var prompt db.Prompt
		if err := db.DB.First(&prompt, id).Error; err != nil {
			continue
		}

		var existingTags []string
		if err := json.Unmarshal([]byte(prompt.Tags), &existingTags); err != nil {
			existingTags = []string{}
		}

		tagSet := make(map[string]bool, len(existingTags))
		for _, t := range existingTags {
			tagSet[t] = true
		}
		for _, t := range tags {
			tagSet[t] = true
		}

		merged := make([]string, 0, len(tagSet))
		for t := range tagSet {
			merged = append(merged, t)
		}

		newTagsJSON, err := json.Marshal(merged)
		if err != nil {
			return fmt.Errorf("序列化标签失败: %w", err)
		}

		if err := db.DB.Model(&db.Prompt{}).Where("id = ?", id).Update("tags", string(newTagsJSON)).Error; err != nil {
			return fmt.Errorf("更新 Prompt (ID=%d) 标签失败: %w", id, err)
		}
	}
	return nil
}

// BatchRemoveTags 批量从指定 Prompt 中移除标签
func (s *PromptService) BatchRemoveTags(ids []int64, tags []string) error {
	if len(ids) == 0 {
		return nil
	}
	removeSet := make(map[string]bool, len(tags))
	for _, t := range tags {
		removeSet[t] = true
	}

	for _, id := range ids {
		var prompt db.Prompt
		if err := db.DB.First(&prompt, id).Error; err != nil {
			continue
		}

		var existingTags []string
		if err := json.Unmarshal([]byte(prompt.Tags), &existingTags); err != nil {
			continue
		}

		filtered := make([]string, 0)
		for _, t := range existingTags {
			if !removeSet[t] {
				filtered = append(filtered, t)
			}
		}

		newTagsJSON, err := json.Marshal(filtered)
		if err != nil {
			return fmt.Errorf("序列化标签失败: %w", err)
		}

		if err := db.DB.Model(&db.Prompt{}).Where("id = ?", id).Update("tags", string(newTagsJSON)).Error; err != nil {
			return fmt.Errorf("更新 Prompt (ID=%d) 标签失败: %w", id, err)
		}
	}
	return nil
}

// BatchSetPin 批量设置指定 Prompt 的置顶状态
func (s *PromptService) BatchSetPin(ids []int64, pinned bool) error {
	if len(ids) == 0 {
		return nil
	}
	result := db.DB.Model(&db.Prompt{}).Where("id IN ?", ids).Update("is_pinned", pinned)
	if result.Error != nil {
		return fmt.Errorf("批量设置置顶状态失败: %w", result.Error)
	}
	if result.RowsAffected == 0 {
		return fmt.Errorf("未找到匹配的 Prompt 记录")
	}
	return nil
}
