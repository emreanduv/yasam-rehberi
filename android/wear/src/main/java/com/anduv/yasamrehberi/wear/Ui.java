package com.anduv.yasamrehberi.wear;

import android.content.Context;
import android.content.SharedPreferences;
import android.graphics.Typeface;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.util.TypedValue;
import android.view.Gravity;
import android.widget.TextView;

/** Ortak yardımcılar: renkler, yazılar, kayıt, titreşim (FM2010 çizgisi) */
final class Ui {
    private Ui() {}
    static final int ZEMIN = 0xFF14171A, PANEL = 0xFFEFE8D4, MUREKKEP = 0xFF1F2328, MUREKKEP2 = 0xFF5E5645,
            YESIL = 0xFF2E7D46, ALTIN = 0xFFD4A017, SARI = 0xFFE9C766, SOLUK = 0xFF9AA3AB;
    static final String[] ZIKIR = {"Sübhanallah", "Elhamdülillah", "Allahu Ekber", "Lâ ilâhe illallah", "Estağfirullah", "Salavat"};
    static final String YAPIM = "Bir Mr. Anduv! yapımıdır.";

    static SharedPreferences kayit(Context c) { return c.getSharedPreferences("yr", Context.MODE_PRIVATE); }
    static int il(Context c) { int i = kayit(c).getInt("il", 34); return i < 1 || i > 81 ? 34 : i; }

    static int dp(Context c, float v) {
        return (int) TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, v, c.getResources().getDisplayMetrics());
    }
    static TextView yazi(Context c, String s, float sp, int renk, boolean kalin) {
        TextView t = new TextView(c);
        t.setText(s);
        t.setTextSize(TypedValue.COMPLEX_UNIT_SP, sp);
        t.setTextColor(renk);
        t.setGravity(Gravity.CENTER);
        if (kalin) t.setTypeface(Typeface.create("sans-serif-condensed", Typeface.BOLD));
        return t;
    }
    static void titre(Context c, boolean guclu) {
        Vibrator v = c.getSystemService(Vibrator.class);
        if (v == null || !v.hasVibrator()) return;
        v.vibrate(guclu ? VibrationEffect.createWaveform(new long[]{0, 60, 60, 200}, -1)
                : VibrationEffect.createPredefined(VibrationEffect.EFFECT_TICK));
    }
}
