#!/usr/bin/env python3
"""Выгрузка OpenStreetMap (.osm / .osm.pbf) -> тайлы карты для игры.

  python3 osm2tiles.py <вход.osm.pbf> <папка_тайлов> [--bbox S,W,N,E]

Каждый тайл — квадрат TILE метров, файл t_<tx>_<ty>.js вида NSK.tile(tx, ty, {...}):
так карта грузится тегом <script> прямо с диска, без сервера (как и «Омут»).
Координаты внутри тайла — целые, шаг 0,5 м от левого верхнего угла тайла.

  b  здания   [вид, этажей, адрес|-1, x,y, x,y, ...]
  r  дороги   [класс, имя|-1, флаги(1 мост, 2 тоннель), x,y, ...]   (отрезаны по тайлу)
  l  рельсы   [вид(0 ж/д, 1 метро, 2 трамвай), флаги, x,y, ...]
  w  вода     [[внешнее кольцо], [дыра], ...]                        (отрезана по тайлу)
  g  зелень   [вид, [кольцо]]
  s  строки   таблица имён улиц и адресов этого тайла

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
RAIL = {'rail': 0, 'subway': 1, 'tram': 2, 'light_rail': 1}
GREEN = {'forest': 0, 'wood': 0, 'park': 1, 'garden': 1, 'grass': 2, 'meadow': 2, 'cemetery': 3,
         'allotments': 4, 'industrial': 5, 'sand': 6, 'beach': 6}
# Вид здания: 0 жилое многоэтажное, 1 частный дом, 2 общественное, 3 промышленное/гараж, 4 храм
BKIND = {'house': 1, 'detached': 1, 'hut': 1, 'cabin': 1, 'bungalow': 1,
         'industrial': 3, 'warehouse': 3, 'garage': 3, 'garages': 3, 'shed': 3, 'hangar': 3, 'service': 3,
         'church': 4, 'cathedral': 4, 'chapel': 4, 'mosque': 4, 'temple': 4,
         'school': 2, 'university': 2, 'hospital': 2, 'retail': 2, 'commercial': 2, 'office': 2,
         'public': 2, 'kindergarten': 2, 'train_station': 2, 'theatre': 2, 'civic': 2}


def proj(lat, lon):
    """Широта/долгота -> метры: x на восток, y на юг (как на экране)."""
    return (lon - LON0) * MX, (LAT0 - lat) * MY


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


def tiles_of(pts):
    xs = [p[0] for p in pts]
    ys = [p[1] for p in pts]
    for tx in range(int(min(xs) // TILE), int(max(xs) // TILE) + 1):
        for ty in range(int(min(ys) // TILE), int(max(ys) // TILE) + 1):
            yield tx, ty


class Tile:
    def __init__(self):
        self.b, self.r, self.l, self.w, self.g = [], [], [], [], []
        self.s, self.si = [], {}

    def name(self, text):
        if not text:
            return -1
        if text not in self.si:
            self.si[text] = len(self.s)
            self.s.append(text)
        return self.si[text]


class Builder(osmium.SimpleHandler):
    def __init__(self, bbox):
        super().__init__()
        self.S, self.W, self.N, self.E = bbox
        self.tiles = defaultdict(Tile)
        self.n = defaultdict(int)

    def inside(self, lat, lon):
        return self.S <= lat <= self.N and self.W <= lon <= self.E

    def pts(self, nodes):
        out, hit = [], False
        for n in nodes:
            if not n.location.valid():
                continue
            hit = hit or self.inside(n.location.lat, n.location.lon)
            out.append(proj(n.location.lat, n.location.lon))
        return out if hit else None

    @staticmethod
    def flat(pts, tx, ty):
        out = []
        for x, y in pts:
            out += [round((x - tx * TILE) * Q), round((y - ty * TILE) * Q)]
        return out

    def way(self, w):
        t = w.tags
        hw, rw = t.get('highway'), t.get('railway')
        if hw in ROAD:
            pts = self.pts(w.nodes)
            if pts and len(pts) > 1:
                fl = (1 if t.get('bridge') not in (None, 'no') else 0) | (2 if t.get('tunnel') not in (None, 'no') else 0)
                for tx, ty in tiles_of(pts):
                    x0, y0 = tx * TILE, ty * TILE
                    for part in clip_line(pts, x0, y0, x0 + TILE, y0 + TILE):
                        T = self.tiles[tx, ty]
                        T.r.append([ROAD[hw], T.name(t.get('name')), fl] + self.flat(part, tx, ty))
                self.n['roads'] += 1
        elif rw in RAIL and t.get('service') is None:
            pts = self.pts(w.nodes)
            if pts and len(pts) > 1:
                fl = (1 if t.get('bridge') not in (None, 'no') else 0) | (2 if t.get('tunnel') not in (None, 'no') else 0)
                for tx, ty in tiles_of(pts):
                    x0, y0 = tx * TILE, ty * TILE
                    for part in clip_line(pts, x0, y0, x0 + TILE, y0 + TILE):
                        self.tiles[tx, ty].l.append([RAIL[rw], fl] + self.flat(part, tx, ty))
                self.n['rails'] += 1

    def area(self, a):
        t = a.tags
        b = t.get('building')
        water = t.get('natural') == 'water' or t.get('waterway') == 'riverbank' or t.get('landuse') == 'reservoir'
        green = GREEN.get(t.get('landuse')) if t.get('landuse') in GREEN else GREEN.get(t.get('leisure'), GREEN.get(t.get('natural')))
        if not (b or water or green is not None):
            return
        rings = []  # (внешнее?, точки)
        hit = False
        for outer in a.outer_rings():
            o = self.pts(outer)
            if o is None:
                o = [proj(n.location.lat, n.location.lon) for n in outer if n.location.valid()]
            else:
                hit = True
            rings.append((True, o))
            for inner in a.inner_rings(outer):
                rings.append((False, [proj(n.location.lat, n.location.lon) for n in inner if n.location.valid()]))
        if not hit or not rings:
            return
        # кольца из OSM замкнуты (первая точка повторена в конце) — храним без повтора
        rings = [(o, r[:-1] if len(r) > 1 and r[0] == r[-1] else r) for o, r in rings]
        if b:
            pts = rings[0][1]
            if len(pts) < 3:
                return
            cx = sum(p[0] for p in pts) / len(pts)
            cy = sum(p[1] for p in pts) / len(pts)
            tx, ty = int(cx // TILE), int(cy // TILE)
            T = self.tiles[tx, ty]
            try:
                lv = int(float(t.get('building:levels', '0')))
            except ValueError:
                lv = 0
            kind = BKIND.get(b, 2 if t.get('amenity') or t.get('shop') else 0)
            addr = ''
            if t.get('addr:housenumber'):
                addr = (t.get('addr:street', '') + ', ' + t.get('addr:housenumber')).strip(', ')
            if t.get('name'):
                addr = (addr + ' | ' if addr else '| ') + t.get('name')
            T.b.append([kind, lv, T.name(addr)] + self.flat(pts, tx, ty))
            self.n['buildings'] += 1
            return
        for tx, ty in tiles_of([p for _, r in rings for p in r]):
            x0, y0 = tx * TILE, ty * TILE
            clipped = []
            for is_outer, r in rings:
                c = clip_poly(r, x0, y0, x0 + TILE, y0 + TILE)
                if len(c) >= 3:
                    clipped.append(self.flat(c, tx, ty))
                elif is_outer and water:
                    clipped.append(None)
            clipped = [c for c in clipped if c]
            if not clipped:
                continue
            if water:
                self.tiles[tx, ty].w.append(clipped)
            else:
                self.tiles[tx, ty].g.append([green, clipped[0]])
        self.n['water' if water else 'green'] += 1


def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    if len(args) != 2:
        sys.exit(__doc__)
    bbox = BBOX
    for a in sys.argv[1:]:
        if a.startswith('--bbox'):
            bbox = tuple(float(v) for v in (a.split('=', 1)[1] if '=' in a else sys.argv[sys.argv.index(a) + 1]).split(','))
    src, out = args
    os.makedirs(out, exist_ok=True)
    h = Builder(bbox)
    h.apply_file(src, locations=True)
    index = []
    for (tx, ty), T in sorted(h.tiles.items()):
        if not (T.b or T.r or T.l or T.w or T.g):
            continue
        body = json.dumps({'b': T.b, 'r': T.r, 'l': T.l, 'w': T.w, 'g': T.g, 's': T.s}, ensure_ascii=False, separators=(',', ':'))
        with open(os.path.join(out, f't_{tx}_{ty}.js'), 'w', encoding='utf-8') as f:
            f.write(f'NSK.tile({tx},{ty},{body});\n')
        index.append([tx, ty])
    with open(os.path.join(out, 'index.js'), 'w', encoding='utf-8') as f:
        meta = {'tile': TILE, 'q': Q, 'lat0': LAT0, 'lon0': LON0, 'bbox': list(bbox), 'tiles': index,
                'credit': '© участники OpenStreetMap (ODbL)'}
        f.write('NSK.index(' + json.dumps(meta, ensure_ascii=False, separators=(',', ':')) + ');\n')
    print('тайлов:', len(index), dict(h.n))


if __name__ == '__main__':
    main()
