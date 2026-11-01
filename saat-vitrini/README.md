# Saat Vitrini

Türkiye'de markaların kendi mağazalarında ve kurumsal saatçilerde satılan saatleri, aksesuarları ve kulüp ürünlerini tek yerde gösteren vitrin uygulaması (iOS + Android, Capacitor). **Bir Mr. Anduv! yapımıdır.**

- **Satış yok:** her ürün satıcının kendi sayfasına gider ("Satıcının sitesinde aç").
- **Veri:** `.github/workflows/saat-veri.yml` 6 saatte bir `tools/veri_guncelle.py` ile tarar, `saat-veri` dalına `vitrin.json` yazar. Uygulama oradan okur; ağ yoksa son kaydı, o da yoksa `www/data/vitrin.json` (gömülü ilk veri) kullanır.
- **Tarayıcı:** `tools/saat_kaynak.py` Fırsat Akışı yayınındaki `saat/saat_kaynak.py` ile aynıdır (yalnız resmî marka mağazaları ve kurumsal satıcılar, pazar yeri yok, robots.txt'ye uyulur). Yayında değişince buraya da kopyalanır.
- **Ekranlar:** Vitrin (Saat · Akıllı Saat · Aksesuar · Kulüp, arama, filtre, Saatin Fırsatı) · Takip (fiyat düşünce bildirim) · Köşe (Koleksiyoner ve Usta köşeleri, `www/data/kose.json`) · Bilgi.
- **Derleme:** `saat-ios.yml` (TestFlight) ve `saat-android.yml` (imzasız AAB → `builds-saat-vitrini` dalı) — Yaşam Rehberi'nin anahtarlarıyla.
- Fontlar: `npm run fontlar` (@fontsource, OFL). Simgeler: `npx capacitor-assets generate` (`assets/`).
