const { app, BrowserWindow, ipcMain, Menu, dialog } = require('electron');
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');
const prefs = require('./prefs');
const lgc = require('./lgc');
const beans = require('./beans');
const interp = require('./interp');
const proofstate = require('./proofstate');
const treestate = require('./treestate');
const htmldoc = require('./htmldoc');

// Shared preferences (all four tabs); loaded at start, changed via the Preferences window.
let currentPrefs = null;
let mainWindow = null;

// Save/Open (see lgc.js): the currently open .lgc file, if any, and its last-known raw text
// (kept so Save can splice the Journal back in without disturbing any Proofs/Interpretations/
// Trees state already in the file — this app only reads/writes the Journal so far).
let currentFilePath = null;
let currentRawXml = null;
let currentDisplayName = null; // set instead of currentFilePath by Open from URL (no local path yet)
let currentKind = 'lgc';       // 'lgc' or 'html': what kind of document is open (decides what Save writes)
let currentRawHtml = null;     // for an opened HTML page: its text, so Save keeps the page's own <head>
let dirty = false;             // true once the Journal has changed since the last open/save
let lastSavedJournalHtml = ''; // compared against on each poll (see watchDirty) to derive `dirty`
let lastSavedDiagramJson = null; // the widget's diagram (as JSON) at the last open/save; see writeTo
let lastSavedProofJson = null;   // likewise for the Proofs widget's proof
let lastSavedTreeJson = null;    // and the Trees widget's tree

// The app's name is now "Derivation Planner" (package.json productName), so its settings folder is
// .../Application Support/Derivation Planner. Earlier builds used "deriver-electron" (npm start, and the first packaged builds) or
// "Deriver"; carry preferences.json across once, from whichever of those exists, if the new folder has none yet.
try {
  const newFile = path.join(app.getPath('userData'), 'preferences.json');
  if (!fs.existsSync(newFile)) {
    for (const old of ['deriver-electron', 'Deriver']) {
      const oldFile = path.join(app.getPath('appData'), old, 'preferences.json');
      if (fs.existsSync(oldFile)) { fs.mkdirSync(path.dirname(newFile), { recursive: true }); fs.copyFileSync(oldFile, newFile); break; }
    }
  }
} catch (e) { console.log('could not carry settings over from an earlier folder:', e.message); }
app.setAboutPanelOptions({ applicationName: 'Derivation Planner', applicationVersion: app.getVersion(),
  copyright: 'Martin Frické',
  credits: 'Logic teaching tools (Deriver)\nmfricke@arizona.edu   softoption.us\n\nDeveloped by Martin Frické with the assistance of Claude Code (Anthropic), an AI coding assistant, under the author\'s direction.' });

// Where the compiled GWT widgets (the "war" folder) are: the copy bundled into a packaged app; otherwise, for development, the sibling
// Stegeman project if it is there (the live build), else the snapshot kept in this repository (widgets/war).
const SIBLING_WAR = path.resolve(__dirname, '../Stegeman/ProofsPublicCopy/ProofsPublic/war');
const WAR = process.env.DERIVER_WAR ||
  (app.isPackaged ? path.join(process.resourcesPath, 'war')
                  : (fs.existsSync(path.join(SIBLING_WAR, 'Proofs.html')) ? SIBLING_WAR : path.join(__dirname, 'widgets', 'war')));

const TYPES = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.gif': 'image/gif',
  '.svg': 'image/svg+xml', '.json': 'application/json', '.xml': 'application/xml'
};

// Serve war/ plus our own shell.html over http://127.0.0.1 so iframes and
// postMessage behave as they do on a normal web server (not file://).
function startServer() {
  return new Promise(resolve => {
    const server = http.createServer((req, res) => {
      let p = decodeURIComponent(req.url.split('?')[0]);
      if (p === '/' ) p = '/shell.html';
      // Three places are served: the shell page itself, our own start pages (pages/) and bundled third-party
      // compiled widgets (vendor/, e.g. the Symbolize widget), and the GWT project's war/ for everything else.
      const shellFile = path.join(__dirname, 'shell.html');
      let file, root;
      if (p === '/shell.html') { file = shellFile; root = __dirname; }
      else if (p.startsWith('/pages/') || p.startsWith('/vendor/')) {
        file = path.join(__dirname, path.normalize(p));
        root = path.join(__dirname, p.startsWith('/pages/') ? 'pages' : 'vendor');
      } else { file = path.join(WAR, path.normalize(p)); root = WAR; }
      if (file !== shellFile && !file.startsWith(root + path.sep)) {      // no escaping the served folders
        res.writeHead(403); return res.end();
      }
      const ownPage = file.startsWith(path.join(__dirname, 'pages') + path.sep);
      fs.readFile(file, (err, data) => {
        if (err) { console.log('404', p); res.writeHead(404); return res.end('Not found'); }
        res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
        // Modern Chromium throws in svg-edit's old IE9 feature check (browser.js),
        // which stops the editor initialising. Patch it on the fly; war/ stays untouched.
        if (path.basename(file) === 'browser.js' && file.includes('svg-edit')) {
          data = Buffer.from(data.toString().replace(
            'var pos = text.getStartPositionOfChar(0).x;',
            'var pos; try { pos = text.getStartPositionOfChar(0).x; } catch(e) { pos = 1; }'));
        }
        // Placement preview: the individual/property tools draw nothing until mouse-up, so
        // inject a small overlay that follows the mouse (Electron app only).
        if (/^svgEditorMF(Advanced)?\.html$/.test(path.basename(file))) {
          data = Buffer.from(data.toString().replace('</body>',
            `<script>${fs.readFileSync(path.join(__dirname, 'placement-preview.js'), 'utf8')}</script></body>`));
        }
        // Preferences: the widgets read their settings from a `var Parameters = {...}` block in
        // the host page. Right after that block's script, override it with the user's shared
        // preferences (page-specific keys such as fInputText/fTitle are left alone).
        // The shell page gets the current preferences, so it can decide which tabs apply (e.g. Symbolize).
        if (file === shellFile) {
          data = Buffer.from(data.toString().replace('<script>', `<script>window.DeriverPrefs = ${JSON.stringify(currentPrefs)};</script>\n<script>`));
        }
        if ((file.startsWith(WAR) || ownPage) && path.extname(file) === '.html') {
          const html = data.toString();
          const m = /var\s+Parameters\s*=/.exec(html);
          const end = m ? html.indexOf('</script>', m.index) : -1;
          if (end !== -1) {
            const inject = `</script><script>Object.assign(Parameters, ${JSON.stringify(prefs.asParameters(currentPrefs))});`;
            data = Buffer.from(html.slice(0, end) + inject + html.slice(end));
          }
        }
        res.end(data);
      });
    });
    server.listen(0, '127.0.0.1', () => resolve(server.address().port));
  });
}

