package service

import (
	"fmt"
	"os"
	"path/filepath"
	"psm/internal/db"
	"psm/internal/utils"

	"gorm.io/gorm"
)

// SettingsService 系统设置服务
type SettingsService struct{}

// NewSettingsService 创建设置服务实例
func NewSettingsService() *SettingsService {
	return &SettingsService{}
}

// GetSettings 获取所有设置项，返回 map[string]string
func (s *SettingsService) GetSettings() (map[string]string, error) {
	var settings []db.Settings
	if err := db.DB.Find(&settings).Error; err != nil {
		return nil, fmt.Errorf("查询设置项失败: %w", err)
	}

	result := make(map[string]string)
	for _, setting := range settings {
		result[setting.Key] = setting.Value
	}
	return result, nil
}

// GetSetting 获取单个设置项
func (s *SettingsService) GetSetting(key string) (string, error) {
	var setting db.Settings
	if err := db.DB.Where("key = ?", key).First(&setting).Error; err != nil {
		return "", fmt.Errorf("设置项 '%s' 不存在", key)
	}
	return setting.Value, nil
}

// UpdateSetting 更新单个设置项
func (s *SettingsService) UpdateSetting(key, value string) error {
	result := db.DB.Where(db.Settings{Key: key}).Assign(db.Settings{Value: value}).FirstOrCreate(&db.Settings{})
	if result.Error != nil {
		return fmt.Errorf("更新设置项 '%s' 失败: %w", key, result.Error)
	}
	return nil
}

// UpdateSettings 批量更新设置项
func (s *SettingsService) UpdateSettings(settings map[string]string) error {
	return db.DB.Transaction(func(tx *gorm.DB) error {
		for key, value := range settings {
			if err := tx.Where(db.Settings{Key: key}).Assign(db.Settings{Value: value}).FirstOrCreate(&db.Settings{}).Error; err != nil {
				return fmt.Errorf("更新设置项 '%s' 失败: %w", key, err)
			}
		}
		return nil
	})
}

// GetAppHome 获取程序家目录路径
func (s *SettingsService) GetAppHome() (string, error) {
	path, err := s.GetSetting("app_home")
	if err != nil {
		homeDir, _ := os.UserHomeDir()
		return filepath.Join(homeDir, ".psm"), nil
	}
	return utils.ExpandHome(path)
}

// GetSkillStoragePath 获取 Skill 存储的绝对路径（始终为 app_home/skills）
func (s *SettingsService) GetSkillStoragePath() (string, error) {
	appHome, err := s.GetAppHome()
	if err != nil {
		return "", err
	}
	return filepath.Join(appHome, "skills"), nil
}

// ResetSettings 重置所有设置为默认值
func (s *SettingsService) ResetSettings() error {
	return db.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Unscoped().Delete(&db.Settings{}).Error; err != nil {
			return fmt.Errorf("清空设置失败: %w", err)
		}

		homeDir, _ := os.UserHomeDir()
		appHome := filepath.Join(homeDir, ".psm")

		defaults := []db.Settings{
			{Key: "app_home", Value: appHome},
			{Key: "app_theme", Value: "light"},
			{Key: "prompt_view_mode", Value: "card"},
			{Key: "skill_view_mode", Value: "card"},
			{Key: "sidebar_collapsed", Value: "false"},
			{Key: "font_size_offset", Value: "0px"},
			{Key: "font_family", Value: ""},
		}

		if err := tx.Create(&defaults).Error; err != nil {
			return fmt.Errorf("插入默认设置失败: %w", err)
		}

		return nil
	})
}
