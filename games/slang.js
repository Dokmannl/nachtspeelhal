GAMES.push({
  id: 'slang',
  name: 'Slang',
  color: '#b392f0',
  music: { bpm: 96, root: 55, scale: 'minor', prog: [0, 3, 0, 4], pad: 'triangle', lead: 'triangle', every: 2, pat: [0, 2, 1, 2], cut: 2000 },
  blurb: 'De klassieker. Eet appels, word langer en bijt niet in je eigen staart.',
  how: [
    'Kies hieronder: met muren (klassiek) of door de rand heen. Elke keuze heeft een eigen scorebord',
    'Pijltjes of WASD om te draaien',
    'Op je telefoon: veeg in de richting die je op wilt',
    'Rode appel = 10 punten, gouden appel = 50 punten (maar die verdwijnt snel)',
    'Elke 5 appels een level: sneller, vanaf level 3 muurtjes in het veld, vanaf level 5 verdwijnen appels na een tijdje'
  ],
  modes: [{ id: 'slang', label: 'Muren aan' }, { id: 'slang-rand', label: 'Door de rand' }],
  touch: [
    { side: 'l', key: 'arrowleft', label: '\u2190', aria: 'Naar links' },
    { side: 'l', key: 'arrowright', label: '\u2192', aria: 'Naar rechts' },
    { side: 'r', key: 'arrowup', label: '\u2191', aria: 'Omhoog' },
    { side: 'r', key: 'arrowdown', label: '\u2193', aria: 'Omlaag' }
  ],

  thumb(c, w, h) {
    c.fillStyle = '#0d1020'; c.fillRect(0, 0, w, h);
    const S = 16;
    for (let x = 0; x < w; x += S) for (let y = 0; y < h; y += S) if (((x + y) / S) % 2) { c.fillStyle = '#10142a'; c.fillRect(x, y, S, S); }
    const body = [[6, 7], [7, 7], [8, 7], [9, 7], [9, 6], [9, 5], [10, 5], [11, 5], [12, 5]];
    body.forEach(([x, y], i) => { c.fillStyle = `hsl(${265 - i * 6},70%,${55 + i * 2}%)`; rrect(c, x * S + 1, y * S + 1, S - 2, S - 2, 5); c.fill(); });
    c.fillStyle = '#e5484d'; c.beginPath(); c.arc(15 * S + 8, 5 * S + 8, 6, 0, 7); c.fill();
    c.fillStyle = '#f4d35e'; c.beginPath(); c.arc(4 * S + 8, 3 * S + 8, 6, 0, 7); c.fill();
  },

  create(A) {
    const ctx = A.ctx, wrap = A.mode === 'slang-rand';
    let W = A.W, H = A.H;
    const cols = Math.max(12, Math.min(36, Math.floor(W / 24)));
    const rows = Math.max(10, Math.min(26, Math.floor(H / 24)));
    let cell = 20, ox = 0, oy = 0;
    const midY = Math.floor(rows / 2);
    let snake = [{ x: 5, y: midY }, { x: 4, y: midY }, { x: 3, y: midY }];
    let dir = { x: 1, y: 0 }, queue = [], food = null, gold = null, goldT = 0;
    let stepT = 0, interval = .145, score = 0, grow = 0, dead = false, deadT = 0, ended = false, t = 0, eatFx = 0;
    let eaten = 0, lv = 1, walls = [], foodT = 0;
    const NEWS = { 2: 'Je gaat sneller', 3: 'Er verschijnen muurtjes', 5: 'Appels verdwijnen na een tijdje' };
    const isWall = (x, y) => walls.some(w => w.x === x && w.y === y);
    const foodLife = () => Math.max(4, 8 - (lv - 5) * .5);

    function resize() {
      W = A.W; H = A.H;
      cell = Math.max(8, Math.floor(Math.min(W / cols, H / rows)));
      ox = Math.floor((W - cell * cols) / 2); oy = Math.floor((H - cell * rows) / 2);
    }
    resize();
    const occupied = (x, y) => snake.some(s => s.x === x && s.y === y);
    function freeCell() {
      for (let i = 0; i < 600; i++) {
        const x = Math.floor(Math.random() * cols), y = Math.floor(Math.random() * rows);
        if (!occupied(x, y) && !isWall(x, y) && !(food && food.x === x && food.y === y) && !(gold && gold.x === x && gold.y === y)) return { x, y };
      }
      return null;
    }
    food = freeCell();

    function addWall() {
      const hd = snake[0];
      for (let tries = 0; tries < 200; tries++) {
        const len = 3 + Math.floor(Math.random() * 3), horiz = Math.random() < .5;
        const x0 = Math.floor(Math.random() * (cols - (horiz ? len : 0))), y0 = Math.floor(Math.random() * (rows - (horiz ? 0 : len)));
        const cells = [];
        for (let i = 0; i < len; i++) cells.push({ x: x0 + (horiz ? i : 0), y: y0 + (horiz ? 0 : i) });
        const ok = cells.every(c => !occupied(c.x, c.y) && !isWall(c.x, c.y)
          && Math.abs(c.x - hd.x) + Math.abs(c.y - hd.y) > 6
          && !(food && food.x === c.x && food.y === c.y) && !(gold && gold.x === c.x && gold.y === c.y)
          && !(c.x === hd.x + dir.x * 2 && c.y === hd.y + dir.y * 2));
        if (ok) { walls.push(...cells); return; }
      }
    }
    function levelUp() {
      const n = 1 + Math.floor(eaten / 5);
      if (n === lv) return;
      lv = n;
      interval = Math.max(.055, .145 - (lv - 1) * .012);
      if (lv >= 3 && walls.length < 60) { addWall(); if (lv >= 6) addWall(); }
      A.level(lv, NEWS[lv] || 'Sneller en meer muurtjes');
    }
    function turn(x, y) {
      const last = queue.length ? queue[queue.length - 1] : dir;
      if ((x === -last.x && y === -last.y) || (x === last.x && y === last.y)) return;
      if (queue.length < 3) queue.push({ x, y });
    }
    function step() {
      if (queue.length) dir = queue.shift();
      const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
      if (wrap) { head.x = (head.x + cols) % cols; head.y = (head.y + rows) % rows; }
      const body = grow > 0 ? snake : snake.slice(0, -1);
      if (head.x < 0 || head.y < 0 || head.x >= cols || head.y >= rows || body.some(s => s.x === head.x && s.y === head.y) || isWall(head.x, head.y)) {
        dead = true; A.sound(150, .5, 'sawtooth', .07, -90); return;
      }
      snake.unshift(head);
      if (food && head.x === food.x && head.y === food.y) {
        score += 10 * lv; grow += 1; eatFx = .2; eaten++;
        food = freeCell(); foodT = foodLife();
        levelUp();
        A.sound(660, .08, 'square', .05, 200);
        if (!gold && Math.random() < .18) { gold = freeCell(); goldT = 6; }
      } else if (gold && head.x === gold.x && head.y === gold.y) {
        score += 50 * lv; grow += 3; gold = null; eatFx = .3;
        A.sound(990, .2, 'triangle', .07, 500);
      }
      if (grow > 0) grow--; else snake.pop();
    }

    function update(dt) {
      t += dt; eatFx = Math.max(0, eatFx - dt);
      if (dead) { deadT += dt; if (deadT > .8 && !ended) { ended = true; A.end(); } return; }
      if (A.hit('arrowup', 'w', 'swipeup')) turn(0, -1);
      if (A.hit('arrowdown', 's', 'swipedown')) turn(0, 1);
      if (A.hit('arrowleft', 'a', 'swipeleft')) turn(-1, 0);
      if (A.hit('arrowright', 'd', 'swiperight')) turn(1, 0);
      if (gold) { goldT -= dt; if (goldT <= 0) gold = null; }
      if (lv >= 5 && food) { foodT -= dt; if (foodT <= 0) { food = freeCell(); foodT = foodLife(); } }
      stepT += dt;
      while (stepT >= interval && !dead) { stepT -= interval; step(); }
      A.score(score);
      A.info('Lengte ' + snake.length);
    }

    function draw() {
      ctx.fillStyle = '#070b17'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#0d1020'; ctx.fillRect(ox, oy, cols * cell, rows * cell);
      ctx.fillStyle = '#10142a';
      for (let x = 0; x < cols; x++) for (let y = 0; y < rows; y++) if ((x + y) % 2) ctx.fillRect(ox + x * cell, oy + y * cell, cell, cell);
      ctx.strokeStyle = wrap ? 'rgba(179,146,240,.5)' : '#2a2350'; ctx.lineWidth = 2; if (wrap) ctx.setLineDash([6, 6]);
      ctx.strokeRect(ox - 1, oy - 1, cols * cell + 2, rows * cell + 2); ctx.setLineDash([]);

      for (const w of walls) {
        ctx.fillStyle = '#4a5260'; ctx.fillRect(ox + w.x * cell + 1, oy + w.y * cell + 1, cell - 2, cell - 2);
        ctx.fillStyle = '#6b7482'; ctx.fillRect(ox + w.x * cell + 1, oy + w.y * cell + 1, cell - 2, 3);
      }
      if (food) {
        const cx = ox + food.x * cell + cell / 2, cy = oy + food.y * cell + cell / 2;
        if (lv >= 5) {
          const f = Math.max(0, foodT / foodLife());
          ctx.strokeStyle = f < .3 ? '#e5484d' : 'rgba(232,239,228,.5)'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(cx, cy, cell * .55, -Math.PI / 2, -Math.PI / 2 + f * Math.PI * 2); ctx.stroke();
        }
        ctx.fillStyle = '#e5484d'; ctx.beginPath(); ctx.arc(cx, cy + 1, cell * .38, 0, 7); ctx.fill();
        ctx.fillStyle = '#3fae6a'; ctx.beginPath(); ctx.ellipse(cx + cell * .12, cy - cell * .34, cell * .14, cell * .07, -.6, 0, 7); ctx.fill();
      }
      if (gold) {
        const cx = ox + gold.x * cell + cell / 2, cy = oy + gold.y * cell + cell / 2;
        const blink = goldT < 2 && Math.sin(t * 20) < 0 ? .35 : 1;
        ctx.globalAlpha = blink;
        ctx.shadowColor = '#f4d35e'; ctx.shadowBlur = 12;
        ctx.fillStyle = '#f4d35e'; ctx.beginPath(); ctx.arc(cx, cy, cell * .4, 0, 7); ctx.fill();
        ctx.shadowBlur = 0; ctx.globalAlpha = 1;
      }
      const n = snake.length;
      for (let i = n - 1; i >= 0; i--) {
        const s = snake[i], k = i / Math.max(1, n - 1);
        ctx.fillStyle = dead ? `hsl(0,30%,${40 - k * 10}%)` : `hsl(${268 - k * 40},70%,${68 - k * 18}%)`;
        const pad = i === 0 ? 1 : 2 + k * 1.5;
        rrect(ctx, ox + s.x * cell + pad, oy + s.y * cell + pad, cell - pad * 2, cell - pad * 2, cell * .3); ctx.fill();
      }
      const hd = snake[0], hx = ox + hd.x * cell + cell / 2, hy = oy + hd.y * cell + cell / 2;
      const ex = dir.y !== 0 ? cell * .2 : 0, ey = dir.x !== 0 ? cell * .2 : 0;
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(hx - ex + dir.x * cell * .15, hy - ey + dir.y * cell * .15, cell * .13, 0, 7); ctx.arc(hx + ex + dir.x * cell * .15, hy + ey + dir.y * cell * .15, cell * .13, 0, 7); ctx.fill();
      ctx.fillStyle = '#070b17';
      ctx.beginPath(); ctx.arc(hx - ex + dir.x * cell * .2, hy - ey + dir.y * cell * .2, cell * .06, 0, 7); ctx.arc(hx + ex + dir.x * cell * .2, hy + ey + dir.y * cell * .2, cell * .06, 0, 7); ctx.fill();
      if (eatFx > 0) { ctx.strokeStyle = `rgba(179,146,240,${eatFx * 4})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(hx, hy, cell * (1.4 - eatFx * 2), 0, 7); ctx.stroke(); }
    }

    return { update, draw, resize };
  }
});
