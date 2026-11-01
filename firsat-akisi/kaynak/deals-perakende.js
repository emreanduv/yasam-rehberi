// Fırsat Akışı — perakende / zincir market taraması (04.10.2026, 23.00)
// Ulusal zincirler + bölgesel zincirlerin güncel indirim katalogları. Kaynak: zincirlerin katalog sayfaları ve katalog dizinleri (cimri.com/brosur, okatalog.com).
(function(){
  const D = (o) => Object.assign({ cards:[], channels:['Mağaza'], checked:'2026-10-04', added:'2026-10-04T22:55:00+03:00', value:0, start:null, end:null,
    category:'Market', type:'gift', emoji:'🛒',
    how:['Kataloğu bağlantıdan aç, ürünleri listele.','Katalog fiyatları stoklarla sınırlıdır; erken git.'],
    conditions:['Katalog fiyatları stoklarla sınırlı.','Ürün ve fiyatlar şubeye göre değişebilir.'] }, o);
  const K = (id, store, title, start, end, url, source, extra={}) => D(Object.assign({ id, store, title,
    offer:`Katalog · ${start.slice(8,10).replace(/^0/,'')}${start.slice(5,7)!==(end||start).slice(5,7)?' '+AY[+start.slice(5,7)]:''}–${end?end.slice(8,10).replace(/^0/,'')+' '+AY[+end.slice(5,7)]:''}`.replace(/–$/,' itibaren'),
    start, end, url, source, detail:`${store} indirim kataloğu yayında. Haftanın indirimli ürünleri ve fiyatları katalogda.` }, extra));
  const AY = ['', 'Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'];
  window.FIRSAT_DEALS.push(
  // ───────────── ULUSAL ZİNCİRLER ─────────────
  D({ id:'a101-aldin-1ekim-tv', store:'A101', title:'A101 Aldın Aldın: 65" 4K QLED Google TV 26.999 TL', type:'money', emoji:'📺',
    offer:'65" TV 26.999 TL', start:'2026-10-01',
    detail:'1 Ekim Aldın Aldın kataloğu: 65 inç çerçevesiz 4K UHD Google QLED TV 26.999 TL, No Frost buzdolabı 27.999 TL, 9 kg çamaşır makinesi 18.999 TL, 4 programlı bulaşık makinesi 14.999 TL, espresso makinesi 15.999 TL.',
    how:['1 Ekim’den itibaren A101 mağazalarında.'], conditions:['Stoklarla sınırlı.','Katalog haber kaynağından derlendi.'],
    url:'https://www.a101.com.tr/kampanyalar', source:'A101 1 Ekim kataloğu (Halk TV, 01.10.2026)' }),
  D({ id:'a101-aldin-1ekim-bisiklet', store:'A101', title:'A101 Aldın Aldın: elektrikli bisiklet 29.990 TL · dikey süpürge 11.499 TL', type:'money', emoji:'🚲',
    offer:'E-bisiklet 29.990 TL', start:'2026-10-01',
    detail:'1 Ekim kataloğunda elektrikli bisiklet 29.990 TL, 150cc motosiklet 109.990 TL, kablosuz dikey süpürge 11.499 TL, tam otomatik kahve makinesi 9.999 TL.',
    how:['1 Ekim’den itibaren A101 mağazalarında.'], conditions:['Stoklarla sınırlı.'],
    url:'https://www.a101.com.tr/kampanyalar', source:'A101 1 Ekim kataloğu (Halk TV, 01.10.2026)' }),
  K('sok-haftalik-0930', 'ŞOK', 'ŞOK haftanın fırsatları kataloğu: 30 Eylül–6 Ekim', '2026-09-30', '2026-10-06', 'https://www.okatalog.com/istanbul/katalog-brosur/sok', 'okatalog · ŞOK kataloğu'),
  K('migros-5m-0924', 'Migros', 'Migros 5M İndirim Kataloğu: 24 Eylül–7 Ekim', '2026-09-24', '2026-10-07', 'https://www.cimri.com/brosur/migros-com-tr/migros-24-eylul-2026-aktuel-katalogu-indirim-brosuru-26572', 'cimri · Migros kataloğu', { detail:'Migros 5M ve Migros indirim katalogları 7 Ekim’e kadar geçerli. Money Kart ile ek indirimler katalogda.' }),
  K('metro-olmazsa-0930', 'Metro', 'Metro “Olmazsa Olmaz” ve Taze Ürünler katalogları: 30 Eylül–6 Ekim', '2026-09-30', '2026-10-06', 'https://www.cimri.com/brosur/metro-tr/metro-tr-30-eylul-2026-aktuel-katalogu-indirim-brosuru-26713', 'cimri · Metro kataloğu', { emoji:'🏬', detail:'Metro Toptancı Market’in Olmazsa Olmaz, Taze Ürünler, Kafe & Pastane, Fast Food ve Kurum Mutfakları katalogları 6 Ekim’e kadar.', conditions:['Metro Kart gerekir.','Stoklarla sınırlı.'] }),
  K('bizim-0930', 'Bizim Toptan', 'Bizim Toptan indirim kataloğu: 30 Eylül–6 Ekim', '2026-09-30', '2026-10-06', 'https://www.cimri.com/brosur/bizimtoptan-com-tr/bizim-toptan-30-eylul-2026-aktuel-katalogu-indirim-brosuru-26735', 'cimri · Bizim Toptan kataloğu'),
  K('file-0918', 'File', 'File Market indirim broşürü: 18 Eylül–18 Ekim', '2026-09-18', '2026-10-18', 'https://www.cimri.com/brosur/file-com-tr/file-18-eylul-2026-aktuel-katalogu-indirim-brosuru-26561', 'cimri · File kataloğu', { detail:'BİM grubunun File Market’i: ayın indirim broşürü 18 Ekim’e kadar; 23 Eylül–6 Ekim broşürü de geçerli.' }),
  K('hakmar-1002', 'Hakmar Express', 'Hakmar Express indirim kataloğu: 2–15 Ekim', '2026-10-02', '2026-10-15', 'https://www.cimri.com/brosur/hakmarexpress-com-tr/hakmarexpress-02-ekim-2026-aktuel-katalogu-indirim-brosuru-26818', 'cimri · Hakmar Express kataloğu'),
  K('tkk-0929', 'Tarım Kredi Koop Market', 'Tarım Kredi Koop Market indirim kataloğu: 29 Eylül–5 Ekim', '2026-09-29', '2026-10-05', 'https://www.okatalog.com/istanbul/katalog-brosur/tarim-kredi-market', 'okatalog · Koop Market kataloğu', { detail:'Tarım Kredi Kooperatif Market’in haftalık indirim kataloğu 5 Ekim’e kadar; manav indirim kataloğu 3–5 Ekim.' }),
  K('happy-1001', 'Happy Center', 'Happy Center indirim kataloğu', '2026-10-01', '2026-10-05', 'https://www.cimri.com/brosur/happy-com-tr/happy-01-ekim-2026-aktuel-katalogu-indirim-brosuru-26743', 'cimri · Happy Center kataloğu'),

  // ───────────── BÖLGESEL ZİNCİRLER ─────────────
  K('cagri-1002', 'Çağrı Market', 'Çağrı Market indirim kataloğu: 2–12 Ekim', '2026-10-02', '2026-10-12', 'https://www.cimri.com/brosur/cagri', 'cimri · Çağrı kataloğu'),
  K('ozhan-1001', 'Özhan Market', 'Özhan Market Ekim indirim kataloğu', '2026-10-01', '2026-10-31', 'https://www.cimri.com/brosur/ozhan-com-tr', 'cimri · Özhan kataloğu'),
  K('groseri-1001', 'Groseri', 'Groseri indirim kataloğu: 1–20 Ekim', '2026-10-01', '2026-10-20', 'https://www.cimri.com/brosur/groseri-com-tr', 'cimri · Groseri kataloğu'),
  K('esenlik-0928', 'Esenlik Market', 'Esenlik indirim kataloğu: 28 Eylül–11 Ekim', '2026-09-28', '2026-10-11', 'https://www.cimri.com/brosur/esenlik-com-tr', 'cimri · Esenlik kataloğu'),
  K('altun-0930', 'Altun Market', 'Altun Market indirim kataloğu: 30 Eylül–14 Ekim', '2026-09-30', '2026-10-14', 'https://www.cimri.com/brosur/altunmarket', 'cimri · Altun Market kataloğu'),
  K('cetinkaya-1001', 'Çetinkaya Market', 'Çetinkaya indirim kataloğu: 1–14 Ekim', '2026-10-01', '2026-10-14', 'https://www.cimri.com/brosur/cetinkaya-com-tr', 'cimri · Çetinkaya kataloğu'),
  K('grosper-0930', 'Grosper', 'Grosper indirim kataloğu: 30 Eylül–12 Ekim', '2026-09-30', '2026-10-12', 'https://www.cimri.com/brosur/grosper-com-tr', 'cimri · Grosper kataloğu'),
  K('pekdemir-1002', 'Pekdemir Market', 'Pekdemir indirim kataloğu: 2–9 Ekim', '2026-10-02', '2026-10-09', 'https://www.cimri.com/brosur/pekdemir-com-tr', 'cimri · Pekdemir kataloğu'),
  K('akyurt-0925', 'Akyurt Market', 'Akyurt indirim kataloğu: 25 Eylül–8 Ekim', '2026-09-25', '2026-10-08', 'https://www.cimri.com/brosur/akyurt-com-tr', 'cimri · Akyurt kataloğu'),
  K('sec-0924', 'Seç Market', 'Seç Market indirim kataloğu: 24 Eylül–7 Ekim', '2026-09-24', '2026-10-07', 'https://www.cimri.com/brosur/secmarket-com-tr', 'cimri · Seç Market kataloğu'),
  K('tedi-1007', 'TEDi', 'TEDi indirim kataloğu: 7–19 Ekim', '2026-10-07', '2026-10-19', 'https://www.cimri.com/brosur/tedi-com-tr', 'cimri · TEDi kataloğu', { category:'Ev & Yaşam', emoji:'🧺' })
  );
})();
