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
	"unicode/utf8"

	"golang.org/x/text/encoding/charmap"
	"golang.org/x/text/encoding/simplifiedchinese"
)

// FixFileName 修复 ZIP 条目中非 UTF-8 编码的文件名（如 GBK/GB18030）为正确的 UTF-8 字符串
// 处理中文 Windows 工具创建 ZIP 时使用 GBK 编码但不设置 UTF-8 标志位导致的乱码问题
func FixFileName(name string) string {
	if name == "" {
		return name
	}

	if utf8.ValidString(name) && !strings.ContainsRune(name, '\uFFFD') {
		return name
	}

	rawBytes := []byte(name)
	if decoded, err := simplifiedchinese.GB18030.NewDecoder().Bytes(rawBytes); err == nil {
		if utf8.ValidString(string(decoded)) {
			return string(decoded)
		}
	}

	cp437Bytes, err := charmap.CodePage437.NewEncoder().Bytes([]byte(name))
	if err == nil {
		if decoded, err := simplifiedchinese.GB18030.NewDecoder().Bytes(cp437Bytes); err == nil {
			if utf8.ValidString(string(decoded)) {
				return string(decoded)
			}
		}
	}

	return name
}

// SkillExportMarker 技能导出 ZIP 的标识文件名，空文件仅用于格式识别
const SkillExportMarker = ".psm-skill-export"

