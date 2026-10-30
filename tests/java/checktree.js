// java -cp <Deriver jar> jdk.nashorn.tools.Shell checktree.js -- file.lgc
// Decodes a .lgc with the app's own classes and prints its truth tree (formula nodes and spacer labels).
var XMLDecoder = Java.type('java.beans.XMLDecoder');
var BIS = Java.type('java.io.BufferedInputStream'), FIS = Java.type('java.io.FileInputStream');
var Listener = Java.extend(Java.type('java.beans.ExceptionListener'), { exceptionThrown: function (e) { print('DECODE-EXCEPTION ' + e); } });
var d = new XMLDecoder(new BIS(new FIS(arguments[0])), null, new Listener());
function g(o, names) { for (var i = 0; i < names.length; i++) { try { return o.getClass().getMethod(names[i]).invoke(o); } catch (e) {} } return '?'; }
function walk(dm, depth) {
  var u = dm.getUserObject(), pad = '';
  for (var i = 0; i < depth; i++) pad += '  ';
  if (u instanceof Java.type('java.lang.String')) print(pad + '~' + u);
  else {
    var ants = [], list = u.fAntecedents;
    for (var k = 0; k < list.size(); k++) ants.push(u.fParser.writeFormulaToString(list.get(k)));
    print(pad + 'line ' + g(u, ['getLineno']) + ' [' + String(g(u, ['getJustification'])).trim() + ' ' + g(u, ['getFirstJustno']) + '] ' + (u.fDead ? 'DEAD ' : '') +
      ants.join(', ') + '   treeNodeLinked=' + (u.fTreeNode === dm));
  }
  for (var c = 0; c < dm.getChildCount(); c++) walk(dm.getChildAt(c), depth + 1);
}
var n = 0;
try {
  for (;;) {
    var o = d.readObject(); n++;
    if (o !== null && /TTreeTableModel/.test(o.getClass().getName())) { print('tree model:'); var r = o.getHostRoot(); if (r !== null) walk(r, 1); }
  }
} catch (e) { if (!/ArrayIndexOutOfBounds/.test(String(e))) print('STOPPED: ' + e); }
d.close();
print('DECODED ' + n + ' top-level objects');
