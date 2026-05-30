package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"psm/internal/db"
	"psm/internal/service"
	"psm/internal/utils"
	"strings"

	"gitee.com/MM-Q/verman"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// App 应用主结构体，持有数据库连接和各服务实例
type App struct {
	ctx         context.Context
	database    *sql.DB
	settingsSvc *service.SettingsService
	promptSvc   *service.PromptService
	skillSvc    *service.SkillService
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

	a.settingsSvc = service.NewSettingsService(database)
	a.promptSvc = service.NewPromptService(database)
	a.skillSvc = service.NewSkillService(database, a.settingsSvc)

	storagePath, err := a.settingsSvc.GetSkillStoragePath()
	if err == nil {
		_ = os.MkdirAll(storagePath, 0755)
	}
}

// shutdown 应用关闭生命周期回调，关闭数据库连接
func (a *App) shutdown(ctx context.Context) {
	if a.database != nil {
		_ = a.database.Close()
	}
}

// ===== 设置相关方法 =====

// GetSettings 获取所有设置项
func (a *App) GetSettings() (map[string]string, error) {
	return a.settingsSvc.GetSettings()
}

// UpdateSetting 更新单个设置项
func (a *App) UpdateSetting(key, value string) error {
	return a.settingsSvc.UpdateSetting(key, value)
}

// UpdateSettings 批量更新设置项
func (a *App) UpdateSettings(settings map[string]string) error {
	return a.settingsSvc.UpdateSettings(settings)
}

// GetSkillStoragePath 获取 Skill 存储的绝对路径
func (a *App) GetSkillStoragePath() (string, error) {
	return a.settingsSvc.GetSkillStoragePath()
}

// OpenDataDirectory 在系统文件管理器中打开数据目录
func (a *App) OpenDataDirectory() error {
	path, err := a.settingsSvc.GetSkillStoragePath()
	if err != nil {
		return fmt.Errorf("获取数据目录路径失败: %w", err)
	}
	return exec.Command("explorer", filepath.FromSlash(path)).Start()
}

// GetVersion 获取应用版本信息
func (a *App) GetVersion() map[string]string {
	return map[string]string{
		"app_name":        verman.V.AppName,
		"git_version":     verman.V.GitVersion,
		"git_commit":      verman.V.GitCommit,
		"git_tree_state":  verman.V.GitTreeState,
		"git_commit_time": verman.V.GitCommitTime,
		"build_time":      verman.V.BuildTime,
		"go_version":      verman.V.GoVersion,
		"platform":        verman.V.Platform,
	}
}

// ===== Prompt 相关方法 =====

// CreatePrompt 创建新的 Prompt
func (a *App) CreatePrompt(name, content, category string, tags []string) (*db.Prompt, error) {
	tagsJSON := "[]"
	if len(tags) > 0 {
		data, _ := json.Marshal(tags)
		tagsJSON = string(data)
	}
	return a.promptSvc.CreatePrompt(name, content, category, tagsJSON)
}

// GetPrompt 根据 ID 获取 Prompt
func (a *App) GetPrompt(id int64) (*db.Prompt, error) {
	return a.promptSvc.GetPrompt(id)
}

// GetPrompts 获取 Prompt 列表，支持关键词搜索和分类筛选
func (a *App) GetPrompts(keyword, category string) ([]db.Prompt, error) {
	return a.promptSvc.GetPrompts(keyword, category)
}

// UpdatePrompt 更新 Prompt
func (a *App) UpdatePrompt(id int64, name, content, category string, tags []string) error {
	tagsJSON := "[]"
	if len(tags) > 0 {
		data, _ := json.Marshal(tags)
		tagsJSON = string(data)
	}
	return a.promptSvc.UpdatePrompt(id, name, content, category, tagsJSON)
}

// DeletePrompt 删除 Prompt
func (a *App) DeletePrompt(id int64) error {
	return a.promptSvc.DeletePrompt(id)
}

// BatchDeletePrompts 批量删除多个 Prompt
func (a *App) BatchDeletePrompts(ids []int64) (int64, error) {
	return a.promptSvc.BatchDeletePrompts(ids)
}

// GetCategories 获取所有分类列表
func (a *App) GetCategories() ([]string, error) {
	return a.promptSvc.GetCategories()
}

// ExportPrompts 导出 Prompt 为 JSON 文件
func (a *App) ExportPrompts(ids []int64, filePath string) error {
	return a.promptSvc.ExportPrompts(ids, filePath)
}

// ImportPrompts 从 JSON 文件导入 Prompt
func (a *App) ImportPrompts(filePath string) (*db.ImportResult, error) {
	return a.promptSvc.ImportPrompts(filePath)
}

// GetRecentPrompts 获取最近修改的 Prompt 列表
func (a *App) GetRecentPrompts(limit int) ([]db.Prompt, error) {
	return a.promptSvc.GetRecentPrompts(limit)
}

