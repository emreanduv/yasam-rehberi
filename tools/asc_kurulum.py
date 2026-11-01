"""Yeni bir uygulamanın App Store Connect kurulumunu API ile yapar (GitHub Actions'tan çalışır). Bir Mr. Anduv! yapımıdır.

  1. Bundle ID kaydı (yoksa) — developer.apple.com → Identifiers
  2. Uygulama kaydı var mı? (App Store Connect'te "Yeni Uygulama" API ile açılamıyor; yoksa burada durur ve ne yapılacağını yazar)
  3. Uygulama bilgileri: alt başlık, gizlilik adresi, kategoriler · sürüm metinleri: açıklama, anahtar kelimeler, tanıtım, destek adresi, telif
  4. TestFlight: "Mr. Anduv! Test" dış test grubu ve test kullanıcıları
Metinler store/<uygulama>/magaza-metinleri.md'den okunur.

Kullanım: python tools/asc_kurulum.py <bundle_id> <uygulama_klasörü>     ör. com.anduv.firsatakisi firsat-akisi
Ortam: ASC_KEY_ID, ASC_ISSUER_ID, ASC_KEY_PATH (.p8)
"""
import os, re, sys, time
import jwt, requests

API = "https://api.appstoreconnect.apple.com/v1/"
TESTCILER = ["emreanduv@hotmail.com", "zeynepbayramcavus@icloud.com", "mbayramcavus@icloud.com", "mebayramcavus@icloud.com"]
GRUP = "Mr. Anduv! Test"
S = requests.Session()


def token():
    key = open(os.environ["ASC_KEY_PATH"]).read()
    now = int(time.time())
    return jwt.encode({"iss": os.environ["ASC_ISSUER_ID"], "iat": now, "exp": now + 1100, "aud": "appstoreconnect-v1"},
                      key, algorithm="ES256", headers={"kid": os.environ["ASC_KEY_ID"], "typ": "JWT"})


def api(method, path, ok=(), **kw):
    S.headers["Authorization"] = "Bearer " + token()
    r = S.request(method, path if path.startswith("http") else API + path, timeout=120, **kw)
    if r.status_code >= 400 and r.status_code not in ok:
        print(f"::warning::{method} {path} → {r.status_code} {r.text[:500]}")
        return None
    return r.json() if r.content else {}


def metinler(klasor):
    md = open(f"store/{klasor}/magaza-metinleri.md", encoding="utf-8").read()
    al = lambda etiket: (re.search(r"\*\*" + re.escape(etiket) + r"[^*]*\*\*\s*(.+)", md) or [None, ""])[1].strip()
    aciklama = re.search(r"## Açıklama[^\n]*\n(.+?)\n## ", md, re.S).group(1).strip()
    return {"alt": al("Alt başlık"), "tanitim": al("Promosyon metni"), "kelime": al("Anahtar kelimeler"),
            "aciklama": aciklama, "gizlilik": al("Gizlilik URL:"), "destek": al("Destek URL:"), "telif": al("Telif:")}


