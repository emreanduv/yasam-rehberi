# Gezi Pasaportu — Yayın durumu (4 Kasım 2026)

- Bundle ID / paket: `com.anduv.gezipasaportu` · Sürüm 1.0.0 · ana ekran adı "Pasaportum" · yalnız iPhone (+ Android)
- App Store Connect uygulama no: **6830736627** · SKU `gezipasaportu` · birincil dil Türkçe
- Gizlilik: https://emreanduv.github.io/yasam-rehberi/gezi-pasaportu/gizlilik.html · Destek: …/gezi-pasaportu/
- Teknoloji: Capacitor 7, saf JS, internetsiz. Veri yalnız cihazda (Preferences), yedek JSON dosyası (Filesystem + Share).
- Veri derleme: `npm run veri` → www/data (ülkeler, Natural Earth harita yolları, GeoNames şehirleri ≥5.000 nüfus; yaygın şehirlerin Türkçe adları tools/veri.mjs içinde)

## İlk kullanıcı
- Emre'nin eşi (20–25 ülke gezmiş). TestFlight testçileri: emreanduv@hotmail.com, mebayramcavus@icloud.com ("Mr. Anduv! Test" grubu).

## Yapıldı (4 Kasım 2026)
- [x] Bundle ID kaydı (asc-kurulum iş akışı) ve App Store Connect uygulama kaydı
- [x] iOS iş akışı: Actions → "Gezi Pasaportu · iOS (App Store Connect / TestFlight)"
- [x] Android iş akışı: Actions → "Gezi Pasaportu · Android (Google Play paketi)"

## Test
- `python3 test/ekranlar.py` — boş açılış, örnek veriyle tüm sekmeler, ülke işaretleme, şehir ekleme, seyahat formu; konsol hatası olursa başarısız.

Bir Mr. Anduv! yapımıdır.
