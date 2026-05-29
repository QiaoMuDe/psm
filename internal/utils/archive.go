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
)

// UnzipToDir 将指定的 ZIP 文件解压到目标目录
// 如果目标目录不存在则自动创建
func UnzipToDir(zipPath string, destDir string) error {
	reader, err := zip.OpenReader(zipPath)
	if err != nil {
		return fmt.Errorf("打开 ZIP 文件失败: %w", err)
	}
	defer reader.Close()

	if err := EnsureDir(destDir); err != nil {
		return fmt.Errorf("创建目标目录失败: %w", err)
	}

	for _, file := range reader.File {
		targetPath := filepath.Join(destDir, file.Name)

		if !strings.HasPrefix(filepath.Clean(targetPath), filepath.Clean(destDir)+string(filepath.Separator)) {
			return fmt.Errorf("ZIP 文件包含非法路径: %s", file.Name)
		}

		if file.FileInfo().IsDir() {
			if err := EnsureDir(targetPath); err != nil {
				return fmt.Errorf("创建子目录失败: %w", err)
			}
			continue
		}

		if err := EnsureDir(filepath.Dir(targetPath)); err != nil {
			return fmt.Errorf("创建父目录失败: %w", err)
		}

		if err := extractFile(file, targetPath); err != nil {
			return fmt.Errorf("解压文件 %s 失败: %w", file.Name, err)
		}
	}

	return nil
}

// extractFile 从 ZIP 归档中提取单个文件并写入目标路径
func extractFile(file *zip.File, targetPath string) error {
	srcFile, err := file.Open()
	if err != nil {
		return fmt.Errorf("打开 ZIP 内文件失败: %w", err)
	}
	defer srcFile.Close()

	dstFile, err := os.OpenFile(targetPath, os.O_WRONLY|os.O_CREATE|os.O_TRUNC, file.Mode())
	if err != nil {
		return fmt.Errorf("创建目标文件失败: %w", err)
	}
	defer dstFile.Close()

	if _, err := io.Copy(dstFile, srcFile); err != nil {
		return fmt.Errorf("写入文件内容失败: %w", err)
	}

	return nil
}

// ZipDir 将指定目录打包为 ZIP 文件
// ZIP 文件中会保留目录结构
func ZipDir(sourceDir string, zipPath string) error {
	return ZipDirWithMetadata(sourceDir, zipPath, nil)
}

// ZipDirWithMetadata 将指定目录打包为 ZIP 文件，并在 ZIP 根目录写入 metadata.json
// metadata 为可选参数，传入 nil 则不写入元数据文件
func ZipDirWithMetadata(sourceDir string, zipPath string, metadata interface{}) error {
	if err := EnsureDir(filepath.Dir(zipPath)); err != nil {
		return fmt.Errorf("创建 ZIP 文件目录失败: %w", err)
	}

	zipFile, err := os.Create(zipPath)
	if err != nil {
		return fmt.Errorf("创建 ZIP 文件失败: %w", err)
	}
	defer zipFile.Close()

	writer := zip.NewWriter(zipFile)
	defer writer.Close()

	if metadata != nil {
		if err := writeMetadataToZip(writer, metadata); err != nil {
			return fmt.Errorf("写入元数据失败: %w", err)
		}
	}

	return addDirToZip(writer, sourceDir, "")
}

// writeMetadataToZip 将 metadata 序列化为 JSON 并写入 ZIP 根目录的 metadata.json
func writeMetadataToZip(writer *zip.Writer, metadata interface{}) error {
	data, err := json.MarshalIndent(metadata, "", "  ")
	if err != nil {
		return fmt.Errorf("序列化元数据失败: %w", err)
	}

	entry, err := writer.Create("metadata.json")
	if err != nil {
		return fmt.Errorf("创建 ZIP 条目失败: %w", err)
	}

	if _, err := entry.Write(data); err != nil {
		return fmt.Errorf("写入元数据内容失败: %w", err)
	}

	return nil
}

// addDirToZip 递归地将目录内容添加到 ZIP writer 中
func addDirToZip(writer *zip.Writer, basePath string, relativePath string) error {
	fullPath := filepath.Join(basePath, relativePath)

	entries, err := os.ReadDir(fullPath)
	if err != nil {
		return fmt.Errorf("读取目录 %s 失败: %w", fullPath, err)
	}

	for _, entry := range entries {
		entryRelPath := filepath.Join(relativePath, entry.Name())
		entryFullPath := filepath.Join(basePath, entryRelPath)
		zipEntryPath := filepath.ToSlash(entryRelPath)

		if entry.IsDir() {
			if _, err := writer.Create(zipEntryPath + "/"); err != nil {
				return fmt.Errorf("创建 ZIP 目录条目失败: %w", err)
			}
			if err := addDirToZip(writer, basePath, entryRelPath); err != nil {
				return err
			}
			continue
		}

		if err := addFileToZip(writer, entryFullPath, zipEntryPath); err != nil {
			return fmt.Errorf("添加文件 %s 到 ZIP 失败: %w", entryRelPath, err)
		}
	}

	return nil
}

