// Regression: a tree that is cleared in the widget must be cleared in the saved file too (not silently kept).
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
const sleep2 = ms => new Promise(r => setTimeout(r, ms));
const menuItem2 = label => { for (const top of Menu.getApplicationMenu().items) for (const it of (top.submenu ? top.submenu.items : [])) if (it.label === label) return it; throw new Error('no menu item ' + label); };
app.whenReady().then(() => setTimeout(async () => {
  const win = RealBrowserWindow.getAllWindows()[0];
  const ev = c => win.webContents.executeJavaScript(c);
  const OUT = path.join(S, 'e2e_cleartree.lgc');
  try {
    nextOpen = SRC; await menuItem2('Open…').click(); await sleep2(3500);
    console.log('STEP tree after open has content:', !!(await ev('window.getTree()')).root);
    if (process.env.RELOAD) { win.webContents.reload(); await sleep2(5000); } else { await ev('window.setTree({root:null})'); await sleep2(2500); }
    console.log('STEP tree after clear:', JSON.stringify(await ev('window.getTree()')).slice(0,300));
    nextSave = OUT; await menuItem2('Save As…').click(); await sleep2(1500);
    nextOpen = OUT; await menuItem2('Open…').click(); await sleep2(3500);
    console.log('STEP RESULT tree empty after reopen (want true):', !require(path.join(D,'treestate.js')).hasContent(await ev('window.getTree()')));
  } catch (e) { console.log('FAIL', e); }
  app.quit();
}, 4000));
