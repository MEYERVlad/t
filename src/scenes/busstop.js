// Сцена 1. Остановка «Тихий Омут». Ночь, дождь, лес.
(function () {
  const P = OM.P, S = OM.S, G = OM.G;
  const { hex, rng, W, H } = OM;
  const say = (t) => OM.say('lev', t);

  const LAMP = { x: 838, y: 312 };
  const TUBE = { x: 352, y: 358 };
  const st = { tube: 1, lamp: 1, tallA: 0 };

  function paint(g) {
    // небо
    P.fillV(g, 0, 0, W, 480, [
      [0, '#04070d'],
      [0.45, '#0c1622'],
      [0.8, '#1a2834'],
      [1, '#26363f'],
    ]);
    P.moon(g, 1012, 108, 24, 0.85);
    P.clouds(g, 11, { y0: 40, y1: 230, n: 16, color: '#0a121b', a: 0.75, size: [120, 300] });
    P.clouds(g, 12, { x0: 860, x1: 1180, y0: 80, y1: 150, n: 5, color: '#1c2a38', a: 0.5, size: [90, 180] });
    P.clouds(g, 13, { y0: 250, y1: 400, n: 12, color: '#24343f', a: 0.35, size: [140, 280] });
    // огни города вдали
    const r = rng(5);
    for (let i = 0; i < 14; i++) {
      const x = 1150 + r() * 140, y = 452 + r() * 18;
      g.fillStyle = hex('#ffc27a', 0.5 + r() * 0.5);
      g.fillRect(x, y, 2, 2);
    }
    P.glow(g, 1215, 462, 140, '#ff9d4f', 0.13);
    // дальний лес
    P.forest(g, 21, { yb: 476, hMin: 40, hMax: 120, color: '#111b21', step: [9, 20], fillTo: 520, skip: (x) => x > 1120 && x < 1300 });
    P.fillV(g, 0, 380, W, 140, [
      [0, 'rgba(110,140,150,0)'],
      [0.7, 'rgba(110,140,150,.16)'],
      [1, 'rgba(110,140,150,.05)'],
    ]);
    staticFog(g, 470, 130, 0.5);
    // ближний лес слева — тёмный задник для остановки
    P.forest(g, 22, { x0: -40, x1: 760, yb: 520, hMin: 140, hMax: 300, color: '#080d11', step: [16, 34], fillTo: 600 });
    P.forest(g, 23, { x0: 940, x1: 1110, yb: 512, hMin: 90, hMax: 200, color: '#0a1015', step: [16, 30], fillTo: 600 });
    // обочина
    P.fillV(g, 0, 505, W, 90, [
      [0, '#0b1114'],
      [1, '#06090b'],
    ]);
    // столбы и провода
    const p1 = P.pole(g, 70, 590, 330);
    const p2 = P.pole(g, 735, 584, 300);
    const p3 = P.pole(g, 1250, 578, 250);
    P.wires(g, p1, p2, 34);
    P.wires(g, p2, p3, 28);
    // берёзы за остановкой
    P.birch(g, 610, 590, 300, 31, { w: 7, lean: 0.03, light: '#7d8a88', shade: '#2a3332' });
    P.bareTree(g, 975, 560, 230, '#070b0e', 41, { depth: 7 });

    // тротуар и дорога
    P.fillV(g, 0, 588, W, 28, [
      [0, '#2a3034'],
      [1, '#1a1f22'],
    ]);
    g.fillStyle = '#0d1012';
    g.fillRect(0, 612, W, 4);
    P.fillV(g, 0, 616, W, 104, [
      [0, '#111518'],
      [0.5, '#0d1013'],
      [1, '#090b0d'],
    ]);
    P.speckle(g, 3, 0, 616, W, 104, 2500, '#3a4246', 0.25);
    P.speckle(g, 4, 0, 588, W, 24, 900, '#000', 0.4);
    // разметка
    g.fillStyle = 'rgba(160,165,160,.12)';
    for (let x = -20; x < W; x += 150) g.fillRect(x, 690, 80, 4);
    // лужи
    [[835, 668, 150, 16], [300, 694, 120, 11], [1120, 650, 90, 8]].forEach(([x, y, w, h]) => {
      g.fillStyle = P.vgrad(g, y - h, y + h, [[0, '#0f171d'], [1, '#141e25']]);
      g.beginPath();
      g.ellipse(x, y, w, h, 0, 0, Math.PI * 2);
      g.fill();
    });

    // ---- остановка (бетонный павильон) ----
    const conc = (x, y, w, h, top = '#2b3236', bot = '#1a1f22') => P.fillV(g, x, y, w, h, [[0, top], [1, bot]]);
    conc(162, 350, 386, 250, '#262c30', '#171b1e');
    P.speckle(g, 7, 162, 350, 386, 250, 1600, '#000', 0.35);
    P.speckle(g, 8, 162, 350, 386, 250, 600, '#6a747a', 0.15);
    // мозаика-солнце
    const cx = 355, cy = 488;
    const rr = rng(17);
    for (let ring = 0; ring < 5; ring++) {
      const rad = 22 + ring * 15;
      const n = 10 + ring * 7;
      for (let i = 0; i < n; i++) {
        const a = Math.PI + (i / (n - 1)) * Math.PI;
        const x = cx + Math.cos(a) * rad, y = cy + Math.sin(a) * rad;
        const cols = ['#7d5a3a', '#8a6a3c', '#3b5a5a', '#5a3a2e', '#6b6a4a'];
        g.fillStyle = hex(cols[(ring + i) % cols.length], 0.55 + rr() * 0.25);
        g.fillRect(x - 5, y - 5, 9 + rr() * 2, 9 + rr() * 2);
      }
    }
    g.fillStyle = hex('#9a7a3c', 0.6);
    g.beginPath();
    g.arc(cx, cy, 16, Math.PI, 0);
    g.fill();
    // волны под солнцем
    g.strokeStyle = hex('#3b5a5a', 0.6);
    g.lineWidth = 5;
    for (let k = 0; k < 3; k++) {
      g.beginPath();
      for (let x = 250; x <= 460; x += 4) g.lineTo(x, cy + 14 + k * 12 + Math.sin(x * 0.08 + k) * 3);
      g.stroke();
    }
    // трещина и надпись
    g.strokeStyle = 'rgba(0,0,0,.6)';
    g.lineWidth = 1.2;
    g.beginPath();
    g.moveTo(420, 352);
    g.lineTo(412, 390);
    g.lineTo(424, 430);
    g.lineTo(416, 470);
    g.stroke();
    P.text(g, 'ТИХИЙ ОМУТ', 355, 377, { font: '700 13px "PT Serif",serif', color: 'rgba(180,185,180,.35)', ls: 4 });
    // объявление «Заря»
    g.save();
    g.translate(188, 404);
    g.rotate(-0.04);
    g.fillStyle = '#b9b29d';
    g.fillRect(0, 0, 62, 74);
    g.fillStyle = 'rgba(60,40,20,.25)';
    g.fillRect(0, 50, 62, 24);
    P.text(g, 'ГОСТИНИЦА', 31, 12, { font: '700 8px "PT Serif",serif', color: '#3a2a1a' });
    P.text(g, '«ЗАРЯ»', 31, 25, { font: '700 13px "PT Serif",serif', color: '#7a2a1a' });
    P.text(g, 'уют · тишина', 31, 38, { font: 'italic 7px "PT Serif",serif', color: '#3a2a1a' });
    P.text(g, 'тел. 2-13', 31, 60, { font: '700 9px "PT Serif",serif', color: '#2a1a10' });
    g.restore();
    // расписание
    g.fillStyle = '#c8c4b4';
    g.fillRect(470, 396, 58, 76);
    g.fillStyle = '#2a2a2a';
    P.text(g, 'РАСПИСАНИЕ', 499, 405, { font: '700 6.5px "PT Serif",serif', color: '#222' });
    for (let i = 0; i < 8; i++) {
      g.fillStyle = 'rgba(30,30,30,.55)';
      g.fillRect(476, 414 + i * 6.5, 46, 1.4);
      if (i !== 6) {
        g.fillStyle = 'rgba(120,20,20,.8)';
        g.fillRect(474, 414.5 + i * 6.5, 50, 0.9);
      }
    }
    g.strokeStyle = 'rgba(20,20,20,.75)';
    g.lineWidth = 1.2;
    g.beginPath();
    for (let x = 474; x < 524; x += 5) g.lineTo(x, 466 + (x % 2 ? -2 : 2));
    g.stroke();
    // скамейка
    g.fillStyle = '#0c0f11';
    g.fillRect(222, 522, 260, 9);
    g.fillRect(222, 500, 260, 7);
    g.fillRect(234, 531, 7, 64);
    g.fillRect(462, 531, 7, 64);
    g.fillStyle = 'rgba(160,180,175,.12)';
    g.fillRect(222, 522, 260, 2);
    // боковая стенка и колонна
    conc(146, 350, 20, 252, '#1d2225', '#101315');
    conc(540, 352, 18, 248, '#2c3337', '#14181a');
    // крыша-плита
    P.fillV(g, 128, 326, 462, 28, [[0, '#3a4246'], [0.4, '#2a3034'], [1, '#121618']]);
    g.fillStyle = 'rgba(0,0,0,.5)';
    g.fillRect(128, 352, 462, 4);
    // лампа дневного света
    g.fillStyle = '#1a1f22';
    g.fillRect(268, 355, 170, 6);
    // тень под павильоном
    g.fillStyle = 'rgba(0,0,0,.35)';
    g.fillRect(140, 596, 430, 16);

    // ---- таксофон ----
    const bx = 612, by = 420, bw = 78, bh = 192;
    g.fillStyle = '#3a110e';
    g.fillRect(bx, by, bw, bh);
    g.fillStyle = '#120708';
    g.fillRect(bx + 6, by + 22, bw - 12, bh - 30);
    for (let i = 0; i < 3; i++) {
      g.fillStyle = P.vgrad(g, by + 24 + i * 52, by + 70 + i * 52, [[0, 'rgba(120,150,160,.18)'], [1, 'rgba(60,80,90,.06)']]);
      g.fillRect(bx + 9, by + 25 + i * 54, bw - 18, 48);
    }
    g.fillStyle = '#5a1a14';
    g.fillRect(bx - 3, by - 4, bw + 6, 20);
    P.text(g, 'ТЕЛЕФОН', bx + bw / 2, by + 6, { font: '700 9px "PT Serif",serif', color: 'rgba(230,210,180,.75)', ls: 1 });
    // аппарат внутри
    g.fillStyle = '#2a2f33';
    g.fillRect(bx + 26, by + 70, 26, 36);
    g.fillStyle = '#0a0b0c';
    g.fillRect(bx + 22, by + 74, 6, 26);

    // ---- уличный фонарь ----
    g.fillStyle = '#07090b';
    g.fillRect(LAMP.x + 38, 300, 6, 312);
    g.lineWidth = 5;
    g.strokeStyle = '#07090b';
    g.beginPath();
    g.moveTo(LAMP.x + 41, 304);
    g.quadraticCurveTo(LAMP.x + 30, 290, LAMP.x + 4, 304);
    g.stroke();
    g.beginPath();
    g.moveTo(LAMP.x - 16, 312);
    g.lineTo(LAMP.x + 16, 312);
    g.lineTo(LAMP.x + 8, 302);
    g.lineTo(LAMP.x - 8, 302);
    g.fill();

    // ---- знак населённого пункта ----
    g.fillStyle = '#0a0d0f';
    g.fillRect(1052, 470, 5, 120);
    g.fillRect(1134, 470, 5, 120);
    g.fillStyle = '#9ea39f';
    g.fillRect(1030, 446, 130, 58);
    g.strokeStyle = '#141414';
    g.lineWidth = 3;
    g.strokeRect(1034, 450, 122, 50);
    P.text(g, 'ТИХИЙ', 1095, 466, { font: '700 16px "PT Serif",serif', color: '#151515', ls: 2 });
    P.text(g, 'ОМУТ', 1095, 486, { font: '700 16px "PT Serif",serif', color: '#151515', ls: 2 });
    // ржавые потёки
    for (let i = 0; i < 9; i++) {
      g.fillStyle = 'rgba(80,40,20,.25)';
      g.fillRect(1036 + i * 14, 500, 2, 4 + (i % 3) * 5);
    }
    g.fillStyle = 'rgba(0,0,0,.55)';
    g.fillRect(1030, 446, 130, 58);

    P.paper(g, 2, 0.08);
  }

  function staticFog(g, y, h, a) {
    const tex = P.fogTexture();
    g.save();
    g.globalAlpha = a;
    g.drawImage(tex, 0, y - h / 2, W, h);
    g.restore();
  }

  function front(g) {
    // берёза на переднем плане и трава
    P.birch(g, 26, 760, 820, 51, { w: 18, lean: 0.01, light: '#59615f', shade: '#121617', branch: '#040506' });
    const r = rng(61);
    g.fillStyle = '#030405';
    for (let i = 0; i < 160; i++) {
      const x = r() < 0.5 ? r() * 260 : 1080 + r() * 200;
      const h = 10 + r() * 40;
      g.beginPath();
      g.moveTo(x, 724);
      g.quadraticCurveTo(x + (r() - 0.5) * 20, 720 - h * 0.6, x + (r() - 0.5) * 16, 720 - h);
      g.lineTo(x + 3, 724);
      g.fill();
    }
  }

  function back(ctx, t) {
    const lamp = st.lamp;
    // лампа дневного света под крышей
    const tb = st.tube;
    if (tb > 0.05) {
      ctx.fillStyle = hex('#dff6ef', 0.9 * tb);
      ctx.fillRect(270, 356, 166, 3);
      P.eglow(ctx, TUBE.x, 362, 260, 150, '#a8d8cc', 0.22 * tb);
      P.cone(ctx, TUBE.x, 360, 200, 420, 245, '#9fd0c4', 0.22 * tb);
      P.eglow(ctx, TUBE.x, 600, 240, 22, '#9fd0c4', 0.12 * tb);
    }
    // натриевый фонарь
    P.glow(ctx, LAMP.x, 314, 46, '#ffd29a', 0.9 * lamp);
    P.glow(ctx, LAMP.x, 330, 260, '#ff9a48', 0.22 * lamp);
    P.cone(ctx, LAMP.x, 314, 30, 330, 300, '#ffa457', 0.3 * lamp);
    P.eglow(ctx, LAMP.x, 616, 230, 30, '#ff9a48', 0.2 * lamp);
    // отражения в лужах и на мокром асфальте
    P.streak(ctx, LAMP.x, 620, 34, 100, '#ffa457', 0.45 * lamp, 3, t);
    P.streak(ctx, TUBE.x, 622, 70, 70, '#9fd0c4', 0.12 * tb, 4, t);
    P.streak(ctx, 1210, 620, 50, 40, '#ff9d4f', 0.08, 5, t);
    // свет в таксофоне
    P.glow(ctx, 651, 440, 40, '#ffe0a0', 0.18);
    // Тихий в лесу при вспышке молнии
    if (st.tallA > 0.01) {
      OM.Actors.tall(ctx, { x: 1185, y: 478, s: 0.27, face: -1, alpha: st.tallA, jitter: 2, body: '#020304' }, t);
    }
  }

  function over(ctx, t) {
    P.fogBand(ctx, t + 40, 640, 80, -6, 0.16);
  }

  OM.scene('busstop', {
    name: 'Остановка',
    surface: 'wet',
    figLight: { amb: 0.34, tint: '#2a3a48' },
    lightning: true,
    amb: { rain: 1, wind: 0.6, drone: 0.25 },
    walk: [[90, 618], [1275, 618], [1275, 708], [90, 708]],
    depth: { y0: 618, s0: 0.98, y1: 708, s1: 1.12 },
    entries: {
      default: { x: 760, y: 640, face: 1 },
      intro: { x: 700, y: 622, face: 1 },
      street: { x: 1230, y: 660, face: -1 },
    },
    lights: [
      { x: LAMP.x, y: 314, color: '#ffae5a', a: 1, reach: 460, flicker: () => st.lamp },
      { x: TUBE.x, y: 360, color: '#bfe8dc', a: 0.75, reach: 320, flicker: () => st.tube },
    ],
    rain: {
      n: 460,
      base: 0.1,
      ground: [600, 720],
      mask: (x, y) => x > 130 && x < 590 && y > 326 && y < 600,
    },
    rainLights: [
      { x: LAMP.x, y: 420, rx: 170, ry: 260, a: 0.55 },
      { x: TUBE.x, y: 520, rx: 300, ry: 200, a: 0.12 },
    ],
    paint,
    front,
    back,
    over,
    update(dt, t) {
      // мерцание: лампа дневного света нервно моргает, фонарь иногда «вздрагивает»
      st.tube = Math.random() < 0.012 ? 0.1 : st.tube < 1 ? Math.min(1, st.tube + dt * (Math.random() < 0.5 ? 9 : 1)) : 1;
      if (Math.sin(t * 0.7) > 0.995 && Math.random() < 0.3) st.lamp = 0.4;
      st.lamp = Math.min(1, st.lamp + dt * 2);
      st.tallA = Math.max(0, Math.min(st.tallA, G.fx.flash * 1.6));
    },
    onBolt() {
      if (OM.flag('tallBus') === 'show') {
        st.tallA = 1;
      }
    },
    hotspots: [
      {
        id: 'forest', name: 'Лес', rect: [0, 380, 1280, 120],
        look: () => (OM.flag('sawTall') ? say('Там кто-то стоял. Высокий. Слишком высокий для человека.') : say('Ельник. Чёрный, как дёготь. Пахнет мокрой хвоей и болотом.')),
      },
      { id: 'lights', name: 'Огни города', rect: [1150, 430, 130, 50], look: 'Огни. Значит, город и правда рядом. Полкилометра, не больше.' },
      { id: 'sign', name: 'Знак «Тихий Омут»', rect: [1025, 440, 140, 70], walk: [1090, 625], face: 1, look: ['«Тихий Омут». В тихом омуте…', 'Ладно. Не буду.'] },
      {
        id: 'shelter', name: 'Остановка', rect: [160, 350, 390, 150], look: [
          'Бетонный павильон с мозаикой. Солнце встаёт над водой.',
          'Таких остановок по стране тысячи. И под каждой — одна и та же лужа.',
        ],
      },
      {
        id: 'bench', name: 'Скамейка', rect: [215, 495, 275, 45], walk: [350, 625], face: -1,
        look: 'Скамейка мокрая насквозь. Крыша протекает ровно над ней.',
        use: () => say('Посидеть бы… Нет. Если сяду — усну, а утром меня найдут вместе с этой скамейкой.'),
      },
      {
        id: 'poster', name: 'Объявление', rect: [184, 398, 70, 82], walk: [225, 624], face: -1,
        look: async () => {
          await say('«Гостиница „Заря“. Уют и тишина. Телефон 2-13».');
          if (!OM.flag('knowNumber')) {
            OM.flag('knowNumber', 1);
            await say('Два-тринадцать. Запомню.');
          }
        },
      },
      {
        id: 'schedule', name: 'Расписание', rect: [466, 392, 66, 84], walk: [500, 624], face: 1,
        look: [
          'Расписание. Все рейсы перечёркнуты красным, кроме одного — моего.',
          'А внизу кто-то нацарапал гвоздём: «НЕ СМОТРИ ИМ В ЛИЦО».',
          'Местный юмор, надо полагать.',
        ],
      },
      {
        id: 'phone', name: 'Таксофон', rect: [606, 414, 90, 198], walk: [652, 624], face: 1,
        look: 'Таксофон. Стекло целое, трубка на месте. В наше время — почти чудо.',
        use: () => usePhone(),
        items: { token: () => usePhone(true) },
      },
      {
        id: 'puddle', name: 'Лужа', rect: [690, 650, 290, 38], walk: [800, 650], face: 1,
        look: () => (OM.flag('gotToken') ? say('Лужа. В ней отражается фонарь. И я. Ничего интересного.') : say('В луже, в отражении фонаря, что-то блестит.')),
        use: async () => {
          if (OM.flag('gotToken')) return say('Больше там ничего нет. Только холодная вода.');
          OM.flag('gotToken', 1);
          await say('Жетон для таксофона. Кто-то обронил. Или оставил.');
          OM.give('token');
        },
      },
      {
        id: 'lamp', name: 'Фонарь', rect: [826, 290, 64, 320], walk: [870, 628], face: -1,
        look: 'Фонарь гудит, как трансформаторная будка. Единственная живая душа на этой остановке.',
      },
      {
        id: 'exit', name: 'Дорога в город', rect: [1210, 520, 70, 200], walk: [1262, 660], exit: { to: 'street', entry: 'left', dir: 'right' },
      },
    ],
    setup(entry) {
      st.tallA = 0;
    },
    async enter(entry) {
      if (entry === 'intro') await OM.story.intro(st);
    },
  });

  async function usePhone(withToken) {
    if (OM.flag('called')) return say('Больше не хочу туда звонить. Да и жетона нет.');
    if (!OM.has('token')) {
      G.hero.pose = 'phone';
      S.phone('dial');
      await OM.wait(900);
      S.phone(null);
      G.hero.pose = null;
      return say('Гудок есть. А жетона нет. Таксофон без жетона — просто будка.');
    }
    if (!OM.flag('knowNumber')) return say('Жетон есть. Но куда звонить? Номеров в этом городе я не знаю.');
    await OM.story.phoneCall();
  }
})();
