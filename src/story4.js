// Глава 4 «Нити»: ночь на Покров. Трое, кто держит Льва на берегу, и тринадцать минут первого.
(function () {
  const G = OM.G, S = OM.S, P = OM.P, A = OM.Actors;
  const { W, H, lerp, rng, clamp } = OM;
  const C4 = OM.ch4;
  const say = (t, o) => OM.say('lev', t, o);
  const nsay = (t) => OM.say('nik', t);
  const s4 = (OM.story4 = {});
  const TARGETS = ['hotel', 'library', 'sem'];
  const NAMES = { hotel: 'Зинаида Павловна', library: 'Вера', sem: 'Семёныч' };

  // ---------- Предметы ----------
  OM.Icons.zhuchok = (c) => {
    c.fillStyle = '#3a403a';
    P.rrect(c, 12, 22, 34, 24, 6);
    c.fill();
    c.fillStyle = '#5a625a';
    P.rrect(c, 14, 24, 30, 6, 3);
    c.fill();
    c.fillStyle = '#d8d0b0';
    c.beginPath();
    c.ellipse(46, 34, 5, 10, 0, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = '#2a2e2a';
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(20, 46);
    c.quadraticCurveTo(14, 58, 28, 56);
    c.stroke();
    c.fillStyle = 'rgba(255,230,160,.5)';
    c.beginPath();
    c.moveTo(50, 28);
    c.lineTo(62, 22);
    c.lineTo(62, 46);
    c.lineTo(50, 40);
    c.fill();
  };
  OM.Icons.watch = (c) => {
    c.fillStyle = '#3a2618';
    c.fillRect(24, 4, 16, 56);
    c.fillStyle = '#b89a5a';
    c.beginPath();
    c.arc(32, 32, 15, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#efe6d0';
    c.beginPath();
    c.arc(32, 32, 12, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = '#1a1410';
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(32, 32);
    c.lineTo(32, 23);
    c.moveTo(32, 32);
    c.lineTo(38, 35);
    c.stroke();
  };
  OM.Icons.shawl = (c) => {
    c.fillStyle = '#5a6a8a';
    c.beginPath();
    c.moveTo(6, 16);
    c.lineTo(58, 16);
    c.lineTo(32, 52);
    c.closePath();
    c.fill();
    c.fillStyle = 'rgba(230,220,190,.6)';
    for (let i = 0; i < 9; i++) { c.beginPath(); c.arc(14 + (i % 5) * 9, 22 + Math.floor(i / 5) * 9, 2, 0, Math.PI * 2); c.fill(); }
    c.strokeStyle = '#5a6a8a';
    c.lineWidth = 1.2;
    for (let i = 0; i < 8; i++) {
      c.beginPath();
      c.moveTo(18 + i * 3.4, 36 + i * 1.5);
      c.lineTo(17 + i * 3.4, 44 + i * 1.5);
      c.stroke();
    }
  };
  Object.assign(OM.ITEMS, {
    zhuchok: { name: 'Фонарик «жучок»', icon: 'zhuchok', look: 'Динамо-фонарик Семёныча. Жмёшь — жужжит и светит. Батареек не надо, только руки.' },
    watch: { name: 'Часы «Победа»', icon: 'watch', look: () => say(`Отцовские. Показывают ${C4.fmt(C4.time())}. До тринадцати минут первого — ${Math.max(0, C4.DEADLINE - C4.time())} мин.`) },
    shawl: { name: 'Платок', icon: 'shawl', look: 'Шерстяной платок Веры. Синий, с белым горошком. Тёплый — как будто его только что сняли с плеч.' },
  });

  // Энциклопедия: подсказки главы.
  const bookPrev = OM.ITEMS.book.look;
  OM.ITEMS.book.look = () => {
    if (!OM.flag('ch4')) return bookPrev();
    return async () => {
      const f = G.flags;
      await say('Так…');
      if (G.sid === 'map') return OM.say('book', '«Время — мера длительности». Дорога и спасение стоят минут. Ко всем не успеть — значит, считать.');
      if (G.sid === 'boatyard') return OM.talk([['book', '«Свет распространяется прямолинейно»'], ['lev', 'Луч держит их. Пока я свечу — они стоят. Догнать Семёныча до конца мостков.']]);
      if (G.sid === 'veraflat') {
        if (!f.radioDead) return OM.talk([['book', '«Радиоприёмник — устройство для приёма радиоволн»'], ['lev', 'Голос в приёмнике зовёт её. Сначала — заткнуть его. Насовсем.']]);
        return OM.talk([['book', '«Зеркала в доме завешивают, когда в нём покойник»'], ['lev', 'Завесить зеркало. Чем-нибудь из её вещей.']]);
      }
      if (G.sid === 'zinaroom') {
        if (!G.threads) return say('Словами её не удержать. Посмотреть иначе — пробел.');
        return say('Её нить тянется в окно. Перехватить её и отвести к Мите — пусть держит его, а не воду.');
      }
      return say('Тринадцать минут первого.');
    };
  };

  // ---------- Начало ----------
  s4.start = async () => {
    G.flags = { ch4: 1, threadsUnlocked: 1, clock: C4.START, mapPlace: 'pier' };
    G.inv = [];
    OM.renderInv();
    G.mode = 'play';
    G.threads = false;
    G.hero.item = 'none';
    G.busy++;
    await OM.fadeTo(1, 600);
    await OM.card('Глава четвёртая. Нити', 'ночь на Покров, 23:20', 3600);
    OM.give('book', true);
    OM.give('zhuchok', true);
    OM.give('watch', true);
    G.busy--;
    await OM.run(prologue);
  };

  // Панорама: лодка идёт к городу, на холме горят окна. Лев смотрит иначе — от трёх окон тянутся нити.
  async function prologue() {
    const v = { threads: 0, labels: [0, 0, 0], talls: 0, bow: 0, cam: 0 };
    OM.letterbox(true);
    S.amb({ water: 0.7, wind: 0.5, drone: 0.2 });
    OM.vision((ctx, t) => panorama(ctx, t, v));
    await OM.fadeTo(0, 2200);
    const tw = async (ms, f) => { const t0 = performance.now(); while (performance.now() - t0 < ms) { f((performance.now() - t0) / ms); await OM.wait(16); } f(1); };
    S.oar && S.oar();
    await nsay('Видишь, свет у них горит. Не спят. Чуют.');
    await say('Колокол слышали.');
    await nsay('Слышали. Теперь смотри. Не глазами.');
    S.threads(true);
    await tw(1600, (k) => (v.threads = k));
    for (let i = 0; i < 3; i++) {
      S.bell && S.bell(0.25);
      await tw(500, (k) => (v.labels[i] = k));
      await OM.wait(350);
    }
    await say('Три нити. Гостиница. Библиотека. Лодочная станция.');
    await say('Зина. Вера. Семёныч.');
    await nsay('Те, кто тебя держит на берегу. Им нужен ты — а потянут за тех, кто держит.');
    S.whisper(2.5, 0.1);
    await tw(2200, (k) => (v.talls = k));
    await nsay('В тринадцать минут первого. Как с мальчиком тогда.');
    await say('Значит, успею ко всем.');
    await nsay('Не успеешь. Город маленький, а ночь короче. К двоим — успеешь. Если не будешь стоять.');
    await OM.wait(400);
    await nsay('Я могу пойти к одному. К Семёнычу — он у воды, мне по пути.');
    await nsay('Только оттуда я уже не вернусь. Мне давно туда пора — сорок лет как.');
    const c = await OM.choose([
      { id: 'self', text: 'Нет. Я сам. Вы мне нужны здесь.' },
      { id: 'nik', text: 'Идите к Семёнычу, отец Никодим.' },
    ]);
    if (c === 'nik') {
      G.flags.nikGoes = 1;
      OM.ach.unlock('nik');
      await say('Идите к Семёнычу.');
      await nsay('Вот и ладно. Отпою их оттуда — изнутри. Давно хотел.');
      await nsay('А ты беги. Гостиница и библиотека — твои.');
    } else {
      await say('Нет. Я сам. Вы мне нужны здесь — живой.');
      await nsay('Тогда решай быстро. Кого первым — а кого…');
      await nsay('Сам знаешь.');
    }
    S.threads(false);
    await OM.fadeTo(1, 900);
    OM.endVision();
    OM.letterbox(false);
    OM.setScene('map', 'default');
    await OM.fadeTo(0, 800);
    await OM.run(() => G.scene.enter('default'));
  }

  // Ночной город с воды.
  function paintPano(g) {
    P.fillV(g, 0, 0, W, 420, [[0, '#04070e'], [0.55, '#0c1424'], [1, '#1c2638']]);
    P.stars(g, 401, 260, 300, 0.8);
    P.clouds(g, 402, { y0: 60, y1: 220, n: 9, color: '#141c2c', a: 0.6, size: [120, 300] });
    P.moon(g, 1060, 120, 30, 0.9);
    // холм и лес
    g.fillStyle = '#0a0e14';
    g.beginPath();
    g.moveTo(0, 360);
    g.quadraticCurveTo(300, 250, 640, 270);
    g.quadraticCurveTo(980, 290, 1280, 340);
    g.lineTo(1280, 430);
    g.lineTo(0, 430);
    g.fill();
    P.forest(g, 403, { yb: 300, hMin: 18, hMax: 46, color: '#070a10', step: [6, 13], skip: (x) => x > 200 && x < 1100 });
    // город: дома ступенями по склону
    const r = rng(404);
    const houses = [];
    for (let i = 0; i < 70; i++) {
      const x = 60 + r() * 1160, base = 300 + Math.abs(x - 640) * 0.06 + r() * 90;
      houses.push([x, base, 22 + r() * 30, 18 + r() * 22]);
    }
    houses.sort((a, b) => a[1] - b[1]);
    houses.forEach(([x, y, w, h]) => {
      g.fillStyle = OM.Fig.shade('#10141c', (r() - 0.5) * 0.4);
      g.fillRect(x, y - h, w, h);
      g.beginPath();
      g.moveTo(x - 3, y - h);
      g.lineTo(x + w / 2, y - h - w * 0.4);
      g.lineTo(x + w + 3, y - h);
      g.fill();
      for (let k = 0; k < Math.floor(w / 12); k++) {
        if (r() < 0.4) {
          g.fillStyle = '#ffcf80';
          g.fillRect(x + 4 + k * 12, y - h + 6, 5, 6);
          P.glow(g, x + 6 + k * 12, y - h + 9, 16, '#ffb050', 0.3);
        }
      }
    });
    // ДК с колоннами, водонапорная башня
    g.fillStyle = '#1a1e26';
    g.fillRect(560, 250, 150, 50);
    g.beginPath();
    g.moveTo(550, 250);
    g.lineTo(635, 222);
    g.lineTo(720, 250);
    g.fill();
    for (let i = 0; i < 7; i++) { g.fillStyle = '#2a2e36'; g.fillRect(570 + i * 21, 256, 5, 44); }
    g.fillStyle = '#12161e';
    g.fillRect(860, 170, 10, 130);
    g.fillRect(842, 150, 46, 30);
    // гостиница «Заря»: три этажа, неоновая вывеска
    g.fillStyle = '#161a22';
    g.fillRect(230, 250, 130, 110);
    for (let y = 0; y < 3; y++) for (let x = 0; x < 5; x++) {
      const lit = (x + y * 3) % 4 === 1 || (x === 3 && y === 2);
      g.fillStyle = lit ? '#ffcf80' : '#0c1016';
      g.fillRect(242 + x * 24, 266 + y * 30, 10, 14);
    }
    // библиотека: два этажа, окно наверху светится зелёным абажуром
    g.fillStyle = '#141820';
    g.fillRect(740, 300, 100, 72);
    g.fillStyle = '#c8e0a0';
    g.fillRect(790, 312, 12, 16);
    P.glow(g, 796, 320, 30, '#c0e090', 0.35);
    // лодочная станция у воды, фонарь
    g.fillStyle = '#12161c';
    g.fillRect(1010, 380, 120, 40);
    g.beginPath();
    g.moveTo(1004, 380);
    g.lineTo(1070, 352);
    g.lineTo(1136, 380);
    g.fill();
    g.fillRect(1130, 410, 90, 6);
    g.fillStyle = '#ffd890';
    g.fillRect(1040, 392, 8, 9);
    // кромка берега
    g.fillStyle = '#06080c';
    g.fillRect(0, 418, W, 14);
    // вода
    P.fillV(g, 0, 430, W, 290, [[0, '#121a2a'], [1, '#03050a']]);
  }
  const LIGHTS = [[247, 296, '#ffcf80'], [295, 326, '#ffcf80'], [796, 320, '#c0e090'], [1044, 396, '#ffd890'], [300, 258, '#ff5a40'], [600, 330, '#ffcf80'], [700, 360, '#ffcf80'], [460, 340, '#ffcf80'], [920, 380, '#ffcf80']];
  const TH = [
    { a: [295, 280], b: [360, 560], name: 'Зинаида Павловна', lx: 250, ly: 214 },
    { a: [796, 318], b: [820, 600], name: 'Вера', lx: 796, ly: 284 },
    { a: [1044, 396], b: [1120, 580], name: 'Семёныч', lx: 1070, ly: 340 },
  ];
  function panorama(ctx, t, v) {
    const z = 1 + Math.min(0.05, t * 0.003);
    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.scale(z, z);
    ctx.translate(-W / 2, -H / 2 + Math.sin(t * 0.8) * 3);
    ctx.drawImage(OM.cache('pano:bg', paintPano), 0, 0, W, H);
    // неон гостиницы мигает
    const neon = Math.sin(t * 7) > -0.6 || Math.random() < 0.7 ? 1 : 0.2;
    P.text(ctx, 'ЗАР', 286, 238, { font: '700 20px "PT Serif",serif', color: 'rgba(255,90,64,1)' });
    P.text(ctx, 'Я', 312, 238, { font: '700 20px "PT Serif",serif', color: `rgba(255,90,64,${neon})` });
    P.glow(ctx, 295, 240, 70, '#ff4a30', 0.3 * neon);
    // отражения огней
    LIGHTS.forEach(([x, y, c], i) => P.streak(ctx, x, 432, 14, 150 + (i % 3) * 40, c, 0.45, i + 3, t));
    P.streak(ctx, 1060, 432, 60, 280, '#c8d8f0', 0.35, 99, t);
    P.fogBand(ctx, t, 450, 130, 10, 0.55);
    P.fogBand(ctx, t + 40, 600, 160, -7, 0.4);
    // нити и Тихие внизу каждой нити
    if (v.threads > 0) {
      ctx.save();
      ctx.globalAlpha = v.threads * 0.55;
      ctx.globalCompositeOperation = 'multiply';
      ctx.fillStyle = '#4a6a9a';
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
      TH.forEach((th, i) => {
        OM.thread(ctx, th.a, th.b, t, { color: '#ffd27a', a: v.threads, sag: 60, w: 2.2, speed: -0.3 });
        if (v.labels[i] > 0) P.text(ctx, th.name, th.lx, th.ly, { font: 'italic 600 22px "Cormorant Garamond",serif', color: '#ffe2a8', alpha: v.labels[i], ls: 1 });
        if (v.talls > 0) {
          for (let k = 0; k < 2; k++) A.tall(ctx, { x: th.b[0] + (k ? 40 : -30), y: th.b[1] + 26 + k * 10, s: 0.2 + k * 0.03, face: -1, alpha: v.talls * 0.9, jitter: 1, body: '#03050a', seed: i * 3 + k }, t);
        }
      });
    }
    // нос лодки и рука Никодима на весле — снизу
    ctx.fillStyle = '#120c08';
    ctx.beginPath();
    ctx.moveTo(470, H + 10);
    ctx.quadraticCurveTo(620, 610, 660, 590);
    ctx.quadraticCurveTo(700, 610, 850, H + 10);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,220,170,.06)';
    ctx.beginPath();
    ctx.moveTo(660, 590);
    ctx.quadraticCurveTo(700, 612, 840, H + 10);
    ctx.lineTo(820, H + 10);
    ctx.quadraticCurveTo(690, 620, 660, 594);
    ctx.fill();
    // фонарь на носу
    P.glow(ctx, 662, 580, 80, '#ffb050', 0.4);
    ctx.fillStyle = '#ffe0a0';
    ctx.fillRect(658, 572, 8, 10);
    // весло справа, гребок
    const ph = (t * 0.9) % 1;
    ctx.strokeStyle = '#2a1c12';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(1280, 640 - Math.sin(ph * Math.PI * 2) * 20);
    ctx.lineTo(980, 700 + Math.sin(ph * Math.PI * 2) * 14);
    ctx.stroke();
    ctx.restore();
  }

  // ---------- Карта ----------
  const feasible = (id) => {
    const f = G.flags;
    if (f['saved_' + id] || f.lost === id || (id === 'sem' && f.nikGoes)) return false;
    return C4.time() + C4.dist(f.mapPlace || 'pier', id) + C4.RESCUE <= C4.DEADLINE;
  };
  s4.onMap = async () => {
    const f = G.flags;
    if (f.pendingRescue) {
      // время, потраченное на спасение, догоняет часы
      const t0 = C4.time(), d = f.pendingRescue;
      f.pendingRescue = 0;
      const s0 = performance.now();
      while (performance.now() - s0 < 1500) {
        const k = OM.smooth((performance.now() - s0) / 1500);
        const m = t0 + Math.floor(d * k);
        if (m !== f.clock) { f.clock = m; S.tick(0.5); }
        await OM.wait(16);
      }
      f.clock = t0 + d;
      OM.save();
    }
    const open = TARGETS.filter(feasible);
    if (!open.length) return s4.toMidnight();
    if (!f.mapTip) {
      f.mapTip = 1;
      OM.toast('Выберите, к кому идти. Время идёт в пути и пока вы спасаете.');
    }
  };
  s4.lookPlace = async (id) => {
    const lines = {
      hotel: ['«Заря». В окне за стойкой горит лампа. Зина не спит — сидит и пишет.', 'И Митя там. Спит на диване, она его к себе забрала.'],
      library: ['Библиотека. Наверху — комната Веры. Окно светится зелёным: абажур.', 'Зеленый свет дрожит. Как будто кто-то ходит мимо лампы. Туда-сюда.'],
      sem: ['Лодочная станция. У Семёныча фонарь горит — «летучая мышь».', 'Огонёк движется. К мосткам.'],
    };
    if (G.flags['saved_' + id]) return say('Там всё. Нить свободна.');
    if (id === 'sem' && G.flags.nikGoes) return say('Туда пошёл Никодим. Огонёк фонаря и ещё один — свечка.');
    await OM.talk(lines[id].map((s) => ['lev', s]));
  };
  s4.goTo = async (id) => {
    const f = G.flags;
    if (f['saved_' + id]) return say(OM.pick(['Там всё. Нить свободна.', 'Туда — уже не нужно.']));
    if (id === 'sem' && f.nikGoes) return say('Туда пошёл Никодим. Это его выбор. И мой.');
    const from = f.mapPlace || 'pier';
    const d = C4.dist(from, id);
    const arr = C4.time() + d;
    if (!feasible(id)) {
      await say(`Туда ${d} минут. Буду в ${C4.fmt(arr)} — а там ещё надо успеть.`);
      return say('Не успею. Значит… не туда.');
    }
    const c = await OM.choose([
      { id: 'go', text: `Идти: ${d} мин, буду в ${C4.fmt(arr)}` },
      { id: 'no', text: 'Подумать ещё' },
    ]);
    if (c !== 'go') return;
    S.step && S.step('road');
    await C4.animateTravel(from, id);
    f.mapPlace = id;
    OM.save();
    await OM.go(C4.PLACES[id].scene, 'default');
  };
  // Спасение удалось — возвращаемся на карту, часы догоняют.
  s4.rescued = async (id) => {
    OM.ach.unlock({ hotel: 'zina', library: 'vera', sem: 'sem' }[id]);
    G.flags['saved_' + id] = 1;
    G.flags.pendingRescue = C4.RESCUE;
    OM.save();
    await OM.wait(400);
    await OM.go('map', 'default');
  };
  // Часы в углу сцены спасения.
  s4.cornerClock = (ctx, x = 1206, y = 86) => {
    C4.drawClock(ctx, x, y, 28, C4.time(), { label: false });
    P.text(ctx, C4.fmt(C4.time()), x, y + 54, { font: '600 16px "Cormorant Garamond",serif', color: 'rgba(241,230,204,.8)', ls: 1 });
  };

  // ---------- Полночь ----------
  s4.toMidnight = async () => {
    const f = G.flags;
    const lost = TARGETS.filter((id) => !f['saved_' + id] && !(id === 'sem' && f.nikGoes));
    f.lostList = lost;
    f.lost = lost[0] || null;
    await say('Всё. Больше никуда не успеть.');
    if (lost.length) await say(`${NAMES[lost[0]]}…`);
    f.clock = C4.DEADLINE - 2;
    OM.save();
    await OM.go('midnight', 'default');
  };

  s4.end = async () => {
    const f = G.flags;
    OM.ach.unlock('notnow');
    if (!f.fails4) OM.ach.unlock('clean4');
    const outcome = { lost: f.lostList || [], nik: !!f.nikGoes };
    OM.store.set('omut-ch4', outcome);
    OM.store.set('omut-ch4-done', 1);
    await OM.fadeTo(1, 2400);
    S.music('end');
    const who = outcome.lost[0];
    const sub = {
      hotel: 'Зинаиду Павловну нашли утром на мостках. Митя держал её за руку и не плакал.',
      library: 'В библиотеке до утра горел зелёный абажур. В зеркале на трюмо стояла вода.',
      sem: 'Фонарь Семёныча горел на дне до рассвета. Его видели с плотины.',
    }[who];
    await OM.card('Конец четвёртой главы', outcome.nik ? 'Отец Никодим ушёл к своему приходу. Из-под воды до утра было слышно, как поют.' : sub || 'Этой ночью вода никого не взяла.', 5200);
    if (outcome.nik && who) await OM.card('', sub, 4200);
    S.music(null);
    OM.clearSave();
    OM.letterbox(false);
    await OM.story5.start();
  };
})();
