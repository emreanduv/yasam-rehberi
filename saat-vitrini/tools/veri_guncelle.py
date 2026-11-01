#!/usr/bin/env python3
"""Saat Vitrini veri hattı — GitHub Actions'ta zamanlanmış çalışır (ücretsiz).

Yayındaki tarayıcının (tools/saat_kaynak.py, Fırsat Akışı'ndaki saat/saat_kaynak.py ile aynı) bir turunu çalıştırır;
fotoğrafları indirmez (uygulama satıcının kendi adresinden gösterir), sonucu uygulamanın okuduğu sade biçimde yazar:
  çıktı: <hedef>/vitrin.json   (varsayılan hedef: ./veri)
Bir kaynak o tur ulaşılamazsa önceki turdaki ürünleri korunur (saat_kaynak'ın kendi kuralı).
Kullanım: python3 tools/veri_guncelle.py [hedef_klasör]
"""
import json
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT))
import saat_kaynak as S  # noqa: E402

hedef = Path(sys.argv[1] if len(sys.argv) > 1 else "veri").resolve()
hedef.mkdir(parents=True, exist_ok=True)
ham = hedef / "ham.json"            # saat_kaynak'ın kendi biçimi (bir sonraki turda "son iyi ürünler" için)
gecici = Path(tempfile.mkdtemp())

S.VITRIN = ham
S.RESIM = gecici / "resim"
S.DOKUM = gecici / "son"
S.KULUP_KESIF = hedef / "kulup_kesif.json"
# fotoğraf indirme yok: büyük boy adresi, olmazsa satıcının liste fotoğrafı
S.resim_indir = lambda url, yedek=None: url or yedek or ""

S.yukle()
S._tara(print)
d = json.loads(ham.read_text(encoding="utf-8"))

ALAN = ("id", "marka", "ad", "model", "tur", "ozellik", "cins", "fiyat", "eski", "indirim", "satici", "site", "url", "stok")
items = []
for u in d.get("items", []):
    x = {k: u.get(k) for k in ALAN}
    x["img"] = u.get("resim") if str(u.get("resim", "")).startswith("http") else u.get("kaynak_resim")
    x["img2"] = u.get("kaynak_resim")
    items.append(x)
cikti = {"checkedAt": d.get("checkedAt"), "markalar": S.MARKALAR, "aksesuar": sorted(S.AKSESUAR),
         "akilli": sorted(S.AKILLI), "kulup": sorted(S.KULUP), "items": items}
(hedef / "vitrin.json").write_text(json.dumps(cikti, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
print(f"vitrin.json: {len(items)} ürün · {d.get('checkedAt')}")
