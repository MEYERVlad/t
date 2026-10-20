// Глава 5. Дом Анны в Покровском, 1955 год — под водой. Печь, зыбка, самовар, красный угол.
// Здесь Лев говорит с мамой и выбирает последний кадр.
(function () {
  const P = OM.P, S = OM.S, G = OM.G, A = OM.Actors;
  const { hex, rng, W, H, lerp, clamp } = OM;
  const TAU = Math.PI * 2;
  const say = (t, o) => OM.say('lev', t, o);
  const FLOOR = 612;
  const WIN = { x0: 560, x1: 720, y0: 230, y1: 400 };
  const CRADLE = { x: 430, y: 470 };

  function paint(g) {
    const r = rng(991);
    // бревенчатые стены
    for (let y = 0; y < FLOOR; y += 22) {
      P.fillV(g, 0, y, W, 22, [[0, '#6a5038'], [0.5, '#4e3a28'], [1, '#2e2218']]);
      g.fillStyle = 'rgba(0,0,0,.35)';
      g.fillRect(0, y + 20, W, 2);
      for (let k = 0; k < 6; k++) { g.fillStyle = 'rgba(0,0,0,.12)'; g.fillRect(r() * W, y + 6 + r() * 10, 30 + r() * 80, 1); }
      g.fillStyle = 'rgba(160,120,70,.25)';
      for (let k = 0; k < 3; k++) g.fillRect(r() * W, y + 9, 4, 3);
    }
    // мох в пазах
    for (let i = 0; i < 300; i++) { g.fillStyle = 'rgba(120,110,70,.25)'; g.fillRect(r() * W, Math.floor(r() * 28) * 22 + 19, 6 + r() * 10, 2); }
    // потолочная балка (матица)
    P.fillV(g, 0, 60, W, 30, [[0, '#5a4430'], [1, '#2a1e14']]);
    // окно на улицу под водой
    P.fillV(g, WIN.x0, WIN.y0, WIN.x1 - WIN.x0, WIN.y1 - WIN.y0, [[0, '#6aa0c0'], [0.6, '#2a5a78'], [1, '#1a3a50']]);
    for (let i = 0; i < 4; i++) P.cone(g, WIN.x0 + 30 + i * 40, WIN.y0, 6, 30, 170, '#e0f4ff', 0.25);
    g.fillStyle = '#1a3444';
    g.fillRect(WIN.x0, WIN.y0 + 110, WIN.x1 - WIN.x0, 60);
    g.beginPath(); g.moveTo(WIN.x0 + 20, WIN.y0 + 110); g.lineTo(WIN.x0 + 60, WIN.y0 + 80); g.lineTo(WIN.x0 + 100, WIN.y0 + 110); g.fill();
    g.fillStyle = 'rgba(255,200,120,.6)';
    g.fillRect(WIN.x0 + 50, WIN.y0 + 120, 10, 12);
    P.window(g, WIN.x0, WIN.y0, WIN.x1 - WIN.x0, WIN.y1 - WIN.y0, { frame: '#d8ccb0', ft: 7, glow: false, dark: 'rgba(0,0,0,0)' });
    // занавеска-задергушка
    g.fillStyle = 'rgba(240,235,220,.55)';
    g.fillRect(WIN.x0, WIN.y0, WIN.x1 - WIN.x0, 40);
    g.strokeStyle = '#a03028';
    g.lineWidth = 2;
    for (let x = WIN.x0 + 6; x < WIN.x1; x += 12) { g.beginPath(); g.moveTo(x, WIN.y0 + 34); g.lineTo(x + 6, WIN.y0 + 40); g.lineTo(x + 12, WIN.y0 + 34); g.stroke(); }
    // герань на подоконнике
    g.fillStyle = '#8a4a2a';
    g.fillRect(WIN.x0 + 110, WIN.y1 - 20, 26, 22);
    g.fillStyle = '#2a4a2a';
    for (let i = 0; i < 6; i++) { g.beginPath(); g.arc(WIN.x0 + 116 + (i % 3) * 8, WIN.y1 - 30 - Math.floor(i / 3) * 8, 7, 0, TAU); g.fill(); }
    g.fillStyle = '#d83a3a';
    g.beginPath(); g.arc(WIN.x0 + 124, WIN.y1 - 44, 6, 0, TAU); g.fill();
    // русская печь слева
    P.fillV(g, 30, 220, 300, FLOOR - 220, [[0, '#e8e0d0'], [1, '#b8b0a0']]);
    P.fillV(g, 20, 200, 320, 26, [[0, '#d8d0c0'], [1, '#a8a090']]);
    g.fillStyle = '#1a1210';
    g.beginPath(); g.moveTo(130, 470); g.lineTo(130, 410); g.quadraticCurveTo(180, 370, 230, 410); g.lineTo(230, 470); g.fill();
    g.fillStyle = 'rgba(255,140,60,.5)';
    g.beginPath(); g.ellipse(180, 460, 34, 8, 0, 0, TAU); g.fill();
    g.fillStyle = '#c8c0b0';
    g.fillRect(110, 470, 140, 16);
    // горшки и ухват
    g.fillStyle = '#6a3a22';
    g.beginPath(); g.ellipse(170, 452, 14, 12, 0, 0, TAU); g.fill();
    g.strokeStyle = '#3a2618';
    g.lineWidth = 4;
    g.beginPath(); g.moveTo(290, 600); g.lineTo(250, 360); g.stroke();
    g.beginPath(); g.arc(250, 352, 12, 0.3, Math.PI - 0.3, true); g.stroke();
    // лежанка, лоскутное одеяло на печи
    for (let i = 0; i < 8; i++) { g.fillStyle = ['#a83a2a', '#3a5a8a', '#c8a050', '#5a7a3a'][i % 4]; g.fillRect(40 + i * 34, 184, 34, 16); }
    // красный угол: икона, рушник, лампада
    g.fillStyle = '#2a1a10';
    g.fillRect(1120, 120, 120, 150);
    P.fillV(g, 1128, 128, 104, 134, [[0, '#d8a850'], [1, '#8a6020']]);
    g.fillStyle = '#5a3020';
    g.fillRect(1142, 142, 76, 106);
    g.fillStyle = '#e8c070';
    g.beginPath(); g.arc(1180, 170, 16, 0, TAU); g.fill();
    g.fillStyle = '#7a2a20';
    g.fillRect(1166, 186, 28, 56);
    g.fillStyle = '#f0e8d8';
    g.fillRect(1110, 110, 140, 12);
    g.fillRect(1110, 110, 12, 120);
    g.fillRect(1238, 110, 12, 120);
    for (let i = 0; i < 10; i++) { g.fillStyle = '#c03028'; g.fillRect(1112, 124 + i * 10, 8, 3); g.fillRect(1240, 124 + i * 10, 8, 3); }
    // стол, лавка, самовар
    P.fillV(g, 840, 500, 300, 16, [[0, '#d8ccb0'], [1, '#a89c80']]);
    g.fillStyle = '#4a3420';
    g.fillRect(850, 516, 10, 96);
    g.fillRect(1120, 516, 10, 96);
    P.fillV(g, 760, 560, 440, 14, [[0, '#6a5038'], [1, '#3a2a1a']]);
    // самовар
    P.fillV(g, 1000, 430, 54, 64, [[0, '#e8c070'], [0.5, '#b88a3a'], [1, '#7a5a20']]);
    g.fillStyle = '#b88a3a';
    g.beginPath(); g.moveTo(992, 494); g.lineTo(1062, 494); g.lineTo(1050, 502); g.lineTo(1004, 502); g.fill();
    g.fillRect(1018, 412, 18, 20);
    g.fillStyle = '#f0e0c0';
    g.fillRect(1022, 404, 10, 8);
    g.fillStyle = '#3a2a1a';
    g.fillRect(1054, 460, 14, 4);
    // чашки
    [[920, 494], [1090, 494]].forEach(([x, y]) => {
      g.fillStyle = '#f0e8e0';
      g.beginPath(); g.moveTo(x - 9, y - 12); g.lineTo(x + 9, y - 12); g.lineTo(x + 6, y); g.lineTo(x - 6, y); g.fill();
      g.fillStyle = '#c03028';
      g.fillRect(x - 8, y - 9, 16, 2);
      g.fillStyle = '#e8e0d8';
      g.beginPath(); g.ellipse(x, y + 1, 12, 3, 0, 0, TAU); g.fill();
    });
    // очеп и зыбка: шест от матицы
    g.strokeStyle = '#5a4430';
    g.lineWidth = 6;
    g.beginPath(); g.moveTo(330, 74); g.lineTo(CRADLE.x + 40, 120); g.stroke();
    // пол: половицы и половики
    P.fillV(g, 0, FLOOR, W, H - FLOOR, [[0, '#6a5038'], [1, '#2a1e14']]);
    for (let x = -100; x < W + 100; x += 70) { g.strokeStyle = 'rgba(0,0,0,.3)'; g.lineWidth = 1; g.beginPath(); g.moveTo(x + (x - 640) * 0.02, FLOOR); g.lineTo(x + (x - 640) * 0.3, H); g.stroke(); }
    for (let i = 0; i < 2; i++) {
      const y = 650 + i * 36;
      for (let k = 0; k < 20; k++) { g.fillStyle = ['#a83a2a', '#3a5a8a', '#d8c8a0', '#5a7a3a', '#8a5a8a'][(k + i * 2) % 5]; g.fillRect(260 + k * 32, y, 32, 14); }
    }
    // фотографии на стене
    g.fillStyle = '#2a1a10';
    g.fillRect(800, 230, 60, 76);
    P.fillV(g, 806, 236, 48, 64, [[0, '#c8b8a0'], [1, '#8a7a68']]);
    g.fillStyle = '#3a2a22';
    g.beginPath(); g.arc(824, 258, 7, 0, TAU); g.arc(840, 262, 6, 0, TAU); g.fill();
    g.fillRect(816, 266, 16, 30); g.fillRect(834, 268, 14, 28);
    // всё под водой: голубоватая дымка
    g.save();
    g.globalCompositeOperation = 'multiply';
    g.fillStyle = '#b8d0e0';
    g.fillRect(0, 0, W, H);
    g.restore();
    P.paper(g, 992, 0.08);
  }

  const ANNA_PAL = { cardigan: '#5a4a3a', blouse: '#d8ccb0', skirt: '#3a3030', skin: '#e2b49a', hair: '#3a2418', shoes: '#2a1c16', tights: '#3a302c' };
  const anna = OM.actor({ id: 'anna', x: 900, y: 650, face: -1, litByScene: true,
    draw: (c, a, t) => A.vera(c, Object.assign({}, a, { pal: ANNA_PAL, scarf: '#7a2a20', glasses: false, hold: a.hold || null, headTilt: a.tilt || 0 }), t) });

  function back(ctx, t) {
    // зыбка качается сама
    const sw = Math.sin(t * 1.1) * 0.08;
    ctx.save();
    ctx.translate(CRADLE.x + 40, 120);
    ctx.rotate(sw);
    ctx.strokeStyle = '#3a2a1a';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-44, 330); ctx.moveTo(0, 0); ctx.lineTo(44, 330); ctx.stroke();
    P.fillV(ctx, -56, 320, 112, 46, [[0, '#c8a878'], [1, '#8a6a40']]);
    ctx.fillStyle = '#e8e0d0';
    ctx.fillRect(-50, 318, 100, 8);
    ctx.strokeStyle = 'rgba(0,0,0,.3)';
    for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(-50 + i * 20, 326); ctx.lineTo(-50 + i * 20, 364); ctx.stroke(); }
    ctx.restore();
    // лампада
    const fl = 0.8 + Math.sin(t * 6) * 0.1 + Math.random() * 0.1;
    P.glow(ctx, 1180, 290, 50, '#ff5020', 0.5 * fl);
    ctx.fillStyle = '#a02018';
    ctx.beginPath(); ctx.arc(1180, 292, 7, 0, TAU); ctx.fill();
    // свет из окна и блики воды на стенах
    P.glow(ctx, 640, 320, 300, '#9ac8e8', 0.18);
    for (let i = 0; i < 26; i++) {
      const x = (i * 97 + Math.sin(t * 0.7 + i) * 30) % W, y = 100 + (i * 53) % 460;
      ctx.fillStyle = `rgba(200,235,255,${0.05 + 0.05 * Math.sin(t * 1.3 + i * 2)})`;
      ctx.beginPath(); ctx.ellipse(x, y, 30, 6, Math.sin(i), 0, TAU); ctx.fill();
    }
    // пар из самовара — пузырьками
    for (let i = 0; i < 8; i++) {
      const k = (t * 0.3 + i / 8) % 1;
      ctx.strokeStyle = `rgba(230,245,255,${0.5 * (1 - k)})`;
      ctx.beginPath(); ctx.arc(1027 + Math.sin(t * 2 + i) * 5, 400 - k * 260, 2 + (i % 3), 0, TAU); ctx.stroke();
    }
    P.glow(ctx, 1027, 470, 80, '#ffd080', 0.2);
  }
  function over(ctx, t) {
    for (let i = 0; i < 40; i++) {
      const k = (t * 0.03 + i * 0.137) % 1;
      ctx.fillStyle = 'rgba(220,240,255,.25)';
      ctx.fillRect((i * 97 + Math.sin(t * 0.3 + i) * 20) % W, H - k * H, 1.5, 1.5);
    }
  }
  function threads(ctx, t, k) {
    const h = G.hero;
    OM.thread(ctx, [h.x, h.y - 110 * h.s], [anna.x, anna.y - 110 * anna.s], t, { color: '#ffd27a', a: k, sag: 20, w: 2.4 });
  }

  OM.scene('annahouse', {
    name: 'Дом Анны',
    surface: 'wood',
    figLight: { amb: 0.7, tint: '#7a8aa0', side: -1 },
    amb: { water: 0.4, drone: 0.1, indoor: true },
    walk: [[120, 630], [820, 630], [820, 700], [120, 700]],
    depth: { y0: 630, s0: 1.32, y1: 700, s1: 1.44 },
    entries: { default: { x: 150, y: 668, face: 1 } },
    lights: [{ x: 640, y: 300, color: '#b8d8f0', a: 0.6, reach: 700 }, { x: 1180, y: 290, color: '#ff8050', a: 0.4, reach: 300 }],
    actors: () => [anna],
    paint,
    back,
    over,
    threads,
    hotspots: [
      { id: 'door', name: 'Дверь на улицу', rect: [0, 300, 60, 320], exit: { to: 'inverse', entry: 'back', dir: 'left' } },
      { id: 'stove', name: 'Печь', rect: [30, 200, 300, 400], look: 'Печь топится. Под водой. Угли тлеют — и ничего им не делается.' },
      { id: 'cradle', name: 'Зыбка', rect: [CRADLE.x - 20, 420, 130, 100], look: ['Зыбка. Моя. Пустая — а качается.', 'Мама качала её ногой, пока шила. Я этого не помню. А тело помнит.'] },
      { id: 'icon', name: 'Красный угол', rect: [1100, 100, 160, 210], look: 'Покров Богородицы. Над иконой — рушник с петухами. Лампада горит под водой ровно.' },
      { id: 'samovar', name: 'Самовар', rect: [990, 400, 80, 104], look: 'Самовар кипит. Сорок лет. Пар идёт пузырями.' },
      { id: 'photo', name: 'Фотографии', rect: [796, 226, 70, 84], look: 'Анна и отец. Отца я не знал совсем. Высокий. Шляпу держит в руке.' },
      { id: 'window', name: 'Окно', rect: [WIN.x0, WIN.y0, WIN.x1 - WIN.x0, WIN.y1 - WIN.y0], look: 'В окне — улица под водой. Свет сверху, как из проруби.' },
      { id: 'anna', name: 'Мама', rect: () => [anna.x - 46, anna.y - 270, 92, 270], walk: [780, 668], face: 1, use: () => OM.story5.annaTalk(), look: 'Мама. Платок красный, мамин-мамин. Руки в муке — пекла. Сорок лет пекла.' },
    ],
    setup() { anna.x = 900; anna.y = 650; anna.face = -1; anna.hold = null; G.hero.item = 'none'; S.choir(false); },
    async enter() {
      if (G.flags.annaHouseSeen) return;
      G.flags.annaHouseSeen = 1;
      OM.letterbox(true);
      await OM.wait(600);
      await say('Тепло. Пахнет хлебом и чабрецом. И — немного — тиной.');
      await OM.say('anna', 'Лёвушка. Разувайся. Полы мыла.');
      OM.letterbox(false);
    },
  });
  OM.annahouse = { anna };
})();
