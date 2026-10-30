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

## Güncelleme — 25 Ekim 2026
- App Store Connect uygulama no: 6826874224 · TestFlight dahili + harici grup kuruldu, harici beta incelemesi gönderildi.
- Google Play uygulama no: 4973166921024096394 · Dahili test YAYINDA: sürüm 2 (1.0.0), minSdk 24.
- Dahili test bağlantısı: https://play.google.com/apps/internaltest/4700445078648883917
- Yükleme anahtarı: imza-anahtari/yasam-rehberi-upload.jks (kullanıcının Mac'inde; Drive'a yedeklenmeli).
- Sırada: gizlilik politikası sayfası, Play "Uygulama içeriği" formları, mağaza girişi, kapalı test için 12 testçi.

## Güncelleme — 25 Ekim 2026 (akşam)
- Gizlilik politikası yayında: https://emreanduv.github.io/yasam-rehberi/gizlilik.html (GitHub Pages, main/docs)
- Play: gizlilik, reklam yok, oturum açma yok, hedef kitle 13+, veri güvenliği (veri toplanmıyor), reklam kimliği yok, resmi kurum değil, finans yok, sağlık yok → kaydedildi. Kategori: Kitaplar ve Referans. Mağaza metinleri taslak kaydedildi.
- App Store: açıklama, anahtar kelimeler, destek URL'si, telif, sürüm 1.0.0, inceleme notu, alt başlık "Kur'an meallerini karşılaştır", kategori Referans/Kitaplar, yaş 4+, fiyat ücretsiz, gizlilik "Data Not Collected" → kaydedildi.
- Görseller: store/gorseller/ (play: 1080x1920 ×6, simge 512, öne çıkan grafik 1024x500; appstore: 1284x2778 ×6)
- Kullanıcıda bekleyen: Play iletişim e-postası, görsel yüklemeleri, IARC onay kutusu; Apple ekran görüntüleri, Content Rights, App Privacy "Publish", ülke uygunluğu (Diyanet kararına göre).

## Güncelleme — 25 Ekim 2026 (gece) · Mağaza kurulumu tamam
- Play: mağaza girişi (metin + simge + grafik + 6 ekran), iletişim bilgileri, tüm beyanlar, içerik derecelendirmesi (PEGI 3) → tamam. Üretim kilidi: kapalı test (12 testçi × 14 gün).
- App Store: 1.0.0 sayfası (metinler, iPhone 6 + iPad 6 ekran, build 2 bağlı), Content Rights, yaş 4+, ücretsiz, App Privacy yayınlandı. "Add for Review" BASILMADI — ülke uygunluğu Diyanet kararına bağlı.
- iOS hedefi 15.0'a çekildi (ITMS-90068); bir sonraki build'de gider.

## Güncelleme — 30 Ekim 2026 · ITMS-90683
- Build 4 uyarısı: `NSLocationAlwaysAndWhenInUseUsageDescription` eksikti (geolocation eklentisi bu API'ye dokunuyor). Info.plist'e eklendi; uygulama yine yalnızca "kullanırken" izni ister. Yeni build iOS iş akışından yüklendi.

## Park edilenler
- **Kıble bulma** (Kasım 2026): konum + pusula, cihaz içinde hesap, 2:144 kartı, pusulasız telefonda derece. Veri toplanmaz.
- **Android**: her düzeltmede imzalanmayacak; "en iyi sürüm" kararıyla tek paket → kapalı test (12 kişi × 14 gün). Play'de 2. dahili sürüm taslağı açık bekliyor.

## Güncelleme — 30 Ekim 2026 · Namaz sekmesi (build 5)
- Kıble sekmesi "Namaz" oldu: bugünün vakitleri, sıradaki vakte geri sayım, hicri tarih, Ramazan kartı (iftar/sahur geri sayımı), kıble pusulası.
- Yerel vakit bildirimleri: kendi "dıt-dıttt" sesimiz; vakit başına aç/kapat, 5–30 dk önce, Ramazan'da iftar/imsak + sahur (imsaktan 45 dk önce). iOS 64 sınırı → 60 bildirim (~12 gün), açılışta yenilenir.
- Doğruluk: Diyanet takvimi ile 7 il × 3 gün × 6 vakit = 126 karşılaştırma → 121'i 0–1 dk, 1 tanesi 2 dk.
- Android toplu sürümünde: SCHEDULE_EXACT_ALARM (kullanıcı izni) ve Play veri güvenliği beyanı kontrolü.

## Diyanet başvurusu — 30 Ekim 2026
- 17:52 Mushafları İnceleme ve Kıraat Kurulu'na (mushaflar@diyanet.gov.tr) usul sorusu e-postası gönderildi (form, dijital eserin teslim biçimi, DİYK meal görüşü).
- Başvuru paketi hazır (zip, depo dışında): Ek-1 internetsiz tek dosya HTML (tools/inceleme_surumu.py), Ek-2a Arapça+3 meal 1.610 sf, Ek-2b tefsir 753 sf (tools/tam_metin_pdf.py), Ek-3 kaynak/lisans, Ek-4 ekranlar (tools/ekler_pdf.py). Dilekçe: Claude Docs belgesi.
- 19:34 Din İşleri Yüksek Kurulu'na (dinisleriyk@diyanet.gov.tr, bilgi: mushaflar@) izin talebi gönderildi: DİYK fetvaları + Diyanet ilmihal metinlerinin uygulamada kaynak/bağlantıyla, değiştirilmeden, ücretsiz, internetsiz kullanımı (ileride "Hukuk" sekmesi için). Yanıt gelene kadar fetva metni uygulamaya konmaz; yalnızca fetva sayfası bağlantısı + ALO 190.
- Not: Gmail'de "ekliyorum/ekte" kelimeleri "ek unuttunuz mu" onayı açıyor; tarayıcı paneli bu onayı gizlediği için gönderim sessizce iptal oluyor. Bu kelimeler kullanılmaz.
- Dayanak: Kur'an-ı Kerim Basım ve Yayım Kriterleri Hakkında Yönetmelik (RG 02.11.2022/32001; md. 7–8, 8/3 DİYK görüşü, md. 11 yaptırım). Reddedilen metin değiştirilmez, TR sürümünden çıkarılır.

## Güncelleme — 30 Ekim 2026 · Miras sekmesi
- Alt menü: Ara · Sureler · Miras · Namaz · Kayıtlı; Ayarlar üst sağda ⚙️.
- Miras: sihirbaz (vefat eden, eş, çocuklar + vefat etmiş çocukların çocukları, anne-baba-büyükler, kardeşler, amca/yeğen, tutar) → iki tablo: feraiz (Hanefî) ve TMK md. 495–501; kesirle kesin hesap, TL tutarı, dayanak (ayet/madde), pay almayanlar ve nedenleri.
- Testler: test/miras.mjs (33 vaka: avl, redd, Ömeriyye, Himariyye, Minberiyye, maa'l-gayr, TMK zümreleri/halefiyet), test/miras_ekran.py. Bağımsız inceleme: feraiz sonuçlarının hepsi doğru; TMK'da amca/yeğen hatası düzeltildi.
- Diyanet dilekçesine "miras hesaplayıcı (feraiz) da içerir" satırı eklenecek (Kurul yanıtından sonra).
