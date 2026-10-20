// Глава 4. Комната Веры над библиотекой. Вера в ночной рубашке шаг за шагом идёт к трюмо.
// В зеркале — та же комната, только затопленная, и за отражением Веры стоит Тихий.
// Голос в приёмнике зовёт её. Заглушить голос, завесить зеркало.
(function () {
  const P = OM.P, S = OM.S, G = OM.G, A = OM.Actors;
  const { hex, rng, W, H, lerp, clamp } = OM;
  const TAU = Math.PI * 2;
  const say = (t, o) => OM.say('lev', t, o);
  const FLOOR = 600;
  const MIR = { x0: 905, x1: 1115, y0: 160, y1: 566 };
  const MX = (MIR.x0 + MIR.x1) / 2;
  const RADIO = { x: 700, y: 486 };
  const SOCKET = { x: 800, y: 548 };
  const VSTART = 520, VEND = 852;
  const NIGHT = { cardigan: '#d8d2c4', blouse: '#e0d8c8', skirt: '#d0c8b8', skin: '#e0b39a', hair: '#4a2e22', shoes: '#c89a88', tights: '#e0b39a' };

  function wallpaper(g) {
    P.fillV(g, 0, 0, W, FLOOR, [[0, '#3a3a30'], [1, '#2a2a22']]);
    // выцветший узор: ромбы и веточки
    const r = rng(901);
    for (let y = 20; y < FLOOR; y += 46) {
      for (let x = (y / 46) % 2 ? 23 : 0; x < W; x += 46) {
        g.strokeStyle = 'rgba(190,180,140,.08)';
        g.lineWidth = 1;
        g.beginPath();
        g.moveTo(x, y - 14);
        g.quadraticCurveTo(x + 6, y, x, y + 14);
        g.quadraticCurveTo(x - 6, y, x, y - 14);
        g.stroke();
        g.fillStyle = 'rgba(160,120,90,.09)';
        g.beginPath();
        g.arc(x + 4, y - 3, 2.4, 0, TAU);
        g.arc(x - 4, y + 4, 2, 0, TAU);
        g.fill();
      }
    }
    for (let x = 0; x < W; x += 92) { g.fillStyle = 'rgba(0,0,0,.08)'; g.fillRect(x + r() * 3, 0, 1.5, FLOOR); }
    // подтёки у потолка
    for (let i = 0; i < 7; i++) {
      const x = r() * W;
      g.fillStyle = P.vgrad(g, 0, 60 + r() * 80, [[0, 'rgba(60,50,30,.25)'], [1, 'rgba(60,50,30,0)']]);
      g.fillRect(x, 0, 30 + r() * 60, 140);
    }
    // плинтус и карниз
    P.fillV(g, 0, 0, W, 18, [[0, '#1a1a14'], [1, '#2e2e26']]);
    P.fillV(g, 0, FLOOR - 14, W, 14, [[0, '#4a3a2a'], [1, '#2a1e14']]);
  }
  function floor(g) {
    P.fillV(g, 0, FLOOR, W, H - FLOOR, [[0, '#3a2a1e'], [1, '#1a120c']]);
    const r = rng(902);
    for (let i = 0; i < 22; i++) {
      const x = -200 + i * 80;
      g.strokeStyle = 'rgba(0,0,0,.35)';
      g.lineWidth = 1;
      g.beginPath();
      g.moveTo(x + (x - 640) * 0.02, FLOOR);
      g.lineTo(x + (x - 640) * 0.35, H);
      g.stroke();
    }
    for (let i = 0; i < 30; i++) {
      g.fillStyle = 'rgba(0,0,0,.18)';
      g.fillRect(r() * W, FLOOR + 10 + r() * 110, 20 + r() * 60, 1);
    }
    // половик
    g.fillStyle = '#5a2a22';
    g.beginPath();
    g.moveTo(320, 640);
    g.lineTo(760, 640);
    g.lineTo(820, 700);
    g.lineTo(270, 700);
    g.closePath();
    g.fill();
    g.strokeStyle = 'rgba(220,190,120,.35)';
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(330, 648);
    g.lineTo(752, 648);
    g.lineTo(804, 692);
    g.lineTo(286, 692);
    g.closePath();
    g.stroke();
    for (let i = 0; i < 9; i++) {
      g.fillStyle = 'rgba(220,190,120,.25)';
      g.fillRect(360 + i * 46, 664, 18, 12);
    }
  }
  function bed(g) {
    // железная кровать с шариками, подушка уголком, покрывало
    g.strokeStyle = '#1a1a1c';
    g.lineWidth = 4;
    g.beginPath();
    g.moveTo(150, FLOOR + 6);
    g.lineTo(150, 430);
    g.quadraticCurveTo(150, 410, 170, 410);
    g.lineTo(200, 410);
    g.quadraticCurveTo(220, 410, 220, 430);
    g.lineTo(220, FLOOR + 6);
    g.stroke();
    for (let i = 0; i < 5; i++) { g.lineWidth = 2; g.beginPath(); g.moveTo(158 + i * 13, 430); g.lineTo(158 + i * 13, 540); g.stroke(); }
    g.fillStyle = '#b89a5a';
    [[150, 430], [220, 430]].forEach(([x, y]) => { g.beginPath(); g.arc(x, y - 6, 5, 0, TAU); g.fill(); });
    // матрас и покрывало
    P.fillV(g, 150, 520, 260, 60, [[0, '#6a5a4a'], [1, '#3a2e24']]);
    g.fillStyle = '#7a3a34';
    g.beginPath();
    g.moveTo(190, 520);
    g.lineTo(410, 520);
    g.lineTo(416, 584);
    g.quadraticCurveTo(300, 596, 186, 584);
    g.closePath();
    g.fill();
    g.strokeStyle = 'rgba(230,190,140,.25)';
    g.lineWidth = 1;
    for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(200 + i * 36, 524); g.lineTo(196 + i * 37, 588); g.stroke(); }
    // подушка «уголком»
    g.fillStyle = '#e8e0d0';
    g.beginPath();
    g.moveTo(160, 520);
    g.lineTo(200, 470);
    g.lineTo(240, 520);
    g.closePath();
    g.fill();
    g.fillStyle = 'rgba(0,0,0,.12)';
    g.beginPath();
    g.moveTo(200, 470);
    g.lineTo(240, 520);
    g.lineTo(212, 520);
    g.fill();
    // ножки
    g.fillStyle = '#1a1a1c';
    g.fillRect(404, 584, 5, 22);
    // одеяло откинуто — встала среди ночи
    g.fillStyle = '#d8d0c0';
    g.beginPath();
    g.moveTo(250, 520);
    g.quadraticCurveTo(320, 500, 400, 512);
    g.lineTo(404, 530);
    g.quadraticCurveTo(320, 540, 248, 530);
    g.fill();
  }
  function windowRain(g) {
    const x = 450, y = 150, w = 170, h = 270;
    P.fillV(g, x, y, w, h, [[0, '#0a1220'], [1, '#18222e']]);
    // улица за окном: фонарь, крыши напротив
    g.fillStyle = '#05080c';
    g.fillRect(x, y + 170, w, 100);
    g.beginPath();
    g.moveTo(x, y + 170);
    g.lineTo(x + 60, y + 130);
    g.lineTo(x + 120, y + 170);
    g.fill();
    P.glow(g, x + 140, y + 110, 70, '#ffc070', 0.45);
    g.fillStyle = '#ffe0a0';
    g.fillRect(x + 136, y + 106, 8, 6);
    g.fillStyle = '#05080c';
    g.fillRect(x + 139, y + 112, 2, 160);
    // капли на стекле
    const r = rng(903);
    for (let i = 0; i < 80; i++) {
      const px = x + r() * w, py = y + r() * h;
      g.fillStyle = `rgba(200,215,230,${0.15 + r() * 0.3})`;
      g.beginPath();
      g.ellipse(px, py, 1 + r() * 1.5, 1.5 + r() * 2.5, 0, 0, TAU);
      g.fill();
      if (r() < 0.3) { g.fillStyle = 'rgba(200,215,230,.1)'; g.fillRect(px - 0.5, py, 1, 10 + r() * 30); }
    }
    // рама и подоконник
    P.window(g, x, y, w, h, { frame: '#d8d0c0', ft: 7, glow: false, dark: 'rgba(0,0,0,0)' });
    P.fillV(g, x - 20, y + h + 6, w + 40, 12, [[0, '#e0d8c8'], [1, '#9a9488']]);
    // занавески
    g.fillStyle = 'rgba(200,190,150,.45)';
    g.beginPath();
    g.moveTo(x - 30, y - 20);
    g.quadraticCurveTo(x + 30, y + 120, x - 6, y + h + 6);
    g.lineTo(x - 30, y + h + 6);
    g.fill();
    g.beginPath();
    g.moveTo(x + w + 30, y - 20);
    g.quadraticCurveTo(x + w - 30, y + 120, x + w + 6, y + h + 6);
    g.lineTo(x + w + 30, y + h + 6);
    g.fill();
    g.fillStyle = '#3a2a1a';
    g.fillRect(x - 40, y - 26, w + 80, 6);
  }
  function deskRadio(g) {
    // стол у окна, лампа с зелёным абажуром, стопки книг
    P.fillV(g, 600, 500, 230, 12, [[0, '#5a3e28'], [1, '#2e1e12']]);
    g.fillStyle = '#2e1e12';
    g.fillRect(610, 512, 8, 88);
    g.fillRect(812, 512, 8, 88);
    g.fillRect(618, 512, 194, 30);
    g.fillStyle = 'rgba(0,0,0,.4)';
    g.fillRect(700, 520, 30, 3);
    // книги
    const r = rng(904);
    let yy = 500;
    for (let i = 0; i < 5; i++) {
      const bw = 50 + r() * 16, bh = 7 + r() * 4;
      g.fillStyle = ['#6a2a22', '#2a3a5a', '#3a4a2a', '#6a5a3a', '#4a2a3a'][i];
      g.fillRect(618 + r() * 6, yy - bh, bw, bh);
      g.fillStyle = 'rgba(230,220,190,.5)';
      g.fillRect(618 + bw - 4, yy - bh + 1, 2, bh - 2);
      yy -= bh;
    }
    // лампа
    g.fillStyle = '#2a2a24';
    g.fillRect(775, 480, 14, 20);
    g.fillRect(780, 420, 4, 62);
    g.fillStyle = '#2a6a3a';
    g.beginPath();
    g.moveTo(752, 432);
    g.quadraticCurveTo(782, 400, 812, 432);
    g.lineTo(816, 440);
    g.lineTo(748, 440);
    g.fill();
    g.fillStyle = 'rgba(160,230,160,.35)';
    g.fillRect(756, 430, 50, 3);
    // радиоприёмник «Спидола»
    P.rrect(g, RADIO.x - 46, RADIO.y - 2, 92, 46, 6);
    g.fillStyle = '#3a2a22';
    g.fill();
    P.rrect(g, RADIO.x - 40, RADIO.y + 4, 50, 34, 3);
    g.fillStyle = '#5a5248';
    g.fill();
    g.strokeStyle = 'rgba(0,0,0,.4)';
    g.lineWidth = 0.8;
    for (let i = 0; i < 8; i++) { g.beginPath(); g.moveTo(RADIO.x - 38, RADIO.y + 8 + i * 4); g.lineTo(RADIO.x + 8, RADIO.y + 8 + i * 4); g.stroke(); }
    g.fillStyle = '#d8d0b8';
    g.fillRect(RADIO.x + 16, RADIO.y + 8, 24, 10);
    P.text(g, 'СПИДОЛА', RADIO.x - 15, RADIO.y + 1, { font: '700 5px "PT Serif",serif', color: '#c8b890' });
    g.fillStyle = '#1a1410';
    g.beginPath();
    g.arc(RADIO.x + 22, RADIO.y + 30, 5, 0, TAU);
    g.arc(RADIO.x + 36, RADIO.y + 30, 4, 0, TAU);
    g.fill();
    // антенна
    g.strokeStyle = '#8a8a84';
    g.lineWidth = 1.2;
    g.beginPath();
    g.moveTo(RADIO.x + 40, RADIO.y);
    g.lineTo(RADIO.x + 66, RADIO.y - 80);
    g.stroke();
    // розетка
    g.fillStyle = '#d0c8b8';
    P.rrect(g, SOCKET.x - 10, SOCKET.y - 12, 20, 24, 3);
    g.fill();
    g.fillStyle = '#2a2420';
    g.beginPath();
    g.arc(SOCKET.x - 3.5, SOCKET.y, 1.6, 0, TAU);
    g.arc(SOCKET.x + 3.5, SOCKET.y, 1.6, 0, TAU);
    g.fill();
    // стул с платком
    g.fillStyle = '#3a2618';
    g.fillRect(560, 470, 8, 130);
    g.fillRect(520, 538, 50, 8);
    g.fillRect(522, 546, 6, 54);
    g.fillRect(560, 546, 6, 54);
    for (let i = 0; i < 3; i++) g.fillRect(562, 480 + i * 18, 6, 4);
  }
  function trumo(g) {
    // тумба
    P.fillV(g, 870, 520, 280, 80, [[0, '#4a3020'], [1, '#22140a']]);
    g.fillStyle = 'rgba(0,0,0,.35)';
    g.fillRect(880, 540, 120, 2);
    g.fillRect(1020, 540, 120, 2);
    g.fillStyle = '#b89a5a';
    g.fillRect(936, 556, 10, 3);
    g.fillRect(1074, 556, 10, 3);
    // рамы зеркал: центральное и две створки
    P.fillV(g, MIR.x0 - 12, MIR.y0 - 30, MIR.x1 - MIR.x0 + 24, MIR.y1 - MIR.y0 + 30, [[0, '#4a3020'], [1, '#2a1a10']]);
    g.beginPath();
    g.moveTo(MIR.x0 - 12, MIR.y0 - 28);
    g.quadraticCurveTo(MX, MIR.y0 - 70, MIR.x1 + 12, MIR.y0 - 28);
    g.fill();
    g.fillStyle = '#b89a5a';
    g.beginPath();
    g.arc(MX, MIR.y0 - 40, 6, 0, TAU);
    g.fill();
    [[MIR.x0 - 54, MIR.x0 - 16, 1], [MIR.x1 + 16, MIR.x1 + 54, -1]].forEach(([a, b, f]) => {
      g.fillStyle = '#3a2416';
      g.beginPath();
      g.moveTo(a, MIR.y0 + 30 - f * 0);
      g.lineTo(b, MIR.y0 + 6);
      g.lineTo(b, MIR.y1);
      g.lineTo(a, MIR.y1 - 10);
      g.fill();
      g.fillStyle = P.hgrad(g, a, b, [[0, '#2a3440'], [1, '#4a5a68']]);
      g.beginPath();
      g.moveTo(a + 5, MIR.y0 + 36);
      g.lineTo(b - 4, MIR.y0 + 14);
      g.lineTo(b - 4, MIR.y1 - 8);
      g.lineTo(a + 5, MIR.y1 - 16);
      g.fill();
    });
    // флакончики и гребень
    [[900, 512, '#a0c0b0'], [918, 508, '#d0a8a0'], [1120, 512, '#c8b070']].forEach(([x, y, c]) => {
      g.fillStyle = c;
      P.rrect(g, x, y, 10, 14, 2);
      g.fill();
      g.fillStyle = '#2a2420';
      g.fillRect(x + 3, y - 4, 4, 4);
    });
    g.fillStyle = '#2a1a10';
    g.fillRect(1040, 516, 30, 4);
  }
  function clockShelf(g) {
    // ходики с маятником
    P.fillV(g, 1186, 110, 60, 80, [[0, '#4a3020'], [1, '#2a1a10']]);
    g.fillStyle = '#e8e0cc';
    g.beginPath();
    g.arc(1216, 150, 22, 0, TAU);
    g.fill();
    g.fillStyle = '#2a1a10';
    g.fillRect(1196, 190, 40, 140);
    g.fillStyle = '#100a06';
    g.fillRect(1202, 196, 28, 128);
    // книжные полки
    const r = rng(905);
    P.fillV(g, 1166, 360, 114, 240, [[0, '#3a2818'], [1, '#1e140a']]);
    for (let s = 0; s < 4; s++) {
      const yb = 410 + s * 52;
      g.fillStyle = '#4a3420';
      g.fillRect(1166, yb, 114, 5);
      let x = 1172;
      while (x < 1270) {
        const bw = 8 + r() * 8, bh = 30 + r() * 14;
        g.fillStyle = OM.Fig.shade(['#6a2a22', '#2a3a5a', '#3a4a2a', '#6a5a3a', '#5a4a3a'][(r() * 5) | 0], (r() - 0.5) * 0.3);
        g.fillRect(x, yb - bh, bw, bh);
        x += bw + 1;
      }
    }
    // фотография в рамке над кроватью: Вера с мамой
    g.fillStyle = '#2a1a10';
    g.fillRect(250, 290, 66, 84);
    P.fillV(g, 256, 296, 54, 72, [[0, '#a8988a'], [1, '#6a5a4a']]);
    g.fillStyle = '#3a2e26';
    g.beginPath();
    g.arc(272, 322, 7, 0, TAU);
    g.arc(294, 316, 8, 0, TAU);
    g.fill();
    g.fillRect(264, 330, 16, 34);
    g.fillRect(284, 325, 20, 40);
    // дверь слева
    P.fillV(g, 20, 220, 110, 380, [[0, '#4a3a2a'], [1, '#2a1e14']]);
    g.strokeStyle = 'rgba(0,0,0,.4)';
    g.lineWidth = 2;
    g.strokeRect(34, 240, 82, 150);
    g.strokeRect(34, 410, 82, 170);
    g.fillStyle = '#b89a5a';
    g.beginPath();
    g.arc(116, 420, 4, 0, TAU);
    g.fill();
  }
  function paint(g) {
    wallpaper(g);
    floor(g);
    windowRain(g);
    clockShelf(g);
    bed(g);
    trumo(g);
    deskRadio(g);
    P.paper(g, 906, 0.1);
  }

  // ---------- Состояние ----------
  const st = { p: 0, radio: 'on', covered: false, failing: false, done: false, stepT: 0, active: false, tug: 0, staticT: 0, sway: 0, cover: 0, flick: 0 };
  const vera = OM.actor({
    id: 'vera', x: VSTART, y: 640, face: 1, speed: 22, litByScene: true, cadence: 1.4,
    draw: (c, a, t) => A.vera(c, Object.assign({}, a, { pal: NIGHT, long: true, hairDown: true, glasses: false, hold: st.done ? 'face' : st.p > 0.78 && !st.covered ? 'reach' : 'trance', eyesClosed: st.done && st.sway > 0 && st.sway < 1, headTilt: st.done ? 0.1 : -0.04 }), t),
  });

  // Отражение: та же комната, только в воде, тише и синее.
  function reflection(ctx, t) {
    const k = st.p;
    ctx.save();
    ctx.beginPath();
    ctx.rect(MIR.x0, MIR.y0, MIR.x1 - MIR.x0, MIR.y1 - MIR.y0);
    ctx.clip();
    // зеркальная комната (глубже, меньше)
    ctx.save();
    ctx.translate(MX, FLOOR);
    ctx.scale(-0.58, 0.58);
    ctx.translate(-640, -FLOOR - 90);
    ctx.drawImage(OM.cache('veraflat:bg', paint), 0, 0, W, H);
    ctx.restore();
    ctx.fillStyle = 'rgba(10,30,50,.45)';
    ctx.fillRect(MIR.x0, MIR.y0, MIR.x1 - MIR.x0, MIR.y1 - MIR.y0);
    // в отражении — окно открыто, за ним вода и луна
    // Вера в отражении и Тихий за её спиной
    const rx = MIR.x1 - 66 - k * 60, rs = 0.66 + k * 0.4, ry = MIR.y1 - 2;
    const wl = MIR.y1 - 20 - k * 140 + Math.sin(t * 1.3) * 3;
    A.tall(ctx, { x: rx + 46 * rs, y: ry - 6, s: rs * 0.56, face: -1, alpha: 0.95, reach: clamp(k * 1.3, 0, 1), jitter: 1 + st.tug * 3, body: '#020406', seed: 7, face2: 1.4 }, t);
    A.vera(ctx, { x: rx, y: ry, s: rs, face: -1, pal: NIGHT, long: true, hairDown: true, glasses: false, hold: k > 0.78 ? 'reach' : 'trance', eyesClosed: true, light: { amb: 0.4, tint: '#3a6080', side: -1 } }, t);
    // вода поднимается в отражении
    P.fillV(ctx, MIR.x0, wl, MIR.x1 - MIR.x0, MIR.y1 - wl, [[0, 'rgba(60,100,120,.55)'], [1, 'rgba(10,30,40,.9)']]);
    ctx.fillStyle = 'rgba(200,225,235,.4)';
    ctx.fillRect(MIR.x0, wl, MIR.x1 - MIR.x0, 1.2);
    for (let i = 0; i < 5; i++) {
      ctx.fillStyle = 'rgba(200,225,235,.12)';
      ctx.fillRect(MIR.x0 + ((i * 53 + t * 12) % 200), wl + 6 + i * 8, 40, 1);
    }
    // в зеркале на часах — 00:13
    ctx.restore();
    // стекло: блики, патина
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = P.hgrad(ctx, MIR.x0, MIR.x1, [[0, 'rgba(200,220,240,0)'], [0.3, 'rgba(200,220,240,.05)'], [0.38, 'rgba(200,220,240,.12)'], [0.46, 'rgba(200,220,240,.03)'], [1, 'rgba(200,220,240,0)']]);
    ctx.fillRect(MIR.x0, MIR.y0, MIR.x1 - MIR.x0, MIR.y1 - MIR.y0);
    ctx.restore();
    ctx.fillStyle = 'rgba(30,24,14,.25)';
    ctx.fillRect(MIR.x0, MIR.y0, 10, MIR.y1 - MIR.y0);
    ctx.fillRect(MIR.x1 - 8, MIR.y0, 8, MIR.y1 - MIR.y0);
  }
  function shawlOver(ctx, t) {
    if (st.cover <= 0.01) return;
    const k = st.cover;
    const sway = Math.sin(t * 1.4) * 2;
    ctx.save();
    ctx.fillStyle = '#4a5a7a';
    ctx.beginPath();
    ctx.moveTo(MIR.x0 - 20, MIR.y0 - 30);
    ctx.quadraticCurveTo(MX, MIR.y0 - 50, MIR.x1 + 20, MIR.y0 - 30);
    ctx.lineTo(MIR.x1 + 14 + sway, MIR.y0 - 30 + (MIR.y1 - MIR.y0 + 20) * k);
    ctx.quadraticCurveTo(MX, MIR.y0 - 10 + (MIR.y1 - MIR.y0 + 40) * k, MIR.x0 - 14 + sway, MIR.y0 - 30 + (MIR.y1 - MIR.y0 + 20) * k);
    ctx.closePath();
    ctx.fill();
    ctx.clip();
    ctx.fillStyle = 'rgba(230,220,190,.55)';
    for (let i = 0; i < 70; i++) {
      ctx.beginPath();
      ctx.arc(MIR.x0 - 10 + (i % 9) * 28 + ((Math.floor(i / 9) % 2) * 14), MIR.y0 - 20 + Math.floor(i / 9) * 56, 3, 0, TAU);
      ctx.fill();
    }
    ctx.strokeStyle = 'rgba(0,0,0,.25)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      ctx.moveTo(MIR.x0 + i * 40, MIR.y0 - 30);
      ctx.quadraticCurveTo(MIR.x0 + i * 40 + 10, (MIR.y0 + MIR.y1) / 2, MIR.x0 + i * 40 + sway, MIR.y1);
      ctx.stroke();
    }
    ctx.restore();
  }

  function back(ctx, t) {
    // свет лампы на стене и столе
    P.glow(ctx, 782, 470, 220, '#a0e090', 0.18);
    P.glow(ctx, 782, 450, 40, '#e0ffd0', 0.35);
    // маятник ходиков
    const sw = Math.sin(t * 3.1) * 0.25;
    ctx.save();
    ctx.translate(1216, 196);
    ctx.rotate(sw);
    ctx.fillStyle = '#b89a5a';
    ctx.fillRect(-1, 0, 2, 100);
    ctx.beginPath();
    ctx.arc(0, 104, 9, 0, TAU);
    ctx.fill();
    ctx.restore();
    // стрелки ходиков — текущее время
    const m = OM.ch4.time();
    const hA = (((m / 60) + 11) % 12) / 12 * TAU, mA = ((m % 60) / 60) * TAU;
    ctx.strokeStyle = '#1a1410';
    ctx.lineCap = 'round';
    [[hA, 11, 2.4], [mA, 17, 1.4]].forEach(([a, l, w]) => {
      ctx.lineWidth = w;
      ctx.beginPath();
      ctx.moveTo(1216, 150);
      ctx.lineTo(1216 + Math.sin(a) * l, 150 - Math.cos(a) * l);
      ctx.stroke();
    });
    // дождь по стеклу
    for (let i = 0; i < 12; i++) {
      const k = (t * 0.25 + i * 0.137) % 1;
      ctx.fillStyle = 'rgba(200,215,230,.35)';
      ctx.fillRect(458 + ((i * 47) % 160), 150 + k * 270, 1, 6 + (i % 3) * 4);
    }
    // приёмник светится шкалой, пока жив
    if (st.radio !== 'dead' && st.radio !== 'off') {
      const fl = 0.7 + Math.random() * 0.3;
      P.glow(ctx, RADIO.x + 28, RADIO.y + 13, 22, '#ffc870', 0.45 * fl);
      ctx.fillStyle = `rgba(255,200,110,${0.6 * fl})`;
      ctx.fillRect(RADIO.x + 16, RADIO.y + 8, 24, 10);
      ctx.fillStyle = '#a83a2a';
      ctx.fillRect(RADIO.x + 22 + Math.sin(t * 0.7) * 6, RADIO.y + 8, 1.5, 10);
    }
    // шнур от приёмника к розетке
    ctx.strokeStyle = '#1a1410';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(RADIO.x + 46, RADIO.y + 36);
    if (st.radio === 'dead') {
      ctx.quadraticCurveTo(RADIO.x + 70, RADIO.y + 100, RADIO.x + 90, SOCKET.y + 52);
    } else ctx.quadraticCurveTo(RADIO.x + 80, RADIO.y + 90, SOCKET.x - 1, SOCKET.y + 2);
    ctx.stroke();
    if (st.radio === 'dead') { ctx.fillStyle = '#2a2420'; ctx.fillRect(RADIO.x + 86, SOCKET.y + 48, 10, 6); }
    reflection(ctx, t);
    shawlOver(ctx, t);
    // платок на стуле
    if (!OM.flag('tookShawl')) {
      ctx.fillStyle = '#4a5a7a';
      ctx.beginPath();
      ctx.moveTo(556, 472);
      ctx.quadraticCurveTo(586, 470, 574, 520);
      ctx.lineTo(566, 548);
      ctx.lineTo(548, 520);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = 'rgba(230,220,190,.6)';
      [[562, 484], [570, 500], [558, 506], [566, 522]].forEach(([x, y]) => { ctx.beginPath(); ctx.arc(x, y, 1.8, 0, TAU); ctx.fill(); });
    }
  }
  function over(ctx, t) {
    ctx.fillStyle = 'rgba(4,8,6,.25)';
    ctx.fillRect(0, 0, W, H);
    OM.story4.cornerClock(ctx, 74, 86);
  }
  function threads(ctx, t, k) {
    const rx = MIR.x1 - 66 - st.p * 60, rs = 0.66 + st.p * 0.4;
    const refl = [rx, MIR.y1 - 110 * rs];
    if (!st.covered) OM.thread(ctx, [vera.x + 6, vera.y - 110 * vera.s], refl, t, { color: '#ffd27a', a: k * (st.radio === 'dead' ? 0.4 + Math.random() * 0.3 : 1), sag: 20, w: 2, speed: 0.35 });
    if (st.radio !== 'dead') OM.thread(ctx, [RADIO.x, RADIO.y + 10], refl, t, { color: '#9ab8e0', a: k, sag: 60, w: 1.6, speed: -0.4 });
    const h = G.hero;
    OM.thread(ctx, [h.x, h.y - 110 * h.s], [vera.x, vera.y - 110 * vera.s], t, { color: '#ffd27a', a: k * 0.5, sag: 30, w: 1.2 });
  }

  function update(dt, t) {
    if (st.done) { st.sway = Math.min(2, st.sway + dt * 0.5); return; }
    st.cover = clamp(st.cover + (st.covered ? dt * 1.6 : -dt * 3), 0, 1);
    if (!st.active || st.failing || G.mode !== 'play' || G.vision) return;
    // Вера делает шаг каждые пару секунд
    st.stepT -= dt;
    const rate = st.radio === 'dead' ? 0.6 : 1;
    if (st.stepT <= 0 && !vera.target) {
      st.stepT = 2.4 / rate;
      OM.moveTo(vera, Math.min(VEND, vera.x + 16), vera.y, { free: true });
    }
    st.p = clamp((vera.x - VSTART) / (VEND - VSTART), 0, 1);
    G.fx.warp = Math.max(0, st.p - 0.7) * 0.8;
    S.tension(st.p * 0.8);
    // голос из приёмника
    if (st.radio === 'on' || st.radio === 'on2') {
      st.staticT -= dt;
      if (st.staticT <= 0) {
        st.staticT = 2.2 + Math.random() * 1.5;
        S.staticNoise(0.8, 0.05);
        if (Math.random() < 0.6) S.whisper(1.2, 0.08);
      }
    }
    if (st.p >= 1) { st.failing = true; OM.run(fail); }
  }

  async function fail() {
    G.flags.fails4 = (G.flags.fails4 || 0) + 1;
    S.hit();
    OM.shake(8);
    G.fx.warp = 1;
    S.muffle(0.9);
    await OM.fadeTo(1, 700, '#04121a');
    await OM.say('narr', 'Ладонь легла на стекло. Стекло оказалось водой.', { hold: 1.6 });
    G.fx.warp = 0;
    S.muffle(0);
    vera.x = VSTART; vera.target = null; st.p = 0;
    if (st.radio === 'off') st.radio = 'on2';
    await OM.fadeTo(0, 700);
    await say('Ещё раз. Быстрее. Сначала — голос. Потом — зеркало.');
    st.failing = false;
  }

  async function radioUse() {
    if (st.radio === 'dead') return say('Молчит. И пусть молчит.');
    if (st.radio === 'off') return say('Выключен. Пока.');
    await OM.walk(RADIO.x - 20, 640);
    G.hero.face = 1;
    S.click();
    st.radio = 'off';
    await say('Щёлк. Тишина.');
    await OM.wait(1600);
    st.radio = 'on2';
    S.staticNoise(1.2, 0.12);
    S.whisper(1.8, 0.16);
    await OM.say('spidola', '…Верочка… иди… вода тёплая…', { italic: true });
    await say('Сам включился. Ручка повёрнута на «выкл» — а он говорит.');
  }
  async function plugUse() {
    if (st.radio === 'dead') return say('Вилка на полу. Пусть там и лежит.');
    await OM.walk(SOCKET.x - 10, 640);
    G.hero.face = 1;
    S.click();
    st.radio = 'dead';
    S.powerDown();
    OM.flag('radioDead', 1);
    await OM.wait(500);
    await say('Из розетки. Посмотрим, как ты теперь заговоришь.');
    await OM.wait(500);
    await say('…Тихо. Она замедлилась.');
  }
  async function coverMirror() {
    await OM.walk(MIR.x0 - 30, 640);
    G.hero.face = 1;
    OM.take('shawl');
    st.covered = true;
    S.creak();
    if (st.radio !== 'dead') {
      await OM.wait(700);
      S.whisper(1, 0.2);
      st.tug = 1;
      st.covered = false;
      OM.shake(5);
      await OM.wait(300);
      st.tug = 0;
      OM.give('shawl', true);
      await say('Сдёрнули. Изнутри. Пока голос зовёт — дверь держат открытой.');
      return;
    }
    await OM.wait(1200);
    st.done = true;
    st.sway = 0;
    vera.target = null;
    G.fx.warp = 0;
    S.tension(0);
    OM.letterbox(true);
    await OM.wait(900);
    S.heartbeat();
    await OM.say('vera', 'Ох…');
    await OM.say('vera', 'Лев… Аркадьевич? Вы что тут… Я же стояла там. По ту сторону.');
    await OM.say('vera', 'Там вода по колено. Тёплая. И мама за спиной — руку на плечо кладёт.');
    await say('Это была не мама.');
    await OM.say('vera', 'Я знаю. Мама сказала бы «Вера». Она меня никогда «Верочкой» не звала.');
    await OM.wait(300);
    await OM.say('vera', 'Идите. Я посижу при лампе. А зеркало пусть так и висит. До утра. До Покрова.');
    OM.letterbox(false);
    await OM.story4.rescued('library');
  }

  OM.scene('veraflat', {
    name: 'Комната Веры',
    surface: 'floor',
    figLight: { amb: 0.55, tint: '#3a4a3a', side: 1 },
    amb: { rain: 0.5, indoor: true, drone: 0.25, hum: 0.3 },
    walk: [[150, 626], [1160, 626], [1160, 700], [150, 700]],
    depth: { y0: 626, s0: 1.0, y1: 700, s1: 1.08 },
    entries: { default: { x: 170, y: 660, face: 1 } },
    lights: [{ x: 782, y: 440, color: '#b0f0a0', a: 0.7, reach: 520 }, { x: 540, y: 300, color: '#c8d8f0', a: 0.3, reach: 400 }],
    actors: () => [vera],
    paint,
    back,
    over,
    threads,
    update,
    hotspots: [
      { id: 'door', name: 'Дверь', rect: [20, 220, 110, 380], look: 'Дверь была не заперта. Вера никогда не запирает — «у библиотекаря красть нечего».' },
      { id: 'bed', name: 'Кровать', rect: [140, 410, 280, 190], look: 'Одеяло откинуто. Встала среди ночи и пошла. Тапочки остались у кровати.' },
      { id: 'photo', name: 'Фотография', rect: [246, 286, 74, 92], look: ['Вера-школьница и её мать. Обе серьёзные, как на документ.', 'На обороте, наверное, год. Пятьдесят пятый? Нет — шестьдесят какой-то. Мать уехала из Покровского. Живой.'] },
      { id: 'window', name: 'Окно', rect: [440, 140, 190, 290], look: 'Дождь. Фонарь напротив качается. В отражении стекла — комната, и в ней никто не идёт к зеркалу.' },
      { id: 'lamp', name: 'Лампа', rect: [746, 400, 74, 100], look: 'Зелёный абажур. Свет ровный, рабочий. Как в читальном зале.' },
      { id: 'radio', name: 'Приёмник «Спидола»', rect: [RADIO.x - 50, RADIO.y - 10, 100, 60], look: () => (st.radio === 'dead' ? say('Молчит. Вилка выдернута.') : say('Шипит. Сквозь шум — женский голос. Зовёт Веру. «Верочка».')), use: radioUse },
      { id: 'socket', name: 'Розетка', rect: [SOCKET.x - 16, SOCKET.y - 18, 32, 36], look: 'Розетка. Из неё — шнур к приёмнику.', use: plugUse },
      {
        id: 'mirror', name: 'Трюмо', rect: [MIR.x0 - 50, MIR.y0 - 60, MIR.x1 - MIR.x0 + 100, MIR.y1 - MIR.y0 + 60],
        look: () => (st.covered ? say('Завешено. Пусть так.') : OM.talk([['lev', 'В зеркале — эта же комната. Только в ней по колено воды, и окно открыто на озеро.'], ['lev', 'И за спиной у той Веры кто-то стоит.']])),
        use: () => say(st.covered ? 'Завешено.' : 'Разбить? Нельзя — она сейчас там, по ту сторону. Завесить — можно.'),
        items: { shawl: coverMirror },
      },
      {
        id: 'vera', name: 'Вера', rect: () => [vera.x - 34, vera.y - 200, 70, 200],
        look: () => say('Глаза открыты. Смотрит в зеркало и не моргает. Губы шевелятся: «иду, иду».'),
        use: () => say('Нельзя трясти, нельзя кричать — как с Митей. Сначала увести то, что её зовёт.'),
        items: { zhuchok: () => say('Светом в глаза? Она стоит спиной ко мне. А в зеркало светить — им только приятнее.') },
      },
      {
        id: 'shawl', name: 'Платок на стуле', rect: [540, 464, 50, 90], when: () => !OM.flag('tookShawl'),
        look: 'Синий платок в белый горошек. Висит на спинке стула.',
        use: async () => { await OM.walk(560, 640); OM.flag('tookShawl', 1); OM.give('shawl'); await say('Тёплый ещё.'); },
      },
      { id: 'clock', name: 'Ходики', rect: [1180, 100, 76, 240], look: () => say(`Ходики показывают ${OM.ch4.fmt(OM.ch4.time())}. В зеркале на них — тринадцать минут первого.`) },
      { id: 'books', name: 'Книги', rect: [1162, 356, 118, 244], look: 'Чехов, Паустовский, «Справочник по рыболовству». И «Всё обо всём», том «З». Купила у меня. Сегодня.' },
    ],
    setup() {
      st.p = 0; st.radio = OM.flag('radioDead') ? 'dead' : 'on'; st.covered = false; st.failing = false; st.done = false; st.stepT = 2; st.active = false; st.cover = 0;
      vera.x = VSTART; vera.y = 640; vera.face = 1; vera.target = null;
      if (OM.flag('tookShawl') && !OM.has('shawl')) OM.flag('tookShawl', 0);
    },
    leave() { G.fx.warp = 0; S.tension(0); },
    async enter() {
      if (OM.flag('saved_library')) return;
      OM.letterbox(true);
      await OM.wait(500);
      await say('Вера! — Не обернулась.');
      await say('Идёт к трюмо. Шаг. Ещё шаг. Как по воде.');
      S.staticNoise(1, 0.08);
      await OM.say('spidola', '…Верочка… иди ко мне…', { italic: true });
      OM.letterbox(false);
      OM.toast('Вера идёт к зеркалу. Остановите её, пока она не дошла.');
      st.active = true;
    },
    resume() { st.active = true; },
  });
  OM.veraflat = { st, vera };
})();
