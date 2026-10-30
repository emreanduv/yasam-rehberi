"""Namaz sekmesi testi: sahte konum (İstanbul), sahte saat, sahte LocalNotifications (iOS gibi).
Kullanım: python3 -m http.server 8765 -d www &  python3 test/namaz.py [ekran_klasörü]"""
import sys, json
from playwright.sync_api import sync_playwright
OUT = sys.argv[1] if len(sys.argv) > 1 else None
STUB = """
window.__ln = { pending: [], scheduled: [], perm: 'prompt' };
window.Capacitor = { getPlatform: () => 'ios', Plugins: { LocalNotifications: {
  checkPermissions: async () => ({ display: window.__ln.perm }),
  requestPermissions: async () => { window.__ln.perm = 'granted'; return { display: 'granted' }; },
  getPending: async () => ({ notifications: window.__ln.pending }),
  cancel: async ({ notifications }) => { const ids = new Set(notifications.map(n => n.id)); window.__ln.pending = window.__ln.pending.filter(n => !ids.has(n.id)); },
  schedule: async ({ notifications }) => { window.__ln.pending.push(...notifications); window.__ln.scheduled.push(...notifications); },
}}};
"""
errs = []
def run(date_iso, name):
    with sync_playwright() as p:
        b = p.chromium.launch()
        ctx = b.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=2, is_mobile=True, has_touch=True,
                            geolocation={"latitude": 41.0225, "longitude": 29.0156}, permissions=["geolocation"],
                            locale="tr-TR", timezone_id="Europe/Istanbul")
        ctx.add_init_script(STUB)
        pg = ctx.new_page(); pg.on("pageerror", lambda e: errs.append(str(e)))
        pg.clock.install(time=date_iso)
        pg.goto("http://localhost:8765/index.html#/namaz"); pg.wait_for_selector("[data-act=konum]")
        if OUT: pg.screenshot(path=f"{OUT}/{name}-0.png")
        pg.click("button[data-act=konum]"); pg.wait_for_selector(".nz-row")
        rows = pg.eval_on_selector_all(".nz-row", "e => e.map(x => x.textContent.trim().replace(/\\s+/g, ' '))")
        nxt = pg.text_content(".nz-next .eyebrow-d"); cnt = pg.text_content("#nz-count")
        pg.check("input[data-key=on]"); pg.wait_for_timeout(600)
        st = pg.text_content("#nz-bstat")
        sched = pg.evaluate("window.__ln.pending.map(n => [n.id, new Date(n.schedule.at).toLocaleString('tr-TR'), n.title, n.sound])")
        pg.select_option("select[data-act=vonce]", "10"); pg.wait_for_timeout(500)
        sched10 = pg.evaluate("window.__ln.pending.slice(0,2).map(n => [new Date(n.schedule.at).toLocaleTimeString('tr-TR'), n.title, n.body])")
        pg.uncheck("input[data-key='k:yatsi']"); pg.wait_for_timeout(500)
        no_yatsi = pg.evaluate("window.__ln.pending.filter(n => n.title.startsWith('Yatsı')).length")
        if OUT: pg.screenshot(path=f"{OUT}/{name}-1.png", full_page=True)
        pg.uncheck("input[data-key=on]"); pg.wait_for_timeout(500)
        off = pg.evaluate("window.__ln.pending.length")
        b.close()
        return dict(rows=rows, next=nxt, count=cnt, status=st, n=len(sched), first=sched[:3], last=sched[-1:], once10=sched10, no_yatsi=no_yatsi, after_off=off)

r1 = run("2026-10-29T16:05:00+03:00", "ekim")
print(json.dumps(r1, ensure_ascii=False, indent=1))
assert r1["rows"][0] == "İmsak05:58" and r1["rows"][4] == "Akşam18:11", r1["rows"]   # Üsküdar
assert r1["next"].startswith("Sıradaki · Akşam") and r1["n"] == 60 and r1["no_yatsi"] == 0 and r1["after_off"] == 0
r2 = run("2027-02-10T16:05:00+03:00", "ramazan")
print(json.dumps({k: r2[k] for k in ("next", "first")}, ensure_ascii=False, indent=1))
assert any("İftar" in x[2] for x in r2["first"]), r2["first"]
assert not errs, errs
print("Namaz testi geçti")
