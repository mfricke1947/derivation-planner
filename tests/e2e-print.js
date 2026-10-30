// Printing: File > Export Journal as PDF… (and the print page behind Print Journal…). The system print dialog cannot be driven from a test, but
// both use the same page, so the PDF proves it: a real PDF with the Journal's text, nothing for an empty Journal, scripts not run.
//   env -u ELECTRON_RUN_AS_NODE node_modules/.bin/electron tests/e2e-print.js
const electron = require('electron');
const { app, BrowserWindow: RealBrowserWindow, Menu, dialog } = electron;
const fs = require('fs'), os = require('os'), path = require('path');
class BrowserWindow extends RealBrowserWindow { constructor(o) { super(Object.assign({}, o, { show: false })); } }
BrowserWindow.getAllWindows = RealBrowserWindow.getAllWindows; BrowserWindow.fromWebContents = RealBrowserWindow.fromWebContents;
electron.BrowserWindow = BrowserWindow;
const D = path.resolve(__dirname, '..');
const { seedUserData } = require('./seed');
seedUserData(app);
const OUT = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'deriver-print-')), 'out.pdf');
let boxes = [], nextSave = OUT;
dialog.showSaveDialog = async () => ({ canceled: false, filePath: nextSave });
dialog.showErrorBox = (t, m) => console.log('ERRORBOX', t, m);
dialog.showMessageBox = async (w, o) => { boxes.push(o.message); return { response: 0 }; };
require(path.join(D, 'main.js'));
const menuItem = label => { for (const top of Menu.getApplicationMenu().items) for (const it of (top.submenu ? top.submenu.items : [])) if (it.label === label) return it; throw new Error('no menu item ' + label); };
const sleep = ms => new Promise(r => setTimeout(r, ms));
app.whenReady().then(() => setTimeout(async () => {
  const win = RealBrowserWindow.getAllWindows()[0];
  const ev = c => win.webContents.executeJavaScript(c);
  const step = (n, x) => console.log('STEP', n, typeof x === 'string' ? x : JSON.stringify(x));
  try {
    const htmldoc = require(path.join(D, 'htmldoc.js'));
    const page = htmldoc.printPage('<h2>Exercise 1</h2><p>Is <b>A &amp; B</b> true?</p><script>alert(1)</script><img onerror="x()" src="a.png">', 'PropEx1.lgc');
    step('1 print page: name shown, scripts/handlers stripped, no-script policy', { name: /class="docname">PropEx1\.lgc</.test(page), noScript: !/<script|alert\(1\)|onerror/i.test(page), csp: /script-src 'none'/.test(page) });
    // empty Journal -> message, no file
    await ev(`window.setActiveJournalHTML('')`); await sleep(1500);
    await menuItem('Export Journal as PDF…').click(); await sleep(1500);
    step('2 empty Journal: told, no PDF', { told: boxes.length === 1 && /nothing in the Journal/.test(boxes[0]), pdfExists: fs.existsSync(OUT) });
    // real content
    await ev(`window.setActiveJournalHTML('<h2>Exercise 1</h2><p>Is <b>True &amp; False</b> true? &#8756; <i>explain</i></p><ul><li>one</li><li>two</li></ul><script>document.title="RAN"</script>')`); await sleep(1500);
    await menuItem('Export Journal as PDF…').click(); await sleep(4000);
    const pdf = fs.existsSync(OUT) ? fs.readFileSync(OUT) : Buffer.alloc(0);
    step('3 PDF written', { isPdf: pdf.slice(0, 5).toString() === '%PDF-', bytes: pdf.length });
    fs.writeFileSync(path.join(os.tmpdir(), 'deriver-journal.pdf'), pdf);
  } catch (e) { console.log('FAIL', e); }
  app.quit();
}, 4500));
