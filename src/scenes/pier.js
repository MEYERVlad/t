// Сцена 5. Пристань. Озеро, туман, затопленная церковь вдали. Митя и Тихий.
(function () {
  const P = OM.P, S = OM.S, G = OM.G, A = OM.Actors;
  const { hex, rng, W, H, lerp, clamp } = OM;
  const say = (t) => OM.say('lev', t);

  const LAMP = { x: 760, y: 372 };
  const MOON = { x: 300, y: 128 };
  const DECK = 586;
  const T_LIMIT = 80; // секунд до того, как Тихий дотянется
  const st = { k: 0, failing: false, sink: 0, ripples: [] };

  function paint(g) {
    // небо — здесь облака разошлись
    P.fillV(g, 0, 0, W, 440, [[0, '#03060c'], [0.5, '#0a1726'], [1, '#1b2c3a']]);
    P.stars(g, 3, 220, 330, 0.6);
    P.moon(g, MOON.x, MOON.y, 30);
    P.clouds(g, 61, { y0: 40, y1: 200, n: 8, color: '#0a1522', a: 0.6, size: [120, 260], x0: 500, x1: 1400 });
    P.clouds(g, 62, { y0: 220, y1: 380, n: 9, color: '#2a3c4a', a: 0.25, size: [140, 300] });
    // дальний берег
    P.forest(g, 63, { yb: 436, hMin: 18, hMax: 52, color: '#0a121a', step: [7, 14] });
    // затопленная церковь
    g.fillStyle = '#0b1219';
    g.fillRect(902, 382, 30, 56);
    g.beginPath();
    g.moveTo(898, 382);
    g.quadraticCurveTo(897, 360, 917, 346);
    g.quadraticCurveTo(937, 360, 936, 382);
    g.fill();
    g.fillRect(916, 326, 2, 22);
    g.save();
    g.translate(917, 333);
    g.rotate(0.3);
    g.fillRect(-7, -1, 14, 2);
    g.restore();
    g.fillRect(950, 412, 46, 26);
    // вода
    P.fillV(g, 0, 436, W, 284, [[0, '#1d2e3c'], [0.25, '#0f1c27'], [1, '#04080c']]);
    for (let y = 440; y < 720; y += 3 + (y - 436) * 0.03) {
      g.fillStyle = `rgba(150,180,200,${0.02 + Math.random() * 0.03})`;
      g.fillRect(0, y, W, 1);
    }
    // берег слева, лодочный сарай
    g.fillStyle = '#070a0c';
    g.beginPath();
    g.moveTo(0, 520);
    g.lineTo(150, 540);
    g.lineTo(260, 600);
    g.lineTo(0, 600);
    g.fill();
    P.fillV(g, 10, 410, 210, 140, [[0, '#1a1d1e'], [1, '#0d0f10']]);
    for (let x = 14; x < 220; x += 11) {
      g.fillStyle = 'rgba(0,0,0,.35)';
      g.fillRect(x, 412, 1.5, 138);
    }
    g.fillStyle = '#060808';
    g.beginPath();
    g.moveTo(0, 418);
    g.lineTo(115, 372);
    g.lineTo(232, 418);
    g.fill();
    g.fillStyle = '#05070a';
    g.fillRect(80, 470, 60, 80);
    // перевёрнутая лодка
    g.fillStyle = '#0c1012';
    g.beginPath();
    g.ellipse(190, 560, 70, 16, 0, Math.PI, 0);
    g.fill();
    // табличка
    g.fillStyle = '#7a756a';
    g.fillRect(40, 440, 50, 18);
    P.text(g, 'Купаться', 65, 446, { font: '700 6px "PT Serif",serif', color: '#1a1a1a' });
    P.text(g, 'запрещено', 65, 453, { font: '700 6px "PT Serif",serif', color: '#7a1a14' });
    // настил пристани
    P.fillV(g, 140, DECK - 2, 1010, 16, [[0, '#2c2620'], [1, '#14110d']]);
    for (let x = 140; x < 1150; x += 15) {
      g.fillStyle = 'rgba(0,0,0,.45)';
      g.fillRect(x, DECK - 2, 1.5, 16);
    }
    g.fillStyle = 'rgba(210,200,180,.12)';
    g.fillRect(140, DECK - 2, 1010, 1.5);
    // тумбы
    [300, 520, 960, 1140].forEach((x) => {
      g.fillStyle = '#0d0b09';
      g.fillRect(x - 5, DECK - 22, 10, 22);
    });
    // фонарь на пристани
    g.fillStyle = '#08090a';
    g.fillRect(LAMP.x - 3, LAMP.y, 6, DECK - LAMP.y);
    g.beginPath();
    g.moveTo(LAMP.x - 12, LAMP.y + 4);
    g.lineTo(LAMP.x + 12, LAMP.y + 4);
    g.lineTo(LAMP.x + 6, LAMP.y - 10);
    g.lineTo(LAMP.x - 6, LAMP.y - 10);
    g.fill();
    // лёгкий туман над водой
    const tex = P.fogTexture();
    g.globalAlpha = 0.5;
    g.drawImage(tex, 0, 380, W, 120);
    g.globalAlpha = 1;
    P.paper(g, 6, 0.07);
  }

  // Вода перед настилом: перекрывает ноги Тихого, сваи стоят в ней.
  function front(g) {
    P.fillV(g, 0, 604, W, 116, [[0, 'rgba(8,16,24,.82)'], [0.4, 'rgba(5,10,16,.96)'], [1, '#020508']]);
    g.fillStyle = 'rgba(160,190,210,.1)';
    g.fillRect(0, 604, W, 1);
    // сваи
    for (let x = 150; x < 1150; x += 70) {
      P.fillV(g, x - 5, DECK + 12, 10, 120, [[0, '#120f0c'], [1, 'rgba(10,8,6,0)']]);
    }
    // камыш
    const r = rng(81);
    g.strokeStyle = '#020304';
    g.lineCap = 'round';
    for (let i = 0; i < 70; i++) {
      const x = r() * 220, h = 40 + r() * 110;
      g.lineWidth = 1.5 + r() * 2;
      g.beginPath();
      g.moveTo(x, 724);
      g.quadraticCurveTo(x + (r() - 0.3) * 30, 720 - h * 0.6, x + (r() - 0.2) * 40, 720 - h);
      g.stroke();
      if (r() < 0.3) {
        g.fillStyle = '#020304';
        g.beginPath();
        g.ellipse(x + (r() - 0.2) * 40, 720 - h, 3, 9, 0.2, 0, Math.PI * 2);
        g.fill();
      }
    }
  }

  function back(ctx, t) {
    // лунная дорожка
    for (let i = 0; i < 26; i++) {
      const y = 444 + i * 7 + i * i * 0.18;
      const w = 20 + i * 4 + Math.sin(t * 1.5 + i * 1.7) * 10;
      const x = MOON.x + Math.sin(t * 0.8 + i * 2.3) * (6 + i * 1.5);
      ctx.fillStyle = `rgba(220,230,240,${0.22 - i * 0.007})`;
      ctx.fillRect(x - w / 2, y, w, 1.6 + i * 0.05);
    }
    // фонарь пристани
    P.glow(ctx, LAMP.x, LAMP.y - 2, 40, '#ffd29a', 0.9);
    P.glow(ctx, LAMP.x, LAMP.y + 20, 240, '#ff9a48', 0.2);
    P.cone(ctx, LAMP.x, LAMP.y, 24, 260, DECK - LAMP.y, '#ffa457', 0.25);
    P.eglow(ctx, LAMP.x, DECK, 170, 14, '#ff9a48', 0.3);
    P.streak(ctx, LAMP.x, 610, 26, 110, '#ffa457', 0.35, 6, t);
    // круги на воде
    st.ripples.forEach((r) => {
      ctx.strokeStyle = `rgba(200,220,235,${Math.max(0, 0.4 - r.t * 0.12)})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(r.x, r.y, 10 + r.t * 40, 2 + r.t * 8, 0, 0, Math.PI * 2);
      ctx.stroke();
    });
  }

  function over(ctx, t) {
    P.fogBand(ctx, t, 520, 150, 6, 0.35);
    P.fogBand(ctx, t + 60, 610, 110, -4, 0.25);
    // нарастающее напряжение — края темнеют
    if (st.k > 0.3 && !OM.flag('saved')) {
      const k = (st.k - 0.3) / 0.7;
      ctx.fillStyle = P.rgrad(ctx, W / 2, H / 2, H * 0.3, W * 0.7, [[0, 'rgba(0,0,0,0)'], [1, `rgba(30,0,0,${k * 0.5})`]]);
      ctx.fillRect(0, 0, W, H);
    }
  }

  const mitya = OM.actor({ id: 'mitya', x: 1104, y: DECK + 6, face: 1, speed: 40, draw: A.mitya, sleep: true, litByScene: true });
  const tall = OM.actor({
    id: 'tall', x: 1250, y: 830, face: -1, autoScale: false, s: 1.12, draw: (c, a, t) => A.tall(c, a, t),
    alpha: 1, reach: 0, jitter: 1.4, body: '#020305', z: 590,
  });

  OM.scene('pier', {
    name: 'Пристань',
    surface: 'wood',
    figLight: { amb: 0.36, tint: '#2a3a50' },
    amb: { rain: 0.15, wind: 0.7, water: 1, drone: 0.6 },
    walk: [[150, DECK + 2], [1090, DECK + 2], [1090, DECK + 12], [150, DECK + 12]],
    depth: { y0: DECK, s0: 0.96, y1: DECK + 12, s1: 0.98 },
    entries: {
      default: { x: 200, y: DECK + 8, face: 1 },
      gate: { x: 170, y: DECK + 8, face: 1 },
    },
    lights: [
      { x: LAMP.x, y: LAMP.y, color: '#ffae5a', a: 1, reach: 420 },
      { x: MOON.x, y: 300, color: '#b8c8e0', a: 0.5, reach: 900 },
    ],
    rain: { n: 160, base: 0.06, ground: [590, 720] },
    rainLights: [{ x: LAMP.x, y: 470, rx: 140, ry: 200, a: 0.4 }],
    actors: () => [mitya, tall],
    paint,
    front,
    back,
    over,
    setup() {
      st.k = 0;
      st.failing = false;
      st.ripples = [];
      const saved = OM.flag('saved');
      mitya.visible = !saved;
      tall.visible = !saved;
      mitya.x = 1100; mitya.y = DECK + 6; mitya.face = 1; mitya.sleep = true;
      tall.x = 1250; tall.alpha = 1; tall.reach = 0; tall.y = 830;
    },
    update(dt, t) {
      st.ripples.forEach((r) => (r.t += dt));
      st.ripples = st.ripples.filter((r) => r.t < 3.5);
      if (Math.random() < dt * 0.6) st.ripples.push({ x: Math.random() * W, y: 620 + Math.random() * 90, t: 0 });
      if (OM.flag('saved') || st.failing || G.mode !== 'play') return;
      if (!G.busy && !G.saying) st.k = Math.min(1, st.k + dt / T_LIMIT);
      tall.x = lerp(1250, 1168, OM.smooth(st.k));
      tall.reach = OM.smooth(clamp((st.k - 0.35) / 0.65, 0, 1));
      S.tension(st.k * 0.9);
      if (st.k >= 1) {
        st.failing = true;
        OM.run(fail);
      }
    },
    hotspots: [
      { id: 'boathouse', name: 'Лодочный сарай', rect: [10, 372, 222, 178], look: 'Лодочный сарай. Дверь заколочена. Лодки — вверх дном, как спящие собаки.' },
      { id: 'sign', name: 'Табличка', rect: [36, 436, 58, 24], look: '«Купаться запрещено». Кому-то стоило написать крупнее.' },
      { id: 'church', name: 'Купол в воде', rect: [890, 320, 110, 120], look: ['Купол. Прямо из воды, посреди озера. С покосившимся крестом.', 'Покровское. Оно никуда не делось. Оно просто под водой.'] },
      { id: 'moon', name: 'Луна', rect: [260, 90, 80, 80], look: 'Луна вышла. Хоть кто-то в этом городе на моей стороне.' },
      { id: 'lamp', name: 'Фонарь на пристани', rect: [744, 350, 32, 236], look: 'Тот самый фонарь, что виден из окна. Вблизи он ещё более одинокий.' },
      {
        id: 'tall', name: '…', when: () => tall.visible && !OM.flag('saved'),
        rect: () => [tall.x - 40, 360, 80, 240],
        look: async () => {
          S.heartbeat();
          await say('Не смотреть ему в лицо. Не смотреть. Не смотреть.');
        },
        use: () => say('Подойти к нему? Нет. Всё, что мне нужно, — мальчик.'),
        anyItem: () => say('Что бы я ни бросил в него — это ничего не изменит. Ему нужен мальчик. Мне — тоже.'),
      },
      {
        id: 'mitya', name: 'Митя', when: () => mitya.visible,
        rect: () => [mitya.x - 30, mitya.y - 125, 60, 130], walk: [1040, DECK + 8], face: 1,
        look: 'Мальчик в пижаме. Глаза открыты, но он ничего не видит. Смотрит на воду. На него.',
        use: async () => {
          await say('Митя! Митя, проснись!');
          await OM.wait(400);
          await say('Не слышит. Хватать нельзя — испугается, дёрнется и шагнёт вниз.');
          if (OM.flag('knowBell') || OM.has('bell')) await say('Зинаида говорила: его будят звонком. Тихонько.');
          else await say('Нужен знакомый звук. Что-то, что он слышит дома каждый день.');
        },
        items: {
          bell: () => rescue(),
          book: () => say('Читать лекцию о лунатизме прямо сейчас? Гениально, Лев.'),
          umbrella: () => say('Зацепить его зонтом? Он испугается — и всё. Нет.'),
          key7: () => say('Не то.'),
        },
      },
      { id: 'exit', name: 'Назад, в город', rect: [0, 540, 150, 70], walk: [152, DECK + 8], exit: { to: 'street', entry: 'gate', dir: 'left' } },
    ],
    async enter(entry) {
      if (OM.flag('saved')) return;
      if (!OM.flag('pierSeen')) {
        OM.flag('pierSeen', 1);
        OM.letterbox(true);
        S.stinger(1);
        await OM.wait(500);
        await say('Вот он. На самом краю.');
        await say('И там, в воде… Он стоит. Ждёт.');
        OM.letterbox(false);
      }
    },
  });

  async function fail() {
    OM.letterbox(true);
    mitya.target = null;
    await OM.moveTo(mitya, 1150, DECK + 6, { speed: 30 });
    S.whisper(1.5, 0.2);
    await OM.fadeTo(0.85, 600, '#300000');
    S.splash();
    S.hit();
    OM.shake(10);
    await OM.fadeTo(1, 300, '#120000');
    await OM.wait(800);
    await OM.say('narr', 'Нить оборвалась.', { hold: 1.4 });
    await OM.say('lev', 'Нет. Не так. Я уже видел, чем это кончается. Ещё раз.', { hold: 1.6 });
    OM.setScene('pier', 'gate');
    OM.letterbox(false);
    await OM.fadeTo(0, 700);
    OM.toast('Время на пристани ограничено. Подумайте, как разбудить мальчика мягко.');
  }

  async function rescue() {
    st.failing = true;
    OM.letterbox(true);
    S.tension(0.4);
    await say('Тише, тише…');
    S.bell();
    await OM.wait(1300);
    mitya.sleep = false;
    S.bell();
    await OM.wait(900);
    // Тихий уходит под воду
    const t0 = performance.now();
    S.stinger(0.7);
    const sinking = (async () => {
      while (performance.now() - t0 < 4000) {
        const k = (performance.now() - t0) / 4000;
        tall.y = 830 + k * 260;
        tall.reach = Math.max(0, 1 - k * 2);
        tall.alpha = 1 - k * 0.6;
        await OM.wait(16);
      }
      tall.visible = false;
      st.ripples.push({ x: tall.x, y: 612, t: 0 }, { x: tall.x + 10, y: 616, t: 0.5 });
    })();
    mitya.face = -1;
    await OM.say('mitya', 'Ба?.. Где… Где я?');
    await say('Всё хорошо. Ты во сне гулял. Я тебя разбудил. Пойдём домой, бабушка заждалась.');
    await sinking;
    S.tension(0);
    OM.flag('saved', 1);
    await OM.say('mitya', 'Дядя… Он сказал, мама там. Внизу. В Покровском. Она ждёт.');
    await say('Кто — он?');
    mitya.face = 1;
    await OM.wait(800);
    await OM.say('mitya', 'Он всегда там стоит. Просто вы его раньше не видели.');
    await OM.wait(500);
    G.hero.face = 1;
    await say('Двадцать лет я езжу по городам и ни разу никуда не успел вовремя.');
    await say('Похоже, сюда я приехал как раз вовремя.');
    OM.save();
    await OM.fadeTo(1, 2200);
    S.music('end');
    await OM.card('Конец первой главы', 'Нити только начинают натягиваться…', 4200);
    OM.store.set('omut-ch1-done', 1);
    OM.letterbox(false);
    S.music(null);
    await OM.story2.start();
  }
})();
