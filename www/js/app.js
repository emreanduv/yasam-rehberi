// Yaşam Rehberi — uygulama ekranları
import { Engine, highlightSpans } from "./engine.js";
import { queryTerms } from "./text.js";
import * as K from "./kible.js";
import * as V from "./vakit.js";
import * as B from "./bildirim.js";
import * as M from "./miras.js";
import { initCarsi, carsiRoute } from "./carsi.js";

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
  compass: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/></svg>',
  mosque: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3c-3 2.5-5 4.5-5 7h10c0-2.5-2-4.5-5-7z"/><path d="M5 21V12h14v9M3 21h18M10 21v-4a2 2 0 0 1 4 0v4"/></svg>',
  scale: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v18M7 21h10M5 7h14M5 7l-3 6a3 3 0 0 0 6 0zM19 7l-3 6a3 3 0 0 0 6 0z"/></svg>',
  gear: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/></svg>',
  share: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12M7 8l5-5 5 5M5 14v6h14v-6"/></svg>',
  note: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5h16v11H8l-4 4z"/></svg>',
  beads: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="4" r="1.6"/><circle cx="17.5" cy="6.5" r="1.6"/><circle cx="19.5" cy="12" r="1.6"/><circle cx="17.5" cy="17.5" r="1.6"/><circle cx="6.5" cy="6.5" r="1.6"/><circle cx="4.5" cy="12" r="1.6"/><circle cx="6.5" cy="17.5" r="1.6"/><path d="M12 19v3M10.5 22h3"/></svg>',
  clock: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  bag: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 8h14l-1 12H6z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>',
  grid: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="4" width="6.5" height="6.5" rx="1"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1"/></svg>',
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

// Ana sayfa dışındaki her ekranda sol üstte geri düğmesi olur (sekmeler değişse de geçerli kalsın diye)
// Alt menüdeki bölümlerin kendisi "ana sayfa" sayılır (Geri düğmesi yerine uygulama adı)
const anaSayfa = () => !location.hash || /^#\/?(sor|sureler|kible|namaz|tesbih|saat|carsi|miras)?$/.test(location.hash);
function topbar(left = "brand") {
  if (left === "brand" && !anaSayfa()) left = "Geri";
  const l = left === "brand"
    ? `<span class="brand">${esc(APP_NAME)}</span>`
    : `<button class="back" data-act="back">${ICON.back}${esc(left)}</button>`;
  return `<header class="topbar"><div class="topbar-in">${l}<span class="tb-r"><span class="badge">Mr. Anduv!</span><a class="tb-gear" href="#/ayarlar" aria-label="Ayarlar">${ICON.gear}</a></span></div></header>`;
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
  // Tek menü: her bölüm burada, sırayla
  $nav.innerHTML = item("bugun", "#/", ICON.mosque, "Bugün") + item("ara", "#/sor", ICON.search, "Sor")
    + item("sure", "#/sureler", ICON.book, "Sureler") + item("tesbih", "#/tesbih", ICON.beads, "Tesbih") + item("saat", "#/saat", ICON.clock, "Saat")
    + item("carsi", "#/carsi", ICON.bag, "Çarşı") + item("miras", "#/miras", ICON.scale, "Miras");
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
    <a class="panel bg-kayit" href="#/kaydedilenler"><span>${ICON.mark}<b>Kayıtlı ayetler</b></span><span class="meta">${saved.length ? `<span class="count">${saved.length}</span> ` : ""}›</span></a>
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

// ---------------------------------------------------------------------------
// Bugün: açılış ekranı. Al Fajr sadeliği (tek bakışta sıradaki vakit ve geri sayım), FM2010 panelleri.
// ---------------------------------------------------------------------------
const ZIKIR_AD = { subhan: "Sübhânallah", hamd: "Elhamdülillah", ekber: "Allâhu Ekber", tevhid: "Lâ ilâhe illallah", istigfar: "Estağfirullah", salavat: "Salavat" };
const ZIKIR_HEDEF = { subhan: 33, hamd: 33, ekber: 34, tevhid: 100, istigfar: 100, salavat: 100 };

function tesbihDurum() {
  try {
    const t = JSON.parse(window.YR.oku("mrAnduvTesbih.v1") || "{}");
    const cur = t.cur || "subhan";
    const ozel = (t.custom || []).find((c) => c.id === cur);
    const ad = ZIKIR_AD[cur] || ozel?.tr || ozel?.ad || "Zikir";
    const n = (t.counts || {})[cur] || 0;
    const h = (t.targets || {})[cur] ?? ZIKIR_HEDEF[cur] ?? ozel?.t ?? 0;
    return { ad, n, h };
  } catch { return { ad: "Sübhânallah", n: 0, h: 33 }; }
}

// Kıble pusulası paneli (Bugün ekranında)
function kiblePanel(pos) {
  return `<section class="panel kb" id="kible">
      <div class="panel-h" id="kb-h">Kıble pusulası</div>
      <div class="panel-b kb-b">
        <div class="kb-wrap">${compassSvg()}</div>
        <div class="kb-big" id="kb-big">${pos ? `${Math.round(K.qiblaBearing(pos.lat, pos.lon))}°` : "—"}</div>
        <div class="kb-msg" id="kb-msg">${pos ? kibleMetin(pos) : "Kıble yönü için konum ve pusula gerekir."}</div>
        <button class="btn-go" id="kb-start" data-act="kible">${ICON.compass}Pusulayı aç</button>
        <div class="kb-ipucu">Telefonu düz tut; metal eşya ve mıknatıslı kılıftan uzak dur. Ok kayıyorsa telefonla havada birkaç kez “8” çiz.
          <a href="#/ayet/2/144">Kur'an'da kıble · Bakara 2:144 ›</a></div>
      </div>
    </section>`;
}

function bugunView() {
  const pos = S.konum;
  const now = new Date();
  const h = V.hicri(now);
  const tarih = now.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric", weekday: "long" });
  const tz = tesbihDurum();
  let ust;
  if (!pos) {
    ust = `<section class="panel bg-next"><div class="bg-next-h">Sıradaki vakit</div>
      <div class="panel-b nz-empty"><div>Vakitleri ve geri sayımı görmek için bulunduğun yeri seç. Konum yalnızca bu telefonda kullanılır.</div>
      <button class="btn-go" data-act="konum">${ICON.compass}Konumumu kullan</button><div class="kb-msg" id="nz-msg"></div></div></section>`;
  } else {
    const t = V.times(pos.lat, pos.lon, now);
    const nx = V.nextVakit(pos.lat, pos.lon, now);
    const yarin = nx.at.toDateString() !== now.toDateString();
    const rows = V.VAKITLER.map((v) => {
      const on = !yarin && nx.key === v.key;
      const past = t[v.key] <= now;
      return `<div class="bg-row${on ? " on" : ""}${past && !on ? " past" : ""}"><span>${esc(v.ad)}</span><b>${V.hhmm(t[v.key])}</b></div>`;
    }).join("");
    ust = `<section class="panel bg-next"><div class="bg-next-h">Sıradaki vakit${yarin ? " · yarın" : ""}</div>
      <a class="bg-next-b" href="#/namaz">
        <span><span class="bg-ad">${esc(nx.ad)}</span><span class="bg-at">${V.hhmm(nx.at)}'de</span></span>
        <span class="bg-kalan"><span class="bg-kalan-l">Kalan</span><span class="bg-sayac" id="nz-count">${V.sayac(nx.at - now)}</span></span>
      </a></section>
    <section class="panel"><div class="panel-h"><span>Vakitler</span><span>Bugün</span></div><div>${rows}</div>
      <div class="panel-b nz-foot">Diyanet yöntemiyle telefonda hesaplanır; resmî takvimle 1–2 dakika fark olabilir. <a href="#" data-act="konum">Konumu güncelle</a></div></section>`;
  }
  const day = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 864e5);
  const [ds, da] = DAILY[day % DAILY.length].split(":").map(Number);
  const dv = E.verse(E.indexOf(ds, da), mealsOn());
  const fm = Object.keys(dv.texts)[0];
  return `${topbar()}
  <section class="bg-band">
    <div class="bg-tarih"><span>${esc(tarih)}</span>${h ? `<span>${h.gun} ${esc(h.ayAdi)} ${h.yil}</span>` : ""}</div>
  </section>
  <main class="content">
    ${ramazanPanel(pos)}
    ${ust}
    ${pos ? kiblePanel(pos) : ""}
    <section class="panel">
      <div class="panel-h">Gelen kutusu <span class="count">1</span></div>
      <a class="panel-b bg-ayet" href="#/ayet/${ds}/${da}">
        <span class="bg-ayet-c"></span>
        <span style="min-width:0"><b class="bg-ayet-t">Günün ayeti · ${esc(dv.title)}</b>
        <span class="bg-ayet-m">${esc(dv.texts[fm])}</span>
        <span class="bg-ayet-k">${esc(E.source(fm).credit)}</span></span>
      </a>
    </section>
    <a class="bg-devam" href="#/tesbih"><span class="bg-devam-z">Son zikir · ${esc(tz.ad)}</span>
      <span class="btn-go bg-devam-b">DEVAM ${tz.h ? `${tz.n}/${tz.h}` : tz.n} ${ICON.next}</span></a>
    ${pos ? bildirimPanel(pos) : ""}
    <div class="note">Konumun yalnızca bu telefonda saklanır ve vakit ile kıble hesabı için kullanılır; hiçbir yere gönderilmez. Bildirimler telefonun kendisine kurulur.</div>
    <div class="made">${esc(MAKER)}</div>
  </main>`;
}

