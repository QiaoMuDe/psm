package handler

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"time"

	"gitee.com/MM-Q/fastlog"

	"psm/internal/db"
	"psm/internal/service"
	"psm/internal/utils"
)

// BackupHandler 处理备份恢复和数据统计相关的方法，嵌入到 App 结构体
type BackupHandler struct {
	settingsSvc *service.SettingsService
	promptSvc   *service.PromptService
	skillSvc    *service.SkillService
	logger      *fastlog.Logger
}

// Init 初始化 BackupHandler
func (h *BackupHandler) Init(settingsSvc *service.SettingsService, promptSvc *service.PromptService, skillSvc *service.SkillService, logger *fastlog.Logger) {
	h.settingsSvc = settingsSvc
	h.promptSvc = promptSvc
	h.skillSvc = skillSvc
	h.logger = logger
}

// BackupData 创建完整备份
func (h *BackupHandler) BackupData(savePath string) error {
	settings, err := h.settingsSvc.GetSettings()
	if err != nil {
		h.logger.Errorw("备份获取设置失败", fastlog.Error(err))
		return fmt.Errorf("获取设置失败: %w", err)
	}

	prompts, err := h.promptSvc.GetPrompts("", "")
	if err != nil {
		h.logger.Errorw("备份获取提示词失败", fastlog.Error(err))
		return fmt.Errorf("获取提示词失败: %w", err)
	}

	skills, err := h.skillSvc.GetSkills("")
	if err != nil {
		h.logger.Errorw("备份获取技能失败", fastlog.Error(err))
		return fmt.Errorf("获取技能失败: %w", err)
	}

	backupPrompts := make([]utils.BackupPrompt, 0, len(prompts))
	for _, p := range prompts {
		backupPrompts = append(backupPrompts, utils.BackupPrompt{
			Name:       p.Name,
			Content:    p.Content,
			Category:   p.Category,
			Tags:       p.Tags,
			IsPinned:   p.IsPinned,
			IsTemplate: p.IsTemplate,
			UsageCount: p.UsageCount,
			CreatedAt:  p.CreatedAt.Format(time.RFC3339),
			UpdatedAt:  p.UpdatedAt.Format(time.RFC3339),
		})
	}

	backupSkills := make([]utils.BackupSkill, 0, len(skills))
	for _, s := range skills {
		backupSkills = append(backupSkills, utils.BackupSkill{
			Name:         s.Name,
			Description:  s.Description,
			RelativePath: s.RelativePath,
			Tags:         s.Tags,
			IsPinned:     s.IsPinned,
			CreatedAt:    s.CreatedAt.Format(time.RFC3339),
			UpdatedAt:    s.UpdatedAt.Format(time.RFC3339),
		})
	}

	data := &utils.BackupData{
		Version:  "1.0",
		Settings: settings,
		Prompts:  backupPrompts,
		Skills:   backupSkills,
	}

	skillPath, err := h.settingsSvc.GetSkillStoragePath()
	if err != nil {
		skillPath = ""
	}

	if err := utils.CreateBackupArchive(data, skillPath, savePath); err != nil {
		h.logger.Errorw("创建备份归档失败", fastlog.Error(err))
		return err
	}

	h.logger.Warnw("备份完成", fastlog.String("path", savePath))

	return nil
}

