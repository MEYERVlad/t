// Глава 5. Изнанка: Покровское 14 октября 1955 года — и то же место сейчас, на дне водохранилища.
// Два мира на одном месте: что закрыто в одном, открыто в другом. В «сейчас» нечем дышать.
// Утонувшим нужно вернуть имена: смотреть в лицо, пока не проступит, и назвать по списку.
(function () {
  const P = OM.P, S = OM.S, G = OM.G, A = OM.Actors;
  const { hex, rng, W, H, lerp, clamp } = OM;
  const TAU = Math.PI * 2;
  const say = (t, o) => OM.say('lev', t, o);
  const GATE = 1086, ROPE = { x: 936, y: 300 }, BOAT = { x: 560, y: 650 }, DOOR = { x: 1188, y: 520 };
  const st = { world: 'past', breath: 1, flipping: false, failing: false, gaze: null, dark: null, ring: 0 };

  // ---------- Прошлое: село под водой, но живое ----------
  function izba(g, x0, x1, base, top, o = {}) {
    const r = rng(x0 * 3 + 7);
    for (let y = top; y < base; y += 12) {
      P.fillV(g, x0, y, x1 - x0, 12, [[0, o.log || '#5a4632'], [0.5, '#3e3022'], [1, '#221a12']]);
      g.fillStyle = 'rgba(0,0,0,.3)';
      g.fillRect(x0, y + 10.5, x1 - x0, 1.5);
      for (const ex of [x0 - 6, x1 - 6]) {
        g.fillStyle = '#6a5440';
        g.beginPath(); g.ellipse(ex + 6, y + 6, 6.5, 6, 0, 0, TAU); g.fill();
      }
      if (r() < 0.6) { g.fillStyle = 'rgba(0,0,0,.15)'; g.fillRect(x0 + r() * (x1 - x0), y + 4, 20 + r() * 30, 1); }
    }
    g.fillStyle = o.roof || '#2a2420';
    g.beginPath();
    g.moveTo(x0 - 22, top + 4); g.lineTo((x0 + x1) / 2, top - 84); g.lineTo(x1 + 22, top + 4);
    g.fill();
    g.fillStyle = '#4a3a2a';
    g.beginPath();
    g.moveTo(x0 + 10, top); g.lineTo((x0 + x1) / 2, top - 70); g.lineTo(x1 - 10, top);
    g.fill();
    // резное «полотенце» на фронтоне
    g.fillStyle = o.carve || '#d8ccb0';
    g.fillRect((x0 + x1) / 2 - 3, top - 70, 6, 40);
    for (let i = 0; i < 4; i++) { g.beginPath(); g.arc((x0 + x1) / 2, top - 30 + i * 5, 4 - i * 0.6, 0, TAU); g.fill(); }
    // окна с наличниками
    const n = Math.max(1, Math.floor((x1 - x0) / 90));
    for (let i = 0; i < n; i++) {
      const wx = x0 + (x1 - x0) * (i + 0.5) / n - 20, wy = top + 30;
      P.window(g, wx, wy, 40, 52, { lit: '#ffc070', curtain: '#a04030', a: 0.9, frame: '#1a120c', ft: 3 });
      g.fillStyle = o.carve || '#d8ccb0';
      g.beginPath();
      g.moveTo(wx - 10, wy - 4); g.lineTo(wx + 20, wy - 20); g.lineTo(wx + 50, wy - 4); g.lineTo(wx + 50, wy - 1); g.lineTo(wx - 10, wy - 1);
      g.fill();
      g.fillRect(wx - 10, wy + 54, 60, 5);
      g.fillRect(wx - 7, wy - 2, 3, 56);
      g.fillRect(wx + 44, wy - 2, 3, 56);
    }
    // труба
    g.fillStyle = '#5a4a40';
    g.fillRect(x1 - 60, top - 76, 16, 50);
  }
  function fence(g, x0, x1, y, h, col = '#4a3a2a', gap = null) {
    for (let x = x0; x < x1; x += 10) {
      if (gap && x > gap[0] && x < gap[1]) continue;
      g.fillStyle = col;
      g.beginPath();
      g.moveTo(x, y); g.lineTo(x, y - h); g.lineTo(x + 3.5, y - h - 6); g.lineTo(x + 7, y - h); g.lineTo(x + 7, y);
      g.fill();
    }
    g.fillStyle = col;
    g.fillRect(x0, y - h * 0.3, x1 - x0, 3);
    g.fillRect(x0, y - h * 0.75, x1 - x0, 3);
  }
  function church(g, ruined) {
    const x0 = 800, x1 = 1060, base = 560;
    if (!ruined) {
      P.fillV(g, x0, 330, x1 - x0, base - 330, [[0, '#d8d4c8'], [1, '#9a968a']]);
      g.fillStyle = '#c8c4b8';
      g.beginPath(); g.moveTo(x0 - 10, 332); g.lineTo((x0 + x1) / 2, 280); g.lineTo(x1 + 10, 332); g.fill();
      // барабан и купол
      P.fillV(g, 890, 220, 80, 70, [[0, '#e0dcd0'], [1, '#a8a498']]);
      g.fillStyle = '#3a5a9a';
      g.beginPath(); g.moveTo(884, 222); g.quadraticCurveTo(930, 120, 976, 222); g.fill();
      for (let i = 0; i < 30; i++) { g.fillStyle = 'rgba(255,230,140,.8)'; g.fillRect(890 + (i * 13) % 80, 150 + (i * 29) % 70, 2, 2); }
      g.fillStyle = '#e8c060';
      g.fillRect(928, 90, 4, 46); g.fillRect(918, 102, 24, 4); g.fillRect(921, 118, 18, 3);
      // колокольня слева от храма
      P.fillV(g, 740, 260, 70, 300, [[0, '#d8d4c8'], [1, '#9a968a']]);
      g.fillStyle = '#1a2030';
      g.beginPath(); g.moveTo(752, 330); g.lineTo(752, 296); g.quadraticCurveTo(775, 276, 798, 296); g.lineTo(798, 330); g.fill();
      g.fillStyle = '#b89040';
      g.beginPath(); g.moveTo(764, 312); g.quadraticCurveTo(775, 296, 786, 312); g.lineTo(790, 326); g.lineTo(760, 326); g.fill();
      g.fillStyle = '#3a5a9a';
      g.beginPath(); g.moveTo(736, 262); g.lineTo(775, 200); g.lineTo(814, 262); g.fill();
      g.fillStyle = '#e8c060';
      g.fillRect(773, 170, 4, 32);
      // окна храма — тёплые, свечи
      for (let i = 0; i < 4; i++) {
        const wx = 820 + i * 60;
        g.fillStyle = '#ffd890';
        g.beginPath(); g.moveTo(wx, 470); g.lineTo(wx, 400); g.arc(wx + 14, 400, 14, Math.PI, 0); g.lineTo(wx + 28, 470); g.fill();
        P.glow(g, wx + 14, 430, 60, '#ffb050', 0.4);
      }
      // паперть
      g.fillStyle = '#b8b4a8';
      g.fillRect(880, 540, 110, 20);
      g.fillStyle = '#3a2a1a';
      g.fillRect(906, 480, 58, 62);
      g.fillStyle = 'rgba(255,200,120,.5)';
      g.fillRect(912, 486, 46, 56);
    } else {
      // руины: стены без крыши, пустые окна, разбитый купол, колокольня с колоколом и верёвкой
      P.fillV(g, x0, 360, x1 - x0, base - 360, [[0, '#3a4038'], [1, '#1a2018']]);
      g.fillStyle = '#0a100c';
      g.beginPath(); g.moveTo(x0, 360); g.lineTo(x0 + 40, 330); g.lineTo(x0 + 90, 372); g.lineTo(x0 + 150, 340); g.lineTo(x1 - 40, 380); g.lineTo(x1, 350); g.lineTo(x1, 362); g.lineTo(x0, 372); g.fill();
      for (let i = 0; i < 4; i++) {
        const wx = 820 + i * 60;
        g.fillStyle = '#0a120e';
        g.beginPath(); g.moveTo(wx, 470); g.lineTo(wx, 400); g.arc(wx + 14, 400, 14, Math.PI, 0); g.lineTo(wx + 28, 470); g.fill();
      }
      // пролом в стене
      g.fillStyle = '#060a08';
      g.beginPath(); g.moveTo(980, 560); g.lineTo(990, 470); g.lineTo(1020, 450); g.lineTo(1040, 500); g.lineTo(1036, 560); g.fill();
      P.fillV(g, 740, 250, 70, 310, [[0, '#3a4038'], [1, '#1a2018']]);
      g.fillStyle = '#060a08';
      g.beginPath(); g.moveTo(752, 330); g.lineTo(752, 290); g.quadraticCurveTo(775, 270, 798, 290); g.lineTo(798, 330); g.fill();
      g.fillStyle = '#5a5030';
      g.beginPath(); g.moveTo(764, 310); g.quadraticCurveTo(775, 294, 786, 310); g.lineTo(790, 324); g.lineTo(760, 324); g.fill();
      // тина свисает
      for (let i = 0; i < 40; i++) {
        g.strokeStyle = 'rgba(40,70,40,.6)';
        g.lineWidth = 1.5;
        g.beginPath();
        const x = 740 + (i * 37) % 330, y = 330 + (i * 53) % 60;
        g.moveTo(x, y); g.quadraticCurveTo(x + 4, y + 20, x - 2, y + 30 + (i % 4) * 10);
        g.stroke();
      }
    }
  }
  function paintPast(g) {
    // вода над селом: свет сверху, глубина книзу
    P.fillV(g, 0, 0, W, H, [[0, '#4a7a9a'], [0.35, '#2a5068'], [0.75, '#1a3448'], [1, '#0e1e2a']]);
    for (let i = 0; i < 9; i++) P.cone(g, 60 + i * 150, -10, 30, 160, 640, '#d0ecff', 0.18);
    // дальние ивы и холм
    g.fillStyle = '#1c3444';
    g.beginPath();
    g.moveTo(0, 470); g.quadraticCurveTo(300, 400, 640, 430); g.quadraticCurveTo(980, 450, W, 410); g.lineTo(W, 560); g.lineTo(0, 560);
    g.fill();
    const r = rng(971);
    for (let i = 0; i < 18; i++) {
      const x = r() * W, y = 440 + r() * 40;
      g.fillStyle = '#183040';
      g.beginPath(); g.ellipse(x, y - 30, 30 + r() * 20, 40 + r() * 20, 0, 0, TAU); g.fill();
      g.strokeStyle = '#183040';
      g.lineWidth = 1.2;
      for (let k = 0; k < 12; k++) { g.beginPath(); g.moveTo(x - 30 + k * 5, y - 50); g.quadraticCurveTo(x - 32 + k * 5, y - 10, x - 34 + k * 5.5, y + 10 + (k % 3) * 6); g.stroke(); }
    }
    church(g, false);
    izba(g, 110, 370, 572, 410);
    izba(g, 430, 690, 576, 420, { log: '#544030', carve: '#c8d8e0' });
    // дом Анны: синие наличники
    izba(g, 1120, 1300, 576, 400, { log: '#5a4834', carve: '#7aa0d0', roof: '#2a2830' });
    // заборы; калитка Анны закрыта
    fence(g, 40, 400, 596, 40);
    fence(g, 430, 720, 598, 42);
    fence(g, 1060, 1280, 598, 44, '#4a3a2a', [GATE - 2, GATE + 30]);
    P.fillV(g, GATE, 548, 30, 50, [[0, '#5a4632'], [1, '#3a2c20']]);
    g.strokeStyle = '#2a2018';
    g.lineWidth = 2;
    g.beginPath(); g.moveTo(GATE, 550); g.lineTo(GATE + 30, 596); g.stroke();
    g.fillStyle = '#9a8a6a';
    g.fillRect(GATE + 26, 570, 8, 3);
    // колодец-журавль
    g.strokeStyle = '#3a2c20';
    g.lineWidth = 5;
    g.beginPath(); g.moveTo(730, 600); g.lineTo(730, 470); g.moveTo(690, 450); g.lineTo(790, 500); g.stroke();
    P.fillV(g, 712, 560, 40, 40, [[0, '#5a4632'], [1, '#2a2018']]);
    // дорога
    P.fillV(g, 0, 596, W, H - 596, [[0, '#4a4a3a'], [1, '#1e2420']]);
    for (let i = 0; i < 80; i++) {
      g.fillStyle = `rgba(0,0,0,${0.1 + r() * 0.15})`;
      g.fillRect(r() * W, 600 + r() * 120, 10 + r() * 40, 2);
    }
    for (let i = 0; i < 50; i++) {
      const x = r() * W, y = 600 + r() * 20;
      g.strokeStyle = '#2a3a2a';
      g.lineWidth = 1.2;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - 0.5) * 6, y - 8 - r() * 10); g.stroke();
    }
    // всё синевато — память под водой
    g.save();
    g.globalCompositeOperation = 'multiply';
    g.fillStyle = '#a8c8d8';
    g.fillRect(0, 0, W, H);
    g.restore();
    P.paper(g, 972, 0.08);
  }
  // ---------- Сейчас: дно водохранилища ----------
  function paintNow(g) {
    P.fillV(g, 0, 0, W, H, [[0, '#1a2a24'], [0.5, '#0e1814'], [1, '#060a08']]);
    for (let i = 0; i < 5; i++) P.cone(g, 100 + i * 280, -10, 20, 90, 520, '#90b0a0', 0.07);
    const r = rng(981);
    church(g, true);
    // от изб — фундаменты и печные трубы
    [[110, 370], [430, 690], [1120, 1300]].forEach(([x0, x1], i) => {
      g.fillStyle = '#1e2420';
      g.fillRect(x0, 560, x1 - x0, 20);
      P.fillV(g, x0 + (x1 - x0) * 0.6, 420 + i * 10, 34, 150, [[0, '#3a3430'], [1, '#1a1614']]);
      g.fillStyle = '#2a2420';
      g.fillRect(x0 + (x1 - x0) * 0.6 - 4, 414 + i * 10, 42, 8);
      for (let k = 0; k < 5; k++) {
        g.save();
        g.translate(x0 + r() * (x1 - x0), 560 + r() * 20);
        g.rotate((r() - 0.5) * 0.8);
        P.fillV(g, -40, -5, 80, 10, [[0, '#2a2218'], [1, '#141008']]);
        g.restore();
      }
    });
    // наличник Анны в иле
    g.save();
    g.translate(1200, 590);
    g.rotate(-0.3);
    g.fillStyle = '#3a5068';
    g.beginPath(); g.moveTo(-30, 0); g.lineTo(0, -16); g.lineTo(30, 0); g.lineTo(30, 4); g.lineTo(-30, 4); g.fill();
    g.restore();
    // гнилой забор — вместо калитки дыра
    fence(g, 1060, 1280, 598, 30, '#1e1c16', [GATE - 30, GATE + 60]);
    // колодец без журавля
    g.fillStyle = '#1e1a14';
    g.fillRect(712, 566, 40, 34);
    // затонувшая лодка с воздухом под днищем
    g.fillStyle = '#1a1410';
    g.beginPath();
    g.moveTo(BOAT.x - 90, BOAT.y - 30); g.quadraticCurveTo(BOAT.x, BOAT.y - 70, BOAT.x + 90, BOAT.y - 30); g.lineTo(BOAT.x + 70, BOAT.y - 10); g.lineTo(BOAT.x - 70, BOAT.y - 10);
    g.fill();
    // ил, водоросли
    P.fillV(g, 0, 596, W, H - 596, [[0, '#26261c'], [1, '#0a0a06']]);
    for (let i = 0; i < 90; i++) {
      const x = r() * W, y = 590 + r() * 30;
      g.strokeStyle = `rgba(30,60,40,${0.5 + r() * 0.4})`;
      g.lineWidth = 2;
      g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + (r() - 0.5) * 20, y - 30, x + (r() - 0.5) * 30, y - 50 - r() * 50); g.stroke();
    }
    // покрышка, бутылка, кости рыбы — современный мусор на дне
    g.strokeStyle = '#141410';
    g.lineWidth = 6;
    g.beginPath(); g.ellipse(300, 650, 26, 8, 0, 0, TAU); g.stroke();
    g.fillStyle = 'rgba(80,120,90,.5)';
    g.fillRect(840, 640, 18, 6);
    P.paper(g, 982, 0.1);
  }

  // ---------- Утонувшие ----------
  const LIGHT_PAST = { amb: 0.55, tint: '#3a6a80', side: 1 };
  const LIGHT_WARM = { amb: 0.85, tint: '#c8a070', side: 1 };
  const SMITH = { coat: '#5a3a24', coatDark: '#3a2414', trousers: '#2a2622', hat: '#3d362e', band: '#1c1814', scarf: '#5a2a20', skin: '#c89a80', shoes: '#1a1410', case: '#73553a', caseDark: '#4a3624', metal: '#8a8a80' };
  const TEACH = { coat: '#3a4048', coatDark: '#2a2e34', trousers: '#2a2a30', hat: '#3d362e', band: '#1c1814', scarf: '#6a6a70', skin: '#d6a98b', shoes: '#1a1410', case: '#5a3a24', caseDark: '#3a2414', metal: '#b89a62' };
  const WIDOW = { cardigan: '#1e1c20', blouse: '#9a9488', skirt: '#1a181c', skin: '#c8a090', hair: '#5a4a40', shoes: '#141010', tights: '#1a1616' };
  const MILK = { cardigan: '#6a5a3a', blouse: '#d8ccb0', skirt: '#4a3a2e', skin: '#d8a88e', hair: '#5a3a24', shoes: '#2a1c16', tights: '#3a302c' };
  const DEACON = { robe: '#22242c', robeHi: '#3a3c44', skin: '#c89a80', beard: '#6a5a4a', hair: '#5a4a3a', cap: '#141212', cross: '#c9a050', shoes: '#141212' };
  const BOY = { pj: '#8a9a7a', stripe: '#6a7a5a', skin: '#e2b79c', hair: '#c8a060' };
  const D = [
    { id: 'smith', x: 205, kind: 'lev', pal: SMITH, prop: 'hammer' },
    { id: 'milk', x: 315, kind: 'vera', pal: MILK, scarf: '#a85a3a', prop: 'can' },
    { id: 'widow', x: 425, kind: 'vera', pal: WIDOW, scarf: '#141216', prop: 'boots' },
    { id: 'boy', x: 590, kind: 'mitya', pal: BOY },
    { id: 'fisher', x: 680, kind: 'sem', prop: 'net' },
    { id: 'teacher', x: 800, kind: 'lev', pal: TEACH, item: 'case' },
    { id: 'deacon', x: 905, kind: 'nik', pal: DEACON },
  ];
  // Где голова у каждой фигуры (локально, лицом вправо, s=1).
  const HEAD = { lev: [3.5, -181], vera: [3, -155], nik: [3.5, -176], sem: [4.5, -170], mitya: [2.5, -111] };
  const drowned = D.map((d) => OM.actor(Object.assign({}, d, {
    y: 628, face: 1, litByScene: false, reveal: 0, gone: 0, spoke: false, autoScale: true,
    draw: (c, a, t) => drawDrowned(c, a, t),
  })));
  function headPos(a) { const h = HEAD[a.kind]; return [a.x + h[0] * a.s * a.face, a.y + h[1] * a.s]; }
  function drawDrowned(c, a, t) {
    if (st.world !== 'past' || a.gone >= 1) return;
    const named = G.flags['named_' + a.id];
    const L = named ? LIGHT_WARM : LIGHT_PAST;
    const sway = Math.sin(t * 0.6 + a.x) * 1.5;
    const o = { x: a.x + sway, y: a.y, s: a.s, face: a.face, light: L, alpha: 1 - a.gone, move: a.move, phase: a.phase };
    c.save();
    c.globalAlpha = 1 - a.gone;
    if (a.kind === 'lev') A.hero(c, Object.assign(o, { pal: a.pal, hat: false, hair: '#3a3028', item: a.item || 'none' }), t);
    if (a.kind === 'vera') A.vera(c, Object.assign(o, { pal: a.pal, scarf: a.scarf, glasses: false, hold: a.id === 'widow' ? 'chest' : null }), t);
    if (a.kind === 'mitya') A.mitya(c, Object.assign(o, { pal: a.pal, sleep: !G.flags.boyAwake }), t);
    if (a.kind === 'sem') A.semWalk(c, Object.assign(o, { lantern: false }), t);
    if (a.kind === 'nik') A.nikodim(c, Object.assign(o, { pal: a.pal, pose: named ? 'bless' : null }), t);
    // предметы у ног
    const px = a.x + a.face * 26 * a.s, py = a.y;
    if (a.prop === 'hammer') { c.fillStyle = '#2a2420'; c.fillRect(px - 2, py - 34, 4, 34); c.fillStyle = '#5a5a58'; c.fillRect(px - 9, py - 40, 18, 9); }
    if (a.prop === 'can') { P.fillV(c, px - 9, py - 30, 18, 30, [[0, '#a8b0b0'], [1, '#5a6060']]); c.fillStyle = '#5a6060'; c.fillRect(px - 5, py - 36, 10, 6); }
    if (a.prop === 'boots') { c.fillStyle = '#141412'; c.fillRect(px - 10, py - 26, 8, 26); c.fillRect(px + 2, py - 24, 8, 24); c.fillRect(px - 12, py - 6, 26, 6); }
    if (a.prop === 'net') { c.strokeStyle = 'rgba(160,170,150,.6)'; c.lineWidth = 0.8; for (let i = 0; i < 6; i++) { c.beginPath(); c.moveTo(px - 18, py - 4 - i * 4); c.quadraticCurveTo(px, py - 10 - i * 4, px + 18, py - 4 - i * 4); c.stroke(); } c.fillStyle = '#c84a2a'; c.beginPath(); c.arc(px + 10, py - 20, 3, 0, TAU); c.fill(); }
    // лицо закрыто мокрыми волосами, пока не всмотришься
    if (!named && a.reveal < 1) {
      const [hx, hy] = headPos(a);
      const k = 1 - a.reveal;
      const sc = a.s * (a.kind === 'mitya' ? 0.85 : 1);
      c.save();
      c.globalAlpha = k * (1 - a.gone);
      c.fillStyle = '#0a1418';
      c.beginPath();
      c.ellipse(hx + a.face * 2 * sc, hy - 1 * sc, 12.5 * sc, 14 * sc, 0, 0, TAU);
      c.fill();
      c.strokeStyle = '#0a1418';
      c.lineCap = 'round';
      for (let i = 0; i < 12; i++) {
        const sx = hx + (-11 + i * 2) * sc;
        c.lineWidth = (1 + (i % 3)) * sc;
        c.beginPath();
        c.moveTo(sx, hy - 12 * sc);
        c.quadraticCurveTo(sx + a.face * 4 * sc, hy + 6 * sc, sx + a.face * (2 + Math.sin(t + i) * 1.5) * sc, hy + (18 + (i % 4) * 6) * sc);
        c.stroke();
      }
      c.restore();
    }
    // кольцо «взгляда»
    if (st.gaze === a && a.reveal < 1 && !named) {
      const [hx, hy] = headPos(a);
      c.strokeStyle = 'rgba(200,230,255,.7)';
      c.lineWidth = 2;
      c.beginPath();
      c.arc(hx, hy, 26 * a.s, -Math.PI / 2, -Math.PI / 2 + TAU * a.reveal);
      c.stroke();
    }
  }

  // Помощники — те, кого вода взяла в главе 4.
  const ZINA = { cardigan: '#5a4c44', blouse: '#c9bfae', skirt: '#3a3236', skin: '#d3a68e', hair: '#9a948c', shoes: '#2a1c16', tights: '#4a3a34' };
  const VERA_N = { cardigan: '#d8d2c4', blouse: '#e0d8c8', skirt: '#d0c8b8', skin: '#e0b39a', hair: '#4a2e22', shoes: '#c89a88', tights: '#e0b39a' };
  const helpers = {
    vera: OM.actor({ id: 'hvera', x: 120, y: 650, face: 1, draw: (c, a, t) => st.world === 'past' && A.vera(c, Object.assign({}, a, { pal: VERA_N, long: true, hairDown: true, glasses: false, hold: 'chest', light: LIGHT_WARM }), t) }),
    zina: OM.actor({ id: 'hzina', x: 1030, y: 650, face: 1, draw: (c, a, t) => st.world === 'past' && A.vera(c, Object.assign({}, a, { pal: ZINA, shawl: '#7a3a2e', shawlPat: 'rgba(196,154,90,.8)', highBun: true, light: LIGHT_WARM }), t) }),
    sem: OM.actor({ id: 'hsem', x: 500, y: 646, face: -1, draw: (c, a, t) => st.world === 'past' && !G.flags.named_widow && A.semWalk(c, Object.assign({}, a, { lantern: true, lit: true, light: LIGHT_WARM }), t) }),
    nik: OM.actor({ id: 'hnik', x: 990, y: 636, face: -1, draw: (c, a, t) => st.world === 'past' && A.nikodim(c, Object.assign({}, a, { pose: G.flags.service ? 'bless' : null, light: LIGHT_WARM }), t) }),
  };

  // ---------- Рендер ----------
  function back(ctx, t) {
    const img = OM.cache('inverse:' + st.world, st.world === 'past' ? paintPast : paintNow);
    ctx.drawImage(img, 0, 0, W, H);
    // отражение другого мира — сверху, вверх ногами, за поверхностью воды
    const other = OM.cache('inverse:' + (st.world === 'past' ? 'now' : 'past'), st.world === 'past' ? paintNow : paintPast);
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, W, 130);
    ctx.clip();
    ctx.globalAlpha = 0.4;
    ctx.translate(0, 130);
    ctx.scale(1, -0.2);
    for (let y = 0; y < H; y += 24) ctx.drawImage(other, 0, y, W, 24, Math.sin(t * 1.4 + y * 0.05) * 6, y, W, 24);
    ctx.restore();
    ctx.fillStyle = P.vgrad(ctx, 0, 150, [[0, 'rgba(220,240,255,.08)'], [0.85, 'rgba(220,240,255,.02)'], [1, 'rgba(220,240,255,.25)']]);
    ctx.fillRect(0, 0, W, 132);
    for (let i = 0; i < 12; i++) {
      ctx.fillStyle = 'rgba(230,245,255,.22)';
      ctx.fillRect(((i * 113 + t * 20) % (W + 100)) - 50, 128 + Math.sin(t + i) * 2, 40 + (i % 3) * 20, 1.2);
    }
    // пузыри: из печных труб в прошлом (дым стал пузырями), из-под лодки — сейчас
    const srcs = st.world === 'past' ? [[318, 330], [638, 340], [1250, 320]] : [[BOAT.x, BOAT.y - 40], [870, 600]];
    srcs.forEach(([sx, sy], j) => {
      for (let i = 0; i < 10; i++) {
        const k = (t * 0.22 + i / 10 + j * 0.3) % 1;
        ctx.strokeStyle = `rgba(220,240,255,${0.45 * (1 - k)})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(sx + Math.sin(t * 2 + i) * 6, sy - k * 300, 2 + (i % 3) * 1.5, 0, TAU);
        ctx.stroke();
      }
    });
    // взвесь
    for (let i = 0; i < 50; i++) {
      const k = (t * 0.03 + i * 0.137) % 1;
      ctx.fillStyle = st.world === 'past' ? 'rgba(220,240,255,.25)' : 'rgba(160,170,140,.25)';
      ctx.fillRect((i * 97 + Math.sin(t * 0.3 + i) * 20) % W, H - k * H, 1.5, 1.5);
    }
    // колокол качается после удара
    if (st.ring > 0) {
      ctx.save();
      ctx.translate(775, 300);
      ctx.rotate(Math.sin(st.ring * 18) * st.ring * 0.3);
      ctx.fillStyle = st.world === 'past' ? '#b89040' : '#5a5030';
      ctx.beginPath(); ctx.moveTo(-11, 12); ctx.quadraticCurveTo(0, -4, 11, 12); ctx.lineTo(15, 26); ctx.lineTo(-15, 26); ctx.fill();
      ctx.restore();
    }
    // воздух под днищем лодки — серебряный пузырь
    if (st.world === 'now') {
      ctx.save();
      ctx.fillStyle = P.rgrad(ctx, BOAT.x, BOAT.y - 26, 0, 70, [[0, 'rgba(230,245,255,.55)'], [0.6, 'rgba(200,225,240,.25)'], [1, 'rgba(200,225,240,0)']]);
      ctx.beginPath();
      ctx.ellipse(BOAT.x, BOAT.y - 24, 66 + Math.sin(t * 2) * 3, 12, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.5)';
      ctx.fillRect(BOAT.x - 50 + Math.sin(t * 1.3) * 10, BOAT.y - 30, 40, 1.5);
      ctx.restore();
      P.glow(ctx, BOAT.x, BOAT.y - 30, 90, '#cfe8ff', 0.25);
    }
    // верёвка колокола (наша, из третьей главы) — только в «сейчас»
    if (st.world === 'now') {
      ctx.strokeStyle = '#a89060';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(775, 326);
      ctx.quadraticCurveTo(840 + Math.sin(t) * 6, 420, ROPE.x, 590);
      ctx.stroke();
    }
  }
  function over(ctx, t) {
    if (st.world === 'now') {
      // темно; свет — фонарь у Льва, если он есть
      if (!st.dark) st.dark = OM.makeCanvas(W / 2, H / 2);
      const d = st.dark.getContext('2d');
      d.setTransform(0.5, 0, 0, 0.5, 0, 0);
      d.globalCompositeOperation = 'source-over';
      d.clearRect(0, 0, W, H);
      d.fillStyle = 'rgba(2,6,4,.62)';
      d.fillRect(0, 0, W, H);
      d.globalCompositeOperation = 'destination-out';
      const h = G.hero;
      const lr = OM.has('lantern') ? 300 : 120;
      d.fillStyle = P.rgrad(d, h.x, h.y - 100, 0, lr, [[0, 'rgba(0,0,0,.95)'], [0.6, 'rgba(0,0,0,.5)'], [1, 'rgba(0,0,0,0)']]);
      d.fillRect(h.x - lr, h.y - 100 - lr, lr * 2, lr * 2);
      d.fillStyle = P.rgrad(d, BOAT.x, BOAT.y - 60, 0, 120, [[0, 'rgba(0,0,0,.6)'], [1, 'rgba(0,0,0,0)']]);
      d.fillRect(BOAT.x - 130, BOAT.y - 190, 260, 260);
      if (!OM.has('lantern') && st.bottomLantern) {
        d.fillStyle = P.rgrad(d, 640, 640, 0, 160, [[0, 'rgba(0,0,0,.9)'], [1, 'rgba(0,0,0,0)']]);
        d.fillRect(480, 480, 320, 320);
      }
      d.fillStyle = 'rgba(0,0,0,.5)';
      d.fillRect(0, 0, W, 140);
      ctx.drawImage(st.dark, 0, 0, W, H);
      if (OM.has('lantern')) P.glow(ctx, h.x + h.face * 30, h.y - 120 * h.s, 90, '#ffb050', 0.35);
      if (!OM.has('lantern') && st.bottomLantern) {
        P.glow(ctx, 640, 640, 70, '#ffb050', 0.6);
        ctx.fillStyle = '#ffd890';
        ctx.beginPath(); ctx.ellipse(640, 636, 6, 8, 0, 0, TAU); ctx.fill();
      }
      // воздух
      const b = st.breath;
      const x = 40, y = 96;
      ctx.fillStyle = 'rgba(0,0,0,.45)';
      P.rrect(ctx, x - 6, y - 16, 160, 30, 8);
      ctx.fill();
      P.text(ctx, 'воздух', x + 26, y, { font: 'italic 14px "Cormorant Garamond",serif', color: 'rgba(220,235,245,.85)' });
      ctx.fillStyle = 'rgba(255,255,255,.12)';
      ctx.fillRect(x + 56, y - 4, 90, 8);
      ctx.fillStyle = b < 0.3 ? '#e0884a' : '#cfe4ff';
      ctx.fillRect(x + 56, y - 4, 90 * b, 8);
      if (b < 0.35) { ctx.fillStyle = `rgba(80,0,0,${(0.35 - b) * 0.9})`; ctx.fillRect(0, 0, W, H); }
    } else {
      ctx.fillStyle = 'rgba(10,30,50,.12)';
      ctx.fillRect(0, 0, W, H);
    }
    P.text(ctx, st.world === 'past' ? 'Покровское · 14 октября 1955' : 'Дно водохранилища · 15 октября 1996', W / 2, 160, { font: 'italic 15px "Cormorant Garamond",serif', color: 'rgba(220,235,245,.45)', ls: 2 });
  }
  function threads(ctx, t, k) {
    const h = G.hero;
    OM.thread(ctx, [h.x, h.y - 110 * h.s], [DOOR.x, DOOR.y], t, { color: '#ffd27a', a: k, sag: 30, w: 1.8 });
    if (st.world !== 'past') return;
    drowned.forEach((a) => {
      if (a.gone >= 1) return;
      const [hx, hy] = headPos(a);
      const named = G.flags['named_' + a.id];
      OM.thread(ctx, [hx, hy + 40], named ? [hx, 0] : [DOOR.x - 20, DOOR.y + 20], t, { color: named ? '#fff0c0' : '#7a90b0', a: k * (1 - a.gone), sag: named ? 0 : 20, w: 1 });
    });
  }

  // ---------- Логика ----------
  function update(dt, t) {
    const h = G.hero;
    st.ring = Math.max(0, st.ring - dt * 0.5);
    // ушедшие в храм тают
    drowned.forEach((a) => {
      if (G.flags['named_' + a.id] && a.leaving) {
        if (!a.target && a.gone < 1) a.gone = Math.min(1, a.gone + dt * 0.4);
      }
      if (G.flags['named_' + a.id] && !a.leaving && !a.speaking) { a.leaving = true; OM.moveTo(a, 940, 600, { free: true, speed: 50 }); }
      if (a.gone >= 1) a.visible = false;
    });
    if (G.mode !== 'play' || G.vision || st.flipping || st.failing) return;
    // дыхание
    if (st.world === 'now') {
      const nearAir = Math.abs(h.x - BOAT.x) < 90;
      st.breath = clamp(st.breath + (nearAir ? dt / 1.5 : -dt / 13), 0, 1);
      if (nearAir && Math.random() < dt * 3) S.splash && Math.random() < 0.2 && S.splash();
      if (Math.random() < dt * (1.6 - st.breath)) S.heartbeat();
      S.muffle(0.55 + (1 - st.breath) * 0.4);
      if (st.breath <= 0) { st.failing = true; OM.run(drown); }
    } else {
      st.breath = clamp(st.breath + dt / 1.2, 0, 1);
      if (h.x > GATE + 24 && !G.flags.passedGate) { G.flags.passedGate = 1; OM.save(); }
    }
    // взгляд: курсор на лице — проступает
    st.gaze = null;
    if (st.world === 'past' && G.mouse.x >= 0 && !G.busy && !G.saying && !G.choosing) {
      for (const a of drowned) {
        if (G.flags['named_' + a.id] || a.gone > 0) continue;
        const [hx, hy] = headPos(a);
        if (Math.hypot(G.mouse.x - hx, G.mouse.y - hy) < 34 * a.s) {
          if (a.id === 'boy' && !G.flags.boyAwake) break;
          st.gaze = a;
          a.reveal = Math.min(1, a.reveal + dt / 1.3);
          if (a.reveal >= 1 && !a.spoke) {
            a.spoke = true;
            const n = OM.story5.NAMES.find((x) => x.id === a.id);
            OM.run(() => OM.say('drowned', n.said, { italic: true }));
          }
          break;
        }
      }
    }
    if (st.gaze) S.tension(0.4); else S.tension(0);
  }

  async function drown() {
    S.hit();
    OM.shake(8);
    G.fx.warp = 1;
    await OM.fadeTo(1, 600, '#020a10');
    G.flags.breathFails = (G.flags.breathFails || 0) + 1;
    await OM.say('narr', 'Воздух кончился. Вода вошла внутрь — тёплая, как молоко.', { hold: 1.4 });
    st.world = 'past';
    st.breath = 1;
    const h = G.hero;
    if (h.x > GATE - 20 && h.x < GATE + 30) h.x = GATE - 30;
    if (h.x > GATE + 30 && !G.flags.passedGate) h.x = GATE - 30;
    h.target = null;
    G.fx.warp = 0;
    S.muffle(0);
    await OM.fadeTo(0, 700);
    await say('…Вдох. Здесь — можно. Там — недолго.');
    st.failing = false;
  }

  // Переворот мира: «нырнуть» в другой слой.
  OM.flipWorld = async () => {
    if (G.sid !== 'inverse' || st.flipping || G.busy || G.saying || G.choosing || G.vision || G.mode !== 'play') return;
    const h = G.hero;
    // в прошлом калитка заперта: нельзя оказаться внутри неё
    if (st.world === 'now' && h.x > GATE - 14 && h.x < GATE + 40) return OM.run(() => say('Тут в прошлом — калитка. Шагнуть бы в сторону.'));
    st.flipping = true;
    h.target = null;
    S.splash();
    S.whisper(0.8, 0.08);
    for (let i = 0; i <= 12; i++) { G.fx.warp = i / 12; await OM.wait(16); }
    await OM.fadeTo(1, 220, st.world === 'past' ? '#020806' : '#cfe8ff');
    st.world = st.world === 'past' ? 'now' : 'past';
    S.amb(st.world === 'past' ? { water: 0.5, drone: 0.15, wind: 0 } : { water: 0.9, drone: 0.55, wind: 0 });
    S.muffle(st.world === 'now' ? 0.6 : 0);
    if (st.world === 'past') S.choir(true); else S.choir(false);
    await OM.fadeTo(0, 300);
    for (let i = 12; i >= 0; i--) { G.fx.warp = i / 12; await OM.wait(16); }
    st.flipping = false;
    if (!G.flags.flipTip) {
      G.flags.flipTip = 1;
      if (st.world === 'now') OM.toast('Здесь нечем дышать. Воздух — под затонувшей лодкой. Вернуться — та же кнопка.');
    }
  };

  async function nameUse(a) {
    if (G.flags['named_' + a.id]) return;
    if (a.id === 'boy' && !G.flags.boyAwake) return say('Мальчик спит. Стоя, как Митя тогда. Лицо в ладонях. Будить нельзя резко.');
    if (a.reveal < 1) return say('Лица не видно — волосы, тина. Надо всмотреться. Долго. Не отводя глаз.');
    a.speaking = true;
    const ok = await OM.story5.nameAsk(a.id);
    if (ok) {
      const n = OM.story5.NAMES.find((x) => x.id === a.id);
      G.flags['named_' + a.id] = 1;
      S.bell(0.5);
      OM.flash(0.3);
      await OM.say('drowned', n.ok);
      if (a.id === 'widow' && !OM.story5.present('sem')) {
        await OM.say('sem', 'Мама. Я сапоги снял. Пойдём.');
      } else if (a.id === 'widow') {
        await say('Мария Семёновна, Пётр вам передал: сапоги снял. Не ждите.');
        await OM.say('drowned', 'Снял… Ну и слава Богу.');
      }
      if (!OM.story5.unnamed()) { OM.ach.unlock('names'); await say('Всех. Семерых. По имени.'); }
      OM.save();
    }
    a.speaking = false;
  }

  async function ringBell() {
    if (st.world !== 'now') return;
    if (G.flags.bellRung) return say('Позвонил уже. Звон до сих пор стоит в воде.');
    await OM.walk(ROPE.x - 20, 640);
    G.hero.pose = 'reach';
    for (let i = 0; i < 3; i++) {
      st.ring = 1;
      S.bigBell(0, 0.55);
      OM.shake(4);
      await OM.wait(900);
    }
    G.hero.pose = null;
    G.flags.bellRung = 1;
    OM.save();
    await say('Под водой звон другой. Медленный. Как будто колокол думает, прежде чем ударить.');
    await say('Там, в пятьдесят пятом, его услышат.');
  }

  const hsD = drowned.map((a) => ({
    id: 'd_' + a.id, name: '…',
    get name() { return G.flags['named_' + a.id] ? OM.story5.NAMES.find((x) => x.id === a.id).name : a.reveal >= 1 ? 'Назвать по имени' : 'Утонувший'; },
    when: () => st.world === 'past' && a.gone < 0.5,
    rect: () => [a.x - 34, a.y - 200 * a.s, 68, 200 * a.s],
    use: () => nameUse(a),
    look: () => say(a.reveal >= 1 ? 'Лицо проступило. Живое. Ждёт, когда позовут.' : 'Стоит, опустив голову. Вода шевелит волосы на лице.'),
    items: {
      bell: async () => {
        if (a.id !== 'boy') return say('Он не спит. Он ждёт.');
        if (G.flags.boyAwake) return say('Проснулся уже.');
        S.bell(0.6);
        await OM.wait(700);
        G.flags.boyAwake = 1;
        a.reveal = 0;
        await OM.say('drowned', 'А?.. Звонят. Это к обедне?', { italic: true });
        await say('Как Митя. Теперь — смотреть в лицо.');
      },
      list: () => nameUse(a),
    },
  }));

  OM.scene('inverse', {
    name: 'Изнанка',
    surface: 'road',
    noThreads: false,
    get figLight() { return st.world === 'past' ? LIGHT_PAST : { amb: 0.35, tint: '#1a3a2a', side: 1 }; },
    amb: { water: 0.5, drone: 0.15 },
    get walk() {
      if (st.world === 'now') return [[60, 612], [1262, 612], [1262, 700], [60, 700]];
      return G.hero.x > GATE + 20 ? [[GATE + 40, 612], [1262, 612], [1262, 700], [GATE + 40, 700]] : [[60, 612], [GATE - 20, 612], [GATE - 20, 700], [60, 700]];
    },
    depth: { y0: 612, s0: 0.98, y1: 700, s1: 1.06 },
    entries: { default: { x: 90, y: 660, face: 1 }, back: { x: DOOR.x - 30, y: 660, face: -1 } },
    get lights() { return st.world === 'past' ? [{ x: 640, y: -100, color: '#cfe8ff', a: 0.7, reach: 1600 }, { x: 930, y: 440, color: '#ffc070', a: 0.5, reach: 300 }] : [{ x: G.hero.x, y: G.hero.y - 140, color: '#ffb050', a: OM.has('lantern') ? 0.8 : 0.2, reach: 260 }]; },
    actors: () => [...drowned, ...Object.values(helpers)],
    paint(g) { g.fillStyle = '#04080c'; g.fillRect(0, 0, W, H); },
    back,
    over,
    threads,
    update,
    hotspots: [
      { id: 'church', name: 'Церковь Покрова', rect: [730, 160, 340, 400], when: () => st.world === 'past', look: ['Церковь целая. Свечи в окнах. Литургия идёт — только звука нет, как в немом кино.', 'Колокольня заперта изнутри. Отсюда до колокола не добраться.'] },
      { id: 'ruin', name: 'Руины церкви', rect: [730, 240, 340, 330], when: () => st.world === 'now', look: 'Та самая церковь. Наша, из девяносто шестого. Крыши нет, а колокол висит. И верёвка — моя, я её вчера привязал.' },
      { id: 'rope', name: 'Верёвка колокола', rect: [ROPE.x - 40, 420, 80, 190], when: () => st.world === 'now', use: ringBell, look: 'Верёвка тянется вверх, к колоколу. Здесь, внизу, его можно раскачать.' },
      { id: 'boat', name: 'Затонувшая лодка', rect: [BOAT.x - 90, BOAT.y - 80, 180, 80], when: () => st.world === 'now', look: 'Под днищем — воздух. Серебряный пузырь, как ртуть. Тут можно дышать.' },
      {
        id: 'blantern', name: 'Фонарь на дне', rect: [610, 600, 60, 60], when: () => st.world === 'now' && st.bottomLantern && !OM.has('lantern'),
        use: async () => { await OM.walk(640, 660); st.bottomLantern = false; OM.give('lantern'); await say('Фонарь Семёныча. Горит на дне — как ему и обещано. Прости, Семёныч.'); },
      },
      { id: 'gate', name: 'Калитка', rect: [GATE - 10, 530, 60, 80], when: () => st.world === 'past' && G.hero.x < GATE, look: 'Калитка Анниного двора. Щеколда — изнутри. Не дотянуться.', use: () => say('Заперто изнутри. Здесь — заперто. А там, где от забора одни гнилушки?..') },
      { id: 'gap', name: 'Дыра в заборе', rect: [GATE - 30, 540, 90, 70], when: () => st.world === 'now', look: 'От забора остались гнилые колья. Пройти — запросто.' },
      { id: 'house', name: 'Дом Анны', rect: [1120, 300, 160, 300], when: () => st.world === 'past', look: 'Синие наличники. В окне — лампа. Дым из трубы поднимается пузырями.', use: async () => {
        if (G.hero.x < GATE) return say('Калитка заперта. Надо как-то во двор.');
        await OM.walk(DOOR.x - 20, 650);
        await OM.go('annahouse', 'default');
      } },
      { id: 'stove', name: 'Печь', rect: [1180, 420, 80, 170], when: () => st.world === 'now', look: 'От маминого дома осталась печь. Русская, белёная когда-то. И наличник в иле — синий.' },
      { id: 'well', name: 'Колодец', rect: [690, 450, 100, 150], when: () => st.world === 'past', look: 'Колодец-журавль. Ведро стоит полное. Под водой — полное воды ведро. Смешно.' },
      ...hsD,
      { id: 'hvera', name: 'Вера', rect: () => [helpers.vera.x - 34, 460, 68, 200], when: () => st.world === 'past' && helpers.vera.visible, use: async () => {
        if (OM.has('list')) return OM.say('vera', 'Список у вас. Семеро. Я их всех наизусть выучила — здесь больше нечем заняться.');
        await OM.say('vera', 'Лев Аркадьевич… Вы всё-таки пришли. А я здесь. Тут тепло, представляете?');
        await OM.say('vera', 'Список — вот. Я с ним и ушла, в кармане рубашки. Семеро у церкви. Им имена нужнее, чем мне.');
        OM.give('list');
      } },
      { id: 'hzina', name: 'Зинаида Павловна', rect: () => [helpers.zina.x - 34, 460, 68, 200], when: () => st.world === 'past' && helpers.zina.visible, use: async () => {
        if (OM.has('scissors')) return OM.say('zina', 'Иди к ней. Она ждёт. Я — уже дождалась.');
        await OM.say('zina', 'Лёвушка. Вот и свиделись — здесь.');
        await OM.say('zina', 'Ножницы. Я их с собой взяла — знала, что понадобятся. Этими я тебе пуповину резала.');
        OM.give('scissors');
        await OM.say('zina', 'Калитка у Анны всегда на щеколде была. Но то — тогда. А сейчас там и забора нет.');
      } },
      { id: 'hsem', name: 'Семёныч', rect: () => [helpers.sem.x - 34, 460, 68, 200], when: () => st.world === 'past' && helpers.sem.visible && !G.flags.named_widow, use: async () => {
        await OM.say('sem', 'Мамку нашёл. Вон стоит, в чёрном. Только меня не узнаёт. И себя не помнит — имени своего.');
        await OM.say('sem', 'Ершова она. Мария. Отчество… Семёновна, по деду. Позови её, Лев. Меня не слышит.');
      } },
      { id: 'hnik', name: 'Отец Никодим', rect: () => [helpers.nik.x - 34, 440, 68, 200], when: () => st.world === 'past' && helpers.nik.visible, use: async () => {
        await OM.say('nik', 'Пришёл. Я тут вторую ночь — служу, а они не слышат.');
        await OM.say('nik', 'Назови их всех — по именам. И позвони — тем колоколом, что наверху. Тогда я отслужу как надо, и их отпустит.');
        await OM.say('nik', 'А может, и тебя.');
      } },
    ],
    setup() {
      st.world = 'past'; st.breath = 1; st.flipping = false; st.failing = false; st.ring = 0;
      st.bottomLantern = !OM.story5.present('sem');
      helpers.vera.visible = !OM.story5.present('vera');
      helpers.zina.visible = !OM.story5.present('zina');
      helpers.sem.visible = !OM.story5.present('sem');
      helpers.nik.visible = !OM.story5.present('nik');
      if (helpers.nik.visible) G.flags.nikBelow = 1;
      drowned.forEach((a, i) => {
        a.x = D[i].x; a.y = 628; a.target = null; a.leaving = false;
        a.gone = G.flags['named_' + a.id] ? 1 : 0; a.visible = a.gone < 1;
        a.reveal = 0; a.spoke = false; a.face = i < 4 ? 1 : -1;
      });
      S.choir(true);
      document.body.classList.add('flip-on');
    },
    leave() { S.choir(false); S.muffle(0); S.tension(0); G.fx.warp = 0; document.body.classList.remove('flip-on'); },
    async enter(entry) {
      if (entry === 'back') return;
      if (G.flags.inverseSeen) return;
      G.flags.inverseSeen = 1;
      OM.letterbox(true);
      await OM.wait(600);
      await say('Покровское. Утро четырнадцатого октября пятьдесят пятого. Только небо — из воды.');
      await say('Окна горят. Дым из труб идёт пузырями. И на улице — люди. Стоят. Лица закрыты волосами.');
      await say('А наверху, в отражении, — то же место. Каким оно стало: трубы, ил, руины.');
      OM.letterbox(false);
      OM.toast(G.touch ? 'Кнопка ⇅ внизу — перевернуть мир. Чтобы вернуть имя — долго смотрите в лицо.' : 'Кнопка ⇅ или клавиша F — перевернуть мир. Чтобы вернуть имя — держите курсор на лице.');
    },
    resume() { st.world = 'past'; },
  });
  OM.inverse = { st, drowned, helpers, headPos };
})();
