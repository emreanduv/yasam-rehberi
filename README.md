# Yaşam Rehberi

Sorunu yaz, ilgili ayetleri üç Türkçe mealde yan yana gör. iOS ve Android, tamamen internetsiz.
Bir Mr. Anduv! yapımıdır.

- `www/` — uygulama (HTML/CSS/JS). Tarayıcıda denemek için: `npm run serve` → http://localhost:8765
- `www/js/engine.js` — arama motoru (kuran-terminal'deki Python motoruyla birebir aynı sonuçları verir: `npm test`)
- `www/data/` — mealler, tefsir ve arama dizini (`npm run veri` ile yeniden üretilir)
- `store/` — mağaza metinleri · `YAYIN-DURUMU.md` — yayın adımları
- İsim değişirse: `www/js/app.js` (APP_NAME), `www/index.html` (title), `capacitor.config.json` (appName), sonra `npx cap sync`
