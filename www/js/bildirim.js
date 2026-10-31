// Yerel bildirimler (Capacitor LocalNotifications). Bildirimler telefonun kendisine kurulur;
// sunucu yok, uygulama kapalıyken ve internetsiz de çalar.
import { ID_BASE } from "./vakit.js";

const LN = () => window.Capacitor?.Plugins?.LocalNotifications;
const KANAL = "vakit";
const SES = "dit.wav";

export const destekli = () => !!LN();
const android = () => window.Capacitor?.getPlatform?.() === "android";

export async function izinIste() {
  const ln = LN();
  if (!ln) return false;
  let p = await ln.checkPermissions();
  if (p.display !== "granted") p = await ln.requestPermissions();
  if (p.display !== "granted") return false;
  if (android()) {
    try {
      await ln.createChannel({ id: KANAL, name: "Namaz vakitleri", description: "Vakit girdiğinde kısa bir ses",
        importance: 5, sound: SES, vibration: true, visibility: 1 });
    } catch { /* kanal zaten var */ }
  }
  return true;
}

// Android 12+: dakikası dakikasına bildirim için "alarm ve hatırlatıcı" izni
export async function tamZamanli() {
  const ln = LN();
  if (!ln || !android() || !ln.checkExactNotificationSetting) return true;
  try { return (await ln.checkExactNotificationSetting()).exact_alarm === "granted"; } catch { return true; }
}
export async function tamZamanliAyar() {
  try { await LN()?.changeExactNotificationSetting(); } catch { /* yoksay */ }
}

// Kimlik aralıkları: 1000–1999 namaz vakitleri, 2000–2999 Saat hatırlatıcıları, 3000–3999 tesbihat hatırlatması.
// Her modül yalnız kendi aralığını siler ve kurar.
async function bizimBekleyenler(base) {
  const ln = LN();
  const { notifications } = await ln.getPending();
  return notifications.filter((n) => n.id >= base && n.id < base + 1000);
}

export async function iptal(base = ID_BASE) {
  const ln = LN();
  if (!ln) return;
  const list = await bizimBekleyenler(base);
  if (list.length) await ln.cancel({ notifications: list.map((n) => ({ id: n.id })) });
}

export async function kur(list, base = ID_BASE) {
  const ln = LN();
  if (!ln) return 0;
  await iptal(base);
  if (!list.length) return 0;
  await ln.schedule({
    notifications: list.map((n) => ({
      id: n.id, title: n.title, body: n.body,
      schedule: { at: n.at, allowWhileIdle: true },
      sound: SES, channelId: KANAL,
    })),
  });
  return list.length;
}

export async function deneme() {
  const ln = LN();
  if (!ln) return false;
  await ln.schedule({ notifications: [{ id: ID_BASE + 999, title: "Deneme · Yaşam Rehberi", body: "Vakit bildirimleri böyle gelecek.",
    schedule: { at: new Date(Date.now() + 5000), allowWhileIdle: true }, sound: SES, channelId: KANAL }] });
  return true;
}
