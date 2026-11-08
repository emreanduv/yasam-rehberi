// Yaşam Rehberi — saat kadranı parçası (watchOS) ve telefon ana ekran / kilit ekranı widget'ı (iOS): sıradaki vakit ve kalan süre.
// Aynı dosya iki hedefte derlenir: YasamRehberiKomplikasyon (watchOS) ve YasamRehberiWidget (iOS).
// Varsayılan: saatin konumu (otomatik). İstenirse kadrana eklerken bir il seçilir. Vakit hesabı uygulamayla aynı (Vakit.swift).
import WidgetKit
import SwiftUI
import AppIntents
import CoreLocation

// MARK: - İl seçimi (kadran ayarı)

struct IlSecenek: AppEntity {
    let id: Int
    static var typeDisplayRepresentation: TypeDisplayRepresentation = "İl"
    static var defaultQuery = IlSorgu()
    var displayRepresentation: DisplayRepresentation { DisplayRepresentation(title: "\(Vakit.il[id - 1])") }
}

struct IlSorgu: EntityQuery {
    func entities(for identifiers: [Int]) async throws -> [IlSecenek] {
        identifiers.filter { (1...81).contains($0) }.map { IlSecenek(id: $0) }
    }
    func suggestedEntities() async throws -> [IlSecenek] {
        (1...81).sorted { Vakit.il[$0 - 1].compare(Vakit.il[$1 - 1], locale: Locale(identifier: "tr_TR")) == .orderedAscending }
            .map { IlSecenek(id: $0) }
    }
    func defaultResult() async -> IlSecenek? { nil }   // boş = konumum (otomatik)
}

struct VakitAyari: WidgetConfigurationIntent {
    static var title: LocalizedStringResource = "Vakit"
    static var description = IntentDescription("Sıradaki namaz vakti ve kalan süre")
    @Parameter(title: "İl (boş: konumum)") var il: IlSecenek?
    init() {}
}

// MARK: - Zaman çizelgesi

struct VakitKaydi: TimelineEntry {
    let date: Date
    let ad: String       // sıradaki vaktin adı
    let saat: String     // HH:MM
    let zaman: Date      // sıradaki vaktin anı (geri sayım için)
    let ilAdi: String
    var bugun: [Int] = []    // günün altı vakti (dakika)
    var siradaki: Int = 2
    var yarin: Bool = false
}

struct VakitSaglayici: AppIntentTimelineProvider {
    func placeholder(in context: Context) -> VakitKaydi {
        VakitKaydi(date: .now, ad: "Öğle", saat: "12:53", zaman: .now.addingTimeInterval(3600), ilAdi: "İstanbul", bugun: [370, 457, 773, 932, 1078, 1160], siradaki: 2)
    }
    #if os(watchOS)
    // watchOS'ta kadran ayarı öneri listesinden seçilir: her il bir seçenek (alfabetik)
    func recommendations() -> [AppIntentRecommendation<VakitAyari>] {
        [AppIntentRecommendation(intent: VakitAyari(), description: "Konumum (otomatik)")] +
        (1...81).sorted { Vakit.il[$0 - 1].compare(Vakit.il[$1 - 1], locale: Locale(identifier: "tr_TR")) == .orderedAscending }
            .map { no in
                var ayar = VakitAyari()
                ayar.il = IlSecenek(id: no)
                return AppIntentRecommendation(intent: ayar, description: Vakit.il[no - 1])
            }
    }
    #endif
    func snapshot(for configuration: VakitAyari, in context: Context) async -> VakitKaydi {
        kayit(yer: yer(configuration), an: .now)
    }

    /// Seçili il varsa o; yoksa saatin bilinen konumu; o da yoksa saat uygulamasındaki il / İstanbul
    private func yer(_ c: VakitAyari) -> (lat: Double, lon: Double, ad: String) {
        if let il = c.il?.id {
            let (lat, lon) = Vakit.koord[il - 1]
            return (lat, lon, Vakit.il[il - 1])
        }
        let m = CLLocationManager()
        let izin = m.authorizationStatus
        if izin == .authorizedWhenInUse || izin == .authorizedAlways, let l = m.location {
            return (l.coordinate.latitude, l.coordinate.longitude, "Konumum")
        }
        let (lat, lon) = Vakit.koord[33]
        return (lat, lon, "İstanbul")
    }
    func timeline(for configuration: VakitAyari, in context: Context) async -> Timeline<VakitKaydi> {
        let y = yer(configuration)
        var kayitlar: [VakitKaydi] = []
        var an = Date()
        // Şimdiden başlayıp her vakit girişinde yeni kayıt: önümüzdeki ~24 saat
        for _ in 0..<7 {
            let k = kayit(yer: y, an: an)
            kayitlar.append(k)
            an = k.zaman.addingTimeInterval(1)
        }
        return Timeline(entries: kayitlar, policy: .after(an))
    }
    private func kayit(yer: (lat: Double, lon: Double, ad: String), an: Date) -> VakitKaydi {
        let d = Vakit.durum(lat: yer.lat, lon: yer.lon, an)
        let dk = Int((d.zaman.timeIntervalSince(Vakit.gunBasi(Vakit.trGun(d.zaman))) / 60).rounded())
        return VakitKaydi(date: an, ad: Vakit.ad[d.siradaki], saat: Vakit.hhmm(dk), zaman: d.zaman, ilAdi: yer.ad,
                          bugun: d.bugun, siradaki: d.siradaki, yarin: d.yarin)
    }
}

