/**
 * DataView - 数据管理视图
 * 提供数据统计、备份恢复和孤立数据清理功能
 */
const DataView = {

    orphanCount: 0,

    async render(container) {
        container.innerHTML = `
            <div class="page-header">
                <h2 class="page-title">数据管理</h2>
                <p class="page-subtitle">查看数据概况、备份恢复和清理孤立数据</p>
            </div>
            <div class="view-content">
                <div class="data-stats" id="data-stats">
                    <div class="data-stat-item">
                        <div class="data-stat-value" id="stat-prompt-count">-</div>
                        <div class="data-stat-label">提示词</div>
                    </div>
                    <div class="data-stat-item">
                        <div class="data-stat-value" id="stat-skill-count">-</div>
                        <div class="data-stat-label">技能</div>
                    </div>
                    <div class="data-stat-item">
                        <div class="data-stat-value" id="stat-db-size">-</div>
                        <div class="data-stat-label">数据库大小</div>
                    </div>
                </div>
                <div class="grid grid-3">
                    <div class="card">
                        <div class="card-header">
                            <h3 class="card-title">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                    <polyline points="7 10 12 15 17 10"/>
                                    <line x1="12" y1="15" x2="12" y2="3"/>
                                </svg>
                                导出数据
                            </h3>
                        </div>
                        <div class="card-body">
                            <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: var(--spacing-3);">
                                将所有设置、提示词和技能（含文件）打包为 ZIP 文件。
                            </p>
                            <button class="btn btn-primary" id="backup-data-btn">导出备份</button>
                        </div>
                    </div>

                    <div class="card">
                        <div class="card-header">
                            <h3 class="card-title">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                    <polyline points="17 8 12 3 7 8"/>
                                    <line x1="12" y1="3" x2="12" y2="15"/>
                                </svg>
                                导入数据
                            </h3>
                        </div>
                        <div class="card-body">
                            <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: var(--spacing-3);">
                                从备份文件恢复数据。同名记录会被跳过。
                            </p>
                            <button class="btn btn-default" id="restore-data-btn">导入恢复</button>
                        </div>
                    </div>

                    <div class="card">
                        <div class="card-header">
                            <h3 class="card-title">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                                </svg>
                                清理数据
                            </h3>
                        </div>
                        <div class="card-body">
                            <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: var(--spacing-3);">
                                检测并清理数据库中文件已不存在的孤立技能记录。
                            </p>
                            <div id="orphan-status" style="font-size: 13px; color: var(--text-secondary); margin-bottom: var(--spacing-3);">检测中...</div>
                            <button class="btn btn-danger" id="cleanup-orphan-btn" style="display:none">清理孤立数据</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.bindEvents(container);
        this.loadStats();
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
    },

    formatSize(bytes) {
        if (bytes === 0) return '0 B';
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }
};
