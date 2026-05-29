// Package utils 提供路径处理、压缩解压、导入导出等通用工具函数
package utils

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

// ExpandHome 将路径中的 ~ 替换为当前用户的主目录
// 如果路径不以 ~ 开头，则原样返回
func ExpandHome(path string) (string, error) {
	if !strings.HasPrefix(path, "~") {
		return path, nil
	}

	home, err := os.UserHomeDir()
	if err != nil {
		return "", fmt.Errorf("获取用户主目录失败: %w", err)
	}

	if path == "~" {
		return home, nil
	}

	if strings.HasPrefix(path, "~/") || strings.HasPrefix(path, "~\\") {
		return filepath.Join(home, path[2:]), nil
	}

	return path, nil
}

// EnsureDir 确保指定路径的目录存在，若不存在则递归创建
func EnsureDir(path string) error {
	return os.MkdirAll(path, 0755)
}

// JoinPath 将多个路径元素拼接为一个完整的文件路径
func JoinPath(elem ...string) string {
	return filepath.Join(elem...)
}
