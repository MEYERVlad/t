// Собирает «Свой» в один самодостаточный файл: dist/svoy.html (CSS, JS и шрифты внутри).
// Запуск: node tools/build.js
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');

let html = read('index.html');
html = html.replace(/<link rel="stylesheet" href="([^"]+)">/g, (_, href) => {
  let css = read(href);
  // Шрифты — в base64, чтобы работало без сети.
  css = css.replace(/url\(([^)]+\.woff2)\)/g, (m, f) => {
    const file = path.join(root, path.dirname(href), f);
    return `url(data:font/woff2;base64,${fs.readFileSync(file).toString('base64')})`;
  });
  return `<style>\n${css}</style>`;
});
html = html.replace(/<script src="([^"]+)"><\/script>/g, (_, s) => `<script>\n${read(s).replace(/<\/script/g, '<\\/script')}</script>`);

fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
fs.writeFileSync(path.join(root, 'dist', 'svoy.html'), html);
console.log(`dist/svoy.html: ${(html.length / 1024).toFixed(0)} КБ`);
