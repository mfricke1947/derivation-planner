// Converts between the legacy Swing "shape list" stored in a .lgc file (see lgc.js; decoded by
// beans.js) and a neutral JSON diagram that shell.html turns into / reads from the svg-edit
// Interpretations widget:
//
//   { individuals: [{ name, x, y }],                      // x,y = centre ("hot spot") of the circle
//     properties:  [{ name, x, y, width, height, color:[r,g,b] }],   // x,y = top-left
//     arrows:      [{ kind:'relation'|'function'|'identity', name, from:'a', to:'b' }],   // individual names
//     skipped: <number of shapes that could not be interpreted> }
//
// Swing geometry (TIndividual: fixed 14x14 box at top-left XCoord/YCoord, so its hot spot is
// (X+7, Y+7); TProperty/TBox: rectangle X,Y,width,height; TRelation/TFunction/TIdentity: an arrow
// between two Points, self-relations when the ends are closer than kCircleRadius). The
// TInterpretationBoard shape is ignored: the widget regenerates the board itself from the shapes.

const HOT = 7;             // half of TIndividual's 14x14 box
const NEAREST_MAX = 25;    // how far an arrow end may be from an individual's centre to attach to it

const base = c => (c || '').split('.').pop();

// The shape's one-letter name is stored under a different key depending on which build wrote the
// file: `name` (2004-era bean property), `n` (2015 ProGuard-obfuscated build, field written by
// reflection), `fName` (2020 unobfuscated build, public field written by reflection).
function nameOf(s) {
  for (const k of ['name', 'fName', 'n']) if (typeof s[k] === 'string' && s[k].length === 1) return s[k];
  return null;
}

function point(p) {
  if (!p) return { x: 0, y: 0 };
  if (p.$args) return { x: p.$args[0], y: p.$args[1] };
  return { x: p.x || 0, y: p.y || 0 };     // fields set by reflection; omitted when 0
}

function rectOf(s) {
  const r = s.boundsRect || {};
  if (r.$args && r.$args.length === 4) return { x: r.$args[0], y: r.$args[1], width: r.$args[2], height: r.$args[3] };
  return { x: s.XCoord || 0, y: s.YCoord || 0, width: r.width || 0, height: r.height || 0 };
}

function colorOf(s) {
  const c = s.color && s.color.$args;
  return c ? [c[0], c[1], c[2]] : [0, 0, 255];    // TShape's default is Color.blue
}

const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

// `values` is the array of top-level values from beans.readDocument(). Returns the diagram.
function extract(values) {
  const list = (values || []).find(v => v && /ArrayList$/.test(v.$class || '') &&
    (v.$items || []).some(s => /interpretation\.T/.test(s.$class || '')));
  const out = { individuals: [], properties: [], arrows: [], skipped: 0 };
  if (!list) return out;

  const raw = { arrows: [] };
  for (const s of list.$items || []) {
    const kind = base(s.$class), name = nameOf(s);
    if (kind === 'TInterpretationBoard') continue;
    if (!name) { out.skipped++; continue; }
    if (kind === 'TIndividual') {
      out.individuals.push({ name, x: (s.XCoord || 0) + HOT, y: (s.YCoord || 0) + HOT });
    } else if (kind === 'TProperty') {
      const r = rectOf(s);
      out.properties.push({ name, x: r.x, y: r.y, width: r.width, height: r.height, color: colorOf(s) });
    } else if (kind === 'TRelation' || kind === 'TFunction' || kind === 'TIdentity') {
      raw.arrows.push({ kind: kind.slice(1).toLowerCase(), name, from: point(s.from), to: point(s.to) });
    } else out.skipped++;
  }

  // An arrow's ends are free points in Swing; the widget attaches arrows to named individuals.
  // Snap each end to the nearest individual (within NEAREST_MAX), by that individual's name.
  const nearest = p => {
    let best = null, bd = NEAREST_MAX;
    for (const i of out.individuals) { const d = dist(p, i); if (d <= bd) { bd = d; best = i; } }
    return best;
  };
  for (const a of raw.arrows) {
    const f = nearest(a.from), t = nearest(a.to);
    if (!f || !t) { out.skipped++; continue; }
    out.arrows.push({ kind: a.kind, name: a.name, from: f.name, to: t.name });
  }
  return out;
}

const isEmpty = d => !d.individuals.length && !d.properties.length && !d.arrows.length;

// ---- the other direction: neutral diagram -> the legacy bean XML (the <object class=
// "java.util.ArrayList"> element that goes third in a .lgc file) ------------------------------
// Uses only plain bean properties (setXCoord, setBoundsRect, setFrom, ... exactly as the 2004-era
// files did), with the current package name, so java.beans.XMLDecoder in the real app rebuilds
// the shapes through their public setters. The board shape is always included, as the Swing app
// itself always writes one.
const PKG = 'us.softoption.interpretation.';
const num = n => `<int>${Math.round(n)}</int>`;
const rectXml = (x, y, w, h) => `<object class="java.awt.Rectangle">${num(x)}${num(y)}${num(w)}${num(h)}</object>`;
const pointXml = p => `<object class="java.awt.Point">${num(p.x)}${num(p.y)}</object>`;
const prop = (name, inner) => `<void property="${name}">${inner}</void>`;
const shape = (cls, props) => `  <void method="add">\n   <object class="${PKG}${cls}">\n${props.map(p => '    ' + p + '\n').join('')}   </object>\n  </void>\n`;
const charXml = c => `<char>${c}</char>`;
const falseXml = '<boolean>false</boolean>';

function toBeanXml(d) {
  const spot = {};
  d.individuals.forEach(i => { spot[i.name] = { x: i.x, y: i.y }; });
  let out = '';
  for (const p of d.properties)
    out += shape('TProperty', [
      prop('XCoord', num(p.x)), prop('YCoord', num(p.y)), prop('boundsRect', rectXml(p.x, p.y, p.width, p.height)),
      prop('color', `<object class="java.awt.Color">${num(p.color[0])}${num(p.color[1])}${num(p.color[2])}${num(255)}</object>`),
      prop('name', charXml(p.name)), prop('selected', falseXml)]);
  for (const i of d.individuals)
    out += shape('TIndividual', [
      prop('XCoord', num(i.x - HOT)), prop('YCoord', num(i.y - HOT)), prop('name', charXml(i.name)), prop('selected', falseXml)]);
  out += shape('TInterpretationBoard', [
    prop('boundsRect', rectXml(5, 0, 150, 50)), prop('semantics', `<object class="${PKG}TSemantics"/>`)]);
  for (const a of d.arrows) {
    const f = spot[a.from], t = spot[a.to];
    if (!f || !t) continue;
    const cls = a.kind === 'function' ? 'TFunction' : a.kind === 'identity' ? 'TIdentity' : 'TRelation';
    out += shape(cls, [
      prop('XCoord', num(Math.min(f.x, t.x))), prop('YCoord', num(Math.min(f.y, t.y))),
      prop('boundsRect', rectXml(Math.min(f.x, t.x), Math.min(f.y, t.y), Math.abs(t.x - f.x), Math.abs(t.y - f.y))),
      prop('from', pointXml(f)), prop('name', charXml(a.name)), prop('selected', falseXml), prop('to', pointXml(t))]);
  }
  return ` <object class="java.util.ArrayList">\n${out} </object>`;
}

module.exports = { extract, isEmpty, nameOf, toBeanXml };
