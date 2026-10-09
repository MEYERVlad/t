// Рендер трейлера в MP4 (1920×1080, 30 к/с) со звуком: кадры из headless Chromium, звук — офлайн WebAudio, склейка — ffmpeg.
// Запуск: node tools/trailer-export.js [out.mp4] [--fps 30] [--only 12.5,47,60 (только кадры-превью)]
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
let pw;
try { pw = require('playwright'); } catch (e) { pw = require('/opt/node22/lib/node_modules/playwright'); }

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const out = path.resolve(args.find((a) => a.endsWith('.mp4') || a.endsWith('/')) || 'dist/omut-trailer.mp4');
const fps = +opt('--fps', 30);
const only = opt('--only', null);

(async () => {
  const exe = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
  const b = await pw.chromium.launch(fs.existsSync(exe) ? { executablePath: exe } : {});
  const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  p.on('pageerror', (e) => console.error('PAGE ERROR', e.message));
  const root = path.join(__dirname, '..');
  const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.wav': 'audio/wav', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.m4a': 'audio/mp4', '.webm': 'audio/webm' };
  const srv = require('http').createServer((req, res) => {
    const f = path.join(root, decodeURIComponent(req.url.split('?')[0]));
    if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' });
    fs.createReadStream(f).pipe(res);
  }).listen(0);
  await new Promise((r) => srv.on('listening', r));
  await p.goto(`http://127.0.0.1:${srv.address().port}/trailer.html?export`);
  await p.waitForFunction(() => window.TR_READY, null, { timeout: 120000 });
  const dur = await p.evaluate(() => TR.DUR);
  console.log('реплик озвучки найдено:', await p.evaluate(() => window.TR_VO));
  const tmp = fs.mkdtempSync(path.join(require('os').tmpdir(), 'omut-'));

  const grab = async (t, dt) => {
    const data = await p.evaluate(([t, dt]) => { TR.frame(t, dt); return document.getElementById('film').toDataURL('image/jpeg', 0.93); }, [t, dt]);
    return Buffer.from(data.split(',')[1], 'base64');
  };

  const audioOnly = opt('--audio', null);
  if (audioOnly) {
    // Только звуковая дорожка — для проверки синхрона.
    fs.writeFileSync(audioOnly, Buffer.from(await p.evaluate(() => OM.TRA.renderWav()), 'base64'));
    console.log(audioOnly);
    await b.close();
    srv.close();
    return;
  }

  if (only) {
    // Превью: прогоняем время до каждой точки, чтобы дождь/вспышки были в правильном состоянии.
    const pts = only.split(',').map(Number).sort((a, b) => a - b);
    let t = 0;
    for (const pt of pts) {
      while (t < pt - 1 / fps) { await p.evaluate(([t, dt]) => TR.frame(t, dt), [t, 1 / fps]); t += 1 / fps; }
      const f = path.join(path.dirname(out), `preview-${pt}.jpg`);
      fs.writeFileSync(f, await grab(pt, 1 / fps));
      console.log(f);
    }
    await b.close();
    srv.close();
    return;
  }

  console.log('звук…');
  const wav = await p.evaluate(() => OM.TRA.renderWav());
  fs.writeFileSync(path.join(tmp, 'audio.wav'), Buffer.from(wav, 'base64'));
  const n = Math.ceil(dur * fps);
  for (let i = 0; i < n; i++) {
    fs.writeFileSync(path.join(tmp, String(i).padStart(5, '0') + '.jpg'), await grab(i / fps, 1 / fps));
    if (i % (fps * 5) === 0) console.log(`кадр ${i}/${n}`);
  }
  await b.close();
  srv.close();
  fs.mkdirSync(path.dirname(out), { recursive: true });
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(fps), '-i', path.join(tmp, '%05d.jpg'), '-i', path.join(tmp, 'audio.wav'),
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '20', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', out], { stdio: 'inherit' });
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log('готово:', out);
})().catch((e) => { console.error(e); process.exit(1); });
