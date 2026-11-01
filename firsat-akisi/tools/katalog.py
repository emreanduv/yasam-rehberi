#!/usr/bin/env python3
"""Fırsat Akışı — market katalogları (haftalık aktüel / indirim broşürleri).

Zincirlerin çoğu kataloğunu görsel olarak ya da kendi uygulamasında yayımlıyor; bu yüzden herkese açık
katalog dizininden (akakce.com/brosurler, robots.txt izinli) yalnız ŞU BİLGİLER alınır: zincir adı, katalog adı,
başlangıç tarihi, kalan süre ("Yarın son", "Son gün Cuma", "2 hafta kaldı"…) ve katalog sayfasının adresi.
Görsel ya da ürün içeriği kopyalanmaz; kullanıcı kataloğu o sayfada açar. Sosyal medya paylaşımları alınmaz.

Kullanım (veri hattı içinden): from katalog import tara; kayitlar, durum = tara(headers, robots_allows, bugun)
"""
from __future__ import annotations

import gzip
import hashlib
import html
import re
import time
from datetime import date, timedelta
from urllib.request import Request, urlopen

KOK = "https://www.akakce.com"
DIZIN = KOK + "/brosurler/"
AYLAR = ["ocak", "subat", "mart", "nisan", "mayis", "haziran", "temmuz", "agustos", "eylul", "ekim", "kasim", "aralik"]
AYK = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"]
GUNLER = {"pazartesi": 0, "salı": 1, "çarşamba": 2, "perşembe": 3, "cuma": 4, "cumartesi": 5, "pazar": 6}
# dizindeki adlar → uygulamadaki zincir adı (diğerleri olduğu gibi kalır)
AD = {"bim": "BİM", "şok": "ŞOK", "sok": "ŞOK", "file market": "File", "tarım kredi kooperatifi": "Tarım Kredi", "tarım kredi": "Tarım Kredi",
      "metro": "Metro", "a101": "A101", "migros": "Migros", "carrefoursa": "CarrefourSA", "bizim toptan": "Bizim Toptan", "macrocenter": "Macrocenter",
      "hakmar express": "Hakmar Express", "gratis": "Gratis", "watsons": "Watsons", "rossmann": "Rossmann"}
BAKIM = {"Gratis", "Watsons", "Rossmann", "Eve", "Flormar", "Oriflame", "Avon", "Farmasi"}
# günlük ihtiyaç dışı (teknoloji, giyim…) → alınmaz
DISARIDA = re.compile(r"vatan|vestel|arçelik|beko|teknosa|media ?markt|civil|mion|oriflame|avon|farmasi|lc ?waikiki|defacto|koton|ikea|koçtaş|bauhaus|tekzen|english home|madame coco|karaca|penti|flo\b|ayakkabı|mobilya|yatak|elektronik|bilgisayar", re.I)
SOSYAL = re.compile(r"instagram|facebook|twitter|tiktok|paylaşım", re.I)
GIRDI = re.compile(r'<a\s[^>]*href="(/brosurler/([a-z0-9]+)-(\d{1,2})-(' + "|".join(AYLAR) + r')-(20\d\d)-[a-z0-9-]*?-(\d{3,}))"[^>]*>(.*?)</a>', re.S)
MAGAZA = re.compile(r'<a\s[^>]*href="/brosurler/([a-z0-9-]+)"[^>]*>(.*?)</a>', re.S)


def _al(url, headers):
    h = dict(headers, **{"Accept-Encoding": "gzip"})
    with urlopen(Request(url, headers=h), timeout=20) as r:
        raw = r.read(4_000_000)
        if r.headers.get("Content-Encoding", "").lower() == "gzip":
            raw = gzip.decompress(raw)
        return raw.decode(r.headers.get_content_charset() or "utf-8", "replace")


def _metin(parca):
    return " ".join(html.unescape(re.sub(r"<[^>]+>", " ", parca)).split())


def _bitis(durum, bugun):
    """Dizinin yazdığı kalan süre → (bitiş, tahmini mi, başlamadı mı, başlangıç)."""
    d = durum.casefold()
    if "süresi doldu" in d:
        return None
    if "başlıyor" in d:
        if "yarın" in d:
            bas = bugun + timedelta(days=1)
        else:
            g = next((v for k, v in GUNLER.items() if k in d), None)
            bas = bugun + timedelta(days=((g - bugun.weekday()) % 7) or 7) if g is not None else bugun + timedelta(days=1)
        return bas + timedelta(days=6), True, True, bas
    if "bugün son" in d:
        return bugun, False, False, None
    if "yarın son" in d:
        return bugun + timedelta(days=1), False, False, None
    if "son gün" in d:
        g = next((v for k, v in sorted(GUNLER.items(), key=lambda kv: -len(kv[0])) if k in d), None)
        if g is not None:
            return bugun + timedelta(days=(g - bugun.weekday()) % 7), False, False, None
    m = re.search(r"(\d+)\s*(gün|hafta|ay)\s*kaldı", d)
    if m:
        n = int(m.group(1)) * {"gün": 1, "hafta": 7, "ay": 30}[m.group(2)]
        return bugun + timedelta(days=n), m.group(2) != "gün", False, None
    return None


