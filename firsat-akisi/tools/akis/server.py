#!/usr/bin/env python3
"""Small local collector for public campaign pages; no credentials or bypasses."""
from __future__ import annotations

import gzip
import hashlib
import html
import json
import os
import sys
import re
import threading
import time
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from html.parser import HTMLParser
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urljoin, urlsplit
from urllib.robotparser import RobotFileParser
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT / "saat"))
import saat_kaynak as SAAT   # Saat Akışı: ana ekran vitrini (/api/saat · saat/resim/)
import kampanya_kesif as KESIF   # Yaşam Rehberi › Çarşı markalarının kampanya sayfaları (kesif.json)
PORT = int(os.environ.get("FIRSAT_PORT") or os.environ.get("PORT") or "8765")   # PORT: barındırma servisleri (Railway, Render, Fly…) verir
STARTED = time.time()
# İnternete açılınca yalnız uygulamanın web dosyaları sunulur (server.py, README, first_seen.json vb. gizli kalır).
WEB_EXT = {".html", ".js", ".css", ".webmanifest", ".png", ".svg", ".ico", ".txt", ".woff2"}
WEB_HIDE = {"/youtube-kaynak-listesi.txt"}
_RESP: dict = {}
POLL_SECONDS = 15 * 60
MAX_PER_SOURCE = 40
SOURCES = [
    ("CarrefourSA", "https://www.carrefoursa.com/kampanyalar", "Market"),
    ("CarrefourSA Ekim kataloğu", "https://www.carrefoursa.com/ekim-kampanya/c/9677", "Market"),
    ("MediaMarkt", "https://www.mediamarkt.com.tr/tr/campaign/kampanyalar", "Teknoloji"),
    ("Boyner", "https://www.boyner.com.tr/kampanya/ekim-indirimleri-x-c23889789", "Giyim"),
    ("ŞOK", "https://www.sokmarket.com.tr/kampanyalar", "Market"),
    ("Migros", "https://www.migros.com.tr/kampanyalar", "Market"),
    ("BİM", "https://www.bim.com.tr/Categories/254/aktuel_urunler.aspx", "Market"),
    ("Amazon Günün Fırsatları", "https://www.amazon.com.tr/b?node=21034466031", "Teknoloji"),
    ("Gratis", "https://www.gratis.com/kampanyalar?tab=gratise-ozel", "Kişisel Bakım"),
    ("LC Waikiki", "https://www.lcwaikiki.com/tr-TR/TR/etiket/erkek-bebek-yuzde-elli-indirim", "Giyim"),
    ("IKEA", "https://www.ikea.com.tr/", "Ev & Yaşam"),
    ("Obilet", "https://www.obilet.com/kampanyalar", "Seyahat"),
    ("İş Bankası", "https://www.isbank.com.tr/kampanyalar", "Banka"),
    ("Türk Hava Yolları", "https://www.turkishairlines.com/tr-tr/kampanyalar/", "Seyahat"),
    ("Shell ClubSmart", "https://www.shell.com.tr/suruculer/shellden-avantajli-kampanyalar/shellde-bos-yok-2026.html", "Akaryakıt"),
    ("Teknosa", "https://www.teknosa.com/kampanyalar", "Teknoloji"),
    ("Watsons", "https://www.watsons.com.tr/kampanyalar", "Kişisel Bakım"),
    ("A101", "https://www.a101.com.tr/kampanyalar", "Market"),
    ("Bonus Kart", "https://www.bonus.com.tr/kampanyalar", "Banka"),
    ("Maximum Kart", "https://www.maximum.com.tr/kampanyalar", "Banka"),
    ("Worldcard", "https://www.worldcard.com.tr/kampanyalar", "Banka"),
    # ── Yerli markalar (yerli-markalar.com listesinden, kampanya sayfası olanlar) ──
    ("Arçelik", "https://www.arcelik.com.tr/kampanyalar", "Beyaz Eşya"),
    ("Beko", "https://www.beko.com.tr/kampanyalar", "Beyaz Eşya"),
    ("Vestel", "https://www.vestel.com.tr/kampanyalar", "Beyaz Eşya"),
    ("Casper", "https://www.casper.com.tr/kampanyalar", "Teknoloji"),
    ("Vatan Bilgisayar", "https://www.vatanbilgisayar.com/kampanyalar/", "Teknoloji"),
    ("Karaca", "https://www.karaca.com/kampanyalar", "Ev & Yaşam"),
    ("English Home", "https://www.englishhome.com/kampanyalar", "Ev & Yaşam"),
    ("Sarar", "https://www.sarar.com/kampanyalar", "Giyim"),
    ("Koton", "https://www.koton.com/kampanyalar", "Giyim"),
    ("DeFacto", "https://www.defacto.com.tr/kampanyalar", "Giyim"),
    ("Mavi", "https://www.mavi.com/kampanyalar", "Giyim"),
    ("Ziraat Bankkart", "https://www.bankkart.com.tr/kampanyalar", "Banka"),
    ("VakıfBank", "https://www.vakifkart.com.tr/kampanyalar", "Banka"),
    ("Pegasus", "https://www.flypgs.com/kampanyali-ucak-biletleri", "Seyahat"),
    ("Koçtaş", "https://www.koctas.com.tr/kampanyalar", "Ev & Yaşam"),
    ("Hepsiburada", "https://www.hepsiburada.com/kampanyalar", "Pazaryeri"),
    # ── Resmî kulüp mağazaları (Fenerium ve TS Club otomatik okumaya kapalı; seçilmiş kayıtlarla izleniyor) ──
    ("GS Store", "https://www.gsstore.org/gs-garaj/", "Taraftar"),
    ("Kartal Yuvası", "https://www.kartalyuvasi.com.tr/indirim", "Taraftar"),
    # ── Gezmesi keyifli mağazalar ──
    ("Mudo", "https://www.mudo.com.tr/kampanyalar", "Ev & Yaşam"),
    ("Tchibo", "https://www.tchibo.com.tr/", "Ev & Yaşam"),
    ("Decathlon", "https://www.decathlon.com.tr/deals/indirimler", "Spor"),
    ("Sephora", "https://www.sephora.com.tr/sephora-kampanyalar.html", "Kişisel Bakım"),
    ("Rossmann", "https://www.rossmann.com.tr/kampanyalar", "Kişisel Bakım"),
    ("Paribu Cineverse", "https://www.paribucineverse.com/kampanyalar", "Eğlence"),
    ("Domino's", "https://www.dominos.com.tr/kampanyalar", "Yemek"),
    ("Penti", "https://www.penti.com/kampanyalar", "Giyim"),
    ("Toyzz Shop", "https://www.toyzzshop.com/kampanyalar", "Hobi & Oyuncak"),
    ("Doğtaş", "https://www.dogtas.com/kampanyalar", "Ev & Yaşam"),
    # ── Geniş tarama: banka, pazaryeri, seyahat ve ürün listesi sayfaları ──
    ("Axess", "https://www.axess.com.tr/kampanyalar", "Banka"),
    ("QNB Card", "https://www.qnbcard.com.tr/kampanyalar", "Banka"),
    ("n11", "https://www.n11.com/kampanyalar", "Pazaryeri"),
    ("Çiçeksepeti", "https://www.ciceksepeti.com/kampanyalar", "Pazaryeri"),
    ("Pazarama", "https://www.pazarama.com/kampanyalar", "Pazaryeri"),
    ("Yemeksepeti", "https://www.yemeksepeti.com/kampanyalar", "Yemek"),
    ("Enuygun", "https://www.enuygun.com/kampanyalar/", "Seyahat"),
    ("ETS Tur", "https://www.etstur.com/Kampanyalar", "Seyahat"),
    ("Tatilbudur", "https://www.tatilbudur.com/kampanyalar", "Seyahat"),
    ("IKEA en sevilenler", "https://www.ikea.com.tr/sayfalar/en-sevilenler-simdi-bu-fiyata", "Ev & Yaşam"),
    ("Miniso", "https://www.miniso.com.tr/", "Hobi & Oyuncak"),
    ("adidas", "https://www.adidas.com.tr/tr/indirim", "Spor"),
    ("GS Store sezon sonu", "https://www.gsstore.org/gsgaraj-sezon-sonu-indirimi/", "Taraftar"),
    ("Arçelik küçük ev aletleri", "https://www.arcelik.com.tr/kampanyalar/kucuk-ev-aletleri-kampanyalari/arcelikten-ekim-ayina-ozel-firsatlar-2026", "Ev & Yaşam"),
    ("Vatan outlet", "https://www.vatanbilgisayar.com/outlet/", "Teknoloji"),
    # ── 🤝 Dost vitrini (yayıncının tanıdıkları; kartta rozetle belirtilir) ──
    ("Bitmeden Al Shop", "https://bitmedenalshop.com/", "Ev & Yaşam"),
    ("Ecrou", "https://ecrou.com/", "Giyim"),
    ("Flormar", "https://www.flormar.com.tr/kampanyalar", "Kişisel Bakım"),
    ("Watsons", "https://www.watsons.com.tr/kampanyalar", "Kişisel Bakım"),
    ("Tudors", "https://www.tudors.com/kampanyalar", "Giyim"),
    ("Desa", "https://www.desa.com.tr/kampanyalar", "Takı & Aksesuar"),
    ("İpekyol", "https://www.ipekyol.com.tr/kampanyalar", "Giyim"),
    ("Twist", "https://www.twist.com.tr/kampanyalar", "Giyim"),
    ("Evidea", "https://www.evidea.com/kampanyalar", "Ev & Yaşam"),
    ("Dockers", "https://www.dockers.com.tr/", "Giyim"),
    ("New Balance", "https://www.newbalance.com.tr/indirim", "Spor"),
    ("Lescon", "https://www.lescon.com.tr/", "Spor"),
    ("Columbia", "https://www.columbia.com.tr/indirim", "Spor"),
]
FRIEND_SOURCES = {"Bitmeden Al Shop"}
# Banka kaynaklarından gelen başlıklar hangi kart programına ait?
SOURCE_CARDS = {"Bonus Kart": ["Bonus"], "Maximum Kart": ["Maximum"], "Worldcard": ["World"], "İş Bankası": ["Maximum"],
                "Ziraat Bankkart": ["Bankkart"], "VakıfBank": ["VakıfBank"], "Axess": ["Axess"]}
