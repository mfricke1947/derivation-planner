// "Write Drawing" (Interpretations tab): puts the drawing, with its board, into the Journal as a picture at the caret, or at the end; it is
// self-contained SVG, survives Save/Open as part of the Journal, and prints.
//   env -u ELECTRON_RUN_AS_NODE node_modules/.bin/electron tests/e2e-writedrawing.js
const electron = require('electron');
const { app, BrowserWindow: RealBrowserWindow, Menu, dialog } = electron;
const fs = require('fs'), os = require('os'), path = require('path');
class BrowserWindow extends RealBrowserWindow { constructor(o) { super(Object.assign({}, o, { show: false })); } }
BrowserWindow.getAllWindows = RealBrowserWindow.getAllWindows; BrowserWindow.fromWebContents = RealBrowserWindow.fromWebContents;
electron.BrowserWindow = BrowserWindow;
const D = path.resolve(__dirname, '..');
const { seedUserData } = require('./seed');
seedUserData(app);
const S = fs.mkdtempSync(path.join(os.tmpdir(), 'deriver-wd-'));
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
  const journal = () => ev('window.getActiveJournalHTML()');
  const imgs = h => (h.match(/<img [^>]*data:image\/svg\+xml;base64,[A-Za-z0-9+/=]+/g) || []);
  const decode = tag => Buffer.from(/base64,([A-Za-z0-9+/=]+)/.exec(tag)[1], 'base64').toString('utf8');
  const clickWrite = () => ev(`(function(){ var d=document.querySelectorAll('iframe')[2].contentDocument; var b=d.getElementById('deriverWriteDrawing'); if(!b) return false; b.click(); return true; })()`);
  try {
    nextOpen = path.join(D, 'testfiles', 'HalfFinished.lgc'); await menuItem('Open…').click(); await sleep(4500);
    await ev(`Array.from(document.querySelectorAll('#tabs button')).find(b=>b.textContent==='Interpretations').click()`); await sleep(1000);
    await ev(`window.setActiveJournalHTML('<p>Question 1</p><p>Question 2</p>')`); await sleep(1500);
    step('1 button present beside Reset Drawing', await ev(`(function(){ var d=document.querySelectorAll('iframe')[2].contentDocument; var b=d.getElementById('deriverWriteDrawing'); return !!b && b.previousElementSibling && b.previousElementSibling.textContent==='Reset Drawing'; })()`));
    // no caret in the Journal -> at the end
    step('2 clicked', await clickWrite()); await sleep(1200);
    let j = await journal();
    step('2 one picture, after the text', { pictures: imgs(j).length, afterText: /Question 2<\/p><p><img /.test(j) && !/Question 2<img/.test(j) });
    const svg = decode(imgs(j)[0]);
    step('2 picture is a self-contained SVG with the drawing and board', { isSvg: /^<svg\b/.test(svg), viewBox: /viewBox="0 0 \d+ \d+"/.test(svg), circles: (svg.match(/<circle/g) || []).length >= 4, rects: /<rect/.test(svg), board: /Universe|svg_IB/.test(svg), noScript: !/<script/i.test(svg) });
    // caret between the two questions -> inserted there
    await ev(`(function(){ var f=document.querySelectorAll('iframe')[2].contentDocument.getElementById('journal').querySelector('iframe'), d=f.contentDocument; d.body.innerHTML='<p>Question 1</p><p>Question 2</p>';
      f.contentWindow.focus(); var r=d.createRange(); r.setStart(d.body.children[0].firstChild, 10); r.collapse(true); var s=d.getSelection(); s.removeAllRanges(); s.addRange(r); })()`);
    await clickWrite(); await sleep(1200); j = await journal();
    step('3 inserted after the paragraph with the caret (between the questions), in its own paragraph', /Question 1<\/p><p><img [^>]*><\/p><p>Question 2/.test(j));
    // second drawing in the same Journal, ids cannot clash (images)
    await clickWrite(); await sleep(1000); j = await journal();
    step('4 two drawings in one Journal', imgs(j).length === 2);
    // survives Save/Open, and prints
    const OUT = path.join(S, 'wd.lgc'); nextSave = OUT; await menuItem('Save As…').click(); await sleep(1500);
    menuItem('New').click(); await sleep(2500);
    nextOpen = OUT; await menuItem('Open…').click(); await sleep(4000);
    step('5 pictures survive Save and Open', imgs(await journal()).length === 2);
    const PDF = path.join(S, 'wd.pdf');
    nextSave = PDF; await menuItem('Export Journal as PDF…').click(); await sleep(4000);
    const pdf = fs.existsSync(PDF) ? fs.readFileSync(PDF) : Buffer.alloc(0);
    step('6 PDF with the pictures', { isPdf: pdf.slice(0, 5).toString() === '%PDF-', bytes: pdf.length });
    fs.writeFileSync(path.join(os.tmpdir(), 'deriver-writedrawing.png'), (await win.webContents.capturePage()).toPNG());
  } catch (e) { console.log('FAIL', e); }
  app.quit();
}, 4500));
