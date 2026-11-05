"""Şehirden ülkeye: Paris yazılınca yalnız Fransa işaretlenmeli; Fransız Guyanası (Güney Amerika) ve diğer denizaşırı topraklar boyanmamalı."""
import sys, os, subprocess, time
from playwright.sync_api import sync_playwright
KOK = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CIKTI = sys.argv[1] if len(sys.argv) > 1 else '/tmp/gp-ekran'; os.makedirs(CIKTI, exist_ok=True)
srv = subprocess.Popen([sys.executable, '-m', 'http.server', '8792', '--directory', KOK + '/www'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1)
hata = []
with sync_playwright() as p:
    b = p.chromium.launch(); s = b.new_page(viewport={'width': 390, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True)
    s.on('pageerror', lambda e: hata.append(str(e))); s.on('console', lambda m: m.type == 'error' and hata.append(m.text))
    s.goto('http://localhost:8792/index.html'); s.evaluate('localStorage.setItem("gp.rehber", JSON.stringify({kapali:true}))'); s.reload(); s.wait_for_timeout(1200)
    s.click('[data-sehirler]'); s.wait_for_timeout(300)
    s.fill('#dSehir', 'paris'); s.wait_for_timeout(300); s.screenshot(path=f'{CIKTI}/s1-paris-oneri.png')
    ilk = s.inner_text('#dOneri button:first-child'); print('ilk öneri:', ilk.replace('\n', ' ')); assert 'Fransa' in ilk
    s.click('#dOneri button:first-child'); s.wait_for_timeout(300)
    for q in ['kyoto', 'roma', 'kraków', 'bilbao']:
        s.fill('#dSehir', q); s.wait_for_timeout(250); s.click('#dOneri button:first-child'); s.wait_for_timeout(250)
    s.screenshot(path=f'{CIKTI}/s2-eklenenler.png')
    s.click('.s-bas [data-kapat]'); s.wait_for_timeout(300)
    v = s.evaluate('JSON.parse(localStorage.getItem("gp.veri"))')
    print('ülkeler:', {k: x.get('s') for k, x in v['ulkeler'].items()})
    assert set(v['ulkeler']) == {'FR', 'JP', 'IT', 'PL', 'ES'}, v['ulkeler']
    boyali = s.evaluate('[...document.querySelectorAll("svg .ulke.g, svg .ada.g")].map(e=>e.dataset.k)')
    print('boyalı:', sorted(boyali)); assert not ({'GF', 'GP', 'MQ', 'RE', 'YT'} & set(boyali)), boyali
    kita = s.inner_text('#hAlt'); print('başlık:', kita); assert '2 kıta' in kita
    s.screenshot(path=f'{CIKTI}/s3-pasaport.png')
    s.click('#tabbar [data-s="harita"]'); s.wait_for_timeout(400); s.screenshot(path=f'{CIKTI}/s4-harita.png')
    s.click('#tabbar [data-s="ulkeler"]'); s.fill('#ulkeAra', 'vien'); s.wait_for_timeout(300); s.screenshot(path=f'{CIKTI}/s5-ulkeler-sehir.png')
    s.click('[data-u-sehir]'); s.wait_for_timeout(300)
    s.click('#tabbar [data-s="pasaport"]'); s.click('#fab'); s.fill('#fUlke', 'selan'); s.wait_for_timeout(300); s.screenshot(path=f'{CIKTI}/s6-form-sehir.png')
    s.click('[data-f-sehir-ekle]'); s.wait_for_timeout(200); assert 'Selanik' in s.inner_text('#yerler'), s.inner_text('#yerler')
    b.close()
srv.terminate()
if hata: print('HATA', hata); sys.exit(1)
print('tamam')
