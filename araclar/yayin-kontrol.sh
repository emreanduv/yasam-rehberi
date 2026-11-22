#!/usr/bin/env bash
# Yayın öncesi kontrol: biri tutmazsa derleme durur (CLAUDE.md "Yayın güvenliği").
# Kullanım: araclar/yayin-kontrol.sh <sürüm>
set -u
SURUM="${1:-}"
HATA=0
hata() { echo "::error::$1"; HATA=1; }
tamam() { echo "✓ $1"; }

DAL="${GITHUB_REF_NAME:-$(git rev-parse --abbrev-ref HEAD)}"
[ "$DAL" = "main" ] && tamam "dal: main" || hata "Derleme yalnız main dalından alınır (şu an: $DAL)"

var() { grep -rqE "$2" www package.json && tamam "$1" || hata "Eksik: $1"; }
var "rehber (ilk karşılaşma ipuçları)" "ipucu"
var "Nasıl kullanılır ekranı ve 'Rehberi baştan göster'" "Rehberi baştan göster"
var "uygulama içi puan (in-app-review)" "@capacitor-community/in-app-review"
var "paylaş (@capacitor/share)" "@capacitor/share"
var "Bize yaz (görüş e-postası)" "emreanduvart@gmail.com"
var "Verilerimi sil" "Verilerimi sil"
var "ekran uyanık kalsın (G75)" "isIdleTimerDisabled|wakeLock"

grep -q 'src="dil.js"' www/index.html && [ -f www/dil-en.js ] && tamam "dil seçimi (Türkçe/English) var" || hata "dil seçimi yok (www/dil.js + www/dil-en.js)"
grep -q 'const MAKER = "Bir Mr. Anduv! yapımıdır."' www/js/app.js && tamam "\"Bir Mr. Anduv! yapımıdır.\" ana ekranda" || hata "\"Bir Mr. Anduv! yapımıdır.\" yok"

if [ -n "$SURUM" ] && [ -f store/SON-SURUM ]; then
  SON=$(tr -d '[:space:]' < store/SON-SURUM)
  EN=$(printf '%s\n%s\n' "$SON" "$SURUM" | sort -V | tail -1)
  [ "$EN" = "$SURUM" ] && tamam "sürüm $SURUM ≥ son yayınlanan $SON" || hata "Sürüm $SURUM, son yayınlanandan ($SON) küçük: geri giden sürüm olmaz"
  PKG=$(node -p "require('./package.json').version" 2>/dev/null)
  [ "$PKG" = "$SURUM" ] && tamam "package.json sürümü $PKG" || hata "package.json sürümü ($PKG) derleme sürümüyle ($SURUM) aynı değil"
  grep -q "const VERSION = \"$SURUM\"" www/js/app.js && tamam "uygulama içi sürüm $SURUM" || hata "www/js/app.js VERSION derleme sürümüyle ($SURUM) aynı değil"
else
  hata "Sürüm verilmedi ya da store/SON-SURUM yok"
fi

python3 araclar/turkce-yazi-kontrol.py www && tamam "Türkçe yazı ve iOS işaretleri" || hata "Türkçe yazı / iOS işaret denetimi tutmadı"

# Ses koruyucu (CLAUDE.md "Ses koruyucu"): arka plandan dönünce ses geri gelsin
if grep -q 'ses-kurtarici.js' www/index.html && grep -q 'W.sesKurtar = later' www/ses-kurtarici.js && grep -q 'SesKoruyucu.shared.baslat' ios/App/App/AppDelegate.swift && grep -q 'window.sesKurtar' android/app/src/main/java/com/anduv/yasamrehberi/MainActivity.java; then echo "✓ ses koruyucu (JS + iOS + Android)"; else echo "::error::Ses koruyucu eksik (ses-kurtarici.js, AppDelegate SesKoruyucu, MainActivity onResume)"; HATA=1; hata=1; fi
# ses koruyucu sonu
[ $HATA = 0 ] && echo "Yayın öncesi kontrol geçti." || { echo "Yayın öncesi kontrol TUTMADI, derleme durdu."; exit 1; }
