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
