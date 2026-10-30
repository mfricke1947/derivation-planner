// Reads and writes the legacy Deriver ".lgc" file format: a plain java.beans.XMLEncoder
// bean-graph (see the old Java source, us.softoption.editor.TBrowser: saveFile()/
// openFileFromXMLDecoder()). saveFile() writes, in order, one object each of:
//   Integer fFileFormat, String journalHtml, ArrayList (Interpretations),
//   TProofTableModel (Proofs), TTreeTableModel (Trees), TDocState (panel layout).
// Phase 1 here only round-trips the Journal (the single top-level <string> element — it's
// the only one, so finding it by tag name is robust regardless of element order); everything
// else in the file is kept byte-for-byte as found, so opening and re-saving a file that has a
// saved proof/interpretation/tree in it does not lose that state, even though this app can't
// yet display it. A brand new file (no previous content to preserve) gets fresh, empty-but-valid
// placeholder objects in the same shape the real Java app writes, so it stays openable there too.

const FILE_FORMAT_VERSION = 3;   // matches TBrowser.fFileFormat as of the source this was read from

function xmlEscape(s) {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

function xmlUnescape(s) {
  return String(s)
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'").replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n))
    .replace(/&amp;/g, '&');   // must be last
}

// Finds the direct children of <java ...>...</java>, tracking nesting depth so we don't mistake
// a nested tag for a top-level one. Good enough for XMLEncoder's own output (no CDATA, no
// processing instructions inside the body); not a general XML parser.
function topLevelChildren(xml) {
  const bodyStart = xml.indexOf('>', xml.indexOf('<java')) + 1;
  const bodyEnd = xml.lastIndexOf('</java>');
  if (bodyStart <= 0 || bodyEnd < 0) throw new Error('Not a recognised .lgc file (no <java> root)');
  const body = xml.slice(bodyStart, bodyEnd);
  const tagRe = /<(\/?)([A-Za-z][\w.:-]*)\b[^>]*?(\/?)>/g;
  const children = [];
  let depth = 0, childStart = -1, childName = null, m;
  while ((m = tagRe.exec(body))) {
    const [full, closing, name, selfClose] = m;
    if (depth === 0 && !closing) { childStart = m.index; childName = name; }
    if (!closing && !selfClose) depth++;
    else if (closing) depth--;
    if (depth === 0 && childStart >= 0) {
      const end = m.index + full.length;
      children.push({ tag: childName, start: bodyStart + childStart, end: bodyStart + end });
      childStart = -1;
    }
  }
  return children;
}

// Reads a .lgc file's text. Returns { journalHtml, version }; throws if it doesn't look like one.
function read(xmlText) {
  const children = topLevelChildren(xmlText);
  const stringEl = children.find(c => c.tag === 'string');
  if (!stringEl) throw new Error('No Journal text found in this file');
  const inner = xmlText.slice(xmlText.indexOf('>', stringEl.start) + 1, xmlText.lastIndexOf('<', stringEl.end));
  const intEl = children.find(c => c.tag === 'int');
  const version = intEl ? parseInt(xmlText.slice(xmlText.indexOf('>', intEl.start) + 1, xmlText.lastIndexOf('<', intEl.end)), 10) : null;
  return { journalHtml: xmlUnescape(inner), version };
}

// Builds the text to save. If `originalXmlText` is given (we opened this file, or are re-saving
// over one that had it), everything but the Journal's own <string> element is kept byte-for-byte
// — so any Proofs/Trees state already in the file survives being re-saved from this app, even
// though this app doesn't (yet) read or edit that state itself. Otherwise builds a fresh, minimal,
// valid document with empty placeholders for those.
//
// `parts` (optional) replaces whole sections of the file: `parts.diagramXml` (see interp.toBeanXml) the
// Interpretations shape list, `parts.proofXml` (see proofstate.toBeanXml) the Proofs model, `parts.treeXml` (see treestate.toBeanXml) the tree. Pass a part only
// when it has actually changed, so an untouched one in an opened file is preserved byte-for-byte too.
// With no original text, a given part (or an empty placeholder) is used as-is. (A bare string is
// accepted as `diagramXml` for older callers.)
function write(journalHtml, originalXmlText, parts) {
  if (typeof parts === 'string') parts = { diagramXml: parts };
  parts = parts || {};
  const newString = '<string>' + xmlEscape(journalHtml) + '</string>';
  if (originalXmlText) {
    const children = topLevelChildren(originalXmlText);
    const stringEl = children.find(c => c.tag === 'string');
    if (stringEl) {
      // Sections are recognised by what they ARE, not by an exact class name: files written by the older
      // ProGuard-obfuscated builds (all 29 exercise files in the sample set) store the proof model as
      // `us.softoption.proofs.bG`, so the proof is "the top-level object in the proofs package" and the tree
      // "the one in the tree package". Matching on exact names would silently find nothing in those files.
      const openTag = c => (originalXmlText.slice(c.start, c.end).match(/^<object[^>]*>/) || [''])[0];
      const isList = c => c.tag === 'object' && /class="java\.util\.ArrayList"/.test(openTag(c));
      const isProof = c => c.tag === 'object' && /class="(?:us\.softoption\.)?(?:proofs|proofwindow)\.[^".]+"/.test(openTag(c));
      const isTree = c => c.tag === 'object' && /class="(?:us\.softoption\.)?tree\.[^".]+"/.test(openTag(c));
      const isDocState = c => c.tag === 'object' && /class="[^"]*\.TDocState"/.test(openTag(c));
      const listEl = children.find(isList), proofEl = children.find(isProof), treeEl = children.find(isTree);
      const docEl = children.find(isDocState);
      const endOfBody = originalXmlText.lastIndexOf('</java>');

      const edits = [{ start: stringEl.start, end: stringEl.end, text: newString }];
      // Replace a section in place; if the file has no such section, INSERT it where it belongs rather than
      // silently dropping it (a part that was asked for must end up in the file).
      const put = (el, insertAt, xml) => {
        const text = xml.replace(/^\s+/, '');
        if (el) edits.push({ start: el.start, end: el.end, text });
        else edits.push({ start: insertAt, end: insertAt, text: '\n ' + text + '\n' });
      };
      if (parts.diagramXml) put(listEl, stringEl.end, parts.diagramXml);
      if (parts.proofXml) put(proofEl, (treeEl || docEl || { start: endOfBody }).start, parts.proofXml);
      if (parts.treeXml) {
        put(treeEl, (docEl || { start: endOfBody }).start, parts.treeXml);
        // The encoder writes a saved tree's formula lists as trailing top-level statements that refer to the
        // old tree's nodes by id; with the tree replaced they would point at nothing, so drop them (the new
        // tree carries its formulas inline).
        if (treeEl) for (const c of children) if (c.tag === 'void' && c.start > treeEl.start) edits.push({ start: c.start, end: c.end, text: '' });
      }
      // splice from the end backwards so earlier offsets stay valid
      edits.sort((a, b) => b.start - a.start);
      let out = originalXmlText;
      for (const e of edits) out = out.slice(0, e.start) + e.text + out.slice(e.end);
      return out;
    }
    // Malformed/unexpected shape (no Journal string at all) — fall through to a fresh document.
  }
  return (
`<?xml version="1.0" encoding="UTF-8"?>
<java version="1.8.0" class="java.beans.XMLDecoder">
 <int>${FILE_FORMAT_VERSION}</int>
 ${newString}
${parts.diagramXml || ' <object class="java.util.ArrayList"/>'}
${parts.proofXml || ' <object class="us.softoption.proofs.TProofTableModel"/>'}
${parts.treeXml || ' <object class="us.softoption.tree.TTreeTableModel"/>'}
 <object class="us.softoption.editor.TDocState"/>
</java>
`);
}

module.exports = { read, write, FILE_FORMAT_VERSION };
