// Движок квеста: цикл, ввод, ходьба, хотспоты, инвентарь, диалоги, переходы, сохранения.
(function () {
  const { W, H, clamp, lerp, hex } = OM;
  const P = OM.P, S = OM.S;

  const G = (OM.G = {
    t: 0,
    scenes: {},
    scene: null,
    sid: null,
    flags: {},
    inv: [],
    sel: null,
    busy: 0,
    actors: [],
    hero: null,
    fx: { fade: 1, fadeTarget: 1, fadeSpeed: 2, fadeColor: '#000', flash: 0, letter: 0, letterTarget: 0, shake: 0, red: 0 },
    vision: null,
    mouse: { x: -100, y: -100, in: false },
    over: null,
    touch: false,
    mode: 'title',
    action: 0,
  });
  OM.scene = (id, def) => { def.id = id; G.scenes[id] = def; };
  OM.flag = (k, v) => (v === undefined ? G.flags[k] : (G.flags[k] = v));

  // ---------- Холст ----------
  let stage, cv, ctx, ps = 1, scale = 1;
  let caches = {};
  function resize() {
    const vw = window.innerWidth, vh = window.innerHeight;
    scale = Math.min(vw / W, vh / H);
    const sw = Math.round(W * scale), sh = Math.round(H * scale);
    stage.style.width = sw + 'px';
    stage.style.height = sh + 'px';
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = Math.round(sw * dpr);
    cv.height = Math.round(sh * dpr);
    const nps = cv.width / W;
    if (Math.abs(nps - ps) > 0.01) caches = {};
    ps = nps;
    stage.style.setProperty('--u', scale);
  }
  OM.cache = (id, painter) => {
    if (!caches[id]) {
      const c = OM.makeCanvas(W * ps, H * ps);
      const g = c.getContext('2d');
      g.scale(ps, ps);
      painter(g);
      caches[id] = c;
    }
    return caches[id];
  };
  OM.dropCache = (id) => { delete caches[id]; };

  // ---------- Персонажи ----------
  function makeActor(o) {
    return Object.assign({ x: 0, y: 0, face: 1, s: 1, phase: 0, move: 0, speed: 175, visible: true, target: null }, o);
  }
  OM.actor = makeActor;
  G.hero = makeActor({ id: 'hero', draw: OM.Actors.hero, item: 'case', speed: 185 });

  const depthOf = (sc, y) => {
    const d = sc.depth || { y0: 600, s0: 1, y1: 700, s1: 1 };
    return lerp(d.s0, d.s1, clamp((y - d.y0) / (d.y1 - d.y0 || 1), 0, 1));
  };

  // Персонаж идёт к точке. Промис: true — дошёл, false — путь прерван.
  OM.moveTo = (a, x, y, o = {}) =>
    new Promise((res) => {
      if (a.res) a.res(false);
      if (o.free !== true && G.scene.walk && a === G.hero) [x, y] = OM.nearestInPoly(x, y, G.scene.walk);
      a.target = [x, y];
      a.res = res;
      a.spd = o.speed || a.speed;
    });
  OM.walk = (x, y, o) => OM.moveTo(G.hero, x, y, o);

  function updateActor(a, dt) {
    if (a.target) {
      const [tx, ty] = a.target;
      const dx = tx - a.x, dy = ty - a.y;
      const d = Math.hypot(dx, dy);
      const sp = (a.spd || a.speed) * (a.s || 1) * dt;
      if (Math.abs(dx) > 2) a.face = dx > 0 ? 1 : -1;
      if (d <= sp) {
        a.x = tx; a.y = ty; a.target = null;
        const r = a.res; a.res = null;
        if (r) r(true);
      } else {
        a.x += (dx / d) * sp;
        a.y += (dy / d) * sp * 1.0;
        const prev = a.phase;
        a.phase += dt * (a.spd || a.speed) / 26 * (a.cadence || 1);
        if (a === G.hero && Math.floor(prev / Math.PI) !== Math.floor(a.phase / Math.PI)) S.step(G.scene.surface);
      }
    }
    a.move = lerp(a.move, a.target ? 1 : 0, Math.min(1, dt * 10));
    if (!a.target && a.move < 0.05) a.phase = lerp(a.phase, Math.round(a.phase / Math.PI) * Math.PI, Math.min(1, dt * 8));
    if (a.autoScale !== false) a.s = depthOf(G.scene, a.y) * (a.scaleMul || 1);
    if (a.update) a.update(a, dt, G.t);
  }

  function rimFor(a) {
    const L = G.scene.lights || [];
    let best = null, bv = 0;
    for (const l of L) {
      if (l.rim === false) continue;
      const d = Math.hypot(a.x - l.x, (a.y - 100 * a.s - l.y) * 0.7);
      const v = (l.a ?? 1) * clamp(1 - d / (l.reach || 500), 0, 1);
      if (v > bv) { bv = v; best = l; }
    }
    if (!best || bv < 0.02) return null;
    const dir = a.x > best.x ? -1 : 1;
    return { color: hex(best.color, clamp(bv * 1.3, 0, 0.8) * (best.flicker ? best.flicker() : 1)), dx: dir * 1.4 * a.face, dy: -0.6 };
  }

  // ---------- Диалоги ----------
  const WHO = {
    lev: { name: 'Лев', color: '#eadcc0', actor: 'hero' },
    zina: { name: 'Зинаида Павловна', color: '#e3a877', actor: 'zina' },
    mitya: { name: 'Митя', color: '#a6c8e0', actor: 'mitya' },
    driver: { name: 'Водитель', color: '#b9b0a0' },
    phone: { name: 'Голос в трубке', color: '#d3a49a' },
    child: { name: '???', color: '#8fb6c4' },
    book: { name: 'Энциклопедия «Всё обо всём»', color: '#d9b25a' },
    narr: { name: '', color: '#cfc6b4' },
  };
  let subs, subsWho, subsText;
  OM.say = (who, text, o = {}) =>
    new Promise((res) => {
      const w = WHO[who] || WHO.narr;
      if (G.saying) G.saying.res();
      subsWho.textContent = w.name;
      subsWho.style.color = w.color;
      subsText.style.color = o.italic || who === 'narr' || who === 'book' ? '#d8cfbd' : '#f1e8d6';
      subsText.style.fontStyle = o.italic || who === 'narr' || who === 'child' ? 'italic' : 'normal';
      subsText.textContent = '';
      subs.classList.add('on');
      const actor = w.actor && G.actors.find((a) => a.id === w.actor);
      if (actor) actor.talking = true;
      G.saying = {
        text, shown: 0, done: false, hold: 0,
        holdMax: o.hold ?? 0.9 + text.length * 0.045,
        res: () => {
          if (actor) actor.talking = false;
          subs.classList.remove('on');
          G.saying = null;
          res();
        },
      };
    });
  // Несколько реплик подряд: [['lev','...'], ['zina','...']]
  OM.talk = async (lines) => {
    for (const l of lines) {
      if (typeof l === 'function') await l();
      else await OM.say(l[0], l[1], l[2]);
    }
  };
  function updateSay(dt) {
    const s = G.saying;
    if (!s) return;
    if (!s.done) {
      s.shown += dt * 55;
      const n = Math.min(s.text.length, Math.floor(s.shown));
      subsText.textContent = s.text.slice(0, n);
      if (n >= s.text.length) s.done = true;
    } else {
      s.hold += dt;
      if (s.hold > s.holdMax) s.res();
    }
  }
  function advanceSay() {
    const s = G.saying;
    if (!s) return false;
    if (!s.done) { s.shown = s.text.length; s.done = true; s.hold = Math.max(0, s.holdMax - 0.6); }
    else s.res();
    return true;
  }

  let choicesEl;
  OM.choose = (opts) =>
    new Promise((res) => {
      choicesEl.innerHTML = '';
      opts.forEach((o, i) => {
        const b = document.createElement('button');
        b.textContent = o.text;
        if (o.seen) b.classList.add('seen');
        b.onpointerdown = (e) => {
          e.stopPropagation();
          S.click();
          choicesEl.classList.remove('on');
          G.choosing = false;
          res(o.id ?? i);
        };
        choicesEl.appendChild(b);
      });
      G.choosing = true;
      choicesEl.classList.add('on');
    });

  // ---------- Инвентарь ----------
  OM.ITEMS = {};
  let invEl, invItems, labelEl, toastEl;
  const iconCache = {};
  function iconCanvas(id, size = 64) {
    const key = id + size;
    if (!iconCache[key]) {
      const c = OM.makeCanvas(size * 2, size * 2);
      const g = c.getContext('2d');
      g.scale((size * 2) / 64, (size * 2) / 64);
      OM.Icons[OM.ITEMS[id].icon](g);
      iconCache[key] = c;
    }
    return iconCache[key];
  }
  OM.has = (id) => G.inv.includes(id);
  OM.give = (id, quiet) => {
    if (OM.has(id)) return;
    G.inv.push(id);
    renderInv();
    if (!quiet) {
      S.pickup();
      OM.toast('Получено: ' + OM.ITEMS[id].name);
      invEl.classList.add('pulse');
      setTimeout(() => invEl.classList.remove('pulse'), 1200);
    }
  };
  OM.take = (id) => {
    G.inv = G.inv.filter((i) => i !== id);
    if (G.sel === id) G.sel = null;
    renderInv();
  };
  function renderInv() {
    invItems.innerHTML = '';
    G.inv.forEach((id) => {
      const it = OM.ITEMS[id];
      const d = document.createElement('div');
      d.className = 'slot' + (G.sel === id ? ' sel' : '');
      const c = iconCanvas(id);
      const img = document.createElement('canvas');
      img.width = c.width; img.height = c.height;
      img.getContext('2d').drawImage(c, 0, 0);
      d.appendChild(img);
      d.title = it.name;
      d.onpointerenter = () => { if (!G.touch) showLabel(it.name + (G.sel === id ? ' — нажмите, чтобы рассмотреть' : ''), true); };
      d.onpointerleave = () => hideLabel();
      d.onpointerdown = async (e) => {
        e.stopPropagation();
        if (G.busy || G.saying || G.choosing) return;
        S.click();
        if (G.sel && G.sel !== id) {
          const a = G.sel;
          G.sel = null;
          renderInv();
          await run(() => combine(a, id));
          return;
        }
        if (G.sel === id) {
          G.sel = null;
          renderInv();
          await run(() => lookItem(id));
          return;
        }
        G.sel = id;
        renderInv();
        if (!G.flags._tipSel) {
          G.flags._tipSel = 1;
          OM.toast('Нажмите на предмет в мире, чтобы применить. Повторное нажатие — рассмотреть.');
        }
      };
      invItems.appendChild(d);
    });
    invEl.classList.toggle('empty', G.inv.length === 0);
  }
  OM.renderInv = renderInv;
  async function lookItem(id) {
    const it = OM.ITEMS[id];
    const l = typeof it.look === 'function' ? it.look() : it.look;
    if (typeof l === 'function') await l();
    else if (Array.isArray(l)) await OM.talk(l);
    else await OM.say('lev', l);
  }
  async function combine(a, b) {
    const it = OM.ITEMS[a];
    const f = it.combine && it.combine[b];
    if (f) return f();
    const g = OM.ITEMS[b].combine && OM.ITEMS[b].combine[a];
    if (g) return g();
    await OM.say('lev', pick(['Не сочетается.', 'Это вместе не работает.', 'Нет, глупость какая-то.']));
  }
  const pick = (arr) => arr[(Math.random() * arr.length) | 0];
  OM.pick = pick;

  let toastTimer;
  OM.toast = (s) => {
    toastEl.textContent = s;
    toastEl.classList.add('on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('on'), 2800);
  };
  function showLabel(s, inv) {
    labelEl.textContent = s;
    labelEl.classList.add('on');
    labelEl.classList.toggle('inv', !!inv);
  }
  function hideLabel() { labelEl.classList.remove('on'); }

  // ---------- Хотспоты и действия ----------
  function hsActive(h) { return !h.when || h.when(); }
  function hitHs(h, x, y) {
    if (!hsActive(h)) return false;
    if (h.hit) return h.hit(x, y);
    const r = typeof h.rect === 'function' ? h.rect() : h.rect;
    if (r) return x >= r[0] && x <= r[0] + r[2] && y >= r[1] && y <= r[1] + r[3];
    if (h.poly) return OM.inPoly(x, y, h.poly);
    return false;
  }
  function findHs(x, y) {
    const list = G.scene.hotspots || [];
    for (let i = list.length - 1; i >= 0; i--) if (hitHs(list[i], x, y)) return list[i];
    return null;
  }
  async function run(fn) {
    G.busy++;
    try { await fn(); } catch (e) { console.error(e); } finally { G.busy--; }
  }
  OM.run = run;
  async function perform(h, kind) {
    if (typeof h.look === 'function' && kind === 'look') return h.look();
    const content = kind === 'look' ? h.look : null;
    if (content) {
      if (Array.isArray(content)) return OM.talk(content.map((s) => (Array.isArray(s) ? s : ['lev', s])));
      return OM.say('lev', content);
    }
  }
  async function interact(h, kind, item) {
    const token = ++G.action;
    if (h.walk) {
      const wk = typeof h.walk === 'function' ? h.walk() : h.walk;
      if (wk) {
        const ok = await OM.walk(wk[0], wk[1]);
        if (!ok || token !== G.action) return;
      }
    }
    if (h.face) G.hero.face = h.face;
    if (h.exit && kind !== 'look' && !item) {
      if (h.exit.when && !h.exit.when()) return run(() => perform(h, 'look'));
      return OM.go(h.exit.to, h.exit.entry);
    }
    await run(async () => {
      if (item) {
        const f = h.items && h.items[item];
        if (f) return f();
        if (h.anyItem) return h.anyItem(item);
        return OM.say('lev', pick(['Это тут не поможет.', 'Не думаю, что это сработает.', 'Нет.', 'Зачем?']));
      }
      if (kind === 'use' && h.use) return h.use();
      return perform(h, 'look');
    });
  }

  // ---------- Переходы, эффекты ----------
  OM.fadeTo = (v, ms = 500, color = '#000') =>
    new Promise((res) => {
      G.fx.fadeColor = color;
      if (G.fx.fadeRes) G.fx.fadeRes();
      G.fx.fadeRes = null;
      if (G.fx.fade === v) { G.fx.fadeTarget = v; return res(); }
      G.fx.fadeTarget = v;
      G.fx.fadeSpeed = 1000 / Math.max(1, ms);
      G.fx.fadeRes = res;
    });
  OM.letterbox = (on) => { G.fx.letterTarget = on ? 1 : 0; };
  OM.wait = (ms) => new Promise((r) => setTimeout(r, ms));
  OM.flash = (v = 1) => { G.fx.flash = Math.max(G.fx.flash, v); };
  OM.shake = (v = 6) => { G.fx.shake = v; };

  function setScene(id, entry, pos) {
    const sc = G.scenes[id];
    if (!sc._init) {
      sc._init = true;
      sc._actors = sc.actors ? sc.actors() : [];
      if (sc.init) sc.init();
    }
    G.scene = sc;
    G.sid = id;
    G.actors = [G.hero, ...sc._actors];
    // Статичные слои с глубиной (например, стойка, за которой сидит персонаж).
    (sc.layers || []).forEach((L, i) => {
      G.actors.push(makeActor({ id: 'layer' + i, y: L.z, autoScale: false, draw: (c) => c.drawImage(OM.cache(sc.id + ':L' + i, (g) => L.paint(g)), 0, 0, W, H) }));
    });
    const e = pos || (sc.entries && (sc.entries[entry] || sc.entries.default)) || { x: 640, y: 680, face: 1 };
    G.hero.x = e.x; G.hero.y = e.y; G.hero.face = e.face || 1;
    G.hero.target = null; G.hero.res = null; G.hero.move = 0;
    G.hero.visible = true;
    G.hero.s = depthOf(sc, G.hero.y);
    G.over = null;
    S.amb(sc.amb || {});
    S.tension(0);
    if (sc.setup) sc.setup(entry);
    G.rain = sc.rain ? new P.Rain(sc.rain.n || 420, sc.rain) : null;
    G.nextBolt = 6 + Math.random() * 10;
  }
  OM.setScene = setScene;

  OM.go = async (id, entry) => {
    G.busy++;
    G.sel = null;
    renderInv();
    if (G.scene && G.scene.leave) G.scene.leave();
    S.door();
    await OM.fadeTo(1, 380);
    setScene(id, entry);
    OM.save();
    await OM.wait(120);
    await OM.fadeTo(0, 520);
    G.busy--;
    if (G.scene.enter) await run(() => G.scene.enter(entry));
  };

  // ---------- Видения ----------
  OM.vision = (draw) => { G.vision = { draw, t: 0 }; };
  OM.endVision = () => { G.vision = null; };

  OM.card = (title, sub, ms = 3200) =>
    new Promise((res) => {
      const el = document.getElementById('card');
      el.querySelector('.t').textContent = title;
      el.querySelector('.s').textContent = sub || '';
      el.classList.add('on');
      setTimeout(() => { el.classList.remove('on'); setTimeout(res, 900); }, ms);
    });

  // ---------- Сохранение ----------
  const SAVE = 'omut-save-v1';
  OM.save = () => {
    if (G.mode !== 'play' || G.noSave) return;
    OM.store.set(SAVE, { sid: G.sid, x: G.hero.x, y: G.hero.y, face: G.hero.face, flags: G.flags, inv: G.inv });
  };
  OM.hasSave = () => !!OM.store.get(SAVE);
  OM.clearSave = () => OM.store.del(SAVE);
  OM.loadSave = async () => {
    const s = OM.store.get(SAVE);
    if (!s || !G.scenes[s.sid]) return false;
    G.flags = s.flags || {};
    G.inv = s.inv || [];
    G.mode = 'play';
    renderInv();
    setScene(s.sid, null, { x: s.x, y: s.y, face: s.face });
    await OM.fadeTo(0, 900);
    if (G.scene.resume) await run(() => G.scene.resume());
    return true;
  };

  // ---------- Ввод ----------
  function toLogical(e) {
    const r = stage.getBoundingClientRect();
    return [((e.clientX - r.left) / r.width) * W, ((e.clientY - r.top) / r.height) * H];
  }
  let pressT = null, pressPos = null, longFired = false;
  function onDown(e) {
    S.init();
    if (e.pointerType === 'touch') {
      G.touch = true;
      stage.classList.add('touch');
      const [x, y] = toLogical(e);
      G.mouse.x = x; G.mouse.y = y;
      pressPos = [x, y];
      longFired = false;
      clearTimeout(pressT);
      pressT = setTimeout(() => {
        longFired = true;
        click(x, y, 2);
      }, 480);
      return;
    }
    const [x, y] = toLogical(e);
    click(x, y, e.button);
  }
  function onUp(e) {
    if (e.pointerType !== 'touch') return;
    clearTimeout(pressT);
    if (!longFired && pressPos) click(pressPos[0], pressPos[1], 0);
    pressPos = null;
  }
  function click(x, y, button) {
    if (G.mode !== 'play') return;
    if (advanceSay()) return;
    if (G.choosing || G.busy) return;
    const h = findHs(x, y);
    if (button === 2) {
      if (G.sel) { G.sel = null; renderInv(); return; }
      if (h) interact(h, 'look');
      return;
    }
    if (G.sel) {
      const it = G.sel;
      if (h && (!h.exit || h.items)) {
        G.sel = null;
        renderInv();
        interact(h, 'use', it);
      } else {
        G.sel = null;
        renderInv();
      }
      return;
    }
    if (h) {
      // Повторный клик по выходу во время ходьбы — мгновенный переход.
      if (h.exit && G.hero.target && G.lastExit === h && (!h.exit.when || h.exit.when())) {
        G.action++;
        G.hero.target = null;
        OM.go(h.exit.to, h.exit.entry);
        return;
      }
      G.lastExit = h.exit ? h : null;
      S.click();
      interact(h, 'use');
      return;
    }
    G.lastExit = null;
    G.action++;
    if (G.scene.walk) OM.walk(x, y);
  }
  function onMove(e) {
    if (e.pointerType === 'touch') return;
    const [x, y] = toLogical(e);
    G.mouse.x = x; G.mouse.y = y; G.mouse.in = true;
    const nearBottom = y > H * 0.83;
    invEl.classList.toggle('open', nearBottom || !!G.sel);
  }

  // ---------- Обновление ----------
  function update(dt) {
    G.t += dt;
    const fx = G.fx;
    if (fx.fade !== fx.fadeTarget) {
      const d = fx.fadeSpeed * dt;
      fx.fade = Math.abs(fx.fadeTarget - fx.fade) <= d ? fx.fadeTarget : fx.fade + Math.sign(fx.fadeTarget - fx.fade) * d;
      if (fx.fade === fx.fadeTarget && fx.fadeRes) { const r = fx.fadeRes; fx.fadeRes = null; r(); }
    }
    fx.letter = lerp(fx.letter, fx.letterTarget, Math.min(1, dt * 4));
    fx.flash = Math.max(0, fx.flash - dt * 2.8);
    fx.shake = Math.max(0, fx.shake - dt * 18);
    updateSay(dt);
    invEl.classList.toggle('hidden', !!(G.busy || G.saying || G.choosing || G.mode !== 'play'));
    const sc = G.scene;
    if (!sc) return;
    for (const a of G.actors) updateActor(a, dt);
    if (sc.update) sc.update(dt, G.t);
    if (G.rain) G.rain.update(dt);
    if (sc.lightning && G.mode !== 'off') {
      G.nextBolt -= dt;
      if (G.nextBolt <= 0) {
        G.nextBolt = 14 + Math.random() * 18;
        bolt();
      }
    }
    if (G.vision) G.vision.t += dt;
    // подсветка хотспота под курсором
    if (G.mode === 'play' && !G.touch) {
      const h = !G.busy && !G.saying && !G.choosing ? findHs(G.mouse.x, G.mouse.y) : null;
      if (h !== G.over) {
        G.over = h;
        if (h) S.hover();
      }
      if (h) showLabel(G.sel ? `${OM.ITEMS[G.sel].name} → ${h.name}` : h.name);
      else if (!labelEl.classList.contains('inv')) hideLabel();
      labelEl.style.left = (G.mouse.x / W) * 100 + '%';
      labelEl.style.top = (G.mouse.y / H) * 100 + '%';
    }
  }
  async function bolt(strong) {
    OM.flash(strong ? 1 : 0.75);
    setTimeout(() => OM.flash(0.5), 120);
    if (G.scene.onBolt) G.scene.onBolt();
    S.thunder(strong ? 0.9 : 0.4 + Math.random() * 0.3);
  }
  OM.bolt = bolt;

  // ---------- Рендер ----------
  function render() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, cv.width, cv.height);
    const sc = G.scene;
    const sh = G.fx.shake;
    ctx.setTransform(ps, 0, 0, ps, (Math.random() - 0.5) * sh * ps, (Math.random() - 0.5) * sh * ps);
    const t = G.t;
    if (G.vision) {
      G.vision.draw(ctx, G.vision.t, t);
    } else if (sc) {
      ctx.drawImage(OM.cache(sc.id + ':bg', (g) => sc.paint(g)), 0, 0, W, H);
      if (sc.back) sc.back(ctx, t);
      const list = G.actors.filter((a) => a.visible !== false).sort((a, b) => (a.z ?? a.y) - (b.z ?? b.y));
      for (const a of list) {
        if (a.id === 'hero' || a.litByScene) a.rim = rimFor(a);
        a.draw(ctx, a, t);
      }
      if (sc.front) ctx.drawImage(OM.cache(sc.id + ':fg', (g) => sc.front(g)), 0, 0, W, H);
      if (G.rain) G.rain.draw(ctx, sc.rainLights || [], sc.rain.base ?? 0.1, sc.rain.tint);
      if (sc.over) sc.over(ctx, t);
      if (G.fx.flash > 0.01) {
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        ctx.fillStyle = `rgba(200,215,235,${G.fx.flash * 0.55})`;
        ctx.fillRect(0, 0, W, H);
        ctx.restore();
      }
    }
    ctx.setTransform(ps, 0, 0, ps, 0, 0);
    P.vignette(ctx, sc && sc.vignette != null ? sc.vignette : 1);
    P.grain(ctx, 0.09);
    // кинематографичные полосы
    const lb = G.fx.letter * 62;
    if (lb > 0.5) {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, W, lb);
      ctx.fillRect(0, H - lb, W, lb);
    }
    if (G.fx.fade > 0.001) {
      ctx.globalAlpha = G.fx.fade;
      ctx.fillStyle = G.fx.fadeColor;
      ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = 1;
    }
    drawCursor();
  }

  function drawCursor() {
    if (G.touch || !G.mouse.in || G.mode !== 'play') return;
    const { x, y } = G.mouse;
    const h = G.over;
    ctx.save();
    if (G.sel) {
      const ic = iconCanvas(G.sel);
      ctx.globalAlpha = 0.95;
      ctx.drawImage(ic, x - 22, y - 22, 44, 44);
      ctx.strokeStyle = h ? 'rgba(255,214,150,.9)' : 'rgba(255,255,255,.35)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(x, y, 27, 0, Math.PI * 2);
      ctx.stroke();
    } else if (G.busy || G.saying) {
      ctx.fillStyle = 'rgba(240,230,210,.35)';
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
    } else if (h && h.exit) {
      const d = h.exit.dir || 'right';
      const ang = { right: 0, left: Math.PI, up: -Math.PI / 2, down: Math.PI / 2 }[d];
      ctx.translate(x, y);
      ctx.rotate(ang);
      ctx.strokeStyle = 'rgba(255,220,170,.95)';
      ctx.lineWidth = 2.2;
      ctx.lineCap = 'round';
      const p = Math.sin(G.t * 6) * 2;
      for (const o of [-6, 4]) {
        ctx.beginPath();
        ctx.moveTo(o + p - 6, -9);
        ctx.lineTo(o + p + 3, 0);
        ctx.lineTo(o + p - 6, 9);
        ctx.stroke();
      }
    } else if (h) {
      const p = 1 + Math.sin(G.t * 5) * 0.08;
      ctx.strokeStyle = 'rgba(255,214,150,.95)';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(x, y, 13 * p, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,214,150,.95)';
      ctx.beginPath();
      ctx.arc(x, y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.strokeStyle = 'rgba(240,232,215,.7)';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  // ---------- Запуск ----------
  let last = 0;
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000 || 0);
    last = now;
    update(dt);
    render();
    requestAnimationFrame(frame);
  }

  OM.debug = { advance: advanceSay, findHs: (x, y) => findHs(x, y) };

  OM.boot = function () {
    stage = document.getElementById('stage');
    cv = document.getElementById('view');
    ctx = cv.getContext('2d');
    subs = document.getElementById('subs');
    subsWho = subs.querySelector('.who');
    subsText = subs.querySelector('.text');
    choicesEl = document.getElementById('choices');
    invEl = document.getElementById('inv');
    invItems = document.getElementById('inv-items');
    labelEl = document.getElementById('label');
    toastEl = document.getElementById('toast');
    resize();
    let rt;
    window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(resize, 120); });
    stage.addEventListener('pointerdown', onDown);
    stage.addEventListener('pointerup', onUp);
    stage.addEventListener('pointermove', onMove);
    stage.addEventListener('pointerleave', () => { G.mouse.in = false; hideLabel(); });
    stage.addEventListener('contextmenu', (e) => e.preventDefault());
    document.getElementById('inv-bag').addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      invEl.classList.toggle('open');
    });
    renderInv();
    requestAnimationFrame(frame);
  };
})();
