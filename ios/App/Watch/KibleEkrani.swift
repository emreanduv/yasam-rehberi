// Saatte kıble: saatin pusulası (Series 5 ve sonrası) + seçili il merkezinden Kâbe'ye yön.
// Hizalanınca yeşile döner ve bir kez titrer. Konum bilgisi saatte kalır, hiçbir yere gönderilmez.
import SwiftUI
import CoreLocation
import WatchKit

private let kabe = (lat: 21.4225, lon: 39.8262)

/// Kuzeyden saat yönünde derece cinsinden kıble açısı
func kibleAcisi(lat: Double, lon: Double) -> Double {
    let r = Double.pi / 180
    let dl = (kabe.lon - lon) * r, f1 = lat * r, f2 = kabe.lat * r
    let y = sin(dl), x = cos(f1) * tan(f2) - sin(f1) * cos(dl)
    let a = atan2(y, x) / r
    return a < 0 ? a + 360 : a
}

final class Pusula: NSObject, ObservableObject, CLLocationManagerDelegate {
    @Published var yon: Double? = nil        // gerçek kuzeye göre (yoksa manyetik)
    @Published var destek = CLLocationManager.headingAvailable()
    private let m = CLLocationManager()

    override init() {
        super.init()
        m.delegate = self
        m.headingFilter = 1
    }
    func baslat() {
        guard destek else { return }
        if m.authorizationStatus == .notDetermined { m.requestWhenInUseAuthorization() }
        m.startUpdatingHeading()
    }
    func durdur() { m.stopUpdatingHeading() }
    func locationManager(_ manager: CLLocationManager, didUpdateHeading h: CLHeading) {
        guard h.headingAccuracy >= 0 else { return }
        // Gerçek kuzey yoksa Türkiye için manyetik sapma yaklaşık +6°
        yon = h.trueHeading >= 0 ? h.trueHeading : h.magneticHeading + 6
    }
}

struct KibleEkrani: View {
    @ObservedObject private var konum = KonumYoneticisi.shared
    @StateObject private var pusula = Pusula()
    @State private var hizaliTitredi = false

    var body: some View {
        let _ = konum.surum
        let yer = Yer.simdiki()
        let kible = kibleAcisi(lat: yer.lat, lon: yer.lon)
        let fark: Double? = pusula.yon.map { y in
            var d = (kible - y).truncatingRemainder(dividingBy: 360)
            if d > 180 { d -= 360 }
            if d < -180 { d += 360 }
            return d
        }
        let hizali = fark.map { abs($0) <= 5 } ?? false

        VStack(spacing: 4) {
            ZStack {
                Circle().fill(Renk.panel)
                Circle().stroke(hizali ? Renk.yesil : Renk.altin, lineWidth: 4)
                // Kâbe yönünü gösteren ok (pusula yoksa kuzeye göre sabit açı)
                Image(systemName: "location.north.fill")
                    .font(.system(size: 44, weight: .bold))
                    .foregroundStyle(hizali ? Renk.yesil : Renk.murekkep)
                    .rotationEffect(.degrees(fark ?? kible))
                    .animation(.easeOut(duration: 0.15), value: fark ?? kible)
                if pusula.yon == nil {
                    Text("K").font(.system(size: 12, weight: .bold)).foregroundStyle(.red)
                        .offset(y: -46)
                }
            }
            .frame(width: 112, height: 112)

            if let f = fark {
                Text(hizali ? "Kıbleye dönüksün" : "\(Int(abs(f).rounded()))° \(f > 0 ? "sağa" : "sola") dön")
                    .font(.system(size: 14, weight: .bold)).foregroundStyle(hizali ? Renk.yesil : Renk.panel)
            } else {
                Text(pusula.destek ? "Pusula hazırlanıyor…" : "Kuzeyden \(Int(kible.rounded()))°")
                    .font(.system(size: 14, weight: .bold)).foregroundStyle(Renk.panel)
            }
            Text("\(yer.ad) · kuzeyden \(Int(kible.rounded()))°")
                .font(.system(size: 11)).foregroundStyle(Renk.soluk)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Renk.zemin)
        .navigationTitle("Kıble")
        .onAppear { pusula.baslat() }
        .onDisappear { pusula.durdur() }
        .onChange(of: hizali) { yeni in
            if yeni && !hizaliTitredi { WKInterfaceDevice.current().play(.success); hizaliTitredi = true }
            if !yeni { hizaliTitredi = false }
        }
    }
}
