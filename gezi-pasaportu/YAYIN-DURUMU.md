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

## 4 Kasım 2026 · TestFlight
- iOS 1.0.0 (3) App Store Connect'e yüklendi (macOS arm64 kuyruğu dolu olduğundan ilk deneme iptal oldu; iş akışına `runner` seçeneği eklendi).
- "Mr. Anduv! Dahili" grubu: Emre (hesap sahibi) her derlemeyi incelemesiz alır.
- "Mr. Anduv! Test" dış grubu: emreanduv@hotmail.com, mebayramcavus@icloud.com · derleme 3 TestFlight beta incelemesine gönderildi; onaylanınca davet e-postası gider.
- Android imzasız AAB → `builds-gezi-pasaportu` dalı (Play'de uygulama henüz açılmadı).

## 5 Kasım 2026 · Harita düzeltmesi + şehirden ülkeye
- Hata (Emre): Paris seçilince Fransa ile birlikte Fransız Guyanası da (Güney Amerika) boyanıyordu. Natural Earth'te Fransa/Hollanda/Yeni Zelanda tek parça; tools/veri.mjs artık 2.500 km'den uzak parçaları en yakın denizaşırı toprağa (GF, GP, MQ, RE, YT, BQ…) ayırıyor.
- Yeni giriş: "Gittiğin bir şehri yaz…" (Pasaport'ta) → dünya çapında şehir arama, ülke kendiliğinden işaretlenir. Ülkeler aramasında ve seyahat formunun "Nereye?" alanında da şehirler çıkar. Şehirler Türkçe ve orijinal adıyla aranır (Krakov / Kraków).
- Test: `python3 test/sehirden_ulke.py` (Paris → yalnız Fransa, denizaşırı topraklar boyanmaz, 2 kıta).
