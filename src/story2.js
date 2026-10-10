// Глава 2 «Город»: утро, Семёныч и «жучок», Вера, видение из обрывков, отключение света, архив.
(function () {
  const G = OM.G, S = OM.S, P = OM.P, A = OM.Actors;
  const { W, H, lerp, rng } = OM;
  const say = (t, o) => OM.say('lev', t, o);
  const zsay = (t) => OM.say('zina', t);
  const ssay = (t) => OM.say('sem', t);
  const vsay = (t) => OM.say('vera', t);
  const s2 = (OM.story2 = {});

  // ---------- Предмет: фонарик-«жучок» ----------
  OM.Icons.zhuchok = (c) => {
    c.fillStyle = '#4a5248';
    P.rrect(c, 12, 20, 34, 26, 7);
    c.fill();
    c.fillStyle = '#6a7266';
    P.rrect(c, 12, 20, 34, 8, 4);
    c.fill();
    c.fillStyle = '#dfe6c8';
    c.beginPath();
    c.ellipse(46, 33, 4, 9, 0, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = '#2a2e28';
    c.lineWidth = 4;
    c.beginPath();
    c.moveTo(18, 46);
    c.quadraticCurveTo(14, 56, 30, 54);
    c.stroke();
    c.fillStyle = '#2a2e28';
    c.fillRect(20, 30, 18, 3);
  };
  OM.ITEMS.zhuchok = {
    name: 'Фонарик «жучок»',
    icon: 'zhuchok',
    look: 'Динамо-фонарик. Жмёшь рычаг — он жужжит и светит. Батареек не просит. Свет без огня.',
  };

  // Энциклопедия как подсказка — во второй главе свои статьи.
  const bookCh1 = OM.ITEMS.book.look;
  OM.ITEMS.book.look = () => {
    if (!OM.flag('ch2')) return bookCh1();
    return async () => {
      const f = G.flags;
      await say('Так, что тут у нас…');
      if (!f.talkedVera) return OM.say('book', '«Библиотека — учреждение, собирающее и хранящее печатные издания». Вера. Библиотека при ДК, вход сбоку.');
      if (!f.visionCh2) return OM.say('book', '«Керосиновая лампа — светильник, работающий на керосине. Пожароопасна». Лампа у Веры на кафедре… что-то с ней не так.');
      if (!f.lightSafe) {
        if (!OM.has('zhuchok')) return OM.talk([['book', '«Фонарь динамоэлектрический — не требует батарей»'], ['lev', 'Свет без огня. У Семёныча на поясе как раз такой. Он, кажется, любит рыбалку больше, чем деньги.']]);
        return say('Жучок — Вере. Вместо керосинки.');
      }
      if (!f.doorWedged) return OM.say('book', '«Дверь — проём в стене для входа и выхода». Захлопнется — не выйти. Чем бы её подпереть… Да хоть томом энциклопедии.');
      return say('Вниз. В архив.');
    };
  };

  // ---------- Начало главы ----------
  s2.start = async () => {
    G.flags = { ch2: 1 };
    G.inv = [];
    OM.renderInv();
    G.mode = 'play';
    G.busy++;
    await OM.fadeTo(1, 600);
    await OM.card('Глава вторая. Город', 'утро следующего дня', 3200);
    OM.give('book', true);
    OM.setScene('lobby2', 'stairs');
    G.busy--;
    OM.run(() => s2.morning());
  };

  s2.morning = async () => {
    OM.letterbox(true);
    await OM.fadeTo(0, 1600);
    await OM.walk(760, 650);
    G.hero.face = -1;
    await zsay('Проснулись? Садитесь, чай остыл. Он и горячий был так себе.');
    await say('Как Митя?');
    await zsay('Спит как человек. Первый раз за месяц.');
    await OM.wait(600);
    await zsay('Звонок я нашла у вас под дверью. Спасибо, Лев Аркадьевич.');
    await say('Зинаида Павловна. Что такое Покровское?');
    await OM.wait(700);
    await zsay('…Не здесь. Сходите в библиотеку при Доме культуры, к Вере. У неё подшивки за пятьдесят пятый.');
    await zsay('Я туда не хожу.');
    OM.letterbox(false);
    OM.save();
    OM.toast('Цель: найти в библиотеке подшивки 1955 года.');
  };

  // ---------- Семёныч ----------
  s2.talkSem = async () => {
    if (!OM.flag('semMet')) {
      OM.flag('semMet', 1);
      await ssay('Здорово, приезжий. Это ты вчера Митьку с пристани привёл?');
      await say('…Откуда вы знаете?');
      await ssay('Весь город знает. Полгорода по ночам не спит, вот и знает.');
    } else await ssay('Ну?');
    const seen = (G.flags.semSeen = G.flags.semSeen || {});
    for (;;) {
      const opts = [
        { id: 'lib', text: 'Где тут библиотека?' },
        { id: 'belt', text: 'Что это у вас на поясе?' },
        { id: 'pok', text: 'Вы помните Покровское?' },
      ];
      if (OM.flag('visionCh2') && !OM.has('zhuchok') && !OM.flag('lightSafe')) opts.push({ id: 'buy', text: 'Продайте мне фонарь. Очень нужно.' });
      if (!OM.flag('sold')) opts.push({ id: 'sell', text: 'Не нужна энциклопедия?' });
      opts.forEach((o) => (o.seen = seen[o.id]));
      opts.push({ id: 'bye', text: 'Всего доброго.' });
      const c = await OM.choose(opts);
      seen[c] = 1;
      if (c === 'bye') { await ssay('Бывай.'); return; }
      if (c === 'lib') await ssay('В ДК, сбоку дверь. Вера там. Строгая, но книжки даёт.');
      if (c === 'belt') {
        await ssay('Жучок. Фонарь такой. Жмёшь — жужжит, светит. Батареек не надо — их у нас всё одно не продают.');
        OM.flag('sawZhuchok', 1);
      }
      if (c === 'pok') {
        await ssay('Мне двенадцать было. Нас на грузовиках вывозили. Бабка крестилась всю дорогу.');
        await ssay('Церковь взорвать не успели — вода быстрее пришла.');
        await OM.wait(500);
        await ssay('Не все уехали. Кто-то упёрся. Говорят, они там и стоят. В воде. Ждут, кто за ними придёт.');
        OM.flag('knowStay', 1);
      }
      if (c === 'buy') await ssay('Не продаётся. Меняюсь. На что-нибудь стоящее.');
      if (c === 'sell') { await s2.sell(true); if (OM.flag('sold')) return; }
    }
  };

  s2.sell = async (inDialog) => {
    if (OM.flag('sold')) return ssay('Одной хватит. Я её ещё читать не начал.');
    await say('Энциклопедия «Всё обо всём». Двенадцать томов на любой вкус. Какой вам?');
    const seen = (G.flags.sellSeen = G.flags.sellSeen || {});
    for (;;) {
      const opts = [
        { id: 'M', text: 'Том «М»: медицина. Суставы, давление…' },
        { id: 'I', text: 'Том «И»: история родного края.' },
        { id: 'Zh', text: 'Том «Ж»: животные всего мира.' },
        { id: 'R', text: 'Том «Р»: рыбы, реки, рыболовство.' },
      ];
      opts.forEach((o) => (o.seen = seen[o.id]));
      opts.push({ id: 'no', text: 'Ладно, в другой раз.' });
      const c = await OM.choose(opts);
      seen[c] = 1;
      if (c === 'no') return;
      if (c === 'M') await ssay('У меня от всех болезней одно лекарство. И оно не в книжке.');
      if (c === 'I') await ssay('Историю я сам видел. Своими глазами. Не продаётся и не покупается.');
      if (c === 'Zh') await ssay('Мне кота хватает. Он сам себе энциклопедия.');
      if (c === 'R') {
        await ssay('…Рыбы, говоришь. А про леща там есть? Как он в октябре клюёт?');
        await say('Страница двести двенадцать. С иллюстрацией.');
        await OM.wait(500);
        await ssay('Денег нет. Меняюсь. Бери жучок — я в темноте и так всё вижу. Шестьдесят лет на воде.');
        OM.flag('sold', 1);
        OM.give('zhuchok');
        OM.save();
        await say('Один том ушёл. План на квартал выполнен на одну двенадцатую.');
        return;
      }
    }
  };

  // ---------- Вера ----------
  s2.talkVera = async () => {
    if (!OM.flag('talkedVera')) {
      OM.flag('talkedVera', 1);
      await vsay('Здравствуйте. Записываться будете? Паспорт и прописка.');
      await say('Я проездом. Мне нужно про Покровское. Про переселение.');
      await OM.wait(700);
      await vsay('Вы второй за месяц. Первым был рыболов из Сосновки. Его потом не нашли.');
      await vsay('Подшивки за пятьдесят пятый — в архиве, в подвале. После трёх свет отключат — всё равно работать нельзя.');
      await vsay('Спущусь с керосинкой, поищу. Только вниз — со мной. Это мой подвал.');
      OM.save();
      return;
    }
    await vsay('Слушаю.');
    const seen = (G.flags.veraSeen = G.flags.veraSeen || {});
    for (;;) {
      const opts = [{ id: 'fish', text: 'Что за рыболов из Сосновки?' }];
      if (OM.flag('visionCh2') && !OM.flag('lightSafe')) opts.push({ id: 'kero', text: 'Не берите вниз керосинку.' });
      if (OM.flag('visionCh2') && !OM.flag('doorWedged')) opts.push({ id: 'door', text: 'Дверь в архив — она захлопывается?' });
      opts.forEach((o) => (o.seen = seen[o.id]));
      opts.push({ id: 'bye', text: 'Не буду мешать.' });
      const c = await OM.choose(opts);
      seen[c] = 1;
      if (c === 'bye') return;
      if (c === 'fish') {
        await vsay('Сидел здесь неделю. Всё про церковь читал. Потом сказал, что слышит колокол. С воды.');
        await vsay('А колокол утонул вместе с церковью. В пятьдесят пятом.');
      }
      if (c === 'kero') {
        await vsay('А с чем мне идти? С лучиной? Фонаря у меня нет, а в подвале темно, как в… в подвале.');
        await say('Будет вам фонарь.');
      }
      if (c === 'door') {
        await vsay('Захлопывается. От сквозняка. Изнутри её не открыть — замок старый. Я её всегда подпираю.');
        await vsay('Хотя… чем я её подпирала? Не помню.');
      }
    }
  };

  s2.giveLight = async () => {
    if (!OM.flag('visionCh2')) return say('Пусть пока будет у меня.');
    if (OM.flag('lightSafe')) return;
    await say('Возьмите. Вместо керосинки. Пожалуйста.');
    await vsay('Жучок? Сто лет таких не видела.');
    await OM.wait(400);
    await vsay('Вы странный человек, Лев Аркадьевич. Ладно. Убираю лампу.');
    OM.take('zhuchok');
    OM.flag('lightSafe', 1);
    OM.save();
    await s2.checkReady();
  };

  s2.checkReady = async () => {
    const f = G.flags;
    if (f.powerCut) return;
    if (f.lightSafe && !f.doorWedged) return say('Огня не будет. Осталась дверь.');
    if (!f.lightSafe && f.doorWedged) return say('Дверь не захлопнется. Осталась керосинка.');
    if (!(f.lightSafe && f.doorWedged)) return;
    // три часа: свет гаснет
    OM.letterbox(true);
    await OM.wait(800);
    S.powerDown();
    OM.flag('powerCut', 1);
    S.amb({ rain: 0.25, wind: 0.15, indoor: true, hum: 0 });
    await OM.wait(1600);
    await vsay('Ну вот и три. Пойдёмте вниз, раз вам так надо.');
    await vsay('Держите ваш жучок — светить будете вы.');
    OM.letterbox(false);
    OM.save();
    await OM.go('archive', 'stairs');
  };

  // ---------- Видение из обрывков ----------
  function frameCanvas(draw) {
    const c = OM.makeCanvas(640, 360);
    const g = c.getContext('2d');
    g.scale(0.5, 0.5);
    draw(g);
    // красная гамма видения
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.globalCompositeOperation = 'multiply';
    g.fillStyle = '#ff7a60';
    g.fillRect(0, 0, 640, 360);
    g.globalCompositeOperation = 'screen';
    g.fillStyle = 'rgba(90,14,4,.35)';
    g.fillRect(0, 0, 640, 360);
    g.globalCompositeOperation = 'source-over';
    g.fillStyle = P.rgrad(g, 320, 180, 120, 400, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(10,0,0,.5)']]);
    g.fillRect(0, 0, 640, 360);
    const r = rng(draw.length * 7 + 3);
    for (let i = 0; i < 6; i++) { g.fillStyle = `rgba(0,0,0,${0.2 + r() * 0.4})`; g.fillRect(0, r() * 360, 640, 1 + r() * 3); }
    return c;
  }
  const light = { amb: 1, tint: '#a04a3a' };
  const FRAMES = [
    // 1. Вера спускается по лестнице с керосинкой
    (g) => {
      P.fillV(g, 0, 0, W, H, [[0, '#4a2a22'], [1, '#1a0a08']]);
      g.fillStyle = '#8a5a46';
      for (let i = 0; i < 9; i++) g.fillRect(200 + i * 70, 180 + i * 60, 420, 16);
      g.fillStyle = '#2a1410';
      for (let i = 0; i < 9; i++) g.fillRect(200 + i * 70, 196 + i * 60, 420, 44);
      A.vera(g, { x: 600, y: 600, s: 2.7, face: 1, move: 1, phase: 1.2, light, hold: 'light' }, 1);
      P.glow(g, 720, 380, 320, '#ffb050', 0.6);
    },
    // 2. Дверь захлопывается
    (g) => {
      P.fillV(g, 0, 0, W, H, [[0, '#3a1e18'], [1, '#140604']]);
      g.save();
      g.translate(420, 80);
      g.transform(0.55, 0.12, 0, 1, 0, 0);
      P.fillV(g, 0, 0, 380, 620, [[0, '#a07050'], [1, '#5a3a28']]);
      g.strokeStyle = 'rgba(0,0,0,.6)';
      g.lineWidth = 8;
      g.strokeRect(40, 40, 300, 240);
      g.strokeRect(40, 320, 300, 260);
      g.restore();
      g.strokeStyle = 'rgba(255,200,170,.35)';
      g.lineWidth = 3;
      for (let i = 0; i < 7; i++) { g.beginPath(); g.moveTo(860 + i * 14, 120 + i * 70); g.lineTo(1000 + i * 20, 110 + i * 70); g.stroke(); }
      P.text(g, 'БАМ', 1000, 600, { font: '700 64px "PT Serif",serif', color: 'rgba(255,200,170,.35)' });
    },
    // 3. Лампа падает на подшивки
    (g) => {
      P.fillV(g, 0, 0, W, H, [[0, '#2a1410'], [1, '#4a2a20']]);
      for (let i = 0; i < 10; i++) {
        g.save();
        g.translate(200 + i * 95, 520 + (i % 3) * 30);
        g.rotate((i % 4 - 1.5) * 0.3);
        g.fillStyle = '#c8b898';
        g.fillRect(-60, -30, 120, 60);
        g.restore();
      }
      g.save();
      g.translate(640, 470);
      g.rotate(1.2);
      P.fillV(g, -40, -30, 80, 60, [[0, '#b89a50'], [1, '#6a5a2a']]);
      g.fillStyle = 'rgba(220,230,230,.5)';
      g.fillRect(-20, -100, 40, 70);
      g.restore();
      P.glow(g, 600, 500, 240, '#ff8a30', 0.8);
      for (let i = 0; i < 8; i++) {
        g.fillStyle = 'rgba(255,190,90,.8)';
        g.beginPath();
        g.ellipse(520 + i * 25, 500 - (i % 3) * 18, 8, 26 + (i % 2) * 14, 0, 0, Math.PI * 2);
        g.fill();
      }
    },
    // 4. Огонь и фигура
    (g) => {
      g.fillStyle = '#200804';
      g.fillRect(0, 0, W, H);
      for (let k = 0; k < 4; k++) {
        g.fillStyle = '#100402';
        g.fillRect(80 + k * 300, 100, 30, 620);
        g.fillRect(80 + k * 300, 200, 260, 14);
        g.fillRect(80 + k * 300, 380, 260, 14);
      }
      for (let i = 0; i < 30; i++) {
        g.fillStyle = `rgba(255,${120 + (i * 37) % 100},40,.55)`;
        g.beginPath();
        g.ellipse((i * 97) % W, 600 - (i * 53) % 280, 18, 60 + (i % 5) * 20, 0, 0, Math.PI * 2);
        g.fill();
      }
      A.tall(g, { x: 640, y: 760, s: 1.6, face: -1, alpha: 1, body: '#050000', reach: 0.3 }, 2);
    },
  ];

  function puzzle() {
    return new Promise((resolve) => {
      const root = document.getElementById('frags');
      const cards = root.querySelector('.cards');
      const slots = root.querySelector('.slots');
      const hint = root.querySelector('.hint');
      const canv = FRAMES.map((f) => frameCanvas(f));
      const order = [2, 0, 3, 1];
      let placed = [];
      cards.innerHTML = '';
      slots.innerHTML = '';
      hint.textContent = 'Нажимайте на обрывки в том порядке, в каком всё случится.';
      const cardEls = order.map((id) => {
        const el = document.createElement('button');
        el.className = 'frag';
        el.appendChild(canv[id]);
        el.onpointerdown = (e) => {
          e.stopPropagation();
          if (el.classList.contains('used')) return;
          S.click();
          el.classList.add('used');
          placed.push(id);
          slotEls[placed.length - 1].appendChild(canv[id].cloneNode ? copyCanvas(canv[id]) : canv[id]);
          slotEls[placed.length - 1].classList.add('full');
          if (placed.length === 4) check();
        };
        cards.appendChild(el);
        return el;
      });
      const slotEls = [0, 1, 2, 3].map((i) => {
        const el = document.createElement('div');
        el.className = 'pslot';
        el.dataset.n = i + 1;
        slots.appendChild(el);
        return el;
      });
      function copyCanvas(src) {
        const c = document.createElement('canvas');
        c.width = src.width; c.height = src.height;
        c.getContext('2d').drawImage(src, 0, 0);
        return c;
      }
      function reset() {
        placed = [];
        cardEls.forEach((e) => e.classList.remove('used'));
        slotEls.forEach((e) => { e.innerHTML = ''; e.classList.remove('full'); });
      }
      function check() {
        if (placed.join() === '0,1,2,3') {
          hint.textContent = 'Вот как это будет.';
          S.hit();
          setTimeout(() => { root.classList.remove('on'); resolve(); }, 900);
        } else {
          hint.textContent = 'Нет… не складывается. Ещё раз.';
          root.classList.add('shake');
          S.staticNoise(0.4, 0.08);
          setTimeout(() => { root.classList.remove('shake'); reset(); }, 900);
        }
      }
      root.onpointerdown = (e) => e.stopPropagation();
      root.classList.add('on');
    });
  }

  s2.keroVision = async () => {
    if (!OM.flag('talkedVera')) return say('Керосинка. Сейчас таких уже не делают. Хотя здесь, кажется, вообще ничего не делают.');
    if (OM.flag('visionCh2')) return say('Больше не трогаю. Хватит одного раза.');
    await say('Стекло тёплое… нет. Горячее.');
    S.hit();
    OM.flash(1);
    OM.letterbox(true);
    S.whisper(2.5, 0.12);
    S.tension(0.6);
    await puzzle();
    // время
    OM.vision((ctx) => {
      ctx.fillStyle = '#060000';
      ctx.fillRect(0, 0, W, H);
      P.text(ctx, '15:40', W / 2, H / 2, { font: '500 150px "Cormorant Garamond",serif', color: '#e8b0a0', alpha: 0.85 + Math.random() * 0.15, ls: 18 });
    });
    S.hit();
    await OM.wait(1800);
    OM.endVision();
    S.tension(0);
    OM.flash(0.7);
    OM.letterbox(false);
    OM.flag('visionCh2', 1);
    OM.save();
    await say('Вера спустится в подвал с керосинкой. Дверь захлопнется. Лампа упадёт на подшивки.');
    await say('И он будет стоять там, в огне. Смотреть.');
    await say('Без двадцати четыре. А сейчас без десяти три.');
    OM.toast('Цель: не дать лампе и двери сработать так, как в видении.');
  };

  // ---------- Архив: подшивка 1955 и Тихий в луче ----------
  s2.find1955 = async () => {
    const ar = OM.archive;
    if (OM.flag('found1955')) return say('Мы уже нашли то, что искали. Или оно нашло нас.');
    OM.letterbox(true);
    await OM.moveTo(ar.vera, 700, 640);
    ar.vera.face = 1;
    ar.vera.hold = 'book';
    await vsay('Вот. «Омутская правда», октябрь пятьдесят пятого.');
    await vsay('«Переселение жителей села Покровское успешно завершено»… А вот приложение. Список тех, кто отказался выезжать.');
    OM.flag('found1955', 1);
    OM.letterbox(false);
    // он появляется за её спиной
    for (;;) {
      const ok = await s2.holdLight();
      if (ok) break;
    }
    await vsay('Что… что это было?');
    await say('Не знаю. Читайте. Пожалуйста.');
    await vsay('«Отказались переселяться: Ветрова Мария Никитична. Кузьмин Пётр Ильич…»');
    await OM.wait(500);
    await vsay('«…Гордеева Анна Петровна, с сыном Львом, тысяча девятьсот пятьдесят пятого года рождения».');
    await OM.wait(1200);
    await say('Гордеева.');
    await say('Это моя мать. А Лев пятьдесят пятого года рождения — это я.');
    await say('Мне всю жизнь говорили, что я родился в Калуге.');
    await s2.end();
  };

  s2.holdLight = async () => {
    const ar = OM.archive, st = ar.st, tall = ar.tall;
    st.tallOn = true; st.tallHit = 0; st.tallA = 0; tall.reach = 0; tall.x = 930;
    S.whisper(2, 0.15);
    S.stinger(0.9);
    const t0 = performance.now();
    while (performance.now() - t0 < 1400) { st.tallA = (performance.now() - t0) / 1400; await OM.wait(16); }
    st.tallA = 1;
    OM.toast('Держите луч на нём!');
    say('Вера. Не оборачивайтесь.');
    const LIMIT = 9000;
    const t1 = performance.now();
    while (performance.now() - t1 < LIMIT) {
      const k = (performance.now() - t1) / LIMIT;
      tall.reach = Math.min(1, k * 1.4) * (1 - st.tallHit);
      S.tension(0.4 + k * 0.6);
      if (st.tallHit >= 1) {
        // свет выжигает его обратно во тьму
        S.tension(0);
        S.stinger(0.5);
        OM.flash(0.6);
        const t2 = performance.now();
        while (performance.now() - t2 < 900) { st.tallA = 1 - (performance.now() - t2) / 900; await OM.wait(16); }
        st.tallA = 0; st.tallOn = false;
        if (G.saying) G.saying.res();
        return true;
      }
      await OM.wait(16);
    }
    // не успел — нить обрывается
    S.tension(0);
    S.hit();
    OM.shake(10);
    if (G.saying) G.saying.res();
    await OM.fadeTo(0.9, 300, '#300000');
    st.tallA = 0; st.tallOn = false;
    await OM.say('narr', 'Нить оборвалась.', { hold: 1.2 });
    await OM.fadeTo(0, 600);
    await say('Нет. Ещё раз. Свет — прямо на него.');
    return false;
  };

  s2.end = async () => {
    OM.store.set('omut-ch2-done', 1);
    await OM.fadeTo(1, 2200);
    S.music('end');
    G.hero.holdLight = false;
    await OM.card('Конец второй главы', 'Нити тянутся к тебе самому…', 4200);
    await OM.card('Продолжение следует', 'Глава третья: «Покровское»', 3200);
    OM.clearSave();
    OM.letterbox(false);
    OM.toTitle();
  };
})();
