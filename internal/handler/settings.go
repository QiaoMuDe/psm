package handler

import (
	"context"
	"fmt"
	"io"
	"os"
	"os/exec"
	"path/filepath"

	"gitee.com/MM-Q/verman"
	"github.com/wailsapp/wails/v2/pkg/runtime"

	"psm/internal/service"
	"psm/internal/utils"
)

// SettingsHandler 处理设置相关的方法，嵌入到 App 结构体
type SettingsHandler struct {
	ctx         context.Context
	settingsSvc *service.SettingsService
}

// Init 初始化 SettingsHandler
func (h *SettingsHandler) Init(ctx context.Context, settingsSvc *service.SettingsService) {
	h.ctx = ctx
	h.settingsSvc = settingsSvc
}

// GetSettings 获取所有设置项
func (h *SettingsHandler) GetSettings() (map[string]string, error) {
	return h.settingsSvc.GetSettings()
}

// UpdateSetting 更新单个设置项
func (h *SettingsHandler) UpdateSetting(key, value string) error {
	return h.settingsSvc.UpdateSetting(key, value)
}

// UpdateSettings 批量更新设置项
func (h *SettingsHandler) UpdateSettings(settings map[string]string) error {
	return h.settingsSvc.UpdateSettings(settings)
}

// GetAppHome 获取程序家目录路径
func (h *SettingsHandler) GetAppHome() (string, error) {
	return h.settingsSvc.GetAppHome()
}

// SetAppHome 设置程序家目录路径，迁移 skills 和 backup 目录到新位置
func (h *SettingsHandler) SetAppHome(newPath string) error {
	oldPath, err := h.settingsSvc.GetAppHome()
	if err != nil {
		return fmt.Errorf("获取旧家目录失败: %w", err)
	}

	if oldPath == newPath {
		return nil
	}

	dirsToMigrate := []string{"skills", "backup"}
	for _, dir := range dirsToMigrate {
		src := filepath.Join(oldPath, dir)
		dst := filepath.Join(newPath, dir)

		if _, err := os.Stat(src); os.IsNotExist(err) {
			continue
		}

		if err := utils.EnsureDir(dst); err != nil {
			return fmt.Errorf("创建目标目录失败: %w", err)
		}

		if err := copyDir(src, dst); err != nil {
			return fmt.Errorf("迁移 %s 目录失败: %w", dir, err)
		}
	}

	return h.settingsSvc.UpdateSetting("app_home", newPath)
}

// OpenDataDirectory 在系统文件管理器中打开程序家目录
func (h *SettingsHandler) OpenDataDirectory() error {
	path, err := h.settingsSvc.GetAppHome()
	if err != nil {
		return fmt.Errorf("获取家目录路径失败: %w", err)
	}
	return exec.Command("explorer", filepath.FromSlash(path)).Start()
}

// GetVersion 获取应用版本信息
func (h *SettingsHandler) GetVersion() map[string]string {
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

// OpenFileDialog 打开文件选择对话框
func (h *SettingsHandler) OpenFileDialog(filter string) (string, error) {
	return runtime.OpenFileDialog(h.ctx, runtime.OpenDialogOptions{
		Title: "选择文件",
		Filters: []runtime.FileFilter{
			{DisplayName: filter, Pattern: "*.*"},
		},
	})
}

// OpenZIPFileDialog 打开 ZIP 文件选择对话框
func (h *SettingsHandler) OpenZIPFileDialog() (string, error) {
	return runtime.OpenFileDialog(h.ctx, runtime.OpenDialogOptions{
		Title: "选择 ZIP 文件",
		Filters: []runtime.FileFilter{
			{DisplayName: "ZIP 文件", Pattern: "*.zip"},
		},
	})
}

// OpenJSONFileDialog 打开 JSON 文件选择对话框
func (h *SettingsHandler) OpenJSONFileDialog() (string, error) {
	return runtime.OpenFileDialog(h.ctx, runtime.OpenDialogOptions{
		Title: "选择 JSON 文件",
		Filters: []runtime.FileFilter{
			{DisplayName: "JSON 文件", Pattern: "*.json"},
		},
	})
}

// OpenMultiZIPFileDialog 打开多文件选择对话框
func (h *SettingsHandler) OpenMultiZIPFileDialog() ([]string, error) {
	return runtime.OpenMultipleFilesDialog(h.ctx, runtime.OpenDialogOptions{
		Title: "选择 Skill ZIP 文件（可多选）",
		Filters: []runtime.FileFilter{
			{DisplayName: "ZIP 文件", Pattern: "*.zip"},
		},
	})
}

// SaveFileDialog 打开文件保存对话框
func (h *SettingsHandler) SaveFileDialog(defaultFilename string) (string, error) {
	return runtime.SaveFileDialog(h.ctx, runtime.SaveDialogOptions{
		Title:           "保存文件",
		DefaultFilename: defaultFilename,
	})
}

// SaveZIPFileDialog 打开 ZIP 文件保存对话框
func (h *SettingsHandler) SaveZIPFileDialog(defaultFilename string) (string, error) {
	return runtime.SaveFileDialog(h.ctx, runtime.SaveDialogOptions{
		Title:           "保存 ZIP 文件",
		DefaultFilename: defaultFilename,
		Filters: []runtime.FileFilter{
			{DisplayName: "ZIP 文件", Pattern: "*.zip"},
		},
	})
}

// SaveJSONFileDialog 打开 JSON 文件保存对话框
func (h *SettingsHandler) SaveJSONFileDialog(defaultFilename string) (string, error) {
	return runtime.SaveFileDialog(h.ctx, runtime.SaveDialogOptions{
		Title:           "保存 JSON 文件",
		DefaultFilename: defaultFilename,
		Filters: []runtime.FileFilter{
			{DisplayName: "JSON 文件", Pattern: "*.json"},
		},
	})
}

// SelectDirectoryDialog 打开目录选择对话框
func (h *SettingsHandler) SelectDirectoryDialog() (string, error) {
	return runtime.OpenDirectoryDialog(h.ctx, runtime.OpenDialogOptions{
		Title: "选择目录",
	})
}

// GetSystemFonts 获取系统已安装的字体族列表
func (h *SettingsHandler) GetSystemFonts() []string {
	return utils.GetSystemFonts()
}

// RevealInExplorer 在文件管理器中打开指定路径
func (h *SettingsHandler) RevealInExplorer(path string) error {
	cmd := exec.Command("explorer", path)
	return cmd.Start()
}

// OpenFile 用系统默认程序打开文件
func (h *SettingsHandler) OpenFile(path string) error {
	cmd := exec.Command("cmd", "/c", "start", "", path)
	return cmd.Start()
}

// copyDir 递归复制目录
func copyDir(src, dst string) error {
	return filepath.Walk(src, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}

		relPath, err := filepath.Rel(src, path)
		if err != nil {
			return err
		}
		dstPath := filepath.Join(dst, relPath)

		if info.IsDir() {
			return utils.EnsureDir(dstPath)
		}

		return copyFile(path, dstPath)
	})
}

// copyFile 复制单个文件
func copyFile(src, dst string) error {
	in, err := os.Open(src)
	if err != nil {
		return err
	}
	defer func() { _ = in.Close() }()

	out, err := os.Create(dst)
	if err != nil {
		return err
	}
	defer func() { _ = out.Close() }()

	_, err = io.Copy(out, in)
	return err
}
