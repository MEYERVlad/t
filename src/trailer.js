// Трейлер: монтаж из сцен игры. Всё — функция времени: кадр(t) одинаков при просмотре и при экспорте в видео.
(function () {
  const { W, H, lerp, clamp, smooth, hex } = OM;
  const P = OM.P, A = OM.Actors, G = OM.G;
  const TR = (window.TR = {});
  const DUR = OM.TRA.DUR;
  const CS = 2; // запас разрешения фонов под «наезды» камеры
  const BAR = Math.round((H - W / 2.39) / 2); // кашетирование 2.39:1

  let cv, ctx;
  const caches = {};
  const cache = (id, painter) => {
    if (!caches[id]) {
      const c = OM.makeCanvas(W * CS, H * CS);
      const g = c.getContext('2d');
      g.scale(CS, CS);
      painter(g);
      caches[id] = c;
    }
    return caches[id];
  };
  const SC = (id) => G.scenes[id];
  const bg = (id) => cache(id + ':bg', (g) => SC(id).paint(g));
  const fg = (id) => (SC(id).front ? cache(id + ':fg', (g) => SC(id).front(g)) : null);
  const rains = {};
  const rainOf = (id) => {
    const s = SC(id);
    if (!s.rain) return null;
    return (rains[id] = rains[id] || new P.Rain(s.rain.n, s.rain));
  };
  const k01 = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
  const ease = (t, a, b) => smooth(k01(t, a, b));

  function camera(c, cx, cy, z) {
    cx = clamp(cx, W / (2 * z), W - W / (2 * z));
    cy = clamp(cy, H / (2 * z), H - H / (2 * z));
    c.translate(W / 2, H / 2);
    c.scale(z, z);
    c.translate(-cx, -cy);
  }

  // Сцена игры с заданными персонажами (список {y, draw(c, t)}), по слоям как в движке.
  function world(c, id, t, dt, actors = []) {
    const s = SC(id);
    if (s.update) s.update(dt, t);
    const r = rainOf(id);
    if (r) r.update(dt);
    c.drawImage(bg(id), 0, 0, W, H);
    if (s.back) s.back(c, t);
    const list = actors.slice();
    (s.layers || []).forEach((L, i) => list.push({ y: L.z, draw: (cc) => cc.drawImage(cache(id + ':L' + i, (g) => L.paint(g)), 0, 0, W, H) }));
    list.sort((a, b) => a.y - b.y).forEach((a) => a.draw(c, t));
    const f = fg(id);
    if (f) c.drawImage(f, 0, 0, W, H);
    if (r) r.draw(c, s.rainLights || [], s.rain.base ?? 0.1, s.rain.tint);
    if (s.over) s.over(c, t);
  }

  const rim = (color, a, side) => ({ color: hex(color, a), dx: side * 1.5, dy: -0.6 });
  const hero = (x, y, s, face, walking, rimO) => ({
    y,
    draw: (c, t) => A.hero(c, { x, y, s, face, phase: walking ? x / (26 * s) : 0, move: walking ? 1 : 0, rim: rimO ? { ...rimO, dx: rimO.dx * face } : null, item: 'case' }, t),
  });

  // ---------- Видения ----------
  let photoDraw = null;
  function photoVision(c, t) {
    if (!photoDraw) {
      OM.story.photoVision();
      photoDraw = G.vision.draw;
      G.vision = null;
    }
    photoDraw(c, t, t);
  }

  const drops = [];
  function redVision(c, t, lt) {
    const pier = SC('pier');
    c.drawImage(bg('pier'), 0, 0, W, H);
    const reach = ease(lt, 0.5, 6.2);
    A.tall(c, { x: lerp(1215, 1185, reach), y: 820, s: 1.12, face: -1, reach, alpha: 1, jitter: 3, body: '#020202' }, t);
    c.drawImage(fg('pier'), 0, 0, W, H);
    c.save();
    c.globalCompositeOperation = 'multiply';
    c.fillStyle = '#ff2e1f';
    c.fillRect(0, 0, W, H);
    c.globalCompositeOperation = 'screen';
    c.fillStyle = 'rgba(70,0,0,.35)';
    c.fillRect(0, 0, W, H);
    c.restore();
    const step = 6.4;
    let mx = lerp(520, 1080, ease(lt, 0, 5.4)), my = 592, mA = Math.min(1, lt * 1.5);
    if (lt > step) { mx = 1080 + (lt - step) * 90; my = 592 + Math.pow(Math.max(0, lt - step - 0.25), 2) * 900; mA = 1 - k01(lt, step + 0.3, step + 0.7); }
    if (mA > 0) {
      c.save();
      c.globalAlpha = mA;
      const walking = lt < 5.4 || lt > step;
      A.mitya(c, { x: mx, y: Math.min(my, 640), s: 1, face: 1, move: walking ? 1 : 0, phase: lt * 3.2, sleep: true, body: '#f3e9de', shade: '#9a7a70' }, t);
      c.restore();
      P.glow(c, mx, my - 60, 90, '#ffdcc8', 0.12 * mA);
    }
    if (lt > step + 0.6 && !drops.length) {
      for (let i = 0; i < 50; i++) drops.push({ x: 1120 + (Math.random() - 0.5) * 30, y: 612, vx: (Math.random() - 0.5) * 120, vy: -150 - Math.random() * 260, t0: lt });
    }
    drops.forEach((d) => {
      const e = lt - d.t0;
      const x = d.x + d.vx * e, y = d.y + d.vy * e + 600 * e * e;
      c.fillStyle = `rgba(255,220,210,${Math.max(0, 1 - e)})`;
      c.fillRect(x, y, 2.5, 2.5);
    });
    for (let i = 0; i < 5; i++) {
      if (Math.random() < 0.5) continue;
      c.fillStyle = `rgba(0,0,0,${0.3 + Math.random() * 0.5})`;
      c.fillRect(0, Math.random() * H, W, 1 + Math.random() * 4);
    }
    const pulse = 0.5 + 0.5 * Math.sin(t * 6);
    c.fillStyle = P.rgrad(c, W / 2, H / 2, H * 0.25, W * 0.7, [[0, 'rgba(0,0,0,0)'], [1, `rgba(20,0,0,${0.6 + pulse * 0.25})`]]);
    c.fillRect(0, 0, W, H);
  }

  // ---------- Монтажный лист ----------
  const shots = [
    { t0: 0, t1: 3, draw() {} },
    {
      // Автобус уходит, оставляя Льва одного под дождём.
      t0: 3, t1: 12.5, scale: 9 / 9.5,
      draw(c, t, lt, dt) {
        const k = lt / 9;
        camera(c, lerp(640, 690, smooth(k)), lerp(390, 420, k), lerp(1.02, 1.16, smooth(k)));
        const busX = lt < 2.4 ? 600 : 600 - Math.pow(lt - 2.4, 2) * 60;
        world(c, 'busstop', t, dt, [
          hero(640, 622, 0.985, 1, false, rim('#ffae5a', 0.55, 1)),
          { y: 712, draw: (cc, tt) => A.bus(cc, { x: busX, y: 712, s: 1.55, face: 1, lights: true }, tt) },
        ]);
      },
    },
    {
      // Молния: высокая фигура у леса.
      t0: 12.5, t1: 21.5, scale: 4.2 / 7.1,
      enter() { G.flags.tallBus = 'show'; },
      draw(c, t, lt, dt) {
        camera(c, lerp(880, 930, lt / 7), lerp(466, 474, lt / 7), lerp(1.5, 1.62, lt / 7));
        if (lt >= 4.2 && !this.bolt) { this.bolt = 1; G.fx.flash = 1; SC('busstop').onBolt(); }
        if (lt >= 4.38 && this.bolt === 1) { this.bolt = 2; G.fx.flash = 0.8; }
        world(c, 'busstop', t, dt, [hero(780, 640, 1.03, 1, false, rim('#ffae5a', 0.5, -1))]);
      },
    },
    { t0: 21.5, t1: 22, draw() {} },
    {
      // Улица: Лев идёт к «Заре».
      t0: 22, t1: 27, scale: 7.4 / 5,
      draw(c, t, lt, dt) {
        const k = lt / 7.4;
        camera(c, lerp(820, 470, smooth(k)), 420, 1.2);
        const x = lerp(820, 470, k);
        world(c, 'street', t, dt, [hero(x, 668, 0.875, -1, true, rim('#ffae5a', 0.5, x > 628 ? -1 : 1))]);
      },
    },
    {
      // Холл: хозяйка за стойкой.
      t0: 27, t1: 32.5, scale: 6.5 / 5.5,
      init() { this.props = SC('lobby').actors().find((a) => a.id === 'props'); },
      draw(c, t, lt, dt) {
        const k = smooth(lt / 6.5);
        camera(c, lerp(600, 610, k), lerp(380, 352, k), lerp(1.0, 1.32, k));
        const talking = lt > 1.4 && lt < 4.8;
        world(c, 'lobby', t, dt, [
          { y: 452, draw: (cc, tt) => A.zina(cc, { x: 612, y: 452, s: 1.15, talking }, tt) },
          { y: 606, draw: (cc, tt) => this.props.draw(cc, this.props, tt) },
          hero(470, 668, 1.37, 1, false, rim('#ffcf88', 0.6, 1)),
        ]);
      },
    },
    {
      // Номер 7: окно на озеро.
      t0: 32.5, t1: 38.5, scale: 6.5 / 6,
      draw(c, t, lt, dt) {
        const k = smooth(lt / 6.5);
        camera(c, lerp(720, 870, k), lerp(370, 318, k), lerp(1.0, 1.5, k));
        world(c, 'room', t, dt, [hero(700, 660, 1.4, 1, false, rim('#ffc070', 0.6, -1))]);
      },
    },
    {
      // Подводная церковь — вспышками.
      t0: 38.5, t1: 41.5, scale: 4 / 3,
      draw(c, t, lt) {
        const vis = (lt < 1.0) || (lt > 1.3 && lt < 2.6) || (lt > 2.75 && lt < 3.05) || lt > 3.3;
        if (!vis) return;
        camera(c, 640, 380, 1 + lt * 0.08 + (lt > 1.3 ? 0.15 : 0));
        photoVision(c, t);
      },
    },
    {
      // Красное видение: мальчик на пристани.
      t0: 41.5, t1: 46.5, scale: 7.5 / 5,
      draw(c, t, lt) {
        camera(c, lerp(760, 860, lt / 7.5), 440, lerp(1.0, 1.16, lt / 7.5));
        redVision(c, t, lt);
      },
    },
    {
      // 00:13
      t0: 46.5, t1: 49.5, scale: 4 / 3,
      draw(c, t, lt) {
        c.fillStyle = '#060000';
        c.fillRect(0, 0, W, H);
        const beat = Math.exp(-((lt * 2) % 1) * 5);
        P.glow(c, W / 2, H / 2, 420, '#8a1a10', 0.12 + beat * 0.12);
        c.save();
        c.translate(W / 2, H / 2 - 10);
        c.scale(1 + lt * 0.02, 1 + lt * 0.02);
        P.text(c, '00:13', 0, 0, { font: '500 190px "Cormorant Garamond",serif', color: '#efb4a2', alpha: 0.75 + beat * 0.25 - Math.random() * 0.08, ls: 22 });
        c.restore();
      },
    },
    {
      // Пристань: Лев идёт к мальчику, камера наезжает на Тихого.
      t0: 49.5, t1: 57.5, scale: 8.5 / 8,
      draw(c, t, lt, dt) {
        const k = ease(lt, 3.2, 8.5);
        const z = lt < 3.2 ? lerp(1.0, 1.05, lt / 3.2) : lerp(1.15, 2.2, Math.pow(k, 1.6));
        const cx = lt < 3.2 ? lerp(640, 680, lt / 3.2) : lerp(980, 1196, k);
        const cy = lt < 3.2 ? 380 : lerp(450, 418, k);
        camera(c, cx, cy, z);
        const reach = ease(lt, 0.5, 8.4);
        const hx = lerp(330, 760, Math.min(1, lt / 8.5));
        world(c, 'pier', t, dt, [
          hero(hx, 594, 0.97, 1, true, rim('#b8c8e0', 0.45, -1)),
          { y: 592, draw: (cc, tt) => A.mitya(cc, { x: 1100, y: 592, s: 0.97, face: 1, sleep: true, rim: { color: 'rgba(255,174,90,.35)', dx: -1.2 } }, tt) },
          { y: 590, draw: (cc, tt) => A.tall(cc, { x: lerp(1250, 1205, reach), y: 830, s: 1.12, face: -1, reach, alpha: 1, jitter: 1.2 + k * 3, body: '#020305', face2: 1 + k * 2 }, tt) },
        ]);
      },
    },
    { t0: 57.5, t1: 59, draw() {} },
    {
      // Титул.
      t0: 59, t1: DUR + 1,
      draw(c, t, lt, dt) {
        camera(c, lerp(640, 600, lt / 13), lerp(330, 350, lt / 13), lerp(1.08, 1.0, lt / 13));
        world(c, 'pier', t, dt, [
          { y: 590, draw: (cc, tt) => A.tall(cc, { x: 1210, y: 860, s: 1.12, face: -1, reach: 0, alpha: 0.55, jitter: 1, body: '#020305' }, tt) },
        ]);
      },
    },
  ];

  const captions = () => [
    { t: 0.5, t1: 2.8, text: 'Осень 1996 года', kind: 'card' },
    ...OM.TRA.CUES.map((c) => ({ ...c, t1: OM.TRA.cueEnd(c) })),
  ];
  // [начало, конец, от, до] — затемнения между планами
  const fades = [
    [0, 3, 1, 1], [3, 4.5, 1, 0], [21, 21.5, 0, 1], [21.5, 22, 1, 1], [22, 22.7, 1, 0], [26.7, 27, 0, 1], [27, 27.4, 1, 0],
    [32.2, 32.5, 0, 1], [32.5, 32.9, 1, 0], [38.1, 38.5, 0, 1], [49.5, 50.4, 1, 0], [57.5, 59, 1, 1], [70.4, 72, 0, 1], [72, 99, 1, 1],
  ];
  const flashes = [[38.5, 0.9], [41.5, 1], [45.7, 0.8], [46.5, 0.6], [59, 1]];

  function fadeAt(t) {
    let v = 0;
    for (const [a, b, f, to] of fades) if (t >= a && t < b) v = lerp(f, to, (t - a) / (b - a));
    return v;
  }

  function caption(c, t) {
    for (const { t: a, t1: b, text: s, kind } of captions()) {
      if (t < a || t > b) continue;
      const al = Math.min(k01(t, a, a + 0.7), 1 - k01(t, b - 0.7, b));
      const drift = (t - a) * 2;
      if (kind === 'card') {
        P.text(c, s, W / 2, H / 2, { font: 'italic 500 46px "Cormorant Garamond",serif', color: '#e9dcc4', alpha: al, ls: 3 });
      } else {
        c.save();
        c.shadowColor = 'rgba(0,0,0,.9)';
        c.shadowBlur = 18;
        P.text(c, s, W / 2, H - BAR - 54 - drift * 0.4, {
          font: (kind === 'quote' ? '500 ' : 'italic 500 ') + '36px "Cormorant Garamond",serif',
          color: kind === 'quote' ? '#f0c79a' : '#efe4cf', alpha: al, ls: 1.5,
        });
        c.restore();
      }
    }
  }

  // Титул с бликом, пробегающим по буквам.
  let titleCv = null;
  function title(c, t) {
    const lt = t - 59;
    if (lt < 0) return;
    const al = Math.min(1, lt / 1.2) * (1 - k01(t, 70.4, 72));
    c.fillStyle = `rgba(0,0,0,${0.45 * Math.min(1, lt)})`;
    c.fillRect(0, 0, W, H);
    if (!titleCv) titleCv = OM.makeCanvas(W * 2, 400);
    const g = titleCv.getContext('2d');
    g.setTransform(2, 0, 0, 2, 0, 0);
    g.clearRect(0, 0, W, 200);
    g.globalCompositeOperation = 'source-over';
    const ls = lerp(70, 44, smooth(Math.min(1, lt / 7)));
    P.text(g, 'ОМУТ', W / 2 + ls / 2, 100, { font: '500 150px "Cormorant Garamond",serif', color: '#eadfc8', ls });
    g.globalCompositeOperation = 'source-atop';
    const sx = lerp(-300, W + 300, k01(lt, 1.2, 5.5));
    const gr = g.createLinearGradient(sx - 160, 0, sx + 160, 0);
    gr.addColorStop(0, 'rgba(255,240,215,0)');
    gr.addColorStop(0.5, 'rgba(255,248,235,1)');
    gr.addColorStop(1, 'rgba(255,240,215,0)');
    g.fillStyle = gr;
    g.fillRect(0, 0, W, 200);
    c.save();
    c.globalAlpha = al;
    c.shadowColor = 'rgba(0,0,0,.8)';
    c.shadowBlur = 30;
    c.drawImage(titleCv, 0, H / 2 - 150, W, 200);
    c.restore();
    const a2 = Math.min(k01(lt, 2.6, 4), 1 - k01(t, 70.4, 72));
    P.text(c, 'в тихом омуте…', W / 2, H / 2 + 52, { font: 'italic 500 28px "Cormorant Garamond",serif', color: '#cdbfa6', alpha: a2 * 0.8, ls: 8 });
    const a3 = Math.min(k01(lt, 5.4, 6.6), 1 - k01(t, 70.4, 72));
    P.text(c, 'ГЛАВА ПЕРВАЯ  ·  ПРИЕЗД', W / 2, H - BAR - 70, { font: '700 15px "PT Serif",serif', color: '#bba98a', alpha: a3 * 0.85, ls: 6 });
    const a4 = Math.min(k01(lt, 8, 9.2), 1 - k01(t, 70.4, 72));
    P.text(c, 'СКОРО', W / 2, H - BAR - 38, { font: '700 13px "PT Serif",serif', color: '#e0b080', alpha: a4 * 0.9, ls: 10 });
  }

  let current = null;
  TR.frame = function (t, dt) {
    const S = cv.width / W;
    ctx.setTransform(S, 0, 0, S, 0, 0);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);
    const shot = shots.find((s) => t >= s.t0 && t < s.t1);
    if (shot && shot !== current) {
      current = shot;
      if (shot.init && !shot._i) { shot._i = 1; shot.init(); }
      if (shot.enter) shot.enter();
    }
    G.fx.flash = Math.max(0, G.fx.flash - dt * 1.3);
    if (shot) {
      ctx.save();
      shot.draw(ctx, t, (t - shot.t0) * (shot.scale || 1), dt);
      ctx.restore();
      ctx.setTransform(S, 0, 0, S, 0, 0);
    }
    if (G.fx.flash > 0.01 && t < 38) {
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.fillStyle = `rgba(200,215,235,${G.fx.flash * 0.38})`;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }
    for (const [ft, v] of flashes) {
      const e = t - ft;
      if (e >= 0 && e < 0.5) {
        ctx.fillStyle = `rgba(255,250,240,${v * (1 - e / 0.5)})`;
        ctx.fillRect(0, 0, W, H);
      }
    }
    title(ctx, t);
    P.vignette(ctx, 1);
    P.grain(ctx, 0.1);
    const f = fadeAt(t);
    if (f > 0.001) {
      ctx.fillStyle = `rgba(0,0,0,${f})`;
      ctx.fillRect(0, 0, W, H);
    }
    caption(ctx, t);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, BAR);
    ctx.fillRect(0, H - BAR, W, BAR);
  };

  TR.DUR = DUR;
  TR.init = async function (canvas, w, h) {
    cv = canvas;
    cv.width = w;
    cv.height = h;
    ctx = cv.getContext('2d');
    await Promise.all([
      document.fonts.load('500 100px "Cormorant Garamond"'),
      document.fonts.load('italic 500 40px "Cormorant Garamond"'),
      document.fonts.load('700 15px "PT Serif"'),
    ]).catch(() => {});
    ['busstop', 'street', 'lobby', 'room', 'pier'].forEach((id) => { bg(id); fg(id); });
    cache('lobby:L0', (g) => SC('lobby').layers[0].paint(g));
  };
  TR.resize = function (w, h) { cv.width = w; cv.height = h; };
})();
