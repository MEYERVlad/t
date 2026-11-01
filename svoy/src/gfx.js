// Пиксельные примитивы. Сцена рисуется в маленький холст и растягивается без сглаживания.
(function () {
  const G = (SV.G = { W: 160, H: 176 });
  const U = SV.U;

  G.init = function (canvas) {
    canvas.width = G.W; canvas.height = G.H;
    G.cv = canvas;
    G.ctx = canvas.getContext('2d');
    G.ctx.imageSmoothingEnabled = false;
  };

  G.mk = function (w = G.W, h = G.H) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const x = c.getContext('2d');
    x.imageSmoothingEnabled = false;
    return [c, x];
  };

  // Набор кистей поверх 2d-контекста.
  G.brush = function (x) {
    const b = {};
    b.r = (X, Y, w, h, col) => { x.fillStyle = col; x.fillRect(Math.round(X), Math.round(Y), Math.round(w), Math.round(h)); };
    b.p = (X, Y, col) => { x.fillStyle = col; x.fillRect(Math.round(X), Math.round(Y), 1, 1); };
    // Закрашенный эллипс построчно — пиксельные края.
    b.ell = (cx, cy, rx, ry, col, yFrom = -1e9, yTo = 1e9) => {
      x.fillStyle = col;
      for (let dy = -ry; dy <= ry; dy++) {
        const Y = Math.round(cy + dy);
        if (Y < yFrom || Y > yTo) continue;
        const hw = Math.round(rx * Math.sqrt(Math.max(0, 1 - (dy * dy) / (ry * ry + 0.0001))));
        x.fillRect(Math.round(cx - hw), Y, hw * 2 + 1, 1);
      }
    };
    // Вертикальный градиент полосами с дизерингом на стыках.
    b.grad = (X, Y, w, h, c1, c2, steps = 6) => {
      for (let i = 0; i < h; i++) {
        const t = i / Math.max(1, h - 1);
        const k = t * (steps - 1), lo = Math.floor(k), fr = k - lo;
        const ca = U.mix(c1, c2, lo / (steps - 1)), cb = U.mix(c1, c2, Math.min(steps - 1, lo + 1) / (steps - 1));
        x.fillStyle = ca; x.fillRect(X, Y + i, w, 1);
        if (fr > 0.5) {
          x.fillStyle = cb;
          for (let j = (i % 2); j < w; j += 2) x.fillRect(X + j, Y + i, 1, 1);
        }
      }
    };
    // Мягкое пятно света: концентрические кольца с убывающей прозрачностью.
    b.glow = (cx, cy, r, col, a = 0.3) => {
      x.save();
      for (let i = r; i > 0; i -= 2) {
        x.globalAlpha = a * (1 - i / r) * 0.35;
        b.ell(cx, cy, i, i * 0.8, col);
      }
      x.restore();
    };
    b.x = x;
    return b;
  };

  // Снег — общий для всех уличных сцен.
  const flakes = [];
  for (let i = 0; i < 90; i++) flakes.push({ x: Math.random() * 180, y: Math.random() * 176, s: Math.random() < 0.2 ? 2 : 1, v: 6 + Math.random() * 14, ph: Math.random() * 6 });
  G.snow = function (b, t, dt, opts = {}) {
    const wind = opts.wind == null ? 8 : opts.wind, alpha = opts.alpha || 0.85;
    b.x.save(); b.x.globalAlpha = alpha;
    for (const f of flakes) {
      f.y += f.v * dt * (opts.speed || 1);
      f.x += (wind + Math.sin(t * 1.3 + f.ph) * 6) * dt * 0.6;
      if (f.y > G.H) { f.y = -2; f.x = Math.random() * 180 - 10; }
      if (f.x > G.W + 4) f.x = -4;
      if (f.x < -6) f.x = G.W + 2;
      b.r(f.x, f.y, f.s, f.s, f.s > 1 ? '#e8f0fa' : '#c8d4e6');
    }
    b.x.restore();
  };

  // Маленькие иконки для интерфейса — из строк.
  const ICONS = {
    fire: ['...a....', '..aa....', '..aba.a.', '.abba.a.', '.abcbaa.', 'abccbba.', 'abcccba.', '.abcba..'],
    wood: ['........', '.aaaaaa.', 'abbbbbba', 'acbbbbca', '.aaaaaa.', 'abbbbbba', 'acbbbbca', '.aaaaaa.'],
    food: ['........', '..aaaa..', '.abbbba.', 'abcbbcba', 'abbbbbba', 'abbbbbba', '.aaaaaa.', '........'],
    heart: ['........', '.aa.aa..', 'abbabba.', 'abbbbba.', '.abbba..', '..aba...', '...a....', '........'],
    candle: ['...a....', '..aba...', '...c....', '..ddd...', '..ded...', '..ddd...', '..ddd...', '.ddddd..'],
    candleOff: ['........', '........', '...c....', '..ddd...', '..ded...', '..ddd...', '..ddd...', '.ddddd..'],
    people: ['..a..a..', '.aaa.aa.', '..a..a..', '.bbbbbb.', 'bbbbbbbb', 'b.bb.bb.', '..b..b..', '........'],
  };
  const ICOL = {
    fire: { a: '#c0401c', b: '#f08a28', c: '#ffe08a' },
    wood: { a: '#3a2210', b: '#8a5a2e', c: '#c89a5a' },
    food: { a: '#4a2a10', b: '#c8863a', c: '#f0c070' },
    heart: { a: '#5a1018', b: '#d83040' },
    candle: { a: '#f09030', b: '#ffe8a0', c: '#2a2020', d: '#e8dcc0', e: '#c8b898' },
    candleOff: { c: '#2a2020', d: '#6a6458', e: '#5a5448' },
    people: { a: '#d8b090', b: '#5a6a8a' },
  };
  G.icon = function (name, scale = 3) {
    const rows = ICONS[name], [c, x] = G.mk(8 * scale, 8 * scale), col = ICOL[name];
    rows.forEach((row, y) => [...row].forEach((ch, X) => { if (col[ch]) { x.fillStyle = col[ch]; x.fillRect(X * scale, y * scale, scale, scale); } }));
    return c.toDataURL();
  };
})();
