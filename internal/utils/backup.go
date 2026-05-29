// Package utils 提供路径处理、压缩解压、导入导出等通用工具函数
package utils

import (
	"archive/zip"
	"encoding/json"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"
	"time"
)

// BackupData 表示完整备份的数据结构
type BackupData struct {
	Version   string            `json:"version"`
	CreatedAt string            `json:"created_at"`
	Settings  map[string]string `json:"settings"`
	Prompts   []BackupPrompt    `json:"prompts"`
	Skills    []BackupSkill     `json:"skills"`
}

// BackupPrompt 表示备份中的提示词数据（不含自增 ID）
type BackupPrompt struct {
	Name      string `json:"name"`
	Content   string `json:"content"`
	Category  string `json:"category"`
	Tags      string `json:"tags"`
	CreatedAt string `json:"created_at"`
	UpdatedAt string `json:"updated_at"`
}

// BackupSkill 表示备份中的技能数据（不含自增 ID）
type BackupSkill struct {
	Name         string `json:"name"`
	Description  string `json:"description"`
	RelativePath string `json:"relative_path"`
	CreatedAt    string `json:"created_at"`
	UpdatedAt    string `json:"updated_at"`
}

// BackupRestoreResult 表示恢复操作的结果
type BackupRestoreResult struct {
	PromptsRestored int `json:"prompts_restored"`
	SkillsRestored  int `json:"skills_restored"`
	PromptsSkipped  int `json:"prompts_skipped"`
	SkillsSkipped   int `json:"skills_skipped"`
}

// CreateBackupArchive 创建备份 ZIP 文件，包含 data.json 和 Skill 文件目录
// data 为要备份的数据，skillStoragePath 为 Skill 文件存储目录，savePath 为备份文件保存路径
func CreateBackupArchive(data *BackupData, skillStoragePath string, savePath string) error {
	if err := EnsureDir(filepath.Dir(savePath)); err != nil {
		return fmt.Errorf("创建备份目录失败: %w", err)
	}

	zipFile, err := os.Create(savePath)
	if err != nil {
		return fmt.Errorf("创建备份文件失败: %w", err)
	}
	defer zipFile.Close()

	writer := zip.NewWriter(zipFile)
	defer writer.Close()

	data.CreatedAt = time.Now().Format(time.RFC3339)

	filteredSettings := make(map[string]string)
	for k, v := range data.Settings {
		if k != "skill_storage_path" {
			filteredSettings[k] = v
		}
	}
	data.Settings = filteredSettings

	jsonData, err := json.MarshalIndent(data, "", "  ")
	if err != nil {
		return fmt.Errorf("序列化备份数据失败: %w", err)
	}

	jsonEntry, err := writer.Create("psm-backup/data.json")
	if err != nil {
		return fmt.Errorf("创建 ZIP 条目失败: %w", err)
	}
	if _, err := jsonEntry.Write(jsonData); err != nil {
		return fmt.Errorf("写入备份数据失败: %w", err)
	}

	if skillStoragePath != "" {
		if _, err := os.Stat(skillStoragePath); err == nil {
			if err := addDirToZipWithPrefix(writer, skillStoragePath, "psm-backup/skills/"); err != nil {
				return fmt.Errorf("打包 Skill 文件失败: %w", err)
			}
		}
	}

	return nil
}

// RestoreBackupArchive 从备份 ZIP 文件恢复数据
// zipPath 为备份文件路径，skillStoragePath 为当前 Skill 存储目录
// 返回解析后的备份数据和 Skill 文件列表（需由调用方处理数据库写入）
func RestoreBackupArchive(zipPath string, skillStoragePath string) (*BackupData, error) {
	reader, err := zip.OpenReader(zipPath)
	if err != nil {
		return nil, fmt.Errorf("打开备份文件失败: %w", err)
	}
	defer reader.Close()

	var backupData *BackupData

	for _, file := range reader.File {
		cleanName := filepath.ToSlash(file.Name)
		if cleanName == "psm-backup/data.json" {
			rc, err := file.Open()
			if err != nil {
				return nil, fmt.Errorf("打开 data.json 失败: %w", err)
			}
			defer rc.Close()

			data, err := io.ReadAll(rc)
			if err != nil {
				return nil, fmt.Errorf("读取 data.json 失败: %w", err)
			}

			var backup BackupData
			if err := json.Unmarshal(data, &backup); err != nil {
				return nil, fmt.Errorf("解析 data.json 失败，备份文件可能已损坏: %w", err)
			}
			backupData = &backup
		}
	}

	if backupData == nil {
		return nil, fmt.Errorf("备份文件格式无效：缺少 psm-backup/data.json")
	}

	if skillStoragePath != "" {
		for _, file := range reader.File {
			cleanName := filepath.ToSlash(file.Name)
			if !strings.HasPrefix(cleanName, "psm-backup/skills/") || file.FileInfo().IsDir() {
				continue
			}

			relPath := strings.TrimPrefix(cleanName, "psm-backup/skills/")
			if relPath == "" {
				continue
			}

			targetPath := filepath.Join(skillStoragePath, filepath.FromSlash(relPath))
			if err := EnsureDir(filepath.Dir(targetPath)); err != nil {
				continue
			}

			rc, err := file.Open()
			if err != nil {
				continue
			}

			dstFile, err := os.OpenFile(targetPath, os.O_WRONLY|os.O_CREATE|os.O_TRUNC, file.Mode())
			if err != nil {
				rc.Close()
				continue
			}

			io.Copy(dstFile, rc)
			dstFile.Close()
			rc.Close()
		}
	}

	return backupData, nil
}