def _zincir(ad):
    a = ad.strip()
    return AD.get(a.casefold(), a)


def tara(headers, robots_allows, bugun=None, log=print):
    bugun = bugun or date.today()
    durum = {"name": "Market katalogları (akakce.com/brosurler)", "url": DIZIN, "ok": False, "items": 0}
    if not robots_allows(DIZIN):
        durum["error"] = "robots.txt izin vermiyor"
        return [], durum
    try:
        ana = _al(DIZIN, headers)
    except Exception as e:  # noqa: BLE001
        durum["error"] = str(e)[:160]
        return [], durum
    # mağaza sayfaları: "X Broşürleri" bağlantıları
    magazalar = {}
    for slug, icerik in MAGAZA.findall(ana):
        ad = _metin(icerik)
        m = re.match(r"(.+?)\s+Broşürleri$", ad)
        if m and not DISARIDA.search(m.group(1)) and not re.search(r"\d", slug):
            magazalar[slug] = (_zincir(m.group(1)), m.group(1))
    sayfalar = [ana]
    for slug in sorted(magazalar):
        url = f"{KOK}/brosurler/{slug}"
        if not robots_allows(url):
            continue
        try:
            sayfalar.append(_al(url, headers))
        except Exception as e:  # noqa: BLE001
            log(f"  katalog · {magazalar[slug][0]}: {str(e)[:80]}")
        time.sleep(1.0)  # dizine nazik ol
    kayitlar, gorulen = [], set()
    for sayfa in sayfalar:
        for yol, slug, g, ay, yil, no, icerik in GIRDI.findall(sayfa):
            if yol in gorulen:
                continue
            gorulen.add(yol)
            metin = _metin(icerik)                           # "Bim İndirim Broşürü Cuma başlıyor"
            m = re.match(r"(.+?)\s+((?:Son gün|Bugün son|Yarın son|Yarın başlıyor|Süresi doldu|\d+\s*(?:gün|hafta|ay)\s*kaldı|\w+ başlıyor).*)$", metin)
            if not m or SOSYAL.search(metin):
                continue
            ad, kalan = m.group(1), m.group(2)
            ham = (magazalar.get(slug) or (None, None))[1] or ad.split(" İndirim")[0].split(" Aldın")[0].split(" Haftanın")[0].split(" Hafta")[0].split(" Fırsat")[0].split(" At Sepete")[0].split(" Taze")[0]
            zincir = _zincir(ham)
            if DISARIDA.search(zincir) or DISARIDA.search(ad):
                continue
            b = _bitis(kalan, bugun)
            if not b:
                continue
            bitis, tahmini, baslamadi, bas2 = b
            try:
                bas = date(int(yil), AYLAR.index(ay) + 1, int(g))
            except ValueError:
                continue
            if bas2:
                bas = bas2
            if bitis < bugun or bitis < bas or (bitis - bas).days > 75 or (bugun - bas).days > 75:
                continue                                    # ölü ya da uzun süreli genel kayıtlar
            katalog_adi = ad[len(ham):].strip() if ad.casefold().startswith(ham.casefold()) else ad
            katalog_adi = katalog_adi or "Kataloğu"
            baslik = f"{zincir} {katalog_adi}" if zincir.casefold() not in katalog_adi.casefold() else katalog_adi
            kayitlar.append({
                "id": "kat-" + hashlib.sha1(yol.encode()).hexdigest()[:12], "store": zincir, "title": baslik,
                "category": "Kişisel Bakım" if zincir in BAKIM else "Market",
                "offer": f"Katalog · {bas.day} {AYK[bas.month-1]}–{bitis.day} {AYK[bitis.month-1]}",
                "start": bas.isoformat(), "end": bitis.isoformat(), "endGuess": tahmini, "katalog": True,
                "detail": f"{zincir} kataloğu yayında. İndirimli ürünler ve fiyatlar kataloğun sayfasında." + (" Bitiş tarihi tahminidir." if tahmini else ""),
                "how": ["Kataloğu bağlantıdan aç, almak istediklerini listele.", "Katalog fiyatları stokla sınırlıdır; erken git."],
                "conditions": ["Katalog fiyatları stokla sınırlı.", "Ürün ve fiyatlar şubeye göre değişebilir."],
                "url": KOK + yol, "source": "akakce.com katalog dizini", "emoji": "🛒" if zincir not in BAKIM else "🧴",
                "cards": [], "channels": ["Mağaza"],
            })
    durum.update(ok=True, items=len(kayitlar), magaza=len(magazalar))
    return kayitlar, durum