// addFileToZip 将单个文件添加到 ZIP writer 中
func addFileToZip(writer *zip.Writer, filePath string, zipEntryPath string) error {
	file, err := os.Open(filePath)
	if err != nil {
		return fmt.Errorf("打开文件失败: %w", err)
	}
	defer file.Close()

	info, err := file.Stat()
	if err != nil {
		return fmt.Errorf("获取文件信息失败: %w", err)
	}

	header, err := zip.FileInfoHeader(info)
	if err != nil {
		return fmt.Errorf("创建 ZIP 文件头失败: %w", err)
	}
	header.Name = zipEntryPath
	header.Method = zip.Deflate

	entry, err := writer.CreateHeader(header)
	if err != nil {
		return fmt.Errorf("创建 ZIP 条目失败: %w", err)
	}

	if _, err := io.Copy(entry, file); err != nil {
		return fmt.Errorf("写入文件内容到 ZIP 失败: %w", err)
	}

	return nil
}

// SkillMetadataFromZip 表示从 ZIP 中读取的 Skill 元数据
type SkillMetadataFromZip struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	Version     string `json:"version"`
}

// HasSkillMD 检查 ZIP 文件根目录下是否存在 SKILL.md 文件
func HasSkillMD(zipPath string) (bool, error) {
	reader, err := zip.OpenReader(zipPath)
	if err != nil {
		return false, fmt.Errorf("打开 ZIP 文件失败: %w", err)
	}
	defer reader.Close()

	for _, file := range reader.File {
		base := filepath.Base(file.Name)
		if strings.EqualFold(base, "SKILL.md") && !file.FileInfo().IsDir() {
			return true, nil
		}
	}
	return false, nil
}

// ReadSkillMDFromZip 从 ZIP 文件中读取 SKILL.md 的内容
func ReadSkillMDFromZip(zipPath string) (string, error) {
	reader, err := zip.OpenReader(zipPath)
	if err != nil {
		return "", fmt.Errorf("打开 ZIP 文件失败: %w", err)
	}
	defer reader.Close()

	for _, file := range reader.File {
		base := filepath.Base(file.Name)
		if strings.EqualFold(base, "SKILL.md") && !file.FileInfo().IsDir() {
			rc, err := file.Open()
			if err != nil {
				return "", fmt.Errorf("打开 SKILL.md 失败: %w", err)
			}
			defer rc.Close()

			data, err := io.ReadAll(rc)
			if err != nil {
				return "", fmt.Errorf("读取 SKILL.md 失败: %w", err)
			}
			return string(data), nil
		}
	}
	return "", nil
}

// ParseSkillFrontmatter 解析 SKILL.md 的 YAML frontmatter，提取 name 和 description
// frontmatter 格式：
//
//	---
//	name: xxx
//	description: xxx
//	---
func ParseSkillFrontmatter(content string) (name, description string) {
	content = strings.TrimSpace(content)
	if !strings.HasPrefix(content, "---") {
		return "", ""
	}

	endIdx := strings.Index(content[3:], "---")
	if endIdx < 0 {
		return "", ""
	}

	frontmatter := content[3 : endIdx+3]
	lines := strings.Split(frontmatter, "\n")

	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line == "" || line == "---" {
			continue
		}

		parts := strings.SplitN(line, ":", 2)
		if len(parts) != 2 {
			continue
		}

		key := strings.TrimSpace(parts[0])
		value := strings.TrimSpace(parts[1])

		switch strings.ToLower(key) {
		case "name":
			name = value
		case "description":
			description = value
		}
	}

	return name, description
}

// GetSkillMetadataFromZip 从 ZIP 文件中读取 SKILL.md 元数据（优先）或 metadata.json/skill.json
func GetSkillMetadataFromZip(zipPath string) (*SkillMetadataFromZip, error) {
	reader, err := zip.OpenReader(zipPath)
	if err != nil {
		return nil, fmt.Errorf("打开 ZIP 文件失败: %w", err)
	}
	defer reader.Close()

	for _, file := range reader.File {
		base := filepath.Base(file.Name)
		if strings.EqualFold(base, "SKILL.md") && !file.FileInfo().IsDir() {
			rc, err := file.Open()
			if err != nil {
				return nil, fmt.Errorf("打开 SKILL.md 失败: %w", err)
			}
			defer rc.Close()

			data, err := io.ReadAll(rc)
			if err != nil {
				return nil, fmt.Errorf("读取 SKILL.md 失败: %w", err)
			}

			name, description := ParseSkillFrontmatter(string(data))
			return &SkillMetadataFromZip{
				Name:        name,
				Description: description,
				Version:     "1.0.0",
			}, nil
		}
	}

	for _, file := range reader.File {
		base := strings.ToLower(filepath.Base(file.Name))
		if base == "metadata.json" || base == "skill.json" {
			rc, err := file.Open()
			if err != nil {
				return nil, fmt.Errorf("打开元数据文件失败: %w", err)
			}
			defer rc.Close()

			data, err := io.ReadAll(rc)
			if err != nil {
				return nil, fmt.Errorf("读取元数据文件失败: %w", err)
			}

			var metadata SkillMetadataFromZip
			if err := json.Unmarshal(data, &metadata); err != nil {
				return nil, fmt.Errorf("解析元数据文件失败: %w", err)
			}
			return &metadata, nil
		}
	}

	return &SkillMetadataFromZip{}, nil
}