HEADERS = {
    # Tarayıcı uyumlu biçim; kim olduğumuzu da açıkça söylüyoruz. Engel aşma yok.
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36 FirsatAkisi/2.0",
    "Accept": "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "tr-TR,tr;q=0.9,en;q=0.6",
    "Accept-Encoding": "gzip",
}
OFFER_SIGNAL = re.compile(r"%\s*\d{1,3}|\bindirim\w*|\bbonus\b|maxipuan|worldpuan|chip-?para|\bnakit\s+iade|\bbedava\b|\bücretsiz\b|\balana\b|\bkupon\w*|\bpuan\s+(?:kazan|iade|hediye)|\bhediye\b|\biade\b", re.I)
NOISE = re.compile(r"^(?:kampanyalar?|kampanya detayı|kampanya detaylarının devamını gör|tüm kampanyalar|öne çıkan kampanyalar|banka kampanyaları|ticari kart kampanyaları|pos kampanyaları|kariyer fırsatları|kariyer fırsatı|fırsat alanı|hediye kartı|hediye kartları|hediye fikirleri|şampuanlar?|erkek şampuan|kuru şampuan|bebek & çocuk şampuanları|money indirimli|çoklu indirimler|taksit kampanyaları)$", re.I)
EXCLUDE = re.compile(r"kariyer|hediye\s+kart|hediye\s+fikir|şampuan|kampanya\s+detay|fırsat\s+alanı|indirim\s+kodunu\s+nasıl|ürün\s+güvenliği|iade|değişim|şikayet|kampanya\s+sona\s+ermiştir", re.I)
# “%100 pamuk”, “%100 yerli”, “%100 memnuniyet” gibi ürün/özellik ifadeleri indirim değildir.
MATERIAL = re.compile(r"pamuk|koton|cotton|keten|y[üu]n|ipek|polyester|viskon|likra|elastan|organik|deri\b|doğal|yerli|garanti|memnuniyet|iade|orijinal|\bsaf\b|nem|şeker|kakao|meyve|su geçirmez|geri dönüş|vegan|kaşmir|modal|bambu", re.I)
def plausible_percent(label, m):
    num = re.search(r"\d{1,3}", m.group(0))
    if not num or int(num.group(0)) > 90:
        return False
    after = label[m.start() + num.end(): m.start() + num.end() + 14]   # “%100 pamuk” → “ pamuk”
    return not MATERIAL.search(after)

