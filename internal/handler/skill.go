package handler

import (
	"psm/internal/db"
	"psm/internal/service"
	"psm/internal/utils"
	"strings"
)

// SkillHandler 处理 Skill 相关的方法，嵌入到 App 结构体
type SkillHandler struct {
	skillSvc *service.SkillService
}

// Init 初始化 SkillHandler
func (h *SkillHandler) Init(skillSvc *service.SkillService) {
	h.skillSvc = skillSvc
}

// CreateSkill 创建空 Skill
func (h *SkillHandler) CreateSkill(name, description string) (*db.Skill, error) {
	return h.skillSvc.CreateSkill(name, description)
}

// GetSkill 根据 ID 获取 Skill
func (h *SkillHandler) GetSkill(id int64) (*db.Skill, error) {
	return h.skillSvc.GetSkill(id)
}

// GetSkills 获取所有 Skill 列表
func (h *SkillHandler) GetSkills() ([]db.Skill, error) {
	return h.skillSvc.GetSkills()
}

// UpdateSkill 更新 Skill 元数据，同时同步 SKILL.md 文件
func (h *SkillHandler) UpdateSkill(id int64, name, description string) error {
	return h.skillSvc.UpdateSkill(id, name, description)
}

// DeleteSkill 删除 Skill
func (h *SkillHandler) DeleteSkill(id int64, deleteFiles bool) error {
	return h.skillSvc.DeleteSkill(id, deleteFiles)
}

// BatchDeleteSkills 批量删除多个 Skill
func (h *SkillHandler) BatchDeleteSkills(ids []int64, deleteFiles bool) (int64, error) {
	return h.skillSvc.BatchDeleteSkills(ids, deleteFiles)
}

// ImportSkill 从 ZIP 文件导入 Skill
func (h *SkillHandler) ImportSkill(zipPath string) (*db.Skill, error) {
	return h.skillSvc.ImportSkill(zipPath)
}

// BatchImportSkills 批量导入多个 Skill ZIP 文件
func (h *SkillHandler) BatchImportSkills(zipPaths []string) (*db.ImportResult, error) {
	return h.skillSvc.BatchImportSkills(zipPaths)
}

// ExportSkill 导出 Skill 为 ZIP 文件
func (h *SkillHandler) ExportSkill(id int64, zipPath string) error {
	return h.skillSvc.ExportSkill(id, zipPath)
}

// ExportSkills 批量导出 Skill 为 ZIP 文件
func (h *SkillHandler) ExportSkills(skillIds []int64, savePath string) error {
	return h.skillSvc.ExportSkillsToZip(skillIds, savePath)
}

// ImportSkillAuto 自动识别 ZIP 格式并导入 Skill
func (h *SkillHandler) ImportSkillAuto(zipPath string) (*db.ImportResult, error) {
	hasMarker, _ := utils.HasExportMarker(zipPath)
	if hasMarker {
		return h.skillSvc.ImportSkillFromExportZip(zipPath)
	}

	_, err := h.skillSvc.ImportSkill(zipPath)
	if err != nil {
		errMsg := err.Error()
		if strings.Contains(errMsg, "已存在") {
			return &db.ImportResult{Skipped: 1}, nil
		}
		return nil, err
	}
	return &db.ImportResult{Success: 1}, nil
}

// ListSkillFiles 列出 Skill 目录下的文件
func (h *SkillHandler) ListSkillFiles(id int64) ([]db.SkillFile, error) {
	return h.skillSvc.ListSkillFiles(id)
}

// GetRecentSkills 获取最近修改的 Skill 列表
func (h *SkillHandler) GetRecentSkills(limit int) ([]db.Skill, error) {
	return h.skillSvc.GetRecentSkills(limit)
}

// CountSkills 统计 Skill 总数
func (h *SkillHandler) CountSkills() (int64, error) {
	return h.skillSvc.CountSkills()
}

// TogglePinSkill 切换 Skill 的置顶状态
func (h *SkillHandler) TogglePinSkill(id int64) error {
	return h.skillSvc.TogglePinSkill(id)
}

// GetPinnedSkills 获取置顶的 Skill 列表
func (h *SkillHandler) GetPinnedSkills(limit int) ([]db.Skill, error) {
	return h.skillSvc.GetPinnedSkills(limit)
}