// UnzipToDir 将指定的 ZIP 文件解压到目标目录
// 如果目标目录不存在则自动创建
func UnzipToDir(zipPath string, destDir string) error {
	reader, err := zip.OpenReader(zipPath)
	if err != nil {
		return fmt.Errorf("打开 ZIP 文件失败: %w", err)
	}
	defer func() { _ = reader.Close() }()

	if err := EnsureDir(destDir); err != nil {
		return fmt.Errorf("创建目标目录失败: %w", err)
	}

	for _, file := range reader.File {
		fileName := FixFileName(file.Name)
		targetPath := filepath.Join(destDir, fileName)

		if !strings.HasPrefix(filepath.Clean(targetPath), filepath.Clean(destDir)+string(filepath.Separator)) {
			return fmt.Errorf("ZIP 文件包含非法路径: %s", fileName)
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
			return fmt.Errorf("解压文件 %s 失败: %w", fileName, err)
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
	defer func() { _ = srcFile.Close() }()

	dstFile, err := os.OpenFile(targetPath, os.O_WRONLY|os.O_CREATE|os.O_TRUNC, file.Mode())
	if err != nil {
		return fmt.Errorf("创建目标文件失败: %w", err)
	}
	defer func() { _ = dstFile.Close() }()

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
	defer func() { _ = zipFile.Close() }()

	writer := zip.NewWriter(zipFile)
	defer func() { _ = writer.Close() }()

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

// addDirToZipWithPrefix 将目录内容添加到 ZIP writer 中，读取 localDir 但 ZIP 条目使用 zipPrefix 前缀
// 用于将本地目录打包到 ZIP 的指定子路径下
func addDirToZipWithPrefix(writer *zip.Writer, localDir string, zipPrefix string) error {
	entries, err := os.ReadDir(localDir)
	if err != nil {
		return fmt.Errorf("读取目录 %s 失败: %w", localDir, err)
	}

	for _, entry := range entries {
		entryLocalPath := filepath.Join(localDir, entry.Name())
		zipEntryPath := filepath.ToSlash(zipPrefix + entry.Name())

		if entry.IsDir() {
			if _, err := writer.Create(zipEntryPath + "/"); err != nil {
				return fmt.Errorf("创建 ZIP 目录条目失败: %w", err)
			}
			if err := addDirToZipWithPrefix(writer, entryLocalPath, zipEntryPath+"/"); err != nil {
				return err
			}
			continue
		}

		if err := addFileToZip(writer, entryLocalPath, zipEntryPath); err != nil {
			return fmt.Errorf("添加文件 %s 到 ZIP 失败: %w", entry.Name(), err)
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
	defer func() { _ = file.Close() }()

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
	defer func() { _ = reader.Close() }()

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
	defer func() { _ = reader.Close() }()

	for _, file := range reader.File {
		base := filepath.Base(file.Name)
		if strings.EqualFold(base, "SKILL.md") && !file.FileInfo().IsDir() {
			rc, err := file.Open()
			if err != nil {
				return "", fmt.Errorf("打开 SKILL.md 失败: %w", err)
			}
			defer func() { _ = rc.Close() }()

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

// UpdateSkillFrontmatter 更新 SKILL.md 文件的 YAML frontmatter 中的 name 和 description
// 如果文件不存在则创建，如果没有 frontmatter 则在文件头部添加
func UpdateSkillFrontmatter(filePath string, name string, description string) error {
	frontmatter := fmt.Sprintf("---\nname: %s\ndescription: %s\n---\n", name, description)

	data, err := os.ReadFile(filePath)
	if err != nil {
		return os.WriteFile(filePath, []byte(frontmatter), 0644)
	}

	content := string(data)
	if strings.HasPrefix(strings.TrimSpace(content), "---") {
		endIdx := strings.Index(content[3:], "---")
		if endIdx >= 0 {
			content = frontmatter + content[endIdx+3+3:]
		} else {
			content = frontmatter + content
		}
	} else {
		content = frontmatter + "\n" + content
	}

	return os.WriteFile(filePath, []byte(content), 0644)
}

// FlattenIfNested 检查目录是否只包含一个同名子目录，如果是则将内容上移一层
// 用于修复 ZIP 解压后多余的目录层级
func FlattenIfNested(dirPath string, expectedName string) {
	entries, err := os.ReadDir(dirPath)
	if err != nil || len(entries) != 1 || !entries[0].IsDir() {
		return
	}
	if entries[0].Name() != expectedName {
		return
	}
	nestedDir := filepath.Join(dirPath, entries[0].Name())
	nestedEntries, err := os.ReadDir(nestedDir)
	if err != nil || len(nestedEntries) == 0 {
		return
	}
	for _, entry := range nestedEntries {
		src := filepath.Join(nestedDir, entry.Name())
		dst := filepath.Join(dirPath, entry.Name())
		_ = os.Rename(src, dst)
	}
	_ = os.Remove(nestedDir)
}

// GetSkillMetadataFromZip 从 ZIP 文件中读取 SKILL.md 元数据（优先）或 metadata.json/skill.json
func GetSkillMetadataFromZip(zipPath string) (*SkillMetadataFromZip, error) {
	reader, err := zip.OpenReader(zipPath)
	if err != nil {
		return nil, fmt.Errorf("打开 ZIP 文件失败: %w", err)
	}
	defer func() { _ = reader.Close() }()

	for _, file := range reader.File {
		base := filepath.Base(file.Name)
		if strings.EqualFold(base, "SKILL.md") && !file.FileInfo().IsDir() {
			rc, err := file.Open()
			if err != nil {
				return nil, fmt.Errorf("打开 SKILL.md 失败: %w", err)
			}
			defer func() { _ = rc.Close() }()

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
			defer func() { _ = rc.Close() }()

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

// HasExportMarker 检查 ZIP 文件根目录下是否存在导出标识文件
func HasExportMarker(zipPath string) (bool, error) {
	reader, err := zip.OpenReader(zipPath)
	if err != nil {
		return false, fmt.Errorf("打开 ZIP 文件失败: %w", err)
	}
	defer func() { _ = reader.Close() }()

	for _, file := range reader.File {
		if filepath.Base(file.Name) == SkillExportMarker && !file.FileInfo().IsDir() {
			return true, nil
		}
	}
	return false, nil
}

// CreateSkillExportZip 创建技能导出格式的 ZIP 文件（带标识文件）
// 包含导出标识文件和所有技能目录，每个技能目录直接位于 ZIP 根目录下
// 标识文件 .psm-skill-export 包含各技能的标签元数据（JSON 格式）
// 跳过不存在的技能目录，继续处理其余技能
func CreateSkillExportZip(skillDirs map[string]string, skillTags map[string][]string, savePath string) error {
	if err := EnsureDir(filepath.Dir(savePath)); err != nil {
		return fmt.Errorf("创建 ZIP 文件目录失败: %w", err)
	}

	zipFile, err := os.Create(savePath)
	if err != nil {
		return fmt.Errorf("创建 ZIP 文件失败: %w", err)
	}
	defer func() { _ = zipFile.Close() }()

	writer := zip.NewWriter(zipFile)
	defer func() { _ = writer.Close() }()

	entry, err := writer.Create(SkillExportMarker)
	if err != nil {
		return fmt.Errorf("创建标识文件条目失败: %w", err)
	}
	if len(skillTags) > 0 {
		data, _ := json.Marshal(skillTags)
		_, _ = entry.Write(data)
	}

	var lastErr error
	for name, localPath := range skillDirs {
		if _, statErr := os.Stat(localPath); statErr != nil {
			lastErr = fmt.Errorf("技能 %s 目录不存在: %w", name, statErr)
			continue
		}
		if err := addDirToZipWithPrefix(writer, localPath, name+"/"); err != nil {
			lastErr = fmt.Errorf("打包技能 %s 失败: %w", name, err)
			continue
		}
	}

	return lastErr
}

// UnzipPrefixToDir 从已打开的 ZIP reader 中解压指定前缀的文件到目标目录
func UnzipPrefixToDir(reader *zip.Reader, prefix string, destDir string) error {
	if err := EnsureDir(destDir); err != nil {
		return fmt.Errorf("创建目标目录失败: %w", err)
	}

	for _, file := range reader.File {
		fileName := FixFileName(file.Name)
		cleanName := filepath.ToSlash(fileName)
		if !strings.HasPrefix(cleanName, prefix) {
			continue
		}

		relPath := strings.TrimPrefix(cleanName, prefix)
		if relPath == "" {
			continue
		}

		targetPath := filepath.Join(destDir, relPath)

		if !strings.HasPrefix(filepath.Clean(targetPath), filepath.Clean(destDir)+string(filepath.Separator)) {
			return fmt.Errorf("ZIP 文件包含非法路径: %s", fileName)
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
			return fmt.Errorf("解压文件 %s 失败: %w", fileName, err)
		}
	}

	return nil
}
