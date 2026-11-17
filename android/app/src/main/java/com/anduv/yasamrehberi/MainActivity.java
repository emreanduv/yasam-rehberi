package com.anduv.yasamrehberi;

import com.anduv.yasamrehberi.widget.VakitWidget;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    // Ekran uyanık kalsın: oyun/uygulama açıkken dokunulmasa da kararmasın (maç izlerken)
    @Override
    public void onCreate(android.os.Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().addFlags(android.view.WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
    }
    // Uygulamadan çıkarken ana ekran widget'ını tazele (konum değişmiş olabilir)
    @Override
    public void onPause() {
        super.onPause();
        try { VakitWidget.hepsiniGuncelle(this); } catch (Exception ignored) { }
    }
}
