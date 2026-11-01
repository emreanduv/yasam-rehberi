#!/usr/bin/env python3
"""Fırsat Akışı veri hattı — GitHub Actions'ta zamanlanmış çalışır (ücretsiz).

1) tools/secili.json   seçilmiş kampanyalar + marka dizini (node tools/secili.mjs üretir; kaynak/ = yayındaki dosyalar)
2) tools/akis/server.py  yayındaki canlı tarayıcının bir turu (mağaza ve banka kampanya sayfaları, robots.txt'ye uyar)
3) tools/katalog.py    market katalogları (zincir, katalog adı, tarih, bağlantı)
→ <hedef>/firsat.json  uygulamanın okuduğu sade biçim (varsayılan hedef: ./veri)

Bir kaynak o tur ulaşılamazsa önceki turun başlıkları korunur; bu tur çok az canlı başlık geldiyse
(siteler GitHub'ı engelledi vb.) önceki turun canlı başlıkları kullanılır, uygulama boşalmaz.
Kullanım: python3 tools/veri_guncelle.py [hedef_klasör]
"""
from __future__ import annotations

import json
import re
import sys
import types
from datetime import datetime, date
from pathlib import Path
from zoneinfo import ZoneInfo

ARAC = Path(__file__).resolve().parent
KOK = ARAC.parent
TR = ZoneInfo("Europe/Istanbul")
hedef = Path(sys.argv[1] if len(sys.argv) > 1 else "veri").resolve()
hedef.mkdir(parents=True, exist_ok=True)

# yayındaki sunucu saat vitrinini de içe aktarıyor; burada gerekmiyor → boş modül
sys.modules["saat_kaynak"] = types.ModuleType("saat_kaynak")
sys.path.insert(0, str(ARAC / "akis"))
sys.path.insert(0, str(ARAC))
import server as S  # noqa: E402
import katalog  # noqa: E402

S.FIRST_SEEN_FILE = hedef / "first_seen.json"
try:
    S._first_seen.clear()
    S._first_seen.update(json.loads(S.FIRST_SEEN_FILE.read_text(encoding="utf-8")))
except Exception:
    pass

bugun = datetime.now(TR).date()
simdi = datetime.now(TR).isoformat(timespec="seconds")

# ── 1) seçilmiş kampanyalar ──
secili = json.loads((ARAC / "secili.json").read_text(encoding="utf-8"))

# ── 2) canlı tarama ──
print("Canlı tarama…", flush=True)
S.refresh()
canli = [d for d in S._cache.get("deals", []) if d.get("title")]
kaynaklar = list(S._cache.get("sources", []))
print(f"  {len(canli)} canlı başlık · {sum(1 for s in kaynaklar if s.get('ok'))}/{len(kaynaklar)} kaynak", flush=True)

# ── 3) market katalogları ──
print("Market katalogları…", flush=True)
try:
    kataloglar, kdurum = katalog.tara(S.HEADERS, S.robots_allows, bugun, log=lambda m: print(m, flush=True))
except Exception as e:  # noqa: BLE001
    kataloglar, kdurum = [], {"name": "Market katalogları", "ok": False, "items": 0, "error": str(e)[:160]}
kaynaklar.append(kdurum)
print(f"  {len(kataloglar)} katalog · {kdurum.get('error', 'tamam')}", flush=True)

# güvenlik: bu tur canlı başlık çok azsa önceki turunkiler kullanılır
onceki_yol = hedef / "firsat.json"
if not onceki_yol.exists():
    onceki_yol = KOK / "www" / "data" / "firsat.json"
try:
    onceki = json.loads(onceki_yol.read_text(encoding="utf-8"))
except Exception:
    onceki = {}
onceki_canli = [x for x in onceki.get("items", []) if x.get("live")]
if onceki_canli and len(canli) < len(onceki_canli) * 0.4:
    print(f"::warning::Bu tur {len(canli)} canlı başlık geldi (önceki {len(onceki_canli)}); önceki turunkiler korunuyor")
    canli = None
onceki_kat = [x for x in onceki.get("items", []) if x.get("katalog") and (not x.get("end") or x["end"] >= bugun.isoformat())]
if not kataloglar and onceki_kat:
    kataloglar = None

# ── yerli / yabancı (yayındaki app.js ile aynı kural) ──
def trl(s):
    return str(s or "").replace("I", "ı").replace("İ", "i").lower()


def kelime(adlar):
    adlar = sorted({trl(a) for a in adlar if a}, key=len, reverse=True)
    return re.compile(r"(?:^|[^\w])(" + "|".join(re.escape(a) for a in adlar) + r")(?=$|[^\w])") if adlar else None


