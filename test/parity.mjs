import fs from "node:fs";
import { Engine } from "../www/js/engine.js";
import { tokens, termKey } from "../www/js/text.js";
const core = JSON.parse(fs.readFileSync(new URL("../www/data/core.json", import.meta.url)));
const index = JSON.parse(fs.readFileSync(new URL("../www/data/index.json", import.meta.url)));
const exp = JSON.parse(fs.readFileSync(new URL("./python_expected.json", import.meta.url)));
const e = new Engine(core, index);
let fail = 0;
for (const [w, keys] of Object.entries(exp.__keys__)) {
  const got = tokens(w).map(termKey);
  if (JSON.stringify(got) !== JSON.stringify(keys)) { fail++; console.log("KEY", w, got, keys); }
}
const t0 = performance.now();
for (const [q, x] of Object.entries(exp)) {
  if (q === "__keys__") continue;
  const r = e.search(q, 8);
  const got = { refs: r.verses.map((v) => v.ref), missing: r.missing, concepts: r.concepts.map((c) => c.label), terms: r.terms };
  for (const k of ["refs", "missing", "concepts", "terms"]) {
    if (JSON.stringify(got[k]) !== JSON.stringify(x[k])) { fail++; console.log("DIFF", q, k, "\n  js:", JSON.stringify(got[k]), "\n  py:", JSON.stringify(x[k])); }
  }
}
const n = Object.keys(exp).length - 1;
console.log(fail ? `${fail} fark` : `Python ile birebir aynı: ${n} sorgu`, `· ortalama ${((performance.now() - t0) / n).toFixed(1)} ms/sorgu`);
process.exit(fail ? 1 : 0);
