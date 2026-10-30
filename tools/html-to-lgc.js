// Converts exercise pages of the widget website (an Interpretations host page with a preloaded SVG drawing `var preloadSvg = '…'`
// and a `Parameters` block whose `fInputText` is the question text as HTML) into .lgc files for DeriverElectron / the Java app.
// It drives the real app headlessly: the text becomes the Journal, the SVG is loaded into the drawing editor, and the file is written
// by the app's own Save As (so it is exactly what Save would write). The original pages are only read.
//
//   env -u ELECTRON_RUN_AS_NODE node_modules/.bin/electron tools/html-to-lgc.js <outDir> <page.html> [<page.html> ...]
//
// Environment: PARSER=bergmann etc. to pick the logical system the file is written with (default: the page's own fParser).
const electron = require('electron');
const { app, BrowserWindow: RealBrowserWindow, Menu, dialog } = electron;
const fs = require('fs'), os = require('os'), path = require('path'), vm = require('vm');
class BrowserWindow extends RealBrowserWindow { constructor(o) { super(Object.assign({}, o, { show: false })); } }
BrowserWindow.getAllWindows = RealBrowserWindow.getAllWindows; BrowserWindow.fromWebContents = RealBrowserWindow.fromWebContents;
electron.BrowserWindow = BrowserWindow;

const D = path.resolve(__dirname, '..');
const args = process.argv.slice(process.argv.indexOf('--') >= 0 ? process.argv.indexOf('--') + 1 : 2).filter(a => !a.startsWith('--') && !/electron|\.app/.test(a));
const outDir = args[0], pages = args.slice(1).filter(f => /\.html?$/i.test(f));
if (!outDir || !pages.length) { console.log('usage: electron tools/html-to-lgc.js <outDir> <page.html> ...'); process.exit(1); }

// the page's parameters, taken by running its inline scripts in an empty sandbox (no DOM, no network)
function pageData(file) {
  const html = fs.readFileSync(file, 'utf8');
  const ctx = vm.createContext({ window: {}, document: {}, alert() {} });
  for (const m of html.matchAll(/<script\b(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)) { try { vm.runInContext(m[1], ctx); } catch (e) { /* not a data script */ } }
  const P = ctx.Parameters || {};
  return { svg: ctx.preloadSvg || '', text: P.fInputText || '', parser: P.fParser || 'default', identity: P.fIdentity === 'true', title: (/<title>([\s\S]*?)<\/title>/i.exec(html) || [])[1] || '' };
}

const userData = fs.mkdtempSync(path.join(os.tmpdir(), 'deriver-userdata-'));
app.setPath('userData', userData);
let nextSave = null, nextOpen = null;
dialog.showSaveDialog = async () => ({ canceled: false, filePath: nextSave });
dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [nextOpen] });
dialog.showErrorBox = (t, m) => console.log('ERRORBOX', t, m);
dialog.showMessageBox = async (w, o) => { console.log('NOTE', o.message); return { response: 0 }; };

// preferences: the exercises need the identity/function palette when the page asks for it; all tabs on so the converter never depends on the user's own tab choices
const first = pageData(pages[0]);
fs.writeFileSync(path.join(userData, 'preferences.json'), JSON.stringify({ tabProofs: true, tabTrees: true, tabInterpretations: true, tabSymbolize: true, gamesTab: false, fParser: process.env.PARSER || first.parser, fIdentity: pages.some(p => pageData(p).identity) }));
require(path.join(D, 'main.js'));
const menuItem = label => { for (const top of Menu.getApplicationMenu().items) for (const it of (top.submenu ? top.submenu.items : [])) if (it.label === label) return it; throw new Error('no menu item ' + label); };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const names = d => d.individuals.map(i => i.name).sort().join('') + ' | ' + d.properties.map(p => p.name).sort().join('') + ' | ' + d.arrows.map(a => a.kind[0] + ':' + a.name + ' ' + a.from + '>' + a.to).sort().join(', ');

app.whenReady().then(() => setTimeout(async () => {
  const win = RealBrowserWindow.getAllWindows()[0];
  const ev = c => win.webContents.executeJavaScript(c);
  fs.mkdirSync(outDir, { recursive: true });
  try {
    for (const page of pages) {
      const d = pageData(page), base = path.basename(page).replace(/\.html?$/i, '');
      menuItem('New').click(); await sleep(2500);
      await ev(`window.setActiveJournalHTML(${JSON.stringify(d.text)})`);
      await ev(`Array.from(document.querySelectorAll('#tabs button')).find(b=>b.textContent==='Interpretations').click()`); await sleep(800);
      // load the page's own drawing into the editor exactly as the web page does, then let the widget derive its relations
      await ev(`(function(){ var w=document.querySelectorAll('iframe')[2].contentDocument.getElementById('svgedit').contentWindow; w.svgCanvas.setSvgString(${JSON.stringify(d.svg)}); })()`);
      await sleep(2500);
      const before = await ev('window.getDiagram()');
      const out = path.join(outDir, base + '.lgc');
      nextSave = out; await menuItem('Save As…').click(); await sleep(1500);
      // read it back through the app (Open) and compare
      menuItem('New').click(); await sleep(2000);
      nextOpen = out; await menuItem('Open…').click(); await sleep(4000);
      const after = await ev('window.getDiagram()');
      const journal = await ev('window.getActiveJournalHTML()');
      const same = names(before) === names(after);
      console.log('CONVERTED', base, same ? 'OK' : 'MISMATCH', '\n   drawing:', names(after), '\n   journal chars:', journal.length, ' skipped shapes:', before.skipped);
      if (!same) console.log('   page drawing:', names(before));
    }
  } catch (e) { console.log('FAIL', e); }
  app.quit();
}, 4500));
