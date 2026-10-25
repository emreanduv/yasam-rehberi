// Yaşam Rehberi — uygulama ekranları
import { Engine, highlightSpans } from "./engine.js";
import { queryTerms } from "./text.js";

// ---------------------------------------------------------------------------
// Ayarlanabilir sabitler (isim değişirse sadece burası ve capacitor.config.json)
// ---------------------------------------------------------------------------
const APP_NAME = "Yaşam Rehberi";
const MAKER = "Bir Mr. Anduv! yapımıdır.";
const VERSION = "1.0.0";
const QURANENC = { rowwad: "turkish_rwwad", ozek: "turkish_shahin", saban: "turkish_shaban", muhtasar: "turkish_mokhtasar" };
const SHORT = { rowwad: "Rowwad", ozek: "Ali Özek", saban: "Ş. Britiş" };
const COLOR = { rowwad: "var(--c-rowwad)", ozek: "var(--c-ozek)", saban: "var(--c-saban)" };
const FAQ = [
  ["Sakız orucu bozar mı?", "Oruç"], ["Miras nasıl paylaştırılır?", "Miras"],
  ["Faiz hakkında ne denir?", "Faiz"], ["Boşanan kadın ne kadar bekler?", "Boşanma"],
  ["Kumar ve içki hakkında ne denir?", "İçki ve kumar"],
];
const TOPICS = [["Oruç", "oruç"], ["Miras", "miras"], ["Faiz", "faiz"], ["Namaz", "namaz vakitleri"],
  ["Boşanma", "boşanma"], ["Zekât", "zekât"], ["Hac", "hac"], ["Evlilik", "evlilik"], ["Adalet", "adalet"]];
// Günün ayeti: her gün sıradaki (yalnızca ayet numarası; metin meal verisinden gelir)
const DAILY = ["2:186", "2:286", "3:139", "13:28", "94:5", "39:53", "2:152", "65:3", "49:13", "17:23",
  "2:255", "3:190", "7:56", "16:90", "29:69", "40:60", "55:13", "93:3", "2:153", "3:159",
  "4:135", "5:8", "24:35", "31:18", "57:4", "59:22", "64:11", "67:2", "2:201", "3:8"];

// ---------------------------------------------------------------------------
// Kalıcı ayarlar (Capacitor Preferences varsa o, yoksa localStorage)
// ---------------------------------------------------------------------------
const Prefs = window.Capacitor?.Plugins?.Preferences;
const store = {
  async get(key, fallback) {
    try {
      const raw = Prefs ? (await Prefs.get({ key })).value : localStorage.getItem(key);
      return raw == null ? fallback : JSON.parse(raw);
    } catch { return fallback; }
  },
  async set(key, value) {
    const raw = JSON.stringify(value);
    try { if (Prefs) await Prefs.set({ key, value: raw }); else localStorage.setItem(key, raw); } catch { /* yoksay */ }
  },
};

let E = null;              // arama motoru
let S = { meals: null, arabic: true, tafsir: true };
let saved = [];            // kaydedilen ayet indeksleri
const view = { mealFilter: "all", tafsirOpen: false };

// ---------------------------------------------------------------------------
// yardımcılar
// ---------------------------------------------------------------------------
const $app = document.getElementById("app");
const $nav = document.getElementById("nav");
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const enc = encodeURIComponent;

const ICON = {
  back: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg>',
  next: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>',
  search: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg>',
  book: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5h6a2 2 0 0 1 2 2v12a2 2 0 0 0-2-2H4zM20 5h-6a2 2 0 0 0-2 2v12a2 2 0 0 1 2-2h6z"/></svg>',
  mark: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M6 4h12v16l-6-4-6 4z"/></svg>',
  markOn: '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M6 4h12v16l-6-4-6 4z"/></svg>',
  gear: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/></svg>',
  share: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12M7 8l5-5 5 5M5 14v6h14v-6"/></svg>',
  note: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5h16v11H8l-4 4z"/></svg>',
  warn: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7a5b00" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex:none;margin-top:1px" aria-hidden="true"><path d="M12 3l9 16H3z"/><path d="M12 10v4M12 17h.01"/></svg>',
};

function highlight(text, terms) {
  const spans = highlightSpans(text, terms);
  let out = "", last = 0;
  for (const [a, b] of spans) { out += esc(text.slice(last, a)) + "<mark>" + esc(text.slice(a, b)) + "</mark>"; last = b; }
  return out + esc(text.slice(last));
}

