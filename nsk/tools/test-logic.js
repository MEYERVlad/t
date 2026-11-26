// Проверка логики «Часа разницы» без браузера: часы двух берегов, берега, маршруты.
//   node nsk/tools/test-logic.js
// Граф и русло здесь — крошечные самодельные, только для теста; настоящая карта лежит в nsk/data.
const assert = require('assert');
const path = require('path');
require(path.join(__dirname, '../src/nsk.js'));
require(path.join(__dirname, '../src/router.js'));
const NSK = globalThis.NSK;
const { clock } = NSK;
let n = 0;
const ok = (name, fn) => { fn(); n++; console.log('  ок  ' + name); };

// ---------- Часы ----------
ok('смена начинается в 21:00 по правому и в 20:00 по левому', () => {
  assert.strictEqual(clock.show('R', 0), '21:00');
  assert.strictEqual(clock.show('L', 0), '20:00');
});
ok('полночь переваливается, разница всегда час', () => {
  assert.strictEqual(clock.show('R', 200), '00:20');
  assert.strictEqual(clock.show('L', 200), '23:20');
  for (const t of [0, 59, 60, 179, 180, 539]) {
    assert.strictEqual((clock.local('R', t) - clock.local('L', t) + 1440) % 1440, 60);
  }
});
ok('срок по местным часам переводится во время игры и обратно', () => {
  assert.strictEqual(clock.toGame('R', 23, 30), 150);
  assert.strictEqual(clock.toGame('L', 23, 30), 210);
  assert.strictEqual(clock.toGame('R', 0, 15), 195);
  assert.strictEqual(clock.toGame('L', 20, 30), 30);
  for (const [b, h, m] of [['R', 22, 5], ['L', 22, 5], ['R', 3, 40], ['L', 5, 0]]) {
    assert.strictEqual(clock.show(b, clock.toGame(b, h, m)), clock.fmt(h * 60 + m));
  }
});
ok('«доставлено раньше, чем отправлено»: выехал с правого в 23:05, через 43 минуты на левом 22:48', () => {
  const sent = clock.toGame('R', 23, 5);
  assert.strictEqual(clock.show('L', sent + 43), '22:48');
});
ok('смена кончается в 06:00 по правому', () => {
  assert.strictEqual(clock.show('R', clock.END), '06:00');
});

// ---------- Берега ----------
// Река течёт на север вдоль x = 0 (y убывает): запад — левый берег.
NSK.index({ tiles: [], rivers: { 'Обь': [[0, 1000, 0, 0, 0, -1000]], 'Иня': [[500, 0, 0, 0]] } });
ok('берег определяется по течению', () => {
  assert.strictEqual(NSK.bankOf(-50, 10), 'L');
  assert.strictEqual(NSK.bankOf(50, 10), 'R');
  assert.strictEqual(NSK.bankOf(-3000, -900), 'L');
  assert.strictEqual(NSK.bankOf(4000, 700), 'R');
  assert.ok(Math.abs(NSK.bankInfo(120, 0).d - 120) < 1e-9);
});
ok('приток (Иня) на берег не влияет', () => {
  assert.strictEqual(NSK.bankOf(300, -200), 'R');
  assert.strictEqual(NSK.bankOf(300, 200), 'R');
});

// ---------- Маршруты ----------
// Узлы: 0 (R) —— 1 (R) ══мост══ 2 (L) —— 3 (L);  4 (R) — тупик-объезд к 1;  5 — отдельно, недостижим.
NSK.graph({
  nodes: [1000, 0, 200, 0, -200, 0, -1000, 0, 200, 600, 5000, 5000, 5100, 5000],
  edges: [
    [0, 1, 800, 1, 0, 0],           // главная улица, 55 км/ч
    [1, 2, 400, 1, 1, -1],          // мост
    [2, 3, 800, 4, 0, 1],           // жилая, 30 км/ч
    [1, 4, 600, 5, 0, -1, 0, 300],  // проезд с промежуточной точкой
    [5, 6, 100, 4, 0, -1],
  ],
  names: ['Правая улица', 'Левая улица'],
});
ok('ближайший узел', () => {
  assert.strictEqual(NSK.nearestNode(990, 20), 0);
  assert.strictEqual(NSK.nearestNode(-950, -30), 3);
  assert.strictEqual(NSK.nearestNode(230, 580), 4);
  assert.strictEqual(NSK.nearestNode(-40000, 0, 3000), -1);
});
const mpm = (kmh) => (kmh * 1000) / 60;
ok('маршрут через мост: время, длина и один переезд с правого на левый', () => {
  const r = NSK.route(0, 3);
  assert.ok(r);
  assert.strictEqual(Math.round(r.meters), 2000);
  const want = 800 / mpm(55) + 400 / mpm(55) + 800 / mpm(30);
  assert.ok(Math.abs(r.minutes - want) < 1e-9);
  assert.strictEqual(r.crossings.length, 1);
  assert.deepStrictEqual([r.crossings[0].from, r.crossings[0].to], ['R', 'L']);
  // часы переводятся на мосту: после 800 м по главной, до конца моста
  assert.ok(r.crossings[0].at > 800 / mpm(55) - 1e-9 && r.crossings[0].at <= 1200 / mpm(55) + 1e-9);
  assert.deepStrictEqual(r.pts[0].slice(0, 2), [1000, 0]);
  assert.deepStrictEqual(r.pts[r.pts.length - 1].slice(0, 2), [-1000, 0]);
});
ok('обратно — с левого на правый', () => {
  const r = NSK.route(3, 0);
  assert.deepStrictEqual(r.crossings.map((c) => c.from + c.to), ['LR']);
});
ok('по одному берегу часы не переводятся; промежуточные точки ребра на месте', () => {
  const r = NSK.route(0, 4);
  assert.strictEqual(r.crossings.length, 0);
  assert.deepStrictEqual(r.pts.map((p) => p.slice(0, 2)), [[1000, 0], [200, 0], [200, 300], [200, 600]]);
  const back = NSK.route(4, 0);
  assert.deepStrictEqual(back.pts.map((p) => p.slice(0, 2)), [[200, 600], [200, 300], [200, 0], [1000, 0]]);
});
ok('недостижимое место — пути нет', () => {
  assert.strictEqual(NSK.route(0, 5), null);
  assert.strictEqual(NSK.route(0, -1), null);
});
ok('положение на маршруте по времени', () => {
  const r = NSK.route(0, 3);
  const a = NSK.routeAt(r, 0), z = NSK.routeAt(r, r.minutes + 5);
  assert.deepStrictEqual([a.x, a.y], [1000, 0]);
  assert.deepStrictEqual([z.x, z.y], [-1000, 0]);
  const half = NSK.routeAt(r, (400 / mpm(55)));
  assert.ok(Math.abs(half.x - 600) < 1e-6 && Math.abs(half.y) < 1e-9);
  assert.ok(Math.abs(Math.abs(half.dir) - Math.PI) < 1e-9); // едем на запад
});

