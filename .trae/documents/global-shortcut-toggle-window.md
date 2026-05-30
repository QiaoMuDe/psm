# 全局快捷键显示/隐藏窗口实现计划

## 目标

使用 `Ctrl+Shift+Space` 全局快捷键显示/隐藏应用窗口，即使应用在后台也能响应。

## 技术方案

### 为什么不用 Wails v2 菜单快捷键？

Wails v2 的菜单快捷键（Accelerator）只在应用获得焦点时生效，无法在后台响应。要实现真正的全局快捷键，需要使用 Windows API 的 `RegisterHotKey`。

### 实现原理

1. 使用 Windows API `RegisterHotKey` 注册全局热键
2. 使用 Windows API `UnregisterHotKey` 注销热键
3. 在消息循环中监听 `WM_HOTKEY` 消息
4. 收到热键消息时切换窗口显示/隐藏状态

## 实现步骤

### 1. 修改 main.go

* 添加 Windows API 导入（`user32.dll`）

* 定义全局热键常量（`MOD_CONTROL | MOD_SHIFT`, `VK_SPACE`）

* 实现 `RegisterHotKey` 和 `UnregisterHotKey` 函数

* 实现消息循环监听 `WM_HOTKEY` 消息

### 2. 修改 app.go

* 添加窗口状态变量 `windowVisible bool`

* 在 startup 方法中注册全局热键

* 添加 `ToggleWindow` 方法切换窗口显示/隐藏

* 在 shutdown 方法中注销全局热键

### 3. 前端反馈（可选）

* 窗口显示时显示 Toast 提示

## 修改文件清单

1. `main.go` - Windows API 调用和消息循环
2. `app.go` - 窗口状态管理和热键注册

## 技术细节

### Windows API 函数

```go
// user32.dll 函数
procRegisterHotKey   = user32.NewProc("RegisterHotKey")
procUnregisterHotKey = user32.NewProc("UnregisterHotKey")
procGetMessage       = user32.NewProc("GetMessageW")
```

### 热键定义

```go
const (
    HOTKEY_ID     = 1
    MOD_KEYS      = 0x0003  // MOD_CONTROL | MOD_SHIFT
    VK_SPACE      = 0x20
    WM_HOTKEY     = 0x0312
)
```

### 消息循环

```go
func messageLoop(ctx context.Context) {
    var msg struct {
        HWnd    uintptr
        Message uint32
        WParam  uintptr
        LParam  uintptr
        Time    uint32
        Pt      struct{ X, Y int32 }
    }
    for {
        procGetMessage.Call(uintptr(unsafe.Pointer(&msg)), 0, 0, 0)
        if msg.Message == WM_HOTKEY && msg.WParam == HOTKEY_ID {
            // 切换窗口显示/隐藏
            toggleWindow(ctx)
        }
    }
}
```

## 注意事项

1. 热键冲突：`Ctrl+Shift+Space` 可能与其他应用冲突
2. 多实例问题：需要确保只有一个实例注册热键
3. 窗口状态：需要正确维护窗口显示/隐藏状态

