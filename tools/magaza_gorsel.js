// App Store / Play ekran görüntüleri: node tools/magaza_gorsel.js <çıkış klasörü>
// Önce: python3 -m http.server 8766 --directory www   (konum İstanbul/Üsküdar olarak verilir)
const { chromium } = require('playwright');
const OUT = process.argv[2] || 'store/gorseller/v11';
const CIHAZ = { iphone: { viewport:{ width:402, height:874 }, deviceScaleFactor:3, isMobile:true, hasTouch:true },
                ipad:   { viewport:{ width:1032, height:1376 }, deviceScaleFactor:2, isMobile:true, hasTouch:true } };
const EKRAN = [
  ['1-sor',     '#/ara?q=' + encodeURIComponent('sabır'), 0],
  ['2-ayet',    '#/ayet/2/255', 0],
  ['3-bugun',   '#/', 0],
  ['4-kible',   '#/', 'kible'],
  ['5-sureler', '#/sureler', 0],
  ['6-tesbih',  '#/tesbih', 0],
  ['7-saat',    '#/saat', 0],
  ['8-carsi',   '#/carsi', 0],
  ['9-miras',   '#/miras', 0],
];
(async () => {
  const fs = require('fs'); const b = await chromium.launch();
  for (const [ad, c] of Object.entries(CIHAZ)) {
    fs.mkdirSync(`${OUT}/${ad}`, { recursive:true });
    const ctx = await b.newContext({ ...c, geolocation:{ latitude:41.0256, longitude:29.0153 }, permissions:['geolocation'], locale:'tr-TR', timezoneId:'Europe/Istanbul' });
    const p = await ctx.newPage(); const h = []; p.on('pageerror', e => h.push(e.message));
    await p.goto('http://localhost:8766/index.html'); await p.waitForTimeout(2500);
    // rehber kartlarını kapat, konumu ver
    await p.evaluate(() => { try { localStorage.setItem('yr.rehber', JSON.stringify({ kapali:true })); } catch {} });
    for (const t of ['Rehberi kapat', 'Anladım']) { const x = p.getByText(t, { exact:true }); if (await x.count()) await x.first().click().catch(()=>{}); }
    const k = p.getByText('Konumumu kullan'); if (await k.count()) { await k.first().click(); await p.waitForTimeout(2000); }
    for (const [dosya, yol, kaydir] of EKRAN) {
      await p.goto('http://localhost:8766/index.html' + yol); await p.waitForTimeout(2200);
      for (const t of ['Rehberi kapat', 'Anladım']) { const x = p.getByText(t, { exact:true }); if (await x.count()) await x.first().click().catch(()=>{}); }
      if (!kaydir) await p.evaluate(() => window.scrollTo(0, 0));
      if (kaydir) { await p.evaluate(id => { const e = document.getElementById(id); if (e) e.scrollIntoView({ block:'start' }); }, kaydir); await p.waitForTimeout(600); }
      await p.screenshot({ path:`${OUT}/${ad}/${dosya}.png` });
    }
    console.log(ad, h.length ? h.join(' | ') : 'hata yok'); await ctx.close();
  }
  await b.close();
})();
