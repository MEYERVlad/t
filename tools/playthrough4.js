// Автопрохождение четвёртой главы в headless Chromium: три маршрута, ошибки, скриншоты.
// Запуск: node tools/playthrough4.js [папка_для_скриншотов]
const path = require('path');
let pw;
try { pw = require('playwright'); } catch (e) { pw = require('/opt/node22/lib/node_modules/playwright'); }
const OUT = process.argv[2] || path.join(__dirname, '..', 'shots');
require('fs').mkdirSync(OUT, { recursive: true });

(async () => {
  const exe = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
  const b = await pw.chromium.launch(require('fs').existsSync(exe) ? { executablePath: exe } : {});
  const errs = [];
  let p, step = 0;
  const shot = (n) => p.screenshot({ path: path.join(OUT, n + '.png') });
  const G = (expr, arg) => p.evaluate(expr, arg);
  let pick = 0; // какой вариант выбирать в развилке пролога
  async function idle(maxMs = 90000, shotAt) {
    const t0 = Date.now();
    let quiet = 0;
    while (Date.now() - t0 < maxMs) {
      const s = await G(() => ({ busy: OM.G.busy, saying: !!OM.G.saying, choosing: !!OM.G.choosing, walking: !!OM.G.hero.target }));
      if (s.choosing) {
        const all = await p.$$('#choices button');
        const texts = await Promise.all(all.map((x) => x.textContent()));
        if (texts.some((t) => t.includes('Никодим'))) await all[pick].click();
        else if (texts[0].startsWith('Идти')) await all[0].click();
        else {
          const fresh = await p.$$('#choices button:not(.seen)');
          await (fresh.length > 1 ? fresh[0] : all[all.length - 1]).click();
        }
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
  async function open() {
    p = await b.newPage({ viewport: { width: 1280, height: 720 } });
    p.on('pageerror', (e) => errs.push(e.message));
    p.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
    await p.goto('file://' + path.join(__dirname, '..', 'index.html'));
    await p.waitForTimeout(800);
  }
  async function start(choice, shotName) {
    pick = choice;
    await G(() => { document.getElementById('title').classList.add('off'); OM.story4.start(); });
    await p.waitForTimeout(5000);
    await idle(90000, shotName ? { name: shotName } : null);
    await expect(() => OM.G.sid === 'map' && OM.flag('ch4'), 'map after prologue');
  }

  // --- Зина: поговорить, перенести нить к Мите ---
  async function doZina(shots) {
    await click(300, 300, 'map → hotel');
    await expect(() => OM.G.sid === 'zinaroom', 'zina room');
    await idle();
    if (shots) await shot('c4-04-zina');
    await click(850, 470, 'talk zina');
    await expect(() => OM.flag('zinaTalked'), 'talked');
    await G(() => OM.toggleThreads(true));
    await p.waitForTimeout(800);
    step++; console.log(step, 'drag thread to Mitya');
    // захват посреди нити; рывок — замереть
    const mid = await G(() => OM.zinaroom.rope.pts[16]);
    await p.mouse.move(mid[0], mid[1]);
    await p.mouse.down();
    await expect(() => OM.zinaroom.rope.grab >= 0, 'grabbed');
    await G(() => (OM.zinaroom.st.tugT = 0.7));
    await p.waitForTimeout(1600);
    await expect(() => OM.zinaroom.rope.grab >= 0, 'still holding after tug');
    await G(() => (OM.zinaroom.st.tugT = 99));
    for (let i = 0; i <= 30; i++) { await p.mouse.move(lerp(mid[0], 196, i / 30), lerp(mid[1], 440, i / 30)); await p.waitForTimeout(90); }
    if (shots) await shot('c4-05-thread');
    await p.waitForTimeout(2600);
    await p.mouse.up();
    await idle();
    await expect(() => OM.flag('saved_hotel') || OM.G.mode === 'title', 'zina saved');
  }
  const lerp = (a, b, k) => a + (b - a) * k;
  // --- Вера: голос, вилка, платок, зеркало ---
  async function doVera(shots) {
    await click(700, 322, 'map → library');
    await expect(() => OM.G.sid === 'veraflat', 'vera flat');
    await idle();
    if (shots) { await p.waitForTimeout(3000); await shot('c4-06-vera'); }
    await click(700, 500, 'radio off (comes back)');
    await click(800, 548, 'pull plug');
    await expect(() => OM.veraflat.st.radio === 'dead', 'radio dead');
    await click(565, 500, 'take shawl');
    await expect(() => OM.has('shawl'), 'shawl');
    await use('shawl', 1010, 360, 'cover mirror');
    await idle();
    await expect(() => OM.flag('saved_library') || OM.G.mode === 'title', 'vera saved');
  }
  // --- Семёныч: светить, догнать ---
  async function doSem(shots) {
    await click(930, 444, 'map → boat station');
    await expect(() => OM.G.sid === 'boatyard', 'boatyard');
    await idle();
    await p.mouse.move(900, 450);
    await p.waitForTimeout(4500);
    if (shots) await shot('c4-03-boatyard');
    step++; console.log(step, 'grab fail + reset');
    await G(() => { const h = OM.G.hero; h.x = 700; h.y = 612; OM.boatyard.st.talls.push({ x: 720, y: 652, lane: 'f', s: 0.6, a: 1, state: 'stalk', lit: 0, seed: 1, face: -1, rise: 1, reach: 0 }); });
    await p.mouse.move(100, 100);
    await p.waitForTimeout(800);
    await idle();
    await expect(() => OM.G.hero.x === 150 && !OM.boatyard.st.failing, 'reset after grab');
    step++; console.log(step, 'catch Semyonych');
    await G(() => { OM.boatyard.st.talls = []; OM.boatyard.st.spawnT = 99; const s = OM.boatyard.sem; OM.G.hero.x = s.x - 140; OM.G.hero.y = 612; });
    await p.mouse.click(await G(() => OM.boatyard.sem.x - 20), 612);
    await p.waitForTimeout(2500);
    await idle();
    await expect(() => OM.flag('saved_sem') || OM.G.mode === 'title', 'sem saved');
  }
  async function finish(lost, shots) {
    await idle(120000, shots ? { name: 'c4-08-midnight' } : null);
    await p.waitForTimeout(200);
    await expect(() => OM.G.mode === 'title' || OM.G.sid === 'midnight', 'reached midnight/title');
    const out = await G(() => OM.store.get('omut-ch4'));
    console.log('outcome', JSON.stringify(out));
    if (JSON.stringify(out.lost) !== JSON.stringify(lost)) throw new Error('FAILED: outcome ' + JSON.stringify(out));
  }

  try {
    // Маршрут A: сам, Зина → Вера, Семёныча не успеть.
    await open();
    await start(0, 'c4-01-panorama');
    await shot('c4-02-map');
    await doZina(true);
    await doVera(true);
    await finish(['sem'], true);
    await p.close();
    // Маршрут B: сам, Семёныч → Зина; Веру не успеть.
    await open();
    await start(0);
    await doSem(true);
    await doZina(false);
    await finish(['library']);
    await p.close();
    // Маршрут C: Никодим идёт к Семёнычу; Вера → Зина.
    await open();
    await start(1);
    await expect(() => OM.flag('nikGoes'), 'nik goes');
    await click(930, 444, 'sem is locked');
    await expect(() => OM.G.sid === 'map', 'still on map');
    await doVera(false);
    await doZina(false);
    await finish([]);
    const out = await G(() => OM.store.get('omut-ch4'));
    if (!out.nik) throw new Error('FAILED: nik flag');
  } catch (e) {
    console.log(e.message);
    await shot('c4-fail');
    errs.push(e.message);
  }
  console.log(errs.length ? 'ERRORS:\n' + errs.join('\n') : 'OK, no errors');
  await b.close();
  process.exit(errs.length ? 1 : 0);
})();