def main(bundle, klasor):
    M = metinler(klasor)
    ad = re.sub(r"[^A-Za-z0-9 ]", "", bundle.split(".")[-1]) or "App"
    # 1) Bundle ID
    b = api("GET", "bundleIds", params={"filter[identifier]": bundle})
    if b and [x for x in b["data"] if x["attributes"]["identifier"] == bundle]:
        print(f"Bundle ID hazır: {bundle}")
    else:
        y = api("POST", "bundleIds", json={"data": {"type": "bundleIds", "attributes": {"identifier": bundle, "name": ad, "platform": "IOS"}}})
        print(f"Bundle ID kaydedildi: {bundle}" if y else "::error::Bundle ID kaydedilemedi")
    # 2) Uygulama kaydı
    a = api("GET", "apps", params={"filter[bundleId]": bundle})
    if not a or not a["data"]:
        print(f"::notice::App Store Connect'te {bundle} için uygulama kaydı yok. Apps → + → Yeni Uygulama: iOS, ad, Türkçe, bundle {bundle}, SKU {ad.lower()}. Sonra bu iş akışını yeniden çalıştır.")
        return
    app = a["data"][0]
    print(f"Uygulama: {app['attributes']['name']} · no {app['id']}")
    with open(os.environ.get("GITHUB_STEP_SUMMARY", os.devnull), "a") as f:
        f.write(f"**{app['attributes']['name']}** · App Store Connect uygulama no: `{app['id']}`\n")
    # 3) Uygulama bilgileri
    infos = (api("GET", f"apps/{app['id']}/appInfos") or {"data": []})["data"]
    for info in infos:
        if info["attributes"].get("appStoreState") not in (None, "PREPARE_FOR_SUBMISSION", "DEVELOPER_REJECTED", "REJECTED", "METADATA_REJECTED"):
            continue
        api("PATCH", f"appInfos/{info['id']}", json={"data": {"type": "appInfos", "id": info["id"], "relationships": {
            "primaryCategory": {"data": {"type": "appCategories", "id": "SHOPPING"}},
            "secondaryCategory": {"data": {"type": "appCategories", "id": "LIFESTYLE"}}}}})
        for loc in (api("GET", f"appInfos/{info['id']}/appInfoLocalizations") or {"data": []})["data"]:
            if loc["attributes"]["locale"] == "tr":
                api("PATCH", f"appInfoLocalizations/{loc['id']}", json={"data": {"type": "appInfoLocalizations", "id": loc["id"],
                    "attributes": {"subtitle": M["alt"][:30], "privacyPolicyUrl": M["gizlilik"]}}})
                print("Uygulama bilgileri: alt başlık, gizlilik adresi, kategoriler (Alışveriş / Yaşam Tarzı)")
    # sürüm metinleri
    surum = [v for v in (api("GET", f"apps/{app['id']}/appStoreVersions", params={"filter[platform]": "IOS"}) or {"data": []})["data"]
             if v["attributes"]["appStoreState"] in ("PREPARE_FOR_SUBMISSION", "DEVELOPER_REJECTED", "REJECTED", "METADATA_REJECTED")]
    if surum:
        v = surum[0]
        api("PATCH", f"appStoreVersions/{v['id']}", json={"data": {"type": "appStoreVersions", "id": v["id"], "attributes": {"copyright": M["telif"]}}})
        for loc in (api("GET", f"appStoreVersions/{v['id']}/appStoreVersionLocalizations") or {"data": []})["data"]:
            if loc["attributes"]["locale"] == "tr":
                api("PATCH", f"appStoreVersionLocalizations/{loc['id']}", json={"data": {"type": "appStoreVersionLocalizations", "id": loc["id"],
                    "attributes": {"description": M["aciklama"][:4000], "keywords": M["kelime"][:100], "promotionalText": M["tanitim"][:170], "supportUrl": M["destek"]}}})
                print(f"Sürüm {v['attributes']['versionString']}: açıklama, anahtar kelimeler, tanıtım metni, destek adresi, telif")
    # 4) TestFlight dış test grubu + test kullanıcıları
    gruplar = (api("GET", f"apps/{app['id']}/betaGroups") or {"data": []})["data"]
    g = next((x for x in gruplar if x["attributes"]["name"] == GRUP), None)
    if not g:
        y = api("POST", "betaGroups", json={"data": {"type": "betaGroups", "attributes": {"name": GRUP, "publicLinkEnabled": False},
                "relationships": {"app": {"data": {"type": "apps", "id": app["id"]}}}}})
        g = y and y["data"]
    if g:
        var = {t["attributes"]["email"].lower() for t in (api("GET", f"betaGroups/{g['id']}/betaTesters", params={"limit": 200}) or {"data": []})["data"]}
        for e in TESTCILER:
            if e in var:
                continue
            api("POST", "betaTesters", ok=(409,), json={"data": {"type": "betaTesters", "attributes": {"email": e},
                "relationships": {"betaGroups": {"data": [{"type": "betaGroups", "id": g["id"]}]}}}})
        print(f"TestFlight: '{GRUP}' grubu · {len(TESTCILER)} test kullanıcısı (derleme gelince gruba eklenir)")


