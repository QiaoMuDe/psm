/**
 * 下拉菜单组件
 * 支持动态菜单项、自动定位、点击外部关闭、禁用项
 */
const DropdownMenu = {
    el: null,

    /**
     * 初始化菜单 DOM 引用并绑定全局事件
     */
    init() {
        this.el = document.getElementById('dropdown-menu');
        document.addEventListener('click', () => this.hide());
        document.addEventListener('scroll', () => this.hide(), true);
    },

    /**
     * 在指定位置显示下拉菜单
     * @param {number} x - 鼠标 X 坐标
     * @param {number} y - 鼠标 Y 坐标
     * @param {Array<{label: string, icon?: string, disabled?: boolean, separator?: boolean, action: Function}>} items - 菜单项配置
     */
    show(x, y, items) {
        if (!this.el) this.init();

        let html = '';
        items.forEach((item, idx) => {
            if (item.separator) {
                html += '<div class="dropdown-menu-separator"></div>';
                return;
            }
            const disabled = item.disabled ? ' disabled' : '';
            const cls = `dropdown-menu-item${disabled}`;
            const icon = item.icon ? `<span class="dropdown-menu-icon">${item.icon}</span>` : '';
            html += `<div class="${cls}" data-index="${idx}">${icon}${item.label}</div>`;
        });
        this.el.innerHTML = html;
        this.el.classList.add('show');

        positionPopup(this.el, x, y);

        this.el.querySelectorAll('.dropdown-menu-item').forEach(el => {
            el.addEventListener('click', (e) => {
                e.stopPropagation();
                if (el.classList.contains('disabled')) return;
                const idx = Number(el.dataset.index);
                this.hide();
                if (items[idx] && items[idx].action) {
                    items[idx].action();
                }
            });
        });
    },

    /**
     * 隐藏下拉菜单
     */
    hide() {
        if (this.el) {
            this.el.classList.remove('show');
            this.el.innerHTML = '';
        }
    }
};
