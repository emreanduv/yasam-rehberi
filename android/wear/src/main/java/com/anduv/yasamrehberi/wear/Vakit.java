package com.anduv.yasamrehberi.wear;

/**
 * Namaz vakti hesabı — telefon uygulamasındaki www/js/vakit.js ile birebir aynı yöntem.
 * Diyanet: imsak 18°, yatsı 17°, ikindi tek gölge boyu; temkin güneş −7, öğle +5, ikindi +4, akşam +7 dk.
 * Sonuç: Türkiye saatiyle (UTC+3) gece yarısından itibaren dakika.
 */
public final class Vakit {
    private Vakit() {}

    public static final String[] AD = {"İmsak", "Güneş", "Öğle", "İkindi", "Akşam", "Yatsı"};
    public static final int TZ = 3;
    private static final double[] TEMKIN = {0, -7, 5, 4, 7, 0};
    private static final double[] YUVARLA = {0, 0, 0, 0.6, 0.6, 0.6};

    // 81 il: ad, enlem, boylam (plaka sırasıyla)
    public static final String[] IL = {"Adana","Adıyaman","Afyonkarahisar","Ağrı","Amasya","Ankara","Antalya","Artvin","Aydın","Balıkesir","Bilecik","Bingöl","Bitlis","Bolu","Burdur","Bursa","Çanakkale","Çankırı","Çorum","Denizli","Diyarbakır","Edirne","Elazığ","Erzincan","Erzurum","Eskişehir","Gaziantep","Giresun","Gümüşhane","Hakkari","Hatay","Isparta","Mersin","İstanbul","İzmir","Kars","Kastamonu","Kayseri","Kırklareli","Kırşehir","Kocaeli","Konya","Kütahya","Malatya","Manisa","Kahramanmaraş","Mardin","Muğla","Muş","Nevşehir","Niğde","Ordu","Rize","Sakarya","Samsun","Siirt","Sinop","Sivas","Tekirdağ","Tokat","Trabzon","Tunceli","Şanlıurfa","Uşak","Van","Yozgat","Zonguldak","Aksaray","Bayburt","Karaman","Kırıkkale","Batman","Şırnak","Bartın","Ardahan","Iğdır","Yalova","Karabük","Kilis","Osmaniye","Düzce"};
    public static final double[][] KOORD = {{37.00,35.32},{37.76,38.28},{38.76,30.54},{39.72,43.05},{40.65,35.83},{39.93,32.86},{36.89,30.71},{41.18,41.82},{37.85,27.85},{39.65,27.88},{40.14,29.98},{38.88,40.50},{38.40,42.11},{40.74,31.61},{37.72,30.29},{40.19,29.06},{40.15,26.41},{40.60,33.62},{40.55,34.95},{37.78,29.09},{37.91,40.24},{41.68,26.56},{38.67,39.22},{39.75,39.49},{39.90,41.27},{39.78,30.52},{37.07,37.38},{40.91,38.39},{40.46,39.48},{37.57,43.74},{36.20,36.16},{37.76,30.55},{36.81,34.64},{41.01,28.98},{38.42,27.14},{40.60,43.10},{41.38,33.78},{38.73,35.48},{41.73,27.22},{39.15,34.16},{40.77,29.92},{37.87,32.48},{39.42,29.98},{38.35,38.31},{38.61,27.43},{37.58,36.94},{37.31,40.74},{37.22,28.36},{38.74,41.49},{38.62,34.71},{37.97,34.68},{40.98,37.88},{41.02,40.52},{40.78,30.40},{41.29,36.33},{37.93,41.94},{42.03,35.15},{39.75,37.02},{40.98,27.51},{40.31,36.55},{41.00,39.72},{39.11,39.55},{37.16,38.79},{38.68,29.41},{38.49,43.38},{39.82,34.81},{41.45,31.79},{38.37,34.03},{40.26,40.23},{37.18,33.22},{39.85,33.51},{37.88,41.13},{37.52,42.46},{41.63,32.34},{41.11,42.70},{39.92,44.04},{40.66,29.27},{41.20,32.62},{36.72,37.12},{37.07,36.25},{40.84,31.16}};

    private static double sin(double d) { return Math.sin(Math.toRadians(d)); }
    private static double cos(double d) { return Math.cos(Math.toRadians(d)); }
    private static double tan(double d) { return Math.tan(Math.toRadians(d)); }
    private static double fix(double a, double b) { a -= b * Math.floor(a / b); return a < 0 ? a + b : a; }

