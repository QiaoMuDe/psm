// Package db 提供 SQLite 数据库初始化和表结构管理功能
package db

import (
	"database/sql"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	_ "modernc.org/sqlite"
)

// expandHome 将路径中的 ~ 替换为当前用户的主目录（包内部使用）
func expandHome(path string) (string, error) {
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

// ensureDir 确保指定路径的目录存在，若不存在则递归创建（包内部使用）
func ensureDir(path string) error {
	return os.MkdirAll(path, 0755)
}

// InitDB 初始化 SQLite 数据库连接，启用 WAL 模式，创建所需表结构并插入默认设置
// 参数 dbPath 为数据库文件路径（支持 ~ 开头的路径）
func InitDB(dbPath string) (*sql.DB, error) {
	expandedPath, err := expandHome(dbPath)
	if err != nil {
		return nil, fmt.Errorf("展开数据库路径失败: %w", err)
	}

	dbDir := filepath.Dir(expandedPath)
	if err := ensureDir(dbDir); err != nil {
		return nil, fmt.Errorf("创建数据库目录失败: %w", err)
	}

	db, err := sql.Open("sqlite", expandedPath)
	if err != nil {
		return nil, fmt.Errorf("打开数据库失败: %w", err)
	}

	if _, err := db.Exec("PRAGMA journal_mode=WAL"); err != nil {
		_ = db.Close()
		return nil, fmt.Errorf("启用 WAL 模式失败: %w", err)
	}

	if err := createTables(db); err != nil {
		_ = db.Close()
		return nil, fmt.Errorf("创建数据表失败: %w", err)
	}

	if err := insertDefaultSettings(db); err != nil {
		_ = db.Close()
		return nil, fmt.Errorf("插入默认设置失败: %w", err)
	}

	return db, nil
}

// createTables 创建数据库所需的三张表：settings、prompts、skills
func createTables(db *sql.DB) error {
	createSettings := `
	CREATE TABLE IF NOT EXISTS settings (
	    key   TEXT PRIMARY KEY,
	    value TEXT NOT NULL
	);`

	createPrompts := `
	CREATE TABLE IF NOT EXISTS prompts (
	    id          INTEGER PRIMARY KEY AUTOINCREMENT,
	    name        TEXT NOT NULL,
	    content     TEXT NOT NULL DEFAULT '',
	    category    TEXT NOT NULL DEFAULT 'uncategorized',
	    tags        TEXT NOT NULL DEFAULT '[]',
	    is_pinned   INTEGER NOT NULL DEFAULT 0,
	    is_template INTEGER NOT NULL DEFAULT 0,
	    usage_count INTEGER NOT NULL DEFAULT 0,
	    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
	    updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP
	);`

	createSkills := `
	CREATE TABLE IF NOT EXISTS skills (
	    id            INTEGER PRIMARY KEY AUTOINCREMENT,
	    name          TEXT NOT NULL,
	    description   TEXT NOT NULL DEFAULT '',
	    relative_path TEXT NOT NULL,
	    version       TEXT NOT NULL DEFAULT '1.0.0',
	    is_pinned     INTEGER NOT NULL DEFAULT 0,
	    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
	    updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP
	);`

	for _, stmt := range []string{createSettings, createPrompts, createSkills} {
		if _, err := db.Exec(stmt); err != nil {
			return fmt.Errorf("执行建表语句失败: %w", err)
		}
	}

	indexes := []string{
		"CREATE INDEX IF NOT EXISTS idx_prompts_category ON prompts(category)",
		"CREATE INDEX IF NOT EXISTS idx_prompts_updated_at ON prompts(updated_at)",
		"CREATE INDEX IF NOT EXISTS idx_skills_updated_at ON skills(updated_at)",
	}
	for _, idx := range indexes {
		if _, err := db.Exec(idx); err != nil {
			return fmt.Errorf("创建索引失败: %w", err)
		}
	}

	if err := migrateDatabase(db); err != nil {
		return fmt.Errorf("数据库迁移失败: %w", err)
	}

	return nil
}

// insertDefaultSettings 插入默认的系统设置项，已存在的设置不会被覆盖
// 其中 font_size_offset 用于控制前端全局字体大小偏移量（支持 CSS 单位）
func insertDefaultSettings(db *sql.DB) error {
	homeDir, _ := os.UserHomeDir()
	appHome := filepath.Join(homeDir, ".psm")

	defaults := map[string]string{
		"app_home":          appHome,
		"app_theme":         "light",
		"prompt_view_mode":  "card",
		"skill_view_mode":   "card",
		"sidebar_collapsed": "false",
	}

	stmt, err := db.Prepare("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)")
	if err != nil {
		return fmt.Errorf("预编译插入语句失败: %w", err)
	}
	defer func() { _ = stmt.Close() }()

	for key, value := range defaults {
		if _, err := stmt.Exec(key, value); err != nil {
			return fmt.Errorf("插入默认设置 [%s=%s] 失败: %w", key, value, err)
		}
	}

	if _, err := db.Exec("INSERT OR IGNORE INTO settings (key, value) VALUES ('font_size_offset', '0px')"); err != nil {
		return fmt.Errorf("插入默认字体大小偏移量设置失败: %w", err)
	}

	if _, err := db.Exec("INSERT OR IGNORE INTO settings (key, value) VALUES ('font_family', '')"); err != nil {
		return fmt.Errorf("插入默认字体族设置失败: %w", err)
	}

	return nil
}

// migrateDatabase 执行数据库迁移，为已有表添加新字段
func migrateDatabase(db *sql.DB) error {
	var columnExists int
	err := db.QueryRow(`SELECT COUNT(*) FROM pragma_table_info('prompts') WHERE name='usage_count'`).Scan(&columnExists)
	if err != nil {
		return fmt.Errorf("检查 usage_count 字段失败: %w", err)
	}

	if columnExists == 0 {
		if _, err := db.Exec(`ALTER TABLE prompts ADD COLUMN usage_count INTEGER NOT NULL DEFAULT 0`); err != nil {
			return fmt.Errorf("添加 usage_count 字段失败: %w", err)
		}
	}

	return nil
}
