// Fırsat Akışı — herkese hitap eden perakende & kooperatif marketleri (10.10.2026, 11.30)
// Güncel indirim katalogları. Kaynak: cimri.com/brosur ve okatalog.com katalog dizinleri.
(function(){
  const AY = ['', 'Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'];
  const gun = s => s.slice(8,10).replace(/^0/,'');
  const D = (o) => Object.assign({ cards:[], channels:['Mağaza'], checked:'2026-10-10', added:'2026-10-10T11:30:00+03:00', value:0,
    category:'Market', type:'gift', emoji:'🛒',
    how:['Kataloğu bağlantıdan aç, ürünleri listele.','Katalog fiyatları stoklarla sınırlıdır; erken git.'],
    conditions:['Katalog fiyatları stoklarla sınırlı.','Ürün ve fiyatlar şubeye göre değişebilir.'] }, o);
  const K = (id, store, title, start, end, url, source, extra={}) => D(Object.assign({ id, store, title,
    headline: title,
    offer:`Katalog · ${gun(start)}${start.slice(5,7)!==end.slice(5,7)?' '+AY[+start.slice(5,7)]:''}–${gun(end)} ${AY[+end.slice(5,7)]}`,
    start, end, url, source, detail:`${store} güncel indirim kataloğu yayında; indirimli ürünler ve fiyatlar katalogda.` }, extra));
  window.FIRSAT_DEALS.push(
    K('migros-5m-8ekim', 'Migros', 'Migros 5M İndirim Kataloğu: 8–21 Ekim fırsatları', '2026-10-08', '2026-10-21',
      'https://www.cimri.com/brosur/migros-com-tr/migros-08-ekim-2026-aktuel-katalogu-indirim-brosuru-26974', 'cimri.com · Migros 8 Ekim kataloğu',
      { emoji:'🟠', detail:'Migros 5M ve Migros indirim katalogları 8–21 Ekim arasında geçerli. Money Kart’la ek indirimler katalogda belirtilir.' }),
    K('fiskomar-7ekim', 'Fiskobirlik', 'Fiskomar (Fiskobirlik) İndirim Broşürü: 7–31 Ekim', '2026-10-07', '2026-10-31',
      'https://www.cimri.com/brosur/fiskobirlik-com-tr/fiskomar-07-ekim-2026-aktuel-katalogu-indirim-brosuru-26949', 'cimri.com · Fiskomar 7 Ekim broşürü',
      { emoji:'🌰', detail:'Karadeniz’in fındık üreticisi kooperatifi Fiskobirlik’in market zinciri Fiskomar’da Ekim indirim broşürü yayında (7–31 Ekim).' }),
    K('tkk-katkat-6ekim', 'Tarım Kredi', 'Tarım Kredi Koop Market “Kat Kat Fırsat” Kataloğu', '2026-10-06', '2026-10-12',
      'https://www.okatalog.com/istanbul/katalog-brosur/tarim-kredi-market', 'okatalog.com · Tarım Kredi Market',
      { emoji:'🌾', detail:'Tarım Kredi Kooperatif Marketlerinde “Kat Kat Fırsat” kataloğu 6–12 Ekim arasında geçerli.' }),
    K('tkk-haftasonu-10ekim', 'Tarım Kredi', 'Tarım Kredi Koop Market: Fırsat Dolu Hafta Sonu', '2026-10-10', '2026-10-12',
      'https://www.okatalog.com/istanbul/katalog-brosur/tarim-kredi-market', 'okatalog.com · Tarım Kredi Market',
      { emoji:'🌾', detail:'Tarım Kredi Kooperatif Marketlerinde hafta sonuna özel fırsat kataloğu: 10–12 Ekim.' }),
    K('file-2ekim', 'File', 'File İndirim Broşürü: 2–16 Ekim', '2026-10-02', '2026-10-16',
      'https://www.cimri.com/brosur/file-com-tr', 'cimri.com · File broşürleri',
      { emoji:'🟢', detail:'File marketlerde 2–16 Ekim indirim broşürü ve ay boyu (1–31 Ekim) geçerli Ekim broşürü yayında.' }),
    K('bim-7ekim', 'BİM', 'BİM İndirim Kataloğu: 7–14 Ekim', '2026-10-07', '2026-10-14',
      'https://www.cimri.com/brosur/bim-com-tr', 'cimri.com · BİM katalogları',
      { emoji:'🔴', detail:'BİM’in 7–14 Ekim indirim kataloğu yayında; aktüel ürünler her salı ve cuma yenilenir.' }),
    K('sok-haftanin-7ekim', 'ŞOK', 'ŞOK “Haftanın Fırsatları” Kataloğu: 7–13 Ekim', '2026-10-07', '2026-10-13',
      'https://www.okatalog.com/istanbul/katalog-brosur/sok-market', 'okatalog.com · ŞOK Market',
      { emoji:'🟡', detail:'ŞOK marketlerde Haftanın Fırsatları kataloğu 7–13 Ekim, hafta sonu indirim kataloğu 10–13 Ekim arasında geçerli.' }),
    K('metro-olmazsa-7ekim', 'Metro', 'Metro “Olmazsa Olmaz” Kataloğu: 7–13 Ekim', '2026-10-07', '2026-10-13',
      'https://www.cimri.com/brosur/metro-tr/metro-tr-07-ekim-2026-aktuel-katalogu-indirim-brosuru-26908', 'cimri.com · Metro 7 Ekim kataloğu',
      { emoji:'🔵', detail:'Metro Toptancı Market’te Olmazsa Olmaz, Taze Ürünler ve Fast Food katalogları 7–13 Ekim; Kişisel Bakım & Temizlik kataloğu 1–31 Ekim.' })
  );
})();
