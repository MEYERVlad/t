// Достижения: какие повороты и концовки игрок уже видел. Хранятся отдельно от сохранений —
// их не стирает ни новая игра, ни концовка «Берег».
(function () {
  const S = OM.S;
  const KEY = 'omut-ach';
  // ch — глава (1–5), secret — скрыто до получения (вместо описания показываем подсказку).
  const LIST = [
    { id: 'called', ch: 1, t: 'Абонент', d: 'Дозвониться в «Зарю» из таксофона на остановке.' },
    { id: 'photo', ch: 1, t: 'Покровское, 1954', d: 'Прикоснуться к фотографии в холле.' },
    { id: 'vision1', ch: 1, t: '00:13', d: 'Увидеть первое видение.' },
    { id: 'mitya', ch: 1, t: 'Колокольчик', d: 'Разбудить Митю на пристани.' },
    { id: 'sold', ch: 2, t: 'Коммивояжёр', d: 'Продать Семёнычу нужный том.' },
    { id: 'montage', ch: 2, t: 'Монтаж с первого дубля', d: 'Сложить видение из обрывков без единой ошибки.' },
    { id: 'list1955', ch: 2, t: 'Гордеева Анна Петровна', d: 'Найти себя в списке 1955 года.' },
    { id: 'threads', ch: 3, t: 'Смотреть иначе', d: 'Увидеть нити.' },
    { id: 'lake', ch: 3, t: 'На звон', d: 'Доплыть до церкви, ни разу не задев тех, кто стоит в воде.' },
    { id: 'gaze', ch: 3, t: 'Не смотри', d: 'Всё-таки посмотреть им в лицо.' },
    { id: 'flashback', ch: 3, t: 'Зина и Аня', d: 'Узнать, что случилось 14 октября 1955 года.' },
    { id: 'rang', ch: 3, t: 'Колокол', d: 'Позвонить с колокольни Покровского.' },
    { id: 'nik', ch: 4, t: 'Сорок лет как', d: 'Отпустить отца Никодима к Семёнычу.' },
    { id: 'zina', ch: 4, t: 'Своя бабка', d: 'Перенести нить Зинаиды к Мите.' },
    { id: 'vera', ch: 4, t: 'Завешенное зеркало', d: 'Остановить Веру у трюмо.' },
    { id: 'sem', ch: 4, t: 'Светом в глаза', d: 'Догнать и разбудить Семёныча.' },
    { id: 'clean4', ch: 4, t: 'Ни шагу назад', d: 'Пройти четвёртую главу без единой неудачи.' },
    { id: 'notnow', ch: 4, t: 'Не сейчас, мама', d: 'Встретить Анну в полночь у воды.' },
    { id: 'death', ch: 5, t: 'Своя смерть', d: 'Увидеть собственное будущее.' },
    { id: 'names', ch: 5, t: 'Перекличка', d: 'Вернуть имена всем утонувшим в Изнанке.' },
    { id: 'breath', ch: 5, t: 'Глубокий вдох', d: 'Пройти Изнанку, ни разу не задохнувшись.' },
    { id: 'endA', ch: 5, t: 'Концовка: Берег', d: 'Обрезать нити. Город спасён, Лев всё забыл.', end: 1 },
    { id: 'endB', ch: 5, t: 'Концовка: Омут', d: 'Остаться с мамой на дне.', end: 1 },
    { id: 'endC', ch: 5, t: 'Скрытая концовка: Покров', d: 'Отпеть утонувших и вернуться живым и помнящим.', end: 1, secret: 'Назовите всех по имени и дайте им услышать колокол.' },
    { id: 'blank', ch: 5, t: 'Чистый лист', d: 'Вернуться в «Зарю» после концовки «Берег».', secret: 'Иногда стоит начать сначала.' },
    { id: 'loop', ch: 5, t: 'Он всегда там стоит', d: 'Увидеть его на остановке после концовки «Омут».', secret: 'Присмотритесь к лесу при вспышке молнии.' },
    { id: 'all', ch: 5, t: 'Всё обо всём', d: 'Увидеть все три концовки.', secret: 'Энциклопедия знает всё. Почти.' },
  ];
  // Флаги игры, которые сами по себе означают достижение.
  const BY_FLAG = { called: 'called', photoVision: 'photo', vision: 'vision1', saved: 'mitya', sold: 'sold', found1955: 'list1955', threadsUnlocked: 'threads', flashback: 'flashback', rang: 'rang', nikGoes: 'nik' };
  const CH = ['', 'Приезд', 'Город', 'Покровское', 'Нити', 'Омут'];
  const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V'];

  const got = () => OM.store.get(KEY) || {};
  const AC = (OM.ach = { LIST });
  AC.has = (id) => !!got()[id];
  AC.count = () => Object.keys(got()).filter((k) => LIST.some((a) => a.id === k)).length;
  const queue = [];
  let showing = false;
  AC.unlock = (id) => {
    const a = LIST.find((x) => x.id === id);
    if (!a || AC.has(id)) return;
    const g = got();
    g[id] = Date.now();
    OM.store.set(KEY, g);
    queue.push(a);
    if (!showing) pop();
    if (a.end && ['endA', 'endB', 'endC'].every((e) => g[e])) setTimeout(() => AC.unlock('all'), 2600);
  };
  AC.onFlag = (k) => { if (BY_FLAG[k]) AC.unlock(BY_FLAG[k]); };

  function pop() {
    const a = queue.shift();
    if (!a) { showing = false; return; }
    showing = true;
    const el = document.getElementById('ach-pop');
    el.innerHTML = '';
    const m = medal(a, true);
    const box = document.createElement('div');
    box.className = 'txt';
    box.innerHTML = `<div class="k">${a.end ? 'Концовка' : 'Достижение'}</div><div class="t"></div><div class="d"></div>`;
    box.querySelector('.t').textContent = a.t;
    box.querySelector('.d').textContent = a.d;
    el.append(m, box);
    el.classList.add('on');
    if (S.achieve) S.achieve(); else if (S.bell) S.bell(0.3);
    setTimeout(() => { el.classList.remove('on'); setTimeout(pop, 700); }, 3600);
  }
  function medal(a, on) {
    const m = document.createElement('div');
    m.className = 'medal' + (on ? ' on' : '') + (a.end ? ' end' : '');
    m.textContent = on ? (a.end ? '✦' : ROMAN[a.ch]) : a.secret ? '?' : ROMAN[a.ch];
    return m;
  }

  // Экран достижений (с титула).
  AC.show = () => {
    const root = document.getElementById('ach-screen');
    const list = root.querySelector('.list');
    const g = got();
    list.innerHTML = '';
    for (let ch = 1; ch <= 5; ch++) {
      const h = document.createElement('div');
      h.className = 'chh';
      h.textContent = `Глава ${ROMAN[ch]} · ${CH[ch]}`;
      list.appendChild(h);
      LIST.filter((a) => a.ch === ch).forEach((a) => {
        const on = !!g[a.id];
        const row = document.createElement('div');
        row.className = 'row' + (on ? ' on' : '');
        const txt = document.createElement('div');
        txt.className = 'txt';
        const t = document.createElement('div');
        t.className = 't';
        t.textContent = on || !a.secret ? a.t : '???';
        const d = document.createElement('div');
        d.className = 'd';
        d.textContent = on ? a.d : a.secret ? a.secret : a.d;
        txt.append(t, d);
        row.append(medal(a, on), txt);
        list.appendChild(row);
      });
    }
    root.querySelector('.cnt').textContent = `${AC.count()} из ${LIST.length}`;
    root.classList.add('on');
  };
  window.addEventListener('DOMContentLoaded', () => {
    const root = document.getElementById('ach-screen');
    root.querySelector('.close').addEventListener('click', () => root.classList.remove('on'));
    root.addEventListener('pointerdown', (e) => { if (e.target === root) root.classList.remove('on'); });
  });
})();
