#!/usr/bin/env python3
"""Выгрузка OpenStreetMap (.osm / .osm.pbf) -> данные карты для игры «Час разницы».

  python3 osm2tiles.py <вход.osm.pbf> <папка_данных> [--bbox=S,W,N,E]

Всё пишется .js-файлами вида NSK.xxx({...}): карта грузится тегом <script> прямо с диска,
без сервера (как и «Омут»). Система координат — метры от площади Ленина: x на восток, y на юг.

tiles/t_<tx>_<ty>.js — NSK.tile(tx, ty, {...}), квадрат TILE метров. Координаты внутри тайла —
целые, шаг 0,5 м от левого верхнего угла тайла:
  b  здания   [вид, этажей, адрес|-1, назначение, x,y, ...]
  r  дороги   [класс, имя|-1, флаги(1 мост, 2 тоннель), x,y, ...]   (отрезаны по тайлу)
  l  рельсы   [вид(0 ж/д, 1 метро, 2 трамвай), флаги, x,y, ...]
  v  реки     [вид(0 река, 1 ручей/канал), имя|-1, x,y, ...]        (линии)
  w  вода     [[внешнее кольцо], [остров], ...]                      (отрезана по тайлу)
  g  зелень   [вид, [кольцо]]
  p  точки    [вид, назначение/ранг, имя|-1, x, y]
              вид: 0 станция метро, 1 ж/д станция, 2 название места (ранг 0 район, 1 микрорайон,
              2 урочище/остров), 3 заведение, 4 памятник/достопримечательность, 5 вход в метро
  s  строки   таблица имён этого тайла

index.js  — NSK.index: размеры, список тайлов, осевые линии рек (для «какой берег»).
graph.js  — NSK.graph: граф улиц для маршрутов. nodes — [x,y,...] в метрах; edges —
            [узел_а, узел_б, длина_м, класс, флаги, имя|-1, dx,dy, ...] (промежуточные точки от узла_а).
bounds.js — NSK.bounds: границы города и районов [уровень, имя, [кольцо в метрах], ...].

Данные © участники OpenStreetMap, лицензия ODbL.
"""
import json
import math
import os
import sys
from collections import defaultdict

import osmium

# Новосибирск целиком: от ОбьГЭС и Академгородка до Пашино.
BBOX = (54.79, 82.74, 55.20, 83.20)  # S, W, N, E
LAT0, LON0 = 55.03, 82.92            # начало координат — площадь Ленина
TILE = 1024                          # метров
Q = 2                                # делений на метр (шаг 0,5 м)

MX = 111320.0 * math.cos(math.radians(LAT0))
MY = 110574.0

ROAD = {
    'motorway': 0, 'trunk': 0, 'motorway_link': 0, 'trunk_link': 0,
    'primary': 1, 'primary_link': 1, 'secondary': 2, 'secondary_link': 2,
    'tertiary': 3, 'tertiary_link': 3, 'unclassified': 4, 'residential': 4, 'living_street': 4,
    'service': 5, 'pedestrian': 6, 'footway': 7, 'path': 7, 'steps': 7, 'cycleway': 7, 'track': 8,
}
GRAPH_MAX = 6  # в граф маршрутов идут классы 0..6 (всё, по чему ходят и ездят вдоль улиц)
RAIL = {'rail': 0, 'subway': 1, 'tram': 2, 'light_rail': 1}
GREEN = {'forest': 0, 'wood': 0, 'park': 1, 'garden': 1, 'grass': 2, 'meadow': 2, 'cemetery': 3,
         'allotments': 4, 'industrial': 5, 'sand': 6, 'beach': 6}