// Self-check for automated builds (DERIVER_SMOKE_OUT=<file>): once every enabled tab's widget has started, write a small JSON report and quit.
// Exit code 0 = widgets came up, 1 = they did not within 90 s.
async function smokeTest(win, port) {
  const report = { version: app.getVersion(), platform: process.platform, arch: process.arch, packaged: app.isPackaged, war: WAR, widgetsReady: false, tabs: null };
  const deadline = Date.now() + 90000;
  await new Promise(r => win.webContents.once('did-finish-load', r));
  while (Date.now() < deadline) {
    try {
      if (await win.webContents.executeJavaScript('!!(window.widgetsReady && window.widgetsReady())')) { report.widgetsReady = true; break; }
    } catch (e) {}
    await new Promise(r => setTimeout(r, 500));
  }
  try { report.tabs = await win.webContents.executeJavaScript('Array.from(document.querySelectorAll("#tabs button")).map(b => b.textContent)'); } catch (e) {}
  fs.writeFileSync(process.env.DERIVER_SMOKE_OUT, JSON.stringify(report, null, 2));
  app.exit(report.widgetsReady ? 0 : 1);
}

app.whenReady().then(async () => {
  console.log(`${app.name} ${app.getVersion()} — settings in ${app.getPath('userData')}`);
  currentPrefs = prefs.load();
  const port = await startServer();
  const win = mainWindow = new BrowserWindow({
    width: 1300, height: 900, title: 'Derivation Planner',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: false,          // preload must replace window.prompt in the page's own world
      sandbox: false,
      nodeIntegrationInSubFrames: true  // so the svg-edit iframe gets the preload too
    }
  });
  // Echo page console output (including iframes) to the terminal for debugging.
  win.webContents.on('console-message', (e, level, msg, line, src) => {
    if (level >= 2) console.log(`[page] ${msg} (${src}:${line})`);
  });
  if (process.env.DERIVER_DEBUG) win.webContents.openDevTools({ mode: 'detach' });
  win.webContents.once('did-finish-load', () => {
    appWindowLoaded = true;
    if (pendingOpenPath) openWhenWidgetsReady();
  });
  win.loadURL(`http://127.0.0.1:${port}/`);
  if (process.env.DERIVER_SMOKE_OUT) smokeTest(win, port);
  buildMenu();
  updateTitle();
  watchDirty();
});

function openPreferences() {
  const w = new BrowserWindow({
    parent: mainWindow, modal: true, width: 580, height: Math.min(830, require('electron').screen.getPrimaryDisplay().workAreaSize.height - 40), resizable: true,
    minimizable: false, maximizable: false, title: 'Derivation Planner Preferences',
    webPreferences: { nodeIntegration: true, contextIsolation: false, sandbox: false }
  });
  w.setMenu(null);
  w.loadFile(path.join(__dirname, 'preferences.html'));
}

