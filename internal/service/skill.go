package service

import (
	"database/sql"
	"fmt"
	"os"
	"path/filepath"
	"psm/internal/db"
	"psm/internal/utils"
	"strings"
	"time"
)

// SkillService Skill 管理服务
type SkillService struct {
	db          *sql.DB
	settingsSvc *SettingsService
}

// NewSkillService 创建 Skill 服务实例
func NewSkillService(db *sql.DB, settingsSvc *SettingsService) *SkillService {
	return &SkillService{
		db:          db,
		settingsSvc: settingsSvc,
	}
}

// CreateSkill 创建空 Skill（创建目录 + 数据库记录）
func (s *SkillService) CreateSkill(name, description, version string) (*db.Skill, error) {
	storagePath, err := s.settingsSvc.GetSkillStoragePath()
	if err != nil {
		return nil, fmt.Errorf("获取 Skill 存储路径失败: %w", err)
	}

	skillDir := filepath.Join(storagePath, name)
	if err := utils.EnsureDir(skillDir); err != nil {
		return nil, fmt.Errorf("创建 Skill 目录失败: %w", err)
	}

	relativePath := name
	now := time.Now().Format("2006-01-02 15:04:05")
	result, err := s.db.Exec(
		"INSERT INTO skills (name, description, relative_path, version, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
		name, description, relativePath, version, now, now,
	)
	if err != nil {
		return nil, fmt.Errorf("创建 Skill 记录失败: %w", err)
	}

	id, err := result.LastInsertId()
	if err != nil {
		return nil, fmt.Errorf("获取插入 ID 失败: %w", err)
	}

	skill := &db.Skill{
		ID:           id,
		Name:         name,
		Description:  description,
		RelativePath: relativePath,
		Version:      version,
		CreatedAt:    now,
		UpdatedAt:    now,
	}
	return skill, nil
}

// GetSkill 根据 ID 获取 Skill
func (s *SkillService) GetSkill(id int64) (*db.Skill, error) {
	var sk db.Skill
	err := s.db.QueryRow(
		"SELECT id, name, description, relative_path, version, created_at, updated_at FROM skills WHERE id = ?", id,
	).Scan(&sk.ID, &sk.Name, &sk.Description, &sk.RelativePath, &sk.Version, &sk.CreatedAt, &sk.UpdatedAt)
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("Skill (ID=%d) 不存在", id)
	}
	if err != nil {
		return nil, fmt.Errorf("查询 Skill 失败: %w", err)
	}
	return &sk, nil
}

// GetSkills 获取所有 Skill 列表
func (s *SkillService) GetSkills() ([]db.Skill, error) {
	rows, err := s.db.Query(
		"SELECT id, name, description, relative_path, version, created_at, updated_at FROM skills ORDER BY updated_at DESC",
	)
	if err != nil {
		return nil, fmt.Errorf("查询 Skill 列表失败: %w", err)
	}
	defer rows.Close()

	skills := []db.Skill{}
	for rows.Next() {
		var sk db.Skill
		if err := rows.Scan(&sk.ID, &sk.Name, &sk.Description, &sk.RelativePath, &sk.Version, &sk.CreatedAt, &sk.UpdatedAt); err != nil {
			return nil, fmt.Errorf("读取 Skill 记录失败: %w", err)
		}
		skills = append(skills, sk)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("遍历 Skill 列表失败: %w", err)
	}

	return skills, nil
}

// UpdateSkill 更新 Skill 元数据
func (s *SkillService) UpdateSkill(id int64, name, description, version string) error {
	now := time.Now().Format("2006-01-02 15:04:05")
	result, err := s.db.Exec(
		"UPDATE skills SET name = ?, description = ?, version = ?, updated_at = ? WHERE id = ?",
		name, description, version, now, id,
	)
	if err != nil {
		return fmt.Errorf("更新 Skill 失败: %w", err)
	}

	affected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("获取影响行数失败: %w", err)
	}
	if affected == 0 {
		return fmt.Errorf("Skill (ID=%d) 不存在", id)
	}
	return nil
}

