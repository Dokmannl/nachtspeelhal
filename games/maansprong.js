GAMES.push({
  id: 'maansprong',
  name: 'Maansprong',
  color: '#c9b8ff',
  music: { bpm: 80, root: 59, scale: 'minor', prog: [0, 5, 3, 6], pad: 'sine', lead: 'sine', every: 2, pat: [0, 2, 4, 2, 1, 2], cut: 2200 },
  blurb: 'Spring van maan naar maan door de ruimte. De zwaartekracht van de manen buigt je sprong af.',
  how: [
    'Tik, klik of druk op spatie om te springen: je vliegt recht van de maan af',
    'Andere manen trekken je met hun zwaartekracht naar zich toe. Mis je, dan zweef je weg',
    'Pak sterren onderweg voor extra punten',
    'Elke 8 manen een level: sneller draaiende en kleinere manen, vanaf level 4 meteorieten, level 6 bewegende manen, level 8 zwarte gaten'
  ],
  touch: null,

  thumb(c, w, h) {
    const g = c.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#120a2e'); g.addColorStop(1, '#05060f');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    c.fillStyle = 'rgba(230,240,255,.7)'; for (let i = 0; i < 40; i++) c.fillRect((i * 83) % w, (i * 47) % h, 1.5, 1.5);
    const moon = (x, y, r) => { c.fillStyle = '#d8d2c0'; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); c.fillStyle = '#b5ad98'; c.beginPath(); c.arc(x - r * .3, y - r * .2, r * .22, 0, 7); c.arc(x + r * .35, y + r * .3, r * .16, 0, 7); c.fill(); };
    moon(90, 140, 32); moon(210, 80, 26); moon(120, 26, 20);
    c.strokeStyle = 'rgba(201,184,255,.6)'; c.setLineDash([3, 6]); c.lineWidth = 2; c.beginPath(); c.moveTo(110, 112); c.quadraticCurveTo(170, 70, 190, 92); c.stroke(); c.setLineDash([]);
    c.fillStyle = '#ffffff'; c.beginPath(); c.arc(160, 84, 7, 0, 7); c.fill();
    c.fillStyle = '#5b8def'; c.beginPath(); c.arc(162, 83, 3.5, 0, 7); c.fill();
    c.fillStyle = '#f4d35e'; c.beginPath(); c.arc(250, 140, 5, 0, 7); c.fill();
  },

  create(A) {
    const ctx = A.ctx, rand = A.rand, PR = 9, JUMP = 470, K = 1400;
    const NEWS = { 2: 'De manen draaien sneller', 3: 'Kleinere manen', 4: 'Pas op voor meteorieten', 6: 'Bewegende manen', 8: 'Zwarte gaten trekken je naar binnen' };
    let W = 0, H = 0, PW = 0, ox = 0;
    let moons = [], stars = [], rocks = [], holes = [], parts = [], bg = [];
    let camY = 0, camTarget = 0, level = 1, reached = 0, score = 0, starsGot = 0, t = 0, rockT = 3;
    let dead = false, deadT = 0, ended = false, nextIdx = 0;
    const p = { x: 0, y: 0, vx: 0, vy: 0, on: null, ang: -Math.PI / 2, left: null, trail: [] };

    const lvAt = n => 1 + Math.floor(n / 8);
    function layout() {
      W = A.W; H = A.H; PW = Math.min(W, 560); ox = (W - PW) / 2;
      bg = Array.from({ length: 120 }, (_, i) => ({ x: (i * 197) % Math.max(1, W), y: (i * 131) % Math.max(1, H), s: .2 + (i % 5) * .15, b: .3 + (i % 7) / 10 }));
      for (const m of moons) { m.x = Math.min(Math.max(m.x, m.r + 16), PW - m.r - 16); m.baseX = m.x; }
    }
    function addMoon() {
      const prev = moons[moons.length - 1];
      const idx = nextIdx++, lv = lvAt(idx);
      const r = Math.max(20, rand(30, 46) - (lv >= 3 ? Math.min(14, (lv - 2) * 3) : 0));
      const y = prev ? prev.y - rand(160, 230) - Math.min(40, lv * 4) : 0;
      let x = prev ? rand(r + 20, PW - r - 20) : PW / 2;
      if (prev && Math.abs(x - prev.x) < 50) x = Math.min(PW - r - 20, Math.max(r + 20, x + (x < PW / 2 ? 90 : -90)));
      const w = prev ? (rand(.7, 1.3) + (lv - 1) * .15) * (Math.random() < .5 ? -1 : 1) : .8;
      const m = { idx, x, baseX: x, y, r, w, a: rand(0, 6), moving: lv >= 6 && prev && Math.random() < .4, amp: rand(30, 70), ph: rand(0, 6), craters: [[.3, -.2, .22], [-.35, .3, .16], [.1, .45, .12], [-.2, -.45, .1]] };
      moons.push(m);
      if (prev && Math.random() < .55) stars.push({ x: (x + prev.x) / 2 + rand(-40, 40), y: (y + prev.y) / 2 + rand(-20, 20), got: false, ph: rand(0, 6) });
      if (prev && lv >= 8 && Math.random() < .18) holes.push({ x: rand(30, PW - 30), y: (y + prev.y) / 2, r: 14 });
    }
    layout();
    for (let i = 0; i < 8; i++) addMoon();
    p.on = moons[0];
    camY = camTarget = moons[0].y - H * .68;

    function burst(x, y, color, n = 14) {
      if (A.reduce) n = 5;
      for (let i = 0; i < n; i++) { const a = rand(0, 7), s = rand(40, 200); parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: rand(.3, .8), age: 0, color }); }
    }
    function die() {
      if (dead) return;
      dead = true; deadT = 0;
      A.vibrate(200); A.sound(180, .7, 'sawtooth', .07, -120);
      burst(p.x, p.y, '#c9b8ff', 20);
    }
    function moonX(m) { return m.moving ? m.baseX + Math.sin(t * .8 + m.ph) * m.amp : m.baseX; }

    function update(dt) {
      t += dt;
      for (let i = parts.length - 1; i >= 0; i--) { const q = parts[i]; q.age += dt; if (q.age > q.life) { parts.splice(i, 1); continue; } q.x += q.vx * dt; q.y += q.vy * dt; }
      for (const m of moons) { m.a += m.w * dt; m.x = Math.min(Math.max(moonX(m), m.r + 10), PW - m.r - 10); }
      camY += (camTarget - camY) * Math.min(1, dt * 4);
      if (dead) { deadT += dt; if (deadT > 1.1 && !ended) { ended = true; A.score(score); A.end(); } return; }

      if (p.on) {
        const m = p.on;
        p.ang += m.w * dt;
        p.x = m.x + Math.cos(p.ang) * (m.r + PR); p.y = m.y + Math.sin(p.ang) * (m.r + PR);
        if (A.hit(' ', 'tap', 'arrowup', 'w', 'enter')) {
          const nx = Math.cos(p.ang), ny = Math.sin(p.ang), tx = -ny, ty = nx, tv = m.w * (m.r + PR) * .5;
          p.vx = nx * JUMP + tx * tv; p.vy = ny * JUMP + ty * tv;
          p.left = m; p.on = null; p.trail = [];
          A.sound(500, .12, 'triangle', .06, 300);
        }
      } else {
        let ax = 0, ay = 0;
        for (const m of moons) {
          if (m === p.left) continue;
          const dx = m.x - p.x, dy = m.y - p.y, d2 = dx * dx + dy * dy, d = Math.sqrt(d2);
          if (d > m.r * 6) continue;
          const a = Math.min(1600, K * m.r * m.r / Math.max(d2, m.r * m.r));
          ax += dx / d * a; ay += dy / d * a;
        }
        for (const hl of holes) {
          const dx = hl.x - p.x, dy = hl.y - p.y, d = Math.hypot(dx, dy);
          if (d < hl.r + PR) { die(); return; }
          if (d < 220) { const a = Math.min(2600, 2600 * 900 / Math.max(d * d, 400)); ax += dx / d * a; ay += dy / d * a; }
        }
        p.vx += ax * dt; p.vy += ay * dt;
        const sp = Math.hypot(p.vx, p.vy); if (sp > 900) { p.vx *= 900 / sp; p.vy *= 900 / sp; }
        p.x += p.vx * dt; p.y += p.vy * dt;
        p.trail.push({ x: p.x, y: p.y }); if (p.trail.length > 30) p.trail.shift();
        for (const m of moons) {
          if (m === p.left) continue;
          if (Math.hypot(m.x - p.x, m.y - p.y) <= m.r + PR) {
            p.on = m; p.left = null; p.ang = Math.atan2(p.y - m.y, p.x - m.x);
            camTarget = m.y - H * .68;
            if (m.idx > reached) {
              const gain = m.idx - reached; reached = m.idx;
              score += 10 * gain * level;
              A.sound(660, .15, 'triangle', .07, 200);
              burst(p.x, p.y, '#ffffff', 8);
              const nl = lvAt(reached);
              if (nl > level) { level = nl; A.level(level, NEWS[level] || 'Alles gaat sneller'); }
            } else A.sound(330, .08, 'sine', .05);
            break;
          }
        }
        if (!p.on && (p.y > camY + H + 60 || p.y < camY - H * .9 || p.x < -90 || p.x > PW + 90)) die();
      }

      for (const s of stars) {
        if (!s.got && Math.hypot(s.x - p.x, s.y - p.y) < PR + 12) { s.got = true; starsGot++; score += 25 * level; A.sound(990, .1, 'square', .05); burst(s.x, s.y, '#f4d35e', 10); }
      }
      if (level >= 4) {
        rockT -= dt;
        if (rockT <= 0) {
          const left = Math.random() < .5;
          rocks.push({ x: left ? -30 : PW + 30, y: camY + rand(H * .1, H * .7), vx: (left ? 1 : -1) * rand(110, 170 + level * 8), vy: rand(-30, 30), r: rand(8, 13), spin: rand(0, 6) });
          rockT = Math.max(1.2, 4 - (level - 4) * .3) * rand(.7, 1.3);
        }
      }
      for (let i = rocks.length - 1; i >= 0; i--) {
        const r = rocks[i]; r.x += r.vx * dt; r.y += r.vy * dt; r.spin += dt * 3;
        if (r.x < -60 || r.x > PW + 60) { rocks.splice(i, 1); continue; }
        if (Math.hypot(r.x - p.x, r.y - p.y) < r.r + PR - 2) { die(); return; }
      }
      while (moons[moons.length - 1].y > camY - H) addMoon();
      moons = moons.filter(m => m === p.on || m === p.left || m.y < camY + H + 300);
      stars = stars.filter(s => s.y < camY + H + 200);
      holes = holes.filter(hl => hl.y < camY + H + 200);
      A.score(score);
      A.info('Manen ' + reached + (starsGot ? ' \u00b7 sterren ' + starsGot : ''));
    }

    function draw() {
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#120a2e'); g.addColorStop(1, '#05060f');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      for (const s of bg) {
        const y = ((s.y - camY * s.s * .3) % H + H) % H;
        ctx.fillStyle = `rgba(230,240,255,${s.b})`; ctx.fillRect(s.x, y, 1.6, 1.6);
      }
      ctx.save(); ctx.translate(ox, -camY);
      if (ox > 0) { ctx.strokeStyle = 'rgba(201,184,255,.08)'; ctx.strokeRect(0, camY, PW, H); }
      for (const hl of holes) {
        const hg = ctx.createRadialGradient(hl.x, hl.y, 0, hl.x, hl.y, 70);
        hg.addColorStop(0, 'rgba(0,0,0,1)'); hg.addColorStop(.25, 'rgba(60,20,90,.8)'); hg.addColorStop(1, 'rgba(60,20,90,0)');
        ctx.fillStyle = hg; ctx.beginPath(); ctx.arc(hl.x, hl.y, 70, 0, 7); ctx.fill();
        ctx.strokeStyle = 'rgba(201,184,255,.6)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(hl.x, hl.y, hl.r + 6 + Math.sin(t * 5) * 2, 0, 7); ctx.stroke();
      }
      for (const m of moons) {
        const mg = ctx.createRadialGradient(m.x, m.y, m.r * .8, m.x, m.y, m.r * 1.8);
        mg.addColorStop(0, 'rgba(201,184,255,.18)'); mg.addColorStop(1, 'rgba(201,184,255,0)');
        ctx.fillStyle = mg; ctx.beginPath(); ctx.arc(m.x, m.y, m.r * 1.8, 0, 7); ctx.fill();
        ctx.fillStyle = m.idx > reached ? '#d8d2c0' : '#a9a392'; ctx.beginPath(); ctx.arc(m.x, m.y, m.r, 0, 7); ctx.fill();
        ctx.fillStyle = m.idx > reached ? '#b5ad98' : '#8c8778';
        for (const [cx, cy, cr] of m.craters) {
          const ca = Math.atan2(cy, cx) + m.a, cd = Math.hypot(cx, cy) * m.r;
          ctx.beginPath(); ctx.arc(m.x + Math.cos(ca) * cd, m.y + Math.sin(ca) * cd, cr * m.r, 0, 7); ctx.fill();
        }
      }
      for (const s of stars) {
        if (s.got) continue;
        const sr = 7 + Math.sin(t * 4 + s.ph) * 1.5;
        ctx.fillStyle = '#f4d35e'; ctx.beginPath();
        for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, rr = k % 2 ? sr * .45 : sr; ctx.lineTo(s.x + Math.cos(a) * rr, s.y + Math.sin(a) * rr); }
        ctx.closePath(); ctx.fill();
      }
      for (const r of rocks) {
        ctx.save(); ctx.translate(r.x, r.y); ctx.rotate(r.spin);
        ctx.fillStyle = '#7a5b46'; ctx.beginPath();
        for (let k = 0; k < 7; k++) { const a = k / 7 * Math.PI * 2, rr = r.r * (.75 + ((k * 37) % 5) / 10); ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
        ctx.closePath(); ctx.fill(); ctx.restore();
        ctx.strokeStyle = 'rgba(255,140,66,.45)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(r.x, r.y); ctx.lineTo(r.x - r.vx * .15, r.y - r.vy * .15); ctx.stroke();
      }
      if (!dead) {
        if (p.on && level < 6) {
          ctx.strokeStyle = 'rgba(201,184,255,.35)'; ctx.setLineDash([3, 7]); ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + Math.cos(p.ang) * 70, p.y + Math.sin(p.ang) * 70); ctx.stroke(); ctx.setLineDash([]);
        }
        p.trail.forEach((q, i) => { ctx.fillStyle = `rgba(201,184,255,${i / p.trail.length * .4})`; ctx.beginPath(); ctx.arc(q.x, q.y, 2, 0, 7); ctx.fill(); });
        const rot = p.on ? p.ang + Math.PI / 2 : Math.atan2(p.vy, p.vx) + Math.PI / 2;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(rot);
        ctx.fillStyle = '#9aa4b8'; ctx.fillRect(-7, -2, 4, 9);
        ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(0, 0, PR, 0, 7); ctx.fill();
        ctx.fillStyle = '#5b8def'; ctx.beginPath(); ctx.ellipse(1, -2, 5, 3.6, 0, 0, 7); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fillRect(2, -4, 2, 2);
        ctx.restore();
      }
      for (const q of parts) { ctx.globalAlpha = 1 - q.age / q.life; ctx.fillStyle = q.color; ctx.fillRect(q.x - 2, q.y - 2, 4, 4); }
      ctx.globalAlpha = 1;
      ctx.restore();
    }

    return { update, draw, resize: layout, idle(dt) { t += dt; for (const m of moons) m.a += m.w * dt; if (p.on) { p.ang += p.on.w * dt; p.x = p.on.x + Math.cos(p.ang) * (p.on.r + PR); p.y = p.on.y + Math.sin(p.ang) * (p.on.r + PR); } } };
  }
});
