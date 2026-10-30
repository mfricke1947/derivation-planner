// Exercise pages converted by tools/pages-to-journal.js: the converter's output for both kinds of content (button pages and fInputText pages),
// opening it into the Journal, the notation notice, and using an exercise line with the Trees "Start from selection". Throwaway settings folder.
//   env -u ELECTRON_RUN_AS_NODE [PARSER=bergmann] node_modules/.bin/electron tests/e2e-pages.js
const electron = require('electron');
const { seedUserData } = require('./seed');

const { app, BrowserWindow: RealBrowserWindow, Menu, dialog } = electron;
const fs = require('fs'), os = require('os'), path = require('path'), { execFileSync } = require('child_process');
class BrowserWindow extends RealBrowserWindow { constructor(o) { super(Object.assign({}, o, { show: false })); } }
BrowserWindow.getAllWindows = RealBrowserWindow.getAllWindows; BrowserWindow.fromWebContents = RealBrowserWindow.fromWebContents;
electron.BrowserWindow = BrowserWindow;
const D = path.resolve(__dirname, '..');
const ud = seedUserData(app, { fParser: process.env.PARSER || 'default' });
const S = fs.mkdtempSync(path.join(os.tmpdir(), 'deriver-pages-'));
let nextOpen = null, boxes = [];
dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [nextOpen] });
dialog.showErrorBox = (t, m) => console.log('ERRORBOX', t, m);
dialog.showMessageBox = async (w, o) => { boxes.push(o.message); return { response: 0 }; };

// two source pages in the old shape
const head = '<!DOCTYPE html><html><head><title>%T%</title><script src="../treesjs/treesjs.nocache.js"></script></head><body><script>\nvar Parameters = {\n fParser: "bergmann",\n %P%\n};\n</script><div id="container"><h3>Trees</h3></div></body></html>';
const page = (t, p) => head.replace('%T%', t).replace('%P%', p);
fs.writeFileSync(path.join(S, 'Tutorial1Test.html'), page('Tutorial 1a', 'tree0: value="F⊃G, F ∴ G",\n tree1: value="A & B ∴ B & A",\n tree10: value="X<Y ∴ Y>X",\n tree2: value="P ∨ Q, ¬P ∴ Q",'));
fs.writeFileSync(path.join(S, 'Tutorial7Test.html'), page('Tutorial 7', 'fInputText: "<p>Edit here "+\n"to get <b>what</b> you wish.</p>"+\n"<p>For example, F⊃G, F ∴ G</p>",\n fPropLevel: "true",'));
fs.writeFileSync(path.join(S, 'NoContent.html'), page('Nothing', 'fPropLevel: "true",'));
const out = execFileSync(process.execPath, [path.join(D, 'tools', 'pages-to-journal.js'), path.join(S, 'out'), path.join(S, 'Tutorial1Test.html'), path.join(S, 'Tutorial7Test.html'), path.join(S, 'NoContent.html')], { encoding: 'utf8', env: Object.assign({}, process.env, { ELECTRON_RUN_AS_NODE: '1' }) });
const f1 = path.join(S, 'out', 'Tutorial1TestE.html'), f7 = path.join(S, 'out', 'Tutorial7TestE.html');
require(path.join(D, 'main.js'));
const menuItem = label => { for (const top of Menu.getApplicationMenu().items) for (const it of (top.submenu ? top.submenu.items : [])) if (it.label === label) return it; throw new Error('no menu item ' + label); };
const sleep = ms => new Promise(r => setTimeout(r, ms));
app.whenReady().then(() => setTimeout(async () => {
  const win = RealBrowserWindow.getAllWindows()[0];
  const ev = c => win.webContents.executeJavaScript(c);
  const step = (n, x) => console.log('STEP', n, typeof x === 'string' ? x : JSON.stringify(x));
  try {
    step('1 converter output', out.split('\n').filter(Boolean).map(l => l.replace(/\s+/g, ' ')));
    const a = fs.readFileSync(f1, 'utf8'), b = fs.readFileSync(f7, 'utf8');
    step('2 button page -> ordered list in numeric order (tree10 last), text escaped, parser recorded', { meta: /<meta name="deriver-parser" content="bergmann">/.test(a), heading: /<h3>Tutorial 1a<\/h3>/.test(a),
      order: a.indexOf('F⊃G') < a.indexOf('A &amp; B') && a.indexOf('A &amp; B') < a.indexOf('P ∨ Q') && a.indexOf('P ∨ Q') < a.indexOf('X&lt;Y'), noScript: !/<script/i.test(a) });
    step('3 text page -> its HTML as it is; settings not carried', { html: /<p>Edit here to get <b>what<\/b> you wish\.<\/p><p>For example, F⊃G, F ∴ G<\/p>/.test(b) });
    // open into the Journal
    nextOpen = f1; await menuItem('Open…').click();
    for (let i = 0; i < 80 && !/Tutorial1TestE/.test(win.getTitle()); i++) await sleep(250);          // the drawing editor may still be starting
    await sleep(500);
    const j = await ev('window.getActiveJournalHTML()');
    step('4 opened into the Journal', { title: win.getTitle(), items: (j.match(/<li>/g) || []).length, heading: /<h3>Tutorial 1a<\/h3>/.test(j) });
    step('4 notation notice', boxes);
    boxes = [];
    // use the first exercise line: select it and Start from selection on the Trees tab
    await ev(`Array.from(document.querySelectorAll('#tabs button')).find(b=>b.textContent==='Trees').click()`); await sleep(1500);
    await ev(`(function(){ var fr=Array.from(document.querySelectorAll('iframe'))[1], d=fr.contentDocument, rta=d.getElementById('journal').querySelector('iframe'), rd=rta.contentDocument;
      var li=rd.querySelector('li'), r=rd.createRange(); r.selectNodeContents(li); var s=rd.getSelection(); s.removeAllRanges(); s.addRange(r);
      Array.from(d.querySelectorAll('button')).find(function(b){return /Start from selection/.test(b.textContent)}).click(); })()`);
    await sleep(2500);
    const t = await ev('window.getTree()');
    step('5 Start from selection on the first exercise line gives a tree', { hasRoot: !!(t && t.root), nodes: JSON.stringify(t).split('"ants":[{').length - 1 });
    // Save keeps the page's own head (so the notation record survives)
    const SAVED = path.join(S, 'saved.html'); dialog.showSaveDialog = async () => ({ canceled: false, filePath: SAVED });
    await menuItem('Save As…').click(); await sleep(1500);
    step('6 saved page keeps the notation record', /<meta name="deriver-parser" content="bergmann">/.test(fs.readFileSync(SAVED, 'utf8')) || 'not kept (a document saved As gets a fresh page)');
  } catch (e) { console.log('FAIL', e); }
  app.quit();
}, 4500));
