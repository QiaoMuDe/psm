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

        const navMap = { '1': 'dashboard', '2': 'prompts', '3': 'skills', '4': 'translate', '5': 'data', '6': 'settings' };
        if (!inInput && !combo.includes('+') && navMap[combo]) {
            App.navigate(navMap[combo]);
            e.preventDefault();
            return;
        }

        if (combo === 'ctrl+n') {
            if (App.currentView === 'prompts') {
                PromptsView.openCreateModal();
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
            { keys: '1 ~ 6', desc: '快速导航（仪表盘/提示词/技能/翻译/数据/设置）' },
            { keys: 'PgUp / PgDn', desc: '向上/向下翻页（提示词/技能列表）' },
            { keys: 'Ctrl + Home / End', desc: '滚动到顶部/底部（提示词/技能列表）' },
            { keys: 'Ctrl + ?', desc: '显示快捷键说明' },
        ];

        const batchKeys = [
            { keys: 'Delete', desc: '删除选中' },
            { keys: 'Ctrl + A', desc: '全选' },
            { keys: 'Ctrl + D', desc: '取消全选' },
        ];

        const translateKeys = [
            { keys: 'Ctrl + Enter', desc: '开始翻译' },
            { keys: 'Ctrl + L', desc: '清空原文和译文' },
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
                <div class="shortcut-section">
                    <div class="shortcut-section-title">翻译模块</div>
                    <table class="shortcut-table"><tbody>${renderTable(translateKeys)}</tbody></table>
                </div>
            </div>
        `;

        Modal.open('快捷键说明', content, { width: '480px' });
    }
};

/**
 * 下拉列表键盘导航工具
 * 统一处理 ArrowDown/ArrowUp/Enter/Escape 键盘导航逻辑
 * @param {HTMLElement|string} element - 接收键盘事件的元素或其 ID
 * @param {Object} options - 配置选项
 * @param {Function} options.getItems - 返回当前可见候选项列表 (() => NodeList|HTMLElement[])
 * @param {Function} options.onEnter - 回车选中回调 (item, index) => void
 * @param {Function} options.onEscape - Esc 关闭回调 () => void
 * @param {string} [options.highlightClass='highlight'] - 高亮 CSS 类名
 * @param {boolean} [options.allowCancel=true] - ArrowUp 是否允许取消选中（索引回到 -1）
 * @param {boolean} [options.enableScroll=true] - 高亮时是否自动滚动到可视区域
 * @returns {{ getIndex: () => number, reset: () => void }}
 */
const KeyboardNav = {
    bind(element, options) {
        const el = typeof element === 'string' ? document.getElementById(element) : element;
        if (!el) return { getIndex: () => -1, reset: () => {} };

        const {
            getItems,
            onEnter,
            onEscape,
            highlightClass = 'highlight',
            allowCancel = true,
            enableScroll = true,
        } = options;

        let index = -1;

        const update = () => {
            const items = getItems();
            Array.from(items).forEach((item, i) => {
                item.classList.toggle(highlightClass, i === index);
            });
            if (enableScroll && index >= 0 && items[index]) {
                items[index].scrollIntoView({ block: 'nearest' });
            }
        };

        el.addEventListener('keydown', (e) => {
            const items = getItems();
            if (!items || items.length === 0) return;

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                index = Math.min(index + 1, items.length - 1);
                update();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                index = Math.max(index - 1, allowCancel ? -1 : 0);
                update();
            } else if (e.key === 'Enter' && index >= 0 && items[index]) {
                e.preventDefault();
                onEnter(items[index], index);
            } else if (e.key === 'Escape') {
                onEscape();
            }
        });

        return {
            getIndex: () => index,
            setIndex: (i) => { index = i; update(); },
            reset: () => { index = -1; update(); },
        };
    },
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
            // 应用字体大小偏移量
            const fontSizeOffset = App.settings.font_size_offset || '0px';
            document.documentElement.style.setProperty('--font-size-offset', fontSizeOffset);
            // 应用字体族
            const fontFamily = App.settings.font_family || '';
            if (fontFamily) {
                document.documentElement.style.setProperty('--font-family', `'${fontFamily}', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`);
            }
            if (sidebar && App.settings.sidebar_collapsed === 'true') {
                sidebar.classList.add('collapsed');
            }
        } catch (e) {
            // 忽略
        }
        App.navigate('dashboard');
        ContextMenu.init();
        ShortcutManager.init();
        // 绑定 LOGO 点击事件
        const logoBtn = document.getElementById('app-logo-btn');
        const titleGroup = document.querySelector('.app-title-group');
        if (logoBtn) logoBtn.addEventListener('click', () => App.showAboutDialog());
        if (titleGroup) titleGroup.addEventListener('click', () => App.showAboutDialog());
        App.initGlobalDragDrop();
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
    async navigate(viewName, highlightId = null) {
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
                    await PromptsView.render(container, highlightId);
                    break;
                case 'skills':
                    await App.loadScript('js/views/skills.js');
                    await SkillsView.render(container, highlightId);
                    break;
                case 'translate':
                    await App.loadScript('js/views/translate.js');
                    await TranslateView.render(container);
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
    },

    /**
     * 显示关于弹窗（展示应用名称、版本号及快捷键说明入口）
     */
    async showAboutDialog() {
        let version = 'dev';
        try {
            const v = await API.getVersion();
            version = v.git_version && v.git_version !== 'unknown' ? v.git_version : 'dev';
        } catch (err) {
            // 使用默认值
        }

        const content = `
            <div class="about-dialog">
                <div class="about-logo">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                        <path d="M2 17l10 5 10-5"/>
                        <path d="M2 12l10 5 10-5"/>
                    </svg>
                </div>
                <div class="about-name">PSM</div>
                <div class="about-fullname">Skill & Prompt Manager</div>
                <div class="about-version">${escapeHtml(version)}</div>
                <div class="about-desc">统一管理 AI 开发中的 Skill（技能包）和 Prompt（提示词）</div>
                <div class="about-link">
                    <a href="#" id="about-project-link">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                        </svg>
                        gitee.com/MM-Q/psm
                    </a>
                </div>
                <div class="about-divider"></div>
                <div class="about-actions">
                    <button class="btn btn-default" id="about-shortcut-btn">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="12" cy="12" r="10"/>
                            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                            <line x1="12" y1="17" x2="12.01" y2="17"/>
                        </svg>
                        快捷键说明
                    </button>
                </div>
            </div>
        `;

        Modal.open('关于 PSM', content, { width: '360px' });

        document.getElementById('about-shortcut-btn').addEventListener('click', () => {
            Modal.close();
            setTimeout(() => {
                if (typeof ShortcutManager !== 'undefined') ShortcutManager.showHelp();
            }, 200);
        });

        document.getElementById('about-project-link').addEventListener('click', (e) => {
            e.preventDefault();
            if (window.runtime && window.runtime.BrowserOpenURL) {
                window.runtime.BrowserOpenURL('https://gitee.com/MM-Q/psm');
            }
        });
    },

    _dragCounter: 0,

    initGlobalDragDrop() {
        let dragBound = false;
        if (dragBound) return;
        dragBound = true;

        document.addEventListener('dragenter', (e) => {
            e.preventDefault();
            App._dragCounter++;
            if (App._dragCounter === 1) {
                const dz = document.getElementById('global-drop-zone');
                if (dz) dz.classList.add('active');
            }
        });

        document.addEventListener('dragover', (e) => {
            e.preventDefault();
        });

        document.addEventListener('dragleave', (e) => {
            e.preventDefault();
            App._dragCounter--;
            if (App._dragCounter <= 0) {
                App._dragCounter = 0;
                const dz = document.getElementById('global-drop-zone');
                if (dz) dz.classList.remove('active');
            }
        });

        document.addEventListener('drop', (e) => {
            e.preventDefault();
            App._dragCounter = 0;
            const dz = document.getElementById('global-drop-zone');
            if (dz) dz.classList.remove('active');
        });

        if (window.runtime && window.runtime.OnFileDrop) {
            console.log('[拖拽] 注册 OnFileDrop 回调 (useDropTarget=false)');
            window.runtime.OnFileDrop(async (x, y, paths) => {
                console.log('[拖拽] OnFileDrop 触发, paths:', paths);
                const zipPaths = paths.filter(p => p.toLowerCase().endsWith('.zip'));
                if (zipPaths.length === 0) {
                    Toast.warning('未检测到 ZIP 文件，请拖入 .zip 格式的技能包');
                    return;
                }

                Toast.info(`正在导入 ${zipPaths.length} 个 ZIP 文件...`);

                try {
                    let result;
                    if (zipPaths.length === 1) {
                        result = await API.importSkillAuto(zipPaths[0]);
                    } else {
                        result = await API.batchImportSkills(zipPaths);
                    }

                    let parts = [];
                    if (result.success > 0) parts.push(`成功 ${result.success}`);
                    if (result.skipped > 0) parts.push(`${result.skipped} 个已存在`);
                    if (result.failed > 0) parts.push(`失败 ${result.failed}`);

                    if (parts.length === 0) {
                        Toast.info('没有需要导入的技能');
                    } else if (result.failed > 0) {
                        let msg = `导入完成：${parts.join('，')}`;
                        if (result.errors && result.errors.length > 0) {
                            msg += '\n' + result.errors.slice(0, 3).join('\n');
                        }
                        Toast.warning(msg);
                    } else {
                        Toast.success(`导入完成：${parts.join('，')}`);
                    }

                    if (App.currentView !== 'skills') {
                        App.navigate('skills');
                    } else if (typeof SkillsView !== 'undefined') {
                        SkillsView.loadSkills();
                    }
                } catch (err) {
                    console.error('[拖拽] 导入失败:', err);
                }
            }, false);
        }
    }
};

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function parseTags(tagsValue) {
    if (Array.isArray(tagsValue)) return tagsValue;
    if (typeof tagsValue === 'string') {
        try {
            const parsed = JSON.parse(tagsValue || '[]');
            return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
            return [];
        }
    }
    return [];
}

function highlightText(text, keyword) {
    if (!keyword || !text) return escapeHtml(text);
    const escaped = escapeHtml(text);
    const re = new RegExp('(' + keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi');
    return escaped.replace(re, '<mark>$1</mark>');
}

function parseTemplateVars(content) {
    if (!content) return [];
    const matches = content.match(/\{\{(.+?)\}\}/g);
    if (!matches) return [];
    const seen = new Set();
    return matches.map(m => {
        const inner = m.slice(2, -2).trim();
        const pipeIndex = inner.indexOf('|');
        let name, defaultValue;
        if (pipeIndex === -1) {
            name = inner;
            defaultValue = '';
        } else {
            name = inner.substring(0, pipeIndex).trim();
            defaultValue = inner.substring(pipeIndex + 1).trim();
        }
        if (seen.has(name)) return null;
        seen.add(name);
        return { name, defaultValue };
    }).filter(Boolean);
}

function replaceTemplateVars(content, vars) {
    let result = content;
    for (const [name, value] of Object.entries(vars)) {
        const re = new RegExp('\\{\\{' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\}\\}', 'g');
        result = result.replace(re, value || '');
    }
    return result;
}

function showTemplateVarsModal(vars, callback) {
    let fieldsHtml = vars.map(v => {
        const hasDefault = v.defaultValue !== '';
        const placeholder = hasDefault ? `留空则使用 ${v.defaultValue}` : '留空则移除';
        return `
            <div class="template-var-row">
                <label class="var-label">{{${escapeHtml(v.name)}}}</label>
                <input type="text" class="form-input template-var-input" data-var="${escapeHtml(v.name)}" data-default="${escapeHtml(v.defaultValue)}" placeholder="${placeholder}" />
            </div>
        `;
    }).join('');

    const content = `
        <div class="template-vars-form">
            <div class="template-vars-list">
                ${fieldsHtml}
            </div>
            <div class="form-actions">
                <button type="button" class="btn btn-default" onclick="Modal.close()">取消</button>
                <button type="button" class="btn btn-primary" id="template-copy-btn">复制到剪贴板</button>
            </div>
        </div>
    `;

    Modal.open('填写模板变量', content);

    document.getElementById('template-copy-btn').addEventListener('click', () => {
        const values = {};
        document.querySelectorAll('.template-var-input').forEach(input => {
            const val = input.value.trim();
            values[input.dataset.var] = val || input.dataset.default;
        });
        Modal.close();
        callback(values);
    });
}

/**
 * 定位弹出菜单，确保不超出视口边界
 * @param {HTMLElement} el - 要定位的元素
 * @param {number} x - 期望的 X 坐标
 * @param {number} y - 期望的 Y 坐标
 */
function positionPopup(el, x, y) {
    const rect = el.getBoundingClientRect();
    const viewW = window.innerWidth;
    const viewH = window.innerHeight;
    let left = x;
    let top = y;
    if (x + rect.width > viewW) left = x - rect.width;
    if (y + rect.height > viewH) top = y - rect.height;
    if (left < 0) left = 0;
    if (top < 0) top = 0;
    el.style.left = left + 'px';
    el.style.top = top + 'px';
}

/**
 * AI 操作按钮组件
 * 将"生成"和"优化"合并为一个下拉按钮，支持 idle/loading/restore 三种状态
 */
const AIActionButton = {
    _instances: new Map(),

    /**
     * 初始化 AI 操作按钮
     * @param {string} wrapId - .ai-action-btn-wrap 容器的 ID
     * @param {Object} config - 配置项
     * @param {string} config.targetFieldId - 目标输入框/文本域的 ID
     * @param {Array<{type: string, label: string, apiMethod: Function, sourceFieldId?: string, emptyMsg?: string}>} config.actions - 可用操作列表
     */
    init(wrapId, config) {
        const wrap = document.getElementById(wrapId);
        if (!wrap) return;
        const targetField = document.getElementById(config.targetFieldId);
        if (!targetField) return;

        this.cleanup(wrapId);

        var aiIcon = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>';
        var optimizeIcon = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>';
        var chevronIcon = '<svg class="ai-action-chevron" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>';
        var spinnerHtml = '<div class="ai-gen-spinner" style="width:14px;height:14px;border-width:2px;"></div>';
        var restoreIcon = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>';
        const state = { mode: 'idle', originalContent: null, accumulated: '', streamInstance: null, safetyTimer: null };

        wrap.innerHTML = '';
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'ai-action-btn';
        btn.innerHTML = aiIcon + ' AI ' + chevronIcon;
        wrap.appendChild(btn);

        const dropdown = document.createElement('div');
        dropdown.className = 'ai-action-dropdown';
        config.actions.forEach(function(action) {
            const item = document.createElement('button');
            item.type = 'button';
            item.className = 'ai-action-dropdown-item';
            item.tabIndex = 0;
            const icon = action.type === 'generate' ? aiIcon : optimizeIcon;
            item.innerHTML = icon + ' ' + action.label;
            item.addEventListener('click', function(e) {
                e.stopPropagation();
                closeDropdown();
                executeAction(action);
            });
            dropdown.appendChild(item);
        });
        dropdown.addEventListener('keydown', function(e) {
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === 'Escape' || e.key === 'Tab') {
                e.stopPropagation();
                e.preventDefault();
            }
            if (e.key === 'ArrowDown') {
                var items = dropdown.querySelectorAll('.ai-action-dropdown-item');
                var idx = Array.from(items).indexOf(document.activeElement);
                if (idx < items.length - 1) items[idx + 1].focus();
            } else if (e.key === 'ArrowUp') {
                var items = dropdown.querySelectorAll('.ai-action-dropdown-item');
                var idx = Array.from(items).indexOf(document.activeElement);
                if (idx > 0) items[idx - 1].focus();
            } else if (e.key === 'Enter') {
                var items = dropdown.querySelectorAll('.ai-action-dropdown-item');
                var idx = Array.from(items).indexOf(document.activeElement);
                if (idx >= 0) items[idx].click();
            } else if (e.key === 'Escape') {
                closeDropdown();
                btn.focus();
            }
        });
        wrap.appendChild(dropdown);

        function closeDropdown() {
            wrap.classList.remove('open');
        }

        function setMode(mode, actionLabel) {
            state.mode = mode;
            var row = targetField.closest('.ai-optimize-row');
            if (mode === 'idle') {
                btn.disabled = false;
                btn.className = 'ai-action-btn';
                btn.innerHTML = aiIcon + ' AI ' + chevronIcon;
                if (row) row.classList.remove('ai-optimize-loading');
            } else if (mode === 'loading') {
                btn.disabled = true;
                btn.className = 'ai-action-btn';
                btn.innerHTML = spinnerHtml + ' ' + (actionLabel || '处理中') + '...';
                if (row) row.classList.add('ai-optimize-loading');
            } else if (mode === 'restore') {
                btn.disabled = false;
                btn.className = 'ai-action-btn ai-action-btn--restore';
                btn.innerHTML = restoreIcon + ' 还原';
                if (row) row.classList.remove('ai-optimize-loading');
                targetField.focus();
            }
        }

        async function executeAction(action) {
            if (state.mode === 'loading') return;
            var content;
            if (action.sourceFieldId) {
                var sourceField = document.getElementById(action.sourceFieldId);
                content = sourceField ? sourceField.value.trim() : '';
            } else {
                content = targetField.value.trim();
            }
            if (!content) {
                Toast.warning(action.emptyMsg || '请先输入内容');
                return;
            }
            var settings = (await API.getSettings()) || {};
            if (!settings.ai_api_key) {
                Toast.warning('请先在设置页配置 AI API Key');
                return;
            }

            state.originalContent = targetField.value;
            state.accumulated = '';
            var prevReadOnly = targetField.readOnly;
            var prevDisabled = targetField.disabled;

            targetField.focus();
            if (action.type === 'generate') {
                targetField.readOnly = true;
            } else {
                targetField.disabled = true;
            }
            setMode('loading', action.label);

            if (state.streamInstance) state.streamInstance.cleanup();

            state.safetyTimer = setTimeout(function() {
                state.streamInstance = null;
                targetField.readOnly = prevReadOnly;
                targetField.disabled = prevDisabled;
                setMode('idle');
                Toast.error('AI 操作超时，请检查 AI 配置或系统提示词是否已配置');
            }, 30000);

            state.streamInstance = withAIStream(action.apiMethod, {
                onToken: function(token) {
                    state.accumulated += token;
                    targetField.value = state.accumulated;
                    targetField.dispatchEvent(new Event('input'));
                },
                onDone: function() {
                    state.streamInstance = null;
                    clearTimeout(state.safetyTimer);
                    targetField.readOnly = prevReadOnly;
                    targetField.disabled = prevDisabled;
                    Toast.success(action.type === 'generate' ? '生成完成' : '优化完成');
                    setMode('restore');
                },
                onError: function(errMsg) {
                    state.streamInstance = null;
                    clearTimeout(state.safetyTimer);
                    targetField.value = state.originalContent;
                    targetField.dispatchEvent(new Event('input'));
                    targetField.readOnly = prevReadOnly;
                    targetField.disabled = prevDisabled;
                    setMode('idle');
                    Toast.error(errMsg);
                }
            });

            if (!state.streamInstance) {
                targetField.readOnly = prevReadOnly;
                targetField.disabled = prevDisabled;
                setMode('idle');
                return;
            }

            await state.streamInstance.call(content);
        }

        btn.addEventListener('mousedown', function(e) {
            if (state.mode === 'restore') {
                e.preventDefault();
            }
        });

        btn.addEventListener('click', function() {
            if (state.mode === 'loading') return;
            if (state.mode === 'restore') {
                if (state.originalContent !== null) {
                    targetField.value = state.originalContent;
                    targetField.dispatchEvent(new Event('input'));
                }
                state.originalContent = null;
                setMode('idle');
                return;
            }
            wrap.classList.toggle('open');
            if (wrap.classList.contains('open')) {
                var firstItem = dropdown.querySelector('.ai-action-dropdown-item');
                if (firstItem) firstItem.focus();
            }
        });

        var blurHandler = function() {
            setTimeout(function() {
                closeDropdown();
                if (state.mode === 'restore') {
                    state.originalContent = null;
                    setMode('idle');
                }
            }, 0);
        };

        var docClickHandler = function(e) {
            if (!wrap.contains(e.target)) closeDropdown();
        };

        targetField.addEventListener('blur', blurHandler);
        document.addEventListener('click', docClickHandler);

        this._instances.set(wrapId, {
            cleanup: function() {
                if (state.streamInstance) state.streamInstance.cleanup();
                clearTimeout(state.safetyTimer);
            },
            blurHandler: blurHandler,
            docClickHandler: docClickHandler,
            targetField: targetField
        });
    },

    /**
     * 清理指定按钮实例的事件监听和流式连接
     * @param {string} wrapId - 容器 ID
     */
    cleanup(wrapId) {
        var instance = this._instances.get(wrapId);
        if (instance) {
            instance.cleanup();
            if (instance.blurHandler && instance.targetField) {
                instance.targetField.removeEventListener('blur', instance.blurHandler);
            }
            if (instance.docClickHandler) {
                document.removeEventListener('click', instance.docClickHandler);
            }
            this._instances.delete(wrapId);
        }
    },

    /**
     * 清理所有按钮实例
     */
    cleanupAll() {
        var self = this;
        this._instances.forEach(function(instance, id) {
            instance.cleanup();
        });
        this._instances.clear();
    }
};

/**
 * 批量操作 Mixin
 * 提供 PromptsView 和 SkillsView 共享的批量管理、视图滚动、高亮等方法
 * 各视图通过 this._batchConfig 注入差异化的 DOM ID 和回调
 */
const BatchMixin = {
    /**
     * 绑定视图内容区域的键盘滚动快捷键（Ctrl+Home/End, PgUp/PgDn）
     * @param {HTMLElement} container - 视图容器
     */
    bindViewScroll(container) {
        const handler = (e) => {
            if (e.target.closest('.modal-overlay')) return;
            if (e.target.matches('input, textarea, select')) return;
            const viewContent = container.querySelector('.view-content');
            if (!viewContent) return;
            if (e.ctrlKey && e.key === 'Home') {
                e.preventDefault();
                viewContent.scrollTop = 0;
            } else if (e.ctrlKey && e.key === 'End') {
                e.preventDefault();
                viewContent.scrollTop = viewContent.scrollHeight;
            } else if (e.key === 'PageUp') {
                e.preventDefault();
                viewContent.scrollTop -= viewContent.clientHeight;
            } else if (e.key === 'PageDown') {
                e.preventDefault();
                viewContent.scrollTop += viewContent.clientHeight;
            }
        };
        document.addEventListener('keydown', handler);
        this._viewScrollHandler = handler;
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
     * 同步批量管理模式的 DOM 状态
     */
    syncBatchMode() {
        var cfg = this._batchConfig;
        var listEl = document.getElementById(cfg.listId);
        if (!listEl) return;
        var viewContent = listEl.closest('.view-content') || listEl.parentElement;
        var wrapper = viewContent.closest('.view-toolbar') || viewContent.parentElement;
        if (wrapper) {
            wrapper.classList.toggle('batch-mode', this.batchMode);
        }
        var bar = document.getElementById(cfg.batchBarId);
        if (bar) {
            bar.style.display = this.batchMode ? 'flex' : 'none';
        }
        var btn = document.getElementById(cfg.batchManageBtnId);
        if (btn) {
            btn.classList.toggle('btn-primary', this.batchMode);
            btn.classList.toggle('btn-default', !this.batchMode);
        }
        if (!this.batchMode) {
            listEl.querySelectorAll('input[type="checkbox"]').forEach(function(cb) { cb.checked = false; });
            var selectAll = document.getElementById(cfg.selectAllId);
            if (selectAll) selectAll.checked = false;
        }
    },

    /**
     * 更新批量操作栏的显示状态和选中计数
     */
    updateBatchBar() {
        var cfg = this._batchConfig;
        var bar = document.getElementById(cfg.batchBarId);
        var countEl = document.getElementById(cfg.selectedCountId);
        if (bar && countEl) {
            var count = this.selectedIds.size;
            bar.style.display = this.batchMode ? 'flex' : 'none';
            countEl.textContent = count + ' 项已选';
        }
        this.syncSelectionUI();
    },

    /**
     * 同步选中状态的视觉反馈（高亮行/卡片）
     */
    syncSelectionUI() {
        var listId = this._batchConfig.listId;
        document.querySelectorAll('#' + listId + ' tr[data-id]').forEach(function(row) {
            var id = Number(row.dataset.id);
            row.classList.toggle('row-selected', this.selectedIds.has(id));
        }.bind(this));
        document.querySelectorAll('#' + listId + ' .item-card[data-id]').forEach(function(card) {
            var id = Number(card.dataset.id);
            card.classList.toggle('card-selected', this.selectedIds.has(id));
        }.bind(this));
    },

    /**
     * 切换全选/取消全选状态
     * @param {boolean} checked - true 全选，false 取消全选
     */
    toggleSelectAll(checked) {
        var cfg = this._batchConfig;
        var container = document.getElementById(cfg.listId);
        if (!container) return;
        var cbSelector = this.currentView === 'card' ? '.card-checkbox' : '.row-checkbox';
        container.querySelectorAll(cbSelector).forEach(function(cb) {
            cb.checked = checked;
            var id = Number(cb.dataset.id);
            if (checked) {
                this.selectedIds.add(id);
            } else {
                this.selectedIds.delete(id);
            }
        }.bind(this));
        var selectAll = document.getElementById(cfg.selectAllId);
        if (selectAll) selectAll.checked = checked;
        this.updateBatchBar();
    },

    /**
     * 绑定 checkbox 选择事件（全选/单选）
     * @param {HTMLElement} container - 包含 checkbox 的容器元素
     */
    bindCheckboxEvents(container) {
        var cfg = this._batchConfig;
        var selectAll = document.getElementById(cfg.selectAllId);
        var cbSelector = '.row-checkbox, .card-checkbox';
        var self = this;
        if (selectAll) {
            selectAll.addEventListener('change', function() {
                container.querySelectorAll(cbSelector).forEach(function(cb) {
                    cb.checked = selectAll.checked;
                    var id = Number(cb.dataset.id);
                    if (selectAll.checked) {
                        self.selectedIds.add(id);
                    } else {
                        self.selectedIds.delete(id);
                    }
                });
                self.updateBatchBar();
            });
        }

        container.querySelectorAll('.row-checkbox, .card-checkbox').forEach(function(cb) {
            cb.addEventListener('change', function() {
                var id = Number(cb.dataset.id);
                if (cb.checked) {
                    self.selectedIds.add(id);
                } else {
                    self.selectedIds.delete(id);
                }
                if (selectAll) {
                    var allCbs = container.querySelectorAll(cbSelector);
                    selectAll.checked = allCbs.length > 0 && self.selectedIds.size === allCbs.length;
                }
                self.updateBatchBar();
            });
        });
    },

    /**
     * 处理批量添加标签
     */
    handleBatchAddTags() {
        var cfg = this._batchConfig;
        if (this.selectedIds.size === 0) { Toast.warning('请先选择要操作的' + cfg.entityLabel); return; }
        var self = this;
        Modal.open('添加标签', '\
            <div style="padding:16px">\
                <label class="form-label">标签（逗号分隔）</label>\
                <input type="text" class="form-input" id="' + cfg.tagInputId + '" placeholder="标签1, 标签2, ..." />\
            </div>\
            <div class="form-actions">\
                <button type="button" class="btn btn-default" id="' + cfg.tagCancelId + '">取消</button>\
                <button type="button" class="btn btn-primary" id="' + cfg.tagConfirmId + '">确认</button>\
            </div>');
        document.getElementById(cfg.tagCancelId).addEventListener('click', function() { Modal.close(); });
        document.getElementById(cfg.tagConfirmId).addEventListener('click', async function() {
            var val = document.getElementById(cfg.tagInputId).value.trim();
            if (!val) { Toast.warning('请输入标签'); return; }
            var tags = val.split(',').map(function(t) { return t.trim(); }).filter(Boolean);
            try {
                await cfg.batchAddTagsApi([...self.selectedIds], tags);
                Toast.success('已为 ' + self.selectedIds.size + ' 个' + cfg.entityLabel + '添加标签');
                Modal.close();
                self.selectedIds.clear();
                cfg.loadAll();
            } catch (e) { Toast.error('操作失败: ' + e.message); }
        });
    },

    /**
     * 处理批量移除标签
     */
    handleBatchRemoveTags() {
        var cfg = this._batchConfig;
        if (this.selectedIds.size === 0) { Toast.warning('请先选择要操作的' + cfg.entityLabel); return; }
        var self = this;
        var allItems = cfg.getAllItems();
        var allTags = new Set();
        [...this.selectedIds].forEach(function(id) {
            var item = allItems.find(function(x) { return x.id === id; });
            if (item) {
                parseTags(item.tags).forEach(function(x) { allTags.add(x); });
            }
        });
        if (allTags.size === 0) { Toast.info('选中的' + cfg.entityLabel + '没有标签'); return; }
        var tagsHtml = [...allTags].map(function(t) {
            return '<label class="batch-remove-tag-item"><input type="checkbox" class="' + cfg.removeTagCbClass + '" value="' + escapeHtml(t) + '" checked /> <span class="tag tag-sm">' + escapeHtml(t) + '</span></label>';
        }).join('');
        Modal.open('移除标签', '\
            <div class="batch-remove-tags-wrap">\
                <div class="batch-remove-tags-header">\
                    <span class="batch-remove-tags-label">勾选要移除的标签</span>\
                    <div class="batch-remove-tags-actions">\
                        <button type="button" class="btn btn-xs btn-default" id="' + cfg.removeTagSelectAllId + '">全选</button>\
                        <button type="button" class="btn btn-xs btn-default" id="' + cfg.removeTagDeselectAllId + '">取消全选</button>\
                    </div>\
                </div>\
                <div class="batch-remove-tags-list">' + tagsHtml + '</div>\
            </div>\
            <div class="form-actions">\
                <button type="button" class="btn btn-default" id="' + cfg.removeTagCancelId + '">取消</button>\
                <button type="button" class="btn btn-primary" id="' + cfg.removeTagConfirmId + '">确认</button>\
            </div>');
        document.getElementById(cfg.removeTagCancelId).addEventListener('click', function() { Modal.close(); });
        document.getElementById(cfg.removeTagSelectAllId).addEventListener('click', function() {
            document.querySelectorAll('.' + cfg.removeTagCbClass).forEach(function(cb) { cb.checked = true; });
        });
        document.getElementById(cfg.removeTagDeselectAllId).addEventListener('click', function() {
            document.querySelectorAll('.' + cfg.removeTagCbClass).forEach(function(cb) { cb.checked = false; });
        });
        document.getElementById(cfg.removeTagConfirmId).addEventListener('click', async function() {
            var toRemove = [];
            document.querySelectorAll('.' + cfg.removeTagCbClass).forEach(function(cb) { if (cb.checked) toRemove.push(cb.value); });
            if (toRemove.length === 0) { Toast.info('请勾选要移除的标签'); return; }
            try {
                await cfg.batchRemoveTagsApi([...self.selectedIds], toRemove);
                Toast.success('已从 ' + self.selectedIds.size + ' 个' + cfg.entityLabel + '中移除 ' + toRemove.length + ' 个标签');
                Modal.close();
                self.selectedIds.clear();
                cfg.loadAll();
            } catch (e) { Toast.error('操作失败: ' + e.message); }
        });
    },

    /**
     * 处理批量置顶/取消置顶
     * @param {boolean} pinned - true 置顶，false 取消置顶
     */
    handleBatchSetPin(pinned) {
        var cfg = this._batchConfig;
        if (this.selectedIds.size === 0) { Toast.warning('请先选择要操作的' + cfg.entityLabel); return; }
        var self = this;
        cfg.batchSetPinApi([...this.selectedIds], pinned).then(function() {
            Toast.success(pinned ? '已置顶' : '已取消置顶');
            self.selectedIds.clear();
            cfg.loadAll();
        }).catch(function(e) { Toast.error('操作失败: ' + e.message); });
    },
};

/**
 * 使用 AI 流式事件注册，统一管理 ai:token/ai:done/ai:error 事件
 * @param {Function} apiMethod - 调用 API 的方法，接收剩余参数
 * @param {Object} callbacks - 回调对象
 * @param {Function} [callbacks.onToken] - 收到 token 回调
 * @param {Function} [callbacks.onDone] - 完成回调
 * @param {Function} [callbacks.onError] - 错误回调
 * @returns {{ cleanup: Function, call: Function }}
 */
let _activeStream = null;
let _aiGeneration = 0;

function withAIStream(apiMethod, callbacks) {
    const { onToken, onDone, onError } = callbacks;

    if (_activeStream) {
        if (onError) onError('有 AI 操作正在执行中，请等待完成');
        return null;
    }

    var generation = ++_aiGeneration;

    const cleanup = () => {
        if (_activeStream && _activeStream.generation === generation) {
            _activeStream = null;
        }
    };

    if (window.runtime && window.runtime.EventsOn) {
        window.runtime.EventsOn('ai:token', function(token) {
            if (_aiGeneration !== generation) return;
            if (onToken) onToken(token);
        });

        window.runtime.EventsOn('ai:done', function() {
            if (_aiGeneration !== generation) return;
            cleanup();
            if (onDone) onDone();
        });

        window.runtime.EventsOn('ai:error', function(errMsg) {
            if (_aiGeneration !== generation) return;
            cleanup();
            if (onError) onError(errMsg);
        });
    }

    _activeStream = { cleanup, generation };

    return {
        cleanup,
        call: async (...args) => {
            try {
                await apiMethod(...args);
            } catch (err) {
                cleanup();
                if (onError) onError(err.message || '操作失败');
            }
        }
    };
}

/**
 * 复制文本到剪贴板
 * 优先使用 navigator.clipboard.writeText，失败时回退到 textarea + execCommand 模式
 * @param {string} text - 要复制的文本
 * @returns {Promise<void>}
 */
function copyToClipboard(text) {
    return new Promise(async (resolve) => {
        try {
            await navigator.clipboard.writeText(text);
            resolve();
        } catch (err) {
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.left = '-9999px';
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            resolve();
        }
    });
}

document.addEventListener('DOMContentLoaded', () => App.init());
