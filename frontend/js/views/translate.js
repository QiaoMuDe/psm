/**
 * 翻译模块视图组件
 * 提供独立的文本翻译功能，支持 6 种常用语言，流式显示译文
 */
const TranslateView = {
    translating: false,
    _template: null,
    _keydownHandler: null,

    /**
     * 渲染翻译模块视图
     * @param {HTMLElement} container - 容器元素
     */
    async render(container) {
        if (!this._template) {
            const resp = await fetch('html/translate.html');
            this._template = await resp.text();
        }

        container.innerHTML = this._template;
        this.bindEvents();
        document.getElementById('translate-source').focus();
    },

    /**
     * 绑定/刷新所有事件监听器
     */
    bindEvents() {
        document.getElementById('translate-btn').addEventListener('click', () => this.translate());
        document.getElementById('translate-swap-btn').addEventListener('click', () => this.swapLanguages());
        document.getElementById('translate-clear-source').addEventListener('click', () => this.clearSource());
        document.getElementById('translate-clear-target').addEventListener('click', () => this.clearTarget());
        document.getElementById('translate-copy-source').addEventListener('click', () => this.copySource());
        document.getElementById('translate-copy-target').addEventListener('click', () => this.copyTarget());

        document.getElementById('translate-source').addEventListener('input', () => this.updateCharCount());

        if (this._keydownHandler) {
            document.removeEventListener('keydown', this._keydownHandler);
        }
        this._keydownHandler = (e) => this._handleKeydown(e);
        document.addEventListener('keydown', this._keydownHandler);
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
        const cursor = document.getElementById('target-cursor');
        const targetPanel = document.getElementById('panel-target');
        const label = btn.querySelector('span');

        source.readOnly = active;
        if (targetPanel) targetPanel.classList.toggle('is-receiving', active);
        if (cursor) cursor.classList.toggle('active', active);

        if (active) {
            btn.classList.add('is-loading');
            label.textContent = '翻译中';
            btn.disabled = true;
        } else {
            btn.classList.remove('is-loading');
            label.textContent = '翻译';
            btn.disabled = false;
            if (targetPanel) targetPanel.classList.remove('is-receiving');
            if (cursor) cursor.classList.remove('active');
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
            this.updateCharCount();
        };

        if (this._translateStream) {
            this._translateStream.cleanup();
        }
        this._translateStream = withAIStream(API.translateContent, {
            onToken: (token) => {
                accumulated += token;
                target.value = accumulated;
            },
            onDone: () => {
                this._translateStream = null;
                cleanup();
            },
            onError: (errMsg) => {
                this._translateStream = null;
                cleanup();
                Toast.error(errMsg);
            }
        });

        await this._translateStream.call(sourceText, targetLang);
    },

    /**
     * 交换源语言和目标语言，同时交换文本内容
     */
    swapLanguages() {
        const btn = document.getElementById('translate-swap-btn');
        btn.classList.add('swapping');

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

        setTimeout(() => btn.classList.remove('swapping'), 400);
    },

    /**
     * 清空原文
     */
    clearSource() {
        if (this.translating) return;
        document.getElementById('translate-source').value = '';
        this.updateCharCount();
        document.getElementById('translate-source').focus();
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
        document.getElementById('translate-source-count').textContent = `${sourceLen}`;
        document.getElementById('translate-target-count').textContent = `${targetLen}`;
    }
};
