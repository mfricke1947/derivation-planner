// Double-click / "Open With" behaviour: the app's 'open-file' event, both BEFORE the window has loaded (file waits) and while running.
const electron = require('electron'); const { app, BrowserWindow: RW, dialog } = electron;
const path = require('path');
class BW extends RW { constructor(o) { super(Object.assign({}, o, { show: false })); } }
BW.getAllWindows = RW.getAllWindows; BW.fromWebContents = RW.fromWebContents; electron.BrowserWindow = BW;
require('./seed').seedUserData(app, { fParser: 'bergmann' });
dialog.showErrorBox = (t, m) => console.log('ERRORBOX', t, m);
dialog.showMessageBox = async () => ({ response: 0 });
require(path.resolve(__dirname, '..') + '/main.js');
const tf = n => path.resolve(__dirname, '..', 'testfiles', n);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const fire = p => app.emit('open-file', { preventDefault() {} }, p);
fire(tf('PredExBergmann3.lgc'));                       // before the window exists
fire(path.join(__dirname, 'no-such-file.lgc'));        // ignored, no error box
fire(tf('README.md'));                                 // not a document type, ignored
app.whenReady().then(() => setTimeout(async () => {
  const win = RW.getAllWindows()[0]; const ev = c => win.webContents.executeJavaScript(c);
  const waitTitle = async re => { for (let i = 0; i < 120 && !re.test(win.getTitle()); i++) await sleep(500); await sleep(1500); };   // start-up speed varies
  await waitTitle(/PredExBergmann3\.lgc/);
  const t1 = win.getTitle(), d1 = await ev('window.getDiagram()');
  fire(tf('HalfFinished.lgc'));                        // while running
  await waitTitle(/HalfFinished\.lgc/);
  const t2 = win.getTitle();
  const ok = /PredExBergmann3\.lgc/.test(t1) && d1.individuals.length === 2 && /HalfFinished\.lgc/.test(t2);
  console.log(ok ? 'PASS' : 'FAIL', JSON.stringify({ t1, individuals: d1.individuals.length, t2 }));
  app.exit(ok ? 0 : 1);
}, 1000));
