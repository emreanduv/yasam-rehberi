/* Saat Vitrini — Bir Mr. Anduv! yapımıdır.
   Veri: GitHub'da zamanlanmış tarama (tools/veri_guncelle.py) → VERI_URL; ağ yoksa son kayıt, o da yoksa uygulamayla gelen ilk veri.
   Satış yok: her ürün satıcının kendi sitesine gider. Kişisel veri toplanmaz; takip listesi yalnız cihazda tutulur. */
(() => {
  'use strict';
  const VERI_URL = 'https://raw.githubusercontent.com/emreanduv/yasam-rehberi/saat-veri/vitrin.json';
  const SAYFA = 40;
  const $ = (s, el = document) => el.querySelector(s);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  const NF = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 });
  const tl = (n) => '₺' + NF.format(Math.round(n));
  const katla = (s) => String(s || '').toLocaleLowerCase('tr-TR').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ı/g, 'i');
  const AY = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
  const tarih = (iso) => { const d = new Date(iso); return isNaN(d) ? '' : `${d.getDate()} ${AY[d.getMonth()]} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`; };

  // ── kalıcı kayıt (Capacitor Preferences varsa o, yoksa localStorage) ──
  const Pref = window.Capacitor?.Plugins?.Preferences;
  const kayit = {
    async al(k, v0){ try { if(Pref){ const r = await Pref.get({ key:k }); return r.value ? JSON.parse(r.value) : v0; } const r = localStorage.getItem(k); return r ? JSON.parse(r) : v0; } catch(e){ return v0; } },
    async koy(k, v){ try { const s = JSON.stringify(v); if(Pref) await Pref.set({ key:k, value:s }); else localStorage.setItem(k, s); } catch(e){} },
  };

  let V = null, KOSE = { koleksiyon: [], ustalar: [], renk: {} };
  let takip = {};                       // id → { fiyat (eklendiğindeki), t, ad, marka, img }
  const durum = { ekran: 'vitrin', bolum: 'tumu', ara: '', markalar: new Set(), min: '', max: '', cins: '', indirimli: false, sira: 'karisik', goster: SAYFA };

  const renk = (m) => KOSE.renk[m] || '#173b40';
  const tur = (u) => u.tur || 'saat';
  const BOLUM = [['tumu','Tümü'], ['saat','Saat'], ['akilli','Akıllı Saat'], ['aksesuar','Aksesuar'], ['kulup','Kulüp']];

  // ── karışık sıra: her marka güne göre karışır; uygun · orta · pahalı sırayla, yan yana aynı marka gelmez ──
  const gunTohum = () => { const d = new Date(); return d.getFullYear() * 1000 + d.getMonth() * 40 + d.getDate(); };
  function karistir(a, t){ t >>>= 0; const r = () => { t += 0x6D2B79F5; let x = Math.imul(t ^ t >>> 15, 1 | t); x ^= x + Math.imul(x ^ x >>> 7, 61 | x); return ((x ^ x >>> 14) >>> 0) / 4294967296; };
    for(let i = a.length - 1; i > 0; i--){ const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  function karisikSira(list){
    const by = {}; list.forEach((u) => (by[u.marka] = by[u.marka] || []).push(u));
    const ms = Object.keys(by); ms.forEach((m, i) => karistir(by[m], gunTohum() * 31 + i)); karistir(ms, gunTohum());
    const out = []; while(ms.some((m) => by[m].length)) for(const m of ms) if(by[m].length) out.push(by[m].shift());
    if(out.length < 6) return out;
    const f = out.map((u) => u.fiyat).sort((a, b) => a - b), e1 = f[Math.floor(f.length / 3)], e2 = f[Math.floor(f.length * 2 / 3)];
    const dl = [[], [], []]; out.forEach((u) => dl[u.fiyat < e1 ? 0 : u.fiyat < e2 ? 1 : 2].push(u));
    const sonuc = []; let i = 0;
    while(dl.some((d) => d.length)){ const d = dl[[1, 2, 0][i++ % 3]]; if(!d.length) continue; const o = sonuc[sonuc.length - 1];
      let k = 0; while(o && k < d.length - 1 && k < 6 && d[k].marka === o.marka) k++; sonuc.push(d.splice(k, 1)[0]); }
    return sonuc;
  }

  // ── veri ──
  async function zamanli(url, ms){ const c = new AbortController(); const t = setTimeout(() => c.abort(), ms);
    try { const r = await fetch(url, { signal: c.signal, cache: 'no-store' }); if(!r.ok) throw new Error(r.status); return await r.json(); } finally { clearTimeout(t); } }
  async function veriYukle(){
    let v = null;
    try { v = await zamanli(VERI_URL, 12000); if(v?.items?.length) kayit.koy('vitrin', v); else v = null; } catch(e){}
    if(!v) v = await kayit.al('vitrin', null);
    if(!v?.items?.length) v = await zamanli('data/vitrin.json', 15000);
    return v;
  }
  function hazirla(v){
    v.items = v.items.filter((u) => u.fiyat > 0 && u.img);
    v.byId = new Map(v.items.map((u) => [u.id, u]));
    v.karisik = karisikSira(v.items.slice());
    return v;
  }

  // ── süzme ──
  function suz(){
    const q = katla(durum.ara).split(/\s+/).filter(Boolean);
    const mn = Number(durum.min) || 0, mx = Number(durum.max) || Infinity;
    let l = (durum.sira === 'karisik' ? V.karisik : V.items).filter((u) =>
      (durum.bolum === 'tumu' || tur(u) === durum.bolum) &&
      (!durum.markalar.size || durum.markalar.has(u.marka)) &&
      u.fiyat >= mn && u.fiyat <= mx &&
      (!durum.cins || u.cins === durum.cins || u.cins === 'Unisex') &&
      (!durum.indirimli || u.indirim > 0) &&
      (!q.length || q.every((w) => katla(`${u.marka} ${u.ad} ${u.model} ${(u.ozellik || []).join(' ')} ${u.satici}`).includes(w))));
    if(durum.sira === 'ucuz') l = l.slice().sort((a, b) => a.fiyat - b.fiyat);
    if(durum.sira === 'pahali') l = l.slice().sort((a, b) => b.fiyat - a.fiyat);
    if(durum.sira === 'indirim') l = l.slice().sort((a, b) => b.indirim - a.indirim);
    return l;
  }
  const filtreSayisi = () => durum.markalar.size + (durum.min || durum.max ? 1 : 0) + (durum.cins ? 1 : 0) + (durum.indirimli ? 1 : 0) + (durum.sira !== 'karisik' ? 1 : 0);

  // ── Saatin Fırsatı: indirimlilerden saate göre biri (saat başı değişir) ──
  function saatinFirsati(){
    const c = V.items.filter((u) => u.indirim >= 10 && u.eski && (durum.bolum === 'tumu' || tur(u) === durum.bolum)).sort((a, b) => b.indirim - a.indirim).slice(0, 48);
    if(!c.length) return null;
    return c[Math.floor(Date.now() / 3600000) % c.length];
  }

  const img = (u, cls = '') => `<img class="${cls}" src="${esc(u.img)}" data-yedek="${esc(u.img2 || '')}" alt="" loading="lazy" decoding="async">`;
  document.addEventListener('error', (e) => { const t = e.target; if(t.tagName === 'IMG' && t.dataset.yedek && t.src !== t.dataset.yedek){ t.src = t.dataset.yedek; t.dataset.yedek = ''; } }, true);

  function kartHTML(u){
    const on = takip[u.id] ? ' on' : '';
    return `<article class="kart" data-id="${esc(u.id)}" style="--bc:${renk(u.marka)}">
      <div class="k-img">${u.indirim > 0 ? `<span class="rozet">%${u.indirim}</span>` : ''}<button class="kalp${on}" data-kalp="${esc(u.id)}" aria-label="Takibe al">♥</button>${img(u)}</div>
      <div class="k-in"><div class="k-m">${esc(u.marka.toUpperCase())}</div><div class="k-ad">${esc(u.ad)}</div>
      <div class="k-fy">${tl(u.fiyat)}${u.eski ? `<s>${tl(u.eski)}</s>` : ''}</div><div class="k-st">${esc(u.satici)}</div></div></article>`;
  }

  // ── ekranlar ──
  function vitrin(){
    const say = {}; V.items.forEach((u) => { say[tur(u)] = (say[tur(u)] || 0) + 1; });
    const l = suz(), fs = filtreSayisi(), f = durum.ara || fs || durum.bolum !== 'tumu' ? null : saatinFirsati();
    const etk = [...durum.markalar].map((m) => `<span>${esc(m)}<i data-markasil="${esc(m)}">✕</i></span>`).join('');
    $('#ekran').innerHTML = `
      <div class="bolum">${BOLUM.filter(([k]) => k === 'tumu' || say[k]).map(([k, ad]) => `<button data-bolum="${k}" class="${durum.bolum === k ? 'on' : ''}">${ad}<em>${k === 'tumu' ? V.items.length : say[k]}</em></button>`).join('')}</div>
      <div class="arac"><label class="ara">🔎<input id="ara" type="search" placeholder="Marka, model, satıcı ara" value="${esc(durum.ara)}" enterkeyhint="search"></label>
        <button class="btn sec" id="filtreAc">Filtre${fs ? ` <b>${fs}</b>` : ''}</button></div>
      ${etk ? `<div class="etiketler">${etk}</div>` : ''}
      ${f ? `<div class="firsat" data-id="${esc(f.id)}"><div class="f-img">${img(f)}</div><div class="f-in"><span class="kick">⏰ SAATİN FIRSATI</span><h3>${esc(f.marka)} · ${esc(f.ad)}</h3><div class="f-fy">${tl(f.fiyat)}<s>${tl(f.eski)}</s></div></div></div>` : ''}
      ${l.length ? `<div class="grid">${l.slice(0, durum.goster).map(kartHTML).join('')}</div>
        ${l.length > durum.goster ? `<button class="btn sec daha" id="daha">Daha fazla göster (${NF.format(l.length - durum.goster)} ürün daha)</button>` : ''}`
        : `<div class="bos"><b>Bu süzgeçte ürün yok</b>Filtreleri gevşetmeyi ya da başka bir arama yapmayı dene.</div>`}`;
    const a = $('#ara');
    a.addEventListener('input', () => { durum.ara = a.value; durum.goster = SAYFA; clearTimeout(a._t); a._t = setTimeout(() => { const p = a.selectionStart; vitrin(); const b = $('#ara'); b.focus(); b.setSelectionRange(p, p); }, 250); });
  }

  function takipEkrani(){
    const ids = Object.keys(takip);
    const satirlar = ids.map((id) => { const t = takip[id], u = V.byId.get(id);
      const fark = u ? u.fiyat - t.fiyat : null;
      const durumYazi = !u ? '<small class="yok">Vitrinde şu an yok</small>' : fark < -0.5 ? `<small class="dustu">▼ ${tl(-fark)} düştü</small>` : fark > 0.5 ? `<small class="artti">▲ ${tl(fark)} arttı</small>` : '<small class="yok">Fiyat aynı</small>';
      return `<div class="satir" data-id="${esc(id)}" style="--bc:${renk(t.marka)}"><img src="${esc(u ? u.img : t.img)}" data-yedek="${esc(u?.img2 || '')}" alt=""><div class="s-in"><b>${esc(t.marka.toUpperCase())}</b><span>${esc(t.ad)}</span>${durumYazi}</div>
        <div class="s-fy">${u ? tl(u.fiyat) : '—'}<br><small class="yok" style="font:700 11px 'DM Sans'">eklerken ${tl(t.fiyat)}</small></div></div>`; }).join('');
    $('#ekran').innerHTML = `<div class="ara-baslik">TAKİP LİSTEN · ${ids.length} ÜRÜN</div>
      ${ids.length ? `<div class="liste">${satirlar}</div>` : `<div class="bos"><b>Henüz takip ettiğin ürün yok</b>Vitrinde beğendiğin ürünün ♥ simgesine dokun. Fiyatı düşünce uygulama sana haber verir.</div>`}
      <div class="bilgi-kutu"><h4>🔔 Fiyat düşünce haber</h4><p>Uygulama her açıldığında ve vitrin yenilendiğinde takip ettiğin ürünlerin fiyatına bakar; düşen olursa bildirim gönderir.</p></div>`;
  }

  function koseEkrani(){
    const kart = (k, et) => `<div class="kose"><span class="kick">${esc(k.etiket || et)}</span><h3>${esc(k.ad)}</h3><div class="alt">${esc(k.alt || '')}</div><p>${esc(k.metin)}</p><small>Kaynak: ${esc(k.kaynak)} · tanıtımdır, satış bizde değil</small></div>`;
    $('#ekran').innerHTML = `<div class="ara-baslik">🧭 KOLEKSİYONER KÖŞESİ</div>${KOSE.koleksiyon.map((k) => kart(k, '🧭 KOLEKSİYONER KÖŞESİ')).join('')}
      <div class="ara-baslik">🎖️ USTA KÖŞESİ</div>${KOSE.ustalar.map((k) => kart(k, '🎖️ USTA KÖŞESİ')).join('')}`;
  }

  function bilgiEkrani(){
    const sat = {}; V.items.forEach((u) => { sat[u.satici] = (sat[u.satici] || 0) + 1; });
    const mk = {}; V.items.forEach((u) => { mk[u.marka] = (mk[u.marka] || 0) + 1; });
    $('#ekran').innerHTML = `
      <div class="bilgi-kutu"><h4>Saat Vitrini nedir?</h4><p>Türkiye'de markaların kendi mağazalarında ve kurumsal saatçilerde satılan saatleri, aksesuarları ve kulüp ürünlerini tek yerde gösteren bir vitrin.</p>
        <p><b>Satış bizde değil.</b> Her ürünün "Satıcının sitesinde aç" düğmesi seni o satıcının kendi sayfasına götürür; fiyat ve stok satıcının sitesindekidir, son kontrol zamanı kartta yazar.</p></div>
      <div class="bilgi-kutu"><h4>Vitrin şu an</h4><p>${NF.format(V.items.length)} ürün · ${Object.keys(mk).length} marka · ${Object.keys(sat).length} satıcı<br>Son güncelleme: ${esc(tarih(V.checkedAt))}</p>
        <p><b>Satıcılar:</b> ${Object.entries(sat).sort((a, b) => b[1] - a[1]).map(([s, n]) => `${esc(s)} (${n})`).join(' · ')}</p></div>
      <div class="bilgi-kutu"><h4>Kurallarımız</h4><ul><li>Yalnız markaların kendi mağazaları ve kurumsal satıcılar; pazar yerleri yok.</li><li>Sitelerin robots.txt kurallarına uyulur.</li><li>Fotoğraflar satıcının kendi sitesinden gösterilir, kaynağı kartta yazar.</li><li>Kişisel verin toplanmaz; takip listen yalnız telefonunda tutulur.</li></ul></div>
      <div class="bilgi-kutu" style="text-align:center"><span class="imza" style="color:var(--ink);max-width:none;font-size:13px">Bir <b style="display:inline;font-size:20px;color:#ed713c">Mr. Anduv!</b> yapımıdır.</span></div>`;
  }

  function goster(){
    document.querySelectorAll('#tabbar button').forEach((b) => b.classList.toggle('on', b.dataset.s === durum.ekran));
    ({ vitrin, takip: takipEkrani, kose: koseEkrani, bilgi: bilgiEkrani })[durum.ekran]();
    const n = Object.keys(takip).length, b = $('#takipSay'); b.hidden = !n; b.textContent = n;
  }

  // ── detay ──
  function detay(id){
    const u = V.byId.get(id); if(!u) return;
    const ayni = V.items.filter((x) => x.marka === u.marka).map((x) => x.fiyat);
    const satirlar = [u.cins && ['Kullanım', u.cins], ['Satıcı', `${u.satici} · ${u.site}`], ['Stok', u.stok ? 'Satıcıda var' : 'Satıcıda tükendi'],
      ayni.length > 1 && [`${u.marka} vitrinde`, `${ayni.length} ürün · ${tl(Math.min(...ayni))} – ${tl(Math.max(...ayni))}`]].filter(Boolean);
    sheet(`<div class="s-bas"><h2>${esc(u.marka)}</h2><button data-kapat aria-label="Kapat">✕</button></div>
      <div class="d-foto">${img(u)}<small>📷 Fotoğraf: ${esc(u.site)}</small></div>
      <div class="d-in" style="--bc:${renk(u.marka)}"><span class="marka">${esc(u.marka.toUpperCase())}</span><h3>${esc(u.ad)}</h3>
        <div class="cips">${u.model ? `<span class="k">${esc(u.model)}</span>` : ''}${(u.ozellik || []).map((x) => `<span>${esc(x)}</span>`).join('')}</div>
        <div class="tablo">${satirlar.map(([a, b]) => `<div><span>${esc(a)}</span><b>${esc(b)}</b></div>`).join('')}</div>
        <div class="sonfiyat"><span class="kick">SON FİYAT</span><span class="damga">VİTRİNDE</span><div class="sf">${tl(u.fiyat)}${u.eski ? `<s>${tl(u.eski)}</s>` : ''}</div><small>Fiyat ${esc(u.satici)} sitesinden · ${esc(tarih(V.checkedAt))} itibarıyla · değişmiş olabilir</small></div>
        <div class="d-btn"><button class="btn tur" data-git="${esc(u.url)}">Satıcının sitesinde aç ↗</button><button class="btn sec" data-kalp="${esc(u.id)}">${takip[u.id] ? '♥ Takipte' : '♡ Takip et'}</button></div>
        <p class="not">Satış bizde değil · fiyat ve stok satıcının sitesinde</p></div>`);
  }

  function filtre(){
    const markalar = {}; V.items.filter((u) => durum.bolum === 'tumu' || tur(u) === durum.bolum).forEach((u) => { markalar[u.marka] = (markalar[u.marka] || 0) + 1; });
    const sec = (ad, deger, aktif) => `<button data-${ad}="${esc(deger)}" class="${aktif ? 'on' : ''}">`;
    sheet(`<div class="s-bas"><h2>Filtre</h2><button data-kapat aria-label="Kapat">✕</button></div>
      <div class="f-grup"><h4>SIRALAMA</h4><div class="secenek">${[['karisik','Karışık'],['ucuz','Önce uygun'],['pahali','Önce pahalı'],['indirim','En çok indirim']].map(([k, a]) => sec('sira', k, durum.sira === k) + a + '</button>').join('')}</div></div>
      <div class="f-grup"><h4>FİYAT (₺)</h4><div class="aralik"><input id="fMin" inputmode="numeric" placeholder="en az" value="${esc(durum.min)}"> – <input id="fMax" inputmode="numeric" placeholder="en çok" value="${esc(durum.max)}"></div>
        <div class="secenek" style="margin-top:8px">${[[0,2000],[2000,5000],[5000,15000],[15000,'']].map(([a, b]) => `<button data-aralik="${a}-${b}">${b ? `${NF.format(a)}–${NF.format(b)}` : `${NF.format(a)}+`}</button>`).join('')}</div></div>
      <div class="f-grup"><h4>KİM İÇİN</h4><div class="secenek">${[['','Hepsi'],['Erkek','Erkek'],['Kadın','Kadın']].map(([k, a]) => sec('cins', k, durum.cins === k) + a + '</button>').join('')}${sec('indirimli', 1, durum.indirimli)}Yalnız indirimli</button></div></div>
      <div class="f-grup"><h4>MARKA</h4><div class="secenek">${Object.entries(markalar).sort((a, b) => b[1] - a[1]).map(([m, n]) => sec('marka', m, durum.markalar.has(m)) + `${esc(m)}<em>${n}</em></button>`).join('')}</div></div>
      <div class="f-alt"><button class="btn sec" id="fTemizle">Temizle</button><button class="btn" id="fUygula">Göster</button></div>`);
  }

  function sheet(html){ $('#sheetIn').innerHTML = html; $('#sheet').hidden = false; $('#sheetIn').scrollTop = 0; }
  function kapat(){ $('#sheet').hidden = true; $('#sheetIn').innerHTML = ''; }
  function toast(m){ const t = $('#toast'); t.textContent = m; t.hidden = false; clearTimeout(t._t); t._t = setTimeout(() => (t.hidden = true), 2200); }

  async function kalp(id){
    const u = V.byId.get(id); if(!u) return;
    if(takip[id]){ delete takip[id]; toast('Takipten çıkarıldı'); }
    else { takip[id] = { fiyat: u.fiyat, t: Date.now(), ad: u.ad, marka: u.marka, img: u.img }; toast('Takibe alındı · fiyatı düşünce haber vereceğiz'); bildirimIzni(); }
    await kayit.koy('takip', takip);
  }

  // ── fiyat düşüş bildirimi ──
  const LN = window.Capacitor?.Plugins?.LocalNotifications;
  async function bildirimIzni(){ try { if(LN){ const p = await LN.checkPermissions(); if(p.display !== 'granted') await LN.requestPermissions(); } } catch(e){} }
  async function dususKontrol(){
    const haber = await kayit.al('haber', {});       // aynı düşüş için iki kez bildirim gönderme
    const dusen = [];
    for(const [id, t] of Object.entries(takip)){ const u = V.byId.get(id);
      if(u && u.fiyat < t.fiyat - 0.5 && (!haber[id] || u.fiyat < haber[id] - 0.5)){ dusen.push(u); haber[id] = u.fiyat; } }
    if(!dusen.length) return;
    await kayit.koy('haber', haber);
    const metin = dusen.length === 1 ? `${dusen[0].marka} · ${dusen[0].ad}: ${tl(dusen[0].fiyat)}` : `${dusen.length} takip ettiğin üründe fiyat düştü`;
    try { if(LN) await LN.schedule({ notifications: [{ id: Date.now() % 2147483647, title: '▼ Fiyat düştü', body: metin }] }); } catch(e){}
    toast('▼ ' + metin);
  }

  // ── olaylar ──
  document.addEventListener('click', async (e) => {
    const t = e.target.closest('button, .kart, .firsat, .satir, [data-kapat], [data-markasil]'); if(!t) return;
    const d = t.dataset;
    if('kapat' in d){ kapat(); return; }
    if(d.kalp){ e.stopPropagation(); await kalp(d.kalp); const acik = !$('#sheet').hidden; goster(); if(acik) detay(d.kalp); return; }
    if(d.git){ window.open(d.git, '_blank', 'noopener'); return; }   // satıcının sitesi telefonun kendi tarayıcısında açılır (uygulama içi tarayıcı yok)
    if(d.markasil){ durum.markalar.delete(d.markasil); durum.goster = SAYFA; goster(); return; }
    if(d.s){ durum.ekran = d.s; window.scrollTo(0, 0); goster(); return; }
    if(d.bolum){ durum.bolum = d.bolum; durum.markalar.clear(); durum.goster = SAYFA; goster(); return; }
    if(t.id === 'daha'){ durum.goster += SAYFA * 2; goster(); return; }
    if(t.id === 'filtreAc'){ filtre(); return; }
    if(d.sira){ durum.sira = d.sira; filtre(); return; }
    if(d.cins !== undefined && t.closest('.f-grup')){ durum.cins = d.cins; filtre(); return; }
    if(d.indirimli){ durum.indirimli = !durum.indirimli; filtre(); return; }
    if(d.marka){ durum.markalar.has(d.marka) ? durum.markalar.delete(d.marka) : durum.markalar.add(d.marka); filtre(); return; }
    if(d.aralik){ const [a, b] = d.aralik.split('-'); durum.min = a === '0' ? '' : a; durum.max = b; filtre(); return; }
    if(t.id === 'fTemizle'){ Object.assign(durum, { markalar: new Set(), min: '', max: '', cins: '', indirimli: false, sira: 'karisik' }); filtre(); return; }
    if(t.id === 'fUygula'){ durum.min = $('#fMin').value.replace(/\D/g, ''); durum.max = $('#fMax').value.replace(/\D/g, ''); durum.goster = SAYFA; kapat(); goster(); window.scrollTo(0, 0); return; }
    if(d.id){ detay(d.id); }
  });
  document.addEventListener('change', (e) => { if(e.target.id === 'fMin') durum.min = e.target.value.replace(/\D/g, ''); if(e.target.id === 'fMax') durum.max = e.target.value.replace(/\D/g, ''); });

  // ── açılış ──
  async function yenile(){
    const v = await veriYukle(); if(!v) return;
    V = hazirla(v);
    $('#hAlt').textContent = `${NF.format(V.items.length)} ürün · güncel: ${tarih(V.checkedAt)}`;
    goster(); dususKontrol();
  }
  (async () => {
    takip = await kayit.al('takip', {});
    try { KOSE = await zamanli('data/kose.json', 8000); } catch(e){}
    await yenile();
    document.addEventListener('visibilitychange', () => { if(!document.hidden) yenile(); });
    window.Capacitor?.Plugins?.App?.addListener?.('resume', yenile);
  })();
})();
