GAMES.push({
  id: 'spokenjacht',
  name: 'Spokenjacht',
  color: '#8c9bff',
  music: { bpm: 120, root: 57, scale: 'minor', prog: [0, 6, 5, 4], pad: 'triangle', lead: 'square', every: 2, pat: [0, 2, 4, 2, 3, 1], cut: 1400 },
  blurb: 'Een vuurvliegje in een doolhof vol spoken. Eet alle lichtjes op zonder gepakt te worden.',
  how: [
    'Pijltjes of WASD om te sturen. Telefoon: vegen of de knoppen',
    'Een groot lichtje maakt de spoken even bang: dan kun je ze opeten',
    'Doolhof leeg = volgend level. De zijgang links en rechts brengt je naar de overkant',
    'Hogere levels: snellere spoken, kortere schriktijd, vanaf level 5 een vijfde spook, vanaf level 7 jagen ze slimmer'
  ],
  touch: [
    { side: 'l', key: 'arrowleft', label: '\u2190', aria: 'Naar links' },
    { side: 'l', key: 'arrowright', label: '\u2192', aria: 'Naar rechts' },
    { side: 'r', key: 'arrowup', label: '\u2191', aria: 'Omhoog' },
    { side: 'r', key: 'arrowdown', label: '\u2193', aria: 'Omlaag' }
  ],

  thumb(c, w, h) {
    c.fillStyle = '#080a1c'; c.fillRect(0, 0, w, h);
    c.strokeStyle = '#7c8cff'; c.lineWidth = 3;
    c.strokeRect(20, 14, 280, 152);
    [[60, 50, 80, 14], [180, 50, 80, 14], [60, 116, 80, 14], [180, 116, 80, 14], [140, 76, 40, 28]].forEach(([x, y, bw, bh]) => { c.strokeRect(x, y, bw, bh); });
    c.fillStyle = '#f4d35e'; for (let x = 40; x < 290; x += 16) { c.fillRect(x, 34, 3, 3); c.fillRect(x, 148, 3, 3); }
    const ghost = (x, y, col) => { c.fillStyle = col; c.beginPath(); c.arc(x, y, 10, Math.PI, 0); c.lineTo(x + 10, y + 12); c.lineTo(x + 5, y + 8); c.lineTo(x, y + 12); c.lineTo(x - 5, y + 8); c.lineTo(x - 10, y + 12); c.fill(); c.fillStyle = '#fff'; c.fillRect(x - 6, y - 3, 4, 4); c.fillRect(x + 2, y - 3, 4, 4); };
    ghost(110, 92, '#e5484d'); ghost(220, 92, '#7cc6fe');
    const rg = c.createRadialGradient(160, 140, 0, 160, 140, 16); rg.addColorStop(0, '#fff6c8'); rg.addColorStop(.4, 'rgba(244,211,94,.8)'); rg.addColorStop(1, 'rgba(244,211,94,0)');
    c.fillStyle = rg; c.beginPath(); c.arc(160, 140, 16, 0, 7); c.fill();
  },

  create(A) {
    const ctx = A.ctx, rand = A.rand;
    const MAP = [
      '###################',
      '#........#........#',
      '#o##.###.#.###.##o#',
      '#.................#',
      '#.##.#.#####.#.##.#',
      '#....#...#...#....#',
      '####.### # ###.####',
      'XXX#.#       #.#XXX',
      '####.# ##=## #.####',
      '    .  #GGG#  .    ',
      '####.# ##### #.####',
      'XXX#.#       #.#XXX',
      '####.# ##### #.####',
      '#........#........#',
      '#.##.###.#.###.##.#',
      '#o.#.....P.....#.o#',
      '##.#.#.#####.#.#.##',
      '#....#...#...#....#',
      '#.######.#.######.#',
      '#.................#',
      '###################'
    ];
    const COLS = MAP[0].length, ROWS = MAP.length, TUNNEL = 9, DOOR = { x: 9, y: 8 }, OUT = { x: 9, y: 7 };
    const GCOL = ['#e5484d', '#f78fb3', '#7cc6fe', '#ff8c42', '#9ef0c8'];
    const NEWS = { 2: 'De spoken worden sneller', 3: 'Ze blijven korter bang', 5: 'Er komt een vijfde spook bij', 7: 'De spoken jagen slimmer' };
    const DIRS = [{ x: 0, y: -1 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 0 }];
    const coarse = matchMedia('(pointer: coarse)').matches;
    let W = 0, H = 0, cs = 16, ox = 0, oy = 0;
    let dots = new Set(), powers = new Set(), level = 1, lives = 3, score = 0, t = 0;
    let player, ghosts = [], scareT = 0, chain = 0, dead = false, deadT = 0, ended = false, clearT = 0, floats = [];

    const cell = (x, y) => (y < 0 || y >= ROWS) ? 'X' : (x < 0 || x >= COLS) ? (y === TUNNEL ? ' ' : 'X') : MAP[y][x];
    const key = (x, y) => x + ',' + y;
    const openFor = (x, y, ghost) => { const c = cell(x, y); return c !== '#' && c !== 'X' && c !== '=' && (c !== 'G' || ghost === 'home'); };

    function layout() {
      W = A.W; H = A.H;
      const availH = H - (coarse ? 92 : 8);
      cs = Math.max(8, Math.floor(Math.min((W - 8) / COLS, availH / ROWS)));
      ox = Math.floor((W - cs * COLS) / 2); oy = Math.floor((availH - cs * ROWS) / 2) + 4;
    }
    function fillDots() {
      dots = new Set(); powers = new Set();
      for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
        if (MAP[y][x] === '.') dots.add(key(x, y));
        if (MAP[y][x] === 'o') powers.add(key(x, y));
      }
    }
    function resetActors() {
      player = { x: 9, y: 15, dir: { x: 0, y: 0 }, next: { x: -1, y: 0 }, face: { x: -1, y: 0 } };
      const n = level >= 5 ? 5 : 4;
      const first = level <= 2 ? 3 : level <= 4 ? 1.5 : 0, gap = level <= 2 ? 3.5 : 2.5;
      ghosts = [];
      for (let i = 0; i < n; i++) {
        const out = i === 0 && first === 0;
        ghosts.push({ i, x: out ? OUT.x : 8 + (i % 3), y: out ? OUT.y : 9, dir: { x: -1, y: 0 }, state: out ? 'chase' : 'house', release: t + first + i * gap, color: GCOL[i] });
      }
      scareT = 0; chain = 0;
    }
    layout(); fillDots(); resetActors();

    const ghostSpeed = () => Math.min(8.6, 5.4 + (level - 1) * .4);
    const scareLen = () => Math.max(2, 8 - (level - 1) * .9);
    const near = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

    function moveGrid(e, speed, dt, choose, ghostMode) {
      let dist = speed * dt, guard = 0;
      while (dist > 1e-6 && guard++ < 20) {
        const cx = Math.round(e.x), cy = Math.round(e.y);
        const atC = Math.abs(e.x - cx) < 1e-4 && Math.abs(e.y - cy) < 1e-4;
        if (atC) {
          e.x = cx; e.y = cy;
          if (e.x < 0) e.x = COLS - 1; else if (e.x > COLS - 1) e.x = 0;
          choose(e);
          if (!e.dir.x && !e.dir.y) return;
          if (!openFor(Math.round(e.x) + e.dir.x, Math.round(e.y) + e.dir.y, ghostMode)) { e.dir = { x: 0, y: 0 }; return; }
        }
        let toNext;
        if (e.dir.x) { const tx = atC ? Math.round(e.x) + e.dir.x : (e.dir.x > 0 ? Math.ceil(e.x) : Math.floor(e.x)); toNext = Math.abs(tx - e.x); }
        else { const ty = atC ? Math.round(e.y) + e.dir.y : (e.dir.y > 0 ? Math.ceil(e.y) : Math.floor(e.y)); toNext = Math.abs(ty - e.y); }
        const d = Math.min(dist, toNext);
        e.x += e.dir.x * d; e.y += e.dir.y * d; dist -= d;
        if (d >= toNext - 1e-6) { e.x = Math.round(e.x); e.y = Math.round(e.y); }
      }
    }
    function choosePlayer(e) {
      const cx = Math.round(e.x), cy = Math.round(e.y);
      if ((e.next.x || e.next.y) && openFor(cx + e.next.x, cy + e.next.y)) e.dir = { ...e.next };
      else if (!openFor(cx + e.dir.x, cy + e.dir.y)) e.dir = { x: 0, y: 0 };
      if (e.dir.x || e.dir.y) e.face = { ...e.dir };
    }
    function targetFor(g) {
      const p = { x: Math.round(player.x), y: Math.round(player.y) };
      if (g.state === 'eyes') return OUT;
      if (level >= 7) return p;
      if (g.i === 1) return { x: p.x + player.face.x * 4, y: p.y + player.face.y * 4 };
      if (g.i === 2) return near(g, p) > 7 ? p : { x: 1, y: 19 };
      if (g.i === 3) return near(g, p) > 5 ? p : { x: 17, y: 1 };
      if (g.i === 4) return { x: p.x - player.face.x * 3, y: p.y - player.face.y * 3 };
      return p;
    }
    function chooseGhost(g) {
      const cx = Math.round(g.x), cy = Math.round(g.y);
      if (g.state === 'eyes' && cx === OUT.x && cy === OUT.y) {
        g.x = 9; g.y = 9; g.state = 'house'; g.release = t + 1.5; g.dir = { x: 0, y: 0 };
        return;
      }
      let opts = DIRS.filter(d => openFor(cx + d.x, cy + d.y) && !(d.x === -g.dir.x && d.y === -g.dir.y));
      if (!opts.length) opts = DIRS.filter(d => openFor(cx + d.x, cy + d.y));
      if (!opts.length) { g.dir = { x: 0, y: 0 }; return; }
      if (g.state === 'scared') { g.dir = { ...opts[Math.floor(Math.random() * opts.length)] }; return; }
      const tg = targetFor(g);
      let best = opts[0], bd = Infinity;
      for (const d of opts) { const dd = Math.hypot(cx + d.x - tg.x, cy + d.y - tg.y) + (g.state === 'chase' && Math.random() < .08 ? 3 : 0); if (dd < bd) { bd = dd; best = d; } }
      g.dir = { ...best };
    }
    function loseLife() {
      dead = true; deadT = 0; lives--;
      A.vibrate(200); A.sound(300, .9, 'sawtooth', .07, -260);
    }

    function update(dt) {
      t += dt;
      for (let i = floats.length - 1; i >= 0; i--) { const f = floats[i]; f.age += dt; f.y -= dt * .8; if (f.age > 1) floats.splice(i, 1); }
      if (clearT > 0) {
        clearT -= dt;
        if (clearT <= 0) { level++; A.level(level, NEWS[level] || 'Alles gaat sneller'); fillDots(); resetActors(); }
        return;
      }
      if (dead) {
        deadT += dt;
        if (deadT > 1.3) {
          if (lives <= 0) { if (!ended) { ended = true; A.score(score); A.end(); } return; }
          dead = false; resetActors();
        }
        return;
      }
      let nd = null;
      if (A.hit('arrowup', 'w', 'swipeup') || A.key('arrowup', 'w')) nd = DIRS[0];
      if (A.hit('arrowleft', 'a', 'swipeleft') || A.key('arrowleft', 'a')) nd = DIRS[1];
      if (A.hit('arrowdown', 's', 'swipedown') || A.key('arrowdown', 's')) nd = DIRS[2];
      if (A.hit('arrowright', 'd', 'swiperight') || A.key('arrowright', 'd')) nd = DIRS[3];
      if (nd) {
        player.next = { ...nd };
        if (nd.x === -player.dir.x && nd.y === -player.dir.y && (nd.x || nd.y)) { player.dir = { ...nd }; player.face = { ...nd }; }
        if (!player.dir.x && !player.dir.y) choosePlayer(player);
      }
      moveGrid(player, 7.5, dt, choosePlayer);
      const pk = key(Math.round(player.x), Math.round(player.y));
      if (dots.has(pk)) { dots.delete(pk); score += 10 * level; if (dots.size % 2) A.sound(660, .03, 'square', .02); }
      if (powers.has(pk)) {
        powers.delete(pk); score += 50 * level; scareT = scareLen(); chain = 0;
        for (const g of ghosts) if (g.state === 'chase') { g.state = 'scared'; g.dir = { x: -g.dir.x, y: -g.dir.y }; }
        A.sound(300, .4, 'triangle', .08, 500);
      }
      if (scareT > 0) {
        scareT -= dt;
        if (scareT <= 0) for (const g of ghosts) if (g.state === 'scared') g.state = 'chase';
      }
      for (const g of ghosts) {
        if (g.state === 'house') {
          g.y = 9 + Math.sin(t * 6 + g.i) * .15;
          if (t >= g.release) { g.x = 9; g.y = 9; g.state = 'leave'; }
          continue;
        }
        if (g.state === 'leave') {
          g.y -= 4 * dt;
          if (g.y <= OUT.y) { g.y = OUT.y; g.x = OUT.x; g.state = scareT > 0 ? 'scared' : 'chase'; g.dir = { x: Math.random() < .5 ? -1 : 1, y: 0 }; }
          continue;
        }
        const sp = g.state === 'eyes' ? 12 : g.state === 'scared' ? 4 : ghostSpeed() * (Math.round(g.y) === TUNNEL && (g.x < 4 || g.x > 14) ? .6 : 1);
        moveGrid(g, sp, dt, chooseGhost);
        if (g.state !== 'eyes' && near(g, player) < .65) {
          if (g.state === 'scared') {
            const pts = 200 * Math.pow(2, chain) * level; chain = Math.min(chain + 1, 3);
            score += pts; g.state = 'eyes';
            floats.push({ x: g.x, y: g.y, text: '+' + pts, age: 0 });
            A.sound(880, .2, 'square', .06, 400); A.vibrate(40);
          } else { loseLife(); break; }
        }
      }
      if (!dots.size && !powers.size && !dead) { clearT = 1.4; A.sound(660, .5, 'triangle', .08, 600); }
      A.score(score);
      A.info('Levens ' + lives + ' \u00b7 Lichtjes ' + (dots.size + powers.size));
    }

    function drawGhost(g) {
      const x = ox + (g.x + .5) * cs, y = oy + (g.y + .5) * cs, r = cs * .45;
      if (g.state !== 'eyes') {
        const flash = g.state === 'scared' && scareT < 1.5 && Math.sin(t * 20) > 0;
        ctx.fillStyle = g.state === 'scared' ? (flash ? '#e8efe4' : '#3b4bdb') : g.color;
        ctx.beginPath(); ctx.arc(x, y - r * .1, r, Math.PI, 0);
        const by = y + r * .85, wv = Math.sin(t * 12) * r * .12;
        ctx.lineTo(x + r, by);
        for (let k = 0; k < 4; k++) { const xx = x + r - (k + .5) * r / 2; ctx.lineTo(xx, by - r * .3 + (k % 2 ? wv : -wv)); ctx.lineTo(x + r - (k + 1) * r / 2, by); }
        ctx.closePath(); ctx.fill();
      }
      if (g.state === 'scared') {
        ctx.fillStyle = '#f4d35e'; ctx.fillRect(x - r * .45, y - r * .3, r * .25, r * .25); ctx.fillRect(x + r * .2, y - r * .3, r * .25, r * .25);
        return;
      }
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.ellipse(x - r * .35, y - r * .2, r * .26, r * .32, 0, 0, 7); ctx.ellipse(x + r * .35, y - r * .2, r * .26, r * .32, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#1a2266';
      const px = g.dir.x * r * .12, py = g.dir.y * r * .12;
      ctx.beginPath(); ctx.arc(x - r * .35 + px, y - r * .2 + py, r * .13, 0, 7); ctx.arc(x + r * .35 + px, y - r * .2 + py, r * .13, 0, 7); ctx.fill();
    }
    function draw() {
      ctx.fillStyle = '#080a1c'; ctx.fillRect(0, 0, W, H);
      const lit = clearT > 0 && Math.sin(t * 20) > 0;
      for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
        const c = MAP[y][x];
        const px = ox + x * cs, py = oy + y * cs;
        if (c === '#') {
          ctx.fillStyle = '#141a44'; ctx.fillRect(px, py, cs, cs);
          ctx.fillStyle = lit ? '#ffffff' : '#7c8cff';
          const lw = Math.max(1.5, cs * .1);
          const isOpen = (xx, yy) => { const q = cell(xx, yy); return q !== '#' && q !== 'X'; };
          if (isOpen(x, y - 1)) ctx.fillRect(px, py, cs, lw);
          if (isOpen(x, y + 1)) ctx.fillRect(px, py + cs - lw, cs, lw);
          if (isOpen(x - 1, y)) ctx.fillRect(px, py, lw, cs);
          if (isOpen(x + 1, y)) ctx.fillRect(px + cs - lw, py, lw, cs);
        } else if (c === '=') {
          ctx.fillStyle = '#f78fb3'; ctx.fillRect(px, py + cs * .4, cs, cs * .2);
        }
      }
      ctx.fillStyle = '#f4d35e';
      for (const k of dots) { const [x, y] = k.split(',').map(Number); ctx.fillRect(ox + (x + .5) * cs - cs * .08, oy + (y + .5) * cs - cs * .08, cs * .16, cs * .16); }
      for (const k of powers) {
        const [x, y] = k.split(',').map(Number);
        const r = cs * (.28 + Math.sin(t * 6) * .06);
        const pg = ctx.createRadialGradient(ox + (x + .5) * cs, oy + (y + .5) * cs, 0, ox + (x + .5) * cs, oy + (y + .5) * cs, r * 2);
        pg.addColorStop(0, '#fff6c8'); pg.addColorStop(.4, 'rgba(244,211,94,.8)'); pg.addColorStop(1, 'rgba(244,211,94,0)');
        ctx.fillStyle = pg; ctx.beginPath(); ctx.arc(ox + (x + .5) * cs, oy + (y + .5) * cs, r * 2, 0, 7); ctx.fill();
      }
      for (const g of ghosts) drawGhost(g);
      const pxp = ox + (player.x + .5) * cs, pyp = oy + (player.y + .5) * cs;
      const pr = dead ? cs * .6 * Math.max(0, 1 - deadT) : cs * .6;
      if (pr > 0) {
        const gl = ctx.createRadialGradient(pxp, pyp, 0, pxp, pyp, pr * 1.6);
        gl.addColorStop(0, '#fffbe6'); gl.addColorStop(.35, 'rgba(244,211,94,.9)'); gl.addColorStop(1, 'rgba(255,140,66,0)');
        ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(pxp, pyp, pr * 1.6, 0, 7); ctx.fill();
        const wf = Math.abs(Math.sin(t * 30)) * cs * .15 + cs * .1;
        ctx.save(); ctx.translate(pxp, pyp); ctx.rotate(Math.atan2(player.face.y, player.face.x));
        ctx.fillStyle = 'rgba(220,235,255,.6)';
        ctx.beginPath(); ctx.ellipse(-cs * .1, -wf, cs * .18, wf * .8, -.3, 0, 7); ctx.ellipse(-cs * .1, wf, cs * .18, wf * .8, .3, 0, 7); ctx.fill();
        ctx.restore();
      }
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = '700 ' + Math.max(11, cs * .7) + 'px "Atkinson Hyperlegible", sans-serif';
      for (const f of floats) { ctx.globalAlpha = 1 - f.age; ctx.fillStyle = '#9ec5ff'; ctx.fillText(f.text, ox + (f.x + .5) * cs, oy + (f.y + .5) * cs); }
      ctx.globalAlpha = 1;
    }

    return { update, draw, resize: layout, idle(dt) { t += dt; } };
  }
});
