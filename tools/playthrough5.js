// Автопрохождение пятой главы: три концовки, достижения, мета-эффекты.
// Запуск: node tools/playthrough5.js [папка_для_скриншотов]
const path = require('path');
let pw;
try { pw = require('playwright'); } catch (e) { pw = require('/opt/node22/lib/node_modules/playwright'); }
const OUT = process.argv[2] || path.join(__dirname, '..', 'shots');
require('fs').mkdirSync(OUT, { recursive: true });

(async () => {
  const exe = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
  const b = await pw.chromium.launch(require('fs').existsSync(exe) ? { executablePath: exe } : {});
  const ctx = await b.newContext({ viewport: { width: 1280, height: 720 } });
  const errs = [];
  let p, step = 0, want = null, endPick = 'A';
  const shot = (n) => p.screenshot({ path: path.join(OUT, n + '.png') });
  const G = (expr, arg) => p.evaluate(expr, arg);
  const log = (s) => { step++; console.log(step, s); };
  async function idle(maxMs = 120000, opts = {}) {
    const t0 = Date.now();
    let quiet = 0;
    while (Date.now() - t0 < maxMs) {
      const s = await G(() => ({ busy: OM.G.busy, saying: !!OM.G.saying, choosing: !!OM.G.choosing, walking: !!OM.G.hero.target, frags: document.getElementById('frags').classList.contains('on'), mode: OM.G.mode }));
      if (s.frags && opts.frags) { await opts.frags(); await p.waitForTimeout(1600); continue; }
      if (s.choosing) {
        const all = await p.$$('#choices button');
        const texts = await Promise.all(all.map((x) => x.textContent()));
        let i = -1;
        if (want) i = texts.findIndex((t) => t.startsWith(want));
        if (i < 0) { const fresh = await p.$$('#choices button:not(.seen)'); await (fresh.length > 1 ? fresh[0] : all[all.length - 1]).click(); }
        else await all[i].click();
      } else if (s.saying) {
        if (opts.shotAt && !opts.shotAt.done) { opts.shotAt.done = 1; await shot(opts.shotAt.name); }
        await G(() => OM.debug.advance());
      }
      if (opts.until && (await G(opts.until))) return;
      if (!s.busy && !s.saying && !s.choosing && !s.walking && !s.frags) { if (++quiet > 3) return; } else quiet = 0;
      await p.waitForTimeout(120);
    }
    throw new Error('timeout at step ' + step);
  }
  const expect = async (cond, msg, arg) => { if (!(await G(cond, arg))) throw new Error('FAILED: ' + msg); };
  const clickAt = async (x, y, label) => { log(label); await p.mouse.click(x, y); await p.waitForTimeout(150); await idle(); };
  const fragClick = async (idxs) => {
    for (const i of idxs) { const cards = await p.$$('#frags .frag'); await cards[i].dispatchEvent('pointerdown'); await p.waitForTimeout(200); }
  };

  async function open() {
    p = await ctx.newPage();
    p.on('pageerror', (e) => errs.push(e.message));
    p.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
    await p.goto('file://' + path.join(__dirname, '..', 'index.html'));
    await p.waitForTimeout(800);
  }

  async function playTo(endId, shots) {
    endPick = endId;
    await G(() => { document.getElementById('title').classList.add('off'); OM.story5.start(); });
    await p.waitForTimeout(6500);
    log('montage: own death');
    let first = true;
    await idle(60000, { frags: async () => {
      if (first && shots) await shot('c5-01-montage');
      first = false;
      await fragClick([1, 3, 0, 2]);
    }, until: () => OM.G.sid === 'dawn' && !OM.G.busy });
    await idle();
    await expect(() => OM.G.sid === 'dawn' && OM.ach.has('death'), 'dawn after montage');
    if (shots) await shot('c5-02-dawn');
    for (const who of ['zina', 'mitya', 'vera', 'nik', 'sem']) {
      const pos = await G((w) => OM.story5.present(w) && [OM.dawn.people[w].x, OM.dawn.people[w].y - 80], who);
      if (pos) await clickAt(pos[0], pos[1], 'farewell ' + who);
    }
    await expect(() => OM.story5.canGo(), 'all farewells');
    await clickAt(1230, 540, 'descend');
    await idle(60000, { until: () => OM.G.sid === 'inverse' && !OM.G.busy });
    await idle();
    await expect(() => OM.G.sid === 'inverse', 'inverse');
    if (shots) await shot('c5-03-inverse');
    // мальчик спит — колокольчик Мити
    log('wake the boy');
    await G(() => { OM.G.sel = 'bell'; });
    const boy = await G(() => { const a = OM.inverse.drowned.find((d) => d.id === 'boy'); return [a.x, a.y - 60]; });
    await p.mouse.click(boy[0], boy[1]);
    await p.waitForTimeout(200);
    await idle();
    await expect(() => OM.flag('boyAwake'), 'boy awake');
    if (endId !== 'A') {
      // имена: всмотреться и назвать
      for (const n of await G(() => OM.story5.NAMES.map((x) => [x.id, x.name]))) {
        log('name ' + n[0]);
        const hp = await G((id) => OM.inverse.headPos(OM.inverse.drowned.find((d) => d.id === id)), n[0]);
        await p.mouse.move(hp[0], hp[1]);
        await p.waitForTimeout(1900);
        await idle();
        want = n[1];
        const body = await G((id) => { const a = OM.inverse.drowned.find((d) => d.id === id); return [a.x, a.y - 60]; }, n[0]);
        await p.mouse.click(body[0], body[1]);
        await p.waitForTimeout(200);
        await idle();
        want = null;
        await expect((id) => OM.flag('named_' + id), 'named ' + n[0], n[0]);
      }
      await expect(() => OM.ach.has('names'), 'names achievement');
      if (shots) { await p.mouse.move(640, 300); await shot('c5-04-named'); }
    }
    // переворот, колокол, дыра в заборе
    log('flip to now');
    await G(() => OM.flipWorld());
    await p.waitForTimeout(1500);
    await expect(() => OM.inverse.st.world === 'now', 'world now');
    if (shots) await shot('c5-05-now');
    if (endId === 'C') {
      await G(() => { OM.G.hero.x = 880; });
      await clickAt(936, 520, 'ring the bell');
      await expect(() => OM.flag('bellRung'), 'bell rung');
    }
    log('through the fence gap');
    await G(() => { OM.G.hero.x = 1040; OM.inverse.st.breath = 1; });
    await p.mouse.click(1180, 660);
    await p.waitForTimeout(1500);
    await G(() => OM.flipWorld());
    await p.waitForTimeout(1500);
    await expect(() => OM.inverse.st.world === 'past' && OM.G.hero.x > 1100, 'in Anna\'s yard');
    await clickAt(1200, 450, 'Anna\'s house');
    await idle(30000, { until: () => OM.G.sid === 'annahouse' && !OM.G.busy });
    await idle();
    await expect(() => OM.G.sid === 'annahouse', 'anna house');
    if (shots) await shot('c5-06-anna');
    log('talk to mother → final montage');
    await G(() => (window.__omAutoCut = true));
    const pick = { A: 0, B: 1, C: 2 }[endId];
    await p.mouse.click(900, 500);
    await idle(240000, { frags: async () => { if (shots) await shot('c5-07-final'); await fragClick([pick]); }, until: () => OM.G.mode === 'title', shotAt: shots ? { name: 'c5-08-ending' } : null });
    await idle(60000, { until: () => OM.G.mode === 'title' });
    await expect((e) => OM.ach.has('end' + e), 'ending ' + endId, endId);
    if (shots) await shot('c5-09-title');
  }

  try {
    await open();
    await G(() => localStorage.clear());
    await playTo('C', true);
    await playTo('B', false);
    await expect(() => OM.store.get('omut-loop'), 'loop stored');
    await playTo('A', false);
    await expect(() => OM.store.get('omut-forgot') && document.querySelector('#title [data-act=ch2]').hidden, 'title forgot');
    await expect(() => OM.ach.has('all'), 'all endings achievement');
    await shot('c5-10-forgot');
    // «Чистый лист»: новая игра → холл «Зари»
    log('blank slate');
    await G(() => { OM.G.flags = {}; OM.G.mode = 'play'; document.getElementById('title').classList.add('off'); OM.setScene('lobby', 'door'); });
    const zr = await G(() => OM.G.scenes.lobby.hotspots.find((h) => h.id === 'zina').rect);
    await p.mouse.click(zr[0] + 60, zr[1] + 60);
    await p.waitForTimeout(300);
    await idle(60000, { until: () => OM.ach.has('blank') });
    await expect(() => OM.ach.has('blank') && !OM.store.get('omut-forgot'), 'blank slate');
  } catch (e) {
    console.log(e.message);
    await shot('c5-fail');
    errs.push(e.message);
  }
  console.log(errs.length ? 'ERRORS:\n' + errs.join('\n') : 'OK, no errors');
  await b.close();
  process.exit(errs.length ? 1 : 0);
})();
