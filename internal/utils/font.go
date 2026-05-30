package utils

import (
	"sort"
	"syscall"
)

var (
	modGdi32  = syscall.NewLazyDLL("gdi32.dll")
	modUser32 = syscall.NewLazyDLL("user32.dll")

	procEnumFonts = modGdi32.NewProc("EnumFontFamiliesW")
	procGetDC     = modUser32.NewProc("GetDC")
	procReleaseDC = modUser32.NewProc("ReleaseDC")
)

// LOGFONTW 逻辑字体结构体
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

// NEWTEXTMETRICEXW 扩展文本度量结构体
type NEWTEXTMETRICEXW struct {
	NewTextMetricW NEWTEXTMETRICW
	FontIndex      uint32
	FontType       int32
}

// NEWTEXTMETRICW 文本度量结构体
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

var (
	fontNames []string
	fontMap   = make(map[string]bool)
)

// GetSystemFonts 获取系统所有字体族名称（去重、排序）
func GetSystemFonts() []string {
	fontNames = nil
	fontMap = make(map[string]bool)

	hdc, _, _ := procGetDC.Call(0)
	if hdc == 0 {
		return nil
	}
	defer procReleaseDC.Call(0, hdc) //nolint:errcheck

	var lf LOGFONTW
	lf.LfCharSet = 0xFF

	callback := syscall.NewCallback(fontEnumCallback)
	procEnumFonts.Call(hdc, 0, callback, 0) //nolint:errcheck

	uniqueFonts := make(map[string]bool)
	var result []string
	for _, name := range fontNames {
		if !uniqueFonts[name] {
			uniqueFonts[name] = true
			result = append(result, name)
		}
	}
	sort.Strings(result)
	return result
}

// fontEnumCallback 字体枚举回调函数
func fontEnumCallback(lplf *LOGFONTW, lpntm *NEWTEXTMETRICEXW, fontType uint32, lParam uintptr) uintptr {
	if fontType == 0 {
		return 1
	}
	name := syscall.UTF16ToString(lplf.LfFaceName[:])
	if !fontMap[name] {
		fontMap[name] = true
		fontNames = append(fontNames, name)
	}
	return 1
}
