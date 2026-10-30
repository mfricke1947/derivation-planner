const electron = require('electron'); const { app, BrowserWindow: RW, Menu, dialog } = electron;
const fs = require('fs'), path = require('path');
class BW extends RW { constructor(o) { super(Object.assign({}, o, { show: false })); } }
BW.getAllWindows = RW.getAllWindows; BW.fromWebContents = RW.fromWebContents; electron.BrowserWindow = BW;
require('./seed').seedUserData(app, { fParser: 'bergmann' });
let nextOpen = null;
dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [nextOpen] });
dialog.showErrorBox = (t, m) => console.log('ERRORBOX', t, m);
dialog.showMessageBox = async (w, o) => { console.log('NOTE', o.message.slice(0, 80)); return { response: 0 }; };
require(path.resolve(__dirname, '..') + '/main.js');
const menuItem = l => { for (const top of Menu.getApplicationMenu().items) for (const it of (top.submenu ? top.submenu.items : [])) if (it.label === l) return it; };
const sleep = ms => new Promise(r => setTimeout(r, ms));
app.whenReady().then(() => setTimeout(async () => {
  const win = RW.getAllWindows()[0]; const ev = c => win.webContents.executeJavaScript(c);
  const snap = async tag => { const d = await ev('window.getDiagram()'); const active = await ev(`document.querySelector('#tabs button.active').textContent`);
    console.log('SEQ', tag.padEnd(14), 'active tab:', active.padEnd(16), 'diagram:', d ? `individuals ${d.individuals.length}, properties ${d.properties.length}, arrows ${d.arrows.length}` : 'n/a', '| title:', win.getTitle()); };
  await snap('start');
  for (const n of [3, 5]) { nextOpen = path.resolve(__dirname,'..','testfiles','PredExBergmann') + n + '.lgc'; await menuItem('Open…').click(); await sleep(4500); await snap('open ' + n); }
  const d = await ev('window.getDiagram()'), tab = await ev(`document.querySelector('#tabs button.active').textContent`);
  const ok = d.individuals.length === 0 && tab === 'Interpretations';
  console.log(ok ? 'PASS' : 'FAIL', 'opening a diagram-less file after one with a diagram: empty drawing, opens on its saved Interpretations tab');
  app.exit(ok ? 0 : 1);
}, 4500));
