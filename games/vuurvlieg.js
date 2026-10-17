GAMES.push({
  id: 'vuurvlieg',
  name: 'Vuurvlieg',
  color: '#f4d35e',
  music: { bpm: 70, root: 57, scale: 'minor', prog: [0, 5, 3, 4], pad: 'sine', lead: 'sine', every: 4, pat: [0, 2, 1, 4], cut: 1800 },
  blurb: 'Je licht dooft langzaam uit. Vang lichtjes in het donkere bos en ontwijk de vleermuizen.',
  how: [
    'Muis of vinger: de vuurvlieg vliegt naar je wijzer toe',
    'Toetsenbord: pijltjes of WASD',
    'Groene lichtjes geven gloed, een gouden lichtje vult je helemaal op',
    'Elke 20 seconden een nieuw level: vanaf level 3 jagen vleermuizen op je, vanaf level 5 duikt er een uil op je af',
    'Power-ups: blauw schild vangt een klap op, paarse magneet trekt 8 seconden lichtjes naar je toe',
    'Hoe minder gloed, hoe minder je ziet. P of Esc pauzeert'
  ],
  touch: null,

  thumb(c, w, h) {
    const g = c.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#0b1430'); g.addColorStop(1, '#0d1f22');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    c.fillStyle = '#08151b';
    for (let x = 0; x < w + 30; x += 26) { c.beginPath(); c.moveTo(x, h * .55); c.lineTo(x - 18, h); c.lineTo(x + 18, h); c.fill(); }
    const dot = (x, y, r, col) => {
      const rg = c.createRadialGradient(x, y, 0, x, y, r);
      rg.addColorStop(0, 'rgba(255,255,240,1)'); rg.addColorStop(.3, col); rg.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = rg; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill();
    };
    dot(160, 92, 46, 'rgba(244,211,94,.7)');
    dot(70, 50, 14, 'rgba(158,240,200,.8)'); dot(250, 60, 14, 'rgba(158,240,200,.8)'); dot(230, 140, 18, 'rgba(244,211,94,.8)');
    c.fillStyle = '#ff3b47'; c.fillRect(56, 128, 3, 3); c.fillRect(63, 128, 3, 3);
  },

  create(A) {
    const ctx = A.ctx;
    let W = 0, H = 0, bg = null;
    let player, motes = [], bats = [], parts = [], glow = 100, score = 0, t = 0;
    let batTimer = 2, moteTimer = 0, hurtT = 0, combo = 0, comboT = 0, shake = 0, target = null;
    let owls = [], owlT = 2, lastLv = 1, pows = [], powT = 10, shield = false, magT = 0;
    const NEWS = { 2: 'Je licht dooft sneller', 3: 'Vleermuizen jagen op je', 5: 'Pas op: een uil duikt op je af', 7: 'Het bos wordt donkerder' };
    const lifeK = () => level() >= 7 ? Math.max(.5, 1 - (level() - 6) * .08) : 1;
    const visK = () => level() >= 7 ? Math.max(.6, 1 - (level() - 6) * .06) : 1;
    const rand = A.rand;
    const level = () => 1 + Math.floor(t / 20);

    function buildBg() {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      bg = document.createElement('canvas');
      bg.width = Math.max(1, W * dpr); bg.height = Math.max(1, H * dpr);
      const b = bg.getContext('2d');
      b.scale(dpr, dpr);
      const sky = b.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, '#0b1430'); sky.addColorStop(.6, '#10233a'); sky.addColorStop(1, '#0d1f22');
      b.fillStyle = sky; b.fillRect(0, 0, W, H);
      for (let i = 0; i < W * H / 4000; i++) {
        b.fillStyle = `rgba(230,240,255,${Math.random() * .7 + .1})`;
        b.fillRect(Math.random() * W, Math.random() * H * .6, 1.3, 1.3);
      }
      const mx = W * .82, my = H * .16;
      const mg = b.createRadialGradient(mx, my, 4, mx, my, 70);
      mg.addColorStop(0, 'rgba(240,235,200,.9)'); mg.addColorStop(.25, 'rgba(240,235,200,.25)'); mg.addColorStop(1, 'rgba(240,235,200,0)');
      b.fillStyle = mg; b.beginPath(); b.arc(mx, my, 70, 0, 7); b.fill();
      const layers = [['#132a33', .55, 60], ['#0e2028', .68, 46], ['#08151b', .82, 34]];
      for (const [col, base, size] of layers) {
        b.fillStyle = col;
        for (let x = -20; x < W + 40; x += size * (.6 + Math.random() * .5)) {
          const h = size * (1.6 + Math.random() * 1.6), y = H * base + Math.random() * 20;
          for (let k = 0; k < 3; k++) {
            const w = size * (.75 - k * .18), ty = y - h * k * .32;
            b.beginPath(); b.moveTo(x, ty - h * .55); b.lineTo(x - w, ty + h * .1); b.lineTo(x + w, ty + h * .1); b.fill();
          }
          b.fillRect(x - size * .08, y, size * .16, H);
        }
        b.fillRect(0, H * base + size * .4, W, H);
      }
    }

    function spawnMote() {
      const gold = Math.random() < .08;
      motes.push({ x: rand(30, W - 30), y: rand(30, H - 30), life: (gold ? 6 : rand(8, 12)) * lifeK(), age: 0, gold, ph: rand(0, 6) });
    }
    function spawnBat() {
      const lv = level(), left = Math.random() < .5;
      const speed = rand(110, 170) + lv * 20;
      const y = rand(30, H - 30);
      bats.push({ x: left ? -30 : W + 30, y, baseY: y, vx: left ? speed : -speed, amp: rand(10, 50), freq: rand(1.5, 3.5), ph: rand(0, 6), homing: lv >= 3 && Math.random() < Math.min(.6, .15 + lv * .05) });
    }
    function burst(x, y, color, n = 14, sp = 160) {
      if (A.reduce) n = Math.ceil(n / 3);
      for (let i = 0; i < n; i++) {
        const a = rand(0, Math.PI * 2), s = rand(sp * .3, sp);
        parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: rand(.4, .9), age: 0, color });
      }
    }

    function resize() {
      W = A.W; H = A.H; buildBg();
      if (player) { player.x = Math.min(player.x, W - 10); player.y = Math.min(player.y, H - 10); }
    }
    resize();
    player = { x: W / 2, y: H / 2, vx: 0, vy: 0, trail: [] };
    for (let i = 0; i < 4; i++) spawnMote();
    A.meter(1, 'Gloed');

    function update(dt) {
      t += dt;
      const lv = level(), P = A.pointer;
      if (lv !== lastLv) { lastLv = lv; A.level(lv, NEWS[lv] || 'Alles gaat sneller'); }
      let kx = 0, ky = 0;
      if (A.key('arrowleft', 'a')) kx--;
      if (A.key('arrowright', 'd')) kx++;
      if (A.key('arrowup', 'w')) ky--;
      if (A.key('arrowdown', 's')) ky++;
      if (kx || ky) target = null;
      else if ((P.moved || P.tap) && (P.type === 'mouse' || P.down)) target = { x: P.x, y: P.y };

      let dvx = 0, dvy = 0;
      if (kx || ky) { const m = Math.hypot(kx, ky); dvx = kx / m * 360; dvy = ky / m * 360; }
      else if (target) {
        const dx = target.x - player.x, dy = target.y - player.y, d = Math.hypot(dx, dy);
        if (d > 2) { const s = Math.min(420, d * 6); dvx = dx / d * s; dvy = dy / d * s; }
      }
      const k = Math.min(1, dt * 9);
      player.vx += (dvx - player.vx) * k; player.vy += (dvy - player.vy) * k;
      player.x = Math.max(10, Math.min(W - 10, player.x + player.vx * dt));
      player.y = Math.max(10, Math.min(H - 10, player.y + player.vy * dt));
      player.trail.push({ x: player.x, y: player.y });
      if (player.trail.length > 14) player.trail.shift();

      glow -= (4 + (lv - 1) * 1.3) * dt;
      hurtT = Math.max(0, hurtT - dt);
      comboT = Math.max(0, comboT - dt);
      if (comboT === 0) combo = 0;
      shake = Math.max(0, shake - dt * 30);
      score += dt * lv;

      moteTimer -= dt;
      if (moteTimer <= 0 && motes.length < 7) { spawnMote(); moteTimer = rand(.6, 1.4); }
      for (let i = motes.length - 1; i >= 0; i--) {
        const m = motes[i]; m.age += dt;
        if (m.age > m.life) { motes.splice(i, 1); continue; }
        if (Math.hypot(m.x - player.x, m.y - player.y) < 24) {
          combo = comboT > 0 ? combo + 1 : 1; comboT = 1.8;
          const mult = Math.min(combo, 8);
          if (m.gold) { glow = 100; score += 50 * mult * lv; burst(m.x, m.y, '#f4d35e', 26, 220); A.sound(880, .25, 'triangle', .1, 600); }
          else { glow = Math.min(100, glow + 14); score += 10 * mult * lv; burst(m.x, m.y, '#9ef0c8'); A.sound(520 + mult * 60, .12, 'sine', .07); }
          motes.splice(i, 1);
        }
      }

      batTimer -= dt;
      if (batTimer <= 0) {
        spawnBat(); if (lv >= 4 && Math.random() < .35) spawnBat();
        batTimer = Math.max(.4, 2.4 - lv * .25) * rand(.7, 1.2);
      }
      for (let i = bats.length - 1; i >= 0; i--) {
        const b = bats[i];
        b.x += b.vx * dt;
        if (b.homing) b.baseY += Math.sign(player.y - b.baseY) * 40 * dt;
        b.y = b.baseY + Math.sin(t * b.freq + b.ph) * b.amp;
        if (b.x < -60 || b.x > W + 60) { bats.splice(i, 1); continue; }
        if (hurtT === 0 && Math.hypot(b.x - player.x, b.y - player.y) < 22) {
          if (shield) { shield = false; hurtT = 1; A.sound(620, .25, 'triangle', .07, -300); } else { glow -= 30; hurtT = 1.3; A.vibrate(60); }
          shake = A.reduce ? 0 : 10; combo = 0;
          burst(player.x, player.y, '#e5484d', 18, 200); A.sound(180, .35, 'sawtooth', .08, -120);
        }
      }

      powT -= dt;
      if (powT <= 0) {
        if (!pows.length) pows.push({ x: rand(40, W - 40), y: rand(40, H - 40), kind: Math.random() < .5 ? 'schild' : 'magneet', age: 0 });
        powT = rand(12, 18);
      }
      for (let i = pows.length - 1; i >= 0; i--) {
        const q = pows[i]; q.age += dt;
        if (q.age > 9) { pows.splice(i, 1); continue; }
        if (Math.hypot(q.x - player.x, q.y - player.y) < 26) {
          if (q.kind === 'schild') shield = true; else magT = 8;
          A.sound(700, .3, 'triangle', .08, 400); burst(q.x, q.y, q.kind === 'schild' ? '#7cc6fe' : '#b392f0', 18, 180);
          pows.splice(i, 1);
        }
      }
      if (magT > 0) {
        magT -= dt;
        for (const m of motes) {
          const dx = player.x - m.x, dy = player.y - m.y, d = Math.hypot(dx, dy);
          if (d < 240 && d > 1) { m.x += dx / d * 280 * dt; m.y += dy / d * 280 * dt; }
        }
      }

      if (lv >= 5) {
        owlT -= dt;
        if (owlT <= 0) {
          const a = rand(0, Math.PI * 2), D = Math.hypot(W, H) * .6;
          owls.push({ phase: 'warn', t: 0, tx: player.x, ty: player.y, a, D, x: 0, y: 0, sp: 520 + lv * 20 });
          owlT = Math.max(3.5, 9 - (lv - 5) * .8) * rand(.8, 1.2);
          A.sound(240, .3, 'triangle', .06, 120);
        }
      }
      for (let i = owls.length - 1; i >= 0; i--) {
        const o = owls[i]; o.t += dt;
        if (o.phase === 'warn') {
          if (o.t > 1.1) { o.phase = 'fly'; o.t = 0; o.x = o.tx - Math.cos(o.a) * o.D; o.y = o.ty - Math.sin(o.a) * o.D; }
          continue;
        }
        o.x += Math.cos(o.a) * o.sp * dt; o.y += Math.sin(o.a) * o.sp * dt;
        if (o.t * o.sp > o.D * 2.2) { owls.splice(i, 1); continue; }
        if (hurtT === 0 && Math.hypot(o.x - player.x, o.y - player.y) < 26) {
          if (shield) { shield = false; hurtT = 1; A.sound(620, .25, 'triangle', .07, -300); } else { glow -= 40; hurtT = 1.3; A.vibrate(90); }
          shake = A.reduce ? 0 : 12; combo = 0;
          burst(player.x, player.y, '#e5484d', 22, 220); A.sound(150, .4, 'sawtooth', .09, -100);
        }
      }

      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i]; p.age += dt;
        if (p.age > p.life) { parts.splice(i, 1); continue; }
        p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= .94; p.vy *= .94;
      }

      A.score(score);
      A.meter(Math.max(0, glow) / 100, 'Gloed');
      A.info([shield ? 'schild' : '', magT > 0 ? 'magneet ' + Math.ceil(magT) + 's' : '', combo > 1 ? 'combo x' + Math.min(combo, 8) : ''].filter(Boolean).join(' \u00b7 '));
      if (glow <= 0) { glow = 0; A.end(); }
    }

    function drawBat(b, lit) {
      const flap = Math.sin(t * 20 + b.ph) * 9, dir = Math.sign(b.vx);
      ctx.save(); ctx.translate(b.x, b.y);
      if (lit) {
        ctx.fillStyle = '#2a1f3d';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(-12, -14 - flap, -24, -4 - flap);
        ctx.quadraticCurveTo(-16, 0, -10, 6);
        ctx.quadraticCurveTo(0, 2, 10, 6);
        ctx.quadraticCurveTo(16, 0, 24, -4 - flap);
        ctx.quadraticCurveTo(12, -14 - flap, 0, 0);
        ctx.fill();
        ctx.beginPath(); ctx.ellipse(0, 3, 6, 8, 0, 0, 7); ctx.fill();
      } else {
        ctx.fillStyle = '#ff3b47';
        ctx.shadowColor = '#ff3b47'; ctx.shadowBlur = 8;
        ctx.beginPath(); ctx.arc(dir * 2 - 2.5, 0, 1.8, 0, 7); ctx.arc(dir * 2 + 2.5, 0, 1.8, 0, 7); ctx.fill();
      }
      ctx.restore();
    }

    function drawOwl(o, lit) {
      ctx.save(); ctx.translate(o.x, o.y); ctx.rotate(o.a + Math.PI / 2);
      const flap = Math.sin(o.t * 14) * 6;
      if (lit) {
        ctx.fillStyle = '#4a3527';
        ctx.beginPath(); ctx.moveTo(0, -4); ctx.quadraticCurveTo(-26, -10 + flap, -38, 6 + flap); ctx.quadraticCurveTo(-18, 4, 0, 10);
        ctx.quadraticCurveTo(18, 4, 38, 6 + flap); ctx.quadraticCurveTo(26, -10 + flap, 0, -4); ctx.fill();
        ctx.fillStyle = '#6b4c36'; ctx.beginPath(); ctx.ellipse(0, 2, 11, 15, 0, 0, 7); ctx.fill();
      } else {
        ctx.fillStyle = '#ffb000'; ctx.shadowColor = '#ffb000'; ctx.shadowBlur = 10;
        ctx.beginPath(); ctx.arc(-5, -6, 3.2, 0, 7); ctx.arc(5, -6, 3.2, 0, 7); ctx.fill();
      }
      ctx.restore();
    }

    function draw() {
      if (shake) ctx.translate(rand(-shake, shake), rand(-shake, shake));
      ctx.drawImage(bg, 0, 0, W, H);
      for (const b of bats) drawBat(b, true);
      for (const o of owls) if (o.phase === 'fly') drawOwl(o, true);

      const r = (70 + glow * 2.6) * visK();
      const g = ctx.createRadialGradient(player.x, player.y, r * .15, player.x, player.y, r);
      g.addColorStop(0, 'rgba(4,7,16,0)');
      g.addColorStop(.6, 'rgba(4,7,16,.45)');
      g.addColorStop(1, 'rgba(4,7,16,.95)');
      ctx.fillStyle = g; ctx.fillRect(-20, -20, W + 40, H + 40);

      ctx.globalCompositeOperation = 'lighter';
      for (const m of motes) {
        const fadeIn = Math.min(1, m.age * 3), fadeOut = Math.min(1, (m.life - m.age) / 1.5);
        const blink = m.life - m.age < 1.5 ? (Math.sin(m.age * 20) > 0 ? 1 : .4) : 1;
        const a = fadeIn * fadeOut * blink;
        const rad = (m.gold ? 22 : 15) * (1 + Math.sin(t * 4 + m.ph) * .2);
        const col = m.gold ? '244,211,94' : '158,240,200';
        const my = m.y + Math.sin(t * 2 + m.ph) * 3;
        const mg = ctx.createRadialGradient(m.x, my, 0, m.x, my, rad);
        mg.addColorStop(0, `rgba(255,255,240,${a})`);
        mg.addColorStop(.25, `rgba(${col},${a * .9})`);
        mg.addColorStop(1, `rgba(${col},0)`);
        ctx.fillStyle = mg; ctx.beginPath(); ctx.arc(m.x, my, rad, 0, 7); ctx.fill();
      }
      for (const p of parts) {
        ctx.globalAlpha = 1 - p.age / p.life; ctx.fillStyle = p.color;
        ctx.fillRect(p.x - 1.5, p.y - 1.5, 3, 3);
      }
      ctx.globalAlpha = 1;
      const visible = !(hurtT > 0 && Math.floor(hurtT * 12) % 2 === 0);
      if (visible) {
        player.trail.forEach((p, i) => {
          ctx.fillStyle = `rgba(244,211,94,${i / player.trail.length * .25})`;
          ctx.beginPath(); ctx.arc(p.x, p.y, 2 + i * .25, 0, 7); ctx.fill();
        });
        const pr = 18 + glow * .22;
        const pg = ctx.createRadialGradient(player.x, player.y, 0, player.x, player.y, pr);
        pg.addColorStop(0, 'rgba(255,250,220,1)');
        pg.addColorStop(.3, 'rgba(244,211,94,.8)');
        pg.addColorStop(1, 'rgba(255,140,66,0)');
        ctx.fillStyle = pg; ctx.beginPath(); ctx.arc(player.x, player.y, pr, 0, 7); ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';
      if (visible) {
        const ang = Math.atan2(player.vy, player.vx || .001);
        ctx.save(); ctx.translate(player.x, player.y); ctx.rotate(ang);
        const wf = Math.abs(Math.sin(t * 30)) * 5 + 3;
        ctx.fillStyle = 'rgba(220,235,255,.45)';
        ctx.beginPath(); ctx.ellipse(-1, -wf, 5, wf * .9, -.3, 0, 7); ctx.ellipse(-1, wf, 5, wf * .9, .3, 0, 7); ctx.fill();
        ctx.fillStyle = '#2b2118'; ctx.beginPath(); ctx.ellipse(3, 0, 4, 3, 0, 0, 7); ctx.fill();
        ctx.restore();
      }
      for (const q of pows) {
        const blink = q.age > 7 && Math.sin(q.age * 20) < 0 ? .35 : 1;
        const col = q.kind === 'schild' ? '124,198,254' : '179,146,240';
        const qg = ctx.createRadialGradient(q.x, q.y, 0, q.x, q.y, 26);
        qg.addColorStop(0, `rgba(${col},${.9 * blink})`); qg.addColorStop(1, `rgba(${col},0)`);
        ctx.fillStyle = qg; ctx.beginPath(); ctx.arc(q.x, q.y, 26, 0, 7); ctx.fill();
        ctx.globalAlpha = blink; ctx.fillStyle = '#070b17'; ctx.font = '700 15px "Atkinson Hyperlegible", sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(q.kind === 'schild' ? 'S' : 'M', q.x, q.y + 1);
        ctx.globalAlpha = 1;
      }
      if (shield) { ctx.strokeStyle = 'rgba(124,198,254,.8)'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(player.x, player.y, 24 + Math.sin(t * 6) * 2, 0, 7); ctx.stroke(); }
      if (magT > 0) { ctx.strokeStyle = 'rgba(179,146,240,.35)'; ctx.setLineDash([4, 8]); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(player.x, player.y, 240, 0, 7); ctx.stroke(); ctx.setLineDash([]); }
      for (const b of bats) drawBat(b, false);
      for (const o of owls) {
        if (o.phase === 'fly') { drawOwl(o, false); continue; }
        const pulse = .5 + .5 * Math.sin(o.t * 18);
        ctx.strokeStyle = `rgba(229,72,77,${.4 + pulse * .5})`; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(o.tx, o.ty, 18 + pulse * 8, 0, 7); ctx.stroke();
        const ex = o.tx - Math.cos(o.a) * 60, ey = o.ty - Math.sin(o.a) * 60;
        ctx.setLineDash([6, 6]); ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo(o.tx, o.ty); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = `rgba(229,72,77,${.6 + pulse * .4})`; ctx.font = '700 22px "Atkinson Hyperlegible", sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('!', ex, ey);
      }
      if (combo > 1) {
        ctx.font = '700 15px "Atkinson Hyperlegible", system-ui, sans-serif';
        ctx.fillStyle = `rgba(244,211,94,${Math.min(1, comboT)})`;
        ctx.textAlign = 'center';
        ctx.fillText('x' + Math.min(combo, 8), player.x, player.y - 28);
      }
    }

    return { update, draw, resize, idle(dt) { t += dt * .3; } };
  }
});
