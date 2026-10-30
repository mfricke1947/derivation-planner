// Tab / Derive settings: which tabs appear for which notation and setting, the dialog's automatic setup when a notation is chosen, Derive hiding
// the Wizard menu, and a file with a proof still opening fast (and keeping its proof on Save) when the Proofs tab is off. Throwaway settings folder.
//   env -u ELECTRON_RUN_AS_NODE node_modules/.bin/electron tests/e2e-tabs.js
const electron = require('electron');
const { app, BrowserWindow: RealBrowserWindow, Menu, dialog } = electron;
const fs = require('fs'), os = require('os'), path = require('path');
class BrowserWindow extends RealBrowserWindow { constructor(o) { super(Object.assign({}, o, { show: false })); } }
BrowserWindow.getAllWindows = RealBrowserWindow.getAllWindows; BrowserWindow.fromWebContents = RealBrowserWindow.fromWebContents;
electron.BrowserWindow = BrowserWindow;
const D = path.resolve(__dirname, '..');
const ud = fs.mkdtempSync(path.join(os.tmpdir(), 'deriver-userdata-')); app.setPath('userData', ud);
const S = fs.mkdtempSync(path.join(os.tmpdir(), 'deriver-tabs-'));
const prefsFile = JSON.parse(process.env.PREFS || '{}');
fs.writeFileSync(path.join(ud, 'preferences.json'), JSON.stringify(prefsFile));
let nextOpen = null, nextSave = null;
dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [nextOpen] });
dialog.showSaveDialog = async () => ({ canceled: false, filePath: nextSave });
dialog.showErrorBox = (t, m) => console.log('ERRORBOX', t, m);
dialog.showMessageBox = async () => ({ response: 0 });
require(path.join(D, 'main.js'));
const menuItem = label => { for (const top of Menu.getApplicationMenu().items) for (const it of (top.submenu ? top.submenu.items : [])) if (it.label === label) return it; throw new Error('no menu item ' + label); };
const sleep = ms => new Promise(r => setTimeout(r, ms));
app.whenReady().then(() => setTimeout(async () => {
  const win = RealBrowserWindow.getAllWindows()[0];
  const ev = c => win.webContents.executeJavaScript(c);
  const step = (n, x) => console.log('STEP', n, typeof x === 'string' ? x : JSON.stringify(x));
  try {
    step('tabs for ' + JSON.stringify(prefsFile), await ev(`Array.from(document.querySelectorAll('#tabs button')).map(b=>b.textContent)`));
    if (process.env.DIALOG) {
      await menuItem('Preferences…').click(); await sleep(2000);
      const dlg = RealBrowserWindow.getAllWindows().find(w => w.getTitle() === 'Derivation Planner Preferences');
      const dv = c => dlg.webContents.executeJavaScript(c);
      const state = () => dv(`(function(){ var o={}; ['tabProofs','tabTrees','tabInterpretations','tabSymbolize','gamesTab','fDerive'].forEach(function(k){ var e=document.getElementById(k); o[k]=e.checked+(e.disabled?'(disabled)':''); }); return o; })()`);
      step('dialog: current', await state());
      for (const p of ['howson', 'stegeman', 'bergmann', 'girle']) {
        await dv(`(function(){ var s=document.getElementById('fParser'); s.value='${p}'; s.dispatchEvent(new Event('change')); })()`);
        step('dialog: after choosing ' + p, await state());
      }
    }
    if (process.env.DERIVE) {
      await sleep(2000);
      step('Wizard menu visible', await ev(`Array.from(document.querySelectorAll('iframe')[0].contentDocument.querySelectorAll('.gwt-MenuItem')).filter(i=>i.textContent.trim()==='Wizard').map(i=>i.style.display!=='none' && i.offsetParent!==null)`));
    }
    if (process.env.OPEN) {
      const t0 = Date.now();
      nextOpen = path.join(D, 'testfiles', 'HalfFinished.lgc'); await menuItem('Open…').click();
      await ev(`window.getActiveJournalHTML()`);
      step('opened a file with proof+tree+drawing in ms', Date.now() - t0);
      await sleep(3000);
      const out = path.join(S, 'out.lgc'); nextSave = out; await menuItem('Save As…').click(); await sleep(1500);
      const orig = fs.readFileSync(nextOpen, 'utf8'), saved = fs.readFileSync(out, 'utf8');
      const sect = (x, re) => (re.exec(x) || [''])[0];
      step('Proofs tab off: the file\'s proof is kept byte-for-byte on Save', sect(orig, /<object class="us\.softoption\.proofs\.TProofTableModel"[\s\S]*?\n <\/object>/) === sect(saved, /<object class="us\.softoption\.proofs\.TProofTableModel"[\s\S]*?\n <\/object>/) && sect(saved, /TProofTableModel/) !== '');
    }
  } catch (e) { console.log('FAIL', e); }
  app.quit();
}, 4500));