// CountPrompts 统计 Prompt 总数
func (a *App) CountPrompts() (int, error) {
	return a.promptSvc.CountPrompts()
}

// ===== Skill 相关方法 =====

// CreateSkill 创建空 Skill
func (a *App) CreateSkill(name, description string) (*db.Skill, error) {
	return a.skillSvc.CreateSkill(name, description)
}

// GetSkill 根据 ID 获取 Skill
func (a *App) GetSkill(id int64) (*db.Skill, error) {
	return a.skillSvc.GetSkill(id)
}

// GetSkills 获取所有 Skill 列表
func (a *App) GetSkills() ([]db.Skill, error) {
	return a.skillSvc.GetSkills()
}

// UpdateSkill 更新 Skill 元数据，同时同步 SKILL.md 文件
func (a *App) UpdateSkill(id int64, name, description string) error {
	return a.skillSvc.UpdateSkill(id, name, description)
}

// DeleteSkill 删除 Skill
func (a *App) DeleteSkill(id int64, deleteFiles bool) error {
	return a.skillSvc.DeleteSkill(id, deleteFiles)
}

// BatchDeleteSkills 批量删除多个 Skill
func (a *App) BatchDeleteSkills(ids []int64, deleteFiles bool) (int64, error) {
	return a.skillSvc.BatchDeleteSkills(ids, deleteFiles)
}

// ImportSkill 从 ZIP 文件导入 Skill
func (a *App) ImportSkill(zipPath string) (*db.Skill, error) {
	return a.skillSvc.ImportSkill(zipPath)
}

// BatchImportSkills 批量导入多个 Skill ZIP 文件
func (a *App) BatchImportSkills(zipPaths []string) (*db.ImportResult, error) {
	return a.skillSvc.BatchImportSkills(zipPaths)
}

// ExportSkill 导出 Skill 为 ZIP 文件
func (a *App) ExportSkill(id int64, zipPath string) error {
	return a.skillSvc.ExportSkill(id, zipPath)
}

// ExportSkills 批量导出 Skill 为 ZIP 文件，skillIds 为空时导出全部
func (a *App) ExportSkills(skillIds []int64, savePath string) error {
	return a.skillSvc.ExportSkillsToZip(skillIds, savePath)
}

// ImportSkillAuto 自动识别 ZIP 格式并导入 Skill
// 优先检测导出格式（标识文件），其次检测公共格式（SKILL.md）
func (a *App) ImportSkillAuto(zipPath string) (*db.ImportResult, error) {
	hasMarker, _ := utils.HasExportMarker(zipPath)
	if hasMarker {
		return a.skillSvc.ImportSkillFromExportZip(zipPath)
	}

	_, err := a.skillSvc.ImportSkill(zipPath)
	if err != nil {
		errMsg := err.Error()
		if strings.Contains(errMsg, "已存在") {
			return &db.ImportResult{Skipped: 1}, nil
		}
		return nil, err
	}
	return &db.ImportResult{Success: 1}, nil
}

// ListSkillFiles 列出 Skill 目录下的文件
func (a *App) ListSkillFiles(id int64) ([]db.SkillFile, error) {
	return a.skillSvc.ListSkillFiles(id)
}

// GetRecentSkills 获取最近修改的 Skill 列表
func (a *App) GetRecentSkills(limit int) ([]db.Skill, error) {
	return a.skillSvc.GetRecentSkills(limit)
}

// CountSkills 统计 Skill 总数
func (a *App) CountSkills() (int, error) {
	return a.skillSvc.CountSkills()
}

// BackupData 创建完整备份：读取所有数据并打包为 ZIP 文件
func (a *App) BackupData(savePath string) error {
	settings, err := a.settingsSvc.GetSettings()
	if err != nil {
		return fmt.Errorf("获取设置失败: %w", err)
	}

	prompts, err := a.promptSvc.GetPrompts("", "")
	if err != nil {
		return fmt.Errorf("获取提示词失败: %w", err)
	}

	skills, err := a.skillSvc.GetSkills()
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

	skillPath, err := a.settingsSvc.GetSkillStoragePath()
	if err != nil {
		skillPath = ""
	}

	return utils.CreateBackupArchive(data, skillPath, savePath)
}

// RestoreData 从备份 ZIP 文件恢复所有数据
func (a *App) RestoreData(zipPath string) (*utils.BackupRestoreResult, error) {
	skillPath, err := a.settingsSvc.GetSkillStoragePath()
	if err != nil {
		skillPath = ""
	}

	backupData, err := utils.RestoreBackupArchive(zipPath, skillPath)
	if err != nil {
		return nil, err
	}

	if backupData.Settings != nil {
		delete(backupData.Settings, "skill_storage_path")
		if err := a.settingsSvc.UpdateSettings(backupData.Settings); err != nil {
			return nil, fmt.Errorf("恢复设置失败: %w", err)
		}
	}

	result := &utils.BackupRestoreResult{}

	for _, p := range backupData.Prompts {
		existing, _ := a.promptSvc.GetPrompts(p.Name, "")
		if len(existing) > 0 {
			result.PromptsSkipped++
			continue
		}
		_, err := a.promptSvc.CreatePrompt(p.Name, p.Content, p.Category, p.Tags)
		if err != nil {
			continue
		}
		result.PromptsRestored++
	}

	for _, s := range backupData.Skills {
		existing, _ := a.skillSvc.GetSkills()
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
		_, err := a.skillSvc.CreateSkill(s.Name, s.Description)
		if err != nil {
			continue
		}
		result.SkillsRestored++
	}

	return result, nil
}

