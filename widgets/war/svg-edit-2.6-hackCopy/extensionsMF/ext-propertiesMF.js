
var propertiesMF=propertiesMF||{};



propertiesMF.gPredicates="ABCDEFGHIJKLMNOPQRSTUVWXYZ";
       
propertiesMF.makeProperty=function (name,x,y){
    
  var style=svgCanvas.getStyle();
// 100 x 100 rect by default
  var property = '<g id="svg_'+name+'g"><rect width="100" height="100" id="svg_'+name+'" y="'+y+'" x="'+x+'" '+
          'fill="'+style.fill+'" '+
          'fill-opacity="'+style.fill_opacity+'" '+
          'opacity="'+style.opacity+'" '+
          'stroke="'+style.stroke+'" '+
          'stroke-opacity="'+style.stroke_opacity+'" '+
          'stroke-width="'+style.stroke_width+'" />'+
                    '<text xml:space="preserve" text-anchor="middle" font-family="serif" font-size="18" '+
                    'id="svg_'+name+'t" y="'+(y+100)+'" x="'+(x+50)+'"    '+
                    ' fill="#000000">'+name+'</text>'+
                    '</g>';
  
    //fill-opacity="0.5" 
  return property;   
}; 

/*

function namesInSvg(){
    var currentSvg= svgCanvas.getSvgString();
   
  return namesInSvgString(currentSvg);  
}

function namesInSvgString(svgString){
    var namesArray= svgString.match(/(svg_)[a-v]\"/g);
    var names="";
    
    if (namesArray!==null){
        for (i=0;i<namesArray.length;i++)
            names+=namesArray[i].charAt(4);     
    };
   
  return names;  
}

function updateSvgIBoard(){   //outsde editing eg delete has changed the Interpreation Board
     augmentSvg("");    

     }


var serverImagePath = "";



        
   */     
 
 
// mf 2026-09: drag-to-place with a live-editable palette name, replacing the old
// blocking prompt() on mouseUp. Mirrors the same change made to ext-individualsMF.js,
// EXCEPT: unlike individuals, properties do not have to be unique - a User may
// legitimately place two rectangles both named 'F'. So there is no "next free name"
// here; the field just starts on a default and is otherwise entirely the User's choice,
// including reusing the same letter for the next rectangle.

propertiesMF.fCurrentName = null;   // the letter that will be used for the NEXT property placed
propertiesMF.fDraggingId = null;    // svg_<name> id of the property currently being dragged, or null
propertiesMF.fDraggingRect = null;  // direct DOM refs for the rect/label currently being dragged
propertiesMF.fDraggingLabel = null;

propertiesMF.refreshCurrentName = function() {
	// Only set a default the first time; otherwise leave whatever the User last chose,
	// since re-using the same name for another property is entirely legitimate.
	if (!propertiesMF.fCurrentName) propertiesMF.fCurrentName = propertiesMF.gPredicates.charAt(0);
	var field = document.getElementById('properties_name');
	if (field) field.value = propertiesMF.fCurrentName;
};

propertiesMF.onNameFieldChange = function() {
	var field = document.getElementById('properties_name');
	var typed = field.value.trim().charAt(0).toUpperCase();
	if (typed && propertiesMF.gPredicates.indexOf(typed) > -1) {
		propertiesMF.fCurrentName = typed;
		field.value = typed;
	} else {
		field.value = propertiesMF.fCurrentName || '';
	}
};

propertiesMF.showPanel = function(show) {
	var panel = document.getElementById('properties_panel');
	if (panel) panel.style.display = show ? 'inline' : 'none';
};

// Because two properties can legitimately share the same name (eg two disjoint
// regions both labelled F), their svg_<name>g/svg_<name>/svg_<name>t ids can collide -
// this is already relied on by TSemanticsSvg.java's rectAndRemainder()/updateProperties(),
// which walks the raw SVG text rectangle-by-rectangle rather than using getElementById, so
// it sees every rect regardless of duplicate ids. getElem()/getElementById only ever returns
// one match for a given id, and not reliably the one just created, so drag-tracking here
// must not rely on it. This finds the most recently added element with a given id instead
// (new content is always appended at the end by augmentSvg(), so it's the last DOM match).
propertiesMF.lastElemWithId = function(id) {
	var matches = document.querySelectorAll('[id="' + id + '"]');
	return matches.length ? matches[matches.length - 1] : null;
};

