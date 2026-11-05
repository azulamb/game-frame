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
    :host { display: block; width: 100%; height: 100%; user-select: none; touch-action: manipulation; }
    :host > div { display: grid; grid-template-rows: minmax(0, 2fr) minmax(0, 1fr); width: 100%; height: 100%; }
    canvas { display: block; width: 100%; height: 100%; min-width: 0; min-height: 0; image-rendering: pixelated; object-fit: contain; object-position: center; }
    .controller-area { width: 100%; height: 100%; }
  `);
    customElements.define(tagName, class extends HTMLElement {
        constructor() {
            super();
            this.canvas = document.createElement('canvas');
            this.canvas.width = this.getAttribute('width')
                ? parseInt(this.getAttribute('width'))
                : 160;
            this.canvas.height = this.getAttribute('height')
                ? parseInt(this.getAttribute('height'))
                : 200;
            const controller = document.createElement('div');
            controller.classList.add('controller-area');
            controller.appendChild(document.createElement('slot'));
            const wrapper = document.createElement('div');
            wrapper.appendChild(this.canvas);
            wrapper.appendChild(controller);
            const shadow = this.attachShadow({ mode: 'open' });
            shadow.adoptedStyleSheets = [sheet];
            shadow.appendChild(wrapper);
        }
        getCanvas() {
            return this.canvas;
        }
    });
});
