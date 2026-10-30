// Converts a proof between the legacy .lgc form (a decoded `TProofTableModel` — or the older
// `TProofListModel` — see beans.js) and the JSON the Proofs widget's window.deriverProof.get()/set()
// exchange (see TProofState.java in the GWT project):
//
//   { head: [line...], tail: [line...] }
//   line    = { lineNo, first, second, third, sub, headLevel, just, blank, lastAss, selectable,
//               subSelectable, derived, formula }
//   formula = null | { k: kind, i: info, l: left, r: right }       (TFormula's four public fields)
//
// `head` is the proof so far; `tail` is what remains, including the "? <<" insertion-marker line and
// the goal. Formulas are parse trees, not text, so nothing here depends on the logical notation.

// XMLEncoder leaves out fields equal to a fresh object's default, so absent means the default:
// TFormula: fKind = kons (2), fInfo = "" ; TProofline: numbers 0, booleans false, selectable true.
const DEFAULT_KIND = 2;

function treeOf(f) {
  if (!f || typeof f !== 'object') return null;
  return { k: f.fKind === undefined ? DEFAULT_KIND : f.fKind, i: f.fInfo === undefined ? '' : f.fInfo,
           l: treeOf(f.fLLink), r: treeOf(f.fRLink) };
}

const pick = (o, ...keys) => { for (const k of keys) if (o[k] !== undefined) return o[k]; return undefined; };

function lineOf(l) {
  return {
    lineNo: pick(l, 'lineNo', 'lineno') || 0,
    first: pick(l, 'firstjustno', 'firstJustno') || 0,
    second: pick(l, 'secondjustno', 'secondJustno') || 0,
    third: pick(l, 'thirdjustno', 'thirdJustno') || 0,
    sub: pick(l, 'subprooflevel', 'subproofLevel') || 0,
    headLevel: pick(l, 'headlevel', 'headLevel') || 0,
    just: pick(l, 'justification') || '',
    blank: !!pick(l, 'blankline', 'blankLine'),
    lastAss: !!pick(l, 'lastAssumption', 'lastassumption'),
    selectable: pick(l, 'selectable') === undefined ? true : !!pick(l, 'selectable'),
    subSelectable: !!pick(l, 'subProofSelectable', 'subproofSelectable'),
    derived: !!pick(l, 'derived'),
    formula: treeOf(l.formula)
  };
}

const items = list => (list && list.$items) || [];

// `values` = beans.readDocument() of a whole .lgc. Returns { head, tail, parser } or null if the file
// has no proof model. `parser` is the class the file's lines were drawn with (informational).
function extract(values) {
  // by package, not exact name: older obfuscated builds call the proof model `us.softoption.proofs.bG`
  const m = (values || []).find(v => v && /(^|\.)(proofs|proofwindow)\.[^.]+$/.test(v.$class || ''));
  if (!m) return null;
  const head = items(m.head).map(lineOf), tail = items(m.tail).map(lineOf);
  const first = items(m.head)[0] || items(m.tail)[0];
  const parser = first && first.parser && first.parser.$class ? first.parser.$class : null;
  return { head, tail, parser };
}

// A proof that has actual content: any line with a formula (a new/empty document has only a blank line
// and the "? <<" marker).
function hasContent(p) {
  return !!p && [...p.head, ...p.tail].some(l => l.formula && l.just.trim() !== '? <<');
}

// ---- JSON -> the legacy bean XML (a <object class="...TProofTableModel"> element) -------------------

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const PKG_PARSER = 'us.softoption.parser.';

function formulaXml(f, ids, indent) {
  const id = 'TFormulaP' + ids.n++;
  const set = (field, valueXml, pad) =>
    `${pad}<void class="${PKG_PARSER}TFormula" method="getField">\n${pad} <string>${field}</string>\n` +
    `${pad} <void method="set">\n${pad}  <object idref="${id}"/>\n${valueXml}\n${pad} </void>\n${pad}</void>\n`;
  const p = indent + ' ';
  let out = `${indent}<object class="${PKG_PARSER}TFormula" id="${id}">\n`;
  out += set('fKind', `${p}  <short>${f.k}</short>`, p);
  out += set('fInfo', `${p}  <string>${esc(f.i)}</string>`, p);
  if (f.l) out += set('fLLink', formulaXml(f.l, ids, p + '  '), p);
  if (f.r) out += set('fRLink', formulaXml(f.r, ids, p + '  '), p);
  return out + `${indent}</object>`;
}

function lineXml(l, parserClass, ids, indent) {
  const p = indent + ' ';
  const prop = (name, inner) => `${p}<void property="${name}">\n${p} ${inner}\n${p}</void>\n`;
  let out = `${indent}<void method="add">\n${p}<object class="us.softoption.proofs.TProofline">\n`;
  const q = p + ' ';
  const P = (name, inner) => `${q}<void property="${name}">\n${q} ${inner}\n${q}</void>\n`;
  if (l.blank) out += P('blankline', '<boolean>true</boolean>');
  if (l.first) out += P('firstjustno', `<int>${l.first}</int>`);
  if (l.formula) out += `${q}<void property="formula">\n${formulaXml(l.formula, ids, q + ' ')}\n${q}</void>\n`;
  if (l.headLevel) out += P('headlevel', `<int>${l.headLevel}</int>`);
  if (l.just) out += P('justification', `<string>${esc(l.just)}</string>`);
  if (l.lastAss) out += P('lastAssumption', '<boolean>true</boolean>');
  if (l.lineNo) out += P('lineNo', `<int>${l.lineNo}</int>`);
  out += P('parser', `<object class="${parserClass}"/>`);
  if (l.second) out += P('secondjustno', `<int>${l.second}</int>`);
  if (!l.selectable) out += P('selectable', '<boolean>false</boolean>');
  if (l.sub) out += P('subprooflevel', `<int>${l.sub}</int>`);
  if (l.subSelectable) out += P('subProofSelectable', '<boolean>true</boolean>');
  if (l.third) out += P('thirdjustno', `<int>${l.third}</int>`);
  if (l.derived) out += P('derived', '<boolean>true</boolean>');
  return out + `${p}</object>\n${indent}</void>\n`;
}

// `parserClass` is the logical system the lines are drawn with (e.g. 'us.softoption.parser.TBergmannParser').
function toBeanXml(p, parserClass) {
  const ids = { n: 0 };
  const list = (name, lines) =>
    `  <void property="${name}">\n${lines.map(l => lineXml(l, parserClass, ids, '   ')).join('')}  </void>\n`;
  return ` <object class="us.softoption.proofs.TProofTableModel">\n${list('head', p.head)}${list('tail', p.tail)} </object>`;
}

module.exports = { extract, hasContent, toBeanXml, treeOf };
