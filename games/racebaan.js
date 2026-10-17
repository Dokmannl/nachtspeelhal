GAMES.push({
  id: 'racebaan',
  name: 'Racebaan',
  color: '#ff8c42',
  music: { bpm: 126, root: 52, scale: 'minor', prog: [0, 5, 6, 4], pad: 'sawtooth', lead: 'sawtooth', every: 2, pat: [0, 2, 3, 2], cut: 1100 },
  blurb: 'Scheur over de nachtelijke snelweg, slinger tussen het verkeer door en pak de munten.',
  how: [
    'Pijltjes of A en D om te sturen. Muis of vinger: je auto rijdt naar je wijzer',
    'Spatie (of de Turbo-knop) = turbo: even extra snel en dubbele punten. Het balkje laadt vanzelf weer op',
    'De weg heeft bochten. Elke 30 seconden een nieuw level: harder, drukker en scherpere bochten',
    'Level 3: auto\'s wisselen van rijstrook (let op het knipperlicht). Level 5: vrachtwagens. Level 7: olievlekken',
    'E\u00e9n botsing en de race is voorbij'
  ],
  touch: [
    { side: 'l', key: 'arrowleft', label: '\u2190', aria: 'Naar links' },
    { side: 'l', key: 'arrowright', label: '\u2192', aria: 'Naar rechts' },
    { side: 'r', key: ' ', label: 'Turbo' }
  ],

  thumb(c, w, h) {
    c.fillStyle = '#10261c'; c.fillRect(0, 0, w, h);
    c.fillStyle = '#262a34'; c.fillRect(90, 0, 140, h);
    for (let y = 0; y < h; y += 20) {
      c.fillStyle = (y / 20) % 2 ? '#e8efe4' : '#e5484d';
      c.fillRect(84, y, 6, 20); c.fillRect(230, y, 6, 20);
      c.fillStyle = 'rgba(232,239,228,.5)'; c.fillRect(135, y + 4, 3, 10); c.fillRect(182, y + 4, 3, 10);
    }
    const car = (x, y, col, len) => { c.fillStyle = col; rrect(c, x - 11, y - 20, 22, len || 40, 6); c.fill(); c.fillStyle = 'rgba(10,15,25,.7)'; c.fillRect(x - 8, y - 10, 16, 8); };
    car(160, 140, '#ff8c42'); car(113, 30, '#8a96a3', 70); car(207, 90, '#b392f0');
    c.fillStyle = 'rgba(5,5,10,.8)'; c.beginPath(); c.ellipse(207, 30, 14, 8, 0, 0, 7); c.fill();
    c.fillStyle = '#f4d35e'; c.beginPath(); c.arc(160, 70, 6, 0, 7); c.fill();
  },

  create(A) {
    const ctx = A.ctx, rand = A.rand, CW = 34, CH = 62, TH = 112;
    const TRAFFIC = ['#7cc6fe', '#b392f0', '#9ef0c8', '#e8efe4', '#f78fb3', '#e5484d'];
    const NEWS = { 2: 'Meer verkeer', 3: 'Auto\'s wisselen van rijstrook', 5: 'Pas op voor vrachtwagens', 7: 'Olievlekken op de weg' };
    let W = 0, H = 0, road = { x: 0, w: 0 }, lanes = 3, laneW = 0;
    let carX = 0, carVX = 0, speed = 260, off = 0, distPts = 0, coinPts = 0, t = 0, lastLv = 1;
    let traffic = [], coins = [], oils = [], parts = [], spawnT = 1.2, coinT = 2, oilT = 3;
    let crashed = false, crashT = 0, ended = false, tilt = 0, slideT = 0, slideDir = 1;
    let dist = 0, turbo = 1, turboOn = false, ampMax = 40, amp = 14, spd = 260;
    const curveX = y => { const wy = dist + (H - y); return amp * (Math.sin(wy * .0016) * .7 + Math.sin(wy * .0041) * .3); };

    const level = () => 1 + Math.floor(t / 30);
    const carY = () => H - CH - 30;
    const laneX = (lp, y) => road.x + laneW * (lp + .5) + curveX(y);
    function resize() {
      W = A.W; H = A.H;
      ampMax = Math.min(60, W * .12);
      const rw = Math.min(W - 40 - ampMax * 2, 440);
      lanes = rw >= 330 ? 4 : 3;
      road = { x: (W - rw) / 2, w: rw };
      laneW = rw / lanes;
      for (const c of traffic) { c.lane = Math.min(c.lane, lanes - 1); c.lp = Math.min(c.lp, lanes - 1); }
      for (const c of coins) c.lane = Math.min(c.lane, lanes - 1);
      for (const o of oils) o.lane = Math.min(o.lane, lanes - 1);
      carX = Math.max(road.x + CW / 2 + 4, Math.min(road.x + road.w - CW / 2 - 4, carX || W / 2));
    }
    resize();
    carX = W / 2;

    function burst(x, y) {
      const n = A.reduce ? 8 : 30;
      for (let i = 0; i < n; i++) {
        const a = rand(0, 7), s = rand(60, 320);
        parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: rand(.4, 1), age: 0, color: Math.random() < .5 ? '#ff8c42' : '#f4d35e' });
      }
    }

    function update(dt) {
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i]; p.age += dt;
        if (p.age > p.life) { parts.splice(i, 1); continue; }
        p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= .95; p.vy *= .95;
      }
      if (crashed) {
        crashT += dt;
        if (crashT > 1 && !ended) { ended = true; A.end(); }
        return;
      }
      t += dt;
      const lv = level();
      if (lv !== lastLv) { lastLv = lv; A.level(lv, NEWS[lv] || 'Nog harder en drukker'); }
      speed = Math.min(980, 250 + t * 7 + (lv - 1) * 25);
      amp = Math.min(ampMax, 14 + (lv - 1) * 8);
      turboOn = A.key(' ') && turbo > .02;
      turbo = Math.max(0, Math.min(1, turbo + (turboOn ? -.35 : .12) * dt));
      spd = speed * (turboOn ? 1.45 : 1);
      A.meter(turbo, 'Turbo');

      const P = A.pointer, steer = 300 + speed * .35;
      slideT = Math.max(0, slideT - dt);
      let dir = 0;
      if (A.key('arrowleft', 'a')) dir--;
      if (A.key('arrowright', 'd')) dir++;
      if (slideT > 0) carVX = slideDir * steer * .55;
      else if (dir) carVX = dir * steer;
      else if (P.seen && (P.type === 'mouse' || P.down)) carVX = Math.max(-steer, Math.min(steer, (P.x - carX) * 8));
      else carVX *= Math.pow(.001, dt);
      carX += carVX * dt;
      const cxo = curveX(carY() + CH / 2);
      const minX = road.x + cxo + CW / 2 + 4, maxX = road.x + cxo + road.w - CW / 2 - 4;
      if (carX < minX || carX > maxX) { carX = Math.max(minX, Math.min(maxX, carX)); if (slideT > 0) slideDir = -slideDir; }
      const tiltTarget = slideT > 0 ? Math.sin(t * 25) * .35 : (carVX / steer) * .12;
      tilt += (tiltTarget - tilt) * Math.min(1, dt * 10);

      off = (off + spd * dt) % 1200;
      dist += spd * dt;
      distPts += spd * dt / 25 * (1 + (lv - 1) * .25) * (turboOn ? 2 : 1);

      spawnT -= dt;
      if (spawnT <= 0) {
        const topBusy = new Set(traffic.filter(c => c.y < TH * 2.2).map(c => c.lane));
        if (topBusy.size < lanes - 1) {
          const free = [...Array(lanes).keys()].filter(l => !topBusy.has(l));
          const lane = free[Math.floor(Math.random() * free.length)];
          const truck = lv >= 5 && Math.random() < .22;
          let v = speed * rand(.3, .6);
          for (const c of traffic) if (c.lane === lane) v = Math.max(v, c.v);
          const changer = !truck && lv >= 3 && Math.random() < Math.min(.45, .15 + (lv - 3) * .05);
          traffic.push({
            lane, lp: lane, y: -(truck ? TH : CH) - 10, v, h: truck ? TH : CH, truck,
            color: truck ? '#8a96a3' : TRAFFIC[Math.floor(Math.random() * TRAFFIC.length)],
            changer, signal: 0, to: null
          });
        }
        spawnT = Math.max(.28, 1.1 - (lv - 1) * .1 - t * .004) * rand(.7, 1.3);
      }
      coinT -= dt;
      if (coinT <= 0) {
        const lane = Math.floor(Math.random() * lanes);
        const n = 3 + Math.floor(Math.random() * 3);
        for (let i = 0; i < n; i++) coins.push({ lane, y: -20 - i * 46 });
        coinT = rand(1.8, 3.2);
      }
      if (lv >= 7) {
        oilT -= dt;
        if (oilT <= 0) { oils.push({ lane: Math.floor(Math.random() * lanes), y: -40 }); oilT = Math.max(1.2, 4 - (lv - 7) * .4) * rand(.7, 1.3); }
      }

      const cy = carY();
      for (let i = traffic.length - 1; i >= 0; i--) {
        const c = traffic[i];
        c.y += (spd - c.v) * dt;
        if (c.changer && c.to === null && c.y > H * .12) {
          const opts = [c.lane - 1, c.lane + 1].filter(l => l >= 0 && l < lanes);
          c.to = opts[Math.floor(Math.random() * opts.length)];
          c.signal = .7;
        }
        if (c.to !== null) {
          if (c.signal > 0) c.signal -= dt;
          else {
            const d = c.to - c.lp, st = 1.6 * dt;
            c.lp = Math.abs(d) <= st ? c.to : c.lp + Math.sign(d) * st;
            if (c.lp === c.to) { c.lane = c.to; c.changer = false; }
          }
        }
        if (c.y > H + 40) { traffic.splice(i, 1); continue; }
        const x = laneX(c.lp, c.y + c.h / 2), w = c.truck ? CW + 6 : CW;
        if (Math.abs(x - carX) < (w + CW) / 2 - 6 && c.y < cy + CH - 6 && c.y + c.h > cy + 6) {
          crashed = true; burst(carX, cy + 10); A.vibrate(250);
          A.sound(120, .6, 'sawtooth', .09, -80);
        }
      }
      for (let i = coins.length - 1; i >= 0; i--) {
        const c = coins[i];
        c.y += spd * dt;
        if (c.y > H + 20) { coins.splice(i, 1); continue; }
        if (Math.abs(laneX(c.lane, c.y) - carX) < CW / 2 + 8 && c.y > cy - 8 && c.y < cy + CH + 8) {
          coinPts += 25 * lv; coins.splice(i, 1);
          A.sound(990, .08, 'square', .04);
        }
      }
      for (let i = oils.length - 1; i >= 0; i--) {
        const o = oils[i];
        o.y += spd * dt;
        if (o.y > H + 40) { oils.splice(i, 1); continue; }
        if (slideT <= 0 && Math.abs(laneX(o.lane, o.y) - carX) < 26 && Math.abs(o.y - (cy + CH / 2)) < CH / 2 + 8) {
          slideT = .9; slideDir = Math.random() < .5 ? -1 : 1; A.vibrate(40);
          A.sound(300, .5, 'sine', .06, -200);
        }
      }

      A.score(distPts + coinPts);
      A.info(Math.round(spd / 3.6) + ' km/u' + (turboOn ? ' \u00b7 TURBO' : '') + (slideT > 0 ? ' \u00b7 slippen!' : ''));
    }

    function drawCar(x, y, col, me, len, truck, signal) {
      const h = len || CH, w = truck ? CW + 6 : CW;
      ctx.save(); ctx.translate(x, y + h / 2);
      if (me) ctx.rotate(tilt);
      ctx.fillStyle = 'rgba(0,0,0,.35)'; rrect(ctx, -w / 2 + 3, -h / 2 + 5, w, h, 8); ctx.fill();
      if (truck) {
        ctx.fillStyle = '#5d6772'; rrect(ctx, -w / 2, -h / 2 + 30, w, h - 30, 4); ctx.fill();
        ctx.fillStyle = '#c9d1d9'; ctx.fillRect(-w / 2 + 3, -h / 2 + 34, w - 6, h - 40);
        ctx.fillStyle = col; rrect(ctx, -w / 2 + 2, -h / 2, w - 4, 28, 6); ctx.fill();
        ctx.fillStyle = 'rgba(8,12,22,.75)'; rrect(ctx, -w / 2 + 6, -h / 2 + 14, w - 12, 10, 3); ctx.fill();
        ctx.fillStyle = '#e5484d'; ctx.fillRect(-w / 2 + 3, h / 2 - 4, 7, 3); ctx.fillRect(w / 2 - 10, h / 2 - 4, 7, 3);
      } else {
        ctx.fillStyle = col; rrect(ctx, -w / 2, -h / 2, w, h, 8); ctx.fill();
        ctx.fillStyle = 'rgba(8,12,22,.75)';
        rrect(ctx, -w / 2 + 5, -h / 2 + (me ? 12 : 30), w - 10, 12, 3); ctx.fill();
        rrect(ctx, -w / 2 + 5, -h / 2 + (me ? 36 : 10), w - 10, 9, 3); ctx.fill();
        if (me) {
          ctx.fillStyle = '#fff6c8'; ctx.fillRect(-w / 2 + 4, -h / 2, 7, 3); ctx.fillRect(w / 2 - 11, -h / 2, 7, 3);
          ctx.fillStyle = 'rgba(7,11,23,.5)'; ctx.fillRect(-2, -h / 2 + 2, 4, h - 4);
        } else {
          ctx.fillStyle = '#e5484d'; ctx.fillRect(-w / 2 + 4, h / 2 - 3, 7, 3); ctx.fillRect(w / 2 - 11, h / 2 - 3, 7, 3);
        }
      }
      if (signal && Math.sin(t * 22) > 0) {
        ctx.fillStyle = '#ffb000'; ctx.shadowColor = '#ffb000'; ctx.shadowBlur = 10;
        const sx = signal < 0 ? -w / 2 - 2 : w / 2 - 3;
        ctx.fillRect(sx, -h / 2 + 2, 5, 6); ctx.fillRect(sx, h / 2 - 8, 5, 6);
        ctx.shadowBlur = 0;
      }
      ctx.restore();
    }

    function draw() {
      ctx.fillStyle = '#0f2419'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#12301f';
      for (let y = (off % 120) - 120; y < H; y += 120) ctx.fillRect(0, y, W, 60);
      ctx.fillStyle = '#0b1a12';
      for (let i = 0; i < 14; i++) {
        const side = i % 2 ? road.x + road.w + 30 + (i * 37) % 60 : road.x - 30 - (i * 53) % 60;
        const y = ((i * 97 + off) % (H + 80)) - 40;
        ctx.beginPath(); ctx.arc(side, y, 14 + (i % 3) * 5, 0, 7); ctx.fill();
      }

      for (let y = 0; y < H; y += 4) {
        const rx = road.x + curveX(y + 2);
        ctx.fillStyle = '#262a34'; ctx.fillRect(rx, y, road.w, 4.5);
        ctx.fillStyle = ((Math.floor((y - off) / 40) % 2) + 2) % 2 === 0 ? '#e5484d' : '#e8efe4';
        ctx.fillRect(rx - 7, y, 7, 4.5); ctx.fillRect(rx + road.w, y, 7, 4.5);
        if ((((y - off) % 60) + 60) % 60 < 30) {
          ctx.fillStyle = 'rgba(232,239,228,.55)';
          for (let l = 1; l < lanes; l++) ctx.fillRect(rx + laneW * l - 1.5, y, 3, 4.5);
        }
      }

      for (const o of oils) {
        const x = laneX(o.lane, o.y);
        ctx.fillStyle = 'rgba(5,5,10,.85)'; ctx.beginPath(); ctx.ellipse(x, o.y, 22, 13, 0, 0, 7); ctx.fill();
        ctx.fillStyle = 'rgba(124,198,254,.18)'; ctx.beginPath(); ctx.ellipse(x - 5, o.y - 3, 9, 4, -.3, 0, 7); ctx.fill();
      }
      for (const c of coins) {
        const x = laneX(c.lane, c.y), sq = Math.abs(Math.sin(t * 6 + c.y * .02));
        ctx.fillStyle = '#f4d35e'; ctx.beginPath(); ctx.ellipse(x, c.y, 8 * sq + 2, 9, 0, 0, 7); ctx.fill();
      }
      for (const c of traffic) {
        const signal = c.to !== null && c.lp !== c.to ? Math.sign(c.to - c.lp) : 0;
        drawCar(laneX(c.lp, c.y + c.h / 2), c.y, c.color, false, c.h, c.truck, signal);
      }

      const cy = carY();
      if (turboOn && !crashed) {
        ctx.fillStyle = 'rgba(255,140,66,.55)';
        for (let i = 0; i < 3; i++) ctx.fillRect(carX - 10 + i * 8 + Math.random() * 2, cy + CH, 4, 14 + Math.random() * 18);
      }
      if (!crashed) {
        const lg = ctx.createLinearGradient(0, cy - 140, 0, cy);
        lg.addColorStop(0, 'rgba(255,246,200,0)'); lg.addColorStop(1, 'rgba(255,246,200,.18)');
        ctx.fillStyle = lg;
        ctx.beginPath(); ctx.moveTo(carX - 12, cy); ctx.lineTo(carX - 40, cy - 140); ctx.lineTo(carX + 40, cy - 140); ctx.lineTo(carX + 12, cy); ctx.fill();
      }
      drawCar(carX, cy, crashed ? '#7a4a30' : '#ff8c42', true);
      for (const p of parts) { ctx.globalAlpha = 1 - p.age / p.life; ctx.fillStyle = p.color; ctx.fillRect(p.x - 2, p.y - 2, 4, 4); }
      ctx.globalAlpha = 1;
    }

    return { update, draw, resize, idle(dt) { off = (off + 120 * dt) % 1200; } };
  }
});
