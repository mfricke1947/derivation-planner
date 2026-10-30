// "Reset Drawing" must return to the drawing the document started with (the file's drawing), as on the web pages, not to empty.
//   env -u ELECTRON_RUN_AS_NODE node_modules/.bin/electron tests/e2e-resetdrawing.js
const electron = require('electron');
const { app, BrowserWindow: RealBrowserWindow, Menu, dialog } = electron;
const fs = require('fs'), os = require('os'), path = require('path');
class BrowserWindow extends RealBrowserWindow { constructor(o) { super(Object.assign({}, o, { show: false })); } }
BrowserWindow.getAllWindows = RealBrowserWindow.getAllWindows; BrowserWindow.fromWebContents = RealBrowserWindow.fromWebContents;
electron.BrowserWindow = BrowserWindow;
const D = path.resolve(__dirname, '..');
const { seedUserData } = require('./seed');
seedUserData(app);
let nextOpen = null;
dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [nextOpen] });
dialog.showErrorBox = (t, m) => console.log('ERRORBOX', t, m);
dialog.showMessageBox = async () => ({ response: 0 });
require(path.join(D, 'main.js'));
const menuItem = label => { for (const top of Menu.getApplicationMenu().items) for (const it of (top.submenu ? top.submenu.items : [])) if (it.label === label) return it; throw new Error('no menu item ' + label); };
const sleep = ms => new Promise(r => setTimeout(r, ms));
app.whenReady().then(() => setTimeout(async () => {
  const win = RealBrowserWindow.getAllWindows()[0];
  const ev = c => win.webContents.executeJavaScript(c);
  const step = (n, x) => console.log('STEP', n, typeof x === 'string' ? x : JSON.stringify(x));
  const names = d => d.individuals.map(i => i.name).sort().join('') + '|' + d.properties.map(p => p.name).sort().join('') + '|' + d.arrows.map(a => a.kind[0] + a.name).sort().join(',');
  const diagram = async () => names(await ev('window.getDiagram()'));
  const reset = () => ev(`(function(){ var d=document.querySelectorAll('iframe')[2].contentDocument; Array.from(d.querySelectorAll('button')).find(function(b){return b.textContent==='Reset Drawing'}).click(); })()`);
  try {
    nextOpen = path.join(D, 'testfiles', 'HalfFinished.lgc'); await menuItem('Open…').click(); await sleep(4000);
    const loaded = await diagram(); step('1 loaded drawing', loaded);
    // the user alters the drawing: delete individual 'a' in the editor
    await ev(`(function(){ var w=document.querySelectorAll('iframe')[2].contentDocument.getElementById('svgedit').contentWindow; var el=w.svgCanvas.getElem('svg_a'); w.svgCanvas.selectOnly([el]); w.svgCanvas.deleteSelectedElements(); })()`);
    await sleep(1500);
    const altered = await diagram(); step('2 altered drawing (individual a removed)', altered);
    await reset(); await sleep(2500);
    const after = await diagram(); step('3 after Reset Drawing', after);
    step('3 Reset returned to the file\'s drawing (not empty)', after === loaded && after !== altered);
    // a drawing with nothing in it: Reset gives empty
    menuItem('New').click(); await sleep(3000);
    await reset(); await sleep(2000);
    step('4 after New, Reset gives an empty drawing', (await diagram()) === '||');
  } catch (e) { console.log('FAIL', e); }
  app.quit();
}, 4500));
