/**
 * 翻译模块视图组件
 * 提供独立的文本翻译功能，支持 6 种常用语言，流式显示译文
 */
const TranslateView = {
    translating: false,
    tokenUnlisten: null,
    doneUnlisten: null,
    errorUnlisten: null,

    /**
     * 渲染翻译模块视图
     * @param {HTMLElement} container - 容器元素
     */
    async render(container) {
        container.innerHTML = `
            <div class="translate-page">
                <div class="translate-header">
                    <div class="translate-lang-bar">
                        <select class="form-select translate-lang-select" id="translate-source-lang">
                            <option value="简体中文">简体中文</option>
                            <option value="English">English</option>
                            <option value="日本語">日本語</option>
                            <option value="한국어">한국어</option>
                            <option value="Français">Français</option>
                            <option value="Deutsch">Deutsch</option>
                        </select>
                        <button class="btn btn-ghost btn-sm" id="translate-swap-btn" title="交换语言和文本">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <polyline points="17 1 21 5 17 9"/>
                                <path d="M3 11V9a4 4 0 0 1 4-4h14"/>
                                <polyline points="7 23 3 19 7 15"/>
                                <path d="M21 13v2a4 4 0 0 1-4 4H3"/>
                            </svg>
                        </button>
                        <select class="form-select translate-lang-select" id="translate-target-lang">
                            <option value="English">English</option>
                            <option value="简体中文">简体中文</option>
                            <option value="日本語">日本語</option>
                            <option value="한국어">한국어</option>
                            <option value="Français">Français</option>
                            <option value="Deutsch">Deutsch</option>
                        </select>
                    </div>
                    <button class="btn btn-primary" id="translate-btn">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M5 8l6 0"/>
                            <path d="M4 6l7.586 0.001a2 2 0 0 1 1.414 0.586l2.003 2.003a2 2 0 0 0 1.414 0.586L15 8.001"/>
                            <path d="M14 16l-3.5 0"/>
                            <path d="M15 15l0 -3.5"/>
                            <path d="M12.5 15l-4 0"/>
                            <path d="M15 18l-3.5 0"/>
                            <path d="M9 18l0 -3.5"/>
                        </svg>
                        翻译
                    </button>
                </div>
                <div class="translate-panels">
                    <div class="translate-panel">
                        <div class="translate-panel-header">
                            <span class="translate-panel-label">原文</span>
                            <div class="translate-panel-actions">
                                <button class="btn btn-ghost btn-xs" id="translate-copy-source" title="复制原文">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                                </button>
                                <button class="btn btn-ghost btn-xs" id="translate-clear-source" title="清空原文">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                                </button>
                            </div>
                        </div>
                        <div class="translate-panel-body">
                            <textarea class="translate-textarea" id="translate-source" placeholder="输入要翻译的内容..." rows="6"></textarea>
                        </div>
                        <div class="translate-panel-footer">
                            <span class="char-count" id="translate-source-count">0 字</span>
                        </div>
                    </div>
                    <div class="translate-panel-divider">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M5 12h14"/>
                            <path d="M12 5l7 7-7 7"/>
                        </svg>
                    </div>
                    <div class="translate-panel">
                        <div class="translate-panel-header">
                            <span class="translate-panel-label">译文</span>
                            <div class="translate-panel-actions">
                                <button class="btn btn-ghost btn-xs" id="translate-copy-target" title="复制译文">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                                </button>
                                <button class="btn btn-ghost btn-xs" id="translate-clear-target" title="清空译文">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                                </button>
                            </div>
                        </div>
                        <div class="translate-panel-body">
                            <textarea class="translate-textarea" id="translate-target" placeholder="翻译结果将显示在这里..." readonly rows="6"></textarea>
                        </div>
                        <div class="translate-panel-footer">
                            <span class="char-count" id="translate-target-count">0 字</span>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.bindEvents();
    },

    /**
     * 绑定所有事件监听器
     */
    bindEvents() {
        document.getElementById('translate-btn').addEventListener('click', () => this.translate());
        document.getElementById('translate-swap-btn').addEventListener('click', () => this.swapLanguages());
        document.getElementById('translate-clear-source').addEventListener('click', () => this.clearSource());
        document.getElementById('translate-clear-target').addEventListener('click', () => this.clearTarget());
        document.getElementById('translate-copy-source').addEventListener('click', () => this.copySource());
        document.getElementById('translate-copy-target').addEventListener('click', () => this.copyTarget());

        document.getElementById('translate-source').addEventListener('input', () => this.updateCharCount());

        document.addEventListener('keydown', this._handleKeydown);
    },

    /**
     * 键盘快捷键处理
     * @param {KeyboardEvent} e - 键盘事件
     */
    _handleKeydown(e) {
        if (App.currentView !== 'translate') return;
        const combo = [e.ctrlKey && 'ctrl', e.shiftKey && 'shift', e.altKey && 'alt', e.key.toLowerCase()].filter(Boolean).join('+');
        if (combo === 'ctrl+enter') {
            e.preventDefault();
            TranslateView.translate();
        } else if (combo === 'ctrl+l') {
            e.preventDefault();
            TranslateView.clearSource();
        }
    },

    /**
     * 设置翻译中/完成的 UI 状态
     * @param {boolean} active - 是否正在翻译
     */
    setLoading(active) {
        const source = document.getElementById('translate-source');
        const btn = document.getElementById('translate-btn');
        const divider = document.querySelector('.translate-panel-divider');

        source.readOnly = active;
        if (divider) divider.classList.toggle('active', active);

        if (active) {
            btn.innerHTML = `<span class="btn-spinner"></span>翻译中...`;
            btn.disabled = true;
        } else {
            btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 8l6 0"/><path d="M4 6l7.586 0.001a2 2 0 0 1 1.414 0.586l2.003 2.003a2 2 0 0 0 1.414 0.586L15 8.001"/><path d="M14 16l-3.5 0"/><path d="M15 15l0 -3.5"/><path d="M12.5 15l-4 0"/><path d="M15 18l-3.5 0"/><path d="M9 18l0 -3.5"/></svg> 翻译`;
            btn.disabled = false;
        }
    },

    /**
     * 执行翻译操作，流式接收译文
     */
    async translate() {
        if (this.translating) return;

        const sourceText = document.getElementById('translate-source').value.trim();
        if (!sourceText) {
            Toast.warning('请输入要翻译的内容');
            return;
        }

        const targetLang = document.getElementById('translate-target-lang').value;
        const target = document.getElementById('translate-target');

        this.translating = true;
        this.setLoading(true);
        target.value = '';
        this.updateCharCount();

        let accumulated = '';
        let cleanupDone = false;

        const cleanup = () => {
            if (cleanupDone) return;
            cleanupDone = true;
            this.translating = false;
            this.setLoading(false);
            this.cleanupListeners();
            this.updateCharCount();
        };

        this.tokenUnlisten = window.runtime.EventsOn('ai:token', (token) => {
            accumulated += token;
            target.value = accumulated;
        });

        this.doneUnlisten = window.runtime.EventsOn('ai:done', () => {
            cleanup();
        });

        this.errorUnlisten = window.runtime.EventsOn('ai:error', (errMsg) => {
            cleanup();
            Toast.error(errMsg);
        });

        try {
            await API.translateContent(sourceText, targetLang);
        } catch (err) {
            cleanup();
        }
    },

    /**
     * 清理 AI 事件监听器
     */
    cleanupListeners() {
        if (this.tokenUnlisten) { this.tokenUnlisten(); this.tokenUnlisten = null; }
        if (this.doneUnlisten) { this.doneUnlisten(); this.doneUnlisten = null; }
        if (this.errorUnlisten) { this.errorUnlisten(); this.errorUnlisten = null; }
    },

    /**
     * 交换源语言和目标语言，同时交换文本内容
     */
    swapLanguages() {
        const sourceLang = document.getElementById('translate-source-lang');
        const targetLang = document.getElementById('translate-target-lang');
        const sourceText = document.getElementById('translate-source');
        const targetText = document.getElementById('translate-target');

        const tempLang = sourceLang.value;
        sourceLang.value = targetLang.value;
        targetLang.value = tempLang;

        const tempText = sourceText.value;
        sourceText.value = targetText.value;
        targetText.value = tempText;

        this.updateCharCount();
    },

    /**
     * 清空原文
     */
    clearSource() {
        if (this.translating) return;
        document.getElementById('translate-source').value = '';
        this.updateCharCount();
    },

    /**
     * 清空译文
     */
    clearTarget() {
        if (this.translating) return;
        document.getElementById('translate-target').value = '';
        this.updateCharCount();
    },

    /**
     * 复制原文到剪贴板
     */
    async copySource() {
        const text = document.getElementById('translate-source').value;
        if (!text) return;
        try {
            await navigator.clipboard.writeText(text);
            Toast.success('已复制到剪贴板');
        } catch {
            Toast.error('复制失败');
        }
    },

    /**
     * 复制译文到剪贴板
     */
    async copyTarget() {
        const text = document.getElementById('translate-target').value;
        if (!text) return;
        try {
            await navigator.clipboard.writeText(text);
            Toast.success('已复制到剪贴板');
        } catch {
            Toast.error('复制失败');
        }
    },

    /**
     * 更新两个输入框的字数统计
     */
    updateCharCount() {
        const sourceLen = document.getElementById('translate-source').value.length;
        const targetLen = document.getElementById('translate-target').value.length;
        document.getElementById('translate-source-count').textContent = `${sourceLen} 字`;
        document.getElementById('translate-target-count').textContent = `${targetLen} 字`;
    }
};
