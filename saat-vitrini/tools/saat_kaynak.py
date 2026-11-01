#!/usr/bin/env python3
"""Saat Akışı — saatçilerin herkese açık marka sayfalarından vitrin verisi (Fırsat sunucusu /api/saat).

Kurallar: robots.txt'ye uyulur, her istek arasında bekleme var, giriş/sepet/arama yok, pazar yerleri (Trendyol,
Hepsiburada, n11, Çiçeksepeti…) kullanılmaz. Fotoğraf bir kez indirilir, yerelden sunulur; her kartta satıcı yazar.

Tek başına deneme:  python3 saat/saat_kaynak.py        (bir tur tarar, saat/vitrin.json yazar, özet basar)
"""
from __future__ import annotations

import gzip
import hashlib
import html as htmlmod
import json
import os
import re
import socket
import sys
import threading
import time
from datetime import datetime
from pathlib import Path
from urllib.parse import quote, urljoin, urlsplit
from urllib.request import Request, urlopen
from urllib.robotparser import RobotFileParser

DIR = Path(__file__).resolve().parent
RESIM = DIR / "resim"
VITRIN = DIR / "vitrin.json"
BOT = "MrAnduvSaatAkisi"
UA = f"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36 {BOT}/1.0"
BEKLE = 1.5                    # aynı turdaki iki istek arası (sn) — sitelere yük bindirmeyelim
TUR = 6 * 3600                 # 6 saatte bir tazele
TOPLAM = 5000                  # vitrinde en çok ürün (01.11 Emre: hedef 500–5000; akıllı saat ve kulüp dahil)
MARKA_BASI = 250               # vitrinde marka başına en çok ürün
SAYFA = 12                     # marka sayfası başına en çok kaç liste sayfası (rel="next" izlenir)
DOKUM = DIR / "son"            # her kaynağın son indirilen sayfası (ayrıştırıcı bozulursa bakmak için)
MARKALAR = ["Nacar", "Quantum", "Momentus", "Hislon", "TAF Watch", "Pomander", "Svenn", "Zebrino", "Dice Kayek", "David Guner", "Reward", "Seiko", "Casio", "Orient", "Daniel Klein", "Festina", "Fossil", "Freelook", "Ferrè Milano", "Ferro", "Kronen & Söhne", "Homies",
            "Garmin", "Samsung", "Huawei", "Apple", "Amazfit", "Xiaomi",
            "Fenerbahçe", "Galatasaray", "Beşiktaş", "Trabzonspor",
            "ZEN Pırlanta", "Altınbaş", "Zippo", "S.T. Dupont", "Sümer Telkari"]
# Erkek aksesuarı (31.10, Emre): tesbih, bileklik, kol düğmesi, çakmak — yalnız kurumsal/resmî kanallar
AKSESUAR = {"ZEN Pırlanta", "Altınbaş", "Zippo", "S.T. Dupont", "Sümer Telkari"}   # Sümer Telkari: 01.11 Emre
# Akıllı saat (01.11, Emre): ayrı bölüm — renk/kordon varyantları tek ürün sayılır, vitrini doldurmasın diye ayrı kontenjan
AKILLI = {"Garmin", "Samsung", "Huawei", "Apple", "Amazfit", "Xiaomi"}
AKILLI_MARKA_BASI = 100
AKILLI_TOPLAM = 500
# Kulüp (01.11, Emre): resmî kulüp mağazalarının saat · tesbih · çakmak · bileklik · kol düğmesi ürünleri — dört kulübe eşit kontenjan
KULUP = {"Fenerbahçe", "Galatasaray", "Beşiktaş", "Trabzonspor"}
KULUP_MARKA_BASI = 50
KULUP_URUN = re.compile(r"saat|tesbih|tespih|cakmak|bileklik|kol ?dugme|kehribar|oltu")

