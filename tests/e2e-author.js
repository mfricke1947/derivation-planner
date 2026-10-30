// Tests the authoring tools: hidden unless the "authorTools" preference is on; with it on, the toolbar formats the active tab's
// Journal (heading, bold, list), the HTML-source window shows and applies HTML, the toolbar is greyed on Symbolize, and the
// layout still reaches the window bottom. Throwaway settings folder.
//   env -u ELECTRON_RUN_AS_NODE node_modules/.bin/electron tests/e2e-author.js              # toolbar must be absent
//   AUTHOR=1 env -u ELECTRON_RUN_AS_NODE node_modules/.bin/electron tests/e2e-author.js     # toolbar works
const electron = require('electron');
const { seedUserData } = require('./seed');

const { app, BrowserWindow: RealBrowserWindow, Menu } = electron;
const fs = require('fs'), os = require('os'), path = require('path');
class BrowserWindow extends RealBrowserWindow { constructor(o) { super(Object.assign({}, o, { show: false })); } }
BrowserWindow.getAllWindows = RealBrowserWindow.getAllWindows; BrowserWindow.fromWebContents = RealBrowserWindow.fromWebContents;
electron.BrowserWindow = BrowserWindow;
const D = path.resolve(__dirname, '..');
const userData = fs.mkdtempSync(path.join(os.tmpdir(), 'deriver-userdata-'));
seedUserData(app, process.env.AUTHOR ? { authorTools: true, fParser: 'bergmann' } : {});
require(path.join(D, 'main.js'));
const sleep = ms => new Promise(r => setTimeout(r, ms));
app.whenReady().then(() => setTimeout(async () => {
  const win = RealBrowserWindow.getAllWindows()[0];
  const ev = c => win.webContents.executeJavaScript(c);
  const step = (n, x) => console.log('STEP', n, typeof x === 'string' ? x : JSON.stringify(x));
  try {
    const shown = await ev(`!!document.querySelectorAll('iframe')[0].contentDocument.getElementById('deriverAuthorBar')`);
    const menuHas = !!Menu.getApplicationMenu().items.find(i => i.label === 'Journal' && i.visible);
    step('toolbar shown / Journal menu visible', { shown, menuHas });
    if (!process.env.AUTHOR) { app.quit(); return; }
    const bar = i => `document.querySelectorAll('iframe')[${i}].contentDocument.getElementById('deriverAuthorBar')`;
    const btn = t => `Array.from(${bar(0)}.querySelectorAll('button')).find(b=>b.title==='${t}')`;
    const rta = `document.querySelectorAll('iframe')[0].contentDocument.getElementById('journal').querySelector('iframe')`;
    await ev(`window.setActiveJournalHTML('<p>Title line</p><p>one</p><p>two</p>')`); await sleep(800);
    step('bar sits between palette and text area', await ev(`(function(){ var box=document.querySelectorAll('iframe')[0].contentDocument.getElementById('journal'); var kids=Array.from(box.children).map(function(c){return c.id||c.className||c.tagName}); var b=${bar(0)}; return { before: b.previousElementSibling && (b.previousElementSibling.className||b.previousElementSibling.tagName), after: b.nextElementSibling && b.nextElementSibling.tagName, kids: kids }; })()`));
    step('bars on Trees/Interpretations/Symbolize (all have a rich Journal)', await ev(`[1,2,3].map(function(i){ return !!${bar('i')}; })`));
    // select the first paragraph, make it a heading 2 via the dropdown, bold via button
    await ev(`(function(){ var d=${rta}.contentDocument, p=d.body.firstElementChild, r=d.createRange(); r.selectNodeContents(p); var s=d.defaultView.getSelection(); s.removeAllRanges(); s.addRange(r); })()`);
    await ev(`(function(){ var s=${bar(0)}.querySelector('select'); s.value='h2'; s.dispatchEvent(new Event('change')); })()`);
    await ev(`${btn('Bold')}.click()`);
    step('heading + bold', await ev(`${rta}.contentDocument.body.innerHTML`));
    // list over the last two paragraphs
    await ev(`(function(){ var d=${rta}.contentDocument, k=d.body.children, r=d.createRange(); r.setStartBefore(k[1]); r.setEndAfter(k[2]); var s=d.defaultView.getSelection(); s.removeAllRanges(); s.addRange(r); })()`);
    await ev(`${btn('Bulleted list')}.click()`);
    step('list', await ev(`${rta}.contentDocument.body.innerHTML`));
    // formatting of the source view: block per line, nesting indented, round trip is lossless
    const sample = '<h2>Title</h2><p>Para with <b>bold</b> &amp; <i>italic</i></p><ul><li>one</li><li>two <b>x</b></li></ul><div><p>in div</p><p>second</p></div>';
    const pretty = await ev(`window.prettyHtml(${JSON.stringify(sample)})`);
    step('pretty', pretty);
    step('round trip exact', (await ev(`window.compactHtml(window.prettyHtml(${JSON.stringify(sample)}))`)) === sample);
    // HTML source window
    await ev(`window.showHtmlSource()`);
    const src = await ev(`document.getElementById('htmlsrcText').value`);
    step('source window shows the html', src);
    await ev(`document.getElementById('htmlsrcText').value = '<h1>Edited</h1><p>by source</p>'; document.getElementById('htmlsrcApply').click();`);
    step('applied source reaches journal', await ev(`window.getActiveJournalHTML()`));
    step('source window closed', await ev(`document.getElementById('htmlsrc').style.display`));
    fs.writeFileSync(path.join(os.tmpdir(), 'deriver-author.png'), (await win.webContents.capturePage()).toPNG());
  } catch (e) { console.log('FAIL', e); }
  app.quit();
}, 5000));
