// Процедурная «кисть»: небо, лес, свет, туман, дождь, зерно. Из этих примитивов собираются все сцены.
(function () {
  const P = (OM.P = {});
  const { rng, hex, lerp, clamp, W, H } = OM;
  const TAU = Math.PI * 2;

  P.vgrad = (ctx, y0, y1, stops) => {
    const g = ctx.createLinearGradient(0, y0, 0, y1);
    stops.forEach(([o, c]) => g.addColorStop(o, c));
    return g;
  };
  P.hgrad = (ctx, x0, x1, stops) => {
    const g = ctx.createLinearGradient(x0, 0, x1, 0);
    stops.forEach(([o, c]) => g.addColorStop(o, c));
    return g;
  };
  P.rgrad = (ctx, x, y, r0, r1, stops) => {
    const g = ctx.createRadialGradient(x, y, r0, x, y, r1);
    stops.forEach(([o, c]) => g.addColorStop(o, c));
    return g;
  };
  P.fillV = (ctx, x, y, w, h, stops) => {
    ctx.fillStyle = P.vgrad(ctx, y, y + h, stops);
    ctx.fillRect(x, y, w, h);
  };
  P.rrect = (ctx, x, y, w, h, r) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  };

  // ---------- Свет ----------
  P.glow = (ctx, x, y, r, color, a = 1, mode = 'lighter') => {
    if (r <= 0 || a <= 0) return;
    ctx.save();
    ctx.globalCompositeOperation = mode;
    ctx.fillStyle = P.rgrad(ctx, x, y, 0, r, [
      [0, hex(color, a)],
      [0.18, hex(color, a * 0.5)],
      [0.5, hex(color, a * 0.14)],
      [1, hex(color, 0)],
    ]);
    ctx.fillRect(x - r, y - r, 2 * r, 2 * r);
    ctx.restore();
  };
  P.eglow = (ctx, x, y, rx, ry, color, a = 1, mode = 'lighter') => {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(1, ry / rx);
    P.glow(ctx, 0, 0, rx, color, a, mode);
    ctx.restore();
  };
  // Мягкий конус света (несколько проходов для размытых краёв).
  P.cone = (ctx, x, y, topW, botW, h, color, a) => {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const passes = 5;
    for (let i = 0; i < passes; i++) {
      const k = 1 - i / passes;
      const tw = topW * (0.4 + 0.6 * k), bw = botW * (0.35 + 0.65 * k);
      ctx.fillStyle = P.vgrad(ctx, y, y + h, [
        [0, hex(color, (a / passes) * 1.6)],
        [0.55, hex(color, (a / passes) * 0.5)],
        [1, hex(color, 0)],
      ]);
      ctx.beginPath();
      ctx.moveTo(x - tw / 2, y);
      ctx.lineTo(x + tw / 2, y);
      ctx.lineTo(x + bw / 2, y + h);
      ctx.lineTo(x - bw / 2, y + h);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  };
  // Отражение источника на мокром асфальте / воде: дрожащие вертикальные полосы.
  P.streak = (ctx, x, y, w, h, color, a, seed = 1, t = 0) => {
    const r = rng(seed);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const n = Math.max(10, (h / 2.5) | 0);
    for (let i = 0; i < n; i++) {
      const k = i / n;
      const yy = y + k * h;
      const ww = w * (1 - k * 0.55) * (0.55 + r() * 0.6);
      const wob = Math.sin(t * 2 + i * 1.7 + seed) * w * 0.12;
      const al = a * (1 - k) * (0.35 + r() * 0.65);
      ctx.fillStyle = hex(color, al);
      ctx.fillRect(x - ww / 2 + wob, yy, ww, h / n + 1.5);
    }
    ctx.restore();
  };

  // ---------- Небо ----------
  P.clouds = (ctx, seed, o) => {
    const r = rng(seed);
    const { x0 = -150, x1 = W + 150, y0, y1, n = 14, color = '#1a2633', a = 0.5, size = [90, 240], flat = 0.42 } = o;
    for (let i = 0; i < n; i++) {
      const cx = lerp(x0, x1, r()), cy = lerp(y0, y1, r()), w = lerp(size[0], size[1], r());
      const blobs = 7 + ((r() * 8) | 0);
      for (let b = 0; b < blobs; b++) {
        const bx = cx + (r() - 0.5) * w * 1.8, by = cy + (r() - 0.5) * w * 0.22, br = w * (0.22 + r() * 0.38);
        ctx.save();
        ctx.translate(bx, by);
        ctx.scale(1, flat);
        ctx.fillStyle = P.rgrad(ctx, 0, 0, 0, br, [
          [0, hex(color, a)],
          [0.55, hex(color, a * 0.55)],
          [1, hex(color, 0)],
        ]);
        ctx.fillRect(-br, -br, br * 2, br * 2);
        ctx.restore();
      }
    }
  };

  P.stars = (ctx, seed, n, y1, a = 0.7) => {
    const r = rng(seed);
    for (let i = 0; i < n; i++) {
      const x = r() * W, y = Math.pow(r(), 1.6) * y1, s = r() * 1.2 + 0.3;
      ctx.fillStyle = hex('#dfe7ff', a * (0.2 + r() * 0.8) * (1 - y / y1));
      ctx.fillRect(x, y, s, s);
    }
  };

  P.moon = (ctx, x, y, rad, a = 1) => {
    P.glow(ctx, x, y, rad * 11, '#8fa6bd', 0.16 * a);
    P.glow(ctx, x, y, rad * 3.2, '#dce6ee', 0.32 * a);
    ctx.save();
    ctx.globalAlpha = a;
    ctx.fillStyle = P.rgrad(ctx, x - rad * 0.3, y - rad * 0.3, rad * 0.1, rad * 1.1, [
      [0, '#f4f6f2'],
      [1, '#c9d1d4'],
    ]);
    ctx.beginPath();
    ctx.arc(x, y, rad, 0, TAU);
    ctx.fill();
    const r = rng(77);
    for (let i = 0; i < 9; i++) {
      const a2 = r() * TAU, d = r() * rad * 0.7;
      ctx.fillStyle = hex('#a9b3b8', 0.25 + r() * 0.25);
      ctx.beginPath();
      ctx.arc(x + Math.cos(a2) * d, y + Math.sin(a2) * d, rad * (0.08 + r() * 0.16), 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  };

  // ---------- Деревья ----------
  // Ель: зубчатый силуэт ярусами.
  P.pine = (ctx, x, yb, h, w, r) => {
    const n = 7 + ((r() * 6) | 0);
    const top = yb - h;
    const dy = (h * 0.9) / n;
    const L = [], R = [];
    for (let i = 1; i <= n; i++) {
      const t = i / n;
      const y = top + t * h * 0.9;
      const hw = (w / 2) * Math.pow(t, 0.85);
      L.push([x - hw * (0.42 + r() * 0.1), y - dy * 0.35], [x - hw * (0.85 + r() * 0.3), y + r() * 2]);
      R.push([x + hw * (0.42 + r() * 0.1), y - dy * 0.35], [x + hw * (0.85 + r() * 0.3), y + r() * 2]);
    }
    ctx.beginPath();
    ctx.moveTo(x + (r() - 0.5) * 2, top);
    L.forEach(([a, b]) => ctx.lineTo(a, b));
    ctx.lineTo(x - w * 0.05, yb);
    ctx.lineTo(x + w * 0.05, yb);
    for (let i = R.length - 1; i >= 0; i--) ctx.lineTo(R[i][0], R[i][1]);
    ctx.closePath();
    ctx.fill();
  };

  P.forest = (ctx, seed, o) => {
    const r = rng(seed);
    const { x0 = -40, x1 = W + 40, yb, hMin, hMax, color, step = [12, 28], wr = [0.3, 0.42], fillTo = null, skip = null } = o;
    ctx.fillStyle = color;
    let x = x0;
    while (x < x1) {
      const h = lerp(hMin, hMax, Math.pow(r(), 1.3));
      if (!skip || !skip(x)) P.pine(ctx, x, yb + r() * 8, h, h * lerp(wr[0], wr[1], r()), r);
      x += lerp(step[0], step[1], r());
    }
    if (fillTo != null) ctx.fillRect(x0 - 60, yb + 4, x1 - x0 + 120, fillTo - yb);
  };

  // Голое дерево — рекурсивные ветви.
  P.branch = (ctx, x, y, len, ang, w, d, r, droop = 0) => {
    if (d <= 0 || len < 3) return;
    const x2 = x + Math.cos(ang) * len, y2 = y + Math.sin(ang) * len + droop * len * 0.3;
    ctx.lineWidth = Math.max(0.6, w);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo((x + x2) / 2 + (r() - 0.5) * len * 0.25, (y + y2) / 2 + (r() - 0.5) * len * 0.2, x2, y2);
    ctx.stroke();
    const k = 2 + (r() < 0.4 ? 1 : 0);
    for (let i = 0; i < k; i++) {
      P.branch(ctx, x2, y2, len * (0.6 + r() * 0.22), ang + (r() - 0.5) * 1.15, w * 0.66, d - 1, r, droop);
    }
  };
  P.bareTree = (ctx, x, yb, h, color, seed, o = {}) => {
    const r = rng(seed);
    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineCap = 'round';
    const tw = o.trunk || h * 0.045;
    ctx.beginPath();
    ctx.moveTo(x - tw, yb);
    ctx.quadraticCurveTo(x - tw * 0.6, yb - h * 0.3, x - tw * 0.35, yb - h * 0.55);
    ctx.lineTo(x + tw * 0.35, yb - h * 0.55);
    ctx.quadraticCurveTo(x + tw * 0.7, yb - h * 0.3, x + tw, yb);
    ctx.fill();
    P.branch(ctx, x, yb - h * 0.5, h * 0.32, -Math.PI / 2 + (r() - 0.5) * 0.3, tw * 0.8, o.depth || 6, r, o.droop || 0);
    ctx.restore();
  };

  // Берёза: светлый ствол с чёрными чечевичками и плакучие ветви.
  P.birch = (ctx, x, yb, h, seed, o = {}) => {
    const r = rng(seed);
    const tw = o.w || h * 0.035;
    const lean = o.lean || 0;
    const light = o.light || '#c9cfc9';
    const shade = o.shade || '#5b6460';
    ctx.save();
    // ветви
    ctx.strokeStyle = o.branch || '#0b0f10';
    ctx.lineCap = 'round';
    for (let i = 0; i < 9; i++) {
      const yy = yb - h * (0.45 + r() * 0.5);
      const xx = x + lean * (yb - yy);
      P.branch(ctx, xx, yy, h * (0.1 + r() * 0.14), -Math.PI / 2 + (r() < 0.5 ? -1 : 1) * (0.5 + r() * 0.9), tw * 0.35, 4, r, 0.9);
    }
    // ствол
    ctx.beginPath();
    ctx.moveTo(x - tw, yb);
    ctx.lineTo(x - tw * 0.4 + lean * h, yb - h);
    ctx.lineTo(x + tw * 0.4 + lean * h, yb - h);
    ctx.lineTo(x + tw, yb);
    ctx.closePath();
    ctx.fillStyle = P.hgrad(ctx, x - tw, x + tw, [
      [0, shade],
      [0.35, light],
      [1, shade],
    ]);
    ctx.fill();
    ctx.clip();
    // метки
    for (let i = 0; i < h / 7; i++) {
      const yy = yb - r() * h;
      const xx = x + lean * (yb - yy);
      ctx.fillStyle = hex('#0b0d0e', 0.55 + r() * 0.45);
      const ww = tw * (0.4 + r() * 1.4);
      ctx.fillRect(xx - tw + r() * tw * 1.2, yy, ww, 1 + r() * 2.5);
    }
    ctx.fillStyle = hex('#0b0d0e', 0.9);
    ctx.fillRect(x - tw * 2, yb - h * 0.12, tw * 4, h * 0.12);
    ctx.restore();
  };

  // Деревянный столб ЛЭП с перекладиной и изоляторами. Возвращает точки крепления проводов.
  P.pole = (ctx, x, yb, h, color = '#07090b') => {
    ctx.fillStyle = color;
    ctx.fillRect(x - 3.5, yb - h, 7, h);
    ctx.fillRect(x - 34, yb - h + 14, 68, 5);
    const pts = [];
    [-28, -10, 10, 28].forEach((dx) => {
      ctx.fillRect(x + dx - 2, yb - h + 6, 4, 9);
      pts.push([x + dx, yb - h + 6]);
    });
    return pts;
  };
  P.wires = (ctx, a, b, sag, color = 'rgba(5,7,9,.9)', w = 1.2) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = w;
    for (let i = 0; i < a.length; i++) {
      const [x0, y0] = a[i], [x1, y1] = b[i];
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.quadraticCurveTo((x0 + x1) / 2, (y0 + y1) / 2 + sag, x1, y1);
      ctx.stroke();
    }
  };

  // Окно со светом, рамой и, по желанию, занавеской.
  P.window = (ctx, x, y, w, h, o = {}) => {
    const lit = o.lit;
    ctx.save();
    if (lit) {
      ctx.fillStyle = P.vgrad(ctx, y, y + h, [
        [0, hex(lit, 0.75 * (o.a ?? 1))],
        [1, hex(lit, 0.95 * (o.a ?? 1))],
      ]);
    } else ctx.fillStyle = o.dark || '#0b1016';
    ctx.fillRect(x, y, w, h);
    if (lit && o.curtain) {
      ctx.fillStyle = hex(o.curtain, 0.55);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + w * 0.35, y + h * 0.4, x + w * 0.18, y + h);
      ctx.lineTo(x, y + h);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x + w, y);
      ctx.quadraticCurveTo(x + w * 0.65, y + h * 0.4, x + w * 0.82, y + h);
      ctx.lineTo(x + w, y + h);
      ctx.fill();
    }
    if (lit && o.silhouette) {
      // кто-то за шторой
      ctx.fillStyle = hex('#1a0f08', 0.6);
      ctx.beginPath();
      ctx.ellipse(x + w * 0.55, y + h * 0.45, w * 0.1, h * 0.14, 0, 0, TAU);
      ctx.fill();
      ctx.fillRect(x + w * 0.38, y + h * 0.58, w * 0.34, h * 0.42);
    }
    const fr = o.frame || '#0a0b0c';
    ctx.fillStyle = fr;
    const t = o.ft || 3;
    ctx.fillRect(x - t, y - t, w + 2 * t, t);
    ctx.fillRect(x - t, y + h, w + 2 * t, t + 2);
    ctx.fillRect(x - t, y, t, h);
    ctx.fillRect(x + w, y, t, h);
    ctx.fillRect(x + w / 2 - 1.5, y, 3, h);
    ctx.fillRect(x, y + h * 0.33 - 1.5, w, 3);
    ctx.restore();
    if (lit && o.glow !== false) P.glow(ctx, x + w / 2, y + h / 2, Math.max(w, h) * 1.3, lit, 0.22 * (o.a ?? 1));
  };

  // Бумажная фактура: мягкие пятна, чтобы плоские заливки выглядели «живописно».
  P.paper = (ctx, seed, a = 0.06, x = 0, y = 0, w = W, h = H) => {
    const r = rng(seed);
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
    for (let i = 0; i < 70; i++) {
      const px = x + r() * w, py = y + r() * h, rr = 30 + r() * 160;
      const dark = r() < 0.55;
      ctx.globalCompositeOperation = dark ? 'multiply' : 'screen';
      ctx.fillStyle = P.rgrad(ctx, px, py, 0, rr, [
        [0, dark ? `rgba(0,0,0,${a})` : `rgba(255,240,220,${a * 0.5})`],
        [1, 'rgba(0,0,0,0)'],
      ]);
      ctx.fillRect(px - rr, py - rr, rr * 2, rr * 2);
    }
    ctx.restore();
  };

  // Мелкий шум-фактура (бетон, штукатурка, дерево).
  P.speckle = (ctx, seed, x, y, w, h, n, color, a) => {
    const r = rng(seed);
    ctx.fillStyle = color;
    for (let i = 0; i < n; i++) {
      ctx.globalAlpha = a * r();
      ctx.fillRect(x + r() * w, y + r() * h, 1 + r() * 2, 1 + r() * 2);
    }
    ctx.globalAlpha = 1;
  };

  // ---------- Динамика: дождь, туман, зерно ----------
  class Rain {
    constructor(n = 420, o = {}) {
      this.o = Object.assign({ angle: 0.16, speed: [900, 1500], len: [14, 34], ground: [600, 720], area: [0, 0, W, H] }, o);
      this.drops = [];
      this.splash = [];
      const r = Math.random;
      for (let i = 0; i < n; i++) this.drops.push(this.spawn(true));
      this.r = r;
    }
    spawn(any) {
      const o = this.o;
      const z = Math.random();
      return {
        x: o.area[0] + Math.random() * (o.area[2] + 200) - 100,
        y: any ? o.area[1] + Math.random() * o.area[3] : o.area[1] - 40,
        z,
        v: lerp(o.speed[0], o.speed[1], z),
        l: lerp(o.len[0], o.len[1], z),
        gy: lerp(o.ground[0], o.ground[1], z),
      };
    }
    update(dt) {
      const o = this.o;
      for (let i = 0; i < this.drops.length; i++) {
        const d = this.drops[i];
        d.y += d.v * dt;
        d.x += d.v * dt * o.angle;
        if (d.y > d.gy) {
          if (Math.random() < 0.35 && o.splash !== false) this.splash.push({ x: d.x, y: d.gy, t: 0, z: d.z });
          this.drops[i] = this.spawn(false);
        }
      }
      for (let i = this.splash.length - 1; i >= 0; i--) {
        const s = this.splash[i];
        s.t += dt;
        if (s.t > 0.22) this.splash.splice(i, 1);
      }
    }
    draw(ctx, lights = [], base = 0.12, tint = '#b8c8d6') {
      const o = this.o;
      ctx.save();
      ctx.lineCap = 'round';
      const rgb = hex(tint, 1).slice(5, -3);
      for (const d of this.drops) {
        if (o.mask && o.mask(d.x, d.y)) continue;
        let a = base * (0.35 + d.z * 0.65);
        for (const L of lights) {
          const dx = d.x - L.x, dy = d.y - L.y;
          const dd = (dx * dx) / (L.rx * L.rx) + (dy * dy) / (L.ry * L.ry);
          if (dd < 1) a += (1 - dd) * L.a;
        }
        if (a < 0.01) continue;
        ctx.strokeStyle = `rgba(${rgb},${Math.min(a, 0.85)})`;
        ctx.lineWidth = 0.6 + d.z * 0.9;
        ctx.beginPath();
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x - d.l * o.angle, d.y - d.l);
        ctx.stroke();
      }
      for (const s of this.splash) {
        const k = s.t / 0.22;
        ctx.strokeStyle = `rgba(${rgb},${(1 - k) * 0.35 * (0.4 + s.z)})`;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.ellipse(s.x, s.y, 2 + k * 9 * (0.4 + s.z), 0.6 + k * 2, 0, 0, TAU);
        ctx.stroke();
      }
      ctx.restore();
    }
  }
  P.Rain = Rain;

  // Текстура тумана, бесшовная по горизонтали.
  let fogTex = null;
  P.fogTexture = () => {
    if (fogTex) return fogTex;
    const w = 1024, h = 256;
    const c = OM.makeCanvas(w, h);
    const g = c.getContext('2d');
    const r = rng(9);
    for (let i = 0; i < 140; i++) {
      const x = r() * w, y = h * (0.25 + r() * 0.5), rr = 40 + r() * 120;
      for (const ox of [-w, 0, w]) {
        g.save();
        g.translate(x + ox, y);
        g.scale(1, 0.35);
        g.fillStyle = P.rgrad(g, 0, 0, 0, rr, [
          [0, `rgba(255,255,255,${0.05 + r() * 0.05})`],
          [1, 'rgba(255,255,255,0)'],
        ]);
        g.fillRect(-rr, -rr, rr * 2, rr * 2);
        g.restore();
      }
    }
    fogTex = c;
    return c;
  };
  // Полоса тумана: y — центр, h — высота, speed — px/сек.
  P.fogBand = (ctx, t, y, h, speed, a, color = null) => {
    const tex = P.fogTexture();
    const tw = (tex.width * h) / tex.height;
    let off = ((t * speed) % tw + tw) % tw;
    ctx.save();
    ctx.globalAlpha = a;
    if (color) {
      // тонированный туман: рисуем в отдельном слое
      ctx.globalCompositeOperation = 'lighter';
    }
    for (let x = -off; x < W; x += tw) ctx.drawImage(tex, x, y - h / 2, tw + 1, h);
    ctx.restore();
  };

  // Зерно плёнки.
  const grains = [];
  P.grain = (ctx, a = 0.07) => {
    if (!grains.length) {
      for (let k = 0; k < 4; k++) {
        const c = OM.makeCanvas(256, 256);
        const g = c.getContext('2d');
        const id = g.createImageData(256, 256);
        for (let i = 0; i < id.data.length; i += 4) {
          const v = Math.random() * 255;
          id.data[i] = id.data[i + 1] = id.data[i + 2] = v;
          id.data[i + 3] = 255;
        }
        g.putImageData(id, 0, 0);
        grains.push(ctx.createPattern(c, 'repeat'));
      }
    }
    const p = grains[(Math.random() * grains.length) | 0];
    ctx.save();
    ctx.globalAlpha = a;
    ctx.globalCompositeOperation = 'overlay';
    ctx.translate(-Math.random() * 256, -Math.random() * 256);
    ctx.fillStyle = p;
    ctx.fillRect(0, 0, W + 256, H + 256);
    ctx.restore();
  };

  let vig = null;
  P.vignette = (ctx, a = 1) => {
    if (!vig) {
      vig = OM.makeCanvas(W / 2, H / 2);
      const g = vig.getContext('2d');
      g.scale(0.5, 0.5);
      g.fillStyle = P.rgrad(g, W / 2, H * 0.48, H * 0.3, W * 0.72, [
        [0, 'rgba(0,0,0,0)'],
        [0.55, 'rgba(0,0,0,0.25)'],
        [1, 'rgba(0,0,0,0.85)'],
      ]);
      g.fillRect(0, 0, W, H);
    }
    ctx.save();
    ctx.globalAlpha = a;
    ctx.drawImage(vig, 0, 0, W, H);
    ctx.restore();
  };

  P.text = (ctx, s, x, y, o = {}) => {
    ctx.save();
    ctx.font = o.font || '700 20px "PT Serif", Georgia, serif';
    ctx.fillStyle = o.color || '#111';
    ctx.textAlign = o.align || 'center';
    ctx.textBaseline = 'middle';
    if (o.ls) ctx.letterSpacing = o.ls + 'px';
    if (o.alpha != null) ctx.globalAlpha = o.alpha;
    ctx.fillText(s, x, y);
    ctx.restore();
  };
})();
