// Процедурный звук на WebAudio: дождь, ветер, гул, шаги, колокольчик, «стингеры» и музыка.
(function () {
  const S = (OM.S = { ctx: null, muted: false });
  let c, master, amb, ambLP, sfx, rev, nodes = {}, white, brown;

  function buffer(sec, fill) {
    const b = c.createBuffer(1, c.sampleRate * sec, c.sampleRate);
    fill(b.getChannelData(0));
    return b;
  }
  function loop(buf) {
    const s = c.createBufferSource();
    s.buffer = buf;
    s.loop = true;
    s.start();
    return s;
  }
  function gain(v, to) {
    const g = c.createGain();
    g.gain.value = v;
    if (to) g.connect(to);
    return g;
  }
  function filt(type, f, q = 0.7) {
    const n = c.createBiquadFilter();
    n.type = type;
    n.frequency.value = f;
    n.Q.value = q;
    return n;
  }
  function osc(type, f) {
    const o = c.createOscillator();
    o.type = type;
    o.frequency.value = f;
    o.start();
    return o;
  }
  const now = () => c.currentTime;

  S.init = function () {
    if (c) { if (c.state !== 'running') c.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    c = S.ctx = new AC();
    master = gain(0.9);
    const comp = c.createDynamicsCompressor();
    master.connect(comp);
    comp.connect(c.destination);
    ambLP = filt('lowpass', 16000);
    ambLP.connect(master);
    amb = gain(1, ambLP);
    sfx = gain(0.9, master);
    rev = c.createConvolver();
    rev.buffer = (() => {
      const len = c.sampleRate * 3.5;
      const b = c.createBuffer(2, len, c.sampleRate);
      for (let ch = 0; ch < 2; ch++) {
        const d = b.getChannelData(ch);
        for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6);
      }
      return b;
    })();
    const rg = gain(0.42, master);
    rev.connect(rg);

    white = buffer(2, (d) => { for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; });
    brown = buffer(4, (d) => {
      let l = 0;
      for (let i = 0; i < d.length; i++) { l = (l + 0.02 * (Math.random() * 2 - 1)) / 1.02; d[i] = l * 3.5; }
    });

    // Дождь: высокий шелест + низкий гул капель.
    nodes.rain = gain(0, amb);
    const r1 = loop(white), hp = filt('highpass', 1400), lp = filt('lowpass', 7000);
    r1.connect(hp); hp.connect(lp); lp.connect(gain(0.22, nodes.rain));
    const r2 = loop(brown), bp = filt('lowpass', 500);
    r2.connect(bp); bp.connect(gain(0.5, nodes.rain));

    // Ветер: коричневый шум через плавающий полосовой фильтр.
    nodes.wind = gain(0, amb);
    const w1 = loop(brown), wf = filt('bandpass', 380, 0.9);
    w1.connect(wf); wf.connect(gain(0.9, nodes.wind));
    const lfo = osc('sine', 0.06), lg = gain(220);
    lfo.connect(lg); lg.connect(wf.frequency);

    // Гул-дрон: напряжение.
    nodes.drone = gain(0, amb);
    const dl = filt('lowpass', 180, 5);
    dl.connect(nodes.drone);
    [41.2, 41.6, 61.8, 82.0].forEach((f, i) => { const o = osc(i < 3 ? 'sawtooth' : 'sine', f); o.connect(gain(0.12, dl)); });
    const dlfo = osc('sine', 0.05), dg = gain(90);
    dlfo.connect(dg); dg.connect(dl.frequency);
    nodes.droneLP = dl;
    // Высокий «звон» для сильного напряжения.
    nodes.high = gain(0, amb);
    [1244, 1318, 1975].forEach((f) => { const o = osc('sine', f); o.connect(gain(0.03, nodes.high)); });
    const tr = osc('sine', 5.3), tg = gain(0.5);
    tr.connect(tg); tg.connect(nodes.high.gain);

    // Сетевой гул ламп в помещениях.
    nodes.hum = gain(0, amb);
    [50, 100, 150].forEach((f, i) => { const o = osc('sine', f); o.connect(gain([0.25, 0.12, 0.05][i], nodes.hum)); });

    // Плеск воды.
    nodes.water = gain(0, amb);
    const wa = loop(brown), wl = filt('lowpass', 420);
    const wam = gain(0.6);
    wa.connect(wl); wl.connect(wam); wam.connect(nodes.water);
    const wlfo = osc('sine', 0.23), wlg = gain(0.45);
    wlfo.connect(wlg); wlg.connect(wam.gain);

    S.applyAmb();
  };

  let ambState = { rain: 0, wind: 0, drone: 0, hum: 0, water: 0, indoor: false, high: 0 };
  S.amb = function (o) {
    ambState = Object.assign({ rain: 0, wind: 0, drone: 0, hum: 0, water: 0, indoor: false, high: 0 }, o);
    S.applyAmb();
  };
  S.tension = function (k) {
    ambState.high = k;
    if (!c) return;
    nodes.high.gain.setTargetAtTime(k * 0.6, now(), 0.8);
    nodes.droneLP.frequency.setTargetAtTime(180 + k * 500, now(), 0.8);
    nodes.drone.gain.setTargetAtTime(ambState.drone + k * 0.5, now(), 0.8);
  };
  S.applyAmb = function () {
    if (!c) return;
    const t = now(), s = ambState, m = S.muted ? 0 : 1;
    nodes.rain.gain.setTargetAtTime(s.rain * 0.55 * m, t, 0.6);
    nodes.wind.gain.setTargetAtTime(s.wind * 0.5 * m, t, 0.8);
    nodes.drone.gain.setTargetAtTime(s.drone * 0.35 * m, t, 1.2);
    nodes.hum.gain.setTargetAtTime(s.hum * 0.05 * m, t, 0.5);
    nodes.water.gain.setTargetAtTime(s.water * 0.5 * m, t, 0.8);
    nodes.high.gain.setTargetAtTime((s.high || 0) * 0.6 * m, t, 0.8);
    ambLP.frequency.setTargetAtTime(s.indoor ? 700 : 16000, t, 0.3);
  };
  S.setMuted = function (m) {
    S.muted = m;
    if (!c) return;
    master.gain.setTargetAtTime(m ? 0 : 0.9, now(), 0.1);
  };

  // ---------- Одноразовые звуки ----------
  function burst(o) {
    if (!c) return;
    const t = now() + (o.delay || 0);
    const s = c.createBufferSource();
    s.buffer = o.buf || white;
    const f = filt(o.type || 'bandpass', o.f || 1000, o.q || 1);
    const g = gain(0);
    s.connect(f); f.connect(g); g.connect(sfx);
    if (o.rev) g.connect(gain(o.rev, rev));
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(o.v || 0.3, t + (o.a || 0.005));
    g.gain.exponentialRampToValueAtTime(0.0001, t + (o.a || 0.005) + (o.d || 0.1));
    if (o.f2) f.frequency.exponentialRampToValueAtTime(o.f2, t + (o.d || 0.1));
    s.start(t, Math.random() * 1.5);
    s.stop(t + (o.a || 0.005) + (o.d || 0.1) + 0.05);
  }
  function tone(o) {
    if (!c) return;
    const t = now() + (o.delay || 0);
    const v = c.createOscillator();
    v.type = o.type || 'sine';
    v.frequency.setValueAtTime(o.f, t);
    if (o.f2) v.frequency.exponentialRampToValueAtTime(o.f2, t + (o.d || 0.2));
    const g = gain(0);
    v.connect(g);
    g.connect(o.dry === 0 ? gain(0) : sfx);
    if (o.rev) g.connect(gain(o.rev, rev));
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(o.v || 0.2, t + (o.a || 0.005));
    g.gain.exponentialRampToValueAtTime(0.0001, t + (o.a || 0.005) + (o.d || 0.2));
    v.start(t);
    v.stop(t + (o.a || 0.005) + (o.d || 0.2) + 0.05);
  }

  let stepAlt = 0;
  S.step = function (surface) {
    stepAlt ^= 1;
    const k = stepAlt ? 1 : 0.85;
    if (surface === 'wood') {
      burst({ buf: brown, type: 'lowpass', f: 260 * k, v: 0.5, d: 0.09 });
      burst({ type: 'bandpass', f: 1800 * k, q: 2, v: 0.05, d: 0.04 });
    } else if (surface === 'floor') {
      burst({ buf: brown, type: 'lowpass', f: 380 * k, v: 0.35, d: 0.07 });
      burst({ type: 'bandpass', f: 2600 * k, q: 3, v: 0.03, d: 0.03 });
    } else {
      burst({ type: 'bandpass', f: 900 * k, q: 0.8, v: 0.14, d: 0.12 });
      burst({ type: 'highpass', f: 3500, v: 0.05, d: 0.08, delay: 0.02 });
    }
  };
  S.click = () => tone({ f: 1400, v: 0.025, d: 0.04 });
  S.hover = () => tone({ f: 900, v: 0.012, d: 0.05 });
  S.pickup = () => {
    tone({ f: 660, v: 0.08, d: 0.5, rev: 0.4 });
    tone({ f: 990, v: 0.06, d: 0.7, delay: 0.09, rev: 0.4 });
  };
  S.bell = () => {
    [1, 2.76, 5.4, 8.93].forEach((m, i) => tone({ f: 1720 * m, v: 0.16 / (i + 1), d: 2.2 / (i * 0.6 + 1), rev: 0.7 }));
  };
  S.thunder = (close = 0.5) => {
    if (!c) return;
    burst({ type: 'highpass', f: 1500, v: 0.25 * close, d: 0.3 });
    burst({ buf: brown, type: 'lowpass', f: 900, f2: 60, v: 0.9, a: 0.08, d: 4.5, delay: 0.15 + (1 - close) * 1.2, rev: 0.4 });
  };
  S.stinger = (strength = 1) => {
    if (!c) return;
    const t = now();
    [880, 932, 1396, 220, 233].forEach((f, i) => {
      const v = c.createOscillator();
      v.type = i < 3 ? 'sine' : 'sawtooth';
      v.frequency.value = f;
      const vib = osc('sine', 4 + i), vg = gain(f * 0.008);
      vib.connect(vg); vg.connect(v.frequency);
      const lp = filt('lowpass', 2400);
      const g = gain(0);
      v.connect(lp); lp.connect(g); g.connect(sfx); g.connect(gain(0.8, rev));
      const peak = (i < 3 ? 0.05 : 0.04) * strength;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(peak, t + 1.4);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 4);
      v.start(t);
      v.stop(t + 4.1);
      vib.stop(t + 4.1);
    });
    burst({ buf: brown, type: 'lowpass', f: 120, v: 0.7 * strength, a: 1.2, d: 2.2 });
  };
  S.hit = () => {
    burst({ buf: brown, type: 'lowpass', f: 140, v: 1, d: 1.6, rev: 0.6 });
    burst({ type: 'bandpass', f: 400, f2: 80, q: 0.6, v: 0.35, d: 1.2, rev: 0.8 });
    tone({ f: 70, f2: 40, type: 'sine', v: 0.5, d: 1.5 });
  };
  S.heartbeat = () => {
    tone({ f: 58, f2: 40, v: 0.5, d: 0.18 });
    tone({ f: 52, f2: 38, v: 0.35, d: 0.2, delay: 0.24 });
  };
  S.splash = () => {
    burst({ type: 'lowpass', f: 3000, f2: 300, v: 0.6, a: 0.01, d: 0.9, rev: 0.5 });
    burst({ buf: brown, type: 'lowpass', f: 300, v: 0.8, d: 0.6 });
  };
  S.door = () => {
    burst({ buf: brown, type: 'lowpass', f: 200, v: 0.6, d: 0.25, delay: 0.35 });
    tone({ type: 'sawtooth', f: 180, f2: 140, v: 0.025, a: 0.1, d: 0.35 });
  };
  S.creak = () => tone({ type: 'sawtooth', f: 90, f2: 160, v: 0.02, a: 0.2, d: 0.6, rev: 0.3 });
  S.tick = (alt) => burst({ type: 'bandpass', f: alt ? 3200 : 2700, q: 6, v: 0.06, d: 0.025 });
  S.lockRattle = () => {
    for (let i = 0; i < 4; i++) burst({ type: 'bandpass', f: 2200 + i * 300, q: 4, v: 0.1, d: 0.05, delay: i * 0.07 });
  };
  S.unlock = () => {
    burst({ type: 'bandpass', f: 1600, q: 3, v: 0.2, d: 0.08 });
    burst({ buf: brown, type: 'lowpass', f: 400, v: 0.4, d: 0.15, delay: 0.12 });
  };

  // Телефон: гудок 425 Гц, как в советских/российских сетях.
  let phoneNode = null;
  S.phone = (mode) => {
    if (!c) return;
    if (phoneNode) { phoneNode.g.gain.setTargetAtTime(0, now(), 0.02); const p = phoneNode; setTimeout(() => p.o.stop(), 200); phoneNode = null; }
    if (!mode) return;
    const o = osc('sine', 425);
    const g = gain(0, sfx);
    o.connect(g);
    phoneNode = { o, g };
    const t = now();
    if (mode === 'dial') g.gain.setTargetAtTime(0.05, t, 0.01);
    if (mode === 'ring') {
      for (let i = 0; i < 4; i++) {
        g.gain.setValueAtTime(0.05, t + i * 3.2);
        g.gain.setValueAtTime(0, t + i * 3.2 + 0.9);
      }
    }
  };
  // Жужжание динамо-фонарика «жучок».
  S.whirr = () => {
    tone({ type: 'sawtooth', f: 140, f2: 210, v: 0.012, a: 0.02, d: 0.16 });
    burst({ type: 'bandpass', f: 1800, q: 3, v: 0.015, d: 0.1 });
  };
  // Отключение электричества: гул проседает и щёлкает реле.
  S.powerDown = () => {
    tone({ type: 'sawtooth', f: 100, f2: 30, v: 0.08, a: 0.01, d: 1.4 });
    burst({ type: 'bandpass', f: 2500, q: 4, v: 0.25, d: 0.05 });
    burst({ buf: brown, type: 'lowpass', f: 300, v: 0.3, d: 0.4, delay: 0.05 });
  };
  S.staticNoise = (dur = 1, v = 0.1) => burst({ type: 'bandpass', f: 2500, q: 0.4, v, a: 0.05, d: dur });
  // «Шёпот»: шум с прыгающими формантами.
  S.whisper = (dur = 2, v = 0.12) => {
    if (!c) return;
    const t = now();
    const s = c.createBufferSource();
    s.buffer = white;
    s.loop = true;
    const f1 = filt('bandpass', 1200, 4), f2 = filt('bandpass', 2600, 5);
    const g = gain(0);
    s.connect(f1); s.connect(f2); f1.connect(g); f2.connect(g);
    g.connect(gain(0.5, sfx)); g.connect(gain(1, rev));
    for (let k = 0; k < dur; k += 0.09) {
      f1.frequency.setValueAtTime(500 + Math.random() * 1100, t + k);
      f2.frequency.setValueAtTime(1600 + Math.random() * 1800, t + k);
      g.gain.setValueAtTime(v * (0.3 + Math.random() * 0.7) * (Math.random() < 0.15 ? 0.1 : 1), t + k);
    }
    g.gain.setValueAtTime(0, t + dur);
    s.start(t);
    s.stop(t + dur + 0.1);
  };
  let busNode = null;
  S.bus = (on) => {
    if (!c) return;
    if (!on) {
      if (busNode) {
        const b = busNode;
        b.o.frequency.setTargetAtTime(70, now(), 1.5);
        b.g.gain.setTargetAtTime(0, now() + 1, 1.4);
        setTimeout(() => { b.o.stop(); b.n.stop(); }, 6000);
        busNode = null;
      }
      return;
    }
    const o = osc('sawtooth', 36), n = loop(brown);
    const lp = filt('lowpass', 260, 2);
    const g = gain(0, sfx);
    o.connect(lp); n.connect(lp); lp.connect(g);
    g.gain.setTargetAtTime(0.22, now(), 0.4);
    busNode = { o, n, g };
  };
  S.rev = () => {
    if (!busNode) return;
    busNode.o.frequency.setTargetAtTime(58, now(), 0.6);
    busNode.g.gain.setTargetAtTime(0.35, now(), 0.3);
  };

  // ---------- Музыка: медленное «пианино» с реверберацией ----------
  function note(f, t, d, v) {
    const o1 = c.createOscillator(), o2 = c.createOscillator();
    o1.type = 'triangle'; o2.type = 'sine';
    o1.frequency.value = f; o2.frequency.value = f * 2.005;
    const lp = filt('lowpass', 2200);
    const g = gain(0);
    o1.connect(lp); o2.connect(gain(0.25, lp));
    lp.connect(g); g.connect(sfx); g.connect(gain(1.1, rev));
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(v, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o1.start(t); o2.start(t);
    o1.stop(t + d + 0.1); o2.stop(t + d + 0.1);
  }
  const N = (n) => 440 * Math.pow(2, (n - 69) / 12);
  let musicTimer = null;
  S.music = (name) => {
    if (musicTimer) { clearTimeout(musicTimer); musicTimer = null; }
    if (!c || !name) return;
    // ля-минор: Am — F — C — E, редкие ноты сверху.
    const prog = [[45, 57, 60, 64], [41, 57, 60, 65], [48, 55, 60, 64], [40, 56, 59, 64]];
    const mel = [76, null, 74, 72, null, 71, 69, null, 72, null, 71, 68, null, 69, null, null];
    let bar = 0;
    const play = () => {
      if (S.muted) { musicTimer = setTimeout(play, 1000); return; }
      const t = now() + 0.05;
      const ch = prog[bar % 4];
      note(N(ch[0] - 12), t, 5, 0.06);
      ch.slice(1).forEach((n, i) => note(N(n), t + 0.6 + i * 0.55, 4, 0.035));
      const m1 = mel[(bar * 4) % 16], m2 = mel[(bar * 4 + 2) % 16];
      if (m1) note(N(m1), t + 1.4, 3.5, 0.03);
      if (m2 && name === 'title') note(N(m2), t + 2.9, 3.5, 0.025);
      bar++;
      musicTimer = setTimeout(play, 4400);
    };
    play();
  };
})();
