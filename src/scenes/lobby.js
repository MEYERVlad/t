// Сцена 3. Холл гостиницы «Заря». Стойка, Зинаида Павловна, доска с ключами.
(function () {
  const P = OM.P, S = OM.S, G = OM.G, A = OM.Actors;
  const { hex, rng, W } = OM;
  const say = (t) => OM.say('lev', t);
  const zsay = (t) => OM.say('zina', t);

  const LAMP = { x: 456, y: 402 };
  const CH = { x: 640, y: 74 };
  const st = { radio: 0, tick: 0 };

  function paint(g) {
    // потолок и карниз
    P.fillV(g, 0, 0, W, 60, [[0, '#0b0907'], [1, '#17120e']]);
    P.fillV(g, 0, 50, W, 14, [[0, '#4a3a2a'], [1, '#1d1610']]);
    // обои с ромбическим узором
    P.fillV(g, 0, 64, W, 390, [[0, '#262c21'], [0.6, '#2d3427'], [1, '#20261c']]);
    g.save();
    g.beginPath();
    g.rect(0, 64, W, 390);
    g.clip();
    g.strokeStyle = 'rgba(170,160,110,.07)';
    g.lineWidth = 1.2;
    for (let x = -400; x < W + 400; x += 46) {
      g.beginPath();
      g.moveTo(x, 64);
      g.lineTo(x + 390, 454);
      g.stroke();
      g.beginPath();
      g.moveTo(x, 454);
      g.lineTo(x + 390, 64);
      g.stroke();
    }
    g.fillStyle = 'rgba(190,170,110,.08)';
    for (let y = 87; y < 454; y += 46) {
      for (let x = (y / 46) % 2 ? 0 : 23; x < W; x += 46) {
        g.beginPath();
        g.moveTo(x, y - 7);
        g.quadraticCurveTo(x + 6, y, x, y + 7);
        g.quadraticCurveTo(x - 6, y, x, y - 7);
        g.fill();
      }
    }
    g.restore();
    P.paper(g, 41, 0.12, 0, 64, W, 390);
    // деревянные панели
    P.fillV(g, 0, 448, W, 156, [[0, '#2e1e13'], [1, '#170e08']]);
    g.fillStyle = '#3e2b1b';
    g.fillRect(0, 446, W, 6);
    for (let x = 20; x < W; x += 120) {
      g.strokeStyle = 'rgba(0,0,0,.45)';
      g.lineWidth = 2;
      g.strokeRect(x, 470, 96, 110);
      g.strokeStyle = 'rgba(255,200,140,.05)';
      g.strokeRect(x + 2, 472, 92, 106);
    }
    // пол
    P.fillV(g, 0, 600, W, 120, [[0, '#24170e'], [1, '#0e0905']]);
    for (let y = 606, k = 0; y < 720; y += 8 + k * 2.5, k++) {
      g.fillStyle = 'rgba(0,0,0,.35)';
      g.fillRect(0, y, W, 1.2);
    }
    // дорожка
    P.fillV(g, 0, 644, W, 54, [[0, '#4a1612'], [1, '#2a0b09']]);
    g.strokeStyle = 'rgba(210,170,90,.25)';
    g.setLineDash([10, 6]);
    g.beginPath();
    g.moveTo(0, 650);
    g.lineTo(W, 650);
    g.moveTo(0, 692);
    g.lineTo(W, 692);
    g.stroke();
    g.setLineDash([]);
    P.speckle(g, 42, 0, 644, W, 54, 1400, '#000', 0.4);

    // ---- входная дверь ----
    P.fillV(g, 34, 280, 168, 324, [[0, '#24170e'], [1, '#140c07']]);
    [44, 122].forEach((dx) => {
      P.fillV(g, dx, 300, 70, 140, [[0, '#0f1a24'], [1, '#1b2c38']]);
      const r = rng(dx);
      g.strokeStyle = 'rgba(150,180,200,.18)';
      g.lineWidth = 1;
      for (let i = 0; i < 18; i++) {
        const x = dx + r() * 70, y = 300 + r() * 120;
        g.beginPath();
        g.moveTo(x, y);
        g.lineTo(x + 1, y + 6 + r() * 14);
        g.stroke();
      }
      g.fillStyle = '#1a110a';
      g.fillRect(dx + 33, 300, 4, 140);
      g.strokeStyle = 'rgba(0,0,0,.5)';
      g.lineWidth = 2;
      g.strokeRect(dx + 6, 460, 58, 120);
    });
    g.fillStyle = '#b08a4a';
    g.fillRect(110, 450, 4, 22);
    g.fillRect(126, 450, 4, 22);
    g.fillStyle = '#0c0805';
    g.fillRect(28, 274, 180, 10);

    // ---- фотография Покровского ----
    g.fillStyle = '#1a110a';
    g.fillRect(240, 180, 120, 104);
    P.fillV(g, 250, 190, 100, 84, [[0, '#a89070'], [1, '#6a5640']]);
    g.fillStyle = '#4a3a28';
    g.beginPath();
    g.moveTo(250, 252);
    g.quadraticCurveTo(300, 222, 350, 248);
    g.lineTo(350, 274);
    g.lineTo(250, 274);
    g.fill();
    g.fillStyle = '#2a2016';
    g.fillRect(292, 220, 14, 20);
    g.beginPath();
    g.arc(299, 219, 7, Math.PI, 0);
    g.fill();
    g.fillRect(298, 204, 2, 10);
    for (let i = 0; i < 6; i++) g.fillRect(258 + i * 15, 248 + (i % 2) * 3, 9, 7);
    for (let i = 0; i < 9; i++) {
      g.fillStyle = '#1e1610';
      g.fillRect(262 + i * 9, 262, 3, 9);
    }
    P.text(g, 'Покровское, 1954', 300, 293, { font: 'italic 9px "PT Serif",serif', color: 'rgba(200,180,140,.5)' });

    // ---- доска с ключами ----
    P.fillV(g, 648, 226, 148, 118, [[0, '#4a301c'], [1, '#2a1a0e']]);
    g.strokeStyle = '#1a0f07';
    g.lineWidth = 3;
    g.strokeRect(648, 226, 148, 118);
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 5; col++) {
        const kx = 664 + col * 27, ky = 242 + row * 34;
        g.fillStyle = '#c9a050';
        g.fillRect(kx - 1, ky, 3, 4);
        if (row === 2 && col === 4) continue;
        if (row === 0 && col === 2) continue; // седьмой номер — выдан
        g.strokeStyle = '#a88a4a';
        g.lineWidth = 1.5;
        g.beginPath();
        g.moveTo(kx, ky + 4);
        g.lineTo(kx, ky + 14);
        g.stroke();
        g.fillStyle = '#8a6a44';
        P.rrect(g, kx - 5, ky + 13, 10, 13, 3);
        g.fill();
      }
    }

    // ---- часы ----
    P.fillV(g, 878, 140, 66, 216, [[0, '#3a2414'], [1, '#1c1009']]);
    g.fillStyle = '#100905';
    g.fillRect(872, 134, 78, 12);
    g.fillStyle = '#d9caa4';
    g.beginPath();
    g.arc(911, 188, 24, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = '#2a1a0e';
    g.lineWidth = 2;
    g.stroke();
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      g.fillStyle = '#2a2018';
      g.fillRect(911 + Math.cos(a) * 19 - 1, 188 + Math.sin(a) * 19 - 1, 2, 2);
    }
    g.fillStyle = '#0a0705';
    g.fillRect(890, 226, 42, 110);

    // ---- столик с радиолой ----
    g.fillStyle = '#1a0f08';
    g.fillRect(866, 500, 128, 10);
    g.fillRect(874, 510, 6, 92);
    g.fillRect(980, 510, 6, 92);
    P.fillV(g, 878, 444, 104, 56, [[0, '#4a2e18'], [1, '#2a180c']]);
    g.fillStyle = '#2a2016';
    g.fillRect(886, 452, 50, 40);
    g.strokeStyle = 'rgba(0,0,0,.4)';
    for (let y = 454; y < 492; y += 3) {
      g.beginPath();
      g.moveTo(886, y);
      g.lineTo(936, y);
      g.stroke();
    }
    g.fillStyle = '#c9a050';
    g.beginPath();
    g.arc(958, 482, 5, 0, Math.PI * 2);
    g.arc(972, 482, 4, 0, Math.PI * 2);
    g.fill();

    // ---- фикус ----
    P.fillV(g, 1010, 540, 70, 64, [[0, '#5a3a24'], [1, '#2a1a10']]);
    g.fillStyle = '#3a2416';
    g.fillRect(1004, 536, 82, 8);
    const fr = rng(44);
    g.strokeStyle = '#0e140c';
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(1045, 540);
    g.quadraticCurveTo(1040, 450, 1050, 380);
    g.stroke();
    for (let i = 0; i < 26; i++) {
      const y = 380 + fr() * 160, side = fr() < 0.5 ? -1 : 1;
      const x = 1045 + side * (6 + fr() * 30);
      g.fillStyle = fr() < 0.5 ? '#13200f' : '#1b2a14';
      g.save();
      g.translate(x, y);
      g.rotate(side * (0.5 + fr() * 0.6));
      g.beginPath();
      g.ellipse(0, 0, 22, 9, 0, 0, Math.PI * 2);
      g.fill();
      g.restore();
    }

    // ---- лестница наверх ----
    P.fillV(g, 1090, 64, 190, 540, [[0, '#191d15'], [1, '#14100b']]);
    for (let i = 0; i < 14; i++) {
      const x = 1100 + i * 14, y = 600 - i * 22;
      P.fillV(g, x, y - 22, W - x, 22, [[0, '#3a2818'], [1, '#22160c']]);
      g.fillStyle = 'rgba(255,200,140,.07)';
      g.fillRect(x, y - 22, W - x, 2);
    }
    // перила
    g.strokeStyle = '#120a05';
    g.lineWidth = 7;
    g.beginPath();
    g.moveTo(1090, 470);
    g.lineTo(1290, 160);
    g.stroke();
    g.lineWidth = 3;
    for (let i = 0; i < 12; i++) {
      const x = 1098 + i * 16;
      const ytop = 470 - (x - 1090) * 1.55;
      g.beginPath();
      g.moveTo(x, ytop);
      g.lineTo(x, 600 - (x - 1100) * 1.57 - 4);
      g.stroke();
    }
    g.fillStyle = '#120a05';
    g.fillRect(1084, 466, 14, 140);

    // ---- люстра ----
    g.fillStyle = '#0c0805';
    g.fillRect(CH.x - 1, 0, 2, 60);
    g.beginPath();
    g.moveTo(CH.x - 40, 62);
    g.quadraticCurveTo(CH.x, 92, CH.x + 40, 62);
    g.fill();
  }

  function deskLayer(g) {
    // стойка администратора
    P.fillV(g, 398, 438, 424, 170, [[0, '#3c2614'], [1, '#1c1008']]);
    const r = rng(45);
    for (let x = 402; x < 820; x += 6) {
      g.fillStyle = `rgba(${r() < 0.5 ? '0,0,0' : '255,210,160'},${0.03 + r() * 0.05})`;
      g.fillRect(x, 440, 3, 168);
    }
    g.strokeStyle = 'rgba(0,0,0,.4)';
    g.lineWidth = 2;
    [420, 560, 700].forEach((x) => g.strokeRect(x, 462, 100, 120));
    P.fillV(g, 390, 424, 440, 18, [[0, '#6a4628'], [0.3, '#4a2e18'], [1, '#22140a']]);
    g.fillStyle = 'rgba(255,220,170,.18)';
    g.fillRect(390, 424, 440, 2);
    // тень на полу
    g.fillStyle = 'rgba(0,0,0,.4)';
    g.fillRect(392, 604, 436, 10);
    // книга регистрации
    g.fillStyle = '#3a1a10';
    g.fillRect(536, 418, 80, 8);
    g.fillStyle = '#d8cdb4';
    g.beginPath();
    g.moveTo(540, 419);
    g.lineTo(576, 414);
    g.lineTo(612, 419);
    g.lineTo(612, 422);
    g.lineTo(540, 422);
    g.fill();
    // настольная лампа с зелёным абажуром
    g.fillStyle = '#8a6a34';
    g.fillRect(LAMP.x - 14, 418, 28, 6);
    g.fillRect(LAMP.x - 2, 404, 4, 16);
    g.fillStyle = P.vgrad(g, 384, 404, [[0, '#1f5a3a'], [1, '#0d3a22']]);
    g.beginPath();
    g.moveTo(LAMP.x - 26, 404);
    g.quadraticCurveTo(LAMP.x - 22, 384, LAMP.x, 383);
    g.quadraticCurveTo(LAMP.x + 22, 384, LAMP.x + 26, 404);
    g.closePath();
    g.fill();
    g.fillStyle = 'rgba(160,255,190,.25)';
    g.fillRect(LAMP.x - 22, 392, 44, 2);
  }

  function back(ctx, t) {
    // люстра
    P.glow(ctx, CH.x, CH.y, 340, '#ffcc88', 0.13);
    P.glow(ctx, CH.x, CH.y, 60, '#ffe0b0', 0.35);
    // маятник
    const sw = Math.sin(t * Math.PI) * 0.22;
    ctx.save();
    ctx.translate(911, 232);
    ctx.rotate(sw);
    ctx.fillStyle = '#a88440';
    ctx.fillRect(-1, 0, 2, 74);
    ctx.beginPath();
    ctx.arc(0, 78, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    // стрелки часов
    const time = OM.flag('vision') ? 23 * 60 + 56 : 23 * 60 + 38;
    const hA = ((time / 60) % 12) / 12 * Math.PI * 2 - Math.PI / 2, mA = (time % 60) / 60 * Math.PI * 2 - Math.PI / 2;
    ctx.strokeStyle = '#1a120a';
    ctx.lineCap = 'round';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(911, 188);
    ctx.lineTo(911 + Math.cos(hA) * 11, 188 + Math.sin(hA) * 11);
    ctx.stroke();
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(911, 188);
    ctx.lineTo(911 + Math.cos(mA) * 18, 188 + Math.sin(mA) * 18);
    ctx.stroke();
    // радиола: тёплая шкала
    P.glow(ctx, 958, 462, 30, '#ffb050', 0.35 + Math.sin(t * 13) * 0.04);
    ctx.fillStyle = hex('#ffcf80', 0.7);
    ctx.fillRect(942, 458, 32, 6);
    // ключ от лодочной станции
    if (!OM.flag('boatKeyTaken')) {
      ctx.strokeStyle = '#6d7276';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(772, 318, 5, 0, Math.PI * 2);
      ctx.moveTo(772, 323);
      ctx.lineTo(772, 340);
      ctx.stroke();
      ctx.fillStyle = '#7a5a3a';
      ctx.fillRect(764, 330, 16, 10);
    }
    // свет из двери
    P.glow(ctx, 118, 370, 160, '#6f90b0', 0.06);
  }

  function deskProps(ctx, a, t) {
    // свет лампы на стойке
    P.eglow(ctx, LAMP.x, 424, 170, 26, '#ffd08a', 0.32);
    P.glow(ctx, LAMP.x, 410, 120, '#ffd08a', 0.22);
    P.cone(ctx, LAMP.x, 404, 50, 200, 22, '#ffe2a8', 0.4);
    if (!OM.flag('bellTaken')) {
      ctx.fillStyle = '#2a1d12';
      ctx.fillRect(728, 421, 26, 4);
      ctx.fillStyle = P.rgrad(ctx, 737, 410, 1, 14, [[0, '#f8dc96'], [1, '#8a6224']]);
      ctx.beginPath();
      ctx.moveTo(729, 421);
      ctx.quadraticCurveTo(729, 406, 741, 406);
      ctx.quadraticCurveTo(753, 406, 753, 421);
      ctx.fill();
      ctx.fillStyle = '#c9a050';
      ctx.fillRect(740, 400, 2.5, 6);
    }
    if (OM.flag('zinaSleeps')) {
      ctx.fillStyle = hex('#5a3a18', 0.85);
      ctx.fillRect(676, 404, 10, 18);
      ctx.fillStyle = '#e8e0d0';
      ctx.fillRect(677, 410, 8, 6);
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(677, 400, 8, 5);
    }
    // пылинки в свете лампы
    for (let i = 0; i < 14; i++) {
      const x = LAMP.x - 60 + ((i * 37 + t * 6) % 120), y = 300 + ((i * 53 + t * (4 + (i % 3))) % 120);
      ctx.fillStyle = `rgba(255,220,170,${0.15 + 0.1 * Math.sin(t * 2 + i)})`;
      ctx.fillRect(x, y, 1.4, 1.4);
    }
  }

  const zina = OM.actor({ id: 'zina', x: 612, y: 452, s: 1.15, autoScale: false, draw: (c, a, t) => { a.asleep = !!OM.flag('zinaSleeps'); A.zina(c, a, t); } });
  const props = OM.actor({ id: 'props', x: 0, y: 606, autoScale: false, draw: deskProps });

  // ---------- Разговор с Зинаидой ----------
  async function talkZina(fromBell) {
    if (OM.flag('zinaSleeps')) {
      await say('Зинаида Павловна! Проснитесь!');
      await zsay('М-м… Митенька… спи, спи…');
      await say('Не добудиться. На стойке пузырёк корвалола. Почти пустой.');
      return;
    }
    if (!OM.flag('checkedIn')) {
      await zsay(fromBell ? 'Ну? Чего трезвоните? Не глухая.' : 'Поздненько вы.');
      await say('Добрый вечер. Мне бы номер. На одну ночь, максимум на две.');
      await zsay('Паспорт.');
      await say('Вот, пожалуйста.');
      await zsay('Гордеев Лев Аркадьевич. Сорок один год. Командировочный?');
      await say('Вроде того. Энциклопедии продаю. «Всё обо всём», двенадцать томов, в рассрочку.');
      await zsay('Обо всём. В Омуте.');
      await OM.wait(700);
      await zsay('Седьмой номер, второй этаж. Ужина нет. В полночь свет отключаем. Окно не открывайте.');
      OM.give('key7');
      OM.flag('checkedIn', 1);
      if (OM.flag('called')) {
        await say('Это ведь вы мне по телефону ответили? Там ещё ребёнок что-то шептал.');
        await zsay('Не звонил мне никто. Телефон с сентября не работает. Провод перегрызли.');
        await say('…Кто перегрыз?');
        await zsay('Крысы. Кто ещё.');
      }
      OM.save();
    } else {
      await zsay(fromBell ? 'Да слышу я, слышу. Чего ещё?' : 'Чего ещё?');
    }
    const seen = (G.flags.zSeen = G.flags.zSeen || {});
    for (;;) {
      const opts = [
        { id: 'town', text: 'Что это за город такой — Тихий Омут?' },
        { id: 'alone', text: 'Вы одна здесь управляетесь?' },
        { id: 'window', text: 'Почему нельзя открывать окно?' },
      ];
      if (OM.flag('sawTall')) opts.push({ id: 'tall', text: 'Я видел в лесу кого-то. Очень высокого.' });
      opts.forEach((o) => (o.seen = seen[o.id]));
      opts.push({ id: 'bye', text: 'Спокойной ночи.' });
      const c = await OM.choose(opts);
      seen[c] = 1;
      if (c === 'bye') {
        await say('Спокойной ночи, Зинаида Павловна.');
        await zsay('Угу.');
        return;
      }
      if (c === 'town') {
        await say('Что это за город такой — Тихий Омут?');
        await zsay('Город как город. Комбинат был — закрыли. Водохранилище осталось.');
        await zsay('А до водохранилища тут село стояло. Покровское. В пятьдесят пятом его затопили.');
        await say('Целое село?');
        await zsay('И церковь. В сухое лето купол из воды видать.');
      }
      if (c === 'alone') {
        await say('Вы одна здесь управляетесь?');
        await zsay('С внуком. Митька, девять лет. Мать его… уехала.');
        await zsay('А он с осени лунатит. Встанет ночью — и идёт. Куда — сам не знает.');
        await zsay('Я его вот этим звонком бужу. Тихонько звякну — он и проснётся. Трясти нельзя, напугается.');
        OM.flag('knowBell', 1);
      }
      if (c === 'window') {
        await say('Почему нельзя открывать окно?');
        await zsay('Сквозняк.');
        await say('И всё?');
        await zsay('Слышно их.');
        await say('Кого?');
        await OM.wait(500);
        await zsay('Лягушек. Спокойной ночи, Лев Аркадьевич.');
      }
      if (c === 'tall') {
        await say('На остановке я видел в лесу кого-то. Очень высокого.');
        await OM.wait(600);
        await zsay('Лось.');
        await say('Лоси не стоят на задних ногах.');
        await zsay('Значит, не лось. Идите спать.');
      }
    }
  }

  OM.scene('lobby', {
    name: 'Холл гостиницы',
    surface: 'floor',
    amb: { rain: 0.5, wind: 0.2, hum: 1, indoor: true, drone: 0.15 },
    heroBody: '#0f0b08',
    walk: [[60, 618], [1110, 618], [1110, 706], [60, 706]],
    depth: { y0: 618, s0: 1.3, y1: 706, s1: 1.44 },
    entries: {
      default: { x: 300, y: 660, face: 1 },
      door: { x: 150, y: 660, face: 1 },
      stairs: { x: 1060, y: 650, face: -1 },
    },
    lights: [
      { x: LAMP.x, y: 410, color: '#ffcf88', a: 1, reach: 420 },
      { x: CH.x, y: CH.y, color: '#ffcc88', a: 0.5, reach: 800 },
      { x: 118, y: 370, color: '#7fa0c0', a: 0.45, reach: 260 },
    ],
    layers: [{ z: 605, paint: deskLayer }],
    actors: () => [zina, props],
    paint,
    back,
    update(dt, t) {
      st.tick += dt;
      if (st.tick > 1) { st.tick -= 1; S.tick(Math.floor(t) % 2); }
    },
    hotspots: [
      { id: 'door', name: 'На улицу', rect: [34, 280, 168, 324], walk: [120, 660], exit: { to: 'street', entry: 'door', dir: 'left' } },
      {
        id: 'photo', name: 'Фотография', rect: [240, 180, 120, 110], walk: [300, 640], face: -1,
        look: async () => {
          await say('«Покровское, 1954». Церковь на холме, дома, люди у ограды.');
          if (!OM.flag('photoVision')) await say('Стекло в рамке холодное, как лёд. Даже отсюда чувствую.');
          else await say('Через год всё это ушло под воду. И, кажется, не всё там умерло.');
        },
        use: async () => {
          if (OM.flag('photoVision')) return say('Больше не хочу к ней прикасаться.');
          await say('Протру стекло…');
          OM.flag('photoVision', 1);
          S.hit();
          OM.flash(1);
          OM.letterbox(true);
          await OM.story.photoVision();
          S.whisper(3.2, 0.14);
          S.tension(0.6);
          await OM.wait(3400);
          OM.endVision();
          S.tension(0);
          OM.flash(0.8);
          OM.letterbox(false);
          await say('…Что это было?');
          await say('Под водой. Церковь. И они — вокруг неё. Стоят, как прихожане на службе.');
          await say('Я устал. Я просто очень устал.');
        },
      },
      {
        id: 'keys', name: 'Доска с ключами', rect: [644, 222, 156, 126], walk: [730, 640], face: 1,
        look: () => (OM.flag('boatKeyTaken')
          ? say('Пустой крючок там, где висел ключ от лодочной станции.')
          : say('Доска с ключами. Номерки… и большой железный ключ с биркой «Лод. ст.» — от лодочной станции.')),
        use: async () => {
          if (OM.flag('boatKeyTaken')) return say('Мне больше ничего оттуда не нужно.');
          if (!OM.flag('vision')) return say('Ключи — хозяйское дело. Мой седьмой уже у меня.');
          await say('Через стойку не дотянуться. Нужно что-то длинное. С крюком.');
        },
        items: {
          umbrella: async () => {
            if (OM.flag('boatKeyTaken')) return say('Там больше нечего цеплять.');
            if (!OM.flag('zinaSleeps')) return say('При хозяйке? Нет уж.');
            G.hero.pose = 'reach';
            await OM.wait(400);
            S.lockRattle();
            await OM.wait(500);
            OM.flag('boatKeyTaken', 1);
            G.hero.pose = null;
            OM.give('boatkey');
            await say('Есть. Зонт с крюком — лучшее изобретение человечества.');
          },
          key7: () => say('Вешать ключ обратно рано. Ночь ещё не кончилась.'),
        },
      },
      {
        id: 'zina', name: 'Зинаида Павловна', rect: [548, 300, 128, 120], walk: [612, 640], face: 1,
        look: () => (OM.flag('zinaSleeps')
          ? say('Спит, уронив голову на грудь. Дышит тяжело.')
          : say('Хозяйка. Шаль, очки, взгляд — как у таможенника на границе.')),
        use: () => talkZina(false),
        items: {
          book: async () => {
            if (OM.flag('zinaSleeps')) return say('Не сейчас.');
            await say('Не желаете энциклопедию? Двенадцать томов, «Всё обо всём»…');
            await zsay('Мне, Лев Аркадьевич, «всего» уже хватило. До конца жизни.');
          },
          key7: () => say('Ключ я пока оставлю себе. Мне ещё спать.'),
          bell: () => say('Звонок ей сейчас не поможет. Ей бы выспаться. А мне — успеть.'),
        },
      },
      {
        id: 'bell', name: 'Звонок', rect: [724, 398, 34, 30], walk: [740, 640], face: 1, when: () => !OM.flag('bellTaken'),
        look: 'Медный звонок для вызова администратора.',
        use: async () => {
          if (OM.flag('zinaSleeps')) {
            await say('Простите, Зинаида Павловна. Я его верну. Честное слово.');
            OM.flag('bellTaken', 1);
            OM.give('bell');
            return;
          }
          S.bell();
          await OM.wait(500);
          return talkZina(true);
        },
      },
      {
        id: 'guestbook', name: 'Книга регистрации', rect: [534, 410, 84, 18], walk: [576, 640], face: 1,
        look: () => (OM.flag('checkedIn')
          ? say('Последняя запись — моя. «Гордеев Л. А., номер 7». Предыдущая — три недели назад. «Рыболов-любитель, Сосновка». Выбыл… не указано.')
          : say('Книга регистрации гостей. Последняя запись — три недели назад.')),
      },
      { id: 'lamp', name: 'Настольная лампа', rect: [428, 378, 56, 48], look: 'Лампа с зелёным абажуром. Такая же стояла у отца на работе. Под ней все бумаги кажутся важными.' },
      { id: 'bottle', name: 'Пузырёк', rect: [670, 396, 22, 28], when: () => OM.flag('zinaSleeps'), look: 'Корвалол. Половины нет. Её до утра не добудиться.' },
      {
        id: 'clock', name: 'Часы', rect: [872, 134, 78, 222], walk: [910, 640], face: 1,
        look: () => (OM.flag('vision') ? say('Без четырёх двенадцать. Нет. Нет-нет-нет.') : say('Без двадцати двух двенадцать. Маятник ходит так громко, будто считает вслух.')),
      },
      {
        id: 'radio', name: 'Радиола', rect: [874, 440, 112, 64], walk: [930, 640], face: 1,
        look: 'Радиола «Ригонда». Шкала светится, из динамика — шипение.',
        use: async () => {
          S.staticNoise(2.5, 0.08);
          S.whisper(2.4, 0.06);
          await say('Сквозь шипение… будто кто-то считает. Медленно, на одной ноте.');
          await say('«…двенадцать… тринадцать…»');
          await say('Выключу-ка я это.');
        },
      },
      { id: 'ficus', name: 'Фикус', rect: [996, 370, 98, 236], look: 'Фикус. Переживёт нас всех. И этот город тоже.' },
      {
        id: 'stairs', name: 'Лестница на второй этаж', rect: [1100, 160, 180, 446], walk: [1080, 650],
        exit: { to: 'room', entry: 'door', dir: 'up', when: () => OM.flag('checkedIn') },
        look: () => (OM.flag('checkedIn') ? say('Наверх, в номер семь.') : say('Без ключа подниматься незачем. Сначала — заселиться.')),
      },
    ],
    async enter(entry) {
      if (entry === 'door' && !OM.flag('lobbySeen')) {
        OM.flag('lobbySeen', 1);
        await OM.wait(300);
        await say('Тепло. Пахнет пылью, валерьянкой и старым деревом.');
      }
      if (entry === 'stairs' && OM.flag('vision') && !OM.flag('lobbyAfter')) {
        OM.flag('lobbyAfter', 1);
        await say('Зинаида Павловна спит. Ключ от пристани — на доске за стойкой.');
      }
    },
  });
})();
