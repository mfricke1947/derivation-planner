// Privacy check: while every tab starts up, nothing may be requested from outside this computer (Chromium-level requests; "Open from URL" uses Node, not tested here).
const electron = require('electron'); const { app, BrowserWindow: RW, session } = electron; const path = require('path');
class BW extends RW { constructor(o) { super(Object.assign({}, o, { show: false })); } }
BW.getAllWindows = RW.getAllWindows; BW.fromWebContents = RW.fromWebContents; electron.BrowserWindow = BW;
require('./seed').seedUserData(app, { fParser: 'bergmann', gamesTab: true });
const outside = [];
app.whenReady().then(() => {
  session.defaultSession.webRequest.onCompleted(d => { try { const u = new URL(d.url); if (!['127.0.0.1', 'localhost'].includes(u.hostname) && !['data:', 'blob:', 'devtools:', 'chrome:'].includes(u.protocol)) outside.push(d.url); } catch (e) {} });
  session.defaultSession.webRequest.onErrorOccurred(d => { try { const u = new URL(d.url); if (!['127.0.0.1', 'localhost'].includes(u.hostname) && u.protocol.startsWith('http')) outside.push('(failed) ' + d.url); } catch (e) {} });
});
require(path.resolve(__dirname, '..') + '/main.js');
app.whenReady().then(() => setTimeout(async () => {
  const win = RW.getAllWindows()[0];
  for (let i = 0; i < 60 && !(await win.webContents.executeJavaScript('!!(window.widgetsReady && window.widgetsReady())')); i++) await new Promise(r => setTimeout(r, 500));
  await new Promise(r => setTimeout(r, 4000));
  for (const t of ['Games', 'Symbolize', 'Interpretations', 'Trees', 'Proofs']) { await win.webContents.executeJavaScript(`window.showTab(${JSON.stringify(t)})`); await new Promise(r => setTimeout(r, 2500)); }
  const ok = outside.length === 0;
  console.log(ok ? 'PASS' : 'FAIL', 'requests leaving this computer:', JSON.stringify(outside));
  app.exit(ok ? 0 : 1);
}, 1000));
