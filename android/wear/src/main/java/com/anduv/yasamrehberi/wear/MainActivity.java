package com.anduv.yasamrehberi.wear;

import android.app.Activity;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Handler;
import android.os.Looper;
import android.view.Gravity;
import android.view.ViewGroup;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;

/** Saat ana ekranı: sıradaki vakit, geri sayım, bugünün vakitleri, tesbihe devam */
public class MainActivity extends Activity {
    private final Handler h = new Handler(Looper.getMainLooper());
    private TextView kalan;
    private long hedefMs;

    private final Runnable saniye = new Runnable() {
        @Override public void run() {
            long now = System.currentTimeMillis();
            if (now >= hedefMs) { ciz(); return; }
            if (kalan != null) {
                long s = (hedefMs - now) / 1000;
                kalan.setText(String.format("%02d:%02d:%02d", s / 3600, (s % 3600) / 60, s % 60));
            }
            h.postDelayed(this, 1000);
        }
    };

    @Override protected void onResume() { super.onResume(); ciz(); }
    @Override protected void onPause() { super.onPause(); h.removeCallbacks(saniye); }

    private void ciz() {
        int il = Ui.il(this);
        long now = System.currentTimeMillis();
        Vakit.Durum d = Vakit.durum(il, now);
        hedefMs = d.ms;

        int yan = (int) (getResources().getDisplayMetrics().widthPixels * 0.12f);
        ScrollView kaydir = new ScrollView(this);
        kaydir.setBackgroundColor(Ui.ZEMIN);
        LinearLayout ana = new LinearLayout(this);
        ana.setOrientation(LinearLayout.VERTICAL);
        ana.setGravity(Gravity.CENTER_HORIZONTAL);
        ana.setPadding(yan, Ui.dp(this, 18), yan, Ui.dp(this, 28));
        kaydir.addView(ana);

        TextView ilYazi = Ui.yazi(this, Vakit.IL[il - 1] + " ›", 13, Ui.SOLUK, false);
        ilYazi.setPadding(0, Ui.dp(this, 4), 0, Ui.dp(this, 6));
        ilYazi.setOnClickListener(v -> startActivity(new Intent(this, IlActivity.class)));
        ana.addView(ilYazi);

        // Sıradaki vakit paneli
        LinearLayout panel = new LinearLayout(this);
        panel.setOrientation(LinearLayout.VERTICAL);
        panel.setBackgroundResource(R.drawable.panel);
        TextView serit = Ui.yazi(this, d.yarin ? "SIRADAKİ · YARIN" : "SIRADAKİ", 11, 0xFFFFFFFF, true);
        serit.setBackgroundResource(R.drawable.serit);
        serit.setPadding(0, Ui.dp(this, 3), 0, Ui.dp(this, 3));
        panel.addView(serit, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT));
        int dk = (int) ((d.ms - Vakit.gunBasi(Vakit.trGun(d.ms))) / 60000);
        panel.addView(Ui.yazi(this, Vakit.AD[d.siradaki] + " · " + Vakit.hhmm(dk), 18, Ui.MUREKKEP, true));
        kalan = Ui.yazi(this, "", 30, Ui.MUREKKEP, true);
        kalan.setPadding(0, 0, 0, Ui.dp(this, 6));
        panel.addView(kalan);
        ana.addView(panel, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT));

        // Bugünün vakitleri
        long base = Vakit.gunBasi(Vakit.trGun(now));
        for (int k = 0; k < 6; k++) {
            boolean gecti = base + d.bugun[k] * 60000L <= now;
            boolean sira = !d.yarin && k == d.siradaki;
            LinearLayout satir = new LinearLayout(this);
            satir.setPadding(Ui.dp(this, 8), Ui.dp(this, 4), Ui.dp(this, 8), Ui.dp(this, 4));
            if (sira) satir.setBackgroundColor(Ui.SARI);
            int renk = sira ? Ui.MUREKKEP : gecti ? Ui.SOLUK : Ui.PANEL;
            TextView ad = Ui.yazi(this, Vakit.AD[k], 14, renk, sira);
            ad.setGravity(Gravity.START);
            TextView saat = Ui.yazi(this, Vakit.hhmm(d.bugun[k]), 14, renk, sira || !gecti);
            saat.setGravity(Gravity.END);
            satir.addView(ad, new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1));
            satir.addView(saat, new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1));
            LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
            if (k == 0) lp.topMargin = Ui.dp(this, 8);
            ana.addView(satir, lp);
        }

        // Tesbihe devam
        SharedPreferences p = Ui.kayit(this);
        int n = p.getInt("t_n", 0), hedef = p.getInt("t_h", 33);
        TextView devam = Ui.yazi(this, (hedef > 0 ? n + "/" + hedef : String.valueOf(n)) + "  Tesbih ›", 15, Ui.SARI, true);
        devam.setBackgroundResource(R.drawable.kutu);
        devam.setPadding(0, Ui.dp(this, 10), 0, Ui.dp(this, 10));
        devam.setOnClickListener(v -> startActivity(new Intent(this, TesbihActivity.class)));
        LinearLayout.LayoutParams dlp = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        dlp.topMargin = Ui.dp(this, 10);
        ana.addView(devam, dlp);

        TextView yapim = Ui.yazi(this, Ui.YAPIM, 11, Ui.ALTIN, false);
        yapim.setPadding(0, Ui.dp(this, 10), 0, 0);
        ana.addView(yapim);

        setContentView(kaydir);
        h.removeCallbacks(saniye);
        h.post(saniye);
    }
}
