// The per-notation setup table in prefs.js (plain node, no Electron needed):  node tests/prefs-setup.js
const assert = require('assert');
const prefs = require('../prefs.js');
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };
for (const p of prefs.PARSERS) {
  const s = prefs.parserSetup(p);
  ok(prefs.SETUP_KEYS.every(k => typeof s[k] === 'boolean'), p + ': every setting is true/false');
  ok(prefs.SYMBOLIZE_PARSERS.includes(p) || s.tabSymbolize === false, p + ': no Symbolize tab for a notation the widget lacks');
}
// the screenshots of 2026-10-07 (spot checks of rows that differ from the rest)
ok(prefs.parserSetup('howson').tabProofs === false && prefs.parserSetup('howson').tabTrees === true && prefs.parserSetup('howson').fModal === true, 'howson: trees, no proofs, modal');
ok(prefs.parserSetup('stegeman').tabTrees === false && prefs.parserSetup('stegeman').tabInterpretations === false && prefs.parserSetup('stegeman').fPropLevel === true && prefs.parserSetup('stegeman').fDerive === false, 'stegeman: proofs only, propositional, no Derive');
ok(prefs.parserSetup('girle').tabProofs === false && prefs.parserSetup('girle').tabTrees === true && prefs.parserSetup('girle').fModal === true, 'girle: trees only, modal');
ok(prefs.parserSetup('gentzen').fFirstOrder === true && prefs.parserSetup('gentzen').fPropLevel === false, 'gentzen: first order, not propositional only');
ok(prefs.parserSetup('barwise').gamesTab === false && prefs.SETUP_KEYS.includes('gamesTab'), 'barwise starts without the Games tab (gamesTab is part of the table)');
ok(prefs.defaults().gamesTab === prefs.parserSetup('default').gamesTab, 'fresh start follows the default row, Games included');
console.log('prefs-setup: ' + n + ' checks passed');
