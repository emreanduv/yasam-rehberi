// Namaz vakti hesabı — telefon uygulamasındaki www/js/vakit.js ile birebir aynı yöntem.
// Diyanet: imsak 18°, yatsı 17°, ikindi tek gölge boyu; temkin güneş −7, öğle +5, ikindi +4, akşam +7 dk.
import Foundation

enum Vakit {
    static let ad = ["İmsak", "Güneş", "Öğle", "İkindi", "Akşam", "Yatsı"]
    static let tz = 3
    private static let temkin: [Double] = [0, -7, 5, 4, 7, 0]
    private static let yuvarla: [Double] = [0, 0, 0, 0.6, 0.6, 0.6]

    static let il = ["Adana","Adıyaman","Afyonkarahisar","Ağrı","Amasya","Ankara","Antalya","Artvin","Aydın","Balıkesir","Bilecik","Bingöl","Bitlis","Bolu","Burdur","Bursa","Çanakkale","Çankırı","Çorum","Denizli","Diyarbakır","Edirne","Elazığ","Erzincan","Erzurum","Eskişehir","Gaziantep","Giresun","Gümüşhane","Hakkari","Hatay","Isparta","Mersin","İstanbul","İzmir","Kars","Kastamonu","Kayseri","Kırklareli","Kırşehir","Kocaeli","Konya","Kütahya","Malatya","Manisa","Kahramanmaraş","Mardin","Muğla","Muş","Nevşehir","Niğde","Ordu","Rize","Sakarya","Samsun","Siirt","Sinop","Sivas","Tekirdağ","Tokat","Trabzon","Tunceli","Şanlıurfa","Uşak","Van","Yozgat","Zonguldak","Aksaray","Bayburt","Karaman","Kırıkkale","Batman","Şırnak","Bartın","Ardahan","Iğdır","Yalova","Karabük","Kilis","Osmaniye","Düzce"]
    static let koord: [(Double, Double)] = [(37.00,35.32),(37.76,38.28),(38.76,30.54),(39.72,43.05),(40.65,35.83),(39.93,32.86),(36.89,30.71),(41.18,41.82),(37.85,27.85),(39.65,27.88),(40.14,29.98),(38.88,40.50),(38.40,42.11),(40.74,31.61),(37.72,30.29),(40.19,29.06),(40.15,26.41),(40.60,33.62),(40.55,34.95),(37.78,29.09),(37.91,40.24),(41.68,26.56),(38.67,39.22),(39.75,39.49),(39.90,41.27),(39.78,30.52),(37.07,37.38),(40.91,38.39),(40.46,39.48),(37.57,43.74),(36.20,36.16),(37.76,30.55),(36.81,34.64),(41.01,28.98),(38.42,27.14),(40.60,43.10),(41.38,33.78),(38.73,35.48),(41.73,27.22),(39.15,34.16),(40.77,29.92),(37.87,32.48),(39.42,29.98),(38.35,38.31),(38.61,27.43),(37.58,36.94),(37.31,40.74),(37.22,28.36),(38.74,41.49),(38.62,34.71),(37.97,34.68),(40.98,37.88),(41.02,40.52),(40.78,30.40),(41.29,36.33),(37.93,41.94),(42.03,35.15),(39.75,37.02),(40.98,27.51),(40.31,36.55),(41.00,39.72),(39.11,39.55),(37.16,38.79),(38.68,29.41),(38.49,43.38),(39.82,34.81),(41.45,31.79),(38.37,34.03),(40.26,40.23),(37.18,33.22),(39.85,33.51),(37.88,41.13),(37.52,42.46),(41.63,32.34),(41.11,42.70),(39.92,44.04),(40.66,29.27),(41.20,32.62),(36.72,37.12),(37.07,36.25),(40.84,31.16)]

    private static func rad(_ d: Double) -> Double { d * .pi / 180 }
    private static func deg(_ r: Double) -> Double { r * 180 / .pi }
    private static func fix(_ a: Double, _ b: Double) -> Double { let x = a - b * floor(a / b); return x < 0 ? x + b : x }

