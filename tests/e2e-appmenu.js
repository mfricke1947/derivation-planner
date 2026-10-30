// The first menu: About / Preferences / Quit. Labels follow app.name, which is `productName` in package.json when the app is started normally
// (under this test app.name is 'Electron' because the test script, not the project, is the main file).
const electron = require('electron'); const { app, BrowserWindow: RW, Menu } = electron; const path = require('path');
class BW extends RW { constructor(o) { super(Object.assign({}, o, { show: false })); } }
BW.getAllWindows = RW.getAllWindows; BW.fromWebContents = RW.fromWebContents; electron.BrowserWindow = BW;
require('./seed').seedUserData(app, {});
require(path.resolve(__dirname, '..') + '/main.js');
app.whenReady().then(() => setTimeout(() => {
  const labels = Menu.getApplicationMenu().items[0].submenu.items.filter(i => i.type !== 'separator').map(i => i.label);
  const ok = require('../package.json').productName === 'Derivation Planner' && labels[0] === 'About ' + app.name && labels.includes('Preferences…') && labels[labels.length - 1] === 'Quit ' + app.name;
  console.log(ok ? 'PASS' : 'FAIL', JSON.stringify({ name: app.name, labels }));
  app.exit(ok ? 0 : 1);
}, 4000));
