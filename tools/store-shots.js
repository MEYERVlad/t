// Скриншоты для карточки RuStore (1920×1080) из ключевых сцен игры.
// Запуск: node tools/store-shots.js  → store/rustore/screenshots/
const path = require('path');
let pw;
try { pw = require('playwright'); } catch (e) { pw = require('/opt/node22/lib/node_modules/playwright'); }
const OUT = path.join(__dirname, '..', 'store', 'rustore', 'screenshots');
const SHOTS = [
  ['01-pier', '?scene=pier&flags=vision,zinaSleeps,boatKeyTaken&inv=book,bell', 'OM.G.hero.x=700'],
  ['02-church', '?scene=church&flags=ch3,churchSeen,threadsUnlocked', 'OM.G.hero.x=420'],
  ['03-map', '?scene=map&flags=ch4', ''],
  ['04-mirror', '?scene=veraflat&flags=ch4', 'OM.veraflat.st.active=true;OM.veraflat.vera.x=690;OM.veraflat.st.p=0.5;OM.G.hero.x=330'],
  ['05-zina', '?scene=zinaroom&flags=ch4,threadsUnlocked,zinaTalked', 'OM.G.hero.x=520'],
  ['06-inverse', '?scene=inverse&flags=ch5,inverseSeen&inv=book,list', 'OM.G.hero.x=140'],
  ['07-dawn', '?scene=dawn&flags=ch5,dawnSeen', 'OM.G.hero.x=520'],
  ['08-shore', '?scene=shore&flags=ch3,shoreSeen,threadsUnlocked', 'OM.G.hero.x=330'],
];
(async () => {
  const exe = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
  const b = await pw.chromium.launch(require('fs').existsSync(exe) ? { executablePath: exe } : {});
  for (const [name, q, js] of SHOTS) {
    const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
    p.on('pageerror', (e) => console.log(name, 'ERR', e.message));
    await p.goto('file://' + path.join(__dirname, '..', 'index.html') + q);
    await p.waitForTimeout(1500);
    await p.evaluate((code) => { OM.G.hero.item = 'none'; if (OM.G.saying) OM.G.saying.res(); OM.letterbox(false); eval(code); }, js);
    await p.mouse.move(-10, -10);
    await p.waitForTimeout(2500);
    await p.evaluate(() => { if (OM.G.saying) OM.G.saying.res(); document.getElementById('toast').classList.remove('on'); for (const s of ['#menu-btn', '#threads-btn', '#flip-btn', '#inv']) { const el = document.querySelector(s); if (el) el.style.visibility = 'hidden'; } });
    await p.waitForTimeout(400);
    await p.screenshot({ path: path.join(OUT, name + '.png') });
    console.log(name);
    await p.close();
  }
  await b.close();
})();
