# Yaşam Rehberi — Yayın durumu (25 Ekim 2026)

- Bundle ID / paket: `com.anduv.yasamrehberi` · Sürüm 1.0.0
- Teknoloji: Capacitor 7 (iOS + Android), saf JS, internetsiz arama
- Veri: `www/data/core.json` + `index.json` — kuran-terminal'in mağaza veritabanından (`npm run veri`)
- Kaynaklar: QuranEnc (Rowwad 1.0.4, Ali Özek 1.0.0, Şaban Britiş 1.1.0, el-Muhtasar) + Tanzil Arapça metin
  QuranEnc şartı: değiştirme yok, kaynak+sürüm göster, güncel tut, uygunsuz reklam yok.

## Doğrulanan derlemeler (25 Ekim 2026)
- Android: iş akışı başarılı → imzasız `yasam-rehberi-1.0.0-1-unsigned.aab` `builds` dalında
- iOS: arşivleme başarılı; yükleme `ASC_KEY_P8` sırrı eklenmediği için durdu (beklenen)

## Yapılacaklar (sırayla)
1. [x] GitHub deposu: `emreanduv/yasam-rehberi` (public — Actions dakikaları ücretsiz)
2. [ ] App Store Connect'te uygulama kaydı, bundle ID `com.anduv.yasamrehberi` (son onay Emre)
3. [ ] Actions → "iOS (App Store Connect / TestFlight)" → TestFlight; ASC_KEY_P8 sırrı depoya eklenmeli
4. [ ] Play Console'da uygulama + kapalı test; Actions → "Android (Google Play paketi)" → `builds` dalındaki .aab imzalanır
       (yeni uygulama için yeni yükleme anahtarı: `imza-anahtari/yasam-rehberi-upload.jks`, git dışında, Drive'a yedekle)
5. [ ] Play kapalı testi: en az 12 kişi × 14 gün
6. [ ] Diyanet Mushafları İnceleme ve Kıraat Kurulu başvurusu (kuran-terminal/IZIN_TALEPLERI.md)
7. [ ] Gizlilik politikası sayfası (herkese açık bağlantı)
8. [ ] Herkese açık yayın: Diyanet onayından sonra

## Güncelleme çıkarma
1. QuranEnc'te yeni sürüm varsa: kuran-terminal'de `python build_db.py --magaza`, burada `npm run veri`, `npm test`
2. `www/` değişikliği → GitHub'a gönder → iOS ve Android iş akışlarını sürüm adını artırarak çalıştır
