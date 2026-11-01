// Namaz vakitleri, hicri tarih ve vakit bildirimleri. Hepsi cihazda; internet ve sunucu yok.
// Hesap: adhan-js, "Turkey" yöntemi (imsak 18°, yatsı 17°, Diyanet temkinleri).
import { Coordinates, CalculationMethod, PrayerTimes } from "./vendor/adhan.js";

export const VAKITLER = [
  { key: "imsak", ad: "İmsak", src: "fajr" },
  { key: "gunes", ad: "Güneş", src: "sunrise" },
  { key: "ogle", ad: "Öğle", src: "dhuhr" },
  { key: "ikindi", ad: "İkindi", src: "asr" },
  { key: "aksam", ad: "Akşam", src: "maghrib" },
  { key: "yatsi", ad: "Yatsı", src: "isha" },
];

export function times(lat, lon, day = new Date()) {
  const d = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 12);
  const t = new PrayerTimes(new Coordinates(lat, lon), d, CalculationMethod.Turkey());
  const out = {};
  for (const v of VAKITLER) out[v.key] = t[v.src];
  return out;
}

export const hhmm = (d) => d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });

// Sıradaki vakit (gerekirse yarının imsakı)
export function nextVakit(lat, lon, now = new Date()) {
  const today = times(lat, lon, now);
  for (const v of VAKITLER) if (today[v.key] > now) return { ...v, at: today[v.key] };
  const tom = new Date(now); tom.setDate(tom.getDate() + 1);
  return { ...VAKITLER[0], at: times(lat, lon, tom).imsak };
}

// Al Fajr tarzı büyük sayaç: SS:DD:ss
export function sayac(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const p = (n) => String(n).padStart(2, "0");
  return `${p(Math.floor(s / 3600))}:${p(Math.floor((s % 3600) / 60))}:${p(s % 60)}`;
}

export function kalan(ms) {
  const m = Math.max(0, Math.floor(ms / 60000));
  const h = Math.floor(m / 60), d = m % 60;
  return h ? `${h} sa ${String(d).padStart(2, "0")} dk` : `${d} dk`;
}

// ---------------------------------------------------------------------------
// Hicri tarih (telefonun takvimi, Ümmü'l-Kurâ). Diyanet takvimiyle 1 gün fark olabilir.
// ---------------------------------------------------------------------------
const AYLAR = ["Muharrem", "Safer", "Rebiülevvel", "Rebiülahir", "Cemaziyelevvel", "Cemaziyelahir",
  "Recep", "Şaban", "Ramazan", "Şevval", "Zilkade", "Zilhicce"];

export function hicri(date = new Date()) {
  for (const cal of ["islamic-umalqura", "islamic-civil", "islamic"]) {
    try {
      const parts = new Intl.DateTimeFormat(`en-u-ca-${cal}-nu-latn`, { day: "numeric", month: "numeric", year: "numeric" })
        .formatToParts(date);
      const get = (t) => Number(parts.find((p) => p.type === t)?.value);
      const gun = get("day"), ay = get("month"), yil = parseInt(parts.find((p) => p.type === "year")?.value, 10);
      if (gun && ay && yil) return { gun, ay, yil, ayAdi: AYLAR[ay - 1], ramazan: ay === 9 };
    } catch { /* bu takvim yok, sıradakini dene */ }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Bildirim planı: önümüzdeki günlerin vakitleri → yerel bildirim listesi
// iOS en fazla 64 bekleyen bildirime izin verir. Bütçe: namaz 36 + Saat 20 + tesbihat 6 + deneme 1 = 63.
// ---------------------------------------------------------------------------
export const ID_BASE = 1000;
export const MAX_BEKLEYEN = 36;

export function plan(lat, lon, ayar, now = new Date()) {
  const secili = VAKITLER.filter((v) => ayar.keys[v.key]);
  const out = [];
  if (!ayar.on) return out;
  const once = (ayar.once || 0) * 60000;
  for (let g = 0; g < 21 && out.length < MAX_BEKLEYEN; g++) {
    const day = new Date(now); day.setDate(day.getDate() + g);
    const t = times(lat, lon, day);
    const h = hicri(t.ogle);
    const ram = !!h?.ramazan;
    const gunluk = [];
    // Ramazan: imsaktan 45 dk önce sahur hatırlatması
    if (ram && ayar.sahur) gunluk.push({ slot: 9, at: new Date(t.imsak - 45 * 60000), title: `Sahur · imsak ${hhmm(t.imsak)}`, body: "İmsaka 45 dakika kaldı. Hayırlı sahurlar." });
    for (const v of secili) {
      const at = new Date(t[v.key] - once);
      let title = `${v.ad} vakti · ${hhmm(t[v.key])}`;
      let body = once ? `${v.ad} vaktine ${ayar.once} dakika kaldı.` : `${v.ad} vakti girdi.`;
      if (v.key === "gunes") body = once ? `Güneşin doğmasına ${ayar.once} dakika kaldı.` : "Güneş doğdu; kerahat vakti.";
      if (ram && v.key === "aksam") { title = `İftar vakti · ${hhmm(t.aksam)}`; body = once ? `İftara ${ayar.once} dakika kaldı.` : "İftar vakti. Hayırlı iftarlar!"; }
      if (ram && v.key === "imsak") { title = `İmsak · ${hhmm(t.imsak)}`; body = once ? `İmsaka ${ayar.once} dakika kaldı.` : "İmsak vakti girdi; oruç başladı."; }
      gunluk.push({ slot: VAKITLER.indexOf(v), at, title, body });
    }
    for (const n of gunluk.sort((a, b) => a.at - b.at)) {
      if (n.at <= now) continue;
      if (out.length >= MAX_BEKLEYEN) break;
      out.push({ id: ID_BASE + g * 10 + n.slot, at: n.at, title: n.title, body: n.body });
    }
  }
  return out;
}

// Planın kaç gün ileriyi kapsadığı (ekranda "bildirimler 9 Kasım'a kadar kurulu" demek için)
export const sonGun = (list) => (list.length ? list[list.length - 1].at : null);