# (marka, adres, satıcı adı, güven)  güven=True → sayfa zaten o markanın sayfası (ürün adında marka yazmasa da olur)
#                                      güven=False → yoklama: ürün adında marka geçmeli (yanlış sayfaya düşerse boş döner)
KAYNAKLAR = [
    ("Momentus",    "https://hassaat.com.tr/marka/momentus/",       "Has Saat",        True),
    ("Hislon",      "https://hassaat.com.tr/marka/hislon/",         "Has Saat",        True),
    ("Reward",      "https://hassaat.com.tr/marka/reward/",         "Has Saat",        True),
    ("Casio",       "https://hassaat.com.tr/marka/casio/",          "Has Saat",        True),
    ("Reward",      "https://www.adensaat.com/marka/reward",        "Aden Saat",       True),
    ("Casio",       "https://www.adensaat.com/marka/casio",         "Aden Saat",       True),
    ("Reward",      "https://www.pbsaat.com/reward2",               "PB Saat",         True),
    ("Seiko",       "https://kuzeysaat.com/seiko",                  "Kuzey Saat",      True),
    ("Casio",       "https://kuzeysaat.com/casio",                  "Kuzey Saat",      True),
    ("Casio",       "https://www.worldofwatches.com.tr/casio",      "World of Watches", True),
    ("Seiko",       "https://www.worldofwatches.com.tr/seiko",      "World of Watches", True),
    ("Seiko",       "https://www.aydinsaatstore.com/",              "Aydın Saat",      False),   # Seiko distribütörü; ana sayfa vitrini
    ("David Guner", "https://davidguner.com/collections/all/products.json?limit=80", "David Guner", True),   # markanın kendi mağazası
    # ── 31.10 genişletme: markanın kendi mağazası + bağımsız saatçiler ──
    ("Nacar",       "https://www.nacar.com.tr/erkek-kol-saati",     "Nacar",           True),    # markanın kendi mağazası
    ("Nacar",       "https://www.nacar.com.tr/kadin-kol-saati",     "Nacar",           True),
    ("Nacar",       "https://www.safirsaat.com/kategori/nacar",     "Safir Saat",      True),
    ("Momentus",    "https://www.safirsaat.com/kategori/momentus",  "Safir Saat",      True),
    ("Seiko",       "https://www.safirsaat.com/kategori/seiko",     "Safir Saat",      True),
    ("Casio",       "https://www.safirsaat.com/kategori/casio",     "Safir Saat",      True),
    ("Nacar",       "https://www.ersasaat.com.tr/nacar-saat",       "Ersa Saat",       True),
    ("Casio",       "https://www.ersasaat.com.tr/casio-saat",       "Ersa Saat",       True),
    ("Hislon",      "https://www.saatcim.com.tr/hislon",            "Saatçim",         True),
    ("Momentus",    "https://www.saatcim.com.tr/momentus",          "Saatçim",         True),
    ("Seiko",       "https://www.saatcim.com.tr/seiko",             "Saatçim",         True),
    ("Casio",       "https://www.saatcim.com.tr/casio",             "Saatçim",         True),
    ("Nacar",       "https://www.gurbuzsaat.com/nacar-erkek-saat",  "Gürbüz Saat",     True),
    ("Momentus",    "https://www.gurbuzsaat.com/momentus-erkek-saat", "Gürbüz Saat",   True),
    ("Hislon",      "https://www.gurbuzsaat.com/hislon-erkek-saat", "Gürbüz Saat",     True),
    ("Hislon",      "https://www.gurbuzsaat.com/hislon-kadin-saat", "Gürbüz Saat",     True),
    ("Seiko",       "https://www.gurbuzsaat.com/seiko-erkek-saat",  "Gürbüz Saat",     True),
    ("Casio",       "https://www.gurbuzsaat.com/casio-erkek-saat",  "Gürbüz Saat",     True),
    ("Nacar",       "https://www.edipsaat.com/markalar/nacar",      "Edip Saat",       True),
    ("Momentus",    "https://www.edipsaat.com/markalar/momentus",   "Edip Saat",       True),
    ("Hislon",      "https://www.edipsaat.com/markalar/hislon",     "Edip Saat",       True),
    ("Seiko",       "https://www.edipsaat.com/markalar/seiko",      "Edip Saat",       True),
    ("Casio",       "https://www.edipsaat.com/markalar/casio",      "Edip Saat",       True),
    ("Nacar",       "https://www.saatlife.com/nacar-saat",          "Saatlife",        True),
    ("Momentus",    "https://www.saatlife.com/momentus-saat",       "Saatlife",        True),
    ("Hislon",      "https://www.saatlife.com/hislon-saat",         "Saatlife",        True),
    ("David Guner", "https://www.saatlife.com/david-guner-saat",    "Saatlife",        True),
    ("Seiko",       "https://www.saatlife.com/seiko-saat",          "Saatlife",        True),
    ("Casio",       "https://www.saatlife.com/casio-saat",          "Saatlife",        True),
    ("David Guner", "https://www.yildizsaat.com.tr/david-guner1",   "Yıldız Saat",     True),
    # Quantum: 1996'dan beri Türk saat markası (Japon mekanizma) · Dice Kayek: Türk moda evinin saat markası (kendi mağazası)
    ("Quantum",     "https://www.saatcim.com.tr/quantum",           "Saatçim",         True),
    ("Quantum",     "https://www.gurbuzsaat.com/quantum-erkek-saat", "Gürbüz Saat",    True),
    ("Quantum",     "https://www.safirsaat.com/kategori/quantum",   "Safir Saat",      True),
    ("Quantum",     "https://www.saatlife.com/quantum-saat",        "Saatlife",        True),
    ("Quantum",     "https://www.edipsaat.com/markalar/quantum",    "Edip Saat",       True),
    ("Dice Kayek",  "https://dicekayekwatches.com/tr/collections/all", "Dice Kayek",   True),
    # ── 31.10 Emre'nin listesi ──
    ("Hislon",      "https://hislon.com/erkek-saat.html",           "Hislon",          True),    # markanın kendi mağazası (935 ürün)
    ("Hislon",      "https://hislon.com/kadin-saat.html",           "Hislon",          True),
    ("Momentus",    "https://www.momentus.com.tr/erkek-saat.html",  "Momentus",        True),    # markanın kendi mağazası (Hislon ile aynı altyapı)
    ("Momentus",    "https://www.momentus.com.tr/kadin-saat.html",  "Momentus",        True),
    ("David Guner", "https://davidguner.com/collections/uzi-seckileri/products.json?limit=80", "David Guner", True),
    ("Reward",      "https://www.bisaat.com/reward-erkek-kol-saatleri", "Bisaat",      False),
    ("Reward",      "https://www.bisaat.com/reward-kadin-kol-saatleri", "Bisaat",      False),
    ("Casio",       "https://www.bisaat.com/casio-erkek-kol-saatleri", "Bisaat",       False),
    ("Momentus",    "https://www.kosovalisaat.com/momentus-saat",   "Kosovalı Saat",   True),
    ("Nacar",       "https://www.kosovalisaat.com/nacar-saat",      "Kosovalı Saat",   True),
    ("Hislon",      "https://www.kosovalisaat.com/hislon-saat",     "Kosovalı Saat",   False),
    ("TAF Watch",   "https://tafwatch.com/index.php?route=product/category&path=88", "TAF Watch", True),   # Türk Yıldızları · SOLOTÜRK · F-16 serileri
    ("TAF Watch",   "https://tafwatch.com/index.php?route=product/category&path=95_97", "TAF Watch", True),
    ("TAF Watch",   "https://tafwatch.com/index.php?route=product/category&path=78_86", "TAF Watch", True),
    ("Pomander",    "https://www.pomander.com.tr/collections/all/products.json?limit=80", "Pomander", True),
    ("Svenn",       "https://ahsapsaat.com/collections/all/products.json?limit=80", "Svenn", True),     # İzmir atölyesinde el yapımı ahşap
    ("Zebrino",     "https://www.kargunlar.com/zebrino-saatler",    "Kargunlar",       True),
    ("Zebrino",     "https://www.kargunlar.com/woodwatch-saatler",  "Kargunlar",       True),
    # 01.11 haftalık tarama: Zebrino'nun kendi mağazası (zebrino.com.tr — "Zebrino - Doğal Ahşap Moda ve Aksesuarlar"; Woodwatch serisi de orada)
    ("Zebrino",     "https://www.zebrino.com.tr/marka/woodwatch",   "Zebrino",         True),
    ("Zebrino",     "https://www.zebrino.com.tr/",                  "Zebrino",         False),   # ana sayfa vitrini; adında "Zebrino" geçenler
    # ── 31.10 Emre: Orient (Japon, Seiko Epson) · Daniel Klein — mevcut kurumsal saatçilerin marka sayfaları ──
    ("Orient",       "https://www.edipsaat.com/markalar/orient",       "Edip Saat",     True),
    ("Orient",       "https://www.saatcim.com.tr/orient",              "Saatçim",       True),
    ("Orient",       "https://www.gurbuzsaat.com/orient-erkek-saat",   "Gürbüz Saat",   True),
    ("Orient",       "https://www.saatlife.com/orient-saat",           "Saatlife",      True),
    ("Orient",       "https://kuzeysaat.com/orient",                   "Kuzey Saat",    False),
    ("Daniel Klein", "https://www.safirsaat.com/kategori/daniel-klein", "Safir Saat",   True),
    ("Daniel Klein", "https://www.bisaat.com/daniel-klein-kol-saatleri", "Bisaat",      False),
    ("Daniel Klein", "https://www.edipsaat.com/markalar/daniel-klein", "Edip Saat",     True),
    ("Daniel Klein", "https://kuzeysaat.com/daniel-klein",             "Kuzey Saat",    False),
    ("Festina",      "https://www.saatlife.com/festina-saat",          "Saatlife",      True),    # İspanyol marka (Festina Lotus)
    ("Festina",      "https://www.edipsaat.com/markalar/festina",      "Edip Saat",     True),
    ("Festina",      "https://kuzeysaat.com/festina",                  "Kuzey Saat",    False),
    ("Festina",      "https://www.safirsaat.com/kategori/festina",     "Safir Saat",    False),
    # Fossil (ABD) · Freelook (Fransa) · Ferrè Milano (İtalya; Türkiye distribütörü Ersa Saat) · Ferro (resmî mağazası yok; yalnız kurumsal saatçilerde varsa)
    ("Fossil",       "https://www.saatcim.com.tr/fossil",              "Saatçim",       True),
    ("Fossil",       "https://www.safirsaat.com/kategori/fossil",      "Safir Saat",    True),
    ("Fossil",       "https://www.saatlife.com/fossil-saat",           "Saatlife",      True),
    ("Fossil",       "https://www.gurbuzsaat.com/fossil-erkek-saat",   "Gürbüz Saat",   True),
    ("Fossil",       "https://www.edipsaat.com/markalar/fossil",       "Edip Saat",     True),
    ("Freelook",     "https://www.saatcim.com.tr/freelook",            "Saatçim",       True),
    ("Freelook",     "https://www.saatlife.com/freelook-saat",         "Saatlife",      True),
    ("Ferrè Milano", "https://www.ersasaat.com.tr/ferre-milano-saat",  "Ersa Saat",     True),    # Türkiye distribütörü
    ("Ferrè Milano", "https://www.edipsaat.com/markalar/ferre-milano", "Edip Saat",     False),
    ("Ferro",        "https://www.edipsaat.com/markalar/ferro",        "Edip Saat",     False),
    ("Ferro",        "https://kuzeysaat.com/ferro",                    "Kuzey Saat",    False),
    # ── 01.11 Emre: köstekli cep saatleri — markaların kendi mağazaları + World of Watches'ın köstekli cep saati kategorisi (markası adından) ──
    ("Nacar",        "https://www.nacar.com.tr/erkek-saat/cep-saatleri", "Nacar",        True),
    ("Hislon",       "https://hislon.com/erkek-saat/pocket-collection.html", "Hislon",   True),
    ("*",            "https://www.worldofwatches.com.tr/kostekli-cep-saatleri", "World of Watches", False),
    # ── 01.11 Emre: Homies (uygun fiyatlı) — Bisaat'ın Homies sayfaları (Bisaat menüsünde bulundu) ──
    ("Homies",       "https://www.bisaat.com/homies-erkek-saat",       "Bisaat",        True),
    ("Homies",       "https://www.bisaat.com/homies-bayan-saatleri",   "Bisaat",        True),
    ("Homies",       "https://hassaat.com.tr/marka/homies/",           "Has Saat",      True),
    ("Homies",       "https://www.pbsaat.com/homies1",                 "PB Saat",       True),
    # ── 01.11 Akıllı saat: kurumsal saatçilerin marka sayfaları + karışık "akıllı saat" kategorileri ("*A": markası ürün adından bulunur) ──
    ("Garmin",       "https://www.saatvesaat.com.tr/garmin",           "Saat&Saat",     True),
    ("Samsung",      "https://www.saatvesaat.com.tr/samsung",          "Saat&Saat",     True),
    ("Huawei",       "https://www.saatvesaat.com.tr/huawei",           "Saat&Saat",     True),
    ("*A",           "https://www.saatvesaat.com.tr/akilli-saat",      "Saat&Saat",     False),
    ("*A",           "https://www.ersasaat.com.tr/akilli-saat",        "Ersa Saat",     False),
    ("*A",           "https://www.adensaat.com/kategori/akilli-saatler", "Aden Saat",   False),
    ("*A",           "https://hassaat.com.tr/kategori/akilli-saat/",   "Has Saat",      False),
    # ── 01.11 Emre'nin getirdikleri: markanın kendi mağazası / kurumsal saatçiler ──
    ("Daniel Klein", "https://www.danielkleinofficial.com/erkek-saat", "Daniel Klein (resmî)", True),   # markanın Türkiye mağazası; Bigotti ürünleri ayıklanır
    ("Seiko",        "https://www.saatvesaat.com.tr/seiko",            "Saat&Saat",     True),
    ("Quantum",      "https://www.adensaat.com/marka/quantum",         "Aden Saat",     True),
    ("Kronen & Söhne", "https://smartsaat.com/collections/kronen-sohne/products.json?limit=80", "Smart Saat (Saatadam & Co.)", True),   # distribütör mağazası
    ("Ferro",        "https://www.saatlife.com/ferro-saat",            "Saatlife",      False),
    ("Ferro",        "https://www.bisaat.com/ferro-kol-saatleri",      "Bisaat",        False),
    # ── Erkek aksesuarı (31.10): tesbih · bileklik · kol düğmesi · çakmak ──
    ("ZEN Pırlanta", "https://www.zenpirlanta.com/tesbihler",          "ZEN Pırlanta",  True),
    ("ZEN Pırlanta", "https://www.zenpirlanta.com/erkek-bileklikleri", "ZEN Pırlanta",  True),
    ("ZEN Pırlanta", "https://www.zenpirlanta.com/kol-dugmeleri",      "ZEN Pırlanta",  True),
    ("ZEN Pırlanta", "https://www.zenpirlanta.com/erkek-yuzukleri",    "ZEN Pırlanta",  True),
    ("Altınbaş",     "https://www.altinbas.com/tespihler",             "Altınbaş",      True),
    ("Altınbaş",     "https://www.altinbas.com/gumus-erkek-tesbihler", "Altınbaş",      True),
    ("Zippo",        "https://www.zippo.com.tr/urunler/cakmak",        "Zippo Türkiye", True),   # resmî Türkiye sitesi, yalnız çakmaklar
    ("Zippo",        "https://www.edipsaat.com/markalar/zippo",        "Edip Saat",     True),
    ("S.T. Dupont",  "https://www.edipsaat.com/markalar/s-t-dupont",   "Edip Saat",     True),    # Türkiye distribütörü garantili
    ("S.T. Dupont",  "https://www.edipsaat.com/markalar/st-dupont",    "Edip Saat",     True),
    # 01.11 Emre: Sümer Telkari — markanın kendi mağazası (sumertelkari.com, IdeaSoft; 925 ayar gümüş telkari)
    ("Sümer Telkari", "https://www.sumertelkari.com/kategori/erkek-bileklik", "Sümer Telkari", True),
    ("Sümer Telkari", "https://www.sumertelkari.com/kategori/kol-dugmesi",    "Sümer Telkari", True),
    ("Sümer Telkari", "https://www.sumertelkari.com/kategori/tesbih",         "Sümer Telkari", True),
    # ── yoklama: bulunursa eklenir, yoksa sessizce geçilir ──
    ("Nacar",       "https://www.konyalisaat.com.tr/nacar",         "Konyalı Saat",    False),
    ("Nacar",       "https://www.konyalisaat.com.tr/nacar-saat",    "Konyalı Saat",    False),
    ("Nacar",       "https://www.saatvesaat.com.tr/nacar",          "Saat&Saat",       False),
    ("Nacar",       "https://kuzeysaat.com/nacar",                  "Kuzey Saat",      False),
    ("Nacar",       "https://www.pbsaat.com/nacar",                 "PB Saat",         False),
    ("Nacar",       "https://www.worldofwatches.com.tr/nacar",      "World of Watches", False),
    # ("Nacar",     "https://hassaat.com.tr/?s=nacar&post_type=product", "Has Saat",  False),   # 01.11 kapatıldı: arama sayfası (kural: arama yok), zaten 0 ürün
    ("David Guner", "https://kuzeysaat.com/david-guner",            "Kuzey Saat",      False),
    ("David Guner", "https://www.pbsaat.com/david-guner",           "PB Saat",         False),
    ("Hislon",      "https://kuzeysaat.com/hislon",                 "Kuzey Saat",      False),
    ("Momentus",    "https://kuzeysaat.com/momentus",               "Kuzey Saat",      False),
]

