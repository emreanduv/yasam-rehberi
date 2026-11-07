"""App Store sürüm işlemleri (GitHub Actions'tan): python tools/asc_surum.py <durum|hazirla|gonder> [store/surum/X.json]
durum   : sürümler, son derlemeler, inceleme gönderimleri
hazirla : düzenlenebilir iOS sürümü yoksa açar (varsa sürüm numarasını değiştirir); metinler, alt başlık, inceleme notu,
          o sürümün en son işlenmiş derlemesi bağlanır; yayın: onaydan sonra otomatik
gonder  : hazırlanan sürümü App Review'a gönderir
Ortam: ASC_KEY_ID, ASC_ISSUER_ID, ASC_KEY_PATH"""
import json, os, sys, time
import jwt, requests
APP = "6826874224"; API = "https://api.appstoreconnect.apple.com/v1/"
DUZENLENEBILIR = ("PREPARE_FOR_SUBMISSION", "DEVELOPER_REJECTED", "REJECTED", "METADATA_REJECTED", "INVALID_BINARY")

def tok():
    n = int(time.time())
    return jwt.encode({"iss": os.environ["ASC_ISSUER_ID"], "iat": n, "exp": n + 1100, "aud": "appstoreconnect-v1"},
                      open(os.environ["ASC_KEY_PATH"]).read(), algorithm="ES256", headers={"kid": os.environ["ASC_KEY_ID"], "typ": "JWT"})
def api(m, p, ok_hata=False, **kw):
    r = requests.request(m, p if p.startswith("http") else API + p, headers={"Authorization": "Bearer " + tok()}, timeout=120, **kw)
    if r.status_code >= 400:
        print(f"{'' if ok_hata else '::error::'}{m} {p} → {r.status_code} {r.text[:800]}")
        if not ok_hata: r.raise_for_status()
        return None
    return r.json() if r.content else {}

def surumler():
    return api("GET", f"apps/{APP}/appStoreVersions", params={"filter[platform]": "IOS", "limit": 10})["data"]

def durum():
    for v in surumler(): print("sürüm", v["attributes"]["versionString"], v["attributes"]["appStoreState"], v["id"])
    b = api("GET", "builds", params={"filter[app]": APP, "sort": "-uploadedDate", "limit": 6, "include": "preReleaseVersion"})
    pv = {x["id"]: x["attributes"]["version"] for x in b.get("included", [])}
    for x in b["data"]:
        print("derleme", pv.get(x["relationships"]["preReleaseVersion"]["data"]["id"]), x["attributes"]["version"], x["attributes"]["processingState"], x["attributes"]["uploadedDate"])
    for s in api("GET", f"apps/{APP}/reviewSubmissions", params={"limit": 5})["data"]:
        print("gönderim", s["attributes"]["state"], s["attributes"].get("submittedDate"), s["id"])

