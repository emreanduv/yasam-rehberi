#!/usr/bin/env python3
"""Diyanet incelemesi için TEK DOSYALIK, internetsiz çalışan sürüm üretir.

Çıktı: dist/Yasam-Rehberi-inceleme.html — USB'den çift tıklayınca tarayıcıda açılır.
Tüm kod, yazı tipleri ve metinler (Arapça, mealler, tefsir) dosyanın içindedir; hiçbir
sunucuya bağlanmaz. Konum/bildirim gibi telefon özellikleri tarayıcıda sınırlıdır.

Kullanım: python3 tools/inceleme_surumu.py  (esbuild için: npx esbuild)
"""
import base64, json, re, subprocess, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
WWW = ROOT / "www"
OUT = ROOT / "dist"; OUT.mkdir(exist_ok=True)

bundle = subprocess.run(["npx", "--yes", "esbuild@0.24.0", str(WWW / "js/app.js"), "--bundle", "--format=iife",
                         "--minify", "--legal-comments=inline", "--target=es2020"],
                        cwd=ROOT, capture_output=True, text=True, check=True).stdout

css = (WWW / "css/app.css").read_text()
def font(m):
    f = WWW / "css" / m.group(1)
    return f'url("data:font/woff2;base64,{base64.b64encode(f.read_bytes()).decode()}")'
css = re.sub(r'url\("(\.\./fonts/[^"]+)"\)', font, css)

core = (WWW / "data/core.json").read_text()
index = (WWW / "data/index.json").read_text()
meta = json.loads(core)["meta"]

html = f"""<!doctype html>
<html lang="tr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Yaşam Rehberi — inceleme sürümü</title>
<style>{css}
body {{ max-width: 480px; margin: 0 auto; }}
.nav {{ max-width: 480px; margin: 0 auto; }}
</style></head><body>
<div id="app"><div class="loading">Yükleniyor…</div></div>
<nav class="nav" id="nav" aria-label="Ana menü"></nav>
<script>window.__CORE={core};</script>
<script>window.__INDEX={index};</script>
<script>{bundle}</script>
</body></html>"""
dst = OUT / "Yasam-Rehberi-inceleme.html"
dst.write_text(html)
print(dst, f"{dst.stat().st_size/1e6:.1f} MB", "veri:", meta.get("built"))
