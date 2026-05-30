/**
 * 应用入口与 SPA 路由管理
 * 负责侧边栏导航切换和视图加载
 */

const ShortcutManager = {
    handlers: {},
    viewShortcuts: {},

    /** 初始化快捷键监听器 */
    init() {
        document.addEventListener('keydown', (e) => this.handleKeydown(e));
    },

    /**
     * 注册视图级快捷键
     * @param {string} viewName - 视图名称
     * @param {Object} shortcuts - 快捷键映射 { combo: handler }
     */
    registerView(viewName, shortcuts) {
        this.viewShortcuts[viewName] = shortcuts;
    },

    /**
     * 注销视图级快捷键
     * @param {string} viewName - 视图名称
     */
    unregisterView(viewName) {
        delete this.viewShortcuts[viewName];
    },

    /**
     * 将键盘事件解析为组合键字符串
     * @param {KeyboardEvent} e - 键盘事件
     * @returns {string} 组合键字符串，如 "ctrl+n"
     */
    parseEvent(e) {
        const parts = [];
        if (e.ctrlKey) parts.push('ctrl');
        if (e.shiftKey) parts.push('shift');
        if (e.altKey) parts.push('alt');
        if (e.metaKey) parts.push('meta');
        const key = e.key.toLowerCase();
        if (!['control', 'shift', 'alt', 'meta'].includes(key)) {
            parts.push(key);
        }
        return parts.join('+');
    },

    /** 核心快捷键分发逻辑 */
    handleKeydown(e) {
        const combo = this.parseEvent(e);
        const tag = (e.target.tagName || '').toLowerCase();
        const inInput = tag === 'input' || tag === 'textarea' || e.target.isContentEditable;
        const modalOpen = !!document.getElementById('modal-overlay');

        if (combo === 'escape') {
            if (modalOpen) {
                if (typeof Modal !== 'undefined') Modal.close();
                e.preventDefault();
                return;
            }
            if (App.currentView === 'prompts' && PromptsView.batchMode) {
                PromptsView.exitBatchMode();
                e.preventDefault();
                return;
            }
            if (App.currentView === 'skills' && SkillsView.batchMode) {
                SkillsView.exitBatchMode();
                e.preventDefault();
                return;
            }
            return;
        }

        if (modalOpen) return;

        const navMap = { '1': 'dashboard', '2': 'prompts', '3': 'skills', '4': 'data', '5': 'settings' };
        if (!inInput && !combo.includes('+') && navMap[combo]) {
            App.navigate(navMap[combo]);
            e.preventDefault();
            return;
        }

        if (combo === 'ctrl+n') {
            if (App.currentView === 'prompts') {
                PromptsView.openCreateModal();
            } else if (App.currentView === 'skills') {
                SkillsView.openCreateModal();
            }
            e.preventDefault();
            return;
        }

        if (combo === 'ctrl+f' && !inInput) {
            const searchMap = { prompts: 'prompt-search', skills: 'skill-search' };
            const searchId = searchMap[App.currentView];
            if (searchId) {
                const input = document.getElementById(searchId);
                if (input) { input.focus(); input.select(); }
            }
            e.preventDefault();
            return;
        }

        if (combo === 'ctrl+s' && App.currentView === 'settings') {
            const saveBtn = document.getElementById('save-settings-btn');
            if (saveBtn) saveBtn.click();
            e.preventDefault();
            return;
        }

        const viewShortcuts = this.viewShortcuts[App.currentView];
        if (viewShortcuts && viewShortcuts[combo]) {
            viewShortcuts[combo](e);
            return;
        }

        if (combo === 'ctrl+shift+?' && !inInput) {
            this.showHelp();
            e.preventDefault();
        }
    },

    /** 弹出快捷键说明弹窗 */
    showHelp() {
        const shortcutKeys = [
            { keys: 'Ctrl + N', desc: '新建' },
            { keys: 'Ctrl + F', desc: '搜索' },
            { keys: 'Ctrl + S', desc: '保存设置' },
            { keys: 'Escape', desc: '关闭弹窗 / 退出批量模式' },
            { keys: '1 ~ 5', desc: '快速导航（仪表盘/提示词/技能/数据/设置）' },
            { keys: 'Ctrl + ?', desc: '显示快捷键说明' },
        ];

        const batchKeys = [
            { keys: 'Delete', desc: '删除选中' },
            { keys: 'Ctrl + A', desc: '全选' },
            { keys: 'Ctrl + D', desc: '取消全选' },
        ];

        const renderTable = (items) => items.map(item =>
            `<tr><td class="shortcut-key-cell"><kbd>${item.keys}</kbd></td><td class="shortcut-desc-cell">${item.desc}</td></tr>`
        ).join('');

        const content = `
            <div class="shortcut-help">
                <div class="shortcut-section">
                    <div class="shortcut-section-title">全局</div>
                    <table class="shortcut-table"><tbody>${renderTable(shortcutKeys)}</tbody></table>
                </div>
                <div class="shortcut-section">
                    <div class="shortcut-section-title">提示词 / 技能模块（批量模式下）</div>
                    <table class="shortcut-table"><tbody>${renderTable(batchKeys)}</tbody></table>
                </div>
            </div>
        `;

        Modal.open('快捷键说明', content, { width: '480px' });
    }
};
const App = {
    currentView: 'dashboard',
    loadedScripts: {},
    settings: {},

    /** 初始化应用 */
    async init() {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                App.navigate(item.dataset.view);
            });
        });

        const sidebar = document.getElementById('sidebar');
        const toggleBtn = document.getElementById('sidebar-toggle');
        if (sidebar && toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                const collapsed = sidebar.classList.toggle('collapsed');
                API.updateSetting('sidebar_collapsed', String(collapsed));
            });
        }

        try {
            App.settings = await API.getSettings();
            document.documentElement.setAttribute('data-theme', App.settings.app_theme || 'light');
            if (sidebar && App.settings.sidebar_collapsed === 'true') {
                sidebar.classList.add('collapsed');
            }
        } catch (e) {
            // 忽略
        }
        App.navigate('dashboard');
        ContextMenu.init();
        ShortcutManager.init();
    },

    /**
     * 加载视图脚本（仅加载一次）
     * @param {string} path - 脚本路径
     * @returns {Promise<void>}
     */
    loadScript(path) {
        if (App.loadedScripts[path]) return Promise.resolve();
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = path;
            script.onload = () => {
                App.loadedScripts[path] = true;
                resolve();
            };
            script.onerror = () => reject(new Error('脚本加载失败: ' + path));
            document.head.appendChild(script);
        });
    },

    /** 导航到指定视图 */
    async navigate(viewName) {
        App.currentView = viewName;
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.view === viewName);
        });
        const container = document.getElementById('view-container');
        container.innerHTML = '<div class="loading">加载中...</div>';
        try {
            switch (viewName) {
                case 'dashboard':
                    await App.loadScript('js/views/dashboard.js');
                    await DashboardView.render(container);
                    break;
                case 'prompts':
                    await App.loadScript('js/views/prompts.js');
                    await PromptsView.render(container);
                    break;
                case 'skills':
                    await App.loadScript('js/views/skills.js');
                    await SkillsView.render(container);
                    break;
                case 'data':
                    await App.loadScript('js/views/data.js');
                    await DataView.render(container);
                    break;
                case 'settings':
                    await App.loadScript('js/views/settings.js');
                    await SettingsView.render(container);
                    break;
                default:
                    container.innerHTML = '<div class="empty-state">页面不存在</div>';
            }
        } catch (err) {
            container.innerHTML = `
                <div class="empty-state">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" style="opacity: 0.3; margin-bottom: 12px;">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="8" x2="12" y2="12"/>
                        <line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    <div class="empty-state-text">加载失败</div>
                    <div class="empty-state-hint">${escapeHtml(err.message || '请检查后端服务是否启动')}</div>
                </div>`;
        }
    }
};

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

document.addEventListener('DOMContentLoaded', () => App.init());
