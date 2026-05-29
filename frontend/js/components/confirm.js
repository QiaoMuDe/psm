/**
 * 确认对话框组件
 * 用于删除等危险操作的二次确认，图标使用内联 SVG
 */
const Confirm = {
    /**
     * 显示确认对话框
     * @param {string} message - 提示信息
     * @param {Object} options - 选项 { title, confirmText, cancelText, type }
     * @returns {Promise<boolean>} 用户是否确认
     */
    show(message, options = {}) {
        return new Promise((resolve) => {
            const container = document.getElementById('confirm-container');
            const title = options.title || '确认操作';
            const confirmText = options.confirmText || '确认';
            const cancelText = options.cancelText || '取消';
            const type = options.type || 'danger';

            const iconSvg = type === 'danger'
                ? '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="color: var(--color-danger, #ef4444);"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>'
                : '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>';

            container.innerHTML = `
                <div class="modal-overlay" id="confirm-overlay">
                    <div class="confirm-dialog">
                        <div class="confirm-icon">${iconSvg}</div>
                        <h3>${title}</h3>
                        <p>${message}</p>
                        <div class="confirm-actions">
                            <button class="btn btn-default" id="confirm-cancel">${cancelText}</button>
                            <button class="btn btn-${type}" id="confirm-ok">${confirmText}</button>
                        </div>
                    </div>
                </div>
            `;
            document.getElementById('confirm-cancel').addEventListener('click', () => {
                container.innerHTML = '';
                resolve(false);
            });
            document.getElementById('confirm-ok').addEventListener('click', () => {
                container.innerHTML = '';
                resolve(true);
            });
        });
    },

    /**
     * 显示危险操作确认对话框
     * @param {string} msg - 提示信息
     * @param {Object} opts - 额外选项
     * @returns {Promise<boolean>} 用户是否确认
     */
    danger: (msg, opts = {}) => Confirm.show(msg, { ...opts, type: 'danger', confirmText: opts.confirmText || '删除' }),
};