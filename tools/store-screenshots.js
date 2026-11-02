// Takes Store-listing screenshots of the real app: opens a sample document (proof + tree + drawing) and captures each tab.
// Usage: env -u ELECTRON_RUN_AS_NODE node_modules/.bin/electron tools/store-screenshots.js <outDir>
// Window content 1366x768 (the Store minimum); on a Retina display the PNGs come out at 2732x1536, which the Store also accepts.
const electron = require('electron'); const { app, BrowserWindow: RW, Menu, dialog } = electron; const fs = require('fs'), path = require('path');
const out = path.resolve(process.argv[2] || path.join(require('os').homedir(), 'DeriverBuild', 'store-screenshots')); fs.mkdirSync(out, { recursive: true });
class BW extends RW { constructor(o) { super(Object.assign({}, o, { show: false, width: 1366, height: 768, useContentSize: true })); } }
BW.getAllWindows = RW.getAllWindows; BW.fromWebContents = RW.fromWebContents; electron.BrowserWindow = BW;
require('../tests/seed').seedUserData(app, { fParser: 'bergmann', gamesTab: true });
const sample = path.resolve(__dirname, '..', 'testfiles', 'HalfFinished.lgc');
dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [sample] });
dialog.showMessageBox = async () => ({ response: 0 });
require(path.resolve(__dirname, '..') + '/main.js');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const item = l => { for (const top of Menu.getApplicationMenu().items) for (const it of (top.submenu ? top.submenu.items : [])) if (it.label === l) return it; };
app.whenReady().then(() => setTimeout(async () => {
  const win = RW.getAllWindows()[0]; win.setContentSize(1366, 768); const ev = c => win.webContents.executeJavaScript(c);
  for (let i = 0; i < 120 && !(await ev('!!(window.widgetsReady && window.widgetsReady())')); i++) await sleep(500);
  await sleep(3000); await item('Open…').click(); await sleep(9000);
  const shots = [['1-proofs', 'Proofs'], ['2-trees', 'Trees'], ['3-interpretations', 'Interpretations'], ['4-symbolize', 'Symbolize'], ['5-games', 'Games']];
  for (const [file, tab] of shots) {
    await ev(`window.showTab(${JSON.stringify(tab)})`); await sleep(2500);
    if (tab === 'Symbolize') { await ev(`window.setActiveJournalHTML('<h3>Symbolizing</h3><p>Every philosopher is wise. Socrates is a philosopher. Therefore Socrates is wise.</p><p>Select a sentence, then press <b>To Symbols</b>.</p>')`); await sleep(1500); }
    const img = await win.webContents.capturePage(); fs.writeFileSync(path.join(out, file + '.png'), img.toPNG()); console.log('saved', file, img.getSize().width + 'x' + img.getSize().height);
  }
  app.exit(0);
}, 1000));