// (eski) Arama ekranının tepesindeki küçük vakit özeti — Bugün ekranı onun yerini aldı
function vakitOzet() {
  const pos = S.konum;
  if (!pos) return `<a class="panel nz-ozet-bos" href="#/namaz"><span>Namaz vakitleri ve geri sayım için konumunu seç</span>${ICON.next}</a>`;
  const now = new Date();
  const nx = V.nextVakit(pos.lat, pos.lon, now);
  return `<a class="panel nz-ozet" href="#/namaz" aria-label="Sıradaki vakit ${esc(nx.ad)} ${V.hhmm(nx.at)}, namaz ekranını aç">
    <div class="nz-next"><div class="eyebrow-d">Sıradaki vakit · ${esc(nx.ad)} ${V.hhmm(nx.at)}</div><div class="nz-count" id="nz-count">${V.sayac(nx.at - now)}</div></div></a>`;
}

// Geri sayımı saniye saniye yürüt (ana ekran ve Namaz ekranı)
function sayacBaslat() {
  kible.tick = setInterval(() => {
    const el = document.getElementById("nz-count");
    if (!el || !S.konum) return;
    const now = new Date();
    const nx = V.nextVakit(S.konum.lat, S.konum.lon, now);
    if (nx.at - now < 1000) { route(); return; }  // vakit girdi: tabloyu yenile
    el.textContent = V.sayac(nx.at - now);
    const r = document.getElementById("nz-ram");
    if (r && now.getSeconds() === 0) { const m = r.closest(".nz-ram").querySelector(".eyebrow-d").textContent.match(/(\d\d:\d\d)/); if (m) { const [hh, mm] = m[1].split(":").map(Number); const at = new Date(now); at.setHours(hh, mm, 0, 0); if (at < now) at.setDate(at.getDate() + 1); r.textContent = V.kalan(at - now); } }
  }, 1000);
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
    if (c.key === "miras" || c.key === "vasiyet") html += `<p><a class="btn-go" href="#/miras">${ICON.scale}Miras hesapla: kime ne düşer?</a></p>`;
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
  return `${topbar("Geri")}
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
// Namaz: vakitler, bildirimler, kıble
// ---------------------------------------------------------------------------
const VAKIT_VARSAYILAN = { on: false, keys: { imsak: true, gunes: false, ogle: true, ikindi: true, aksam: true, yatsi: true }, once: 0, sahur: true };
const kible = { stop: null, heading: null, gotEvent: false, timer: null, tick: null, decl: 0 };
const ayarVakit = () => ({ ...VAKIT_VARSAYILAN, ...(S.vakit || {}), keys: { ...VAKIT_VARSAYILAN.keys, ...((S.vakit || {}).keys || {}) } });

function compassSvg() {
  const ticks = Array.from({ length: 72 }, (_, i) => {
    const big = i % 18 === 0, mid = i % 6 === 0;
    return `<line x1="130" y1="${big ? 14 : mid ? 18 : 22}" x2="130" y2="28" transform="rotate(${i * 5} 130 130)" stroke="${big ? "#1f2328" : "#9c9077"}" stroke-width="${big ? 3 : mid ? 2 : 1}"/>`;
  }).join("");
  const lbl = [["K", 0], ["D", 90], ["G", 180], ["B", 270]].map(([t, a]) =>
    `<text x="130" y="48" text-anchor="middle" font-family="PT Sans Narrow, PT Sans, sans-serif" font-weight="700" font-size="18" fill="${t === "K" ? "#b23b2a" : "#2f3e4c"}" transform="rotate(${a} 130 130)">${t}</text>`).join("");
  return `<svg viewBox="0 0 260 260" class="kb-dial" aria-hidden="true">
    <circle cx="130" cy="130" r="124" fill="#fffdf6" stroke="#c8bc9a" stroke-width="2"/>
    <g id="kb-rose">${ticks}${lbl}</g>
    <g id="kb-arrow" style="opacity:0">
      <path d="M130 30 L146 120 L130 110 L114 120 Z" fill="#1d4d36"/>
      <path d="M130 230 L142 140 L130 150 L118 140 Z" fill="#c8bc9a"/>
      <rect x="119" y="10" width="22" height="22" rx="2" fill="#14171a" stroke="#c9a227" stroke-width="2"/>
      <rect x="119" y="16" width="22" height="3" fill="#c9a227"/>
    </g>
    <circle cx="130" cy="130" r="7" fill="#c9a227" stroke="#14171a" stroke-width="2"/>
    <path d="M130 2 L136 14 L124 14 Z" fill="#c9a227"/>
  </svg>`;
}

