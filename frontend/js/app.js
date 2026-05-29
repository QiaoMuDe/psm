/**
 * 应用入口与 SPA 路由管理
 * 负责侧边栏导航切换和视图加载
 */
const App = {
    currentView: 'dashboard',
    loadedScripts: {},

    /** 初始化应用 */
    async init() {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                App.navigate(item.dataset.view);
            });
        });
        try {
            const settings = await API.getSettings();
            document.documentElement.setAttribute('data-theme', settings.app_theme || 'light');
        } catch (e) {
            // 忽略
        }
        App.navigate('dashboard');
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
