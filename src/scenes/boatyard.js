// Глава 4. Лодочная станция ночью: Семёныч во сне идёт по мосткам к воде,
// из воды встают Тихие. Луч «жучка» держит их на месте; неосвещённые подходят ближе.
// Здесь же сцена «Полночь» — тот же берег в 00:13.
(function () {
  const P = OM.P, S = OM.S, G = OM.G, A = OM.Actors;
  const { hex, rng, W, H, lerp, clamp } = OM;
  const TAU = Math.PI * 2;
  const say = (t, o) => OM.say('lev', t, o);
  const DECK = 600, JET0 = 500, JET1 = 1240, HZ = 330;
  const MOON = { x: 1040, y: 104 };

  // ---------- Фон ----------
  function logHouse(g, x0, x1, base, top) {
    const r = rng(811);
    // сруб: брёвна с торцами
    for (let y = top, i = 0; y < base; y += 13, i++) {
      P.fillV(g, x0, y, x1 - x0, 13, [[0, '#3a2c20'], [0.5, '#2a2018'], [1, '#160f0a']]);
      g.fillStyle = 'rgba(0,0,0,.35)';
      g.fillRect(x0, y + 11.5, x1 - x0, 1.5);
      for (const ex of [x0 - 6, x1 - 6]) {
        g.fillStyle = '#4a3a2a';
        g.beginPath();
        g.ellipse(ex + 6, y + 6.5, 7, 6.5, 0, 0, TAU);
        g.fill();
        g.strokeStyle = 'rgba(0,0,0,.4)';
        g.lineWidth = 0.6;
        g.beginPath();
        g.arc(ex + 6, y + 6.5, 3, 0, TAU);
        g.stroke();
      }
      for (let k = 0; k < 3; k++) {
        g.fillStyle = 'rgba(0,0,0,.18)';
        g.fillRect(x0 + r() * (x1 - x0), y + 3 + r() * 6, 10 + r() * 30, 1);
      }
    }
    // крыша из тёса
    g.fillStyle = '#1a1612';
    g.beginPath();
    g.moveTo(x0 - 26, top + 4);
    g.lineTo((x0 + x1) / 2, top - 92);
    g.lineTo(x1 + 26, top + 4);
    g.closePath();
    g.fill();
    g.strokeStyle = 'rgba(0,0,0,.5)';
    g.lineWidth = 1;
    for (let i = 0; i < 18; i++) {
      const k = i / 18;
      g.beginPath();
      g.moveTo(lerp(x0 - 26, (x0 + x1) / 2, k), lerp(top + 4, top - 92, k));
      g.lineTo(lerp(x0 - 26, x0 - 26 + 20, k) + k * 0, top + 4);
      g.stroke();
    }
    // лунный свет на скате
    g.fillStyle = 'rgba(150,175,210,.12)';
    g.beginPath();
    g.moveTo((x0 + x1) / 2, top - 92);
    g.lineTo(x1 + 26, top + 4);
    g.lineTo(x1 + 10, top + 4);
    g.closePath();
    g.fill();
    // фронтон и труба
    g.fillStyle = '#241c14';
    g.beginPath();
    g.moveTo(x0 + 10, top);
    g.lineTo((x0 + x1) / 2, top - 76);
    g.lineTo(x1 - 10, top);
    g.fill();
    g.fillStyle = '#2a2420';
    g.fillRect(x1 - 70, top - 90, 18, 50);
    g.fillStyle = '#1a1612';
    g.fillRect(x1 - 74, top - 94, 26, 6);
  }
  function window4(g, x, y, w, h) {
    // окно с резным наличником
    P.window(g, x, y, w, h, { lit: '#ffb860', curtain: '#a04030', a: 0.95, frame: '#1a120c', ft: 4 });
    g.fillStyle = '#c8b898';
    g.beginPath();
    g.moveTo(x - 12, y - 6);
    g.lineTo(x + w / 2, y - 26);
    g.lineTo(x + w + 12, y - 6);
    g.lineTo(x + w + 12, y - 2);
    g.lineTo(x - 12, y - 2);
    g.fill();
    g.fillStyle = '#1a120c';
    for (let i = 0; i < 5; i++) {
      g.beginPath();
      g.arc(x + 4 + i * (w - 8) / 4, y - 8, 2.4, 0, TAU);
      g.fill();
    }
    g.fillStyle = '#b8a888';
    g.fillRect(x - 12, y + h + 2, w + 24, 6);
    for (let i = 0; i < 6; i++) {
      g.beginPath();
      g.moveTo(x - 10 + i * (w + 20) / 5, y + h + 8);
      g.lineTo(x - 6 + i * (w + 20) / 5, y + h + 16);
      g.lineTo(x - 2 + i * (w + 20) / 5, y + h + 8);
      g.fill();
    }
  }
  function paint(g) {
    // небо
    P.fillV(g, 0, 0, W, HZ, [[0, '#03060c'], [0.6, '#0c1424'], [1, '#1a2438']]);
    P.stars(g, 801, 300, 280, 0.8);
    P.clouds(g, 802, { y0: 40, y1: 230, n: 10, color: '#121a2a', a: 0.65, size: [120, 300] });
    P.moon(g, MOON.x, MOON.y, 30);
    P.clouds(g, 803, { x0: 900, x1: 1200, y0: 90, y1: 120, n: 2, color: '#1a2436', a: 0.5, size: [80, 140] });
    // дальний берег
    P.forest(g, 804, { yb: HZ, hMin: 14, hMax: 40, color: '#05080d', step: [5, 12] });
    g.fillStyle = '#05080d';
    g.fillRect(0, HZ, W, 4);
    // вода
    P.fillV(g, 0, HZ + 3, W, H - HZ, [[0, '#18233a'], [0.35, '#0c1424'], [1, '#03060a']]);
    const r = rng(805);
    for (let i = 0; i < 180; i++) {
      const y = HZ + 6 + Math.pow(r(), 1.5) * (H - HZ);
      g.fillStyle = `rgba(150,175,210,${0.03 + r() * 0.06})`;
      g.fillRect(r() * W, y, 10 + r() * 50 * (y / H), 1);
    }
    // суша слева: берег уходит в воду
    g.fillStyle = '#16130f';
    g.beginPath();
    g.moveTo(0, 520);
    g.lineTo(380, 540);
    g.quadraticCurveTo(520, 580, 600, 640);
    g.quadraticCurveTo(560, 700, 470, H + 10);
    g.lineTo(0, H + 10);
    g.fill();
    P.fillV(g, 0, 560, 600, 160, [[0, 'rgba(60,52,40,.35)'], [1, 'rgba(0,0,0,.4)']]);
    P.speckle(g, 806, 0, 560, 560, 160, 1400, '#4a4236', 0.5);
    // изба Семёныча
    logHouse(g, 40, 250, 560, 352);
    window4(g, 98, 420, 52, 62);
    window4(g, 182, 420, 40, 62);
    // крыльцо
    P.fillV(g, 18, 520, 40, 40, [[0, '#3a2c20'], [1, '#1a120c']]);
    for (let i = 0; i < 3; i++) { g.fillStyle = '#4a3a2a'; g.fillRect(10 - i * 6, 528 + i * 12, 52 + i * 6, 3); }
    // забор из штакетника
    for (let x = 250; x < 300; x += 9) {
      g.fillStyle = '#2a241c';
      g.beginPath();
      g.moveTo(x, 568);
      g.lineTo(x, 520);
      g.lineTo(x + 3, 514);
      g.lineTo(x + 6, 520);
      g.lineTo(x + 6, 568);
      g.fill();
    }
    g.fillRect(250, 530, 52, 3);
    g.fillRect(250, 552, 52, 3);
    // сарай лодочной станции
    const sx0 = 300, sx1 = 470, sb = 574, stp = 390;
    for (let x = sx0; x < sx1; x += 14) {
      P.fillV(g, x, stp, 13, sb - stp, [[0, '#2c2620'], [1, '#14100c']]);
      g.fillStyle = 'rgba(0,0,0,.4)';
      g.fillRect(x + 13, stp, 1, sb - stp);
    }
    g.fillStyle = '#121010';
    g.beginPath();
    g.moveTo(sx0 - 14, stp + 2);
    g.lineTo((sx0 + sx1) / 2, stp - 46);
    g.lineTo(sx1 + 14, stp + 2);
    g.fill();
    // приоткрытые ворота
    g.fillStyle = '#050505';
    g.fillRect(340, 450, 90, 124);
    P.fillV(g, 342, 452, 40, 122, [[0, '#2c2620'], [1, '#16120e']]);
    g.strokeStyle = 'rgba(0,0,0,.6)';
    g.lineWidth = 1.5;
    g.beginPath();
    g.moveTo(344, 456);
    g.lineTo(380, 570);
    g.moveTo(380, 456);
    g.lineTo(344, 570);
    g.stroke();
    // вывеска
    g.fillStyle = '#c8c0a8';
    g.fillRect(318, 404, 136, 26);
    g.strokeStyle = '#2a241c';
    g.strokeRect(318, 404, 136, 26);
    P.text(g, 'ЛОДОЧНАЯ СТАНЦИЯ', 386, 413, { font: '700 10px "PT Serif",serif', color: '#2a3a5a', ls: 1 });
    P.text(g, 'прокат · 6—22', 386, 424, { font: '600 8px "PT Serif",serif', color: '#5a3a2a' });
    // спасательный круг
    g.lineWidth = 7;
    for (let i = 0; i < 8; i++) {
      g.strokeStyle = i % 2 ? '#d8d0c0' : '#a83a2a';
      g.beginPath();
      g.arc(445, 480, 14, (i / 8) * TAU, ((i + 1) / 8) * TAU);
      g.stroke();
    }
    // перевёрнутые лодки
    [[120, 590, 1], [218, 600, -1]].forEach(([x, y, f]) => {
      g.fillStyle = '#1e1a16';
      g.beginPath();
      g.moveTo(x - 64, y);
      g.quadraticCurveTo(x, y - 44, x + 64, y);
      g.closePath();
      g.fill();
      g.strokeStyle = 'rgba(150,170,200,.12)';
      g.lineWidth = 1;
      for (let k = 0; k < 4; k++) {
        g.beginPath();
        g.moveTo(x - 60 + k * 4, y - 2 - k * 3);
        g.quadraticCurveTo(x, y - 42 + k * 9, x + 60 - k * 4, y - 2 - k * 3);
        g.stroke();
      }
      void f;
    });
    // сети на кольях
    for (const px of [486, 540]) { g.fillStyle = '#1a1612'; g.fillRect(px, 470, 4, 110); }
    g.strokeStyle = 'rgba(150,160,150,.3)';
    g.lineWidth = 0.6;
    for (let i = 0; i < 9; i++) {
      g.beginPath();
      g.moveTo(488, 476 + i * 9);
      g.quadraticCurveTo(514, 486 + i * 9, 542, 476 + i * 9);
      g.stroke();
    }
    for (let i = 0; i < 9; i++) {
      g.beginPath();
      g.moveTo(490 + i * 6, 476);
      g.lineTo(488 + i * 6.4, 556 + Math.sin(i) * 4);
      g.stroke();
    }
    // мостки
    for (let x = JET0 + 30; x < JET1; x += 64) {
      P.fillV(g, x - 3, DECK + 8, 7, 90, [[0, '#2a2016'], [1, '#0a0806']]);
      g.fillStyle = 'rgba(150,170,200,.08)';
      g.fillRect(x - 3, DECK + 100, 7, 30);
    }
    P.fillV(g, JET0, DECK - 4, JET1 - JET0, 14, [[0, '#4a3e30'], [0.4, '#30261c'], [1, '#18120c']]);
    for (let x = JET0; x < JET1; x += 11) { g.fillStyle = 'rgba(0,0,0,.45)'; g.fillRect(x, DECK - 4, 1, 6); }
    g.fillStyle = 'rgba(170,190,220,.18)';
    g.fillRect(JET0, DECK - 4, JET1 - JET0, 1.2);
    // лесенка в воду на конце
    g.strokeStyle = '#2a2016';
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(JET1 - 16, DECK);
    g.lineTo(JET1 - 10, DECK + 70);
    g.moveTo(JET1 - 2, DECK);
    g.lineTo(JET1 + 4, DECK + 70);
    g.stroke();
    for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(JET1 - 15 + i * 1.2, DECK + 12 + i * 13); g.lineTo(JET1 - 1 + i * 1.2, DECK + 12 + i * 13); g.stroke(); }
    // тумба и лодка на привязи
    g.fillStyle = '#1a1612';
    g.fillRect(890, DECK - 18, 10, 16);
    g.fillStyle = '#100c08';
    g.beginPath();
    g.moveTo(820, 652);
    g.quadraticCurveTo(900, 676, 990, 650);
    g.lineTo(970, 668);
    g.lineTo(840, 670);
    g.fill();
    g.strokeStyle = '#3a3024';
    g.lineWidth = 1.2;
    g.beginPath();
    g.moveTo(895, DECK - 10);
    g.quadraticCurveTo(905, 630, 960, 656);
    g.stroke();
    // камыш у берега
    for (let i = 0; i < 70; i++) {
      const x = 400 + r() * 240, y = 560 + r() * 90;
      g.strokeStyle = `rgba(10,12,10,${0.7 + r() * 0.3})`;
      g.lineWidth = 1 + r();
      g.beginPath();
      g.moveTo(x, y);
      g.quadraticCurveTo(x + (r() - 0.5) * 8, y - 30, x + (r() - 0.5) * 16, y - 40 - r() * 30);
      g.stroke();
    }
    P.paper(g, 807, 0.08);
  }
  function front(g) {
    // камыш и кол на переднем плане
    const r = rng(808);
    for (let i = 0; i < 60; i++) {
      const x = r() * 330, y = H + 10;
      g.strokeStyle = '#030404';
      g.lineWidth = 2 + r() * 2;
      g.beginPath();
      g.moveTo(x, y);
      g.quadraticCurveTo(x + (r() - 0.5) * 20, y - 60, x + (r() - 0.5) * 40, y - 90 - r() * 70);
      g.stroke();
      if (r() < 0.25) {
        g.fillStyle = '#060504';
        g.beginPath();
        g.ellipse(x + (r() - 0.5) * 30, y - 110 - r() * 40, 3, 11, 0, 0, TAU);
        g.fill();
      }
    }
    g.fillStyle = '#040404';
    g.fillRect(1180, 560, 22, H - 560);
    g.fillRect(1176, 556, 30, 8);
  }

  // ---------- Динамика ----------
  const st = { beamOn: true, charge: 1, dead: 0, talls: [], spawnT: 2, active: false, failing: false, done: false, beam: [800, 400], beamAt: null, dark: null, warned: false };
  const sem = OM.actor({ id: 'sem', x: 760, y: DECK + 8, face: 1, speed: 7, draw: (c, a, t) => A.semWalk(c, a, t), sleep: true, litByScene: true, cadence: 3 });

  function backDyn(ctx, t) {
    // лунная дорожка под мостками
    P.streak(ctx, MOON.x, HZ + 6, 34, 330, '#c8d8f0', 0.32, 41, t);
    P.streak(ctx, MOON.x - 6, HZ + 6, 60, 200, '#c8d8f0', 0.12, 42, t * 0.7);
    // рябь
    for (let i = 0; i < 6; i++) {
      const k = (t * 0.3 + i / 6) % 1;
      ctx.strokeStyle = `rgba(170,195,225,${0.2 * (1 - k)})`;
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.ellipse(620 + i * 110, 690 + (i % 2) * 14, 8 + k * 60, 1.5 + k * 5, 0, 0, TAU);
      ctx.stroke();
    }
    // дым из трубы
    for (let i = 0; i < 8; i++) {
      const k = (t * 0.06 + i / 8) % 1;
      ctx.fillStyle = `rgba(150,160,175,${0.12 * (1 - k)})`;
      ctx.beginPath();
      ctx.arc(189 + k * 60 + Math.sin(t + i) * 6, 262 - k * 160, 8 + k * 26, 0, TAU);
      ctx.fill();
    }
    // окна избы теплятся
    P.glow(ctx, 124, 450, 90, '#ff9a40', 0.18 + Math.sin(t * 3) * 0.02);
    P.fogBand(ctx, t, HZ + 40, 90, 6, 0.35);
    P.fogBand(ctx, t + 30, 560, 120, -9, 0.3);
  }

  // Тихие: встают из воды, крадутся, пока на них не светят.
  function spawnTall() {
    const h = G.hero;
    const front = Math.random() < 0.6;
    let x = h.x + (Math.random() < 0.7 ? 1 : -1) * (180 + Math.random() * 220);
    x = clamp(x, 520, 1220);
    if (Math.abs(x - sem.x) < 60) x += 90;
    st.talls.push({
      x, y: front ? 712 + Math.random() * 8 : 580, lane: front ? 'f' : 'b', s: front ? 0.6 : 0.44,
      a: 0, state: 'rise', lit: 0, seed: Math.random() * 10, face: x > h.x ? -1 : 1, rise: 0, reach: 0,
    });
  }
  const chestOf = (T) => [T.x, T.y - 210 * T.s];
  function inBeam(px, py) {
    if (!st.beamOn || st.dead > 0 || !st.src) return false;
    const [hx, hy] = st.src;
    const dx = px - hx, dy = py - hy, d = Math.hypot(dx, dy);
    if (d > st.len + 30) return false;
    let da = Math.atan2(dy, dx) - st.ang;
    while (da > Math.PI) da -= TAU;
    while (da < -Math.PI) da += TAU;
    return Math.abs(da) < 0.24 + 16 / Math.max(d, 1);
  }

  function update(dt, t) {
    const h = G.hero;
    // фонарь Семёныча — источник света сцены
    if (sem.lampPos) { LIGHT_LAMP.x = sem.lampPos[0]; LIGHT_LAMP.y = sem.lampPos[1]; }
    LIGHT_LAMP.a = sem.visible ? 0.9 : 0;
    // направление луча
    if (G.mouse.x >= 0) st.beam = [G.mouse.x, G.mouse.y];
    if (!h.target) h.face = st.beam[0] >= h.x ? 1 : -1;
    h.holdLight = true;
    h.pose = 'point';
    h.item = 'none';
    st.src = [h.x + h.face * 64 * h.s, h.y - 128 * h.s];
    st.ang = Math.atan2(st.beam[1] - st.src[1], st.beam[0] - st.src[0]);
    // рука не выворачивается назад: луч только в сторону взгляда
    if (Math.cos(st.ang) * h.face < 0.15) st.ang = h.face > 0 ? clamp(st.ang, -1.4, 1.4) : (st.ang > 0 ? clamp(st.ang, Math.PI - 1.4, Math.PI) : clamp(st.ang, -Math.PI, -Math.PI + 1.4));
    st.len = 520;
    if (st.dead > 0) { st.dead -= dt; if (st.dead <= 0) st.charge = 0.25; }
    if (!st.active || st.failing || st.done || G.mode !== 'play') return;
    // Семёныч бредёт к краю мостков
    if (!sem.target && sem.x < JET1 - 30) OM.moveTo(sem, JET1 - 28, DECK + 8, { free: true });
    if (sem.x >= JET1 - 32) { st.failing = true; OM.run(() => fail('sem')); return; }
    // появление
    st.spawnT -= dt;
    const alive = st.talls.filter((T) => T.state !== 'gone').length;
    if (st.spawnT <= 0 && alive < 4) { spawnTall(); st.spawnT = 3.2 + Math.random() * 2.4; }
    let drain = 0;
    for (const T of st.talls) {
      if (T.state === 'gone') continue;
      const [cx, cy] = chestOf(T);
      const lit = inBeam(cx, cy) || inBeam(T.x, T.y - 120 * T.s) || inBeam(T.x, T.y - 320 * T.s);
      T.face = h.x < T.x ? -1 : 1;
      if (T.state === 'rise') {
        T.rise = Math.min(1, T.rise + dt / 1.6);
        T.a = T.rise;
        if (T.rise >= 1) T.state = 'stalk';
      } else if (T.state === 'stalk') {
        if (lit) {
          T.lit += dt;
          drain += 1;
          if (T.lit > 1.1) { T.state = 'sink'; S.splash && S.splash(); }
        } else {
          T.lit = Math.max(0, T.lit - dt * 0.4);
          const dx = h.x - T.x;
          const sp = 38 + (Math.abs(dx) < 160 ? 26 : 0);
          T.x = Math.max(540, T.x + Math.sign(dx) * Math.min(Math.abs(dx), sp * dt));
          if (T.lane === 'f') T.y = Math.max(DECK + 52, T.y - dt * 18);
          T.reach = clamp(1 - Math.abs(dx) / 140, 0, 1);
          if (Math.abs(dx) < 30 + 20 * T.s && Math.abs(h.y - T.y) < 120) { st.failing = true; OM.run(() => fail('grab')); return; }
        }
      } else if (T.state === 'sink') {
        T.a -= dt / 0.9;
        T.reach = Math.max(0, T.reach - dt * 2);
        if (T.a <= 0) T.state = 'gone';
      }
    }
    st.talls = st.talls.filter((T) => T.state !== 'gone');
    // заряд «жучка»: свет на них выпивает его
    if (st.dead <= 0) st.charge = clamp(st.charge + (drain ? -dt * 0.22 * drain : dt * 0.14), 0, 1);
    if (st.charge <= 0 && st.dead <= 0) { st.dead = 1.6; S.powerDown && S.powerDown(); OM.toast('Жучок сел — жмите ещё!'); }
    if (Math.random() < dt * 3) S.whirr();
    const near = st.talls.reduce((m, T) => Math.min(m, Math.abs(T.x - h.x)), 999);
    S.tension(clamp(1 - near / 400, 0, 1));
    // догнал
    if (Math.abs(h.x - sem.x) < 70 && Math.abs(h.y - sem.y) < 60) { st.done = true; OM.run(wake); }
  }

  async function fail(why) {
    S.hit();
    OM.shake(10);
    S.whisper(1.6, 0.18);
    G.fx.warp = 0.8;
    await OM.fadeTo(1, 600, '#04121a');
    G.fx.warp = 0;
    if (why === 'sem') await OM.say('narr', 'Семёныч сделал ещё шаг. С мостков — в воду. Фонарь погас не сразу.', { hold: 1.6 });
    else await OM.say('narr', 'Мокрые пальцы сомкнулись на запястье. Холодно. Тихо.', { hold: 1.6 });
    reset();
    await OM.fadeTo(0, 700);
    await say(why === 'sem' ? 'Ещё раз. Быстрее. Не останавливаться надолго.' : 'Ещё раз. Не подпускать. Светить — и идти.');
    st.failing = false;
    st.active = true;
  }
  function reset() {
    st.talls = [];
    st.spawnT = 1.5;
    st.charge = 1;
    st.dead = 0;
    const h = G.hero;
    h.x = 150; h.y = 640; h.target = null; h.face = 1;
    sem.x = 760; sem.y = DECK + 8; sem.target = null; sem.face = 1; sem.sleep = true; sem.visible = true;
    S.tension(0);
  }

  async function wake() {
    G.hero.target = null;
    OM.letterbox(true);
    S.tension(0);
    st.talls.forEach((T) => (T.state = 'sink'));
    sem.target = null;
    await say('Семёныч!');
    await OM.wait(300);
    await say('Не слышит. Как Митя тогда.');
    await say('Значит — светом. В глаза.');
    st.beam = [sem.x, sem.y - 170 * sem.s];
    S.whirr(); await OM.wait(160); S.whirr(); await OM.wait(160); S.whirr();
    OM.flash(0.35);
    sem.sleep = false;
    sem.face = -1;
    S.heartbeat();
    await OM.wait(500);
    await OM.say('sem', 'А?! Кто… Лев? Ты чего мне в рожу светишь, ирод?');
    await OM.say('sem', 'Где это я… На мостках? В носках?..');
    await say('Ты к воде шёл. Во сне.');
    await OM.say('sem', 'Мать снилась. Покойница. Стоит в воде по пояс, зовёт: «Петенька, сапоги сними — вода тёплая».');
    await OM.say('sem', 'Тёплая, говорит. В октябре.');
    await OM.wait(400);
    await OM.say('sem', 'Ступай, куда шёл. Я до дому сам. Фонарь до утра жечь буду — пусть видят, что не сплю.');
    OM.letterbox(false);
    await OM.story4.rescued('sem');
  }

  function threads(ctx, t, k) {
    const h = G.hero;
    if (sem.visible) OM.thread(ctx, [sem.x, sem.y - 120 * sem.s], [JET1 + 20, 700], t, { color: '#ffd27a', a: k, sag: 30, w: 1.8, speed: -0.3 });
    st.talls.forEach((T) => OM.thread(ctx, chestOf(T), [T.x + 10, H], t, { color: '#7a90b0', a: k * T.a * 0.7, sag: 10, w: 1 }));
    OM.thread(ctx, [h.x, h.y - 110 * h.s], [MOON.x, HZ + 30], t, { color: '#ffd27a', a: k * 0.5, sag: 40, w: 1.4 });
  }

  // Темнота, конус луча, пятна света.
  function over(ctx, t) {
    const h = G.hero;
    if (!st.dark) st.dark = OM.makeCanvas(W / 2, H / 2);
    const d = st.dark.getContext('2d');
    d.setTransform(0.5, 0, 0, 0.5, 0, 0);
    d.globalCompositeOperation = 'source-over';
    d.clearRect(0, 0, W, H);
    d.fillStyle = P.vgrad(d, 0, H, [[0, 'rgba(2,4,8,.3)'], [0.45, 'rgba(2,4,8,.5)'], [1, 'rgba(2,4,8,.66)']]);
    d.fillRect(0, 0, W, H);
    d.globalCompositeOperation = 'destination-out';
    d.fillStyle = P.rgrad(d, MOON.x, MOON.y, 0, 90, [[0, 'rgba(0,0,0,1)'], [0.4, 'rgba(0,0,0,.8)'], [1, 'rgba(0,0,0,0)']]);
    d.fillRect(MOON.x - 90, MOON.y - 90, 180, 180);
    // луна и лунная дорожка
    d.fillStyle = P.rgrad(d, MOON.x, MOON.y + 200, 0, 520, [[0, 'rgba(0,0,0,.6)'], [1, 'rgba(0,0,0,0)']]);
    d.fillRect(MOON.x - 520, 0, 1040, H);
    // окна избы
    d.fillStyle = P.rgrad(d, 140, 450, 0, 160, [[0, 'rgba(0,0,0,.7)'], [1, 'rgba(0,0,0,0)']]);
    d.fillRect(0, 280, 320, 340);
    // фонарь Семёныча
    if (sem.lampPos && sem.visible) {
      const [lx, ly] = sem.lampPos;
      d.fillStyle = P.rgrad(d, lx, ly, 0, 190, [[0, 'rgba(0,0,0,.95)'], [0.5, 'rgba(0,0,0,.5)'], [1, 'rgba(0,0,0,0)']]);
      d.fillRect(lx - 200, ly - 200, 400, 400);
    }
    // ореол вокруг Льва
    d.fillStyle = P.rgrad(d, h.x, h.y - 90, 0, 130, [[0, 'rgba(0,0,0,.45)'], [1, 'rgba(0,0,0,0)']]);
    d.fillRect(h.x - 140, h.y - 230, 280, 280);
    const on = st.beamOn && st.dead <= 0 && G.mode === 'play' && st.src;
    const br = on ? (0.55 + st.charge * 0.45) * (0.88 + 0.12 * Math.abs(Math.sin(t * 9.8))) : 0;
    if (on) {
      const [hx, hy] = st.src;
      const R = st.len;
      d.fillStyle = P.rgrad(d, hx, hy, 8, R, [[0, `rgba(0,0,0,${0.95 * br})`], [0.6, `rgba(0,0,0,${0.6 * br})`], [1, 'rgba(0,0,0,0)']]);
      d.beginPath();
      d.moveTo(hx, hy);
      d.arc(hx, hy, R, st.ang - 0.24, st.ang + 0.24);
      d.closePath();
      d.fill();
    }
    ctx.drawImage(st.dark, 0, 0, W, H);
    if (on) {
      const [hx, hy] = st.src;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = P.rgrad(ctx, hx, hy, 0, st.len, [[0, `rgba(255,225,160,${0.16 * br})`], [1, 'rgba(255,225,160,0)']]);
      ctx.beginPath();
      ctx.moveTo(hx, hy);
      ctx.arc(hx, hy, st.len, st.ang - 0.24, st.ang + 0.24);
      ctx.closePath();
      ctx.fill();
      for (let i = 0; i < 26; i++) {
        const k = (t * 0.06 + i * 0.173) % 1, sp = (((i * 37) % 11) / 11 - 0.5) * 0.4;
        ctx.fillStyle = `rgba(255,235,200,${0.35 * br * Math.sin(k * Math.PI)})`;
        ctx.fillRect(hx + Math.cos(st.ang + sp) * st.len * k, hy + Math.sin(st.ang + sp) * st.len * k + Math.sin(t * 2 + i) * 3, 1.5, 1.5);
      }
      ctx.restore();
    }
    // заряд «жучка»
    if (st.active && !st.done) {
      const x = 40, y = 92;
      ctx.fillStyle = 'rgba(0,0,0,.45)';
      P.rrect(ctx, x - 6, y - 16, 150, 30, 8);
      ctx.fill();
      P.text(ctx, 'жучок', x + 22, y, { font: 'italic 14px "Cormorant Garamond",serif', color: 'rgba(240,225,195,.8)' });
      ctx.fillStyle = 'rgba(255,255,255,.12)';
      ctx.fillRect(x + 50, y - 4, 86, 8);
      ctx.fillStyle = st.dead > 0 ? '#a83a2a' : st.charge < 0.3 ? '#e0884a' : '#ffd890';
      ctx.fillRect(x + 50, y - 4, 86 * st.charge, 8);
    }
    OM.story4.cornerClock(ctx);
  }

  const LIGHT_MOON = { x: MOON.x, y: MOON.y + 200, color: '#b8c8e0', a: 0.6, reach: 1100 };
  const LIGHT_LAMP = { x: 800, y: 560, color: '#ffb050', a: 0.9, reach: 320 };
  const tallActors = [0, 1, 2, 3, 4, 5].map((i) => OM.actor({
    id: 'T' + i, autoScale: false, visible: true,
    draw: (c, a, t) => {
      const T = st.talls[i];
      if (!T || T.a <= 0.01) return;
      const lit = T.lit > 0.05;
      c.save();
      // по пояс в воде (передний ряд) или за мостками (задний): видно только то, что над водой
      c.beginPath();
      c.rect(0, 0, W, T.y - 120 * T.s);
      c.clip();
      A.tall(c, { x: T.x, y: T.y + (1 - T.rise) * 260 * T.s, s: T.s, face: T.face, alpha: T.a, reach: T.reach, jitter: lit ? 3 : 0.8, body: '#04060a', seed: T.seed, rim: lit ? { color: 'rgba(255,220,160,.7)', dx: -T.face * 1.6 } : { color: 'rgba(170,190,225,.35)', dx: 1.2 }, face2: lit ? 2.2 : 0.6 }, t);
      c.restore();
      {
        // круги на воде вокруг
        const k = (t * 0.8 + T.seed) % 1;
        c.strokeStyle = `rgba(180,200,230,${0.35 * (1 - k) * T.a})`;
        c.lineWidth = 1;
        c.beginPath();
        c.ellipse(T.x, T.y - 120 * T.s, 18 + k * 30, 3 + k * 4, 0, 0, TAU);
        c.stroke();
      }
    },
  }));
  // порядок отрисовки: задний ряд за мостками, передний — перед ними
  tallActors.forEach((a, i) => { Object.defineProperty(a, 'y', { get: () => (st.talls[i] ? (st.talls[i].lane === 'b' ? DECK - 2 : 760) : -1), set() {} }); });

  OM.scene('boatyard', {
    name: 'Лодочная станция',
    surface: 'wood',
    figLight: { amb: 0.36, tint: '#24303c', side: 1 },
    amb: { water: 0.8, wind: 0.5, drone: 0.3 },
    walk: [[90, 640], [520, 612], [1232, 606], [1232, 620], [560, 628], [560, 668], [90, 676]],
    depth: { y0: 606, s0: 0.96, y1: 676, s1: 1.06 },
    entries: { default: { x: 150, y: 650, face: 1 } },
    lights: [LIGHT_MOON, LIGHT_LAMP],
    actors: () => [sem, ...tallActors],
    paint,
    front,
    back: backDyn,
    over,
    threads,
    update,
    hotspots: [
      { id: 'house', name: 'Изба Семёныча', rect: [30, 260, 230, 300], look: ['Изба Семёныча. Наличники он сам резал — говорил, «чтобы нечисть видела: тут живут».', 'Дверь нараспашку. Ушёл, не закрыв.'] },
      { id: 'shed', name: 'Лодочная станция', rect: [290, 380, 190, 196], look: 'Прокат лодок. Сезон закрыт. Ворота приоткрыты — изнутри пахнет смолой и водой.' },
      { id: 'sem', name: 'Семёныч', rect: () => [sem.x - 34, sem.y - 210, 70, 210], look: () => say('Идёт с закрытыми глазами. В носках. Фонарь держит ровно — как на рыбалку.') },
      { id: 'jetty', name: 'Конец мостков', rect: [JET1 - 70, DECK - 30, 80, 90], look: 'Мостки кончаются лесенкой в воду. Он туда и идёт.' },
    ],
    setup() {
      st.active = false; st.failing = false; st.done = false;
      reset();
      G.hero.speed = 125;
    },
    leave() { G.hero.holdLight = false; G.hero.pose = null; G.hero.item = 'none'; G.hero.speed = 185; S.tension(0); },
    async enter() {
      if (OM.flag('saved_sem')) return;
      OM.letterbox(true);
      await OM.wait(400);
      await say('Вон он. Фонарь на мостках. Идёт — и не оборачивается.');
      S.whisper(1.5, 0.1);
      await say('А в воде… Они уже здесь.');
      OM.letterbox(false);
      OM.toast(G.touch ? 'Касание — идти и светить. Свет держит их на месте.' : 'Луч следует за курсором. Свет держит Тихих; неосвещённые подходят. Догоните Семёныча.');
      st.active = true;
    },
    resume() { st.active = true; },
  });
  OM.boatyard = { st, sem };

  // ---------- Полночь: тот же берег, 00:13 ----------
  const mst = { lost: null, k: 0, anna: 0, annaY: 0, walker: null, sink: 0, rows: 0, call: 0 };
  const ANNA = { cardigan: '#3a3a40', blouse: '#c8c4b8', skirt: '#2a2a30', skin: '#c8b4a8', hair: '#3a2418', shoes: '#1a1210', tights: '#2a2220' };
  const ZINA = { cardigan: '#5a4c44', blouse: '#c9bfae', skirt: '#3a3236', skin: '#d3a68e', hair: '#9a948c', shoes: '#2a1c16', tights: '#4a3a34' };
  const VERA_N = { cardigan: '#d8d2c4', blouse: '#e0d8c8', skirt: '#d0c8b8', skin: '#e0b39a', hair: '#4a2e22', shoes: '#c89a88', tights: '#e0b39a' };
  const walker = OM.actor({
    id: 'walker', x: 600, y: DECK + 8, face: 1, speed: 26, visible: false, litByScene: true,
    draw: (c, a, t) => {
      const sink = mst.sink;
      c.save();
      if (sink > 0) {
        c.beginPath();
        c.rect(0, 0, W, DECK + 30 - 0);
        c.clip();
      }
      const o = Object.assign({}, a, { y: a.y + sink * 230 * a.s });
      if (mst.lost === 'sem') A.semWalk(c, Object.assign(o, { sleep: true, lit: sink < 0.6 }), t);
      else if (mst.lost === 'nik') A.nikodim(c, Object.assign(o, { pose: a.bless ? 'bless' : null }), t);
      else if (mst.lost === 'library') A.vera(c, Object.assign(o, { pal: VERA_N, long: true, hairDown: true, glasses: false, hold: 'trance', eyesClosed: true }), t);
      else A.vera(c, Object.assign(o, { pal: ZINA, shawl: '#7a3a2e', shawlPat: 'rgba(196,154,90,.8)', highBun: true, hold: 'trance', eyesClosed: true }), t);
      c.restore();
    },
  });
  const anna = OM.actor({
    id: 'anna', x: 1010, y: 712, face: -1, autoScale: false, s: 1.18, visible: false, z: 720,
    draw: (c, a, t) => {
      if (mst.anna <= 0.01) return;
      c.save();
      c.globalAlpha = mst.anna;
      // по пояс в воде
      const wl = 650;
      c.beginPath();
      c.rect(0, 0, W, wl);
      c.clip();
      A.vera(c, { x: a.x, y: a.y + mst.annaY, s: a.s, face: a.face, pal: ANNA, scarf: '#4a2a28', glasses: false, hold: mst.reach ? 'reach' : null, talking: a.talking, light: { amb: 0.42, tint: '#3a5a78', side: 1 }, rim: { color: 'rgba(190,210,240,.55)', dx: 1.4 } }, t);
      c.restore();
      // вода вокруг неё
      const k = (t * 0.6) % 1;
      c.strokeStyle = `rgba(190,210,235,${0.4 * (1 - k) * mst.anna})`;
      c.lineWidth = 1;
      c.beginPath();
      c.ellipse(a.x, wl, 22 + k * 40, 3 + k * 5, 0, 0, TAU);
      c.stroke();
      c.fillStyle = `rgba(190,210,235,${0.25 * mst.anna})`;
      c.fillRect(a.x - 26, wl - 1, 52, 1.5);
    },
  });
  const rowTalls = Array.from({ length: 9 }, (_, i) => OM.actor({
    id: 'row' + i, autoScale: false, z: i < 5 ? DECK - 2 : 730, x: 620 + i * 70, y: i < 5 ? 590 : 724,
    draw: (c, a, t) => {
      if (mst.rows <= 0.01) return;
      const front = i >= 5;
      const x = front ? 640 + (i - 5) * 150 : 560 + i * 150;
      const y = front ? 724 : 580;
      const s2 = front ? 0.6 : 0.44;
      c.save();
      // стоят в воде по пояс: видно только то, что над водой
      c.beginPath();
      c.rect(0, 0, W, y - 120 * s2);
      c.clip();
      A.tall(c, { x, y: y + (1 - mst.rows) * 200, s: s2, face: mst.turn ? (G.hero.x < x ? -1 : 1) : 1, alpha: mst.rows, jitter: 0.6, body: '#04060a', seed: i * 2.3, rim: { color: 'rgba(170,190,225,.35)', dx: 1.2 }, face2: mst.turn ? 2 : 0.5 }, t);
      c.restore();
    },
  }));

  OM.scene('midnight', {
    name: 'Берег. 00:13',
    surface: 'wood',
    noThreads: true,
    figLight: { amb: 0.36, tint: '#24303c', side: 1 },
    amb: { water: 0.8, wind: 0.6, drone: 0.5 },
    walk: [[90, 640], [520, 612], [1100, 606], [1100, 620], [560, 628], [560, 668], [90, 676]],
    depth: { y0: 606, s0: 0.96, y1: 676, s1: 1.06 },
    entries: { default: { x: 300, y: 650, face: 1 } },
    lights: [LIGHT_MOON, { x: 1000, y: 500, color: '#b8d0f0', a: 0.5, reach: 600 }],
    actors: () => [walker, anna, ...rowTalls],
    paint,
    front,
    back: backDyn,
    over(ctx, t) {
      ctx.fillStyle = 'rgba(2,4,8,.2)';
      ctx.fillRect(0, 0, W, H);
      if (mst.anna > 0.01) {
        P.glow(ctx, anna.x, 560, 260, '#9ab8e0', 0.22 * mst.anna);
        P.fogBand(ctx, t, 640, 90, 12, 0.35 * mst.anna);
      }
      OM.story4.cornerClock(ctx);
    },
    setup() {
      const f = G.flags;
      mst.lost = f.nikGoes ? 'nik' : f.lost;
      mst.anna = 0; mst.annaY = 160; mst.sink = 0; mst.rows = 0; mst.turn = false; mst.reach = false;
      walker.visible = !!mst.lost;
      walker.x = 620; walker.y = DECK + 8; walker.face = 1; walker.target = null;
      anna.visible = true;
      G.hero.item = 'none';
    },
    async enter() { await midnight(); },
    resume() { return midnight(); },
  });

  // Крупный план у воды.
  function paintCU(g) {
    P.fillV(g, 0, 0, W, 330, [[0, '#03060c'], [0.7, '#0e1628'], [1, '#1a2438']]);
    P.stars(g, 851, 160, 260, 0.7);
    P.clouds(g, 852, { y0: 40, y1: 200, n: 8, color: '#121a2a', a: 0.6, size: [140, 320] });
    P.moon(g, 1010, 120, 36);
    P.forest(g, 853, { yb: 330, hMin: 16, hMax: 44, color: '#04070c', step: [5, 11] });
    P.fillV(g, 0, 328, W, H - 328, [[0, '#18233a'], [0.4, '#0a1220'], [1, '#02040a']]);
    const r = rng(854);
    for (let i = 0; i < 160; i++) {
      const y = 334 + Math.pow(r(), 1.4) * (H - 334);
      g.fillStyle = `rgba(160,185,220,${0.03 + r() * 0.07})`;
      g.fillRect(r() * W, y, 10 + r() * 80 * (y / H), 1);
    }
  }
  function closeUp(ctx, t, cu) {
    ctx.drawImage(OM.cache('midnight:cu', paintCU), 0, 0, W, H);
    P.streak(ctx, 1010, 334, 46, 380, '#c8d8f0', 0.3, 77, t);
    // дальний ряд — по пояс в воде у горизонта
    for (let i = 0; i < 8; i++) {
      const x = 120 + i * 150 + (i % 2) * 30, y = 392, s2 = 0.3;
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, W, y - 120 * s2);
      ctx.clip();
      A.tall(ctx, { x, y, s: s2, face: -1, alpha: 0.85 * (1 - cu.sink), jitter: 0.5, body: '#03050a', seed: i * 1.9, face2: 1.8 }, t);
      ctx.restore();
    }
    P.fogBand(ctx, t, 360, 70, 8, 0.5);
    // мама
    const ax = 820, wl = 566, ay = 826 + cu.sink * 300;
    if (cu.anna > 0.01) {
      P.glow(ctx, ax, 470, 300, '#9ab8e0', 0.18 * cu.anna);
      ctx.save();
      ctx.globalAlpha = cu.anna;
      ctx.beginPath();
      ctx.rect(0, 0, W, wl);
      ctx.clip();
      A.vera(ctx, { x: ax, y: ay + (1 - cu.anna) * 120, s: 2.45, face: -1, pal: ANNA, scarf: '#4a2a28', glasses: false, hold: cu.reach > 0.4 ? 'reach' : null, talking: cu.talk, light: { amb: 0.6, tint: '#3a5a78', side: -1 }, rim: { color: 'rgba(200,220,250,.6)', dx: 1.4 } }, t);
      ctx.restore();
      // мокрый блеск: капли с платка и рук
      for (let i = 0; i < 6; i++) {
        const k = (t * 0.7 + i / 6) % 1;
        ctx.fillStyle = `rgba(200,220,240,${0.5 * (1 - k) * cu.anna})`;
        ctx.fillRect(ax - 60 + i * 22, 470 + k * (wl - 470), 1.6, 4);
      }
      // круги на воде
      for (let i = 0; i < 3; i++) {
        const k = (t * 0.35 + i / 3) % 1;
        ctx.strokeStyle = `rgba(190,210,240,${0.4 * (1 - k) * cu.anna})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.ellipse(ax, wl + 4, 70 + k * 220, 6 + k * 18, 0, 0, TAU);
        ctx.stroke();
      }
      ctx.fillStyle = `rgba(200,220,245,${0.3 * cu.anna})`;
      ctx.fillRect(ax - 80, wl, 160, 2);
    }
    P.fogBand(ctx, t + 20, 640, 120, -10, 0.35);
    // Лев на краю мостков — спиной и в профиль, тёмный силуэт с контровым светом
    ctx.fillStyle = '#0a0806';
    ctx.fillRect(0, 640, 520 + cu.step * 40, 90);
    ctx.fillStyle = 'rgba(170,190,220,.15)';
    ctx.fillRect(0, 640, 520 + cu.step * 40, 2);
    A.hero(ctx, { x: 300 + cu.step * 110, y: 940, s: 2.6, face: 1, item: 'none', pose: cu.step > 0.3 ? 'reach' : null, light: { amb: 0.22, tint: '#1a2430', side: 1 }, rim: { color: 'rgba(190,210,245,.7)', dx: 1.6 } }, t);
  }

  async function midnight() {
    const f = G.flags;
    const h = G.hero;
    const tw = async (ms, fn) => { const t0 = performance.now(); while (performance.now() - t0 < ms) { fn((performance.now() - t0) / ms); await OM.wait(16); } fn(1); };
    OM.letterbox(true);
    f.clock = OM.ch4.DEADLINE;
    S.bigBell(0.6, 0.9);
    await OM.wait(900);
    await tw(2500, (k) => (mst.rows = k));
    const lost = mst.lost;
    if (lost) {
      const who = { nik: 'Никодим', sem: 'Семёныч', library: 'Вера', hotel: 'Зина' }[lost];
      if (lost === 'nik') {
        await OM.say('nik', 'Вот и полночь. Тринадцать минут — а всё полночь.');
        await OM.say('nik', 'Семёныча я домой отвёл. Спит. Фонарь горит.');
        await say('Отец Никодим! Не надо!');
        await OM.say('nik', 'Надо, Лёва. Им нужен священник. Сорок лет без отпевания — это долго.');
      } else if (lost === 'hotel') {
        await say('Зина… Зинаида Павловна!');
        await OM.say('zina', 'Не кричи, Лёвушка. Митю разбудишь.', { italic: true });
        await OM.say('zina', 'Я сорок лет этот долг носила. Пусти.', { italic: true });
      } else if (lost === 'library') {
        await say('Вера! Вера Андреевна!');
        await OM.say('vera', 'Там мама. Она меня по имени зовёт. Мне тридцать девять, а она — «Верочка».', { italic: true });
      } else {
        await say('Семёныч! Стой!');
        await OM.say('sem', 'Сапоги, говорит, сними. Вода тёплая…', { italic: true });
      }
      void who;
      OM.moveTo(walker, JET1 - 28, DECK + 8, { free: true });
      while (walker.target) await OM.wait(50);
      if (lost === 'nik') { walker.bless = true; await OM.say('nik', 'Со святыми упокой…'); }
      S.splash();
      await tw(3200, (k) => (mst.sink = k));
      walker.visible = false;
      await OM.wait(700);
    }
    // все они поворачиваются к Льву
    mst.turn = true;
    S.whisper(2, 0.14);
    await OM.wait(900);
    await say('Они смотрят. Все.');
    // мама поднимается из воды — живая, как на фотографии. Мокрая.
    S.choir(true);
    await tw(3200, (k) => { mst.anna = k; mst.annaY = 160 * (1 - OM.smooth(k)); });
    await OM.wait(500);
    // крупный план: мама по пояс в воде, Лев — спиной к нам, на краю мостков
    const cu = { anna: 0, reach: 0, step: 0, talk: false, sink: 0 };
    await OM.fadeTo(1, 500);
    OM.vision((ctx, vt) => closeUp(ctx, vt, cu));
    await OM.fadeTo(0, 700);
    await tw(1400, (k) => (cu.anna = k));
    cu.talk = true;
    await OM.say('anna', 'Лёва.');
    await OM.say('anna', 'Какой ты стал. Высокий. Как отец.');
    cu.talk = false;
    await say('Мама…');
    await tw(900, (k) => (cu.reach = k));
    cu.talk = true;
    await OM.say('anna', 'Иди ко мне. Здесь тихо. Здесь все свои. Никто никуда не уходит.');
    cu.talk = false;
    // Лев шагает к ней — картинка «тонет»
    S.heartbeat();
    await tw(2600, (k) => { cu.step = k; G.fx.warp = k * 0.75; S.muffle(k * 0.7); });
    // его держат нити — те, кто остался на берегу
    const saved = ['hotel', 'library', 'sem'].filter((id) => f['saved_' + id]);
    const caller = saved.includes('hotel') ? ['mitya', 'Дядя Лев! Ба говорит — чай стынет!'] : saved.includes('library') ? ['vera', 'Лев Аркадьевич! Не надо! Слышите?'] : ['sem', 'Лев! Твою ж… Отойди от края!'];
    G.fx.warp = 0; S.muffle(0);
    OM.flash(0.5);
    await OM.say(caller[0], caller[1]);
    await tw(700, (k) => (cu.step = 1 - k * 0.6));
    await say('…Не сейчас, мама.');
    cu.talk = true;
    await OM.say('anna', 'Я подожду. Я умею ждать, Лёвушка. Сорок один год ждала.');
    cu.talk = false;
    await tw(2600, (k) => { cu.reach = 1 - k; cu.sink = k; });
    await OM.fadeTo(1, 800);
    OM.endVision();
    mst.anna = 0; mst.rows = 0;
    await OM.fadeTo(0, 600);
    S.choir(false);
    await OM.wait(600);
    await OM.story4.end();
  }
})();
