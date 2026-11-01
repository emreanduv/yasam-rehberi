# Apple Watch sürümü — Xcode'a ekleme (bir kerelik)

Kod hazır: `ios/App/Watch/` klasöründe 3 dosya (uygulama, vakit hesabı, ekranlar).
Saat hedefini (target) Xcode'un kendisi oluşturmalı:

1. `npx cap open ios` → Xcode açılır.
2. File › New › Target… › watchOS › **App** → Product Name: `YasamRehberiWatch`,
   "Watch App for Existing iOS App" seçili, iOS app: **App**. Finish.
3. Xcode'un oluşturduğu `YasamRehberiWatch Watch App` klasöründeki `ContentView.swift` ve
   `YasamRehberiWatchApp.swift` dosyalarını sil; bu klasördeki 3 dosyayı onların yerine sürükle
   (Target Membership: YasamRehberiWatch Watch App).
4. Watch hedefinde Signing & Capabilities › Team: kendi hesabın. Deployment Target: watchOS 10.0.
5. Bir saat simülatörü seçip ▶︎.

Sonra telefon uygulamasıyla birlikte App Store'a gider (aynı arşivde).
