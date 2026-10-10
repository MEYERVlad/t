// Глава 2. Холл «Зари» утром: тот же холл, дневной свет из двери, Зинаида и Митя.
(function () {
  const P = OM.P, G = OM.G, A = OM.Actors;
  const { W } = OM;
  const L = G.scenes.lobby;
  const say = (t) => OM.say('lev', t);
  const zsay = (t) => OM.say('zina', t);

  const zina = OM.actor({ id: 'zina', x: 612, y: 454, s: 1.35, face: -1, autoScale: false, draw: (c, a, t) => A.zina(c, a, t) });
  const mitya = OM.actor({ id: 'mitya', x: 1010, y: 650, face: -1, draw: (c, a, t) => A.mitya(c, a, t), litByScene: true });
  let props = null;

  OM.scene('lobby2', {
    name: 'Холл гостиницы',
    surface: 'floor',
    figLight: { amb: 0.74, tint: '#8a8a88', side: -1 },
    amb: { rain: 0.2, wind: 0.1, hum: 0.6, indoor: true },
    walk: L.walk,
    depth: L.depth,
    entries: {
      default: { x: 300, y: 660, face: 1 },
      door: { x: 150, y: 660, face: 1 },
      stairs: { x: 1060, y: 650, face: -1 },
    },
    lights: [
      { x: 118, y: 380, color: '#d8e4ee', a: 0.9, reach: 520 },
      { x: 456, y: 410, color: '#ffcf88', a: 0.6, reach: 360 },
    ],
    layers: L.layers,
    actors: () => {
      props = L.actors().find((a) => a.id === 'props');
      return [zina, mitya, props];
    },
    paint(g) {
      L.paint(g);
      // утро: холодный свет из двери и общий дневной тон
      g.save();
      g.globalCompositeOperation = 'screen';
      g.fillStyle = P.rgrad(g, 118, 400, 0, 700, [[0, 'rgba(160,185,205,.45)'], [1, 'rgba(160,185,205,0)']]);
      g.fillRect(0, 0, W, 720);
      g.fillStyle = 'rgba(120,130,140,.12)';
      g.fillRect(0, 0, W, 720);
      g.restore();
      // в стёклах двери — день, а не ночь
      [44, 122].forEach((dx) => {
        P.fillV(g, dx, 300, 70, 140, [[0, 'rgba(200,210,216,.85)'], [1, 'rgba(150,160,166,.85)']]);
        g.fillStyle = 'rgba(120,110,60,.5)';
        g.fillRect(dx + 8, 380, 50, 60);
        g.fillStyle = '#1a110a';
        g.fillRect(dx + 33, 300, 4, 140);
      });
    },
    back: L.back,
    hotspots: [
      { id: 'door', name: 'На улицу', rect: [34, 280, 168, 324], walk: [120, 660], exit: { to: 'square', entry: 'hotel', dir: 'left' } },
      { id: 'photo', name: 'Фотография', rect: [240, 180, 120, 110], look: '«Покровское, 1954». При дневном свете — просто старое фото. Если не всматриваться.' },
      {
        id: 'zina', name: 'Зинаида Павловна', rect: [548, 300, 128, 120], walk: [560, 640], face: 1,
        look: 'Хозяйка. Сегодня в очках нет льда. Почти.',
        use: async () => {
          await zsay('Чего ещё, Лев Аркадьевич?');
          const c = await OM.choose([
            { id: 'p', text: 'Расскажите про Покровское.' },
            { id: 'm', text: 'Как Митя?' },
            { id: 'b', text: 'Ничего, спасибо.' },
          ]);
          if (c === 'p') { await zsay('Я сказала — к Вере. В библиотеку при ДК. Я туда не хожу и вам не советую. Но вы ведь пойдёте.'); }
          if (c === 'm') { await zsay('Ест. Первый раз за месяц ест как человек. Это вам спасибо.'); }
        },
      },
      {
        id: 'mitya', name: 'Митя', rect: () => [mitya.x - 25, mitya.y - 130, 50, 130], walk: [940, 650], face: 1,
        look: 'Митя. Днём он обычный мальчишка в пижаме. Только смотрит — слишком внимательно.',
        use: async () => {
          if (OM.flag('mityaTalk')) {
            await OM.say('mitya', 'Дядя Лев, а вы найдёте маму?');
            await say('Я постараюсь, Митя.');
            return;
          }
          OM.flag('mityaTalk', 1);
          await OM.say('mitya', 'Мне мама приснилась. Сказала, что вы её найдёте.');
          await say('Твою маму?');
          await OM.say('mitya', 'И свою тоже.');
          await OM.wait(500);
          await say('…Что?');
          await OM.say('mitya', 'Не знаю. Так она сказала.');
        },
      },
      { id: 'clock', name: 'Часы', rect: [872, 134, 78, 222], look: 'Двадцать минут десятого. Маятник ходит, как будто ничего не было.' },
      { id: 'keys', name: 'Доска с ключами', rect: [644, 222, 156, 126], look: 'Ключ от лодочной станции вернулся на место. Зинаида ничего не сказала. Просто повесила.' },
      { id: 'stairs', name: 'Лестница', rect: [1100, 160, 180, 446], look: 'Наверх — номер семь. Спать не хочется. Совсем.' },
    ],
    setup() {
      zina.asleep = false;
    },
    async enter(entry) {
      if (entry === 'start') await OM.story2.morning();
    },
  });
})();
