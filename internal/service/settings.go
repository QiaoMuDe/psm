package service

import (
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"psm/internal/db"
	"psm/internal/utils"

	"gitee.com/MM-Q/fastlog"
	"gorm.io/gorm"
)

// SettingsService 系统设置服务
type SettingsService struct {
	logger *fastlog.Logger
}

// NewSettingsService 创建设置服务实例
func NewSettingsService(logger *fastlog.Logger) *SettingsService {
	return &SettingsService{logger: logger}
}

// GetSettings 获取所有设置项，返回 map[string]string
func (s *SettingsService) GetSettings() (map[string]string, error) {
	s.logger.Debugw("GetSettings")
	var settings []db.Settings
	if err := db.DB.Find(&settings).Error; err != nil {
		s.logger.Errorw("查询设置项失败", fastlog.Error(err))
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
	s.logger.Debugw("GetSetting", fastlog.String("key", key))
	var setting db.Settings
	if err := db.DB.Where("key = ?", key).First(&setting).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			s.logger.Warnw("设置项不存在", fastlog.String("key", key))
		}
		return "", fmt.Errorf("设置项 '%s' 不存在", key)
	}
	return setting.Value, nil
}

// UpdateSetting 更新单个设置项
func (s *SettingsService) UpdateSetting(key, value string) error {
	result := db.DB.Where(db.Settings{Key: key}).Assign(db.Settings{Value: value}).FirstOrCreate(&db.Settings{})
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			s.logger.Warnw("设置项不存在", fastlog.String("key", key))
		} else {
			s.logger.Errorw("更新设置失败", fastlog.String("key", key), fastlog.Error(result.Error))
		}
		return fmt.Errorf("更新设置项 '%s' 失败: %w", key, result.Error)
	}
	s.logger.Infow("更新设置成功", fastlog.String("key", key))
	return nil
}

// UpdateSettings 批量更新设置项
func (s *SettingsService) UpdateSettings(settings map[string]string) error {
	err := db.DB.Transaction(func(tx *gorm.DB) error {
		for key, value := range settings {
			if err := tx.Where(db.Settings{Key: key}).Assign(db.Settings{Value: value}).FirstOrCreate(&db.Settings{}).Error; err != nil {
				s.logger.Errorw("批量更新设置失败", fastlog.String("key", key), fastlog.Error(err))
				return fmt.Errorf("更新设置项 '%s' 失败: %w", key, err)
			}
		}
		return nil
	})
	if err != nil {
		return err
	}
	s.logger.Infow("批量更新设置成功", fastlog.Int("count", len(settings)))
	return nil
}

// GetAppHome 获取程序家目录路径
func (s *SettingsService) GetAppHome() (string, error) {
	s.logger.Debugw("GetAppHome")
	path, err := s.GetSetting("app_home")
	if err != nil {
		homeDir, _ := os.UserHomeDir()
		return filepath.Join(homeDir, ".psm"), nil
	}
	return utils.ExpandHome(path)
}

// GetSkillStoragePath 获取 Skill 存储的绝对路径（始终为 app_home/skills）
func (s *SettingsService) GetSkillStoragePath() (string, error) {
	s.logger.Debugw("GetSkillStoragePath")
	appHome, err := s.GetAppHome()
	if err != nil {
		return "", err
	}
	return filepath.Join(appHome, "skills"), nil
}

// ResetSettings 重置所有设置为默认值
func (s *SettingsService) ResetSettings() error {
	s.logger.Infow("重置所有设置")
	err := db.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Unscoped().Where("1 = 1").Delete(&db.Settings{}).Error; err != nil {
			return fmt.Errorf("清空设置失败: %w", err)
		}

		homeDir, _ := os.UserHomeDir()
		appHome := filepath.Join(homeDir, ".psm")
		defaults := db.DefaultSettings(appHome)

		if err := tx.Create(&defaults).Error; err != nil {
			return fmt.Errorf("插入默认设置失败: %w", err)
		}

		return nil
	})
	if err != nil {
		s.logger.Errorw("重置设置失败", fastlog.Error(err))
	}
	return err
}
