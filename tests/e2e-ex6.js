// End-to-end test of Save/Open through the real File menu (the file dialogs are stubbed). Run from the project folder:
//   env -u ELECTRON_RUN_AS_NODE node_modules/.bin/electron tests/e2e-ex6.js
// Prints STEP lines; see tests/README.md for what each should show. Uses the app's live `war/` build.
const electron = require('electron');
const { app, BrowserWindow: RealBrowserWindow, Menu, dialog } = electron;
const fs = require('fs'), path = require('path');
const { execFileSync } = require('child_process');
class BrowserWindow extends RealBrowserWindow { constructor(o) { super(Object.assign({}, o, { show: false })); } }
BrowserWindow.getAllWindows = RealBrowserWindow.getAllWindows; BrowserWindow.fromWebContents = RealBrowserWindow.fromWebContents;
electron.BrowserWindow = BrowserWindow;
const os = require('os');
const D = path.resolve(__dirname, '..');
const S = fs.mkdtempSync(path.join(os.tmpdir(), 'deriver-e2e-'));
const DESK = path.join(D, 'testfiles') + '/';
let nextOpen = null, nextSave = null; const warnings = [];
dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [nextOpen] });
dialog.showSaveDialog = async () => ({ canceled: false, filePath: nextSave });
dialog.showErrorBox = (t, m) => console.log('ERRORBOX', t, m);
dialog.showMessageBox = async (w, o) => { warnings.push(o.message + ' ' + (o.detail || '')); };
require('./seed').seedUserData(app);          // throwaway settings, never the user's own
require(path.join(D, 'main.js'));
const beans = require(path.join(D, 'beans.js')), ps = require(path.join(D, 'proofstate.js'));
const sleep = ms => new Promise(r => setTimeout(r, ms));
const menuItem = label => { for (const top of Menu.getApplicationMenu().items) for (const it of (top.submenu ? top.submenu.items : [])) if (it.label === label) return it; throw new Error('no menu item ' + label); };
const JAR = path.join(D, '..', 'cheerpj', 'cheerpjProject', 'Deriver20FatV17.jar');
const javaProof = f => execFileSync('java', ['-Djava.awt.headless=true', '-cp', JAR, 'jdk.nashorn.tools.Shell', path.join(D, 'tests', 'java', 'checkproof.js'), '--', f], { encoding: 'utf8' })
  .split('\n').filter(l => /^\s+\d+\.|EXCEPTION|DECODED|head|tail/.test(l)).map(l => l.replace(/\s+parser=.*/, '').trim());
const OUT = path.join(S, 'ex6_electron_saved.lgc'), OUTU = path.join(S, 'ex6_unchanged.lgc');
// the part proof Martin made in CheerpJ (what he did by hand in Electron)
const wanted = ps.extract(beans.readDocument(fs.readFileSync(DESK + 'Ex6InterpretationFromCheerpJ.lgc', 'utf8')));

app.whenReady().then(() => setTimeout(async () => {
  const win = RealBrowserWindow.getAllWindows()[0];
  const ev = c => win.webContents.executeJavaScript(c);
  const step = (n, x) => console.log('STEP', n, typeof x === 'string' ? x : JSON.stringify(x));
  const proofText = async () => { const p = await ev('window.getProof()'); return p.head.concat(p.tail).map(l => l.lineNo + ':' + (l.formula ? (l.formula.i || '?') : '-') + '[' + l.just.trim() + ']').join(' '); };
  try {
    nextOpen = DESK + 'Ex6.lgc'; await menuItem('Open…').click(); await sleep(4000);
    step('1 open Ex6.lgc: proof shown', await proofText());
    // unchanged save first: the old unreadable proof section must simply be preserved, with no warnings
    nextSave = OUTU; await menuItem('Save As…').click(); await sleep(1200);
    step('2 unchanged save: proof section preserved as it was', fs.readFileSync(OUTU, 'utf8').includes('proofs.bG'));
    step('2 unchanged save: warnings', warnings.slice());

    // 3. build the part proof and add a drawing item (what Martin did)
    await ev(`document.querySelectorAll('iframe')[0].contentWindow.deriverProof.set(${JSON.stringify(JSON.stringify({ head: wanted.head, tail: wanted.tail }))})`);
    await ev(`(function(){ var w=document.querySelectorAll('iframe')[2].contentWindow.document.getElementById('svgedit').contentWindow; w.augmentSvg(w.makeIndividual('a', 120, 110)); })()`);
    await sleep(3500);
    step('3 dirty dot after building proof + drawing', win.getTitle());
    nextSave = OUT; await menuItem('Save As…').click(); await sleep(1500);
    step('3 warnings after save (expect none)', warnings.slice());
    const saved = fs.readFileSync(OUT, 'utf8');
    step('3 saved file has a real proof model, no obfuscated one', { realProof: saved.includes('proofs.TProofTableModel'), obfuscatedLeft: saved.includes('proofs.bG') });
    step('3 java decodes the saved file', javaProof(OUT));

    nextOpen = OUT; await menuItem('Open…').click(); await sleep(4000);
    step('4 reopen in Electron: proof shown', await proofText());
  } catch (e) { console.log('TEST_ERROR', e.stack); }
  app.quit();
}, 10000));
