// Tests the Symbolize tab: it appears for supported logical systems and is hidden for the others, the shared Journal passes
// to and from it without flattening formatting unless the text was changed there, To Symbols and Do Command work, and the
// Save/Open Journal bridge works while it is the active tab. Uses a throwaway settings folder (never your real Preferences).
//   env -u ELECTRON_RUN_AS_NODE node_modules/.bin/electron tests/e2e-symbolize.js              # default notation
//   PARSER=barwise env -u ELECTRON_RUN_AS_NODE node_modules/.bin/electron tests/e2e-symbolize.js   # tab must be hidden
const electron = require('electron');
const { seedUserData } = require('./seed');

const { app, BrowserWindow: RealBrowserWindow } = electron;
const fs = require('fs'), os = require('os'), path = require('path');
class BrowserWindow extends RealBrowserWindow { constructor(o) { super(Object.assign({}, o, { show: false })); } }
BrowserWindow.getAllWindows = RealBrowserWindow.getAllWindows; BrowserWindow.fromWebContents = RealBrowserWindow.fromWebContents;
electron.BrowserWindow = BrowserWindow;

const D = path.resolve(__dirname, '..');
const userData = fs.mkdtempSync(path.join(os.tmpdir(), 'deriver-userdata-'));
seedUserData(app, process.env.PARSER ? { fParser: process.env.PARSER } : {});
require(path.join(D, 'main.js'));