function excerpt(text, n = 120) {
  if (text.length <= n) return text;
  const cut = text.lastIndexOf(" ", n);
  return text.slice(0, cut > 60 ? cut : n) + "…";
}

function toast(msg) {
  const t = document.createElement("div");
  t.className = "toast"; t.textContent = msg; document.body.appendChild(t);
  setTimeout(() => t.remove(), 1800);
}

const mealsOn = () => S.meals.filter((t) => E.meals.includes(t));

function topbar(left = "brand") {
  const l = left === "brand"
    ? `<span class="brand">${esc(APP_NAME)}</span>`
    : `<button class="back" data-act="back">${ICON.back}${esc(left)}</button>`;
  return `<header class="topbar"><div class="topbar-in">${l}<span class="badge">Mr. Anduv!</span></div></header>`;
}

const linkTanzil = (s) => esc(s).replace("http://tanzil.net", '<a href="http://tanzil.net">tanzil.net</a>');
function credits(tids) {
  return `<div class="credits">Kaynak: ${E.credits(tids).map(linkTanzil).join(" · ")}</div>`;
}

function mealBlock(v, terms, filter = "all") {
  return Object.entries(v.texts)
    .filter(([t]) => filter === "all" || filter === t)
    .map(([t, txt]) => `<div class="meal">
        <div class="meal-n" style="color:${COLOR[t] || "inherit"}">${esc(filter === "all" ? (SHORT[t] || t) : E.source(t).name)}</div>
        <div class="meal-t">${highlight(txt, terms)}</div>
        ${v.footnotes[t] ? `<div class="meal-f">${esc(v.footnotes[t])}</div>` : ""}
      </div>`).join("");
}

function verseCard(v, terms) {
  const tag = v.anchorOf.length ? `<span class="tag">Temel ayet · ${esc(v.anchorOf[0])}</span>` : "";
  return `<article class="panel">
    <a class="verse-h" href="#/ayet/${v.surah}/${v.ayah}"><span class="ref">${esc(v.title)}</span>${tag}</a>
    <div class="panel-b">${mealBlock(v, terms)}
      <div style="margin-top:10px"><a class="btn-light" href="#/ayet/${v.surah}/${v.ayah}">Arapça metin ve tefsir açıklaması ›</a></div>
    </div></article>`;
}

function renderNav(active) {
  const item = (id, href, icon, label) => `<a href="${href}" class="${active === id ? "on" : ""}"${active === id ? ' aria-current="page"' : ""}>${icon}${label}</a>`;
  $nav.innerHTML = item("ara", "#/", ICON.search, "Ara") + item("sure", "#/sureler", ICON.book, "Sureler")
    + item("kayit", "#/kaydedilenler", ICON.mark, "Kaydedilenler") + item("ayar", "#/ayarlar", ICON.gear, "Ayarlar");
}

// ---------------------------------------------------------------------------
// ekranlar
// ---------------------------------------------------------------------------
function homeView() {
  const day = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 864e5);
  const [ds, da] = DAILY[day % DAILY.length].split(":").map(Number);
  const dv = E.verse(E.indexOf(ds, da), mealsOn());
  const firstMeal = Object.keys(dv.texts)[0];
  return `${topbar()}
  <section class="band">
    <div class="eyebrow">Hoş geldin</div>
    <h1>Ne öğrenmek istersin?</h1>
    <div class="sub">${E.meals.length} meal · kısa tefsir · ${E.refs.length} ayet · internetsiz arama</div>
  </section>
  <main class="content">
    <section class="panel">
      <div class="panel-h">Soru / Arama</div>
      <form class="panel-b search" data-act="search">
        <label for="q" class="sr">Soru veya kelime</label>
        <input id="q" name="q" type="search" enterkeyhint="search" autocomplete="off" placeholder="Örn. sakız orucu bozar mı">
        <button class="btn-go" type="submit">Sor ${ICON.next}</button>
      </form>
    </section>
    <section class="panel">
      <div class="panel-h">Sık sorulanlar</div>
      <div class="rows">${FAQ.map(([q, t]) => `<a class="row" href="#/ara?q=${enc(q)}">${esc(q)}<span class="meta">${esc(t)} ›</span></a>`).join("")}</div>
    </section>
    <section class="panel">
      <div class="panel-h">Konular</div>
      <div class="panel-b chips">${TOPICS.map(([l, q]) => `<a class="chip" href="#/ara?q=${enc(q)}">${esc(l)}</a>`).join("")}</div>
    </section>
    <section class="panel">
      <div class="panel-h">Gelen kutusu <span class="count">1</span></div>
      <a class="panel-b" href="#/ayet/${ds}/${da}" style="display:flex;gap:10px;text-decoration:none;color:var(--ink)">
        <div style="width:6px;border-radius:3px;background:var(--go);flex:none"></div>
        <div style="min-width:0">
          <div style="font-size:12px;font-weight:700;color:var(--band)">Günün ayeti · ${esc(dv.title)}</div>
          <div style="font-size:15px;line-height:1.45;margin-top:3px">${esc(dv.texts[firstMeal])}</div>
          <div style="font-size:11px;color:var(--ink-2);margin-top:4px">${esc(E.source(firstMeal).credit)}</div>
        </div>
      </a>
    </section>
    <div class="made">${esc(MAKER)}</div>
  </main>`;
}

