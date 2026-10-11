// Глава 4. Карта ночного города: часы, нити от трёх окон к воде, Тихие поднимаются по нитям.
// Здесь же общие помощники главы: время (минуты после 23:00), формат, циферблат.
(function () {
  const P = OM.P, S = OM.S, G = OM.G;
  const { hex, rng, W, H, lerp, clamp } = OM;
  const TAU = Math.PI * 2;

  // ---------- Время ----------
  const START = 24, DEADLINE = 73, RESCUE = 14; // 23:24 … 00:13, спасение занимает ~14 минут
  const C4 = (OM.ch4 = { START, DEADLINE, RESCUE });
  C4.time = () => G.flags.clock ?? START;
  C4.fmt = (m) => {
    const h = (23 + Math.floor(m / 60)) % 24, mm = Math.floor(m % 60);
    return String(h).padStart(2, '0') + ':' + String(mm).padStart(2, '0');
  };
  // Наручные часы «Победа»: циферблат, стрелки, время под ними.
  C4.drawClock = (ctx, x, y, r, m, o = {}) => {
    const al = o.a ?? 1;
    if (al <= 0) return;
    ctx.save();
    ctx.globalAlpha = al;
    // ремешок
    ctx.fillStyle = '#2a1c14';
    P.rrect(ctx, x - r * 0.55, y - r * 1.7, r * 1.1, r * 3.4, r * 0.2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,.4)';
    ctx.lineWidth = 1;
    for (let i = -3; i <= 3; i++) {
      if (Math.abs(i) < 2) continue;
      ctx.beginPath();
      ctx.moveTo(x - r * 0.5, y + i * r * 0.42);
      ctx.lineTo(x + r * 0.5, y + i * r * 0.42);
      ctx.stroke();
    }
    // корпус
    ctx.fillStyle = P.rgrad(ctx, x - r * 0.3, y - r * 0.3, r * 0.2, r * 1.3, [[0, '#e8d8a8'], [1, '#7a6438']]);
    ctx.beginPath();
    ctx.arc(x, y, r * 1.08, 0, TAU);
    ctx.fill();
    ctx.fillStyle = P.rgrad(ctx, x, y - r * 0.2, r * 0.1, r, [[0, '#f2ead6'], [1, '#c8bc9c']]);
    ctx.beginPath();
    ctx.arc(x, y, r * 0.94, 0, TAU);
    ctx.fill();
    // деления и цифры
    ctx.strokeStyle = '#2a2018';
    for (let i = 0; i < 60; i++) {
      const a = (i / 60) * TAU, l = i % 5 ? 0.06 : 0.14;
      ctx.lineWidth = i % 5 ? 0.6 : 1.4;
      ctx.beginPath();
      ctx.moveTo(x + Math.sin(a) * r * 0.88, y - Math.cos(a) * r * 0.88);
      ctx.lineTo(x + Math.sin(a) * r * (0.88 - l), y - Math.cos(a) * r * (0.88 - l));
      ctx.stroke();
    }
    [12, 3, 6, 9].forEach((n, i) => {
      const a = (i / 4) * TAU;
      P.text(ctx, String(n), x + Math.sin(a) * r * 0.6, y - Math.cos(a) * r * 0.6 + 1, { font: `700 ${r * 0.24}px "PT Serif",serif`, color: '#2a2018' });
    });
    P.text(ctx, 'ПОБЕДА', x, y + r * 0.3, { font: `600 ${r * 0.11}px "PT Serif",serif`, color: '#6a5a40', ls: 1 });
    // сектор «осталось» — красным до 00:13
    if (o.deadline !== false) {
      const a0 = ((m % 60) / 60) * TAU - Math.PI / 2, a1 = ((DEADLINE % 60) / 60) * TAU - Math.PI / 2 + (m >= DEADLINE - 60 ? 0 : TAU);
      if (m < DEADLINE) {
        ctx.fillStyle = 'rgba(170,40,30,.18)';
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.arc(x, y, r * 0.86, a0, a1 > a0 ? a1 : a1 + TAU);
        ctx.closePath();
        ctx.fill();
      }
    }
    // стрелки
    const hA = (((m / 60) + 11) % 12) / 12 * TAU, mA = ((m % 60) / 60) * TAU;
    const hand = (a, l, w, col) => {
      ctx.strokeStyle = col;
      ctx.lineWidth = w;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x - Math.sin(a) * r * 0.12, y + Math.cos(a) * r * 0.12);
      ctx.lineTo(x + Math.sin(a) * r * l, y - Math.cos(a) * r * l);
      ctx.stroke();
    };
    hand(hA, 0.5, r * 0.08, '#1a1410');
    hand(mA, 0.78, r * 0.05, '#1a1410');
    const sA = ((G.t * 6) % 60) / 60 * TAU;
    hand(sA, 0.82, 0.8, '#a83a2a');
    ctx.fillStyle = '#1a1410';
    ctx.beginPath();
    ctx.arc(x, y, r * 0.06, 0, TAU);
    ctx.fill();
    // блик стекла
    ctx.fillStyle = 'rgba(255,255,255,.18)';
    ctx.beginPath();
    ctx.ellipse(x - r * 0.3, y - r * 0.4, r * 0.4, r * 0.18, -0.6, 0, TAU);
    ctx.fill();
    ctx.restore();
    if (o.label !== false) {
      P.text(ctx, C4.fmt(m), x, y + r * 1.25 + 12, { font: '600 22px "Cormorant Garamond",serif', color: m >= DEADLINE - 10 ? '#ff9a7a' : '#f1e6cc', alpha: al, ls: 2 });
    }
  };

  // ---------- Карта ----------
  // Береговая линия: суша сверху-слева, вода снизу и справа.
  const SHORE = [[-20, 560], [180, 590], [380, 604], [560, 592], [700, 560], [860, 500], [980, 420], [1060, 320], [1110, 200], [1160, 90], [1300, 40]];
  const PLACES = {
    pier: { x: 520, y: 588, name: 'Пристань', who: 'Никодим ждёт с лодкой' },
    hotel: { x: 300, y: 300, name: 'Гостиница «Заря»', who: 'Зинаида Павловна и Митя', scene: 'zinaroom' },
    library: { x: 700, y: 322, name: 'Библиотека', who: 'Вера Андреевна живёт на втором этаже', scene: 'veraflat' },
    sem: { x: 930, y: 444, name: 'Лодочная станция', who: 'Семёныч', scene: 'boatyard' },
  };
  const ROADS = [
    [[-20, 196], [180, 214], [300, 300]],
    [[300, 300], [470, 280], [640, 262]],
    [[640, 262], [700, 322]],
    [[640, 262], [600, 420], [520, 588]],
    [[300, 300], [380, 450], [520, 588]],
    [[700, 322], [840, 360], [930, 444]],
    [[520, 588], [740, 540], [930, 444]],
    [[640, 262], [760, 160], [900, 120], [1080, 70]],
  ];
  // Время пути, минуты.
  const DIST = { 'pier-hotel': 9, 'pier-library': 11, 'pier-sem': 6, 'hotel-library': 6, 'hotel-sem': 10, 'library-sem': 13 };
  C4.dist = (a, b) => (a === b ? 0 : DIST[a + '-' + b] ?? DIST[b + '-' + a]);
  C4.PLACES = PLACES;

  function curvePts(pts, n = 16) {
    if (pts.length === 2) return pts;
    const out = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1];
      const m0 = i === 0 ? a : [(pts[i - 1][0] + a[0]) / 2 + (a[0] - pts[i - 1][0]) / 2, (pts[i - 1][1] + a[1]) / 2 + (a[1] - pts[i - 1][1]) / 2];
      void m0;
      for (let k = 0; k < n; k++) out.push([lerp(a[0], b[0], k / n), lerp(a[1], b[1], k / n)]);
    }
    out.push(pts[pts.length - 1]);
    return out;
  }
  function strokeRoad(g, pts, w, col) {
    g.strokeStyle = col;
    g.lineWidth = w;
    g.lineCap = 'round';
    g.lineJoin = 'round';
    g.beginPath();
    g.moveTo(pts[0][0], pts[0][1]);
    if (pts.length === 3) g.quadraticCurveTo(pts[1][0], pts[1][1], pts[2][0], pts[2][1]);
    else for (let i = 1; i < pts.length; i++) {
      if (i < pts.length - 1) g.quadraticCurveTo(pts[i][0], pts[i][1], (pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2);
      else g.lineTo(pts[i][0], pts[i][1]);
    }
    g.stroke();
  }
  // Домик сверху-сбоку: стена к зрителю, двускатная крыша, окна.
  function house(g, x, y, w, d, r, o = {}) {
    const hgt = o.h || 9;
    const roof = o.roof || ['#3a3a40', '#4a3a34', '#30363a', '#40342c'][(r() * 4) | 0];
    // тень
    g.fillStyle = 'rgba(0,0,0,.35)';
    g.beginPath();
    g.ellipse(x + w * 0.5 + 4, y + 3, w * 0.62, d * 0.35, 0, 0, TAU);
    g.fill();
    // стена
    g.fillStyle = o.wall || OM.Fig.shade('#4a4038', (r() - 0.5) * 0.3);
    g.fillRect(x, y - hgt, w, hgt);
    // крыша
    g.fillStyle = roof;
    g.beginPath();
    g.moveTo(x - 2, y - hgt);
    g.lineTo(x + w * 0.5, y - hgt - d);
    g.lineTo(x + w + 2, y - hgt);
    g.closePath();
    g.fill();
    g.fillStyle = 'rgba(190,210,235,.12)';
    g.beginPath();
    g.moveTo(x + w * 0.5, y - hgt - d);
    g.lineTo(x + w + 2, y - hgt);
    g.lineTo(x + w * 0.5, y - hgt);
    g.closePath();
    g.fill();
    // окна
    const n = Math.max(1, Math.floor(w / 9));
    for (let i = 0; i < n; i++) {
      const lit = o.lit != null ? o.lit : r() < 0.35;
      g.fillStyle = lit ? '#ffcf78' : '#141a20';
      g.fillRect(x + 3 + i * ((w - 6) / n), y - hgt + 3, 3, 3);
      if (lit) P.glow(g, x + 4.5 + i * ((w - 6) / n), y - hgt + 4.5, 9, '#ffb050', 0.25);
    }
  }
  function tree(g, x, y, s, r) {
    g.fillStyle = 'rgba(0,0,0,.35)';
    g.beginPath();
    g.ellipse(x + 4, y + 2, s * 1.1, s * 0.4, 0, 0, TAU);
    g.fill();
    for (let i = 0; i < 4; i++) {
      g.fillStyle = OM.Fig.shade('#0f1613', (r() - 0.5) * 0.25);
      g.beginPath();
      g.arc(x + (r() - 0.5) * s, y - s * 0.6 + (r() - 0.5) * s * 0.6, s * (0.5 + r() * 0.4), 0, TAU);
      g.fill();
    }
    g.fillStyle = 'rgba(140,170,200,.05)';
    g.beginPath();
    g.arc(x + s * 0.2, y - s * 1.0, s * 0.35, 0, TAU);
    g.fill();
  }
  function nearRoad(x, y, pad) {
    for (const rd of ROADS) for (const p of curvePts(rd, 10)) if (Math.hypot(p[0] - x, p[1] - y) < pad) return true;
    return false;
  }
  function inWater(x, y) {
    for (let i = 0; i < SHORE.length - 1; i++) {
      const [x0, y0] = SHORE[i], [x1, y1] = SHORE[i + 1];
      if (x >= x0 && x <= x1) return y > lerp(y0, y1, (x - x0) / (x1 - x0)) - 6;
    }
    return x > 1160 && y > 40;
  }

  function paint(g) {
    // суша: тёмная, с фактурой
    P.fillV(g, 0, 0, W, H, [[0, '#121816'], [1, '#1a201c']]);
    P.speckle(g, 701, 0, 0, W, H, 7000, '#2a3430', 0.5);
    P.paper(g, 702, 0.12);
    // лес на севере
    const r = rng(703);
    for (let i = 0; i < 260; i++) {
      const x = r() * W, y = r() * 130 - 10;
      if (inWater(x, y)) continue;
      tree(g, x, y + 20, 6 + r() * 6, r);
    }
    // вода
    g.fillStyle = '#0a1420';
    g.beginPath();
    g.moveTo(SHORE[0][0], SHORE[0][1]);
    SHORE.forEach(([x, y], i) => { if (i) g.quadraticCurveTo(x, y, x, y); });
    g.lineTo(W + 40, H + 40);
    g.lineTo(-40, H + 40);
    g.closePath();
    g.fill();
    g.save();
    g.clip();
    P.fillV(g, 0, 300, W, 420, [[0, 'rgba(30,50,80,.35)'], [1, 'rgba(0,0,0,.4)']]);
    // рябь и лунная дорожка
    for (let i = 0; i < 260; i++) {
      const x = r() * W, y = 330 + r() * 400;
      g.fillStyle = `rgba(150,180,215,${0.04 + r() * 0.08})`;
      g.fillRect(x, y, 8 + r() * 30, 1);
    }
    // лунные блики: короткие мазки, гуще к луне
    for (let i = 0; i < 220; i++) {
      const k = Math.pow(r(), 0.8);
      const cx = 1180 - k * 360 + (r() - 0.5) * (40 + k * 90), cy = 120 + k * 560 + (r() - 0.5) * 30;
      g.fillStyle = `rgba(220,230,245,${(0.05 + r() * 0.12) * (1 - k * 0.6)})`;
      g.fillRect(cx, cy, 3 + r() * 14, 1);
    }
    // затопленное Покровское: тени крыш и церковь под водой
    for (let i = 0; i < 26; i++) {
      g.fillStyle = 'rgba(40,60,80,.35)';
      g.fillRect(820 + r() * 360, 560 + r() * 140, 10 + r() * 8, 6 + r() * 4);
    }
    g.restore();
    // кромка берега: песок и камыш
    g.strokeStyle = 'rgba(120,130,120,.35)';
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(SHORE[0][0], SHORE[0][1]);
    SHORE.forEach(([x, y], i) => { if (i) g.quadraticCurveTo(x, y, x, y); });
    g.stroke();
    for (let i = 0; i < 160; i++) {
      const k = r() * (SHORE.length - 1.01), j = Math.floor(k), f = k - j;
      const x = lerp(SHORE[j][0], SHORE[j + 1][0], f), y = lerp(SHORE[j][1], SHORE[j + 1][1], f);
      g.strokeStyle = 'rgba(30,40,30,.9)';
      g.lineWidth = 1;
      g.beginPath();
      g.moveTo(x, y + 4);
      g.lineTo(x + (r() - 0.5) * 4, y - 6 - r() * 6);
      g.stroke();
    }
    // дороги
    ROADS.forEach((rd) => strokeRoad(g, rd, 15, '#262b2a'));
    ROADS.forEach((rd) => strokeRoad(g, rd, 11, '#3a403e'));
    g.setLineDash([3, 7]);
    ROADS.forEach((rd) => strokeRoad(g, rd, 0.8, 'rgba(200,200,180,.25)'));
    g.setLineDash([]);
    // площадь у ДК
    g.fillStyle = '#3a403e';
    g.beginPath();
    g.ellipse(640, 262, 48, 22, 0, 0, TAU);
    g.fill();
    // кварталы домов вдоль дорог
    const hr = rng(704);
    for (let i = 0; i < 900; i++) {
      const x = 20 + hr() * 1080, y = 150 + hr() * 420;
      if (inWater(x, y + 10) || nearRoad(x + 8, y - 4, 14) || !nearRoad(x + 8, y - 4, 46)) continue;
      if (Object.values(PLACES).some((p) => Math.hypot(p.x - x, p.y - y) < 46)) continue;
      if (Math.hypot(640 - x, 262 - y) < 60) continue;
      if (hr() < 0.5) house(g, x, y, 14 + hr() * 8, 6 + hr() * 3, hr);
      else tree(g, x + 8, y, 5 + hr() * 4, hr);
    }
    // ДК «Водник» с колоннами
    g.fillStyle = 'rgba(0,0,0,.35)';
    g.fillRect(604, 228, 76, 10);
    g.fillStyle = '#5a5850';
    g.fillRect(600, 206, 70, 24);
    g.fillStyle = '#6a685e';
    g.beginPath();
    g.moveTo(596, 206);
    g.lineTo(635, 192);
    g.lineTo(674, 206);
    g.fill();
    for (let i = 0; i < 6; i++) { g.fillStyle = '#8a887c'; g.fillRect(604 + i * 11, 210, 3, 18); }
    P.text(g, 'ДК «Водник»', 635, 182, { font: 'italic 600 11px "Cormorant Garamond",serif', color: 'rgba(220,210,180,.55)' });
    // гостиница
    house(g, 270, 300, 60, 16, hr, { h: 24, wall: '#5a4a3e', lit: true, roof: '#3a2e2a' });
    g.fillStyle = '#ff5a40';
    g.fillRect(282, 266, 36, 4);
    P.glow(g, 300, 268, 30, '#ff4a30', 0.4);
    // библиотека
    house(g, 676, 322, 48, 14, hr, { h: 22, wall: '#4a4a44', lit: false, roof: '#30343a' });
    g.fillStyle = '#ffd890';
    g.fillRect(700, 304, 4, 4);
    P.glow(g, 702, 306, 14, '#ffb050', 0.5);
    // дом Семёныча и лодочная станция с причалом
    house(g, 900, 444, 26, 10, hr, { h: 12, wall: '#4a3a2e', lit: true, roof: '#3a3028' });
    house(g, 940, 450, 34, 12, hr, { h: 14, wall: '#3a3a36', lit: false, roof: '#2a2a2e' });
    g.fillStyle = '#3a2e22';
    g.save();
    g.translate(965, 462);
    g.rotate(0.55);
    g.fillRect(0, -3, 90, 6);
    g.restore();
    // пристань
    g.fillStyle = '#3a2e22';
    g.fillRect(512, 592, 16, 60);
    for (let i = 0; i < 6; i++) { g.fillStyle = 'rgba(0,0,0,.4)'; g.fillRect(512, 596 + i * 10, 16, 1); }
    // остановка
    g.fillStyle = '#4a4a44';
    g.fillRect(60, 196, 20, 6);
    // церковь в воде
    g.fillStyle = '#1a2230';
    g.fillRect(1140, 520, 26, 30);
    g.beginPath();
    g.arc(1153, 520, 11, Math.PI, 0);
    g.fill();
    g.fillRect(1152, 494, 2, 16);
    g.fillRect(1148, 498, 10, 2);
    P.text(g, 'Покровское', 1153, 570, { font: 'italic 600 12px "Cormorant Garamond",serif', color: 'rgba(170,190,215,.4)' });
    // подписи улиц
    P.text(g, 'ул. Ленина', 470, 268, { font: 'italic 10px "Cormorant Garamond",serif', color: 'rgba(200,200,180,.35)' });
    P.text(g, 'Набережная', 760, 520, { font: 'italic 10px "Cormorant Garamond",serif', color: 'rgba(200,200,180,.35)' });
    P.text(g, 'Тихий Омут', 160, 90, { font: 'italic 600 34px "Cormorant Garamond",serif', color: 'rgba(230,220,190,.28)', ls: 4 });
    // рамка карты
    g.strokeStyle = 'rgba(200,190,160,.2)';
    g.lineWidth = 1;
    g.strokeRect(14, 14, W - 28, H - 28);
  }

  // Нить от окна к воде, по которой поднимаются Тихие.
  const THREADS = {
    hotel: [[300, 276], [420, 640]],
    library: [[702, 302], [780, 650]],
    sem: [[912, 430], [1010, 600]],
  };
  function threadPt(id, k) {
    const [a, b] = THREADS[id];
    const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2 + 40;
    return [(1 - k) * (1 - k) * b[0] + 2 * (1 - k) * k * mx + k * k * a[0], (1 - k) * (1 - k) * b[1] + 2 * (1 - k) * k * my + k * k * a[1]];
  }

  const st = { marker: [520, 588], travel: null, hover: null };
  C4.st = st;

  function back(ctx, t) {
    const now = C4.time();
    const prog = clamp((now - START) / (DEADLINE - START), 0, 1);
    // туман ползёт по воде
    P.fogBand(ctx, t, 610, 160, 8, 0.25);
    P.fogBand(ctx, t * 0.6 + 30, 470, 120, -6, 0.15);
    // нити
    const f = G.flags;
    Object.keys(THREADS).forEach((id) => {
      const saved = f['saved_' + id], lost = f.lost === id || (id === 'sem' && f.nikGoes);
      const [a, b] = THREADS[id];
      if (saved) {
        OM.thread(ctx, a, [a[0] + 10, a[1] + 40], t, { color: '#cfe0ff', a: 0.5, sag: 10, w: 1 });
        return;
      }
      OM.thread(ctx, a, b, t, { color: lost ? '#7a90b0' : '#ffd27a', a: 0.95, sag: 40, w: 2, speed: -0.25 });
      // Тихие идут по нити к окну: чем ближе полночь, тем ближе к дому
      for (let i = 0; i < 3; i++) {
        const k = clamp(prog * 0.92 - i * 0.07, 0, 0.95);
        const [x, y] = threadPt(id, k);
        ctx.fillStyle = 'rgba(2,4,6,.92)';
        ctx.beginPath();
        ctx.ellipse(x, y - 7, 2.2, 7.5, 0, 0, TAU);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + 0.8, y - 15, 2.4, 0, TAU);
        ctx.fill();
      }
    });
    // Лев
    const [mx, my] = st.marker;
    const pulse = 1 + Math.sin(t * 4) * 0.15;
    P.glow(ctx, mx, my, 34 * pulse, '#ffe2a8', 0.5);
    ctx.strokeStyle = 'rgba(255,230,180,.9)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(mx, my, 8 * pulse, 0, TAU);
    ctx.stroke();
    ctx.fillStyle = '#fff4dc';
    ctx.beginPath();
    ctx.arc(mx, my, 3, 0, TAU);
    ctx.fill();
    // метки мест
    Object.entries(PLACES).forEach(([id, p]) => {
      if (id === 'pier') return;
      const saved = f['saved_' + id];
      const gone = f.lost === id || (id === 'sem' && f.nikGoes);
      const hov = G.over && G.over.id === id;
      ctx.save();
      ctx.globalAlpha = hov ? 1 : 0.8;
      P.text(ctx, p.name, p.x, p.y + 30, { font: '600 15px "Cormorant Garamond",serif', color: saved ? '#bcd0f0' : gone ? '#8a96a6' : '#f1e2c0', ls: 1 });
      const sub = saved ? 'нить свободна' : gone ? (id === 'sem' && f.nikGoes ? 'туда пошёл Никодим' : 'поздно') : p.who;
      P.text(ctx, sub, p.x, p.y + 46, { font: 'italic 12px "Cormorant Garamond",serif', color: 'rgba(220,210,190,.6)' });
      if (!saved && !gone && G.flags.mapPlace) {
        const d = C4.dist(G.flags.mapPlace, id);
        P.text(ctx, `${d} мин пути`, p.x, p.y + 61, { font: '600 11px "PT Serif",serif', color: 'rgba(255,214,150,.7)' });
      }
      ctx.restore();
    });
  }

  function over(ctx, t) {
    const now = C4.time();
    C4.drawClock(ctx, 1170, 120, 46, now);
    const left = DEADLINE - now;
    P.text(ctx, left > 0 ? `до 00:13 — ${left} мин` : 'полночь', 1170, 222, { font: 'italic 14px "Cormorant Garamond",serif', color: 'rgba(240,220,190,.7)' });
    P.text(ctx, 'Спасение займёт около четверти часа', 1170, 240, { font: 'italic 12px "Cormorant Garamond",serif', color: 'rgba(240,220,190,.45)' });
  }

  function placeHs(id) {
    const p = PLACES[id];
    return {
      id,
      get name() {
        const f = G.flags;
        if (f['saved_' + id]) return p.name + ' — нить свободна';
        if (f.lost === id || (id === 'sem' && f.nikGoes)) return p.name;
        const arr = C4.time() + C4.dist(f.mapPlace || 'pier', id);
        return `${p.name} — будешь в ${C4.fmt(arr)}`;
      },
      rect: [p.x - 50, p.y - 50, 100, 110],
      use: () => OM.story4.goTo(id),
      look: () => OM.story4.lookPlace(id),
    };
  }

  OM.scene('map', {
    name: 'Карта',
    noThreads: true,
    amb: { wind: 0.4, water: 0.25, drone: 0.25 },
    figLight: { amb: 0.4, tint: '#24303c' },
    vignette: 1,
    paint,
    back,
    over,
    hotspots: [
      placeHs('hotel'), placeHs('library'), placeHs('sem'),
      { id: 'church', name: 'Покровское', rect: [1110, 470, 90, 100], look: 'Церковь посреди озера. Колокол молчит. Оттуда они и идут — по нитям, как по тропинкам.' },
      { id: 'watch', name: 'Часы', rect: [1110, 50, 120, 150], look: () => OM.say('lev', `«Победа» на руке показывает ${C4.fmt(C4.time())}. До 00:13 — ${Math.max(0, DEADLINE - C4.time())} минут.`) },
    ],
    setup() {
      G.hero.visible = false;
      const p = PLACES[G.flags.mapPlace || 'pier'];
      st.marker = [p.x, p.y];
    },
    leave() { G.hero.visible = true; },
    async enter() { await OM.story4.onMap(); },
    resume() { return OM.story4.onMap(); },
  });

  // Анимация пути по карте: маркер едет, часы бегут.
  C4.animateTravel = async (from, to) => {
    const a = PLACES[from], b = PLACES[to];
    const t0 = C4.time(), d = C4.dist(from, to);
    const ms = 1600 + d * 90;
    const s0 = performance.now();
    let lastMin = t0;
    while (performance.now() - s0 < ms) {
      const k = OM.smooth((performance.now() - s0) / ms);
      st.marker = [lerp(a.x, b.x, k), lerp(a.y, b.y, k) - Math.sin(k * Math.PI) * 30];
      G.flags.clock = t0 + Math.floor(d * k);
      if (G.flags.clock !== lastMin) { lastMin = G.flags.clock; S.tick && S.tick(0.6); }
      await OM.wait(16);
    }
    st.marker = [b.x, b.y];
    G.flags.clock = t0 + d;
  };
})();
