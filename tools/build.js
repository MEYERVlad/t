// Собирает игру и трейлер в самодостаточные файлы (CSS и JS встраиваются).
//   dist/omut.html, dist/omut-trailer.html — открываются с диска;
//   dist/*-page.html — варианты для публикации страницей claude.ai (без собственного каркаса документа).
// Запуск: node tools/build.js
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
fs.mkdirSync(path.join(root, 'dist'), { recursive: true });

function inline(src) {
  let html = fs.readFileSync(path.join(root, src), 'utf8');
  html = html.replace(/<link rel="stylesheet" href="([^"]+)">/g, (_, href) =>
    `<style>\n${fs.readFileSync(path.join(root, href), 'utf8')}</style>`);
  html = html.replace(/<script src="([^"]+)"><\/script>/g, (_, s) =>
    `<script>\n${fs.readFileSync(path.join(root, s), 'utf8').replace(/<\/script/g, '<\\/script')}</script>`);
  return html;
}

function fragment(html) {
  return html
    .replace(/<!doctype html>\s*/i, '')
    .replace(/<\/?html[^>]*>\s*/g, '')
    .replace(/<\/?head>\s*/g, '')
    .replace(/<\/?body>\s*/g, '')
    .replace(/<meta [^>]*>\s*/g, '')
    .replace('<style>', '<style>\n:root { color-scheme: dark; }');
}

for (const [src, name] of [['index.html', 'omut'], ['trailer.html', 'omut-trailer']]) {
  const html = inline(src);
  fs.writeFileSync(path.join(root, 'dist', name + '.html'), html);
  fs.writeFileSync(path.join(root, 'dist', name + '-page.html'), fragment(html));
  console.log(`dist/${name}.html: ${(html.length / 1024).toFixed(0)} КБ`);
}
