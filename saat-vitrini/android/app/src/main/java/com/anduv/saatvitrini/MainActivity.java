package com.anduv.saatvitrini;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    // SES KORUYUCU (Mr. Anduv! standardı, 22 Kas 2026): uygulamaya dönünce web sesini uyandır
    @Override
    public void onResume() {
        super.onResume();
        try {
            if (getBridge() != null && getBridge().getWebView() != null) {
                final android.webkit.WebView w = getBridge().getWebView();
                w.onResume();
                w.resumeTimers();
                w.postDelayed(() -> w.evaluateJavascript("window.sesKurtar&&window.sesKurtar()", null), 250);
                w.postDelayed(() -> w.evaluateJavascript("window.sesKurtar&&window.sesKurtar()", null), 1000);
            }
        } catch (Exception e) { }
    }
}