_lock = threading.Lock()
_durum: dict = {"checkedAt": None, "items": [], "sources": [], "running": False}
_robots: dict = {}


# ───────────────────────── yardımcılar ─────────────────────────
def katla(s):
    s = (s or "").replace("İ", "i").replace("I", "ı").lower()
    s = s.translate(str.maketrans("çğıöşüâî", "cgiosuai"))
    return "".join(c for c in __import__("unicodedata").normalize("NFD", s) if __import__("unicodedata").category(c) != "Mn")   # è → e (Ferrè)


def temiz(s):
    return re.sub(r"\s+", " ", htmlmod.unescape(re.sub(r"<[^>]+>", " ", s or ""))).strip()


def tl(text):
    """'₺23.199,99' · '7.600,00 ₺' · '₺2.339' · '3720.00' → 23199.99"""
    if text is None:
        return None
    if isinstance(text, (int, float)):
        return float(text)
    t = re.sub(r"[^\d.,]", "", str(text))
    if not t:
        return None
    if re.fullmatch(r"\d{1,3}(,\d{3})+(\.\d{1,2})?", t) or re.fullmatch(r"\d+\.\d{2}", t):   # 2,760.00 · 4058.10 (İngilizce biçim)
        t = t.replace(",", "")
    elif "," in t:
        t = t.replace(".", "").replace(",", ".")
    elif re.fullmatch(r"\d{1,3}(\.\d{3})+", t):
        t = t.replace(".", "")
    try:
        v = float(t)
    except ValueError:
        return None
    return v if 50 <= v <= 5_000_000 else None


MODEL_RE = re.compile(r"\b(?=[A-Z0-9-]*\d)(?=[A-Z0-9-]*[A-Z])[A-Z0-9]{2,}(?:[-.][A-Z0-9]{1,})*\b")


def model_kodu(ad):
    adaylar = [m for m in MODEL_RE.findall(ad or "") if len(m) >= 5 and not re.fullmatch(r"\d+(MM|ATM|M)?", m)]
    return max(adaylar, key=len) if adaylar else ""


def ad_ozellik(ad, marka):
    """'Reward Erkek Multifonksiyon Erkek Kol Saati | 45 mm Çelik Kasa, Çelik Kordon' → (başlık, [özellikler])"""
    ad = temiz(ad)
    ozel = []
    if "|" in ad:
        ad, kuyruk = ad.split("|", 1)
        ozel = [x.strip() for x in re.split(r",|·|/", kuyruk) if x.strip()][:4]
    ad = ad.strip(" -–")
    k = katla(ad)
    for anahtar, etiket in (("otomatik", "Otomatik"), ("kronograf", "Kronograf"), ("safir", "Safir cam"), ("gmt", "GMT"),
                             ("solar", "Solar"), ("dalgic", "Dalgıç"), ("kostek", "Köstekli"), ("cep saat", "Cep saati"), ("pocket", "Cep saati"), ("multifonksiyon", "Multifonksiyon"), ("celik", "Çelik"),
                             ("deri", "Deri kordon"), ("takvim", "Takvimli")):
        if anahtar in k and etiket not in ozel and len(ozel) < 4:
            ozel.append(etiket)
    if marka in AKILLI:
        mm = re.search(r"(\d{2})\s?mm\b", k)
        for kosul, etiket in ((mm, f"{mm.group(1)} mm" if mm else ""), ("amoled" in k, "AMOLED"), ("gps" in k, "GPS"),
                              ("esim" in k or "lte" in k or "4g" in k, "eSIM / LTE"), ("bluetooth" in k, "Bluetooth"), ("solar" in k, "Solar şarj")):
            if kosul and etiket not in ozel and len(ozel) < 4:
                ozel.insert(0, etiket) if etiket.endswith("mm") else ozel.append(etiket)
    if ad.isupper() and len(ad) > 12:
        tr = lambda w: (w[0] + w[1:].replace("İ", "i").replace("I", "ı").lower()) if w else w
        ad = " ".join(w if MODEL_RE.fullmatch(w) else tr(w) for w in ad.split())
    return ad, ozel


RENKLER = ("siyah", "beyaz", "gri", "gumus", "altin", "rose", "pembe", "mavi", "lacivert", "yesil", "kirmizi", "mor", "bej", "krem",
           "kahverengi", "turuncu", "sari", "titanyum", "grafit", "fume", "lila", "bordo", "haki", "antrasit", "silver", "black", "white", "gold",
           "blue", "green", "pink", "graphite", "obsidyen", "kordon", "kayis", "kayisli", "silikon", "deri", "metal", "hasir", "orgu", "spor", "band")


