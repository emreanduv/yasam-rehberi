"""Kıble ekranı testi: sahte konum (İstanbul) + sahte pusula olayları (Android ve iOS biçimi).
Kullanım: python3 -m http.server 8765 -d www &  python3 test/kible.py"""
from playwright.sync_api import sync_playwright
errs = []
with sync_playwright() as p:
    b = p.chromium.launch()
    ctx = b.new_context(viewport={"width": 390, "height": 844}, is_mobile=True, has_touch=True,
                        geolocation={"latitude": 41.0225, "longitude": 29.0156}, permissions=["geolocation"])
    pg = ctx.new_page(); pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto("http://localhost:8765/index.html#/kible"); pg.wait_for_selector("#kb-start")
    pg.click("#kb-start"); pg.wait_for_timeout(800)
    assert pg.text_content("#kb-ang").startswith("152°"), pg.text_content("#kb-ang")
    ev = lambda a: pg.evaluate("a=>{const e=new Event('deviceorientationabsolute');e.alpha=a;e.absolute=true;window.dispatchEvent(e)}", a)
    ios = lambda h: pg.evaluate("h=>{const e=new Event('deviceorientation');e.webkitCompassHeading=h;window.dispatchEvent(e)}", h)
    for _ in range(30): ev(0)                      # manyetik kuzey → gerçek ~6°
    assert pg.text_content("#kb-big") == "146° sağa dön", pg.text_content("#kb-big")
    for _ in range(60): ev(360 - 146)              # kıbleye bakıyor
    assert pg.text_content("#kb-big") == "Kıble ✓"
    for _ in range(60): ios(200)
    assert pg.text_content("#kb-big") == "54° sola dön", pg.text_content("#kb-big")
    b.close()
assert not errs, errs
print("Kıble testi geçti")
