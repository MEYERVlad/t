// Просмотр трейлера в браузере: картинка синхронизирована с часами звука.
(function () {
  const film = document.getElementById('film');
  const gate = document.getElementById('gate');
  const btn = document.getElementById('play');
  const exportMode = /export/.test(location.search);

  function size() {
    const r = film.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    return [Math.min(1920, Math.round(r.width * dpr)), Math.min(1080, Math.round(r.height * dpr))];
  }

  window.addEventListener('DOMContentLoaded', async () => {
    if (exportMode) {
      gate.classList.add('off');
      await TR.init(film, 1920, 1080);
      window.TR_VO = await OM.TRA.loadVO();
      window.TR_READY = true;
      return;
    }
    const [w, h] = size();
    await TR.init(film, w, h);
    await OM.TRA.loadVO();
    TR.frame(0, 0);
    btn.disabled = false;
    btn.textContent = '▶  Смотреть';
    window.addEventListener('resize', () => TR.resize(...size()));

    let ac = null, raf = 0;
    btn.addEventListener('click', () => {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (ac) ac.close();
      ac = new AC();
      const T0 = ac.currentTime + 0.15;
      OM.TRA.score(ac, ac.destination, T0);
      gate.classList.add('off');
      let last = 0;
      cancelAnimationFrame(raf);
      const tick = () => {
        const t = ac.currentTime - T0;
        if (t >= 0) {
          TR.frame(t, Math.max(0, Math.min(0.05, t - last)));
          last = t;
        }
        if (t < TR.DUR) raf = requestAnimationFrame(tick);
        else {
          btn.textContent = '↻  Ещё раз';
          gate.classList.remove('off');
        }
      };
      raf = requestAnimationFrame(tick);
    });
  });
})();
