/**
 * 设置视图组件
 * 提供应用设置管理功能，所有图标使用内联 SVG
 */
const SettingsView = {
    /**
     * 渲染设置视图
     * @param {HTMLElement} container - 容器元素
     */
    async render(container) {
        container.innerHTML = `
            <div class="page-header">
                <h2 class="page-title">设置</h2>
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
                                    <option value="forest">森林绿</option>
                                    <option value="sunset">日落橙</option>
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
                            <p class="settings-section-desc">管理 Skill 文件的存储位置</p>
                        </div>
                    </div>
                    <div class="settings-section-body">
                        <div class="settings-row settings-row-column">
                            <div class="settings-row-label">
                                <span class="settings-row-title">Skill 存储路径</span>
                                <span class="settings-row-desc">Skill 文件的本地存储目录</span>
                            </div>
                            <div class="settings-path-row">
                                <input type="text" class="form-input" id="setting-skill-path" readonly />
                                <button class="btn btn-default" id="open-skill-path-btn" title="在文件管理器中打开">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                                        <polyline points="15 3 21 3 21 9"/>
                                        <line x1="10" y1="14" x2="21" y2="3"/>
                                    </svg>
                                    打开
                                </button>
                                <button class="btn btn-default" id="change-skill-path-btn">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                                        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                                    </svg>
                                    更改
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="settings-save-bar">
                    <button class="btn btn-primary" id="save-settings-btn">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                            <polyline points="17 21 17 13 7 13 7 21"/>
                            <polyline points="7 3 7 8 15 8"/>
                        </svg>
                        保存设置
                    </button>
                </div>
            </div>
        `;

        await Promise.all([this.loadSettings()]);
        this.bindEvents();
    },

    /**
     * 加载当前设置到表单，包括主题、字体大小和存储路径
     */
    async loadSettings() {
        try {
            const settings = await API.getSettings();
            const path = await API.getSkillStoragePath();

            document.getElementById('setting-theme').value = settings.app_theme || 'light';
            document.getElementById('setting-skill-path').value = path;

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

        document.getElementById('open-skill-path-btn').addEventListener('click', async () => {
            try {
                await API.openDataDirectory();
            } catch (err) {
                // 错误已由 API.call 处理
            }
        });

        document.getElementById('change-skill-path-btn').addEventListener('click', async () => {
            try {
                const dir = await API.selectDirectoryDialog();
                if (!dir) return;
                document.getElementById('setting-skill-path').value = dir;
            } catch (err) {
                // 错误已由 API.call 处理
            }
        });

        document.getElementById('save-settings-btn').addEventListener('click', async () => {
            const theme = document.getElementById('setting-theme').value;
            const skillPath = document.getElementById('setting-skill-path').value;
            const fontSizeOffset = document.getElementById('setting-font-size-custom').value + 'px';

            try {
                await API.updateSettings({
                    app_theme: theme,
                    skill_storage_path: skillPath,
                    font_size_offset: fontSizeOffset,
                });
                document.documentElement.setAttribute('data-theme', theme);
                Toast.success('保存成功');
            } catch (err) {
                // 错误已由 API.call 处理
            }
        });

    }
};