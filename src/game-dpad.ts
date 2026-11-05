interface GameDpadElement extends HTMLElement {
  addEventListener(
    type: 'press',
    listener: (this: GameDpadElement, ev: GameDpadPressButtonEvent) => any,
    options?: boolean | AddEventListenerOptions,
  ): void;
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions,
  ): void;
  showKeyConfig(): Promise<void>;
}

type DIRECTION_NUMBER = 0 | 1 | 2 | 4 | 8;
type BUTTON_KEY =
  | 'up'
  | 'down'
  | 'left'
  | 'right'
  | 'confirmed'
  | 'cancelable'
  | 'l'
  | 'r';
type GameDpadPressButtonEvent = CustomEvent<GameDpadPressButtonDetail>;
type GameDpadPressButtonDetail = {
  direction: DIRECTION_NUMBER;
  key: BUTTON_KEY;
} & Record<BUTTON_KEY, boolean>;

((script) => {
  const tagName = script.getAttribute('game-dpad-name') ?? 'game-dpad';
  if (customElements.get(tagName)) {
    return Promise.reject(
      new Error(`Custom element with name "${tagName}" already exists.`),
    );
  }
  if (document.readyState !== 'loading') {
    return Promise.resolve(tagName);
  }
  return new Promise<string>((resolve) => {
    document.addEventListener('DOMContentLoaded', () => {
      resolve(tagName);
    });
  });
})(<HTMLScriptElement> document.currentScript).then((tagName) => {
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
    dialog { padding: 0; background: #fff; color: #222; border: none; border-radius: 16px; width: 36rem; max-width: calc(100vw - 32px); max-height: calc(100dvh - 32px); overflow: hidden; }
    dialog::backdrop { background: rgba(0, 0, 0, 0.7); }
    .key-config { display: grid; grid-template-rows: auto minmax(0, 1fr) auto; max-height: min(42rem, calc(100dvh - 32px)); }
    .key-config h2 { margin: 0; padding: 16px; font-size: 1.25rem; }
    .key-config-main { overflow-y: auto; min-height: 0; padding: 0 16px 16px; overscroll-behavior: contain; }
    .key-config-main > p { margin: 0 0 16px; }
    .key-config fieldset { min-width: 0; margin: 0 0 12px; padding: 12px; border: 1px solid #aaa; border-radius: 8px; }
    .key-config-keys, .key-config-actions { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
    .key-config button { width: auto; height: auto; min-height: 36px; padding: 6px 12px; border: 1px solid #777; border-radius: 6px; font: inherit; color: inherit; background: #f5f5f5; }
    .key-config button:focus-visible { outline: 2px solid #1769cc; outline-offset: 2px; }
    .key-config button[aria-pressed="true"] { background: #deebff; }
    .key-config-status { margin: 8px 0 0; font-size: .875rem; }
    .key-config-actions { flex-wrap: nowrap; padding: 16px; border-top: 1px solid #ccc; background: #fff; }
    .key-config-actions > button { flex: 1; }
  `);

  function createGameDpadPressButtonDetail(
    key: BUTTON_KEY,
    direction: DIRECTION_NUMBER = 0,
  ): GameDpadPressButtonDetail {
    const detail: GameDpadPressButtonDetail = {
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

  function createButton(onPress: (event: Event) => void) {
    const button = document.createElement('button');
    button.type = 'button';
    button.addEventListener('contextmenu', (event) => {
      event.preventDefault();
    });
    button.addEventListener('touchstart', (event) => {
      event.preventDefault();
      onPress(event);
    }, { passive: false });
    button.addEventListener('touchend', (event) => {
      event.preventDefault();
    }, { passive: false });
    button.addEventListener('click', onPress);
    return button;
  }

  customElements.define(
    tagName,
    class extends HTMLElement implements GameDpadElement {
      protected dialog: HTMLDialogElement;
      private keyConfigPending = false;
      protected keyConfig: Partial<Record<string, BUTTON_KEY>> = {
        ArrowUp: 'up',
        KeyW: 'up',
        ArrowRight: 'right',
        KeyD: 'right',
        ArrowDown: 'down',
        KeyS: 'down',
        ArrowLeft: 'left',
        KeyA: 'left',
        Enter: 'confirmed',
        Space: 'confirmed',
        KeyZ: 'confirmed',
        Escape: 'cancelable',
        KeyX: 'cancelable',
        KeyQ: 'l',
        KeyE: 'r',
      };

      constructor() {
        super();

        const controller = document.createElement('div');
        controller.classList.add('controller');
        controller.appendChild(((controller) => {
          controller.appendChild(((button) => {
            button.classList.add('up');
            return button;
          })(createButton(this.dispatchDirectionButtonEventFunc('up', 1))));
          controller.appendChild(((button) => {
            button.classList.add('right');
            return button;
          })(createButton(this.dispatchDirectionButtonEventFunc('right', 2))));
          controller.appendChild(((button) => {
            button.classList.add('down');
            return button;
          })(createButton(this.dispatchDirectionButtonEventFunc('down', 4))));
          controller.appendChild(((button) => {
            button.classList.add('left');
            return button;
          })(createButton(this.dispatchDirectionButtonEventFunc('left', 8))));
          return controller;
        })(document.createElement('div')));
        const confirmed = ((button) => {
          button.classList.add('confirmed');
          button.setAttribute('aria-label', 'Confirmed');
          return button;
        })(createButton(this.dispatchButtonEventFunc('confirmed')));
        const cancelable = ((button) => {
          button.classList.add('cancelable');
          button.setAttribute('aria-label', 'Cancel');
          return button;
        })(createButton(this.dispatchButtonEventFunc('cancelable')));
        const l = ((button) => {
          button.classList.add('l');
          button.setAttribute('aria-label', 'L');
          return button;
        })(createButton(this.dispatchButtonEventFunc('l')));
        const r = ((button) => {
          button.classList.add('r');
          button.setAttribute('aria-label', 'R');
          return button;
        })(createButton(this.dispatchButtonEventFunc('r')));

        const wrapper = document.createElement('div');
        wrapper.classList.add('controller-area');
        wrapper.appendChild(l);
        wrapper.appendChild(r);
        wrapper.appendChild(cancelable);
        wrapper.appendChild(controller);
        wrapper.appendChild(confirmed);

        this.dialog = document.createElement('dialog');
        this.dialog.id = 'key-config-dialog';
        this.dialog.setAttribute('closedby', 'any');
        this.dialog.setAttribute('aria-labelledby', 'key-config-title');

        const shadow = this.attachShadow({ mode: 'open' });
        shadow.adoptedStyleSheets = [sheet];
        shadow.appendChild(wrapper);
        shadow.appendChild(this.dialog);
      }

      public showKeyConfig(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
          if (this.dialog.open || this.keyConfigPending) {
            reject(new Error('Key configuration is already open.'));
            return;
          }
          const draft = { ...this.keyConfig };
          const labels: Record<BUTTON_KEY, string> = {
            up: 'Up',
            right: 'Right',
            down: 'Down',
            left: 'Left',
            confirmed: 'Confirmed',
            cancelable: 'Cancel',
            l: 'L',
            r: 'R',
          };
          const panel = document.createElement('div');
          panel.className = 'key-config';
          const title = document.createElement('h2');
          title.id = 'key-config-title';
          title.textContent = 'Key Configuration';
          const main = document.createElement('div');
          main.className = 'key-config-main';
          const makeButton = (label: string): HTMLButtonElement => {
            const button = document.createElement('button');
            button.type = 'button';
            button.textContent = label;
            return button;
          };
          let stopCapture: (() => void) | undefined;
          for (const key of Object.keys(labels) as BUTTON_KEY[]) {
            const group = document.createElement('fieldset');
            const legend = document.createElement('legend');
            legend.textContent = labels[key];
            const keys = document.createElement('div');
            keys.className = 'key-config-keys';
            const status = document.createElement('p');
            status.className = 'key-config-status';
            status.setAttribute('role', 'status');
            const add = makeButton('Add');
            add.setAttribute('aria-label', `Add a key to ${labels[key]}`);
            add.setAttribute('aria-pressed', 'false');
            const renderKeys = () => {
              keys.replaceChildren();
              for (const [code, buttonKey] of Object.entries(draft)) {
                if (buttonKey !== key) continue;
                const remove = makeButton(`${code} ×`);
                remove.setAttribute(
                  'aria-label',
                  `Remove ${code} from ${labels[key]}`,
                );
                remove.addEventListener('click', () => {
                  delete draft[code];
                  renderKeys();
                  add.focus();
                });
                keys.appendChild(remove);
              }
              keys.appendChild(add);
            };
            add.addEventListener('click', () => {
              if (add.getAttribute('aria-pressed') === 'true') {
                stopCapture?.();
                return;
              }
              stopCapture?.();
              add.setAttribute('aria-pressed', 'true');
              status.textContent =
                'Press the key you want to register (Press Tab to cancel).';
              const onCapture = (event: KeyboardEvent) => {
                if (event.key === 'Tab') {
                  stopCapture?.();
                  return;
                }
                event.preventDefault();
                event.stopPropagation();
                if (
                  event.isComposing || event.repeat || !event.code ||
                  event.code === 'Unidentified'
                ) return;
                if (
                  event.ctrlKey || event.altKey || event.metaKey ||
                  /^(Shift|Control|Alt|Meta)/.test(event.code)
                ) {
                  status.textContent =
                    'Combinations with modifier keys cannot be registered. Please press another key.';
                  return;
                }
                const assigned =
                  Object.prototype.hasOwnProperty.call(draft, event.code)
                    ? draft[event.code]
                    : undefined;
                if (assigned && assigned !== key) {
                  status.textContent = `${event.code} is already assigned to "${
                    labels[assigned]
                  }". Please remove it first.`;
                  return;
                }
                draft[event.code] = key;
                stopCapture?.();
                renderKeys();
                status.textContent = `${event.code} has been registered.`;
                add.focus();
              };
              stopCapture = () => {
                add.removeEventListener('keydown', onCapture);
                add.setAttribute('aria-pressed', 'false');
                status.textContent = '';
                stopCapture = undefined;
              };
              add.addEventListener('keydown', onCapture);
              add.focus();
            });
            add.addEventListener('blur', () => {
              if (add.getAttribute('aria-pressed') === 'true') stopCapture?.();
            });
            renderKeys();
            group.append(legend, keys, status);
            main.appendChild(group);
          }
          const actions = document.createElement('div');
          actions.className = 'key-config-actions';
          const cancel = makeButton('Cancel');
          const confirm = makeButton('Confirm');
          cancel.setAttribute('commandfor', this.dialog.id);
          cancel.setAttribute('command', 'request-close');
          cancel.value = 'cancel';
          confirm.setAttribute('commandfor', this.dialog.id);
          confirm.setAttribute('command', 'close');
          confirm.value = 'confirm';
          actions.append(cancel, confirm);
          panel.append(title, main, actions);
          this.dialog.replaceChildren(panel);
          const onClose = () => {
            stopCapture?.();
            this.keyConfigPending = false;
            if (this.dialog.returnValue === 'confirm') {
              this.keyConfig = draft;
              resolve();
            } else {
              reject(
                new DOMException(
                  'Key configuration was canceled.',
                  'AbortError',
                ),
              );
            }
          };
          this.dialog.returnValue = '';
          this.dialog.showModal();
          this.keyConfigPending = true;
          this.dialog.addEventListener('close', onClose, { once: true });
        });
      }

      private readonly onKeyDown = (event: KeyboardEvent): void => {
        if (
          event.defaultPrevented || event.isComposing || event.ctrlKey ||
          event.altKey || event.metaKey || this.dialog.open
        ) {
          return;
        }
        if (
          event.composedPath().some((target) =>
            target instanceof HTMLElement && (
              target.isContentEditable ||
              target.matches('input, textarea, select')
            )
          )
        ) {
          return;
        }
        const key =
          Object.prototype.hasOwnProperty.call(this.keyConfig, event.code)
            ? this.keyConfig[event.code]
            : undefined;
        if (!key) {
          return;
        }
        const directions: Partial<Record<BUTTON_KEY, DIRECTION_NUMBER>> = {
          up: 1,
          right: 2,
          down: 4,
          left: 8,
        };
        this.dispatchButtonEventFunc(key, directions[key] ?? 0)(event);
      };

      connectedCallback(): void {
        this.ownerDocument.addEventListener('keydown', this.onKeyDown);
      }

      disconnectedCallback(): void {
        this.ownerDocument.removeEventListener('keydown', this.onKeyDown);
        if (this.dialog.open) this.dialog.close();
      }

      protected dispatchButtonEventFunc(
        key: BUTTON_KEY,
        direction: DIRECTION_NUMBER = 0,
      ): (event: Event) => void {
        return (event: Event) => {
          event.preventDefault();
          event.stopPropagation();
          const detail = createGameDpadPressButtonDetail(key, direction);
          this.dispatchEvent(
            new CustomEvent('press', {
              detail: detail,
              bubbles: false,
              composed: false,
            }),
          );
        };
      }

      protected dispatchDirectionButtonEventFunc(
        key: 'up' | 'down' | 'left' | 'right',
        direction: DIRECTION_NUMBER,
      ): (event: Event) => void {
        return this.dispatchButtonEventFunc(key, direction);
      }
    },
  );
});
