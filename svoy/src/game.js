// Логика игры: гости, ночи у двери, дни в избе, утро, финал.
(function () {
  const D = SV.D, U = SV.U, A = SV.A, UI = SV.UI, P = SV.P;
  const Gm = (SV.Game = {});
  const SAVE = 'svoy-save-v1';
  let S = null; // состояние прохождения
  let R = null; // генератор случайностей
  Gm.view = { scene: 'title', st: {} };
  Gm.t = 0;

  // ——— формат текста: {n} — имя, {м|ж} — по роду ———
  function fmt(s, v, extra = {}) {
    const fem = v && v.gender === 'f';
    return s
      .replace(/\{n\}/g, v ? cap(v.name) : '')
      .replace(/\{e\}/g, extra.e || '')
      .replace(/\{([^{}|]*)\|([^{}|]*)\}/g, (_, m, f) => (fem ? f : m));
  }
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

  // ——— сохранение ———
  function save() { try { localStorage.setItem(SAVE, JSON.stringify(S)); } catch (e) { /* без сохранений */ } }
  Gm.hasSave = () => { try { const s = JSON.parse(localStorage.getItem(SAVE)); return s && s.phase !== 'end'; } catch (e) { return false; } };
  Gm.clearSave = () => { try { localStorage.removeItem(SAVE); } catch (e) { /* */ } };

  function rng() { S.rc = (S.rc || 0) + 1; return U.rng(S.seed * 7919 + S.rc * 104729); }

  function newState() {
    const seed = Math.floor(Math.random() * 1e9);
    return {
      seed, rc: 0, n: 1, phase: 'day', warmth: 7, wood: 6, food: 6, hp: 3, cellar: 8,
      guests: [], nextId: 1, used: [], rules: [], fake: false, queue: null, nightLog: null,
      log: { met: 0, letHuman: 0, letMimic: 0, away: [], frozen: [], taken: [], expelled: [], expelledMimic: 0, sonFate: null, son: null },
      hungry: [],
    };
  }

  // ——— гости ———
  function pickName(r, g, age) {
    const pool = D.NAMES[g][age].filter((n) => !S.used.includes(n));
    const name = pool.length ? r.pick(pool) : r.pick(D.NAMES[g][age]);
    S.used.push(name);
    return name;
  }

  function genVisitor(r, n, mimic, force = {}) {
    const age = force.age || (r.chance(0.12) ? 'kid' : r.chance(0.32) ? 'old' : 'adult');
    let roles = Object.keys(D.ROLES).filter((k) => D.ROLES[k].ages.includes(age));
    let role = force.role || (age === 'kid' ? 'kid' : r.chance(0.3) ? 'none' : r.pick(roles.filter((k) => k !== 'kid')));
    const rg = D.ROLES[role].g;
    const gender = force.gender || (rg === 'any' ? (r.chance(0.5) ? 'm' : 'f') : rg);
    if (rg !== 'any' && rg !== gender) role = 'none';
    const v = {
      id: S.nextId++, name: force.name || pickName(r, gender, age), gender, age, role, mimic,
      local: force.local != null ? force.local : r.chance(0.6),
      look: P.gen(r, gender, age), tellKind: {}, quirk: {}, asked: [], done: {},
    };
    // Безобидные странности — бывают у всех.
    if (age === 'old' ? r.chance(0.5) : r.chance(0.1)) v.quirk.breath = 'weak';
    if (role === 'woodman' ? r.chance(0.8) : r.chance(0.15)) v.quirk.hands = 'dirty';
    else if (r.chance(0.12)) v.quirk.hands = 'bandage';
    if (role === 'hunter' && r.chance(0.8)) v.quirk.dog = 'bark';
    if (r.chance(0.15)) v.quirk.face = 'red'; else if (r.chance(0.15)) v.quirk.face = 'gap';
    if (mimic) {
      const pool = D.SIGN_ORDER.filter((s) => D.SIGNS[s].unlock <= n && D.reliable(s, n));
      const k = force.tells != null ? force.tells : n === 1 ? 3 : n <= 3 ? 2 : r.chance(0.5) ? 1 : 2;
      const tells = force.tellList || r.shuffle(pool).slice(0, k);
      for (const s of tells) {
        v.tellKind[s] = { breath: 'tell', shadow: r.pick(['none', 'wrong']), dog: 'tell', talk: 'tell', hands: r.pick(['six', 'nonails']), mirror: r.pick(['empty', 'smile']), face: r.pick(['noblink', 'teeth']) }[s];
        if (s === 'face' || s === 'breath' || s === 'hands' || s === 'dog') delete v.quirk[s];
      }
    }
    v.intro = force.intro || r.pick(D.INTRO[role]);
    v.gift = role === 'hunter' ? { food: 2 } : role === 'woodman' ? { wood: 2 } : r.chance(0.3) ? (r.chance(0.5) ? { food: 1 } : { wood: 1 }) : null;
    return v;
  }

  function buildNight(n) {
    const r = rng(), plan = D.NIGHT_PLAN[n];
    let q = [];
    if (n === 1) {
      q.push(genVisitor(r, n, false, { gender: 'f', age: 'old', role: 'elder', local: true, name: 'баба Зина', intro: 'Открой, милок, это Зина, соседка твоя! Изба выстыла, одна я… Пусти к печке.' }));
      q.push(genVisitor(r, n, true, { age: 'adult', gender: 'm', role: 'none', local: true, tellList: ['breath', 'shadow', 'dog'] }));
      q.push(genVisitor(r, n, r.chance(0.5)));
      return q;
    }
    const mimicFlags = r.shuffle(Array.from({ length: plan.visitors }, (_, i) => i < plan.mimics));
    q = mimicFlags.map((m) => genVisitor(r, n, m));
    if (n === 5 && S.guests.length) {
      const orig = r.pick(S.guests);
      const copy = genVisitor(r, n, true, { gender: orig.gender, age: orig.age, role: orig.role, local: orig.local, name: orig.name, tells: 1, intro: fmt('Это я, {n}! {Вышел|Вышла} до ветру, а дверь захлопнулась! Пусти, замёрзну!', orig) });
      copy.look = JSON.parse(JSON.stringify(orig.look));
      copy.copyOf = orig.id;
      q[r.int(1, q.length - 1)] = copy;
    }
    if (n === 7) {
      const sonMimic = r.chance(0.5);
      const son = genVisitor(r, n, sonMimic, { gender: 'm', age: 'adult', role: 'none', local: true, name: D.SON.name, intro: D.SON.intro, tells: 2 });
      son.special = 'son';
      son.look.hat = 'ushanka'; son.look.hatCol = '#3a4a3a'; son.look.coat = 'vatnik'; son.look.coatCol = '#3e4a3a'; son.look.beard = 'none'; son.look.glasses = false;
      son.gift = null;
      q.push(son);
    }
    return q;
  }

  // ——— результат проверки ———
  function checkResult(v, sign) {
    const r = rng(), Rz = D.RES;
    const tk = v.mimic ? v.tellKind[sign] : null, qk = v.quirk[sign];
    switch (sign) {
      case 'breath': return tk ? { t: r.pick(Rz.breath.tell), bad: 1 } : { t: r.pick(qk === 'weak' ? Rz.breath.weak : Rz.breath.ok) };
      case 'shadow': return tk ? { t: r.pick(Rz.shadow[tk]), bad: 1 } : { t: r.pick(Rz.shadow.ok) };
      case 'dog': return tk ? { t: r.pick(Rz.dog.tell), bad: 1, snd: 'growl' } : qk === 'bark' ? { t: r.pick(Rz.dog.bark), snd: 'bark' } : { t: r.pick(Rz.dog.ok), snd: 'whine' };
      case 'hands': return tk ? { t: r.pick(Rz.hands[tk]), bad: 1 } : { t: r.pick(Rz.hands[qk || 'ok']) };
      case 'mirror': return tk ? { t: r.pick(Rz.mirror[tk]), bad: 1 } : { t: r.pick(Rz.mirror.ok) };
      case 'face': return tk ? { t: r.pick(Rz.face[tk]), bad: 1 } : { t: r.pick(Rz.face[qk || 'ok']) };
      case 'talk': {
        const qs = D.QUESTIONS.filter((x) => !v.asked.includes(x.q));
        const Q = qs.length ? r.pick(qs) : r.pick(D.QUESTIONS);
        v.asked.push(Q.q);
        let ans;
        if (v.special === 'son') ans = r.pick(D.SON.answers[tk ? 'mimic' : 'human']);
        else ans = r.pick(tk ? Q.mimic : v.local ? Q.local : Q.outsider);
        return { q: Q.q, t: '«' + ans + '»', bad: tk ? 1 : 0 };
      }
    }
  }

  const has = (role, human = true) => S.guests.find((g) => g.role === role && (!human || !g.mimic));

  // ——— вспомогательное ———
  function setView(scene, st = {}) { Gm.view = { scene, st }; }
  function hud(label) { UI.hud(S, label); }

  // ——— ПРОЛОГ ———
  Gm.start = async function (fresh) {
    if (fresh || !Gm.hasSave()) {
      S = newState();
      save();
      setView('title', {});
      A.mood('night');
      UI.hud(null, '');
      await UI.say('Январь девяносто третьего. Заречье. Неделю метёт, света нет, телефон молчит.');
      await UI.next();
      await UI.say('Жена уехала к сестре в город ещё до метели. Сын Андрей служит. В избе — ты, печка и Жучка.');
      await UI.next();
      await UI.say('А по деревне третью ночь кто-то ходит. Стучит в окна. Просится погреться.');
      await UI.next('Включить радио');
    } else {
      S = JSON.parse(localStorage.getItem(SAVE));
    }
    loop();
  };

  async function loop() {
    while (S.phase !== 'end') {
      if (S.phase === 'day') await dayPhase();
      else if (S.phase === 'night') await nightPhase();
      else if (S.phase === 'morning') await morningPhase();
    }
  }

  // ——— ДЕНЬ ———
  async function dayPhase() {
    const n = S.n;
    setView('day', { guests: S.guests, radioOn: false });
    A.mood('day');
    hud(n === 1 ? 'Вечер' : 'День ' + n);
    UI.candles(null);
    UI.notes([]);
    if (!S.radioDone) {
      await radio(n);
      S.radioDone = true;
      S.dayLeft = n === 1 ? 2 : 3;
      save();
    }
    while (S.dayLeft > 0) {
      hud((n === 1 ? 'Вечер' : 'День ' + n) + ' · ' + S.dayLeft + ' ' + U.plural(S.dayLeft, 'час', 'часа', 'часов'));
      UI.say(dayPrompt(), '', { speed: 6, silent: true });
      const items = [
        { key: 'wood', label: 'Колоть дрова', sub: '+3 дров', icon: 'wood' },
        { key: 'cellar', label: 'Погреб', sub: S.cellar > 0 ? '+2 еды' : 'пусто', icon: 'food', disabled: S.cellar <= 0 },
        { key: 'shop', label: 'В сельпо', sub: '+4 еды, опасно', icon: 'food' },
        { key: 'rest', label: 'Вздремнуть', sub: '+1 здоровье', icon: 'heart', disabled: S.hp >= 3 },
        { key: 'talk', label: 'Поговорить', sub: 'с гостем', disabled: !S.guests.length },
        { key: 'expel', label: 'Выгнать', sub: 'гостя', disabled: !S.guests.length },
        { key: 'night', label: 'Ждать ночи', cls: 'dark' },
      ];
      const k = await UI.choose(items, { grid: true });
      if (k === 'night') break;
      const spent = await dayAction(k);
      if (spent) S.dayLeft--;
      hud();
      save();
    }
    await evening();
    S.phase = 'night';
    S.radioDone = false;
    S.queue = null;
    save();
  }

  function dayPrompt() {
    const lines = [];
    if (!S.guests.length) lines.push('В избе тихо. Только ты и Жучка.');
    else lines.push('В избе: ' + S.guests.map((g) => cap(g.name)).join(', ') + '.');
    lines.push('Чем занять светлое время?');
    return lines.join(' ');
  }

  async function dayAction(k) {
    const r = rng();
    if (k === 'wood') {
      A.play('chop'); setTimeout(() => A.play('chop'), 500); setTimeout(() => A.play('chop'), 1000);
      S.wood += 3; hud();
      await UI.say(r.pick(['Наколол дров. Руки гудят.', 'Поленница подросла. Топор тупится.', 'Колешь дрова. Из леса кто-то смотрит — или кажется.']));
      await UI.next();
      return true;
    }
    if (k === 'cellar') {
      const got = Math.min(2, S.cellar); S.cellar -= got; S.food += got; hud();
      await UI.say(`Спустился в погреб. Картошка, банка огурцов. +${got} еды. ` + (S.cellar <= 0 ? 'Больше там ничего нет.' : `Осталось запасов на ${S.cellar}.`));
      await UI.next();
      return true;
    }
    if (k === 'shop') {
      A.play('steps', 8, 0.4);
      if (r.chance(0.3 + S.n * 0.03)) {
        S.hp -= 1; S.food += 2; hud();
        A.play('sting'); UI.shake();
        await UI.say(r.pick([
          'Сельпо открыто настежь. Внутри, у прилавка, стоит Люба и улыбается в стену. Ты хватаешь две буханки и бежишь. Она бежит следом — не по снегу, по забору. Догнала у калитки.',
          'На обратном пути метель сбила с дороги. Ты час бродил вокруг собственного дома, пока кто-то ласково звал тебя из леса. Обморозил руки.',
        ]));
        if (S.hp <= 0) return endGame('dead');
      } else {
        S.food += 4; hud();
        await UI.say(r.pick([
          'Сельпо пустое, дверь нараспашку. Взял крупы и консервов. Деньги оставил на прилавке — привычка.',
          'В сельпо никого. На прилавке — недовязанный носок и очки Любы. Взял тушёнку и ушёл не оглядываясь.',
        ]));
      }
      await UI.next();
      return true;
    }
    if (k === 'rest') {
      S.hp = Math.min(3, S.hp + 1); hud();
      await UI.say('Вздремнул у печки. Снилось лето.');
      await UI.next();
      return true;
    }
    if (k === 'talk' || k === 'expel') {
      UI.say(k === 'talk' ? 'С кем поговорить?' : 'Кого выставить за дверь? Обратно не пущу.', '', { speed: 6, silent: true });
      const items = S.guests.map((g) => ({ key: String(g.id), label: cap(g.name), sub: D.ROLES[g.role].title }));
      items.push({ key: 'back', label: 'Назад', cls: 'dark' });
      const id = await UI.choose(items, { grid: true });
      if (id === 'back') return false;
      const g = S.guests.find((x) => String(x.id) === id);
      Gm.view.st.sel = g.id;
      if (k === 'talk') {
        const teacher = has('teacher');
        const pBad = 0.55 + (teacher ? 0.25 : 0);
        let line;
        if (g.mimic && r.chance(pBad)) line = r.pick(g.age === 'kid' ? D.TALK.childBad : D.TALK.bad);
        else line = r.pick(g.age === 'kid' ? D.TALK.child : D.TALK.good);
        await UI.say(fmt(line, g));
        if (teacher && teacher.id !== g.id && r.chance(0.5)) {
          await UI.next();
          await UI.say(fmt(g.mimic ? 'Учительница потом шепчет тебе: «С {n} что-то не так. Ни одной песни не помнит. Ни одной».' : 'Учительница потом говорит: «{n} — живой человек. Я детей тридцать лет вижу насквозь».', g));
        }
      } else {
        S.guests = S.guests.filter((x) => x.id !== g.id);
        Gm.view.st.guests = S.guests;
        A.play('door');
        if (g.mimic) {
          S.log.expelledMimic++;
          await UI.say(fmt('Ты выставил {n} за дверь. {Он|Она} не {обернулся|обернулась}. {Пошёл|Пошла} через поле — и на снегу не осталось ни одного следа.', g));
          A.play('sting');
        } else {
          S.log.expelled.push(g.name);
          S.pendingAway = (S.pendingAway || []).concat([{ name: g.name, gender: g.gender, expelled: true }]);
          await UI.say(fmt('{n} долго стоит у калитки. Потом уходит к трассе. Оглядывается. Ты задвигаешь засов.', g));
        }
        hud();
      }
      Gm.view.st.sel = null;
      await UI.next();
      return true;
    }
    return false;
  }

  async function radio(n) {
    const B = D.RADIO[n];
    if (!B) return;
    Gm.view.st.radioOn = true;
    A.radio(true, B.fake);
    for (const line of B.lines) {
      await UI.say(line, 'Радио', { cls: 'radio' + (B.fake ? ' fake' : ''), speed: B.fake ? 26 : 20 });
      await UI.next();
    }
    A.radio(false);
    Gm.view.st.radioOn = false;
    D.RULES.forEach((ru) => { if (ru.from <= n && !S.rules.includes(ru.id)) S.rules.push(ru.id); });
    if (n >= 4) S.breathBroken = true;
    if (B.fake) {
      S.fake = true;
      await UI.say(B.note);
      await UI.next();
      const rad = S.guests.find((g) => g.role === 'radio');
      if (rad) {
        await UI.say(fmt(rad.mimic ? '{n} кивает: «Всё верно говорят. Открывать надо. Тень — у них».' : '{n} хмурится: «Это не наш диктор. Голос не тот, и несущая гудит. Брешут. Не верь».', rad));
        await UI.next();
      }
    }
    if (n === 1) {
      await UI.say('Приметы записаны в Памятку — кнопка вверху. Свечей на ночь мало: каждая проверка у двери сжигает одну.');
      await UI.next();
    }
    if (n === 7) S.fakeExposed = true;
  }

  async function evening() {
    setView('day', { guests: S.guests, cold: 0.15 });
    const humans = S.guests.filter((g) => !g.mimic);
    const need = 1 + humans.length;
    const lines = [];
    if (S.food >= need) { S.food -= need; lines.push(`Ужин. Еды ушло: ${need}.`); S.hungry = []; }
    else {
      const fed = S.food; S.food = 0;
      if (fed < 1) { S.hp -= 1; lines.push('Есть нечего. Ложишься голодным. Голова кружится.'); }
      else lines.push('Еды не хватило на всех. Ты отдал последнее и ешь сам.');
      S.hungry = humans.slice(Math.max(0, fed - 1)).map((g) => g.id);
      if (S.hungry.length) lines.push('Кто-то остался без ужина.');
    }
    if (S.wood >= 2) { S.wood -= 2; S.warmth = Math.min(10, S.warmth + 3); lines.push('Протопил печь на ночь.'); }
    else lines.push('Дров нет. Печь остывает.');
    hud('Вечер');
    A.play('match');
    await UI.say(lines.join(' '));
    if (S.hp <= 0) return endGame('dead');
    await UI.next('Ночь');
  }

  // ——— НОЧЬ ———
  async function nightPhase() {
    const n = S.n;
    if (!S.queue) { S.queue = buildNight(n); S.qi = 0; S.opens = 0; S.nightAway = []; save(); }
    const plan = D.NIGHT_PLAN[n];
    let candles = plan.candles;
    const st = { v: null, empty: true };
    setView('night', st);
    A.mood('night');
    hud('Ночь ' + n);
    UI.candles(candles, plan.candles);
    UI.notes([]);
    await UI.say(['', 'Первая ночь. Свеча на подоконнике, Жучка у ног. Ждёшь.', 'Вторая ночь. Ветер воет в трубе.', 'Третья ночь. Снег по окна.', 'Четвёртая ночь. Мороз под сорок. Стены трещат.', 'Пятая ночь. Тихо. Слишком тихо.', 'Шестая ночь. Радио молчит.', 'Седьмая ночь. Последняя.'][n]);
    await UI.next('Ждать');

    while (S.qi < S.queue.length) {
      const v = S.queue[S.qi];
      Sc_setZoom(v);
      st.v = v; st.empty = true; st.fx = null; st.leave = null; st.enter = null; st.reveal = null; st.mouth = 'closed';
      UI.notes([]);
      UI.clearActions();
      if (v.special === 'son') { A.play('bang'); UI.shake(); await UI.say('В дверь колотят. Изо всех сил.'); }
      else { A.play('knock', 3); UI.shake(); await UI.say(['Стук в дверь.', 'Снова стучат.', 'Стук. Тихий, вежливый.', 'Кто-то скребётся в дверь.'][Math.min(3, S.qi)]); }
      await U.wait(700);
      A.play('creak');
      st.empty = false; st.arrive = Gm.t;
      await U.wait(500);
      const who = cap(v.name) + (v.special === 'son' ? ' · сын' : v.role !== 'none' ? ' · ' + D.ROLES[v.role].title : '');
      st.talking = true; st.mouth = 'open';
      const mouthAnim = setInterval(() => { st.mouth = st.mouth === 'open' ? 'closed' : 'open'; }, 140);
      await UI.say(v.intro, who);
      clearInterval(mouthAnim); st.mouth = 'closed'; st.talking = false;

      const notes = [];
      // Знахарка шепчет.
      const elder = S.guests.find((g) => g.role === 'elder');
      if (elder) {
        const r = rng();
        let pool = elder.mimic ? D.ELDER.fake : (r.chance(0.8) ? v.mimic : !v.mimic) ? D.ELDER.bad : D.ELDER.good;
        notes.push({ k: 'Шёпот:', t: fmt(r.pick(pool), elder, { e: cap(elder.name) }), cls: 'elder' });
        UI.notes(notes);
      }

      // Цикл проверок.
      let decided = null;
      while (!decided) {
        const items = D.SIGN_ORDER.filter((s) => D.SIGNS[s].unlock <= n).map((s) => ({
          key: s, label: D.SIGNS[s].btn, disabled: candles <= 0 || (s !== 'talk' && v.done[s]) || (s === 'talk' && v.asked.length >= 2), cls: v.done[s] ? 'used' : '',
        }));
        if (v.copyOf && !v.called) items.push({ key: 'call', label: 'Позвать ' + cap(v.name), cls: 'special', sub: 'того, кто в доме' });
        items.push({ key: 'in', label: 'Впустить', cls: 'go' });
        items.push({ key: 'out', label: 'Прогнать', cls: 'stop' });
        UI.say(candles > 0 ? 'Проверить? Каждая проверка — одна свеча.' : 'Свечи догорели. Решай вслепую.', who, { speed: 4, silent: true });
        const k = await UI.choose(items, { grid6: true });
        if (k === 'in' || k === 'out') { decided = k; break; }
        if (k === 'call') {
          v.called = true;
          const orig = S.guests.find((g) => g.id === v.copyOf);
          const txt = orig ? fmt('Из горницы, сонно: «Я тут! Кто там?!» — это {n}. Настоящ{ий|ая} — в доме.', orig) : 'Ты зовёшь — в доме никто не откликается.';
          notes.push({ k: 'Позвал:', t: txt, cls: orig ? 'bad' : '' });
          UI.notes(notes);
          if (orig) A.play('sting');
          continue;
        }
        candles--; UI.candles(candles, plan.candles);
        v.done[k] = true;
        if (['breath', 'hands', 'mirror', 'dog'].includes(k)) S.opens++;
        const res = checkResult(v, k);
        st.fx = k; st.fxT = Gm.t;
        if (k === 'breath') { A.play('breath'); }
        if (k === 'shadow') A.play('click');
        if (k === 'dog' && res.snd) setTimeout(() => A.play(res.snd), 500);
        if (k === 'talk') {
          await UI.say(res.q, 'Ты');
          await U.wait(300);
          st.mouth = 'open';
          const ma = setInterval(() => { st.mouth = st.mouth === 'open' ? 'closed' : 'open'; }, 140);
          await UI.say(res.t, who);
          clearInterval(ma); st.mouth = 'closed';
          notes.push({ k: res.q, t: res.t });
          UI.notes(notes);
        } else {
          await U.wait(k === 'face' ? 3000 : 1800);
          notes.push({ k: D.SIGNS[k].name + ':', t: res.t });
          UI.notes(notes);
          await UI.say(res.t, '', { speed: 10 });
        }
        await UI.next('Дальше');
        st.fx = null;
      }

      // Решение.
      S.log.met++;
      if (decided === 'in') {
        A.play('door');
        st.enter = Gm.t;
        await U.wait(1300);
        st.empty = true;
        S.guests.push(v);
        if (v.mimic) S.log.letMimic++; else S.log.letHuman++;
        if (v.special === 'son') S.log.son = { in: true, mimic: v.mimic };
        let txt = fmt(v.special === 'son' ? 'Андрей вваливается в сени, весь в снегу. Обнимает тебя. Руки ледяные.' : '{n} проходит к печке, отряхивая снег.', v);
        if (v.gift) {
          if (v.gift.food) { S.food += v.gift.food; txt += ` Принес${v.gender === 'f' ? 'ла' : ''} поесть: +${v.gift.food}.`; }
          if (v.gift.wood) { S.wood += v.gift.wood; txt += ` Притащил${v.gender === 'f' ? 'а' : ''} дров: +${v.gift.wood}.`; }
        }
        hud();
        await UI.say(txt);
      } else {
        const r = rng();
        if (v.special === 'son') S.log.son = { in: false, mimic: v.mimic };
        if (v.mimic && r.chance(0.45)) {
          st.reveal = Gm.t;
          await U.wait(400);
          A.play('sting'); UI.shake();
          await U.wait(1200);
          st.empty = true;
          await UI.say(fmt('«Уходи». Оно перестаёт притворяться: улыбка растягивается до ушей. Мгновение — и у двери никого.', v));
        } else {
          st.leave = Gm.t;
          A.play('steps', 7, 0.5);
          await U.wait(1800);
          st.empty = true;
          await UI.say(fmt(v.special === 'son' ? '«Батя… ты чего? Это ж я…» Шаги уходят в метель.' : '«Уходи». {n} медлит. Потом уходит в темноту, не оглядываясь.', v));
          if (!v.mimic) S.nightAway.push({ name: v.name, gender: v.gender, look: v.look });
          else S.nightAwayMimic = (S.nightAwayMimic || 0) + 1;
        }
      }
      await UI.next();
      S.qi++;
      save();
    }

    st.v = null; st.empty = true;
    await UI.say('Больше не стучат. Ты задуваешь свечу и долго слушаешь ветер.');
    await UI.next('Уснуть');
    st.dark = 0;
    for (let i = 0; i <= 10; i++) { st.dark = i / 10; await U.wait(60); }
    S.phase = 'morning';
    save();
  }

  function Sc_setZoom(v) { SV.Sc.setZoomVisitor(v); }

  // ——— УТРО ———
  async function morningPhase() {
    const r = rng();
    const lines = [];
    let tracks = 0, mound = null, cold = false;
    // Похожие в доме забирают людей.
    const mimics = r.shuffle(S.guests.filter((g) => g.mimic));
    let attacked = false;
    for (const m of mimics) {
      const humans = S.guests.filter((g) => !g.mimic);
      if (humans.length && r.chance(0.6)) {
        const vic = r.pick(humans);
        S.guests = S.guests.filter((g) => g.id !== vic.id);
        S.log.taken.push(vic.name);
        if (vic.special === 'son') S.log.sonFate = 'taken';
        lines.push(fmt(r.pick(D.MORNING.taken), vic));
        tracks++;
      } else if (!attacked && r.chance(0.6)) {
        attacked = true;
        S.hp -= 1;
        lines.push(D.MORNING.attacked[0]);
      }
    }
    // Те, кого прогнали.
    const away = (S.nightAway || []).concat(S.pendingAway || []);
    for (const a of away) {
      const fz = r.chance(S.n === 1 ? 0.3 : 0.5);
      if (fz) { S.log.frozen.push(a.name); lines.push(fmt(r.pick(D.MORNING.frozen), a)); mound = a.look ? a.look.coatCol : '#5a5a6a'; }
      else { S.log.away.push(a.name); lines.push(fmt(r.pick(D.MORNING.gone), a)); tracks++; }
    }
    if (S.nightAwayMimic && r.chance(0.5)) lines.push(D.MORNING.circled[0]);
    // Голодные уходят.
    for (const id of S.hungry || []) {
      const g = S.guests.find((x) => x.id === id);
      if (g && !g.mimic && r.chance(0.5)) { S.guests = S.guests.filter((x) => x.id !== id); lines.push(fmt(D.MORNING.starve[0], g)); }
    }
    // Холод.
    S.warmth -= 2 + Math.floor((S.opens || 0) / 3);
    if (S.warmth <= 0) { S.warmth = 0; S.hp -= 1; cold = true; lines.push(D.MORNING.cold[0]); }
    // Польза от гостей (или её отсутствие — подсказка).
    for (const g of S.guests) {
      if (g.role === 'hunter') { if (g.mimic) lines.push(fmt('{n} ходил{|а} в лес. Вернул{ся|ась} ни с чем — и без следов на снегу.', g)); else { S.food += 2; lines.push(fmt('{n} принёс{|ла} из леса зайца. +2 еды.', g)); } }
      if (g.role === 'woodman') { if (g.mimic) lines.push(fmt('{n} весь день «колол» дрова. Поленница не выросла.', g)); else { S.wood += 2; lines.push(fmt('{n} напилил{|а} дров. +2 дров.', g)); } }
      if (g.role === 'medic' && S.hp < 3 && S.hp > 0) { if (g.mimic) lines.push(fmt('{n} предлагает перевязать. Руки у {него|неё} холодные, как железо. Ты отказываешься.', g)); else { S.hp += 1; lines.push(fmt('{n} перевязывает тебя. +1 здоровье.', g)); } }
    }
    S.nightAway = []; S.pendingAway = []; S.nightAwayMimic = 0;
    if (!lines.length) lines.push(r.pick(['Ночь прошла тихо. Все на месте.', 'Утро. Все живы. Жучка спит у печки.', 'Тихое утро. Метель стихла.']));

    setView('morning', { tracks, mound });
    A.mood('morning');
    hud('Утро');
    UI.candles(null);
    UI.notes([]);
    for (const l of lines) { await UI.say(l); await UI.next(); }
    if (S.hp <= 0) return endGame(cold ? 'cold' : 'dead');
    if (S.n >= D.NIGHTS) return endGame('dawn');
    S.n++;
    S.phase = 'day';
    save();
  }

  // ——— ФИНАЛ ———
  async function endGame(kind) {
    S.phase = 'end';
    save();
    const humans = S.guests.filter((g) => !g.mimic), mimics = S.guests.filter((g) => g.mimic);
    let title, text, scene;
    if (kind === 'dead' || kind === 'cold') {
      scene = kind;
      title = kind === 'cold' ? 'Холод' : 'Пустая изба';
      text = kind === 'cold'
        ? 'Печь остыла. Ты лёг у неё и больше не встал. Через несколько дней колонна найдёт избу. Двери будут закрыты изнутри.'
        : 'Ты больше не встал. Утром в избе было тихо и тепло. Кто-то подкидывал дрова в печь — и улыбался.';
    } else if (mimics.length) {
      scene = 'bad'; title = 'Свои среди своих';
      text = `Колонна пришла на рассвете. Вас сажают в кузов — тесно, тепло. ${cap(mimics[0].name)} садится напротив и улыбается тебе. Слишком широко. В городе много дверей.`;
    } else if (humans.length >= 4) {
      scene = 'good'; title = 'Свои';
      text = `Колонна пришла на рассвете. Вас ${humans.length + 1} — живых, своих. Солдат пересчитывает всех дважды, светит фонарём под ноги. У всех есть тени.`;
    } else {
      scene = 'few'; title = 'Одна печь';
      text = humans.length ? `Колонна пришла на рассвете. Вас ${humans.length + 1}. Мало. Но все — свои.` : 'Колонна пришла на рассвете. Ты выходишь один, с Жучкой на руках. Ты выжил. Дверь ты так никому и не открыл зря.';
    }
    // Судьба сына.
    let sonLine = '';
    const so = S.log.son;
    if (kind === 'dawn' && so) {
      if (S.log.sonFate === 'taken') sonLine = 'Андрея в избе нет. Ты не помнишь, когда он пропал.';
      else if (so.in && !so.mimic) sonLine = 'Андрей спит у тебя на плече всю дорогу. Настоящий. Тёплый.';
      else if (so.in && so.mimic) sonLine = 'Андрей сидит рядом. Он не моргает. Ты стараешься не смотреть.';
      else if (!so.in && so.mimic) sonLine = 'Ты не открыл тому, кто звал голосом сына. Через месяц придёт письмо: рядовой Андрей пропал без вести ещё в декабре. Ты был прав.';
      else sonLine = 'Андрея нашли у трассы, в километре от дома. Он шёл к тебе.';
    }
    setView('end', { kind: scene, people: S.guests });
    A.mood('end');
    hud('Конец');
    UI.candles(null); UI.notes([]);
    if (scene === 'bad' || scene === 'dead') A.play('sting'); else A.play('soft');
    await UI.say(title.toUpperCase(), '', { cls: 'title-say', speed: 60 });
    await UI.next();
    await UI.say(text);
    await UI.next();
    if (sonLine) { await UI.say(sonLine); await UI.next(); }
    const L = S.log;
    await UI.say(
      `Ночей пережито: ${kind === 'dawn' ? 7 : S.n - 1}. Стучали: ${L.met}. Впущено людей: ${L.letHuman}, Похожих: ${L.letMimic}. ` +
      `Прогнано своих: ${L.frozen.length + L.away.length}${L.frozen.length ? ` (замёрзли: ${L.frozen.length})` : ''}. Забрано из дома: ${L.taken.length}. Выставлено Похожих: ${L.expelledMimic}.`
    );
    Gm.clearSave();
    const k = await UI.choose([{ key: 'again', label: 'Ещё раз', cls: 'wide' }]);
    if (k === 'again') location.reload();
  }

  // ——— Памятка ———
  Gm.notesHtml = function () {
    if (!S) return '<p>Начните игру.</p>';
    const rules = D.RULES.filter((r) => S.rules.includes(r.id)).map((r) => {
      if (r.id === 'breath' && S.breathBroken) return `<li class="broken"><s>${r.text}</s><br><em>${r.broke}</em></li>`;
      return `<li>${r.text}</li>`;
    });
    if (S.fake) rules.push(`<li class="fake">${D.FAKE_RULE.text}${S.fakeExposed ? '<br><em>Радиоузел: «Вчера в эфир выходили не мы».</em>' : ''}</li>`);
    const guests = S.guests.map((g) => `<li><b>${cap(g.name)}</b> — ${D.ROLES[g.role].title}. <small>${D.ROLES[g.role].perk}</small></li>`).join('') || '<li>Никого.</li>';
    const L = S.log;
    return `<h2>Памятка</h2>
      <h3>Приметы Похожих</h3><ul>${rules.join('') || '<li>Пока ничего. Послушай радио.</li>'}</ul>
      <h3>Что знают свои</h3><ul>${D.FACTS.map((f) => `<li>${f}</li>`).join('')}</ul>
      <h3>В избе</h3><ul>${guests}</ul>
      <h3>Записи</h3><ul>
        ${L.taken.length ? `<li>Забраны ночью: ${L.taken.map(cap).join(', ')}</li>` : ''}
        ${L.frozen.length ? `<li>Замёрзли у калитки: ${L.frozen.map(cap).join(', ')}</li>` : ''}
        ${L.away.length ? `<li>Ушли к трассе: ${L.away.map(cap).join(', ')}</li>` : ''}
        <li>Ночь ${S.n} из ${D.NIGHTS}. Колонна придёт после седьмой.</li>
      </ul>
      <h3>Как играть</h3><ul>
        <li>Ночью стучат. Проверки сжигают свечи — на всех не хватит.</li>
        <li>Свои в доме помогают: охотник кормит, тракторист носит дрова, фельдшер лечит.</li>
        <li>Похожие в доме по ночам забирают людей. Днём поговори с гостями — они себя выдают.</li>
        <li>Каждую ночь нужна еда на всех и дрова на печь.</li>
      </ul>`;
  };

  Gm.state = () => S;
})();
