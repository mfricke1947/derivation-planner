// User preferences shared by all four tabs. They play the role the host web page's
// `var Parameters = {...}` played for the original widgets (see TPreferencesData.readParameters
// in the GWT source), and are injected into every served page by main.js.
//
// Caveat from readParameters: most boolean keys can only be switched ON by the value "true"
// ("false" is ignored); only fAdvancedMenu can be switched off. So only keys whose Java default
// is false (plus fAdvancedMenu) are offered as checkboxes.
const { app } = require('electron');
const fs = require('fs');
const path = require('path');

const PARSERS = ['default', 'barwise', 'bergmann', 'copi', 'gentzen', 'girle',
                 'hausman', 'herrick', 'howson', 'stegeman'];

// The Symbolize widget (bundled, 2012) knows only some logical systems; for the others the tab cannot work, so it is never offered.
const SYMBOLIZE_PARSERS = ['default', 'bergmann', 'copi', 'gentzen', 'hausman', 'herrick'];

// What each logical system needs. Choosing a parser in the Preferences dialog sets all of these (the user can then change them); a
// preferences file that has no value for one of them gets the parser's suggestion rather than a blanket default. Filled in from Martin's
// own settings for each of the ten notations (screenshots of the Preferences dialog, 2026-10-07). Games (gamesTab, added to the table 2026-10-09):
// on for every notation except barwise (a trees notation whose symbols differ from the games'); Martin sets the others as he works through them.
// Not part of the table, deliberately: Authoring tools, a personal choice. To change what a notation needs, edit its row.
const SETUP_KEYS = ['tabProofs', 'tabTrees', 'tabInterpretations', 'tabSymbolize', 'gamesTab', 'fDerive', 'fAdvancedMenu',
                    'fPropLevel', 'fFirstOrder', 'fIdentity', 'fSetTheory', 'fModal', 'fLambda', 'fTypeLabels'];
const T = true, F = false;
const row = (...v) => Object.fromEntries(SETUP_KEYS.map((k, i) => [k, v[i]]));
//                       Proofs Trees Interp Symb  Games Derive Adv   Prop  1stOrd Ident SetTh Modal Lambda TypeLb
const PARSER_SETUP = {
  default:  row(          F,    T,    F,     F,    T,    T,     T,    F,    T,     T,    T,    T,    F,     T),   // Proofs off: the default notation's proof rules show ∧ ⊃ (see CLAUDE.md, PARKED)
  barwise:  row(          F,    T,    T,     F,    F,    T,     F,    F,    F,     T,    F,    F,    F,     F),
  bergmann: row(          T,    T,    T,     T,    T,    T,     T,    F,    F,     F,    F,    F,    F,     F),
  copi:     row(          T,    F,    T,     T,    T,    T,     F,    F,    F,     F,    F,    F,    F,     F),
  gentzen:  row(          T,    T,    T,     T,    T,    T,     T,    F,    F,     F,    F,    F,    F,     F),
  girle:    row(          F,    T,    F,     F,    T,    F,     F,    F,    F,     F,    F,    T,    F,     F),
  hausman:  row(          T,    T,    T,     T,    T,    T,     F,    F,    F,     F,    F,    F,    F,     F),
  herrick:  row(          T,    T,    T,     T,    T,    T,     F,    F,    F,     F,    F,    F,    F,     F),
  howson:   row(          F,    T,    T,     F,    T,    T,     F,    F,    F,     F,    F,    T,    F,     F),
  stegeman: row(          T,    F,    F,     F,    T,    F,     F,    T,    F,     F,    F,    F,    F,     F)
};
// Symbolize only exists where the bundled widget does (SYMBOLIZE_PARSERS), whatever the row says.
function parserSetup(parser) {
  const out = Object.assign({}, PARSER_SETUP[parser] || PARSER_SETUP.default);
  if (!SYMBOLIZE_PARSERS.includes(parser)) out.tabSymbolize = false;
  return out;
}

