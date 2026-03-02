// components/Card/card.js
export class Card {
    constructor(x, y, zIndex, content = '', color = null) {
        // 如果没有传入颜色，随机生成
        if (!color) {
            const colors = ['#fee2e2', '#fef3c7', '#dcfce7', '#dbeafe', '#f3e8ff'];
            this.color = colors[Math.floor(Math.random() * colors.length)];
        } else {
            this.color = color;
        }

        this.element = this.createDOM(x, y, zIndex, content);
        this.bindEvents();
    }

    createDOM(x, y, zIndex, content) {
        const div = document.createElement('div');
        div.className = 'card';
        div.style.left = x + 'px';
        div.style.top = y + 'px';
        div.style.zIndex = zIndex;

        div.innerHTML = `
            <div class="card-header" style="background-color: ${this.color}">
                <div class="close-btn" title="删除"></div>
            </div>
            <div class="card-body">
                <textarea placeholder="输入内容...">${content}</textarea>
            </div>
            <div class="resize-handle"></div>
        `;
        return div;
    }

    bindEvents() {
        // 删除事件
        this.element.querySelector('.close-btn').onclick = () => {
            this.element.remove();
            // 触发自定义事件通知外部保存
            window.dispatchEvent(new CustomEvent('save-data'));
        };

        // 层级提升
        this.element.onmousedown = () => {
            // 这里我们可能需要从外部获取最新的 zIndex，为了简单，先假设外部会处理
            // 或者我们可以发一个事件请求置顶
            window.dispatchEvent(new CustomEvent('card-focus', { detail: { card: this.element } }));
            window.dispatchEvent(new CustomEvent('save-data'));
        };

        // 内容变更保存
        this.element.querySelector('textarea').oninput = () => {
            window.dispatchEvent(new CustomEvent('save-data'));
        };

        // 拖拽逻辑 (需要依赖外部的 scale 参数，这里为了解耦，我们通过事件或全局状态获取)
        const header = this.element.querySelector('.card-header');
        this.setupDrag(header);

        // 缩放逻辑
        const resizer = this.element.querySelector('.resize-handle');
        this.setupResize(resizer);
    }

    setupDrag(handle) {
        handle.onmousedown = (e) => {
            const startX = e.clientX;
            const startY = e.clientY;
            const initialLeft = this.element.offsetLeft;
            const initialTop = this.element.offsetTop;
            
            // 获取当前的缩放比例 (假设挂在 window 上，或者通过 data 属性)
            const scale = window.currentScale || 1;

            this.element.classList.add('dragging');
            e.preventDefault();

            const onMouseMove = (moveEvent) => {
                const dx = (moveEvent.clientX - startX) / scale;
                const dy = (moveEvent.clientY - startY) / scale;
                this.element.style.left = (initialLeft + dx) + 'px';
                this.element.style.top = (initialTop + dy) + 'px';
            };

            const onMouseUp = () => {
                this.element.classList.remove('dragging');
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
                window.dispatchEvent(new CustomEvent('save-data'));
            };

            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        };
    }

    setupResize(handle) {
        handle.onmousedown = (e) => {
            e.stopPropagation();
            const startX = e.clientX;
            const startY = e.clientY;
            // 必须用 getComputedStyle 才能获取精确值
            const startWidth = parseInt(document.defaultView.getComputedStyle(this.element).width);
            const startHeight = parseInt(document.defaultView.getComputedStyle(this.element).height);
            const scale = window.currentScale || 1;

            const onMouseMove = (moveEvent) => {
                const dx = (moveEvent.clientX - startX) / scale;
                const dy = (moveEvent.clientY - startY) / scale;
                const newWidth = startWidth + dx;
                const newHeight = startHeight + dy;
                
                if (newWidth > 150) this.element.style.width = newWidth + 'px';
                if (newHeight > 100) this.element.style.height = newHeight + 'px';
            };

            const onMouseUp = () => {
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
                window.dispatchEvent(new CustomEvent('save-data'));
            };

            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        };
    }
}