svgEditor.addExtension("Properties", function() {

		return {
			name: "Properties",
			// For more notes on how to make an icon file, see the source of
			// the hellorworld-icon.xml
			svgicons: "extensionsMF/properties-icon.xml",

			// A live-editable name field in the top toolbar, shown only while the
			// Properties tool is the active mode.
			context_tools: [{
				type: 'input',
				panel: 'properties_panel',
				id: 'properties_name',
				label: 'Name',
				size: 2,
				events: {
					// mf 2026-09-29: 'input' (not 'change') so the typed letter takes effect
					// immediately, without needing Enter/blur first - see the identical,
					// more fully-explained change in ext-individualsMF.js.
					'input': propertiesMF.onNameFieldChange,
					'blur': propertiesMF.onNameFieldChange
				}
			}],

			// Multiple buttons can be added in this array
			buttons: [{
				// Must match the icon ID in helloworld-icon.xml
				id: "properties",

				// This indicates that the button will be added to the "mode"
				// button panel on the left side
				type: "mode",

				// Tooltip text
				title: "Properties",

				// Events
				events: {
					'click': function() {
						// The action taken when the button is clicked on.
						// For "mode" buttons, any other button will
						// automatically be de-pressed.
						svgCanvas.setMode("property");
						propertiesMF.refreshCurrentName();
						propertiesMF.showPanel(true);
					}
				}
			}],

			// Runs once, after our buttons/context_tools have been built into the DOM.
			callback: function() {
				propertiesMF.showPanel(false);
				$(document).on('click', '.tool_button, .tool_button_current', function() {
					if (this.id !== 'properties') propertiesMF.showPanel(false);
				});

				// mf 2026-09-29: cap the field at one character and select-on-focus, so typing
				// over an existing letter replaces it instead of appending - see the identical,
				// more fully-explained change in ext-individualsMF.js.
				var field = document.getElementById('properties_name');
				if (field) {
					field.setAttribute('maxlength', '1');
					field.addEventListener('focus', function() { field.select(); });
				}
			},

			// This is triggered when the main mouse button is pressed down on the
			// editor canvas. Creates the property rect immediately at the click
			// point (its top-left corner, matching makeProperty's own x,y meaning)
			// and arms the drag; mouseMove follows the pointer, mouseUp finalizes.
			mouseDown: function(opts) {
				if(svgCanvas.getMode() == "property") {
					var zoom = svgCanvas.getZoom();
					var x = opts.start_x / zoom;
					var y = opts.start_y / zoom;

					var name = propertiesMF.fCurrentName;
					var id = 'svg_' + name;
					augmentSvg(propertiesMF.makeProperty(name, x, y));

					// Grab direct references to the nodes just created (not just the id -
					// see lastElemWithId's comment above on why a plain id lookup isn't safe
					// once duplicate-named properties exist) for mouseMove to reposition.
					propertiesMF.fDraggingId = id;
					propertiesMF.fDraggingRect = propertiesMF.lastElemWithId(id);
					propertiesMF.fDraggingLabel = propertiesMF.lastElemWithId(id + 't');

					// The returned object must include "started" with
					// a value of true in order for mouseMove/mouseUp to be triggered
					return {started: true};
				}
			},

			// Runs on every pointer move while armed; repositions the DOM nodes
			// directly (cheap) rather than re-running augmentSvg() per frame.
			mouseMove: function(opts) {
				if(svgCanvas.getMode() == "property" && propertiesMF.fDraggingRect) {
					var zoom = svgCanvas.getZoom();
					var x = opts.mouse_x / zoom;
					var y = opts.mouse_y / zoom;

					propertiesMF.fDraggingRect.setAttribute('x', x);
					propertiesMF.fDraggingRect.setAttribute('y', y);
					if (propertiesMF.fDraggingLabel) {
						// matches makeProperty()'s own label placement: centered under the rect
						propertiesMF.fDraggingLabel.setAttribute('x', x + 50);
						propertiesMF.fDraggingLabel.setAttribute('y', y + 100);
					}
				}
			},

			// This is triggered from anywhere, but "started" must have been set
			// to true (see above). Note that "opts" is an object with event info
			mouseUp: function(opts) {
				if(svgCanvas.getMode() == "property" && propertiesMF.fDraggingRect) {
					// Positions are already correct in the live DOM (set during mouseMove);
					// one augmentSvg() call here re-derives the Interpretation Board text
					// from the now-final canvas, same as updateSvgIBoard() does elsewhere.
					// This rebuilds the DOM, so fDraggingRect/fDraggingLabel become stale -
					// re-find the placed shape by id (last match) to select it.
					augmentSvg("");

					// Select the enclosing <g>, not the bare <rect>: this is what
					// svg-edit's own getMouseTarget() always climbs to for a normal click
					// (svgcanvas.js's mouse_target.parentNode-walk stops at the group), and
					// its group resize applies one transform to rect+label together, so they
					// can never drift apart - selecting the bare rect instead (as this used
					// to) let a resize-handle drag change only the rect's own x/y/width/height,
					// leaving the label exactly where it started.
					var placed = propertiesMF.lastElemWithId(propertiesMF.fDraggingId + 'g');
					if (placed) svgCanvas.addToSelection([placed], true);

					propertiesMF.fDraggingId = null;
					propertiesMF.fDraggingRect = null;
					propertiesMF.fDraggingLabel = null;

					// mf 2026-09-28: revert to the Select tool after each placement - see the
					// identical, more fully-explained change in ext-individualsMF.js's mouseUp.
					$('#tool_select').click();
				}
			}
		};
});


