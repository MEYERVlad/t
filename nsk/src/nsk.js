// «Час разницы» — данные карты, два берега и двое часов.
// Файлы данных (nsk/data/*.js) вызывают NSK.index / NSK.tile / NSK.graph / NSK.bounds / NSK.overview:
// так карта грузится тегом <script> прямо с диска, без сервера.
(function (root) {
  const NSK = (root.NSK = root.NSK || {});

  // ---------- Приём данных ----------
  NSK.data = { index: null, graph: null, bounds: null, overview: null, tiles: new Map() };
  const waiting = new Map(); // 'tx,ty' -> [колбэки]
  const key = (tx, ty) => tx + ',' + ty;

  NSK.index = (o) => {
    NSK.data.index = o;
    o.has = new Set(o.tiles.map(([x, y]) => key(x, y)));
    NSK.river = buildRiver(o.rivers || {});
  };
  NSK.graph = (o) => { NSK.data.graph = o; };
  NSK.bounds = (o) => { NSK.data.bounds = o; };
  NSK.overview = (o) => { NSK.data.overview = o; };
  NSK.tile = (tx, ty, t) => {
    t.tx = tx; t.ty = ty;
    NSK.data.tiles.set(key(tx, ty), t);
    const w = waiting.get(key(tx, ty));
    waiting.delete(key(tx, ty));
    if (w) w.forEach((f) => f(t));
  };

  // Есть ли вообще карта (index.js подключён и не пуст).
  NSK.hasMap = () => !!(NSK.data.index && NSK.data.index.tiles.length);

  // Тайл по номеру: сразу, если уже загружен; иначе подгружается тегом <script>.
  NSK.base = 'data/';
  NSK.loadTile = (tx, ty, cb) => {
    const k = key(tx, ty);
    const t = NSK.data.tiles.get(k);
    if (t) { if (cb) cb(t); return t; }
    const ix = NSK.data.index;
    if (!ix || !ix.has.has(k)) { if (cb) cb(null); return null; }
    if (waiting.has(k)) { if (cb) waiting.get(k).push(cb); return null; }
    waiting.set(k, cb ? [cb] : []);
    const s = document.createElement('script');
    s.src = NSK.base + 'tiles/t_' + tx + '_' + ty + '.js';
    s.onerror = () => {
      const w = waiting.get(k);
      waiting.delete(k);
      if (w) w.forEach((f) => f(null));
    };
    document.head.appendChild(s);
    return null;
  };

  // ---------- Берега ----------
  // Левый берег — слева по течению. Линии рек в OSM нарисованы по течению, поэтому знак
  // векторного произведения с ближайшим отрезком русла Оби и есть берег.
  function buildRiver(rivers) {
    const segs = [];
    for (const name of Object.keys(rivers)) {
      if (name !== 'Обь') continue;
      for (const line of rivers[name]) {
        for (let i = 0; i + 3 < line.length; i += 2) segs.push([line[i], line[i + 1], line[i + 2], line[i + 3]]);
      }
    }
    return segs;
  }
  NSK.river = [];
  // 'L' или 'R'; d — расстояние до русла в метрах. Без русла (нет карты) — всегда правый.
  NSK.bankInfo = (x, y) => {
    let best = Infinity, side = 1;
    for (const [ax, ay, bx, by] of NSK.river) {
      const dx = bx - ax, dy = by - ay;
      const l2 = dx * dx + dy * dy || 1;
      const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / l2));
      const px = ax + dx * t - x, py = ay + dy * t - y;
      const d = px * px + py * py;
      if (d < best) { best = d; side = dx * (y - ay) - dy * (x - ax); }
    }
    return { bank: side < 0 ? 'L' : 'R', d: Math.sqrt(best) };
  };
  NSK.bankOf = (x, y) => NSK.bankInfo(x, y).bank;
  NSK.BANK = { L: 'левый берег', R: 'правый берег' };

  // ---------- Часы ----------
  // Время игры t — минуты от начала смены. Правый берег живёт по «городскому» времени,
  // на левом — на час меньше. Все сроки называются по часам того берега, где адрес.
  const clock = (NSK.clock = {
    START: 21 * 60,          // смена начинается в 21:00 по правому берегу
    END: 9 * 60,             // и кончается в 06:00 — через девять часов
    DIFF: 60,                // тот самый час
    t: 0,
  });
  clock.local = (bank, t = clock.t) => (((clock.START + t - (bank === 'L' ? clock.DIFF : 0)) % 1440) + 1440) % 1440;
  clock.fmt = (min) => {
    min = ((Math.floor(min) % 1440) + 1440) % 1440;
    return String(Math.floor(min / 60)).padStart(2, '0') + ':' + String(min % 60).padStart(2, '0');
  };
  clock.show = (bank, t = clock.t) => clock.fmt(clock.local(bank, t));
  // «К 23:30 по левому» -> время игры. Часы и минуты — как их назвал бы житель того берега.
  clock.toGame = (bank, hh, mm) => {
    let m = hh * 60 + mm + (bank === 'L' ? clock.DIFF : 0) - clock.START;
    while (m < -180) m += 1440;
    return m;
  };
  clock.over = () => clock.t >= clock.END;
})(typeof window !== 'undefined' ? window : globalThis);
