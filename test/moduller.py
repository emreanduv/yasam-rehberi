"""Tesbih, Saat ve Çarşı modülleri testi: sahte konum (Üsküdar), sahte saat, sahte LocalNotifications (iOS gibi).
Kontroller: internetsiz açılış, vakitlerin Namaz sekmesiyle aynı olması, telefon bildirimlerinin kendi
aralıklarına kurulması (namaz 1000+, Saat 2000+, tesbihat 3000+), verinin kalıcı depoya yazılması.
Kullanım: python3 -m http.server 8765 -d www &  python3 test/moduller.py [ekran_klasörü]"""
import sys, json
from playwright.sync_api import sync_playwright
OUT = sys.argv[1] if len(sys.argv) > 1 else None
STUB = """
window.__ln = { pending: [], perm: 'granted' };
window.Capacitor = { getPlatform: () => 'ios', Plugins: { LocalNotifications: {
  checkPermissions: async () => ({ display: window.__ln.perm }),
  requestPermissions: async () => ({ display: window.__ln.perm }),
  getPending: async () => ({ notifications: window.__ln.pending }),
  cancel: async ({ notifications }) => { const ids = new Set(notifications.map(n => n.id)); window.__ln.pending = window.__ln.pending.filter(n => !ids.has(n.id)); },
  schedule: async ({ notifications }) => { window.__ln.pending.push(...notifications); },
}}};
localStorage.setItem('settings', JSON.stringify({ konum: { lat: 41.0225, lon: 29.0156, t: 1 }, vakit: { on: true } }));
"""
errs = []
pend = lambda pg, a, b: pg.evaluate(f"window.__ln.pending.filter(n => n.id >= {a} && n.id < {b}).map(n => [n.id, new Date(n.schedule.at).toLocaleString('tr-TR'), n.title])")
with sync_playwright() as p:
    b = p.chromium.launch()
    ctx = b.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=2, is_mobile=True, has_touch=True, locale="tr-TR", timezone_id="Europe/Istanbul")
    ctx.route("**/*", lambda r: r.continue_() if r.request.url.startswith("http://localhost:8765") else (errs.append("DIŞ İSTEK: " + r.request.url), r.abort()))
    ctx.add_init_script(STUB)
    pg = ctx.new_page()
    pg.on("pageerror", lambda e: errs.append("pageerror: " + str(e)))
    pg.on("console", lambda m: m.type == "error" and errs.append("console: " + m.text))
    pg.clock.install(time="2026-10-29T16:05:00+03:00")
    pg.goto("http://localhost:8765/index.html#/menu"); pg.wait_for_selector(".mn-row")
    menu = pg.eval_on_selector_all(".mn-row b", "e => e.map(x => x.textContent)")
    pg.wait_for_timeout(800)
    namaz = len(pend(pg, 1000, 2000))

    # --- Saat ---
    pg.click("a.mn-row[href='#/saat']"); pg.wait_for_selector("iframe.modul")
    fr = pg.frame_locator("iframe.modul"); fr.locator("#vakitler div").first.wait_for()
    saat_vakit = fr.locator("#vakitler").inner_text().split()
    if OUT: pg.screenshot(path=f"{OUT}/m1-saat.png")
    fr.locator("#tabs [data-go=hatir]").click(); pg.wait_for_timeout(300)
    prayer_btn = fr.locator("#types [data-gonamaz]").count()
    rems = fr.locator("#remList tr").count()
    # su hatırlatıcısını aç (örnekler kapalı başlar)
    fr.locator("#remList input[data-tog]").first.check(); pg.wait_for_timeout(1500)
    saat_n = pend(pg, 2000, 3000)
    # zamanlayıcı 3 dk: o da telefona kurulur
    fr.locator("#tabs [data-go=arac]").click(); fr.locator("[data-tm='3']").click(); pg.wait_for_timeout(1500)
    tm = [x for x in pend(pg, 2000, 3000) if x[2] == "Süre doldu"]
    if OUT: pg.screenshot(path=f"{OUT}/m2-saat-arac.png")
    stored = pg.evaluate("JSON.parse(localStorage.getItem('mod:vakit-v1') ? JSON.parse(localStorage.getItem('mod:vakit-v1')) : 'null')")
    # kıble düğmesi uygulamanın Namaz sekmesine gider
    fr.locator("#qSensor").click(); pg.wait_for_timeout(400); kible_hash = pg.evaluate("location.hash")

    # --- Tesbih ---
    pg.goto("http://localhost:8765/index.html#/tesbih"); pg.wait_for_selector("iframe.modul")
    fr = pg.frame_locator("iframe.modul"); fr.locator("#vakitList li").first.wait_for()
    tv = fr.locator("#vakitList").inner_text().split()
    for _ in range(7): fr.locator("#ring").click()
    big = fr.locator("#big").inner_text()
    fr.locator("#remindChk").check(); pg.wait_for_timeout(800)
    tes = pend(pg, 3000, 4000)
    if OUT: pg.screenshot(path=f"{OUT}/m3-tesbih.png")
    fr.locator(".ayet button").first.click(); pg.wait_for_timeout(500); ayet_hash = pg.evaluate("location.hash")
    pg.goto("http://localhost:8765/index.html#/tesbih"); fr = pg.frame_locator("iframe.modul"); fr.locator("#big").wait_for(); pg.wait_for_timeout(300)
    big2 = fr.locator("#big").inner_text()
    fr.locator("#remindChk").uncheck(); pg.wait_for_timeout(800)
    tes_off = len(pend(pg, 3000, 4000))

    # --- Çarşı ---
    pg.goto("http://localhost:8765/index.html#/carsi"); pg.wait_for_selector(".band h1")
    carsi = pg.text_content(".band .sub")
    pg.goto("http://localhost:8765/index.html#/carsi/r/saat"); pg.wait_for_selector("a[href='#/saat']")
    total = pg.evaluate("window.__ln.pending.length")
    namaz2 = len(pend(pg, 1000, 2000))
    b.close()

