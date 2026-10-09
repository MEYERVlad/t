// Общие утилиты. Глобальное пространство имён OM — без модулей, чтобы игра открывалась прямо с диска.
(function () {
  const OM = (window.OM = window.OM || {});
  OM.W = 1280;
  OM.H = 720;

  OM.clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  OM.lerp = (a, b, t) => a + (b - a) * t;
  OM.smooth = (t) => {
    t = OM.clamp(t, 0, 1);
    return t * t * (3 - 2 * t);
  };

  // Детерминированный генератор — чтобы процедурные декорации не «прыгали» между кадрами.
  OM.rng = (seed) => () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  OM.hex = (h, a = 1) => {
    h = h.replace('#', '');
    if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    const n = parseInt(h, 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
  };

  OM.inPoly = (x, y, p) => {
    let c = false;
    for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
      const [xi, yi] = p[i], [xj, yj] = p[j];
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
    }
    return c;
  };

  // Ближайшая к (x, y) точка внутри выпуклого многоугольника.
  OM.nearestInPoly = (x, y, p) => {
    if (OM.inPoly(x, y, p)) return [x, y];
    let best = [x, y], bd = Infinity;
    for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
      const [ax, ay] = p[j], [bx, by] = p[i];
      const dx = bx - ax, dy = by - ay;
      const t = OM.clamp(((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy || 1), 0, 1);
      const px = ax + dx * t, py = ay + dy * t;
      const d = (px - x) ** 2 + (py - y) ** 2;
      if (d < bd) { bd = d; best = [px, py]; }
    }
    // Чуть сдвигаем к центру, чтобы точка точно была внутри.
    let cx = 0, cy = 0;
    p.forEach(([a, b]) => { cx += a; cy += b; });
    cx /= p.length; cy /= p.length;
    return [best[0] + (cx - best[0]) * 0.01, best[1] + (cy - best[1]) * 0.01];
  };

  OM.sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  OM.store = {
    get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* приватный режим */ } },
    del(k) { try { localStorage.removeItem(k); } catch (e) { /* ничего */ } },
  };

  OM.makeCanvas = (w, h) => {
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(w));
    c.height = Math.max(1, Math.round(h));
    return c;
  };
})();
