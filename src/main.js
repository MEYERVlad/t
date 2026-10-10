// Точка входа: титульный экран, меню, старт.
(function () {
  const G = OM.G, S = OM.S;

  function $(s) { return document.querySelector(s); }

  async function showTitle() {
    G.mode = 'title';
    G.flags = {};
    G.inv = [];
    G.sel = null;
    OM.renderInv();
    S.music('title');
    OM.setScene('busstop', 'default');
    G.hero.visible = false;
    $('#title').classList.remove('off');
    $('#menu-btn').classList.remove('on');
    $('#title [data-act=continue]').hidden = !OM.hasSave();
    $('#title [data-act=ch2]').hidden = false;
    OM.fadeTo(0, 2200);
  }

  async function newGame() {
    S.init();
    S.music(null);
    OM.clearSave();
    G.flags = {};
    G.inv = [];
    OM.renderInv();
    $('#title').classList.add('off');
    await OM.fadeTo(1, 900);
    G.mode = 'play';
    G.busy++;
    await OM.card('Глава первая. Приезд', 'октябрь 1996 года');
    G.busy--;
    OM.give('book', true);
    $('#menu-btn').classList.add('on');
    OM.setScene('busstop', 'intro');
    OM.run(() => G.scene.enter('intro'));
  }

  async function continueGame() {
    S.init();
    S.music(null);
    $('#title').classList.add('off');
    await OM.fadeTo(1, 700);
    $('#menu-btn').classList.add('on');
    if (!(await OM.loadSave())) newGame();
  }

  async function startCh2() {
    S.init();
    S.music(null);
    OM.clearSave();
    $('#title').classList.add('off');
    $('#menu-btn').classList.add('on');
    await OM.story2.start();
  }

  function toggleMenu(on) {
    const m = $('#menu');
    on = on ?? !m.classList.contains('on');
    if (G.mode !== 'play') on = false;
    m.classList.toggle('on', on);
  }

  OM.toTitle = showTitle;

  window.addEventListener('DOMContentLoaded', () => {
    OM.boot();
    showTitle();
    let musicStarted = false;
    const startMusic = () => {
      if (musicStarted || G.mode !== 'title') return;
      musicStarted = true;
      S.init();
      S.music('title');
    };
    $('#title').addEventListener('pointerdown', startMusic);
    $('#title [data-act=new]').addEventListener('click', newGame);
    $('#title [data-act=continue]').addEventListener('click', continueGame);
    $('#title [data-act=ch2]').addEventListener('click', startCh2);
    $('#menu-btn').addEventListener('pointerdown', (e) => { e.stopPropagation(); toggleMenu(true); });
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') toggleMenu();
    });
    $('#menu [data-act=resume]').addEventListener('click', () => toggleMenu(false));
    $('#menu [data-act=sound]').addEventListener('click', (e) => {
      S.setMuted(!S.muted);
      e.target.textContent = 'Звук: ' + (S.muted ? 'выкл' : 'вкл');
    });
    $('#menu [data-act=restart]').addEventListener('click', () => {
      toggleMenu(false);
      OM.clearSave();
      location.reload();
    });
    // Тестовый доступ: ?scene=lobby — сразу в нужную сцену.
    const q = new URLSearchParams(location.search);
    if (q.get('scene')) {
      $('#title').classList.add('off');
      G.mode = 'play';
      $('#menu-btn').classList.add('on');
      (q.get('flags') || '').split(',').filter(Boolean).forEach((f) => (G.flags[f] = 1));
      (q.get('inv') || 'book').split(',').filter(Boolean).forEach((i) => OM.give(i, true));
      OM.setScene(q.get('scene'), q.get('entry') || 'default');
      OM.fadeTo(0, 10);
    }
  });
})();
