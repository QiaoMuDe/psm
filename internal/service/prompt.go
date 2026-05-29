package service

import (
	"database/sql"
	"fmt"
	"psm/internal/db"
	"psm/internal/utils"
	"time"
)

// PromptService Prompt 管理服务
type PromptService struct {
	db *sql.DB
}

// NewPromptService 创建 Prompt 服务实例
func NewPromptService(db *sql.DB) *PromptService {
	return &PromptService{db: db}
}

// CreatePrompt 创建新的 Prompt
func (s *PromptService) CreatePrompt(name, content, category, tags string) (*db.Prompt, error) {
	now := time.Now().Format("2006-01-02 15:04:05")
	result, err := s.db.Exec(
		"INSERT INTO prompts (name, content, category, tags, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
		name, content, category, tags, now, now,
	)
	if err != nil {
		return nil, fmt.Errorf("创建 Prompt 失败: %w", err)
	}

	id, err := result.LastInsertId()
	if err != nil {
		return nil, fmt.Errorf("获取插入 ID 失败: %w", err)
	}

	prompt := &db.Prompt{
		ID:        id,
		Name:      name,
		Content:   content,
		Category:  category,
		Tags:      tags,
		CreatedAt: now,
		UpdatedAt: now,
	}
	return prompt, nil
}

// GetPrompt 根据 ID 获取 Prompt
func (s *PromptService) GetPrompt(id int64) (*db.Prompt, error) {
	var p db.Prompt
	err := s.db.QueryRow(
		"SELECT id, name, content, category, tags, created_at, updated_at FROM prompts WHERE id = ?", id,
	).Scan(&p.ID, &p.Name, &p.Content, &p.Category, &p.Tags, &p.CreatedAt, &p.UpdatedAt)
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("prompt (ID=%d) 不存在", id)
	}
	if err != nil {
		return nil, fmt.Errorf("查询 Prompt 失败: %w", err)
	}
	return &p, nil
}

// GetPrompts 获取 Prompt 列表，支持关键词搜索和分类筛选
func (s *PromptService) GetPrompts(keyword, category string) ([]db.Prompt, error) {
	query := "SELECT id, name, content, category, tags, created_at, updated_at FROM prompts WHERE 1=1"
	var args []interface{}

	if keyword != "" {
		query += " AND (name LIKE ? OR content LIKE ?)"
		like := "%" + keyword + "%"
		args = append(args, like, like)
	}

	if category != "" && category != "all" {
		query += " AND category = ?"
		args = append(args, category)
	}

	query += " ORDER BY updated_at DESC"

	rows, err := s.db.Query(query, args...)
	if err != nil {
		return nil, fmt.Errorf("查询 Prompt 列表失败: %w", err)
	}
	defer func() { _ = rows.Close() }()

	prompts := []db.Prompt{}
	for rows.Next() {
		var p db.Prompt
		if err := rows.Scan(&p.ID, &p.Name, &p.Content, &p.Category, &p.Tags, &p.CreatedAt, &p.UpdatedAt); err != nil {
			return nil, fmt.Errorf("读取 Prompt 记录失败: %w", err)
		}
		prompts = append(prompts, p)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("遍历 Prompt 列表失败: %w", err)
	}

	return prompts, nil
}

// UpdatePrompt 更新 Prompt
func (s *PromptService) UpdatePrompt(id int64, name, content, category, tags string) error {
	now := time.Now().Format("2006-01-02 15:04:05")
	result, err := s.db.Exec(
		"UPDATE prompts SET name = ?, content = ?, category = ?, tags = ?, updated_at = ? WHERE id = ?",
		name, content, category, tags, now, id,
	)
	if err != nil {
		return fmt.Errorf("更新 Prompt 失败: %w", err)
	}

	affected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("获取影响行数失败: %w", err)
	}
	if affected == 0 {
		return fmt.Errorf("prompt (ID=%d) 不存在", id)
	}
	return nil
}

// DeletePrompt 删除 Prompt
func (s *PromptService) DeletePrompt(id int64) error {
	result, err := s.db.Exec("DELETE FROM prompts WHERE id = ?", id)
	if err != nil {
		return fmt.Errorf("删除 Prompt 失败: %w", err)
	}

	affected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("获取影响行数失败: %w", err)
	}
	if affected == 0 {
		return fmt.Errorf("prompt (ID=%d) 不存在", id)
	}
	return nil
}

// BatchDeletePrompts 批量删除多个 Prompt，返回实际删除的数量
func (s *PromptService) BatchDeletePrompts(ids []int64) (int64, error) {
	if len(ids) == 0 {
		return 0, nil
	}

	query := "DELETE FROM prompts WHERE id IN ("
	args := make([]interface{}, 0, len(ids))
	for i, id := range ids {
		if i > 0 {
			query += ","
		}
		query += "?"
		args = append(args, id)
	}
	query += ")"

	result, err := s.db.Exec(query, args...)
	if err != nil {
		return 0, fmt.Errorf("批量删除 Prompt 失败: %w", err)
	}

	affected, err := result.RowsAffected()
	if err != nil {
		return 0, fmt.Errorf("获取影响行数失败: %w", err)
	}
	return affected, nil
}