function vakitPanel(pos) {
  if (!pos) {
    return `<section class="panel"><div class="panel-h">Bugünün vakitleri</div><div class="panel-b nz-empty">
      <div>Vakitleri hesaplamak için bulunduğun yeri bilmemiz gerekiyor. Konum yalnızca bu telefonda kullanılır.</div>
      <button class="btn-go" data-act="konum">${ICON.compass}Konumumu kullan</button>
      <div class="kb-msg" id="nz-msg"></div></div></section>`;
  }
  const now = new Date();
  const t = V.times(pos.lat, pos.lon, now);
  const nx = V.nextVakit(pos.lat, pos.lon, now);
  const h = V.hicri(now);
  const rows = V.VAKITLER.map((v) => {
    const on = nx.key === v.key && nx.at.toDateString() === now.toDateString();
    const past = t[v.key] <= now;
    return `<div class="row nz-row${on ? " on" : ""}${past ? " past" : ""}"><span>${esc(v.ad)}</span><b>${V.hhmm(t[v.key])}</b></div>`;
  }).join("");
  const dateStr = now.toLocaleDateString("tr-TR", { day: "numeric", month: "long", weekday: "long" });
  return `<section class="panel"><div class="panel-h">Bugünün vakitleri<span class="nz-date">${esc(dateStr)}${h ? ` · ${h.gun} ${h.ayAdi} ${h.yil}` : ""}</span></div>
    <div class="nz-next"><div class="eyebrow-d">Sıradaki · ${esc(nx.ad)} ${V.hhmm(nx.at)}</div><div class="nz-count" id="nz-count">${V.sayac(nx.at - now)}</div></div>
    <div class="rows">${rows}</div>
    <div class="panel-b nz-foot">Konum: ${pos.lat.toFixed(2)}, ${pos.lon.toFixed(2)} · <a href="#" data-act="konum">Konumu güncelle</a><br>
    Vakitler telefonda Diyanet yöntemiyle hesaplanır; resmî takvimle 1–2 dakikalık fark olabilir.</div></section>`;
}

function ramazanPanel(pos) {
  if (!pos) return "";
  const now = new Date();
  const h = V.hicri(now);
  if (!h?.ramazan) return "";
  const t = V.times(pos.lat, pos.lon, now);
  let label, at;
  if (now < t.imsak) { label = "Sahura (imsak)"; at = t.imsak; }
  else if (now < t.aksam) { label = "İftara"; at = t.aksam; }
  else { const tom = new Date(now); tom.setDate(tom.getDate() + 1); label = "Yarın imsak"; at = V.times(pos.lat, pos.lon, tom).imsak; }
  return `<section class="panel nz-ram"><div class="panel-h">Ramazan · ${h.gun}. gün</div>
    <div class="nz-next"><div class="eyebrow-d">${label} · ${V.hhmm(at)}</div><div class="nz-count" id="nz-ram">${V.kalan(at - now)}</div></div>
    <div class="rows"><div class="row nz-row"><span>İmsak (sahur sonu)</span><b>${V.hhmm(t.imsak)}</b></div>
    <div class="row nz-row"><span>İftar (akşam)</span><b>${V.hhmm(t.aksam)}</b></div></div></section>`;
}

function bildirimPanel(pos) {
  const a = ayarVakit();
  if (!B.destekli()) {
    return `<section class="panel"><div class="panel-h">Vakit bildirimleri</div><div class="panel-b" style="font-size:14px">Bildirimler telefondaki uygulamada çalışır.</div></section>`;
  }
  const row = (label, key, checked, dis) => `<label class="opt"><span>${label}</span><input type="checkbox" data-act="vopt" data-key="${key}" ${checked ? "checked" : ""} ${dis ? "disabled" : ""}></label>`;
  const onceSel = `<label class="opt"><span>Ne zaman haber verilsin?</span>
    <select data-act="vonce" class="nz-sel" ${a.on ? "" : "disabled"}>${[[0, "Vakit girince"], [5, "5 dk önce"], [10, "10 dk önce"], [15, "15 dk önce"], [30, "30 dk önce"]]
      .map(([m, l]) => `<option value="${m}" ${a.once === m ? "selected" : ""}>${l}</option>`).join("")}</select></label>`;
  return `<section class="panel"><div class="panel-h">Vakit bildirimleri</div><div>
    ${row("<b>Bildirimleri aç</b>", "on", a.on, !pos)}
    ${V.VAKITLER.map((v) => row(`${v.ad}${v.key === "aksam" ? " <small>(Ramazan'da iftar)</small>" : v.key === "gunes" ? " <small>(doğuş)</small>" : ""}`, "k:" + v.key, a.keys[v.key], !a.on)).join("")}
    ${row("Ramazan'da sahur hatırlatması <small>(imsaktan 45 dk önce)</small>", "sahur", a.sahur, !a.on)}
    ${onceSel}
    </div>
    <div class="panel-b nz-foot" id="nz-bstat">${!pos ? "Bildirimler için önce konumu kullan." : a.on ? "Kuruluyor…" : "Kapalı."}</div>
    <div class="panel-b" style="padding-top:0"><button class="btn-light" data-act="vdeneme">Deneme bildirimi gönder</button></div>
  </section>`;
}

