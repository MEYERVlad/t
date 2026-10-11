// Глава 3. Берег на закате. Вода ушла — из ила поднялись печные трубы, кресты и фундаменты Покровского.
(function () {
  const P = OM.P, S = OM.S, G = OM.G, A = OM.Actors;
  const { hex, rng, W, H } = OM;
  const say = (t) => OM.say('lev', t);
  const HZ = 420; // линия горизонта
  const SUN = { x: 880, y: 392 };
  const CHURCH = { x: 1010, y: HZ };
  const KEY = { x: 700, y: 640 };
  const st = { gulls: [{ x: 300, y: 160, p: 0 }, { x: 360, y: 190, p: 2 }, { x: 1100, y: 130, p: 4 }] };

  function chimney(g, x, yb, h, w, seed) {
    const r = rng(seed);
    P.fillV(g, x - w / 2, yb - h, w, h, [[0, '#6a3a2e'], [1, '#3a2018']]);
    for (let y = yb - h; y < yb; y += 6) {
      g.fillStyle = 'rgba(0,0,0,.25)';
      g.fillRect(x - w / 2, y, w, 1);
      for (let xx = x - w / 2 + ((y / 6) % 2) * 6; xx < x + w / 2; xx += 12) g.fillRect(xx, y, 1, 6);
    }
    g.fillStyle = '#2a1a14';
    g.fillRect(x - w / 2 - 3, yb - h - 5, w + 6, 6);
    // обломанный верх, мох и водоросли снизу
    g.fillStyle = 'rgba(70,90,50,.6)';
    for (let i = 0; i < 12; i++) g.fillRect(x - w / 2 + r() * w, yb - r() * 18, 2 + r() * 4, 4 + r() * 10);
    g.fillStyle = 'rgba(255,190,140,.18)';
    g.fillRect(x + w / 2 - 4, yb - h, 4, h);
  }

  function paint(g) {
    // небо заката
    P.fillV(g, 0, 0, W, HZ, [[0, '#1c2140'], [0.35, '#4a3456'], [0.62, '#a8545a'], [0.85, '#e88a5e'], [1, '#f6b878']]);
    P.stars(g, 31, 60, 160, 0.5);
    // вытянутые облака, подсвеченные снизу
    const r = rng(301);
    for (let i = 0; i < 16; i++) {
      const y = 60 + r() * 270, x = r() * W, w = 140 + r() * 360, h = 6 + r() * 14;
      g.fillStyle = P.vgrad(g, y - h, y + h, [[0, 'rgba(60,40,70,.55)'], [0.6, 'rgba(110,60,80,.5)'], [1, hex(y > 250 ? '#ffb080' : '#e07a70', 0.75)]]);
      g.beginPath();
      g.ellipse(x, y, w / 2, h, 0, 0, Math.PI * 2);
      g.fill();
    }
    // солнце
    P.glow(g, SUN.x, SUN.y, 420, '#ff9a50', 0.35);
    P.glow(g, SUN.x, SUN.y, 90, '#ffd8a0', 0.7);
    g.fillStyle = '#fff0c8';
    g.beginPath();
    g.arc(SUN.x, SUN.y, 24, 0, Math.PI * 2);
    g.fill();
    // облако поперёк солнца
    g.fillStyle = 'rgba(120,60,70,.75)';
    g.beginPath();
    g.ellipse(SUN.x + 40, SUN.y + 6, 160, 5, 0, 0, Math.PI * 2);
    g.fill();
    // дальний берег
    P.forest(g, 302, { yb: HZ + 2, hMin: 12, hMax: 34, color: '#2e1e30', step: [6, 12] });
    g.fillStyle = '#2e1e30';
    g.fillRect(0, HZ - 2, W, 6);
    // церковь посреди озера: четверик, барабан, купол, колокольня
    const cx = CHURCH.x, cy = HZ + 2;
    g.fillStyle = '#2a1c2c';
    g.fillRect(cx - 50, cy - 70, 100, 70);
    g.fillRect(cx - 24, cy - 108, 48, 40);
    g.beginPath();
    g.moveTo(cx - 28, cy - 106);
    g.quadraticCurveTo(cx - 30, cy - 140, cx, cy - 156);
    g.quadraticCurveTo(cx + 30, cy - 140, cx + 28, cy - 106);
    g.fill();
    g.fillRect(cx - 1.5, cy - 182, 3, 28);
    g.fillRect(cx - 9, cy - 174, 18, 2.5);
    g.save();
    g.translate(cx, cy - 166);
    g.rotate(-0.35);
    g.fillRect(-6, -1, 12, 2);
    g.restore();
    // колокольня слева от храма
    g.fillRect(cx - 98, cy - 130, 30, 130);
    g.beginPath();
    g.moveTo(cx - 102, cy - 130);
    g.lineTo(cx - 83, cy - 168);
    g.lineTo(cx - 64, cy - 130);
    g.fill();
    g.fillStyle = 'rgba(255,170,110,.55)';
    g.fillRect(cx - 90, cy - 118, 14, 22);
    g.fillStyle = 'rgba(255,200,150,.45)';
    g.fillRect(cx + 26, cy - 106, 2, 38);
    g.fillRect(cx + 49, cy - 70, 2, 70);

    // ---- вода: отражение неба и дальнего берега ----
    const ps = g.getTransform().a;
    g.save();
    g.setTransform(1, 0, 0, -1, 0, 2 * HZ * ps);
    g.globalAlpha = 0.62;
    g.filter = 'blur(1.5px)';
    g.drawImage(g.canvas, 0, (HZ - 160) * ps, W * ps, 160 * ps, 0, (HZ - 160) * ps, W * ps, 160 * ps);
    g.restore();
    g.filter = 'none';
    P.fillV(g, 0, HZ, W, 160, [[0, 'rgba(40,20,40,.15)'], [1, 'rgba(30,16,30,.55)']]);
    for (let y = HZ + 2; y < HZ + 160; y += 2 + (y - HZ) * 0.05) {
      g.fillStyle = `rgba(255,220,180,${0.04 + r() * 0.05})`;
      g.fillRect(0, y, W, 1);
    }

    // ---- обнажившееся дно: ил, лужи, фундаменты ----
    const MUD = 548;
    g.fillStyle = '#3a2a24';
    g.beginPath();
    g.moveTo(0, 520);
    g.quadraticCurveTo(300, 532, 560, MUD);
    g.quadraticCurveTo(900, 566, 1280, 580);
    g.lineTo(1280, 720);
    g.lineTo(0, 720);
    g.fill();
    P.fillV(g, 0, 520, W, 200, [[0, 'rgba(90,60,50,.4)'], [0.5, 'rgba(40,28,24,.2)'], [1, 'rgba(10,6,6,.6)']]);
    // мокрый блеск ила
    for (let i = 0; i < 70; i++) {
      const x = r() * W, y = 560 + r() * 160;
      g.fillStyle = `rgba(255,170,120,${0.05 + r() * 0.08})`;
      g.fillRect(x, y, 10 + r() * 50, 1.2);
    }
    // лужи, отражающие закат
    [[300, 600, 90, 9], [820, 650, 140, 12], [1150, 610, 70, 7], [520, 690, 110, 10]].forEach(([x, y, w, h]) => {
      g.save();
      g.beginPath();
      g.ellipse(x, y, w, h, 0, 0, Math.PI * 2);
      g.clip();
      P.fillV(g, x - w, y - h, w * 2, h * 2, [[0, '#f0a070'], [1, '#8a4a5a']]);
      g.restore();
    });
    // фундаменты домов
    [[380, 590, 120, 26], [940, 610, 150, 30], [180, 650, 90, 22]].forEach(([x, y, w, h]) => {
      g.strokeStyle = '#5a4a40';
      g.lineWidth = 5;
      g.strokeRect(x - w / 2, y - h / 2, w, h);
      g.strokeStyle = 'rgba(0,0,0,.35)';
      g.lineWidth = 1;
      g.strokeRect(x - w / 2 + 3, y - h / 2 + 3, w - 6, h - 6);
    });
    // печные трубы
    chimney(g, 430, 586, 92, 26, 303);
    chimney(g, 1010, 604, 120, 30, 304);
    chimney(g, 1210, 590, 70, 22, 305);
    // колодец с журавлём
    g.fillStyle = '#4a3a30';
    g.fillRect(250, 600, 40, 30);
    g.strokeStyle = '#2a1e18';
    g.lineWidth = 4;
    g.beginPath();
    g.moveTo(270, 600);
    g.lineTo(270, 470);
    g.moveTo(210, 520);
    g.lineTo(340, 455);
    g.stroke();
    g.lineWidth = 1.2;
    g.beginPath();
    g.moveTo(330, 460);
    g.lineTo(330, 560);
    g.stroke();
    // покосившиеся кресты старого кладбища
    [[1090, 650, -0.2], [1130, 640, 0.15], [1165, 662, -0.08], [1205, 648, 0.3]].forEach(([x, y, a]) => {
      g.save();
      g.translate(x, y);
      g.rotate(a);
      g.fillStyle = '#2a1e1a';
      g.fillRect(-2.5, -46, 5, 50);
      g.fillRect(-13, -36, 26, 4);
      g.fillRect(-9, -26, 18, 3);
      g.restore();
    });
    // колесо телеги, наполовину в иле
    g.strokeStyle = '#3a2a20';
    g.lineWidth = 4;
    g.beginPath();
    g.arc(620, 700, 28, Math.PI * 1.05, Math.PI * 1.95);
    g.stroke();
    g.lineWidth = 2;
    for (let i = 0; i < 4; i++) {
      const a = Math.PI * (1.1 + i * 0.25);
      g.beginPath();
      g.moveTo(620, 700);
      g.lineTo(620 + Math.cos(a) * 28, 700 + Math.sin(a) * 28);
      g.stroke();
    }

    // ---- берег слева: трава, берёза, часовня ----
    g.fillStyle = '#2a2a1e';
    g.beginPath();
    g.moveTo(0, 470);
    g.quadraticCurveTo(160, 470, 260, 540);
    g.quadraticCurveTo(200, 600, 0, 610);
    g.fill();
    P.birch(g, 250, 540, 260, 306, { w: 6, lean: -0.04, light: '#d8c8b0', shade: '#6a5a50' });
    for (let i = 0; i < 40; i++) {
      g.fillStyle = hex(['#e0a040', '#c88a30', '#f0c060'][i % 3], 0.8);
      g.beginPath();
      g.ellipse(200 + r() * 110, 300 + r() * 160, 3, 2, r() * 3, 0, Math.PI * 2);
      g.fill();
    }
    // часовня из брёвен
    const hx = 120, hy = 540;
    for (let i = 0; i < 12; i++) {
      P.fillV(g, hx - 60, hy - 12 - i * 10, 120, 10, [[0, '#7a5a40'], [1, '#4a3424']]);
      g.fillStyle = '#3a2618';
      g.beginPath();
      g.arc(hx - 60, hy - 7 - i * 10, 5, 0, Math.PI * 2);
      g.arc(hx + 60, hy - 7 - i * 10, 5, 0, Math.PI * 2);
      g.fill();
    }
    g.fillStyle = '#3a2a22';
    g.beginPath();
    g.moveTo(hx - 70, hy - 128);
    g.lineTo(hx, hy - 178);
    g.lineTo(hx + 70, hy - 128);
    g.fill();
    // маковка с лемехом
    g.fillStyle = '#5a6a6a';
    g.beginPath();
    g.moveTo(hx - 13, hy - 176);
    g.quadraticCurveTo(hx - 20, hy - 196, hx, hy - 214);
    g.quadraticCurveTo(hx + 20, hy - 196, hx + 13, hy - 176);
    g.fill();
    g.strokeStyle = 'rgba(0,0,0,.3)';
    g.lineWidth = 0.8;
    for (let k = 0; k < 6; k++) { g.beginPath(); g.arc(hx, hy - 214 + k * 7, 14, 0.5, Math.PI - 0.5); g.stroke(); }
    g.fillStyle = '#c9a050';
    g.fillRect(hx - 1, hy - 238, 2, 26);
    g.fillRect(hx - 7, hy - 230, 14, 2);
    g.fillStyle = 'rgba(255,200,140,.25)';
    g.fillRect(hx + 8, hy - 212, 4, 30);
    // дверь часовни с замком
    P.fillV(g, hx - 18, hy - 76, 36, 76, [[0, '#3a2414'], [1, '#2a180c']]);
    g.fillStyle = '#8a8a80';
    g.fillRect(hx + 8, hy - 42, 7, 9);

    // лодка Никодима на иле, цепь к колу
    const bx = 680, by = 600;
    g.fillStyle = '#4a3a2c';
    g.beginPath();
    g.moveTo(bx - 90, by - 26);
    g.quadraticCurveTo(bx - 20, by - 18, bx + 96, by - 34);
    g.quadraticCurveTo(bx + 80, by + 4, bx + 20, by + 8);
    g.lineTo(bx - 70, by + 6);
    g.quadraticCurveTo(bx - 92, by - 6, bx - 90, by - 26);
    g.fill();
    g.fillStyle = '#6a5440';
    g.fillRect(bx - 86, by - 28, 180, 5);
    g.strokeStyle = 'rgba(0,0,0,.3)';
    g.lineWidth = 1;
    for (let k = 0; k < 3; k++) { g.beginPath(); g.moveTo(bx - 80, by - 16 + k * 7); g.quadraticCurveTo(bx, by - 10 + k * 7, bx + 86, by - 24 + k * 6); g.stroke(); }
    g.fillStyle = '#2a1e16';
    g.fillRect(bx - 40, by - 24, 6, 6);
    g.fillRect(bx + 20, by - 26, 6, 6);
    g.strokeStyle = '#6a6a62';
    g.lineWidth = 1.5;
    g.setLineDash([3, 2]);
    g.beginPath();
    g.moveTo(bx - 88, by - 20);
    g.quadraticCurveTo(bx - 120, by + 10, bx - 150, by + 4);
    g.stroke();
    g.setLineDash([]);
    g.fillStyle = '#3a2a1c';
    g.fillRect(bx - 154, by - 24, 6, 34);
    // кострище, тренога, котелок
    g.fillStyle = '#1a1210';
    g.beginPath();
    g.ellipse(460, 650, 30, 7, 0, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = '#2a1e18';
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(436, 652); g.lineTo(460, 600); g.lineTo(484, 652);
    g.stroke();
    g.fillStyle = '#2a2a28';
    g.beginPath();
    g.arc(460, 622, 10, 0, Math.PI);
    g.fill();
    P.paper(g, 307, 0.07);
  }

  function front(g) {
    const r = rng(308);
    g.strokeStyle = '#1a1612';
    g.lineCap = 'round';
    for (let i = 0; i < 90; i++) {
      const x = r() < 0.6 ? r() * 200 : 1120 + r() * 160, h = 30 + r() * 110;
      g.lineWidth = 1.2 + r() * 2;
      g.beginPath();
      g.moveTo(x, 724);
      g.quadraticCurveTo(x + (r() - 0.3) * 30, 720 - h * 0.6, x + (r() - 0.2) * 40, 720 - h);
      g.stroke();
    }
  }

  function back(ctx, t) {
    // солнечная дорожка
    for (let i = 0; i < 22; i++) {
      const y = HZ + 4 + i * 5 + i * i * 0.12;
      if (y > 540) break;
      const w = 18 + i * 5 + Math.sin(t * 1.6 + i * 1.9) * 10;
      ctx.fillStyle = `rgba(255,220,160,${0.5 - i * 0.02})`;
      ctx.fillRect(SUN.x - w / 2 + Math.sin(t + i * 2.4) * (4 + i), y, w, 1.5);
    }
    // далёкие фигуры в воде
    for (let i = 0; i < 5; i++) {
      const x = 640 + i * 70 + Math.sin(i * 7) * 30, y = HZ + 22 + (i % 2) * 6;
      ctx.fillStyle = 'rgba(30,18,30,.85)';
      ctx.fillRect(x - 1.2, y - 22, 2.4, 22);
      ctx.beginPath();
      ctx.arc(x, y - 24, 2, 0, Math.PI * 2);
      ctx.fill();
    }
    // костёр
    const fl = 0.8 + Math.sin(t * 11) * 0.1 + Math.sin(t * 7.3) * 0.1;
    P.glow(ctx, 460, 640, 160, '#ff8a30', 0.35 * fl);
    for (let i = 0; i < 6; i++) {
      ctx.fillStyle = hex(['#ffcf60', '#ff9a30', '#ff6a20'][i % 3], 0.85);
      ctx.beginPath();
      ctx.ellipse(450 + i * 4, 642 - Math.abs(Math.sin(t * 9 + i)) * 4, 3, 8 + Math.sin(t * 13 + i * 2) * 4, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    for (let i = 0; i < 6; i++) {
      const k = (t * 0.2 + i / 6) % 1;
      ctx.fillStyle = `rgba(80,70,80,${0.25 * (1 - k)})`;
      ctx.beginPath();
      ctx.arc(462 + Math.sin(t + i) * 10 * k, 610 - k * 140, 6 + k * 18, 0, Math.PI * 2);
      ctx.fill();
    }
    // чайки
    st.gulls.forEach((gl) => {
      gl.x += 0.3;
      if (gl.x > W + 20) gl.x = -20;
      const flap = Math.sin(t * 5 + gl.p) * 5;
      ctx.strokeStyle = 'rgba(30,20,30,.8)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(gl.x - 9, gl.y + flap);
      ctx.quadraticCurveTo(gl.x - 4, gl.y - 3, gl.x, gl.y);
      ctx.quadraticCurveTo(gl.x + 4, gl.y - 3, gl.x + 9, gl.y + flap);
      ctx.stroke();
    });
    // ключ блестит в луже (виден в режиме нитей — и чуть-чуть без него)
    if (!OM.flag('gotChapelKey')) {
      const k = 0.15 + (G.threadsK || 0) * 0.85;
      P.glow(ctx, KEY.x, KEY.y, 14, '#fff0c0', k * (0.6 + 0.4 * Math.sin(t * 4)));
    }
  }

  function over(ctx, t) {
    P.fogBand(ctx, t, HZ + 30, 70, 5, 0.22);
  }

  // Нити: от Никодима — в воду, от Льва — к церкви, от двери часовни — к ключу.
  function threads(ctx, t, k) {
    const h = G.hero;
    const lx = h.x, ly = h.y - 110 * h.s;
    OM.thread(ctx, [lx, ly], [CHURCH.x, CHURCH.y - 90], t, { color: '#ffd27a', a: k, sag: -60, w: 2.2 });
    OM.thread(ctx, [nik.x, nik.y - 120], [nik.x + 160, HZ + 40], t, { color: '#9ab8d8', a: k * 0.7, sag: 40 });
    if (!OM.flag('gotChapelKey')) OM.thread(ctx, [140, 500], [KEY.x, KEY.y], t, { color: '#e8f0ff', a: k, sag: 50, w: 1.6 });
    for (let i = 0; i < 5; i++) {
      const x = 640 + i * 70 + Math.sin(i * 7) * 30;
      OM.thread(ctx, [x, HZ + 2], [CHURCH.x, CHURCH.y - 40], t + i, { color: '#7a90b0', a: k * 0.5, sag: -10, w: 1 });
    }
  }

  const nik = OM.actor({ id: 'nik', x: 520, y: 640, face: -1, draw: (c, a, t) => A.nikodim(c, a, t), litByScene: true });

  OM.scene('shore', {
    name: 'Берег Покровского',
    surface: 'wet',
    figLight: { amb: 0.62, tint: '#8a5a5a', side: 1 },
    amb: { wind: 0.5, water: 0.5, drone: 0.2 },
    walk: [[40, 612], [1150, 612], [1150, 706], [40, 706]],
    depth: { y0: 612, s0: 0.92, y1: 706, s1: 1.04 },
    entries: { default: { x: 90, y: 650, face: 1 }, boat: { x: 640, y: 640, face: 1 } },
    lights: [
      { x: SUN.x, y: SUN.y, color: '#ffb070', a: 0.9, reach: 1200 },
      { x: 460, y: 630, color: '#ff8a30', a: 0.7, reach: 240 },
    ],
    actors: () => [nik],
    paint,
    front,
    back,
    over,
    threads,
    hotspots: [
      { id: 'sun', name: 'Закат', rect: [820, 340, 120, 80], look: 'Солнце садится прямо за купол. Будто его кто-то туда опускает.' },
      {
        id: 'church', name: 'Церковь Покрова', rect: [900, 230, 140, 200],
        look: ['Церковь. Первый раз за сорок лет её видно целиком — по пояс из воды.', 'И колокольня. На ней — ни одного колокола. Или так кажется.'],
      },
      { id: 'chimneys', name: 'Печные трубы', rect: [400, 490, 70, 100], look: 'Печные трубы. Здесь стояли дома. Сорок лет под водой — и стоят. Как часовые.' },
      { id: 'chimney2', name: 'Печная труба', rect: [990, 480, 50, 130], look: 'Ещё одна труба. Кирпичи обросли тиной. На одном выцарапано: «Таня + Коля».' },
      { id: 'crosses', name: 'Старое кладбище', rect: [1070, 600, 160, 70], look: 'Кресты старого кладбища. Деревянные — простояли под водой сорок лет и не сгнили. Так не бывает.' },
      { id: 'well', name: 'Колодец', rect: [200, 450, 150, 180], look: 'Колодец-журавль. Колодец посреди озера. Самая бессмысленная вещь на свете.' },
      {
        id: 'boat', name: 'Лодка', rect: [580, 560, 200, 60], walk: [620, 640], face: 1,
        look: () => (OM.has('oars') ? say('Лодка Никодима. Вёсла есть. Пора.') : say('Лодка Никодима. Цепь, кол, а вёсел нет.')),
        use: async () => {
          if (!OM.has('oars')) return say('Без вёсел далеко не уплыть. Разве что руками грести — но не до церкви.');
          return OM.story3.toBoat();
        },
        items: { oars: () => OM.story3.toBoat() },
      },
      {
        id: 'chapel', name: 'Часовня', rect: [50, 300, 140, 240], walk: [150, 630], face: -1,
        look: () => (OM.flag('chapelOpen') ? say('Часовня открыта. Внутри пахнет воском и сырым деревом.') : say('Часовня из брёвен. На двери — амбарный замок.')),
        use: async () => {
          if (!OM.flag('chapelOpen')) { S.lockRattle(); return say('Заперто.'); }
          if (OM.has('oars')) return say('Больше там ничего нет. Только иконка и огарок свечи.');
          return OM.story3.chapelLoot();
        },
        items: {
          chapelkey: async () => {
            S.unlock();
            OM.take('chapelkey');
            OM.flag('chapelOpen', 1);
            await say('Замок поддался с третьего раза.');
            await OM.story3.chapelLoot();
          },
        },
      },
      {
        id: 'nik', name: 'Отец Никодим', rect: () => [nik.x - 35, nik.y - 205, 70, 205], walk: () => [nik.x - 90, 650], face: 1,
        look: 'Отец Никодим. Подрясник, борода до груди, руки рыбака. Священник, у которого церковь — под водой.',
        use: () => OM.story3.talkNik(),
      },
      {
        id: 'keyspot', name: 'Блик в луже', when: () => G.threads && !OM.flag('gotChapelKey'),
        rect: [KEY.x - 26, KEY.y - 20, 52, 40], walk: [KEY.x - 30, 650], face: 1,
        look: 'Нить от двери часовни уходит сюда. В луже что-то есть.',
        use: async () => {
          G.hero.pose = 'reach';
          S.splash();
          await OM.wait(600);
          G.hero.pose = null;
          OM.flag('gotChapelKey', 1);
          OM.give('chapelkey');
          OM.toggleThreads(false);
          await say('Ключ. Большой, кованый. Пролежал в воде с весны — и ни пятнышка ржавчины.');
        },
      },
      { id: 'exitL', name: 'Назад, в город', rect: [0, 560, 30, 160], look: 'Город — там. Но мне сейчас не туда.' },
    ],
    async enter(entry) {
      if (entry === 'default' && !OM.flag('shoreSeen')) {
        OM.flag('shoreSeen', 1);
        await OM.story3.arrive();
      }
    },
  });

  OM.shore = { nik };
})();
