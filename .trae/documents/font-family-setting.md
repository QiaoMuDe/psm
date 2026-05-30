# 字体族设置功能实现方案

> 版本: 1.0.0 | 日期: 2026-05-31 | 状态: 待确认

***

## 一、功能概述

在设置页面新增字体族（font-family）选择器，允许用户从系统已安装的字体中选择应用界面字体，设置持久化到数据库，启动时自动加载。

***

## 二、技术方案

### 核心思路

1. **后端**：使用 Windows API `EnumFontFamiliesW` 获取系统字体族列表
2. **前端**：下拉框 + 搜索过滤，实时预览字体效果
3. **存储**：数据库 `settings` 表新增 `font_family` 字段
4. **回退**：默认使用 Space Grotesk，字体不存在时自动回退

***

## 三、修改文件清单

### 后端文件

| 文件                             | 修改内容                     | 说明       |
| ------------------------------ | ------------------------ | -------- |
| `tools/fonttest/main.go`       | 保留                       | 测试脚本，可删除 |
| `internal/handler/settings.go` | 新增 `GetSystemFonts()` 方法 | 返回系统字体列表 |
| `internal/utils/font.go`       | 新建                       | 字体获取工具函数 |
| `internal/db/sqlite.go`        | 新增 `font_family` 默认值     | 默认空字符串   |

### 前端文件

| 文件                              | 修改内容                  | 说明         |
| ------------------------------- | --------------------- | ---------- |
| `frontend/css/variables.css`    | 新增 `--font-family` 变量 | 字体族 CSS 变量 |
| `frontend/js/app.js`            | 加载设置时应用字体族            | 初始化时设置     |
| `frontend/js/views/settings.js` | 新增字体族选择器 UI           | 下拉框 + 搜索   |
| `frontend/css/components.css`   | 新增字体选择器样式             | 可选         |

***

## 四、详细实现步骤

### 步骤 1：创建字体工具函数

**文件**: `internal/utils/font.go`

```go
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
    defer procReleaseDC.Call(0, hdc)
    
    var lf LOGFONTW
    lf.LfCharSet = 0xFF // DEFAULT_CHARSET
    
    callback := syscall.NewCallback(fontEnumCallback)
    procEnumFonts.Call(hdc, 0, callback, 0)
    
    // 去重并排序
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
```

***

### 步骤 2：新增 Handler 方法

**文件**: `internal/handler/settings.go`

```go
// GetSystemFonts 获取系统已安装的字体族列表
func (h *SettingsHandler) GetSystemFonts() []string {
    return utils.GetSystemFonts()
}
```

***

### 步骤 3：数据库默认值

**文件**: `internal/db/sqlite.go`

在 `insertDefaultSettings` 函数中添加：

```go
if _, err := db.Exec("INSERT OR IGNORE INTO settings (key, value) VALUES ('font_family', '')"); err != nil {
    return fmt.Errorf("插入默认字体族设置失败: %w", err)
}
```

***

### 步骤 4：CSS 变量定义

**文件**: `frontend/css/variables.css`

在 `:root` 中添加：

```css
:root {
    /* 字体族变量，默认使用 Space Grotesk */
    --font-family: 'Space Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    --font-size-offset: 0px;
    /* ... 其他现有变量 ... */
}
```

***

### 步骤 5：前端加载设置时应用字体族

**文件**: `frontend/js/app.js`

在 `loadSettings` 中添加：

```javascript
// 应用字体族
const fontFamily = App.settings.font_family || '';
if (fontFamily) {
    document.documentElement.style.setProperty('--font-family', `'${fontFamily}', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`);
}
```

***

### 步骤 6：设置页面 UI

**文件**: `frontend/js/views/settings.js`

#### 6.1 添加字体族选择器 HTML

在字体大小选择器下方添加：

```html
<div class="settings-row">
    <div class="settings-row-label">
        <span class="settings-row-title">字体族</span>
        <span class="settings-row-desc">选择应用界面的字体</span>
    </div>
    <div class="settings-row-control settings-font-family-control">
        <div class="font-family-selector">
            <input type="text" id="setting-font-family-search" class="form-input" 
                   placeholder="搜索字体..." autocomplete="off" />
            <div id="setting-font-family-dropdown" class="font-family-dropdown">
                <div class="font-family-option" data-value="">
                    <span class="font-family-preview" style="font-family: 'Space Grotesk'">默认 (Space Grotesk)</span>
                </div>
                <!-- 动态填充字体列表 -->
            </div>
        </div>
        <input type="hidden" id="setting-font-family" value="" />
    </div>
</div>
```

#### 6.2 添加 CSS 样式

```css
.settings-font-family-control {
    width: 300px;
}

.font-family-selector {
    position: relative;
    width: 100%;
}

.font-family-dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    max-height: 300px;
    overflow-y: auto;
    background: var(--bg-surface);
    border: 1px solid var(--border);
    border-radius: 8px;
    box-shadow: var(--shadow-lg);
    z-index: 100;
    display: none;
}

.font-family-dropdown.active {
    display: block;
}

.font-family-option {
    padding: 10px 12px;
    cursor: pointer;
    transition: background var(--transition-fast);
}

.font-family-option:hover {
    background: var(--accent-light);
}

.font-family-option.selected {
    background: var(--accent-light);
    color: var(--accent);
}

.font-family-preview {
    font-size: 14px;
}
```

#### 6.3 添加 JavaScript 逻辑

