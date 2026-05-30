# 关于弹窗重构 Spec

## Why
当前版本号和快捷键帮助按钮放在设置页面底部，不够醒目且占用设置页空间。将其移至侧边栏 LOGO 点击触发的"关于"弹窗中，更符合常见的应用设计模式。

## What Changes
- 侧边栏 LOGO 区域添加点击事件，点击后弹出"关于"弹窗
- 新建"关于"弹窗内容：应用名称、版本号、项目简介、项目地址链接、快捷键帮助按钮
- 移除设置页面底部的版本信息和快捷键帮助按钮
- 移除 settings.js 中的 loadVersion 方法和相关事件绑定

## Impact
- Affected specs: 无
- Affected code: index.html, app.js, settings.js, components.css

## ADDED Requirements

### Requirement: 关于弹窗
系统 SHALL 在用户点击侧边栏 LOGO 时弹出"关于"对话框。

#### Scenario: 点击 LOGO
- **WHEN** 用户点击侧边栏顶部的 LOGO 图标或应用名称
- **THEN** 弹出"关于 PSM"对话框

#### Scenario: 关于弹窗内容
- **WHEN** 关于弹窗打开
- **THEN** 显示以下内容：
  - 应用名称：PSM - Skill & Prompt Manager
  - 版本号：从 API.getVersion() 获取
  - 项目简介：一句话描述应用功能
  - 项目地址：可点击的链接（如有）
  - 快捷键帮助按钮：点击后显示快捷键说明

#### Scenario: 关闭弹窗
- **WHEN** 用户点击关闭按钮或按 Escape 键
- **THEN** 关闭关于弹窗

## MODIFIED Requirements

### Requirement: 侧边栏 LOGO 交互
侧边栏 LOGO 区域 SHALL 支持点击事件，点击后打开关于弹窗。

## REMOVED Requirements

### Requirement: 设置页面版本信息
**Reason**: 版本信息移至关于弹窗
**Migration**: 删除 settings.js 中的 loadVersion 方法和 version-info HTML

### Requirement: 设置页面快捷键帮助按钮
**Reason**: 快捷键帮助移至关于弹窗
**Migration**: 删除 settings.js 中的 shortcut-help-btn 事件绑定
