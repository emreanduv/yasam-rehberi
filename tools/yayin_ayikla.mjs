// Yayın paketinden, kapalı olan içeriğin veri dosyalarını çıkarır (npx cap sync'ten SONRA çalışır).
// www/js/ozellik.js içinde KURAN = false ise Kur'an metni, mealler ve tefsir (data/core.json, data/index.json)
// iOS ve Android paketlerine girmez. Kaynak klasör (www/) olduğu gibi kalır.
import { readFileSync, rmSync, existsSync } from "node:fs";

const oz = readFileSync(new URL("../www/js/ozellik.js", import.meta.url), "utf8");
const kuran = /export const KURAN\s*=\s*true/.test(oz);
if (kuran) { console.log("KURAN açık: veri dosyaları pakette kalıyor."); process.exit(0); }

const hedefler = ["ios/App/App/public", "android/app/src/main/assets/public"];
for (const h of hedefler) {
  for (const f of ["data/core.json", "data/index.json"]) {
    const yol = new URL(`../${h}/${f}`, import.meta.url);
    if (existsSync(yol)) { rmSync(yol); console.log("çıkarıldı:", `${h}/${f}`); }
  }
}
