// End-to-end test of Save/Open through the real File menu (the file dialogs are stubbed). Run from the project folder:
//   env -u ELECTRON_RUN_AS_NODE node_modules/.bin/electron tests/e2e-halffinished.js
// Prints STEP lines; see tests/README.md for what each should show. Uses the app's live `war/` build.
const electron = require('electron');
const { app, BrowserWindow: RealBrowserWindow, Menu, dialog } = electron;
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
class BrowserWindow extends RealBrowserWindow { constructor(o) { super(Object.assign({}, o, { show: false })); } }
BrowserWindow.getAllWindows = RealBrowserWindow.getAllWindows; BrowserWindow.fromWebContents = RealBrowserWindow.fromWebContents;
electron.BrowserWindow = BrowserWindow;

const os = require('os');
const D = path.resolve(__dirname, '..');                          // the DeriverElectron folder
const S = fs.mkdtempSync(path.join(os.tmpdir(), 'deriver-e2e-'));   // scratch output (files this test saves)
const SRC = path.join(D, 'testfiles', 'HalfFinished.lgc');
const OUT1 = path.join(S, 'e2e_tree1.lgc'), OUT2 = path.join(S, 'e2e_tree2.lgc');
let nextOpen = null, nextSave = null;
dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [nextOpen] });
dialog.showSaveDialog = async () => ({ canceled: false, filePath: nextSave });
dialog.showErrorBox = (t, m) => console.log('ERRORBOX', t, m);
dialog.showMessageBox = async (w, o) => console.log('MESSAGEBOX', o.message);
require('./seed').seedUserData(app);          // throwaway settings, never the user's own
require(path.join(D, 'main.js'));
const sleep = ms => new Promise(r => setTimeout(r, ms));
const menuItem = label => { for (const top of Menu.getApplicationMenu().items) for (const it of (top.submenu ? top.submenu.items : [])) if (it.label === label) return it; throw new Error('no menu item ' + label); };
const JAR = path.join(D, '..', 'cheerpj', 'cheerpjProject', 'Deriver20FatV17.jar');
const javaProof = f => execFileSync('java', ['-Djava.awt.headless=true', '-cp', JAR, 'jdk.nashorn.tools.Shell', path.join(D, 'tests', 'java', 'checkproof.js'), '--', f], { encoding: 'utf8' })
  .split('\n').filter(l => /^\s+\d+\.|DECODE|STOPPED|DECODED|head|tail/.test(l)).map(l => l.replace(/\s+parser=.*/, '').trim());
const elementOf = (x, re) => { const m = re.exec(x); return m ? m[0] : null; };

app.whenReady().then(() => setTimeout(async () => {
  const win = RealBrowserWindow.getAllWindows()[0];
  const ev = c => win.webContents.executeJavaScript(c);
  const step = (n, x) => console.log('STEP', n, typeof x === 'string' ? x : JSON.stringify(x));
  const proofNow = async () => { const p = await ev('window.getProof()'); return p.head.map(l => l.lineNo + ':' + (l.formula ? l.formula.i : '-') + '[' + l.just.trim() + ']').join(' ') + ' || ' + p.tail.map(l => l.lineNo + ':' + (l.formula ? l.formula.i : '-') + '[' + l.just.trim() + ']').join(' '); };
  const activeTab = () => ev(`document.querySelector('#tabs button.active').textContent`);
  const javaTree = f => execFileSync('java', ['-Djava.awt.headless=true', '-cp', JAR, 'jdk.nashorn.tools.Shell', path.join(D, 'tests', 'java', 'checktree.js'), '--', f], { encoding: 'utf8' }).split('\n').filter(l => l.trim()).map(l => l.replace(/\s+treeNodeLinked=true$/, ' (linked)'));
  const treeRe = /<object class="us\.softoption\.tree\.TTreeTableModel"[\s\S]*?\n <\/object>/;
  const treeNow = async () => JSON.stringify((await ev('window.getTree()')).root);
  const ts = require(path.join(D, 'treestate.js')), beans = require(path.join(D, 'beans.js'));
  const expectTree = JSON.stringify(ts.extract(beans.readDocument(fs.readFileSync(SRC, 'utf8'))).root);
  try {
    nextOpen = SRC; await menuItem('Open…').click(); await sleep(3500);
    step('1 open: title', win.getTitle());
    step('1 open: tree in widget identical to the file\'s', (await treeNow()) === expectTree);

    nextSave = OUT1; await menuItem('Save As…').click(); await sleep(1000);
    const orig = fs.readFileSync(SRC, 'utf8'), s1 = fs.readFileSync(OUT1, 'utf8');
    const stripJournal = x => x.replace(/<string>[\s\S]*?<\/string>/, '<string/>');   // the editor rewrites the Journal HTML slightly
    step('2 unchanged Save As: everything except the Journal element is byte-identical', stripJournal(orig) === stripJournal(s1));

    // 3. edit the tree via the widget API (as a rule application would): change the justification of the last line
    await ev(`(function(){ var a=document.querySelectorAll('iframe')[1].contentWindow.deriverTree; var t=JSON.parse(a.get());
      function find(n){ if(n.label===undefined && n.lineNo===6) return n; for (var i=0;i<n.children.length;i++){ var r=find(n.children[i]); if(r) return r;} }
      find(t.root).just=' XX'; find(t.root).dead=true; a.set(JSON.stringify(t)); })()`);
    await sleep(3500);
    step('3 dirty dot after tree edit', win.getTitle());
    await menuItem('Save').click(); await sleep(1000);
    step('3 title after Save', win.getTitle());
    step('3 java decodes the edited tree', javaTree(OUT1));
    step('3 java still decodes the proof', javaProof(OUT1));
    const s2 = fs.readFileSync(OUT1, 'utf8');
    step('3 no leftover top-level statements after the tree', (s2.match(/\n<void /g) || []).length);
    const proofRe = /<object class="us\.softoption\.proofs\.TProofTableModel"[\s\S]*?\n <\/object>/;
    step('3 proof element byte-preserved', elementOf(orig, proofRe) === elementOf(s2, proofRe));

    nextOpen = OUT1; await menuItem('Open…').click(); await sleep(3500);
    step('4 reopen edited: tree line 6 shows', (await treeNow()).includes('" XX"'));
    step('4 reopen: title', win.getTitle());

    await menuItem('New').click(); await sleep(2500);
    step('5 new: tree', await treeNow());
    nextSave = OUT2; await menuItem('Save As…').click(); await sleep(1000);
    step('5 java decodes new file (tree part)', javaTree(OUT2));
  } catch (e) { console.log('TEST_ERROR', e.stack); }
  app.quit();
}, 10000));
