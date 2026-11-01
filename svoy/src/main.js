// Запуск: холст, цикл отрисовки, титульный экран, меню.
(function () {
  const { G, Sc, UI, A, Game: Gm } = SV;
  const $ = UI.$;

  G.init($('cv'));
  Sc.init();
  UI.initIcons();
  try { A.muted = localStorage.getItem('svoy-mute') === '1'; } catch (e) { /* */ }

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    Gm.t += dt;
    const v = Gm.view;
    try { Sc[v.scene](Gm.t, dt, v.st); } catch (e) { console.error(e); }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // Нажатие на текст — дописать сразу.
  $('panel').addEventListener('click', (e) => { if (!e.target.closest('button')) UI.skip(); });
  $('btn-notes').onclick = () => { A.play('click'); UI.modal(Gm.notesHtml()); };
  $('modal-close').onclick = () => UI.closeModal();
  $('btn-menu').onclick = () => {
    A.play('click');
    UI.modal(`<h2>Меню</h2>
      <div class="row"><button class="btn" data-act="mute">Звук: ${A.muted ? 'выкл' : 'вкл'}</button></div>
      <div class="row"><button class="btn" data-act="restart">Начать заново</button></div>
      <h3>Об игре</h3>
      <p>«Свой» — пиксельный хоррор про дверь, которую нельзя открывать кому попало. Семь ночей до прихода колонны.
      Слушай радио, проверяй гостей, корми своих, топи печь. Вся графика и звук сделаны кодом.</p>
      <p><small>Лучше в наушниках.</small></p>`);
  };
  $('modal-body').addEventListener('click', (e) => {
    const act = e.target.closest('[data-act]');
    if (!act) return;
    if (act.dataset.act === 'mute') {
      A.setMuted(!A.muted);
      try { localStorage.setItem('svoy-mute', A.muted ? '1' : '0'); } catch (er) { /* */ }
      act.textContent = 'Звук: ' + (A.muted ? 'выкл' : 'вкл');
    }
    if (act.dataset.act === 'restart') {
      if (act.dataset.sure) { Gm.clearSave(); location.reload(); }
      else { act.dataset.sure = '1'; act.textContent = 'Точно? Нажми ещё раз'; }
    }
  });

  async function title() {
    Gm.view = { scene: 'title', st: {} };
    $('title').hidden = false;
    UI.hud(null, '');
    $('btn-notes').hidden = true;
    UI.say('Метель. Ночь. В дверь стучат.\nПускай только своих.', '', { speed: 30, silent: true });
    const items = [];
    if (Gm.hasSave()) items.push({ key: 'cont', label: 'Продолжить', cls: 'wide' });
    items.push({ key: 'new', label: 'Новая игра', cls: 'wide' });
    const k = await UI.choose(items);
    A.init();
    A.setMuted(A.muted);
    $('title').hidden = true;
    $('btn-notes').hidden = false;
    Gm.start(k === 'new');
  }
  title();
})();
