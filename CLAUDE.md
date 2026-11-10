
## Test geri bildirim standardı (Mr. Anduv!, bütün oyun ve uygulamalar)

Emre'nin kuralı: Google Play kapalı testinde ücretli test ekibinin (Testers Community) ve diğer test kullanıcılarının verdiği her geri bildirim **bu repodaki oyuna/uygulamaya da, bundan sonra yapılacak her yeni oyun/uygulamaya da** uygulanır. Yeni bir geri bildirim gelince bu listeye eklenir ve bütün repolara yayılır.

Kaynak rapor: Malazgirt Akıncıları, Kasım 2026 (çökme yok; aşağıdaki öneriler). Örnek uygulama: emreanduv/malazgirt-akincilari, `www/js/oyun.js` içindeki "AKINCI REHBERİ, PUAN, PAYLAŞ, GÖRÜŞ (1.6)" bölümü, `www/index.html` (#coach, #scrHelp, #rateBox, #toast), `store/surum-1.6.md`.

Her oyun/uygulamada olması gerekenler:
1. **Adım adım rehber (onboarding):** Yeni bir öğe/ekran/mekanik ilk kez karşılaşıldığında kısa bir ipucu kartı (oyunlarda bir an ağır çekim). İlk "nasıl oynanır" ipucu oyuncu gerçekten yapana kadar kalsın. Görülen ipuçları cihazda saklanır; güncellemeyle gelen eski kullanıcıya bildiği temel ipuçları gösterilmez.
2. **Yardım / "Nasıl Oynanır" ekranı:** Ana menüden, moladan ve Ayarlar'dan açılır; bütün ipuçları; "Rehberi baştan göster" düğmesi.
3. **Uygulama içi puan:** `@capacitor-community/in-app-review` (Google Play In-App Review, iOS SKStoreReview). Anlamlı bir başarıdan sonra kibarca sor ("Puan ver / Önerim var / Sonra"), en çok 2 kez, başarısızlıktan sonra asla; Ayarlar'da her zaman "★ Puan ver". Steam/Quest/web'de gizli.
4. **Paylaş:** `@capacitor/share`; ana menüde "Arkadaşına öner", başarı ekranında "…paylaş" (mağaza bağlantısıyla), yoksa navigator.share, yoksa panoya kopyala.
5. **Görüş bildir:** Ayarlar → "Bize yaz": sürüm, platform ve ilerleme bilgisiyle hazır e-posta (emreanduvart@gmail.com).
6. **Verilerimi sil:** Ayarlar'da iki dokunuşla onaylanan silme; gizlilik politikasında e-postayla silme talebi (30 gün) ve hangi verinin neden işlendiği (Meta DUC şartı).
7. **ASO:** Kısa açıklama ve uzun açıklamanın ilk 2-3 satırı aranan kelimeleri taşır (oyunun türü + konusu + öne çıkan özellik); yenilikler metni her sürümde güncellenir; App Store notlarında emoji yok.
8. **Mağaza başvurusu cevapları:** Kalıp metin değil, gerçek süreç ve testten sonra yapılan değişiklikler yazılır (örnek: malazgirt-akincilari `store/surum-1.6.md`).

Yayın sırası: incelemedeki/testteki mağazada gönderilen sürüme onay gelene kadar dokunulmaz; onay gelince güncel sürüm yüklenir. Yayında olan mağazaya güncel sürüm hemen gönderilir. Derlemeler her zaman bütün değişiklikleri içeren daldan (main) alınır.

### Yayın güvenliği (oyunlar artık mağazada; geri giden sürüm kabul edilemez)
- Mağazaya/TestFlight'a/Play'e/Steam'e/Quest'e giden her derleme **yalnız `main` dalından** alınır. Başka dalda yapılan iş önce `main`'e birleştirilir, sonra derlenir.
- Her derleme iş akışının başında bir **yayın öncesi kontrol** betiği çalışır (örnek: emreanduv/malazgirt-akincilari `araclar/yayin-kontrol.sh`): dal `main` mi, yukarıdaki standart özelliklerin hepsi kodda var mı, "Bir Mr. Anduv! yapımıdır." ana ekranda mı, sürüm numarası son yayınlanandan (`store/SON-SURUM`) küçük mü. Biri tutmazsa derleme durur. Bu repoda yoksa ilk işte eklenir.
- Derlemeden önce depoyu güncelle (`git fetch`), başka bir oturumun son değişikliklerini ezme; birleştirmeden önce farkı kontrol et.
- Mağaza incelemesine göndermeden önce derleme TestFlight / kapalı testte cihazda açılıp yeni özellikler gözle doğrulanır.
- Yayınlanan her sürümden sonra `store/SON-SURUM` güncellenir.

### Reklam panoları (Mr. Anduv! marka tutarlılığı)
Herhangi bir oyunda/uygulamada reklam ya da reklam panosu (stadyum panosu, tabela, kayan şerit) varsa **yalnız Mr. Anduv! ortak pano seti** kullanılır. Kaynak: emreanduv/kaptan-mecit `km3/veri/takimlar.json` → `"panolar"` (Champion Battle Manager ile aynı). Aynı metinler, aynı zemin/yazı renkleri; dönen panolarda 7 saniyede bir değişim (`(i*5 + tur*3) % n`). Başka marka, kurum ya da uydurma marka yok. Listeye yeni oyun/hesap eklenince önce kaynak listeye eklenir, sonra bütün repolarda güncellenir.

### Klasik kumanda (Gameboy modu) standardı — Emre'nin onayladığı ölçü (Kurt Yolu 1.3.5, 11 Kasım 2026)
Bütün oyun ve uygulamalarda bundan sonra bu tarif uygulanır. Kendi kumandasını sıfırdan yazma; en son çalışan sürümü kopyala: Phaser oyunlarında emreanduv/kurt-yolu `src/kumanda.js` (+ `src/theme.js` gbGenislik), DOM/canvas oyunlarında emreanduv/legend-heads `www/kumanda.js`, emreanduv/kaptan-mecit `www/klasik/kumanda.js`.

**Ölçü (dik ekran):**
- Oyun ekranı altın/tema çerçevenin içine **boşluksuz** oturur: içeride siyah bant yok, çerçeve ekranın iki kenarına yapışık (kenar payı ≈6 px, çerçeve iç payı ≈7 px, ince çift halka).
- Çerçeve saatin/çentiğin hemen altından başlar (güvenli alan + ≈6 px), kumandanın hemen üstünde biter; arada boş zemin kalmaz.
- Kumanda altta kendi zemininde, ≈222–240 px yükseklik; yön haçı ≈130 px, A/B ≈66 px, MENÜ hapı, oyunun adı ve "Bir Mr. Anduv! yapımıdır.".
- Boşluğu oyun alanını büyüterek kapat, çerçeveyi daraltarak değil: oyunun görüş alanı (genişlik/yükseklik) kumandanın üstünde kalan kutunun oranına göre seçilir (Kurt Yolu: genişlik 360–480; Legend Heads/Kaptan Mecit: sahne oranı serbest, kamera izler). Karakterler küçülmez, daha fazla alan görünür.
- Kutunun ölçüsü telefonun gerçek ölçüsüyle (güvenli alan dahil) yerleşim oturduktan sonra hesaplanır ve cihazda saklanır; açılıştaki tahminden farklıysa oyun ana menüdeyken bir kez yeniden kurulur. iPhone açılışın ilk anında güvenli alanı 0 bildirebilir.

**Kurallar:**
- Yerleşim JS ile piksel olarak; `vh`, `cqw/cqh` ve dolguya güvenilmez (WebKit'te taşma). Güvenli alan ölçüm kutusuyla `env(safe-area-inset-*)`'ten okunur; döndürme/yeniden boyutlanmada birkaç kez yeniden ölçülür.
- Oklar CSS üçgen (ya da `&#xFE0E;`); iPhone ◀ ▶'yı emojiye çeviriyor.
- Yan ekranda: yön haçı solda, A/B sağda, oyun ortada tam yükseklikte; paneller ≈150–190 px.
- Odak çerçevesi kamera kaymasını ve düğmenin kendi boyunu hesaba katar. Menülerde yön tuşları gezer, A basar, B geri, MENÜ mola. Bluetooth oyun kolu (Gamepad API) ve klavye her modda çalışır.
- Ayar varsayılan olarak kapalı, Ayarlar'dan açılır; ipucu kartı. Klasik kumanda kapalıyken oyunun desteklemediği yönde "telefonu çevir ya da klasik kumandayı aç" perdesi.
- Her oyunun kabuğu kendi temasında (renk, yazı, logo).
