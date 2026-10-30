// Tests opening and saving plain HTML exercise pages (Open, Open from URL, Save, Save As .html / .lgc) through the real File menu with
// stubbed file dialogs: only the body goes into the Journal (scripts stripped), proof/tree/drawing are cleared, Save writes the page
// back keeping its own <head>, Save As .lgc makes a normal logic file, and an .lgc still opens as before. Throwaway settings folder.
//   env -u ELECTRON_RUN_AS_NODE node_modules/.bin/electron tests/e2e-html.js
const electron = require('electron');
const { app, BrowserWindow: RealBrowserWindow, Menu, dialog } = electron;
const fs = require('fs'), os = require('os'), path = require('path'), http = require('http');
class BrowserWindow extends RealBrowserWindow { constructor(o) { super(Object.assign({}, o, { show: false })); } }
BrowserWindow.getAllWindows = RealBrowserWindow.getAllWindows; BrowserWindow.fromWebContents = RealBrowserWindow.fromWebContents;
electron.BrowserWindow = BrowserWindow;
const D = path.resolve(__dirname, '..');
const { seedUserData } = require('./seed');
const S = fs.mkdtempSync(path.join(os.tmpdir(), 'deriver-html-'));
seedUserData(app);
let nextOpen = null, nextSave = null, boxAnswer = 0, boxes = [];
dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [nextOpen] });
dialog.showSaveDialog = async () => ({ canceled: false, filePath: nextSave });
dialog.showErrorBox = (t, m) => console.log('ERRORBOX', t, m);
dialog.showMessageBox = async (w, o) => { boxes.push(o.message); return { response: boxAnswer }; };
require(path.join(D, 'main.js'));
const menuItem = label => { for (const top of Menu.getApplicationMenu().items) for (const it of (top.submenu ? top.submenu.items : [])) if (it.label === label) return it; throw new Error('no menu item ' + label); };
const sleep = ms => new Promise(r => setTimeout(r, ms));

const PAGE = '<!DOCTYPE html>\n<html>\n<head>\n<meta charset="utf-8">\n<title>Tutorial Page</title>\n<style>p{color:blue}</style>\n<script>alert("head script")</script>\n</head>\n' +
  '<body class="exercise">\n<h2>Exercises</h2>\n<p onclick="evil()">Is <b>True &amp; False</b> true?</p>\n<script>alert("body script")</script>\n<ul><li>one</li><li>two</li></ul>\n<a href="javascript:evil()">x</a>\n</body>\n</html>\n';

