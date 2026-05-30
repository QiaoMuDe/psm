# Tasks

- [x] Task 1: 在 index.html 中为 LOGO 区域添加点击事件支持
  - 给 .app-logo 添加 id="app-logo-btn" 和 title="关于"
  - 给 .app-title-group 添加 cursor: pointer 样式

- [x] Task 2: 在 app.js 中添加 showAboutDialog 方法
  - 调用 API.getVersion() 获取版本信息
  - 使用 Modal.open 打开关于弹窗
  - 弹窗内容包含：应用名称、版本号、简介、快捷键帮助按钮

- [x] Task 3: 在 app.js 的 init() 方法中绑定 LOGO 点击事件
  - 选择 #app-logo-btn 和 .app-title-group
  - 点击时调用 showAboutDialog()

- [x] Task 4: 在 settings.js 中移除版本信息相关代码
  - 移除 loadVersion 方法
  - 移除 render 中的 version-info HTML
  - 移除 Promise.all 中的 loadVersion 调用

- [x] Task 5: 在 settings.js 中移除快捷键帮助按钮相关代码
  - 移除 shortcut-help-btn 的 HTML
  - 移除 bindEvents 中的 shortcut-help-btn 事件绑定

- [x] Task 6: 在 components.css 中添加关于弹窗样式
  - 添加 .about-dialog 样式
  - 添加 .about-logo、.about-name、.about-version、.about-desc、.about-link 样式
