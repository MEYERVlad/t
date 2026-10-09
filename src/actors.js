// Персонажи — процедурные силуэты с контровым светом.
(function () {
  const { hex, lerp } = OM;
  const P = OM.P;
  const TAU = Math.PI * 2;
  const A = (OM.Actors = {});

  // Рисует фигуру дважды: сначала цветом контрового света со сдвигом, затем телом.
  function withRim(ctx, a, body, shape) {
    if (a.rim) {
      ctx.save();
      ctx.translate(a.rim.dx || 0, a.rim.dy || -0.8);
      shape(ctx, a.rim.color, true);
      ctx.restore();
    }
    shape(ctx, body, false);
  }

  function limb(ctx, x0, y0, x1, y1, x2, y2, w) {
    ctx.lineWidth = w;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.quadraticCurveTo(x1, y1, x2, y2);
    ctx.stroke();
  }

  // ---------- Лев Гордеев: пальто, шляпа, чемодан ----------
  A.hero = (ctx, a, t) => {
    const mv = a.move || 0;
    const ph = a.phase || 0;
    const sw = Math.sin(ph) * mv;
    const bob = Math.abs(Math.cos(ph)) * mv * 2.5;
    const breathe = Math.sin(t * 1.6) * 0.7 * (1 - mv);
    ctx.save();
    ctx.translate(a.x, a.y);
    ctx.scale(a.s * a.face, a.s);
    // тень под ногами
    ctx.fillStyle = 'rgba(0,0,0,.45)';
    ctx.beginPath();
    ctx.ellipse(0, 1, 30, 5, 0, 0, TAU);
    ctx.fill();
    ctx.translate(0, bob);
    withRim(ctx, a, a.body || '#0a0c0f', (c, col, isRim) => {
      c.fillStyle = col;
      c.strokeStyle = col;
      c.lineCap = 'round';
      c.lineJoin = 'round';
      // ноги
      const legs = [sw, -sw];
      legs.forEach((s, i) => {
        const fx = s * 20 + (i ? -2 : 2);
        const lift = Math.max(0, Math.cos(ph + (i ? Math.PI : 0))) * mv * 7;
        const fy = -lift - bob;
        limb(c, i ? -4 : 4, -86, (fx + (i ? -4 : 4)) / 2 + 5, -44 - lift * 0.5, fx, fy - 3, 11);
        c.beginPath();
        c.ellipse(fx + 5, fy - 2.5, 9, 4, 0, 0, TAU);
        c.fill();
      });
      // дальняя рука
      const back = -sw * 0.5;
      limb(c, -2, -150, -2 + Math.sin(back) * 30 - 3, -120, -2 + Math.sin(back) * 52, -96 + Math.abs(back) * 6, 10);
      // пальто
      const hem = sw * 3;
      c.beginPath();
      c.moveTo(-9, -166);
      c.quadraticCurveTo(-20, -162, -19, -150);
      c.quadraticCurveTo(-17, -118, -18, -96);
      c.quadraticCurveTo(-20, -70, -24 - hem, -44);
      c.lineTo(22 + hem, -46);
      c.quadraticCurveTo(17, -72, 16, -96);
      c.quadraticCurveTo(20 + breathe, -128, 17, -154);
      c.quadraticCurveTo(14, -164, 7, -167);
      c.closePath();
      c.fill();
      // поднятый воротник
      c.beginPath();
      c.moveTo(-11, -160);
      c.lineTo(-9, -176);
      c.lineTo(-1, -164);
      c.closePath();
      c.fill();
      // голова и шея
      c.fillRect(-3, -172, 9, 10);
      c.beginPath();
      c.ellipse(3, -176, 9.5, 11, 0, 0, TAU);
      c.fill();
      c.beginPath();
      c.moveTo(11, -179);
      c.lineTo(15, -172);
      c.lineTo(11, -170);
      c.fill();
      // шляпа
      c.beginPath();
      c.ellipse(2, -184, 18, 3.6, -0.04, 0, TAU);
      c.fill();
      c.beginPath();
      c.moveTo(-10, -185);
      c.quadraticCurveTo(-11, -197, -6, -199);
      c.quadraticCurveTo(2, -196, 9, -199);
      c.quadraticCurveTo(13, -196, 11, -185);
      c.closePath();
      c.fill();
      // ближняя рука с чемоданом / предметом
      const fr = a.item === 'none' ? sw * 0.5 : sw * 0.12;
      const hx = 4 + Math.sin(fr) * 40, hy = -94 + Math.abs(fr) * 4;
      if (a.pose === 'reach') {
        limb(c, 6, -152, 26, -150, 46, -158, 10);
      } else if (a.pose === 'phone') {
        limb(c, 6, -152, 18, -128, 10, -172, 10);
        c.fillRect(6, -182, 6, 16);
      } else {
        limb(c, 6, -152, 9 + Math.sin(fr) * 18, -122, hx, hy, 10);
      }
      if (a.item !== 'none' && a.pose !== 'reach') {
        const sx = hx - 12, sy = hy + 4;
        P.rrect(c, sx - 8, sy, 38, 27, 3);
        c.fill();
        c.lineWidth = 2.5;
        c.beginPath();
        c.moveTo(sx + 4, sy + 1);
        c.quadraticCurveTo(sx + 11, sy - 7, sx + 18, sy + 1);
        c.stroke();
        if (!isRim) {
          c.fillStyle = hex('#5a4630', 0.5);
          c.fillRect(sx - 8, sy + 11, 38, 2);
        }
      }
    });
    ctx.restore();
  };

  // ---------- Митя: мальчик в светлой пижаме, лунатик ----------
  A.mitya = (ctx, a, t) => {
    const mv = a.move || 0;
    const ph = a.phase || 0;
    const sw = Math.sin(ph) * mv;
    ctx.save();
    ctx.translate(a.x, a.y);
    ctx.scale(a.s * a.face, a.s);
    ctx.fillStyle = 'rgba(0,0,0,.35)';
    ctx.beginPath();
    ctx.ellipse(0, 1, 18, 3.5, 0, 0, TAU);
    ctx.fill();
    const sway = a.sleep ? Math.sin(t * 0.9) * 2 : 0;
    ctx.rotate(sway * 0.01);
    const base = a.body || '#8394a1';
    const shade = a.shade || '#3d4a55';
    const draw = (c, col, isRim) => {
      c.strokeStyle = col;
      c.fillStyle = col;
      c.lineCap = 'round';
      [sw, -sw].forEach((s, i) => {
        limb(c, i ? -3 : 3, -52, (s * 12) / 2 + 2, -26, s * 12, -2, 8);
        c.beginPath();
        c.ellipse(s * 12 + 2, -2, 5, 2.5, 0, 0, TAU);
        c.fill();
      });
      // руки вперёд, как у лунатика
      const arm = a.sleep ? 0.9 : 0.1 + sw * 0.3;
      limb(c, -1, -90, Math.cos(-arm + 1.4) * 14, -76, Math.sin(arm) * 30, -64 - arm * 14, 7);
      // тело
      c.beginPath();
      c.moveTo(-10, -96);
      c.quadraticCurveTo(-14, -70, -11, -50);
      c.lineTo(11, -50);
      c.quadraticCurveTo(14, -72, 10, -96);
      c.closePath();
      c.fill();
      c.beginPath();
      c.ellipse(1, -108, 9, 10, 0, 0, TAU);
      c.fill();
      // вихры
      c.beginPath();
      c.moveTo(-9, -108);
      c.quadraticCurveTo(-11, -119, -2, -119.5);
      c.quadraticCurveTo(1, -122, 4, -119);
      c.quadraticCurveTo(11, -117, 9.5, -108);
      c.fill();
      limb(c, 2, -90, 6 + Math.sin(arm) * 12, -76, 2 + Math.sin(arm) * 32, -66 - arm * 12, 7);
      if (!isRim) {
        // полоски пижамы и тень
        c.save();
        c.globalCompositeOperation = 'source-atop';
        c.fillStyle = hex(shade, 0.55);
        c.fillRect(-16, -100, 8, 100);
        c.fillStyle = hex('#ffffff', 0.07);
        for (let y = -95; y < -52; y += 7) c.fillRect(-14, y, 28, 2);
        c.restore();
      }
    };
    withRim(ctx, a, base, draw);
    ctx.restore();
  };

  // ---------- Тихий: утопленник в мокром саване ----------
  // Сутулый, слишком высокий; мокрые волосы скрывают лицо; руки ниже колен; с пальцев капает вода.
  A.tall = (ctx, a, t) => {
    const al = a.alpha ?? 1;
    if (al <= 0) return;
    const seed = a.seed || 0;
    const r = OM.rng(17 + Math.floor(seed * 1000));
    const hem = Array.from({ length: 23 }, () => r());
    const strands = Array.from({ length: 28 }, () => [r(), r(), r()]);
    // редкие судорожные подёргивания головы
    const tw = Math.floor(t * 1.7 + seed * 7);
    const twitch = OM.rng(tw * 31 + 7)() < 0.12 ? (OM.rng(tw)() - 0.5) * 0.5 : 0;
    const reach = a.reach || 0;
    const breathe = Math.sin(t * 0.8 + seed) * 1.5;
    const L = (p, q, k) => p + (q - p) * k;
    // плечи, локти, кисти: [дальняя рука, ближняя рука]
    const arms = [
      { s: [-24, -322], e: [-36, -238], h: [-32, -128], ang: Math.PI / 2 + 0.1 },
      {
        s: [18, -332],
        e: [L(26, 66, reach), L(-246, -300, reach)],
        h: [L(30, 138, reach), L(-136, -300, reach)],
        ang: L(Math.PI / 2 - 0.1, 0.45, reach),
      },
    ];
    const fingers = (h, ang) => [-1.5, -0.5, 0.5, 1.5].map((k, i) => {
      const a1 = ang + k * 0.16, a2 = a1 + 0.35 + i * 0.05, l1 = 17 + (i % 2) * 3, l2 = 15;
      const m = [h[0] + Math.cos(a1) * l1, h[1] + Math.sin(a1) * l1];
      return [h, m, [m[0] + Math.cos(a2) * l2, m[1] + Math.sin(a2) * l2]];
    });

    const shape = (c, col, rimPass) => {
      c.fillStyle = col;
      c.strokeStyle = col;
      c.lineCap = 'round';
      c.lineJoin = 'round';
      limb(c, -8, -70, -10, -34, -11, 0, 5);
      limb(c, 7, -70, 9, -34, 10, 0, 5);
      // саван
      c.beginPath();
      c.moveTo(-4, -354);
      c.quadraticCurveTo(-26, -352, -30, -322 + breathe);
      c.quadraticCurveTo(-35, -220, -41, -120);
      c.quadraticCurveTo(-45, -92, -49, -72);
      for (let i = 0; i <= 22; i++) {
        const x = -49 + (i / 22) * 96;
        c.lineTo(x, -72 + hem[i] * 62 + Math.sin(t * 1.3 + i) * 2);
        if (i < 22) c.lineTo(x + 2.2, -80 + hem[(i + 5) % 22] * 22);
      }
      c.quadraticCurveTo(43, -112, 35, -200);
      c.quadraticCurveTo(31, -300, 20, -334 + breathe);
      c.quadraticCurveTo(10, -352, 4, -352);
      c.closePath();
      c.fill();
      if (!rimPass) {
        // складки мокрой ткани
        c.save();
        c.globalCompositeOperation = 'source-atop';
        c.strokeStyle = 'rgba(150,170,180,.07)';
        c.lineWidth = 2;
        for (let i = 0; i < 7; i++) {
          const x = -30 + i * 10;
          c.beginPath();
          c.moveTo(x, -320);
          c.quadraticCurveTo(x + Math.sin(i * 2.1) * 8, -200, x - 4 + i * 1.5, -40);
          c.stroke();
        }
        c.fillStyle = P.hgrad(c, -45, 45, [[0, 'rgba(0,0,0,0)'], [0.75, 'rgba(0,0,0,0)'], [1, 'rgba(140,165,180,.09)']]);
        c.fillRect(-60, -360, 120, 360);
        c.restore();
        c.fillStyle = col;
        c.strokeStyle = col;
      }
      // руки и пальцы
      arms.forEach((arm) => {
        c.lineWidth = 5;
        c.beginPath();
        c.moveTo(arm.s[0], arm.s[1]);
        c.lineTo(arm.e[0], arm.e[1]);
        c.lineTo(arm.h[0], arm.h[1]);
        c.stroke();
        c.lineWidth = 2;
        fingers(arm.h, arm.ang).forEach(([h, m, e]) => {
          c.beginPath();
          c.moveTo(h[0], h[1]);
          c.lineTo(m[0], m[1]);
          c.lineTo(e[0], e[1]);
          c.stroke();
        });
      });
      // шея вперёд, голова свешена
      c.save();
      c.translate(2, -350);
      c.rotate(0.38 + twitch);
      c.fillRect(-3.5, -26, 7, 28);
      c.translate(0, -34);
      c.beginPath();
      c.ellipse(0, 0, 11, 15, 0, 0, TAU);
      c.fill();
      if (!rimPass) {
        // бледный край лица в просвете волос
        c.fillStyle = P.rgrad(c, 5, 6, 0, 10, [[0, hex('#b9c6c4', 0.22 * (a.face2 ?? 1))], [1, hex('#b9c6c4', 0)]]);
        c.beginPath();
        c.ellipse(5, 6, 4, 10, 0, 0, TAU);
        c.fill();
        c.fillStyle = col;
      }
      // мокрые пряди
      strands.forEach(([u, v, w], i) => {
        const sx = -10 + u * 22, len = 38 + v * 74;
        c.lineWidth = 0.8 + w * 2.2;
        c.beginPath();
        c.moveTo(sx, -13);
        c.quadraticCurveTo(sx + 5 + w * 8, 8, sx + 3 + Math.sin(t * 0.9 + i * 0.7) * 2.5 + (u - 0.5) * 10, len);
        c.stroke();
      });
      c.beginPath();
      c.moveTo(-12, -6);
      c.quadraticCurveTo(-2, -22, 12, -6);
      c.quadraticCurveTo(13, 20, 4, 40);
      c.lineTo(-7, 36);
      c.quadraticCurveTo(-14, 12, -12, -6);
      c.fill();
      c.restore();
    };

    ctx.save();
    ctx.globalAlpha = al;
    ctx.translate(a.x + (Math.random() - 0.5) * (a.jitter ?? 1) * 0.5, a.y);
    ctx.scale(a.s * a.face, a.s);
    ctx.rotate(Math.sin(t * 0.5 + seed) * 0.02);
    // мягкий ореол — края растворяются в тумане
    ctx.save();
    ctx.globalAlpha = al * 0.5;
    ctx.filter = 'blur(4px)';
    shape(ctx, a.body || '#040507', true);
    ctx.restore();
    if (a.rim) {
      ctx.save();
      ctx.translate(a.rim.dx || 1.2, -0.5);
      shape(ctx, a.rim.color, true);
      ctx.restore();
    }
    shape(ctx, a.body || '#040507', false);
    // бледные кончики пальцев и капли
    arms.forEach((arm, ai) => {
      fingers(arm.h, arm.ang).forEach(([h, m, e], i) => {
        ctx.strokeStyle = 'rgba(170,185,180,.28)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(m[0], m[1]);
        ctx.lineTo(e[0], e[1]);
        ctx.stroke();
        const ph = (t * 0.9 + i * 0.37 + ai * 0.5) % 1;
        ctx.fillStyle = `rgba(190,205,210,${0.5 * (1 - ph)})`;
        ctx.fillRect(e[0] - 0.8, e[1] + ph * 60, 1.6, 3);
      });
    });
    ctx.restore();
  };

  // ---------- Зинаида Павловна за стойкой ----------
  A.zina = (ctx, a, t) => {
    ctx.save();
    ctx.translate(a.x, a.y);
    ctx.scale(a.s, a.s);
    const asleep = a.asleep;
    const talk = a.talking ? Math.sin(t * 14) * 0.6 : 0;
    const breath = Math.sin(t * (asleep ? 0.9 : 1.4)) * (asleep ? 1.6 : 0.6);
    const body = '#0b0907';
    const draw = (c, col, isRim) => {
      c.fillStyle = col;
      // плечи и шаль
      c.beginPath();
      c.moveTo(-58, 0);
      c.quadraticCurveTo(-56, -58 - breath, -30, -74 - breath);
      c.quadraticCurveTo(0, -84 - breath, 30, -74 - breath);
      c.quadraticCurveTo(56, -58 - breath, 58, 0);
      c.closePath();
      c.fill();
      // голова
      c.save();
      if (asleep) {
        c.translate(4, -70);
        c.rotate(0.55);
        c.translate(-4, 70);
        c.translate(0, 8);
      } else c.translate(0, talk);
      c.fillRect(-6, -92 - breath, 12, 16);
      c.beginPath();
      c.ellipse(0, -106 - breath, 16, 19, 0, 0, TAU);
      c.fill();
      // пучок
      c.beginPath();
      c.arc(-2, -127 - breath, 9, 0, TAU);
      c.fill();
      if (!isRim) {
        // стёкла очков ловят свет лампы
        if (!asleep) {
          c.fillStyle = hex('#ffd9a0', 0.75);
          c.fillRect(-9, -109 - breath, 3, 1.4);
          c.fillRect(4, -109 - breath, 3, 1.4);
        }
      }
      c.restore();
      if (!isRim) {
        // узор шали
        c.save();
        c.globalCompositeOperation = 'source-atop';
        c.strokeStyle = hex('#5a2c22', 0.35);
        c.lineWidth = 1.5;
        for (let i = -60; i < 60; i += 9) {
          c.beginPath();
          c.moveTo(i, 0);
          c.lineTo(i + 30, -80);
          c.stroke();
        }
        c.restore();
      }
    };
    ctx.save();
    ctx.translate(-1.5, -1);
    draw(ctx, hex('#ffb35a', 0.55), true);
    ctx.restore();
    draw(ctx, body, false);
    ctx.restore();
  };

  // ---------- Автобус ПАЗ (силуэт) ----------
  A.bus = (ctx, a, t) => {
    ctx.save();
    ctx.translate(a.x, a.y);
    ctx.scale(a.s * (a.face || 1), a.s);
    const w = 470, h = 190;
    // фары: конус света вперёд (влево)
    if (a.lights) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createLinearGradient(-w / 2, 0, -w / 2 - 520, 0);
      g.addColorStop(0, 'rgba(255,230,180,.35)');
      g.addColorStop(1, 'rgba(255,230,180,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(-w / 2, -40);
      ctx.lineTo(-w / 2 - 520, -110);
      ctx.lineTo(-w / 2 - 520, 30);
      ctx.lineTo(-w / 2, -24);
      ctx.fill();
      ctx.restore();
      P.glow(ctx, -w / 2 + 4, -32, 60, '#ffe6b4', 0.8);
      P.glow(ctx, w / 2 - 6, -36, 30, '#ff2a1a', 0.7);
    }
    ctx.fillStyle = '#07090b';
    P.rrect(ctx, -w / 2, -h, w, h - 22, 26);
    ctx.fill();
    ctx.fillRect(-w / 2 + 6, -40, w - 12, 18);
    // окна
    for (let i = 0; i < 6; i++) {
      const x = -w / 2 + 70 + i * 62;
      P.window(ctx, x, -h + 26, 52, 58, { lit: '#e8c98a', a: 0.6, frame: '#07090b', glow: false });
    }
    // лобовое стекло
    ctx.fillStyle = hex('#2a3540', 0.9);
    ctx.beginPath();
    ctx.moveTo(-w / 2 + 6, -h + 40);
    ctx.lineTo(-w / 2 + 56, -h + 28);
    ctx.lineTo(-w / 2 + 56, -h + 96);
    ctx.lineTo(-w / 2 + 6, -h + 110);
    ctx.fill();
    // дверь
    ctx.fillStyle = hex(a.doorOpen ? '#e8c98a' : '#1a2128', a.doorOpen ? 0.55 : 1);
    ctx.fillRect(w / 2 - 92, -h + 26, 46, 140);
    // колёса
    ctx.fillStyle = '#030405';
    [-w / 2 + 92, w / 2 - 110].forEach((x) => {
      ctx.beginPath();
      ctx.arc(x, -18, 30, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#15191c';
      ctx.beginPath();
      ctx.arc(x, -18, 12, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#030405';
    });
    P.glow(ctx, 0, -h + 50, 260, '#e8c98a', 0.08);
    ctx.restore();
  };

  // ---------- Иконки предметов ----------
  const I = (OM.Icons = {});
  I.token = (c) => {
    c.fillStyle = P.rgrad(c, 26, 26, 2, 22, [[0, '#e3b56a'], [1, '#8a5a24']]);
    c.beginPath();
    c.arc(32, 32, 18, 0, TAU);
    c.fill();
    c.strokeStyle = '#5a3a14';
    c.lineWidth = 2;
    c.beginPath();
    c.arc(32, 32, 14, 0, TAU);
    c.stroke();
    c.fillStyle = '#5a3a14';
    c.fillRect(23, 30, 18, 4);
  };
  I.umbrella = (c) => {
    c.strokeStyle = '#1b1d22';
    c.lineCap = 'round';
    c.lineWidth = 5;
    c.beginPath();
    c.moveTo(16, 50);
    c.lineTo(46, 14);
    c.stroke();
    c.fillStyle = '#20252c';
    c.beginPath();
    c.moveTo(48, 10);
    c.quadraticCurveTo(40, 30, 22, 44);
    c.quadraticCurveTo(38, 38, 52, 18);
    c.fill();
    c.strokeStyle = '#7a4a2a';
    c.lineWidth = 4;
    c.beginPath();
    c.arc(12, 50, 6, 0, Math.PI);
    c.stroke();
  };
  const key = (c, tag, label, big) => {
    c.strokeStyle = big ? '#6d7276' : '#b8914f';
    c.fillStyle = c.strokeStyle;
    c.lineWidth = big ? 4 : 3;
    c.beginPath();
    c.arc(22, 24, big ? 9 : 7, 0, TAU);
    c.stroke();
    c.beginPath();
    c.moveTo(29, 29);
    c.lineTo(48, 48);
    c.stroke();
    c.fillRect(40, 44, 4, 9);
    c.fillRect(45, 48, 4, 7);
    c.fillStyle = tag;
    P.rrect(c, 6, 38, 22, 18, 3);
    c.fill();
    P.text(c, label, 17, 47.5, { font: '700 11px "PT Serif",serif', color: '#1a1410' });
  };
  I.key7 = (c) => key(c, '#c9a77a', '7');
  I.boatkey = (c) => key(c, '#7a5a3a', 'Л', true);
  I.bell = (c) => {
    c.fillStyle = '#2a1d12';
    c.fillRect(14, 46, 36, 6);
    c.fillStyle = P.rgrad(c, 26, 28, 2, 22, [[0, '#f0d08a'], [1, '#8a6224']]);
    c.beginPath();
    c.moveTo(14, 46);
    c.quadraticCurveTo(14, 22, 32, 22);
    c.quadraticCurveTo(50, 22, 50, 46);
    c.fill();
    c.fillStyle = '#c9a050';
    c.fillRect(30, 13, 4, 10);
    c.beginPath();
    c.arc(32, 13, 4, 0, TAU);
    c.fill();
  };
  I.book = (c) => {
    c.fillStyle = '#5a1e18';
    P.rrect(c, 14, 8, 36, 48, 3);
    c.fill();
    c.fillStyle = '#3a120e';
    c.fillRect(14, 8, 6, 48);
    c.fillStyle = '#d9b25a';
    c.fillRect(24, 16, 20, 1.5);
    c.fillRect(24, 44, 20, 1.5);
    P.text(c, 'А—Я', 34, 30, { font: '700 10px "PT Serif",serif', color: '#d9b25a' });
  };
})();
