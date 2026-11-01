# Saat Vitrini — Yayın durumu (1 Kasım 2026)

- Bundle ID / paket: `com.anduv.saatvitrini` · Sürüm 1.0.0 · yalnız iPhone (+ Android)
- App Store Connect uygulama no: **6829435134** · SKU `saatvitrini` · birincil dil Türkçe
- Gizlilik: https://emreanduv.github.io/yasam-rehberi/saat-vitrini/gizlilik.html · Destek: …/saat-vitrini/
- Veri: `saat-veri.yml` 6 saatte bir → `saat-veri` dalı (`vitrin.json`)

## Yapıldı
- [x] App ID kaydı (developer.apple.com) ve App Store Connect uygulama kaydı
- [x] Uygulama bilgileri: alt başlık "Saat vitrini ve fiyat takibi", kategori Alışveriş / Yaşam Tarzı, yaş 4+ (anket: hepsi hayır)
- [x] Fiyat: ücretsiz · Ülke: yalnız Türkiye
- [x] Gizlilik politikası adresi; veri toplama: "Data Not Collected" (yayınlanmayı bekliyor)
- [x] Sürüm 1.0.0 metinleri: tanıtım, açıklama, anahtar kelimeler, destek URL, telif, inceleme notu
- [x] iPhone 6.7" ekran görüntüleri (6 adet, `store/saat-vitrini/gorseller/iphone67`) API ile yüklendi
- [x] iOS derlemesi 1.0.0 (2) App Store Connect'e yüklendi · TestFlight "Dahili Test" grubu (Emre, otomatik dağıtım)
- [x] Android imzasız AAB → `builds-saat-vitrini` dalı

## Emre'nin onayı bekleyenler
1. App Store Connect → App Privacy → **Publish**
2. App Information → **Content Rights** (üçüncü taraf içerik: satıcıların herkese açık ürün bilgileri/fotoğrafları)
3. Sürüm sayfası → App Review iletişim bilgileri (ad, telefon, e-posta) → derleme seç → **Add for Review / Submit**
4. Play Console → yeni uygulama formu hazır: iki beyan kutusu → **Uygulama oluştur**
5. Play: AAB'yi Mac'teki yükleme anahtarıyla imzala (Yaşam Rehberi'ndeki `imzala.sh` yolu), dahili teste yükle
