# Tasks

- [x] Task 1: 新增 FixFileName 编码修复函数
  在 `internal/utils/archive.go` 中新增 `FixFileName(name string) string` 函数，实现 ZIP 条目文件名编码自动修复逻辑：
  - [x] SubTask 1.1: 引入 `unicode/utf8`、`golang.org/x/text/encoding/charmap`、`golang.org/x/text/encoding/simplifiedchinese` 依赖
  - [x] SubTask 1.2: 实现检测逻辑——纯 ASCII 或有效 UTF-8 且无替换字符时直接返回原名
  - [x] SubTask 1.3: 实现 GB18030 直接解码——尝试将 name 的原始字节按 GB18030 解码（处理 UTF-8 标志位已设置但实际编码为 GBK 的情况）
  - [x] SubTask 1.4: 实现 CP437 逆向还原 + GB18030 解码——先通过 CP437 编码器将 Unicode 字符还原为原始字节，再按 GB18030 解码（处理 UTF-8 标志位未设置、GBK 字节被 CP437 误读的情况）
  - [x] SubTask 1.5: 兜底返回原名——所有修复尝试失败时返回原始文件名
  - [x] SubTask 1.6: 运行 `go mod tidy` 更新依赖

- [x] Task 2: 在解压函数中应用 FixFileName
  修改 `internal/utils/archive.go` 中的解压函数，对所有 `file.Name` 应用编码修复：
  - [x] SubTask 2.1: 修改 `UnzipToDir` 函数，在使用 `file.Name` 构建目标路径前调用 `FixFileName`
  - [x] SubTask 2.2: 修改 `UnzipPrefixToDir` 函数，在读取条目名称后、匹配前缀前调用 `FixFileName`

- [x] Task 3: 在批量导入函数中应用 FixFileName
  修改 `internal/service/skill.go` 中读取 ZIP 文件名的逻辑：
  - [x] SubTask 3.1: 修改 `ImportSkillFromExportZip` 函数，对 `file.Name` 调用 `utils.FixFileName` 后再进行路径解析和 SKILL.md 匹配

- [x] Task 4: 编译验证
  - [x] SubTask 4.1: 执行 `go build ./...` 确认编译通过
  - [ ] SubTask 4.2: 执行 `wails dev` 启动开发模式，导入包含中文目录名的 ZIP 文件验证修复效果
