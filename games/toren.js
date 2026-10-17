GAMES.push({
  id: 'toren',
  name: 'Torenbouwer',
  color: '#f78fb3',
  music: { bpm: 84, root: 62, scale: 'major', prog: [0, 5, 3, 4], pad: 'sine', lead: 'sine', every: 4, pat: [0, 1, 2, 3], cut: 2400 },
  blurb: 'Stapel blokken zo hoog als je kunt. Wat over de rand steekt, valt eraf.',
  how: [
    'Spatie, Enter of tikken laat het blok vallen',
    'Gouden blok = dubbele punten, precies goed geplaatst zelfs driedubbel',
    'Mis je de toren helemaal, dan is het spel voorbij',
    'Precies op elkaar = perfect: 3 keer perfect op rij maakt je blok weer breder',
    'Elke 10 blokken een level: sneller, vanaf level 3 van twee kanten, level 5 wisselende snelheid, level 7 wind'
  ],
  touch: null,

  thumb(c, w, h) {
    const g = c.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#1a1236'); g.addColorStop(1, '#0b1020');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    const ws = [110, 104, 104, 92, 92, 80, 80, 76];
    let x = 105;
    ws.forEach((bw, i) => {
      x += (i % 2 ? 4 : -2);
      c.fillStyle = `hsl(${330 + i * 8},70%,${62 - i * 2}%)`;
      c.fillRect(x, h - 20 - (i + 1) * 16, bw, 15);
    });
    c.fillStyle = 'hsl(30,80%,62%)'; c.fillRect(190, 20, 76, 15);
  },

  create(A) {
    const ctx = A.ctx, rand = A.rand, BH = 26;
    let W = A.W, H = A.H;
    const hue0 = rand(0, 360);
    let baseW = Math.min(W * .55, 260);
    let stack = [{ x: (W - baseW) / 2, w: baseW }];
    let cur = null, falls = [], camY = 0, score = 0, perfect = 0, dead = false, deadT = 0, ended = false, t = 0, flash = 0, flashText = '';
    let lastLv = 1, wind = 0;
    const NEWS = { 2: 'De blokken gaan sneller', 3: 'Blokken komen van twee kanten', 5: 'Blokken wisselen van snelheid', 7: 'Wind! Blokken waaien mee' };
    const level = () => 1 + Math.floor((stack.length - 1) / 10);

    const blockY = i => H - 50 - (i + 1) * BH + camY;
    const color = (i, l = 60) => `hsl(${(hue0 + i * 9) % 360},70%,${l}%)`;
    function spawn() {
      const top = stack[stack.length - 1], n = stack.length;
      const lv = level();
      const speed = Math.min(650, 180 + (lv - 1) * 45 + ((n - 1) % 10) * 4);
      const fromLeft = lv < 3 ? true : Math.random() < .5;
      wind = lv >= 7 ? rand(-.45, .45) : 0;
      cur = { x: fromLeft ? 0 : W - top.w, w: top.w, dir: fromLeft ? 1 : -1, speed, ph: rand(0, 6), gold: n > 3 && Math.random() < .15 };
    }
    function resize() {
      const oldW = W; W = A.W; H = A.H;
      if (oldW && oldW !== W) {
        const dx = (W - oldW) / 2;
        for (const b of stack) b.x += dx;
        if (cur) cur.x = Math.max(0, Math.min(W - cur.w, cur.x + dx));
      }
    }
    spawn();

    function drop() {
      const top = stack[stack.length - 1], i = stack.length;
      const l = Math.max(cur.x, top.x), r = Math.min(cur.x + cur.w, top.x + top.w), ov = r - l;
      if (ov <= 0) {
        falls.push({ x: cur.x, w: cur.w, i, dy: 0, vy: 0, rot: 0, gold: cur.gold, vr: rand(-2, 2) });
        cur = null; dead = true;
        A.sound(160, .5, 'sawtooth', .07, -100);
        return;
      }
      if (Math.abs(cur.x - top.x) < 5) {
        perfect++;
        let nw = top.w;
        if (perfect >= 3) nw = Math.min(baseW, top.w + 10);
        stack.push({ x: top.x - (nw - top.w) / 2, w: nw, gold: cur.gold });
        score += 2 * level() * (cur.gold ? 3 : 1); flash = .6; flashText = cur.gold ? 'Goud perfect! x3' : perfect >= 3 ? 'Perfect x' + perfect + '!' : 'Perfect!';
        A.sound(520 + Math.min(perfect, 8) * 80, .15, 'triangle', .08);
      } else {
        perfect = 0;
        stack.push({ x: l, w: ov, gold: cur.gold });
        if (cur.x < l) falls.push({ x: cur.x, w: l - cur.x, i, dy: 0, vy: 0, rot: 0, gold: cur.gold, vr: rand(-3, -1) });
        else falls.push({ x: r, w: cur.x + cur.w - r, i, dy: 0, vy: 0, rot: 0, gold: cur.gold, vr: rand(1, 3) });
        score += level() * (cur.gold ? 2 : 1);
        if (cur.gold) { flash = .6; flashText = 'Goud! x2'; }
        A.sound(300 + Math.min(stack.length, 40) * 8, .08, 'square', .05);
      }
      const lv = level();
      if (lv !== lastLv) { lastLv = lv; A.level(lv, NEWS[lv] || 'Nog sneller'); }
      spawn();
    }

    function update(dt) {
      t += dt; flash = Math.max(0, flash - dt);
      for (let k = falls.length - 1; k >= 0; k--) {
        const f = falls[k]; f.vy += 1400 * dt; f.dy += f.vy * dt; f.rot += f.vr * dt;
        if (f.dy > H + 200) falls.splice(k, 1);
      }
      const target = Math.max(0, (stack.length + 1) * BH - H * .55);
      camY += (target - camY) * Math.min(1, dt * 5);
      if (dead) { deadT += dt; if (deadT > 1 && !ended) { ended = true; A.end(); } return; }
      let eff = cur.speed;
      if (level() >= 5) eff *= 1 + .45 * Math.sin(t * 3.2 + cur.ph);
      if (wind) eff *= 1 + wind * cur.dir;
      cur.x += cur.dir * eff * dt;
      if (cur.x < 0) { cur.x = 0; cur.dir = 1; }
      if (cur.x + cur.w > W) { cur.x = W - cur.w; cur.dir = -1; }
      if (A.hit(' ', 'tap', 'enter', 'arrowdown', 's')) drop();
      A.score(score);
      A.info((wind ? (wind > 0 ? 'Wind \u2192 ' : 'Wind \u2190 ') : '') + 'Hoogte ' + (stack.length - 1) + (perfect > 1 ? ' \u00b7 perfect x' + perfect : ''));
    }

    function block(x, y, w, i, gold) {
      ctx.fillStyle = gold ? '#f4d35e' : color(i); ctx.fillRect(x, y, w, BH - 2);
      ctx.fillStyle = gold ? '#fff3b0' : color(i, 72); ctx.fillRect(x, y, w, 4);
      ctx.fillStyle = gold ? '#b98a1c' : color(i, 45); ctx.fillRect(x, y + BH - 6, w, 4);
      if (gold) { ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.fillRect(x + ((t * 120) % Math.max(1, w)), y + 4, 6, BH - 10); }
    }
    function draw() {
      const height = stack.length;
      const g = ctx.createLinearGradient(0, 0, 0, H);
      const sky = Math.min(1, height / 60);
      g.addColorStop(0, `hsl(${250 - sky * 20},${45 - sky * 15}%,${12 - sky * 6}%)`);
      g.addColorStop(1, '#0b1020');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = `rgba(230,240,255,${.2 + sky * .6})`;
      for (let i = 0; i < 60; i++) {
        const sy = ((i * 89 + camY * .3) % (H + 20)) - 10;
        ctx.fillRect((i * 151) % W, sy, 1.5, 1.5);
      }
      ctx.fillStyle = '#141a2e'; ctx.fillRect(0, H - 50 + camY, W, 50 + 10);
      if (wind) {
        ctx.strokeStyle = 'rgba(232,239,228,.18)'; ctx.lineWidth = 1.5;
        for (let i = 0; i < 14; i++) {
          const len = 30 + (i % 4) * 12, y = (i * 61) % H;
          const x = ((i * 173 + t * 260 * Math.sign(wind) * (1 + Math.abs(wind))) % (W + 80) + W + 80) % (W + 80) - 40;
          ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + len * Math.sign(wind), y); ctx.stroke();
        }
      }

      for (let i = 0; i < stack.length; i++) {
        const y = blockY(i);
        if (y > H + BH) continue;
        block(stack[i].x, y, stack[i].w, i, stack[i].gold);
      }
      if (cur) block(cur.x, blockY(stack.length), cur.w, stack.length, cur.gold);
      for (const f of falls) {
        ctx.save();
        const y = blockY(f.i) + f.dy;
        ctx.translate(f.x + f.w / 2, y + BH / 2); ctx.rotate(f.rot);
        ctx.globalAlpha = .9;
        block(-f.w / 2, -BH / 2, f.w, f.i, f.gold);
        ctx.restore();
      }
      ctx.globalAlpha = 1;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = 'rgba(232,239,228,.12)';
      ctx.font = `italic 600 ${Math.min(140, W * .3)}px Fraunces, Georgia, serif`;
      ctx.fillText(String(stack.length - 1), W / 2, H * .3);
      if (flash > 0) {
        ctx.globalAlpha = Math.min(1, flash * 2);
        ctx.fillStyle = '#f4d35e'; ctx.font = 'italic 600 28px Fraunces, Georgia, serif';
        ctx.fillText(flashText, W / 2, blockY(stack.length - 1) - 40);
        ctx.globalAlpha = 1;
      }
    }

    return { update, draw, resize };
  }
});
