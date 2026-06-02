/**
 * Prompt 管理视图组件
 * 提供 Prompt 的增删改查功能，所有图标使用内联 SVG
 */
const PromptsView = {
    currentKeyword: '',
    currentCategory: 'all',
    currentView: App.settings?.prompt_view_mode || 'card',
    selectedIds: new Set(),
    batchMode: false,
    currentTag: '',
    allPrompts: [],
    hoveredPromptId: null,

    /**
     * 渲染 Prompt 管理视图
     * @param {HTMLElement} container - 容器元素
     */
    highlightId: null,

    async render(container, highlightId = null) {
        this.highlightId = highlightId;
        this.currentKeyword = '';
        this.currentCategory = 'all';
        this.currentTag = '';
        if (!this._template) {
            const resp = await fetch('html/prompts.html');
            this._template = await resp.text();
        }
        container.innerHTML = this._template;
        document.querySelectorAll('.view-toggle-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === this.currentView);
        });
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
            select.innerHTML = '<option value="all">所有分类</option>';
            categories.filter(c => c.trim()).forEach(cat => {
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
            const prompts = await API.getPrompts(PromptsView.currentKeyword, PromptsView.currentCategory, PromptsView.currentTag);
            this.allPrompts = prompts;

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

            if (this.highlightId) {
                this.highlightItem(this.highlightId);
                this.highlightId = null;
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
        let html = '<div class="table-container"><table class="table"><thead><tr><th class="th-checkbox"></th><th>名称</th><th>分类</th><th>标签</th><th>更新时间</th><th>置顶</th><th>操作</th></tr></thead><tbody>';
        prompts.forEach(p => {
            const time = new Date(p.updated_at).toLocaleString('zh-CN');
            const tags = parseTags(p.tags);
            const tagsHtml = tags.map(t => `<span class="tag tag-primary tag-clickable" data-tag="${escapeHtml(t)}">${highlightText(t, PromptsView.currentKeyword)}</span>`).join('');
            const contentEscaped = escapeHtml(p.content);
            html += `<tr data-id="${p.id}" class="${p.is_pinned ? 'row-pinned' : ''}">
                <td class="td-checkbox"><input type="checkbox" class="row-checkbox" data-id="${p.id}" /></td>
                <td><strong>${highlightText(p.name, PromptsView.currentKeyword)}</strong></td>
                <td>${p.category ? `<span class="tag">${escapeHtml(p.category)}</span>` : ''}</td>
                <td><div class="item-card-tags">${tagsHtml}</div></td>
                <td class="text-secondary">${time}</td>
                <td>
                    <button class="btn btn-default btn-sm pin-prompt-btn" data-id="${p.id}" title="${p.is_pinned ? '取消置顶' : '置顶'}">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="${p.is_pinned ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L12 22M17 7L12 2L7 7"/></svg>
                    </button>
                </td>
                <td>
                    <button class="btn btn-default btn-sm view-prompt-btn" data-id="${p.id}" data-name="${escapeHtml(p.name)}" data-content="${contentEscaped}" data-category="${escapeHtml(p.category || '')}" data-tags="${escapeHtml(tags.join(', '))}" data-is-template="${p.is_template}">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        查看
                    </button>
                    <button class="btn btn-default btn-sm copy-prompt-btn" data-id="${p.id}" data-content="${contentEscaped}">
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
            const tags = parseTags(p.tags);
            const tagsHtml = tags.slice(0, 4).map(t => `<span class="tag tag-primary tag-clickable" data-tag="${escapeHtml(t)}">${highlightText(t, PromptsView.currentKeyword)}</span>`).join('');
            const contentHighlighted = highlightText(p.content, PromptsView.currentKeyword);
            html += `<div class="item-card${p.is_pinned ? ' card-pinned' : ''}" data-id="${p.id}">
                <div class="card-checkbox-wrap">
                    <input type="checkbox" class="card-checkbox" data-id="${p.id}" />
                </div>
                <div class="item-card-title">${highlightText(p.name, PromptsView.currentKeyword)}</div>
                <div class="item-card-desc">${contentHighlighted}</div>
                <div class="item-card-meta">
                    ${p.category ? `<span class="tag">${escapeHtml(p.category)}</span>` : ''}
                    <div class="item-card-tags">${tagsHtml}</div>
                    <button class="btn btn-default btn-sm pin-prompt-btn" data-id="${p.id}" title="${p.is_pinned ? '取消置顶' : '置顶'}" style="margin-left: auto;">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="${p.is_pinned ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L12 22M17 7L12 2L7 7"/></svg>
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
        container.querySelectorAll('.pin-prompt-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                await API.togglePinPrompt(Number(btn.dataset.id));
                this.loadPrompts();
            });
        });

        container.querySelectorAll('tr[data-id]').forEach(row => {
            row.addEventListener('click', (e) => {
                if (!this.batchMode) return;
                if (e.target.closest('button') || e.target.closest('a') || e.target.type === 'checkbox') return;
                const cb = row.querySelector('.row-checkbox');
                if (cb) {
                    cb.checked = !cb.checked;
                    cb.dispatchEvent(new Event('change'));
                }
            });
            row.addEventListener('dblclick', (e) => {
                if (e.target.closest('button') || e.target.closest('a') || e.target.type === 'checkbox') return;
                const id = Number(row.dataset.id);
                const prompt = this.allPrompts.find(p => p.id === id);
                if (!prompt) return;
                const tags = parseTags(prompt.tags);
                this.viewPrompt({ name: prompt.name, content: prompt.content, category: prompt.category || '', tags: tags.join(', ') });
            });
            row.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                this.showPromptContextMenu(e, Number(row.dataset.id));
            });
        });

        container.querySelectorAll('.item-card[data-id]').forEach(card => {
            card.addEventListener('click', (e) => {
                if (!this.batchMode) return;
                if (e.target.closest('button') || e.target.closest('a') || e.target.type === 'checkbox') return;
                const cb = card.querySelector('.card-checkbox');
                if (cb) {
                    cb.checked = !cb.checked;
                    cb.dispatchEvent(new Event('change'));
                }
            });
            card.addEventListener('dblclick', (e) => {
                if (e.target.closest('button') || e.target.closest('a') || e.target.type === 'checkbox') return;
                const id = Number(card.dataset.id);
                const prompt = this.allPrompts.find(p => p.id === id);
                if (!prompt) return;
                const tags = parseTags(prompt.tags);
                this.viewPrompt({ name: prompt.name, content: prompt.content, category: prompt.category || '', tags: tags.join(', ') });
            });
            card.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.showPromptContextMenu(e, Number(card.dataset.id));
            });
        });

        container.querySelectorAll('tr[data-id], .item-card[data-id]').forEach(el => {
            el.addEventListener('mouseenter', () => {
                this.hoveredPromptId = Number(el.dataset.id);
            });
            el.addEventListener('mouseleave', () => {
                if (this.hoveredPromptId === Number(el.dataset.id)) {
                    this.hoveredPromptId = null;
                }
            });
        });
    },

    /**
     * 高亮指定 ID 的项目并闪烁 3 秒
     * @param {number} id - 要高亮的项目 ID
     */
    highlightItem(id) {
        const el = document.querySelector(`[data-id="${id}"]`);
        if (el) {
            el.classList.add('highlight-flash');
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setTimeout(() => {
                el.classList.remove('highlight-flash');
            }, 3000);
        }
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
            DropdownMenu.hide();
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
        DropdownMenu.hide();
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
     * 切换全选/取消全选状态
     * @param {boolean} checked - true 全选，false 取消全选
     */
    toggleSelectAll(checked) {
        const container = document.getElementById('prompt-list');
        if (!container) return;
        const cbSelector = this.currentView === 'card' ? '.card-checkbox' : '.row-checkbox';
        container.querySelectorAll(cbSelector).forEach(cb => {
            cb.checked = checked;
            const id = Number(cb.dataset.id);
            if (checked) {
                this.selectedIds.add(id);
            } else {
                this.selectedIds.delete(id);
            }
        });
        const selectAll = document.getElementById('prompt-select-all');
        if (selectAll) selectAll.checked = checked;
        this.updateBatchBar();
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
            clearTimeout(PromptsView._searchTimer);
            PromptsView._searchTimer = setTimeout(() => this.loadPrompts(), 100);
        });

        document.getElementById('prompt-category').addEventListener('change', (e) => {
            PromptsView.currentCategory = e.target.value;
            this.loadPrompts();
        });

        document.getElementById('add-prompt-btn').addEventListener('click', () => this.openCreateModal());

        document.getElementById('ai-generate-prompt-btn').addEventListener('click', () => this.openAIGenerateModal());

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

        document.getElementById('prompt-more-actions-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            const rect = e.target.getBoundingClientRect();
            DropdownMenu.show(rect.left, rect.bottom + 4, [
                { label: '修改分类', action: () => this.handleBatchUpdateCategory() },
                { separator: true },
                { label: '添加标签', action: () => this.handleBatchAddTags() },
                { label: '移除标签', action: () => this.handleBatchRemoveTags() },
                { separator: true },
                { label: '置顶', action: () => this.handleBatchSetPin(true) },
                { label: '取消置顶', action: () => this.handleBatchSetPin(false) },
            ]);
        });

        document.getElementById('batch-manage-prompt-btn').addEventListener('click', () => this.toggleBatchMode());

        document.getElementById('prompt-exit-batch-btn').addEventListener('click', () => this.exitBatchMode());

        ShortcutManager.registerView('prompts', {
            'delete': () => { if (this.batchMode && this.selectedIds.size > 0) this.handleBatchDelete(); },
            'ctrl+a': (e) => { e.preventDefault(); if (this.batchMode) this.toggleSelectAll(true); },
            'ctrl+d': () => { if (this.batchMode) this.toggleSelectAll(false); },
            'ctrl+c': (e) => {
                if (this.hoveredPromptId && !this.batchMode) {
                    e.preventDefault();
                    this.copyPromptById(this.hoveredPromptId);
                }
            },
        });

        document.getElementById('prompt-list').addEventListener('click', (e) => {
            const tagEl = e.target.closest('.tag-clickable');
            if (!tagEl) return;
            e.stopPropagation();
            const tag = tagEl.dataset.tag;
            if (tag) {
                PromptsView.currentKeyword = tag;
                document.getElementById('prompt-search').value = tag;
                this.loadPrompts();
            }
        });
    },

    bindCharCount(textareaId, countId) {
        const textarea = document.getElementById(textareaId);
        const countEl = document.getElementById(countId);
        if (textarea && countEl) {
            const update = () => { countEl.textContent = textarea.value.length + ' 字符'; };
            textarea.addEventListener('input', update);
            update();
        }
    },



    /**
     * 绑定分类组合框：输入 + 下拉选择已有分类
     */
    async bindCategoryCombo() {
        const input = document.getElementById('prompt-category-input');
        const dropdown = document.getElementById('category-dropdown');
        if (!input || !dropdown) return;

        let allCategories = [];

        try {
            allCategories = (await API.getCategories() || []).filter(c => c.trim());
        } catch (e) { /* ignore */ }

        const categoryNav = KeyboardNav.bind(input, {
            getItems: () => {
                if (dropdown.style.display === 'none') return [];
                return dropdown.querySelectorAll('.model-dropdown-item');
            },
            onEnter: (item) => {
                input.value = item.dataset.value;
                dropdown.style.display = 'none';
            },
            onEscape: () => { dropdown.style.display = 'none'; },
            allowCancel: false,
        });

        const renderList = (filter) => {
            const val = (filter || '').toLowerCase();
            const filtered = val ? allCategories.filter(c => c.toLowerCase().includes(val)) : allCategories;
            categoryNav.reset();
            if (filtered.length === 0) {
                dropdown.style.display = 'none';
                return;
            }
            dropdown.innerHTML = filtered.map(c =>
                `<div class="model-dropdown-item" data-value="${escapeHtml(c)}">${escapeHtml(c)}</div>`
            ).join('');
            dropdown.style.display = 'block';
            dropdown.querySelectorAll('.model-dropdown-item').forEach(item => {
                item.addEventListener('mousedown', (e) => {
                    e.preventDefault();
                    input.value = item.dataset.value;
                    dropdown.style.display = 'none';
                });
            });
        };

        input.addEventListener('focus', () => renderList(input.value));
        input.addEventListener('input', () => renderList(input.value));

        document.addEventListener('mousedown', (e) => {
            if (!input.contains(e.target) && !dropdown.contains(e.target)) {
                dropdown.style.display = 'none';
            }
        });
    },

    /**
     * 打开新建 Prompt 模态框
     */
    openCreateModal() {
        AIActionButton.cleanupAll();
        const content = `
            <form id="prompt-form">
                <div class="form-group">
                    <label class="form-label">名称 <span class="required-mark">*</span></label>
                    <div class="ai-optimize-row">
                        <input type="text" class="form-input" id="prompt-name" required />
                        <div class="ai-action-btn-wrap" id="ai-action-prompt-name-create"></div>
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">分类</label>
                    <div class="category-combo">
                        <input type="text" class="form-input" id="prompt-category-input" placeholder="输入或选择分类" autocomplete="off" />
                        <div class="model-dropdown" id="category-dropdown"></div>
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">内容 <span class="required-mark">*</span></label>
                    <div class="ai-optimize-row">
                        <textarea class="form-textarea textarea-prompt-content" id="prompt-content" rows="6" required></textarea>
                        <div class="ai-action-btn-wrap" id="ai-action-prompt-content-create"></div>
                    </div>
                    <div class="char-count" id="prompt-char-count">0 字符</div>
                </div>
                <div class="form-group">
                    <label class="form-label">标签（逗号分隔）</label>
                    <input type="text" class="form-input" id="prompt-tags" placeholder="tag1, tag2, tag3" />
                </div>
                <div class="form-group">
                    <label class="form-label">模板</label>
                    <label class="toggle-switch">
                        <input type="checkbox" id="prompt-is-template" />
                        <span class="toggle-slider"></span>
                    </label>
                    <span class="toggle-label">启用后复制时弹窗填写变量，占位符格式: <code>{{变量名}}</code> 或 <code>{{变量名|默认值}}</code></span>
                </div>
            </form>
        `;

        const footer = `
            <button type="button" class="btn btn-default" onclick="Modal.close()">取消</button>
            <button type="submit" class="btn btn-primary" form="prompt-form">保存</button>
        `;

        Modal.open('新建 Prompt', content, { footer });

        AIActionButton.init('ai-action-prompt-name-create', {
            targetFieldId: 'prompt-name',
            actions: [
                { type: 'generate', label: '生成名称', sourceFieldId: 'prompt-content', apiMethod: API.generateNameFromContent, emptyMsg: '请先输入提示词内容' },
                { type: 'optimize', label: '优化名称', apiMethod: API.optimizeName }
            ]
        });
        AIActionButton.init('ai-action-prompt-content-create', {
            targetFieldId: 'prompt-content',
            actions: [
                { type: 'optimize', label: '优化内容', apiMethod: API.optimizePrompt }
            ]
        });
        PromptsView.bindCharCount('prompt-content', 'prompt-char-count');
        this.bindCategoryCombo();

        document.getElementById('prompt-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('prompt-name').value.trim();
            const content = document.getElementById('prompt-content').value.trim();
            const category = document.getElementById('prompt-category-input').value.trim();
            const tagsStr = document.getElementById('prompt-tags').value.trim();
            const tags = tagsStr ? tagsStr.split(',').map(t => t.trim()) : [];
            const isTemplate = document.getElementById('prompt-is-template').checked;

            try {
                await API.createPrompt(name, content, category, tags, isTemplate);
                Toast.success('创建成功');
                Modal.close();
                await this.loadCategories();
                await this.loadPrompts();
            } catch (err) {
                // 错误已由 API.call 处理
            }
        });
    },

    /**
     * 打开 AI 生成 Prompt 模态框
     */
    async openAIGenerateModal() {
        const settings = App.settings || {};
        if (!settings.ai_api_key) {
            Toast.warning('请先在设置页配置 AI API Key');
            return;
        }

        const content = `
            <div class="ai-generate-form">
                <div id="ai-gen-input-section">
                    <div class="form-group">
                        <label class="form-label">一句话描述你想要的提示词</label>
                        <input type="text" class="form-input" id="ai-gen-description" placeholder="例如：帮我写一个代码审查的提示词" />
                    </div>
                    <div class="ai-gen-loading-state" id="ai-gen-loading" style="display:none;">
                        <div class="ai-gen-wave">
                            <span></span><span></span><span></span>
                        </div>
                        <div class="ai-gen-loading-text">AI 正在思考中</div>
                        <div class="ai-gen-loading-hint">正在分析需求并生成提示词，请稍候...</div>
                    </div>
                </div>
                <div id="ai-gen-review-section" class="ai-gen-fade-in" style="display:none;">
                    <div class="form-group">
                        <label class="form-label">名称 <span class="required-mark">*</span></label>
                        <input type="text" class="form-input" id="ai-gen-name" />
                    </div>
                    <div class="form-group">
                        <label class="form-label">内容 <span class="required-mark">*</span></label>
                        <textarea class="form-textarea" id="ai-gen-content" rows="8"></textarea>
                    </div>
                </div>
            </div>
        `;

        const footer = `
            <button type="button" class="btn btn-default" id="ai-gen-cancel-btn">取消</button>
            <button type="button" class="btn btn-danger" id="ai-gen-stop-btn" style="display:none;">停止生成</button>
            <button type="button" class="btn btn-primary" id="ai-gen-start-btn">生成</button>
            <button type="button" class="btn btn-primary" id="ai-gen-confirm-btn" style="display:none;">确认使用</button>
        `;

        Modal.open('AI 生成提示词', content, { width: '560px', footer });

        let accumulated = '';

        const setLoading = (loading) => {
            document.getElementById('ai-gen-start-btn').style.display = loading ? 'none' : '';
            document.getElementById('ai-gen-stop-btn').style.display = loading ? '' : 'none';
            document.getElementById('ai-gen-description').disabled = loading;
            document.getElementById('ai-gen-loading').style.display = loading ? '' : 'none';
        };

        document.getElementById('ai-gen-cancel-btn').addEventListener('click', () => {
            accumulated = '';
            Modal.close();
        });

        document.getElementById('ai-gen-stop-btn').addEventListener('click', async () => {
            await API.cancelAIGeneration();
            accumulated = '';
            setLoading(false);
        });

        document.getElementById('ai-gen-start-btn').addEventListener('click', async () => {
            const reviewSection = document.getElementById('ai-gen-review-section');
            if (reviewSection && reviewSection.style.display !== 'none') {
                document.getElementById('ai-gen-input-section').style.display = '';
                reviewSection.style.display = 'none';
                document.getElementById('ai-gen-confirm-btn').style.display = 'none';
                document.getElementById('ai-gen-start-btn').textContent = '生成';
            }

            const desc = document.getElementById('ai-gen-description').value.trim();
            if (!desc) {
                Toast.warning('请输入描述');
                return;
            }

            accumulated = '';
            setLoading(true);

            if (PromptsView._genStream) {
                PromptsView._genStream.cleanup();
            }
            PromptsView._genStream = withAIStream(API.generatePrompt, {
                onToken: (token) => {
                    accumulated += token;
                },
                onDone: () => {
                    const result = accumulated;
                    PromptsView._genStream = null;
                    setLoading(false);
                    if (result) {
                        PromptsView.showAIReviewSection(result);
                    }
                },
                onError: (errMsg) => {
                    PromptsView._genStream = null;
                    setLoading(false);
                    Toast.error(errMsg);
                }
            });

            await PromptsView._genStream.call(desc);
        });

        document.getElementById('ai-gen-confirm-btn').addEventListener('click', () => {
            const name = document.getElementById('ai-gen-name').value.trim();
            const content = document.getElementById('ai-gen-content').value.trim();
            if (!name || !content) {
                Toast.warning('名称和内容不能为空');
                return;
            }
            Modal.close();
            PromptsView.openCreateModalWithData(name, content);
        });

        const descInput = document.getElementById('ai-gen-description');
        descInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                document.getElementById('ai-gen-start-btn').click();
            }
        });

        setTimeout(() => {
            if (descInput) descInput.focus();
        }, 100);
    },

    showAIReviewSection(rawOutput) {
        let name = '';
        let content = '';

        try {
            const jsonStr = rawOutput.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
            const parsed = JSON.parse(jsonStr);
            name = parsed.name || '';
            content = parsed.content || '';
        } catch (e) {
            content = rawOutput;
        }

        const inputSection = document.getElementById('ai-gen-input-section');
        const reviewSection = document.getElementById('ai-gen-review-section');

        inputSection.style.display = 'none';
        reviewSection.style.display = '';
        reviewSection.classList.remove('ai-gen-fade-in');
        void reviewSection.offsetWidth;
        reviewSection.classList.add('ai-gen-fade-in');

        document.getElementById('ai-gen-name').value = name;
        document.getElementById('ai-gen-content').value = content;
        document.getElementById('ai-gen-confirm-btn').style.display = '';
        document.getElementById('ai-gen-start-btn').textContent = '重新生成';
        document.getElementById('ai-gen-start-btn').style.display = '';
        Toast.success('提示词生成完成，请检查并确认');
    },

    openCreateModalWithData(name, content) {
        AIActionButton.cleanupAll();
        const formContent = `
            <form id="prompt-form">
                <div class="form-group">
                    <label class="form-label">名称 <span class="required-mark">*</span></label>
                    <div class="ai-optimize-row">
                        <input type="text" class="form-input" id="prompt-name" value="${escapeHtml(name)}" required />
                        <div class="ai-action-btn-wrap" id="ai-action-prompt-name-ai"></div>
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">分类</label>
                    <div class="category-combo">
                        <input type="text" class="form-input" id="prompt-category-input" placeholder="输入或选择分类" autocomplete="off" />
                        <div class="model-dropdown" id="category-dropdown"></div>
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">内容 <span class="required-mark">*</span></label>
                    <div class="ai-optimize-row">
                        <textarea class="form-textarea textarea-prompt-content" id="prompt-content" rows="6" required>${escapeHtml(content)}</textarea>
                        <div class="ai-action-btn-wrap" id="ai-action-prompt-content-ai"></div>
                    </div>
                    <div class="char-count" id="prompt-char-count">${content.length} 字符</div>
                </div>
                <div class="form-group">
                    <label class="form-label">标签（逗号分隔）</label>
                    <input type="text" class="form-input" id="prompt-tags" placeholder="tag1, tag2, tag3" />
                </div>
                <div class="form-group">
                    <label class="form-label">模板</label>
                    <label class="toggle-switch">
                        <input type="checkbox" id="prompt-is-template" />
                        <span class="toggle-slider"></span>
                    </label>
                    <span class="toggle-label">启用后复制时弹窗填写变量，占位符格式: <code>{{变量名}}</code> 或 <code>{{变量名|默认值}}</code></span>
                </div>
            </form>
        `;

        const footer = `
            <button type="button" class="btn btn-default" onclick="Modal.close()">取消</button>
            <button type="submit" class="btn btn-primary" form="prompt-form">保存</button>
        `;

        Modal.open('新建 Prompt（AI 生成）', formContent, { footer });

        AIActionButton.init('ai-action-prompt-name-ai', {
            targetFieldId: 'prompt-name',
            actions: [
                { type: 'generate', label: '生成名称', sourceFieldId: 'prompt-content', apiMethod: API.generateNameFromContent, emptyMsg: '请先输入提示词内容' },
                { type: 'optimize', label: '优化名称', apiMethod: API.optimizeName }
            ]
        });
        AIActionButton.init('ai-action-prompt-content-ai', {
            targetFieldId: 'prompt-content',
            actions: [
                { type: 'optimize', label: '优化内容', apiMethod: API.optimizePrompt }
            ]
        });
        PromptsView.bindCharCount('prompt-content', 'prompt-char-count');
        this.bindCategoryCombo();

        document.getElementById('prompt-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const pName = document.getElementById('prompt-name').value.trim();
            const pContent = document.getElementById('prompt-content').value.trim();
            const pCategory = document.getElementById('prompt-category-input').value.trim();
            const pTagsStr = document.getElementById('prompt-tags').value.trim();
            const pTags = pTagsStr ? pTagsStr.split(',').map(t => t.trim()) : [];
            const pIsTemplate = document.getElementById('prompt-is-template').checked;

            try {
                await API.createPrompt(pName, pContent, pCategory, pTags, pIsTemplate);
                Toast.success('创建成功');
                Modal.close();
                await this.loadCategories();
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
            AIActionButton.cleanupAll();
            const prompt = await API.getPrompt(id);

            const content = `
                <form id="prompt-form">
                    <div class="form-group">
                    <label class="form-label">名称 <span class="required-mark">*</span></label>
                    <div class="ai-optimize-row">
                        <input type="text" class="form-input" id="prompt-name" value="${escapeHtml(prompt.name)}" required />
                        <div class="ai-action-btn-wrap" id="ai-action-prompt-name-edit"></div>
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">分类</label>
                    <div class="category-combo">
                        <input type="text" class="form-input" id="prompt-category-input" value="${escapeHtml(prompt.category || '')}" autocomplete="off" />
                        <div class="model-dropdown" id="category-dropdown"></div>
                    </div>
                    </div>
                    <div class="form-group">
                        <label class="form-label">内容 <span class="required-mark">*</span></label>
                        <div class="ai-optimize-row">
                            <textarea class="form-textarea textarea-prompt-content" id="prompt-content" rows="6" required>${escapeHtml(prompt.content)}</textarea>
                            <div class="ai-action-btn-wrap" id="ai-action-prompt-content-edit"></div>
                        </div>
                        <div class="char-count" id="prompt-char-count">${prompt.content.length} 字符</div>
                    </div>
                    <div class="form-group">
                        <label class="form-label">标签（逗号分隔）</label>
                        <input type="text" class="form-input" id="prompt-tags" value="${escapeHtml(parseTags(prompt.tags).join(', '))}" />
                    </div>
                    <div class="form-group">
                        <label class="form-label">模板</label>
                        <label class="toggle-switch">
                            <input type="checkbox" id="prompt-is-template" ${prompt.is_template ? 'checked' : ''} />
                            <span class="toggle-slider"></span>
                        </label>
                        <span class="toggle-label">启用后复制时弹窗填写变量，占位符格式: <code>{{变量名}}</code> 或 <code>{{变量名|默认值}}</code></span>
                    </div>
                </form>
        `;

        const footer = `
            <button type="button" class="btn btn-default" onclick="Modal.close()">取消</button>
            <button type="submit" class="btn btn-primary" form="prompt-form">保存</button>
        `;

        Modal.open('编辑 Prompt', content, { footer });

        AIActionButton.init('ai-action-prompt-name-edit', {
            targetFieldId: 'prompt-name',
            actions: [
                { type: 'generate', label: '生成名称', sourceFieldId: 'prompt-content', apiMethod: API.generateNameFromContent, emptyMsg: '请先输入提示词内容' },
                { type: 'optimize', label: '优化名称', apiMethod: API.optimizeName }
            ]
        });
        AIActionButton.init('ai-action-prompt-content-edit', {
            targetFieldId: 'prompt-content',
            actions: [
                { type: 'optimize', label: '优化内容', apiMethod: API.optimizePrompt }
            ]
        });
        PromptsView.bindCharCount('prompt-content', 'prompt-char-count');
        this.bindCategoryCombo();

        document.getElementById('prompt-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('prompt-name').value.trim();
            const content = document.getElementById('prompt-content').value.trim();
            const category = document.getElementById('prompt-category-input').value.trim();
            const tagsStr = document.getElementById('prompt-tags').value.trim();
            const tags = tagsStr ? tagsStr.split(',').map(t => t.trim()) : [];
            const isTemplate = document.getElementById('prompt-is-template').checked;

            try {
                await API.updatePrompt(id, name, content, category, tags, isTemplate);
                Toast.success('更新成功');
                Modal.close();
                await this.loadCategories();
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
        const tags = dataset.tags ? dataset.tags.split(', ').filter(Boolean) : [];
        const tagsHtml = tags.length > 0
            ? `<div class="detail-tags">${tags.map(t => `<span class="tag tag-primary">${escapeHtml(t)}</span>`).join('')}</div>`
            : '<span class="tag">无标签</span>';

        const category = dataset.category || '未分类';
        const isTemplate = dataset.isTemplate === 'true' || dataset.isTemplate === true;

        const content = `
            <div class="detail-view">
                <div class="detail-header">
                    <div class="detail-title">${escapeHtml(dataset.name)}${isTemplate ? ' <span class="tag tag-primary" style="font-size:11px;">模板</span>' : ''}</div>
                    <div class="detail-meta">
                        <div class="detail-meta-item">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                            </svg>
                            <span class="tag">${escapeHtml(category)}</span>
                        </div>
                    </div>
                </div>
                ${tags.length > 0 ? `
                <div class="detail-section">
                    <div class="detail-section-title">标签</div>
                    ${tagsHtml}
                </div>` : ''}
                <div class="detail-section">
                    <div class="detail-section-title">内容 <span class="char-count-inline">${dataset.content.length} 字符</span></div>
                    <div class="detail-content">${escapeHtml(dataset.content)}</div>
                </div>
            </div>
        `;

        const footer = `
            <button class="btn btn-default" id="prompt-copy-btn" data-content="${escapeHtml(dataset.content)}" data-is-template="${isTemplate}">复制</button>
            <button class="btn btn-default" onclick="Modal.close()">关闭</button>
        `;

        Modal.open('查看 Prompt', content, { footer });

        const copyBtn = document.getElementById('prompt-copy-btn');
        if (copyBtn) {
            copyBtn.addEventListener('click', async () => {
                const content = copyBtn.dataset.content;
                const isTemplate = copyBtn.dataset.isTemplate === 'true';

                const incrementUsage = async () => {
                    if (dataset.id) {
                        try {
                            await API.incrementPromptUsage(Number(dataset.id));
                            const prompt = this.allPrompts.find(p => p.id === Number(dataset.id));
                            if (prompt) {
                                prompt.usage_count = (prompt.usage_count || 0) + 1;
                            }
                        } catch (e) {
                            // 静默处理错误
                        }
                    }
                };

                if (isTemplate) {
                    const vars = parseTemplateVars(content);
                    if (vars.length > 0) {
                        showTemplateVarsModal(vars, async (values) => {
                            const replaced = replaceTemplateVars(content, values);
                            await copyToClipboard(replaced);
                            await incrementUsage();
                            Toast.success('内容已复制到剪贴板');
                        });
                        return;
                    }
                }

                await copyToClipboard(content);
                await incrementUsage();
                Toast.success('内容已复制到剪贴板');
            });
        }
    },

    /**
     * 根据 ID 复制 Prompt 内容到剪贴板（快捷键使用）
     * @param {number} promptId - Prompt ID
     */
    async copyPromptById(promptId) {
        const prompt = this.allPrompts.find(p => p.id === promptId);
        if (!prompt) return;

        const incrementUsage = async () => {
            try {
                await API.incrementPromptUsage(promptId);
                prompt.usage_count = (prompt.usage_count || 0) + 1;
            } catch (e) {
                // 静默处理错误
            }
        };

        if (prompt.is_template) {
            const vars = parseTemplateVars(prompt.content);
            if (vars.length > 0) {
                showTemplateVarsModal(vars, async (values) => {
                    const replaced = replaceTemplateVars(prompt.content, values);
                    await copyToClipboard(replaced);
                    await incrementUsage();
                    Toast.success('内容已复制到剪贴板');
                });
                return;
            }
        }

        await copyToClipboard(prompt.content);
        await incrementUsage();
        Toast.success('内容已复制到剪贴板');
    },

    /**
     * 复制 Prompt 内容到剪贴板
     * @param {HTMLElement} btn - 触发复制的按钮元素
     */
    async copyPromptContent(btn) {
        const content = btn.dataset.content;
        const promptId = btn.dataset.id;
        const prompt = promptId ? this.allPrompts.find(p => p.id === Number(promptId)) : null;

        const incrementUsage = async () => {
            if (promptId) {
                try {
                    await API.incrementPromptUsage(Number(promptId));
                    if (prompt) {
                        prompt.usage_count = (prompt.usage_count || 0) + 1;
                    }
                } catch (e) {
                    // 静默处理错误
                }
            }
        };

        if (prompt && prompt.is_template) {
            const vars = parseTemplateVars(content);
            if (vars.length > 0) {
                showTemplateVarsModal(vars, async (values) => {
                    const replaced = replaceTemplateVars(content, values);
                    await copyToClipboard(replaced);
                    await incrementUsage();
                    Toast.success('内容已复制到剪贴板');
                });
                return;
            }
        }

        await copyToClipboard(content);
        await incrementUsage();
        Toast.success('内容已复制到剪贴板');
    },

    handleBatchUpdateCategory() {
        if (this.selectedIds.size === 0) { Toast.warning('请先选择要操作的提示词'); return; }
        Modal.open('修改分类', `
            <div style="padding:16px">
                <label class="form-label">分类名称</label>
                <div id="batch-category-tags" style="margin-bottom:8px;display:flex;flex-wrap:wrap;gap:6px"></div>
                <input type="text" class="form-input" id="batch-category-input" placeholder="输入新分类或点击上方选择" />
            </div>
            <div class="form-actions">
                <button type="button" class="btn btn-default" id="batch-category-cancel-btn">取消</button>
                <button type="button" class="btn btn-primary" id="batch-category-confirm-btn">确认</button>
            </div>
        `);
        document.getElementById('batch-category-cancel-btn').addEventListener('click', () => Modal.close());
        document.getElementById('batch-category-confirm-btn').addEventListener('click', async () => {
            const val = document.getElementById('batch-category-input').value.trim();
            if (!val) { Toast.warning('请输入分类名称'); return; }
            try {
                await API.batchUpdateCategory([...this.selectedIds], val);
                Toast.success(`已更新 ${this.selectedIds.size} 条提示词的分类`);
                Modal.close();
                this.selectedIds.clear();
                this.loadPrompts();
            } catch (e) { Toast.error('操作失败: ' + e.message); }
        });
        setTimeout(async () => {
            try {
                const cats = await API.getCategories();
                const container = document.getElementById('batch-category-tags');
                if (container && cats) {
                    cats.forEach(c => {
                        const tag = document.createElement('span');
                        tag.className = 'tag tag-sm tag-clickable';
                        tag.textContent = c;
                        tag.style.cursor = 'pointer';
                        tag.onclick = () => { document.getElementById('batch-category-input').value = c; };
                        container.appendChild(tag);
                    });
                }
            } catch (e) {}
        }, 100);
    },

    handleBatchAddTags() {
        if (this.selectedIds.size === 0) { Toast.warning('请先选择要操作的提示词'); return; }
        Modal.open('添加标签', `
            <div style="padding:16px">
                <label class="form-label">标签（逗号分隔）</label>
                <input type="text" class="form-input" id="batch-tags-input" placeholder="标签1, 标签2, ..." />
            </div>
            <div class="form-actions">
                <button type="button" class="btn btn-default" id="batch-tags-cancel-btn">取消</button>
                <button type="button" class="btn btn-primary" id="batch-tags-confirm-btn">确认</button>
            </div>
        `);
        document.getElementById('batch-tags-cancel-btn').addEventListener('click', () => Modal.close());
        document.getElementById('batch-tags-confirm-btn').addEventListener('click', async () => {
            const val = document.getElementById('batch-tags-input').value.trim();
            if (!val) { Toast.warning('请输入标签'); return; }
            const tags = val.split(',').map(t => t.trim()).filter(Boolean);
            try {
                await API.batchAddPromptTags([...this.selectedIds], tags);
                Toast.success(`已为 ${this.selectedIds.size} 条提示词添加标签`);
                Modal.close();
                this.selectedIds.clear();
                this.loadPrompts();
            } catch (e) { Toast.error('操作失败: ' + e.message); }
        });
    },

    handleBatchRemoveTags() {
        if (this.selectedIds.size === 0) { Toast.warning('请先选择要操作的提示词'); return; }
        const allTags = new Set();
        [...this.selectedIds].forEach(id => {
            const p = this.allPrompts.find(x => x.id === id);
            if (p) {
                parseTags(p.tags).forEach(x => allTags.add(x));
            }
        });
        if (allTags.size === 0) { Toast.info('选中的提示词没有标签'); return; }
        const tagsHtml = [...allTags].map(t => `<label class="batch-remove-tag-item"><input type="checkbox" class="batch-remove-tag-cb" value="${escapeHtml(t)}" checked /> <span class="tag tag-sm">${escapeHtml(t)}</span></label>`).join('');
        Modal.open('移除标签', `
            <div class="batch-remove-tags-wrap">
                <div class="batch-remove-tags-header">
                    <span class="batch-remove-tags-label">勾选要移除的标签</span>
                    <div class="batch-remove-tags-actions">
                        <button type="button" class="btn btn-xs btn-default" id="batch-remove-tags-select-all">全选</button>
                        <button type="button" class="btn btn-xs btn-default" id="batch-remove-tags-deselect-all">取消全选</button>
                    </div>
                </div>
                <div class="batch-remove-tags-list">${tagsHtml}</div>
            </div>
            <div class="form-actions">
                <button type="button" class="btn btn-default" id="batch-remove-tags-cancel-btn">取消</button>
                <button type="button" class="btn btn-primary" id="batch-remove-tags-confirm-btn">确认</button>
            </div>
        `);
        document.getElementById('batch-remove-tags-cancel-btn').addEventListener('click', () => Modal.close());
        document.getElementById('batch-remove-tags-select-all').addEventListener('click', () => {
            document.querySelectorAll('.batch-remove-tag-cb').forEach(cb => cb.checked = true);
        });
        document.getElementById('batch-remove-tags-deselect-all').addEventListener('click', () => {
            document.querySelectorAll('.batch-remove-tag-cb').forEach(cb => cb.checked = false);
        });
        document.getElementById('batch-remove-tags-confirm-btn').addEventListener('click', async () => {
            const toRemove = [];
            document.querySelectorAll('.batch-remove-tag-cb').forEach(cb => { if (cb.checked) toRemove.push(cb.value); });
            if (toRemove.length === 0) { Toast.info('请勾选要移除的标签'); return; }
            try {
                await API.batchRemovePromptTags([...this.selectedIds], toRemove);
                Toast.success(`已从 ${this.selectedIds.size} 条提示词中移除 ${toRemove.length} 个标签`);
                Modal.close();
                this.selectedIds.clear();
                this.loadPrompts();
            } catch (e) { Toast.error('操作失败: ' + e.message); }
        });
    },

    handleBatchSetPin(pinned) {
        if (this.selectedIds.size === 0) { Toast.warning('请先选择要操作的提示词'); return; }
        API.batchSetPinPrompt([...this.selectedIds], pinned).then(() => {
            Toast.success(pinned ? '已置顶' : '已取消置顶');
            this.selectedIds.clear();
            this.loadPrompts();
        }).catch(e => Toast.error('操作失败: ' + e.message));
    },

    /**
     * 显示 Prompt 卡片/行的右键菜单
     * @param {MouseEvent} e - 右键事件
     * @param {number} id - Prompt ID
     */
    showPromptContextMenu(e, id) {
        const prompt = this.allPrompts.find(p => p.id === id);
        if (!prompt) return;

        const viewIcon = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
        const copyIcon = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
        const editIcon = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>';
        const deleteIcon = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>';

        const tags = parseTags(prompt.tags);

        ContextMenu.show(e.clientX, e.clientY, [
            { label: '查看', icon: viewIcon, action: () => this.viewPrompt({ name: prompt.name, content: prompt.content, category: prompt.category || '', tags: tags.join(', '), isTemplate: prompt.is_template }) },
            { label: '复制', icon: copyIcon, action: async () => {
                const incrementUsage = async () => {
                    try {
                        await API.incrementPromptUsage(id);
                        prompt.usage_count = (prompt.usage_count || 0) + 1;
                    } catch (e) {
                        // 静默处理错误
                    }
                };

                if (prompt.is_template) {
                    const vars = parseTemplateVars(prompt.content);
                    if (vars.length > 0) {
                        showTemplateVarsModal(vars, async (values) => {
                            const replaced = replaceTemplateVars(prompt.content, values);
                            await copyToClipboard(replaced);
                            await incrementUsage();
                            Toast.success('内容已复制到剪贴板');
                        });
                        return;
                    }
                }
                await copyToClipboard(prompt.content);
                await incrementUsage();
                Toast.success('内容已复制到剪贴板');
            }},
            { separator: true },
            { label: '编辑', icon: editIcon, action: () => this.openEditModal(id) },
            { label: '删除', icon: deleteIcon, danger: true, action: () => this.handleDelete(String(id)) }
        ]);
    }
};