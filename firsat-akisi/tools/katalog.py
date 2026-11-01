#!/usr/bin/env python3
"""Fırsat Akışı — market katalogları (haftalık aktüel / indirim broşürleri).

Zincirlerin kendi siteleri kataloglarını çoğunlukla görsel ya da uygulama içinde yayımlıyor; bu yüzden
herkese açık katalog dizininden (cimri.com/brosur) yalnız ŞU BİLGİLER alınır: zincir adı, katalog adı,
başlangıç–bitiş tarihi ve katalog sayfasının adresi. Görsel ya da ürün içeriği kopyalanmaz; kullanıcı
kataloğu o sayfada açar. robots.txt izin vermezse hiçbir şey alınmaz.

Kullanım (veri hattı içinden): from katalog import tara; kayitlar, durum = tara(headers, robots_allows)
"""
from __future__ import annotations

import gzip
import hashlib
import html
import re
import time
from datetime import date, timedelta
from html.parser import HTMLParser
from urllib.parse import urljoin
from urllib.request import Request, urlopen

DIZIN = "https://www.cimri.com/brosur"
# Dizindeki mağaza adresi (slug) → uygulamadaki zincir adı. Yalnız günlük ihtiyaç zincirleri.
ZINCIR = [
    (r"^bim", "BİM"), (r"^a101", "A101"), (r"^sok|^cepte-?sok", "ŞOK"), (r"^migros", "Migros"), (r"^macro", "Macrocenter"),
    (r"^file", "File"), (r"^carrefour", "CarrefourSA"), (r"^metro", "Metro"), (r"^bizim", "Bizim Toptan"),
    (r"^tarim|^tkk|koop", "Tarım Kredi"), (r"^fisko", "Fiskomar"), (r"^happy", "Happy Center"), (r"^hakmar", "Hakmar"),
    (r"^onur", "Onur Market"), (r"^altunbilek", "Altunbilekler"), (r"^kim-?market", "Kim Market"), (r"^mopas", "Mopaş"),
    (r"^gimsa", "Gimsa"), (r"^cagri", "Çağrı Market"), (r"^esenlik", "Esenlik Market"), (r"^seyhanlar", "Seyhanlar"),
    (r"^gratis", "Gratis"), (r"^watsons", "Watsons"), (r"^rossmann", "Rossmann"), (r"^eve", "Eve Shop"),
]
AYLAR = ["ocak", "subat", "mart", "nisan", "mayis", "haziran", "temmuz", "agustos", "eylul", "ekim", "kasim", "aralik"]
AY_TR = {"oca": 1, "şub": 2, "sub": 2, "mar": 3, "nis": 4, "may": 5, "haz": 6, "tem": 7, "ağu": 8, "agu": 8, "eyl": 9, "eki": 10, "kas": 11, "ara": 12}
BAKIM = {"Gratis", "Watsons", "Rossmann", "Eve Shop"}