function resultHeader(q, tab, n) {
  return `${topbar("Geri")}
  <section class="band tabs-below">
    <div class="eyebrow">Sorun</div>
    <h1>“${esc(q)}”</h1>
    <div class="tabs" role="tablist">
      <a class="tab ${tab === "ayet" ? "on" : ""}" role="tab" aria-selected="${tab === "ayet"}" href="#/ara?q=${enc(q)}">Ayetler (${n})</a>
      <a class="tab ${tab === "ozet" ? "on" : ""}" role="tab" aria-selected="${tab === "ozet"}" href="#/ara?q=${enc(q)}&t=ozet">Özet</a>
    </div>
  </section>`;
}

function missingInfo(r) {
  const modern = new Set(r.concepts.flatMap((c) => c.modernHit));
  const strong = r.missing.filter((w) => [...modern].some((m) => fold2(w).startsWith(m)));
  const soft = r.missing.filter((w) => !strong.includes(w));
  return { strong, soft };
}
// engine.js içindeki fold ile aynı (burada yalnızca karşılaştırma için)
const fold2 = (s) => s.replace(/İ/g, "i").replace(/I/g, "ı").toLowerCase()
  .replace(/[çğıöşüâîû]/g, (c) => ({ ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u", â: "a", î: "i", û: "u" }[c]));

// ---------- Kısa cevap kartı ----------
// Kur'an'da doğrudan geçmeyen ya da "olur mu / caiz mi" türü sorularda: ayetlerin ne söylediğini
// sade dille özetler ve resmî görüş için Diyanet Din İşleri Yüksek Kurulu'na yönlendirir.
// Uygulama fetva vermez.
const DIYANET_ARA = "https://kurul.diyanet.gov.tr/tr/fetvalar?arama=";
const RULING_RE = /\b(olur|olmaz|caiz|kabul|boz\w*|gunah|haram|helal|gerek\w*|farz|sart|gecerli|sahih|yapilir|yapilabilir|mubah|sakinca\w*|uygun|dogru|engel\w*|mekruh|sunnet)\s*m[iu]\b/;

// Diyanet araması bütün kelimelerin geçmesini istiyor: önce "modern kelime + sorudaki konu"
// (ör. "oje abdest", "sakız oruç"), ayrıca yalnızca modern kelimeyle ikinci bir arama.
function diyanetQueries(q, r, strong) {
  const qWords = q.match(/[\p{L}\p{N}']+/gu) || [];
  const modern = [];
  for (const c of r.concepts) {
    for (const w of c.modernWords || []) {
      const orig = qWords.find((x) => fold2(x).startsWith(w));
      const form = orig ? orig.slice(0, w.length).toLocaleLowerCase("tr") : w;
      if (!modern.includes(form)) modern.push(form);
    }
  }
  const topic = r.concepts.find((c) => c.triggerHit);
  if (modern.length) {
    const m = modern.slice(0, 2).join(" ");
    return topic ? [`${m} ${topic.diyanet}`, m] : [m];
  }
  if (r.concepts.length) return [(topic || r.concepts[0]).diyanet];
  // Konu yoksa: sorudaki güçlü (soru kalıbı olmayan) kelimeler, kullanıcının yazdığı biçimiyle
  const keys = queryTerms(q).filter((t) => !t.weak).map((t) => t.key);
  const words = qWords.filter((w) => keys.some((k) => fold2(w).startsWith(k.slice(0, 4))))
    .map((w) => w.toLocaleLowerCase("tr").replace(/['’].*$/, ""));
  return words.length ? [[...new Set(words)].slice(0, 2).join(" ")] : [];
}

const linkRefs = (text) => esc(text).replace(/(\d{1,3}):(\d{1,3})(?:[–-]\d{1,3})?/g,
  (m, s, a) => `<a href="#/ayet/${s}/${a}">${m}</a>`);

function answerCard(q, r, strong) {
  const ruling = RULING_RE.test(fold2(q));
  if (!strong.length && !r.concepts.length && !ruling) return "";
  if (!r.verses.length && !strong.length) return "";
  let html = `<section class="panel answer"><div class="panel-h">Kısa cevap</div><div class="panel-b">`;
  const roots = r.concepts.flatMap((c) => c.modernWords || []);
  const shown = strong.map((w) => { const m = roots.find((x) => fold2(w).startsWith(x)); return m ? w.slice(0, m.length) : w; });
  if (strong.length) {
    html += `<p><b>${[...new Set(shown)].map((w) => `“${esc(w)}”`).join(", ")} Kur'an'da geçmez;</b> bu sorunun cevabı doğrudan bir ayette yok.</p>`;
  } else if (r.concepts.length) {
    html += `<p>Bu konu Kur'an'da geçer; temel ayetler aşağıda.</p>`;
  }
  // Kullanıcının adını verdiği konu önce ("kolonya abdest bozar mı" → Abdest, sonra Oruç)
  const ordered = [...r.concepts.filter((c) => c.triggerHit), ...r.concepts.filter((c) => !c.triggerHit)];
  for (const c of ordered.slice(0, ordered[0] && ordered[0].triggerHit ? 1 : 2)) {
    if (c.note) html += `<p><span class="ans-k">Kur'an ne diyor? · ${esc(c.label)}</span>${linkRefs(c.note)}</p>`;
  }
  if (ruling || strong.length) {
    const [main, alt] = diyanetQueries(q, r, strong);
    html += `<p class="ans-m">“Olur mu, caiz mi” gibi soruların cevabı bu ayetlerin âlimlerce yorumuna (fıkıh) dayanır. Uygulama fetva vermez; resmî görüş için Diyanet İşleri Başkanlığı Din İşleri Yüksek Kurulu:</p>
      <div class="ans-btns">
        ${main ? `<a class="btn-go" href="${DIYANET_ARA}${enc(main)}">${ICON.note}Diyanet'te ara: “${esc(main)}”</a>` : ""}
        <a class="btn-light" href="tel:190">ALO 190 Fetva Hattı</a>
      </div>
      ${alt ? `<p class="ans-m" style="margin-top:8px">Sonuç çıkmazsa: <a href="${DIYANET_ARA}${enc(alt)}">yalnızca “${esc(alt)}” ile ara</a></p>` : ""}`;
  }
  return html + `</div></section>`;
}

function resultsView(q) {
  const r = E.search(q, 8, mealsOn());
  if (r.isRef && r.verses.length) { location.replace(`#/ayet/${r.verses[0].surah}/${r.verses[0].ayah}`); return ""; }
  const { strong, soft } = missingInfo(r);
  const card = answerCard(q, r, strong);
  let body = card;
  if (strong.length && !card) body += `<div class="warn">${ICON.warn}<div><b>${strong.map((w) => `“${esc(w)}”`).join(", ")} Kur'an'da geçmez.</b> Bu konuda doğrudan bir hüküm yok; aşağıdakiler konuyla dolaylı olarak ilgili ayetlerdir.</div></div>`;
  if (soft.length) body += `<div class="note">${soft.map((w) => `“${esc(w)}”`).join(", ")} kelimesi meallerde bu biçimiyle geçmiyor; konu başka kelimelerle anlatılıyor olabilir.</div>`;
  if (r.concepts.length) body += `<div class="topic">İlgili konu ${r.concepts.map((c) => `<span class="pill">${esc(c.label)}</span>`).join("")}<span style="margin-left:auto;color:var(--muted)">${mealsOn().length} meal</span></div>`;
  if (!r.verses.length) body += `<div class="empty">Bu arama için ayet bulunamadı.<br>Farklı kelimelerle deneyin.</div>`;
  body += r.verses.map((v) => verseCard(v, r.terms)).join("");
  if (r.verses.length) body += credits(mealsOn());
  return resultHeader(q, "ayet", r.verses.length) + `<main class="content">${body}</main>`;
}

function summaryView(q) {
  const r = E.search(q, 8, mealsOn());
  const { strong } = missingInfo(r);
  const state = strong.length ? 0 : r.concepts.length ? 1 : 2;
  const labels = ["Kur'an'da geçmiyor", "Temel ayetler var", "Kelime eşleşmesi"];
  const topic = r.concepts.map((c) => `“${esc(c.label)}”`).join(", ");
  const lead = [
    `${strong.map((w) => `“${esc(w)}”`).join(", ")} Kur'an'da geçmez; bu konuda doğrudan bir hüküm yoktur.${topic ? ` Aşağıda ${topic} konusunun temel ayetleri var.` : ""}`,
    `Bu soru ${topic} konusuyla eşleşti. Konunun temel ayetleri aşağıda.`,
    r.verses.length ? "Sorudaki kelimelerin geçtiği ayetler bulundu; en üsttekiler en çok eşleşenlerdir." : "Bu soru için ayet bulunamadı.",
  ][state];
  const anchors = r.verses.filter((v) => v.anchorOf.length);
  const ordered = (anchors.length ? anchors : r.verses).slice(0, 6);
  const card = answerCard(q, r, strong);
  const first = mealsOn()[0];
  const tv = ordered[0];
  const tafsirTid = E.tefsirs[0];
  let body = `<section class="panel"><div class="panel-h">Durum</div><div class="panel-b">
      <div class="status">${labels.map((l, i) => `<span class="${i === state ? "on" : ""}">${l}</span>`).join("")}</div>
      ${card ? "" : `<div style="font-size:15px;line-height:1.55;margin-top:10px">${lead}</div>`}</div></section>`;
  body += card;
  if (ordered.length) {
    body += `<section class="panel"><div class="panel-h">${state === 2 ? "Bulunan ayetler" : "Temel ayetler"}</div><div class="rows">
      ${ordered.map((v) => `<a class="row" href="#/ayet/${v.surah}/${v.ayah}" style="align-items:flex-start">
        <span style="flex:none;width:58px;font-weight:700;color:var(--band)">${v.surah}:${v.ayah}</span>
        <span style="flex:1;font-size:14px;line-height:1.45">${esc(excerpt(v.texts[first] || ""))}</span></a>`).join("")}
      </div></section>`;
  }
  if (tv && tafsirTid && tv.tafsir[tafsirTid]) {
    body += `<section class="panel"><div class="panel-h">Tefsirden · ${esc(tv.ref)}</div><div class="panel-b">
      <div class="tafsir ${view.tafsirOpen ? "" : "clamp"}">${esc(tv.tafsir[tafsirTid])}</div>
      <div style="margin-top:8px"><button class="btn-light" data-act="tafsir">${view.tafsirOpen ? "Kısalt" : "Devamını oku"}</button></div>
      <div class="credits" style="color:var(--ink-2);margin-top:6px">${esc(E.source(tafsirTid).credit)}</div></div></section>`;
  }
  if (r.terms.length) {
    body += `<section class="panel"><div class="panel-h">Aranan kelimeler</div><div class="panel-b kw">
      ${r.terms.map((t) => `<span class="${r.missingKeys.includes(t) ? "no" : ""}" title="${r.missingKeys.includes(t) ? "Meallerde geçmiyor" : "Meallerde geçiyor"}">${esc(t)}</span>`).join("")}
      </div></section>`;
  }
  body += `<div class="note">Bu özet, ayet ve tefsir metinlerinden otomatik olarak derlenmiştir; yorum veya fetva içermez.</div>`;
  return resultHeader(q, "ozet", r.verses.length) + `<main class="content">${body}${credits([...mealsOn(), ...E.tefsirs])}</main>`;
}

function verseView(s, a) {
  const i = E.indexOf(s, a);
  if (i === undefined) return `${topbar("Geri")}<div class="empty">Böyle bir ayet yok: ${s}:${a}</div>`;
  const v = E.verse(i, mealsOn());
  const prev = E.refs[i - 1], next = E.refs[i + 1];
  const isSaved = saved.includes(i);
  const filters = [["all", "Hepsi"], ...Object.keys(v.texts).map((t) => [t, SHORT[t] || t])];
  if (view.mealFilter !== "all" && !v.texts[view.mealFilter]) view.mealFilter = "all";
  const tafsirTid = E.tefsirs[0];
  return `${topbar("Geri")}
  <section class="band band-row">
    <div><div class="eyebrow">${esc(v.surahName)} suresi</div><h1>Ayet ${v.ayah}</h1></div>
    <div style="display:flex;gap:4px">
      ${prev ? `<a class="btn-go btn-dark" style="width:46px;padding:0" aria-label="Önceki ayet" href="#/ayet/${prev[0]}/${prev[1]}" data-replace>${ICON.back}</a>` : ""}
      ${next ? `<a class="btn-go" style="width:46px;padding:0" aria-label="Sonraki ayet" href="#/ayet/${next[0]}/${next[1]}" data-replace>${ICON.next}</a>` : ""}
    </div>
  </section>
  <main class="content">
    ${S.arabic ? `<section class="panel"><div class="panel-h">Arapça metin</div><div class="panel-b arabic" lang="ar">${esc(v.arabic)}</div></section>` : ""}
    <section class="panel"><div class="panel-h">Mealler</div><div class="panel-b">
      <div class="seg" role="group" aria-label="Meal seçimi">${filters.map(([id, l]) => `<button data-act="filter" data-id="${id}" class="${view.mealFilter === id ? "on" : ""}" aria-pressed="${view.mealFilter === id}">${esc(l)}</button>`).join("")}</div>
      ${mealBlock(v, [], view.mealFilter)}
    </div></section>
    ${S.tafsir && tafsirTid ? `<section class="panel"><div class="panel-h">Açıklama · ${esc(E.source(tafsirTid).name)}</div><div class="panel-b">
      <div class="tafsir ${view.tafsirOpen ? "" : "clamp"}">${esc(v.tafsir[tafsirTid])}</div>
      <div style="margin-top:8px"><button class="btn-light" data-act="tafsir">${view.tafsirOpen ? "Kısalt" : "Devamını oku"}</button></div></div></section>` : ""}
    <div class="actions">
      <button class="btn-go" data-act="save" data-i="${i}">${isSaved ? ICON.markOn : ICON.mark}${isSaved ? "Kayıtlı" : "Kaydet"}</button>
      <button class="btn-go btn-dark" data-act="share" data-i="${i}">${ICON.share}Paylaş</button>
      <a class="btn-go btn-dark" href="https://quranenc.com/tr/browse/${QURANENC[Object.keys(v.texts)[0]] || "turkish_rwwad"}/${v.surah}">${ICON.note}Not bildir</a>
    </div>
    ${credits([...mealsOn(), ...(S.tafsir ? E.tefsirs : [])])}
  </main>`;
}

function surahsView() {
  return `${topbar()}
  <section class="band"><div class="eyebrow">Mushaf sırası</div><h1>Sureler</h1></section>
  <main class="content">
    <section class="panel"><div class="panel-b search">
      <label for="sf" class="sr">Sure ara</label>
      <input id="sf" type="search" placeholder="Sure adı veya numarası" data-act="sfilter" autocomplete="off">
    </div>
    <div class="rows" id="slist">${E.surahs.map((s) => `<a class="row" data-name="${esc(fold2(s.name))} ${s.no}" href="#/sure/${s.no}"><span><b style="display:inline-block;width:34px;color:var(--band)">${s.no}</b>${esc(s.name)}</span><span class="meta">${s.count} ayet ›</span></a>`).join("")}</div>
    </section>
  </main>`;
}

function surahView(no) {
  const s = E.surahs[no - 1];
  if (!s) return `${topbar("Geri")}<div class="empty">Böyle bir sure yok.</div>`;
  const first = mealsOn()[0];
  const start = E.indexOf(no, 1);
  let rows = "";
  for (let k = 0; k < s.count; k++) {
    const v = E.verse(start + k, [first]);
    rows += `<a class="row" href="#/ayet/${no}/${v.ayah}" style="align-items:flex-start"><b style="flex:none;width:34px;color:var(--band)">${v.ayah}</b><span style="flex:1;font-size:15px;line-height:1.5">${esc(v.texts[first])}${v.footnotes[first] ? ` <span style="color:var(--ink-2)">[dipnot]</span>` : ""}</span></a>`;
  }
  return `${topbar("Sureler")}
  <section class="band"><div class="eyebrow">${no}. sure · ${s.count} ayet</div><h1>${esc(s.name)}</h1><div class="sub">${esc(E.source(first).name)} meali</div></section>
  <main class="content"><section class="panel"><div class="rows">${rows}</div></section>${credits([first])}</main>`;
}

function savedView() {
  const list = saved.map((i) => E.verse(i, mealsOn())).filter(Boolean);
  const first = mealsOn()[0];
  return `${topbar()}
  <section class="band"><div class="eyebrow">Senin listen</div><h1>Kaydedilenler</h1></section>
  <main class="content">${list.length ? `<section class="panel"><div class="rows">${list.map((v) => `<a class="row" href="#/ayet/${v.surah}/${v.ayah}" style="align-items:flex-start"><b style="flex:none;width:92px;color:var(--band);line-height:1.3">${esc(v.surahName)}<br>${v.surah}:${v.ayah}</b><span style="flex:1;font-size:14px;line-height:1.45">${esc(excerpt(v.texts[first]))}</span></a>`).join("")}</div></section>`
    : `<div class="empty">Henüz kaydedilmiş ayet yok.<br>Bir ayeti açıp “Kaydet”e dokunduğunda burada görünür.</div>`}</main>`;
}

function settingsView() {
  const row = (label, key, checked, extra = "") => `<label class="opt">${label}<input type="checkbox" data-act="opt" data-key="${key}" ${extra} ${checked ? "checked" : ""}></label>`;
  return `${topbar()}
  <section class="band"><div class="eyebrow">Ayarlar</div><h1>Kaynaklar ve görünüm</h1></section>
  <main class="content">
    <section class="panel"><div class="panel-h">Gösterilecek mealler</div><div>
      ${E.meals.map((t) => row(esc(E.source(t).name), "meal:" + t, S.meals.includes(t))).join("")}</div></section>
    <section class="panel"><div class="panel-h">Görünüm</div><div>
      ${row("Arapça metni göster", "arabic", S.arabic)}${row("Tefsir açıklamasını göster", "tafsir", S.tafsir)}</div></section>
    <section class="panel"><div class="panel-h">Kaynaklar</div>
      <table class="src"><thead><tr><th>Eser</th><th>Sürüm</th><th>Güncelleme</th></tr></thead><tbody>
      ${E.sources.map((s) => `<tr><td>${esc(s.name)}</td><td>${esc(s.version || "—")}</td><td>${s.updated ? esc(s.updated.split("-").reverse().join(".")) : "—"}</td></tr>`).join("")}
      </tbody></table>
      <div class="panel-b" style="font-size:13px;line-height:1.5;color:#3d382d;border-top:1px solid var(--panel-line)">
        Mealler ve tefsir <a href="https://quranenc.com">QuranEnc.com</a>'dan alınmıştır ve hiçbir değişiklik yapılmadan gösterilir.
        ${linkTanzil(E.core.meta.arabic_credit)}
      </div>
    </section>
    <a class="btn-go btn-dark" href="https://quranenc.com/tr/browse/turkish_rwwad">${ICON.note}Mealle ilgili not gönder</a>
    <div class="credits" style="text-align:center">Veri sürümü: ${esc(E.core.meta.built)}</div>
    <div class="made" style="font-style:normal;color:var(--muted)">Reklamsız ve ücretsiz · Sürüm ${VERSION}</div>
    <div class="made">${esc(MAKER)}</div>
  </main>`;
}

// ---------------------------------------------------------------------------
// yönlendirme
// ---------------------------------------------------------------------------
function route() {
  const h = location.hash.replace(/^#/, "") || "/";
  const [path, qs] = h.split("?");
  const p = new URLSearchParams(qs || "");
  const parts = path.split("/").filter(Boolean);
  let html = "", nav = "ara";
  if (parts[0] === "ara") {
    const q = (p.get("q") || "").trim();
    if (!q) { location.replace("#/"); return; }
    html = p.get("t") === "ozet" ? summaryView(q) : resultsView(q);
  } else if (parts[0] === "ayet") { html = verseView(Number(parts[1]), Number(parts[2])); }
  else if (parts[0] === "sureler") { html = surahsView(); nav = "sure"; }
  else if (parts[0] === "sure") { html = surahView(Number(parts[1])); nav = "sure"; }
  else if (parts[0] === "kaydedilenler") { html = savedView(); nav = "kayit"; }
  else if (parts[0] === "ayarlar") { html = settingsView(); nav = "ayar"; }
  else { html = homeView(); }
  if (!html) return;
  $app.innerHTML = html;
  renderNav(nav);
  window.scrollTo(0, 0);
}

let lastHash = "";
window.addEventListener("hashchange", () => {
  // Ayet değişince açılır panel durumunu sıfırla
  const base = (h) => h.split("?")[0];
  if (base(location.hash) !== base(lastHash)) { view.tafsirOpen = false; view.mealFilter = "all"; }
  lastHash = location.hash;
  route();
});

// ---------------------------------------------------------------------------
// olaylar
// ---------------------------------------------------------------------------
document.addEventListener("submit", (e) => {
  if (e.target.dataset.act === "search") {
    e.preventDefault();
    const q = new FormData(e.target).get("q").trim();
    if (q) location.hash = `#/ara?q=${enc(q)}`;
  }
});

document.addEventListener("click", async (e) => {
  const replaceLink = e.target.closest("a[data-replace]");
  if (replaceLink) { e.preventDefault(); location.replace(replaceLink.getAttribute("href")); return; }
  const el = e.target.closest("[data-act]");
  if (!el || el.tagName === "INPUT" || el.tagName === "FORM") return;
  const act = el.dataset.act;
  if (act === "back") { if (history.length > 1) history.back(); else location.hash = "#/"; }
  else if (act === "tafsir") { view.tafsirOpen = !view.tafsirOpen; route(); }
  else if (act === "filter") { view.mealFilter = el.dataset.id; route(); }
  else if (act === "save") {
    const i = Number(el.dataset.i);
    saved = saved.includes(i) ? saved.filter((x) => x !== i) : [i, ...saved];
    await store.set("saved", saved);
    toast(saved.includes(i) ? "Kaydedildi" : "Kayıttan çıkarıldı");
    route();
  } else if (act === "share") {
    const v = E.verse(Number(el.dataset.i), mealsOn());
    const t = view.mealFilter !== "all" ? view.mealFilter : Object.keys(v.texts)[0];
    const text = `${v.title}\n\n${v.texts[t]}\n— ${E.source(t).name} meali (QuranEnc.com)\n\n${APP_NAME}`;
    const Share = window.Capacitor?.Plugins?.Share;
    try {
      if (Share) await Share.share({ title: v.title, text });
      else if (navigator.share) await navigator.share({ title: v.title, text });
      else { await navigator.clipboard.writeText(text); toast("Panoya kopyalandı"); }
    } catch { /* kullanıcı vazgeçti */ }
  }
});

document.addEventListener("change", async (e) => {
  const el = e.target;
  if (el.dataset.act !== "opt") return;
  const key = el.dataset.key;
  if (key.startsWith("meal:")) {
    const t = key.slice(5);
    const next = el.checked ? E.meals.filter((m) => m === t || S.meals.includes(m)) : S.meals.filter((m) => m !== t);
    if (!next.length) { el.checked = true; toast("En az bir meal seçili olmalı"); return; }
    S.meals = next;
  } else { S[key] = el.checked; }
  await store.set("settings", S);
});

document.addEventListener("input", (e) => {
  if (e.target.dataset.act !== "sfilter") return;
  const f = fold2(e.target.value.trim());
  for (const a of document.querySelectorAll("#slist .row")) a.style.display = !f || a.dataset.name.includes(f) ? "" : "none";
});

// ---------------------------------------------------------------------------
// başlat
// ---------------------------------------------------------------------------
async function boot() {
  const [core, index] = await Promise.all([
    fetch("data/core.json").then((r) => r.json()),
    fetch("data/index.json").then((r) => r.json()),
  ]);
  E = new Engine(core, index);
  S = { ...S, ...(await store.get("settings", {})) };
  if (!Array.isArray(S.meals) || !S.meals.some((t) => E.meals.includes(t))) S.meals = [...E.meals];
  saved = await store.get("saved", []);
  document.title = APP_NAME;
  lastHash = location.hash;
  route();
}

boot().catch((err) => {
  $app.innerHTML = `<div class="empty">Veriler yüklenemedi.<br>${esc(err.message)}</div>`;
});
