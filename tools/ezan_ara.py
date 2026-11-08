"""Wikimedia Commons'ta özgür lisanslı ezan kayıtlarını listeler (GitHub Actions'tan): lisans, süre, boyut, yazar."""
import json, re, sys, urllib.parse, urllib.request
API = "https://commons.wikimedia.org/w/api.php"
UA = {"User-Agent": "YasamRehberi/1.3 (Mr. Anduv!; github.com/emreanduv/yasam-rehberi)"}
def q(**p):
    p.update(format="json")
    with urllib.request.urlopen(urllib.request.Request(API + "?" + urllib.parse.urlencode(p), headers=UA), timeout=60) as r:
        return json.load(r)
basliklar = set()
for terim in ["adhan", "azan", "ezan", "adhaan", "call to prayer", "athan", "ezan sesi"]:
    for x in q(action="query", list="search", srsearch=f"{terim} filetype:audio", srnamespace=6, srlimit=50)["query"]["search"]:
        basliklar.add(x["title"])
for kat in ["Category:Adhan", "Category:Audio files of adhan", "Category:Adhan audio"]:
    try:
        for x in q(action="query", list="categorymembers", cmtitle=kat, cmtype="file", cmlimit=200)["query"]["categorymembers"]: basliklar.add(x["title"])
    except Exception: pass
rows = []
b = sorted(basliklar)
for i in range(0, len(b), 40):
    r = q(action="query", titles="|".join(b[i:i+40]), prop="imageinfo", iiprop="url|size|extmetadata|mediatype|mime")
    for pg in r["query"]["pages"].values():
        ii = (pg.get("imageinfo") or [{}])[0]; m = ii.get("extmetadata", {})
        g = lambda k: re.sub("<[^>]+>", "", (m.get(k) or {}).get("value", "")).strip()
        rows.append({"baslik": pg["title"], "lisans": g("LicenseShortName"), "yazar": g("Artist")[:60], "sure": ii.get("duration"), "boyut": ii.get("size"),
                     "mime": ii.get("mime"), "url": ii.get("url"), "aciklama": g("ImageDescription")[:140]})
rows.sort(key=lambda x: (x["lisans"] not in ("Public domain", "CC0"), x["baslik"]))
for x in rows:
    print(f"{x['lisans']:<16} | {str(round(x['sure'] or 0))+'s':>6} | {x['mime']} | {x['baslik']} | {x['yazar']} | {x['aciklama']}")
json.dump(rows, open("ezan-adaylar.json", "w"), ensure_ascii=False, indent=1)
