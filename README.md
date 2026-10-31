# Yaşam Rehberi

Sorunu yaz, ilgili ayetleri üç Türkçe mealde yan yana gör. iOS ve Android, tamamen internetsiz.
Bir Mr. Anduv! yapımıdır.

- `www/` — uygulama (HTML/CSS/JS). Tarayıcıda denemek için: `npm run serve` → http://localhost:8765
- `www/js/engine.js` — arama motoru (kuran-terminal'deki Python motoruyla birebir aynı sonuçları verir: `npm test`)
- `www/data/` — mealler, tefsir ve arama dizini (`npm run veri` ile yeniden üretilir)
- `store/` — mağaza metinleri · `YAYIN-DURUMU.md` — yayın adımları
- İsim değişirse: `www/js/app.js` (APP_NAME), `www/index.html` (title), `capacitor.config.json` (appName), sonra `npx cap sync`
- `www/js/carsi.js` — Çarşı (reyonlar, marka künyesi, barkod bakma ve kamerayla okutma, listem). Veri: `www/data/carsi.json`; Wikidata'dan yenilemek için `npm run carsi`
- `www/moduller/tesbih.html`, `www/moduller/saat.html` — Tesbih ve Saat; uygulama içinde açılır, `www/js/modul-kopru.js` ile konum, vakit, kalıcı depo ve telefon bildirimlerine bağlanır
- Bildirim kimlikleri: 1000+ namaz vakitleri, 2000+ Saat hatırlatıcıları, 3000+ tesbihat (iOS 64 sınırı: 36 + 20 + 6 + 1)