class Linkler(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links, self._a, self._metin, self.metin = [], None, [], []

    def handle_starttag(self, tag, attrs):
        if tag == "a":
            self._a, self._metin = dict(attrs).get("href") or "", []

    def handle_data(self, data):
        self.metin.append(data)
        if self._a is not None:
            self._metin.append(data)

    def handle_endtag(self, tag):
        if tag == "a" and self._a is not None:
            self.links.append((self._a, " ".join(" ".join(self._metin).split()), len(self.metin)))
            self._a = None


def _al(url, headers):
    with urlopen(Request(url, headers=headers), timeout=20) as r:
        raw = r.read(4_000_000)
        if r.headers.get("Content-Encoding", "").lower() == "gzip":
            raw = gzip.decompress(raw)
        return raw.decode(r.headers.get_content_charset() or "utf-8", "replace")


def _zincir(slug):
    for desen, ad in ZINCIR:
        if re.search(desen, slug):
            return ad
    return None


def _aralik(metin, bas):
    """'7-13 Ekim', '30 Eyl–6 Eki', '1 Ekim - 31 Ekim' → (başlangıç, bitiş) tarihleri; bulunamazsa (bas, None)."""
    m = re.search(r"(\d{1,2})\s*([A-Za-zÇĞİÖŞÜçğıöşü]{3,})?\.?\s*[-–]\s*(\d{1,2})\s*([A-Za-zÇĞİÖŞÜçğıöşü]{3,})", metin)
    if not m:
        return bas, None
    g1, a1, g2, a2 = m.groups()
    ay2 = AY_TR.get(a2[:3].lower())
    if not ay2:
        return bas, None
    ay1 = AY_TR.get((a1 or a2)[:3].lower()) or ay2
    yil = bas.year
    try:
        b = date(yil if not (ay1 == 12 and bas.month == 1) else yil - 1, ay1, int(g1))
        s = date(yil + (1 if ay2 < ay1 else 0), ay2, int(g2))
    except ValueError:
        return bas, None
    return b, s


def tara(headers, robots_allows, bugun=None, log=print):
    bugun = bugun or date.today()
    durum = {"name": "Market katalogları (cimri.com/brosur)", "url": DIZIN, "ok": False, "items": 0}
    if not robots_allows(DIZIN + "/"):
        durum["error"] = "robots.txt izin vermiyor"
        return [], durum
    try:
        ana = Linkler(); ana.feed(_al(DIZIN, headers))
    except Exception as e:  # noqa: BLE001
        durum["error"] = str(e)[:160]
        return [], durum
    sluglar = {}
    for href, _, _ in ana.links:
        m = re.match(r"^(?:https://www\.cimri\.com)?/brosur/([a-z0-9-]+)/?$", href or "")
        if m and _zincir(m.group(1)):
            sluglar[m.group(1)] = _zincir(m.group(1))
    kayitlar, gorulen = [], set()
    for slug, zincir in sorted(sluglar.items()):
        url = f"{DIZIN}/{slug}"
        if not robots_allows(url):
            continue
        try:
            sayfa = _al(url, headers)
        except Exception as e:  # noqa: BLE001
            log(f"  katalog · {zincir}: {str(e)[:80]}")
            continue
        p = Linkler(); p.feed(sayfa)
        duz = " ".join(" ".join(p.metin).split())
        for href, metin, konum in p.links:
            m = re.search(r"/brosur/[a-z0-9-]+/[a-z0-9-]*?-(\d{1,2})-(" + "|".join(AYLAR) + r")-(20\d\d)-[a-z0-9-]*?(\d{3,})/?$", href or "")
            if not m:
                continue
            tam = urljoin(DIZIN, href)
            if tam in gorulen:
                continue
            try:
                bas = date(int(m.group(3)), AYLAR.index(m.group(2)) + 1, int(m.group(1)))
            except ValueError:
                continue
            # bağlantının yanındaki yazı: katalog adı ve tarih aralığı
            komsu = " ".join(" ".join(p.metin[max(0, konum - 12):konum + 12]).split())
            ad = re.sub(r"\s+", " ", html.unescape(metin)).strip(" -·|") or f"{zincir} kataloğu"
            ad = re.sub(r"(?i)^" + re.escape(zincir) + r"\s*[-–·]\s*", "", ad)
            b, s = _aralik(f"{metin} {komsu}", bas)
            if s is None:
                s = b + timedelta(days=6)          # tarih yazmıyorsa: haftalık katalog varsayımı, "tahmini" işaretli
                tahmini = True
            else:
                tahmini = False
            if s < bugun or b > bugun + timedelta(days=10) or (bugun - b).days > 40:
                continue
            gorulen.add(tam)
            ad = ad if re.search(r"katalo|broşür|brosur|fırsat|indirim", ad, re.I) else f"{zincir} indirim kataloğu"
            kid = "kat-" + hashlib.sha1(tam.encode()).hexdigest()[:12]
            kayitlar.append({
                "id": kid, "store": zincir, "title": f"{zincir} · {ad}" if zincir.lower() not in ad.lower() else ad,
                "category": "Kişisel Bakım" if zincir in BAKIM else "Market",
                "offer": f"Katalog · {b.day} {['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'][b.month-1]}–{s.day} {['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'][s.month-1]}",
                "start": b.isoformat(), "end": s.isoformat(), "endGuess": tahmini, "katalog": True,
                "detail": f"{zincir} indirim kataloğu yayında. İndirimli ürünler ve fiyatlar kataloğun kendi sayfasında.",
                "how": ["Kataloğu bağlantıdan aç, almak istediklerini listele.", "Katalog fiyatları stokla sınırlıdır; erken git."],
                "conditions": ["Katalog fiyatları stokla sınırlı.", "Ürün ve fiyatlar şubeye göre değişebilir."],
                "url": tam, "source": "cimri.com katalog dizini", "emoji": "🛒", "cards": [], "channels": ["Mağaza"],
            })
        time.sleep(1.2)  # dizine nazik ol
    durum.update(ok=True, items=len(kayitlar), zincir=len(sluglar))
    return kayitlar, durum
