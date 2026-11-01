// Fontları uygulamaya göm (çevrimdışı çalışsın): @fontsource → www/fonts + www/css/fonts.css
import { copyFileSync, mkdirSync, writeFileSync } from 'node:fs';
mkdirSync('www/fonts', { recursive: true });
const F = [['DM Sans', 'dm-sans', [500, 700, 800, 900]], ['Barlow Condensed', 'barlow-condensed', [700, 900]], ['Pacifico', 'pacifico', [400]]];
let css = '/* @fontsource (OFL) — tools/fontlar.mjs üretir */\n';
for (const [ad, paket, kalinliklar] of F) for (const w of kalinliklar) for (const alt of ['latin', 'latin-ext']) {
  const dosya = `${paket}-${alt}-${w}-normal.woff2`;
  copyFileSync(`node_modules/@fontsource/${paket}/files/${dosya}`, `www/fonts/${dosya}`);
  css += `@font-face{font-family:'${ad}';font-style:normal;font-weight:${w};font-display:swap;src:url(../fonts/${dosya}) format('woff2')}\n`;
}
writeFileSync('www/css/fonts.css', css);
console.log('fontlar tamam');
