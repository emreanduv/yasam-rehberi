"""Tüm uygulamalarda TestFlight "Dahili Test" grubu: hesap sahibi (Emre) her yeni derlemeyi incelemesiz alır. Bir Mr. Anduv! yapımıdır.

Her uygulama için:
  - dahili grup yoksa "Mr. Anduv! Dahili" açılır (tüm derlemelere erişim açık → yeni derleme işlenince otomatik gelir)
  - App Store Connect hesabındaki kullanıcı(lar) gruba test kullanıcısı olarak eklenir
Kullanım: python tools/asc_dahili.py [bundle_id]   (bundle verilmezse tüm uygulamalar)
Ortam: ASC_KEY_ID, ASC_ISSUER_ID, ASC_KEY_PATH
"""
import sys

from asc_kurulum import api

GRUP = "Mr. Anduv! Dahili"


def kullanicilar():
    us = (api("GET", "users", params={"limit": 200}) or {"data": []})["data"]
    sahip = [u for u in us if "ACCOUNT_HOLDER" in (u["attributes"].get("roles") or [])]
    secilen = sahip or us
    for u in secilen:
        a = u["attributes"]
        print(f"Kullanıcı: {a.get('firstName')} {a.get('lastName')} · {a.get('username')} · {','.join(a.get('roles') or [])}")
    return secilen


def uygula(app, kisiler):
    ad = app["attributes"]["name"]
    gruplar = (api("GET", f"apps/{app['id']}/betaGroups", params={"limit": 200}) or {"data": []})["data"]
    g = next((x for x in gruplar if x["attributes"].get("isInternalGroup")), None)
    if not g:
        y = api("POST", "betaGroups", json={"data": {"type": "betaGroups",
            "attributes": {"name": GRUP, "isInternalGroup": True, "hasAccessToAllBuilds": True},
            "relationships": {"app": {"data": {"type": "apps", "id": app["id"]}}}}})
        g = y and y["data"]
        if not g:
            print(f"::warning::{ad}: dahili grup açılamadı")
            return False
    elif not g["attributes"].get("hasAccessToAllBuilds"):
        api("PATCH", f"betaGroups/{g['id']}", json={"data": {"type": "betaGroups", "id": g["id"], "attributes": {"hasAccessToAllBuilds": True}}})
    var = {t["attributes"]["email"].lower() for t in (api("GET", f"betaGroups/{g['id']}/betaTesters", params={"limit": 200}) or {"data": []})["data"] if t["attributes"].get("email")}
    eklenen = 0
    for u in kisiler:
        a = u["attributes"]
        e = (a.get("username") or "").lower()
        if not e or e in var:
            continue
        r = api("POST", "betaTesters", ok=(409,), json={"data": {"type": "betaTesters",
            "attributes": {"email": e, "firstName": a.get("firstName") or "", "lastName": a.get("lastName") or ""},
            "relationships": {"betaGroups": {"data": [{"type": "betaGroups", "id": g["id"]}]}}}})
        eklenen += r is not None
    print(f"{ad}: '{g['attributes']['name']}' dahili grubu hazır · {len(var) + eklenen} kişi")
    return True


def main(bundle=None):
    kisiler = kullanicilar()
    if not kisiler:
        sys.exit("::error::App Store Connect kullanıcısı okunamadı (anahtarın yetkisi yetmiyor olabilir)")
    params = {"limit": 200} | ({"filter[bundleId]": bundle} if bundle else {})
    apps = (api("GET", "apps", params=params) or {"data": []})["data"]
    tamam = sum(uygula(a, kisiler) for a in apps)
    print(f"{tamam}/{len(apps)} uygulamada dahili test hazır")


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else None)
