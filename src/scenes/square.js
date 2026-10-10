// Глава 2. Площадь у Дома культуры «Водник». Пасмурный день, морось, жёлтые тополя.
(function () {
  const P = OM.P, S = OM.S, G = OM.G, A = OM.Actors;
  const { hex, rng, W, lerp } = OM;
  const say = (t) => OM.say('lev', t);
  const ssay = (t) => OM.say('sem', t);

  const st = { leaves: [], crows: [{ x: 640, hop: 0 }, { x: 702, hop: 0 }, { x: 735, hop: 0 }], speaker: 0 };

  // Пятиэтажка: панели, окна, балконы.
  function panelBlock(g, x, yb, w, floors, seed, base = '#8b949b') {
    const r = rng(seed);
    const fh = 26, h = floors * fh + 10;
    P.fillV(g, x, yb - h, w, h, [[0, base], [1, OM.Fig.shade(base, -0.12)]]);
    g.fillStyle = 'rgba(0,0,0,.08)';
    for (let px = x; px < x + w; px += 42) g.fillRect(px, yb - h, 1, h);
    for (let f = 0; f < floors; f++) {
      const y = yb - h + 10 + f * fh;
      g.fillStyle = 'rgba(0,0,0,.07)';
      g.fillRect(x, y - 2, w, 1);
      for (let wx = x + 8; wx < x + w - 14; wx += 21) {
        const lit = r() < 0.12;
        g.fillStyle = lit ? 'rgba(255,214,150,.55)' : `rgba(${50 + r() * 20},${62 + r() * 20},${72 + r() * 20},.85)`;
        g.fillRect(wx, y + 5, 11, 13);
        g.fillStyle = 'rgba(255,255,255,.18)';
        g.fillRect(wx, y + 5, 11, 1.2);
        if (r() < 0.25) {
          g.fillStyle = 'rgba(70,80,86,.9)';
          g.fillRect(wx - 3, y + 15, 17, 7);
          g.fillStyle = 'rgba(255,255,255,.12)';
          g.fillRect(wx - 3, y + 15, 17, 1);
        }
      }
    }
    g.fillStyle = OM.Fig.shade(base, -0.25);
    g.fillRect(x - 3, yb - h - 4, w + 6, 5);
  }

  // Тополь: ствол, ветви, гроздья жёлтой листвы.
  function poplar(g, x, yb, h, seed, o = {}) {
    const r = rng(seed);
    g.save();
    g.strokeStyle = o.bark || '#3e3a34';
    g.fillStyle = o.bark || '#3e3a34';
    g.lineCap = 'round';
    g.beginPath();
    g.moveTo(x - h * 0.03, yb);
    g.quadraticCurveTo(x - h * 0.012, yb - h * 0.5, x, yb - h * 0.95);
    g.lineTo(x + h * 0.004, yb - h * 0.95);
    g.quadraticCurveTo(x + h * 0.016, yb - h * 0.5, x + h * 0.03, yb);
    g.fill();
    for (let i = 0; i < 24; i++) {
      const y = yb - h * (0.3 + r() * 0.65);
      const sd = r() < 0.5 ? -1 : 1;
      g.lineWidth = 1 + r() * 2;
      g.beginPath();
      g.moveTo(x, y);
      g.quadraticCurveTo(x + sd * h * 0.05, y - h * 0.05, x + sd * h * (0.06 + r() * 0.08), y - h * (0.1 + r() * 0.1));
      g.stroke();
    }
    // листва — силуэт колонной, клочьями
    const cols = o.leaves || ['#b49a3e', '#9a8236', '#c9ae4c', '#7f7034', '#a68f3c'];
    for (let i = 0; i < (o.n || 260); i++) {
      const t = r();
      const y = yb - h * (0.32 + t * 0.68);
      const wid = h * 0.13 * Math.sin(Math.PI * (0.15 + t * 0.85)) * (o.wide || 1);
      if (r() < (o.sparse || 0.25)) continue;
      const lx = x + (r() - 0.5) * 2 * wid;
      g.fillStyle = hex(cols[(r() * cols.length) | 0], 0.75 + r() * 0.25);
      g.beginPath();
      g.ellipse(lx, y, 2.5 + r() * 4, 2 + r() * 3, r() * 3, 0, Math.PI * 2);
      g.fill();
    }
    g.restore();
  }

  function column(g, x, top, bot, w) {
    // каннелированная колонна с объёмом
    g.fillStyle = P.hgrad(g, x - w / 2, x + w / 2, [[0, '#9c958a'], [0.3, '#e2dccd'], [0.55, '#d4cdbd'], [1, '#867f73']]);
    g.fillRect(x - w / 2, top, w, bot - top);
    g.fillStyle = 'rgba(0,0,0,.08)';
    for (let k = -w / 2 + 4; k < w / 2 - 2; k += 5) g.fillRect(x + k, top + 10, 1.2, bot - top - 20);
    // капитель и база
    g.fillStyle = '#cfc8b8';
    g.fillRect(x - w / 2 - 6, top - 10, w + 12, 10);
    g.fillRect(x - w / 2 - 4, top, w + 8, 4);
    g.fillRect(x - w / 2 - 6, bot - 8, w + 12, 8);
    g.fillStyle = 'rgba(0,0,0,.18)';
    g.fillRect(x - w / 2 - 6, top - 1, w + 12, 1.5);
    g.fillRect(x - w / 2 - 6, bot - 1, w + 12, 1.5);
    // потёки
    g.fillStyle = 'rgba(80,70,50,.12)';
    g.fillRect(x - 3, top + 4, 3, (bot - top) * 0.6);
  }

  function paint(g) {
    // небо: низкая облачность
    P.fillV(g, 0, 0, W, 470, [[0, '#7f8b93'], [0.5, '#a1aaae'], [1, '#c2c5c1']]);
    P.clouds(g, 201, { y0: 20, y1: 260, n: 14, color: '#6c7880', a: 0.35, size: [160, 340], flat: 0.35 });
    P.clouds(g, 202, { y0: 60, y1: 330, n: 12, color: '#d4d6d2', a: 0.3, size: [140, 300], flat: 0.3 });
    // дальние пятиэтажки в дымке
    panelBlock(g, -20, 470, 260, 5, 5, '#9aa2a7');
    panelBlock(g, 1000, 470, 300, 5, 6, '#979fa4');
    g.fillStyle = 'rgba(190,196,196,.45)';
    g.fillRect(0, 300, W, 180);
    // водонапорная башня вдали
    g.fillStyle = 'rgba(96,104,108,.7)';
    g.beginPath();
    g.moveTo(1164, 470);
    g.lineTo(1172, 300);
    g.lineTo(1196, 300);
    g.lineTo(1204, 470);
    g.fill();
    P.rrect(g, 1152, 262, 64, 42, 4);
    g.fill();
    // тополя за ДК
    poplar(g, 300, 560, 400, 11, { n: 320 });
    poplar(g, 1040, 560, 380, 12, { n: 300 });
    poplar(g, 1215, 590, 430, 13, { n: 340 });
    g.fillStyle = 'rgba(190,196,196,.18)';
    g.fillRect(0, 160, W, 420);

    // ---- Дом культуры «Водник» ----
    const X0 = 360, X1 = 990, BASE = 566;
    // крылья
    P.fillV(g, X0, 268, X1 - X0, BASE - 268, [[0, '#c4a466'], [1, '#a88a52']]);
    P.speckle(g, 203, X0, 268, X1 - X0, BASE - 268, 4200, '#5a4a2a', 0.3);
    P.speckle(g, 204, X0, 268, X1 - X0, BASE - 268, 1500, '#f0e0b0', 0.2);
    // облупленная штукатурка — кирпич наружу
    const r = rng(205);
    for (let i = 0; i < 9; i++) {
      const px = X0 + 10 + r() * (X1 - X0 - 40), py = 300 + r() * 220, pw = 20 + r() * 40, ph = 10 + r() * 22;
      g.fillStyle = '#9a6a4a';
      g.beginPath();
      g.ellipse(px, py, pw / 2, ph / 2, r(), 0, Math.PI * 2);
      g.fill();
      g.strokeStyle = 'rgba(60,30,20,.35)';
      g.lineWidth = 0.8;
      for (let k = -ph / 2 + 3; k < ph / 2; k += 4) {
        g.beginPath();
        g.moveTo(px - pw / 2 + 3, py + k);
        g.lineTo(px + pw / 2 - 3, py + k);
        g.stroke();
      }
    }
    // влажный цоколь
    P.fillV(g, X0, BASE - 60, X1 - X0, 60, [[0, 'rgba(70,60,40,0)'], [1, 'rgba(70,60,40,.45)']]);
    g.fillStyle = '#8a8478';
    g.fillRect(X0 - 4, BASE - 22, X1 - X0 + 8, 22);
    // карниз
    P.fillV(g, X0 - 10, 252, X1 - X0 + 20, 18, [[0, '#e0d6c0'], [1, '#a89e88']]);
    g.fillStyle = 'rgba(0,0,0,.25)';
    g.fillRect(X0 - 10, 270, X1 - X0 + 20, 3);
    for (let x = X0 - 6; x < X1 + 6; x += 14) {
      g.fillStyle = '#cfc6b0';
      g.fillRect(x, 270, 7, 6);
    }
    // окна крыльев: высокие, с полуциркулем
    const winAt = (x) => {
      const wy = 330, ww = 46, wh = 150;
      g.fillStyle = '#d8ceb6';
      g.fillRect(x - 6, wy - 6, ww + 12, wh + 12);
      g.beginPath();
      g.arc(x + ww / 2, wy - 4, ww / 2 + 6, Math.PI, 0);
      g.fill();
      P.fillV(g, x, wy - ww / 2, ww, wh + ww / 2, [[0, '#8fa0aa'], [0.4, '#55656e'], [1, '#2e3a40']]);
      g.save();
      g.beginPath();
      g.rect(x, wy, ww, wh);
      g.arc(x + ww / 2, wy, ww / 2, Math.PI, 0);
      g.clip();
      P.fillV(g, x, wy - ww / 2, ww, wh + ww / 2, [[0, '#9aabb4'], [0.45, '#5d6d76'], [1, '#2a353b']]);
      g.fillStyle = 'rgba(255,255,255,.18)';
      g.beginPath();
      g.moveTo(x, wy + 20);
      g.lineTo(x + ww, wy - 10);
      g.lineTo(x + ww, wy + 10);
      g.lineTo(x, wy + 40);
      g.fill();
      g.restore();
      g.fillStyle = '#e4dccb';
      g.fillRect(x + ww / 2 - 1.5, wy - ww / 2, 3, wh + ww / 2);
      g.fillRect(x, wy + 50, ww, 3);
      g.fillRect(x, wy + 100, ww, 3);
      g.fillStyle = '#b8ae98';
      g.fillRect(x - 10, wy + wh + 6, ww + 20, 6);
    };
    [395, 455, 870, 930].forEach(winAt);
    // портик: ступени, колонны, фронтон
    const PX0 = 520, PX1 = 830;
    for (let i = 0; i < 4; i++) {
      P.fillV(g, PX0 - 30 - i * 10, BASE + 4 + i * 9, PX1 - PX0 + 60 + i * 20, 9, [[0, '#bdb6a6'], [1, '#8e877a']]);
      g.fillStyle = 'rgba(255,255,255,.15)';
      g.fillRect(PX0 - 30 - i * 10, BASE + 4 + i * 9, PX1 - PX0 + 60 + i * 20, 1);
    }
    g.fillStyle = '#7a6a4a';
    g.fillRect(PX0 - 10, 268, PX1 - PX0 + 20, BASE - 268);
    // двери главного входа в тени портика
    P.fillV(g, PX0 + 10, 268, PX1 - PX0 - 20, BASE - 268, [[0, '#3a3226'], [1, '#5a4e3a']]);
    [600, 676, 752].forEach((dx) => {
      P.fillV(g, dx - 26, 410, 52, 156, [[0, '#4a3020'], [1, '#2a1a10']]);
      g.strokeStyle = 'rgba(0,0,0,.4)';
      g.lineWidth = 2;
      g.strokeRect(dx - 22, 420, 20, 60);
      g.strokeRect(dx + 2, 420, 20, 60);
      g.strokeRect(dx - 22, 490, 20, 64);
      g.strokeRect(dx + 2, 490, 20, 64);
      g.fillStyle = '#c9a050';
      g.fillRect(dx - 4, 488, 2, 12);
      g.fillRect(dx + 2, 488, 2, 12);
      g.fillStyle = 'rgba(160,190,200,.25)';
      g.fillRect(dx - 24, 350, 48, 50);
    });
    // афиша у входа
    g.fillStyle = '#e8e0cc';
    g.fillRect(708, 452, 30, 42);
    g.fillStyle = '#a03a2a';
    g.fillRect(710, 456, 26, 8);
    g.fillStyle = 'rgba(30,30,30,.6)';
    for (let i = 0; i < 6; i++) g.fillRect(711, 468 + i * 4, 24 - (i % 3) * 5, 1.5);
    [PX0 + 6, 616, 734, PX1 - 6].forEach((x) => column(g, x, 282, BASE, 30));
    // антаблемент и фронтон со звездой и снопом
    P.fillV(g, PX0 - 26, 248, PX1 - PX0 + 52, 36, [[0, '#ece4d2'], [1, '#bcb39f']]);
    g.fillStyle = '#5a4630';
    P.text(g, 'ДОМ  КУЛЬТУРЫ  «ВОДНИК»', (PX0 + PX1) / 2, 267, { font: '700 17px "PT Serif",serif', color: '#5a4630', ls: 4 });
    g.fillStyle = '#e4dccb';
    g.beginPath();
    g.moveTo(PX0 - 34, 250);
    g.lineTo((PX0 + PX1) / 2, 172);
    g.lineTo(PX1 + 34, 250);
    g.fill();
    g.fillStyle = 'rgba(0,0,0,.12)';
    g.beginPath();
    g.moveTo(PX0 - 14, 246);
    g.lineTo((PX0 + PX1) / 2, 186);
    g.lineTo(PX1 + 14, 246);
    g.fill();
    // звезда
    const sx = (PX0 + PX1) / 2, sy = 222;
    g.fillStyle = '#b8a888';
    g.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? 7 : 16;
      g.lineTo(sx + Math.cos(a) * rr, sy + Math.sin(a) * rr);
    }
    g.fill();
    // колосья
    g.strokeStyle = '#b8a888';
    g.lineWidth = 2;
    [-1, 1].forEach((sd) => {
      g.beginPath();
      g.arc(sx, sy + 6, 30, sd > 0 ? -0.3 : Math.PI + 0.3, sd > 0 ? 0.9 : Math.PI - 0.9, sd < 0);
      g.stroke();
      for (let k = 0; k < 6; k++) {
        const a = (sd > 0 ? -0.2 : Math.PI + 0.2) + sd * k * 0.18;
        g.beginPath();
        g.ellipse(sx + Math.cos(a) * 30, sy + 6 + Math.sin(a) * 30, 2.5, 5, a, 0, Math.PI * 2);
        g.fill();
      }
    });
    // водосточные трубы
    [X0 + 4, X1 - 8].forEach((x) => {
      g.fillStyle = '#6a6a66';
      g.fillRect(x, 270, 6, BASE - 270);
      g.fillStyle = 'rgba(255,255,255,.2)';
      g.fillRect(x + 1, 270, 1.5, BASE - 270);
      for (let y = 300; y < BASE; y += 60) g.fillRect(x - 1, y, 8, 3);
    });
    // боковая дверь библиотеки
    const LX = 900, LY = 440;
    P.fillV(g, LX - 4, LY - 6, 72, 132, [[0, '#8a7656'], [1, '#6a5a40']]);
    P.fillV(g, LX, LY, 64, 126, [[0, '#5a3a24'], [1, '#3a2414']]);
    g.strokeStyle = 'rgba(0,0,0,.4)';
    g.lineWidth = 2;
    g.strokeRect(LX + 6, LY + 8, 52, 50);
    g.strokeRect(LX + 6, LY + 66, 52, 54);
    g.fillStyle = 'rgba(170,190,196,.35)';
    g.fillRect(LX + 10, LY + 12, 44, 42);
    g.fillStyle = '#c9a050';
    g.fillRect(LX + 50, LY + 70, 4, 14);
    g.fillStyle = '#26402e';
    g.fillRect(LX - 14, LY - 34, 92, 22);
    P.text(g, 'БИБЛИОТЕКА', LX + 32, LY - 23, { font: '700 10px "PT Serif",serif', color: '#e0d6b0', ls: 1 });
    g.fillStyle = 'rgba(0,0,0,.2)';
    g.fillRect(LX - 6, LY + 126, 76, 6);
    // часы работы
    g.fillStyle = '#e0d8c4';
    g.fillRect(LX + 70, LY + 40, 22, 28);
    g.fillStyle = 'rgba(30,30,30,.55)';
    for (let i = 0; i < 5; i++) g.fillRect(LX + 72, LY + 44 + i * 4.5, 18, 1.2);

    // ---- обелиск переселенцам ----
    const OX = 205;
    P.fillV(g, OX - 46, 560, 92, 30, [[0, '#7c7f80'], [1, '#5a5d5e']]);
    g.fillStyle = P.hgrad(g, OX - 26, OX + 26, [[0, '#5e6264'], [0.35, '#9ea2a2'], [1, '#4a4e50']]);
    g.beginPath();
    g.moveTo(OX - 26, 562);
    g.lineTo(OX - 15, 330);
    g.lineTo(OX, 300);
    g.lineTo(OX + 15, 330);
    g.lineTo(OX + 26, 562);
    g.fill();
    P.speckle(g, 206, OX - 26, 300, 52, 262, 500, '#2a2a2a', 0.35);
    g.fillStyle = '#4a4e4c';
    g.fillRect(OX - 18, 430, 36, 50);
    g.fillStyle = '#b8a070';
    P.text(g, 'ЖИТЕЛЯМ', OX, 442, { font: '700 6.5px "PT Serif",serif', color: '#c8b080' });
    P.text(g, 'СЕЛА', OX, 451, { font: '700 6.5px "PT Serif",serif', color: '#c8b080' });
    P.text(g, 'ПОКРОВСКОЕ', OX, 460, { font: '700 6px "PT Serif",serif', color: '#c8b080' });
    P.text(g, '1955', OX, 471, { font: '700 8px "PT Serif",serif', color: '#c8b080' });
    // гвоздики у подножия
    for (let i = 0; i < 7; i++) {
      const fx = OX - 22 + i * 7;
      g.strokeStyle = '#3a5a2a';
      g.lineWidth = 1;
      g.beginPath();
      g.moveTo(fx, 562);
      g.lineTo(fx + 6, 548 - (i % 3) * 3);
      g.stroke();
      g.fillStyle = i % 3 ? '#a8201a' : '#c83a2a';
      g.beginPath();
      g.arc(fx + 6, 547 - (i % 3) * 3, 2.8, 0, Math.PI * 2);
      g.fill();
    }

    // ---- столб с громкоговорителем и провода ----
    g.fillStyle = '#4a4640';
    g.fillRect(1006, 170, 7, 430);
    g.fillStyle = '#5a5850';
    g.beginPath();
    g.moveTo(1010, 196);
    g.lineTo(980, 182);
    g.lineTo(976, 206);
    g.lineTo(1010, 208);
    g.fill();
    g.fillStyle = '#2a2a28';
    g.beginPath();
    g.ellipse(978, 194, 5, 13, 0, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = 'rgba(40,40,40,.7)';
    g.lineWidth = 1.2;
    g.beginPath();
    g.moveTo(-10, 150);
    g.quadraticCurveTo(500, 210, 1010, 178);
    g.quadraticCurveTo(1150, 190, 1300, 168);
    g.stroke();
    g.beginPath();
    g.moveTo(-10, 162);
    g.quadraticCurveTo(500, 222, 1010, 186);
    g.stroke();

    // ---- доска объявлений ----
    g.fillStyle = '#4a3a2a';
    g.fillRect(1170, 440, 6, 160);
    g.fillRect(1262, 440, 6, 160);
    P.fillV(g, 1164, 420, 110, 96, [[0, '#6a5640'], [1, '#4a3a28']]);
    g.fillStyle = '#e9e2cf';
    g.fillRect(1172, 428, 46, 62);
    g.fillStyle = '#c42a1e';
    P.text(g, 'ВНИМАНИЕ!', 1195, 436, { font: '700 6.5px "PT Serif",serif', color: '#b02418' });
    g.fillStyle = 'rgba(30,30,30,.65)';
    for (let i = 0; i < 9; i++) g.fillRect(1175, 443 + i * 5, 40 - (i % 4) * 6, 1.4);
    g.fillStyle = '#d8d0a8';
    g.save();
    g.translate(1226, 432);
    g.rotate(0.05);
    g.fillRect(0, 0, 40, 30);
    g.fillStyle = 'rgba(30,30,30,.5)';
    for (let i = 0; i < 4; i++) g.fillRect(3, 5 + i * 6, 32, 1.3);
    g.restore();
    g.fillStyle = '#cfd6d8';
    g.fillRect(1224, 470, 44, 40);
    g.fillStyle = 'rgba(30,30,30,.5)';
    P.text(g, 'ПРОПАЛ', 1246, 476, { font: '700 6px "PT Serif",serif', color: '#222' });
    g.fillStyle = '#7a8890';
    g.fillRect(1236, 481, 20, 18);

    // ---- скамейка ----
    const BX = 1030;
    g.fillStyle = '#3a3a36';
    g.fillRect(BX + 6, 610, 6, 36);
    g.fillRect(BX + 150, 610, 6, 36);
    g.fillStyle = '#7a5a3a';
    for (let i = 0; i < 3; i++) g.fillRect(BX, 600 + i * 4, 164, 3);
    for (let i = 0; i < 3; i++) g.fillRect(BX, 560 + i * 9, 164, 6);
    g.fillStyle = '#3a3a36';
    g.fillRect(BX + 8, 556, 4, 50);
    g.fillRect(BX + 152, 556, 4, 50);
    // ведро и удочка
    P.fillV(g, BX + 168, 620, 22, 26, [[0, '#8a8e8a'], [1, '#5a5e5a']]);
    g.strokeStyle = '#5a5e5a';
    g.lineWidth = 1.2;
    g.beginPath();
    g.arc(BX + 179, 622, 11, Math.PI, 0);
    g.stroke();
    g.strokeStyle = '#6a5a3a';
    g.lineWidth = 2.2;
    g.beginPath();
    g.moveTo(BX + 150, 646);
    g.lineTo(BX + 120, 380);
    g.stroke();
    g.strokeStyle = 'rgba(200,200,200,.4)';
    g.lineWidth = 0.6;
    g.beginPath();
    g.moveTo(BX + 120, 380);
    g.quadraticCurveTo(BX + 112, 500, BX + 170, 626);
    g.stroke();

    // ---- брусчатка и плиты площади ----
    P.fillV(g, 0, 566, W, 154, [[0, '#7b7e7e'], [0.3, '#686b6b'], [1, '#4e5050']]);
    const rr = rng(207);
    for (let y = 580, k = 0; y < 720; k++) {
      const h = 10 + k * 3.5;
      g.fillStyle = 'rgba(0,0,0,.18)';
      g.fillRect(0, y, W, 1.2);
      const step = 60 + k * 18;
      for (let x = (k % 2) * step * 0.5; x < W; x += step) {
        g.fillRect(x, y, 1.2, h);
        if (rr() < 0.3) {
          g.fillStyle = `rgba(${rr() < 0.5 ? '0,0,0' : '255,255,255'},.05)`;
          g.fillRect(x + 2, y + 2, step - 4, h - 3);
          g.fillStyle = 'rgba(0,0,0,.18)';
        }
      }
      y += h;
    }
    // трещины
    g.strokeStyle = 'rgba(30,30,30,.35)';
    g.lineWidth = 0.8;
    for (let i = 0; i < 8; i++) {
      let x = rr() * W, y = 600 + rr() * 110;
      g.beginPath();
      g.moveTo(x, y);
      for (let k = 0; k < 5; k++) { x += (rr() - 0.5) * 30; y += rr() * 8; g.lineTo(x, y); }
      g.stroke();
    }
    // лужи — отражают небо и фасад
    [[640, 664, 150, 16], [300, 700, 110, 12], [960, 690, 90, 10]].forEach(([x, y, w, h]) => {
      g.save();
      g.beginPath();
      g.ellipse(x, y, w, h, 0, 0, Math.PI * 2);
      g.clip();
      P.fillV(g, x - w, y - h, w * 2, h * 2, [[0, '#b8bebe'], [1, '#8a9294']]);
      g.fillStyle = 'rgba(196,164,102,.4)';
      g.fillRect(x - w * 0.6, y - h, w * 0.9, h * 2);
      g.restore();
    });
    // опавшие листья
    for (let i = 0; i < 260; i++) {
      const x = rr() * W, y = 572 + Math.pow(rr(), 0.7) * 148;
      g.fillStyle = ['#c9a440', '#b8862e', '#8a6a2a', '#d8b850', '#9a5a26'][(rr() * 5) | 0];
      g.save();
      g.translate(x, y);
      g.rotate(rr() * 6);
      g.beginPath();
      g.ellipse(0, 0, 3 + rr() * 2.5, 1.5 + rr(), 0, 0, Math.PI * 2);
      g.fill();
      g.restore();
    }
    P.paper(g, 208, 0.06);
  }

  function front(g) {
    // кусты и ветка тополя в правом верхнем углу
    const r = rng(209);
    for (let i = 0; i < 140; i++) {
      const x = r() * 160, y = 640 + r() * 90;
      g.fillStyle = ['#3a4a2a', '#4a5a30', '#6a6a30', '#8a7a34'][(r() * 4) | 0];
      g.beginPath();
      g.ellipse(x, y, 6 + r() * 10, 4 + r() * 6, r() * 3, 0, Math.PI * 2);
      g.fill();
    }
  }

  function back(ctx, t) {
    // вороны на проводе
    st.crows.forEach((c, i) => {
      const x = c.x + Math.sin(t * 0.3 + i) * 0.5;
      const wy = 150 + ((x + 10) / 1020) * 28 + Math.sin(((x + 10) / 1020) * Math.PI) * 30;
      const hop = Math.max(0, Math.sin(t * 1.3 + i * 2.1)) > 0.995 ? -4 : 0;
      ctx.fillStyle = '#1a1a1c';
      ctx.beginPath();
      ctx.ellipse(x, wy - 6 + hop, 7, 4.5, -0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x + 6, wy - 10 + hop, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x + 8.5, wy - 10.5 + hop);
      ctx.lineTo(x + 12, wy - 9.5 + hop);
      ctx.lineTo(x + 8.5, wy - 8.5 + hop);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x - 6, wy - 5 + hop);
      ctx.lineTo(x - 12, wy - 1 + hop);
      ctx.lineTo(x - 5, wy - 3 + hop);
      ctx.fill();
    });
    // рябь в лужах
    for (let i = 0; i < 3; i++) {
      const k = (t * 0.6 + i / 3) % 1;
      ctx.strokeStyle = `rgba(230,236,236,${0.35 * (1 - k)})`;
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.ellipse(600 + i * 40, 664, 4 + k * 22, 1 + k * 3, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  function over(ctx, t, dt) {
    // падающие листья
    if (st.leaves.length < 22 && Math.random() < 0.05) st.leaves.push({ x: Math.random() * W, y: -10, v: 30 + Math.random() * 30, s: Math.random() * 6, c: ['#c9a440', '#b8862e', '#d8b850'][(Math.random() * 3) | 0] });
    st.leaves.forEach((l) => {
      l.y += l.v * 0.016;
      l.x += Math.sin(t * 1.5 + l.s) * 0.8 + 0.4;
      ctx.save();
      ctx.translate(l.x, l.y);
      ctx.rotate(t * 2 + l.s);
      ctx.scale(1, Math.abs(Math.sin(t * 3 + l.s)) * 0.8 + 0.2);
      ctx.fillStyle = l.c;
      ctx.beginPath();
      ctx.ellipse(0, 0, 4.5, 2.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
    st.leaves = st.leaves.filter((l) => l.y < 720);
    // лёгкая дымка у земли
    P.fogBand(ctx, t, 560, 90, 4, 0.12);
  }

  const sem = OM.actor({ id: 'sem', x: 1086, y: 646, s: 1.0, face: -1, autoScale: false, draw: (c, a, t) => A.semenych(c, a, t) });

  OM.scene('square', {
    name: 'Площадь',
    surface: 'wet',
    figLight: { amb: 0.95, tint: '#9aa4ab', side: -1 },
    amb: { rain: 0.25, wind: 0.45, drone: 0.08 },
    walk: [[30, 618], [1250, 618], [1250, 706], [30, 706]],
    depth: { y0: 618, s0: 0.94, y1: 706, s1: 1.06 },
    entries: {
      default: { x: 120, y: 660, face: 1 },
      hotel: { x: 50, y: 660, face: 1 },
      library: { x: 930, y: 628, face: 1 },
    },
    lights: [{ x: 640, y: -200, color: '#dfe6ea', a: 0.6, reach: 1600, rim: true }],
    rain: { n: 160, base: 0.12, ground: [600, 720], tint: '#d8e0e4' },
    actors: () => [sem],
    paint,
    front,
    back,
    over,
    hotspots: [
      { id: 'blocks', name: 'Пятиэтажки', rect: [0, 300, 250, 170], look: 'Пятиэтажки. На балконах сохнет бельё, которое в такую погоду не высохнет никогда.' },
      { id: 'tower', name: 'Водонапорная башня', rect: [1150, 250, 70, 220], look: 'Та самая башня. Днём она просто ржавая, а не зловещая.' },
      {
        id: 'monument', name: 'Обелиск', rect: [160, 296, 90, 300], walk: [230, 628], face: -1,
        look: async () => {
          await say('«Жителям села Покровское. 1955». Обелиск тем, кого переселили.');
          await say('Свежие гвоздики. Кто-то до сих пор приходит.');
          OM.flag('sawMonument', 1);
        },
      },
      { id: 'dk', name: 'Дом культуры «Водник»', rect: [360, 170, 630, 240], look: ['Дом культуры «Водник». Колонны, звезда, снопы. Штукатурка осыпается, как старая побелка с души.', 'Построили на месте, куда переселяли Покровское. Чтобы людям было куда ходить. Кроме дома.'] },
      {
        id: 'dkdoor', name: 'Главный вход', rect: [560, 400, 230, 166], walk: [676, 626], face: -1,
        look: 'Афиша: «Дискотека. Суббота. 20:00. Вход 2000 р.». Главные двери заперты на висячий замок.',
        use: () => say('Заперто. Библиотека — сбоку, там отдельный вход.'),
      },
      { id: 'speaker', name: 'Громкоговоритель', rect: [960, 170, 60, 50], look: () => speaker() },
      {
        id: 'board', name: 'Доска объявлений', rect: [1160, 418, 116, 100], walk: [1210, 626], face: 1,
        look: async () => {
          await say('«Внимание! 10 октября с 15:00 до 18:00 плановое отключение электроэнергии. Горэлектросеть».');
          await say('Ниже — «Пропал человек». Мужчина, рыболов, ушёл на водохранилище три недели назад.');
          OM.flag('knowOutage', 1);
        },
      },
      { id: 'bench', name: 'Скамейка', rect: [1026, 552, 170, 60], look: 'Скамейка. Пол-скамейки занимает Семёныч, вторую половину — его ведро.' },
      {
        id: 'sem', name: 'Семёныч', rect: () => [sem.x - 50, sem.y - 150, 100, 150], walk: [990, 650], face: 1,
        look: async () => {
          await say('Старик в ватнике и ушанке. Удочка, ведро, сапоги — рыбак до мозга костей.');
          await say('На поясе болтается фонарик-«жучок». Такой, что жмёшь — и он жужжит и светит.');
          OM.flag('sawZhuchok', 1);
        },
        use: () => OM.story2.talkSem(),
        items: {
          book: () => OM.story2.sell(),
          zhuchok: () => OM.say('sem', 'Чего вертишь? Твой теперь. Береги — он ещё моего отца помнит.'),
        },
      },
      { id: 'crows', name: 'Вороны', rect: [600, 120, 160, 50], look: 'Три вороны на проводе. Смотрят на площадь, как на телевизор.' },
      {
        id: 'libdoor', name: 'Библиотека', rect: [892, 404, 80, 166], walk: [930, 626],
        exit: { to: 'library', entry: 'door', dir: 'up' },
      },
      { id: 'exitL', name: 'К гостинице', rect: [0, 560, 34, 160], walk: [16, 664], exit: { to: 'lobby2', entry: 'door', dir: 'left' } },
    ],
    update(dt, t) {
      st.speaker = Math.max(0, st.speaker - dt);
    },
    async enter(entry) {
      if (!OM.flag('squareSeen')) {
        OM.flag('squareSeen', 1);
        await OM.wait(300);
        await say('Днём Тихий Омут выглядит почти обыкновенно. Почти.');
      }
    },
  });

  async function speaker() {
    S.staticNoise(1.2, 0.06);
    await OM.say('radio', '…внимание. Горэлектросеть сообщает: сегодня с пятнадцати ноль-ноль плановое отключение электроэнергии…', { hold: 1.4 });
    await say('Радиоточка на столбе. Как в детстве. Только новости другие.');
    OM.flag('knowOutage', 1);
  }
})();
