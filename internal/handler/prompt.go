package handler

import (
	"psm/internal/db"
	"psm/internal/service"
)

// PromptHandler 处理 Prompt 相关的方法，嵌入到 App 结构体
type PromptHandler struct {
	promptSvc *service.PromptService
}

// Init 初始化 PromptHandler
func (h *PromptHandler) Init(promptSvc *service.PromptService) {
	h.promptSvc = promptSvc
}

// CreatePrompt 创建新的 Prompt
func (h *PromptHandler) CreatePrompt(name, content, category string, tags []string, isTemplate bool) (*db.Prompt, error) {
	return h.promptSvc.CreatePrompt(name, content, category, tags, isTemplate)
}

// GetPrompt 根据 ID 获取 Prompt
func (h *PromptHandler) GetPrompt(id int64) (*db.Prompt, error) {
	return h.promptSvc.GetPrompt(id)
}

// GetPrompts 获取 Prompt 列表，支持关键词搜索和分类筛选
func (h *PromptHandler) GetPrompts(keyword, category string) ([]db.Prompt, error) {
	return h.promptSvc.GetPrompts(keyword, category)
}

// UpdatePrompt 更新 Prompt
func (h *PromptHandler) UpdatePrompt(id int64, name, content, category string, tags []string, isTemplate bool) error {
	return h.promptSvc.UpdatePrompt(id, name, content, category, tags, isTemplate)
}

// DeletePrompt 删除 Prompt
func (h *PromptHandler) DeletePrompt(id int64) error {
	return h.promptSvc.DeletePrompt(id)
}

// BatchDeletePrompts 批量删除多个 Prompt
func (h *PromptHandler) BatchDeletePrompts(ids []int64) (int64, error) {
	return h.promptSvc.BatchDeletePrompts(ids)
}

// GetCategories 获取所有分类列表
func (h *PromptHandler) GetCategories() ([]string, error) {
	return h.promptSvc.GetCategories()
}

// ExportPrompts 导出 Prompt 为 JSON 文件
func (h *PromptHandler) ExportPrompts(ids []int64, filePath string) error {
	return h.promptSvc.ExportPrompts(ids, filePath)
}

// ImportPrompts 从 JSON 文件导入 Prompt
func (h *PromptHandler) ImportPrompts(filePath string) (*db.ImportResult, error) {
	count, err := h.promptSvc.ImportPrompts(filePath)
	if err != nil {
		return nil, err
	}
	return &db.ImportResult{Success: count}, nil
}

// GetRecentPrompts 获取最近修改的 Prompt 列表
func (h *PromptHandler) GetRecentPrompts(limit int) ([]db.Prompt, error) {
	return h.promptSvc.GetRecentPrompts(limit)
}

// CountPrompts 统计 Prompt 总数
func (h *PromptHandler) CountPrompts() (int64, error) {
	return h.promptSvc.CountPrompts()
}

// TogglePinPrompt 切换 Prompt 的置顶状态
func (h *PromptHandler) TogglePinPrompt(id int64) error {
	return h.promptSvc.TogglePinPrompt(id)
}

// GetPinnedPrompts 获取置顶的 Prompt 列表
func (h *PromptHandler) GetPinnedPrompts(limit int) ([]db.Prompt, error) {
	return h.promptSvc.GetPinnedPrompts(limit)
}

// IncrementPromptUsage 增加 Prompt 使用次数
func (h *PromptHandler) IncrementPromptUsage(id int64) error {
	return h.promptSvc.IncrementUsage(id)
}

// GetTopUsedPrompts 获取最常用的 Prompt 列表
func (h *PromptHandler) GetTopUsedPrompts(limit int) ([]db.Prompt, error) {
	return h.promptSvc.GetTopUsedPrompts(limit)
}
