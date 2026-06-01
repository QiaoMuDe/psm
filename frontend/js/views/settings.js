/**
 * 设置视图组件
 * 提供应用设置管理功能，所有图标使用内联 SVG
 */
const SettingsView = {
    _template: null,

    /**
     * 渲染设置视图
     * @param {HTMLElement} container - 容器元素
     */
    async render(container) {
        if (!this._template) {
            const resp = await fetch('html/settings.html');
            this._template = await resp.text();
        }
        container.innerHTML = this._template;

        await Promise.all([this.loadSettings()]);
        this.bindEvents();
    },

    /**
     * 加载当前设置到表单，包括主题、字体大小、字体族和存储路径
     */
    async loadSettings() {
        try {
            const settings = await API.getSettings();
            const appHome = await API.getAppHome();

            document.getElementById('setting-theme').value = settings.app_theme || 'light';
            document.getElementById('setting-app-home').value = appHome;

            const fontSizeOffset = settings.font_size_offset || '0px';
            const offsetValue = parseInt(fontSizeOffset) || 0;
            const fontSizeSelect = document.getElementById('setting-font-size');
            const fontSizeCustom = document.getElementById('setting-font-size-custom');

            const presetValues = ['-2', '-1', '0', '1', '2'];
            if (presetValues.includes(String(offsetValue))) {
                fontSizeSelect.value = String(offsetValue);
                fontSizeCustom.value = offsetValue;
                fontSizeCustom.disabled = true;
            } else {
                fontSizeSelect.value = 'custom';
                fontSizeCustom.value = offsetValue;
                fontSizeCustom.disabled = false;
            }

            this.applyFontSize(offsetValue);

            const fontFamily = settings.font_family || '';
            document.getElementById('setting-font-family').value = fontFamily;
            document.getElementById('setting-font-family-search').value = fontFamily || '默认 (Space Grotesk)';

            document.getElementById('setting-ai-api-url').value = settings.ai_api_url || '';
            document.getElementById('setting-ai-api-key').value = settings.ai_api_key || '';
            document.getElementById('setting-ai-model').value = settings.ai_model || '';
            document.getElementById('setting-ai-generate-prompt').value = settings.ai_generate_prompt || '';
            document.getElementById('setting-ai-optimize-prompt').value = settings.ai_optimize_prompt || '';
            document.getElementById('setting-ai-optimize-name').value = settings.ai_optimize_name || '';
            document.getElementById('setting-ai-optimize-description').value = settings.ai_optimize_description || '';
            document.getElementById('setting-ai-translate-prompt').value = settings.ai_translate_prompt || '';

            // 加载日志级别
            const logLevel = await API.getLogLevel();
            const levelValue = document.getElementById('log-level-value');
            levelValue.value = logLevel || 'WARN';
            this.setLogLevelSegments(logLevel || 'WARN');

            await this.loadSystemFonts(fontFamily);
        } catch (err) {
            Toast.error('加载设置失败');
        }
    },

    /**
     * 应用字体大小偏移量到根元素
     * @param {number|string} offset - 字体大小偏移量（px）
     */
    applyFontSize(offset) {
        const value = offset + 'px';
        document.documentElement.style.setProperty('--font-size-offset', value);
    },

    /**
     * 加载系统字体列表到下拉框
     * @param {string} selectedFont - 当前选中的字体
     */
    async loadSystemFonts(selectedFont) {
        try {
            const fonts = await API.getSystemFonts();
            const dropdown = document.getElementById('setting-font-family-dropdown');
            const defaultOption = dropdown.querySelector('[data-value=""]');
            dropdown.innerHTML = '';
            if (defaultOption) dropdown.appendChild(defaultOption);

            fonts.forEach(font => {
                if (font.startsWith('@')) return;
                const option = document.createElement('div');
                option.className = 'font-family-option';
                option.dataset.value = font;
                if (font === selectedFont) option.classList.add('selected');
                option.innerHTML = `<span class="font-family-preview" style="font-family: '${font}'">${font}</span>`;
                dropdown.appendChild(option);
            });
        } catch (err) {
            Toast.error('加载系统字体失败');
        }
    },

    /**
     * 应用字体族到根元素
     * @param {string} family - 字体族名称
     */
    applyFontFamily(family) {
        if (family) {
            document.documentElement.style.setProperty('--font-family', `'${family}', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`);
        } else {
            document.documentElement.style.setProperty('--font-family', "'Space Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif");
        }
    },

    /**
     * 绑定更改路径、字体大小、保存设置事件
     */
    bindEvents() {
        const fontSizeSelect = document.getElementById('setting-font-size');
        const fontSizeCustom = document.getElementById('setting-font-size-custom');

        fontSizeSelect.addEventListener('change', () => {
            if (fontSizeSelect.value === 'custom') {
                fontSizeCustom.disabled = false;
                fontSizeCustom.focus();
            } else {
                fontSizeCustom.disabled = true;
                fontSizeCustom.value = fontSizeSelect.value;
                this.applyFontSize(fontSizeSelect.value);
            }
        });

        fontSizeCustom.addEventListener('input', () => {
            let val = parseInt(fontSizeCustom.value) || 0;
            if (val < -5) val = -5;
            if (val > 5) val = 5;
            fontSizeCustom.value = val;
            this.applyFontSize(val);
        });

        document.getElementById('open-app-home-btn').addEventListener('click', async () => {
            try {
                const appHome = await API.getAppHome();
                await API.revealInExplorer(appHome);
            } catch (err) {
                // 错误已由 API.call 处理
            }
        });

        document.getElementById('change-app-home-btn').addEventListener('click', async () => {
            try {
                const dir = await API.selectDirectoryDialog();
                if (!dir) return;
                await API.setAppHome(dir);
                document.getElementById('setting-app-home').value = dir;
                Toast.success('程序家目录已更新，Skill 和备份文件已迁移');
            } catch (err) {
                // 错误已由 API.call 处理
            }
        });

        const searchInput = document.getElementById('setting-font-family-search');
        const dropdown = document.getElementById('setting-font-family-dropdown');
        const hiddenInput = document.getElementById('setting-font-family');

        const fontNav = KeyboardNav.bind(searchInput, {
            getItems: () => dropdown.querySelectorAll('.font-family-option:not([style*="display: none"])'),
            onEnter: (item) => item.click(),
            onEscape: () => dropdown.classList.remove('active'),
            allowCancel: true,
            highlightClass: 'font-family-active',
        });

        searchInput.addEventListener('focus', () => {
            dropdown.classList.add('active');
            const selected = dropdown.querySelector('.font-family-option.selected');
            if (selected) {
                const visibleOptions = dropdown.querySelectorAll('.font-family-option:not([style*="display: none"])');
                const idx = Array.from(visibleOptions).indexOf(selected);
                if (idx >= 0) fontNav.setIndex(idx);
            }
        });

        searchInput.addEventListener('input', () => {
            const query = searchInput.value.toLowerCase();
            const options = dropdown.querySelectorAll('.font-family-option');
            options.forEach(option => {
                const fontName = option.dataset.value || 'Space Grotesk';
                option.style.display = fontName.toLowerCase().includes(query) ? '' : 'none';
            });
            fontNav.reset();
        });

        dropdown.addEventListener('click', (e) => {
            const option = e.target.closest('.font-family-option');
            if (!option) return;
            const value = option.dataset.value;
            hiddenInput.value = value;
            searchInput.value = value || '默认 (Space Grotesk)';
            dropdown.querySelectorAll('.font-family-option').forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');
            this.applyFontFamily(value);
            dropdown.classList.remove('active');
            fontNav.reset();
        });

        document.addEventListener('click', (e) => {
            if (!e.target.closest('.font-family-selector')) {
                dropdown.classList.remove('active');
                fontNav.reset();
            }
        });

        document.getElementById('save-settings-btn').addEventListener('click', async () => {
            const theme = document.getElementById('setting-theme').value;
            const fontSizeOffset = document.getElementById('setting-font-size-custom').value + 'px';
            const fontFamily = document.getElementById('setting-font-family').value;

            try {
                await API.updateSettings({
                    app_theme: theme,
                    font_size_offset: fontSizeOffset,
                    font_family: fontFamily,
                    ai_api_url: document.getElementById('setting-ai-api-url').value.trim(),
                    ai_api_key: document.getElementById('setting-ai-api-key').value.trim(),
                    ai_model: document.getElementById('setting-ai-model').value.trim(),
                    ai_generate_prompt: document.getElementById('setting-ai-generate-prompt').value,
                    ai_optimize_prompt: document.getElementById('setting-ai-optimize-prompt').value,
                    ai_optimize_name: document.getElementById('setting-ai-optimize-name').value,
                    ai_optimize_description: document.getElementById('setting-ai-optimize-description').value,
                    ai_translate_prompt: document.getElementById('setting-ai-translate-prompt').value,
                });
                await API.setLogLevel(document.getElementById('log-level-value').value);
                App.settings = await API.getSettings();
                document.documentElement.setAttribute('data-theme', theme);
                Toast.success('保存成功');
            } catch (err) {
                // 错误已由 API.call 处理
            }
        });

        document.getElementById('toggle-ai-api-key-btn').addEventListener('click', () => {
            const input = document.getElementById('setting-ai-api-key');
            const isPassword = input.type === 'password';
            input.type = isPassword ? 'text' : 'password';
        });

        document.getElementById('test-ai-connection-btn').addEventListener('click', async (e) => {
            const btn = e.currentTarget;
            const apiURL = document.getElementById('setting-ai-api-url').value.trim();
            const apiKey = document.getElementById('setting-ai-api-key').value.trim();

            btn.disabled = true;
            btn.innerHTML = `
                <svg class="spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                </svg>
                测试中...
            `;

            try {
                await API.testAIConnection(apiURL, apiKey);
                Toast.success('连接成功');
            } catch (err) {
                // 错误已由 API.call 处理
            } finally {
                btn.disabled = false;
                btn.innerHTML = `
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                        <polyline points="22 4 12 14.01 9 11.01"/>
                    </svg>
                    测试连接
                `;
            }
        });

        this.bindModelFetcher();
        this.bindLogLevelSelect();
    },

    /**
     * 设置分段滑块高亮位置
     * @param {string} level - 日志级别 (DEBUG/INFO/WARN/ERROR)
     */
    setLogLevelSegments(level) {
        const levels = ['DEBUG', 'INFO', 'WARN', 'ERROR'];
        const index = levels.indexOf(level);
        if (index < 0) return;
        const highlight = document.getElementById('log-level-highlight');
        const items = document.querySelectorAll('#log-level-select .segment-item');
        if (!highlight || items.length === 0) return;
        const width = 100 / items.length;
        highlight.style.width = `${width}%`;
        highlight.style.left = `${index * width}%`;
        items.forEach((item, i) => item.classList.toggle('active', i === index));
    },

    /**
     * 绑定分段滑块的点击、拖动和键盘事件
     */
    bindLogLevelSelect() {
        const container = document.getElementById('log-level-select');
        const levelInput = document.getElementById('log-level-value');
        const track = document.getElementById('log-level-track');
        const items = Array.from(track.querySelectorAll('.segment-item'));
        const levels = ['DEBUG', 'INFO', 'WARN', 'ERROR'];
        let dragging = false;

        const selectLevel = (level) => {
            if (levelInput.value === level) return;
            levelInput.value = level;
            this.setLogLevelSegments(level);
        };

        const getSegmentFromX = (clientX) => {
            const trackRect = track.getBoundingClientRect();
            const x = clientX - trackRect.left;
            const idx = Math.floor((x / trackRect.width) * items.length);
            return levels[Math.max(0, Math.min(idx, levels.length - 1))];
        };

        items.forEach((item) => {
            item.addEventListener('mousedown', (e) => {
                e.preventDefault();
                dragging = true;
                selectLevel(item.dataset.level);
            });

            item.addEventListener('mouseenter', () => {
                if (dragging) selectLevel(item.dataset.level);
            });
        });

        document.addEventListener('mouseup', () => {
            dragging = false;
        });

        track.addEventListener('mousemove', (e) => {
            if (!dragging) return;
            selectLevel(getSegmentFromX(e.clientX));
        });

        container.addEventListener('keydown', (e) => {
            const current = levels.indexOf(levelInput.value);
            let next = current;
            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                e.preventDefault();
                next = Math.min(current + 1, levels.length - 1);
            } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                e.preventDefault();
                next = Math.max(current - 1, 0);
            } else {
                return;
            }
            if (next !== current) {
                levelInput.value = levels[next];
                this.setLogLevelSegments(levels[next]);
            }
        });
    },

    /**
     * 绑定模型列表获取和选择事件
     */
    bindModelFetcher() {
        const fetchBtn = document.getElementById('fetch-models-btn');
        const dropdown = document.getElementById('model-dropdown');
        const modelList = document.getElementById('model-list');
        const searchInput = document.getElementById('model-search-input');
        const modelInput = document.getElementById('setting-ai-model');
        let allModels = [];

        const modelNav = KeyboardNav.bind(searchInput, {
            getItems: () => modelList.querySelectorAll('.model-dropdown-item'),
            onEnter: (item) => {
                modelInput.value = item.dataset.model;
                dropdown.classList.remove('active');
            },
            onEscape: () => dropdown.classList.remove('active'),
            allowCancel: true,
        });

        fetchBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            if (dropdown.classList.contains('active')) {
                dropdown.classList.remove('active');
                return;
            }

            fetchBtn.disabled = true;
            fetchBtn.innerHTML = `
                <svg class="spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                </svg>
                获取中...
            `;

            try {
                allModels = await API.getAIModels();
                modelNav.reset();
                this.renderModelList(modelList, allModels, modelInput.value, searchInput.value);
                dropdown.classList.add('active');
                searchInput.value = '';
                searchInput.focus();
            } catch (err) {
                // 错误已由 API.call 处理
            } finally {
                fetchBtn.disabled = false;
                fetchBtn.innerHTML = `
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                    获取模型
                `;
            }
        });

        searchInput.addEventListener('input', () => {
            modelNav.reset();
            this.renderModelList(modelList, allModels, modelInput.value, searchInput.value);
        });

        searchInput.addEventListener('click', (e) => e.stopPropagation());

        modelList.addEventListener('click', (e) => {
            const item = e.target.closest('.model-dropdown-item');
            if (!item) return;
            modelInput.value = item.dataset.model;
            dropdown.classList.remove('active');
            modelNav.reset();
        });

        document.addEventListener('click', (e) => {
            if (!e.target.closest('.settings-model-control')) {
                dropdown.classList.remove('active');
                modelNav.reset();
            }
        });
    },

    /**
     * 渲染模型下拉列表
     * @param {HTMLElement} container - 列表容器
     * @param {string[]} models - 模型 ID 列表
     * @param {string} currentModel - 当前选中的模型
     * @param {string} filter - 搜索过滤关键词
     */
    renderModelList(container, models, currentModel, filter) {
        const query = (filter || '').toLowerCase();
        const filtered = models.filter(m => m.toLowerCase().includes(query));

        if (filtered.length === 0) {
            container.innerHTML = `<div class="model-dropdown-empty">${models.length === 0 ? '暂无可用模型' : '未找到匹配模型'}</div>`;
            return;
        }

        container.innerHTML = filtered.map(m =>
            `<div class="model-dropdown-item${m === currentModel ? ' active' : ''}" data-model="${m}">${m}${m === currentModel ? ' ✓' : ''}</div>`
        ).join('');
    }
};