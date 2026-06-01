// Package db 提供数据库连接和操作工具函数，基于 GORM 实现
package db

import (
	"fmt"
	"os"
	"path/filepath"

	"gitee.com/MM-Q/fastlog"
	"github.com/glebarez/sqlite"
	"gorm.io/gorm"
	gormlogger "gorm.io/gorm/logger"
)

// DB 全局 GORM 数据库实例
var DB *gorm.DB

// InitDB 初始化 GORM 数据库连接，执行自动迁移并插入默认设置
func InitDB(dbPath string, logger *fastlog.Logger) error {
	var err error

	dir := filepath.Dir(dbPath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		logger.Errorw("创建数据库目录失败", fastlog.Error(err))
		return fmt.Errorf("创建数据库目录失败: %w", err)
	}

	DB, err = gorm.Open(sqlite.Open(dbPath), &gorm.Config{
		Logger: gormlogger.Default.LogMode(gormlogger.Warn),
	})
	if err != nil {
		logger.Errorw("连接数据库失败", fastlog.Error(err))
		return fmt.Errorf("连接数据库失败: %w", err)
	}

	sqlDB, err := DB.DB()
	if err != nil {
		logger.Errorw("获取底层数据库连接失败", fastlog.Error(err))
		return fmt.Errorf("获取底层数据库连接失败: %w", err)
	}

	if _, err := sqlDB.Exec("PRAGMA journal_mode=WAL"); err != nil {
		logger.Errorw("启用 WAL 模式失败", fastlog.Error(err))
		return fmt.Errorf("启用 WAL 模式失败: %w", err)
	}

	sqlDB.SetMaxOpenConns(1)

	if err := DB.AutoMigrate(&Settings{}, &Prompt{}, &Skill{}); err != nil {
		logger.Errorw("自动迁移失败", fastlog.Error(err))
		return fmt.Errorf("自动迁移失败: %w", err)
	}

	if err := initDefaultSettings(); err != nil {
		logger.Errorw("初始化默认设置失败", fastlog.Error(err))
		return fmt.Errorf("初始化默认设置失败: %w", err)
	}
	logger.Info("默认设置初始化完成")

	logger.Info("数据库初始化完成")
	return nil
}

// initDefaultSettings 初始化默认设置项，已存在的设置项不会被覆盖
func initDefaultSettings() error {
	homeDir, _ := os.UserHomeDir()
	appHome := filepath.Join(homeDir, ".psm")

	for _, s := range DefaultSettings(appHome) {
		var count int64
		DB.Model(&Settings{}).Where("key = ?", s.Key).Count(&count)
		if count == 0 {
			DB.Create(&s)
		}
	}

	return nil
}