function buildMenu() {
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    { label: 'Derivation Planner', submenu: [
      { role: 'about' },
      { type: 'separator' },
      { label: 'Preferences…', accelerator: 'CmdOrCtrl+,', click: openPreferences },
      { type: 'separator' },
      { role: 'hide' }, { role: 'hideOthers' }, { role: 'unhide' },
      { type: 'separator' },
      { role: 'quit' }
    ] },
    { label: 'File', submenu: [
      { label: 'New', accelerator: 'CmdOrCtrl+N', click: newFile },
      { label: 'Open…', accelerator: 'CmdOrCtrl+O', click: openFile },
      { label: 'Open from URL…', accelerator: 'CmdOrCtrl+Shift+O', click: openFromURL },
      { type: 'separator' },
      { label: 'Save', accelerator: 'CmdOrCtrl+S', click: saveFile },
      { label: 'Save As…', accelerator: 'CmdOrCtrl+Shift+S', click: saveFileAs },
      { type: 'separator' },
      { label: 'Print Journal…', accelerator: 'CmdOrCtrl+P', click: printJournal },
      { label: 'Export Journal as PDF…', click: exportJournalPdf }
    ] },
    { role: 'editMenu' },
    { label: 'Journal', visible: !!(currentPrefs && currentPrefs.authorTools), submenu: [
      { label: 'Edit HTML Source…', accelerator: 'CmdOrCtrl+Shift+H',
        click: () => { if (mainWindow) mainWindow.webContents.executeJavaScript('window.showHtmlSource && window.showHtmlSource()'); } }
    ] },
    { role: 'viewMenu' }, { role: 'windowMenu' }
  ]));
}

// ---- Save/Open (.lgc, see lgc.js) ----------------------------------------------------------
// Phase 1: only the Journal round-trips. Opening a file that also has saved Proofs/
// Interpretations/Trees state in it doesn't restore that state into the widgets (not yet built),
// but re-saving that same file keeps it intact (see lgc.js's write()), so nothing is lost from
// the file itself — just not shown in this app yet.

function updateTitle() {
  const name = currentFilePath ? path.basename(currentFilePath) : (currentDisplayName || 'Untitled');
  if (mainWindow) mainWindow.setTitle(`Derivation Planner — ${name}${dirty ? ' •' : ''}`);
}

async function getActiveJournalHTML() {
  return mainWindow.webContents.executeJavaScript('window.getActiveJournalHTML()');
}

async function setActiveJournalHTML(html) {
  await mainWindow.webContents.executeJavaScript(
    `window.setActiveJournalHTML(${JSON.stringify(html)})`);
}

// Interpretations diagram (see interp.js/beans.js). Opening a document replaces the diagram in the
// Interpretations tab with the file's (an empty one clears it — a file is the whole document, as in
// the Swing app), and switches to that tab when the file has a diagram in it.
const EMPTY_DIAGRAM = { individuals: [], properties: [], arrows: [], skipped: 0 };

// The diagram as the Interpretations widget currently has it (null if it isn't ready). `quick`
// skips the widget's own refresh of derived state — used by the poll, since the widget re-derives
// it every second itself.
async function currentDiagram(quick) {
  try { return await mainWindow.webContents.executeJavaScript(`window.getDiagram(${quick ? 'true' : 'false'})`); }
  catch (e) { return null; }
}
async function rememberDiagram() {
  const d = await currentDiagram();
  lastSavedDiagramJson = d ? JSON.stringify(d) : null;
}

// The proof as the Proofs widget currently has it ({head, tail}), or null if it isn't ready.
async function currentProof() {
  try { return await mainWindow.webContents.executeJavaScript('window.getProof()'); }
  catch (e) { return null; }
}
async function rememberProof() {
  const p = await currentProof();
  lastSavedProofJson = p ? JSON.stringify(p) : null;
}

// The tree as the Trees widget currently has it ({root: node} or {root: null}), or null if it isn't ready.
async function currentTree() {
  try { return await mainWindow.webContents.executeJavaScript('window.getTree()'); }
  catch (e) { return null; }
}
async function rememberTree() {
  const t = await currentTree();
  lastSavedTreeJson = t ? JSON.stringify(t) : null;
}

// The logical system ("parser") a proof was saved with. Only the tree structure of formulas is stored, so a
// proof displays in whatever notation the app is set to, but rule names in its justifications ("⊃E") are
// system-specific; the Swing app has no Stegeman parser, so that preference is written as the default one.
const PARSER_CLASS = { default: 'TDefaultParser', barwise: 'TBarwiseParser', bergmann: 'TBergmannParser',
  copi: 'TCopiParser', gentzen: 'TGentzenParser', girle: 'TGirleParser', hausman: 'THausmanParser',
  herrick: 'THerrickParser', howson: 'THowsonParser', stegeman: 'TDefaultParser' };
const parserClassNow = () => 'us.softoption.parser.' + (PARSER_CLASS[currentPrefs.fParser] || 'TDefaultParser');

const TAB_BY_INDEX = ['Proofs', 'Interpretations', 'Trees'];   // TDocState.tabIndex in the Swing app

