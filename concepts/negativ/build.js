// Собирает прототип: вставляет дизайн-документ в страницу.
// index.html — открывается в браузере; dist/page.html — тело без <html>, для публикации.
const fs=require('fs'),p=require('path');
const md=fs.readFileSync(p.join(__dirname,'GDD-glava-1.md'),'utf8').replace(/<\/script/gi,'<\\/script');
const page=fs.readFileSync(p.join(__dirname,'src/page.html'),'utf8').replace('/*GDD*/',()=>md);
fs.mkdirSync(p.join(__dirname,'dist'),{recursive:true});
fs.writeFileSync(p.join(__dirname,'dist/page.html'),page);
fs.writeFileSync(p.join(__dirname,'index.html'),'<!doctype html>\n<html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0">\n'+page+'\n</body></html>\n');
