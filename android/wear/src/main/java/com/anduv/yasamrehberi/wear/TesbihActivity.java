package com.anduv.yasamrehberi.wear;

import android.app.Activity;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.view.Gravity;
import android.widget.LinearLayout;
import android.widget.TextView;

/** Tesbih: daireye dokun say; zikir adına dokun değiştir; daireye uzun bas sıfırla */
public class TesbihActivity extends Activity {
    private SharedPreferences p;
    private TextView zikir, sayi, alt;

    @Override protected void onCreate(Bundle b) {
        super.onCreate(b);
        p = Ui.kayit(this);
        LinearLayout ana = new LinearLayout(this);
        ana.setOrientation(LinearLayout.VERTICAL);
        ana.setGravity(Gravity.CENTER);
        ana.setBackgroundColor(Ui.ZEMIN);

        zikir = Ui.yazi(this, "", 14, Ui.SARI, true);
        zikir.setPadding(0, 0, 0, Ui.dp(this, 6));
        zikir.setOnClickListener(v -> {
            p.edit().putInt("t_z", (p.getInt("t_z", 0) + 1) % Ui.ZIKIR.length).putInt("t_n", 0).apply();
            guncelle();
        });
        ana.addView(zikir);

        int cap = (int) (getResources().getDisplayMetrics().widthPixels * 0.56f);
        LinearLayout daire = new LinearLayout(this);
        daire.setOrientation(LinearLayout.VERTICAL);
        daire.setGravity(Gravity.CENTER);
        daire.setBackgroundResource(R.drawable.tesbih_daire);
        sayi = Ui.yazi(this, "", 40, Ui.MUREKKEP, true);
        alt = Ui.yazi(this, "", 12, Ui.MUREKKEP2, false);
        daire.addView(sayi);
        daire.addView(alt);
        daire.setOnClickListener(v -> say());
        daire.setOnLongClickListener(v -> { p.edit().putInt("t_n", 0).apply(); Ui.titre(this, false); guncelle(); return true; });
        ana.addView(daire, new LinearLayout.LayoutParams(cap, cap));

        TextView ipucu = Ui.yazi(this, "Uzun bas: sıfırla", 10, Ui.SOLUK, false);
        ipucu.setPadding(0, Ui.dp(this, 6), 0, 0);
        ana.addView(ipucu);
        setContentView(ana);
        guncelle();
    }

    private void say() {
        int n = p.getInt("t_n", 0), h = p.getInt("t_h", 33);
        if (h > 0 && n >= h) n = 0;
        else { n += 1; Ui.titre(this, h > 0 && n == h); }
        p.edit().putInt("t_n", n).apply();
        guncelle();
    }

    private void guncelle() {
        int n = p.getInt("t_n", 0), h = p.getInt("t_h", 33);
        zikir.setText(Ui.ZIKIR[p.getInt("t_z", 0) % Ui.ZIKIR.length] + " ›");
        sayi.setText(String.valueOf(n));
        alt.setText(h > 0 ? (n >= h ? "Tamam" : "/ " + h) : "sınırsız");
    }
}