def varyant(ad):
    """Akıllı saatte renk/kordon farkı aynı ürün: 'Galaxy Watch8 44mm Gümüş' ≈ 'Galaxy Watch8 44mm Siyah'
    (baştaki stok kodu da atılır: 'GR-010-02934-00 Instinct 3' ≈ 'GR-010-02936-00 Instinct 3')"""
    ad = re.sub(r"\b[A-Z]{2,}[A-Z0-9-]*\d{4,}[A-Z0-9-]*\b", " ", ad or "")
    k = re.sub(r"\([^)]*\)", " ", katla(ad))
    return " ".join(w for w in re.split(r"[^a-z0-9]+", k) if w and w not in RENKLER)


RENK_ADI = ("siyah", "beyaz", "gri", "gumus", "altin", "rose", "pembe", "mavi", "lacivert", "yesil", "kirmizi", "mor", "bej", "krem",
            "kahverengi", "turuncu", "sari", "bordo", "haki", "antrasit", "fume", "lila")


def renk(ad):
    """01.11: aynı model kodlu iki ürünü renginden ayır (renk adı yoksa boş → satıcılar arası eşleşme bozulmaz)"""
    k = set(re.split(r"[^a-z]+", katla(ad or "")))
    return " ".join(r for r in RENK_ADI if r in k)


AKILLI_ADI = re.compile(r"akilli saat|smart ?watch|\bwatch\b")
AKILLI_DEGIL = re.compile(r"kordonu|kayisi|\bstrap\b|kulaklik|buds|koruyucu|kilif|sarj|kablo|uyumlu|ekran filmi|\bbileklik\b")   # "Spor Kordon" saatin tarifi, "Saat Kordonu" ürünün kendisi


def akilli_saat_mi(ad):
    """01.11 (Emre): akıllı saat bölümünde kordon, kulaklık, kılıf vb. değil yalnız saatin kendisi"""
    k = katla(ad).replace("ve yedek kordon", "")
    return bool(AKILLI_ADI.search(k)) and not AKILLI_DEGIL.search(k)


def cinsiyet(ad):
    k = katla(ad)
    return "Kadın" if "kadin" in k or "bayan" in k else "Erkek" if "erkek" in k else "Unisex" if "unisex" in k else ""


def getir(url, kac=2_500_000):
    # 01.11 tarama: TAF Watch görselleri "Türk_Hava_Kuvvetleri_arması.png", "TY KRONO/…" gibi Türkçe harfli/boşluklu → önce kodla
    url = quote(url, safe=":/?&=%#+,;@!$'()*~[]")
    for i, sure in enumerate((20, 45)):
        req = Request(url, headers={"User-Agent": UA, "Accept-Language": "tr-TR,tr;q=0.9", "Accept-Encoding": "gzip"})
        try:
            with urlopen(req, timeout=sure) as r:
                raw = r.read(kac)
                if r.headers.get("Content-Encoding", "").lower() == "gzip":
                    raw = gzip.decompress(raw)
                return r.geturl(), r.headers.get("Content-Type", ""), raw
        except Exception as e:
            # 01.11 tarama: Has Saat marka sayfaları 20 sn'de yetişmedi (sayfa açılıyor, yavaş) → bir kez 45 sn ile dene
            zaman_asimi = isinstance(e, (TimeoutError, socket.timeout)) or isinstance(getattr(e, "reason", None), (TimeoutError, socket.timeout))
            if i or not zaman_asimi:
                raise
            time.sleep(BEKLE * 2)


def izinli(url):
    p = urlsplit(url)
    host = f"{p.scheme}://{p.netloc}"
    if host not in _robots:
        rp = RobotFileParser()
        try:
            _, _, raw = getir(host + "/robots.txt", 500_000)
            rp.parse(raw.decode("utf-8", "replace").splitlines())
            _robots[host] = rp
        except Exception:
            _robots[host] = None
    rp = _robots[host]
    return rp is None or rp.can_fetch(BOT, url)


# ───────────────────────── ayrıştırıcılar (site altyapısına göre) ─────────────────────────
def _attr(tag, name):
    m = re.search(r'\b' + name + r'\s*=\s*(["\'])(.*?)\1', tag, re.S)
    return htmlmod.unescape(m.group(2)) if m else ""


def _img(blok, base):
    """Tembel yüklenen görsellerde gerçek adres data-src / data-original / srcset'tedir."""
    for tag in re.findall(r"<img\b[^>]*>", blok, re.S):
        srcset = _attr(tag, "data-srcset") or _attr(tag, "srcset")
        best = ""
        if srcset:
            cands = []
            for part in srcset.split(","):
                bits = part.strip().split()
                if len(bits) == 2 and bits[1].endswith("w") and bits[1][:-1].isdigit():
                    cands.append((abs(int(bits[1][:-1]) - 600), bits[0]))
            if cands:
                best = min(cands)[1]
        src = best or _attr(tag, "data-src") or _attr(tag, "data-original") or _attr(tag, "data-lazy") or _attr(tag, "src")
        if src and not src.startswith("data:") and not re.search(r"load(er)?\.gif|placeholder|blank\.", src, re.I):
            return urljoin(base, src if not src.startswith("//") else "https:" + src)
    return ""


def p_woo(h, base):
    out = []
    for blok in re.split(r'<div class="product-small col\b', h)[1:]:
        blok = blok[:6000]
        a = re.search(r'woocommerce-loop-product__link"[^>]*href="([^"]+)"[^>]*>(.*?)</a>', blok, re.S) or \
            re.search(r'<p class="name product-title[^"]*"><a[^>]*href="([^"]+)"[^>]*>(.*?)</a>', blok, re.S)
        if not a:
            continue
        fiyatlar = [tl(temiz(x)) for x in re.findall(r'<bdi>(.*?)</bdi>', blok, re.S)]
        fiyatlar = [f for f in fiyatlar if f]
        if not fiyatlar:
            continue
        eski = None
        if "<del" in blok and len(fiyatlar) >= 2:
            eski, yeni = fiyatlar[0], fiyatlar[1]
        else:
            yeni = fiyatlar[0]
        img = _img(blok, base)
        if "woocommerce-placeholder" in blok[:blok.find("box-text") if "box-text" in blok else 3000]:
            img = ""
        out.append(dict(ad=temiz(a.group(2)), url=a.group(1), fiyat=yeni, eski=eski, resim=img, stok="outofstock" not in blok[:400]))
    return out


def p_ideasoft(h, base):
    out = []
    for blok in re.split(r'<div class="showcase"', h)[1:]:
        blok = blok[:7000]
        a = re.search(r'<div class="showcase-title">\s*<a href="([^"]+)"[^>]*title="([^"]*)"', blok, re.S)
        if not a:
            continue
        yeni = re.search(r'showcase-price-new">(.*?)</div>', blok, re.S)
        eski = re.search(r'showcase-price-old">(.*?)</div>', blok, re.S)
        yeni = tl(temiz(yeni.group(1))) if yeni else None
        if not yeni:
            continue
        img = _img(blok, base)
        out.append(dict(ad=htmlmod.unescape(a.group(2)), url=urljoin(base, a.group(1)), fiyat=yeni,
                        eski=tl(temiz(eski.group(1))) if eski else None, resim=img, stok="out-of-stock" not in blok))
    return out


def p_ticimax(h, base):
    out = []
    for blok in re.split(r'<div class="productItem\b', h)[1:]:
        blok = blok[:6000]
        a = re.search(r'<div class="productName[^"]*"[^>]*>\s*(<a\b[^>]*>)(.*?)</a>', blok, re.S)
        if not a:
            continue
        url, ad = _attr(a.group(1), "href"), _attr(a.group(1), "title") or temiz(a.group(2))
        if not url:
            continue
        yeni = re.search(r'discountPriceSpan">(.*?)</span>', blok, re.S)
        eski = re.search(r'regularPriceSpan">(.*?)</span>', blok, re.S)
        yeni = tl(temiz(yeni.group(1))) if yeni else None
        if not yeni:
            continue
        img = _img(blok, base)
        out.append(dict(ad=htmlmod.unescape(ad), url=urljoin(base, url), fiyat=yeni,
                        eski=tl(temiz(eski.group(1))) if eski else None, resim=img, stok="tukendi" not in katla(blok)))
    return out


def p_qukasoft(h, base):
    out = []
    for blok in re.split(r'<div class="card-product"', h)[1:]:
        blok = blok[:6000]
        a = re.search(r'<a href="([^"]+)" class="c-p-i-link" title="([^"]*)"', blok)
        if not a:
            continue
        yeni = re.search(r'class="sale-price[^"]*">(.*?)</div>', blok, re.S)
        eski = re.search(r'class="(?:list|regular|old)-price[^"]*">(.*?)</div>', blok, re.S)
        yeni = tl(temiz(yeni.group(1))) if yeni else None
        if not yeni:
            continue
        out.append(dict(ad=htmlmod.unescape(a.group(2)), url=a.group(1), fiyat=yeni,
                        eski=tl(temiz(eski.group(1))) if eski else None, resim=_img(blok, base), stok="tukendi" not in katla(blok)))
    return out