const sleep = ms => new Promise(r => setTimeout(r, ms));
app.whenReady().then(() => setTimeout(async () => {
  const win = RealBrowserWindow.getAllWindows()[0];
  const ev = c => win.webContents.executeJavaScript(c);
  const step = (n, x) => console.log('STEP', n, typeof x === 'string' ? x : JSON.stringify(x));
  const tabNames = () => ev(`Array.from(document.querySelectorAll('#tabs button')).map(b=>b.textContent)`);
  const click = name => ev(`Array.from(document.querySelectorAll('#tabs button')).find(b=>b.textContent==='${name}').click()`);
  const sym = code => ev(`(function(){ var w=document.querySelectorAll('iframe')[3].contentWindow; var d=w.document; ${code} })()`);
  // The Symbolize Journal is a rich-text box (an editable iframe, #richJournal) like the other tabs'; the widget works on a hidden plain copy.
  const symText = () => sym(`return w.__symbolizeRich.flatten().text;`);
  const symHtml = () => sym(`return d.getElementById('richJournal').contentDocument.body.innerHTML;`);
  const selectInRich = str => sym(`var rd=d.getElementById('richJournal').contentDocument, tw=rd.createTreeWalker(rd.body,4), n, found=false;
      while ((n=tw.nextNode())) { var i=n.data.indexOf(${JSON.stringify(str)}); if (i>=0) { var r=rd.createRange(); r.setStart(n,i); r.setEnd(n,i+${str.length}); var sel=rd.getSelection(); sel.removeAllRanges(); sel.addRange(r); found=true; break; } }
      return found;`);
  const clickBtn = label => sym(`Array.from(d.querySelectorAll('button')).find(b=>b.textContent===${JSON.stringify(label)}).click();`);
  const journalHtml = () => ev('window.getActiveJournalHTML()');
  try {
    step('tabs shown', await tabNames());
    step('symbolizeSupportedFor', { barwise: await ev(`symbolizeSupportedFor('barwise')`), girle: await ev(`symbolizeSupportedFor('girle')`), howson: await ev(`symbolizeSupportedFor('howson')`), stegeman: await ev(`symbolizeSupportedFor('stegeman')`), bergmann: await ev(`symbolizeSupportedFor('bergmann')`), default: await ev(`symbolizeSupportedFor('default')`) });
    if ((await tabNames()).indexOf('Symbolize') < 0) { step('Symbolize tab is hidden for parser', process.env.PARSER || '?'); app.quit(); return; }

    // 1. rich text -> Symbolize keeps its layout
    await click('Proofs'); await sleep(500);
    await ev(`window.setActiveJournalHTML('<h2>Exercise</h2><p>Hello <b>bold</b> world</p><p>If Arthur is a nincompoop then Charles is a philosopher.</p><ul><li>one</li><li>two</li></ul>')`);
    await click('Symbolize'); await sleep(1500);
    step('1 Symbolize shows the shared Journal WITH its layout', await symHtml());
    step('1 active tab', await ev(`document.querySelector('#tabs button.active').textContent`));

    // 2. To Symbols on the sentence: only the selection changes, the layout around it is untouched
    step('2 selected the sentence', await selectInRich('If Arthur is a nincompoop then Charles is a philosopher.'));
    await clickBtn('To Symbols'); await sleep(1500);
    const h3 = await symHtml();
    step('2 html after To Symbols', h3);
    step('2 layout kept (heading, bold, list) and the sentence symbolized', { heading: /<h2>Exercise<\/h2>/.test(h3), bold: /<b>bold<\/b>/.test(h3), list: /<li>one<\/li><li>two<\/li>/.test(h3), symbolized: /ARTHUR IS A NINCOMPOOP [→⊃] CHARLES/.test(h3), original_gone: !/If Arthur is a nincompoop/.test(h3) });
    await click('Proofs'); await sleep(1000);
    const back = await journalHtml();
    step('3 Proofs journal has the symbolized sentence and the formatting', { symbolized: /ARTHUR IS A NINCOMPOOP [→⊃] CHARLES/.test(back), bold: /<b>bold<\/b>/.test(back), heading: /<h2>/.test(back) });

    // 3b. To English on a formula picks the text back up; a selection across two paragraphs is replaced without joining them badly
    await click('Symbolize'); await sleep(1000);
    await sym(`d.getElementById('richJournal').contentDocument.body.innerHTML='<p>First para</p><p>A &amp; B</p><p>Last para</p>';`);
    step('3b selected the formula', await selectInRich('A & B'));
    await clickBtn('To English'); await sleep(1200);
    step('3b html after To English (paragraphs around it intact)', await symHtml());
    step('3b error label', await sym(`return (d.getElementById('errorLabelDiv')||{}).innerText;`));

    // 4. Do Command: the widget wraps the SELECTED text in parentheses itself (select `+ 1 2`, not `(+ 1 2)`) and the result
    //    REPLACES the selection. Its own commands are `remember noun|name|adjective|...`, `assign true|false`, `write propositions`, `all ...`.
    const doCommand = async expr => {
      await sym(`d.getElementById('richJournal').contentDocument.body.innerHTML='<p>Commands:</p><p>' + ${JSON.stringify(expr)} + '</p>';`);
      await selectInRich(expr); await clickBtn('Do Command');
    };
    await doCommand('+ 1 2'); await sleep(1000);
    step('4 Do Command "+ 1 2" replaces the selection with its result', await symHtml());
    await doCommand('(+ 1 2)'); await sleep(1000);
    step('4 a command that is not valid gives a message, not a crash', await sym(`return (d.getElementById('errorLabelDiv')||{}).innerText;`));
    await doCommand('write propositions'); await sleep(1000);
    step('4 Do Command "write propositions"', (await symText()).slice(0, 120));
    step('4 buttons on the page', await sym(`return Array.from(d.querySelectorAll('button')).map(b=>b.textContent).join(' | ');`));

    // 6. The look matches the other tabs (measured from the Proofs tab): same palette symbols, white Journal, same button metrics
    await click('Symbolize'); await sleep(800);
    const proofsSymbols = await ev('window.getPaletteSymbols()');
    const look = JSON.parse(await sym(`function c(el,p){return el? w.getComputedStyle(el)[p]:null;}
      var ta=d.querySelector('#journal iframe'), btn=d.querySelector('#symbolizeButtonDiv button'), rb=ta.contentDocument.body;
      return JSON.stringify({ symbols: Array.from(d.querySelectorAll('#palette .html-face')).map(e=>e.textContent), journalBg: w.getComputedStyle(rb).backgroundColor === 'rgba(0, 0, 0, 0)' ? c(ta.contentDocument.documentElement,'backgroundColor') : w.getComputedStyle(rb).backgroundColor, journalBottomGap: Math.round(w.innerHeight - ta.getBoundingClientRect().bottom),
        buttonFont: c(btn,'fontSize'), buttonPadding: c(btn,'padding'), pageBg: c(d.body,'backgroundColor') });`));
    step('6 palette = the Proofs tab palette', JSON.stringify(look.symbols) === JSON.stringify(proofsSymbols) && look.symbols.length >= 8);
    step('6 white page and Journal; the Journal runs to the bottom of the window', look.pageBg === 'rgb(255, 255, 255)' && look.journalBg === 'rgb(255, 255, 255)' && Math.abs(look.journalBottomGap - 6) <= 2);
    step('6 buttons have the same size as the other tabs (13px, padding 3px 5px)', look.buttonFont === '13px' && look.buttonPadding === '3px 5px');
    step('6 palette click inserts a symbol at the caret', await sym(`
      var rd=d.getElementById('richJournal').contentDocument; rd.body.innerHTML='<p>AB</p>';
      var n=rd.body.firstChild.firstChild, r=rd.createRange(); r.setStart(n,1); r.setEnd(n,1); var sel=rd.getSelection(); sel.removeAllRanges(); sel.addRange(r);
      var b=Array.from(d.querySelectorAll('#palette .gwt-PushButton')).find(x=>x.textContent==='\\u2200');
      b.dispatchEvent(new MouseEvent('mousedown',{bubbles:true,cancelable:true})); b.click(); return rd.body.textContent === 'A\\u2200B';`));

    // 5. Save/Open bridge while Symbolize is the active tab
    await ev(`window.setActiveJournalHTML('<p>abc <i>def</i></p>')`); await sleep(500);
    step('5 get == set while on Symbolize (unchanged -> original HTML back)', (await journalHtml()) === '<p>abc <i>def</i></p>');
    step('5 the Journal shows', JSON.stringify(await symText()));
  } catch (e) { console.log('TEST_ERROR', e.stack); }
  app.quit();
}, 10000));
