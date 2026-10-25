#!/usr/bin/env bash
# Android paketini imzalar (Google Play'e yüklenecek .aab)
#   bash imzala.sh
# İlk çalıştırmada yükleme anahtarını oluşturur; şifreyi SEN belirlersin.
# Anahtar git'e girmez (imza-anahtari/ .gitignore'da). Mutlaka Google Drive'a yedekle.
set -e
cd "$(dirname "$0")"
REPO="emreanduv/yasam-rehberi"
KS="imza-anahtari/yasam-rehberi-upload.jks"
ALIAS="yasamrehberi"
mkdir -p imza-anahtari

command -v keytool >/dev/null || { echo "keytool yok: Java (JDK) kurulu olmalı (Malazgirt'i imzaladığın bilgisayarda vardır)."; exit 1; }

if [ ! -f "$KS" ]; then
  echo "▸ Yeni yükleme anahtarı oluşturuluyor. Şifreyi kendin belirle ve bir yere not et."
  keytool -genkeypair -v -keystore "$KS" -alias "$ALIAS" -keyalg RSA -keysize 2048 \
    -validity 10000 -dname "CN=Mr. Anduv!, O=Mr. Anduv!, C=TR"
  echo "▸ ÖNEMLİ: $KS dosyasını şifresiyle birlikte Google Drive'a yedekle. Kaybolursa güncelleme çıkaramazsın."
fi

echo "▸ GitHub'daki son imzasız paket bulunuyor…"
NAME=$(curl -fsSL "https://api.github.com/repos/$REPO/contents/android?ref=builds" \
  | python3 -c "import json,sys; print(sorted(x['name'] for x in json.load(sys.stdin) if x['name'].endswith('.aab'))[-1])")
curl -fsSL -o "imza-anahtari/$NAME" "https://raw.githubusercontent.com/$REPO/builds/android/$NAME"

OUT="imza-anahtari/${NAME%-unsigned.aab}-imzali.aab"
cp "imza-anahtari/$NAME" "$OUT"
echo "▸ İmzalanıyor: $OUT"
jarsigner -sigalg SHA256withRSA -digestalg SHA-256 -keystore "$KS" "$OUT" "$ALIAS"
rm -f "imza-anahtari/$NAME"

echo
echo "✓ Hazır: $(pwd)/$OUT"
echo "  Bu dosyayı Play Console'a yükleyeceğiz."
keytool -list -keystore "$KS" -alias "$ALIAS" 2>/dev/null | grep -i "SHA-256\|SHA256" || true