REF_APP = "6826874224"   # Yaşam Rehberi: inceleme iletişim bilgileri buradan kopyalanır


def testflight(bundle, klasor):
    """Son derlemeyi dış test grubuna ekler ve TestFlight beta incelemesine gönderir (dış testçiler için zorunlu)."""
    M = metinler(klasor)
    app = api("GET", "apps", params={"filter[bundleId]": bundle})["data"][0]
    # iletişim bilgileri (ad, telefon, e-posta) referans uygulamadan
    ref = (api("GET", f"apps/{REF_APP}/betaAppReviewDetail") or {}).get("data", {}).get("attributes", {})
    if not ref.get("contactEmail"):
        vs = (api("GET", f"apps/{REF_APP}/appStoreVersions", params={"limit": 1}) or {"data": []})["data"]
        if vs:
            d = (api("GET", f"appStoreVersions/{vs[0]['id']}/appStoreReviewDetail") or {}).get("data") or {}
            ref = d.get("attributes", {})
    det = api("GET", f"apps/{app['id']}/betaAppReviewDetail")
    if det and ref.get("contactEmail"):
        api("PATCH", f"betaAppReviewDetails/{det['data']['id']}", json={"data": {"type": "betaAppReviewDetails", "id": det["data"]["id"], "attributes": {
            k: ref.get(k) for k in ("contactFirstName", "contactLastName", "contactPhone", "contactEmail")} | {"demoAccountRequired": False,
            "notes": "Giriş/hesap yok. Uygulama açılınca Market ekranı gelir; kampanyaya dokununca ayrıntısı açılır."}}})
    locs = (api("GET", f"apps/{app['id']}/betaAppLocalizations") or {"data": []})["data"]
    if not [l for l in locs if l["attributes"]["locale"] == "tr"]:
        api("POST", "betaAppLocalizations", json={"data": {"type": "betaAppLocalizations", "attributes": {"locale": "tr",
            "description": M["tanitim"], "feedbackEmail": ref.get("contactEmail") or TESTCILER[0], "privacyPolicyUrl": M["gizlilik"]},
            "relationships": {"app": {"data": {"type": "apps", "id": app["id"]}}}}})
    # son derleme işlenene kadar bekle (en çok ~40 dk)
    for _ in range(80):
        bl = (api("GET", "builds", params={"filter[app]": app["id"], "sort": "-uploadedDate", "limit": 1}) or {"data": []})["data"]
        if bl and bl[0]["attributes"]["processingState"] == "VALID":
            break
        print("derleme işleniyor…", bl and bl[0]["attributes"]["processingState"])
        time.sleep(30)
    else:
        sys.exit("::error::Derleme 40 dakikada işlenmedi")
    b = bl[0]
    api("PATCH", f"builds/{b['id']}", json={"data": {"type": "builds", "id": b["id"], "attributes": {"usesNonExemptEncryption": False}}})
    g = next((x for x in api("GET", f"apps/{app['id']}/betaGroups")["data"] if x["attributes"]["name"] == GRUP), None)
    if g:
        api("POST", f"betaGroups/{g['id']}/relationships/builds", json={"data": [{"type": "builds", "id": b["id"]}]})
    api("POST", "betaAppReviewSubmissions", ok=(409, 422), json={"data": {"type": "betaAppReviewSubmissions",
        "relationships": {"build": {"data": {"type": "builds", "id": b["id"]}}}}})
    print(f"Derleme {b['attributes']['version']} → '{GRUP}' grubu, TestFlight beta incelemesine gönderildi (onaylanınca testçilere davet e-postası gider)")


if __name__ == "__main__":
    if "--testflight" in sys.argv:
        testflight(sys.argv[1], sys.argv[2])
    else:
        main(sys.argv[1], sys.argv[2])
