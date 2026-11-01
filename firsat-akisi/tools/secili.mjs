// Fırsat Akışı — seçilmiş kampanyalar ve marka dizini → JSON (veri hattının ilk adımı).
// kaynak/ klasöründeki dosyalar yayındaki Fırsat Akışı ile aynıdır (deals*.js, brands.js, carsi-markalar.js);
// yayında değişince buraya da kopyalanır. Bu betik onları tarayıcı yerine Node içinde çalıştırır ve
//   tools/secili.json  → { deals:[…], markalar:[{n,a,t,off,cat}] }
// yazar. Kullanım: node tools/secili.mjs
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const KOK = join(dirname(fileURLToPath(import.meta.url)), '..');
const KAYNAK = join(KOK, 'kaynak');
const window = { FIRSAT_DEALS: [], YERLI_MARKALAR: [] };
const ctx = vm.createContext({ window, console, Date, Intl, Math, JSON, Object, Array, String, Number, RegExp, Set, Map });

// deals.js listeyi kurar (window.FIRSAT_DEALS = […]); diğerleri ona ekler → önce deals.js
const sira = ['deals.js', ...readdirSync(KAYNAK).filter((f) => /^deals-.*\.js$/.test(f)).sort(), 'brands.js', 'carsi-markalar.js'];
for(const f of sira){
  try { vm.runInContext(readFileSync(join(KAYNAK, f), 'utf8'), ctx, { filename: f }); }
  catch(e){ console.error(`⚠️ ${f}: ${e.message}`); }
}
const markalar = (window.YERLI_MARKALAR || []).flatMap((g) => (g.brands || []).filter((b) => b && b.n)
  .map((b) => ({ n: b.n, a: b.a || [], t: b.t ? 1 : 0, off: b.off ? 1 : 0, cat: g.cat })));
const deals = window.FIRSAT_DEALS.filter((d) => d && d.title && !d.paused && !d.friend);
writeFileSync(join(KOK, 'tools', 'secili.json'), JSON.stringify({ deals, markalar }), 'utf8');
console.log(`secili.json: ${deals.length} seçilmiş kampanya · ${markalar.length} marka`);
