/**
 * DataView - 数据管理视图
 * 提供完整的数据备份（导出）和恢复（导入）功能
 */
const DataView = {

    /**
     * 渲染数据导入导出视图
     * @param {HTMLElement} container - 容器元素
     */
    async render(container) {
        container.innerHTML = `
            <div class="page-header">
                <h2 class="page-title">数据管理</h2>
                <p class="page-subtitle">备份和恢复所有应用数据，方便跨设备迁移</p>
            </div>
            <div class="view-content">
                <div class="grid grid-2">
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
                                将所有设置、提示词和技能（含文件）打包为一个 ZIP 文件，可在其他电脑上恢复使用。
                            </p>
                            <div style="background: var(--bg-page); border: 1px solid var(--border); border-radius: var(--radius); padding: var(--spacing-2); margin-bottom: var(--spacing-3);">
                                <p style="font-size: 12px; color: var(--text-secondary); margin: 0;">
                                    <strong>备份内容：</strong>系统设置、所有提示词、所有技能（含文件）
                                </p>
                            </div>
                            <button class="btn btn-primary" id="backup-data-btn">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                    <polyline points="7 10 12 15 17 10"/>
                                    <line x1="12" y1="15" x2="12" y2="3"/>
                                </svg>
                                导出备份
                            </button>
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
                                从备份文件恢复所有数据。同名的提示词和技能会被跳过，不会重复导入。
                            </p>
                            <div style="background: var(--bg-page); border: 1px solid var(--border); border-radius: var(--radius); padding: var(--spacing-2); margin-bottom: var(--spacing-3);">
                                <p style="font-size: 12px; color: var(--text-secondary); margin: 0;">
                                    <strong>注意事项：</strong>恢复会覆盖当前系统设置（主题等），Skill 存储路径不受影响
                                </p>
                            </div>
                            <button class="btn btn-default" id="restore-data-btn">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                    <polyline points="17 8 12 3 7 8"/>
                                    <line x1="12" y1="3" x2="12" y2="15"/>
                                </svg>
                                导入恢复
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.bindEvents(container);
    },

    /**
     * 绑定数据导入导出事件
     * @param {HTMLElement} container - 容器元素
     */
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
            } catch (err) {
                // 错误已由 API.call 处理
            }
        });
    }
};
