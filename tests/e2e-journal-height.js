// The Journal on every tab runs down to the bottom of the window (never shorter than 140px; a shorter window scrolls).
// Resizes the window to three heights and measures each tab. Uses a throwaway settings folder.
//   env -u ELECTRON_RUN_AS_NODE node_modules/.bin/electron tests/e2e-journal-height.js
const electron = require('electron');
const { app, BrowserWindow: RealBrowserWindow } = electron;
const fs = require('fs'), os = require('os'), path = require('path');
class BrowserWindow extends RealBrowserWindow { constructor(o) { super(Object.assign({}, o, { show: false })); } }
BrowserWindow.getAllWindows = RealBrowserWindow.getAllWindows; BrowserWindow.fromWebContents = RealBrowserWindow.fromWebContents;
electron.BrowserWindow = BrowserWindow;
const D = path.resolve(__dirname, '..');
const { seedUserData } = require('./seed');
seedUserData(app);
require(path.join(D, 'main.js'));
const sleep = ms => new Promise(r => setTimeout(r, ms));
const SHOT = process.env.SHOTS;      // optional folder for screenshots

app.whenReady().then(() => setTimeout(async () => {
  const win = RealBrowserWindow.getAllWindows()[0];
  const ev = c => win.webContents.executeJavaScript(c);
  let allOk = true;
  try {
    // some real text, so the Journal's extent is visible in screenshots
    const para = n => `<p>Paragraph ${n}. If Arthur is a nincompoop then Charles is a philosopher, and Beryl is a philosopher or Charles is a philosopher.</p>`;
    await ev(`window.setActiveJournalHTML(${JSON.stringify(Array.from({ length: 30 }, (_, i) => para(i + 1)).join(''))})`);
    for (const h of [1400, 1000, 560]) {
      win.setContentSize(1300, h); await sleep(2200);
      for (const [i, name] of ['Proofs', 'Trees', 'Interpretations', 'Symbolize'].entries()) {
        await ev(`Array.from(document.querySelectorAll('#tabs button')).find(b=>b.textContent==='${name}').click()`); await sleep(1500);
        const m = JSON.parse(await ev(`(function(){
          var f=document.querySelectorAll('iframe')[${i}], w=f.contentWindow, d=f.contentDocument;
          var box=d.getElementById('journal')||d.getElementById('journalDiv'); var el=box&&(box.querySelector('iframe')||box.querySelector('textarea'));
          var r=el.getBoundingClientRect(); return JSON.stringify({ viewport: w.innerHeight, top: Math.round(r.top + w.pageYOffset), height: Math.round(r.height), bottomGap: Math.round(w.innerHeight - (r.bottom)), scrolls: d.documentElement.scrollHeight > w.innerHeight + 1 });})()`));
        const fillsToBottom = Math.abs(m.bottomGap - 6) <= 2;        // runs to the bottom, leaving the 6px gap
        const atMinimum = m.height === 140;                          // window too short: minimum, page scrolls
        const ok = fillsToBottom || (atMinimum && m.scrolls);
        if (!ok) allOk = false;
        console.log('STEP', `window height ${h}`.padEnd(18), name.padEnd(16), JSON.stringify(m), ok ? (fillsToBottom ? 'OK fills to bottom' : 'OK at minimum, page scrolls') : 'FAIL');
        if (SHOT && h === 1000) fs.writeFileSync(path.join(SHOT, `shot_${name}_${h}.png`), (await win.webContents.capturePage()).toPNG());
      }
    }
    console.log('STEP all measurements OK:', allOk);
  } catch (e) { console.log('TEST_ERROR', e.stack); }
  app.quit();
}, 10000));
