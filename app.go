package main

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"psm/internal/db"
	"psm/internal/handler"
	psmlog "psm/internal/log"
	"psm/internal/service"

	"gitee.com/MM-Q/fastlog"
)

// App 应用主结构体，通过嵌入 Handler 组织各领域方法
type App struct {
	ctx    context.Context
	logger *fastlog.Logger

	handler.SettingsHandler
	handler.PromptHandler
	handler.SkillHandler
	handler.BackupHandler
	handler.AIHandler
}

// NewApp 创建应用实例
func NewApp() *App {
	return &App{}
}

// startup 应用启动生命周期回调，初始化日志、数据库和各服务
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx

	homeDir, _ := os.UserHomeDir()
	appHome := filepath.Join(homeDir, ".psm")

	psmlog.Init(filepath.Join(appHome, "logs", "psm.log"))
	a.logger = psmlog.Get()

	logger := psmlog.Get()

	dbPath := filepath.Join(appHome, "data.db")

	if err := db.InitDB(dbPath, logger); err != nil {
		panic(fmt.Sprintf("初始化数据库失败: %v", err))
	}

	settingsSvc := service.NewSettingsService(logger)
	promptSvc := service.NewPromptService(logger)
	skillSvc := service.NewSkillService(settingsSvc, logger)

	storagePath, err := settingsSvc.GetSkillStoragePath()
	if err == nil {
		_ = os.MkdirAll(storagePath, 0755)
	}

	a.SettingsHandler.Init(ctx, settingsSvc, logger)
	a.PromptHandler.Init(promptSvc, logger)
	a.SkillHandler.Init(skillSvc, logger)
	a.BackupHandler.Init(settingsSvc, promptSvc, skillSvc, logger)
	a.AIHandler.Init(ctx, settingsSvc, logger)

	// 加载并应用日志级别配置
	logLevel, _ := settingsSvc.GetSetting("log_level")
	if logLevel != "" {
		if err := psmlog.SetLevel(logLevel); err != nil {
			logger.Warnw("日志级别配置无效，使用默认值 WARN", fastlog.String("config", logLevel))
		} else {
			logger.Infow("日志级别设置为", fastlog.String("level", logLevel))
		}
	}

	logger.Info("应用启动成功")
}

// shutdown 应用关闭生命周期回调，记录日志并关闭数据库连接
func (a *App) shutdown(ctx context.Context) {
	logger := psmlog.Get()
	if logger != nil {
		logger.Info("应用关闭")
	}

	if db.DB != nil {
		sqlDB, _ := db.DB.DB()
		if sqlDB != nil {
			_ = sqlDB.Close()
		}
	}

	psmlog.Close()
}
