// Глава 5. Площадь у ДК на рассвете Покрова: вода пришла в город по щиколотку.
// Здесь Лев прощается с теми, кого спас, — каждый отдаёт ему вещь для последнего спуска.
(function () {
  const P = OM.P, S = OM.S, G = OM.G, A = OM.Actors;
  const { hex, rng, W, H, lerp, clamp } = OM;
  const TAU = Math.PI * 2;
  const say = (t, o) => OM.say('lev', t, o);
  const WATER = 598;

  function paint(g) {
    // та же площадь, что во второй главе
    G.scenes.square.paint(g);
    // небо рассвета: розовое снизу, синее сверху
    g.save();
    g.globalCompositeOperation = 'multiply';
    g.fillStyle = P.vgrad(g, 0, H, [[0, '#6a78a8'], [0.45, '#c8a0b0'], [0.8, '#a88898'], [1, '#5a6080']]);
    g.fillRect(0, 0, W, H);
    g.globalCompositeOperation = 'screen';
    g.fillStyle = P.rgrad(g, 1180, 360, 0, 700, [[0, 'rgba(255,190,140,.35)'], [1, 'rgba(255,190,140,0)']]);
    g.fillRect(0, 0, W, H);
    g.restore();
    // вода: отражение площади вверх ногами
    const c = g.canvas, k = c.width / W;
    g.save();
    g.beginPath();
    g.rect(0, WATER, W, H - WATER);
    g.clip();
    g.translate(0, WATER * 2);
    g.scale(1, -1);
    g.globalAlpha = 0.55;
    g.drawImage(c, 0, (WATER - 200) * k, W * k, 200 * k, 0, WATER - 200, W, 200);
    g.restore();
    P.fillV(g, 0, WATER, W, H - WATER, [[0, 'rgba(40,50,80,.35)'], [1, 'rgba(10,14,30,.75)']]);
    g.fillStyle = 'rgba(255,220,200,.35)';
    g.fillRect(0, WATER, W, 1.5);
    const r = rng(951);
    for (let i = 0; i < 120; i++) {
      g.fillStyle = `rgba(230,210,220,${0.04 + r() * 0.08})`;
      g.fillRect(r() * W, WATER + 4 + r() * (H - WATER), 10 + r() * 60, 1);
    }
    // опавшие листья плавают
    for (let i = 0; i < 60; i++) {
      g.save();
      g.translate(r() * W, WATER + 8 + r() * 110);
      g.rotate(r() * TAU);
      g.fillStyle = ['#c89a3a', '#a8642a', '#d8b050'][(r() * 3) | 0];
      g.beginPath();
      g.ellipse(0, 0, 4, 2, 0, 0, TAU);
      g.fill();
      g.restore();
    }
  }

  const PAL_VERA = null;
  const ZINA = { cardigan: '#5a4c44', blouse: '#c9bfae', skirt: '#3a3236', skin: '#d3a68e', hair: '#9a948c', shoes: '#2a1c16', tights: '#4a3a34' };
  const people = {
    zina: OM.actor({ id: 'zina', x: 330, y: 650, face: 1, draw: (c, a, t) => A.vera(c, Object.assign({}, a, { pal: ZINA, shawl: '#7a3a2e', shawlPat: 'rgba(196,154,90,.8)', highBun: true, hold: 'chest' }), t) }),
    mitya: OM.actor({ id: 'mitya', x: 400, y: 664, face: 1, draw: (c, a, t) => A.mitya(c, Object.assign({}, a, { pal: { pj: '#3a4a5a', stripe: '#34424f', skin: '#e2b79c', hair: '#5a4030' } }), t) }),
    vera: OM.actor({ id: 'vera', x: 780, y: 640, face: -1, draw: (c, a, t) => A.vera(c, Object.assign({}, a, { pal: PAL_VERA, hold: a.gave ? null : 'book' }), t) }),
    sem: OM.actor({ id: 'sem', x: 1000, y: 652, face: -1, draw: (c, a, t) => A.semWalk(c, Object.assign({}, a, { lantern: !G.flags.bye_sem, lit: true }), t) }),
    nik: OM.actor({ id: 'nik', x: 610, y: 636, face: 1, draw: (c, a, t) => A.nikodim(c, a, t) }),
  };
  // По щиколотку в воде: ноги под водой чуть видны.
  Object.values(people).forEach((p) => {
    const d = p.draw;
    p.litByScene = true;
    p.draw = (c, a, t) => {
      c.save();
      c.beginPath();
      c.rect(0, 0, W, a.y - 8 * a.s);
      c.clip();
      d(c, a, t);
      c.restore();
      c.save();
      c.globalAlpha = 0.3;
      c.beginPath();
      c.rect(0, a.y - 8 * a.s, W, 30);
      c.clip();
      d(c, a, t);
      c.restore();
      const k = (t * 0.5 + a.x * 0.01) % 1;
      c.strokeStyle = `rgba(230,220,230,${0.3 * (1 - k)})`;
      c.lineWidth = 1;
      c.beginPath();
      c.ellipse(a.x, a.y - 4, 14 + k * 24, 2 + k * 3, 0, 0, TAU);
      c.stroke();
    };
  });

  function back(ctx, t) {
    P.fogBand(ctx, t, 560, 120, 7, 0.45);
    // солнечная дорожка по воде справа
    P.streak(ctx, 1180, WATER + 2, 50, 120, '#ffd0a0', 0.35, 31, t);
    for (let i = 0; i < 5; i++) {
      const k = (t * 0.25 + i / 5) % 1;
      ctx.strokeStyle = `rgba(240,220,230,${0.18 * (1 - k)})`;
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.ellipse(150 + i * 260, 690, 10 + k * 70, 1.5 + k * 5, 0, 0, TAU);
      ctx.stroke();
    }
  }
  function over(ctx, t) {
    P.fogBand(ctx, t + 30, 690, 80, -5, 0.25);
    ctx.fillStyle = 'rgba(30,20,50,.12)';
    ctx.fillRect(0, 0, W, H);
  }
  // Шаги Льва — по воде: плеск.
  function update() {
    G.hero.item = 'none';
  }

  const talkHs = (who, name, look) => ({
    id: who, name, when: () => OM.story5.present(who),
    rect: () => { const a = people[who]; return [a.x - 36, a.y - 190 * a.s, 72, 190 * a.s]; },
    walk: () => { const a = people[who]; return [a.x + (a.face > 0 ? 70 : -70), 660]; },
    face: 0,
    use: async () => { const a = people[who]; G.hero.face = a.x > G.hero.x ? 1 : -1; await OM.story5.talkTo(who); if (who === 'vera') a.gave = true; },
    look,
  });

  OM.scene('dawn', {
    name: 'Площадь на рассвете',
    surface: 'water',
    figLight: { amb: 0.78, tint: '#8a7088', side: 1 },
    amb: { water: 0.55, wind: 0.35, drone: 0.12 },
    walk: [[30, 626], [1250, 626], [1250, 704], [30, 704]],
    depth: { y0: 626, s0: 0.96, y1: 704, s1: 1.06 },
    entries: { default: { x: 230, y: 664, face: 1 } },
    lights: [{ x: 1300, y: 380, color: '#ffc8a0', a: 0.7, reach: 1600 }],
    actors: () => Object.values(people),
    paint,
    back,
    over,
    update,
    hotspots: [
      { id: 'monument', name: 'Обелиск', rect: [160, 296, 90, 270], look: ['«Жителям села Покровское». Вода дошла до подножия. Как будто пришла прочитать.', 'Имён на обелиске нет. Только село и год.'] },
      { id: 'dk', name: 'ДК «Водник»', rect: [360, 170, 630, 220], look: 'ДК стоит в воде, как пароход. Колонны отражаются вниз — и там, внизу, их больше.' },
      { id: 'water', name: 'Вода', rect: [0, 690, W, 30], look: 'Тёплая. В октябре. Пахнет не тиной — ладаном.' },
      talkHs('zina', 'Зинаида Павловна', 'Зина. Шаль поверх пальто. Держит руку на груди — как будто там что-то болит или что-то лежит.'),
      talkHs('mitya', 'Митя', 'Митя в резиновых сапогах. Смотрит то на меня, то на воду.'),
      talkHs('vera', 'Вера', 'Вера. Глаза красные — не спала. Прижимает к себе папку.'),
      talkHs('sem', 'Семёныч', 'Семёныч в сапогах по колено. Фонарь горит, хоть уже светает.'),
      talkHs('nik', 'Отец Никодим', 'Никодим в епитрахили поверх подрясника. Служить собрался. Или провожать.'),
      {
        id: 'go', name: 'К пристани', rect: [1180, 440, 100, 200], walk: [1230, 664], face: 1,
        exit: { to: 'dawn', dir: 'right' },
        look: () => say(OM.story5.canGo() ? 'К пристани. К воде. Пора.' : 'Туда — потом. Сначала попрощаться.'),
      },
    ],
    setup() {
      Object.entries(people).forEach(([k, a]) => (a.visible = OM.story5.present(k)));
      G.hero.item = 'none';
    },
    async enter() {
      if (!G.flags.dawnSeen) { G.flags.dawnSeen = 1; await OM.story5.dawnIntro(); }
    },
  });
  // выход к воде — не переход, а спуск
  const goHs = G.scenes.dawn.hotspots.find((h) => h.id === 'go');
  delete goHs.exit;
  goHs.use = () => OM.story5.descend();
  OM.dawn = { people };
})();
