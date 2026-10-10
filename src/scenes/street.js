// Сцена 2. Набережная улица: гостиница «Заря», магазин, киоск, ворота лодочной станции.
(function () {
  const P = OM.P, S = OM.S, G = OM.G;
  const { hex, rng, W } = OM;
  const say = (t) => OM.say('lev', t);

  const LAMP = { x: 628, y: 300 };
  const st = { lamp: 1, neon: 1, ya: 1, cat: 0, tallA: 0, nextFlicker: 8 };
  const NEON = 'ГОСТИНИЦА «ЗАРЯ»';

  function paint(g) {
    P.fillV(g, 0, 0, W, 470, [[0, '#04070c'], [0.5, '#0b1520'], [1, '#1b2833']]);
    P.clouds(g, 31, { y0: 30, y1: 220, n: 15, color: '#0a121a', a: 0.8, size: [120, 300] });
    P.clouds(g, 32, { y0: 200, y1: 380, n: 10, color: '#22323d', a: 0.3, size: [140, 280] });
    // водонапорная башня
    g.fillStyle = '#0a1015';
    g.beginPath();
    g.moveTo(960, 470);
    g.lineTo(972, 210);
    g.lineTo(1018, 210);
    g.lineTo(1030, 470);
    g.fill();
    P.rrect(g, 942, 150, 106, 66, 6);
    g.fill();
    g.beginPath();
    g.moveTo(936, 152);
    g.lineTo(995, 112);
    g.lineTo(1054, 152);
    g.fill();
    g.fillStyle = hex('#ff3b2a', 0.9);
    g.fillRect(993, 106, 4, 4);
    P.glow(g, 995, 108, 20, '#ff3b2a', 0.6);
    // дальние дома
    const r = rng(7);
    let x = -20;
    while (x < W) {
      const w = 60 + r() * 90, h = 70 + r() * 90;
      g.fillStyle = '#0c1318';
      g.fillRect(x, 470 - h, w, h + 40);
      g.beginPath();
      g.moveTo(x - 6, 470 - h);
      g.lineTo(x + w / 2, 470 - h - 26 - r() * 14);
      g.lineTo(x + w + 6, 470 - h);
      g.fill();
      if (r() < 0.35) P.window(g, x + w * 0.3, 470 - h + 20, 14, 18, { lit: '#ffb466', a: 0.7, frame: '#0c1318', ft: 2 });
      x += w + 6;
    }
    P.forest(g, 33, { yb: 470, hMin: 30, hMax: 70, color: '#0d151b', step: [10, 18] });
    // туман у озера справа
    P.fillV(g, 0, 380, W, 140, [[0, 'rgba(120,150,165,0)'], [1, 'rgba(120,150,165,.18)']]);
    P.glow(g, 1210, 470, 220, '#8fb0c0', 0.1);

    // ---- гостиница ----
    P.fillV(g, 80, 222, 540, 396, [[0, '#2a241f'], [0.6, '#211c18'], [1, '#141110']]);
    P.speckle(g, 34, 80, 222, 540, 396, 2500, '#000', 0.35);
    P.speckle(g, 35, 80, 222, 540, 396, 900, '#6a5a4a', 0.12);
    // потёки
    for (let i = 0; i < 26; i++) {
      const xx = 90 + r() * 520;
      g.fillStyle = P.vgrad(g, 230, 230 + 60 + r() * 140, [[0, 'rgba(0,0,0,.35)'], [1, 'rgba(0,0,0,0)']]);
      g.fillRect(xx, 230, 2 + r() * 5, 200);
    }
    // карниз и пилястры
    P.fillV(g, 70, 206, 560, 20, [[0, '#3a332c'], [1, '#191512']]);
    P.fillV(g, 74, 390, 552, 12, [[0, '#33302a'], [1, '#161311']]);
    [80, 600].forEach((px) => P.fillV(g, px, 222, 20, 396, [[0, '#302925'], [1, '#121010']]));
    // окна второго этажа
    const up = [
      { lit: '#ffbf73', curtain: '#7a3020' },
      null,
      { lit: '#ff9c4a', curtain: '#5a2a1a', silhouette: true },
      null,
      { lit: '#e7c98f', curtain: '#4a3a2a', a: 0.5 },
    ];
    up.forEach((o, i) => {
      const wx = 120 + i * 96;
      P.window(g, wx, 266, 52, 80, o ? Object.assign({ frame: '#0b0908' }, o) : { frame: '#0b0908', dark: '#0d1216' });
      g.fillStyle = '#2e2823';
      g.fillRect(wx - 8, 346, 68, 6);
    });
    // окна холла
    [130, 430].forEach((wx) => {
      P.window(g, wx, 430, 120, 100, { lit: '#ffb565', curtain: '#6a2a18', frame: '#0b0908', ft: 4 });
      g.fillStyle = '#2e2823';
      g.fillRect(wx - 10, 530, 140, 8);
    });
    // вход
    g.fillStyle = '#0a0807';
    g.fillRect(300, 446, 110, 172);
    P.fillV(g, 312, 458, 86, 160, [[0, hex('#ffb565', 0.55)], [1, hex('#ff9a40', 0.75)]]);
    g.fillStyle = '#0a0807';
    g.fillRect(352, 458, 6, 160);
    g.fillRect(312, 520, 86, 5);
    P.glow(g, 355, 540, 150, '#ffaa55', 0.18);
    // козырёк
    g.fillStyle = '#16120f';
    g.beginPath();
    g.moveTo(280, 438);
    g.lineTo(430, 438);
    g.lineTo(440, 446);
    g.lineTo(270, 446);
    g.fill();
    // ступени
    P.fillV(g, 286, 612, 138, 10, [[0, '#3a332c'], [1, '#1a1612']]);
    // табличка
    g.fillStyle = '#18130f';
    g.fillRect(430, 470, 50, 30);
    P.text(g, 'ЗАРЯ', 455, 485, { font: '700 8px "PT Serif",serif', color: '#c9a46a' });
    // каркас вывески на крыше
    g.strokeStyle = '#090807';
    g.lineWidth = 2;
    for (let i = 0; i < 12; i++) {
      g.beginPath();
      g.moveTo(130 + i * 40, 206);
      g.lineTo(140 + i * 40, 150);
      g.stroke();
    }
    g.beginPath();
    g.moveTo(120, 182);
    g.lineTo(590, 182);
    g.stroke();

    // ---- магазин «Продукты» ----
    P.fillV(g, 650, 392, 280, 226, [[0, '#1c2326'], [1, '#0f1315']]);
    P.speckle(g, 36, 650, 392, 280, 226, 1200, '#000', 0.4);
    g.fillStyle = '#0e1214';
    g.fillRect(642, 380, 296, 16);
    g.fillStyle = '#26383a';
    g.fillRect(670, 404, 240, 34);
    P.text(g, 'ПРОДУКТЫ', 790, 421, { font: '700 20px "PT Serif",serif', color: '#7fa6a0', ls: 6 });
    // рольставня
    P.fillV(g, 680, 456, 150, 100, [[0, '#2c3133'], [1, '#191c1e']]);
    for (let y = 458; y < 556; y += 5) {
      g.fillStyle = 'rgba(0,0,0,.45)';
      g.fillRect(680, y, 150, 1.4);
    }
    g.fillStyle = '#0c0e0f';
    g.fillRect(674, 556, 162, 8);
    // дверь магазина
    g.fillStyle = '#0d1011';
    g.fillRect(850, 470, 60, 148);
    g.fillStyle = '#c4bca8';
    g.fillRect(862, 500, 36, 24);
    P.text(g, 'УШЛА', 880, 507, { font: '700 6px "PT Serif",serif', color: '#2a2a2a' });
    P.text(g, 'НА БАЗУ', 880, 516, { font: '700 6px "PT Serif",serif', color: '#2a2a2a' });

    // ---- киоск «Печать» ----
    P.fillV(g, 950, 476, 96, 142, [[0, '#22303a'], [1, '#121a20']]);
    g.fillStyle = '#101820';
    g.fillRect(944, 464, 108, 16);
    P.text(g, 'ПЕЧАТЬ', 998, 472, { font: '700 10px "PT Serif",serif', color: '#8fb0c8', ls: 3 });
    g.fillStyle = hex('#5a7080', 0.25);
    g.fillRect(958, 488, 80, 62);
    // газеты за стеклом
    [[962, 494, '#b8b0a0'], [990, 500, '#a8a090'], [1012, 492, '#c0b8a6']].forEach(([gx, gy, c]) => {
      g.fillStyle = hex(c, 0.6);
      g.fillRect(gx, gy, 22, 30);
      g.fillStyle = 'rgba(20,20,20,.5)';
      g.fillRect(gx + 2, gy + 3, 18, 3);
    });
    P.glow(g, 998, 520, 60, '#9fc0d8', 0.06);

    // ---- забор и ворота лодочной станции ----
    const fr = rng(37);
    for (let fx = 1066; fx < W + 10; fx += 13) {
      if (fx > 1146 && fx < 1238) continue;
      const fh = 118 + fr() * 14;
      g.fillStyle = fr() < 0.5 ? '#0e1215' : '#0b0e10';
      g.beginPath();
      g.moveTo(fx, 618);
      g.lineTo(fx, 618 - fh);
      g.lineTo(fx + 5, 618 - fh - 6);
      g.lineTo(fx + 11, 618 - fh);
      g.lineTo(fx + 11, 618);
      g.fill();
    }
    g.fillStyle = '#090b0c';
    g.fillRect(1060, 520, 220, 6);
    g.fillRect(1060, 580, 220, 6);
    // столбы ворот
    g.fillRect(1140, 470, 9, 150);
    g.fillRect(1236, 470, 9, 150);
    // вывеска
    g.fillStyle = '#c9c2ae';
    g.fillRect(1126, 438, 134, 30);
    g.strokeStyle = '#1c1c1c';
    g.lineWidth = 1.5;
    g.strokeRect(1129, 441, 128, 24);
    P.text(g, 'ЛОДОЧНАЯ СТАНЦИЯ', 1193, 453, { font: '700 9px "PT Serif",serif', color: '#222', ls: 1 });
    g.fillStyle = 'rgba(0,0,0,.5)';
    g.fillRect(1126, 438, 134, 30);
    // за воротами — туман над водой
    P.fillV(g, 1149, 470, 87, 148, [[0, 'rgba(120,150,160,.25)'], [1, 'rgba(60,80,90,.15)']]);

    // ---- фонарь ----
    g.fillStyle = '#07090b';
    g.fillRect(LAMP.x - 3, LAMP.y, 6, 620 - LAMP.y);
    g.fillRect(LAMP.x - 8, 600, 16, 20);
    g.beginPath();
    g.moveTo(LAMP.x - 14, LAMP.y + 10);
    g.lineTo(LAMP.x + 14, LAMP.y + 10);
    g.lineTo(LAMP.x + 6, LAMP.y - 4);
    g.lineTo(LAMP.x - 6, LAMP.y - 4);
    g.fill();

    // ---- тротуар и мостовая ----
    P.fillV(g, 0, 616, W, 22, [[0, '#2b2c2c'], [1, '#18191a']]);
    g.fillStyle = '#0b0c0d';
    g.fillRect(0, 636, W, 4);
    P.fillV(g, 0, 640, W, 80, [[0, '#121416'], [1, '#08090a']]);
    // брусчатка
    const br = rng(38);
    for (let y = 646; y < 720; y += 9 + (y - 640) * 0.08) {
      const h = 6 + (y - 640) * 0.07;
      let off = br() * 20;
      for (let x = -off; x < W; x += 26 + (y - 640) * 0.25) {
        g.fillStyle = hex('#2a2e30', 0.15 + br() * 0.2);
        g.fillRect(x, y, 22 + (y - 640) * 0.2, h);
      }
    }
    P.paper(g, 3, 0.08);
  }

  function front(g) {
    const r = rng(71);
    g.fillStyle = '#030405';
    for (let i = 0; i < 90; i++) {
      const x = 1100 + r() * 200, h = 10 + r() * 34;
      g.beginPath();
      g.moveTo(x, 724);
      g.quadraticCurveTo(x + (r() - 0.5) * 16, 720 - h * 0.6, x + (r() - 0.5) * 14, 720 - h);
      g.lineTo(x + 3, 724);
      g.fill();
    }
    // край водосточной трубы
    g.fillStyle = '#060707';
    g.fillRect(620, 220, 10, 400);
  }

  function back(ctx, t) {
    const L = st.lamp;
    // неоновая вывеска, буквы по отдельности
    ctx.save();
    ctx.font = '700 30px "PT Serif", Georgia, serif';
    ctx.textBaseline = 'middle';
    ctx.letterSpacing = '6px';
    let x = 128;
    for (let i = 0; i < NEON.length; i++) {
      const ch = NEON[i];
      const w = ctx.measureText(ch).width + 6;
      let on = st.neon;
      if (ch === 'Я') on *= st.ya;
      if (i === 3) on *= 0.15; // одна буква давно не горит
      if (ch !== ' ') {
        if (on > 0.2) {
          ctx.shadowColor = hex('#ff4a3a', 0.9 * on);
          ctx.shadowBlur = 18;
          ctx.fillStyle = hex('#ff8a78', 0.95 * on);
        } else {
          ctx.shadowBlur = 0;
          ctx.fillStyle = '#2a0e0c';
        }
        ctx.fillText(ch, x, 168);
      }
      x += w;
    }
    ctx.restore();
    P.eglow(ctx, 360, 170, 300, 60, '#ff3a2a', 0.16 * st.neon);
    // отражения в мостовой
    P.streak(ctx, 360, 642, 160, 70, '#ff4a3a', 0.12 * st.neon, 1, t);
    P.streak(ctx, 190, 640, 60, 80, '#ffb565', 0.18, 2, t);
    P.streak(ctx, 490, 640, 60, 80, '#ffb565', 0.18, 3, t);
    P.streak(ctx, 355, 640, 40, 80, '#ffaa55', 0.2, 4, t);
    // фонарь
    P.glow(ctx, LAMP.x, LAMP.y + 10, 44, '#ffd29a', 0.9 * L);
    P.glow(ctx, LAMP.x, LAMP.y + 30, 240, '#ff9a48', 0.2 * L);
    P.cone(ctx, LAMP.x, LAMP.y + 10, 28, 320, 310, '#ffa457', 0.28 * L);
    P.eglow(ctx, LAMP.x, 640, 220, 26, '#ff9a48', 0.18 * L);
    P.streak(ctx, LAMP.x, 642, 30, 78, '#ffa457', 0.4 * L, 5, t);
    // ворота: открыты или закрыты
    const open = OM.flag('gateOpen');
    ctx.fillStyle = '#0c0f11';
    if (!open) {
      for (let gx = 1150; gx < 1236; gx += 12) ctx.fillRect(gx, 488, 8, 130);
      ctx.fillRect(1148, 500, 90, 6);
      ctx.fillRect(1148, 590, 90, 6);
      ctx.fillStyle = '#3a3428';
      ctx.fillRect(1186, 540, 12, 14);
    } else {
      ctx.beginPath();
      ctx.moveTo(1149, 488);
      ctx.lineTo(1120, 500);
      ctx.lineTo(1120, 630);
      ctx.lineTo(1149, 618);
      ctx.fill();
      P.glow(ctx, 1192, 560, 80, '#9fc0d0', 0.08);
    }
    // Тихий за воротами — виден только когда мигает фонарь (после видения)
    if (st.tallA > 0.01) OM.Actors.tall(ctx, { x: 1200, y: 640, s: 0.42, face: -1, alpha: st.tallA, jitter: 1.5, body: '#05080a' }, t);
    // кошка на подоконнике
    ctx.fillStyle = '#050606';
    ctx.beginPath();
    ctx.ellipse(756, 548, 15, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(770, 537, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(765, 533);
    ctx.lineTo(767, 525);
    ctx.lineTo(771, 531);
    ctx.lineTo(775, 525);
    ctx.lineTo(776, 534);
    ctx.fill();
    ctx.strokeStyle = '#050606';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(742, 550);
    ctx.quadraticCurveTo(732, 560 + Math.sin(t * 1.3) * 4, 738, 572);
    ctx.stroke();
    const blink = (t % 4.3) < 0.15 ? 0 : 1;
    if (blink) {
      ctx.fillStyle = '#b8e070';
      ctx.fillRect(767 + st.cat, 536, 2.2, 1.6);
      ctx.fillRect(772 + st.cat, 536, 2.2, 1.6);
      P.glow(ctx, 771, 537, 10, '#b8e070', 0.3);
    }
  }

  function over(ctx, t) {
    P.fogBand(ctx, t, 560, 120, 7, 0.1);
    P.fogBand(ctx, t + 30, 660, 80, -5, 0.12);
  }

  OM.scene('street', {
    name: 'Набережная улица',
    surface: 'wet',
    figLight: { amb: 0.38, tint: '#3a3040' },
    lightning: true,
    amb: { rain: 0.9, wind: 0.5, drone: 0.3 },
    walk: [[30, 646], [1268, 646], [1268, 708], [30, 708]],
    depth: { y0: 646, s0: 0.84, y1: 708, s1: 0.94 },
    entries: {
      default: { x: 360, y: 660, face: 1 },
      left: { x: 50, y: 670, face: 1 },
      door: { x: 356, y: 652, face: 1 },
      gate: { x: 1192, y: 656, face: -1 },
    },
    lights: [
      { x: LAMP.x, y: LAMP.y + 10, color: '#ffae5a', a: 1, reach: 420, flicker: () => st.lamp },
      { x: 355, y: 520, color: '#ffb565', a: 0.8, reach: 240 },
      { x: 360, y: 170, color: '#ff5a4a', a: 0.35, reach: 520 },
    ],
    rain: { n: 420, base: 0.09, ground: [630, 720] },
    rainLights: [
      { x: LAMP.x, y: 430, rx: 160, ry: 260, a: 0.5 },
      { x: 360, y: 220, rx: 300, ry: 120, a: 0.18 },
    ],
    paint,
    front,
    back,
    over,
    update(dt, t) {
      st.lamp = Math.min(1, st.lamp + dt * 1.5);
      st.ya = Math.random() < 0.03 ? 0.1 : Math.min(1, st.ya + dt * 4);
      st.cat = OM.lerp(st.cat, OM.flag('vision') ? 2 : 0, dt * 2);
      st.nextFlicker -= dt;
      if (OM.flag('vision') && !OM.flag('saved') && st.nextFlicker <= 0) {
        st.nextFlicker = 7 + Math.random() * 6;
        st.lamp = 0.05;
        st.tallA = 1;
      }
      st.tallA = Math.max(0, st.tallA - dt * 1.4);
    },
    hotspots: [
      { id: 'tower', name: 'Водонапорная башня', rect: [935, 100, 120, 200], look: 'Водонапорная башня. Над ней мигает красный огонёк — для самолётов. Самолёты здесь, думаю, не летают с восемьдесят девятого.' },
      {
        id: 'neon', name: 'Вывеска «Заря»', rect: [110, 140, 500, 60],
        look: ['«ГОС ИНИЦА ЗАРЯ». Одна буква перегорела, а «Я» мигает, как будто сомневается.', 'Я её понимаю.'],
      },
      {
        id: 'windows', name: 'Окна второго этажа', rect: [110, 260, 480, 95],
        look: async () => {
          await say('В одном окне на втором этаже кто-то стоит за шторой. Неподвижно.');
          await say('Смотрит не на меня. На озеро.');
        },
      },
      { id: 'lobbywin', name: 'Окна холла', rect: [120, 420, 380, 120], look: 'Тёплый свет, фикус, стойка. Внутри определённо уютнее, чем снаружи.' },
      {
        id: 'hotel', name: 'Гостиница «Заря»', rect: [296, 440, 118, 180], walk: [356, 650], face: -1,
        exit: { to: 'lobby', entry: 'door', dir: 'up' },
      },
      { id: 'shop', name: 'Магазин «Продукты»', rect: [650, 395, 280, 60], look: 'Магазин «Продукты». Закрыт. На двери записка: «Ушла на базу». Судя по пыли — ушла в девяносто первом.' },
      {
        id: 'cat', name: 'Кошка', rect: [732, 520, 52, 48], walk: [760, 652], face: 1,
        look: () => (OM.flag('vision') ? say('Кошка не мигая смотрит на ворота лодочной станции. Шерсть дыбом.') : say('Чёрная кошка на подоконнике. Через дорогу не перебегала — уже хорошо.')),
        use: async () => {
          await say('Кис-кис-кис…');
          S.whisper(0.4, 0.05);
          await say('Даже ухом не повела. Смотрит мимо меня. В сторону воды.');
        },
      },
      {
        id: 'kiosk', name: 'Киоск «Печать»', rect: [944, 462, 106, 156], walk: [998, 652], face: -1,
        look: [
          'За стеклом — «Омутская правда». Заголовок: «Пропавшего рыболова ищут третью неделю».',
          'Ниже, мелко: «Водолазы обнаружили на дне… купол… прихожане…» Дальше размыто дождём.',
          'Изнутри размыто. Дождь тут ни при чём.',
        ],
      },
      { id: 'lamp', name: 'Фонарь', rect: [612, 290, 34, 330], look: 'Фонарь. Под ним даже дождь кажется теплее.' },
      {
        id: 'gate', name: 'Ворота лодочной станции', rect: [1120, 430, 140, 190], walk: [1192, 654], face: 1,
        exit: { to: 'pier', entry: 'gate', dir: 'right', when: () => OM.flag('gateOpen') },
        look: async () => {
          if (OM.flag('gateOpen')) return say('Ворота открыты. За ними — туман и вода.');
          S.lockRattle();
          if (!OM.flag('vision')) return OM.talk([['lev', 'Заперто. «Лодочная станция». Висячий замок размером с мою голову.'], ['lev', 'Да и что мне делать у воды ночью?']]);
          return say('Заперто! Ключ… Ключи в гостинице, на доске за стойкой.');
        },
        items: {
          boatkey: async () => {
            S.unlock();
            OM.take('boatkey');
            OM.flag('gateOpen', 1);
            OM.save();
            await say('Ключ провернулся со скрежетом. Открыто.');
          },
          umbrella: () => say('Зонтом замок не открыть. Это всё-таки не отмычка.'),
        },
      },
      { id: 'exitL', name: 'К остановке', rect: [0, 560, 40, 160], walk: [20, 672], exit: { to: 'busstop', entry: 'street', dir: 'left' } },
    ],
    async enter(entry) {
      if (entry === 'left' && !OM.flag('streetSeen')) {
        OM.flag('streetSeen', 1);
        await OM.wait(300);
        await say('А вот и «Заря». Горит не вся, но горит.');
      }
    },
  });
})();
