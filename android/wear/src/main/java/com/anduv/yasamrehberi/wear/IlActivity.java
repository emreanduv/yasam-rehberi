package com.anduv.yasamrehberi.wear;

import android.app.Activity;
import android.os.Bundle;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;
import java.text.Collator;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/** İl seçimi: vakitler seçilen il merkezine göre hesaplanır */
public class IlActivity extends Activity {
    @Override protected void onCreate(Bundle b) {
        super.onCreate(b);
        int secili = Ui.il(this);
        List<Integer> sira = new ArrayList<>();
        for (int i = 1; i <= 81; i++) sira.add(i);
        Collator tr = Collator.getInstance(new Locale("tr", "TR"));
        sira.sort((a, c) -> tr.compare(Vakit.IL[a - 1], Vakit.IL[c - 1]));

        int yan = (int) (getResources().getDisplayMetrics().widthPixels * 0.14f);
        ScrollView kaydir = new ScrollView(this);
        kaydir.setBackgroundColor(Ui.ZEMIN);
        LinearLayout liste = new LinearLayout(this);
        liste.setOrientation(LinearLayout.VERTICAL);
        liste.setPadding(yan, Ui.dp(this, 24), yan, Ui.dp(this, 40));
        kaydir.addView(liste);
        liste.addView(Ui.yazi(this, "İL SEÇ", 12, Ui.SOLUK, true));
        for (int no : sira) {
            boolean on = no == secili;
            TextView t = Ui.yazi(this, Vakit.IL[no - 1] + (on ? "  ✓" : ""), 16, on ? Ui.SARI : Ui.PANEL, on);
            t.setPadding(0, Ui.dp(this, 9), 0, Ui.dp(this, 9));
            t.setOnClickListener(v -> { Ui.kayit(this).edit().putInt("il", no).apply(); finish(); });
            liste.addView(t);
        }
        setContentView(kaydir);
        if (secili > 0) kaydir.post(() -> {
            int idx = sira.indexOf(secili) + 1;
            if (idx < liste.getChildCount()) kaydir.scrollTo(0, liste.getChildAt(idx).getTop() - Ui.dp(this, 40));
        });
    }
}
