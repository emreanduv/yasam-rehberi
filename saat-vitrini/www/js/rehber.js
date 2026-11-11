/* Rehber, Nasıl kullanılır ve Ayarlar eylemleri — test önerileri paketi (Yaşam Rehberi 1.0.1, Malazgirt, Hisar, Topçular,
   Legend Heads ile aynı yaklaşım). Saat Vitrini ve Fırsat Vitrini ortak dosyası: uygulamalar bu dosyanın kopyasını www/js/rehber.js olarak taşır.
   - bir sekme ilk kez açılınca kısa ipucu kartı ("Anladım" / "Rehberi kapat"); hangi ipucunun görüldüğü yalnız bu telefonda,
   - Bilgi sekmesinde: Nasıl kullanılır, Rehberi baştan göster, Puan ver, Arkadaşına öner, Bize yaz, Verilerimi sil,
   - uygulama içinden puan: yalnız telefonda, 3. ve 10. kullanım gününde, en çok iki kez.
   Hiçbir veri toplanmaz: puan ve paylaşım telefonun / mağazanın kendi ekranlarıyla yapılır. Bir Mr. Anduv! yapımıdır. */
(() => {
  'use strict';
  const A = window.REHBER_AYAR; if (!A) return;
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const platform = () => { try { const p = window.Capacitor?.getPlatform?.(); if (p && p !== 'web') return p; } catch (e) {} return 'web'; };
  const mobil = () => ['ios', 'android'].includes(platform());
  const MAGAZA = () => platform() === 'ios' ? 'https://apps.apple.com/app/id' + A.appleId : 'https://play.google.com/store/apps/details?id=' + A.paket;
  const Pref = window.Capacitor?.Plugins?.Preferences;
  const kayit = {
    async al(k, v0) { try { if (Pref) { const r = await Pref.get({ key: k }); return r.value ? JSON.parse(r.value) : v0; } const r = localStorage.getItem(k); return r ? JSON.parse(r) : v0; } catch (e) { return v0; } },
    async koy(k, v) { try { const s = JSON.stringify(v); if (Pref) await Pref.set({ key: k, value: s }); else localStorage.setItem(k, s); } catch (e) {} },
  };
  const K = A.onek + '.rehber', KP = A.onek + '.puan', KG = A.onek + '.gunler', ESIK = [3, 10];
  let D = { gor: {}, kapali: false }, P = { n: 0, tamam: false, son: 0 }, gunler = [], kart = null, silOnay = false;

  const aktifEkran = () => document.querySelector('#tabbar button.on')?.dataset.s || A.ilk;
  const toast = (m) => { const t = $('#toast'); if (!t) return; t.textContent = m; t.hidden = false; clearTimeout(t._rh); t._rh = setTimeout(() => (t.hidden = true), 2400); };
  const kartKaldir = () => { kart?.remove(); kart = null; document.querySelector('.rh-puan')?.remove(); };

  function ipucu(ekran) {
    if (kart && kart.dataset.ekran !== ekran) kartKaldir();
    const x = A.ipucu[ekran];
    if (!x || D.kapali || D.gor[ekran] || kart || document.querySelector('.rh-puan')) return;
    kart = document.createElement('div'); kart.className = 'rh-kart'; kart.dataset.ekran = ekran; kart.setAttribute('role', 'status');
    kart.innerHTML = `<div class="rh-h">İpucu · ${esc(A.ad)}</div><div class="rh-b"><b>${esc(x[0])}</b><p>${esc(x[1])}</p>
      <div class="rh-d"><button class="btn" data-rh="tamam">Anladım</button><button class="btn sec" data-rh="kapat">Rehberi kapat</button></div></div>`;
    document.body.appendChild(kart);
  }

  function nasil() {
    const liste = A.sira.map((k) => `<div class="rh-sat${D.gor[k] ? '' : ' yeni'}"><b>${esc(A.ipucu[k][0])}</b><p>${esc(A.ipucu[k][1])}</p></div>`).join('');
    $('#sheetIn').innerHTML = `<div class="s-bas"><h2>Nasıl kullanılır</h2><button data-kapat aria-label="Kapat">✕</button></div>
      <div class="rh-ic"><p class="rh-giris">${esc(A.giris)}</p><div class="rh-ara">Bütün ipuçları · altın çerçeveliler henüz görmediklerin</div>
      <div class="rh-liste">${liste}</div>
      <div class="rh-dugmeler"><button class="btn" data-rh="bastan">↺ Rehberi baştan göster</button><button class="btn sec" data-rh="oner">Arkadaşına öner</button><button class="btn sec" data-rh="yaz">Bize yaz</button></div></div>`;
    $('#sheet').hidden = false; $('#sheetIn').scrollTop = 0;
  }

  function ayarPaneli() {
    const sat = (rh, ic, b, h, cls = '') => `<button class="rh-satir ${cls}" data-rh="${rh}"><span class="rh-ik">${ic}</span><span><b>${esc(b)}</b><small>${esc(h)}</small></span><i>›</i></button>`;
    return `<div class="bilgi-kutu rh-ayar"><h4>Rehber ve ayarlar</h4>
      ${sat('nasil', '?', 'Nasıl kullanılır', 'Bütün ipuçları, görmediklerin vurgulu')}
      ${sat('bastan', '↺', 'Rehberi baştan göster', 'İpucu kartları sekmeleri ilk açışındaki gibi yeniden çıkar')}
      ${mobil() ? sat('puan', '★', 'Puan ver', 'Mağazanın kendi puan ekranı açılır') : ''}
      ${sat('oner', '↗', 'Arkadaşına öner', 'Telefonun paylaşım menüsüyle')}
      ${sat('yaz', '✉', 'Bize yaz', 'emreanduvart@gmail.com · sürüm ve cihaz bilgisi hazır gelir')}
      ${sat('sil', '×', silOnay ? 'Emin misin? Bir daha dokun, silinsin' : 'Verilerimi sil', A.silMetni + ' Bizde senin hakkında hiçbir kayıt yok.', 'rh-sil' + (silOnay ? ' onay' : ''))}
      <p class="rh-alt">Uygulama hiçbir kişisel veri toplamaz. <a href="${esc(A.gizlilik)}">Gizlilik politikası</a> · Sürüm ${esc(A.surum)}</p></div>`;
  }
  function ayarEkle() {
    if (aktifEkran() !== 'bilgi') return;
    const ek = $('#ekran'); if (!ek || ek.querySelector('.rh-ayar')) return;
    const imza = [...ek.querySelectorAll('.bilgi-kutu')].pop();
    const t = document.createElement('div'); t.innerHTML = ayarPaneli();
    const el = t.firstElementChild;
    if (imza) ek.insertBefore(el, imza); else ek.appendChild(el);
  }

  function puanSorulsunMu() {
    if (!mobil() || P.tamam || P.n >= 2) return false;
    const e = ESIK.filter((x) => gunler.length >= x).pop();
    return !!e && P.son < e;
  }
  function puanKarti() {
    if (kart || document.querySelector('.rh-puan') || !$('#sheet').hidden) return;
    const e = ESIK.filter((x) => gunler.length >= x).pop();
    P.son = e; P.n++; kayit.koy(KP, P);
    const el = document.createElement('div'); el.className = 'rh-kart rh-puan'; el.setAttribute('role', 'status');
    el.innerHTML = `<div class="rh-h">${e}. gün · teşekkürler</div><div class="rh-b"><b>${esc(A.ad)} işine yarıyor mu?</b><p>Bir puan, başkalarının da bulmasına yardım eder. Önerin varsa doğrudan bize yaz.</p>
      <div class="rh-d"><button class="btn" data-rh="puan">★ Puan ver</button><button class="btn sec" data-rh="yaz">Önerim var</button><button class="btn sec" data-rh="oner">Paylaş</button><button class="btn sec" data-rh="sonra">Sonra</button></div></div>`;
    document.body.appendChild(el);
  }
  async function puanVer() {
    P.tamam = true; await kayit.koy(KP, P); kartKaldir();
    const R = window.Capacitor?.Plugins?.InAppReview;
    try { if (R?.requestReview) { await R.requestReview(); return; } } catch (e) {}
    try { window.open(MAGAZA(), '_blank'); } catch (e) { location.href = MAGAZA(); }
  }
  async function paylas() {
    const url = MAGAZA(), S = window.Capacitor?.Plugins?.Share;
    try {
      if (S?.share) { await S.share({ title: A.ad, text: A.paylasMetni, url, dialogTitle: 'Arkadaşına öner' }); return; }
      if (navigator.share) { await navigator.share({ title: A.ad, text: A.paylasMetni, url }); return; }
    } catch (e) { if (/cancel|abort/i.test(e?.message || e?.name || '')) return; }
    try { await navigator.clipboard.writeText(A.paylasMetni + ' ' + url); toast('Bağlantı kopyalandı, istediğin yere yapıştır'); } catch (e) { toast(url); }
  }
  function bizeYaz() {
    const konu = `${A.ad} – Görüş ve öneri (${A.surum}, ${platform()})`;
    const govde = `Merhaba, ${A.ad} ile ilgili görüşüm:\n\n\n— ${A.surum} · ${platform()} · ${gunler.length}. kullanım günü`;
    location.href = 'mailto:emreanduvart@gmail.com?subject=' + encodeURIComponent(konu) + '&body=' + encodeURIComponent(govde);
  }
  async function verileriSil() {
    const C = window.Capacitor?.Plugins || {};
    try { const LN = C.LocalNotifications; if (LN) { const p = await LN.getPending(); if (p?.notifications?.length) await LN.cancel({ notifications: p.notifications.map((n) => ({ id: n.id })) }); } } catch (e) {}
    try { if (C.Preferences?.clear) await C.Preferences.clear(); } catch (e) {}
    try { localStorage.clear(); } catch (e) {}
    try { sessionStorage.clear(); } catch (e) {}
    location.reload();
  }
  function bastan() { D = { gor: {}, kapali: false }; kayit.koy(K, D); kartKaldir(); toast('Rehber baştan başladı'); setTimeout(() => ipucu(aktifEkran()), 300); }

  document.addEventListener('click', async (e) => {
    const t = e.target.closest('[data-rh]'); if (!t) return;
    e.stopPropagation();
    const a = t.dataset.rh;
    if (a === 'tamam' || a === 'kapat') { const k = kart?.dataset.ekran; if (k) D.gor[k] = 1; if (a === 'kapat') D.kapali = true; kayit.koy(K, D); kartKaldir(); return; }
    if (a === 'nasil') { nasil(); return; }
    if (a === 'bastan') { $('#sheet').hidden = true; bastan(); return; }
    if (a === 'oner') { kartKaldir(); paylas(); return; }
    if (a === 'yaz') { kartKaldir(); bizeYaz(); return; }
    if (a === 'puan') { puanVer(); return; }
    if (a === 'sonra') { kartKaldir(); return; }
    if (a === 'sil') { if (!silOnay) { silOnay = true; $('#ekran').querySelector('.rh-ayar')?.remove(); ayarEkle(); return; } await verileriSil(); }
  }, true);

  // sekme değişince ipucu; Bilgi sekmesine ayar paneli; ilk sekmede kullanım eşiğinde nazik puan sorusu
  let son = '';
  function izle() {
    const ek = aktifEkran();
    if (ek !== son) { son = ek; silOnay = false; setTimeout(() => ipucu(ek), 400); if (ek === A.ilk && puanSorulsunMu()) setTimeout(() => { if (aktifEkran() === A.ilk) puanKarti(); }, 2500); }
    ayarEkle();
  }

  (async () => {
    D = { gor: {}, kapali: false, ...(await kayit.al(K, {})) };
    P = { ...P, ...(await kayit.al(KP, {})) };
    gunler = await kayit.al(KG, []);
    const bugun = new Date().toISOString().slice(0, 10);
    if (!gunler.includes(bugun)) { gunler = [...gunler, bugun].slice(-30); await kayit.koy(KG, gunler); }
    const ek = $('#ekran');
    if (ek) new MutationObserver(izle).observe(ek, { childList: true });
    izle();
  })();
})();
