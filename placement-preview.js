// Injected into svgEditorMF.html by main.js (Electron app only; war/ is untouched).
//  - "individual" tool: translucent circle follows the pointer (centred, r=11), as the
//    extension places the individual at the mouse-up point.
//  - "property" tool: mouse-down fixes one corner, dragging stretches a preview rectangle,
//    and on mouse-up the property rectangle is created with that corner and size (the
//    extension itself always makes a 100x100 rectangle at the release point).
(function () {
  var ghost = document.createElement('div');
  ghost.style.cssText = 'position:fixed;pointer-events:none;display:none;z-index:99999;' +
    'box-sizing:border-box;border:2px solid #36c;background:rgba(51,102,204,0.15)';
  document.body.appendChild(ghost);

  var MIN_DRAG = 5;      // client px; smaller drags count as a click (default 100x100)
  var start = null;      // client coords of mouse-down in property mode
  var drag = null;       // {dx, dy} in client px, captured at mouse-up for makeProperty

  function mode() { return window.svgCanvas && svgCanvas.getMode && svgCanvas.getMode(); }
  function hide() { ghost.style.display = 'none'; }
  function inRoot(e) {
    var root = document.getElementById('svgroot');
    if (!root) return false;
    var r = root.getBoundingClientRect();
    return e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
  }
  function box(left, top, w, h, round) {
    var s = ghost.style;
    s.left = left + 'px'; s.top = top + 'px'; s.width = w + 'px'; s.height = h + 'px';
    s.borderRadius = round ? '50%' : '0'; s.display = 'block';
  }

  document.addEventListener('mousedown', function (e) {
    drag = null;
    if (mode() === 'property' && e.button === 0 && inRoot(e)) start = { x: e.clientX, y: e.clientY };
    else { start = null; hide(); }
  }, true);

  document.addEventListener('mousemove', function (e) {
    var m = mode(), z = (window.svgCanvas && svgCanvas.getZoom()) || 1;
    if (m === 'property' && start) {
      box(Math.min(start.x, e.clientX), Math.min(start.y, e.clientY),
          Math.abs(e.clientX - start.x), Math.abs(e.clientY - start.y), false);
    } else if (m === 'individual' && inRoot(e)) {
      var d = 22 * z;
      box(e.clientX - d / 2, e.clientY - d / 2, d, d, true);
    } else if (m === 'property' && inRoot(e) && !e.buttons) {
      box(e.clientX, e.clientY, 100 * z, 100 * z, false);   // hover: default size
    } else hide();
  }, true);

  // Runs before svg-edit's own mouse-up handling, which triggers the name prompt.
  document.addEventListener('mouseup', function (e) {
    if (start) {
      var dx = e.clientX - start.x, dy = e.clientY - start.y;
      drag = (Math.abs(dx) >= MIN_DRAG || Math.abs(dy) >= MIN_DRAG) ? { dx: dx, dy: dy } : null;
    }
    start = null; hide();
  }, true);

  document.addEventListener('mouseleave', hide);

  // Wrap makeProperty lazily (the extension may load after this script runs).
  function wrap() {
    if (!window.propertiesMF || !propertiesMF.makeProperty || propertiesMF.makeProperty.wrapped) return;
    var orig = propertiesMF.makeProperty;
    propertiesMF.makeProperty = function (name, x, y) {
      var d = drag; drag = null;
      if (!d) return orig(name, x, y);
      var z = svgCanvas.getZoom() || 1;
      var w = Math.abs(d.dx) / z, h = Math.abs(d.dy) / z;
      // (x, y) is the release point in svg units; the mouse-down corner is offset by the drag.
      var x0 = d.dx >= 0 ? x - w : x, y0 = d.dy >= 0 ? y - h : y;
      var s = orig(name, x0, y0), i = s.indexOf('<text');
      var rect = s.slice(0, i).replace('width="100" height="100"', 'width="' + w + '" height="' + h + '"');
      var text = s.slice(i)
        .replace('y="' + (y0 + 100) + '"', 'y="' + (y0 + h) + '"')
        .replace('x="' + (x0 + 50) + '"', 'x="' + (x0 + w / 2) + '"');
      return rect + text;
    };
    propertiesMF.makeProperty.wrapped = true;
  }
  document.addEventListener('mouseup', wrap, true);
  wrap();
})();