// A* против простого Дейкстры на случайном графе.
ok('A* находит такой же по времени путь, что и полный перебор (200 случайных пар)', () => {
  let seed = 12345;
  const rnd = () => ((seed = (Math.imul(seed, 1103515245) + 12345) >>> 0) / 4294967296);
  const N = 300, nodes = [], edges = [];
  for (let i = 0; i < N; i++) nodes.push(Math.round(rnd() * 8000 + 100), Math.round(rnd() * 8000));
  for (let i = 0; i < N; i++) {
    for (let k = 0; k < 3; k++) {
      const j = Math.floor(rnd() * N);
      if (j === i) continue;
      const d = Math.hypot(nodes[i * 2] - nodes[j * 2], nodes[i * 2 + 1] - nodes[j * 2 + 1]);
      // длина не меньше прямой (как у настоящих дорог), класс случайный
      edges.push([i, j, Math.max(1, Math.round(d * (1 + rnd() * 0.5))), Math.floor(rnd() * 7), 0, -1]);
    }
  }
  NSK.graph({ nodes, edges, names: [] });
  const KMH = [70, 55, 45, 40, 30, 15, 6];
  const adj = Array.from({ length: N }, () => []);
  edges.forEach((e) => { const c = e[2] / mpm(KMH[e[3]]); adj[e[0]].push([e[1], c]); adj[e[1]].push([e[0], c]); });
  const dijkstra = (a, b) => {
    const dist = new Array(N).fill(Infinity), done = new Array(N).fill(false);
    dist[a] = 0;
    for (;;) {
      let u = -1;
      for (let i = 0; i < N; i++) if (!done[i] && dist[i] < Infinity && (u < 0 || dist[i] < dist[u])) u = i;
      if (u < 0 || u === b) break;
      done[u] = true;
      for (const [v, c] of adj[u]) if (dist[u] + c < dist[v]) dist[v] = dist[u] + c;
    }
    return dist[b];
  };
  let found = 0;
  for (let k = 0; k < 200; k++) {
    const a = Math.floor(rnd() * N), b = Math.floor(rnd() * N);
    const want = dijkstra(a, b), r = NSK.route(a, b);
    if (want === Infinity) { assert.strictEqual(r, null); continue; }
    found++;
    // в маршруте время копится по отрезкам геометрии, а не по записанной длине ребра — сверяем длину пути по рёбрам
    assert.ok(r, 'путь должен найтись');
    assert.ok(r.pts.length >= 1);
    assert.ok(routeCost(r, a) <= want + 1e-6, `A* хуже перебора: ${routeCost(r, a)} > ${want}`);
  }
  assert.ok(found > 100, 'случайный граф должен быть в основном связным');
  // стоимость пути A* по тем же весам, что у перебора: восстанавливаем по узлам маршрута
  function routeCost(r, a) {
    const at = new Map();
    for (let i = 0; i < N; i++) at.set(nodes[i * 2] + ',' + nodes[i * 2 + 1], i);
    let cost = 0, u = a;
    for (let i = 1; i < r.pts.length; i++) {
      const v = at.get(r.pts[i][0] + ',' + r.pts[i][1]);
      let best = Infinity;
      for (const [w, c] of adj[u]) if (w === v && c < best) best = c;
      assert.ok(best < Infinity, 'маршрут идёт по несуществующему ребру');
      cost += best;
      u = v;
    }
    return cost;
  }
});

console.log(`\nвсе проверки пройдены: ${n}`);
