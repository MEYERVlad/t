// Глава 3. Церковь Покрова изнутри: вода вместо пола, мостки, «прихожане» — и колокольня.
(function () {
  const P = OM.P, S = OM.S, G = OM.G, A = OM.Actors;
  const { hex, rng, W, H, lerp, clamp } = OM;
  const say = (t) => OM.say('lev', t);
  const WL = 566; // уровень воды
  const FONT = { x: 910, y: 600 };
  const st = { gaze: 0, failing: false, sparks: [] };

  // ---------- Фреска: святой в нимбе, выцветший ----------
  function saint(g, x, y, h, seed) {
    const r = rng(seed);
    const robe = ['#8a3a2a', '#3a4a6a', '#9a7a3a', '#5a3a4a'][(r() * 4) | 0];
    const mant = ['#c8a050', '#6a2a2a', '#2a3a5a', '#7a8a6a'][(r() * 4) | 0];
    g.save();
    g.globalAlpha = 0.75;
    // нимб
    g.fillStyle = '#c9a050';
    g.beginPath();
    g.arc(x, y, h * 0.11, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = '#7a5a2a';
    g.lineWidth = 2;
    g.stroke();
    // лик
    g.fillStyle = '#c8a088';
    g.beginPath();
    g.ellipse(x, y + 2, h * 0.055, h * 0.07, 0, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = 'rgba(60,30,20,.5)';
    g.fillRect(x - h * 0.03, y - h * 0.005, h * 0.018, h * 0.008);
    g.fillRect(x + h * 0.012, y - h * 0.005, h * 0.018, h * 0.008);
    g.fillRect(x - 1, y + h * 0.015, 2, h * 0.03);
    // одежды
    g.fillStyle = robe;
    g.beginPath();
    g.moveTo(x - h * 0.08, y + h * 0.08);
    g.lineTo(x - h * 0.14, y + h);
    g.lineTo(x + h * 0.14, y + h);
    g.lineTo(x + h * 0.08, y + h * 0.08);
    g.fill();
    g.fillStyle = mant;
    g.beginPath();
    g.moveTo(x - h * 0.09, y + h * 0.09);
    g.quadraticCurveTo(x + h * 0.12, y + h * 0.4, x + h * 0.13, y + h * 0.75);
    g.lineTo(x - h * 0.05, y + h * 0.7);
    g.fill();
    g.strokeStyle = 'rgba(0,0,0,.25)';
    g.lineWidth = 1.2;
    for (let i = 0; i < 5; i++) {
      g.beginPath();
      g.moveTo(x - h * 0.06 + i * h * 0.03, y + h * 0.15);
      g.lineTo(x - h * 0.1 + i * h * 0.05, y + h * 0.98);
      g.stroke();
    }
    // благословляющая рука
    g.fillStyle = '#c8a088';
    g.beginPath();
    g.ellipse(x + h * 0.03, y + h * 0.25, h * 0.018, h * 0.03, 0.3, 0, Math.PI * 2);
    g.fill();
    g.restore();
    // осыпь: пятна голой штукатурки
    for (let i = 0; i < 6; i++) {
      g.fillStyle = `rgba(110,106,96,${0.25 + r() * 0.25})`;
      g.beginPath();
      g.ellipse(x + (r() - 0.5) * h * 0.4, y + r() * h, 4 + r() * 10, 3 + r() * 6, r() * 3, 0, Math.PI * 2);
      g.fill();
    }
  }

  function paint(g) {
    const r = rng(601);
    // стены: известь, сырость, плесень
    P.fillV(g, 0, 0, W, WL, [[0, '#1a1e26'], [0.3, '#3a3e44'], [1, '#5a5a54']]);
    P.speckle(g, 602, 0, 0, W, WL, 6000, '#000', 0.3);
    // своды и арки
    g.fillStyle = '#121418';
    g.fillRect(0, 0, W, 60);
    [[0, 420], [420, 860]].forEach(([a, b]) => {
      g.strokeStyle = '#2a2c30';
      g.lineWidth = 26;
      g.beginPath();
      g.arc((a + b) / 2, 330, (b - a) / 2, Math.PI, 0);
      g.stroke();
    });
    // фрески
    saint(g, 120, 200, 260, 603);
    saint(g, 250, 210, 250, 604);
    saint(g, 560, 190, 270, 605);
    saint(g, 700, 205, 255, 606);
    // надпись по фризу (церковнославянской вязью — условно)
    g.fillStyle = 'rgba(150,40,30,.5)';
    for (let x = 30; x < 940; x += 14) g.fillRect(x, 150 + Math.sin(x) * 1, 9, 6);
    // отметины старых уровней воды — «кольца ванны»
    for (let i = 0; i < 7; i++) {
      const y = WL - 20 - i * 34 - r() * 8;
      g.fillStyle = `rgba(30,40,36,${0.25 - i * 0.025})`;
      g.fillRect(0, y, 980, 4 + r() * 4);
      g.fillStyle = `rgba(90,110,70,${0.15 - i * 0.015})`;
      g.fillRect(0, y + 4, 980, 2);
    }
    // потёки
    for (let i = 0; i < 40; i++) {
      const x = r() * 980;
      g.fillStyle = P.vgrad(g, 60, 60 + 100 + r() * 300, [[0, 'rgba(20,24,20,.3)'], [1, 'rgba(20,24,20,0)']]);
      g.fillRect(x, 60, 2 + r() * 4, 400);
    }
    // колонны
    [420, 860].forEach((x) => {
      P.fillV(g, x - 26, 60, 52, WL, [[0, '#2a2c30'], [1, '#4a4a44']]);
      g.fillStyle = P.hgrad(g, x - 26, x + 26, [[0, 'rgba(0,0,0,.4)'], [0.4, 'rgba(255,255,255,.06)'], [1, 'rgba(0,0,0,.5)']]);
      g.fillRect(x - 26, 60, 52, WL);
    });
    // высокие окна
    [300, 640].forEach((x) => {
      g.fillStyle = '#0a0e18';
      g.beginPath();
      g.moveTo(x - 22, 140);
      g.lineTo(x - 22, 80);
      g.arc(x, 80, 22, Math.PI, 0);
      g.lineTo(x + 22, 140);
      g.fill();
      g.fillStyle = 'rgba(160,180,220,.5)';
      g.fillRect(x - 18, 70, 36, 66);
      g.fillStyle = '#0a0e18';
      g.fillRect(x - 1, 60, 2, 80);
      g.fillRect(x - 22, 100, 44, 2);
    });
    // вход на колокольню: арка слева
    g.fillStyle = '#0c0e12';
    g.beginPath();
    g.moveTo(30, WL);
    g.lineTo(30, 300);
    g.arc(85, 300, 55, Math.PI, 0);
    g.lineTo(140, WL);
    g.fill();
    for (let i = 0; i < 8; i++) {
      g.fillStyle = `rgba(80,80,80,${0.2 + i * 0.04})`;
      g.fillRect(40 + i * 10, WL - 30 - i * 28, 80 - i * 10, 6);
    }

    // ---- иконостас ----
    const IX = 990;
    P.fillV(g, IX, 120, W - IX, WL - 120 + 40, [[0, '#3a2a14'], [1, '#2a1a0a']]);
    for (let tier = 0; tier < 4; tier++) {
      const ty = 140 + tier * 108;
      g.fillStyle = '#b8903a';
      g.fillRect(IX, ty - 6, W - IX, 6);
      for (let k = 0; k < 4; k++) {
        const x = IX + 14 + k * 68;
        const missing = r() < 0.3;
        g.fillStyle = '#c9a050';
        g.fillRect(x - 3, ty + 4, 58, 92);
        if (missing) {
          g.fillStyle = '#0a0806';
          g.fillRect(x, ty + 7, 52, 86);
          continue;
        }
        P.fillV(g, x, ty + 7, 52, 86, [[0, '#6a4a28'], [1, '#3a2614']]);
        g.fillStyle = 'rgba(220,180,90,.75)';
        g.beginPath();
        g.arc(x + 26, ty + 28, 13, 0, Math.PI * 2);
        g.fill();
        g.fillStyle = '#8a6a50';
        g.beginPath();
        g.ellipse(x + 26, ty + 30, 7, 9, 0, 0, Math.PI * 2);
        g.fill();
        g.fillStyle = ['#6a2a22', '#2a3a5a', '#4a5a3a'][k % 3];
        g.fillRect(x + 12, ty + 42, 28, 46);
      }
    }
    // царские врата
    g.fillStyle = '#0a0806';
    g.beginPath();
    g.moveTo(IX + 90, WL + 30);
    g.lineTo(IX + 90, 420);
    g.arc(IX + 145, 420, 55, Math.PI, 0);
    g.lineTo(IX + 200, WL + 30);
    g.fill();
    g.strokeStyle = '#c9a050';
    g.lineWidth = 3;
    g.stroke();
    // солея — каменный помост перед иконостасом, над водой
    P.fillV(g, 860, 596, W - 860, 30, [[0, '#6a6a62'], [1, '#3a3a36']]);
    g.fillStyle = 'rgba(255,255,255,.08)';
    g.fillRect(860, 596, W - 860, 2);
    // купель
    P.fillV(g, FONT.x - 34, FONT.y - 44, 68, 44, [[0, '#8a8a80'], [1, '#4a4a44']]);
    g.fillStyle = '#9a9a90';
    g.beginPath();
    g.ellipse(FONT.x, FONT.y - 44, 38, 8, 0, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#0a1418';
    g.beginPath();
    g.ellipse(FONT.x, FONT.y - 44, 32, 5.5, 0, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#5a5a54';
    g.fillRect(FONT.x - 12, FONT.y, 24, 6);

    // ---- вода: отражение стен ----
    const ps = g.getTransform().a;
    g.save();
    g.setTransform(1, 0, 0, -1, 0, 2 * WL * ps);
    g.globalAlpha = 0.5;
    g.filter = 'blur(2px)';
    g.drawImage(g.canvas, 0, (WL - 154) * ps, W * ps, 154 * ps, 0, (WL - 154) * ps, W * ps, 154 * ps);
    g.restore();
    g.filter = 'none';
    P.fillV(g, 0, WL, W, H - WL, [[0, 'rgba(10,30,34,.45)'], [1, 'rgba(4,10,14,.9)']]);
    for (let y = WL + 2; y < H; y += 3 + (y - WL) * 0.04) {
      g.fillStyle = `rgba(160,200,210,${0.03 + r() * 0.04})`;
      g.fillRect(0, y, W, 1);
    }
    P.paper(g, 607, 0.08);
  }

  // Мостки: доски от скамей, балки — по ним идёт Лев.
  function walkway(g) {
    const r = rng(608);
    for (let x = 0; x < 880; x += 0) {
      const w = 60 + r() * 60;
      const y = 600 + (r() - 0.5) * 4;
      g.save();
      g.translate(x + w / 2, y + 8);
      g.rotate((r() - 0.5) * 0.04);
      P.fillV(g, -w / 2, -9, w, 18, [[0, '#5a4630'], [0.5, '#3a2c1c'], [1, '#1e160e']]);
      g.fillStyle = 'rgba(255,220,170,.1)';
      g.fillRect(-w / 2, -9, w, 1.5);
      g.strokeStyle = 'rgba(0,0,0,.4)';
      g.lineWidth = 1;
      g.strokeRect(-w / 2, -9, w, 18);
      g.restore();
      // сваи из спинок скамей
      g.fillStyle = '#1a120a';
      g.fillRect(x + 6, y + 14, 6, 40);
      x += w + 2;
    }
    // отражение мостков
    g.fillStyle = 'rgba(20,14,8,.4)';
    g.fillRect(0, 626, 880, 10);
  }
  // Полоса воды над ногами заднего ряда.
  function waterBand(g) {
    P.fillV(g, 0, WL + 4, 860, 30, [[0, 'rgba(14,34,40,.92)'], [1, 'rgba(10,24,30,.96)']]);
    g.fillStyle = 'rgba(170,210,220,.15)';
    g.fillRect(0, WL + 4, 860, 1);
  }
  function front(g) {
    P.fillV(g, 0, 660, W, 60, [[0, 'rgba(8,24,30,.9)'], [1, 'rgba(4,12,16,.98)']]);
    g.fillStyle = 'rgba(170,210,220,.12)';
    g.fillRect(0, 660, W, 1);
  }

  function back(ctx, t) {
    // лучи из окон
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    [300, 640].forEach((x, i) => {
      ctx.fillStyle = P.vgrad(ctx, 80, WL, [[0, 'rgba(160,185,230,.14)'], [1, 'rgba(160,185,230,0)']]);
      ctx.beginPath();
      ctx.moveTo(x - 18, 80);
      ctx.lineTo(x + 18, 80);
      ctx.lineTo(x + 170, WL);
      ctx.lineTo(x + 70, WL);
      ctx.fill();
    });
    // свет из купола
    ctx.fillStyle = P.vgrad(ctx, 0, WL, [[0, 'rgba(190,210,240,.16)'], [1, 'rgba(190,210,240,.02)']]);
    ctx.beginPath();
    ctx.moveTo(560, 0);
    ctx.lineTo(720, 0);
    ctx.lineTo(800, WL);
    ctx.lineTo(500, WL);
    ctx.fill();
    ctx.restore();
    // блики от воды на стенах (каустика)
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineWidth = 1.4;
    for (let k = 0; k < 9; k++) {
      ctx.strokeStyle = `rgba(150,210,220,${0.05 + 0.03 * Math.sin(t * 2 + k)})`;
      ctx.beginPath();
      for (let x = 0; x < 990; x += 12) {
        const y = WL - 30 - k * 14 + Math.sin(x * 0.03 + t * 1.6 + k * 1.3) * 6 + Math.sin(x * 0.011 - t * 0.9 + k) * 5;
        if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ctx.restore();
    // золото иконостаса мерцает
    for (let i = 0; i < 10; i++) {
      const x = 1000 + ((i * 97) % 270), y = 140 + ((i * 61) % 420);
      const a = Math.max(0, Math.sin(t * 1.3 + i * 2.1));
      P.glow(ctx, x, y, 8, '#ffe0a0', 0.4 * a * a);
    }
    // пыль в луче купола
    for (let i = 0; i < 30; i++) {
      const k = (t * 0.02 + i * 0.131) % 1;
      ctx.fillStyle = `rgba(230,240,255,${0.3 * Math.sin(k * Math.PI)})`;
      ctx.fillRect(560 + ((i * 53) % 200) + k * 40, k * WL, 1.5, 1.5);
    }
    // рябь на воде
    for (let i = 0; i < 4; i++) {
      const k = (t * 0.4 + i / 4) % 1;
      ctx.strokeStyle = `rgba(190,220,230,${0.25 * (1 - k)})`;
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.ellipse(200 + i * 230, 690, 6 + k * 50, 1 + k * 5, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    // крестик в купели — блеснёт в режиме нитей
    if (!OM.flag('gotCross')) P.glow(ctx, FONT.x, FONT.y - 46, 12, '#ffd27a', 0.1 + (G.threadsK || 0) * 0.7);
  }

  // «Прихожане»: задний ряд за мостками, передний — между мостками и зрителем.
  const PARISH = [
    { x: 300, y: 650, s: 0.74, z: 560 }, { x: 500, y: 650, s: 0.76, z: 560 }, { x: 690, y: 650, s: 0.72, z: 560 },
    { x: 800, y: 650, s: 0.78, z: 560, mother: true },
    { x: 380, y: 830, s: 0.98, z: 650 }, { x: 600, y: 830, s: 1.0, z: 650 }, { x: 780, y: 830, s: 0.96, z: 650 },
  ];
  const parish = PARISH.map((p, i) => OM.actor({
    id: 'p' + i, x: p.x, y: p.y, s: p.s, z: p.z, face: 1, autoScale: false, seed: i * 1.7, mother: p.mother,
    draw: (c, a, t) => A.tall(c, Object.assign({}, a, { alpha: 1, jitter: 0.6 + st.gaze * 4, body: '#05070a', face2: a.turned ? 2.4 : 0.4 }), t),
  }));
  const headOf = (a) => [a.x + a.face * 14.6 * a.s, a.y - 382 * a.s];

  function threads(ctx, t, k) {
    parish.forEach((a) => {
      const [hx, hy] = headOf(a);
      if (a.mother) {
        if (!OM.flag('gotCross')) OM.thread(ctx, [hx, hy + 60 * a.s], [FONT.x, FONT.y - 46], t, { color: '#ffd27a', a: k, sag: 30, w: 2.2 });
      } else OM.thread(ctx, [hx, hy + 40], [hx + 20, WL + 60], t, { color: '#7a90b0', a: k * 0.6, sag: 10, w: 1 });
    });
    const h = G.hero;
    OM.thread(ctx, [h.x, h.y - 110 * h.s], [70, 260], t, { color: '#ffd27a', a: k * (OM.flag('flashback') ? 1 : 0.25), sag: -20, w: 1.6 });
  }

  function update(dt, t) {
    const h = G.hero;
    // замечают Льва, когда он рядом, — поворачивают головы
    parish.forEach((a) => {
      const near = Math.abs(h.x - a.x) < 230;
      a.turned = near || st.gaze > 0.6;
      a.face = a.turned ? (h.x < a.x ? -1 : 1) : 1;
    });
    if (st.failing || G.vision || G.mode !== 'play') return;
    // взгляд: курсор на лице
    let on = 0;
    if (G.mouse.x >= 0 && (G.mouse.in || G.touch)) {
      parish.forEach((a) => {
        const [hx, hy] = headOf(a);
        const rr = 34 * a.s;
        if (Math.hypot(G.mouse.x - hx, G.mouse.y - hy) < rr) on = Math.max(on, a.turned ? 1.3 : 0.55);
      });
    }
    st.gaze = clamp(st.gaze + (on ? on * dt / 1.4 : -dt * 0.45), 0, 1);
    G.fx.warp = st.gaze * 0.9;
    S.muffle(st.gaze);
    if (on && Math.random() < dt * 2) S.heartbeat();
    if (st.gaze >= 1) {
      st.failing = true;
      OM.run(fail);
    }
  }

  async function fail() {
    S.hit();
    S.whisper(2, 0.2);
    OM.shake(12);
    await OM.fadeTo(1, 500, '#04121a');
    await OM.say('narr', 'Ты посмотрел им в лицо.', { hold: 1.4 });
    st.gaze = 0;
    G.fx.warp = 0;
    S.muffle(0);
    G.hero.x = 160; G.hero.y = 618; G.hero.target = null; G.hero.face = 1;
    await OM.fadeTo(0, 700);
    await say('Не смотреть. Смотреть под ноги. На доски.');
    st.failing = false;
  }

  OM.scene('church', {
    name: 'Церковь Покрова',
    surface: 'wood',
    figLight: { amb: 0.5, tint: '#3a5060', side: 1 },
    amb: { water: 0.6, drone: 0.45, wind: 0.15, indoor: true },
    walk: [[150, 608], [880, 608], [960, 618], [960, 630], [150, 632]],
    depth: { y0: 608, s0: 1.0, y1: 632, s1: 1.02 },
    entries: { default: { x: 160, y: 618, face: 1 }, window: { x: 160, y: 618, face: 1 }, belfry: { x: 170, y: 620, face: 1 } },
    lights: [{ x: 640, y: 40, color: '#b8cce8', a: 0.8, reach: 900 }, { x: 1100, y: 400, color: '#ffcf80', a: 0.4, reach: 400 }],
    layers: [{ z: 590, paint: waterBand }, { z: 600, paint: walkway }],
    actors: () => parish,
    paint,
    front,
    back,
    threads,
    update,
    hotspots: [
      { id: 'frescoes', name: 'Фрески', rect: [60, 160, 760, 140], look: ['Фрески. Святые с выцветшими лицами. Вода смыла им глаза — остались только нимбы.', 'А ниже — полосы на стенах. Уровни воды за сорок лет. Как кольца на пне.'] },
      { id: 'dome', name: 'Свет из купола', rect: [560, 0, 160, 80], look: 'В куполе дыра. Луна заглядывает в храм, как прихожанин, опоздавший на сорок лет.' },
      { id: 'iconostasis', name: 'Иконостас', rect: [990, 120, 290, 440], look: ['Иконостас. Золото облезло, половины икон нет — только тёмные пустые рамы.', 'Пустые рамы смотрят точно так же, как полные.'] },
      {
        id: 'font', name: 'Купель', rect: [FONT.x - 40, FONT.y - 60, 80, 66], walk: [880, 620], face: 1,
        look: () => (OM.flag('gotCross') ? say('Купель. Здесь меня крестили. Сорок один год назад.') : say('Купель. Вода в ней чернее, чем вокруг. И неподвижная.')),
        use: async () => {
          if (OM.flag('gotCross')) return say('Больше там ничего нет.');
          if (!G.threads) return say('Чёрная вода. Ничего не видно. Нужно смотреть иначе.');
          return OM.story3.takeCross();
        },
      },
      {
        id: 'belfry', name: 'Лестница на колокольню', rect: [30, 250, 112, 320], walk: [160, 618], face: -1,
        exit: { to: 'belfry', entry: 'default', dir: 'up', when: () => OM.flag('flashback') },
        look: () => (OM.flag('flashback') ? say('Наверх. К колоколу.') : say('Лестница на колокольню. Ступени скользкие от тины. Потом — сначала то, зачем я здесь.')),
      },
      { id: 'water', name: 'Вода', rect: [0, 660, W, 60], look: 'Вода стоит в храме неподвижно. В ней отражаются святые — вверх ногами, но с глазами.' },
    ],
    setup() {
      st.gaze = 0; st.failing = false;
      S.choir(true);
    },
    leave() { S.choir(false); G.fx.warp = 0; S.muffle(0); },
    async enter(entry) {
      if (entry === 'window' && !OM.flag('churchSeen')) {
        OM.flag('churchSeen', 1);
        await OM.story3.enterChurch();
      }
    },
  });

  OM.church = { st, parish, saint };

  // ---------- Колокольня ----------
  const BELL = { x: 640, y: 300 };
  OM.scene('belfry', {
    name: 'Колокольня',
    surface: 'wood',
    figLight: { amb: 0.45, tint: '#3a4a66', side: -1 },
    amb: { wind: 0.9, water: 0.4, drone: 0.4 },
    walk: [[120, 640], [1160, 640], [1160, 700], [120, 700]],
    depth: { y0: 640, s0: 1.15, y1: 700, s1: 1.25 },
    entries: { default: { x: 200, y: 670, face: 1 } },
    lights: [{ x: 1000, y: 160, color: '#c8d8f0', a: 0.9, reach: 1200 }],
    paint(g) {
      // небо в арках, луна, озеро внизу
      P.fillV(g, 0, 0, W, H, [[0, '#0a1020'], [0.6, '#1e2a44'], [1, '#2a3450']]);
      P.stars(g, 51, 200, 400, 0.8);
      P.moon(g, 1000, 160, 34);
      P.fillV(g, 0, 470, W, 250, [[0, '#24304a'], [1, '#0a1018']]);
      for (let i = 0; i < 30; i++) {
        g.fillStyle = `rgba(200,215,240,${0.25 - i * 0.008})`;
        g.fillRect(1000 - 20 - i * 3 + Math.sin(i) * 8, 476 + i * 7, 40 + i * 6, 1.5);
      }
      // далёкий берег с огоньками города
      P.forest(g, 52, { yb: 472, hMin: 10, hMax: 26, color: '#141a28', step: [5, 10] });
      for (let i = 0; i < 18; i++) {
        g.fillStyle = 'rgba(255,200,120,.8)';
        g.fillRect(80 + i * 23 + Math.sin(i * 3) * 10, 466 + (i % 3), 2, 2);
      }
      // каменные арки звонницы
      g.fillStyle = '#1a1c22';
      g.fillRect(0, 0, W, 60);
      g.fillRect(0, 0, 110, H);
      g.fillRect(W - 110, 0, 110, H);
      g.fillRect(560, 60, 160, 560);
      [[110, 560], [720, 1170]].forEach(([a, b]) => {
        g.beginPath();
        g.moveTo(a, 60);
        g.lineTo(a, 200);
        g.quadraticCurveTo(a + 4, 70, (a + b) / 2, 66);
        g.quadraticCurveTo(b - 4, 70, b, 200);
        g.lineTo(b, 60);
        g.fill();
      });
      P.speckle(g, 53, 0, 0, W, H, 3000, '#000', 0.4);
      // пол из досок
      P.fillV(g, 0, 620, W, 100, [[0, '#3a2c1e'], [1, '#160e08']]);
      for (let x = 0; x < W; x += 50) { g.fillStyle = 'rgba(0,0,0,.4)'; g.fillRect(x, 620, 1.5, 100); }
      // балка
      P.fillV(g, 300, 120, 680, 22, [[0, '#4a3624'], [1, '#22160c']]);
    },
    back(ctx, t) {
      // колокол
      const sw = Math.sin(t * 0.7) * 0.02 + (OM.belfrySwing || 0);
      ctx.save();
      ctx.translate(BELL.x, 142);
      ctx.rotate(sw);
      ctx.fillStyle = '#2a2a24';
      ctx.fillRect(-6, 0, 12, 30);
      ctx.fillStyle = P.hgrad(ctx, -120, 120, [[0, '#2a2620'], [0.35, '#7a6a48'], [0.5, '#9a8a60'], [1, '#2a2620']]);
      ctx.beginPath();
      ctx.moveTo(-50, 30);
      ctx.quadraticCurveTo(-60, 120, -120, 230);
      ctx.lineTo(120, 230);
      ctx.quadraticCurveTo(60, 120, 50, 30);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#5a4a30';
      ctx.fillRect(-124, 222, 248, 14);
      ctx.fillStyle = 'rgba(120,150,110,.35)';
      for (let i = 0; i < 8; i++) ctx.fillRect(-80 + i * 20, 120 + (i % 3) * 20, 6, 30);
      // язык и верёвка
      ctx.strokeStyle = '#1a1a16';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(0, 40);
      ctx.lineTo(0, 210);
      ctx.stroke();
      ctx.fillStyle = '#1a1a16';
      ctx.beginPath();
      ctx.arc(0, 214, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      ctx.strokeStyle = OM.flag('ropeTied') ? '#b89a6a' : '#5a4a3a';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(BELL.x, 356);
      if (OM.flag('ropeTied')) ctx.quadraticCurveTo(BELL.x + 120, 500, BELL.x + 160, 610);
      else ctx.lineTo(BELL.x + 6, 420);
      ctx.stroke();
      // фигуры внизу в воде смотрят вверх
      for (let i = 0; i < 14; i++) {
        const x = 150 + i * 72 + Math.sin(i * 5) * 20, y = 520 + (i % 3) * 22;
        ctx.fillStyle = 'rgba(8,10,16,.9)';
        ctx.fillRect(x - 1.5, y - 18, 3, 18);
        ctx.beginPath();
        ctx.arc(x, y - 20, 2.6, 0, Math.PI * 2);
        ctx.fill();
        if (OM.flag('rang')) P.glow(ctx, x, y - 21, 6, '#dfe8f0', 0.6 + 0.3 * Math.sin(t * 3 + i));
      }
    },
    over(ctx, t) { P.fogBand(ctx, t, 500, 80, 5, 0.25); },
    hotspots: [
      { id: 'lake', name: 'Озеро', rect: [110, 400, 450, 220], look: 'Сверху видно всех. Они стоят в воде вокруг церкви кругом. И все — лицом сюда.' },
      { id: 'town', name: 'Огни города', rect: [60, 450, 500, 30], look: 'Огни Тихого Омута. Гостиница, Зинаида, Митя. Кажется — до них сто лет.' },
      {
        id: 'bell', name: 'Колокол', rect: [500, 140, 280, 300], walk: [560, 668], face: 1,
        look: 'Колокол. Не утонул — его просто оставили. Язык привязан, верёвка сгнила.',
        use: async () => {
          if (!OM.flag('ropeTied')) return say('Верёвка сгнила — дёрнешь, и оборвётся. Нужна новая.');
          return OM.story3.ring();
        },
        items: {
          rope: async () => {
            OM.take('rope');
            OM.flag('ropeTied', 1);
            G.hero.pose = 'reach';
            await OM.wait(700);
            G.hero.pose = null;
            await say('Верёвка из часовни. Привязал к языку. Узел морской — двадцать лет в дороге чему-то учат.');
          },
        },
      },
      { id: 'down', name: 'Вниз', rect: [0, 300, 110, 320], walk: [150, 670], exit: { to: 'church', entry: 'belfry', dir: 'left' } },
    ],
    async enter() {
      if (!OM.flag('belfrySeen')) {
        OM.flag('belfrySeen', 1);
        await say('Звонница. Ветер. Луна. И озеро — как на ладони.');
      }
    },
  });
})();