r = dict(menu=menu, namaz=namaz, saat_vakit=saat_vakit, prayer_btn=prayer_btn, rems=rems, saat_n=len(saat_n), saat_first=saat_n[:2],
         tm=tm, stored_reminders=len(stored["reminders"]) if stored else None, kible_hash=kible_hash, tesbih_vakit=tv, big=big, big2=big2,
         tes=tes, ayet_hash=ayet_hash, tes_off=tes_off, carsi=carsi, total=total, namaz2=namaz2, errors=errs)
print(json.dumps(r, ensure_ascii=False, indent=1))
assert menu[:3] == ["Tesbih", "Saat", "Çarşı"], menu
assert namaz == 36 and namaz2 == 36, (namaz, namaz2)
# Üsküdar 29.10.2026 — Namaz sekmesi testindeki değerlerle aynı (İmsak 05:58, Akşam 18:11)
assert saat_vakit[saat_vakit.index("İMSAK") + 1] == "05:58" or saat_vakit[saat_vakit.index("İmsak") + 1] == "05:58", saat_vakit
assert "05:58" in tv and "18:11" in tv, tv
assert prayer_btn == 1, "Saat'te namaz türü Namaz sekmesine yönlendirmeli"
assert len(saat_n) == 20 and all(x[2] in ("Su iç", "Süre doldu") for x in saat_n), saat_n
assert len(tm) == 1, tm
assert (r["stored_reminders"] or 0) >= 4, r["stored_reminders"]
assert kible_hash == "#/namaz", kible_hash
assert big == "7" and big2 == "7", (big, big2)
assert len(tes) == 6 and tes[0][2] == "Akşam namazı sonrası tesbihat" and tes[0][1].endswith("18:31:00"), tes
assert ayet_hash == "#/ayet/13/28", ayet_hash
assert tes_off == 0
assert total <= 64, total
assert not errs, errs
print("Modül testi geçti")
