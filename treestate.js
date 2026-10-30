// Converts a truth tree between the legacy .lgc form (a decoded `TTreeTableModel`, see beans.js) and the
// JSON the Trees widget's window.deriverTree.get()/set() exchange (see TTreeState.java in the GWT project):
//
//   { root: node }
//   node = { label }                                                  label-only spacer node
//        | { just, lineNo, first, second, dead, closed, world, ants:[formula], succ:[formula],
//            inst:[formula|string], children:[node] }
//   formula = { k, i, l, r }  (as in proofstate.js)
//
// The hierarchy is the same one the legacy file stores: formula nodes interleaved with label-only
// nodes ("LeftDiag", "RightDiag", "Vertical", "Closed") that the table view uses for layout.

const { treeOf } = require('./proofstate');

const items = list => (list && list.$items) || [];
const pick = (o, ...keys) => { for (const k of keys) if (o[k] !== undefined) return o[k]; return undefined; };

function nodeOf(dm) {
  let u = dm.userObject;
  const children = items(dm).map(nodeOf);
  if (typeof u === 'string') return { label: u, children };
  u = u || {};
  return {
    just: pick(u, 'justification') || '',
    lineNo: pick(u, 'lineno', 'lineNo') || 0,
    first: pick(u, 'firstJustno', 'firstjustno') || 0,
    second: pick(u, 'secondJustno', 'secondjustno') || 0,
    dead: !!u.fDead,
    closed: !!u.fClosed,
    world: u.fWorld || '',
    ants: items(u.fAntecedents).map(treeOf),
    succ: items(u.fSuccedent).map(treeOf),
    inst: items(u.fInstantiations).map(x => typeof x === 'string' ? x : treeOf(x)),
    children
  };
}

// `values` = beans.readDocument() of a whole .lgc. Returns { root, parser } or null when the file has no tree.
function extract(values) {
  const m = (values || []).find(v => v && /(^|\.)tree\.[^.]+$/.test(v.$class || ''));
  if (!m || !m.hostRoot || !m.hostRoot.userObject) return null;
  const u = m.hostRoot.userObject;
  return { root: nodeOf(m.hostRoot), parser: u.fParser && u.fParser.$class ? u.fParser.$class : null };
}

// A tree with actual content: a formula node with at least one formula.
function hasContent(t) {
  const has = n => n && ((!n.label && n.ants && n.ants.length > 0) || (n.children || []).some(has));
  return !!t && has(t.root);
}

// ---- JSON -> the legacy bean XML (a <object class="...TTreeTableModel"> element) ---------------------------
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const P = 'us.softoption.parser.';

function formulaXml(f, ids, indent) {
  const id = 'TFormulaT' + ids.n++;
  const set = (field, valueXml, pad) =>
    `${pad}<void class="${P}TFormula" method="getField">\n${pad} <string>${field}</string>\n` +
    `${pad} <void method="set">\n${pad}  <object idref="${id}"/>\n${valueXml}\n${pad} </void>\n${pad}</void>\n`;
  const p = indent + ' ';
  let out = `${indent}<object class="${P}TFormula" id="${id}">\n`;
  out += set('fKind', `${p}  <short>${f.k}</short>`, p);
  out += set('fInfo', `${p}  <string>${esc(f.i)}</string>`, p);
  if (f.l) out += set('fLLink', formulaXml(f.l, ids, p + '  '), p);
  if (f.r) out += set('fRLink', formulaXml(f.r, ids, p + '  '), p);
  return out + `${indent}</object>`;
}