// Puts a file's diagram and proof into their widgets (an empty one clears/resets it — a file is the whole
// document, as in the Swing app), and shows the tab the file was saved on if it has content, else the
// first tab that does.
async function showStateFrom(xml) {
  let d = EMPTY_DIAGRAM, proof = null, tree = null, docState = null;
  try {
    const values = beans.readDocument(xml);
    d = interp.extract(values);
    proof = proofstate.extract(values);
    tree = treestate.extract(values);
    docState = values.find(v => v && /TDocState$/.test(v.$class || '')) || null;
  } catch (e) { console.log('Could not read the diagram/proof in this file:', e.message); }

  const hasProof = proofstate.hasContent(proof), hasDiagram = !interp.isEmpty(d), hasTree = treestate.hasContent(tree);
  await mainWindow.webContents.executeJavaScript(`window.loadDiagram(${JSON.stringify(d)})`);
  // Load proof and tree, then CHECK the panels really show them (a widget that cannot read what it is given leaves the previous
  // document's proof/tree in place, which would look like part of the new file). Retry once; if still wrong, say so.
  const hasLines = p => !!p && p.head.concat(p.tail).some(l => l.formula);
  const proofMatches = async () => {
    const shown = await mainWindow.webContents.executeJavaScript('window.getProof()');
    if (!shown) return true;                                            // no Proofs API (older build): nothing to check
    return hasProof ? canon({ head: shown.head, tail: shown.tail }) === canon({ head: proof.head, tail: proof.tail }) : !hasLines(shown);
  };
  const treeMatches = async () => {
    const shown = await mainWindow.webContents.executeJavaScript('window.getTree()');
    if (!shown) return true;
    return hasTree ? canon(shown.root) === canon(tree.root) : !treestate.hasContent(shown);
  };
  const loadProof = () => mainWindow.webContents.executeJavaScript(`window.setProof(${hasProof ? JSON.stringify({ head: proof.head, tail: proof.tail }) : 'null'})`);
  const loadTree = () => mainWindow.webContents.executeJavaScript(`window.setTree(${hasTree ? JSON.stringify({ root: tree.root }) : '{"root":null}'})`);
  const notShown = [];
  await loadProof();
  if (!(await proofMatches())) { console.log('Proofs panel did not take the loaded proof; retrying'); await new Promise(r => setTimeout(r, 500)); await loadProof(); if (!(await proofMatches())) notShown.push('proof'); }
  await loadTree();
  if (!(await treeMatches())) { console.log('Trees panel did not take the loaded tree; retrying'); await new Promise(r => setTimeout(r, 500)); await loadTree(); if (!(await treeMatches())) notShown.push('tree'); }
  if (notShown.length) {
    console.log('LOAD VERIFICATION FAILED:', notShown.join(', '));
    dialog.showMessageBox(mainWindow, { type: 'warning', message: `The ${notShown.join(' and ')} panel could not be updated to match this file.`,
      detail: 'What the panel shows may be left over from the previous document. Please choose New, then open the file again.' });
  }

  const has = { Proofs: hasProof, Interpretations: hasDiagram, Trees: hasTree };
  const saved = TAB_BY_INDEX[(docState && docState.tabIndex) || 0];
  const enabled = await mainWindow.webContents.executeJavaScript('window.hasTab(' + JSON.stringify(saved) + ')');
  // the document's own saved tab wins whenever that tab is switched on (an empty tab still has its tools);
  // otherwise the first tab that has content
  const tab = enabled ? saved : Object.keys(has).find(k => has[k]);
  if (tab) await mainWindow.webContents.executeJavaScript(`window.showTab(${JSON.stringify(tab)})`);
  await rememberDiagram();          // baselines for "has it changed since?" (see writeTo)
  await rememberProof();
  await rememberTree();

  if (d.skipped) dialog.showMessageBox(mainWindow, { type: 'warning', message:
    `${d.skipped} item(s) in this file's diagram could not be shown.` });
  const savedWith = (hasProof && proof.parser) ? proof.parser.split('.').pop() : (hasTree && tree.parser ? tree.parser.split('.').pop() : null);
  if (savedWith && savedWith !== parserClassNow().split('.').pop())
    dialog.showMessageBox(mainWindow, { type: 'info', message: `This document was saved with the ${savedWith.replace(/^T|Parser$/g, '')} logical system, ` +
      `but the app is set to ${parserClassNow().split('.').pop().replace(/^T|Parser$/g, '')}. It is shown in the current notation; ` +
      `choose the matching system in Preferences to see its own rule names and symbols.` });
  return d;
}

// No edit event exists to hook (the Journal may be a GWT RichTextArea in any of three separate
// iframes), so unsaved-changes state is derived by periodically comparing the active tab's
// current Journal content against what was last opened/saved.
function watchDirty() {
  let busy = false;
  setInterval(async () => {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    // Not while the page is (re)loading, and never two checks at once: each question put to a loading page waits on a
    // 'did-stop-loading' listener, and a slow check (widgets still starting) used to pile them up until Electron warned.
    if (busy || mainWindow.webContents.isLoading()) return;
    busy = true;
    try { await checkDirty(); } finally { busy = false; }
  }, 1500);
}
async function checkDirty() {
  {
    let html;
    try { html = await getActiveJournalHTML(); } catch (e) { return; }
    const d = await currentDiagram(true);
    const diagramChanged = d !== null && lastSavedDiagramJson !== null && JSON.stringify(d) !== lastSavedDiagramJson;
    const p = await currentProof();
    const proofChanged = p !== null && lastSavedProofJson !== null && JSON.stringify(p) !== lastSavedProofJson;
    const t = await currentTree();
    const treeChanged = t !== null && lastSavedTreeJson !== null && JSON.stringify(t) !== lastSavedTreeJson;
    const nowDirty = html !== lastSavedJournalHtml || diagramChanged || proofChanged || treeChanged;
    if (nowDirty !== dirty) { dirty = nowDirty; updateTitle(); }
  }
}

