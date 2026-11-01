// Весь звук генерируется кодом: ветер, печь, стук, собака, радио, гул, музыка.
(function () {
  const A = (SV.A = { muted: false });
  let c, master, amb, sfx, rev, noise, wind, windF, windG, fireG, droneG, radioG, radioNode;
  let musicTimer = null, mode = 'none';

  function g(v, to) { const n = c.createGain(); n.gain.value = v; if (to) n.connect(to); return n; }
  function f(type, freq, q = 0.7) { const n = c.createBiquadFilter(); n.type = type; n.frequency.value = freq; n.Q.value = q; return n; }
  const now = () => c.currentTime;

  A.init = function () {
    if (c) { if (c.state !== 'running') c.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    c = new AC();
    master = g(A.muted ? 0 : 0.85);
    const comp = c.createDynamicsCompressor();
    master.connect(comp); comp.connect(c.destination);
    amb = g(1, master);
    sfx = g(0.9, master);
    // Короткая «изба»: ревербератор из затухающего шума.
    rev = c.createConvolver();
    const len = c.sampleRate * 1.6, rb = c.createBuffer(2, len, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = rb.getChannelData(ch);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
    }
    rev.buffer = rb;
    rev.connect(g(0.35, master));
    noise = c.createBuffer(1, c.sampleRate * 2, c.sampleRate);
    const nd = noise.getChannelData(0);
    for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;

    // Ветер: шум через полосовой фильтр, частота гуляет.
    wind = src(noise, true); windF = f('bandpass', 400, 0.8); windG = g(0, amb);
    wind.connect(windF); windF.connect(windG); wind.start();
    // Печь: треск — короткие щелчки, плюс низкий гул пламени.
    fireG = g(0, amb);
    const fs = src(noise, true), ff = f('lowpass', 300); fs.connect(ff); ff.connect(fireG); fs.start();
    // Ночной гул: две расстроенные синусоиды.
    droneG = g(0, amb);
    const df = f('lowpass', 500);
    df.connect(droneG);
    [55, 55.7, 82.4].forEach((fr) => { const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = fr; const og = g(0.05, df); o.connect(og); o.start(); });
    // Радио — отдельный канал шипения.
    radioG = g(0, sfx);
    radioNode = src(noise, true); const rf = f('bandpass', 2400, 0.6); radioNode.connect(rf); rf.connect(radioG); radioNode.start();

    tick();
  };

  function src(buf, loop) { const s = c.createBufferSource(); s.buffer = buf; s.loop = !!loop; return s; }

  // Медленная жизнь фона: ветер дует порывами, печь потрескивает.
  function tick() {
    if (!c) return;
    const t = now();
    const gust = 0.5 + 0.5 * Math.sin(t * 0.37) * Math.sin(t * 0.11 + 1);
    windF.frequency.setTargetAtTime(250 + gust * 700, t, 0.4);
    if (fireG.gain.value > 0.01 && Math.random() < 0.5) crackle();
    setTimeout(tick, 120);
  }

  function crackle() {
    const s = src(noise), hp = f('highpass', 1500 + Math.random() * 3000), e = g(0, sfx);
    s.connect(hp); hp.connect(e);
    const t = now();
    e.gain.setValueAtTime(0.04 + Math.random() * 0.06 * fireG.gain.value * 4, t);
    e.gain.exponentialRampToValueAtTime(0.0001, t + 0.03 + Math.random() * 0.04);
    s.start(t, Math.random()); s.stop(t + 0.1);
  }

  // Смена «сцены» звука.
  A.mood = function (m) {
    if (!c) { mode = m; return; }
    mode = m;
    const t = now(), set = (node, v) => node.gain.setTargetAtTime(v, t, 0.8);
    const M = {
      title: [0.22, 0, 0.5], night: [0.28, 0, 0.9], day: [0.05, 0.18, 0], morning: [0.12, 0, 0.2], end: [0.15, 0.05, 0.4], none: [0, 0, 0],
    }[m] || [0, 0, 0];
    set(windG, M[0]); set(fireG, M[1]); set(droneG, M[2]);
    music();
  };

  // Музыка: днём — тихий «музыкальный ящик», ночью — редкие низкие ноты.
  function music() {
    clearTimeout(musicTimer);
    if (!c) return;
    const scaleDay = [0, 3, 5, 7, 10, 12, 15];
    const step = () => {
      if (mode === 'day' || mode === 'title' || mode === 'end') {
        const base = mode === 'day' ? 392 : 220;
        const n = scaleDay[Math.floor(Math.random() * scaleDay.length)];
        pluck(base * Math.pow(2, n / 12), mode === 'day' ? 0.05 : 0.04, mode === 'day' ? 'triangle' : 'sine');
        musicTimer = setTimeout(step, 900 + Math.random() * 1500);
      } else if (mode === 'night') {
        if (Math.random() < 0.4) pluck(110 * Math.pow(2, [0, 1, 6, 7][Math.floor(Math.random() * 4)] / 12), 0.05, 'sine', 3);
        musicTimer = setTimeout(step, 3000 + Math.random() * 4000);
      }
    };
    musicTimer = setTimeout(step, 1200);
  }

  function pluck(freq, vol, type = 'triangle', dur = 1.6) {
    const o = c.createOscillator(), e = g(0, sfx), t = now();
    o.type = type; o.frequency.value = freq;
    o.connect(e); e.connect(rev);
    e.gain.setValueAtTime(0, t);
    e.gain.linearRampToValueAtTime(vol, t + 0.01);
    e.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.start(t); o.stop(t + dur + 0.1);
  }

  function thump(t, freq = 80, vol = 0.6) {
    const o = c.createOscillator(), e = g(0, sfx);
    o.frequency.setValueAtTime(freq * 1.8, t); o.frequency.exponentialRampToValueAtTime(freq, t + 0.08);
    o.connect(e);
    e.gain.setValueAtTime(vol, t); e.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
    o.start(t); o.stop(t + 0.3);
    const s = src(noise), lp = f('lowpass', 900), e2 = g(0, sfx);
    s.connect(lp); lp.connect(e2); e2.connect(rev);
    e2.gain.setValueAtTime(vol * 0.7, t); e2.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
    s.start(t, Math.random()); s.stop(t + 0.2);
  }

  const P = {};
  P.knock = (n = 3) => { const t = now(); for (let i = 0; i < n; i++) thump(t + i * 0.28 + Math.random() * 0.05, 70 + Math.random() * 20, 0.7); };
  P.bang = () => { const t = now(); for (let i = 0; i < 5; i++) thump(t + i * 0.13, 55, 0.9); };
  P.click = () => pluck(880, 0.03, 'square', 0.06);
  P.blip = () => pluck(520 + Math.random() * 80, 0.012, 'square', 0.03);
  P.creak = () => {
    const o = c.createOscillator(), e = g(0, sfx), t = now(), bp = f('bandpass', 700, 6);
    o.type = 'sawtooth'; o.frequency.setValueAtTime(90, t); o.frequency.linearRampToValueAtTime(140, t + 0.6); o.frequency.linearRampToValueAtTime(70, t + 1.1);
    o.connect(bp); bp.connect(e); e.connect(rev);
    e.gain.setValueAtTime(0, t); e.gain.linearRampToValueAtTime(0.25, t + 0.1); e.gain.linearRampToValueAtTime(0, t + 1.1);
    o.start(t); o.stop(t + 1.2);
  };
  P.breath = () => {
    const s = src(noise), bp = f('bandpass', 900, 0.5), e = g(0, sfx), t = now();
    s.connect(bp); bp.connect(e);
    e.gain.setValueAtTime(0, t); e.gain.linearRampToValueAtTime(0.25, t + 0.3); e.gain.linearRampToValueAtTime(0, t + 1.2);
    s.start(t, Math.random()); s.stop(t + 1.3);
  };
  P.steps = (n = 6, gap = 0.45) => {
    const t = now();
    for (let i = 0; i < n; i++) {
      const s = src(noise), bp = f('bandpass', 600 + Math.random() * 400, 1.5), e = g(0, sfx), tt = t + i * gap;
      s.connect(bp); bp.connect(e);
      const v = 0.3 * (1 - i / (n + 2));
      e.gain.setValueAtTime(v, tt); e.gain.exponentialRampToValueAtTime(0.0001, tt + 0.18);
      s.start(tt, Math.random()); s.stop(tt + 0.2);
    }
  };
  P.growl = () => {
    const o = c.createOscillator(), am = c.createOscillator(), amg = g(0.5), e = g(0, sfx), t = now(), lp = f('lowpass', 600);
    o.type = 'sawtooth'; o.frequency.setValueAtTime(95, t); o.frequency.linearRampToValueAtTime(80, t + 1.5);
    am.frequency.value = 23; am.connect(amg); amg.connect(e.gain);
    o.connect(lp); lp.connect(e);
    e.gain.setValueAtTime(0, t); e.gain.linearRampToValueAtTime(0.35, t + 0.2); e.gain.linearRampToValueAtTime(0, t + 1.6);
    o.start(t); am.start(t); o.stop(t + 1.7); am.stop(t + 1.7);
  };
  P.bark = (n = 2) => {
    const t0 = now();
    for (let i = 0; i < n; i++) {
      const t = t0 + i * 0.32, o = c.createOscillator(), e = g(0, sfx), bp = f('bandpass', 900, 1.2);
      o.type = 'square'; o.frequency.setValueAtTime(480, t); o.frequency.exponentialRampToValueAtTime(220, t + 0.14);
      o.connect(bp); bp.connect(e); e.connect(rev);
      e.gain.setValueAtTime(0.3, t); e.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
      o.start(t); o.stop(t + 0.2);
    }
  };
  P.whine = () => {
    const o = c.createOscillator(), e = g(0, sfx), t = now();
    o.type = 'sine'; o.frequency.setValueAtTime(900, t); o.frequency.linearRampToValueAtTime(1300, t + 0.4); o.frequency.linearRampToValueAtTime(800, t + 0.8);
    o.connect(e);
    e.gain.setValueAtTime(0, t); e.gain.linearRampToValueAtTime(0.06, t + 0.1); e.gain.linearRampToValueAtTime(0, t + 0.85);
    o.start(t); o.stop(t + 0.9);
  };
  // Резкий диссонанс — когда что-то не так.
  P.sting = () => {
    const t = now();
    [233, 247, 349, 370].forEach((fr, i) => {
      const o = c.createOscillator(), e = g(0, sfx);
      o.type = i % 2 ? 'sawtooth' : 'triangle'; o.frequency.value = fr; o.detune.linearRampToValueAtTime(-40, t + 2);
      o.connect(e); e.connect(rev);
      e.gain.setValueAtTime(0, t); e.gain.linearRampToValueAtTime(0.06, t + 0.05); e.gain.exponentialRampToValueAtTime(0.0001, t + 2.2);
      o.start(t); o.stop(t + 2.3);
    });
  };
  P.soft = () => { [0, 4, 7].forEach((n, i) => setTimeout(() => pluck(330 * Math.pow(2, n / 12), 0.05, 'triangle', 2), i * 90)); };
  P.door = () => { P.creak(); setTimeout(() => thump(now(), 60, 0.5), 900); };
  P.chop = () => { const t = now(); thump(t, 140, 0.5); };
  P.heart = () => { const t = now(); thump(t, 50, 0.5); thump(t + 0.22, 45, 0.35); };
  P.match = () => {
    const s = src(noise), hp = f('highpass', 2500), e = g(0, sfx), t = now();
    s.connect(hp); hp.connect(e);
    e.gain.setValueAtTime(0.2, t); e.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
    s.start(t, Math.random()); s.stop(t + 0.5);
  };

  A.play = function (name, ...args) {
    if (!c || A.muted || !P[name]) return;
    try { P[name](...args); } catch (e) { /* звук не критичен */ }
  };

  // Радио: шипение + «голос» из фильтрованной пилы, слогами.
  let voiceTimer = null;
  A.radio = function (on, fake) {
    if (!c) return;
    const t = now();
    radioG.gain.setTargetAtTime(on ? (fake ? 0.015 : 0.05) : 0, t, 0.1);
    clearTimeout(voiceTimer);
    if (!on) return;
    const syl = () => {
      const o = c.createOscillator(), bp = f('bandpass', 800 + Math.random() * 900, 4), e = g(0, sfx), tt = now(), d = 0.08 + Math.random() * 0.12;
      o.type = 'sawtooth'; o.frequency.value = fake ? 140 : 120 + Math.random() * 40;
      o.connect(bp); bp.connect(e);
      e.gain.setValueAtTime(0, tt); e.gain.linearRampToValueAtTime(0.09, tt + 0.02); e.gain.linearRampToValueAtTime(0, tt + d);
      o.start(tt); o.stop(tt + d + 0.05);
      voiceTimer = setTimeout(syl, (fake ? 150 : 90) + Math.random() * (fake ? 20 : 160));
    };
    syl();
  };

  A.setMuted = function (m) {
    A.muted = m;
    if (master) master.gain.setTargetAtTime(m ? 0 : 0.85, now(), 0.05);
  };
})();
