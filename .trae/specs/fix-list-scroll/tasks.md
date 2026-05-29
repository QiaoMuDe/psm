# Tasks

- [x] Task 1: 修改 CSS 布局实现列表独立滚动
  修改 `frontend/css/style.css` 中的布局规则：
  - [x] SubTask 1.1: 修改 `.main-content` 为 `overflow: hidden; display: flex; flex-direction: column;`
  - [x] SubTask 1.2: 确保 `.page-header` 不被压缩（`flex-shrink: 0`）
  - [x] SubTask 1.3: 让 `.main-content > .card` 填充剩余高度（`flex: 1; display: flex; flex-direction: column; overflow: hidden`）
  - [x] SubTask 1.4: 让 `.card-header` 不被压缩（`flex-shrink: 0`）
  - [x] SubTask 1.5: 让 `#prompt-list` 和 `#skill-list` 独立滚动（`flex: 1; overflow-y: auto`）

- [x] Task 2: 验证
  - [x] SubTask 2.1: 确认 `go build ./...` 通过
  - [ ] SubTask 2.2: 确认仪表盘、设置、数据管理视图不受影响（需用户验证）