// Resets proof, tree and drawing (an HTML page or a New document has none of its own).
function clearState() {
  return Promise.all([
    mainWindow.webContents.executeJavaScript(`window.loadDiagram(${JSON.stringify(EMPTY_DIAGRAM)})`),
    mainWindow.webContents.executeJavaScript('window.setProof(null)'),
    mainWindow.webContents.executeJavaScript('window.setTree({"root":null})')]).then(rememberDiagram).then(rememberProof).then(rememberTree);
}

function newFile() {
  currentFilePath = null;
  currentRawXml = null;
  currentRawHtml = null;
  currentKind = 'lgc';
  currentDisplayName = null;
  lastSavedJournalHtml = '';
  dirty = false;
  Promise.all([setActiveJournalHTML(''), clearState()]).then(async () => { lastSavedJournalHtml = await getActiveJournalHTML(); }).then(updateTitle);
}

// Opens a document's text, whichever kind it is: a legacy .lgc (XML) loads the Journal plus proof/tree/drawing; anything else is
// an HTML page whose <body> becomes the Journal (with no proof/tree/drawing, as after New). `filePath` is set for a local file,
// else `displayName` (Open from URL: no local file yet, so Save asks where to put it).
async function openText(text, filePath, displayName) {
  if (htmldoc.looksLikeLgc(text)) {
    const { journalHtml } = lgc.read(text);
    currentKind = 'lgc'; currentRawHtml = null;
    currentFilePath = filePath; currentDisplayName = filePath ? null : displayName;
    currentRawXml = text;
    lastSavedJournalHtml = journalHtml;
    dirty = false;
    await setActiveJournalHTML(journalHtml);
    await showStateFrom(text);
  } else {
    currentKind = 'html'; currentRawHtml = text; currentRawXml = null;
    currentFilePath = filePath; currentDisplayName = filePath ? null : (displayName || htmldoc.titleOf(text) || 'Untitled');
    dirty = false;
    await setActiveJournalHTML(htmldoc.bodyOf(text));
    await clearState();
    const wanted = htmldoc.parserOf(text);                        // an exercise page can say which notation it was written for
    if (wanted && wanted !== currentPrefs.fParser)
      dialog.showMessageBox(mainWindow, { type: 'info', message: `This exercise was written for the ${wanted} notation, but the app is set to ${currentPrefs.fParser}.`,
        detail: `Choose ${wanted} in Derivation Planner > Preferences… to match it (saving Preferences reloads the tabs, so do that first, then open the file again).` });
  }
  // The editor normalises the HTML it is given (e.g. drops the <html>/<head> wrapper), so the
  // "unchanged" baseline must be what it reports back, not the raw text from the file.
  lastSavedJournalHtml = await getActiveJournalHTML();
  updateTitle();
}

async function openFile() {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Open Logic or HTML File',
    filters: [{ name: 'Logic and HTML files', extensions: ['lgc', 'html', 'htm'] }, { name: 'All files', extensions: ['*'] }],
    properties: ['openFile']
  });
  if (result.canceled || !result.filePaths.length) return;
  await openPath(result.filePaths[0]);
}

async function openPath(filePath) {
  try {
    await openText(fs.readFileSync(filePath, 'utf8'), filePath, null);
    console.log('Opened', filePath);
  } catch (e) {
    dialog.showErrorBox('Could not open file', `${filePath}\n\n${e.message}`);
  }
}

// Files handed to the app from outside (double-click in Finder/Explorer, "Open With", drag onto the icon).
// macOS sends 'open-file' (possibly before the window exists); Windows/Linux pass the path on the command line,
// and a second launch is forwarded to the running app ('second-instance').
let pendingOpenPath = null, appWindowLoaded = false;
// The widgets start a little after the page loads; opening a file earlier would have no panel to put its proof/tree/drawing into.
async function openWhenWidgetsReady() {
  for (let i = 0; i < 80; i++) {                 // up to ~40 s
    try { if (await mainWindow.webContents.executeJavaScript('!!(window.widgetsReady && window.widgetsReady())')) break; } catch (e) {}
    await new Promise(r => setTimeout(r, 500));
  }
  await new Promise(r => setTimeout(r, 2500));  // the drawing board finishes its own set-up on a 1 s timer; opening into it earlier fails
  const p = pendingOpenPath; pendingOpenPath = null;
  if (p) openPath(p);
}
const isOpenable = p => typeof p === 'string' && /\.(lgc|html?)$/i.test(p) && fs.existsSync(p);
function openFromOutside(p) {
  if (!isOpenable(p)) return;
  if (appWindowLoaded && mainWindow) { if (mainWindow.isMinimized()) mainWindow.restore(); mainWindow.focus(); openPath(p); }
  else pendingOpenPath = p;
}
app.on('open-file', (e, p) => { e.preventDefault(); openFromOutside(p); });
if (app.isPackaged) {
  if (!app.requestSingleInstanceLock()) app.quit();
  app.on('second-instance', (e, argv) => { const p = argv.slice(1).find(isOpenable); if (p) openFromOutside(p); else if (mainWindow) mainWindow.focus(); });
  const first = process.argv.slice(1).find(isOpenable); if (first) pendingOpenPath = first;
}

