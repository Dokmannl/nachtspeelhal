GAMES.push({
  id: 'sterrenblokken',
  name: 'Sterrenblokken',
  color: '#9ec5ff',
  music: { bpm: 104, root: 57, scale: 'minor', prog: [0, 5, 2, 4], pad: 'triangle', lead: 'square', every: 2, pat: [0, 1, 2, 1, 3, 2, 1, 0], cut: 1500 },
  blurb: 'Stapel vallende sterrenblokken. Maak een rij helemaal vol en hij verdwijnt in een flits.',
  how: [
    'Pijltjes links en rechts: schuiven. Pijltje omhoog of X: draaien',
    'Pijltje omlaag: sneller vallen. Spatie: meteen laten vallen',
    'Telefoon: veeg links of rechts, tik om te draaien, veeg omlaag om te laten vallen',
    'Elke 10 rijen een level: sneller, vanaf level 6 rommelrijen van onderen, vanaf level 8 geen schaduw meer'
  ],
  touch: [
    { side: 'l', key: 'arrowleft', label: '\u2190', aria: 'Naar links' },
    { side: 'l', key: 'arrowright', label: '\u2192', aria: 'Naar rechts' },
    { side: 'r', key: 'arrowup', label: '\u27f3', aria: 'Draaien' },
    { side: 'r', key: 'arrowdown', label: '\u2193', aria: 'Sneller vallen' },
    { side: 'r', key: ' ', label: 'Val' }
  ],

  thumb(c, w, h) {
    const g = c.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#0d1433'); g.addColorStop(1, '#070b17');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    const S = 14, ox = 90, oy = 6;
    c.fillStyle = 'rgba(158,197,255,.06)'; c.fillRect(ox, oy, S * 10, S * 12);
    const cells = [[0, 11, '#7cc6fe'], [1, 11, '#7cc6fe'], [2, 11, '#7cc6fe'], [3, 11, '#7cc6fe'], [4, 11, '#ff8c42'], [5, 11, '#ff8c42'], [6, 11, '#ff8c42'], [7, 11, '#9ef0c8'], [8, 11, '#9ef0c8'],
      [0, 10, '#e5484d'], [1, 10, '#e5484d'], [4, 10, '#b392f0'], [5, 10, '#b392f0'], [6, 10, '#ff8c42'], [7, 10, '#f4d35e'], [8, 10, '#f4d35e'], [9, 10, '#5b8def'],
      [1, 9, '#e5484d'], [2, 9, '#e5484d'], [5, 9, '#b392f0'], [7, 9, '#f4d35e'], [8, 9, '#f4d35e'], [9, 9, '#5b8def'], [9, 8, '#5b8def'],
      [4, 2, '#b392f0'], [3, 3, '#b392f0'], [4, 3, '#b392f0'], [5, 3, '#b392f0']];
    for (const [x, y, col] of cells) { c.fillStyle = col; rrect(c, ox + x * S + 1, oy + y * S + 1, S - 2, S - 2, 3); c.fill(); }
    c.fillStyle = '#fff'; for (let i = 0; i < 18; i++) c.fillRect((i * 53) % w, (i * 37) % h, 1.5, 1.5);
  },

  create(A) {
    const ctx = A.ctx, COLS = 10, ROWS = 20;
    const SHAPES = { I: [[0, 1], [1, 1], [2, 1], [3, 1]], O: [[1, 0], [2, 0], [1, 1], [2, 1]], T: [[1, 0], [0, 1], [1, 1], [2, 1]], S: [[1, 0], [2, 0], [0, 1], [1, 1]], Z: [[0, 0], [1, 0], [1, 1], [2, 1]], J: [[0, 0], [0, 1], [1, 1], [2, 1]], L: [[2, 0], [0, 1], [1, 1], [2, 1]] };
    const COL = { I: '#7cc6fe', O: '#f4d35e', T: '#b392f0', S: '#9ef0c8', Z: '#e5484d', J: '#5b8def', L: '#ff8c42' };
    const NEWS = { 2: 'Ze vallen sneller', 4: 'Nog sneller', 6: 'Rommelrijen komen van onderen', 8: 'Geen schaduw meer' };
    const coarse = matchMedia('(pointer: coarse)').matches;
    const grid = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
    let bag = [], piece = null, next = null, cell = 20, ox = 0, oy = 0, W = 0, H = 0, side = 0;
    let fallT = 0, lockT = 0, lockMoves = 0, lines = 0, level = 1, score = 0, dead = false, deadT = 0, ended = false, t = 0;
    let dasDir = 0, dasT = 0, flashRows = [], flashT = 0, pieces = 0, parts = [];

    function layout() {
      W = A.W; H = A.H;
      side = W >= 520 ? 130 : 0;
      const availH = H - 24 - (coarse ? 90 : 0);
      cell = Math.max(10, Math.floor(Math.min(availH / ROWS, (W - 24 - side) / COLS)));
      ox = Math.floor((W - (cell * COLS + side)) / 2);
      oy = Math.max(12, Math.floor((availH + 24 - cell * ROWS) / 2));
    }
    layout();

    function draw7() {
      if (!bag.length) {
        bag = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
        for (let i = bag.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [bag[i], bag[j]] = [bag[j], bag[i]]; }
      }
      return bag.pop();
    }
    function fits(cells, px, py) {
      for (const [cx, cy] of cells) {
        const x = px + cx, y = py + cy;
        if (x < 0 || x >= COLS || y >= ROWS) return false;
        if (y >= 0 && grid[y][x]) return false;
      }
      return true;
    }
    const grounded = () => !fits(piece.cells, piece.x, piece.y + 1);
    function onMove() { if (grounded()) { lockT = 0; lockMoves++; } }
    function move(d) { if (fits(piece.cells, piece.x + d, piece.y)) { piece.x += d; onMove(); A.sound(300, .03, 'square', .025); } }
    function tryRotate() {
      if (piece.type === 'O') return;
      const rc = piece.cells.map(([x, y]) => [piece.n - 1 - y, x]);
      for (const [kx, ky] of [[0, 0], [-1, 0], [1, 0], [-2, 0], [2, 0], [0, -1]]) {
        if (fits(rc, piece.x + kx, piece.y + ky)) {
          piece.cells = rc; piece.x += kx; piece.y += ky; onMove();
          A.sound(520, .05, 'triangle', .04);
          return;
        }
      }
    }
    function addGarbage() {
      if (grid[0].some(Boolean)) { die(); return; }
      grid.shift();
      const row = Array(COLS).fill('#5d6772');
      row[Math.floor(Math.random() * COLS)] = null;
      grid.push(row);
      A.sound(140, .2, 'sawtooth', .05);
    }
    function spawn() {
      piece = { type: next, n: next === 'I' || next === 'O' ? 4 : 3, cells: SHAPES[next].map(c => c.slice()), x: 3, y: next === 'I' ? -1 : 0 };
      next = draw7();
      fallT = 0; lockT = 0; lockMoves = 0; pieces++;
      if (level >= 6 && pieces % 8 === 0) addGarbage();
      if (!dead && !fits(piece.cells, piece.x, piece.y)) die();
    }
    function die() {
      if (dead) return;
      dead = true; deadT = 0;
      A.vibrate(200); A.sound(160, .6, 'sawtooth', .07, -100);
    }
    function lock() {
      for (const [cx, cy] of piece.cells) {
        const x = piece.x + cx, y = piece.y + cy;
        if (y < 0) { die(); return; }
        grid[y][x] = COL[piece.type];
      }
      const full = [];
      for (let y = 0; y < ROWS; y++) if (grid[y].every(Boolean)) full.push(y);
      if (full.length) {
        for (const y of full) {
          for (let x = 0; x < COLS; x++) {
            for (let k = 0; k < (A.reduce ? 1 : 3); k++) parts.push({ x: ox + (x + .5) * cell, y: oy + (y + .5) * cell, vx: A.rand(-160, 160), vy: A.rand(-200, 40), life: A.rand(.4, .8), age: 0, color: grid[y][x] });
          }
        }
        for (const y of full) { grid.splice(y, 1); grid.unshift(Array(COLS).fill(null)); }
        flashRows = full; flashT = .3;
        lines += full.length;
        score += [0, 100, 300, 500, 800][full.length] * level;
        A.sound(600 + full.length * 120, .25, 'triangle', .08, 400);
        if (full.length === 4) A.vibrate(60);
        const nl = 1 + Math.floor(lines / 10);
        if (nl > level) { level = nl; A.level(level, NEWS[level] || 'Ze vallen sneller'); }
      } else A.sound(200, .05, 'square', .03);
      spawn();
    }
    function hardDrop() {
      let n = 0;
      while (fits(piece.cells, piece.x, piece.y + 1)) { piece.y++; n++; }
      score += 2 * n;
      lock();
    }

    next = draw7();
    spawn();

    function update(dt) {
      t += dt; flashT = Math.max(0, flashT - dt);
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i]; p.age += dt;
        if (p.age > p.life) { parts.splice(i, 1); continue; }
        p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 500 * dt;
      }
      if (dead) { deadT += dt; if (deadT > 1 && !ended) { ended = true; A.score(score); A.end(); } return; }

      const left = A.key('arrowleft', 'a'), right = A.key('arrowright', 'd');
      if (A.hit('arrowleft', 'a', 'swipeleft')) move(-1);
      if (A.hit('arrowright', 'd', 'swiperight')) move(1);
      const dir = right ? 1 : left ? -1 : 0;
      if (dir !== dasDir) { dasDir = dir; dasT = 0; }
      else if (dir) { dasT += dt; if (dasT > .17) { move(dir); dasT = .12; } }
      if (A.hit('arrowup', 'w', 'x', 'tap')) tryRotate();
      if (A.hit(' ', 'swipedown')) { hardDrop(); if (dead) return; }
      else {
        const soft = A.key('arrowdown', 's');
        const g = Math.max(.05, .8 * Math.pow(.82, level - 1));
        fallT += dt * (soft ? Math.max(1, 20 * g) : 1);
        while (fallT >= g) {
          fallT -= g;
          if (fits(piece.cells, piece.x, piece.y + 1)) { piece.y++; lockT = 0; if (soft) score += 1; }
          else break;
        }
        if (grounded()) { lockT += dt; if (lockT > .5 || lockMoves > 15) lock(); }
      }
      A.score(score);
      A.info('Rijen ' + lines);
    }

    function blockAt(px, py, color, alpha) {
      ctx.globalAlpha = alpha;
      ctx.fillStyle = color; rrect(ctx, px + 1, py + 1, cell - 2, cell - 2, Math.max(2, cell * .18)); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.28)'; ctx.fillRect(px + 3, py + 3, cell - 6, Math.max(2, cell * .12));
      ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.fillRect(px + cell * .66, py + cell * .62, Math.max(1.5, cell * .1), Math.max(1.5, cell * .1));
      ctx.globalAlpha = 1;
    }
    function draw() {
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#0d1433'); g.addColorStop(1, '#070b17');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      for (let i = 0; i < 60; i++) {
        ctx.fillStyle = `rgba(230,240,255,${.25 + .35 * Math.abs(Math.sin(t * .8 + i))})`;
        ctx.fillRect((i * 137) % W, (i * 89) % H, 1.5, 1.5);
      }
      ctx.fillStyle = 'rgba(158,197,255,.06)'; ctx.fillRect(ox, oy, cell * COLS, cell * ROWS);
      ctx.strokeStyle = 'rgba(158,197,255,.07)'; ctx.lineWidth = 1;
      for (let x = 1; x < COLS; x++) { ctx.beginPath(); ctx.moveTo(ox + x * cell + .5, oy); ctx.lineTo(ox + x * cell + .5, oy + ROWS * cell); ctx.stroke(); }
      for (let y = 1; y < ROWS; y++) { ctx.beginPath(); ctx.moveTo(ox, oy + y * cell + .5); ctx.lineTo(ox + COLS * cell, oy + y * cell + .5); ctx.stroke(); }
      ctx.strokeStyle = 'rgba(158,197,255,.35)'; ctx.lineWidth = 2; ctx.strokeRect(ox - 1, oy - 1, cell * COLS + 2, cell * ROWS + 2);

      for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (grid[y][x]) blockAt(ox + x * cell, oy + y * cell, dead ? '#3a4452' : grid[y][x], 1);
      if (piece && !dead) {
        if (level < 8) {
          let gy = piece.y;
          while (fits(piece.cells, piece.x, gy + 1)) gy++;
          ctx.strokeStyle = 'rgba(232,239,228,.35)'; ctx.lineWidth = 1.5;
          for (const [cx, cy] of piece.cells) if (gy + cy >= 0) { rrect(ctx, ox + (piece.x + cx) * cell + 2, oy + (gy + cy) * cell + 2, cell - 4, cell - 4, 3); ctx.stroke(); }
        }
        for (const [cx, cy] of piece.cells) if (piece.y + cy >= 0) blockAt(ox + (piece.x + cx) * cell, oy + (piece.y + cy) * cell, COL[piece.type], 1);
      }
      if (flashT > 0) {
        ctx.fillStyle = `rgba(255,255,255,${flashT * 2})`;
        for (const y of flashRows) ctx.fillRect(ox, oy + y * cell, cell * COLS, cell);
      }
      for (const p of parts) { ctx.globalAlpha = 1 - p.age / p.life; ctx.fillStyle = p.color; ctx.fillRect(p.x - 2, p.y - 2, 4, 4); }
      ctx.globalAlpha = 1;

      if (next) {
        const s = side ? cell * .8 : cell * .45;
        const nx = side ? ox + cell * COLS + 24 : ox + cell * COLS - s * 4 - 6;
        const ny = side ? oy + 28 : oy + 6;
        ctx.fillStyle = 'rgba(158,197,255,.7)'; ctx.font = '700 12px "Atkinson Hyperlegible", sans-serif';
        ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
        if (side) ctx.fillText('VOLGENDE', nx, ny - 10);
        ctx.globalAlpha = side ? 1 : .6;
        for (const [cx, cy] of SHAPES[next]) { ctx.fillStyle = COL[next]; rrect(ctx, nx + cx * s, ny + cy * s, s - 2, s - 2, 3); ctx.fill(); }
        ctx.globalAlpha = 1;
      }
    }

    return { update, draw, resize: layout, idle(dt) { t += dt; } };
  }
});
