// Звуковая дорожка трейлера: всё расписано по секундам монтажа.
// Работает и с обычным AudioContext (просмотр), и с OfflineAudioContext (экспорт в видео).
(function () {
  const TRA = (OM.TRA = {});
  TRA.DUR = 84;

  // Реплики закадрового голоса. Файлы кладутся в assets/vo/<id>.wav|mp3|ogg|m4a — подхватываются сами.
  TRA.CUES = [
    { id: '01', t: 8.6, t1: 12.8, text: 'В каждом городе есть место, о котором молчат.' },
    { id: '02', t: 14.6, t1: 17.6, text: 'Здесь молчат о воде.' },
    { id: '03', t: 23.6, t1: 27.8, text: 'Я приехал продавать энциклопедии. «Всё обо всём».' },
    { id: '04', t: 30.4, t1: 34.4, text: '— Номеров у нас всегда много.', kind: 'quote', room: 0.25 },
    { id: '05', t: 37.0, t1: 40.8, text: 'А потом мне начали сниться чужие смерти.' },
    { id: '06', t: 47.0, t1: 50.6, text: 'Я вижу, как это случится…', room: 0.3 },
    { id: '07', t: 55.2, t1: 57.3, text: '…и знаю — когда.', room: 0.3 },
    { id: '08', t: 58.6, t1: 61.6, text: 'Они всегда стояли здесь.' },
    { id: '09', t: 62.4, t1: 65.6, text: 'Просто раньше я их не видел.' },
    { id: '10', t: 66.8, t1: 70.4, text: 'Не смотри им в лицо.', kind: 'card', room: 0.7 },
  ];
  TRA.vo = {};
  TRA.loadVO = async function (base = 'assets/vo/') {
    const dec = new OfflineAudioContext(2, 1, 48000);
    await Promise.all(TRA.CUES.map(async (c) => {
      for (const ext of ['wav', 'mp3', 'ogg', 'm4a', 'webm']) {
        try {
          const res = await fetch(base + c.id + '.' + ext);
          if (!res.ok) continue;
          TRA.vo[c.id] = await dec.decodeAudioData(await res.arrayBuffer());
          return;
        } catch (e) { /* файла нет — остаются субтитры */ }
      }
    }));
    return Object.keys(TRA.vo).length;
  };
  // Когда реплика заканчивается (с учётом длины записи).
  TRA.cueEnd = (c) => (TRA.vo[c.id] ? Math.max(c.t1, c.t + TRA.vo[c.id].duration + 0.6) : c.t1);

  TRA.score = function (ac, out, T0) {
    const sr = ac.sampleRate;
    const at = (t) => T0 + t;
    const END = at(TRA.DUR + 1);

    const buffer = (sec, fill, ch = 1) => {
      const b = ac.createBuffer(ch, Math.floor(sr * sec), sr);
      for (let c = 0; c < ch; c++) fill(b.getChannelData(c));
      return b;
    };
    const white = buffer(3, (d) => { for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; });
    const brown = buffer(5, (d) => {
      let l = 0;
      for (let i = 0; i < d.length; i++) { l = (l + 0.02 * (Math.random() * 2 - 1)) / 1.02; d[i] = l * 3.5; }
    });
    const gain = (v, to) => { const g = ac.createGain(); g.gain.value = v; if (to) g.connect(to); return g; };
    const filt = (type, f, q = 0.7) => { const n = ac.createBiquadFilter(); n.type = type; n.frequency.value = f; n.Q.value = q; return n; };
    const loop = (buf, t0 = 0, t1 = TRA.DUR + 1) => {
      const s = ac.createBufferSource();
      s.buffer = buf; s.loop = true;
      s.start(at(t0), Math.random());
      s.stop(at(t1));
      return s;
    };
    const osc = (type, f, t0 = 0, t1 = TRA.DUR + 1) => {
      const o = ac.createOscillator();
      o.type = type; o.frequency.value = f;
      o.start(at(t0)); o.stop(at(t1));
      return o;
    };
    // Автоматизация: [время, значение, 'set' | 'lin' | 'exp']
    const auto = (param, pts) => {
      param.setValueAtTime(pts[0][1], at(pts[0][0]));
      for (let i = 1; i < pts.length; i++) {
        const [t, v, m] = pts[i];
        if (m === 'set') param.setValueAtTime(v, at(t));
        else if (m === 'exp') param.exponentialRampToValueAtTime(Math.max(v, 0.0001), at(t));
        else param.linearRampToValueAtTime(v, at(t));
      }
    };

    const comp = ac.createDynamicsCompressor();
    comp.threshold.value = -16;
    comp.ratio.value = 4;
    comp.connect(out);
    const master = gain(0.95, comp);
    const rev = ac.createConvolver();
    rev.buffer = buffer(4.5, (d) => { for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 2.4); }, 2);
    rev.connect(gain(0.55, master));

    // ---------- Дождь ----------
    const rainG = gain(0, master);
    const rainLP = filt('lowpass', 16000);
    rainLP.connect(rainG);
    const r1 = loop(white), hp = filt('highpass', 1300);
    r1.connect(hp); hp.connect(gain(0.2, rainLP));
    const r2 = loop(brown), lp2 = filt('lowpass', 500);
    r2.connect(lp2); lp2.connect(gain(0.45, rainLP));
    auto(rainG.gain, [
      [0, 0], [3.5, 0.5], [21, 0.55], [21.05, 0.35, 'set'], [29, 0.35], [29.05, 0.3, 'set'], [35.5, 0.3], [41.9, 0.25],
      [42, 0, 'set'], [57.5, 0, 'set'], [59, 0.3], [66, 0.32], [66.02, 0, 'set'], [71, 0, 'set'], [72.5, 0.4], [82.5, 0.3], [84, 0],
    ]);
    auto(rainLP.frequency, [[0, 16000], [29, 16000, 'set'], [29.02, 700, 'set'], [42, 700], [57.5, 16000, 'set']]);

    // ---------- Ветер ----------
    const windG = gain(0, master);
    const w1 = loop(brown), wf = filt('bandpass', 380, 0.9);
    w1.connect(wf); wf.connect(windG);
    const wl = osc('sine', 0.08), wlg = gain(200);
    wl.connect(wlg); wlg.connect(wf.frequency);
    auto(windG.gain, [[0, 0], [5, 0.35], [21, 0.4], [21.05, 0.1, 'set'], [57.5, 0.1, 'set'], [60, 0.55], [66, 0.7], [66.02, 0, 'set'], [71, 0.25, 'set'], [84, 0]]);

    // ---------- Вода у пристани ----------
    const waterG = gain(0, master);
    const wa = loop(brown), wlp = filt('lowpass', 420);
    const wam = gain(0.7);
    wa.connect(wlp); wlp.connect(wam); wam.connect(waterG);
    const wal = osc('sine', 0.23), walg = gain(0.5);
    wal.connect(walg); walg.connect(wam.gain);
    auto(waterG.gain, [[0, 0], [57.5, 0, 'set'], [58.5, 0.5], [66, 0.5], [66.02, 0, 'set'], [71, 0.3, 'set'], [84, 0]]);

    // ---------- Гул ламп и тиканье в гостинице ----------
    const humG = gain(0, master);
    [50, 100, 150].forEach((f, i) => osc('sine', f, 29, 42).connect(gain([0.05, 0.025, 0.01][i], humG)));
    auto(humG.gain, [[0, 0], [29, 1, 'set'], [41.9, 1], [42, 0, 'set']]);

    // ---------- Дрон напряжения ----------
    const droneG = gain(0, master);
    const dLP = filt('lowpass', 160, 5);
    dLP.connect(droneG);
    [41.2, 41.6, 61.8, 82.0, 55.0].forEach((f, i) => osc(i < 3 ? 'sawtooth' : 'sine', f).connect(gain(0.1, dLP)));
    auto(droneG.gain, [
      [0, 0], [6, 0.2], [21, 0.25], [29, 0.18], [42, 0.3], [53.5, 0.45], [57.5, 0.35], [65.95, 0.75],
      [66, 0, 'set'], [71, 0, 'set'], [71.05, 0.35, 'set'], [84, 0],
    ]);
    auto(dLP.frequency, [[0, 140], [18, 200], [42, 260], [53, 420], [57.5, 220], [65.9, 900], [66, 140, 'set'], [84, 140]]);
    // высокий дрожащий кластер
    const highG = gain(0, master);
    highG.connect(gain(0.6, rev));
    [1244, 1318, 1975].forEach((f) => osc('sine', f).connect(gain(0.025, highG)));
    const trem = osc('sine', 5.3), tremG = gain(0.4);
    trem.connect(tremG); tremG.connect(highG.gain);
    auto(highG.gain, [[0, 0], [46, 0, 'set'], [53, 0.5], [53.5, 0, 'set'], [60, 0], [65.95, 0.9], [66, 0, 'set'], [67, 0, 'set'], [68, 0.15], [70.5, 0], [84, 0]]);

    // ---------- Событийные звуки ----------
    const burst = (t, o) => {
      const s = ac.createBufferSource();
      s.buffer = o.buf || white;
      const f = filt(o.type || 'bandpass', o.f || 1000, o.q || 1);
      const g = gain(0);
      s.connect(f); f.connect(g); g.connect(master);
      if (o.rev) g.connect(gain(o.rev, rev));
      const a = o.a || 0.005, d = o.d || 0.1;
      g.gain.setValueAtTime(0, at(t));
      g.gain.linearRampToValueAtTime(o.v || 0.3, at(t + a));
      g.gain.exponentialRampToValueAtTime(0.0001, at(t + a + d));
      if (o.f2) f.frequency.exponentialRampToValueAtTime(o.f2, at(t + a + d));
      s.start(at(t), Math.random() * 1.5);
      s.stop(at(t + a + d + 0.05));
    };
    const tone = (t, o) => {
      const v = ac.createOscillator();
      v.type = o.type || 'sine';
      v.frequency.setValueAtTime(o.f, at(t));
      if (o.f2) v.frequency.exponentialRampToValueAtTime(o.f2, at(t + (o.a || 0.005) + (o.d || 0.2)));
      const g = gain(0);
      v.connect(g); g.connect(master);
      if (o.rev) g.connect(gain(o.rev, rev));
      const a = o.a || 0.005, d = o.d || 0.2;
      g.gain.setValueAtTime(0, at(t));
      g.gain.linearRampToValueAtTime(o.v || 0.2, at(t + a));
      g.gain.exponentialRampToValueAtTime(0.0001, at(t + a + d));
      v.start(at(t));
      v.stop(at(t + a + d + 0.05));
    };
    // Трейлерный «брам»: низкий кластер с раскрывающимся фильтром + саб.
    const braam = (t, v = 1, len = 4) => {
      const lp = filt('lowpass', 120, 2);
      const g = gain(0);
      lp.connect(g); g.connect(master); g.connect(gain(0.7, rev));
      [55, 55.4, 82.4, 110, 164.8].forEach((f) => osc('sawtooth', f, t, t + len + 0.2).connect(gain(0.14, lp)));
      lp.frequency.setValueAtTime(120, at(t));
      lp.frequency.exponentialRampToValueAtTime(1400, at(t + 0.12));
      lp.frequency.exponentialRampToValueAtTime(200, at(t + len));
      g.gain.setValueAtTime(0, at(t));
      g.gain.linearRampToValueAtTime(0.55 * v, at(t + 0.03));
      g.gain.exponentialRampToValueAtTime(0.0001, at(t + len));
      tone(t, { f: 48, f2: 32, v: 0.7 * v, d: len * 0.8 });
      burst(t, { buf: brown, type: 'lowpass', f: 180, v: 0.8 * v, d: 1.5, rev: 0.5 });
    };
    const hit = (t, v = 1) => {
      burst(t, { buf: brown, type: 'lowpass', f: 150, v: 0.9 * v, d: 1.4, rev: 0.6 });
      burst(t, { type: 'bandpass', f: 500, f2: 80, q: 0.6, v: 0.3 * v, d: 1, rev: 0.8 });
      tone(t, { f: 72, f2: 38, v: 0.5 * v, d: 1.3 });
    };
    const stinger = (t, v = 1) => {
      [880, 932, 1396, 220, 233].forEach((f, i) => {
        const o = ac.createOscillator();
        o.type = i < 3 ? 'sine' : 'sawtooth';
        o.frequency.value = f;
        const lp = filt('lowpass', 2400);
        const g = gain(0);
        o.connect(lp); lp.connect(g); g.connect(master); g.connect(gain(0.8, rev));
        g.gain.setValueAtTime(0, at(t));
        g.gain.linearRampToValueAtTime((i < 3 ? 0.05 : 0.035) * v, at(t + 1.3));
        g.gain.exponentialRampToValueAtTime(0.0001, at(t + 3.6));
        o.start(at(t)); o.stop(at(t + 3.7));
      });
    };
    const thunder = (t, close = 0.8) => {
      burst(t, { type: 'highpass', f: 1500, v: 0.3 * close, d: 0.35 });
      burst(t + 0.1, { buf: brown, type: 'lowpass', f: 900, f2: 60, v: 1, a: 0.08, d: 5, rev: 0.4 });
    };
    const heartbeat = (t, v = 1) => {
      tone(t, { f: 58, f2: 40, v: 0.6 * v, d: 0.18 });
      tone(t + 0.24, { f: 52, f2: 38, v: 0.42 * v, d: 0.2 });
    };
    const tick = (t, alt, v = 0.08) => burst(t, { type: 'bandpass', f: alt ? 3200 : 2600, q: 6, v, d: 0.03, rev: 0.2 });
    const whisper = (t, dur, v = 0.14) => {
      const s = ac.createBufferSource();
      s.buffer = white; s.loop = true;
      const f1 = filt('bandpass', 1200, 4), f2 = filt('bandpass', 2600, 5);
      const g = gain(0);
      s.connect(f1); s.connect(f2); f1.connect(g); f2.connect(g);
      g.connect(gain(0.5, master)); g.connect(gain(1, rev));
      for (let k = 0; k < dur; k += 0.09) {
        f1.frequency.setValueAtTime(500 + Math.random() * 1100, at(t + k));
        f2.frequency.setValueAtTime(1600 + Math.random() * 1800, at(t + k));
        g.gain.setValueAtTime(v * (0.3 + Math.random() * 0.7) * (Math.random() < 0.15 ? 0.1 : 1), at(t + k));
      }
      g.gain.setValueAtTime(0, at(t + dur));
      s.start(at(t)); s.stop(at(t + dur + 0.1));
    };
    const bell = (t, v = 1) => [1, 2.76, 5.4, 8.93].forEach((m, i) => tone(t, { f: 1720 * m, v: (0.12 * v) / (i + 1), d: 2.6 / (i * 0.6 + 1), rev: 0.9 }));

    // «Пианино»
    const N = (n) => 440 * Math.pow(2, (n - 69) / 12);
    const note = (t, n, d, v) => {
      const o1 = ac.createOscillator(), o2 = ac.createOscillator();
      o1.type = 'triangle'; o2.type = 'sine';
      o1.frequency.value = N(n); o2.frequency.value = N(n) * 2.005;
      const lp = filt('lowpass', 2300);
      const g = gain(0);
      o1.connect(lp); o2.connect(gain(0.25, lp));
      lp.connect(g); g.connect(master); g.connect(gain(1.2, rev));
      g.gain.setValueAtTime(0, at(t));
      g.gain.linearRampToValueAtTime(v, at(t + 0.01));
      g.gain.exponentialRampToValueAtTime(0.0001, at(t + d));
      o1.start(at(t)); o2.start(at(t));
      o1.stop(at(t + d + 0.1)); o2.stop(at(t + d + 0.1));
    };
    // ля-минор: Am — F — C — E
    const prog = [[45, 57, 60, 64], [41, 57, 60, 65], [48, 55, 60, 64], [40, 56, 59, 64]];
    const arp = (t0, bars, v = 1, mel = null) => {
      for (let b = 0; b < bars; b++) {
        const t = t0 + b * 4.4, ch = prog[b % 4];
        note(t, ch[0] - 12, 5, 0.07 * v);
        ch.slice(1).forEach((n, i) => note(t + 0.6 + i * 0.55, n, 4, 0.038 * v));
        if (mel && mel[b]) note(t + 1.5, mel[b], 3.8, 0.04 * v);
      }
    };

    // ---------- Монтажная партитура ----------
    // 0–5: темнота, дождь, далёкий гром
    thunder(1.5, 0.25);
    arp(2.0, 4, 0.9, [null, 76, 74, 71]);
    // 5–14: автобус уходит
    const busO = osc('sawtooth', 36, 4.5, 15), busN = loop(brown, 4.5, 15);
    const busLP = filt('lowpass', 260, 2), busG = gain(0, master);
    busO.connect(busLP); busN.connect(busLP); busLP.connect(busG);
    auto(busG.gain, [[4.5, 0], [5.5, 0.22], [6.6, 0.22], [7.2, 0.36], [10, 0.25], [14, 0]]);
    auto(busO.frequency, [[4.5, 36], [6.6, 36], [7.6, 58], [11, 50], [14, 40]]);
    // 14–21: молния и Тихий в лесу
    stinger(16.8, 1);
    thunder(18.2, 1);
    braam(18.25, 0.7, 4);
    // 21.6–29: улица; 29–35.5: холл
    arp(21.6, 3, 0.8, [72, null, 69]);
    for (let t = 29.3; t < 35.5; t += 1) tick(t, Math.round(t) % 2, 0.06);
    bell(29.6, 0.6);
    // 35.5–42: номер
    note(36.2, 76, 4, 0.04);
    note(38.4, 74, 4, 0.035);
    note(40.4, 71, 4, 0.03);
    // 42–46: подводное видение
    braam(42, 0.8, 3.5);
    whisper(42.2, 3.6, 0.16);
    hit(43.3, 0.5);
    hit(44.7, 0.5);
    // 46–53.5: красное видение
    hit(46, 1);
    for (let t = 46.4; t < 52.6; t += 1.05) heartbeat(t, 0.9);
    whisper(48, 4.5, 0.1);
    burst(52.8, { type: 'lowpass', f: 3000, f2: 300, v: 0.7, a: 0.01, d: 1, rev: 0.5 });
    hit(52.8, 0.9);
    // 53.5–57.5: 00:13
    braam(53.5, 1, 4);
    for (let t = 54; t < 57.4; t += 0.5) tick(t, Math.round(t * 2) % 2, 0.16);
    // 57.5–66: пристань, нарастание
    let t = 58.2, gap = 1.25;
    while (t < 65.9) { heartbeat(t, 0.7 + (t - 58) * 0.06); t += gap; gap = Math.max(0.36, gap * 0.9); }
    const riserS = loop(white, 60.5, 66), riserF = filt('bandpass', 300, 1.2), riserG = gain(0, master);
    riserS.connect(riserF); riserF.connect(riserG); riserG.connect(gain(0.5, rev));
    auto(riserF.frequency, [[60.5, 300], [66, 5000, 'exp']]);
    auto(riserG.gain, [[60.5, 0], [65.95, 0.35], [66, 0, 'set']]);
    stinger(62.4, 1.2);
    // 66: тишина; шёпот
    whisper(66.8, 3.6, 0.18);
    // 71: титул
    braam(71, 1.2, 6);
    arp(72.2, 3, 1, [76, 74, 72]);
    note(83.2, 57, 3, 0.03);
    bell(80.6, 0.5);

    // ---------- Закадровый голос: свой канал мимо приглушаемой музыки ----------
    const voComp = ac.createDynamicsCompressor();
    voComp.threshold.value = -22;
    voComp.ratio.value = 3;
    voComp.connect(comp);
    master.gain.setValueAtTime(0.95, at(0));
    TRA.CUES.forEach((c) => {
      const b = TRA.vo[c.id];
      if (!b) return;
      const src = ac.createBufferSource();
      src.buffer = b;
      const hpf = filt('highpass', 90);
      const presence = filt('peaking', 3200, 0.8);
      presence.gain.value = 3;
      const g = gain(1.15);
      src.connect(hpf); hpf.connect(presence); presence.connect(g); g.connect(voComp);
      g.connect(gain(c.room ?? 0.12, rev));
      src.start(at(c.t));
      // музыка и шумы уходят под голос
      master.gain.setValueAtTime(0.95, at(c.t - 0.3));
      master.gain.linearRampToValueAtTime(0.5, at(c.t - 0.05));
      master.gain.setValueAtTime(0.5, at(c.t + b.duration));
      master.gain.linearRampToValueAtTime(0.95, at(c.t + b.duration + 0.5));
    });
    return END;
  };

  // Офлайн-рендер дорожки в WAV (base64) для сборки видео.
  TRA.renderWav = async function () {
    const sr = 48000;
    const oc = new OfflineAudioContext(2, sr * (TRA.DUR + 1), sr);
    TRA.score(oc, oc.destination, 0);
    const buf = await oc.startRendering();
    const n = buf.length, ch = [buf.getChannelData(0), buf.getChannelData(1)];
    const ab = new ArrayBuffer(44 + n * 4);
    const dv = new DataView(ab);
    const str = (o, s) => [...s].forEach((c, i) => dv.setUint8(o + i, c.charCodeAt(0)));
    str(0, 'RIFF'); dv.setUint32(4, 36 + n * 4, true); str(8, 'WAVE'); str(12, 'fmt ');
    dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, 2, true);
    dv.setUint32(24, sr, true); dv.setUint32(28, sr * 4, true); dv.setUint16(32, 4, true); dv.setUint16(34, 16, true);
    str(36, 'data'); dv.setUint32(40, n * 4, true);
    let o = 44;
    for (let i = 0; i < n; i++) for (let c = 0; c < 2; c++) { dv.setInt16(o, Math.max(-1, Math.min(1, ch[c][i])) * 32767, true); o += 2; }
    let bin = '';
    const u8 = new Uint8Array(ab);
    for (let i = 0; i < u8.length; i += 0x8000) bin += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
    return btoa(bin);
  };
})();
