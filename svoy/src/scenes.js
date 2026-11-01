// Сцены: улица за дверью ночью, изба днём, утро, титул, финал. Эффекты проверок.
(function () {
  const G = SV.G, U = SV.U, P = SV.P;
  const Sc = (SV.Sc = {});
  let b; // кисть основного холста
  let shadowCv = null;
  const W = G.W, H = G.H;

  Sc.init = () => { b = G.brush(G.ctx); };

  // Статичный задник улицы рисуем один раз в отдельный холст.
  let nightBg = null;
  function makeNightBg() {
    const [c, x] = G.mk(); const k = G.brush(x); const r = U.rng(7);
    k.grad(0, 0, W, 96, '#05070f', '#1a2440', 7);
    for (let i = 0; i < 30; i++) k.p(r.int(0, W), r.int(0, 60), r.chance(0.3) ? '#8a98b8' : '#4a5878');
    // Лес на горизонте.
    for (let X = 0; X < W; X++) {
      const h = 10 + Math.abs(Math.sin(X * 0.35) * 8) + Math.abs(Math.sin(X * 0.13 + 2) * 6) + (X % 7 === 0 ? 6 : 0);
      k.r(X, 92 - h, 1, h + 4, '#0a101e');
    }
    // Дальняя изба с тёмным окном.
    k.r(14, 80, 26, 14, '#10141e'); for (let i = 0; i < 14; i++) k.r(13 + i, 80 - i * 0.6, 28 - i * 2, 1, '#121826');
    k.r(24, 84, 5, 4, '#1c2232');
    // Снег на земле.
    k.grad(0, 96, W, H - 96, '#2a3452', '#4a5878', 6);
    // Пятно фонаря на снегу.
    k.glow(132, 128, 60, '#ffb060', 0.9);
    // Забор.
    for (let X = 0; X < W; X += 6) { k.r(X, 96, 4, 18, '#141822'); k.r(X, 95, 4, 1, '#a8b8d0'); k.r(X + 1, 94, 2, 1, '#8898b0'); }
    k.r(0, 100, W, 2, '#10141c'); k.r(0, 108, W, 2, '#10141c'); k.r(0, 99, W, 1, '#7888a4');
    // Фонарный столб.
    k.r(136, 26, 3, 100, '#0c0e14'); k.r(130, 24, 14, 3, '#1a1c24');
    return c;
  }

  function lantern(t) {
    const fl = 0.85 + Math.sin(t * 13) * 0.04 + Math.sin(t * 5.3) * 0.05;
    b.x.save(); b.x.globalAlpha = 0.5 * fl;
    b.glow(137, 30, 40, '#ffc070', 1);
    b.x.restore();
    b.r(133, 27, 8, 4, '#ffd890'); b.r(134, 31, 6, 1, '#c89050');
  }

  // Дверная рама и цепочка — мы смотрим в щель приоткрытой двери.
  function frame(t) {
    const wood = '#2a1a10', woodL = '#40281a';
    b.r(0, 0, 7, H, wood); b.r(6, 0, 1, H, woodL);
    b.r(W - 7, 0, 7, H, wood); b.r(W - 7, 0, 1, H, '#1a0e08');
    b.r(0, 0, W, 5, wood); b.r(0, 4, W, 1, woodL);
    for (let y = 10; y < H; y += 22) { b.r(1, y, 4, 1, '#1a0e08'); b.r(W - 5, y + 11, 4, 1, woodL); }
    // Цепочка.
    for (let i = 0; i < 26; i++) {
      const X = 7 + i * 2.4, Y = 134 + Math.sin((i / 25) * Math.PI) * 6 + Math.sin(t * 2) * 0.4;
      b.r(X, Y, 2, i % 2 ? 1 : 2, i % 2 ? '#7a7a84' : '#a8a8b4');
    }
    b.r(68, 136, 4, 6, '#5a5a64');
  }

  // Состояние ночной сцены задаёт игра: { v, fx, fxT, mouth, leave, enter, reveal, empty, dark }
  Sc.night = function (t, dt, st) {
    if (!nightBg) nightBg = makeNightBg();
    b.x.drawImage(nightBg, 0, 0);
    lantern(t);
    const v = st.v;
    const fx = st.fx, ft = fx ? t - st.fxT : 0;

    if (v && !st.empty) {
      const L = v.look, an = P.anchor(L);
      // Анимации: моргание (у Похожих без моргания — не моргают), речь, уход, вход.
      const noBlink = v.mimic && v.tellKind && v.tellKind.face === 'noblink';
      let blink = !noBlink && (t % 3.7 < 0.13 || (t + 1.3) % 5.1 < 0.12);
      let mouth = st.mouth || 'closed';
      let light = fx === 'shadow' ? 'flash' : 'night';
      let stare = false;
      if (fx === 'face') {
        // Под взглядом: человек моргает, Похожий — нет; на 2-й секунде улыбка.
        blink = !noBlink && (ft % 1.6 > 0.9 && ft % 1.6 < 1.05);
        stare = noBlink;
        if (ft > 1.8) mouth = v.mimic && v.tellKind.face === 'teeth' ? 'teeth' : (!v.mimic && v.quirk && v.quirk.face === 'gap' ? 'gap' : 'smile');
      }
      if (st.reveal != null && t - st.reveal > 0.3) mouth = 'teeth';
      const pc = P.draw(L, { blink, mouth, light, stare, red: !v.mimic && v.quirk && v.quirk.face === 'red' && fx === 'face' });

      // Тень от фонаря — за спиной гостя на заборе.
      if (fx === 'shadow') {
        const kind = (v.mimic && v.tellKind.shadow) || 'ok';
        if (kind !== 'none') {
          const [sc, sx] = shadowCv || (shadowCv = G.mk()); sx.globalCompositeOperation = 'source-over'; sx.clearRect(0, 0, W, H); sx.drawImage(pc, 0, 0);
          sx.globalCompositeOperation = 'source-in'; sx.fillStyle = '#04060c'; sx.fillRect(0, 0, W, H);
          b.x.save(); b.x.globalAlpha = Math.min(0.75, ft * 1.5);
          if (kind === 'wrong') {
            const tw = Math.sin(ft * 2) * 6;
            b.x.drawImage(sc, -24 + tw, -26, W * 1.15, H * 1.15);
            // Тень тянет руку к двери.
            b.x.fillStyle = '#04060c';
            for (let i = 0; i < 30; i++) b.x.fillRect(40 + i * 2.2, 70 + i * 1.2 + Math.sin(i * 0.5 + ft * 3) * 2, 4, 3);
          } else b.x.drawImage(sc, -14, -24, W * 1.15, H * 1.15);
          b.x.restore();
        }
      }

      // Позиция гостя: уход и вход.
      let ox = 0, oy = 0, sc = 1, alpha = 1;
      if (st.leave != null) { const k = U.clamp((t - st.leave) / 1.8, 0, 1); ox = k * 50; oy = -k * 40; sc = 1 - k * 0.55; alpha = 1 - k; }
      if (st.enter != null) { const k = U.clamp((t - st.enter) / 1.2, 0, 1); sc = 1 + k * 0.5; oy = k * 30; alpha = 1 - k; }
      if (st.arrive != null) { const k = U.clamp((t - st.arrive) / 1.0, 0, 1); alpha = k; oy = (1 - k) * 6; }
      if (st.reveal != null) { const k = t - st.reveal; if (k > 1.4) alpha = 0; else if (k > 1.1) { ox = (Math.random() - 0.5) * 8; } }
      b.x.save(); b.x.globalAlpha = alpha;
      const w2 = W * sc, h2 = H * sc;
      b.x.drawImage(pc, 80 - w2 / 2 + ox, H - h2 + oy, w2, h2);
      b.x.restore();

      // Пар изо рта.
      if (fx === 'breath') breath(ft, v, an);
      if (st.talking && !fx && Math.random() < 0.05 && !(v.mimic && v.tellKind.breath)) puffs.push({ x: an.cx, y: an.mouthY + 2, t: 0, a: 0.4 });
      drawPuffs(dt);
    }

    G.snow(b, t, dt);
    frame(t);
    if (fx === 'hands' && v) hands(ft, v);
    if (fx === 'mirror' && v) mirror(ft, v, t);
    if (fx === 'dog' && v) dog(ft, v, t);
    if (fx === 'face' && v) zoom(ft);
    if (fx === 'shadow') { b.x.save(); b.x.globalAlpha = 0.18; b.x.fillStyle = '#fff0c0'; b.x.beginPath(); b.x.moveTo(60, H); b.x.lineTo(100, H); b.x.lineTo(150, 0); b.x.lineTo(10, 0); b.x.fill(); b.x.restore(); }
    if (st.dark) { b.x.save(); b.x.globalAlpha = st.dark; b.r(0, 0, W, H, '#000'); b.x.restore(); }
    if (st.enter != null) { const k = U.clamp((t - st.enter) / 1.2, 0, 1); b.x.save(); b.x.globalAlpha = Math.sin(k * Math.PI) * 0.35; b.r(0, 0, W, H, '#ffb060'); b.x.restore(); }
  };

  // Частицы пара.
  const puffs = [];
  function breath(ft, v, an) {
    const tell = v.mimic && v.tellKind.breath === 'tell';
    const weak = !v.mimic && v.quirk && v.quirk.breath === 'weak';
    if (tell) return;
    const phase = ft % 1.6;
    if (phase < 0.6 && Math.random() < (weak ? 0.25 : 0.8)) puffs.push({ x: an.cx + (Math.random() - 0.5) * 3, y: an.mouthY + 2, t: 0, a: weak ? 0.35 : 0.7 });
  }
  function drawPuffs(dt) {
    for (let i = puffs.length - 1; i >= 0; i--) {
      const p = puffs[i]; p.t += dt;
      if (p.t > 2) { puffs.splice(i, 1); continue; }
      const k = p.t / 2, rr = 2 + k * 9;
      b.x.save(); b.x.globalAlpha = p.a * (1 - k) * 0.6;
      b.ell(p.x + k * 18, p.y - k * 22, rr, rr * 0.7, '#e8f0f8');
      b.x.restore();
    }
  }

  // Ладонь, прижатая к стеклу.
  function hands(ft, v) {
    const k = U.clamp(ft / 0.5, 0, 1), Y = H - 8 - k * 62;
    const kind = v.mimic ? (v.tellKind.hands || 'ok') : (v.quirk && v.quirk.hands) || 'ok';
    const skin = kind === 'nonails' ? '#a8a49c' : U.mix(v.look.skin, '#ffffff', 0.15);
    const n = kind === 'six' ? 6 : 5, fw = kind === 'six' ? 6 : 7, X0 = 80 - (n * fw) / 2;
    // Иней вокруг.
    b.x.save(); b.x.globalAlpha = 0.35; b.ell(80, Y + 44, 34, 40, '#cfe0f4'); b.x.restore();
    b.r(X0 - 2, Y + 30, n * fw + 4, 40, skin);
    b.r(X0 - 2, Y + 30, 2, 40, U.shade(skin, 0.85));
    for (let i = 0; i < n; i++) {
      const len = [24, 30, 32, 29, 22, 20][i] || 22, X = X0 + i * fw;
      b.r(X, Y + 30 - len, fw - 1, len + 2, skin);
      b.r(X + fw - 2, Y + 30 - len, 1, len, U.shade(skin, 0.85));
      const nail = kind === 'nonails' ? skin : kind === 'dirty' ? '#2a2018' : '#ecd4c4';
      b.r(X + 1, Y + 30 - len + 1, fw - 3, 4, nail);
      if (kind === 'bandage' && i === 2) { b.r(X, Y + 30 - len + 6, fw - 1, 10, '#e8e4d8'); b.r(X + 2, Y + 30 - len + 9, 2, 3, '#a02020'); }
    }
    // Большой палец.
    b.r(X0 + n * fw + 1, Y + 40, 8, 6, skin); b.r(X0 + n * fw + 7, Y + 34, 5, 10, skin);
  }

  // Зеркальце в щели.
  function mirror(ft, v, t) {
    const k = U.clamp(ft / 0.5, 0, 1), cx = 118, cy = H - 4 - k * 46, R = 26;
    b.r(cx - 2, cy + R, 5, 30, '#5a4a30');
    b.ell(cx, cy, R + 3, R + 3, '#8a7a5a');
    b.x.save();
    b.x.beginPath(); b.x.arc(cx, cy, R, 0, Math.PI * 2); b.x.clip();
    b.x.drawImage(nightBg, 40, 40, 80, 120, cx - R, cy - R, R * 2, R * 2 * 1.5);
    const kind = (v.mimic && v.tellKind.mirror) || 'ok';
    if (kind !== 'empty') {
      const pc = P.draw(v.look, { blink: !v.mimic && t % 3 < 0.15, mouth: kind === 'smile' ? 'teeth' : 'closed', light: 'night' });
      b.x.translate(cx, cy); b.x.scale(-1, 1);
      b.x.drawImage(pc, 40, 50, 80, 90, -R, -R + 4, R * 2, R * 2.25);
    }
    b.x.restore();
    b.x.save(); b.x.globalAlpha = 0.25; b.r(cx - 14, cy - 18, 3, 10, '#ffffff'); b.r(cx - 11, cy - 20, 2, 4, '#ffffff'); b.x.restore();
  }

  // Жучка у двери.
  function dog(ft, v, t) {
    const kind = v.mimic ? (v.tellKind.dog ? 'growl' : 'ok') : (v.quirk && v.quirk.dog === 'bark') ? 'bark' : 'ok';
    const k = U.clamp(ft / 0.6, 0, 1);
    const back = kind === 'growl' ? Math.min(1, ft / 2) * 10 : 0;
    const X = -30 + k * 66 - back, Y = H - 22;
    Sc.dogSprite(b, X, Y, kind, t);
  }
  Sc.dogSprite = function (k, X, Y, kind, t, lying) {
    const fur = '#b0602a', furD = '#7a3e1a', furL = '#d8904a';
    if (lying) {
      k.ell(X + 12, Y + 6, 14, 5, fur); k.ell(X + 26, Y + 3, 6, 5, fur);
      k.r(X + 28, Y - 3, 3, 4, furD); k.r(X + 22, Y - 3, 3, 4, furD);
      k.p(X + 28, Y + 2, '#1a1010'); k.r(X + 31, Y + 4, 2, 2, '#1a1010');
      const wag = Math.sin(t * 2) > 0.9 ? 1 : 0;
      k.r(X - 4, Y + 4 - wag, 6, 2, fur);
      return;
    }
    // Тело.
    k.ell(X + 14, Y + 6, 16, 7, fur); k.r(X + 2, Y + 10, 26, 2, furD);
    // Лапы.
    for (const lx of [X + 3, X + 8, X + 20, X + 25]) k.r(lx, Y + 11, 3, 8, furD);
    // Хвост.
    if (kind === 'growl') k.r(X - 3, Y + 8, 6, 2, furD);
    else { const w = Math.sin(t * (kind === 'bark' ? 18 : 12)) * 4; k.r(X - 4, Y - 1 + w, 3, 7, fur); k.r(X - 5, Y - 3 + w, 3, 3, furL); }
    // Голова.
    const hx = X + 30, hy = Y - 4 + (kind === 'growl' ? 4 : 0);
    k.ell(hx, hy, 7, 6, fur); k.r(hx + 4, hy + 1, 7, 5, furL);
    k.r(hx + 10, hy + 1, 2, 2, '#1a1010');
    k.p(hx + 1, hy - 2, '#1a1010');
    if (kind === 'growl') {
      k.r(hx - 5, hy - 4, 5, 2, furD); // уши прижаты
      k.r(hx + 5, hy + 4, 6, 2, '#f0ece0'); k.p(hx + 6, hy + 5, '#1a0808'); k.p(hx + 8, hy + 5, '#1a0808');
      for (let i = 0; i < 8; i++) k.r(X + 6 + i * 3, Y - 2 - (i % 2) * 2, 2, 3, furD); // шерсть дыбом
    } else {
      k.r(hx - 4, hy - 9, 3, 5, furD); k.r(hx + 1, hy - 9, 3, 5, furD);
      if (kind === 'bark' && Math.sin(t * 9) > 0) k.r(hx + 6, hy + 5, 5, 3, '#4a1010');
    }
  };

  // Крупный план лица: вырезка из портрета, увеличенная.
  let zoomSrc = null;
  function zoom(ft) {
    const k = U.clamp(ft / 0.4, 0, 1);
    if (!zoomSrc) zoomSrc = G.mk();
    // Берём уже нарисованный портрет (последний вызов P.draw), он в холсте модуля.
    b.x.save(); b.x.globalAlpha = k;
    b.r(0, 0, W, H, '#05070c');
    const L = Sc._zoomV.look, an = P.anchor(L);
    const pc = Sc._lastPc;
    b.x.drawImage(pc, an.cx - 22, an.eyeY - 10, 44, 28, 0, 30, W, 102);
    // Виньетка.
    b.x.globalAlpha = 0.5 * k;
    b.r(0, 30, W, 6, '#000'); b.r(0, 126, W, 6, '#000');
    b.x.restore();
    frame(0);
  }

  // Изба днём.
  let dayBg = null;
  function makeDayBg() {
    const [c, x] = G.mk(); const k = G.brush(x);
    for (let y = 0; y < 140; y += 8) {
      k.r(0, y, W, 8, (y / 8) % 2 ? '#5a3a22' : '#4e321e');
      k.r(0, y + 7, W, 1, '#2e1c10'); k.r(0, y + 1, W, 1, '#6a4a2c');
    }
    // Окно.
    k.r(10, 28, 44, 46, '#6a4a2a');
    k.grad(14, 32, 36, 38, '#c8d4e2', '#e8eef4', 4);
    k.r(14, 52, 36, 18, '#f0f4f8');
    for (let i = 0; i < 5; i++) k.r(16 + i * 7, 40 - (i % 2) * 4, 3, 14, '#8a98a8');
    k.r(31, 32, 2, 38, '#6a4a2a'); k.r(14, 49, 36, 2, '#6a4a2a');
    for (let i = 0; i < 40; i++) { const a = Math.random() * 6.28, rr = 14 + Math.random() * 6; k.p(32 + Math.cos(a) * rr * 1.1, 51 + Math.sin(a) * rr, '#ffffff'); }
    k.r(8, 74, 48, 3, '#7a5a3a');
    // Красный угол: икона.
    k.r(70, 10, 12, 14, '#c8a040'); k.r(72, 12, 8, 10, '#6a3020'); k.r(74, 14, 4, 4, '#d8b890');
    // Календарь.
    k.r(88, 34, 12, 16, '#e8e0cc'); k.r(88, 34, 12, 4, '#a02020'); for (let i = 0; i < 4; i++) k.r(90, 40 + i * 2, 8, 1, '#8a8070');
    // Печь.
    k.r(106, 30, 54, 120, '#d8d2c4'); k.r(106, 30, 3, 120, '#b8b0a0');
    k.r(116, 0, 18, 30, '#c8c0b0');
    for (let i = 0; i < 12; i++) k.r(110 + (i * 13) % 46, 40 + (i * 29) % 90, 6, 1, '#c4bcac');
    k.r(116, 104, 30, 24, '#2a1a12'); k.r(114, 102, 34, 2, '#8a8070');
    k.r(106, 86, 54, 3, '#b8b0a0');
    // Пол.
    k.r(0, 140, W, 36, '#3a2616');
    for (let X = 0; X < W; X += 14) k.r(X, 140, 1, 36, '#2a1a0e');
    // Лавка.
    k.r(4, 118, 96, 4, '#7a5232'); k.r(4, 122, 96, 2, '#5a3a22'); k.r(8, 124, 3, 16, '#4a2e1a'); k.r(92, 124, 3, 16, '#4a2e1a');
    // Стол с радио.
    k.r(40, 128, 50, 4, '#8a5e3a'); k.r(44, 132, 3, 12, '#5a3a22'); k.r(84, 132, 3, 12, '#5a3a22');
    return c;
  }

  Sc.day = function (t, dt, st) {
    if (!dayBg) dayBg = makeDayBg();
    b.x.drawImage(dayBg, 0, 0);
    // Огонь в печи.
    for (let i = 0; i < 16; i++) {
      const X = 118 + i * 1.7, hh = 6 + Math.abs(Math.sin(t * 7 + i * 1.7)) * 10 + Math.sin(t * 13 + i) * 3;
      b.r(X, 126 - hh, 2, hh, i % 3 ? '#f08a28' : '#ffd060');
    }
    b.x.save(); b.x.globalAlpha = 0.12 + Math.sin(t * 9) * 0.03; b.glow(130, 130, 50, '#ffa040', 1); b.x.restore();
    // Радио на столе.
    b.r(58, 114, 22, 14, '#3a2a20'); b.r(60, 116, 9, 10, '#5a4a3a');
    for (let y = 117; y < 126; y += 2) b.r(60, y, 9, 1, '#2a1e16');
    b.r(71, 117, 7, 3, '#c8a060'); b.r(72 + ((t * 2) % 5), 117, 1, 3, '#a02020');
    b.r(74, 108, 1, 6, '#8a8a8a');
    if (st.radioOn) { b.x.save(); b.x.globalAlpha = 0.5 + Math.sin(t * 20) * 0.3; b.r(71, 121, 2, 2, '#60f060'); b.x.restore(); }
    // Кружка.
    b.r(46, 122, 5, 6, '#e8e0d0'); b.r(51, 123, 2, 3, '#e8e0d0');
    // Гости на лавке.
    const gs = st.guests || [];
    gs.forEach((g, i) => {
      const X = 14 + i * 12 + (i >= 7 ? -84 : 0), Y = i >= 7 ? 150 : 124;
      P.mini(b, g.look, X, Y, { bob: Math.sin(t * 1.5 + i) > 0.95 ? -1 : 0, blink: !(g.mimic && g.tellKind.face === 'noblink') && (t + i * 0.7) % 4 < 0.15 });
      if (st.sel === g.id) { b.r(X - 1, Y - 26 + (g.look.age === 'kid' ? 4 : 0), 3, 2, '#ffe08a'); }
    });
    // Жучка у печи.
    Sc.dogSprite(b, 112, 158, 'ok', t, true);
    // Хозяин — у стола.
    b.r(94, 120, 9, 14, '#4a4a5a'); b.r(95, 112, 7, 8, '#e0b090'); b.r(95, 111, 7, 3, '#5a5a6a'); b.r(95, 134, 3, 6, '#2a2420'); b.r(100, 134, 3, 6, '#2a2420');
    // Лучи из окна.
    b.x.save(); b.x.globalAlpha = 0.06; b.x.fillStyle = '#ffffff'; b.x.beginPath(); b.x.moveTo(14, 32); b.x.lineTo(50, 32); b.x.lineTo(100, 150); b.x.lineTo(40, 160); b.x.fill(); b.x.restore();
    if (st.cold) { b.x.save(); b.x.globalAlpha = st.cold; b.r(0, 0, W, H, '#5a7ab0'); b.x.restore(); }
  };

  // Утро: двор, калитка, следы.
  Sc.morning = function (t, dt, st) {
    b.grad(0, 0, W, 90, '#7a8aa8', '#d0d8e4', 6);
    for (let X = 0; X < W; X++) { const h = 8 + Math.abs(Math.sin(X * 0.3) * 7) + Math.abs(Math.sin(X * 0.11 + 1) * 5); b.r(X, 88 - h, 1, h + 2, '#4a5a6a'); }
    b.grad(0, 88, W, H - 88, '#c8d4e4', '#f0f4fa', 4);
    for (let X = 0; X < W; X += 6) { b.r(X, 92, 4, 18, '#5a4a3a'); b.r(X, 91, 4, 2, '#ffffff'); }
    b.r(0, 98, W, 2, '#4a3a2a');
    // Калитка.
    b.r(70, 90, 24, 22, '#6a5038'); b.r(70, 89, 24, 2, '#ffffff'); b.r(81, 90, 2, 22, '#4a3a2a');
    // Следы.
    const n = st.tracks || 0;
    for (let i = 0; i < n * 6; i++) { const Y = 116 + i * 9, X = 82 + Math.sin(i * 0.8) * 6 + (i % 2 ? 4 : -4); if (Y < H) { b.r(X, Y, 3, 2, '#9aaac0'); } }
    if (st.mound) { b.ell(58, 118, 12, 5, '#ffffff'); b.ell(58, 117, 10, 4, '#e8f0f8'); b.r(52, 118, 3, 2, st.mound); }
    G.snow(b, t, dt, { alpha: 0.5, speed: 0.4, wind: 2 });
  };

  // Титул: изба ночью, в окне свет, у забора кто-то стоит.
  Sc.title = function (t, dt) {
    if (!nightBg) nightBg = makeNightBg();
    b.x.drawImage(nightBg, 0, 0);
    // Изба.
    b.r(36, 84, 88, 54, '#1e1610'); for (let y = 86; y < 138; y += 5) b.r(36, y, 88, 1, '#16100c');
    for (let i = 0; i < 30; i++) b.r(30 + i * 1.66, 84 - i, 100 - i * 3.33, 1, i < 3 ? '#c8d4e6' : '#141018');
    for (let i = 0; i < 30; i++) b.p(32 + i * 1.6, 84 - i, '#d8e4f4');
    for (let i = 0; i < 30; i++) b.p(128 - i * 1.6, 84 - i, '#d8e4f4');
    b.r(98, 50, 8, 20, '#141018'); b.r(98, 49, 8, 2, '#d8e4f4');
    // Окна.
    const fl = 0.9 + Math.sin(t * 8) * 0.05 + Math.sin(t * 3.1) * 0.05;
    b.x.save(); b.x.globalAlpha = 0.35 * fl; b.glow(62, 108, 34, '#ffa040', 1); b.x.restore();
    b.r(54, 98, 16, 18, '#ffb050'); b.r(61, 98, 2, 18, '#2a1a10'); b.r(54, 106, 16, 2, '#2a1a10'); b.r(52, 116, 20, 2, '#d8e4f4');
    b.r(92, 98, 16, 18, '#1a1420'); b.r(99, 98, 2, 18, '#2a1a10'); b.r(92, 106, 16, 2, '#2a1a10');
    // Дым.
    for (let i = 0; i < 8; i++) { const k = ((t * 0.15 + i / 8) % 1); b.x.save(); b.x.globalAlpha = 0.25 * (1 - k); b.ell(102 + k * 20 + Math.sin(k * 6 + t) * 3, 48 - k * 44, 3 + k * 6, 2 + k * 4, '#5a6478'); b.x.restore(); }
    // Сугроб.
    b.r(0, 136, W, 40, '#3a4664'); b.ell(80, 138, 70, 4, '#4a5878');
    // Фигура у забора: стоит, а когда моргнёт свет — переместилась.
    const pos = Math.floor(t / 7) % 3, fx = [18, 146, 24][pos];
    const vis = (t % 7) > 0.4;
    if (vis) { b.r(fx, 98, 4, 12, '#05060a'); b.r(fx, 95, 4, 4, '#05060a'); if ((t % 7) > 6) { b.p(fx + 1, 96, '#d8d0c0'); b.p(fx + 2, 96, '#d8d0c0'); } }
    lantern(t);
    G.snow(b, t, dt);
  };

  // Финал: рассвет и колонна. st.kind: 'good'|'bad'|'few'|'dead'|'cold'
  Sc.end = function (t, dt, st) {
    if (st.kind === 'dead' || st.kind === 'cold') {
      if (!dayBg) dayBg = makeDayBg();
      b.x.drawImage(dayBg, 0, 0);
      b.x.save(); b.x.globalAlpha = 0.65; b.r(0, 0, W, H, st.kind === 'cold' ? '#203050' : '#100808'); b.x.restore();
      if (st.kind === 'dead') { b.x.save(); b.x.globalAlpha = 0.6 + Math.sin(t) * 0.2; b.r(124, 104, 6, 2, '#f0ece0'); b.r(136, 104, 6, 2, '#f0ece0'); b.x.restore(); }
      G.snow(b, t, dt, { alpha: 0.3 });
      return;
    }
    b.grad(0, 0, W, 96, '#2a3050', '#e8a070', 7);
    b.x.save(); b.x.globalAlpha = 0.5; b.glow(110, 96, 50, '#ffd0a0', 1); b.x.restore();
    for (let X = 0; X < W; X++) { const h = 8 + Math.abs(Math.sin(X * 0.3) * 8); b.r(X, 94 - h, 1, h + 2, '#1a1a28'); }
    b.grad(0, 94, W, H - 94, '#8a8ab0', '#d8d8e8', 4);
    b.r(0, 116, W, 14, '#a8a8c0');
    // Грузовики.
    const off = Math.min(1, t / 4) * 40;
    for (let i = 0; i < 3; i++) {
      const X = -60 + off + i * 46;
      b.r(X, 100, 30, 16, '#3a4a2a'); b.r(X + 30, 104, 12, 12, '#4a5a32'); b.r(X + 33, 106, 6, 4, '#a8c0d0');
      b.ell(X + 8, 118, 4, 4, '#1a1a1a'); b.ell(X + 34, 118, 4, 4, '#1a1a1a');
      b.x.save(); b.x.globalAlpha = 0.4; b.glow(X + 44, 112, 14, '#fff0b0', 1); b.x.restore();
    }
    // Спасённые.
    (st.people || []).slice(0, 9).forEach((g, i) => {
      P.mini(b, g.look, 20 + i * 14, 150, { grin: st.kind === 'bad' && g.mimic && t > 3 && Math.floor(t * 2) % 5 === 0 });
    });
    G.snow(b, t, dt, { alpha: 0.4, speed: 0.4 });
  };

  // Поддержка зума: последний нарисованный портрет.
  const origDraw = P.draw;
  P.draw = function (L, st) { const c = origDraw(L, st); Sc._lastPc = c; return c; };
  Sc.setZoomVisitor = (v) => { Sc._zoomV = v; };
})();