// DeleteSkill 删除 Skill，deleteFiles 为 true 时同时删除文件系统中的文件
func (s *SkillService) DeleteSkill(id int64, deleteFiles bool) error {
	sk, err := s.GetSkill(id)
	if err != nil {
		return err
	}

	if deleteFiles {
		storagePath, err := s.settingsSvc.GetSkillStoragePath()
		if err != nil {
			return fmt.Errorf("获取 Skill 存储路径失败: %w", err)
		}
		fullPath := filepath.Join(storagePath, sk.RelativePath)
		if err := os.RemoveAll(fullPath); err != nil {
			return fmt.Errorf("删除 Skill 文件失败: %w", err)
		}
	}

	result, err := s.db.Exec("DELETE FROM skills WHERE id = ?", id)
	if err != nil {
		return fmt.Errorf("删除 Skill 记录失败: %w", err)
	}

	affected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("获取影响行数失败: %w", err)
	}
	if affected == 0 {
		return fmt.Errorf("Skill (ID=%d) 不存在", id)
	}
	return nil
}

// BatchDeleteSkills 批量删除多个 Skill，deleteFiles 为 true 时同时删除文件，返回实际删除的数量
func (s *SkillService) BatchDeleteSkills(ids []int64, deleteFiles bool) (int64, error) {
	if len(ids) == 0 {
		return 0, nil
	}

	if deleteFiles {
		storagePath, err := s.settingsSvc.GetSkillStoragePath()
		if err != nil {
			return 0, fmt.Errorf("获取 Skill 存储路径失败: %w", err)
		}

		for _, id := range ids {
			sk, err := s.GetSkill(id)
			if err != nil {
				continue
			}
			fullPath := filepath.Join(storagePath, sk.RelativePath)
			os.RemoveAll(fullPath)
		}
	}

	query := "DELETE FROM skills WHERE id IN ("
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
		return 0, fmt.Errorf("批量删除 Skill 失败: %w", err)
	}

	affected, err := result.RowsAffected()
	if err != nil {
		return 0, fmt.Errorf("获取影响行数失败: %w", err)
	}
	return affected, nil
}

// ImportSkill 从 ZIP 文件导入 Skill（解压 + 创建数据库记录）
// ZIP 根目录必须包含 SKILL.md 文件，从中解析名称和描述
func (s *SkillService) ImportSkill(zipPath string) (*db.Skill, error) {
	storagePath, err := s.settingsSvc.GetSkillStoragePath()
	if err != nil {
		return nil, fmt.Errorf("获取 Skill 存储路径失败: %w", err)
	}

	hasSkillMD, err := utils.HasSkillMD(zipPath)
	if err != nil {
		return nil, fmt.Errorf("检查 SKILL.md 失败: %w", err)
	}
	if !hasSkillMD {
		return nil, fmt.Errorf("导入失败：ZIP 根目录下未找到 SKILL.md 文件，该压缩包不是有效的 Skill 包")
	}

	metadata, err := utils.GetSkillMetadataFromZip(zipPath)
	if err != nil {
		return nil, fmt.Errorf("从 ZIP 读取 Skill 元数据失败: %w", err)
	}

	name := metadata.Name
	if name == "" {
		name = filepath.Base(zipPath)
		name = strings.TrimSuffix(name, filepath.Ext(name))
	}

	var exists bool
	err = s.db.QueryRow("SELECT EXISTS(SELECT 1 FROM skills WHERE name = ?)", name).Scan(&exists)
	if err != nil {
		return nil, fmt.Errorf("检查 Skill 是否存在失败: %w", err)
	}
	if exists {
		return nil, fmt.Errorf("Skill '%s' 已存在，请先删除或更改名称", name)
	}

	skillDir := filepath.Join(storagePath, name)
	if err := utils.UnzipToDir(zipPath, skillDir); err != nil {
		return nil, fmt.Errorf("解压 Skill 包失败: %w", err)
	}

	relativePath := name
	description := metadata.Description
	version := metadata.Version
	if version == "" {
		version = "1.0.0"
	}

	now := time.Now().Format("2006-01-02 15:04:05")
	insertResult, err := s.db.Exec(
		"INSERT INTO skills (name, description, relative_path, version, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
		name, description, relativePath, version, now, now,
	)
	if err != nil {
		return nil, fmt.Errorf("创建 Skill 记录失败: %w", err)
	}

	id, err := insertResult.LastInsertId()
	if err != nil {
		return nil, fmt.Errorf("获取插入 ID 失败: %w", err)
	}

	skill := &db.Skill{
		ID:           id,
		Name:         name,
		Description:  description,
		RelativePath: relativePath,
		Version:      version,
		CreatedAt:    now,
		UpdatedAt:    now,
	}
	return skill, nil
}

