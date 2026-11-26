// Маршруты по графу улиц (data/graph.js): ближайшая точка сети, A*, время в пути,
// пересечения Оби — там, где часы переводятся на час.
(function (root) {
  const NSK = root.NSK;
  // Ночная скорость по классу дороги, км/ч: магистраль, главная, районная, местная, дворовая
  // жилая, проезд, пешеходная улица (на машине — шагом).
  const KMH = [70, 55, 45, 40, 30, 15, 6];
  const MPM = KMH.map((v) => (v * 1000) / 60); // метров в минуту
  const VMAX = MPM[0];
  const CELL = 256;

  let G = null; // подготовленный граф

  function prepare() {
    const g = NSK.data.graph;
    if (!g) return null;
    if (G && G.src === g) return G;
    const n = g.nodes.length / 2;
    const adj = Array.from({ length: n }, () => []);
    g.edges.forEach((e, i) => {
      const cost = e[2] / MPM[Math.min(e[3], MPM.length - 1)];
      adj[e[0]].push([e[1], i, cost, 1]);
      adj[e[1]].push([e[0], i, cost, -1]);
    });
    // сетка для поиска ближайшего узла
    const grid = new Map();
    for (let i = 0; i < n; i++) {
      if (!adj[i].length) continue;
      const k = Math.floor(g.nodes[i * 2] / CELL) + ',' + Math.floor(g.nodes[i * 2 + 1] / CELL);
      if (!grid.has(k)) grid.set(k, []);
      grid.get(k).push(i);
    }
    G = { src: g, n, adj, grid };
    return G;
  }

  const nx = (i) => G.src.nodes[i * 2];
  const ny = (i) => G.src.nodes[i * 2 + 1];

  // Ближайший узел сети к точке (в пределах maxR метров) или -1.
  NSK.nearestNode = (x, y, maxR = 3000) => {
    if (!prepare()) return -1;
    const cx = Math.floor(x / CELL), cy = Math.floor(y / CELL);
    let best = -1, bd = Infinity;
    for (let r = 0; r * CELL <= maxR + CELL; r++) {
      for (let gx = cx - r; gx <= cx + r; gx++) {
        for (let gy = cy - r; gy <= cy + r; gy++) {
          if (Math.max(Math.abs(gx - cx), Math.abs(gy - cy)) !== r) continue;
          const list = G.grid.get(gx + ',' + gy);
          if (!list) continue;
          for (const i of list) {
            const d = (nx(i) - x) ** 2 + (ny(i) - y) ** 2;
            if (d < bd) { bd = d; best = i; }
          }
        }
      }
      // следующее кольцо клеток не ближе r*CELL — дальше искать незачем
      if (best >= 0 && bd <= (r * CELL) ** 2) break;
    }
    return bd <= maxR * maxR ? best : -1;
  };

  // Двоичная куча по ключу f.
  class Heap {
    constructor() { this.a = []; }
    push(f, v) {
      const a = this.a;
      a.push([f, v]);
      let i = a.length - 1;
      while (i > 0) {
        const p = (i - 1) >> 1;
        if (a[p][0] <= a[i][0]) break;
        [a[p], a[i]] = [a[i], a[p]];
        i = p;
      }
    }
    pop() {
      const a = this.a, top = a[0], last = a.pop();
      if (a.length) {
        a[0] = last;
        let i = 0;
        for (;;) {
          let m = i;
          const l = 2 * i + 1, r = l + 1;
          if (l < a.length && a[l][0] < a[m][0]) m = l;
          if (r < a.length && a[r][0] < a[m][0]) m = r;
          if (m === i) break;
          [a[m], a[i]] = [a[i], a[m]];
          i = m;
        }
      }
      return top;
    }
    get size() { return this.a.length; }
  }

  // Точки ребра от узла from: [[x, y], ...] включая оба конца.
  function edgePts(ei, dir) {
    const e = G.src.edges[ei];
    const ax = nx(e[0]), ay = ny(e[0]);
    const pts = [[ax, ay]];
    for (let k = 6; k + 1 < e.length; k += 2) pts.push([ax + e[k], ay + e[k + 1]]);
    pts.push([nx(e[1]), ny(e[1])]);
    return dir > 0 ? pts : pts.reverse();
  }

  // Маршрут между узлами. Возвращает null (пути нет) или
  //   { pts: [[x, y, минут_от_старта], ...], minutes, meters, crossings: [{ at, from, to, i }] }
  // crossings — переезды через Обь: at — минут от старта, from/to — берега, i — номер точки в pts.
  NSK.route = (a, b) => {
    if (!prepare() || a < 0 || b < 0) return null;
    const g = new Float64Array(G.n).fill(Infinity);
    const prev = new Int32Array(G.n).fill(-1);
    const via = new Int32Array(G.n).fill(-1);
    const dirs = new Int8Array(G.n);
    const done = new Uint8Array(G.n);
    const bx = nx(b), by = ny(b);
    const h = (i) => Math.hypot(nx(i) - bx, ny(i) - by) / VMAX;
    const open = new Heap();
    g[a] = 0;
    open.push(h(a), a);
    while (open.size) {
      const [, u] = open.pop();
      if (done[u]) continue;
      done[u] = 1;
      if (u === b) break;
      for (const [v, ei, cost, dir] of G.adj[u]) {
        const ng = g[u] + cost;
        if (ng < g[v]) {
          g[v] = ng; prev[v] = u; via[v] = ei; dirs[v] = dir;
          open.push(ng + h(v), v);
        }
      }
    }
    if (!done[b]) return null;
    const chain = [];
    for (let v = b; v !== a; v = prev[v]) chain.push(v);
    chain.reverse();
    const pts = [[nx(a), ny(a), 0]];
    const crossings = [];
    let minutes = 0, meters = 0;
    let bank = NSK.bankOf(nx(a), ny(a));
    for (const v of chain) {
      const e = G.src.edges[via[v]];
      const ep = edgePts(via[v], dirs[v]);
      const mpm = MPM[Math.min(e[3], MPM.length - 1)];
      for (let k = 1; k < ep.length; k++) {
        const d = Math.hypot(ep[k][0] - ep[k - 1][0], ep[k][1] - ep[k - 1][1]);
        meters += d;
        minutes += d / mpm;
        pts.push([ep[k][0], ep[k][1], minutes]);
        // берег меняется только на мосту или плотине: так протоки и острова не «переводят часы» зря
        if (e[4] & 1) {
          const nb = NSK.bankOf(ep[k][0], ep[k][1]);
          if (nb !== bank) {
            crossings.push({ at: minutes, from: bank, to: nb, i: pts.length - 1 });
            bank = nb;
          }
        }
      }
    }
    return { pts, minutes, meters, crossings };
  };

  // Маршрут между точками карты: от ближайшего узла к ближайшему узлу.
  NSK.routeXY = (x0, y0, x1, y1) => NSK.route(NSK.nearestNode(x0, y0), NSK.nearestNode(x1, y1));

  // Положение на маршруте через m минут после старта: { x, y, dir (радианы), i }.
  NSK.routeAt = (r, m) => {
    const p = r.pts;
    if (m <= 0) return { x: p[0][0], y: p[0][1], dir: p.length > 1 ? Math.atan2(p[1][1] - p[0][1], p[1][0] - p[0][0]) : 0, i: 0 };
    let lo = 0, hi = p.length - 1;
    if (m >= p[hi][2]) return { x: p[hi][0], y: p[hi][1], dir: hi ? Math.atan2(p[hi][1] - p[hi - 1][1], p[hi][0] - p[hi - 1][0]) : 0, i: hi };
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (p[mid][2] <= m) lo = mid; else hi = mid;
    }
    const k = (m - p[lo][2]) / (p[hi][2] - p[lo][2] || 1);
    return {
      x: p[lo][0] + (p[hi][0] - p[lo][0]) * k,
      y: p[lo][1] + (p[hi][1] - p[lo][1]) * k,
      dir: Math.atan2(p[hi][1] - p[lo][1], p[hi][0] - p[lo][0]),
      i: lo,
    };
  };
})(typeof window !== 'undefined' ? window : globalThis);
