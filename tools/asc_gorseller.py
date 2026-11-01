"""App Store ekran görüntülerini App Store Connect API ile yükler (GitHub Actions'tan çalışır).

Kullanım: python tools/asc_gorseller.py <klasör>     ör. store/gorseller/v1-vakit
Klasörde iphone/, ipad/, watch/ alt klasörleri; her birindeki PNG'ler adlarına göre sırayla yüklenir.
Düzenlenebilir (PREPARE_FOR_SUBMISSION vb.) iOS sürümünün Türkçe sayfasındaki eski görseller önce silinir.
Ortam: ASC_KEY_ID, ASC_ISSUER_ID, ASC_KEY_PATH (.p8 dosyası)
"""
import hashlib, os, sys, time, glob
import jwt, requests

APP_ID = os.environ.get("ASC_APP_ID") or "6826874224"   # Saat Vitrini: 6829435134
TURLER = {"iphone67": "APP_IPHONE_67", "iphone": "APP_IPHONE_61", "ipad": "APP_IPAD_PRO_3GEN_129", "watch": "APP_WATCH_ULTRA"}
API = "https://api.appstoreconnect.apple.com/v1/"


def token():
    key = open(os.environ["ASC_KEY_PATH"]).read()
    now = int(time.time())
    return jwt.encode({"iss": os.environ["ASC_ISSUER_ID"], "iat": now, "exp": now + 1100, "aud": "appstoreconnect-v1"},
                      key, algorithm="ES256", headers={"kid": os.environ["ASC_KEY_ID"], "typ": "JWT"})


S = requests.Session()


def api(method, path, **kw):
    S.headers["Authorization"] = "Bearer " + token()
    r = S.request(method, path if path.startswith("http") else API + path, timeout=120, **kw)
    if r.status_code >= 400:
        print(f"::error::{method} {path} → {r.status_code} {r.text[:400]}")
        r.raise_for_status()
    return r.json() if r.content else {}


def main(klasor):
    surumler = api("GET", f"apps/{APP_ID}/appStoreVersions", params={"filter[platform]": "IOS", "limit": 10})["data"]
    duzenlenebilir = [v for v in surumler if v["attributes"]["appStoreState"] in
                      ("PREPARE_FOR_SUBMISSION", "DEVELOPER_REJECTED", "REJECTED", "METADATA_REJECTED")]
    if not duzenlenebilir:
        sys.exit("Düzenlenebilir iOS sürümü yok")
    v = duzenlenebilir[0]
    print("Sürüm:", v["attributes"]["versionString"], v["attributes"]["appStoreState"])
    loc = [l for l in api("GET", f"appStoreVersions/{v['id']}/appStoreVersionLocalizations")["data"]
           if l["attributes"]["locale"] == "tr"][0]
    setler = {s["attributes"]["screenshotDisplayType"]: s["id"]
              for s in api("GET", f"appStoreVersionLocalizations/{loc['id']}/appScreenshotSets")["data"]}

    for alt, tur in TURLER.items():
        dosyalar = sorted(glob.glob(os.path.join(klasor, alt, "*.png")))
        if not dosyalar:
            continue
        if tur not in setler:
            yeni = api("POST", "appScreenshotSets", json={"data": {"type": "appScreenshotSets",
                       "attributes": {"screenshotDisplayType": tur},
                       "relationships": {"appStoreVersionLocalization": {"data": {"type": "appStoreVersionLocalizations", "id": loc["id"]}}}}})
            setler[tur] = yeni["data"]["id"]
        sid = setler[tur]
        # Aynı adla ve işlenmesi bitmiş (COMPLETE) olanlar kalır; gerisi (eski ya da takılmış) silinip yeniden yüklenir
        hazir = set()
        for eski in api("GET", f"appScreenshotSets/{sid}/appScreenshots")["data"]:
            ad = eski["attributes"]["fileName"]
            durum = (eski["attributes"].get("assetDeliveryState") or {}).get("state")
            md5 = eski["attributes"].get("sourceFileChecksum")
            yerel = os.path.join(klasor, alt, ad)
            if durum == "COMPLETE" and os.path.exists(yerel) and md5 == hashlib.md5(open(yerel, "rb").read()).hexdigest() and ad not in hazir:
                hazir.add(ad)
            else:
                api("DELETE", f"appScreenshots/{eski['id']}")
        for f in dosyalar:
            if os.path.basename(f) in hazir:
                print(f"{tur}: {os.path.basename(f)} zaten hazır")
                continue
            veri = open(f, "rb").read()
            c = api("POST", "appScreenshots", json={"data": {"type": "appScreenshots",
                    "attributes": {"fileName": os.path.basename(f), "fileSize": len(veri)},
                    "relationships": {"appScreenshotSet": {"data": {"type": "appScreenshotSets", "id": sid}}}}})["data"]
            for op in c["attributes"]["uploadOperations"]:
                h = {x["name"]: x["value"] for x in op.get("requestHeaders") or []}
                r = requests.request(op["method"], op["url"], headers=h, data=veri[op["offset"]:op["offset"] + op["length"]], timeout=120)
                r.raise_for_status()
            api("PATCH", f"appScreenshots/{c['id']}", json={"data": {"type": "appScreenshots", "id": c["id"],
                "attributes": {"uploaded": True, "sourceFileChecksum": hashlib.md5(veri).hexdigest()}}})
            print(f"{tur}: {os.path.basename(f)} yüklendi")

    # İşlenmeyi bekle (en fazla ~4 dk), sonra her sette sırayı dosya adına göre düzelt
    for _ in range(16):
        time.sleep(15)
        bekleyen = 0
        for tur, sid in setler.items():
            for s in api("GET", f"appScreenshotSets/{sid}/appScreenshots")["data"]:
                if (s["attributes"].get("assetDeliveryState") or {}).get("state") != "COMPLETE":
                    bekleyen += 1
        if not bekleyen:
            break
    for tur, sid in setler.items():
        liste = api("GET", f"appScreenshotSets/{sid}/appScreenshots")["data"]
        sira = sorted(liste, key=lambda s: s["attributes"]["fileName"])
        api("PATCH", f"appScreenshotSets/{sid}/relationships/appScreenshots",
            json={"data": [{"type": "appScreenshots", "id": s["id"]} for s in sira]})
        for s in sira:
            d = (s["attributes"].get("assetDeliveryState") or {}).get("state")
            print(f"{tur}: {s['attributes']['fileName']} → {d}")


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "store/gorseller/v1-vakit")
