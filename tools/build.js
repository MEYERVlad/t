// Собирает игру в один самодостаточный файл dist/omut.html (CSS и JS встраиваются).
// Запуск: node tools/build.js
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

html = html.replace(/<link rel="stylesheet" href="([^"]+)">/g, (_, href) =>
  `<style>\n${fs.readFileSync(path.join(root, href), 'utf8')}</style>`);
html = html.replace(/<script src="([^"]+)"><\/script>/g, (_, src) =>
  `<script>\n${fs.readFileSync(path.join(root, src), 'utf8').replace(/<\/script/g, '<\\/script')}</script>`);

fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
const out = path.join(root, 'dist', 'omut.html');
fs.writeFileSync(out, html);
console.log(`${path.relative(root, out)}: ${(html.length / 1024).toFixed(0)} КБ`);