PERCENT = re.compile(r"%\s*\d{1,3}(?:[.,]\d+)?(?:['’]?(?:ye|ya|e|a))?(?:\s*'?(?:ye|ya|e|a))?\s*(?:varan\s*)?(?:indirim)?", re.I)
# Bozuk okunmuş afiş yazıları: “Twist 'ye 1'ye 'ye İndirim” gibi boşta kalan ekler → başlık atlanır.
ORPHAN_SUFFIX = re.compile(r"(?:^|\s)['’][a-zçğıöşü]{1,4}(?=[\s.,!]|$)", re.I)
REPEATED_SUFFIX = re.compile(r"['’]([a-zçğıöşü]{1,4})\b.*['’]\1\b.*['’]\1\b", re.I)
def garbled(label):
    return bool(ORPHAN_SUFFIX.search(label) or REPEATED_SUFFIX.search(label))

def nice_offer(text):
    """Yayın bandı için: “15.000 TL İndirim” → “15.000 TL indirim”, sondaki boşta rakamı at (“hediye kampanyası 5”)."""
    t = re.sub(r"\b(İNDİRİM|İndirim)\b", "indirim", text)
    t = re.sub(r"\b(HEDİYE|Hediye)\b", "hediye", t)
    t = re.sub(r"\b(BEDAVA|Bedava)\b", "bedava", t)
    t = re.sub(r"\b(VARAN|Varan)\b", "varan", t)
    if not re.search(r"\b(?:al|alana|öde)\s+\d{1,3}$", t, re.I):
        t = re.sub(r"(?<![%\d.,])\s+\d{1,3}$", "", t)      # “… kampanyası 5” → “… kampanyası”
    t = re.sub(r"\s+(?:ve|ile|için|,)$", "", t, flags=re.I)
    return t.strip(" .,:;-")

FREE = re.compile(r"\b\d+\s*alana\s*\d+\s*bedava\b|\b(?:ücretsiz\s+(?:teslimat|kargo|alışveriş)|hediye(?:\s+\w+(?:\s+\w+)?)?|bedava)\b", re.I)
POINTS = re.compile(r"\d[\d.,]*\s*TL(?:['’]?(?:ye|ya)\s*varan)?\s*(?:bonus|maxipuan|worldpuan|chip-?para|puan|nakit\s+iade)", re.I)
AMOUNT_OFF = re.compile(r"\d[\d.,]*\s*TL(?:'ye|’ye)?\s*(?:varan\s*)?(?:ek\s*)?indirim", re.I)
MONTHS = {"ocak": 1, "şubat": 2, "mart": 3, "nisan": 4, "mayıs": 5, "haziran": 6, "temmuz": 7, "ağustos": 8, "eylül": 9, "ekim": 10, "kasım": 11, "aralık": 12}
PARTNERS = [(re.compile(r"\bdefacto\b", re.I), "DeFacto × Obilet", "Giyim"),
            (re.compile(r"\bn11\b", re.I), "n11 × Obilet", "Pazaryeri"),
            (re.compile(r"s\s*sport\s*plus", re.I), "S Sport Plus × Obilet", "Eğlence"),
            (re.compile(r"\b(?:grirent|easygo)\b", re.I), "Araç Kiralama × Obilet", "Oto & Mobilite")]