// Gerçek kuzeye göre açı + pusulada (manyetik) okunacak açı; Diyanet'in "kıble açısı" ikincisidir
function kibleMetin(pos) {
  const q = K.qiblaBearing(pos.lat, pos.lon);
  const m = (q - K.trueNorthOffset(pos.lat, pos.lon) + 360) % 360;
  return `Kıble, gerçek kuzeyden ${Math.round(q)}° (${K.yonAdi(q)}); pusulada ${Math.round(m)}° · Kâbe'ye ${Math.round(K.distanceKm(pos.lat, pos.lon)).toLocaleString("tr-TR")} km`;
}

// ---------------------------------------------------------------------------
// Menü: alt çubuğa sığmayan bölümler
// ---------------------------------------------------------------------------
function menuView() {
  const row = (href, icon, title, hint, meta = "") => `<a class="row mn-row" href="${href}"><span class="mn-l"><span class="mn-ic">${icon}</span><span><b>${esc(title)}</b><br><span class="mn-hint">${esc(hint)}</span></span></span><span class="meta">${meta}›</span></a>`;
  return `${topbar()}
  <section class="band"><div class="eyebrow">Menü</div><h1>Rehberin tamamı</h1><div class="sub">Hepsi telefonda çalışır, internet gerekmez</div></section>
  <main class="content">
    <section class="panel"><div class="panel-h">Günlük</div><div class="rows">
      ${row("#/saat", ICON.clock, "Saat", "Kadranlar, kadran atölyesi, hatırlatıcılar, zamanlayıcı")}
      ${row("#/carsi", ICON.bag, "Çarşı", "Reyon reyon markalar, kaynaklı künye, barkod, listem")}
      ${row("#/miras", ICON.scale, "Miras", "Feraiz ve Türk Medeni Kanunu'na göre paylaşım hesabı")}
    </div></section>
    <section class="panel"><div class="panel-h">Senin</div><div class="rows">
      ${row("#/kaydedilenler", ICON.mark, "Kayıtlı ayetler", "Kaydettiğin ayetler", saved.length ? `<span class="count">${saved.length}</span> ` : "")}
      ${row("#/ayarlar", ICON.gear, "Ayarlar", "Mealler, Arapça metin, tefsir")}
    </div></section>
    <div class="made">${esc(MAKER)}</div>
  </main>`;
}

const MODULLER = { tesbih: "Tesbih", saat: "Saat" };
function modulView(ad) {
  return `${topbar()}<iframe class="modul" src="moduller/${ad}.html" title="${esc(MODULLER[ad])}"></iframe>`;
}

// ---------------------------------------------------------------------------
// Modül köprüsü: moduller/*.html aynı kökenden window.parent.YR'yi kullanır.
// Konum, vakit ve kıble uygulamanın kendi (Diyanet'le doğrulanmış) hesabından gelir;
// modül verisi telefonun kalıcı deposunda (Preferences) tutulur.
// ---------------------------------------------------------------------------
const MOD_KEYS = ["mrAnduvTesbih.v1", "vakit-v1"];
const modVeri = {};
const modYazT = {};
const SAAT_BASE = 2000, SAAT_MAX = 20, TESBIH_BASE = 3000, TESBIH_MAX = 6;

async function saatBildirimKur() {
  if (!B.destekli()) return;
  const now = Date.now() + 5000;
  const list = (S.saatPlan || []).filter((n) => n.at > now).slice(0, SAAT_MAX)
    .map((n, i) => ({ id: SAAT_BASE + i, at: new Date(n.at), title: String(n.title).slice(0, 80), body: String(n.body || "").slice(0, 160) }));
  if (!list.length) { await B.iptal(SAAT_BASE); return; }
  if (!(await B.izinIste())) return;
  await B.kur(list, SAAT_BASE);
}

const TESBIH_VAKIT = [["imsak", "Sabah"], ["ogle", "Öğle"], ["ikindi", "İkindi"], ["aksam", "Akşam"], ["yatsi", "Yatsı"]];
async function tesbihBildirimKur() {
  if (!B.destekli()) return;
  const t = S.tesbihHatir;
  if (!t || !t.on || !S.konum) { await B.iptal(TESBIH_BASE); return; }
  const now = new Date(), out = [];
  for (let g = 0; g < 3 && out.length < TESBIH_MAX; g++) {
    const d = new Date(now); d.setDate(d.getDate() + g);
    const tt = V.times(S.konum.lat, S.konum.lon, d);
    TESBIH_VAKIT.forEach(([k, ad], i) => {
      const at = new Date(tt[k].getTime() + (t.after || 20) * 60000);
      if (at > now && out.length < TESBIH_MAX) out.push({ id: TESBIH_BASE + g * 10 + i, at, title: `${ad} namazı sonrası tesbihat`, body: "Sübhânallah, Elhamdülillah, Allâhu Ekber · 33'er kez" });
    });
  }
  if (!(await B.izinIste())) return;
  await B.kur(out, TESBIH_BASE);
}

