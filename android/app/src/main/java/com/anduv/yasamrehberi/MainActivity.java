package com.anduv.yasamrehberi;

import com.anduv.yasamrehberi.widget.VakitWidget;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    // Uygulamadan çıkarken ana ekran widget'ını tazele (konum değişmiş olabilir)
    @Override
    public void onPause() {
        super.onPause();
        try { VakitWidget.hepsiniGuncelle(this); } catch (Exception ignored) { }
    }
}
