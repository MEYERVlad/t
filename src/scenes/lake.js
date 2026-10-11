// Глава 3. Озеро в тумане — вид с носа лодки. Плыть на звон колокола, обходя тех, кто стоит в воде.
(function () {
  const P = OM.P, S = OM.S, G = OM.G, A = OM.Actors;
  const { hex, rng, W, H, lerp, clamp } = OM;
  const HZ = 300, FOCAL = 760, CAM_H = 2.4;
  const CHURCH = { x: 0, z: 470 };
  const MOON_BEARING = 0.75;

  const st = {
    active: false, px: 0, pz: 0, head: -0.7, turn: 0, speed: 0, bell: 0, offFor: 0, hintCd: 0, hits: 0,
    objs: [], sprites: {}, stroke: 0, arrived: false,
  };

  // ---------- Спрайты (рисуются один раз) ----------
  function sprite(key, w, h, draw) {
    if (!st.sprites[key]) {
      const c = OM.makeCanvas(w * 2, h * 2);
      const g = c.getContext('2d');
      g.scale(2, 2);
      draw(g, w, h);
      st.sprites[key] = { c, w, h };
    }
    return st.sprites[key];
  }
  function makeSprites() {
    sprite('chimney', 60, 220, (g, w, h) => {
      P.fillV(g, 14, 20, 32, h - 20, [[0, '#3a2a2a'], [1, '#1a1214']]);
      for (let y = 20; y < h; y += 8) { g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(14, y, 32, 1); }
      g.fillStyle = '#1a1214';
      g.fillRect(10, 14, 40, 8);
      g.fillStyle = 'rgba(160,180,210,.18)';
      g.fillRect(40, 20, 4, h - 20);
    });
    for (let v = 0; v < 3; v++) {
      sprite('tree' + v, 220, 320, (g, w, h) => {
        g.strokeStyle = '#151820';
        g.fillStyle = '#151820';
        g.lineCap = 'round';
        const r = rng(500 + v);
        g.beginPath();
        g.moveTo(104, h);
        g.lineTo(108, h * 0.45);
        g.lineTo(114, h * 0.45);
        g.lineTo(118, h);
        g.fill();
        P.branch(g, 111, h * 0.5, 90, -Math.PI / 2 + (r() - 0.5) * 0.4, 7, 6, r);
      });
    }
    sprite('cross', 80, 140, (g) => {
      g.fillStyle = '#141820';
      g.save();
      g.translate(40, 140);
      g.rotate(0.15);
      g.fillRect(-4, -130, 8, 130);
      g.fillRect(-26, -108, 52, 7);
      g.fillRect(-18, -86, 36, 5);
      g.restore();
    });
    sprite('tall', 140, 460, (g) => {
      A.tall(g, { x: 70, y: 470, s: 1.12, face: -1, alpha: 1, jitter: 0, body: '#06080c', face2: 1.6 }, 0);
    });
    sprite('church', 640, 560, (g, w, h) => {
      const base = h, cx = 360;
      g.fillStyle = '#1a1e2a';
      g.fillRect(cx - 170, base - 230, 340, 230);
      g.fillRect(cx - 80, base - 330, 160, 110);
      g.beginPath();
      g.moveTo(cx - 92, base - 326);
      g.quadraticCurveTo(cx - 100, base - 420, cx, base - 470);
      g.quadraticCurveTo(cx + 100, base - 420, cx + 92, base - 326);
      g.fill();
      g.fillRect(cx - 4, base - 540, 8, 80);
      g.fillRect(cx - 24, base - 516, 48, 7);
      // колокольня
      g.fillRect(cx - 300, base - 400, 90, 400);
      g.beginPath();
      g.moveTo(cx - 312, base - 400);
      g.lineTo(cx - 255, base - 520);
      g.lineTo(cx - 198, base - 400);
      g.fill();
      // окна — лунный свет насквозь
      g.fillStyle = 'rgba(180,200,230,.35)';
      [[-120, -190], [-40, -190], [40, -190], [120, -190], [-30, -300], [20, -300]].forEach(([dx, dy]) => {
        g.beginPath();
        g.moveTo(cx + dx - 10, base + dy + 50);
        g.lineTo(cx + dx - 10, base + dy);
        g.arc(cx + dx, base + dy, 10, Math.PI, 0);
        g.lineTo(cx + dx + 10, base + dy + 50);
        g.fill();
      });
      g.fillStyle = 'rgba(255,210,150,.6)';
      g.fillRect(cx - 270, base - 370, 30, 50);
      g.fillStyle = 'rgba(200,215,235,.12)';
      g.fillRect(cx + 150, base - 230, 20, 230);
    });
  }

  function placeObjects() {
    const r = rng(77);
    st.objs = [];
    for (let i = 0; i < 110; i++) {
      const z = 30 + r() * 430, x = (r() - 0.5) * 240;
      if (Math.abs(x - CHURCH.x) < 40 && z > 380) continue;
      const k = r();
      st.objs.push({ x, z, type: k < 0.35 ? 'chimney' : k < 0.75 ? 'tree' + ((r() * 3) | 0) : 'cross', s: 0.8 + r() * 0.5 });
    }
    // те, кто стоит в воде, — поперёк пути
    [[-30, 90], [12, 160], [-14, 240], [26, 300], [-6, 360], [10, 410]].forEach(([x, z]) => st.objs.push({ x, z, type: 'tall', s: 1 }));
    st.objs.push({ x: CHURCH.x, z: CHURCH.z, type: 'church', s: 1 });
  }

  function project(x, z) {
    const dx = x - st.px, dz = z - st.pz;
    const c = Math.cos(st.head), s = Math.sin(st.head);
    const rx = dx * c - dz * s, rz = dx * s + dz * c;
    if (rz < 0.5) return null;
    return { sx: W / 2 + (rx / rz) * FOCAL, sy: HZ + (CAM_H / rz) * FOCAL, sc: FOCAL / rz, rz, rx };
  }

  function paint(g) {
    // ночное небо после заката, луна в дымке
    P.fillV(g, 0, 0, W, HZ + 40, [[0, '#070a16'], [0.6, '#18203a'], [1, '#3a4258']]);
    P.stars(g, 41, 140, 220, 0.6);
    P.clouds(g, 42, { y0: 40, y1: 220, n: 10, color: '#2a3048', a: 0.5, size: [160, 320], flat: 0.25 });
  }

  function back(ctx, t) {
    const head = st.head;
    // луна
    const mx = W / 2 + Math.tan(clamp(MOON_BEARING - head, -1.2, 1.2)) * FOCAL;
    P.moon(ctx, mx, 120, 22, 0.9);
    // дальний берег-полоса
    ctx.fillStyle = '#1a2030';
    ctx.fillRect(0, HZ - 6, W, 8);
    // вода
    P.fillV(ctx, 0, HZ, W, H - HZ, [[0, '#2c3550'], [0.15, '#141c2c'], [1, '#05080e']]);
    // лунная дорожка
    for (let i = 0; i < 40; i++) {
      const y = HZ + 2 + i * 9 + i * i * 0.08;
      if (y > H) break;
      const w = 10 + i * 4 + Math.sin(t * 1.4 + i * 1.7) * 8;
      ctx.fillStyle = `rgba(210,220,240,${0.3 - i * 0.006})`;
      ctx.fillRect(mx - w / 2 + Math.sin(t + i * 2.1) * (3 + i * 0.8), y, w, 1.5);
    }
    // рябь в перспективе, плывёт навстречу
    const z0 = Math.ceil(st.pz / 3) * 3;
    for (let i = 1; i < 60; i++) {
      const wz = z0 + i * 3;
      const rz0 = wz - st.pz;
      const y = HZ + (CAM_H / rz0) * FOCAL;
      if (y > H || y < HZ) continue;
      const a = clamp(0.22 * (1 - rz0 / 180), 0, 0.22);
      for (let j = -6; j <= 6; j++) {
        const wx = Math.round(st.px / 6) * 6 + j * 6 + ((i * 7) % 3);
        const p = project(wx, wz);
        if (!p) continue;
        const len = 14 * p.sc * 0.05 + 2;
        ctx.fillStyle = `rgba(170,190,220,${a})`;
        ctx.fillRect(p.sx, p.sy, len, 1);
      }
    }
    // объекты: от дальних к ближним
    const vis = [];
    for (const o of st.objs) {
      const p = project(o.x, o.z);
      if (!p || p.rz > 300 || p.sx < -500 || p.sx > W + 500) continue;
      vis.push([o, p]);
    }
    vis.sort((a, b) => b[1].rz - a[1].rz);
    for (const [o, p] of vis) {
      const sp = st.sprites[o.type];
      if (!sp) continue;
      const fog = o.type === 'church' ? clamp(1 - (p.rz - 60) / 260, 0, 1) : Math.exp(-p.rz / 150);
      if (fog < 0.02) continue;
      const hM = o.type === 'church' ? 34 : o.type === 'tall' ? 4.6 : o.type === 'chimney' ? 3.6 : o.type === 'cross' ? 2.2 : 5.5;
      const hpx = hM * p.sc * o.s * 0.75;
      const wpx = (hpx * sp.w) / sp.h;
      const bob = o.type === 'tall' ? Math.sin(t * 0.8 + o.z) * 0.5 : 0;
      ctx.save();
      ctx.globalAlpha = fog;
      ctx.drawImage(sp.c, p.sx - wpx / 2, p.sy - hpx + bob, wpx, hpx);
      // отражение
      ctx.globalAlpha = fog * 0.25;
      ctx.translate(0, p.sy * 2);
      ctx.scale(1, -1);
      ctx.drawImage(sp.c, p.sx - wpx / 2, p.sy - hpx, wpx, hpx);
      ctx.restore();
      if (o.type === 'church' && fog > 0.3) P.glow(ctx, p.sx - wpx * 0.39, p.sy - hpx * 0.62, 30 + wpx * 0.1, '#ffd0a0', 0.4 * fog);
    }
    // туман слоями
    P.fogBand(ctx, t, HZ + 10, 140, 6 + st.speed * 0.5, 0.55);
    P.fogBand(ctx, t + 20, HZ + 90, 160, -4, 0.35);
    P.fogBand(ctx, t + 50, HZ + 220, 200, 3, 0.18);
  }

  // Нос лодки, фонарь, вёсла.
  function over(ctx, t) {
    // свет фонаря на воде
    P.eglow(ctx, W / 2, 640, 300, 60, '#ffb060', 0.18);
    // вёсла
    const ph = st.stroke;
    [-1, 1].forEach((sd) => {
      const a = Math.sin(ph) * 0.35;
      const lift = Math.max(0, Math.cos(ph)) * 30;
      const bx = W / 2 + sd * 230, by = 710;
      const ex = W / 2 + sd * (470 + Math.cos(ph) * 40), ey = 600 - lift + a * 40;
      ctx.strokeStyle = '#2a1e14';
      ctx.lineWidth = 9;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(ex, ey);
      ctx.stroke();
      ctx.fillStyle = '#3a2a1c';
      ctx.save();
      ctx.translate(ex, ey);
      ctx.rotate(Math.atan2(ey - by, ex - bx));
      P.rrect(ctx, 0, -12, 60, 24, 8);
      ctx.fill();
      ctx.restore();
      if (lift < 4) {
        ctx.fillStyle = 'rgba(200,215,235,.25)';
        ctx.beginPath();
        ctx.ellipse(ex + sd * 30, ey + 12, 34, 5, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    // нос лодки
    ctx.fillStyle = '#2a1e16';
    ctx.beginPath();
    ctx.moveTo(W / 2 - 260, H);
    ctx.quadraticCurveTo(W / 2 - 60, 660, W / 2, 612);
    ctx.quadraticCurveTo(W / 2 + 60, 660, W / 2 + 260, H);
    ctx.fill();
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(W / 2 - 200, H);
    ctx.quadraticCurveTo(W / 2 - 40, 680, W / 2, 640);
    ctx.quadraticCurveTo(W / 2 + 40, 680, W / 2 + 200, H);
    ctx.clip();
    ctx.fillStyle = '#5a4630';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(0,0,0,.35)';
    ctx.lineWidth = 1.2;
    for (let i = -4; i <= 4; i++) { ctx.beginPath(); ctx.moveTo(W / 2 + i * 6, 640); ctx.lineTo(W / 2 + i * 40, H); ctx.stroke(); }
    ctx.restore();
    // фонарь на шесте
    ctx.strokeStyle = '#1a120c';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(W / 2, 640);
    ctx.lineTo(W / 2 + 6, 560);
    ctx.stroke();
    const sw = Math.sin(t * 1.3) * 3;
    ctx.fillStyle = '#2a2018';
    ctx.fillRect(W / 2 - 6 + sw, 560, 24, 4);
    ctx.fillStyle = '#ffcf80';
    ctx.fillRect(W / 2 + sw + 2, 566, 10, 14);
    P.glow(ctx, W / 2 + 7 + sw, 572, 70, '#ffb060', 0.6);
    // подсказка поворота
    const dirv = steerDir();
    if (dirv) {
      ctx.fillStyle = 'rgba(255,214,150,.35)';
      const x = dirv < 0 ? 40 : W - 40;
      ctx.beginPath();
      ctx.moveTo(x + dirv * -14, 330);
      ctx.lineTo(x + dirv * 14, 360);
      ctx.lineTo(x + dirv * -14, 390);
      ctx.fill();
    }
  }

  // Нить в режиме нитей ведёт к церкви — подсказка для тех, кто без наушников.
  function threads(ctx, t, k) {
    const p = project(CHURCH.x, CHURCH.z);
    const tx = p ? clamp(p.sx, -100, W + 100) : (Math.sin(Math.atan2(CHURCH.x - st.px, CHURCH.z - st.pz) - st.head) > 0 ? W + 100 : -100);
    OM.thread(ctx, [W / 2 + 7, 570], [tx, HZ - 40], t, { color: '#ffd27a', a: k, sag: -30, w: 2.2 });
  }

  function steerDir() {
    if (!st.active) return 0;
    const K = G.keys || {};
    let d = 0;
    if (K.ArrowLeft || K.a || K.A || K['ф']) d -= 1;
    if (K.ArrowRight || K.d || K.D || K['в']) d += 1;
    if (G.mouse.down && !G.busy) d += G.mouse.x < W / 2 ? -1 : 1;
    return clamp(d, -1, 1);
  }

  function update(dt, t) {
    if (!st.active) return;
    const d = steerDir();
    st.turn = lerp(st.turn, d * 0.55, Math.min(1, dt * 4));
    st.head += st.turn * dt;
    st.speed = lerp(st.speed, 7, Math.min(1, dt * 0.6));
    st.px += Math.sin(st.head) * st.speed * dt;
    st.pz += Math.cos(st.head) * st.speed * dt;
    const prev = st.stroke;
    st.stroke += dt * 2.2;
    if (Math.floor(prev / (Math.PI * 2)) !== Math.floor(st.stroke / (Math.PI * 2))) S.oar();
    // колокол: направление — в наушниках
    const dx = CHURCH.x - st.px, dz = CHURCH.z - st.pz;
    const dist = Math.hypot(dx, dz);
    let rel = Math.atan2(dx, dz) - st.head;
    rel = Math.atan2(Math.sin(rel), Math.cos(rel));
    st.bell -= dt;
    if (st.bell <= 0) {
      st.bell = 4.2;
      S.bigBell(clamp(Math.sin(rel) * 1.4, -1, 1), clamp(1.2 - dist / 600, 0.35, 1));
    }
    // подсказки Никодима, если долго плывём не туда
    st.offFor = Math.abs(rel) > 0.55 ? st.offFor + dt : 0;
    st.hintCd -= dt;
    if (st.offFor > 5 && st.hintCd <= 0 && !G.saying) {
      st.hintCd = 7;
      OM.say('nik', rel < 0 ? 'Левее бери. Слушай звон — он слева.' : 'Правее. Звон справа, слышишь?');
    }
    // столкновение с теми, кто стоит в воде
    for (const o of st.objs) {
      if (o.type !== 'tall') continue;
      const p = project(o.x, o.z);
      if (p && p.rz < 3.5 && Math.abs(p.rx) < 3.2) {
        st.hits++;
        st.pz -= 22;
        st.speed = 0;
        S.hit();
        S.whisper(1.5, 0.18);
        OM.shake(14);
        G.fx.warp = 1;
        if (!G.saying) OM.say('nik', st.hits > 1 ? 'Не на них смотри! На звон!' : 'Назад! Обходи их. Не трогай.');
        break;
      }
    }
    G.fx.warp = Math.max(0, (G.fx.warp || 0) - dt * 0.8);
    if (dist < 45 && !st.arrived) {
      st.arrived = true;
      st.active = false;
      OM.run(() => OM.story3.arriveChurch());
    }
  }

  OM.scene('lake', {
    name: 'Озеро',
    noWalk: true,
    figLight: { amb: 0.4, tint: '#2a3450' },
    amb: { water: 1, wind: 0.6, drone: 0.4 },
    vignette: 1,
    entries: { default: { x: -500, y: 700, face: 1 } },
    paint,
    back,
    over,
    threads,
    update,
    hotspots: [],
    onClick() { return true; },
    setup() {
      G.hero.visible = false;
      makeSprites();
      placeObjects();
      Object.assign(st, { active: false, px: 0, pz: 0, head: -0.7, turn: 0, speed: 0, bell: 1, offFor: 0, hintCd: 3, hits: 0, arrived: false });
    },
    leave() { G.hero.visible = true; },
    async enter() { await OM.story3.startRowing(); },
  });

  OM.lake = { st };
})();
