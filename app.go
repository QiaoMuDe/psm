package main

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"psm/internal/db"
	"psm/internal/handler"
	"psm/internal/service"
)

// App 应用主结构体，通过嵌入 Handler 组织各领域方法
type App struct {
	ctx context.Context

	handler.SettingsHandler
	handler.PromptHandler
	handler.SkillHandler
	handler.BackupHandler
}

// NewApp 创建应用实例
func NewApp() *App {
	return &App{}
}

// startup 应用启动生命周期回调，初始化数据库和各服务
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx

	homeDir, _ := os.UserHomeDir()
	dbPath := filepath.Join(homeDir, ".psm", "data.db")

	if err := db.InitDB(dbPath); err != nil {
		panic(fmt.Sprintf("初始化数据库失败: %v", err))
	}

	settingsSvc := service.NewSettingsService()
	promptSvc := service.NewPromptService()
	skillSvc := service.NewSkillService(settingsSvc)

	storagePath, err := settingsSvc.GetSkillStoragePath()
	if err == nil {
		_ = os.MkdirAll(storagePath, 0755)
	}

	a.SettingsHandler.Init(ctx, settingsSvc)
	a.PromptHandler.Init(promptSvc)
	a.SkillHandler.Init(skillSvc)
	a.BackupHandler.Init(settingsSvc, promptSvc, skillSvc)
}

// shutdown 应用关闭生命周期回调，关闭数据库连接
func (a *App) shutdown(ctx context.Context) {
	if db.DB != nil {
		sqlDB, _ := db.DB.DB()
		if sqlDB != nil {
			_ = sqlDB.Close()
		}
	}
}
