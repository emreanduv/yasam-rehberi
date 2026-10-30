// Miras motoru testleri: feraiz (Hanefî) ve TMK — klasik feraiz kitaplarındaki standart örnekler
import { feraiz, tmk, kesir } from "../www/js/miras.js";
let fail = 0, n = 0;
const map = (r) => Object.fromEntries(r.satirlar.map((x) => [x.ad, kesir(x.pay)]));
function t(ad, fn, g, beklenen) {
  n++;
  const r = fn(g); const m = map(r);
  const ok = Object.entries(beklenen).every(([k, v]) => m[k] === v) && Object.keys(m).length === Object.keys(beklenen).length && r.toplam.n === r.toplam.d;
  if (!ok) { fail++; console.log("✗", ad, "\n   bulunan:", JSON.stringify(m), "toplam", kesir(r.toplam), "\n   beklenen:", JSON.stringify(beklenen), r.notlar); }
  else console.log("✓", ad);
}
const K = { olen: "kadin" }, E = { olen: "erkek" };
// --- Feraiz ---
t("Avl: koca + 2 kız + anne → 3/13, 8/13, 2/13", feraiz, { ...K, es: 1, kiz: 2, anne: true }, { "Kocası": "3/13", "Kızları": "8/13", "Annesi": "2/13" });
t("Hanım + anne + 2 ana-baba bir erkek kardeş", feraiz, { ...E, es: 1, anne: true, tamE: 2 }, { "Hanımı": "1/4", "Annesi": "1/6", "Ana-baba bir kardeşleri — erkek": "7/12" });
t("Ömeriyye 1: koca + baba + anne → 1/2, 1/3, 1/6", feraiz, { ...K, es: 1, baba: true, anne: true }, { "Kocası": "1/2", "Annesi": "1/6", "Babası": "1/3" });
t("Ömeriyye 2: hanım + baba + anne → 1/4, 1/2, 1/4", feraiz, { ...E, es: 1, baba: true, anne: true }, { "Hanımı": "1/4", "Annesi": "1/4", "Babası": "1/2" });
t("Kız + oğlun kızı + kız kardeş (maa'l-gayr)", feraiz, { ...E, kiz: 1, olmus: [{ cins: "erkek", ogul: 0, kiz: 1 }], tamK: 1 }, { "Kızı": "1/2", "Oğlunun kızı": "1/6", "Ana-baba bir kız kardeşleri": "1/3" });
t("Redd: anne + kız → 1/4, 3/4", feraiz, { ...E, anne: true, kiz: 1 }, { "Annesi": "1/4", "Kızı": "3/4" });
t("Koca + ana-baba bir kız kardeş → 1/2, 1/2", feraiz, { ...K, es: 1, tamK: 1 }, { "Kocası": "1/2", "Ana-baba bir kız kardeşleri": "1/2" });
t("Himariyye (Hanefî): koca + anne + 2 ana bir + erkek kardeş → kardeşe bir şey kalmaz", feraiz, { ...K, es: 1, anne: true, anaE: 2, tamE: 1 }, { "Kocası": "1/2", "Annesi": "1/6", "Ana bir kardeşleri": "1/3" });
t("Kullanıcının örneği: oğlun 2 oğlu + 2 kızı", feraiz, { ...E, olmus: [{ cins: "erkek", ogul: 2, kiz: 2 }] }, { "Oğlunun çocukları (torunlar) — erkek": "2/3", "Oğlunun çocukları (torunlar) — kız": "1/3" });
t("Koca + oğul + kız → 1/4, 1/2, 1/4", feraiz, { ...K, es: 1, ogul: 1, kiz: 1 }, { "Kocası": "1/4", "Çocukları — erkek": "1/2", "Çocukları — kız": "1/4" });
t("2 hanım + oğul → 1/8, 7/8", feraiz, { ...E, es: 2, ogul: 1 }, { "Hanımları": "1/8", "Çocukları — erkek": "7/8" });
t("Baba + kız → 1/2, 1/2 (1/6 + kalan)", feraiz, { ...E, baba: true, kiz: 1 }, { "Kızı": "1/2", "Babası": "1/2" });
t("Dede + erkek kardeş (Ebû Hanîfe) → dede hepsi", feraiz, { ...E, dede: true, tamE: 1 }, { "Dedesi (babasının babası)": "1" });
t("2 kız + oğlun oğlu + oğlun kızı → 2/3, 2/9, 1/9", feraiz, { ...E, kiz: 2, olmus: [{ cins: "erkek", ogul: 1, kiz: 1 }] }, { "Kızları": "2/3", "Oğlunun çocukları (torunlar) — erkek": "2/9", "Oğlunun çocukları (torunlar) — kız": "1/9" });
t("Kız kardeş + baba bir kız kardeş (redd) → 3/4, 1/4", feraiz, { ...E, tamK: 1, babaK: 1 }, { "Ana-baba bir kız kardeşleri": "3/4", "Baba bir kız kardeşleri": "1/4" });
t("Hanım + 2 kız + anne + baba (Minberiyye avl 27) → 3/27, 16/27, 4/27, 4/27", feraiz, { ...E, es: 1, kiz: 2, anne: true, baba: true }, { "Hanımı": "1/9", "Kızları": "16/27", "Annesi": "4/27", "Babası": "4/27" });
t("Koca + 2 ana-baba bir kız kardeş + anne (avl 8) → 3/8, 4/8, 1/8", feraiz, { ...K, es: 1, tamK: 2, anne: true }, { "Kocası": "3/8", "Ana-baba bir kız kardeşleri": "1/2", "Annesi": "1/8" });
t("Yalnız hanım → redd ile tamamı", feraiz, { ...E, es: 1 }, { "Hanımı": "1" });
t("Anneanne + babaanne + oğul → nineler 1/6", feraiz, { ...E, anneAnne: true, babaAnne: true, ogul: 1 }, { "Nineleri": "1/6", "Çocukları — erkek": "5/6" });
// --- TMK ---
t("TMK: eş + 2 çocuk → 1/4, 3/4", tmk, { ...E, es: 1, ogul: 1, kiz: 1 }, { "Hanımı (resmî nikâhlı eş)": "1/4", "Oğlu": "3/8", "Kızı": "3/8" });
t("TMK: eş + anne + baba → 1/2, 1/4, 1/4", tmk, { ...E, es: 1, anne: true, baba: true }, { "Hanımı (resmî nikâhlı eş)": "1/2", "Annesi": "1/4", "Babası": "1/4" });
t("TMK: kullanıcının örneği, vefat etmiş oğlun 4 çocuğu → hepsi", tmk, { ...E, olmus: [{ cins: "erkek", ogul: 2, kiz: 2 }] }, { "Vefat etmiş oğlunun çocukları": "1" });
t("TMK: eş + anne + 1 kardeş (baba ölü) → 1/2, 1/4, 1/4", tmk, { ...K, es: 1, anne: true, tamE: 1 }, { "Kocası": "1/2", "Annesi": "1/4", "Ana-baba bir kardeşleri": "1/4" });
t("TMK: 1 ana-baba bir + 1 ana bir kardeş → 3/4, 1/4", tmk, { ...E, tamK: 1, anaE: 1 }, { "Ana-baba bir kardeşleri": "3/4", "Ana bir kardeşleri": "1/4" });
t("TMK: oğul + vefat etmiş kızın 2 çocuğu → 1/2, 1/2", tmk, { ...E, ogul: 1, olmus: [{ cins: "kadin", ogul: 1, kiz: 1 }] }, { "Oğlu": "1/2", "Vefat etmiş kızının çocukları": "1/2" });
t("TMK: eş + babanın babası → 3/4, 1/4", tmk, { ...E, es: 1, dede: true }, { "Hanımı (resmî nikâhlı eş)": "3/4", "Babasının babası": "1/4" });
t("TMK: yalnız eş → tamamı", tmk, { ...E, es: 1 }, { "Hanımı (resmî nikâhlı eş)": "1" });

