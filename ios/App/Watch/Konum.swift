// Saatin konumu: vakitler ve kıble bulunduğun yere göre (ilçe/semt hassasiyetinde) hesaplanır.
// Konum yalnızca saatte saklanır, hiçbir yere gönderilmez. İzin yoksa seçilen il merkezi kullanılır.
import Foundation
import CoreLocation
import WidgetKit

/// Vakit hesabında kullanılacak yer: GPS varsa o, yoksa seçili il merkezi
struct Yer {
    let lat: Double
    let lon: Double
    let ad: String
    let otomatik: Bool

    static func simdiki() -> Yer {
        let d = UserDefaults.standard
        let il = max(1, min(81, d.object(forKey: "il") as? Int ?? 34))
        let oto = d.object(forKey: "otomatikKonum") as? Bool ?? true
        if oto, let lat = d.object(forKey: "konumLat") as? Double, let lon = d.object(forKey: "konumLon") as? Double {
            let ad = (d.string(forKey: "konumAd") ?? "").isEmpty ? "Konumum" : d.string(forKey: "konumAd")!
            return Yer(lat: lat, lon: lon, ad: ad, otomatik: true)
        }
        let (lat, lon) = Vakit.koord[il - 1]
        return Yer(lat: lat, lon: lon, ad: Vakit.il[il - 1], otomatik: false)
    }
}

final class KonumYoneticisi: NSObject, ObservableObject, CLLocationManagerDelegate {
    static let shared = KonumYoneticisi()
    @Published var surum = 0          // konum değişince ekranlar yenilensin
    private let m = CLLocationManager()
    private let geo = CLGeocoder()

    override init() {
        super.init()
        m.delegate = self
        m.desiredAccuracy = kCLLocationAccuracyKilometer   // ilçe/semt için yeterli, pili korur
    }

    func guncelle() {
        guard UserDefaults.standard.object(forKey: "otomatikKonum") as? Bool ?? true else { return }
        switch m.authorizationStatus {
        case .notDetermined: m.requestWhenInUseAuthorization()
        case .authorizedWhenInUse, .authorizedAlways: m.requestLocation()
        default: break
        }
    }

    func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        if manager.authorizationStatus == .authorizedWhenInUse || manager.authorizationStatus == .authorizedAlways {
            manager.requestLocation()
        }
    }

    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        guard let l = locations.last else { return }
        let d = UserDefaults.standard
        let eskiLat = d.object(forKey: "konumLat") as? Double, eskiLon = d.object(forKey: "konumLon") as? Double
        // ~1 km'den az değiştiyse yeniden hesaplamaya gerek yok
        if let a = eskiLat, let b = eskiLon, abs(a - l.coordinate.latitude) < 0.01, abs(b - l.coordinate.longitude) < 0.01 { return }
        d.set(l.coordinate.latitude, forKey: "konumLat")
        d.set(l.coordinate.longitude, forKey: "konumLon")
        DispatchQueue.main.async { self.surum += 1 }
        WidgetCenter.shared.reloadAllTimelines()   // kadran parçası yeni konuma göre güncellensin
        // Semt / ilçe adı (internet varsa); yoksa "Konumum" yazar
        geo.reverseGeocodeLocation(l, preferredLocale: Locale(identifier: "tr_TR")) { yerler, _ in
            let p = yerler?.first
            let ad = p?.subAdministrativeArea ?? p?.subLocality ?? p?.locality ?? ""
            d.set(ad, forKey: "konumAd")
            DispatchQueue.main.async { self.surum += 1 }
        }
    }

    func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) { }
}
