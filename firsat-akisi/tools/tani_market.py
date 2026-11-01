#!/usr/bin/env python3
"""Market sitelerini tanılama (geliştirici aracı): hangi sayfa GitHub'dan açılıyor, robots.txt izin veriyor mu, HTML'de ne var.
Çıktı: <hedef>/tani/*.html (ilk 400 KB) + tani.txt özeti. Uygulamaya veri yazmaz."""
import gzip, sys, time
from pathlib import Path
from urllib.parse import urlsplit
from urllib.request import Request, urlopen
from urllib.robotparser import RobotFileParser

UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15 FirsatAkisi/1.0"
ADAY = [
    ("bim-aktuel", "https://www.bim.com.tr/Categories/254/aktuel_urunler.aspx"),
    ("bim-ana", "https://www.bim.com.tr/"),
    ("a101-kampanya", "https://www.a101.com.tr/kampanyalar"),
    ("a101-aldin", "https://www.a101.com.tr/aldin-aldin"),
    ("sok-kampanya", "https://www.sokmarket.com.tr/kampanyalar"),
    ("migros-kampanya", "https://www.migros.com.tr/kampanyalar"),
    ("file-ana", "https://www.file.com.tr/"),
    ("file-kampanya", "https://www.file.com.tr/kampanyalar"),
    ("tkk-ana", "https://www.tkkoop.com.tr/"),
    ("tkk-market", "https://www.tarimkredi.org.tr/"),
    ("macro-kampanya", "https://www.macrocenter.com.tr/kampanyalar"),
    ("metro-ana", "https://www.metro-tr.com/"),
    ("fisko-ana", "https://www.fiskobirlik.org.tr/"),
    ("fiskomar-ana", "https://www.fiskomar.com.tr/"),
    ("hakmar-ana", "https://www.hakmarexpress.com.tr/"),
    ("onur-ana", "https://www.onurmarket.com/"),
    ("akakce-brosur", "https://www.akakce.com/brosurler/"),
    ("akakce-file", "https://www.akakce.com/brosurler/filemarket"),
]
hedef = Path(sys.argv[1] if len(sys.argv) > 1 else "veri") / "tani"
hedef.mkdir(parents=True, exist_ok=True)
ozet = []
for ad, url in ADAY:
    p = urlsplit(url); rp = RobotFileParser(); izin = "?"
    try:
        with urlopen(Request(f"{p.scheme}://{p.netloc}/robots.txt", headers={"User-Agent": UA}), timeout=12) as r:
            rp.parse(r.read(200000).decode("utf-8", "replace").splitlines()); izin = "evet" if rp.can_fetch("FirsatAkisi", url) else "HAYIR"
    except Exception as e:
        izin = f"robots okunamadı ({str(e)[:40]})"
    try:
        with urlopen(Request(url, headers={"User-Agent": UA, "Accept-Language": "tr-TR,tr;q=0.9", "Accept-Encoding": "gzip"}), timeout=20) as r:
            raw = r.read(3_000_000)
            if r.headers.get("Content-Encoding", "").lower() == "gzip": raw = gzip.decompress(raw)
            html = raw.decode(r.headers.get_content_charset() or "utf-8", "replace")
            (hedef / f"{ad}.html").write_text(html[:400000], encoding="utf-8")
            ozet.append(f"{ad:16} {r.status} robots:{izin:6} {len(html):8} bayt  → {r.geturl()}")
    except Exception as e:
        ozet.append(f"{ad:16} HATA robots:{izin:6} {str(e)[:90]}")
    time.sleep(1)
(hedef / "tani.txt").write_text("\n".join(ozet), encoding="utf-8")
print("\n".join(ozet))
