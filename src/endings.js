// Три концовки «Омута»: Берег (обрезать нити), Омут (остаться), Покров (отпеть — скрытая).
(function () {
  const G = OM.G, S = OM.S, P = OM.P, A = OM.Actors;
  const { W, H, lerp, rng, clamp, hex } = OM;
  const TAU = Math.PI * 2;
  const say = (t, o) => OM.say('lev', t, o);
  const E = (OM.endings = {});
  const tw = async (ms, f) => { const t0 = performance.now(); while (performance.now() - t0 < ms) { f((performance.now() - t0) / ms); await OM.wait(16); } f(1); };
  const ANNA = { cardigan: '#5a4a3a', blouse: '#d8ccb0', skirt: '#3a3030', skin: '#e2b49a', hair: '#3a2418', shoes: '#2a1c16', tights: '#3a302c' };
  const ZINA = { cardigan: '#5a4c44', blouse: '#c9bfae', skirt: '#3a3236', skin: '#d3a68e', hair: '#9a948c', shoes: '#2a1c16', tights: '#4a3a34' };
  const DAY = { amb: 0.95, tint: '#c8b8a0', side: 1 };
  const present = (w) => OM.story5.present(w);

  // ---------- Общие картины ----------
  // ПАЗ: кремовый с красной полосой.
  function paz(ctx, x, y, s) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.fillStyle = 'rgba(0,0,0,.3)';
    ctx.beginPath(); ctx.ellipse(0, 0, 250, 14, 0, 0, TAU); ctx.fill();
    P.fillV(ctx, -230, -190, 460, 170, [[0, '#f0e6c8'], [1, '#c8b890']]);
    ctx.fillStyle = '#e8dcb8';
    P.rrect(ctx, -236, -196, 472, 30, 16);
    ctx.fill();
    ctx.fillStyle = '#b83a2a';
    ctx.fillRect(-230, -70, 460, 14);
    for (let i = 0; i < 6; i++) {
      const wx = -200 + i * 66;
      P.fillV(ctx, wx, -160, 54, 62, [[0, '#9ab8d0'], [1, '#5a7890']]);
      ctx.fillStyle = 'rgba(255,255,255,.35)';
      ctx.beginPath(); ctx.moveTo(wx + 4, -156); ctx.lineTo(wx + 22, -156); ctx.lineTo(wx + 4, -120); ctx.fill();
    }
    ctx.fillStyle = '#3a3a3a';
    ctx.fillRect(-236, -24, 472, 10);
    for (const wx of [-150, 150]) {
      ctx.fillStyle = '#1a1a1a';
      ctx.beginPath(); ctx.arc(wx, -10, 30, 0, TAU); ctx.fill();
      ctx.fillStyle = '#8a8a88';
      ctx.beginPath(); ctx.arc(wx, -10, 12, 0, TAU); ctx.fill();
    }
    ctx.fillStyle = '#ffe8a0';
    ctx.fillRect(-236, -60, 10, 14);
    P.text(ctx, 'ТИХИЙ ОМУТ — РАЙЦЕНТР', 0, -178, { font: '700 12px "PT Serif",serif', color: '#3a2a1a' });
    ctx.restore();
  }
  // Утренняя остановка: солнце, берёзы, табличка — тот же поворот, где всё началось.
  function paintBusMorning(g) {
    P.fillV(g, 0, 0, W, 470, [[0, '#7aa8d8'], [0.7, '#c8dcec'], [1, '#f0e8d0']]);
    P.glow(g, 1080, 160, 360, '#fff4d0', 0.6);
    P.clouds(g, 1201, { y0: 60, y1: 200, n: 7, color: '#ffffff', a: 0.55, size: [120, 260] });
    P.forest(g, 1202, { yb: 470, hMin: 40, hMax: 110, color: '#3a5a44', step: [10, 22] });
    // озеро вдали блестит
    P.fillV(g, 600, 455, 680, 18, [[0, '#9ac0d8'], [1, '#6a90b0']]);
    for (let i = 0; i < 30; i++) { g.fillStyle = 'rgba(255,255,240,.7)'; g.fillRect(620 + (i * 37) % 640, 458 + (i % 3) * 4, 12, 1.4); }
    // поле, дорога
    P.fillV(g, 0, 470, W, 250, [[0, '#b8a060'], [1, '#7a6a3a']]);
    P.fillV(g, 0, 600, W, 70, [[0, '#6a6a68'], [1, '#4a4a48']]);
    g.fillStyle = '#e8e0c0';
    for (let x = 0; x < W; x += 80) g.fillRect(x, 634, 40, 3);
    // берёзы с золотом
    const r = rng(1203);
    for (let i = 0; i < 6; i++) {
      const x = 40 + i * 230 + r() * 60;
      P.birch(g, x, 600, 260 + r() * 80, 1210 + i, { light: '#f0ece0', shade: '#9a9488', branch: '#5a4a3a' });
      for (let k = 0; k < 90; k++) {
        g.fillStyle = ['#e8b830', '#d89a28', '#f0d060'][(r() * 3) | 0];
        g.beginPath(); g.ellipse(x + (r() - 0.5) * 160, 600 - 160 - r() * 160, 4, 2.6, r() * 3, 0, TAU); g.fill();
      }
    }
    // остановка — та же, днём облезлая и мирная
    P.fillV(g, 140, 420, 360, 16, [[0, '#8a8a84'], [1, '#5a5a54']]);
    g.fillStyle = '#7a7a74';
    g.fillRect(150, 436, 10, 168);
    g.fillRect(480, 436, 10, 168);
    P.fillV(g, 160, 440, 320, 140, [[0, '#a8b0b0'], [1, '#8a9090']]);
    g.fillStyle = '#6a7070';
    g.fillRect(190, 540, 260, 10);
    // табличка
    g.fillStyle = '#f0ece0';
    g.fillRect(1020, 470, 140, 60);
    g.strokeStyle = '#2a2a2a';
    g.lineWidth = 3;
    g.strokeRect(1020, 470, 140, 60);
    P.text(g, 'ТИХИЙ', 1090, 490, { font: '700 18px "PT Serif",serif', color: '#2a2a2a' });
    P.text(g, 'ОМУТ', 1090, 512, { font: '700 18px "PT Serif",serif', color: '#2a2a2a' });
    g.fillStyle = '#5a5a5a';
    g.fillRect(1086, 530, 6, 74);
  }
  // Рассвет на пристани: туман, розовое небо.
  function paintPierDawn(g) {
    P.fillV(g, 0, 0, W, 440, [[0, '#5a6a98'], [0.55, '#e0a8a8'], [1, '#f8d8b0']]);
    P.glow(g, 900, 430, 300, '#fff0c8', 0.7);
    P.forest(g, 1301, { yb: 440, hMin: 16, hMax: 46, color: '#4a4a6a', step: [6, 12] });
    P.fillV(g, 0, 440, W, 280, [[0, '#d8b8b8'], [0.4, '#8a90b0'], [1, '#3a4060']]);
    P.streak(g, 900, 444, 80, 260, '#fff0c8', 0.6, 13, 0);
    // мостки слева
    P.fillV(g, 0, 560, 700, 18, [[0, '#6a5038'], [1, '#2a1e14']]);
    for (let x = 30; x < 700; x += 70) { g.fillStyle = '#2a1e14'; g.fillRect(x, 578, 8, 140); }
    // фонарь — погашен
    g.fillStyle = '#2a2a30';
    g.fillRect(520, 330, 6, 232);
    g.fillRect(500, 324, 40, 8);
  }
  // Восход над Покровским: церковь в воде с золотым куполом, берег.
  function paintSunrise(g) {
    P.fillV(g, 0, 0, W, 420, [[0, '#7aa0d0'], [0.6, '#f0c8a0'], [1, '#ffe0b0']]);
    P.glow(g, 640, 410, 420, '#fff4c8', 0.8);
    P.clouds(g, 1401, { y0: 80, y1: 240, n: 6, color: '#fff0e0', a: 0.5, size: [160, 300] });
    P.forest(g, 1402, { yb: 420, hMin: 18, hMax: 50, color: '#5a6070', step: [6, 12] });
    P.fillV(g, 0, 420, W, 300, [[0, '#f0d0b0'], [0.4, '#8aa0c0'], [1, '#3a4a6a']]);
    P.streak(g, 640, 424, 120, 280, '#fff4c8', 0.7, 21, 0);
    // церковь в воде: храм, барабан с золотым куполом, колокольня
    P.fillV(g, 860, 300, 150, 130, [[0, '#f4f0e4'], [1, '#c8c0b0']]);
    g.fillStyle = '#e8e2d4';
    g.beginPath(); g.moveTo(850, 302); g.lineTo(935, 260); g.lineTo(1020, 302); g.fill();
    for (let i = 0; i < 3; i++) {
      g.fillStyle = '#6a7a90';
      g.beginPath(); g.moveTo(878 + i * 44, 380); g.lineTo(878 + i * 44, 336); g.arc(888 + i * 44, 336, 10, Math.PI, 0); g.lineTo(898 + i * 44, 380); g.fill();
    }
    g.fillStyle = 'rgba(120,100,80,.35)';
    g.fillRect(860, 404, 150, 26);
    P.fillV(g, 905, 220, 60, 50, [[0, '#f8f4e8'], [1, '#c8c4b8']]);
    g.fillStyle = '#e8b840';
    g.beginPath(); g.moveTo(900, 222); g.quadraticCurveTo(935, 150, 970, 222); g.fill();
    g.fillStyle = 'rgba(255,250,220,.6)';
    g.beginPath(); g.moveTo(912, 214); g.quadraticCurveTo(925, 172, 940, 160); g.lineTo(942, 168); g.quadraticCurveTo(930, 182, 920, 216); g.fill();
    g.fillStyle = '#e8b840';
    g.fillRect(933, 120, 4, 36); g.fillRect(925, 130, 20, 4); g.fillRect(928, 142, 14, 3);
    // колокольня слева
    P.fillV(g, 810, 250, 46, 180, [[0, '#f4f0e4'], [1, '#c8c0b0']]);
    g.fillStyle = '#4a5a70';
    g.beginPath(); g.moveTo(818, 300); g.lineTo(818, 276); g.arc(833, 276, 15, Math.PI, 0); g.lineTo(848, 300); g.fill();
    g.fillStyle = '#c89a40';
    g.beginPath(); g.moveTo(825, 292); g.quadraticCurveTo(833, 280, 841, 292); g.lineTo(843, 300); g.lineTo(823, 300); g.fill();
    g.fillStyle = '#e8b840';
    g.beginPath(); g.moveTo(806, 252); g.lineTo(833, 196); g.lineTo(860, 252); g.fill();
    g.fillRect(831, 170, 4, 28);
    P.glow(g, 935, 190, 70, '#ffe080', 0.6);
    // отражение церкви
    g.save();
    g.globalAlpha = 0.35;
    g.translate(0, 860);
    g.scale(1, -1);
    g.fillStyle = '#f0ece0';
    g.fillRect(860, 300, 150, 130);
    g.fillStyle = '#e8b840';
    g.beginPath(); g.moveTo(900, 222); g.quadraticCurveTo(935, 150, 970, 222); g.fill();
    g.restore();
    // берег с травой
    g.fillStyle = '#5a6a3a';
    g.beginPath(); g.moveTo(0, 580); g.quadraticCurveTo(300, 560, 640, 600); g.lineTo(640, 720); g.lineTo(0, 720); g.fill();
    P.fillV(g, 0, 600, 700, 120, [[0, 'rgba(90,110,60,.5)'], [1, 'rgba(40,50,30,.9)']]);
  }
  // Церковь 1955 года изнутри: золото, свечи, люди.
  function paintService(g) {
    P.fillV(g, 0, 0, W, H, [[0, '#3a2a1c'], [0.6, '#6a4a2a'], [1, '#2a1a10']]);
    const saint = OM.church.saint;
    saint(g, 80, 160, 240, 701);
    saint(g, 220, 170, 230, 702);
    g.fillStyle = '#c9a050';
    g.fillRect(760, 90, 480, 520);
    for (let tier = 0; tier < 4; tier++) for (let k = 0; k < 6; k++) {
      P.fillV(g, 776 + k * 76, 112 + tier * 120, 60, 96, [[0, '#a86a30'], [1, '#6a4a1c']]);
      g.fillStyle = '#f0c868';
      g.beginPath(); g.arc(806 + k * 76, 140 + tier * 120, 13, 0, TAU); g.fill();
    }
    g.fillStyle = '#2a1a10';
    g.beginPath(); g.moveTo(950, 610); g.lineTo(950, 470); g.quadraticCurveTo(1000, 420, 1050, 470); g.lineTo(1050, 610); g.fill();
    P.fillV(g, 0, 610, W, 110, [[0, '#5a3a22'], [1, '#2a1a10']]);
  }
  function candles(ctx, t, x0, n, a = 1) {
    for (let i = 0; i < n; i++) {
      const x = x0 + (i % 8) * 16 + Math.floor(i / 8) * 8, y = 540 + Math.floor(i / 8) * 12;
      ctx.fillStyle = '#e8dcc0';
      ctx.fillRect(x, y, 2.5, 16);
      P.glow(ctx, x + 1, y - 3, 12, '#ffcc66', a * (0.6 + Math.sin(t * 9 + i) * 0.15));
    }
  }

  // ---------- Титры ----------
  async function credits(endName, sub) {
    const lines = [
      ['ОМУТ', 60], [endName, 30], ['', 20],
      ['Лев Гордеев', 24], ['коммивояжёр, продавец энциклопедий', 15], ['', 8],
      ['Зинаида Павловна', 22], ['Митя', 22], ['Вера Андреевна', 22], ['Семёныч', 22], ['отец Никодим', 22], ['Анна Гордеева', 22], ['', 16],
      ['и жители села Покровское', 18], ['Кузнецов Илья · Ершова Мария · Дьячков Ефим', 15], ['Лаптев Иван · Рыбин Тимофей', 15], ['Савина Евдокия · Сельцов Павел', 15], ['', 20],
      ['Каждый кадр нарисован кодом,', 16], ['каждый звук — сыгран кодом.', 16], ['Ни одной картинки. Ни одного аудиофайла.', 16], ['', 20],
      [`Достижения: ${OM.ach.count()} из ${OM.ach.LIST.length}`, 18], ['', 20],
      ['Всем затопленным сёлам —', 20], ['и тем, кто их помнит.', 20],
    ];
    const total = lines.reduce((s, [, h]) => s + h * 2.1, 0);
    const v = { y: H + 40 };
    OM.vision((ctx) => {
      ctx.fillStyle = '#05060a';
      ctx.fillRect(0, 0, W, H);
      let y = v.y;
      for (const [s, h] of lines) {
        if (s) P.text(ctx, s, W / 2, y, { font: `${h > 40 ? '700' : h > 20 ? '600' : 'italic 500'} ${h}px "Cormorant Garamond",serif`, color: h > 40 ? '#f4e6c8' : '#d8ccb4', ls: h > 40 ? 24 : 2, alpha: clamp((y + 40) / 120, 0, 1) * clamp((H - y + 40) / 120, 0, 1) });
        y += h * 2.1;
      }
      if (sub && v.y < -total + H * 0.5) P.text(ctx, sub, W / 2, H / 2, { font: 'italic 500 22px "Cormorant Garamond",serif', color: '#c8bca4', alpha: clamp((-total + H * 0.5 - v.y) / 200, 0, 1) });
    });
    S.music('end');
    OM.fadeTo(0, 1500);
    await tw(26000, (k) => (v.y = H + 40 - k * (total + H * 0.6)));
    await OM.wait(2500);
    await OM.fadeTo(1, 1600);
    OM.endVision();
    S.music(null);
  }
  async function finish(id, name, sub) {
    OM.store.set('omut-ch5-done', 1);
    OM.store.set('omut-end-' + id, 1);
    OM.ach.unlock('end' + id);
    if (!G.flags.breathFails) OM.ach.unlock('breath');
    await credits(name, sub);
    OM.clearSave();
    G.hero.item = 'case';
    OM.letterbox(false);
    OM.toTitle();
  }

  // ---------- А. Берег: обрезать нити ----------
  const MEM = {
    mitya: { scene: 'pier', who: 'Митя', line: 'Пристань. Мальчик в пижаме у самой воды… Как его звали?' },
    zina: { scene: 'lobby', who: 'Зинаида Павловна', line: 'Холл гостиницы. Женщина за стойкой, очки на цепочке. Кто она мне?' },
    vera: { scene: 'library', who: 'Вера', line: 'Библиотека. Зелёная лампа. Чьи-то руки с книгой… Не помню.' },
    sem: { scene: 'square', who: 'Семёныч', line: 'Площадь. Старик на скамейке, папироса. Мы разве говорили?' },
    nik: { scene: 'shore', who: 'отец Никодим', line: 'Берег на закате. Костёр. Священник… или рыбак?' },
  };
  E.A = async () => {
    G.busy++;
    OM.letterbox(true);
    const ppl = ['mitya', 'zina', 'vera', 'sem', 'nik'].filter(present);
    const n = ppl.length;
    const threads = ppl.map((id, i) => {
      const ang = Math.PI * (0.15 + 0.7 * (i / Math.max(1, n - 1)));
      return { id, a: [640, 430], b: [640 + Math.cos(ang + Math.PI) * 470, 420 - Math.sin(ang) * 250 + 120], cut: 0 };
    });
    threads.push({ id: 'anna', a: [640, 430], b: [640, 90], cut: 0, mother: true });
    const v = { mem: null, memA: 0, white: 0, prev: null, scis: 0 };
    const drawPortrait = (ctx, th, t) => {
      const [x, y] = th.b, al = 1 - th.cut;
      if (al <= 0) return;
      ctx.save();
      ctx.globalAlpha = al;
      ctx.beginPath(); ctx.arc(x, y, 46, 0, TAU); ctx.fillStyle = '#1a2030'; ctx.fill();
      ctx.save(); ctx.clip();
      const L = { amb: 0.9, tint: '#a0a8c0' };
      const o = { x, y: y + (th.mother ? 290 : 260), s: 1.6, face: 1, light: L };
      if (th.id === 'mitya') A.mitya(ctx, Object.assign(o, { y: y + 175, s: 1.7 }), t);
      if (th.id === 'zina') A.vera(ctx, Object.assign(o, { pal: ZINA, shawl: '#7a3a2e', highBun: true }), t);
      if (th.id === 'vera') A.vera(ctx, o, t);
      if (th.id === 'sem') A.semWalk(ctx, Object.assign(o, { y: y + 290, lantern: false }), t);
      if (th.id === 'nik') A.nikodim(ctx, Object.assign(o, { y: y + 295 }), t);
      if (th.mother) A.vera(ctx, Object.assign(o, { y: y + 262, pal: ANNA, scarf: '#7a2a20', glasses: false }), t);
      ctx.restore();
      ctx.strokeStyle = th.mother ? '#ffe0a0' : '#ffd27a';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(x, y, 46, 0, TAU); ctx.stroke();
      P.text(ctx, th.mother ? 'мама' : MEM[th.id].who, x, y + 66, { font: 'italic 16px "Cormorant Garamond",serif', color: '#f0e0c0' });
      ctx.restore();
    };
    OM.vision((ctx, t) => {
      P.fillV(ctx, 0, 0, W, H, [[0, '#0a1424'], [1, '#02050a']]);
      for (let i = 0; i < 6; i++) P.cone(ctx, 300 + i * 140, -20, 20, 120, 700, '#a0c0e0', 0.08);
      threads.forEach((th) => {
        if (th.cut < 1) {
          if (th.cut === 0) OM.thread(ctx, th.a, th.b, t, { color: th.mother ? '#ffe0a0' : '#ffd27a', a: 1, sag: 20, w: th.mother ? 3 : 2 });
          else {
            // обрезанная нить опадает
            const k = th.cut;
            OM.thread(ctx, th.a, [lerp(th.a[0], th.b[0], 0.45), lerp(th.a[1], th.b[1], 0.45) + k * 120], t, { color: '#ffd27a', a: 1 - k, sag: 30, w: 1.4 });
            OM.thread(ctx, th.b, [lerp(th.b[0], th.a[0], 0.45), lerp(th.b[1], th.a[1], 0.45) + k * 120], t, { color: '#ffd27a', a: 1 - k, sag: 30, w: 1.4 });
          }
        }
        drawPortrait(ctx, th, t);
      });
      // Лев в центре
      A.hero(ctx, { x: 640, y: 560, s: 1.4, face: 1, item: 'none', light: { amb: 0.6, tint: '#3a4a6a' }, rim: { color: 'rgba(255,220,160,.5)', dx: 1.2 } }, t);
      // воспоминание горит и гаснет
      if (v.mem && v.memA > 0) {
        const img = OM.cache(v.mem + ':bg', (g) => G.scenes[v.mem].paint(g));
        ctx.save();
        ctx.globalAlpha = v.memA;
        ctx.translate(W / 2, H / 2 - 40);
        ctx.rotate(-0.04);
        ctx.fillStyle = '#f0ead8';
        ctx.fillRect(-250, -150, 500, 320);
        ctx.drawImage(img, -236, -136, 472, 266);
        // прогорающий край
        ctx.globalCompositeOperation = 'destination-out';
        const burn = 1 - v.memA;
        ctx.fillStyle = P.rgrad(ctx, 250, 170, 0, 700 * burn, [[0, 'rgba(0,0,0,1)'], [0.8, 'rgba(0,0,0,1)'], [1, 'rgba(0,0,0,0)']]);
        ctx.fillRect(-260, -160, 520, 340);
        ctx.restore();
      }
      // курсор-ножницы
      if (G.mouse.x >= 0 && v.scis) {
        ctx.save();
        ctx.translate(G.mouse.x, G.mouse.y);
        ctx.rotate(-0.6);
        ctx.scale(0.8, 0.8);
        ctx.translate(-32, -32);
        OM.Icons.scissors(ctx);
        ctx.restore();
      }
      if (v.white > 0) { ctx.fillStyle = `rgba(255,252,240,${v.white})`; ctx.fillRect(0, 0, W, H); }
    });
    await OM.fadeTo(0, 900);
    await say(OM.has('scissors') ? 'Ножницы Зины. Нить за нитью.' : 'Ножниц нет. Значит — руками. Нить за нитью.');
    OM.toast('Проведите курсором (пальцем) с зажатой кнопкой поперёк нити — перерезать.');
    v.scis = 1;
    // резать: отрезок движения мыши пересекает нить
    const crosses = (p, q, a, b) => {
      const d = (x1, y1, x2, y2, x3, y3) => (x3 - x1) * (y2 - y1) - (y3 - y1) * (x2 - x1);
      const d1 = d(a[0], a[1], b[0], b[1], p[0], p[1]), d2 = d(a[0], a[1], b[0], b[1], q[0], q[1]);
      const d3 = d(p[0], p[1], q[0], q[1], a[0], a[1]), d4 = d(p[0], p[1], q[0], q[1], b[0], b[1]);
      return d1 * d2 < 0 && d3 * d4 < 0;
    };
    let order = threads.filter((th) => !th.mother);
    for (let idx = 0; idx < threads.length; idx++) {
      const isLast = idx === threads.length - 1;
      if (isLast) {
        await OM.say('anna', 'Режь, Лёвушка. Я тебя отпускаю. Живи — и не оглядывайся на воду.');
      }
      // ждём разреза любой из оставшихся (мамина — последней)
      const cut = await new Promise((res) => {
        const tick = () => {
          const m = [G.mouse.x, G.mouse.y];
          if (G.mouse.down && v.prev) {
            const pool = isLast ? threads.filter((th) => th.mother) : order.filter((th) => !th.cut);
            for (const th of pool) {
              const mid = [(th.a[0] + th.b[0]) / 2, (th.a[1] + th.b[1]) / 2 + 20];
              if (crosses(v.prev, m, th.a, mid) || crosses(v.prev, m, mid, th.b)) return res(th);
            }
            if (!isLast && threads.find((th) => th.mother) && (crosses(v.prev, m, [640, 430], [640, 260]) || crosses(v.prev, m, [640, 260], [640, 90])) && !v.warned) {
              v.warned = 1;
              OM.toast('Мамина нить — последней.');
            }
          }
          v.prev = G.mouse.down ? m : null;
          if (window.__omAutoCut) { const pool = isLast ? threads.filter((th) => th.mother) : order.filter((th) => !th.cut); return res(pool[0]); }
          requestAnimationFrame(tick);
        };
        tick();
      });
      S.click();
      S.staticNoise(0.15, 0.1);
      OM.shake(3);
      tw(1200, (k) => (cut.cut = k));
      if (cut.mother) break;
      const mem = MEM[cut.id];
      v.mem = mem.scene;
      v.memA = 1;
      OM.say('narr', mem.line, { italic: true, hold: 2.2 });
      await tw(2600, (k) => (v.memA = 1 - k * k));
      v.mem = null;
      if (G.saying) G.saying.res();
    }
    v.scis = 0;
    S.hit();
    await tw(1400, (k) => (v.white = k));
    OM.endVision();
    // Эпилог: утренняя остановка
    const e = { bus: -400, busStop: false, lev: 1, mitya: -60, mA: 0, zina: 0, window: 0, an: 0, leave: false };
    OM.vision((ctx, t) => {
      if (e.window > 0) return busWindow(ctx, t, e);
      ctx.drawImage(OM.cache('end:bus', paintBusMorning), 0, 0, W, H);
      if (e.lev) A.hero(ctx, { x: 330, y: 600, s: 1.02, face: e.levFace || -1, item: 'case', light: DAY, alpha: e.lev }, t);
      if (e.mA > 0) A.mitya(ctx, { x: e.mitya, y: 606, s: 1.05, face: 1, move: e.mMove || 0, phase: t * 9, light: DAY, alpha: e.mA, talking: e.mTalk }, t);
      if (e.zina > 0) A.vera(ctx, { x: 120, y: 604, s: 1.02, face: 1, pal: ZINA, shawl: '#7a3a2e', highBun: true, light: DAY, alpha: e.zina }, t);
      paz(ctx, e.bus, 612, 1.05);
      P.glow(ctx, 1080, 160, 200, '#fff4d0', 0.25);
    });
    await OM.fadeTo(0, 1600);
    S.amb({ wind: 0.3 });
    await OM.wait(800);
    await say('Утро. Автобус до райцентра — в семь двадцать.');
    await say('Командировка кончилась. Странно: не помню ни одной продажи. А том «О» почему-то пропал.');
    e.mA = 1; e.mMove = 1;
    await tw(1600, (k) => (e.mitya = lerp(-40, 250, k)));
    e.mMove = 0;
    e.mTalk = true;
    await OM.say('mitya', 'Дядя Лев! Вы уезжаете?');
    e.mTalk = false;
    e.levFace = -1;
    await say('Простите… мы знакомы?');
    await OM.wait(700);
    await tw(800, (k) => (e.zina = k));
    await OM.say('zina', 'Пойдём, Митя. Человек торопится.');
    await OM.say('mitya', 'Но он же…');
    await OM.say('zina', 'Пойдём.', { italic: true });
    await say('Хороший у вас город. Тихий.');
    S.bus(true);
    await tw(3200, (k) => (e.bus = lerp(1700, 640, OM.smooth(k))));
    S.rev && S.rev();
    await tw(900, (k) => (e.lev = 1 - k));
    await OM.wait(500);
    await tw(3000, (k) => (e.bus = lerp(640, -500, k * k)));
    S.bus(false);
    await OM.fadeTo(1, 800);
    e.window = 1;
    await OM.fadeTo(0, 900);
    await OM.wait(1200);
    await tw(2500, (k) => (e.an = k));
    await OM.wait(2600);
    await OM.say('narr', 'В ту осень вода ушла из Тихого Омута и больше не вернулась.', { hold: 2.4 });
    await OM.say('narr', 'Лев Гордеев продал ещё четыреста энциклопедий. Каждую осень, под Покров, у него без причины щемит сердце.', { hold: 2.6 });
    await OM.fadeTo(1, 1600);
    OM.endVision();
    G.busy--;
    OM.store.set('omut-forgot', 1);
    await finish('A', 'Концовка «Берег»', 'Город спасён. Лев забыл всё.');
  };
  // Окно автобуса: Лев смотрит на поле, в стекле — отражение женщины в платке. Улыбается.
  function busWindow(ctx, t, e) {
    P.fillV(ctx, 0, 0, W, H, [[0, '#d8c8a0'], [1, '#8a7a50']]);
    // за стеклом бежит осень
    const off = (t * 300) % 400;
    for (let i = -1; i < 5; i++) {
      const x = W - ((i * 400 + off) % (W + 400));
      P.birch(ctx, x, 720, 600, 1500 + i, { light: '#f0ece0', shade: '#9a9488', branch: '#6a5a4a' });
    }
    // рама окна
    ctx.fillStyle = '#e8dcb8';
    ctx.fillRect(0, 0, W, 90);
    ctx.fillRect(0, 630, W, 90);
    ctx.fillRect(0, 0, 90, H);
    ctx.fillRect(W - 90, 0, 90, H);
    // отражение мамы в стекле
    if (e.an > 0) {
      ctx.save();
      ctx.globalAlpha = 0.3 * e.an;
      ctx.beginPath(); ctx.rect(90, 90, W - 180, 540); ctx.clip();
      A.vera(ctx, { x: 880, y: 1240, s: 5.4, face: -1, pal: ANNA, scarf: '#a03028', glasses: false, light: { amb: 1, tint: '#ffffff' }, talking: false }, t);
      ctx.restore();
    }
    // Лев в профиль у окна
    ctx.save();
    ctx.beginPath(); ctx.rect(90, 90, W - 180, 540); ctx.clip();
    A.hero(ctx, { x: 360, y: 1300, s: 5.2, face: 1, item: 'none', hat: false, light: { amb: 0.75, tint: '#a08a60' } }, t);
    ctx.restore();
    ctx.fillStyle = 'rgba(255,255,255,.08)';
    ctx.beginPath(); ctx.moveTo(500, 90); ctx.lineTo(640, 90); ctx.lineTo(300, 630); ctx.lineTo(160, 630); ctx.fill();
  }

  // ---------- Б. Омут: остаться ----------
  E.B = async () => {
    G.busy++;
    OM.letterbox(true);
    const v = { k: 0, hand: 0, light: 0, gone: 0, white: 0, bell: 0 };
    await OM.say('anna', 'Останешься? Правда?');
    await say('Останусь, мама. Я сорок лет шёл домой.');
    await OM.fadeTo(1, 900);
    OM.vision((ctx, t) => {
      ctx.drawImage(OM.cache('end:service', paintService), 0, 0, W, H);
      candles(ctx, t, 820, 32);
      P.glow(ctx, 640, 300, 500, '#ffd090', 0.15 + v.light * 0.4);
      // все — и названные, и нет — стоят на службе
      const r = rng(77);
      for (let i = 0; i < 9; i++) {
        const x = 120 + i * 70 + r() * 20, al = clamp(1 - v.gone * 1.4 + i * 0.05, 0, 1);
        if (al <= 0) continue;
        if (i % 3 === 1) A.hero(ctx, { x, y: 640, s: 0.92, face: 1, item: 'none', hat: false, light: { amb: 0.8, tint: '#c8a070' }, alpha: al }, t);
        else A.vera(ctx, { x, y: 640, s: 0.92, face: 1, scarf: ['#7a2a20', '#3a4a6a', '#6a5a3a'][i % 3], glasses: false, light: { amb: 0.8, tint: '#c8a070' }, alpha: al }, t);
        if (v.gone > 0) P.glow(ctx, x, 540, 60, '#fff0c0', (1 - al) * 0.8 * (al > 0 ? 1 : 0));
      }
      // мама и Лев — рука в руке
      A.vera(ctx, { x: 760, y: 660, s: 1.1, face: -1, pal: ANNA, scarf: '#7a2a20', glasses: false, hold: v.hand > 0.5 ? 'reach' : null, light: { amb: 0.9, tint: '#e0b080' } }, t);
      A.hero(ctx, { x: 690, y: 664, s: 1.12, face: 1, item: 'none', hat: false, pose: v.hand > 0.5 ? 'reach' : null, light: { amb: 0.9, tint: '#e0b080' } }, t);
      if (v.hand > 0.5) P.glow(ctx, 728, 540, 40, '#fff0c0', 0.6);
      if (v.white > 0) { ctx.fillStyle = `rgba(255,250,235,${v.white})`; ctx.fillRect(0, 0, W, H); }
    });
    S.choir(true);
    await OM.fadeTo(0, 1400);
    await tw(1200, (k) => (v.hand = k));
    await OM.say('anna', 'Вот и все дома. Позвони, Лёвушка. Пусть знают — служба кончилась.');
    for (let i = 0; i < 3; i++) { S.bigBell(0, 0.9); OM.shake(4); await OM.wait(1100); }
    await tw(4000, (k) => { v.gone = k; v.light = k; });
    await OM.say('anna', 'Тихо как. Слышишь? Это и есть дом.');
    await tw(1600, (k) => (v.white = k));
    S.choir(false);
    OM.endVision();
    // Эпилог: пристань на рассвете. Митя. И он — в воде, в шляпе.
    const e = { tall: 0, wave: 0, mTalk: false, close: 0 };
    OM.vision((ctx, t) => {
      ctx.drawImage(OM.cache('end:pier', paintPierDawn), 0, 0, W, H);
      P.fogBand(ctx, t, 560, 120, 8, 0.5);
      if (e.tall > 0) {
        ctx.save();
        ctx.beginPath(); ctx.rect(0, 0, W, 600); ctx.clip();
        A.tall(ctx, { x: 980, y: 740, s: 0.7, face: -1, alpha: e.tall, reach: e.wave * 0.35, jitter: 0, body: '#141826', hat: true, face2: 0.4, rim: { color: 'rgba(255,220,190,.6)', dx: 1.2 } }, t);
        ctx.restore();
        const k = (t * 0.4) % 1;
        ctx.strokeStyle = `rgba(255,240,230,${0.35 * (1 - k)})`;
        ctx.beginPath(); ctx.ellipse(980, 604, 30 + k * 60, 4 + k * 6, 0, 0, TAU); ctx.stroke();
      }
      A.mitya(ctx, { x: 640, y: 566, s: 1.1, face: e.mFace || 1, light: { amb: 0.95, tint: '#e0b0a0', side: 1 }, talking: e.mTalk, rim: { color: 'rgba(255,220,180,.6)', dx: 1.4 } }, t);
      P.fogBand(ctx, t + 20, 660, 100, -6, 0.3);
    });
    await OM.fadeTo(0, 1600);
    S.amb({ water: 0.6, wind: 0.3 });
    await OM.wait(1200);
    await tw(2400, (k) => (e.tall = k));
    await OM.wait(800);
    await tw(800, (k) => (e.wave = k));
    await OM.wait(600);
    e.mFace = -1;
    e.mTalk = true;
    await OM.say('mitya', 'Он всегда там стоит. Просто вы его раньше не видели.', { hold: 2.4 });
    e.mTalk = false;
    await OM.wait(600);
    await OM.say('narr', 'Колокол на озере звонит каждый Покров — сам. Никто в Тихом Омуте больше не тонет.', { hold: 2.6 });
    await OM.say('narr', 'Говорят, по утрам у пристани стоит высокий человек в шляпе. Он ни к кому не тянется. Он сторожит.', { hold: 2.8 });
    await OM.fadeTo(1, 1600);
    OM.endVision();
    G.busy--;
    OM.store.set('omut-loop', 1);
    await finish('B', 'Концовка «Омут»', 'Лев остался дома.');
  };

  // ---------- В. Покров: отпеть (скрытая) ----------
  E.C = async () => {
    G.busy++;
    OM.letterbox(true);
    const v = { gone: [], white: 0, anna: 1, kiss: 0, light: 0 };
    const nik = !!G.flags.nikBelow;
    await OM.say('anna', 'Что это у тебя, Лёвушка? Требник?..');
    await say('Мама. Их всех назвали. Колокол они слышали. Осталось — отпеть.');
    await OM.fadeTo(1, 900);
    const NAMES = OM.story5.NAMES;
    OM.vision((ctx, t) => {
      ctx.drawImage(OM.cache('end:service', paintService), 0, 0, W, H);
      candles(ctx, t, 820, 40);
      P.glow(ctx, 640, 300, 520, '#ffe0a0', 0.2 + v.light * 0.5);
      NAMES.forEach((n, i) => {
        const x = 110 + i * 92, g = v.gone[i] || 0;
        if (g >= 1) return;
        const o = { x, y: 640, s: 0.92, face: 1, light: { amb: 0.9, tint: '#e0b080' }, alpha: 1 - g };
        if (['smith', 'teacher'].includes(n.id)) A.hero(ctx, Object.assign(o, { item: n.id === 'teacher' ? 'case' : 'none', hat: false }), t);
        else if (n.id === 'boy') A.mitya(ctx, Object.assign(o, { y: 642 }), t);
        else if (n.id === 'fisher') A.semWalk(ctx, Object.assign(o, { lantern: false }), t);
        else if (n.id === 'deacon') A.nikodim(ctx, Object.assign(o, { pose: 'bless' }), t);
        else A.vera(ctx, Object.assign(o, { scarf: n.id === 'widow' ? '#141216' : '#a85a3a', glasses: false }), t);
        if (g > 0) {
          P.cone(ctx, x, 0, 10, 60, 640, '#fff4d0', g * 0.5);
          P.glow(ctx, x, 520 - g * 200, 50, '#fff0c0', g);
        }
      });
      if (nik) A.nikodim(ctx, { x: 960, y: 650, s: 1.05, face: -1, pose: 'bless', light: { amb: 0.95, tint: '#e0b080' } }, t);
      if (v.anna > 0) {
        A.vera(ctx, { x: 820, y: 664, s: 1.1, face: -1, pal: ANNA, scarf: '#7a2a20', glasses: false, hold: v.kiss > 0.4 ? 'reach' : null, light: { amb: 0.95, tint: '#e0b080' }, alpha: v.anna }, t);
        if (v.anna < 1) { P.cone(ctx, 820, 0, 14, 80, 660, '#fff4d0', (1 - v.anna) * 0.6); }
      }
      A.hero(ctx, { x: 740 - v.kiss * 20, y: 668, s: 1.12, face: 1, item: 'none', hat: false, light: { amb: 0.95, tint: '#e0b080' } }, t);
      if (v.white > 0) { ctx.fillStyle = `rgba(255,250,235,${v.white})`; ctx.fillRect(0, 0, W, H); }
    });
    S.choir(true);
    await OM.fadeTo(0, 1400);
    if (nik) await OM.say('nik', 'Со святыми упокой, Христе, души рабов Твоих…');
    else await say('Со святыми упокой, Христе, души рабов Твоих… — так у Никодима на закладке.');
    for (let i = 0; i < NAMES.length; i++) {
      const n = NAMES[i];
      S.bell();
      OM.say(nik ? 'nik' : 'lev', n.name.split(' ').slice(1).join(' ') + ' ' + n.name.split(' ')[0] + '…', { hold: 0.6 });
      await tw(1300, (k) => (v.gone[i] = k));
    }
    if (G.saying) G.saying.res();
    v.light = 1;
    await OM.wait(600);
    await OM.say('anna', 'Отпел. Сынок отпел.');
    await tw(900, (k) => (v.kiss = k));
    await OM.say('anna', 'Иди наверх, Лёвушка. Там тебя ждут. Живые.');
    await OM.say('anna', 'И помни меня. Мне так легче — когда помнят.');
    await say('Анна Петровна Гордеева. Мама.');
    await tw(3000, (k) => (v.anna = 1 - k));
    S.choir(false);
    await tw(1200, (k) => (v.white = k));
    OM.endVision();
    // Подъём к свету
    const u = { k: 0 };
    OM.vision((ctx, t) => {
      const k = u.k;
      P.fillV(ctx, 0, 0, W, H, [[0, hex('#e8f4ff', 0.3 + k * 0.7)], [0.5, '#4a7aa0'], [1, '#0e2234']]);
      for (let i = 0; i < 10; i++) P.cone(ctx, 100 + i * 120, -20, 30, 160, 720, '#fff8e0', 0.12 + k * 0.2);
      const y = lerp(760, 470, OM.smooth(k));
      A.hero(ctx, { x: 640, y, s: 1.3, face: 1, item: 'none', hat: false, pose: 'reach', light: { amb: 0.8, tint: '#a0c0e0' } }, t);
      for (let i = 0; i < 24; i++) {
        const kk = (t * 0.4 + i * 0.137) % 1;
        ctx.strokeStyle = `rgba(255,255,255,${0.5 * (1 - kk)})`;
        ctx.beginPath(); ctx.arc(600 + (i * 23) % 90, y - 100 - kk * 300, 2 + (i % 3), 0, TAU); ctx.stroke();
      }
      if (k > 0.85) { ctx.fillStyle = `rgba(255,255,250,${(k - 0.85) / 0.15})`; ctx.fillRect(0, 0, W, H); }
    });
    await OM.fadeTo(0, 400);
    S.muffle(0.6);
    await tw(5000, (k) => (u.k = k));
    S.muffle(0);
    S.splash();
    OM.endVision();
    // Эпилог: восход, берег, все живые ждут
    const e = { lev: 0, levX: 640, mitya: 0, wrap: 0 };
    const ppl = ['zina', 'vera', 'sem', 'nik'].filter(present);
    OM.vision((ctx, t) => {
      ctx.drawImage(OM.cache('end:sunrise', paintSunrise), 0, 0, W, H);
      P.fogBand(ctx, t, 470, 90, 6, 0.4);
      const L = { amb: 0.95, tint: '#f0c8a0', side: 1 };
      const rim = { color: 'rgba(255,230,180,.7)', dx: 1.4 };
      ppl.forEach((p, i) => {
        const x = 120 + i * 95, y = 640 + (i % 2) * 14;
        const o = { x, y, s: 1, face: 1, light: L, rim };
        if (p === 'zina') A.vera(ctx, Object.assign(o, { pal: ZINA, shawl: e.wrap ? null : '#7a3a2e', highBun: true, hold: 'chest' }), t);
        if (p === 'vera') A.vera(ctx, o, t);
        if (p === 'sem') A.semWalk(ctx, Object.assign(o, { lantern: true, lit: false }), t);
        if (p === 'nik') A.nikodim(ctx, Object.assign(o, { pose: 'bless' }), t);
      });
      A.mitya(ctx, { x: lerp(500, e.levX - 70, e.mitya), y: 650, s: 1, face: 1, move: e.mitya > 0 && e.mitya < 1 ? 1 : 0, phase: t * 9, light: L, rim, talking: e.mTalk }, t);
      if (e.lev > 0) {
        ctx.save();
        ctx.beginPath(); ctx.rect(0, 0, W, 600 + e.lev * 80); ctx.clip();
        A.hero(ctx, { x: e.levX, y: lerp(760, 662, e.lev), s: 1.02, face: -1, item: 'none', hat: false, light: L, rim }, t);
        ctx.restore();
      }
    });
    await OM.fadeTo(0, 1800);
    S.amb({ water: 0.5, wind: 0.3 });
    await OM.wait(800);
    await tw(3000, (k) => { e.lev = k; e.levX = lerp(760, 640, k); });
    e.mitya = 0.01;
    await tw(1400, (k) => (e.mitya = k));
    e.mTalk = true;
    await OM.say('mitya', 'Дядя Лев! Вы мокрый весь!');
    e.mTalk = false;
    await say('Вода — просто вода, Митя.');
    if (present('zina')) { await OM.say('zina', 'Вылез. Живой. На, укутайся — простынешь.'); e.wrap = 1; }
    if (present('nik')) await OM.say('nik', 'Слышишь? Колокол. Сам звонит. Отпустило их.');
    for (let i = 0; i < 3; i++) { S.bigBell(0.3, 0.5); await OM.wait(1300); }
    await OM.say('narr', 'Лев Гордеев остался в Тихом Омуте. Говорят, он больше не видит чужих смертей.', { hold: 2.6 });
    await OM.say('narr', 'Только иногда, под Покров, ему снится мама. Она улыбается.', { hold: 2.6 });
    await OM.fadeTo(1, 1600);
    OM.endVision();
    G.busy--;
    await finish('C', 'Скрытая концовка «Покров»', 'Лев вернулся. И помнит всех.');
  };
})();
