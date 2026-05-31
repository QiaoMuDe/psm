/**
 * Wails 绑定调用封装层
 * 统一处理所有与 Go 后端的通信
 */
const API = {
    /**
     * 安全调用 Wails 绑定方法，统一错误处理
     * @param {Function} fn - Wails 绑定的方法
     * @param {Array} args - 参数列表
     * @returns {Promise<any>}
     */
    async call(fn, ...args) {
        try {
            return await fn(...args);
        } catch (err) {
            Toast.error(err?.message || err || '操作失败');
            throw err;
        }
    },

    // ===== 设置 API =====
    getSettings: () => API.call(window.go.main.App.GetSettings),
    updateSetting: (key, value) => API.call(window.go.main.App.UpdateSetting, key, value),
    updateSettings: (settings) => API.call(window.go.main.App.UpdateSettings, settings),
    getSkillStoragePath: () => API.call(window.go.main.App.GetSkillStoragePath),
    getSystemFonts: () => API.call(window.go.main.App.GetSystemFonts),
    revealInExplorer: (path) => API.call(window.go.main.App.RevealInExplorer, path),
    openFile: (path) => API.call(window.go.main.App.OpenFile, path),
    getVersion: () => API.call(window.go.main.App.GetVersion),
    getDataStats: () => API.call(window.go.main.App.GetDataStats),
    getOrphanSkills: () => API.call(window.go.main.App.GetOrphanSkills),
    cleanupOrphanSkills: () => API.call(window.go.main.App.CleanupOrphanSkills),
    resetAllData: () => API.call(window.go.main.App.ResetAllData),

    // ===== Prompt API =====
    createPrompt: (name, content, category, tags, isTemplate) => API.call(window.go.main.App.CreatePrompt, name, content, category, tags, isTemplate),
    getPrompt: (id) => API.call(window.go.main.App.GetPrompt, Number(id)),
    getPrompts: (keyword, category) => API.call(window.go.main.App.GetPrompts, keyword, category),
    updatePrompt: (id, name, content, category, tags, isTemplate) => API.call(window.go.main.App.UpdatePrompt, Number(id), name, content, category, tags, isTemplate),
    deletePrompt: (id) => API.call(window.go.main.App.DeletePrompt, Number(id)),
    batchDeletePrompts: (ids) => API.call(window.go.main.App.BatchDeletePrompts, ids.map(Number)),
    getCategories: () => API.call(window.go.main.App.GetCategories),
    exportPrompts: (ids, filePath) => API.call(window.go.main.App.ExportPrompts, ids, filePath),
    importPrompts: (filePath) => API.call(window.go.main.App.ImportPrompts, filePath),
    getRecentPrompts: (limit) => API.call(window.go.main.App.GetRecentPrompts, limit),
    countPrompts: () => API.call(window.go.main.App.CountPrompts),
    togglePinPrompt: (id) => API.call(window.go.main.App.TogglePinPrompt, Number(id)),
    getPinnedPrompts: (limit = 3) => API.call(window.go.main.App.GetPinnedPrompts, limit),

    // ===== Skill API =====
    createSkill: (name, description) => API.call(window.go.main.App.CreateSkill, name, description),
    getSkill: (id) => API.call(window.go.main.App.GetSkill, Number(id)),
    getSkills: () => API.call(window.go.main.App.GetSkills),
    updateSkill: (id, name, description) => API.call(window.go.main.App.UpdateSkill, Number(id), name, description),
    deleteSkill: (id, deleteFiles) => API.call(window.go.main.App.DeleteSkill, Number(id), deleteFiles),
    batchDeleteSkills: (ids, deleteFiles) => API.call(window.go.main.App.BatchDeleteSkills, ids.map(Number), deleteFiles),
    importSkill: (zipPath) => API.call(window.go.main.App.ImportSkill, zipPath),
    importSkillAuto: (zipPath) => API.call(window.go.main.App.ImportSkillAuto, zipPath),
    exportSkill: (id, zipPath) => API.call(window.go.main.App.ExportSkill, Number(id), zipPath),
    exportSkills: (ids, savePath) => API.call(window.go.main.App.ExportSkills, ids, savePath),
    listSkillFiles: (id) => API.call(window.go.main.App.ListSkillFiles, Number(id)),
    getRecentSkills: (limit) => API.call(window.go.main.App.GetRecentSkills, limit),
    countSkills: () => API.call(window.go.main.App.CountSkills),
    togglePinSkill: (id) => API.call(window.go.main.App.TogglePinSkill, Number(id)),
    getPinnedSkills: (limit = 3) => API.call(window.go.main.App.GetPinnedSkills, limit),
    batchImportSkills: (zipPaths) => API.call(window.go.main.App.BatchImportSkills, zipPaths),

    // ===== 备份恢复 API =====
    backupData: (savePath) => API.call(window.go.main.App.BackupData, savePath),
    restoreData: (zipPath) => API.call(window.go.main.App.RestoreData, zipPath),
    quickBackupInfo: () => API.call(window.go.main.App.QuickBackupInfo),
    quickBackup: () => API.call(window.go.main.App.QuickBackup),
    quickRestore: () => API.call(window.go.main.App.QuickRestore),
    openDataDirectory: () => API.call(window.go.main.App.OpenDataDirectory),

    // ===== 文件对话框 API =====
    openFileDialog: (filter) => API.call(window.go.main.App.OpenFileDialog, filter),
    openZIPFileDialog: () => API.call(window.go.main.App.OpenZIPFileDialog),
    openMultiZIPFileDialog: () => API.call(window.go.main.App.OpenMultiZIPFileDialog),
    openJSONFileDialog: () => API.call(window.go.main.App.OpenJSONFileDialog),
    saveFileDialog: (filename) => API.call(window.go.main.App.SaveFileDialog, filename),
    saveZIPFileDialog: (filename) => API.call(window.go.main.App.SaveZIPFileDialog, filename),
    saveJSONFileDialog: (filename) => API.call(window.go.main.App.SaveJSONFileDialog, filename),
    selectDirectoryDialog: () => API.call(window.go.main.App.SelectDirectoryDialog),
};