package service

import (
	"archive/zip"
	"database/sql"
	"fmt"
	"io"
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
func (s *SkillService) CreateSkill(name, description string) (*db.Skill, error) {
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
		"INSERT INTO skills (name, description, relative_path, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
		name, description, relativePath, now, now,
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
		CreatedAt:    now,
		UpdatedAt:    now,
	}
	return skill, nil
}

// GetSkill 根据 ID 获取 Skill
func (s *SkillService) GetSkill(id int64) (*db.Skill, error) {
	var sk db.Skill
	err := s.db.QueryRow(
		"SELECT id, name, description, relative_path, created_at, updated_at FROM skills WHERE id = ?", id,
	).Scan(&sk.ID, &sk.Name, &sk.Description, &sk.RelativePath, &sk.CreatedAt, &sk.UpdatedAt)
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("skill (ID=%d) 不存在", id)
	}
	if err != nil {
		return nil, fmt.Errorf("查询 Skill 失败: %w", err)
	}
	return &sk, nil
}

// GetSkills 获取所有 Skill 列表
func (s *SkillService) GetSkills() ([]db.Skill, error) {
	rows, err := s.db.Query(
		"SELECT id, name, description, relative_path, created_at, updated_at FROM skills ORDER BY updated_at DESC",
	)
	if err != nil {
		return nil, fmt.Errorf("查询 Skill 列表失败: %w", err)
	}
	defer func() { _ = rows.Close() }()

	skills := []db.Skill{}
	for rows.Next() {
		var sk db.Skill
		if err := rows.Scan(&sk.ID, &sk.Name, &sk.Description, &sk.RelativePath, &sk.CreatedAt, &sk.UpdatedAt); err != nil {
			return nil, fmt.Errorf("读取 Skill 记录失败: %w", err)
		}
		skills = append(skills, sk)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("遍历 Skill 列表失败: %w", err)
	}

	return skills, nil
}

// UpdateSkill 更新 Skill 元数据，同时同步更新技能目录中的 SKILL.md frontmatter
func (s *SkillService) UpdateSkill(id int64, name, description string) error {
	sk, err := s.GetSkill(id)
	if err != nil {
		return err
	}

	now := time.Now().Format("2006-01-02 15:04:05")
	result, err := s.db.Exec(
		"UPDATE skills SET name = ?, description = ?, updated_at = ? WHERE id = ?",
		name, description, now, id,
	)
	if err != nil {
		return fmt.Errorf("更新 Skill 失败: %w", err)
	}

	affected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("获取影响行数失败: %w", err)
	}
	if affected == 0 {
		return fmt.Errorf("skill (ID=%d) 不存在", id)
	}

	storagePath, _ := s.settingsSvc.GetSkillStoragePath()
	skillMDPath := filepath.Join(storagePath, sk.RelativePath, "SKILL.md")
	_ = utils.UpdateSkillFrontmatter(skillMDPath, name, description)

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
		return fmt.Errorf("skill (ID=%d) 不存在", id)
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
			_ = os.RemoveAll(fullPath)
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
		return nil, fmt.Errorf("skill '%s' 已存在，请先删除或更改名称", name)
	}

	skillDir := filepath.Join(storagePath, name)
	if err := utils.UnzipToDir(zipPath, skillDir); err != nil {
		return nil, fmt.Errorf("解压 Skill 包失败: %w", err)
	}

	utils.FlattenIfNested(skillDir, name)

	relativePath := name
	description := metadata.Description

	now := time.Now().Format("2006-01-02 15:04:05")
	insertResult, err := s.db.Exec(
		"INSERT INTO skills (name, description, relative_path, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
		name, description, relativePath, now, now,
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
		CreatedAt:    now,
		UpdatedAt:    now,
	}
	return skill, nil
}

