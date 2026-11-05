"""Dil seçimi (ilk açılış), İngilizce arayüz ve adlar, KKTC ve Türk cumhuriyetleri, Türkçe ↔ İngilizce geçişte şehirlerin tek sayılması."""
import sys, os, subprocess, time
from playwright.sync_api import sync_playwright
KOK = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CIKTI = sys.argv[1] if len(sys.argv) > 1 else '/tmp/gp-ekran'; os.makedirs(CIKTI, exist_ok=True)
srv = subprocess.Popen([sys.executable, '-m', 'http.server', '8793', '--directory', KOK + '/www'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1)
hata = []
with sync_playwright() as p:
    b = p.chromium.launch(); s = b.new_page(viewport={'width': 390, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True)
    s.on('pageerror', lambda e: hata.append(str(e))); s.on('console', lambda m: m.type == 'error' and hata.append(m.text))
    s.goto('http://localhost:8793/index.html'); s.wait_for_timeout(1000)
    assert s.is_visible('.dil-ekran'), 'dil ekranı yok'; s.screenshot(path=f'{CIKTI}/d0-dil.png')
    s.click('.dil-ekran [data-dil="en"]'); s.wait_for_load_state(); s.wait_for_timeout(1200)
    s.evaluate('localStorage.setItem("gp.rehber", JSON.stringify({kapali:true}))')
    assert not s.query_selector('.dil-ekran'); assert 'Passport' in s.inner_text('#hBaslik'), s.inner_text('#hBaslik')
    body = s.inner_text('body'); assert 'Bir Mr. Anduv! yapımıdır.' in body.replace('\n', ' ')
    s.click('[data-sehirler]'); s.wait_for_timeout(300)
    for q, beklenen in [('kyren', 'Kyrenia · Turkish Republic of Northern Cyprus'), ('rome', 'Rome · Italy'), ('vienna', 'Vienna · Austria'), ('baku', 'Baku · Azerbaijan'), ('samark', 'Samarkand · Uzbekistan')]:
        s.fill('#dSehir', q); s.wait_for_timeout(250); ilk = ' '.join(s.inner_text('#dOneri button:first-child').split())
        print(q, '→', ilk); assert beklenen in ilk, (q, ilk)
        s.click('#dOneri button:first-child'); s.wait_for_timeout(200)
    s.screenshot(path=f'{CIKTI}/d1-en-sehir.png')
    s.click('.s-bas [data-kapat]'); s.wait_for_timeout(300); s.screenshot(path=f'{CIKTI}/d2-en-pasaport.png')
    v = s.evaluate('JSON.parse(localStorage.getItem("gp.veri"))'); print({k: x.get('s') for k, x in v['ulkeler'].items()})
    assert v['ulkeler']['XN']['s'] == ['Girne'] and v['ulkeler']['IT']['s'] == ['Roma'], v   # kayıt kanonik (Türkçe) ad
    assert s.evaluate('!!document.querySelector("svg .ulke.g[data-k=XN]")') and not s.evaluate('!!document.querySelector("svg .ulke.g[data-k=CY]")')
    s.click('#tabbar [data-s="ulkeler"]'); s.fill('#ulkeAra', 'cyprus'); s.wait_for_timeout(300); s.screenshot(path=f'{CIKTI}/d3-en-ulkeler.png')
    s.click('#tabbar [data-s="bilgi"]'); s.wait_for_timeout(400); s.screenshot(path=f'{CIKTI}/d4-en-daha.png', full_page=True)
    assert 'Tell a friend' in s.inner_text('body') and 'Delete my data' in s.inner_text('body')
    s.click('[data-dil="tr"]'); s.wait_for_load_state(); s.wait_for_timeout(1200)
    assert s.inner_text('#hBaslik') == 'Pasaportum'
    print('TR başlık:', s.inner_text('#hAlt'))
    s.click('#tabbar [data-s="ulkeler"]'); s.fill('#ulkeAra', 'kıbrıs'); s.wait_for_timeout(300)
    t = s.inner_text('#ulkeListe'); assert 'Kuzey Kıbrıs Türk Cumhuriyeti' in t, t
    s.click('.ad[data-ulke="XN"]'); s.wait_for_timeout(400); s.screenshot(path=f'{CIKTI}/d5-tr-kktc.png')
    assert 'Girne' in s.inner_text('#sheetIn')
    s.click('.s-bas [data-kapat]'); s.fill('#ulkeAra', 'stan'); s.wait_for_timeout(300)
    t = s.inner_text('#ulkeListe')
    for u in ['Azerbaycan', 'Kazakistan', 'Kırgızistan', 'Özbekistan', 'Türkmenistan']:
        if u != 'Azerbaycan': assert u in t, u
    b.close()
srv.terminate()
if hata: print('HATA', hata); sys.exit(1)
print('tamam')
