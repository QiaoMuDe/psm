/**
 * Skill 管理视图组件
 * 提供 Skill 的增删改查功能，支持列表/卡片视图切换，所有图标使用内联 SVG
 */
const SkillsView = {
    currentKeyword: '',
    currentView: App.settings?.skill_view_mode || 'card',
    selectedIds: new Set(),
    allSkills: [],
    batchMode: false,
    _searchTimer: null,
    highlightId: null,

    /**
     * 渲染 Skill 管理视图
     * @param {HTMLElement} container - 容器元素
     * @param {number} highlightId - 要高亮的项目 ID
     */
    async render(container, highlightId = null) {
        this.highlightId = highlightId;
        this.currentKeyword = '';
        if (!this._template) {
            const resp = await fetch('html/skills.html');
            this._template = await resp.text();
        }
        container.innerHTML = this._template;

        // 设置视图切换按钮的 active 状态
        document.querySelectorAll('.view-toggle-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === this.currentView);
        });
        await this.loadSkills();
        this.bindEvents();
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
            let skills = await API.getSkills(SkillsView.currentKeyword);
            this.allSkills = skills;

            if (skills.length === 0) {
                listEl.innerHTML = `
                    <div class="empty-state">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" style="opacity: 0.3; margin-bottom: 12px;">
                            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
                        </svg>
                        <div class="empty-state-text">暂无 Skill</div>
                        <div class="empty-state-hint">点击"导入技能"添加第一条</div>
                    </div>`;
                return;
            }

            if (this.currentView === 'card') {
                this.renderCards(listEl, skills);
            } else {
                this.renderTable(listEl, skills);
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
     * 以表格视图渲染 Skill 列表
     * @param {HTMLElement} container - 容器元素
     * @param {Array} skills - Skill 数据数组
     */
    renderTable(container, skills) {
        let html = '<div class="table-container"><table class="table"><thead><tr><th class="th-checkbox"></th><th>名称</th><th>描述</th><th>标签</th><th>更新时间</th><th>置顶</th><th>操作</th></tr></thead><tbody>';

        skills.forEach(s => {
            const desc = s.description ? (s.description.length > 50 ? s.description.substring(0, 50) + '...' : s.description) : '-';
            const time = new Date(s.updated_at).toLocaleString('zh-CN');
            const tags = parseTags(s.tags);
            const tagsHtml = tags.map(t =>
                `<span class="tag tag-sm tag-primary tag-clickable" data-tag="${escapeHtml(t)}">${highlightText(t, SkillsView.currentKeyword)}</span>`
            ).join('');
            html += `
                <tr data-id="${s.id}" class="${s.is_pinned ? 'row-pinned' : ''}">
                    <td class="td-checkbox"><input type="checkbox" class="row-checkbox" data-id="${s.id}" /></td>
                    <td><strong>${highlightText(s.name, SkillsView.currentKeyword)}</strong></td>
                    <td class="text-secondary">${highlightText(desc, SkillsView.currentKeyword)}</td>
                    <td><div class="item-card-tags">${tagsHtml}</div></td>
                    <td>${time}</td>
                    <td>
                        <button class="btn btn-default btn-sm pin-skill-btn" data-id="${s.id}" title="${s.is_pinned ? '取消置顶' : '置顶'}">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="${s.is_pinned ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L12 22M17 7L12 2L7 7"/></svg>
                        </button>
                    </td>
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
            const tags = parseTags(s.tags);
            const tagsHtml = tags.slice(0, 4).map(t =>
                `<span class="tag tag-sm tag-primary tag-clickable" data-tag="${escapeHtml(t)}">${highlightText(t, SkillsView.currentKeyword)}</span>`
            ).join('');
            html += `<div class="item-card${s.is_pinned ? ' card-pinned' : ''}" data-id="${s.id}">
                <div class="card-checkbox-wrap">
                    <input type="checkbox" class="card-checkbox" data-id="${s.id}" />
                </div>
                <div class="item-card-title">${highlightText(s.name, SkillsView.currentKeyword)}</div>
                <div class="item-card-desc">${highlightText(s.description || '暂无描述', SkillsView.currentKeyword)}</div>
                <div class="item-card-meta">
                    <div class="item-card-tags">${tagsHtml}</div>
                    <button class="btn btn-default btn-sm pin-skill-btn" data-id="${s.id}" title="${s.is_pinned ? '取消置顶' : '置顶'}" style="margin-left: auto;">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="${s.is_pinned ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L12 22M17 7L12 2L7 7"/></svg>
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
        container.querySelectorAll('.pin-skill-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                await API.togglePinSkill(Number(btn.dataset.id));
                this.loadSkills();
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
                this.viewSkill(Number(row.dataset.id));
            });
            row.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                this.showSkillContextMenu(e, Number(row.dataset.id));
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
                this.viewSkill(Number(card.dataset.id));
            });
            card.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.showSkillContextMenu(e, Number(card.dataset.id));
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
     * 切换全选/取消全选状态
     * @param {boolean} checked - true 全选，false 取消全选
     */
    toggleSelectAll(checked) {
        const container = document.getElementById('skill-list');
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
        const selectAll = document.getElementById('skill-select-all');
        if (selectAll) selectAll.checked = checked;
        this.updateBatchBar();
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

    handleBatchAddTags() {
        if (this.selectedIds.size === 0) { Toast.warning('请先选择要操作的技能'); return; }
        Modal.open('添加标签', `
            <div style="padding:16px">
                <label class="form-label">标签（逗号分隔）</label>
                <input type="text" class="form-input" id="skill-batch-tags-input" placeholder="标签1, 标签2, ..." />
            </div>
            <div class="form-actions">
                <button type="button" class="btn btn-default" id="skill-batch-tags-cancel-btn">取消</button>
                <button type="button" class="btn btn-primary" id="skill-batch-tags-confirm-btn">确认</button>
            </div>
        `);
        document.getElementById('skill-batch-tags-cancel-btn').addEventListener('click', () => Modal.close());
        document.getElementById('skill-batch-tags-confirm-btn').addEventListener('click', async () => {
            const val = document.getElementById('skill-batch-tags-input').value.trim();
            if (!val) { Toast.warning('请输入标签'); return; }
            const tags = val.split(',').map(t => t.trim()).filter(Boolean);
            try {
                await API.batchAddSkillTags([...this.selectedIds], tags);
                Toast.success(`已为 ${this.selectedIds.size} 个技能添加标签`);
                Modal.close();
                this.selectedIds.clear();
                this.loadSkills();
            } catch (e) { Toast.error('操作失败: ' + e.message); }
        });
    },

    handleBatchRemoveTags() {
        if (this.selectedIds.size === 0) { Toast.warning('请先选择要操作的技能'); return; }
        const allTags = new Set();
        [...this.selectedIds].forEach(id => {
            const s = this.allSkills.find(x => x.id === id);
            if (s) {
                parseTags(s.tags).forEach(x => allTags.add(x));
            }
        });
        if (allTags.size === 0) { Toast.info('选中的技能没有标签'); return; }
        const tagsHtml = [...allTags].map(t => `<label class="batch-remove-tag-item"><input type="checkbox" class="skill-batch-remove-tag-cb" value="${escapeHtml(t)}" checked /> <span class="tag tag-sm">${escapeHtml(t)}</span></label>`).join('');
        Modal.open('移除标签', `
            <div class="batch-remove-tags-wrap">
                <div class="batch-remove-tags-header">
                    <span class="batch-remove-tags-label">勾选要移除的标签</span>
                    <div class="batch-remove-tags-actions">
                        <button type="button" class="btn btn-xs btn-default" id="skill-batch-remove-tags-select-all">全选</button>
                        <button type="button" class="btn btn-xs btn-default" id="skill-batch-remove-tags-deselect-all">取消全选</button>
                    </div>
                </div>
                <div class="batch-remove-tags-list">${tagsHtml}</div>
            </div>
            <div class="form-actions">
                <button type="button" class="btn btn-default" id="skill-batch-remove-tags-cancel-btn">取消</button>
                <button type="button" class="btn btn-primary" id="skill-batch-remove-tags-confirm-btn">确认</button>
            </div>
        `);
        document.getElementById('skill-batch-remove-tags-cancel-btn').addEventListener('click', () => Modal.close());
        document.getElementById('skill-batch-remove-tags-select-all').addEventListener('click', () => {
            document.querySelectorAll('.skill-batch-remove-tag-cb').forEach(cb => cb.checked = true);
        });
        document.getElementById('skill-batch-remove-tags-deselect-all').addEventListener('click', () => {
            document.querySelectorAll('.skill-batch-remove-tag-cb').forEach(cb => cb.checked = false);
        });
        document.getElementById('skill-batch-remove-tags-confirm-btn').addEventListener('click', async () => {
            const toRemove = [];
            document.querySelectorAll('.skill-batch-remove-tag-cb').forEach(cb => { if (cb.checked) toRemove.push(cb.value); });
            if (toRemove.length === 0) { Toast.info('请勾选要移除的标签'); return; }
            try {
                await API.batchRemoveSkillTags([...this.selectedIds], toRemove);
                Toast.success(`已从 ${this.selectedIds.size} 个技能中移除 ${toRemove.length} 个标签`);
                Modal.close();
                this.selectedIds.clear();
                this.loadSkills();
            } catch (e) { Toast.error('操作失败: ' + e.message); }
        });
    },

    handleBatchSetPin(pinned) {
        if (this.selectedIds.size === 0) { Toast.warning('请先选择要操作的技能'); return; }
        API.batchSetPinSkill([...this.selectedIds], pinned).then(() => {
            Toast.success(pinned ? '已置顶' : '已取消置顶');
            this.selectedIds.clear();
            this.loadSkills();
        }).catch(e => Toast.error('操作失败: ' + e.message));
    },

    /**
     * 绑定搜索、新建、导入、导出、视图切换事件
     */
    bindEvents() {
        document.getElementById('skill-search').addEventListener('input', (e) => {
            clearTimeout(SkillsView._searchTimer);
            SkillsView._searchTimer = setTimeout(() => {
                SkillsView.currentKeyword = e.target.value;
                this.loadSkills();
            }, 100);
        });

        document.getElementById('skill-list').addEventListener('click', (e) => {
            const tagEl = e.target.closest('.tag-clickable');
            if (!tagEl) return;
            e.stopPropagation();
            const tag = tagEl.dataset.tag;
            if (tag) {
                SkillsView.currentKeyword = tag;
                document.getElementById('skill-search').value = tag;
                this.loadSkills();
            }
        });

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

        document.getElementById('skill-more-actions-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            const rect = e.target.getBoundingClientRect();
            DropdownMenu.show(rect.left, rect.bottom + 4, [
                { label: '添加标签', action: () => this.handleBatchAddTags() },
                { label: '移除标签', action: () => this.handleBatchRemoveTags() },
                { separator: true },
                { label: '置顶', action: () => this.handleBatchSetPin(true) },
                { label: '取消置顶', action: () => this.handleBatchSetPin(false) },
            ]);
        });

        document.getElementById('add-skill-btn').addEventListener('click', async () => {
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

        document.getElementById('batch-manage-skill-btn').addEventListener('click', () => this.toggleBatchMode());

        document.getElementById('skill-exit-batch-btn').addEventListener('click', () => this.exitBatchMode());

        ShortcutManager.registerView('skills', {
            'delete': () => { if (this.batchMode && this.selectedIds.size > 0) this.handleBatchDelete(); },
            'ctrl+a': (e) => { e.preventDefault(); if (this.batchMode) this.toggleSelectAll(true); },
            'ctrl+d': () => { if (this.batchMode) this.toggleSelectAll(false); },
        });
    },

    /**
     * 打开编辑 Skill 模态框
     * @param {string} id - Skill ID
     */
    async openEditModal(id) {
        try {
            const skill = await API.getSkill(id);
            const skillTags = parseTags(skill.tags);

            AIActionButton.cleanupAll();
            const content = `
                <form id="skill-form">
                    <div class="form-group">
                    <label class="form-label">名称 <span class="required-mark">*</span></label>
                    <div class="ai-optimize-row">
                        <input type="text" class="form-input" id="skill-name" value="${escapeHtml(skill.name)}" required />
                        <div class="ai-action-btn-wrap" id="ai-action-skill-name"></div>
                    </div>
                </div>
                    <div class="form-group">
                    <label class="form-label">描述</label>
                    <div class="ai-optimize-row">
                        <textarea class="form-textarea" id="skill-description" rows="3">${skill.description || ''}</textarea>
                        <div class="ai-action-btn-wrap" id="ai-action-skill-desc"></div>
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">标签（逗号分隔）</label>
                    <input type="text" class="form-input" id="skill-tags" value="${escapeHtml(skillTags.join(', '))}" placeholder="tag1, tag2, tag3" />
                </div>
            </form>
        `;

        const footer = `
            <button type="button" class="btn btn-default" onclick="Modal.close()">取消</button>
            <button type="submit" class="btn btn-primary" form="skill-form">保存</button>
        `;

        Modal.open('编辑 Skill', content, { footer });

        AIActionButton.init('ai-action-skill-name', {
            targetFieldId: 'skill-name',
            actions: [
                { type: 'generate', label: '生成名称', sourceFieldId: 'skill-description', apiMethod: API.generateNameFromContent, emptyMsg: '请先输入描述内容' },
                { type: 'optimize', label: '优化名称', apiMethod: API.optimizeName }
            ]
        });
        AIActionButton.init('ai-action-skill-desc', {
            targetFieldId: 'skill-description',
            actions: [
                { type: 'generate', label: '生成描述', sourceFieldId: 'skill-name', apiMethod: API.generateDescriptionFromContent, emptyMsg: '请先输入名称内容' },
                { type: 'optimize', label: '优化描述', apiMethod: API.optimizeDescription }
            ]
        });

        document.getElementById('skill-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('skill-name').value.trim();
            const description = document.getElementById('skill-description').value.trim();
            const tagsStr = document.getElementById('skill-tags').value.trim();
            const tags = tagsStr ? tagsStr.split(',').map(t => t.trim()).filter(Boolean) : [];

            try {
                await API.updateSkill(skill.id, name, description, tags);
                Toast.success('更新成功');
                Modal.close();
                await this.loadSkills();
            } catch (err) {
                const nameInput = document.getElementById('skill-name');
                const errMsg = (err && err.message) ? err.message : String(err || '');
                if (nameInput && errMsg.includes('已存在')) {
                    const existingMsg = nameInput.parentNode.querySelector('.input-error-msg');
                    if (existingMsg) existingMsg.remove();
                    nameInput.classList.remove('input-error-flash');
                    void nameInput.offsetWidth;
                    nameInput.classList.add('input-error-flash');
                    const msg = document.createElement('div');
                    msg.className = 'input-error-msg';
                    msg.textContent = errMsg;
                    nameInput.parentNode.appendChild(msg);
                    nameInput.addEventListener('animationend', () => {
                        nameInput.classList.remove('input-error-flash');
                    }, { once: true });
                }
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

            const createdTime = new Date(skill.created_at).toLocaleString('zh-CN');
            const updatedTime = new Date(skill.updated_at).toLocaleString('zh-CN');

            const folderIcon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>`;
            const fileIcon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>`;

            let filesListHtml = '';
            if (files.length > 0) {
                filesListHtml = files.map(f => {
                    const size = f.is_dir ? '-' : (f.size > 1024 ? (f.size / 1024).toFixed(1) + ' KB' : f.size + ' B');
                    const icon = f.is_dir ? folderIcon : fileIcon;
                    return `
                        <div class="skill-detail-file-item" data-path="${escapeHtml(f.full_path || '')}" data-is-dir="${f.is_dir}">
                            <span class="skill-detail-file-icon">${icon}</span>
                            <span class="skill-detail-file-name">${escapeHtml(f.name)}</span>
                            <span class="skill-detail-file-size">${size}</span>
                            <span class="skill-detail-file-time">${f.mod_time}</span>
                        </div>`;
                }).join('');
            }

            const content = `
                <div class="skill-detail skill-detail-compact">
                    <div class="skill-detail-title">${escapeHtml(skill.name)}</div>
                    <div class="skill-detail-divider"></div>
                    ${(() => {
                        const tags = parseTags(skill.tags);
                        if (tags.length === 0) return '';
                        return `<div class="detail-tags">${tags.map(t => `<span class="tag tag-primary">${escapeHtml(t)}</span>`).join('')}</div><div class="skill-detail-divider"></div>`;
                    })()}
                    ${skill.description ? `<div class="skill-detail-desc">${escapeHtml(skill.description)}</div>` : ''}
                    <div class="skill-detail-divider"></div>
                    <div class="skill-detail-files-header">
                        <span class="skill-detail-files-title">📁 文件列表 (${files.length} 项)</span>
                    </div>
                    ${files.length > 0 ? `
                    <div class="skill-detail-files-list">
                        ${filesListHtml}
                    </div>
                    ` : `<div class="skill-detail-files-empty">该技能暂无文件</div>`}
                </div>
            `;

            const footer = `
                <button class="btn btn-default" onclick="Modal.close()">关闭</button>
            `;

            Modal.open('Skill 详情', content, { width: '560px', footer });

            document.querySelectorAll('.skill-detail-file-item').forEach(item => {
                item.addEventListener('dblclick', async () => {
                    const path = item.dataset.path;
                    if (path) {
                        await API.revealInExplorer(path);
                    }
                });

                item.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    const path = item.dataset.path;
                    const isDir = item.dataset.isDir === 'true';
                    if (!path) return;

                    const items = [];
                    if (isDir) {
                        items.push({ label: '📂 打开目录', action: () => API.revealInExplorer(path) });
                    } else {
                        items.push({ label: '📄 打开文件', action: () => API.openFile(path) });
                        items.push({ label: '📂 打开所在目录', action: () => API.revealInExplorer(path) });
                    }
                    items.push({ label: '📋 复制路径', action: () => {
                        navigator.clipboard.writeText(path);
                        Toast.success('路径已复制');
                    }});

                    ContextMenu.show(e.clientX, e.clientY, items);
                });
            });
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
    },

    /**
     * 显示 Skill 卡片/行的右键菜单
     * @param {MouseEvent} e - 右键事件
     * @param {number} id - Skill ID
     */
    showSkillContextMenu(e, id) {
        const skill = this.allSkills.find(s => s.id === id);
        if (!skill) return;

        const viewIcon = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
        const editIcon = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>';
        const exportIcon = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>';
        const deleteIcon = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>';

        ContextMenu.show(e.clientX, e.clientY, [
            { label: '查看', icon: viewIcon, action: () => this.viewSkill(id) },
            { separator: true },
            { label: '编辑', icon: editIcon, action: () => this.openEditModal(id) },
            { label: '导出', icon: exportIcon, action: async () => {
                try {
                    const defaultName = `${skill.name}.zip`;
                    const filePath = await API.saveZIPFileDialog(defaultName);
                    if (!filePath) return;
                    await API.exportSkill(id, filePath);
                    Toast.success('导出成功');
                } catch (err) {
                    // 错误已由 API.call 处理
                }
            }},
            { label: '删除', icon: deleteIcon, danger: true, action: () => this.handleDelete(String(id)) }
        ]);
    },

};