    private static func julian(_ y0: Int, _ m0: Int, _ d: Int) -> Double {
        var y = y0, m = m0
        if m <= 2 { y -= 1; m += 12 }
        let A = floor(Double(y) / 100), B = 2 - A + floor(A / 4)
        return floor(365.25 * Double(y + 4716)) + floor(30.6001 * Double(m + 1)) + Double(d) + B - 1524.5
    }
    private static func sun(_ jd: Double) -> (decl: Double, eqt: Double) {
        let D = jd - 2451545.0
        let g = fix(357.529 + 0.98560028 * D, 360), q = fix(280.459 + 0.98564736 * D, 360)
        let L = fix(q + 1.915 * sin(rad(g)) + 0.020 * sin(rad(2 * g)), 360), e = 23.439 - 0.00000036 * D
        let RA = fix(deg(atan2(cos(rad(e)) * sin(rad(L)), cos(rad(L)))) / 15, 24)
        return (deg(asin(sin(rad(e)) * sin(rad(L)))), q / 15 - RA)
    }

    /// Altı vakit: Türkiye saatiyle gece yarısından itibaren dakika
    static func hesapla(_ y: Int, _ m: Int, _ d: Int, lat: Double, lon: Double) -> [Int] {
        let jd0 = julian(y, m, d) - lon / (15 * 24)
        func noon(_ t: Double) -> Double { fix(12 - sun(jd0 + t / 24).eqt, 24) }
        func angleTime(_ angle: Double, _ t: Double, _ ccw: Bool) -> Double {
            let decl = sun(jd0 + t / 24).decl
            let x = (-sin(rad(angle)) - sin(rad(decl)) * sin(rad(lat))) / (cos(rad(decl)) * cos(rad(lat)))
            let v = deg(acos(max(-1, min(1, x)))) / 15
            return noon(t) + (ccw ? -v : v)
        }
        var t: [Double] = [5, 6, 12, 13, 18, 18]
        for _ in 0..<2 {
            let declA = sun(jd0 + t[3] / 24).decl
            let asrAlt = -deg(atan(1 / (1 + tan(rad(abs(lat - declA))))))
            t = [angleTime(18, t[0], true), angleTime(0.833, t[1], true), noon(t[2]),
                 angleTime(asrAlt, t[3], false), angleTime(0.833, t[4], false), angleTime(17, t[5], false)]
        }
        return (0..<6).map { k in Int(((t[k] + Double(tz) - lon / 15) * 60 + temkin[k] + yuvarla[k]).rounded()) }
    }

    static func hhmm(_ dk: Int) -> String { String(format: "%02d:%02d", (dk / 60) % 24, dk % 60) }

    private static let utc: Calendar = { var c = Calendar(identifier: .gregorian); c.timeZone = TimeZone(identifier: "UTC")!; return c }()
    static func trGun(_ date: Date) -> (Int, Int, Int) {
        let c = utc.dateComponents([.year, .month, .day], from: date.addingTimeInterval(Double(tz) * 3600))
        return (c.year!, c.month!, c.day!)
    }
    static func gunBasi(_ g: (Int, Int, Int)) -> Date {
        utc.date(from: DateComponents(year: g.0, month: g.1, day: g.2))!.addingTimeInterval(-Double(tz) * 3600)
    }

    struct Durum { let bugun: [Int]; let siradaki: Int; let zaman: Date; let yarin: Bool; let gunBasi: Date }

    static func durum(il no: Int, _ now: Date = Date()) -> Durum {
        let (lat, lon) = koord[max(1, min(81, no)) - 1]
        let g = trGun(now), base = gunBasi(g)
        let v = hesapla(g.0, g.1, g.2, lat: lat, lon: lon)
        for k in 0..<6 {
            let t = base.addingTimeInterval(Double(v[k]) * 60)
            if t > now { return Durum(bugun: v, siradaki: k, zaman: t, yarin: false, gunBasi: base) }
        }
        let y = trGun(now.addingTimeInterval(86400))
        let imsak = gunBasi(y).addingTimeInterval(Double(hesapla(y.0, y.1, y.2, lat: lat, lon: lon)[0]) * 60)
        return Durum(bugun: v, siradaki: 0, zaman: imsak, yarin: true, gunBasi: base)
    }
}
