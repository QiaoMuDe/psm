/**
 * 仪表盘视图组件
 * 显示应用概览和统计数据
 */
const DashboardView = {
    _searchTimer: null,
    _searchIndex: -1,

    /**
     * 渲染仪表盘视图
     * @param {HTMLElement} container - 容器元素
     */
    async render(container) {
        container.innerHTML = `
            <div class="page-header">
                <h2 class="page-title">仪表盘</h2>
            </div>
            <div class="view-content">
                <div class="stats-grid">
                    <div class="stat-card" data-view="prompts">
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
                    <div class="stat-card" data-view="skills">
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

                <div class="global-search-wrapper">
                    <div class="global-search-box">
                        <div class="global-search-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                            </svg>
                        </div>
                        <input type="text" class="global-search-input" id="global-search" placeholder="搜索提示词或技能..." autocomplete="off" />
                        <div class="search-dropdown" id="search-dropdown" style="display: none;"></div>
                    </div>
                </div>

                <div class="dashboard-columns">
                    <div class="dashboard-col-left">
                        <div class="card popular-section" id="popular-section">
                            <div class="card-header">
                                <h3 class="card-title">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                                        <path d="M12 20V10"/>
                                        <path d="M18 20V4"/>
                                        <path d="M6 20v-4"/>
                                    </svg>
                                    最常用提示词
                                </h3>
                            </div>
                            <div class="card-body">
                                <div class="popular-list" id="popular-list">
                                    <div class="empty-state-small">
                                        <p>暂无使用记录</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="dashboard-col-right">
                        <div class="card pinned-section">
                            <div class="card-header">
                                <h3 class="card-title">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                                        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2z"/>
                                    </svg>
                                    置顶内容
                                </h3>
                            </div>
                            <div class="card-body">
                                <div id="pinned-items">
                                    <div class="empty-state">
                                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" style="opacity: 0.3; margin-bottom: 12px;">
                                            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2z"/>
                                        </svg>
                                        <div class="empty-state-text">暂无置顶内容</div>
                                        <div class="empty-state-hint">在提示词或技能模块中点击置顶按钮</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        try {
            const [promptCount, skillCount, pinnedPrompts, pinnedSkills, popularPrompts] = await Promise.all([
                API.countPrompts(),
                API.countSkills(),
                API.getPinnedPrompts(3),
                API.getPinnedSkills(3),
                API.getTopUsedPrompts(5)
            ]);
            document.getElementById('prompt-count').textContent = promptCount;
            document.getElementById('skill-count').textContent = skillCount;
            container.querySelectorAll('.stat-card[data-view]').forEach(card => {
                card.addEventListener('click', () => App.navigate(card.dataset.view));
            });

            this.renderPopularList(container, popularPrompts);

            const pinnedItems = document.getElementById('pinned-items');
            const allPinned = [
                ...(pinnedPrompts || []).map(p => ({ name: p.name, type: 'Prompt', id: p.id, updated_at: p.updated_at })),
                ...(pinnedSkills || []).map(s => ({ name: s.name, type: 'Skill', id: s.id, updated_at: s.updated_at }))
            ].sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at)).slice(0, 6);

            if (allPinned.length > 0) {
                let pinnedHtml = '<div class="pinned-list">';
                allPinned.forEach(item => {
                    const tagClass = item.type === 'Prompt' ? 'tag-blue' : 'tag-teal';
                    const icon = item.type === 'Prompt'
                        ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>'
                        : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>';
                    pinnedHtml += `
                        <div class="pinned-item" data-view="${item.type.toLowerCase()}s" data-id="${item.id}">
                            <div class="pinned-item-icon ${item.type === 'Prompt' ? 'pinned-icon-blue' : 'pinned-icon-teal'}">${icon}</div>
                            <span class="pinned-item-name">${escapeHtml(item.name)}</span>
                            <span class="tag tag-sm ${tagClass}">${item.type}</span>
                        </div>
                    `;
                });
                pinnedHtml += '</div>';
                pinnedItems.innerHTML = pinnedHtml;

                pinnedItems.querySelectorAll('.pinned-item').forEach(el => {
                    el.addEventListener('click', () => App.navigate(el.dataset.view, Number(el.dataset.id)));
                });
            }

            this.bindSearchEvents();
        } catch (err) {
            console.error('加载仪表盘数据失败:', err);
        }
    },

    /**
     * 绑定搜索框事件
     */
    bindSearchEvents() {
        const searchInput = document.getElementById('global-search');
        const dropdown = document.getElementById('search-dropdown');

        if (!searchInput || !dropdown) return;

        searchInput.addEventListener('input', () => {
            clearTimeout(DashboardView._searchTimer);
            const keyword = searchInput.value.trim();
            if (!keyword) {
                dropdown.style.display = 'none';
                return;
            }
            DashboardView._searchTimer = setTimeout(() => {
                DashboardView.performSearch(keyword, dropdown);
            }, 300);
        });

        searchInput.addEventListener('focus', () => {
            const keyword = searchInput.value.trim();
            if (keyword && dropdown.innerHTML) {
                dropdown.style.display = 'block';
            }
        });

        document.addEventListener('click', (e) => {
            if (!e.target.closest('.global-search-wrapper')) {
                dropdown.style.display = 'none';
            }
        });

        searchInput.addEventListener('keydown', (e) => {
            const items = dropdown.querySelectorAll('.search-result-item');

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                this._searchIndex = Math.min(this._searchIndex + 1, items.length - 1);
                this.updateSearchHighlight(items);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                this._searchIndex = Math.max(this._searchIndex - 1, -1);
                this.updateSearchHighlight(items);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (this._searchIndex >= 0 && items[this._searchIndex]) {
                    items[this._searchIndex].click();
                }
            } else if (e.key === 'Escape') {
                dropdown.style.display = 'none';
                searchInput.blur();
                this._searchIndex = -1;
            }
        });

        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'f' && App.currentView === 'dashboard') {
                e.preventDefault();
                searchInput.focus();
                searchInput.select();
            }
        });
    },

    /**
     * 执行搜索并渲染结果
     * @param {string} keyword - 搜索关键词
     * @param {HTMLElement} dropdown - 下拉菜单元素
     */
    async performSearch(keyword, dropdown) {
        this._searchIndex = -1;
        try {
            const [prompts, skills] = await Promise.all([
                API.getPrompts(keyword, 'all', ''),
                API.getSkills()
            ]);

            const lowerKeyword = keyword.toLowerCase();
            const filteredSkills = (skills || []).filter(s =>
                (s.name && s.name.toLowerCase().includes(lowerKeyword)) ||
                (s.description && s.description.toLowerCase().includes(lowerKeyword))
            );

            const results = [
                ...(prompts || []).map(p => ({ name: p.name, type: 'Prompt', id: p.id })),
                ...filteredSkills.map(s => ({ name: s.name, type: 'Skill', id: s.id }))
            ].slice(0, 8);

            if (results.length === 0) {
                dropdown.innerHTML = '<div class="search-dropdown-empty">未找到匹配结果</div>';
                dropdown.style.display = 'block';
                return;
            }

            let html = '';
            results.forEach(item => {
                const tagClass = item.type === 'Prompt' ? 'tag-blue' : 'tag-teal';
                const icon = item.type === 'Prompt'
                    ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>'
                    : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>';
                const highlightedName = DashboardView.highlightText(item.name, keyword);
                html += `
                    <div class="search-result-item" data-view="${item.type.toLowerCase()}s" data-id="${item.id}">
                        <div class="search-result-icon ${item.type === 'Prompt' ? 'search-icon-blue' : 'search-icon-teal'}">${icon}</div>
                        <span class="search-result-name">${highlightedName}</span>
                        <span class="tag tag-sm ${tagClass}">${item.type}</span>
                    </div>
                `;
            });
            dropdown.innerHTML = html;
            dropdown.style.display = 'block';

            dropdown.querySelectorAll('.search-result-item').forEach(el => {
                el.addEventListener('click', () => {
                    dropdown.style.display = 'none';
                    document.getElementById('global-search').value = '';
                    App.navigate(el.dataset.view, Number(el.dataset.id));
                });
            });
        } catch (err) {
            console.error('搜索失败:', err);
        }
    },

    /**
     * 更新搜索结果高亮状态
     * @param {NodeList} items - 搜索结果项列表
     */
    updateSearchHighlight(items) {
        items.forEach((item, index) => {
            if (index === this._searchIndex) {
                item.classList.add('search-result-active');
                item.scrollIntoView({ block: 'nearest' });
            } else {
                item.classList.remove('search-result-active');
            }
        });
    },

    /**
     * 高亮搜索关键词
     * @param {string} text - 原始文本
     * @param {string} keyword - 搜索关键词
     * @returns {string} 高亮后的 HTML
     */
    highlightText(text, keyword) {
        if (!text || !keyword) return escapeHtml(text);
        const escaped = escapeHtml(text);
        const escapedKeyword = escapeHtml(keyword);
        const regex = new RegExp(`(${escapedKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        return escaped.replace(regex, '<span class="search-highlight">$1</span>');
    },

    /**
     * 渲染最常用提示词列表到容器
     * @param {HTMLElement} container - 容器元素
     * @param {Array} prompts - 最常用的 Prompt 列表
     */
    renderPopularList(container, prompts) {
        const popularList = container.querySelector('#popular-list');
        if (!popularList) return;

        if (!prompts || prompts.length === 0) {
            popularList.innerHTML = `
                <div class="empty-state-small">
                    <p>暂无使用记录</p>
                </div>
            `;
            return;
        }

        const items = prompts.map(p => `
            <div class="popular-item" data-id="${p.id}">
                <div class="popular-item-header">
                    <span class="popular-item-name">${escapeHtml(p.name)}</span>
                    <span class="popular-item-count">${p.usage_count} 次使用</span>
                </div>
                <div class="popular-item-preview">${escapeHtml(p.content.substring(0, 80))}${p.content.length > 80 ? '...' : ''}</div>
            </div>
        `).join('');

        popularList.innerHTML = items;

        popularList.querySelectorAll('.popular-item').forEach(el => {
            el.addEventListener('click', () => App.navigate('prompts', Number(el.dataset.id)));
        });
    }
};