def p_shopify(raw, base):
    data = json.loads(raw)
    out = []
    root = f"{urlsplit(base).scheme}://{urlsplit(base).netloc}"
    for p in data.get("products") or []:
        v = (p.get("variants") or [{}])[0]
        yeni, eski = tl(v.get("price")), tl(v.get("compare_at_price"))
        if not yeni:
            continue
        img = ((p.get("images") or [{}])[0] or {}).get("src") or ""
        if img:
            img = img + ("&" if "?" in img else "?") + "width=700"
        out.append(dict(ad=p.get("title") or "", url=f"{root}/products/{p.get('handle')}", fiyat=yeni,
                        eski=eski if eski and eski > yeni else None, resim=img,
                        stok=any(x.get("available") for x in p.get("variants") or [])))
    return out


def p_jsonld(h, base):
    out = []
    for blok in re.findall(r'<script[^>]+application/ld\+json[^>]*>(.*?)</script>', h, re.S):
        try:
            d = json.loads(blok.strip())
        except Exception:
            continue
        stack = d if isinstance(d, list) else [d]
        while stack:
            x = stack.pop()
            if isinstance(x, dict):
                if x.get("@type") == "Product":
                    off = x.get("offers") or {}
                    off = off[0] if isinstance(off, list) and off else off
                    f = tl(off.get("price") if isinstance(off, dict) else None)
                    img = x.get("image")
                    img = img[0] if isinstance(img, list) and img else img if isinstance(img, str) else ""
                    if f:
                        out.append(dict(ad=x.get("name") or "", url=urljoin(base, x.get("url") or base), fiyat=f, eski=None, resim=img or "", stok=True))
                stack.extend(v for v in x.values() if isinstance(v, (dict, list)))
            elif isinstance(x, list):
                stack.extend(x)
    return out


def p_ersa(h, base):
    """Ersa Yazılım altyapısı (Saatçim, Gürbüz Saat): <a class="product-link" data-name=… data-price=…>"""
    out = []
    for blok in re.split(r'(?=<a href="[^"]*"\s+class="product-link")', h)[1:]:
        blok = blok[:5000]
        a = re.match(r'<a href="([^"]*)"[^>]*data-name="([^"]*)"', blok)
        if not a:
            continue
        ad = temiz(re.search(r'class="watch-model">(.*?)</p>', blok, re.S).group(1)) if 'class="watch-model"' in blok else htmlmod.unescape(a.group(2))
        yeni = re.search(r'class="new-price">(.*?)</span>', blok, re.S)
        eski = re.search(r'class="old-price">(.*?)</span>', blok, re.S)
        yeni = tl(temiz(yeni.group(1))) if yeni else tl(_attr(blok[:blok.find(">") + 1], "data-price"))
        if not yeni:
            continue
        out.append(dict(ad=ad, url=urljoin(base, a.group(1).strip()), fiyat=yeni, eski=tl(temiz(eski.group(1))) if eski else None,
                        resim=_img(blok, base), stok=True))
    return out


def p_tsoft(h, base):
    """T-Soft altyapısı (Saatlife): product-item kartları, data-src görsel, product-price / product-price-not-discounted"""
    out = []
    for blok in re.split(r'class="col-[^"]*product-item"', h)[1:]:
        blok = blok[:6000]
        a = re.search(r'class="product-title"[^>]*>(.*?)</a>', blok, re.S) or re.search(r'<a[^>]+href="([^"]+)"[^>]*class="product-title"', blok)
        link = re.search(r'<a href="([^"]+)" class="image-wrapper', blok) or re.search(r'href="([^"]+)"[^>]*class="product-title"', blok)
        if not a or not link:
            continue
        yeni = re.search(r'class="product-price">([^<]+)<', blok)
        eski = re.search(r'class="product-price-not-discounted">([^<]+)<', blok)
        yeni = tl(yeni.group(1)) if yeni else None
        if not yeni:
            continue
        ad = temiz(a.group(1))
        ad = re.sub(r"\s+-\s+[^-]+$", "", ad) if " - " in ad else ad
        out.append(dict(ad=ad, url=urljoin(base, link.group(1)), fiyat=yeni, eski=tl(eski.group(1)) if eski else None,
                        resim=_img(blok, base), stok=True))
    return out


def p_pikare(h, base):
    """Nacar'ın kendi mağazası (ASP.NET, schema.org mikroveri): <figure> görsel · divUAd ad · divUKod kod · itemprop=price"""
    out = []
    for blok in re.split(r"<figure\b", h)[1:]:
        blok = blok[:6000]
        ad = re.search(r'class="divUAd">\s*<a[^>]*title="([^"]*)"[^>]*href="([^"]+)"', blok)
        fiyat = re.search(r'itemprop="price" content="([\d.]+)"', blok)
        if not ad or not fiyat:
            continue
        kod = re.search(r'class="divUKod"[^>]*content="([^"]+)"', blok)
        img = re.search(r'<img[^>]+content="(https?://[^"]+)"', blok)
        eski = re.search(r'class="divUFiyat0[^"]*"[^>]*>(.*?)</span>', blok, re.S)
        f = float(fiyat.group(1))
        ad_ = htmlmod.unescape(ad.group(1)) + (f" {kod.group(1)}" if kod else "")
        out.append(dict(ad=ad_, url=urljoin(base, ad.group(2)), fiyat=f, eski=tl(temiz(eski.group(1))) if eski else None,
                        resim=img.group(1) if img else _img(blok, base), stok="OutOfStock" not in blok))
    return out


def p_magento(h, base):
    """Magento (hislon.com): product-item-info kartları; old-price / special-price ya da tek fiyat"""
    out = []
    for blok in re.split(r'<div class="product-item-info"', h)[1:]:
        blok = blok[:7000]
        a = re.search(r'class="product-item-link"[^>]*href="([^"]+)"[^>]*>(.*?)</a>', blok, re.S) or \
            re.search(r'<a class="product-item-link" href="([^"]+)"\s*>(.*?)</a>', blok, re.S)
        if not a:
            continue
        fiyatlar = [tl(x) for x in re.findall(r'<span class="price">([^<]+)</span>', blok)]
        fiyatlar = [f for f in fiyatlar if f]
        if not fiyatlar:
            continue
        eski = re.search(r'old-price">\s*<span class="price">([^<]+)<', blok)
        yeni = re.search(r'special-price">\s*<span class="price">([^<]+)<', blok)
        yeni, eski = (tl(yeni.group(1)) if yeni else min(fiyatlar)), (tl(eski.group(1)) if eski else None)
        alt = re.search(r'class="product-item-subtitle">(.*?)</div>', blok, re.S)
        ad = temiz(a.group(2)) + (" | " + temiz(alt.group(1)) if alt else "")
        out.append(dict(ad=ad, url=a.group(1), fiyat=yeni, eski=eski, resim=_img(blok, base), stok="out-of-stock" not in blok[:3000]))
    return out


def p_dawn(h, base):
    """Kart temalı mağazalar (zippo.com.tr): card__heading başlık · price-item--sale / --regular"""
    out, gor = [], set()
    for blok in re.split(r'<div class="card-wrapper', h)[1:]:
        blok = blok[:6000]
        a = re.search(r'class="card__heading[^"]*">\s*<a href="([^"]+)"[^>]*title="([^"]*)"', blok)
        if not a or a.group(1) in gor:
            continue
        sale = re.search(r'price-item--sale[^"]*">([^<]+)<', blok)
        reg = re.search(r'price__regular">.*?price-item--regular">([^<]+)<', blok, re.S)
        yeni = tl(sale.group(1)) if sale else (tl(reg.group(1)) if reg else None)
        eski = tl(reg.group(1)) if reg else None
        if not yeni:
            continue
        gor.add(a.group(1))
        out.append(dict(ad=htmlmod.unescape(a.group(2)), url=urljoin(base, a.group(1)), fiyat=yeni, eski=eski if eski and eski > yeni else None,
                        resim=_img(blok, base), stok="tükendi" not in blok.lower()))
    return out


def p_bisaat(h, base):
    """Vikaon (bisaat.com): product-item · product-title · data-money (fiyat sayfaya JS ile yazılıyor)"""
    out = []
    for m in re.finditer(r'<a href="([^"]+)">\s*<div class="product-item">(.*?)</a>', h, re.S):
        blok = m.group(2)
        ad = re.search(r'class="product-title">(.*?)</h4>', blok, re.S)
        yeni = re.search(r'class="current-price"><span class="price" data-money="([\d.]+)"', blok)
        eski = re.search(r'class="price-old" data-money="([\d.]+)"', blok)
        if not ad or not yeni:
            continue
        f = float(yeni.group(1))
        out.append(dict(ad=temiz(ad.group(1)), url=urljoin(base, m.group(1)), fiyat=f, eski=float(eski.group(1)) if eski else None,
                        resim=_img(blok, base), stok=True))
    return out


