package com.anduv.yasamrehberi.widget;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.os.Build;
import android.os.SystemClock;
import android.widget.RemoteViews;

import com.anduv.yasamrehberi.MainActivity;
import com.anduv.yasamrehberi.R;

import org.json.JSONObject;

/**
 * Ana ekran widget'ı: sıradaki vakit, geri sayım ve günün vakitleri.
 * Konum: telefon uygulamasının kaydettiği konum (Capacitor Preferences → "settings".konum); yoksa İstanbul.
 * Hesap uygulama ve saatle aynı (Diyanet yöntemi, Vakit.java). İnternet gerekmez.
 */
public class VakitWidget extends AppWidgetProvider {
    static final String GUNCELLE = "com.anduv.yasamrehberi.widget.GUNCELLE";
    private static final int[] SATIR = {R.id.w_s0, R.id.w_s1, R.id.w_s2, R.id.w_s3, R.id.w_s4, R.id.w_s5};
    private static final int[] SAAT = {R.id.w_t0, R.id.w_t1, R.id.w_t2, R.id.w_t3, R.id.w_t4, R.id.w_t5};
    private static final int[] AD = {R.id.w_a0, R.id.w_a1, R.id.w_a2, R.id.w_a3, R.id.w_a4, R.id.w_a5};

    @Override
    public void onUpdate(Context c, AppWidgetManager m, int[] ids) { for (int id : ids) ciz(c, m, id); }

    @Override
    public void onReceive(Context c, Intent i) {
        super.onReceive(c, i);
        if (GUNCELLE.equals(i.getAction()) || Intent.ACTION_TIME_CHANGED.equals(i.getAction()) || Intent.ACTION_DATE_CHANGED.equals(i.getAction())) hepsiniGuncelle(c);
    }

    public static void hepsiniGuncelle(Context c) {
        AppWidgetManager m = AppWidgetManager.getInstance(c);
        for (int id : m.getAppWidgetIds(new ComponentName(c, VakitWidget.class))) ciz(c, m, id);
    }

    private static double[] konum(Context c) {
        try {
            SharedPreferences sp = c.getSharedPreferences("CapacitorStorage", Context.MODE_PRIVATE);
            String s = sp.getString("settings", null);
            if (s != null) {
                JSONObject k = new JSONObject(s).optJSONObject("konum");
                if (k != null && k.has("lat")) return new double[]{k.getDouble("lat"), k.getDouble("lon"), 1};
            }
        } catch (Exception ignored) { }
        return new double[]{Vakit.KOORD[33][0], Vakit.KOORD[33][1], 0};   // İstanbul
    }

    static void ciz(Context c, AppWidgetManager m, int id) {
        long now = System.currentTimeMillis();
        double[] k = konum(c);
        Vakit.Durum d = Vakit.durum(k[0], k[1], now);
        RemoteViews v = new RemoteViews(c.getPackageName(), R.layout.widget_vakit);
        v.setTextViewText(R.id.w_baslik, d.yarin ? "SIRADAKİ · YARIN" : "SIRADAKİ VAKİT");
        v.setTextViewText(R.id.w_ad, Vakit.AD[d.siradaki]);
        int[] g = Vakit.trGun(d.ms);
        v.setTextViewText(R.id.w_saat, Vakit.hhmm((int) Math.round((d.ms - Vakit.gunBasi(g)) / 60000.0)) + "'de");
        v.setTextViewText(R.id.w_yer, k[2] > 0 ? "Konumuna göre" : "İstanbul · uygulamada konumunu seç");
        // geri sayım (Android 7+ kronometre geri sayar; öncesinde "x sa y dk")
        if (Build.VERSION.SDK_INT >= 24) {
            v.setChronometer(R.id.w_sayac, SystemClock.elapsedRealtime() + (d.ms - now), null, true);
            v.setChronometerCountDown(R.id.w_sayac, true);
        } else {
            long dk = (d.ms - now) / 60000;
            v.setChronometer(R.id.w_sayac, SystemClock.elapsedRealtime(), (dk / 60) + " sa " + (dk % 60) + " dk", false);
        }
        for (int i = 0; i < 6; i++) {
            boolean on = !d.yarin && i == d.siradaki;
            v.setTextViewText(SAAT[i], Vakit.hhmm(d.bugun[i]));
            v.setInt(SATIR[i], "setBackgroundColor", on ? Color.parseColor("#E9C766") : (i % 2 == 1 ? Color.parseColor("#E7DFC8") : Color.parseColor("#EFE8D4")));
            int renk = Color.parseColor(!on && (Vakit.gunBasi(Vakit.trGun(now)) + d.bugun[i] * 60_000L) < now && !d.yarin ? "#7D7461" : "#1F2328");
            v.setTextColor(SAAT[i], renk); v.setTextColor(AD[i], renk);
        }
        Intent ac = new Intent(c, MainActivity.class).setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        v.setOnClickPendingIntent(R.id.w_kok, PendingIntent.getActivity(c, 0, ac, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE));
        m.updateAppWidget(id, v);
        // vakit girince yeniden çiz (tam zamanlı alarm izni gerekmez; birkaç saniye gecikebilir)
        AlarmManager am = (AlarmManager) c.getSystemService(Context.ALARM_SERVICE);
        PendingIntent pi = PendingIntent.getBroadcast(c, 1, new Intent(c, VakitWidget.class).setAction(GUNCELLE), PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        if (am != null) am.set(AlarmManager.RTC, d.ms + 1000, pi);
    }
}
