/* Gezi Pasaportu — Bir Mr. Anduv! yapımıdır.
   Gezdiğin ülkeler, şehirler ve seyahatler; harita, damga ve istatistik. Her şey yalnız telefonda tutulur, internet gerekmez.
   Veri: ülkeler (countries-list, i18n-iso-countries · MIT), harita (Natural Earth · kamu malı), şehirler (GeoNames · CC BY 4.0). */
(() => {
  'use strict';
  const $ = (s, el = document) => el.querySelector(s);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const katla = (s) => String(s || '').toLocaleLowerCase('tr-TR').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ı/g, 'i');
  const buyuk = (s) => String(s || '').toLocaleUpperCase('tr-TR');
  const NF = new Intl.NumberFormat('tr-TR');
  const AY = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
  const AYK = AY.map((a) => buyuk(a.slice(0, 3)));
  const KITA = { EU: 'Avrupa', AS: 'Asya', AF: 'Afrika', NA: 'Kuzey Amerika', SA: 'Güney Amerika', OC: 'Okyanusya' };
  const KRENK = { EU: '#1f4e8c', AS: '#b3261e', AF: '#a0571b', NA: '#1f7a4d', SA: '#6b3fa0', OC: '#0e7c86' };
  const KSIRA = ['EU', 'AS', 'AF', 'NA', 'SA', 'OC'];

  const UL = window.ULKELER || [];
  const U = Object.fromEntries(UL.map((u) => [u.k, u]));
  const EGEMEN = UL.filter((u) => u.s).length;   // 195
  const bayrak = (k) => k.length === 2 ? String.fromCodePoint(...[...k].map((c) => 127397 + c.charCodeAt(0))) : '🏳️';

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
  const gAd = (g) => g.ad || g.yerler.map((y) => U[y.u]?.a || y.u).join(' · ') || 'Seyahat';

  function hesapla() {
    const gittim = new Map();   // kod → { geziler: [], sehir: Set, gun, ilk, son }
    const ekle = (k) => { if (!gittim.has(k)) gittim.set(k, { geziler: [], sehir: new Set(), gun: 0, ilk: null, son: null }); return gittim.get(k); };
    for (const [k, x] of Object.entries(V.ulkeler)) {
      if (x.d === 'g' || x.s?.length) { const o = ekle(k); (x.s || []).forEach((s) => o.sehir.add(s)); }
    }
    if (V.ev && U[V.ev]) ekle(V.ev);
    const tarihler = new Set();
    for (const g of V.geziler) {
      const n = gun(g);
      if (g.bas) { const a = new Date(g.bas); for (let i = 0; i < n && i < 400; i++) tarihler.add(new Date(+a + i * 864e5).toISOString().slice(0, 10)); }
      for (const y of g.yerler) {
        const o = ekle(y.u); o.geziler.push(g); y.s.forEach((s) => o.sehir.add(s));
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
      ? `<b>${H.kodlar.length}</b> ülke · <b>${H.sehirSay}</b> şehir · <b>${H.kitalar.size}</b> kıta`
      : 'Gezdiğin her ülke bir damga';
  }

  const tarihYaz = (g) => {
    if (!g.bas) return g.yil ? String(g.yil) : 'Tarih yok';
    const a = new Date(g.bas), b = new Date(g.bit || g.bas);
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
    const ad = buyuk(u.a), uzun = ad.length > 11;
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
    return `<svg viewBox="0 0 120 120" width="${boyut}" height="${boyut}" aria-label="${esc(u.a)} damgası">
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
        for (const s of o.sehir) { const c = L.find((x) => katla(x[0]) === katla(s)); if (c) sehir += `<circle class="sehir" cx="${c[1]}" cy="${c[2]}" r="2.4"><title>${esc(s)}</title></circle>`; }
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
        <h3>Pasaportun hazır</h3>
        <p>Gezdiğin ülkeleri işaretle, her birine bir damga basalım. Sonra seyahatlerini tarih, şehir ve notlarıyla ekle; gerisini biz hatırlayalım.</p>
        <button class="btn tur" data-git="ulkeler">✓ Gittiğim ülkeleri işaretle</button>
        <button class="btn" data-yeni="1">＋ İlk seyahatimi ekle</button>
        <button class="btn sec" data-geri="1">Yedekten geri yükle</button></div>
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
        <span class="kick">PASAPORT</span>
        <div class="sayi"><b>${H.kodlar.length}</b><span>ÜLKE<small>${V.ev && H.gittim.has(V.ev) ? esc(U[V.ev]?.a) + ' dahil' : ''}</small></span></div>
        <div class="cubuk"><i style="width:${Math.min(100, yuzde)}%"></i></div>
        <small>Dünyanın %${String(yuzde).replace('.', ',')}'i · ${EGEMEN} ülkeden ${H.egemenSay} · 6 kıtadan ${H.kitalar.size}</small></div>
      <div class="tiles">
        <div class="tile"><b>${NF.format(H.sehirSay)}</b><span>Şehir</span><small>${sehirli && sehirli[1].sehir.size ? 'en çok ' + esc(U[sehirli[0]]?.a) : 'ülke sayfasından ekle'}</small></div>
        <div class="tile"><b>${NF.format(H.gun)}</b><span>Yolda gün</span><small>${V.geziler.length} seyahat</small></div>
        <div class="tile"><b>${H.kitalar.size}<small style="display:inline;font-size:16px;color:var(--mute)">/6</small></b><span>Kıta</span><small>${[...H.kitalar].map((k) => KITA[k]).join(', ') || '—'}</small></div>
        <div class="tile"><b>${H.hayal.length}</b><span>Hayal listesi</span><small>${H.hayal.slice(0, 3).map((k) => bayrak(k)).join(' ') || 'Ülkeler’de ☆ ile ekle'}</small></div>
      </div>
      <div class="bas2"><h3>Haritam</h3><button data-git="harita">Büyüt ›</button></div>
      <div class="harita-kutu" data-git="harita">${haritaSvg()}</div>
      <div class="bas2"><h3>Damgalar</h3><small style="color:var(--mute);font-weight:800">${H.kodlar.length} damga</small></div>
      <div class="damgalar">${dsira.map(([k, o]) => `<button data-ulke="${k}">${damga(k, o.ilk && !o.ilk.startsWith('0000') ? o.ilk : '', 120)}</button>`).join('')}
        <button data-git="ulkeler"><span class="bos-damga">＋ yeni<br>damga</span></button></div>
      <div class="bas2"><h3>Kıtalar</h3></div>
      <div class="panel">${KSIRA.map((k) => { const top = UL.filter((u) => u.s && u.kt === k).length, n = H.kodlar.filter((x) => U[x].s && U[x].kt === k).length;
        return `<div class="kita" data-kita="${k}" style="--kc:${KRENK[k]}"><b>${KITA[k]}</b><div class="bar"><i style="width:${n / top * 100}%"></i></div><span>${n}<small>/${top}</small></span></div>`; }).join('')}</div>
      ${yillar.length ? `<div class="bas2"><h3>Yıllara göre</h3><small style="color:var(--mute);font-weight:800">ülke sayısı</small></div>
      <div class="panel"><div class="yillar">${yillar.map((y) => `<div class="yil"><b>${yil[y].u.size}</b><i style="height:${yil[y].u.size / yMax * 92}px"></i><small>${y}</small></div>`).join('')}</div></div>` : ''}
      <div class="bas2"><h3>Rekorlar</h3></div>
      <div class="panel">
        ${sonGezi ? `<div class="rekor" data-gezi="${sonGezi.id}"><span class="ik">🧳</span><div><span>Son seyahat</span><b>${esc(gAd(sonGezi))} · ${esc(tarihYaz(sonGezi))}</b></div></div>` : ''}
        ${enUzun ? `<div class="rekor" data-gezi="${enUzun.id}"><span class="ik">⏳</span><div><span>En uzun seyahat</span><b>${esc(gAd(enUzun))} · ${gun(enUzun)} gün</b></div></div>` : ''}
        ${cok && cok[1].geziler.length > 1 ? `<div class="rekor" data-ulke="${cok[0]}"><span class="ik">${bayrak(cok[0])}</span><div><span>En çok dönülen</span><b>${esc(U[cok[0]].a)} · ${cok[1].geziler.length} kez</b></div></div>` : ''}
        ${sehirli && sehirli[1].sehir.size ? `<div class="rekor" data-ulke="${sehirli[0]}"><span class="ik">🏙️</span><div><span>En çok şehir</span><b>${esc(U[sehirli[0]].a)} · ${sehirli[1].sehir.size} şehir</b></div></div>` : ''}
        <div class="rekor" data-git="seyahat"><span class="ik">✈️</span><div><span>Toplam</span><b>${V.geziler.length} seyahat · ${NF.format(H.gun)} gün yolda</b></div></div>
      </div>
      ${imzaKutu()}`;
  }

  function harita() {
    $('#ekran').innerHTML = `
      <div class="h-ust"><div class="secenek">${[['hepsi', 'Hepsi'], ['gittim', 'Gittiklerim'], ['hayal', 'Hayalim']].map(([k, a]) => `<button data-hf="${k}" class="${durum.haritaFiltre === k ? 'on' : ''}">${a}</button>`).join('')}
        <button data-sehir="1" class="${durum.sehirGoster ? 'on' : ''}">● Şehirler</button></div></div>
      <div class="harita-tam">${haritaSvg({ etkilesim: true, vb: durum.harita })}
        <div class="h-arac"><button data-zoom="+" aria-label="Yakınlaş">＋</button><button data-zoom="-" aria-label="Uzaklaş">−</button><button data-zoom="0" aria-label="Tüm dünya" style="font-size:16px">⤢</button></div></div>
      <div class="lejant"><span><i style="background:var(--ok)"></i>Gittim · ${H.kodlar.length - (H.gittim.has(V.ev) ? 1 : 0)}</span><span><i style="background:#f6b38e"></i>Hayalim · ${H.hayal.length}</span>${V.ev ? `<span><i style="background:var(--ev)"></i>Ev · ${esc(U[V.ev]?.a)}</span>` : ''}<span><i style="background:#e3262c;border-radius:50%"></i>Şehir</span></div>`;
    haritaEtkilesim();
  }

  function seyahat() {
    const ek = $('#ekran');
    if (!V.geziler.length) {
      ek.innerHTML = `<div class="bos"><b>Henüz seyahat yok</b>Tarih, ülke, şehir ve notlarınla ilk seyahatini ekle; yıllar sonra bile her şey burada.<br><button class="btn tur" data-yeni="1" style="margin-top:14px">＋ Seyahat ekle</button></div>`;
      return;
    }
    const g = [...V.geziler].sort((a, b) => gSira(b).localeCompare(gSira(a)));
    const gr = {}; g.forEach((x) => (gr[gYil(x) || 'Tarihsiz'] ||= []).push(x));
    const ys = Object.keys(gr).sort((a, b) => (b === 'Tarihsiz' ? -1 : a === 'Tarihsiz' ? 1 : b - a));
    ek.innerHTML = `<div class="arac"><button class="btn tur" data-yeni="1" style="flex:1;justify-content:center">＋ Seyahat ekle</button></div>` + ys.map((y) => {
      const L = gr[y], ul = new Set(); L.forEach((x) => x.yerler.forEach((p) => ul.add(p.u)));
      return `<h3 class="yil-bas">${y}<small>${L.length} seyahat · ${ul.size} ülke · ${L.reduce((t, x) => t + gun(x), 0)} gün</small></h3>` + L.map((x) => {
        const a = x.bas ? new Date(x.bas) : null, sehirler = x.yerler.flatMap((p) => p.s);
        return `<div class="gezi" data-gezi="${x.id}"><div class="tarih">${a ? `<b>${a.getDate()}</b><span>${AYK[a.getMonth()]}</span>` : `<b style="font-size:20px">${x.yil || '—'}</b>`}<small>${gun(x) ? gun(x) + ' gün' : ''}</small></div>
          <div class="g-in"><h4>${esc(gAd(x))}</h4><div class="bayraklar bayrak">${x.yerler.map((p) => bayrak(p.u)).join('')}</div>
          <div class="g-alt">${esc(sehirler.join(', ') || tarihYaz(x))}</div>
          <div class="g-alt">${[yildiz(x.puan), esc(x.kim)].filter(Boolean).join(' · ')}</div></div></div>`;
      }).join('');
    }).join('');
  }

  function ulkeler() {
    const ara = katla(durum.ulkeAra), f = durum.ulkeFiltre;
    const uy = (u) => {
      if (ara && !katla(u.a + ' ' + u.en + ' ' + u.b).includes(ara)) return false;
      const d = durumu(u.k);
      if (f === 'gittim') return d === 'g' || d === 'e';
      if (f === 'hayal') return d === 'h';
      return u.s || d;   // bağlı topraklar yalnız işaretliyse ya da aranınca
    };
    const satir = (u) => {
      const d = durumu(u.k), o = H.gittim.get(u.k);
      const alt = d === 'e' ? 'Ev ülkem' + (o?.sehir.size ? ' · ' + o.sehir.size + ' şehir' : '') :
        o ? [o.geziler.length ? o.geziler.length + ' seyahat' : '', o.sehir.size ? o.sehir.size + ' şehir' : '', o.ilk ? ayYil(o.ilk) : ''].filter(Boolean).join(' · ') || 'Gittim' : (u.b ? u.b : KITA[u.kt] || '');
      return `<div class="u-satir ${d}"><span class="bayrak">${bayrak(u.k)}</span><div class="ad" data-ulke="${u.k}"><b>${esc(u.a)}</b><small>${esc(alt)}</small></div>
        ${d === 'e' ? '' : `<button class="isaret hy ${d === 'h' ? 'on' : ''}" data-hayal="${u.k}" aria-label="Hayal listesi">${d === 'h' ? '★' : '☆'}</button>
        <button class="isaret ok ${d === 'g' ? 'on' : ''}" data-gittim="${u.k}" aria-label="Gittim">✓</button>`}</div>`;
    };
    const L = UL.filter(uy);
    const kitaya = KSIRA.map((k) => [k, L.filter((u) => u.kt === k)]).filter(([, l]) => l.length);
    $('#ekran').innerHTML = `
      <div class="arac"><label class="ara">🔎<input id="ulkeAra" type="search" placeholder="Ülke ya da başkent ara" value="${esc(durum.ulkeAra)}" autocomplete="off"></label></div>
      <div class="h-ust" style="padding-top:2px"><div class="secenek">${[['tumu', 'Tümü'], ['gittim', `Gittiklerim · ${H.kodlar.length}`], ['hayal', `Hayalim · ${H.hayal.length}`]].map(([k, a]) => `<button data-uf="${k}" class="${f === k ? 'on' : ''}">${a}</button>`).join('')}</div></div>
      <div id="ulkeListe">${kitaya.map(([k, l]) => {
        const n = l.filter((u) => H.gittim.has(u.k)).length;
        return `<div class="u-bas"><span>${KITA[k]}</span><b>${n}/${l.length}</b></div><div class="liste-kutu">${l.map(satir).join('')}</div>`; }).join('') ||
        '<div class="bos"><b>Bulunamadı</b>Başka bir ad dene.</div>'}</div>
      ${imzaKutu()}`;
    const inp = $('#ulkeAra');
    inp.oninput = () => { durum.ulkeAra = inp.value; const s = inp.selectionStart; ulkeler(); const n = $('#ulkeAra'); n.focus(); n.setSelectionRange(s, s); };
  }

  function bilgi() {
    $('#ekran').innerHTML = `
      <div class="bilgi-kutu"><h4>🧳 Yedek</h4><p>Bütün pasaportun (ülkeler, şehirler, seyahatler, notlar) tek bir dosya olur. Telefon değiştirince ya da uygulamayı silmeden önce yedek al; dosyayı kendine e-postayla gönderebilir ya da Dosyalar’a kaydedebilirsin.</p>
        <div class="rh-dugmeler"><button class="btn" data-yedek="1">⬇ Yedekle</button><button class="btn sec" data-geri="1">⬆ Geri yükle</button></div></div>
      <div class="bilgi-kutu"><h4>🖼️ Gezi kartı</h4><p>Haritan ve sayıların tek bir resimde; istediğin yerde paylaş.</p><button class="btn tur" data-kart="1">Gezi kartını paylaş</button></div>
      <div class="bilgi-kutu"><h4>🏠 Ev ülkem</h4><p>Ev ülken haritada altın renkle görünür ve sayıya dahil edilir.</p>
        <select class="girdi" id="evSec"><option value="">— Yok —</option>${UL.filter((u) => u.s).map((u) => `<option value="${u.k}" ${u.k === V.ev ? 'selected' : ''}>${esc(u.a)}</option>`).join('')}</select></div>
      <div class="bilgi-kutu"><h4>Gezi Pasaportu nedir?</h4><p>Gezdiğin ülkeleri ve şehirleri, seyahatlerinin tarihini ve anılarını tutan kişisel bir pasaport. Üyelik yok, reklam yok, internet gerekmez; bilgilerin yalnız bu telefonda kalır.</p>
        <p class="kaynak">Kaynaklar: ülke sınırları Natural Earth (kamu malı) · şehirler GeoNames (CC BY 4.0, geonames.org) · ülke adları countries-list ve i18n-iso-countries (MIT). Harita sınırları bilgi amaçlıdır.</p></div>
      ${imzaKutu()}`;
    $('#evSec').onchange = (e) => { V.ev = e.target.value; kaydet(); yenile(); toast(V.ev ? 'Ev ülken: ' + U[V.ev].a : 'Ev ülkesi kaldırıldı'); };
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
    for (const c of L) { const n = katla(c[0]); if (!h.has(n) && n.startsWith(a)) { out.push(c); if (out.length >= 6) break; } }
    if (out.length < 6) for (const c of L) { const n = katla(c[0]); if (!h.has(n) && !n.startsWith(a) && n.includes(a) && !out.includes(c)) { out.push(c); if (out.length >= 6) break; } }
    return out;
  }
  const nufus = (p) => p >= 1000 ? (Math.round(p / 100) / 10).toString().replace('.', ',') + ' mn' : p ? p + ' bin' : '';

  function ulkeSayfasi(k) {
    const u = U[k]; if (!u) return;
    const d = durumu(k), o = H.gittim.get(k), x = V.ulkeler[k] || {};
    const elle = x.s || [], gSeh = new Set(); o?.geziler.forEach((g) => g.yerler.filter((p) => p.u === k).forEach((p) => p.s.forEach((s) => gSeh.add(s))));
    const geziler = (o?.geziler || []).sort((a, b) => gSira(b).localeCompare(gSira(a)));
    sheet(`<div class="s-bas"><h2>${esc(u.a)}</h2><button data-kapat aria-label="Kapat">✕</button></div>
      <div class="u-kapak"><span class="bayrak">${bayrak(k)}</span><div><h3>${esc(u.a)}</h3><small>${esc([u.b && 'Başkent ' + u.b, KITA[u.kt]].filter(Boolean).join(' · '))}</small></div></div>
      <div class="durum"><button class="ok ${d === 'g' || d === 'e' ? 'on' : ''}" data-u-gittim="${k}">✓ Gittim</button><button class="hy ${d === 'h' ? 'on' : ''}" data-u-hayal="${k}">☆ Hayalim</button>${d === 'e' ? '<button class="ev on" disabled>🏠 Ev</button>' : ''}</div>
      ${o ? `<div class="damga-tek">${damga(k, o.ilk && !o.ilk.startsWith('0000') ? o.ilk : '', 150)}</div>
      <div class="tiles" style="grid-template-columns:repeat(3,1fr)"><div class="tile"><b>${o.geziler.length}</b><span>Seyahat</span></div><div class="tile"><b>${o.gun}</b><span>Gün</span></div><div class="tile"><b>${o.sehir.size}</b><span>Şehir</span></div></div>` : ''}
      <div class="alan"><label>Şehirler</label>
        <div class="cip-yaz">${[...gSeh].map((s) => `<span class="cip pasif">${esc(s)}</span>`).join('')}${elle.filter((s) => !gSeh.has(s)).map((s) => `<span class="cip">${esc(s)}<button data-sehir-sil="${esc(s)}" aria-label="Kaldır">✕</button></span>`).join('')}</div>
        <input type="text" id="sehirGir" placeholder="Şehir ekle (ör. ${esc((window.SEHIRLER?.[k] || [])[0]?.[0] || 'başkent')})" autocomplete="off" enterkeyhint="done">
        <div class="oneri" id="sehirOneri"></div>
        <p class="ipucu-yazi">Listede yoksa yazıp Ekle'ye dokun; küçük kasabalar da olur.</p></div>
      ${geziler.length ? `<div class="alan"><label>Seyahatler</label>${geziler.map((g) => `<div class="gezi" data-gezi="${g.id}" style="margin:0 0 8px"><div class="g-in"><h4>${esc(gAd(g))}</h4><div class="g-alt">${esc(tarihYaz(g))}${gun(g) ? ' · ' + gun(g) + ' gün' : ''}</div></div></div>`).join('')}</div>` : ''}
      <div class="alan"><label>Notum</label><textarea id="ulkeNot" placeholder="Bu ülkede en çok neyi sevdin?">${esc(x.n || '')}</textarea></div>
      <div class="alan"><button class="btn tur" data-yeni-ulke="${k}" style="width:100%;justify-content:center;height:48px">＋ ${esc(u.a)} seyahati ekle</button></div>`);
    const inp = $('#sehirGir'), on = $('#sehirOneri');
    const ekle = (ad) => {
      ad = ad.trim(); if (!ad) return;
      const y = (V.ulkeler[k] ||= {}); y.s = [...new Set([...(y.s || []), ad])]; if (!y.d) y.d = 'g';
      kaydet(); yenile(); ulkeSayfasi(k); goster(); toast(ad + ' eklendi'); setTimeout(() => $('#sehirGir')?.focus(), 50);
    };
    const oner = () => {
      const q = inp.value.trim();
      const L = sehirOneri(k, q, [...gSeh, ...elle]);
      on.innerHTML = (q ? `<button data-s-ekle="${esc(q)}"><b>＋ “${esc(q)}” ekle</b></button>` : '') + L.map((c) => `<button data-s-ekle="${esc(c[0])}">${esc(c[0])}<small>${nufus(c[3])}</small></button>`).join('');
    };
    inp.oninput = oner;
    inp.onkeydown = (e) => { if (e.key === 'Enter') { e.preventDefault(); ekle(inp.value); } };
    on.onclick = (e) => { const b = e.target.closest('[data-s-ekle]'); if (b) ekle(b.dataset.sEkle); };
    $('#ulkeNot').onchange = (e) => { (V.ulkeler[k] ||= {}).n = e.target.value; kaydet(); };
  }

  function geziSayfasi(id) {
    const g = V.geziler.find((x) => x.id === id); if (!g) return;
    sheet(`<div class="s-bas"><h2>${esc(gAd(g))}</h2><button data-kapat aria-label="Kapat">✕</button></div>
      <div class="d-in">
        <div class="sonfiyat"><span class="kick">${esc(tarihYaz(g))}</span><div class="sf">${gun(g) ? gun(g) + ' <small style="font-size:20px">gün</small>' : '✈'}</div>
          <small>${g.yerler.length} ülke · ${g.yerler.reduce((t, p) => t + p.s.length, 0)} şehir${g.kim ? ' · ' + esc(g.kim) : ''}</small>${g.puan ? `<span class="damga">${'★'.repeat(g.puan)}</span>` : ''}</div>
        ${g.yerler.map((p) => `<div class="yer-kart" data-ulke="${p.u}" style="cursor:pointer"><div class="yk-bas"><span class="bayrak">${bayrak(p.u)}</span><span>${esc(U[p.u]?.a || p.u)}</span><i style="font-style:normal;color:var(--mute)">›</i></div>
          ${p.s.length ? `<div class="cip-yaz">${p.s.map((s) => `<span class="cip pasif">${esc(s)}</span>`).join('')}</div>` : ''}</div>`).join('')}
        ${g.not ? `<div class="bilgi-kutu" style="margin:10px 0"><h4>Notlarım</h4><p style="white-space:pre-wrap">${esc(g.not)}</p></div>` : ''}
        <div class="d-btn"><button class="btn" data-duzenle="${g.id}">✎ Düzenle</button><button class="btn sec" data-gezi-paylas="${g.id}">↗ Paylaş</button></div>
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
    sheet(`<div class="s-bas"><h2>${F.yeni ? 'Yeni seyahat' : 'Seyahati düzenle'}</h2><button data-kapat aria-label="Kapat">✕</button></div>
      <div class="alan"><label>Nereye?</label>
        <div id="yerler">${F.yerler.map((p, i) => `<div class="yer-kart"><div class="yk-bas"><span class="bayrak">${bayrak(p.u)}</span><span>${esc(U[p.u]?.a || p.u)}</span><button data-yer-sil="${i}" aria-label="Ülkeyi çıkar">✕</button></div>
          <div class="cip-yaz">${p.s.map((s, j) => `<span class="cip">${esc(s)}<button data-f-sehir-sil="${i}:${j}" aria-label="Kaldır">✕</button></span>`).join('')}</div>
          <input type="text" class="girdi" data-f-sehir="${i}" placeholder="Şehir ekle" autocomplete="off" enterkeyhint="done"><div class="oneri" data-f-oneri="${i}"></div></div>`).join('')}</div>
        <input type="text" class="girdi" id="fUlke" placeholder="${F.yerler.length ? '＋ Bir ülke daha' : 'Ülke ara (ör. İtalya)'}" autocomplete="off">
        <div class="oneri" id="fUlkeOneri"></div></div>
      <div class="alan"><label>Ne zaman?</label>
        <div class="iki"><div><small>Gidiş</small><input type="date" id="fBas" value="${esc(F.bas)}"></div><div><small>Dönüş</small><input type="date" id="fBit" value="${esc(F.bit)}"></div></div>
        <div style="margin-top:8px"><small style="display:block;font-size:11.5px;color:var(--mute);margin:0 0 4px 4px;font-weight:700">Tarihi hatırlamıyorsan yalnız yıl</small>
        <select class="girdi" id="fYil"><option value="">—</option>${Array.from({ length: 70 }, (_, i) => yil - i).map((y) => `<option ${String(F.yil) === String(y) ? 'selected' : ''}>${y}</option>`).join('')}</select></div></div>
      <div class="alan"><label>Seyahatin adı (isteğe bağlı)</label><input type="text" id="fAd" value="${esc(F.ad)}" placeholder="${esc(gAd({ ...F, ad: '' }))}"></div>
      <div class="alan"><label>Kiminle?</label><div class="secenek" style="margin-bottom:8px">${['Eşimle', 'Ailemle', 'Arkadaşlarla', 'Yalnız', 'İş'].map((k) => `<button data-kim="${k}" class="${F.kim === k ? 'on' : ''}">${k}</button>`).join('')}</div>
        <input type="text" id="fKim" value="${esc(F.kim)}" placeholder="ya da yaz"></div>
      <div class="alan"><label>Puanım</label><div class="puan-sec">${[1, 2, 3, 4, 5].map((n) => `<button data-puan="${n}" class="${F.puan >= n ? 'on' : ''}">★</button>`).join('')}</div></div>
      <div class="alan"><label>Notlarım</label><textarea id="fNot" placeholder="Unutmak istemediklerin: yemekler, insanlar, anlar…">${esc(F.not)}</textarea></div>
      <div class="f-alt">${F.yeni ? '' : `<button class="btn sil-btn ${F.silOnay ? 'onay' : ''}" data-f-sil="1">${F.silOnay ? 'Emin misin? Sil' : 'Sil'}</button>`}<button class="btn" data-kapat>Vazgeç</button><button class="btn tur" data-f-kaydet="1">Kaydet</button></div>`);
    const al = () => { F.ad = $('#fAd').value.trim(); F.bas = $('#fBas').value; F.bit = $('#fBit').value; F.yil = $('#fYil').value; F.kim = $('#fKim').value.trim(); F.not = $('#fNot').value; };
    F.al = al;
    const uInp = $('#fUlke'), uOn = $('#fUlkeOneri');
    uInp.oninput = () => {
      const a = katla(uInp.value.trim()); if (!a) { uOn.innerHTML = ''; return; }
      const var_ = new Set(F.yerler.map((p) => p.u));
      const L = UL.filter((u) => !var_.has(u.k) && (katla(u.a).startsWith(a) || katla(u.en).startsWith(a))).concat(UL.filter((u) => !var_.has(u.k) && !katla(u.a).startsWith(a) && !katla(u.en).startsWith(a) && katla(u.a + ' ' + u.en + ' ' + u.b).includes(a))).slice(0, 6);
      uOn.innerHTML = L.map((u) => `<button data-f-ulke="${u.k}"><span><span class="bayrak" style="font-size:18px">${bayrak(u.k)}</span> ${esc(u.a)}</span><small>${esc(KITA[u.kt] || '')}</small></button>`).join('');
    };
    document.querySelectorAll('[data-f-sehir]').forEach((inp) => {
      const i = +inp.dataset.fSehir, on = $(`[data-f-oneri="${i}"]`);
      const ekle = (ad) => { ad = ad.trim(); if (!ad) return; al(); const p = F.yerler[i]; if (!p.s.some((s) => katla(s) === katla(ad))) p.s.push(ad); formCiz(); setTimeout(() => $(`[data-f-sehir="${i}"]`)?.focus(), 30); };
      inp.oninput = () => { const q = inp.value.trim(); on.innerHTML = (q ? `<button data-x="${esc(q)}"><b>＋ “${esc(q)}” ekle</b></button>` : '') + sehirOneri(F.yerler[i].u, q, F.yerler[i].s).map((c) => `<button data-x="${esc(c[0])}">${esc(c[0])}<small>${nufus(c[3])}</small></button>`).join(''); };
      inp.onkeydown = (e) => { if (e.key === 'Enter') { e.preventDefault(); ekle(inp.value); } };
      on.onclick = (e) => { const b = e.target.closest('[data-x]'); if (b) ekle(b.dataset.x); };
    });
  }
  function formKaydet() {
    F.al();
    if (!F.yerler.length) { toast('En az bir ülke seç'); $('#fUlke').focus(); return; }
    if (F.bas && F.bit && F.bit < F.bas) { toast('Dönüş, gidişten önce olamaz'); return; }
    if (F.bas && !F.bit) F.bit = F.bas;
    const g = { id: F.id, ad: F.ad, bas: F.bas, bit: F.bit, yil: F.bas ? '' : (F.yil ? +F.yil : ''), yerler: F.yerler, kim: F.kim, puan: F.puan, not: F.not };
    const i = V.geziler.findIndex((x) => x.id === g.id);
    if (i >= 0) V.geziler[i] = g; else V.geziler.push(g);
    g.yerler.forEach((p) => { const y = (V.ulkeler[p.u] ||= {}); y.d = 'g'; });
    const yeniDamga = F.yeni ? g.yerler.filter((p) => !H.gittim.has(p.u)).length : 0;
    kaydet(); yenile(); kapat(); if (durum.ekran !== 'pasaport' && durum.ekran !== 'seyahat') durum.ekran = 'seyahat'; goster();
    toast(yeniDamga ? `Pasaportuna ${yeniDamga} yeni damga basıldı 🛂` : 'Seyahat kaydedildi');
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
    await dosyaPaylas(`gezi-pasaportu-yedek-${t}.json`, JSON.stringify({ uygulama: 'Gezi Pasaportu', tarih: new Date().toISOString(), veri: V }, null, 1), 'application/json', 'Gezi Pasaportu yedeği');
    toast('Yedek hazır: dosyayı güvenli bir yere kaydet');
  }
  function geriYukle() { const f = $('#dosya'); f.value = ''; f.click(); }
  $('#dosya').addEventListener('change', async (e) => {
    const f = e.target.files?.[0]; if (!f) return;
    try {
      const j = JSON.parse(await f.text()), v = j.veri || j;
      if (!v || !Array.isArray(v.geziler) || typeof v.ulkeler !== 'object') throw new Error('biçim');
      V = { surum: 1, ev: v.ev ?? 'TR', ulkeler: v.ulkeler, geziler: v.geziler };
      await kaydet(); yenile(); durum.ekran = 'pasaport'; goster();
      toast(`Geri yüklendi: ${H.kodlar.length} ülke, ${V.geziler.length} seyahat`);
    } catch (err) { toast('Bu dosya bir Gezi Pasaportu yedeği değil'); }
  });

  async function geziKarti() {
    const W = 1080, Hh = 1350, cv = document.createElement('canvas'); cv.width = W; cv.height = Hh;
    const c = cv.getContext('2d');
    try { await document.fonts.load('900 60px "Barlow Condensed"'); await document.fonts.load('400 40px Pacifico'); await document.fonts.load('800 30px "DM Sans"'); } catch (e) {}
    const gr = c.createLinearGradient(0, 0, W, Hh); gr.addColorStop(0, '#123036'); gr.addColorStop(1, '#0b1e22'); c.fillStyle = gr; c.fillRect(0, 0, W, Hh);
    c.fillStyle = '#ffd23f'; c.font = '900 34px "DM Sans", sans-serif'; c.fillText('GEZİ PASAPORTU', 70, 110);
    c.fillStyle = '#fff'; c.font = '900 250px "Barlow Condensed", sans-serif'; c.fillText(String(H.kodlar.length), 64, 340);
    const gx = 70 + c.measureText(String(H.kodlar.length)).width + 30;
    c.font = '900 70px "Barlow Condensed", sans-serif'; c.fillText('ÜLKE', gx, 260);
    c.fillStyle = '#9fc3bd'; c.font = '700 34px "DM Sans", sans-serif'; c.fillText(`dünyanın %${String(Math.round(H.egemenSay / EGEMEN * 1000) / 10).replace('.', ',')}'i`, gx, 315);
    // harita
    const mx = 40, my = 420, mw = W - 80, s = mw / HR.w;
    c.save(); c.translate(mx, my); c.scale(s, s);
    c.fillStyle = '#1b4248'; c.fill(new Path2D(HR.kure));
    for (const k in HR.p) { const d = k[0] === '_' ? '' : durumu(k); c.fillStyle = d === 'g' ? '#2fb592' : d === 'e' ? '#ffd23f' : d === 'h' ? '#ed713c' : '#3f6469'; c.fill(new Path2D(HR.p[k])); }
    for (const u of UL) if (!u.h && u.m && H.gittim.has(u.k)) { c.fillStyle = '#2fb592'; c.beginPath(); c.arc(u.m[0], u.m[1], 4, 0, 7); c.fill(); }
    c.restore();
    // sayılar
    const kut = [[H.sehirSay, 'ŞEHİR'], [H.kitalar.size + '/6', 'KITA'], [H.gun, 'GÜN YOLDA'], [V.geziler.length, 'SEYAHAT']];
    kut.forEach(([n, a], i) => { const x = 70 + i * 245; c.fillStyle = '#ffd23f'; c.font = '900 92px "Barlow Condensed", sans-serif'; c.fillText(String(n), x, 1050); c.fillStyle = '#cfe9e4'; c.font = '800 26px "DM Sans", sans-serif'; c.fillText(a, x, 1092); });
    // bayraklar
    c.font = '46px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
    H.kodlar.slice(0, 18).forEach((k, i) => c.fillText(bayrak(k), 70 + i * 54, 1180));
    c.fillStyle = '#9fc3bd'; c.font = '700 28px "DM Sans", sans-serif'; c.fillText('Bir', 70, 1280);
    c.fillStyle = '#ed713c'; c.font = '400 40px Pacifico, cursive'; c.fillText('Mr. Anduv!', 122, 1282); const mw2 = c.measureText('Mr. Anduv!').width;
    c.fillStyle = '#9fc3bd'; c.font = '700 28px "DM Sans", sans-serif'; c.fillText('yapımıdır.', 122 + mw2 + 12, 1280);
    const b64 = cv.toDataURL('image/png').split(',')[1];
    await dosyaPaylas('gezi-kartim.png', b64, 'image/png', 'Gezi kartım', true);
  }
  function geziPaylas(id) {
    const g = V.geziler.find((x) => x.id === id); if (!g) return;
    const metin = `${gAd(g)} · ${tarihYaz(g)}${gun(g) ? ' · ' + gun(g) + ' gün' : ''}\n` + g.yerler.map((p) => `${bayrak(p.u)} ${U[p.u]?.a}${p.s.length ? ': ' + p.s.join(', ') : ''}`).join('\n') + (g.puan ? '\n' + '★'.repeat(g.puan) : '') + '\n— Gezi Pasaportu';
    const { Share } = C();
    (Share?.share ? Share.share({ title: gAd(g), text: metin }) : navigator.share ? navigator.share({ text: metin }) : navigator.clipboard.writeText(metin).then(() => toast('Kopyalandı'))).catch(() => {});
  }

  // ── olaylar ──
  const durumDegis = (k, d) => {
    const y = (V.ulkeler[k] ||= {});
    if (d === 'g') {
      if (H.gittim.has(k) && y.d === 'g') {
        const o = H.gittim.get(k);
        if (o.geziler.length) { toast('Bu ülke bir seyahatinde var; önce seyahatten çıkar'); return; }
        delete y.d; if (!y.s?.length && !y.n) delete V.ulkeler[k]; toast(U[k].a + ' çıkarıldı');
      } else { y.d = 'g'; toast(`${U[k].a} · damga basıldı 🛂`); }
    } else {
      if (y.d === 'h') { delete y.d; if (!y.s?.length && !y.n) delete V.ulkeler[k]; }
      else if (H.gittim.has(k)) { toast('Zaten gittin; hayal listesi gidilmeyenler için'); return; }
      else { y.d = 'h'; toast(U[k].a + ' hayal listende ☆'); }
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
    if (d.sehirSil) { const k = $('#sheetIn [data-yeni-ulke]')?.dataset.yeniUlke; const y = V.ulkeler[k]; if (y?.s) { y.s = y.s.filter((s) => s !== d.sehirSil); kaydet(); yenile(); ulkeSayfasi(k); goster(); } return; }
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
    // form
    if (F && $('#sheetIn [data-f-kaydet]')) {
      if (d.fUlke) { F.al(); F.yerler.push({ u: d.fUlke, s: [] }); formCiz(); setTimeout(() => $(`[data-f-sehir="${F.yerler.length - 1}"]`)?.focus(), 30); return; }
      if (d.yerSil) { F.al(); F.yerler.splice(+d.yerSil, 1); formCiz(); return; }
      if (d.fSehirSil) { F.al(); const [i, j] = d.fSehirSil.split(':').map(Number); F.yerler[i].s.splice(j, 1); formCiz(); return; }
      if (d.kim) { F.al(); F.kim = F.kim === d.kim ? '' : d.kim; formCiz(); return; }
      if (d.puan) { F.al(); F.puan = F.puan === +d.puan ? 0 : +d.puan; formCiz(); return; }
      if (d.fKaydet) { formKaydet(); return; }
      if (d.fSil) { if (!F.silOnay) { F.al(); F.silOnay = true; formCiz(); return; } V.geziler = V.geziler.filter((x) => x.id !== F.id); kaydet(); yenile(); kapat(); goster(); toast('Seyahat silindi'); return; }
    }
  });
  $('#fab').onclick = () => geziFormu();
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('#sheet').hidden) kapat(); });

  // ── başlat ──
  (async () => {
    const v = await kayit.al(ANAHTAR, null);
    if (v && v.ulkeler) V = { ...V, ...v };
    yenile(); goster();
    window.Capacitor?.Plugins?.SplashScreen?.hide?.();
  })();
  window.GP = { get V() { return V; }, set V(x) { V = x; kaydet(); yenile(); goster(); } };   // test için
})();