// Fetches a URL's text with the (few) redirects a shared exercise link tends to hit — e.g. a
// plain http:// link the server 301s to https://, or a CMS URL that redirects to its real path.
function fetchText(url, redirectsLeft) {
  if (redirectsLeft === undefined) redirectsLeft = 5;
  return new Promise((resolve, reject) => {
    let parsed;
    try { parsed = new URL(url); } catch (e) { return reject(new Error('Not a valid URL')); }
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:')
      return reject(new Error('Only http:// and https:// URLs are supported'));
    const client = parsed.protocol === 'https:' ? https : http;
    client.get(url, res => {
      const { statusCode, headers } = res;
      if (statusCode >= 300 && statusCode < 400 && headers.location) {
        res.resume();
        if (redirectsLeft <= 0) return reject(new Error('Too many redirects'));
        return resolve(fetchText(new URL(headers.location, url).toString(), redirectsLeft - 1));
      }
      if (statusCode !== 200) { res.resume(); return reject(new Error('Server returned status ' + statusCode)); }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
      res.on('error', reject);
    }).on('error', reject);
  });
}

// Small modal text-entry dialog, in the same style as the deriver-prompt one below but a
// standalone Promise (this one drives a menu action directly in the main process, rather than
// unblocking a page's own synchronous window.prompt()).
function promptForText(title, message, placeholder) {
  return new Promise(resolve => {
    const dlg = new BrowserWindow({
      parent: mainWindow, modal: true, width: 480, height: 170, resizable: false,
      minimizable: false, maximizable: false, title,
      webPreferences: { nodeIntegration: true, contextIsolation: false, sandbox: false }
    });
    dlg.setMenu(null);
    let answered = false;
    const finish = value => { if (answered) return; answered = true; if (!dlg.isDestroyed()) dlg.close(); resolve(value); };
    ipcMain.once('deriver-url-result', (e, value) => { if (e.sender === dlg.webContents) finish(value); });
    dlg.on('closed', () => finish(null));
    const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
    const html = `<!DOCTYPE html><meta charset="utf-8"><body style="font:14px system-ui;margin:16px">
      <div style="margin-bottom:10px">${esc(message)}</div>
      <input id="v" placeholder="${esc(placeholder || '')}" style="width:100%;box-sizing:border-box;font-size:15px;padding:4px">
      <div style="margin-top:14px;text-align:right">
        <button id="c">Cancel</button> <button id="o" style="font-weight:600">Open</button></div>
      <script>
        const {ipcRenderer}=require('electron'), v=document.getElementById('v');
        const send=x=>ipcRenderer.send('deriver-url-result',x);
        document.getElementById('o').onclick=()=>send(v.value);
        document.getElementById('c').onclick=()=>send(null);
        v.addEventListener('keydown',e=>{if(e.key==='Enter')send(v.value);if(e.key==='Escape')send(null);});
        v.focus();
      </script></body>`;
    dlg.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html));
  });
}

async function openFromURL() {
  const url = await promptForText('Open from URL', 'URL of a .lgc or .html exercise:', 'https://example.com/exercise.lgc');
  if (!url) return;
  try {
    const text = await fetchText(url);
    let name;
    try { name = decodeURIComponent(new URL(url).pathname.split('/').pop()) || url; } catch (e) { name = url; }
    await openText(text, null, name);       // came from the web, not a local file — Save will ask where to put it
  } catch (e) {
    dialog.showErrorBox('Could not open URL', `${url}\n\n${e.message}`);
  }
}

// Safety net: after writing, read the file back and check that each part Electron was asked to save (proof, tree,
// drawing) really is in it and equals what was on screen. Returns the names of any parts that are not. This exists
// because a part that cannot be matched in the file's structure must never go missing without a word (it once did:
// proofs in files from the older obfuscated builds, whose proof section is called `bG`).
const canon = v => JSON.stringify(v, (k, x) => x && typeof x === 'object' && !Array.isArray(x)
  ? Object.keys(x).sort().reduce((o, key) => (o[key] = x[key], o), {}) : x);
function verifySaved(xml, expected) {
  const problems = [];
  try {
    const values = beans.readDocument(xml);
    if (expected.proof) {
      const back = proofstate.extract(values);
      if (!back || canon({ head: back.head, tail: back.tail }) !== canon(expected.proof)) problems.push('proof');
    }
    if (expected.tree) {
      const back = treestate.extract(values);
      if (!back || canon(back.root) !== canon(expected.tree.root)) problems.push('tree');
    }
    if (expected.diagram) {
      const back = interp.extract(values), d = expected.diagram;
      const norm = x => canon({ i: x.individuals.map(a => [a.name, a.x, a.y]).sort(), p: x.properties.map(a => [a.name, a.x, a.y, a.width, a.height, a.color]).sort(),
        a: x.arrows.map(a => [a.kind, a.name, a.from, a.to]).sort() });
      if (norm(back) !== norm(d)) problems.push('drawing');
    }
  } catch (e) { problems.push('the saved file could not be re-read (' + e.message + ')'); }
  return problems;
}

