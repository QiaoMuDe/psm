package main

import (
	"context"
	"database/sql"
	"fmt"
	"os"
	"path/filepath"
	"psm/internal/db"
	"psm/internal/handler"
	"psm/internal/service"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// App 应用主结构体，通过嵌入 Handler 组织各领域方法
type App struct {
	ctx      context.Context
	database *sql.DB

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

	database, err := db.InitDB(dbPath)
	if err != nil {
		panic(fmt.Sprintf("初始化数据库失败: %v", err))
	}
	a.database = database

	settingsSvc := service.NewSettingsService(database)
	promptSvc := service.NewPromptService(database)
	skillSvc := service.NewSkillService(database, settingsSvc)

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
	if a.database != nil {
		_ = a.database.Close()
	}
}

// SelectDirectoryDialog 打开目录选择对话框（备份恢复使用）
func (a *App) SelectDirectoryDialog() (string, error) {
	return runtime.OpenDirectoryDialog(a.ctx, runtime.OpenDialogOptions{
		Title: "选择目录",
	})
}
