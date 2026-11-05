"""Gezi Pasaportu ekran testi: boş açılış, örnek veriyle tüm sekmeler, form, ülke sayfası. Konsol hatası olursa başarısız."""
import sys, os, json, subprocess, time
from playwright.sync_api import sync_playwright
KOK = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CIKTI = sys.argv[1] if len(sys.argv) > 1 else '/tmp/gp-ekran'
os.makedirs(CIKTI, exist_ok=True)
srv = subprocess.Popen([sys.executable, '-m', 'http.server', '8791', '--directory', KOK + '/www'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(1)
ORNEK = {"surum": 1, "ev": "TR", "ulkeler": {"FR": {"d": "g", "s": ["Paris", "Nice"]}, "ES": {"d": "g"}, "JP": {"d": "h"}, "IS": {"d": "h"}, "MT": {"d": "g"}, "VA": {"d": "g"}},
  "geziler": [
    {"id": "a", "ad": "Balayı", "bas": "2025-09-05", "bit": "2025-09-14", "yerler": [{"u": "TH", "s": ["Phuket"]}, {"u": "ID", "s": ["Canggu", "Ubud"]}], "kim": "Eşimle", "puan": 5, "not": "Ubud'da pirinç tarlaları."},
    {"id": "b", "bas": "2026-09-12", "bit": "2026-09-15", "yerler": [{"u": "TR", "s": ["Sığacık", "Seferihisar"]}], "kim": "Eşimle", "puan": 4},
    {"id": "c", "bas": "2024-05-01", "bit": "2024-05-06", "yerler": [{"u": "ES", "s": ["Bilbao"]}], "puan": 4},
    {"id": "d", "bas": "2023-10-10", "bit": "2023-10-14", "yerler": [{"u": "PL", "s": ["Kraków"]}], "puan": 4},
    {"id": "e", "yil": 2019, "yerler": [{"u": "NL", "s": ["Rotterdam", "Amsterdam"]}, {"u": "BE", "s": ["Brüksel"]}], "puan": 3},
    {"id": "f", "bas": "2022-07-01", "bit": "2022-07-08", "yerler": [{"u": "CH", "s": ["Zürih", "Luzern"]}], "puan": 5},
    {"id": "g", "bas": "2021-04-03", "bit": "2021-04-06", "yerler": [{"u": "RS", "s": ["Belgrad"]}], "puan": 4},
    {"id": "h", "bas": "2026-11-12", "bit": "2026-11-20", "yerler": [{"u": "JP", "s": ["Kyoto", "Tokyo"]}], "kim": "Eşimle"},
    {"id": "i", "bas": "2018-08-01", "bit": "2018-08-10", "yerler": [{"u": "EG", "s": ["Kahire"]}, {"u": "MA", "s": ["Marakeş"]}]},
    {"id": "j", "bas": "2017-02-01", "bit": "2017-02-10", "yerler": [{"u": "US", "s": ["New York"]}, {"u": "MX", "s": ["Cancún"]}, {"u": "BR", "s": ["Rio de Janeiro"]}]}]}
hatalar = []
with sync_playwright() as p:
    b = p.chromium.launch()
    sf = b.new_page(viewport={'width': 390, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True)
    sf_init = None
    sf.add_init_script("try{if(!localStorage.getItem('gp.dil'))localStorage.setItem('gp.dil','tr')}catch(e){}")
    sf.on('console', lambda m: m.type == 'error' and hatalar.append(m.text))
    sf.on('pageerror', lambda e: hatalar.append(str(e)))
    sf.goto('http://localhost:8791/index.html'); sf.wait_for_timeout(900)
    sf.screenshot(path=f'{CIKTI}/0-bos.png')
    assert 'Bir Mr. Anduv! yapımıdır.' in sf.inner_text('body').replace('\n', ' ')
    sf.evaluate('v => { localStorage.setItem("gp.veri", JSON.stringify(v)); localStorage.setItem("gp.rehber", JSON.stringify({kapali:true})) }', ORNEK)
    sf.reload(); sf.wait_for_timeout(1200)
    sf.screenshot(path=f'{CIKTI}/1-pasaport.png'); sf.screenshot(path=f'{CIKTI}/1b-pasaport-tam.png', full_page=True)
    print('başlık:', sf.inner_text('#hAlt'))
    for s in ['harita', 'seyahat', 'ulkeler', 'bilgi']:
        sf.click(f'#tabbar [data-s="{s}"]'); sf.wait_for_timeout(500); sf.screenshot(path=f'{CIKTI}/2-{s}.png')
    sf.click('#tabbar [data-s="ulkeler"]'); sf.fill('#ulkeAra', 'ita'); sf.wait_for_timeout(300)
    sf.click('[data-gittim="IT"]'); sf.wait_for_timeout(300); sf.screenshot(path=f'{CIKTI}/3-ulke-ara.png')
    sf.click('.ad[data-ulke="IT"]'); sf.wait_for_timeout(400)
    sf.fill('#sehirGir', 'Rom'); sf.wait_for_timeout(300); sf.screenshot(path=f'{CIKTI}/4-ulke-sayfa.png')
    sf.click('#sehirOneri button:nth-child(2)'); sf.wait_for_timeout(400)
    sf.click('.s-bas [data-kapat]'); sf.click('#tabbar [data-s="pasaport"]'); sf.wait_for_timeout(300)
    sf.click('#fab'); sf.wait_for_timeout(300)
    sf.fill('#fUlke', 'yuna'); sf.wait_for_timeout(200); sf.click('[data-f-ulke]'); sf.wait_for_timeout(200)
    sf.fill('[data-f-sehir="0"]', 'Ati'); sf.wait_for_timeout(200); sf.screenshot(path=f'{CIKTI}/5-form.png')
    sf.click('[data-f-oneri="0"] button:nth-child(2)'); sf.wait_for_timeout(200)
    sf.fill('#fBas', '2025-06-01'); sf.fill('#fBit', '2025-06-07'); sf.click('[data-kim="Eşimle"]'); sf.click('[data-puan="5"]')
    sf.screenshot(path=f'{CIKTI}/5b-form.png', full_page=False)
    sf.click('[data-f-kaydet]'); sf.wait_for_timeout(500); sf.screenshot(path=f'{CIKTI}/6-kayit.png')
    v = sf.evaluate('JSON.parse(localStorage.getItem("gp.veri"))')
    yeni = [g for g in v['geziler'] if g['yerler'][0]['u'] == 'GR']
    assert yeni and yeni[0]['puan'] == 5 and yeni[0]['yerler'][0]['s'], yeni
    assert 'Roma' in v['ulkeler']['IT'].get('s', []) or any('Rom' in s for s in v['ulkeler']['IT'].get('s', [])), v['ulkeler']['IT']
    sf.click('#tabbar [data-s="seyahat"]'); sf.click('[data-gezi="a"]'); sf.wait_for_timeout(400); sf.screenshot(path=f'{CIKTI}/7-gezi.png')
    sf.click('.s-bas [data-kapat]'); sf.click('#tabbar [data-s="harita"]'); sf.wait_for_timeout(300)
    sf.click('[data-zoom="+"]'); sf.click('[data-zoom="+"]'); sf.wait_for_timeout(300); sf.screenshot(path=f'{CIKTI}/8-harita-yakin.png')
    print('ülke sayısı:', sf.inner_text('#hAlt'))
    b.close()
srv.terminate()
if hatalar: print('HATALAR:', *hatalar, sep='\n'); sys.exit(1)
print('tamam')
