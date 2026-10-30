#!/usr/bin/env python3
"""Ek-3 (kaynak ve lisans listesi) ve Ek-4 (ekran görüntüleri) PDF'lerini üretir."""
import base64, html, json
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "dist"; OUT.mkdir(exist_ok=True)
core = json.loads((ROOT / "www/data/core.json").read_text())
e = html.escape
CSS = """body{font-family:'PT Sans',Arial,sans-serif;font-size:10.5pt;color:#1f2328;line-height:1.45}
h1{color:#1d4d36;font-size:18pt;margin:0 0 2mm} .k{font-size:9pt;color:#5e5645;margin-bottom:6mm}
table{border-collapse:collapse;width:100%} th,td{border:1px solid #c8bc9a;padding:2mm 2.5mm;vertical-align:top;text-align:left}
th{background:#2f3e4c;color:#fff;font-size:9pt} .shots{display:flex;flex-wrap:wrap;gap:6mm;justify-content:center}
.shots figure{margin:0;width:56mm;text-align:center;font-size:8.5pt;color:#5e5645;page-break-inside:avoid} .shots img{width:56mm;border:1px solid #999}"""
QURANENC = {"rowwad": "turkish_rwwad", "ozek": "turkish_shahin", "saban": "turkish_shaban", "muhtasar": "turkish_mokhtasar"}
rows = [("Arapça metin (Osmanî hat)", "Tanzil Quran Text — Tanzil.net", "—",
         "Creative Commons Atıf 3.0 (CC BY 3.0). Metin birebir, değiştirilmeden kullanılır; kaynak ve tanzil.net bağlantısı belirtilir.")]
for s in core["sources"]:
    rows.append((("Türkçe meal" if s["role"] == "meal" else "Kısa tefsir") + f" — {s['name']}",
                 f"QuranEnc.com (Kur'an-ı Kerim Meallerinin Ansiklopedisi), anahtar: {QURANENC.get(s['id'], s['id'])}",
                 f"{s.get('version') or '—'}" + (f" ({s['updated']})" if s.get("updated") else ""),
                 "QuranEnc kullanım şartları: metin değiştirilmeden, kaynak ve sürüm belirtilerek, ücretsiz yayımlanır; uygunsuz reklam yoktur; güncel sürüm takip edilir; kullanıcıların not bildirimi QuranEnc'e yönlendirilir."))
rows += [("Yazı tipleri", "PT Sans, PT Sans Narrow, Amiri", "—", "SIL Open Font License 1.1"),
         ("Namaz vakti hesabı", "adhan-js (Türkiye/Diyanet yöntemi)", "4.4", "MIT Lisansı — Kur'an metni içermez"),
         ("Manyetik sapma (kıble pusulası)", "World Magnetic Model 2025 (NOAA) · geomagnetism", "2025", "ABD kamu malı · Apache 2.0 — Kur'an metni içermez"),
         ("Uygulama kodu", "Emre Anduv (Mr. Anduv!) — github.com/emreanduv/yasam-rehberi", "1.0.0", "MIT Lisansı (yalnızca kod; metinler kapsam dışı)")]
ek3 = f"""<h1>Ek-3 · Kaynak ve lisans listesi</h1><div class="k">Yaşam Rehberi · veri sürümü {e(core['meta'].get('built') or '')}</div>
<table><tr><th>Bölüm</th><th>Kaynak</th><th>Sürüm</th><th>Kullanım koşulu</th></tr>
{''.join(f'<tr><td>{e(a)}</td><td>{e(b)}</td><td>{e(c)}</td><td>{e(d)}</td></tr>' for a,b,c,d in rows)}</table>
<p style="margin-top:6mm">Uygulamada gösterilen tüm Kur'an metinleri (Arapça metin, mealler, tefsir) yalnızca yukarıdaki kaynaklardan, değiştirilmeden alınır. Uygulama yorum veya fetva içermez.</p>"""
shots = sorted((ROOT / "store/gorseller/appstore-iphone").glob("*.png"))
cap = {"1-ana": "Ana ekran: soru/arama", "2-sonuc": "Soru sonucu ve “Kısa cevap”", "3-ozet": "Özet sekmesi",
       "4-miras": "Konu araması (miras)", "5-ayet": "Ayet sayfası: Arapça, mealler, tefsir", "6-sureler": "Sure listesi"}
ek4 = "<h1>Ek-4 · Ekran görüntüleri</h1><div class='k'>iPhone ekranı, sürüm 1.0.0</div><div class='shots'>" + "".join(
    f"<figure><img src='data:image/png;base64,{base64.b64encode(p.read_bytes()).decode()}'><figcaption>{e(cap.get(p.stem, p.stem))}</figcaption></figure>" for p in shots) + "</div>"
with sync_playwright() as pw:
    b = pw.chromium.launch()
    for name, body in [("Ek-3_Kaynak-ve-lisans-listesi.pdf", ek3), ("Ek-4_Ekran-goruntuleri.pdf", ek4)]:
        pg = b.new_page(); pg.set_content(f"<!doctype html><meta charset='utf-8'><style>{CSS}</style>{body}")
        pg.pdf(path=str(OUT / name), format="A4", margin={"top": "16mm", "bottom": "16mm", "left": "15mm", "right": "15mm"}, print_background=True)
        print(OUT / name)
    b.close()
