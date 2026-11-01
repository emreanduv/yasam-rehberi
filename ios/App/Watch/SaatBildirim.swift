// Saatin kendi ezan bildirimleri: önümüzdeki günlerin vakitleri saatin üzerine kurulur,
// böylece iPhone elde açıkken ya da yanında değilken de bilekte titrer. İnternet gerekmez.
import Foundation
import UserNotifications

enum SaatBildirim {
    /// Bildirim kurulacak vakitler (Güneş namaz vakti olmadığı için yok)
    private static let vakitler = [0, 2, 3, 4, 5]   // İmsak, Öğle, İkindi, Akşam, Yatsı
    private static let gun = 7                       // 7 gün × 5 vakit = 35 (watchOS sınırı 64)
    private static let onEk = "yr-vakit-"

    static func kur(il: Int, acik: Bool) async {
        let c = UNUserNotificationCenter.current()
        let bekleyen = await c.pendingNotificationRequests().map(\.identifier).filter { $0.hasPrefix(onEk) }
        c.removePendingNotificationRequests(withIdentifiers: bekleyen)
        guard acik else { return }

        let ayar = await c.notificationSettings()
        if ayar.authorizationStatus == .notDetermined {
            _ = try? await c.requestAuthorization(options: [.alert, .sound])
        }
        let son = await c.notificationSettings()
        guard son.authorizationStatus == .authorized || son.authorizationStatus == .provisional else { return }

        let no = max(1, min(81, il))
        let (lat, lon) = Vakit.koord[no - 1]
        let simdi = Date()
        var takvim = Calendar(identifier: .gregorian)
        takvim.timeZone = TimeZone(identifier: "Europe/Istanbul") ?? .current

        for g in 0..<gun {
            let gunTarih = simdi.addingTimeInterval(Double(g) * 86400)
            let t = Vakit.trGun(gunTarih)
            let base = Vakit.gunBasi(t)
            let v = Vakit.hesapla(t.0, t.1, t.2, lat: lat, lon: lon)
            for k in vakitler {
                let an = base.addingTimeInterval(Double(v[k]) * 60)
                guard an > simdi.addingTimeInterval(30) else { continue }
                let icerik = UNMutableNotificationContent()
                icerik.title = "\(Vakit.ad[k]) vakti · \(Vakit.hhmm(v[k]))"
                icerik.body = "\(Vakit.il[no - 1]) · \(Vakit.ad[k]) vakti girdi."
                icerik.sound = .default
                let bilesen = takvim.dateComponents([.year, .month, .day, .hour, .minute], from: an)
                let tetik = UNCalendarNotificationTrigger(dateMatching: bilesen, repeats: false)
                let istek = UNNotificationRequest(identifier: "\(onEk)\(g)-\(k)", content: icerik, trigger: tetik)
                try? await c.add(istek)
            }
        }
    }
}
