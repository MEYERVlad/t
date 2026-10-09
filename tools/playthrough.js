// Автопрохождение первой главы в headless Chromium: ловит ошибки и делает скриншоты ключевых моментов.
// Запуск: node tools/playthrough.js [папка_для_скриншотов]
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
  const G = (expr) => p.evaluate(expr);
  let step = 0;
  // Ждём, пока закончатся сцены и реплики; выбор в диалоге — первый невиданный вариант.
  async function idle(maxMs = 60000, shotAt) {
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
        await G(() => OM.debug.advance());
      }
      if (!s.busy && !s.saying && !s.choosing && !s.walking) { if (++quiet > 3) return; } else quiet = 0;
      await p.waitForTimeout(120);
    }
    throw new Error('timeout at step ' + step);
  }
  const click = async (x, y, label) => { step++; console.log(step, label); await p.mouse.click(x, y); await p.waitForTimeout(150); await idle(); };
  const use = async (item, x, y, label) => { await G(`OM.G.sel='${item}'`); await click(x, y, label + ' [' + item + ']'); };
  const expect = async (cond, msg) => { if (!(await G(cond))) throw new Error('FAILED: ' + msg); };

  await shot('00-title');
  await p.click('#title [data-act=new]');
  await p.waitForTimeout(6500);
  await shot('01-intro');
  await idle(60000, { name: '02-intro-dialog' });
  await expect(() => OM.G.sid === 'busstop' && OM.has('book'), 'intro done');

  await click(800, 672, 'puddle');
  await expect(() => OM.has('token'), 'token');
  await click(218, 440, 'poster');
  await expect(() => OM.flag('knowNumber'), 'number');
  await click(650, 520, 'phone');
  await expect(() => OM.flag('called') && !OM.has('token'), 'called');
  await click(1250, 640, 'exit to street');
  await expect(() => OM.G.sid === 'street', 'street');
  await shot('03-street');
  await click(1190, 540, 'gate locked');
  await click(355, 540, 'hotel door');
  await expect(() => OM.G.sid === 'lobby', 'lobby');
  await click(612, 360, 'talk zina');
  await expect(() => OM.has('key7') && OM.flag('knowBell'), 'checked in');
  await click(300, 230, 'photo vision');
  await click(1180, 400, 'stairs');
  await expect(() => OM.G.sid === 'room', 'room');
  await click(1200, 400, 'wardrobe');
  await expect(() => OM.has('umbrella'), 'umbrella');
  await shot('04-room');
  step++;
  await p.mouse.click(370, 560);
  await p.waitForTimeout(300);
  await idle(60000, { name: "04b-vision" });
  // выбор «да» сделан автоматически (первый вариант); ловим видение
  await p.waitForTimeout(100);
  await expect(() => OM.flag('vision'), 'vision');
  await click(870, 300, 'window');
  await expect(() => OM.flag('sawMitya'), 'saw mitya');
  await click(1104, 360, 'mirror');
  await click(80, 400, 'to lobby');
  await expect(() => OM.G.sid === 'lobby' && OM.flag('zinaSleeps'), 'lobby asleep');
  await click(740, 415, 'take bell');
  await expect(() => OM.has('bell'), 'bell');
  await use('umbrella', 720, 280, 'key board');
  await expect(() => OM.has('boatkey'), 'boatkey');
  await shot('05-lobby-night');
  await click(100, 400, 'to street');
  await use('boatkey', 1190, 540, 'gate');
  await expect(() => OM.flag('gateOpen'), 'gate open');
  await click(1190, 540, 'to pier');
  await expect(() => OM.G.sid === 'pier', 'pier');
  await shot('06-pier');
  await G(`OM.G.sel='bell'`);
  step++;
  await p.mouse.click(1100, 530);
  await idle(60000, { name: '07-rescue' });
  await p.waitForTimeout(3000);
  await shot('08-end');
  await p.waitForTimeout(9000);
  await expect(() => OM.G.mode === 'title', 'back to title');
  console.log(errs.length ? 'ERRORS:\n' + errs.join('\n') : 'OK, no errors');
  await b.close();
  process.exit(errs.length ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