// RestoreData 从备份 ZIP 文件恢复所有数据
func (h *BackupHandler) RestoreData(zipPath string) (*utils.BackupRestoreResult, error) {
	skillPath, err := h.settingsSvc.GetSkillStoragePath()
	if err != nil {
		skillPath = ""
	}

	backupData, err := utils.RestoreBackupArchive(zipPath, skillPath)
	if err != nil {
		h.logger.Errorw("备份恢复解压失败", fastlog.Error(err))
		return nil, err
	}

	if backupData.Settings != nil {
		delete(backupData.Settings, "skill_storage_path")
		delete(backupData.Settings, "app_home")
		if err := h.settingsSvc.UpdateSettings(backupData.Settings); err != nil {
			h.logger.Errorw("恢复设置失败", fastlog.Error(err))
			return nil, fmt.Errorf("恢复设置失败: %w", err)
		}
	}

	result := &utils.BackupRestoreResult{}

	for _, p := range backupData.Prompts {
		var count int64
		_ = db.DB.Model(&db.Prompt{}).Where("name = ?", p.Name).Count(&count).Error
		if count > 0 {
			result.PromptsSkipped++
			continue
		}
		var tags []string
		_ = json.Unmarshal([]byte(p.Tags), &tags)
		created, err := h.promptSvc.CreatePrompt(p.Name, p.Content, p.Category, tags, p.IsTemplate)
		if err != nil {
			continue
		}
		if p.IsPinned || p.UsageCount > 0 {
			updates := map[string]interface{}{}
			if p.IsPinned {
				updates["is_pinned"] = true
			}
			if p.UsageCount > 0 {
				updates["usage_count"] = p.UsageCount
			}
			_ = db.DB.Model(&db.Prompt{}).Where("id = ?", created.ID).Updates(updates).Error
		}
		result.PromptsRestored++
	}

	for _, s := range backupData.Skills {
		existing, _ := h.skillSvc.GetSkills("")
		duplicated := false
		for _, e := range existing {
			if e.Name == s.Name {
				duplicated = true
				break
			}
		}
		if duplicated {
			result.SkillsSkipped++
			continue
		}
		var tags []string
		_ = json.Unmarshal([]byte(s.Tags), &tags)
		created, err := h.skillSvc.CreateSkill(s.Name, s.Description, tags)
		if err != nil {
			continue
		}
		if s.IsPinned {
			_ = db.DB.Model(&db.Skill{}).Where("id = ?", created.ID).Update("is_pinned", true).Error
		}
		result.SkillsRestored++
	}

	h.logger.Warnw("数据恢复完成",
		fastlog.Int("prompts_restored", result.PromptsRestored),
		fastlog.Int("prompts_skipped", result.PromptsSkipped),
		fastlog.Int("skills_restored", result.SkillsRestored),
		fastlog.Int("skills_skipped", result.SkillsSkipped),
	)

	return result, nil
}

// DataStats 数据统计信息
type DataStats struct {
	PromptCount int64 `json:"prompt_count"`
	SkillCount  int64 `json:"skill_count"`
	DBSize      int64 `json:"db_size"`
}

// GetDataStats 获取数据统计信息
func (h *BackupHandler) GetDataStats() (*DataStats, error) {
	h.logger.Warnw("获取数据统计")

	promptCount, err := h.promptSvc.CountPrompts()
	if err != nil {
		return nil, fmt.Errorf("统计 Prompt 失败: %w", err)
	}
	skillCount, err := h.skillSvc.CountSkills()
	if err != nil {
		return nil, fmt.Errorf("统计 Skill 失败: %w", err)
	}

	var dbSize int64
	homeDir, err := os.UserHomeDir()
	if err == nil {
		dbPath := filepath.Join(homeDir, ".psm", "data.db")
		if info, err := os.Stat(dbPath); err == nil {
			dbSize = info.Size()
		}
	}

	return &DataStats{
		PromptCount: promptCount,
		SkillCount:  skillCount,
		DBSize:      dbSize,
	}, nil
}

// GetOrphanSkills 获取文件已不存在的孤立 Skill 列表
func (h *BackupHandler) GetOrphanSkills() ([]db.Skill, error) {
	h.logger.Warnw("检测孤立 Skill")

	return h.skillSvc.GetOrphanSkills()
}

