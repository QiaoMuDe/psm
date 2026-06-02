/**
 * 仪表盘视图组件
 * 极简搜索首页，居中搜索框 + 快捷入口
 */
const DashboardView = {
    _searchTimer: null,

    /**
     * 渲染仪表盘视图
     * @param {HTMLElement} container - 容器元素
     */
    async render(container) {
        if (!this._template) {
            const resp = await fetch('html/dashboard.html');
            this._template = await resp.text();
        }
        container.innerHTML = this._template;
        this.bindSearchEvents();
        this.bindShortcuts(container);

        setTimeout(() => {
            const input = document.getElementById('global-search');
            if (input) input.focus();
        }, 100);
    },

    /**
     * 绑定快捷标签点击跳转
     * @param {HTMLElement} container - 容器元素
     */
    bindShortcuts(container) {
        container.querySelectorAll('.dashboard-shortcut-tag[data-view]').forEach(tag => {
            tag.addEventListener('click', () => App.navigate(tag.dataset.view));
        });
    },

    /**
     * 绑定搜索框和搜索按钮事件
     */
    bindSearchEvents() {
        const searchInput = document.getElementById('global-search');
        const dropdown = document.getElementById('search-dropdown');
        const searchBtn = document.getElementById('dashboard-search-btn');

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

        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                const keyword = searchInput.value.trim();
                if (keyword) {
                    DashboardView.performSearch(keyword, dropdown);
                }
            });
        }

        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const keyword = searchInput.value.trim();
                if (keyword) {
                    DashboardView.performSearch(keyword, dropdown);
                }
            }
        });

        if (DashboardView._docClickHandler) {
            document.removeEventListener('click', DashboardView._docClickHandler);
        }
        DashboardView._docClickHandler = (e) => {
            if (!e.target.closest('.global-search-wrapper')) {
                dropdown.style.display = 'none';
            }
        };
        document.addEventListener('click', DashboardView._docClickHandler);

        KeyboardNav.bind(searchInput, {
            getItems: () => dropdown.querySelectorAll('.search-result-item'),
            onEnter: (item) => item.click(),
            onEscape: () => { dropdown.style.display = 'none'; searchInput.blur(); },
        });

        if (DashboardView._docKeydownHandler) {
            document.removeEventListener('keydown', DashboardView._docKeydownHandler);
        }
        DashboardView._docKeydownHandler = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'f' && App.currentView === 'dashboard') {
                e.preventDefault();
                searchInput.focus();
                searchInput.select();
            }
        };
        document.addEventListener('keydown', DashboardView._docKeydownHandler);
    },

    /**
     * 执行搜索并渲染结果
     * @param {string} keyword - 搜索关键词
     * @param {HTMLElement} dropdown - 下拉菜单元素
     */
    async performSearch(keyword, dropdown) {
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
                const highlightedName = highlightText(item.name, keyword);
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
    }
};