window.YR = {
  oku: (k) => modVeri[k] ?? null,
  yaz: (k, v) => {
    if (!MOD_KEYS.includes(k)) return;
    modVeri[k] = v;
    clearTimeout(modYazT[k]);
    modYazT[k] = setTimeout(() => store.set("mod:" + k, v), 400);
  },
  konum: () => (S.konum ? { lat: S.konum.lat, lon: S.konum.lon, ad: "Bulunduğun yer" } : null),
  vakit: (d) => (S.konum ? V.times(S.konum.lat, S.konum.lon, d || new Date()) : null),
  git: (h) => { location.hash = h; },
  saatPlan: async (list) => {
    S.saatPlan = (Array.isArray(list) ? list : []).filter((n) => n && n.at && n.title).slice(0, SAAT_MAX)
      .map((n) => ({ at: Number(n.at), title: String(n.title), body: String(n.body || "") }));
    await store.set("settings", S);
    saatBildirimKur().catch(() => {});
  },
  tesbihAyar: async (on, after) => {
    const yeni = { on: !!on, after: Math.max(5, Math.min(60, Number(after) || 20)) };
    if (JSON.stringify(yeni) === JSON.stringify(S.tesbihHatir || { on: false, after: 20 })) return true;
    if (yeni.on && B.destekli() && !(await B.izinIste())) return false;
    S.tesbihHatir = yeni;
    await store.set("settings", S);
    tesbihBildirimKur().catch(() => {});
    return true;
  },
};

function namazView() {
  const pos = S.konum || null;
  const v = E.verse(E.indexOf(2, 144), mealsOn());
  const t = Object.keys(v.texts)[0];
  return `${topbar()}
  <section class="band">
    <div class="eyebrow">Namaz</div>
    <h1>Vakitler ve kıble</h1>
    <div class="sub">Bulunduğun yere göre · internetsiz</div>
  </section>
  <main class="content">
    ${ramazanPanel(pos)}
    ${vakitPanel(pos)}
    <section class="panel kb">
      <div class="panel-h" id="kb-h">Kıble pusulası</div>
      <div class="panel-b kb-b">
        <div class="kb-wrap">${compassSvg()}</div>
        <div class="kb-big" id="kb-big">${pos ? `${Math.round(K.qiblaBearing(pos.lat, pos.lon))}°` : "—"}</div>
        <div class="kb-msg" id="kb-msg">${pos ? kibleMetin(pos) : "Kıble yönü için konum ve pusula gerekir."}</div>
        <button class="btn-go" id="kb-start" data-act="kible">${ICON.compass}Pusulayı aç</button>
      </div>
    </section>
    ${bildirimPanel(pos)}
    <section class="panel"><div class="panel-h">Doğru ölçmek için</div><div class="panel-b" style="font-size:14px;line-height:1.55">
      • Telefonu yere paralel, düz tut.<br>
      • Metal eşya, mıknatıslı kılıf ve hoparlörden uzak dur.<br>
      • Ok titriyor ya da kayıyorsa telefonu havada birkaç kez “8” çizerek kalibre et.
    </div></section>
    <section class="panel"><div class="panel-h">Kur'an'da kıble · Bakara 2:144</div><div class="panel-b">
      <div style="font-size:15px;line-height:1.55">${esc(v.texts[t])}</div>
      <div class="credits" style="color:var(--ink-2);margin-top:6px">${esc(E.source(t).credit)} · <a href="#/ayet/2/144">Ayeti aç ›</a></div>
    </div></section>
    <div class="note">Konumun yalnızca bu telefonda saklanır ve vakit ile kıble hesabı için kullanılır; hiçbir yere gönderilmez. Bildirimler telefonun kendisine kurulur.</div>
  </main>`;
}

function namazMount() {
  const pos = S.konum;
  if (pos) kibleRender(true);
  bildirimDurum();
  sayacBaslat();
}

function kibleStop() {
  if (kible.stop) { kible.stop(); kible.stop = null; }
  clearTimeout(kible.timer);
  clearInterval(kible.tick);
}

function kibleRender(statik = false) {
  const $ = (id) => document.getElementById(id);
  if (!$("kb-big") || !S.konum) return;
  const q = K.qiblaBearing(S.konum.lat, S.konum.lon);
  const arrow = $("kb-arrow"), rose = $("kb-rose");
  if (statik || kible.heading == null) {
    rose.setAttribute("transform", "rotate(0 130 130)");
    arrow.setAttribute("transform", `rotate(${q.toFixed(1)} 130 130)`);
    arrow.style.opacity = statik ? ".55" : "1";
    return;
  }
  const diff = ((q - kible.heading + 540) % 360) - 180;
  rose.setAttribute("transform", `rotate(${(-kible.heading).toFixed(1)} 130 130)`);
  arrow.setAttribute("transform", `rotate(${diff.toFixed(1)} 130 130)`);
  arrow.style.opacity = "1";
  const ok = Math.abs(diff) <= 5;
  $("kb-h").textContent = ok ? "Kıble yönündesin" : "Kıble pusulası";
  $("kb-h").classList.toggle("ok", ok);
  $("kb-big").textContent = ok ? "Kıble ✓" : `${Math.abs(Math.round(diff))}° ${diff > 0 ? "sağa" : "sola"} dön`;
  $("kb-msg").textContent = "Yeşil ok yukarıyı gösterdiğinde Kâbe yönündesin.";
}

async function konumAl(msgId) {
  const msg = (t) => { const el = document.getElementById(msgId); if (el) el.textContent = t; };
  msg("Konum alınıyor…");
  try {
    const p = await K.getPosition();
    S.konum = { lat: p.lat, lon: p.lon, t: Date.now() };
    await store.set("settings", S);
    return true;
  } catch (e) {
    msg(String(e.message).includes("izin")
      ? "Konum izni verilmedi. Telefonun Ayarlar → Yaşam Rehberi → Konum bölümünden “Uygulamayı kullanırken” seçip tekrar dene."
      : "Konum alınamadı. Konum servisleri açıkken tekrar dene.");
    return false;
  }
}

async function kibleStart() {
  const $ = (id) => document.getElementById(id);
  const btn = $("kb-start");
  btn.disabled = true;
  const compassOk = await K.requestCompassPermission();   // iOS: dokunma anında istenmeli
  if (!S.konum) {
    if (!(await konumAl("kb-msg"))) { btn.disabled = false; return; }
    route(); setTimeout(() => document.getElementById("kb-start")?.click(), 50); return;
  }
  kible.decl = K.trueNorthOffset(S.konum.lat, S.konum.lon);
  btn.style.display = "none";
  kible.heading = null; kible.gotEvent = false;
  $("kb-msg").textContent = "Pusula bekleniyor… telefonu düz tut.";
  if (kible.stop) kible.stop();
  // İzin sonucuna bakmadan dinle: izin yoksa zaten veri gelmez, 3 sn sonra yazılı yöne düşeriz
  kible.compassDenied = !compassOk;
  kible.stop = K.startCompass((magnetic) => {
    kible.gotEvent = true;
    kible.heading = (magnetic + kible.decl + 360) % 360;   // manyetik → gerçek kuzey
    kibleRender();
  });
  clearTimeout(kible.timer);
  kible.timer = setTimeout(() => {
    if (kible.gotEvent || !$("kb-msg")) return;
    const q = K.qiblaBearing(S.konum.lat, S.konum.lon);
    kibleRender(true);
    $("kb-msg").textContent = `${kible.compassDenied ? "Hareket/pusula izni verilmedi." : "Bu telefonda pusula verisi alınamadı."} ${kibleMetin(S.konum)}. Ok, kuzey yukarıdayken kıbleyi gösteriyor.`;
  }, 3000);
}