    private static double julian(int y, int m, int d) {
        if (m <= 2) { y -= 1; m += 12; }
        double A = Math.floor(y / 100.0), B = 2 - A + Math.floor(A / 4);
        return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + B - 1524.5;
    }
    /** [eğim, zaman denklemi] */
    private static double[] sun(double jd) {
        double D = jd - 2451545.0;
        double g = fix(357.529 + 0.98560028 * D, 360), q = fix(280.459 + 0.98564736 * D, 360);
        double L = fix(q + 1.915 * sin(g) + 0.020 * sin(2 * g), 360), e = 23.439 - 0.00000036 * D;
        double RA = fix(Math.toDegrees(Math.atan2(cos(e) * sin(L), cos(L))) / 15, 24);
        return new double[]{Math.toDegrees(Math.asin(sin(e) * sin(L))), q / 15 - RA};
    }

    private static double noon(double jd0, double t) { return fix(12 - sun(jd0 + t / 24)[1], 24); }
    private static double angleTime(double jd0, double lat, double angle, double t, boolean ccw) {
        double decl = sun(jd0 + t / 24)[0];
        double x = (-sin(angle) - sin(decl) * sin(lat)) / (cos(decl) * cos(lat));
        double v = Math.toDegrees(Math.acos(Math.max(-1, Math.min(1, x)))) / 15;
        return noon(jd0, t) + (ccw ? -v : v);
    }

    /** Altı vakit, dakika cinsinden (Türkiye saati) */
    public static int[] hesapla(int y, int m, int d, double lat, double lon) {
        double jd0 = julian(y, m, d) - lon / (15 * 24);
        double[] t = {5, 6, 12, 13, 18, 18};
        for (int i = 0; i < 2; i++) {
            double declA = sun(jd0 + t[3] / 24)[0];
            double asrAlt = -Math.toDegrees(Math.atan(1 / (1 + tan(Math.abs(lat - declA)))));
            t = new double[]{
                angleTime(jd0, lat, 18, t[0], true), angleTime(jd0, lat, 0.833, t[1], true), noon(jd0, t[2]),
                angleTime(jd0, lat, asrAlt, t[3], false), angleTime(jd0, lat, 0.833, t[4], false), angleTime(jd0, lat, 17, t[5], false)};
        }
        int[] out = new int[6];
        for (int k = 0; k < 6; k++) out[k] = (int) Math.round((t[k] + TZ - lon / 15) * 60 + TEMKIN[k] + YUVARLA[k]);
        return out;
    }

    public static String hhmm(int dk) { return String.format("%02d:%02d", (dk / 60) % 24, dk % 60); }

    /** Türkiye takvim günü: {yıl, ay, gün} */
    public static int[] trGun(long ms) {
        java.util.Calendar c = java.util.Calendar.getInstance(java.util.TimeZone.getTimeZone("UTC"));
        c.setTimeInMillis(ms + TZ * 3600_000L);
        return new int[]{c.get(java.util.Calendar.YEAR), c.get(java.util.Calendar.MONTH) + 1, c.get(java.util.Calendar.DAY_OF_MONTH)};
    }
    public static long gunBasi(int[] g) {
        java.util.Calendar c = java.util.Calendar.getInstance(java.util.TimeZone.getTimeZone("UTC"));
        c.clear(); c.set(g[0], g[1] - 1, g[2]);
        return c.getTimeInMillis() - TZ * 3600_000L;
    }

    /** Sıradaki vakit: {indeks, zaman ms, yarın mı (1/0)} ve bugünün vakitleri */
    public static final class Durum { public int[] bugun; public int siradaki; public long ms; public boolean yarin; }

    public static Durum durum(int il, long now) {
        double lat = KOORD[il - 1][0], lon = KOORD[il - 1][1];
        int[] g = trGun(now);
        Durum r = new Durum();
        r.bugun = hesapla(g[0], g[1], g[2], lat, lon);
        long base = gunBasi(g);
        for (int k = 0; k < 6; k++) {
            long t = base + r.bugun[k] * 60_000L;
            if (t > now) { r.siradaki = k; r.ms = t; return r; }
        }
        int[] y = trGun(now + 86_400_000L);
        r.siradaki = 0; r.yarin = true;
        r.ms = gunBasi(y) + hesapla(y[0], y[1], y[2], lat, lon)[0] * 60_000L;
        return r;
    }
}
