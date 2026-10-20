// Глава 5 «Омут»: рассвет Покрова. Своя смерть, Изнанка, мама. Три концовки: Берег, Омут и скрытая — Покров.
(function () {
  const G = OM.G, S = OM.S, P = OM.P, A = OM.Actors;
  const { W, H, lerp, rng, clamp, hex } = OM;
  const TAU = Math.PI * 2;
  const say = (t, o) => OM.say('lev', t, o);
  const s5 = (OM.story5 = {});
  const tw = async (ms, f) => { const t0 = performance.now(); while (performance.now() - t0 < ms) { f((performance.now() - t0) / ms); await OM.wait(16); } f(1); };

  // ---------- Предметы ----------
  OM.Icons.scissors = (c) => {
    c.strokeStyle = '#b8b8b0';
    c.lineWidth = 4;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(22, 36); c.lineTo(56, 10);
    c.moveTo(22, 28); c.lineTo(56, 52);
    c.stroke();
    c.lineWidth = 4;
    c.strokeStyle = '#3a3a40';
    c.beginPath(); c.arc(15, 40, 8, 0, TAU); c.stroke();
    c.beginPath(); c.arc(15, 24, 8, 0, TAU); c.stroke();
    c.fillStyle = '#e0d8c0';
    c.beginPath(); c.arc(28, 32, 2.5, 0, TAU); c.fill();
  };
  OM.Icons.list = (c) => {
    c.fillStyle = '#d8ccb0';
    c.fillRect(14, 6, 36, 52);
    c.fillStyle = 'rgba(40,40,80,.65)';
    for (let i = 0; i < 9; i++) c.fillRect(19, 13 + i * 5, 18 + (i * 7) % 10, 1.6);
    c.fillStyle = '#7a2a22';
    c.fillRect(19, 9, 26, 2);
  };
  OM.Icons.lantern = (c) => {
    c.strokeStyle = '#2a2a26';
    c.lineWidth = 2.5;
    c.beginPath(); c.moveTo(20, 20); c.quadraticCurveTo(32, 2, 44, 20); c.stroke();
    c.fillStyle = '#3a3c36';
    c.fillRect(20, 18, 24, 7);
    c.fillStyle = '#ffd890';
    c.beginPath(); c.ellipse(32, 36, 10, 12, 0, 0, TAU); c.fill();
    c.fillStyle = '#4a4c44';
    c.fillRect(18, 46, 28, 10);
  };
  OM.Icons.trebnik = (c) => {
    c.fillStyle = '#3a1a14';
    c.fillRect(14, 8, 36, 48);
    c.fillStyle = '#c9a050';
    c.fillRect(30, 18, 4, 22);
    c.fillRect(24, 24, 16, 4);
    c.fillStyle = '#e8dcc0';
    c.fillRect(48, 10, 3, 44);
  };
  Object.assign(OM.ITEMS, {
    scissors: { name: 'Ножницы Зины', icon: 'scissors', look: 'Старые портновские ножницы. Ими Зина в пятьдесят пятом перерезала мне пуповину — в лодке, на воде.' },
    list: { name: 'Список 1955 года', icon: 'list', look: () => s5.readList() },
    lantern: { name: 'Фонарь Семёныча', icon: 'lantern', look: '«Летучая мышь». Горит и под водой — Семёныч клянётся, что заговорённая.' },
    trebnik: { name: 'Требник', icon: 'trebnik', look: 'Требник Никодима. Закладка — на «Чине погребения мирских человек». На полях карандашом: «имена!»' },
  });

  // Кто где после главы 4.
  s5.outcome = () => OM.store.get('omut-ch4') || { lost: ['sem'], nik: false };
  s5.present = (who) => {
    const o = s5.outcome();
    if (who === 'nik') return !o.nik;
    if (who === 'zina') return !o.lost.includes('hotel');
    if (who === 'vera') return !o.lost.includes('library');
    if (who === 'sem') return !o.lost.includes('sem');
    return true;
  };

  // Энциклопедия-подсказки.
  const bookPrev = OM.ITEMS.book.look;
  OM.ITEMS.book.look = () => {
    if (!OM.flag('ch5')) return bookPrev();
    return async () => {
      const f = G.flags;
      await say('Последний том…');
      if (G.sid === 'dawn') return OM.say('book', '«Прощание — обряд, исполняемый перед уходом». Поговорить со всеми. Потом — к воде, направо.');
      if (G.sid === 'inverse') {
        if (!f.passedGate) return OM.talk([['book', '«Отражение — изображение, полученное от зеркальной поверхности»'], ['lev', 'Здесь два мира: тот, что был, и тот, что стал. Кнопка-переверт или клавиша F.'], ['lev', 'Где закрыто в одном, может быть открыто в другом. Только под водой — дышать нечем.']]);
        const left = s5.unnamed();
        if (left) return OM.talk([['book', '«Имя — слово, которым называют человека»'], ['lev', `Ещё ${left} без имени. Смотреть в лицо — долго, пока не проступит. Потом назвать по списку.`]]);
        if (!f.bellRung) return say('Колокол. Тот, наверху, в разрушенной церкви. Пусть услышат.');
        return say('Дом с резными наличниками, за калиткой. Мама.');
      }
      return say('Мама.');
    };
  };

  // ---------- Начало ----------
  s5.start = async () => {
    const o = s5.outcome();
    G.flags = { ch5: 1, threadsUnlocked: 1, breath: 1 };
    G.inv = [];
    OM.renderInv();
    G.mode = 'play';
    G.threads = false;
    G.hero.item = 'none';
    G.busy++;
    await OM.fadeTo(1, 600);
    await OM.card('Глава пятая. Омут', '15 октября, Покров. Рассвет', 3800);
    OM.give('book', true);
    G.busy--;
    void o;
    await OM.run(prologue);
  };

  // Видение: собственная смерть, обрывками. Последнего кадра нет — его ещё не сняли.
  function frameCanvas(draw) {
    const c = OM.makeCanvas(640, 360);
    const g = c.getContext('2d');
    g.scale(0.5, 0.5);
    draw(g);
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.globalCompositeOperation = 'multiply';
    g.fillStyle = '#7aa0d8';
    g.fillRect(0, 0, 640, 360);
    g.globalCompositeOperation = 'screen';
    g.fillStyle = 'rgba(10,30,60,.35)';
    g.fillRect(0, 0, 640, 360);
    g.globalCompositeOperation = 'source-over';
    g.fillStyle = P.rgrad(g, 320, 180, 120, 400, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(0,4,12,.55)']]);
    g.fillRect(0, 0, 640, 360);
    const r = rng(draw.length * 11 + 5);
    for (let i = 0; i < 6; i++) { g.fillStyle = `rgba(0,0,0,${0.2 + r() * 0.4})`; g.fillRect(0, r() * 360, 640, 1 + r() * 3); }
    return c;
  }
  const VL = { amb: 1, tint: '#4a6a9a' };
  const ANNA = { cardigan: '#5a4a3a', blouse: '#d8ccb0', skirt: '#3a3030', skin: '#e2b49a', hair: '#3a2418', shoes: '#2a1c16', tights: '#3a302c' };
  s5.ANNA = ANNA;
  const dawnSky = (g) => {
    P.fillV(g, 0, 0, W, 420, [[0, '#2a3450'], [0.6, '#c89a9a'], [1, '#f0c8a0']]);
    P.fillV(g, 0, 420, W, 300, [[0, '#8a7a90'], [1, '#2a3048']]);
    P.glow(g, 900, 420, 260, '#ffe0b0', 0.6);
  };
  const FRAMES = [
    // 1. Рассвет, мостки, Лев на самом краю
    (g) => {
      dawnSky(g);
      P.fillV(g, 0, 560, 900, 26, [[0, '#4a3a2a'], [1, '#1a120a']]);
      for (let x = 40; x < 900; x += 90) g.fillRect(x, 586, 10, 140);
      A.hero(g, { x: 820, y: 568, s: 1.9, face: 1, item: 'none', light: VL }, 1);
      P.fogBand(g, 0, 600, 140, 0, 0.6);
    },
    // 2. Мама в воде, руки навстречу
    (g) => {
      dawnSky(g);
      g.save();
      g.beginPath();
      g.rect(0, 0, W, 560);
      g.clip();
      A.vera(g, { x: 640, y: 900, s: 3.2, face: -1, pal: ANNA, scarf: '#4a2a28', glasses: false, hold: 'reach', light: VL }, 1);
      g.restore();
      g.strokeStyle = 'rgba(255,240,220,.5)';
      g.lineWidth = 2;
      for (let i = 0; i < 3; i++) { g.beginPath(); g.ellipse(640, 562, 120 + i * 80, 10 + i * 6, 0, 0, TAU); g.stroke(); }
    },
    // 3. Ботинки на краю. Шаг
    (g) => {
      P.fillV(g, 0, 0, W, H, [[0, '#6a6a88'], [1, '#1a2034']]);
      P.fillV(g, 0, 340, 760, 60, [[0, '#4a3a2a'], [1, '#1a120a']]);
      g.save();
      g.translate(620, 330);
      g.scale(5, 5);
      g.fillStyle = '#16100c';
      g.beginPath();
      g.moveTo(-6, 7); g.lineTo(-6.5, 1); g.lineTo(-4, -3); g.lineTo(4, -3); g.lineTo(12, 0.5); g.lineTo(18.5, 3); g.lineTo(19.5, 6.5); g.lineTo(17, 7.6);
      g.fill();
      g.restore();
      g.fillStyle = '#20304a';
      g.fillRect(0, 400, W, 320);
      for (let i = 0; i < 20; i++) { g.fillStyle = 'rgba(220,230,250,.25)'; g.fillRect((i * 97) % W, 430 + (i * 37) % 260, 80, 2); }
    },
    // 4. Под водой: тонет, свет сверху, пузыри
    (g) => {
      P.fillV(g, 0, 0, W, H, [[0, '#4a6a8a'], [0.4, '#1a2a44'], [1, '#04080e']]);
      for (let i = 0; i < 6; i++) P.cone(g, 300 + i * 140, 0, 30, 160, 600, '#c8e0ff', 0.25);
      g.save();
      g.translate(640, 420);
      g.rotate(0.6);
      g.translate(-640, -420);
      A.hero(g, { x: 640, y: 560, s: 1.6, face: 1, item: 'none', pose: 'reach', light: VL }, 1);
      g.restore();
      for (let i = 0; i < 40; i++) { g.strokeStyle = 'rgba(220,235,255,.5)'; g.beginPath(); g.arc(600 + (i * 37) % 160, 380 - (i * 53) % 380, 3 + (i % 4) * 2, 0, TAU); g.stroke(); }
    },
  ];
  // Финальные кадры — какой из них встанет пятым, решает игрок.
  const ENDS = {
    A: (g) => {
      P.fillV(g, 0, 0, W, H, [[0, '#f0e0c0'], [1, '#c8a878']]);
      g.strokeStyle = '#ffd27a';
      g.lineWidth = 6;
      g.beginPath(); g.moveTo(0, 360); g.quadraticCurveTo(400, 420, 600, 360); g.stroke();
      g.beginPath(); g.moveTo(700, 340); g.quadraticCurveTo(900, 300, W, 360); g.stroke();
      g.save(); g.translate(560, 220); g.scale(4, 4); OM.Icons.scissors(g); g.restore();
      P.text(g, 'БЕРЕГ', 640, 620, { font: '700 64px "Cormorant Garamond",serif', color: '#5a3a1a', ls: 20 });
    },
    B: (g) => {
      P.fillV(g, 0, 0, W, H, [[0, '#1a2a44'], [1, '#02060c']]);
      A.hero(g, { x: 520, y: 760, s: 2.4, face: 1, item: 'none', pose: 'reach', light: VL }, 1);
      A.vera(g, { x: 780, y: 760, s: 2.4, face: -1, pal: ANNA, scarf: '#4a2a28', glasses: false, hold: 'reach', light: VL }, 1);
      P.glow(g, 650, 330, 120, '#c8e0ff', 0.5);
      P.text(g, 'ОМУТ', 640, 620, { font: '700 64px "Cormorant Garamond",serif', color: '#c8d8f0', ls: 20 });
    },
    C: (g) => {
      P.fillV(g, 0, 0, W, H, [[0, '#ffe8b0'], [1, '#8a6a3a']]);
      for (let i = 0; i < 12; i++) P.cone(g, 640, 0, 20, 300 + i * 40, 720, '#fff4d0', 0.08);
      g.fillStyle = '#5a4020';
      g.beginPath(); g.moveTo(560, 200); g.quadraticCurveTo(640, 120, 720, 200); g.lineTo(740, 420); g.lineTo(540, 420); g.fill();
      P.text(g, 'ПОКРОВ', 640, 620, { font: '700 64px "Cormorant Garamond",serif', color: '#5a3a1a', ls: 20 });
    },
  };
  // Пустой кадр: засвеченная плёнка.
  const blankFrame = (msg) => (g) => {
    P.fillV(g, 0, 0, W, H, [[0, '#1a1410'], [1, '#050302']]);
    for (let i = 0; i < 30; i++) { g.fillStyle = `rgba(255,${180 + (i * 7) % 60},120,${0.03 + (i % 5) * 0.01})`; g.beginPath(); g.arc((i * 211) % W, (i * 97) % H, 40 + (i % 7) * 30, 0, TAU); g.fill(); }
    P.text(g, msg, 640, 360, { font: 'italic 500 54px "Cormorant Garamond",serif', color: 'rgba(255,220,180,.6)' });
  };

  // Монтаж на #frags: cards — что раскладывать, fixed — уже лежит в слотах, n — число слотов.
  function montage({ cards, fixed = [], n, title, hint, check }) {
    return new Promise((resolve) => {
      const root = document.getElementById('frags');
      const head = root.querySelector('.h');
      const cardsEl = root.querySelector('.cards');
      const slotsEl = root.querySelector('.slots');
      const hintEl = root.querySelector('.hint');
      head.textContent = title;
      root.classList.add('blue');
      cardsEl.innerHTML = '';
      slotsEl.innerHTML = '';
      hintEl.textContent = hint;
      const copy = (src) => { const c = document.createElement('canvas'); c.width = src.width; c.height = src.height; c.getContext('2d').drawImage(src, 0, 0); return c; };
      let placed = [];
      const slotEls = [];
      for (let i = 0; i < n; i++) {
        const el = document.createElement('div');
        el.className = 'pslot';
        el.dataset.n = i + 1;
        if (fixed[i]) { el.appendChild(copy(fixed[i])); el.classList.add('full', 'fixed'); }
        slotsEl.appendChild(el);
        slotEls.push(el);
      }
      const free = slotEls.filter((e) => !e.classList.contains('fixed'));
      const cardEls = cards.map((cd) => {
        const el = document.createElement('button');
        el.className = 'frag' + (cd.locked ? ' locked' : '');
        el.appendChild(cd.canvas);
        if (cd.label) { const l = document.createElement('div'); l.className = 'lbl'; l.textContent = cd.label; el.appendChild(l); }
        el.onpointerdown = (e) => {
          e.stopPropagation();
          if (el.classList.contains('used')) return;
          if (cd.locked) { S.staticNoise(0.3, 0.06); hintEl.textContent = cd.locked; return; }
          S.click();
          el.classList.add('used');
          placed.push(cd.id);
          const slot = free[placed.length - 1];
          slot.appendChild(copy(cd.canvas));
          slot.classList.add('full');
          if (placed.length === free.length) {
            const res = check(placed);
            if (res === true || typeof res === 'string' && res.startsWith('=')) {
              if (typeof res === 'string') hintEl.textContent = res.slice(1);
              setTimeout(() => { root.classList.remove('on', 'blue'); resolve(placed); }, 1300);
            } else {
              hintEl.textContent = res || 'Не складывается. Ещё раз.';
              root.classList.add('shake');
              S.staticNoise(0.4, 0.08);
              setTimeout(() => {
                root.classList.remove('shake');
                placed = [];
                cardEls.forEach((x) => x.classList.remove('used'));
                free.forEach((x) => { x.innerHTML = ''; x.classList.remove('full'); });
              }, 900);
            }
          }
        };
        cardsEl.appendChild(el);
        return el;
      });
      root.onpointerdown = (e) => e.stopPropagation();
      root.classList.add('on');
    });
  }
  s5.FRAMES = FRAMES;

  async function prologue() {
    OM.letterbox(true);
    OM.vision((ctx) => { ctx.fillStyle = '#02040a'; ctx.fillRect(0, 0, W, H); });
    await OM.fadeTo(0, 900);
    S.whisper(2, 0.1);
    await say('Ночь кончилась. Я сел у обелиска — и уснул.', { italic: true });
    await say('И впервые за сорок лет увидел не чужую смерть.', { italic: true });
    S.hit();
    OM.flash(1);
    const canv = FRAMES.map(frameCanvas);
    const blank = frameCanvas(blankFrame('конца нет'));
    const shuffled = [2, 0, 3, 1].map((i) => ({ id: i, canvas: canv[i] }));
    await montage({
      cards: shuffled, n: 5, fixed: [null, null, null, null, blank], title: 'Своя смерть',
      hint: 'Сложите, как это будет. Последний кадр не трогайте — его ещё нет.',
      check: (p) => p.join() === '0,1,2,3' ? '=Рассвет. Мама. Шаг. Вода. А дальше — засвеченная плёнка.' : 'Нет. Не так. Ещё раз.',
    });
    OM.flag('sawDeath', 1);
    OM.ach.unlock('death');
    OM.vision((ctx) => {
      ctx.fillStyle = '#02040a';
      ctx.fillRect(0, 0, W, H);
      P.text(ctx, '06:40', W / 2, H / 2, { font: '500 150px "Cormorant Garamond",serif', color: '#b8d0f0', alpha: 0.85 + Math.random() * 0.15, ls: 18 });
    });
    S.hit();
    await OM.wait(1800);
    await OM.fadeTo(1, 500);
    OM.endVision();
    OM.setScene('dawn', 'default');
    await OM.fadeTo(0, 1600);
    OM.letterbox(false);
    await OM.run(() => G.scene.enter('default'));
  }

  // ---------- Рассвет: прощание ----------
  s5.dawnIntro = async () => {
    OM.letterbox(true);
    await say('Шесть утра. Вода пришла в город. По щиколотку — тихо, как гость.');
    await say('В видении — без двадцати семь. Я на мостках, мама в воде, шаг. И дальше — ничего.');
    await say('Конец не снят. Значит, его ещё можно снять по-другому.');
    OM.letterbox(false);
    OM.toast('Попрощайтесь с теми, кто пришёл. Потом — к воде, направо.');
  };
  const LINES = {
    zina: async () => {
      await OM.say('zina', 'Ты к ней идёшь. Я знаю — у тебя лицо такое же было, когда тебе полгода было и ты в окно смотрел.');
      await OM.say('zina', 'Вот. Ножницы. Этими я тебе пуповину резала — в лодке, когда из воды вышли.');
      OM.give('scissors');
      await OM.say('zina', 'Анна велела: если позовут — отрежь. Нить к ней — отрежь, и живи.');
      await say('А если не захочу резать?');
      await OM.say('zina', 'Тогда не режь. Тогда — держи крепче.');
    },
    mitya: async () => {
      await OM.say('mitya', 'Дядя Лев, а вы под воду? Насовсем?');
      await say('Не знаю, Митя.');
      await OM.say('mitya', 'Возьмите. Это ба вам тогда звонила. Им будят.');
      OM.give('bell');
      await OM.say('mitya', 'Если кто спит — позвоните. Они просыпаются. Я проснулся.');
    },
    vera: async () => {
      await OM.say('vera', 'Я всю ночь просидела над подшивкой. Список. Те, кто отказался уезжать.');
      await OM.say('vera', 'Семеро жили у самой церкви. Их, говорят, даже не искали. Вот — имена, годы, кто кем был.');
      OM.give('list');
      await OM.say('vera', 'Там, внизу, им, наверное, имена нужнее всего. Без имени человека нельзя ни позвать, ни отпустить.');
    },
    sem: async () => {
      await OM.say('sem', 'Фонарь возьми. Под водой темно, а этот не гаснет. Проверено.');
      OM.give('lantern');
      await OM.say('sem', 'Мамка моя там. Ершова Мария. Если увидишь — скажи: Петенька сапоги снял. Пусть не ждёт.');
    },
    nik: async () => {
      await OM.say('nik', 'Требник. Чин погребения. Не обязательно священнику читать — обязательно знать, кого отпеваешь.');
      OM.give('trebnik');
      await OM.say('nik', 'Имена, Лёва. И колокол — чтобы услышали. Тогда отпустит их. А может, и тебя.');
      await say('А меня — от чего?');
      await OM.say('nik', 'От воды.');
    },
  };
  s5.talkTo = async (who) => {
    const f = G.flags;
    if (f['bye_' + who]) {
      const again = { zina: 'Иди уже. Самовар стынет.', mitya: 'Возвращайтесь, ладно?', vera: 'Удачи вам, Лев Аркадьевич.', sem: 'Ступай, ступай.', nik: 'С Богом.' }[who];
      return OM.say(who === 'nik' ? 'nik' : who, again);
    }
    await LINES[who]();
    f['bye_' + who] = 1;
    OM.save();
  };
  s5.canGo = () => ['zina', 'mitya', 'vera', 'sem', 'nik'].filter((w) => s5.present(w)).every((w) => G.flags['bye_' + w]);

  // ---------- Спуск ----------
  s5.descend = async () => {
    if (!s5.canGo()) return say('Сначала — попрощаться. Со всеми, кто пришёл.');
    OM.letterbox(true);
    await say('Без двадцати семь. Мостки. Вода по щиколотку, по колено, по пояс.');
    await OM.fadeTo(1, 900);
    const v = { k: 0 };
    OM.vision((ctx, t) => descentView(ctx, t, v));
    S.amb({ water: 1, drone: 0.4 });
    S.muffle(0.7);
    await OM.fadeTo(0, 900);
    S.splash();
    await tw(7000, (k) => (v.k = k));
    await say('Холодно. Потом — нет. Потом — дом.', { italic: true });
    await OM.fadeTo(1, 900);
    S.muffle(0);
    OM.endVision();
    OM.letterbox(false);
    G.flags.inverse = 1;
    OM.setScene('inverse', 'default');
    await OM.fadeTo(0, 1100);
    await OM.run(() => G.scene.enter('default'));
  };
  function descentView(ctx, t, v) {
    const k = v.k;
    P.fillV(ctx, 0, 0, W, H, [[0, hex('#6a8ab0', 1 - k * 0.6)], [0.5, '#16263e'], [1, '#02050a']]);
    for (let i = 0; i < 8; i++) P.cone(ctx, 200 + i * 130 + Math.sin(t * 0.3 + i) * 20, -20, 24, 140, 700, '#cfe4ff', 0.18 * (1 - k * 0.5));
    // снизу проступает перевёрнутое село: крыши вниз, крест вниз
    ctx.save();
    ctx.globalAlpha = clamp(k * 1.4 - 0.3, 0, 1);
    ctx.translate(0, lerp(900, 420, OM.smooth(k)));
    for (let i = 0; i < 7; i++) {
      const x = 80 + i * 180;
      ctx.fillStyle = '#0c1626';
      ctx.fillRect(x, 0, 120, 90);
      ctx.beginPath();
      ctx.moveTo(x - 10, 90); ctx.lineTo(x + 60, 150); ctx.lineTo(x + 130, 90);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,200,120,.5)';
      ctx.fillRect(x + 40, 30, 20, 24);
    }
    ctx.fillStyle = '#0c1626';
    ctx.fillRect(1000, 0, 140, 200);
    ctx.beginPath(); ctx.arc(1070, 200, 50, 0, Math.PI); ctx.fill();
    ctx.fillRect(1067, 250, 6, 60);
    ctx.fillRect(1055, 285, 30, 6);
    ctx.restore();
    // Лев медленно опускается, пузыри вверх
    const y = lerp(140, 470, OM.smooth(k));
    ctx.save();
    ctx.translate(640, y);
    ctx.rotate(Math.sin(t * 0.7) * 0.08);
    ctx.translate(-640, -y);
    A.hero(ctx, { x: 640, y, s: 1.3, face: 1, item: 'none', pose: 'reach', light: { amb: 0.45, tint: '#3a5a80' }, rim: { color: 'rgba(200,225,255,.6)', dx: 1 } }, t);
    ctx.restore();
    for (let i = 0; i < 26; i++) {
      const kk = (t * 0.25 + i * 0.137) % 1;
      ctx.strokeStyle = `rgba(220,235,255,${0.5 * (1 - kk)})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(620 + Math.sin(i * 7 + t) * 30 + (i % 5) * 8, y - 200 - kk * 300, 2 + (i % 4), 0, TAU);
      ctx.stroke();
    }
    P.fogBand(ctx, t, 600, 200, 6, 0.2);
  }

  // ---------- Изнанка: список, имена ----------
  s5.NAMES = [
    { id: 'smith', name: 'Кузнецов Илья Петрович', note: 'кузнец, 1901', said: 'Горн погас. Сорок лет не ковано…', ok: 'Илья. Да… Илья я. Кузнец.' },
    { id: 'widow', name: 'Ершова Мария Семёновна', note: 'вдова, сын Пётр в армии, 1912', said: 'Петенька придёт — а сапоги мокрые. Сапоги бы снял…', ok: 'Мария. Маша… Меня так муж звал.' },
    { id: 'deacon', name: 'Дьячков Ефим Лукич', note: 'дьякон Покровской церкви, 1889', said: 'Служба не кончена. Ектенью не допели…', ok: 'Ефим. Раб Божий Ефим. Помню.' },
    { id: 'boy', name: 'Лаптев Иван', note: '8 лет, 1947', said: '…', ok: 'Ваня! Я Ваня! А где мамка?' },
    { id: 'fisher', name: 'Рыбин Тимофей Ильич', note: 'рыбак, 1898', said: 'Сети бы поднять. Рыба нынче глубоко…', ok: 'Тимоха. Рыбин. Ну надо же — вспомнил.' },
    { id: 'milk', name: 'Савина Евдокия Никитична', note: 'молочница, 1905', said: 'Молоко скиснет. Бидон-то полный…', ok: 'Дуня. Евдокия. Савина я.' },
    { id: 'teacher', name: 'Сельцов Павел Андреевич', note: 'учитель начальной школы, 1910', said: 'Диктант не проверен. Тридцать две тетради…', ok: 'Павел Андреевич. Садитесь, дети. Урок окончен.' },
  ];
  s5.unnamed = () => s5.NAMES.filter((n) => !G.flags['named_' + n.id]).length;
  s5.readList = async () => {
    const lines = s5.NAMES.map((n) => ['lev', `${n.name} — ${n.note}.`]);
    await OM.talk([['lev', 'Список. Рукой Веры сверху: «Не уехали. Не найдены».'], ...lines.slice(0, 4), ...lines.slice(4), ['lev', 'И ниже, отдельно: «Гордеева Анна Петровна, с сыном Львом». Сын вычеркнут.']]);
  };
  // Назвать по имени: выбор из ещё не названных.
  s5.nameAsk = async (who) => {
    if (!OM.has('list')) {
      if (s5.present('vera')) return say('Имени я не знаю. Список у меня… нет, не взял. Вера отдавала.');
      return say('Имени я не знаю. Списка у меня нет.');
    }
    const opts = s5.NAMES.filter((n) => !G.flags['named_' + n.id]).map((n) => ({ id: n.id, text: `${n.name}, ${n.note.split(',')[0]}` }));
    opts.push({ id: 'none', text: 'Не знаю…' });
    const c = await OM.choose(opts);
    if (c === 'none') return null;
    if (c !== who) {
      G.flags.nameMiss = (G.flags.nameMiss || 0) + 1;
      await OM.say('drowned', 'Нет… не так меня звали.', { italic: true });
      return false;
    }
    return true;
  };

  // ---------- Дом Анны ----------
  s5.annaTalk = async () => {
    const seen = (G.flags.annaSeen = G.flags.annaSeen || {});
    const asay = (t, o) => OM.say('anna', t, o);
    if (!G.flags.annaMet) {
      G.flags.annaMet = 1;
      await asay('Пришёл. Я самовар поставила. Он сорок лет кипит — всё тебя ждёт.');
      await say('Мама.');
      await asay('Дай посмотреть на тебя. Седой уже. А ресницы — мои.');
      await asay('Садись. Чай с чабрецом, как ты любил. Ты не помнишь, конечно. Тебе полгода было.');
    }
    for (;;) {
      const opts = [
        { id: 'why', text: 'Почему ты осталась?' },
        { id: 'knew', text: 'Ты знала, что я вернусь?' },
        { id: 'them', text: 'Что с ними — со всеми, кто здесь?' },
        { id: 'zina', text: 'Зина говорит, ты велела ей молчать.' },
      ];
      opts.forEach((o) => (o.seen = seen[o.id]));
      opts.push({ id: 'end', text: 'Мама… мне надо решить.' });
      const c = await OM.choose(opts);
      seen[c] = 1;
      if (c === 'end') return s5.finale();
      if (c === 'why') {
        await asay('Сказали — вода возьмёт того, кто уйдёт последним. Последними были вы с Зиной.');
        await asay('Я и осталась. Чтобы вода взяла меня, а не вас. Обменялась, понимаешь? Как на базаре.');
      }
      if (c === 'knew') {
        await asay('Знала. Ты ведь видишь, как я. Это от меня у тебя. Я тоже видела — и то, что ты придёшь, видела.');
        await asay('Только не видела, что ты решишь. Этого никто не видит. Это — твоё.');
      }
      if (c === 'them') {
        await asay('Ждут. Кто — имени своего, кто — колокола, кто — просто, чтобы сказали: всё, можно.');
        if (s5.unnamed()) await asay(`${s5.unnamed()} из них так и стоят без имён. Им тяжелее всех.`);
        else await asay('Ты им имена вернул. Я видела в окно — они светлеют, когда их зовут.');
      }
      if (c === 'zina') {
        await asay('Велела. Чтобы ты жил наверху, а не здесь. Чтобы не тянуло.');
        await asay('А тебя всё равно потянуло. Вода — она своих помнит.');
      }
    }
  };

  // Финальный монтаж: пятый кадр выбирает игрок.
  s5.secretReady = () => !s5.unnamed() && G.flags.bellRung && (OM.has('trebnik') || G.flags.nikBelow);
  s5.finale = async () => {
    OM.letterbox(true);
    await OM.say('anna', 'Решай, Лёвушка. Конец у той плёнки — твой.');
    const canv = FRAMES.map(frameCanvas);
    const ends = { A: frameCanvas(ENDS.A), B: frameCanvas(ENDS.B), C: frameCanvas(s5.secretReady() ? ENDS.C : blankFrame('засвечено')) };
    const cards = [
      { id: 'A', canvas: ends.A, label: 'Обрезать нити' },
      { id: 'B', canvas: ends.B, label: 'Остаться с мамой' },
    ];
    if (s5.secretReady() || G.flags.secretHint) cards.push({ id: 'C', canvas: ends.C, label: s5.secretReady() ? 'Отпеть' : '???', locked: s5.secretReady() ? null : 'Плёнка засвечена. Не хватает имён — или колокола.' });
    else cards.push({ id: 'C', canvas: ends.C, label: '???', locked: 'Плёнка засвечена. Не хватает имён — или колокола.' });
    const [end] = await montage({
      cards, n: 5, fixed: canv, title: 'Последний кадр', hint: 'Четыре кадра сняты. Пятый — выберите сами.',
      check: () => true,
    });
    OM.letterbox(false);
    if (end === 'A') return OM.endings.A();
    if (end === 'B') return OM.endings.B();
    return OM.endings.C();
  };
})();
