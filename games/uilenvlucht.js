GAMES.push({
  id: 'uilenvlucht',
  name: 'Uilenvlucht',
  color: '#d9a86c',
  music: { bpm: 92, root: 62, scale: 'major', prog: [0, 5, 3, 4], pad: 'sine', lead: 'triangle', every: 2, pat: [0, 1, 2, 1], cut: 2000 },
  blurb: 'Fladder met de uil tussen de boomstammen door. Raak geen boom en blijf van de grond af.',
  how: [
    'Spatie, pijltje omhoog, klikken of tikken: de uil fladdert omhoog',
    'Vang vuurvliegjes voor extra punten',
    'Elke 10 bomen een level. Level 3: bewegende stammen. Level 5: vleermuizen in de openingen. Level 7: mist en smallere openingen'
  ],
  touch: null,

  thumb(c, w, h) {
    const g = c.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#0b1430'); g.addColorStop(1, '#14283a');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    c.fillStyle = 'rgba(240,235,200,.9)'; c.beginPath(); c.arc(270, 34, 16, 0, 7); c.fill();
    for (const [x, gy] of [[150, 70], [250, 110]]) {
      c.fillStyle = '#5b3d28'; c.fillRect(x, 0, 30, gy - 34); c.fillRect(x, gy + 34, 30, h - gy - 34);
      c.fillStyle = '#1f4a2c'; c.beginPath(); c.ellipse(x + 15, gy - 34, 24, 9, 0, 0, 7); c.ellipse(x + 15, gy + 34, 24, 9, 0, 0, 7); c.fill();
    }
    c.fillStyle = '#8a6040'; c.beginPath(); c.ellipse(80, 96, 18, 16, 0, 0, 7); c.fill();
    c.fillStyle = '#fff'; c.beginPath(); c.arc(74, 90, 6, 0, 7); c.arc(87, 90, 6, 0, 7); c.fill();
    c.fillStyle = '#070b17'; c.beginPath(); c.arc(76, 90, 3, 0, 7); c.arc(89, 90, 3, 0, 7); c.fill();
    c.fillStyle = '#f4d35e'; c.beginPath(); c.arc(205, 80, 4, 0, 7); c.fill();
    c.fillStyle = '#1a3a22'; c.fillRect(0, h - 14, w, 14);
  },

  create(A) {
    const ctx = A.ctx, rand = A.rand, TW = 62, R = 14;
    const NEWS = { 2: 'Je vliegt sneller', 3: 'De stammen bewegen', 5: 'Pas op: vleermuizen in de openingen', 7: 'Mist en smallere openingen' };
    const coarse = matchMedia('(pointer: coarse)').matches;
    let W = 0, H = 0, groundY = 0;
    let trunks = [], flies = [], bats = [], parts = [];
    let t = 0, score = 0, passed = 0, level = 1, started = false, dead = false, deadT = 0, ended = false, scroll = 0;
    const owl = { x: 0, y: 0, vy: 0, flapT: 0 };

    const gapSize = () => Math.max(H * .19, Math.min(235, H * .37) - (level - 1) * 10 - (level >= 7 ? 12 : 0));
    const speed = () => 135 + (level - 1) * 15;
    const spacing = () => Math.max(200, 260 - level * 5);

    function layout() {
      W = A.W; H = A.H;
      groundY = H - (coarse ? 70 : 40);
      owl.x = Math.max(70, W * .26);
      if (!started) owl.y = groundY * .45;
    }
    layout();

    function spawnTrunk(x) {
      const gap = gapSize(), margin = 40;
      let gy = rand(margin + gap / 2, groundY - margin - gap / 2);
      const prev = trunks[trunks.length - 1];
      if (prev) { const maxShift = Math.min(220, groundY * .35); gy = Math.max(prev.base - maxShift, Math.min(prev.base + maxShift, gy)); }
      const tr = { x, gy, base: gy, gap, moving: level >= 3 && Math.random() < .5, ph: rand(0, 6), amp: Math.min(60, (groundY - gap) / 4), passed: false };
      trunks.push(tr);
      if (Math.random() < .4) flies.push({ x: x + TW / 2, tr, got: false, ph: rand(0, 6) });
      if (level >= 5 && Math.random() < Math.min(.6, .3 + (level - 5) * .06)) bats.push({ x: x + TW + spacing() / 2, y: gy, vx: -(60 + level * 5), ph: rand(0, 6) });
    }
    function burst(x, y, color, n = 12) {
      if (A.reduce) n = 4;
      for (let i = 0; i < n; i++) { const a = rand(0, 7), s = rand(40, 200); parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: rand(.3, .7), age: 0, color }); }
    }
    function die() {
      if (dead) return;
      dead = true; deadT = 0; owl.vy = -220;
      A.vibrate(200); A.sound(160, .5, 'sawtooth', .07, -100);
      burst(owl.x, owl.y, '#d9a86c', 18);
    }
    const circleRect = (cx, cy, r, x, y, w, h) => {
      const nx = Math.max(x, Math.min(cx, x + w)), ny = Math.max(y, Math.min(cy, y + h));
      return (cx - nx) ** 2 + (cy - ny) ** 2 < r * r;
    };

    function update(dt) {
      t += dt;
      owl.flapT = Math.max(0, owl.flapT - dt);
      for (let i = parts.length - 1; i >= 0; i--) { const p = parts[i]; p.age += dt; if (p.age > p.life) { parts.splice(i, 1); continue; } p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 300 * dt; }
      if (dead) {
        deadT += dt; owl.vy += 1500 * dt; owl.y = Math.min(groundY - R, owl.y + owl.vy * dt);
        if (deadT > 1 && !ended) { ended = true; A.score(score); A.end(); }
        return;
      }
      const flap = A.hit(' ', 'tap', 'arrowup', 'w', 'enter');
      if (flap) { started = true; owl.vy = -430; owl.flapT = .25; A.sound(520, .07, 'triangle', .05, 200); }
      if (!started) { owl.y = groundY * .45 + Math.sin(t * 3) * 8; A.info('Tik of druk op spatie om te vliegen'); return; }

      owl.vy = Math.min(owl.vy + 1500 * dt, 620);
      owl.y += owl.vy * dt;
      if (owl.y < R) { owl.y = R; owl.vy = 0; }
      if (owl.y + R > groundY) { owl.y = groundY - R; die(); return; }

      const sp = speed();
      scroll += sp * dt;
      const last = trunks[trunks.length - 1];
      if (!last || last.x < W - spacing()) spawnTrunk(last ? last.x + spacing() + TW : W + 60);
      for (const tr of trunks) {
        tr.x -= sp * dt;
        if (tr.moving) tr.gy = tr.base + Math.sin(t * 1.3 + tr.ph) * tr.amp;
        if (circleRect(owl.x, owl.y, R - 2, tr.x, 0, TW, tr.gy - tr.gap / 2) || circleRect(owl.x, owl.y, R - 2, tr.x, tr.gy + tr.gap / 2, TW, groundY)) { die(); return; }
        if (!tr.passed && tr.x + TW < owl.x) {
          tr.passed = true; passed++; score += level;
          A.sound(760, .06, 'square', .03);
          const nl = 1 + Math.floor(passed / 10);
          if (nl > level) { level = nl; A.level(level, NEWS[level] || 'Nog sneller'); }
        }
      }
      trunks = trunks.filter(tr => tr.x > -TW - 20);
      for (const f of flies) {
        if (f.got) continue;
        f.x = f.tr.x + TW / 2;
        const fy = f.tr.gy + Math.sin(t * 3 + f.ph) * 10;
        if (Math.hypot(f.x - owl.x, fy - owl.y) < 24) { f.got = true; score += 5 * level; burst(f.x, fy, '#f4d35e'); A.sound(990, .1, 'triangle', .06, 300); }
      }
      flies = flies.filter(f => !f.got && f.x > -20);
      for (const b of bats) {
        b.x += (b.vx - sp) * dt;
        const by = b.y + Math.sin(t * 4 + b.ph) * 14;
        if (Math.hypot(b.x - owl.x, by - owl.y) < 22) { die(); return; }
      }
      bats = bats.filter(b => b.x > -40);
      A.score(score);
      A.info('Bomen ' + passed);
    }

    function draw() {
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#0b1430'); g.addColorStop(1, '#14283a');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = 'rgba(230,240,255,.55)';
      for (let i = 0; i < 50; i++) ctx.fillRect(((i * 157 - scroll * .05) % W + W) % W, (i * 61) % (groundY * .7), 1.5, 1.5);
      ctx.fillStyle = 'rgba(240,235,200,.9)'; ctx.beginPath(); ctx.arc(W * .82, H * .14, 24, 0, 7); ctx.fill();
      ctx.fillStyle = '#10202c';
      ctx.beginPath(); ctx.moveTo(0, groundY);
      for (let x = 0; x <= W + 30; x += 30) { const wx = x + scroll * .3; ctx.lineTo(x, groundY - 60 - Math.abs(Math.sin(wx * .013)) * 70 - Math.sin(wx * .041) * 15); }
      ctx.lineTo(W, groundY); ctx.fill();

      for (const tr of trunks) {
        const top = tr.gy - tr.gap / 2, bot = tr.gy + tr.gap / 2;
        ctx.fillStyle = '#5b3d28'; ctx.fillRect(tr.x, 0, TW, top); ctx.fillRect(tr.x, bot, TW, groundY - bot);
        ctx.fillStyle = '#4a3020';
        for (let y = 12; y < top - 10; y += 26) ctx.fillRect(tr.x + 10 + (y % 3) * 8, y, 3, 14);
        for (let y = bot + 16; y < groundY - 10; y += 26) ctx.fillRect(tr.x + 12 + (y % 3) * 8, y, 3, 14);
        ctx.fillStyle = '#1f4a2c';
        ctx.beginPath(); ctx.ellipse(tr.x + TW / 2, top, TW * .72, 13, 0, 0, 7); ctx.fill();
        ctx.beginPath(); ctx.ellipse(tr.x + TW / 2, bot, TW * .72, 13, 0, 0, 7); ctx.fill();
        ctx.fillStyle = '#2a6038';
        ctx.beginPath(); ctx.ellipse(tr.x + TW / 2 - 8, top - 3, TW * .35, 7, 0, 0, 7); ctx.fill();
        ctx.beginPath(); ctx.ellipse(tr.x + TW / 2 + 8, bot - 3, TW * .35, 7, 0, 0, 7); ctx.fill();
      }
      for (const f of flies) {
        const fy = f.tr.gy + Math.sin(t * 3 + f.ph) * 10;
        const fg = ctx.createRadialGradient(f.x, fy, 0, f.x, fy, 16);
        fg.addColorStop(0, 'rgba(255,250,220,1)'); fg.addColorStop(.3, 'rgba(244,211,94,.7)'); fg.addColorStop(1, 'rgba(244,211,94,0)');
        ctx.fillStyle = fg; ctx.beginPath(); ctx.arc(f.x, fy, 16, 0, 7); ctx.fill();
      }
      for (const b of bats) {
        const by = b.y + Math.sin(t * 4 + b.ph) * 14, fl = Math.sin(t * 20 + b.ph) * 8;
        ctx.fillStyle = '#2a1f3d';
        ctx.beginPath(); ctx.moveTo(b.x, by); ctx.quadraticCurveTo(b.x - 12, by - 14 - fl, b.x - 24, by - 4 - fl); ctx.quadraticCurveTo(b.x - 10, by + 2, b.x, by + 6);
        ctx.quadraticCurveTo(b.x + 10, by + 2, b.x + 24, by - 4 - fl); ctx.quadraticCurveTo(b.x + 12, by - 14 - fl, b.x, by); ctx.fill();
        ctx.fillStyle = '#ff3b47'; ctx.fillRect(b.x - 4, by - 2, 2.5, 2.5); ctx.fillRect(b.x + 2, by - 2, 2.5, 2.5);
      }
      ctx.fillStyle = '#1a3a22'; ctx.fillRect(0, groundY, W, H - groundY);
      ctx.fillStyle = '#24502e';
      for (let x = -((scroll) % 18); x < W; x += 18) ctx.fillRect(x, groundY, 9, 4);

      ctx.save(); ctx.translate(owl.x, owl.y);
      ctx.rotate(Math.max(-.5, Math.min(1.1, owl.vy / 600)) * (started ? 1 : 0) + (dead ? deadT * 6 : 0));
      const wing = owl.flapT > 0 ? -10 : Math.sin(t * 6) * 3;
      ctx.fillStyle = '#6b4a30';
      ctx.beginPath(); ctx.ellipse(-12, 2 + wing * .4, 9, 14, -.6 + wing * .04, 0, 7); ctx.fill();
      ctx.fillStyle = '#8a6040'; ctx.beginPath(); ctx.ellipse(0, 0, 16, 15, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#c99c6c'; ctx.beginPath(); ctx.ellipse(2, 5, 9, 8, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#6b4a30'; ctx.beginPath(); ctx.moveTo(-9, -12); ctx.lineTo(-6, -20); ctx.lineTo(-2, -12); ctx.moveTo(4, -12); ctx.lineTo(8, -20); ctx.lineTo(11, -12); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(-3, -5, 6, 0, 7); ctx.arc(9, -5, 6, 0, 7); ctx.fill();
      ctx.fillStyle = '#f4d35e'; ctx.beginPath(); ctx.arc(-2, -5, 3.6, 0, 7); ctx.arc(10, -5, 3.6, 0, 7); ctx.fill();
      ctx.fillStyle = '#070b17'; ctx.beginPath(); ctx.arc(-1, -5, 1.8, 0, 7); ctx.arc(11, -5, 1.8, 0, 7); ctx.fill();
      ctx.fillStyle = '#ff8c42'; ctx.beginPath(); ctx.moveTo(3, 0); ctx.lineTo(7, 0); ctx.lineTo(5, 4); ctx.fill();
      ctx.restore();

      for (const p of parts) { ctx.globalAlpha = 1 - p.age / p.life; ctx.fillStyle = p.color; ctx.fillRect(p.x - 2, p.y - 2, 4, 4); }
      ctx.globalAlpha = 1;
      if (level >= 7) {
        const fog = ctx.createLinearGradient(W * .45, 0, W, 0);
        fog.addColorStop(0, 'rgba(20,30,45,0)'); fog.addColorStop(1, `rgba(20,30,45,${Math.min(.85, .55 + (level - 7) * .05)})`);
        ctx.fillStyle = fog; ctx.fillRect(0, 0, W, groundY);
      }
    }

    return { update, draw, resize: layout, idle(dt) { t += dt; owl.y = groundY * .45 + Math.sin(t * 3) * 8; } };
  }
});