```javascript
// 加载系统字体列表
async loadSystemFonts() {
    try {
        const fonts = await API.getSystemFonts();
        const dropdown = document.getElementById('setting-font-family-dropdown');
        
        // 清空现有选项（保留默认选项）
        const defaultOption = dropdown.querySelector('[data-value=""]');
        dropdown.innerHTML = '';
        if (defaultOption) dropdown.appendChild(defaultOption);
        
        // 添加字体选项
        fonts.forEach(font => {
            const option = document.createElement('div');
            option.className = 'font-family-option';
            option.dataset.value = font;
            option.innerHTML = `<span class="font-family-preview" style="font-family: '${font}'">${font}</span>`;
            dropdown.appendChild(option);
        });
        
        return fonts;
    } catch (err) {
        Toast.error('加载系统字体失败');
        return [];
    }
},

// 应用字体族
applyFontFamily(family) {
    if (family) {
        document.documentElement.style.setProperty('--font-family', `'${family}', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`);
    } else {
        document.documentElement.style.setProperty('--font-family', "'Space Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif");
    }
},

// 绑定字体选择器事件
bindFontFamilyEvents() {
    const searchInput = document.getElementById('setting-font-family-search');
    const dropdown = document.getElementById('setting-font-family-dropdown');
    const hiddenInput = document.getElementById('setting-font-family');
    
    // 点击搜索框显示下拉
    searchInput.addEventListener('focus', () => {
        dropdown.classList.add('active');
    });
    
    // 搜索过滤
    searchInput.addEventListener('input', () => {
        const query = searchInput.value.toLowerCase();
        const options = dropdown.querySelectorAll('.font-family-option');
        options.forEach(option => {
            const fontName = option.dataset.value || 'Space Grotesk';
            option.style.display = fontName.toLowerCase().includes(query) ? '' : 'none';
        });
    });
    
    // 选择字体
    dropdown.addEventListener('click', (e) => {
        const option = e.target.closest('.font-family-option');
        if (!option) return;
        
        const value = option.dataset.value;
        hiddenInput.value = value;
        searchInput.value = value || '默认 (Space Grotesk)';
        
        // 更新选中状态
        dropdown.querySelectorAll('.font-family-option').forEach(opt => opt.classList.remove('selected'));
        option.classList.add('selected');
        
        // 实时预览
        this.applyFontFamily(value);
        
        // 关闭下拉
        dropdown.classList.remove('active');
    });
    
    // 点击外部关闭下拉
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.font-family-selector')) {
            dropdown.classList.remove('active');
        }
    });
}
```

#### 6.4 保存时包含字体族

```javascript
document.getElementById('save-settings-btn').addEventListener('click', async () => {
    const theme = document.getElementById('setting-theme').value;
    const skillPath = document.getElementById('setting-skill-path').value;
    const fontSizeOffset = document.getElementById('setting-font-size-custom').value + 'px';
    const fontFamily = document.getElementById('setting-font-family').value;
    
    try {
        await API.updateSettings({
            app_theme: theme,
            skill_storage_path: skillPath,
            font_size_offset: fontSizeOffset,
            font_family: fontFamily,
        });
        document.documentElement.setAttribute('data-theme', theme);
        Toast.success('保存成功');
    } catch (err) {
        // 错误已由 API.call 处理
    }
});
```

***

## 五、字体回退机制

### 回退策略

1. **默认值**: 空字符串，使用 Space Grotesk
2. **用户选择**: 存储字体名称到数据库
3. **加载时检查**: 如果字体不存在，自动回退到默认字体

### 实现方式

```javascript
// 在 applyFontFamily 中添加检查
applyFontFamily(family) {
    if (family) {
        // 检查字体是否可用
        if (document.fonts.check(`12px "${family}"`)) {
            document.documentElement.style.setProperty('--font-family', `'${family}', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`);
        } else {
            // 字体不存在，回退到默认
            console.warn(`字体 "${family}" 不可用，使用默认字体`);
            document.documentElement.style.setProperty('--font-family', "'Space Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif");
        }
    } else {
        document.documentElement.style.setProperty('--font-family', "'Space Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif");
    }
}
```

***

## 六、前端 API 层

**文件**: `frontend/js/api.js`

```javascript
// 获取系统字体列表
getSystemFonts() {
    return API.call('GetSystemFonts');
},
```

***

## 七、使用流程

```
启动应用
  ↓
加载数据库设置 (font_family)
  ↓
应用字体族到 CSS 变量 (--font-family)
  ↓
检查字体是否可用
  ├─ 可用 → 使用用户选择的字体
  └─ 不可用 → 回退到默认字体 (Space Grotesk)
```

***

## 八、注意事项

1. **性能优化**: 系统字体列表可能有几百个，建议懒加载或分页
2. **中文字体**: 过滤 `@` 开头的竖排字体变体
3. **字体预览**: 下拉框中的选项可以使用对应字体预览
4. **常用字体置顶**: 将 Segoe UI、微软雅黑、Arial 等常用字体放在前面
5. **搜索防抖**: 搜索输入添加防抖，避免频繁过滤

***

## 九、测试用例

1. 启动应用，设置页显示字体选择器
2. 点击搜索框，下拉框显示系统字体列表
3. 搜索字体名称，列表实时过滤
4. 选择字体，界面立即预览效果
5. 保存设置，刷新应用，字体设置保持
6. 测试不存在的字体，自动回退到默认字体

***

## 十、依赖说明

* 无新依赖，使用 Windows API 直接调用

* 复用现有的 `syscall` 包