DATE_DMY = re.compile(r"\b(\d{1,2})[./](\d{1,2})[./](20\d{2})\b")
DATE_TEXT = re.compile(r"\b(\d{1,2})\s+(ocak|şubat|mart|nisan|mayıs|haziran|temmuz|ağustos|eylül|ekim|kasım|aralık)(?:\s+(20\d{2}))?", re.I)
_cache = {"checkedAt": None, "sources": [], "deals": [], "sourceCount": len(SOURCES) + 2}
_last_good = {}      # kaynak adı → son başarılı taramadaki başlıklar
# Kampanyanın ilk görüldüğü an (kalıcı): “en yeni en üstte” sıralaması için. Sunucu yeniden başlasa da korunur.
FIRST_SEEN_FILE = ROOT / "first_seen.json"
try:
    _first_seen = json.loads(FIRST_SEEN_FILE.read_text(encoding="utf-8"))
except Exception:
    _first_seen = {}


def stamp_first_seen(deals):
    now = datetime.now().astimezone()
    # Dosya hiç yoksa ilk taramadaki başlıklar “yeni” sayılmasın: günün başıyla işaretlenir.
    baseline = now.replace(hour=0, minute=0, second=0, microsecond=0).isoformat(timespec="seconds") if not _first_seen else None
    changed = False
    for d in deals:
        if d["id"] not in _first_seen:
            _first_seen[d["id"]] = baseline or now.isoformat(timespec="seconds")
            changed = True
        d["firstSeen"] = _first_seen[d["id"]]
    if changed:
        cutoff = time.time() - 45 * 86400
        for k in [k for k, v in _first_seen.items() if _ts(v) < cutoff]:
            del _first_seen[k]
        try:
            FIRST_SEEN_FILE.write_text(json.dumps(_first_seen, ensure_ascii=False), encoding="utf-8")
        except OSError:
            pass


def _ts(value):
    try:
        return datetime.fromisoformat(value).timestamp()
    except Exception:
        return 0
_robots = {}         # host → RobotFileParser (veya None: robots.txt okunamadı)
ROBOTS_AGENT = "FirsatAkisi"


def robots_allows(url):
    """Sitenin robots.txt kuralına uy: izin vermiyorsa o sayfayı tarama."""
    parts = urlsplit(url)
    host = f"{parts.scheme}://{parts.netloc}"
    if host not in _robots:
        parser = RobotFileParser()
        try:
            with urlopen(Request(host + "/robots.txt", headers=HEADERS), timeout=6) as response:
                raw = response.read(500_000)
                if response.headers.get("Content-Encoding", "").lower() == "gzip":
                    raw = gzip.decompress(raw)
                parser.parse(raw.decode("utf-8", "replace").splitlines())
            _robots[host] = parser
        except Exception:
            _robots[host] = None   # robots.txt yoksa ya da okunamazsa standart gereği izinli sayılır
    parser = _robots[host]
    return parser is None or parser.can_fetch(ROBOTS_AGENT, url)


def parse_end_date(text):
    """Başlıktaki son tarihi yakala: '31.10.2026', '31 Ekim'e kadar', '1-31 Ekim'. Bulamazsa None."""
    now = datetime.now()
    found = []
    for d, m, y in DATE_DMY.findall(text):
        try:
            found.append(datetime(int(y), int(m), int(d)))
        except ValueError:
            pass
    for d, month, y in DATE_TEXT.findall(text.casefold()):
        try:
            found.append(datetime(int(y) if y else now.year, MONTHS[month], int(d)))
        except (ValueError, KeyError):
            pass
    future = [f for f in found if f.date() >= now.date()]
    return max(future).strftime("%Y-%m-%d") if future else None


TR_MONTHS = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"]


def tr_stamp():
    now = datetime.now()
    return f"{now.day:02d} {TR_MONTHS[now.month - 1]} {now.year} {now:%H:%M}"


PRICE = re.compile(r"₺\s*(\d{1,3}(?:\.\d{3})*(?:,\d{1,2})?)|(\d{1,3}(?:\.\d{3})*(?:,\d{1,2})?)\s*(?:TL|₺)", re.I)


def tr_number(text):
    return float(text.replace(" ", "").replace(".", "").replace(",", "."))


def price_pair(label):
    """Ürün kartında “349,00 TL 139,00 TL” gibi eski→yeni fiyat ikilisi varsa yakala."""
    # “2.000 TL ve üzeri alışverişe 400 TL” bir kampanya koşuludur, ürün fiyatı değil.
    if re.search(r"üzeri|alışveriş|harcama|sepette|varan|kazan|puan|bonus|chip|hediye|taksit|her\s+\d", label, re.I):
        return None
    amounts = []
    for m in PRICE.finditer(label):
        raw = m.group(1) or m.group(2)
        try:
            amounts.append(tr_number(raw))
        except ValueError:
            pass
    if len(amounts) < 2:
        return None
    old, new = max(amounts[:3]), amounts[-1]
    if not (0 < new < old):
        return None
    pct = round((1 - new / old) * 100)
    if not 5 <= pct <= 90:
        return None
    title = PRICE.sub("", label)
    title = re.sub(r"%\s*\d{1,3}|\b\d{1,3}\s*%|[-–]\s*%?\d{1,2}\b|sepete ekle|indirimli|incele", "", title, flags=re.I)
    title = re.sub(r"\s{2,}", " ", title).strip(" ·|-–,")
    if len(title) < 8:
        return None
    return {"title": title, "old": old, "new": new, "pct": pct}


def stable_id(*parts):
    return "live-" + hashlib.sha1("|".join(parts).encode("utf-8")).hexdigest()[:12]