// ResetAllData 重置所有数据：清空提示词、技能（含文件）、恢复默认设置
func (h *BackupHandler) ResetAllData() (map[string]int64, error) {
	h.logger.Warnw("用户执行数据重置")

	promptCount, err := h.promptSvc.DeleteAllPrompts()
	if err != nil {
		h.logger.Errorw("重置清空提示词失败", fastlog.Error(err))
		return nil, fmt.Errorf("清空提示词失败: %w", err)
	}

	skillCount, err := h.skillSvc.DeleteAllSkills(true)
	if err != nil {
		h.logger.Errorw("重置清空技能失败", fastlog.Error(err))
		return nil, fmt.Errorf("清空技能失败: %w", err)
	}

	if err := h.settingsSvc.ResetSettings(); err != nil {
		h.logger.Errorw("重置恢复默认设置失败", fastlog.Error(err))
		return nil, fmt.Errorf("重置设置失败: %w", err)
	}

	return map[string]int64{
		"prompts_deleted": promptCount,
		"skills_deleted":  skillCount,
	}, nil
}

// CleanupOrphanSkills 清理孤立 Skill 数据并删除残留目录
func (h *BackupHandler) CleanupOrphanSkills() (int, error) {
	h.logger.Warnw("清理孤立 Skill")

	orphans, err := h.skillSvc.GetOrphanSkills()
	if err != nil {
		return 0, fmt.Errorf("检测孤立 Skill 失败: %w", err)
	}
	if len(orphans) == 0 {
		return 0, nil
	}

	storagePath, err := h.settingsSvc.GetSkillStoragePath()
	if err != nil {
		return 0, fmt.Errorf("获取存储路径失败: %w", err)
	}

	for _, sk := range orphans {
		skillDir := filepath.Join(storagePath, sk.RelativePath)
		if _, statErr := os.Stat(skillDir); statErr == nil {
			if rmErr := os.RemoveAll(skillDir); rmErr != nil {
				h.logger.Warnw("删除残留目录失败", fastlog.String("dir", skillDir), fastlog.Error(rmErr))
			} else {
				h.logger.Infow("已删除残留目录", fastlog.String("dir", skillDir))
			}
		}
	}

	ids := make([]int64, len(orphans))
	for i, sk := range orphans {
		ids[i] = sk.ID
	}
	if err := h.skillSvc.DeleteSkills(ids); err != nil {
		return 0, fmt.Errorf("删除孤立 Skill 失败: %w", err)
	}
	return len(orphans), nil
}

// getBackupPath 获取一键备份的固定存储路径
func getBackupPath() (string, error) {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return "", fmt.Errorf("获取用户主目录失败: %w", err)
	}
	return filepath.Join(homeDir, ".psm", "backup", "psm-backup.zip"), nil
}

// QuickBackupInfo 获取一键备份的状态信息
func (h *BackupHandler) QuickBackupInfo() (map[string]interface{}, error) {
	h.logger.Warnw("获取快速备份信息")

	backupPath, err := getBackupPath()
	if err != nil {
		return nil, err
	}

	info, statErr := os.Stat(backupPath)
	result := map[string]interface{}{
		"exists": statErr == nil,
	}

	if statErr == nil && info != nil {
		result["backup_time"] = info.ModTime().Format("2006-01-02 15:04:05")
		result["file_size"] = info.Size()
	}

	return result, nil
}

// QuickBackup 一键备份到固定路径，覆盖上次备份
func (h *BackupHandler) QuickBackup() error {
	backupPath, err := getBackupPath()
	if err != nil {
		return err
	}
	return h.BackupData(backupPath)
}

// QuickRestore 从固定备份路径一键还原
func (h *BackupHandler) QuickRestore() (*utils.BackupRestoreResult, error) {
	backupPath, err := getBackupPath()
	if err != nil {
		return nil, err
	}

	if _, err := os.Stat(backupPath); os.IsNotExist(err) {
		return nil, fmt.Errorf("备份文件不存在，请先执行一键备份")
	}

	return h.RestoreData(backupPath)
}
