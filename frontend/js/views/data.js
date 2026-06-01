/**
 * DataView - 数据管理视图
 * 提供数据统计、备份恢复和孤立数据清理功能
 */
const DataView = {

    orphanCount: 0,

    async render(container) {
        if (!this._template) {
            const resp = await fetch('html/data.html');
            this._template = await resp.text();
        }
        container.innerHTML = this._template;
        this.bindEvents(container);
        this.loadStats();
        this.loadBackupStatus();
        this.loadOrphanStatus(container);
    },

    async loadStats() {
        try {
            const stats = await API.getDataStats();
            document.getElementById('stat-prompt-count').textContent = stats.prompt_count;
            document.getElementById('stat-skill-count').textContent = stats.skill_count;
            document.getElementById('stat-db-size').textContent = DataView.formatSize(stats.db_size);
        } catch (err) {
            // 错误已由 API.call 处理
        }
    },

    async loadBackupStatus() {
        try {
            const info = await API.quickBackupInfo();
            const statusEl = document.getElementById('quick-backup-status');
            const restoreBtn = document.getElementById('quick-restore-btn');
            if (!statusEl) return;

            if (info.exists) {
                const size = DataView.formatSize(info.file_size);
                statusEl.innerHTML = `<span style="color: var(--success);">✓ 已有备份</span> — ${info.backup_time}，${size}`;
                if (restoreBtn) restoreBtn.disabled = false;
            } else {
                statusEl.innerHTML = `<span style="color: var(--danger);">暂无本地备份</span>`;
                if (restoreBtn) restoreBtn.disabled = true;
            }
        } catch (err) {
            const statusEl = document.getElementById('quick-backup-status');
            if (statusEl) statusEl.textContent = '检测备份状态失败';
        }
    },

    async loadOrphanStatus(container) {
        try {
            const orphans = await API.getOrphanSkills();
            this.orphanCount = orphans.length;
            const statusEl = document.getElementById('orphan-status');
            const btn = document.getElementById('cleanup-orphan-btn');
            if (orphans.length === 0) {
                statusEl.textContent = '数据完整，无需清理';
                statusEl.style.color = 'var(--text-secondary)';
                if (btn) btn.style.display = 'none';
            } else {
                statusEl.textContent = `发现 ${orphans.length} 个孤立技能（文件已删除，数据库记录残留）`;
                statusEl.style.color = 'var(--danger)';
                if (btn) btn.style.display = 'inline-flex';
            }
        } catch (err) {
            const statusEl = document.getElementById('orphan-status');
            if (statusEl) statusEl.textContent = '检测失败';
        }
    },

    bindEvents(container) {
        container.querySelector('#quick-backup-btn').addEventListener('click', async () => {
            try {
                await API.quickBackup();
                Toast.success('一键备份成功');
                this.loadBackupStatus();
            } catch (err) {
                // 错误已由 API.call 处理
            }
        });

        container.querySelector('#quick-restore-btn').addEventListener('click', async () => {
            const confirmed = await Confirm.show('将从本地备份恢复数据，同名记录会被跳过。确定继续吗？', { confirmText: '确定恢复', type: 'danger' });
            if (!confirmed) return;

            try {
                const result = await API.quickRestore();
                Toast.success(`恢复完成：${result.prompts_restored} 条提示词，${result.skills_restored} 个技能已恢复`);
                this.loadStats();
            } catch (err) {
                // 错误已由 API.call 处理
            }
        });

        container.querySelector('#backup-data-btn').addEventListener('click', async () => {
            try {
                const savePath = await API.saveZIPFileDialog('psm-backup.zip');
                if (!savePath) return;
                await API.backupData(savePath);
                Toast.success('备份成功');
            } catch (err) {
                // 错误已由 API.call 处理
            }
        });

        container.querySelector('#restore-data-btn').addEventListener('click', async () => {
            const confirmed = await Confirm.show('恢复数据将覆盖当前设置，同名的提示词和技能会被跳过。确定继续吗？', { confirmText: '确定', type: 'danger' });
            if (!confirmed) return;

            try {
                const zipPath = await API.openZIPFileDialog();
                if (!zipPath) return;
                const result = await API.restoreData(zipPath);
                Toast.success(`恢复完成：${result.prompts_restored} 条提示词，${result.skills_restored} 个技能已恢复`);
                this.loadStats();
            } catch (err) {
                // 错误已由 API.call 处理
            }
        });

        container.querySelector('#cleanup-orphan-btn').addEventListener('click', async () => {
            const confirmed = await Confirm.show(`确定要清理 ${this.orphanCount} 个孤立技能记录吗？此操作不可撤销。`, { confirmText: '确定清理', type: 'danger' });
            if (!confirmed) return;

            try {
                const count = await API.cleanupOrphanSkills();
                Toast.success(`已清理 ${count} 个孤立技能记录`);
                this.loadStats();
                this.loadOrphanStatus(container);
            } catch (err) {
                // 错误已由 API.call 处理
            }
        });

        container.querySelector('#reset-all-btn').addEventListener('click', async () => {
            const confirmed1 = await Confirm.show(
                '⚠️ 警告：此操作将清空所有提示词和技能数据，并删除技能文件！\n\n建议先导出备份。确定继续吗？',
                { confirmText: '继续重置', type: 'danger' }
            );
            if (!confirmed1) return;

            const confirmed2 = await Confirm.show(
                '最后确认：所有数据将被永久删除且无法恢复！',
                { confirmText: '确定删除', type: 'danger' }
            );
            if (!confirmed2) return;

            try {
                const result = await API.resetAllData();
                Toast.success(`重置完成：已删除 ${result.prompts_deleted} 条提示词、${result.skills_deleted} 个技能`);
                this.loadStats();
                this.loadOrphanStatus(container);
            } catch (err) {
                // 错误已由 API.call 处理
            }
        });
    },

    formatSize(bytes) {
        if (bytes === 0) return '0 B';
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }
};
