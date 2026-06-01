// Package log 封装全局 Logger 初始化逻辑，基于 fastlog 实现
package log

import (
	"fmt"
	"strings"

	"gitee.com/MM-Q/fastlog"
)

var globalLogger *fastlog.Logger

// Init 初始化全局 Logger 实例，写入指定路径，默认 WARN 级别
func Init(path string) {
	globalLogger = fastlog.New(fastlog.Prod(path))
}

// Get 获取全局 Logger 实例
func Get() *fastlog.Logger {
	return globalLogger
}

// Close 关闭全局 Logger，刷新缓冲区并释放资源
func Close() {
	if globalLogger != nil {
		_ = globalLogger.Close()
	}
}

// SetLevel 动态设置日志级别，支持 DEBUG/INFO/WARN/ERROR
func SetLevel(level string) error {
	if globalLogger == nil {
		return fmt.Errorf("logger 未初始化")
	}

	level = strings.ToUpper(level)
	var logLevel fastlog.Level
	switch level {
	case "DEBUG":
		logLevel = fastlog.DEBUG
	case "INFO":
		logLevel = fastlog.INFO
	case "WARN":
		logLevel = fastlog.WARN
	case "ERROR":
		logLevel = fastlog.ERROR
	default:
		return fmt.Errorf("无效的日志级别: %s，支持 DEBUG/INFO/WARN/ERROR", level)
	}

	globalLogger.SetLevel(logLevel)
	return nil
}

// GetLevel 获取当前日志级别字符串
func GetLevel() string {
	if globalLogger == nil {
		return "WARN"
	}
	return globalLogger.Level().String()
}
