// Saat ana ekranı: sıradaki vakit, geri sayım, bugünün vakitleri, tesbihe devam (FM2010 çizgisi)
import SwiftUI
import WatchKit

enum Renk {
    static let zemin = Color(red: 0.08, green: 0.09, blue: 0.10)
    static let panel = Color(red: 0.94, green: 0.91, blue: 0.83)
    static let murekkep = Color(red: 0.12, green: 0.14, blue: 0.16)
    static let murekkep2 = Color(red: 0.37, green: 0.34, blue: 0.27)
    static let yesil = Color(red: 0.18, green: 0.49, blue: 0.27)
    static let altin = Color(red: 0.83, green: 0.63, blue: 0.09)
    static let sari = Color(red: 0.91, green: 0.78, blue: 0.40)
    static let kutu = Color(red: 0.16, green: 0.21, blue: 0.25)
    static let soluk = Color(red: 0.60, green: 0.64, blue: 0.67)
}

let zikirler = ["Sübhanallah", "Elhamdülillah", "Allahu Ekber", "Lâ ilâhe illallah", "Estağfirullah", "Salavat"]

struct AnaEkran: View {
    @AppStorage("il") private var il = 34
    @AppStorage("t_n") private var sayi = 0
    @AppStorage("t_h") private var hedef = 33

    var body: some View {
        NavigationStack {
            TimelineView(.periodic(from: .now, by: 1)) { ctx in
                let d = Vakit.durum(il: il, ctx.date)
                ScrollView {
                    VStack(spacing: 6) {
                        NavigationLink { IlSecimi() } label: {
                            Text("\(Vakit.il[il - 1]) ›").font(.footnote).foregroundStyle(Renk.soluk)
                        }.buttonStyle(.plain)

                        // Sıradaki vakit
                        VStack(spacing: 0) {
                            Text(d.yarin ? "SIRADAKİ · YARIN" : "SIRADAKİ")
                                .font(.system(size: 11, weight: .bold)).foregroundStyle(.white)
                                .frame(maxWidth: .infinity).padding(.vertical, 3).background(Renk.yesil)
                            Text("\(Vakit.ad[d.siradaki]) · \(saat(d.zaman))")
                                .font(.system(size: 17, weight: .bold)).foregroundStyle(Renk.murekkep).padding(.top, 4)
                            Text(kalan(d.zaman, ctx.date))
                                .font(.system(size: 30, weight: .bold).monospacedDigit())
                                .foregroundStyle(Renk.murekkep).padding(.bottom, 6)
                        }
                        .background(Renk.panel).clipShape(RoundedRectangle(cornerRadius: 8))

                        // Bugünün vakitleri
                        VStack(spacing: 0) {
                            ForEach(0..<6, id: \.self) { k in
                                let gecti = d.gunBasi.addingTimeInterval(Double(d.bugun[k]) * 60) <= ctx.date
                                let sira = !d.yarin && k == d.siradaki
                                HStack {
                                    Text(Vakit.ad[k])
                                    Spacer()
                                    Text(Vakit.hhmm(d.bugun[k])).monospacedDigit()
                                }
                                .font(.system(size: 14, weight: sira ? .bold : .regular))
                                .foregroundStyle(sira ? Renk.murekkep : gecti ? Renk.soluk : Renk.panel)
                                .padding(.horizontal, 8).padding(.vertical, 3)
                                .background(sira ? Renk.sari : Color.clear)
                            }
                        }

                        NavigationLink { TesbihEkrani() } label: {
                            Text("\(hedef > 0 ? "\(sayi)/\(hedef)" : "\(sayi)")  Tesbih ›")
                                .font(.system(size: 15, weight: .bold)).foregroundStyle(Renk.sari)
                                .frame(maxWidth: .infinity).padding(.vertical, 9)
                                .background(Renk.kutu).clipShape(RoundedRectangle(cornerRadius: 8))
                        }.buttonStyle(.plain)

                        Text("Bir Mr. Anduv! yapımıdır.").font(.system(size: 11)).foregroundStyle(Renk.altin)
                    }
                }
            }
            .background(Renk.zemin)
        }
    }

    private func saat(_ t: Date) -> String {
        Vakit.hhmm(Int((t.timeIntervalSince(Vakit.gunBasi(Vakit.trGun(t))) / 60).rounded()))
    }
    private func kalan(_ t: Date, _ now: Date) -> String {
        let s = max(0, Int(t.timeIntervalSince(now)))
        return String(format: "%02d:%02d:%02d", s / 3600, (s % 3600) / 60, s % 60)
    }
}

struct TesbihEkrani: View {
    @AppStorage("t_n") private var sayi = 0
    @AppStorage("t_h") private var hedef = 33
    @AppStorage("t_z") private var zikir = 0

    var body: some View {
        VStack(spacing: 6) {
            Button { zikir = (zikir + 1) % zikirler.count; sayi = 0 } label: {
                Text("\(zikirler[zikir % zikirler.count]) ›").font(.system(size: 14, weight: .bold)).foregroundStyle(Renk.sari)
            }.buttonStyle(.plain)

            Button(action: say) {
                VStack(spacing: 2) {
                    Text("\(sayi)").font(.system(size: 40, weight: .bold).monospacedDigit()).foregroundStyle(Renk.murekkep)
                    Text(hedef > 0 ? (sayi >= hedef ? "Tamam" : "/ \(hedef)") : "sınırsız")
                        .font(.system(size: 12)).foregroundStyle(Renk.murekkep2)
                }
                .frame(width: 110, height: 110)
                .background(Circle().fill(Renk.panel))
                .overlay(Circle().stroke(Renk.altin, lineWidth: 5))
            }
            .buttonStyle(.plain)
            .simultaneousGesture(LongPressGesture(minimumDuration: 0.8).onEnded { _ in
                sayi = 0; WKInterfaceDevice.current().play(.click)
            })

            Text("Uzun bas: sıfırla").font(.system(size: 10)).foregroundStyle(Renk.soluk)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Renk.zemin)
    }

    private func say() {
        if hedef > 0 && sayi >= hedef { sayi = 0; return }
        sayi += 1
        WKInterfaceDevice.current().play(hedef > 0 && sayi == hedef ? .success : .click)
    }
}

struct IlSecimi: View {
    @AppStorage("il") private var il = 34
    @Environment(\.dismiss) private var dismiss
    private let sirali = (1...81).sorted {
        Vakit.il[$0 - 1].compare(Vakit.il[$1 - 1], locale: Locale(identifier: "tr_TR")) == .orderedAscending
    }

    var body: some View {
        List(sirali, id: \.self) { no in
            Button { il = no; dismiss() } label: {
                HStack {
                    Text(Vakit.il[no - 1]).foregroundStyle(no == il ? Renk.sari : Renk.panel)
                    if no == il { Spacer(); Image(systemName: "checkmark").foregroundStyle(Renk.sari) }
                }
            }
        }
        .navigationTitle("İl seç")
    }
}
