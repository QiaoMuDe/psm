package handler

import (
	"fmt"
	"os"
	"path/filepath"
	"psm/internal/db"
	"psm/internal/service"
	"psm/internal/utils"
)

// BackupHandler 处理备份恢复和数据统计相关的方法，嵌入到 App 结构体
type BackupHandler struct {
	settingsSvc *service.SettingsService
	promptSvc   *service.PromptService
	skillSvc    *service.SkillService
}

// Init 初始化 BackupHandler
func (h *BackupHandler) Init(settingsSvc *service.SettingsService, promptSvc *service.PromptService, skillSvc *service.SkillService) {
	h.settingsSvc = settingsSvc
	h.promptSvc = promptSvc
	h.skillSvc = skillSvc
}

// BackupData 创建完整备份
func (h *BackupHandler) BackupData(savePath string) error {
	settings, err := h.settingsSvc.GetSettings()
	if err != nil {
		return fmt.Errorf("获取设置失败: %w", err)
	}

	prompts, err := h.promptSvc.GetPrompts("", "")
	if err != nil {
		return fmt.Errorf("获取提示词失败: %w", err)
	}

	skills, err := h.skillSvc.GetSkills()
	if err != nil {
		return fmt.Errorf("获取技能失败: %w", err)
	}

	backupPrompts := make([]utils.BackupPrompt, 0, len(prompts))
	for _, p := range prompts {
		backupPrompts = append(backupPrompts, utils.BackupPrompt{
			Name:      p.Name,
			Content:   p.Content,
			Category:  p.Category,
			Tags:      p.Tags,
			CreatedAt: p.CreatedAt,
			UpdatedAt: p.UpdatedAt,
		})
	}

	backupSkills := make([]utils.BackupSkill, 0, len(skills))
	for _, s := range skills {
		backupSkills = append(backupSkills, utils.BackupSkill{
			Name:         s.Name,
			Description:  s.Description,
			RelativePath: s.RelativePath,
			CreatedAt:    s.CreatedAt,
			UpdatedAt:    s.UpdatedAt,
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

	return utils.CreateBackupArchive(data, skillPath, savePath)
}

// RestoreData 从备份 ZIP 文件恢复所有数据
func (h *BackupHandler) RestoreData(zipPath string) (*utils.BackupRestoreResult, error) {
	skillPath, err := h.settingsSvc.GetSkillStoragePath()
	if err != nil {
		skillPath = ""
	}

	backupData, err := utils.RestoreBackupArchive(zipPath, skillPath)
	if err != nil {
		return nil, err
	}

	if backupData.Settings != nil {
		delete(backupData.Settings, "skill_storage_path")
		if err := h.settingsSvc.UpdateSettings(backupData.Settings); err != nil {
			return nil, fmt.Errorf("恢复设置失败: %w", err)
		}
	}

	result := &utils.BackupRestoreResult{}

	for _, p := range backupData.Prompts {
		existing, _ := h.promptSvc.GetPrompts(p.Name, "")
		if len(existing) > 0 {
			result.PromptsSkipped++
			continue
		}
		_, err := h.promptSvc.CreatePrompt(p.Name, p.Content, p.Category, p.Tags, false)
		if err != nil {
			continue
		}
		result.PromptsRestored++
	}

	for _, s := range backupData.Skills {
		existing, _ := h.skillSvc.GetSkills()
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
		_, err := h.skillSvc.CreateSkill(s.Name, s.Description)
		if err != nil {
			continue
		}
		result.SkillsRestored++
	}

	return result, nil
}

// DataStats 数据统计信息
type DataStats struct {
	PromptCount int   `json:"prompt_count"`
	SkillCount  int   `json:"skill_count"`
	DBSize      int64 `json:"db_size"`
}

// GetDataStats 获取数据统计信息
func (h *BackupHandler) GetDataStats() (*DataStats, error) {
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
	return h.skillSvc.GetOrphanSkills()
}

// ResetAllData 重置所有数据：清空提示词、技能（含文件）、恢复默认设置
func (h *BackupHandler) ResetAllData() (map[string]int64, error) {
	promptCount, err := h.promptSvc.DeleteAllPrompts()
	if err != nil {
		return nil, fmt.Errorf("清空提示词失败: %w", err)
	}

	skillCount, err := h.skillSvc.DeleteAllSkills(true)
	if err != nil {
		return nil, fmt.Errorf("清空技能失败: %w", err)
	}

	if err := h.settingsSvc.ResetSettings(); err != nil {
		return nil, fmt.Errorf("重置设置失败: %w", err)
	}

	return map[string]int64{
		"prompts_deleted": promptCount,
		"skills_deleted":  skillCount,
	}, nil
}

// CleanupOrphanSkills 清理孤立 Skill 数据
func (h *BackupHandler) CleanupOrphanSkills() (int, error) {
	orphans, err := h.skillSvc.GetOrphanSkills()
	if err != nil {
		return 0, fmt.Errorf("检测孤立 Skill 失败: %w", err)
	}
	if len(orphans) == 0 {
		return 0, nil
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
