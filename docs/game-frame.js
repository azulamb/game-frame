"use strict";
((script) => {
    const tagName = script.getAttribute('game-frame-name') ?? 'game-frame';
    if (customElements.get(tagName)) {
        return Promise.reject(new Error(`Custom element with name "${tagName}" already exists.`));
    }
    if (document.readyState !== 'loading') {
        return Promise.resolve(tagName);
    }
    return new Promise((resolve) => {
        document.addEventListener('DOMContentLoaded', () => {
            resolve(tagName);
        });
    });
})(document.currentScript).then((tagName) => {
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(`
    :host { display: block; width: 100%; height: 100%; user-select: none; touch-action: manipulation; --button-line-width: 1px; --button-line-color: #000; }
    :host > div { display: grid; grid-template-rows: minmax(0, 2fr) minmax(0, 1fr); width: 100%; height: 100%; }
    canvas { display: block; width: 100%; height: 100%; min-width: 0; min-height: 0; image-rendering: pixelated; object-fit: contain; object-position: center; }
    .controller-area { display: grid; place-items: center; min-width: 0; min-height: 0; container-type: size; }
    .controller { width: min(100cqw, 100cqh); aspect-ratio: 1 / 1; overflow: hidden; position: relative; border: calc(var(--button-line-width) * 2) solid var(--button-line-color); border-radius: 16px; }
    .controller > div { width: 100%; height: 100%; position: absolute; }
    :host(:not([dpad="8"])) .controller > div {
      display: grid;
      grid-template-columns: 1fr 1fr;
      grid-template-rows: 1fr 1fr;
      grid-template-areas: "up right" "left down";
      inset: 0;
      transform-origin: center;
      transform: rotate(45deg) scale(1.4142135623730951);
    }
    button { display: block; cursor: pointer; box-sizing: border-box; width: 100%; height: 100%; border: var(--button-line-width) solid var(--button-line-color); outline: none; padding: 0; margin: 0; }
    .up { grid-area: up; }
    .down { grid-area: down; }
    .left { grid-area: left; }
    .right { grid-area: right; }
  `);
    customElements.define(tagName, class extends HTMLElement {
        constructor() {
            super();
            this.canvas = document.createElement('canvas');
            this.canvas.width = this.getAttribute('width') ? parseInt(this.getAttribute('width')) : 160;
            this.canvas.height = this.getAttribute('height') ? parseInt(this.getAttribute('height')) : 200;
            const controller = document.createElement('div');
            controller.classList.add('controller');
            controller.appendChild(((controller) => {
                controller.appendChild(((button) => {
                    button.classList.add('up');
                    button.addEventListener('click', this.dispatchButtonEventFunc(1));
                    return button;
                })(document.createElement('button')));
                controller.appendChild(((button) => {
                    button.classList.add('right');
                    button.addEventListener('click', this.dispatchButtonEventFunc(2));
                    return button;
                })(document.createElement('button')));
                controller.appendChild(((button) => {
                    button.classList.add('down');
                    button.addEventListener('click', this.dispatchButtonEventFunc(4));
                    return button;
                })(document.createElement('button')));
                controller.appendChild(((button) => {
                    button.classList.add('left');
                    button.addEventListener('click', this.dispatchButtonEventFunc(8));
                    return button;
                })(document.createElement('button')));
                return controller;
            })(document.createElement('div')));
            const wrapper = document.createElement('div');
            wrapper.appendChild(this.canvas);
            wrapper.appendChild((() => {
                const wrapper = document.createElement('div');
                wrapper.classList.add('controller-area');
                wrapper.appendChild(controller);
                return wrapper;
            })());
            const shadow = this.attachShadow({ mode: 'open' });
            shadow.adoptedStyleSheets = [sheet];
            shadow.appendChild(wrapper);
        }
        dispatchButtonEventFunc(direction) {
            return (event) => {
                event.preventDefault();
                event.stopPropagation();
                this.dispatchEvent(new CustomEvent('press', {
                    detail: { direction: direction },
                    bubbles: true,
                    composed: true,
                }));
            };
        }
        getCanvas() {
            return this.canvas;
        }
    });
});
