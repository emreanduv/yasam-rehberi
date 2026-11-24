// App Store / Play ekran görüntüleri: node tools/magaza_gorsel.js <çıkış klasörü>
// Önce: python3 -m http.server 8766 --directory www   (konum İstanbul/Üsküdar olarak verilir)
const { chromium } = require('playwright');
const OUT = process.argv[2] || 'store/gorseller/v11';
const CIHAZ = { iphone: { viewport:{ width:402, height:874 }, deviceScaleFactor:3, isMobile:true, hasTouch:true },
                ipad:   { viewport:{ width:1032, height:1376 }, deviceScaleFactor:2, isMobile:true, hasTouch:true } };
const EKRAN = [
  ['1-bugun',   '#/', 0],
  ['2-sor',     '#/ara?q=' + encodeURIComponent('sabır'), 0],
  ['3-sure',    '#/sure/2', 0],
  ['4-ayet',    '#/ayet/2/255', 0],
  ['5-kible',   '#/', 'kible'],
  ['6-tesbih',  '#/tesbih', 0],
  ['7-hatim',   '#/hatim', 0],
  ['8-sofra',   '#/sofra', 0],
  ['9-miras',   '#/miras', 0],
  ['10-saat',   '#/saat', 0],
].filter(e => !process.env.SADECE || process.env.SADECE.split(',').includes(e[0]));
// Bugün sahnesi gün batımında çekilsin (İstanbul, kasım): saat sabit
const SAAT = process.env.SAAT || '2026-11-23T16:55:00+03:00';
(async () => {
  const fs = require('fs'); const b = await chromium.launch();
  for (const [ad, c] of Object.entries(CIHAZ)) {
    fs.mkdirSync(`${OUT}/${ad}`, { recursive:true });
    const ctx = await b.newContext({ ...c, geolocation:{ latitude:41.0256, longitude:29.0153 }, permissions:['geolocation'], locale:'tr-TR', timezoneId:'Europe/Istanbul' });
    const p = await ctx.newPage(); const h = []; p.on('pageerror', e => h.push(e.message));
    await p.clock.install({ time: new Date(SAAT) });
    await p.goto('http://localhost:8766/index.html'); await p.waitForTimeout(2500);
    // rehber kartlarını kapat, konumu ver
    await p.evaluate(() => { try { localStorage.setItem('yr.rehber', JSON.stringify({ kapali:true })); } catch {} });
    for (const t of ['Rehberi kapat', 'Anladım']) { const x = p.getByText(t, { exact:true }); if (await x.count()) await x.first().click().catch(()=>{}); }
    for (let i = 0; i < 3; i++) for (const t of ['Türkçe', 'Rehberi kapat', 'Anladım']) { const x = p.getByText(t, { exact:true }); if (await x.count()) await x.first().click().catch(()=>{}); }
    const k = p.getByText('Konumumu kullan'); if (await k.count()) { await k.first().click(); await p.waitForTimeout(2000); }
    for (const [dosya, yol, kaydir] of EKRAN) {
      await p.goto('http://localhost:8766/index.html' + yol); await p.waitForTimeout(2200);
      for (const t of ['Rehberi kapat', 'Anladım']) { const x = p.getByText(t, { exact:true }); if (await x.count()) await x.first().click().catch(()=>{}); }
      if (!kaydir) await p.evaluate(() => window.scrollTo(0, 0));
      if (kaydir) { await p.evaluate(id => { const e = document.getElementById(id); if (e) { e.scrollIntoView({ block:'start' }); window.scrollBy(0, -56); } }, kaydir); await p.waitForTimeout(600); }
      if (dosya === '6-tesbih') { const f = p.frameLocator('iframe'); for (let i = 0; i < 21; i++) await f.locator('#ring').click(); }
      if (dosya === '7-hatim') { for (const n of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]) await p.locator(`[data-act=cuz][data-n="${n}"]`).click().catch(() => {}); await p.waitForTimeout(400); await p.evaluate(() => { document.scrollingElement.scrollTop = 0; }); await p.waitForTimeout(300); }
      if (dosya === '8-sofra') {
        const fr = p.frames().find(f => f.url().includes('moduller/sofra'));
        await fr.evaluate(() => {
          S.mode = 'free'; U.screen = 'app'; U.tab = 'ov';
          const d = day(U.date); d.meals = { b: [], l: [], d: [], s: [] };
          const ekle = (slot, id, g) => { const f = FMAP[id], k = g / 100; d.meals[slot].push({ id: uid(), name: fname(f), g, kcal: f[3] * k, p: f[4] * k, c: f[5] * k, f: f[6] * k, fib: f[7] * k, src: 'db', al: [] }); };
          ekle('b', 'menemen', 200); ekle('b', 'beyazpeynir', 40); ekle('b', 'tamekmek', 60); ekle('b', 'siyahzeytin', 20);
          ekle('l', 'mercimek', 250); ekle('l', 'coban', 150); ekle('l', 'ayran', 200);
          ekle('s', 'elma', 150); ekle('s', 'ceviz', 15);
          d.water = 1500; d.steps = 6240; d.ex = [];
          try { localStorage.setItem(LS + '.tips', JSON.stringify({ ov: 1, meals: 1, water: 1, move: 1, weight: 1, health: 1, plan: 1, inbox: 1 })); } catch (e) {}
          save(U.date); render(); window.scrollTo(0, 0);
        });
        await p.waitForTimeout(500);
      }
      await p.clock.runFor(1500);
      await p.screenshot({ path:`${OUT}/${ad}/${dosya}.png` });
    }
    console.log(ad, h.length ? h.join(' | ') : 'hata yok'); await ctx.close();
  }
  await b.close();
})();
