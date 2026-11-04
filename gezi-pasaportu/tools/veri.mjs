/* Gezi Pasaportu veri derleyici: ülkeler (countries-list MIT, i18n-iso-countries MIT), harita (Natural Earth kamu malı, world-atlas ISC), şehirler (GeoNames CC-BY 4.0, all-the-cities MIT). Bir Mr. Anduv! yapımıdır. */
import { createRequire } from 'module'; const require = createRequire(import.meta.url);
import fs from 'fs';
const {countries} = require('countries-list');
const iso = require('i18n-iso-countries'); iso.registerLocale(require('i18n-iso-countries/langs/tr.json'));
const topo = require('topojson-client'); const simp = require('topojson-simplify');
const d3 = require('d3-geo');
const cities = require('all-the-cities');
const OUT = process.argv[2];
const TR_AD = {"Athens": "Atina", "Rome": "Roma", "Vienna": "Viyana", "Prague": "Prag", "London": "Londra", "Moscow": "Moskova", "Belgrade": "Belgrad", "Cairo": "Kahire", "Beijing": "Pekin", "Venice": "Venedik", "Florence": "Floransa", "Naples": "Napoli", "Munich": "Münih", "Cologne": "Köln", "Lisbon": "Lizbon", "Warsaw": "Varşova", "Brussels": "Brüksel", "Copenhagen": "Kopenhag", "Bucharest": "Bükreş", "Sofia": "Sofya", "Damascus": "Şam", "Jerusalem": "Kudüs", "Tehran": "Tahran", "Baghdad": "Bağdat", "Mecca": "Mekke", "Medina": "Medine", "Skopje": "Üsküp", "Sarajevo": "Saraybosna", "Budapest": "Budapeşte", "Geneva": "Cenevre", "Zürich": "Zürih", "Alexandria": "İskenderiye", "Seville": "Sevilla", "Milan": "Milano", "Kyiv": "Kiev", "Tbilisi": "Tiflis", "Baku": "Bakü", "Algiers": "Cezayir", "Tunis": "Tunus", "Lucerne": "Luzern", "Kraków": "Krakov", "Thessaloníki": "Selanik", "Nicosia": "Lefkoşa", "The Hague": "Lahey", "Antwerp": "Anvers", "Bruges": "Brugge", "Edinburgh": "Edinburg", "Seoul": "Seul", "New Delhi": "Yeni Delhi", "Mexico City": "Meksiko", "Havana": "Havana", "Marrakesh": "Marakeş", "Fès": "Fes", "Casablanca": "Kazablanka", "Hong Kong": "Hong Kong", "Dubai": "Dubai", "Doha": "Doha", "Riyadh": "Riyad", "Amman": "Amman", "Beirut": "Beyrut", "Tashkent": "Taşkent", "Samarkand": "Semerkant", "Bukhara": "Buhara", "Almaty": "Almatı", "Bishkek": "Bişkek", "Ashgabat": "Aşkabat", "Dushanbe": "Duşanbe", "Pristina": "Priştine", "Tirana": "Tiran", "Podgorica": "Podgoritsa", "Chisinau": "Kişinev", "Riga": "Riga", "Vilnius": "Vilnius", "Tallinn": "Tallinn", "Helsinki": "Helsinki", "Stockholm": "Stokholm", "Oslo": "Oslo", "Reykjavík": "Reykjavik", "Dublin": "Dublin", "Bern": "Bern", "Ljubljana": "Lübliyana", "Zagreb": "Zagreb", "Bratislava": "Bratislava", "Marseille": "Marsilya", "Lyon": "Lyon", "Nice": "Nice", "Hamburg": "Hamburg", "Salzburg": "Salzburg", "Dubrovnik": "Dubrovnik", "Valletta": "Valletta", "Bangkok": "Bangkok", "Kuala Lumpur": "Kuala Lumpur", "Singapore": "Singapur", "Abu Dhabi": "Abu Dabi", "Rio de Janeiro": "Rio de Janeiro", "Barcelona": "Barselona", "Madrid": "Madrid", "Berlin": "Berlin", "Paris": "Paris", "Amsterdam": "Amsterdam", "Washington, D.C.": "Washington", "Ottawa": "Ottava", "Canberra": "Kanberra", "Kabul": "Kabil", "Islamabad": "İslamabad", "Lahore": "Lahor", "Jeddah": "Cidde", "Tripoli": "Trablus", "Khartoum": "Hartum", "Addis Ababa": "Addis Ababa", "Pyongyang": "Pyongyang", "Taipei": "Taipei", "Manila": "Manila", "Jakarta": "Cakarta", "Hanoi": "Hanoi", "Kathmandu": "Katmandu", "Mostar": "Mostar", "Plovdiv": "Filibe", "Edirne": "Edirne", "Nafplio": "Nafplio", "Batumi": "Batum", "Ganja": "Gence", "Shusha": "Şuşa", "Prizren": "Prizren", "Ohrid": "Ohri", "Bitola": "Manastır", "Varna": "Varna", "Constanța": "Köstence", "Kazan": "Kazan", "Saint Petersburg": "St. Petersburg", "Ulaanbaatar": "Ulan Batur", "Astana": "Astana", "Tokyo": "Tokyo", "Kyoto": "Kyoto", "Osaka": "Osaka", "Luxembourg": "Lüksemburg", "Monaco": "Monako", "Rabat": "Rabat"};
const TERR = 'AS AI AQ AW AX BL BM BQ BV CC CK CW CX EH FK FO GF GG GI GL GP GS GU HK HM IM IO JE KY MF MO MP MQ MS NC NF NU PF PM PN PR RE SH SJ SX TC TF TK UM VG VI WF YT XK TW AC TA'.split(' ');
// harita
let w = require('world-atlas/countries-50m.json');
w = simp.presimplify(w); w = simp.simplify(w, simp.quantile(w, 0.35));
const fc = topo.feature(w, w.objects.countries);
const W = 1000, H = 520;
const proj = d3.geoNaturalEarth1().fitExtent([[4,4],[W-4,H-4]], {type:'Sphere'});
const path = d3.geoPath(proj).digits(1);
const yollar = {}; const merk = {};
for (const f of fc.features) {
  let a2 = f.id ? iso.numericToAlpha2(f.id) : null;
  if (!a2 && f.properties.name === 'Kosovo') a2 = 'XK';
  if (!a2 && /Cyprus/.test(f.properties.name)) a2 = 'CY';   // Kuzey Kıbrıs → Kıbrıs adası
  if (!a2 && /Somaliland/.test(f.properties.name)) a2 = 'SO';
  if (!a2) { yollar['_' + f.properties.name] = path(f); continue; }
  const d = path(f); if (!d) continue;
  yollar[a2] = (yollar[a2] || '') + d;
  // en büyük parçanın merkezi
  merk[a2] = proj(d3.geoCentroid(f)).map(v => Math.round(v * 10) / 10);
}
// başkentler / şehirler
const sehir = {}; const baskent = {};
for (const c of cities) {
  const [lng, lat] = c.loc.coordinates;
  if (c.featureCode === 'PPLC') baskent[c.country] = [lat, lng];
  if (c.population < 5000 && !/^PPL(C|A)$/.test(c.featureCode)) continue;
  (sehir[c.country] ||= []).push([TR_AD[c.name] || c.name, +lat.toFixed(2), +lng.toFixed(2), c.population]);
}
for (const k in sehir) sehir[k] = sehir[k].sort((a, b) => b[3] - a[3]).map(x => [x[0], x[1], x[2], Math.round(x[3] / 1000)]);
const ULKE = [];
for (const [a2, c] of Object.entries(countries)) {
  if (a2 === 'AQ') continue;
  let kita = c.continent; if (a2 === 'RU') kita = 'EU'; if (a2 === 'TR') kita = 'AS';
  const ad = iso.getName(a2, 'tr') || c.name;
  let m = merk[a2];
  if (!yollar[a2]) { const b = baskent[a2]; if (b) m = proj([b[1], b[0]]).map(v => Math.round(v * 10) / 10); }
  ULKE.push({ k: a2, a: ad, en: c.name, kt: kita, b: TR_AD[c.capital] || c.capital || '', s: TERR.includes(a2) ? 0 : 1, m, h: yollar[a2] ? 1 : 0, kk: c.continents && c.continents.length > 1 ? c.continents : undefined });
}
ULKE.sort((a, b) => a.a.localeCompare(b.a, 'tr'));
console.log('ülke', ULKE.length, 'egemen', ULKE.filter(u => u.s).length, 'haritasız', ULKE.filter(u => !u.h).map(u => u.k).join(' '));
fs.writeFileSync(OUT + '/ulkeler.js', 'window.ULKELER=' + JSON.stringify(ULKE) + ';');
fs.writeFileSync(OUT + '/harita.js', 'window.HARITA={w:' + W + ',h:' + H + ',p:' + JSON.stringify(yollar) + ',kure:' + JSON.stringify(path({type:'Sphere'})) + ',g:' + JSON.stringify(path(d3.geoGraticule10())) + '};');
// şehirler: projeksiyon koordinatlarıyla
const S2 = {}; for (const k in sehir) S2[k] = sehir[k].map(([n, la, lo, p]) => { const [x, y] = proj([lo, la]); return [n, Math.round(x * 10) / 10, Math.round(y * 10) / 10, p]; });
fs.writeFileSync(OUT + '/sehirler.js', 'window.SEHIRLER=' + JSON.stringify(S2) + ';');
// projeksiyon tersi için ölçek bilgisi (serbest şehir eklerken gerekmez)
for (const f of ['ulkeler.js', 'harita.js', 'sehirler.js']) console.log(f, (fs.statSync(OUT + '/' + f).size / 1024).toFixed(0) + ' KB');
