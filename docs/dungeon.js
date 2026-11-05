/* A grid maze and 2D ray intersections only; no WebGL or 3D library. */
const SIZE = 16;
const DIRECTIONS = [[0, -1], [1, 0], [0, 1], [-1, 0]];

function generateDungeon(random = Math.random) {
  const map = Array.from({ length: SIZE }, () => Array(SIZE).fill(1));
  const stack = [[1, 1]];
  map[1][1] = 0;
  while (stack.length) {
    const [x, y] = stack[stack.length - 1];
    const choices = DIRECTIONS.filter(([dx, dy]) => {
      const nx = x + dx * 2, ny = y + dy * 2;
      return nx > 0 && ny > 0 && nx < SIZE - 1 && ny < SIZE - 1 && map[ny][nx];
    });
    if (!choices.length) { stack.pop(); continue; }
    const [dx, dy] = choices[Math.floor(random() * choices.length)];
    map[y + dy][x + dx] = 0;
    map[y + dy * 2][x + dx * 2] = 0;
    stack.push([x + dx * 2, y + dy * 2]);
  }
  // Add loops between existing passages, keeping every floor tile connected.
  for (let y = 1; y < SIZE - 1; y++) {
    for (let x = 1; x < SIZE - 1; x++) {
      if (map[y][x] && random() < 0.18 && (
        (!map[y][x - 1] && !map[y][x + 1]) ||
        (!map[y - 1][x] && !map[y + 1][x])
      )) map[y][x] = 0;
    }
  }
  return map;
}

// Walk grid boundaries until a ray meets a wall. The distance is also the
// camera-space depth because each ray is forward + right * screenOffset.
function castRay(map, px, py, dx, dy) {
  let x = Math.floor(px), y = Math.floor(py);
  const stepX = dx < 0 ? -1 : 1, stepY = dy < 0 ? -1 : 1;
  const deltaX = dx === 0 ? Infinity : Math.abs(1 / dx);
  const deltaY = dy === 0 ? Infinity : Math.abs(1 / dy);
  let nextX = (dx < 0 ? px - x : x + 1 - px) * deltaX;
  let nextY = (dy < 0 ? py - y : y + 1 - py) * deltaY;
  for (let i = 0; i < SIZE * 2; i++) {
    let depth, side;
    if (nextX < nextY) {
      depth = nextX; nextX += deltaX; x += stepX; side = 'x';
    } else {
      depth = nextY; nextY += deltaY; y += stepY; side = 'y';
    }
    if (map[y]?.[x] !== 0) return { depth, face: `${x},${y},${side}` };
  }
  throw new Error('Ray escaped the dungeon.');
}

