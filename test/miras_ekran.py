"""Miras ekranı: kullanıcının örneği (dede vefat, vefat etmiş oğlun 2 oğlu 2 kızı, 4.000.000 TL)."""
from playwright.sync_api import sync_playwright
errs = []
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_context(viewport={"width": 390, "height": 844}, is_mobile=True, has_touch=True).new_page()
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto("http://localhost:8765/index.html#/miras"); pg.wait_for_selector(".mr-row")
    pg.click("button[data-act=mr-olmus][data-v=erkek]")
    for k in ["olmus.0.ogul"] * 2 + ["olmus.0.kiz"] * 2: pg.click(f"button[data-act=mr-step][data-k='{k}'][data-d='1']")
    pg.fill("#mr-tutar", "4000000"); pg.wait_for_timeout(300)
    t = pg.inner_text("#mr-sonuc")
    assert "1.333.333 TL" in t and "666.667 TL" in t and "1.000.000 TL" in t, t
    pg.reload(); pg.wait_for_selector(".mr-tab")   # girdiler cihazda saklanıyor
    assert "1.000.000 TL" in pg.inner_text("#mr-sonuc")
    b.close()
assert not errs, errs
print("Miras ekranı testi geçti")
