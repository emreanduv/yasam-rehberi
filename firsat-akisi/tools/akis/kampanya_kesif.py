#!/usr/bin/env python3
"""Çarşı markalarının kampanya sayfalarını bulur (Fırsat Akışı canlı taramasına ekler).

carsi_markalar.json'daki her markanın kendi web sitesinde /kampanyalar, /kampanya, /indirim … yollarını yoklar.
Sayfa açılıyor, aynı sitede kalıyor, ana sayfaya dönmüyor ve içinde kampanya/indirim sözcükleri geçiyorsa
kaynak olarak kaydedilir (kesif.json). Bulunan sayfa 7 günde, bulunamayan 14 günde bir yeniden yoklanır.
robots.txt'ye uyulur, istekler arası bekleme var; giriş, sepet, arama yok.
"""
from __future__ import annotations

import json
import re
import threading
import time
from datetime import datetime
from pathlib import Path
from urllib.parse import urlsplit
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parent
MARKALAR = ROOT / "carsi_markalar.json"
KAYIT = ROOT / "kesif.json"
YOLLAR = ["kampanyalar", "kampanya", "indirim", "firsatlar", "kampanyali-urunler", "indirimli-urunler"]
BEKLE = 1.5
_lock = threading.Lock()


def _yukle(p, bos):
    try:
        return json.loads(p.read_text(encoding="utf-8"))
    except Exception:
        return bos


def kaynaklar():
    """Canlı taramaya eklenecek (ad, adres, kategori) listesi."""
    k = _yukle(KAYIT, {})
    return [(ad, v["url"], v.get("kat", "Ev & Yaşam")) for ad, v in sorted(k.items()) if v.get("url")]


def ozet():
    k = _yukle(KAYIT, {})
    return {"denenen": len(k), "bulunan": sum(1 for v in k.values() if v.get("url"))}


def _dene(url, headers, robots_allows):
    if not robots_allows(url):
        return None
    try:
        with urlopen(Request(url, headers=headers), timeout=12) as r:
            if r.status != 200 or "html" not in (r.headers.get("Content-Type") or ""):
                return None
            son = r.geturl()
            raw = r.read(1_500_000)
            if (r.headers.get("Content-Encoding") or "").lower() == "gzip":
                import gzip
                raw = gzip.decompress(raw)
    except Exception:
        return None
    a, b = urlsplit(url), urlsplit(son)
    if b.netloc.replace("www.", "") != a.netloc.replace("www.", "") or b.path.strip("/") == "":
        return None   # başka siteye ya da ana sayfaya yönlendirdi
    metin = raw.decode("utf-8", "replace").lower()
    if len(re.findall(r"kampanya|indirim|fırsat", metin)) < 4 or re.search(r"<title>[^<]*(404|bulunamad|not found)", metin):
        return None
    return son


def kesfet(headers, robots_allows, mevcut_adlar=(), log=print):
    """Bir tur: sırası gelen markaları yoklar, kesif.json'u günceller. Mevcut kaynaklarda adı geçenler atlanır."""
    if not _lock.acquire(blocking=False):
        return
    try:
        markalar = _yukle(MARKALAR, {}).get("items", [])
        kayit = _yukle(KAYIT, {})
        simdi = time.time()
        mevcut = {a.casefold() for a in mevcut_adlar}
        yeni = 0
        for m in markalar:
            ad, w = m.get("n"), m.get("w")
            if not ad or not w or m.get("yd") or ad.casefold() in mevcut:
                continue
            onceki = kayit.get(ad) or {}
            if onceki and simdi - onceki.get("t", 0) < (7 if onceki.get("url") else 14) * 86400:
                continue
            p = urlsplit(w if "//" in w else "https://" + w)
            kok = f"{p.scheme or 'https'}://{p.netloc}"
            bulunan = None
            for yol in YOLLAR:
                time.sleep(BEKLE)
                bulunan = _dene(f"{kok}/{yol}", headers, robots_allows)
                if bulunan:
                    break
            kayit[ad] = {"url": bulunan, "kat": m.get("kat"), "site": kok, "t": simdi,
                         "tarih": datetime.now().strftime("%d.%m.%Y")}
            yeni += bool(bulunan)
            if bulunan:
                log(f"  🔎 {ad}: kampanya sayfası bulundu → {bulunan}")
            tmp = KAYIT.with_suffix(".tmp")
            tmp.write_text(json.dumps(kayit, ensure_ascii=False, indent=1), encoding="utf-8")
            tmp.replace(KAYIT)
        o = ozet()
        log(f"🔎 Çarşı kampanya keşfi: {o['bulunan']}/{o['denenen']} markada kampanya sayfası ({yeni} yeni)")
    finally:
        _lock.release()