// ImportSkillFromExportZip 从导出格式 ZIP 中批量导入技能
// ZIP 包含标识文件和 skills/ 目录，扫描所有子目录逐个导入，同名跳过
func (s *SkillService) ImportSkillFromExportZip(zipPath string) (*db.ImportResult, error) {
	storagePath, err := s.settingsSvc.GetSkillStoragePath()
	if err != nil {
		return nil, fmt.Errorf("获取 Skill 存储路径失败: %w", err)
	}

	zipReader, err := zip.OpenReader(zipPath)
	if err != nil {
		return nil, fmt.Errorf("打开 ZIP 文件失败: %w", err)
	}
	defer func() { _ = zipReader.Close() }()

	skillDirMap := make(map[string]bool)
	for _, file := range zipReader.File {
		cleanName := filepath.ToSlash(utils.FixFileName(file.Name))
		parts := strings.Split(cleanName, "/")
		if len(parts) >= 2 && parts[0] != "" && parts[0] != utils.SkillExportMarker {
			dirName := parts[0]
			if !skillDirMap[dirName] {
				skillDirMap[dirName] = true
			}
		}
	}

	result := &db.ImportResult{}

	for dirName := range skillDirMap {
		prefix := dirName + "/"

		var exists bool
		err := s.db.QueryRow("SELECT EXISTS(SELECT 1 FROM skills WHERE name = ?)", dirName).Scan(&exists)
		if err != nil {
			result.Failed++
			result.Errors = append(result.Errors, fmt.Sprintf("%s: 查询失败: %v", dirName, err))
			continue
		}
		if exists {
			result.Skipped++
			continue
		}

		skillMDContent := ""
		for _, file := range zipReader.File {
			if filepath.ToSlash(utils.FixFileName(file.Name)) == prefix+"SKILL.md" {
				rc, err := file.Open()
				if err == nil {
					data, _ := io.ReadAll(rc)
					_ = rc.Close()
					skillMDContent = string(data)
				}
				break
			}
		}

		name, description := utils.ParseSkillFrontmatter(skillMDContent)
		if name == "" {
			name = dirName
		}

		skillDir := filepath.Join(storagePath, dirName)
		if err := utils.UnzipPrefixToDir(&zipReader.Reader, prefix, skillDir); err != nil {
			result.Failed++
			result.Errors = append(result.Errors, fmt.Sprintf("%s: 解压失败: %v", dirName, err))
			continue
		}

		now := time.Now().Format("2006-01-02 15:04:05")
		_, err = s.db.Exec(
			"INSERT INTO skills (name, description, relative_path, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
			name, description, dirName, now, now,
		)
		if err != nil {
			result.Failed++
			result.Errors = append(result.Errors, fmt.Sprintf("%s: 创建记录失败: %v", dirName, err))
			_ = os.RemoveAll(skillDir)
			continue
		}
		result.Success++
	}

	return result, nil
}

// BatchImportSkills 批量导入多个 Skill ZIP 文件，自动识别格式（导出格式或公共格式），返回导入结果统计
func (s *SkillService) BatchImportSkills(zipPaths []string) (*db.ImportResult, error) {
	result := &db.ImportResult{}

	for _, zipPath := range zipPaths {
		hasMarker, _ := utils.HasExportMarker(zipPath)
		if hasMarker {
			batchResult, err := s.ImportSkillFromExportZip(zipPath)
			if err != nil {
				result.Failed++
				result.Errors = append(result.Errors, fmt.Sprintf("%s: %v", filepath.Base(zipPath), err))
			} else {
				result.Success += batchResult.Success
				result.Skipped += batchResult.Skipped
				result.Failed += batchResult.Failed
				result.Errors = append(result.Errors, batchResult.Errors...)
			}
		} else {
			_, err := s.ImportSkill(zipPath)
			if err != nil {
				errMsg := err.Error()
				if strings.Contains(errMsg, "已存在") {
					result.Skipped++
				} else {
					result.Failed++
					result.Errors = append(result.Errors, fmt.Sprintf("%s: %v", filepath.Base(zipPath), err))
				}
			} else {
				result.Success++
			}
		}
	}

	return result, nil
}

