// Автопрохождение третьей главы в headless Chromium: ловит ошибки и делает скриншоты ключевых моментов.
// Запуск: node tools/playthrough3.js [папка_для_скриншотов]
const path = require('path');
let pw;
try { pw = require('playwright'); } catch (e) { pw = require('/opt/node22/lib/node_modules/playwright'); }
const OUT = process.argv[2] || path.join(__dirname, '..', 'shots');
require('fs').mkdirSync(OUT, { recursive: true });

(async () => {
  const exe = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
  const b = await pw.chromium.launch(require('fs').existsSync(exe) ? { executablePath: exe } : {});
  const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
  const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  p.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
  await p.goto('file://' + path.join(__dirname, '..', 'index.html'));
  await p.waitForTimeout(800);
  const shot = (n) => p.screenshot({ path: path.join(OUT, n + '.png') });
  const G = (expr, arg) => p.evaluate(expr, arg);
  let step = 0;
  async function idle(maxMs = 90000, shotAt) {
    const t0 = Date.now();
    let quiet = 0;
    while (Date.now() - t0 < maxMs) {
      const s = await G(() => ({ busy: OM.G.busy, saying: !!OM.G.saying, choosing: !!OM.G.choosing, walking: !!OM.G.hero.target }));
      if (s.choosing) {
        const btns = await p.$$('#choices button:not(.seen)');
        const all = await p.$$('#choices button');
        await (btns[0] || all[all.length - 1]).click();
      } else if (s.saying) {
        if (shotAt && !shotAt.done) { shotAt.done = 1; await shot(shotAt.name); }
        await G(() => OM.debug.advance());
      }
      if (!s.busy && !s.saying && !s.choosing && !s.walking) { if (++quiet > 3) return; } else quiet = 0;
      await p.waitForTimeout(120);
    }
    throw new Error('timeout at step ' + step);
  }
  const click = async (x, y, label, shotAt) => { step++; console.log(step, label); await p.mouse.click(x, y); await p.waitForTimeout(150); return idle(90000, shotAt); };
  const use = async (item, x, y, label) => { await G((i) => { OM.G.sel = i; }, item); return click(x, y, label + ' [' + item + ']'); };
  const expect = async (cond, msg, arg) => { if (!(await G(cond, arg))) throw new Error('FAILED: ' + msg); };

  await G(() => { document.getElementById('title').classList.add('off'); OM.story3.start(); });
  await p.waitForTimeout(5500);
  await idle(60000, { name: 'c3-01-arrive' });
  await expect(() => OM.G.sid === 'shore' && OM.flag('ch3'), 'ch3 started');
  await click(520, 540, 'talk nikodim (unlock threads)');
  await expect(() => OM.flag('threadsUnlocked'), 'threads unlocked');
  await click(520, 540, 'talk nikodim (questions)');
  await G(() => OM.toggleThreads(true));
  await p.waitForTimeout(700);
  await shot('c3-02-threads');
  await click(700, 640, 'key in puddle');
  await expect(() => OM.has('chapelkey'), 'got key');
  await use('chapelkey', 120, 450, 'open chapel');
  await expect(() => OM.has('rope') && OM.has('oars'), 'oars and rope');
  await click(680, 580, 'boat');
  await expect(() => OM.G.sid === 'lake', 'lake');
  await idle(30000);
  await expect(() => OM.lake.st.active, 'rowing active');
  // столкновение с тем, кто стоит в воде
  await G(() => Object.assign(OM.lake.st, { px: -30, pz: 87, head: 0 }));
  await p.waitForTimeout(600);
  await expect(() => OM.lake.st.hits >= 1, 'collision registered');
  // поворот: зажатая правая половина экрана
  const h0 = await G(() => OM.lake.st.head);
  await p.mouse.move(1100, 360); await p.mouse.down(); await p.waitForTimeout(800); await p.mouse.up();
  await expect((h) => OM.lake.st.head > h + 0.05, 'steering right', h0);
  await G(() => Object.assign(OM.lake.st, { px: 0, pz: 250, head: 0 }));
  await p.waitForTimeout(800);
  await shot('c3-03-lake');
  await G(() => Object.assign(OM.lake.st, { px: 0, pz: 420, head: 0 }));
  await p.waitForTimeout(600);
  await idle(60000);
  await expect(() => OM.G.sid === 'church', 'church');
  await p.mouse.move(640, 700);
  await idle(30000);
  await shot('c3-04-church');
  // взгляд: держим курсор на лице — нить обрывается
  step++; console.log(step, 'gaze fail');
  await G(() => { OM.G.hero.x = 380; });
  await p.waitForTimeout(300);
  const head = await G(() => { const a = OM.church.parish[4]; return [a.x + a.face * 14.6 * a.s, a.y - 382 * a.s]; });
  await p.mouse.move(head[0], head[1]);
  await p.waitForTimeout(1200);
  await shot('c3-05-gaze');
  const t0 = Date.now();
  while (Date.now() - t0 < 6000 && !(await G(() => OM.church.st.failing))) await p.waitForTimeout(100);
  await expect(() => OM.church.st.failing || OM.G.busy, 'gaze failed');
  await p.mouse.move(640, 700);
  await idle(30000);
  await expect(() => OM.G.hero.x < 200, 'reset to entrance');
  await click(880, 622, 'walk to font');
  await G(() => OM.toggleThreads(true));
  await p.waitForTimeout(500);
  await p.mouse.move(640, 700);
  step++; console.log(step, 'take cross + flashback');
  await p.mouse.click(910, 572);
  await p.mouse.move(640, 700);
  await p.waitForTimeout(9000);
  await shot('c3-06-flashback');
  await idle(120000);
  await expect(() => OM.has('cross') && OM.flag('flashback'), 'flashback done');
  await click(85, 420, 'to belfry');
  await expect(() => OM.G.sid === 'belfry', 'belfry');
  await use('rope', 640, 280, 'tie rope');
  await expect(() => OM.flag('ropeTied'), 'rope tied');
  step++; console.log(step, 'ring');
  await p.mouse.click(640, 280);
  await p.waitForTimeout(4500);
  await shot('c3-07-ring');
  const t1 = Date.now();
  while (Date.now() - t1 < 60000) {
    const s = await G(() => ({ saying: !!OM.G.saying, mode: OM.G.mode, end: OM.store.get('omut-ch3-done') }));
    if (s.saying) await G(() => OM.debug.advance());
    if (s.end && s.mode === 'title') break;
    await p.waitForTimeout(150);
  }
  await expect(() => OM.store.get('omut-ch3-done') && OM.G.mode === 'title', 'chapter 3 finished');
  console.log(errs.length ? 'ERRORS:\n' + errs.join('\n') : 'OK, no errors');
  await b.close();
  process.exit(errs.length ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
