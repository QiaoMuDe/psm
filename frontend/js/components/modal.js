/**
 * 模态框组件
 * 支持打开/关闭/内容填充，关闭按钮使用 SVG 图标
 */
const Modal = {
    /**
     * 打开模态框
     * @param {string} title - 标题
     * @param {string} content - HTML 内容
     * @param {Object} options - 选项 { width, onClose }
     */
    open(title, content, options = {}) {
        const container = document.getElementById('modal-container');
        const width = options.width || '600px';
        container.innerHTML = `
            <div class="modal-overlay" id="modal-overlay">
                <div class="modal" style="max-width: ${width}">
                    <div class="modal-header">
                        <h3>${title}</h3>
                        <button class="modal-close" id="modal-close-btn">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"/>
                                <line x1="6" y1="6" x2="18" y2="18"/>
                            </svg>
                        </button>
                    </div>
                    <div class="modal-body">${content}</div>
                </div>
            </div>
        `;
        const overlay = document.getElementById('modal-overlay');
        const closeBtn = document.getElementById('modal-close-btn');
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) Modal.close();
        });
        closeBtn.addEventListener('click', Modal.close);
        if (options.onClose) {
            Modal._onClose = options.onClose;
        }
    },

    /**
     * 关闭模态框
     */
    close() {
        const container = document.getElementById('modal-container');
        container.innerHTML = '';
        if (Modal._onClose) {
            Modal._onClose();
            Modal._onClose = null;
        }
    }
};