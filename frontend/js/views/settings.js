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
                <div class="card">
                    <div class="card-body">
                        <div class="form-group">
                            <label class="form-label">应用主题</label>
                            <select id="setting-theme" class="form-select" style="width: 200px;">
                                <option value="light">亮色</option>
                                <option value="dark">暗色</option>
                                <option value="midnight">午夜蓝</option>
                                <option value="ocean">海洋蓝</option>
                                <option value="forest">森林绿</option>
                                <option value="sunset">日落橙</option>
                                <option value="auto">跟随系统</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label class="form-label">Skill 存储路径</label>
                            <div class="flex gap-12">
                                <input type="text" class="form-input" id="setting-skill-path" readonly style="flex:1" />
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

                        <div class="divider"></div>

                        <div class="form-actions">
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
                </div>
                <div class="version-info" id="version-info"></div>
            </div>
        `;

        await Promise.all([this.loadSettings(), this.loadVersion()]);
        this.bindEvents();
    },

    /**
     * 加载应用版本信息
     */
    async loadVersion() {
        try {
            const v = await API.getVersion();
            const el = document.getElementById('version-info');
            if (!el) return;
            const version = v.git_version && v.git_version !== 'unknown' ? v.git_version : 'dev';
            el.textContent = `PSM ${version}`;
        } catch (err) {
            const el = document.getElementById('version-info');
            if (el) el.textContent = 'PSM dev';
        }
    },

    /**
     * 加载当前设置到表单
     */
    async loadSettings() {
        try {
            const settings = await API.getSettings();
            const path = await API.getSkillStoragePath();

            document.getElementById('setting-theme').value = settings.app_theme || 'light';
            document.getElementById('setting-skill-path').value = path;
        } catch (err) {
            Toast.error('加载设置失败');
        }
    },

    /**
     * 绑定更改路径、保存设置事件
     */
    bindEvents() {
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

            try {
                await API.updateSettings({
                    app_theme: theme,
                    skill_storage_path: skillPath,
                });
                document.documentElement.setAttribute('data-theme', theme);
                Toast.success('保存成功');
            } catch (err) {
                // 错误已由 API.call 处理
            }
        });

    }
};