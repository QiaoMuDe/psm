/**
 * Skill 管理视图组件
 * 提供 Skill 的增删改查功能，支持列表/卡片视图切换，所有图标使用内联 SVG
 */
const SkillsView = {
    currentKeyword: '',
    currentView: App.settings.skill_view_mode || 'list',
    selectedIds: new Set(),
    allSkills: [],
    batchMode: false,

    /**
     * 渲染 Skill 管理视图
     * @param {HTMLElement} container - 容器元素
     */
    async render(container) {
        container.innerHTML = `
            <div class="page-header">
                <h2 class="page-title">Skill 管理</h2>
            </div>
            <div class="card view-toolbar">
                <div class="card-header">
                    <div class="toolbar">
                        <div class="toolbar-left">
                            <div class="search-box">
                                <input type="text" id="skill-search" placeholder="搜索 Skill..." />
                            </div>
                        </div>
                        <div class="toolbar-right">
                            <div class="view-toggle">
                                <button class="view-toggle-btn${this.currentView === 'list' ? ' active' : ''}" data-view="list" title="列表视图">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
                                        <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
                                    </svg>
                                </button>
                                <button class="view-toggle-btn${this.currentView === 'card' ? ' active' : ''}" data-view="card" title="卡片视图">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
                                        <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
                                    </svg>
                                </button>
                            </div>
                            <div class="toolbar-separator"></div>
                            <div class="action-buttons">
                                <button class="btn btn-default btn-sm" id="batch-manage-skill-btn">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                                    批量管理
                                </button>
                                <button class="btn btn-default btn-sm" id="import-skill-btn">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                        <polyline points="17 8 12 3 7 8"/>
                                        <line x1="12" y1="3" x2="12" y2="15"/>
                                    </svg>
                                    导入
                                </button>
                                <button class="btn btn-default btn-sm" id="export-skill-btn">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                        <polyline points="7 10 12 15 17 10"/>
                                        <line x1="12" y1="15" x2="12" y2="3"/>
                                    </svg>
                                    导出
                                </button>
                            </div>
                            <div class="toolbar-separator"></div>
                            <button class="btn btn-primary btn-sm" id="add-skill-btn">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <line x1="12" y1="5" x2="12" y2="19"/>
                                    <line x1="5" y1="12" x2="19" y2="12"/>
                                </svg>
                                新建 Skill
                            </button>
                        </div>
                    </div>
                </div>
                <div class="batch-bar" id="skill-batch-bar" style="display:none;">
                    <div class="batch-bar-left">
                        <label class="batch-select-all-label">
                            <input type="checkbox" class="select-all-checkbox" id="skill-select-all" />
                            全选
                        </label>
                        <span id="skill-selected-count">0 项已选</span>
                    </div>
                    <div class="batch-bar-right">
                        <button class="btn btn-danger btn-sm" id="skill-batch-delete-btn">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                            批量删除
                        </button>
                        <button class="btn btn-default btn-sm" id="skill-exit-batch-btn">退出管理</button>
                    </div>
                </div>
                <div class="view-content">
                    <div id="skill-list">
                        <div class="loading">加载中...</div>
                    </div>
                </div>
            </div>
        `;

        this.syncViewToggle();
        await this.loadSkills();
        this.bindEvents();
    },

    /**
     * 同步视图切换按钮的激活状态
     */
    syncViewToggle() {
        document.querySelectorAll('.view-toggle-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === this.currentView);
        });
    },

    /**
     * 加载 Skill 列表并根据当前视图模式渲染
     */
    async loadSkills() {
        this.selectedIds.clear();
        this.batchMode = false;
        this.syncBatchMode();
        this.updateBatchBar();

        const listEl = document.getElementById('skill-list');
        listEl.innerHTML = '<div class="loading">加载中...</div>';

        try {
            let skills = await API.getSkills();
            this.allSkills = skills;

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

            if (this.currentView === 'card') {
                this.renderCards(listEl, skills);
            } else {
                this.renderTable(listEl, skills);
            }
        } catch (err) {
            listEl.innerHTML = `<div class="empty-state">加载失败: ${escapeHtml(err.message)}</div>`;
        }
    },

    /**
     * 以表格视图渲染 Skill 列表
     * @param {HTMLElement} container - 容器元素
     * @param {Array} skills - Skill 数据数组
     */
    renderTable(container, skills) {
        let html = '<div class="table-container"><table class="table"><thead><tr><th class="th-checkbox"></th><th>名称</th><th>描述</th><th>更新时间</th><th>操作</th></tr></thead><tbody>';

        skills.forEach(s => {
            const desc = s.description ? (s.description.length > 50 ? s.description.substring(0, 50) + '...' : s.description) : '-';
            const time = new Date(s.updated_at).toLocaleString('zh-CN');
            html += `
                <tr data-id="${s.id}">
                    <td class="td-checkbox"><input type="checkbox" class="row-checkbox" data-id="${s.id}" /></td>
                    <td><strong>${escapeHtml(s.name)}</strong></td>
                    <td class="text-secondary">${escapeHtml(desc)}</td>
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
                            <button class="btn btn-sm btn-danger delete-skill-btn" data-id="${s.id}" data-name="${escapeHtml(s.name)}">
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
        container.innerHTML = html;
        this.bindItemEvents(container);
        this.bindCheckboxEvents(container);
    },

    /**
     * 以卡片视图渲染 Skill 列表
     * @param {HTMLElement} container - 容器元素
     * @param {Array} skills - Skill 数据数组
     */
    renderCards(container, skills) {
        let html = '<div class="cards-grid">';
        skills.forEach(s => {
            html += `<div class="item-card" data-id="${s.id}">
                <div class="card-checkbox-wrap">
                    <input type="checkbox" class="card-checkbox" data-id="${s.id}" />
                </div>
                <div class="item-card-title">${escapeHtml(s.name)}</div>
                <div class="item-card-desc">${escapeHtml(s.description || '暂无描述')}</div>
                <div class="item-card-actions">
                    <button class="btn btn-default btn-sm view-skill-btn" data-id="${s.id}">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        查看
                    </button>
                    <button class="btn btn-default btn-sm edit-skill-btn" data-id="${s.id}">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        编辑
                    </button>
                    <button class="btn btn-danger btn-sm delete-skill-btn" data-id="${s.id}" data-name="${escapeHtml(s.name)}">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                        删除
                    </button>
                </div>
            </div>`;
        });
        html += '</div>';
        container.innerHTML = html;
        this.bindItemEvents(container);
        this.bindCheckboxEvents(container);
    },

    /**
     * 统一绑定列表/卡片中查看、编辑、删除按钮的事件
     * @param {HTMLElement} container - 包含操作按钮的容器元素
     */
    bindItemEvents(container) {
        container.querySelectorAll('.view-skill-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.viewSkill(Number(btn.dataset.id));
            });
        });
        container.querySelectorAll('.edit-skill-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.openEditModal(Number(btn.dataset.id));
            });
        });
        container.querySelectorAll('.delete-skill-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.handleDelete(btn.dataset.id, btn.dataset.name);
            });
        });

        container.querySelectorAll('tr[data-id]').forEach(row => {
            row.addEventListener('click', (e) => {
                if (e.target.closest('button') || e.target.closest('a') || e.target.type === 'checkbox') return;
                const cb = row.querySelector('.row-checkbox');
                if (cb) {
                    cb.checked = !cb.checked;
                    cb.dispatchEvent(new Event('change'));
                }
            });
        });

        container.querySelectorAll('.item-card[data-id]').forEach(card => {
            card.addEventListener('click', (e) => {
                if (e.target.closest('button') || e.target.closest('a') || e.target.type === 'checkbox') return;
                const cb = card.querySelector('.card-checkbox');
                if (cb) {
                    cb.checked = !cb.checked;
                    cb.dispatchEvent(new Event('change'));
                }
            });
        });
    },

    /**
     * 绑定 checkbox 选择事件（全选/单选/卡片选择）
     * @param {HTMLElement} container - 包含 checkbox 的容器元素
     */
    bindCheckboxEvents(container) {
        const selectAll = document.getElementById('skill-select-all');
        const cbSelector = '.row-checkbox, .card-checkbox';
        if (selectAll) {
            selectAll.addEventListener('change', () => {
                container.querySelectorAll(cbSelector).forEach(cb => {
                    cb.checked = selectAll.checked;
                    const id = Number(cb.dataset.id);
                    if (selectAll.checked) {
                        this.selectedIds.add(id);
                    } else {
                        this.selectedIds.delete(id);
                    }
                });
                this.updateBatchBar();
            });
        }

        container.querySelectorAll('.row-checkbox, .card-checkbox').forEach(cb => {
            cb.addEventListener('change', () => {
                const id = Number(cb.dataset.id);
                if (cb.checked) {
                    this.selectedIds.add(id);
                } else {
                    this.selectedIds.delete(id);
                }
                if (selectAll) {
                    const allCbs = container.querySelectorAll(cbSelector);
                    selectAll.checked = allCbs.length > 0 && this.selectedIds.size === allCbs.length;
                }
                this.updateBatchBar();
            });
        });
    },

    /**
     * 更新批量操作栏的显示状态和选中计数
     */
    updateBatchBar() {
        const bar = document.getElementById('skill-batch-bar');
        const countEl = document.getElementById('skill-selected-count');
        if (bar && countEl) {
            const count = this.selectedIds.size;
            bar.style.display = this.batchMode ? 'flex' : 'none';
            countEl.textContent = `${count} 项已选`;
        }
        this.syncSelectionUI();
    },

    /**
     * 同步选中状态的视觉反馈（高亮行/卡片）
     */
    syncSelectionUI() {
        document.querySelectorAll('#skill-list tr[data-id]').forEach(row => {
            const id = Number(row.dataset.id);
            row.classList.toggle('row-selected', this.selectedIds.has(id));
        });
        document.querySelectorAll('#skill-list .item-card[data-id]').forEach(card => {
            const id = Number(card.dataset.id);
            card.classList.toggle('card-selected', this.selectedIds.has(id));
        });
    },

    /**
     * 切换批量管理模式
     */
    toggleBatchMode() {
        this.batchMode = !this.batchMode;
        if (!this.batchMode) {
            this.selectedIds.clear();
        }
        this.syncBatchMode();
        this.updateBatchBar();
    },

    /**
     * 退出批量管理模式
     */
    exitBatchMode() {
        this.batchMode = false;
        this.selectedIds.clear();
        this.syncBatchMode();
        this.updateBatchBar();
    },

    /**
     * 同步批量管理模式的 DOM 状态（添加/移除 batch-mode 类、显示/隐藏批量栏）
     */
    syncBatchMode() {
        const viewContent = document.querySelector('#skill-list').closest('.view-content') || document.querySelector('#skill-list').parentElement;
        const wrapper = viewContent.closest('.view-toolbar') || viewContent.parentElement;
        if (wrapper) {
            wrapper.classList.toggle('batch-mode', this.batchMode);
        }
        const bar = document.getElementById('skill-batch-bar');
        if (bar) {
            bar.style.display = this.batchMode ? 'flex' : 'none';
        }
        const btn = document.getElementById('batch-manage-skill-btn');
        if (btn) {
            btn.classList.toggle('btn-primary', this.batchMode);
            btn.classList.toggle('btn-default', !this.batchMode);
        }
        if (!this.batchMode) {
            document.getElementById('skill-list').querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
            const selectAll = document.getElementById('skill-select-all');
            if (selectAll) selectAll.checked = false;
        }
    },

    /**
     * 处理批量删除 Skill 操作
     */
    async handleBatchDelete() {
        const count = this.selectedIds.size;
        if (count === 0) return;

        const confirmed = await Confirm.danger(`确定要删除选中的 ${count} 个 Skill 吗？将同时删除文件，此操作不可恢复。`);
        if (confirmed) {
            try {
                const deleted = await API.batchDeleteSkills([...this.selectedIds], true);
                Toast.success(`成功删除 ${deleted} 个 Skill`);
                this.selectedIds.clear();
                await this.loadSkills();
            } catch (err) {
                // 错误已由 API.call 处理
            }
        }
    },

    /**
     * 绑定搜索、新建、导入、导出、视图切换事件
     */
    bindEvents() {
        document.getElementById('skill-search').addEventListener('input', (e) => {
            SkillsView.currentKeyword = e.target.value.toLowerCase();
            this.loadSkills();
        });

        document.getElementById('add-skill-btn').addEventListener('click', () => this.openCreateModal());

        document.querySelectorAll('.view-toggle-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                SkillsView.currentView = btn.dataset.view;
                document.querySelectorAll('.view-toggle-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                API.updateSetting('skill_view_mode', btn.dataset.view);
                this.loadSkills();
            });
        });

        document.getElementById('import-skill-btn').addEventListener('click', async () => {
            try {
                const filePaths = await API.openMultiZIPFileDialog();
                if (!filePaths || filePaths.length === 0) return;
                if (filePaths.length === 1) {
                    const result = await API.importSkillAuto(filePaths[0]);
                    let msg = `导入完成：成功 ${result.success}，跳过 ${result.skipped}，失败 ${result.failed}`;
                    if (result.failed > 0 && result.errors && result.errors.length > 0) {
                        msg += `\n` + result.errors.slice(0, 3).join('\n');
                        if (result.errors.length > 3) msg += `\n...等 ${result.errors.length} 个错误`;
                    }
                    Toast[result.failed > 0 ? 'warning' : 'success'](msg);
                } else {
                    const result = await API.batchImportSkills(filePaths);
                    let msg = `批量导入完成：成功 ${result.success}，跳过 ${result.skipped}，失败 ${result.failed}`;
                    if (result.failed > 0 && result.errors && result.errors.length > 0) {
                        msg += `\n` + result.errors.slice(0, 3).join('\n');
                        if (result.errors.length > 3) msg += `\n...等 ${result.errors.length} 个错误`;
                    }
                    Toast[result.failed > 0 ? 'warning' : 'success'](msg);
                }
                await this.loadSkills();
            } catch (err) {
                // 错误已由 API.call 处理
            }
        });

        document.getElementById('export-skill-btn').addEventListener('click', async () => {
            try {
                const ids = this.selectedIds.size > 0 ? [...this.selectedIds] : [];
                if (ids.length === 1) {
                    const skill = this.allSkills.find(s => s.id === ids[0]);
                    const defaultName = skill ? `${skill.name}.zip` : 'skill.zip';
                    const filePath = await API.saveZIPFileDialog(defaultName);
                    if (!filePath) return;
                    await API.exportSkill(ids[0], filePath);
                } else {
                    const filePath = await API.saveZIPFileDialog('skills.zip');
                    if (!filePath) return;
                    await API.exportSkills(ids, filePath);
                }
                Toast.success(`导出成功`);
                this.selectedIds.clear();
                document.getElementById('skill-list').querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
                this.updateBatchBar();
            } catch (err) {
                // 错误已由 API.call 处理
            }
        });

        document.getElementById('skill-batch-delete-btn').addEventListener('click', () => this.handleBatchDelete());

        document.getElementById('batch-manage-skill-btn').addEventListener('click', () => this.toggleBatchMode());

        document.getElementById('skill-exit-batch-btn').addEventListener('click', () => this.exitBatchMode());
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

            try {
                await API.createSkill(name, description);
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
                    <textarea class="form-textarea" id="skill-description" rows="3">${skill.description || ''}</textarea>
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

            try {
                await API.updateSkill(skill.id, name, description);
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