async function writeTo(filePath) {
  const journalHtml = await getActiveJournalHTML();
  // Rewrite the diagram only if it changed since it was opened/last saved (or there is no file
  // to preserve it from): an untouched diagram in an opened file then stays byte-for-byte as it was.
  const d = await currentDiagram();
  let diagramXml;
  if (d) {
    const json = JSON.stringify(d);
    if (!currentRawXml || json !== lastSavedDiagramJson) diagramXml = interp.toBeanXml(d);
    lastSavedDiagramJson = json;
  }
  // Same for the proof.
  const p = await currentProof();
  let proofXml;
  if (p) {
    const json = JSON.stringify(p);
    if (!currentRawXml || json !== lastSavedProofJson) proofXml = proofstate.toBeanXml(p, parserClassNow());
    lastSavedProofJson = json;
  }
  // And the tree ({root:null} = none started, in which case the file's own tree part is left as it is).
  const t = await currentTree();
  let treeXml, clearedTree = false;
  if (t) {
    const json = JSON.stringify(t);
    // a document with no original and an empty tree keeps the plain empty placeholder (as the Java app writes)
    if (t.root && (currentRawXml ? json !== lastSavedTreeJson : treestate.hasContent({ root: t.root })))
      treeXml = treestate.toBeanXml(t, parserClassNow());
    // A tree that was there when the file was opened/last saved and has since been cleared must replace it with the
    // empty placeholder (otherwise the old tree silently comes back on the next Open).
    else if (!t.root && currentRawXml && lastSavedTreeJson && JSON.parse(lastSavedTreeJson).root) {
      treeXml = ' <object class="us.softoption.tree.TTreeTableModel"/>'; clearedTree = true;
    }
    lastSavedTreeJson = json;
  }
  const xml = lgc.write(journalHtml, currentRawXml, { diagramXml, proofXml, treeXml });
  const problems = verifySaved(xml, { proof: proofXml && p, tree: treeXml && !clearedTree && t, diagram: diagramXml && d });
  fs.writeFileSync(filePath, xml, 'utf8');
  currentFilePath = filePath;
  currentDisplayName = null;
  currentRawXml = xml;
  currentKind = 'lgc'; currentRawHtml = null;
  lastSavedJournalHtml = journalHtml;
  dirty = false;
  updateTitle();
  if (problems.length) dialog.showMessageBox(mainWindow, { type: 'warning', message: 'Saved, but not everything could be written correctly.',
    detail: `The ${problems.join(' and ')} in the saved file does not match what is on screen. Please keep your original file, ` +
      `and tell whoever maintains Derivation Planner (details are in the terminal).` });
  if (problems.length) console.log('SAVE VERIFICATION FAILED for', filePath, ':', problems.join(', '));
}

// ---- Printing -------------------------------------------------------------------------------------------------
// Only the Journal is printed (the proof, tree and symbolizing panels reach it through their "Write ..." buttons, and a drawing through
// "Write Drawing"). It is printed from a page built from the Journal's HTML (htmldoc.printPage), in a hidden window with scripts off.
const docName = () => currentFilePath ? path.basename(currentFilePath) : (currentDisplayName || 'Untitled');

async function journalPrintWindow() {
  const html = await getActiveJournalHTML();
  if (!html || !html.replace(/<[^>]*>|&nbsp;|\s/g, '')) {
    dialog.showMessageBox(mainWindow, { type: 'info', message: 'There is nothing in the Journal to print.',
      detail: 'Printing covers the Journal only (use the Journal tabs, or "Write Proof", "Write Tree" and "Write Drawing" to put work into it).' });
    return null;
  }
  const file = path.join(os.tmpdir(), 'deriver-print-' + process.pid + '-' + Date.now() + '.html');
  fs.writeFileSync(file, htmldoc.printPage(html, docName()), 'utf8');
  const w = new BrowserWindow({ show: false, webPreferences: { javascript: false, sandbox: true, contextIsolation: true } });
  await w.loadFile(file);
  return { w, done: () => { try { w.destroy(); } catch (e) {} fs.unlink(file, () => {}); } };
}

async function printJournal() {
  const p = await journalPrintWindow();
  if (!p) return;
  p.w.webContents.print({ silent: false, printBackground: true }, () => p.done());
}

// `toFile` is for the tests; normally the user is asked where to put the PDF.
async function exportJournalPdf(toFile) {
  let target = typeof toFile === 'string' ? toFile : null;
  if (!target) {
    const r = await dialog.showSaveDialog(mainWindow, { title: 'Export Journal as PDF', defaultPath: docName().replace(/\.[^.]*$/, '') + '.pdf', filters: [{ name: 'PDF', extensions: ['pdf'] }] });
    if (r.canceled || !r.filePath) return;
    target = r.filePath;
  }
  const p = await journalPrintWindow();
  if (!p) return;
  try {
    const pdf = await p.w.webContents.printToPDF({ printBackground: true, pageSize: /^en-(US|CA)/.test(app.getLocale()) ? 'Letter' : 'A4' });
    fs.writeFileSync(target, pdf);
  } catch (e) { dialog.showErrorBox('Could not export PDF', e.message); }
  finally { p.done(); }
}