_lock = threading.Lock()


class LinkParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.links = []
        self._href = None
        self._text = []
        self._skip = 0

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag in ("script", "style", "svg", "noscript"):
            self._skip += 1
        if tag == "a" and attrs.get("href"):
            self._href, self._text = attrs["href"], []

    def handle_endtag(self, tag):
        if tag in ("script", "style", "svg", "noscript") and self._skip:
            self._skip -= 1
        if tag == "a" and self._href:
            label = re.sub(r"\s+", " ", " ".join(self._text)).strip()
            if label:
                self.links.append((self._href, label))
            self._href, self._text = None, []

    def handle_data(self, data):
        if self._href and not self._skip:
            self._text.append(data)


def fetch_source(name, url, category):
    started = time.monotonic()
    try:
        if not robots_allows(url):
            return {"name": name, "url": url, "ok": False, "items": 0, "error": "robots.txt bu sayfanın taranmasına izin vermiyor"}, []
        req = Request(url, headers=HEADERS)
        with urlopen(req, timeout=12) as response:
            raw = response.read(3_000_000)
            if response.headers.get("Content-Encoding", "").lower() == "gzip":
                raw = gzip.decompress(raw)
            charset = response.headers.get_content_charset() or "utf-8"
            body = raw.decode(charset, "replace")
            final_url = response.geturl()
        parser = LinkParser()
        parser.feed(body)
        found, seen = [], set()
        for href, label in parser.links:
            label = html.unescape(label)
            label = re.split(r"\s*(?:Bitiş Tarihi\s*:|Son Gün\s*:|Kampanya detaylarının devamını gör)\s*", label, maxsplit=1, flags=re.I)[0].strip()
            key = (label.lower(), href)
            pair = price_pair(label)
            if key in seen or len(label) < 8 or NOISE.fullmatch(label) or EXCLUDE.search(label) or not (OFFER_SIGNAL.search(label) or pair):
                continue
            if garbled(label):
                continue
            if pair:
                label = pair["title"]
            # Campaign/category navigation is not itself a deal. Require an actual
            # discount, free item, giveaway, or points/cashback promise in the title.
            if re.search(r"\b(?:puan|iade)\b", label, re.I) and not re.search(r"\b(?:kazan|hediye|iade|indirim)\w*\b", label, re.I):
                continue
            if category == "Banka" and re.search(r"faiz|ek hesap|kredi|kasko|yatırım fon|para transferi|para çekme|havale|eft|fast işlemi|bankamatik", label, re.I):
                continue
            if re.search(r"bu kampanya sona ermiştir|kampanya sona erdi|süresi doldu", label, re.I):
                continue
            months = re.findall(r"\b(?:ocak|şubat|mart|nisan|mayıs|haziran|temmuz|ağustos|eylül|ekim|kasım|aralık)\b", label.casefold())
            # Yalnız geçmiş aylara ait başlıkları ele; “3 Kasım’a kadar” gibi ileri tarihliler kalsın.
            current = datetime.now().month
            if months and all((MONTHS[month] - current) % 12 > 6 for month in months):
                continue
            seen.add(key)
            # Avoid menus and generic category navigation; preserve source text verbatim.
            if len(label) > 180:
                label = label[:177].rstrip() + "…"
            pct_match = next((m for m in PERCENT.finditer(label) if plausible_percent(label, m)), None)
            bad_pct = PERCENT.search(label) and not pct_match
            offer_match = pct_match or POINTS.search(label) or AMOUNT_OFF.search(label) or FREE.search(label)
            display_offer = nice_offer(offer_match.group(0)) if offer_match else ("Seçili ürünlerde fırsat" if bad_pct else "FIRSAT · KOŞULLARI AÇ")
            if pair and 0 < pair['pct'] <= 90:
                display_offer = f"%{pair['pct']} indirim"
            deal_store, deal_category = name, category
            if name == "Obilet":
                for matcher, partner, partner_category in PARTNERS:
                    if matcher.search(label):
                        deal_store, deal_category = partner, partner_category
                        break
            title_lower = label.casefold()
            if re.search(r"kedi|köpek|evcil hayvan|mama", title_lower): deal_category = "Evcil Hayvan"
            elif re.search(r"bebek|çocuk|prima|molfix|bez", title_lower): deal_category = "Anne & Bebek"
            elif re.search(r"s\s*sport\s*plus", title_lower): deal_category = "Eğlence"
            elif re.search(r"koşu|fitness|\bspor\b|adidas|reebok|nike", title_lower): deal_category = "Spor"
            elif re.search(r"küçük ev aleti|beyaz eşya|blender|mutfak yardımcı|mobilya|ev tekstil", title_lower): deal_category = "Ev & Yaşam"
            elif category == "Beyaz Eşya" and re.search(r"\btv\b|televizyon|elektronik|yazar kasa|\binc\b|inç", title_lower): deal_category = "Teknoloji"
            elif category == "Beyaz Eşya" and re.search(r"espresso|kahve|süpürge|küçük ev|airfryer|ütü\b", title_lower): deal_category = "Ev & Yaşam"
            elif category == "Banka":
                if re.search(r"market|gıda|süpermarket", title_lower): deal_category = "Market"
                elif re.search(r"giyim|ayakkabı|çanta|moda", title_lower): deal_category = "Giyim"
                elif re.search(r"akaryakıt|petrol|shell|opet|\bbp\b|aytemiz", title_lower): deal_category = "Akaryakıt"
                elif re.search(r"otel|uçak|uçuş|tatil|tur\b|seyahat", title_lower): deal_category = "Seyahat"
                elif re.search(r"e-?ticaret|amazon|hepsiburada|trendyol|pazarama|n11", title_lower): deal_category = "Pazaryeri"
                elif re.search(r"restoran|yemek", title_lower): deal_category = "Yemek"
                elif re.search(r"veteriner|petshop", title_lower): deal_category = "Evcil Hayvan"
            icon = {"Market": "🛒", "Teknoloji": "⚡", "Giyim": "👕", "Kişisel Bakım": "✨", "Ev & Yaşam": "🏠", "Seyahat": "✈️", "Akaryakıt": "⛽", "Banka": "💳", "Anne & Bebek": "🍼", "Evcil Hayvan": "🐾", "Spor": "🏃", "Eğlence": "🎬", "Oto & Mobilite": "🚗", "Pazaryeri": "🛍️", "Taraftar": "⚽", "Hobi & Oyuncak": "🧸", "Takı & Aksesuar": "💍", "Yemek": "🍔", "Oyun": "🎮"}.get(deal_category, "🎟️")
            found.append({"id": stable_id(name, href, label), "store": deal_store, "end": parse_end_date(label), "cards": SOURCE_CARDS.get(name, []), "title": label,
                          "category": deal_category, "offer": display_offer, "detail": f"{name} kampanya sayfasından canlı alınan başlık. Güncel fiyat, stok ve koşulları mağaza sayfasında doğrulayın.",
                          "ending": "Kaynak sayfasını kontrol et", "urgency": "CANLI KAMPANYA", "emoji": icon,
                          "url": urljoin(final_url, href), "source": name + " resmî kampanya sayfası",
                          "verified": tr_stamp(), "type": "percent", "live": True,
                          **({"oldPrice": pair["old"], "newPrice": pair["new"]} if pair else {}),
                          **({"friend": True} if name in FRIEND_SOURCES else {})})
            if len(found) >= MAX_PER_SOURCE:
                break
        return {"name": name, "url": url, "ok": True, "items": len(found), "elapsedMs": int((time.monotonic()-started)*1000)}, found
    except Exception as exc:
        return {"name": name, "url": url, "ok": False, "items": 0, "error": str(exc)[:180]}, []


