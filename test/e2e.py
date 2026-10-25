import sys, json
from playwright.sync_api import sync_playwright
SHOT = sys.argv[1]
errors = []
with sync_playwright() as p:
    b = p.chromium.launch()
    ctx = b.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=2, is_mobile=True, has_touch=True, locale="tr-TR")
    # internet yokmuş gibi: yerel sunucu dışındaki her isteği engelle
    ctx.route("**/*", lambda r: r.continue_() if r.request.url.startswith("http://localhost:8765") else (errors.append("DIŞ İSTEK: " + r.request.url), r.abort()))
    pg = ctx.new_page()
    pg.on("console", lambda m: m.type == "error" and errors.append("console: " + m.text))
    pg.on("pageerror", lambda e: errors.append("pageerror: " + str(e)))
    pg.goto("http://localhost:8765/index.html"); pg.wait_for_selector("form[data-act=search]")
    pg.screenshot(path=f"{SHOT}/1-ana.png")
    pg.fill("#q", "sakız orucu bozar mı"); pg.click("button[type=submit]")
    pg.wait_for_selector(".answer")
    pg.screenshot(path=f"{SHOT}/2-sonuc.png")
    refs = pg.eval_on_selector_all(".verse-h .ref", "els => els.map(e => e.textContent)")
    pg.click("a.tab >> text=Özet"); pg.wait_for_selector(".status")
    pg.screenshot(path=f"{SHOT}/3-ozet.png", full_page=True)
    status = pg.text_content(".status span.on")
    pg.goto("http://localhost:8765/index.html#/ayet/2/187"); pg.wait_for_selector(".arabic")
    pg.screenshot(path=f"{SHOT}/4-ayet.png")
    pg.click("button[data-act=save]"); pg.wait_for_timeout(300)
    saved_label = pg.text_content("button[data-act=save]").strip()
    pg.click("button[data-act=filter][data-id=ozek]"); meals_after = pg.eval_on_selector_all(".meal", "e => e.length")
    pg.click("button[data-act=tafsir]"); clamp = pg.eval_on_selector(".tafsir", "e => e.classList.contains('clamp')")
    pg.click("a[aria-label='Sonraki ayet']"); pg.wait_for_timeout(200); nxt = pg.text_content(".band h1")
    pg.click(".nav a >> text=Sureler"); pg.wait_for_selector("#slist")
    pg.fill("#sf", "nisa"); vis = pg.eval_on_selector_all("#slist .row", "els => els.filter(e => e.style.display !== 'none').map(e => e.textContent.trim())")
    pg.screenshot(path=f"{SHOT}/5-sureler.png")
    pg.goto("http://localhost:8765/index.html#/sure/112"); pg.wait_for_selector(".rows .row"); n112 = pg.eval_on_selector_all(".rows .row", "e => e.length")
    pg.click(".nav a >> text=Kaydedilenler"); pg.wait_for_timeout(200); kay = pg.eval_on_selector_all(".rows .row b", "els => els.map(e => e.textContent)")
    pg.screenshot(path=f"{SHOT}/6-kaydedilenler.png")
    pg.click(".nav a >> text=Ayarlar"); pg.wait_for_selector("table.src")
    pg.screenshot(path=f"{SHOT}/7-ayarlar.png", full_page=True)
    # meal kapat → sonuçlarda 2 meal kalmalı; hepsini kapatmaya çalış → engellenmeli
    pg.click("input[data-key='meal:saban']"); pg.click("input[data-key='meal:ozek']"); pg.click("input[data-key='meal:rowwad']")
    still = pg.is_checked("input[data-key='meal:rowwad']")
    pg.goto("http://localhost:8765/index.html#/ara?q=miras"); pg.wait_for_selector(".verse-h")
    miras = pg.eval_on_selector_all(".verse-h .ref", "els => els.slice(0,4).map(e => e.textContent)")
    meals_card = pg.eval_on_selector(".panel:not(.answer) .panel-b", "e => e.querySelectorAll('.meal').length")
    pg.reload(); pg.wait_for_selector(".verse-h"); persisted = pg.eval_on_selector(".panel:not(.answer) .panel-b", "e => e.querySelectorAll('.meal').length")
    pg.goto("http://localhost:8765/index.html#/ara?q=4:176"); pg.wait_for_selector(".arabic"); refjump = pg.text_content(".band h1")
    pg.goto("http://localhost:8765/index.html#/ara?q=xqzt"); pg.wait_for_selector(".empty"); empty = pg.text_content(".empty")
    b.close()
print(json.dumps(dict(refs=refs, status=status, saved_label=saved_label, meals_after_filter=meals_after, tafsir_clamped_after_click=clamp,
    next=nxt, surah_filter=vis, n112=n112, saved=kay, last_meal_stays_on=still, miras=miras, meals_per_card=meals_card,
    meals_after_reload=persisted, ref_jump=refjump, empty=empty, errors=errors), ensure_ascii=False, indent=1))