def p_gelistir(h, base):
    """Geliştir altyapısı (kargunlar.com): product-container · product-name · product-price"""
    out = []
    for blok in re.split(r'<div class="product-container">', h)[1:]:
        blok = blok[:4000]
        a = re.search(r'class="product-name"><a href="([^"]+)" title="([^"]*)"', blok)
        yeni = re.search(r'class="price product-price">([^<]+)<', blok)
        eski = re.search(r'class="price old-price"[^>]*>([^<]+)<', blok)
        if not a or not yeni or not tl(yeni.group(1)):
            continue
        out.append(dict(ad=htmlmod.unescape(a.group(2)), url=urljoin(base, a.group(1)), fiyat=tl(yeni.group(1)),
                        eski=tl(eski.group(1)) if eski else None, resim=_img(blok, base), stok=True))
    return out


def p_altinbas(h, base):
    """Altınbaş: ürün kutusundaki data-googletag (ad, fiyat, indirimli fiyat) + mnresize görseli"""
    out = []
    for blok in re.split(r'<div class="product-box ', h)[1:]:
        blok = blok[:6000]
        g = re.search(r'data-googletag="\{name:\'([^\']+)\',id:\'[^\']*\',url:\'([^\']+)\',price:\'([\d.]+)\',sale_price:\'([\d.]+)\'', htmlmod.unescape(blok))
        if not g:
            continue
        fiyat, liste = float(g.group(4)), float(g.group(3))
        img = re.search(r'data-srcset="(https://img-altinbasstore[^"\s]+)"', blok)
        resim = re.sub(r"/mnresize/\d+/\d+/", "/mnresize/700/700/", img.group(1)) if img else _img(blok, base)
        out.append(dict(ad=g.group(1), url=urljoin(base, g.group(2)), fiyat=fiyat, eski=liste if liste > fiyat else None, resim=resim, stok=True))
    return out


def p_nextdata(h, base):
    """Next.js mağazaları (ikas, Magento+Next…): __NEXT_DATA__ içindeki ürün nesneleri."""
    m = re.search(r'<script id="__NEXT_DATA__"[^>]*>(.*?)</script>', h, re.S)
    if not m:
        return []
    try:
        data = json.loads(m.group(1))
    except Exception:
        return []
    out, seen, stack = [], set(), [data]
    while stack:
        x = stack.pop()
        if isinstance(x, list):
            stack.extend(x)
            continue
        if not isinstance(x, dict):
            continue
        ad = x.get("name") or x.get("title")
        fiyat = None
        for k in ("finalPrice", "final_price", "sellPrice", "discountPrice", "salePrice", "special_price", "price", "regular_price"):
            v = x.get(k)
            if isinstance(v, dict):
                v = v.get("value") or v.get("amount")
            if isinstance(v, (int, float, str)) and tl(v):
                fiyat = tl(v)
                break
        img = x.get("image") or x.get("small_image") or x.get("thumbnail") or x.get("images")
        if isinstance(img, list):
            img = img[0] if img else ""
        if isinstance(img, dict):
            img = img.get("url") or img.get("src") or img.get("imageUrl") or ""
        link = x.get("url") or x.get("url_key") or x.get("slug") or x.get("href") or ""
        if isinstance(ad, str) and fiyat and isinstance(img, str) and img and isinstance(link, str) and link and ad not in seen:
            seen.add(ad)
            link = link if link.startswith("http") or link.startswith("/") else "/" + link + (".html" if "url_key" in x else "")
            eski = tl(x.get("regular_price") or x.get("listPrice") or x.get("compareAtPrice") or x.get("oldPrice")) if not isinstance(x.get("regular_price"), dict) else None
            out.append(dict(ad=temiz(ad), url=urljoin(base, link), fiyat=fiyat, eski=eski if eski and eski > fiyat else None,
                            resim=urljoin(base, img if not img.startswith("//") else "https:" + img), stok=True))
            continue
        stack.extend(v for v in x.values() if isinstance(v, (dict, list)))
    return out


FIYAT_RE = re.compile(r"(?:₺|TL\s*)?\s*(\d{1,3}(?:\.\d{3})+(?:,\d{2})?|\d{3,6},\d{2})\s*(?:₺|TL|&#8378;)?")


def p_sezgisel(h, base):
    """Bilinmeyen altyapı: içinde görsel olan ürün bağlantısını bul, ardından gelen ilk fiyat(lar)ı al.
    İki fiyat varsa büyüğü eski, küçüğü güncel fiyat sayılır."""
    out, seen = [], set()
    host = urlsplit(base).netloc
    bul = [a for a in re.finditer(r'<a\b[^>]*href=["\']([^"\'#]+)["\'][^>]*>(.{0,1500}?)</a>', h, re.S) if "<img" in a.group(2)]
    for i, a in enumerate(bul):
        icerik = a.group(2)
        url = urljoin(base, htmlmod.unescape(a.group(1)))
        if urlsplit(url).netloc not in ("", host) or url in seen or url.rstrip("/") == base.rstrip("/"):
            continue
        if re.search(r"/(sepet|uye|giris|hesap|kategori|markalar?|blog|iletisim|kampanya)", url, re.I):
            continue
        # pencere: bu ürünün bağlantısından, BAŞKA bir ürünün görselli bağlantısına kadar (komşu ürünün fiyatı karışmasın)
        son = next((b.start() for b in bul[i + 1:] if urljoin(base, htmlmod.unescape(b.group(1))) != url), a.end() + 3000)
        pencere = h[a.start():min(son, a.end() + 3000)]
        fiyatlar = []
        for fm in re.finditer(r"(?:₺|TL|&#8378;)\s*(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)|(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)\s*(?:₺|TL|&#8378;)", pencere):
            v = tl(fm.group(1) or fm.group(2))
            if v and v not in fiyatlar:
                fiyatlar.append(v)
            if len(fiyatlar) == 2:
                break
        if not fiyatlar:
            continue
        tag = re.search(r"<img\b[^>]*>", icerik).group(0)
        ad = _attr(a.group(0)[:a.group(0).find(">") + 1], "title") or _attr(tag, "alt") or temiz(icerik)
        if not ad or len(ad) < 6:
            t = re.search(r'title="([^"]{6,})"|>([^<>]{8,120})</a>', pencere)
            ad = (t.group(1) or t.group(2)) if t else ad
        img = _img(icerik, base)
        if not img or not ad:
            continue
        seen.add(url)
        yeni, eski = (min(fiyatlar), max(fiyatlar)) if len(fiyatlar) == 2 else (fiyatlar[0], None)
        if eski and eski > yeni * 3:   # ilgisiz fiyat (kargo sınırı vb.)
            eski = None
        out.append(dict(ad=temiz(ad), url=url, fiyat=yeni, eski=eski, resim=img, stok=True))
    return out if len(out) >= 2 else []


def p_akinon(h, base):
    """Akinon altyapısı (GS Store vb.): ürün kutusu data-* özniteliklerinde"""
    out = []
    for blok in re.findall(r'<div[^>]+class="[^"]*js-product-wrapper[^"]*"[^>]*>', h):
        a = lambda n: htmlmod.unescape(_attr(blok, n) or "")
        ad, url, img = a("data-title"), a("data-url"), a("data-main-image")
        fiyat, liste = tl(a("data-price")), tl(a("data-retail-price"))
        if not (ad and url and img and fiyat):
            continue
        out.append(dict(ad=temiz(ad), url=urljoin(base, url), fiyat=fiyat, eski=liste if liste and liste > fiyat * 1.01 else None,
                        resim=urljoin(base, img), stok=True))
    return out


def sonraki_sayfa(h, url):
    m = re.search(r'<link[^>]+rel=["\']next["\'][^>]*href=["\']([^"\']+)', h) or re.search(r'<link[^>]+href=["\']([^"\']+)["\'][^>]*rel=["\']next', h) \
        or re.search(r'<a[^>]+rel=["\']next["\'][^>]*href=["\']([^"\']+)', h)
    return urljoin(url, htmlmod.unescape(m.group(1))) if m else None


def ayristir(url, ctype, raw):
    if "json" in ctype or url.endswith(".json") or ".json?" in url:
        return "shopify", p_shopify(raw, url)
    h = raw.decode("utf-8", "replace")
    for ad, sinyal, fn in (("akinon", 'data-main-image="', p_akinon), ("magento", 'class="product-item-info"', p_magento), ("dawn", 'class="card__heading', p_dawn),
                           ("vikaon", 'data-money="', p_bisaat), ("gelistir", 'class="product-container"', p_gelistir),
                           ("altinbas", 'data-googletag="{name:', p_altinbas),
                           ("ersa", 'class="product-link"', p_ersa), ("tsoft", "product-price-not-discounted", p_tsoft),
                           ("pikare", 'class="divUAd"', p_pikare),
                           ("woo", "product-small col", p_woo), ("ideasoft", 'class="showcase-title"', p_ideasoft),
                           ("ticimax", 'class="productItem', p_ticimax), ("qukasoft", 'class="card-product"', p_qukasoft)):
        if sinyal in h:
            r = fn(h, url)
            if r:
                return ad, r
    for ad, fn in (("jsonld", p_jsonld), ("nextdata", p_nextdata), ("sezgisel", p_sezgisel)):
        r = fn(h, url)
        if r:
            return ad, r
    return "yok", []


