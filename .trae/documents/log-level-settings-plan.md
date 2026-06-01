# 日志级别动态设置功能实现计划

## 功能概述

在设置页面添加日志级别配置选项，支持动态调整日志级别（DEBUG/INFO/WARN/ERROR），默认 WARN，启动时从数据库加载配置，修改后实时生效。下拉菜单支持键盘导航（↑↓/Enter）。

## 实现步骤

### 步骤 1：修改 internal/log/log.go

* 添加 `SetLevel(level string) error` 函数，支持根据字符串设置日志级别

* 添加 `GetLevel() string` 函数，获取当前级别字符串

* 修改 `Init(path string)`，初始使用 WARN 级别创建 Logger

### 步骤 2：修改 app.go 启动流程

* startup() 中：

  1. 先调用 `log.Init(logPath)` 创建默认 WARN 级别 Logger
  2. 初始化数据库
  3. 从 settings 表读取 `log_level` 配置
  4. 如果配置存在且有效，调用 `log.SetLevel()` 调整级别
  5. 记录日志 "日志级别设置为 xxx"

### 步骤 3：修改 internal/handler/settings.go

* 添加 `GetLogLevel() string` 方法：返回当前日志级别

* 添加 `SetLogLevel(level string) error` 方法：

  1. 校验 level 有效性（DEBUG/INFO/WARN/ERROR）
  2. 调用 `log.SetLevel(level)` 实时生效
  3. 保存到 settings 表
  4. 记录 INFO 日志 "日志级别已更改为 xxx"

### 步骤 4：前端设置页面（settings.js）

* 在 AI 设置区域后添加"日志设置"区域

* 添加下拉菜单 HTML：

  ```html
  <div class="settings-row">
    <div class="settings-row-label">
      <span class="settings-row-title">日志级别</span>
      <span class="settings-row-desc">控制日志输出详细程度，DEBUG 最详细，ERROR 仅错误</span>
    </div>
    <div class="settings-row-control">
      <div class="custom-select" id="log-level-select">
        <div class="select-trigger" id="log-level-trigger">WARN</div>
        <div class="select-dropdown" id="log-level-dropdown" style="display:none;">
          <div class="select-option" data-value="DEBUG">DEBUG</div>
          <div class="select-option" data-value="INFO">INFO</div>
          <div class="select-option" data-value="WARN">WARN</div>
          <div class="select-option" data-value="ERROR">ERROR</div>
        </div>
      </div>
    </div>
  </div>
  ```

* 实现键盘导航（参考模型下拉实现）：

  * ↑↓ 移动高亮

  * Enter 选择

  * Esc 关闭

  * 点击外部关闭

* 加载设置时调用 `API.getLogLevel()` 获取当前值

* 选择变更时调用 `API.setLogLevel(value)` 保存

### 步骤 5：前端 API 封装（api.js）

* 添加 `getLogLevel: () => API.call(window.go.main.App.GetLogLevel)`

* 添加 `setLogLevel: (level) => API.call(window.go.main.App.SetLogLevel, level)`

### 步骤 6：添加默认设置

* 在 db/gorm.go 的 DefaultSettings 中添加 `log_level` 默认值为 "WARN"

### 步骤 7：CSS 样式（components.css）

* 添加 `.custom-select` 相关样式（参考 model-dropdown）

* 高亮样式 `.select-option.highlight`

## 文件修改清单

| 文件                            | 修改类型 | 说明                            |
| ----------------------------- | ---- | ----------------------------- |
| internal/log/log.go           | 修改   | 添加 SetLevel/GetLevel          |
| app.go                        | 修改   | 启动时加载日志级别配置                   |
| internal/handler/settings.go  | 修改   | 添加 GetLogLevel/SetLogLevel    |
| internal/db/gorm.go           | 修改   | DefaultSettings 添加 log\_level |
| frontend/js/api.js            | 修改   | 添加 API 封装                     |
| frontend/js/views/settings.js | 修改   | 添加日志级别下拉菜单                    |
| frontend/css/components.css   | 修改   | 添加下拉菜单样式                      |

## 验收标准

* [ ] 启动时默认 WARN 级别，数据库加载后应用配置值

* [ ] 设置页面显示当前日志级别

* [ ] 下拉菜单支持 ↑↓ 导航、Enter 选择、Esc 关闭

* [ ] 修改后实时生效（无需重启）

* [ ] 切换级别后日志文件正确过滤（DEBUG 显示所有，ERROR 仅错误）

