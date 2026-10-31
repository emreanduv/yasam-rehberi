// Çarşı verisini Wikidata'dan yeniden üretir → www/data/carsi.json
// Kullanım (Mac terminali, internet gerekir): npm run carsi
// 31.10: Fırsat Akışı dizinindeki markalardan Wikidata ile doğrulananlar da eklendi (ülke/merkez Türkiye, yurt dışı sahip yok; yer adı ve kapanmış şirket eşleşmeleri elendi).
// Seçim: Türkçe Vikipedi'nin "Türkiye merkezli ... şirketleri" / "Türk ... markaları" kategorilerinden elle seçilmiş tüketici markaları.
// Bilerek dışarıda: alkol, tütün, banka/finans, savunma, holding, kapanmış şirketler.
import { writeFileSync, readFileSync } from "node:fs";

const PICK = {
  gida: "Q334789 Q6090589 Q6049099 Q63209808 Q5994473 Q31190884 Q119442968 Q118496649 Q19613996 Q65219957 Q65219971 Q65219984 Q17513065 Q20471706 Q6033790 Q6031553 Q118929542 Q6009987 Q118929548 Q118929547 Q109383852 Q20472507 Q123784262 Q4779832 Q20474291 Q118929382 Q12810467 Q25475766 Q104853262 Q118946806 Q6012986 Q118946921 Q118946919 Q25478119 Q6096616 Q6772111 Q65220186 Q6051584 Q20471647 Q131431803 Q18411994",
  lokanta: "Q126125081 Q108919263 Q19612651 Q6037042 Q28940632 Q118929749 Q6057390 Q6056425 Q97599057 Q17116336 Q20472928 Q6030568 Q135429022 Q1567297 Q28008050 Q28042608 Q126924105 Q28940521 Q6037571 Q135429027 Q98091529 Q138820377 Q6049061 Q115264889",
  icecek: "Q6021512 Q118929513 Q61075548 Q116249221 Q6032036 Q122731633 Q1557571 Q6035639 Q6015522 Q6012039 Q6013562 Q61075558 Q1107571 Q6031872 Q118946367 Q6074379 Q2659408",
  giyim: "Q3205965 Q6059861 Q6063877 Q1911924 Q6041719 Q143174 Q120761946 Q119167433 Q6084348 Q22312972 Q7909026 Q20472219 Q28729986 Q6057571 Q6049876 Q6067589 Q97235771 Q17373410 Q17513880 Q118946455 Q2714156 Q28059537 Q118929077 Q6059308 Q6080115 Q16968139 Q6057885 Q28940536",
  ev: "Q640497 Q631792 Q2191408 Q61073330 Q97924909 Q31191295 Q109383865 Q118929724 Q109390397 Q31188760 Q12812404 Q97321083 Q118929315 Q86661237 Q17515320 Q7937213 Q19613071 Q6031999 Q6042498 Q6042684 Q98382016 Q124621711 Q119999913 Q106803513 Q28605887 Q6072162 Q119167832 Q4821155 Q6014219 Q6047234 Q61074958 Q106803578 Q126728119 Q106803706 Q17090872",
  bakim: "Q6094453 Q30140671 Q6060664 Q25474944 Q119168262 Q5942099 Q20476663 Q6020841 Q28940506 Q126811307",
  teknoloji: "Q6058218 Q2698771 Q12808343 Q31188765 Q263700 Q6017141 Q283852 Q1784943",
  hobi: "Q20474138 Q6079511 Q124424310 Q6088571 Q105972959 Q28606323 Q28940735",
  market: "Q1022075 Q6034496 Q19613992 Q1754510 Q19611869 Q118929561 Q19612914 Q6559269 Q6048050 Q17332548 Q6057541 Q25475379 Q28605813 Q4952569 Q6103457 Q6073041 Q110454434 Q127414799 Q17507971 Q28605791 Q28870164 Q20010130 Q27431235 Q112228237",
  yol: "Q6039733 Q1734420 Q206228 Q2094576 Q796295 Q12810915 Q85972256 Q118929934 Q1728197 Q6049915 Q19612269 Q6094539 Q7072824 Q1278087 Q62274352 Q6013486 Q1790346 Q1136056 Q20988315 Q21525084 Q6046717 Q30252253 Q3547051 Q21293367 Q1854061",
  dijital: "Q2352604 Q29364771 Q118134711 Q29840121 Q100250512 Q104654149 Q85970774 Q6084252 Q6090601 Q54258978 Q4044731 Q6042123 Q20472794 Q31191454",
  yolculuk: "Q4548 Q1100424 Q483676 Q19313474 Q20471091 Q2905397 Q3079259 Q6094691 Q6505802 Q6051265 Q19611974 Q6052726",
};
// Elle düzeltmeler: Wikidata'daki hatalı/eskimiş değerler (31.10.2026 kontrolü)
const FIX = {
  // 01.11: tarama sonrası eklenenlerde Wikidata'da eksik/eski sahiplik (kamuya açık satın alma duyurularına göre)
  Q112228237: { n: "File", o: [["BİM", "Q43"]] },                                  // BİM'in süpermarket zinciri (2015)
  Q6094691: { o: [["Österreichische Post", "Q40"]] },                             // Avusturya Postası, 2022'den beri çoğunluk
  Q6052726: { o: [["FlixBus", "Q183"]] },                                         // 2019'da FlixBus'a geçti
  Q6042123: { n: "Hepsiburada", o: [["Kaspi.kz", "Q232"]] },                      // 2025'te Kaspi.kz çoğunluk hissesi
  Q17090872: { o: [["Panasonic", "Q17"]] },                                       // 2014'ten beri Panasonic
  Q30252253: { o: [["Hacı Ömer Sabancı Holding", "Q43"], ["Bridgestone", "Q17"]] },
  Q3547051: { o: [["Koç Holding", "Q43"], ["CNH Industrial", "Q55"]] },
  Q1854061: { o: [["OYAK", "Q43"], ["Renault", "Q142"]] },
  Q1784943: { o: [["Vodafone Group", "Q145"]] },
  Q28870164: { o: [["Hacı Ömer Sabancı Holding", "Q43"], ["Carrefour", "Q142"]] },   // Sabancı–Carrefour ortaklığı; Wikidata'da sahip alanı boş (31.10)
  Q7937213: { w: null },                 // web sitesi alanında alakasız bir alan adı vardı
  Q796295: { o: null },                  // tarihsel "British Motor Corporation" bağı, güncel sahiplik değil
  Q4952569: { n: "Boyner" }, Q6103457: { n: "Özdilek" }, Q1728197: { n: "Kanuni" },
  Q6074379: { n: "SEK" }, Q20472507: { n: "Keskinoğlu" },
};
const SKIP_HQ = new Set(["Türkiye"]);

