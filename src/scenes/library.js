// Глава 2. Читальный зал библиотеки ДК «Водник». Серый дневной свет из высоких окон.
(function () {
  const P = OM.P, S = OM.S, G = OM.G, A = OM.Actors;
  const { hex, rng, W, lerp } = OM;
  const say = (t) => OM.say('lev', t);

  const LAMPS = [{ x: 470, y: 112 }, { x: 790, y: 112 }];
  const KERO = { x: 618, y: 500 };
  const st = { power: 1, dust: [] };

  // Полка с книгами: корешки разной высоты, цвета, с полосками-тиснением.
  function shelfRow(g, x0, x1, yb, h, r) {
    const cols = ['#6a2a22', '#2a3a5a', '#3a5a3a', '#7a5a2a', '#5a3a4a', '#4a4a4a', '#8a7a5a', '#2a4a4a', '#6a4a2a', '#9a8a6a'];
    let x = x0;
    while (x < x1 - 4) {
      if (r() < 0.04) { x += 8 + r() * 14; continue; }
      const w = 6 + r() * 8;
      const bh = h * (0.7 + r() * 0.28);
      const c = cols[(r() * cols.length) | 0];
      const lean = r() < 0.06 ? 0.18 : 0;
      g.save();
      g.translate(x, yb);
      g.rotate(lean);
      P.fillV(g, 0, -bh, w, bh, [[0, OM.Fig.shade(c, 0.12)], [1, OM.Fig.shade(c, -0.2)]]);
      g.fillStyle = 'rgba(0,0,0,.25)';
      g.fillRect(w - 1.2, -bh, 1.2, bh);
      g.fillStyle = 'rgba(220,190,120,.55)';
      if (r() < 0.7) { g.fillRect(1, -bh + 6, w - 2, 1); g.fillRect(1, -bh + bh * 0.75, w - 2, 1); }
      if (r() < 0.4) g.fillRect(2, -bh + bh * 0.35, w - 4, 3);
      g.restore();
      x += w + 0.6;
    }
  }

  function bookcase(g, x, y, w, h, seed) {
    const r = rng(seed);
    P.fillV(g, x - 6, y - 10, w + 12, h + 14, [[0, '#5a3a22'], [1, '#3a2414']]);
    g.fillStyle = '#2a180c';
    g.fillRect(x, y, w, h);
    const rows = Math.floor(h / 62);
    for (let i = 0; i < rows; i++) {
      const yb = y + (i + 1) * (h / rows) - 4;
      g.fillStyle = 'rgba(0,0,0,.35)';
      g.fillRect(x, yb - h / rows + 4, w, 10);
      shelfRow(g, x + 3, x + w - 3, yb, h / rows - 12, r);
      P.fillV(g, x - 4, yb, w + 8, 7, [[0, '#7a5434'], [1, '#4a2e18']]);
      g.fillStyle = 'rgba(255,220,170,.12)';
      g.fillRect(x - 4, yb, w + 8, 1.2);
      // ярлычок раздела
      if (r() < 0.5) {
        g.fillStyle = '#e8e0c8';
        g.fillRect(x + w / 2 - 9, yb + 1.5, 18, 4.5);
      }
    }
    P.fillV(g, x - 8, y - 16, w + 16, 10, [[0, '#7a5434'], [1, '#4a2e18']]);
  }

  function paint(g) {
    // стены: панель масляной краской + побелка
    P.fillV(g, 0, 0, W, 380, [[0, '#cfc7b4'], [1, '#bdb4a0']]);
    P.fillV(g, 0, 380, W, 230, [[0, '#6f8a76'], [1, '#55705c']]);
    g.fillStyle = '#4a6250';
    g.fillRect(0, 376, W, 5);
    P.paper(g, 301, 0.1, 0, 0, W, 610);
    // потолок и лепной карниз
    P.fillV(g, 0, 0, W, 40, [[0, '#a8a090'], [1, '#c8c0ae']]);
    for (let x = 0; x < W; x += 18) {
      g.fillStyle = 'rgba(0,0,0,.08)';
      g.fillRect(x, 38, 9, 6);
    }
    // пол — паркет ёлочкой
    P.fillV(g, 0, 606, W, 114, [[0, '#7a5434'], [1, '#4a2e18']]);
    g.save();
    g.beginPath();
    g.rect(0, 606, W, 114);
    g.clip();
    g.strokeStyle = 'rgba(0,0,0,.22)';
    g.lineWidth = 1;
    for (let x = -200; x < W + 200; x += 26) {
      for (let y = 606; y < 730; y += 26) {
        g.beginPath();
        g.moveTo(x, y);
        g.lineTo(x + 13, y + 13);
        g.lineTo(x + 26, y);
        g.stroke();
      }
    }
    g.restore();
    g.fillStyle = 'rgba(0,0,0,.25)';
    g.fillRect(0, 604, W, 4);

    // ---- высокие окна слева: серый свет ----
    [70, 205].forEach((wx) => {
      g.fillStyle = '#e8e2d4';
      g.fillRect(wx - 8, 100, 116, 330);
      P.fillV(g, wx, 108, 100, 314, [[0, '#c8d0d4'], [0.5, '#a8b2b8'], [1, '#8a959c']]);
      // за окном — тополь и пятиэтажка
      g.fillStyle = 'rgba(120,128,132,.6)';
      g.fillRect(wx + 50, 200, 50, 222);
      for (let i = 0; i < 40; i++) {
        g.fillStyle = `rgba(${170 + i % 3 * 10},${140 + i % 5 * 6},60,.5)`;
        g.beginPath();
        g.ellipse(wx + 10 + (i * 37) % 60, 150 + (i * 53) % 200, 4, 3, i, 0, Math.PI * 2);
        g.fill();
      }
      g.fillStyle = '#e8e2d4';
      g.fillRect(wx + 48, 108, 4, 314);
      for (let y = 108; y < 422; y += 78) g.fillRect(wx, y, 100, 4);
      g.fillStyle = '#d8d0c0';
      g.fillRect(wx - 14, 428, 128, 10);
      // капли на стекле
      const r = rng(wx);
      g.fillStyle = 'rgba(255,255,255,.35)';
      for (let i = 0; i < 30; i++) g.fillRect(wx + r() * 100, 110 + r() * 300, 1.2, 2 + r() * 5);
      // занавески-тюль
      g.fillStyle = 'rgba(240,236,226,.35)';
      g.beginPath();
      g.moveTo(wx - 8, 100);
      g.quadraticCurveTo(wx + 20, 260, wx - 2, 430);
      g.lineTo(wx - 8, 430);
      g.fill();
    });
    // батарея под окнами
    for (let x = 80; x < 300; x += 7) {
      g.fillStyle = x % 14 ? '#c8c0b0' : '#a8a090';
      g.fillRect(x, 470, 5, 70);
    }
    g.fillStyle = 'rgba(0,0,0,.2)';
    g.fillRect(78, 538, 222, 4);

    // ---- стеллажи вдоль задней стены ----
    bookcase(g, 330, 150, 210, 440, 302);
    bookcase(g, 560, 150, 230, 300, 303);
    bookcase(g, 810, 150, 170, 440, 304);
    // таблички над стеллажами
    [[435, 'ХУДОЖЕСТВЕННАЯ'], [675, 'КРАЕВЕДЕНИЕ'], [895, 'ПЕРИОДИКА']].forEach(([x, s]) => {
      g.fillStyle = '#2a4a34';
      g.fillRect(x - 56, 120, 112, 18);
      P.text(g, s, x, 129, { font: '700 8.5px "PT Serif",serif', color: '#e8dcb8', ls: 1.5 });
    });
    // плакат «Тишина» и портрет писателя
    g.fillStyle = '#e8dcc0';
    g.fillRect(612, 470, 120, 0);
    g.fillStyle = '#d8ccb0';
    g.fillRect(1000, 160, 66, 86);
    g.fillStyle = '#3a2a1a';
    g.fillRect(1004, 164, 58, 78);
    g.fillStyle = '#c8b898';
    g.beginPath();
    g.ellipse(1033, 192, 13, 16, 0, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#2a1a10';
    g.beginPath();
    g.ellipse(1033, 182, 15, 9, 0, Math.PI, 0);
    g.fill();
    g.fillRect(1018, 210, 30, 30);
    g.fillStyle = '#b02a20';
    g.fillRect(1086, 170, 56, 26);
    P.text(g, 'ТИШИНА!', 1114, 183, { font: '700 9px "PT Serif",serif', color: '#f0e0c0', ls: 1 });

    // ---- карточный каталог ----
    P.fillV(g, 1000, 440, 120, 166, [[0, '#7a5232'], [1, '#4a2e18']]);
    for (let r2 = 0; r2 < 6; r2++) for (let c2 = 0; c2 < 4; c2++) {
      const x = 1006 + c2 * 28, y = 448 + r2 * 24;
      g.fillStyle = '#6a4428';
      g.fillRect(x, y, 25, 21);
      g.fillStyle = '#e8e0c8';
      g.fillRect(x + 7, y + 4, 11, 5);
      g.fillStyle = '#c9a050';
      g.fillRect(x + 9, y + 12, 7, 3);
    }

    // ---- дверь в архив ----
    P.fillV(g, 1150, 330, 110, 278, [[0, '#4a4438'], [1, '#2a261e']]);
    P.fillV(g, 1160, 340, 90, 266, [[0, '#5a4630'], [1, '#3a2a1a']]);
    g.strokeStyle = 'rgba(0,0,0,.4)';
    g.lineWidth = 2;
    g.strokeRect(1170, 352, 70, 110);
    g.strokeRect(1170, 474, 70, 120);
    g.fillStyle = '#9a9a92';
    g.fillRect(1234, 470, 8, 18);
    g.fillStyle = '#e0d8c0';
    g.fillRect(1176, 300, 80, 26);
    P.text(g, 'АРХИВ', 1216, 309, { font: '700 9px "PT Serif",serif', color: '#3a2a1a', ls: 2 });
    P.text(g, 'посторонним вход воспрещён', 1216, 319, { font: 'italic 5.5px "PT Serif",serif', color: '#5a3a2a' });
    // разводы сырости у двери
    g.fillStyle = 'rgba(60,70,50,.18)';
    g.beginPath();
    g.ellipse(1150, 580, 40, 60, 0, 0, Math.PI * 2);
    g.fill();

    // ---- часы над каталогом ----
    g.fillStyle = '#3a2a1a';
    g.beginPath();
    g.arc(1060, 70, 26, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#ece4d0';
    g.beginPath();
    g.arc(1060, 70, 22, 0, Math.PI * 2);
    g.fill();
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      g.fillStyle = '#2a2018';
      g.fillRect(1060 + Math.cos(a) * 18 - 1, 70 + Math.sin(a) * 18 - 1, 2, 2);
    }

    // ---- читальный стол слева ----
    P.fillV(g, 60, 540, 230, 14, [[0, '#7a5434'], [1, '#4a2e18']]);
    g.fillStyle = '#3a2414';
    g.fillRect(70, 554, 8, 52);
    g.fillRect(272, 554, 8, 52);
    // подшивка газет на столе и зелёная лампа
    g.fillStyle = '#d8d0b8';
    g.fillRect(120, 530, 70, 10);
    g.fillStyle = 'rgba(30,30,30,.4)';
    for (let i = 0; i < 6; i++) g.fillRect(124, 532 + (i % 2) * 3, 60 - i * 6, 1);
    g.fillStyle = '#8a6a34';
    g.fillRect(232, 534, 16, 6);
    g.fillRect(238, 512, 3, 22);
    g.fillStyle = '#1f5a3a';
    g.beginPath();
    g.moveTo(222, 514);
    g.quadraticCurveTo(240, 500, 258, 514);
    g.fill();
    // стул
    g.fillStyle = '#4a2e18';
    g.fillRect(300, 560, 40, 6);
    g.fillRect(334, 500, 6, 106);
    g.fillRect(302, 566, 5, 40);
    // фикус в кадке
    P.fillV(g, 940, 560, 46, 46, [[0, '#6a4a2a'], [1, '#3a2a18']]);
    const fr = rng(305);
    for (let i = 0; i < 22; i++) {
      g.fillStyle = fr() < 0.5 ? '#2a4a2a' : '#3a5a32';
      g.save();
      g.translate(963 + (fr() - 0.5) * 50, 470 + fr() * 90);
      g.rotate(fr() * 3);
      g.beginPath();
      g.ellipse(0, 0, 14, 6, 0, 0, Math.PI * 2);
      g.fill();
      g.restore();
    }
    // подвесные лампы: провод и абажур
    LAMPS.forEach((L) => {
      g.strokeStyle = '#3a3a36';
      g.lineWidth = 1.5;
      g.beginPath();
      g.moveTo(L.x, 40);
      g.lineTo(L.x, L.y - 14);
      g.stroke();
      g.fillStyle = '#e8e4d8';
      g.beginPath();
      g.moveTo(L.x - 34, L.y);
      g.quadraticCurveTo(L.x, L.y - 30, L.x + 34, L.y);
      g.closePath();
      g.fill();
      g.fillStyle = 'rgba(0,0,0,.15)';
      g.fillRect(L.x - 34, L.y - 2, 68, 2);
    });
  }

  function deskLayer(g) {
    // кафедра выдачи
    P.fillV(g, 520, 516, 300, 96, [[0, '#6a4428'], [1, '#3a2414']]);
    const r = rng(306);
    for (let x = 524; x < 816; x += 5) {
      g.fillStyle = `rgba(${r() < 0.5 ? '0,0,0' : '255,220,170'},${0.03 + r() * 0.05})`;
      g.fillRect(x, 516, 3, 96);
    }
    g.strokeStyle = 'rgba(0,0,0,.35)';
    g.lineWidth = 2;
    g.strokeRect(540, 530, 120, 70);
    g.strokeRect(680, 530, 120, 70);
    P.fillV(g, 510, 502, 320, 16, [[0, '#8a6038'], [1, '#4a2e18']]);
    g.fillStyle = 'rgba(255,220,170,.2)';
    g.fillRect(510, 502, 320, 1.5);
    // на кафедре: штемпель, формуляры, стопка книг
    g.fillStyle = '#e8e0cc';
    g.fillRect(690, 494, 50, 8);
    g.fillStyle = '#2a2a2a';
    g.fillRect(752, 486, 10, 16);
    g.fillStyle = '#8a2a20';
    g.fillRect(750, 482, 14, 6);
    [['#2a3a5a', 0], ['#6a2a22', 9], ['#3a5a3a', 17]].forEach(([c, dy]) => {
      g.fillStyle = c;
      g.fillRect(770 - dy * 0.3, 492 - dy, 44, 9);
      g.fillStyle = '#e8e0cc';
      g.fillRect(811 - dy * 0.3, 493 - dy, 2, 7);
    });
    g.fillStyle = 'rgba(0,0,0,.35)';
    g.fillRect(512, 610, 316, 8);
  }

  function back(ctx, t) {
    const pw = st.power;
    // дневной свет из окон: косые лучи с пылинками
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    [120, 255].forEach((x, i) => {
      ctx.fillStyle = P.hgrad(ctx, x, x + 420, [[0, 'rgba(200,215,225,.10)'], [1, 'rgba(200,215,225,0)']]);
      ctx.beginPath();
      ctx.moveTo(x - 50, 110);
      ctx.lineTo(x + 50, 110);
      ctx.lineTo(x + 420, 606);
      ctx.lineTo(x + 230, 606);
      ctx.fill();
    });
    ctx.restore();
    for (let i = 0; i < 26; i++) {
      const k = (t * 0.02 + i * 0.137) % 1;
      const x = 150 + ((i * 97) % 380) + k * 60, y = 200 + ((i * 61) % 360) + Math.sin(t + i) * 6;
      ctx.fillStyle = `rgba(255,250,235,${0.25 * Math.sin(k * Math.PI)})`;
      ctx.fillRect(x, y, 1.6, 1.6);
    }
    // электрические лампы
    if (pw > 0.02) {
      LAMPS.forEach((L) => {
        P.glow(ctx, L.x, L.y + 4, 260, '#ffe4b0', 0.12 * pw);
        P.cone(ctx, L.x, L.y, 66, 380, 480, '#fff0d0', 0.12 * pw);
        ctx.fillStyle = `rgba(255,245,220,${0.9 * pw})`;
        ctx.beginPath();
        ctx.ellipse(L.x, L.y + 1, 18, 4, 0, 0, Math.PI * 2);
        ctx.fill();
      });
    }
    // часы: 14:50 (после отключения — 15:02)
    const time = st.power < 0.5 ? 15 * 60 + 2 : 14 * 60 + 50;
    const hA = (((time / 60) % 12) / 12) * Math.PI * 2 - Math.PI / 2, mA = ((time % 60) / 60) * Math.PI * 2 - Math.PI / 2;
    ctx.strokeStyle = '#1a1210';
    ctx.lineCap = 'round';
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(1060, 70);
    ctx.lineTo(1060 + Math.cos(hA) * 10, 70 + Math.sin(hA) * 10);
    ctx.stroke();
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(1060, 70);
    ctx.lineTo(1060 + Math.cos(mA) * 17, 70 + Math.sin(mA) * 17);
    ctx.stroke();
    // дверь в архив подпёрта томом
    if (OM.flag('doorWedged')) {
      ctx.fillStyle = '#6a2a22';
      ctx.fillRect(1166, 596, 26, 10);
      ctx.fillStyle = '#d9b25a';
      ctx.fillRect(1170, 599, 18, 1.2);
      ctx.fillStyle = '#1a120a';
      ctx.fillRect(1160, 340, 14, 266);
    }
    if (st.power < 1) {
      ctx.fillStyle = `rgba(20,24,30,${(1 - st.power) * 0.35})`;
      ctx.fillRect(0, 0, W, 720);
    }
  }

  // Керосиновая лампа на кафедре (если её не убрали).
  function keroDraw(ctx, a, t) {
    if (OM.flag('lightSafe')) return;
    const { x, y } = KERO;
    ctx.fillStyle = '#7a6a3a';
    ctx.beginPath();
    ctx.ellipse(x, y, 13, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    P.fillV(ctx, x - 11, y - 18, 22, 18, [[0, '#a89050'], [1, '#6a5a2a']]);
    ctx.fillStyle = '#5a4a2a';
    ctx.fillRect(x - 5, y - 24, 10, 6);
    // стеклянная колба
    ctx.fillStyle = 'rgba(220,230,230,.35)';
    ctx.beginPath();
    ctx.moveTo(x - 5, y - 24);
    ctx.quadraticCurveTo(x - 13, y - 36, x - 4, y - 50);
    ctx.lineTo(x + 4, y - 50);
    ctx.quadraticCurveTo(x + 13, y - 36, x + 5, y - 24);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.4)';
    ctx.lineWidth = 0.8;
    ctx.stroke();
    if (st.power < 0.5 || OM.flag('keroLit')) {
      ctx.fillStyle = '#ffcc66';
      ctx.beginPath();
      ctx.ellipse(x, y - 32, 2.5, 5 + Math.sin(t * 9) * 0.6, 0, 0, Math.PI * 2);
      ctx.fill();
      P.glow(ctx, x, y - 32, 90, '#ffb050', 0.3);
    }
  }

  const vera = OM.actor({
    id: 'vera', x: 690, y: 606, face: -1, speed: 120, draw: (c, a, t) => A.vera(c, a, t), litByScene: true,
  });
  const kero = OM.actor({ id: 'kero', x: 0, y: 612, autoScale: false, draw: keroDraw });

  OM.scene('library', {
    name: 'Библиотека',
    surface: 'floor',
    figLight: { amb: 0.82, tint: '#a8aca0', side: -1 },
    amb: { rain: 0.25, wind: 0.15, indoor: true, hum: 0.5 },
    walk: [[60, 626], [1240, 626], [1240, 706], [60, 706]],
    depth: { y0: 626, s0: 1.18, y1: 706, s1: 1.3 },
    entries: {
      default: { x: 300, y: 660, face: 1 },
      door: { x: 80, y: 660, face: 1 },
      archive: { x: 1190, y: 650, face: -1 },
    },
    lights: [
      { x: 150, y: 260, color: '#e0e8ee', a: 0.7, reach: 700 },
      { x: LAMPS[0].x, y: LAMPS[0].y, color: '#ffe8c0', a: 0.5, reach: 500, flicker: () => st.power },
    ],
    layers: [{ z: 612, paint: deskLayer }],
    actors: () => [vera, kero],
    paint,
    back,
    update(dt, t) {
      if (OM.flag('powerCut')) st.power = Math.max(0, st.power - dt * 1.5);
      vera.s = 1.18;
      vera.hold = OM.flag('lightSafe') ? null : null;
    },
    setup() {
      st.power = OM.flag('powerCut') ? 0 : 1;
      vera.x = 690; vera.y = 606; vera.face = -1;
    },
    hotspots: [
      { id: 'windows', name: 'Окна', rect: [60, 100, 260, 330], look: 'Высокие окна. За ними — жёлтый тополь и серое небо. Дождь пишет на стекле что-то неразборчивое.' },
      { id: 'shelves', name: 'Стеллажи', rect: [324, 140, 670, 300], look: ['Стеллажи до потолка. Классика, краеведение, подшивки журналов «Огонёк».', 'И, конечно, ни одной «Всё обо всём». Непаханое поле.'] },
      { id: 'catalog', name: 'Каталог', rect: [996, 436, 128, 172], walk: [1050, 640], face: 1, look: 'Карточный каталог. Ящичек «П»: «Покровское, село — см. Архив». Ну конечно.' },
      { id: 'clock', name: 'Часы', rect: [1030, 40, 60, 60], look: () => (st.power < 0.5 ? say('Пять минут четвёртого. Свет отключили.') : say('Без десяти три.')) },
      { id: 'poster', name: 'Табличка «Тишина»', rect: [1084, 166, 60, 32], look: '«Тишина!» Единственный приказ в этом городе, который выполняют беспрекословно.' },
      { id: 'portrait', name: 'Портрет', rect: [998, 158, 70, 90], look: 'Портрет писателя. Бакенбарды, взгляд с укором. Классик смотрит на меня, как на коммивояжёра.' },
      { id: 'table', name: 'Читальный стол', rect: [60, 500, 280, 60], walk: [200, 640], face: -1, look: 'Подшивка «Омутской правды» за этот год. «Рыболов пропал». «Рыболов не найден». «Поиски прекращены».' },
      {
        id: 'kero', name: 'Керосиновая лампа', rect: [KERO.x - 16, KERO.y - 54, 32, 58], walk: [600, 640], face: 1, when: () => !OM.flag('lightSafe'),
        look: 'Керосиновая лампа. Стекло закопчённое, в резервуаре плещется керосин.',
        use: () => OM.story2.keroVision(),
      },
      {
        id: 'vera', name: 'Вера Андреевна', rect: () => [vera.x - 30, vera.y - 190, 60, 150], walk: [600, 646], face: 1,
        look: 'Библиотекарь. Очки, строгий пучок и выбившаяся прядь, которую она поправляет каждые полминуты.',
        use: () => OM.story2.talkVera(),
        items: {
          zhuchok: () => OM.story2.giveLight(),
          book: async () => {
            await say('Не желаете энциклопедию «Всё обо всём»? Для фонда.');
            await OM.say('vera', 'У нас фонд не пополняли с восемьдесят девятого. Так что — желаю. Но денег нет.');
          },
        },
      },
      {
        id: 'archdoor', name: 'Дверь в архив', rect: [1150, 296, 110, 312], walk: [1190, 640], face: 1,
        look: async () => {
          if (OM.flag('doorWedged')) return say('Дверь подпёрта томом «Д». Теперь не захлопнется.');
          await say('Тяжёлая дверь в подвал. Разбухла от сырости, петли проржавели.');
          if (OM.flag('visionCh2')) await say('Захлопнется — и изнутри не открыть. Как в видении.');
        },
        use: async () => {
          if (OM.flag('powerCut')) return OM.go('archive', 'stairs');
          await say('Без Веры туда соваться не стоит. Это её подвал.');
        },
        items: {
          book: async () => {
            if (OM.flag('doorWedged')) return say('Уже подпёрта.');
            G.hero.pose = 'reach';
            await OM.wait(500);
            G.hero.pose = null;
            OM.flag('doorWedged', 1);
            OM.save();
            await say('Том «Д». «Дверь». Подложу под неё — не захлопнется. Хоть кто-то в этой энциклопедии на своём месте.');
            await OM.story2.checkReady();
          },
        },
      },
      { id: 'exit', name: 'На площадь', rect: [0, 440, 40, 280], walk: [40, 664], exit: { to: 'square', entry: 'library', dir: 'left' } },
    ],
    async enter(entry) {
      if (entry === 'door' && !OM.flag('librarySeen')) {
        OM.flag('librarySeen', 1);
        await OM.wait(300);
        await say('Пахнет пылью, клеем и мокрыми зонтами. Библиотеки везде пахнут одинаково — и это успокаивает.');
      }
    },
  });

  OM.library = { st };
})();