// GetCategories 获取所有不重复的分类列表
func (s *PromptService) GetCategories() ([]string, error) {
	rows, err := s.db.Query("SELECT DISTINCT category FROM prompts ORDER BY category")
	if err != nil {
		return nil, fmt.Errorf("查询分类列表失败: %w", err)
	}
	defer func() { _ = rows.Close() }()

	categories := []string{}
	for rows.Next() {
		var cat string
		if err := rows.Scan(&cat); err != nil {
			return nil, fmt.Errorf("读取分类失败: %w", err)
		}
		categories = append(categories, cat)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("遍历分类列表失败: %w", err)
	}

	return categories, nil
}

// ExportPrompts 导出 Prompt 为 JSON 文件，ids 为空时导出全部
func (s *PromptService) ExportPrompts(ids []int64, filePath string) error {
	prompts := []db.Prompt{}

	if len(ids) == 0 {
		rows, err := s.db.Query("SELECT id, name, content, category, tags, created_at, updated_at FROM prompts ORDER BY id")
		if err != nil {
			return fmt.Errorf("查询全部 Prompt 失败: %w", err)
		}
		defer func() { _ = rows.Close() }()

		for rows.Next() {
			var p db.Prompt
			if err := rows.Scan(&p.ID, &p.Name, &p.Content, &p.Category, &p.Tags, &p.CreatedAt, &p.UpdatedAt); err != nil {
				return fmt.Errorf("读取 Prompt 记录失败: %w", err)
			}
			prompts = append(prompts, p)
		}
		if err := rows.Err(); err != nil {
			return fmt.Errorf("遍历 Prompt 列表失败: %w", err)
		}
	} else {
		for _, id := range ids {
			p, err := s.GetPrompt(id)
			if err != nil {
				return fmt.Errorf("获取 Prompt (ID=%d) 失败: %w", id, err)
			}
			prompts = append(prompts, *p)
		}
	}

	if err := utils.ExportPromptsToJSON(prompts, filePath); err != nil {
		return fmt.Errorf("导出 Prompt 到 JSON 失败: %w", err)
	}
	return nil
}

// ImportPrompts 从 JSON 文件导入 Prompt，返回导入结果
func (s *PromptService) ImportPrompts(filePath string) (*db.ImportResult, error) {
	prompts, err := utils.ImportPromptsFromJSON(filePath)
	if err != nil {
		return nil, fmt.Errorf("从 JSON 文件读取 Prompt 失败: %w", err)
	}

	result := &db.ImportResult{}

	for _, p := range prompts {
		var exists bool
		err := s.db.QueryRow("SELECT EXISTS(SELECT 1 FROM prompts WHERE name = ?)", p.Name).Scan(&exists)
		if err != nil {
			result.Failed++
			continue
		}
		if exists {
			result.Skipped++
			continue
		}

		now := time.Now().Format("2006-01-02 15:04:05")
		_, err = s.db.Exec(
			"INSERT INTO prompts (name, content, category, tags, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
			p.Name, p.Content, p.Category, p.Tags, now, now,
		)
		if err != nil {
			result.Failed++
			continue
		}
		result.Success++
	}

	return result, nil
}

// GetRecentPrompts 获取最近修改的 Prompt 列表
func (s *PromptService) GetRecentPrompts(limit int) ([]db.Prompt, error) {
	if limit <= 0 {
		limit = 10
	}
	rows, err := s.db.Query(
		"SELECT id, name, content, category, tags, created_at, updated_at FROM prompts ORDER BY updated_at DESC LIMIT ?",
		limit,
	)
	if err != nil {
		return nil, fmt.Errorf("查询最近 Prompt 列表失败: %w", err)
	}
	defer func() { _ = rows.Close() }()

	prompts := []db.Prompt{}
	for rows.Next() {
		var p db.Prompt
		if err := rows.Scan(&p.ID, &p.Name, &p.Content, &p.Category, &p.Tags, &p.CreatedAt, &p.UpdatedAt); err != nil {
			return nil, fmt.Errorf("读取 Prompt 记录失败: %w", err)
		}
		prompts = append(prompts, p)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("遍历 Prompt 列表失败: %w", err)
	}

	return prompts, nil
}

// CountPrompts 统计 Prompt 总数
func (s *PromptService) CountPrompts() (int, error) {
	var count int
	err := s.db.QueryRow("SELECT COUNT(*) FROM prompts").Scan(&count)
	if err != nil {
		return 0, fmt.Errorf("统计 Prompt 总数失败: %w", err)
	}
	return count, nil
}
