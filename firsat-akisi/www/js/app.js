/* Fırsat Akışı — Bir Mr. Anduv! yapımıdır.
   Market katalogları, mağaza ve kart kampanyaları tek yerde; en yeni kampanya her zaman en üstte.
   Veri: GitHub'da zamanlanmış tarama (tools/veri_guncelle.py) → VERI_URL; ağ yoksa son kayıt, o da yoksa uygulamayla gelen ilk veri.
   Satış yok: her kampanya mağazanın / bankanın kendi sayfasında açılır. Kişisel veri toplanmaz; takip ve cüzdan yalnız cihazda tutulur. */
(() => {
  'use strict';
  const VERI_URL = 'https://raw.githubusercontent.com/emreanduv/yasam-rehberi/firsat-veri/firsat.json';
  const SAYFA = 30;
  const $ = (s, el = document) => el.querySelector(s);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  const katla = (s) => String(s || '').toLocaleLowerCase('tr-TR').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ı/g, 'i');
  const AY = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
  const AYK = ['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'];
  const GUN = ['Pazar','Pazartesi','Salı','Çarşamba','Perşembe','Cuma','Cumartesi'];
  const iki = (n) => String(n).padStart(2, '0');
  const tarih = (iso) => { const d = new Date(iso); return isNaN(d) ? '' : `${d.getDate()} ${AY[d.getMonth()]} ${iki(d.getHours())}:${iki(d.getMinutes())}`; };
  const gunAy = (iso) => { if(!iso) return ''; const [y, m, g] = iso.split('-').map(Number); return `${g} ${AYK[m - 1]}`; };
  const bugun = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
  const gunDate = (iso) => { const [y, m, g] = iso.split('-').map(Number); return new Date(y, m - 1, g); };
  const kalan = (k) => k.end ? Math.round((gunDate(k.end) - bugun()) / 864e5) : null;
  const baslamadi = (k) => k.start && gunDate(k.start) > bugun();
  const tazelik = (k) => { const t = Date.parse(k.t || ''); return Number.isFinite(t) ? Math.min(t, Date.now()) : 0; };
  const yeni = (k) => Date.now() - tazelik(k) < 6 * 3600e3;
  const yuzde = (k) => { const m = String(k.offer || '').match(/%\s?(\d{1,2})\b/); return m ? Number(m[1]) : 0; };
  const TAKMA = { 'Cepte ŞOK':'ŞOK', 'Şok':'ŞOK', 'Bim':'BİM', 'File Market':'File', 'getirbüyük':'GetirBüyük', 'Domino’s':"Domino's" };
  const magaza = (k) => { const m = String(k.store || '').replace(/\s+×\s.*$/, ''); return TAKMA[m] || m; };
  // zincir şeridinde önce bunlar (her kesimin alışveriş yaptığı zincirler), sonra kampanya sayısına göre
  const ONCELIK = ['BİM', 'A101', 'ŞOK', 'Migros', 'File', 'Tarım Kredi', 'CarrefourSA', 'Metro', 'Bizim Toptan', 'Hakmar', 'Hakmar Express', 'Macrocenter', 'Fiskomar', 'Gratis', 'Watsons', 'Rossmann'];
  const onc = (m) => { const i = ONCELIK.indexOf(m); return i < 0 ? 99 : i; };

  // ── kalıcı kayıt (Capacitor Preferences varsa o, yoksa localStorage) ──
  const Pref = window.Capacitor?.Plugins?.Preferences;
  const kayit = {
    async al(k, v0){ try { if(Pref){ const r = await Pref.get({ key:k }); return r.value ? JSON.parse(r.value) : v0; } const r = localStorage.getItem(k); return r ? JSON.parse(r) : v0; } catch(e){ return v0; } },
    async koy(k, v){ try { const s = JSON.stringify(v); if(Pref) await Pref.set({ key:k, value:s }); else localStorage.setItem(k, s); } catch(e){} },
  };

  // ── bölümler (menajer sekmeleri) ──
  const GUNLUK = [['market', '🛒 Market'], ['bakim', '🧴 Bakım & Temizlik'], ['yemek', '🍽️ Yeme-İçme']];
  const DIGER = [['tumu', 'Tümü'], ['ev', '🏠 Ev'], ['giyim', '👕 Giyim & Spor'], ['teknoloji', '⚡ Teknoloji'], ['kart', '💳 Kart & Banka'], ['gezi', '✈️ Gezi & Yol'], ['eglence', '🎟️ Eğlence'], ['cocuk', '🧸 Çocuk']];
  const GUNLUK_SET = new Set(GUNLUK.map(([k]) => k));
  const RENK = { market:'#1f8a70', bakim:'#d0517a', yemek:'#d9481c', ev:'#a2672b', giyim:'#c2417a', teknoloji:'#3d6fd8', kart:'#2c4a63', gezi:'#1f8fb3', eglence:'#b5367a', cocuk:'#e3a21a', diger:'#36505a' };
  // Kart programları (Cüzdan)
  const KARTLAR = [['Bonus', 'Garanti BBVA'], ['Maximum', 'İş Bankası'], ['World', 'Yapı Kredi'], ['Axess', 'Akbank'], ['Bankkart', 'Ziraat Bankası'], ['Paraf', 'Halkbank'],
    ['VakıfBank', 'VakıfBank Worldcard'], ['CardFinans', 'QNB'], ['QNB Card', 'QNB'], ['Advantage', 'HSBC'], ['Wings', 'Akbank'], ['TROY', 'TROY logolu kartlar'], ['Money Kart', 'Migros'], ['Hopi', 'Hopi']];

  let V = null;
  let takip = {};            // kampanya id → { t, store, title, end, url }
  let magazaTakip = {};      // mağaza adı → true
  let cuzdan = [];           // kart programları
  const durum = { ekran: 'market', gbolum: 'market', dbolum: 'tumu', ara: '', zincir: '', sira: 'yeni', yerliOnce: false, kartim: false, sonGun: false, goster: SAYFA };

  // ── veri ──
  async function zamanli(url, ms){ const c = new AbortController(); const t = setTimeout(() => c.abort(), ms);
    try { const r = await fetch(url, { signal: c.signal, cache: 'no-store' }); if(!r.ok) throw new Error(r.status); return await r.json(); } finally { clearTimeout(t); } }
  async function veriYukle(){
    let v = null;
    try { v = await zamanli(VERI_URL, 12000); if(v?.items?.length) kayit.koy('firsat', v); else v = null; } catch(e){}
    if(!v) v = await kayit.al('firsat', null);
    if(!v?.items?.length) v = await zamanli('data/firsat.json', 15000);
    return v;
  }
  function hazirla(v){
    v.items = v.items.filter((k) => k.title && !(kalan(k) !== null && kalan(k) < 0));
    v.byId = new Map(v.items.map((k) => [k.id, k]));
    return v;
  }

  // ── sıralama: en yeni en üstte (saatlik dilimler yeniden eskiye; aynı dilimde aynı mağaza art arda gelmez) ──
  function enYeni(list){
    const dilim = new Map();
    list.forEach((k) => { const d = Math.floor(tazelik(k) / 3600e3); if(!dilim.has(d)) dilim.set(d, []); dilim.get(d).push(k); });
    const out = [];
    for(const d of [...dilim.keys()].sort((a, b) => b - a)){
      const grup = dilim.get(d).sort((a, b) => (a.offer === 'Kampanya') - (b.offer === 'Kampanya')), son = [];   // tutarı belli olanlar önde
      while(grup.length){ const o = son[son.length - 1]; let i = grup.findIndex((k) => !o || magaza(k) !== magaza(o)); if(i < 0) i = 0; son.push(grup.splice(i, 1)[0]); }
      out.push(...son);
    }
    return out;
  }
  const kartUyar = (k) => !(k.cards || []).length || (k.cards || []).some((c) => cuzdan.includes(c));
  function suz(gunluk){
    const q = katla(durum.ara).split(/\s+/).filter(Boolean);
    const bolum = gunluk ? durum.gbolum : durum.dbolum;
    let l = V.items.filter((k) => (gunluk ? GUNLUK_SET.has(k.bolum) : !GUNLUK_SET.has(k.bolum)) &&
      (bolum === 'tumu' || k.bolum === bolum) &&
      (!gunluk || !durum.zincir || magaza(k) === durum.zincir) &&
      (!durum.kartim || kartUyar(k)) &&
      (!durum.sonGun || (kalan(k) !== null && kalan(k) <= 2)) &&
      (!q.length || q.every((w) => katla(`${k.store} ${k.title} ${k.offer} ${(k.cards || []).join(' ')}`).includes(w))));
    if(durum.sira === 'yeni') l = enYeni(l);
    if(durum.sira === 'bitis') l = l.slice().sort((a, b) => (kalan(a) ?? 999) - (kalan(b) ?? 999) || tazelik(b) - tazelik(a));
    if(durum.sira === 'indirim') l = l.slice().sort((a, b) => yuzde(b) - yuzde(a) || tazelik(b) - tazelik(a));
    if(durum.sira === 'magaza') l = l.slice().sort((a, b) => magaza(a).localeCompare(magaza(b), 'tr') || tazelik(b) - tazelik(a));
    if(durum.yerliOnce) l = [...l.filter((k) => k.yerli), ...l.filter((k) => !k.yerli)];
    return l;
  }
  const filtreSayisi = () => (durum.sira !== 'yeni' ? 1 : 0) + (durum.yerliOnce ? 1 : 0) + (durum.kartim ? 1 : 0) + (durum.sonGun ? 1 : 0);

  // ── kart (FM gelen kutusu satırı gibi) ──
  function sureYazi(k){
    if(baslamadi(k)){ const n = Math.round((gunDate(k.start) - bugun()) / 864e5); return [`${n === 1 ? 'Yarın' : gunAy(k.start)} başlıyor`, 'bas']; }
    const n = kalan(k);
    if(n === null) return [k.live ? 'Canlı tarama' : 'Bitiş yazmıyor', ''];
    if(n === 0) return ['⏰ SON GÜN', 'son'];
    if(n === 1) return ['⏰ Yarın bitiyor', 'son'];
    return [`${gunAy(k.end)}'e kadar · ${n} gün${k.endGuess ? ' (tahmini)' : ''}`, n <= 3 ? 'yakin' : ''];
  }
  function kampanyaHTML(k){
    const [sure, sc] = sureYazi(k), on = takip[k.id] ? ' on' : '', renk = RENK[k.bolum] || RENK.diger;
    const etiket = [k.katalog ? '<em class="e-kat">📖 KATALOG</em>' : '', yeni(k) ? '<em class="e-yeni">🆕 YENİ</em>' : '',
      (k.cards || []).length ? `<em class="e-kart${kartUyar(k) || !cuzdan.length ? '' : ' yok'}">💳 ${esc(k.cards.slice(0, 2).join(' · '))}</em>` : ''].join('');
    return `<article class="kmp" data-id="${esc(k.id)}" style="--bc:${renk}">
      <div class="kmp-sol"><span>${esc(k.emoji || '🛍️')}</span></div>
      <div class="kmp-in">
        <div class="kmp-ust"><b class="kmp-m">${k.yerli ? '🇹🇷 ' : ''}${esc(magaza(k).toLocaleUpperCase('tr-TR'))}</b>${etiket}</div>
        <div class="kmp-ad">${esc(k.title)}</div>
        <div class="kmp-alt"><span class="kmp-teklif">${esc(k.offer || 'Kampanya')}</span><span class="kmp-sure ${sc}">${esc(sure)}</span></div>
      </div>
      <button class="kalp${on}" data-kalp="${esc(k.id)}" aria-label="Takibe al">♥</button></article>`;
  }
  const fistik = (metin) => `<div class="fistik-bant"><div class="fistik-yer">${$('#fistikSvg').innerHTML}</div><div class="balon">${metin}</div></div>`;

  // ── ekranlar ──
  function liste(gunluk){
    const l = suz(gunluk), fs = filtreSayisi(), bolumler = gunluk ? GUNLUK : DIGER, aktif = gunluk ? durum.gbolum : durum.dbolum;
    const say = {}; V.items.forEach((k) => { say[k.bolum] = (say[k.bolum] || 0) + 1; });
    const toplam = V.items.filter((k) => !GUNLUK_SET.has(k.bolum)).length;
    let ust = '';
    if(gunluk){
      const gun = V.items.filter((k) => GUNLUK_SET.has(k.bolum));
      const biten = gun.filter((k) => kalan(k) === 0).length, kat = gun.filter((k) => k.katalog && !baslamadi(k)).length;
      const d = new Date();
      ust = fistik(`<b>${d.getDate()} ${AY[d.getMonth()]} ${GUN[d.getDay()]}</b> · günlük ihtiyaçta ${gun.length} kampanya${kat ? `, ${kat} katalog yayında` : ''}${biten ? ` · <span class="kirmizi">${biten} tanesi bugün bitiyor</span>` : ''}`);
      // zincir şeridi: o bölümdeki mağazalar, en çok kampanyası olan önde; ☆ ile mağaza takibi
      const z = {}; V.items.filter((k) => k.bolum === durum.gbolum).forEach((k) => { const m = magaza(k); z[m] = (z[m] || 0) + 1; });
      const zl = Object.entries(z).sort((a, b) => (magazaTakip[b[0]] ? 1 : 0) - (magazaTakip[a[0]] ? 1 : 0) || onc(a[0]) - onc(b[0]) || b[1] - a[1] || a[0].localeCompare(b[0], 'tr'));
      if(zl.length > 1) ust += `<div class="zincir">${zl.map(([m, n]) => `<button data-zincir="${esc(m)}" class="${durum.zincir === m ? 'on' : ''}">${magazaTakip[m] ? '★ ' : ''}${esc(m)}<em>${n}</em></button>`).join('')}</div>`;
    }
    $('#ekran').innerHTML = `
      <div class="bolum">${bolumler.filter(([k]) => k === 'tumu' || say[k]).map(([k, ad]) => `<button data-bolum="${k}" class="${aktif === k ? 'on' : ''}">${ad}<em>${k === 'tumu' ? toplam : say[k]}</em></button>`).join('')}</div>
      ${ust}
      <div class="arac"><label class="ara">🔎<input id="ara" type="search" placeholder="${gunluk ? 'Market, ürün, katalog ara' : 'Mağaza, kampanya, kart ara'}" value="${esc(durum.ara)}" enterkeyhint="search"></label>
        <button class="btn sec" id="filtreAc">Filtre${fs ? ` <b>${fs}</b>` : ''}</button></div>
      ${gunluk && durum.zincir ? `<div class="etiketler"><span>${esc(durum.zincir)}<i data-zincirsil>✕</i></span><span class="mt" data-mtakip="${esc(durum.zincir)}">${magazaTakip[durum.zincir] ? '★ Takipte · yeni kampanyada haber' : '☆ Bu mağazayı takip et'}</span></div>` : ''}
      <div class="sira-bas">${{ yeni: 'EN YENİ KAMPANYA EN ÜSTTE', bitis: 'BİTİŞİ YAKIN OLAN ÜSTTE', indirim: 'EN ÇOK İNDİRİM ÜSTTE', magaza: 'MAĞAZA SIRASIYLA' }[durum.sira]} · ${l.length}</div>
      ${l.length ? `<div class="liste">${l.slice(0, durum.goster).map(kampanyaHTML).join('')}</div>
        ${l.length > durum.goster ? `<button class="btn sec daha" id="daha">Daha fazla göster (${l.length - durum.goster} kampanya daha)</button>` : ''}`
        : `<div class="bos"><b>Bu süzgeçte kampanya yok</b>Filtreleri gevşetmeyi ya da başka bir arama yapmayı dene.</div>`}`;
    const a = $('#ara');
    a.addEventListener('input', () => { durum.ara = a.value; durum.goster = SAYFA; clearTimeout(a._t); a._t = setTimeout(() => { const p = a.selectionStart; goster(); const b = $('#ara'); b.focus(); b.setSelectionRange(p, p); }, 250); });
  }

  function takipEkrani(){
    const ids = Object.keys(takip).sort((a, b) => (kalan(V.byId.get(a) || takip[a]) ?? 999) - (kalan(V.byId.get(b) || takip[b]) ?? 999));
    const satir = ids.map((id) => { const k = V.byId.get(id) || takip[id]; const [s, sc] = sureYazi(k);
      return `<div class="satir2" data-id="${esc(id)}" style="--bc:${RENK[k.bolum] || RENK.diger}"><div class="s-in"><b>${esc(magaza(k).toLocaleUpperCase('tr-TR'))}</b><span>${esc(k.title)}</span><small class="kmp-sure ${sc}">${V.byId.get(id) ? esc(s) : 'Listeden kalktı (bitmiş olabilir)'}</small></div><button class="kalp on" data-kalp="${esc(id)}" aria-label="Takipten çıkar">♥</button></div>`; }).join('');
    const mt = Object.keys(magazaTakip).sort((a, b) => a.localeCompare(b, 'tr'));
    $('#ekran').innerHTML = `<div class="ara-baslik">TAKİP ETTİĞİN KAMPANYALAR · ${ids.length}</div>
      ${ids.length ? `<div class="liste">${satir}</div>` : `<div class="bos"><b>Henüz takip ettiğin kampanya yok</b>Bir kampanyanın ♥ simgesine dokun; bitmeden bir gün önce ve son gün sabahı haber verelim.</div>`}
      <div class="ara-baslik">TAKİP ETTİĞİN MAĞAZALAR · ${mt.length}</div>
      ${mt.length ? `<div class="secenek" style="padding:10px 12px">${mt.map((m) => `<button class="on" data-mtakip="${esc(m)}">★ ${esc(m)} ✕</button>`).join('')}</div>` : `<div class="bos" style="padding:16px 24px">Market sekmesinde bir mağazayı seçip <b style="display:inline;font-size:inherit">☆ Bu mağazayı takip et</b>'e dokun; yeni kampanyası gelince haber verelim.</div>`}
      <div class="bilgi-kutu"><h4>🔔 Ne zaman haber veririz?</h4><ul><li>Takip ettiğin kampanya bitmeden bir gün önce ve son gün sabahı 10:00'da.</li><li>Takip ettiğin mağazaya yeni kampanya ya da katalog düşünce (uygulama açıldığında ve veri yenilendiğinde bakılır).</li></ul></div>`;
  }

  function cuzdanEkrani(){
    const veride = {}; V.items.forEach((k) => (k.cards || []).forEach((c) => { veride[c] = (veride[c] || 0) + 1; }));
    const liste = [...KARTLAR, ...Object.keys(veride).filter((c) => !KARTLAR.some(([n]) => n === c)).map((c) => [c, ''])];
    $('#ekran').innerHTML = `<div class="ara-baslik">CÜZDANIM · ${cuzdan.length} KART</div>
      <div class="bilgi-kutu"><p>Hangi kartların var? Seç; kampanyalarda <b>"Kartıma uyanlar"</b> süzgeci yalnız kartsız ya da senin kartınla geçerli olanları gösterir. Seçimin yalnız bu telefonda tutulur; kart numarası istenmez.</p></div>
      <div class="kartlar">${liste.map(([n, b]) => `<button data-kart="${esc(n)}" class="${cuzdan.includes(n) ? 'on' : ''}"><b>${esc(n)}</b><small>${esc(b)}</small><em>${veride[n] ? `${veride[n]} kampanya` : '—'}</em></button>`).join('')}</div>`;
  }

  function bilgiEkrani(){
    const mk = new Set(V.items.map(magaza)), kat = V.items.filter((k) => k.katalog).length, can = V.items.filter((k) => k.live).length;
    const kn = V.kaynak || {};
    $('#ekran').innerHTML = `
      <div class="bilgi-kutu"><h4>Fırsat Akışı nedir?</h4><p>Market kataloglarını, mağaza ve kart kampanyalarını tek yerde, tarihi ve koşuluyla gösteren bir pano. En yeni kampanya her zaman en üstte.</p>
        <p><b>Satış bizde değil.</b> "Kampanya sayfasında aç" seni mağazanın ya da bankanın kendi sayfasına götürür; fiyat, stok ve koşullar oradadır.</p></div>
      <div class="bilgi-kutu"><h4>Pano şu an</h4><p>${V.items.length} kampanya · ${mk.size} mağaza · ${kat} katalog · ${can} canlı başlık<br>Son güncelleme: ${esc(tarih(V.checkedAt))}${kn.toplam ? `<br>Tarama: ${kn.ok}/${kn.toplam} kaynak yanıt verdi` : ''}</p></div>
      <div class="bilgi-kutu"><h4>Kurallarımız</h4><ul><li>Kampanyalar mağazaların, bankaların ve katalog dizininin herkese açık sayfalarından alınır; sitelerin robots.txt kurallarına uyulur.</li><li>Kaynağında yazmayan iddia gösterilmez; bitiş tarihi geçen kampanya listeden kendiliğinden düşer.</li><li>Marka logosu kullanılmaz; adlar bilgi amaçlıdır. Gösterilen mağaza ve bankalarla ücretli iş birliği yoktur.</li><li>Kişisel verin toplanmaz; takip listen ve cüzdanın yalnız telefonunda tutulur.</li></ul></div>
      <div class="bilgi-kutu" style="text-align:center"><span class="imza" style="color:var(--ink);max-width:none;font-size:13px">Bir <b style="display:inline;font-size:20px;color:#ed713c">Mr. Anduv!</b> yapımıdır.</span></div>`;
  }

  function goster(){
    document.querySelectorAll('#tabbar button').forEach((b) => b.classList.toggle('on', b.dataset.s === durum.ekran));
    ({ market: () => liste(true), firsat: () => liste(false), takip: takipEkrani, cuzdan: cuzdanEkrani, bilgi: bilgiEkrani })[durum.ekran]();
    const n = Object.keys(takip).length, b = $('#takipSay'); b.hidden = !n; b.textContent = n;
  }

  // ── detay ──
  function detay(id){
    const k = V.byId.get(id); if(!k) return;
    const [s, sc] = sureYazi(k);
    const satirlar = [['Mağaza', k.store], k.start && ['Başlangıç', gunAy(k.start)], ['Bitiş', k.end ? `${gunAy(k.end)}${k.endGuess ? ' (tahmini)' : ''}` : 'Kaynakta yazmıyor'],
      k.end && ['Durum', s], (k.cards || []).length && ['Kart', k.cards.join(', ')], (k.channels || []).length && ['Nerede', k.channels.join(', ')], ['Kaynak', k.source || k.store]].filter(Boolean);
    const aciklama = k.detail || (k.live ? `${magaza(k)} kampanya sayfasından alınan başlık. Güncel fiyat, stok ve koşulları kampanya sayfasında doğrula.` : '');
    sheet(`<div class="s-bas"><h2>${k.yerli ? '🇹🇷 ' : ''}${esc(magaza(k))}</h2><button data-kapat aria-label="Kapat">✕</button></div>
      <div class="d-in" style="--bc:${RENK[k.bolum] || RENK.diger}"><span class="marka">${esc(k.emoji || '🛍️')} ${esc(magaza(k).toLocaleUpperCase('tr-TR'))}</span><h3>${esc(k.headline || k.title)}</h3>
        ${k.headline && k.headline !== k.title ? `<p class="d-alt">${esc(k.title)}</p>` : ''}
        <div class="sonfiyat"><span class="kick">${k.katalog ? 'KATALOG' : 'KAMPANYA'}</span><span class="damga ${sc}">${esc(s.replace('⏰ ', ''))}</span><div class="sf">${esc(k.offer || 'Kampanya')}</div><small>${esc(k.source || '')} · ${esc(tarih(V.checkedAt))} itibarıyla · koşullar değişmiş olabilir</small></div>
        ${aciklama ? `<p class="d-ac">${esc(aciklama)}</p>` : ''}
        <div class="tablo">${satirlar.map(([a, b]) => `<div><span>${esc(a)}</span><b>${esc(b)}</b></div>`).join('')}</div>
        ${(k.how || []).length ? `<h4 class="d-h">NASIL KATILIRIM?</h4><ol class="d-ol">${k.how.map((x) => `<li>${esc(x)}</li>`).join('')}</ol>` : ''}
        ${(k.conditions || []).length ? `<h4 class="d-h">DİKKAT ET</h4><ul class="d-ol">${k.conditions.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
        <div class="d-btn"><button class="btn tur" data-git="${esc(k.url)}">Kampanya sayfasında aç ↗</button></div>
        <div class="d-btn"><button class="btn sec" data-kalp="${esc(k.id)}">${takip[k.id] ? '♥ Takipte' : '♡ Takip et'}</button><button class="btn sec" data-paylas="${esc(k.id)}">↗ Paylaş</button></div>
        <p class="not">Satış bizde değil · kampanya mağazanın kendi sayfasında</p></div>`);
  }

  function filtre(){
    const sec = (ad, deger, aktif) => `<button data-${ad}="${esc(deger)}" class="${aktif ? 'on' : ''}">`;
    sheet(`<div class="s-bas"><h2>Filtre</h2><button data-kapat aria-label="Kapat">✕</button></div>
      <div class="f-grup"><h4>SIRALAMA</h4><div class="secenek">${[['yeni','En yeni'],['bitis','Bitişi yakın'],['indirim','En çok indirim'],['magaza','Mağaza']].map(([k, a]) => sec('sira', k, durum.sira === k) + a + '</button>').join('')}</div></div>
      <div class="f-grup"><h4>SÜZ</h4><div class="secenek">${sec('yerli', 1, durum.yerliOnce)}🇹🇷 önce</button>${sec('kartim', 1, durum.kartim)}💳 Kartıma uyanlar${cuzdan.length ? '' : ' (Cüzdan boş)'}</button>${sec('songun', 1, durum.sonGun)}⏰ Son 3 gün</button></div></div>
      <div class="f-alt"><button class="btn sec" id="fTemizle">Temizle</button><button class="btn" id="fUygula">Göster</button></div>`);
  }

  function sheet(html){ $('#sheetIn').innerHTML = html; $('#sheet').hidden = false; $('#sheetIn').scrollTop = 0; }
  function kapat(){ $('#sheet').hidden = true; $('#sheetIn').innerHTML = ''; }
  function toast(m){ const t = $('#toast'); t.textContent = m; t.hidden = false; clearTimeout(t._t); t._t = setTimeout(() => (t.hidden = true), 2400); }

  // ── bildirimler: son gün hatırlatması + takip edilen mağazaya yeni kampanya ──
  const LN = window.Capacitor?.Plugins?.LocalNotifications;
  async function bildirimIzni(){ try { if(LN){ const p = await LN.checkPermissions(); if(p.display !== 'granted') await LN.requestPermissions(); } } catch(e){} }
  const nid = (s) => { let h = 7; for(const c of String(s)) h = (h * 31 + c.charCodeAt(0)) | 0; return Math.abs(h) % 2000000000; };
  async function hatirlatmalar(){
    if(!LN) return;
    try {
      const bekleyen = (await LN.getPending()).notifications || [];
      const bizim = bekleyen.filter((n) => n.extra?.tur === 'son');
      if(bizim.length) await LN.cancel({ notifications: bizim.map((n) => ({ id: n.id })) });
      const plan = [];
      for(const [id, t] of Object.entries(takip)){
        const k = V.byId.get(id) || t; if(!k.end) continue;
        const son = gunDate(k.end); son.setHours(10, 0, 0, 0);
        const once = new Date(son); once.setDate(son.getDate() - 1);
        if(once > new Date()) plan.push({ id: nid(id + 'o'), title: '⏰ Yarın bitiyor', body: `${magaza(k)} · ${k.title}`, schedule: { at: once }, extra: { tur: 'son', id } });
        if(son > new Date()) plan.push({ id: nid(id + 's'), title: '⏰ Bugün son gün', body: `${magaza(k)} · ${k.title}`, schedule: { at: son }, extra: { tur: 'son', id } });
      }
      if(plan.length) await LN.schedule({ notifications: plan.slice(0, 60) });
    } catch(e){}
  }
  async function magazaYenileri(){
    const gorulen = await kayit.al('gorulen', null);
    const simdi = {}; V.items.forEach((k) => { if(magazaTakip[magaza(k)]) (simdi[magaza(k)] = simdi[magaza(k)] || []).push(k.id); });
    if(gorulen){
      const yeniler = [];
      for(const [m, ids] of Object.entries(simdi)){ const eski = new Set(gorulen[m] || []); if(gorulen[m]) ids.filter((i) => !eski.has(i)).forEach((i) => yeniler.push(V.byId.get(i))); }
      if(yeniler.length){
        const metin = yeniler.length === 1 ? `${magaza(yeniler[0])}: ${yeniler[0].title}` : `${[...new Set(yeniler.map(magaza))].join(', ')} · ${yeniler.length} yeni kampanya`;
        try { if(LN) await LN.schedule({ notifications: [{ id: Date.now() % 2147483647, title: '🆕 Takip ettiğin mağazada yeni kampanya', body: metin }] }); } catch(e){}
        toast('🆕 ' + metin);
      }
    }
    await kayit.koy('gorulen', Object.fromEntries(Object.keys(magazaTakip).map((m) => [m, simdi[m] || []])));
  }

  async function kalp(id){
    const k = V.byId.get(id) || takip[id]; if(!k) return;
    if(takip[id]){ delete takip[id]; toast('Takipten çıkarıldı'); }
    else { takip[id] = { t: Date.now(), store: k.store, title: k.title, end: k.end, url: k.url, bolum: k.bolum };
      toast(k.end ? 'Takibe alındı · bitmeden haber vereceğiz' : 'Takibe alındı'); bildirimIzni(); }
    await kayit.koy('takip', takip); hatirlatmalar();
  }
  async function mTakip(m){
    if(magazaTakip[m]){ delete magazaTakip[m]; toast(`${m} takipten çıkarıldı`); }
    else { magazaTakip[m] = true; toast(`★ ${m} takipte · yeni kampanyada haber vereceğiz`); bildirimIzni(); }
    await kayit.koy('magazaTakip', magazaTakip); await magazaYenileri();
  }
  async function paylas(id){
    const k = V.byId.get(id); if(!k) return;
    const metin = `${magaza(k)}: ${k.title} · ${k.offer || ''}${k.end ? ` · ${gunAy(k.end)}'e kadar` : ''}\n${k.url}\n— Fırsat Akışı`;
    try { const S = window.Capacitor?.Plugins?.Share; if(S){ await S.share({ title: 'Fırsat Akışı', text: metin, dialogTitle: 'Paylaş' }); return; } if(navigator.share){ await navigator.share({ text: metin }); return; } } catch(e){ return; }
    try { await navigator.clipboard.writeText(metin); toast('Kopyalandı'); } catch(e){}
  }

  // ── olaylar ──
  document.addEventListener('click', async (e) => {
    const t = e.target.closest('button, .kmp, .satir2, [data-kapat], [data-zincirsil], [data-mtakip]'); if(!t) return;
    const d = t.dataset;
    if('kapat' in d){ kapat(); return; }
    if(d.kalp){ e.stopPropagation(); await kalp(d.kalp); const acik = !$('#sheet').hidden; goster(); if(acik) detay(d.kalp); return; }
    if(d.git){ window.open(d.git, '_blank', 'noopener'); return; }   // kampanya sayfası telefonun kendi tarayıcısında açılır
    if(d.paylas){ paylas(d.paylas); return; }
    if(d.mtakip){ await mTakip(d.mtakip); goster(); return; }
    if('zincirsil' in d){ durum.zincir = ''; durum.goster = SAYFA; goster(); return; }
    if(d.zincir !== undefined && t.closest('.zincir')){ durum.zincir = durum.zincir === d.zincir ? '' : d.zincir; durum.goster = SAYFA; goster(); return; }
    if(d.s){ durum.ekran = d.s; durum.ara = ''; durum.goster = SAYFA; window.scrollTo(0, 0); goster(); return; }
    if(d.bolum){ if(durum.ekran === 'market'){ durum.gbolum = d.bolum; durum.zincir = ''; } else durum.dbolum = d.bolum; durum.goster = SAYFA; goster(); return; }
    if(d.kart){ cuzdan = cuzdan.includes(d.kart) ? cuzdan.filter((c) => c !== d.kart) : [...cuzdan, d.kart]; await kayit.koy('cuzdan', cuzdan); goster(); return; }
    if(t.id === 'daha'){ durum.goster += SAYFA * 2; goster(); return; }
    if(t.id === 'filtreAc'){ filtre(); return; }
    if(d.sira){ durum.sira = d.sira; filtre(); return; }
    if(d.yerli){ durum.yerliOnce = !durum.yerliOnce; filtre(); return; }
    if(d.kartim){ durum.kartim = !durum.kartim; filtre(); return; }
    if(d.songun){ durum.sonGun = !durum.sonGun; filtre(); return; }
    if(t.id === 'fTemizle'){ Object.assign(durum, { sira: 'yeni', yerliOnce: false, kartim: false, sonGun: false }); filtre(); return; }
    if(t.id === 'fUygula'){ durum.goster = SAYFA; kapat(); goster(); window.scrollTo(0, 0); return; }
    if(d.id){ detay(d.id); }
  });

  // ── açılış ──
  async function yenile(){
    const v = await veriYukle(); if(!v) return;
    V = hazirla(v);
    $('#hAlt').textContent = `${V.items.length} kampanya · güncel: ${tarih(V.checkedAt)}`;
    if($('#sheet').hidden) goster();
    magazaYenileri(); hatirlatmalar();
  }
  (async () => {
    takip = await kayit.al('takip', {});
    magazaTakip = await kayit.al('magazaTakip', {});
    cuzdan = await kayit.al('cuzdan', []);
    await yenile();
    document.addEventListener('visibilitychange', () => { if(!document.hidden) yenile(); });
    window.Capacitor?.Plugins?.App?.addListener?.('resume', yenile);
  })();
})();
