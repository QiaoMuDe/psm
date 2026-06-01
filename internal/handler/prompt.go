package handler

import (
	"gitee.com/MM-Q/fastlog"

	"psm/internal/db"
	"psm/internal/service"
)

// PromptHandler 处理 Prompt 相关的方法，嵌入到 App 结构体
type PromptHandler struct {
	promptSvc *service.PromptService
	logger    *fastlog.Logger
}

// Init 初始化 PromptHandler
func (h *PromptHandler) Init(promptSvc *service.PromptService, logger *fastlog.Logger) {
	h.promptSvc = promptSvc
	h.logger = logger
}

// CreatePrompt 创建新的 Prompt
func (h *PromptHandler) CreatePrompt(name, content, category string, tags []string, isTemplate bool) (*db.Prompt, error) {
	h.logger.Infow("创建 Prompt", fastlog.String("name", name))
	return h.promptSvc.CreatePrompt(name, content, category, tags, isTemplate)
}

// GetPrompt 根据 ID 获取 Prompt
func (h *PromptHandler) GetPrompt(id int64) (*db.Prompt, error) {
	return h.promptSvc.GetPrompt(id)
}

// GetPrompts 获取 Prompt 列表，支持关键词搜索和分类筛选
func (h *PromptHandler) GetPrompts(keyword, category string) ([]db.Prompt, error) {
	h.logger.Debugw("获取 Prompt 列表", fastlog.String("keyword", keyword), fastlog.String("category", category))
	return h.promptSvc.GetPrompts(keyword, category)
}

// UpdatePrompt 更新 Prompt
func (h *PromptHandler) UpdatePrompt(id int64, name, content, category string, tags []string, isTemplate bool) error {
	h.logger.Infow("更新 Prompt", fastlog.Int64("id", id))
	return h.promptSvc.UpdatePrompt(id, name, content, category, tags, isTemplate)
}

// DeletePrompt 删除 Prompt
func (h *PromptHandler) DeletePrompt(id int64) error {
	return h.promptSvc.DeletePrompt(id)
}

// BatchDeletePrompts 批量删除多个 Prompt
func (h *PromptHandler) BatchDeletePrompts(ids []int64) (int64, error) {
	h.logger.Infow("批量删除 Prompt", fastlog.Int("count", len(ids)))
	return h.promptSvc.BatchDeletePrompts(ids)
}

// GetCategories 获取所有分类列表
func (h *PromptHandler) GetCategories() ([]string, error) {
	return h.promptSvc.GetCategories()
}

// ExportPrompts 导出 Prompt 为 JSON 文件
func (h *PromptHandler) ExportPrompts(ids []int64, filePath string) error {
	h.logger.Infow("导出 Prompt", fastlog.String("path", filePath))
	return h.promptSvc.ExportPrompts(ids, filePath)
}

// ImportPrompts 从 JSON 文件导入 Prompt
func (h *PromptHandler) ImportPrompts(filePath string) (*db.ImportResult, error) {
	h.logger.Infow("导入 Prompt", fastlog.String("path", filePath))
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
	h.logger.Infow("切换 Prompt 置顶状态", fastlog.Int64("id", id))
	return h.promptSvc.TogglePinPrompt(id)
}

// GetPinnedPrompts 获取置顶的 Prompt 列表
func (h *PromptHandler) GetPinnedPrompts(limit int) ([]db.Prompt, error) {
	return h.promptSvc.GetPinnedPrompts(limit)
}

// IncrementPromptUsage 增加 Prompt 使用次数
func (h *PromptHandler) IncrementPromptUsage(id int64) error {
	h.logger.Debugw("增加 Prompt 使用次数", fastlog.Int64("id", id))
	return h.promptSvc.IncrementUsage(id)
}

// GetTopUsedPrompts 获取最常用的 Prompt 列表
func (h *PromptHandler) GetTopUsedPrompts(limit int) ([]db.Prompt, error) {
	h.logger.Debugw("获取最常用 Prompt", fastlog.Int("limit", limit))
	return h.promptSvc.GetTopUsedPrompts(limit)
}

// BatchUpdateCategory 批量更新 Prompt 分类
func (h *PromptHandler) BatchUpdateCategory(ids []int64, category string) error {
	h.logger.Infow("批量更新 Prompt 分类", fastlog.Int("count", len(ids)), fastlog.String("category", category))
	return h.promptSvc.BatchUpdateCategory(ids, category)
}

// BatchAddTags 批量为 Prompt 添加标签
func (h *PromptHandler) BatchAddTags(ids []int64, tags []string) error {
	h.logger.Infow("批量添加 Prompt 标签", fastlog.Int("count", len(ids)))
	return h.promptSvc.BatchAddTags(ids, tags)
}

// BatchRemoveTags 批量移除 Prompt 标签
func (h *PromptHandler) BatchRemoveTags(ids []int64, tags []string) error {
	h.logger.Infow("批量移除 Prompt 标签", fastlog.Int("count", len(ids)))
	return h.promptSvc.BatchRemoveTags(ids, tags)
}

// BatchSetPin 批量设置 Prompt 置顶状态
func (h *PromptHandler) BatchSetPin(ids []int64, pinned bool) error {
	h.logger.Infow("批量设置 Prompt 置顶", fastlog.Int("count", len(ids)), fastlog.Bool("pinned", pinned))
	return h.promptSvc.BatchSetPin(ids, pinned)
}
