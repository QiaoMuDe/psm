/**
 * 右键菜单组件
 * 支持动态菜单项、自动定位、点击外部关闭
 */
const ContextMenu = {
    el: null,

    /**
     * 初始化菜单 DOM 引用并绑定全局事件
     */
    init() {
        this.el = document.getElementById('context-menu');
        document.addEventListener('click', () => this.hide());
        document.addEventListener('contextmenu', (e) => {
            if (!e.target.closest('.item-card') && !e.target.closest('tr[data-id]') && !e.target.closest('.skill-detail-file-item')) {
                this.hide();
            }
        });
        document.addEventListener('scroll', () => this.hide(), true);
    },

    /**
     * 在指定位置显示右键菜单
     * @param {number} x - 鼠标 X 坐标
     * @param {number} y - 鼠标 Y 坐标
     * @param {Array<{label: string, icon?: string, danger?: boolean, separator?: boolean, action: Function}>} items - 菜单项配置
     */
    show(x, y, items) {
        if (!this.el) this.init();

        let html = '';
        items.forEach(item => {
            if (item.separator) {
                html += '<div class="context-menu-separator"></div>';
                return;
            }
            const cls = item.danger ? ' context-menu-item danger' : ' context-menu-item';
            const icon = item.icon ? `<span class="context-menu-icon">${item.icon}</span>` : '';
            html += `<div class="${cls}" data-index="${items.indexOf(item)}">${icon}${item.label}</div>`;
        });
        this.el.innerHTML = html;
        this.el.style.display = 'block';

        const rect = this.el.getBoundingClientRect();
        const viewW = window.innerWidth;
        const viewH = window.innerHeight;
        let left = x;
        let top = y;
        if (x + rect.width > viewW) left = x - rect.width;
        if (y + rect.height > viewH) top = y - rect.height;
        if (left < 0) left = 0;
        if (top < 0) top = 0;

        this.el.style.left = left + 'px';
        this.el.style.top = top + 'px';

        this.el.querySelectorAll('.context-menu-item').forEach(el => {
            el.addEventListener('click', (e) => {
                e.stopPropagation();
                const idx = Number(el.dataset.index);
                this.hide();
                if (items[idx] && items[idx].action) {
                    items[idx].action();
                }
            });
        });
    },

    /**
     * 隐藏右键菜单
     */
    hide() {
        if (this.el) {
            this.el.style.display = 'none';
            this.el.innerHTML = '';
        }
    }
};
