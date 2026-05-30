package main

import (
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"syscall"
)

var (
	modGdi32      = syscall.NewLazyDLL("gdi32.dll")
	procEnumFonts = modGdi32.NewProc("EnumFontFamiliesW")
	procGetDC     = modUser32.NewProc("GetDC")
	procReleaseDC = modUser32.NewProc("ReleaseDC")
)

var (
	modUser32 = syscall.NewLazyDLL("user32.dll")
)

const (
	ENUM_FONTFACES_ONLY = 0x00000040
)

type NEWTEXTMETRICEXW struct {
	NewTextMetricW NEWTEXTMETRICW
	FontIndex      uint32
	FontType       int32
}

type NEWTEXTMETRICW struct {
	TmHeight           int32
	TmAscent           int32
	TmDescent          int32
	TmInternalLeading  int32
	TmExternalLeading  int32
	TmAveCharWidth     int32
	TmMaxCharWidth     int32
	TmWeight           int32
	TmItalic           uint8
	TmUnderlined       uint8
	TmStruckOut        uint8
	TmFirstChar        uint8
	TmLastChar         uint8
	TmDefaultChar      uint8
	TmBreakChar        uint8
	TmPitchAndFamily   uint8
	TmCharSet          uint8
	TmOverhang         int32
	TmDigitizedAspectX int32
	TmDigitizedAspectY int32
	TmFaceName         [64]uint16
}

type LOGFONTW struct {
	LfHeight         int32
	LfWidth          int32
	LfEscapement     int32
	LfOrientation    int32
	LfWeight         int32
	LfItalic         uint8
	LfUnderline      uint8
	LfStrikeOut      uint8
	LfCharSet        uint8
	LfOutPrecision   uint8
	LfClipPrecision  uint8
	LfQuality        uint8
	LfPitchAndFamily uint8
	LfFaceName       [32]uint16
}

type fontInfo struct {
	Name     string
	FullName string
	Style    string
}

var fonts []fontInfo
var fontMap = make(map[string]bool)

func fontCallback(lplf *LOGFONTW, lpntm *NEWTEXTMETRICEXW, fontType uint32, lParam uintptr) uintptr {
	// 仅处理 TrueType 或 Raster 字体
	if fontType == 0 {
		return 1 // 继续枚举
	}

	name := syscall.UTF16ToString(lplf.LfFaceName[:])

	// 去重
	if fontMap[name] {
		return 1
	}
	fontMap[name] = true

	fullName := syscall.UTF16ToString(lpntm.NewTextMetricW.TmFaceName[:])

	fonts = append(fonts, fontInfo{
		Name:     name,
		FullName: fullName,
	})

	return 1
}

func getSystemFonts() []string {
	hdc, _, _ := procGetDC.Call(0)
	if hdc == 0 {
		fmt.Println("获取设备上下文失败")
		return nil
	}
	defer procReleaseDC.Call(0, hdc) //nolint:errcheck

	var lf LOGFONTW
	lf.LfCharSet = 0xFF // DEFAULT_CHARSET

	callback := syscall.NewCallback(fontCallback)

	procEnumFonts.Call(hdc, 0, callback, 0) //nolint:errcheck

	// 去重并排序
	uniqueFonts := make(map[string]bool)
	var result []string
	for _, f := range fonts {
		if !uniqueFonts[f.Name] {
			uniqueFonts[f.Name] = true
			result = append(result, f.Name)
		}
	}

	sort.Strings(result)
	return result
}

func getFontFiles() []string {
	// 获取系统字体目录
	fontDir := filepath.Join(os.Getenv("SYSTEMROOT"), "Fonts")
	if _, err := os.Stat(fontDir); os.IsNotExist(err) {
		fontDir = `C:\Windows\Fonts`
	}

	var files []string
	entries, err := os.ReadDir(fontDir)
	if err != nil {
		return files
	}

	for _, entry := range entries {
		if !entry.IsDir() {
			name := strings.ToLower(entry.Name())
			if strings.HasSuffix(name, ".ttf") || strings.HasSuffix(name, ".otf") ||
				strings.HasSuffix(name, ".ttc") {
				files = append(files, entry.Name())
			}
		}
	}

	sort.Strings(files)
	return files
}

func main() {
	fmt.Println("===========================================")
	fmt.Println("    系统字体测试工具")
	fmt.Println("===========================================")
	fmt.Println()

	// 方法 1：使用 EnumFontFamilies 获取字体族
	fmt.Println("【方法 1】使用 Windows API EnumFontFamilies 获取字体族名称")
	fmt.Println("-----------------------------------------------------------")

	fontFamilies := getSystemFonts()
	fmt.Printf("共发现 %d 个字体族\n\n", len(fontFamilies))

	// 按类别分组显示
	fmt.Println("字体列表：")
	fmt.Println(strings.Repeat("-", 40))

	for i, name := range fontFamilies {
		fmt.Printf("%3d. %s\n", i+1, name)
	}

	fmt.Println()
	fmt.Println()

	// 方法 2：读取字体目录
	fmt.Println("【方法 2】读取系统字体目录文件")
	fmt.Println("-----------------------------------------------------------")

	fontFiles := getFontFiles()
	fmt.Printf("共发现 %d 个字体文件\n\n", len(fontFiles))

	fmt.Println("字体文件列表：")
	fmt.Println(strings.Repeat("-", 40))

	for i, name := range fontFiles {
		fmt.Printf("%3d. %s\n", i+1, name)
	}

	fmt.Println()
	fmt.Println("===========================================")
	fmt.Println("测试完成！")
	fmt.Println("===========================================")

	// 输出 JSON 格式方便前端使用
	fmt.Println()
	fmt.Println("【JSON 格式】前端可直接使用：")
	fmt.Println("-----------------------------------------------------------")
	fmt.Print("[")
	for i, name := range fontFamilies {
		if i > 0 {
			fmt.Print(",")
		}
		fmt.Printf("\n  \"%s\"", name)
	}
	fmt.Println("\n]")
}