def hazirla(d):
    S = d["surum"]
    v = next((x for x in surumler() if x["attributes"]["appStoreState"] in DUZENLENEBILIR), None)
    if v and v["attributes"]["versionString"] != S:
        api("PATCH", f"appStoreVersions/{v['id']}", json={"data": {"type": "appStoreVersions", "id": v["id"], "attributes": {"versionString": S}}})
    if not v:
        v = api("POST", "appStoreVersions", json={"data": {"type": "appStoreVersions", "attributes": {"platform": "IOS", "versionString": S, "releaseType": "AFTER_APPROVAL"},
                "relationships": {"app": {"data": {"type": "apps", "id": APP}}}}})["data"]
    vid = v["id"]; print("sürüm", S, vid)
    api("PATCH", f"appStoreVersions/{vid}", json={"data": {"type": "appStoreVersions", "id": vid, "attributes": {"releaseType": "AFTER_APPROVAL", "copyright": "2026 Mr. Anduv!"}}})
    for l in api("GET", f"appStoreVersions/{vid}/appStoreVersionLocalizations")["data"]:
        if l["attributes"]["locale"] != "tr": continue
        api("PATCH", f"appStoreVersionLocalizations/{l['id']}", json={"data": {"type": "appStoreVersionLocalizations", "id": l["id"], "attributes": {
            "description": d["aciklama"], "keywords": d["anahtarKelimeler"], "promotionalText": d["promosyon"], "whatsNew": d["yenilikler"]}}})
        print("metinler: tr")
    # alt başlık (düzenlenebilir appInfo)
    for ai in api("GET", f"apps/{APP}/appInfos")["data"]:
        if ai["attributes"].get("appStoreState") in ("READY_FOR_SALE",) or ai["attributes"].get("state") in ("READY_FOR_DISTRIBUTION",): continue
        for l in api("GET", f"appInfos/{ai['id']}/appInfoLocalizations")["data"]:
            if l["attributes"]["locale"] == "tr":
                api("PATCH", f"appInfoLocalizations/{l['id']}", ok_hata=True, json={"data": {"type": "appInfoLocalizations", "id": l["id"], "attributes": {"subtitle": d["altBaslik"]}}})
                print("alt başlık:", d["altBaslik"])
    # içerik hakları: üçüncü taraf içerik (mealler, Arapça metin) — kullanım hakkı var
    api("PATCH", f"apps/{APP}", ok_hata=True, json={"data": {"type": "apps", "id": APP, "attributes": {"contentRightsDeclaration": "USES_THIRD_PARTY_CONTENT"}}})
    # inceleme notu
    rd = api("GET", f"appStoreVersions/{vid}/appStoreReviewDetail", ok_hata=True)
    if rd and rd.get("data"):
        api("PATCH", f"appStoreReviewDetails/{rd['data']['id']}", json={"data": {"type": "appStoreReviewDetails", "id": rd["data"]["id"], "attributes": {"notes": d["incelemeNotu"], "demoAccountRequired": False}}})
    else:
        api("POST", "appStoreReviewDetails", json={"data": {"type": "appStoreReviewDetails", "attributes": {"notes": d["incelemeNotu"], "demoAccountRequired": False,
            "contactFirstName": "Emre", "contactLastName": "Anduv", "contactEmail": "emreanduvart@gmail.com", "contactPhone": "+905435349389"},
            "relationships": {"appStoreVersion": {"data": {"type": "appStoreVersions", "id": vid}}}}})
    print("inceleme notu tamam")
    # derleme: bu sürüm numaralı en son işlenmiş derleme (gerekirse 25 dk bekler)
    for _ in range(50):
        b = api("GET", "builds", params={"filter[app]": APP, "filter[preReleaseVersion.version]": S, "filter[processingState]": "VALID", "sort": "-uploadedDate", "limit": 1})["data"]
        if b: break
        print("derleme bekleniyor…"); time.sleep(30)
    if not b: sys.exit("::error::işlenmiş derleme yok")
    bid = b[0]["id"]
    if b[0]["attributes"].get("usesNonExemptEncryption") is None:
        api("PATCH", f"builds/{bid}", ok_hata=True, json={"data": {"type": "builds", "id": bid, "attributes": {"usesNonExemptEncryption": False}}})
    api("PATCH", f"appStoreVersions/{vid}/relationships/build", json={"data": {"type": "builds", "id": bid}})
    print("derleme bağlandı:", b[0]["attributes"]["version"])

def gonder(d):
    v = next(x for x in surumler() if x["attributes"]["appStoreState"] in DUZENLENEBILIR and x["attributes"]["versionString"] == d["surum"])
    acik = [s for s in api("GET", f"apps/{APP}/reviewSubmissions", params={"filter[state]": "READY_FOR_REVIEW,UNRESOLVED_ISSUES", "filter[platform]": "IOS"})["data"]]
    sid = acik[0]["id"] if acik else api("POST", "reviewSubmissions", json={"data": {"type": "reviewSubmissions", "attributes": {"platform": "IOS"},
            "relationships": {"app": {"data": {"type": "apps", "id": APP}}}}})["data"]["id"]
    api("POST", "reviewSubmissionItems", ok_hata=True, json={"data": {"type": "reviewSubmissionItems", "relationships": {
        "reviewSubmission": {"data": {"type": "reviewSubmissions", "id": sid}}, "appStoreVersion": {"data": {"type": "appStoreVersions", "id": v["id"]}}}}})
    api("PATCH", f"reviewSubmissions/{sid}", json={"data": {"type": "reviewSubmissions", "id": sid, "attributes": {"submitted": True}}})
    print("App Review'a gönderildi:", d["surum"], sid)

if __name__ == "__main__":
    is_ = sys.argv[1]; d = json.load(open(sys.argv[2])) if len(sys.argv) > 2 else None
    {"durum": lambda: durum(), "hazirla": lambda: hazirla(d), "gonder": lambda: gonder(d)}[is_]()
    durum()
