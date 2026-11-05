interface GameFrameElement extends HTMLElement {
  addEventListener(
    type: 'press',
    listener: (this: GameFrameElement, ev: GameFramePressButtonEvent) => any,
    options?: boolean | AddEventListenerOptions,
  ): void;
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions,
  ): void;
  getCanvas(): HTMLCanvasElement;
}
type GameFramePressButtonEvent = CustomEvent<GameFramePressButtonDetail>;
type GameFramePressButtonDetail = {
  x: number;
  y: number;
};

((script) => {
  const tagName = script.getAttribute('game-frame-name') ?? 'game-frame';
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
    :host { display: block; width: 100%; height: 100%; user-select: none; touch-action: manipulation; }
    :host > div { display: grid; grid-template-rows: minmax(0, 2fr) minmax(0, 1fr); width: 100%; height: 100%; }
    canvas { display: block; width: 100%; height: 100%; min-width: 0; min-height: 0; image-rendering: pixelated; object-fit: contain; object-position: center; }
    .controller-area { width: 100%; height: 100%; }
  `);

  customElements.define(
    tagName,
    class extends HTMLElement implements GameFrameElement {
      protected canvas: HTMLCanvasElement;

      constructor() {
        super();

        this.canvas = document.createElement('canvas');
        this.canvas.width = this.getAttribute('width')
          ? parseInt(this.getAttribute('width')!)
          : 160;
        this.canvas.height = this.getAttribute('height')
          ? parseInt(this.getAttribute('height')!)
          : 200;
        this.canvas.addEventListener('click', (event) => {
          const detail = this.calcClickPosition(event);
          if (!detail) {
            return;
          }
          this.dispatchEvent(new CustomEvent<GameFramePressButtonDetail>('press', {
            detail,
            bubbles: true,
            composed: true,
          }));
        });

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

      getCanvas(): HTMLCanvasElement {
        return this.canvas;
      }

      protected calcClickPosition(event: MouseEvent): GameFramePressButtonDetail | null {
        const width = this.canvas.width;
        const height = this.canvas.height;
        const rect = this.canvas.getBoundingClientRect();
        const WIDTH = rect.width;
        const HEIGHT = rect.height;
        if (width <= 0 || height <= 0 || WIDTH <= 0 || HEIGHT <= 0) return null;
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        let position: GameFramePressButtonDetail;

        if (height / width < HEIGHT / WIDTH) {
          const scale = width / WIDTH;
          const h = (HEIGHT - WIDTH * height / width) / 2;
          position = { x: x * scale, y: (y - h) * scale };
        } else {
          const scale = height / HEIGHT;
          const w = (WIDTH - HEIGHT * width / height) / 2;
          position = { x: (x - w) * scale, y: y * scale };
        }
        // Ignore the empty space around the image created by object-fit: contain.
        if (position.x < 0 || width <= position.x ||
            position.y < 0 || height <= position.y) return null;
        return position;
      }
    },
  );
});