def fetch_json(url):
    if not robots_allows(url):
        raise PermissionError("robots.txt izin vermiyor")
    with urlopen(Request(url, headers=dict(HEADERS, Accept="application/json")), timeout=15) as response:
        raw = response.read(8_000_000)
        if response.headers.get("Content-Encoding", "").lower() == "gzip":
            raw = gzip.decompress(raw)
    return json.loads(raw.decode("utf-8", "replace"))


def parse_steam(data):
    """Steam “özel teklifler” arama sonucu: oyun adı, indirim oranı, eski/yeni fiyat (Türkiye bölgesi USD)."""
    items = []
    for row in re.split(r"(?=<a href=\"https://store\.steampowered\.com/(?:app|bundle|sub)/)", data.get("results_html", "")):
        url = re.search(r'href="(https://store\.steampowered\.com/(?:app|bundle|sub)/[^"?]+)', row)
        name = re.search(r'<span class="title">(.*?)</span>', row, re.S)
        pct = re.search(r'discount_pct">\s*-?(\d{1,3})%', row)
        old = re.search(r'discount_original_price">([^<]+)<', row)
        new = re.search(r'discount_final_price">([^<]+)<', row)
        if not (url and name and pct):
            continue
        title = html.unescape(name.group(1)).strip()
        price = f"{old.group(1).strip()} → {new.group(1).strip()}" if old and new else ""
        items.append({"title": f"{title}" + (f" · {price}" if price else ""), "offer": f"%{pct.group(1)} indirim", "url": url.group(1),
                      "pct": int(pct.group(1)), "end": None})
    return items


def parse_epic(data):
    """Epic Games: şu an ücretsiz/indirimli oyunlar ve yaklaşan ücretsiz oyunlar (tarihleriyle)."""
    items, now = [], datetime.now(timezone.utc)
    elements = (((data or {}).get("data") or {}).get("Catalog") or {}).get("searchStore", {}).get("elements", []) or []
    for el in elements:
        promos = el.get("promotions") or {}
        price = ((el.get("price") or {}).get("totalPrice") or {})
        original, discounted = price.get("originalPrice") or 0, price.get("discountPrice")
        fmt = price.get("fmtPrice") or {}
        mappings = (el.get("catalogNs") or {}).get("mappings") or el.get("offerMappings") or []
        slug = el.get("productSlug") or (mappings[0].get("pageSlug") if mappings else None) or el.get("urlSlug")
        url = f"https://store.epicgames.com/tr/p/{slug}" if slug else "https://store.epicgames.com/tr/free-games"
        for bucket, upcoming in (("promotionalOffers", False), ("upcomingPromotionalOffers", True)):
            for group in promos.get(bucket) or []:
                for offer in group.get("promotionalOffers") or []:
                    try:
                        start = datetime.fromisoformat(offer["startDate"].replace("Z", "+00:00"))
                        end = datetime.fromisoformat(offer["endDate"].replace("Z", "+00:00"))
                    except (KeyError, ValueError):
                        continue
                    if end < now or (not upcoming and start > now):
                        continue
                    pct_paid = (offer.get("discountSetting") or {}).get("discountPercentage")
                    free = pct_paid == 0 or (not upcoming and discounted == 0)
                    if upcoming and not free:
                        continue
                    if free:
                        offer_text = "ÜCRETSİZ"
                    elif original and discounted is not None:
                        offer_text = f"%{round((1 - discounted / original) * 100)} indirim"
                    else:
                        continue
                    old_txt = fmt.get("originalPrice")
                    items.append({"title": f"{el.get('title', 'Oyun')}" + (f" · normalde {old_txt}" if free and old_txt and old_txt not in ("0", "₺0,00") else ""),
                                  "offer": offer_text, "url": url, "pct": 100 if free else 0,
                                  "start": start.astimezone().strftime("%Y-%m-%d") if upcoming else None,
                                  "end": end.astimezone().strftime("%Y-%m-%d")})
    return items


