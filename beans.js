// Minimal reader for java.beans.XMLEncoder output — just enough of the format to turn the
// objects in a legacy .lgc file into plain JS values (see lgc.js for the file layout).
//
// Vocabulary handled: <int>/<long>/<short>/<byte>/<float>/<double>/<boolean>/<char>/<string>/
// <null/>, <object class=... [id=...] [idref=...]>, <array class=... length=...> (with <void
// index=...> children), and <void property=NAME>/<void method="add"|"set"...>. Results:
//   object -> { $class: 'pkg.Name', <property>: value, ..., $items: [...] (if .add() was called) }
//   java.util.ArrayList etc. -> same shape (items in $items)
//   java.awt.Rectangle/Point/Color/Dimension (constructor args as children) -> { $class, $args: [...] }
// Anything else it doesn't model (e.g. the reflective <void class=... method="getField"> calls
// that a ProGuard-obfuscated build writes) is skipped rather than failing.

function unescapeXml(s) {
  return s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'").replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n)).replace(/&amp;/g, '&');
}

// XML text -> { tag, attrs, children, text } tree. Handles what XMLEncoder emits: prolog,
// attributes with double quotes, self-closing tags, text nodes, character/entity references.
function parseXml(xml) {
  const tokenRe = /<\?[\s\S]*?\?>|<!--[\s\S]*?-->|<(\/?)([A-Za-z][\w.:-]*)((?:\s+[\w.:-]+\s*=\s*"[^"]*")*)\s*(\/?)>|([^<]+)/g;
  const root = { tag: '#root', attrs: {}, children: [], text: '' };
  const stack = [root];
  let m;
  while ((m = tokenRe.exec(xml))) {
    if (m[5] !== undefined) { stack[stack.length - 1].text += m[5]; continue; }
    if (!m[2]) continue;                      // prolog or comment
    if (m[1]) { stack.pop(); continue; }      // closing tag
    const attrs = {};
    m[3].replace(/([\w.:-]+)\s*=\s*"([^"]*)"/g, (_, k, v) => { attrs[k] = unescapeXml(v); return ''; });
    const node = { tag: m[2], attrs, children: [], text: '' };
    stack[stack.length - 1].children.push(node);
    if (!m[4]) stack.push(node);
  }
  return root.children[0];
}


// XMLEncoder reuses equal values: instead of a literal, a number equal to another object's field is
// written as   <void class=C id=F method="getField"><string>FIELD</string>
//                <void id=V method="get"><object idref=OWNER/></void></void>
// (defining id V as OWNER.FIELD) and then referred to later by <object idref=V/>. Evaluating that
// expression only has the side effect of defining V; it is not itself a value argument.
const SKIP = { skip: true };
function evalArg(c, ids) {
  if (c.tag === 'void' && c.attrs.method === 'getField') {
    const field = c.children.find(x => x.tag === 'string');
    for (const g of c.children) {
      if (g.tag === 'void' && g.attrs.method === 'get' && g.attrs.id !== undefined && field) {
        const owner = evaluate(g.children[0], ids);
        ids[g.attrs.id] = owner ? owner[unescapeXml(field.text)] : undefined;
      }
    }
    return SKIP;
  }
  return evaluate(c, ids);
}