// The statements that fill a data node's fields; `id` is that node's own object id (usable inside its body).
function dataFieldsXml(n, id, parserClass, ids, indent) {
  const i1 = indent + ' ', i2 = indent + '  ';
  const field = (name, valueXml) =>
    `${indent}<void class="us.softoption.interpretation.TTestNode" method="getField">\n${i1}<string>${name}</string>\n` +
    `${i1}<void method="set">\n${i2}<object idref="${id}"/>\n${valueXml}\n${i1}</void>\n${indent}</void>\n`;
  const list = (name, arr, itemXml) => arr && arr.length
    ? `${indent}<void class="us.softoption.interpretation.TTestNode" method="getField">\n${i1}<string>${name}</string>\n` +
      `${i1}<void method="get">\n${i2}<object idref="${id}"/>\n` +
      arr.map(x => `${i2}<void method="add">\n${itemXml(x)}\n${i2}</void>\n`).join('') + `${i1}</void>\n${indent}</void>\n`
    : '';
  const prop = (name, xml) => `${indent}<void property="${name}">\n${i1}${xml}\n${indent}</void>\n`;
  let out = field('fParser', `${i2}<object class="${parserClass}"/>`);
  if (n.closed) out += field('fClosed', `${i2}<boolean>true</boolean>`);
  if (n.dead) out += field('fDead', `${i2}<boolean>true</boolean>`);
  if (n.world) out += field('fWorld', `${i2}<string>${esc(n.world)}</string>`);
  out += list('fAntecedents', n.ants, f => formulaXml(f, ids, i2 + ' '));
  out += list('fSuccedent', n.succ, f => formulaXml(f, ids, i2 + ' '));
  out += list('fInstantiations', n.inst, x => typeof x === 'string' ? `${i2} <string>${esc(x)}</string>` : formulaXml(x, ids, i2 + ' '));
  if (n.first) out += prop('firstJustno', `<int>${n.first}</int>`);
  out += prop('justification', `<string>${esc(n.just)}</string>`);
  out += prop('lineno', `<int>${n.lineNo}</int>`);
  if (n.second) out += prop('secondJustno', `<int>${n.second}</int>`);
  return out;
}

// One DefaultMutableTreeNode holding `n`, with its children nested inside as .add(...) calls. The node's
// data object gets an id so its fields (and the back-reference `fTreeNode`) can refer to it.
function nodeXml(n, parserClass, ids, indent) {
  const i1 = indent + ' ', i2 = indent + '  ';
  const kids = (n.children || []).map(c => `${i1}<void method="add">\n${nodeXml(c, parserClass, ids, i2)}\n${i1}</void>\n`).join('');
  const dm = 'DefaultMutableTreeNodeT' + ids.n++;
  if (n.label !== undefined)
    return `${indent}<object class="javax.swing.tree.DefaultMutableTreeNode">\n${i1}<void property="userObject">\n${i2}<string>${esc(n.label)}</string>\n${i1}</void>\n${kids}${indent}</object>`;
  const td = 'TTreeDataNodeT' + ids.n++;
  const back = `${i2}<void class="us.softoption.interpretation.TTestNode" method="getField">\n${i2} <string>fTreeNode</string>\n${i2} <void method="set">\n${i2}  <object idref="${td}"/>\n${i2}  <object idref="${dm}"/>\n${i2} </void>\n${i2}</void>\n`;
  return `${indent}<object class="javax.swing.tree.DefaultMutableTreeNode" id="${dm}">\n${i1}<void property="userObject">\n` +
    `${i2}<object class="us.softoption.tree.TTreeDataNode" id="${td}">\n${back}${dataFieldsXml(n, td, parserClass, ids, i2 + ' ')}${i2}</object>\n${i1}</void>\n${kids}${indent}</object>`;
}

// `parserClass`: the logical system the nodes are drawn with (e.g. 'us.softoption.parser.TBergmannParser').
function toBeanXml(t, parserClass) {
  const ids = { n: 0 };
  // The model's own root is filled in rather than replaced (as the encoder writes it): hostRoot is the
  // existing root tree node, whose userObject is the existing root data node.
  const r = t.root, td = 'TTreeDataNodeT' + ids.n++, dm = 'DefaultMutableTreeNodeT' + ids.n++;
  const kids = (r.children || []).map(c => `   <void method="add">\n${nodeXml(c, parserClass, ids, '    ')}\n   </void>\n`).join('');
  const back = `    <void class="us.softoption.interpretation.TTestNode" method="getField">\n     <string>fTreeNode</string>\n     <void method="set">\n      <object idref="${td}"/>\n      <object idref="${dm}"/>\n     </void>\n    </void>\n`;
  return ` <object class="us.softoption.tree.TTreeTableModel">\n  <void id="${dm}" property="hostRoot">\n` +
    `   <void id="${td}" property="userObject">\n${back}${dataFieldsXml(r, td, parserClass, ids, '    ')}   </void>\n${kids}  </void>\n` +
    `  <void property="root">\n   <object idref="${td}"/>\n  </void>\n </object>`;
}

module.exports = { extract, hasContent, toBeanXml };