// Bildirimleri ayara ve konuma göre yeniden kur (açılışta, ayar ya da konum değişince)
async function bildirimKur() {
  const a = ayarVakit();
  if (!B.destekli()) return null;
  if (!a.on || !S.konum) { await B.iptal(); return 0; }
  const list = V.plan(S.konum.lat, S.konum.lon, a);
  await B.kur(list);
  return list;
}

async function bildirimDurum() {
  const el = document.getElementById("nz-bstat");
  if (!el) return;
  const a = ayarVakit();
  if (!B.destekli() || !S.konum || !a.on) return;
  try {
    const list = await bildirimKur();
    const son = V.sonGun(list);
    const exact = await B.tamZamanli();
    el.innerHTML = list.length
      ? `✓ ${list.length} bildirim kurulu · ${son.toLocaleDateString("tr-TR", { day: "numeric", month: "long" })} tarihine kadar. Uygulamayı açtıkça ileriye doğru yenilenir.`
        + (exact ? "" : `<br><b>Dakikası dakikasına bildirim için</b> <a href="#" data-act="vexact">alarm iznini aç ›</a>`)
      : "Seçili vakit yok.";
  } catch (e) { el.textContent = "Bildirimler kurulamadı: " + (e.message || e); }
}

// ---------------------------------------------------------------------------
// Miras
// ---------------------------------------------------------------------------
let mg = null;   // miras girdisi (cihazda saklanır)
const mirasGirdi = () => (mg ||= JSON.parse(JSON.stringify(M.BOS)));
const tl = (v) => v.toLocaleString("tr-TR", { maximumFractionDigits: 0 }) + " TL";

function stepper(key, val, max, label, alt = "") {
  return `<div class="mr-row"><span>${label}${alt ? ` <small>${alt}</small>` : ""}</span>
    <span class="stp"><button data-act="mr-step" data-k="${key}" data-d="-1" aria-label="${esc(label)} azalt" ${val <= 0 ? "disabled" : ""}>−</button><b>${val}</b><button data-act="mr-step" data-k="${key}" data-d="1" aria-label="${esc(label)} artır" ${val >= max ? "disabled" : ""}>+</button></span></div>`;
}
function toggle(key, val, label, alt = "") {
  return `<label class="mr-row"><span>${label}${alt ? ` <small>${alt}</small>` : ""}</span><input type="checkbox" data-act="mr-tog" data-k="${key}" ${val ? "checked" : ""}></label>`;
}

function sonucTablo(r, tutar, baslik, renk) {
  const rows = r.satirlar.map((x) => `<tr><td><b>${esc(x.ad)}</b>${x.kisi > 1 ? ` <small>(${x.kisi} kişi · kişi başı ${M.kesir(x.kisiBasi)})</small>` : ""}<div class="mr-day">${esc(x.dayanak)}</div></td>
    <td class="num">${M.kesir(x.pay)}</td><td class="num">%${M.yuzde(x.pay).toLocaleString("tr-TR", { maximumFractionDigits: 1 })}</td>
    ${tutar ? `<td class="num">${tl(tutar * x.pay.n / x.pay.d)}${x.kisi > 1 ? `<div class="mr-day">kişi başı ${tl(tutar * x.kisiBasi.n / x.kisiBasi.d)}</div>` : ""}</td>` : ""}</tr>`).join("");
  return `<section class="panel mr-sonuc"><div class="panel-h" style="background:${renk}">${baslik}</div>
    ${r.satirlar.length ? `<table class="mr-tab"><thead><tr><th>Mirasçı</th><th class="num">Pay</th><th class="num">Oran</th>${tutar ? '<th class="num">Tutar</th>' : ""}</tr></thead><tbody>${rows}</tbody></table>` : `<div class="panel-b">Mirasçı yok.</div>`}
    ${r.mahrum?.length ? `<div class="panel-b mr-not"><b>Pay almayanlar:</b> ${r.mahrum.map((m) => `${esc(m.ad)} (${esc(m.neden)})`).join("; ")}</div>` : ""}
    ${r.notlar.length ? `<div class="panel-b mr-not">${r.notlar.map((n) => `• ${esc(n)}`).join("<br>")}</div>` : ""}
  </section>`;
}