// Applies one <void ...> child to `obj`: a property set, .add(item), or — for files written by an
// obfuscated build, where bean fields were not accessible as properties — a reflective
//   <void class=C method="getField"><string>FIELD</string><void method="set"><object idref=ID/>VALUE</void></void>
// which sets FIELD directly on the object that ID refers to.
function applyVoid(obj, c, ids) {
  const a = c.attrs;
  if (a.property !== undefined) {
    if (a.id !== undefined && c.children.length && c.children.every(x => x.tag === 'void')) {
      // the getter's result (e.g. getBoundsRect()) is mutated in place rather than constructed
      const holder = { $class: null };
      // getBoundsRect() returns a Rectangle at the shape's current position, so other values
      // that XMLEncoder wrote as "this Rectangle's x/y" (see evalArg) resolve correctly.
      if (a.property === 'boundsRect') { holder.x = obj.XCoord || 0; holder.y = obj.YCoord || 0; }
      ids[a.id] = holder;
      for (const g of c.children) applyVoid(holder, g, ids);
      obj[a.property] = holder;
    } else if (a.id === undefined && c.children.length && c.children.every(x => x.tag === 'void' && x.attrs.method === 'add')) {
      // the getter's result is a list that is then filled with .add(item) calls (e.g. head/tail of a proof)
      const list = { $class: null };
      for (const g of c.children) applyVoid(list, g, ids);
      obj[a.property] = list;
    } else {
      obj[a.property] = c.children.length ? evaluate(c.children[0], ids) : undefined;
    }
  } else if (a.method === 'add') {
    (obj.$items = obj.$items || []).push(evaluate(c.children[0], ids));
  } else if (a.method === 'getField') {
    const field = c.children.find(x => x.tag === 'string');
    const setter = c.children.find(x => x.tag === 'void' && x.attrs.method === 'set');
    const getter = c.children.find(x => x.tag === 'void' && x.attrs.method === 'get');
    if (field && getter && !setter) {
      // "take FIELD of OWNER (a list), then call .add(...) on it": <void method="get"><object idref=OWNER/>
      //   <void method="add">X</void>...</void>
      const owner = evaluate(getter.children[0], ids);
      if (owner && typeof owner === 'object') {
        const name = unescapeXml(field.text);
        const list = owner[name] && typeof owner[name] === 'object' ? owner[name] : (owner[name] = { $class: 'java.util.ArrayList' });
        if (getter.attrs.id !== undefined) ids[getter.attrs.id] = list;
        for (const g of getter.children.slice(1)) if (g.tag === 'void') applyVoid(list, g, ids);
      }
    } else if (field && setter) {
      const args = setter.children.map(x => evalArg(x, ids)).filter(v => v !== SKIP);
      const target = args[0];
      if (args.length >= 2 && target && typeof target === 'object') target[unescapeXml(field.text)] = args[1];
    }
  } // other methods are not modelled
}

// Evaluates a parsed element into a JS value. `ids` maps id -> value for <object idref=...>.
function evaluate(node, ids) {
  const t = node.tag, a = node.attrs;
  const scalar = () => unescapeXml(node.text);
  switch (t) {
    case 'int': case 'long': case 'short': case 'byte': return parseInt(scalar(), 10);
    case 'float': case 'double': return parseFloat(scalar());
    case 'boolean': return scalar().trim() === 'true';
    case 'char': return scalar();
    case 'string': return scalar();
    case 'null': return null;
    case 'array': {
      const arr = new Array(parseInt(a.length || '0', 10)).fill(a.class === 'boolean' ? false : a.class === 'int' ? 0 : null);
      arr.$class = a.class + '[]';
      for (const c of node.children)
        if (c.tag === 'void' && c.attrs.index !== undefined)
          arr[parseInt(c.attrs.index, 10)] = evaluate(c.children[0], ids);
      return arr;
    }
    case 'object': case 'void': {
      if (a.idref !== undefined) return ids[a.idref];
      const obj = { $class: a.class || null };
      if (a.id !== undefined) ids[a.id] = obj;
      const args = [];
      for (const c of node.children) {
        if (c.tag === 'void') applyVoid(obj, c, ids);
        else args.push(evaluate(c, ids));      // constructor argument (Rectangle, Point, Color...)
      }
      if (args.length) obj.$args = args;
      return obj;
    }
    default: return undefined;
  }
}

// Parses a whole XMLDecoder document into the array of its top-level values, in order.
function readDocument(xml) {
  const root = parseXml(xml);
  if (!root || root.tag !== 'java') throw new Error('Not an XMLEncoder document');
  const ids = {};
  // Top-level <void ...> elements are statements the encoder emits after the objects they refer to
  // (typically reflective field sets on objects already written, e.g. tree nodes whose links form
  // cycles); apply them for their side effect, and return only the real top-level values.
  const values = [];
  for (const c of root.children) {
    if (c.tag === 'void') applyVoid({ $class: null }, c, ids);
    else values.push(evaluate(c, ids));
  }
  return values;
}

// Evaluates a single element's XML text (e.g. the ArrayList of shapes on its own).
function readFragment(xml) { return evaluate(parseXml(xml), {}); }

module.exports = { parseXml, evaluate, readDocument, readFragment };
