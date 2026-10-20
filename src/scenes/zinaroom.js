// Глава 4. Комнатка Зинаиды за стойкой «Зари». Зина пишет прощальное письмо; Митя спит на диване.
// Словами её не удержать: её нить уходит в окно, к воде. В режиме нитей нить можно взять
// и перенести к Мите — пусть держит его, а не воду. Когда Тихий за окном тянет — не двигаться.
(function () {
  const P = OM.P, S = OM.S, G = OM.G, A = OM.Actors;
  const { hex, rng, W, H, lerp, clamp } = OM;
  const TAU = Math.PI * 2;
  const say = (t, o) => OM.say('lev', t, o);
  const zsay = (t, o) => OM.say('zina', t, o);
  const FLOOR = 610;
  const WIN = { x0: 968, x1: 1188, y0: 150, y1: 430 };
  const LAMP = { x: 740, y: 330 };
  const ZINA = { x: 850, y: 560 };
  const KNOT = { x: 196, y: 440 };
  const TOP = 528; // столешница

  // ---------- Фон ----------
  function paint(g) {
    // обои: тёплые, с крупным цветком
    P.fillV(g, 0, 0, W, FLOOR, [[0, '#4a3628'], [1, '#3a2a1e']]);
    const r = rng(931);
    for (let y = 30; y < FLOOR; y += 60) {
      for (let x = (y / 60) % 2 ? 30 : 0; x < W; x += 60) {
        g.fillStyle = 'rgba(200,150,100,.07)';
        for (let k = 0; k < 5; k++) {
          const a = (k / 5) * TAU;
          g.beginPath();
          g.ellipse(x + Math.cos(a) * 5, y + Math.sin(a) * 5, 5, 2.5, a, 0, TAU);
          g.fill();
        }
        g.fillStyle = 'rgba(120,60,40,.1)';
        g.beginPath();
        g.arc(x, y, 2.4, 0, TAU);
        g.fill();
        g.strokeStyle = 'rgba(160,140,90,.06)';
        g.beginPath();
        g.moveTo(x + 8, y + 6);
        g.quadraticCurveTo(x + 20, y + 20, x + 14, y + 30);
        g.stroke();
      }
    }
    P.fillV(g, 0, 0, W, 16, [[0, '#1a120c'], [1, '#3a2a1e']]);
    // ковёр на стене над диваном
    const kx = 70, ky = 170, kw = 340, kh = 230;
    P.fillV(g, kx, ky, kw, kh, [[0, '#7a2a22'], [1, '#5a1c18']]);
    g.strokeStyle = '#c8a050';
    g.lineWidth = 4;
    g.strokeRect(kx + 10, ky + 10, kw - 20, kh - 20);
    g.strokeStyle = '#2a3a5a';
    g.lineWidth = 6;
    g.strokeRect(kx + 22, ky + 22, kw - 44, kh - 44);
    // ромб в центре и узор
    const cx = kx + kw / 2, cy = ky + kh / 2;
    g.fillStyle = '#2a3a5a';
    g.beginPath();
    g.moveTo(cx, cy - 70); g.lineTo(cx + 90, cy); g.lineTo(cx, cy + 70); g.lineTo(cx - 90, cy);
    g.fill();
    g.fillStyle = '#c8a050';
    g.beginPath();
    g.moveTo(cx, cy - 42); g.lineTo(cx + 54, cy); g.lineTo(cx, cy + 42); g.lineTo(cx - 54, cy);
    g.fill();
    g.fillStyle = '#7a2a22';
    g.beginPath();
    g.moveTo(cx, cy - 20); g.lineTo(cx + 26, cy); g.lineTo(cx, cy + 20); g.lineTo(cx - 26, cy);
    g.fill();
    for (let i = 0; i < 8; i++) {
      const x = kx + 44 + (i % 4) * ((kw - 88) / 3), y = i < 4 ? ky + 44 : ky + kh - 44;
      g.fillStyle = '#c8a050';
      g.beginPath();
      g.arc(x, y, 7, 0, TAU);
      g.fill();
      g.fillStyle = '#2a3a5a';
      g.beginPath();
      g.arc(x, y, 3, 0, TAU);
      g.fill();
    }
    for (let i = 0; i < 400; i++) { g.fillStyle = `rgba(0,0,0,${r() * 0.12})`; g.fillRect(kx + r() * kw, ky + r() * kh, 2, 2); }
    // бахрома
    g.strokeStyle = '#a08050';
    g.lineWidth = 1;
    for (let x = kx; x < kx + kw; x += 4) { g.beginPath(); g.moveTo(x, ky + kh); g.lineTo(x + 1, ky + kh + 8); g.stroke(); }
    // сервант
    const sx = 440, sw = 170;
    P.fillV(g, sx, 250, sw, FLOOR - 250, [[0, '#4a2e1c'], [1, '#2a180c']]);
    P.fillV(g, sx + 10, 262, sw - 20, 150, [[0, 'rgba(120,150,170,.25)'], [1, 'rgba(60,80,100,.2)']]);
    g.fillStyle = '#2a180c';
    g.fillRect(sx + sw / 2 - 2, 262, 4, 150);
    g.fillRect(sx + 10, 336, sw - 20, 4);
    // посуда за стеклом
    for (let i = 0; i < 6; i++) {
      g.fillStyle = 'rgba(230,225,215,.75)';
      g.beginPath();
      g.ellipse(sx + 26 + i * 22, 322, 9, 13, 0, 0, TAU);
      g.fill();
      g.fillStyle = 'rgba(40,80,160,.6)';
      g.beginPath();
      g.ellipse(sx + 26 + i * 22, 322, 5, 7, 0, 0, TAU);
      g.fill();
    }
    for (let i = 0; i < 5; i++) {
      g.fillStyle = 'rgba(210,230,240,.35)';
      P.rrect(g, sx + 22 + i * 28, 368, 14, 34, 3);
      g.fill();
    }
    g.fillStyle = 'rgba(255,255,255,.12)';
    g.beginPath();
    g.moveTo(sx + 16, 262); g.lineTo(sx + 40, 262); g.lineTo(sx + 16, 330);
    g.fill();
    // ящики
    for (let i = 0; i < 2; i++) {
      g.strokeStyle = 'rgba(0,0,0,.4)';
      g.lineWidth = 1.5;
      g.strokeRect(sx + 10, 430 + i * 80, sw - 20, 70);
      g.fillStyle = '#b89a5a';
      g.fillRect(sx + sw / 2 - 8, 462 + i * 80, 16, 4);
    }
    // на серванте: телефон, фотография 1955 года, слоники
    g.fillStyle = '#1a1a1a';
    P.rrect(g, sx + 14, 222, 44, 28, 6);
    g.fill();
    g.fillStyle = '#2a2a2a';
    P.rrect(g, sx + 10, 212, 52, 12, 5);
    g.fill();
    g.fillStyle = '#d8d0c0';
    g.beginPath();
    g.arc(sx + 36, 238, 8, 0, TAU);
    g.fill();
    g.fillStyle = '#2a1a10';
    g.fillRect(sx + 80, 196, 48, 56);
    P.fillV(g, sx + 84, 200, 40, 48, [[0, '#b8a890'], [1, '#7a6a58']]);
    g.fillStyle = '#3a2e26';
    g.beginPath();
    g.arc(sx + 96, 216, 5, 0, TAU);
    g.arc(sx + 112, 214, 5, 0, TAU);
    g.fill();
    g.fillRect(sx + 90, 222, 12, 24);
    g.fillRect(sx + 106, 220, 12, 26);
    g.fillStyle = '#7a2a20';
    g.beginPath();
    g.arc(sx + 96, 212, 5.6, Math.PI, 0);
    g.fill();
    for (let i = 0; i < 4; i++) {
      g.fillStyle = '#d8d0c0';
      g.beginPath();
      g.ellipse(sx + 140 + i * 7, 246 - i, 4 - i * 0.6, 3 - i * 0.4, 0, 0, TAU);
      g.fill();
    }
    // часы «Янтарь» на стене
    g.fillStyle = '#c8a050';
    g.beginPath();
    g.arc(700, 120, 30, 0, TAU);
    g.fill();
    g.fillStyle = '#efe6d0';
    g.beginPath();
    g.arc(700, 120, 24, 0, TAU);
    g.fill();
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * TAU;
      g.fillStyle = '#2a2018';
      g.fillRect(700 + Math.sin(a) * 19 - 1, 120 - Math.cos(a) * 19 - 1, 2, 2);
    }
    // окно на озеро
    P.fillV(g, WIN.x0, WIN.y0, WIN.x1 - WIN.x0, WIN.y1 - WIN.y0, [[0, '#060a14'], [0.55, '#121c30'], [0.56, '#0e1626'], [1, '#04070c']]);
    P.moon(g, WIN.x0 + 160, WIN.y0 + 60, 14, 0.9);
    g.fillStyle = '#04060a';
    g.fillRect(WIN.x0, WIN.y0 + 150, WIN.x1 - WIN.x0, 6);
    P.forest(g, 932, { x0: WIN.x0, x1: WIN.x1, yb: WIN.y0 + 153, hMin: 6, hMax: 16, color: '#04060a', step: [4, 8] });
    for (let i = 0; i < 18; i++) {
      g.fillStyle = `rgba(200,215,240,${0.3 - i * 0.015})`;
      g.fillRect(WIN.x0 + 150 + (r() - 0.5) * 20, WIN.y0 + 160 + i * 6, 14 + r() * 16, 1);
    }
    P.window(g, WIN.x0, WIN.y0, WIN.x1 - WIN.x0, WIN.y1 - WIN.y0, { frame: '#d8d0c0', ft: 8, glow: false, dark: 'rgba(0,0,0,0)' });
    P.fillV(g, WIN.x0 - 24, WIN.y1 + 8, WIN.x1 - WIN.x0 + 48, 14, [[0, '#e0d8c8'], [1, '#9a9488']]);
    // цветок на подоконнике
    g.fillStyle = '#8a4a2a';
    g.fillRect(WIN.x0 + 20, WIN.y1 - 14, 22, 22);
    g.fillStyle = '#2a4a2a';
    for (let i = 0; i < 7; i++) {
      g.beginPath();
      g.ellipse(WIN.x0 + 31 + Math.cos(i) * 10, WIN.y1 - 24 - Math.sin(i * 1.3) * 8, 8, 3, i, 0, TAU);
      g.fill();
    }
    // тюль
    g.fillStyle = 'rgba(230,225,210,.18)';
    g.fillRect(WIN.x0 - 30, WIN.y0 - 20, 70, WIN.y1 - WIN.y0 + 30);
    g.fillRect(WIN.x1 - 40, WIN.y0 - 20, 70, WIN.y1 - WIN.y0 + 30);
    g.fillStyle = '#3a2a1a';
    g.fillRect(WIN.x0 - 40, WIN.y0 - 26, WIN.x1 - WIN.x0 + 80, 6);
    // красный угол: икона и лампадка
    g.fillStyle = '#2a1a10';
    g.beginPath();
    g.moveTo(1220, 40); g.lineTo(1280, 30); g.lineTo(1280, 160); g.lineTo(1220, 150);
    g.fill();
    P.fillV(g, 1228, 50, 40, 90, [[0, '#c8a050'], [1, '#7a5a2a']]);
    g.fillStyle = '#5a3a24';
    g.fillRect(1234, 58, 28, 74);
    g.fillStyle = '#e0c080';
    g.beginPath();
    g.arc(1248, 76, 8, 0, TAU);
    g.fill();
    // пол и дорожка
    P.fillV(g, 0, FLOOR, W, H - FLOOR, [[0, '#5a3a24'], [1, '#2a1a10']]);
    for (let x = 0; x < W; x += 54) { g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(x, FLOOR, 1.5, H - FLOOR); }
    P.fillV(g, 0, FLOOR - 12, W, 12, [[0, '#3a2414'], [1, '#22140a']]);
    for (let i = 0; i < 9; i++) {
      g.fillStyle = ['#7a3a2a', '#3a5a4a', '#c8a050', '#2a3a5a'][i % 4];
      g.fillRect(0, 650 + i * 6, W, 3);
    }
    g.fillStyle = 'rgba(0,0,0,.25)';
    g.fillRect(0, 650, W, 54);
    // диван
    P.fillV(g, 60, 420, 360, 110, [[0, '#5a4a3a'], [1, '#3a2e24']]);
    P.fillV(g, 50, 520, 380, 60, [[0, '#4a3a2c'], [1, '#2a2018']]);
    P.fillV(g, 40, 440, 34, 150, [[0, '#4a3a2c'], [1, '#2a2018']]);
    P.fillV(g, 406, 440, 34, 150, [[0, '#4a3a2c'], [1, '#2a2018']]);
    g.fillStyle = 'rgba(255,255,255,.05)';
    for (let i = 0; i < 3; i++) g.fillRect(80 + i * 112, 430, 100, 4);
    g.fillStyle = '#1a120c';
    g.fillRect(56, 580, 8, 22);
    g.fillRect(416, 580, 8, 22);
    // подушка
    g.fillStyle = '#e8e0d0';
    g.beginPath();
    g.ellipse(80, 516, 36, 13, -0.1, 0, TAU);
    g.fill();
    // столешница (верх стола — за руками Зины)
    g.fillStyle = '#d8d0b8';
    g.beginPath();
    g.moveTo(612, TOP + 18);
    g.lineTo(640, TOP);
    g.lineTo(930, TOP);
    g.lineTo(950, TOP + 18);
    g.closePath();
    g.fill();
    g.save();
    g.clip();
    g.strokeStyle = 'rgba(160,60,50,.35)';
    g.lineWidth = 2;
    for (let x = 600; x < 960; x += 16) { g.beginPath(); g.moveTo(x, TOP); g.lineTo(x - 10, TOP + 18); g.stroke(); }
    for (let y = TOP + 4; y < TOP + 18; y += 6) { g.beginPath(); g.moveTo(600, y); g.lineTo(960, y); g.stroke(); }
    g.restore();
    // чашка и сахарница
    g.fillStyle = '#e8e0d0';
    P.rrect(g, 680, TOP - 10, 16, 16, 3);
    g.fill();
    g.strokeStyle = '#e8e0d0';
    g.lineWidth = 2;
    g.beginPath();
    g.arc(698, TOP - 3, 4, -1.2, 1.2);
    g.stroke();
    g.fillStyle = '#c8b8a0';
    g.beginPath();
    g.ellipse(688, TOP + 6, 14, 3, 0, 0, TAU);
    g.fill();
    P.paper(g, 933, 0.1);
  }
  // Край стола с клеёнкой — перед ногами Зины.
  function tableFront(g) {
    g.fillStyle = '#c8c0a8';
    g.beginPath();
    g.moveTo(612, TOP + 17);
    g.lineTo(950, TOP + 17);
    g.lineTo(954, TOP + 42);
    g.quadraticCurveTo(780, TOP + 48, 608, TOP + 42);
    g.closePath();
    g.fill();
    g.save();
    g.clip();
    g.strokeStyle = 'rgba(160,60,50,.35)';
    g.lineWidth = 2;
    for (let x = 600; x < 960; x += 16) { g.beginPath(); g.moveTo(x, TOP + 17); g.lineTo(x, TOP + 48); g.stroke(); }
    for (let y = TOP + 22; y < TOP + 48; y += 7) { g.beginPath(); g.moveTo(600, y); g.lineTo(960, y); g.stroke(); }
    g.fillStyle = 'rgba(0,0,0,.15)';
    g.fillRect(600, TOP + 36, 360, 14);
    g.restore();
    // ножки стола
    P.fillV(g, 630, TOP + 42, 12, FLOOR + 30 - TOP - 42, [[0, '#4a2e1c'], [1, '#22140a']]);
    P.fillV(g, 920, TOP + 42, 12, FLOOR + 30 - TOP - 42, [[0, '#4a2e1c'], [1, '#22140a']]);
    // табуретка Зины видна под столом
    g.fillStyle = '#2a1a10';
    g.fillRect(830, TOP + 44, 6, 66);
    g.fillRect(878, TOP + 44, 6, 66);
  }

  // ---------- Нить Зины: верёвка из точек (Верле) ----------
  const N = 28;
  const rope = { pts: [], prev: [], grab: -1, tied: false, cut: null, gripLost: 0 };
  const st = { tugT: 3, tug: 0, warn: 0, moved: 0, last: null, hold: 0, done: false, active: false, letter: 0, failing: false, stopped: false, window: { x: 1100, y: 320 } };
  function anchorA() { return [ZINA.x - 18, ZINA.y - 78]; }
  function anchorB() {
    if (rope.tied) return [KNOT.x, KNOT.y];
    const yank = st.tug > 0 ? Math.sin(st.tug * Math.PI) * 30 : 0;
    return [WIN.x0 + 120 + yank, WIN.y0 + 210 + yank * 0.3];
  }
  function ropeInit() {
    const a = anchorA(), b = anchorB();
    rope.pts = [];
    for (let i = 0; i <= N; i++) rope.pts.push([lerp(a[0], b[0], i / N), lerp(a[1], b[1], i / N) + Math.sin((i / N) * Math.PI) * 30]);
    rope.prev = rope.pts.map((p) => p.slice());
    rope.grab = -1;
  }
  function ropeStep(dt) {
    const pts = rope.pts, prev = rope.prev;
    const a = anchorA(), b = anchorB();
    // длина в покое: путь через точку захвата, с провисом
    let path = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (rope.grab >= 0) {
      const m = pts[rope.grab];
      path = Math.hypot(m[0] - a[0], m[1] - a[1]) + Math.hypot(b[0] - m[0], b[1] - m[1]);
    }
    // длина звена — своя по обе стороны от точки захвата, чтобы нить не провисала до пола
    let restA = (path * 1.1) / N, restB = restA;
    if (rope.grab >= 0) {
      const m = pts[rope.grab];
      restA = (Math.hypot(m[0] - a[0], m[1] - a[1]) * 1.08) / rope.grab;
      restB = (Math.hypot(b[0] - m[0], b[1] - m[1]) * 1.08) / (N - rope.grab);
    }
    for (let i = 1; i < N; i++) {
      if (i === rope.grab) continue;
      const p = pts[i], q = prev[i];
      const vx = (p[0] - q[0]) * 0.96, vy = (p[1] - q[1]) * 0.96;
      q[0] = p[0]; q[1] = p[1];
      p[0] += vx + Math.sin(G.t * 1.3 + i) * 0.05;
      p[1] += vy + 260 * dt * dt;
    }
    pts[0] = a.slice();
    pts[N] = b.slice();
    for (let it = 0; it < 14; it++) {
      for (let i = 0; i < N; i++) {
        const p = pts[i], q = pts[i + 1];
        const dx = q[0] - p[0], dy = q[1] - p[1], d = Math.hypot(dx, dy) || 0.001;
        const rest = rope.grab >= 0 && i >= rope.grab ? restB : restA;
        const diff = (d - rest) / d;
        const pi = i === 0 || i === rope.grab ? 0 : 0.5, qi = i + 1 === N || i + 1 === rope.grab ? 0 : 0.5;
        const s = pi + qi || 1;
        p[0] += dx * diff * (pi / s);
        p[1] += dy * diff * (pi / s);
        q[0] -= dx * diff * (qi / s);
        q[1] -= dy * diff * (qi / s);
      }
      pts[0] = a.slice();
      pts[N] = b.slice();
    }
  }
  // Светящаяся нить по точкам.
  function drawRope(ctx, pts, t, color, al, w = 2) {
    if (al <= 0.01) return;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    [[w * 7, 0.06], [w * 3, 0.16], [w, 0.8]].forEach(([lw, la]) => {
      ctx.strokeStyle = hex(color, la * al);
      ctx.lineWidth = lw;
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length - 1; i++) ctx.quadraticCurveTo(pts[i][0], pts[i][1], (pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2);
      ctx.lineTo(pts[pts.length - 1][0], pts[pts.length - 1][1]);
      ctx.stroke();
    });
    for (let i = 0; i < 6; i++) {
      const k = (t * 0.16 + i / 6) % 1;
      const p = pts[Math.min(pts.length - 1, Math.floor(k * (pts.length - 1)))];
      ctx.fillStyle = hex(color, al * 0.9 * Math.sin(k * Math.PI));
      ctx.beginPath();
      ctx.arc(p[0], p[1], w * 1.5, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  // ---------- Персонажи ----------
  const zina = OM.actor({ id: 'zina', x: ZINA.x, y: ZINA.y, s: 1.26, face: -1, autoScale: false, draw: (c, a, t) => A.zina(c, a, t) });
  const mitya = OM.actor({ id: 'mitya', x: 66, y: 530, s: 1.5, face: 1, autoScale: false, z: 520, draw: (c, a, t) => A.sleeper(c, a, t) });

  function back(ctx, t) {
    // лампа с абажуром над столом
    ctx.strokeStyle = '#1a120c';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(LAMP.x, 16);
    ctx.lineTo(LAMP.x, LAMP.y - 30);
    ctx.stroke();
    P.glow(ctx, LAMP.x, LAMP.y + 60, 420, '#ffb060', 0.22);
    P.glow(ctx, LAMP.x, TOP, 220, '#ffc070', 0.25);
    ctx.fillStyle = '#c8602a';
    ctx.beginPath();
    ctx.moveTo(LAMP.x - 22, LAMP.y - 32);
    ctx.lineTo(LAMP.x + 22, LAMP.y - 32);
    ctx.quadraticCurveTo(LAMP.x + 70, LAMP.y - 6, LAMP.x + 76, LAMP.y + 14);
    ctx.lineTo(LAMP.x - 76, LAMP.y + 14);
    ctx.quadraticCurveTo(LAMP.x - 70, LAMP.y - 6, LAMP.x - 22, LAMP.y - 32);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,200,120,.35)';
    ctx.fillRect(LAMP.x - 60, LAMP.y + 2, 120, 4);
    ctx.strokeStyle = '#a04a20';
    ctx.lineWidth = 1;
    for (let x = -74; x <= 74; x += 4) {
      const sw = Math.sin(t * 1.2 + x * 0.1) * 1;
      ctx.beginPath();
      ctx.moveTo(LAMP.x + x, LAMP.y + 14);
      ctx.lineTo(LAMP.x + x + sw, LAMP.y + 26);
      ctx.stroke();
    }
    P.glow(ctx, LAMP.x, LAMP.y + 18, 40, '#fff0c0', 0.5);
    // лампадка
    const fl = 0.8 + Math.sin(t * 7) * 0.1 + Math.random() * 0.1;
    P.glow(ctx, 1248, 150, 40, '#ff4020', 0.45 * fl);
    ctx.fillStyle = '#a02018';
    ctx.beginPath();
    ctx.arc(1248, 152, 6, 0, TAU);
    ctx.fill();
    // стрелки «Янтаря»
    const m = OM.ch4.time();
    const hA = (((m / 60) + 11) % 12) / 12 * TAU, mA = ((m % 60) / 60) * TAU;
    ctx.strokeStyle = '#1a1410';
    ctx.lineCap = 'round';
    [[hA, 11, 2.4], [mA, 17, 1.4]].forEach(([a, l, w]) => {
      ctx.lineWidth = w;
      ctx.beginPath();
      ctx.moveTo(700, 120);
      ctx.lineTo(700 + Math.sin(a) * l, 120 - Math.cos(a) * l);
      ctx.stroke();
    });
    // Тихий в воде за окном — смотрит в комнату
    ctx.save();
    ctx.beginPath();
    ctx.rect(WIN.x0, WIN.y0, WIN.x1 - WIN.x0, WIN.y1 - WIN.y0);
    ctx.clip();
    if (!rope.tied || st.sink < 1) {
      const sk = rope.tied ? st.sink : 0;
      A.tall(ctx, { x: WIN.x0 + 116, y: WIN.y0 + 300 + sk * 120, s: 0.34, face: -1, alpha: 0.95 * (1 - sk), reach: st.tug > 0 || st.warn > 0 ? 0.8 : 0.15, jitter: st.warn > 0 ? 4 : 0.8, body: '#020306', face2: 1.2 }, t);
    }
    ctx.restore();
    // стекло окна поверх
    ctx.fillStyle = 'rgba(160,190,220,.05)';
    ctx.fillRect(WIN.x0, WIN.y0, WIN.x1 - WIN.x0, WIN.y1 - WIN.y0);
    // письмо и ручка на столе: строки появляются
    ctx.save();
    ctx.translate(774, TOP + 6);
    ctx.rotate(-0.05);
    ctx.fillStyle = '#f0ead8';
    ctx.beginPath();
    ctx.moveTo(-34, -6); ctx.lineTo(30, -6); ctx.lineTo(34, 8); ctx.lineTo(-30, 8);
    ctx.fill();
    ctx.strokeStyle = 'rgba(30,40,90,.6)';
    ctx.lineWidth = 0.7;
    const lines = Math.floor(st.letter * 5);
    for (let i = 0; i < Math.min(5, lines + 1); i++) {
      const len = i < lines ? 52 : (st.letter * 5 - lines) * 52;
      ctx.beginPath();
      for (let x = 0; x < len; x += 2) ctx.lineTo(-28 + x + i * 0.8, -3 + i * 2.4 + Math.sin(x * 1.3 + i) * 0.4);
      ctx.stroke();
    }
    if (st.torn) {
      ctx.fillStyle = '#3a2a1e';
      ctx.fillRect(-2, -7, 3, 16);
    }
    ctx.restore();
  }
  function over(ctx, t) {
    OM.story4.cornerClock(ctx, 74, 86);
    // нить Зины видна и вне режима нитей — слабо, как паутинка в свете лампы
  }
  function threads(ctx, t, k) {
    const h = G.hero;
    OM.thread(ctx, [h.x, h.y - 110 * h.s], [WIN.x0 + 150, WIN.y0 + 220], t, { color: '#ffd27a', a: k * 0.4, sag: 30, w: 1.2 });
    // нить Мити: короткая, свёрнутая, с узелком
    const mp = [mitya.x + 40 * mitya.s, mitya.y - 22 * mitya.s];
    const pulse = 0.6 + 0.4 * Math.sin(t * 2.4);
    OM.thread(ctx, mp, [KNOT.x, KNOT.y], t, { color: '#cfe4ff', a: k, sag: -20, w: 1.6, speed: 0.2 });
    if (!rope.tied) {
      P.glow(ctx, KNOT.x, KNOT.y, 28 + st.hold * 30, '#cfe4ff', k * (0.4 + pulse * 0.3 + st.hold));
      ctx.strokeStyle = hex('#cfe4ff', k * 0.8);
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(KNOT.x, KNOT.y, 9, 0, TAU * Math.max(0.02, st.hold));
      ctx.stroke();
    }
    // нить Зины
    const warn = st.warn > 0 || st.tug > 0;
    drawRope(ctx, rope.pts, t, rope.tied ? '#ffe0b0' : warn ? '#ff8a6a' : '#ffd27a', k, rope.grab >= 0 ? 2.6 : 2);
    if (rope.cut) {
      drawRope(ctx, rope.cut.pts, t, '#7a90b0', k * rope.cut.a, 1.4);
    }
    if (!rope.tied && rope.grab < 0 && OM.flag('zinaTalked') && G.mouse.x >= 0) {
      // подсказка: ближайшая точка нити под курсором
      const near = nearestPt(G.mouse.x, G.mouse.y);
      if (near.d < 22) P.glow(ctx, rope.pts[near.i][0], rope.pts[near.i][1], 22, '#fff0c0', k * 0.8);
    }
    if (rope.grab >= 0) {
      const p = rope.pts[rope.grab];
      P.glow(ctx, p[0], p[1], 26, warn ? '#ff8a6a' : '#fff0c0', k);
    }
    if (warn && !rope.tied) P.glow(ctx, WIN.x0 + 120, WIN.y0 + 210, 80, '#ff5a3a', k * 0.5);
  }
  function nearestPt(x, y) {
    let best = { i: -1, d: 1e9 };
    rope.pts.forEach((p, i) => {
      if (i === 0 || i === N) return;
      const d = Math.hypot(p[0] - x, p[1] - y);
      if (d < best.d) best = { i, d };
    });
    return best;
  }

  function update(dt, t) {
    if (rope.cut) {
      rope.cut.a -= dt * 0.6;
      rope.cut.pts.forEach((p, i) => { p[0] += 40 * dt * (i / rope.cut.pts.length); p[1] += 60 * dt; });
      if (rope.cut.a <= 0) rope.cut = null;
    }
    if (rope.tied) st.sink = Math.min(1, (st.sink || 0) + dt * 0.4);
    // захваченная точка тянется к курсору, но верёвка тяжёлая
    if (rope.grab >= 0) {
      if (!G.mouse.down || !G.threads) release();
      else {
        const p = rope.pts[rope.grab];
        const dx = G.mouse.x - p[0], dy = G.mouse.y - p[1], d = Math.hypot(dx, dy);
        const sp = 240 * dt;
        const mv = Math.min(d, sp);
        if (d > 0.5) { p[0] += (dx / d) * mv; p[1] += (dy / d) * mv; }
        rope.prev[rope.grab] = p.slice();
        if (st.tug > 0) st.moved += mv;
        // узелок Мити
        if (Math.hypot(p[0] - KNOT.x, p[1] - KNOT.y) < 34) {
          st.hold += dt / 0.8;
          if (st.hold >= 1 && !rope.tied) tie();
        } else st.hold = Math.max(0, st.hold - dt * 2);
      }
    } else st.hold = Math.max(0, st.hold - dt * 2);
    ropeStep(Math.min(dt, 0.033));
    if (!st.active || st.done || st.failing || G.mode !== 'play') return;
    // Зина пишет
    if (!st.stopped) st.letter = Math.min(1, st.letter + dt / 110);
    if (st.letter >= 1) { st.failing = true; OM.run(fail); return; }
    // Тихий тянет: предупреждение, потом рывок
    st.tugT -= dt;
    if (st.tugT <= 0.6 && st.tugT + dt > 0.6) { st.warn = 0.6; S.heartbeat(); }
    if (st.warn > 0) st.warn -= dt;
    if (st.tugT <= 0) {
      st.tugT = 3 + Math.random() * 1.2;
      st.tug = 0.001;
      st.moved = 0;
      S.whisper(0.6, 0.15);
      OM.shake(3);
    }
    if (st.tug > 0) {
      st.tug += dt / 0.8;
      if (rope.grab >= 0 && st.moved > 10) {
        // дёрнулся, когда тянули, — вырвало из рук
        const g = rope.grab;
        release();
        rope.prev[g] = [rope.pts[g][0] - 30, rope.pts[g][1]];
        S.hit();
        OM.toast('Когда тянут — замрите. Иначе вырвет из рук.');
      }
      if (st.tug >= 1) st.tug = 0;
    }
  }
  function release() { rope.grab = -1; }

  function onPress(x, y, button) {
    if (!G.threads || rope.tied || st.done || button === 2) return false;
    const near = nearestPt(x, y);
    if (near.d > 26) return false;
    if (!OM.flag('zinaTalked')) {
      OM.run(() => say('Сначала — поговорить с ней. Понять, за что её держат.'));
      return true;
    }
    rope.grab = near.i;
    S.threads && S.click();
    if (!OM.flag('ropeTip')) { OM.flag('ropeTip', 1); OM.toast('Ведите нить к узелку Мити. Когда за окном тянут — замрите.'); }
    return true;
  }

  async function tie() {
    rope.tied = true;
    const g = rope.grab;
    // отрезанный кусок к окну падает и гаснет
    rope.cut = { pts: rope.pts.slice(g).map((p) => p.slice()), a: 1 };
    rope.grab = -1;
    // остаток верёвки — от Зины до узелка
    const a = anchorA();
    rope.pts = [];
    for (let i = 0; i <= N; i++) rope.pts.push([lerp(a[0], KNOT.x, i / N), lerp(a[1], KNOT.y, i / N) + Math.sin((i / N) * Math.PI) * 40]);
    rope.prev = rope.pts.map((p) => p.slice());
    st.done = true;
    S.bell && S.bell(0.5);
    OM.flash(0.4);
    await OM.run(saved);
  }

  async function saved() {
    await OM.wait(900);
    OM.toggleThreads(false);
    OM.letterbox(true);
    st.stopped = true;
    S.heartbeat();
    await OM.wait(700);
    zina.talking = false;
    await zsay('…Митенька.');
    await zsay('Кто ж его в школу-то поведёт. Вера — она хорошая. Но своя бабка — это своя бабка.');
    S.creak();
    st.torn = true;
    await zsay('Не пойду. Пусть ждут. Сорок лет ждали — подождут ещё.');
    await say('Спасибо.');
    await zsay('Это тебе спасибо, Лёвушка. Иди. У тебя ещё кто-то есть — по глазам вижу.');
    OM.letterbox(false);
    await OM.story4.rescued('hotel');
  }

  async function fail() {
    G.flags.fails4 = (G.flags.fails4 || 0) + 1;
    S.hit();
    await OM.fadeTo(1, 900);
    await OM.say('narr', 'Зина сложила письмо, накинула шаль и вышла. Догнал её только у самой воды — и не смог развернуть.', { hold: 1.8 });
    st.letter = 0;
    rope.tied = false;
    ropeInit();
    await OM.fadeTo(0, 800);
    await say('Ещё раз. Пока она пишет — есть время.');
    st.failing = false;
  }

  async function talkZina() {
    const seen = (G.flags.zinaSeen = G.flags.zinaSeen || {});
    if (!OM.flag('zinaTalked')) {
      await zsay('Пришёл. Знала, что придёшь. Садись — не сядешь ведь.');
      await say('Вы знали. Все эти дни. Сорок лет.');
      await zsay('Знала. Ты у меня на руках из воды вышел, а Анна осталась.');
      await zsay('Тогда говорили: вода возьмёт того, кто уйдёт последним. Последней была я. С тобой.');
      await zsay('Она за меня осталась. Теперь моя очередь. Тринадцать минут первого.');
      OM.flag('zinaTalked', 1);
    }
    for (;;) {
      const opts = [
        { id: 'mitya', text: 'А Митя?' },
        { id: 'debt', text: 'Вы ничего не должны.' },
        { id: 'stop', text: 'Я вас не отпущу.' },
        { id: 'anna', text: 'Какой она была — мама?' },
      ];
      opts.forEach((o) => (o.seen = seen[o.id]));
      opts.push({ id: 'bye', text: '…' });
      const c = await OM.choose(opts);
      seen[c] = 1;
      if (c === 'bye') return;
      if (c === 'mitya') {
        await zsay('Митю Вера возьмёт. Я в письме всё написала — и про школу, и про лекарства.');
        await zsay('Он у меня один. А долг — тоже один.');
      }
      if (c === 'debt') await zsay('Должна, Лёва. Долг — как вода: сколько ни черпай, а он стоит.');
      if (c === 'stop') {
        await zsay('А ты меня не держишь. Меня вода держит. Ты погляди — сам увидишь.');
        if (!G.threads) OM.toast('Пробел или глаз — посмотреть иначе.');
      }
      if (c === 'anna') {
        await zsay('Смешливая. Пела на клиросе — голос высокий, звонкий. Платок красный носила, мамин.');
        await zsay('И упрямая. Как ты.');
      }
    }
  }

  OM.scene('zinaroom', {
    name: 'Комната Зинаиды',
    surface: 'floor',
    figLight: { amb: 0.62, tint: '#5a4030', side: 1 },
    amb: { indoor: true, hum: 0.5, rain: 0.2, drone: 0.2 },
    walk: [[150, 640], [940, 640], [940, 704], [150, 704]],
    depth: { y0: 640, s0: 1.12, y1: 704, s1: 1.22 },
    entries: { default: { x: 330, y: 680, face: 1 } },
    lights: [{ x: LAMP.x, y: LAMP.y + 40, color: '#ffbf78', a: 1, reach: 520 }, { x: WIN.x0 + 110, y: 300, color: '#9ab0d0', a: 0.35, reach: 300 }],
    layers: [{ z: ZINA.y + 6, paint: tableFront }],
    actors: () => [zina, mitya],
    paint,
    back,
    over,
    threads,
    update,
    onPress,
    hotspots: [
      { id: 'carpet', name: 'Ковёр', rect: [70, 170, 340, 230], look: 'Ковёр на стене. Митя, наверное, засыпает, разглядывая ромбы — как все мы в детстве.' },
      { id: 'mitya', name: 'Митя', rect: [40, 470, 220, 80], walk: [300, 660], face: -1, look: 'Спит. Кулак под щекой. После той ночи на пристани один спать не может — Зина забрала к себе.', use: () => say('Не будить. Пусть спит. Это его нить — короткая, тёплая.') },
      { id: 'photo', name: 'Фотография', rect: [516, 190, 60, 66], walk: [540, 660], face: 1, look: ['Две девушки на ступенях церкви. «Зина и Аня. Покров, 1955».', 'У Ани — платок. Тот самый. И улыбка, которой я никогда не видел.'] },
      { id: 'phone', name: 'Телефон', rect: [446, 206, 64, 46], look: 'Телефон. Молчит. Я рад, что он молчит.' },
      { id: 'sideboard', name: 'Сервант', rect: [440, 256, 170, 354], look: 'Сервант. Сервиз «Мадонна», хрустальные рюмки. Всё парадное — и ни разу не пользованное.' },
      { id: 'clock', name: 'Часы', rect: [666, 86, 68, 68], look: () => say(`Часы на стене: ${OM.ch4.fmt(OM.ch4.time())}.`) },
      { id: 'letter', name: 'Письмо', rect: [736, TOP - 8, 76, 24], look: () => (st.torn ? say('Разорвано пополам. Хорошо.') : OM.talk([['lev', '«Лёва. Прости, что молчала. Твоя мама…»'], ['lev', 'Дальше не разобрать. Рука у неё дрожит, а пишет — ровно.']])) },
      { id: 'window', name: 'Окно', rect: [WIN.x0, WIN.y0, WIN.x1 - WIN.x0, WIN.y1 - WIN.y0], walk: [930, 660], face: 1, look: ['Озеро. Луна. И в воде — он. Стоит по пояс и смотрит сюда. На неё.', 'Не в лицо. Не смотреть в лицо.'] },
      { id: 'icon', name: 'Икона', rect: [1220, 40, 60, 130], look: 'Красный угол. Лампадка теплится. Зина крестится на неё, когда думает, что никто не видит.' },
      { id: 'zina', name: 'Зинаида Павловна', rect: [ZINA.x - 50, ZINA.y - 150, 100, 110], walk: [760, 670], face: 1, use: talkZina, look: () => say(st.done ? 'Сидит, сложив руки. Письмо порвано.' : 'Пишет. Не торопится. Очки на кончике носа. Шаль на плечах — как на выход.') },
    ],
    setup() {
      rope.tied = false; rope.cut = null;
      ropeInit();
      st.tugT = 3.5; st.tug = 0; st.warn = 0; st.hold = 0; st.done = !!OM.flag('saved_hotel'); st.active = false; st.letter = 0.15; st.failing = false; st.stopped = false; st.torn = false; st.sink = 0;
    },
    leave() { rope.grab = -1; },
    async enter() {
      if (OM.flag('saved_hotel')) return;
      OM.letterbox(true);
      await OM.wait(400);
      await say('За стойкой — дверь в её комнату. Свет горит.');
      await zsay('Тише, Лёва. Митю разбудишь.');
      OM.letterbox(false);
      st.active = true;
    },
    resume() { st.active = true; },
  });
  OM.zinaroom = { st, rope, zina, mitya };
})();