API_SOURCES = [
    ("Steam", "https://store.steampowered.com/search/results/?specials=1&infinite=1&cc=tr&l=turkish&count=100&start=0", "Oyun", parse_steam),
    ("Epic Games", "https://store-site-backend-static.ak.epicgames.com/freeGamesPromotions?locale=tr&country=TR&allowCountries=TR", "Oyun", parse_epic),
]


def fetch_api(name, url, category, parser):
    started = time.monotonic()
    try:
        items = parser(fetch_json(url))[:100]
        found = []
        for it in items:
            found.append({"id": stable_id(name, it["url"], it["title"]), "store": name, "title": it["title"], "category": category,
                          "offer": it["offer"], "end": it.get("end"), "start": it.get("start"), "cards": [],
                          "detail": f"{name} mağazasından otomatik alınan fiyat. Bölgesel fiyat ve süre mağazada değişebilir.",
                          "urgency": "CANLI KAMPANYA", "emoji": "🎮", "url": it["url"], "source": f"{name} resmî mağazası",
                          "verified": tr_stamp(), "type": "gift" if it.get("pct") == 100 else "percent", "live": True})
        return {"name": name, "url": url, "ok": True, "items": len(found), "elapsedMs": int((time.monotonic()-started)*1000)}, found
    except Exception as exc:
        return {"name": name, "url": url, "ok": False, "items": 0, "error": str(exc)[:180]}, []


def refresh():
    # Çarşı markalarının keşfedilen kampanya sayfaları da taranır (aynı adla elle eklenmiş kaynak varsa o kalır)
    names = {n.casefold() for n, _, _ in SOURCES}
    extra = [src for src in KESIF.kaynaklar() if src[0].casefold() not in names]
    jobs = [(fetch_source, src) for src in SOURCES + extra] + [(fetch_api, src) for src in API_SOURCES]
    with ThreadPoolExecutor(max_workers=24) as pool:
        results = list(pool.map(lambda job: job[0](*job[1]), jobs))
    source_status, merged = [], []
    for status, items in results:
        name = status["name"]
        if status["ok"] and items:
            _last_good[name] = items
        elif not status["ok"] and _last_good.get(name):
            # Kaynak bu turda yanıt vermedi: son başarılı taramayı “son kontrolde” olarak koru.
            items = [dict(item, cached=True) for item in _last_good[name]]
            status = dict(status, items=len(items), cached=True)
        source_status.append(status)
        merged.append(items)
    all_deals, seen = [], set()
    for items in merged:
        for item in items:
            key = (item["title"].casefold(), item["url"])
            if key not in seen:
                seen.add(key)
                all_deals.append(item)
    stamp_first_seen(all_deals)
    with _lock:
        _cache.update(checkedAt=datetime.now().astimezone().isoformat(timespec="seconds"), sources=source_status, deals=all_deals, sourceCount=len(SOURCES) + len(extra) + len(API_SOURCES), carsi=KESIF.ozet())


