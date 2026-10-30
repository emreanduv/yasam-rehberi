#!/usr/bin/env python3
"""Uygulamadaki metinlerin tamamını PDF olarak üretir (inceleme için).

dist/Ek-2a_Arapca-metin-ve-mealler.pdf : her ayet için Arapça metin + 3 meal (+ dipnotlar)
dist/Ek-2b_el-Muhtasar-tefsiri.pdf     : uygulamadaki kısa tefsir metinleri
Metinler uygulamanın kullandığı veri dosyasından (www/data/core.json) birebir alınır.
"""
import base64, html, json
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
WWW = ROOT / "www"; OUT = ROOT / "dist"; OUT.mkdir(exist_ok=True)
core = json.loads((WWW / "data/core.json").read_text())
src = {s["id"]: s for s in core["sources"]}
meals = [s["id"] for s in core["sources"] if s["role"] == "meal"]
tefsir = [s["id"] for s in core["sources"] if s["role"] == "tefsir"][0]
e = html.escape
KISA = {"rowwad": "Rowwad", "ozek": "Ali Özek", "saban": "Ş. Britiş"}

def f64(name):
    return base64.b64encode((WWW / "fonts" / name).read_bytes()).decode()

CSS = f"""
@font-face {{ font-family: PTS; font-weight: 400; src: url(data:font/woff2;base64,{f64('pt-sans-latin-400-normal.woff2')}); }}
@font-face {{ font-family: PTS; font-weight: 400; src: url(data:font/woff2;base64,{f64('pt-sans-latin-ext-400-normal.woff2')}); unicode-range: U+0100-024F, U+1E00-1EFF; }}
@font-face {{ font-family: PTS; font-weight: 700; src: url(data:font/woff2;base64,{f64('pt-sans-latin-700-normal.woff2')}); }}
@font-face {{ font-family: PTS; font-weight: 700; src: url(data:font/woff2;base64,{f64('pt-sans-latin-ext-700-normal.woff2')}); unicode-range: U+0100-024F, U+1E00-1EFF; }}
@font-face {{ font-family: Amiri; src: url(data:font/woff2;base64,{f64('amiri-arabic-400-normal.woff2')}); }}
@page {{ size: A4; margin: 16mm 15mm 16mm 15mm; }}
body {{ font-family: PTS, sans-serif; font-size: 10.5pt; color: #1f2328; line-height: 1.45; }}
.cover {{ page-break-after: always; padding-top: 50mm; }}
.cover h1 {{ font-size: 26pt; margin: 0 0 6mm; color: #1d4d36; }}
.cover table {{ border-collapse: collapse; margin-top: 8mm; font-size: 10pt; }}
.cover td {{ border: 1px solid #c8bc9a; padding: 2mm 3mm; vertical-align: top; }}
h2 {{ background: #1d4d36; color: #fff; font-size: 13pt; padding: 2mm 3mm; margin: 0 0 3mm; border-bottom: 2px solid #c9a227; page-break-after: avoid; }}
h2.new {{ page-break-before: always; }}
.a {{ border-bottom: 1px solid #ddd3b8; padding: 2mm 0 2.5mm; page-break-inside: avoid; }}
.ref {{ font-weight: 700; color: #2f3e4c; font-size: 9.5pt; }}
.ar {{ font-family: Amiri, serif; font-size: 17pt; direction: rtl; text-align: right; line-height: 1.9; margin: 1mm 0 1.5mm; }}
.m {{ margin: 1mm 0; }}
.m b {{ display: inline-block; min-width: 24mm; font-size: 8.5pt; color: #1d4d36; text-transform: uppercase; letter-spacing: .3px; }}
.fn {{ font-size: 8.5pt; color: #5e5645; margin: .5mm 0 0 24mm; white-space: pre-wrap; }}
.t {{ margin: 1mm 0; text-align: justify; }}
"""

def cover(title, rows):
    tr = "".join(f"<tr><td><b>{e(k)}</b></td><td>{v}</td></tr>" for k, v in rows)
    return f"""<div class="cover"><div style="font-size:10pt;color:#5e5645">YAŞAM REHBERİ · Mobil uygulama · İnceleme eki</div>
    <h1>{e(title)}</h1>
    <div>Bu belgedeki metinler, uygulamanın kullandığı veri dosyasından değiştirilmeden alınmıştır.
    Uygulamada gösterilen metinlerin tamamı bu belgede yer alır.</div><table>{tr}</table>
    <div style="margin-top:10mm;font-size:9pt;color:#5e5645">Hazırlayan: Emre Anduv (Mr. Anduv!) · Veri sürümü: {e(core['meta'].get('built') or '')}</div></div>"""

def build(kind):
    parts = []
    if kind == "meal":
        rows = [("Arapça metin", e(core["meta"]["arabic_credit"]))] + [(src[t]["name"], e(src[t]["credit"])) for t in meals]
        parts.append(cover("Arapça metin ve Türkçe mealler (tam metin)", rows + [("Kapsam", f"{len(core['surahs'])} sure · {len(core['refs'])} ayet")]))
    else:
        parts.append(cover("el-Muhtasar fi't-Tefsîr — uygulamadaki kısa açıklamalar (tam metin)", [(src[tefsir]["name"], e(src[tefsir]["credit"])), ("Kapsam", f"{len(core['refs'])} ayet")]))
    cur = None
    for i, (s, a) in enumerate(core["refs"]):
        if s != cur:
            cur = s
            sr = core["surahs"][s - 1]
            parts.append(f'<h2 class="{"new" if s > 1 else ""}">{s}. {e(sr["name"])} Suresi · {sr["count"]} ayet</h2>')
        if kind == "meal":
            ms = []
            for t in meals:
                ms.append(f'<div class="m"><b>{e(KISA.get(t, src[t]["name"]))}</b>{e(core["texts"][t][i])}</div>')
                fn = core["footnotes"][t].get(str(i))
                if fn: ms.append(f'<div class="fn">{e(fn)}</div>')
            parts.append(f'<div class="a"><span class="ref">{s}:{a}</span><div class="ar">{e(core["arabic"][i])}</div>{"".join(ms)}</div>')
        else:
            parts.append(f'<div class="a"><span class="ref">{s}:{a}</span><div class="t">{e(core["texts"][tefsir][i])}</div></div>')
    return f"<!doctype html><html lang='tr'><head><meta charset='utf-8'><style>{CSS}</style></head><body>{''.join(parts)}</body></html>"

FOOT = '<div style="font-size:7pt;width:100%;text-align:center;color:#777;font-family:sans-serif">Yaşam Rehberi · inceleme eki · <span class="pageNumber"></span> / <span class="totalPages"></span></div>'
with sync_playwright() as p:
    b = p.chromium.launch()
    for kind, name in [("meal", "Ek-2a_Arapca-metin-ve-mealler.pdf"), ("tefsir", "Ek-2b_el-Muhtasar-tefsiri.pdf")]:
        pg = b.new_page()
        pg.set_content(build(kind), wait_until="load", timeout=600000)
        pg.evaluate("document.fonts.ready")
        pg.pdf(path=str(OUT / name), format="A4", print_background=True, display_header_footer=True,
               header_template="<div></div>", footer_template=FOOT, margin={"top": "14mm", "bottom": "16mm", "left": "14mm", "right": "14mm"})
        print(OUT / name, f"{(OUT / name).stat().st_size/1e6:.1f} MB")
    b.close()
