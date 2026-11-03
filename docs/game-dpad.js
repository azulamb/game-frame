"use strict";
((script) => {
    const tagName = script.getAttribute('game-dpad-name') ?? 'game-dpad';
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
    :host { width: 100%; height: 100%; display: block; container-type: size; --button-line-width: 1px; --button-line-color: #000; }
    .controller-area { width: 100%; height: 100%; display: grid; grid-template-columns: min(25cqw, 50cqh) min(50cqw, 100cqh) min(25cqw, 50cqh); grid-template-rows: repeat(2, min(25cqw, 50cqh)); place-content: center; place-items: center; min-width: 0; min-height: 0; }
    .controller { grid-column: 2; grid-row: 1 / 3; width: min(100%, 100cqh); aspect-ratio: 1 / 1; overflow: hidden; position: relative; border: calc(var(--button-line-width) * 2) solid var(--button-line-color); border-radius: 16px; box-sizing: border-box; }
    .controller > div { width: 100%; height: 100%; position: absolute; }
    :host(:not([dpad="8"])) .controller > div { display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; grid-template-areas: "up right" "left down"; inset: 0; transform-origin: center; transform: rotate(45deg) scale(1.4142135623730951); }
    button { display: block; cursor: pointer; user-select: none; -webkit-tap-highlight-color: transparent; box-sizing: border-box; width: 100%; height: 100%; border: var(--button-line-width) solid var(--button-line-color); outline: none; padding: 0; margin: 0; }
    .controller-area > button { grid-row: 2; width: min(100%, 50cqh); height: auto; aspect-ratio: 1 / 1; border-radius: 16px; position: relative; border: calc(var(--button-line-width) * 2) solid var(--button-line-color); }
    .cancelable, .l { grid-column: 1; }
    .confirmed, .r { grid-column: 3; }
    .controller-area > .l, .controller-area > .r { grid-row: 1; }
    .cancelable::before, .cancelable::after, .confirmed::before, .l::before, .r::before { content: ""; position: absolute; top: 50%; left: 50%; box-sizing: border-box; pointer-events: none; }
    .l::before, .r::before { width: 40%; height: 40%; border-top: min(1.5cqw, 3cqh) solid var(--button-line-color); border-right: min(1.5cqw, 3cqh) solid var(--button-line-color); }
    .l::before { transform: translate(-25%, -50%) rotate(-135deg); }
    .r::before { transform: translate(-75%, -50%) rotate(45deg); }
    .cancelable::before, .cancelable::after { width: 70%; height: 6%; background: var(--button-line-color); border-radius: 999px; }
    .cancelable::before { transform: translate(-50%, -50%) rotate(45deg); }
    .cancelable::after { transform: translate(-50%, -50%) rotate(-45deg); }
    .confirmed::before { width: 60%; height: 60%; border: min(1.5cqw, 3cqh) solid var(--button-line-color); border-radius: 50%; transform: translate(-50%, -50%); }
    .up { grid-area: up; }
    .down { grid-area: down; }
    .left { grid-area: left; }
    .right { grid-area: right; }
  `);
    function createGameDpadPressButtonDetail(key, direction = 0) {
        const detail = {
            direction: direction,
            key: key,
            up: false,
            down: false,
            left: false,
            right: false,
            confirmed: false,
            cancelable: false,
            l: false,
            r: false,
        };
        detail[key] = true;
        return detail;
    }
    function createButton() {
        const button = document.createElement('button');
        button.addEventListener('contextmenu', (event) => {
            event.preventDefault();
        });
        return button;
    }
    customElements.define(tagName, class extends HTMLElement {
        constructor() {
            super();
            const controller = document.createElement('div');
            controller.classList.add('controller');
            controller.appendChild(((controller) => {
                controller.appendChild(((button) => {
                    button.classList.add('up');
                    button.addEventListener('click', this.dispatchDirectionButtonEventFunc('up', 1));
                    return button;
                })(createButton()));
                controller.appendChild(((button) => {
                    button.classList.add('right');
                    button.addEventListener('click', this.dispatchDirectionButtonEventFunc('right', 2));
                    return button;
                })(createButton()));
                controller.appendChild(((button) => {
                    button.classList.add('down');
                    button.addEventListener('click', this.dispatchDirectionButtonEventFunc('down', 4));
                    return button;
                })(createButton()));
                controller.appendChild(((button) => {
                    button.classList.add('left');
                    button.addEventListener('click', this.dispatchDirectionButtonEventFunc('left', 8));
                    return button;
                })(createButton()));
                return controller;
            })(document.createElement('div')));
            const confirmed = ((button) => {
                button.classList.add('confirmed');
                button.setAttribute('aria-label', '決定');
                button.addEventListener('click', this.dispatchButtonEventFunc('confirmed'));
                return button;
            })(createButton());
            const cancelable = ((button) => {
                button.classList.add('cancelable');
                button.setAttribute('aria-label', 'キャンセル');
                button.addEventListener('click', this.dispatchButtonEventFunc('cancelable'));
                return button;
            })(createButton());
            const l = ((button) => {
                button.classList.add('l');
                button.setAttribute('aria-label', 'L');
                button.addEventListener('click', this.dispatchButtonEventFunc('l'));
                return button;
            })(createButton());
            const r = ((button) => {
                button.classList.add('r');
                button.setAttribute('aria-label', 'R');
                button.addEventListener('click', this.dispatchButtonEventFunc('r'));
                return button;
            })(createButton());
            const wrapper = document.createElement('div');
            wrapper.classList.add('controller-area');
            wrapper.appendChild(l);
            wrapper.appendChild(r);
            wrapper.appendChild(cancelable);
            wrapper.appendChild(controller);
            wrapper.appendChild(confirmed);
            const shadow = this.attachShadow({ mode: 'open' });
            shadow.adoptedStyleSheets = [sheet];
            shadow.appendChild(wrapper);
        }
        dispatchButtonEventFunc(key) {
            return (event) => {
                event.preventDefault();
                event.stopPropagation();
                const detail = createGameDpadPressButtonDetail(key);
                this.dispatchEvent(new CustomEvent('press', {
                    detail: detail,
                    bubbles: true,
                    composed: true,
                }));
            };
        }
        dispatchDirectionButtonEventFunc(key, direction) {
            return (event) => {
                event.preventDefault();
                event.stopPropagation();
                const detail = createGameDpadPressButtonDetail(key, direction);
                this.dispatchEvent(new CustomEvent('press', {
                    detail: detail,
                    bubbles: true,
                    composed: true,
                }));
            };
        }
    });
});
