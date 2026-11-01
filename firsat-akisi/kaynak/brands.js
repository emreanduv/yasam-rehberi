// Yerli ve milli markalar dizini
// Kaynak: yerli-markalar.com “Yerli markalar listesi” (04.10.2026'da alındı) + kullanıcının paylaştığı katalog görseli.
// 15.10.2026 eleği: yabancıya geçen İçim (Lactalis) ve Komili (Bunge) çıkarıldı; Koçtaş, CarrefourSA, Flormar, Pazarama eklendi. Kalanların sahipliği tek tek doğrulanmadı.
//
// Alanlar:  n: marka adı · a: eşleşme için diğer adlar (kart programı, uygulama, kısaltma)
//           u: kampanya/marka sayfası (yalnız kontrol edilenler) · t: 1 → kampanya BAŞLIĞINDA geçerse de eşleştir
//           (genel kelimeye benzeyen adlar — “Tat”, “Halk”, “Test”, “Sunny” — yalnız mağaza adında eşleşir)
//           off: 1 → faaliyeti durmuş (soluk gösterilir) · s: kısa not
window.YERLI_MARKALAR = [
  { cat:'Market', icon:'🛒', brands:[
    { n:'A101', a:['A101 Ekstra'], u:'https://www.a101.com.tr/kampanyalar', t:1 },
    { n:'BİM', a:['BIM'], u:'https://www.bim.com.tr/Categories/254/aktuel_urunler.aspx', t:1 },
    { n:'ŞOK', a:['Cepte ŞOK','ŞOK Market','SOK'], u:'https://www.sokmarket.com.tr/kampanyalar', t:1 },
    { n:'Hakmar', a:['Hakmar Express'], t:1 },
    { n:'Bizim Toptan', a:['Bizim Toptan Satış'], u:'https://www.bizimtoptan.com.tr/kampanyalar', t:1 },
    { n:'Makro Market', t:1 }, { n:'Pehlivanoğlu', t:1 }, { n:'Adese', t:1 }, { n:'Çağrı', a:['Çağrı Semt','Çağrı Market'] }, { n:'Happy Center' }, { n:'Özhan Market', a:['Özhan'] }, { n:'Groseri' }, { n:'Esenlik Market', a:['Esenlik'] }, { n:'Altun Market' }, { n:'Çetinkaya Market' }, { n:'Grosper' }, { n:'Pekdemir Market' }, { n:'Akyurt Market' }, { n:'Seç Market' }, { n:'UCZ', a:['UCZ Komşu Market'] }
  ]},
  { cat:'Elektronik Mağaza', icon:'🖥️', brands:[
    { n:'Teknosa', a:['TeknoClub'], u:'https://www.teknosa.com/kampanyalar', t:1 },
    { n:'Vatan Bilgisayar', a:['Vatan'], u:'https://www.vatanbilgisayar.com/kampanyalar/', t:1 },
    { n:'Türk Telekom', a:['Tivibu','TT'], u:'https://bireysel.turktelekom.com.tr/mobil/kampanyalar', t:1 }, { n:'tabii', a:['TRT tabii','TRT'], u:'https://www.tabii.com/tr', t:1 }, { n:'Exxen', a:['Exxenspor'], u:'https://www.exxen.com/tr', t:1 }, { n:'puhutv', u:'https://puhutv.com/', t:1 }
  ]},
  { cat:'Beyaz Eşya · Ev Aletleri', icon:'🧺', brands:[
    { n:'Arçelik', a:['Arcelik'], u:'https://www.arcelik.com.tr/kampanyalar', t:1 },
    { n:'Beko', u:'https://www.beko.com.tr/kampanyalar', t:1 },
    { n:'Vestel', u:'https://www.vestel.com.tr/kampanyalar', t:1 },
    { n:'Grundig', u:'https://www.grundig.com.tr/kampanyalar', t:1, s:'Arçelik grubu' },
    { n:'Altus', t:1 }, { n:'Regal', t:1 }, { n:'Simfer', t:1 }, { n:'Uğur', a:['Uğur Soğutma'] }, { n:'Sunny' },
    { n:'Arnica', t:1 }, { n:'Blue House' }, { n:'Homend', t:1 }, { n:'Kumtel', t:1 }, { n:'Luxell', t:1 },
    { n:'Raks' }, { n:'Sinbo', t:1 }, { n:'UFO', a:['UFO İnfrared'] }
  ]},
  { cat:'Televizyon · Telefon · Tablet', icon:'📱', brands:[
    { n:'Casper', u:'https://www.casper.com.tr/kampanyalar', t:1 },
    { n:'General Mobile', t:1 }, { n:'Reeder', t:1 }, { n:'Piranha' }, { n:'Preo', t:1, s:'Teknosa markası' },
    { n:'Quatro' }, { n:'Dark' }, { n:'Excon' }, { n:'Escort' }, { n:'Trident' }, { n:'Venus', a:['Vestel Venus'] },
    { n:'Finlux', t:1 }, { n:'SEG' }, { n:'Telefunken', s:'Türkiye lisansı' }
  ]},
  { cat:'Giyim · Ayakkabı', icon:'👕', brands:[
    { n:'LC Waikiki', a:['LCW','LC Waikiki fırsat alanı'], u:'https://www.lcw.com/', t:1 },
    { n:'DeFacto', a:['De Facto'], u:'https://www.defacto.com.tr/kampanyalar', t:1 },
    { n:'Koton', u:'https://www.koton.com/kampanyalar', t:1 },
    { n:'Mavi', a:['Mavi Jeans'], u:'https://www.mavi.com/kampanyalar', t:1 },
    { n:'FLO', u:'https://www.flo.com.tr/', t:1, s:'Sitesi otomatik taramaya kapalı' },
    { n:'Kiğılı', a:['Kigili'], t:1 }, { n:"Colin's", a:['Colins'], u:'https://www.colins.com.tr/', t:1 },
    { n:'Tudors', u:'https://www.tudors.com/kampanyalar', t:1 }, { n:'Desa', u:'https://www.desa.com.tr/kampanyalar' }, { n:'Twist', u:'https://www.twist.com.tr/kampanyalar' },
    { n:'Derimod', t:1 }, { n:'Sarar', u:'https://www.sarar.com/kampanyalar', t:1 },
    { n:'Panço', u:'https://www.panco.com.tr/', t:1 }, { n:'Joker', a:['Joker Bebek'] }, { n:'Lescon', u:'https://www.lescon.com.tr/', t:1 }, { n:'Superstep', u:'https://www.superstep.com.tr/', t:1 }, { n:'Kinetix', t:1 }, { n:'Greyder', t:1 }, { n:'Polaris' }, { n:'Lumberjack', t:1 },
    { n:'LTB', t:1 }, { n:'Loft' }, { n:'Collezione', t:1 }, { n:'Abbate' }, { n:'Bisse' }, { n:'Butigo', t:1 },
    { n:'Chakra' }, { n:'Gezer', t:1 }, { n:'Leke' }, { n:'Mexx' }, { n:'Rodi Mood' }, { n:'Scooter' },
    { n:'Sevenhill' }, { n:'Sport in Street' }
  ]},
  { cat:'Mobilya · Ev Tekstili', icon:'🛋️', brands:[
    { n:'İstikbal', a:['Istikbal'], u:'https://www.istikbal.com.tr/kampanyalar', t:1 },
    { n:'Bellona', u:'https://www.bellona.com.tr/kampanyalar', t:1 },
    { n:'Yataş', a:['Yatas'], t:1 }, { n:'Enza', a:['Enza Home'], u:'https://www.enzahome.com.tr/', t:1 },
    { n:'English Home', u:'https://www.englishhome.com/kampanyalar', t:1 },
    { n:'Özdilek', a:['Özdilekteyim'], t:1 }, { n:'Kilim', a:['Kilim Mobilya'] }, { n:'İpek', a:['İpek Mobilya'] },
    { n:'Atlas' }, { n:'Bia' }, { n:'Evidea', t:1 }, { n:'Merinos', t:1 }, { n:'Mondi' }, { n:'Royal Halı' },
    { n:'Saray Halı', t:1 }, { n:'Soley' }, { n:'Yataş Bedding', t:1 }
  ]},
  { cat:'Gıda', icon:'🥫', brands:[
    { n:'Marmarabirlik', a:['Marmara Birlik'], u:'https://www.e-marmarabirlik.com/', t:1, s:'Kooperatif' }, { n:'Tariş', a:['Taris'], u:'https://www.tariszeytin.com.tr/', t:1, s:'Kooperatif' }, { n:'Çotanak', u:'https://www.cotanaksatis.com/', t:1 }, { n:'Yudum', t:1 }, { n:'Filiz', a:['Filiz Makarna'] }, { n:'Hamidiye', a:['Hamidiye Su'], t:1 }, { n:'Sarıyer', a:['Sarıyer Kola'], t:1 },
    { n:'Ülker', t:1 }, { n:'Eti', a:['ETİ'] }, { n:'Pınar', t:1 }, { n:'Sütaş', t:1 }, { n:'Torku', t:1 }, { n:'Tukaş', t:1 },
    { n:'Tamek', t:1 }, { n:'Çaykur', t:1 }, { n:'Uludağ', a:['Uludağ İçecek'], t:1 }, { n:'Tat' }, { n:'SEK' },
    { n:'Dimes', t:1 }, { n:'Doğuş', a:['Doğuş Çay'] }, { n:'Afia' }, { n:'Aroma' }, { n:'Aytaç', t:1 },
    { n:'Bifa', t:1 }, { n:'Café Crown' }, { n:'Didi' }, { n:'Halk', a:['Halk Çay'] }, { n:'Kebir' }, { n:'Kızılay', a:['Türk Kızılay maden suyu'] },
    { n:'Konya Şeker', t:1 }, { n:'Niğde Gazozu', t:1 }, { n:'SuperFresh', t:1 }
  ]},
  { cat:'Bakım · Temizlik', icon:'🧴', brands:[
    { n:'Molfix', t:1 }, { n:'Molped', t:1 }, { n:'Dalin', t:1 }, { n:'Duru' }, { n:'Arko', t:1 },
    { n:'Bebem', t:1 }, { n:'Evy Baby', t:1 }, { n:'Ersağ', t:1 }, { n:'Fonex', t:1 }, { n:'Bioxcin', t:1 }, { n:'Bioblas', t:1 },
    { n:'Bellissima' }, { n:'Blade' }, { n:'Derby' }, { n:'Evony' }, { n:'Focus' }, { n:'Gibbs' }, { n:'Joly' },
    { n:'Naturex', a:['Faber Naturex'] }, { n:'Privacy' }, { n:'Sanino' }, { n:'Teno' },
    { n:'ABC' }, { n:'Activex', t:1 }, { n:'Bingo', t:1 }, { n:'Emotion' }, { n:'Eti Matik' }, { n:'Fax' },
    { n:'First Class' }, { n:'Has' }, { n:'Kalyon', t:1 }, { n:'Nix' }, { n:'Papia', t:1 }, { n:'Peros', t:1 },
    { n:'Puruva' }, { n:'Selpak', t:1 }, { n:'Test' }, { n:'Viking' }
  ]},
  { cat:'Banka · Sigorta', icon:'🏦', brands:[
    { n:'Ziraat Bankası', a:['Ziraat','Bankkart','Ziraat Bankkart'], u:'https://www.bankkart.com.tr/kampanyalar', t:1 },
    { n:'Türkiye İş Bankası', a:['İş Bankası','Maximum','Maximum Kart','İşCep','Maximiles'], u:'https://www.maximum.com.tr/kampanyalar', t:1 },
    { n:'Yapı Kredi', a:['World','Worldcard','Yapı Kredi World'], u:'https://www.worldcard.com.tr/kampanyalar', t:1 },
    { n:'Akbank', a:['Axess','Wings'], u:'https://www.axess.com.tr/kampanyalar', t:1 },
    { n:'Halkbank', a:['Paraf','ParafPara'], u:'https://www.paraf.com.tr/tr/kampanyalar.html', t:1 },
    { n:'VakıfBank', a:['Vakıfbank','Vakıfkart'], u:'https://www.vakifkart.com.tr/kampanyalar', t:1 },
    { n:'Vakıf Katılım', t:1 }, { n:'Ziraat Katılım', t:1 }, { n:'Şekerbank', t:1 }, { n:'Anadolubank', t:1 },
    { n:'Turkish Bank' }, { n:'Anadolu Sigorta', t:1 }
  ]},
  { cat:'Havayolu', icon:'✈️', brands:[
    { n:'Türk Hava Yolları', a:['THY','Turkish Airlines','Miles&Smiles','TKPAY'], u:'https://www.turkishairlines.com/tr-tr/kampanyalar/', t:1 },
    { n:'AJet', a:['AnadoluJet'], u:'https://www.ajet.com/', t:1 },
    { n:'Pegasus', a:['BolBol','flypgs'], u:'https://www.flypgs.com/kampanyali-ucak-biletleri', t:1 },
    { n:'SunExpress', t:1, s:'THY ortaklığı' }, { n:'Freebird' }, { n:'Tailwind' }, { n:'İzair', a:['İzmir Hava Yolları'] },
    { n:'AtlasGlobal', off:1 }, { n:'Borajet', off:1 }, { n:'Onur Air', off:1 }
  ]},
  { cat:'Spor Kulüpleri · Taraftar Mağazaları', icon:'⚽', brands:[
    { n:'Fenerbahçe', a:['Fenerium','FBSK'], u:'https://www.fenerium.com/', t:1, s:'Resmî mağaza: Fenerium' },
    { n:'Beşiktaş', a:['Kartal Yuvası','BJK'], u:'https://www.kartalyuvasi.com.tr/', t:1, s:'Resmî mağaza: Kartal Yuvası' },
    { n:'Galatasaray', a:['GS Store','GSStore','GSPara','GSGaraj'], u:'https://www.gsstore.org/', t:1, s:'Resmî mağaza: GS Store' },
    { n:'Trabzonspor', a:['TS Club'], u:'https://www.tsclub.com.tr/', t:1, s:'Resmî mağaza: TS Club' }
  ]},
  { cat:'Eleme sonrası eklenenler (15.10.2026)', icon:'✅', brands:[
    { n:'Koçtaş', a:['Koctas'], u:'https://www.koctas.com.tr/kampanyalar', t:1, s:'Koç Holding · Brand Finance Türkiye 2026 listesinde' },
    { n:'CarrefourSA', a:['Carrefour'], t:1, s:'Nisan 2026: A101 sahibi Yeni Mağazacılık devralıyor' },
    { n:'Flormar', t:1, s:'2024: Fransız Rocher\'den Türk yatırımcı konsorsiyumuna geri döndü' },
    { n:'Pazarama', t:1, s:'Ziraat Bankası pazaryeri' },
  ]},
  { cat:'Bugünün popüler yerli markaları (listede yok · doğrulanacak)', icon:'⭐', brands:[
    { n:'TROY', a:['TROY Kart','troyodeme'], u:'https://www.troyodeme.com/tr/bireysel/kampanya-ve-firsatlar', t:1, s:'Yerli ve milli ödeme sistemi (BKM)' },
    { n:'Togg', a:['TOGG','T10X','T10F'], u:'https://www.togg.com.tr/', t:1, s:'Yerli otomobil' },
    { n:'Pardus', u:'https://pardus.org.tr/', t:1, s:'Yerli işletim sistemi (TÜBİTAK)' }, { n:'TOKİ', u:'https://www.toki.gov.tr/', t:1 }, { n:'Arzum', u:'https://www.arzum.com.tr/kampanyalar', t:1 },
    { n:'File', a:['File Market','FilePara'], u:'https://www.file.com.tr/', t:1, s:'BİM grubu' },
    { n:'Migros', a:['Money Kart','Macrocenter'], u:'https://www.migros.com.tr/kampanyalar', t:1 },
    { n:'Fiskobirlik', a:['Fiskomar','Fiskobirlik Market'], u:'https://www.fiskobirlik.org.tr/', t:1, s:'Kooperatif' },
    { n:'Tarım Kredi', a:['Tarım Kredi Kooperatifi','Tarım Kredi Koop Market','Koop Market'], t:1 },
    { n:'Gratis', u:'https://www.gratis.com/kampanyalar', t:1, s:'Rossmann’ın yerli muadili' },
    { n:'Boyner', a:['Beymen','Network','Altınyıldız Classics'], u:'https://www.boyner.com.tr/', t:1 },
    { n:'Vakko', u:'https://www.vakko.com/', t:1 },
    { n:'Turkcell', a:['Pasaj','fizy','BiP','TV+'], u:'https://www.turkcell.com.tr/kampanyalar', t:1 },
    { n:'Opet', a:['Opet Pay'], u:'https://www.opet.com.tr/kampanyalar', t:1 },
    { n:'Aytemiz', t:1 },
    { n:'Karaca', a:['Karaca Home','Jumbo'], u:'https://www.karaca.com/kampanyalar', t:1 },
    { n:'Paşabahçe', a:['Şişecam'], t:1 }, { n:'Emsan', t:1 },
    { n:'Madame Coco', t:1 }, { n:'Mudo', a:['Mudo Concept','Mudo Home'], u:'https://www.mudo.com.tr/kampanyalar', t:1 },
    { n:'Doğtaş', a:['Kelebek'], u:'https://www.dogtas.com/kampanyalar', t:1 }, { n:'Vivense', t:1 }, { n:'Penelope', t:1 },
    { n:'Penti', u:'https://www.penti.com/kampanyalar', t:1 }, { n:'Toyzz Shop', u:'https://www.toyzzshop.com/kampanyalar', t:1 }, { n:'D&R' },
    { n:'Damat Tween', a:['Damat','Tween'], t:1 }, { n:'Avva', t:1 }, { n:'Hatemoğlu', t:1 }, { n:'Süvari', t:1 },
    { n:'Yargıcı', t:1 }, { n:'İpekyol', u:'https://www.ipekyol.com.tr/kampanyalar', t:1 }, { n:'Machka', t:1 },
    { n:'Farmasi', t:1 }, { n:'Golden Rose', t:1 }, { n:'Pastel', a:['Pastel Kozmetik'] },
    { n:'Kahve Dünyası', t:1 }, { n:'Simit Sarayı', t:1 }, { n:'Tavuk Dünyası', t:1 }, { n:'Baydöner', t:1 }, { n:'Komagene', t:1 }
  ]}
];
