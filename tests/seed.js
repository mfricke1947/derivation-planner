// Settings for tests. Every test runs against a THROWAWAY settings folder (never the user's real one) whose preferences switch the four
// working tabs on and use the plain notation, so a test does not depend on the per-notation table in prefs.js or on anyone's own settings.
// (tests/e2e-tabs.js is the one that deliberately tests the table, and writes its own preferences.)
const fs = require('fs'), os = require('os'), path = require('path');
const BASE = { fParser: 'default', tabProofs: true, tabTrees: true, tabInterpretations: true, tabSymbolize: true, gamesTab: false,
  fDerive: true, fAdvancedMenu: true, fPropLevel: false, fFirstOrder: false, fIdentity: false, fSetTheory: false, fModal: false,
  fLambda: false, fTypeLabels: false, authorTools: false };
// Sets Electron's userData to a new temporary folder holding BASE + `extra`; returns the folder.
function seedUserData(app, extra) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'deriver-userdata-'));
  app.setPath('userData', dir);
  fs.writeFileSync(path.join(dir, 'preferences.json'), JSON.stringify(Object.assign({}, BASE, extra || {})));
  return dir;
}
module.exports = { BASE, seedUserData };
