/**
 * Prompt 管理视图组件
 * 提供 Prompt 的增删改查功能，所有图标使用内联 SVG
 */
const PromptsView = {
    currentKeyword: '',
    currentCategory: 'all',
    currentView: App.settings.prompt_view_mode || 'list',
    selectedIds: new Set(),
    batchMode: false,

    /**
     * 渲染 Prompt 管理视图
     * @param {HTMLElement} container - 容器元素
     */
    async render(container) {
        container.innerHTML = `
            <div class="page-header">
                <h2 class="page-title">Prompt 管理</h2>
            </div>
            <div class="card view-toolbar">
                <div class="card-header">
                    <div class="toolbar">
                        <div class="toolbar-left">
                            <div class="search-box">
                                <input type="text" id="prompt-search" placeholder="搜索提示词..." />
                            </div>
                            <select class="form-select" id="prompt-category" style="width: 140px;">
                                <option value="all">所有分类</option>
                            </select>
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
                                <button class="btn btn-default btn-sm" id="batch-manage-prompt-btn">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                                    批量管理
                                </button>
                                <button class="btn btn-default btn-sm" id="import-prompt-btn">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                                    </svg>
                                    导入
                                </button>
                                <button class="btn btn-default btn-sm" id="export-prompt-btn">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                                    </svg>
                                    导出
                                </button>
                            </div>
                            <div class="toolbar-separator"></div>
                            <button class="btn btn-primary btn-sm" id="add-prompt-btn">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                                </svg>
                                新建
                            </button>
                        </div>
                    </div>
                </div>
                <div class="batch-bar" id="prompt-batch-bar" style="display:none;">
                    <div class="batch-bar-left">
                        <label class="batch-select-all-label">
                            <input type="checkbox" class="select-all-checkbox" id="prompt-select-all" />
                            全选
                        </label>
                        <span id="prompt-selected-count">0 项已选</span>
                    </div>
                    <div class="batch-bar-right">
                        <button class="btn btn-danger btn-sm" id="prompt-batch-delete-btn">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                            批量删除
                        </button>
                        <button class="btn btn-default btn-sm" id="prompt-exit-batch-btn">退出管理</button>
                    </div>
                </div>
                <div class="view-content">
                    <div id="prompt-list">
                        <div class="loading">加载中...</div>
                    </div>
                </div>
            </div>
        `;

        await this.loadCategories();
        await this.loadPrompts();
        this.bindEvents();
    },

    /**
     * 加载分类列表到下拉选择框
     */
    async loadCategories() {
        try {
            const categories = await API.getCategories();
            const select = document.getElementById('prompt-category');
            categories.forEach(cat => {
                const option = document.createElement('option');
                option.value = cat;
                option.textContent = cat;
                select.appendChild(option);
            });
        } catch (err) {
            console.error('加载分类失败:', err);
        }
    },

    /**
     * 加载 Prompt 列表并根据当前视图模式渲染
     */
    async loadPrompts() {
        this.selectedIds.clear();
        this.batchMode = false;
        this.syncBatchMode();
        this.updateBatchBar();

        const listEl = document.getElementById('prompt-list');
        listEl.innerHTML = '<div class="loading">加载中...</div>';

        try {
            const prompts = await API.getPrompts(PromptsView.currentKeyword, PromptsView.currentCategory);

            if (prompts.length === 0) {
                listEl.innerHTML = `
                    <div class="empty-state">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" style="opacity: 0.3; margin-bottom: 12px;">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                            <polyline points="14 2 14 8 20 8"/>
                            <line x1="12" y1="18" x2="12" y2="12"/>
                            <line x1="9" y1="15" x2="15" y2="15"/>
                        </svg>
                        <div class="empty-state-text">暂无 Prompt</div>
                        <div class="empty-state-hint">点击"新建"添加第一条</div>
                    </div>`;
                return;
            }

            if (this.currentView === 'card') {
                this.renderCards(listEl, prompts);
            } else {
                this.renderTable(listEl, prompts);
            }
        } catch (err) {
            listEl.innerHTML = `<div class="empty-state">加载失败: ${escapeHtml(err.message)}</div>`;
        }
    },

    /**
     * 以表格形式渲染 Prompt 列表
     * @param {HTMLElement} container - 容器元素
     * @param {Array} prompts - Prompt 数据列表
     */
    renderTable(container, prompts) {
        let html = '<div class="table-container"><table class="table"><thead><tr><th class="th-checkbox"></th><th>名称</th><th>分类</th><th>标签</th><th>更新时间</th><th>操作</th></tr></thead><tbody>';
        prompts.forEach(p => {
            const time = new Date(p.updated_at).toLocaleString('zh-CN');
            let tags = [];
            try { tags = typeof p.tags === 'string' ? JSON.parse(p.tags || '[]') : (p.tags || []); } catch(e) { tags = []; }
            const tagsHtml = tags.map(t => `<span class="tag tag-primary">${escapeHtml(t)}</span>`).join('');
            const contentEscaped = escapeHtml(p.content);
            html += `<tr data-id="${p.id}">
                <td class="td-checkbox"><input type="checkbox" class="row-checkbox" data-id="${p.id}" /></td>
                <td><strong>${escapeHtml(p.name)}</strong></td>
                <td><span class="tag">${escapeHtml(p.category)}</span></td>
                <td><div class="item-card-tags">${tagsHtml}</div></td>
                <td class="text-secondary">${time}</td>
                <td>
                    <button class="btn btn-default btn-sm view-prompt-btn" data-id="${p.id}" data-name="${escapeHtml(p.name)}" data-content="${contentEscaped}" data-category="${escapeHtml(p.category || '')}" data-tags="${escapeHtml(tags.join(', '))}">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        查看
                    </button>
                    <button class="btn btn-default btn-sm copy-prompt-btn" data-content="${contentEscaped}">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                        复制
                    </button>
                    <button class="btn btn-default btn-sm edit-prompt-btn" data-id="${p.id}">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        编辑
                    </button>
                    <button class="btn btn-danger btn-sm delete-prompt-btn" data-id="${p.id}">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                        删除
                    </button>
                </td>
            </tr>`;
        });
        html += '</tbody></table></div>';
        container.innerHTML = html;
        this.bindItemEvents(container);
        this.bindCheckboxEvents(container);
    },

    /**
     * 以卡片形式渲染 Prompt 列表
     * @param {HTMLElement} container - 容器元素
     * @param {Array} prompts - Prompt 数据列表
     */
    renderCards(container, prompts) {
        let html = '<div class="cards-grid">';
        prompts.forEach(p => {
            let tags = [];
            try { tags = typeof p.tags === 'string' ? JSON.parse(p.tags || '[]') : (p.tags || []); } catch(e) { tags = []; }
            const tagsHtml = tags.slice(0, 4).map(t => `<span class="tag tag-primary">${escapeHtml(t)}</span>`).join('');
            const contentEscaped = escapeHtml(p.content);
            html += `<div class="item-card" data-id="${p.id}">
                <div class="card-checkbox-wrap">
                    <input type="checkbox" class="card-checkbox" data-id="${p.id}" />
                </div>
                <div class="item-card-title">${escapeHtml(p.name)}</div>
                <div class="item-card-desc">${contentEscaped}</div>
                <div class="item-card-meta">
                    <span class="tag">${escapeHtml(p.category)}</span>
                    <div class="item-card-tags">${tagsHtml}</div>
                </div>
                <div class="item-card-actions">
                    <button class="btn btn-default btn-sm view-prompt-btn" data-id="${p.id}" data-name="${escapeHtml(p.name)}" data-content="${contentEscaped}" data-category="${escapeHtml(p.category || '')}" data-tags="${escapeHtml(tags.join(', '))}">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        查看
                    </button>
                    <button class="btn btn-default btn-sm copy-prompt-btn" data-content="${contentEscaped}">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                        复制
                    </button>
                    <button class="btn btn-default btn-sm edit-prompt-btn" data-id="${p.id}">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        编辑
                    </button>
                    <button class="btn btn-danger btn-sm delete-prompt-btn" data-id="${p.id}">
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
     * 为列表/卡片中的编辑和删除按钮绑定事件
     * @param {HTMLElement} container - 包含按钮的容器元素
     */
    bindItemEvents(container) {
        container.querySelectorAll('.edit-prompt-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.openEditModal(Number(btn.dataset.id));
            });
        });
        container.querySelectorAll('.delete-prompt-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.handleDelete(btn.dataset.id);
            });
        });
        container.querySelectorAll('.view-prompt-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.viewPrompt(btn.dataset);
            });
        });
        container.querySelectorAll('.copy-prompt-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                await this.copyPromptContent(btn);
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
        const selectAll = document.getElementById('prompt-select-all');
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
        const bar = document.getElementById('prompt-batch-bar');
        const countEl = document.getElementById('prompt-selected-count');
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
        document.querySelectorAll('#prompt-list tr[data-id]').forEach(row => {
            const id = Number(row.dataset.id);
            row.classList.toggle('row-selected', this.selectedIds.has(id));
        });
        document.querySelectorAll('#prompt-list .item-card[data-id]').forEach(card => {
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
        const viewContent = document.querySelector('#prompt-list').closest('.view-content') || document.querySelector('#prompt-list').parentElement;
        const wrapper = viewContent.closest('.view-toolbar') || viewContent.parentElement;
        if (wrapper) {
            wrapper.classList.toggle('batch-mode', this.batchMode);
        }
        const bar = document.getElementById('prompt-batch-bar');
        if (bar) {
            bar.style.display = this.batchMode ? 'flex' : 'none';
        }
        const btn = document.getElementById('batch-manage-prompt-btn');
        if (btn) {
            btn.classList.toggle('btn-primary', this.batchMode);
            btn.classList.toggle('btn-default', !this.batchMode);
        }
        if (!this.batchMode) {
            document.getElementById('prompt-list').querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
            const selectAll = document.getElementById('prompt-select-all');
            if (selectAll) selectAll.checked = false;
        }
    },

    /**
     * 处理批量删除 Prompt 操作
     */
    async handleBatchDelete() {
        const count = this.selectedIds.size;
        if (count === 0) return;

        const confirmed = await Confirm.danger(`确定要删除选中的 ${count} 条 Prompt 吗？此操作不可恢复。`);
        if (confirmed) {
            try {
                const deleted = await API.batchDeletePrompts([...this.selectedIds]);
                Toast.success(`成功删除 ${deleted} 条 Prompt`);
                this.selectedIds.clear();
                await this.loadPrompts();
            } catch (err) {
                // 错误已由 API.call 处理
            }
        }
    },

    /**
     * 绑定搜索、分类筛选、新建、导入、导出事件
     */
    bindEvents() {
        document.getElementById('prompt-search').addEventListener('input', (e) => {
            PromptsView.currentKeyword = e.target.value;
            this.loadPrompts();
        });

        document.getElementById('prompt-category').addEventListener('change', (e) => {
            PromptsView.currentCategory = e.target.value;
            this.loadPrompts();
        });

        document.getElementById('add-prompt-btn').addEventListener('click', () => this.openCreateModal());

        document.getElementById('import-prompt-btn').addEventListener('click', async () => {
            try {
                const filePath = await API.openJSONFileDialog();
                if (!filePath) return;
                const result = await API.importPrompts(filePath);
                Toast.success(`导入完成：成功 ${result.success}，跳过 ${result.skipped}，失败 ${result.failed}`);
                await this.loadCategories();
                await this.loadPrompts();
            } catch (err) {
                // 错误已由 API.call 处理
            }
        });

        document.getElementById('export-prompt-btn').addEventListener('click', async () => {
            try {
                const filePath = await API.saveJSONFileDialog('prompts.json');
                if (!filePath) return;
                const ids = this.selectedIds.size > 0 ? [...this.selectedIds] : [];
                await API.exportPrompts(ids, filePath);
                Toast.success('导出成功');
                this.selectedIds.clear();
                document.getElementById('prompt-list').querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
                this.updateBatchBar();
            } catch (err) {
                // 错误已由 API.call 处理
            }
        });

        document.querySelectorAll('.view-toggle-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                PromptsView.currentView = btn.dataset.view;
                document.querySelectorAll('.view-toggle-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                API.updateSetting('prompt_view_mode', btn.dataset.view);
                this.loadPrompts();
            });
        });

        document.getElementById('prompt-batch-delete-btn').addEventListener('click', () => this.handleBatchDelete());

        document.getElementById('batch-manage-prompt-btn').addEventListener('click', () => this.toggleBatchMode());

        document.getElementById('prompt-exit-batch-btn').addEventListener('click', () => this.exitBatchMode());
    },

    /**
     * 打开新建 Prompt 模态框
     */
    openCreateModal() {
        const content = `
            <form id="prompt-form">
                <div class="form-group">
                    <label class="form-label">名称 *</label>
                    <input type="text" class="form-input" id="prompt-name" required />
                </div>
                <div class="form-group">
                    <label class="form-label">分类</label>
                    <input type="text" class="form-input" id="prompt-category-input" placeholder="输入分类名称" />
                </div>
                <div class="form-group">
                    <label class="form-label">内容 *</label>
                    <textarea class="form-textarea" id="prompt-content" rows="6" required></textarea>
                </div>
                <div class="form-group">
                    <label class="form-label">标签（逗号分隔）</label>
                    <input type="text" class="form-input" id="prompt-tags" placeholder="tag1, tag2, tag3" />
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-default" onclick="Modal.close()">取消</button>
                    <button type="submit" class="btn btn-primary">保存</button>
                </div>
            </form>
        `;

        Modal.open('新建 Prompt', content);

        document.getElementById('prompt-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('prompt-name').value.trim();
            const content = document.getElementById('prompt-content').value.trim();
            const category = document.getElementById('prompt-category-input').value.trim();
            const tagsStr = document.getElementById('prompt-tags').value.trim();
            const tags = tagsStr ? tagsStr.split(',').map(t => t.trim()) : [];

            try {
                await API.createPrompt(name, content, category, tags);
                Toast.success('创建成功');
                Modal.close();
                await this.loadPrompts();
            } catch (err) {
                // 错误已由 API.call 处理
            }
        });
    },

    /**
     * 打开编辑 Prompt 模态框
     * @param {string} id - Prompt ID
     */
    async openEditModal(id) {
        try {
            const prompt = await API.getPrompt(id);

            const content = `
                <form id="prompt-form">
                    <div class="form-group">
                        <label class="form-label">名称 *</label>
                        <input type="text" class="form-input" id="prompt-name" value="${escapeHtml(prompt.name)}" required />
                    </div>
                    <div class="form-group">
                        <label class="form-label">分类</label>
                        <input type="text" class="form-input" id="prompt-category-input" value="${escapeHtml(prompt.category || '')}" />
                    </div>
                    <div class="form-group">
                        <label class="form-label">内容 *</label>
                        <textarea class="form-textarea" id="prompt-content" rows="6" required>${escapeHtml(prompt.content)}</textarea>
                    </div>
                    <div class="form-group">
                        <label class="form-label">标签（逗号分隔）</label>
                        <input type="text" class="form-input" id="prompt-tags" value="${escapeHtml((Array.isArray(prompt.tags) ? prompt.tags : (typeof prompt.tags === 'string' ? JSON.parse(prompt.tags || '[]') : [])).join(', '))}" />
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn btn-default" onclick="Modal.close()">取消</button>
                        <button type="submit" class="btn btn-primary">保存</button>
                    </div>
                </form>
            `;

            Modal.open('编辑 Prompt', content);

            document.getElementById('prompt-form').addEventListener('submit', async (e) => {
                e.preventDefault();
                const name = document.getElementById('prompt-name').value.trim();
                const content = document.getElementById('prompt-content').value.trim();
                const category = document.getElementById('prompt-category-input').value.trim();
                const tagsStr = document.getElementById('prompt-tags').value.trim();
                const tags = tagsStr ? tagsStr.split(',').map(t => t.trim()) : [];

                try {
                    await API.updatePrompt(id, name, content, category, tags);
                    Toast.success('更新成功');
                    Modal.close();
                    await this.loadPrompts();
                } catch (err) {
                    // 错误已由 API.call 处理
                }
            });
        } catch (err) {
            Toast.error('获取 Prompt 详情失败');
        }
    },

    /**
     * 处理删除 Prompt 操作
     * @param {string} id - Prompt ID
     */
    async handleDelete(id) {
        const confirmed = await Confirm.danger('确定要删除这条 Prompt 吗？此操作不可恢复。');
        if (confirmed) {
            try {
                await API.deletePrompt(id);
                Toast.success('删除成功');
                await this.loadPrompts();
            } catch (err) {
                // 错误已由 API.call 处理
            }
        }
    },

    /**
     * 查看 Prompt 详情
     * @param {Object} dataset - 按钮的 dataset 属性（name, content, category, tags）
     */
    viewPrompt(dataset) {
        const tagsHtml = dataset.tags
            ? dataset.tags.split(', ').filter(Boolean).map(t => `<span class="tag tag-primary">${escapeHtml(t)}</span>`).join(' ')
            : '<span class="tag">无</span>';

        const content = `
            <div class="form-group">
                <label class="form-label">名称</label>
                <div style="font-size:16px;font-weight:600;color:var(--text-primary)">${escapeHtml(dataset.name)}</div>
            </div>
            <div class="form-group">
                <label class="form-label">分类</label>
                <div><span class="tag">${escapeHtml(dataset.category || '未分类')}</span></div>
            </div>
            <div class="form-group">
                <label class="form-label">标签</label>
                <div>${tagsHtml}</div>
            </div>
            <div class="form-group">
                <label class="form-label">内容</label>
                <pre style="white-space:pre-wrap;word-wrap:break-word;background:var(--bg-page);padding:12px;border-radius:var(--radius);font-size:13px;line-height:1.6;color:var(--text-primary);border:1px solid var(--border);max-height:400px;overflow-y:auto;margin:0">${escapeHtml(dataset.content)}</pre>
            </div>
            <div class="form-actions">
                <button class="btn btn-default" onclick="Modal.close()">关闭</button>
            </div>
        `;

        Modal.open('查看 Prompt', content);
    },

    /**
     * 复制 Prompt 内容到剪贴板
     * @param {HTMLElement} btn - 触发复制的按钮元素
     */
    async copyPromptContent(btn) {
        const content = btn.dataset.content;
        try {
            await navigator.clipboard.writeText(content);
            Toast.success('内容已复制到剪贴板');
        } catch (err) {
            const textarea = document.createElement('textarea');
            textarea.value = content;
            textarea.style.position = 'fixed';
            textarea.style.left = '-9999px';
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            Toast.success('内容已复制到剪贴板');
        }
    }
};