// key, label, default, group. Booleans are checkboxes; fParser is a choice from PARSERS.
const SCHEMA = [
  { key: 'fParser',       group: 'Notation',  label: 'Logic parser / notation',                       def: 'default' },
  { key: 'tabProofs',     group: 'Tabs',   label: 'Proofs tab',                                    def: true  },
  { key: 'tabTrees',      group: 'Tabs',   label: 'Trees tab',                                     def: true  },
  { key: 'tabInterpretations', group: 'Tabs', label: 'Interpretations tab',                        def: true  },
  { key: 'tabSymbolize',  group: 'Tabs',   label: 'Symbolize tab (English \u2194 logic; only some notations)', def: true },
  { key: 'gamesTab',      group: 'Tabs',   label: 'Games tab (propositional practice games)',        def: false },
  { key: 'fDerive',       group: 'Proofs', label: 'Derive (the Wizard menu of automatic proof help)', def: true },
  { key: 'fAdvancedMenu', group: 'Proofs', label: 'Advanced menu',                                  def: true  },
  { key: 'fPropLevel',    group: 'Logic',  label: 'Propositional level only (no quantifiers)',      def: false },
  { key: 'fFirstOrder',   group: 'Logic',  label: 'First-order theories (induction)',               def: false },
  { key: 'fIdentity',     group: 'Logic',  label: 'Identity and functional terms (Interpretations palette)', def: false },
  { key: 'fSetTheory',    group: 'Logic',  label: 'Set theory symbols',                             def: false },
  { key: 'fModal',        group: 'Logic',  label: 'Modal logic',                                    def: false },
  { key: 'fLambda',       group: 'Logic',  label: 'Lambda calculus',                                def: false },
  { key: 'fTypeLabels',   group: 'Logic',  label: 'Type labels',                                    def: false },
  { key: 'authorTools',   group: 'Other',  label: 'Authoring tools (formatting toolbar and HTML source for the Journal)', def: false }
];

const file = () => path.join(app.getPath('userData'), 'preferences.json');
// Fresh start (no preferences file, or the Defaults button): the plain schema defaults, with the tab/Derive/menu/logic settings of the
// `default` notation row in the table above.
const defaults = () => Object.assign(Object.fromEntries(SCHEMA.map(s => [s.key, s.def])), parserSetup('default'));

// Keep only known keys with values of the right type; anything else falls back to the default.
function sanitize(raw) {
  const out = defaults();
  if (!raw || typeof raw !== 'object') return out;
  for (const s of SCHEMA) {
    const v = raw[s.key];
    if (s.key === 'fParser') { if (PARSERS.includes(v)) out.fParser = v; }
    else if (typeof v === 'boolean') out[s.key] = v;
  }
  // settings that the file does not have: what the chosen parser needs (not a blanket default)
  const setup = parserSetup(out.fParser);
  for (const k of SETUP_KEYS) if (typeof raw[k] !== 'boolean') out[k] = setup[k];
  return out;
}

function load() {
  try { return sanitize(JSON.parse(fs.readFileSync(file(), 'utf8'))); }
  catch (e) { return defaults(); }        // missing or corrupt file: start from defaults
}

function save(prefs) {
  const clean = sanitize(prefs);
  try {
    fs.mkdirSync(path.dirname(file()), { recursive: true });
    fs.writeFileSync(file(), JSON.stringify(clean, null, 2));
  } catch (e) { console.log('Could not save preferences:', e.message); }
  return clean;
}

// The Parameters values the widgets expect: everything is a string ("true"/"false").
function asParameters(prefs) {
  return Object.fromEntries(Object.entries(prefs).map(([k, v]) => [k, String(v)]));
}

module.exports = { PARSERS, SCHEMA, SYMBOLIZE_PARSERS, SETUP_KEYS, parserSetup, load, save, defaults, asParameters };
