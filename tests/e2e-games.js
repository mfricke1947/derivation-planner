// Tests the optional Games tab: absent by default, present when the "gamesTab" preference is on; each of the five games
// renders its widget with the right instruction text, and the chooser switches game. Throwaway settings folder.
//   env -u ELECTRON_RUN_AS_NODE node_modules/.bin/electron tests/e2e-games.js              # tab must be hidden
//   GAMES=1 env -u ELECTRON_RUN_AS_NODE node_modules/.bin/electron tests/e2e-games.js      # tab shown, games work
const electron = require('electron');
const { seedUserData } = require('./seed');

const { app, BrowserWindow: RealBrowserWindow } = electron;
const fs = require('fs'), os = require('os'), path = require('path');
class BrowserWindow extends RealBrowserWindow { constructor(o) { super(Object.assign({}, o, { show: false })); } }
BrowserWindow.getAllWindows = RealBrowserWindow.getAllWindows; BrowserWindow.fromWebContents = RealBrowserWindow.fromWebContents;
electron.BrowserWindow = BrowserWindow;

const D = path.resolve(__dirname, '..');
const userData = fs.mkdtempSync(path.join(os.tmpdir(), 'deriver-userdata-'));
seedUserData(app, process.env.GAMES ? { gamesTab: true, fParser: process.env.PARSER || 'default' } : {});
require(path.join(D, 'main.js'));

const sleep = ms => new Promise(r => setTimeout(r, ms));
app.whenReady().then(() => setTimeout(async () => {
  const win = RealBrowserWindow.getAllWindows()[0];
  const ev = c => win.webContents.executeJavaScript(c);
  const step = (n, x) => console.log('STEP', n, typeof x === 'string' ? x : JSON.stringify(x));
  const tabNames = () => ev(`Array.from(document.querySelectorAll('#tabs button')).map(b=>b.textContent)`);
  try {
    const names = await tabNames();
    step('tabs', names);
    if (!process.env.GAMES) { step('Games hidden by default', names.indexOf('Games') < 0); app.quit(); return; }
    const gi = names.indexOf('Games');
    step('Games tab present', gi >= 0);
    await ev(`document.querySelectorAll('#tabs button')[${gi}].click()`); await sleep(2500);
    const g = code => ev(`(function(){ var d=document.querySelectorAll('iframe')[${gi}].contentDocument; ${code} })()`);
    for (const game of ['TruthValues1', 'TruthValues2']) {
      await g(`var s=d.getElementById('gameSelect'); s.value='${game}'; s.dispatchEvent(new Event('change'));`);
      await sleep(3500);
      step(game, await g(`var ta=d.querySelector('#journalDiv textarea'); return { hasJournal: !!ta, firstLines: ta && ta.value.trim().split('\\n').filter(Boolean).slice(0,2), button: d.querySelector('#trueButtonDiv button') && d.querySelector('#trueButtonDiv button').textContent };`));
      // select the first formula's text and click True?
      step(game + ' True? on first formula', await g(`var ta=d.querySelector('#journalDiv textarea'); var sub='${game==="TruthValues1"?"True & False":"True \\u2228 False"}'; var i=ta.value.indexOf(sub); var e=i+sub.length; ta.focus(); ta.setSelectionRange(i, e); d.querySelector('#trueButtonDiv button').click(); return 'selected ['+sub+']';`));
      await sleep(800);
      fs.writeFileSync(path.join(os.tmpdir(), 'deriver-games-' + game + '.png'), (await win.webContents.capturePage()).toPNG());
      step(game + ' after', await g(`var ta=d.querySelector('#journalDiv textarea'); return JSON.stringify(ta.value.slice(0,200)) + ' err=' + (d.getElementById('errorLabelDiv')?'':'');`));
    }
    // the three games that fill the page themselves
    for (const game of ['ModalTruthTable', 'Branches', 'Quiz']) {
      await g(`var s=d.getElementById('gameSelect'); s.value='${game}'; s.dispatchEvent(new Event('change'));`);
      await sleep(3500);
      fs.writeFileSync(path.join(os.tmpdir(), 'deriver-games-' + game + '.png'), (await win.webContents.capturePage()).toPNG());
      step(game, await g(`var q=function(id){var e=d.getElementById(id); return e? e.children.length : -1}; return { title: d.defaultView.Parameters.fTitle, parser: d.defaultView.Parameters.fParser, worlds: q('worlds'), access: q('access'), label: q('label'), input: q('input'), tree: q('tree'), tabbed: q('tabbedPanel'), journalEmpty: d.getElementById('journal').children.length===0, checkboxes: d.querySelectorAll('input[type=checkbox]').length, buttons: d.querySelectorAll('button').length };`));
    }
    // Branches draws diagonals (images/leftDiag.png, rightDiag.png): extend a disjunction and check the images really load
    await g(`var s=d.getElementById('gameSelect'); s.value='Branches'; s.dispatchEvent(new Event('change'));`); await sleep(3500);
    const imgs = await g(`(function(){ var cells=Array.from(d.querySelectorAll('#tree td')); var c=cells.filter(function(t){return /[\\u2228v]/.test(t.textContent) && !/SM|\\u221a/.test(t.textContent) && t.textContent.length<30})[0];
      var row = c && c.closest('tr'); if (row) { ['mousedown','mouseup','click'].forEach(function(ev){ row.dispatchEvent(new MouseEvent(ev,{bubbles:true})); c.dispatchEvent(new MouseEvent(ev,{bubbles:true})); }); }
      var ext=Array.from(d.querySelectorAll('button')).find(function(b){return b.textContent==='Extend'}); ext.click(); return 'clicked'; })()`);
    await sleep(1500);
    step('Branches diagonals: images present and loaded', await g(`return Array.from(d.querySelectorAll('#tree img')).map(function(i){ return { src: i.src.replace(/^.*\\/\\/[^/]+/, ''), loaded: i.naturalWidth > 0 }; });`));
    for (const game of ['TruthTable', 'MainConnective', 'Satisfiable', 'Consistent', 'Invalid']) {
      await g(`var s=d.getElementById('gameSelect'); s.value='${game}'; s.dispatchEvent(new Event('change'));`);
      await sleep(3000);
      step(game, await g(`return { title: d.defaultView.Parameters.fTitle, text: d.getElementById('instructions').textContent.slice(0,40),
        widgetChildren: d.getElementById('input').children.length, select: d.getElementById('gameSelect').value };`));
    }
    const img = await win.webContents.capturePage();
    fs.writeFileSync(path.join(os.tmpdir(), 'deriver-games.png'), img.toPNG());
    step('screenshot', path.join(os.tmpdir(), 'deriver-games.png'));
  } catch (e) { console.log('FAIL', e); }
  app.quit();
}, 4000));
