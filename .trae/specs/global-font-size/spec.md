# 全局字体大小控制 Spec

## Why

用户需要根据不同使用场景和视觉偏好调整应用的整体字体大小。当前字体大小硬编码在 CSS 中，无法动态调整。

## What Changes

* 在 `variables.css` 中新增 `--font-size-offset` CSS 变量（默认 0px）

* 将所有 `font-size` 硬编码值改为 `calc(原始值 + var(--font-size-offset))`

* 在设置页新增字体大小选择器（5 个档位：-2px、-1px、0、+1px、+2px）

* 数据库 settings 表新增 `font_size_offset` 键值对

* App 启动时从数据库加载并应用字体偏移量

## Impact

* Affected specs: 无

* Affected code: variables.css, layout.css, components.css, settings.js, app.js, sqlite.go

## ADDED Requirements

### Requirement: 字体大小偏移量变量

系统 SHALL 在 `:root` 中定义 `--font-size-offset: 0px` CSS 变量。

#### Scenario: 默认状态

* **WHEN** 用户未设置字体大小

* **THEN** `--font-size-offset` 值为 `0px`，所有字体保持原始大小

### Requirement: 设置页字体大小选择器

系统 SHALL 在设置页提供字体大小选择器，包含 5 个档位。

#### Scenario: 选择字体大小

* **WHEN** 用户在设置页选择字体大小档位

* **THEN** 界面实时预览字体大小变化

#### Scenario: 保存字体大小

* **WHEN** 用户点击保存设置

* **THEN** 字体偏移量保存到数据库 `font_size_offset` 字段

### Requirement: 启动时加载字体设置

系统 SHALL 在应用启动时从数据库加载字体偏移量并应用。

#### Scenario: 正常启动

* **WHEN** 应用启动

* **THEN** 从 settings 读取 `font_size_offset`，设置 `document.documentElement.style.setProperty('--font-size-offset', value)`

### Requirement: 字体大小档位定义

系统 SHALL 提供以下字体大小档位：

| 档位名称 | 偏移量  | 效果示例（正文 14px →） |
| ---- | ---- | --------------- |
| 较小   | -2px | 12px            |
| 略小   | -1px | 13px            |
| 默认   | 0px  | 14px            |
| 略大   | +1px | 15px            |
| 较大   | +2px | 16px            |

## MODIFIED Requirements

### Requirement: CSS 字体大小引用

所有 `font-size` 硬编码值 SHALL 改为 `calc(原始值 + var(--font-size-offset))` 格式。

#### Scenario: 偏移量生效

* **WHEN** `--font-size-offset` 值改变

* **THEN** 所有使用 `calc()` 的字体大小同步变化

