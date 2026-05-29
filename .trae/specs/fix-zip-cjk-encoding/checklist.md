# Checklist

- [x] FixFileName 函数正确引入 unicode/utf8、golang.org/x/text/encoding/charmap、golang.org/x/text/encoding/simplifiedchinese 依赖
- [x] FixFileName 对纯 ASCII 文件名返回原名不变
- [x] FixFileName 对有效 UTF-8 文件名返回原名不变
- [x] FixFileName 对 GBK 编码文件名（UTF-8 标志未设置，被 CP437 误读）能正确恢复为中文
- [x] FixFileName 对 GBK 编码文件名（UTF-8 标志已设置但实际非 UTF-8）能正确解码为中文
- [x] FixFileName 对无法识别的编码兜底返回原名，不产生 panic 或额外错误
- [x] UnzipToDir 函数中 file.Name 已经过 FixFileName 处理
- [x] UnzipPrefixToDir 函数中 file.Name 已经过 FixFileName 处理
- [x] ImportSkillFromExportZip 函数中 file.Name 已经过 FixFileName 处理
- [x] go mod tidy 执行成功，golang.org/x/text 正确引入
- [x] go build ./... 编译通过无错误
- [ ] 导入包含中文目录名的 ZIP 文件，解压后目录名显示正确中文（需用户手动验证）
