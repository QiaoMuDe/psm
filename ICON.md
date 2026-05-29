# 应用图标更换指南

> 本文档说明如何更换 PSM 应用的图标，包括应用图标和 Windows 可执行文件图标。

---

## 图标文件位置

```
psm/
└── build/
    ├── appicon.png              ← 应用主图标（PNG 格式）
    └── windows/
        └── icon.ico             ← Windows EXE 图标（ICO 格式）
```

---

## 换图标步骤

### 1. 准备图标文件

- **appicon.png**：正方形 PNG 图片，建议 512×512px
- **icon.ico**：从 PNG 转换为 ICO 格式，需包含多尺寸（16×16、32×32、48×48、256×256）

### 2. 替换文件

用新图标直接覆盖对应文件：

```bash
# 替换应用主图标
copy 你的图标.png  build\appicon.png

# 替换 Windows EXE 图标
copy 你的图标.ico  build\windows\icon.ico
```

### 3. 重新构建

```bash
wails build
```

构建完成后，新的 `build\bin\psm.exe` 将使用新图标。

---

## 可配置项（wails.json）

`wails.json` 中的 `info` 字段控制窗口标题栏和版本信息：

| 字段 | 当前值 | 说明 |
|------|--------|------|
| `productName` | `Skill & Prompt Manager` | 窗口标题、安装程序显示名称 |
| `productVersion` | `1.0.0` | 版本号 |
| `companyName` | `psm` | 公司名称 |
| `copyright` | `2026 psm` | 版权信息 |

修改这些字段后也需要重新 `wails build`。

---

## ICO 格式转换工具

如果只有 PNG 图标，需要转换为 ICO 格式：

- **在线转换**：[icoconvert.com](https://icoconvert.com/)
- **在线转换**：[convertio.co](https://convertio.co/png-ico/)
- **本地工具**：[IcoFX](https://icofx.ro/)（免费）
- **命令行**（需安装 ImageMagick）：
  ```bash
  magick convert appicon.png -define icon:auto-resize=16,32,48,256 icon.ico
  ```

---

## 注意事项

- `icon.ico` 必须包含 16×16 和 256×256 至少两个尺寸
- `appicon.png` 建议保持正方形比例
- 替换图标后必须重新 `wails build` 才能生效
- 清理旧构建缓存：`wails clean` 后再重新构建