MARKALAR = [dict(m, re=kelime([m["n"], *m.get("a", [])])) for m in secili["markalar"] if not m.get("off")]
KART_BANKA = {"Maximum": "Türkiye İş Bankası", "World": "Yapı Kredi", "Axess": "Akbank", "Bankkart": "Ziraat Bankası", "Paraf": "Halkbank", "VakıfBank": "VakıfBank"}
YABANCI = kelime(["MediaMarkt", "Watsons", "Shell", "Amazon", "IKEA", "Tchibo", "Decathlon", "Nike", "adidas", "Sephora", "Rossmann", "Domino's", "Domino’s",
                  "Miniso", "Pandora", "Steam", "GeForce NOW", "Epic Games", "Dockers", "Converse", "Levi’s", "Levi's", "New Balance", "PUMA", "Columbia",
                  "Lacoste", "Vans", "Hummel", "Metro", "TEDi"])


def yerli(d):
    magaza, baslik = trl(d.get("store")), trl(d.get("title"))
    kart = {KART_BANKA.get(c) for c in d.get("cards") or []}
    return any(m["re"] and (m["n"] in kart or m["re"].search(magaza) or (m.get("t") and m["re"].search(baslik))) for m in MARKALAR)


BOLUM = {"Market": "market", "Kişisel Bakım": "bakim", "Yemek": "yemek", "Ev & Yaşam": "ev", "Beyaz Eşya": "ev", "Giyim": "giyim", "Spor": "giyim",
         "Takı & Aksesuar": "giyim", "Taraftar": "giyim", "Teknoloji": "teknoloji", "Oyun": "teknoloji", "Pazaryeri": "teknoloji", "Banka": "kart",
         "Seyahat": "gezi", "Oto & Mobilite": "gezi", "Akaryakıt": "gezi", "Eğlence": "eglence", "Hobi & Oyuncak": "cocuk", "Çocuk": "cocuk",
         "Anne & Bebek": "cocuk", "Evcil Hayvan": "ev"}
GENEL = re.compile(r"FIRSAT\s*·\s*KOŞULLARI AÇ", re.I)
ALAN = ("id", "store", "title", "headline", "offer", "detail", "category", "start", "end", "endGuess", "cards", "channels", "how", "conditions",
        "url", "source", "emoji", "oldPrice", "newPrice", "katalog")


def sade(d, tur):
    x = {k: d[k] for k in ALAN if d.get(k) not in (None, "", [])}
    if GENEL.search(x.get("offer", "")):
        x["offer"] = "Kampanya"
    x["store"] = re.sub(r"\s+Ekim kataloğu$", "", x.get("store", ""), flags=re.I)
    x["bolum"] = BOLUM.get(d.get("category"), "diger")
    x["t"] = d.get("firstSeen") or d.get("added") or (d.get("start") and d["start"] + "T00:00:00+03:00") or ((d.get("checked") or "2026-01-01") + "T00:00:00+03:00")
    if yerli(d):
        x["yerli"] = 1
    elif YABANCI.search(trl(d.get("store"))):
        x["yabanci"] = 1
    if tur == "canli":
        x["live"] = 1
        x.pop("detail", None)        # canlı başlıkların açıklaması kalıp metin; uygulama kendisi yazar
    return x


items, gorulen, basliklar = [], set(), set()


def ekle(liste, tur):
    for d in liste:
        if d.get("end") and d["end"] < bugun.isoformat():
            continue
        baslik = str(d.get("title", "")).casefold()
        anahtar = (baslik, d.get("url", ""))
        if anahtar in gorulen or (tur in ("canli", "onceki") and baslik in basliklar):
            continue
        gorulen.add(anahtar)
        basliklar.add(baslik)
        items.append(d if tur == "onceki" else sade(d, tur))


ekle(secili["deals"], "secili")
if kataloglar is None:
    ekle(onceki_kat, "onceki")
else:
    ekle(kataloglar, "katalog")
if canli is None:
    ekle(onceki_canli, "onceki")
else:
    ekle(canli, "canli")

cikti = {
    "checkedAt": simdi,
    "kaynak": {"ok": sum(1 for s in kaynaklar if s.get("ok")), "toplam": len(kaynaklar),
               "yanit_yok": sorted({s["name"] for s in kaynaklar if not s.get("ok")})[:40]},
    "items": items,
}
(hedef / "firsat.json").write_text(json.dumps(cikti, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
say = {}
for x in items:
    say[x["bolum"]] = say.get(x["bolum"], 0) + 1
print(f"firsat.json: {len(items)} kampanya · {sum(1 for x in items if x.get('live'))} canlı · {sum(1 for x in items if x.get('katalog'))} katalog · "
      f"{sum(1 for x in items if x.get('yerli'))} 🇹🇷 · {say} · {simdi}")
gunluk = {}
for x in items:
    if x["bolum"] in ("market", "bakim", "yemek"):
        gunluk[x["store"]] = gunluk.get(x["store"], 0) + 1
print("günlük ihtiyaç mağazaları:", dict(sorted(gunluk.items(), key=lambda kv: -kv[1])))
print("yanıt vermeyen:", ", ".join(cikti["kaynak"]["yanit_yok"]))

