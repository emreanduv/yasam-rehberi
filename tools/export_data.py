#!/usr/bin/env python3
"""Mağaza veritabanından (kuran_magaza.db) uygulama verisini üretir.

Çıktı: www/data/core.json  — sureler, Arapça metin, mealler, dipnotlar, tefsir, kavramlar, kaynaklar
       www/data/index.json — arama dizini (sıralı kelime listesi + her kelimenin geçtiği yerler)

Arama dizini, kuran-terminal'deki Python arama motoruyla AYNI kelime ayrıştırmasını
kullanır (kuran/text.py). Telefondaki JavaScript sorgu tarafı da aynı kuralları uygular;
tests/parity ile doğrulanır.

Kullanım:
    python tools/export_data.py /yol/kuran-terminal
"""
from __future__ import annotations

import json
import sqlite3
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent.parent
TERMINAL = Path(sys.argv[1] if len(sys.argv) > 1 else HERE.parent / "kuran-terminal").resolve()
sys.path.insert(0, str(TERMINAL))

from kuran.text import tokens  # noqa: E402

DB = TERMINAL / "kuran" / "data" / "kuran_magaza.db"
OUT = HERE / "www" / "data"


def main() -> None:
    con = sqlite3.connect(DB)
    meta = dict(con.execute("SELECT key, value FROM meta"))
    if meta.get("edition") != "magaza":
        raise SystemExit("Bu betik yalnızca mağaza veritabanıyla çalışır (build_db.py --magaza).")

    surahs = [{"no": n, "name": name, "count": c}
              for n, name, c in con.execute("SELECT no, name, ayah_count FROM surahs ORDER BY no")]
    # Ayetleri mushaf sırasıyla tek dizide tut: index → (sure, ayet)
    refs = [(s, a) for s, a in con.execute("SELECT surah, ayah FROM verses ORDER BY surah, ayah")]
    pos = {r: i for i, r in enumerate(refs)}
    arabic = [t for (t,) in con.execute("SELECT arabic FROM verses ORDER BY surah, ayah")]

    sources = []
    for tid, name, role, version, updated, credit in con.execute(
            "SELECT id, name, role, version, updated, credit FROM translations ORDER BY sort"):
        sources.append({"id": tid, "name": name, "role": role, "version": version,
                        "updated": updated, "credit": credit})
    tids = [s["id"] for s in sources]

    texts = {t: [""] * len(refs) for t in tids}
    notes = {t: {} for t in tids}
    for s, a, tid, text, fn in con.execute("SELECT surah, ayah, tid, text, footnotes FROM texts"):
        i = pos[(s, a)]
        texts[tid][i] = text
        if fn:
            notes[tid][str(i)] = fn

    concepts = [{"key": k, "label": l, "triggers": t.split(), "modern": m.split(),
                 "keywords": kw.split(), "anchors": an.split(",")}
                for k, l, t, m, kw, an in con.execute(
                    "SELECT key, label, triggers, modern, keywords, anchors FROM concepts")]
    # Kısa cevap kartı için: temel ayetlerin sade özeti ve Diyanet arama kelimesi
    from kuran.concepts import CONCEPTS  # noqa: E402  (kuran-terminal sys.path'te)
    for c in concepts:
        src = CONCEPTS.get(c["key"], {})
        c["note"] = src.get("note", "")
        c["diyanet"] = src.get("diyanet", c["label"])

    core = {
        "meta": {"built": meta.get("built"), "arabic_credit": meta.get("arabic_credit"),
                 "terms": meta.get("quranenc_terms", "").split("\n")},
        "surahs": surahs, "refs": refs, "arabic": arabic,
        "sources": sources, "texts": texts, "footnotes": notes, "concepts": concepts,
    }

    # Arama dizini: kelime → [ayet_index * 8 + kaynak_index, ...] (her ikili bir kez)
    post: dict[str, set[int]] = {}
    for ti, tid in enumerate(tids):
        for i, text in enumerate(texts[tid]):
            code = i * 8 + ti
            for tok in set(tokens(text)):
                post.setdefault(tok, set()).add(code)
    vocab = sorted(post)
    index = {"vocab": vocab, "postings": [sorted(post[w]) for w in vocab], "tids": tids}

    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "core.json").write_text(json.dumps(core, ensure_ascii=False, separators=(",", ":")),
                                   encoding="utf-8")
    (OUT / "index.json").write_text(json.dumps(index, ensure_ascii=False, separators=(",", ":")),
                                    encoding="utf-8")
    for f in ("core.json", "index.json"):
        print(f"{f}: {(OUT / f).stat().st_size / 1e6:.1f} MB")
    print(f"{len(refs)} ayet, kaynaklar: {', '.join(tids)}, {len(vocab)} kelime")


if __name__ == "__main__":
    main()
