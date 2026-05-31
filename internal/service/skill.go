package service

import (
	"archive/zip"
	"encoding/json"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"psm/internal/db"
	"psm/internal/utils"
	"strings"

	"gorm.io/gorm"
)

// SkillService Skill 管理服务
type SkillService struct {
	settingsSvc *SettingsService
}

// NewSkillService 创建 Skill 服务实例
func NewSkillService(settingsSvc *SettingsService) *SkillService {
	return &SkillService{
		settingsSvc: settingsSvc,
	}
}

// CreateSkill 创建空 Skill（创建目录 + 数据库记录）
func (s *SkillService) CreateSkill(name, description string, tags []string) (*db.Skill, error) {
	storagePath, err := s.settingsSvc.GetSkillStoragePath()
	if err != nil {
		return nil, fmt.Errorf("获取 Skill 存储路径失败: %w", err)
	}

	skillDir := filepath.Join(storagePath, name)
	if err := utils.EnsureDir(skillDir); err != nil {
		return nil, fmt.Errorf("创建 Skill 目录失败: %w", err)
	}

	skill := &db.Skill{
		Name:         name,
		Description:  description,
		RelativePath: name,
		Tags:         utils.MustMarshalJSON(tags),
	}

	if err := db.DB.Create(skill).Error; err != nil {
		return nil, fmt.Errorf("创建 Skill 记录失败: %w", err)
	}

	return skill, nil
}

// GetSkill 根据 ID 获取 Skill
func (s *SkillService) GetSkill(id int64) (*db.Skill, error) {
	var sk db.Skill
	if err := db.DB.First(&sk, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("skill (ID=%d) 不存在", id)
		}
		return nil, fmt.Errorf("查询 Skill 失败: %w", err)
	}
	return &sk, nil
}

// GetSkills 获取 Skill 列表，支持关键词搜索（匹配名称、描述、标签）
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

