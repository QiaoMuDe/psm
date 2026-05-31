package service

import (
	"database/sql"
	"fmt"
	"os"
	"path/filepath"
	"psm/internal/utils"
)

// SettingsService 系统设置服务
type SettingsService struct {
	db *sql.DB
}

// NewSettingsService 创建设置服务实例
func NewSettingsService(db *sql.DB) *SettingsService {
	return &SettingsService{db: db}
}

// GetSettings 获取所有设置项，返回 map[string]string
func (s *SettingsService) GetSettings() (map[string]string, error) {
	rows, err := s.db.Query("SELECT key, value FROM settings")
	if err != nil {
		return nil, fmt.Errorf("查询设置项失败: %w", err)
	}
	defer func() { _ = rows.Close() }()

	settings := make(map[string]string)
	for rows.Next() {
		var key, value string
		if err := rows.Scan(&key, &value); err != nil {
			return nil, fmt.Errorf("读取设置项失败: %w", err)
		}
		settings[key] = value
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("遍历设置项失败: %w", err)
	}

	return settings, nil
}

// GetSetting 获取单个设置项
func (s *SettingsService) GetSetting(key string) (string, error) {
	var value string
	err := s.db.QueryRow("SELECT value FROM settings WHERE key = ?", key).Scan(&value)
	if err == sql.ErrNoRows {
		return "", fmt.Errorf("设置项 '%s' 不存在", key)
	}
	if err != nil {
		return "", fmt.Errorf("查询设置项 '%s' 失败: %w", key, err)
	}
	return value, nil
}

// UpdateSetting 更新单个设置项
func (s *SettingsService) UpdateSetting(key, value string) error {
	_, err := s.db.Exec("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)", key, value)
	if err != nil {
		return fmt.Errorf("更新设置项 '%s' 失败: %w", key, err)
	}
	return nil
}

// UpdateSettings 批量更新设置项
func (s *SettingsService) UpdateSettings(settings map[string]string) error {
	tx, err := s.db.Begin()
	if err != nil {
		return fmt.Errorf("开启事务失败: %w", err)
	}

	stmt, err := tx.Prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)")
	if err != nil {
		_ = tx.Rollback()
		return fmt.Errorf("预编译语句失败: %w", err)
	}
	defer func() { _ = stmt.Close() }()

	for key, value := range settings {
		if _, err := stmt.Exec(key, value); err != nil {
			_ = tx.Rollback()
			return fmt.Errorf("更新设置项 '%s' 失败: %w", key, err)
		}
	}

	if err := tx.Commit(); err != nil {
		return fmt.Errorf("提交事务失败: %w", err)
	}
	return nil
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
	tx, err := s.db.Begin()
	if err != nil {
		return fmt.Errorf("开启事务失败: %w", err)
	}

	if _, err := tx.Exec("DELETE FROM settings"); err != nil {
		_ = tx.Rollback()
		return fmt.Errorf("清空设置失败: %w", err)
	}

	homeDir, _ := os.UserHomeDir()
	appHome := filepath.Join(homeDir, ".psm")

	defaults := map[string]string{
		"app_home":          appHome,
		"app_theme":         "light",
		"prompt_view_mode":  "card",
		"skill_view_mode":   "card",
		"sidebar_collapsed": "false",
		"font_size_offset":  "0px",
		"font_family":       "",
	}

	stmt, err := tx.Prepare("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)")
	if err != nil {
		_ = tx.Rollback()
		return fmt.Errorf("预编译语句失败: %w", err)
	}
	defer func() { _ = stmt.Close() }()

	for key, value := range defaults {
		if _, err := stmt.Exec(key, value); err != nil {
			_ = tx.Rollback()
			return fmt.Errorf("插入默认设置 '%s' 失败: %w", key, err)
		}
	}

	if err := tx.Commit(); err != nil {
		return fmt.Errorf("提交事务失败: %w", err)
	}
	return nil
}