// BatchImportSkills 批量导入多个 Skill ZIP 文件，返回导入结果统计
func (s *SkillService) BatchImportSkills(zipPaths []string) (*db.ImportResult, error) {
	result := &db.ImportResult{}

	for _, zipPath := range zipPaths {
		_, err := s.ImportSkill(zipPath)
		if err != nil {
			result.Failed++
			result.Errors = append(result.Errors, fmt.Sprintf("%s: %v", filepath.Base(zipPath), err))
		} else {
			result.Success++
		}
	}

	return result, nil
}

// ExportSkill 导出 Skill 为 ZIP 文件（包含 skill.json 元数据）
func (s *SkillService) ExportSkill(id int64, zipPath string) error {
	sk, err := s.GetSkill(id)
	if err != nil {
		return err
	}

	storagePath, err := s.settingsSvc.GetSkillStoragePath()
	if err != nil {
		return fmt.Errorf("获取 Skill 存储路径失败: %w", err)
	}

	skillDir := filepath.Join(storagePath, sk.RelativePath)
	metadata := map[string]string{
		"name":        sk.Name,
		"description": sk.Description,
		"version":     sk.Version,
	}

	if err := utils.ZipDirWithMetadata(skillDir, zipPath, metadata); err != nil {
		return fmt.Errorf("打包 Skill 为 ZIP 失败: %w", err)
	}
	return nil
}

// ListSkillFiles 列出 Skill 目录下的文件和子目录
func (s *SkillService) ListSkillFiles(id int64) ([]db.SkillFile, error) {
	sk, err := s.GetSkill(id)
	if err != nil {
		return nil, err
	}

	storagePath, err := s.settingsSvc.GetSkillStoragePath()
	if err != nil {
		return nil, fmt.Errorf("获取 Skill 存储路径失败: %w", err)
	}

	skillDir := filepath.Join(storagePath, sk.RelativePath)
	entries, err := os.ReadDir(skillDir)
	if err != nil {
		return nil, fmt.Errorf("读取 Skill 目录失败: %w", err)
	}

	files := []db.SkillFile{}
	for _, entry := range entries {
		info, err := entry.Info()
		if err != nil {
			continue
		}
		files = append(files, db.SkillFile{
			Name:    entry.Name(),
			IsDir:   entry.IsDir(),
			Size:    info.Size(),
			ModTime: info.ModTime().Format("2006-01-02 15:04:05"),
		})
	}

	return files, nil
}

// GetRecentSkills 获取最近修改的 Skill 列表
func (s *SkillService) GetRecentSkills(limit int) ([]db.Skill, error) {
	if limit <= 0 {
		limit = 10
	}
	rows, err := s.db.Query(
		"SELECT id, name, description, relative_path, version, created_at, updated_at FROM skills ORDER BY updated_at DESC LIMIT ?",
		limit,
	)
	if err != nil {
		return nil, fmt.Errorf("查询最近 Skill 列表失败: %w", err)
	}
	defer rows.Close()

	skills := []db.Skill{}
	for rows.Next() {
		var sk db.Skill
		if err := rows.Scan(&sk.ID, &sk.Name, &sk.Description, &sk.RelativePath, &sk.Version, &sk.CreatedAt, &sk.UpdatedAt); err != nil {
			return nil, fmt.Errorf("读取 Skill 记录失败: %w", err)
		}
		skills = append(skills, sk)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("遍历 Skill 列表失败: %w", err)
	}

	return skills, nil
}

// CountSkills 统计 Skill 总数
func (s *SkillService) CountSkills() (int, error) {
	var count int
	err := s.db.QueryRow("SELECT COUNT(*) FROM skills").Scan(&count)
	if err != nil {
		return 0, fmt.Errorf("统计 Skill 总数失败: %w", err)
	}
	return count, nil
}