// İnceleme sonrası eklenenler
t("TMK: eş + uzak akraba işaretli → Devlete gitmez, eş 1/2 + akrabalar", tmk, { ...E, es: 1, uzakAsabe: true }, { "Hanımı (resmî nikâhlı eş)": "1/2", "Yeğenler ya da amca, hala, dayı, teyze": "1/2" });
t("TMK: yalnız uzak akraba → Devlete gitmez", tmk, { ...E, uzakAsabe: true }, { "Yeğenler ya da amca, hala, dayı, teyze": "1" });
t("Feraiz: 2 oğul + 3 kız → 2/7·2, 1/7·3", feraiz, { ...E, ogul: 2, kiz: 3 }, { "Çocukları — erkek": "4/7", "Çocukları — kız": "3/7" });
t("TMK: 2 oğul → Oğulları", tmk, { ...E, ogul: 2 }, { "Oğulları": "1" });
{ const r = feraiz({ ...E, dede: true, anaK: 1 }); n++; if (r.notlar.some((x) => x.includes("İmameyn"))) { fail++; console.log("✗ dede + ana bir kardeş: mezhep farkı notu çıkmamalı"); } else console.log("✓ dede + ana bir kardeş: gereksiz not yok"); }
{ const r = feraiz({ ...E, es: 1, kiz: 2, anne: true, baba: true }); n++; const b = r.satirlar.find((x) => x.ad === "Babası"); if (b.dayanak.includes("+ kalan")) { fail++; console.log("✗ Minberiyye: baba '+ kalan' yazmamalı"); } else console.log("✓ Minberiyye: baba metni doğru"); }
console.log(fail ? `\n${fail}/${n} test başarısız` : `\nTüm miras testleri geçti (${n})`);
process.exit(fail ? 1 : 0);
