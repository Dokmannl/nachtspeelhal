GAMES.push({
  id: 'stuiterbal',
  name: 'Stuiterbal',
  color: '#7cc6fe',
  music: { bpm: 112, root: 60, scale: 'major', prog: [0, 4, 5, 3], pad: 'triangle', lead: 'square', every: 2, pat: [0, 1, 2, 1, 3, 2, 1, 2], cut: 1400 },
  blurb: 'Kaats de bal tegen je plankje en schiet alle stenen kapot. Elk level gaat de bal sneller.',
  how: [
    'Muis of vinger: het plankje volgt je wijzer. Toetsenbord: pijltjes of A en D',
    'Spatie of tikken lanceert de bal',
    'Vang de pillen: B = breed plankje, M = extra ballen, V = vuurbal door de stenen heen, S = langzame bal, + = extra leven',
    'Level 3: dubbele stenen. Level 5: stalen stenen. Level 7: de muur zakt naar beneden'
  ],
  touch: [
    { side: 'l', key: 'arrowleft', label: '\u2190', aria: 'Naar links' },
    { side: 'l', key: 'arrowright', label: '\u2192', aria: 'Naar rechts' },
    { side: 'r', key: ' ', label: 'Lanceer' }
  ],

  thumb(c, w, h) {
    c.fillStyle = '#0a1222'; c.fillRect(0, 0, w, h);
    const cols = ['#e5484d', '#ff8c42', '#f4d35e', '#9ef0c8', '#7cc6fe'];
    for (let r = 0; r < 5; r++) for (let i = 0; i < 8; i++) {
      if ((i + r) % 7 === 3) continue;
      c.fillStyle = (i * 3 + r * 5) % 9 === 0 ? '#8a96a3' : cols[r]; rrect(c, 12 + i * 37.5, 18 + r * 15, 33, 11, 3); c.fill();
    }
    c.fillStyle = '#e8efe4'; rrect(c, 130, 158, 64, 9, 4); c.fill();
    c.shadowColor = '#fff'; c.shadowBlur = 10;
    c.beginPath(); c.arc(190, 122, 6, 0, 7); c.fill(); c.shadowBlur = 0;
  },

  create(A) {
    const ctx = A.ctx, rand = A.rand, R = 7, PH = 12;
    const COLORS = ['#e5484d', '#ff8c42', '#f4d35e', '#9ef0c8', '#7cc6fe', '#b392f0', '#f78fb3', '#e8efe4'];
    const NEWS = { 3: 'Sommige stenen moet je twee keer raken', 5: 'Stalen stenen gaan niet kapot', 7: 'De muur zakt langzaam naar beneden' };
    let W = 0, H = 0, padX = 0, balls = [], bricks = [], caps = [], parts = [];
    let lives = 3, level = 1, score = 0, wideT = 0, fireT = 0, slowT = 0, cols = 8, rows = 5, t = 0, sink = 0;

    const padY = () => H - 40;
    const padW = () => (W < 520 ? 84 : 110) * (wideT > 0 ? 1.6 : 1);
    const speed = () => Math.min(760, 330 + level * 32) * (slowT > 0 ? .65 : 1);

    function rect(b) {
      const pad = 14, gap = 6, top = 50 + sink;
      const bw = (W - pad * 2 - gap * (cols - 1)) / cols, bh = Math.max(14, Math.min(20, H * .035));
      return { x: pad + b.c * (bw + gap), y: top + b.r * (bh + gap), w: bw, h: bh };
    }
    function buildLevel() {
      cols = Math.max(6, Math.min(12, Math.floor(W / 64)));
      rows = Math.min(8, 3 + level);
      bricks = []; sink = 0;
      const pattern = level % 4;
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        if (pattern === 2 && (c + r) % 4 === 0) continue;
        if (pattern === 3 && Math.abs(c - (cols - 1) / 2) < r * .5 - 1) continue;
        if (pattern === 0 && level > 1 && r % 3 === 1 && c % 2 === 0) continue;
        if (level >= 5 && r >= 1 && r < rows - 1 && (c * 3 + r * 5 + level) % 7 === 0) { bricks.push({ c, r, hits: Infinity, max: Infinity, steel: true }); continue; }
        const hits = level >= 3 && r < Math.min(rows - 1, level - 1) ? 2 : 1;
        bricks.push({ c, r, hits, max: hits });
      }
    }
    function newBall() { balls = [{ x: padX, y: padY() - R, vx: 0, vy: 0, stuck: true }]; }
    function burst(x, y, color, n = 10) {
      if (A.reduce) n = 3;
      for (let i = 0; i < n; i++) {
        const a = rand(0, 7), s = rand(40, 220);
        parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: rand(.3, .7), age: 0, color });
      }
    }
    function setVel(b, vx, vy) {
      const s = speed(); const m = Math.hypot(vx, vy) || 1;
      vx = vx / m * s; vy = vy / m * s;
      if (Math.abs(vy) < s * .3) { vy = Math.sign(vy || -1) * s * .3; vx = Math.sign(vx || 1) * Math.sqrt(s * s - vy * vy); }
      b.vx = vx; b.vy = vy;
    }
    function loseLife() {
      lives--;
      A.vibrate(150);
      A.sound(160, .4, 'sawtooth', .06, -80);
      if (lives <= 0) { A.score(score); A.end(); return true; }
      return false;
    }

    function resize() { W = A.W; H = A.H; padX = Math.min(Math.max(padX || W / 2, 0), W); }
    resize();
    padX = W / 2;
    buildLevel(); newBall();

    function update(dt) {
      t += dt;
      wideT = Math.max(0, wideT - dt);
      fireT = Math.max(0, fireT - dt);
      slowT = Math.max(0, slowT - dt);
      for (const b of balls) if (!b.stuck) {
        const m = Math.hypot(b.vx, b.vy) || 1, sp = speed();
        if (Math.abs(m - sp) > 1) { b.vx = b.vx / m * sp; b.vy = b.vy / m * sp; }
      }
      const P = A.pointer, pw = padW(), py = padY();
      let dir = 0;
      if (A.key('arrowleft', 'a')) dir--;
      if (A.key('arrowright', 'd')) dir++;
      if (dir) padX += dir * 720 * dt;
      else if (P.seen && (P.type === 'mouse' || P.down)) padX += (P.x - padX) * Math.min(1, dt * 22);
      padX = Math.max(pw / 2, Math.min(W - pw / 2, padX));

      if (A.hit(' ', 'tap', 'arrowup', 'w')) {
        for (const b of balls) if (b.stuck) { b.stuck = false; setVel(b, rand(-.4, .4), -1); A.sound(440, .08, 'square', .04); }
      }
      const launched = balls.some(b => !b.stuck);

      if (level >= 7 && launched) {
        sink += (3 + (level - 7)) * dt;
        let lowest = 0;
        for (const br of bricks) if (!br.steel) { const r = rect(br); lowest = Math.max(lowest, r.y + r.h); }
        if (lowest > py - 26) {
          sink = Math.max(0, sink - 90);
          if (loseLife()) return;
        }
      }

      for (const b of balls) {
        if (b.stuck) { b.x = padX; b.y = py - R; continue; }
        const steps = Math.max(1, Math.ceil(Math.hypot(b.vx, b.vy) * dt / 4));
        const sdt = dt / steps;
        for (let s = 0; s < steps && !b.dead; s++) {
          b.x += b.vx * sdt; b.y += b.vy * sdt;
          if (b.x < R) { b.x = R; b.vx = Math.abs(b.vx); }
          if (b.x > W - R) { b.x = W - R; b.vx = -Math.abs(b.vx); }
          if (b.y < R) { b.y = R; b.vy = Math.abs(b.vy); }
          if (b.vy > 0 && b.y + R >= py && b.y + R <= py + PH + 8 && b.x >= padX - pw / 2 - R && b.x <= padX + pw / 2 + R) {
            const rel = Math.max(-1, Math.min(1, (b.x - padX) / (pw / 2)));
            const ang = rel * 1.05;
            setVel(b, Math.sin(ang), -Math.cos(ang));
            b.y = py - R;
            A.sound(330, .06, 'square', .04);
          }
          for (let i = 0; i < bricks.length; i++) {
            const br = bricks[i], r = rect(br);
            const cx = Math.max(r.x, Math.min(b.x, r.x + r.w)), cy = Math.max(r.y, Math.min(b.y, r.y + r.h));
            if ((b.x - cx) ** 2 + (b.y - cy) ** 2 > R * R) continue;
            const ox = Math.min(b.x + R - r.x, r.x + r.w - (b.x - R));
            const oy = Math.min(b.y + R - r.y, r.y + r.h - (b.y - R));
            const burn = fireT > 0 && !br.steel;
            if (burn) br.hits = 1;
            else if (ox < oy) { b.vx = b.x < r.x + r.w / 2 ? -Math.abs(b.vx) : Math.abs(b.vx); }
            else { b.vy = b.y < r.y + r.h / 2 ? -Math.abs(b.vy) : Math.abs(b.vy); }
            if (br.steel) { A.sound(900, .05, 'square', .03); break; }
            br.hits--;
            const col = COLORS[br.r % COLORS.length];
            if (br.hits <= 0) {
              bricks.splice(i, 1);
              score += 10 * level;
              burst(r.x + r.w / 2, r.y + r.h / 2, col);
              A.sound(500 + br.r * 60, .08, 'triangle', .06);
              if (Math.random() < .12) {
                const roll = Math.random();
                caps.push({ x: r.x + r.w / 2, y: r.y + r.h / 2, kind: roll < .28 ? 'B' : roll < .52 ? 'M' : roll < .72 ? 'V' : roll < .92 ? 'S' : '+' });
              }
            } else { score += 5 * level; A.sound(260, .06, 'triangle', .05); }
            break;
          }
          if (b.y - R > H) b.dead = true;
        }
      }
      balls = balls.filter(b => !b.dead);
      if (!balls.length) {
        if (loseLife()) return;
        newBall();
      }

      for (let i = caps.length - 1; i >= 0; i--) {
        const c = caps[i]; c.y += 150 * dt;
        if (c.y > py - 6 && c.y < py + PH + 6 && Math.abs(c.x - padX) < pw / 2 + 10) {
          if (c.kind === 'B') wideT = 12;
          else if (c.kind === 'V') fireT = 8;
          else if (c.kind === 'S') slowT = 10;
          else if (c.kind === '+') lives = Math.min(6, lives + 1);
          else {
            const src = balls.find(b => !b.stuck) || balls[0];
            if (src) for (const a of [-.5, .5]) {
              const nb = { x: src.x, y: src.y, stuck: false, vx: 0, vy: 0 };
              const ang = Math.atan2(src.vy || -1, src.vx || 0) + a;
              setVel(nb, Math.cos(ang), Math.sin(ang));
              balls.push(nb);
            }
          }
          score += 25;
          A.sound(760, .15, 'sine', .07, 300);
          caps.splice(i, 1);
        } else if (c.y > H + 20) caps.splice(i, 1);
      }

      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i]; p.age += dt;
        if (p.age > p.life) { parts.splice(i, 1); continue; }
        p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 300 * dt;
      }

      if (!bricks.some(b => !b.steel)) {
        level++; score += 100 * level;
        A.level(level, NEWS[level] || 'De bal gaat sneller');
        caps = []; buildLevel(); newBall();
      }

      A.score(score);
      A.info('Levens ' + lives + (wideT > 0 ? ' \u00b7 breed' : '') + (fireT > 0 ? ' \u00b7 vuurbal' : '') + (slowT > 0 ? ' \u00b7 langzaam' : ''));
    }

    function draw() {
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#0a1222'); g.addColorStop(1, '#0c1a2c');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = 'rgba(124,198,254,.05)'; ctx.lineWidth = 1;
      for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x + .5, 0); ctx.lineTo(x + .5, H); ctx.stroke(); }
      const py = padY();
      if (level >= 7) {
        ctx.strokeStyle = 'rgba(229,72,77,.35)'; ctx.setLineDash([8, 8]);
        ctx.beginPath(); ctx.moveTo(0, py - 26); ctx.lineTo(W, py - 26); ctx.stroke(); ctx.setLineDash([]);
      }

      for (const br of bricks) {
        const r = rect(br);
        if (br.steel) {
          ctx.fillStyle = '#8a96a3'; rrect(ctx, r.x, r.y, r.w, r.h, 4); ctx.fill();
          ctx.fillStyle = '#5d6772'; ctx.fillRect(r.x + 4, r.y + r.h / 2 - 1, r.w - 8, 2);
          ctx.fillStyle = '#c9d1d9'; ctx.fillRect(r.x + 4, r.y + 3, 3, 3); ctx.fillRect(r.x + r.w - 7, r.y + 3, 3, 3);
          continue;
        }
        const col = COLORS[br.r % COLORS.length];
        ctx.fillStyle = col; ctx.globalAlpha = br.hits < br.max ? .55 : 1;
        rrect(ctx, r.x, r.y, r.w, r.h, 4); ctx.fill();
        ctx.globalAlpha = 1;
        ctx.fillStyle = 'rgba(255,255,255,.22)'; ctx.fillRect(r.x + 3, r.y + 2, r.w - 6, 2);
        if (br.max > 1) { ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 1.5; rrect(ctx, r.x + 1, r.y + 1, r.w - 2, r.h - 2, 3); ctx.stroke(); }
      }
      for (const c of caps) {
        ctx.fillStyle = c.kind === 'B' ? '#7cc6fe' : c.kind === 'M' ? '#b392f0' : c.kind === 'V' ? '#ff8c42' : c.kind === 'S' ? '#f4d35e' : '#9ef0c8';
        rrect(ctx, c.x - 14, c.y - 8, 28, 16, 8); ctx.fill();
        ctx.fillStyle = '#070b17'; ctx.font = '700 12px "Atkinson Hyperlegible", sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(c.kind, c.x, c.y + 1);
      }
      for (const p of parts) { ctx.globalAlpha = 1 - p.age / p.life; ctx.fillStyle = p.color; ctx.fillRect(p.x - 2, p.y - 2, 4, 4); }
      ctx.globalAlpha = 1;

      const pw = padW();
      ctx.shadowColor = '#7cc6fe'; ctx.shadowBlur = 14;
      ctx.fillStyle = wideT > 0 ? '#7cc6fe' : '#e8efe4';
      rrect(ctx, padX - pw / 2, py, pw, PH, 6); ctx.fill();
      ctx.shadowColor = fireT > 0 ? '#ff8c42' : '#ffffff';
      ctx.fillStyle = fireT > 0 ? '#ffb070' : '#ffffff';
      for (const b of balls) { ctx.beginPath(); ctx.arc(b.x, b.y, R, 0, 7); ctx.fill(); }
      ctx.shadowBlur = 0;

      if (balls.some(b => b.stuck)) {
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillStyle = 'rgba(232,239,228,.7)'; ctx.font = '15px "Atkinson Hyperlegible", sans-serif';
        ctx.fillText('Spatie of tik om te lanceren', W / 2, py - 46);
      }
    }

    return { update, draw, resize };
  }
});
