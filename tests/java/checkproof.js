// java -cp <Deriver jar> jdk.nashorn.tools.Shell checkproof.js -- file.lgc
// Decodes a .lgc with the app's own classes (java.beans.XMLDecoder) and prints proof lines.
var XMLDecoder = Java.type('java.beans.XMLDecoder');
var BIS = Java.type('java.io.BufferedInputStream'), FIS = Java.type('java.io.FileInputStream');
var Listener = Java.extend(Java.type('java.beans.ExceptionListener'), { exceptionThrown: function (e) { print('DECODE-EXCEPTION ' + e); } });
var d = new XMLDecoder(new BIS(new FIS(arguments[0])), null, new Listener());
function g(o, names) { for (var i = 0; i < names.length; i++) { try { return o.getClass().getMethod(names[i]).invoke(o); } catch (e) {} } return '?'; }
function line(l) {
  var p = l.getParser(), f = l.getFormula();
  var text = f === null ? '(none)' : (p !== null ? p.writeFormulaToString(f) : 'noparser:' + f.fInfo);
  return '  ' + l.getLineNo() + '. ' + text + '   [' + l.getJustification() + ']' +
    ' cites ' + l.getFirstjustno() + ',' + l.getSecondjustno() + ' sub=' + l.getSubprooflevel() +
    (g(l, ['isLastAssumption','getLastAssumption','isLastassumption','getLastassumption']) == true ? ' lastAss' : '') + (g(l, ['isBlankline','getBlankline','isBlankLine','getBlankLine']) == true ? ' blank' : '') + ' parser=' + (p === null ? null : p.getClass().getSimpleName());
}
var n = 0;
try {
  for (;;) {
    var o = d.readObject(); n++;
    if (o !== null && /TProof(Table|List)Model/.test(o.getClass().getName())) {
      print('proof model ' + o.getClass().getSimpleName());
      print(' head:'); var h = o.getHead(); for (var i = 0; i < h.size(); i++) print(line(h.get(i)));
      print(' tail:'); var t = o.getTail(); for (var j = 0; j < t.size(); j++) print(line(t.get(j)));
    } else print('obj ' + n + ' ' + (o === null ? 'null' : o.getClass().getSimpleName()));
  }
} catch (e) { if (!/ArrayIndexOutOfBounds/.test(String(e))) print('STOPPED: ' + e); }
d.close();
print('DECODED ' + n + ' top-level objects');
