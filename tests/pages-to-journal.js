// tools/pages-to-journal.js: a folder as input, hidden/non-html files ignored, a page with only commented-out exercises skipped, one bad input
// does not stop the others, no overwrite without --force.   (plain node)  node tests/pages-to-journal.js
const assert = require('assert'), fs = require('fs'), os = require('os'), path = require('path'), { execFileSync, spawnSync } = require('child_process');
const T = path.resolve(__dirname, '..', 'tools', 'pages-to-journal.js');
const d = fs.mkdtempSync(path.join(os.tmpdir(), 'p2j-')), src = path.join(d, 'src'), out = path.join(d, 'out');
fs.mkdirSync(src);
const page = body => '<html><head><title>T</title></head><body><script>var Parameters = {\n fParser: "gentzen",\n' + body + '\n};</script></body></html>';
fs.writeFileSync(path.join(src, 'B.html'), page('proof1: value="B1",\nproof0: value="B0",'));
fs.writeFileSync(path.join(src, 'A.html'), page('fInputText: "<p>hello</p>",'));
fs.writeFileSync(path.join(src, 'Commented.html'), page('/* proof0: value="X", */'));
fs.writeFileSync(path.join(src, '.hidden.html'), page('proof0: value="H",'));
fs.writeFileSync(path.join(src, 'notes.txt'), 'not a page');
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };
const run = (...a) => spawnSync(process.execPath, [T, ...a], { encoding: 'utf8' });
let r = run(out, src, path.join(d, 'missing'));
ok(r.status === 0, 'exits normally even with a missing input');
ok(fs.readdirSync(out).sort().join() === 'AE.html,BE.html', 'only the two real pages written (hidden, .txt and commented-out ones left out): ' + fs.readdirSync(out));
ok(/SKIP\s+Commented\.html/.test(r.stdout) && /SKIP\s+.*missing: not found/.test(r.stdout), 'skips are reported');
const b = fs.readFileSync(path.join(out, 'BE.html'), 'utf8');
ok(b.indexOf('B0') < b.indexOf('B1') && /<meta name="deriver-parser" content="gentzen">/.test(b), 'items in numeric order, notation recorded');
r = run(out, src); ok(/EXISTS\s+AE\.html/.test(r.stdout), 'no overwrite without --force');
r = run('--force', out, src); ok(/OK\s+A\.html\s+->\s+AE\.html/.test(r.stdout), '--force overwrites');
r = run('--suffix=Z', out, src); ok(fs.existsSync(path.join(out, 'AZ.html')) && !fs.existsSync(path.join(out, 'Aundefined.html')), '--suffix=Z names the outputs AZ.html (not Aundefined)');
r = run(out, path.join(src, 'notes.txt')); ok(/SKIP|could not|no exercise/.test(r.stdout) || r.status !== 0, 'a non-page file does not crash the tool');
console.log('pages-to-journal: ' + n + ' checks passed');
