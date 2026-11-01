# Fırsat Akışı

Market kataloglarını, mağaza ve kart kampanyalarını tek yerde gösteren uygulama (iOS + Android, Capacitor). Yayındaki Fırsat Akışı'nın telefon hâli; Saat Vitrini ile aynı iskelet. **Bir Mr. Anduv! yapımıdır.**

- **Satış yok:** her kampanya mağazanın / bankanın kendi sayfasında açılır ("Kampanya sayfasında aç").
- **Sıra:** en yeni kampanya her zaman en üstte (saatlik dilimler yeniden eskiye, aynı mağaza art arda gelmez; tutarı belli olanlar dilimin başında).
- **Veri:** `.github/workflows/firsat-veri.yml` 3 saatte bir çalışır, `firsat-veri` dalına `firsat.json` yazar. Uygulama oradan okur; ağ yoksa son kayıt, o da yoksa `www/data/firsat.json` (gömülü ilk veri).
  1. `tools/secili.mjs` — `kaynak/` (yayındaki `deals*.js`, `brands.js`, `carsi-markalar.js`; yayında değişince buraya da kopyalanır) → `tools/secili.json`
  2. `tools/veri_guncelle.py` — `tools/akis/server.py` (yayındaki canlı tarayıcının aynısı; `kampanya_kesif.py`, `kesif.json` ile) bir tur tarar, `tools/katalog.py` market kataloglarını alır, hepsini birleştirir
  3. `tools/katalog.py` — akakce.com/brosurler dizininden zincir adı, katalog adı, tarih ve sayfa adresi (görsel/ürün içeriği kopyalanmaz, robots.txt izinli, sosyal medya paylaşımları alınmaz)
  - Bir tur çok az canlı başlık gelirse önceki turunkiler korunur; bitiş tarihi geçen kampanya düşer; ilk görülme zamanları `firsat-veri` dalındaki `first_seen.json`'da kalır.
  - `tools/tani_market.py` — geliştirici aracı: market siteleri GitHub'dan açılıyor mu (uygulama dalında `firsat-veri-deneme` dalına yazar).
- **Ekranlar:** Market (Market · Bakım & Temizlik · Yeme-İçme; zincir şeridi, mağaza takibi) · Fırsatlar (Ev, Giyim & Spor, Teknoloji, Kart & Banka, Gezi & Yol, Eğlence, Çocuk) · Takip (son gün hatırlatması, takip edilen mağazaya yeni kampanya bildirimi) · Cüzdan (kart programları, "Kartıma uyanlar") · Bilgi.
- **Kural:** uygulama metinlerinde tema sözcükleri yazmaz (veri hattı seçilmiş başlıklardan çıkarır); yerli markalar yalnız 🇹🇷 ile işaretlenir.
- **Derleme:** `firsat-ios.yml` (TestFlight) ve `firsat-android.yml` (imzasız AAB → `builds-firsat-akisi` dalı) — Yaşam Rehberi'nin anahtarlarıyla.
- Yerelde: `npm run serve` → http://127.0.0.1:8791 · `npm run veri` (veri turu) · Simgeler: `npx capacitor-assets generate` (`assets/`, Fıstık).
