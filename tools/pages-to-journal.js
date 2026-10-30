#!/usr/bin/env node
// Turns the exercise pages of the widget website (a host page whose `var Parameters = {...}` block holds the exercise text) into plain HTML
// documents that DeriverElectron opens straight into its Journal (File > Open, or Open from URL). Nothing but the exercise content is kept.
//
//   node tools/pages-to-journal.js [options] <outDir> <page.html | folder> [<page.html | folder> ...]
// A folder stands for the .html pages directly inside it (not in sub-folders).
//
// Two kinds of exercise content are recognised in `Parameters` (a page can have both):
//   fInputText: "<p>…</p>"        -> the HTML as it is
//   tree0: "…", tree1: "…" (or proof0…, any word+number key holding text; these made the row of buttons on the old page)
//                                  -> one numbered list per word: <ol><li>…</li>…</ol> (select an item, then Start from selection)
// The page's <title> becomes a heading (--no-title to leave it out). The notation (fParser) is recorded in the file as
// <meta name="deriver-parser" content="barwise">, which the app reads when the file is opened.
//
// Output name = original name + SUFFIX before .html (default "E": Tutorial1Barwise.html -> Tutorial1BarwiseE.html); --suffix=X changes it.
// Existing output files are not overwritten unless --force is given. The original pages are only read.
const fs = require('fs'), path = require('path'), vm = require('vm');
const htmldoc = require('../htmldoc.js');

const args = process.argv.slice(2);
const opt = n => { const i = args.findIndex(a => a === '--' + n || a.startsWith('--' + n + '=')); if (i < 0) return undefined; const v = args[i].includes('=') ? args[i].split('=').slice(1).join('=') : true; args.splice(i, 1); return v; };
const noTitle = !!opt('no-title'), force = !!opt('force');
const suffixOpt = opt('suffix');                              // (read once: reading an option removes it)
const suffix = suffixOpt === undefined || suffixOpt === true ? 'E' : String(suffixOpt);
const [outDir, ...inputs] = args;
if (!outDir || !inputs.length) { console.log('usage: node tools/pages-to-journal.js [--suffix=E] [--no-title] [--force] <outDir> <page.html | folder> ...'); process.exit(1); }

// folders -> the .html/.htm pages in them (sorted; hidden files such as .DS_Store ignored)
const pages = [];
for (const inp of inputs) {
  let st;
  try { st = fs.statSync(inp); } catch (e) { console.log('SKIP    ' + inp + ': not found'); continue; }
  if (st.isDirectory()) fs.readdirSync(inp).filter(f => /\.html?$/i.test(f) && !f.startsWith('.')).sort().forEach(f => pages.push(path.join(inp, f)));
  else pages.push(inp);
}
if (!pages.length) { console.log('No .html pages found in what was given.'); process.exit(1); }

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const KNOWN_SETTINGS = /^f[A-Z]/;                                  // fParser, fPropLevel, ... (settings, not exercise text)

function readPage(file) {
  const html = fs.readFileSync(file, 'utf8');
  const ctx = vm.createContext({ window: {}, document: {}, alert() {}, console: { log() {} } });
  let found = false;
  for (const m of html.matchAll(/<script\b(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)) {
    try { vm.runInContext(m[1], ctx); } catch (e) { /* not a data script */ }
  }
  const P = vm.runInContext('typeof Parameters === "object" ? Parameters : null', ctx);
  if (!P) return null;
  return { P, title: (/<title>([\s\S]*?)<\/title>/i.exec(html) || [])[1] || '' };
}

function convert(file) {
  const page = readPage(file);
  if (!page) return { skip: 'no Parameters block' };
  const { P } = page;
  const parts = [], notes = [];
  if (!noTitle && page.title.trim()) parts.push('<h3>' + esc(page.title.trim()) + '</h3>');
  if (typeof P.fInputText === 'string' && P.fInputText.trim()) { parts.push(htmldoc.bodyOf(P.fInputText)); notes.push('text'); }
  // word+number keys: tree0..tree5, proof0.. -> one ordered list per word, in numeric order
  const groups = {};
  for (const k of Object.keys(P)) {
    const m = /^([A-Za-z]+)(\d+)$/.exec(k);
    if (m && typeof P[k] === 'string' && P[k].trim() && !KNOWN_SETTINGS.test(k)) (groups[m[1]] = groups[m[1]] || []).push([Number(m[2]), P[k]]);
  }
  for (const w of Object.keys(groups)) {
    const items = groups[w].sort((a, b) => a[0] - b[0]).map(x => '<li>' + esc(x[1].trim()) + '</li>');
    parts.push('<ol>\n' + items.join('\n') + '\n</ol>');
    notes.push(items.length + ' ' + w + ' items');
  }
  if (!notes.length) return { skip: 'no exercise text found (fInputText or word+number keys)' };
  const ignored = Object.keys(P).filter(k => KNOWN_SETTINGS.test(k) && k !== 'fInputText' && k !== 'fParser').map(k => k + '=' + P[k]);
  return { body: parts.join('\n'), parser: typeof P.fParser === 'string' ? P.fParser.split(/\s/)[0] : '', title: page.title.trim(), notes, ignored };
}

function outputFor(file, c) {
  let doc = htmldoc.wrap(c.body, null, c.title || path.basename(file, path.extname(file)));
  if (c.parser) doc = doc.replace('<meta charset="utf-8">', '<meta charset="utf-8">\n<meta name="deriver-parser" content="' + esc(c.parser) + '">');
  return doc;
}

fs.mkdirSync(outDir, { recursive: true });
let made = 0, skipped = 0;
for (const file of pages) {
  let c;
  try { c = convert(file); } catch (e) { c = { skip: 'could not read (' + e.message + ')' }; }
  const stem = path.basename(file).replace(/\.html?$/i, '');
  if (c.skip) { console.log('SKIP    ' + path.basename(file) + ': ' + c.skip); skipped++; continue; }
  const out = path.join(outDir, stem + suffix + '.html');
  if (fs.existsSync(out) && !force) { console.log('EXISTS  ' + path.basename(out) + ' (use --force to overwrite)'); skipped++; continue; }
  fs.writeFileSync(out, outputFor(file, c), 'utf8');
  console.log('OK      ' + path.basename(file) + '  ->  ' + path.basename(out) + '   [' + (c.parser || 'no parser') + '; ' + c.notes.join(', ') + ']' + (c.ignored.length ? '   settings not carried: ' + c.ignored.join(' ') : ''));
  made++;
}
console.log(made + ' written, ' + skipped + ' skipped');
