GAMES.push({
  id: 'lantaarnman',
  name: 'Lantaarnman',
  color: '#ffb347',
  music: { bpm: 76, root: 55, scale: 'minor', prog: [0, 3, 5, 4], pad: 'sine', lead: 'triangle', every: 4, pat: [0, 1, 2, 4], cut: 1600 },
  blurb: 'Je bent de lantaarnaansteker van de stad. Houd de lantaarns brandend, want als er 3 tegelijk uit zijn wordt het te donker.',
  how: [
    'Pijltjes of A en D om te lopen. Spatie of pijltje omhoog om de lantaarn boven je aan te steken',
    'Muis of vinger: tik op een lantaarn, dan loopt de lantaarnman erheen en steekt hem aan',
    'Hoe lager een lantaarn brandt, hoe meer punten het aansteken oplevert. Een gedoofde lantaarn geeft dubbel',
    'Elke 30 seconden een level: meer lantaarns, vanaf level 3 windvlagen, vanaf level 5 een schaduw die lantaarns uitblaast'
  ],
  touch: [
    { side: 'l', key: 'arrowleft', label: '\u2190', aria: 'Naar links' },
    { side: 'l', key: 'arrowright', label: '\u2192', aria: 'Naar rechts' },
    { side: 'r', key: ' ', label: 'Aansteken' }
  ],

  thumb(c, w, h) {
    const g = c.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#0b1230'); g.addColorStop(1, '#151a2e');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    c.fillStyle = '#0a0e1c';
    [[0, 70, 50], [45, 50, 40], [80, 80, 60], [135, 40, 45], [175, 65, 55], [225, 45, 40], [260, 75, 60]].forEach(([x, y, bw]) => c.fillRect(x, y, bw, h - y));
    c.fillStyle = '#f4d35e'; [[20, 90], [60, 70], [100, 100], [190, 85], [240, 60], [280, 95]].forEach(([x, y]) => c.fillRect(x, y, 5, 6));
    c.fillStyle = '#1c2236'; c.fillRect(0, h - 28, w, 28);
    [60, 160, 260].forEach((x, i) => {
      const on = i !== 1;
      if (on) { const rg = c.createRadialGradient(x, h - 92, 0, x, h - 92, 60); rg.addColorStop(0, 'rgba(255,179,71,.55)'); rg.addColorStop(1, 'rgba(255,179,71,0)'); c.fillStyle = rg; c.beginPath(); c.arc(x, h - 92, 60, 0, 7); c.fill(); }
      c.fillStyle = '#2a2f40'; c.fillRect(x - 2, h - 90, 4, 62);
      c.fillStyle = on ? '#ffd27a' : '#3a4050'; c.fillRect(x - 7, h - 102, 14, 14);
    });
    c.fillStyle = '#e8efe4'; c.fillRect(118, h - 50, 10, 22); c.fillStyle = '#070b17'; c.fillRect(115, h - 56, 16, 6);
  },

  create(A) {
    const ctx = A.ctx, rand = A.rand, MAXOUT = 3;
    const NEWS = { 2: 'Lantaarns branden sneller op', 3: 'Windvlagen blazen lantaarns uit', 5: 'Pas op: een schaduw blaast lantaarns uit', 7: 'De nacht wordt langer: alles sneller' };
    const coarse = matchMedia('(pointer: coarse)').matches;
    let W = 0, H = 0, groundY = 0, postH = 120, city = null;
    let lanterns = [], t = 0, level = 1, score = 0, dead = false, deadT = 0, ended = false;
    let gusts = [], gustT = 6, shadow = null, shadowT = 4, parts = [], floats = [], target = null;
    const man = { x: 0, face: 1, walk: 0, lightT: 0, stunT: 0 };

    const maxFit = () => Math.max(4, Math.floor((W - 60) / 70));
    const wantCount = () => Math.min(maxFit(), 5 + Math.floor((level - 1) / 2) + (level >= 7 ? 1 : 0));
    const lampY = () => groundY - postH;

    function buildCity() {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      city = document.createElement('canvas');
      city.width = Math.max(1, W * dpr); city.height = Math.max(1, H * dpr);
      const b = city.getContext('2d'); b.scale(dpr, dpr);
      const g = b.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#0b1230'); g.addColorStop(1, '#1a1f36');
      b.fillStyle = g; b.fillRect(0, 0, W, H);
      for (let i = 0; i < W * H / 3500; i++) { b.fillStyle = `rgba(230,240,255,${Math.random() * .6 + .1})`; b.fillRect(Math.random() * W, Math.random() * groundY * .6, 1.3, 1.3); }
      b.fillStyle = 'rgba(240,235,200,.9)'; b.beginPath(); b.arc(W * .15, H * .14, 22, 0, 7); b.fill();
      for (const [col, hMin, hMax, lit] of [['#0f1428', .25, .5, .05], ['#0a0e1c', .15, .38, .12]]) {
        let x = -10;
        while (x < W) {
          const bw = rand(36, 80), bh = groundY * rand(hMin, hMax);
          b.fillStyle = col; b.fillRect(x, groundY - bh, bw, bh);
          for (let wy = groundY - bh + 10; wy < groundY - 14; wy += 16) for (let wx = x + 6; wx < x + bw - 8; wx += 13) {
            if (Math.random() < lit) { b.fillStyle = 'rgba(244,211,94,.75)'; b.fillRect(wx, wy, 5, 7); b.fillStyle = col; }
          }
          x += bw + rand(0, 6);
        }
      }
      b.fillStyle = '#1c2236'; b.fillRect(0, groundY, W, H - groundY);
      b.fillStyle = '#242b42';
      for (let y = groundY + 6; y < H; y += 12) for (let x = ((y / 12) % 2) * 14; x < W; x += 28) b.fillRect(x, y, 22, 6);
    }
    function placeLanterns(n) {
      const old = lanterns;
      lanterns = [];
      for (let i = 0; i < n; i++) {
        const prev = old[i];
        lanterns.push({ x: 40 + (W - 80) * (i + .5) / n, fuel: prev ? prev.fuel : rand(.65, 1), rate: prev ? prev.rate : rand(.7, 1.3), flash: 0, outT: 0 });
      }
    }
    function layout() {
      W = A.W; H = A.H;
      groundY = H - (coarse ? 104 : 56);
      postH = Math.max(80, Math.min(150, groundY * .38));
      buildCity();
      placeLanterns(lanterns.length || 5);
      man.x = Math.min(Math.max(man.x || W / 2, 12), W - 12);
    }
    layout();

    function nearest(x, within) {
      let best = null, bd = within;
      for (const l of lanterns) { const d = Math.abs(l.x - x); if (d < bd) { bd = d; best = l; } }
      return best;
    }
    function light(l) {
      if (!l || l.fuel > .97) return;
      const pts = Math.round(5 + (1 - l.fuel) * 25) * level * (l.fuel <= 0 ? 2 : 1);
      score += pts; l.fuel = 1; l.flash = .5; man.lightT = .3;
      floats.push({ x: l.x, y: lampY() - 26, text: '+' + pts, age: 0 });
      A.sound(500 + Math.min(pts, 200) * 2, .15, 'triangle', .07, 300);
    }
    function burst(x, y, color, n = 10) {
      if (A.reduce) n = 3;
      for (let i = 0; i < n; i++) { const a = rand(0, 7), s = rand(30, 140); parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 40, life: rand(.3, .8), age: 0, color }); }
    }

    function update(dt) {
      t += dt;
      const lv = 1 + Math.floor(t / 30);
      if (lv !== level) {
        level = lv;
        A.level(level, NEWS[level] || 'Alles brandt sneller op');
        if (wantCount() > lanterns.length) placeLanterns(wantCount());
      }
      for (let i = parts.length - 1; i >= 0; i--) { const p = parts[i]; p.age += dt; if (p.age > p.life) { parts.splice(i, 1); continue; } p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 120 * dt; }
      for (let i = floats.length - 1; i >= 0; i--) { const f = floats[i]; f.age += dt; f.y -= 30 * dt; if (f.age > 1) floats.splice(i, 1); }
      if (dead) { deadT += dt; if (deadT > 1.2 && !ended) { ended = true; A.score(score); A.end(); } return; }

      const P = A.pointer;
      man.stunT = Math.max(0, man.stunT - dt);
      man.lightT = Math.max(0, man.lightT - dt);
      if (P.tap) {
        const l = nearest(P.x, 60);
        target = l ? { x: l.x, lamp: l } : { x: P.x, lamp: null };
      }
      let dir = 0;
      if (A.key('arrowleft', 'a')) dir--;
      if (A.key('arrowright', 'd')) dir++;
      if (dir) target = null;
      if (!dir && target) {
        const dx = target.x - man.x;
        if (Math.abs(dx) < 6) { if (target.lamp) light(target.lamp); target = null; }
        else dir = Math.sign(dx);
      }
      const speed = man.stunT > 0 || man.lightT > 0 ? 0 : 270;
      if (dir && speed) { man.x += dir * speed * dt; man.face = dir; man.walk += dt * 10; }
      man.x = Math.max(12, Math.min(W - 12, man.x));
      if (A.hit(' ', 'arrowup', 'w', 'enter')) light(nearest(man.x, 34));

      const drain = (.055 + (level - 1) * .012) * (level >= 7 ? 1.3 : 1);
      let out = 0, sum = 0;
      for (const l of lanterns) {
        l.flash = Math.max(0, l.flash - dt);
        if (l.fuel > 0) {
          l.fuel -= drain * l.rate * dt;
          if (l.fuel <= 0) { l.fuel = 0; A.sound(180, .3, 'sine', .06, -80); A.vibrate(60); burst(l.x, lampY(), '#5d6772', 8); }
        }
        if (l.fuel <= 0) out++;
        sum += l.fuel;
      }

      if (level >= 3) {
        gustT -= dt;
        if (gustT <= 0) {
          const lit = lanterns.filter(l => l.fuel > .1);
          if (lit.length) gusts.push({ l: lit[Math.floor(Math.random() * lit.length)], t: 0 });
          gustT = Math.max(2, rand(4, 7) - (level - 3) * .35);
        }
      }
      for (let i = gusts.length - 1; i >= 0; i--) {
        const g = gusts[i]; g.t += dt;
        if (g.t > .9) { g.l.fuel = Math.max(0, g.l.fuel - .5); A.sound(260, .4, 'sawtooth', .03, -150); gusts.splice(i, 1); }
      }
      if (level >= 5) {
        if (!shadow) {
          shadowT -= dt;
          if (shadowT <= 0) { const left = Math.random() < .5; shadow = { x: left ? -20 : W + 20, dir: left ? 1 : -1, sp: 80 + level * 8, hit: new Set(), touched: false }; }
        } else {
          shadow.x += shadow.dir * shadow.sp * dt;
          for (const l of lanterns) if (!shadow.hit.has(l) && Math.abs(l.x - shadow.x) < 10 && l.fuel > 0) { shadow.hit.add(l); l.fuel = Math.max(0, l.fuel - .6); burst(l.x, lampY(), '#5d6772', 6); }
          if (!shadow.touched && Math.abs(shadow.x - man.x) < 18) { shadow.touched = true; man.stunT = 1.2; A.vibrate(80); A.sound(150, .3, 'square', .05, -60); }
          if (shadow.x < -40 || shadow.x > W + 40) { shadow = null; shadowT = rand(3, 6); }
        }
      }

      score += dt * level * .5;
      if (out >= MAXOUT) { dead = true; deadT = 0; A.vibrate(200); A.sound(120, .8, 'sawtooth', .07, -60); }
      A.meter(lanterns.length ? sum / lanterns.length : 0, 'Licht');
      A.score(score);
      A.info('Uit: ' + out + '/' + MAXOUT);
    }

    function draw() {
      ctx.drawImage(city, 0, 0, W, H);
      const lit = lanterns.reduce((s, l) => s + l.fuel, 0) / Math.max(1, lanterns.length);
      ctx.fillStyle = `rgba(3,5,12,${.55 - lit * .35})`; ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'lighter';
      for (const l of lanterns) {
        if (l.fuel <= 0) continue;
        const flick = l.fuel < .25 ? .6 + .4 * Math.abs(Math.sin(t * 17 + l.x)) : 1;
        const r = 50 + l.fuel * 130, a = (.25 + l.fuel * .4) * flick;
        const g = ctx.createRadialGradient(l.x, lampY(), 0, l.x, lampY(), r);
        g.addColorStop(0, `rgba(255,179,71,${a})`); g.addColorStop(1, 'rgba(255,179,71,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(l.x, lampY(), r, 0, 7); ctx.fill();
        const pool = ctx.createRadialGradient(l.x, groundY, 0, l.x, groundY, r * .8);
        pool.addColorStop(0, `rgba(255,179,71,${a * .45})`); pool.addColorStop(1, 'rgba(255,179,71,0)');
        ctx.fillStyle = pool; ctx.fillRect(l.x - r, groundY - 4, r * 2, H - groundY + 4);
      }
      ctx.globalCompositeOperation = 'source-over';
      for (const l of lanterns) {
        const y = lampY();
        ctx.fillStyle = '#2a2f40'; ctx.fillRect(l.x - 2.5, y + 10, 5, groundY - y - 10);
        ctx.fillRect(l.x - 8, groundY - 6, 16, 6);
        ctx.fillStyle = '#3a4258'; rrect(ctx, l.x - 11, y - 12, 22, 24, 4); ctx.fill();
        ctx.fillStyle = l.fuel > 0 ? (l.flash > 0 ? '#ffffff' : '#ffd27a') : '#222838';
        rrect(ctx, l.x - 7, y - 8, 14, 16, 3); ctx.fill();
        if (l.fuel > 0) {
          const fh = 4 + l.fuel * 6 + Math.sin(t * 20 + l.x) * 1.2;
          ctx.fillStyle = '#ff8c42'; ctx.beginPath(); ctx.ellipse(l.x, y + 4 - fh / 2, 3, fh / 2, 0, 0, 7); ctx.fill();
        }
        ctx.fillStyle = '#2a2f40'; ctx.beginPath(); ctx.moveTo(l.x - 13, y - 12); ctx.lineTo(l.x, y - 20); ctx.lineTo(l.x + 13, y - 12); ctx.fill();
        ctx.fillStyle = 'rgba(232,239,228,.15)'; ctx.fillRect(l.x - 14, y + 18, 28, 4);
        ctx.fillStyle = l.fuel < .25 ? '#e5484d' : '#9ef0c8'; ctx.fillRect(l.x - 14, y + 18, 28 * l.fuel, 4);
      }
      for (const g of gusts) {
        const y = lampY();
        ctx.strokeStyle = `rgba(200,220,255,${.3 + .4 * Math.sin(g.t * 12)})`; ctx.lineWidth = 2;
        for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.arc(g.l.x, y, 18 + k * 7, g.t * 8 + k, g.t * 8 + k + 2.2); ctx.stroke(); }
      }
      if (shadow) {
        const x = shadow.x, y = groundY;
        ctx.fillStyle = 'rgba(5,6,12,.92)';
        ctx.beginPath(); ctx.ellipse(x, y - 26, 12, 26, 0, 0, 7); ctx.fill();
        ctx.beginPath(); ctx.arc(x, y - 56, 10, 0, 7); ctx.fill();
        ctx.fillStyle = '#e5484d'; ctx.fillRect(x - 5 + shadow.dir * 2, y - 58, 3, 3); ctx.fillRect(x + 2 + shadow.dir * 2, y - 58, 3, 3);
      }
      const mx = man.x, my = groundY, step = Math.sin(man.walk) * 4;
      if (!(man.stunT > 0 && Math.floor(man.stunT * 10) % 2 === 0)) {
        ctx.save(); ctx.translate(mx, my); ctx.scale(man.face, 1);
        ctx.fillStyle = '#2b3550'; ctx.fillRect(-6 + step * .5, -16, 5, 16); ctx.fillRect(1 - step * .5, -16, 5, 16);
        ctx.fillStyle = '#4a5a80'; rrect(ctx, -9, -40, 18, 26, 5); ctx.fill();
        ctx.fillStyle = '#f2c7a0'; ctx.beginPath(); ctx.arc(0, -47, 7, 0, 7); ctx.fill();
        ctx.fillStyle = '#151a2e'; ctx.fillRect(-9, -53, 18, 3); ctx.fillRect(-6, -63, 12, 11);
        const reach = man.lightT > 0 ? -postH + 50 : -70;
        ctx.strokeStyle = '#8a6a48'; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.moveTo(6, -32); ctx.lineTo(12, reach); ctx.stroke();
        ctx.fillStyle = '#ffb347'; ctx.beginPath(); ctx.arc(12, reach, 3 + Math.sin(t * 25), 0, 7); ctx.fill();
        ctx.restore();
      }
      for (const p of parts) { ctx.globalAlpha = 1 - p.age / p.life; ctx.fillStyle = p.color; ctx.fillRect(p.x - 2, p.y - 2, 4, 4); }
      ctx.globalAlpha = 1;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = '700 15px "Atkinson Hyperlegible", sans-serif';
      for (const f of floats) { ctx.globalAlpha = 1 - f.age; ctx.fillStyle = '#ffd27a'; ctx.fillText(f.text, f.x, f.y); }
      ctx.globalAlpha = 1;
    }

    return { update, draw, resize: layout, idle(dt) { t += 0; } };
  }
});
