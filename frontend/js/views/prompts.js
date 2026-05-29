/**
 * Prompt 管理视图组件
 * 提供 Prompt 的增删改查功能，所有图标使用内联 SVG
 */
const PromptsView = {
    currentKeyword: '',
    currentCategory: '',

    /**
     * 渲染 Prompt 管理视图
     * @param {HTMLElement} container - 容器元素
     */
    async render(container) {
        container.innerHTML = `
            <div class="page-header">
                <h2 class="page-title">Prompt 管理</h2>
            </div>
            <div class="card">
                <div class="card-header">
                    <div class="toolbar">
                        <div class="toolbar-left">
                            <div class="search-box">
                                <input type="text" id="prompt-search" placeholder="搜索 Prompt..." />
                            </div>
                            <select id="prompt-category" class="form-select" style="width: 150px;">
                                <option value="">全部分类</option>
                            </select>
                        </div>
                        <div class="toolbar-right">
                            <button class="btn btn-primary" id="add-prompt-btn">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                                    <line x1="12" y1="5" x2="12" y2="19"/>
                                    <line x1="5" y1="12" x2="19" y2="12"/>
                                </svg>
                                新建 Prompt
                            </button>
                            <button class="btn btn-default" id="import-prompt-btn">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                    <polyline points="17 8 12 3 7 8"/>
                                    <line x1="12" y1="3" x2="12" y2="15"/>
                                </svg>
                                导入
                            </button>
                            <button class="btn btn-default" id="export-prompt-btn">
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
     * 加载 Prompt 列表并渲染表格
     */
    async loadPrompts() {
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
                        <div class="empty-state-hint">点击"新建 Prompt"添加第一条</div>
                    </div>`;
                return;
            }

            let html = '<div class="table-container"><table class="table"><thead><tr><th>名称</th><th>分类</th><th>内容预览</th><th>更新时间</th><th>操作</th></tr></thead><tbody>';

            prompts.forEach(p => {
                const preview = p.content.length > 50 ? p.content.substring(0, 50) + '...' : p.content;
                const time = new Date(p.updated_at).toLocaleString('zh-CN');
                html += `
                    <tr>
                        <td><strong>${escapeHtml(p.name)}</strong></td>
                        <td>${p.category ? `<span class="tag">${escapeHtml(p.category)}</span>` : '-'}</td>
                        <td class="text-secondary">${escapeHtml(preview)}</td>
                        <td>${time}</td>
                        <td>
                            <div class="flex gap-8">
                                <button class="btn btn-sm btn-primary edit-prompt-btn" data-id="${p.id}">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                    </svg>
                                    编辑
                                </button>
                                <button class="btn btn-sm btn-danger delete-prompt-btn" data-id="${p.id}">
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

            listEl.querySelectorAll('.edit-prompt-btn').forEach(btn => {
                btn.addEventListener('click', () => this.openEditModal(btn.dataset.id));
            });

            listEl.querySelectorAll('.delete-prompt-btn').forEach(btn => {
                btn.addEventListener('click', () => this.handleDelete(btn.dataset.id));
            });
        } catch (err) {
            listEl.innerHTML = `<div class="empty-state">加载失败: ${escapeHtml(err.message)}</div>`;
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
                await API.exportPrompts([], filePath);
                Toast.success('导出成功');
            } catch (err) {
                // 错误已由 API.call 处理
            }
        });
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
    }
};