// ExportSkillsToZip 将选中的多个 Skill 打包为 PSM 导出格式的 ZIP 文件
// ZIP 包含导出标识文件和所有技能目录，每个技能目录直接位于 ZIP 根目录下
// skillIds 为空时导出全部，跳过获取失败的技能继续处理
func (s *SkillService) ExportSkillsToZip(skillIds []int64, savePath string) error {
	var skills []db.Skill

	if len(skillIds) == 0 {
		allSkills, err := s.GetSkills()
		if err != nil {
			return fmt.Errorf("获取 Skill 列表失败: %w", err)
		}
		skills = allSkills
	} else {
		for _, id := range skillIds {
			sk, err := s.GetSkill(id)
			if err != nil {
				continue
			}
			skills = append(skills, *sk)
		}
	}

	if len(skills) == 0 {
		return fmt.Errorf("没有可导出的 Skill")
	}

	storagePath, err := s.settingsSvc.GetSkillStoragePath()
	if err != nil {
		return fmt.Errorf("获取 Skill 存储路径失败: %w", err)
	}

	skillDirs := make(map[string]string, len(skills))
	for _, sk := range skills {
		skillDirs[sk.Name] = filepath.Join(storagePath, sk.RelativePath)
	}

	return utils.CreateSkillExportZip(skillDirs, savePath)
}

// ExportSkill 导出单个 Skill 为标准格式 ZIP 文件
// ZIP 根目录直接包含 SKILL.md 和其他文件，无 PSM 标识文件，可被其他工具直接使用
func (s *SkillService) ExportSkill(id int64, zipPath string) error {
	sk, err := s.GetSkill(id)
	if err != nil {
		return fmt.Errorf("获取 Skill (ID=%d) 失败: %w", id, err)
	}

	storagePath, err := s.settingsSvc.GetSkillStoragePath()
	if err != nil {
		return fmt.Errorf("获取 Skill 存储路径失败: %w", err)
	}

	skillDir := filepath.Join(storagePath, sk.RelativePath)
	return utils.ZipDir(skillDir, zipPath)
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
		"SELECT id, name, description, relative_path, created_at, updated_at FROM skills ORDER BY updated_at DESC LIMIT ?",
		limit,
	)
	if err != nil {
		return nil, fmt.Errorf("查询最近 Skill 列表失败: %w", err)
	}
	defer func() { _ = rows.Close() }()

	skills := []db.Skill{}
	for rows.Next() {
		var sk db.Skill
		if err := rows.Scan(&sk.ID, &sk.Name, &sk.Description, &sk.RelativePath, &sk.CreatedAt, &sk.UpdatedAt); err != nil {
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

// GetOrphanSkills 检测文件目录已不存在的 Skill 记录
func (s *SkillService) GetOrphanSkills() ([]db.Skill, error) {
	storagePath, err := s.settingsSvc.GetSkillStoragePath()
	if err != nil {
		return nil, fmt.Errorf("获取存储路径失败: %w", err)
	}

	skills, err := s.GetSkills()
	if err != nil {
		return nil, err
	}

	orphans := []db.Skill{}
	for _, sk := range skills {
		skillDir := filepath.Join(storagePath, sk.RelativePath)
		if _, err := os.Stat(skillDir); os.IsNotExist(err) {
			orphans = append(orphans, sk)
		}
	}
	return orphans, nil
}

// DeleteSkills 批量删除指定 ID 的 Skill 记录
func (s *SkillService) DeleteSkills(ids []int64) error {
	if len(ids) == 0 {
		return nil
	}
	query := "DELETE FROM skills WHERE id IN (" + strings.Repeat("?,", len(ids)-1) + "?)"
	args := make([]interface{}, len(ids))
	for i, id := range ids {
		args[i] = id
	}
	_, err := s.db.Exec(query, args...)
	if err != nil {
		return fmt.Errorf("批量删除 Skill 失败: %w", err)
	}
	return nil
}