# ───────────────────────── fotoğraf ─────────────────────────
UZANTI = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp", "image/avif": ".avif", "image/gif": ".gif"}


def resim_indir(url, yedek=None):
    """Fotoğrafı bir kez indir (saat/resim/), yerelden sun. Zaten varsa yeniden indirme."""
    if not url:
        return ""
    RESIM.mkdir(exist_ok=True)
    kok = hashlib.sha1(url.encode()).hexdigest()[:16]
    for ext in UZANTI.values():
        if (RESIM / (kok + ext)).exists():
            return f"/saat/resim/{kok}{ext}"
    for deneme in [url] + ([yedek] if yedek and yedek != url else []):
        if not izinli(deneme):
            continue
        try:
            time.sleep(BEKLE / 2)
            _, ctype, raw = getir(deneme, 3_000_000)
        except Exception:
            continue
        ext = UZANTI.get(ctype.split(";")[0].strip().lower())
        if not ext or len(raw) < 1500:
            continue
        (RESIM / (kok + ext)).write_bytes(raw)
        return f"/saat/resim/{kok}{ext}"
    return ""


def dokum(url, raw):
    try:
        DOKUM.mkdir(exist_ok=True)
        (DOKUM / (re.sub(r"[^a-z0-9]+", "_", url.lower().split("//", 1)[-1])[:90] + ".html")).write_bytes(raw[:3_000_000])
    except OSError:
        pass


def buyuk_boy(url):
    """Listede küçük boy gelir; yayında 600 px'lik kart için büyüğünü dene (yoksa küçüğe düşülür)."""
    if "/wp-content/uploads/" in url:
        return re.sub(r"-\d+x\d+(\.\w+)$", r"\1", url)               # WordPress: özgün boy
    if "/idea/" in url:
        return re.sub(r"_min(\.\w+)(\?|$)", r"\1\2", url)             # IdeaSoft: _min'siz
    if "ticimax" in url:
        return url.replace("/thumb/", "/buyuk/")
    if "qukasoft" in url:
        return re.sub(r"-sw\d+sh\d+", "-sw800sh1200", url)
    return url


# ───────────────────────── tur ─────────────────────────
# ── 01.11 Emre: kulüplerin resmî mağazaları (lisanslı saatler) — dört büyük birlikte, tek takım öne çıkmasın ──
# Saat kategorisinin adresi bilinmiyor: robots.txt'deki site haritasından "saat" geçen kategori sayfası bulunur (7 günde bir).
# Ürün adında listemizdeki bir marka (ör. Quantum) geçiyorsa o markanın vitrinine, satıcı olarak kulüp mağazasıyla düşer.
KULUPLER = [("Fenerbahçe", "Fenerium", "https://fenerium.com"), ("Galatasaray", "GS Store", "https://www.gsstore.org"),
            ("Beşiktaş", "Kartal Yuvası", "https://www.kartalyuvasi.com.tr"), ("Trabzonspor", "TS Club", "https://www.tsclub.com.tr")]
KULUP_KESIF = DIR / "kulup_kesif.json"
_SAAT_YOL = re.compile(r"(^|[/\-_])((kol-)?saat(ler|leri|i)?|tesbih(ler)?|tespih(ler)?|cakmak(lar)?|bileklik(ler)?|kol-dugme(si|leri)?)([/\-_.?]|$)", re.I)


def _kulup_bul(kok):
    """Site haritasından saat kategorisi adayları (kısa yollar önde)."""
    haritalar = []
    try:
        _, _, raw = getir(kok + "/robots.txt", 500_000)
        haritalar = re.findall(r"(?im)^\s*sitemap:\s*(\S+)", raw.decode("utf-8", "replace"))
    except Exception:
        pass
    haritalar = haritalar or [kok + "/sitemap.xml"]
    adaylar, gezilen = set(), 0
    while haritalar and gezilen < 14:
        hm = haritalar.pop(0)
        gezilen += 1
        try:
            time.sleep(BEKLE)
            _, _, raw = getir(hm, 8_000_000)
            if hm.endswith(".gz") and raw[:2] == b"\x1f\x8b":
                raw = gzip.decompress(raw)
        except Exception:
            continue
        t = raw.decode("utf-8", "replace")
        locs = [htmlmod.unescape(x.strip()) for x in re.findall(r"<loc>(.*?)</loc>", t, re.S)]
        if "<sitemapindex" in t:
            # kategori haritaları önce, ürün haritaları sona
            locs.sort(key=lambda u: (not re.search(r"categor|kategori|collection|liste", u, re.I), bool(re.search(r"product|urun", u, re.I))))
            haritalar.extend(locs)
            continue
        for u in locs:
            yol = urlsplit(u).path.lower()
            if _SAAT_YOL.search(yol) and yol.count("/") <= 3 and len(yol) <= 40 and not re.search(r"\d{4,}", yol):   # ürün sayfası değil, kategori
                adaylar.add(u)
    return sorted(adaylar, key=lambda u: (len(urlsplit(u).path), u))[:8]


def kulup_kaynaklari(log=print):
    try:
        K = json.loads(KULUP_KESIF.read_text(encoding="utf-8"))
    except Exception:
        K = {}
    out, simdi = [], time.time()
    for takim, ad, kok in KULUPLER:
        e = K.get(ad) or {}
        if not e or e.get("v") != 2 or simdi - e.get("t", 0) > 7 * 86400 or not e.get("url"):
            if e and e.get("v") == 2 and not e.get("url") and simdi - e.get("t", 0) < 86400:
                continue          # dün bulunamadı; günde bir dene
            try:
                bul = _kulup_bul(kok) if izinli(kok + "/") else []
            except Exception:
                bul = []
            e = {"url": bul, "t": simdi, "v": 2, "tarih": datetime.now().strftime("%d.%m.%Y")}
            K[ad] = e
            log(f"  ⚽ {ad}: saat/tesbih/çakmak/bileklik sayfaları " + (", ".join(bul) if bul else "bulunamadı (site haritasında yok ya da erişilemedi)"))
        out += [(takim, u, ad, "K") for u in e.get("url") or []]
    try:
        KULUP_KESIF.write_text(json.dumps(K, ensure_ascii=False, indent=1), encoding="utf-8")
    except Exception:
        pass
    return out


def tara(log=print):
    with _lock:
        if _durum["running"]:
            return
        _durum["running"] = True
    try:
        _tara(log)
    finally:
        with _lock:
            _durum["running"] = False


