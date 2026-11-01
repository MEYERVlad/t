// Интерфейс: текст с печатной машинкой, кнопки выбора, памятка, верхняя панель.
(function () {
  const UI = (SV.UI = {});
  const $ = (id) => document.getElementById(id);
  UI.$ = $;
  let typing = null;

  // Печатает текст. Нажатие на панель — дописать сразу.
  UI.say = function (text, who = '', opts = {}) {
    const el = $('say'), whoEl = $('who');
    whoEl.textContent = who;
    whoEl.hidden = !who;
    el.className = opts.cls || '';
    if (typing) typing.finish();
    return new Promise((res) => {
      let i = 0, done = false;
      const speed = opts.speed || 18;
      const finish = () => { if (done) return; done = true; clearInterval(timer); el.textContent = text; typing = null; if (opts.onEnd) opts.onEnd(); res(); };
      el.textContent = '';
      const timer = setInterval(() => {
        i += 1;
        el.textContent = text.slice(0, i);
        if (i % 3 === 0 && !opts.silent) SV.A.play(opts.radio ? 'blip' : 'blip');
        if (i >= text.length) finish();
      }, speed);
      typing = { finish };
    });
  };
  UI.skip = () => { if (typing) typing.finish(); };

  // Список кнопок → Promise с ключом нажатой.
  UI.choose = function (items, opts = {}) {
    const box = $('actions');
    box.innerHTML = '';
    box.className = opts.grid6 ? 'grid6' : opts.grid ? 'grid' : '';
    return new Promise((res) => {
      items.forEach((it) => {
        if (!it) return;
        const btn = document.createElement('button');
        btn.className = 'btn ' + (it.cls || '');
        btn.disabled = !!it.disabled;
        btn.innerHTML = (it.icon ? `<img src="${UI.icons[it.icon]}" alt="">` : '') + `<span>${it.label}</span>` + (it.sub ? `<small>${it.sub}</small>` : '');
        btn.onclick = () => {
          SV.A.init();
          SV.A.play('click');
          box.querySelectorAll('button').forEach((b) => (b.disabled = true));
          res(it.key);
        };
        box.appendChild(btn);
      });
    });
  };
  UI.next = (label = 'Дальше') => UI.choose([{ key: 'next', label, cls: 'wide' }]);
  UI.clearActions = () => { $('actions').innerHTML = ''; };

  // Записи о текущем госте.
  UI.notes = function (lines) {
    const el = $('checks');
    el.innerHTML = lines.map((l) => `<div class="note ${l.cls || ''}"><b>${l.k}</b> ${l.t}</div>`).join('');
    el.hidden = !lines.length;
    el.scrollTop = el.scrollHeight;
  };

  UI.icons = {};
  UI.initIcons = function () {
    ['fire', 'wood', 'food', 'heart', 'candle', 'candleOff', 'people'].forEach((n) => (UI.icons[n] = SV.G.icon(n, 3)));
  };

  // Верхняя панель с ресурсами.
  UI.hud = function (S, label) {
    $('phase').textContent = label || '';
    if (!S) { $('stats').innerHTML = ''; return; }
    const hearts = Array.from({ length: 3 }, (_, i) => `<img class="${i < S.hp ? '' : 'off'}" src="${UI.icons.heart}" alt="">`).join('');
    $('stats').innerHTML =
      `<span title="Тепло"><img src="${UI.icons.fire}" alt="">${S.warmth}</span>` +
      `<span title="Дрова"><img src="${UI.icons.wood}" alt="">${S.wood}</span>` +
      `<span title="Еда"><img src="${UI.icons.food}" alt="">${S.food}</span>` +
      `<span title="В доме"><img src="${UI.icons.people}" alt="">${S.guests.length}</span>` +
      `<span class="hearts" title="Здоровье">${hearts}</span>`;
  };

  UI.candles = function (n, max) {
    const el = $('candles');
    if (n == null) { el.innerHTML = ''; return; }
    el.innerHTML = Array.from({ length: max }, (_, i) => `<img src="${i < n ? UI.icons.candle : UI.icons.candleOff}" alt="">`).join('');
  };

  UI.modal = function (html) {
    $('modal-body').innerHTML = html;
    $('modal').hidden = false;
    $('modal-body').scrollTop = 0;
  };
  UI.closeModal = () => { $('modal').hidden = true; };

  UI.shake = function () {
    const st = $('stage');
    st.classList.remove('shake'); void st.offsetWidth; st.classList.add('shake');
  };
  UI.flash = function (color = '#fff') {
    const f = $('flash');
    f.style.background = color;
    f.classList.remove('go'); void f.offsetWidth; f.classList.add('go');
  };
})();
