# Tasks

- [x] Task 1: 在 variables.css 中添加字体偏移量变量
  - 在 `:root` 中添加 `--font-size-offset: 0px`

- [x] Task 2: 修改 components.css 中的 font-size 为 calc() 格式
  - 将 47 处 `font-size: XXpx` 改为 `font-size: calc(XXpx + var(--font-size-offset))`

- [x] Task 3: 修改 layout.css 中的 font-size 为 calc() 格式
  - 将 3 处 `font-size: XXpx` 改为 `font-size: calc(XXpx + var(--font-size-offset))`

- [x] Task 4: 修改 variables.css 中的 font-size 为 calc() 格式
  - 将 1 处 `font-size: XXpx` 改为 `font-size: calc(XXpx + var(--font-size-offset))`

- [x] Task 5: 在 settings.js 中添加字体大小选择器 UI
  - 在主题选择器下方新增字体大小设置区域
  - 布局：下拉框 + 输入框 + "px" 标签
  - 下拉框选项：较小(-2px)、略小(-1px)、默认(0px)、略大(+1px)、较大(+2px)、自定义
  - 输入框始终显示，显示当前偏移量数值
  - 选择预设档位时，输入框自动填充对应值（只读）
  - 选择"自定义"时，输入框变为可编辑
  - 添加输入验证，限制 -5 到 +5 范围，超出自动修正

- [x] Task 6: 修改 settings.js 保存逻辑
  - 保存时将 `font_size_offset` 写入数据库

- [x] Task 7: 修改 settings.js 加载逻辑
  - 加载设置时读取 `font_size_offset` 并设置下拉框值

- [x] Task 8: 在 app.js 中应用字体偏移量
  - 在 `App.init()` 中从 `App.settings` 读取 `font_size_offset`
  - 设置 CSS 变量 `--font-size-offset`

- [x] Task 9: 在 sqlite.go 中添加默认值
  - 在 settings 表初始化时 INSERT OR IGNORE `font_size_offset = '0px'`
