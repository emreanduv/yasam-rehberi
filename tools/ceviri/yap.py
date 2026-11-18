# İngilizce sözlük üretimi: sozluk*.py → www/dil-en.js (Mr. Anduv! dil paketi, dil.js)
# Ayet metinleri sözlüğe girmez: İngilizce kipte ayetler telifsiz İngilizce meallerden (data/en.json) gelir.
import json, os, glob
d = os.path.dirname(os.path.abspath(__file__)); g = {}; SOZ = {}
for f in sorted(glob.glob(os.path.join(d, 'sozluk*.py'))):
    g = {}; exec(open(f, encoding='utf-8').read(), g); SOZ.update(g['SOZ'])
for k in ['Muharrem', 'Safer', 'Rebiülevvel', 'Rebiülahir', 'Cemaziyelevvel', 'Cemaziyelahir', 'Recep', 'Şaban', 'Ramazan', 'Şevval', 'Zilkade', 'Zilhicce']:
    pass
js = '/* Yaşam Rehberi — İngilizce sözlük (Mr. Anduv! dil paketi: dil.js). Üretim: tools/ceviri (sozluk*.py → yap.py). */\nwindow.DIL_EN = ' + json.dumps(SOZ, ensure_ascii=False, indent=0) + ';\n'
open(os.path.join(d, '..', '..', 'www', 'dil-en.js'), 'w', encoding='utf-8').write(js)
print(len(SOZ))