// UpdateSkill 更新 Skill 元数据，同时同步更新技能目录中的 SKILL.md frontmatter
func (s *SkillService) UpdateSkill(id int64, name, description string, tags []string) error {
	sk, err := s.GetSkill(id)
	if err != nil {
		return err
	}

	result := db.DB.Model(&db.Skill{}).Where("id = ?", id).Updates(map[string]interface{}{
		"name":        name,
		"description": description,
		"tags":        utils.MustMarshalJSON(tags),
	})

	if result.Error != nil {
		return fmt.Errorf("更新 Skill 失败: %w", result.Error)
	}
	if result.RowsAffected == 0 {
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

	result := db.DB.Delete(&db.Skill{}, id)
	if result.Error != nil {
		return fmt.Errorf("删除 Skill 记录失败: %w", result.Error)
	}
	if result.RowsAffected == 0 {
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

	result := db.DB.Unscoped().Delete(&db.Skill{}, ids)
	if result.Error != nil {
		return 0, fmt.Errorf("批量删除 Skill 失败: %w", result.Error)
	}
	return result.RowsAffected, nil
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

	var existsSkill db.Skill
	if err := db.DB.Where("name = ?", name).First(&existsSkill).Error; err == nil {
		return nil, fmt.Errorf("skill '%s' 已存在，请先删除或更改名称", name)
	}

	skillDir := filepath.Join(storagePath, name)
	if err := utils.UnzipToDir(zipPath, skillDir); err != nil {
		return nil, fmt.Errorf("解压 Skill 包失败: %w", err)
	}

	utils.FlattenIfNested(skillDir, name)

	skill := &db.Skill{
		Name:         name,
		Description:  metadata.Description,
		RelativePath: name,
	}

	if err := db.DB.Create(skill).Error; err != nil {
		return nil, fmt.Errorf("创建 Skill 记录失败: %w", err)
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

	type exportMarkerData struct {
		Skills map[string][]string `json:"skills"`
	}
	markerData := exportMarkerData{Skills: make(map[string][]string)}
	for _, file := range zipReader.File {
		if filepath.ToSlash(utils.FixFileName(file.Name)) == utils.SkillExportMarker {
			rc, err := file.Open()
			if err == nil {
				data, _ := io.ReadAll(rc)
				_ = rc.Close()
				if len(data) > 0 {
					_ = json.Unmarshal(data, &markerData)
				}
			}
			break
		}
	}

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

		var existsSkill db.Skill
		if err := db.DB.Where("name = ?", dirName).First(&existsSkill).Error; err == nil {
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

		tags := markerData.Skills[dirName]
		skill := &db.Skill{
			Name:         name,
			Description:  description,
			RelativePath: dirName,
			Tags:         utils.MustMarshalJSON(tags),
		}
		if err := db.DB.Create(skill).Error; err != nil {
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
		allSkills, err := s.GetSkills("")
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
	skillTags := make(map[string][]string, len(skills))
	for _, sk := range skills {
		skillDirs[sk.Name] = filepath.Join(storagePath, sk.RelativePath)
		var tags []string
		_ = json.Unmarshal([]byte(sk.Tags), &tags)
		if len(tags) > 0 {
			skillTags[sk.Name] = tags
		}
	}

	return utils.CreateSkillExportZip(skillDirs, skillTags, savePath)
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
			Name:     entry.Name(),
			IsDir:    entry.IsDir(),
			Size:     info.Size(),
			ModTime:  info.ModTime().Format("2006-01-02 15:04:05"),
			FullPath: filepath.Join(skillDir, entry.Name()),
		})
	}

	return files, nil
}

// GetRecentSkills 获取最近修改的 Skill 列表
func (s *SkillService) GetRecentSkills(limit int) ([]db.Skill, error) {
	if limit <= 0 {
		limit = 10
	}

	var skills []db.Skill
	if err := db.DB.Order("is_pinned DESC, updated_at DESC").Limit(limit).Find(&skills).Error; err != nil {
		return nil, fmt.Errorf("查询最近 Skill 列表失败: %w", err)
	}
	return skills, nil
}

// CountSkills 统计 Skill 总数
func (s *SkillService) CountSkills() (int64, error) {
	var count int64
	if err := db.DB.Model(&db.Skill{}).Count(&count).Error; err != nil {
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

	skills, err := s.GetSkills("")
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
	if err := db.DB.Unscoped().Delete(&db.Skill{}, ids).Error; err != nil {
		return fmt.Errorf("批量删除 Skill 失败: %w", err)
	}
	return nil
}

// TogglePinSkill 切换 Skill 的置顶状态
func (s *SkillService) TogglePinSkill(id int64) error {
	var sk db.Skill
	if err := db.DB.First(&sk, id).Error; err != nil {
		return fmt.Errorf("skill (ID=%d) 不存在", id)
	}

	newPinned := !sk.IsPinned
	if err := db.DB.Model(&db.Skill{}).Where("id = ?", id).Update("is_pinned", newPinned).Error; err != nil {
		return fmt.Errorf("切换置顶状态失败: %w", err)
	}
	return nil
}

// DeleteAllSkills 删除所有 Skill 记录和文件，deleteFiles 为 true 时同时删除文件系统中的文件
func (s *SkillService) DeleteAllSkills(deleteFiles bool) (int64, error) {
	if deleteFiles {
		storagePath, err := s.settingsSvc.GetSkillStoragePath()
		if err == nil {
			skills, _ := s.GetSkills("")
			for _, sk := range skills {
				fullPath := filepath.Join(storagePath, sk.RelativePath)
				_ = os.RemoveAll(fullPath)
			}
		}
	}

	result := db.DB.Unscoped().Where("1 = 1").Delete(&db.Skill{})
	if result.Error != nil {
		return 0, fmt.Errorf("删除所有 Skill 失败: %w", result.Error)
	}
	return result.RowsAffected, nil
}

// GetPinnedSkills 获取置顶的 Skill 列表
func (s *SkillService) GetPinnedSkills(limit int) ([]db.Skill, error) {
	if limit <= 0 {
		limit = 3
	}

	var skills []db.Skill
	if err := db.DB.Where("is_pinned = ?", true).Order("updated_at DESC").Limit(limit).Find(&skills).Error; err != nil {
		return nil, fmt.Errorf("获取置顶 Skill 列表失败: %w", err)
	}

	if skills == nil {
		skills = []db.Skill{}
	}
	return skills, nil
}

// BatchAddTags 批量为指定 Skill 添加标签（自动去重）
func (s *SkillService) BatchAddTags(ids []int64, tags []string) error {
	if len(ids) == 0 {
		return nil
	}
	for _, id := range ids {
		var skill db.Skill
		if err := db.DB.First(&skill, id).Error; err != nil {
			continue
		}

		var existingTags []string
		if err := json.Unmarshal([]byte(skill.Tags), &existingTags); err != nil {
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

		if err := db.DB.Model(&db.Skill{}).Where("id = ?", id).Update("tags", string(newTagsJSON)).Error; err != nil {
			return fmt.Errorf("更新 Skill (ID=%d) 标签失败: %w", id, err)
		}
	}
	return nil
}

// BatchRemoveTags 批量从指定 Skill 中移除标签
func (s *SkillService) BatchRemoveTags(ids []int64, tags []string) error {
	if len(ids) == 0 {
		return nil
	}
	removeSet := make(map[string]bool, len(tags))
	for _, t := range tags {
		removeSet[t] = true
	}

	for _, id := range ids {
		var skill db.Skill
		if err := db.DB.First(&skill, id).Error; err != nil {
			continue
		}

		var existingTags []string
		if err := json.Unmarshal([]byte(skill.Tags), &existingTags); err != nil {
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

		if err := db.DB.Model(&db.Skill{}).Where("id = ?", id).Update("tags", string(newTagsJSON)).Error; err != nil {
			return fmt.Errorf("更新 Skill (ID=%d) 标签失败: %w", id, err)
		}
	}
	return nil
}

// BatchSetPin 批量设置指定 Skill 的置顶状态
func (s *SkillService) BatchSetPin(ids []int64, pinned bool) error {
	if len(ids) == 0 {
		return nil
	}
	result := db.DB.Model(&db.Skill{}).Where("id IN ?", ids).Update("is_pinned", pinned)
	if result.Error != nil {
		return fmt.Errorf("批量设置置顶状态失败: %w", result.Error)
	}
	if result.RowsAffected == 0 {
		return fmt.Errorf("未找到匹配的 Skill 记录")
	}
	return nil
}
