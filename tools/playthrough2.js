// Автопрохождение второй главы в headless Chromium: ловит ошибки и делает скриншоты ключевых моментов.
// Запуск: node tools/playthrough2.js [папка_для_скриншотов]
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
  async function idle(maxMs = 60000, shotAt) {
    const t0 = Date.now();
    let quiet = 0;
    while (Date.now() - t0 < maxMs) {
      const s = await G(() => ({ busy: OM.G.busy, saying: !!OM.G.saying, choosing: !!OM.G.choosing, walking: !!OM.G.hero.target, frags: document.getElementById('frags').classList.contains('on') }));
      if (s.frags) return 'frags';
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
  const click = async (x, y, label, shotAt) => { step++; console.log(step, label); await p.mouse.click(x, y); await p.waitForTimeout(150); return idle(60000, shotAt); };
  const use = async (item, x, y, label) => { await G((i) => { OM.G.sel = i; }, item); return click(x, y, label + ' [' + item + ']'); };
  const expect = async (cond, msg) => { if (!(await G(cond))) throw new Error('FAILED: ' + msg); };

  await G(() => { document.getElementById('title').classList.add('off'); OM.story2.start(); });
  await p.waitForTimeout(5000);
  await idle(60000, { name: 'c2-01-morning' });
  await expect(() => OM.G.sid === 'lobby2' && OM.flag('ch2'), 'ch2 started');
  await click(1010, 560, 'mitya');
  await click(110, 450, 'to square');
  await expect(() => OM.G.sid === 'square', 'square');
  await shot('c2-02-square');
  await click(1086, 560, 'talk semenych', { name: 'c2-03-sem' });
  await expect(() => OM.has('zhuchok'), 'got zhuchok');
  await click(1210, 470, 'notice board');
  await click(930, 500, 'library door');
  await expect(() => OM.G.sid === 'library', 'library');
  await click(690, 470, 'talk vera', { name: 'c2-04-vera' });
  await expect(() => OM.flag('talkedVera'), 'talked vera');
  const r = await click(618, 480, 'kerosene lamp');
  if (r !== 'frags') throw new Error('puzzle did not open');
  await p.waitForTimeout(400);
  await shot('c2-05-puzzle');
  // неправильный порядок, потом правильный (карточки лежат как [2,0,3,1])
  for (const i of [0, 1, 2, 3]) { await p.click(`#frags .frag:nth-child(${i + 1})`); await p.waitForTimeout(120); }
  await p.waitForTimeout(1200);
  for (const i of [1, 3, 0, 2]) { await p.click(`#frags .frag:nth-child(${i + 1})`); await p.waitForTimeout(120); }
  await p.waitForTimeout(1500);
  await idle(60000);
  await expect(() => OM.flag('visionCh2'), 'vision solved');
  await use('zhuchok', 690, 470, 'give light to vera');
  await expect(() => OM.flag('lightSafe'), 'light safe');
  await use('book', 1200, 450, 'wedge archive door');
  await expect(() => OM.G.sid === 'archive', 'archive');
  await idle(60000);
  await p.mouse.move(725, 380);
  await p.waitForTimeout(300);
  await shot('c2-06-archive');
  step++;
  console.log(step, 'shelf 1955');
  await p.mouse.click(725, 380);
  // держим луч на Тихом
  const t0 = Date.now();
  let shotTall = false;
  while (Date.now() - t0 < 90000) {
    const s = await G(() => ({ on: OM.archive.st.tallOn, a: OM.archive.st.tallA, x: OM.archive.tall.x, mode: OM.G.mode, saying: !!OM.G.saying, end: OM.store.get('omut-ch2-done') }));
    if (s.on && s.a > 0.5) {
      await p.mouse.move(s.x, 500);
      if (!shotTall) { shotTall = true; await p.waitForTimeout(300); await shot('c2-07-tall'); }
    }
    if (s.saying) await G(() => OM.debug.advance());
    if (s.end && s.mode === 'title') break;
    await p.waitForTimeout(100);
  }
  await expect(() => OM.store.get('omut-ch2-done') && OM.G.mode === 'title', 'chapter 2 finished');
  console.log(errs.length ? 'ERRORS:\n' + errs.join('\n') : 'OK, no errors');
  await b.close();
  process.exit(errs.length ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
