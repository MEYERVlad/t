// Глава 2. Архив в подвале ДК. Темнота; свет — только луч фонарика-«жучка», который ведёт игрок.
(function () {
  const P = OM.P, S = OM.S, G = OM.G, A = OM.Actors;
  const { hex, rng, W, H, lerp, clamp } = OM;
  const say = (t) => OM.say('lev', t);

  const st = { beam: [700, 450], bright: 1, crank: 0, tallA: 0, tallHit: 0, tallOn: false, drips: [], dark: null, flick: 1 };

  function bricks(g, x, y, w, h, seed, base = '#5a3a2c') {
    const r = rng(seed);
    g.fillStyle = base;
    g.fillRect(x, y, w, h);
    for (let yy = y, row = 0; yy < y + h; yy += 11, row++) {
      for (let xx = x - (row % 2) * 14; xx < x + w; xx += 28) {
        g.fillStyle = OM.Fig.shade(base, (r() - 0.5) * 0.3);
        g.fillRect(xx + 1, yy + 1, 26, 9);
      }
    }
    g.fillStyle = 'rgba(0,0,0,.25)';
    for (let i = 0; i < 40; i++) g.fillRect(x + r() * w, y + r() * h, 10 + r() * 30, 1);
  }

  function boundVolume(g, x, yb, w, h, year, r) {
    const c = ['#3a2a22', '#2a2a3a', '#3a3a2a', '#4a2a22'][(r() * 4) | 0];
    P.fillV(g, x, yb - h, w, h, [[0, OM.Fig.shade(c, 0.15)], [1, OM.Fig.shade(c, -0.25)]]);
    g.fillStyle = '#c8b890';
    g.fillRect(x + 2, yb - h + 8, w - 4, 10);
    P.text(g, year, x + w / 2, yb - h + 13, { font: '700 5.5px "PT Serif",serif', color: '#2a1a10' });
    g.fillStyle = 'rgba(220,200,150,.35)';
    g.fillRect(x + 1, yb - 16, w - 2, 1);
    g.fillRect(x + 1, yb - h + 24, w - 2, 1);
  }

  function rack(g, x, w, label, years, seed) {
    const r = rng(seed);
    const top = 210, bot = 600;
    g.fillStyle = '#2a2018';
    g.fillRect(x - 4, top - 6, 6, bot - top + 6);
    g.fillRect(x + w - 2, top - 6, 6, bot - top + 6);
    for (let i = 0; i < 4; i++) {
      const yb = top + 30 + i * 96;
      g.fillStyle = '#3a2a1c';
      g.fillRect(x - 4, yb, w + 8, 6);
      let xx = x + 2;
      while (xx < x + w - 18) {
        const vw = 16 + r() * 6;
        boundVolume(g, xx, yb, vw, 70 + r() * 16, years[(r() * years.length) | 0], r);
        xx += vw + 1;
      }
    }
    g.fillStyle = '#d8ccb0';
    g.fillRect(x + w / 2 - 30, top - 26, 60, 16);
    P.text(g, label, x + w / 2, top - 18, { font: '700 8px "PT Serif",serif', color: '#2a1a10', ls: 1 });
  }

  function paint(g) {
    // своды подвала
    bricks(g, 0, 0, W, 610, 401);
    g.fillStyle = 'rgba(0,0,0,.35)';
    g.fillRect(0, 0, W, 610);
    [[300, 560], [590, 860], [880, 1180]].forEach(([a, b]) => {
      g.fillStyle = '#4a2e22';
      g.beginPath();
      g.moveTo(a - 20, 610);
      g.lineTo(a - 20, 200);
      g.quadraticCurveTo((a + b) / 2, 70, b + 20, 200);
      g.lineTo(b + 20, 610);
      g.lineTo(b, 610);
      g.lineTo(b, 205);
      g.quadraticCurveTo((a + b) / 2, 96, a, 205);
      g.lineTo(a, 610);
      g.fill();
      g.fillStyle = 'rgba(0,0,0,.4)';
      g.fillRect(a, 205, b - a, 405);
    });
    // трубы под потолком
    P.fillV(g, 0, 58, W, 16, [[0, '#6a6a62'], [0.5, '#4a4a44'], [1, '#2a2a26']]);
    P.fillV(g, 0, 82, W, 10, [[0, '#7a5a3a'], [1, '#3a2a1a']]);
    for (let x = 60; x < W; x += 180) {
      g.fillStyle = '#3a3a34';
      g.fillRect(x, 54, 10, 24);
      g.fillStyle = 'rgba(120,80,40,.5)';
      g.fillRect(x + 2, 74, 6, 18);
    }
    // стеллажи с подшивками
    rack(g, 320, 220, '1950—1954', ['1950', '1951', '1952', '1953', '1954'], 402);
    rack(g, 610, 230, '1955', ['1955'], 403);
    rack(g, 900, 260, '1956—1965', ['1956', '1958', '1960', '1963', '1965'], 404);
    // лестница сверху слева
    g.fillStyle = '#2a1e16';
    g.beginPath();
    g.moveTo(0, 150);
    g.lineTo(260, 610);
    g.lineTo(0, 610);
    g.fill();
    for (let i = 0; i < 12; i++) {
      const x = i * 22, y = 150 + i * 38;
      P.fillV(g, 0, y, x + 30, 8, [[0, '#5a4a3a'], [1, '#2a2018']]);
    }
    g.fillStyle = '#3a2a1a';
    g.fillRect(0, 60, 120, 96);
    g.fillStyle = '#1a120a';
    g.fillRect(10, 68, 100, 88);
    // ящики, сломанный стул, бойлер
    P.fillV(g, 1150, 520, 80, 90, [[0, '#5a4a32'], [1, '#3a2a1a']]);
    g.strokeStyle = 'rgba(0,0,0,.4)';
    g.strokeRect(1150, 520, 80, 90);
    g.beginPath();
    g.moveTo(1150, 520);
    g.lineTo(1230, 610);
    g.stroke();
    g.fillStyle = '#e0d8c0';
    g.fillRect(1166, 540, 30, 14);
    P.text(g, 'ДК·1959', 1181, 547, { font: '700 5px "PT Serif",serif', color: '#3a2a1a' });
    g.fillStyle = '#3a2414';
    g.fillRect(560, 560, 30, 5);
    g.fillRect(562, 565, 4, 44);
    g.fillRect(584, 520, 4, 90);
    // пол
    P.fillV(g, 0, 606, W, 114, [[0, '#3a3430'], [1, '#1a1614']]);
    const r = rng(405);
    for (let i = 0; i < 40; i++) {
      g.fillStyle = 'rgba(0,0,0,.25)';
      g.fillRect(r() * W, 610 + r() * 110, 30 + r() * 80, 1);
    }
    // лужа под трубой
    g.fillStyle = 'rgba(80,90,96,.35)';
    g.beginPath();
    g.ellipse(780, 660, 90, 10, 0, 0, Math.PI * 2);
    g.fill();
    // старые газеты на полу
    for (let i = 0; i < 9; i++) {
      g.save();
      g.translate(380 + r() * 600, 630 + r() * 70);
      g.rotate((r() - 0.5) * 0.8);
      g.fillStyle = '#b8b098';
      g.fillRect(-14, -8, 28, 16);
      g.fillStyle = 'rgba(30,30,30,.4)';
      for (let k = 0; k < 4; k++) g.fillRect(-12, -6 + k * 4, 24, 1);
      g.restore();
    }
    P.paper(g, 406, 0.1);
  }

  function back(ctx, t) {
    // капли с трубы
    if (Math.random() < 0.02) st.drips.push({ x: 760 + Math.random() * 40, y: 92, v: 0 });
    st.drips.forEach((d) => { d.v += 9; d.y += d.v * 0.016; });
    st.drips = st.drips.filter((d) => {
      if (d.y > 655) { S.tick && Math.random() < 0.5 && S.tick(1); return false; }
      return true;
    });
    st.drips.forEach((d) => { ctx.fillStyle = 'rgba(200,210,215,.7)'; ctx.fillRect(d.x, d.y, 1.5, 4); });
  }

  const vera = OM.actor({ id: 'vera', x: 600, y: 640, face: 1, speed: 110, draw: (c, a, t) => A.vera(c, a, t), litByScene: true });
  const tall = OM.actor({
    id: 'tall', x: 1080, y: 650, face: -1, autoScale: false, s: 0.62, z: 630,
    draw: (c, a, t) => { if (st.tallA > 0.01) A.tall(c, Object.assign({}, a, { alpha: st.tallA, reach: a.reach || 0, jitter: 1 + st.tallHit * 4 }), t); },
  });

  // Тьма с лучом фонарика.
  function over(ctx, t) {
    const hero = G.hero;
    const hx = hero.x + hero.face * 32 * hero.s, hy = hero.y - 112 * hero.s;
    if (G.mouse.x >= 0) st.beam = [clamp(G.mouse.x, 0, W), clamp(G.mouse.y, 0, H)];
    let [bx, by] = st.beam;
    const ang = Math.atan2(by - hy, bx - hx);
    const dist = Math.min(Math.hypot(bx - hx, by - hy), 760);
    bx = hx + Math.cos(ang) * dist; by = hy + Math.sin(ang) * dist;
    st.beamAt = [bx, by];
    const br = st.bright * st.flick;
    if (!st.dark) st.dark = OM.makeCanvas(W / 2, H / 2);
    const d = st.dark.getContext('2d');
    d.setTransform(0.5, 0, 0, 0.5, 0, 0);
    d.globalCompositeOperation = 'source-over';
    d.clearRect(0, 0, W, H);
    d.fillStyle = 'rgba(2,3,5,.9)';
    d.fillRect(0, 0, W, H);
    d.globalCompositeOperation = 'destination-out';
    // свет из двери наверху лестницы
    d.fillStyle = P.rgrad(d, 60, 110, 0, 220, [[0, 'rgba(0,0,0,.75)'], [1, 'rgba(0,0,0,0)']]);
    d.fillRect(0, 0, 400, 400);
    // конус луча
    const spread = 0.22, R = dist + 40;
    d.fillStyle = P.rgrad(d, hx, hy, 10, R, [[0, `rgba(0,0,0,${0.9 * br})`], [0.7, `rgba(0,0,0,${0.55 * br})`], [1, 'rgba(0,0,0,0)']]);
    d.beginPath();
    d.moveTo(hx, hy);
    d.arc(hx, hy, R, ang - spread, ang + spread);
    d.closePath();
    d.fill();
    // пятно
    d.fillStyle = P.rgrad(d, bx, by, 0, 120, [[0, `rgba(0,0,0,${br})`], [0.6, `rgba(0,0,0,${0.7 * br})`], [1, 'rgba(0,0,0,0)']]);
    d.fillRect(bx - 130, by - 130, 260, 260);
    // ореол вокруг Льва, чтобы было видно его самого
    d.fillStyle = P.rgrad(d, hero.x, hero.y - 90, 0, 140, [[0, 'rgba(0,0,0,.55)'], [1, 'rgba(0,0,0,0)']]);
    d.fillRect(hero.x - 150, hero.y - 240, 300, 300);
    ctx.drawImage(st.dark, 0, 0, W, H);
    // тёплый оттенок луча
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = P.rgrad(ctx, bx, by, 0, 110, [[0, `rgba(255,220,150,${0.12 * br})`], [1, 'rgba(255,220,150,0)']]);
    ctx.fillRect(bx - 120, by - 120, 240, 240);
    ctx.restore();
    // пылинки в луче
    for (let i = 0; i < 24; i++) {
      const k = (t * 0.05 + i * 0.173) % 1;
      const px = hx + Math.cos(ang + (((i * 37) % 11) / 11 - 0.5) * spread * 1.6) * dist * k;
      const py = hy + Math.sin(ang + (((i * 37) % 11) / 11 - 0.5) * spread * 1.6) * dist * k;
      ctx.fillStyle = `rgba(255,235,200,${0.35 * br * Math.sin(k * Math.PI)})`;
      ctx.fillRect(px, py + Math.sin(t * 2 + i) * 3, 1.5, 1.5);
    }
  }

  const lit = (x, y, r = 110) => st.beamAt && Math.hypot(st.beamAt[0] - x, st.beamAt[1] - y) < r;

  OM.scene('archive', {
    name: 'Архив',
    surface: 'floor',
    figLight: { amb: 0.4, tint: '#2a2420', side: 1 },
    amb: { drone: 0.5, indoor: true, wind: 0.05 },
    walk: [[240, 628], [1140, 628], [1140, 700], [240, 700]],
    depth: { y0: 628, s0: 1.0, y1: 700, s1: 1.1 },
    entries: { default: { x: 300, y: 660, face: 1 }, stairs: { x: 270, y: 650, face: 1 } },
    lights: [{ x: 60, y: 110, color: '#c8b8a0', a: 0.4, reach: 500 }],
    actors: () => [vera, tall],
    paint,
    back,
    over,
    vignette: 1,
    update(dt, t) {
      // «жучок» жужжит: яркость пульсирует с ручкой
      st.crank += dt;
      if (st.crank > 0.32) { st.crank = 0; S.whirr && S.whirr(); }
      st.flick = 0.82 + 0.18 * Math.abs(Math.sin(t * 9.8));
      G.hero.holdLight = true;
      if (st.tallOn) {
        const onIt = lit(tall.x, tall.y - 150, 120);
        st.tallHit = clamp(st.tallHit + (onIt ? dt / 1.6 : -dt * 0.15), 0, 1);
      }
    },
    setup() {
      st.tallA = 0; st.tallOn = false; st.tallHit = 0;
      vera.x = 420; vera.y = 640; vera.face = 1; vera.hold = null;
      tall.reach = 0;
    },
    leave() { G.hero.holdLight = false; },
    hotspots: [
      { id: 'stairs', name: 'Лестница наверх', rect: [0, 60, 130, 120], look: 'Лестница наверх. Из-за двери сочится серый свет. Дверь подпёрта — спасибо тому «Д».' },
      { id: 'pipes', name: 'Трубы', rect: [0, 50, W, 50], when: () => st.beamAt && st.beamAt[1] < 160, look: 'Трубы. С одной капает — давно и упрямо. Под ней на полу натекла лужа.' },
      { id: 'r1', name: 'Подшивки 1950—1954', rect: [316, 180, 228, 420], when: () => lit(430, 380, 160), look: 'Подшивки за пятидесятые. До переселения. Посевная, надои, «к нам приехал лектор».' },
      {
        id: 'r2', name: 'Подшивки 1955', rect: [606, 180, 238, 420], when: () => lit(725, 380, 160),
        look: 'Табличка «1955». Вот он.',
        use: () => OM.story2.find1955(),
      },
      { id: 'r3', name: 'Подшивки 1956—1965', rect: [896, 180, 268, 420], when: () => lit(1030, 380, 160), look: 'Подшивки после переселения. Всё про новый город, про стройку. Ни слова о старом.' },
      { id: 'crate', name: 'Ящик', rect: [1146, 516, 88, 96], when: () => lit(1190, 560), look: 'Ящик с надписью «ДК·1959». Внутри — бюст неизвестного передовика, лицом вниз.' },
      {
        id: 'tall', name: '…', when: () => st.tallOn && st.tallA > 0.3,
        rect: () => [tall.x - 60, tall.y - 260, 120, 260],
        look: () => say('Держать на нём свет. Не отводить. Не смотреть в лицо — смотреть в свет.'),
      },
      { id: 'vera', name: 'Вера Андреевна', rect: () => [vera.x - 30, vera.y - 200, 60, 200], look: 'Вера. Прядь выбилась окончательно. Держится хорошо — лучше, чем я.' },
    ],
    async enter(entry) {
      if (entry === 'stairs' && !OM.flag('archiveSeen')) {
        OM.flag('archiveSeen', 1);
        OM.letterbox(true);
        await OM.wait(400);
        await OM.say('vera', 'Светите вы, у меня руки заняты. Ведите по полкам — я скажу, где.');
        await say('Жучок жужжит, как шмель в банке. Свет — пока жмёшь.');
        OM.letterbox(false);
        OM.toast(G.touch ? 'Касание — направить луч. Ищите полку с 1955 годом.' : 'Луч следует за курсором. Найдите полку с подшивками 1955 года.');
      }
    },
  });

  OM.archive = { st, vera, tall, lit };
})();
