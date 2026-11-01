// Общие мелочи: случайные числа, цвета, математика.
window.SV = window.SV || {};
(function () {
  const U = (SV.U = {});

  // Детерминированный генератор (mulberry32) — у каждого прохождения свой посев.
  U.rng = function (seed) {
    let a = seed >>> 0;
    const r = function () {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    r.int = (lo, hi) => lo + Math.floor(r() * (hi - lo + 1));
    r.pick = (arr) => arr[Math.floor(r() * arr.length)];
    r.chance = (p) => r() < p;
    r.shuffle = (arr) => {
      const a2 = arr.slice();
      for (let i = a2.length - 1; i > 0; i--) {
        const j = Math.floor(r() * (i + 1));
        [a2[i], a2[j]] = [a2[j], a2[i]];
      }
      return a2;
    };
    return r;
  };

  U.clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  U.lerp = (a, b, t) => a + (b - a) * t;

  // Цвета: '#rrggbb' <-> [r,g,b]
  const cache = {};
  U.rgb = function (hex) {
    if (cache[hex]) return cache[hex];
    const n = parseInt(hex.slice(1), 16);
    return (cache[hex] = [(n >> 16) & 255, (n >> 8) & 255, n & 255]);
  };
  U.hex = function (r, g, b) {
    const h = (v) => U.clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0');
    return '#' + h(r) + h(g) + h(b);
  };
  U.mix = function (a, b, t) {
    const x = U.rgb(a), y = U.rgb(b);
    return U.hex(U.lerp(x[0], y[0], t), U.lerp(x[1], y[1], t), U.lerp(x[2], y[2], t));
  };
  U.shade = function (a, f) {
    const x = U.rgb(a);
    return f < 1 ? U.hex(x[0] * f, x[1] * f, x[2] * f) : U.mix(a, '#ffffff', f - 1);
  };

  U.wait = (ms) => new Promise((res) => setTimeout(res, ms));
  U.plural = function (n, one, few, many) {
    const m10 = n % 10, m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return one;
    if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return few;
    return many;
  };
})();
