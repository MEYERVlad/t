// Обвязка для мобильного приложения (Android, Capacitor) и вкладки браузера:
// кнопка «Назад» — пауза/закрыть окно/выход с титула; свернули — звук на паузу.
(function () {
  const G = OM.G, S = OM.S;
  const $ = (s) => document.querySelector(s);

  // Свернули приложение или вкладку — звук замолкает, вернулись — играет дальше.
  document.addEventListener('visibilitychange', () => {
    const c = S.ctx;
    if (!c) return;
    if (document.hidden) c.suspend && c.suspend();
    else c.resume && c.resume();
  });

  const cap = window.Capacitor;
  if (!cap || !cap.isNativePlatform || !cap.isNativePlatform()) return;
  document.documentElement.classList.add('native');
  const App = cap.Plugins && cap.Plugins.App;
  if (!App) return;
  App.addListener('backButton', () => {
    // сначала закрываем то, что открыто поверх
    const ach = $('#ach-screen');
    if (ach && ach.classList.contains('on')) return ach.classList.remove('on');
    const menu = $('#menu');
    if (menu && menu.classList.contains('on')) return OM.toggleMenu(false);
    if (G.mode === 'play') return OM.toggleMenu(true);
    App.exitApp();
  });
  // Ушли из приложения посреди игры — по возвращении открыта пауза, а прогресс сохранён.
  App.addListener('pause', () => {
    if (G.mode === 'play') { OM.save(); OM.toggleMenu(true); }
  });
})();
