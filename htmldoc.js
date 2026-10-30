// Plain HTML documents as exercise files (alongside the legacy .lgc format): what to take from a web page when one is opened
// into the Journal, and how to write the Journal back out as a page.
//   - looksLikeLgc(text): the legacy file is a java.beans XML document (<java ...>); anything else is treated as HTML.
//   - bodyOf(raw): only the <body> content; scripts, javascript: links and inline event handlers are dropped (the Journal is an
//     editable document, not a browser), so a saved web page cannot run code inside the app. Styles and iframes are kept as they are.
//   - titleOf(raw): the page's <title>, if any.
//   - wrap(journalHtml, originalRaw, title): the page to save. If the document was opened from an HTML page, that page's own
//     <head> and <body> tag are kept and only the body content is replaced; otherwise a minimal complete page is made.

const looksLikeLgc = text => /^﻿?\s*(<\?xml[^>]*\?>\s*)?(<!--[\s\S]*?-->\s*)*<java\b/i.test(text);

function clean(html) {
  return html
    .replace(/<script\b[\s\S]*?<\/script\s*>/gi, '')
    .replace(/\s+on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/\b(href|src)\s*=\s*("\s*javascript:[^"]*"|'\s*javascript:[^']*')/gi, '$1="#"');
}

function bodyOf(raw) {
  const m = /<body\b[^>]*>([\s\S]*?)<\/body\s*>/i.exec(raw);
  let body;
  if (m) body = m[1];
  else {
    const open = /<body\b[^>]*>/i.exec(raw);                      // a body that is never closed
    body = open ? raw.slice(open.index + open[0].length) : raw
      .replace(/<!doctype[^>]*>/gi, '').replace(/<head\b[\s\S]*?<\/head\s*>/gi, '').replace(/<\/?html\b[^>]*>/gi, '');
  }
  return clean(body).trim();
}

// The notation an exercise page was written for, if it says (<meta name="deriver-parser" content="barwise">; see tools/pages-to-journal.js).
const parserOf = raw => { const m = /<meta\s+name=["']deriver-parser["']\s+content=["']([^"']*)["']/i.exec(raw); return m ? m[1].trim() : ''; };

const titleOf = raw => { const m = /<title\b[^>]*>([\s\S]*?)<\/title\s*>/i.exec(raw); return m ? m[1].replace(/\s+/g, ' ').trim() : ''; };

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function wrap(journalHtml, originalRaw, title) {
  if (originalRaw && /<body\b[^>]*>/i.test(originalRaw) && /<\/body\s*>/i.test(originalRaw))
    return originalRaw.replace(/(<body\b[^>]*>)[\s\S]*?(<\/body\s*>)/i, (all, a, b) => a + '\n' + journalHtml + '\n' + b);
  return '<!DOCTYPE html>\n<html>\n<head>\n<meta charset="utf-8">\n<title>' + esc(title || 'Exercises') + '</title>\n</head>\n<body>\n' +
    journalHtml + '\n</body>\n</html>\n';
}

// The page that is printed (or exported to PDF) for a Journal: a plain, readable document made from the Journal's HTML, not a copy of the
// window (which would carry the tabs, toolbars and a box that cuts the text off). `name` = the document's name, shown small at the top.
// Scripts are stripped and the page also carries a no-scripts policy: a Journal can hold HTML from anywhere (a file, a web page).
function printPage(journalHtml, name) {
  return '<!DOCTYPE html>\n<html><head><meta charset="utf-8">\n' +
    '<meta http-equiv="Content-Security-Policy" content="script-src \'none\'; object-src \'none\'">\n<title>' + esc(name || 'Journal') + '</title>\n<style>\n' +
    '@page { margin: 2cm; }\n' +
    'body { font: 12pt/1.4 Times, "Times New Roman", serif; color: #000; background: #fff; margin: 0; }\n' +
    '.docname { font: 9pt Arial, Helvetica, sans-serif; color: #666; border-bottom: 1px solid #ccc; padding-bottom: 4px; margin-bottom: 14px; }\n' +
    'h1, h2, h3 { font-family: Arial, Helvetica, sans-serif; page-break-after: avoid; }\n' +
    'img, svg { max-width: 100%; height: auto; }\n' +
    'table { border-collapse: collapse; } td, th { vertical-align: top; }\n' +
    'p, li, tr, img { page-break-inside: avoid; }\n' +
    '</style></head><body>\n<div class="docname">' + esc(name || '') + '</div>\n' + clean(journalHtml) + '\n</body></html>\n';
}

module.exports = { looksLikeLgc, bodyOf, titleOf, parserOf, wrap, printPage };