const ids = [...new Set(Object.values(PICK).join(" ").split(" "))];
const q = `SELECT ?item ?name ?inc ?hqL ?web ?rel ?relL ?rc ?wp WHERE {
 VALUES ?item { ${ids.map((x) => "wd:" + x).join(" ")} }
 OPTIONAL { ?item rdfs:label ?name FILTER(lang(?name)="tr") }
 OPTIONAL { ?item wdt:P571 ?inc }
 OPTIONAL { ?item wdt:P159 ?hq. ?hq rdfs:label ?hqL FILTER(lang(?hqL)="tr") }
 OPTIONAL { ?item wdt:P856 ?web }
 OPTIONAL { { ?item wdt:P749 ?rel } UNION { ?item wdt:P127 ?rel }
   OPTIONAL { ?rel rdfs:label ?relTr FILTER(lang(?relTr)="tr") } OPTIONAL { ?rel rdfs:label ?relEn FILTER(lang(?relEn)="en") }
   BIND(COALESCE(?relTr,?relEn) AS ?relL) OPTIONAL { ?rel wdt:P17 ?rc } }
 OPTIONAL { ?wp schema:about ?item; schema:isPartOf <https://tr.wikipedia.org/> }
}`;
// İnternet kısıtlıysa: `node tools/carsi_veri.mjs --sorgu` sorguyu yazar; query.wikidata.org'da çalıştırıp
// sonucu (JSON) kaydet, sonra `CARSI_JSON=dosya.json npm run carsi`.
if (process.argv.includes("--sorgu")) { console.log(q); process.exit(0); }
let sonuc;
if (process.env.CARSI_JSON) sonuc = JSON.parse(readFileSync(process.env.CARSI_JSON, "utf8"));
else {
  const res = await fetch("https://query.wikidata.org/sparql?format=json", {
    method: "POST", body: new URLSearchParams({ query: q }),
    headers: { "User-Agent": "YasamRehberi-Carsi/1.0 (https://github.com/emreanduv/yasam-rehberi)", Accept: "application/sparql-results+json" },
  });
  if (!res.ok) throw new Error(`Wikidata ${res.status}`);
  sonuc = await res.json();
}
const F = {};
for (const b of sonuc.results.bindings) {
  const id = b.item.value.split("/").pop(); const g = (k) => (b[k] ? b[k].value : "");
  const e = (F[id] ??= { web: new Set(), rel: new Map() });
  if (g("name")) e.name = g("name");
  if (g("inc")) e.inc = Math.min(e.inc || 9999, +g("inc").slice(0, 4));
  if (g("hqL")) e.hq = g("hqL");
  if (g("web")) e.web.add(g("web"));
  if (g("wp")) e.wp = decodeURIComponent(g("wp").split("/wiki/")[1]);
  if (g("relL")) { const k = g("rel"); const r = e.rel.get(k) || { n: g("relL"), c: new Set() }; if (g("rc")) r.c.add(g("rc").split("/").pop()); e.rel.set(k, r); }
}
const clean = (s) => s.replace(/_/g, " ").replace(/\s*\((şirket|marka|şirket, Türkiye|market|Türkiye)\)$/, "");
const pickWeb = (ws) => [...ws].sort((x, y) => (/\.tr\b/.test(y) - /\.tr\b/.test(x)) || x.length - y.length)[0] || null;
const items = [];
for (const [r, list] of Object.entries(PICK)) for (const id of list.split(" ")) {
  const e = F[id] || { web: new Set(), rel: new Map() };
  const o = [...e.rel.values()].map((x) => [x.n, [...x.c][0] || ""]);
  const it = { n: clean(e.wp || e.name || id), y: e.inc && e.inc < 9999 ? e.inc : null, m: SKIP_HQ.has(e.hq) ? null : e.hq || null,
    w: pickWeb(e.web), wp: e.wp || null, o: o.length ? o : null, ...(FIX[id] || {}) };
  items.push([id, it.n, r, it.y, it.m, it.w, it.wp, it.o]);
}
// Wikidata'da kaydı olmayan, kaynağıyla elle girilmiş markalar (ör. saat reyonu)
for (const it of JSON.parse(readFileSync(new URL("./carsi_elle.json", import.meta.url), "utf8")).items) items.push(it);
const today = new Date().toISOString().slice(0, 10);
const out = `{"meta":${JSON.stringify({ kaynak: "Wikidata (CC0) + Türkçe Vikipedi kategori üyelikleri + kaynaklı elle kayıtlar (tools/carsi_elle.json)", guncelleme: today, not: "Kuruluş, merkez ve sahiplik bilgileri Wikidata'dan olduğu gibi alınmıştır." })},\n"items":[\n${items.map((i) => JSON.stringify(i)).join(",\n")}\n]}\n`;
writeFileSync(new URL("../www/data/carsi.json", import.meta.url), out);
console.log(`${items.length} marka yazıldı → www/data/carsi.json (${today}). Değişen web siteleri ve sahiplikleri gözden geçir.`);
