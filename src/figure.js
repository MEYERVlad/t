// Персонажи на скелете: суставы, кисти с пальцами, голова в профиль, одежда с деталями.
// Каждый кадр фигура рисуется в своём холсте в локальных цветах, затем освещается:
// общий свет сцены (amb/tint), направленная светотень и контровой свет по краю силуэта.
(function () {
  const { hex, lerp, clamp } = OM;
  const P = OM.P;
  const TAU = Math.PI * 2;
  const F = (OM.Fig = {});

  // ---------- Геометрия ----------
  // Угол сустава отсчитывается от вертикали вниз; плюс — вперёд (+x).
  const dir = (a, L) => [Math.sin(a) * L, Math.cos(a) * L];
  const add = (p, v) => [p[0] + v[0], p[1] + v[1]];

  function capsule(c, a, ra, b, rb) {
    const dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 0.001;
    const nx = -dy / d, ny = dx / d;
    c.beginPath();
    c.moveTo(a[0] + nx * ra, a[1] + ny * ra);
    c.lineTo(b[0] + nx * rb, b[1] + ny * rb);
    c.lineTo(b[0] - nx * rb, b[1] - ny * rb);
    c.lineTo(a[0] - nx * ra, a[1] - ny * ra);
    c.closePath();
    c.fill();
    c.beginPath();
    c.arc(a[0], a[1], ra, 0, TAU);
    c.arc(b[0], b[1], rb, 0, TAU);
    c.fill();
  }
  function poly(c, pts, close = true) {
    c.beginPath();
    c.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]);
    if (close) c.closePath();
  }
  // Сглаженный контур по точкам (квадратичные кривые через середины).
  function smoothPath(c, pts) {
    c.beginPath();
    const n = pts.length;
    const mid = (i) => [(pts[i % n][0] + pts[(i + 1) % n][0]) / 2, (pts[i % n][1] + pts[(i + 1) % n][1]) / 2];
    const m0 = mid(n - 1);
    c.moveTo(m0[0], m0[1]);
    for (let i = 0; i < n; i++) {
      const m = mid(i);
      c.quadraticCurveTo(pts[i][0], pts[i][1], m[0], m[1]);
    }
    c.closePath();
  }

  // ---------- Походка ----------
  function legAngles(phi, move, idle) {
    const T = lerp(idle, 0.36 * Math.sin(phi), move);
    const K = lerp(0.05, 0.06 + 0.95 * Math.pow(Math.max(0, Math.cos(phi)), 1.4), move);
    const S = T - K;
    const fa = move * (Math.cos(phi) > 0 ? clamp(-S * 0.5, -0.2, 0.5) : clamp(-T * 0.35, -0.3, 0.3));
    return { T, K, S, fa };
  }
  function legPts(hip, L1, L2, a) {
    const knee = add(hip, dir(a.T, L1));
    const ankle = add(knee, dir(a.S, L2));
    return { hip, knee, ankle, fa: a.fa };
  }

  // ---------- Части тела ----------
  function shoe(c, ankle, fa, col, sc = 1, boot = 0) {
    c.save();
    c.translate(ankle[0], ankle[1]);
    c.rotate(fa);
    c.scale(sc, sc);
    c.fillStyle = col;
    smoothPath(c, [[-6, 7.3], [-6.5, 1 - boot], [-4, -3 - boot], [4, -3 - boot], [12, 0.5], [18.5, 3], [19.5, 6.5], [17, 7.6]]);
    c.fill();
    c.fillStyle = 'rgba(0,0,0,.45)';
    c.fillRect(-6, 6.2, 25, 1.6);
    c.fillStyle = 'rgba(255,255,255,.13)';
    c.beginPath();
    c.ellipse(12, 1.5, 4, 1.2, 0.25, 0, TAU);
    c.fill();
    c.restore();
  }
  function bareFoot(c, ankle, fa, col) {
    c.save();
    c.translate(ankle[0], ankle[1]);
    c.rotate(fa);
    c.fillStyle = col;
    smoothPath(c, [[-4, 5.5], [-4.5, 0], [-2, -3], [3, -2.5], [9, 2], [13, 3.5], [13.5, 5.6], [11, 6]]);
    c.fill();
    c.restore();
  }

  // Кисть: ладонь, четыре пальца, большой палец. grip — сжатый кулак (держит ручку).
  function hand(c, wrist, ang, col, o = {}) {
    const k = o.size || 1;
    c.save();
    c.translate(wrist[0], wrist[1]);
    c.rotate(-ang);
    c.scale(k, k);
    c.fillStyle = col;
    if (o.grip) {
      P.rrect(c, -4.2, -0.5, 8.6, 11.5, 3.6);
      c.fill();
      capsule(c, [3.8, 1.5], 1.9, [5.2, 7.5], 1.6);
      c.strokeStyle = 'rgba(0,0,0,.28)';
      c.lineWidth = 0.6;
      for (let i = 0; i < 3; i++) {
        c.beginPath();
        c.moveTo(-3.8, 4.2 + i * 2.2);
        c.lineTo(2.2, 4.4 + i * 2.2);
        c.stroke();
      }
    } else {
      const curl = o.curl ?? 0.25;
      P.rrect(c, -3.8, -0.5, 7.8, 9.5, 3);
      c.fill();
      // пальцы
      for (let i = 0; i < 4; i++) {
        const x = -2.9 + i * 1.95;
        const l = [8.5, 9.6, 9.2, 7.6][i];
        const b = [x, 8];
        const m = [x + curl * 1.8, 8 + l * 0.55];
        const e = [x + curl * 4.2, 8 + l * (1 - curl * 0.35)];
        capsule(c, b, 1.05, m, 0.95);
        capsule(c, m, 0.95, e, 0.82);
      }
      // большой палец — со стороны «вперёд»
      capsule(c, [3.2, 1.8], 1.6, [5.6, 6.4], 1.2);
      capsule(c, [5.6, 6.4], 1.2, [6.2 + curl * 1.5, 9.5], 1);
      c.strokeStyle = 'rgba(0,0,0,.25)';
      c.lineWidth = 0.45;
      for (let i = 1; i < 4; i++) {
        c.beginPath();
        c.moveTo(-2.9 + i * 1.95 - 0.98, 8.5);
        c.lineTo(-2.9 + i * 1.95 - 0.98 + curl * 3, 15);
        c.stroke();
      }
    }
    c.restore();
  }

  // Рука: плечо → локоть → запястье → кисть. sleeve — цвет рукава, cuff — манжета/рукав.
  function arm(c, sh, A, E, L1, L2, o) {
    const elbow = add(sh, dir(A, L1));
    const fa = A + E;
    const wrist = add(elbow, dir(fa, L2));
    c.fillStyle = o.sleeve;
    capsule(c, sh, o.r0 || 6.2, elbow, o.r1 || 5);
    capsule(c, elbow, o.r1 || 5, add(wrist, dir(fa, -1.5)), o.r2 || 4.2);
    if (o.cuff) {
      c.fillStyle = o.cuff;
      capsule(c, add(wrist, dir(fa, -3.5)), (o.r2 || 4.2) + 0.4, add(wrist, dir(fa, -1)), (o.r2 || 4.2) + 0.3);
    }
    hand(c, wrist, fa + (o.handBend || 0.08), o.skin, o.hand || {});
    return { elbow, wrist, fa };
  }

  // Голова в профиль. Центр черепа (0,0), смотрит вправо.
  function head(c, o) {
    const sk = o.skin;
    c.fillStyle = sk;
    // шея
    P.rrect(c, -3.5, 6, 8, 12, 3);
    c.fill();
    // череп и лицо
    c.beginPath();
    c.ellipse(0, -1, o.rx || 9.6, o.ry || 11.2, 0, 0, TAU);
    c.fill();
    const f = o.face || 1;
    c.beginPath();
    c.moveTo(4, -11 * f);
    c.quadraticCurveTo(8.8, -9.5, 9.6, -4.5);
    c.lineTo(10.3, -2.6);
    c.lineTo(9.8, -1.2);
    c.quadraticCurveTo(o.nose || 13.4, 2.6, 10.4, 3.6);
    c.quadraticCurveTo(10.6, 5, 10.3, 5.6);
    c.lineTo(10.7, 6.6);
    c.quadraticCurveTo(10.2, 8.6, 9.3, 9.4);
    c.quadraticCurveTo(o.chin || 9.6, 11.6, 6.5, 12);
    c.quadraticCurveTo(2, 12.4, -1, 9);
    c.lineTo(2, 0);
    c.closePath();
    c.fill();
    // ухо
    c.fillStyle = shade(sk, -0.12);
    c.beginPath();
    c.ellipse(-1.4, 0.5, 2.4, 3.6, 0.15, 0, TAU);
    c.fill();
    c.strokeStyle = 'rgba(0,0,0,.25)';
    c.lineWidth = 0.6;
    c.beginPath();
    c.arc(-1.2, 0.6, 1.5, -1.2, 1.6);
    c.stroke();
    // глаз, бровь, губы
    if (o.eyesClosed) {
      c.strokeStyle = 'rgba(30,18,12,.85)';
      c.lineWidth = 0.8;
      c.beginPath();
      c.moveTo(5.4, -1.2);
      c.quadraticCurveTo(6.6, -0.4, 7.8, -1.1);
      c.stroke();
    } else {
      c.fillStyle = '#efe6dc';
      c.beginPath();
      c.ellipse(6.9, -1.5, 1.7, 1.05, 0, 0, TAU);
      c.fill();
      c.fillStyle = o.iris || '#2a2018';
      c.beginPath();
      c.arc(7.6, -1.5, 0.95, 0, TAU);
      c.fill();
      c.fillStyle = 'rgba(255,255,255,.8)';
      c.fillRect(7.7, -2.1, 0.5, 0.5);
      c.strokeStyle = 'rgba(20,10,5,.55)';
      c.lineWidth = 0.55;
      c.beginPath();
      c.moveTo(5.1, -2.6);
      c.quadraticCurveTo(6.8, -3.1, 8.6, -2.2);
      c.stroke();
    }
    c.strokeStyle = o.brow || 'rgba(40,25,15,.75)';
    c.lineWidth = 1.1;
    c.beginPath();
    c.moveTo(4.8, -4.4);
    c.quadraticCurveTo(7, -5.4, 9.2, -4.6);
    c.stroke();
    c.strokeStyle = 'rgba(90,30,25,.55)';
    c.lineWidth = 0.8;
    c.beginPath();
    const mo = o.mouth || 0;
    c.moveTo(8.2, 6.2 + mo * 0.3);
    c.lineTo(10.3, 6.1 + mo);
    c.stroke();
    // тень под скулой и у носа
    c.fillStyle = 'rgba(60,20,10,.12)';
    c.beginPath();
    c.ellipse(5, 5, 3.4, 2.4, 0.3, 0, TAU);
    c.fill();
    if (o.stubble) {
      c.fillStyle = 'rgba(40,30,25,.22)';
      c.beginPath();
      c.moveTo(3, 4);
      c.quadraticCurveTo(10, 4.8, 10.4, 7);
      c.quadraticCurveTo(9.5, 11.5, 6.5, 12);
      c.quadraticCurveTo(2, 12.4, -0.5, 8.5);
      c.closePath();
      c.fill();
    }
  }

  // Осветлить/затемнить цвет: k от -1 до 1.
  function shade(col, k) {
    const m = col.match(/^#?([0-9a-f]{6})$/i);
    if (!m) return col;
    const n = parseInt(m[1], 16);
    let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    const f = (v) => Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k);
    return `rgb(${f(r)},${f(g)},${f(b)})`;
  }
  F.shade = shade;

  // ---------- Освещение фигуры ----------
  let oc = null, tc = null;
  function buffers(w, h) {
    if (!oc) { oc = OM.makeCanvas(w, h); tc = OM.makeCanvas(w, h); }
    if (oc.width < w || oc.height < h) {
      oc.width = Math.max(oc.width, w); oc.height = Math.max(oc.height, h);
      tc.width = oc.width; tc.height = oc.height;
    }
    return [oc.getContext('2d'), tc.getContext('2d')];
  }
  function sceneLight() {
    const sc = OM.G && OM.G.scene;
    return (sc && sc.figLight) || { amb: 0.4, tint: '#2a3440' };
  }

  // Рисует фигуру: body(c, t) рисует в локальных координатах (ступни на y=0, лицом вправо).
  // box — [x0, y0, x1, y1] в локальных единицах (для лица вправо).
  function render(ctx, a, t, box, body) {
    const tr = ctx.getTransform();
    const res = Math.min(4, Math.max(1, Math.hypot(tr.a, tr.b))) * a.s;
    const w = Math.ceil((box[2] - box[0]) * res), h = Math.ceil((box[3] - box[1]) * res);
    const [o, t2] = buffers(w, h);
    o.setTransform(1, 0, 0, 1, 0, 0);
    o.clearRect(0, 0, w, h);
    o.globalCompositeOperation = 'source-over';
    o.globalAlpha = 1;
    // локальная система: ступни (0,0); при взгляде влево отражаем
    const face = a.face || 1;
    if (face > 0) o.setTransform(res, 0, 0, res, -box[0] * res, -box[1] * res);
    else o.setTransform(-res, 0, 0, res, box[2] * res, -box[1] * res);
    o.lineCap = 'round';
    o.lineJoin = 'round';
    body(o, t);
    o.setTransform(1, 0, 0, 1, 0, 0);
    // общий свет
    const L = a.light || sceneLight();
    o.globalCompositeOperation = 'source-atop';
    if (a.body) {
      // плоская заливка (например, сияющий мальчик в видении)
      o.globalAlpha = 0.85;
      o.fillStyle = a.body;
      o.fillRect(0, 0, w, h);
    } else {
      o.globalAlpha = 1;
      o.fillStyle = `rgba(0,0,0,${clamp(1 - L.amb, 0, 0.95)})`;
      o.fillRect(0, 0, w, h);
      o.globalAlpha = 0.16 + (1 - L.amb) * 0.2;
      o.fillStyle = L.tint || '#30383f';
      o.fillRect(0, 0, w, h);
    }
    // светотень: сторона от света темнее, низ темнее
    const rimDir = a.rim ? Math.sign(a.rim.dx || 1) * face : (L.side || 1);
    const sx = rimDir > 0 ? w : 0;
    o.globalAlpha = 1;
    const g1 = o.createLinearGradient(sx, 0, w - sx, 0);
    g1.addColorStop(0, 'rgba(0,0,0,0)');
    g1.addColorStop(1, 'rgba(0,0,0,.32)');
    o.fillStyle = g1;
    o.fillRect(0, 0, w, h);
    const g2 = o.createLinearGradient(0, 0, 0, h);
    g2.addColorStop(0, 'rgba(0,0,0,0)');
    g2.addColorStop(0.55, 'rgba(0,0,0,.05)');
    g2.addColorStop(1, 'rgba(0,0,0,.35)');
    o.fillStyle = g2;
    o.fillRect(0, 0, w, h);
    o.globalCompositeOperation = 'source-over';
    // контровой свет: полоска вдоль края силуэта со стороны источника
    let rim = null;
    if (a.rim && a.rim.color) {
      t2.setTransform(1, 0, 0, 1, 0, 0);
      t2.globalCompositeOperation = 'source-over';
      t2.clearRect(0, 0, w, h);
      t2.drawImage(oc, 0, 0, w, h, 0, 0, w, h);
      t2.globalCompositeOperation = 'source-in';
      t2.fillStyle = a.rim.color;
      t2.fillRect(0, 0, w, h);
      t2.globalCompositeOperation = 'destination-out';
      const off = 1.6 * res;
      t2.drawImage(oc, 0, 0, w, h, -rimDir * off, off * 0.35, w, h);
      t2.globalCompositeOperation = 'source-over';
      rim = tc;
    }
    // вывод в сцену
    const dx = face > 0 ? a.x + box[0] * a.s : a.x - box[2] * a.s;
    const dy = a.y + box[1] * a.s;
    const dw = w / res * a.s / a.s, dh = h / res * a.s / a.s;
    ctx.save();
    if (a.alpha != null) ctx.globalAlpha *= a.alpha;
    ctx.drawImage(oc, 0, 0, w, h, dx, dy, (w / res) * a.s, (h / res) * a.s);
    if (rim) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.drawImage(rim, 0, 0, w, h, dx, dy, (w / res) * a.s, (h / res) * a.s);
    }
    ctx.restore();
    void dw; void dh;
  }

  function groundShadow(ctx, a, rx = 30) {
    if (a.noShadow) return;
    ctx.save();
    ctx.fillStyle = P.rgrad(ctx, a.x, a.y, 0, rx * a.s, [[0, 'rgba(0,0,0,.5)'], [1, 'rgba(0,0,0,0)']]);
    ctx.translate(a.x, a.y);
    ctx.scale(1, 0.18);
    ctx.beginPath();
    ctx.arc(0, 0, rx * a.s, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  // ---------- Общий каркас стоящего/идущего взрослого ----------
  // Возвращает позы суставов с учётом касания земли.
  function standing(a, t, dims) {
    const mv = a.move || 0;
    const ph = a.phase || 0;
    const hipY = -dims.hip;
    const near = legAngles(ph, mv, 0.05);
    const far = legAngles(ph + Math.PI, mv, -0.06);
    const legN = legPts([1, hipY], dims.L1, dims.L2, near);
    const legF = legPts([-1, hipY], dims.L1, dims.L2, far);
    // касание земли: ниже всего — опорная нога
    const lowest = Math.max(legN.ankle[1], legF.ankle[1]) + dims.ankle;
    const drop = -lowest;
    const sh = (p) => [p[0], p[1] + drop];
    for (const L of [legN, legF]) { L.hip = sh(L.hip); L.knee = sh(L.knee); L.ankle = sh(L.ankle); }
    const breathe = Math.sin(t * 1.7 + (a.seed || 0)) * 0.6 * (1 - mv);
    return { mv, ph, legN, legF, drop: drop + breathe * 0.3, breathe };
  }

  // ---------- Лев Гордеев ----------
  const LEV = {
    coat: '#4d4237', coatDark: '#3a3129', trousers: '#34302c', hat: '#3d362e', band: '#1c1814',
    scarf: '#7c3328', skin: '#d6a98b', shoes: '#211b16', case: '#73553a', caseDark: '#4a3624', metal: '#b89a62',
  };
  F.lev = (ctx, a, t) => {
    const C = LEV;
    const dims = { hip: 97, L1: 45, L2: 45, ankle: 7.2 };
    const pose = standing(a, t, dims);
    const { mv, ph, legN, legF, drop, breathe } = pose;
    const shY = -151 + drop;
    groundShadow(ctx, a, 32);
    render(ctx, a, t, [-62, -212, 78, 12], (c) => {
      // дальняя нога
      c.fillStyle = shade(C.trousers, -0.25);
      capsule(c, legF.hip, 7.4, legF.knee, 5.6);
      capsule(c, legF.knee, 5.6, legF.ankle, 4.4);
      shoe(c, legF.ankle, legF.fa, shade(C.shoes, -0.2));
      // дальняя рука
      const armSwing = -0.36 * Math.sin(ph) * mv;
      arm(c, [-2, shY + 2], -armSwing + 0.04, 0.22 + 0.25 * Math.max(0, Math.sin(ph)) * mv, 32, 29, {
        sleeve: shade(C.coat, -0.28), skin: shade(C.skin, -0.25), cuff: shade(C.coat, -0.35), hand: { curl: 0.45 },
      });
      // ближняя нога
      c.fillStyle = C.trousers;
      capsule(c, legN.hip, 7.4, legN.knee, 5.6);
      capsule(c, legN.knee, 5.6, legN.ankle, 4.4);
      shoe(c, legN.ankle, legN.fa, C.shoes);
      // пальто
      const kx = Math.max(legN.knee[0], legF.knee[0]), kb = Math.min(legN.knee[0], legF.knee[0]);
      const hemY = -40 + drop;
      const coat = [
        [-8, shY - 12], [-17, shY + 1], [-16.5, shY + 26], [-14.5, shY + 50 + breathe], [-17, shY + 76],
        [Math.min(-19, kb - 7) + 1, hemY - 6], [Math.min(-19, kb - 7), hemY], [Math.min(-19, kb - 7), hemY + 0.5],
        [Math.max(18, kx + 7), hemY - 1.5], [Math.max(18, kx + 7), hemY - 2], [Math.max(18, kx + 7) - 1, hemY - 8],
        [15.5, shY + 74], [14, shY + 52], [16.5 + breathe, shY + 28], [16, shY + 4], [10, shY - 10],
      ];
      c.fillStyle = C.coat;
      smoothPath(c, coat);
      c.fill();
      c.save();
      smoothPath(c, coat);
      c.clip();
      // складки, лацкан, пояс, пуговицы, карман
      c.strokeStyle = 'rgba(0,0,0,.28)';
      c.lineWidth = 1.1;
      c.beginPath();
      c.moveTo(9, shY - 6);
      c.lineTo(4, shY + 30);
      c.lineTo(9.5, shY + 46);
      c.stroke();
      c.strokeStyle = 'rgba(255,240,220,.07)';
      c.beginPath();
      c.moveTo(10.5, shY - 5);
      c.lineTo(5.5, shY + 29);
      c.stroke();
      c.fillStyle = C.coatDark;
      c.fillRect(-20, shY + 48, 40, 5);
      c.fillStyle = C.metal;
      c.fillRect(9, shY + 48.5, 3.5, 4);
      c.fillStyle = 'rgba(0,0,0,.55)';
      [shY + 34, shY + 62, shY + 80].forEach((y) => { c.beginPath(); c.arc(11.5, y, 1.4, 0, TAU); c.fill(); });
      c.strokeStyle = 'rgba(0,0,0,.35)';
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(-3, shY + 66);
      c.lineTo(9, shY + 66);
      c.stroke();
      c.strokeStyle = 'rgba(0,0,0,.22)';
      c.beginPath();
      c.moveTo(-6, shY + 54);
      c.quadraticCurveTo(-8, shY + 80, (kb + kx) / 2 - 4, hemY);
      c.stroke();
      c.beginPath();
      c.moveTo(-13, shY + 10);
      c.quadraticCurveTo(-11, shY + 30, -12, shY + 46);
      c.stroke();
      c.restore();
      // поднятый воротник и шарф
      c.fillStyle = C.coatDark;
      poly(c, [[-10, shY - 10], [-8, shY - 24], [-1, shY - 15], [6, shY - 21], [11, shY - 9], [2, shY - 4]]);
      c.fill();
      c.fillStyle = C.scarf;
      smoothPath(c, [[-6, shY - 13], [8, shY - 14], [10, shY - 6], [9, shY + 22], [5.5, shY + 22], [4.5, shY - 3], [-6, shY - 5]]);
      c.fill();
      c.strokeStyle = 'rgba(0,0,0,.25)';
      c.lineWidth = 0.7;
      for (let i = 0; i < 4; i++) {
        c.beginPath();
        c.moveTo(5, shY + 3 + i * 5);
        c.lineTo(9.5, shY + 3 + i * 5);
        c.stroke();
      }
      // голова
      c.save();
      const nod = a.talking ? Math.sin(t * 9) * 0.03 : 0;
      c.translate(3.5, shY - 30 + breathe * 0.3);
      c.rotate(nod);
      head(c, { skin: C.skin, stubble: true, mouth: a.talking ? Math.max(0, Math.sin(t * 16)) * 1.4 : 0 });
      // волосы на затылке
      c.fillStyle = '#2a211b';
      smoothPath(c, [[-9.5, -4], [-6, -9], [-1, -10], [-2, 2], [-6, 7], [-9.5, 4]]);
      c.fill();
      // шляпа
      c.fillStyle = C.hat;
      c.beginPath();
      c.ellipse(0.5, -8.5, 18, 3.6, -0.06, 0, TAU);
      c.fill();
      smoothPath(c, [[-11, -9], [-11.5, -17], [-8, -22.5], [-1, -20], [5, -22.5], [10.5, -19], [11, -9]]);
      c.fill();
      c.fillStyle = C.band;
      c.fillRect(-11.2, -13, 22.4, 3.6);
      c.fillStyle = 'rgba(255,240,220,.08)';
      c.beginPath();
      c.ellipse(-2, -18, 6, 2, -0.2, 0, TAU);
      c.fill();
      c.restore();
      // ближняя рука (с чемоданом или свободная)
      const holds = a.item !== 'none' && !a.pose;
      let A = holds ? 0.06 + 0.1 * Math.sin(ph) * mv : 0.36 * Math.sin(ph) * mv + 0.04;
      let E = holds ? 0.1 : 0.22 + 0.25 * Math.max(0, -Math.sin(ph)) * mv;
      if (a.pose === 'reach') { A = 1.35; E = 0.15; }
      if (a.pose === 'phone') { A = 0.35; E = 2.55; }
      if (a.pose === 'point') { A = 1.2; E = 0.05; }
      if (a.pose === 'pocket') { A = -0.2; E = 0.5; }
      const sh = [2, shY + 2];
      const elbow = add(sh, dir(A, 32));
      const fa = A + E;
      const wrist = add(elbow, dir(fa, 29));
      if (holds) {
        // чемодан: ручка в кулаке, корпус висит отвесно
        const hx = wrist[0] + 2, hy = wrist[1] + 9;
        c.fillStyle = C.case;
        P.rrect(c, hx - 21, hy + 3, 42, 29, 3);
        c.fill();
        c.fillStyle = C.caseDark;
        c.fillRect(hx - 21, hy + 14, 42, 2.2);
        c.fillStyle = C.metal;
        [[hx - 21, hy + 3], [hx + 17, hy + 3], [hx - 21, hy + 28], [hx + 17, hy + 28]].forEach(([x, y]) => c.fillRect(x, y, 4, 4));
        c.fillStyle = C.caseDark;
        c.fillRect(hx - 12, hy + 3, 3, 29);
        c.fillRect(hx + 9, hy + 3, 3, 29);
        c.fillStyle = C.metal;
        c.fillRect(hx - 12.5, hy + 12, 4, 3);
        c.fillRect(hx + 8.5, hy + 12, 4, 3);
        c.strokeStyle = C.caseDark;
        c.lineWidth = 2.6;
        c.beginPath();
        c.moveTo(hx - 7, hy + 3.5);
        c.quadraticCurveTo(hx, hy - 6, hx + 7, hy + 3.5);
        c.stroke();
      }
      arm(c, sh, A, E, 32, 29, {
        sleeve: C.coat, skin: C.skin, cuff: C.coatDark,
        hand: holds ? { grip: true } : a.pose === 'point' ? { curl: 0.05 } : { curl: 0.35 },
      });
      if (a.pose === 'phone') {
        c.fillStyle = '#1c1c1c';
        const w2 = add(wrist, dir(fa, 6));
        P.rrect(c, w2[0] - 3, w2[1] - 9, 6, 18, 2.5);
        c.fill();
      }
      if (a.holdLight) {
        // фонарик-жучок в вытянутой руке
        c.fillStyle = '#3a3f3a';
        const w2 = add(wrist, dir(fa, 7));
        P.rrect(c, w2[0] - 4, w2[1] - 3, 9, 7, 2);
        c.fill();
      }
    });
  };

  // ---------- Митя: 9 лет, полосатая пижама, босиком ----------
  const MITYA = { pj: '#9fb0c2', stripe: '#6c7f96', skin: '#e2b79c', hair: '#5a4030' };
  F.mitya = (ctx, a, t) => {
    const C = MITYA;
    const dims = { hip: 58, L1: 27, L2: 27, ankle: 5 };
    const pose = standing(a, t, dims);
    const { mv, ph, legN, legF, drop, breathe } = pose;
    const shY = -92 + drop;
    groundShadow(ctx, a, 20);
    const sway = a.sleep ? Math.sin(t * 0.9) * 0.04 : 0;
    render(ctx, a, t, [-40, -132, 50, 10], (c) => {
      c.save();
      c.rotate(sway);
      c.fillStyle = shade(C.pj, -0.22);
      capsule(c, legF.hip, 5.4, legF.knee, 4.2);
      capsule(c, legF.knee, 4.2, add(legF.ankle, [0, -3]), 3.6);
      bareFoot(c, legF.ankle, legF.fa, shade(C.skin, -0.2));
      const armF = a.sleep ? [0.75, 0.35] : [-0.3 * Math.sin(ph) * mv + 0.05, 0.25];
      arm(c, [-1, shY + 2], armF[0], armF[1], 19, 18, { sleeve: shade(C.pj, -0.25), skin: shade(C.skin, -0.22), r0: 4, r1: 3.4, r2: 3, hand: { size: 0.62, curl: 0.3 } });
      c.fillStyle = C.pj;
      capsule(c, legN.hip, 5.4, legN.knee, 4.2);
      capsule(c, legN.knee, 4.2, add(legN.ankle, [0, -3]), 3.6);
      bareFoot(c, legN.ankle, legN.fa, C.skin);
      // рубашка пижамы
      const body = [[-7, shY - 6], [-11, shY + 3], [-10.5, shY + 22 + breathe], [-11, shY + 40], [11, shY + 40], [11, shY + 20], [11.5, shY + 4], [7, shY - 6]];
      c.fillStyle = C.pj;
      smoothPath(c, body);
      c.fill();
      c.save();
      smoothPath(c, body);
      c.clip();
      c.fillStyle = C.stripe;
      for (let x = -12; x < 13; x += 4.5) c.fillRect(x, shY - 8, 1.6, 50);
      c.fillStyle = 'rgba(255,255,255,.5)';
      [shY + 6, shY + 16, shY + 26].forEach((y) => { c.beginPath(); c.arc(8, y, 1, 0, TAU); c.fill(); });
      c.restore();
      // голова: у ребёнка крупнее относительно тела
      c.save();
      c.translate(2.5, shY - 19);
      c.scale(0.92, 0.92);
      head(c, { skin: C.skin, eyesClosed: !!a.sleep, nose: 12, chin: 8.8, rx: 10.4, ry: 11.6, mouth: a.talking ? Math.max(0, Math.sin(t * 16)) * 1.2 : 0 });
      c.fillStyle = C.hair;
      smoothPath(c, [[-10.5, 1], [-11, -8], [-6, -12.5], [2, -13], [8, -10.5], [10.5, -6], [8, -5.5], [4, -8], [-1, -5], [-4, 3], [-7.5, 6]]);
      c.fill();
      c.strokeStyle = shade(C.hair, -0.3);
      c.lineWidth = 0.8;
      for (let i = 0; i < 5; i++) {
        c.beginPath();
        c.moveTo(-8 + i * 3, -11);
        c.quadraticCurveTo(-6 + i * 3, -7, -7 + i * 3.4, -3);
        c.stroke();
      }
      c.restore();
      const armN = a.sleep ? [0.85, 0.3] : [0.3 * Math.sin(ph) * mv + 0.05, 0.25];
      arm(c, [1, shY + 2], armN[0], armN[1], 19, 18, { sleeve: C.pj, skin: C.skin, r0: 4, r1: 3.4, r2: 3, cuff: C.stripe, hand: { size: 0.62, curl: 0.3 } });
      c.restore();
    });
  };

  // ---------- Зинаида Павловна: сидит за стойкой, руки на стойке ----------
  const ZINA = { cardigan: '#5a4c44', blouse: '#c9bfae', shawl: '#7a3a2e', shawlPat: '#c49a5a', skin: '#d3a68e', hair: '#9a948c' };
  F.zina = (ctx, a, t) => {
    const C = ZINA;
    const asleep = !!a.asleep;
    const breathe = Math.sin(t * (asleep ? 0.9 : 1.4)) * (asleep ? 1.4 : 0.6);
    const talk = a.talking;
    render(ctx, a, t, [-58, -118, 64, 6], (c) => {
      const shY = -64 - breathe * 0.5;
      // дальняя рука на стойке
      arm(c, [-3, shY + 4], 0.25, asleep ? 1.25 : 1.15, 24, 23, { sleeve: shade(C.cardigan, -0.25), skin: shade(C.skin, -0.25), r0: 5, r1: 4.2, r2: 3.6, hand: { size: 0.8, curl: 0.5 } });
      // корпус
      const torso = [[-9, shY - 6], [-19, shY + 4], [-21, shY + 40], [-18, 6], [18, 6], [17, shY + 36], [16 + breathe * 0.4, shY + 12], [9, shY - 5]];
      c.fillStyle = C.cardigan;
      smoothPath(c, torso);
      c.fill();
      c.fillStyle = C.blouse;
      poly(c, [[5, shY - 5], [11, shY - 3], [8, shY + 12]]);
      c.fill();
      // голова
      c.save();
      c.translate(3, shY - 19);
      if (asleep) { c.translate(-2, 6); c.rotate(0.45); }
      else if (talk) c.rotate(Math.sin(t * 7) * 0.025);
      head(c, { skin: C.skin, eyesClosed: asleep, nose: 12.6, chin: 9.2, brow: 'rgba(110,100,90,.8)', mouth: talk ? Math.max(0, Math.sin(t * 15)) * 1.2 : 0 });
      // седые волосы и пучок
      c.fillStyle = C.hair;
      smoothPath(c, [[-10, 3], [-10.5, -6], [-6, -11.5], [1, -12.5], [7, -10.5], [9.5, -6.5], [5, -7.5], [-1, -6], [-4, 2], [-7, 6]]);
      c.fill();
      c.beginPath();
      c.arc(-10, -9, 6, 0, TAU);
      c.fill();
      c.strokeStyle = shade(C.hair, -0.25);
      c.lineWidth = 0.6;
      for (let i = 0; i < 4; i++) {
        c.beginPath();
        c.arc(-10, -9, 2 + i * 1.1, i, i + 3.5);
        c.stroke();
      }
      // очки в оправе
      c.strokeStyle = '#2a2018';
      c.lineWidth = 0.9;
      c.beginPath();
      c.ellipse(7.4, -1.4, 2.9, 2.3, 0, 0, TAU);
      c.stroke();
      c.beginPath();
      c.moveTo(4.5, -1.6);
      c.lineTo(-1, -0.6);
      c.stroke();
      c.fillStyle = 'rgba(255,225,170,.35)';
      c.beginPath();
      c.ellipse(7.8, -1.9, 1.5, 0.9, -0.4, 0, TAU);
      c.fill();
      c.restore();
      // шаль на плечах, с узором и бахромой
      const shawl = [[-12, shY - 8], [-22, shY + 6], [-20, shY + 30], [-6, shY + 24], [6, shY + 10], [12, shY - 6]];
      c.fillStyle = C.shawl;
      smoothPath(c, shawl);
      c.fill();
      c.save();
      smoothPath(c, shawl);
      c.clip();
      c.fillStyle = C.shawlPat;
      for (let i = 0; i < 18; i++) {
        const x = -20 + (i % 6) * 6.5, y = shY - 4 + Math.floor(i / 6) * 9;
        c.beginPath();
        c.ellipse(x, y, 1.6, 2.6, 0.6, 0, TAU);
        c.fill();
      }
      c.restore();
      c.strokeStyle = C.shawl;
      c.lineWidth = 0.7;
      for (let i = 0; i < 9; i++) {
        c.beginPath();
        c.moveTo(-20 + i * 1.8, shY + 29 - i * 0.7);
        c.lineTo(-20.5 + i * 1.8, shY + 34 - i * 0.7);
        c.stroke();
      }
      // ближняя рука: ладонь на стойке, в пальцах ручка
      const r = arm(c, [3, shY + 5], 0.15, asleep ? 1.3 : 1.25, 25, 24, { sleeve: C.cardigan, skin: C.skin, r0: 5.4, r1: 4.4, r2: 3.8, cuff: C.blouse, hand: { size: 0.85, curl: 0.55 } });
      if (!asleep) {
        c.strokeStyle = '#1a2a4a';
        c.lineWidth = 1.4;
        const p0 = add(r.wrist, dir(r.fa, 7));
        c.beginPath();
        c.moveTo(p0[0] - 1, p0[1] - 6);
        c.lineTo(p0[0] + 7, p0[1] + 3);
        c.stroke();
      }
    });
  };

  // ---------- Вера Андреевна, библиотекарь ----------
  const VERA = { cardigan: '#5e6a5a', blouse: '#e0d8c8', skirt: '#3e3a44', skin: '#e0b39a', hair: '#4a2e22', shoes: '#2a1c16', tights: '#3a302c' };
  F.vera = (ctx, a, t) => {
    const C = VERA;
    const dims = { hip: 86, L1: 40, L2: 40, ankle: 6.5 };
    const pose = standing(a, t, dims);
    const { mv, ph, legN, legF, drop, breathe } = pose;
    const shY = -136 + drop;
    groundShadow(ctx, a, 26);
    render(ctx, a, t, [-56, -190, 64, 12], (c) => {
      c.fillStyle = shade(C.tights, -0.25);
      capsule(c, legF.knee, 4.6, legF.ankle, 3.4);
      shoe(c, legF.ankle, legF.fa, shade(C.shoes, -0.2), 0.82);
      arm(c, [-2, shY + 2], 0.3 * Math.sin(ph) * mv + 0.05, 0.3, 28, 25, { sleeve: shade(C.cardigan, -0.25), skin: shade(C.skin, -0.22), r0: 5, r1: 4, r2: 3.4, hand: { size: 0.85, curl: 0.4 } });
      c.fillStyle = C.tights;
      capsule(c, legN.knee, 4.6, legN.ankle, 3.4);
      shoe(c, legN.ankle, legN.fa, C.shoes, 0.82);
      // юбка-трапеция до середины голени
      const kx = Math.max(legN.knee[0], legF.knee[0]), kb = Math.min(legN.knee[0], legF.knee[0]);
      const skirtY = -32 + drop;
      const skirt = [[-13, shY + 50], [Math.min(-20, kb - 12), skirtY], [Math.max(20, kx + 12), skirtY - 1], [13, shY + 50]];
      c.fillStyle = C.skirt;
      smoothPath(c, [[-13, shY + 46], [-15, shY + 70], [Math.min(-20, kb - 12), skirtY], [0, skirtY + 1.5], [Math.max(20, kx + 12), skirtY - 1], [14, shY + 68], [13, shY + 46]]);
      c.fill();
      c.strokeStyle = 'rgba(0,0,0,.25)';
      c.lineWidth = 1;
      for (let i = 0; i < 4; i++) {
        c.beginPath();
        c.moveTo(-8 + i * 6, shY + 54);
        c.lineTo(-12 + i * 9 + (kx + kb) * 0.1, skirtY);
        c.stroke();
      }
      void skirt;
      // кофта
      const top = [[-7, shY - 7], [-15, shY + 3], [-14, shY + 30 + breathe], [-15, shY + 52], [14, shY + 52], [12.5, shY + 32], [15 + breathe * 0.5, shY + 12], [12, shY + 1], [7, shY - 7]];
      c.fillStyle = C.cardigan;
      smoothPath(c, top);
      c.fill();
      c.fillStyle = C.blouse;
      poly(c, [[4, shY - 7], [11, shY - 4], [9, shY + 4], [6, shY + 2]]);
      c.fill();
      c.fillStyle = 'rgba(0,0,0,.35)';
      [shY + 14, shY + 24, shY + 34, shY + 44].forEach((y) => { c.beginPath(); c.arc(11.5, y, 1.1, 0, TAU); c.fill(); });
      c.strokeStyle = 'rgba(0,0,0,.22)';
      c.beginPath();
      c.moveTo(10, shY + 4);
      c.lineTo(10.5, shY + 52);
      c.stroke();
      // голова
      c.save();
      c.translate(3, shY - 19 + breathe * 0.3);
      if (a.talking) c.rotate(Math.sin(t * 7) * 0.03);
      head(c, { skin: C.skin, nose: 12.2, chin: 9, rx: 9, ry: 10.6, brow: 'rgba(60,35,25,.8)', mouth: a.talking ? Math.max(0, Math.sin(t * 16)) * 1.2 : 0 });
      c.fillStyle = C.hair;
      smoothPath(c, [[-9.8, 5], [-10.5, -6], [-6, -11.8], [1, -12.4], [7.5, -10], [10, -5.5], [6, -6.8], [2, -7.5], [-1.5, -3], [-4, 4], [-7, 8]]);
      c.fill();
      c.beginPath();
      c.ellipse(-11, -4, 5.5, 6.5, 0.3, 0, TAU);
      c.fill();
      // выбившаяся прядь
      c.strokeStyle = C.hair;
      c.lineWidth = 0.9;
      c.beginPath();
      c.moveTo(7, -8);
      c.quadraticCurveTo(10 + Math.sin(t) * 0.5, -2, 8.5, 4);
      c.stroke();
      // очки
      c.strokeStyle = '#1a1210';
      c.lineWidth = 0.85;
      c.beginPath();
      c.arc(7.2, -1.4, 2.6, 0, TAU);
      c.moveTo(4.6, -1.6);
      c.lineTo(-1, -0.8);
      c.stroke();
      c.restore();
      // ближняя рука: книга или фонарь
      const hold = a.hold;
      const A = hold ? 0.55 : -0.3 * Math.sin(ph) * mv + 0.05;
      const E = hold ? 1.2 : 0.3;
      const r = arm(c, [2, shY + 2], A, E, 28, 25, { sleeve: C.cardigan, skin: C.skin, r0: 5, r1: 4, r2: 3.4, cuff: C.blouse, hand: hold ? { size: 0.85, grip: true } : { size: 0.85, curl: 0.4 } });
      if (hold === 'book') {
        c.fillStyle = '#6a2a22';
        c.save();
        c.translate(r.wrist[0] + 3, r.wrist[1] - 4);
        c.rotate(-0.15);
        P.rrect(c, -4, -12, 16, 22, 1.5);
        c.fill();
        c.fillStyle = '#d8ccb0';
        c.fillRect(10, -11, 2, 20);
        c.restore();
      }
      if (hold === 'light') {
        c.fillStyle = '#3a3f3a';
        P.rrect(c, r.wrist[0] - 1, r.wrist[1] - 4, 10, 8, 2);
        c.fill();
      }
    });
  };

  // ---------- Семёныч: старый рыбак сидит на скамейке ----------
  const SEM = { jacket: '#4c4a3a', stitch: '#2c2a20', hat: '#5a4a3a', fur: '#8a7a64', beard: '#c8c2b6', skin: '#c9967c', trousers: '#3a3a3e', boots: '#1e2420' };
  F.semenych = (ctx, a, t) => {
    const C = SEM;
    const breathe = Math.sin(t * 1.1) * 0.8;
    // сидит: таз на высоте сиденья (y = -44)
    render(ctx, a, t, [-50, -150, 66, 10], (c) => {
      const hip = [-2, -46];
      const knee = [24, -48];
      const ankle = [26, -7];
      // дальняя нога (чуть позади)
      c.fillStyle = shade(C.trousers, -0.25);
      capsule(c, [hip[0] - 3, hip[1]], 8, [knee[0] - 4, knee[1]], 6.5);
      c.fillStyle = shade(C.boots, -0.2);
      capsule(c, [knee[0] - 4, knee[1] + 4], 6.5, [ankle[0] - 5, ankle[1]], 5.8);
      shoe(c, [ankle[0] - 5, ankle[1]], 0, shade(C.boots, -0.2), 1.05, 2);
      // ватник
      const shY = -104 + breathe * 0.3;
      const body = [[-8, shY - 8], [-20, shY + 2], [-22, shY + 30], [-20, hip[1] + 8], [16, hip[1] + 10], [18, shY + 36], [20, shY + 10], [10, shY - 6]];
      c.fillStyle = C.jacket;
      smoothPath(c, body);
      c.fill();
      c.save();
      smoothPath(c, body);
      c.clip();
      c.strokeStyle = C.stitch;
      c.lineWidth = 1.1;
      for (let y = shY + 4; y < hip[1] + 10; y += 7) {
        c.beginPath();
        c.moveTo(-24, y);
        c.quadraticCurveTo(0, y + 2, 22, y);
        c.stroke();
      }
      c.strokeStyle = 'rgba(0,0,0,.35)';
      c.beginPath();
      c.moveTo(12, shY);
      c.lineTo(13, hip[1] + 10);
      c.stroke();
      c.restore();
      // ближняя нога
      c.fillStyle = C.trousers;
      capsule(c, hip, 8, knee, 6.5);
      c.fillStyle = C.boots;
      capsule(c, [knee[0], knee[1] + 4], 6.8, ankle, 6);
      shoe(c, ankle, 0, C.boots, 1.08, 2);
      c.fillStyle = 'rgba(255,255,255,.08)';
      c.fillRect(knee[0] + 2, knee[1] + 8, 2, 28);
      // голова в ушанке, с бородой
      c.save();
      c.translate(5, shY - 20);
      c.rotate(0.12);
      head(c, { skin: C.skin, nose: 14, chin: 9.5, brow: 'rgba(200,195,185,.9)', mouth: a.talking ? Math.max(0, Math.sin(t * 15)) * 1.2 : 0 });
      c.fillStyle = C.beard;
      smoothPath(c, [[1, 3], [9, 4.5], [11, 7], [10, 13], [5, 17], [-1, 13], [-1, 7]]);
      c.fill();
      c.strokeStyle = shade(C.beard, -0.25);
      c.lineWidth = 0.6;
      for (let i = 0; i < 5; i++) {
        c.beginPath();
        c.moveTo(1 + i * 2, 6);
        c.lineTo(i * 2.2, 15);
        c.stroke();
      }
      // ушанка
      c.fillStyle = C.fur;
      smoothPath(c, [[-12, 2], [-12.5, -8], [-8, -14], [2, -15.5], [9.5, -12], [11, -6], [-2, -6], [-6, 6], [-11, 8]]);
      c.fill();
      c.fillStyle = C.hat;
      smoothPath(c, [[-10, -9], [-7, -15.5], [3, -17.5], [9, -14], [9.5, -9.5], [0, -10]]);
      c.fill();
      c.strokeStyle = shade(C.fur, -0.3);
      c.lineWidth = 0.5;
      for (let i = 0; i < 10; i++) {
        c.beginPath();
        c.moveTo(-11 + i * 2, -7 + (i % 2));
        c.lineTo(-11.5 + i * 2, -5);
        c.stroke();
      }
      c.restore();
      // ближняя рука: локоть на колене, в пальцах папироса
      const r = arm(c, [4, shY + 6], 0.55, 1.35, 30, 27, { sleeve: C.jacket, skin: C.skin, r0: 7, r1: 6, r2: 5, cuff: shade(C.jacket, -0.3), hand: { curl: 0.55 } });
      const tip = add(r.wrist, dir(r.fa + 0.9, 13));
      c.strokeStyle = '#e8e0d0';
      c.lineWidth = 1.6;
      c.beginPath();
      c.moveTo(r.wrist[0] + 3, r.wrist[1] + 4);
      c.lineTo(tip[0], tip[1]);
      c.stroke();
      a._ember = tip;
    });
    // огонёк и дым — поверх освещения, светятся сами
    if (a._ember) {
      const f = a.face || 1;
      const ex = a.x + a._ember[0] * a.s * f, ey = a.y + a._ember[1] * a.s;
      const pulse = 0.6 + 0.4 * Math.sin(t * 2.3);
      P.glow(ctx, ex, ey, 6 * a.s, '#ff7a30', 0.7 * pulse);
      for (let i = 0; i < 6; i++) {
        const k = ((t * 0.25 + i / 6) % 1);
        ctx.fillStyle = `rgba(200,205,210,${0.18 * (1 - k)})`;
        ctx.beginPath();
        ctx.arc(ex + Math.sin(t + i * 2) * 6 * k * a.s, ey - k * 45 * a.s, (2 + k * 7) * a.s, 0, TAU);
        ctx.fill();
      }
    }
  };

  // Подменяем старые силуэты новыми фигурами.
  const A = OM.Actors;
  A.hero = F.lev;
  A.mitya = F.mitya;
  A.zina = F.zina;
  A.vera = F.vera;
  A.semenych = F.semenych;
})();
