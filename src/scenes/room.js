// Сцена 4. Номер 7. Кровать, ковёр на стене, окно на озеро, шкаф с зеркалом.
(function () {
  const P = OM.P, S = OM.S, G = OM.G, A = OM.Actors;
  const { hex, rng, W } = OM;
  const say = (t) => OM.say('lev', t);

  const LAMP = { x: 620, y: 470 };
  const WIN = { x: 744, y: 168, w: 252, h: 278 };
  const st = { lamp: 1, mitya: -1, mirror: 0, tick: 0, drops: [] };

  function paint(g) {
    // обои в полоску
    P.fillV(g, 0, 0, W, 610, [[0, '#1b1311'], [0.5, '#2c1f1b'], [1, '#221714']]);
    for (let x = 0; x < W; x += 34) {
      g.fillStyle = 'rgba(160,110,90,.05)';
      g.fillRect(x, 0, 12, 610);
      for (let y = 20 + ((x / 34) % 2) * 30; y < 610; y += 60) {
        g.fillStyle = 'rgba(190,140,110,.07)';
        g.beginPath();
        g.arc(x + 23, y, 3, 0, Math.PI * 2);
        g.fill();
      }
    }
    P.paper(g, 51, 0.14, 0, 0, W, 610);
    // плинтус и пол
    g.fillStyle = '#140d09';
    g.fillRect(0, 598, W, 14);
    P.fillV(g, 0, 610, W, 110, [[0, '#2a1b10'], [1, '#100a06']]);
    for (let y = 616, k = 0; y < 720; y += 9 + k * 3, k++) {
      g.fillStyle = 'rgba(0,0,0,.4)';
      g.fillRect(0, y, W, 1.3);
    }
    // ковёр на полу
    P.fillV(g, 260, 650, 620, 50, [[0, '#3a1e14'], [1, '#22110b']]);
    g.strokeStyle = 'rgba(200,150,80,.18)';
    g.lineWidth = 2;
    g.strokeRect(268, 654, 604, 42);

    // ---- дверь ----
    P.fillV(g, 26, 236, 124, 374, [[0, '#2a1a10'], [1, '#160d07']]);
    g.strokeStyle = 'rgba(0,0,0,.5)';
    g.lineWidth = 3;
    g.strokeRect(40, 256, 96, 150);
    g.strokeRect(40, 424, 96, 160);
    g.fillStyle = '#b08a4a';
    g.fillRect(124, 420, 10, 4);
    g.fillStyle = '#0c0705';
    g.fillRect(18, 228, 140, 10);
    g.fillRect(18, 228, 8, 382);
    g.fillRect(150, 228, 8, 382);
    // полоска света из коридора
    g.fillStyle = hex('#ffcf90', 0.2);
    g.fillRect(28, 604, 120, 3);

    // ---- ковёр на стене ----
    const cx = 190, cy = 196, cw = 360, chh = 230;
    g.fillStyle = '#4a1612';
    g.fillRect(cx, cy, cw, chh);
    g.fillStyle = '#2a0b09';
    g.fillRect(cx + 14, cy + 14, cw - 28, chh - 28);
    g.fillStyle = '#5a1e16';
    g.fillRect(cx + 26, cy + 26, cw - 52, chh - 52);
    const rr = rng(52);
    // кайма
    for (let x = cx + 4; x < cx + cw - 8; x += 12) {
      g.fillStyle = rr() < 0.5 ? '#8a6a3a' : '#2a3a4a';
      g.beginPath();
      g.moveTo(x, cy + 7);
      g.lineTo(x + 6, cy + 2);
      g.lineTo(x + 12, cy + 7);
      g.lineTo(x + 6, cy + 12);
      g.fill();
      g.beginPath();
      g.moveTo(x, cy + chh - 7);
      g.lineTo(x + 6, cy + chh - 12);
      g.lineTo(x + 12, cy + chh - 7);
      g.lineTo(x + 6, cy + chh - 2);
      g.fill();
    }
    // центральный медальон
    const mx = cx + cw / 2, my = cy + chh / 2;
    [[80, '#2a0b09'], [66, '#8a6a3a'], [54, '#2a3a4a'], [40, '#6a1a14'], [26, '#c9a46a'], [12, '#2a0b09']].forEach(([s, c]) => {
      g.fillStyle = c;
      g.beginPath();
      g.moveTo(mx, my - s * 0.85);
      g.lineTo(mx + s * 1.5, my);
      g.lineTo(mx, my + s * 0.85);
      g.lineTo(mx - s * 1.5, my);
      g.fill();
    });
    [[cx + 60, cy + 55], [cx + cw - 60, cy + 55], [cx + 60, cy + chh - 55], [cx + cw - 60, cy + chh - 55]].forEach(([x, y]) => {
      [[22, '#8a6a3a'], [14, '#2a3a4a'], [6, '#c9a46a']].forEach(([s, c]) => {
        g.fillStyle = c;
        g.beginPath();
        g.moveTo(x, y - s);
        g.lineTo(x + s, y);
        g.lineTo(x, y + s);
        g.lineTo(x - s, y);
        g.fill();
      });
    });
    P.speckle(g, 53, cx, cy, cw, chh, 2500, '#000', 0.35);
    g.fillStyle = 'rgba(0,0,0,.35)';
    g.fillRect(cx, cy, cw, chh);

    // ---- кровать ----
    // изголовье
    g.fillStyle = '#0b0a0a';
    g.fillRect(170, 410, 8, 196);
    g.fillRect(560, 470, 8, 136);
    g.lineWidth = 4;
    g.strokeStyle = '#0b0a0a';
    g.beginPath();
    g.moveTo(174, 420);
    g.quadraticCurveTo(220, 392, 266, 420);
    g.stroke();
    for (let x = 186; x < 262; x += 14) g.fillRect(x, 420, 3, 110);
    g.fillStyle = 'rgba(200,200,210,.12)';
    g.fillRect(171, 412, 2, 190);
    // матрас и одеяло
    P.fillV(g, 176, 520, 390, 40, [[0, '#6a5a4a'], [1, '#3a2f26']]);
    P.fillV(g, 280, 506, 290, 66, [[0, '#4a3a5a'], [1, '#231c2c']]);
    g.strokeStyle = 'rgba(255,255,255,.06)';
    g.lineWidth = 1;
    for (let x = 290; x < 566; x += 22) {
      g.beginPath();
      g.moveTo(x, 508);
      g.lineTo(x - 6, 570);
      g.stroke();
    }
    // подушка-«пирамида»
    g.fillStyle = '#b8ad9a';
    g.beginPath();
    g.moveTo(190, 518);
    g.quadraticCurveTo(230, 480, 272, 518);
    g.quadraticCurveTo(232, 528, 190, 518);
    g.fill();
    g.fillStyle = '#9a8f7c';
    g.beginPath();
    g.moveTo(205, 492);
    g.lineTo(232, 466);
    g.lineTo(258, 492);
    g.lineTo(232, 500);
    g.fill();
    g.fillStyle = 'rgba(0,0,0,.4)';
    g.fillRect(176, 560, 392, 46);

    // ---- тумбочка ----
    P.fillV(g, 580, 524, 92, 84, [[0, '#3a2414'], [1, '#1c1009']]);
    g.fillStyle = '#4a3020';
    g.fillRect(576, 518, 100, 8);
    g.strokeStyle = 'rgba(0,0,0,.5)';
    g.lineWidth = 2;
    g.strokeRect(588, 540, 76, 24);
    g.fillStyle = '#b08a4a';
    g.fillRect(622, 550, 8, 3);
    // лампа
    g.fillStyle = '#2a1e14';
    g.fillRect(LAMP.x - 10, 508, 20, 10);
    g.fillRect(LAMP.x - 2, 486, 4, 22);
    g.fillStyle = P.vgrad(g, 450, 490, [[0, '#d0a060'], [1, '#a06a30']]);
    g.beginPath();
    g.moveTo(LAMP.x - 16, 454);
    g.lineTo(LAMP.x + 16, 454);
    g.lineTo(LAMP.x + 28, 488);
    g.lineTo(LAMP.x - 28, 488);
    g.fill();
    // будильник
    g.fillStyle = '#7a1a14';
    g.beginPath();
    g.arc(656, 504, 13, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#e0d6c0';
    g.beginPath();
    g.arc(656, 504, 10, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#7a1a14';
    g.fillRect(646, 515, 4, 4);
    g.fillRect(662, 515, 4, 4);

    // ---- окно ----
    const { x, y, w, h } = WIN;
    // вид снаружи: озеро, туман, пристань
    P.fillV(g, x, y, w, h, [[0, '#0a121c'], [0.45, '#1a2a36'], [0.55, '#2a3a44'], [1, '#0c151c']]);
    P.forest(g, 54, { x0: x - 10, x1: x + w + 10, yb: y + h * 0.52, hMin: 10, hMax: 30, color: '#0b1218', step: [5, 10] });
    P.fillV(g, x, y + h * 0.52, w, h * 0.48, [[0, '#1e2e38'], [1, '#081016']]);
    // пристань вдали
    g.fillStyle = '#05080b';
    g.fillRect(x + 60, y + h * 0.66, 150, 4);
    for (let i = 0; i < 8; i++) g.fillRect(x + 64 + i * 19, y + h * 0.66, 2, 10);
    g.fillRect(x + 168, y + h * 0.54, 2, 40);
    P.glow(g, x + 169, y + h * 0.54, 40, '#ffb060', 0.45);
    g.fillStyle = '#ffd8a0';
    g.fillRect(x + 167, y + h * 0.54 - 2, 4, 4);
    P.streak(g, x + 169, y + h * 0.6, 8, 60, '#ffb060', 0.3, 9, 0);
    P.fillV(g, x, y + h * 0.4, w, h * 0.3, [[0, 'rgba(140,160,170,0)'], [0.5, 'rgba(140,160,170,.18)'], [1, 'rgba(140,160,170,0)']]);
    // рама
    g.fillStyle = '#d8d0c0';
    g.fillRect(x - 10, y - 10, w + 20, 10);
    g.fillRect(x - 10, y + h, w + 20, 14);
    g.fillRect(x - 10, y, 10, h);
    g.fillRect(x + w, y, 10, h);
    g.fillRect(x + w / 2 - 4, y, 8, h);
    g.fillRect(x, y + h * 0.3, w, 7);
    g.fillStyle = 'rgba(0,0,0,.55)';
    g.fillRect(x - 10, y - 10, w + 20, h + 24);
    g.fillStyle = 'rgba(0,0,0,.0)';
    // подоконник
    P.fillV(g, x - 24, y + h + 12, w + 48, 12, [[0, '#9a9080'], [1, '#4a4438']]);
    // шторы
    [[x - 64, 70], [x + w - 6, 70]].forEach(([sx, sw], i) => {
      g.fillStyle = P.hgrad(g, sx, sx + sw, [[0, '#3a1a14'], [0.5, '#5a2a1c'], [1, '#2a120c']]);
      g.beginPath();
      g.moveTo(sx, y - 26);
      g.lineTo(sx + sw, y - 26);
      g.quadraticCurveTo(sx + sw * (i ? 0.7 : 0.3) + (i ? -6 : 6), y + h * 0.6, sx + sw + (i ? 8 : -8), y + h + 120);
      g.lineTo(sx + (i ? 8 : -8), y + h + 120);
      g.closePath();
      g.fill();
      g.strokeStyle = 'rgba(0,0,0,.35)';
      g.lineWidth = 2;
      for (let k = 1; k < 4; k++) {
        g.beginPath();
        g.moveTo(sx + (sw * k) / 4, y - 20);
        g.quadraticCurveTo(sx + (sw * k) / 4 + 4, y + h * 0.5, sx + (sw * k) / 4, y + h + 116);
        g.stroke();
      }
    });
    g.fillStyle = '#0c0805';
    g.fillRect(x - 80, y - 32, w + 160, 8);

    // ---- шкаф с зеркалом ----
    P.fillV(g, 1060, 186, 184, 424, [[0, '#3a2414'], [1, '#1c1009']]);
    g.fillStyle = '#2a180c';
    g.fillRect(1052, 176, 200, 14);
    g.strokeStyle = 'rgba(0,0,0,.55)';
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(1152, 192);
    g.lineTo(1152, 600);
    g.stroke();
    g.strokeRect(1070, 200, 74, 396);
    g.strokeRect(1160, 200, 74, 396);
    // зеркало
    P.fillV(g, 1080, 236, 54, 260, [[0, '#2a3036'], [0.5, '#1a1e22'], [1, '#121518']]);
    g.strokeStyle = 'rgba(220,230,240,.08)';
    g.lineWidth = 6;
    g.beginPath();
    g.moveTo(1090, 250);
    g.lineTo(1124, 330);
    g.stroke();
    g.fillStyle = '#b08a4a';
    g.fillRect(1146, 390, 3, 16);
    g.fillRect(1155, 390, 3, 16);
  }

  function back(ctx, t) {
    // лампа на тумбочке
    const L = st.lamp;
    P.glow(ctx, LAMP.x, 476, 360, '#ffb868', 0.24 * L);
    P.glow(ctx, LAMP.x, 476, 90, '#ffd8a0', 0.4 * L);
    P.cone(ctx, LAMP.x, 488, 56, 230, 40, '#ffd090', 0.35 * L);
    P.cone(ctx, LAMP.x, 456, 30, 120, -60, '#ffd090', 0.15 * L);
    // будильник: стрелки
    const time = OM.flag('vision') ? 23 * 60 + 52 : 23 * 60 + 41;
    const hA = (((time / 60) % 12) / 12) * Math.PI * 2 - Math.PI / 2, mA = ((time % 60) / 60) * Math.PI * 2 - Math.PI / 2;
    ctx.strokeStyle = '#1a1210';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(656, 504);
    ctx.lineTo(656 + Math.cos(hA) * 5, 504 + Math.sin(hA) * 5);
    ctx.moveTo(656, 504);
    ctx.lineTo(656 + Math.cos(mA) * 8, 504 + Math.sin(mA) * 8);
    ctx.stroke();
    // свет из окна
    P.glow(ctx, WIN.x + WIN.w / 2, WIN.y + WIN.h / 2, 260, '#6080a0', 0.07);
    // капли на стекле
    ctx.save();
    ctx.beginPath();
    ctx.rect(WIN.x, WIN.y, WIN.w, WIN.h);
    ctx.clip();
    // Митя на берегу (после видения)
    if (st.mitya >= 0) {
      const mx = WIN.x + 20 + st.mitya * 140, my = WIN.y + WIN.h * 0.66;
      ctx.fillStyle = '#c8d4dc';
      ctx.fillRect(mx - 1.5, my - 9, 3, 9);
      ctx.beginPath();
      ctx.arc(mx, my - 11, 2, 0, Math.PI * 2);
      ctx.fill();
      P.glow(ctx, mx, my - 6, 14, '#c8d4dc', 0.3);
    }
    st.drops.forEach((d) => {
      ctx.strokeStyle = 'rgba(170,190,205,.28)';
      ctx.lineWidth = d.w;
      ctx.beginPath();
      ctx.moveTo(d.x, d.y - d.l);
      ctx.lineTo(d.x + 0.5, d.y);
      ctx.stroke();
      ctx.fillStyle = 'rgba(200,215,230,.35)';
      ctx.beginPath();
      ctx.arc(d.x + 0.5, d.y, d.w * 0.9, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
    // отражение в зеркале — Тихий (один раз, после видения)
    if (st.mirror > 0.01) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(1080, 236, 54, 260);
      ctx.clip();
      A.tall(ctx, { x: 1104, y: 620, s: 0.55, face: -1, alpha: st.mirror, jitter: 2, body: '#000' }, t);
      ctx.restore();
    }
  }

  OM.scene('room', {
    name: 'Номер 7',
    surface: 'floor',
    figLight: { amb: 0.58, tint: '#503828' },
    amb: { rain: 0.35, wind: 0.25, indoor: true, drone: 0.2 },
    walk: [[160, 626], [1250, 626], [1250, 706], [160, 706]],
    depth: { y0: 626, s0: 1.32, y1: 706, s1: 1.45 },
    entries: {
      default: { x: 400, y: 660, face: 1 },
      door: { x: 150, y: 664, face: 1 },
      wake: { x: 500, y: 640, face: 1 },
    },
    lights: [
      { x: LAMP.x, y: 476, color: '#ffc070', a: 1, reach: 520, flicker: () => st.lamp },
      { x: WIN.x + WIN.w / 2, y: 320, color: '#7a9ab8', a: 0.5, reach: 380 },
    ],
    paint,
    back,
    update(dt, t) {
      // капли на окне
      if (Math.random() < 0.25 && st.drops.length < 40) {
        st.drops.push({ x: WIN.x + Math.random() * WIN.w, y: WIN.y + Math.random() * WIN.h * 0.6, v: 0, l: 2, w: 0.8 + Math.random() * 1.2 });
      }
      st.drops.forEach((d) => {
        if (Math.random() < 0.02) d.v = 40 + Math.random() * 90;
        d.y += d.v * dt;
        d.l = Math.min(30, d.l + d.v * dt * 0.4);
        d.v *= 0.985;
      });
      st.drops = st.drops.filter((d) => d.y < WIN.y + WIN.h + 10);
      if (st.mitya >= 0 && st.mitya < 1) st.mitya = Math.min(1, st.mitya + dt * 0.05);
      st.mirror = Math.max(0, st.mirror - dt * 0.8);
      st.tick += dt;
      if (st.tick > 1) { st.tick -= 1; S.tick(Math.floor(t) % 2); }
    },
    hotspots: [
      {
        id: 'door', name: 'В коридор', rect: [20, 230, 136, 380], walk: [130, 664],
        exit: { to: 'lobby', entry: 'stairs', dir: 'left' },
      },
      {
        id: 'carpet', name: 'Ковёр', rect: [186, 192, 368, 238],
        look: ['Ковёр на стене. Как у бабушки в Калуге.', 'Если долго смотреть на узор, в нём проступают лица. Лучше не смотреть долго.'],
      },
      {
        id: 'bed', name: 'Кровать', rect: [170, 400, 400, 200], walk: [420, 640], face: -1,
        look: 'Железная кровать с шишечками. Подушка поставлена «пирамидой». Здесь явно ждали гостей. Лет тридцать назад.',
        use: async () => {
          if (OM.flag('vision')) return say('Не до сна. Двадцать минут. Может, меньше.');
          await say('Лечь спать?');
          const c = await OM.choose([{ id: 'y', text: 'Да. Хватит на сегодня.' }, { id: 'n', text: 'Нет, ещё осмотрюсь.' }]);
          if (c === 'n') return;
          await sleepAndSee();
        },
      },
      {
        id: 'nightstand', name: 'Будильник', rect: [636, 486, 40, 34], walk: [650, 640], face: 1,
        look: () => (OM.flag('vision')
          ? say('Без восьми двенадцать. В видении было — тринадцать минут первого. У меня двадцать одна минута.')
          : say('Будильник «Слава». Без девятнадцати двенадцать. Тикает так, словно торопится куда-то.')),
      },
      {
        id: 'lamp', name: 'Лампа', rect: [590, 450, 60, 70], walk: [620, 640], face: 1,
        look: 'Лампа с абажуром. Светит как может.',
        use: async () => {
          st.lamp = st.lamp > 0.5 ? 0.08 : 1;
          S.click();
          if (st.lamp < 0.5) {
            await OM.wait(500);
            await say('Нет. Пусть уж лучше горит.');
            st.lamp = 1;
            S.click();
          }
        },
      },
      {
        id: 'window', name: 'Окно', rect: [WIN.x - 10, WIN.y - 10, WIN.w + 20, WIN.h + 20], walk: [870, 640], face: 1,
        look: async () => {
          if (!OM.flag('vision')) {
            await say('Озеро. Туман лежит на воде, как вата. На краю пристани горит одинокий фонарь.');
            return;
          }
          if (!OM.flag('sawMitya')) {
            OM.flag('sawMitya', 1);
            st.mitya = 0;
            S.tension(0.5);
            await say('На берегу…');
            await say('Маленькая фигурка в светлом. Идёт к пристани.');
            await say('Мальчик. Внук Зинаиды? Как во сне… нет. Не как во сне. Это — сейчас.');
            await say('Двадцать минут. Надо на пристань.');
            S.tension(0);
            return;
          }
          await say('Мальчик всё ещё там — светлое пятнышко в тумане у пристани. Надо спешить.');
        },
        use: async function () {
          if (OM.flag('vision')) return this.look();
          await say('Открыть окно? «Окно не открывайте».');
          await say('Пожалуй, впервые в жизни послушаюсь гостиничных правил.');
        },
      },
      {
        id: 'wardrobe', name: 'Шкаф', rect: [1160, 190, 86, 420], walk: [1180, 650], face: 1,
        look: 'Шкаф. Дверцы рассохлись. Пахнет нафталином и чужой жизнью.',
        use: async () => {
          S.creak();
          if (!OM.flag('gotUmbrella')) {
            OM.flag('gotUmbrella', 1);
            await say('Пусто. Только вешалки… и зонт-трость в углу. Кто-то забыл. Ручка — крюком.');
            OM.give('umbrella');
            return;
          }
          await say('Пусто. Вешалки звякают, как зубы.');
        },
      },
      {
        id: 'mirror', name: 'Зеркало', rect: [1074, 230, 66, 272], walk: [1104, 650], face: 1,
        look: async () => {
          if (OM.flag('vision') && !OM.flag('mirrorSeen')) {
            OM.flag('mirrorSeen', 1);
            st.mirror = 1;
            S.stinger(0.8);
            await OM.wait(600);
            await say('!..');
            await say('Никого. За спиной никого нет. Никого там нет.');
            return;
          }
          await say('Выгляжу паршиво. Сорок один год, из них двадцать — в дороге. И все двадцать — на лице.');
        },
      },
    ],
    async enter(entry) {
      if (entry === 'door' && !OM.flag('roomSeen')) {
        OM.flag('roomSeen', 1);
        await OM.wait(300);
        await say('Номер семь. Ковёр, кровать, тумбочка. Роскошь, о которой я мечтал последние двадцать часов.');
      }
    },
  });

  async function sleepAndSee() {
    await OM.walk(300, 630);
    G.hero.face = -1;
    await OM.fadeTo(1, 1200);
    G.hero.visible = false;
    S.amb({ rain: 0.2, indoor: true });
    await OM.wait(1200);
    await OM.say('narr', 'Дождь стучит по жестяному карнизу. Раз-два. Раз-два. Тринадцать…', { hold: 2.2 });
    await OM.story.vision1();
    // пробуждение
    OM.flag('vision', 1);
    OM.flag('zinaSleeps', 1);
    G.hero.visible = true;
    G.hero.x = 360; G.hero.y = 650; G.hero.face = 1;
    S.amb(G.scene.amb);
    S.hit();
    OM.shake(8);
    await OM.fadeTo(0, 300);
    OM.letterbox(false);
    await say('…!');
    await say('Мальчик. В пижаме. Пристань — та, что видна из окна. И он. Высокий. В воде.');
    await say('Это был сон. Просто сон.');
    await OM.wait(500);
    await say('Тогда почему я знаю, что это будет в тринадцать минут первого?');
    OM.save();
    OM.toast('Цель: не дать мальчику дойти до воды.');
  }
})();