// Writes the Journal as an HTML page (see htmldoc.wrap). HTML files hold only the Journal, so if there is a proof, tree or
// drawing the user is told it will not be in the file and can cancel.
async function writeHtmlTo(filePath) {
  const p = await currentProof(), t = await currentTree(), d = await currentDiagram();
  const extra = [proofstate.hasContent(p) && 'proof', treestate.hasContent(t) && 'tree', d && !interp.isEmpty(d) && 'drawing'].filter(Boolean);
  if (extra.length) {
    const r = await dialog.showMessageBox(mainWindow, { type: 'question', buttons: ['Save HTML anyway', 'Cancel'], defaultId: 1, cancelId: 1,
      message: `An HTML file holds only the Journal. The ${extra.join(' and ')} will not be saved in it.`,
      detail: 'To keep them, save as a Logic (.lgc) file instead.' });
    if (!r || r.response !== 0) return false;
  }
  const journalHtml = await getActiveJournalHTML();
  const title = path.basename(filePath).replace(/\.[^.]*$/, '');
  const html = htmldoc.wrap(journalHtml, currentKind === 'html' ? currentRawHtml : null, title);
  fs.writeFileSync(filePath, html, 'utf8');
  currentKind = 'html'; currentRawHtml = html; currentRawXml = null;
  currentFilePath = filePath; currentDisplayName = null;
  lastSavedJournalHtml = journalHtml;
  await rememberDiagram(); await rememberProof(); await rememberTree();   // the user was told these are not in an HTML file; don't keep flagging them
  dirty = false;
  updateTitle();
  return true;
}

const isHtmlPath = f => /\.html?$/i.test(f || '');

async function saveFile() {
  if (!currentFilePath) return saveFileAs();
  try { await (isHtmlPath(currentFilePath) ? writeHtmlTo(currentFilePath) : writeTo(currentFilePath)); }
  catch (e) { dialog.showErrorBox('Could not save file', `${currentFilePath}\n\n${e.message}`); }
}

async function saveFileAs() {
  const asHtml = currentKind === 'html';
  const base = currentFilePath ? path.basename(currentFilePath).replace(/\.[^.]*$/, '') : (currentDisplayName || 'Untitled').replace(/\.[^.]*$/, '');
  const filters = [{ name: 'Logic files', extensions: ['lgc'] }, { name: 'HTML files (Journal only)', extensions: ['html'] }];
  if (asHtml) filters.reverse();
  const result = await dialog.showSaveDialog(mainWindow, {
    title: 'Save',
    defaultPath: (currentFilePath ? path.dirname(currentFilePath) + path.sep : '') + base + (asHtml ? '.html' : '.lgc'),
    filters
  });
  if (result.canceled || !result.filePath) return;
  try { await (isHtmlPath(result.filePath) ? writeHtmlTo(result.filePath) : writeTo(result.filePath)); }
  catch (e) { dialog.showErrorBox('Could not save file', `${result.filePath}\n\n${e.message}`); }
}

ipcMain.handle('prefs-get', () => ({
  prefs: currentPrefs, defaults: prefs.defaults(), schema: prefs.SCHEMA, parsers: prefs.PARSERS,
  setups: Object.fromEntries(prefs.PARSERS.map(p => [p, prefs.parserSetup(p)])), symbolizeParsers: prefs.SYMBOLIZE_PARSERS, setupKeys: prefs.SETUP_KEYS
}));

ipcMain.on('prefs-save', (event, newPrefs) => {
  currentPrefs = prefs.save(newPrefs);
  buildMenu();                                  // the Journal menu is shown only with Authoring tools on
  const dlg = BrowserWindow.fromWebContents(event.sender);
  if (dlg) dlg.close();
  if (mainWindow) mainWindow.webContents.reloadIgnoringCache();   // widgets read Parameters at start-up
});

// Blocking prompt() replacement (see preload.js). The renderer waits on sendSync
// until the modal dialog is answered; null means cancelled, like a real prompt().
ipcMain.on('deriver-prompt', (event, message, defaultValue) => {
  const parent = BrowserWindow.fromWebContents(event.sender);
  const dlg = new BrowserWindow({
    parent, modal: true, width: 460, height: 190, resizable: false, minimizable: false,
    maximizable: false, title: 'Derivation Planner',
    webPreferences: { nodeIntegration: true, contextIsolation: false, sandbox: false }
  });
  dlg.setMenu(null);
  let answered = false;
  const finish = value => {
    if (answered) return;
    answered = true;
    event.returnValue = value;
    if (!dlg.isDestroyed()) dlg.close();
  };
  ipcMain.once('deriver-prompt-result', (e, value) => { if (e.sender === dlg.webContents) finish(value); });
  dlg.on('closed', () => finish(null));
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  const html = `<!DOCTYPE html><meta charset="utf-8"><body style="font:14px system-ui;margin:16px">
    <div style="margin-bottom:10px">${esc(message)}</div>
    <input id="v" value="${esc(defaultValue)}" style="width:100%;box-sizing:border-box;font-size:15px;padding:4px">
    <div style="margin-top:14px;text-align:right">
      <button id="c">Cancel</button> <button id="o" style="font-weight:600">OK</button></div>
    <script>
      const {ipcRenderer}=require('electron'), v=document.getElementById('v');
      const send=x=>ipcRenderer.send('deriver-prompt-result',x);
      document.getElementById('o').onclick=()=>send(v.value);
      document.getElementById('c').onclick=()=>send(null);
      v.addEventListener('keydown',e=>{if(e.key==='Enter')send(v.value);if(e.key==='Escape')send(null);});
      v.focus();v.select();
    </script></body>`;
  dlg.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html));
});

app.on('window-all-closed', () => app.quit());