# Вид здания: 0 жилое многоэтажное, 1 частный дом, 2 общественное, 3 промышленное/гараж, 4 храм
BKIND = {'house': 1, 'detached': 1, 'hut': 1, 'cabin': 1, 'bungalow': 1,
         'industrial': 3, 'warehouse': 3, 'garage': 3, 'garages': 3, 'shed': 3, 'hangar': 3, 'service': 3,
         'church': 4, 'cathedral': 4, 'chapel': 4, 'mosque': 4, 'temple': 4,
         'school': 2, 'university': 2, 'hospital': 2, 'retail': 2, 'commercial': 2, 'office': 2,
         'public': 2, 'kindergarten': 2, 'train_station': 2, 'theatre': 2, 'civic': 2}
# Назначение: 0 нет, 1 школа/сад, 2 медицина, 3 магазин, 4 еда, 5 культура, 6 храм, 7 транспорт,
#             8 учреждение, 9 вуз, 10 спорт, 11 гостиница
AMEN = {'school': 1, 'kindergarten': 1, 'hospital': 2, 'clinic': 2, 'pharmacy': 2, 'doctors': 2,
        'marketplace': 3, 'cafe': 4, 'restaurant': 4, 'bar': 4, 'fast_food': 4, 'pub': 4, 'canteen': 4,
        'theatre': 5, 'cinema': 5, 'library': 5, 'arts_centre': 5, 'planetarium': 5, 'circus': 5,
        'place_of_worship': 6, 'bus_station': 7, 'ferry_terminal': 7,
        'post_office': 8, 'bank': 8, 'townhall': 8, 'police': 8, 'courthouse': 8, 'fire_station': 8,
        'university': 9, 'college': 9}
PLACE = {'suburb': 0, 'neighbourhood': 1, 'quarter': 1, 'locality': 2, 'island': 2, 'islet': 2}


def proj(lat, lon):
    """Широта/долгота -> метры: x на восток, y на юг (как на экране)."""
    return (lon - LON0) * MX, (LAT0 - lat) * MY


def use_of(t):
    a = t.get('amenity')
    if a in AMEN:
        return AMEN[a]
    if t.get('shop'):
        return 3
    if t.get('tourism') in ('museum', 'gallery', 'zoo'):
        return 5
    if t.get('tourism') in ('hotel', 'hostel'):
        return 11
    if t.get('leisure') in ('sports_centre', 'stadium', 'ice_rink', 'swimming_pool', 'fitness_centre'):
        return 10
    if t.get('office'):
        return 8
    return 0


def clip_poly(ring, x0, y0, x1, y1):
    """Сазерленд — Ходжман: кольцо, обрезанное прямоугольником."""
    def cut(pts, inside, cross):
        out = []
        for i in range(len(pts)):
            a, b = pts[i - 1], pts[i]
            ia, ib = inside(a), inside(b)
            if ia != ib:
                out.append(cross(a, b))
            if ib:
                out.append(b)
        return out

    def cx(v):
        return lambda a, b: (v, a[1] + (b[1] - a[1]) * (v - a[0]) / (b[0] - a[0]))

    def cy(v):
        return lambda a, b: (a[0] + (b[0] - a[0]) * (v - a[1]) / (b[1] - a[1]), v)

    pts = ring
    for inside, cross in ((lambda p: p[0] >= x0, cx(x0)), (lambda p: p[0] <= x1, cx(x1)),
                          (lambda p: p[1] >= y0, cy(y0)), (lambda p: p[1] <= y1, cy(y1))):
        if not pts:
            break
        pts = cut(pts, inside, cross)
    return pts


def clip_seg(a, b, x0, y0, x1, y1):
    """Лян — Барски: отрезок внутри прямоугольника или None."""
    t0, t1 = 0.0, 1.0
    dx, dy = b[0] - a[0], b[1] - a[1]
    for p, q in ((-dx, a[0] - x0), (dx, x1 - a[0]), (-dy, a[1] - y0), (dy, y1 - a[1])):
        if p == 0:
            if q < 0:
                return None
            continue
        t = q / p
        if p < 0:
            if t > t1:
                return None
            t0 = max(t0, t)
        else:
            if t < t0:
                return None
            t1 = min(t1, t)
    return (a[0] + dx * t0, a[1] + dy * t0), (a[0] + dx * t1, a[1] + dy * t1)


