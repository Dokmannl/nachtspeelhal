GAMES.push({
  id: 'kikkersprong',
  name: 'Kikkersprong',
  color: '#7ee08a',
  music: { bpm: 116, root: 60, scale: 'major', prog: [0, 4, 3, 4], pad: 'triangle', lead: 'triangle', every: 2, pat: [0, 2, 1, 2, 3, 2], cut: 1800 },
  blurb: 'Help de kikkers \'s nachts over de drukke weg en de rivier naar hun waterlelie.',
  how: [
    'Pijltjes of WASD: \u00e9\u00e9n sprong per druk. Telefoon: vegen of de knoppen',
    'Op de weg: ontwijk de auto\'s. Op de rivier: blijf op boomstammen en schildpadden',
    'Breng 5 kikkers naar de waterlelies voor het volgende level. Let op de tijdbalk',
    'Level 3: schildpadden duiken onder. Level 5: een slang op de middenberm. Level 7: kortere boomstammen'
  ],
  touch: [
    { side: 'l', key: 'arrowleft', label: '\u2190', aria: 'Naar links' },
    { side: 'l', key: 'arrowright', label: '\u2192', aria: 'Naar rechts' },
    { side: 'r', key: 'arrowdown', label: '\u2193', aria: 'Terug' },
    { side: 'r', key: 'arrowup', label: '\u2191', aria: 'Vooruit' }
  ],

  thumb(c, w, h) {
    const R = 15;
    for (let r = 0; r < 12; r++) {
      const y = h - (r + 1) * R;
      c.fillStyle = r === 0 || r === 6 ? '#1d3b24' : r < 6 ? '#24262e' : r < 11 ? '#0f2a4a' : '#163a2a';
      c.fillRect(0, y, w, R);
    }
    c.fillStyle = '#ff8c42'; rrect(c, 40, h - 2 * R + 2, 24, R - 4, 3); c.fill();
    c.fillStyle = '#7cc6fe'; rrect(c, 180, h - 4 * R + 2, 40, R - 4, 3); c.fill();
    c.fillStyle = '#7a5236'; rrect(c, 60, h - 8 * R + 2, 70, R - 4, 5); c.fill(); rrect(c, 190, h - 10 * R + 2, 80, R - 4, 5); c.fill();
    c.fillStyle = '#2f9e5b'; for (let i = 0; i < 3; i++) { c.beginPath(); c.arc(110 + i * 14, h - 9 * R + 7, 6, 0, 7); c.fill(); }
    c.fillStyle = '#7ee08a'; c.beginPath(); c.arc(160, h - 7 * R + 7, 7, 0, 7); c.fill();
    c.fillStyle = '#fff'; c.beginPath(); c.arc(156, h - 7 * R + 3, 2.5, 0, 7); c.arc(164, h - 7 * R + 3, 2.5, 0, 7); c.fill();
    c.fillStyle = '#2f9e5b'; for (let i = 0; i < 5; i++) { c.beginPath(); c.arc(32 + i * 64, h - 12 * R + 8, 7, 0, 7); c.fill(); }
  },

  create(A) {
    const ctx = A.ctx, rand = A.rand, NR = 13, HOMES = 5, TIME = 30;
    const NEWS = { 2: 'Meer en sneller verkeer', 3: 'Schildpadden duiken onder', 5: 'Pas op: een slang op de middenberm', 7: 'Kortere boomstammen' };
    const CARS = ['#e5484d', '#7cc6fe', '#f4d35e', '#b392f0', '#f78fb3'];
    const coarse = matchMedia('(pointer: coarse)').matches;
    let W = 0, H = 0, R = 30, base = 0;
    let level = 1, lives = 3, score = 0, t = 0, timeLeft = TIME, maxRow = 0;
    let lanes = [], homes = Array(HOMES).fill(false), snake = null, parts = [];
    let dead = false, deadT = 0, ended = false, deathKind = '';
    const frog = { x: 0, row: 0, hop: 0, fromX: 0, fromRow: 0, toX: 0, toRow: 0, face: 0 };

    const rowY = r => base - (r + 1) * R;
    const homeX = i => W * (i + .5) / HOMES;

    function buildLanes() {
      const k = (1 + (level - 1) * .15) * (R / 40);
      const defs = [
        { row: 1, dir: -1, sp: 60, kind: 'car', len: 1.2, gap: 4.6 },
        { row: 2, dir: 1, sp: 90, kind: 'car', len: 1.2, gap: 3.8 },
        { row: 3, dir: -1, sp: 70, kind: 'truck', len: 2.4, gap: 5 },
        { row: 4, dir: 1, sp: 120, kind: 'car', len: 1.2, gap: 4.4 },
        { row: 5, dir: -1, sp: 55, kind: 'truck', len: 2.8, gap: 5.6 },
        { row: 7, dir: 1, sp: 55, kind: 'log', len: 3.2, gap: 2.8 },
        { row: 8, dir: -1, sp: 75, kind: 'turtle', len: 2, gap: 2.6 },
        { row: 9, dir: 1, sp: 95, kind: 'log', len: 4.2, gap: 3 },
        { row: 10, dir: -1, sp: 65, kind: 'turtle', len: 3, gap: 2.4 },
        { row: 11, dir: 1, sp: 80, kind: 'log', len: 2.6, gap: 2.6 }
      ];
      lanes = defs.map(d => {
        let len = d.len, gap = d.gap;
        if (d.row < 6) gap = Math.max(len + 1.4, gap - (level - 1) * .35);
        if (d.kind === 'log' && level >= 7) len = Math.max(1.8, len - .8 - (level - 7) * .2);
        const step = (len + gap) * R;
        const n = Math.ceil((W + len * R) / step) + 1;
        const off = rand(0, step);
        const items = [];
        for (let i = 0; i < n; i++) items.push({ x: i * step + off - step, w: len * R, color: CARS[Math.floor(Math.random() * CARS.length)], dives: d.kind === 'turtle' && level >= 3 && Math.random() < .45, ph: rand(0, 4) });
        return { row: d.row, dir: d.dir, sp: d.sp * k, kind: d.kind, items, span: n * step };
      });
      snake = level >= 5 ? { x: 0, dir: 1, sp: (50 + level * 6) * (R / 40), len: 2.6 * R } : null;
    }
    function layout() {
      W = A.W; H = A.H;
      const pad = coarse ? 88 : 0;
      R = Math.max(20, Math.floor(Math.min((H - pad - 8) / NR, W / 9)));
      base = H - pad;
      buildLanes();
      frog.x = Math.min(Math.max(frog.x || W / 2, R / 2), W - R / 2);
      frog.toX = frog.x;
    }
    function resetFrog() {
      frog.x = frog.toX = frog.fromX = Math.round(W / 2 / R) * R - R / 2 + (W / 2 < R ? R : 0);
      frog.x = Math.min(Math.max(frog.x, R / 2), W - R / 2); frog.toX = frog.fromX = frog.x;
      frog.row = frog.toRow = frog.fromRow = 0; frog.hop = 0; frog.face = 0;
      timeLeft = TIME; maxRow = 0;
    }
    layout();
    resetFrog();

    const submerged = it => it.dives && ((t * .5 + it.ph) % 4) > 2.7 && ((t * .5 + it.ph) % 4) < 3.7;
    function burst(x, y, color, n = 16) {
      if (A.reduce) n = 5;
      for (let i = 0; i < n; i++) { const a = rand(0, 7), s = rand(40, 200); parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: rand(.3, .7), age: 0, color }); }
    }
    function die(kind) {
      if (dead) return;
      dead = true; deadT = 0; deathKind = kind; lives--;
      A.vibrate(150);
      if (kind === 'splash') { burst(frog.x, rowY(frog.row) + R / 2, '#7cc6fe'); A.sound(220, .4, 'sine', .07, -150); }
      else { burst(frog.x, rowY(frog.row) + R / 2, '#7ee08a'); A.sound(140, .4, 'sawtooth', .07, -80); }
    }
    function laneAt(row) { return lanes.find(l => l.row === row); }
    function itemUnder(lane, x) { return lane.items.find(it => x >= it.x - R * .15 && x <= it.x + it.w + R * .15 && !submerged(it)); }

    function land() {
      const r = frog.row;
      if (r > maxRow) { score += 10 * (r - maxRow) * level; maxRow = r; }
      if (r === NR - 1) {
        let best = -1;
        for (let i = 0; i < HOMES; i++) if (Math.abs(frog.x - homeX(i)) < R * .75) best = i;
        if (best < 0 || homes[best]) { die('bank'); return; }
        homes[best] = true;
        score += 50 * level + Math.round(timeLeft) * level;
        A.sound(660, .3, 'triangle', .08, 400);
        burst(homeX(best), rowY(r) + R / 2, '#f4d35e', 20);
        if (homes.every(Boolean)) {
          level++; score += 200 * level;
          homes = Array(HOMES).fill(false);
          A.level(level, NEWS[level] || 'Alles gaat sneller');
          buildLanes();
        }
        resetFrog();
      }
    }

    function update(dt) {
      t += dt;
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i]; p.age += dt;
        if (p.age > p.life) { parts.splice(i, 1); continue; }
        p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= .93; p.vy *= .93;
      }
      for (const L of lanes) for (const it of L.items) {
        it.x += L.dir * L.sp * dt;
        if (L.dir > 0 && it.x > W) it.x -= L.span;
        if (L.dir < 0 && it.x + it.w < 0) it.x += L.span;
      }
      if (snake) {
        snake.x += snake.dir * snake.sp * dt;
        if (snake.x < 0) { snake.x = 0; snake.dir = 1; }
        if (snake.x + snake.len > W) { snake.x = W - snake.len; snake.dir = -1; }
      }
      if (dead) {
        deadT += dt;
        if (deadT > .9) {
          if (lives <= 0) { if (!ended) { ended = true; A.score(score); A.end(); } return; }
          dead = false; resetFrog();
        }
        A.score(score);
        return;
      }

      if (frog.hop > 0) {
        frog.hop = Math.max(0, frog.hop - dt / .12);
        const k = 1 - frog.hop;
        frog.x = frog.fromX + (frog.toX - frog.fromX) * k;
        if (frog.hop === 0) { frog.row = frog.toRow; land(); if (dead) return; }
      } else {
        let dx = 0, dr = 0;
        if (A.hit('arrowup', 'w', 'swipeup')) dr = 1;
        else if (A.hit('arrowdown', 's', 'swipedown')) dr = -1;
        else if (A.hit('arrowleft', 'a', 'swipeleft')) dx = -1;
        else if (A.hit('arrowright', 'd', 'swiperight')) dx = 1;
        if (dx || dr) {
          const nr = Math.max(0, Math.min(NR - 1, frog.row + dr));
          const nx = Math.max(R / 2, Math.min(W - R / 2, frog.x + dx * R));
          if (nr !== frog.row || nx !== frog.x) {
            frog.fromX = frog.x; frog.toX = nx; frog.fromRow = frog.row; frog.toRow = nr;
            frog.face = dr > 0 ? 0 : dr < 0 ? Math.PI : dx > 0 ? Math.PI / 2 : -Math.PI / 2;
            frog.hop = 1;
            A.sound(420, .05, 'square', .03, 200);
          }
        }
      }

      const r = frog.hop > 0 ? (frog.hop < .5 ? frog.toRow : frog.fromRow) : frog.row;
      if (r >= 1 && r <= 5) {
        const L = laneAt(r);
        for (const it of L.items) if (frog.x > it.x - R * .3 && frog.x < it.x + it.w + R * .3) { die('car'); break; }
      } else if (r >= 7 && r <= 11 && frog.hop === 0) {
        const L = laneAt(r), it = itemUnder(L, frog.x);
        if (!it) die('splash');
        else { frog.x += L.dir * L.sp * dt; if (frog.x < R * .2 || frog.x > W - R * .2) die('splash'); }
      } else if (r === 6 && snake && frog.x > snake.x - R * .2 && frog.x < snake.x + snake.len + R * .2) die('snake');

      timeLeft -= dt;
      if (timeLeft <= 0) { timeLeft = 0; die('time'); }
      A.meter(timeLeft / TIME, 'Tijd');
      A.score(score);
      A.info('Levens ' + lives + ' \u00b7 Huisjes ' + homes.filter(Boolean).length + '/' + HOMES);
    }

    function drawFrog(x, y, face, scale) {
      ctx.save(); ctx.translate(x, y); ctx.rotate(face); ctx.scale(scale, scale);
      const s = R * .36;
      ctx.fillStyle = '#3f8f4a';
      ctx.beginPath(); ctx.ellipse(-s * .9, s * .6, s * .45, s * .3, -.5, 0, 7); ctx.ellipse(s * .9, s * .6, s * .45, s * .3, .5, 0, 7); ctx.fill();
      ctx.fillStyle = '#7ee08a'; ctx.shadowColor = '#7ee08a'; ctx.shadowBlur = 10;
      ctx.beginPath(); ctx.ellipse(0, 0, s * .8, s, 0, 0, 7); ctx.fill(); ctx.shadowBlur = 0;
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(-s * .45, -s * .7, s * .28, 0, 7); ctx.arc(s * .45, -s * .7, s * .28, 0, 7); ctx.fill();
      ctx.fillStyle = '#070b17'; ctx.beginPath(); ctx.arc(-s * .45, -s * .75, s * .13, 0, 7); ctx.arc(s * .45, -s * .75, s * .13, 0, 7); ctx.fill();
      ctx.restore();
    }
    function draw() {
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#0b1226'); g.addColorStop(1, '#070b17');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = 'rgba(230,240,255,.5)';
      for (let i = 0; i < 30; i++) ctx.fillRect((i * 131) % W, (i * 53) % Math.max(1, rowY(NR - 1)), 1.5, 1.5);

      for (let r = 0; r < NR; r++) {
        const y = rowY(r);
        if (r === 0 || r === 6) {
          ctx.fillStyle = '#1d3b24'; ctx.fillRect(0, y, W, R);
          ctx.fillStyle = '#2a5233'; for (let x = (r * 17) % 23; x < W; x += 23) ctx.fillRect(x, y + R * .3 + (x % 7), 2, R * .3);
        } else if (r <= 5) {
          ctx.fillStyle = '#24262e'; ctx.fillRect(0, y, W, R);
          if (r < 5) { ctx.fillStyle = 'rgba(232,239,228,.25)'; for (let x = 0; x < W; x += 40) ctx.fillRect(x, y - 1, 20, 2); }
        } else if (r <= 11) {
          ctx.fillStyle = '#0f2a4a'; ctx.fillRect(0, y, W, R);
          ctx.strokeStyle = 'rgba(124,198,254,.12)'; ctx.lineWidth = 1;
          ctx.beginPath();
          for (let x = 0; x <= W; x += 12) ctx.lineTo(x, y + R * .5 + Math.sin(x * .05 + t * 2 + r) * 2);
          ctx.stroke();
        } else {
          ctx.fillStyle = '#0f2a4a'; ctx.fillRect(0, y, W, R);
          ctx.fillStyle = '#163a2a';
          for (let i = 0; i <= HOMES; i++) { const x0 = i === 0 ? 0 : homeX(i - 1) + R * .6, x1 = i === HOMES ? W : homeX(i) - R * .6; ctx.fillRect(x0, y, x1 - x0, R); }
          for (let i = 0; i < HOMES; i++) {
            ctx.fillStyle = '#2f9e5b'; ctx.beginPath(); ctx.arc(homeX(i), y + R / 2, R * .38, .3, Math.PI * 2 - .3 + .3); ctx.fill();
            if (homes[i]) drawFrog(homeX(i), y + R / 2, 0, .9);
          }
        }
      }
      for (const L of lanes) {
        const y = rowY(L.row);
        for (const it of L.items) {
          if (it.x > W || it.x + it.w < 0) continue;
          if (L.kind === 'car' || L.kind === 'truck') {
            ctx.fillStyle = L.kind === 'truck' ? '#8a96a3' : it.color;
            rrect(ctx, it.x, y + R * .15, it.w, R * .7, R * .18); ctx.fill();
            ctx.fillStyle = 'rgba(8,12,22,.7)';
            const wx = L.dir > 0 ? it.x + it.w - R * .5 : it.x + R * .15;
            ctx.fillRect(wx, y + R * .25, R * .35, R * .5);
            const hx = L.dir > 0 ? it.x + it.w : it.x;
            ctx.fillStyle = 'rgba(255,246,200,.16)';
            ctx.beginPath(); ctx.moveTo(hx, y + R * .3); ctx.lineTo(hx + L.dir * R * 1.1, y + R * .05); ctx.lineTo(hx + L.dir * R * 1.1, y + R * .95); ctx.lineTo(hx, y + R * .7); ctx.fill();
            ctx.fillStyle = '#fff6c8'; ctx.fillRect(hx - (L.dir > 0 ? 3 : 0), y + R * .22, 3, R * .14); ctx.fillRect(hx - (L.dir > 0 ? 3 : 0), y + R * .64, 3, R * .14);
          } else if (L.kind === 'log') {
            ctx.fillStyle = '#7a5236'; rrect(ctx, it.x, y + R * .14, it.w, R * .72, R * .3); ctx.fill();
            ctx.fillStyle = '#5b3d28'; for (let x = it.x + R * .6; x < it.x + it.w - R * .3; x += R * .9) ctx.fillRect(x, y + R * .3, 2, R * .4);
          } else {
            const sub = submerged(it), warn = it.dives && ((t * .5 + it.ph) % 4) > 2.2;
            ctx.globalAlpha = sub ? .18 : warn ? .6 : 1;
            const n = Math.round(it.w / R);
            for (let i = 0; i < n; i++) {
              const cx = it.x + (i + .5) * R;
              ctx.fillStyle = '#2f7a4a'; ctx.beginPath(); ctx.arc(cx, y + R / 2, R * .38, 0, 7); ctx.fill();
              ctx.fillStyle = '#4fa86b'; ctx.beginPath(); ctx.arc(cx, y + R / 2, R * .22, 0, 7); ctx.fill();
            }
            ctx.globalAlpha = 1;
          }
        }
      }
      if (snake) {
        const y = rowY(6) + R / 2;
        ctx.strokeStyle = '#b392f0'; ctx.lineWidth = R * .22; ctx.lineCap = 'round';
        ctx.beginPath();
        for (let i = 0; i <= 12; i++) { const x = snake.x + snake.len * i / 12; ctx.lineTo(x, y + Math.sin(i * 1.1 - t * 8 * snake.dir) * R * .15); }
        ctx.stroke(); ctx.lineCap = 'butt';
        const hx = snake.dir > 0 ? snake.x + snake.len : snake.x;
        ctx.fillStyle = '#f4d35e'; ctx.beginPath(); ctx.arc(hx, y - 2, 2.5, 0, 7); ctx.fill();
      }
      if (!dead || Math.floor(deadT * 10) % 2 === 0) {
        const r = frog.hop > 0 ? frog.fromRow + (frog.toRow - frog.fromRow) * (1 - frog.hop) : frog.row;
        drawFrog(frog.x, base - (r + 1) * R + R / 2, frog.face, 1 + Math.sin((1 - frog.hop) * Math.PI) * .25 * (frog.hop > 0 ? 1 : 0));
      }
      for (const p of parts) { ctx.globalAlpha = 1 - p.age / p.life; ctx.fillStyle = p.color; ctx.fillRect(p.x - 2, p.y - 2, 4, 4); }
      ctx.globalAlpha = 1;
    }

    return { update, draw, resize: layout, idle(dt) {
      t += dt;
      for (const L of lanes) for (const it of L.items) {
        it.x += L.dir * L.sp * dt;
        if (L.dir > 0 && it.x > W) it.x -= L.span;
        if (L.dir < 0 && it.x + it.w < 0) it.x += L.span;
      }
    } };
  }
});
