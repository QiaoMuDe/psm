/**
 * 仪表盘视图组件
 * 显示应用概览和统计数据
 */
const DashboardView = {
    /**
     * 渲染仪表盘视图
     * @param {HTMLElement} container - 容器元素
     */
    async render(container) {
        container.innerHTML = `
            <div class="page-header">
                <h2 class="page-title">仪表盘</h2>
            </div>
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon stat-icon-blue">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                        </svg>
                    </div>
                    <div class="stat-info">
                        <div class="stat-value" id="prompt-count">0</div>
                        <div class="stat-label">Prompt 数量</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon stat-icon-teal">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
                        </svg>
                    </div>
                    <div class="stat-info">
                        <div class="stat-value" id="skill-count">0</div>
                        <div class="stat-label">Skill 数量</div>
                    </div>
                </div>
            </div>
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">最近更新</h3>
                </div>
                <div class="card-body">
                    <div id="recent-items">
                        <div class="empty-state">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" style="opacity: 0.3; margin-bottom: 12px;">
                                <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
                                <polyline points="13 2 13 9 20 9"/>
                            </svg>
                            <div class="empty-state-text">暂无数据</div>
                            <div class="empty-state-hint">添加一些 Prompt 或 Skill 开始使用吧</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        try {
            const [promptCount, skillCount, recentPrompts, recentSkills] = await Promise.all([
                API.countPrompts(),
                API.countSkills(),
                API.getRecentPrompts(5),
                API.getRecentSkills(5)
            ]);
            document.getElementById('prompt-count').textContent = promptCount;
            document.getElementById('skill-count').textContent = skillCount;
            const recentItems = document.getElementById('recent-items');
            if ((!recentPrompts || recentPrompts.length === 0) && (!recentSkills || recentSkills.length === 0)) {
                return;
            }
            let html = '<div class="table-container"><table class="table"><thead><tr><th>名称</th><th>类型</th><th>更新时间</th></tr></thead><tbody>';
            (recentPrompts || []).forEach(p => {
                const time = new Date(p.updated_at).toLocaleString('zh-CN');
                html += `<tr><td><strong>${escapeHtml(p.name)}</strong></td><td><span class="tag tag-blue">Prompt</span></td><td class="text-secondary">${time}</td></tr>`;
            });
            (recentSkills || []).forEach(s => {
                const time = new Date(s.updated_at).toLocaleString('zh-CN');
                html += `<tr><td><strong>${escapeHtml(s.name)}</strong></td><td><span class="tag tag-teal">Skill</span></td><td class="text-secondary">${time}</td></tr>`;
            });
            html += '</tbody></table></div>';
            recentItems.innerHTML = html;
        } catch (err) {
            console.error('加载仪表盘数据失败:', err);
        }
    }
};