def clip_line(pts, x0, y0, x1, y1):
    """Ломаная -> куски внутри прямоугольника."""
    parts, cur = [], []
    for i in range(len(pts) - 1):
        s = clip_seg(pts[i], pts[i + 1], x0, y0, x1, y1)
        if not s:
            if len(cur) > 1:
                parts.append(cur)
            cur = []
            continue
        if cur and cur[-1] == s[0]:
            cur.append(s[1])
        else:
            if len(cur) > 1:
                parts.append(cur)
            cur = [s[0], s[1]]
    if len(cur) > 1:
        parts.append(cur)
    return parts


def simplify(pts, eps):
    """Дуглас — Пекер."""
    if len(pts) < 3:
        return pts
    keep = [False] * len(pts)
    keep[0] = keep[-1] = True
    stack = [(0, len(pts) - 1)]
    while stack:
        i, j = stack.pop()
        ax, ay = pts[i]
        dx, dy = pts[j][0] - ax, pts[j][1] - ay
        d2 = dx * dx + dy * dy
        best, bi = 0.0, -1
        for k in range(i + 1, j):
            px, py = pts[k][0] - ax, pts[k][1] - ay
            t = 0.0 if d2 == 0 else max(0.0, min(1.0, (px * dx + py * dy) / d2))
            d = math.hypot(px - t * dx, py - t * dy)
            if d > best:
                best, bi = d, k
        if best > eps:
            keep[bi] = True
            stack += [(i, bi), (bi, j)]
    return [p for p, k in zip(pts, keep) if k]


def open_ring(r):
    """Кольца из OSM замкнуты (первая точка повторена в конце) — храним без повтора."""
    return r[:-1] if len(r) > 1 and r[0] == r[-1] else r


def flat(pts, ox=0.0, oy=0.0, q=Q):
    """Точки -> плоский список целых, подряд идущие совпадения выброшены."""
    out = []
    for x, y in pts:
        a, b = round((x - ox) * q), round((y - oy) * q)
        if len(out) >= 2 and out[-2] == a and out[-1] == b:
            continue
        out += [a, b]
    return out


class Tile:
    def __init__(self):
        self.b, self.r, self.l, self.v, self.w, self.g, self.p = [], [], [], [], [], [], []
        self.s, self.si = [], {}

    def name(self, text):
        if not text:
            return -1
        if text not in self.si:
            self.si[text] = len(self.s)
            self.s.append(text)
        return self.si[text]

    def empty(self):
        return not (self.b or self.r or self.l or self.v or self.w or self.g or self.p)