def refresher():
    while True:
        refresh()
        time.sleep(POLL_SECONDS)


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def json(self, build, code=200, key=None):
        # 5 sn önbellek + gzip: çok izleyicide ve telefon uygulamasında yükü düşürür.
        now = time.time()
        hit = key and _RESP.get(key)
        if hit and now - hit[0] < 5:
            body, gz = hit[1], hit[2]
        else:
            body = json.dumps(build() if callable(build) else build, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
            gz = gzip.compress(body, 6)
            if key:
                _RESP[key] = (now, body, gz)
        use_gz = "gzip" in (self.headers.get("Accept-Encoding") or "")
        out = gz if use_gz else body
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        if use_gz:
            self.send_header("Content-Encoding", "gzip")
            self.send_header("Vary", "Accept-Encoding")
        self.send_header("Content-Length", str(len(out)))
        self.end_headers()
        self.wfile.write(out)

    def do_GET(self):
        path = self.path.split("?", 1)[0]
        if path == "/api/deals":
            def build():
                with _lock:
                    return dict(_cache)
            return self.json(build, key="deals")
        if path == "/api/hata":   # yayın sayfalarından gelen JS hataları (OBS içinde konsol görünmüyor)
            from urllib.parse import parse_qs
            q = parse_qs(self.path.split("?", 1)[1] if "?" in self.path else "")
            print(f"⚠️  Sayfa hatası [{(q.get('k') or ['?'])[0][:20]}]: {(q.get('m') or [''])[0][:600]}", flush=True)
            self.send_response(204)
            self.end_headers()
            return
        if path == "/api/saat":
            return self.json(SAAT.durum, key="saat")
        if path.startswith("/saat/resim/"):
            name = path.rsplit("/", 1)[-1]
            ext = Path(name).suffix.lower()
            file = SAAT.RESIM / name
            if "/" in path[12:] or ".." in name or ext not in SAAT.UZANTI.values() or not file.is_file():
                self.send_error(404)
                return
            body = file.read_bytes()
            self.send_response(200)
            self.send_header("Content-Type", {v: k for k, v in SAAT.UZANTI.items()}[ext])
            self.send_header("Content-Length", str(len(body)))
            self.send_header("X-Saat", "1")
            self.end_headers()
            self.wfile.write(body)
            return
        if path == "/api/refresh":
            if time.time() - _RESP.get("_refresh", 0) > 30:   # herkese açık sunucuda sık tetiklenmesin
                _RESP["_refresh"] = time.time()
                threading.Thread(target=refresh, daemon=True).start()
            return self.json({"refreshing": True}, 202)
        if path == "/saglik":
            with _lock:
                ok = {"ok": True, "checkedAt": _cache.get("checkedAt"), "deals": len(_cache.get("deals") or []),
                      "sources": _cache.get("sourceCount"), "uptimeMin": int((time.time() - STARTED) // 60)}
            return self.json(ok)
        if path == "/favicon.ico":
            self.send_response(204)
            self.end_headers()
            return
        if path == "/":
            self.path = "/index.html" + (self.path[1:] if self.path.startswith("/?") else "")
            path = "/index.html"
        name = path.rsplit("/", 1)[-1]
        if path in WEB_HIDE or name.startswith(".") or Path(path).suffix.lower() not in WEB_EXT or ".." in path:
            self.send_error(404)
            return
        return super().do_GET()

    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")   # telefon uygulaması başka adresten çağırabilsin
        # Tarayıcı eski sayfa dosyalarını önbellekten göstermesin; her açılışta güncel sürüm gelsin.
        if self.path.startswith("/api/"):
            self.send_header("Cache-Control", "no-store")
        elif self.path.startswith("/saat/resim/"):
            self.send_header("Cache-Control", "public, max-age=86400")   # fotoğraf adı içeriğe göre; değişmez
        else:
            self.send_header("Cache-Control", "no-cache, must-revalidate")
        super().end_headers()

    def log_message(self, fmt, *args):
        # /api/deals her dakika çağrılır; terminali boğmasın.
        line = args[0] if args else ""
        if isinstance(line, str) and ("/api/deals" in line or "/saglik" in line or "/api/saat" in line or "/saat/resim/" in line):
            return
        super().log_message(fmt, *args)


if __name__ == "__main__":
    try:
        # 0.0.0.0: aynı Wi-Fi'deki telefondan da açılır (http://<Mac'in yerel IP'si>:8765)
        server = ThreadingHTTPServer(("0.0.0.0", PORT), Handler)
    except OSError:
        print(f"\n⚠️  {PORT} portu dolu. Eski sunucuyu kapatmak için:  kill $(lsof -t -i:{PORT})\n", file=sys.stderr)
        sys.exit(3)   # yayin-7-24.sh bu kodu görünce döngüyü durdurur
    threading.Thread(target=refresher, daemon=True).start()
    SAAT.yukle()   # son vitrin hemen hazır; tarama arkada
    def kesif_dongu():
        time.sleep(90)   # önce fırsat ve saat taramaları ısınsın
        while True:
            try:
                KESIF.kesfet(HEADERS, robots_allows, [n for n, _, _ in SOURCES], log=lambda m: print(m, flush=True))
            except Exception as e:
                print(f"🔎 Kampanya keşfi hata verdi: {e}", flush=True)
            time.sleep(24 * 3600)
    def wiki_dongu():
        time.sleep(240)
        while True:
            try:
                import wiki_dogrula
                wiki_dogrula.tur(log=lambda m: print(m, flush=True))   # yalnız bekleyenler, haftada bir yeniden
            except Exception as e:
                print(f"📚 Wikidata doğrulaması hata verdi: {e}", flush=True)
            time.sleep(24 * 3600)
    if os.environ.get("KESIF", "1") != "0":
        threading.Thread(target=kesif_dongu, daemon=True).start()
        threading.Thread(target=wiki_dongu, daemon=True).start()
    if os.environ.get("SAAT", "1") != "0":
        threading.Thread(target=SAAT.dongu, daemon=True).start()
    base = f"http://127.0.0.1:{PORT}"
    print(
        f"\n🐿️  Fırsat Akışı hazır\n"
        f"   Uygulama : {base}\n"
        f"   Yayın    : {base}/?yayin=1  (OBS tarayıcı kaynağı 1920×1080 · menajer görünümü)\n"
        f"   Klasik   : {base}/?yayin=1&gorunum=klasik\n"
        f"   Kontrol  : {base}/?yayin=1&sahne=genel  (puan · istatistik · danisman · kadro · kupa · fikstur · lig · gol · yol · labirent)\n"
        f"   Saat     : {base}/saat.html  (ana ekran vitrini · veri {base}/api/saat, 6 saatte bir)\n"
        f"   Katman   : {base}/?katman=hepsi  (kamera üstü · kart · bant · flas · dikey 1080×1920)\n"
        f"   Sağlık   : {base}/saglik\n"
        f"   Tarama   : {len(SOURCES) + len(API_SOURCES)} kaynak, {POLL_SECONDS // 60} dakikada bir\n"
        f"   Kapatmak : Ctrl+C\n", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nFırsat Akışı kapatıldı.")
        server.server_close()
