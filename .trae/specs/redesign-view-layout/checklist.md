# Checklist

- [x] `.main-content` 已改为 `display: flex; flex-direction: column; overflow: hidden;`，移除了 `overflow-y: auto` 和 `padding`
- [x] `#view-container` 已设为 `display: flex; flex-direction: column; flex: 1; overflow: hidden; padding: var(--spacing-4);`
- [x] `.page-header` 移除了 `position: sticky` 相关样式，改为 `flex-shrink: 0`
- [x] `.view-toolbar` 移除了 `position: sticky` 相关样式，改为 `flex-shrink: 0`
- [x] `.view-content` 已设为 `flex: 1; overflow-y: auto; min-height: 0;`
- [x] 冻结区域底部有视觉分隔（margin-bottom 间距）
- [x] 响应式规则已从 `.main-content` 修正为 `#view-container`，避免双重 padding
- [ ] 提示词列表视图：标题和工具栏固定，列表独立滚动，滚动条在右侧（需用户验证）
- [ ] 提示词卡片视图：同上效果（需用户验证）
- [ ] 技能列表视图：标题和工具栏固定，列表独立滚动，滚动条在右侧（需用户验证）
- [ ] 技能卡片视图：同上效果（需用户验证）
- [ ] 仪表盘视图正常显示（需用户验证）
- [ ] 设置视图正常显示（需用户验证）
- [ ] 数据管理视图正常显示（需用户验证）