app.whenReady().then(() => setTimeout(async () => {
  const win = RealBrowserWindow.getAllWindows()[0];
  const ev = c => win.webContents.executeJavaScript(c);
  const step = (n, x) => console.log('STEP', n, typeof x === 'string' ? x : JSON.stringify(x));
  const journal = () => ev('window.getActiveJournalHTML()');
  const SRC = path.join(S, 'page.html');
  fs.writeFileSync(SRC, PAGE);
  try {
    // build some state first, so we can see that opening a page clears it
    await ev(`window.setProof({head:[],tail:[{lineNo:1,first:0,second:0,third:0,sub:0,headLevel:0,just:'Ass',blank:false,lastAss:false,selectable:true,subSelectable:false,derived:false,formula:{k:5,i:'A',l:null,r:null}}]})`);
    nextOpen = SRC; await menuItem('Open…').click(); await sleep(3500);
    const j = await journal();
    step('1 open .html: title', win.getTitle());
    step('1 journal has the body text, no script/handler/js link', { hasText: /Is <b>True &amp; False<\/b> true\?/.test(j), noScript: !/script|alert|onclick|javascript:/i.test(j), hasList: /<li>one<\/li>/.test(j), noHead: !/Tutorial Page|color:blue/.test(j) });
    step('1 proof cleared (no line with a formula)', await ev(`(function(){ var p=window.getProof(); return p.head.concat(p.tail).filter(function(l){return l.formula}).length===0; })()`));
    // edit and Save (path known): head kept, body replaced
    await ev(`window.setActiveJournalHTML('<h2>Edited</h2><p>New text</p>')`); await sleep(2000);
    step('2 dirty dot after edit', win.getTitle());
    await menuItem('Save').click(); await sleep(1000);
    const saved = fs.readFileSync(SRC, 'utf8');
    step('2 saved page keeps its head/body tag, body replaced', { keepsHead: /<title>Tutorial Page<\/title>/.test(saved) && /color:blue/.test(saved), keepsBodyTag: /<body class="exercise">/.test(saved), newBody: /<h2>Edited<\/h2>\s*<p>New text<\/p>/.test(saved), oldGone: !/Exercises<\/h2>/.test(saved) });
    step('2 title after save', win.getTitle());
    // Save As .lgc from an html document
    const LGC = path.join(S, 'out.lgc');
    nextSave = LGC; await menuItem('Save As…').click(); await sleep(1500);
    const x = fs.readFileSync(LGC, 'utf8');
    step('3 Save As .lgc is a logic file with the Journal', { xml: /<java\b/.test(x), journal: /Edited/.test(x) });
    // ...and it opens as a logic file again
    nextOpen = LGC; await menuItem('Open…').click(); await sleep(3000);
    step('3 reopen .lgc', { title: win.getTitle(), journalHasEdited: /Edited/.test(await journal()) });
    // Save As .html from the lgc document, with a proof present -> asked, Cancel leaves no file
    await ev(`window.setProof({head:[],tail:[{lineNo:1,first:0,second:0,third:0,sub:0,headLevel:0,just:'Ass',blank:false,lastAss:false,selectable:true,subSelectable:false,derived:false,formula:{k:5,i:'A',l:null,r:null}}]})`); await sleep(1500);
    const H2 = path.join(S, 'fromlgc.html');
    boxes = []; boxAnswer = 1; nextSave = H2; await menuItem('Save As…').click(); await sleep(1500);
    step('4 proof present: warned, Cancel writes nothing', { warned: boxes.length === 1 && /proof/.test(boxes[0]), fileExists: fs.existsSync(H2) });
    boxes = []; boxAnswer = 0; await menuItem('Save As…').click(); await sleep(1500);
    const h2 = fs.existsSync(H2) ? fs.readFileSync(H2, 'utf8') : '';
    step('4 Save HTML anyway: complete page', { doctype: /^<!DOCTYPE html>/.test(h2), title: /<title>fromlgc<\/title>/.test(h2), body: /Edited/.test(h2), title2: win.getTitle() });
    // Open from URL (served locally), via the real dialog window
    const srv = http.createServer((req, res) => { res.writeHead(200, { 'Content-Type': 'text/html' }); res.end(PAGE); });
    await new Promise(r => srv.listen(0, '127.0.0.1', r));
    const url = 'http://127.0.0.1:' + srv.address().port + '/exercises/lesson3.html';
    menuItem('Open from URL…').click(); await sleep(1500);
    const dlg = RealBrowserWindow.getAllWindows().find(w => w.getTitle() === 'Open from URL');
    await dlg.webContents.executeJavaScript(`document.getElementById('v').value=${JSON.stringify(url)}; document.getElementById('o').click();`);
    await sleep(3500);
    step('5 open from URL (html): title, text', { title: win.getTitle(), hasText: /True &amp; False/.test(await journal()), noScript: !/alert/.test(await journal()) });
    // Save with no local file -> Save As, suggests .html (stubbed dialog just gives a path)
    const H3 = path.join(S, 'fromurl.html'); nextSave = H3; await menuItem('Save').click(); await sleep(1200);
    step('5 Save after URL open writes an html page', fs.existsSync(H3) && /<title>Tutorial Page<\/title>/.test(fs.readFileSync(H3, 'utf8')));
    srv.close();
  } catch (e) { console.log('FAIL', e); }
  app.quit();
}, 4500));
