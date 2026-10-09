// Сюжет: предметы, заставки, видения, подсказки энциклопедии.
(function () {
  const G = OM.G, S = OM.S, P = OM.P, A = OM.Actors;
  const { W, H, hex, rng, lerp, clamp } = OM;
  const say = (t, o) => OM.say('lev', t, o);
  const story = (OM.story = {});

  // ---------- Предметы ----------
  OM.ITEMS = {
    book: {
      name: 'Энциклопедия «Всё обо всём»',
      icon: 'book',
      look: () => bookHint,
    },
    token: {
      name: 'Жетон',
      icon: 'token',
      look: 'Латунный жетон для таксофона. С бороздкой. Холодный, как будто полежал не в луже, а в реке.',
    },
    key7: {
      name: 'Ключ от номера 7',
      icon: 'key7',
      look: 'Ключ с деревянной грушей. На груше цифра «7» и следы зубов. Детских, надеюсь.',
    },
    umbrella: {
      name: 'Зонт-трость',
      icon: 'umbrella',
      look: 'Чёрный зонт-трость. Ручка крюком. Две спицы погнуты, но в остальном — отличный зонт. Был.',
    },
    boatkey: {
      name: 'Ключ от лодочной станции',
      icon: 'boatkey',
      look: 'Большой железный ключ. На бирке выжжено: «Лод. ст.»',
    },
    bell: {
      name: 'Звонок со стойки',
      icon: 'bell',
      look: 'Медный звонок. Нажмёшь — «дзынь» на весь этаж. Тот самый звук, которым будят Митю.',
    },
  };

  // Энциклопедия — встроенная система подсказок.
  async function bookHint() {
    const f = G.flags;
    await say('Так, что тут у нас…');
    if (!f.checkedIn) {
      if (G.sid === 'busstop' && !f.called && OM.has('token') && f.knowNumber)
        return OM.say('book', '«Таксофон — телефонный аппарат общего пользования. Работает на жетонах». Номер гостиницы есть, жетон есть. Можно позвонить.');
      return OM.say('book', '«Гостиница — здание для временного проживания приезжих». Спасибо. Где-то здесь должна быть гостиница «Заря».');
    }
    if (!f.vision) return OM.say('book', '«Сон — естественное состояние покоя организма». Номер семь, второй этаж. Кровать. Немедленно.');
    if (!OM.has('boatkey') && !f.gateOpen)
      return OM.talk([
        ['book', '«Лунатизм — состояние, при котором спящий ходит, не пробуждаясь. Будить его следует мягко — знакомым звуком»'],
        ['lev', 'Пристань на ночь наверняка запирают. Ключи в гостинице висят на доске за стойкой. Только через стойку не дотянуться.'],
      ]);
    if (!OM.has('bell'))
      return OM.talk([
        ['book', '«…будить следует мягко — знакомым звуком»'],
        ['lev', 'Знакомым звуком. Чем его будят дома? Зинаида Павловна что-то говорила… Звонок у неё на стойке.'],
      ]);
    return say('Хватит читать. Пристань. Сейчас же.');
  }

  // ---------- Пролог: автобус уходит ----------
  story.intro = async (st) => {
    const h = G.hero;
    OM.letterbox(true);
    G.fx.letter = 1;
    const bus = OM.actor({ id: 'bus', x: 600, y: 712, s: 1.55, face: 1, autoScale: false, draw: A.bus, lights: true });
    bus.update = (a, dt) => { if (a.target) a.spd = Math.min(a.spd + dt * 230, 1100); };
    G.actors.push(bus);
    h.x = 640; h.y = 622; h.face = 1;
    S.bus(true);
    await OM.fadeTo(0, 2600);
    await OM.say('driver', 'Конечная. Тихий Омут.');
    await say('Как — конечная? У вас в расписании дальше Сосновка.');
    await OM.say('driver', 'Дальше не поеду. Ночь уже. Город — вон, за поворотом. Дойдёшь.');
    await say('А если не дойду?');
    await OM.say('driver', 'Тогда тем более не моя забота.');
    S.door();
    await OM.wait(500);
    S.rev();
    await OM.wait(500);
    await OM.moveTo(bus, -700, 712, { free: true, speed: 40 });
    S.bus(false);
    G.actors = G.actors.filter((a) => a !== bus);
    await OM.wait(700);
    await say('…Ну и сервис.');
    h.face = 1;
    await OM.wait(1200);
    OM.flag('tallBus', 'show');
    OM.bolt(true);
    S.stinger(0.9);
    await OM.wait(150);
    OM.bolt(true);
    OM.flag('sawTall', 1);
    await OM.wait(1100);
    OM.flag('tallBus', 'gone');
    await say('Что за…');
    await say('Нет. Показалось. Двадцать часов в дороге — и не такое покажется.');
    OM.letterbox(false);
    await OM.wait(400);
    OM.toast(G.touch ? 'Касание — действие. Долгое касание — осмотреть.' : 'ЛКМ — действие. ПКМ — осмотреть. Вещи — внизу экрана.');
  };

  // ---------- Звонок из таксофона ----------
  story.phoneCall = async () => {
    const h = G.hero;
    h.pose = 'phone';
    OM.take('token');
    OM.flag('called', 1);
    S.phone('dial');
    await OM.wait(900);
    S.phone(null);
    for (let i = 0; i < 4; i++) { S.click(); await OM.wait(160); }
    S.phone('ring');
    await OM.wait(3800);
    S.phone(null);
    S.staticNoise(0.5, 0.06);
    await OM.say('phone', '«Заря», слушаю.');
    await say('Добрый вечер. У вас есть свободные номера?');
    await OM.say('phone', 'Номера есть. Номеров у нас всегда много.');
    await say('Прекрасно. Я с автобуса, буду минут через десять.');
    await OM.say('phone', 'Через десять… Ну, приходите. Только к воде не сворачивайте. И по сторонам не глядите.');
    await say('Простите, что?');
    S.staticNoise(3, 0.12);
    S.whisper(3, 0.16);
    S.tension(0.5);
    await OM.say('child', '…дяденька… они стоят у воды… не смотрите им в лицо…');
    S.tension(0);
    await say('Алло? Алло!');
    h.pose = null;
    await OM.wait(300);
    await say('Тишина. Даже гудков нет.');
  };

  // ---------- Видение: пристань, 00:13 ----------
  function drawPierVision(ctx, t, v) {
    const pier = G.scenes.pier;
    ctx.drawImage(OM.cache('pier:bg', (g) => pier.paint(g)), 0, 0, W, H);
    A.tall(ctx, { x: v.tx, y: 820, s: 1.12, face: -1, reach: v.reach, alpha: 1, jitter: 3, body: '#020202' }, t);
    ctx.drawImage(OM.cache('pier:fg', (g) => pier.front(g)), 0, 0, W, H);
    // красная гамма
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = '#ff2e1f';
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = 'rgba(70,0,0,.35)';
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
    // мальчик светится — единственное светлое пятно
    if (v.mVis) {
      ctx.save();
      ctx.globalAlpha = v.mA;
      A.mitya(ctx, { x: v.mx, y: v.my, s: 1.0, face: 1, move: v.mMove, phase: v.mph, sleep: true, body: '#f3e9de', shade: '#9a7a70' }, t);
      ctx.restore();
      P.glow(ctx, v.mx, v.my - 60, 90, '#ffdcc8', 0.12 * v.mA);
    }
    // брызги
    v.drops.forEach((d) => {
      ctx.fillStyle = `rgba(255,220,210,${Math.max(0, 1 - d.t)})`;
      ctx.fillRect(d.x, d.y, 2.5, 2.5);
    });
    // разрывы картинки
    const r = Math.random;
    for (let i = 0; i < 5; i++) {
      if (r() < 0.5) continue;
      ctx.fillStyle = `rgba(0,0,0,${0.3 + r() * 0.5})`;
      ctx.fillRect(0, r() * H, W, 1 + r() * 4);
    }
    const pulse = 0.5 + 0.5 * Math.sin(t * 7);
    ctx.fillStyle = P.rgrad(ctx, W / 2, H / 2, H * 0.25, W * 0.7, [[0, 'rgba(0,0,0,0)'], [1, `rgba(20,0,0,${0.6 + pulse * 0.25})`]]);
    ctx.fillRect(0, 0, W, H);
    if (v.text) P.text(ctx, v.text, W / 2, H / 2, { font: '500 120px "Cormorant Garamond",serif', color: '#ffd7c8', alpha: v.textA, ls: 12 });
  }

  story.vision1 = async () => {
    const v = { tx: 1190, reach: 0, mVis: true, mA: 0, mx: 520, my: 588, mMove: 1, mph: 0, drops: [], text: '', textA: 0 };
    let anim = true;
    const tick = () => {
      if (!anim) return;
      v.mph += 0.05;
      v.drops.forEach((d) => { d.x += d.vx; d.y += d.vy; d.vy += 0.35; d.t += 0.02; });
      requestAnimationFrame(tick);
    };
    OM.letterbox(true);
    await OM.fadeTo(1, 1600);
    S.amb({ drone: 1, water: 0.6 });
    S.tension(0.7);
    await OM.wait(900);
    S.hit();
    OM.vision((ctx, t) => drawPierVision(ctx, t, v));
    tick();
    OM.flash(1);
    OM.shake(10);
    await OM.fadeTo(0, 120, '#fff');
    // мальчик идёт к краю
    const walk = async (to, ms) => {
      const from = v.mx, t0 = performance.now();
      while (performance.now() - t0 < ms) {
        const k = (performance.now() - t0) / ms;
        v.mx = lerp(from, to, k);
        v.mA = Math.min(1, v.mA + 0.03);
        v.reach = Math.min(1, v.reach + 0.004);
        await OM.wait(16);
      }
    };
    S.heartbeat();
    const hb = setInterval(() => S.heartbeat(), 1100);
    S.whisper(5, 0.1);
    await walk(1060, 4800);
    v.mMove = 0;
    await OM.wait(700);
    v.reach = 1;
    S.whisper(1.6, 0.2);
    await OM.wait(900);
    // шаг с пристани
    v.mMove = 1;
    await walk(1110, 500);
    const t0 = performance.now();
    while (performance.now() - t0 < 420) {
      v.my += 6;
      v.mA -= 0.035;
      await OM.wait(16);
    }
    v.mVis = false;
    S.splash();
    for (let i = 0; i < 40; i++) v.drops.push({ x: v.mx + (Math.random() - 0.5) * 30, y: 612, vx: (Math.random() - 0.5) * 4, vy: -3 - Math.random() * 6, t: 0 });
    OM.shake(8);
    await OM.wait(900);
    clearInterval(hb);
    await OM.fadeTo(1, 200, '#000');
    anim = false;
    // время
    OM.vision((ctx, t) => {
      ctx.fillStyle = '#050000';
      ctx.fillRect(0, 0, W, H);
      P.text(ctx, '00:13', W / 2, H / 2, { font: '500 150px "Cormorant Garamond",serif', color: '#e8b0a0', alpha: 0.85 + Math.random() * 0.15, ls: 18 });
    });
    S.hit();
    await OM.fadeTo(0, 200);
    await OM.wait(1800);
    await OM.fadeTo(1, 300);
    OM.endVision();
    S.tension(0);
  };

  // ---------- Видение: фотография Покровского ----------
  story.photoVision = async () => {
    const r = rng(4);
    const figs = Array.from({ length: 14 }, () => ({ x: 120 + r() * 1040, s: 0.35 + r() * 0.35, ph: r() * 6 }));
    figs.sort((a, b) => a.s - b.s);
    const bubbles = Array.from({ length: 60 }, () => ({ x: r() * W, y: r() * H, v: 20 + r() * 60, s: 1 + r() * 3 }));
    let last = performance.now();
    OM.vision((ctx, t) => {
      const now = performance.now(), dt = (now - last) / 1000;
      last = now;
      P.fillV(ctx, 0, 0, W, H, [[0, '#2c5452'], [0.4, '#0e2427'], [1, '#030a0c']]);
      // лучи сверху
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 6; i++) {
        const x = 200 + i * 190 + Math.sin(t * 0.5 + i) * 30;
        ctx.fillStyle = P.vgrad(ctx, 0, 600, [[0, 'rgba(150,210,190,.10)'], [1, 'rgba(150,210,190,0)']]);
        ctx.beginPath();
        ctx.moveTo(x - 20, 0);
        ctx.lineTo(x + 30, 0);
        ctx.lineTo(x + 140, 600);
        ctx.lineTo(x + 40, 600);
        ctx.fill();
      }
      ctx.restore();
      // церковь
      const cx = 640, gy = 600;
      ctx.fillStyle = '#081517';
      ctx.fillRect(cx - 110, gy - 190, 220, 190);
      ctx.fillRect(cx - 40, gy - 300, 80, 110);
      ctx.beginPath();
      ctx.moveTo(cx - 48, gy - 300);
      ctx.quadraticCurveTo(cx - 52, gy - 350, cx, gy - 380);
      ctx.quadraticCurveTo(cx + 52, gy - 350, cx + 48, gy - 300);
      ctx.fill();
      ctx.fillRect(cx - 2, gy - 420, 4, 42);
      ctx.save();
      ctx.translate(cx, gy - 408);
      ctx.rotate(0.25);
      ctx.fillRect(-14, -2, 28, 4);
      ctx.restore();
      ctx.fillStyle = 'rgba(160,220,200,.12)';
      ctx.fillRect(cx - 12, gy - 260, 24, 40);
      // дно
      P.fillV(ctx, 0, gy - 10, W, H - gy + 10, [[0, '#0b1a1b'], [1, '#020607']]);
      // «прихожане»
      figs.forEach((f) => {
        A.tall(ctx, { x: f.x, y: gy + 40 + f.s * 60, s: f.s, face: f.x < cx ? 1 : -1, alpha: 0.9, jitter: 1.5, seed: f.ph, body: '#020708' }, t);
      });
      bubbles.forEach((b) => {
        b.y -= b.v * dt;
        if (b.y < -10) b.y = H + 10;
        ctx.strokeStyle = 'rgba(190,230,220,.35)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(b.x + Math.sin(t * 2 + b.v) * 4, b.y, b.s, 0, Math.PI * 2);
        ctx.stroke();
      });
      P.text(ctx, 'ПОКРОВСКОЕ', W / 2, 110, { font: '500 40px "Cormorant Garamond",serif', color: '#a8d0c4', alpha: 0.35 + Math.sin(t * 3) * 0.1, ls: 16 });
    });
  };
})();
