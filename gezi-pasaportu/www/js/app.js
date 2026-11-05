/* Gezi Pasaportu — Bir Mr. Anduv! yapımıdır.
   Gezdiğin ülkeler, şehirler ve seyahatler; harita, damga ve istatistik. Her şey yalnız telefonda tutulur, internet gerekmez.
   Veri: ülkeler (countries-list, i18n-iso-countries · MIT), harita (Natural Earth · kamu malı), şehirler (GeoNames · CC BY 4.0). */
(() => {
  'use strict';
  const $ = (s, el = document) => el.querySelector(s);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  // ── dil: Türkçe / English (ilk açılışta sorulur; Daha > Dil'den değişir) ──
  const DIL = (() => { try { return (localStorage.getItem('gp.dil') || '').replace(/"/g, '') || null; } catch (e) { return null; } })();
  const EN = DIL === 'en';
  const T = (tr, en) => (EN ? en : tr);
  document.documentElement.lang = EN ? 'en' : 'tr';
  const katla = (s) => String(s || '').toLocaleLowerCase('tr-TR').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ı/g, 'i');
  const buyuk = (s) => String(s || '').toLocaleUpperCase(EN ? 'en-US' : 'tr-TR');
  const NF = new Intl.NumberFormat(EN ? 'en-US' : 'tr-TR');
  const AY = EN ? ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    : ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
  const AYK = AY.map((a) => buyuk(a.slice(0, 3)));
  const KITA = EN ? { EU: 'Europe', AS: 'Asia', AF: 'Africa', NA: 'North America', SA: 'South America', OC: 'Oceania' }
    : { EU: 'Avrupa', AS: 'Asya', AF: 'Afrika', NA: 'Kuzey Amerika', SA: 'Güney Amerika', OC: 'Okyanusya' };
  const say = (n, tr, en1, en2) => `${n} ${EN ? (n === 1 ? en1 : en2) : tr}`;   // 1 city / 2 cities
  const ondalik = (x) => EN ? String(x) : String(x).replace('.', ',');
  const KRENK = { EU: '#1f4e8c', AS: '#b3261e', AF: '#a0571b', NA: '#1f7a4d', SA: '#6b3fa0', OC: '#0e7c86' };
  const KSIRA = ['EU', 'AS', 'AF', 'NA', 'SA', 'OC'];

  const UL = window.ULKELER || [];
  const U = Object.fromEntries(UL.map((u) => [u.k, u]));
  const EGEMEN = UL.filter((u) => u.s).length;   // 195
  const ua = (u) => (u ? (EN ? u.en : u.a) : '');                 // ülke adı, seçili dilde
  const ub = (u) => (u ? (EN ? u.be || u.b : u.b) : '');          // başkent
  const ULS = EN ? [...UL].sort((a, b) => a.en.localeCompare(b.en, 'en')) : UL;
  // şehir adları: kayıtta Türkçe ad (kanonik) tutulur, ekranda seçili dilde gösterilir
  const SH = {};   // ülke → katla(ad) → [tr, x, y, nüfus, en?, diğer?]
  const sehirTablo = (k) => {
    if (SH[k] || !window.SEHIRLER) return SH[k] || null;
    const m = (SH[k] = new Map());
    for (const c of window.SEHIRLER[k] || []) for (const ad of [c[0], c[4], ...(c[5] ? c[5].split(',') : [])]) if (ad && ad.trim()) { const a = katla(ad.trim()); if (!m.has(a)) m.set(a, c); }
    return m;
  };
  const sehirKayit = (k, s) => sehirTablo(k)?.get(katla(s)) || null;
  const kanon = (k, s) => sehirKayit(k, s)?.[0] || s;
  const sehirAdi = (k, s) => { const c = sehirKayit(k, s); return c ? (EN ? c[4] || c[0] : c[0]) : s; };
  const KIM = [['Eşimle', 'With my partner'], ['Ailemle', 'With family'], ['Arkadaşlarla', 'With friends'], ['Yalnız', 'Solo'], ['İş', 'Business']];
  const kimAdi = (v) => { const x = KIM.find((k) => k[0] === v || k[1] === v); return x ? T(x[0], x[1]) : v; };
  // KKTC bayrağının emoji karşılığı yok: kendi çizimimiz
  const KKTC_SVG = '<svg class="bayrak-svg" viewBox="0 0 30 20" aria-label="KKTC"><rect width="30" height="20" fill="#fff"/><rect y="2" width="30" height="2" fill="#e30a17"/><rect y="16" width="30" height="2" fill="#e30a17"/><circle cx="12.6" cy="10" r="4.4" fill="#e30a17"/><circle cx="13.8" cy="10" r="3.5" fill="#fff"/><path fill="#e30a17" d="m15.6 10 3.9-1.27-2.41 3.32V7.95l2.41 3.32z"/></svg>';
  const bayrakMetin = (k) => (k === 'XN' ? '' : k.length === 2 ? String.fromCodePoint(...[...k].map((c) => 127397 + c.charCodeAt(0))) : '🏳️');
  const bayrak = (k) => (k === 'XN' ? KKTC_SVG : bayrakMetin(k));

  // ── kalıcı kayıt ──
  const Pref = window.Capacitor?.Plugins?.Preferences;
  const kayit = {
    async al(k, v0) { try { if (Pref) { const r = await Pref.get({ key: k }); return r.value ? JSON.parse(r.value) : v0; } const r = localStorage.getItem(k); return r ? JSON.parse(r) : v0; } catch (e) { return v0; } },
    async koy(k, v) { try { const s = JSON.stringify(v); if (Pref) await Pref.set({ key: k, value: s }); else localStorage.setItem(k, s); } catch (e) {} },
  };
  const ANAHTAR = 'gp.veri';
  // V.ulkeler: kod → { d: 'g' (gittim) | 'h' (hayal), s: [elle eklenen şehirler], n: not }
  // V.geziler: [{ id, ad, bas, bit, yil, yerler: [{ u, s: [şehir] }], kim, puan, not }]
  let V = { surum: 1, ev: 'TR', ulkeler: {}, geziler: [] };
  const kaydet = () => kayit.koy(ANAHTAR, V);

  const durum = { ekran: 'pasaport', ulkeFiltre: 'tumu', ulkeAra: '', harita: { x: 0, y: 0, w: 1000, h: 520 }, haritaFiltre: 'hepsi', sehirGoster: true };

  // ── hesaplar ──
  const gun = (g) => {
    if (!g.bas) return 0;
    const a = new Date(g.bas), b = new Date(g.bit || g.bas);
    return isNaN(a) || isNaN(b) ? 0 : Math.max(1, Math.round((b - a) / 864e5) + 1);
  };
  const gYil = (g) => g.bas ? +g.bas.slice(0, 4) : (g.yil || 0);
  const gSira = (g) => g.bas || (g.yil ? g.yil + '-00-00' : '0000');
  const gAd = (g) => g.ad || g.yerler.map((y) => ua(U[y.u]) || y.u).join(' · ') || T('Seyahat', 'Trip');

  function hesapla() {
    const gittim = new Map();   // kod → { geziler: [], sehir: Set, gun, ilk, son }
    const ekle = (k) => { if (!gittim.has(k)) gittim.set(k, { geziler: [], sehir: new Set(), gun: 0, ilk: null, son: null }); return gittim.get(k); };
    for (const [k, x] of Object.entries(V.ulkeler)) {
      if (x.d === 'g' || x.s?.length) { const o = ekle(k); (x.s || []).forEach((s) => o.sehir.add(kanon(k, s))); }
    }
    if (V.ev && U[V.ev]) ekle(V.ev);
    const tarihler = new Set();
    for (const g of V.geziler) {
      const n = gun(g);
      if (g.bas) { const a = new Date(g.bas); for (let i = 0; i < n && i < 400; i++) tarihler.add(new Date(+a + i * 864e5).toISOString().slice(0, 10)); }
      for (const y of g.yerler) {
        const o = ekle(y.u); o.geziler.push(g); y.s.forEach((s) => o.sehir.add(kanon(y.u, s)));
        o.gun += g.yerler.length ? Math.round(n / g.yerler.length) : 0;
        const t = gSira(g); if (!o.ilk || t < o.ilk) o.ilk = t; if (!o.son || t > o.son) o.son = t;
      }
    }
    const kodlar = [...gittim.keys()].filter((k) => U[k]);
    const sehirSay = kodlar.reduce((t, k) => t + gittim.get(k).sehir.size, 0);
    const kitalar = new Set(kodlar.map((k) => U[k].kt).filter((k) => KITA[k]));
    const egemenSay = kodlar.filter((k) => U[k].s).length;
    return { gittim, kodlar, sehirSay, kitalar, egemenSay, gun: tarihler.size, hayal: Object.keys(V.ulkeler).filter((k) => V.ulkeler[k].d === 'h' && !gittim.has(k)) };
  }
  let H = null;
  const yenile = () => { H = hesapla(); baslik(); };
  const durumu = (k) => (k === V.ev ? 'e' : H.gittim.has(k) ? 'g' : V.ulkeler[k]?.d === 'h' ? 'h' : '');

  function baslik() {
    $('#hAlt').innerHTML = H.kodlar.length
      ? [say(H.kodlar.length, 'ülke', 'country', 'countries'), say(H.sehirSay, 'şehir', 'city', 'cities'), say(H.kitalar.size, 'kıta', 'continent', 'continents')].map((x) => x.replace(/^(\d+)/, '<b>$1</b>')).join(' · ')
      : T('Gezdiğin her ülke bir damga', 'Every country you visit is a stamp');
  }

  const tarihYaz = (g) => {
    if (!g.bas) return g.yil ? String(g.yil) : T('Tarih yok', 'No date');
    const a = new Date(g.bas), b = new Date(g.bit || g.bas);
    if (EN) {
      const f = (d, y) => `${AY[d.getMonth()].slice(0, 3)} ${d.getDate()}${y ? ', ' + d.getFullYear() : ''}`;
      if (+a === +b) return f(a, 1);
      if (a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth()) return `${AY[a.getMonth()].slice(0, 3)} ${a.getDate()}–${b.getDate()}, ${a.getFullYear()}`;
      if (a.getFullYear() === b.getFullYear()) return `${f(a)} – ${f(b)}, ${a.getFullYear()}`;
      return `${f(a, 1)} – ${f(b, 1)}`;
    }
    if (+a === +b) return `${a.getDate()} ${AY[a.getMonth()]} ${a.getFullYear()}`;
    if (a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth()) return `${a.getDate()}–${b.getDate()} ${AY[a.getMonth()]} ${a.getFullYear()}`;
    if (a.getFullYear() === b.getFullYear()) return `${a.getDate()} ${AY[a.getMonth()]} – ${b.getDate()} ${AY[b.getMonth()]} ${a.getFullYear()}`;
    return `${a.getDate()} ${AY[a.getMonth()]} ${a.getFullYear()} – ${b.getDate()} ${AY[b.getMonth()]} ${b.getFullYear()}`;
  };
  const ayYil = (t) => { if (!t || t.startsWith('0000')) return ''; const [y, m] = t.split('-'); return +m ? `${AY[+m - 1]} ${y}` : y; };
  const yildiz = (n) => n ? `<span class="yildiz">${'★'.repeat(n)}<span class="s">${'★'.repeat(5 - n)}</span></span>` : '';

  // ── damga (her ülkeye kendine özgü pasaport damgası) ──
  const hash = (s) => { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
  function damga(k, tarih, boyut = 120) {
    const u = U[k]; if (!u) return '';
    const h = hash(k), renk = k === V.ev ? '#b08900' : KRENK[u.kt] || '#173b40';
    const sekil = h % 4, don = ((h >> 3) % 25) - 12, id = 'd' + k + boyut;
    const ad = buyuk(EN ? u.kse || ua(u) : u.ks || ua(u)), uzun = ad.length > 11;
    const t = tarih ? (() => { const [y, m] = tarih.split('-'); return (+m ? AYK[+m - 1] + ' ' : '') + y; })() : '';
    let cerceve, yazi;
    if (sekil === 0) {   // yuvarlak, kavisli ad
      cerceve = `<circle cx="60" cy="60" r="52" fill="none" stroke="${renk}" stroke-width="4"/><circle cx="60" cy="60" r="44" fill="none" stroke="${renk}" stroke-width="1.6"/>
        <path id="${id}y" d="M22 60a38 38 0 0 1 76 0" fill="none"/>`;
      yazi = `<text font-size="${uzun ? 9.5 : 12}" font-weight="900" fill="${renk}" letter-spacing="1" text-anchor="middle"><textPath href="#${id}y" startOffset="50%">${esc(ad)}</textPath></text>
        <text x="60" y="68" font-size="21" text-anchor="middle" fill="${renk}">✈</text>
        <text x="60" y="88" font-size="11" font-weight="900" text-anchor="middle" fill="${renk}" letter-spacing="1">${esc(t)}</text>`;
    } else if (sekil === 1) {   // dikdörtgen vize
      cerceve = `<rect x="10" y="26" width="100" height="68" rx="8" fill="none" stroke="${renk}" stroke-width="4"/><rect x="16" y="32" width="88" height="56" rx="4" fill="none" stroke="${renk}" stroke-width="1.4" stroke-dasharray="3 2"/>`;
      yazi = `<text x="60" y="49" font-size="${uzun ? 9 : 12}" font-weight="900" text-anchor="middle" fill="${renk}" letter-spacing="1">${esc(ad)}</text>
        <text x="60" y="64" font-size="8.5" font-weight="800" text-anchor="middle" fill="${renk}" letter-spacing="2">GİRİŞ · ENTRY</text>
        <text x="60" y="81" font-size="12" font-weight="900" text-anchor="middle" fill="${renk}">${esc(t)}</text>`;
    } else if (sekil === 2) {   // sekizgen
      cerceve = `<polygon points="38,10 82,10 110,38 110,82 82,110 38,110 10,82 10,38" fill="none" stroke="${renk}" stroke-width="4"/><polygon points="41,18 79,18 102,41 102,79 79,102 41,102 18,79 18,41" fill="none" stroke="${renk}" stroke-width="1.4"/>`;
      yazi = `<text x="60" y="46" font-size="18" text-anchor="middle" fill="${renk}">★</text>
        <text x="60" y="64" font-size="${uzun ? 9 : 12}" font-weight="900" text-anchor="middle" fill="${renk}" letter-spacing="1">${esc(ad)}</text>
        <text x="60" y="82" font-size="11" font-weight="900" text-anchor="middle" fill="${renk}">${esc(t)}</text>`;
    } else {   // oval
      cerceve = `<ellipse cx="60" cy="60" rx="54" ry="38" fill="none" stroke="${renk}" stroke-width="4"/><ellipse cx="60" cy="60" rx="46" ry="30" fill="none" stroke="${renk}" stroke-width="1.4"/>`;
      yazi = `<text x="60" y="54" font-size="${uzun ? 9 : 12}" font-weight="900" text-anchor="middle" fill="${renk}" letter-spacing="1">${esc(ad)}</text>
        <line x1="26" y1="60" x2="94" y2="60" stroke="${renk}" stroke-width="1.2"/>
        <text x="60" y="74" font-size="11" font-weight="900" text-anchor="middle" fill="${renk}">${esc(t || '✈')}</text>`;
    }
    return `<svg viewBox="0 0 120 120" width="${boyut}" height="${boyut}" aria-label="${esc(T(u.a + ' damgası', u.en + ' stamp'))}">
      <defs><filter id="${id}f"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="${h % 97}"/><feDisplacementMap in="SourceGraphic" scale="2.2"/><feComponentTransfer><feFuncA type="table" tableValues="0 .85 .9"/></feComponentTransfer></filter></defs>
      <g transform="rotate(${don} 60 60)" filter="url(#${id}f)" font-family="'Barlow Condensed','DM Sans',sans-serif" opacity=".88">${cerceve}${yazi}</g></svg>`;
  }

  // ── harita ──
  const HR = window.HARITA;
  function haritaSvg({ etkilesim = false, vb = null } = {}) {
    const p = HR.p; let yol = '';
    for (const k in p) {
      if (k[0] === '_') { yol += `<path class="ulke" d="${p[k]}"/>`; continue; }
      const d = durumu(k);
      if (durum.haritaFiltre === 'gittim' && d === 'h') { yol += `<path class="ulke" data-k="${k}" d="${p[k]}"/>`; continue; }
      if (durum.haritaFiltre === 'hayal' && (d === 'g')) { yol += `<path class="ulke" data-k="${k}" d="${p[k]}"/>`; continue; }
      yol += `<path class="ulke ${d}" data-k="${k}" d="${p[k]}"/>`;
    }
    // haritada görünmeyecek kadar küçük ülkeler: nokta
    let ada = '';
    for (const u of UL) if (!u.h && u.m && u.s) { const d = durumu(u.k); ada += `<circle class="ada ${d}" data-k="${u.k}" cx="${u.m[0]}" cy="${u.m[1]}" r="${d ? 3.2 : 2}"/>`; }
    let sehir = '';
    if (etkilesim && durum.sehirGoster && window.SEHIRLER) {
      for (const [k, o] of H.gittim) {
        const L = window.SEHIRLER[k]; if (!L) continue;
        for (const s of o.sehir) { const c = sehirKayit(k, s); if (c) sehir += `<circle class="sehir" cx="${c[1]}" cy="${c[2]}" r="2.4"><title>${esc(sehirAdi(k, s))}</title></circle>`; }
      }
    }
    const v = vb || { x: 0, y: 0, w: HR.w, h: HR.h };
    return `<svg viewBox="${v.x} ${v.y} ${v.w} ${v.h}" preserveAspectRatio="xMidYMid meet" ${etkilesim ? 'id="harita"' : ''}>
      <path class="kure" d="${HR.kure}"/><path class="izgara" d="${HR.g}"/>${yol}${ada}<g id="sehirKatman">${sehir}</g></svg>`;
  }

  function haritaEtkilesim() {
    const kutu = $('.harita-tam'), svg = $('#harita'); if (!svg) return;
    const vb = durum.harita, ptr = new Map(); let ilk = null, tasidi = false, ilkMesafe = 0, ilkVb = null;
    const kr = kutu.getBoundingClientRect(), oran = kr.height / Math.max(1, kr.width);
    if (!vb.hazir) {   // ilk açılış: haritayı kutuyu dolduracak şekilde ev ülkesi çevresine ortala
      vb.hazir = true; vb.w = Math.min(HR.w, Math.max(HR.h / oran, 600));
      const m = U[V.ev]?.m || [HR.w / 2, HR.h / 2]; vb.x = m[0] - vb.w / 2; vb.y = (HR.h - vb.w * oran) / 2;
    }
    const uygula = () => {
      vb.w = Math.min(HR.w * 1.1, Math.max(40, vb.w)); vb.h = vb.w * oran;
      vb.x = Math.min(HR.w - vb.w * .3, Math.max(-vb.w * .7, vb.x)); vb.y = Math.min(HR.h - vb.h * .3, Math.max(-vb.h * .7, vb.y));
      svg.setAttribute('viewBox', `${vb.x} ${vb.y} ${vb.w} ${vb.h}`);
      svg.querySelectorAll('.sehir').forEach((c) => c.setAttribute('r', Math.max(.6, 2.4 * vb.w / HR.w * 1.6)));
      svg.querySelectorAll('.ada').forEach((c) => c.setAttribute('r', Math.max(.5, (c.classList.length > 1 ? 3.2 : 2) * Math.sqrt(vb.w / HR.w))));
    };
    const olcek = () => { const r = svg.getBoundingClientRect(); return Math.max(vb.w / r.width, vb.h / r.height); };
    const yakinlas = (f, cx, cy) => {
      const r = svg.getBoundingClientRect(), s = olcek();
      const px = cx == null ? vb.x + vb.w / 2 : vb.x + (cx - r.left - (r.width - vb.w / s) / 2) * s;
      const py = cy == null ? vb.y + vb.h / 2 : vb.y + (cy - r.top - (r.height - vb.h / s) / 2) * s;
      const nw = Math.min(HR.w, Math.max(40, vb.w / f)), k = nw / vb.w;
      vb.x = px - (px - vb.x) * k; vb.y = py - (py - vb.y) * k; vb.w = nw; uygula();
    };
    svg.addEventListener('pointerdown', (e) => { svg.setPointerCapture(e.pointerId); ptr.set(e.pointerId, [e.clientX, e.clientY]); ilk = [e.clientX, e.clientY, vb.x, vb.y]; tasidi = false;
      if (ptr.size === 2) { const [a, b] = [...ptr.values()]; ilkMesafe = Math.hypot(a[0] - b[0], a[1] - b[1]); ilkVb = { ...vb, cx: (a[0] + b[0]) / 2, cy: (a[1] + b[1]) / 2 }; } });
    svg.addEventListener('pointermove', (e) => {
      if (!ptr.has(e.pointerId)) return; ptr.set(e.pointerId, [e.clientX, e.clientY]);
      if (ptr.size === 2 && ilkVb) {
        const [a, b] = [...ptr.values()], m = Math.hypot(a[0] - b[0], a[1] - b[1]); tasidi = true;
        Object.assign(vb, { x: ilkVb.x, y: ilkVb.y, w: ilkVb.w }); yakinlas(m / ilkMesafe, ilkVb.cx, ilkVb.cy); return;
      }
      if (ptr.size === 1 && ilk) {
        const dx = e.clientX - ilk[0], dy = e.clientY - ilk[1]; if (Math.hypot(dx, dy) > 6) tasidi = true;
        if (tasidi) { const s = olcek(); vb.x = ilk[2] - dx * s; vb.y = ilk[3] - dy * s; uygula(); }
      }
    });
    const birak = (e) => {
      const tek = ptr.size === 1 && !tasidi; ptr.delete(e.pointerId); if (ptr.size < 2) ilkVb = null;
      if (ptr.size === 1) { const [a] = [...ptr.values()]; ilk = [a[0], a[1], vb.x, vb.y]; }
      if (tek && e.type === 'pointerup') { const el = document.elementFromPoint(e.clientX, e.clientY)?.closest('[data-k]'); if (el) ulkeSayfasi(el.dataset.k); }
    };
    svg.addEventListener('pointerup', birak); svg.addEventListener('pointercancel', birak);
    svg.addEventListener('wheel', (e) => { e.preventDefault(); yakinlas(e.deltaY < 0 ? 1.25 : .8, e.clientX, e.clientY); }, { passive: false });
    kutu.querySelector('[data-zoom="+"]').onclick = () => yakinlas(1.6);
    kutu.querySelector('[data-zoom="-"]').onclick = () => yakinlas(1 / 1.6);
    kutu.querySelector('[data-zoom="0"]').onclick = () => { Object.assign(vb, { x: 0, w: HR.w, y: (HR.h - HR.w * oran) / 2 }); uygula(); };
    uygula();
  }

  // ── ekranlar ──
  function pasaport() {
    const ek = $('#ekran');
    if (!H.kodlar.length || (H.kodlar.length === 1 && H.kodlar[0] === V.ev && !V.geziler.length)) {
      ek.innerHTML = `<div class="karsila">
        <svg viewBox="0 0 120 120">${damga('TR', '', 120).replace(/^<svg[^>]*>|<\/svg>$/g, '')}</svg>
        <h3>${T('Pasaportun hazır', 'Your passport is ready')}</h3>
        <p>${T('Gittiğin şehirleri yaz; ülkesini, damgasını ve haritanı biz işaretleyelim. Sonra seyahatlerini tarih ve notlarıyla ekle; gerisini biz hatırlayalım.', 'Type the cities you have been to; we will stamp the country and colour your map. Then add your trips with dates and notes, and we will remember the rest.')}</p>
        <button class="btn tur" data-sehirler="1">🏙️ ${T('Gittiğim şehirleri yaz', 'Add cities I have visited')}</button>
        <button class="btn sec" data-git="ulkeler">✓ ${T('Ülke listesinden işaretle', 'Tick from the country list')}</button>
        <button class="btn" data-yeni="1">＋ ${T('İlk seyahatimi ekle', 'Add my first trip')}</button>
        <button class="btn sec" data-geri="1">${T('Yedekten geri yükle', 'Restore from backup')}</button></div>
        ${imzaKutu()}`;
      return;
    }
    const yuzde = Math.round(H.egemenSay / EGEMEN * 1000) / 10;
    // rekorlar
    const g = [...V.geziler];
    const enUzun = g.filter(gun).sort((a, b) => gun(b) - gun(a))[0];
    const cok = [...H.gittim.entries()].filter(([k]) => k !== V.ev).sort((a, b) => b[1].geziler.length - a[1].geziler.length)[0];
    const sehirli = [...H.gittim.entries()].sort((a, b) => b[1].sehir.size - a[1].sehir.size)[0];
    const sonGezi = g.sort((a, b) => gSira(b).localeCompare(gSira(a)))[0];
    // yıllar
    const yil = {}; for (const x of V.geziler) { const y = gYil(x); if (!y) continue; (yil[y] ||= { u: new Set(), n: 0, g: 0 }); x.yerler.forEach((p) => yil[y].u.add(p.u)); yil[y].n++; yil[y].g += gun(x); }
    const yillar = Object.keys(yil).sort(); const yMax = Math.max(1, ...yillar.map((y) => yil[y].u.size));
    // damgalar: ilk gidiş sırasına göre
    const dsira = [...H.gittim.entries()].sort((a, b) => (a[1].ilk || '9999').localeCompare(b[1].ilk || '9999'));
    const ev = $('#ekran');
    ev.innerHTML = `
      <div class="hero"><svg class="glob" viewBox="0 0 64 64"><circle cx="32" cy="32" r="28" fill="none" stroke="#fff" stroke-width="3"/><path d="M4 32h56M32 4c-10 10-10 46 0 56M32 4c10 10 10 46 0 56M9 18h46M9 46h46" stroke="#fff" stroke-width="2" fill="none"/></svg>
        <span class="kick">${T('PASAPORT', 'PASSPORT')}</span>
        <div class="sayi"><b>${H.kodlar.length}</b><span>${T('ÜLKE', H.kodlar.length === 1 ? 'COUNTRY' : 'COUNTRIES')}<small>${V.ev && H.gittim.has(V.ev) ? esc(T(ua(U[V.ev]) + ' dahil', 'incl. ' + ua(U[V.ev]))) : ''}</small></span></div>
        <div class="cubuk"><i style="width:${Math.min(100, yuzde)}%"></i></div>
        <small>${T(`Dünyanın %${ondalik(yuzde)}'i · ${EGEMEN} ülkeden ${H.egemenSay} · 6 kıtadan ${H.kitalar.size}`, `${ondalik(yuzde)}% of the world · ${H.egemenSay} of ${EGEMEN} countries · ${H.kitalar.size} of 6 continents`)}</small></div>
      <button class="sehir-cubuk" data-sehirler="1"><span>🔎</span><b>${T('Gittiğin bir şehri yaz…', 'Type a city you have visited…')}</b><i>${T('ülkesini biz buluruz', 'we find the country')}</i></button>
      <div class="tiles">
        <div class="tile"><b>${NF.format(H.sehirSay)}</b><span>${T('Şehir', 'Cities')}</span><small>${sehirli && sehirli[1].sehir.size ? T('en çok ', 'most in ') + esc(ua(U[sehirli[0]])) : T('şehir yazarak ekle', 'add by typing a city')}</small></div>
        <div class="tile"><b>${NF.format(H.gun)}</b><span>${T('Yolda gün', 'Days travelling')}</span><small>${say(V.geziler.length, 'seyahat', 'trip', 'trips')}</small></div>
        <div class="tile"><b>${H.kitalar.size}<small style="display:inline;font-size:16px;color:var(--mute)">/6</small></b><span>${T('Kıta', 'Continents')}</span><small>${[...H.kitalar].map((k) => KITA[k]).join(', ') || '—'}</small></div>
        <div class="tile"><b>${H.hayal.length}</b><span>${T('Hayal listesi', 'Wish list')}</span><small>${H.hayal.slice(0, 3).map((k) => bayrak(k)).join(' ') || T('Ülkeler’de ☆ ile ekle', 'add with ☆ in Countries')}</small></div>
      </div>
      <div class="bas2"><h3>${T('Haritam', 'My map')}</h3><button data-git="harita">${T('Büyüt ›', 'Open ›')}</button></div>
      <div class="harita-kutu" data-git="harita">${haritaSvg()}</div>
      <div class="bas2"><h3>${T('Damgalar', 'Stamps')}</h3><small style="color:var(--mute);font-weight:800">${H.kodlar.length} ${T('damga', 'stamps')}</small></div>
      <div class="damgalar">${dsira.map(([k, o]) => `<button data-ulke="${k}">${damga(k, o.ilk && !o.ilk.startsWith('0000') ? o.ilk : '', 120)}</button>`).join('')}
        <button data-git="ulkeler"><span class="bos-damga">${T('＋ yeni<br>damga', '＋ new<br>stamp')}</span></button></div>
      <div class="bas2"><h3>${T('Kıtalar', 'Continents')}</h3></div>
      <div class="panel">${KSIRA.map((k) => { const top = UL.filter((u) => u.s && u.kt === k).length, n = H.kodlar.filter((x) => U[x].s && U[x].kt === k).length;
        return `<div class="kita" data-kita="${k}" style="--kc:${KRENK[k]}"><b>${KITA[k]}</b><div class="bar"><i style="width:${n / top * 100}%"></i></div><span>${n}<small>/${top}</small></span></div>`; }).join('')}</div>
      ${yillar.length ? `<div class="bas2"><h3>${T('Yıllara göre', 'By year')}</h3><small style="color:var(--mute);font-weight:800">${T('ülke sayısı', 'countries')}</small></div>
      <div class="panel"><div class="yillar">${yillar.map((y) => `<div class="yil"><b>${yil[y].u.size}</b><i style="height:${yil[y].u.size / yMax * 92}px"></i><small>${y}</small></div>`).join('')}</div></div>` : ''}
      <div class="bas2"><h3>${T('Rekorlar', 'Records')}</h3></div>
      <div class="panel">
        ${sonGezi ? `<div class="rekor" data-gezi="${sonGezi.id}"><span class="ik">🧳</span><div><span>${T('Son seyahat', 'Latest trip')}</span><b>${esc(gAd(sonGezi))} · ${esc(tarihYaz(sonGezi))}</b></div></div>` : ''}
        ${enUzun ? `<div class="rekor" data-gezi="${enUzun.id}"><span class="ik">⏳</span><div><span>${T('En uzun seyahat', 'Longest trip')}</span><b>${esc(gAd(enUzun))} · ${gun(enUzun)} ${T('gün', 'days')}</b></div></div>` : ''}
        ${cok && cok[1].geziler.length > 1 ? `<div class="rekor" data-ulke="${cok[0]}"><span class="ik">${bayrak(cok[0])}</span><div><span>${T('En çok dönülen', 'Most visited')}</span><b>${esc(ua(U[cok[0]]))} · ${say(cok[1].geziler.length, 'kez', 'time', 'times')}</b></div></div>` : ''}
        ${sehirli && sehirli[1].sehir.size ? `<div class="rekor" data-ulke="${sehirli[0]}"><span class="ik">🏙️</span><div><span>${T('En çok şehir', 'Most cities')}</span><b>${esc(ua(U[sehirli[0]]))} · ${say(sehirli[1].sehir.size, 'şehir', 'city', 'cities')}</b></div></div>` : ''}
        <div class="rekor" data-git="seyahat"><span class="ik">✈️</span><div><span>${T('Toplam', 'Total')}</span><b>${T(`${V.geziler.length} seyahat · ${NF.format(H.gun)} gün yolda`, `${V.geziler.length} trips · ${NF.format(H.gun)} days travelling`)}</b></div></div>
      </div>
      ${imzaKutu()}`;
  }

  function harita() {
    $('#ekran').innerHTML = `
      <div class="h-ust"><div class="secenek">${[['hepsi', T('Hepsi', 'All')], ['gittim', T('Gittiklerim', 'Visited')], ['hayal', T('Hayalim', 'Wish list')]].map(([k, a]) => `<button data-hf="${k}" class="${durum.haritaFiltre === k ? 'on' : ''}">${a}</button>`).join('')}
        <button data-sehir="1" class="${durum.sehirGoster ? 'on' : ''}">● ${T('Şehirler', 'Cities')}</button></div></div>
      <div class="harita-tam">${haritaSvg({ etkilesim: true, vb: durum.harita })}
        <div class="h-arac"><button data-zoom="+" aria-label="${T('Yakınlaş', 'Zoom in')}">＋</button><button data-zoom="-" aria-label="${T('Uzaklaş', 'Zoom out')}">−</button><button data-zoom="0" aria-label="${T('Tüm dünya', 'Whole world')}" style="font-size:16px">⤢</button></div></div>
      <div class="lejant"><span><i style="background:var(--ok)"></i>${T('Gittim', 'Visited')} · ${H.kodlar.length - (H.gittim.has(V.ev) ? 1 : 0)}</span><span><i style="background:#f6b38e"></i>${T('Hayalim', 'Wish list')} · ${H.hayal.length}</span>${V.ev ? `<span><i style="background:var(--ev)"></i>${T('Ev', 'Home')} · ${esc(ua(U[V.ev]))}</span>` : ''}<span><i style="background:#e3262c;border-radius:50%"></i>${T('Şehir', 'City')}</span></div>`;
    haritaEtkilesim();
  }

  function seyahat() {
    const ek = $('#ekran');
    if (!V.geziler.length) {
      ek.innerHTML = `<div class="bos"><b>${T('Henüz seyahat yok', 'No trips yet')}</b>${T('Tarih, ülke, şehir ve notlarınla ilk seyahatini ekle; yıllar sonra bile her şey burada.', 'Add your first trip with dates, places and notes; it will all be here years from now.')}<br><button class="btn tur" data-yeni="1" style="margin-top:14px">＋ ${T('Seyahat ekle', 'Add trip')}</button></div>`;
      return;
    }
    const g = [...V.geziler].sort((a, b) => gSira(b).localeCompare(gSira(a)));
    const TS = T('Tarihsiz', 'Undated'); const gr = {}; g.forEach((x) => (gr[gYil(x) || TS] ||= []).push(x));
    const ys = Object.keys(gr).sort((a, b) => (b === TS ? -1 : a === TS ? 1 : b - a));
    ek.innerHTML = `<div class="arac"><button class="btn tur" data-yeni="1" style="flex:1;justify-content:center">＋ ${T('Seyahat ekle', 'Add trip')}</button></div>` + ys.map((y) => {
      const L = gr[y], ul = new Set(); L.forEach((x) => x.yerler.forEach((p) => ul.add(p.u)));
      return `<h3 class="yil-bas">${y}<small>${[say(L.length, 'seyahat', 'trip', 'trips'), say(ul.size, 'ülke', 'country', 'countries'), say(L.reduce((t, x) => t + gun(x), 0), 'gün', 'day', 'days')].join(' · ')}</small></h3>` + L.map((x) => {
        const a = x.bas ? new Date(x.bas) : null, sehirler = x.yerler.flatMap((p) => p.s.map((s) => sehirAdi(p.u, s)));
        return `<div class="gezi" data-gezi="${x.id}"><div class="tarih">${a ? `<b>${a.getDate()}</b><span>${AYK[a.getMonth()]}</span>` : `<b style="font-size:20px">${x.yil || '—'}</b>`}<small>${gun(x) ? gun(x) + T(' gün', ' days') : ''}</small></div>
          <div class="g-in"><h4>${esc(gAd(x))}</h4><div class="bayraklar bayrak">${x.yerler.map((p) => bayrak(p.u)).join('')}</div>
          <div class="g-alt">${esc(sehirler.join(', ') || tarihYaz(x))}</div>
          <div class="g-alt">${[yildiz(x.puan), esc(kimAdi(x.kim))].filter(Boolean).join(' · ')}</div></div></div>`;
      }).join('');
    }).join('');
  }

  function ulkeler() {
    const ara = katla(durum.ulkeAra), f = durum.ulkeFiltre;
    const uy = (u) => {
      if (ara && !katla(u.a + ' ' + u.en + ' ' + u.b + ' ' + (u.be || '')).includes(ara)) return false;
      const d = durumu(u.k);
      if (f === 'gittim') return d === 'g' || d === 'e';
      if (f === 'hayal') return d === 'h';
      return u.s || d;   // bağlı topraklar yalnız işaretliyse ya da aranınca
    };
    const satir = (u) => {
      const d = durumu(u.k), o = H.gittim.get(u.k);
      
      const alt = d === 'e' ? T('Ev ülkem', 'My home country') + (o?.sehir.size ? ' · ' + say(o.sehir.size, 'şehir', 'city', 'cities') : '') :
        o ? [o.geziler.length ? say(o.geziler.length, 'seyahat', 'trip', 'trips') : '', o.sehir.size ? say(o.sehir.size, 'şehir', 'city', 'cities') : '', o.ilk ? ayYil(o.ilk) : ''].filter(Boolean).join(' · ') || T('Gittim', 'Visited') : (ub(u) || KITA[u.kt] || '');
      return `<div class="u-satir ${d}"><span class="bayrak">${bayrak(u.k)}</span><div class="ad" data-ulke="${u.k}"><b>${esc(ua(u))}</b><small>${esc(alt)}</small></div>
        ${d === 'e' ? '' : `<button class="isaret hy ${d === 'h' ? 'on' : ''}" data-hayal="${u.k}" aria-label="${T('Hayal listesi', 'Wish list')}">${d === 'h' ? '★' : '☆'}</button>
        <button class="isaret ok ${d === 'g' ? 'on' : ''}" data-gittim="${u.k}" aria-label="${T('Gittim', 'Visited')}">✓</button>`}</div>`;
    };
    const L = ULS.filter(uy);
    const kitaya = KSIRA.map((k) => [k, L.filter((u) => u.kt === k)]).filter(([, l]) => l.length);
    $('#ekran').innerHTML = `
      <div class="arac"><label class="ara">🔎<input id="ulkeAra" type="search" placeholder="${T('Ülke ya da şehir ara', 'Search a country or city')}" value="${esc(durum.ulkeAra)}" autocomplete="off"></label></div>
      <div class="h-ust" style="padding-top:2px"><div class="secenek">${[['tumu', T('Tümü', 'All')], ['gittim', `${T('Gittiklerim', 'Visited')} · ${H.kodlar.length}`], ['hayal', `${T('Hayalim', 'Wish list')} · ${H.hayal.length}`]].map(([k, a]) => `<button data-uf="${k}" class="${f === k ? 'on' : ''}">${a}</button>`).join('')}</div></div>
      ${durum.ulkeAra.trim().length >= 2 ? (() => { const L = dunyaAra(durum.ulkeAra, 5); return L.length ? `<div class="u-bas"><span>${T('Şehirler', 'Cities')}</span><b>${T('dokun, ekle', 'tap to add')}</b></div><div class="liste-kutu">${L.map((x) => { const var_ = H.gittim.get(x[2])?.sehir.has(x[1]);
        return `<div class="u-satir ${var_ ? 'g' : ''}"><span class="bayrak">${bayrak(x[2])}</span><div class="ad" data-ulke="${x[2]}"><b>${esc(sehirAdi(x[2], x[1]))}</b><small>${esc(ua(U[x[2]]))}${x[3] ? ' · ' + nufus(x[3]) : ''}</small></div><button class="isaret ok ${var_ ? 'on' : ''}" data-u-sehir="${x[2]}|${esc(x[1])}" aria-label="${T('Gittim', 'Visited')}">✓</button></div>`; }).join('')}</div>` : ''; })() : ''}
      <div id="ulkeListe">${kitaya.map(([k, l]) => {
        const n = l.filter((u) => H.gittim.has(u.k)).length;
        return `<div class="u-bas"><span>${KITA[k]}</span><b>${n}/${l.length}</b></div><div class="liste-kutu">${l.map(satir).join('')}</div>`; }).join('') ||
        `<div class="bos"><b>${T('Bulunamadı', 'Nothing found')}</b>${T('Başka bir ad dene.', 'Try another name.')}</div>`}</div>
      ${imzaKutu()}`;
    const inp = $('#ulkeAra');
    inp.oninput = () => { durum.ulkeAra = inp.value; const s = inp.selectionStart; ulkeler(); const n = $('#ulkeAra'); n.focus(); n.setSelectionRange(s, s); };
  }

  function bilgi() {
    $('#ekran').innerHTML = `
      <div class="bilgi-kutu"><h4>🌐 Dil · Language</h4><div class="secenek"><button data-dil="tr" class="${EN ? '' : 'on'}">🇹🇷 Türkçe</button><button data-dil="en" class="${EN ? 'on' : ''}">🇬🇧 English</button></div></div>
      <div class="bilgi-kutu"><h4>🧳 ${T('Yedek', 'Backup')}</h4><p>${T('Bütün pasaportun (ülkeler, şehirler, seyahatler, notlar) tek bir dosya olur. Telefon değiştirince ya da uygulamayı silmeden önce yedek al; dosyayı kendine e-postayla gönderebilir ya da Dosyalar’a kaydedebilirsin.', 'Your whole passport (countries, cities, trips, notes) becomes a single file. Back up before changing phones or deleting the app; email the file to yourself or save it to Files.')}</p>
        <div class="rh-dugmeler"><button class="btn" data-yedek="1">⬇ ${T('Yedekle', 'Back up')}</button><button class="btn sec" data-geri="1">⬆ ${T('Geri yükle', 'Restore')}</button></div></div>
      <div class="bilgi-kutu"><h4>🖼️ ${T('Gezi kartı', 'Travel card')}</h4><p>${T('Haritan ve sayıların tek bir resimde; istediğin yerde paylaş.', 'Your map and numbers in one picture; share it anywhere.')}</p><button class="btn tur" data-kart="1">${T('Gezi kartını paylaş', 'Share travel card')}</button></div>
      <div class="bilgi-kutu"><h4>🏠 ${T('Ev ülkem', 'Home country')}</h4><p>${T('Ev ülken haritada altın renkle görünür ve sayıya dahil edilir.', 'Your home country shows in gold on the map and counts towards your total.')}</p>
        <select class="girdi" id="evSec"><option value="">— ${T('Yok', 'None')} —</option>${ULS.filter((u) => u.s).map((u) => `<option value="${u.k}" ${u.k === V.ev ? 'selected' : ''}>${esc(ua(u))}</option>`).join('')}</select></div>
      <div class="bilgi-kutu"><h4>${T('Gezi Pasaportu nedir?', 'What is Travel Passport?')}</h4><p>${T('Gezdiğin ülkeleri ve şehirleri, seyahatlerinin tarihini ve anılarını tutan kişisel bir pasaport. Üyelik yok, reklam yok, internet gerekmez; bilgilerin yalnız bu telefonda kalır.', 'A personal passport for the countries and cities you have visited, with your trip dates and memories. No sign-up, no ads, no internet needed; your data stays on this phone.')}</p>
        <p class="kaynak">${T('Kaynaklar: ülke sınırları Natural Earth (kamu malı) · şehirler GeoNames (CC BY 4.0, geonames.org) · ülke adları countries-list ve i18n-iso-countries (MIT). Harita sınırları bilgi amaçlıdır.', 'Sources: borders Natural Earth (public domain) · cities GeoNames (CC BY 4.0, geonames.org) · country names countries-list and i18n-iso-countries (MIT). Map borders are for information only.')}</p></div>
      ${imzaKutu()}`;
    $('#evSec').onchange = (e) => { V.ev = e.target.value; kaydet(); yenile(); toast(V.ev ? T('Ev ülken: ', 'Home country: ') + ua(U[V.ev]) : T('Ev ülkesi kaldırıldı', 'Home country removed')); };
  }

  const imzaKutu = () => `<div class="imza-kutu bilgi-kutu" style="box-shadow:none;background:none">Bir <b>Mr. Anduv!</b> yapımıdır.</div>`;

  function goster() {
    document.querySelectorAll('#tabbar button').forEach((b) => b.classList.toggle('on', b.dataset.s === durum.ekran));
    $('#fab').hidden = !['pasaport', 'seyahat'].includes(durum.ekran) || (!V.geziler.length && durum.ekran === 'seyahat');
    ({ pasaport, harita, seyahat, ulkeler, bilgi })[durum.ekran]();
  }
  const git = (s) => { durum.ekran = s; window.scrollTo(0, 0); goster(); };

  // ── alt sayfalar ──
  function sheet(html) { $('#sheetIn').innerHTML = html; $('#sheet').hidden = false; $('#sheetIn').scrollTop = 0; }
  function kapat() { $('#sheet').hidden = true; $('#sheetIn').innerHTML = ''; }
  function toast(m) { const t = $('#toast'); t.textContent = m; t.hidden = false; clearTimeout(t._t); t._t = setTimeout(() => (t.hidden = true), 2200); }

  function sehirOneri(k, q, haric = []) {
    const L = window.SEHIRLER?.[k] || [], a = katla(q); if (!a) return [];
    const h = new Set(haric.map(katla)), out = [];
    const ad = (c) => katla(c[0]) + '|' + katla(c[4] || '');
    for (const c of L) { const n = ad(c); if (!h.has(katla(c[0])) && (katla(c[0]).startsWith(a) || katla(c[4] || '').startsWith(a))) { out.push(c); if (out.length >= 6) break; } }
    if (out.length < 6) for (const c of L) { const n = ad(c); if (!h.has(katla(c[0])) && !out.includes(c) && n.includes(a)) { out.push(c); if (out.length >= 6) break; } }
    return out;
  }
  // ── dünya çapında şehir arama: şehri yazarsın, ülkesini uygulama bulur ──
  let DIZIN = null;
  const dizin = () => {
    if (DIZIN || !window.SEHIRLER) return DIZIN;
    DIZIN = [];
    for (const [k, L] of Object.entries(window.SEHIRLER)) if (U[k]) for (const c of L) { DIZIN.push([katla(c[0]), c[0], k, c[3]]); for (const o of [c[4], ...(c[5] ? c[5].split(',').slice(0, 3) : [])]) if (o && o.trim() && katla(o) !== katla(c[0])) DIZIN.push([katla(o.trim()), c[0], k, c[3]]); }
    DIZIN.sort((a, b) => b[3] - a[3]);   // kalabalık şehir önce: "Paris" yazınca önce Fransa'daki Paris
    return DIZIN;
  };
  function dunyaAra(q, n = 8) {
    const a = katla(q.trim()); if (a.length < 2 || !dizin()) return [];
    const bas = [], ic = [], gor = new Set();
    for (const x of DIZIN) {
      const anahtar = x[2] + '|' + x[1]; if (gor.has(anahtar)) continue;
      if (x[0].startsWith(a)) { bas.push(x); gor.add(anahtar); if (bas.length >= n) break; }
      else if (ic.length < n && a.length >= 3 && x[0].includes(a)) { ic.push(x); gor.add(anahtar); }
    }
    return [...bas, ...ic].slice(0, n);
  }
  const ulkeAra = (q, haric = new Set(), n = 4) => {
    const a = katla(q.trim()); if (!a) return [];
    return UL.filter((u) => !haric.has(u.k) && (katla(u.a).startsWith(a) || katla(u.en).startsWith(a))).slice(0, n);
  };
  function sehirEkle(k, ad) {
    const y = (V.ulkeler[k] ||= {});
    const yeniUlke = !H.gittim.has(k);
    y.s = [...new Set([...(y.s || []).map((s) => kanon(k, s)), kanon(k, ad)])]; if (!y.d || y.d === 'h') y.d = 'g';
    kaydet(); yenile();
    return yeniUlke;
  }
  // "Gittiğim şehirler" ekranı: art arda şehir yazıp eklenir
  let eklenen = [];
  function sehirSayfasi() {
    eklenen = [];
    sheet(`<div class="s-bas"><h2>${T('Gittiğim şehirler', 'Cities I have visited')}</h2><button data-kapat aria-label="${T('Kapat', 'Close')}">✕</button></div>
      <div class="alan"><label>${T('Şehir yaz, listeden seç', 'Type a city, pick from the list')}</label>
        <input type="text" id="dSehir" placeholder="${T('ör. Paris, Roma, Kyoto', 'e.g. Paris, Rome, Kyoto')}" autocomplete="off" enterkeyhint="search">
        <div class="oneri" id="dOneri"></div>
        <p class="ipucu-yazi">${T('Ülkeyi ve haritayı uygulama kendisi işaretler. Aynı adlı şehirlerde ülkesine bak (Paris · Fransa / Paris · ABD).', 'The app marks the country and the map for you. For cities with the same name, check the country (Paris · France / Paris · United States).')}</p></div>
      <div class="alan" id="dEklenen"></div>`);
    const inp = $('#dSehir'), on = $('#dOneri');
    const ciz = () => {
      const q = inp.value.trim(), L = dunyaAra(q);
      on.innerHTML = L.map((x) => `<button data-d-ekle="${x[2]}|${esc(x[1])}"><span><span class="bayrak" style="font-size:18px">${bayrak(x[2])}</span> <b>${esc(sehirAdi(x[2], x[1]))}</b> · ${esc(ua(U[x[2]]))}</span><small>${nufus(x[3])}</small></button>`).join('')
        + (q.length >= 2 ? ulkeAra(q, new Set(), 2).map((u) => `<button data-d-ulke="${u.k}"><span><span class="bayrak" style="font-size:18px">${bayrak(u.k)}</span> ${esc(ua(u))} <small style="display:inline">${T('(yalnız ülke)', '(country only)')}</small></span><small>${T('ülke', 'country')}</small></button>`).join('') : '');
    };
    inp.oninput = ciz;
    on.onclick = (e) => {
      const b = e.target.closest('button'); if (!b) return;
      let k, ad;
      if (b.dataset.dEkle) { [k, ad] = b.dataset.dEkle.split('|'); const yeni = sehirEkle(k, ad); eklenen.unshift([k, ad]); const g = sehirAdi(k, ad); toast(yeni ? T(`${g} · ${ua(U[k])} pasaportuna eklendi 🛂`, `${g} · ${ua(U[k])} stamped in your passport 🛂`) : T(`${g} eklendi`, `${g} added`)); }
      else { k = b.dataset.dUlke; const y = (V.ulkeler[k] ||= {}); const yeni = !H.gittim.has(k); y.d = 'g'; kaydet(); yenile(); eklenen.unshift([k, '']); toast(yeni ? T(`${ua(U[k])} · damga basıldı 🛂`, `${ua(U[k])} · stamped 🛂`) : T(ua(U[k]) + ' zaten pasaportunda', ua(U[k]) + ' is already in your passport')); }
      inp.value = ''; on.innerHTML = ''; inp.focus();
      $('#dEklenen').innerHTML = `<label>${T('Az önce eklenenler', 'Just added')} · ${eklenen.length}</label><div class="cip-yaz">${eklenen.map(([k, a]) => `<span class="cip pasif"><span class="bayrak" style="font-size:15px">${bayrak(k)}</span> ${esc(a ? sehirAdi(k, a) : ua(U[k]))}</span>`).join('')}</div>`;
      goster();
    };
    setTimeout(() => inp.focus(), 250);
  }
  const nufus = (p) => p >= 1000 ? ondalik(Math.round(p / 100) / 10) + T(' mn', 'M') : p ? p + T(' bin', 'K') : '';

  function ulkeSayfasi(k) {
    const u = U[k]; if (!u) return;
    const d = durumu(k), o = H.gittim.get(k), x = V.ulkeler[k] || {};
    const elle = (x.s || []).map((s) => kanon(k, s)), gSeh = new Set(); o?.geziler.forEach((g) => g.yerler.filter((p) => p.u === k).forEach((p) => p.s.forEach((s) => gSeh.add(kanon(k, s)))));
    const geziler = (o?.geziler || []).sort((a, b) => gSira(b).localeCompare(gSira(a)));
    sheet(`<div class="s-bas"><h2>${esc(ua(u))}</h2><button data-kapat aria-label="${T('Kapat', 'Close')}">✕</button></div>
      <div class="u-kapak"><span class="bayrak">${bayrak(k)}</span><div><h3>${esc(ua(u))}</h3><small>${esc([ub(u) && T('Başkent ', 'Capital: ') + ub(u), KITA[u.kt]].filter(Boolean).join(' · '))}</small></div></div>
      <div class="durum"><button class="ok ${d === 'g' || d === 'e' ? 'on' : ''}" data-u-gittim="${k}">✓ ${T('Gittim', 'Visited')}</button><button class="hy ${d === 'h' ? 'on' : ''}" data-u-hayal="${k}">☆ ${T('Hayalim', 'Wish list')}</button>${d === 'e' ? `<button class="ev on" disabled>🏠 ${T('Ev', 'Home')}</button>` : ''}</div>
      ${o ? `<div class="damga-tek">${damga(k, o.ilk && !o.ilk.startsWith('0000') ? o.ilk : '', 150)}</div>
      <div class="tiles" style="grid-template-columns:repeat(3,1fr)"><div class="tile"><b>${o.geziler.length}</b><span>${T('Seyahat', 'Trips')}</span></div><div class="tile"><b>${o.gun}</b><span>${T('Gün', 'Days')}</span></div><div class="tile"><b>${o.sehir.size}</b><span>${T('Şehir', 'Cities')}</span></div></div>` : ''}
      <div class="alan"><label>${T('Şehirler', 'Cities')}</label>
        <div class="cip-yaz">${[...gSeh].map((s) => `<span class="cip pasif">${esc(sehirAdi(k, s))}</span>`).join('')}${[...new Set(elle)].filter((s) => !gSeh.has(s)).map((s) => `<span class="cip">${esc(sehirAdi(k, s))}<button data-sehir-sil="${esc(s)}" aria-label="${T('Kaldır', 'Remove')}">✕</button></span>`).join('')}</div>
        <input type="text" id="sehirGir" placeholder="${T('Şehir ekle', 'Add a city')} (${T('ör.', 'e.g.')} ${esc(sehirAdi(k, (window.SEHIRLER?.[k] || [])[0]?.[0] || '') || T('başkent', 'capital'))})" autocomplete="off" enterkeyhint="done">
        <div class="oneri" id="sehirOneri"></div>
        <p class="ipucu-yazi">${T("Listede yoksa yazıp Ekle'ye dokun; küçük kasabalar da olur.", 'Not in the list? Type it and tap Add; small towns work too.')}</p></div>
      ${geziler.length ? `<div class="alan"><label>${T('Seyahatler', 'Trips')}</label>${geziler.map((g) => `<div class="gezi" data-gezi="${g.id}" style="margin:0 0 8px"><div class="g-in"><h4>${esc(gAd(g))}</h4><div class="g-alt">${esc(tarihYaz(g))}${gun(g) ? ' · ' + gun(g) + T(' gün', ' days') : ''}</div></div></div>`).join('')}</div>` : ''}
      <div class="alan"><label>${T('Notum', 'My note')}</label><textarea id="ulkeNot" placeholder="${T('Bu ülkede en çok neyi sevdin?', 'What did you love most here?')}">${esc(x.n || '')}</textarea></div>
      <div class="alan"><button class="btn tur" data-yeni-ulke="${k}" style="width:100%;justify-content:center;height:48px">＋ ${esc(T(ua(u) + ' seyahati ekle', 'Add a trip to ' + ua(u)))}</button></div>`);
    const inp = $('#sehirGir'), on = $('#sehirOneri');
    const ekle = (ad) => {
      ad = ad.trim(); if (!ad) return;
      const y = (V.ulkeler[k] ||= {}); y.s = [...new Set([...(y.s || []).map((s) => kanon(k, s)), kanon(k, ad)])]; if (!y.d) y.d = 'g';
      kaydet(); yenile(); ulkeSayfasi(k); goster(); toast(sehirAdi(k, ad) + T(' eklendi', ' added')); setTimeout(() => $('#sehirGir')?.focus(), 50);
    };
    const oner = () => {
      const q = inp.value.trim();
      const L = sehirOneri(k, q, [...gSeh, ...elle]);
      on.innerHTML = (q ? `<button data-s-ekle="${esc(q)}"><b>${T(`＋ “${esc(q)}” ekle`, `＋ Add “${esc(q)}”`)}</b></button>` : '') + L.map((c) => `<button data-s-ekle="${esc(c[0])}">${esc(EN ? c[4] || c[0] : c[0])}<small>${nufus(c[3])}</small></button>`).join('');
    };
    inp.oninput = oner;
    inp.onkeydown = (e) => { if (e.key === 'Enter') { e.preventDefault(); ekle(inp.value); } };
    on.onclick = (e) => { const b = e.target.closest('[data-s-ekle]'); if (b) ekle(b.dataset.sEkle); };
    $('#ulkeNot').onchange = (e) => { (V.ulkeler[k] ||= {}).n = e.target.value; kaydet(); };
  }

  function geziSayfasi(id) {
    const g = V.geziler.find((x) => x.id === id); if (!g) return;
    sheet(`<div class="s-bas"><h2>${esc(gAd(g))}</h2><button data-kapat aria-label="${T('Kapat', 'Close')}">✕</button></div>
      <div class="d-in">
        <div class="sonfiyat"><span class="kick">${esc(tarihYaz(g))}</span><div class="sf">${gun(g) ? gun(g) + ` <small style="font-size:20px">${T('gün', 'days')}</small>` : '✈'}</div>
          <small>${say(g.yerler.length, 'ülke', 'country', 'countries')} · ${say(g.yerler.reduce((t, p) => t + p.s.length, 0), 'şehir', 'city', 'cities')}${g.kim ? ' · ' + esc(kimAdi(g.kim)) : ''}</small>${g.puan ? `<span class="damga">${'★'.repeat(g.puan)}</span>` : ''}</div>
        ${g.yerler.map((p) => `<div class="yer-kart" data-ulke="${p.u}" style="cursor:pointer"><div class="yk-bas"><span class="bayrak">${bayrak(p.u)}</span><span>${esc(ua(U[p.u]) || p.u)}</span><i style="font-style:normal;color:var(--mute)">›</i></div>
          ${p.s.length ? `<div class="cip-yaz">${p.s.map((s) => `<span class="cip pasif">${esc(sehirAdi(p.u, s))}</span>`).join('')}</div>` : ''}</div>`).join('')}
        ${g.not ? `<div class="bilgi-kutu" style="margin:10px 0"><h4>${T('Notlarım', 'My notes')}</h4><p style="white-space:pre-wrap">${esc(g.not)}</p></div>` : ''}
        <div class="d-btn"><button class="btn" data-duzenle="${g.id}">✎ ${T('Düzenle', 'Edit')}</button><button class="btn sec" data-gezi-paylas="${g.id}">↗ ${T('Paylaş', 'Share')}</button></div>
      </div>`);
  }

  // seyahat formu
  let F = null;
  function geziFormu(id, ulke) {
    const g = id ? V.geziler.find((x) => x.id === id) : null;
    F = g ? JSON.parse(JSON.stringify(g)) : { id: 'g' + Date.now().toString(36), ad: '', bas: '', bit: '', yil: '', yerler: ulke ? [{ u: ulke, s: [] }] : [], kim: '', puan: 0, not: '', silOnay: false };
    F.yeni = !g; formCiz();
  }
  function formCiz() {
    const yil = new Date().getFullYear();
    sheet(`<div class="s-bas"><h2>${F.yeni ? T('Yeni seyahat', 'New trip') : T('Seyahati düzenle', 'Edit trip')}</h2><button data-kapat aria-label="${T('Kapat', 'Close')}">✕</button></div>
      <div class="alan"><label>${T('Nereye?', 'Where?')}</label>
        <div id="yerler">${F.yerler.map((p, i) => `<div class="yer-kart"><div class="yk-bas"><span class="bayrak">${bayrak(p.u)}</span><span>${esc(ua(U[p.u]) || p.u)}</span><button data-yer-sil="${i}" aria-label="${T('Ülkeyi çıkar', 'Remove country')}">✕</button></div>
          <div class="cip-yaz">${p.s.map((s, j) => `<span class="cip">${esc(sehirAdi(p.u, s))}<button data-f-sehir-sil="${i}:${j}" aria-label="${T('Kaldır', 'Remove')}">✕</button></span>`).join('')}</div>
          <input type="text" class="girdi" data-f-sehir="${i}" placeholder="${T('Şehir ekle', 'Add a city')}" autocomplete="off" enterkeyhint="done"><div class="oneri" data-f-oneri="${i}"></div></div>`).join('')}</div>
        <input type="text" class="girdi" id="fUlke" placeholder="${F.yerler.length ? T('＋ Bir şehir ya da ülke daha', '＋ Another city or country') : T('Şehir ya da ülke yaz (ör. Roma)', 'Type a city or country (e.g. Rome)')}" autocomplete="off">
        <div class="oneri" id="fUlkeOneri"></div></div>
      <div class="alan"><label>${T('Ne zaman?', 'When?')}</label>
        <div class="iki"><div><small>${T('Gidiş', 'From')}</small><input type="date" id="fBas" value="${esc(F.bas)}"></div><div><small>${T('Dönüş', 'To')}</small><input type="date" id="fBit" value="${esc(F.bit)}"></div></div>
        <div style="margin-top:8px"><small style="display:block;font-size:11.5px;color:var(--mute);margin:0 0 4px 4px;font-weight:700">${T('Tarihi hatırlamıyorsan yalnız yıl', 'Don’t remember the dates? Just the year')}</small>
        <select class="girdi" id="fYil"><option value="">—</option>${Array.from({ length: 70 }, (_, i) => yil - i).map((y) => `<option ${String(F.yil) === String(y) ? 'selected' : ''}>${y}</option>`).join('')}</select></div></div>
      <div class="alan"><label>${T('Seyahatin adı (isteğe bağlı)', 'Trip name (optional)')}</label><input type="text" id="fAd" value="${esc(F.ad)}" placeholder="${esc(gAd({ ...F, ad: '' }))}"></div>
      <div class="alan"><label>${T('Kiminle?', 'Who with?')}</label><div class="secenek" style="margin-bottom:8px">${KIM.map(([tr, en]) => `<button data-kim="${tr}" class="${F.kim === tr || F.kim === en ? 'on' : ''}">${T(tr, en)}</button>`).join('')}</div>
        <input type="text" id="fKim" value="${esc(kimAdi(F.kim))}" placeholder="${T('ya da yaz', 'or type')}"></div>
      <div class="alan"><label>${T('Puanım', 'My rating')}</label><div class="puan-sec">${[1, 2, 3, 4, 5].map((n) => `<button data-puan="${n}" class="${F.puan >= n ? 'on' : ''}">★</button>`).join('')}</div></div>
      <div class="alan"><label>${T('Notlarım', 'My notes')}</label><textarea id="fNot" placeholder="${T('Unutmak istemediklerin: yemekler, insanlar, anlar…', 'Things you don’t want to forget: food, people, moments…')}">${esc(F.not)}</textarea></div>
      <div class="f-alt">${F.yeni ? '' : `<button class="btn sil-btn ${F.silOnay ? 'onay' : ''}" data-f-sil="1">${F.silOnay ? T('Emin misin? Sil', 'Sure? Delete') : T('Sil', 'Delete')}</button>`}<button class="btn" data-kapat>${T('Vazgeç', 'Cancel')}</button><button class="btn tur" data-f-kaydet="1">${T('Kaydet', 'Save')}</button></div>`);
    const al = () => { F.ad = $('#fAd').value.trim(); F.bas = $('#fBas').value; F.bit = $('#fBit').value; F.yil = $('#fYil').value; F.kim = (() => { const v = $('#fKim').value.trim(); const x = KIM.find((k) => k[0] === v || k[1] === v); return x ? x[0] : v; })(); F.not = $('#fNot').value; };
    F.al = al;
    const uInp = $('#fUlke'), uOn = $('#fUlkeOneri');
    uInp.oninput = () => {
      const a = katla(uInp.value.trim()); if (!a) { uOn.innerHTML = ''; return; }
      const var_ = new Set(F.yerler.map((p) => p.u));
      const S = dunyaAra(uInp.value, 6).map((x) => `<button data-f-sehir-ekle="${x[2]}|${esc(x[1])}"><span><span class="bayrak" style="font-size:18px">${bayrak(x[2])}</span> <b>${esc(sehirAdi(x[2], x[1]))}</b> · ${esc(ua(U[x[2]]))}</span><small>${nufus(x[3])}</small></button>`).join('');
      const L = ULS.filter((u) => !var_.has(u.k) && (katla(u.a).startsWith(a) || katla(u.en).startsWith(a))).concat(ULS.filter((u) => !var_.has(u.k) && !katla(u.a).startsWith(a) && !katla(u.en).startsWith(a) && katla(u.a + ' ' + u.en + ' ' + u.b).includes(a))).slice(0, 6);
      uOn.innerHTML = S + L.slice(0, 3).map((u) => `<button data-f-ulke="${u.k}"><span><span class="bayrak" style="font-size:18px">${bayrak(u.k)}</span> ${esc(ua(u))}</span><small>${esc(KITA[u.kt] || '')}</small></button>`).join('');
    };
    document.querySelectorAll('[data-f-sehir]').forEach((inp) => {
      const i = +inp.dataset.fSehir, on = $(`[data-f-oneri="${i}"]`);
      const ekle = (ad) => { ad = kanon(F.yerler[i].u, ad.trim()); if (!ad) return; al(); const p = F.yerler[i]; if (!p.s.some((s) => kanon(p.u, s) === ad)) p.s.push(ad); formCiz(); setTimeout(() => $(`[data-f-sehir="${i}"]`)?.focus(), 30); };
      inp.oninput = () => { const q = inp.value.trim(); on.innerHTML = (q ? `<button data-x="${esc(q)}"><b>${T(`＋ “${esc(q)}” ekle`, `＋ Add “${esc(q)}”`)}</b></button>` : '') + sehirOneri(F.yerler[i].u, q, F.yerler[i].s).map((c) => `<button data-x="${esc(c[0])}">${esc(EN ? c[4] || c[0] : c[0])}<small>${nufus(c[3])}</small></button>`).join(''); };
      inp.onkeydown = (e) => { if (e.key === 'Enter') { e.preventDefault(); ekle(inp.value); } };
      on.onclick = (e) => { const b = e.target.closest('[data-x]'); if (b) ekle(b.dataset.x); };
    });
  }
  function formKaydet() {
    F.al();
    if (!F.yerler.length) { toast(T('En az bir şehir ya da ülke seç', 'Pick at least one city or country')); $('#fUlke').focus(); return; }
    if (F.bas && F.bit && F.bit < F.bas) { toast(T('Dönüş, gidişten önce olamaz', 'Return can’t be before departure')); return; }
    if (F.bas && !F.bit) F.bit = F.bas;
    const g = { id: F.id, ad: F.ad, bas: F.bas, bit: F.bit, yil: F.bas ? '' : (F.yil ? +F.yil : ''), yerler: F.yerler, kim: F.kim, puan: F.puan, not: F.not };
    const i = V.geziler.findIndex((x) => x.id === g.id);
    if (i >= 0) V.geziler[i] = g; else V.geziler.push(g);
    g.yerler.forEach((p) => { const y = (V.ulkeler[p.u] ||= {}); y.d = 'g'; });
    const yeniDamga = F.yeni ? g.yerler.filter((p) => !H.gittim.has(p.u)).length : 0;
    kaydet(); yenile(); kapat(); if (durum.ekran !== 'pasaport' && durum.ekran !== 'seyahat') durum.ekran = 'seyahat'; goster();
    toast(yeniDamga ? T(`Pasaportuna ${yeniDamga} yeni damga basıldı 🛂`, `${yeniDamga} new stamp${yeniDamga > 1 ? 's' : ''} in your passport 🛂`) : T('Seyahat kaydedildi', 'Trip saved'));
  }

  // ── yedek, geri yükleme, gezi kartı ──
  const C = () => window.Capacitor?.Plugins || {};
  const mobil = () => { try { const p = window.Capacitor?.getPlatform?.(); return p === 'ios' || p === 'android'; } catch (e) { return false; } };
  async function dosyaPaylas(ad, veri, tur, baslik, base64 = false) {
    const { Filesystem, Share } = C();
    if (mobil() && Filesystem && Share) {
      try {
        const r = await Filesystem.writeFile({ path: ad, data: veri, directory: 'CACHE', ...(base64 ? {} : { encoding: 'utf8' }) });
        await Share.share({ title: baslik, files: [r.uri], dialogTitle: baslik });
        return true;
      } catch (e) { if (/cancel/i.test(e?.message || '')) return true; }
    }
    const blob = base64 ? await (await fetch(`data:${tur};base64,${veri}`)).blob() : new Blob([veri], { type: tur });
    try { const f = new File([blob], ad, { type: tur }); if (navigator.canShare?.({ files: [f] })) { await navigator.share({ files: [f], title: baslik }); return true; } } catch (e) { if (e?.name === 'AbortError') return true; }
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = ad; document.body.appendChild(a); a.click(); a.remove();
    return true;
  }
  async function yedekle() {
    const t = new Date().toISOString().slice(0, 10);
    await dosyaPaylas(`gezi-pasaportu-yedek-${t}.json`, JSON.stringify({ uygulama: 'Gezi Pasaportu', tarih: new Date().toISOString(), veri: V }, null, 1), 'application/json', T('Gezi Pasaportu yedeği', 'Travel Passport backup'));
    toast(T('Yedek hazır: dosyayı güvenli bir yere kaydet', 'Backup ready: keep the file somewhere safe'));
  }
  function geriYukle() { const f = $('#dosya'); f.value = ''; f.click(); }
  $('#dosya').addEventListener('change', async (e) => {
    const f = e.target.files?.[0]; if (!f) return;
    try {
      const j = JSON.parse(await f.text()), v = j.veri || j;
      if (!v || !Array.isArray(v.geziler) || typeof v.ulkeler !== 'object') throw new Error('biçim');
      V = { surum: 1, ev: v.ev ?? 'TR', ulkeler: v.ulkeler, geziler: v.geziler };
      await kaydet(); yenile(); durum.ekran = 'pasaport'; goster();
      toast(T(`Geri yüklendi: ${H.kodlar.length} ülke, ${V.geziler.length} seyahat`, `Restored: ${H.kodlar.length} countries, ${V.geziler.length} trips`));
    } catch (err) { toast(T('Bu dosya bir Gezi Pasaportu yedeği değil', 'This file is not a Travel Passport backup')); }
  });

  async function geziKarti() {
    const W = 1080, Hh = 1350, cv = document.createElement('canvas'); cv.width = W; cv.height = Hh;
    const c = cv.getContext('2d');
    try { await document.fonts.load('900 60px "Barlow Condensed"'); await document.fonts.load('400 40px Pacifico'); await document.fonts.load('800 30px "DM Sans"'); } catch (e) {}
    const gr = c.createLinearGradient(0, 0, W, Hh); gr.addColorStop(0, '#123036'); gr.addColorStop(1, '#0b1e22'); c.fillStyle = gr; c.fillRect(0, 0, W, Hh);
    c.fillStyle = '#ffd23f'; c.font = '900 34px "DM Sans", sans-serif'; c.fillText(T('GEZİ PASAPORTU', 'TRAVEL PASSPORT'), 70, 110);
    c.fillStyle = '#fff'; c.font = '900 250px "Barlow Condensed", sans-serif'; c.fillText(String(H.kodlar.length), 64, 340);
    const gx = 70 + c.measureText(String(H.kodlar.length)).width + 30;
    c.font = '900 70px "Barlow Condensed", sans-serif'; c.fillText(T('ÜLKE', 'COUNTRIES'), gx, 260);
    c.fillStyle = '#9fc3bd'; c.font = '700 34px "DM Sans", sans-serif'; c.fillText(T(`dünyanın %${ondalik(Math.round(H.egemenSay / EGEMEN * 1000) / 10)}'i`, `${Math.round(H.egemenSay / EGEMEN * 1000) / 10}% of the world`), gx, 315);
    // harita
    const mx = 40, my = 420, mw = W - 80, s = mw / HR.w;
    c.save(); c.translate(mx, my); c.scale(s, s);
    c.fillStyle = '#1b4248'; c.fill(new Path2D(HR.kure));
    for (const k in HR.p) { const d = k[0] === '_' ? '' : durumu(k); c.fillStyle = d === 'g' ? '#2fb592' : d === 'e' ? '#ffd23f' : d === 'h' ? '#ed713c' : '#3f6469'; c.fill(new Path2D(HR.p[k])); }
    for (const u of UL) if (!u.h && u.m && H.gittim.has(u.k)) { c.fillStyle = '#2fb592'; c.beginPath(); c.arc(u.m[0], u.m[1], 4, 0, 7); c.fill(); }
    c.restore();
    // sayılar
    const kut = [[H.sehirSay, T('ŞEHİR', 'CITIES')], [H.kitalar.size + '/6', T('KITA', 'CONTINENTS')], [H.gun, T('GÜN YOLDA', 'DAYS AWAY')], [V.geziler.length, T('SEYAHAT', 'TRIPS')]];
    kut.forEach(([n, a], i) => { const x = 70 + i * 245; c.fillStyle = '#ffd23f'; c.font = '900 92px "Barlow Condensed", sans-serif'; c.fillText(String(n), x, 1050); c.fillStyle = '#cfe9e4'; c.font = '800 26px "DM Sans", sans-serif'; c.fillText(a, x, 1092); });
    // bayraklar
    c.font = '46px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
    H.kodlar.slice(0, 18).forEach((k, i) => {
      const x = 70 + i * 54;
      if (k !== 'XN') { c.fillText(bayrakMetin(k), x, 1180); return; }
      c.fillStyle = '#fff'; c.fillRect(x, 1146, 46, 31); c.fillStyle = '#e30a17'; c.fillRect(x, 1149, 46, 3); c.fillRect(x, 1171, 46, 3);
      c.beginPath(); c.arc(x + 19, 1161.5, 6.8, 0, 7); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.arc(x + 21, 1161.5, 5.4, 0, 7); c.fill();
      c.fillStyle = '#e30a17'; c.beginPath(); c.arc(x + 27, 1161.5, 2.4, 0, 7); c.fill();
    });
    c.fillStyle = '#9fc3bd'; c.font = '700 28px "DM Sans", sans-serif'; c.fillText('Bir', 70, 1280);
    c.fillStyle = '#ed713c'; c.font = '400 40px Pacifico, cursive'; c.fillText('Mr. Anduv!', 122, 1282); const mw2 = c.measureText('Mr. Anduv!').width;
    c.fillStyle = '#9fc3bd'; c.font = '700 28px "DM Sans", sans-serif'; c.fillText('yapımıdır.', 122 + mw2 + 12, 1280);
    const b64 = cv.toDataURL('image/png').split(',')[1];
    await dosyaPaylas('gezi-kartim.png', b64, 'image/png', T('Gezi kartım', 'My travel card'), true);
  }
  function geziPaylas(id) {
    const g = V.geziler.find((x) => x.id === id); if (!g) return;
    const metin = `${gAd(g)} · ${tarihYaz(g)}${gun(g) ? ' · ' + gun(g) + T(' gün', ' days') : ''}\n` + g.yerler.map((p) => `${bayrakMetin(p.u)} ${ua(U[p.u])}${p.s.length ? ': ' + p.s.map((s) => sehirAdi(p.u, s)).join(', ') : ''}`).join('\n') + (g.puan ? '\n' + '★'.repeat(g.puan) : '') + T('\n— Gezi Pasaportu', '\n— Travel Passport');
    const { Share } = C();
    (Share?.share ? Share.share({ title: gAd(g), text: metin }) : navigator.share ? navigator.share({ text: metin }) : navigator.clipboard.writeText(metin).then(() => toast(T('Kopyalandı', 'Copied')))).catch(() => {});
  }

  // ── olaylar ──
  const durumDegis = (k, d) => {
    const y = (V.ulkeler[k] ||= {});
    if (d === 'g') {
      if (H.gittim.has(k) && y.d === 'g') {
        const o = H.gittim.get(k);
        if (o.geziler.length) { toast(T('Bu ülke bir seyahatinde var; önce seyahatten çıkar', 'This country is in one of your trips; remove it from the trip first')); return; }
        delete y.d; if (!y.s?.length && !y.n) delete V.ulkeler[k]; toast(ua(U[k]) + T(' çıkarıldı', ' removed'));
      } else { y.d = 'g'; toast(T(`${ua(U[k])} · damga basıldı 🛂`, `${ua(U[k])} · stamped 🛂`)); }
    } else {
      if (y.d === 'h') { delete y.d; if (!y.s?.length && !y.n) delete V.ulkeler[k]; }
      else if (H.gittim.has(k)) { toast(T('Zaten gittin; hayal listesi gidilmeyenler için', 'You’ve been there; the wish list is for places you haven’t')); return; }
      else { y.d = 'h'; toast(T(ua(U[k]) + ' hayal listende ☆', ua(U[k]) + ' added to your wish list ☆')); }
    }
    kaydet(); yenile();
  };

  document.addEventListener('click', (e) => {
    const t = e.target.closest('button,[data-git],[data-ulke],[data-gezi],[data-kita]'); if (!t) return;
    const d = t.dataset;
    if (t.closest('#tabbar')) { git(d.s); return; }
    if (d.kapat !== undefined) { kapat(); return; }
    if (d.git) { git(d.git); return; }
    if (d.yeni) { geziFormu(); return; }
    if (d.yeniUlke) { geziFormu(null, d.yeniUlke); return; }
    if (d.gittim) { durumDegis(d.gittim, 'g'); ulkeler(); return; }
    if (d.hayal) { durumDegis(d.hayal, 'h'); ulkeler(); return; }
    if (d.uGittim) { durumDegis(d.uGittim, 'g'); ulkeSayfasi(d.uGittim); goster(); return; }
    if (d.uHayal) { durumDegis(d.uHayal, 'h'); ulkeSayfasi(d.uHayal); goster(); return; }
    if (d.sehirSil) { const k = $('#sheetIn [data-yeni-ulke]')?.dataset.yeniUlke; const y = V.ulkeler[k]; if (y?.s) { y.s = y.s.filter((s) => kanon(k, s) !== d.sehirSil); kaydet(); yenile(); ulkeSayfasi(k); goster(); } return; }
    if (d.ulke && !t.closest('.oneri')) { ulkeSayfasi(d.ulke); return; }
    if (d.gezi) { geziSayfasi(d.gezi); return; }
    if (d.kita) { durum.ulkeFiltre = 'tumu'; durum.ulkeAra = ''; git('ulkeler'); setTimeout(() => [...document.querySelectorAll('.u-bas span')].find((s) => s.textContent === KITA[d.kita])?.scrollIntoView({ block: 'start' }), 50); return; }
    if (d.uf) { durum.ulkeFiltre = d.uf; ulkeler(); return; }
    if (d.hf) { durum.haritaFiltre = d.hf; harita(); return; }
    if (d.sehir) { durum.sehirGoster = !durum.sehirGoster; harita(); return; }
    if (d.duzenle) { geziFormu(d.duzenle); return; }
    if (d.geziPaylas) { geziPaylas(d.geziPaylas); return; }
    if (d.yedek) { yedekle(); return; }
    if (d.geri) { geriYukle(); return; }
    if (d.kart) { geziKarti(); return; }
    if (d.sehirler) { sehirSayfasi(); return; }
    if (d.uSehir) { const [k, ad] = d.uSehir.split('|'); const yeni = sehirEkle(k, ad); const g = sehirAdi(k, ad); toast(yeni ? T(`${g} · ${ua(U[k])} pasaportuna eklendi 🛂`, `${g} · ${ua(U[k])} stamped in your passport 🛂`) : T(`${g} eklendi`, `${g} added`)); ulkeler(); return; }
    if (d.dil) { dilSec(d.dil); return; }
    // form
    if (F && $('#sheetIn [data-f-kaydet]')) {
      if (d.fSehirEkle) { F.al(); const [k, ad] = d.fSehirEkle.split('|'); let p = F.yerler.find((x) => x.u === k); if (!p) F.yerler.push(p = { u: k, s: [] }); if (!p.s.includes(ad)) p.s.push(ad); formCiz(); setTimeout(() => $('#fUlke')?.focus(), 30); return; }
      if (d.fUlke) { F.al(); F.yerler.push({ u: d.fUlke, s: [] }); formCiz(); setTimeout(() => $(`[data-f-sehir="${F.yerler.length - 1}"]`)?.focus(), 30); return; }
      if (d.yerSil) { F.al(); F.yerler.splice(+d.yerSil, 1); formCiz(); return; }
      if (d.fSehirSil) { F.al(); const [i, j] = d.fSehirSil.split(':').map(Number); F.yerler[i].s.splice(j, 1); formCiz(); return; }
      if (d.kim) { F.al(); F.kim = F.kim === d.kim ? '' : d.kim; formCiz(); return; }
      if (d.puan) { F.al(); F.puan = F.puan === +d.puan ? 0 : +d.puan; formCiz(); return; }
      if (d.fKaydet) { formKaydet(); return; }
      if (d.fSil) { if (!F.silOnay) { F.al(); F.silOnay = true; formCiz(); return; } V.geziler = V.geziler.filter((x) => x.id !== F.id); kaydet(); yenile(); kapat(); goster(); toast(T('Seyahat silindi', 'Trip deleted')); return; }
    }
  });
  $('#fab').onclick = () => geziFormu();
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('#sheet').hidden) kapat(); });

  // ── dil seçimi: ilk açılışta tam ekran sorulur ──
  async function dilSec(d) {
    if (Pref) await kayit.koy('gp.dil', d);   // telefonda kalıcı yedek
    try { localStorage.setItem('gp.dil', d); } catch (e) {}
    location.reload();
  }
  function dilSor() {
    const el = document.createElement('div'); el.className = 'dil-ekran';
    el.innerHTML = `<div class="dil-kutu"><div class="crest dil-crest">${$('.crest').innerHTML}</div>
      <h2>Gezi Pasaportu<small>Travel Passport</small></h2>
      <p>Dil seçin<br><span>Choose your language</span></p>
      <button class="btn tur" data-dil="tr"><span class="bayrak">🇹🇷</span> Türkçe</button>
      <button class="btn" data-dil="en"><span class="bayrak">🇬🇧</span> English</button>
      <div class="imza-kutu">Bir <b>Mr. Anduv!</b> yapımıdır.</div></div>`;
    document.body.appendChild(el);
  }
  function sabitMetinler() {
    $('#hBaslik').textContent = T('Pasaportum', 'My Passport');
    document.title = T('Gezi Pasaportu', 'Travel Passport');
    const ad = { pasaport: T('Pasaport', 'Passport'), harita: T('Harita', 'Map'), seyahat: T('Seyahatler', 'Trips'), ulkeler: T('Ülkeler', 'Countries'), bilgi: T('Daha', 'More') };
    document.querySelectorAll('#tabbar button').forEach((b) => { const s = b.querySelector('span'); if (s) s.textContent = ad[b.dataset.s]; });
    $('#fab').setAttribute('aria-label', T('Seyahat ekle', 'Add trip'));
  }

  // ── başlat ──
  (async () => {
    if (!DIL) {   // localStorage silinmiş olabilir: Preferences'ta varsa geri al
      const d = await kayit.al('gp.dil', null);
      if (d === 'tr' || d === 'en') { try { localStorage.setItem('gp.dil', d); } catch (e) {} location.reload(); return; }
      dilSor();
    }
    sabitMetinler();
    const v = await kayit.al(ANAHTAR, null);
    if (v && v.ulkeler) V = { ...V, ...v };
    yenile(); goster();
    window.Capacitor?.Plugins?.SplashScreen?.hide?.();
    // şehir verisi (defer) yüklenince şehir adlarını tekilleştirip yeniden çiz
    if (!window.SEHIRLER) window.addEventListener('load', () => { yenile(); if ($('#sheet').hidden) goster(); }, { once: true });
  })();
  window.GP = { get V() { return V; }, set V(x) { V = x; kaydet(); yenile(); goster(); } };   // test için
})();