def _tara(log):
    bulunan, kaynak_durum = [], []
    try:
        ek_kulup = kulup_kaynaklari(log)
    except Exception:
        ek_kulup = []
    for marka, url, satici, guven in KAYNAKLAR + ek_kulup:
        d = {"marka": marka, "url": url, "satici": satici}
        try:
            if not izinli(url):
                d["durum"] = "robots izin vermiyor"
                kaynak_durum.append(d)
                continue
            time.sleep(BEKLE)
            son, ctype, raw = getir(url)
            alt, urunler = ayristir(son, ctype, raw)
            dokum(url, raw)
            # sonraki liste sayfaları (yalnız markanın kendi sayfasında; rel="next" varsa)
            sayfa, adres, gorulen = 1, son, {u["url"] for u in urunler}
            while guven and "json" in ctype and len(urunler) >= 80 * sayfa and sayfa < SAYFA:
                # 01.11 tarama: Shopify products.json sayfası doluysa sonrakine geç (?page=N)
                nx = re.sub(r"[?&]page=\d+", "", url) + ("&" if "?" in url else "?") + f"page={sayfa + 1}"
                if not izinli(nx):
                    break
                time.sleep(BEKLE)
                try:
                    _, ctype2, raw2 = getir(nx)
                    _, ek = ayristir(nx, ctype2, raw2)
                except Exception:
                    break
                ek = [u for u in ek if u["url"] not in gorulen]
                if not ek:
                    break
                gorulen.update(u["url"] for u in ek)
                urunler += ek
                sayfa += 1
            while guven and urunler and sayfa < SAYFA and "json" not in ctype:
                nx = sonraki_sayfa(raw.decode("utf-8", "replace"), adres)
                if not nx or nx == adres or not izinli(nx):
                    break
                time.sleep(BEKLE)
                try:
                    adres, ctype2, raw = getir(nx)
                    _, ek = ayristir(adres, ctype2, raw)
                except Exception:
                    break
                ek = [u for u in ek if u["url"] not in gorulen]
                if not ek:
                    break
                gorulen.update(u["url"] for u in ek)
                urunler += ek
                sayfa += 1
        except Exception as e:
            # site bu turda yanıt vermedi: son başarılı turdaki ürünleri koru (fiyatı o tarihten; vitrin bir anda boşalmasın)
            with _lock:
                eski = [dict(x) for x in _durum.get("items") or [] if x.get("kaynak") == url]
            for x in eski:
                x["kaynak_resim"] = x.get("kaynak_resim") or ""
            bulunan.extend(eski)
            d["durum"] = f"ulaşılamadı ({type(e).__name__})" + (f" · son turdaki {len(eski)} ürün korundu" if eski else "")
            kaynak_durum.append(d)
            continue
        mk = katla(marka).replace(" ", "")
        tut = []
        for u in urunler:
            adk = katla(u["ad"]).replace(" ", "")
            if guven == "K":       # kulüp mağazası: yalnız saat · tesbih · çakmak · bileklik · kol düğmesi
                if KULUP_URUN.search(katla(u["ad"])) and u.get("resim") and u.get("fiyat"):
                    tut.append(u)
                continue
            if marka in ("*", "*A"):   # kulüp mağazası / karışık akıllı saat kategorisi: ürün adındaki markayı bul
                havuz = AKILLI if marka == "*A" else [m for m in MARKALAR if m not in AKSESUAR and m not in KULUP]
                u["_m"] = next((m for m in MARKALAR if m in havuz and katla(m).replace(" ", "") in adk), None)
                if not u["_m"] or not u.get("resim") or not u.get("fiyat"):
                    continue
                tut.append(u)
                continue
            if not guven and mk not in adk:
                continue
            if guven and marka != "David Guner" and any(katla(m).replace(" ", "") in adk for m in MARKALAR if m != marka and m not in KULUP) and mk not in adk:
                continue   # marka sayfasında başka marka (benzer ürünler kutusu vb.)
            if "bigotti" in adk or u["ad"].strip().upper().startswith("BG."):
                continue   # Daniel Klein mağazasındaki ikinci marka
            if not u.get("resim") or not u.get("fiyat"):
                continue
            tut.append(u)
        d.update(durum="tamam", altyapi=alt, urun=len(tut))
        kaynak_durum.append(d)
        site = urlsplit(son).netloc.replace("www.", "")
        for u in tut:
            marka_k = marka
            marka = u.pop("_m", None) or marka
            if marka in AKILLI and not akilli_saat_mi(u["ad"]):
                marka = marka_k
                continue
            ad, ozel = ad_ozellik(u["ad"], marka)
            eski = u.get("eski") if u.get("eski") and u["eski"] > u["fiyat"] * 1.01 else None
            bulunan.append(dict(id=hashlib.sha1(u["url"].encode()).hexdigest()[:12], marka=marka, ad=ad, model=model_kodu(ad),
                                tur="aksesuar" if marka in AKSESUAR else "akilli" if marka in AKILLI else "kulup" if marka in KULUP else "saat",
                                ozellik=ozel, cins=cinsiyet(ad), fiyat=round(u["fiyat"], 2), eski=round(eski, 2) if eski else None,
                                indirim=round((1 - u["fiyat"] / eski) * 100) if eski else 0, satici=satici, site=site,
                                url=u["url"], kaynak_resim=u["resim"], kaynak=url, stok=bool(u.get("stok", True))))
            marka = marka_k
        log(f"  {'✓' if tut else '·'} {marka:<12} {satici:<17} {len(tut):>3} ürün  {alt}")

    # aynı ürün iki satıcıda → ucuz olan kalsın; marka başına en çok MARKA_BASI, indirimli ve stokta olanlar önde
    tek = {}
    for u in bulunan:
        k = (u["marka"], varyant(u["ad"])) if u["marka"] in AKILLI else (u["marka"], u["model"] or u["url"], renk(u["ad"]) if u["model"] else "")
        if k not in tek or u["fiyat"] < tek[k]["fiyat"]:
            tek[k] = u
    secim = []
    for marka in MARKALAR:
        liste = sorted((u for u in tek.values() if u["marka"] == marka), key=lambda u: (not u["stok"], -u["indirim"], -u["fiyat"]))
        # satıcıları karıştır (hep aynı mağaza gelmesin)
        by = {}
        for u in liste:
            by.setdefault(u["satici"], []).append(u)
        karisik = []
        while any(by.values()):
            for s in list(by):
                if by[s]:
                    karisik.append(by[s].pop(0))
        secim.extend(karisik[:AKILLI_MARKA_BASI if marka in AKILLI else KULUP_MARKA_BASI if marka in KULUP else MARKA_BASI])
    # akıllı saat bölümü kendi tavanını aşmasın (markalar arasında dengeli)
    ak = [u for u in secim if u["marka"] in AKILLI]
    if len(ak) > AKILLI_TOPLAM:
        by, kal = {}, []
        for u in ak:
            by.setdefault(u["marka"], []).append(u)
        while len(kal) < AKILLI_TOPLAM and any(by.values()):
            for m in list(by):
                if by[m] and len(kal) < AKILLI_TOPLAM:
                    kal.append(by[m].pop(0))
        kalid = {id(u) for u in kal}
        secim = [u for u in secim if u["marka"] not in AKILLI or id(u) in kalid]
    if len(secim) > TOPLAM:   # 31.10 (Emre): vitrin 500–1000 ürün arası; fazlası markalar arasında dengeli kırpılır
        by, kes = {}, []
        for u in secim:
            by.setdefault(u["marka"], []).append(u)
        while len(kes) < TOPLAM and any(by.values()):
            for m in list(by):
                if by[m] and len(kes) < TOPLAM:
                    kes.append(by[m].pop(0))
        secim = kes

    # fotoğraflar (önce eskiden kalan vitrin dosyası yazılsın: ekran beklemesin)
    hazir = []
    for u in secim:
        if u.get("resim") and (RESIM / Path(u["resim"]).name).exists():
            pass   # önceki turdan korunan ürün, fotoğrafı zaten yerelde
        else:
            u["resim"] = resim_indir(buyuk_boy(u["kaynak_resim"]), u["kaynak_resim"])
        if u["resim"]:
            hazir.append(u)
    an = datetime.now().astimezone().isoformat(timespec="seconds")
    sayim = {m: sum(1 for u in hazir if u["marka"] == m) for m in MARKALAR}
    with _lock:
        if hazir or not _durum["items"]:
            _durum.update(checkedAt=an, items=hazir, brands=sayim)
        _durum["sources"] = kaynak_durum
        kayit = dict(_durum)
    kayit.pop("running", None)
    tmp = VITRIN.with_suffix(".tmp")
    tmp.write_text(json.dumps(kayit, ensure_ascii=False, indent=1), encoding="utf-8")
    tmp.replace(VITRIN)
    log("  vitrin: " + " · ".join(f"{m} {n}" for m, n in sayim.items()))
    # artık vitrinde olmayan, 14 günden eski fotoğrafları sil (klasör şişmesin)
    kullanilan = {Path(u["resim"]).name for u in _durum["items"]}
    for f in RESIM.glob("*"):
        try:
            if f.name not in kullanilan and time.time() - f.stat().st_mtime > 14 * 86400:
                f.unlink()
        except OSError:
            pass


def yukle():
    """Sunucu açılınca son vitrin hemen hazır olsun (tarama arkada sürer)."""
    try:
        d = json.loads(VITRIN.read_text(encoding="utf-8").replace("David Güner", "David Guner"))   # marka adı düzeltmesi (31.10)
        with _lock:
            _durum.update({k: d[k] for k in ("checkedAt", "items", "brands", "sources") if k in d})
    except Exception:
        pass


def durum():
    with _lock:
        d = {k: v for k, v in _durum.items() if k != "running"}
        d["markalar"] = MARKALAR
        d["items"] = [{k: v for k, v in u.items() if k != "kaynak_resim"} for u in d.get("items") or []]
        return d


def dongu(log=print):
    yukle()
    while True:
        try:
            log("⌚ Saat vitrini taranıyor…")
            tara(log)
        except Exception as e:
            log(f"⌚ Saat vitrini taraması hata verdi: {e}")
        time.sleep(TUR)


if __name__ == "__main__":
    yukle()
    tara()
    d = durum()
    print(f"\nBitti: {len(d['items'])} ürün, fotoğraflar saat/resim/ klasöründe.")
    for s in d["sources"]:
        print(f"  {s['marka']:<12} {s['satici']:<17} {s.get('durum')}{' · ' + str(s.get('urun')) + ' ürün' if s.get('urun') is not None else ''}")
