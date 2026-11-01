// Yaşam Rehberi — saat kadranı parçası (komplikasyon): sıradaki vakit ve kalan süre.
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
}

struct VakitSaglayici: AppIntentTimelineProvider {
    func placeholder(in context: Context) -> VakitKaydi {
        VakitKaydi(date: .now, ad: "Öğle", saat: "12:53", zaman: .now.addingTimeInterval(3600), ilAdi: "İstanbul")
    }
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
        if m.isAuthorizedForWidgetUpdates, let l = m.location {
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
        return VakitKaydi(date: an, ad: Vakit.ad[d.siradaki], saat: Vakit.hhmm(dk), zaman: d.zaman, ilAdi: yer.ad)
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
        case .accessoryCorner:
            Text(k.saat).font(.system(size: 14, weight: .bold)).monospacedDigit()
                .widgetLabel { Text(k.ad) }
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

@main
struct YasamRehberiKomplikasyon: Widget {
    var body: some WidgetConfiguration {
        AppIntentConfiguration(kind: "YasamRehberiVakit", intent: VakitAyari.self, provider: VakitSaglayici()) { k in
            VakitGorunum(k: k).containerBackground(for: .widget) { Color.clear }
        }
        .configurationDisplayName("Sıradaki vakit")
        .description("Sıradaki namaz vakti ve kalan süre")
        .supportedFamilies([.accessoryRectangular, .accessoryCircular, .accessoryCorner, .accessoryInline])
    }
}
