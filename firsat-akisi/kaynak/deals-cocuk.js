// Fırsat Akışı — çocuk dünyası: oyuncak, bebek, çocuk giyim (05.10.2026, 21.50)
(function(){
  const D = (o) => Object.assign({ cards:[], channels:['Mağaza','Online'], checked:'2026-10-05', added:'2026-10-05T21:50:00+03:00', value:0, start:null, end:null, kids:true }, o);
  window.FIRSAT_DEALS.push(
  D({ id:'toyzz-barbie-ev', store:'Toyzz Shop', title:'Barbie Rüya Evi Toyzz Shop’ta 18.999,99 TL yerine 15.999,99 TL', category:'Hobi & Oyuncak', type:'money', emoji:'🏠',
    offer:'15.999,99 TL', oldPrice:18999.99, newPrice:15999.99, value:3000,
    detail:'Barbie Rüya Evi (JKG84) indirimde. Toyzz Shop’ta ayrıca “1 alana 1 bedava”, “Çılgın fiyatlar” ve internete özel fiyat bölümleri var.',
    how:['toyzzshop.com’da ürünü ara ya da mağazaya sor.'], conditions:['Stoklarla sınırlı.','Bitiş tarihi belirtilmiyor.'],
    url:'https://www.toyzzshop.com/', source:'Toyzz Shop ana sayfa' }),
  D({ id:'toyzz-lego-classic', store:'Toyzz Shop', title:'LEGO Classic Büyük Boy Yaratıcı Yapım Kutusu 10698: 2.599 TL yerine 2.199 TL', category:'Hobi & Oyuncak', type:'money', emoji:'🧱',
    offer:'2.199 TL', oldPrice:2599, newPrice:2199, value:400,
    detail:'LEGO Classic 10698 büyük boy kutu Toyzz Shop’ta indirimde. Minibo City Otopark Seti 1.459,99 → 1.149,99 TL, piyanolu oyun halısı 1.849,99 → 949,99 TL.',
    how:['toyzzshop.com’da ürünü ara.'], conditions:['Stoklarla sınırlı.','Bitiş tarihi belirtilmiyor.'],
    url:'https://www.toyzzshop.com/', source:'Toyzz Shop ana sayfa' }),
  D({ id:'toyzz-vodafone', store:'Toyzz Shop', title:'Toyzz Shop’ta Vodafone Happy ile 1.500 TL üzeri alışverişe 200 TL indirim', category:'Hobi & Oyuncak', type:'money', emoji:'🎈',
    offer:'1.500 TL’ye 200 TL', value:200,
    detail:'Vodafone Happy üyelerine 1.500 TL ve üzeri Toyzz Shop alışverişinde 200 TL indirim.',
    how:['Vodafone Yanımda’dan Happy kampanyasını al.','Kodu Toyzz Shop’ta kullan.'], conditions:['Vodafone Happy üyeliği gerekir.','Bitiş tarihi belirtilmiyor.'],
    calc:{mode:'threshold', threshold:1500, reward:200, label:'Sepet tutarın'},
    url:'https://www.toyzzshop.com/kampanyalar', source:'Toyzz Shop kampanyalar' }),
  D({ id:'panco-3urun', store:'Panço', title:'Panço’da 3 ve üzeri çocuk ürününe %20 indirim', category:'Çocuk', type:'percent', emoji:'🧒',
    offer:'3 ürüne %20', end:'2026-10-23',
    detail:'Yerli çocuk giyim markası Panço’da seçili ürünlerde 3 ve üzeri alışverişe %20. Ayakkabı, tişört, elbise, gömlek, pantolon ve sweatlerde ayrıca indirimler (31 Ekim’e kadar).',
    how:['Kampanyalı ürünlerden en az 3 tane sepete ekle.'], conditions:['23 Ekim’e kadar.','Diğer kampanyalarla birleşmez.'],
    calc:{mode:'percent', rate:20, label:'Sepet tutarın'},
    url:'https://www.panco.com.tr/3-urun-ve-uzeri-20-indirim/', source:'Panço kampanyalar' }),
  D({ id:'panco-pijama', store:'Panço', title:'Panço çocuk pijama ve iç giyimde 2 al 1 öde', category:'Çocuk', type:'gift', emoji:'🌙',
    offer:'2 al 1 öde', end:'2026-12-31',
    detail:'Pijama ve iç giyim ürünlerinde iki al bir öde; düşük fiyatlı ürün hediye.',
    how:['Pijama ve iç giyim bölümünden 2 ürün seç.'], conditions:['31 Aralık’a kadar.','Diğer kampanyalarla birleşmez.'],
    url:'https://www.panco.com.tr/pijama-ve-ic-giyim-urunlerinde-iki-al-bir-ode', source:'Panço kampanyalar' }),
  D({ id:'joker-gezenbebe', store:'Joker', title:'Joker’de Gezenbebe araç aksesuar setlerinde %25’e varan indirim', category:'Anne & Bebek', type:'percent', emoji:'🚗',
    offer:'%25’e varan indirim', start:'2026-09-16', end:'2026-10-31',
    detail:'Bebek ve çocuk mağazası Joker’de Gezenbebe araç içi aksesuar setlerinde %25’e, Inglesina araba koltuğu ve puset setlerinde %10 indirim. Siparişlerde %5 indirim, 1.000 TL üzeri kargo bedava.',
    how:['joker.com.tr’de kampanyalı setleri seç.'], conditions:['31 Ekim’e kadar.','Seçili setlerde.'],
    url:'https://www.joker.com.tr/kampanyalar', source:'Joker kampanyalar' })
  );
})();