function mirasView() {
  const g = mirasGirdi();
  const kadin = g.olen === "kadin";
  const bos = !(g.es || g.ogul || g.kiz || g.olmus.length || g.anne || g.baba || g.dede || g.anneDede || g.babaAnne || g.anneAnne
    || g.tamE || g.tamK || g.babaE || g.babaK || g.anaE || g.anaK || g.uzakAsabe);
  const f = M.feraiz(g), t = M.tmk(g);
  const olmusRows = g.olmus.map((c, i) => `<div class="mr-olmus"><div class="mr-olmus-h">Vefat etmiş ${c.cins === "erkek" ? "oğlu" : "kızı"} ${i + 1}
      <button class="mr-x" data-act="mr-del" data-i="${i}" aria-label="Kaldır">×</button></div>
      ${stepper(`olmus.${i}.ogul`, c.ogul, 12, "Onun hayattaki oğulları")}${stepper(`olmus.${i}.kiz`, c.kiz, 12, "Onun hayattaki kızları")}</div>`).join("");
  const v = (s, a) => { const x = E.verse(E.indexOf(s, a), mealsOn()); return x; };
  const ayetler = [[4, 11], [4, 12], [4, 176]].map(([s, a]) => { const x = v(s, a); const t0 = Object.keys(x.texts)[0];
    return `<a class="row" href="#/ayet/${s}/${a}" style="align-items:flex-start"><span style="flex:none;width:58px;font-weight:700;color:var(--band)">${s}:${a}</span><span style="flex:1;font-size:14px;line-height:1.45">${esc(excerpt(x.texts[t0], 170))}</span></a>`; }).join("");
  return `${topbar()}
  <section class="band">
    <div class="eyebrow">Miras</div>
    <h1>Kime ne düşer?</h1>
    <div class="sub">Kur'an'a göre (feraiz) ve Türk Medeni Kanunu'na göre yan yana</div>
  </section>
  <main class="content" id="mr-main">
    <section class="panel"><div class="panel-h">1 · Vefat eden</div><div class="panel-b">
      <div class="seg" role="group" aria-label="Vefat edenin cinsiyeti">
        <button data-act="mr-olen" data-v="erkek" class="${!kadin ? "on" : ""}">Erkek</button>
        <button data-act="mr-olen" data-v="kadin" class="${kadin ? "on" : ""}">Kadın</button></div>
      <div class="mr-ipucu">Aşağıya yalnızca <b>vefat anında hayatta olan</b> yakınları girin.</div></div>
      ${kadin ? toggle("es", g.es > 0, "Kocası hayatta") : stepper("es", g.es, 4, "Hanımı", "(nikâhlı)")}
    </section>
    <section class="panel"><div class="panel-h">2 · Çocukları</div>
      ${stepper("ogul", g.ogul, 12, "Oğlu")}${stepper("kiz", g.kiz, 12, "Kızı")}
      ${olmusRows}
      <div class="panel-b mr-ekle"><button class="btn-light" data-act="mr-olmus" data-v="erkek">+ Ondan önce vefat etmiş oğlu</button>
      <button class="btn-light" data-act="mr-olmus" data-v="kadin">+ Ondan önce vefat etmiş kızı</button></div>
    </section>
    <section class="panel"><div class="panel-h">3 · Anne, baba, büyükler</div>
      ${toggle("anne", g.anne, "Annesi")}${toggle("baba", g.baba, "Babası")}
      ${toggle("dede", g.dede, "Babasının babası")}${toggle("babaAnne", g.babaAnne, "Babasının annesi")}
      ${toggle("anneDede", g.anneDede, "Annesinin babası")}${toggle("anneAnne", g.anneAnne, "Annesinin annesi")}
    </section>
    <section class="panel"><div class="panel-h">4 · Kardeşleri</div>
      ${stepper("tamE", g.tamE, 12, "Erkek kardeşi", "(ana-baba bir)")}${stepper("tamK", g.tamK, 12, "Kız kardeşi", "(ana-baba bir)")}
      ${stepper("babaE", g.babaE, 12, "Erkek kardeşi", "(yalnız baba bir)")}${stepper("babaK", g.babaK, 12, "Kız kardeşi", "(yalnız baba bir)")}
      ${stepper("anaE", g.anaE, 12, "Erkek kardeşi", "(yalnız ana bir)")}${stepper("anaK", g.anaK, 12, "Kız kardeşi", "(yalnız ana bir)")}
      ${toggle("uzakAsabe", g.uzakAsabe, "Amcası ya da erkek kardeşinin oğlu var", "(yukarıdakiler yoksa önemli)")}
    </section>
    <section class="panel"><div class="panel-h">5 · Miras tutarı <small style="text-transform:none;letter-spacing:0;font-weight:400">(isteğe bağlı)</small></div>
      <div class="panel-b"><input id="mr-tutar" class="mr-tutar" type="text" inputmode="numeric" placeholder="Örn. 3.000.000" value="${g.tutar ? g.tutar.toLocaleString("tr-TR") : ""}" data-act="mr-tutar" aria-label="Miras tutarı (TL)"></div>
    </section>
    <div id="mr-sonuc">${bos ? `<div class="note">Mirasçıları girdikçe sonuç burada belirir.</div>` : mirasSonuc(f, t, g.tutar || 0)}</div>
    <section class="panel"><div class="panel-h">Kur'an'da miras ayetleri</div><div class="rows">${ayetler}</div></section>
    <div class="note"><b>Bilgi amaçlıdır; fetva ya da hukuki görüş değildir.</b> Feraiz hesabı Hanefî mezhebine göre, Diyanet'in anlatımı esas alınarak yapılır. Türkiye'de tapu ve mahkemede Türk Medeni Kanunu uygulanır; Kur'an'daki paylara göre paylaşım ancak bütün mirasçıların rızasıyla yapılacak bir anlaşmayla mümkündür. Vasiyet, borç ve cenaze giderleri önce düşülür.</div>
  </main>`;
}

function mirasSonuc(f, t, tutar) {
  return `${sonucTablo(f, tutar, "Kur'an'a göre (feraiz · Hanefî)", "var(--band)")}
    ${sonucTablo(t, tutar, "Türk Medeni Kanunu'na göre", "var(--head)")}
    <section class="panel"><div class="panel-h">Resmî görüş için</div><div class="panel-b ans-btns">
      <a class="btn-go" href="${DIYANET_ARA}${enc("miras")}">${ICON.note}Diyanet'te ara: “miras”</a>
      <a class="btn-light" href="tel:190">ALO 190 Fetva Hattı</a>
      <div class="mr-ipucu" style="width:100%">Medeni Kanun'a göre paylaşım ve tapu işlemleri için noter ya da avukata danışın.</div></div></section>`;
}

