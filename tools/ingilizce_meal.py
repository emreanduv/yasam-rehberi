# İngilizce mealler (telifsiz, kamu malı): Pickthall (1930; ö. 1936) ve Abdullah Yusuf Ali (1934; ö. 1953).
# Kaynak metin: github.com/fawazahmed0/quran-api (editions/eng-mohammedmarmadu, eng-abdullahyusufal; Tanzil.net aktarımı).
# Kullanım: python3 tools/ingilizce_meal.py <quran-api klasörü>  →  www/data/en.json
import json, sys, os
src = sys.argv[1]
def oku(ad):
    q = json.load(open(os.path.join(src, 'editions', ad + '.json')))['quran']
    assert len(q) == 6236
    return [v['text'].strip() for v in q]
info = json.load(open(os.path.join(src, 'info.json')))
out = {
    'sources': [
        {'id': 'pickthall', 'name': 'Marmaduke Pickthall', 'role': 'meal', 'version': '1930', 'updated': '',
         'credit': 'The Meaning of the Glorious Koran, Marmaduke Pickthall (1930), public domain'},
        {'id': 'yusufali', 'name': 'Abdullah Yusuf Ali', 'role': 'meal', 'version': '1934', 'updated': '',
         'credit': 'The Holy Qur\'an: Text, Translation and Commentary, Abdullah Yusuf Ali (1934), public domain'},
    ],
    'texts': {'pickthall': oku('eng-mohammedmarmadu'), 'yusufali': oku('eng-abdullahyusufal')},
    'surahs': [{'no': c['chapter'], 'name': c['name'], 'en': c['englishname']} for c in info['chapters']],
}
hedef = os.path.join(os.path.dirname(__file__), '..', 'www', 'data', 'en.json')
json.dump(out, open(hedef, 'w'), ensure_ascii=False, separators=(',', ':'))
print('yazıldı', hedef, os.path.getsize(hedef))
