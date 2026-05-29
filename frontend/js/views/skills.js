/**
 * Skill 管理视图组件
 * 提供 Skill 的增删改查功能，所有图标使用内联 SVG
 */
const SkillsView = {
    currentKeyword: '',

    /**
     * 渲染 Skill 管理视图
     * @param {HTMLElement} container - 容器元素
     */
    async render(container) {
        container.innerHTML = `
            <div class="page-header">
                <h2 class="page-title">Skill 管理</h2>
            </div>
            <div class="card">
                <div class="card-header">
                    <div class="toolbar">
                        <div class="toolbar-left">
                            <div class="search-box">
                                <input type="text" id="skill-search" placeholder="搜索 Skill..." />
                            </div>
                        </div>
                        <div class="toolbar-right">
                            <button class="btn btn-primary" id="add-skill-btn">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                                    <line x1="12" y1="5" x2="12" y2="19"/>
                                    <line x1="5" y1="12" x2="19" y2="12"/>
                                </svg>
                                新建 Skill
                            </button>
                            <button class="btn btn-default" id="import-skill-btn">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                    <polyline points="17 8 12 3 7 8"/>
                                    <line x1="12" y1="3" x2="12" y2="15"/>
                                </svg>
                                导入
                            </button>
                            <button class="btn btn-default" id="export-skill-btn">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                    <polyline points="7 10 12 15 17 10"/>
                                    <line x1="12" y1="15" x2="12" y2="3"/>
                                </svg>
                                导出
                            </button>
                        </div>
                    </div>
                </div>
                <div class="card-body">
                    <div id="skill-list">
                        <div class="loading">加载中...</div>
                    </div>
                </div>
            </div>
        `;

        await this.loadSkills();
        this.bindEvents();
    },

    /**
     * 加载 Skill 列表并渲染表格
     */
    async loadSkills() {
        const listEl = document.getElementById('skill-list');
        listEl.innerHTML = '<div class="loading">加载中...</div>';

        try {
            let skills = await API.getSkills();

            if (SkillsView.currentKeyword) {
                skills = skills.filter(s =>
                    (s.name && s.name.toLowerCase().includes(SkillsView.currentKeyword)) ||
                    (s.description && s.description.toLowerCase().includes(SkillsView.currentKeyword))
                );
            }

            if (skills.length === 0) {
                listEl.innerHTML = `
                    <div class="empty-state">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" style="opacity: 0.3; margin-bottom: 12px;">
                            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
                        </svg>
                        <div class="empty-state-text">暂无 Skill</div>
                        <div class="empty-state-hint">点击"新建 Skill"添加第一条</div>
                    </div>`;
                return;
            }

            let html = '<div class="table-container"><table class="table"><thead><tr><th>名称</th><th>描述</th><th>版本</th><th>更新时间</th><th>操作</th></tr></thead><tbody>';

            skills.forEach(s => {
                const desc = s.description ? (s.description.length > 50 ? s.description.substring(0, 50) + '...' : s.description) : '-';
                const time = new Date(s.updated_at).toLocaleString('zh-CN');
                html += `
                    <tr>
                        <td><strong>${escapeHtml(s.name)}</strong></td>
                        <td class="text-secondary">${escapeHtml(desc)}</td>
                        <td>${escapeHtml(s.version || '-')}</td>
                        <td>${time}</td>
                        <td>
                            <div class="flex gap-8">
                                <button class="btn btn-sm btn-primary view-skill-btn" data-id="${s.id}">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                        <circle cx="12" cy="12" r="3"/>
                                    </svg>
                                    查看
                                </button>
                                <button class="btn btn-sm btn-default edit-skill-btn" data-id="${s.id}">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                    </svg>
                                    编辑
                                </button>
                                <button class="btn btn-sm btn-danger delete-skill-btn" data-id="${s.id}">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                                        <polyline points="3 6 5 6 21 6"/>
                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                                        <line x1="10" y1="11" x2="10" y2="17"/>
                                        <line x1="14" y1="11" x2="14" y2="17"/>
                                    </svg>
                                    删除
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            });

            html += '</tbody></table></div>';
            listEl.innerHTML = html;

            listEl.querySelectorAll('.view-skill-btn').forEach(btn => {
                btn.addEventListener('click', () => this.viewSkill(btn.dataset.id));
            });

            listEl.querySelectorAll('.edit-skill-btn').forEach(btn => {
                btn.addEventListener('click', () => this.openEditModal(btn.dataset.id));
            });

            listEl.querySelectorAll('.delete-skill-btn').forEach(btn => {
                btn.addEventListener('click', () => this.handleDelete(btn.dataset.id));
            });
        } catch (err) {
            listEl.innerHTML = `<div class="empty-state">加载失败: ${escapeHtml(err.message)}</div>`;
        }
    },

    /**
     * 绑定搜索、新建、导入、导出事件
     */
    bindEvents() {
        document.getElementById('skill-search').addEventListener('input', (e) => {
            SkillsView.currentKeyword = e.target.value.toLowerCase();
            this.loadSkills();
        });

        document.getElementById('add-skill-btn').addEventListener('click', () => this.openCreateModal());

        document.getElementById('import-skill-btn').addEventListener('click', async () => {
            try {
                const filePath = await API.openZIPFileDialog();
                if (!filePath) return;
                const skill = await API.importSkill(filePath);
                Toast.success(`导入成功：${skill.name}`);
                await this.loadSkills();
            } catch (err) {
                // 错误已由 API.call 处理
            }
        });

        document.getElementById('export-skill-btn').addEventListener('click', async () => {
            try {
                const filePath = await API.saveZIPFileDialog('skills.zip');
                if (!filePath) return;
                const skills = await API.getSkills();
                for (const skill of skills) {
                    const skillZipPath = filePath.replace('.zip', `_${skill.name}.zip`);
                    await API.exportSkill(skill.id, skillZipPath);
                }
                Toast.success(`导出成功：共 ${skills.length} 个 Skill`);
            } catch (err) {
                // 错误已由 API.call 处理
            }
        });
    },

    /**
     * 打开新建 Skill 模态框
     */
    openCreateModal() {
        const content = `
            <form id="skill-form">
                <div class="form-group">
                    <label class="form-label">名称 *</label>
                    <input type="text" class="form-input" id="skill-name" required />
                </div>
                <div class="form-group">
                    <label class="form-label">描述</label>
                    <textarea class="form-textarea" id="skill-description" rows="3"></textarea>
                </div>
                <div class="form-group">
                    <label class="form-label">版本</label>
                    <input type="text" class="form-input" id="skill-version" placeholder="v1.0.0" />
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-default" onclick="Modal.close()">取消</button>
                    <button type="submit" class="btn btn-primary">保存</button>
                </div>
            </form>
        `;

        Modal.open('新建 Skill', content);

        document.getElementById('skill-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('skill-name').value.trim();
            const description = document.getElementById('skill-description').value.trim();
            const version = document.getElementById('skill-version').value.trim();

            try {
                await API.createSkill(name, description, version);
                Toast.success('创建成功');
                Modal.close();
                await this.loadSkills();
            } catch (err) {
                // 错误已由 API.call 处理
            }
        });
    },

    /**
     * 打开编辑 Skill 模态框
     * @param {string} id - Skill ID
     */
    async openEditModal(id) {
        try {
            const skill = await API.getSkill(id);

            const content = `
                <form id="skill-form">
                    <div class="form-group">
                        <label class="form-label">名称 *</label>
                        <input type="text" class="form-input" id="skill-name" value="${escapeHtml(skill.name)}" required />
                    </div>
                    <div class="form-group">
                        <label class="form-label">描述</label>
                        <textarea class="form-textarea" id="skill-description" rows="3">${escapeHtml(skill.description || '')}</textarea>
                    </div>
                    <div class="form-group">
                        <label class="form-label">版本</label>
                        <input type="text" class="form-input" id="skill-version" value="${escapeHtml(skill.version || '')}" />
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn btn-default" onclick="Modal.close()">取消</button>
                        <button type="submit" class="btn btn-primary">保存</button>
                    </div>
                </form>
            `;

            Modal.open('编辑 Skill', content);

            document.getElementById('skill-form').addEventListener('submit', async (e) => {
                e.preventDefault();
                const name = document.getElementById('skill-name').value.trim();
                const description = document.getElementById('skill-description').value.trim();
                const version = document.getElementById('skill-version').value.trim();

                try {
                    await API.updateSkill(id, name, description, version);
                    Toast.success('更新成功');
                    Modal.close();
                    await this.loadSkills();
                } catch (err) {
                    // 错误已由 API.call 处理
                }
            });
        } catch (err) {
            Toast.error('获取 Skill 详情失败');
        }
    },

    /**
     * 查看 Skill 详情（包括文件列表）
     * @param {string} id - Skill ID
     */
    async viewSkill(id) {
        try {
            const skill = await API.getSkill(id);
            const files = await API.listSkillFiles(id);

            let filesHtml = '<div class="mt-16"><h4>文件列表</h4>';
            if (files.length === 0) {
                filesHtml += '<p class="text-secondary mt-8">暂无文件</p>';
            } else {
                filesHtml += '<div class="table-container mt-8"><table class="table"><thead><tr><th>名称</th><th>类型</th><th>大小</th><th>修改时间</th></tr></thead><tbody>';
                files.forEach(f => {
                    const size = f.is_dir ? '-' : (f.size > 1024 ? (f.size / 1024).toFixed(1) + ' KB' : f.size + ' B');
                    const typeLabel = f.is_dir
                        ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 4px;"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg> 目录`
                        : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 4px;"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg> 文件`;
                    filesHtml += `<tr><td>${escapeHtml(f.name)}</td><td>${typeLabel}</td><td>${size}</td><td>${f.mod_time}</td></tr>`;
                });
                filesHtml += '</tbody></table></div>';
            }
            filesHtml += '</div>';

            const content = `
                <div>
                    <div class="form-group">
                        <label class="form-label">名称</label>
                        <div>${escapeHtml(skill.name)}</div>
                    </div>
                    <div class="form-group">
                        <label class="form-label">描述</label>
                        <div>${escapeHtml(skill.description || '-')}</div>
                    </div>
                    <div class="form-group">
                        <label class="form-label">版本</label>
                        <div>${escapeHtml(skill.version || '-')}</div>
                    </div>
                    <div class="form-group">
                        <label class="form-label">创建时间</label>
                        <div>${new Date(skill.created_at).toLocaleString('zh-CN')}</div>
                    </div>
                    <div class="form-group">
                        <label class="form-label">更新时间</label>
                        <div>${new Date(skill.updated_at).toLocaleString('zh-CN')}</div>
                    </div>
                    ${filesHtml}
                </div>
            `;

            Modal.open('Skill 详情', content, { width: '500px' });
        } catch (err) {
            Toast.error('获取 Skill 详情失败');
        }
    },

    /**
     * 处理删除 Skill 操作
     * @param {string} id - Skill ID
     */
    async handleDelete(id) {
        const confirmed = await Confirm.danger('确定要删除这个 Skill 吗？此操作不可恢复。');
        if (confirmed) {
            try {
                await API.deleteSkill(id, true);
                Toast.success('删除成功');
                await this.loadSkills();
            } catch (err) {
                // 错误已由 API.call 处理
            }
        }
    }
};