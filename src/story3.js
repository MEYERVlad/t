// Глава 3 «Покровское»: берег на закате, нити, лодка на звон, затопленный храм, 1955 год, колокол.
(function () {
  const G = OM.G, S = OM.S, P = OM.P, A = OM.Actors;
  const { W, H, lerp, rng, clamp, hex } = OM;
  const say = (t, o) => OM.say('lev', t, o);
  const nsay = (t) => OM.say('nik', t);
  const s3 = (OM.story3 = {});

  // ---------- Предметы ----------
  OM.Icons.chapelkey = (c) => {
    c.strokeStyle = '#6a6e70';
    c.fillStyle = '#6a6e70';
    c.lineWidth = 5;
    c.beginPath();
    c.arc(18, 20, 10, 0, Math.PI * 2);
    c.stroke();
    c.beginPath();
    c.moveTo(25, 27);
    c.lineTo(52, 54);
    c.stroke();
    c.fillRect(42, 46, 6, 12);
    c.fillRect(48, 52, 6, 9);
    c.fillStyle = 'rgba(255,255,255,.25)';
    c.fillRect(12, 12, 4, 2);
  };
  OM.Icons.oars = (c) => {
    c.lineCap = 'round';
    [[10, 54, 50, 8], [54, 54, 14, 8]].forEach(([x0, y0, x1, y1]) => {
      c.strokeStyle = '#7a5a3a';
      c.lineWidth = 4;
      c.beginPath();
      c.moveTo(x0, y0);
      c.lineTo(x1, y1);
      c.stroke();
      c.fillStyle = '#8a6a44';
      c.save();
      c.translate(x1, y1);
      c.rotate(Math.atan2(y1 - y0, x1 - x0));
      c.beginPath();
      c.ellipse(-4, 0, 10, 5, 0, 0, Math.PI * 2);
      c.fill();
      c.restore();
    });
  };
  OM.Icons.rope = (c) => {
    c.strokeStyle = '#b89a6a';
    c.lineWidth = 3;
    for (let i = 0; i < 4; i++) {
      c.beginPath();
      c.ellipse(32, 32, 20 - i * 4, 14 - i * 3, 0.2, 0, Math.PI * 2);
      c.stroke();
    }
    c.beginPath();
    c.moveTo(48, 40);
    c.quadraticCurveTo(58, 52, 50, 60);
    c.stroke();
  };
  OM.Icons.cross = (c) => {
    c.strokeStyle = '#c9a050';
    c.lineWidth = 1;
    c.beginPath();
    c.arc(32, 22, 16, Math.PI * 1.1, Math.PI * 1.9);
    c.stroke();
    c.fillStyle = '#e0b860';
    c.fillRect(29, 18, 6, 32);
    c.fillRect(21, 26, 22, 5);
    c.fillRect(24, 38, 16, 3);
    c.fillStyle = 'rgba(255,255,255,.4)';
    c.fillRect(30, 20, 1.5, 28);
  };
  Object.assign(OM.ITEMS, {
    chapelkey: { name: 'Ключ от часовни', icon: 'chapelkey', look: 'Кованый ключ. Пролежал в воде полгода — ни пятнышка ржавчины.' },
    oars: { name: 'Вёсла', icon: 'oars', look: 'Два весла, тяжёлые, сухие. Пахнут смолой.' },
    rope: { name: 'Верёвка', icon: 'rope', look: 'Моток пеньковой верёвки. Крепкая. Из часовни — значит, освящённая, сказал бы Никодим.' },
    cross: { name: 'Крестильный крестик', icon: 'cross', look: 'Маленький медный крестик. На обороте нацарапано: «Лёва. 1955».' },
  });

  // Энциклопедия: подсказки третьей главы.
  const bookPrev = OM.ITEMS.book.look;
  OM.ITEMS.book.look = () => {
    if (!OM.flag('ch3')) return bookPrev();
    return async () => {
      const f = G.flags;
      await say('Так, что тут у нас…');
      if (!f.threadsUnlocked) return OM.say('book', '«Священник — служитель культа». Отец Никодим у костра. С ним и поговорить.');
      if (!f.gotChapelKey) return OM.talk([['book', '«Нить — тонкое прядево»…'], ['lev', 'Смотреть иначе. Глаз внизу слева или пробел — и видно нити. От двери часовни одна уходит в воду.']]);
      if (!OM.has('oars') && !f.chapelOpen) return say('Ключ есть. Часовня — слева, на берегу.');
      if (G.sid === 'shore') return say('Вёсла — к лодке.');
      if (G.sid === 'lake') return OM.say('book', '«Звук распространяется в воде и над водой». Колокол слева — значит, левее. Нити тоже ведут к нему.');
      if (!f.gotCross) return OM.talk([['book', '«Купель — сосуд для крещения»'], ['lev', 'Чёрная вода в купели. Глазами там ничего не видно. А нитями?'], ['lev', 'И — не смотреть им в лица. Курсор держать подальше от голов.']]);
      if (!f.ropeTied) return say('Колокольня — слева, за аркой. Верёвку — к языку колокола.');
      return say('Звонить.');
    };
  };

  // ---------- Начало ----------
  s3.start = async () => {
    G.flags = { ch3: 1 };
    G.inv = [];
    OM.renderInv();
    G.mode = 'play';
    G.threads = false;
    G.busy++;
    await OM.fadeTo(1, 600);
    await OM.card('Глава третья. Покровское', 'вечер того же дня', 3400);
    OM.give('book', true);
    OM.setScene('shore', 'default');
    G.busy--;
    OM.run(() => G.scene.enter('default'));
  };

  s3.arrive = async () => {
    OM.letterbox(true);
    await OM.fadeTo(0, 1800);
    await say('Вода ушла. Впервые за сорок лет. Из ила поднялось село — трубы, кресты, колодец.');
    await OM.walk(400, 650);
    G.hero.face = 1;
    await nsay('Вера звонила. Сказала — придёт человек с глазами. Ты Гордеев?');
    await say('Гордеев. Лев.');
    await nsay('Лев… Значит, вернулся.');
    OM.letterbox(false);
    OM.save();
    OM.toast('Цель: попасть в церковь посреди озера.');
  };

  s3.talkNik = async () => {
    const seen = (G.flags.nikSeen = G.flags.nikSeen || {});
    if (!OM.flag('threadsUnlocked')) {
      await say('Мне нужно в церковь. Сегодня.');
      await nsay('Сегодня — можно. Вода ушла до полуночи. Такого не было с пятьдесят пятого.');
      await nsay('Лодка есть. Вёсел нет — заперты в часовне. А ключ от часовни я весной в воду уронил.');
      await say('Куда именно?');
      await nsay('Если б я знал, куда, — я бы его достал.');
      await OM.wait(500);
      await nsay('Ты ведь видишь то, чего другие не видят. Посмотри на воду иначе. Не глазами.');
      OM.flag('threadsUnlocked', 1);
      S.threads(true);
      OM.save();
      OM.toast(G.touch ? 'Нажмите на глаз слева внизу, чтобы увидеть нити.' : 'Нажмите на глаз слева внизу или пробел, чтобы увидеть нити.');
      return;
    }
    await nsay('Спрашивай.');
    for (;;) {
      const opts = [
        { id: 'who', text: 'Кто вы?' },
        { id: '55', text: 'Что случилось в пятьдесят пятом?' },
        { id: 'them', text: 'Кто они — те, что в воде?' },
        { id: 'why', text: 'Почему я?' },
      ];
      opts.forEach((o) => (o.seen = seen[o.id]));
      opts.push({ id: 'bye', text: 'Пора.' });
      const c = await OM.choose(opts);
      seen[c] = 1;
      if (c === 'bye') return;
      if (c === 'who') {
        await nsay('Священник без прихода. Мой приход — там. Я в нём служкой был, мальчишкой.');
        await nsay('Сорок лет служу у берега. Вода — тоже паства.');
      }
      if (c === '55') {
        await nsay('Четырнадцатое октября. Покров. Последняя служба. Плотину закрыли раньше срока — вода пришла во время литургии.');
        await nsay('Кто-то ушёл. Кто-то остался. Сказали — не бросим храм.');
      }
      if (c === 'them') {
        await nsay('Те, кто остался. Они не злые. Они ждут, чтобы их отпели. А отпеть некому — я тогда не успел.');
        await nsay('Только в лицо им не смотри. Утянет.');
      }
      if (c === 'why') {
        await nsay('Твоя нить туда ведёт. Золотая. Я вижу её так же, как ты.');
        await say('Вы тоже видите нити?');
        await nsay('Сорок лет. Привыкнешь.');
      }
    }
  };

  s3.chapelLoot = async () => {
    await say('Внутри — иконка, огарок свечи, вёсла у стены. И моток верёвки.');
    OM.give('oars');
    await OM.wait(300);
    OM.give('rope');
    OM.save();
    await say('Верёвку тоже возьму. Чувствую — пригодится.');
  };

  s3.toBoat = async () => {
    OM.letterbox(true);
    await nsay('Садись. Я гребу — ты слушаешь. Туман сейчас сядет, глазами дорогу не найдёшь.');
    await nsay('Колокол позовёт.');
    await say('Колокол? Там же нет колоколов.');
    await nsay('Один есть.');
    OM.take('oars');
    OM.letterbox(false);
    await OM.go('lake');
  };

  s3.startRowing = async () => {
    const st = OM.lake.st;
    OM.letterbox(true);
    await OM.wait(800);
    S.bigBell(-0.8, 0.8);
    await nsay('Слышишь? Это он. Плыви на звон. А на них — не плыви.');
    OM.letterbox(false);
    OM.toast(G.touch ? 'Держите палец слева или справа — лодка поворачивает. Плывите на звон. Лучше в наушниках.' : 'Зажмите левую или правую половину экрана (или ←/→), чтобы поворачивать. Плывите на звон. Лучше в наушниках.');
    st.active = true;
  };

  s3.arriveChurch = async () => {
    if (!OM.lake.st.hits) OM.ach.unlock('lake');
    OM.letterbox(true);
    S.bigBell(0, 1);
    await OM.fadeTo(1, 900);
    OM.vision((ctx, t) => {
      // церковь вблизи: стены из воды, лодка у паперти
      P.fillV(ctx, 0, 0, W, H, [[0, '#070a16'], [0.6, '#1a2238'], [1, '#05080e']]);
      P.moon(ctx, 1080, 110, 26, 0.9);
      ctx.fillStyle = '#141820';
      ctx.fillRect(280, 140, 720, 420);
      ctx.beginPath();
      ctx.moveTo(500, 140);
      ctx.quadraticCurveTo(480, -10, 640, -60);
      ctx.quadraticCurveTo(800, -10, 780, 140);
      ctx.fill();
      ctx.fillStyle = '#10141c';
      ctx.fillRect(120, 40, 140, 520);
      for (let i = 0; i < 5; i++) {
        ctx.fillStyle = 'rgba(170,190,230,.35)';
        ctx.beginPath();
        ctx.moveTo(340 + i * 140, 420);
        ctx.lineTo(340 + i * 140, 300);
        ctx.arc(370 + i * 140, 300, 30, Math.PI, 0);
        ctx.lineTo(400 + i * 140, 420);
        ctx.fill();
      }
      ctx.fillStyle = 'rgba(255,210,150,.6)';
      ctx.fillRect(170, 120, 40, 60);
      P.fillV(ctx, 0, 560, W, 160, [[0, '#18223a'], [1, '#04060a']]);
      for (let i = 0; i < 30; i++) {
        ctx.fillStyle = `rgba(190,205,235,${0.25 - i * 0.008})`;
        ctx.fillRect(1080 - 20 - i * 2 + Math.sin(t + i) * 6, 566 + i * 5, 40 + i * 4, 1.4);
      }
      P.fogBand(ctx, t, 560, 120, 5, 0.5);
      // лодка у окна
      ctx.fillStyle = '#1a120c';
      ctx.beginPath();
      ctx.moveTo(380, 600);
      ctx.quadraticCurveTo(520, 620, 660, 596);
      ctx.lineTo(620, 630);
      ctx.lineTo(420, 632);
      ctx.fill();
      A.nikodim(ctx, { x: 600, y: 612, s: 0.7, face: -1, light: { amb: 0.35, tint: '#2a3450' }, rim: { color: 'rgba(200,215,240,.5)', dx: 1.2 } }, t);
      P.glow(ctx, 470, 590, 60, '#ffb060', 0.5);
    });
    await OM.fadeTo(0, 1200);
    await nsay('Дальше — сам. Мне туда ещё рано.');
    await nsay('На колокольне язык привязан гнилой верёвкой. Ударишь — они услышат. Поймут, что их отпевают.');
    await say('А если не поймут?');
    await nsay('Тогда поймут, что ты вернулся. Иди. Окно открыто.');
    await OM.fadeTo(1, 700);
    OM.endVision();
    OM.letterbox(false);
    await OM.go('church', 'window');
  };

  s3.enterChurch = async () => {
    OM.letterbox(true);
    await OM.wait(500);
    await say('Вода по пояс. Мостки из скамеек. И они — стоят рядами. Как на службе.');
    await say('Не смотреть в лица.');
    OM.letterbox(false);
    OM.save();
    OM.toast('Не задерживайте курсор на их головах — это и есть взгляд.');
  };

  // ---------- Крестик и 1955 год ----------
  s3.takeCross = async () => {
    G.hero.pose = 'reach';
    await OM.wait(600);
    G.hero.pose = null;
    OM.flag('gotCross', 1);
    OM.give('cross');
    OM.toggleThreads(false);
    await say('Крестик. Маленький, медный. На обороте: «Лёва. 1955».');
    await OM.wait(400);
    await flashback();
    OM.flag('flashback', 1);
    OM.save();
    await say('Зина. Зинаида Павловна. Это она меня вынесла.');
    await say('А мама осталась. Здесь.');
    await OM.wait(500);
    await say('Колокол. Никодим сказал — они услышат.');
    OM.toast('Цель: подняться на колокольню.');
  };

  // Прошлое: сухой храм 1955 года — тёплый, со свечами.
  function paintPast(g) {
    P.fillV(g, 0, 0, W, H, [[0, '#3a2a1c'], [0.6, '#7a5a3a'], [1, '#4a3424']]);
    const saint = OM.church.saint;
    saint(g, 120, 200, 260, 603);
    saint(g, 250, 210, 250, 604);
    saint(g, 560, 190, 270, 605);
    saint(g, 700, 205, 255, 606);
    g.fillStyle = '#c9a050';
    g.fillRect(990, 120, 290, 480);
    for (let tier = 0; tier < 4; tier++) for (let k = 0; k < 4; k++) {
      P.fillV(g, 1004 + k * 68, 148 + tier * 108, 52, 86, [[0, '#8a5a30'], [1, '#5a3a1c']]);
      g.fillStyle = '#e8c060';
      g.beginPath();
      g.arc(1030 + k * 68, 170 + tier * 108, 12, 0, Math.PI * 2);
      g.fill();
    }
    P.fillV(g, 0, 600, W, 120, [[0, '#5a3a22'], [1, '#2a1a10']]);
    for (let x = 0; x < W; x += 40) { g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(x, 600, 1.5, 120); }
    // купель
    P.fillV(g, 876, 556, 68, 44, [[0, '#c8c0b0'], [1, '#8a8478']]);
  }

  // Прихожане 1955 года — живые люди на скелете: женщины в платках, мужчины в пальто и кепках.
  const SCARVES = ['#7a2a20', '#3a4a6a', '#6a5a3a', '#8a7a6a', '#4a3a3a'];
  const WOMEN = [
    { cardigan: '#4a3a30', blouse: '#d0c4a8', skirt: '#2a2422', skin: '#d8a88e', hair: '#3a2418', shoes: '#1a1210', tights: '#2a2220' },
    { cardigan: '#3a3a44', blouse: '#d0c4a8', skirt: '#30282a', skin: '#e0b096', hair: '#3a2418', shoes: '#1a1210', tights: '#2a2220' },
    { cardigan: '#5a4430', blouse: '#d0c4a8', skirt: '#3a3026', skin: '#cfa086', hair: '#3a2418', shoes: '#1a1210', tights: '#2a2220' },
  ];
  function parishioner(ctx, i, x, y, s, face, t, move) {
    const r = rng(300 + i * 7);
    const o = { x, y, s, face, light: pastLight, move, phase: t * 5 + i, seed: i };
    if (r() < 0.62) A.vera(ctx, Object.assign(o, { pal: WOMEN[i % 3], scarf: SCARVES[i % 5], glasses: false, hold: r() < 0.25 ? 'chest' : null }), t);
    else A.hero(ctx, Object.assign(o, { item: 'none', hat: false, hair: ['#2a211b', '#5a4a3a', '#8a8478'][i % 3] }), t);
  }
  function crowd(ctx, t, shot, shift) {
    if (shot === 0) {
      // полный храм — стоят, слушают службу (статично, в кэше)
      ctx.drawImage(OM.cache('past:crowd', (g) => {
        const r = rng(900);
        const list = [];
        for (let i = 0; i < 22; i++) list.push([60 + r() * 760, 610 + r() * 70, i]);
        list.sort((p, q) => p[1] - q[1]);
        list.forEach(([x, y, i]) => parishioner(g, i, x, y, 0.62 + (y - 610) / 300, 1, 0.5, 0));
      }), 0, 0, W, H);
      return;
    }
    // уходят: идут к дверям налево
    const r = rng(901);
    for (let i = 0; i < 9; i++) {
      const x = 120 + r() * 660 + shift * (0.6 + r() * 0.6), y = 615 + r() * 60;
      if (x < -60) continue;
      parishioner(ctx, i, x, y, 0.62 + (y - 610) / 300, -1, t, 1);
    }
  }
  function candles(ctx, t, lit = 1) {
    for (let i = 0; i < 18; i++) {
      if (lit < 1 && i / 18 > lit) continue;
      const x = 920 + (i % 6) * 14 + Math.floor(i / 6) * 7, y = 520 + Math.floor(i / 6) * 10;
      ctx.fillStyle = '#e8dcc0';
      ctx.fillRect(x, y, 2, 14);
      const f = 0.8 + Math.sin(t * 9 + i) * 0.2;
      P.glow(ctx, x + 1, y - 3, 10, '#ffcc66', 0.6 * f);
    }
    P.glow(ctx, 960, 520, 220, '#ffb060', 0.18 * lit);
  }
  function grade(ctx, t, k = 1) {
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = '#e8b888';
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = `rgba(255,230,190,${0.04 + Math.random() * 0.04})`;
    ctx.fillRect(0, 0, W, H);
    // царапины плёнки
    for (let i = 0; i < 3; i++) {
      if (Math.random() < 0.5) continue;
      ctx.fillStyle = `rgba(255,240,220,${0.15 + Math.random() * 0.2})`;
      ctx.fillRect(Math.random() * W, 0, 1, H);
    }
    ctx.fillStyle = P.rgrad(ctx, W / 2, H / 2, H * 0.3, W * 0.7, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(20,10,4,.7)']]);
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  const ANNA = { cardigan: '#5a4a3a', blouse: '#d8ccb0', skirt: '#3a3030', skin: '#e2b49a', hair: '#3a2418', shoes: '#2a1c16', tights: '#3a302c' };
  const ZINAY = { cardigan: '#4a5a6a', blouse: '#e0d8c8', skirt: '#2a2a3a', skin: '#e8bca0', hair: '#5a3a24', shoes: '#2a1c16', tights: '#3a302c' };
  const pastLight = { amb: 0.95, tint: '#c09060', side: 1 };

  async function flashback() {
    const v = { shot: 0, water: 0, crowdShift: 0, zx: 140, zina: false, zinaBaby: false, anna: 1, annaCold: 0, annaX: 880, text: '', textA: 0, white: 0 };
    let last = performance.now();
    OM.letterbox(true);
    S.choir(false);
    S.hit();
    OM.flash(1);
    OM.vision((ctx, t) => {
      const now = performance.now(), dt = (now - last) / 1000;
      last = now;
      ctx.save();
      const z = 1 + Math.min(0.08, t * 0.004);
      ctx.translate(W / 2, H / 2);
      ctx.scale(z, z);
      ctx.translate(-W / 2, -H / 2);
      ctx.drawImage(OM.cache('past:bg', paintPast), 0, 0, W, H);
      candles(ctx, t, 1 - v.annaCold);
      crowd(ctx, t, v.shot, v.crowdShift);
      // Анна у купели (рисуется до воды — вода закрывает её по грудь)
      if (v.anna > 0) {
        const k = v.annaCold;
        const L = { amb: lerp(0.95, 0.32, k), tint: k > 0.01 ? '#3a5a70' : '#c09060', side: 1 };
        ctx.save();
        ctx.globalAlpha = v.anna;
        A.vera(ctx, { x: v.annaX, y: 640, s: 1.25, face: -1, light: L, scarf: '#7a2a20', glasses: false, pal: ANNA, hold: v.zinaBaby ? (k > 0.2 ? 'chest' : null) : 'baby', talking: v.annaTalk, headTilt: k * 0.22, eyesClosed: k > 0.55 }, t);
        ctx.restore();
      }
      // вода прибывает
      if (v.water > 0) {
        const wy = 720 - v.water;
        P.fillV(ctx, 0, wy, W, v.water, [[0, 'rgba(90,110,100,.78)'], [1, 'rgba(30,40,40,.95)']]);
        ctx.fillStyle = 'rgba(230,240,230,.35)';
        ctx.fillRect(0, wy, W, 1.5);
        for (let i = 0; i < 6; i++) {
          ctx.fillStyle = 'rgba(230,240,230,.12)';
          ctx.fillRect(((i * 211 + t * 30) % W), wy + 6 + i * 9, 60 + i * 10, 1);
        }
      }
      if (v.zina) A.vera(ctx, { x: v.zx, y: 650, s: 1.2, face: v.zinaFace || 1, move: v.zMove || 0, phase: t * 5, light: pastLight, glasses: false, pal: ZINAY, hold: v.zinaBaby ? 'baby' : null, talking: v.zinaTalk }, t);
      ctx.restore();
      grade(ctx, t);
      if (v.white > 0) { ctx.fillStyle = `rgba(255,250,240,${v.white})`; ctx.fillRect(0, 0, W, H); }
      if (v.textA > 0) P.text(ctx, v.text, W / 2, 120, { font: 'italic 500 34px "Cormorant Garamond",serif', color: '#f6e8d0', alpha: v.textA, ls: 3 });
    });
    const tween = async (ms, f) => { const t0 = performance.now(); while (performance.now() - t0 < ms) { f((performance.now() - t0) / ms); await OM.wait(16); } f(1); };
    // 1. Покров, последняя служба
    v.text = 'Покровское. 14 октября 1955 года';
    await tween(1200, (k) => (v.textA = k));
    S.choir(true);
    await OM.wait(2600);
    await tween(800, (k) => (v.textA = 1 - k));
    // 2. вода под дверями, люди уходят
    v.shot = 1;
    S.splash();
    await tween(3500, (k) => { v.water = k * 50; v.crowdShift = -k * 500; });
    // 3. Зина вбегает
    v.zina = true; v.zMove = 1;
    await tween(1600, (k) => (v.zx = lerp(120, 700, k)));
    v.zMove = 0;
    v.zinaTalk = true;
    await OM.say('zinaY', 'Анна! Вода! Пойдём, пойдём же!');
    v.zinaTalk = false;
    v.annaTalk = true;
    await OM.say('anna', 'Я останусь, Зиночка. Здесь мой дом.');
    await OM.say('anna', 'А его — унеси. Назови Львом. И не говори ему про нас. Никогда.');
    v.annaTalk = false;
    // 4. Анна отдаёт младенца
    await tween(900, (k) => (v.zx = lerp(700, 790, k)));
    v.zinaBaby = true;
    S.heartbeat();
    await OM.wait(900);
    v.zinaFace = -1; v.zMove = 1;
    v.zinaTalk = true;
    OM.say('zinaY', 'Анна…');
    await tween(2200, (k) => { v.zx = lerp(790, 60, k); v.water = 50 + k * 60; });
    v.zina = false; v.zinaTalk = false;
    if (G.saying) G.saying.res();
    // 5. Анна остаётся. Вода поднимается ей до груди, свечи гаснут одна за другой,
    //    свет на ней остывает — она закрывает глаза и опускает голову. Больше она не уйдёт.
    S.whisper(4, 0.12);
    await tween(5200, (k) => { v.water = 110 + k * 100; v.annaCold = OM.smooth ? OM.smooth(k) : k; });
    await OM.say('anna', 'Лёвушка…', { italic: true, hold: 1.2 });
    S.hit();
    await tween(500, (k) => (v.white = k));
    OM.endVision();
    S.choir(true);
    OM.letterbox(false);
    OM.flash(1);
  }

  // ---------- Колокол ----------
  s3.ring = async () => {
    OM.letterbox(true);
    G.hero.pose = 'reach';
    await say('Отпеть их некому. Но можно позвонить.');
    for (let i = 0; i < 3; i++) {
      const t0 = performance.now();
      while (performance.now() - t0 < 700) { OM.belfrySwing = Math.sin(((performance.now() - t0) / 700) * Math.PI) * 0.18; await OM.wait(16); }
      S.bigBell(0, 1);
      OM.shake(6);
      if (i === 1) OM.flag('rang', 1);
      await OM.wait(900);
    }
    OM.belfrySwing = 0;
    G.hero.pose = null;
    await OM.wait(800);
    S.whisper(3, 0.15);
    await OM.say('mother', 'Лёва… Лёвушка…', { italic: true });
    await say('…Мама?');
    await OM.wait(900);
    await OM.say('nik', 'Они услышали. Теперь они знают, что ты вернулся.');
    await s3.end();
  };

  s3.end = async () => {
    OM.store.set('omut-ch3-done', 1);
    await OM.fadeTo(1, 2400);
    S.choir(false);
    S.music('end');
    await OM.card('Конец третьей главы', 'Сорок лет они ждали. Одну ночь подождут ещё.', 4400);
    S.music(null);
    OM.clearSave();
    OM.letterbox(false);
    await OM.story4.start();
  };
})();