// ===== 文件对话框方法 =====

// OpenFileDialog 打开文件选择对话框，返回选择的文件路径（空字符串表示取消）
func (a *App) OpenFileDialog(filter string) (string, error) {
	return runtime.OpenFileDialog(a.ctx, runtime.OpenDialogOptions{
		Title: "选择文件",
		Filters: []runtime.FileFilter{
			{DisplayName: filter, Pattern: "*.*"},
		},
	})
}

// OpenZIPFileDialog 打开 ZIP 文件选择对话框
func (a *App) OpenZIPFileDialog() (string, error) {
	return runtime.OpenFileDialog(a.ctx, runtime.OpenDialogOptions{
		Title: "选择 ZIP 文件",
		Filters: []runtime.FileFilter{
			{DisplayName: "ZIP 文件", Pattern: "*.zip"},
		},
	})
}

// OpenJSONFileDialog 打开 JSON 文件选择对话框
func (a *App) OpenJSONFileDialog() (string, error) {
	return runtime.OpenFileDialog(a.ctx, runtime.OpenDialogOptions{
		Title: "选择 JSON 文件",
		Filters: []runtime.FileFilter{
			{DisplayName: "JSON 文件", Pattern: "*.json"},
		},
	})
}

// OpenMultiZIPFileDialog 打开多文件选择对话框，选择多个 ZIP 文件
func (a *App) OpenMultiZIPFileDialog() ([]string, error) {
	return runtime.OpenMultipleFilesDialog(a.ctx, runtime.OpenDialogOptions{
		Title: "选择 Skill ZIP 文件（可多选）",
		Filters: []runtime.FileFilter{
			{DisplayName: "ZIP 文件", Pattern: "*.zip"},
		},
	})
}

// SaveFileDialog 打开文件保存对话框，返回保存路径（空字符串表示取消）
func (a *App) SaveFileDialog(defaultFilename string) (string, error) {
	return runtime.SaveFileDialog(a.ctx, runtime.SaveDialogOptions{
		Title:           "保存文件",
		DefaultFilename: defaultFilename,
	})
}

// SaveZIPFileDialog 打开 ZIP 文件保存对话框
func (a *App) SaveZIPFileDialog(defaultFilename string) (string, error) {
	return runtime.SaveFileDialog(a.ctx, runtime.SaveDialogOptions{
		Title:           "保存 ZIP 文件",
		DefaultFilename: defaultFilename,
		Filters: []runtime.FileFilter{
			{DisplayName: "ZIP 文件", Pattern: "*.zip"},
		},
	})
}

// SaveJSONFileDialog 打开 JSON 文件保存对话框
func (a *App) SaveJSONFileDialog(defaultFilename string) (string, error) {
	return runtime.SaveFileDialog(a.ctx, runtime.SaveDialogOptions{
		Title:           "保存 JSON 文件",
		DefaultFilename: defaultFilename,
		Filters: []runtime.FileFilter{
			{DisplayName: "JSON 文件", Pattern: "*.json"},
		},
	})
}

// SelectDirectoryDialog 打开目录选择对话框
func (a *App) SelectDirectoryDialog() (string, error) {
	return runtime.OpenDirectoryDialog(a.ctx, runtime.OpenDialogOptions{
		Title: "选择目录",
	})
}

// DataStats 数据统计信息
type DataStats struct {
	PromptCount int   `json:"prompt_count"`
	SkillCount  int   `json:"skill_count"`
	DBSize      int64 `json:"db_size"`
}

// GetDataStats 获取数据统计信息
func (a *App) GetDataStats() (*DataStats, error) {
	promptCount, err := a.promptSvc.CountPrompts()
	if err != nil {
		return nil, fmt.Errorf("统计 Prompt 失败: %w", err)
	}
	skillCount, err := a.skillSvc.CountSkills()
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
func (a *App) GetOrphanSkills() ([]db.Skill, error) {
	return a.skillSvc.GetOrphanSkills()
}

// CleanupOrphanSkills 清理孤立 Skill 数据（删除数据库中文件已不存在的记录）
func (a *App) CleanupOrphanSkills() (int, error) {
	orphans, err := a.skillSvc.GetOrphanSkills()
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
	if err := a.skillSvc.DeleteSkills(ids); err != nil {
		return 0, fmt.Errorf("删除孤立 Skill 失败: %w", err)
	}
	return len(orphans), nil
}
