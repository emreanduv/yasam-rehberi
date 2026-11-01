// Fırsat Akışı — 🇹🇷 evin temel ihtiyaçları: zeytinyağı, süt, yağ, çay, fındık (10.10.2026)
(function(){
  const D = (o) => Object.assign({ cards:[], channels:['Online'], checked:'2026-10-10', added:'2026-10-10T11:20:00+03:00', value:0, start:null, end:null, category:'Market' }, o);
  window.FIRSAT_DEALS.push(
  D({ id:'marmarabirlik-zeytinyagi', store:'Marmarabirlik', headline:'Marmarabirlik’te 5 litre zeytinyağında %10 indirim', title:'Marmarabirlik 5 lt natürel sızma zeytinyağı teneke 2.215 TL yerine 1.990 TL',
    type:'money', emoji:'🫒', offer:'1.990 TL', oldPrice:2215, newPrice:1990, value:225,
    detail:'Kooperatif markası Marmarabirlik’in online mağazasında 5 litrelik natürel sızma zeytinyağı tenekesi %10 indirimli; yeni çıkan 400 g zeytinyağlı kakaolu fındık kreması 240,50 TL yerine 216 TL.',
    how:['e-marmarabirlik.com’dan ürünü sepete ekle.'], conditions:['Stoklarla sınırlı.','Bitiş tarihi belirtilmiyor.'],
    url:'https://www.e-marmarabirlik.com/', source:'Marmarabirlik online mağaza' }),
  D({ id:'taris-zeytinyagi', store:'Tariş', headline:'Tariş’te 5 litre zeytinyağı 1.625 TL’den', title:'Tariş zeytinyağı fırsat ürünleri: 5 lt Riviera 1.625 TL, Güney Ege natürel sızma 2.115 TL',
    type:'money', emoji:'🫒', offer:'5 lt 1.625 TL’den',
    detail:'Ege’nin kooperatif markası Tariş’in online mağazasında fırsat ürünleri: 5 lt Riviera 1.625 TL, 5 lt rafine 1.615 TL, 5 lt 1915 natürel sızma 2.105 TL, 5 lt Güney Ege natürel sızma 2.115 TL. 2.500 TL üzeri kargo bedava.',
    how:['tariszeytin.com.tr’den sipariş ver.'], conditions:['Kargo 2.500 TL üzeri ücretsiz.','Fiyatlar değişebilir.'],
    url:'https://www.tariszeytin.com.tr/', source:'Tariş online mağaza' }),
  D({ id:'sutas-market', store:'Sütaş', headline:'Sütaş Market’te süt ve yoğurtta indirim', title:'Sütaş Market’te tam yağlı süt 12’li 859 TL yerine 810 TL, süzme yoğurt 750 g 145 TL yerine 130 TL',
    type:'money', emoji:'🥛', offer:'Süt 12’li 810 TL', oldPrice:859, newPrice:810, value:49,
    detail:'Sütaş’ın online marketinde: tam yağlı süt 1 L 12’li 810 TL, süzme yoğurt 750 g 130 TL, sade kefir 1 L 90 TL, barista süt 1 L 62 TL, çikolatalı süt 200 ml 27’li 445 TL.',
    how:['sutas.market’ten adresine sipariş ver.'], conditions:['Teslimat bölgesi ve koşulları sitede.','Fiyatlar değişebilir.'],
    url:'https://sutas.market/', source:'Sütaş Market' }),
  D({ id:'cotanak-ezme', store:'Çotanak', headline:'Çotanak’ta fındık ezmelerinde %20 indirim', title:'Giresun’un Çotanak’ında fındık ezmesi ve sürülebilirlerde %20, özel çikolatalarda %10 indirim',
    type:'percent', emoji:'🌰', offer:'Ezmelerde %20',
    detail:'Yerli fındık markası Çotanak’ın online mağazasında ezme ve sürülebilir ürünlerde %20, özel çikolatalarda %10 indirim; 2×5 lt fındık yağı fırsat paketi. 5.000 TL üzeri kargo bedava.',
    how:['cotanaksatis.com’da kampanyalı kategoriyi aç.'], conditions:['Bitiş tarihi belirtilmiyor.','5.000 TL altı siparişte kargo ücretli.'],
    calc:{mode:'percent', rate:20, label:'Sepet tutarın'},
    url:'https://www.cotanaksatis.com/', source:'Çotanak online satış' }),
  D({ id:'a101-temel-gida-1010', store:'A101', headline:'A101’de bu hafta: Yudum 4,5 lt 499 TL, Çaykur 500 g 215 TL', title:'A101 Haftanın Yıldızları (10–16 Ekim): Yudum ayçiçek yağı 4,5 lt 499 TL, Çaykur Altınbaş 500 g 215 TL',
    type:'money', emoji:'🛒', offer:'Yudum 4,5 lt 499 TL', start:'2026-10-10', end:'2026-10-16', channels:['Mağaza'],
    detail:'Yerli markalarda temel gıda: Yudum ayçiçek yağı 4,5 lt 499 TL, Çaykur Altınbaş klasik çay 500 g 215 TL, İçim tam yağlı süzme peynir 750 g 195 TL, Filiz makarna 500 g 29,50 TL, toz şeker 3 kg 149,50 TL.',
    how:['10–16 Ekim arasında A101 mağazalarına uğra.'], conditions:['Stoklarla sınırlı.','Katalog haber kaynağından derlendi.'],
    url:'https://www.a101.com.tr/kampanyalar', source:'A101 Haftanın Yıldızları 10–16 Ekim (Nokta Gazetesi)' })
  );
})();