// MARK: - Görünüm

struct VakitGorunum: View {
    @Environment(\.widgetFamily) private var aile
    let k: VakitKaydi

    var body: some View {
        switch aile {
        case .accessoryInline:
            Text("\(k.ad) \(k.saat)")
        case .accessoryCircular:
            VStack(spacing: 0) {
                Text(k.ad).font(.system(size: 11, weight: .semibold)).minimumScaleFactor(0.7)
                Text(k.saat).font(.system(size: 15, weight: .bold)).monospacedDigit().minimumScaleFactor(0.7)
            }
        #if os(watchOS)
        case .accessoryCorner:
            Text(k.saat).font(.system(size: 14, weight: .bold)).monospacedDigit()
                .widgetLabel { Text(k.ad) }
        #else
        case .systemSmall:
            KucukWidget(k: k)
        case .systemMedium:
            OrtaWidget(k: k)
        #endif
        default: // accessoryRectangular
            VStack(alignment: .leading, spacing: 1) {
                Text("\(k.ad) · \(k.saat)").font(.system(size: 15, weight: .bold))
                Text(k.zaman, style: .timer).font(.system(size: 20, weight: .bold)).monospacedDigit()
                Text(k.ilAdi).font(.system(size: 11)).foregroundStyle(.secondary)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }
}

// MARK: - Telefon widget'ları (FM2010 çizgisi: koyu bar, yeşil bant, krem panel)

private enum Renk {
    static let bar = Color(red: 0.078, green: 0.090, blue: 0.102)
    static let bant = Color(red: 0.114, green: 0.302, blue: 0.212)
    static let panel = Color(red: 0.937, green: 0.910, blue: 0.831)
    static let altin = Color(red: 0.914, green: 0.780, blue: 0.400)
    static let murekkep = Color(red: 0.122, green: 0.137, blue: 0.157)
    static let soluk = Color(red: 0.490, green: 0.455, blue: 0.380)
}

struct ArkaPlan: View {
    @Environment(\.widgetFamily) private var aile
    var body: some View {
        switch aile {
        case .accessoryRectangular, .accessoryCircular, .accessoryInline: Color.clear
        #if os(watchOS)
        case .accessoryCorner: Color.clear
        #endif
        default: Renk.panel
        }
    }
}

#if os(iOS)
struct KucukWidget: View {
    let k: VakitKaydi
    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(k.yarin ? "SIRADAKİ · YARIN" : "SIRADAKİ VAKİT").font(.system(size: 10, weight: .heavy)).kerning(1)
                .foregroundStyle(.white).padding(.horizontal, 6).padding(.vertical, 3).background(Renk.bant)
            Text(k.ad).font(.system(size: 28, weight: .bold)).foregroundStyle(Renk.murekkep).minimumScaleFactor(0.6).lineLimit(1)
            Text("\(k.saat)'de").font(.system(size: 13)).foregroundStyle(Renk.soluk)
            Spacer(minLength: 0)
            Text(k.zaman, style: .timer).font(.system(size: 24, weight: .bold)).monospacedDigit().foregroundStyle(Renk.murekkep)
            Text(k.ilAdi).font(.system(size: 10, weight: .semibold)).foregroundStyle(Renk.soluk).lineLimit(1)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
    }
}

struct OrtaWidget: View {
    let k: VakitKaydi
    var body: some View {
        HStack(spacing: 12) {
            KucukWidget(k: k)
            VStack(spacing: 0) {
                ForEach(0..<6, id: \.self) { i in
                    let on = !k.yarin && i == k.siradaki
                    HStack {
                        Text(Vakit.ad[i]).font(.system(size: 13, weight: on ? .bold : .regular))
                        Spacer()
                        Text(k.bugun.count == 6 ? Vakit.hhmm(k.bugun[i]) : "--:--").font(.system(size: 13, weight: .bold)).monospacedDigit()
                    }
                    .foregroundStyle(Renk.murekkep)
                    .padding(.horizontal, 8).frame(maxHeight: .infinity)
                    .background(on ? Renk.altin : (i % 2 == 1 ? Renk.panel.opacity(0.0) : Color.black.opacity(0.04)))
                }
            }
            .overlay(Rectangle().stroke(Color.black.opacity(0.15), lineWidth: 1))
        }
    }
}
#endif

@main
struct YasamRehberiKomplikasyon: Widget {
    var body: some WidgetConfiguration {
        AppIntentConfiguration(kind: "YasamRehberiVakit", intent: VakitAyari.self, provider: VakitSaglayici()) { k in
            VakitGorunum(k: k).containerBackground(for: .widget) { ArkaPlan() }
        }
        .configurationDisplayName("Sıradaki vakit")
        .description("Sıradaki namaz vakti ve kalan süre")
        #if os(watchOS)
        .supportedFamilies([.accessoryRectangular, .accessoryCircular, .accessoryCorner, .accessoryInline])
        #else
        .supportedFamilies([.systemSmall, .systemMedium, .accessoryRectangular, .accessoryCircular, .accessoryInline])
        #endif
    }
}
