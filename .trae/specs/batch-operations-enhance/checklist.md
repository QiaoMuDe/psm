# Checklist

## 后端 Service 层
- [x] PromptService.BatchUpdateCategory 方法存在且使用 GORM 批量 Update
- [x] PromptService.BatchAddTags 方法存在，逐条读取→合并去重→写回
- [x] PromptService.BatchRemoveTags 方法存在，逐条读取→过滤移除→写回
- [x] PromptService.BatchSetPin 方法存在且使用 GORM 批量 Update
- [x] SkillService.BatchAddTags 方法存在且逻辑与 Prompt 版本一致
- [x] SkillService.BatchRemoveTags 方法存在且逻辑与 Prompt 版本一致
- [x] SkillService.BatchSetPin 方法存在且使用 GORM 批量 Update

## 后端 Handler 层
- [x] PromptHandler 暴露 BatchUpdateCategory、BatchAddTags、BatchRemoveTags、BatchSetPin 方法
- [x] SkillHandler 暴露 BatchAddSkillTags、BatchRemoveSkillTags、BatchSetPinSkill 方法

## 前端 API 层
- [x] api.js 包含 batchUpdateCategory 方法
- [x] api.js 包含 batchAddPromptTags 和 batchRemovePromptTags 方法
- [x] api.js 包含 batchSetPinPrompt 方法
- [x] api.js 包含 batchAddSkillTags 和 batchRemoveSkillTags 方法
- [x] api.js 包含 batchSetPinSkill 方法

## 前端下拉菜单组件
- [x] dropdown-menu.js 组件存在，支持 show/hide/定位/点击外部关闭
- [x] index.html 已引入 dropdown-menu.js

## 前端提示词模块
- [x] batch-bar 包含"更多操作"下拉按钮
- [x] 下拉菜单包含"修改分类"选项（仅提示词模块）
- [x] 下拉菜单包含"添加标签"选项
- [x] 下拉菜单包含"移除标签"选项
- [x] 下拉菜单包含"置顶"和"取消置顶"选项
- [x] 点击"修改分类"弹出 Modal，支持输入或选择分类
- [x] 点击"添加标签"弹出 Modal，支持输入标签（逗号分隔）
- [x] 点击"移除标签"弹出 Modal，显示已有标签供选择移除
- [x] 点击"置顶"/"取消置顶"直接执行，无需弹窗
- [x] 未选中任何项目时点击菜单项显示提示
- [x] 退出批量管理时下拉菜单自动关闭

## 前端技能模块
- [x] batch-bar 包含"更多操作"下拉按钮
- [x] 下拉菜单包含"添加标签"选项
- [x] 下拉菜单包含"移除标签"选项
- [x] 下拉菜单包含"置顶"和"取消置顶"选项
- [x] 点击"添加标签"弹出 Modal，支持输入标签
- [x] 点击"移除标签"弹出 Modal，显示已有标签供选择移除
- [x] 点击"置顶"/"取消置顶"直接执行，无需弹窗
- [x] 退出批量管理时下拉菜单自动关闭

## 编译与代码质量
- [x] `go build ./...` 编译通过
- [x] `golangci-lint run ./...` 无告警