Promise.all([
  customElements.whenDefined('game-frame'),
  customElements.whenDefined('game-dpad'),
]).then(() => {
  const game = document.getElementById('game');
  const dpad = document.getElementById('dpad');
  const canvas = game.getCanvas();
  const ctx = canvas.getContext('2d');
  let map, visited, x, y, facing, steps;
  let screen = 'title', selection = 0, configuring = false, message = '';
  const menus = ['ダンジョンに潜る', 'キーコンフィグ'];

  function text(value, px, py, size = 16, align = 'left') {
    ctx.fillStyle = '#fff';
    ctx.font = `${size}px monospace`;
    ctx.textAlign = align;
    ctx.fillText(value, px, py);
  }
  function line(x1, y1, x2, y2) {
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  }
  function start() {
    map = generateDungeon();
    visited = Array.from({ length: SIZE }, () => Array(SIZE).fill(false));
    x = 1; y = 1; facing = map[1][2] === 0 ? 1 : 2; steps = 0;
    visited[y][x] = true;
    screen = 'dungeon'; message = '';
    render();
  }
  function renderView() {
    const [fx, fy] = DIRECTIONS[facing];
    const [rx, ry] = DIRECTIONS[(facing + 1) % 4];
    const focal = 180, centerY = 245;
    let previous;
    ctx.save();
    ctx.beginPath(); ctx.rect(12, 72, 376, 346); ctx.clip();
    // Draw only the nearest wall's outline. Hidden walls never show through.
    for (let column = 12; column <= 388; column++) {
      const offset = (column - 200) / focal;
      const hit = castRay(map, x + 0.5, y + 0.5, fx + rx * offset, fy + ry * offset);
      const half = focal * 0.5 / hit.depth;
      const top = centerY - half, bottom = centerY + half;
      if (previous && previous.face === hit.face) {
        line(column - 1, previous.top, column, top);
        line(column - 1, previous.bottom, column, bottom);
      } else {
        if (previous) line(column - 1, previous.top, column - 1, previous.bottom);
        line(column, top, column, bottom);
      }
      previous = { ...hit, top, bottom };
    }
    ctx.restore();
    ctx.strokeRect(12, 72, 376, 346);
    text(`16 × 16 / B1F`, 16, 30);
    text(`${['N', 'E', 'S', 'W'][facing]}   (${x}, ${y})   ${steps} STEPS`, 384, 56, 16, 'right');
    const explored = visited.flat().filter(Boolean).length;
    const total = map.flat().filter(tile => tile === 0).length;
    text(`探索 ${explored} / ${total}${explored === total ? '  COMPLETE!' : ''}`, 16, 442, 14);
    text(message || '↑↓ 前後移動  ←→ 平行移動', 200, 468, 15, 'center');
    text('L/R 旋回', 200, 490, 14, 'center');
    text('× タイトル', 384, 442, 14, 'right');
  }
  function render() {
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1;
    if (screen === 'dungeon') { renderView(); return; }
    for (let i = 0; i < 4; i++) {
      const inset = i * 22;
      ctx.strokeRect(90 + inset, 54 + inset / 2, 220 - inset * 2, 94 - inset);
    }
    text('WIRE DUNGEON', 200, 210, 32, 'center');
    text('16 × 16  /  RANDOM LABYRINTH', 200, 240, 14, 'center');
    menus.forEach((label, i) => {
      const top = 280 + i * 60;
      if (selection === i) ctx.strokeRect(40, top, 320, 48);
      text(`${selection === i ? '› ' : ''}${label}`, 200, top + 32, 20, 'center');
    });
  }
  async function activate() {
    if (configuring) return;
    if (selection === 0) { start(); return; }
    configuring = true;
    try {
      await dpad.showKeyConfig();
      message = 'キー設定を保存しました';
    } catch (error) {
      message = error.name === 'AbortError' ? '' : 'キー設定を開けませんでした';
    } finally { configuring = false; render(); }
  }
  dpad.addEventListener('press', ({ detail: { key } }) => {
    if (configuring) return;
    if (screen === 'title') {
      if (key === 'up' || key === 'down') { selection = 1 - selection; message = ''; }
      if (key === 'confirmed') { activate(); return; }
    } else {
      message = '';
      if (key === 'cancelable') { screen = 'title'; selection = 0; }
      else if (key === 'l' || key === 'r') facing = (facing + (key === 'l' ? 3 : 1)) % 4;
      else {
        const relative = { up: 0, right: 1, down: 2, left: 3 }[key];
        if (relative !== undefined) {
          const [dx, dy] = DIRECTIONS[(facing + relative) % 4];
          if (map[y + dy]?.[x + dx] === 0) {
            x += dx; y += dy; steps++; visited[y][x] = true;
          } else message = '壁があり、進めません';
        }
      }
    }
    render();
  });
  game.addEventListener('press', ({ detail }) => {
    if (screen !== 'title' || configuring) return;
    if (detail.x < 40 || detail.x > 360) return;
    const index = Math.floor((detail.y - 280) / 60);
    if (index < 0 || index > 1 || detail.y > 280 + index * 60 + 48) return;
    selection = index; activate();
  });
  render();
});
