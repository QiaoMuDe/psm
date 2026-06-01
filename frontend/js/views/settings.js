/**
 * 设置视图组件
 * 提供应用设置管理功能，所有图标使用内联 SVG
 */
const SettingsView = {
    _fontIndex: -1,

    /**
     * 渲染设置视图
     * @param {HTMLElement} container - 容器元素
     */
    async render(container) {
        container.innerHTML = `
            <div class="page-header">
                <h2 class="page-title">设置</h2>
                <button class="btn btn-primary btn-sm" id="save-settings-btn">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                        <polyline points="17 21 17 13 7 13 7 21"/>
                        <polyline points="7 3 7 8 15 8"/>
                    </svg>
                    保存设置
                </button>
            </div>
            <div class="view-content">
                <div class="settings-section">
                    <div class="settings-section-header">
                        <div class="settings-section-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="12" cy="12" r="5"/>
                                <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
                                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                                <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
                                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                            </svg>
                        </div>
                        <div class="settings-section-info">
                            <h3 class="settings-section-title">外观</h3>
                            <p class="settings-section-desc">自定义应用的视觉外观</p>
                        </div>
                    </div>
                    <div class="settings-section-body">
                        <div class="settings-row">
                            <div class="settings-row-label">
                                <span class="settings-row-title">主题</span>
                                <span class="settings-row-desc">选择应用的颜色主题</span>
                            </div>
                            <div class="settings-row-control">
                                <select id="setting-theme" class="form-select">
                                    <option value="light">亮色</option>
                                    <option value="dark">暗色</option>
                                    <option value="midnight">午夜蓝</option>
                                    <option value="ocean">海洋蓝</option>
                                    <option value="rose">玫瑰红</option>
                                    <option value="lavender">薰衣草紫</option>
                                    <option value="auto">跟随系统</option>
                                </select>
                            </div>
                        </div>
                        <div class="settings-row">
                            <div class="settings-row-label">
                                <span class="settings-row-title">字体大小</span>
                                <span class="settings-row-desc">调整全局字体大小偏移量</span>
                            </div>
                            <div class="settings-row-control settings-font-size-control">
                                <select id="setting-font-size" class="form-select">
                                    <option value="-2">较小 (-2px)</option>
                                    <option value="-1">略小 (-1px)</option>
                                    <option value="0">默认 (0px)</option>
                                    <option value="1">略大 (+1px)</option>
                                    <option value="2">较大 (+2px)</option>
                                    <option value="custom">自定义</option>
                                </select>
                                <input type="number" id="setting-font-size-custom" class="form-input form-input-sm" min="-5" max="5" value="0" disabled />
                                <span class="settings-unit">px</span>
                            </div>
                        </div>
                        <div class="settings-row">
                            <div class="settings-row-label">
                                <span class="settings-row-title">字体族</span>
                                <span class="settings-row-desc">选择应用界面的字体</span>
                            </div>
                            <div class="settings-row-control settings-font-family-control">
                                <div class="font-family-selector">
                                    <input type="text" id="setting-font-family-search" class="form-input" placeholder="搜索字体..." autocomplete="off" />
                                    <div id="setting-font-family-dropdown" class="font-family-dropdown">
                                        <div class="font-family-option" data-value="">
                                            <span class="font-family-preview" style="font-family: 'Space Grotesk'">默认 (Space Grotesk)</span>
                                        </div>
                                    </div>
                                </div>
                                <input type="hidden" id="setting-font-family" value="" />
                            </div>
                        </div>
                    </div>
                </div>

                <div class="settings-section">
                    <div class="settings-section-header">
                        <div class="settings-section-icon settings-section-icon-teal">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                            </svg>
                        </div>
                        <div class="settings-section-info">
                            <h3 class="settings-section-title">存储</h3>
                            <p class="settings-section-desc">管理程序家目录，Skill 和备份文件跟随此目录</p>
                        </div>
                    </div>
                    <div class="settings-section-body">
                        <div class="settings-row settings-row-column">
                            <div class="settings-row-label">
                                <span class="settings-row-title">程序家目录</span>
                                <span class="settings-row-desc">Skill 和备份文件将存储在此目录下</span>
                            </div>
                            <div class="settings-path-row">
                                <input type="text" class="form-input" id="setting-app-home" readonly />
                                <button class="btn btn-default" id="open-app-home-btn" title="在文件管理器中打开">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                                        <polyline points="15 3 21 3 21 9"/>
                                        <line x1="10" y1="14" x2="21" y2="3"/>
                                    </svg>
                                    打开
                                </button>
                                <button class="btn btn-default" id="change-app-home-btn">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                                        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                                    </svg>
                                    更改
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="settings-section ai-section">
                    <div class="settings-section-header">
                        <div class="settings-section-icon settings-section-icon-purple">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                            </svg>
                        </div>
                        <div class="settings-section-info">
                            <h3 class="settings-section-title">AI</h3>
                            <p class="settings-section-desc">配置 AI 模型，用于一键生成提示词</p>
                        </div>
                    </div>
                    <div class="settings-section-body">
                        <div class="settings-row">
                            <div class="settings-row-label">
                                <span class="settings-row-title">API 地址</span>
                                <span class="settings-row-desc">OpenAI 兼容的基础路径，如 https://api.openai.com/v1</span>
                            </div>
                            <div class="settings-row-control settings-api-url-control">
                                <input type="text" class="form-input" id="setting-ai-api-url" placeholder="https://api.openai.com/v1" />
                                <button type="button" class="btn btn-default" id="test-ai-connection-btn" title="测试 API 连接">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                                        <polyline points="22 4 12 14.01 9 11.01"/>
                                    </svg>
                                    测试连接
                                </button>
                            </div>
                        </div>
                        <div class="settings-row">
                            <div class="settings-row-label">
                                <span class="settings-row-title">API Key</span>
                                <span class="settings-row-desc">模型服务的访问密钥</span>
                            </div>
                            <div class="settings-row-control settings-api-key-control">
                                <input type="password" class="form-input" id="setting-ai-api-key" placeholder="sk-..." />
                                <button type="button" class="btn btn-default btn-icon" id="toggle-ai-api-key-btn" title="显示/隐藏">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                        <circle cx="12" cy="12" r="3"/>
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <div class="settings-row">
                            <div class="settings-row-label">
                                <span class="settings-row-title">模型名称</span>
                                <span class="settings-row-desc">使用的模型标识，如 gpt-4o-mini、deepseek-chat</span>
                            </div>
                            <div class="settings-row-control settings-model-control">
                                <input type="text" class="form-input" id="setting-ai-model" placeholder="gpt-4o-mini" />
                                <button type="button" class="btn btn-default" id="fetch-models-btn" title="获取可用模型列表">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                                        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                                    </svg>
                                    获取模型
                                </button>
                                <div id="model-dropdown" class="model-dropdown">
                                    <div class="model-dropdown-search">
                                        <input type="text" class="form-input" id="model-search-input" placeholder="搜索模型..." />
                                    </div>
                                    <div class="model-dropdown-list" id="model-list"></div>
                                </div>
                            </div>
                        </div>
                        <div class="settings-row settings-row-column">
                            <div class="settings-row-label">
                                <span class="settings-row-title">生成提示词系统提示</span>
                                <span class="settings-row-desc">AI 生成提示词时使用的系统提示词，可自定义修改</span>
                            </div>
                            <div class="settings-row-control settings-row-control-full">
                                <textarea class="form-textarea settings-prompt-textarea" id="setting-ai-generate-prompt" rows="6"></textarea>
                            </div>
                        </div>
                        <div class="settings-row settings-row-column">
                            <div class="settings-row-label">
                                <span class="settings-row-title">优化提示词系统提示</span>
                                <span class="settings-row-desc">AI 优化提示词内容时使用的系统提示词，可自定义修改</span>
                            </div>
                            <div class="settings-row-control settings-row-control-full">
                                <textarea class="form-textarea settings-prompt-textarea" id="setting-ai-optimize-prompt" rows="6"></textarea>
                            </div>
                        </div>
                        <div class="settings-row settings-row-column">
                            <div class="settings-row-label">
                                <span class="settings-row-title">优化名称系统提示</span>
                                <span class="settings-row-desc">AI 优化名称时使用的系统提示词，适用于提示词和技能的名称优化</span>
                            </div>
                            <div class="settings-row-control settings-row-control-full">
                                <textarea class="form-textarea settings-prompt-textarea" id="setting-ai-optimize-name" rows="6"></textarea>
                            </div>
                        </div>
                        <div class="settings-row settings-row-column">
                            <div class="settings-row-label">
                                <span class="settings-row-title">优化描述系统提示</span>
                                <span class="settings-row-desc">AI 优化描述时使用的系统提示词，适用于技能描述优化</span>
                            </div>
                            <div class="settings-row-control settings-row-control-full">
                                <textarea class="form-textarea settings-prompt-textarea" id="setting-ai-optimize-description" rows="6"></textarea>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

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
     * 更新字体选项高亮状态
     * @param {HTMLElement} dropdown - 下拉框元素
     */
    updateFontHighlight(dropdown) {
        const options = Array.from(dropdown.querySelectorAll('.font-family-option')).filter(opt => opt.style.display !== 'none');
        options.forEach((option, index) => {
            if (index === this._fontIndex) {
                option.classList.add('font-family-active');
                option.scrollIntoView({ block: 'nearest' });
            } else {
                option.classList.remove('font-family-active');
            }
        });
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

        searchInput.addEventListener('focus', () => {
            dropdown.classList.add('active');
            const selected = dropdown.querySelector('.font-family-option.selected');
            if (selected) {
                this._fontIndex = Array.from(dropdown.querySelectorAll('.font-family-option')).indexOf(selected);
                selected.scrollIntoView({ block: 'nearest' });
            }
        });

        searchInput.addEventListener('input', () => {
            const query = searchInput.value.toLowerCase();
            const options = dropdown.querySelectorAll('.font-family-option');
            options.forEach(option => {
                const fontName = option.dataset.value || 'Space Grotesk';
                option.style.display = fontName.toLowerCase().includes(query) ? '' : 'none';
            });
            this._fontIndex = -1;
            this.updateFontHighlight(dropdown);
        });

        searchInput.addEventListener('keydown', (e) => {
            const options = Array.from(dropdown.querySelectorAll('.font-family-option')).filter(opt => opt.style.display !== 'none');

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                this._fontIndex = Math.min(this._fontIndex + 1, options.length - 1);
                this.updateFontHighlight(dropdown);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                this._fontIndex = Math.max(this._fontIndex - 1, -1);
                this.updateFontHighlight(dropdown);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (this._fontIndex >= 0 && options[this._fontIndex]) {
                    options[this._fontIndex].click();
                }
            } else if (e.key === 'Escape') {
                dropdown.classList.remove('active');
                this._fontIndex = -1;
            }
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
            this._fontIndex = -1;
        });

        document.addEventListener('click', (e) => {
            if (!e.target.closest('.font-family-selector')) {
                dropdown.classList.remove('active');
                this._fontIndex = -1;
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
                });
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
        let modelIndex = -1;

        const updateModelHighlight = () => {
            const items = Array.from(modelList.querySelectorAll('.model-dropdown-item'));
            items.forEach((item, i) => {
                item.classList.toggle('highlight', i === modelIndex);
            });
            if (modelIndex >= 0 && items[modelIndex]) {
                items[modelIndex].scrollIntoView({ block: 'nearest' });
            }
        };

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
                modelIndex = -1;
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
            modelIndex = -1;
            this.renderModelList(modelList, allModels, modelInput.value, searchInput.value);
        });

        searchInput.addEventListener('click', (e) => e.stopPropagation());

        searchInput.addEventListener('keydown', (e) => {
            const items = Array.from(modelList.querySelectorAll('.model-dropdown-item'));

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                modelIndex = Math.min(modelIndex + 1, items.length - 1);
                updateModelHighlight();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                modelIndex = Math.max(modelIndex - 1, -1);
                updateModelHighlight();
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (modelIndex >= 0 && items[modelIndex]) {
                    modelInput.value = items[modelIndex].dataset.model;
                    dropdown.classList.remove('active');
                    modelIndex = -1;
                }
            } else if (e.key === 'Escape') {
                dropdown.classList.remove('active');
                modelIndex = -1;
            }
        });

        modelList.addEventListener('click', (e) => {
            const item = e.target.closest('.model-dropdown-item');
            if (!item) return;
            modelInput.value = item.dataset.model;
            dropdown.classList.remove('active');
            modelIndex = -1;
        });

        document.addEventListener('click', (e) => {
            if (!e.target.closest('.settings-model-control')) {
                dropdown.classList.remove('active');
                modelIndex = -1;
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