async function mirasDegisti(rerender = true) {
  await store.set("miras", mg);
  if (!rerender) return;
  const y = window.scrollY;
  $app.innerHTML = mirasView();
  window.scrollTo(0, y);
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
  if (parts[0] === "sor") { html = homeView(); }
  if (parts[0] === "ara") {
    const q = (p.get("q") || "").trim();
    if (!q) { location.replace("#/sor"); return; }
    html = p.get("t") === "ozet" ? summaryView(q) : resultsView(q);
  } else if (html) { /* sor */ }
  else if (parts[0] === "ayet") { html = verseView(Number(parts[1]), Number(parts[2])); }
  else if (parts[0] === "sureler") { html = surahsView(); nav = "sure"; }
  else if (parts[0] === "sure") { html = surahView(Number(parts[1])); nav = "sure"; }
  else if (parts[0] === "kaydedilenler") { html = savedView(); nav = "ara"; }
  else if (parts[0] === "menu") { location.replace("#/"); return; }
  else if (parts[0] === "tesbih" || parts[0] === "saat") { html = modulView(parts[0]); nav = parts[0]; }
  else if (parts[0] === "carsi") { html = carsiRoute(parts); nav = "carsi"; if (!html) { location.replace("#/carsi"); return; } }
  else if (parts[0] === "ayarlar") { html = settingsView(); nav = "ayar"; }
  else if (parts[0] === "namaz" || parts[0] === "kible") { html = bugunView(); nav = "bugun"; }
  else if (parts[0] === "miras") { html = mirasView(); nav = "miras"; }
  else if (!html) { html = bugunView(); nav = "bugun"; }
  if (!html) return;
  kibleStop();
  $app.innerHTML = html;
  if (!parts[0] || parts[0] === "namaz" || parts[0] === "kible") namazMount();
  if (parts[0] === "kible") setTimeout(() => document.getElementById("kible")?.scrollIntoView({ block: "start" }), 50);
  renderNav(nav);
  if (parts[0] !== "kible") window.scrollTo(0, 0);
}

// Uygulama arka plandan dönünce: bildirimleri ileriye yenile, Namaz ekranındaysa vakitleri tazele
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState !== "visible" || !E) return;
  bildirimKur().catch(() => {});
  saatBildirimKur().catch(() => {});
  tesbihBildirimKur().catch(() => {});
  if (/^(#\/?)?$|^#\/(namaz|kible)/.test(location.hash) && !kible.stop) route();
});

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
  else if (act === "mr-step" || act === "mr-olen" || act === "mr-olmus" || act === "mr-del") {
    const g = mirasGirdi();
    if (act === "mr-olen") { g.olen = el.dataset.v; g.es = 0; }
    else if (act === "mr-olmus") { if (g.olmus.length < 8) g.olmus.push({ cins: el.dataset.v, ogul: 0, kiz: 0 }); }
    else if (act === "mr-del") g.olmus.splice(Number(el.dataset.i), 1);
    else {
      const path = el.dataset.k.split("."), d = Number(el.dataset.d);
      let o = g; for (const p of path.slice(0, -1)) o = o[p];
      const k = path.at(-1); o[k] = Math.max(0, (o[k] || 0) + d);
    }
    await mirasDegisti();
  }
  else if (act === "kible") { kibleStart(); }
  else if (act === "konum") { e.preventDefault(); if (await konumAl("nz-msg")) { await bildirimKur(); route(); } }
  else if (act === "vdeneme") {
    if (await B.izinIste()) { await B.deneme(); toast("5 saniye içinde deneme bildirimi gelecek"); }
    else toast("Bildirim izni verilmedi");
  }
  else if (act === "vexact") { e.preventDefault(); await B.tamZamanliAyar(); }
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
  if (el.dataset.act === "mr-tog") { const g = mirasGirdi(); g[el.dataset.k] = el.dataset.k === "es" ? (el.checked ? 1 : 0) : el.checked; await mirasDegisti(); return; }
  if (el.dataset.act === "vopt" || el.dataset.act === "vonce") {
    const a = ayarVakit();
    if (el.dataset.act === "vonce") a.once = Number(el.value);
    else if (el.dataset.key === "on") {
      if (el.checked && !(await B.izinIste())) { el.checked = false; toast("Bildirim izni verilmedi. Telefonun Ayarlar bölümünden açabilirsin."); return; }
      a.on = el.checked;
    } else if (el.dataset.key === "sahur") a.sahur = el.checked;
    else a.keys[el.dataset.key.slice(2)] = el.checked;
    S.vakit = a;
    await store.set("settings", S);
    if (!a.on) await bildirimKur();   // kapatınca bekleyenleri sil
    route();
    return;
  }
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
  if (e.target.dataset.act === "mr-tutar") {
    const g = mirasGirdi();
    g.tutar = Number(e.target.value.replace(/[^\d]/g, "")) || 0;
    const box = document.getElementById("mr-sonuc");
    if (box && box.querySelector(".mr-sonuc")) box.innerHTML = mirasSonuc(M.feraiz(g), M.tmk(g), g.tutar);
    mirasDegisti(false);
    return;
  }
  if (e.target.dataset.act !== "sfilter") return;
  const f = fold2(e.target.value.trim());
  for (const a of document.querySelectorAll("#slist .row")) a.style.display = !f || a.dataset.name.includes(f) ? "" : "none";
});

// ---------------------------------------------------------------------------
// başlat
// ---------------------------------------------------------------------------
async function boot() {
  const [core, index] = await Promise.all([
    // İnceleme sürümünde (tek HTML dosyası) veriler sayfanın içine gömülüdür
    window.__CORE || fetch("data/core.json").then((r) => r.json()),
    window.__INDEX || fetch("data/index.json").then((r) => r.json()),
  ]);
  E = new Engine(core, index);
  S = { ...S, ...(await store.get("settings", {})) };
  if (!Array.isArray(S.meals) || !S.meals.some((t) => E.meals.includes(t))) S.meals = [...E.meals];
  saved = await store.get("saved", []);
  const kayitliMiras = await store.get("miras", null);
  if (kayitliMiras && typeof kayitliMiras === "object") mg = { ...M.BOS, ...kayitliMiras };
  for (const k of MOD_KEYS) modVeri[k] = await store.get("mod:" + k, null);
  await initCarsi({ store, esc, toast, topbar, ICON, MAKER, APP_NAME, rerender: () => route(),
    fail: (err) => { $app.innerHTML = `${topbar()}<div class="empty">Çarşı verisi yüklenemedi.<br>${esc(err.message)}</div>`; } });
  document.title = APP_NAME;
  // Bildirimleri her açılışta ileriye doğru yenile (iOS en fazla 64 bekleyen bildirim tutar)
  bildirimKur().catch(() => {});
  saatBildirimKur().catch(() => {});
  tesbihBildirimKur().catch(() => {});
  lastHash = location.hash;
  route();
}

boot().catch((err) => {
  $app.innerHTML = `<div class="empty">Veriler yüklenemedi.<br>${esc(err.message)}</div>`;
});
