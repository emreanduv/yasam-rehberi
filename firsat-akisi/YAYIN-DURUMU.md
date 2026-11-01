# Fırsat Akışı — Yayın durumu (2 Kasım 2026)

- Bundle ID / paket: `com.anduv.firsatakisi` · Sürüm 1.0.0 · yalnız iPhone (+ Android)
- Gizlilik: https://emreanduv.github.io/yasam-rehberi/firsat-akisi/gizlilik.html · Destek: …/firsat-akisi/
- Veri: `firsat-veri.yml` 3 saatte bir → `firsat-veri` dalı (`firsat.json`)

## Yapıldı
- [x] Uygulama (Market · Fırsatlar · Takip · Cüzdan · Bilgi), Fıstık simgesi ve açılış ekranı
- [x] Veri hattı: canlı tarama (yayınla aynı tarayıcı) + market katalogları + seçilmiş kampanyalar; GitHub'da deneme turu başarılı
- [x] Gizlilik ve destek sayfaları, mağaza metinleri
- [x] iOS (TestFlight) ve Android (imzasız AAB) iş akışları

## Sırada (Emre'nin onayıyla)
1. PR'ı birleştir (main) → veri hattı 3 saatte bir kendiliğinden çalışır
2. developer.apple.com → Identifiers → **com.anduv.firsatakisi** App ID kaydı · App Store Connect'te uygulama kaydı (ad: Fırsat Akışı, SKU `firsatakisi`, Türkçe)
3. Actions → "Fırsat Akışı · iOS" → Run workflow (1.0.0) → TestFlight "Dahili Test" grubu
4. Mağazaya sunma: Saat Vitrini gibi şimdilik bekletilebilir (aynı anda çok uygulama → spam uyarısı riski)

## 2 Kasım 2026
- App Store Connect kaydı: **Fırsat Akışı** · uygulama no `6829551444` · bundle `com.anduv.firsatakisi` · SKU `firsatakisi`
- Kategoriler (Alışveriş / Yaşam Tarzı), alt başlık, gizlilik ve destek adresleri, açıklama, anahtar kelimeler, tanıtım metni, telif: API ile girildi
- iPhone 6.7" ekran görüntüleri (6 adet) yüklendi
- 1.0.0 (derleme 1) TestFlight'a yüklendi → "Mr. Anduv! Test" grubu (4 testçi) → beta incelemesine gönderildi
- Mağazaya gönderim: Saat Vitrini'deki gibi şimdilik beklemede (yalnız TestFlight)
- Google Play: Play Console'da uygulama kaydı henüz açılmadı (imzasız AAB builds-firsat-akisi dalında hazır)
