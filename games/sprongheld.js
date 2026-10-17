GAMES.push({
  id: 'sprongheld',
  name: 'Sprongheld',
  color: '#9ef0c8',
  music: { bpm: 118, root: 60, scale: 'major', prog: [0, 3, 4, 0], pad: 'triangle', lead: 'square', every: 2, pat: [0, 1, 2, 3, 2, 1], cut: 1600 },
  blurb: 'Ren en spring door een eindeloze nachtwereld. Spring op de kevers, kop de vraagtekenblokken en ontwijk de gaten.',
  how: [
    'Pijltjes of A en D om te lopen',
    'Spatie, pijltje omhoog of W om te springen. Lang indrukken = hoger',
    'Spring op een kever voor 50 punten, botsen kost je leven',
    'Kop een ?-blok van onderen voor een munt. Soms zit er een paddenstoel in: dan word je groot en kun je een klap hebben',
    'Elke 5 levels wacht een eindbaas: spring 3 keer op zijn kop',
    'Elke 50 meter een level: snellere kevers, bewegende platforms en vanaf level 6 vliegende vijanden'
  ],
  touch: [
    { side: 'l', key: 'arrowleft', label: '\u2190', aria: 'Naar links' },
    { side: 'l', key: 'arrowright', label: '\u2192', aria: 'Naar rechts' },
    { side: 'r', key: ' ', label: 'Spring' }
  ],

  thumb(c, w, h) {
    const g = c.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#16224a'); g.addColorStop(1, '#2b3a63');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    c.fillStyle = '#1c2b4f'; c.beginPath(); c.ellipse(80, h, 120, 70, 0, 0, 7); c.ellipse(260, h, 110, 55, 0, 0, 7); c.fill();
    const T = 20;
    for (let x = 0; x < w; x += T) {
      if (x >= 180 && x < 220) continue;
      c.fillStyle = '#5b3b2a'; c.fillRect(x, h - 2 * T, T, 2 * T);
      c.fillStyle = '#3fae6a'; c.fillRect(x, h - 2 * T, T, 6);
    }
    for (let i = 0; i < 3; i++) { c.fillStyle = i === 1 ? '#f4d35e' : '#a65a3a'; c.fillRect(90 + i * T, h - 5 * T, T - 1, T - 1); }
    c.fillStyle = '#070b17'; c.font = '700 14px sans-serif'; c.textAlign = 'center'; c.fillText('?', 120, h - 5 * T + 15);
    c.fillStyle = '#ff8c42'; c.fillRect(60, h - 2 * T - 26, 14, 18);
    c.fillStyle = '#f2c7a0'; c.fillRect(61, h - 2 * T - 34, 12, 9);
    c.fillStyle = '#e5484d'; c.fillRect(59, h - 2 * T - 37, 15, 5);
    c.fillStyle = '#b392f0'; c.beginPath(); c.ellipse(250, h - 2 * T - 7, 11, 8, 0, Math.PI, 0); c.fill();
    c.fillStyle = '#f4d35e'; c.beginPath(); c.arc(260, 70, 6, 0, 7); c.arc(280, 70, 6, 0, 7); c.fill();
  },

  create(A) {
    const ctx = A.ctx, rand = A.rand, T = 32, ROWS = 14, G = 1800;
    let W = 0, H = 0, s = 1, viewW = 0, offY = 0;
    const cols = [];
    let genX = 0, genH = 3;
    let enemies = [], coins = [], pops = [], parts = [], bumps = new Map();
    let platforms = [], coinPts = 0, stompPts = 0, lastLv = 1;
    const NEWS = { 2: 'Meer kevers en bredere gaten', 3: 'De kevers worden sneller', 4: 'Bewegende platforms', 6: 'Pas op: vliegende vijanden' };
    const lvAt = x => 1 + Math.floor(Math.max(0, x - 3) / 50);
    let cam = 0, coinCount = 0, stomps = 0, far = 0, dead = false, deadT = 0, ended = false, t = 0, buffer = 0, coyote = 0;
    const p = { x: 3 * T, y: 0, w: 20, h: 28, vx: 0, vy: 0, ground: false, face: 1, anim: 0, jumpHeld: false, big: false, inv: 0 };
    let shrooms = [];
    const bossDone = {};

    // ---------- level ----------
    function push(g) { cols.push({ g, blocks: new Map() }); genX++; }
    const groundRow = g => ROWS - g;
    function genChunk() {
      if (genX === 0) { for (let i = 0; i < 16; i++) push(3); genH = 3; return; }
      const bl = lvAt(genX);
      if (genX > 20 && bl % 5 === 0 && !bossDone[bl]) {
        bossDone[bl] = true;
        const gr = groundRow(genH);
        const pipe = () => { for (let k = 0; k < 2; k++) { push(genH); for (let y = gr - 2; y < gr; y++) cols[genX - 1].blocks.set(y, k ? 'pipeR' : 'pipeL'); } };
        push(genH); pipe();
        const st = genX;
        for (let i = 0; i < 14; i++) push(genH);
        pipe(); push(genH);
        enemies.push({ boss: true, hp: 3, inv: 0, x: (st + 7) * T, y: gr * T - 44, w: 52, h: 44, vx: -(60 + bl * 4), vy: 0, ground: false, dead: false, dt: 0 });
        return;
      }
      const diff = Math.min(1, genX / 500), gl0 = lvAt(genX);
      const len = 5 + Math.floor(Math.random() * 6);
      const start = genX;
      for (let i = 0; i < len; i++) push(genH);
      const gr = groundRow(genH);
      if (len >= 6 && Math.random() < .5) {
        const pl = 3 + Math.floor(Math.random() * 3);
        const px = start + 1 + Math.floor(Math.random() * Math.max(1, len - pl - 1));
        const py = gr - 3;
        for (let k = 0; k < pl && px + k < genX; k++) {
          const r0 = Math.random(); cols[px + k].blocks.set(py, r0 < .1 ? 'qm' : r0 < .35 ? 'q' : 'brick');
          if (Math.random() < .6) coins.push({ x: (px + k) * T + T / 2, y: (py - 1) * T + T / 2 });
        }
      } else if (Math.random() < .6) {
        const n = 3 + Math.floor(Math.random() * 2), cx = start + 1;
        for (let k = 0; k < n && cx + k < genX; k++) coins.push({ x: (cx + k) * T + T / 2, y: (gr - 2) * T + T / 2 - (k === 1 || k === 2 ? 10 : 0) });
      }
      if (genX > 22) {
        const n = Math.random() < Math.min(.85, .3 + gl0 * .08) ? (Math.random() < Math.min(.6, gl0 * .1) ? 2 : 1) : 0;
        const ev = 45 + (gl0 >= 3 ? Math.min(70, (gl0 - 2) * 12) : 0);
        for (let i = 0; i < n; i++) {
          const ex = (start + 2 + Math.floor(Math.random() * (len - 3))) * T;
          enemies.push({ x: ex, y: gr * T - 20, w: 24, h: 20, vx: -ev, vy: 0, ground: false, dead: false, dt: 0 });
        }
        if (gl0 >= 6 && Math.random() < Math.min(.7, .35 + (gl0 - 6) * .08)) {
          const fx = (start + len - 1) * T, by = (gr - 3) * T;
          enemies.push({ fly: true, x: fx, y: by, baseY: by, ph: rand(0, 6), w: 26, h: 18, vx: -(70 + Math.min(60, (gl0 - 6) * 10)), vy: 0, dead: false, dt: 0 });
        }
      }
      const r = Math.random();
      if (gl0 >= 4 && r < .22) {
        const st = genX;
        for (let i = 0; i < 5; i++) push(0);
        platforms.push({ x: st * T + 1.5 * T, w: 2 * T, baseY: gr * T, y: gr * T, ph: rand(0, 6), sp: 1.1 + Math.min(.8, (gl0 - 4) * .1), dy: 0 });
      } else if (r < .34) {
        const gl = 2 + (gl0 >= 2 && Math.random() < .5 ? 1 : 0);
        for (let i = 0; i < gl; i++) push(0);
      } else if (r < .54) {
        const ph = 2 + (Math.random() < diff * .5 ? 1 : 0);
        for (let k = 0; k < 2; k++) {
          push(genH);
          for (let y = gr - ph; y < gr; y++) cols[genX - 1].blocks.set(y, k ? 'pipeR' : 'pipeL');
        }
      } else if (r < .86) {
        genH = Math.max(2, Math.min(5, genH + (Math.random() < .5 ? -1 : 1)));
      }
    }
    function col(cx) { while (genX <= cx) genChunk(); return cols[cx]; }
    function tile(cx, cy) {
      if (cx < 0) return 'wall';
      if (cy < 0 || cy >= ROWS) return null;
      const c = col(cx);
      if (c.g && cy >= ROWS - c.g) return 'ground';
      return c.blocks.get(cy) || null;
    }
    const solid = (cx, cy) => !!tile(cx, cy);

    function resize() {
      W = A.W; H = A.H;
      s = Math.min(H / (ROWS * T), W / (10 * T)); viewW = W / s;
      const spare = H - ROWS * T * s;
      offY = spare > 110 ? spare - 96 : spare;
    }
    resize();
    col(40);
    p.y = groundRow(3) * T - p.h;

    function burst(x, y, color, n = 8) {
      if (A.reduce) n = 3;
      for (let i = 0; i < n; i++) {
        const a = rand(0, 7), sp = rand(60, 220);
        parts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 100, life: rand(.3, .7), age: 0, color });
      }
    }
    function die() {
      if (dead) return;
      dead = true; p.vy = -520; deadT = 0; A.vibrate(200);
      A.sound(200, .6, 'square', .06, -150);
    }
    function hurt() {
      if (p.inv > 0 || dead) return;
      if (p.big) { p.big = false; p.inv = 1.5; A.vibrate(80); A.sound(300, .3, 'square', .06, -150); }
      else die();
    }
    function bump(cx, cy) {
      const c = col(cx), type = c.blocks.get(cy);
      if (type === 'qm') {
        c.blocks.set(cy, 'used');
        shrooms.push({ x: cx * T + 6, y: (cy - 1) * T + 10, w: 20, h: 20, vx: 75, vy: -220 });
        A.sound(520, .3, 'triangle', .07, 500);
      } else if (type === 'q') {
        c.blocks.set(cy, 'used');
        coinCount++; coinPts += 10 * lvAt(far);
        pops.push({ x: cx * T + T / 2, y: cy * T, vy: -320, age: 0 });
        A.sound(990, .1, 'square', .05);
      } else if (type === 'brick') A.sound(140, .06, 'square', .05);
      bumps.set(cx + ':' + cy, .15);
      for (const e of enemies) {
        if (!e.dead && Math.abs(e.x + e.w / 2 - (cx * T + T / 2)) < T && Math.abs(e.y + e.h - cy * T) < 4) {
          e.dead = true; e.flip = true; e.vy = -300; stomps++; stompPts += 50 * lvAt(far);
        }
      }
    }

    function physics(dt) {
      const left = A.key('arrowleft', 'a'), right = A.key('arrowright', 'd');
      const jumpHeld = A.key(' ', 'arrowup', 'w', 'z');
      const dir = (right ? 1 : 0) - (left ? 1 : 0);
      const acc = p.ground ? 2000 : 1300, max = 215;
      if (dir) { p.vx += dir * acc * dt; p.face = dir; }
      else { const f = (p.ground ? 1800 : 500) * dt; p.vx = Math.abs(p.vx) <= f ? 0 : p.vx - Math.sign(p.vx) * f; }
      p.vx = Math.max(-max, Math.min(max, p.vx));
      coyote = p.ground ? .1 : coyote - dt;
      if (buffer > 0 && coyote > 0) {
        p.vy = -650; buffer = 0; coyote = 0; p.ground = false;
        A.sound(520, .12, 'square', .04, 300);
      }
      if (!jumpHeld && p.vy < -260) p.vy = -260;
      p.vy = Math.min(p.vy + G * dt, 900);

      for (const pl of platforms) {
        pl.ph += pl.sp * dt;
        const ny = pl.baseY - T * .5 + Math.sin(pl.ph) * T * 1.5;
        pl.dy = ny - pl.y; pl.y = ny;
      }
      if (p.onPlat) { p.y += p.onPlat.dy; }

      // horizontal
      p.x += p.vx * dt;
      let top = Math.floor(p.y / T), bot = Math.floor((p.y + p.h - .01) / T);
      if (p.vx > 0) {
        const cx = Math.floor((p.x + p.w - .01) / T);
        for (let cy = top; cy <= bot; cy++) if (solid(cx, cy)) { p.x = cx * T - p.w; p.vx = 0; break; }
      } else if (p.vx < 0) {
        const cx = Math.floor(p.x / T);
        for (let cy = top; cy <= bot; cy++) if (solid(cx, cy)) { p.x = (cx + 1) * T; p.vx = 0; break; }
      }
      if (p.x < cam) { p.x = cam; if (p.vx < 0) p.vx = 0; }

      // vertical
      p.y += p.vy * dt;
      p.ground = false;
      const l = Math.floor(p.x / T), r = Math.floor((p.x + p.w - .01) / T);
      if (p.vy > 0) {
        const cy = Math.floor((p.y + p.h - .01) / T);
        for (let cx = l; cx <= r; cx++) if (solid(cx, cy)) { p.y = cy * T - p.h; p.vy = 0; p.ground = true; break; }
      } else if (p.vy < 0) {
        const cy = Math.floor(p.y / T);
        const mid = Math.floor((p.x + p.w / 2) / T);
        const hitX = solid(mid, cy) ? mid : solid(l, cy) ? l : solid(r, cy) ? r : null;
        if (hitX !== null) { p.y = (cy + 1) * T; p.vy = 0; bump(hitX, cy); }
      }
      p.onPlat = null;
      if (p.vy >= 0) {
        for (const pl of platforms) {
          if (p.x + p.w > pl.x + 2 && p.x < pl.x + pl.w - 2 && p.y + p.h >= pl.y - 1 && p.y + p.h <= pl.y + 14) {
            p.y = pl.y - p.h; p.vy = 0; p.ground = true; p.onPlat = pl; break;
          }
        }
      }

      // enemies
      for (const e of enemies) {
        if (e.x > cam + viewW + 64 || e.x < cam - 200) continue;
        if (e.dead) {
          e.dt += dt;
          if (e.flip) { e.vy += G * dt; e.y += e.vy * dt; }
          continue;
        }
        if (e.boss) e.inv = Math.max(0, e.inv - dt);
        if (e.fly) {
          e.x += e.vx * dt; e.ph += dt * 3; e.y = e.baseY + Math.sin(e.ph) * T * .8;
        } else {
        e.vy = Math.min(e.vy + G * dt, 900);
        e.x += e.vx * dt;
        const front = e.vx > 0 ? Math.floor((e.x + e.w) / T) : Math.floor(e.x / T);
        const midRow = Math.floor((e.y + e.h - 2) / T);
        if (solid(front, midRow)) { e.x -= e.vx * dt; e.vx = -e.vx; }
        else if (e.ground && !solid(front, Math.floor((e.y + e.h + 2) / T))) { e.x -= e.vx * dt; e.vx = -e.vx; }
        e.y += e.vy * dt; e.ground = false;
        const el = Math.floor(e.x / T), er = Math.floor((e.x + e.w - .01) / T), ecy = Math.floor((e.y + e.h - .01) / T);
        for (let cx = el; cx <= er; cx++) if (solid(cx, ecy)) { e.y = ecy * T - e.h; e.vy = 0; e.ground = true; break; }
        }
        if (!dead && p.x < e.x + e.w && p.x + p.w > e.x && p.y < e.y + e.h && p.y + p.h > e.y) {
          if (p.vy > 0 && p.y + p.h - e.y < 16) {
            if (e.boss) {
              if (e.inv <= 0) {
                e.hp--; e.inv = .7; e.vx *= 1.3; stompPts += 100 * lvAt(far);
                A.sound(200, .2, 'square', .08, -100); A.vibrate(40);
                burst(e.x + e.w / 2, e.y, '#e5484d');
                if (e.hp <= 0) { e.dead = true; e.flip = true; e.vy = -300; stomps++; stompPts += 500 * lvAt(far); A.sound(660, .5, 'triangle', .09, 600); }
              }
              p.vy = -560;
            } else {
              e.dead = true; stomps++; stompPts += 50 * lvAt(far); if (e.fly) { e.flip = true; e.vy = 0; }
              p.vy = jumpHeld ? -620 : -400;
              burst(e.x + e.w / 2, e.y + e.h / 2, '#b392f0');
              A.sound(330, .12, 'square', .06, -150);
            }
          } else hurt();
        }
      }
    }

    function update(dt) {
      t += dt;
      for (const [k, v] of bumps) { if (v - dt <= 0) bumps.delete(k); else bumps.set(k, v - dt); }
      for (let i = pops.length - 1; i >= 0; i--) { const c = pops[i]; c.age += dt; c.vy += G * .6 * dt; c.y += c.vy * dt; if (c.age > .55) pops.splice(i, 1); }
      for (let i = parts.length - 1; i >= 0; i--) {
        const q = parts[i]; q.age += dt;
        if (q.age > q.life) { parts.splice(i, 1); continue; }
        q.x += q.vx * dt; q.y += q.vy * dt; q.vy += 600 * dt;
      }
      p.inv = Math.max(0, p.inv - dt);
      for (let i = shrooms.length - 1; i >= 0; i--) {
        const m = shrooms[i];
        m.vy = Math.min(m.vy + G * dt, 900);
        m.x += m.vx * dt;
        const front = m.vx > 0 ? Math.floor((m.x + m.w) / T) : Math.floor(m.x / T);
        if (solid(front, Math.floor((m.y + m.h - 2) / T))) { m.x -= m.vx * dt; m.vx = -m.vx; }
        m.y += m.vy * dt;
        const ml = Math.floor(m.x / T), mr = Math.floor((m.x + m.w - .01) / T), mcy = Math.floor((m.y + m.h - .01) / T);
        if (m.vy > 0) for (let cx = ml; cx <= mr; cx++) if (solid(cx, mcy)) { m.y = mcy * T - m.h; m.vy = 0; break; }
        if (m.y > ROWS * T + 40 || m.x < cam - 100) { shrooms.splice(i, 1); continue; }
        if (!dead && p.x < m.x + m.w && p.x + p.w > m.x && p.y < m.y + m.h && p.y + p.h > m.y) {
          p.big = true; stompPts += 50 * lvAt(far);
          A.sound(400, .4, 'triangle', .08, 600);
          shrooms.splice(i, 1);
        }
      }
      if (dead) {
        p.vy += G * dt; p.y += p.vy * dt; deadT += dt;
        if (deadT > 1.2 && !ended) { ended = true; A.end(); }
        return;
      }
      if (A.hit(' ', 'arrowup', 'w', 'z')) buffer = .12; else buffer -= dt;
      const steps = Math.ceil(dt / .008);
      for (let i = 0; i < steps && !dead; i++) physics(dt / steps);
      if (dead) return;

      p.anim += Math.abs(p.vx) * dt * .06;
      cam = Math.max(cam, p.x - viewW * .4);
      far = Math.max(far, Math.floor(p.x / T));
      col(Math.floor((cam + viewW) / T) + 4);

      for (const c of coins) {
        if (!c.got && Math.abs(c.x - (p.x + p.w / 2)) < 18 && Math.abs(c.y - (p.y + p.h / 2)) < 22) {
          c.got = true; coinCount++; coinPts += 10 * lvAt(far);
          A.sound(1200, .08, 'square', .04);
        }
      }
      if (p.y > ROWS * T + 40) die();

      if (enemies.length > 60) enemies = enemies.filter(e => e.x > cam - 200 && e.y < ROWS * T + 200);
      if (coins.length > 200) coins = coins.filter(c => !c.got && c.x > cam - 100);

      const lv = lvAt(far);
      if (lv !== lastLv) { lastLv = lv; A.level(lv, NEWS[lv] || 'Nog meer vijanden'); }
      if (platforms.length > 20) platforms = platforms.filter(pl => pl.x > cam - 200);
      A.score(far * 2 + coinPts + stompPts);
      const boss = enemies.find(e => e.boss && !e.dead && e.x < cam + viewW && e.x > cam - 60);
      A.info((boss ? 'Eindbaas! ' : '') + (p.big ? 'Groot \u00b7 ' : '') + 'Munten ' + coinCount + ' \u00b7 ' + Math.max(0, far - 3) + ' m');
    }

    // ---------- drawing ----------
    function drawTile(cx, cy, type) {
      const bt = bumps.get(cx + ':' + cy) || 0;
      const x = cx * T, y = cy * T - (bt > 0 ? Math.sin(bt / .15 * Math.PI) * 6 : 0);
      if (type === 'brick') {
        ctx.fillStyle = '#a65a3a'; ctx.fillRect(x, y, T, T);
        ctx.fillStyle = '#7d3f27';
        ctx.fillRect(x, y + 15, T, 2); ctx.fillRect(x, y + 31, T, 1);
        ctx.fillRect(x + 15, y, 2, 15); ctx.fillRect(x + 7, y + 17, 2, 14); ctx.fillRect(x + 23, y + 17, 2, 14);
      } else if (type === 'q' || type === 'qm' || type === 'used') {
        ctx.fillStyle = type !== 'used' ? '#f4d35e' : '#6b5a3a'; rrect(ctx, x + 1, y + 1, T - 2, T - 2, 4); ctx.fill();
        ctx.fillStyle = type !== 'used' ? '#b98a1c' : '#4f4229';
        ctx.fillRect(x + 4, y + 4, 3, 3); ctx.fillRect(x + T - 7, y + 4, 3, 3); ctx.fillRect(x + 4, y + T - 7, 3, 3); ctx.fillRect(x + T - 7, y + T - 7, 3, 3);
        if (type !== 'used') {
          ctx.fillStyle = '#5a3d0a'; ctx.font = '700 20px "Atkinson Hyperlegible", sans-serif';
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('?', x + T / 2, y + T / 2 + 1);
        }
      } else if (type === 'pipeL' || type === 'pipeR') {
        const isTop = !col(cx).blocks.get(cy - 1);
        const L = type === 'pipeL';
        ctx.fillStyle = '#2f9e5b'; ctx.fillRect(x + (L ? 3 : 0), y, T - 3, T);
        ctx.fillStyle = '#56c47f'; if (L) ctx.fillRect(x + 7, y, 6, T);
        if (isTop) {
          ctx.fillStyle = '#2f9e5b'; ctx.fillRect(x - (L ? 0 : 0), y, T, 12);
          ctx.fillStyle = '#56c47f'; if (L) ctx.fillRect(x + 4, y + 2, 6, 8);
          ctx.fillStyle = '#1d6b3c'; ctx.fillRect(x, y + 12, T, 2);
        }
      }
    }
    function drawPlayer() {
      if (p.inv > 0 && Math.floor(p.inv * 12) % 2 === 0) return;
      const x = p.x, y = p.y, sc = p.big ? 1.3 : 1;
      ctx.save(); ctx.translate(x + p.w / 2, y + p.h); ctx.scale(p.face * sc, sc); ctx.translate(-p.w / 2, -p.h);
      const step = p.ground && Math.abs(p.vx) > 20 ? Math.sin(p.anim * 6) * 3 : 0;
      ctx.fillStyle = '#3b2a20';
      ctx.fillRect(3, 23 + Math.max(0, step), 6, 5 - Math.max(0, step));
      ctx.fillRect(11, 23 + Math.max(0, -step), 6, 5 - Math.max(0, -step));
      ctx.fillStyle = '#ff8c42'; rrect(ctx, 2, 12, 16, 12, 3); ctx.fill();
      ctx.fillStyle = '#7cc6fe'; ctx.fillRect(4, 14, 3, 3);
      ctx.fillStyle = '#f2c7a0'; rrect(ctx, 3, 2, 14, 11, 4); ctx.fill();
      ctx.fillStyle = '#e5484d'; rrect(ctx, 2, 0, 16, 5, 2); ctx.fill(); ctx.fillRect(12, 3, 8, 2);
      ctx.fillStyle = '#070b17'; ctx.fillRect(12, 6, 2, 3);
      ctx.restore();
    }
    function drawEnemy(e) {
      if (e.boss) {
        if (e.inv > 0 && Math.floor(e.inv * 14) % 2 === 0) return;
        ctx.save();
        ctx.translate(e.x, e.y); ctx.scale(e.w / 24, e.h / 20);
        drawEnemy({ x: 0, y: 0, w: 24, h: 20, vx: e.vx, dead: false, flip: e.flip, dt: 0 });
        ctx.restore();
        ctx.fillStyle = '#f4d35e';
        ctx.beginPath(); ctx.moveTo(e.x + 14, e.y + 4); ctx.lineTo(e.x + 18, e.y - 10); ctx.lineTo(e.x + 24, e.y); ctx.lineTo(e.x + 26, e.y - 12);
        ctx.lineTo(e.x + 30, e.y); ctx.lineTo(e.x + 36, e.y - 10); ctx.lineTo(e.x + 38, e.y + 4); ctx.closePath(); ctx.fill();
        for (let i = 0; i < 3; i++) { ctx.fillStyle = i < e.hp ? '#e5484d' : 'rgba(232,239,228,.25)'; ctx.fillRect(e.x + 10 + i * 12, e.y - 22, 9, 6); }
        return;
      }
      const x = e.x, y = e.y;
      if (e.fly) {
        ctx.save();
        if (e.flip) { ctx.translate(x + e.w / 2, y + e.h / 2); ctx.scale(1, -1); ctx.translate(-x - e.w / 2, -y - e.h / 2); }
        const flap = Math.sin(t * 18 + x) * 6;
        ctx.fillStyle = '#e5484d';
        ctx.beginPath(); ctx.moveTo(x + e.w / 2, y + 8);
        ctx.quadraticCurveTo(x - 6, y - 4 + flap, x - 12, y + 6 + flap); ctx.quadraticCurveTo(x, y + 10, x + e.w / 2, y + 14);
        ctx.quadraticCurveTo(x + e.w, y + 10, x + e.w + 12, y + 6 + flap); ctx.quadraticCurveTo(x + e.w + 6, y - 4 + flap, x + e.w / 2, y + 8); ctx.fill();
        ctx.fillStyle = '#9b2c30'; ctx.beginPath(); ctx.ellipse(x + e.w / 2, y + e.h / 2 + 1, 8, 9, 0, 0, 7); ctx.fill();
        ctx.fillStyle = '#f4d35e'; ctx.fillRect(x + e.w / 2 - 5, y + 6, 3, 3); ctx.fillRect(x + e.w / 2 + 2, y + 6, 3, 3);
        ctx.restore();
        return;
      }
      if (e.dead && !e.flip) {
        if (e.dt > .5) return;
        ctx.fillStyle = '#7a5bb0'; rrect(ctx, x, y + e.h - 6, e.w, 6, 3); ctx.fill(); return;
      }
      ctx.save();
      if (e.flip) { ctx.translate(x + e.w / 2, y + e.h / 2); ctx.scale(1, -1); ctx.translate(-x - e.w / 2, -y - e.h / 2); }
      const wob = Math.sin(t * 12 + x) * 2;
      ctx.fillStyle = '#3b2a20'; ctx.fillRect(x + 3 + wob, y + e.h - 4, 6, 4); ctx.fillRect(x + e.w - 9 - wob, y + e.h - 4, 6, 4);
      ctx.fillStyle = '#b392f0'; ctx.beginPath(); ctx.ellipse(x + e.w / 2, y + e.h - 3, e.w / 2, e.h - 3, 0, Math.PI, 0); ctx.fill();
      ctx.fillStyle = '#7a5bb0'; ctx.fillRect(x + e.w / 2 - 1, y + 3, 2, e.h - 6);
      ctx.fillStyle = '#fff'; const ex = e.vx < 0 ? -3 : 3;
      ctx.beginPath(); ctx.arc(x + e.w / 2 - 5 + ex, y + 9, 3, 0, 7); ctx.arc(x + e.w / 2 + 5 + ex, y + 9, 3, 0, 7); ctx.fill();
      ctx.fillStyle = '#070b17'; ctx.fillRect(x + e.w / 2 - 5 + ex * 1.3, y + 8, 2, 3); ctx.fillRect(x + e.w / 2 + 5 + ex * 1.3, y + 8, 2, 3);
      ctx.restore();
    }

    function draw() {
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#16224a'); g.addColorStop(1, '#2b3a63');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = 'rgba(240,235,200,.85)'; ctx.beginPath(); ctx.arc(W * .8, H * .18, 26, 0, 7); ctx.fill();
      ctx.fillStyle = 'rgba(230,240,255,.6)';
      for (let i = 0; i < 40; i++) { const sx = ((i * 137 - cam * s * .05) % W + W) % W; ctx.fillRect(sx, (i * 71) % (H * .5), 1.5, 1.5); }
      ctx.fillStyle = '#1c2b4f';
      ctx.beginPath(); ctx.moveTo(0, H);
      for (let x = 0; x <= W + 20; x += 20) ctx.lineTo(x, H * .62 + Math.sin((x + cam * s * .3) * .006) * 40 + Math.sin((x + cam * s * .3) * .017) * 14);
      ctx.lineTo(W, H); ctx.fill();

      const worldBottom = offY + ROWS * T * s;
      if (worldBottom < H) { ctx.fillStyle = '#4a2f21'; ctx.fillRect(0, worldBottom - 2, W, H - worldBottom + 2); }
      ctx.save(); ctx.translate(0, offY); ctx.scale(s, s); ctx.translate(-cam, 0);
      const c0 = Math.max(0, Math.floor(cam / T) - 1), c1 = Math.floor((cam + viewW) / T) + 1;
      for (let cx = c0; cx <= c1; cx++) {
        const c = col(cx);
        if (c.g) {
          const gy = (ROWS - c.g) * T;
          ctx.fillStyle = '#5b3b2a'; ctx.fillRect(cx * T, gy, T + .5, c.g * T + 40);
          ctx.fillStyle = '#4a2f21';
          for (let r = 1; r < c.g + 1; r++) if ((cx * 7 + r * 3) % 4 === 0) ctx.fillRect(cx * T + ((cx * 13 + r * 5) % 22), gy + r * T - 18, 6, 4);
          ctx.fillStyle = '#3fae6a'; ctx.fillRect(cx * T, gy, T + .5, 7);
          ctx.fillStyle = '#2f8a52'; ctx.fillRect(cx * T, gy + 7, T + .5, 2);
        }
        for (const [cy, type] of c.blocks) drawTile(cx, cy, type);
      }
      for (const pl of platforms) {
        if (pl.x > cam + viewW + T || pl.x + pl.w < cam - T) continue;
        ctx.fillStyle = '#7d5a3c'; rrect(ctx, pl.x, pl.y, pl.w, 12, 3); ctx.fill();
        ctx.fillStyle = '#9b7350'; ctx.fillRect(pl.x + 2, pl.y + 2, pl.w - 4, 3);
        ctx.fillStyle = '#5b3f29'; ctx.fillRect(pl.x + pl.w / 2 - 1, pl.y + 2, 2, 10);
        ctx.strokeStyle = 'rgba(232,239,228,.25)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(pl.x + 6, pl.y); ctx.lineTo(pl.x + 6, 0); ctx.moveTo(pl.x + pl.w - 6, pl.y); ctx.lineTo(pl.x + pl.w - 6, 0); ctx.stroke();
      }
      for (const c of coins) {
        if (c.got || c.x < cam - T || c.x > cam + viewW + T) continue;
        const sq = Math.abs(Math.cos(t * 4 + c.x * .05));
        ctx.fillStyle = '#f4d35e'; ctx.beginPath(); ctx.ellipse(c.x, c.y, 8 * sq + 1.5, 10, 0, 0, 7); ctx.fill();
        ctx.fillStyle = '#b98a1c'; ctx.fillRect(c.x - .75, c.y - 5, 1.5, 10);
      }
      for (const c of pops) { ctx.fillStyle = '#f4d35e'; ctx.beginPath(); ctx.ellipse(c.x, c.y, 6, 9, 0, 0, 7); ctx.fill(); }
      for (const e of enemies) if (e.x > cam - 40 && e.x < cam + viewW + 40) drawEnemy(e);
      for (const q of parts) { ctx.globalAlpha = 1 - q.age / q.life; ctx.fillStyle = q.color; ctx.fillRect(q.x - 2, q.y - 2, 4, 4); }
      ctx.globalAlpha = 1;
      for (const m of shrooms) {
        ctx.fillStyle = '#f2e6d0'; ctx.fillRect(m.x + 6, m.y + 9, 8, 11);
        ctx.fillStyle = '#e5484d'; ctx.beginPath(); ctx.ellipse(m.x + 10, m.y + 10, 11, 10, 0, Math.PI, 0); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(m.x + 5, m.y + 5, 2.5, 0, 7); ctx.arc(m.x + 14, m.y + 4, 2.5, 0, 7); ctx.fill();
      }
      drawPlayer();
      ctx.restore();
    }

    return { update, draw, resize };
  }
});