class Builder(osmium.SimpleHandler):
    def __init__(self, bbox):
        super().__init__()
        self.S, self.W, self.N, self.E = bbox
        x0, y0 = proj(self.N, self.W)
        x1, y1 = proj(self.S, self.E)
        self.tx0, self.tx1 = int(x0 // TILE), int(x1 // TILE)
        self.ty0, self.ty1 = int(y0 // TILE), int(y1 // TILE)
        self.tiles = defaultdict(Tile)
        self.n = defaultdict(int)
        self.gways = []                    # дороги для графа: (класс, флаги, имя, [(узел, x, y)])
        self.rivers = defaultdict(list)    # имя -> ломаные
        self.bounds = []                   # [уровень, имя, кольца...]

    def inside(self, lat, lon):
        return self.S <= lat <= self.N and self.W <= lon <= self.E

    def in_rect(self, x, y, pad=0.0):
        return (self.tx0 * TILE - pad <= x <= (self.tx1 + 1) * TILE + pad
                and self.ty0 * TILE - pad <= y <= (self.ty1 + 1) * TILE + pad)

    def tiles_of(self, pts):
        xs = [p[0] for p in pts]
        ys = [p[1] for p in pts]
        for tx in range(max(self.tx0, int(min(xs) // TILE)), min(self.tx1, int(max(xs) // TILE)) + 1):
            for ty in range(max(self.ty0, int(min(ys) // TILE)), min(self.ty1, int(max(ys) // TILE)) + 1):
                yield tx, ty

    def tile_rings(self, ring):
        """Кольцо -> {(tx, ty): кольцо, обрезанное по тайлу}. Сначала режем на вертикальные полосы:
        так Обь и водохранилище (десятки тысяч точек) не перебираются заново для каждого тайла."""
        out = {}
        if len(ring) < 3:
            return out
        xs = [p[0] for p in ring]
        for tx in range(max(self.tx0, int(min(xs) // TILE)), min(self.tx1, int(max(xs) // TILE)) + 1):
            strip = clip_poly(ring, tx * TILE, -1e9, (tx + 1) * TILE, 1e9)
            if len(strip) < 3:
                continue
            ys = [p[1] for p in strip]
            for ty in range(max(self.ty0, int(min(ys) // TILE)), min(self.ty1, int(max(ys) // TILE)) + 1):
                c = clip_poly(strip, tx * TILE, ty * TILE, (tx + 1) * TILE, (ty + 1) * TILE)
                if len(c) >= 3:
                    out[tx, ty] = c
        return out

    def line(self, nodes):
        """Узлы линии -> ([(узел, x, y)], задевает ли область)."""
        out, hit = [], False
        for n in nodes:
            if not n.location.valid():
                continue
            lat, lon = n.location.lat, n.location.lon
            hit = hit or self.inside(lat, lon)
            x, y = proj(lat, lon)
            out.append((n.ref, x, y))
        return out, hit

    def put_line(self, layer, head, pts, named=None):
        for tx, ty in self.tiles_of(pts):
            x0, y0 = tx * TILE, ty * TILE
            for part in clip_line(pts, x0, y0, x0 + TILE, y0 + TILE):
                T = self.tiles[tx, ty]
                h = list(head)
                if named is not None:
                    h[named[0]] = T.name(named[1])
                f = flat(part, x0, y0)
                if len(f) >= 4:
                    getattr(T, layer).append(h + f)

    # ---------- точки ----------
    def node(self, n):
        t = n.tags
        if not len(t) or not n.location.valid():
            return
        lat, lon = n.location.lat, n.location.lon
        if not self.inside(lat, lon):
            return
        name = t.get('name')
        rw = t.get('railway')
        if rw in ('station', 'halt'):
            kind, use = (0 if t.get('station') == 'subway' or t.get('subway') == 'yes' else 1), 7
        elif rw == 'subway_entrance':
            kind, use = 5, 7
        elif t.get('place') in PLACE and name:
            kind, use = 2, PLACE[t.get('place')]
        elif name and (t.get('historic') in ('monument', 'memorial') or t.get('tourism') in ('attraction', 'viewpoint', 'artwork')):
            kind, use = 4, 5
        elif name and use_of(t):
            kind, use = 3, use_of(t)
        else:
            return
        x, y = proj(lat, lon)
        tx, ty = int(x // TILE), int(y // TILE)
        T = self.tiles[tx, ty]
        T.p.append([kind, use, T.name(name), round((x - tx * TILE) * Q), round((y - ty * TILE) * Q)])
        self.n['points'] += 1

    # ---------- линии ----------
    def way(self, w):
        t = w.tags
        hw, rw, ww = t.get('highway'), t.get('railway'), t.get('waterway')
        if hw not in ROAD and rw not in RAIL and ww not in ('river', 'stream', 'canal'):
            return
        nodes, hit = self.line(w.nodes)
        if not hit or len(nodes) < 2:
            return
        pts = [(x, y) for _, x, y in nodes]
        fl = (1 if t.get('bridge') not in (None, 'no') else 0) | (2 if t.get('tunnel') not in (None, 'no') else 0)
        if hw in ROAD:
            if t.get('area') == 'yes':
                return
            self.put_line('r', [ROAD[hw], -1, fl], pts, named=(1, t.get('name')))
            if ROAD[hw] <= GRAPH_MAX:
                self.gways.append((ROAD[hw], fl, t.get('name'), nodes))
            self.n['roads'] += 1
        elif rw in RAIL:
            if t.get('service') is None:
                self.put_line('l', [RAIL[rw], fl], pts)
                self.n['rails'] += 1
        else:
            self.put_line('v', [0 if ww == 'river' else 1, -1], pts, named=(1, t.get('name')))
            if ww == 'river' and t.get('name'):
                self.rivers[t.get('name')].append(flat(simplify(pts, 3.0), q=1))
            self.n['waterways'] += 1

    # ---------- площади ----------
    def area(self, a):
        t = a.tags
        b = t.get('building')
        water = t.get('natural') == 'water' or t.get('waterway') == 'riverbank' or t.get('landuse') in ('reservoir', 'basin')
        green = GREEN.get(t.get('landuse'), GREEN.get(t.get('leisure'), GREEN.get(t.get('natural'))))
        bound = t.get('boundary') == 'administrative' and t.get('admin_level') in ('6', '8', '9', '10') and t.get('name')
        if not (b or water or green is not None or bound):
            return
        groups, hit = [], False  # [(внешнее кольцо, [дыры])]
        for outer in a.outer_rings():
            o = []
            for n in outer:
                if n.location.valid():
                    lat, lon = n.location.lat, n.location.lon
                    hit = hit or self.inside(lat, lon)
                    o.append(proj(lat, lon))
            inners = [open_ring([proj(n.location.lat, n.location.lon) for n in inner if n.location.valid()])
                      for inner in a.inner_rings(outer)]
            groups.append((open_ring(o), inners))
        if not groups:
            return
        if bound:
            if hit:
                rings = [flat(simplify(o + o[:1], 15.0)[:-1], q=1) for o, _ in groups if len(o) >= 3]
                self.bounds.append([int(t.get('admin_level')), t.get('name')] + rings)
                self.n['bounds'] += 1
            return
        if b:
            pts = groups[0][0]
            if len(pts) < 3:
                return
            cx = sum(p[0] for p in pts) / len(pts)
            cy = sum(p[1] for p in pts) / len(pts)
            tx, ty = int(cx // TILE), int(cy // TILE)
            if not (self.tx0 <= tx <= self.tx1 and self.ty0 <= ty <= self.ty1):
                return
            T = self.tiles[tx, ty]
            try:
                lv = int(float(t.get('building:levels', '0')))
            except ValueError:
                lv = 0
            use = use_of(t)
            kind = BKIND.get(b, 2 if use else 0)
            addr = ''
            if t.get('addr:housenumber'):
                addr = (t.get('addr:street', '') + ', ' + t.get('addr:housenumber')).strip(', ')
            if t.get('name'):
                addr = (addr + ' | ' if addr else '| ') + t.get('name')
            f = flat(pts, tx * TILE, ty * TILE)
            if len(f) >= 6:
                T.b.append([kind, lv, T.name(addr), use] + f)
                self.n['buildings'] += 1
            return
        for o, inners in groups:
            cut = self.tile_rings(o)
            if not cut:
                continue
            holes = defaultdict(list)
            if water:
                for inner in inners:
                    for key, c in self.tile_rings(inner).items():
                        holes[key].append(c)
            for (tx, ty), c in cut.items():
                x0, y0 = tx * TILE, ty * TILE
                f = flat(c, x0, y0)
                if len(f) < 6:
                    continue
                if water:
                    self.tiles[tx, ty].w.append([f] + [flat(h, x0, y0) for h in holes.get((tx, ty), [])])
                else:
                    self.tiles[tx, ty].g.append([green, f])
        self.n['water' if water else 'green'] += 1

    # ---------- граф улиц ----------
    def graph(self):
        use = defaultdict(int)
        for _, _, _, nodes in self.gways:
            for i, (ref, _, _) in enumerate(nodes):
                use[ref] += 2 if i in (0, len(nodes) - 1) else 1
        ids, coords, edges, names, ni = {}, [], [], [], {}

        def nid(ref, x, y):
            if ref not in ids:
                ids[ref] = len(coords) // 2
                coords.extend((round(x), round(y)))
            return ids[ref]

        for cls, fl, name, nodes in self.gways:
            start = 0
            for i in range(1, len(nodes)):
                if use[nodes[i][0]] < 2 and i != len(nodes) - 1:
                    continue
                seg = nodes[start:i + 1]
                start = i
                if not (self.in_rect(seg[0][1], seg[0][2], 500) or self.in_rect(seg[-1][1], seg[-1][2], 500)):
                    continue
                length = sum(math.hypot(seg[k + 1][1] - seg[k][1], seg[k + 1][2] - seg[k][2]) for k in range(len(seg) - 1))
                a, bn = nid(*seg[0]), nid(*seg[-1])
                ax, ay = coords[a * 2], coords[a * 2 + 1]
                mid = []
                for _, x, y in simplify([(x, y) for _, x, y in seg], 1.0)[1:-1]:
                    mid += [round(x) - ax, round(y) - ay]
                if name and name not in ni:
                    ni[name] = len(names)
                    names.append(name)
                edges.append([a, bn, max(1, round(length)), cls, fl, ni.get(name, -1)] + mid)
        return {'nodes': coords, 'edges': edges, 'names': names}


def dump(path, call, obj):
    with open(path, 'w', encoding='utf-8') as f:
        f.write(call + '(' + json.dumps(obj, ensure_ascii=False, separators=(',', ':')) + ');\n')


def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    if len(args) != 2:
        sys.exit(__doc__)
    bbox = BBOX
    for a in sys.argv[1:]:
        if a.startswith('--bbox='):
            bbox = tuple(float(v) for v in a.split('=', 1)[1].split(','))
    src, out = args
    os.makedirs(os.path.join(out, 'tiles'), exist_ok=True)
    h = Builder(bbox)
    h.apply_file(src, locations=True)
    index = []
    for (tx, ty), T in sorted(h.tiles.items()):
        if T.empty():
            continue
        body = json.dumps({'b': T.b, 'r': T.r, 'l': T.l, 'v': T.v, 'w': T.w, 'g': T.g, 'p': T.p, 's': T.s},
                          ensure_ascii=False, separators=(',', ':'))
        with open(os.path.join(out, 'tiles', f't_{tx}_{ty}.js'), 'w', encoding='utf-8') as f:
            f.write(f'NSK.tile({tx},{ty},{body});\n')
        index.append([tx, ty])
    dump(os.path.join(out, 'index.js'), 'NSK.index', {
        'tile': TILE, 'q': Q, 'lat0': LAT0, 'lon0': LON0, 'bbox': list(bbox),
        'range': [h.tx0, h.ty0, h.tx1, h.ty1], 'tiles': index,
        'rivers': h.rivers, 'credit': '© участники OpenStreetMap (ODbL)'})
    g = h.graph()
    dump(os.path.join(out, 'graph.js'), 'NSK.graph', g)
    dump(os.path.join(out, 'bounds.js'), 'NSK.bounds', h.bounds)
    with open(os.path.join(out, 'LICENSE.txt'), 'w', encoding='utf-8') as f:
        f.write('Данные карты © участники OpenStreetMap, распространяются по лицензии\n'
                'Open Database License (ODbL) 1.0: https://www.openstreetmap.org/copyright\n')
    print('тайлов:', len(index), dict(h.n), 'узлов графа:', len(g['nodes']) // 2, 'рёбер:', len(g['edges']))


if __name__ == '__main__':
    main()
