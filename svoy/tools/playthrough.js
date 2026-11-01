// Автопрохождение в Chromium: ловит ошибки и снимает кадры. node tools/playthrough.js [file] [seed-mode]
// Бот подглядывает в состояние, чтобы решать «впустить/прогнать» (с ошибками), и жмёт случайные проверки.
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const file = process.argv[2] || path.join(__dirname, '..', 'index.html');
const outDir = process.argv[3] || '/tmp/svoy-shots';
fs.mkdirSync(outDir, { recursive: true });

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto('file://' + path.resolve(file));
  await page.evaluate(() => { const w = SV.U.wait; SV.U.wait = (ms) => w(ms / 8); localStorage.clear(); });
  await page.waitForTimeout(800);
  await page.screenshot({ path: outDir + '/00-title.png' });
  let shotN = 1, steps = 0, lastScene = '', fxShots = {};
  const snap = async (name) => { await page.screenshot({ path: `${outDir}/${String(shotN++).padStart(2, '0')}-${name}.png` }); };
  while (steps++ < 3000) {
    if (errors.length) break;
    const info = await page.evaluate(() => {
      const S = SV.Game.state(), v = SV.Game.view;
      const btns = [...document.querySelectorAll('#actions button')].map((b, i) => ({ i, t: b.textContent, d: b.disabled }));
      const cur = S && S.queue && S.phase === 'night' ? S.queue[S.qi] : null;
      return { scene: v.scene, fx: v.st && v.st.fx, phase: S && S.phase, n: S && S.n, btns, mimic: cur ? cur.mimic : null, say: document.getElementById('say').textContent };
    });
    if (info.scene !== lastScene) { await page.waitForTimeout(400); await snap(info.scene + (info.n || '')); lastScene = info.scene; }
    const en = info.btns.filter((b) => !b.d);
    if (!en.length) { await page.click('#panel', { position: { x: 20, y: 60 } }).catch(() => {}); await page.waitForTimeout(60); continue; }
    let pick;
    const labels = en.map((b) => b.t);
    if (labels.includes('Ещё раз')) break;
    if (labels.some((t) => t === 'Впустить')) {
      const checks = en.filter((b) => !['Впустить', 'Прогнать'].includes(b.t) && !b.t.startsWith('Позвать'));
      const call = en.find((b) => b.t.startsWith('Позвать'));
      if (call) pick = call;
      else if (checks.length && Math.random() < 0.55) pick = checks[Math.floor(Math.random() * checks.length)];
      else {
        const right = Math.random() < 0.8;
        const letIn = right ? !info.mimic : info.mimic;
        pick = en.find((b) => b.t === (letIn ? 'Впустить' : 'Прогнать'));
      }
    } else if (labels.some((t) => t.startsWith('Колоть'))) {
      const opts = en.filter((b) => !b.t.startsWith('Ждать'));
      pick = Math.random() < 0.15 ? en.find((b) => b.t.startsWith('Ждать')) : opts[Math.floor(Math.random() * opts.length)];
    } else if (labels.includes('Назад')) {
      pick = en[Math.floor(Math.random() * (en.length - 1))];
    } else pick = en[0];
    await page.click(`#actions button >> nth=${pick.i}`).catch(() => {});
    await page.waitForTimeout(40);
    // Кадры эффектов проверок.
    const fx = await page.evaluate(() => SV.Game.view.st && SV.Game.view.st.fx);
    if (fx && !fxShots[fx]) { fxShots[fx] = 1; await page.waitForTimeout(260); await snap('fx-' + fx); }
    if (info.phase === 'end' && labels.includes('Ещё раз')) break;
    if (info.say && info.say.length && Math.random() < 0.02) await snap('misc');
  }
  const final = await page.evaluate(() => ({ S: SV.Game.state() && { n: SV.Game.state().n, hp: SV.Game.state().hp, phase: SV.Game.state().phase, log: SV.Game.state().log }, say: document.getElementById('say').textContent }));
  await snap('final');
  console.log(JSON.stringify(final, null, 1).slice(0, 1500));
  console.log('steps', steps, 'errors', errors);
  await browser.close();
  process.exit(errors.length ? 1 : 0);
})();
