// Процедурные портреты гостей: лицо, шапка, тулуп, борода, очки. И маленькие фигурки для избы.
(function () {
  const G = SV.G, U = SV.U;
  const P = (SV.P = {});

  const SKIN = ['#e8b896', '#d9a07a', '#c58a64', '#f0c8a8', '#b07a58'];
  const HAIR = ['#2a1e18', '#5a3a20', '#8a6a40', '#3a2a20', '#7a4a28'];
  const GREY = ['#a8a8a8', '#d0d0d0', '#8a8a88'];
  const FUR = ['#5a4030', '#3a3028', '#6b5a48', '#4a4a50'];
  const KNIT = ['#8a2a2a', '#2a4a7a', '#3a6a3a', '#c8a040', '#6a3a7a'];
  const SCARF = ['#a03030', '#d0c090', '#5060a0', '#d8d8d0', '#3a6a5a', '#c87030'];
  const COAT = { vatnik: ['#3e4a3a', '#2e3540', '#3a3a3a'], tulup: ['#7a5a3a', '#6a4a2a'], coat: ['#4a3a3a', '#2a2a3a', '#3a2a22'], puhovik: ['#7a2a2a', '#2a5a7a', '#5a5a2a'] };

  // Внешность по полу и возрасту.
  P.gen = function (r, gender, age) {
    const L = { gender, age };
    L.skin = r.pick(SKIN);
    L.hairCol = age === 'old' ? r.pick(GREY) : r.pick(HAIR);
    L.rx = age === 'kid' ? 11 : r.int(12, 14);
    L.ry = age === 'kid' ? 13 : r.int(15, 17);
    if (gender === 'f') {
      L.hat = age === 'old' ? 'platok' : r.pick(['platok', 'knit', 'knit', 'none']);
      L.beard = 'none';
    } else {
      L.hat = r.pick(age === 'kid' ? ['ushanka', 'knit'] : ['ushanka', 'ushanka', 'knit', 'cap', 'none']);
      L.beard = age === 'kid' ? 'none' : r.pick(age === 'old' ? ['full', 'full', 'mustache', 'stubble'] : ['none', 'stubble', 'stubble', 'mustache', 'full']);
    }
    L.hatCol = L.hat === 'ushanka' ? r.pick(FUR) : L.hat === 'platok' ? r.pick(SCARF) : L.hat === 'cap' ? r.pick(['#3a3a3a', '#4a3a2a', '#2a3a4a']) : r.pick(KNIT);
    L.coat = r.pick(age === 'kid' ? ['puhovik', 'coat'] : ['vatnik', 'tulup', 'coat', 'puhovik']);
    L.coatCol = r.pick(COAT[L.coat]);
    L.scarf = r.chance(0.5) && L.hat !== 'platok';
    L.scarfCol = r.pick(SCARF);
    L.glasses = age !== 'kid' && r.chance(0.18);
    L.seed = r.int(1, 1e9);
    return L;
  };

  const [pc, px] = G.mk();
  const b = G.brush(px);

  // st: { blink, mouth: 'closed'|'open'|'smile'|'teeth'|'gap', red, light: 'night'|'day'|'none' }
  P.draw = function (L, st = {}) {
    px.clearRect(0, 0, G.W, G.H);
    const kid = L.age === 'kid', old = L.age === 'old';
    const cx = 80, hy = kid ? 96 : 82, rx = L.rx, ry = L.ry;
    const r = U.rng(L.seed);
    const skin = L.skin, skinD = U.shade(skin, 0.82), skinDD = U.shade(skin, 0.62);

    // Тело.
    const top = hy + ry - 1, shW = kid ? 34 : 46;
    const coatD = U.shade(L.coatCol, 0.75);
    for (let y = top; y < G.H; y++) {
      const hw = Math.min(shW, 9 + (y - top) * 2.4);
      b.r(cx - hw, y, hw * 2, 1, L.coatCol);
      b.r(cx - hw, y, 3, 1, coatD);
    }
    if (L.coat === 'vatnik') for (let y = top + 6; y < G.H; y += 6) b.r(cx - shW, y, shW * 2, 1, coatD);
    if (L.coat === 'puhovik') for (let y = top + 8; y < G.H; y += 9) { b.r(cx - shW, y, shW * 2, 1, coatD); b.r(cx - shW, y - 3, shW * 2, 1, U.shade(L.coatCol, 1.12)); }
    if (L.coat === 'coat') {
      for (let y = top + 4; y < G.H; y++) { const d = (y - top - 4) * 0.5; b.p(cx - 3 - d, y, coatD); b.p(cx + 3 + d, y, coatD); }
      for (let y = top + 16; y < G.H; y += 12) b.r(cx - 1, y, 2, 2, '#c8b070');
    }
    // Шея и воротник.
    b.r(cx - 5, top - 4, 10, 6, skinD);
    if (L.coat === 'tulup') b.ell(cx, top + 3, 22, 6, '#d8c8a8');
    if (L.scarf) {
      b.ell(cx, top + 2, 15, 4, L.scarfCol);
      b.r(cx + 4, top + 4, 6, 18, L.scarfCol);
      b.r(cx + 4, top + 20, 6, 2, U.shade(L.scarfCol, 0.7));
    }
    // Снег на плечах.
    for (let i = 0; i < 14; i++) b.p(cx + r.int(-shW + 2, shW - 2), top + 10 + r.int(0, 3), '#e8eef6');

    // Волосы сзади (длинные — у женщин без шапки).
    if (L.hat === 'none' && L.gender === 'f') b.r(cx - rx - 2, hy - 4, rx * 2 + 4, ry + 10, L.hairCol);
    // Платок — большой овал вокруг лица.
    if (L.hat === 'platok') {
      b.ell(cx, hy + 1, rx + 4, ry + 4, L.hatCol);
      for (let y = hy + 4; y < hy + ry + 12; y++) b.r(cx - (hy + ry + 12 - y) * 0.6, y, (hy + ry + 12 - y) * 1.2, 1, L.hatCol);
      for (let i = 0; i < 16; i++) b.p(cx + r.int(-rx - 3, rx + 3), hy + r.int(-ry - 3, ry + 3), U.shade(L.hatCol, 1.25));
    }
    // Уши.
    if (L.hat !== 'ushanka' && L.hat !== 'platok') { b.r(cx - rx - 2, hy - 1, 3, 6, skinD); b.r(cx + rx, hy - 1, 3, 6, skinD); }
    // Голова.
    if (L.hat === 'platok') b.ell(cx, hy + 2, rx - 1, ry - 2, skin);
    else b.ell(cx, hy, rx, ry, skin);
    for (let dy = -ry + 4; dy < ry - 3; dy++) b.p(cx - Math.round(rx * Math.sqrt(1 - (dy * dy) / (ry * ry))) + 1, hy + dy, skinD);
    // Румянец с мороза.
    b.r(cx - 9, hy + 5, 3, 2, '#e08a7a'); b.r(cx + 6, hy + 5, 3, 2, '#e08a7a');

    // Волосы и шапки.
    const crown = hy - ry;
    if (L.hat === 'none') {
      if (L.gender === 'f' || !old || r.chance(0.5)) b.ell(cx, crown + 4, rx + 1, 7, L.hairCol, -1e9, crown + 6);
      else { b.r(cx - rx, hy - 6, 3, 6, L.hairCol); b.r(cx + rx - 2, hy - 6, 3, 6, L.hairCol); }
    } else if (L.hat === 'ushanka') {
      const fur = L.hatCol, furL = U.shade(fur, 1.2);
      b.ell(cx, crown + 4, rx + 3, 10, fur, -1e9, crown + 9);
      b.r(cx - rx - 3, crown + 4, (rx + 3) * 2 + 1, 6, furL);
      b.r(cx - rx - 4, hy - 6, 5, 18, fur);
      b.r(cx + rx, hy - 6, 5, 18, fur);
      for (let i = 0; i < 18; i++) b.p(cx + r.int(-rx - 3, rx + 3), crown + r.int(-5, -1), '#eef4fa');
      for (let i = 0; i < 20; i++) b.p(cx + r.int(-rx - 3, rx + 3), crown + r.int(4, 9), U.shade(fur, 0.8));
    } else if (L.hat === 'knit') {
      b.ell(cx, crown + 5, rx + 1, 10, L.hatCol, -1e9, crown + 8);
      b.r(cx - rx - 1, crown + 5, (rx + 1) * 2 + 1, 4, U.shade(L.hatCol, 0.8));
      for (let X = cx - rx; X <= cx + rx; X += 2) b.r(X, crown + 5, 1, 4, U.shade(L.hatCol, 0.65));
      b.ell(cx, crown - 6, 4, 4, U.shade(L.hatCol, 1.25));
      for (let i = 0; i < 10; i++) b.p(cx + r.int(-rx, rx), crown + r.int(-4, -1), '#eef4fa');
    } else if (L.hat === 'cap') {
      b.ell(cx, crown + 4, rx + 2, 6, L.hatCol, -1e9, crown + 6);
      b.r(cx - rx - 2, crown + 3, (rx + 2) * 2 + 1, 4, L.hatCol);
      b.r(cx - rx + 2, crown + 7, rx * 2 - 2, 2, U.shade(L.hatCol, 0.6));
      for (let i = 0; i < 8; i++) b.p(cx + r.int(-rx, rx), crown - 1 + r.int(-1, 1), '#eef4fa');
    }

    // Брови, глаза, нос.
    const ey = hy + 1, brow = L.hat === 'platok' || L.hat === 'none' ? L.hairCol : U.shade(L.hairCol, 0.8);
    b.r(cx - 8, ey - 4, 5, 1, brow); b.r(cx + 3, ey - 4, 5, 1, brow);
    if (st.blink) {
      b.r(cx - 7, ey + 1, 4, 1, skinDD); b.r(cx + 3, ey + 1, 4, 1, skinDD);
    } else {
      const white = st.red ? '#e8a8a0' : '#ece6dc';
      b.r(cx - 7, ey - 1, 4, 3, white); b.r(cx + 3, ey - 1, 4, 3, white);
      b.r(cx - 5, ey - 1, 2, 3, '#1a1414'); b.r(cx + 4, ey - 1, 2, 3, '#1a1414');
      if (st.stare) { b.p(cx - 5, ey - 1, '#f0f0f0'); b.p(cx + 4, ey - 1, '#f0f0f0'); }
    }
    if (old) { b.p(cx - 8, ey + 3, skinDD); b.p(cx - 6, ey + 3, skinDD); b.p(cx + 4, ey + 3, skinDD); b.p(cx + 6, ey + 3, skinDD); b.r(cx - 3, crown + 11, 6, 1, skinD); }
    b.r(cx - 1, ey + 2, 1, 4, skinD); b.r(cx - 1, ey + 6, 3, 1, skinDD);

    // Борода.
    const my = hy + 10;
    if (L.beard === 'full') {
      b.ell(cx, my + 2, rx - 1, 8, L.hairCol, my - 4);
      b.r(cx - 6, my - 2, 12, 2, L.hairCol);
    } else if (L.beard === 'stubble') {
      for (let i = 0; i < 40; i++) { const X = cx + r.int(-rx + 3, rx - 3), Y = my + r.int(-2, 6); b.p(X, Y, U.mix(skin, L.hairCol, 0.55)); }
    }
    if (L.beard === 'mustache' || L.beard === 'full') b.r(cx - 5, my - 2, 10, 2, U.shade(L.hairCol, 0.85));

    // Рот.
    const m = st.mouth || 'closed', lip = '#6a3030';
    if (m === 'closed') b.r(cx - 3, my, 6, 1, lip);
    else if (m === 'open') { b.r(cx - 3, my - 1, 6, 3, '#2a1010'); b.r(cx - 2, my - 1, 4, 1, '#d8d0c8'); }
    else if (m === 'smile') { b.r(cx - 3, my + 1, 6, 1, lip); b.p(cx - 4, my, lip); b.p(cx + 3, my, lip); }
    else if (m === 'gap') {
      b.r(cx - 4, my - 1, 8, 3, '#2a1010'); b.r(cx - 4, my - 1, 8, 2, '#e8e0d0'); b.p(cx - 1, my - 1, '#2a1010'); b.p(cx - 1, my, '#2a1010');
    } else if (m === 'teeth') {
      // Слишком широкая улыбка, два ряда мелких зубов.
      b.r(cx - 9, my - 2, 18, 5, '#1a0808');
      for (let X = cx - 9; X < cx + 9; X++) { b.p(X, my - 2, X % 2 ? '#f0ece0' : '#a09888'); b.p(X, my + 2, X % 2 ? '#a09888' : '#f0ece0'); b.p(X, my - 1, X % 2 ? '#d8d0c0' : '#1a0808'); b.p(X, my + 1, X % 2 ? '#1a0808' : '#d8d0c0'); }
      b.p(cx - 10, my - 3, lip); b.p(cx + 9, my - 3, lip);
    }

    // Очки.
    if (L.glasses) {
      px.strokeStyle = '#2a2a2a'; px.lineWidth = 1;
      px.strokeRect(cx - 8.5, ey - 2.5, 6, 5); px.strokeRect(cx + 2.5, ey - 2.5, 6, 5);
      b.r(cx - 2, ey - 1, 4, 1, '#2a2a2a');
      b.p(cx - 7, ey - 2, '#cfe0f0'); b.p(cx + 4, ey - 2, '#cfe0f0');
    }

    // Свет: ночью — синий холод слева и тёплый фонарь справа.
    if (st.light !== 'none') {
      px.save(); px.globalCompositeOperation = 'source-atop';
      if (st.light === 'flash') { px.fillStyle = 'rgba(255,240,200,0.18)'; px.fillRect(0, 0, G.W, G.H); }
      else if (st.light === 'day') { px.fillStyle = 'rgba(200,220,255,0.06)'; px.fillRect(0, 0, G.W, G.H); }
      else {
        px.fillStyle = 'rgba(12,20,48,0.42)'; px.fillRect(0, 0, cx - 4, G.H);
        px.fillStyle = 'rgba(12,20,48,0.22)'; px.fillRect(cx - 4, 0, G.W, G.H);
        px.fillStyle = 'rgba(255,160,70,0.12)'; px.fillRect(cx + 4, 0, G.W, G.H);
      }
      px.restore();
    }
    return pc;
  };

  // Где лицо — для зума и пара.
  P.anchor = function (L) {
    const kid = L.age === 'kid', hy = kid ? 96 : 82;
    return { cx: 80, eyeY: hy + 1, mouthY: hy + 10, headY: hy };
  };

  // Маленькая фигурка (для избы и финала): 12×22.
  P.mini = function (b, L, X, Y, opts = {}) {
    const kid = L.age === 'kid', h = kid ? 16 : 20, bodyH = kid ? 9 : 11;
    const top = Y - h + (opts.bob || 0);
    b.r(X - 5, top + 8, 10, bodyH, L.coatCol);
    b.r(X - 5, top + 8, 2, bodyH, U.shade(L.coatCol, 0.75));
    if (L.scarf) b.r(X - 3, top + 8, 6, 2, L.scarfCol);
    b.r(X - 3, top + 1, 7, 7, L.skin);
    const hatC = L.hat === 'none' ? L.hairCol : L.hatCol;
    b.r(X - 3, top, 7, 3, hatC);
    if (L.hat === 'platok') { b.r(X - 4, top + 1, 1, 6, hatC); b.r(X + 4, top + 1, 1, 6, hatC); }
    if (L.hat === 'ushanka') { b.r(X - 4, top + 2, 1, 4, hatC); b.r(X + 4, top + 2, 1, 4, hatC); }
    if (L.hat === 'none' && L.gender === 'f') b.r(X - 4, top + 1, 1, 7, hatC);
    if (L.beard === 'full') b.r(X - 2, top + 6, 5, 3, L.hairCol);
    if (opts.blink) b.r(X - 2, top + 4, 5, 1, U.shade(L.skin, 0.6));
    else { b.p(X - 2, top + 4, '#1a1414'); b.p(X + 2, top + 4, '#1a1414'); }
    if (opts.grin) { b.r(X - 2, top + 6, 5, 1, '#f0ece0'); b.p(X - 1, top + 6, '#1a0808'); b.p(X + 1, top + 6, '#1a0808'); }
    b.r(X - 4, top + 8 + bodyH, 3, 2, '#2a2420'); b.r(X + 1, top + 8 + bodyH, 3, 2, '#2a2420');
  };
})();
